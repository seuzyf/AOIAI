import React, { useState, useEffect, useRef } from 'react';
import { Upload, FileUp, Search, Database, Loader2, Save, Trash2, Tag, ArrowLeft, Plus, Filter, CheckSquare, Square, FolderArchive, Image as ImageIcon, X } from 'lucide-react';
import { Sample, Annotation, GlobalClass, UserInfo } from '../types';
import { DEVICE_BRANDS, PROCESS_TYPES, LINE_TYPES } from '../constants';
import { api } from '../api';

export const SampleHub: React.FC<{ currentUser: UserInfo }> = ({ currentUser }) => {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [classes, setClasses] = useState<GlobalClass[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'editor'>('list');
  const [selectedSample, setSelectedSample] = useState<Sample | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ lines: [] as string[], processes: [] as string[], devices: [] as string[], defects: [] as string[] });

  const [uploadMode, setUploadMode] = useState<'none'|'batch'|'zip'>('none');
  const [datasetModalOpen, setDatasetModalOpen] = useState(false);
  const [addClassModalOpen, setAddClassModalOpen] = useState(false);

  useEffect(() => { loadData(); loadClasses(); }, []);

  const loadData = async () => { try { setSamples(await api.getSamples()); } catch (e) { console.error(e); } };
  const loadClasses = async () => { try { setClasses(await api.getClasses()); } catch (e) { console.error(e); } };

  const handleDeleteClass = async (id: string, name: string) => {
    if (!confirm(`确定要删除缺陷类型 [${name}] 吗？`)) return;
    await api.deleteClass(id);
    loadClasses();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确认删除该样本吗？')) return;
    await api.deleteSample(id);
    setSelectedIds(prev => { const next = new Set(prev); next.delete(id); return next; });
    loadData();
  };

  const filteredSamples = samples.filter(s => {
    const matchSearch = s.filename.toLowerCase().includes(searchTerm.toLowerCase());
    const matchLine = filters.lines.length === 0 || filters.lines.includes(s.line);
    const matchProcess = filters.processes.length === 0 || filters.processes.includes(s.process);
    const matchDevice = filters.devices.length === 0 || filters.devices.includes(s.device);
    const matchDefect = filters.defects.length === 0 || s.defects.some(d => filters.defects.includes(d));
    return matchSearch && matchLine && matchProcess && matchDevice && matchDefect;
  });

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredSamples.length && filteredSamples.length > 0) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredSamples.map(s => s.id)));
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  if (viewMode === 'editor' && selectedSample) {
    return <RealAnnotationEditor sample={selectedSample} globalClasses={classes} onBack={() => { setViewMode('list'); loadData(); }} />;
  }

  return (
    <div className="flex flex-col h-full space-y-6 animate-in fade-in duration-500 relative">
      <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3 text-sm text-indigo-900 overflow-x-auto">
          <Database className="w-4 h-4 text-indigo-600 shrink-0" />
          <span className="font-semibold shrink-0">当前全局缺陷定义:</span>
          <div className="flex gap-2">
            {classes.map(cls => (
              <div key={cls.id} style={{ borderColor: cls.color, color: cls.color }} className="px-2 py-0.5 bg-white rounded border text-xs font-bold whitespace-nowrap flex items-center gap-1.5 group transition-all">
                 {cls.name} 
                 {/* 权限判断：仅管理员可删除全局缺陷类型 */}
                 {currentUser.role === 'admin' && (
                   <button onClick={() => handleDeleteClass(String(cls.id), cls.name)} className="opacity-0 w-0 group-hover:w-auto overflow-hidden group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 rounded-full transition-all duration-200" title="删除该分类">
                     <X className="w-3 h-3" />
                   </button>
                 )}
              </div>
            ))}
          </div>
        </div>
        <button onClick={() => setAddClassModalOpen(true)} className="shrink-0 flex items-center px-3 py-1.5 bg-white border border-indigo-200 text-indigo-600 rounded-md text-xs font-bold hover:bg-indigo-600 hover:text-white transition-colors ml-4 shadow-sm">
          <Plus className="w-3 h-3 mr-1" /> 新增缺陷类型
        </button>
      </div>

      <div className="flex items-center gap-4">
        <button onClick={() => setUploadMode('batch')} className="flex-1 border-2 border-dashed border-slate-300 rounded-xl py-4 flex flex-col items-center justify-center text-slate-500 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group">
          <Upload className="w-6 h-6 mb-2 text-slate-400 group-hover:text-indigo-600" />
          <span className="font-medium text-slate-700">批量上传本地图片</span>
        </button>
        <button onClick={() => setUploadMode('zip')} className="flex-1 border-2 border-dashed border-slate-300 rounded-xl py-4 flex flex-col items-center justify-center text-slate-500 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group">
          <FileUp className="w-6 h-6 mb-2 text-slate-400 group-hover:text-indigo-600" />
          <span className="font-medium text-slate-700">导入 YOLO 格式 ZIP 压缩包</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col flex-1 overflow-hidden relative">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/30">
          <div className="flex items-center gap-3">
             <div className="relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
               <input type="text" placeholder="搜索文件名..." className="pl-9 pr-3 py-1.5 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
             </div>
             <button onClick={() => setShowFilters(!showFilters)} className={`px-3 py-1.5 text-sm border rounded-md flex items-center transition-colors ${showFilters ? 'bg-indigo-100 border-indigo-300 text-indigo-700' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'}`}>
                <Filter className="w-4 h-4 mr-2" /> 多条件筛选
             </button>
          </div>
          
          <div className="flex items-center gap-3">
             {selectedIds.size > 0 && <span className="text-sm text-indigo-600 font-bold bg-indigo-50 px-3 py-1 rounded-full">已选 {selectedIds.size} 项</span>}
             <button disabled={selectedIds.size === 0} onClick={() => setDatasetModalOpen(true)} className="px-4 py-1.5 text-sm font-bold bg-indigo-600 text-white rounded-md flex items-center shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed">
                <FolderArchive className="w-4 h-4 mr-2" /> 制作数据集
             </button>
          </div>
        </div>

        {showFilters && (
          <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-4 gap-6">
            <div>
              <p className="text-xs font-bold text-slate-500 mb-2">产品线 (LineType)</p>
              <div className="flex flex-col gap-2">{LINE_TYPES.map(l => (
                   <label key={l} className="flex items-center text-sm gap-1 cursor-pointer">
                     <input type="checkbox" checked={filters.lines.includes(l)} onChange={(e) => setFilters(f => ({ ...f, lines: e.target.checked ? [...f.lines, l] : f.lines.filter(x => x !== l) }))} className="text-indigo-600 rounded" /> {l}
                   </label>
                ))}</div>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 mb-2">工序 (ProcessType)</p>
              <div className="flex flex-col gap-2">{PROCESS_TYPES.map(p => (
                   <label key={p} className="flex items-center text-sm gap-1 cursor-pointer">
                     <input type="checkbox" checked={filters.processes.includes(p)} onChange={(e) => setFilters(f => ({ ...f, processes: e.target.checked ? [...f.processes, p] : f.processes.filter(x => x !== p) }))} className="text-indigo-600 rounded" /> {p}
                   </label>
                ))}</div>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 mb-2">设备 (Device)</p>
              <div className="flex flex-col gap-2">{DEVICE_BRANDS.map(d => (
                   <label key={d} className="flex items-center text-sm gap-1 cursor-pointer">
                     <input type="checkbox" checked={filters.devices.includes(d)} onChange={(e) => setFilters(f => ({ ...f, devices: e.target.checked ? [...f.devices, d] : f.devices.filter(x => x !== d) }))} className="text-indigo-600 rounded" /> {d}
                   </label>
                ))}</div>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 mb-2">包含缺陷</p>
              <div className="flex flex-col gap-2">{classes.map(c => (
                   <label key={c.id} className="flex items-center text-sm gap-1 cursor-pointer">
                     <input type="checkbox" checked={filters.defects.includes(c.code)} onChange={(e) => setFilters(f => ({ ...f, defects: e.target.checked ? [...f.defects, c.code] : f.defects.filter(x => x !== c.code) }))} className="text-indigo-600 rounded" /> {c.name.split(' ')[0]}
                   </label>
                ))}</div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-medium sticky top-0 z-10 border-b border-slate-200 shadow-sm">
              <tr>
                <th className="px-4 py-3 w-10">
                   <button onClick={toggleSelectAll} className="text-slate-400 hover:text-indigo-600 flex items-center justify-center">
                     {selectedIds.size === filteredSamples.length && filteredSamples.length > 0 ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                   </button>
                </th>
                <th className="px-6 py-3">预览</th>
                <th className="px-6 py-3">文件名</th>
                <th className="px-6 py-3">属性信息</th>
                <th className="px-6 py-3">标注信息</th>
                <th className="px-6 py-3">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {samples.length === 0 ? (
                <tr className="bg-amber-50/40">
                  <td className="px-4 py-3"><Square className="w-5 h-5 text-slate-300" /></td>
                  <td className="px-6 py-3"><div className="w-12 h-12 rounded bg-slate-200 border border-slate-300 flex items-center justify-center"><ImageIcon className="w-5 h-5 text-slate-400"/></div></td>
                  <td className="px-6 py-3 font-medium text-slate-500">示例_请先在上方上传真实数据.jpg</td>
                  <td className="px-6 py-3 text-xs text-slate-400">线体: 示例 <br/> 工序: 示例 <br/> 设备: 示例</td>
                  <td className="px-6 py-3"><span className="px-2 py-0.5 rounded text-[10px] bg-slate-200 text-slate-500">示例状态</span></td>
                  <td className="px-6 py-3 text-xs text-slate-400">仅供演示</td>
                </tr>
              ) : filteredSamples.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-400">没有符合条件的样本数据</td></tr>
              ) : filteredSamples.map((sample) => (
                <tr key={sample.id} className={`hover:bg-slate-50 transition-colors ${selectedIds.has(sample.id) ? 'bg-indigo-50/30' : ''}`}>
                  <td className="px-4 py-3">
                     <button onClick={() => toggleSelect(sample.id)} className="text-slate-400 hover:text-indigo-600 flex items-center justify-center">
                       {selectedIds.has(sample.id) ? <CheckSquare className="w-5 h-5 text-indigo-600" /> : <Square className="w-5 h-5" />}
                     </button>
                  </td>
                  <td className="px-6 py-3"><img src={sample.thumbnailUrl} alt="thumbnail" className="w-12 h-12 rounded object-cover border bg-slate-100" /></td>
                  <td className="px-6 py-3 font-medium text-slate-900 break-all w-64">{sample.filename}</td>
                  <td className="px-6 py-3">
                     <div className="flex flex-col gap-1 text-xs text-slate-500">
                        <span>线体: {sample.line}</span>
                        <span>工序: {sample.process}</span>
                        <span>设备: {sample.device}</span>
                     </div>
                  </td>
                  <td className="px-6 py-3">
                     <div className="flex flex-wrap gap-1">
                        {sample.defects?.length > 0 ? sample.defects.map(d => {
                           const c = classes.find(cls => cls.code === d);
                           return <span key={d} style={{ backgroundColor: c?.color || '#cbd5e1', color: '#fff' }} className="px-2 py-0.5 rounded text-[10px] font-bold">{c ? c.name.split(' ')[0] : d}</span>
                        }) : <span className="text-slate-400 italic">未标注</span>}
                     </div>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setSelectedSample(sample); setViewMode('editor'); }} className="text-indigo-600 hover:text-indigo-800 font-medium px-3 py-1 bg-indigo-50 rounded text-xs">标注</button>
                      {/* 权限判断：技师不能删除样本数据 */}
                      {currentUser.role !== 'technician' && (
                        <button onClick={() => handleDelete(sample.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded"><Trash2 className="w-4 h-4" /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {uploadMode !== 'none' && <UploadModal mode={uploadMode} onClose={() => setUploadMode('none')} onRefresh={loadData} />}
      {datasetModalOpen && <DatasetModal currentUser={currentUser} selectedIds={Array.from(selectedIds)} onClose={() => setDatasetModalOpen(false)} onSuccess={() => { setDatasetModalOpen(false); setSelectedIds(new Set()); alert('数据集制作成功！'); }} />}
      {addClassModalOpen && <AddClassModal onClose={() => setAddClassModalOpen(false)} onSuccess={loadClasses} />}
    </div>
  );
};

const AddClassModal = ({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) => {
  const [zhName, setZhName] = useState('');
  const [enCode, setEnCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const color = `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`;
      const fullName = `${zhName} (${enCode})`;
      await api.addClass({ name: fullName, code: enCode.toUpperCase(), color });
      onSuccess();
      onClose();
    } catch(err) { alert('添加失败'); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
       <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 border-t-4 border-indigo-600 animate-in zoom-in-95 duration-200">
         <div className="flex justify-between items-center mb-4">
           <h3 className="text-lg font-bold text-slate-900">新增缺陷类型</h3>
           <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
         </div>
         <form onSubmit={handleSubmit} className="space-y-4">
           <div>
             <label className="block text-xs font-bold text-slate-700 mb-1">缺陷中文名</label>
             <input required placeholder="例如: 极性错误" className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={zhName} onChange={e => setZhName(e.target.value)} />
           </div>
           <div>
             <label className="block text-xs font-bold text-slate-700 mb-1">英文代号 (Code)</label>
             <input required placeholder="例如: POLARITY" className="w-full border rounded-lg px-3 py-2 text-sm uppercase focus:ring-2 focus:ring-indigo-500 outline-none font-mono" value={enCode} onChange={e => setEnCode(e.target.value)} />
             <p className="text-[10px] text-slate-500 mt-1">用于代码和模型训练时的标签映射，建议全大写。</p>
           </div>
           <div className="flex justify-end gap-3 mt-6">
             <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded text-sm">取消</button>
             <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded text-sm font-medium">{loading ? '保存中...' : '保存分类'}</button>
           </div>
         </form>
       </div>
    </div>
  )
}

const UploadModal = ({ mode, onClose, onRefresh }: { mode: 'batch'|'zip', onClose: () => void, onRefresh: () => void }) => {
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState({ device: DEVICE_BRANDS[0], process: PROCESS_TYPES[0], line: LINE_TYPES[0] });
  const [files, setFiles] = useState<FileList | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!files || files.length === 0) return alert('请选择文件');
    setLoading(true);
    try {
      if (mode === 'batch') await api.uploadBatch(files, meta);
      else await api.uploadZip(files[0], meta);
      onRefresh();
      onClose();
    } catch (e) { alert('上传失败'); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">{mode === 'batch' ? '批量上传本地图片' : '导入 YOLO ZIP'}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">产品线 (LineType)</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm" value={meta.line} onChange={e=>setMeta({...meta, line: e.target.value})}>
                {LINE_TYPES.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">工序 (ProcessType)</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm" value={meta.process} onChange={e=>setMeta({...meta, process: e.target.value})}>
                {PROCESS_TYPES.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">设备类型 (DeviceBrand)</label>
            <select className="w-full border rounded-lg px-3 py-2 text-sm" value={meta.device} onChange={e=>setMeta({...meta, device: e.target.value})}>
              {DEVICE_BRANDS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">选择文件</label>
            <input 
              type="file" 
              required 
              multiple={mode === 'batch'} 
              accept={mode === 'zip' ? '.zip,.rar,.7z' : 'image/*'} 
              className="w-full border rounded-lg px-3 py-2 text-sm" 
              onChange={e => setFiles(e.target.files)} 
            />
            {mode === 'zip' && (
              <p className="text-[10px] text-slate-400 mt-1">
                支持上传 .zip, .rar, .7z 格式的压缩包
              </p>
            )}
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded text-sm">取消</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded text-sm flex items-center">
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} {loading ? '处理中...' : '确认上传'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DatasetModal = ({ selectedIds, onClose, onSuccess, currentUser }: { selectedIds: string[], onClose: () => void, onSuccess: () => void, currentUser: UserInfo }) => {
  const [formData, setFormData] = useState({ name: '', version: 'v1.0.0', date: new Date().toISOString().split('T')[0] });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 在这里强制带上 creator 字段传给 API，覆盖后端的 '当前用户' 默认值
      await api.createDataset({ 
        ...formData, 
        sampleIds: selectedIds,
        creator: `${currentUser.name} ${currentUser.id}`
      });
      onSuccess();
    } catch(e) { alert('创建失败'); } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 border-t-4 border-indigo-600">
        <h3 className="text-lg font-bold text-slate-900 mb-2">制作数据集</h3>
        <p className="text-sm text-slate-500 mb-4">将当前选中的 {selectedIds.length} 张样本打包固化至数据库。</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-xs font-bold text-slate-700 mb-1">数据集命名</label><input required className="w-full border rounded-lg px-3 py-2 text-sm" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
          <div><label className="block text-xs font-bold text-slate-700 mb-1">版本号</label><input required className="w-full border rounded-lg px-3 py-2 text-sm" value={formData.version} onChange={e => setFormData({...formData, version: e.target.value})} /></div>
          <div><label className="block text-xs font-bold text-slate-700 mb-1">创建日期</label><input type="date" required className="w-full border rounded-lg px-3 py-2 text-sm" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} /></div>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded text-sm">取消</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded text-sm flex items-center">确认生成</button>
          </div>
        </form>
      </div>
    </div>
  )
}

const RealAnnotationEditor: React.FC<{ sample: Sample, globalClasses: GlobalClass[], onBack: () => void }> = ({ sample, globalClasses, onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [annotations, setAnnotations] = useState<Annotation[]>(sample.annotations || []);
  const [activeClass, setActiveClass] = useState<string>(globalClasses[0]?.code || 'UNKNOWN');
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  const [imgObj, setImgObj] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.src = sample.thumbnailUrl;
    img.onload = () => {
      if (canvasRef.current) {
         canvasRef.current.width = img.naturalWidth;
         canvasRef.current.height = img.naturalHeight;
      }
      setImgObj(img); 
      redraw(img, annotations, null); 
    };
  }, [sample.thumbnailUrl]);

  const redraw = (img: HTMLImageElement | null, rects: Annotation[], drawingRect: any) => {
    const canvas = canvasRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    rects.forEach(rect => {
      const cls = globalClasses.find(c => c.code === rect.label);
      const color = cls ? cls.color : '#eab308';
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.strokeRect(rect.bbox.x, rect.bbox.y, rect.bbox.width, rect.bbox.height);
      ctx.fillStyle = color;
      ctx.font = 'bold 24px Arial';
      ctx.fillText(cls ? cls.name.split(' ')[0] : rect.label, rect.bbox.x, rect.bbox.y > 25 ? rect.bbox.y - 10 : rect.bbox.y + 25);
    });

    if (drawingRect) {
      const activeCls = globalClasses.find(c => c.code === activeClass);
      ctx.strokeStyle = activeCls ? activeCls.color : '#ef4444';
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 10]);
      ctx.strokeRect(drawingRect.x, drawingRect.y, drawingRect.width, drawingRect.height);
      ctx.setLineDash([]);
    }
  };

  useEffect(() => {
    if (imgObj) {
      const drawingRect = isDrawing ? {
        x: Math.min(startPos.x, currentPos.x),
        y: Math.min(startPos.y, currentPos.y),
        width: Math.abs(currentPos.x - startPos.x),
        height: Math.abs(currentPos.y - startPos.y)
      } : null;
      redraw(imgObj, annotations, drawingRect);
    }
  }, [annotations, isDrawing, currentPos, imgObj, activeClass]);

  const getMousePos = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const pos = getMousePos(e);
    setStartPos(pos); setCurrentPos(pos); setIsDrawing(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => { if (isDrawing) setCurrentPos(getMousePos(e)); };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    const width = Math.abs(currentPos.x - startPos.x);
    const height = Math.abs(currentPos.y - startPos.y);
    
    if (width > 20 && height > 20) {
      const newAnnotation: Annotation = {
        id: `ann-${Date.now()}`,
        label: activeClass,
        bbox: { x: Math.min(startPos.x, currentPos.x), y: Math.min(startPos.y, currentPos.y), width, height }
      };
      setAnnotations([...annotations, newAnnotation]);
    }
  };

  const saveAnnotations = async () => {
    await api.annotateSample(sample.id, annotations);
    onBack();
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
      <div className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4">
         <div className="flex items-center gap-4">
           <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"><ArrowLeft className="w-5 h-5"/></button>
           <span className="font-bold text-slate-800 break-all">{sample.filename}</span>
         </div>
         <div className="flex items-center gap-3">
           <button onClick={() => setAnnotations([])} className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded text-sm flex items-center"><Trash2 className="w-4 h-4 mr-1"/> 清空</button>
           <button onClick={saveAnnotations} className="px-4 py-1.5 bg-indigo-600 text-white rounded shadow-sm text-sm font-medium flex items-center hover:bg-indigo-700"><Save className="w-4 h-4 mr-2"/> 保存标注</button>
         </div>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        <div className="w-56 bg-white border-r border-slate-200 p-4 flex flex-col gap-2 overflow-y-auto">
           <span className="text-xs font-bold text-slate-500 mb-2 uppercase">选择当前绘制标签</span>
           {globalClasses.map(cls => (
             <button 
               key={cls.id}
               onClick={() => setActiveClass(cls.code)}
               style={activeClass === cls.code ? { borderColor: cls.color, backgroundColor: `${cls.color}15`, color: cls.color } : {}}
               className={`px-3 py-2 rounded text-left text-sm flex items-center font-bold ${activeClass === cls.code ? 'border-2' : 'text-slate-600 hover:bg-slate-50 border-2 border-transparent'}`}
             >
               <Tag className="w-4 h-4 mr-2" style={{ color: cls.color }} /> {cls.name}
             </button>
           ))}
        </div>

        <div className="flex-1 bg-slate-200 flex items-center justify-center p-6 overflow-hidden">
            <div className="relative shadow-xl bg-white cursor-crosshair border-2 border-slate-300 w-full h-full flex items-center justify-center bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAAXNSR0IArs4c6QAAACVJREFUKFNjZCASMDKhuP///1/xM2ZmgIQZYRQYNSC1DAyUoQEA2m0H+Xg7rA0AAAAASUVORK5CYII=')]">
               <canvas 
                 ref={canvasRef}
                 onMouseDown={handleMouseDown}
                 onMouseMove={handleMouseMove}
                 onMouseUp={handleMouseUp}
                 onMouseLeave={handleMouseUp}
                 className="max-w-full max-h-full object-contain pointer-events-auto"
                 style={{ display: 'block' }}
               />
               {!imgObj && <div className="absolute inset-0 flex items-center justify-center text-slate-400 bg-white">Loading Image...</div>}
            </div>
        </div>
      </div>
    </div>
  );
};
