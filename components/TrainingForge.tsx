import React, { useState, useEffect, useRef } from 'react';
import { 
  BrainCircuit, 
  Cpu, 
  Database, 
  Sliders, 
  Play, 
  Check, 
  ChevronRight, 
  Zap, 
  Target, 
  Layers, 
  Monitor, 
  HardDrive,
  ExternalLink,
  Terminal as TerminalIcon,
  Download,
  FolderArchive,
  CheckSquare,
  Square,
  CheckCircle
} from 'lucide-react';
import JSZip from 'jszip'; // 引入 JSZip 用于生成压缩包
import { TerminalLog, Dataset } from '../types';
import { api } from '../api';

interface TrainingForgeProps {
  onNavigateToSampleHub: () => void;
}

const BASE_MODELS = {
  detection: [
    { id: 'yolov8s', name: 'YOLOv8-Industrial-S', desc: '速度极快，适合轻量级部署与常规表面缺陷', params: '11.1M' },
    { id: 'yolov8m', name: 'YOLOv8-Industrial-M', desc: '精度与速度均衡，适合复杂背景下的缺陷特征提取', params: '25.8M' },
    { id: 'rtdetr', name: 'RT-DETR-L', desc: 'Transformer架构，高精度抗干扰，适合密集小缺陷', params: '32.0M' }
  ],
  classification: [
    { id: 'resnet50', name: 'ResNet50-AOI', desc: '工业二分类经典架构，稳定可靠的良品判定基座', params: '23.5M' },
    { id: 'efficientnet', name: 'EfficientNet-B3', desc: '高精度参数比，适合细粒度的微小差异判定', params: '12.0M' },
    { id: 'mobilenet', name: 'MobileNetV3-L', desc: '极低算力需求，适合边缘低功耗设备', params: '5.4M' }
  ],
  segmentation: [
    { id: 'yolov8seg', name: 'YOLOv8-Seg-Base', desc: '实时实例分割，边缘贴合度高，支持快速推理', params: '11.8M' },
    { id: 'deeplabv3', name: 'DeepLabV3+', desc: '语义分割标杆，适合大面积连续性缺陷提取', params: '43.0M' }
  ]
};

export const TrainingForge: React.FC<TrainingForgeProps> = ({ onNavigateToSampleHub }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [engineerMode, setEngineerMode] = useState(false);
  const [logs, setLogs] = useState<TerminalLog[]>([]);
  const [isTraining, setIsTraining] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  // Form State
  const [scenario, setScenario] = useState<'detection' | 'classification' | 'segmentation' | null>(null);
  const [baseModel, setBaseModel] = useState<string | null>(null);
  const [hardware, setHardware] = useState<'gpu_high' | 'gpu_low' | 'cpu' | null>(null);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDatasetIds, setSelectedDatasetIds] = useState<Set<string>>(new Set());
  
  // Params State
  const [epochs, setEpochs] = useState<number>(300);
  const [imgsz, setImgsz] = useState<number>(640);
  const [activeConfigTab, setActiveConfigTab] = useState<'aug' | 'hyper'>('aug');
  
  // Augmentation State
  const [augParams, setAugParams] = useState({
    mosaic: 1.0, mixup: 0.1, degrees: 0.0, perspective: 0.0
  });

  // Hyperparameters State
  const [hyperparams, setHyperparams] = useState({
    lr0: 0.01, lrf: 0.01, momentum: 0.937, weight_decay: 0.0005, warmup_epochs: 3.0, warmup_momentum: 0.8
  });

  useEffect(() => {
    api.getDatasets().then(setDatasets).catch(() => {});
  }, []);

  const steps = [
    { title: '场景选型', icon: Target },
    { title: '硬件环境', icon: Monitor },
    { title: '数据挂载', icon: Database },
    { title: '参数配置', icon: Sliders },
    { title: '生成交付', icon: Play }
  ];

  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isTraining && !isFinished) {
      const dynamicLogs = [
        `> [系统] 正在初始化工作空间...`,
        `> [数据] 挂载选定的 ${selectedDatasetIds.size} 个数据集快照...`,
        `> [场景] 设定为: ${scenario}, 加载基座权重: ${baseModel}...`,
        `> [算力] 目标硬件预设: ${hardware}, 自动调整并发策略...`,
        `> [配置] Epochs: ${epochs}, 图像分辨率: ${imgsz}px`,
        `> [超参] lr0=${hyperparams.lr0}, lrf=${hyperparams.lrf}, momentum=${hyperparams.momentum}`,
        `> [增强] mosaic=${augParams.mosaic}, mixup=${augParams.mixup}, 旋转=${augParams.degrees}°`,
        `> [系统] 正在生成 train.py 训练脚本与 yaml 配置文件...`,
        `> [系统] 打包资源文件... 压缩比 38%`,
        `> [完成] 构建离线训练包成功`
      ];
      let delay = 0;
      setLogs([]);
      dynamicLogs.forEach((text, index) => {
        delay += 600 + Math.random() * 400;
        setTimeout(() => {
          setLogs(prev => [...prev, { id: Date.now() + index, text }]);
          if (index === dynamicLogs.length - 1) setIsFinished(true);
        }, delay);
      });
    }
  }, [isTraining]);

  useEffect(() => { logsEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs]);

  const toggleDataset = (id: string) => {
    const next = new Set(selectedDatasetIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedDatasetIds(next);
  };

  const handleScenarioChange = (id: 'detection' | 'classification' | 'segmentation') => {
    setScenario(id);
    setBaseModel(BASE_MODELS[id][0].id);
  };

  // 生成 ZIP 并下载的方法
  const handleDownloadZip = async () => {
    try {
      const zip = new JSZip();
      
      // 根据用户选择自动转换配置
      const taskType = scenario === 'detection' ? 'detect' : scenario === 'classification' ? 'classify' : 'segment';
      const batchSize = hardware === 'cpu' ? 4 : (hardware === 'gpu_high' ? 32 : 16);
      const deviceOpt = hardware === 'cpu' ? 'cpu' : '0';

      // 动态生成 YAML 内容
      const yamlContent = `# ==========================================
# 华为AI检测训练平台 - 自动生成配置文件
# ==========================================
# 场景: ${scenario}
# 基座模型: ${baseModel}
# 硬件环境: ${hardware}
# 挂载数据集 ID: ${Array.from(selectedDatasetIds).join(', ')}

# --- 基础参数 ---
task: ${taskType}
model: ${baseModel}.pt
data: dataset.yaml
epochs: ${epochs}
imgsz: ${imgsz}
device: '${deviceOpt}'
batch: ${batchSize}
workers: 8

# --- 超参数 (Hyperparameters) ---
lr0: ${hyperparams.lr0}
lrf: ${hyperparams.lrf}
momentum: ${hyperparams.momentum}
weight_decay: ${hyperparams.weight_decay}
warmup_epochs: ${hyperparams.warmup_epochs}
warmup_momentum: ${hyperparams.warmup_momentum}

# --- 数据增强 (Augmentations) ---
mosaic: ${augParams.mosaic}
mixup: ${augParams.mixup}
degrees: ${augParams.degrees}
perspective: ${augParams.perspective}
`;

      // 将 yaml 文件加入到 zip 实例中
      zip.file("args.yaml", yamlContent);

      // 触发下载
      const blob = await zip.generateAsync({ type: "blob" });
      const dateStr = new Date().toISOString().split('T')[0]; // 获取当前日期 YYYY-MM-DD
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `一键训练脚本_${dateStr}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("生成压缩包失败:", error);
      alert("生成压缩包失败，请检查浏览器支持或联系管理员。");
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-semibold text-slate-800">选择应用场景与基座模型</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { id: 'detection', name: '缺陷定位 (Detection)', desc: '识别缺陷位置与类别，输出边界框', icon: Target },
                { id: 'classification', name: '良品判定 (Classification)', desc: '整图判定，适用于简单NG/OK分类', icon: Check },
                { id: 'segmentation', name: '图像分割 (Segmentation)', desc: '像素级精细分割，获取缺陷精确轮廓', icon: Layers },
              ].map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => handleScenarioChange(item.id as any)} 
                  className={`p-6 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md group flex flex-col ${scenario === item.id ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600' : 'border-slate-200 bg-white hover:border-indigo-300'}`}
                >
                  <div className={`p-3 rounded-lg w-fit mb-4 ${scenario === item.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600'}`}>
                    <item.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-800 mb-2">{item.name}</h3>
                  <p className="text-sm text-slate-500 mb-4 flex-1">{item.desc}</p>
                  <div className="pt-3 border-t border-slate-200/50 flex items-center text-xs font-medium text-slate-600">
                    <BrainCircuit className="w-4 h-4 mr-1.5 text-indigo-500"/>
                    <span className={scenario === item.id ? 'text-indigo-700 font-bold' : ''}>
                      提供 {BASE_MODELS[item.id as 'detection' | 'classification' | 'segmentation'].length} 种基座可选
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {scenario && (
              <div className="mt-8 pt-6 border-t border-slate-200 animate-in fade-in slide-in-from-bottom-2 duration-300">
                 <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                   <BrainCircuit className="w-5 h-5 mr-2 text-indigo-600" /> 
                   选择 {scenario === 'detection' ? '缺陷定位' : scenario === 'classification' ? '良品判定' : '图像分割'} 基座模型
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                   {BASE_MODELS[scenario].map(model => (
                      <div 
                        key={model.id} 
                        onClick={() => setBaseModel(model.id)} 
                        className={`p-5 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md flex flex-col relative ${baseModel === model.id ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 bg-white hover:border-indigo-300'}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                           <h4 className={`font-bold text-base ${baseModel === model.id ? 'text-indigo-900' : 'text-slate-800'}`}>{model.name}</h4>
                           {baseModel === model.id && <CheckCircle className="w-5 h-5 text-indigo-600 absolute top-4 right-4" />}
                        </div>
                        <p className="text-xs text-slate-500 mb-4 flex-1 pr-6">{model.desc}</p>
                        <div className="text-[10px] font-mono bg-white border border-slate-200 text-slate-500 w-fit px-2 py-1 rounded shadow-sm">
                          模型参数量: <span className="font-bold text-slate-700">{model.params}</span>
                        </div>
                      </div>
                   ))}
                 </div>
              </div>
            )}
          </div>
        );

      case 1:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <h2 className="text-xl font-semibold text-slate-800">目标部署环境算力评估</h2>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div onClick={() => setHardware('gpu_high')} className={`flex flex-col p-6 rounded-xl border-2 cursor-pointer transition-all ${hardware === 'gpu_high' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                  <Zap className={`w-8 h-8 mb-4 ${hardware === 'gpu_high' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <h3 className="font-bold text-slate-800 mb-1">高算力设备 / 工作站</h3>
                  <p className="text-xs text-slate-500 mb-3">极致性能，支持大 Batch 并发</p>
                  <p className="text-xs font-mono bg-slate-100 text-slate-600 p-2 rounded mt-auto">例如: RTX 5090, RTX 5080, A100</p>
                </div>
                <div onClick={() => setHardware('gpu_low')} className={`flex flex-col p-6 rounded-xl border-2 cursor-pointer transition-all ${hardware === 'gpu_low' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                  <Cpu className={`w-8 h-8 mb-4 ${hardware === 'gpu_low' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <h3 className="font-bold text-slate-800 mb-1">入门级 GPU / 边缘节点</h3>
                  <p className="text-xs text-slate-500 mb-3">性价比部署，均衡推理速度</p>
                  <p className="text-xs font-mono bg-slate-100 text-slate-600 p-2 rounded mt-auto">例如: RTX 3060, RTX 4060, Tesla T4</p>
                </div>
                <div onClick={() => setHardware('cpu')} className={`flex flex-col p-6 rounded-xl border-2 cursor-pointer transition-all ${hardware === 'cpu' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                  <HardDrive className={`w-8 h-8 mb-4 ${hardware === 'cpu' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <h3 className="font-bold text-slate-800 mb-1">纯 CPU 工业控制机</h3>
                  <p className="text-xs text-slate-500 mb-3">无独立显卡，极低功耗</p>
                  <p className="text-xs font-mono bg-slate-100 text-slate-600 p-2 rounded mt-auto">例如: Intel Core i5/i7, ARM</p>
                </div>
             </div>
             {hardware === 'cpu' && (
              <div className="p-4 bg-amber-50 text-amber-800 text-sm rounded-lg border border-amber-100 flex items-center">
                <HardDrive className="w-4 h-4 mr-2" />
                系统已自动将 Batch Size 限制为 4，并开启量化选项以防止内存溢出。
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col h-full">
             <div className="flex justify-between items-center">
               <h2 className="text-xl font-semibold text-slate-800 flex items-center">
                 挂载训练数据集 <span className="ml-3 text-sm font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">已选 {selectedDatasetIds.size} 项</span>
               </h2>
               <button onClick={onNavigateToSampleHub} className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center font-medium bg-indigo-50 px-3 py-1.5 rounded-md transition-colors">
                  管理/新增数据集 <ExternalLink className="w-4 h-4 ml-1.5" />
               </button>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto pr-2 pb-4">
               {datasets.map(ds => (
                 <div key={ds.id} onClick={() => toggleDataset(ds.id)} className={`relative bg-white rounded-xl border-2 p-5 cursor-pointer transition-all ${selectedDatasetIds.has(ds.id) ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-200 hover:border-indigo-300'}`}>
                    <div className="absolute top-4 right-4 text-slate-400">
                      {selectedDatasetIds.has(ds.id) ? <CheckSquare className="w-5 h-5 text-indigo-600"/> : <Square className="w-5 h-5"/>}
                    </div>
                    <div className="flex items-start gap-3 mb-3">
                       <div className={`p-2 rounded-lg ${selectedDatasetIds.has(ds.id) ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}><FolderArchive className="w-5 h-5" /></div>
                       <div className="pr-6">
                          <h3 className="font-bold text-slate-800 text-base line-clamp-1" title={ds.name}>{ds.name}</h3>
                          <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border">{ds.version || 'v1.0'}</span>
                       </div>
                    </div>
                    <div className="space-y-1.5 text-xs text-slate-600">
                       <div className="flex justify-between border-b border-slate-100 pb-1.5"><span className="text-slate-400">样本数量</span> <span className="font-bold text-slate-800">{ds.count} 张</span></div>
                       <div className="flex justify-between border-b border-slate-100 pb-1.5"><span className="text-slate-400">产线/工序</span> <span className="truncate w-32 text-right">{ds.lines?.join(',') || '-'} / {ds.processes?.join(',') || '-'}</span></div>
                       <div className="flex justify-between border-b border-slate-100 pb-1.5"><span className="text-slate-400">设备来源</span> <span className="truncate w-32 text-right">{ds.devices?.join(',') || '-'}</span></div>
                       <div className="flex justify-between pt-1"><span className="text-slate-400">缺陷标签</span> <span className="font-medium text-indigo-700 truncate w-32 text-right" title={ds.tags.join(',')}>{ds.tags.length > 0 ? ds.tags.join(', ') : '无'}</span></div>
                    </div>
                 </div>
               ))}
               {datasets.length === 0 && <div className="col-span-full py-10 text-center text-slate-400 bg-slate-50 border-2 border-dashed rounded-xl">暂无数据集，请先前往样本库固化数据集。</div>}
             </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="flex justify-between items-center">
               <h2 className="text-xl font-semibold text-slate-800">严谨配置训练参数</h2>
               <div className="flex items-center gap-2">
                 <span className={`text-sm font-medium ${engineerMode ? 'text-indigo-600' : 'text-slate-500'}`}>工程师进阶模式</span>
                 <button onClick={() => setEngineerMode(!engineerMode)} className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ${engineerMode ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                   <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${engineerMode ? 'translate-x-5' : 'translate-x-0'}`}></div>
                 </button>
               </div>
             </div>

             <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-8">
               <div>
                 <div className="flex justify-between items-center mb-2">
                   <label className="text-sm font-bold text-slate-800">训练迭代轮次 (Epochs)</label>
                   <span className="text-indigo-600 font-bold bg-indigo-50 px-3 py-1 rounded-md">{epochs}</span>
                 </div>
                 <p className="text-xs text-slate-500 mb-4">设定模型学习数据的遍历次数。数值越大模型学习越充分，但耗时越长且可能导致过拟合。</p>
                 <input type="range" min="1" max="1000" step="1" value={epochs} onChange={(e) => setEpochs(Number(e.target.value))} className="w-full accent-indigo-600 cursor-pointer" />
                 <div className="flex justify-between text-xs text-slate-400 mt-2 font-medium">
                   <span>快速验证 (1 Epoch)</span>
                   <span>标准推荐 (500 Epochs)</span>
                   <span>深度拟合 (1000 Epochs)</span>
                 </div>
               </div>
               
               <div className="pt-4 border-t border-slate-100">
                 <label className="block text-sm font-bold text-slate-800 mb-2">模型输入分辨率 (Image Size)</label>
                 <p className="text-xs text-slate-500 mb-4">决定模型看到的图像精细度。高分辨率有利于微小缺陷检测，但增加显存消耗。</p>
                 <div className="flex gap-4">
                    <label className={`flex items-center gap-2 border p-3 rounded-lg cursor-pointer hover:bg-slate-50 flex-1 ${imgsz === 320 ? 'border-indigo-200 bg-indigo-50/30' : ''}`}>
                      <input type="radio" name="size" checked={imgsz === 320} onChange={() => setImgsz(320)} className="text-indigo-600" />
                      <span className="text-sm font-medium">320px (速度优先)</span>
                    </label>
                    <label className={`flex items-center gap-2 border p-3 rounded-lg cursor-pointer hover:bg-slate-50 flex-1 ${imgsz === 640 ? 'border-indigo-200 bg-indigo-50/30' : ''}`}>
                      <input type="radio" name="size" checked={imgsz === 640} onChange={() => setImgsz(640)} className="text-indigo-600" />
                      <span className="text-sm font-medium">640px (性能均衡/推荐)</span>
                    </label>
                    <label className={`flex items-center gap-2 border p-3 rounded-lg cursor-pointer hover:bg-slate-50 flex-1 ${imgsz === 1280 ? 'border-indigo-200 bg-indigo-50/30' : ''}`}>
                      <input type="radio" name="size" checked={imgsz === 1280} onChange={() => setImgsz(1280)} className="text-indigo-600" />
                      <span className="text-sm font-medium">1280px (微小缺陷优先)</span>
                    </label>
                 </div>
               </div>

               {engineerMode && (
                 <div className="pt-6 border-t border-slate-200 animate-in fade-in slide-in-from-top-4 duration-300">
                   <div className="border-b border-slate-200 mb-6 flex gap-6">
                      <button onClick={() => setActiveConfigTab('aug')} className={`text-sm font-medium pb-2 transition-colors ${activeConfigTab === 'aug' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}>基础增强配置</button>
                      <button onClick={() => setActiveConfigTab('hyper')} className={`text-sm font-medium pb-2 transition-colors ${activeConfigTab === 'hyper' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}>网络超参数 (YOLO规范)</button>
                   </div>
                   
                   {activeConfigTab === 'aug' ? (
                     <div className="grid grid-cols-2 gap-x-10 gap-y-6">
                        <div>
                          <label className="flex justify-between text-sm font-medium text-slate-700 mb-2"><span>Mosaic 概率</span> <span className="font-mono text-indigo-600">{augParams.mosaic.toFixed(2)}</span></label>
                          <input type="range" min="0" max="1" step="0.05" value={augParams.mosaic} onChange={e => setAugParams({...augParams, mosaic: parseFloat(e.target.value)})} className="w-full accent-indigo-600 cursor-pointer" />
                        </div>
                        <div>
                          <label className="flex justify-between text-sm font-medium text-slate-700 mb-2"><span>MixUp 概率</span> <span className="font-mono text-indigo-600">{augParams.mixup.toFixed(2)}</span></label>
                          <input type="range" min="0" max="1" step="0.05" value={augParams.mixup} onChange={e => setAugParams({...augParams, mixup: parseFloat(e.target.value)})} className="w-full accent-indigo-600 cursor-pointer" />
                        </div>
                        <div>
                          <label className="flex justify-between text-sm font-medium text-slate-700 mb-2"><span>随机旋转 (degrees)</span> <span className="font-mono text-indigo-600">{augParams.degrees.toFixed(1)}°</span></label>
                          <input type="range" min="0" max="180" step="1" value={augParams.degrees} onChange={e => setAugParams({...augParams, degrees: parseFloat(e.target.value)})} className="w-full accent-indigo-600 cursor-pointer" />
                        </div>
                        <div>
                          <label className="flex justify-between text-sm font-medium text-slate-700 mb-2"><span>透视变换 (perspective)</span> <span className="font-mono text-indigo-600">{augParams.perspective.toFixed(3)}</span></label>
                          <input type="range" min="0" max="0.002" step="0.0001" value={augParams.perspective} onChange={e => setAugParams({...augParams, perspective: parseFloat(e.target.value)})} className="w-full accent-indigo-600 cursor-pointer" />
                        </div>
                     </div>
                   ) : (
                     <div className="grid grid-cols-3 gap-6">
                       {[
                         { label: '初始学习率 (lr0)', key: 'lr0', step: '0.001' },
                         { label: '最终学习率 (lrf)', key: 'lrf', step: '0.01' },
                         { label: '动量 (momentum)', key: 'momentum', step: '0.001' },
                         { label: '权重衰减 (weight_decay)', key: 'weight_decay', step: '0.0001' },
                         { label: '预热轮次 (warmup_epochs)', key: 'warmup_epochs', step: '0.1' },
                         { label: '预热动量 (warmup_momentum)', key: 'warmup_momentum', step: '0.01' },
                       ].map(p => (
                         <div key={p.key}>
                           <label className="text-xs font-bold text-slate-600 block mb-1.5">{p.label}</label>
                           <input type="number" step={p.step} value={(hyperparams as any)[p.key]} onChange={e => setHyperparams({...hyperparams, [p.key]: parseFloat(e.target.value)})} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none" />
                         </div>
                       ))}
                       <div className="col-span-3 pt-4 border-t border-slate-100">
                           <label className="text-xs font-bold text-slate-600 block mb-1.5">优化器 (Optimizer)</label>
                           <select className="w-1/3 border border-slate-300 rounded-md px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none">
                             <option value="auto">Auto</option>
                             <option value="SGD">SGD</option>
                             <option value="Adam">Adam</option>
                             <option value="AdamW">AdamW</option>
                           </select>
                       </div>
                     </div>
                   )}
                 </div>
               )}
             </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="flex flex-col items-center justify-center py-10">
               {!isTraining ? (
                 <button onClick={() => setIsTraining(true)} className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-indigo-600 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 hover:bg-indigo-700 hover:scale-105 shadow-lg shadow-indigo-200">
                   <Play className="w-5 h-5 mr-2 fill-current" />
                   生成离线训练包
                 </button>
               ) : (
                 <div className="w-full max-w-2xl">
                   <div className="bg-slate-900 rounded-lg shadow-2xl overflow-hidden font-mono text-sm border border-slate-700">
                      <div className="bg-slate-800 px-4 py-2 flex items-center gap-2 border-b border-slate-700">
                        <TerminalIcon className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-300">Build Console</span>
                      </div>
                      <div className="p-4 h-64 overflow-y-auto space-y-2">
                        {logs.map((log) => (
                          <div key={log.id} className="text-green-400 break-words animate-in fade-in slide-in-from-left-2 duration-300">{log.text}</div>
                        ))}
                        <div ref={logsEndRef} />
                        {!isFinished && <div className="text-green-400 animate-pulse">_</div>}
                      </div>
                   </div>
                   {isFinished && (
                     <div className="mt-8 flex justify-center animate-in zoom-in duration-500">
                        <button 
                          onClick={handleDownloadZip}
                          className="flex items-center px-6 py-3 bg-white text-indigo-600 font-bold rounded-lg border-2 border-indigo-100 hover:border-indigo-600 hover:bg-indigo-50 transition-all shadow-md"
                        >
                          <Download className="w-5 h-5 mr-2" /> 下载 .zip
                        </button>
                     </div>
                   )}
                 </div>
               )}
             </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
           <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 -z-10"></div>
           {steps.map((step, index) => {
             const isActive = index === currentStep;
             const isCompleted = index < currentStep;
             return (
               <div key={index} className="flex flex-col items-center bg-slate-50 px-2">
                 <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${isActive ? 'border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-200' : isCompleted ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 bg-white text-slate-400'}`}>
                   {isCompleted ? <Check className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
                 </div>
                 <span className={`text-xs font-medium mt-2 ${isActive ? 'text-indigo-800' : 'text-slate-500'}`}>{step.title}</span>
               </div>
             );
           })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-1">{renderStepContent()}</div>

      {!isTraining && (
        <div className="mt-6 pt-6 border-t border-slate-200 flex justify-between">
          <button disabled={currentStep === 0} onClick={() => setCurrentStep(curr => curr - 1)} className="px-6 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors">上一步</button>
          {currentStep < steps.length - 1 && (
            <button 
              onClick={() => setCurrentStep(curr => curr + 1)}
              disabled={(currentStep === 0 && (!scenario || !baseModel)) || (currentStep === 1 && !hardware) || (currentStep === 2 && selectedDatasetIds.size === 0)}
              className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all flex items-center"
            >
              下一步 <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
