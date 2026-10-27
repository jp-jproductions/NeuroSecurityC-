import React, { useState, useEffect } from 'react';
import { X, Users, UserPlus, Key, LogOut } from 'lucide-react';
import { AdminUser } from '../types';
import { api } from '../services/api';

interface AdminUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AdminUser;
  onLogout?: () => void;
}

export const AdminUserModal: React.FC<AdminUserModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'password' | 'users' | 'new-user'>('password');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newAdminPass, setNewAdminPass] = useState('');

  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && activeTab === 'users') {
      fetchUsers();
    }
  }, [isOpen, activeTab]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await api.getUsers();
      setUsers(res.users);
    } catch {
      // ignore
    } finally {
      setLoadingUsers(false);
    }
  };

  if (!isOpen) return null;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ text: 'Las contraseñas no coinciden.', isError: true });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ text: 'La contraseña debe tener mínimo 6 caracteres.', isError: true });
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.changePassword(currentPassword, newPassword);
      setMessage({ text: res.message, isError: false });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setMessage({ text: err.message || 'Error al cambiar contraseña', isError: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!newEmail || !newName || !newAdminPass) {
      setMessage({ text: 'Complete todos los campos requeridos.', isError: true });
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.createUser({
        email: newEmail.trim(),
        nombre: newName.trim(),
        password: newAdminPass,
        rol: 'admin',
      });
      setMessage({ text: res.message, isError: false });
      setNewEmail('');
      setNewName('');
      setNewAdminPass('');
      setActiveTab('users');
      fetchUsers();
    } catch (err: any) {
      setMessage({ text: err.message || 'Error al crear administrador', isError: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#1a1a37]/50 backdrop-blur-xs">
      <div className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#00a6e4]/10 text-[#00a6e4]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#1a1a37]">
                Seguridad & Usuarios Administradores
              </h2>
              <p className="text-xs text-[#646482]">
                Sesión iniciada como: <strong className="text-[#00a6e4]">{currentUser.email}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-[#1a1a37] hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-6 pt-3 border-b border-slate-100 bg-white">
          <button
            type="button"
            onClick={() => {
              setActiveTab('password');
              setMessage(null);
            }}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'password'
                ? 'border-[#00a6e4] text-[#00a6e4]'
                : 'border-transparent text-[#646482] hover:text-[#1a1a37]'
            }`}
          >
            Cambiar Contraseña
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('users');
              setMessage(null);
            }}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'users'
                ? 'border-[#00a6e4] text-[#00a6e4]'
                : 'border-transparent text-[#646482] hover:text-[#1a1a37]'
            }`}
          >
            Administradores
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('new-user');
              setMessage(null);
            }}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all inline-flex items-center gap-1 cursor-pointer ${
              activeTab === 'new-user'
                ? 'border-[#00a6e4] text-[#00a6e4]'
                : 'border-transparent text-[#646482] hover:text-[#1a1a37]'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Nuevo Admin
          </button>
        </div>

        {message && (
          <div
            className={`mx-6 mt-4 p-3 rounded-xl text-xs font-medium flex items-center justify-between ${
              message.isError
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}
          >
            <span>{message.text}</span>
            <button
              type="button"
              onClick={() => setMessage(null)}
              className="text-xs opacity-70 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        )}

        {/* Tab 1: Password Form */}
        {activeTab === 'password' && (
          <form onSubmit={handleChangePassword} className="p-6 space-y-4 bg-white overflow-y-auto flex-1">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#1a1a37] block mb-1">
                Contraseña Actual
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white text-[#1a1a37] focus:outline-hidden focus:ring-2 focus:ring-[#00a6e4]"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#1a1a37] block mb-1">
                Nueva Contraseña
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white text-[#1a1a37] focus:outline-hidden focus:ring-2 focus:ring-[#00a6e4]"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#1a1a37] block mb-1">
                Confirmar Nueva Contraseña
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita la nueva contraseña"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white text-[#1a1a37] focus:outline-hidden focus:ring-2 focus:ring-[#00a6e4]"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-[#00a6e4] hover:bg-[#008ec5] text-white shadow-md cursor-pointer disabled:opacity-50"
              >
                <Key className="w-4 h-4" />
                {isSubmitting ? 'Actualizando...' : 'Actualizar Contraseña'}
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Users List */}
        {activeTab === 'users' && (
          <div className="p-6 space-y-2.5 max-h-72 overflow-y-auto bg-white">
            {loadingUsers ? (
              <div className="text-center py-6 text-slate-400 text-sm">Cargando usuarios...</div>
            ) : (
              users.map((u) => (
                <div
                  key={u.id}
                  className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between"
                >
                  <div>
                    <h4 className="text-sm font-bold text-[#1a1a37] flex items-center gap-1.5">
                      {u.nombre}
                      {u.id === currentUser.id && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#00a6e4]/10 text-[#00a6e4]">
                          Tú
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-[#646482]">{u.email}</p>
                  </div>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {u.rol}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Create New Admin */}
        {activeTab === 'new-user' && (
          <form onSubmit={handleCreateUser} className="p-6 space-y-4 bg-white overflow-y-auto flex-1">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#1a1a37] block mb-1">
                Nombre Completo
              </label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ej: Carlos Ramírez"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white text-[#1a1a37] focus:outline-hidden focus:ring-2 focus:ring-[#00a6e4]"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#1a1a37] block mb-1">
                Correo Corporativo
              </label>
              <input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="seguridad@neuromedica.com"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white text-[#1a1a37] focus:outline-hidden focus:ring-2 focus:ring-[#00a6e4]"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#1a1a37] block mb-1">
                Contraseña Temporal
              </label>
              <input
                type="password"
                required
                value={newAdminPass}
                onChange={(e) => setNewAdminPass(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white text-[#1a1a37] focus:outline-hidden focus:ring-2 focus:ring-[#00a6e4]"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-[#00a6e4] hover:bg-[#008ec5] text-white shadow-md cursor-pointer disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4" />
                {isSubmitting ? 'Creando...' : 'Crear Administrador'}
              </button>
            </div>
          </form>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-between">
          {onLogout ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 cursor-pointer transition-colors shadow-2xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Cerrar sesión</span>
            </button>
          ) : (
            <div />
          )}
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
