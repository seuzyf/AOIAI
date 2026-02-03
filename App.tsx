import React, { useState } from 'react';
import { 
  BrainCircuit, 
  Database, 
  Settings, 
  UserCircle2, 
  ScanEye,
  Menu,
  ChevronRight
} from 'lucide-react';
import { SampleHub } from './components/SampleHub';
import { TrainingForge } from './components/TrainingForge';
import { AppTab } from './types';

function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('training');

  const menuItems = [
    { id: 'training', label: '模型选型库', icon: ScanEye },
    { id: 'samples', label: '样本资源库', icon: Database },
    { id: 'settings', label: '系统设置', icon: Settings },
  ];

  const getBreadcrumb = () => {
    switch (activeTab) {
      case 'training': return '模型选型库';
      case 'samples': return '样本资源库';
      case 'settings': return '系统设置';
      default: return '首页';
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shadow-xl z-20">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <div className="w-8 h-8 bg-red-700 rounded-lg flex items-center justify-center mr-3 shadow-lg shadow-indigo-900/50">
            <BrainCircuit className="text-white w-5 h-5" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">华为AI检测训练平台</span>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as AppTab)}
              className={`w-full flex items-center px-3 py-3 rounded-lg transition-all duration-200 group ${
                activeTab === item.id 
                  ? 'bg-red-700 text-white shadow-md' 
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon className={`w-5 h-5 mr-3 ${activeTab === item.id ? 'text-indigo-200' : 'text-slate-500 group-hover:text-slate-300'}`} />
              <span className="font-medium">{item.label}</span>
              {activeTab === item.id && <ChevronRight className="w-4 h-4 ml-auto text-indigo-300" />}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="bg-slate-800/50 rounded-lg p-3 flex items-center">
             <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></div>
             <span className="text-xs font-mono text-slate-400">System Online</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm z-10">
          <div className="flex items-center text-sm text-slate-500">
             <span className="text-slate-400 hover:text-slate-600 cursor-pointer">首页</span>
             <span className="mx-2 text-slate-300">/</span>
             <span className="font-medium text-slate-800">{getBreadcrumb()}</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
              <UserCircle2 className="w-8 h-8 text-slate-400" />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-700">AOI工程师: 周</span>
                <span className="text-[10px] text-slate-400">ID: 00588771</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-8 relative">
          <div className="max-w-6xl mx-auto h-full">
            {activeTab === 'training' && (
              <TrainingForge onNavigateToSampleHub={() => setActiveTab('samples')} />
            )}
            
            {activeTab === 'samples' && (
              <SampleHub />
            )}

            {activeTab === 'settings' && (
              <div className="flex items-center justify-center h-full text-slate-400 flex-col">
                <Settings className="w-16 h-16 mb-4 opacity-20" />
                <p>系统设置模块 (Mock Placeholder)</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
