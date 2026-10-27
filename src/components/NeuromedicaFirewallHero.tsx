import React, { useState } from 'react';
import {
  ShieldCheck,
  Video,
  BellRing,
  Building,
  Check,
  ArrowUpRight,
  Radio,
  Lock,
  LogOut,
  ChevronDown,
  AlertTriangle,
} from 'lucide-react';
import { ResumenEstadisticas, SedeConEstado, AdminUser } from '../types';

interface NeuromedicaFirewallHeroProps {
  stats: ResumenEstadisticas | null;
  sedes: SedeConEstado[];
  sedesWithIssues: SedeConEstado[];
  adminUser: AdminUser | null;
  onOpenBulkReview: () => void;
  onOpenLogin: () => void;
  onLogout: () => void;
  onViewNovedades: () => void;
  onFilterChange: (filter: string) => void;
  bogotaTime?: string;
}

export const NeuromedicaFirewallHero: React.FC<NeuromedicaFirewallHeroProps> = ({
  stats,
  sedes,
  sedesWithIssues,
  adminUser,
  onOpenBulkReview,
  onOpenLogin,
  onLogout,
  onViewNovedades,
  onFilterChange,
  bogotaTime,
}) => {
  // Real-time calculations
  const totalSedes = sedes.length || 13;
  const issuesCount = sedesWithIssues.length;
  const okCount = totalSedes - issuesCount;
  const alarmasArmadasCount = sedes.filter((s) => s.estado_alarma === 'operativo').length;

  return (
    <section className="relative w-full overflow-hidden rounded-3xl bg-[#060607] text-white shadow-2xl border border-white/10 my-2 select-none">
      {/* 1. Background Media: Sweeping violet, pink, and electric-blue light bands */}
      <div
        className="absolute inset-0 bg-cover bg-center pointer-events-none opacity-85 transition-opacity duration-1000"
        style={{
          backgroundImage: `url('https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/14718e72-5eb9-4186-a0c5-2339094b274d.webp')`,
          backgroundPosition: 'center 35%',
        }}
      />

      {/* 2. Seamless dark gradient overlay for crystal clear contrast & typography legibility */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#060607]/95 via-[#060607]/80 to-[#060607]/65 pointer-events-none" />
      <div className="absolute inset-0 bg-radial from-transparent via-[#060607]/30 to-[#060607]/95 pointer-events-none" />

      {/* 3. Scaled Hero Content Frame */}
      <div className="relative z-10 p-5 sm:p-8 lg:p-12 flex flex-col justify-between min-h-[580px] lg:min-h-[660px]">
        {/* NAV HEADER (Desktop & Mobile) */}
        <header className="animate-hero-fade flex items-center justify-between pb-6 border-b border-white/10 gap-4 flex-wrap">
          {/* Left: Shield mark with check, flanked by two short dashes, and "Neuromédica" */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-3 bg-[#08CFFE] rounded-full opacity-60" />
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#08CFFE] via-[#00a6e4] to-[#1a1a37] p-[1px] shadow-lg shadow-[#08CFFE]/20">
                <div className="w-full h-full bg-[#0a0b16] rounded-[11px] flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-[#08CFFE]" />
                </div>
              </div>
              <span className="w-1.5 h-3 bg-[#08CFFE] rounded-full opacity-60" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold tracking-wider text-sm sm:text-base text-white">
                Neuromédica
              </span>
              <span className="text-[10px] text-[#08CFFE] font-mono tracking-widest uppercase">
                SECURITY FIREWALL & CCTV
              </span>
            </div>
          </div>

          {/* Centre: Nav items */}
          <div className="hidden md:flex items-center gap-6 text-xs text-[#D6D7E6]/80 font-medium">
            <button
              type="button"
              onClick={() => onFilterChange('todas')}
              className="hover:text-white transition-colors cursor-pointer flex items-center gap-1 bg-transparent border-0"
            >
              Plataforma <ChevronDown className="w-3 h-3 opacity-60" />
            </button>
            <button
              type="button"
              onClick={onViewNovedades}
              className="hover:text-white transition-colors cursor-pointer flex items-center gap-1 bg-transparent border-0"
            >
              Novedades
              {issuesCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-500/80 text-[10px] text-white font-bold ml-1">
                  {issuesCount}
                </span>
              )}
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>
            <button
              type="button"
              onClick={onOpenBulkReview}
              className="hover:text-white transition-colors cursor-pointer bg-transparent border-0"
            >
              Pase de Guardia
            </button>
            <button
              type="button"
              onClick={() => onFilterChange('todas')}
              className="hover:text-white transition-colors cursor-pointer flex items-center gap-1 bg-transparent border-0"
            >
              13 Sedes <ChevronDown className="w-3 h-3 opacity-60" />
            </button>
          </div>

          {/* Right: White "Sign In" or Admin session pill */}
          <div className="flex items-center gap-2.5">
            {adminUser ? (
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/15 px-3.5 py-1.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-[#32CD32] animate-pulse" />
                <span className="text-xs text-white font-semibold max-w-[130px] sm:max-w-[200px] truncate">
                  {adminUser.nombre || adminUser.email}
                </span>
                <button
                  type="button"
                  onClick={onLogout}
                  className="p-1 rounded-full hover:bg-rose-500/25 text-rose-300 hover:text-white transition-colors cursor-pointer"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenLogin}
                className="group flex items-center gap-1.5 bg-white text-[#060607] hover:bg-slate-100 px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-md hover:shadow-lg cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-[#060607]" />
                <span>Acceso Admin</span>
              </button>
            )}
          </div>
        </header>

        {/* HERO BODY: Left Copy & Right Flow Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center py-6 sm:py-10">
          {/* LEFT: Copy (Left-aligned on desktop, Centered on phones/tablets) */}
          <div className="lg:col-span-6 flex flex-col items-center lg:items-start text-center lg:text-left space-y-5 sm:space-y-6">
            {/* Badge: Small ring icon and spaced caps */}
            <div className="animate-hero-fade inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/15 backdrop-blur-md">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#08CFFE] opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#08CFFE]" />
              </span>
              <span className="text-[11px] font-mono tracking-wider font-semibold text-[rgba(232,226,250,0.85)] uppercase">
                CENTRO DE CONTROL & SEGURIDAD · ANTIOQUIA
              </span>
            </div>

            {/* Headline: 3 Lines bold */}
            <h1 className="text-4xl sm:text-5xl lg:text-[62px] font-black text-white tracking-tight leading-[1.06] drop-shadow-sm">
              <span className="block animate-hero-rise-1">Supervisión 24/7</span>
              <span className="block animate-hero-rise-2 bg-gradient-to-r from-white via-white to-[#08CFFE] bg-clip-text text-transparent">
                Seguridad & Cámaras
              </span>
              <span className="block animate-hero-rise-3 text-[#08CFFE]">
                Neuromédica
              </span>
            </h1>

            {/* Subtitle */}
            <p className="animate-hero-sub text-sm sm:text-base text-[#D6D7E6] max-w-xl leading-relaxed font-normal">
              Supervisión en tiempo real de CCTV, sistemas de intrusión DSC y protocolos operativos en las 13 sedes médicas de Antioquia. Detección inmediata de novedades y pase de guardia continuo con evidencia auditable.
            </p>

            {/* Buttons: White "Pase de Guardia" with circular ↗ chip + Outlined button */}
            <div className="animate-hero-btn flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-1 w-full sm:w-auto">
              {/* White pill with black circular ↗ chip */}
              <button
                type="button"
                onClick={onOpenBulkReview}
                className="group flex items-center justify-center gap-3 bg-white text-[#060607] hover:bg-slate-100 px-6 py-3.5 rounded-full text-xs sm:text-sm font-bold tracking-tight transition-all duration-300 transform hover:-translate-y-0.5 shadow-xl shadow-black/40 cursor-pointer w-full sm:w-auto"
              >
                <span>Pase de Guardia</span>
                <span className="w-6 h-6 rounded-full bg-[#060607] text-white flex items-center justify-center transition-transform duration-300 group-hover:rotate-45">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </button>

              {/* Outlined pill: "Ver Novedades" or "Sedes Seguras" */}
              <button
                type="button"
                onClick={onViewNovedades}
                className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-xs sm:text-sm font-semibold text-white bg-white/5 hover:bg-white/10 border border-white/20 hover:border-[#08CFFE]/60 backdrop-blur-md transition-all duration-300 cursor-pointer w-full sm:w-auto"
              >
                {issuesCount > 0 ? (
                  <>
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Ver {issuesCount} Novedades</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-[#32CD32] shrink-0" />
                    <span>13 Sedes Protegidas</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Live Indicators */}
            <div className="animate-hero-fade flex items-center gap-4 text-xs text-[#D6D7E6]/75 pt-2 font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#32CD32]" />
                {okCount} Sedes OK
              </span>
              <span>·</span>
              <span className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${issuesCount > 0 ? 'bg-amber-400 animate-pulse' : 'bg-slate-500'}`} />
                {issuesCount} Novedad(es)
              </span>
              <span>·</span>
              <span className="text-[#08CFFE] font-bold">
                {bogotaTime ? `${bogotaTime} BOG` : 'Activo 24/7'}
              </span>
            </div>
          </div>

          {/* RIGHT: Flow Card ("Firewall" Flow) */}
          <div className="lg:col-span-6 flex justify-center lg:justify-end">
            <div className="animate-flow-card relative w-full max-w-[490px] rounded-3xl bg-[rgba(24,25,38,0.85)] border border-white/15 backdrop-blur-xl p-5 sm:p-7 shadow-2xl overflow-hidden group">
              {/* Card Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-[#08CFFE] animate-pulse" />
                  <span className="text-xs font-mono font-semibold tracking-wider text-white uppercase">
                    FILTRO Y FLUJO DE SEGURIDAD
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#08CFFE]/10 border border-[#08CFFE]/30 text-[10px] font-mono text-[#08CFFE]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#08CFFE] animate-ping" />
                  <span>ONLINE</span>
                </div>
              </div>

              {/* FLOW DIAGRAM: Inputs -> Shield Hub -> Outputs */}
              <div className="relative py-6 my-2 min-h-[300px] flex items-center justify-between">
                {/* SVG CONNECTORS (Lines white at 42% joining to central hub and fanning out to cyan clean outputs) */}
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  viewBox="0 0 440 280"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <filter id="hubGlow" x="-30%" y="-30%" width="160%" height="160%">
                      <feGaussianBlur stdDeviation="4" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>

                  {/* Connectors from Inputs (Left x: 125) to Hub (Center x: 220, y: 140) */}
                  {/* Top: Cámaras CCTV */}
                  <path
                    d="M 125 45 C 165 45, 175 140, 205 140"
                    stroke="rgba(255, 255, 255, 0.42)"
                    strokeWidth="1.6"
                    strokeDasharray="4 4"
                  />
                  {/* Mid: Alarmas DSC */}
                  <path
                    d="M 125 140 L 205 140"
                    stroke="rgba(255, 255, 255, 0.42)"
                    strokeWidth="1.6"
                    strokeDasharray="4 4"
                  />
                  {/* Bottom: 13 Sedes */}
                  <path
                    d="M 125 235 C 165 235, 175 140, 205 140"
                    stroke="rgba(255, 255, 255, 0.42)"
                    strokeWidth="1.6"
                    strokeDasharray="4 4"
                  />

                  {/* Flowing animated light pulses into hub */}
                  <circle r="3" fill="#08CFFE" filter="url(#hubGlow)">
                    <animateMotion
                      path="M 125 45 C 165 45, 175 140, 205 140"
                      dur="2.4s"
                      repeatCount="indefinite"
                    />
                  </circle>
                  <circle r="3" fill="#08CFFE" filter="url(#hubGlow)">
                    <animateMotion
                      path="M 125 140 L 205 140"
                      dur="1.9s"
                      repeatCount="indefinite"
                    />
                  </circle>
                  <circle r="3" fill="#08CFFE" filter="url(#hubGlow)">
                    <animateMotion
                      path="M 125 235 C 165 235, 175 140, 205 140"
                      dur="2.7s"
                      repeatCount="indefinite"
                    />
                  </circle>

                  {/* Connectors from Hub (x: 235, y: 140) to Outputs (Right x: 315) */}
                  {/* Top: Señal En Línea */}
                  <path
                    d="M 235 140 C 265 140, 275 45, 315 45"
                    stroke="#08CFFE"
                    strokeOpacity="0.75"
                    strokeWidth="1.8"
                  />
                  {/* Mid: Alarmas Armadas */}
                  <path
                    d="M 235 140 L 315 140"
                    stroke="#08CFFE"
                    strokeOpacity="0.75"
                    strokeWidth="1.8"
                  />
                  {/* Bottom: Sedes Protegidas */}
                  <path
                    d="M 235 140 C 265 140, 275 235, 315 235"
                    stroke="#08CFFE"
                    strokeOpacity="0.75"
                    strokeWidth="1.8"
                  />

                  {/* Flowing clean pulses from hub to outputs */}
                  <circle r="3" fill="#32CD32" filter="url(#hubGlow)">
                    <animateMotion
                      path="M 235 140 C 265 140, 275 45, 315 45"
                      dur="2.1s"
                      repeatCount="indefinite"
                    />
                  </circle>
                  <circle r="3" fill="#32CD32" filter="url(#hubGlow)">
                    <animateMotion
                      path="M 235 140 L 315 140"
                      dur="1.7s"
                      repeatCount="indefinite"
                    />
                  </circle>
                  <circle r="3" fill="#32CD32" filter="url(#hubGlow)">
                    <animateMotion
                      path="M 235 140 C 265 140, 275 235, 315 235"
                      dur="2.5s"
                      repeatCount="indefinite"
                    />
                  </circle>

                  {/* Stem: Thin vertical line running down from the hub, clipped by the card */}
                  <line
                    x1="220"
                    y1="172"
                    x2="220"
                    y2="280"
                    stroke="rgba(255, 255, 255, 0.25)"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                </svg>

                {/* 1. INPUTS COLUMN (Left): 3 Grey Pills with icons */}
                <div className="relative z-10 flex flex-col justify-between h-[230px] w-28 sm:w-32">
                  {/* Input Pill 1: Cámaras */}
                  <button
                    type="button"
                    onClick={() => onFilterChange('camaras_ok')}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[rgba(59,61,65,0.62)] hover:bg-[rgba(75,77,85,0.9)] border border-white/10 hover:border-white/35 text-xs text-white font-medium shadow-md transition-all duration-200 cursor-pointer text-left group/pill"
                  >
                    <Video className="w-3.5 h-3.5 text-[#08CFFE] shrink-0 group-hover/pill:scale-110 transition-transform" />
                    <div className="flex flex-col">
                      <span className="leading-tight text-[11px] font-semibold">Cámaras</span>
                      <span className="text-[9px] text-[#D6D7E6]/70">CCTV IP</span>
                    </div>
                  </button>

                  {/* Input Pill 2: Alarmas */}
                  <button
                    type="button"
                    onClick={() => onFilterChange('armadas')}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[rgba(59,61,65,0.62)] hover:bg-[rgba(75,77,85,0.9)] border border-white/10 hover:border-white/35 text-xs text-white font-medium shadow-md transition-all duration-200 cursor-pointer text-left group/pill"
                  >
                    <BellRing className="w-3.5 h-3.5 text-[#08CFFE] shrink-0 group-hover/pill:scale-110 transition-transform" />
                    <div className="flex flex-col">
                      <span className="leading-tight text-[11px] font-semibold">Alarmas</span>
                      <span className="text-[9px] text-[#D6D7E6]/70">Paneles DSC</span>
                    </div>
                  </button>

                  {/* Input Pill 3: 13 Sedes */}
                  <button
                    type="button"
                    onClick={() => onFilterChange('todas')}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[rgba(59,61,65,0.62)] hover:bg-[rgba(75,77,85,0.9)] border border-white/10 hover:border-white/35 text-xs text-white font-medium shadow-md transition-all duration-200 cursor-pointer text-left group/pill"
                  >
                    <Building className="w-3.5 h-3.5 text-[#08CFFE] shrink-0 group-hover/pill:scale-110 transition-transform" />
                    <div className="flex flex-col">
                      <span className="leading-tight text-[11px] font-semibold">13 Sedes</span>
                      <span className="text-[9px] text-[#D6D7E6]/70">Antioquia</span>
                    </div>
                  </button>
                </div>

                {/* 2. CENTRAL HUB: White rounded shield tile */}
                <div className="relative z-10 flex flex-col items-center">
                  <div className="animate-hub-pop relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white text-[#060607] flex items-center justify-center shadow-2xl shadow-[#08CFFE]/35 border-2 border-white cursor-pointer transition-transform duration-300 hover:scale-105 group/hub">
                    {/* Glowing outer aura */}
                    <div className="absolute inset-0 rounded-2xl bg-[#08CFFE] opacity-35 filter blur-lg -z-10 group-hover/hub:opacity-60 transition-opacity" />

                    <div className="flex flex-col items-center justify-center">
                      <ShieldCheck className="w-7 h-7 sm:w-8 sm:h-8 text-[#00a6e4]" />
                    </div>
                  </div>
                  <span className="mt-2 text-[10px] font-mono tracking-widest text-[#08CFFE] font-bold uppercase">
                    FIREWALL HUB
                  </span>
                </div>

                {/* 3. OUTPUTS COLUMN (Right): Cyan "Clean" Pills with cyan edge */}
                <div className="relative z-10 flex flex-col justify-between h-[230px] w-32 sm:w-36">
                  {/* Clean Pill 1: En Línea */}
                  <button
                    type="button"
                    onClick={() => onFilterChange('todas')}
                    className="animate-clean-pill-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-[rgba(12,60,82,0.62)] hover:bg-[rgba(16,80,110,0.85)] border border-[#08CFFE] text-xs text-white font-medium shadow-lg shadow-[#08CFFE]/15 transition-all duration-200 cursor-pointer text-left group/clean"
                  >
                    <div className="w-4 h-4 rounded-full bg-[#08CFFE]/20 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-[#08CFFE] stroke-[3]" />
                    </div>
                    <div className="flex flex-col">
                      <span className="leading-tight text-[11px] font-bold text-white">✓ En Línea</span>
                      <span className="text-[9px] text-[#08CFFE]">13 Sedes</span>
                    </div>
                  </button>

                  {/* Clean Pill 2: Alarmas Armadas */}
                  <button
                    type="button"
                    onClick={() => onFilterChange('armadas')}
                    className="animate-clean-pill-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-[rgba(12,60,82,0.62)] hover:bg-[rgba(16,80,110,0.85)] border border-[#08CFFE] text-xs text-white font-medium shadow-lg shadow-[#08CFFE]/15 transition-all duration-200 cursor-pointer text-left group/clean"
                  >
                    <div className="w-4 h-4 rounded-full bg-[#32CD32]/25 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-[#32CD32] stroke-[3]" />
                    </div>
                    <div className="flex flex-col">
                      <span className="leading-tight text-[11px] font-bold text-white">✓ Armadas</span>
                      <span className="text-[9px] text-[#32CD32]">{alarmasArmadasCount} Activas</span>
                    </div>
                  </button>

                  {/* Clean Pill 3: Sedes Protegidas */}
                  <button
                    type="button"
                    onClick={() => onFilterChange('todas')}
                    className="animate-clean-pill-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-[rgba(12,60,82,0.62)] hover:bg-[rgba(16,80,110,0.85)] border border-[#08CFFE] text-xs text-white font-medium shadow-lg shadow-[#08CFFE]/15 transition-all duration-200 cursor-pointer text-left group/clean"
                  >
                    <div className="w-4 h-4 rounded-full bg-[#32CD32]/25 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-[#32CD32] stroke-[3]" />
                    </div>
                    <div className="flex flex-col">
                      <span className="leading-tight text-[11px] font-bold text-white">✓ Protegidas</span>
                      <span className="text-[9px] text-[#32CD32]">Perímetro OK</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Card Footer status info */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-[#D6D7E6]/70">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#32CD32]" />
                  Protocolo DSC & NVR activo
                </span>
                <span className="font-mono text-[#08CFFE]">
                  100% OPERATIVO
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM METADATA BAR */}
        <footer className="animate-hero-fade pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#D6D7E6]/60">
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className="text-white font-semibold">NEUROMÉDICA IPS</span>
            <span>·</span>
            <span>SISTEMA CENTRAL DE SEGURIDAD Y CÁMARAS</span>
            <span>·</span>
            <span className="text-[#08CFFE]">ANTIOQUIA</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="text-slate-400">
              {stats?.total_sedes ? `${stats.total_sedes} sedes monitoreadas en tiempo real` : '13 sedes monitoreadas en tiempo real'}
            </span>
          </div>
        </footer>
      </div>
    </section>
  );
};
