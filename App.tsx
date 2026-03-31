import React, { useState } from 'react';
import { BrainCircuit, Database, Settings, UserCircle2, ScanEye, ChevronRight, Share2, FolderArchive, ChevronDown } from 'lucide-react';
import { SampleHub } from './components/SampleHub';
import { TrainingForge } from './components/TrainingForge';
import { ModelHub } from './components/ModelHub';
import { DatasetHub } from './components/DatasetHub';
import { AppTab, ACCOUNTS, UserInfo } from './types';

function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('training');
  const [currentUser, setCurrentUser] = useState<UserInfo>(ACCOUNTS[0]);
  const [showUserMenu, setShowUserMenu] = useState(false); // 控制下拉菜单显示

  const menuItems = [
    { id: 'training', label: '模型选型库', icon: ScanEye },
    { id: 'samples', label: '样本资源库', icon: Database },
    { id: 'datasets', label: '我的数据集', icon: FolderArchive },
    { id: 'models', label: '模型共享平台', icon: Share2 },
    { id: 'settings', label: '系统设置', icon: Settings },
  ];

  const getBreadcrumb = () => {
    switch (activeTab) {
      case 'training': return '模型选型库';
      case 'samples': return '样本资源库';
      case 'datasets': return '我的数据集';
      case 'models': return '模型共享平台';
      case 'settings': return '系统设置';
      default: return '首页';
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
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

      <div className="flex-1 flex flex-col min-w-0 relative">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm z-10">
          <div className="flex items-center text-sm text-slate-500">
             <span className="text-slate-400 hover:text-slate-600 cursor-pointer">首页</span>
             <span className="mx-2 text-slate-300">/</span>
             <span className="font-bold text-slate-800">{getBreadcrumb()}</span>
          </div>

          <div className="flex items-center gap-4 relative">
            {/* 点击展开下拉栏，固定宽度 w-56 防止抖动 */}
            <div 
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-56 flex items-center justify-between bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors shadow-sm select-none"
              title="点击切换账号"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="relative shrink-0">
                  <UserCircle2 className="w-8 h-8 text-slate-400" />
                  <span className={`absolute -top-1 -right-0 flex h-3 w-3 rounded-full border-2 border-white ${currentUser.role === 'admin' ? 'bg-red-500' : currentUser.role === 'engineer' ? 'bg-blue-500' : 'bg-emerald-500'}`}></span>
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-700 truncate">{currentUser.name}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold shrink-0 ${currentUser.color}`}>
                      {currentUser.roleName}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">ID: {currentUser.id}</span>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
            </div>

            {/* 下拉菜单面板 */}
            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)}></div>
                <div className="absolute top-full mt-2 right-0 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-2 text-xs font-bold text-slate-400 border-b border-slate-100 mb-1">切换账号权限角色</div>
                  {ACCOUNTS.map(acc => (
                    <div
                      key={acc.id}
                      onClick={() => { 
                        setCurrentUser(acc); 
                        setShowUserMenu(false); 
                      }}
                      className={`px-4 py-2.5 hover:bg-slate-50 cursor-pointer flex items-center justify-between transition-colors ${currentUser.id === acc.id ? 'bg-indigo-50/50' : ''}`}
                    >
                      <div className="flex flex-col">
                        <span className={`text-sm font-bold ${currentUser.id === acc.id ? 'text-indigo-600' : 'text-slate-700'}`}>{acc.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{acc.id}</span>
                      </div>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold ${acc.color}`}>
                        {acc.roleName}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-auto p-8 relative">
          <div className="max-w-7xl mx-auto h-full">
            {activeTab === 'training' && <TrainingForge onNavigateToSampleHub={() => setActiveTab('samples')} />}
            {activeTab === 'samples' && <SampleHub currentUser={currentUser} />}
            {activeTab === 'datasets' && <DatasetHub currentUser={currentUser} />}
            {activeTab === 'models' && <ModelHub currentUser={currentUser} />}
            {activeTab === 'settings' && (
              <div className="flex items-center justify-center h-full text-slate-400 flex-col">
                <Settings className="w-16 h-16 mb-4 opacity-20" />
                <p>系统设置模块 (开发中...)</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
