import React from 'react';
import { History, CheckCheck, Edit3, Clock } from 'lucide-react';
import { SedeConEstado } from '../types';
import { StatusBadge } from './StatusBadge';
import { formatBogotaDate } from '../utils/date';

interface SedeTableViewProps {
  sedes: SedeConEstado[];
  isAdmin?: boolean;
  onViewHistory: (sede: SedeConEstado) => void;
  onEditStatus?: (sede: SedeConEstado) => void;
  onMarkOperational?: (sede: SedeConEstado) => void;
}

export const SedeTableView: React.FC<SedeTableViewProps> = ({
  sedes,
  isAdmin = false,
  onViewHistory,
  onEditStatus,
  onMarkOperational,
}) => {
  return (
    <div className="w-full overflow-x-auto dashboard-card bg-white overflow-hidden border border-slate-200">
      <table className="w-full text-left text-sm border-collapse">
        <thead>
          <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] uppercase tracking-wider text-[#646482] font-bold">
            <th className="py-4 px-5">Sede / Grupo</th>
            <th className="py-4 px-4">Cámaras</th>
            <th className="py-4 px-4">Alarma</th>
            <th className="py-4 px-4">Observaciones / Novedad</th>
            <th className="py-4 px-4">Última Revisión</th>
            <th className="py-4 px-5 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {sedes.map((sede) => {
            const hasAttention = sede.tiene_novedad || sede.tiene_desactivado;

            return (
              <tr
                key={sede.id}
                className={`transition-colors hover:bg-slate-50/80 ${
                  hasAttention ? 'bg-amber-50/20' : ''
                }`}
              >
                {/* Name & Group */}
                <td className="py-3.5 px-5">
                  <div className="font-bold text-[#1a1a37]">
                    {sede.nombre}
                  </div>
                  <span className="inline-block mt-0.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#1a1a37]/5 text-[#1a1a37]">
                    {sede.grupo}
                  </span>
                </td>

                {/* Cámaras */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <StatusBadge type="camaras" status={sede.estado_camaras} size="sm" showLabel={false} />
                </td>

                {/* Alarma */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <StatusBadge type="alarma" status={sede.estado_alarma} size="sm" showLabel={false} />
                </td>

                {/* Nota */}
                <td className="py-3.5 px-4 max-w-xs">
                  {sede.nota ? (
                    <p className={`text-xs p-1.5 rounded-xl line-clamp-2 ${
                      sede.tiene_novedad
                        ? 'bg-amber-100/60 text-amber-900 font-medium'
                        : 'text-slate-600'
                    }`}>
                      {sede.nota}
                    </p>
                  ) : (
                    <span className="text-xs text-slate-400 italic">
                      Sin observaciones
                    </span>
                  )}
                </td>

                {/* Fecha Revisión */}
                <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-600">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Clock className="w-3.5 h-3.5 opacity-60 shrink-0" />
                    <span>{formatBogotaDate(sede.fecha_revision)}</span>
                  </div>
                </td>

                {/* Actions */}
                <td className="py-3.5 px-5 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => onViewHistory(sede)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-[#00a6e4] hover:bg-[#00a6e4]/10 transition-colors cursor-pointer"
                      title="Ver historial de cambios"
                    >
                      <History className="w-4 h-4" />
                    </button>

                    {isAdmin && (
                      <>
                        {!sede.es_100_operativa && onMarkOperational && (
                          <button
                            type="button"
                            onClick={() => onMarkOperational(sede)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-[#32CD32] hover:bg-[#2bb82b] text-white cursor-pointer shadow-xs"
                            title="Marcar operativa"
                          >
                            <CheckCheck className="w-3 h-3" />
                            OK
                          </button>
                        )}

                        {onEditStatus && (
                          <button
                            type="button"
                            onClick={() => onEditStatus(sede)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-[#1a1a37] cursor-pointer"
                            title="Editar estado"
                          >
                            <Edit3 className="w-3 h-3" />
                            Editar
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
