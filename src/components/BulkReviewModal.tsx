import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCheck,
  Save,
  Clock,
  Search,
  ShieldCheck,
  Camera,
  Bell,
  AlertTriangle,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SedeConEstado, SystemStatus } from '../types';
import { toLocalDatetimeInput } from '../utils/date';

interface BulkReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  sedes: SedeConEstado[];
  onSaveBulk: (payload: {
    updates: Array<{
      sede_id: string;
      estado_camaras: SystemStatus;
      estado_alarma: SystemStatus;
      nota?: string;
      fecha_revision?: string;
    }>;
    fecha_revision_general?: string;
  }) => Promise<void>;
}

export const BulkReviewModal: React.FC<BulkReviewModalProps> = ({
  isOpen,
  onClose,
  sedes,
  onSaveBulk,
}) => {
  const [itemsState, setItemsState] = useState<
    Record<
      string,
      {
        estado_camaras: SystemStatus;
        estado_alarma: SystemStatus;
        nota: string;
      }
    >
  >({});
  const [globalDate, setGlobalDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('TODOS');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const initial: Record<string, any> = {};
      sedes.forEach((s) => {
        initial[s.id] = {
          estado_camaras: s.estado_camaras || 'operativo',
          estado_alarma: s.estado_alarma || 'operativo',
          nota: s.nota || '',
        };
      });
      setItemsState(initial);
      setGlobalDate(toLocalDatetimeInput(new Date().toISOString()));
      setError(null);
      setIsSuccess(false);
    }
  }, [isOpen, sedes]);

  if (!isOpen) return null;

  const groups = ['TODOS', ...Array.from(new Set(sedes.map((s) => s.grupo)))];

  const filteredSedes = sedes.filter((s) => {
    const matchesSearch = s.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGroup = selectedGroup === 'TODOS' || s.grupo === selectedGroup;
    return matchesSearch && matchesGroup;
  });

  const handleUpdateItem = (
    sedeId: string,
    field: 'estado_camaras' | 'estado_alarma' | 'nota',
    val: any
  ) => {
    setItemsState((prev) => ({
      ...prev,
      [sedeId]: {
        ...prev[sedeId],
        [field]: val,
      },
    }));
  };

  const handleMarkAllOperational = () => {
    setItemsState((prev) => {
      const next = { ...prev };
      filteredSedes.forEach((s) => {
        next[s.id] = {
          estado_camaras: 'operativo',
          estado_alarma: 'operativo',
          nota: '',
        };
      });
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation: if any has "novedad", it must have a note
    const invalidItems = Object.entries(itemsState).filter(([id, data]) => {
      const sede = sedes.find((s) => s.id === id);
      if (!sede) return false;
      const isNovedad = data.estado_camaras === 'novedad' || data.estado_alarma === 'novedad';
      return isNovedad && (!data.nota || data.nota.trim() === '');
    });

    if (invalidItems.length > 0) {
      const invalidNames = invalidItems
        .slice(0, 3)
        .map(([id]) => sedes.find((s) => s.id === id)?.nombre || id)
        .join(', ');
      setError(
        `Hay sedes con estado "Con novedad" sin nota explicativa obligatoria: ${invalidNames}${
          invalidItems.length > 3 ? '...' : ''
        }`
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const updates = Object.entries(itemsState).map(([sede_id, data]) => ({
        sede_id,
        estado_camaras: data.estado_camaras,
        estado_alarma: data.estado_alarma,
        nota: data.nota.trim(),
      }));

      const generalDateIso = globalDate ? new Date(globalDate).toISOString() : new Date().toISOString();

      await onSaveBulk({
        updates,
        fecha_revision_general: generalDateIso,
      });

      // Show animated success feedback
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Error al guardar los estados masivos');
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-hidden">
        {/* Scrim */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#1a1a37]/50 backdrop-blur-sm"
        />

        {/* Modal Container with Spring Physics */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: 'spring', damping: 30, stiffness: 350 }}
          className="relative w-full max-w-5xl max-h-[90vh] flex flex-col rounded-3xl bg-white border border-[#E7EBF5] shadow-2xl overflow-hidden z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-white shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#5B7CFA]/10 flex items-center justify-center text-[#5B7CFA]">
                  <CheckCheck className="w-5 h-5" />
                </div>
                <h2 className="text-base sm:text-lg font-black text-[#1a1a37] tracking-tight">
                  Pase de Guardia Masivo
                </h2>
              </div>
              <p className="text-xs text-[#646482] mt-0.5 ml-10">
                Audita y actualiza el estado de las 54 sedes de forma continua
              </p>
            </div>

            <motion.button
              type="button"
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-[#1a1a37] hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Global Controls & Filters Bar */}
          <div className="p-4 border-b border-slate-100 bg-[#F9FBFF] grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            <div className="md:col-span-4 relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar sede por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-[#1a1a37] focus:outline-hidden focus:ring-2 focus:ring-[#5B7CFA]"
              />
            </div>

            <div className="md:col-span-3">
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-[#1a1a37] focus:outline-hidden focus:ring-2 focus:ring-[#5B7CFA]"
              >
                {groups.map((g) => (
                  <option key={g} value={g}>
                    {g === 'TODOS' ? 'Todos los grupos' : g}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="datetime-local"
                value={globalDate}
                onChange={(e) => setGlobalDate(e.target.value)}
                className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-200 bg-white text-[#1a1a37] focus:outline-hidden focus:ring-2 focus:ring-[#5B7CFA]"
                title="Fecha y hora de auditoría"
              />
            </div>

            <div className="md:col-span-2 text-right">
              <motion.button
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={handleMarkAllOperational}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#32CD32] hover:bg-[#2bb82b] text-white transition-colors cursor-pointer shadow-xs"
                title="Marcar todas las sedes filtradas como 100% operativas"
              >
                <ShieldCheck className="w-4 h-4" />
                Todas 100% OK
              </motion.button>
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="m-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 shadow-2xs"
            >
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Sedes List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-slate-50/60">
            {filteredSedes.map((sede) => {
              const st = itemsState[sede.id] || {
                estado_camaras: 'operativo',
                estado_alarma: 'operativo',
                nota: '',
              };

              const requiresNote = st.estado_camaras === 'novedad' || st.estado_alarma === 'novedad';

              return (
                <div
                  key={sede.id}
                  className="p-3.5 rounded-2xl border border-[#E7EBF5] bg-white shadow-2xs hover:border-[#5B7CFA]/30 transition-colors"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
                    <div className="lg:col-span-3">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#5B7CFA] block">
                        {sede.grupo}
                      </span>
                      <h4 className="text-sm font-bold text-[#1a1a37] leading-tight">
                        {sede.nombre}
                      </h4>
                    </div>

                    {/* Cameras Selector with #32CD32 */}
                    <div className="lg:col-span-3">
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-[#646482] mb-1">
                        <Camera className="w-3.5 h-3.5 text-[#5B7CFA]" />
                        <span>Cámaras:</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        {(['operativo', 'novedad', 'desactivado'] as SystemStatus[]).map((mode) => (
                          <motion.button
                            key={mode}
                            type="button"
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleUpdateItem(sede.id, 'estado_camaras', mode)}
                            className={`py-1.5 px-1 rounded-xl text-[10px] font-extrabold capitalize transition-all cursor-pointer ${
                              st.estado_camaras === mode
                                ? mode === 'operativo'
                                  ? 'bg-[#32CD32] text-white shadow-xs'
                                  : mode === 'novedad'
                                  ? 'bg-amber-500 text-white shadow-xs'
                                  : 'bg-rose-600 text-white shadow-xs'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                            }`}
                          >
                            {mode === 'operativo' ? '🟢 OK' : mode === 'novedad' ? '🟡 Novedad' : '🔴 Desact'}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Alarms Selector with #32CD32 */}
                    <div className="lg:col-span-3">
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-[#646482] mb-1">
                        <Bell className="w-3.5 h-3.5 text-[#5B7CFA]" />
                        <span>Alarma:</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        {(['operativo', 'novedad', 'desactivado'] as SystemStatus[]).map((mode) => (
                          <motion.button
                            key={mode}
                            type="button"
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleUpdateItem(sede.id, 'estado_alarma', mode)}
                            className={`py-1.5 px-1 rounded-xl text-[10px] font-extrabold capitalize transition-all cursor-pointer ${
                              st.estado_alarma === mode
                                ? mode === 'operativo'
                                  ? 'bg-[#32CD32] text-white shadow-xs'
                                  : mode === 'novedad'
                                  ? 'bg-amber-500 text-white shadow-xs'
                                  : 'bg-rose-600 text-white shadow-xs'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                            }`}
                          >
                            {mode === 'operativo' ? '🟢 OK' : mode === 'novedad' ? '🟡 Novedad' : '🔴 Desact'}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Note */}
                    <div className="lg:col-span-3">
                      <input
                        type="text"
                        placeholder={requiresNote ? 'Nota obligatoria por novedad...' : 'Nota opcional...'}
                        value={st.nota}
                        onChange={(e) => handleUpdateItem(sede.id, 'nota', e.target.value)}
                        className={`w-full px-3 py-2 text-xs rounded-xl border text-[#1a1a37] ${
                          requiresNote && !st.nota.trim()
                            ? 'border-rose-400 bg-rose-50/50'
                            : 'border-slate-200 bg-white'
                        } focus:outline-hidden focus:ring-2 focus:ring-[#5B7CFA]`}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-between gap-3">
            <span className="text-xs text-[#646482]">
              Mostrando {filteredSedes.length} de {sedes.length} sedes
            </span>

            <div className="flex items-center gap-2">
              <motion.button
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancelar
              </motion.button>

              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-md cursor-pointer transition-all ${
                  isSuccess
                    ? 'bg-[#32CD32] shadow-[#32CD32]/25'
                    : 'bg-[#5B7CFA] hover:bg-[#4869EA] shadow-[#5B7CFA]/25'
                }`}
              >
                {isSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>¡Guardado con Éxito!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{isSubmitting ? 'Guardando...' : 'Guardar Todo'}</span>
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
