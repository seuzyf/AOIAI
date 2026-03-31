import os
import sys
import yaml
import json
import threading
import webbrowser
import time
import torch
from flask import Flask, jsonify, request
from ultralytics import YOLO

# ==========================================
# 核心修复 1：防止 PyInstaller 无控制台模式下，tqdm 进度条因 sys.stdout 为 None 导致崩溃
# ==========================================
class DummyStream:
    def write(self, data): pass
    def flush(self): pass
    def isatty(self): return False

if sys.stdout is None:
    sys.stdout = DummyStream()
if sys.stderr is None:
    sys.stderr = DummyStream()

# ==========================================
# 核心修复 2：兼容 PyInstaller 打包的 EXE 路径机制
# ==========================================
if getattr(sys, 'frozen', False):
    BASE_DIR = os.path.dirname(sys.executable)
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

os.chdir(BASE_DIR)

ARGS_PATH = os.path.join(BASE_DIR, "args.yaml")
RUNS_LAST_PT = os.path.join(BASE_DIR, "runs", "detect", "train", "weights", "last.pt")

app = Flask(__name__)

# ==========================================
# 1. 全局状态与核心变量
# ==========================================
STATE = {
    "status": "idle",  
    "message": "就绪，等待指令...",
    "progress": 0.0,
    "current_epoch": 0,
    "total_epochs": 0,
    "config": {},
    "epochs_data": [], 
    "logs": []         
}

stop_requested = False
training_thread = None

def log_msg(msg):
    """追加日志到内存"""
    print(msg)
    time_str = time.strftime("%H:%M:%S", time.localtime())
    STATE["logs"].append(f"[{time_str}] {msg}")
    if len(STATE["logs"]) > 100:
        STATE["logs"].pop(0)

# ==========================================
# 2. 训练核心逻辑
# ==========================================
def run_yolo(resume=False, device_choice=None):
    global stop_requested
    stop_requested = False
    STATE["status"] = "training"
    STATE["message"] = "正在初始化计算图与工作空间..."
    STATE["progress"] = 0.0
    STATE["epochs_data"] = []
    
    log_msg(f"=== AOI 引擎 {'断点续训' if resume else '全新训练'}启动 ===")

    try:
        args = {}
        if os.path.exists(ARGS_PATH):
            with open(ARGS_PATH, "r", encoding="utf-8") as f:
                args = yaml.safe_load(f) or {}
            log_msg(f"已成功加载配置文件: {ARGS_PATH}")
        else:
            log_msg(f"⚠️ 警告: 找不到配置文件 {ARGS_PATH}")
            log_msg("⚠️ 请检查文件是否和 EXE 放在同一个文件夹，且没有被隐藏扩展名")
            log_msg("正在使用系统默认内置参数启动...")
            args = {"model": "yolo11n.pt", "epochs": 100, "data": "dataset.yaml"}
        
        model_weight = RUNS_LAST_PT if resume else args.get("model", "yolo11n.pt")
        
        if resume and not os.path.exists(model_weight):
            raise FileNotFoundError(f"找不到断点文件 {model_weight}！请确认之前是否有成功运行过。")

        log_msg(f"加载模型权重: {model_weight}")
        
        os.chdir(BASE_DIR)
        model = YOLO(model_weight)

        def on_train_epoch_end(trainer):
            current = trainer.epoch + 1
            total = trainer.epochs
            STATE["current_epoch"] = current
            STATE["total_epochs"] = total
            STATE["progress"] = (current / total) * 100
            STATE["message"] = f"训练中... (Epoch {current}/{total})"

            metrics = trainer.metrics
            def get_metric(keys):
                for k in keys:
                    if k in metrics: return float(metrics[k])
                return 0.0

            gpu_mem = f"{torch.cuda.memory_reserved() / 1E9:.2f}G" if torch.cuda.is_available() else "0G"
            img_size = trainer.args.imgsz if hasattr(trainer, 'args') else args.get('imgsz', 640)

            epoch_info = {
                "epoch": current,
                "gpu_mem": gpu_mem,
                "box_loss": get_metric(['train/box_loss', 'loss/box']),
                "cls_loss": get_metric(['train/cls_loss', 'loss/cls']),
                "dfl_loss": get_metric(['train/dfl_loss', 'loss/dfl']),
                "size": img_size,
                "map50": get_metric(['metrics/mAP50(B)', 'mAP50', 'metrics/mAP_0.5']),
                "map50_95": get_metric(['metrics/mAP50-95(B)', 'mAP50-95', 'metrics/mAP_0.5:0.95'])
            }
            STATE["epochs_data"].append(epoch_info)
            log_msg(f"Epoch {current} 完成 | Box: {epoch_info['box_loss']:.3f} | mAP@50: {epoch_info['map50']:.4f}")

            if stop_requested:
                log_msg("接收到终止指令，正在执行安全保存退出...")
                trainer.stop = True

        model.add_callback("on_train_epoch_end", on_train_epoch_end)

        valid_args = {k: v for k, v in args.items() if k not in ['task']}
        if resume: valid_args['resume'] = True
        
        data_path = valid_args.get("data", "dataset.yaml")
        abs_data_path = os.path.join(BASE_DIR, data_path) if not os.path.isabs(data_path) else data_path
        
        if os.path.exists(abs_data_path):
            try:
                with open(abs_data_path, "r", encoding="utf-8") as df:
                    ds_config = yaml.safe_load(df)
                
                if os.path.exists(os.path.join(BASE_DIR, "datasets", "images")):
                    ds_config["path"] = os.path.join(BASE_DIR, "datasets")
                    log_msg("🔧 探测到嵌套的 datasets 目录，已自动对齐数据根路径。")
                else:
                    ds_config["path"] = BASE_DIR 
                    log_msg("🔧 已自动锁定数据绝对路径。")
                
                with open(abs_data_path, "w", encoding="utf-8") as df:
                    yaml.dump(ds_config, df, allow_unicode=True, sort_keys=False)
                    
            except Exception as e:
                log_msg(f"⚠️ 警告: 自动修复数据集路径失败 ({str(e)})")
        else:
            log_msg(f"⚠️ 警告: 未找到指定的数据集配置文件: {abs_data_path}")

        if device_choice:
            log_msg(f"用户手动指定计算设备: {device_choice.upper()}")
            valid_args['device'] = device_choice
        elif 'device' in valid_args and str(valid_args['device']) != 'cpu' and not torch.cuda.is_available():
            log_msg("警告：配置要求GPU，但当前环境无CUDA，已自动降级为 CPU 模式。")
            valid_args['device'] = 'cpu'

        STATE["message"] = "开始载入数据批次进行运算..."
        log_msg("开始训练循环...")
        
        model.train(**valid_args)

        if stop_requested:
            STATE["status"] = "idle"
            STATE["message"] = "训练已安全中断，断点已保存"
            log_msg("=== 训练已中断，下次可断点续训 ===")
        else:
            STATE["status"] = "completed"
            STATE["message"] = "全部训练任务圆满完成！"
            STATE["progress"] = 100.0
            log_msg("=== 训练任务完成，最优权重位于 runs/detect/train/weights/best.pt ===")

    except Exception as e:
        STATE["status"] = "error"
        STATE["message"] = "训练异常崩溃"
        import traceback
        log_msg(f"[致命错误] {str(e)}")
        log_msg(traceback.format_exc()) 

# ==========================================
# 3. Web API 接口
# ==========================================
@app.route("/api/config")
def get_config():
    config = {
        "model": "-", "epochs": "-", "batch": "-", "imgsz": "-", 
        "dataset": "-", "classes": "-", "has_last": False,
        "has_cuda": torch.cuda.is_available(),
        "gpu_name": torch.cuda.get_device_name(0) if torch.cuda.is_available() else "无"
    }
    
    if os.path.exists(ARGS_PATH):
        try:
            with open(ARGS_PATH, "r", encoding="utf-8") as f:
                args = yaml.safe_load(f) or {}
            config["model"] = args.get("model", "yolo11n.pt")
            config["epochs"] = args.get("epochs", "-")
            config["batch"] = args.get("batch", "-")
            config["imgsz"] = args.get("imgsz", "-")
            
            data_val = args.get("data", "dataset.yaml")
            config["dataset"] = data_val
            
            abs_data_path = os.path.join(BASE_DIR, data_val) if not os.path.isabs(data_val) else data_val
            
            if os.path.exists(abs_data_path):
                with open(abs_data_path, "r", encoding="utf-8") as df:
                    ds = yaml.safe_load(df) or {}
                    names = ds.get("names", [])
                    if isinstance(names, dict): names = list(names.values())
                    if names:
                        config["classes"] = " | ".join(names)
                    else:
                        config["classes"] = f"类别数: {ds.get('nc', '?')}"
        except Exception as e:
            log_msg(f"解析配置警告: {e}")
            
    config["has_last"] = os.path.exists(RUNS_LAST_PT)
    STATE["config"] = config
    return jsonify(config)

@app.route("/api/status")
def get_status():
    return jsonify(STATE)

@app.route("/api/start", methods=["POST"])
def api_start():
    global training_thread
    data = request.json or {}
    resume = data.get("resume", False)
    device_choice = data.get("device", "")
    
    if STATE["status"] == "training":
        return jsonify({"code": 400, "msg": "已经在训练中"})
    
    training_thread = threading.Thread(target=run_yolo, args=(resume, device_choice))
    training_thread.daemon = True
    training_thread.start()
    return jsonify({"code": 200, "msg": "启动成功"})

@app.route("/api/stop", methods=["POST"])
def api_stop():
    global stop_requested
    if STATE["status"] == "training":
        stop_requested = True
        STATE["status"] = "stopping"
        STATE["message"] = "等待当前 Epoch 结束..."
        return jsonify({"code": 200, "msg": "已发送终止信号"})
    return jsonify({"code": 400, "msg": "当前未在训练"})

# ==========================================
# 4. 前端网页 UI (内嵌 HTML)
# ==========================================
HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="zh-CN" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AOI 离线自动化训练引擎</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = { darkMode: 'class', theme: { extend: { colors: { slate: { 850: '#151e2e' } } } } }
    </script>
    <style>
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #0f172a; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #475569; }
        .table-container { max-height: 400px; overflow-y: auto; overflow-x: auto;}
    </style>
</head>
<body class="bg-slate-900 text-slate-200 font-sans min-h-screen p-6">
    <div class="max-w-7xl mx-auto space-y-6">
        
        <header class="flex justify-between items-end border-b border-slate-700 pb-4">
            <div>
                <h1 class="text-3xl font-bold text-white tracking-wide">AI 模型离线训练节点 <span class="text-blue-500 text-xl align-top">COE</span></h1>
                <p class="text-slate-400 mt-1">华为AI检测训练平台</p>
            </div>
            <div id="status-badge" class="px-4 py-2 rounded-full font-semibold bg-slate-800 text-slate-300 border border-slate-600 shadow-sm transition-colors duration-300">
                🟡 状态: 正在连接核心...
            </div>
        </header>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div class="lg:col-span-2 bg-slate-800 rounded-xl border border-slate-700 p-5 shadow-lg">
                <h2 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    训练配置参数
                </h2>
                <div class="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div class="bg-slate-850 p-3 rounded-lg border border-slate-700/50">
                        <span class="block text-slate-500 mb-1">基座权重</span>
                        <span id="cfg-model" class="font-mono text-emerald-400">-</span>
                    </div>
                    <div class="bg-slate-850 p-3 rounded-lg border border-slate-700/50">
                        <span class="block text-slate-500 mb-1">目标轮次</span>
                        <span id="cfg-epochs" class="font-mono text-white">-</span>
                    </div>
                    <div class="bg-slate-850 p-3 rounded-lg border border-slate-700/50">
                        <span class="block text-slate-500 mb-1">批次大小 / 图像尺寸</span>
                        <span class="font-mono text-white"><span id="cfg-batch">-</span> / <span id="cfg-imgsz">-</span></span>
                    </div>
                    <div class="bg-slate-850 p-3 rounded-lg border border-slate-700/50 md:col-span-3">
                        <span class="block text-slate-500 mb-1">数据集与缺陷分类</span>
                        <div class="flex flex-col gap-1">
                            <span id="cfg-dataset" class="text-blue-300 font-mono">-</span>
                            <span id="cfg-classes" class="text-amber-400 font-medium">-</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="bg-slate-800 rounded-xl border border-slate-700 p-5 shadow-lg flex flex-col justify-between">
                <div>
                    <h2 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <svg class="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                        引擎控制
                    </h2>
                    
                    <div class="mb-5 bg-slate-850 p-3 rounded-lg border border-slate-700/50">
                        <label class="block text-slate-400 text-xs font-bold mb-2 tracking-wider">💻 强制分配运算设备</label>
                        <select id="device-select" class="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white outline-none focus:border-blue-500 text-sm transition-colors">
                            <option value="cpu">仅使用 CPU (兼容/极慢模式)</option>
                            <option value="0">使用 GPU 0 (NVIDIA 显卡加速)</option>
                        </select>
                        <p id="gpu-tip" class="text-xs text-rose-400 mt-2 hidden">⚠️ 环境异常: 未检测到有效的 CUDA，请使用 CPU 模式或检查驱动。</p>
                        <p id="gpu-ok" class="text-xs text-emerald-400 mt-2 hidden">✅ 已检测到硬件加速: <span id="cfg-gpuname"></span></p>
                    </div>
                    
                    <div class="mb-4">
                        <div class="flex justify-between text-sm mb-2">
                            <span id="progress-text" class="text-slate-400">等待启动</span>
                            <span id="progress-pct" class="font-mono text-white font-bold">0%</span>
                        </div>
                        <div class="w-full bg-slate-900 rounded-full h-3 border border-slate-700">
                            <div id="progress-bar" class="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-500 ease-out" style="width: 0%"></div>
                        </div>
                    </div>
                </div>

                <div class="flex flex-col gap-3">
                    <button id="btn-start" onclick="postAction('start', false)" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-lg shadow-blue-500/20">
                        🚀 全新开始训练
                    </button>
                    <button id="btn-resume" onclick="postAction('start', true)" class="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-lg shadow-amber-500/20 hidden">
                        ▶️ 从断点继续训练
                    </button>
                    <button id="btn-stop" onclick="postAction('stop')" class="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-lg shadow-rose-500/20 hidden">
                        ⏸️ 安全终止保存
                    </button>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-lg flex flex-col h-[450px]">
                <div class="p-4 border-b border-slate-700 bg-slate-850">
                    <h2 class="font-semibold text-white">📊 训练指标追踪 (Metrics)</h2>
                </div>
                <div class="table-container flex-1 bg-slate-900/50 p-0">
                    <table class="w-full text-left text-sm text-slate-300 whitespace-nowrap">
                        <thead class="text-xs text-slate-400 bg-slate-800 sticky top-0 shadow-sm z-10">
                            <tr>
                                <th class="px-3 py-2">轮次<br><span class="text-[10px] text-slate-500 font-normal">Epoch</span></th>
                                <th class="px-3 py-2">显存<br><span class="text-[10px] text-slate-500 font-normal">GPU_mem</span></th>
                                <th class="px-3 py-2">边框损失<br><span class="text-[10px] text-slate-500 font-normal">box_loss</span></th>
                                <th class="px-3 py-2">分类损失<br><span class="text-[10px] text-slate-500 font-normal">cls_loss</span></th>
                                <th class="px-3 py-2">分布损失<br><span class="text-[10px] text-slate-500 font-normal">dfl_loss</span></th>
                                <th class="px-3 py-2">尺寸<br><span class="text-[10px] text-slate-500 font-normal">Size</span></th>
                                <th class="px-3 py-2 font-bold text-emerald-400">精度<br><span class="text-[10px] text-emerald-600 font-normal">mAP@50</span></th>
                                <th class="px-3 py-2">综合精度<br><span class="text-[10px] text-slate-500 font-normal">mAP@50-95</span></th>
                            </tr>
                        </thead>
                        <tbody id="metrics-body" class="divide-y divide-slate-700/50"></tbody>
                    </table>
                    <div id="metrics-empty" class="text-center text-slate-500 mt-10">尚无 Epoch 数据</div>
                </div>
            </div>

            <div class="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-lg flex flex-col h-[450px]">
                <div class="p-4 border-b border-slate-700 bg-slate-850">
                    <h2 class="font-semibold text-white">>_ 核心控制台 (Console)</h2>
                </div>
                <div class="flex-1 bg-[#0a0f18] p-4 overflow-y-auto font-mono text-sm leading-relaxed" id="console-output"></div>
            </div>
        </div>
    </div>

    <script>
        const els = {
            badge: document.getElementById('status-badge'),
            pText: document.getElementById('progress-text'),
            pPct: document.getElementById('progress-pct'),
            pBar: document.getElementById('progress-bar'),
            btnStart: document.getElementById('btn-start'),
            btnResume: document.getElementById('btn-resume'),
            btnStop: document.getElementById('btn-stop'),
            tbody: document.getElementById('metrics-body'),
            empty: document.getElementById('metrics-empty'),
            console: document.getElementById('console-output'),
            deviceSelect: document.getElementById('device-select'),
            gpuTip: document.getElementById('gpu-tip'),
            gpuOk: document.getElementById('gpu-ok'),
            gpuName: document.getElementById('cfg-gpuname')
        };

        async function loadConfig() {
            try {
                const res = await fetch('/api/config');
                const cfg = await res.json();
                document.getElementById('cfg-model').innerText = cfg.model;
                document.getElementById('cfg-epochs').innerText = cfg.epochs;
                document.getElementById('cfg-batch').innerText = cfg.batch;
                document.getElementById('cfg-imgsz').innerText = cfg.imgsz;
                document.getElementById('cfg-dataset').innerText = cfg.dataset;
                document.getElementById('cfg-classes').innerText = cfg.classes;
                
                if(cfg.has_cuda) {
                    els.deviceSelect.value = "0";
                    els.gpuTip.classList.add('hidden');
                    els.gpuOk.classList.remove('hidden');
                    els.gpuName.innerText = cfg.gpu_name;
                } else {
                    els.deviceSelect.value = "cpu";
                    els.gpuOk.classList.add('hidden');
                    els.gpuTip.classList.remove('hidden');
                }
                
                if(cfg.has_last && els.badge.innerText.includes('等待') || els.badge.innerText.includes('就绪')) {
                    els.btnResume.classList.remove('hidden');
                }
            } catch (e) { console.error("加载配置失败"); }
        }

        async function postAction(action, resume=false) {
            const device = els.deviceSelect.value;
            await fetch(`/api/${action}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({resume, device})
            });
            pollStatus(); 
        }

        function renderTable(dataArray) {
            if (dataArray.length === 0) return;
            els.empty.style.display = 'none';
            els.tbody.innerHTML = dataArray.map(d => `
                <tr class="hover:bg-slate-800/50 transition-colors">
                    <td class="px-3 py-2 font-mono">${d.epoch}</td>
                    <td class="px-3 py-2 font-mono text-slate-400">${d.gpu_mem}</td>
                    <td class="px-3 py-2 font-mono text-rose-400">${d.box_loss.toFixed(4)}</td>
                    <td class="px-3 py-2 font-mono text-rose-400">${d.cls_loss.toFixed(4)}</td>
                    <td class="px-3 py-2 font-mono text-rose-400">${d.dfl_loss.toFixed(4)}</td>
                    <td class="px-3 py-2 font-mono text-slate-400">${d.size}</td>
                    <td class="px-3 py-2 font-mono text-emerald-400 font-bold">${d.map50.toFixed(4)}</td>
                    <td class="px-3 py-2 font-mono text-slate-400">${d.map50_95.toFixed(4)}</td>
                </tr>
            `).join('');
            els.tbody.parentElement.parentElement.scrollTop = els.tbody.parentElement.parentElement.scrollHeight;
        }

        let lastLogCount = 0;
        function renderLogs(logsArray) {
            if (logsArray.length > lastLogCount) {
                els.console.innerHTML = logsArray.map(l => `<div class="${l.includes('错误') || l.includes('致命') ? 'text-rose-400' : (l.includes('警告') ? 'text-amber-400' : 'text-emerald-500')}">${l}</div>`).join('');
                els.console.scrollTop = els.console.scrollHeight;
                lastLogCount = logsArray.length;
            }
        }

        async function pollStatus() {
            try {
                const res = await fetch('/api/status');
                const state = await res.json();
                
                els.pText.innerText = state.message;
                els.pPct.innerText = state.progress.toFixed(1) + '%';
                els.pBar.style.width = state.progress + '%';

                if (state.status === 'training') {
                    els.badge.className = "px-4 py-2 rounded-full font-semibold border shadow-sm bg-blue-900/50 text-blue-300 border-blue-500/50";
                    els.badge.innerText = "🔵 正在训练运算";
                    els.btnStart.classList.add('hidden');
                    els.btnResume.classList.add('hidden');
                    els.btnStop.classList.remove('hidden');
                    els.deviceSelect.disabled = true; 
                } else if (state.status === 'stopping') {
                    els.badge.className = "px-4 py-2 rounded-full font-semibold border shadow-sm bg-amber-900/50 text-amber-300 border-amber-500/50";
                    els.badge.innerText = "🟡 正在安全停止中...";
                    els.btnStop.innerText = "⏳ 正在保存权重...";
                    els.btnStop.classList.add('opacity-50', 'cursor-not-allowed');
                } else if (state.status === 'idle') {
                    els.badge.className = "px-4 py-2 rounded-full font-semibold border shadow-sm bg-slate-800 text-slate-300 border-slate-600";
                    els.badge.innerText = "🟢 就绪";
                    els.btnStart.classList.remove('hidden');
                    els.btnStop.classList.add('hidden');
                    els.btnStop.innerText = "⏸️ 安全终止保存";
                    els.btnStop.classList.remove('opacity-50', 'cursor-not-allowed');
                    els.deviceSelect.disabled = false;
                } else if (state.status === 'completed' || state.status === 'error') {
                    els.badge.className = state.status === 'error' ? 
                        "px-4 py-2 rounded-full font-semibold border shadow-sm bg-rose-900/50 text-rose-300 border-rose-500/50" : 
                        "px-4 py-2 rounded-full font-semibold border shadow-sm bg-emerald-900/50 text-emerald-300 border-emerald-500/50";
                    els.badge.innerText = state.status === 'error' ? "🔴 引擎崩溃" : "✅ 训练完成";
                    els.btnStop.classList.add('hidden');
                    els.btnStart.classList.remove('hidden');
                    els.btnStart.innerText = "🚀 重新开始";
                    els.deviceSelect.disabled = false;
                }

                renderTable(state.epochs_data);
                renderLogs(state.logs);

            } catch (e) {
                els.badge.innerText = "🔴 控制台断开连接";
                els.badge.className = "px-4 py-2 rounded-full font-semibold border shadow-sm bg-rose-900/50 text-rose-300 border-rose-500/50";
            }
        }

        loadConfig();
        setInterval(pollStatus, 1000); 
    </script>
</body>
</html>
"""

@app.route("/")
def index():
    return HTML_TEMPLATE

# ==========================================
# 5. 系统托盘与程序入口
# ==========================================
def open_ui():
    webbrowser.open("http://127.0.0.1:5000")

if __name__ == "__main__":
    print(f"正在启动 AOI Web 训练控制台 (运行真实物理目录: {BASE_DIR})...")
    
    flask_thread = threading.Thread(target=lambda: app.run(host="127.0.0.1", port=5000, threaded=True, use_reloader=False))
    flask_thread.daemon = True
    flask_thread.start()
    
    threading.Timer(1.0, open_ui).start()

    try:
        import pystray
        from PIL import Image, ImageDraw

        def create_icon_image():
            width = 64
            height = 64
            image = Image.new('RGB', (width, height), color=(30, 41, 59))  
            dc = ImageDraw.Draw(image)
            dc.ellipse((12, 12, 52, 52), fill=(59, 130, 246)) 
            return image

        def on_open(icon, item):
            open_ui()

        def on_exit(icon, item):
            print("正在关闭并退出程序...")
            icon.stop()
            os._exit(0) 

        menu = pystray.Menu(
            pystray.MenuItem('🌐 打开网页控制台', on_open, default=True),
            pystray.MenuItem('❌ 强制退出程序', on_exit)
        )

        tray_icon = pystray.Icon("AOI_Trainer", create_icon_image(), "AOI 训练控制台", menu)
        tray_icon.run()

    except ImportError:
        print("\n[提示] 缺少 pystray 或 Pillow 库，将以无系统托盘模式运行。")
        while True:
            time.sleep(1)
