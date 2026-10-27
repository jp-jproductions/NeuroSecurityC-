import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Save,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Camera,
  Bell,
  Sparkles,
  FileText,
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { SedeConEstado, SystemStatus } from '../types';
import { toLocalDatetimeInput } from '../utils/date';

interface EditStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  sede: SedeConEstado | null;
  onSave: (
    id: string,
    payload: {
      estado_camaras: SystemStatus;
      estado_alarma: SystemStatus;
      nota?: string;
      fecha_revision?: string;
    }
  ) => Promise<void>;
}

export const EditStatusModal: React.FC<EditStatusModalProps> = ({
  isOpen,
  onClose,
  sede,
  onSave,
}) => {
  const [estadoCamaras, setEstadoCamaras] = useState<SystemStatus>('operativo');
  const [estadoAlarma, setEstadoAlarma] = useState<SystemStatus>('operativo');
  const [nota, setNota] = useState('');
  const [fechaRevision, setFechaRevision] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const noteInputRef = useRef<HTMLTextAreaElement | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const isNovedadActive = estadoCamaras === 'novedad' || estadoAlarma === 'novedad';

  useEffect(() => {
    if (sede && isOpen) {
      setEstadoCamaras(sede.estado_camaras || 'operativo');
      setEstadoAlarma(sede.estado_alarma || 'operativo');
      setNota(sede.nota || '');
      setFechaRevision(toLocalDatetimeInput(sede.fecha_revision || new Date().toISOString()));
      setError(null);
    }
  }, [sede, isOpen]);

  // Spatial autofocus when user selects "Con novedad"
  useEffect(() => {
    if (isNovedadActive && noteInputRef.current) {
      const timer = setTimeout(() => {
        noteInputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isNovedadActive]);

  if (!isOpen || !sede) return null;

  const handleSetCurrentTime = () => {
    setFechaRevision(toLocalDatetimeInput(new Date().toISOString()));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isNovedadActive && (!nota || nota.trim() === '')) {
      setError('El estado "Con novedad" exige escribir una nota detallando el evento o falla.');
      return;
    }

    try {
      setIsSubmitting(true);
      const isoDate = fechaRevision ? new Date(fechaRevision).toISOString() : new Date().toISOString();

      await onSave(sede.id, {
        estado_camaras: estadoCamaras,
        estado_alarma: estadoAlarma,
        nota: nota.trim(),
        fecha_revision: isoDate,
      });

      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar el estado');
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusSegments: Array<{
    value: SystemStatus;
    label: string;
    icon: typeof CheckCircle2;
    activeColor: string;
    activeText: string;
    bgAccent: string;
  }> = [
    {
      value: 'operativo',
      label: 'Operativo',
      icon: CheckCircle2,
      activeColor: '#32CD32',
      activeText: 'text-[#14532d]',
      bgAccent: 'bg-[#32CD32]/15',
    },
    {
      value: 'novedad',
      label: 'Con Novedad',
      icon: AlertTriangle,
      activeColor: '#F59E0B',
      activeText: 'text-amber-900',
      bgAccent: 'bg-amber-100',
    },
    {
      value: 'desactivado',
      label: 'Desactivado',
      icon: XCircle,
      activeColor: '#EF4444',
      activeText: 'text-rose-900',
      bgAccent: 'bg-rose-100',
    },
  ];

  // Drag to dismiss gesture handler with velocity and rubber-band projection
  const handleDragEnd = (_: any, info: { offset: { y: number }; velocity: { y: number } }) => {
    if (info.offset.y > 120 || info.velocity.y > 500) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
        {/* Scrim Backdrop with Blur & Fade */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#1a1a37]/50 backdrop-blur-md"
        />

        {/* Apple-Style Responsive Drawer / Bottom Sheet */}
        <motion.div
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.6 }}
          onDragEnd={handleDragEnd}
          initial={
            shouldReduceMotion
              ? { opacity: 0 }
              : { y: '100%', opacity: 0.8, scale: 0.98 }
          }
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={
            shouldReduceMotion
              ? { opacity: 0 }
              : { y: '100%', opacity: 0, scale: 0.98 }
          }
          transition={{
            type: 'spring',
            damping: 32,
            stiffness: 380,
          }}
          className="relative w-full max-w-lg max-h-[92vh] sm:max-h-[88vh] flex flex-col rounded-t-[2rem] sm:rounded-3xl bg-white border border-[#E7EBF5] shadow-2xl overflow-hidden z-10"
        >
          {/* Drag Handle on Mobile with tactile pill */}
          <div className="pt-3 pb-1 flex justify-center cursor-grab active:cursor-grabbing sm:hidden">
            <div className="w-12 h-1.5 rounded-full bg-slate-300" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#5B7CFA]/10 text-[#5B7CFA]">
                  {sede.grupo}
                </span>
                <span className="text-xs font-semibold text-[#646482]">
                  Supervisión de Sede
                </span>
              </div>
              <h2 className="text-lg font-black text-[#1a1a37] mt-1 tracking-tight">
                {sede.nombre}
              </h2>
            </div>
            <motion.button
              type="button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-[#1a1a37] hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 bg-white overflow-y-auto flex-1">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2.5 shadow-2xs"
              >
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Segmented Control 1: Sistema de Cámaras (CCTV) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-[#5B7CFA]" />
                  <label className="text-xs font-extrabold uppercase tracking-wider text-[#1a1a37]">
                    Circuito de Cámaras (CCTV)
                  </label>
                </div>
                <span className="text-[11px] font-bold capitalize text-[#646482]">
                  {estadoCamaras}
                </span>
              </div>

              {/* Segmented Track with Spring Sliding Indicator */}
              <div className="grid grid-cols-3 p-1 rounded-2xl bg-slate-100 border border-slate-200/80 relative">
                {statusSegments.map((segment) => {
                  const Icon = segment.icon;
                  const isSelected = estadoCamaras === segment.value;
                  return (
                    <motion.button
                      key={segment.value}
                      type="button"
                      whileTap={{ scale: 0.96 }}
                      onClick={() => setEstadoCamaras(segment.value)}
                      className={`relative z-10 py-2.5 px-2 rounded-xl text-xs font-bold transition-colors flex flex-col items-center justify-center gap-1 cursor-pointer select-none ${
                        isSelected ? segment.activeText : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {isSelected && (
                        <motion.div
                          layoutId="camSegmentIndicator"
                          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                          className={`absolute inset-0 rounded-xl shadow-xs border border-black/5 bg-white ${segment.bgAccent}`}
                        />
                      )}
                      <span className="relative z-10 flex items-center gap-1">
                        <Icon className="w-3.5 h-3.5" />
                        <span className="truncate">{segment.label}</span>
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Segmented Control 2: Sistema de Alarma */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-[#5B7CFA]" />
                  <label className="text-xs font-extrabold uppercase tracking-wider text-[#1a1a37]">
                    Sistema de Alarma
                  </label>
                </div>
                <span className="text-[11px] font-bold capitalize text-[#646482]">
                  {estadoAlarma}
                </span>
              </div>

              {/* Segmented Track with Spring Sliding Indicator */}
              <div className="grid grid-cols-3 p-1 rounded-2xl bg-slate-100 border border-slate-200/80 relative">
                {statusSegments.map((segment) => {
                  const Icon = segment.icon;
                  const isSelected = estadoAlarma === segment.value;
                  return (
                    <motion.button
                      key={segment.value}
                      type="button"
                      whileTap={{ scale: 0.96 }}
                      onClick={() => setEstadoAlarma(segment.value)}
                      className={`relative z-10 py-2.5 px-2 rounded-xl text-xs font-bold transition-colors flex flex-col items-center justify-center gap-1 cursor-pointer select-none ${
                        isSelected ? segment.activeText : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {isSelected && (
                        <motion.div
                          layoutId="alarmSegmentIndicator"
                          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                          className={`absolute inset-0 rounded-xl shadow-xs border border-black/5 bg-white ${segment.bgAccent}`}
                        />
                      )}
                      <span className="relative z-10 flex items-center gap-1">
                        <Icon className="w-3.5 h-3.5" />
                        <span className="truncate">{segment.label}</span>
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Spatial Anchored Reveal for Note Field */}
            <AnimatePresence>
              {isNovedadActive && (
                <motion.div
                  initial={{ opacity: 0, height: 0, scale: 0.98 }}
                  animate={{ opacity: 1, height: 'auto', scale: 1 }}
                  exit={{ opacity: 0, height: 0, scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-300 ring-2 ring-amber-400/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-amber-600" />
                        <span>Detalle de la Novedad</span>
                        <span className="text-rose-500 font-extrabold">* Obligatorio</span>
                      </label>
                    </div>

                    <textarea
                      ref={noteInputRef}
                      value={nota}
                      onChange={(e) => setNota(e.target.value)}
                      rows={3}
                      placeholder="Ej: Cámara #2 con pérdida de señal. Técnico citado para mantenimiento correctivo a las 10:00 AM."
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-amber-200 bg-white text-[#1a1a37] placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500 shadow-2xs leading-relaxed"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Fecha y hora de revisión */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-extrabold uppercase tracking-wider text-[#1a1a37]">
                  Fecha y Hora de Auditoría
                </label>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSetCurrentTime}
                  className="text-[11px] font-bold text-[#5B7CFA] hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <Clock className="w-3 h-3" />
                  Hora actual (Bogotá)
                </motion.button>
              </div>
              <input
                type="datetime-local"
                value={fechaRevision}
                onChange={(e) => setFechaRevision(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/50 text-[#1a1a37] focus:outline-hidden focus:ring-2 focus:ring-[#5B7CFA] focus:bg-white transition-all shadow-2xs"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <motion.button
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
              >
                Cancelar
              </motion.button>
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#5B7CFA] hover:bg-[#4B6CF0] text-white shadow-md shadow-[#5B7CFA]/25 cursor-pointer disabled:opacity-50 transition-all"
              >
                <Save className="w-4 h-4" />
                {isSubmitting ? 'Guardando...' : 'Guardar Estado'}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
