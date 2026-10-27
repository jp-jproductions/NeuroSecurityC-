import React, { useState } from 'react';
import { X, Plus, Edit2, Trash2, Archive, Check, Building2, RotateCcw } from 'lucide-react';
import { SedeConEstado } from '../types';

interface SedeManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  sedes: SedeConEstado[];
  onAddSede: (data: { nombre: string; grupo: string }) => Promise<void>;
  onEditSede: (id: string, data: { nombre: string; grupo: string }) => Promise<void>;
  onToggleArchiveSede: (id: string) => Promise<void>;
  onDeletePermanentSede: (id: string) => Promise<void>;
  onResetDefaults: () => Promise<void>;
}

export const SedeManagementModal: React.FC<SedeManagementModalProps> = ({
  isOpen,
  onClose,
  sedes,
  onAddSede,
  onEditSede,
  onToggleArchiveSede,
  onDeletePermanentSede,
  onResetDefaults,
}) => {
  const [activeTab, setActiveTab] = useState<'lista' | 'crear'>('lista');
  const [editingSedeId, setEditingSedeId] = useState<string | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editGrupo, setEditGrupo] = useState('');

  const [newNombre, setNewNombre] = useState('');
  const [newGrupo, setNewGrupo] = useState('');
  const [customGrupo, setCustomGrupo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; isError: boolean } | null>(null);

  if (!isOpen) return null;

  const existingGroups = Array.from(new Set(sedes.map((s) => s.grupo))).sort();

  const handleStartEdit = (sede: SedeConEstado) => {
    setEditingSedeId(sede.id);
    setEditNombre(sede.nombre);
    setEditGrupo(sede.grupo);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editNombre.trim()) return;
    try {
      setIsSubmitting(true);
      await onEditSede(id, {
        nombre: editNombre.trim().toUpperCase(),
        grupo: editGrupo.trim().toUpperCase(),
      });
      setEditingSedeId(null);
      setFeedbackMsg({ text: 'Sede actualizada exitosamente.', isError: false });
    } catch (err: any) {
      setFeedbackMsg({ text: err.message || 'Error al actualizar', isError: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNombre.trim()) {
      setFeedbackMsg({ text: 'El nombre de la sede es obligatorio.', isError: true });
      return;
    }

    const finalGrupo = newGrupo === '__OTRO__' ? customGrupo : newGrupo || 'OTROS';
    if (!finalGrupo.trim()) {
      setFeedbackMsg({ text: 'Especifique el grupo de la sede.', isError: true });
      return;
    }

    try {
      setIsSubmitting(true);
      await onAddSede({
        nombre: newNombre.trim().toUpperCase(),
        grupo: finalGrupo.trim().toUpperCase(),
      });
      setNewNombre('');
      setNewGrupo('');
      setCustomGrupo('');
      setActiveTab('lista');
      setFeedbackMsg({ text: 'Nueva sede agregada correctamente.', isError: false });
    } catch (err: any) {
      setFeedbackMsg({ text: err.message || 'Error al crear la sede', isError: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = async () => {
    if (
      window.confirm(
        '¿Desea restaurar las 51 sedes iniciales de Neuromédica?'
      )
    ) {
      try {
        setIsSubmitting(true);
        await onResetDefaults();
        setFeedbackMsg({ text: 'Sedes restablecidas a los valores iniciales.', isError: false });
      } catch (err: any) {
        setFeedbackMsg({ text: err.message, isError: true });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-[#1a1a37]/50 backdrop-blur-xs">
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#00a6e4]/10 text-[#00a6e4]">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1a1a37]">
                Gestión de Sedes y Puntos de Atención
              </h2>
              <p className="text-xs text-[#646482]">
                Agrega nuevas sedes, renombra, reasigna grupos o archiva las que cambien.
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

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between px-4 sm:px-6 pt-3 border-b border-slate-100 bg-white">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('lista')}
              className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'lista'
                  ? 'border-[#00a6e4] text-[#00a6e4]'
                  : 'border-transparent text-[#646482] hover:text-[#1a1a37]'
              }`}
            >
              Lista de Sedes ({sedes.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('crear')}
              className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all inline-flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'crear'
                  ? 'border-[#00a6e4] text-[#00a6e4]'
                  : 'border-transparent text-[#646482] hover:text-[#1a1a37]'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              Nueva Sede
            </button>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="text-[11px] font-semibold text-slate-400 hover:text-[#1a1a37] inline-flex items-center gap-1 mb-2 cursor-pointer"
            title="Restaurar las sedes iniciales"
          >
            <RotateCcw className="w-3 h-3" />
            Restablecer Iniciales
          </button>
        </div>

        {/* Feedback Alert */}
        {feedbackMsg && (
          <div
            className={`mx-6 mt-4 p-3 rounded-xl text-xs font-medium flex items-center justify-between ${
              feedbackMsg.isError
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}
          >
            <span>{feedbackMsg.text}</span>
            <button
              type="button"
              onClick={() => setFeedbackMsg(null)}
              className="text-xs opacity-60 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        )}

        {/* Tab 1: Sedes List */}
        {activeTab === 'lista' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2 bg-white">
            {sedes.map((sede) => {
              const isEditing = editingSedeId === sede.id;

              return (
                <div
                  key={sede.id}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                    isEditing
                      ? 'bg-[#00a6e4]/5 border-[#00a6e4]'
                      : sede.activa
                      ? 'bg-white border-slate-200'
                      : 'bg-slate-50 border-slate-200 opacity-60'
                  }`}
                >
                  {isEditing ? (
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={editNombre}
                        onChange={(e) => setEditNombre(e.target.value)}
                        placeholder="Nombre de sede"
                        className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 bg-white text-[#1a1a37]"
                      />
                      <input
                        type="text"
                        value={editGrupo}
                        onChange={(e) => setEditGrupo(e.target.value)}
                        placeholder="Grupo (ej: IPS, SF, CEDI)"
                        className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 bg-white text-[#1a1a37]"
                      />
                    </div>
                  ) : (
                    <div>
                      <h4 className="text-sm font-bold text-[#1a1a37] flex items-center gap-2">
                        {sede.nombre}
                        {!sede.activa && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-200 text-slate-600">
                            Archivada
                          </span>
                        )}
                      </h4>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#00a6e4]">
                        Grupo: {sede.grupo}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 shrink-0">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(sede.id)}
                          disabled={isSubmitting}
                          className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer"
                          title="Guardar cambios"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingSedeId(null)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Cancelar"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleStartEdit(sede)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-[#00a6e4] hover:bg-[#00a6e4]/10 transition-colors cursor-pointer"
                          title="Renombrar o cambiar grupo"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onToggleArchiveSede(sede.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                          title={sede.activa ? 'Archivar sede' : 'Reactivar sede'}
                        >
                          <Archive className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`¿Eliminar definitivamente la sede "${sede.nombre}"?`)) {
                              onDeletePermanentSede(sede.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Eliminar permanentemente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 2: Create Sede Form */}
        {activeTab === 'crear' && (
          <form onSubmit={handleCreateSubmit} className="p-4 sm:p-6 space-y-4 flex-1 overflow-y-auto bg-white">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#1a1a37] block mb-1">
                Nombre de la Nueva Sede
              </label>
              <input
                type="text"
                placeholder="Ej: SF LAURELES, IPS MEDELLIN, etc."
                value={newNombre}
                onChange={(e) => setNewNombre(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white text-[#1a1a37] focus:outline-hidden focus:ring-2 focus:ring-[#00a6e4] uppercase"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#1a1a37] block mb-1">
                Grupo Operativo
              </label>
              <select
                value={newGrupo}
                onChange={(e) => setNewGrupo(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white text-[#1a1a37] focus:outline-hidden focus:ring-2 focus:ring-[#00a6e4] mb-2"
              >
                <option value="">-- Seleccionar grupo existente --</option>
                {existingGroups.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
                <option value="__OTRO__">+ Crear nuevo grupo personalizado...</option>
              </select>

              {newGrupo === '__OTRO__' && (
                <input
                  type="text"
                  placeholder="Nombre del nuevo grupo"
                  value={customGrupo}
                  onChange={(e) => setCustomGrupo(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white text-[#1a1a37] focus:outline-hidden focus:ring-2 focus:ring-[#00a6e4] uppercase"
                />
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('lista')}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Volver a la lista
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-[#00a6e4] hover:bg-[#008ec5] text-white shadow-md cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                {isSubmitting ? 'Guardando...' : 'Crear Sede'}
              </button>
            </div>
          </form>
        )}

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
