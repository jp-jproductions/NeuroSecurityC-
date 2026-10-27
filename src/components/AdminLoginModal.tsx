import React, { useState } from 'react';
import { X, Lock, Mail, KeyRound, AlertCircle, Shield } from 'lucide-react';
import { NeuromedicaLogo } from './NeuromedicaLogo';
import { AdminUser } from '../types';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string, pass: string) => Promise<AdminUser>;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLogin,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await onLogin(email.trim(), password);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Credenciales incorrectas');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1a1a37]/50 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header & Logo in Neuromédica Colors */}
        <div className="p-6 text-center border-b border-slate-100 bg-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-[#1a1a37] hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex justify-center mb-3">
            <NeuromedicaLogo size="lg" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00a6e4]/10 text-[#00a6e4] text-xs font-bold border border-[#00a6e4]/20">
            <Shield className="w-3.5 h-3.5" />
            Acceso Administrativo de Seguridad
          </div>

          <p className="text-xs text-[#646482] mt-2">
            Solo el personal autorizado puede actualizar estados y novedades de sedes.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-white">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#1a1a37] block mb-1">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@neuromedica.com.co"
                autoComplete="email"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 bg-white text-[#1a1a37] focus:outline-hidden focus:ring-2 focus:ring-[#00a6e4]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#1a1a37] block mb-1">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                autoComplete="current-password"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 bg-white text-[#1a1a37] focus:outline-hidden focus:ring-2 focus:ring-[#00a6e4]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold bg-[#00a6e4] hover:bg-[#008ec5] text-white shadow-md shadow-[#00a6e4]/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <KeyRound className="w-4 h-4" />
            {isLoading ? 'Verificando...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
};
