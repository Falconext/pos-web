import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import apiClient from '@/utils/apiClient';
import useAlertStore from '@/zustand/alert';
import { useAuthStore } from '@/zustand/auth';
import { esRubroFabricacion } from '@/utils/rubro-features';
import Select from '@/components/Select';
import InputPro from '@/components/InputPro';
import Button from '@/components/Button';
import DataTable from '@/components/Datatable';

type Receta = {
  id: number;
  codigo: string;
  nombre: string;
  version: number;
  activo: boolean;
  rendimientoObjetivo: number | string;
  unidadRendimiento: string;
  productoFinal?: {
    codigo?: string;
    descripcion?: string;
  };
  _count?: {
    componentes?: number;
    ordenes?: number;
  };
};

type ComponenteForm = {
  productoInsumoId: number | '';
  cantidadBase: number | '';
  unidadBase: string;
};

type ProductoOption = {
  id: number;
  codigo?: string;
  descripcion?: string;
  codigoBarras?: string;
};

type SelectOption = {
  id: number;
  value: string;
};

export default function ProduccionRecetasPage() {
  const { auth } = useAuthStore();
  const alert = useAlertStore((state) => state.alert);
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [descargandoPlantilla, setDescargandoPlantilla] = useState(false);
  const [importandoPlantilla, setImportandoPlantilla] = useState(false);
  const inputPlantillaRef = useRef<HTMLInputElement | null>(null);
  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [productoOptions, setProductoOptions] = useState<SelectOption[]>([]);
  const [productoLabelMap, setProductoLabelMap] = useState<
    Record<number, string>
  >({});
  const [componentes, setComponentes] = useState<ComponenteForm[]>([
    { productoInsumoId: '', cantidadBase: '', unidadBase: 'GR' },
  ]);
  const [form, setForm] = useState({
    productoFinalId: '' as number | '',
    codigo: '',
    nombre: '',
    rendimientoObjetivo: '' as number | '',
    unidadRendimiento: 'UN',
  });

  const esFabricacion = useMemo(
    () => esRubroFabricacion(auth?.empresa?.rubro?.nombre),
    [auth?.empresa?.rubro?.nombre],
  );

  const insumosDuplicados = useMemo(() => {
    const contador = new Map<number, number>();
    componentes.forEach((item) => {
      if (!item.productoInsumoId) return;
      const id = Number(item.productoInsumoId);
      contador.set(id, (contador.get(id) || 0) + 1);
    });
    return new Set(
      Array.from(contador.entries())
        .filter(([, cantidad]) => cantidad > 1)
        .map(([id]) => id),
    );
  }, [componentes]);

  const hayInsumosDuplicados = insumosDuplicados.size > 0;

  const hayInsumoIgualProductoFinal = useMemo(() => {
    if (!form.productoFinalId) return false;
    const productoFinalId = Number(form.productoFinalId);
    return componentes.some(
      (item) =>
        item.productoInsumoId &&
        Number(item.productoInsumoId) === productoFinalId,
    );
  }, [componentes, form.productoFinalId]);

  const bloqueoFormulario = hayInsumosDuplicados || hayInsumoIgualProductoFinal;

  const chipsInsumos = useMemo(() => {
    return componentes
      .map((item, index) => {
        if (!item.productoInsumoId) return null;
        const id = Number(item.productoInsumoId);
        return {
          index,
          id,
          label: productoLabelMap[id] || `Insumo #${id}`,
          cantidadBase: item.cantidadBase,
          unidadBase: item.unidadBase,
          duplicado: insumosDuplicados.has(id),
          esProductoFinal:
            !!form.productoFinalId && id === Number(form.productoFinalId),
        };
      })
      .filter(Boolean) as Array<{
      index: number;
      id: number;
      label: string;
      cantidadBase: number | '';
      unidadBase: string;
      duplicado: boolean;
      esProductoFinal: boolean;
    }>;
  }, [componentes, form.productoFinalId, insumosDuplicados, productoLabelMap]);

  const formatearProducto = (producto: ProductoOption) => {
    const codigo = producto.codigo || `ID ${producto.id}`;
    const descripcion = producto.descripcion || 'Sin descripción';
    const codigoBarras = producto.codigoBarras
      ? ` · Barras: ${producto.codigoBarras}`
      : '';
    return `${codigo} · ${descripcion}${codigoBarras}`;
  };

  const cargarOpcionesProducto = async (
    search = '',
    callback?: () => void,
  ) => {
    try {
      const resp: any = await apiClient.get('/productos', {
        params: { search, page: 1, limit: 20 },
      });
      if (resp?.data?.code === 1) {
        const productos: ProductoOption[] = resp.data.data?.productos || [];
        const mapNuevos = productos.reduce<Record<number, string>>(
          (acumulado, item) => {
            acumulado[item.id] = formatearProducto(item);
            return acumulado;
          },
          {},
        );
        setProductoOptions(
          productos.map((item) => ({
            id: item.id,
            value: formatearProducto(item),
          })),
        );
        setProductoLabelMap((prev) => ({ ...prev, ...mapNuevos }));
      }
    } catch {
      // Se notifica en interacción explícita del usuario al crear/guardar.
    } finally {
      callback?.();
    }
  };

  const buscarProductos = (query: string, callback: () => void) => {
    void cargarOpcionesProducto(query, callback);
  };

  const cargarRecetas = async () => {
    try {
      setLoading(true);
      const resp: any = await apiClient.get('/produccion/recetas');
      if (resp?.data?.code === 1) {
        setRecetas(resp.data.data || []);
      } else {
        alert(resp?.data?.message || 'No se pudo cargar recetas', 'error');
      }
    } catch (error: any) {
      alert(
        error?.response?.data?.message || 'No se pudo cargar recetas',
        'error',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (esFabricacion) {
      void cargarRecetas();
      void cargarOpcionesProducto();
    }
  }, [esFabricacion]);

  const agregarComponente = () => {
    setComponentes((prev) => [
      ...prev,
      { productoInsumoId: '', cantidadBase: '', unidadBase: 'GR' },
    ]);
  };

  const quitarComponente = (index: number) => {
    setComponentes((prev) => prev.filter((_, idx) => idx !== index));
  };

  const actualizarComponente = (
    index: number,
    field: keyof ComponenteForm,
    value: string,
  ) => {
    setComponentes((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        if (field === 'productoInsumoId' || field === 'cantidadBase') {
          return {
            ...item,
            [field]: value === '' ? '' : Number(value),
          };
        }
        return { ...item, [field]: value };
      }),
    );
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

  const onSelectProductoInsumo =
    (index: number) =>
    (id: any, _value: string, _name: string, _idField?: string) => {
      actualizarComponente(index, 'productoInsumoId', id ? String(id) : '');
    };

  const limpiarFormulario = () => {
    setForm({
      productoFinalId: '',
      codigo: '',
      nombre: '',
      rendimientoObjetivo: '',
      unidadRendimiento: 'UN',
    });
    setComponentes([{ productoInsumoId: '', cantidadBase: '', unidadBase: 'GR' }]);
  };

  const crearReceta = async () => {
    if (!form.productoFinalId || !form.codigo.trim() || !form.nombre.trim()) {
      alert('Completa producto final, código y nombre', 'warning');
      return;
    }
    if (!form.rendimientoObjetivo) {
      alert('Ingresa el rendimiento objetivo', 'warning');
      return;
    }
    if (
      componentes.length === 0 ||
      componentes.some(
        (item) => !item.productoInsumoId || !item.cantidadBase || !item.unidadBase,
      )
    ) {
      alert('Completa todos los componentes', 'warning');
      return;
    }
    const insumosUnicos = new Set(
      componentes.map((item) => Number(item.productoInsumoId)),
    );
    if (insumosUnicos.size !== componentes.length) {
      alert('No repitas el mismo insumo en la receta', 'warning');
      return;
    }
    if (hayInsumoIgualProductoFinal) {
      alert('El producto final no puede repetirse como insumo', 'warning');
      return;
    }

    try {
      setGuardando(true);
      const payload = {
        productoFinalId: Number(form.productoFinalId),
        codigo: form.codigo.trim(),
        nombre: form.nombre.trim(),
        rendimientoObjetivo: Number(form.rendimientoObjetivo),
        unidadRendimiento: form.unidadRendimiento.trim().toUpperCase(),
        componentes: componentes.map((item, idx) => ({
          productoInsumoId: Number(item.productoInsumoId),
          cantidadBase: Number(item.cantidadBase),
          unidadBase: item.unidadBase.trim().toUpperCase(),
          orden: idx + 1,
        })),
      };

      const resp: any = await apiClient.post('/produccion/recetas', payload);
      if (resp?.data?.code === 1) {
        alert('Receta creada correctamente', 'success');
        limpiarFormulario();
        await cargarRecetas();
      } else {
        alert(resp?.data?.message || 'No se pudo crear receta', 'error');
      }
    } catch (error: any) {
      alert(
        error?.response?.data?.message || 'No se pudo crear receta',
        'error',
      );
    } finally {
      setGuardando(false);
    }
  };

  const descargarPlantilla = async () => {
    try {
      setDescargandoPlantilla(true);
      const resp = await apiClient.get('/produccion/plantilla-carga', {
        responseType: 'blob',
      });
      const blob = new Blob([resp.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'plantilla_fabricacion_falconext.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      alert(
        error?.response?.data?.message || 'No se pudo descargar la plantilla',
        'error',
      );
    } finally {
      setDescargandoPlantilla(false);
    }
  };

  const importarPlantilla = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.xlsx')) {
      alert('Selecciona un archivo Excel válido (.xlsx)', 'warning');
      event.target.value = '';
      return;
    }

    try {
      setImportandoPlantilla(true);
      const formData = new FormData();
      formData.append('file', file);
      const resp: any = await apiClient.post(
        '/produccion/importar-plantilla',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );

      if (resp?.data?.code === 1) {
        const data = resp.data.data || {};
        alert(
          `Importación completada. Productos: +${data?.productos?.creados || 0} nuevos, ${data?.productos?.actualizados || 0} actualizados. Recetas: +${data?.recetas?.creadas || 0}. Órdenes: +${data?.ordenes?.creadas || 0}.`,
          'success',
        );
        await cargarRecetas();
      } else {
        alert(resp?.data?.message || 'No se pudo importar plantilla', 'error');
      }
    } catch (error: any) {
      alert(
        error?.response?.data?.message || 'No se pudo importar plantilla',
        'error',
      );
    } finally {
      setImportandoPlantilla(false);
      event.target.value = '';
    }
  };

  const recetaRows = recetas.map((item) => ({
    Código: item.codigo,
    Nombre: item.nombre,
    'Producto Final': item.productoFinal?.descripcion || '-',
    Rendimiento: `${item.rendimientoObjetivo} ${item.unidadRendimiento}`,
    Componentes: item._count?.componentes || 0,
    Estado: item.activo ? (
      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
        ACTIVA
      </span>
    ) : (
      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
        INACTIVA
      </span>
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
            Recetas de Producción
          </h1>
          <p className="text-sm text-gray-500">
            Configura insumos y rendimientos para cada producto final.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => void descargarPlantilla()}
            disabled={descargandoPlantilla}
            color="primary"
            outline
            className="text-sm"
          >
            {descargandoPlantilla ? 'Descargando...' : 'Descargar plantilla'}
          </Button>
          <input
            ref={inputPlantillaRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => void importarPlantilla(e)}
          />
          <Button
            onClick={() => inputPlantillaRef.current?.click()}
            disabled={importandoPlantilla}
            color="success"
            className="text-sm"
          >
            {importandoPlantilla ? 'Importando...' : 'Importar Excel'}
          </Button>
          <Button
            onClick={() => void cargarRecetas()}
            color="primary"
            className="text-sm"
          >
            Recargar
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
        Flujo rápido: 1) Descarga plantilla, 2) completa hojas <strong>PRODUCTOS</strong> y <strong>RECETAS</strong>, 3) opcional hoja <strong>ORDENES</strong>, 4) importa el archivo para crear todo de una vez.
      </div>

      <div className="rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-4 space-y-4">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          Nueva Receta
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="md:col-span-2">
            <Select
              label="Producto final"
              name="productoFinal"
              options={productoOptions}
              onChange={onSelectProductoFinal}
              isSearch
              handleGetData={buscarProductos}
              withLabel
              error={null}
            />
          </div>
          <InputPro
            name="codigo"
            isLabel
            label="Código receta"
            placeholder="Ej: REC-001"
            value={form.codigo}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, codigo: e.target.value }))
            }
          />
          <InputPro
            name="nombre"
            isLabel
            label="Nombre receta"
            placeholder="Nombre de receta"
            value={form.nombre}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, nombre: e.target.value }))
            }
          />
          <InputPro
            name="rendimientoObjetivo"
            type="number"
            isLabel
            label="Rendimiento objetivo"
            placeholder="Ej: 100"
            value={form.rendimientoObjetivo}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                rendimientoObjetivo: e.target.value
                  ? Number(e.target.value)
                  : '',
              }))
            }
          />
          <InputPro
            name="unidadRendimiento"
            isLabel
            label="Unidad rendimiento"
            placeholder="Ej: LT, KG, UN"
            value={form.unidadRendimiento}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                unidadRendimiento: e.target.value.toUpperCase(),
              }))
            }
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              Componentes
            </p>
            <Button
              onClick={agregarComponente}
              color="secondary"
              outline
              className="text-sm"
            >
              + Agregar componente
            </Button>
          </div>
          {chipsInsumos.length > 0 && (
            <div className="flex flex-wrap gap-2 rounded-lg border border-dashed border-gray-300 dark:border-slate-700 p-2">
              {chipsInsumos.map((chip) => (
                <div
                  key={`${chip.id}-${chip.index}`}
                  className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium ${
                    chip.duplicado || chip.esProductoFinal
                      ? 'bg-red-100 text-red-700'
                      : 'bg-indigo-100 text-indigo-700'
                  }`}
                >
                  <span>{chip.label}</span>
                  <input
                    type="number"
                    min={0}
                    value={chip.cantidadBase}
                    onChange={(e) =>
                      actualizarComponente(
                        chip.index,
                        'cantidadBase',
                        e.target.value,
                      )
                    }
                    className="w-20 rounded-md border border-black/20 bg-white px-1 py-0.5 text-[11px] text-gray-700"
                    title="Cantidad base"
                  />
                  <input
                    type="text"
                    value={chip.unidadBase}
                    onChange={(e) =>
                      actualizarComponente(
                        chip.index,
                        'unidadBase',
                        e.target.value.toUpperCase(),
                      )
                    }
                    className="w-16 rounded-md border border-black/20 bg-white px-1 py-0.5 text-[11px] uppercase text-gray-700"
                    title="Unidad base"
                  />
                  <button
                    onClick={() => quitarComponente(chip.index)}
                    disabled={componentes.length === 1}
                    className="rounded-full px-1 hover:bg-black/10 disabled:opacity-50"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          {hayInsumosDuplicados && (
            <p className="text-xs text-red-600">
              Tienes insumos repetidos. Debes dejar solo uno por componente.
            </p>
          )}
          {hayInsumoIgualProductoFinal && (
            <p className="text-xs text-red-600">
              El producto final no puede estar en la lista de insumos.
            </p>
          )}
          {componentes.map((item, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <div
                className={
                  item.productoInsumoId &&
                  (insumosDuplicados.has(Number(item.productoInsumoId)) ||
                    (form.productoFinalId &&
                      Number(item.productoInsumoId) === Number(form.productoFinalId)))
                    ? 'rounded-lg ring-2 ring-red-300'
                    : ''
                }
              >
                <Select
                  label={`Insumo #${index + 1}`}
                  name={`insumo-${index}`}
                  options={productoOptions}
                  onChange={onSelectProductoInsumo(index)}
                  isSearch
                  handleGetData={buscarProductos}
                  value={
                    item.productoInsumoId
                      ? productoLabelMap[Number(item.productoInsumoId)] || ''
                      : ''
                  }
                  withLabel
                  error={null}
                />
              </div>
              <InputPro
                name={`cantidadBase-${index}`}
                type="number"
                isLabel
                label="Cantidad base"
                placeholder="Cantidad base"
                value={item.cantidadBase}
                onChange={(e) =>
                  actualizarComponente(index, 'cantidadBase', e.target.value)
                }
              />
              <InputPro
                name={`unidadBase-${index}`}
                isLabel
                label="Unidad base"
                placeholder="GR, ML, UN..."
                value={item.unidadBase}
                onChange={(e) =>
                  actualizarComponente(
                    index,
                    'unidadBase',
                    e.target.value.toUpperCase(),
                  )
                }
              />
              <Button
                onClick={() => quitarComponente(index)}
                color="danger"
                outline
                className="h-fit mt-7"
                disabled={componentes.length === 1}
              >
                Quitar
              </Button>
            </div>
          ))}
        </div>

        <div>
          <Button
            onClick={() => void crearReceta()}
            disabled={guardando || bloqueoFormulario}
            color="success"
            className="text-sm"
          >
            {guardando ? 'Guardando...' : 'Crear receta'}
          </Button>
        </div>
      </div>

      <div className="rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-800">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Recetas registradas
          </h2>
        </div>
        {loading ? (
          <div className="p-4 text-sm text-gray-500">Cargando recetas...</div>
        ) : recetas.length === 0 ? (
          <div className="p-4 text-sm text-gray-500">Aún no hay recetas.</div>
        ) : (
          <div className="overflow-x-auto">
            <DataTable
              bodyData={recetaRows}
              headerColumns={[
                'Código',
                'Nombre',
                'Producto Final',
                'Rendimiento',
                'Componentes',
                'Estado',
              ]}
            />
          </div>
        )}
      </div>
    </div>
  );
}
