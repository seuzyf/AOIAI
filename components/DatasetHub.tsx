import React, { useState, useEffect } from 'react';
import { FolderArchive, Calendar, Trash2, HardDrive, Target, Layers, Download, X, BarChart2, Activity, Server, Layout, Search, Settings } from 'lucide-react';
import { Dataset, UserInfo, Sample, GlobalClass } from '../types';
import { api } from '../api';

export const DatasetHub: React.FC<{ currentUser: UserInfo }> = ({ currentUser }) => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [globalClasses, setGlobalClasses] = useState<GlobalClass[]>([]);
  const [allSamples, setAllSamples] = useState<Sample[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyMine, setShowOnlyMine] = useState(false);

  useEffect(() => { 
    loadData(); 
    loadClasses();
  }, []);
  
  const loadData = async () => { 
    try { 
      setDatasets(await api.getDatasets()); 
      setAllSamples(await api.getSamples());
    } catch(e){} 
  };
  
  const loadClasses = async () => { 
    try { setGlobalClasses(await api.getClasses()); } catch(e){} 
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if(!confirm('确定永久删除该数据集吗？')) return;
      await api.deleteDatasets([id]);
      loadData();
  }

  const handleDownload = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      window.open(`/api/datasets/${id}/download`, '_blank');
  }

  const getRealSampleCount = (ds: Dataset) => {
    if (!ds.sampleIds) return 0;
    return allSamples.filter(s => ds.sampleIds?.includes(s.id)).length;
  };

  const visibleDatasets = datasets.filter(ds => {
    const isMine = ds.creator.includes(currentUser.name) || ds.creator.includes(currentUser.id);
    
    if (currentUser.role !== 'admin' && !isMine) return false;
    if (currentUser.role === 'admin' && showOnlyMine && !isMine) return false;

    if (searchTerm) {
      const terms = searchTerm.toLowerCase().split(/\s+/).filter(Boolean);
      const isMatch = terms.every(term => {
        const matchName = ds.name.toLowerCase().includes(term);
        // 支持对中文缺陷名和英文Code进行双向搜索匹配
        const matchTags = ds.tags.some(t => {
          const cls = globalClasses.find(c => c.code === t);
          const mappedName = cls ? cls.name.toLowerCase() : '';
          return t.toLowerCase().includes(term) || mappedName.includes(term);
        });
        const matchDevices = ds.devices?.some(d => d.toLowerCase().includes(term));
        const matchLines = ds.lines?.some(l => l.toLowerCase().includes(term));
        return matchName || matchTags || matchDevices || matchLines;
      });
      if (!isMatch) return false;
    }
    return true;
  });

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-800 flex items-center">
          <FolderArchive className="w-6 h-6 mr-2 text-indigo-600" />
          数据集管理
        </h2>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 mb-6 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="搜索数据集名称、缺陷类型(中英皆可)、产线或设备..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-transparent hover:border-slate-200 rounded-lg text-sm focus:bg-white focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {currentUser.role === 'admin' && (
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer hover:text-slate-800 bg-slate-50 hover:bg-slate-100 px-4 py-2 rounded-lg transition-colors border border-slate-100">
            <input
              type="checkbox"
              checked={showOnlyMine}
              onChange={(e) => setShowOnlyMine(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
            />
            <span className="font-medium">只看我创建的</span>
          </label>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pb-6">
        {visibleDatasets.map(ds => {
          // 将内部的英文字符串Tag映射为带中文显示的名称
          const displayTags = ds.tags.map(t => {
            const cls = globalClasses.find(c => c.code === t);
            return cls ? cls.name.split(' ')[0] : t;
          });

          return (
            <div 
              key={ds.id} 
              onClick={() => setSelectedDataset(ds)}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-all relative cursor-pointer group hover:border-indigo-300"
            >
               <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                 <button onClick={(e) => handleDownload(e, ds.id)} className="p-1.5 text-indigo-500 hover:text-white hover:bg-indigo-500 rounded transition-colors bg-white" title="打包下载数据集">
                    <Download className="w-4 h-4" />
                 </button>
                 
                 <button onClick={(e) => handleDelete(e, ds.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors bg-white" title="删除数据集">
                    <Trash2 className="w-4 h-4" />
                 </button>
               </div>
               
               <div className="flex items-start gap-3 mb-4">
                  <div className="bg-indigo-50 p-3 rounded-lg text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors"><FolderArchive className="w-6 h-6" /></div>
                  <div className="pr-16">
                     <h3 className="font-bold text-slate-800 text-lg truncate" title={ds.name}>{ds.name}</h3>
                     <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded border">{ds.version || 'v1.0'}</span>
                  </div>
               </div>
               
               <div className="space-y-3 mb-4 text-sm">
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                     <span className="text-slate-500 flex items-center"><Layers className="w-4 h-4 mr-2"/> 实际样本</span>
                     <span className="font-bold text-slate-800">{getRealSampleCount(ds)} 张</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                     <span className="text-slate-500 flex items-center"><Target className="w-4 h-4 mr-2"/> 包含缺陷</span>
                     <span className="font-medium text-slate-700 truncate w-32 text-right" title={displayTags.join(', ')}>
                        {displayTags.length > 0 ? displayTags.join(', ') : '无标注'}
                     </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                     <span className="text-slate-500 flex items-center"><HardDrive className="w-4 h-4 mr-2"/> 涵盖维度</span>
                     <span className="font-medium text-slate-700 truncate w-32 text-right">
                        {ds.devices?.length || 0}设备 / {ds.processes?.length || 0}工序
                     </span>
                  </div>
               </div>
  
               <div className="flex items-center justify-between text-xs text-slate-400 mt-4 pt-2">
                  <span className="flex items-center"><Calendar className="w-4 h-4 mr-1"/> {ds.createDate}</span>
                  <span className="truncate w-24 text-right">创建人: {ds.creator.split(' ')[0]}</span>
               </div>
            </div>
          );
        })}
        
        {visibleDatasets.length === 0 && (
          <div className="col-span-full py-20 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
             <FolderArchive className="w-12 h-12 mx-auto mb-4 opacity-20" />
             <p>{datasets.length === 0 ? '暂无固化的数据集，请前往【样本资源库】制作' : '没有匹配到相关的数据集'}</p>
          </div>
        )}
      </div>

      {selectedDataset && (
        <DatasetDetailsModal 
          dataset={selectedDataset} 
          globalClasses={globalClasses} 
          onClose={() => setSelectedDataset(null)} 
        />
      )}
    </div>
  )
}

const DatasetDetailsModal = ({ dataset, globalClasses, onClose }: { dataset: Dataset, globalClasses: GlobalClass[], onClose: () => void }) => {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSamples = async () => {
      try {
        const allSamples = await api.getSamples();
        const dsSamples = allSamples.filter(s => dataset.sampleIds?.includes(s.id));
        setSamples(dsSamples);
      } catch (e) {
        console.error("加载样本失败", e);
      } finally {
        setLoading(false);
      }
    };
    fetchSamples();
  }, [dataset]);

  const defectStats: Record<string, number> = {};
  const deviceStats: Record<string, number> = {};
  const lineStats: Record<string, number> = {};
  const processStats: Record<string, number> = {}; 
  let unlabeledCount = 0;

  samples.forEach(s => {
    if (!s.defects || s.defects.length === 0) {
      unlabeledCount++;
    } else {
      s.defects.forEach(d => {
        defectStats[d] = (defectStats[d] || 0) + 1;
      });
    }
    deviceStats[s.device || '未知'] = (deviceStats[s.device || '未知'] || 0) + 1;
    lineStats[s.line || '未知'] = (lineStats[s.line || '未知'] || 0) + 1;
    processStats[s.process || '未知'] = (processStats[s.process || '未知'] || 0) + 1;
  });

  const totalSamples = samples.length;

  const renderProgressBar = (label: string, count: number, total: number, colorClass: string) => {
    const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
    return (
      <div className="mb-3 animate-in fade-in slide-in-from-bottom-2 duration-300" key={label}>
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-slate-700 font-medium truncate pr-4">{label}</span>
          <span className="text-slate-500 font-mono whitespace-nowrap">{count} 张 <span className="text-slate-400">({pct}%)</span></span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
          <div className={`h-full rounded-full transition-all duration-1000 ${colorClass}`} style={{ width: `${pct}%` }}></div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><BarChart2 className="w-6 h-6" /></div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                {dataset.name} 
                <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-200 font-bold">{dataset.version}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-4">
                <span>创建人: {dataset.creator}</span>
                <span>创建时间: {dataset.createDate}</span>
                <span>总关联样本: <b className="text-indigo-600">{totalSamples}</b> 张</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400 space-y-3">
               <Activity className="w-8 h-8 animate-spin" />
               <p className="text-sm">正在聚合样本维度数据...</p>
            </div>
          ) : samples.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-amber-500 bg-amber-50 rounded-xl border border-amber-100">
               <p className="font-bold mb-2">未找到实体样本</p>
               <p className="text-xs text-amber-600">该数据集关联的所有物理样本可能均已被删除。</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              
              <div className="col-span-1">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
                  <Target className="w-4 h-4 text-rose-500" />
                  <h4 className="font-bold text-slate-800 text-sm">缺陷标签分布</h4>
                </div>
                <div className="space-y-1">
                  {Object.entries(defectStats).sort((a, b) => b[1] - a[1]).map(([code, count]) => {
                    const cls = globalClasses.find(c => c.code === code);
                    const name = cls ? cls.name.split(' ')[0] : code;
                    return renderProgressBar(name, count, totalSamples, "bg-rose-500");
                  })}
                  {unlabeledCount > 0 && renderProgressBar("无缺陷 (背景/良品)", unlabeledCount, totalSamples, "bg-slate-400")}
                  {Object.keys(defectStats).length === 0 && unlabeledCount === 0 && <p className="text-xs text-slate-400">无标签数据</p>}
                </div>
              </div>

              <div className="col-span-1 border-l border-slate-100 pl-6">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
                  <Server className="w-4 h-4 text-blue-500" />
                  <h4 className="font-bold text-slate-800 text-sm">数据来源设备 (Device)</h4>
                </div>
                <div className="space-y-1">
                  {Object.entries(deviceStats).sort((a, b) => b[1] - a[1]).map(([device, count]) => (
                    renderProgressBar(device, count, totalSamples, "bg-blue-500")
                  ))}
                </div>
              </div>

              <div className="col-span-1 border-l border-slate-100 pl-6">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
                  <Layout className="w-4 h-4 text-emerald-500" />
                  <h4 className="font-bold text-slate-800 text-sm">归属产线 (Line)</h4>
                </div>
                <div className="space-y-1">
                  {Object.entries(lineStats).sort((a, b) => b[1] - a[1]).map(([line, count]) => (
                    renderProgressBar(line, count, totalSamples, "bg-emerald-500")
                  ))}
                </div>
              </div>

              <div className="col-span-1 border-l border-slate-100 pl-6">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
                  <Settings className="w-4 h-4 text-purple-500" />
                  <h4 className="font-bold text-slate-800 text-sm">归属工序 (Process)</h4>
                </div>
                <div className="space-y-1">
                  {Object.entries(processStats).sort((a, b) => b[1] - a[1]).map(([process, count]) => (
                    renderProgressBar(process, count, totalSamples, "bg-purple-500")
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  )
}