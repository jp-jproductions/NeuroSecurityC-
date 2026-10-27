import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Moon,
  Sun,
  Printer,
  Download,
  Lock,
  LogOut,
  User,
  CheckCheck,
  Building2,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { NeuromedicaLogo } from './NeuromedicaLogo';
import { AdminUser } from '../types';
import { formatBogotaDate, formatBogotaTimeOnly } from '../utils/date';

interface NavbarProps {
  lastUpdated: string;
  adminUser: AdminUser | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  onOpenBulkReview: () => void;
  onOpenSedeManagement: () => void;
  onOpenUserManagement: () => void;
  onRefreshData: () => void;
  isRefreshing?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  lastUpdated,
  adminUser,
  onOpenLogin,
  onLogout,
  onOpenBulkReview,
  onOpenSedeManagement,
  onOpenUserManagement,
  onRefreshData,
  isRefreshing = false,
}) => {
  const [isDark, setIsDark] = useState(() => {
    return (
      localStorage.getItem('theme') === 'dark' ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
    );
  });

  const [bogotaTime, setBogotaTime] = useState('');

  // Live Bogotá clock ticker
  useEffect(() => {
    const updateTime = () => {
      setBogotaTime(formatBogotaTimeOnly(new Date().toISOString()));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Sync dark class on html tag
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Left: Neuromédica Logo & App Title */}
          <div className="flex items-center gap-4">
            <NeuromedicaLogo size="md" />

            <div className="hidden md:block h-8 w-px bg-slate-200 dark:bg-slate-800" />

            <div className="hidden lg:block">
              <h1 className="text-sm font-extrabold uppercase tracking-wide text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <span>Estado de Seguridad por Sede</span>
                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  En Vivo
                </span>
              </h1>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                <span>Última actualización: <strong>{formatBogotaDate(lastUpdated)}</strong></span>
              </div>
            </div>
          </div>

          {/* Center/Right: Live Clock & Tools */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Clock America/Bogota */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700">
              <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
              <span>{bogotaTime}</span>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">
                COL (UTC-5)
              </span>
            </div>

            {/* Manual Refresh Button */}
            <button
              type="button"
              onClick={onRefreshData}
              disabled={isRefreshing}
              className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Refrescar datos ahora"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            </button>

            {/* Print / PDF Report Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer shadow-xs"
              title="Exportar reporte de seguridad actual a PDF o imprimir"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Imprimir / PDF</span>
            </button>

            {/* Export CSV Button */}
            <a
              href="/api/export/sedes-csv"
              download
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer shadow-xs"
              title="Descargar matriz de estados actual en Excel / CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Excel</span>
            </a>

            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />

            {/* Admin Controls / Login */}
            {adminUser ? (
              <div className="flex items-center gap-1.5">
                {/* Bulk review button */}
                <button
                  type="button"
                  onClick={onOpenBulkReview}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer"
                  title="Abrir modo de revisión rápida para todas las sedes"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Pase de Guardia</span>
                </button>

                {/* Sede Management button */}
                <button
                  type="button"
                  onClick={onOpenSedeManagement}
                  className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  title="Administrar sedes y grupos"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">Sedes</span>
                </button>

                {/* User Settings button */}
                <button
                  type="button"
                  onClick={onOpenUserManagement}
                  className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title={`Administrador: ${adminUser.email} (Cambiar clave)`}
                >
                  <User className="w-4 h-4" />
                </button>

                {/* Logout button */}
                <button
                  type="button"
                  onClick={onLogout}
                  className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  title="Cerrar sesión de administrador"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenLogin}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 shadow-sm shadow-blue-700/20 transition-all cursor-pointer"
                title="Acceso exclusivo para el administrador del sistema de seguridad"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Panel Admin</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile secondary bar */}
        <div className="lg:hidden pb-3 pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
            Estado de Seguridad por Sede
          </span>
          <span className="truncate text-[11px]">
            Act: {formatBogotaDate(lastUpdated)}
          </span>
        </div>
      </div>
    </header>
  );
};
