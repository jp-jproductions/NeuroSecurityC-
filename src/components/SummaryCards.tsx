import React from 'react';
import { ShieldCheck, AlertTriangle, XCircle, Building2 } from 'lucide-react';
import { ResumenEstadisticas } from '../types';

interface SummaryCardsProps {
  stats: ResumenEstadisticas | null;
  activeFilter: string;
  onSelectFilter: (filter: string) => void;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  stats,
  activeFilter,
  onSelectFilter,
}) => {
  if (!stats) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      id: 'todas',
      title: 'Total Sedes',
      value: stats.total_sedes,
      subtitle: 'Sedes activas',
      icon: Building2,
      color: 'blue',
      borderColor: 'border-slate-200 dark:border-slate-800',
      activeRing: 'ring-2 ring-[#5B7CFA] shadow-sm',
      iconColor: 'text-[#5B7CFA]',
      iconBg: 'bg-blue-50 dark:bg-blue-950/50',
    },
    {
      id: 'operativas',
      title: '100% Operativas',
      value: stats.operativas_100,
      subtitle: `${Math.round((stats.operativas_100 / (stats.total_sedes || 1)) * 100)}% de cobertura`,
      icon: ShieldCheck,
      color: 'emerald',
      borderColor: 'border-slate-200 dark:border-slate-800',
      activeRing: 'ring-2 ring-emerald-500 shadow-sm',
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/50',
    },
    {
      id: 'novedad',
      title: 'Con Novedad',
      value: stats.con_novedad,
      subtitle: stats.con_novedad > 0 ? 'Requiere seguimiento' : 'Sin pendientes',
      icon: AlertTriangle,
      color: 'amber',
      borderColor: 'border-slate-200 dark:border-slate-800',
      activeRing: 'ring-2 ring-amber-500 shadow-sm',
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-50 dark:bg-amber-950/50',
    },
    {
      id: 'desactivadas',
      title: 'Desactivadas',
      value: stats.con_desactivado,
      subtitle: stats.con_desactivado > 0 ? 'Atención urgente' : 'Ninguna desactivada',
      icon: XCircle,
      color: 'rose',
      borderColor: 'border-slate-200 dark:border-slate-800',
      activeRing: 'ring-2 ring-rose-500 shadow-sm',
      iconColor: 'text-rose-600',
      iconBg: 'bg-rose-50 dark:bg-rose-950/50',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const isActive = activeFilter === card.id;

        return (
          <button
            key={card.id}
            type="button"
            onClick={() => onSelectFilter(card.id)}
            className={`text-left p-4 rounded-2xl border bg-white dark:bg-slate-900 transition-all hover:border-slate-300 cursor-pointer ${
              card.borderColor
            } ${isActive ? card.activeRing : 'shadow-2xs'}`}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 truncate">
                {card.title}
              </span>
              <div className={`p-2 rounded-xl shrink-0 ${card.iconBg}`}>
                <Icon className={`w-4 h-4 ${card.iconColor}`} />
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-2xl md:text-3xl font-extrabold text-[#1E2545] dark:text-white tracking-tight">
                {card.value}
              </span>
            </div>

            <p className="mt-1 text-xs text-slate-400 truncate">
              {card.subtitle}
            </p>
          </button>
        );
      })}
    </div>
  );
};
