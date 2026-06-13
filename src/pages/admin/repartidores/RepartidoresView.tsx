import React, { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import apiClient from '@/utils/apiClient';
import { Repartidor, RepartidorFormData, TipoRepartidor, useRepartidoresStore } from '@/zustand/repartidores';

// ─── Types ───────────────────────────────────────────────────────────────────

interface DespachoStat {
  preparando: number;
  enCamino: number;
  entregado: number;
  total: number;
}

type FiltroTipo = 'TODOS' | 'PLANILLA' | 'EVENTUAL';
type FiltroEstado = 'TODOS' | 'ACTIVOS' | 'INACTIVOS';

// ─── Constants ────────────────────────────────────────────────────────────────

const EMPTY_FORM: RepartidorFormData = { nombre: '', celular: '', tipo: 'EVENTUAL', activo: true };

const INPUT_CLASS =
  'w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-blue-400';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(nombre: string) {
  const parts = nombre.trim().split(' ').filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
}

// ─── RepartidorCard ───────────────────────────────────────────────────────────

interface CardProps {
  repartidor: Repartidor;
  stats?: DespachoStat;
  statsLoading: boolean;
  onEdit: (r: Repartidor) => void;
  onDelete: (r: Repartidor) => void;
  onToggleActive: (r: Repartidor) => void;
  onViewDespachos: (r: Repartidor) => void;
}

function RepartidorCard({ repartidor, stats, statsLoading, onEdit, onDelete, onToggleActive, onViewDespachos }: CardProps) {
  const initials = getInitials(repartidor.nombre);
  const isPlanilla = repartidor.tipo === 'PLANILLA';
  const tasaEntrega = stats && stats.total > 0 ? Math.round((stats.entregado / stats.total) * 100) : 0;
  const celular = repartidor.celular?.replace(/\D/g, '') ?? '';

  return (
    <div
      className={`relative flex flex-col rounded-2xl border bg-white shadow-sm transition-all hover:shadow-md dark:bg-[#111827] overflow-hidden ${
        repartidor.activo ? 'border-gray-100 dark:border-slate-800' : 'border-dashed border-gray-200 dark:border-slate-700 opacity-60'
      }`}
    >
      {/* Tipo stripe */}
      <div className={`h-1 w-full shrink-0 ${isPlanilla ? 'bg-gradient-to-r from-blue-500 to-indigo-600' : 'bg-gradient-to-r from-amber-400 to-orange-500'}`} />

      <div className="flex-1 p-4 space-y-3">
        {/* Avatar + Name + Badges */}
        <div className="flex items-start gap-3">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-base font-black text-white shadow-sm ${
              isPlanilla ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-amber-400 to-orange-500'
            }`}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-gray-900 dark:text-white truncate leading-snug">{repartidor.nombre}</p>
            {repartidor.sede?.nombre && (
              <div className="flex items-center gap-1 mt-0.5">
                <Icon icon="solar:map-point-bold-duotone" className="text-gray-400 shrink-0" width={11} />
                <p className="text-xs text-gray-400 truncate">{repartidor.sede.nombre}</p>
              </div>
            )}
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <span
                className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black ${
                  isPlanilla
                    ? 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800/40'
                    : 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800/40'
                }`}
              >
                {repartidor.tipo}
              </span>
              <button
                type="button"
                onClick={() => onToggleActive(repartidor)}
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-black transition hover:opacity-75 ${
                  repartidor.activo
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800/40'
                    : 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                }`}
              >
                <span className={`inline-block h-1.5 w-1.5 rounded-full ${repartidor.activo ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                {repartidor.activo ? 'Activo' : 'Inactivo'}
              </button>
            </div>
          </div>
        </div>

        {/* Celular row */}
        <div className="flex items-center justify-between rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/40 px-3 py-2">
          <div className="flex items-center gap-2">
            <Icon icon="solar:phone-bold-duotone" className="text-gray-400 shrink-0" width={14} />
            <span className="text-sm text-gray-700 dark:text-gray-200 font-medium tabular-nums">
              {repartidor.celular || '—'}
            </span>
          </div>
          {celular ? (
            <a
              href={`https://wa.me/51${celular}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-7 items-center gap-1 rounded-lg bg-emerald-500 px-2.5 text-white hover:bg-emerald-600 transition-colors text-[11px] font-bold shrink-0"
              title="Contactar por WhatsApp"
            >
              <Icon icon="mdi:whatsapp" width={13} />
              WhatsApp
            </a>
          ) : (
            <span className="text-[10px] text-gray-400 dark:text-slate-500">Sin contacto</span>
          )}
        </div>

        {/* Despachos hoy */}
        <div className="rounded-xl border border-gray-100 bg-gray-50 dark:border-slate-800 dark:bg-slate-900/50 p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-slate-500 flex items-center gap-1">
              <Icon icon="solar:calendar-bold-duotone" width={12} />
              Despachos hoy
            </p>
            {stats && stats.total > 0 && (
              <span className="text-[10px] font-bold text-gray-500 dark:text-slate-400">
                {stats.total} en total
              </span>
            )}
          </div>

          {statsLoading ? (
            <div className="flex items-center gap-2 text-gray-400 py-1">
              <Icon icon="mdi:loading" className="animate-spin shrink-0" width={13} />
              <span className="text-xs">Cargando...</span>
            </div>
          ) : stats && stats.total > 0 ? (
            <>
              <div className="grid grid-cols-3 gap-1.5 mb-2.5">
                <div className="flex flex-col items-center rounded-lg bg-amber-50 dark:bg-amber-900/20 px-1.5 py-1.5">
                  <span className="text-lg font-black text-amber-700 dark:text-amber-400 leading-none">{stats.preparando}</span>
                  <span className="text-[9px] text-amber-600 dark:text-amber-500 mt-0.5 font-semibold">Prep.</span>
                </div>
                <div className="flex flex-col items-center rounded-lg bg-blue-50 dark:bg-blue-900/20 px-1.5 py-1.5">
                  <span className="text-lg font-black text-blue-700 dark:text-blue-400 leading-none">{stats.enCamino}</span>
                  <span className="text-[9px] text-blue-600 dark:text-blue-500 mt-0.5 font-semibold">Tráns.</span>
                </div>
                <div className="flex flex-col items-center rounded-lg bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-1.5">
                  <span className="text-lg font-black text-emerald-700 dark:text-emerald-400 leading-none">{stats.entregado}</span>
                  <span className="text-[9px] text-emerald-600 dark:text-emerald-500 mt-0.5 font-semibold">Entr.</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-gray-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-500"
                    style={{ width: `${tasaEntrega}%` }}
                  />
                </div>
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 shrink-0 tabular-nums">
                  {tasaEntrega}%
                </span>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-1.5 text-gray-400 dark:text-slate-500 py-0.5">
              <Icon icon="solar:sleep-bold-duotone" width={14} />
              <span className="text-xs">Sin despachos asignados hoy</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex items-center gap-1.5 border-t border-gray-100 dark:border-slate-800 px-4 py-3 shrink-0">
        <button
          type="button"
          onClick={() => onViewDespachos(repartidor)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 h-8 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-300 dark:hover:bg-indigo-900/40 text-xs font-bold transition-colors"
        >
          <Icon icon="solar:route-bold-duotone" width={14} />
          Ver despachos
        </button>
        <button
          type="button"
          onClick={() => onEdit(repartidor)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
          title="Editar"
        >
          <Icon icon="solar:pen-bold" width={14} />
        </button>
        <button
          type="button"
          onClick={() => onDelete(repartidor)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 transition-colors"
          title="Eliminar"
        >
          <Icon icon="solar:trash-bin-trash-bold" width={14} />
        </button>
      </div>
    </div>
  );
}

// ─── Main View ────────────────────────────────────────────────────────────────

export default function RepartidoresView() {
  const navigate = useNavigate();
  const { repartidores, loading, fetchRepartidores, createRepartidor, updateRepartidor, toggleActivo, deleteRepartidor } =
    useRepartidoresStore();

  const [search, setSearch] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>('TODOS');
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('TODOS');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Repartidor | null>(null);
  const [form, setForm] = useState<RepartidorFormData>(EMPTY_FORM);
  const [confirmDelete, setConfirmDelete] = useState<Repartidor | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [despachoMap, setDespachoMap] = useState<Map<number, DespachoStat>>(new Map());
  const [despachoLoading, setDespachoLoading] = useState(false);
  const [globalDespacho, setGlobalDespacho] = useState({ total: 0, preparando: 0, enCamino: 0, entregado: 0 });

  const fetchDespachoStats = useCallback(async () => {
    setDespachoLoading(true);
    try {
      const fecha = moment().format('YYYY-MM-DD');
      const { data } = await apiClient.get<any>(`/envio-despacho/panel?fecha=${fecha}`);
      const raw: any[] = data?.data?.data ?? data?.data ?? [];
      if (!Array.isArray(raw)) return;

      const map = new Map<number, DespachoStat>();
      let gTotal = 0, gPreparando = 0, gEnCamino = 0, gEntregado = 0;

      raw.forEach((item) => {
        if (item.repartidorId == null) return;
        const id = Number(item.repartidorId);
        if (!map.has(id)) map.set(id, { preparando: 0, enCamino: 0, entregado: 0, total: 0 });
        const s = map.get(id)!;
        s.total++;
        gTotal++;
        if (['PREPARANDO', 'POR_COORDINAR'].includes(item.estado)) { s.preparando++; gPreparando++; }
        else if (['EN_CAMINO', 'EN_REPARTO', 'ENVIADO'].includes(item.estado)) { s.enCamino++; gEnCamino++; }
        else if (['ENTREGADO', 'ENTREGADO_COMPLETADO'].includes(item.estado)) { s.entregado++; gEntregado++; }
      });

      setDespachoMap(map);
      setGlobalDespacho({ total: gTotal, preparando: gPreparando, enCamino: gEnCamino, entregado: gEntregado });
    } catch {
      // despacho stats are optional — fail silently
    } finally {
      setDespachoLoading(false);
    }
  }, []);

  useEffect(() => { void fetchRepartidores(); }, [fetchRepartidores]);
  useEffect(() => { void fetchDespachoStats(); }, [fetchDespachoStats]);

  const handleRefresh = () => {
    void fetchRepartidores();
    void fetchDespachoStats();
  };

  const stats = useMemo(() => ({
    total: repartidores.length,
    activos: repartidores.filter((r) => r.activo).length,
    planilla: repartidores.filter((r) => r.tipo === 'PLANILLA').length,
    eventual: repartidores.filter((r) => r.tipo === 'EVENTUAL').length,
  }), [repartidores]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return repartidores.filter((r) => {
      if (filtroTipo !== 'TODOS' && r.tipo !== filtroTipo) return false;
      if (filtroEstado === 'ACTIVOS' && !r.activo) return false;
      if (filtroEstado === 'INACTIVOS' && r.activo) return false;
      if (query) {
        return (
          r.nombre.toLowerCase().includes(query) ||
          String(r.celular ?? '').includes(query) ||
          (r.sede?.nombre ?? '').toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [repartidores, search, filtroTipo, filtroEstado]);

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setModalOpen(true); };

  const openEdit = (item: Repartidor) => {
    setEditing(item);
    setForm({ nombre: item.nombre, celular: item.celular ?? '', tipo: item.tipo, activo: item.activo });
    setModalOpen(true);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.nombre.trim()) return;
    setSubmitting(true);
    try {
      const payload: RepartidorFormData = {
        nombre: form.nombre.trim(),
        celular: form.celular?.trim() || null,
        tipo: form.tipo,
        activo: form.activo,
      };
      if (editing) await updateRepartidor(editing.id, payload);
      else await createRepartidor(payload);
      setModalOpen(false);
      setEditing(null);
      setForm(EMPTY_FORM);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    await deleteRepartidor(confirmDelete.id);
    setConfirmDelete(null);
  };

  const handleToggleActive = (item: Repartidor) => {
    void toggleActivo(item.id, !item.activo);
  };

  const handleViewDespachos = (item: Repartidor) => {
    navigate(`/administrador/ventas?fecha=${moment().format('YYYY-MM-DD')}&repartidorId=${item.id}`);
  };

  const globalTasa = globalDespacho.total > 0 ? Math.round((globalDespacho.entregado / globalDespacho.total) * 100) : 0;
  const hasFilters = search || filtroTipo !== 'TODOS' || filtroEstado !== 'TODOS';
  const isBusy = loading || despachoLoading;

  return (
    <div className="p-4 md:p-6 space-y-5">

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <Icon icon="solar:delivery-bold-duotone" className="text-indigo-500" width={24} />
            Repartidores
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Equipo de reparto propio · rendimiento del día
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isBusy}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 transition disabled:opacity-50"
            title="Actualizar"
          >
            <Icon icon="solar:refresh-bold" width={17} className={isBusy ? 'animate-spin' : ''} />
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-blue-500/20 transition hover:opacity-90"
          >
            <Icon icon="solar:add-circle-bold" width={18} />
            Agregar Repartidor
          </button>
        </div>
      </div>

      {/* ── KPIs — Repartidores ─────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, icon: 'solar:users-group-rounded-bold-duotone', colorClass: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' },
          { label: 'Activos', value: stats.activos, icon: 'solar:check-circle-bold-duotone', colorClass: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' },
          { label: 'Planilla', value: stats.planilla, icon: 'solar:user-id-bold-duotone', colorClass: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400' },
          { label: 'Eventuales', value: stats.eventual, icon: 'solar:user-hand-up-bold-duotone', colorClass: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400' },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#111827]">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${k.colorClass}`}>
                <Icon icon={k.icon} width={22} />
              </div>
              <div>
                <p className="text-2xl font-black text-gray-900 dark:text-white leading-none">{k.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{k.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── KPIs — Despacho hoy ──────────────────────────────────── */}
      {(globalDespacho.total > 0 || despachoLoading) && (
        <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-blue-50 dark:border-indigo-900/30 dark:from-[#1a1f35] dark:to-[#111827] p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-black uppercase tracking-wider text-indigo-500 dark:text-indigo-400 flex items-center gap-1.5">
              <Icon icon="solar:calendar-bold-duotone" width={14} />
              Despachos hoy · {moment().format('DD/MM/YYYY')}
            </p>
            {globalDespacho.total > 0 && (
              <span className="text-xs font-black text-indigo-600 dark:text-indigo-300">
                {globalTasa}% entregado
              </span>
            )}
          </div>

          <div className="grid grid-cols-4 gap-3 mb-3">
            {[
              { label: 'Total', value: globalDespacho.total, textColor: 'text-indigo-700 dark:text-indigo-300', bg: 'bg-indigo-100/70 dark:bg-indigo-900/30' },
              { label: 'Por preparar', value: globalDespacho.preparando, textColor: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-100/70 dark:bg-amber-900/30' },
              { label: 'En tránsito', value: globalDespacho.enCamino, textColor: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-100/70 dark:bg-blue-900/30' },
              { label: 'Entregados', value: globalDespacho.entregado, textColor: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-100/70 dark:bg-emerald-900/30' },
            ].map((k) => (
              <div key={k.label} className={`rounded-xl ${k.bg} px-3 py-2.5`}>
                <p className={`text-2xl font-black leading-none ${k.textColor}`}>
                  {despachoLoading ? '…' : k.value}
                </p>
                <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-1 leading-tight">{k.label}</p>
              </div>
            ))}
          </div>

          {globalDespacho.total > 0 && (
            <div className="h-2 rounded-full bg-indigo-100 dark:bg-indigo-900/40 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-700"
                style={{ width: `${globalTasa}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* ── Filters ──────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2.5 md:flex-row md:items-center">
        <div className="relative flex-1 max-w-sm">
          <Icon icon="solar:magnifer-linear" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width={15} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nombre, celular o sede..."
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {(['TODOS', 'PLANILLA', 'EVENTUAL'] as FiltroTipo[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFiltroTipo(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
                filtroTipo === t
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:border-gray-300 dark:hover:border-slate-600'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          {[
            { value: 'TODOS' as FiltroEstado, label: 'Todos' },
            { value: 'ACTIVOS' as FiltroEstado, label: '● Activos' },
            { value: 'INACTIVOS' as FiltroEstado, label: '○ Inactivos' },
          ].map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFiltroEstado(f.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
                filtroEstado === f.value
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:border-gray-300 dark:hover:border-slate-600'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Cards Grid ───────────────────────────────────────────── */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Icon icon="mdi:loading" className="animate-spin text-4xl text-indigo-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700 text-gray-400 dark:text-slate-500">
          <Icon icon="solar:delivery-bold-duotone" width={48} />
          <p className="text-sm font-medium">
            {repartidores.length === 0 ? 'Aún no hay repartidores registrados' : 'Sin resultados para los filtros actuales'}
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={() => { setSearch(''); setFiltroTipo('TODOS'); setFiltroEstado('TODOS'); }}
              className="text-xs text-blue-500 hover:underline"
            >
              Limpiar filtros
            </button>
          )}
          {repartidores.length === 0 && (
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700 transition-colors"
            >
              <Icon icon="solar:add-circle-bold" width={16} />
              Agregar el primero
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((r) => (
            <RepartidorCard
              key={r.id}
              repartidor={r}
              stats={despachoMap.get(r.id)}
              statsLoading={despachoLoading}
              onEdit={openEdit}
              onDelete={setConfirmDelete}
              onToggleActive={handleToggleActive}
              onViewDespachos={handleViewDespachos}
            />
          ))}
        </div>
      )}

      {/* ── Create / Edit Modal ──────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <button className="absolute inset-0 bg-black/50  " onClick={() => setModalOpen(false)} aria-label="Cerrar" />
          <form onSubmit={handleSubmit} className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-[#111827]">
            <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 text-white">
                  <Icon icon="solar:delivery-bold-duotone" width={22} />
                </div>
                <div>
                  <h2 className="text-lg font-black leading-none text-white">
                    {editing ? 'Editar Repartidor' : 'Nuevo Repartidor'}
                  </h2>
                  <p className="mt-1 text-xs text-blue-100">Personal disponible para reparto propio</p>
                </div>
              </div>
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-xl bg-white/15 p-2 text-white hover:bg-white/25 transition">
                <Icon icon="solar:close-circle-bold" width={18} />
              </button>
            </div>

            <div className="space-y-4 p-6">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">Nombre *</label>
                <input
                  required
                  value={form.nombre}
                  onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                  className={INPUT_CLASS}
                  placeholder="Nombre completo del repartidor"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">Celular</label>
                <input
                  value={form.celular ?? ''}
                  onChange={(e) => setForm((p) => ({ ...p, celular: e.target.value.replace(/\D/g, '').slice(0, 9) }))}
                  className={INPUT_CLASS}
                  placeholder="9XXXXXXXX"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">Tipo</label>
                  <select
                    value={form.tipo}
                    onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value as TipoRepartidor }))}
                    className={INPUT_CLASS}
                  >
                    <option value="PLANILLA">PLANILLA</option>
                    <option value="EVENTUAL">EVENTUAL</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">Estado</label>
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, activo: !p.activo }))}
                    className={`flex h-10 w-full items-center justify-between rounded-xl border px-3 text-sm font-bold transition ${
                      form.activo
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-900/20 dark:text-emerald-300'
                        : 'border-gray-200 bg-gray-50 text-gray-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400'
                    }`}
                  >
                    <span>{form.activo ? 'Activo' : 'Inactivo'}</span>
                    <Icon icon={form.activo ? 'solar:toggle-on-bold' : 'solar:toggle-off-bold'} width={24} />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 border-t border-gray-100 px-6 py-4 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="h-11 flex-1 rounded-2xl border border-gray-200 text-sm font-bold text-gray-600 transition hover:bg-gray-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting || !form.nombre.trim()}
                className="h-11 flex-[2] rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-sm font-black text-white shadow-lg shadow-blue-500/20 transition hover:opacity-90 disabled:opacity-60"
              >
                {submitting ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Delete Confirm ───────────────────────────────────────── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <button className="absolute inset-0 bg-black/50  " onClick={() => setConfirmDelete(null)} aria-label="Cerrar" />
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl dark:bg-[#111827]">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-900/20">
              <Icon icon="solar:trash-bin-trash-bold-duotone" width={24} />
            </div>
            <h3 className="text-lg font-black text-gray-900 dark:text-white">Eliminar repartidor</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Se desactivará a <strong>{confirmDelete.nombre}</strong>. Podrás reactivarlo editándolo cuando lo necesites.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="h-10 flex-1 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="h-10 flex-1 rounded-xl bg-red-600 text-sm font-bold text-white hover:bg-red-700 transition"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
