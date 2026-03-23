import React, { useState, useEffect, useRef } from 'react';
import { Upload, FileUp, Search, Database, Loader2, Save, Trash2, Tag, ArrowLeft } from 'lucide-react';
import { GLOBAL_CLASSES } from '../constants';
import { Sample, Annotation, DefectType } from '../types';
import { api } from '../api';

export const SampleHub: React.FC = () => {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'editor'>('list');
  const [selectedSample, setSelectedSample] = useState<Sample | null>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const data = await api.getSamples();
      setSamples(data);
    } catch (e) { console.error("API error, make sure backend is running on 3001"); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const newSample = await api.uploadSample(file);
      setSamples([newSample, ...samples]);
    } catch (error) {
      alert('上传失败，请确保后台服务器运行在3001端口');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const filteredSamples = samples.filter(s => s.filename.toLowerCase().includes(searchTerm.toLowerCase()));

  if (viewMode === 'editor' && selectedSample) {
    return <RealAnnotationEditor sample={selectedSample} onBack={() => { setViewMode('list'); loadData(); }} />;
  }

  return (
    <div className="flex flex-col h-full space-y-6 animate-in fade-in duration-500">
      {/* 字典展示区 */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 flex items-center gap-3 text-sm text-indigo-900 shadow-sm">
        <Database className="w-4 h-4 text-indigo-600" />
        <span className="font-semibold">当前全局缺陷定义:</span>
        <div className="flex gap-2">
          {GLOBAL_CLASSES.map(cls => (
            <span key={cls.id} className="px-2 py-0.5 bg-white rounded border border-indigo-200 text-xs font-mono">{cls.name}</span>
          ))}
        </div>
      </div>

      {/* 真实上传区 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
        <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center text-slate-500 bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer group">
          {isUploading ? <Loader2 className="w-8 h-8 mb-2 text-indigo-600 animate-spin" /> : <Upload className="w-8 h-8 mb-2 text-slate-400 group-hover:text-indigo-600" />}
          <span className="font-medium text-slate-700">{isUploading ? '正在保存至 D:\\AOIplatform\\images...' : '上传本地图片'}</span>
        </div>
        <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center text-slate-500 bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-not-allowed opacity-60">
          <FileUp className="w-8 h-8 mb-2 text-slate-400" />
          <span className="font-medium text-slate-700">导入 Zip (待实现)</span>
        </div>
      </div>

      {/* 数据列表 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col flex-1 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/30">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="搜索文件名..." className="pl-9 pr-3 py-1.5 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-medium sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 border-b">预览</th>
                <th className="px-6 py-3 border-b">文件名</th>
                <th className="px-6 py-3 border-b">标注框数量</th>
                <th className="px-6 py-3 border-b">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSamples.map((sample) => (
                <tr key={sample.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3"><img src={sample.thumbnailUrl} alt="thumbnail" className="w-12 h-12 rounded object-cover border" /></td>
                  <td className="px-6 py-3 font-medium text-slate-900">{sample.filename}</td>
                  <td className="px-6 py-3 font-mono text-slate-600">{sample.annotations?.length || 0} 个目标</td>
                  <td className="px-6 py-3">
                    <button onClick={() => { setSelectedSample(sample); setViewMode('editor'); }} className="text-indigo-600 hover:text-indigo-800 font-medium px-3 py-1 bg-indigo-50 rounded">去标注 (画框)</button>
                  </td>
                </tr>
              ))}
              {filteredSamples.length === 0 && (<tr><td colSpan={4} className="text-center py-8 text-slate-400">本地暂无数据</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// 真实的 Canvas 画框标注器
const RealAnnotationEditor: React.FC<{ sample: Sample, onBack: () => void }> = ({ sample, onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [annotations, setAnnotations] = useState<Annotation[]>(sample.annotations || []);
  const [activeClass, setActiveClass] = useState<DefectType>(DefectType.SCRATCH);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  const [imgObj, setImgObj] = useState<HTMLImageElement | null>(null);

  // 加载图片并绘制
  useEffect(() => {
    const img = new Image();
    img.src = sample.thumbnailUrl;
    img.onload = () => {
      setImgObj(img);
      redraw(img, annotations, null);
    };
  }, [sample.thumbnailUrl]);

  // 重绘 Canvas
  const redraw = (img: HTMLImageElement | null, rects: Annotation[], drawingRect: any) => {
    const canvas = canvasRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 清空并绘制底图
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // 绘制已保存的框
    rects.forEach(rect => {
      ctx.strokeStyle = '#eab308'; // 黄色框
      ctx.lineWidth = 2;
      ctx.strokeRect(rect.bbox.x, rect.bbox.y, rect.bbox.width, rect.bbox.height);
      ctx.fillStyle = '#eab308';
      ctx.font = '12px Arial';
      ctx.fillText(rect.label, rect.bbox.x, rect.bbox.y - 5);
    });

    // 绘制正在画的框
    if (drawingRect) {
      ctx.strokeStyle = '#ef4444'; // 红色绘制中
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
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
  }, [annotations, isDrawing, currentPos, imgObj]);

  const getMousePos = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const pos = getMousePos(e);
    setStartPos(pos);
    setCurrentPos(pos);
    setIsDrawing(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    setCurrentPos(getMousePos(e));
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    const width = Math.abs(currentPos.x - startPos.x);
    const height = Math.abs(currentPos.y - startPos.y);
    
    // 忽略太小的点击
    if (width > 5 && height > 5) {
      const newAnnotation: Annotation = {
        id: `ann-${Date.now()}`,
        label: activeClass,
        bbox: {
          x: Math.min(startPos.x, currentPos.x),
          y: Math.min(startPos.y, currentPos.y),
          width, height
        }
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
           <span className="font-bold text-slate-800">{sample.filename}</span>
         </div>
         <div className="flex items-center gap-3">
           <button onClick={() => setAnnotations([])} className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded text-sm flex items-center"><Trash2 className="w-4 h-4 mr-1"/> 清空</button>
           <button onClick={saveAnnotations} className="px-4 py-1.5 bg-indigo-600 text-white rounded shadow-sm text-sm font-medium flex items-center hover:bg-indigo-700"><Save className="w-4 h-4 mr-2"/> 保存标注</button>
         </div>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        {/* 左侧工具栏 */}
        <div className="w-48 bg-white border-r border-slate-200 p-4 flex flex-col gap-2">
           <span className="text-xs font-bold text-slate-500 mb-2 uppercase">选择当前标签</span>
           {GLOBAL_CLASSES.map(cls => (
             <button 
               key={cls.id}
               onClick={() => setActiveClass(cls.code as DefectType)}
               className={`px-3 py-2 rounded text-left text-sm flex items-center ${activeClass === cls.code ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold' : 'text-slate-600 hover:bg-slate-50 border border-transparent'}`}
             >
               <Tag className="w-4 h-4 mr-2"/> {cls.name.split(' ')[0]}
             </button>
           ))}
        </div>

        {/* 画布区 */}
        <div className="flex-1 bg-slate-200 flex items-center justify-center p-6 overflow-auto" ref={containerRef}>
            <div className="relative shadow-xl bg-white cursor-crosshair border-2 border-slate-300">
               <canvas 
                 ref={canvasRef}
                 width={800} 
                 height={600} 
                 onMouseDown={handleMouseDown}
                 onMouseMove={handleMouseMove}
                 onMouseUp={handleMouseUp}
                 onMouseLeave={handleMouseUp}
                 style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
               />
               {!imgObj && <div className="absolute inset-0 flex items-center justify-center text-slate-400">Loading Image...</div>}
            </div>
        </div>
      </div>
    </div>
  );
};