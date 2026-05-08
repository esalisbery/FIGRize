import React from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  BarChart2,
  Settings,
  MessageSquare,
  Users,
} from 'lucide-react';
import { ConnectedAccount } from '../types';

interface SidebarProps {
  connectedAccount: ConnectedAccount | null;
  onConnectClick: () => void;
  onDisconnectClick: () => void;
  onQuickPost?: () => void;
}

const navItems = [
  { icon: LayoutDashboard, label: 'Summary',   active: false },
  { icon: CalendarDays,    label: 'Planner',   active: true  },
  { icon: MessageSquare,   label: 'Inbox',     active: false },
  { icon: BarChart2,       label: 'Analytics', active: false },
  { icon: Users,           label: 'Team',      active: false },
  { icon: Settings,        label: 'Settings',  active: false },
];

export const Sidebar: React.FC<SidebarProps> = ({
  connectedAccount,
  onConnectClick,
  onDisconnectClick,
  onQuickPost: _onQuickPost,
}) => {
  return (
    <div className="w-16 md:w-56 flex-shrink-0 flex flex-col h-full bg-app-surface border-r border-[rgba(120,140,180,0.14)]">

      {/* ── Logo ── */}
      <div className="px-4 py-5 flex items-center gap-3 border-b border-[rgba(120,140,180,0.14)]">
        <div className="flex-shrink-0 w-7 h-7 rounded-[6px] flex items-center justify-center font-bold text-sm text-[#1a1206] bg-gradient-to-br from-[#ff8c42] to-[#f5a623] shadow-[0_0_16px_rgba(255,140,66,0.4)]">
          F
        </div>
        <div className="hidden md:flex flex-col leading-tight">
          <span className="font-bold text-app-text text-sm">FIGRize</span>
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-app-text-3">
            Social Planner
          </span>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        <p className="font-mono text-[9px] tracking-[0.16em] uppercase text-app-text-3 px-2 mb-2 hidden md:block">
          Navigation
        </p>

        {navItems.map(item => (
          <div
            key={item.label}
            className={`relative flex items-center gap-2.5 px-2.5 py-2 rounded-lg border cursor-pointer transition-all text-[13px] font-medium mb-1 ${
              item.active
                ? 'bg-[rgba(255,140,66,0.12)] border-[rgba(255,140,66,0.45)] text-app-orange-2'
                : 'border-transparent text-app-text-2 hover:bg-app-surface-2 hover:text-app-text'
            }`}
          >
            {item.active && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[18px] rounded-r-full bg-gradient-to-b from-[#ff8c42] to-[#f5a623]" />
            )}

            <item.icon size={16} className="flex-shrink-0" />
            <span className="hidden md:block truncate">{item.label}</span>

            {item.label === 'Inbox' && (
              <span className="ml-auto hidden md:flex items-center justify-center text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[rgba(255,140,66,0.12)] text-app-orange-2 border border-[rgba(255,140,66,0.45)]">
                3
              </span>
            )}
          </div>
        ))}
      </nav>

      {/* ── Connected Pages ── */}
      <div className="px-3 py-4 border-t border-[rgba(120,140,180,0.14)]">
        <p className="font-mono text-[9px] tracking-[0.16em] uppercase text-app-text-3 px-2 mb-2 hidden md:block">
          Connected Pages
        </p>

        {/* Facebook row */}
        <div
          className="flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg hover:bg-app-surface-2 cursor-pointer mb-1 transition-all"
          onClick={connectedAccount ? onDisconnectClick : onConnectClick}
        >
          <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold bg-[#1877f2] shadow-[0_0_8px_rgba(24,119,242,0.4)]">
            f
          </div>

          <div className="hidden md:flex flex-col flex-1 min-w-0 leading-tight">
            <span className="text-app-text text-[12px] font-semibold truncate">Facebook</span>
            <span className="text-app-text-3 text-[10px] font-mono truncate">
              {connectedAccount ? connectedAccount.name : 'Not connected'}
            </span>
          </div>

          {connectedAccount ? (
            <span className="hidden md:block w-2 h-2 rounded-full flex-shrink-0 bg-app-teal" />
          ) : (
            <span
              className="hidden md:block text-[10px] font-semibold px-1.5 py-0.5 rounded border cursor-pointer text-app-text-2 bg-app-surface-2 border-app-border hover:border-[rgba(255,140,66,0.45)] hover:text-app-orange transition-all"
              onClick={e => { e.stopPropagation(); onConnectClick(); }}
            >
              Connect
            </span>
          )}
        </div>

        {/* Instagram row */}
        <div className="flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg hover:bg-app-surface-2 cursor-pointer mb-1 transition-all">
          <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold bg-[linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)] shadow-[0_0_8px_rgba(220,39,67,0.35)]">
            ig
          </div>

          <div className="hidden md:flex flex-col flex-1 min-w-0 leading-tight">
            <span className="text-app-text text-[12px] font-semibold truncate">Instagram</span>
            <span className="text-app-text-3 text-[10px] font-mono truncate">Not connected</span>
          </div>

          <span
            className="hidden md:block text-[10px] font-semibold px-1.5 py-0.5 rounded border cursor-pointer text-app-text-2 bg-app-surface-2 border-app-border hover:border-[rgba(255,140,66,0.45)] hover:text-app-orange transition-all"
            onClick={onConnectClick}
          >
            Connect
          </span>
        </div>
      </div>

      {/* ── Footer / User ── */}
      <div className="p-3 flex items-center gap-2.5 border-t border-[rgba(120,140,180,0.14)]">
        <div className="flex-shrink-0 w-[30px] h-[30px] rounded-full flex items-center justify-center text-white text-xs font-bold bg-gradient-to-br from-[#3ec1a6] to-[#1877f2]">
          E
        </div>

        <div className="hidden md:flex flex-col flex-1 min-w-0 leading-tight">
          <span className="text-app-text text-[12px] font-semibold truncate">Your Workspace</span>
          <span className="text-app-text-3 text-[10px] font-mono truncate">esalisbery@gmail.com</span>
        </div>

        <Settings size={14} className="text-app-text-3 flex-shrink-0 hidden md:block" />
      </div>

    </div>
  );
};
