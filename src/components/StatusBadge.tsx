import React from 'react';
import { Camera, Bell, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { SystemStatus } from '../types';

interface StatusBadgeProps {
  type: 'camaras' | 'alarma';
  status: SystemStatus;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  type,
  status,
  size = 'md',
  showLabel = true,
}) => {
  const isCamera = type === 'camaras';
  const SystemIcon = isCamera ? Camera : Bell;

  // Exact green requested by user: #32CD32
  const config = {
    operativo: {
      label: 'Operativo',
      containerBg: 'bg-white border-[#32CD32]/40',
      pillBg: 'bg-[#32CD32]/15 text-[#14532d] border border-[#32CD32]/30',
      dotColor: 'bg-[#32CD32]',
      iconColor: 'text-[#32CD32]',
      Icon: CheckCircle2,
      badgeText: 'Operativo',
    },
    novedad: {
      label: 'Con novedad',
      containerBg: 'bg-amber-50/50 border-amber-300',
      pillBg: 'bg-amber-100 text-amber-900 border border-amber-300',
      dotColor: 'bg-amber-500 animate-pulse',
      iconColor: 'text-amber-600',
      Icon: AlertTriangle,
      badgeText: 'Novedad',
    },
    desactivado: {
      label: 'Desactivado',
      containerBg: 'bg-rose-50/50 border-rose-300',
      pillBg: 'bg-rose-100 text-rose-900 border border-rose-300',
      dotColor: 'bg-rose-500',
      iconColor: 'text-rose-600',
      Icon: XCircle,
      badgeText: 'Desactivado',
    },
  }[status] || {
    label: status,
    containerBg: 'bg-slate-50 border-slate-200',
    pillBg: 'bg-slate-100 text-slate-800 border border-slate-200',
    dotColor: 'bg-slate-400',
    iconColor: 'text-slate-500',
    Icon: CheckCircle2,
    badgeText: status,
  };

  const StatusIcon = config.Icon;

  // When showLabel is false (like in compact table cells)
  if (!showLabel) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${config.pillBg}`}
        title={`${isCamera ? 'Cámaras' : 'Alarma'}: ${config.label}`}
      >
        <span className={`w-2 h-2 rounded-full shrink-0 ${config.dotColor}`} />
        <span>{config.badgeText}</span>
      </span>
    );
  }

  return (
    <div
      className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border transition-all ${config.containerBg}`}
      title={`${isCamera ? 'Cámaras de seguridad' : 'Sistema de alarma'}: ${config.label}`}
    >
      {/* Left side: System Icon + Highly readable label in dark text */}
      <div className="flex items-center gap-2 shrink-0">
        <div className={`p-1 rounded-lg bg-slate-100 ${config.iconColor}`}>
          <SystemIcon className="w-3.5 h-3.5" />
        </div>
        <span className="font-bold text-xs text-[#1a1a37] tracking-tight whitespace-nowrap">
          {isCamera ? 'Cámaras' : 'Alarma'}
        </span>
      </div>

      {/* Right side: Status Pill with green #32CD32 or amber/rose */}
      <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-extrabold shrink-0 ${config.pillBg}`}>
        <span className={`w-2 h-2 rounded-full shrink-0 ${config.dotColor}`} />
        <span className="whitespace-nowrap">{config.badgeText}</span>
      </div>
    </div>
  );
};
