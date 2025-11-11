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
    <div className="p-6 px-8 pt-0">
      <div className="flex items-center justify-between mb-6">
        <div>
        </div>
        <div className="flex gap-3" />
      </div>

      {/* Filtros */}
      <div className="mb-4 p-4 bg-white rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
              label="Producto"
              isLabel
              value={productQuery}
              onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                const val = (e.target as HTMLInputElement).value;
                setProductQuery(val);
                if (val === '') {
                  handleFilterChange('productoId', '');
                }
              }}
              placeholder="Buscar producto por nombre o código"
              onClick={() => {
                if (debouncedProductQuery && debouncedProductQuery.trim().length >= 2) setShowSuggestions(true);
              }}
              handleOnBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            />
            {showSuggestions && products && products.length > 0 && (
              <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                {products.map((p: any) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setProductQuery(`${p.codigo} - ${p.descripcion}`);
                      handleFilterChange('productoId', String(p.id));
                      setShowSuggestions(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                  >
                    <div className="font-medium text-gray-800">{p.descripcion}</div>
                    <div className="text-xs text-gray-500">{p.codigo} • UM: {p?.unidadMedida?.nombre}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-3">
          <Button onClick={clearFilters} color="secondary">Limpiar</Button>
          <Button onClick={applyFilters}>Aplicar</Button>
        </div>
      </div>

      {/* Tabla de movimientos */}
      <div className="md:p-2 md:pt-4 px-4 pt-0 z-0 md:px-8 bg-[#fff] rounded-lg">


        <div className="w-full">

          {
            movimientosTable?.length > 0 ? (
              <>
                <div className="overflow-hidden overflow-x-scroll md:overflow-x-visible">
                  <DataTable actions={actions} bodyData={movimientosTable}
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
                    ]} />
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
              <TableSkeleton arrayData={movimientosTable} />
            )
          }
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