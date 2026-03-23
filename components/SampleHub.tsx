import React, { useState } from 'react';
import { 
  Upload, 
  FileUp, 
  Search, 
  Filter, 
  Tag, 
  MoreHorizontal, 
  ArrowLeft, 
  Save, 
  CheckCircle2, 
  Loader2,
  Database,
  Trash2,
  Combine,
  LayoutGrid,
  List,
  CheckSquare,
  Square
} from 'lucide-react';
import { GLOBAL_CLASSES, MOCK_SAMPLES, MOCK_DATASETS } from '../constants';
import { Sample, SampleStatus, DefectType, LineType, Dataset, ProcessType, DeviceBrand } from '../types';

export const SampleHub: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'samples' | 'datasets'>('samples');
  
  // Sample State
  const [samples, setSamples] = useState<Sample[]>(MOCK_SAMPLES);
  const [viewMode, setViewMode] = useState<'list' | 'editor'>('list');
  const [selectedSample, setSelectedSample] = useState<Sample | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Dataset State
  const [datasets, setDatasets] = useState<Dataset[]>(MOCK_DATASETS);
  const [selectedDatasetIds, setSelectedDatasetIds] = useState<Set<string>>(new Set());
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [newDatasetName, setNewDatasetName] = useState('');

  // Enhanced Filters
  const [filters, setFilters] = useState({
    line: 'all',
    process: 'all',
    device: 'all',
    search: ''
  });

  const handleImport = () => {
    setIsImporting(true);
    setTimeout(() => {
      setIsImporting(false);
      alert('正在解析 classes.txt... 映射完成，新增 50 条数据');
    }, 1500);
  };

  const startAnnotation = (sample: Sample) => {
    setSelectedSample(sample);
    setViewMode('editor');
  };

  // 过滤逻辑
  const filteredSamples = samples.filter(s => {
    if (filters.line !== 'all' && s.line !== filters.line) return false;
    if (filters.process !== 'all' && s.process !== filters.process) return false;
    if (filters.device !== 'all' && s.device !== filters.device) return false;
    if (filters.search && !s.filename.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  // Dataset Actions
  const toggleDatasetSelection = (id: string) => {
    const newSet = new Set(selectedDatasetIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedDatasetIds(newSet);
  };

  const handleDeleteDatasets = () => {
    if (confirm(`确定要删除选中的 ${selectedDatasetIds.size} 个数据集吗？`)) {
      setDatasets(datasets.filter(d => !selectedDatasetIds.has(d.id)));
      setSelectedDatasetIds(new Set());
    }
  };

  const handleMergeDatasets = () => {
    if (!newDatasetName) return;
    const selected = datasets.filter(d => selectedDatasetIds.has(d.id));
    const totalCount = selected.reduce((acc, curr) => acc + curr.count, 0);
    const allTags = Array.from(new Set(selected.flatMap(d => d.tags)));
    
    const newDataset: Dataset = {
      id: `ds-${Date.now()}`,
      name: newDatasetName,
      count: totalCount,
      tags: [...allTags, '合并'],
      creator: '当前用户',
      createDate: new Date().toISOString().split('T')[0],
      description: `由 ${selected.map(d => d.name).join(', ')} 合并而成`
    };

    setDatasets([newDataset, ...datasets]);
    setShowMergeModal(false);
    setSelectedDatasetIds(new Set());
    setNewDatasetName('');
  };

  if (viewMode === 'editor' && selectedSample) {
    return (
      <AnnotationEditor 
        sample={selectedSample} 
        onBack={() => setViewMode('list')} 
      />
    );
  }

  return (
    <div className="flex flex-col h-full space-y-6 animate-in fade-in duration-500">
      
      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-4 border-b border-slate-200 pb-1">
        <button 
          onClick={() => setActiveSubTab('samples')}
          className={`px-4 py-2 text-sm font-medium transition-colors relative ${
            activeSubTab === 'samples' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          样本列表
          {activeSubTab === 'samples' && <div className="absolute bottom-[-5px] left-0 w-full h-0.5 bg-indigo-600"></div>}
        </button>
        <button 
          onClick={() => setActiveSubTab('datasets')}
          className={`px-4 py-2 text-sm font-medium transition-colors relative ${
            activeSubTab === 'datasets' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          数据集管理
          {activeSubTab === 'datasets' && <div className="absolute bottom-[-5px] left-0 w-full h-0.5 bg-indigo-600"></div>}
        </button>
      </div>

      {activeSubTab === 'samples' ? (
        /* --- SAMPLES VIEW --- */
        <>
          {/* A. Global Dictionary Header */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 flex items-center gap-3 text-sm text-indigo-900 shadow-sm">
            <Database className="w-4 h-4 text-indigo-600" />
            <span className="font-semibold">当前全局缺陷定义:</span>
            <div className="flex gap-2">
              {GLOBAL_CLASSES.map(cls => (
                <span key={cls.id} className="px-2 py-0.5 bg-white rounded border border-indigo-200 text-xs font-mono">
                  {cls.name} (ID:{cls.id})
                </span>
              ))}
            </div>
          </div>

          {/* B. Data Acquisition Area */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center text-slate-500 bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer group">
              <Upload className="w-8 h-8 mb-2 text-slate-400 group-hover:text-indigo-600 transition-colors" />
              <span className="font-medium text-slate-700">上传原始图片</span>
            </div>
            <div onClick={handleImport} className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center text-slate-500 bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer group">
              {isImporting ? <Loader2 className="w-8 h-8 mb-2 text-indigo-600 animate-spin" /> : <FileUp className="w-8 h-8 mb-2 text-slate-400 group-hover:text-indigo-600 transition-colors" />}
              <span className="font-medium text-slate-700">{isImporting ? '正在解析...' : '导入已有数据集 (.zip)'}</span>
            </div>
          </div>

          {/* C. Data List & Filter */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col flex-1 overflow-hidden">
            {/* Advanced Filters Toolbar */}
            <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-3 bg-slate-50/30">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="搜索文件名..." 
                  className="pl-9 pr-3 py-1.5 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 w-40"
                  value={filters.search}
                  onChange={e => setFilters({...filters, search: e.target.value})}
                />
              </div>

              <div className="h-6 w-[1px] bg-slate-300 mx-1"></div>

              {/* Filter: Line */}
              <select 
                className="px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                value={filters.line}
                onChange={(e) => setFilters({...filters, line: e.target.value})}
              >
                <option value="all">全产线</option>
                <option value={LineType.WIRELESS}>无线</option>
                <option value={LineType.OPTICAL}>光电</option>
              </select>

              {/* Filter: Process */}
              <select 
                className="px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                value={filters.process}
                onChange={(e) => setFilters({...filters, process: e.target.value})}
              >
                <option value="all">全部工序</option>
                <option value={ProcessType.SPI}>SPI (锡膏)</option>
                <option value={ProcessType.PRE_REFLOW}>炉前</option>
                <option value={ProcessType.POST_REFLOW}>炉后</option>
                <option value={ProcessType.DIP}>DIP (插件)</option>
                <option value={ProcessType.SMT}>SMT通用</option>
              </select>

              {/* Filter: Device */}
              <select 
                className="px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                value={filters.device}
                onChange={(e) => setFilters({...filters, device: e.target.value})}
              >
                <option value="all">全部设备</option>
                <option value={DeviceBrand.VCTA}>奔创 (VCTA)</option>
                <option value={DeviceBrand.SAKI}>Saki</option>
                <option value={DeviceBrand.SHENZHOU}>神州</option>
                <option value={DeviceBrand.JUTZE}>矩子</option>
                <option value={DeviceBrand.KOH_YOUNG}>Kyoung</option>
              </select>

              <div className="ml-auto text-xs text-slate-500">共 {filteredSamples.length} 条数据</div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-medium sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 border-b border-slate-200 w-20">预览</th>
                    <th className="px-6 py-3 border-b border-slate-200">文件名 / ID</th>
                    <th className="px-6 py-3 border-b border-slate-200">维度信息</th>
                    <th className="px-6 py-3 border-b border-slate-200">缺陷标签</th>
                    <th className="px-6 py-3 border-b border-slate-200">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSamples.map((sample) => (
                    <tr key={sample.id} className="hover:bg-slate-50 group">
                      <td className="px-6 py-3">
                        <img src={sample.thumbnailUrl} alt="thumbnail" className="w-10 h-10 rounded object-cover border border-slate-200 bg-slate-100" />
                      </td>
                      <td className="px-6 py-3">
                        <div className="font-medium text-slate-900">{sample.filename}</div>
                        <div className="text-xs text-slate-400 font-mono">{sample.id}</div>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-slate-600 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                            {sample.line === LineType.WIRELESS ? '无线' : '光电'} / {sample.process}
                          </span>
                          <span className="text-[10px] text-slate-400 border border-slate-200 rounded px-1 w-fit bg-slate-50">
                            设备: {sample.device}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex flex-wrap gap-1">
                          {sample.defects.length > 0 ? sample.defects.map(d => (
                             <span key={d} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs border border-slate-200 bg-white text-slate-600">
                               {GLOBAL_CLASSES.find(g => g.code === d)?.name.split(' ')[0]}
                             </span>
                          )) : <span className="text-slate-400 text-xs italic">无缺陷</span>}
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <button onClick={() => startAnnotation(sample)} className="text-indigo-600 hover:text-indigo-800 text-xs font-medium">去标注</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* --- DATASETS MANAGEMENT VIEW --- */
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col flex-1 overflow-hidden animate-in slide-in-from-right-2">
          {/* Toolbar */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
            <div className="flex items-center gap-2">
               <h3 className="font-bold text-slate-700">我的数据集</h3>
               <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{datasets.length}</span>
            </div>
            
            <div className="flex gap-3">
              {selectedDatasetIds.size > 0 && (
                <>
                  <button 
                    onClick={() => handleDeleteDatasets()}
                    className="px-3 py-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" /> 删除 ({selectedDatasetIds.size})
                  </button>
                  <button 
                    onClick={() => setShowMergeModal(true)}
                    className="px-3 py-1.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                  >
                    <Combine className="w-4 h-4" /> 合并生成新集
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Dataset Table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-medium sticky top-0">
                <tr>
                  <th className="px-6 py-3 border-b border-slate-200 w-12">
                     {/* Select All Checkbox Placeholder */}
                  </th>
                  <th className="px-6 py-3 border-b border-slate-200">数据集名称</th>
                  <th className="px-6 py-3 border-b border-slate-200">样本数量</th>
                  <th className="px-6 py-3 border-b border-slate-200">标签/特征</th>
                  <th className="px-6 py-3 border-b border-slate-200">创建信息</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {datasets.map((ds) => {
                  const isSelected = selectedDatasetIds.has(ds.id);
                  return (
                    <tr key={ds.id} className={`hover:bg-slate-50 transition-colors ${isSelected ? 'bg-indigo-50/30' : ''}`}>
                      <td className="px-6 py-4">
                        <button onClick={() => toggleDatasetSelection(ds.id)} className="focus:outline-none">
                          {isSelected ? <CheckSquare className="w-5 h-5 text-indigo-600" /> : <Square className="w-5 h-5 text-slate-300 hover:text-slate-400" />}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{ds.name}</div>
                        <div className="text-xs text-slate-400 truncate max-w-[200px]">{ds.description}</div>
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-600">{ds.count.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {ds.tags.map((tag, i) => (
                            <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-xs border border-slate-200">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        <div>{ds.creator}</div>
                        <div className="text-slate-400">{ds.createDate}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Merge Modal */}
      {showMergeModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95">
             <h3 className="text-lg font-bold text-slate-900 mb-2">合并数据集</h3>
             <p className="text-sm text-slate-500 mb-4">
               将选中的 <span className="font-bold text-indigo-600">{selectedDatasetIds.size}</span> 个数据集合并为一个新的数据集。
             </p>
             <input 
               autoFocus
               type="text" 
               className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
               placeholder="输入新数据集名称..."
               value={newDatasetName}
               onChange={e => setNewDatasetName(e.target.value)}
             />
             <div className="mt-6 flex justify-end gap-3">
               <button onClick={() => setShowMergeModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded text-sm font-medium">取消</button>
               <button 
                 onClick={handleMergeDatasets}
                 disabled={!newDatasetName}
                 className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded text-sm font-medium disabled:opacity-50"
               >
                 确认合并
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Annotation Editor (保持不变，省略具体实现以节省空间) ---
interface AnnotationEditorProps {
  sample: Sample;
  onBack: () => void;
}
const AnnotationEditor: React.FC<AnnotationEditorProps> = ({ sample, onBack }) => {
   return (
    <div className="flex flex-col items-center justify-center h-full bg-slate-100 rounded-lg">
      <div className="text-slate-500 mb-4">Annotation Editor Placeholder for {sample.filename}</div>
      <button onClick={onBack} className="px-4 py-2 bg-indigo-600 text-white rounded">Back</button>
    </div>
   )
};