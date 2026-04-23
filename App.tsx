import React, { useState, useEffect } from 'react';
import { BrainCircuit, Database, Settings, UserCircle2, ScanEye, ChevronRight, Share2, FolderArchive, ChevronDown, User, Hash, LogOut, Shield, Users } from 'lucide-react';
import { SampleHub } from './components/SampleHub';
import { TrainingForge } from './components/TrainingForge';
import { ModelHub } from './components/ModelHub';
import { DatasetHub } from './components/DatasetHub';
import { AppTab, UserInfo, Role } from './types';
import { api } from './api'; // 引入API

// 权限映射表
const ROLE_MAP: Record<Role, { roleName: string, color: string }> = {
  admin: { roleName: '管理员', color: 'bg-red-100 text-red-700 border-red-200' },
  engineer: { roleName: '工程师', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  technician: { roleName: '作业员', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' }
};

// --- 登录界面组件 ---
const LoginScreen = ({ onLogin }: { onLogin: (user: UserInfo) => void }) => {
  const [name, setName] = useState('');
  const [id, setId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanId = id.trim();
    
    if (!cleanName || !cleanId) {
      alert('请输入姓名和工号');
      return;
    }
    
    setLoading(true);
    try {
      // 调用后端登录接口，后端会处理新建工号存入 users.json 并在本地赋予权限的过程
      const user = await api.login(cleanName, cleanId);
      onLogin(user);
    } catch (error: any) {
      alert(error.message || '登录失败，请检查网络或后端服务。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 to-slate-950">
       <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
         <div className="bg-red-700 p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABZJREFUeNpi2rV7928bExPTfwYEAAgwADtCAwXmEogQAAAAAElFTkSuQmCC')] opacity-20"></div>
            <div className="w-16 h-16 bg-white/20 rounded-2xl mx-auto flex items-center justify-center backdrop-blur-md mb-4 shadow-lg border border-white/20 relative z-10">
              <BrainCircuit className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white relative z-10 tracking-wide">华为AI检测训练平台</h2>
            <p className="text-red-200 text-sm mt-2 relative z-10">工业视觉大模型研发中心</p>
         </div>
         <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">姓名</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  required 
                  autoFocus 
                  placeholder="请输入真实姓名" 
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all text-sm font-medium" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">工号</label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  required 
                  placeholder="请输入工号" 
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all text-sm font-medium font-mono" 
                  value={id} 
                  onChange={e => setId(e.target.value)} 
                />
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-3.5 rounded-xl transition-colors shadow-lg shadow-red-700/30 flex items-center justify-center gap-2 mt-4 disabled:opacity-50">
              <ScanEye className="w-5 h-5" /> {loading ? '验证中...' : '登 录 系 统'}
            </button>
         </form>
       </div>
    </div>
  )
}

// --- 系统设置 & 权限管理组件 ---
const SettingsModule = ({ currentUser, onUserUpdate }: { currentUser: UserInfo, onUserUpdate: (u: UserInfo) => void }) => {
  const [users, setUsers] = useState<UserInfo[]>([]);

  // 页面加载时向后端请求真实物理文件的 users 数据
  useEffect(() => {
    if (currentUser.role === 'admin') {
      api.getUsers().then(setUsers).catch(e => console.error("读取用户数据失败", e));
    }
  }, [currentUser.role]);

  if (currentUser.role !== 'admin') {
    return (
       <div className="flex flex-col items-center justify-center h-full text-slate-500 bg-white rounded-xl shadow-sm border border-slate-200 p-8 animate-in fade-in">
         <Shield className="w-20 h-20 mb-6 text-slate-300" />
         <h3 className="text-xl font-bold text-slate-800 mb-2">无访问权限</h3>
         <p className="text-sm">系统设置与权限管理模块仅向 <b className="text-red-500">管理员</b> 开放。</p>
         <p className="text-sm mt-2">您当前的角色为：<span className="font-bold border px-2 py-0.5 rounded bg-slate-50">{currentUser.roleName}</span></p>
       </div>
    );
  }

  const handleRoleChange = async (userId: string, newRole: Role) => {
    const map = ROLE_MAP[newRole];
    try {
      // 告诉后端去改写 D盘的 users.json
      await api.updateUserRole(userId, { role: newRole, roleName: map.roleName, color: map.color });
      
      // 前端刷新状态
      setUsers(users.map(u => {
        if (u.id === userId) {
          const updatedUser = { ...u, role: newRole, roleName: map.roleName, color: map.color };
          // 如果修改的是当前登录的人，需要向上层通知同步刷新页面状态
          if (userId === currentUser.id) onUserUpdate(updatedUser);
          return updatedUser;
        }
        return u;
      }));
    } catch (e) {
      alert("更新用户权限失败");
    }
  };

  return (
     <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden animate-in fade-in duration-300">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><Users className="w-6 h-6" /></div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">账号与权限管理</h3>
                <p className="text-xs text-slate-500 mt-1">服务器已同步 <b className="text-indigo-600">{users.length}</b> 个注册账号</p>
              </div>
           </div>
        </div>
        <div className="flex-1 overflow-auto p-6">
           <table className="w-full text-left text-sm border-collapse">
             <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
               <tr>
                 <th className="px-6 py-4 rounded-tl-lg">姓名</th>
                 <th className="px-6 py-4">工号 (ID)</th>
                 <th className="px-6 py-4">当前角色</th>
                 <th className="px-6 py-4 rounded-tr-lg">操作权限</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
               {users.map(user => (
                 <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800 flex items-center gap-3">
                      <UserCircle2 className="w-6 h-6 text-slate-400" /> {user.name}
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-500">{user.id}</td>
                    <td className="px-6 py-4">
                       <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${user.color}`}>
                         {user.roleName}
                       </span>
                    </td>
                    <td className="px-6 py-4">
                       <select
                         value={user.role}
                         onChange={(e) => handleRoleChange(user.id, e.target.value as Role)}
                         className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50"
                         disabled={user.id === currentUser.id} // 防止管理员误将自己降级导致无法管理
                       >
                         <option value="admin">管理员 (Admin)</option>
                         <option value="engineer">工程师 (Engineer)</option>
                         <option value="technician">作业员 (Technician)</option>
                       </select>
                       {user.id === currentUser.id && <span className="ml-3 text-xs text-slate-400 font-medium">当前账号 (防降级保护)</span>}
                    </td>
                 </tr>
               ))}
             </tbody>
           </table>
        </div>
     </div>
  );
}

// --- 根应用组件 ---
function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('training');
  const [showUserMenu, setShowUserMenu] = useState(false);

  // 初始化时仅保留用来维持“登录会话态”的 localStorage，真正的物理名单都在后端
  const [currentUser, setCurrentUser] = useState<UserInfo | null>(() => {
    try {
      const cachedSession = localStorage.getItem('aoi_session_user');
      return cachedSession ? JSON.parse(cachedSession) : null;
    } catch (error) {
      return null;
    }
  });

  const handleSetUser = (user: UserInfo | null) => {
    setCurrentUser(user);
    if (user) {
      localStorage.setItem('aoi_session_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('aoi_session_user');
    }
  };

  const menuItems = [
    { id: 'samples', label: '样本资源库', icon: Database },
    { id: 'datasets', label: '数据集管理', icon: FolderArchive },
    { id: 'training', label: '模型选型库', icon: ScanEye },
    { id: 'models', label: '模型共享平台', icon: Share2 },
    { id: 'ai-chat', label: 'AI 模型对话', icon: BrainCircuit, externalLink: true },
    { id: 'settings', label: '系统设置', icon: Settings },
  ];

  const getBreadcrumb = () => {
    switch (activeTab) {
      case 'training': return '模型选型库';
      case 'samples': return '样本资源库';
      case 'datasets': return '数据集管理';
      case 'models': return '模型共享平台';
      case 'ai-chat': return 'AI 模型对话';
      case 'settings': return '系统设置';
      default: return '首页';
    }
  };

  if (!currentUser) {
    return <LoginScreen onLogin={handleSetUser} />;
  }

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
          {menuItems.map((item) => {
            const handleClick = () => {
              if (item.externalLink) {
                window.open('/chat/', '_blank');
              } else {
                setActiveTab(item.id as AppTab);
              }
            };

            return (
              <button
                key={item.id}
                onClick={handleClick}
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
            );
          })}
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
            <div 
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-56 flex items-center justify-between bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors shadow-sm select-none"
              title="点击配置账号"
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

            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)}></div>
                <div className="absolute top-full mt-2 right-0 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div
                    onClick={() => {
                      handleSetUser(null);
                      setShowUserMenu(false);
                    }}
                    className="px-4 py-2.5 mx-1.5 rounded-lg hover:bg-red-50 cursor-pointer flex items-center gap-2 text-red-600 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm font-bold">退出当前账号</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-auto p-8 relative">
          <div className="max-w-7xl mx-auto h-full">
            {activeTab === 'training' && <TrainingForge currentUser={currentUser} onNavigateToSampleHub={() => setActiveTab('samples')} />}
            {activeTab === 'samples' && <SampleHub currentUser={currentUser} />}
            {activeTab === 'datasets' && <DatasetHub currentUser={currentUser} />}
            {activeTab === 'models' && <ModelHub currentUser={currentUser} />}
            {activeTab === 'settings' && <SettingsModule currentUser={currentUser} onUserUpdate={handleSetUser} />}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
