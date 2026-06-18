import { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import apiClient from '@/utils/apiClient';
import { detectarFuncionesRubro } from '@/utils/rubro-features';
import { useAuthStore } from '@/zustand/auth';
import useAlertStore from '@/zustand/alert';
import DataTable from '@/components/Datatable';
import Pagination from '@/components/Pagination';
import Select from '@/components/Select';
import InputPro from '@/components/InputPro';
import { useDebounce } from '@/hooks/useDebounce';
import ModalConfirm from '@/components/ModalConfirm';

type EstadoSerie = 'TODOS' | 'DISPONIBLE' | 'VENDIDO' | 'RESERVADO' | 'BAJA';
type EstadoGarantia = 'TODOS' | 'VIGENTE' | 'VENCIDA' | 'SIN_GARANTIA';
type EstadoReclamo = 'ABIERTO' | 'EN_PROCESO' | 'RESUELTO' | 'CERRADO';

interface SerieGarantia {
  id: number;
  numeroSerie: string;
  estado: Exclude<EstadoSerie, 'TODOS'>;
  garantiaMeses?: number | null;
  garantiaHasta?: string | null;
  estadoGarantia: Exclude<EstadoGarantia, 'TODOS'>;
  observacion?: string | null;
  compraId?: number | null;
  producto: { id: number; codigo: string; descripcion: string; marca?: { nombre: string } | null };
  sede?: { id: number; nombre: string } | null;
  comprobante?: {
    id: number; tipoDoc: string; numero: string; fechaEmision: string;
    cliente: { id: number; nombre: string; nroDoc: string; telefono?: string | null; email?: string | null };
  } | null;
}

interface Reclamo {
  id: number;
  descripcion: string;
  estadoReclamo: EstadoReclamo;
  tecnico?: string | null;
  resolucion?: string | null;
  fechaReclamo: string;
  fechaResolucion?: string | null;
}

interface SeriesResponse {
  data: SerieGarantia[];
  resumen: { total: number; estados: Record<string, number>; garantias: Record<string, number> };
  paginacion: { page: number; limit: number; total: number; totalPages: number };
}

interface ApiEnvelope<T> { code: number; message: string; data: T }

const fmt = (v?: string | null) =>
  !v ? '—' : new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(v));

const daysUntil = (v?: string | null) =>
  !v ? null : Math.ceil((new Date(v).getTime() - Date.now()) / 86400000);

const serieBadge: Record<string, string> = {
  DISPONIBLE: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  VENDIDO: 'bg-indigo-50 text-indigo-700 ring-indigo-100',
  RESERVADO: 'bg-amber-50 text-amber-700 ring-amber-100',
  BAJA: 'bg-slate-100 text-slate-600 ring-slate-200',
};

const garantiaBadge: Record<string, string> = {
  VIGENTE: 'bg-green-50 text-green-700 ring-green-100',
  VENCIDA: 'bg-rose-50 text-rose-700 ring-rose-100',
  SIN_GARANTIA: 'bg-gray-50 text-gray-600 ring-gray-200',
};

const reclamoBadge: Record<string, string> = {
  ABIERTO: 'bg-rose-50 text-rose-700',
  EN_PROCESO: 'bg-amber-50 text-amber-700',
  RESUELTO: 'bg-emerald-50 text-emerald-700',
  CERRADO: 'bg-slate-100 text-slate-500',
};

const estadoOptions = [
  { id: 'TODOS', value: 'Todos los estados' },
  { id: 'DISPONIBLE', value: 'Disponible' },
  { id: 'VENDIDO', value: 'Vendido' },
  { id: 'RESERVADO', value: 'Reservado' },
  { id: 'BAJA', value: 'Baja' },
];

const garantiaOptions = [
  { id: 'TODOS', value: 'Todas las garantías' },
  { id: 'VIGENTE', value: 'Vigentes' },
  { id: 'VENCIDA', value: 'Vencidas' },
  { id: 'SIN_GARANTIA', value: 'Sin garantía' },
];

const estadoReclamoOptions = [
  { id: 'ABIERTO', value: 'Abierto' },
  { id: 'EN_PROCESO', value: 'En proceso' },
  { id: 'RESUELTO', value: 'Resuelto' },
  { id: 'CERRADO', value: 'Cerrado' },
];

interface ProductoOption { id: number; descripcion: string; codigo: string; }

const EMPTY_FORM = { productoId: '', numeroSerie: '', garantiaMeses: '', observacion: '' };
const EMPTY_RECLAMO = { descripcion: '', tecnico: '', estadoReclamo: 'ABIERTO' as EstadoReclamo };

export default function SeriesGarantias() {
  const { auth } = useAuthStore();
  const { alert } = useAlertStore();
  const [search, setSearch] = useState('');
  const [estado, setEstado] = useState<EstadoSerie>('TODOS');
  const [garantia, setGarantia] = useState<EstadoGarantia>('TODOS');
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [response, setResponse] = useState<SeriesResponse>({
    data: [],
    resumen: { total: 0, estados: { DISPONIBLE: 0, VENDIDO: 0, RESERVADO: 0, BAJA: 0 }, garantias: { VIGENTE: 0, VENCIDA: 0, SIN_GARANTIA: 0 } },
    paginacion: { page: 1, limit: 20, total: 0, totalPages: 1 },
  });

  // Modal nueva/editar serie
  const [showModal, setShowModal] = useState(false);
  const [editSerie, setEditSerie] = useState<SerieGarantia | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Confirm delete modal
  const [serieToDelete, setSerieToDelete] = useState<SerieGarantia | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [reclamoToDelete, setReclamoToDelete] = useState<Reclamo | null>(null);
  const [deletingReclamo, setDeletingReclamo] = useState(false);

  // Panel de detalle / reclamos
  const [selectedSerie, setSelectedSerie] = useState<SerieGarantia | null>(null);
  const [reclamos, setReclamos] = useState<Reclamo[]>([]);
  const [loadingReclamos, setLoadingReclamos] = useState(false);
  const [showReclamoForm, setShowReclamoForm] = useState(false);
  const [reclamoForm, setReclamoForm] = useState(EMPTY_RECLAMO);
  const [editReclamo, setEditReclamo] = useState<Reclamo | null>(null);
  const [savingReclamo, setSavingReclamo] = useState(false);
  const [generatingConstanciaId, setGeneratingConstanciaId] = useState<number | null>(null);

  const canUse = detectarFuncionesRubro(auth?.empresa?.rubro).controlSeriesGarantia;

  // Product search for new-serie modal
  const [productoSearch, setProductoSearch] = useState('');
  const [productoOptions, setProductoOptions] = useState<ProductoOption[]>([]);
  const [productoSelected, setProductoSelected] = useState<ProductoOption | null>(null);
  const [showProductoDropdown, setShowProductoDropdown] = useState(false);
  const [bulkSeries, setBulkSeries] = useState('');
  const productoSearchDebounced = useDebounce(productoSearch, 300);
  const productoDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!productoSearchDebounced.trim() || productoSelected) { setProductoOptions([]); return; }
    apiClient.get('/productos', { params: { search: productoSearchDebounced, limit: 10 } })
      .then((r: any) => {
        const lista = Array.isArray(r.data?.data?.productos) ? r.data.data.productos : [];
        setProductoOptions(lista.map((p: any) => ({ id: p.id, descripcion: p.descripcion, codigo: p.codigo || '' })));
        setShowProductoDropdown(lista.length > 0);
      })
      .catch(() => setProductoOptions([]));
  }, [productoSearchDebounced]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (productoDropdownRef.current && !productoDropdownRef.current.contains(e.target as Node)) {
        setShowProductoDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const cargar = async () => {
    if (!canUse) { setLoading(false); return; }
    setLoading(true); setError('');
    try {
      const { data } = await apiClient.get<ApiEnvelope<SeriesResponse>>('/kardex/series-garantias', {
        params: { search, estado, garantia, page, limit: itemsPerPage },
      });
      setResponse(data.data);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'No se pudo cargar series y garantías');
    } finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, [search, estado, garantia, page, itemsPerPage, canUse]);
  useEffect(() => { setPage(1); }, [search, estado, garantia, itemsPerPage]);

  const abrirNueva = () => {
    setEditSerie(null);
    setForm(EMPTY_FORM);
    setProductoSelected(null);
    setProductoSearch('');
    setBulkSeries('');
    setShowModal(true);
  };
  const abrirEditar = (s: SerieGarantia) => {
    setEditSerie(s);
    setForm({ productoId: String(s.producto.id), numeroSerie: s.numeroSerie, garantiaMeses: String(s.garantiaMeses ?? ''), observacion: s.observacion ?? '' });
    setShowModal(true);
  };

  const guardarSerie = async () => {
    setSaving(true);
    try {
      if (editSerie) {
        await apiClient.patch(`/kardex/series-garantias/${editSerie.id}`, {
          estado: (form as any).estado,
          garantiaMeses: form.garantiaMeses ? Number(form.garantiaMeses) : null,
          observacion: form.observacion,
        });
        alert('Serie actualizada', 'success');
      } else {
        if (!productoSelected) { alert('Selecciona un producto', 'warning'); setSaving(false); return; }
        const seriesList = bulkSeries
          .split(/[\n,]+/)
          .map((s) => s.trim().toUpperCase())
          .filter(Boolean);
        if (seriesList.length === 0) { alert('Ingresa al menos un número de serie', 'warning'); setSaving(false); return; }
        let ok = 0; let fail = 0;
        for (const numeroSerie of seriesList) {
          try {
            await apiClient.post('/kardex/series-garantias', {
              productoId: productoSelected.id,
              numeroSerie,
              garantiaMeses: form.garantiaMeses ? Number(form.garantiaMeses) : null,
              observacion: form.observacion,
            });
            ok++;
          } catch { fail++; }
        }
        alert(
          fail === 0
            ? `${ok} serie${ok > 1 ? 's' : ''} registrada${ok > 1 ? 's' : ''} correctamente`
            : `${ok} registrada${ok > 1 ? 's' : ''}, ${fail} con error (ya existen o datos inválidos)`,
          fail === 0 ? 'success' : 'warning',
        );
      }
      setShowModal(false);
      cargar();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Error al guardar', 'error');
    } finally { setSaving(false); }
  };

  const confirmarEliminar = (s: SerieGarantia) => setSerieToDelete(s);

  const eliminarSerie = async () => {
    if (!serieToDelete) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/kardex/series-garantias/${serieToDelete.id}`);
      alert('Serie eliminada', 'success');
      if (selectedSerie?.id === serieToDelete.id) setSelectedSerie(null);
      setSerieToDelete(null);
      cargar();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Error al eliminar', 'error');
    } finally { setDeleting(false); }
  };

  const abrirDetalle = async (s: SerieGarantia) => {
    setSelectedSerie(s);
    setShowReclamoForm(false);
    setEditReclamo(null);
    setLoadingReclamos(true);
    try {
      const { data } = await apiClient.get<ApiEnvelope<Reclamo[]>>(`/kardex/series-garantias/${s.id}/reclamos`);
      setReclamos(data.data);
    } catch { setReclamos([]); } finally { setLoadingReclamos(false); }
  };

  const guardarReclamo = async () => {
    if (!reclamoForm.descripcion.trim()) { alert('La descripción es requerida', 'warning'); return; }
    if (!selectedSerie) return;
    setSavingReclamo(true);
    try {
      if (editReclamo) {
        await apiClient.patch(`/kardex/reclamos-garantia/${editReclamo.id}`, reclamoForm);
        alert('Reclamo actualizado', 'success');
      } else {
        await apiClient.post(`/kardex/series-garantias/${selectedSerie.id}/reclamos`, reclamoForm);
        alert('Reclamo registrado', 'success');
      }
      setShowReclamoForm(false); setEditReclamo(null); setReclamoForm(EMPTY_RECLAMO);
      const { data } = await apiClient.get<ApiEnvelope<Reclamo[]>>(`/kardex/series-garantias/${selectedSerie.id}/reclamos`);
      setReclamos(data.data);
    } catch (e: any) { alert(e?.response?.data?.message || 'Error', 'error'); }
    finally { setSavingReclamo(false); }
  };

  const eliminarReclamo = async () => {
    if (!reclamoToDelete) return;
    setDeletingReclamo(true);
    try {
      await apiClient.delete(`/kardex/reclamos-garantia/${reclamoToDelete.id}`);
      setReclamos((prev) => prev.filter((x) => x.id !== reclamoToDelete.id));
      alert('Reclamo eliminado', 'success');
      setReclamoToDelete(null);
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Error', 'error');
    } finally { setDeletingReclamo(false); }
  };

  const abrirConstancia = async (serie: SerieGarantia) => {
    try {
      setGeneratingConstanciaId(serie.id);
      const response = await apiClient.get<Blob>(`/kardex/series-garantias/${serie.id}/constancia`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e: any) {
      alert(e?.response?.data?.message || 'No se pudo generar la constancia', 'error');
    } finally {
      setGeneratingConstanciaId(null);
    }
  };

  const cards = useMemo(() => [
    { label: 'Series registradas', value: response.resumen.total, icon: 'solar:hashtag-square-bold-duotone', tone: 'from-violet-500 to-indigo-500' },
    { label: 'Garantías vigentes', value: response.resumen.garantias.VIGENTE ?? 0, icon: 'solar:shield-check-bold-duotone', tone: 'from-emerald-500 to-teal-500' },
    { label: 'Garantías vencidas', value: response.resumen.garantias.VENCIDA ?? 0, icon: 'solar:shield-cross-bold-duotone', tone: 'from-rose-500 to-orange-500' },
    { label: 'Vendidos con serie', value: response.resumen.estados.VENDIDO ?? 0, icon: 'solar:cart-check-bold-duotone', tone: 'from-blue-500 to-cyan-500' },
  ], [response.resumen]);

  const seriesTable = useMemo(() => response.data.map((item) => {
    const dias = daysUntil(item.garantiaHasta);
    const garantiaLabel = item.estadoGarantia === 'SIN_GARANTIA' ? 'Sin garantía'
      : item.estadoGarantia === 'VENCIDA' ? `Venció hace ${Math.abs(dias ?? 0)} d`
      : `${dias ?? 0} días restantes`;

    return {
      serie: (
        <div>
          <div className="font-mono text-xs font-black uppercase tracking-wide text-slate-800">{item.numeroSerie}</div>
          <div className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-black ring-1 ${serieBadge[item.estado]}`}>{item.estado}</div>
          {item.compraId && <div className="mt-0.5 text-[10px] text-slate-400">Ingresado por compra</div>}
        </div>
      ),
      producto: (
        <div>
          <div className="max-w-[260px] truncate text-sm font-bold text-slate-800" title={item.producto.descripcion}>{item.producto.descripcion}</div>
          <div className="mt-0.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">{item.producto.codigo}</div>
        </div>
      ),
      cliente: (
        <div>
          <div className="max-w-[200px] truncate text-sm font-bold text-slate-700">{item.comprobante?.cliente.nombre ?? 'Sin venta'}</div>
          <div className="mt-0.5 text-[11px] text-slate-400">{item.comprobante?.cliente.nroDoc ?? '—'}</div>
        </div>
      ),
      garantiaBadge: (
        <div>
          <div className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-black ring-1 ${garantiaBadge[item.estadoGarantia]}`}>{garantiaLabel}</div>
          <div className="mt-1 text-[11px] text-slate-400">Hasta: {fmt(item.garantiaHasta)}</div>
        </div>
      ),
      acciones: (
        <div className="flex gap-1">
          <button onClick={() => abrirDetalle(item)} title="Ver detalle y reclamos"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-indigo-100 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition">
            <Icon icon="solar:eye-bold" width={15} />
          </button>
          <button onClick={() => abrirEditar(item)} title="Editar"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-600 hover:bg-blue-100 transition">
            <Icon icon="solar:pen-new-square-linear" width={15} />
          </button>
          <button onClick={() => confirmarEliminar(item)} title="Eliminar"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-100 bg-rose-50 text-rose-600 hover:bg-rose-100 transition">
            <Icon icon="solar:trash-bin-trash-broken" width={15} />
          </button>
        </div>
      ),
    };
  }), [response.data]);

  const paginationPages = useMemo(
    () => Array.from({ length: Math.max(response.paginacion.totalPages, 1) }, (_, i) => i + 1),
    [response.paginacion.totalPages],
  );

  if (!canUse) {
    return (
      <div className="min-h-screen bg-[#F7F8FC] px-6 py-10">
        <div className="mx-auto grid max-w-xl place-items-center rounded-[2rem] border border-white bg-white px-8 py-14 text-center shadow-[0_18px_55px_rgba(15,23,42,0.06)]">
          <div className="grid h-20 w-20 place-items-center rounded-[1.7rem] bg-slate-100 text-slate-500">
            <Icon icon="solar:lock-keyhole-bold-duotone" className="text-4xl" />
          </div>
          <h1 className="mt-5 text-2xl font-black text-slate-950">No disponible para este rubro</h1>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
            Series y garantías solo aparece cuando el rubro tiene activa la característica de control por serie.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8FC] px-4 py-6 text-slate-900">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
            <Icon icon="solar:shield-star-bold-duotone" className="text-base" />
            Kardex
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-950">Series y Garantías</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">Trazabilidad completa de productos vendidos por número de serie.</p>
        </div>
        <button onClick={abrirNueva}
          className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition">
          <Icon icon="solar:add-circle-bold" className="text-lg" />
          Nueva serie
        </button>
      </div>

      {/* KPI cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-3xl border border-white bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,0.06)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">{card.label}</span>
              <span className={`grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br ${card.tone} text-white shadow-lg`}>
                <Icon icon={card.icon} className="text-2xl" />
              </span>
            </div>
            <div className="mt-5 text-3xl font-black text-slate-950">{card.value}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        {/* Tabla principal */}
        <div className="min-w-0 flex-1 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between border-b border-gray-100 pb-4">
            <div className="flex items-center gap-2">
              <Icon icon="solar:shield-check-bold-duotone" className="text-xl text-indigo-600" />
              <h3 className="font-semibold text-gray-800">Control de series</h3>
            </div>
            <span className="text-sm font-medium text-gray-500">{response.paginacion.total} registros</span>
          </div>

          <div className="mb-5 grid gap-4 lg:grid-cols-[1fr_200px_200px]">
            <InputPro name="search" label="Buscar" isLabel value={search}
              onChange={(e) => setSearch(e.target.value)} placeholder="Serie, producto, cliente..." />
            <Select name="estado" label="Estado" error="" value={estadoOptions.find((o) => o.id === estado)?.value}
              onChange={(id) => setEstado(String(id) as EstadoSerie)} options={estadoOptions} withLabel />
            <Select name="garantia" label="Garantía" error="" value={garantiaOptions.find((o) => o.id === garantia)?.value}
              onChange={(id) => setGarantia(String(id) as EstadoGarantia)} options={garantiaOptions} withLabel />
          </div>

          {error && <div className="mb-4 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</div>}

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Icon icon="line-md:loading-twotone-loop" className="text-4xl text-indigo-500" />
            </div>
          ) : seriesTable.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <DataTable bodyData={seriesTable} headerColumns={[
                  { label: 'Serie', key: 'serie' },
                  { label: 'Producto', key: 'producto' },
                  { label: 'Cliente', key: 'cliente' },
                  { label: 'Garantía', key: 'garantiaBadge' },
                  { label: 'Acciones', key: 'acciones' },
                ]} />
              </div>
              <div className="mt-4 border-t border-gray-100 pt-4">
                <Pagination data={seriesTable} optionSelect currentPage={page}
                  indexOfFirstItem={response.paginacion.total === 0 ? 0 : (page - 1) * itemsPerPage}
                  indexOfLastItem={Math.min(page * itemsPerPage, response.paginacion.total)}
                  setcurrentPage={setPage} setitemsPerPage={setItemsPerPage}
                  pages={paginationPages} total={response.paginacion.total} />
              </div>
            </>
          ) : (
            <div className="py-16 text-center">
              <Icon icon="solar:shield-minimalistic-bold-duotone" className="mx-auto mb-3 text-5xl text-gray-300" />
              <p className="font-semibold text-gray-500">Sin series registradas</p>
              <p className="mt-1 text-sm text-gray-400">Usa el botón "Nueva serie" para registrar manualmente, o registra desde una compra.</p>
            </div>
          )}
        </div>

        {/* Panel lateral — detalle + reclamos */}
        {selectedSerie && (
          <div className="w-80 shrink-0 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <div className="font-mono text-sm font-black text-slate-800">{selectedSerie.numeroSerie}</div>
                <div className="mt-0.5 truncate text-xs text-slate-500">{selectedSerie.producto.descripcion}</div>
              </div>
              <button onClick={() => setSelectedSerie(null)} className="text-slate-400 hover:text-slate-600">
                <Icon icon="solar:close-circle-bold" width={20} />
              </button>
            </div>

            {/* Info rápida */}
            <div className="mb-4 space-y-1.5 rounded-xl bg-slate-50 p-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Estado</span>
                <span className={`rounded-full px-2 py-0.5 font-black ring-1 ${serieBadge[selectedSerie.estado]}`}>{selectedSerie.estado}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Garantía</span>
                <span className={`rounded-full px-2 py-0.5 font-black ring-1 ${garantiaBadge[selectedSerie.estadoGarantia]}`}>{selectedSerie.estadoGarantia}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Hasta</span>
                <span className="font-semibold text-slate-700">{fmt(selectedSerie.garantiaHasta)}</span>
              </div>
              {selectedSerie.comprobante && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Comprobante</span>
                  <span className="font-semibold text-slate-700">{selectedSerie.comprobante.numero}</span>
                </div>
              )}
              {selectedSerie.comprobante?.cliente && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Cliente</span>
                  <span className="max-w-[130px] truncate font-semibold text-slate-700">{selectedSerie.comprobante.cliente.nombre}</span>
                </div>
              )}
              {selectedSerie.observacion && (
                <div className="border-t border-slate-200 pt-1.5">
                  <span className="text-slate-500">Observación: </span>
                  <span className="text-slate-700">{selectedSerie.observacion}</span>
                </div>
              )}
            </div>

            <button
              onClick={() => abrirConstancia(selectedSerie)}
              disabled={generatingConstanciaId === selectedSerie.id}
              className="mb-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2.5 text-xs font-black text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Icon
                icon={generatingConstanciaId === selectedSerie.id ? 'line-md:loading-twotone-loop' : 'solar:document-text-bold-duotone'}
                width={16}
              />
              {generatingConstanciaId === selectedSerie.id ? 'Generando constancia...' : 'Ver constancia PDF'}
            </button>

            {/* Reclamos */}
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-black text-slate-800">Reclamos / Atenciones</h4>
              <button onClick={() => { setShowReclamoForm(true); setEditReclamo(null); setReclamoForm(EMPTY_RECLAMO); }}
                className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-rose-700 transition">
                <Icon icon="solar:add-circle-bold" width={13} />
                Nuevo
              </button>
            </div>

            {showReclamoForm && (
              <div className="mb-4 rounded-xl border border-rose-100 bg-rose-50 p-3 space-y-2">
                <textarea
                  className="w-full rounded-lg border border-rose-200 bg-white px-2.5 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-300"
                  rows={3} placeholder="Descripción del problema..."
                  value={reclamoForm.descripcion}
                  onChange={(e) => setReclamoForm((p) => ({ ...p, descripcion: e.target.value }))}
                />
                <input
                  className="w-full rounded-lg border border-rose-200 bg-white px-2.5 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-300"
                  placeholder="Técnico responsable (opcional)"
                  value={reclamoForm.tecnico}
                  onChange={(e) => setReclamoForm((p) => ({ ...p, tecnico: e.target.value }))}
                />
                {editReclamo && (
                  <select
                    className="w-full rounded-lg border border-rose-200 bg-white px-2.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-300"
                    value={reclamoForm.estadoReclamo}
                    onChange={(e) => setReclamoForm((p) => ({ ...p, estadoReclamo: e.target.value as EstadoReclamo }))}>
                    {estadoReclamoOptions.map((o) => <option key={o.id} value={o.id}>{o.value}</option>)}
                  </select>
                )}
                <div className="flex gap-2">
                  <button onClick={guardarReclamo} disabled={savingReclamo}
                    className="flex-1 rounded-lg bg-rose-600 py-1.5 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50 transition">
                    {savingReclamo ? 'Guardando...' : editReclamo ? 'Actualizar' : 'Registrar'}
                  </button>
                  <button onClick={() => { setShowReclamoForm(false); setEditReclamo(null); }}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition">
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {loadingReclamos ? (
              <div className="flex justify-center py-6"><Icon icon="line-md:loading-twotone-loop" className="text-2xl text-indigo-500" /></div>
            ) : reclamos.length === 0 ? (
              <p className="py-4 text-center text-xs text-slate-400">Sin reclamos registrados</p>
            ) : (
              <div className="space-y-2 overflow-y-auto max-h-72">
                {reclamos.map((r) => (
                  <div key={r.id} className="rounded-xl border border-gray-100 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black ${reclamoBadge[r.estadoReclamo]}`}>{r.estadoReclamo}</span>
                      <div className="flex gap-1">
                        <button onClick={() => { setEditReclamo(r); setReclamoForm({ descripcion: r.descripcion, tecnico: r.tecnico ?? '', estadoReclamo: r.estadoReclamo }); setShowReclamoForm(true); }}
                          className="text-blue-400 hover:text-blue-600"><Icon icon="solar:pen-new-square-linear" width={14} /></button>
                        <button onClick={() => setReclamoToDelete(r)} className="text-rose-400 hover:text-rose-600"><Icon icon="solar:trash-bin-2-linear" width={14} /></button>
                      </div>
                    </div>
                    <p className="mt-1.5 text-xs text-slate-700">{r.descripcion}</p>
                    {r.tecnico && <p className="mt-1 text-[11px] text-slate-500">Técnico: {r.tecnico}</p>}
                    {r.resolucion && <p className="mt-1 text-[11px] text-emerald-600">Resolución: {r.resolucion}</p>}
                    <p className="mt-1 text-[10px] text-slate-400">{fmt(r.fechaReclamo)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal nueva / editar serie */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900">{editSerie ? 'Editar serie' : 'Registrar nueva serie'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <Icon icon="solar:close-circle-bold" width={22} />
              </button>
            </div>

            <div className="space-y-4">
              {!editSerie && (
                <div className="relative" ref={productoDropdownRef}>
                  <label className="mb-1.5 block text-[11px] font-black uppercase tracking-widest text-slate-500">Producto *</label>
                  {productoSelected ? (
                    <div className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2.5">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-slate-800 truncate">{productoSelected.descripcion}</div>
                        <div className="text-[11px] font-mono text-slate-400 uppercase">{productoSelected.codigo}</div>
                      </div>
                      <button type="button" onClick={() => { setProductoSelected(null); setProductoSearch(''); }}
                        className="text-slate-400 hover:text-rose-500 transition">
                        <Icon icon="solar:close-circle-bold" width={18} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <input
                        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        placeholder="Buscar producto por nombre o código..."
                        value={productoSearch}
                        onChange={(e) => { setProductoSearch(e.target.value); setShowProductoDropdown(true); }}
                        onFocus={() => productoOptions.length > 0 && setShowProductoDropdown(true)}
                      />
                      {showProductoDropdown && productoOptions.length > 0 && (
                        <div className="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden">
                          {productoOptions.map((p) => (
                            <button key={p.id} type="button"
                              className="w-full px-3 py-2.5 text-left hover:bg-indigo-50 transition border-b border-slate-50 last:border-0"
                              onClick={() => { setProductoSelected(p); setProductoSearch(''); setShowProductoDropdown(false); setForm((f) => ({ ...f, productoId: String(p.id) })); }}>
                              <div className="text-sm font-bold text-slate-800">{p.descripcion}</div>
                              <div className="text-[11px] font-mono text-slate-400 uppercase">{p.codigo} · ID:{p.id}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {!editSerie && (
                <div>
                  <label className="mb-1.5 block text-[11px] font-black uppercase tracking-widest text-slate-500">Series *</label>
                  <textarea rows={4}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-mono font-bold uppercase text-slate-800 placeholder:font-normal placeholder:normal-case focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    placeholder={"Una serie por línea o separadas por coma:\nSN123ABC\nSN456DEF\nSN789GHI"}
                    value={bulkSeries}
                    onChange={(e) => setBulkSeries(e.target.value.toUpperCase())}
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    {bulkSeries.split(/[\n,]+/).filter((s) => s.trim()).length > 0
                      ? `${bulkSeries.split(/[\n,]+/).filter((s) => s.trim()).length} serie(s) a registrar`
                      : 'Ingresa los números de serie separados por salto de línea o coma'}
                  </p>
                </div>
              )}

              {editSerie && (
                <div>
                  <label className="mb-1.5 block text-[11px] font-black uppercase tracking-widest text-slate-500">Estado</label>
                  <select className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    value={(form as any).estado ?? editSerie.estado}
                    onChange={(e) => setForm((p) => ({ ...p, estado: e.target.value } as any))}>
                    {estadoOptions.filter((o) => o.id !== 'TODOS').map((o) => <option key={o.id} value={o.id}>{o.value}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-[11px] font-black uppercase tracking-widest text-slate-500">Meses de garantía</label>
                <input type="number" min={0} max={120}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  placeholder="Ej. 12"
                  value={form.garantiaMeses}
                  onChange={(e) => setForm((p) => ({ ...p, garantiaMeses: e.target.value }))} />
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-black uppercase tracking-widest text-slate-500">Observación</label>
                <textarea rows={2}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  placeholder="Notas adicionales..."
                  value={form.observacion}
                  onChange={(e) => setForm((p) => ({ ...p, observacion: e.target.value }))} />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button onClick={() => setShowModal(false)}
                className="flex-1 rounded-2xl border border-slate-200 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition">
                Cancelar
              </button>
              <button onClick={guardarSerie} disabled={saving}
                className="flex-1 rounded-2xl bg-indigo-600 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50 transition">
                {saving ? 'Guardando...' : editSerie ? 'Actualizar' : 'Registrar serie'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ModalConfirm
        isOpenModal={Boolean(serieToDelete)}
        setIsOpenModal={(v) => { if (!v) setSerieToDelete(null); }}
        confirmSubmit={eliminarSerie}
        confirmLoading={deleting}
        title="Eliminar serie"
        information={
          serieToDelete?.estado === 'VENDIDO'
            ? `La serie "${serieToDelete?.numeroSerie}" está vendida y se marcará como BAJA. ¿Deseas continuar?`
            : `¿Eliminar permanentemente la serie "${serieToDelete?.numeroSerie}"? Esta acción no se puede deshacer.`
        }
        confirmText="Eliminar"
      />

      <ModalConfirm
        isOpenModal={Boolean(reclamoToDelete)}
        setIsOpenModal={(v) => { if (!v) setReclamoToDelete(null); }}
        confirmSubmit={eliminarReclamo}
        confirmLoading={deletingReclamo}
        title="Eliminar reclamo"
        information="¿Eliminar este reclamo de garantía? Esta acción no se puede deshacer."
        confirmText="Eliminar"
      />
    </div>
  );
}
