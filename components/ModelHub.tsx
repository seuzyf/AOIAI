import React, { useState } from 'react';
import { 
  Upload, 
  Search, 
  Download, 
  FileText, 
  BarChart2, 
  X, 
  Box, 
  User, 
  Calendar,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Loader2,
  FolderUp,
  LineChart
} from 'lucide-react';
import { MOCK_MODELS } from '../constants';
import { AIModel } from '../types';

export const ModelHub: React.FC = () => {
  const [models, setModels] = useState<AIModel[]>(MOCK_MODELS);
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [searchTerm,QUERIES] = useState('');

  // 颜色辅助函数
  const getMetricColor = (value: number) => {
    if (value >= 90) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (value >= 80) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getMetricIcon = (value: number) => {
    if (value >= 90) return <CheckCircle className="w-3 h-3 mr-1" />;
    if (value >= 80) return <AlertTriangle className="w-3 h-3 mr-1" />;
    return <XCircle className="w-3 h-3 mr-1" />;
  };

  const handleCreateMockModel = (meta: any) => {
    const newModel: AIModel = {
      id: `m-${Date.now()}`,
      name: meta.name,
      uploader: '当前用户',
      target: meta.target,
      version: 'v1.0.0',
      size: '35.2 MB',
      uploadDate: new Date().toISOString().split('T')[0],
      description: meta.desc,
      metrics: { // 模拟随机生成的指标
        precision: 85 + Math.random() * 10,
        recall: 80 + Math.random() * 15,
        map50: 88 + Math.random() * 8
      },
      chartUrl: 'https://placehold.co/600x400/png?text=Generated+Curve',
      csvData: [
        { epoch: 100, trainBoxLoss: 0.1, trainClsLoss: 0.1, valPrecision: 0.9, valRecall: 0.9, valBgLoss: 0.1 }
      ]
    };
    setModels([newModel, ...models]);
  };

  const filteredModels = models.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.uploader.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500 relative">
      {/* Header & Toolbar */}
      <div className="flex justify-between items-center mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="搜索模型 / 作者 / 目标..." 
            className="pl-9 pr-4 py-2 w-80 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
            value={searchTerm}
            onChange={(e) => QUERIES(e.target.value)}
          />
        </div>
        <button 
          onClick={() => setShowUploadModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center shadow-sm transition-all"
        >
          <FolderUp className="w-4 h-4 mr-2" />
          上传模型 (train文件夹)
        </button>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto pb-6">
        {filteredModels.map(model => (
          <div 
            key={model.id}
            onClick={() => setSelectedModel(model)}
            className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-lg hover:border-indigo-300 transition-all cursor-pointer group flex flex-col"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Box className="w-6 h-6" />
              </div>
              <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full border border-slate-200 font-mono">
                {model.version}
              </span>
            </div>

            <h3 className="font-bold text-slate-800 text-lg mb-1 truncate" title={model.name}>{model.name}</h3>
            <p className="text-xs text-slate-500 mb-4 flex items-center">
              <User className="w-3 h-3 mr-1" /> {model.uploader} 
              <span className="mx-2">•</span>
              <span className="text-slate-400">{model.target}</span>
            </p>

            <div className="mt-auto space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Precision (P)</span>
                <span className={`px-2 py-0.5 rounded border font-medium flex items-center ${getMetricColor(model.metrics.precision)}`}>
                  {getMetricIcon(model.metrics.precision)}
                  {model.metrics.precision.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Recall (R)</span>
                <span className={`px-2 py-0.5 rounded border font-medium flex items-center ${getMetricColor(model.metrics.recall)}`}>
                  {getMetricIcon(model.metrics.recall)}
                  {model.metrics.recall.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">mAP@50</span>
                <span className={`px-2 py-0.5 rounded border font-medium flex items-center ${getMetricColor(model.metrics.map50)}`}>
                  {getMetricIcon(model.metrics.map50)}
                  {model.metrics.map50.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Model Detail Modal */}
      {selectedModel && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-100 rounded-xl text-indigo-700">
                   <Box className="w-8 h-8" />
                </div>
                <div>
                   <h2 className="text-2xl font-bold text-slate-900">{selectedModel.name}</h2>
                   <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                     <span className="flex items-center"><User className="w-4 h-4 mr-1"/> {selectedModel.uploader}</span>
                     <span className="flex items-center"><Calendar className="w-4 h-4 mr-1"/> {selectedModel.uploadDate}</span>
                     <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-xs">{selectedModel.size}</span>
                   </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                 <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors flex items-center">
                   <Download className="w-4 h-4 mr-2" /> 下载模型 (.pt)
                 </button>
                 <button onClick={() => setSelectedModel(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                   <X className="w-6 h-6" />
                 </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-auto p-8 bg-slate-50/30">
               <div className="grid grid-cols-3 gap-6 mb-8">
                 {/* Key Metrics Cards */}
                 <div className={`p-6 rounded-xl border-2 flex flex-col items-center justify-center bg-white ${getMetricColor(selectedModel.metrics.map50).replace('text-', 'border-').split(' ')[2]}`}>
                    <span className="text-sm text-slate-500 mb-1">mAP@50 (平均精度均值)</span>
                    <span className={`text-3xl font-bold ${getMetricColor(selectedModel.metrics.map50).split(' ')[0]}`}>
                      {selectedModel.metrics.map50.toFixed(1)}%
                    </span>
                 </div>
                 <div className="p-6 rounded-xl border border-slate-200 bg-white flex flex-col items-center justify-center">
                    <span className="text-sm text-slate-500 mb-1">Precision (准确率)</span>
                    <span className="text-3xl font-bold text-slate-800">{selectedModel.metrics.precision.toFixed(1)}%</span>
                 </div>
                 <div className="p-6 rounded-xl border border-slate-200 bg-white flex flex-col items-center justify-center">
                    <span className="text-sm text-slate-500 mb-1">Recall (召回率)</span>
                    <span className="text-3xl font-bold text-slate-800">{selectedModel.metrics.recall.toFixed(1)}%</span>
                 </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left: Charts */}
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                     <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                       <LineChart className="w-5 h-5 mr-2 text-indigo-600" />
                       检测性能曲线 (PR Curve)
                     </h3>
                     <div className="aspect-video bg-slate-50 rounded border border-slate-100 flex items-center justify-center overflow-hidden group relative">
                       {/* Placeholder for real image */}
                       <div className="absolute inset-0 bg-slate-100 flex flex-col items-center justify-center text-slate-400">
                          <BarChart2 className="w-12 h-12 mb-2 opacity-50" />
                          <span className="text-sm">生成的 PR_Curve.png</span>
                       </div>
                       {/* Simulate loading real image */}
                       <img 
                         src={selectedModel.chartUrl} 
                         className="w-full h-full object-cover relative z-10 opacity-90 hover:opacity-100 transition-opacity" 
                         alt="Chart"
                       />
                     </div>
                  </div>

                  {/* Right: CSV Data */}
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-[400px]">
                     <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                       <FileText className="w-5 h-5 mr-2 text-indigo-600" />
                       训练日志解析 (results.csv)
                     </h3>
                     <div className="flex-1 overflow-auto border border-slate-200 rounded-lg">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 sticky top-0 text-slate-500">
                            <tr>
                              <th className="px-3 py-2 border-b">Epoch</th>
                              <th className="px-3 py-2 border-b">Box Loss</th>
                              <th className="px-3 py-2 border-b">Cls Loss</th>
                              <th className="px-3 py-2 border-b">Val P</th>
                              <th className="px-3 py-2 border-b">Val R</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-mono text-slate-600">
                            {selectedModel.csvData && selectedModel.csvData.length > 0 ? (
                               selectedModel.csvData.map((row, idx) => (
                                <tr key={idx} className="hover:bg-indigo-50/50">
                                  <td className="px-3 py-1.5">{row.epoch}</td>
                                  <td className="px-3 py-1.5">{row.trainBoxLoss}</td>
                                  <td className="px-3 py-1.5">{row.trainClsLoss}</td>
                                  <td className="px-3 py-1.5 font-bold text-slate-800">{row.valPrecision}</td>
                                  <td className="px-3 py-1.5 font-bold text-slate-800">{row.valRecall}</td>
                                </tr>
                               ))
                            ) : (
                               <tr><td colSpan={5} className="p-4 text-center text-slate-400">无详细 CSV 数据</td></tr>
                            )}
                            {/* Mock more rows if empty to look good */}
                            {!selectedModel.csvData.length && Array.from({length: 10}).map((_, i) => (
                               <tr key={i} className="hover:bg-slate-50">
                                 <td className="px-3 py-1.5">{i * 10}</td>
                                 <td className="px-3 py-1.5">{(0.5 - i*0.01).toFixed(3)}</td>
                                 <td className="px-3 py-1.5">{(0.8 - i*0.02).toFixed(3)}</td>
                                 <td className="px-3 py-1.5">{(0.7 + i*0.01).toFixed(2)}</td>
                                 <td className="px-3 py-1.5">{(0.6 + i*0.02).toFixed(2)}</td>
                               </tr>
                            ))}
                          </tbody>
                        </table>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && <UploadModal onClose={() => setShowUploadModal(false)} onUpload={handleCreateMockModel} />}
    </div>
  );
};

// Sub-component: Upload Modal
const UploadModal = ({ onClose, onUpload }: { onClose: () => void, onUpload: (meta: any) => void }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', target: '', desc: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate Parsing
    setTimeout(() => {
      onUpload(formData);
      setLoading(false);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
        <h3 className="text-lg font-bold text-slate-900 mb-4">上传模型至共享库</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">模型名称</label>
            <input 
              required
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none text-sm" 
              placeholder="例如: Wireless-Scratch-V2"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">检测目标</label>
            <input 
              required
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none text-sm" 
              placeholder="例如: 划痕 / 异物"
              value={formData.target}
              onChange={e => setFormData({...formData, target: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Train 文件夹 / Zip</label>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center text-slate-500 hover:bg-slate-50 cursor-pointer transition-colors">
               <FolderUp className="w-8 h-8 mb-2 text-slate-400" />
               <span className="text-xs">点击选择文件夹或拖拽至此</span>
               <span className="text-[10px] text-slate-400 mt-1">自动解析 results.csv 和 weights</span>
            </div>
          </div>
          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">描述备注</label>
             <textarea 
               className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none text-sm h-20 resize-none"
               value={formData.desc}
               onChange={e => setFormData({...formData, desc: e.target.value})}
             ></textarea>
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded text-sm font-medium">取消</button>
            <button 
              type="submit" 
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded text-sm font-medium shadow-sm flex items-center"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {loading ? '正在解析...' : '确认上传'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};