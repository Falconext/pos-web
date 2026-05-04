import { useEffect, useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import apiClient from '@/utils/apiClient';
import useAlertStore from '@/zustand/alert';

interface SistemaUser {
  id: number;
  nombre: string;
  email: string;
  dni: string;
  celular: string;
  rol: string;
  estado: string;
}

interface FormData {
  nombre: string;
  email: string;
  dni: string;
  celular: string;
  password: string;
}

const EMPTY_FORM: FormData = { nombre: '', email: '', dni: '', celular: '', password: '' };

export default function SistemaUsuarios() {
  const [users, setUsers] = useState<SistemaUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SistemaUser | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<SistemaUser | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  const load = async (q = search) => {
    try {
      setLoading(true);
      const res = await apiClient.get('/usuario/sistema', { params: { search: q || undefined, limit: 50 } });
      const data = res.data?.data ?? res.data;
      setUsers(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch {
      useAlertStore.getState().alert('Error al cargar administradores', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { if (modalOpen) setTimeout(() => firstInputRef.current?.focus(), 100); }, [modalOpen]);

  const handleSearch = (val: string) => {
    setSearch(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => load(val), 500);
  };

  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setShowPassword(false);
    setModalOpen(true);
  };

  const openEdit = (u: SistemaUser) => {
    setEditTarget(u);
    setForm({ nombre: u.nombre, email: u.email, dni: u.dni, celular: u.celular, password: '' });
    setErrors({});
    setShowPassword(false);
    setModalOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.nombre.trim()) errs.nombre = 'El nombre es obligatorio';
    if (!form.email.trim()) errs.email = 'El email es obligatorio';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Email inválido';
    if (!form.dni.trim()) errs.dni = 'El DNI es obligatorio';
    else if (!/^\d{8}$/.test(form.dni)) errs.dni = 'DNI debe tener 8 dígitos';
    if (!form.celular.trim()) errs.celular = 'El celular es obligatorio';
    else if (!/^\d{9}$/.test(form.celular)) errs.celular = 'Celular debe tener 9 dígitos';
    if (!editTarget && !form.password) errs.password = 'La contraseña es obligatoria';
    else if (form.password && form.password.length < 6) errs.password = 'Mínimo 6 caracteres';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload: any = { nombre: form.nombre, email: form.email, dni: form.dni, celular: form.celular };
      if (!editTarget) payload.password = form.password;
      if (editTarget) {
        await apiClient.put(`/usuario/sistema/${editTarget.id}`, payload);
        useAlertStore.getState().alert('Administrador actualizado correctamente', 'success');
      } else {
        await apiClient.post('/usuario/sistema', payload);
        useAlertStore.getState().alert('Administrador creado exitosamente', 'success');
      }
      setModalOpen(false);
      load();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Error al guardar';
      useAlertStore.getState().alert(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleState = async (u: SistemaUser) => {
    const nuevoEstado = u.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    try {
      await apiClient.patch(`/usuario/sistema/${u.id}/estado`, { estado: nuevoEstado });
      useAlertStore.getState().alert(`Administrador ${nuevoEstado === 'ACTIVO' ? 'activado' : 'desactivado'}`, 'success');
      load();
    } catch {
      useAlertStore.getState().alert('Error al cambiar estado', 'error');
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await apiClient.delete(`/usuario/sistema/${confirmDelete.id}`);
      useAlertStore.getState().alert('Administrador eliminado', 'success');
      setConfirmDelete(null);
      load();
    } catch {
      useAlertStore.getState().alert('Error al eliminar', 'error');
    }
  };

  const activeCount = users.filter(u => u.estado === 'ACTIVO').length;
  const inactiveCount = users.filter(u => u.estado === 'INACTIVO').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2.5">
            <span className="w-9 h-9 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Icon icon="solar:shield-user-bold" className="text-white" width={18} />
            </span>
            Usuarios del Sistema
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">
            Gestiona los administradores con acceso al panel de control de Falconext
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-violet-500/30 hover:bg-violet-700 transition-all active:scale-95"
        >
          <Icon icon="solar:user-plus-bold" width={18} />
          Nuevo Administrador
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Admins', value: total, icon: 'solar:users-group-two-rounded-bold-duotone', color: 'from-violet-500 to-indigo-600', shadow: 'shadow-violet-500/20' },
          { label: 'Activos', value: activeCount, icon: 'solar:check-circle-bold-duotone', color: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-500/20' },
          { label: 'Inactivos', value: inactiveCount, icon: 'solar:close-circle-bold-duotone', color: 'from-orange-500 to-red-500', shadow: 'shadow-red-500/20' },
        ].map(card => (
          <div key={card.label} className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-slate-800 p-5 flex items-center gap-4 shadow-sm">
            <div className={`w-12 h-12 bg-gradient-to-br ${card.color} rounded-xl flex items-center justify-center shadow-lg ${card.shadow} flex-shrink-0`}>
              <Icon icon={card.icon} width={24} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{card.label}</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-0.5">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table Card */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Search Bar */}
        <div className="p-5 border-b border-gray-100 dark:border-slate-800 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Icon icon="solar:magnifer-linear" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width={17} />
            <input
              type="text"
              value={search}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Buscar por nombre, email o DNI..."
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 dark:text-white placeholder:text-gray-400 transition-all"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/70 dark:bg-slate-800/50 text-gray-500 dark:text-gray-400 text-xs uppercase font-semibold tracking-wider">
              <tr>
                <th className="px-6 py-4">Nombre</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">DNI</th>
                <th className="px-6 py-4">Celular</th>
                <th className="px-6 py-4">Rol</th>
                <th className="px-6 py-4 text-center">Estado</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-sm">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-gray-100 dark:bg-slate-800 rounded-lg animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-3">
                      <Icon icon="solar:shield-user-linear" width={52} className="opacity-20" />
                      <p className="text-sm">{search ? 'No se encontraron administradores con ese criterio.' : 'No hay administradores creados aún.'}</p>
                      {!search && (
                        <button onClick={openCreate} className="mt-1 px-4 py-2 bg-violet-600 text-white text-xs font-bold rounded-xl hover:bg-violet-700 transition-all">
                          Crear primer administrador
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                          <span className="text-white font-bold text-sm">{u.nombre.charAt(0).toUpperCase()}</span>
                        </div>
                        <span className="font-semibold text-gray-800 dark:text-white">{u.nombre}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{u.email}</td>
                    <td className="px-6 py-4 font-mono text-gray-500 dark:text-gray-400">{u.dni}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{u.celular}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-100 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800/50">
                        <Icon icon="solar:shield-bold" width={11} />
                        Admin Sistema
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleToggleState(u)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                          u.estado === 'ACTIVO'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50'
                            : 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50'
                        }`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${u.estado === 'ACTIVO' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        {u.estado === 'ACTIVO' ? 'Activo' : 'Inactivo'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEdit(u)}
                          className="p-2 text-gray-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Icon icon="solar:pen-bold" width={16} />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(u)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Deshabilitar"
                        >
                          <Icon icon="solar:trash-bin-trash-bold" width={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear/Editar */}
      {modalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white dark:bg-[#111827] rounded-3xl p-8 w-full max-w-md shadow-2xl z-10 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-7">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30">
                  <Icon icon={editTarget ? 'solar:pen-bold' : 'solar:user-plus-bold'} className="text-white" width={18} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                    {editTarget ? 'Editar Administrador' : 'Nuevo Administrador'}
                  </h2>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Acceso completo al panel de control</p>
                </div>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                <Icon icon="solar:close-circle-bold" width={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nombre */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nombre completo *</label>
                <input
                  ref={firstInputRef}
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  placeholder="Ej. Carlos Mendoza"
                  className={`w-full px-4 py-3 text-sm bg-gray-50 dark:bg-slate-800 border rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 dark:text-white placeholder:text-gray-400 transition-all font-medium ${errors.nombre ? 'border-red-400' : 'border-gray-100 dark:border-slate-700'}`}
                />
                {errors.nombre && <p className="text-xs text-red-500 flex items-center gap-1"><Icon icon="solar:danger-bold" width={12} />{errors.nombre}</p>}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email *</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="admin@falconext.pe"
                  className={`w-full px-4 py-3 text-sm bg-gray-50 dark:bg-slate-800 border rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 dark:text-white placeholder:text-gray-400 transition-all ${errors.email ? 'border-red-400' : 'border-gray-100 dark:border-slate-700'}`}
                />
                {errors.email && <p className="text-xs text-red-500 flex items-center gap-1"><Icon icon="solar:danger-bold" width={12} />{errors.email}</p>}
              </div>

              {/* DNI + Celular */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">DNI *</label>
                  <input
                    name="dni"
                    value={form.dni}
                    onChange={handleChange}
                    placeholder="12345678"
                    maxLength={8}
                    className={`w-full px-4 py-3 text-sm bg-gray-50 dark:bg-slate-800 border rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 dark:text-white placeholder:text-gray-400 transition-all font-mono ${errors.dni ? 'border-red-400' : 'border-gray-100 dark:border-slate-700'}`}
                  />
                  {errors.dni && <p className="text-xs text-red-500">{errors.dni}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Celular *</label>
                  <input
                    name="celular"
                    value={form.celular}
                    onChange={handleChange}
                    placeholder="987654321"
                    maxLength={9}
                    className={`w-full px-4 py-3 text-sm bg-gray-50 dark:bg-slate-800 border rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 dark:text-white placeholder:text-gray-400 transition-all font-mono ${errors.celular ? 'border-red-400' : 'border-gray-100 dark:border-slate-700'}`}
                  />
                  {errors.celular && <p className="text-xs text-red-500">{errors.celular}</p>}
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {editTarget ? 'Nueva Contraseña (dejar vacío para no cambiar)' : 'Contraseña *'}
                </label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={handleChange}
                    placeholder={editTarget ? '••••••••' : 'Mínimo 6 caracteres'}
                    className={`w-full px-4 py-3 pr-11 text-sm bg-gray-50 dark:bg-slate-800 border rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 dark:text-white placeholder:text-gray-400 transition-all ${errors.password ? 'border-red-400' : 'border-gray-100 dark:border-slate-700'}`}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <Icon icon={showPassword ? 'solar:eye-closed-bold' : 'solar:eye-bold'} width={18} />
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500 flex items-center gap-1"><Icon icon="solar:danger-bold" width={12} />{errors.password}</p>}
              </div>

              {/* Rol badge info */}
              <div className="flex items-center gap-2.5 px-4 py-3 bg-violet-50 dark:bg-violet-900/20 rounded-xl border border-violet-100 dark:border-violet-800/30">
                <Icon icon="solar:shield-bold-duotone" className="text-violet-600 dark:text-violet-400 flex-shrink-0" width={18} />
                <p className="text-xs text-violet-700 dark:text-violet-300">
                  <span className="font-bold">Rol asignado: ADMIN_SISTEMA</span> — Tendrá acceso completo a todos los módulos del panel de control.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-3 text-gray-600 dark:text-gray-300 font-bold bg-gray-100 dark:bg-slate-800 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 text-white font-bold bg-violet-600 rounded-xl hover:bg-violet-700 transition-colors text-sm shadow-lg shadow-violet-500/30 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {saving && <Icon icon="svg-spinners:ring-resize" width={16} />}
                  {editTarget ? 'Guardar Cambios' : 'Crear Administrador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminar */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
          <div className="relative bg-white dark:bg-[#111827] rounded-3xl p-8 w-full max-w-sm shadow-2xl z-10 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Icon icon="solar:shield-user-bold-duotone" width={36} />
            </div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">¿Deshabilitar administrador?</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              <span className="font-semibold text-gray-700 dark:text-gray-200">{confirmDelete.nombre}</span> será marcado como inactivo y no podrá iniciar sesión.
            </p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-3 text-gray-600 font-bold bg-gray-100 dark:bg-slate-800 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors text-sm">
                Cancelar
              </button>
              <button onClick={handleDelete} className="flex-1 py-3 text-white font-bold bg-red-500 rounded-xl hover:bg-red-600 transition-colors text-sm">
                Deshabilitar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
