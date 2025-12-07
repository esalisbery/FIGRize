import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  CalendarDays, 
  BarChart2, 
  Settings, 
  MessageSquare, 
  Users, 
  PlusCircle, 
  Facebook, 
  ChevronDown, 
  LogOut, 
  Building2 
} from 'lucide-react';
import { ConnectedAccount } from '../types';

interface SidebarProps {
  connectedAccount: ConnectedAccount | null;
  onConnectClick: () => void;
  onDisconnectClick: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ connectedAccount, onConnectClick, onDisconnectClick }) => {
  const [isBrandMenuOpen, setIsBrandMenuOpen] = useState(false);

  const navItems = [
    { icon: LayoutDashboard, label: 'Summary', active: false },
    { icon: CalendarDays, label: 'Planner', active: true },
    { icon: MessageSquare, label: 'Inbox', active: false },
    { icon: BarChart2, label: 'Analytics', active: false },
    { icon: Users, label: 'Team', active: false },
    { icon: Settings, label: 'Settings', active: false },
  ];

  return (
    <div className="w-16 md:w-64 bg-slate-900 h-full flex flex-col text-slate-300 flex-shrink-0 transition-all duration-300 shadow-xl z-30 font-sans">
      {/* Brand Switcher Area (Metricool Style) */}
      <div className="h-16 flex items-center px-0 md:px-4 border-b border-slate-800 bg-slate-950 relative">
        <button 
            onClick={() => setIsBrandMenuOpen(!isBrandMenuOpen)}
            className="w-full flex items-center justify-center md:justify-between p-2 rounded-lg hover:bg-slate-800 transition-colors group"
        >
            <div className="flex items-center gap-3 overflow-hidden">
                <div className="relative flex-shrink-0">
                    {connectedAccount ? (
                        <img 
                            src={connectedAccount.avatarUrl} 
                            alt={connectedAccount.name} 
                            className="w-8 h-8 rounded-lg border border-slate-700"
                        />
                    ) : (
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                            <Building2 size={16} />
                        </div>
                    )}
                    {connectedAccount && (
                        <div className="absolute -bottom-1 -right-1 bg-[#1877F2] rounded-full p-0.5 border-2 border-slate-950">
                            <Facebook size={8} className="text-white" />
                        </div>
                    )}
                </div>
                
                <div className="hidden md:flex flex-col items-start overflow-hidden">
                    <span className="text-sm font-bold text-white truncate max-w-[120px]">
                        {connectedAccount ? connectedAccount.name : 'My Workspace'}
                    </span>
                    <span className="text-[10px] text-slate-500 truncate">
                        {connectedAccount ? 'Connected' : 'Free Plan'}
                    </span>
                </div>
            </div>
            <ChevronDown size={14} className={`hidden md:block text-slate-500 transition-transform ${isBrandMenuOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Brand Dropdown */}
        {isBrandMenuOpen && (
            <div className="absolute top-full left-2 right-2 mt-2 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                <div className="p-2 space-y-1">
                    <div className="text-[10px] font-semibold text-slate-500 uppercase px-2 py-1">Switch Brand</div>
                    {connectedAccount ? (
                         <button 
                            onClick={onDisconnectClick}
                            className="w-full flex items-center gap-2 px-2 py-2 text-sm text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            <LogOut size={14} />
                            Disconnect {connectedAccount.name}
                        </button>
                    ) : (
                         <button 
                            onClick={() => { onConnectClick(); setIsBrandMenuOpen(false); }}
                            className="w-full flex items-center gap-2 px-2 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                        >
                            <PlusCircle size={14} />
                            Connect Facebook Page
                        </button>
                    )}
                </div>
            </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-2 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => (
          <button
            key={item.label}
            className={`w-full flex items-center px-2 md:px-4 py-3 rounded-lg transition-all group relative ${
              item.active 
                ? 'bg-slate-800 text-white shadow-inner' 
                : 'hover:bg-slate-800/50 hover:text-white'
            }`}
          >
            {item.active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-500 rounded-r-full"></div>}
            <item.icon size={20} className={`${item.active ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'} transition-colors`} />
            <span className={`ml-3 font-medium text-sm hidden md:block ${item.active ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>{item.label}</span>
            {item.label === 'Inbox' && (
              <span className="ml-auto bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full hidden md:block shadow-sm shadow-indigo-900">3</span>
            )}
          </button>
        ))}
      </nav>

      {/* Add Button Mobile/Desktop */}
      <div className="px-2 md:px-4 mb-4">
        <button 
            onClick={() => !connectedAccount ? onConnectClick() : null}
            className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                connectedAccount 
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg hover:shadow-indigo-500/25' 
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-dashed border-slate-600'
            }`}
        >
            <PlusCircle size={20} />
            <span className="hidden md:inline font-medium text-sm">
                {connectedAccount ? 'Quick Post' : 'Connect Account'}
            </span>
        </button>
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
          <div className="relative">
            <img 
                src="https://picsum.photos/100/100" 
                alt="User" 
                className="w-9 h-9 rounded-full border border-slate-700 bg-slate-800"
            />
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-slate-900 rounded-full"></div>
          </div>
          <div className="hidden md:block overflow-hidden">
            <p className="text-sm font-medium text-white truncate">Demo User</p>
            <p className="text-xs text-slate-500 truncate">Pro Plan</p>
          </div>
        </div>
      </div>
    </div>
  );
};