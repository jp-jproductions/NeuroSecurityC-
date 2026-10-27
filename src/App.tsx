import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  Filter,
  LayoutGrid,
  Table as TableIcon,
  Printer,
  Download,
  Menu,
  RefreshCw,
  Clock,
  CheckCheck,
  Building2,
  FileText,
  User,
  ShieldCheck,
  ShieldAlert,
  Shield,
  Lock,
  LogOut,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SedeConEstado, ResumenEstadisticas, AdminUser, SystemStatus, RegistroHistorial } from './types';
import { api, getStoredUser, clearStoredSession } from './services/api';
import { Sidebar, NavTab } from './components/Sidebar';
import { TopFloatingKpiCard } from './components/TopFloatingKpiCard';
import { RightPanel } from './components/RightPanel';
import { SedeCard } from './components/SedeCard';
import { SedeTableView } from './components/SedeTableView';
import { HistoryModal } from './components/HistoryModal';
import { EditStatusModal } from './components/EditStatusModal';
import { BulkReviewModal } from './components/BulkReviewModal';
import { SedeManagementModal } from './components/SedeManagementModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminUserModal } from './components/AdminUserModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { NeuromedicaLogo } from './components/NeuromedicaLogo';
import { formatBogotaDate, formatBogotaTimeOnly } from './utils/date';
import { useRealtimeSecurityUpdates } from './lib/realtime';

export default function App() {
  // Main Navigation Tab
  const [currentTab, setCurrentTab] = useState<NavTab>('resumen');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Main Data States
  const [sedes, setSedes] = useState<SedeConEstado[]>([]);
  const [stats, setStats] = useState<ResumenEstadisticas | null>(null);
  const [historyList, setHistoryList] = useState<RegistroHistorial[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toISOString());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Admin Auth State
  const [adminUser, setAdminUser] = useState<AdminUser | null>(getStoredUser);

  // Filter & Search States
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('todas');
  const [selectedGroup, setSelectedGroup] = useState<string>('TODOS');
  const [sortBy, setSortBy] = useState<'prioridad' | 'alfabetico' | 'revision'>('prioridad');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const [bogotaTime, setBogotaTime] = useState('');

  // Modals
  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [historySelectedSede, setHistorySelectedSede] = useState<SedeConEstado | null>(null);
  const [editingStatusSede, setEditingStatusSede] = useState<SedeConEstado | null>(null);
  const [isBulkReviewOpen, setIsBulkReviewOpen] = useState<boolean>(false);
  const [isSedeManagementOpen, setIsSedeManagementOpen] = useState<boolean>(false);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState<boolean>(false);

  // Live Bogotá clock ticker
  useEffect(() => {
    const updateTime = () => {
      setBogotaTime(formatBogotaTimeOnly(new Date().toISOString()));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch all sedes and statistics from backend
  const fetchData = useCallback(async (showRefreshingState = false) => {
    if (showRefreshingState) setIsRefreshing(true);
    try {
      const [sedesRes, statsRes, histRes] = await Promise.all([
        api.getSedes(false),
        api.getStats(),
        api.getHistorial(undefined, 25),
      ]);

      setSedes(sedesRes.sedes);
      setLastUpdated(sedesRes.ultima_actualizacion_general || new Date().toISOString());
      setStats(statsRes);
      setHistoryList(histRes.historial);
      setError(null);
    } catch (err: any) {
      console.error('Error al cargar datos:', err);
      setError(err.message || 'No fue posible conectar con el servidor.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial load + periodic auto-refresh every 30 seconds
  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData(false);
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchData]);

  useRealtimeSecurityUpdates(() => fetchData(false));

  // Check URL hash or path for direct /admin route
  useEffect(() => {
    if (window.location.pathname === '/admin' || window.location.hash === '#admin') {
      if (!adminUser) {
        setIsLoginOpen(true);
      } else {
        setCurrentTab('admin');
      }
    }
  }, [adminUser]);

  // Distinct groups list
  const groupsList = useMemo(() => {
    const unique = Array.from(new Set(sedes.map((s) => s.grupo))).sort();
    return ['TODOS', ...unique];
  }, [sedes]);

  // Priority issues list (Novedades or Desactivadas) for the Right Panel & Mobile Banner
  const sedesWithIssues = useMemo(() => {
    return sedes.filter((s) => s.tiene_novedad || s.tiene_desactivado);
  }, [sedes]);

  // Overall security badge and status configuration
  const securityStatus = useMemo(() => {
    const hasDesactivado = sedesWithIssues.some((s) => s.tiene_desactivado);
    const hasNovedad = sedesWithIssues.some((s) => s.tiene_novedad);

    if (hasDesactivado) {
      return {
        label: 'Alerta Crítica',
        sublabel: `${sedesWithIssues.filter((s) => s.tiene_desactivado).length} sede(s) con sistemas desactivados`,
        icon: ShieldAlert,
        bgGradient: 'from-rose-500 to-red-600',
        badgeBg: 'bg-rose-100 text-rose-700',
        textColor: 'text-rose-600',
      };
    }
    if (hasNovedad) {
      return {
        label: 'Atención Requerida',
        sublabel: `${sedesWithIssues.filter((s) => s.tiene_novedad).length} sede(s) reportando novedad`,
        icon: ShieldAlert,
        bgGradient: 'from-amber-500 to-amber-600',
        badgeBg: 'bg-amber-100 text-amber-700',
        textColor: 'text-amber-600',
      };
    }
    return {
      label: '100% Operativo',
      sublabel: `Todas las ${sedes.length} sedes sin novedades`,
      icon: ShieldCheck,
      bgGradient: 'from-[#32CD32] to-[#228B22]',
      badgeBg: 'bg-[#32CD32]/15 text-[#14532d] border border-[#32CD32]/30',
      textColor: 'text-[#32CD32]',
    };
  }, [sedesWithIssues, sedes.length]);

  // Filter and sort sedes
  const filteredAndSortedSedes = useMemo(() => {
    let result = sedes.filter((s) => {
      // Tab specific filter
      if (currentTab === 'novedades') {
        if (!s.tiene_novedad && !s.tiene_desactivado) return false;
      }

      // Search term
      const matchesSearch =
        s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.grupo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.nota.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      // Group filter
      if (selectedGroup !== 'TODOS' && s.grupo !== selectedGroup) {
        return false;
      }

      // Status filter
      if (statusFilter === 'operativas') return s.es_100_operativa;
      if (statusFilter === 'novedad') return s.tiene_novedad;
      if (statusFilter === 'desactivadas') return s.tiene_desactivado;

      return true;
    });

    // Sort order
    result.sort((a, b) => {
      if (sortBy === 'prioridad') {
        const getPriorityScore = (item: SedeConEstado) => {
          if (item.tiene_desactivado) return 3;
          if (item.tiene_novedad) return 2;
          return 1;
        };

        const scoreA = getPriorityScore(a);
        const scoreB = getPriorityScore(b);

        if (scoreA !== scoreB) {
          return scoreB - scoreA;
        }

        return a.nombre.localeCompare(b.nombre);
      }

      if (sortBy === 'revision') {
        return new Date(a.fecha_revision).getTime() - new Date(b.fecha_revision).getTime();
      }

      return a.nombre.localeCompare(b.nombre);
    });

    return result;
  }, [sedes, searchTerm, selectedGroup, statusFilter, sortBy, currentTab]);

  // Admin Actions Handlers
  const handleLogin = async (email: string, pass: string) => {
    const res = await api.login(email, pass);
    setAdminUser(res.user);
    fetchData();
    return res.user;
  };

  const handleLogout = () => {
    clearStoredSession();
    setAdminUser(null);
    if (currentTab === 'admin') setCurrentTab('resumen');
  };

  const handleSaveStatus = async (
    id: string,
    payload: {
      estado_camaras: SystemStatus;
      estado_alarma: SystemStatus;
      nota?: string;
      fecha_revision?: string;
    }
  ) => {
    await api.updateSedeStatus(id, payload);
    await fetchData();
  };

  const handleMarkOperational = async (sede: SedeConEstado) => {
    try {
      await api.markSedeOperational(sede.id);
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Error al marcar como operativa');
    }
  };

  const handleSaveBulk = async (payload: {
    updates: Array<{
      sede_id: string;
      estado_camaras: SystemStatus;
      estado_alarma: SystemStatus;
      nota?: string;
      fecha_revision?: string;
    }>;
    fecha_revision_general?: string;
  }) => {
    await api.bulkUpdateSedes(payload);
    await fetchData();
  };

  const handleAddSede = async (data: { nombre: string; grupo: string }) => {
    await api.createSede({
      nombre: data.nombre,
      grupo: data.grupo,
      estado_camaras: 'operativo',
      estado_alarma: 'operativo',
      nota: '',
    });
    await fetchData();
  };

  const handleEditSede = async (id: string, data: { nombre: string; grupo: string }) => {
    await api.updateSede(id, data);
    await fetchData();
  };

  const handleToggleArchiveSede = async (id: string) => {
    await api.deleteSede(id, false);
    await fetchData();
  };

  const handleDeletePermanentSede = async (id: string) => {
    await api.deleteSede(id, true);
    await fetchData();
  };

  const handleResetDefaults = async () => {
    await api.resetDefaults();
    await fetchData();
  };

  const handleOpenSedeHistory = (sede: SedeConEstado) => {
    setHistorySelectedSede(sede);
    setIsHistoryOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const getTabTitle = () => {
    switch (currentTab) {
      case 'resumen':
        return 'Resumen';
      case 'sedes':
        return 'Sedes y Puntos de Atención';
      case 'novedades':
        return 'Novedades y Alarmas Activas';
      case 'historial':
        return 'Historial de Auditoría';
      case 'reportes':
        return 'Centro de Reportes & Exportación';
      case 'admin':
        return 'Panel de Administración';
      default:
        return 'Resumen';
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#1a1a37] flex flex-col lg:flex-row font-sans antialiased">
      {/* ZONE 1: Left Sidebar on Pure White */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        adminUser={adminUser}
        onOpenLogin={() => setIsLoginOpen(true)}
        onLogout={handleLogout}
        unreadCount={sedesWithIssues.length}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* ZONE 2: Center Main Workspace on Pure White */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen bg-white">
        {/* Top Navbar Header on Pure White */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Mobile Sidebar Menu Toggle */}
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-[#1a1a37] hover:bg-slate-100 cursor-pointer"
              title="Abrir menú"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Mobile Neuromédica Logo */}
            <div className="lg:hidden">
              <NeuromedicaLogo size="sm" />
            </div>

            {/* Title for Tablet and Desktop */}
            <div className="hidden sm:block">
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#1a1a37] tracking-tight">
                {getTabTitle()}
              </h1>
              <p className="text-xs text-[#646482]">
                NEUROMÉDICA • Sistema Central de Seguridad y Cámaras
              </p>
            </div>
          </div>

          {/* Right Toolbar */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Live Clock Pill America/Bogota in #00a6e4 */}
            <div className="flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-[#00a6e4]/10 border border-[#00a6e4]/20 text-[11px] sm:text-xs font-semibold text-[#00a6e4]">
              <Clock className="w-3 sm:w-3.5 h-3 sm:h-3.5 shrink-0" />
              <span>{bogotaTime}</span>
              <span className="text-[9px] sm:text-[10px] text-[#1a1a37] uppercase font-bold hidden xs:inline">COL</span>
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={() => fetchData(true)}
              disabled={isRefreshing}
              className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-[#00a6e4] hover:bg-slate-50 transition-colors cursor-pointer"
              title="Sincronizar ahora"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#00a6e4]' : ''}`} />
            </button>

            {/* Mobile quick admin button & logout */}
            {adminUser ? (
              <div className="flex items-center gap-1.5 lg:hidden">
                <button
                  type="button"
                  onClick={() => setCurrentTab('admin')}
                  className="p-1.5 rounded-xl bg-[#00a6e4]/10 text-[#00a6e4] hover:bg-[#00a6e4]/20 cursor-pointer"
                  title="Panel Admin"
                >
                  <ShieldCheck className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 cursor-pointer"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsLoginOpen(true)}
                className="lg:hidden p-1.5 rounded-xl text-slate-400 hover:text-[#00a6e4] hover:bg-slate-50 cursor-pointer"
                title="Acceso Administrador"
              >
                <Lock className="w-4 h-4" />
              </button>
            )}

            {/* Print / PDF Button (tablet/desktop) */}
            <button
              type="button"
              onClick={handlePrint}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#1a1a37] bg-white border border-slate-200 hover:border-[#00a6e4]/50 cursor-pointer shadow-2xs"
              title="Imprimir o exportar PDF"
            >
              <Printer className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>
          </div>
        </header>

        {/* Central Content Area on Pure White with bottom padding for mobile bar */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-6xl w-full bg-white pb-24 lg:pb-8">
          {/* Admin Announcement Banner if logged in */}
          {adminUser && (
            <div className="no-print p-3.5 rounded-2xl bg-gradient-to-r from-[#1a1a37] via-[#1a1a37] to-[#00a6e4] text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00a6e4] ring-4 ring-[#00a6e4]/30 animate-pulse shrink-0" />
                <span className="text-xs font-semibold">
                  Modo Administrador Activo ({adminUser.email}).
                </span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                <button
                  type="button"
                  onClick={() => setIsBulkReviewOpen(true)}
                  className="flex-1 sm:flex-initial px-3 py-1.5 rounded-xl text-xs font-bold bg-[#00a6e4] text-white hover:bg-[#008ec5] cursor-pointer shadow-2xs text-center"
                >
                  Pase de Guardia
                </button>
                <button
                  type="button"
                  onClick={() => setIsSedeManagementOpen(true)}
                  className="flex-1 sm:flex-initial px-3 py-1.5 rounded-xl text-xs font-bold bg-white/15 hover:bg-white/25 text-white cursor-pointer text-center"
                >
                  Gestión Sedes
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600/90 hover:bg-rose-600 text-white cursor-pointer shadow-2xs text-center transition-colors"
                  title="Cerrar sesión de administrador"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Cerrar sesión</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 1: RESUMEN */}
          {currentTab === 'resumen' && (
            <>
              {/* Mobile Global Security Status Banner */}
              <div className="lg:hidden dashboard-card p-4 bg-white border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#646482]">
                    Estado Global de Seguridad
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${securityStatus.badgeBg}`}>
                    {securityStatus.label}
                  </span>
                </div>

                <div className="flex items-center gap-3.5 py-1">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white bg-gradient-to-br ${securityStatus.bgGradient} shadow-md shrink-0`}>
                    <securityStatus.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#1a1a37] leading-tight">
                      {securityStatus.label}
                    </h4>
                    <p className="text-xs text-[#646482] mt-0.5">
                      {securityStatus.sublabel}
                    </p>
                  </div>
                </div>

                {sedesWithIssues.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentTab('novedades');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="mt-3 w-full py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold text-center border border-amber-200 transition-colors cursor-pointer"
                  >
                    Ver las {sedesWithIssues.length} sedes que requieren atención →
                  </button>
                )}
              </div>

              {/* Clean White KPI Cards */}
              <TopFloatingKpiCard
                stats={stats}
                activeFilter={statusFilter}
                onFilterChange={(f) => setStatusFilter(f)}
              />

              {/* Sedes Section Header */}
              <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
                <div>
                  <h3 className="text-base font-bold text-[#1a1a37]">
                    Matriz de Sedes
                  </h3>
                  <p className="text-xs text-[#646482]">
                    Mostrando {filteredAndSortedSedes.length} de {sedes.length} sedes
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="inline-flex p-1 rounded-xl bg-white border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        viewMode === 'grid'
                          ? 'bg-[#5B7CFA] text-white shadow-xs'
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                      title="Vista tarjetas"
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('table')}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        viewMode === 'table'
                          ? 'bg-[#5B7CFA] text-white shadow-xs'
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                      title="Vista tabla"
                    >
                      <TableIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Search and Filters Toolbar */}
          {['resumen', 'sedes', 'novedades'].includes(currentTab) && (
            <div className="dashboard-card p-4 space-y-3 bg-white border border-[#E7EBF5] rounded-3xl shadow-[0_4px_20px_-4px_rgba(91,124,250,0.04)]">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
                {/* Search Input */}
                <div className="lg:col-span-5 relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar por sede, grupo o novedad..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-[#1a1a37] focus:outline-hidden focus:ring-2 focus:ring-[#5B7CFA]"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-[#1a1a37] cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Group Selector */}
                <div className="lg:col-span-4">
                  <select
                    value={selectedGroup}
                    onChange={(e) => setSelectedGroup(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-[#1a1a37] focus:outline-hidden focus:ring-2 focus:ring-[#5B7CFA] font-medium"
                  >
                    {groupsList.map((g) => (
                      <option key={g} value={g}>
                        {g === 'TODOS' ? '🏢 Todos los Grupos' : g}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort Order */}
                <div className="lg:col-span-3">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-[#1a1a37] focus:outline-hidden focus:ring-2 focus:ring-[#5B7CFA] font-medium"
                  >
                    <option value="prioridad">⚠️ Atención prioritaria</option>
                    <option value="alfabetico">🔤 Orden Alfabético (A - Z)</option>
                    <option value="revision">⏳ Última revisión</option>
                  </select>
                </div>
              </div>

              {/* Status chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none flex-nowrap sm:flex-wrap pt-2 border-t border-slate-100 text-xs">
                <span className="text-[#646482] font-medium mr-1 shrink-0">Filtrar:</span>
                {[
                  { id: 'todas', label: 'Todas las sedes' },
                  { id: 'operativas', label: '🟢 100% Operativas' },
                  { id: 'novedad', label: '🟡 Con Novedad' },
                  { id: 'desactivadas', label: '🔴 Desactivadas' },
                ].map((btn) => (
                  <motion.button
                    key={btn.id}
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setStatusFilter(btn.id)}
                    className={`px-3 py-1 rounded-full font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                      statusFilter === btn.id
                        ? 'bg-[#5B7CFA] text-white shadow-2xs'
                        : 'bg-[#1a1a37]/5 text-[#1a1a37] hover:bg-[#1a1a37]/10'
                    }`}
                  >
                    {btn.label}
                  </motion.button>
                ))}

                {(statusFilter !== 'todas' || selectedGroup !== 'TODOS' || searchTerm) && (
                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter('todas');
                      setSelectedGroup('TODOS');
                      setSearchTerm('');
                    }}
                    className="text-xs text-[#5B7CFA] hover:underline ml-auto font-medium cursor-pointer shrink-0 whitespace-nowrap"
                  >
                    Limpiar
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Sedes Display: Cards or Table */}
          {['resumen', 'sedes', 'novedades'].includes(currentTab) && (
            <>
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-44 bg-slate-100 rounded-3xl" />
                  ))}
                </div>
              ) : filteredAndSortedSedes.length > 0 ? (
                viewMode === 'grid' ? (
                  <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredAndSortedSedes.map((sede) => (
                      <SedeCard
                        key={sede.id}
                        sede={sede}
                        isAdmin={!!adminUser}
                        onViewHistory={handleOpenSedeHistory}
                        onEditStatus={(s) => setEditingStatusSede(s)}
                        onMarkOperational={handleMarkOperational}
                      />
                    ))}
                  </motion.div>
                ) : (
                  <SedeTableView
                    sedes={filteredAndSortedSedes}
                    isAdmin={!!adminUser}
                    onViewHistory={handleOpenSedeHistory}
                    onEditStatus={(s) => setEditingStatusSede(s)}
                    onMarkOperational={handleMarkOperational}
                  />
                )
              ) : (
                <div className="text-center py-16 px-4 dashboard-card bg-white border border-slate-200">
                  <Filter className="w-10 h-10 mx-auto text-slate-300 mb-3 opacity-60" />
                  <h4 className="text-base font-bold text-[#1a1a37]">
                    No se encontraron sedes con los filtros aplicados
                  </h4>
                  <p className="text-xs text-[#646482] mt-1 max-w-sm mx-auto">
                    Prueba a restablecer los filtros de búsqueda o seleccionar "Todas las sedes".
                  </p>
                </div>
              )}
            </>
          )}

          {/* TAB: HISTORIAL */}
          {currentTab === 'historial' && (
            <div className="dashboard-card p-6 space-y-4 bg-white border border-slate-200">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-[#1a1a37]">
                    Trazabilidad de Revisiones y Cambios
                  </h3>
                  <p className="text-xs text-[#646482]">
                    Auditoría cronológica con fecha, responsable y detalle de eventos
                  </p>
                </div>
                <a
                  href="/api/export/historial-csv"
                  download
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#00a6e4] text-white hover:bg-[#008ec5] transition-colors shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  Exportar CSV
                </a>
              </div>

              <div className="space-y-3">
                {historyList.map((h) => (
                  <div
                    key={h.id}
                    className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-between gap-3 flex-wrap hover:border-[#00a6e4]/40 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-extrabold text-[#1a1a37] uppercase">
                          {h.sede_nombre}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00a6e4]/10 text-[#00a6e4] font-bold">
                          {h.tipo_evento}
                        </span>
                      </div>
                      <p className="text-xs text-[#646482]">
                        Cámaras: {h.estado_camaras_nuevo} • Alarma: {h.estado_alarma_nuevo}
                      </p>
                      {h.nota_nueva && (
                        <p className="text-xs text-amber-800 mt-1 font-medium">
                          Nota: "{h.nota_nueva}"
                        </p>
                      )}
                    </div>
                    <div className="text-right text-xs text-[#646482]">
                      <span className="font-semibold block text-[#1a1a37]">{formatBogotaDate(h.fecha)}</span>
                      <span>Por: {h.usuario}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: REPORTES */}
          {currentTab === 'reportes' && (
            <div className="dashboard-card p-6 space-y-6 bg-white border border-slate-200">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-[#1a1a37]">
                    Centro de Reportes Ejecutivos
                  </h3>
                  <p className="text-xs text-[#646482]">
                    Descarga y exporta el estado de seguridad en múltiples formatos
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl border border-slate-200 bg-white flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-[#1a1a37] mb-1">
                      Informe Ejecutivo en PDF / Impresión
                    </h4>
                    <p className="text-xs text-[#646482] mb-4">
                      Genera una versión limpia con membrete de NEUROMÉDICA lista para imprimir o guardar en PDF.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#00a6e4] text-white hover:bg-[#008ec5] transition-colors cursor-pointer shadow-2xs"
                  >
                    <Printer className="w-4 h-4" />
                    Imprimir / Guardar PDF
                  </button>
                </div>

                <div className="p-5 rounded-2xl border border-slate-200 bg-white flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-[#1a1a37] mb-1">
                      Matriz Completa en Excel (CSV)
                    </h4>
                    <p className="text-xs text-[#646482] mb-4">
                      Descarga todas las 51 sedes con fecha de última revisión, responsable y notas en formato compatible con Excel.
                    </p>
                  </div>
                  <a
                    href="/api/export/sedes-csv"
                    download
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-2xs"
                  >
                    <Download className="w-4 h-4" />
                    Descargar Excel (CSV)
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* TAB: ADMIN HUB */}
          {currentTab === 'admin' && adminUser && (
            <div className="dashboard-card p-6 space-y-6 bg-white border border-slate-200">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-wrap gap-3">
                <div>
                  <h3 className="text-base font-bold text-[#1a1a37]">
                    Herramientas del Administrador de Seguridad
                  </h3>
                  <p className="text-xs text-[#646482]">
                    Sesión activa: <strong className="text-[#00a6e4]">{adminUser.email}</strong> • Gestiona sedes, pases de guardia y cuentas
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer shadow-2xs"
                  title="Cerrar sesión de administrador"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Cerrar sesión</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  type="button"
                  onClick={() => setIsBulkReviewOpen(true)}
                  className="p-5 rounded-2xl bg-white text-left hover:border-[#00a6e4]/50 transition-all cursor-pointer border border-slate-200 shadow-2xs"
                >
                  <CheckCheck className="w-6 h-6 text-[#00a6e4] mb-2" />
                  <h4 className="text-sm font-bold text-[#1a1a37]">
                    Pase de Guardia Masivo
                  </h4>
                  <p className="text-xs text-[#646482] mt-1">
                    Recorre todas las sedes y guarda los estados con un solo clic.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setIsSedeManagementOpen(true)}
                  className="p-5 rounded-2xl bg-white text-left hover:border-[#00a6e4]/50 transition-all cursor-pointer border border-slate-200 shadow-2xs"
                >
                  <Building2 className="w-6 h-6 text-[#00a6e4] mb-2" />
                  <h4 className="text-sm font-bold text-[#1a1a37]">
                    Gestión de Sedes
                  </h4>
                  <p className="text-xs text-[#646482] mt-1">
                    Añade nuevas sedes, renombra, reasigna grupos o archiva.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setIsUserManagementOpen(true)}
                  className="p-5 rounded-2xl bg-white text-left hover:border-[#00a6e4]/50 transition-all cursor-pointer border border-slate-200 shadow-2xs"
                >
                  <User className="w-6 h-6 text-[#00a6e4] mb-2" />
                  <h4 className="text-sm font-bold text-[#1a1a37]">
                    Seguridad & Claves
                  </h4>
                  <p className="text-xs text-[#646482] mt-1">
                    Cambia tu contraseña o crea administradores adicionales.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-5 rounded-2xl bg-white text-left hover:border-rose-300 hover:bg-rose-50/30 transition-all cursor-pointer border border-slate-200 shadow-2xs group"
                >
                  <LogOut className="w-6 h-6 text-rose-500 mb-2 group-hover:scale-110 transition-transform" />
                  <h4 className="text-sm font-bold text-rose-700">
                    Cerrar Sesión
                  </h4>
                  <p className="text-xs text-[#646482] mt-1">
                    Salir de la cuenta de administrador de forma segura.
                  </p>
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ZONE 3: Right Panel with Dynamic Security Emblem on Pure White */}
      <RightPanel
        adminUser={adminUser}
        onOpenLogin={() => setIsLoginOpen(true)}
        onEditProfile={() => setIsUserManagementOpen(true)}
        onLogout={handleLogout}
        sedesWithIssues={sedesWithIssues}
        allSedesCount={sedes.length}
        historyList={historyList}
        onSelectSede={(sede) => {
          setEditingStatusSede(sede);
        }}
      />

      {/* Mobile Bottom Fixed Navigation Bar */}
      <MobileBottomNav
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        unreadCount={sedesWithIssues.length}
        adminUser={adminUser}
        onOpenLogin={() => setIsLoginOpen(true)}
      />

      {/* MODALS */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        sede={historySelectedSede}
      />

      <EditStatusModal
        isOpen={!!editingStatusSede}
        onClose={() => setEditingStatusSede(null)}
        sede={editingStatusSede}
        onSave={handleSaveStatus}
      />

      <BulkReviewModal
        isOpen={isBulkReviewOpen}
        onClose={() => setIsBulkReviewOpen(false)}
        sedes={sedes}
        onSaveBulk={handleSaveBulk}
      />

      <SedeManagementModal
        isOpen={isSedeManagementOpen}
        onClose={() => setIsSedeManagementOpen(false)}
        sedes={sedes}
        onAddSede={handleAddSede}
        onEditSede={handleEditSede}
        onToggleArchiveSede={handleToggleArchiveSede}
        onDeletePermanentSede={handleDeletePermanentSede}
        onResetDefaults={handleResetDefaults}
      />

      <AdminLoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLogin={handleLogin}
      />

      {adminUser && (
        <AdminUserModal
          isOpen={isUserManagementOpen}
          onClose={() => setIsUserManagementOpen(false)}
          currentUser={adminUser}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}
