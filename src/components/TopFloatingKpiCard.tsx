import React from 'react';
import { Building2, ShieldCheck, AlertTriangle, XCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { ResumenEstadisticas } from '../types';

interface TopFloatingKpiCardProps {
  stats: ResumenEstadisticas | null;
  onFilterChange: (filter: string) => void;
  activeFilter: string;
}

export const TopFloatingKpiCard: React.FC<TopFloatingKpiCardProps> = ({
  stats,
  onFilterChange,
  activeFilter,
}) => {
  if (!stats) return null;

  const total = stats.total_sedes || 1;
  const pctOperativas = Math.round((stats.operativas_100 / total) * 100);

  return (
    <div className="dashboard-card p-3 sm:p-4 mb-4 bg-white border border-[#E7EBF5] shadow-[0_4px_20px_-4px_rgba(91,124,250,0.06)] rounded-3xl">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5 items-stretch">
        {/* Total Sedes */}
        <motion.button
          type="button"
          whileHover={{ y: -2, transition: { type: 'spring', stiffness: 450, damping: 25 } }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onFilterChange('todas')}
          className={`text-left p-3.5 rounded-2xl border transition-colors cursor-pointer flex flex-col justify-between ${
            activeFilter === 'todas'
              ? 'border-[#5B7CFA] bg-[#5B7CFA]/5 ring-2 ring-[#5B7CFA]/20'
              : 'border-slate-200/80 hover:border-[#5B7CFA]/40 bg-white'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] sm:text-xs font-semibold text-[#646482]">
              Total Sedes
            </span>
            <div className="w-7 h-7 rounded-xl bg-[#5B7CFA]/10 flex items-center justify-center text-[#5B7CFA]">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-xl sm:text-2xl lg:text-3xl font-black text-[#1a1a37] tracking-tight block">
              {stats.total_sedes}
            </span>
            <span className="text-[11px] text-[#646482] font-medium mt-0.5 block truncate">
              Red nacional
            </span>
          </div>
        </motion.button>

        {/* 100% Operativas */}
        <motion.button
          type="button"
          whileHover={{ y: -2, transition: { type: 'spring', stiffness: 450, damping: 25 } }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onFilterChange('operativas')}
          className={`text-left p-3.5 rounded-2xl border transition-colors cursor-pointer flex flex-col justify-between ${
            activeFilter === 'operativas'
              ? 'border-[#32CD32] bg-[#32CD32]/10 ring-2 ring-[#32CD32]/20'
              : 'border-slate-200/80 hover:border-[#32CD32]/50 bg-white'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] sm:text-xs font-semibold text-[#646482]">
              Operativas
            </span>
            <div className="w-7 h-7 rounded-xl bg-[#32CD32]/15 flex items-center justify-center text-[#228B22]">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl lg:text-3xl font-black text-[#1a1a37] tracking-tight">
                {stats.operativas_100}
              </span>
              <span className="text-xs font-extrabold text-[#228B22]">
                {pctOperativas}%
              </span>
            </div>
            <span className="text-[11px] text-[#228B22] font-semibold mt-0.5 block truncate">
              Cámaras + Alarma OK
            </span>
          </div>
        </motion.button>

        {/* Con Novedad */}
        <motion.button
          type="button"
          whileHover={{ y: -2, transition: { type: 'spring', stiffness: 450, damping: 25 } }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onFilterChange('novedad')}
          className={`text-left p-3.5 rounded-2xl border transition-colors cursor-pointer flex flex-col justify-between ${
            activeFilter === 'novedad'
              ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/20'
              : 'border-slate-200/80 hover:border-amber-500/50 bg-white'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] sm:text-xs font-semibold text-[#646482]">
              Con Novedad
            </span>
            <div className="w-7 h-7 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-xl sm:text-2xl lg:text-3xl font-black text-[#1a1a37] tracking-tight block">
              {stats.con_novedad}
            </span>
            <span className="text-[11px] text-[#646482] font-medium mt-0.5 block truncate">
              {stats.con_novedad > 0 ? 'Con nota técnica' : 'Sin pendientes'}
            </span>
          </div>
        </motion.button>

        {/* Desactivadas */}
        <motion.button
          type="button"
          whileHover={{ y: -2, transition: { type: 'spring', stiffness: 450, damping: 25 } }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onFilterChange('desactivadas')}
          className={`text-left p-3.5 rounded-2xl border transition-colors cursor-pointer flex flex-col justify-between ${
            activeFilter === 'desactivadas'
              ? 'border-rose-500 bg-rose-500/10 ring-2 ring-rose-500/20'
              : 'border-slate-200/80 hover:border-rose-500/50 bg-white'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] sm:text-xs font-semibold text-[#646482]">
              Desactivadas
            </span>
            <div className="w-7 h-7 rounded-xl bg-rose-500/15 flex items-center justify-center text-rose-600">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-xl sm:text-2xl lg:text-3xl font-black text-[#1a1a37] tracking-tight block">
              {stats.con_desactivado}
            </span>
            <span className="text-[11px] text-[#646482] font-medium mt-0.5 block truncate">
              {stats.con_desactivado === 0 ? 'Ninguna (0)' : 'Atención crítica'}
            </span>
          </div>
        </motion.button>
      </div>
    </div>
  );
};
