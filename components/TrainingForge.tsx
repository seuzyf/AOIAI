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
  Download
} from 'lucide-react';
import { TERMINAL_LOGS } from '../constants';
import { TerminalLog } from '../types';

interface TrainingForgeProps {
  onNavigateToSampleHub: () => void;
}

export const TrainingForge: React.FC<TrainingForgeProps> = ({ onNavigateToSampleHub }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [engineerMode, setEngineerMode] = useState(false);
  const [logs, setLogs] = useState<TerminalLog[]>([]);
  const [isTraining, setIsTraining] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  // Form State
  const [scenario, setScenario] = useState<'detection' | 'classification' | 'segmentation' | null>(null);
  const [hardware, setHardware] = useState<'gpu' | 'cpu' | null>(null);

  const steps = [
    { title: '场景选型', icon: Target },
    { title: '硬件环境', icon: Monitor },
    { title: '数据挂载', icon: Database },
    { title: '参数配置', icon: Sliders },
    { title: '生成交付', icon: Play }
  ];

  // Terminal Simulation
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isTraining && !isFinished) {
      let delay = 0;
      TERMINAL_LOGS.forEach((text, index) => {
        delay += 800 + Math.random() * 500;
        setTimeout(() => {
          setLogs(prev => [...prev, { id: Date.now(), text }]);
          if (index === TERMINAL_LOGS.length - 1) {
            setIsFinished(true);
          }
        }, delay);
      });
    }
  }, [isTraining]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);


  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Scenario
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-semibold text-slate-800">选择应用场景</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { id: 'detection', name: '缺陷定位 (Detection)', desc: '识别缺陷位置与类别 (YOLOv8)', icon: Target },
                { id: 'classification', name: '良品判定 (Classification)', desc: '整图二分类判定 (ResNet)', icon: Check },
                { id: 'segmentation', name: '图像分割 (Segmentation)', desc: '像素级精细分割 (UNet)', icon: Layers },
              ].map((item) => (
                <div 
                  key={item.id}
                  onClick={() => setScenario(item.id as any)}
                  className={`p-6 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md group ${
                    scenario === item.id 
                      ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600' 
                      : 'border-slate-200 bg-white hover:border-indigo-300'
                  }`}
                >
                  <div className={`p-3 rounded-lg w-fit mb-4 ${
                    scenario === item.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600'
                  }`}>
                    <item.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-800 mb-2">{item.name}</h3>
                  <p className="text-sm text-slate-500">{item.desc}</p>
                </div>
              ))}
            </div>
            {scenario === 'detection' && (
              <div className="p-4 bg-blue-50 text-blue-800 text-sm rounded-lg border border-blue-100 flex items-center">
                <BrainCircuit className="w-4 h-4 mr-2" />
                系统已自动锁定基座模型: <span className="font-bold ml-1">YOLOv8-Industrial-S</span>
              </div>
            )}
          </div>
        );

      case 1: // Hardware
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <h2 className="text-xl font-semibold text-slate-800">目标部署环境</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div 
                  onClick={() => setHardware('gpu')}
                  className={`flex items-center p-6 rounded-xl border-2 cursor-pointer transition-all ${
                    hardware === 'gpu' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <Zap className={`w-8 h-8 mr-4 ${hardware === 'gpu' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <div>
                    <h3 className="font-bold text-slate-800">高性能服务器 / 工作站</h3>
                    <p className="text-sm text-slate-500">NVIDIA RTX 3060+, Tesla T4</p>
                  </div>
                </div>
                <div 
                  onClick={() => setHardware('cpu')}
                  className={`flex items-center p-6 rounded-xl border-2 cursor-pointer transition-all ${
                    hardware === 'cpu' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <Cpu className={`w-8 h-8 mr-4 ${hardware === 'cpu' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <div>
                    <h3 className="font-bold text-slate-800">边缘计算设备 / 工控机</h3>
                    <p className="text-sm text-slate-500">Intel Core i5, Jetson Nano (CPU Mode)</p>
                  </div>
                </div>
             </div>
             {hardware === 'cpu' && (
              <div className="p-4 bg-amber-50 text-amber-800 text-sm rounded-lg border border-amber-100 flex items-center">
                <HardDrive className="w-4 h-4 mr-2" />
                系统已自动将 Batch Size 限制为 4 以防止内存溢出。
              </div>
            )}
          </div>
        );

      case 2: // Data
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <h2 className="text-xl font-semibold text-slate-800">挂载数据集</h2>
             <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
                <label className="block text-sm font-medium text-slate-700 mb-2">选择数据集快照</label>
                <div className="flex gap-3">
                  <select className="flex-1 border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 bg-white">
                    <option>2024-无线产线-划痕专项 (500张)</option>
                    <option>2024-全量测试集 (1200张) - Verified</option>
                  </select>
                  <button 
                    onClick={onNavigateToSampleHub}
                    className="flex items-center px-4 py-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors font-medium text-sm"
                  >
                    管理/新增数据集 <ExternalLink className="w-4 h-4 ml-2" />
                  </button>
                </div>
                <div className="mt-4 flex gap-4 text-sm text-slate-500">
                   <div className="flex items-center"><Check className="w-4 h-4 text-emerald-500 mr-1"/> 数据格式校验通过</div>
                   <div className="flex items-center"><Check className="w-4 h-4 text-emerald-500 mr-1"/> 标签一致性 100%</div>
                </div>
             </div>
          </div>
        );

      case 3: // Config
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="flex justify-between items-center">
               <h2 className="text-xl font-semibold text-slate-800">训练参数配置</h2>
               <div className="flex items-center gap-2">
                 <span className={`text-sm font-medium ${engineerMode ? 'text-indigo-600' : 'text-slate-500'}`}>
                   工程师模式
                 </span>
                 <button 
                   onClick={() => setEngineerMode(!engineerMode)}
                   className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ${engineerMode ? 'bg-indigo-600' : 'bg-slate-300'}`}
                 >
                   <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${engineerMode ? 'translate-x-5' : 'translate-x-0'}`}></div>
                 </button>
               </div>
             </div>

             <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
               {!engineerMode ? (
                 <div className="space-y-6">
                   <div>
                     <label className="block text-sm font-medium text-slate-700 mb-3">训练强度 (Intensity)</label>
                     <input type="range" min="0" max="2" step="1" className="w-full accent-indigo-600 cursor-pointer" />
                     <div className="flex justify-between text-xs text-slate-500 mt-2 font-medium">
                       <span>快速 (Proto)</span>
                       <span>标准 (Standard)</span>
                       <span>深度 (Deep)</span>
                     </div>
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-slate-700 mb-3">图片输入尺寸</label>
                     <div className="flex gap-4">
                        <label className="flex items-center gap-2 border p-3 rounded-lg cursor-pointer hover:bg-slate-50 flex-1">
                          <input type="radio" name="size" className="text-indigo-600" />
                          <span className="text-sm">320px (速度优先)</span>
                        </label>
                        <label className="flex items-center gap-2 border p-3 rounded-lg cursor-pointer hover:bg-slate-50 flex-1">
                          <input type="radio" name="size" defaultChecked className="text-indigo-600" />
                          <span className="text-sm">640px (精度优先)</span>
                        </label>
                     </div>
                   </div>
                 </div>
               ) : (
                 <div>
                   <div className="border-b border-slate-200 mb-4 flex gap-6">
                      <button className="text-sm font-medium text-indigo-600 border-b-2 border-indigo-600 pb-2">数据增强</button>
                      <button className="text-sm font-medium text-slate-500 hover:text-slate-800 pb-2">超参数</button>
                   </div>
                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-700">随机旋转 (0-180°)</span>
                          <input type="checkbox" defaultChecked className="rounded text-indigo-600" />
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-700">Mosaic 概率</span>
                          <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded">0.5</span>
                        </div>
                        <input type="range" className="w-full accent-indigo-600 h-1 bg-slate-200 rounded" />
                      </div>
                      <div className="space-y-4">
                         <div>
                           <label className="text-xs text-slate-500 block mb-1">Learning Rate</label>
                           <input type="text" defaultValue="0.001" className="w-full border border-slate-300 rounded px-2 py-1 text-sm font-mono" />
                         </div>
                         <div>
                           <label className="text-xs text-slate-500 block mb-1">Optimizer</label>
                           <select className="w-full border border-slate-300 rounded px-2 py-1 text-sm">
                             <option>AdamW</option>
                             <option>SGD</option>
                           </select>
                         </div>
                      </div>
                   </div>
                 </div>
               )}
             </div>
          </div>
        );

      case 4: // Export
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="flex flex-col items-center justify-center py-10">
               {!isTraining ? (
                 <button 
                  onClick={() => setIsTraining(true)}
                  className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-indigo-600 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 hover:bg-indigo-700 hover:scale-105 shadow-lg shadow-indigo-200"
                 >
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
                          <div key={log.id} className="text-green-400 break-words animate-in fade-in slide-in-from-left-2 duration-300">
                            {log.text}
                          </div>
                        ))}
                        <div ref={logsEndRef} />
                        {!isFinished && (
                          <div className="text-green-400 animate-pulse">_</div>
                        )}
                      </div>
                   </div>
                   
                   {isFinished && (
                     <div className="mt-8 flex justify-center animate-in zoom-in duration-500">
                        <button className="flex items-center px-6 py-3 bg-white text-indigo-600 font-bold rounded-lg border-2 border-indigo-100 hover:border-indigo-600 hover:bg-indigo-50 transition-all shadow-md">
                          <Download className="w-5 h-5 mr-2" />
                          下载 .zip (145 MB)
                        </button>
                     </div>
                   )}
                 </div>
               )}
             </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Stepper Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
           <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 -z-10"></div>
           {steps.map((step, index) => {
             const isActive = index === currentStep;
             const isCompleted = index < currentStep;
             return (
               <div key={index} className="flex flex-col items-center bg-slate-50 px-2">
                 <div 
                   className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${
                     isActive ? 'border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 
                     isCompleted ? 'border-emerald-500 bg-emerald-500 text-white' : 
                     'border-slate-300 bg-white text-slate-400'
                   }`}
                 >
                   {isCompleted ? <Check className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
                 </div>
                 <span className={`text-xs font-medium mt-2 ${isActive ? 'text-indigo-800' : 'text-slate-500'}`}>
                   {step.title}
                 </span>
               </div>
             );
           })}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-1">
        {renderStepContent()}
      </div>

      {/* Navigation Footer */}
      {!isTraining && (
        <div className="mt-6 pt-6 border-t border-slate-200 flex justify-between">
          <button 
            disabled={currentStep === 0}
            onClick={() => setCurrentStep(curr => curr - 1)}
            className="px-6 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            上一步
          </button>
          
          {currentStep < steps.length - 1 && (
            <button 
              onClick={() => setCurrentStep(curr => curr + 1)}
              disabled={(currentStep === 0 && !scenario) || (currentStep === 1 && !hardware)}
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
