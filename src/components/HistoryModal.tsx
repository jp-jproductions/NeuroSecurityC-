import React, { useEffect, useState } from 'react';
import { X, History, ArrowRight, Download, Calendar, User, FileText, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { RegistroHistorial, SedeConEstado } from '../types';
import { api } from '../services/api';
import { formatBogotaFull } from '../utils/date';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  sede?: SedeConEstado | null;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  sede,
}) => {
  const [history, setHistory] = useState<RegistroHistorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    api
      .getHistorial(sede ? sede.id : undefined, 50)
      .then((res) => {
        if (isMounted) {
          setHistory(res.historial);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Error al cargar el historial');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, sede]);

  if (!isOpen) return null;

  const renderStatusBadge = (status?: string) => {
    if (!status) return <span className="text-slate-400">--</span>;
    switch (status) {
      case 'operativo':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#32CD32]/15 text-[#14532d] border border-[#32CD32]/30">
            <CheckCircle2 className="w-3 h-3" /> Operativo
          </span>
        );
      case 'novedad':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
            <AlertTriangle className="w-3 h-3" /> Con Novedad
          </span>
        );
      case 'desactivado':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700">
            <XCircle className="w-3 h-3" /> Desactivado
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1a1a37]/50 backdrop-blur-xs">
      <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#00a6e4]/10 text-[#00a6e4]">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1a1a37]">
                Historial de Cambios
              </h2>
              <p className="text-xs text-[#646482]">
                {sede ? `Sede: ${sede.nombre} (${sede.grupo})` : 'Registro general de auditoría'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/api/export/historial-csv"
              download
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:border-[#00a6e4]/50 text-[#1a1a37] transition-colors shadow-2xs"
              title="Descargar historial en CSV"
            >
              <Download className="w-3.5 h-3.5 text-[#00a6e4]" />
              <span className="hidden sm:inline">Exportar</span> CSV
            </a>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-[#1a1a37] hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-white">
          {loading ? (
            <div className="py-12 text-center text-slate-400">
              <div className="inline-block w-6 h-6 border-2 border-[#00a6e4] border-t-transparent rounded-full animate-spin mb-2" />
              <p className="text-sm">Cargando registros de auditoría...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-50 text-rose-700 text-sm">
              {error}
            </div>
          ) : history.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <History className="w-10 h-10 mx-auto mb-2 opacity-40 text-[#00a6e4]" />
              <p className="text-base font-semibold text-[#1a1a37]">No hay cambios registrados todavía</p>
              <p className="text-xs text-[#646482]">
                Cualquier modificación de estado o novedad quedará asentada aquí con fecha, hora y responsable.
              </p>
            </div>
          ) : (
            <div className="relative border-l-2 border-slate-200 ml-4 space-y-6">
              {history.map((item) => (
                <div key={item.id} className="relative pl-6">
                  {/* Timeline dot in #00a6e4 */}
                  <span className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-white border-2 border-[#00a6e4]" />

                  <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
                    <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-[#1a1a37]">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatBogotaFull(item.fecha)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-[#646482]">
                        <User className="w-3.5 h-3.5" />
                        <span>{item.usuario}</span>
                      </div>
                    </div>

                    {!sede && (
                      <div className="mb-2">
                        <span className="text-xs font-bold text-[#1a1a37] uppercase">
                          {item.sede_nombre}
                        </span>
                      </div>
                    )}

                    {/* Status transition */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs my-2.5">
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="text-[10px] uppercase font-bold text-[#646482] block mb-1">
                          Cámaras
                        </span>
                        <div className="flex items-center gap-2 flex-wrap">
                          {renderStatusBadge(item.estado_camaras_anterior)}
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          {renderStatusBadge(item.estado_camaras_nuevo)}
                        </div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="text-[10px] uppercase font-bold text-[#646482] block mb-1">
                          Alarma
                        </span>
                        <div className="flex items-center gap-2 flex-wrap">
                          {renderStatusBadge(item.estado_alarma_anterior)}
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          {renderStatusBadge(item.estado_alarma_nuevo)}
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    {item.nota_nueva && (
                      <div className="mt-2 text-xs text-amber-900 flex items-start gap-1.5 p-2 rounded-xl bg-amber-50/70 border border-amber-200/80">
                        <FileText className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                        <div>
                          <strong className="text-amber-950">Observación: </strong>
                          {item.nota_nueva}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-white text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#1a1a37] hover:bg-[#1a1a37]/90 text-white cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
