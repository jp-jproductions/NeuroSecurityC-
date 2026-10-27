import React from 'react';
import {
  LayoutGrid,
  Building2,
  AlertTriangle,
  History,
  FileText,
  ShieldCheck,
  Lock,
  LogOut,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AdminUser } from '../types';
import { NeuromedicaLogo } from './NeuromedicaLogo';

export type NavTab = 'resumen' | 'sedes' | 'novedades' | 'historial' | 'reportes' | 'admin';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  adminUser: AdminUser | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  unreadCount?: number;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  adminUser,
  onOpenLogin,
  onLogout,
  unreadCount = 0,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const navItems = [
    { id: 'resumen', label: 'Resumen', icon: LayoutGrid },
    { id: 'sedes', label: 'Sedes', icon: Building2 },
    { id: 'novedades', label: 'Novedades', icon: AlertTriangle, badge: unreadCount > 0 ? unreadCount : undefined },
    { id: 'historial', label: 'Historial', icon: History },
    { id: 'reportes', label: 'Reportes', icon: FileText },
  ];

  return (
    <>
      {/* Mobile Backdrop Scrim */}
      <AnimatePresence>
        {isOpenMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCloseMobile}
            className="fixed inset-0 bg-[#1a1a37]/50 backdrop-blur-xs z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen z-50 w-64 xl:w-72 bg-[#F8FAFF] border-r border-[#E7EBF5] p-5 flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Header & Logo with close button on mobile */}
          <div className="flex items-center justify-between pb-6 mb-2 border-b border-slate-100">
            <NeuromedicaLogo size="md" />
            <motion.button
              type="button"
              whileTap={{ scale: 0.9 }}
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5 pt-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#646482] px-3 mb-2 block">
              Menú Principal
            </span>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;

              return (
                <motion.button
                  key={item.id}
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    onSelectTab(item.id as NavTab);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={`relative w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                    isActive ? 'text-[#3B5BDB] font-extrabold' : 'text-[#646482] hover:text-[#1a1a37] hover:bg-white/60'
                  }`}
                >
                  {/* Sliding spring active background pill */}
                  {isActive && (
                    <motion.div
                      layoutId="sidebarActivePill"
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                      className="absolute inset-0 rounded-2xl bg-white shadow-xs border border-[#5B7CFA]/20"
                    />
                  )}

                  <div className="relative z-10 flex items-center gap-3">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#5B7CFA]' : 'text-[#646482]'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span
                      className={`relative z-10 text-[10px] font-black px-2 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-amber-500 text-white'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </motion.button>
              );
            })}

            {/* Admin section link */}
            <div className="pt-4 mt-4 border-t border-slate-100">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#646482] px-3 mb-2 block">
                Seguridad & Control
              </span>

              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  if (adminUser) {
                    onSelectTab('admin');
                  } else {
                    onOpenLogin();
                  }
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`relative w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                  currentTab === 'admin'
                    ? 'text-[#1a1a37] font-extrabold'
                    : 'text-[#646482] hover:text-[#1a1a37] hover:bg-white/60'
                }`}
              >
                {currentTab === 'admin' && (
                  <motion.div
                    layoutId="sidebarActivePill"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    className="absolute inset-0 rounded-2xl bg-white shadow-xs border border-slate-200"
                  />
                )}

                <div className="relative z-10 flex items-center gap-3">
                  {adminUser ? (
                    <ShieldCheck className="w-4 h-4 text-[#5B7CFA]" />
                  ) : (
                    <Lock className="w-4 h-4 text-[#646482]" />
                  )}
                  <span>{adminUser ? 'Administración' : 'Acceso Admin'}</span>
                </div>

                {adminUser && (
                  <span className="relative z-10 w-2 h-2 rounded-full bg-[#32CD32] ring-2 ring-[#32CD32]/30 animate-pulse" />
                )}
              </motion.button>

              {adminUser && (
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    onLogout();
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className="mt-2 w-full flex items-center gap-3 px-3.5 py-2 rounded-2xl text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50/80 transition-colors cursor-pointer"
                  title="Cerrar sesión de administrador"
                >
                  <LogOut className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>Cerrar sesión</span>
                </motion.button>
              )}
            </div>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="pt-4 border-t border-slate-100">
          <div className="p-3 rounded-2xl bg-white/70 border border-[#E7EBF5] flex items-center justify-between text-xs">
            <div>
              <span className="font-extrabold text-[#1a1a37] block">Neuromédica</span>
              <span className="text-[10px] text-[#646482]">v3.0 Fluid iOS Web</span>
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#5B7CFA]/10 text-[#5B7CFA]">
              BOG
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
