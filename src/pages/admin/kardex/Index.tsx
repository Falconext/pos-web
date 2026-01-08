import React, { useState, useEffect, ChangeEvent } from 'react';
import Button from '../../../components/Button';
import Select from '../../../components/Select';
import Loading from '../../../components/Loading';
import Pagination from '../../../components/Pagination';
import Modal from '../../../components/Modal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Icon } from '@iconify/react';
import InputPro from '@/components/InputPro';
import { Calendar } from '@/components/Date';
import { useKardexStore } from '@/zustand/kardex';
import DataTable from '@/components/Datatable';
import { useDebounce } from '@/hooks/useDebounce';
import { useProductsStore } from '@/zustand/products';
import useAlertStore from '@/zustand/alert';
import moment from 'moment';
import TableSkeleton from '@/components/Skeletons/table';

interface MovimientoKardex {
  id: number;
  fecha: string | Date;
  tipoMovimiento: 'INGRESO' | 'SALIDA' | 'AJUSTE' | 'TRANSFERENCIA';
  concepto: string;
  cantidad: number;
  stockAnterior: number;
  gananciaUnidad?: number;
  stockActual: number;
  precioUnitario?: number;
  costoUnitario?: any;
  valorTotal?: number;
  observacion?: string;
  lote?: string;
  fechaVencimiento?: string | Date;
  usuario?: {
    id: number;
    nombre: string;
  };
  comprobante?: {
    id: number;
    tipoDoc: string;
    serie: string;
    correlativo: number;
  };
  producto: {
    id: number;
    codigo: string;
    descripcion: string;
    unidadMedida: {
      codigo: string;
      nombre: string;
    };
  };
}

interface KardexResponse {
  movimientos: MovimientoKardex[];
  paginacion: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const TIPOS_MOVIMIENTO = [
  { value: '', label: 'Todos los movimientos' },
  { value: 'INGRESO', label: 'Ingresos' },
  { value: 'SALIDA', label: 'Salidas' },
  { value: 'AJUSTE', label: 'Ajustes' },
  { value: 'TRANSFERENCIA', label: 'Transferencias' },
];

const KardexIndex: React.FC = () => {
  const { kardex, loading, getKardex } = useKardexStore();
  const { getAllProducts, products } = useProductsStore();
  const { alert } = useAlertStore();

  // Inicializar con fechas por defecto (tiempo local): hoy para ambas fechas
  const todayStr = moment().format('YYYY-MM-DD'); // evita desfase por UTC

  const [filters, setFilters] = useState({
    fechaInicio: todayStr,
    fechaFin: todayStr,
    productoId: '',
    tipoMovimiento: '',
  });

  console.log(filters)

  const [productQuery, setProductQuery] = useState('');
  const debouncedProductQuery = useDebounce(productQuery, 400);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedMovimiento, setSelectedMovimiento] = useState<MovimientoKardex | null>(null);
  const [currentPage, setcurrentPage] = useState(1);
  const [itemsPerPage, setitemsPerPage] = useState(50);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const pages = [];
  for (let i = 1; i <= Math.ceil(kardex?.paginacion?.total / itemsPerPage); i++) {
    pages.push(i);
  }

  useEffect(() => {
    getKardex({ page: currentPage, limit: itemsPerPage, ...filters });
  }, [currentPage, itemsPerPage]);

  // Auto-aplicar filtros cuando cambien (fecha inicio/fin, tipo, producto)
  useEffect(() => {
    // Validación de rango de fechas
    if (filters.fechaInicio && filters.fechaFin) {
      const start = new Date(filters.fechaInicio);
      const end = new Date(filters.fechaFin);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start > end) {
        alert('La fecha inicio no puede ser mayor que la fecha fin', 'error');
        return;
      }
    }
    // Reiniciar a primera página y cargar
    setcurrentPage(1);
    getKardex({ page: 1, limit: itemsPerPage, ...filters });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.fechaInicio, filters.fechaFin, filters.tipoMovimiento, filters.productoId]);

  // Buscar productos con debounce
  useEffect(() => {
    if (debouncedProductQuery && debouncedProductQuery.trim().length >= 2) {
      getAllProducts({ page: 1, limit: 10, search: debouncedProductQuery });
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [debouncedProductQuery, getAllProducts]);

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const applyFilters = () => {
    setcurrentPage(1);
    getKardex({ page: 1, limit: itemsPerPage, ...filters });
  };

  const clearFilters = () => {
    const cleared = {
      fechaInicio: todayStr,
      fechaFin: todayStr,
      productoId: '',
      tipoMovimiento: '',
    };
    setFilters(cleared);
    setProductQuery('');
    setcurrentPage(1);
    getKardex({ page: 1, limit: itemsPerPage, ...cleared });
  };


  const getTipoMovimientoColor = (tipo: string) => {
    switch (tipo) {
      case 'INGRESO':
        return 'text-green-600 bg-green-100';
      case 'SALIDA':
        return 'text-red-600 bg-red-100';
      case 'AJUSTE':
        return 'text-blue-600 bg-blue-100';
      case 'TRANSFERENCIA':
        return 'text-purple-600 bg-purple-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateString: string | Date | null | undefined) => {
    if (!dateString) return '-';
    try {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      if (isNaN(date.getTime())) return '-';
      return format(date, 'dd/MM/yyyy HH:mm', { locale: es });
    } catch (error) {
      return '-';
    }
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
    }).format(amount);
  };

  if (loading && !kardex) {
    return <Loading />;
  }

  console.log(kardex?.movimientos)
  console.log(kardex?.paginacion)

  const movimientosTable: any = kardex?.movimientos?.map((item: MovimientoKardex) => {
    return {
      fecha: formatDate(item.fecha),
      producto: item.producto.descripcion,
      tipo: item.tipoMovimiento,
      concepto: item.concepto,
      cantidad: item.cantidad,
      stockAnterior: item.stockAnterior,
      stockActual: item.stockActual < 0 ? 0 : item.stockActual,
      costoUnitario: formatCurrency(item.costoUnitario),
      precioUnitario: formatCurrency(item.costoUnitario + item.gananciaUnidad),
      gananciaUnidad: formatCurrency(item.gananciaUnidad),
    };
  });

  const handleAbrirModal = (data: MovimientoKardex) => {
    setSelectedMovimiento(data);
  };



  const actions: any = [
    {
      onClick: handleAbrirModal,
      className: "edit",
      icon: <Icon color="#66AD78" icon="material-symbols:edit" />,
      tooltip: "Editar"
    }
  ];

  const handleDate = (date: string, name: string) => {
    if (!moment(date, 'DD/MM/YYYY', true).isValid()) return;
    if (name === 'fechaInicio') {
      setFilters(prev => ({ ...prev, fechaInicio: moment(date, 'DD/MM/YYYY').format('YYYY-MM-DD') }));
    } else if (name === 'fechaFin') {
      setFilters(prev => ({ ...prev, fechaFin: moment(date, 'DD/MM/YYYY').format('YYYY-MM-DD') }));
    }
  };

  return (
    <div className="min-h-screen px-2 pb-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Movimientos de Kardex</h1>
          <p className="text-sm text-gray-500 mt-1">Control de entradas, salidas y ajustes de inventario</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-6 p-5 bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <Icon icon="solar:filter-bold-duotone" className="text-blue-600 text-xl" />
          <h3 className="font-semibold text-gray-800">Filtros</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Calendar
              text="Fecha Inicio"
              name="fechaInicio"
              onChange={handleDate}
              isLabel
              value={moment(filters.fechaInicio, 'YYYY-MM-DD').format('DD/MM/YYYY')}
            />
          </div>
          <div>
            <Calendar
              text="Fecha Fin"
              name="fechaFin"
              onChange={handleDate}
              isLabel
              value={moment(filters.fechaFin, 'YYYY-MM-DD').format('DD/MM/YYYY')}
            />
          </div>
          <div>
            <Select
              name="tipoMovimiento"
              label="Tipo de Movimiento"
              error={""}
              value={filters.tipoMovimiento}
              onChange={(id) => handleFilterChange('tipoMovimiento', String(id))}
              options={[
                { id: '', value: 'Todos' },
                { id: 'INGRESO', value: 'Ingresos' },
                { id: 'SALIDA', value: 'Salidas' },
                { id: 'AJUSTE', value: 'Ajustes' },
                { id: 'TRANSFERENCIA', value: 'Transferencias' },
              ]}
              withLabel
            />
          </div>
          <div className="relative">
            <InputPro
              name="productoSearch"
              label="Buscar Producto"
              isLabel
              value={productQuery}
              onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                const val = (e.target as HTMLInputElement).value;
                setProductQuery(val);
                if (val === '') {
                  handleFilterChange('productoId', '');
                }
              }}
              placeholder="Nombre o código..."
              onClick={() => {
                if (debouncedProductQuery && debouncedProductQuery.trim().length >= 2) setShowSuggestions(true);
              }}
              handleOnBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            />
            {showSuggestions && products && products.length > 0 && (
              <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
                {products.map((p: any) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setProductQuery(`${p.codigo} - ${p.descripcion}`);
                      handleFilterChange('productoId', String(p.id));
                      setShowSuggestions(false);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-blue-50 text-sm border-b border-gray-50 last:border-b-0 transition-colors"
                  >
                    <div className="font-medium text-gray-800">{p.descripcion}</div>
                    <div className="text-xs text-gray-500">{p.codigo} • {p?.unidadMedida?.nombre}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
          <Button onClick={clearFilters} color="secondary">
            <Icon icon="solar:refresh-linear" className="mr-1" /> Limpiar
          </Button>
          <Button onClick={applyFilters}>
            <Icon icon="solar:magnifer-linear" className="mr-1" /> Buscar
          </Button>
        </div>
      </div>

      {/* Tabla de movimientos */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon icon="solar:document-text-bold-duotone" className="text-blue-600 text-xl" />
            <h3 className="font-semibold text-gray-800">Historial de Movimientos</h3>
          </div>
          <span className="text-sm text-gray-500">
            {kardex?.paginacion?.total || 0} registros encontrados
          </span>
        </div>

        <div className="p-4">
          {movimientosTable?.length > 0 ? (
            <>
              <div className="overflow-hidden overflow-x-auto">
                <DataTable
                  actions={actions}
                  bodyData={movimientosTable}
                  headerColumns={[
                    'Fecha',
                    'Producto',
                    'Tipo',
                    'Concepto',
                    'Cantidad',
                    'Stock Anterior',
                    'Stock Actual',
                    'Costo Unitario',
                    'Precio Unitario',
                    'Ganancia/Unidad'
                  ]}
                />
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <Pagination
                  data={movimientosTable}
                  optionSelect
                  currentPage={currentPage}
                  indexOfFirstItem={indexOfFirstItem}
                  indexOfLastItem={indexOfLastItem}
                  setcurrentPage={setcurrentPage}
                  setitemsPerPage={setitemsPerPage}
                  pages={pages}
                  total={kardex?.paginacion?.total}
                />
              </div>
            </>
          ) : (
            <div className="py-12 text-center">
              <Icon icon="solar:box-linear" className="text-5xl text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No se encontraron movimientos</p>
              <p className="text-sm text-gray-400 mt-1">Ajusta los filtros o selecciona un rango de fechas diferente</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Detalle */}
      <Modal
        isOpenModal={!!selectedMovimiento}
        closeModal={() => setSelectedMovimiento(null)}
        title="Detalle del Movimiento"
      >
        {selectedMovimiento && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Fecha</label>
                <p className="text-sm text-gray-900">{formatDate(selectedMovimiento.fecha)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tipo</label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTipoMovimientoColor(selectedMovimiento.tipoMovimiento)}`}>
                  {selectedMovimiento.tipoMovimiento}
                </span>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">Producto</label>
                <p className="text-sm text-gray-900">
                  {selectedMovimiento.producto.codigo} - {selectedMovimiento.producto.descripcion}
                </p>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">Concepto</label>
                <p className="text-sm text-gray-900">{selectedMovimiento.concepto}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Cantidad</label>
                <p className="text-sm text-gray-900">{selectedMovimiento.cantidad} {selectedMovimiento.producto.unidadMedida.codigo}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Costo Unitario</label>
                <p className="text-sm text-gray-900">{formatCurrency(selectedMovimiento.costoUnitario)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Stock Anterior</label>
                <p className="text-sm text-gray-900">{selectedMovimiento.stockAnterior}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Stock Actual</label>
                <p className="text-sm font-medium text-gray-900">{selectedMovimiento.stockActual}</p>
              </div>
              {selectedMovimiento.valorTotal && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Valor Total</label>
                  <p className="text-sm font-medium text-gray-900">{formatCurrency(selectedMovimiento.valorTotal)}</p>
                </div>
              )}
              {selectedMovimiento.usuario && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Usuario</label>
                  <p className="text-sm text-gray-900">{selectedMovimiento.usuario.nombre}</p>
                </div>
              )}
              {selectedMovimiento.comprobante && (
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Comprobante</label>
                  <p className="text-sm text-gray-900">
                    {selectedMovimiento.comprobante.tipoDoc} {selectedMovimiento.comprobante.serie}-{selectedMovimiento.comprobante.correlativo}
                  </p>
                </div>
              )}
              {selectedMovimiento.observacion && (
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Observación</label>
                  <p className="text-sm text-gray-900">{selectedMovimiento.observacion}</p>
                </div>
              )}
              {selectedMovimiento.lote && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Lote</label>
                  <p className="text-sm text-gray-900">{selectedMovimiento.lote}</p>
                </div>
              )}
              {selectedMovimiento.fechaVencimiento && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fecha Vencimiento</label>
                  <p className="text-sm text-gray-900">{formatDate(selectedMovimiento.fechaVencimiento)}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default KardexIndex;