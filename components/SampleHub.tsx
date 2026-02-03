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
  Database
} from 'lucide-react';
import { GLOBAL_CLASSES, MOCK_SAMPLES } from '../constants';
import { Sample, SampleStatus, DefectType, LineType } from '../types';

export const SampleHub: React.FC = () => {
  const [samples, setSamples] = useState<Sample[]>(MOCK_SAMPLES);
  const [viewMode, setViewMode] = useState<'list' | 'editor'>('list');
  const [selectedSample, setSelectedSample] = useState<Sample | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Filters
  const [filterLine, setFilterLine] = useState<string>('all');

  const handleImport = () => {
    setIsImporting(true);
    setTimeout(() => {
      setIsImporting(false);
      alert('正在解析 classes.txt... 将用户 ID 0 映射为全局 ID 101... 导入完成');
    }, 1500);
  };

  const startAnnotation = (sample: Sample) => {
    setSelectedSample(sample);
    setViewMode('editor');
  };

  const filteredSamples = samples.filter(s => {
    if (filterLine !== 'all' && s.line !== filterLine) return false;
    return true;
  });

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
      {/* A. Global Dictionary Header */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 flex items-center gap-3 text-sm text-indigo-900 shadow-sm">
        <Database className="w-4 h-4 text-indigo-600" />
        <span className="font-semibold">当前全局缺陷定义 (Global Class IDs):</span>
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
        <div 
          className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-slate-500 bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer group"
          onClick={() => alert('模拟: 打开文件选择器')}
        >
          <Upload className="w-10 h-10 mb-3 text-slate-400 group-hover:text-indigo-600 transition-colors" />
          <span className="font-medium text-slate-700">上传原始图片</span>
          <span className="text-xs text-slate-400 mt-1">支持 PNG, JPG (拖拽上传)</span>
        </div>

        <div 
          className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-slate-500 bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer group"
          onClick={handleImport}
        >
          {isImporting ? (
            <Loader2 className="w-10 h-10 mb-3 text-indigo-600 animate-spin" />
          ) : (
            <FileUp className="w-10 h-10 mb-3 text-slate-400 group-hover:text-indigo-600 transition-colors" />
          )}
          <span className="font-medium text-slate-700">
            {isImporting ? '正在解析元数据...' : '导入已有数据集 (.zip)'}
          </span>
          <span className="text-xs text-slate-400 mt-1">自动映射 Class ID (ETL)</span>
        </div>
      </div>

      {/* C. Data List & Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col flex-1 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="搜索文件名..." 
                className="pl-9 pr-3 py-1.5 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none w-48"
              />
            </div>
            <select 
              className="px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={filterLine}
              onChange={(e) => setFilterLine(e.target.value)}
            >
              <option value="all">全产线</option>
              <option value={LineType.WIRELESS}>无线</option>
              <option value={LineType.OPTICAL}>光</option>
            </select>
            <div className="h-4 w-[1px] bg-slate-300 mx-1"></div>
            <span className="text-xs text-slate-500">共 {filteredSamples.length} 条数据</span>
          </div>

          <button 
            onClick={() => setShowGenerateModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 shadow-sm transition-all flex items-center gap-2"
          >
            <Database className="w-4 h-4" />
            生成数据集
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-medium sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 border-b border-slate-200 w-24">预览</th>
                <th className="px-6 py-3 border-b border-slate-200">文件名 / ID</th>
                <th className="px-6 py-3 border-b border-slate-200">产线来源</th>
                <th className="px-6 py-3 border-b border-slate-200">缺陷标签</th>
                <th className="px-6 py-3 border-b border-slate-200">标注状态</th>
                <th className="px-6 py-3 border-b border-slate-200 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSamples.map((sample) => (
                <tr key={sample.id} className="hover:bg-slate-50 group">
                  <td className="px-6 py-3">
                    <img src={sample.thumbnailUrl} alt={sample.filename} className="w-12 h-12 rounded object-cover border border-slate-200 bg-slate-100" />
                  </td>
                  <td className="px-6 py-3">
                    <div className="font-medium text-slate-900">{sample.filename}</div>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">{sample.id}</div>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                      sample.line === LineType.WIRELESS ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                    }`}>
                      {sample.line === LineType.WIRELESS ? '无线' : '光'}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex flex-wrap gap-1">
                      {sample.defects.length > 0 ? sample.defects.map(d => {
                        const gc = GLOBAL_CLASSES.find(g => g.code === d);
                        return (
                          <span key={d} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs border border-slate-200 bg-white text-slate-600">
                            <span className={`w-1.5 h-1.5 rounded-full mr-1 ${gc?.color || 'bg-slate-400'}`}></span>
                            {gc?.name.split(' ')[0]}
                          </span>
                        );
                      }) : <span className="text-slate-400 text-xs italic">无缺陷</span>}
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    {sample.status === SampleStatus.LABELED ? (
                      <span className="flex items-center text-emerald-600 text-xs font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> 已标注
                      </span>
                    ) : (
                      <span className="flex items-center text-slate-400 text-xs">
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 mr-1"></div> 未标注
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <button 
                      onClick={() => startAnnotation(sample)}
                      className="text-indigo-600 hover:text-indigo-800 text-xs font-medium px-3 py-1.5 rounded bg-indigo-50 hover:bg-indigo-100 transition-colors"
                    >
                      去标注
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dataset Generation Modal (Mock) */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-600" /> 配置数据集生成
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">选择数据来源</label>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm rounded border border-indigo-200 cursor-pointer">无线 (Selected)</span>
                  <span className="px-3 py-1 bg-white text-slate-600 text-sm rounded border border-slate-200 cursor-pointer hover:bg-slate-50">光</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">包含缺陷类型</label>
                <div className="flex flex-wrap gap-2">
                   {GLOBAL_CLASSES.map(c => (
                     <label key={c.id} className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-1.5 rounded border border-slate-200">
                       <input type="checkbox" defaultChecked className="rounded text-indigo-600 focus:ring-indigo-500"/>
                       {c.name}
                     </label>
                   ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">
                  训练集 / 验证集划分 (80% / 20%)
                </label>
                <input type="range" className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" defaultValue={80} />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>Train: 400 样本</span>
                  <span>Val: 100 样本</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded text-xs text-slate-500 border border-slate-200">
                预计生成包大小: ~45 MB
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowGenerateModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded text-sm font-medium">取消</button>
              <button onClick={() => setShowGenerateModal(false)} className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded text-sm font-medium shadow-sm">
                确认打包
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Sub-Component: Annotation Editor ---

interface AnnotationEditorProps {
  sample: Sample;
  onBack: () => void;
}

const AnnotationEditor: React.FC<AnnotationEditorProps> = ({ sample, onBack }) => {
  return (
    <div className="flex h-[calc(100vh-8rem)] bg-slate-100 border border-slate-200 rounded-xl overflow-hidden shadow-sm animate-in slide-in-from-right-4">
      {/* Left Toolbar */}
      <div className="w-14 bg-white border-r border-slate-200 flex flex-col items-center py-4 gap-4 z-10">
        <button className="p-2 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 transition-colors" title="Select">
          <MoreHorizontal className="w-5 h-5" />
        </button>
        <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded transition-colors" title="Rectangle">
          <div className="w-4 h-4 border-2 border-current rounded-sm"></div>
        </button>
        <div className="flex-1"></div>
        <button className="p-2 text-slate-400 hover:text-slate-600" title="Zoom In">+</button>
        <button className="p-2 text-slate-400 hover:text-slate-600" title="Zoom Out">-</button>
      </div>

      {/* Center Canvas */}
      <div className="flex-1 bg-slate-900/95 relative overflow-hidden flex items-center justify-center p-8">
        <div className="relative shadow-2xl">
        <img 
          // 直接使用 sample 数据中的路径（即我们在 constants.ts 里配置的本地路径）
          src={sample.thumbnailUrl} 
          alt={sample.filename}
          className="max-w-full max-h-full block select-none"
          // 建议去掉强制的 width/height，让图片自适应，或者根据您图片的实际比例调整
          // style={{ width: '800px', height: '600px' }} 
        />
          
          {/* Mock Box 1 */}
          <div className="absolute border-2 border-red-500 bg-red-500/20" style={{ left: '30%', top: '25%', width: '15%', height: '10%' }}>
            <div className="absolute -top-6 left-0 bg-red-500 text-white text-[10px] px-1 py-0.5 rounded-t">
              划痕 (Scratch) 0.92
            </div>
          </div>

          {/* Mock Box 2 */}
          <div className="absolute border-2 border-yellow-500 bg-yellow-500/20" style={{ left: '60%', top: '55%', width: '8%', height: '8%' }}>
             <div className="absolute -top-6 left-0 bg-yellow-500 text-white text-[10px] px-1 py-0.5 rounded-t">
              开焊 (Soldering)
            </div>
          </div>
        </div>
      </div>

      {/* Right Properties Panel */}
      <div className="w-72 bg-white border-l border-slate-200 flex flex-col z-10">
        <div className="p-4 border-b border-slate-200 font-semibold text-slate-800">属性面板</div>
        
        <div className="p-4 space-y-6 flex-1 overflow-y-auto">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">当前选中</label>
            <div className="bg-slate-50 p-3 rounded border border-slate-200">
              <div className="text-sm font-medium text-slate-900 mb-1">Object #1</div>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 font-mono">
                <div>x: 0.300</div>
                <div>y: 0.250</div>
                <div>w: 0.150</div>
                <div>h: 0.100</div>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">类别 (Class)</label>
            <select className="w-full text-sm border border-slate-300 rounded px-2 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none">
              {GLOBAL_CLASSES.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <button 
            onClick={onBack}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition-colors font-medium text-sm shadow-sm"
          >
            <Save className="w-4 h-4" /> 保存并返回
          </button>
        </div>
      </div>
    </div>
  );
};
