import { useEffect, useMemo, useState } from 'react';
import apiClient from '@/utils/apiClient';
import useAlertStore from '@/zustand/alert';
import { useAuthStore } from '@/zustand/auth';
import { esRubroFabricacion } from '@/utils/rubro-features';
import Select from '@/components/Select';
import InputPro from '@/components/InputPro';
import Button from '@/components/Button';
import DataTable from '@/components/Datatable';
import Modal from '@/components/Modal';
import TableActionMenu from '@/components/TableActionMenu';
import { Icon } from '@iconify/react/dist/iconify.js';
import { Calendar } from '@/components/Date';

type Orden = {
  id: number;
  loteProduccion: string;
  estado: string;
  cantidadObjetivo: number | string;
  cantidadProducida: number | string;
  mermaTotal: number | string;
  mermaValorizada?: number | string;
  creadoEn: string;
  receta?: {
    id: number;
    codigo?: string;
    nombre?: string;
    mermaObjetivoPorcentaje?: number | string;
  };
  productoFinal?: { id: number; codigo?: string; descripcion?: string };
};

type OrdenDetalle = {
  id: number;
  loteProduccion: string;
  estado: string;
  cantidadObjetivo: number | string;
  componentes: Array<{
    productoInsumoId: number;
    cantidadTeorica: number | string;
    cantidadConsumida: number | string;
    mermaCantidad: number | string;
    unidad: string;
    productoInsumo?: { id: number; codigo?: string; descripcion?: string };
  }>;
};

type ResumenMaterial = {
  componenteId: number;
  codigo: string;
  descripcion: string;
  unidad: string;
  cantidadTeorica: number;
  cantidadConsumida: number;
  cantidadSobrante: number;
  mermaCantidad: number;
  costoUnitario?: number;
  mermaValorizada?: number;
};

type ResumenTotales = {
  teorico: number;
  consumido: number;
  merma: number;
  mermaValorizada: number;
};

type RecetaOption = {
  id: number;
  codigo?: string;
  nombre?: string;
  productoFinal?: { id: number; descripcion?: string };
};

type ProductoOption = {
  id: number;
  codigo?: string;
  descripcion?: string;
  codigoBarras?: string;
};

type SelectOption = {
  id: number | string;
  value: string;
};

type MetodoSalidaLotes = 'LIFO' | 'FIFO' | 'FEFO';

type HistorialConfig = {
  id: number;
  detalle?: string;
  autorNombre: string;
  creadoEn: string;
};

type ComponenteEjecucionForm = {
  productoInsumoId: number;
  codigo: string;
  descripcion: string;
  unidad: string;
  cantidadTeorica: number;
  cantidadConsumida: number | '';
  mermaCantidad: number | '';
  observacion: string;
};

export default function ProduccionOrdenesPage() {
  const { auth } = useAuthStore();
  const alert = useAlertStore((state) => state.alert);
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [resumenOrdenId, setResumenOrdenId] = useState<number | null>(null);
  const [resumenMateriales, setResumenMateriales] = useState<ResumenMaterial[]>([]);
  const [resumenTotales, setResumenTotales] = useState<ResumenTotales | null>(
    null,
  );
  const [recetasBase, setRecetasBase] = useState<RecetaOption[]>([]);
  const [recetaOptions, setRecetaOptions] = useState<SelectOption[]>([]);
  const [productoOptions, setProductoOptions] = useState<SelectOption[]>([]);
  const [metodoSalidaLotes, setMetodoSalidaLotes] =
    useState<MetodoSalidaLotes>('LIFO');
  const [guardandoMetodo, setGuardandoMetodo] = useState(false);
  const [historialConfig, setHistorialConfig] = useState<HistorialConfig[]>([]);
  const [isHistorialModalOpen, setIsHistorialModalOpen] = useState(false);
  const [openAccionesId, setOpenAccionesId] = useState<number | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [isFinalizarModalOpen, setIsFinalizarModalOpen] = useState(false);
  const [cargandoFinalizar, setCargandoFinalizar] = useState(false);
  const [guardandoFinalizar, setGuardandoFinalizar] = useState(false);
  const [ordenFinalizar, setOrdenFinalizar] = useState<OrdenDetalle | null>(null);
  const [ejecucionForm, setEjecucionForm] = useState({
    fechaInicio: '',
    fechaFin: '',
    cantidadProducida: '' as number | '',
    mermaTotal: '' as number | '',
    observaciones: '',
    componentes: [] as ComponenteEjecucionForm[],
  });

  const mermaTotalCalculada = useMemo(
    () =>
      ejecucionForm.componentes.reduce(
        (acc, item) => acc + Number(item.mermaCantidad || 0),
        0,
      ),
    [ejecucionForm.componentes],
  );

  const [form, setForm] = useState({
    recetaId: '' as number | '',
    productoFinalId: '' as number | '',
    loteProduccion: '',
    cantidadObjetivo: '' as number | '',
  });

  const metodoSalidaOptions: SelectOption[] = [
    { id: 'LIFO', value: 'LIFO (último que entra, primero que sale)' },
    { id: 'FIFO', value: 'FIFO (primero que entra, primero que sale)' },
    { id: 'FEFO', value: 'FEFO (vence primero, sale primero)' },
  ];

  const estadoOptions: SelectOption[] = [
    { id: 'TODOS', value: 'Todos' },
    { id: 'BORRADOR', value: 'BORRADOR' },
    { id: 'PLANIFICADA', value: 'PLANIFICADA' },
    { id: 'EN_PROCESO', value: 'EN PROCESO' },
    { id: 'FINALIZADA', value: 'FINALIZADA' },
    { id: 'ANULADA', value: 'ANULADA' },
  ];

  const esFabricacion = useMemo(
    () => esRubroFabricacion(auth?.empresa?.rubro?.nombre),
    [auth?.empresa?.rubro?.nombre],
  );

  const formatearReceta = (item: RecetaOption) => {
    const codigo = item.codigo || `REC-${item.id}`;
    const nombre = item.nombre || 'Sin nombre';
    const productoFinal = item.productoFinal?.descripcion
      ? ` · ${item.productoFinal.descripcion}`
      : '';
    return `${codigo} · ${nombre}${productoFinal}`;
  };

  const formatearProducto = (producto: ProductoOption) => {
    const codigo = producto.codigo || `ID ${producto.id}`;
    const descripcion = producto.descripcion || 'Sin descripción';
    const codigoBarras = producto.codigoBarras
      ? ` · Barras: ${producto.codigoBarras}`
      : '';
    return `${codigo} · ${descripcion}${codigoBarras}`;
  };

  const cargarRecetasActivas = async () => {
    try {
      const resp: any = await apiClient.get('/produccion/recetas', {
        params: { activo: true },
      });
      if (resp?.data?.code === 1) {
        const data: RecetaOption[] = resp.data.data || [];
        setRecetasBase(data);
        setRecetaOptions(
          data.map((item) => ({
            id: item.id,
            value: formatearReceta(item),
          })),
        );
      }
    } catch {
      // la validación final ocurre al guardar orden
    }
  };

  const cargarConfiguracionProduccion = async () => {
    try {
      const resp: any = await apiClient.get('/produccion/config');
      if (resp?.data?.code === 1) {
        const metodo = String(resp.data.data?.metodoSalidaLotes || 'LIFO')
          .trim()
          .toUpperCase() as MetodoSalidaLotes;
        setMetodoSalidaLotes(
          metodo === 'FIFO' || metodo === 'FEFO' ? metodo : 'LIFO',
        );
      }
    } catch {
      // Si falla config, se mantiene LIFO.
    }
  };

  const cargarHistorialConfiguracion = async () => {
    try {
      const resp: any = await apiClient.get('/produccion/config/historial', {
        params: { limit: 6 },
      });
      if (resp?.data?.code === 1) {
        setHistorialConfig(resp.data.data || []);
      }
    } catch {
      // opcional para vista
    }
  };

  const guardarConfiguracionProduccion = async (metodo: MetodoSalidaLotes) => {
    try {
      setGuardandoMetodo(true);
      const resp: any = await apiClient.patch('/produccion/config', {
        metodoSalidaLotes: metodo,
      });
      if (resp?.data?.code === 1) {
        setMetodoSalidaLotes(metodo);
        alert('Método de salida actualizado', 'success');
        await cargarHistorialConfiguracion();
      } else {
        alert(
          resp?.data?.message || 'No se pudo actualizar método de salida',
          'error',
        );
      }
    } catch (error: any) {
      alert(
        error?.response?.data?.message ||
          'No se pudo actualizar método de salida',
        'error',
      );
    } finally {
      setGuardandoMetodo(false);
    }
  };

  const cargarOpcionesProducto = async (
    search = '',
    callback?: () => void,
  ) => {
    try {
      const resp: any = await apiClient.get('/producto/listar', {
        params: { search, page: 1, limit: 20 },
      });
      if (resp?.data?.code === 1) {
        const productos: ProductoOption[] = resp.data.data?.productos || [];
        setProductoOptions(
          productos.map((item) => ({
            id: item.id,
            value: formatearProducto(item),
          })),
        );
      }
    } catch {
      // la validación final ocurre al guardar orden
    } finally {
      callback?.();
    }
  };

  const buscarProductos = (query: string, callback: () => void) => {
    void cargarOpcionesProducto(query, callback);
  };

  const cargarOrdenes = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (estadoFiltro) params.estado = estadoFiltro;
      const resp: any = await apiClient.get('/produccion/ordenes', { params });
      if (resp?.data?.code === 1) {
        setOrdenes(resp.data.data?.data || []);
      } else {
        alert(resp?.data?.message || 'No se pudo cargar órdenes', 'error');
      }
    } catch (error: any) {
      alert(
        error?.response?.data?.message || 'No se pudo cargar órdenes',
        'error',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (esFabricacion) {
      void cargarOrdenes();
    }
  }, [esFabricacion, estadoFiltro]);

  useEffect(() => {
    if (esFabricacion) {
      void cargarRecetasActivas();
      void cargarOpcionesProducto();
      void cargarConfiguracionProduccion();
      void cargarHistorialConfiguracion();
    }
  }, [esFabricacion]);

  const obtenerAlertaMerma = (orden: Orden) => {
    if (orden.estado !== 'FINALIZADA') {
      return { label: 'Sin cierre', className: 'bg-gray-100 text-gray-600' };
    }
    const producida = Number(orden.cantidadProducida || 0);
    if (producida <= 0) {
      return {
        label: 'Finalizada sin producción',
        className: 'bg-amber-100 text-amber-700',
      };
    }
    const mermaPct = (Number(orden.mermaTotal || 0) / producida) * 100;
    const objetivo = Number(orden.receta?.mermaObjetivoPorcentaje || 0);
    if (mermaPct <= objetivo) {
      return {
        label: `OK ${mermaPct.toFixed(2)}% / Obj ${objetivo.toFixed(2)}%`,
        className: 'bg-emerald-100 text-emerald-700',
      };
    }
    if (mermaPct <= objetivo * 1.2 || objetivo === 0) {
      return {
        label: `Alerta ${mermaPct.toFixed(2)}% / Obj ${objetivo.toFixed(2)}%`,
        className: 'bg-amber-100 text-amber-700',
      };
    }
    return {
      label: `Crítica ${mermaPct.toFixed(2)}% / Obj ${objetivo.toFixed(2)}%`,
      className: 'bg-red-100 text-red-700',
    };
  };

  const estadoPill = (estado: string) => {
    const map: Record<string, string> = {
      BORRADOR: 'bg-slate-100 text-slate-700 border border-slate-200',
      PLANIFICADA: 'bg-blue-100 text-blue-700 border border-blue-200',
      EN_PROCESO: 'bg-amber-100 text-amber-700 border border-amber-200',
      FINALIZADA: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
      ANULADA: 'bg-rose-100 text-rose-700 border border-rose-200',
    };
    return map[estado] || 'bg-gray-100 text-gray-700 border border-gray-200';
  };

  const onSelectReceta = (
    id: any,
    _value: string,
    _name: string,
    _idField?: string,
  ) => {
    const recetaId = id ? Number(id) : '';
    const receta = recetasBase.find((item) => item.id === Number(id));
    setForm((prev) => ({
      ...prev,
      recetaId,
      productoFinalId: receta?.productoFinal?.id ?? prev.productoFinalId,
    }));
  };

  const onSelectProductoFinal = (
    id: any,
    _value: string,
    _name: string,
    _idField?: string,
  ) => {
    setForm((prev) => ({
      ...prev,
      productoFinalId: id ? Number(id) : '',
    }));
  };

  const onSelectMetodoSalida = (
    id: any,
    _value: string,
    _name: string,
    _idField?: string,
  ) => {
    const metodo = String(id || '')
      .trim()
      .toUpperCase() as MetodoSalidaLotes;
    if (metodo === 'LIFO' || metodo === 'FIFO' || metodo === 'FEFO') {
      void guardarConfiguracionProduccion(metodo);
    }
  };

  const onSelectEstadoFiltro = (
    id: any,
    _value: string,
    _name: string,
    _idField?: string,
  ) => {
    const estado = String(id || '').trim().toUpperCase();
    setEstadoFiltro(estado === 'TODOS' ? '' : estado);
  };

  const crearOrden = async () => {
    if (!form.loteProduccion.trim() || !form.cantidadObjetivo) {
      alert('Completa lote y cantidad objetivo', 'warning');
      return;
    }
    if (!form.recetaId && !form.productoFinalId) {
      alert('Debes enviar receta ID o producto final ID', 'warning');
      return;
    }

    try {
      setGuardando(true);
      const payload: any = {
        loteProduccion: form.loteProduccion.trim(),
        cantidadObjetivo: Number(form.cantidadObjetivo),
      };
      if (form.recetaId) payload.recetaId = Number(form.recetaId);
      if (form.productoFinalId) payload.productoFinalId = Number(form.productoFinalId);

      const resp: any = await apiClient.post('/produccion/ordenes', payload);
      if (resp?.data?.code === 1) {
        alert('Orden creada correctamente', 'success');
        setForm({
          recetaId: '',
          productoFinalId: '',
          loteProduccion: '',
          cantidadObjetivo: '',
        });
        await cargarOrdenes();
      } else {
        alert(resp?.data?.message || 'No se pudo crear orden', 'error');
      }
    } catch (error: any) {
      alert(
        error?.response?.data?.message || 'No se pudo crear orden',
        'error',
      );
    } finally {
      setGuardando(false);
    }
  };

  const cambiarEstado = async (ordenId: number, estado: string) => {
    try {
      const resp: any = await apiClient.patch(
        `/produccion/ordenes/${ordenId}/estado`,
        { estado },
      );
      if (resp?.data?.code === 1) {
        alert('Estado actualizado', 'success');
        await cargarOrdenes();
      } else {
        alert(resp?.data?.message || 'No se pudo actualizar estado', 'error');
      }
    } catch (error: any) {
      alert(
        error?.response?.data?.message || 'No se pudo actualizar estado',
        'error',
      );
    }
  };

  const abrirFinalizarOrden = async (ordenId: number) => {
    try {
      setCargandoFinalizar(true);
      const resp: any = await apiClient.get(`/produccion/ordenes/${ordenId}`);
      if (resp?.data?.code !== 1) {
        alert(resp?.data?.message || 'No se pudo cargar orden', 'error');
        return;
      }
      const orden = resp.data.data as OrdenDetalle;
      const ahora = new Date();
      const isoLocal = (d: Date) => {
        const offset = d.getTimezoneOffset();
        const local = new Date(d.getTime() - offset * 60000);
        return local.toISOString().slice(0, 16);
      };
      const componentes = (orden.componentes || []).map((item) => ({
        productoInsumoId: Number(item.productoInsumoId),
        codigo: item.productoInsumo?.codigo || `ID ${item.productoInsumoId}`,
        descripcion: item.productoInsumo?.descripcion || 'Sin descripción',
        unidad: item.unidad || 'UN',
        cantidadTeorica: Number(item.cantidadTeorica || 0),
        cantidadConsumida: Number(item.cantidadTeorica || 0),
        mermaCantidad: Number(item.mermaCantidad || 0),
        observacion: '',
      }));
      setOrdenFinalizar(orden);
      setEjecucionForm({
        fechaInicio: isoLocal(ahora),
        fechaFin: isoLocal(ahora),
        cantidadProducida:
          Number(orden.cantidadObjetivo || 0) > 0
            ? Number(orden.cantidadObjetivo || 0)
            : '',
        mermaTotal: '',
        observaciones: '',
        componentes,
      });
      setIsFinalizarModalOpen(true);
    } catch (error: any) {
      alert(error?.response?.data?.message || 'No se pudo cargar orden', 'error');
    } finally {
      setCargandoFinalizar(false);
    }
  };

  const actualizarComponenteEjecucion = (
    index: number,
    field: 'cantidadConsumida' | 'mermaCantidad' | 'observacion',
    value: string,
  ) => {
    setEjecucionForm((prev) => ({
      ...prev,
      componentes: prev.componentes.map((item, idx) =>
        idx === index
          ? {
              ...item,
              [field]:
                field === 'observacion'
                  ? value
                  : value === ''
                    ? ''
                    : Number(value),
            }
          : item,
      ),
    }));
  };

  const toDisplayDate = (isoLike: string) => {
    if (!isoLike) return '';
    const d = new Date(isoLike);
    if (Number.isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const toIsoFromDisplayDate = (displayDate: string) => {
    if (!displayDate) return '';
    const [day, month, year] = displayDate.split('/');
    if (!day || !month || !year) return '';
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00`;
  };

  const finalizarOrden = async () => {
    if (!ordenFinalizar) return;
    if (!ejecucionForm.cantidadProducida || Number(ejecucionForm.cantidadProducida) <= 0) {
      alert('Ingresa cantidad producida mayor a 0', 'warning');
      return;
    }
    if (!ejecucionForm.componentes.length) {
      alert('La orden no tiene componentes para ejecutar', 'warning');
      return;
    }
    if (
      ejecucionForm.componentes.some(
        (item) =>
          item.cantidadConsumida === '' ||
          Number(item.cantidadConsumida) < 0 ||
          item.mermaCantidad === '' ||
          Number(item.mermaCantidad) < 0,
      )
    ) {
      alert('Revisa consumos/mermas: no pueden ser negativos', 'warning');
      return;
    }

    try {
      setGuardandoFinalizar(true);
      const payload = {
        fechaInicio: ejecucionForm.fechaInicio
          ? new Date(ejecucionForm.fechaInicio).toISOString()
          : undefined,
        fechaFin: ejecucionForm.fechaFin
          ? new Date(ejecucionForm.fechaFin).toISOString()
          : undefined,
        cantidadProducida: Number(ejecucionForm.cantidadProducida),
        mermaTotal: mermaTotalCalculada,
        observaciones: ejecucionForm.observaciones || undefined,
        componentes: ejecucionForm.componentes.map((item) => ({
          productoInsumoId: item.productoInsumoId,
          cantidadConsumida: Number(item.cantidadConsumida || 0),
          mermaCantidad: Number(item.mermaCantidad || 0),
          observacion: item.observacion || undefined,
        })),
      };
      const resp: any = await apiClient.post(
        `/produccion/ordenes/${ordenFinalizar.id}/ejecutar`,
        payload,
      );
      if (resp?.data?.code === 1) {
        alert('Orden finalizada correctamente', 'success');
        setIsFinalizarModalOpen(false);
        setOrdenFinalizar(null);
        await cargarOrdenes();
      } else {
        alert(resp?.data?.message || 'No se pudo finalizar orden', 'error');
      }
    } catch (error: any) {
      alert(
        error?.response?.data?.message || 'No se pudo finalizar orden',
        'error',
      );
    } finally {
      setGuardandoFinalizar(false);
    }
  };

  const verResumen = async (ordenId: number) => {
    try {
      setResumenOrdenId(ordenId);
      const resp: any = await apiClient.get(
        `/produccion/ordenes/${ordenId}/resumen-materiales`,
      );
      if (resp?.data?.code === 1) {
        setResumenMateriales(resp.data.data?.componentes || []);
        setResumenTotales(resp.data.data?.totales || null);
      } else {
        alert(resp?.data?.message || 'No se pudo cargar resumen', 'error');
      }
    } catch (error: any) {
      alert(
        error?.response?.data?.message || 'No se pudo cargar resumen',
        'error',
      );
    }
  };

  const formatSoles = (value: number | string | null | undefined) => {
    const n = Number(value || 0);
    return `S/ ${n.toFixed(2)}`;
  };

  const ordenRows = ordenes.map((item) => {
    const alertaMerma = obtenerAlertaMerma(item);
    const puedePlanificar =
      item.estado === 'BORRADOR' || item.estado === 'EN_PROCESO';
    const puedeIniciar =
      item.estado === 'BORRADOR' || item.estado === 'PLANIFICADA';
    const puedeAnular =
      item.estado === 'BORRADOR' ||
      item.estado === 'PLANIFICADA' ||
      item.estado === 'EN_PROCESO';

    return {
      Lote: item.loteProduccion,
      Receta: item.receta?.codigo || '-',
      'Producto Final': item.productoFinal?.descripcion || '-',
      Objetivo: item.cantidadObjetivo,
      Producido: item.cantidadProducida || 0,
      'Alerta Merma': (
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold ${alertaMerma.className}`}
        >
          {alertaMerma.label}
        </span>
      ),
      'Merma (S/)': (
        <span className="font-medium text-rose-700 dark:text-rose-300">
          {formatSoles(item.mermaValorizada)}
        </span>
      ),
      Estado: (
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold ${estadoPill(item.estado)}`}
        >
          {item.estado}
        </span>
      ),
      Acciones: (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={(e) => {
              const nextId = openAccionesId === item.id ? null : item.id;
              setOpenAccionesId(nextId);
              setAnchorEl(nextId ? (e.currentTarget as HTMLElement) : null);
            }}
            className="inline-flex items-center justify-center rounded-lg border border-gray-200 dark:border-slate-700 p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800"
          >
            <Icon icon="solar:menu-dots-bold" width={18} />
          </button>
        </div>
      ),
    };
  });

  const resumenRows = resumenMateriales.map((item) => ({
    Componente: `${item.codigo} · ${item.descripcion}`,
    Teórico: `${item.cantidadTeorica} ${item.unidad}`,
    Consumido: `${item.cantidadConsumida} ${item.unidad}`,
    Sobrante: `${item.cantidadSobrante} ${item.unidad}`,
    Merma: `${item.mermaCantidad} ${item.unidad}`,
    'Costo Unit.': formatSoles(item.costoUnitario),
    'Merma (S/)': (
      <span className="font-medium text-rose-700 dark:text-rose-300">
        {formatSoles(item.mermaValorizada)}
      </span>
    ),
  }));

  const componentesEjecucionRows = ejecucionForm.componentes.map((item, index) => ({
    Componente: (
      <div>
        <div className="font-medium text-gray-800 dark:text-gray-100">{item.codigo}</div>
        <div className="text-xs text-gray-500">{item.descripcion}</div>
      </div>
    ),
    Teórico: `${item.cantidadTeorica} ${item.unidad}`,
    Consumido: (
      <InputPro
        name={`consumido-${item.productoInsumoId}-${index}`}
        type="number"
        value={item.cantidadConsumida}
        onChange={(e) =>
          actualizarComponenteEjecucion(index, 'cantidadConsumida', e.target.value)
        }
        className="w-28 !py-1.5"
      />
    ),
    Merma: (
      <InputPro
        name={`merma-${item.productoInsumoId}-${index}`}
        type="number"
        value={item.mermaCantidad}
        onChange={(e) =>
          actualizarComponenteEjecucion(index, 'mermaCantidad', e.target.value)
        }
        className="w-24 !py-1.5"
      />
    ),
    Observación: (
      <InputPro
        name={`obs-${item.productoInsumoId}-${index}`}
        type="text"
        value={item.observacion}
        onChange={(e) =>
          actualizarComponenteEjecucion(index, 'observacion', e.target.value)
        }
        className="w-full min-w-[180px] !py-1.5"
        placeholder="Opcional"
      />
    ),
  }));

  if (!esFabricacion) {
    return (
      <div className="p-4 md:p-6">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
          Este módulo está disponible solo para rubros de fabricación.
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Órdenes de Producción
          </h1>
          <p className="text-sm text-gray-500">
            Crea, sigue y controla mermas por lote de producción.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsHistorialModalOpen(true)}
            color="secondary"
            outline
            className="text-sm"
          >
            Historial
          </Button>
          <Button
            onClick={() => void cargarOrdenes()}
            color="primary"
            className="text-sm"
          >
            Recargar
          </Button>
        </div>
      </div>

      <div className="rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            Método de salida de lotes (consumo en producción):
          </p>
          <div className="w-full max-w-md">
            <Select
              label="Método"
              name="metodoSalidaLotes"
              options={metodoSalidaOptions}
              onChange={onSelectMetodoSalida}
              value={
                metodoSalidaOptions.find((opt) => opt.id === metodoSalidaLotes)
                  ?.value || ''
              }
              disabled={guardandoMetodo}
              withLabel
              error={null}
            />
            {guardandoMetodo ? (
              <span className="text-xs text-gray-500">Guardando...</span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
        <strong>Estados:</strong> BORRADOR (aún editable), PLANIFICADA
        (lista para iniciar), EN PROCESO (consumiendo insumos), FINALIZADA
        (cerrada y ya ingresó producto final), ANULADA (cancelada).
      </div>

      <div className="rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-4 space-y-3">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          Nueva Orden
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Select
            label="Receta (opcional)"
            name="recetaId"
            options={recetaOptions}
            onChange={onSelectReceta}
            isSearch
            withLabel
            error={null}
          />
          <Select
            label="Producto final (opcional)"
            name="productoFinalId"
            options={productoOptions}
            onChange={onSelectProductoFinal}
            isSearch
            handleGetData={buscarProductos}
            withLabel
            error={null}
          />
          <InputPro
            name="loteProduccion"
            isLabel
            label="Lote producción"
            placeholder="Ej: V052027"
            value={form.loteProduccion}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, loteProduccion: e.target.value }))
            }
          />
          <InputPro
            name="cantidadObjetivo"
            type="number"
            isLabel
            label="Cantidad objetivo"
            placeholder="Ej: 100"
            value={form.cantidadObjetivo}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                cantidadObjetivo: e.target.value ? Number(e.target.value) : '',
              }))
            }
          />
        </div>
        <div>
          <Button
            onClick={() => void crearOrden()}
            disabled={guardando}
            color="success"
            className="text-sm"
          >
            {guardando ? 'Guardando...' : 'Crear orden'}
          </Button>
        </div>
      </div>

      <div className="rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Órdenes registradas
          </h2>
          <div className="w-full max-w-[260px]">
            <Select
              label="Filtrar estado"
              name="estadoFiltro"
              options={estadoOptions}
              onChange={onSelectEstadoFiltro}
              value={
                estadoOptions.find((opt) =>
                  (estadoFiltro || 'TODOS') === opt.id,
                )?.value || 'Todos'
              }
              withLabel
              error={null}
            />
          </div>
        </div>
        {loading ? (
          <div className="p-4 text-sm text-gray-500">Cargando órdenes...</div>
        ) : ordenes.length === 0 ? (
          <div className="p-4 text-sm text-gray-500">Aún no hay órdenes.</div>
        ) : (
          <div className="overflow-x-auto">
            <DataTable
              bodyData={ordenRows}
              headerColumns={[
                'Lote',
                'Receta',
                'Producto Final',
                'Objetivo',
                'Producido',
                'Alerta Merma',
                'Merma (S/)',
                'Estado',
                'Acciones',
              ]}
            />
          </div>
        )}
      </div>

      {resumenOrdenId && (
        <div className="rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Resumen de Materiales · Orden #{resumenOrdenId}
            </h3>
            <Button
              onClick={() => {
                setResumenOrdenId(null);
                setResumenMateriales([]);
                setResumenTotales(null);
              }}
              color="secondary"
              outline
              className="text-sm"
            >
              Cerrar
            </Button>
          </div>
          <div className="overflow-x-auto">
            {resumenRows.length > 0 ? (
              <DataTable
                bodyData={resumenRows}
                headerColumns={[
                  'Componente',
                  'Teórico',
                  'Consumido',
                  'Sobrante',
                  'Merma',
                  'Costo Unit.',
                  'Merma (S/)',
                ]}
              />
            ) : (
              <div className="p-4 text-sm text-gray-500">
                No hay detalle de materiales para esta orden.
              </div>
            )}
          </div>
          {resumenTotales && (
            <div className="px-4 py-3 border-t border-gray-200 dark:border-slate-800 text-sm flex flex-wrap gap-4">
              <span className="text-gray-600 dark:text-gray-300">
                Merma total: <strong>{resumenTotales.merma.toFixed(4)}</strong>
              </span>
              <span className="text-rose-700 dark:text-rose-300">
                Merma valorizada: <strong>{formatSoles(resumenTotales.mermaValorizada)}</strong>
              </span>
            </div>
          )}
        </div>
      )}

      <Modal
        isOpenModal={isHistorialModalOpen}
        closeModal={() => setIsHistorialModalOpen(false)}
        title="Historial reciente de cambios"
        width="680px"
        height="auto"
      >
        <div className="p-4 space-y-3">
          {historialConfig.length > 0 ? (
            <div className="space-y-2">
              {historialConfig.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-gray-200 dark:border-slate-800 p-3"
                >
                  <p className="text-sm text-gray-800 dark:text-gray-100">
                    {item.detalle || 'Sin detalle'}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {item.autorNombre} ·{' '}
                    {new Date(item.creadoEn).toLocaleString('es-PE')}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500">
              Aún no hay cambios registrados.
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              onClick={() => void cargarHistorialConfiguracion()}
              color="secondary"
              outline
              className="text-sm"
            >
              Actualizar
            </Button>
            <Button
              onClick={() => setIsHistorialModalOpen(false)}
              color="primary"
              className="text-sm"
            >
              Cerrar
            </Button>
          </div>
        </div>
      </Modal>

      <TableActionMenu
        isOpen={!!openAccionesId && !!anchorEl}
        anchorEl={anchorEl}
        onClose={() => {
          setOpenAccionesId(null);
          setAnchorEl(null);
        }}
      >
        {openAccionesId && (() => {
          const orden = ordenes.find((o) => o.id === openAccionesId);
          if (!orden) return null;

          const puedePlanificar =
            orden.estado === 'BORRADOR' ||
            orden.estado === 'EN_PROCESO' ||
            orden.estado === 'ANULADA';
          const puedeIniciar =
            orden.estado === 'BORRADOR' || orden.estado === 'PLANIFICADA';
          const puedeAnular =
            orden.estado === 'BORRADOR' ||
            orden.estado === 'PLANIFICADA' ||
            orden.estado === 'EN_PROCESO';
          const puedeFinalizar = orden.estado === 'EN_PROCESO';

          return (
            <>
              {puedePlanificar && (
                <button
                  type="button"
                  onClick={() => {
                    void cambiarEstado(orden.id, 'PLANIFICADA');
                    setOpenAccionesId(null);
                    setAnchorEl(null);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-100"
                >
                  <Icon icon="solar:clipboard-list-bold" width={16} />
                  <span>{orden.estado === 'ANULADA' ? 'Reactivar' : 'Planificar'}</span>
                </button>
              )}
              {puedeIniciar && (
                <button
                  type="button"
                  onClick={() => {
                    void cambiarEstado(orden.id, 'EN_PROCESO');
                    setOpenAccionesId(null);
                    setAnchorEl(null);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-100"
                >
                  <Icon icon="solar:play-bold" width={16} />
                  <span>Iniciar</span>
                </button>
              )}
              {puedeAnular && (
                <button
                  type="button"
                  onClick={() => {
                    void cambiarEstado(orden.id, 'ANULADA');
                    setOpenAccionesId(null);
                    setAnchorEl(null);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50"
                >
                  <Icon icon="solar:close-circle-bold" width={16} />
                  <span>Anular</span>
                </button>
              )}
              {puedeFinalizar && (
                <button
                  type="button"
                  onClick={() => {
                    void abrirFinalizarOrden(orden.id);
                    setOpenAccionesId(null);
                    setAnchorEl(null);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-emerald-700 hover:bg-emerald-50"
                >
                  <Icon icon="solar:check-circle-bold" width={16} />
                  <span>Finalizar orden</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  void verResumen(orden.id);
                  setOpenAccionesId(null);
                  setAnchorEl(null);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-100"
              >
                <Icon icon="solar:document-text-bold" width={16} />
                <span>Ver resumen</span>
              </button>
            </>
          );
        })()}
      </TableActionMenu>

      <Modal
        isOpenModal={isFinalizarModalOpen}
        closeModal={() => {
          if (guardandoFinalizar) return;
          setIsFinalizarModalOpen(false);
        }}
        title={
          ordenFinalizar
            ? `Finalizar Orden · ${ordenFinalizar.loteProduccion}`
            : 'Finalizar Orden'
        }
        width="980px"
        height="auto"
      >
        <div className="p-4 space-y-4">
          {cargandoFinalizar ? (
            <div className="text-sm text-gray-500">Cargando datos...</div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Calendar
                  text="Fecha inicio"
                  name="fechaInicio"
                  value={toDisplayDate(ejecucionForm.fechaInicio)}
                  onChange={(date: string) =>
                    setEjecucionForm((prev) => ({
                      ...prev,
                      fechaInicio: toIsoFromDisplayDate(date),
                    }))
                  }
                />
                <Calendar
                  text="Fecha fin"
                  name="fechaFin"
                  value={toDisplayDate(ejecucionForm.fechaFin)}
                  onChange={(date: string) =>
                    setEjecucionForm((prev) => ({
                      ...prev,
                      fechaFin: toIsoFromDisplayDate(date),
                    }))
                  }
                />
                <InputPro
                  name="cantidadProducida"
                  type="number"
                  isLabel
                  label="Cantidad producida"
                  value={ejecucionForm.cantidadProducida}
                  onChange={(e) =>
                    setEjecucionForm((prev) => ({
                      ...prev,
                      cantidadProducida: e.target.value
                        ? Number(e.target.value)
                        : '',
                    }))
                  }
                />
                <InputPro
                  name="mermaTotal"
                  type="number"
                  isLabel
                  label="Merma total (automática)"
                  value={Number(mermaTotalCalculada.toFixed(4))}
                  readOnly
                  className="bg-gray-50 dark:bg-slate-900"
                />
              </div>

              <InputPro
                name="observaciones"
                isLabel
                label="Observaciones"
                value={ejecucionForm.observaciones}
                onChange={(e) =>
                  setEjecucionForm((prev) => ({
                    ...prev,
                    observaciones: e.target.value,
                  }))
                }
              />

              <div className="rounded-xl border border-gray-200 dark:border-slate-800 overflow-hidden">
                <div className="px-4 py-2 border-b border-gray-200 dark:border-slate-800 text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Componentes consumidos
                </div>
                <div className="overflow-x-auto">
                  <DataTable
                    bodyData={componentesEjecucionRows}
                    headerColumns={[
                      'Componente',
                      'Teórico',
                      'Consumido',
                      'Merma',
                      'Observación',
                    ]}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  onClick={() => setIsFinalizarModalOpen(false)}
                  color="secondary"
                  outline
                  className="text-sm"
                  disabled={guardandoFinalizar}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => void finalizarOrden()}
                  color="success"
                  className="text-sm"
                  disabled={guardandoFinalizar}
                >
                  {guardandoFinalizar ? 'Finalizando...' : 'Finalizar orden'}
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
