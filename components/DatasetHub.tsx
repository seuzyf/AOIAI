import React, { useState, useEffect } from 'react';
import { FolderArchive, Calendar, Trash2, HardDrive, Target, Layers, Download } from 'lucide-react';
import { Dataset, UserInfo } from '../types';
import { api } from '../api';

export const DatasetHub: React.FC<{ currentUser: UserInfo }> = ({ currentUser }) => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);

  useEffect(() => { loadData(); }, []);
  const loadData = async () => { try { setDatasets(await api.getDatasets()); } catch(e){} };

  const handleDelete = async (id: string) => {
      if(!confirm('确定删除该数据集吗？')) return;
      await api.deleteDatasets([id]);
      loadData();
  }

  const handleDownload = (id: string) => {
      window.open(`/api/datasets/${id}/download`, '_blank');
  }

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-800 flex items-center">
          <FolderArchive className="w-6 h-6 mr-2 text-indigo-600" />
          我的数据集管理
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pb-6">
        {datasets.map(ds => (
          <div key={ds.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow relative">
             <div className="absolute top-4 right-4 flex items-center gap-2">
               <button onClick={() => handleDownload(ds.id)} className="p-1.5 text-indigo-500 hover:text-white hover:bg-indigo-500 rounded transition-colors" title="打包下载数据集">
                  <Download className="w-4 h-4" />
               </button>
               <button onClick={() => handleDelete(ds.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors" title="删除数据集">
                  <Trash2 className="w-4 h-4" />
               </button>
             </div>
             
             <div className="flex items-start gap-3 mb-4">
                <div className="bg-indigo-50 p-3 rounded-lg text-indigo-600"><FolderArchive className="w-6 h-6" /></div>
                <div>
                   <h3 className="font-bold text-slate-800 text-lg">{ds.name}</h3>
                   <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded border">{ds.version || 'v1.0'}</span>
                </div>
             </div>
             
             <div className="space-y-3 mb-4 text-sm">
                <div className="flex justify-between border-b border-slate-100 pb-2">
                   <span className="text-slate-500 flex items-center"><Layers className="w-4 h-4 mr-2"/> 样本数量</span>
                   <span className="font-bold text-slate-800">{ds.count} 张</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                   <span className="text-slate-500 flex items-center"><Target className="w-4 h-4 mr-2"/> 包含缺陷</span>
                   <span className="font-medium text-slate-700 truncate w-32 text-right" title={ds.tags.join(', ')}>
                      {ds.tags.length > 0 ? ds.tags.join(', ') : '无标注'}
                   </span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                   <span className="text-slate-500 flex items-center"><HardDrive className="w-4 h-4 mr-2"/> 设备/工序来源</span>
                   <span className="font-medium text-slate-700 truncate w-32 text-right">
                      {ds.devices?.length}设备 / {ds.processes?.length}工序
                   </span>
                </div>
             </div>

             <div className="flex items-center justify-between text-xs text-slate-400 mt-4">
                <span className="flex items-center"><Calendar className="w-4 h-4 mr-1"/> 创建于 {ds.createDate}</span>
                <span>创建人: {ds.creator}</span>
             </div>
          </div>
        ))}
        {datasets.length === 0 && (
          <div className="col-span-full py-20 text-center text-slate-400">
             <FolderArchive className="w-12 h-12 mx-auto mb-4 opacity-20" />
             <p>暂无固化的数据集，请前往样本资源库制作</p>
          </div>
        )}
      </div>
    </div>
  )
}
