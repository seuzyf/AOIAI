import React, { useState, useEffect } from 'react';
import { Search, Download, FileText, Box, User, Calendar, CheckCircle, AlertTriangle, XCircle, Loader2, FolderUp, X, LineChart, Edit, RefreshCcw, Trash2 } from 'lucide-react';
import { AIModel } from '../types';
import { api } from '../api';

export const ModelHub: React.FC = () => {
  const [models, setModels] = useState<AIModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // 详情页操作状态
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', description: '' });
  const [showUpdateFileModal, setShowUpdateFileModal] = useState(false);
  const [updateFile, setUpdateFile] = useState<File | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => { loadModels(); }, []);

  const loadModels = async () => {
    try {
      const fetchedModels = await api.getModels();
      setModels(fetchedModels);
    } catch(e) { console.error("API error"); }
  };

  const openModelDetails = (model: AIModel) => {
    setSelectedModel(model);
    setEditForm({ name: model.name, description: model.description || '' });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModel) return;
    try {
      const updatedModel = await api.updateModelInfo(selectedModel.id, editForm);
      setSelectedModel(updatedModel);
      setModels(models.map(m => m.id === updatedModel.id ? updatedModel : m));
      setShowEditModal(false);
    } catch (error) { alert("修改失败"); }
  };

  const handleUpdateFileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModel || !updateFile) return alert("请选择要更新的文件");
    setIsUpdating(true);
    try {
      const updatedModel = await api.updateModelFile(selectedModel.id, updateFile);
      setSelectedModel(updatedModel);
      setModels(models.map(m => m.id === updatedModel.id ? updatedModel : m));
      setShowUpdateFileModal(false);
      setUpdateFile(null);
    } catch (error) { alert("文件更新失败"); } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteModel = async () => {
    if (!selectedModel) return;
    try {
      await api.deleteModel(selectedModel.id);
      setModels(models.filter(m => m.id !== selectedModel.id));
      setShowDeleteConfirm(false);
      setSelectedModel(null);
    } catch (error) { alert("删除失败"); }
  };

  const getMetricColor = (value: number) => {
    if (value >= 90) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (value >= 80) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const filteredModels = models.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const emptyStateMockModel: AIModel = {
    id: 'mock-1', name: '【示例】YOLOv8s_产线划痕检测', target: '划痕 (SCRATCH)', uploader: 'System Admin', version: 'v1.0.0',
    uploadDate: new Date().toISOString().split('T')[0], size: '28.5 MB', 
    description: '这是一个示例模型，用于演示空状态下的UI展示效果。',
    filePath: '/mock/path/yolov8s_scratch.pt', 
    chartUrl: 'https://placehold.co/800x600/eef2ff/4f46e5?text=PR+Curve+(Precision-Recall)', 
    csvData: [
       { epoch: 298, trainBoxLoss: 0.82, trainClsLoss: 0.31, trainDflLoss: 0.80, valPrecision: 0.952, valRecall: 0.931, valMap50: 0.941 },
       { epoch: 299, trainBoxLoss: 0.80, trainClsLoss: 0.30, trainDflLoss: 0.79, valPrecision: 0.954, valRecall: 0.931, valMap50: 0.945 },
       { epoch: 300, trainBoxLoss: 0.79, trainClsLoss: 0.28, trainDflLoss: 0.78, valPrecision: 0.955, valRecall: 0.932, valMap50: 0.948 }
    ],
    args: { task: 'detect', mode: 'train', model: 'yolo11x.pt', epochs: '300', imgsz: '640', optimizer: 'auto' },
    metrics: { precision: 95.5, recall: 93.2, map50: 94.8 }
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500 relative">
      <div className="flex justify-between items-center mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="搜索模型名称..." className="pl-9 pr-4 py-2 w-80 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <button onClick={() => setShowUploadModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center shadow-sm">
          <FolderUp className="w-4 h-4 mr-2" />
          上传模型
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto pb-6">
        {(filteredModels.length === 0 ? [emptyStateMockModel] : filteredModels).map((model) => (
          <div key={model.id} onClick={() => openModelDetails(model)} className={`bg-white border rounded-xl p-5 hover:shadow-lg transition-all cursor-pointer group flex flex-col ${filteredModels.length === 0 ? 'border-dashed border-indigo-300 shadow-indigo-100' : 'border-slate-200 hover:border-indigo-300'}`}>
            {filteredModels.length === 0 && <div className="text-[10px] bg-indigo-100 text-indigo-600 font-bold px-2 py-0.5 rounded w-fit mb-2">系统演示示例</div>}
            <div className="flex items-start justify-between mb-4">
              <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white"><Box className="w-6 h-6" /></div>
              <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full border">{model.version}</span>
            </div>
            <h3 className="font-bold text-slate-800 text-lg mb-1 truncate" title={model.name}>{model.name}</h3>
            <p className="text-xs text-slate-500 mb-4 flex items-center"><User className="w-3 h-3 mr-1" /> {model.uploader} <span className="mx-2">•</span> <span className="truncate">{model.target}</span></p>
            <div className="mt-auto space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Precision</span>
                <span className={`px-2 py-0.5 rounded border font-medium ${getMetricColor(model.metrics.precision)}`}>{model.metrics.precision.toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">mAP@50</span>
                <span className={`px-2 py-0.5 rounded border font-medium ${getMetricColor(model.metrics.map50)}`}>{model.metrics.map50.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedModel && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl p-8 relative max-h-[90vh] overflow-y-auto">
            
            {/* 顶层操作按钮栏 */}
            <div className="absolute right-14 top-4 flex items-center gap-1 border-r border-slate-200 pr-3">
              <button onClick={() => setShowEditModal(true)} title="修改信息" className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"><Edit className="w-5 h-5" /></button>
              <button onClick={() => setShowUpdateFileModal(true)} title="更新模型版本" className="p-2 hover:bg-indigo-50 rounded-full text-indigo-500 transition-colors"><RefreshCcw className="w-5 h-5" /></button>
              <button onClick={() => setShowDeleteConfirm(true)} title="删除模型" className="p-2 hover:bg-red-50 rounded-full text-red-500 transition-colors"><Trash2 className="w-5 h-5" /></button>
            </div>
            <button onClick={() => setSelectedModel(null)} className="absolute right-4 top-4 p-2 hover:bg-slate-100 rounded-full text-slate-400"><X className="w-6 h-6" /></button>
            
            <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-indigo-100 rounded-xl text-indigo-700"><Box className="w-8 h-8" /></div>
                <div>
                   <div className="flex items-center gap-3">
                     <h2 className="text-2xl font-bold text-slate-900">{selectedModel.name}</h2>
                     <span className="text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full">{selectedModel.version}</span>
                   </div>
                   <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                     <span className="flex items-center"><User className="w-4 h-4 mr-1"/> {selectedModel.uploader}</span>
                     <span className="flex items-center"><Calendar className="w-4 h-4 mr-1"/> {selectedModel.uploadDate}</span>
                   </div>
                </div>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
               <h3 className="text-sm font-bold text-slate-700 mb-2">文件存储信息</h3>
               <p className="text-xs font-mono text-slate-600 break-all mb-1">物理路径: {selectedModel.filePath || '未知'}</p>
               <p className="text-xs font-mono text-slate-600">文件大小: {selectedModel.size}</p>
            </div>
            
            <p className="text-slate-600 mt-6 text-sm bg-white border rounded-lg p-4 leading-relaxed whitespace-pre-wrap">{selectedModel.description || "暂无描述"}</p>

            {selectedModel.args && Object.keys(selectedModel.args).length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-bold text-slate-700 mb-3">训练参数配置 (args.yaml)</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 bg-slate-50 p-4 rounded-lg border border-slate-200 h-48 overflow-y-auto">
                  {Object.entries(selectedModel.args).map(([k, v]) => (
                    <div key={k} className="flex flex-col">
                      <span className="text-[10px] text-slate-500 font-mono">{k}</span>
                      <span className="text-xs font-medium text-slate-800 truncate" title={String(v)}>{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 border-t border-slate-200 pt-6">
               <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                 <LineChart className="w-5 h-5 mr-2 text-indigo-600" /> 训练指标与图表评估
               </h3>
               
               <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                 <div className="lg:col-span-5">
                   <img 
                     src={selectedModel.chartUrl || 'https://placehold.co/800x600/f8fafc/94a3b8?text=Chart+Not+Available'} 
                     alt="PR Curve" 
                     className="w-full rounded-lg border border-slate-200 shadow-sm object-cover" 
                   />
                   <p className="text-center text-xs text-slate-500 mt-2">Precision-Recall (P-R) Curve</p>
                 </div>
                 
                 <div className="lg:col-span-7 space-y-6">
                    <div className="bg-indigo-50/50 rounded-lg p-5 border border-indigo-100">
                      <h4 className="text-sm font-bold text-indigo-900 mb-4">核心评估指标</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center"><span className="text-slate-600 text-sm">精确率 (Precision)</span><span className="font-bold text-slate-800">{selectedModel.metrics.precision.toFixed(1)}%</span></div>
                        <div className="flex justify-between items-center"><span className="text-slate-600 text-sm">召回率 (Recall)</span><span className="font-bold text-slate-800">{selectedModel.metrics.recall.toFixed(1)}%</span></div>
                        <div className="flex justify-between items-center"><span className="text-slate-600 text-sm">mAP@0.5</span><span className="font-bold text-indigo-600">{selectedModel.metrics.map50.toFixed(1)}%</span></div>
                      </div>
                    </div>

                    {selectedModel.csvData && selectedModel.csvData.length > 0 && (
                      <div>
                        <h4 className="text-sm font-bold text-slate-700 mb-3">最终轮次 (Epoch) 损失与验证数据</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                            <thead className="bg-slate-100 text-slate-600">
                              <tr>
                                <th className="px-3 py-2">Epoch</th>
                                <th className="px-3 py-2">Box Loss</th>
                                <th className="px-3 py-2">Cls Loss</th>
                                <th className="px-3 py-2">Dfl Loss</th>
                                <th className="px-3 py-2">Precision</th>
                                <th className="px-3 py-2">Recall</th>
                                <th className="px-3 py-2">mAP50</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {selectedModel.csvData.slice(-3).map((row, i) => (
                                <tr key={i} className="bg-white">
                                  <td className="px-3 py-2 font-mono">{row.epoch}</td>
                                  <td className="px-3 py-2 font-mono text-red-500">{Number(row.trainBoxLoss).toFixed(4)}</td>
                                  <td className="px-3 py-2 font-mono text-red-500">{Number(row.trainClsLoss).toFixed(4)}</td>
                                  <td className="px-3 py-2 font-mono text-red-500">{Number(row.trainDflLoss || 0).toFixed(4)}</td>
                                  <td className="px-3 py-2 font-mono text-emerald-600">{(Number(row.valPrecision) * (row.valPrecision <= 1 ? 100 : 1)).toFixed(2)}%</td>
                                  <td className="px-3 py-2 font-mono text-emerald-600">{(Number(row.valRecall) * (row.valRecall <= 1 ? 100 : 1)).toFixed(2)}%</td>
                                  <td className="px-3 py-2 font-mono text-indigo-600">{(Number(row.valMap50 || 0) * ((row.valMap50 || 0) <= 1 ? 100 : 1)).toFixed(2)}%</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                 </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* 修改信息模态窗 */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">修改模型信息</h3>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">模型名称</label><input required className="w-full border rounded-lg px-3 py-2 text-sm" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} /></div>
              <div><label className="block text-sm font-medium mb-1">描述</label><textarea className="w-full border rounded-lg px-3 py-2 text-sm h-20" value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})}></textarea></div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded text-sm">取消</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded text-sm">保存</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 更新文件模态窗 */}
      {showUpdateFileModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">更新模型文件 (迭代版本)</h3>
            <form onSubmit={handleUpdateFileSubmit} className="space-y-4">
              <div className="bg-indigo-50 text-indigo-800 text-xs p-3 rounded-lg flex items-start gap-2 border border-indigo-100">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>上传新包后将自动重新提取指标与图表，并将当前版本从 <b>{selectedModel?.version}</b> 自动递增 1。模型原名称和描述将保留。</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">选择新训练包</label>
                <input type="file" required accept=".zip,.rar,.7z" className="w-full border rounded-lg px-3 py-2 text-sm" onChange={e => setUpdateFile(e.target.files?.[0] || null)} />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowUpdateFileModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded text-sm">取消</button>
                <button type="submit" disabled={isUpdating} className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded text-sm flex items-center">{isUpdating ? '解压解析中...' : '确认更新'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 className="w-6 h-6" /></div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">确认删除该模型？</h3>
            <p className="text-sm text-slate-500 mb-6">您将永久删除 "{selectedModel?.name}"。其关联的文件和图表都将被清理，此操作不可逆。</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium w-full">取消</button>
              <button onClick={handleDeleteModel} className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg text-sm font-medium w-full">确认删除</button>
            </div>
          </div>
        </div>
      )}

      {/* 上传新模型弹窗 */}
      {showUploadModal && <UploadModal onClose={() => setShowUploadModal(false)} onRefresh={loadModels} />}
    </div>
  );
};

const UploadModal = ({ onClose, onRefresh }: { onClose: () => void, onRefresh: () => void }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', target: '', desc: '' });
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return alert('请选择模型文件');
    setLoading(true);
    try {
      await api.uploadModel({ ...formData, file });
      onRefresh();
      onClose();
    } catch (e) { alert('上传失败'); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">上传模型</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">模型名称</label><input required className="w-full border rounded-lg px-3 py-2 text-sm" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
          <div><label className="block text-sm font-medium mb-1">检测目标</label><input required className="w-full border rounded-lg px-3 py-2 text-sm" value={formData.target} onChange={e => setFormData({...formData, target: e.target.value})} /></div>
          <div><label className="block text-sm font-medium mb-1">选择文件</label>
            <input type="file" required accept=".zip,.rar,.7z" className="w-full border rounded-lg px-3 py-2 text-sm" onChange={e => setFile(e.target.files?.[0] || null)} />
            <p className="text-[10px] text-slate-500 mt-1">请打包上传包含 best.pt、args.yaml、results.csv 等文件的 YOLO 训练文件夹 (支持 .zip, .rar, .7z)。</p>
          </div>
          <div><label className="block text-sm font-medium mb-1">描述</label><textarea className="w-full border rounded-lg px-3 py-2 text-sm h-20" value={formData.desc} onChange={e => setFormData({...formData, desc: e.target.value})}></textarea></div>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded text-sm">取消</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded text-sm flex items-center">{loading ? '解压解析中...' : '确认上传'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
