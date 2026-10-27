import React from 'react';
import { History, Clock, FileText, CheckCheck, Edit3, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { SedeConEstado } from '../types';
import { StatusBadge } from './StatusBadge';
import { formatBogotaDate } from '../utils/date';

interface SedeCardProps {
  sede: SedeConEstado;
  isAdmin?: boolean;
  onViewHistory: (sede: SedeConEstado) => void;
  onEditStatus?: (sede: SedeConEstado) => void;
  onMarkOperational?: (sede: SedeConEstado) => void;
}

export const SedeCard: React.FC<SedeCardProps> = ({
  sede,
  isAdmin = false,
  onViewHistory,
  onEditStatus,
  onMarkOperational,
}) => {
  const hasDesactivado = sede.tiene_desactivado;
  const hasNovedad = sede.tiene_novedad;

  let cardBorder = 'border-slate-200/90 bg-white hover:border-[#5B7CFA]/50 shadow-[0_4px_16px_-4px_rgba(26,26,55,0.04)]';
  let badgeHighlight = null;

  if (hasDesactivado) {
    cardBorder = 'border-rose-300 bg-rose-50/25 ring-1 ring-rose-400/30 shadow-[0_4px_18px_-4px_rgba(239,68,68,0.1)]';
    badgeHighlight = (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500 text-white shadow-xs">
        <AlertCircle className="w-3 h-3" /> Desactivado
      </span>
    );
  } else if (hasNovedad) {
    cardBorder = 'border-amber-300 bg-amber-50/25 ring-1 ring-amber-400/30 shadow-[0_4px_18px_-4px_rgba(245,158,11,0.1)]';
    badgeHighlight = (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-white shadow-xs">
        <AlertCircle className="w-3 h-3" /> Con Novedad
      </span>
    );
  }

  return (
    <motion.div
      layout
      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
      whileHover={{ y: -3, transition: { type: 'spring', stiffness: 450, damping: 25 } }}
      whileTap={{ scale: 0.985 }}
      className={`p-5 flex flex-col justify-between rounded-3xl border transition-colors ${cardBorder}`}
    >
      <div>
        {/* Top: Group Tag & Highlight */}
        <div className="flex items-center justify-between gap-2 mb-2.5 flex-wrap">
          <span className="text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full bg-[#1a1a37]/5 text-[#1a1a37] border border-[#1a1a37]/10">
            {sede.grupo}
          </span>
          {badgeHighlight}
        </div>

        {/* Sede Name */}
        <h3 className="text-base font-extrabold text-[#1a1a37] leading-snug mb-3 tracking-tight">
          {sede.nombre}
        </h3>

        {/* System Badges: Stacked rows with clear icons and #32CD32 */}
        <div className="flex flex-col gap-2 mb-3.5">
          <StatusBadge type="camaras" status={sede.estado_camaras} size="md" />
          <StatusBadge type="alarma" status={sede.estado_alarma} size="md" />
        </div>

        {/* Note if any */}
        {sede.nota ? (
          <div
            className={`p-3 rounded-2xl text-xs mb-3 border ${
              hasNovedad || hasDesactivado
                ? 'bg-amber-50/80 text-amber-950 border-amber-200'
                : 'bg-slate-50 text-slate-700 border-slate-200/80'
            }`}
          >
            <div className="flex items-start gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <span className="font-extrabold block text-[10px] uppercase tracking-wider opacity-75">
                  Novedad:
                </span>
                <p className="mt-0.5 leading-relaxed font-medium">{sede.nota}</p>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Footer: Date & History button */}
      <div className="pt-3 border-t border-slate-100">
        <div className="flex items-center justify-between text-xs text-[#646482] mb-2.5">
          <div className="flex items-center gap-1.5 truncate">
            <Clock className="w-3.5 h-3.5 opacity-60 shrink-0" />
            <span className="truncate text-[11px] font-medium">
              {formatBogotaDate(sede.fecha_revision)}
            </span>
          </div>

          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={() => onViewHistory(sede)}
            className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#5B7CFA] hover:text-[#3B5BDB] transition-colors cursor-pointer"
          >
            <History className="w-3.5 h-3.5" />
            Historial
          </motion.button>
        </div>

        {/* Admin Quick Actions using #32CD32 for OK with tactile feedback */}
        {isAdmin && (
          <div className="flex items-center gap-2 pt-2 border-t border-dashed border-slate-100">
            {!sede.es_100_operativa && onMarkOperational && (
              <motion.button
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => onMarkOperational(sede)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-[#32CD32] hover:bg-[#2bb82b] text-white transition-colors cursor-pointer shadow-xs"
                title="Marcar como operativa"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Marcar OK
              </motion.button>
            )}

            {onEditStatus && (
              <motion.button
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => onEditStatus(sede)}
                className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  sede.es_100_operativa
                    ? 'flex-1 bg-[#5B7CFA] hover:bg-[#4B6CF0] text-white shadow-xs'
                    : 'bg-white hover:bg-slate-50 text-[#1a1a37] border border-slate-200'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                Editar
              </motion.button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};
