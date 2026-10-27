import React from 'react';
import { LayoutGrid, Building2, AlertTriangle, History, Shield, Lock, FileText } from 'lucide-react';
import { NavTab } from './Sidebar';
import { AdminUser } from '../types';

interface MobileBottomNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  unreadCount?: number;
  adminUser: AdminUser | null;
  onOpenLogin: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onSelectTab,
  unreadCount = 0,
  adminUser,
  onOpenLogin,
}) => {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 shadow-lg flex items-center justify-around safe-bottom">
      {/* Resumen */}
      <button
        type="button"
        onClick={() => onSelectTab('resumen')}
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
          currentTab === 'resumen'
            ? 'text-[#00a6e4] font-bold'
            : 'text-slate-500 hover:text-[#1a1a37]'
        }`}
      >
        <LayoutGrid className="w-5 h-5" />
        <span className="text-[10px] mt-0.5 tracking-tight">Resumen</span>
      </button>

      {/* Sedes */}
      <button
        type="button"
        onClick={() => onSelectTab('sedes')}
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
          currentTab === 'sedes'
            ? 'text-[#00a6e4] font-bold'
            : 'text-slate-500 hover:text-[#1a1a37]'
        }`}
      >
        <Building2 className="w-5 h-5" />
        <span className="text-[10px] mt-0.5 tracking-tight">Sedes</span>
      </button>

      {/* Novedades with badge */}
      <button
        type="button"
        onClick={() => onSelectTab('novedades')}
        className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
          currentTab === 'novedades'
            ? 'text-[#00a6e4] font-bold'
            : 'text-slate-500 hover:text-[#1a1a37]'
        }`}
      >
        <div className="relative">
          <AlertTriangle className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-2 bg-amber-500 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-full ring-2 ring-white">
              {unreadCount}
            </span>
          )}
        </div>
        <span className="text-[10px] mt-0.5 tracking-tight">Novedades</span>
      </button>

      {/* Historial */}
      <button
        type="button"
        onClick={() => onSelectTab('historial')}
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
          currentTab === 'historial'
            ? 'text-[#00a6e4] font-bold'
            : 'text-slate-500 hover:text-[#1a1a37]'
        }`}
      >
        <History className="w-5 h-5" />
        <span className="text-[10px] mt-0.5 tracking-tight">Historial</span>
      </button>

      {/* Admin */}
      <button
        type="button"
        onClick={() => {
          if (adminUser) {
            onSelectTab('admin');
          } else {
            onOpenLogin();
          }
        }}
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
          currentTab === 'admin'
            ? 'text-[#00a6e4] font-bold'
            : 'text-slate-500 hover:text-[#1a1a37]'
        }`}
      >
        {adminUser ? (
          <Shield className="w-5 h-5 text-[#00a6e4]" />
        ) : (
          <Lock className="w-5 h-5" />
        )}
        <span className="text-[10px] mt-0.5 tracking-tight">
          {adminUser ? 'Admin' : 'Acceso'}
        </span>
      </button>
    </nav>
  );
};
