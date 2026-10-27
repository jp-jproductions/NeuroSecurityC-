import React, { useState, useRef } from 'react';
import {
  User,
  ShieldCheck,
  ShieldAlert,
  Shield,
  ArrowUpRight,
  ArrowDownLeft,
  Lock,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Camera,
  Bell,
  Clock,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AdminUser, SedeConEstado, RegistroHistorial } from '../types';
import { formatBogotaTimeOnly } from '../utils/date';

interface RightPanelProps {
  adminUser: AdminUser | null;
  onOpenLogin: () => void;
  onEditProfile: () => void;
  onLogout: () => void;
  sedesWithIssues: SedeConEstado[];
  allSedesCount: number;
  historyList: RegistroHistorial[];
  onSelectSede?: (sede: SedeConEstado) => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  adminUser,
  onOpenLogin,
  onEditProfile,
  onLogout,
  sedesWithIssues,
  allSedesCount,
  historyList,
  onSelectSede,
}) => {
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Group history items by "Hoy", "Ayer", and "Anteriores"
  const groupedHistory = React.useMemo(() => {
    const today = new Date().toDateString();
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toDateString();

    const groups: { [key: string]: RegistroHistorial[] } = {
      Hoy: [],
      Ayer: [],
      Anteriores: [],
    };

    historyList.slice(0, 10).forEach((item) => {
      const itemDate = new Date(item.fecha).toDateString();
      if (itemDate === today) {
        groups.Hoy.push(item);
      } else if (itemDate === yesterday) {
        groups.Ayer.push(item);
      } else {
        groups.Anteriores.push(item);
      }
    });

    return groups;
  }, [historyList]);

  const cardsCount = sedesWithIssues.length > 0 ? sedesWithIssues.length : 1;

  // Handle drag navigation with velocity projection & rubber banding
  const handleDragEnd = (_: any, info: { offset: { x: number }; velocity: { x: number } }) => {
    const swipeThreshold = 50;
    const velocityThreshold = 300;

    if (info.offset.x < -swipeThreshold || info.velocity.x < -velocityThreshold) {
      setCarouselIndex((prev) => Math.min(prev + 1, cardsCount - 1));
    } else if (info.offset.x > swipeThreshold || info.velocity.x > velocityThreshold) {
      setCarouselIndex((prev) => Math.max(prev - 1, 0));
    }
  };

  return (
    <aside className="hidden lg:flex w-80 xl:w-92 flex-col gap-6 shrink-0 p-5 xl:p-6 bg-[#FAFBFF] border-l border-[#E7EBF5] sticky top-0 h-screen overflow-y-auto">
      {/* 1. Admin Avatar Header with Fluid Spring Physics */}
      <div className="flex flex-col items-center text-center pt-2">
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative mb-3 cursor-pointer"
        >
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#1a1a37] via-[#5B7CFA] to-[#00a6e4] flex items-center justify-center text-white shadow-lg shadow-[#5B7CFA]/25">
            {adminUser ? (
              <User className="w-10 h-10" />
            ) : (
              <Shield className="w-10 h-10 text-white" />
            )}
          </div>
          <span
            className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white ${
              adminUser ? 'bg-[#32CD32]' : 'bg-[#5B7CFA]'
            }`}
          />
        </motion.div>

        <h3 className="text-base font-bold text-[#1a1a37]">
          {adminUser ? adminUser.nombre || 'Administrador' : 'Seguridad Neuromédica'}
        </h3>
        {adminUser ? (
          <p className="text-xs text-[#646482] truncate max-w-[220px] mt-0.5">
            {adminUser.email}
          </p>
        ) : (
          <p className="text-xs text-[#646482] mt-0.5">
            Panel de supervisión central
          </p>
        )}

        {adminUser ? (
          <div className="flex items-center gap-2 mt-2.5">
            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onEditProfile}
              className="text-xs px-3 py-1.5 rounded-xl text-[#5B7CFA] hover:bg-[#5B7CFA]/10 transition-colors font-medium cursor-pointer border border-[#5B7CFA]/30 bg-white"
              title="Cambiar contraseña o gestionar administradores"
            >
              Editar perfil
            </motion.button>
            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors font-semibold cursor-pointer shadow-xs"
              title="Cerrar sesión de administrador"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Cerrar sesión</span>
            </motion.button>
          </div>
        ) : (
          <motion.button
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onOpenLogin}
            className="text-xs text-[#5B7CFA] hover:underline font-semibold mt-2 cursor-pointer flex items-center gap-1 bg-white px-3.5 py-1.5 rounded-xl border border-[#5B7CFA]/20 shadow-xs"
          >
            <Lock className="w-3.5 h-3.5" />
            Iniciar sesión de administrador
          </motion.button>
        )}
      </div>

      {/* 2. Apple-Style Fluid Blue Carousel: Sedes con Novedad o Desactivadas */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#1a1a37]">
              Atención Inmediata
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#5B7CFA]/10 text-[#5B7CFA]">
              {sedesWithIssues.length}
            </span>
          </div>

          {cardsCount > 1 && (
            <div className="flex items-center gap-1">
              <motion.button
                type="button"
                whileTap={{ scale: 0.85 }}
                disabled={carouselIndex === 0}
                onClick={() => setCarouselIndex((prev) => Math.max(prev - 1, 0))}
                className="p-1 rounded-lg bg-white border border-slate-200 text-slate-600 disabled:opacity-30 cursor-pointer hover:bg-slate-50 transition-colors shadow-2xs"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </motion.button>
              <motion.button
                type="button"
                whileTap={{ scale: 0.85 }}
                disabled={carouselIndex >= cardsCount - 1}
                onClick={() => setCarouselIndex((prev) => Math.min(prev + 1, cardsCount - 1))}
                className="p-1 rounded-lg bg-white border border-slate-200 text-slate-600 disabled:opacity-30 cursor-pointer hover:bg-slate-50 transition-colors shadow-2xs"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </motion.button>
            </div>
          )}
        </div>

        {/* Carousel Container with 1:1 Gesture Drag & Elastic Rubber-band */}
        <div className="relative overflow-hidden rounded-3xl touch-pan-y">
          <motion.div
            className="flex cursor-grab active:cursor-grabbing"
            drag="x"
            dragConstraints={{ left: -((cardsCount - 1) * 280), right: 0 }}
            dragElastic={0.25}
            onDragEnd={handleDragEnd}
            animate={{ x: -carouselIndex * 100 + '%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          >
            {sedesWithIssues.length > 0 ? (
              sedesWithIssues.map((sede) => {
                const isDesactivada = sede.tiene_desactivado;
                return (
                  <div
                    key={sede.id}
                    className="min-w-full w-full shrink-0 p-5 rounded-3xl bg-gradient-to-br from-[#5B7CFA] via-[#4F70F4] to-[#3B5BDB] text-white shadow-[0_8px_25px_-5px_rgba(91,124,250,0.35)] relative overflow-hidden select-none"
                  >
                    {/* Background geometric blur accents */}
                    <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-white/10 blur-xl pointer-events-none" />
                    <div className="absolute top-2 right-2 opacity-20">
                      {isDesactivada ? (
                        <ShieldAlert className="w-20 h-20 text-white" />
                      ) : (
                        <AlertTriangle className="w-20 h-20 text-white" />
                      )}
                    </div>

                    <div className="relative z-10 flex flex-col justify-between h-full min-h-[160px]">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/20">
                            {sede.grupo}
                          </span>
                          <span
                            className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              isDesactivada
                                ? 'bg-rose-500 text-white'
                                : 'bg-amber-400 text-amber-950 font-extrabold'
                            }`}
                          >
                            {isDesactivada ? 'Desactivado' : 'Con Novedad'}
                          </span>
                        </div>

                        <h4 className="text-base font-extrabold text-white leading-snug line-clamp-1 mb-2">
                          {sede.nombre}
                        </h4>

                        <div className="flex items-center gap-3 text-xs text-white/90 mb-2">
                          <span className="flex items-center gap-1">
                            <Camera className="w-3.5 h-3.5 opacity-80" />
                            <strong className="capitalize">{sede.estado_camaras}</strong>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Bell className="w-3.5 h-3.5 opacity-80" />
                            <strong className="capitalize">{sede.estado_alarma}</strong>
                          </span>
                        </div>

                        {sede.nota && (
                          <p className="text-xs text-white/80 line-clamp-2 bg-black/15 backdrop-blur-xs p-2 rounded-xl mb-3 font-medium">
                            "{sede.nota}"
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-white/15">
                        <span className="text-[10px] text-white/70">
                          {formatBogotaTimeOnly(sede.fecha_revision)}
                        </span>
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => onSelectSede && onSelectSede(sede)}
                          className="px-3 py-1 rounded-xl bg-white text-[#3B5BDB] font-extrabold text-xs shadow-xs hover:bg-white/90 transition-all cursor-pointer"
                        >
                          Verificar
                        </motion.button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              /* All Systems Operational Green Card */
              <div className="min-w-full w-full shrink-0 p-5 rounded-3xl bg-gradient-to-br from-[#228B22] to-[#32CD32] text-white shadow-[0_8px_25px_-5px_rgba(50,205,50,0.35)] relative overflow-hidden select-none">
                <div className="relative z-10 flex flex-col justify-between min-h-[160px]">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/20 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Estado Seguro
                      </span>
                    </div>

                    <div className="flex items-center gap-3 my-2">
                      <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0">
                        <ShieldCheck className="w-7 h-7" />
                      </div>
                      <div>
                        <h4 className="text-base font-black text-white leading-tight">
                          100% Operativo
                        </h4>
                        <p className="text-xs text-white/90 mt-0.5">
                          Todas las {allSedesCount} sedes sin novedades
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-white/80 leading-relaxed mt-2 bg-black/10 p-2 rounded-xl">
                      Todos los circuitos cerrados de televisión (CCTV) y paneles de alarma se encuentran sincronizados.
                    </p>
                  </div>

                  <div className="pt-2 text-[10px] text-white/70">
                    Última sincronización en tiempo real
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Synchronized Pagination Dots with Apple Spring Pill */}
        {cardsCount > 1 && (
          <div className="flex items-center justify-center gap-1.5 py-1">
            {Array.from({ length: cardsCount }).map((_, idx) => (
              <motion.button
                key={idx}
                type="button"
                onClick={() => setCarouselIndex(idx)}
                className="h-1.5 rounded-full cursor-pointer transition-all"
                animate={{
                  width: carouselIndex === idx ? 20 : 6,
                  backgroundColor: carouselIndex === idx ? '#5B7CFA' : '#CBD5E1',
                }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            ))}
          </div>
        )}
      </div>

      {/* 3. "Actividad reciente" Feed Grouped into Hoy / Ayer with Spring Micro-Interactions */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#1a1a37]">
            Actividad Reciente
          </h4>
          <span className="text-[10px] font-bold text-[#646482]">
            Auditoría
          </span>
        </div>

        <div className="space-y-4 overflow-y-auto pr-1">
          {Object.entries(groupedHistory).map(([groupTitle, items]) => {
            if (items.length === 0) return null;

            return (
              <div key={groupTitle} className="space-y-2">
                <span className="text-[11px] font-bold text-[#5B7CFA] uppercase tracking-wider px-2 py-0.5 bg-[#5B7CFA]/10 rounded-md inline-block">
                  {groupTitle}
                </span>

                {items.map((item) => {
                  const isDesactivada =
                    item.estado_camaras_nuevo === 'desactivado' ||
                    item.estado_alarma_nuevo === 'desactivado';
                  const isNovedad =
                    item.estado_camaras_nuevo === 'novedad' ||
                    item.estado_alarma_nuevo === 'novedad';

                  let tagLabel = 'Operativo';
                  let tagClass = 'bg-[#32CD32]/15 text-[#14532d]';
                  let iconBg = 'bg-[#32CD32]/15 text-[#228B22]';

                  if (isDesactivada) {
                    tagLabel = 'Desactivado';
                    tagClass = 'bg-rose-100 text-rose-700';
                    iconBg = 'bg-rose-100 text-rose-600';
                  } else if (isNovedad) {
                    tagLabel = 'Novedad';
                    tagClass = 'bg-amber-100 text-amber-700';
                    iconBg = 'bg-amber-100 text-amber-600';
                  }

                  return (
                    <motion.div
                      key={item.id}
                      whileHover={{ x: 3, transition: { type: 'spring', stiffness: 400, damping: 25 } }}
                      whileTap={{ scale: 0.98 }}
                      className="p-3 rounded-2xl bg-white border border-[#E7EBF5] shadow-2xs hover:border-[#5B7CFA]/40 transition-colors flex items-center justify-between gap-2.5 cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}
                        >
                          {isDesactivada ? (
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                          ) : isNovedad ? (
                            <AlertTriangle className="w-3.5 h-3.5" />
                          ) : (
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div className="truncate">
                          <h6 className="text-xs font-bold text-[#1a1a37] truncate">
                            {item.sede_nombre}
                          </h6>
                          <p className="text-[10px] text-[#646482] truncate">
                            {item.estado_camaras_nuevo !== item.estado_camaras_anterior
                              ? `Cámaras: ${item.estado_camaras_nuevo}`
                              : `Alarma: ${item.estado_alarma_nuevo}`}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md ${tagClass}`}>
                          {tagLabel}
                        </span>
                        <span className="block text-[10px] text-[#646482] mt-0.5">
                          {formatBogotaTimeOnly(item.fecha)}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
