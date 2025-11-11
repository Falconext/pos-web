import { useEffect, useState } from 'react';
import { usePagosStore, IPagosState } from '../../../zustand/pagos';
import { Calendar } from '../../../components/Date';
import Input from '../../../components/Input';
import DataTable from '../../../components/Datatable';
import Pagination from '../../../components/Pagination';
import TableSkeleton from '../../../components/Skeletons/table';
import moment from 'moment';
import { Icon } from '@iconify/react';
import { useDebounce } from '@/hooks/useDebounce';
import Select from '@/components/Select';
import PaymentReceipt from '@/components/PaymentReceipt';
import { useAuthStore } from '@/zustand/auth';
import InputPro from '@/components/InputPro';
import { usePaymentFlow } from '@/hooks/usePaymentFlow';

const Pagos = () => {
  const { auth } = useAuthStore();
  const { getAllPagos, pagos, totalPagos, loading, eliminarPago }: IPagosState = usePagosStore();
  const paymentFlow = usePaymentFlow();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [searchTerm, setSearchTerm] = useState('');
  const [fechaInicio, setFechaInicio] = useState(moment().format('YYYY-MM-DD'));
  const [fechaFin, setFechaFin] = useState(moment().format('YYYY-MM-DD'));
  const [medioPago, setMedioPago] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [selectedPago, setSelectedPago] = useState<any>(null);
  const [comprobanteDetalles, setComprobanteDetalles] = useState<any>(null);
  const [loadingDetalles, setLoadingDetalles] = useState(false);

  const debounce = useDebounce(searchTerm, 1000);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const pages = Array.from(
    { length: Math.ceil(totalPagos / itemsPerPage) },
    (_, i) => i + 1
  );

  useEffect(() => {
    const params: any = {
      page: currentPage,
      limit: itemsPerPage,
      search: debounce,
      fechaInicio,
      fechaFin,
    };
    console.log(medioPago)
    if (medioPago) params.medioPago = medioPago;
    getAllPagos(params);
  }, [debounce, currentPage, itemsPerPage, fechaInicio, fechaFin, medioPago]);

  console.log(pagos)

  const pagosTable = pagos?.map((pago) => ({
    id: pago.id,
    fecha: moment(pago.fecha).format('DD/MM/YYYY HH:mm:ss'),
    serie: (pago.comprobante as any)?.serie,
    correlativo: (pago.comprobante as any)?.correlativo,
    comprobanteId: pago.comprobanteId,
    cliente: pago.comprobante?.cliente?.nombre || '',
    monto: `S/ ${pago.monto.toFixed(2)}`,
    medioPago: pago.medioPago,
    observacion: pago.observacion || '-',
    referencia: pago.referencia || '-',
  }));

  const handleDeletePago = (row: any) => {
    if (confirm('¿Estás seguro de eliminar este pago?')) {
      eliminarPago(row.id);
    }
  };

  const handleImprimirRecibo = async (row: any) => {
    console.log(row)
    const original = pagos?.find((p: any) => p.id === row.id);
    if (!original) return;
    
    setSelectedPago(original);
    setLoadingDetalles(true);
    
    try {
      // Usar el comprobanteId del pago para cargar los detalles completos
      const comprobanteId = original.comprobanteId;
      if (comprobanteId) {
        const detalles = await paymentFlow.loadComprobanteDetails(comprobanteId);
        setComprobanteDetalles(detalles?.comprobanteDetails || null);
      }
    } catch (error) {
      console.error('Error cargando detalles del comprobante:', error);
    } finally {
      setLoadingDetalles(false);
      setShowReceipt(true);
    }
  };

  const actions = [
    {
      onClick: handleImprimirRecibo,
      className: 'print',
      icon: <Icon icon="mingcute:print-line" width="20" height="20" color="#3BAED9" />,
      tooltip: 'Imprimir Recibo',
    },
    {
      onClick: handleDeletePago,
      className: 'delete',
      icon: <Icon icon="tabler:trash" width="20" height="20" color="#ff6b6b" />,
      tooltip: 'Eliminar',
    },
  ];

  const handleDate = (date: string, name: string) => {
    if (!moment(date, 'DD/MM/YYYY', true).isValid()) {
      return;
    }
    if (name === 'fechaInicio') {
      setFechaInicio(moment(date, 'DD/MM/YYYY').format('YYYY-MM-DD'));
    } else if (name === 'fechaFin') {
      setFechaFin(moment(date, 'DD/MM/YYYY').format('YYYY-MM-DD'));
    }
  };

  const handleSelect = (idValue: any, value: string) => {
    console.log(idValue)
    console.log(value)
    setMedioPago(value === "TODOS" ? "" : value);
  };

  console.log(selectedPago?.comprobante)

  
  return (
    <div className="px-0 py-0 md:px-8 md:py-4">
      <div className="md:p-10 px-4 pt-0 z-0 md:px-8 bg-white rounded-lg">
        {/* Filtros */}
        <div className="mb-5">
          <div className="grid grid-cols-12 gap-3">
            <div className="md:col-start-1 md:col-end-5 col-span-12">
              <InputPro
                name="search"
                onChange={(e: any) => setSearchTerm(e.target.value)}
                label="Buscar por comprobante o referencia"
                isLabel
              />
            </div>
            <div className="md:col-start-5 md:col-end-13 col-span-12 grid gap-3">
              <div className="md:col-start-1 md:col-end-3 col-span-12">
                <Calendar text="Fecha inicio" name="fechaInicio" onChange={handleDate} />
              </div>
              <div className="md:col-start-3 md:col-end-5 col-span-12">
                <Calendar text="Fecha Fin" name="fechaFin" onChange={handleDate} />
              </div>
              <div className="md:col-start-5 md:col-end-7 col-span-12">
                <Select
                  error={''}
                  label="Medio de pago"
                  name="medioPago"
                  onChange={handleSelect}
                  options={[
                    { value: 'TODOS', label: 'Todos los medios' },
                    { value: 'EFECTIVO', label: 'Efectivo' },
                    { value: 'YAPE', label: 'Yape' },
                    { value: 'PLIN', label: 'Plin' },
                    { value: 'TRANSFERENCIA', label: 'Transferencia' },
                    { value: 'TARJETA', label: 'Tarjeta' },
                  ]}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="w-full">
          {pagosTable?.length > 0 ? (
            <>
              <div className="overflow-hidden overflow-x-scroll md:overflow-x-visible">
                <DataTable
                  actions={actions}
                  bodyData={pagosTable}
                  headerColumns={[
                    'Fecha',
                    'Serie',
                    'Nro.',
                    'Cliente',
                    'Monto',
                    'Medio Pago',
                    'Observación',
                    'Referencia',
                  ]}
                />
              </div>

              <Pagination
                data={pagosTable}
                optionSelect
                currentPage={currentPage}
                indexOfFirstItem={indexOfFirstItem}
                indexOfLastItem={indexOfLastItem}
                setcurrentPage={setCurrentPage}
                setitemsPerPage={setItemsPerPage}
                pages={pages}
                total={totalPagos}
              />
            </>
          ) : (
            <TableSkeleton arrayData={pagosTable} />
          )}
        </div>
        {showReceipt && selectedPago && (
          <PaymentReceipt
            saldo={selectedPago.comprobante?.saldo}
            comprobante={comprobanteDetalles || selectedPago.comprobante}
            payment={{
              tipo: 'PAGO_PARCIAL',
              monto: selectedPago.monto,
              medioPago: selectedPago.medioPago,
              observacion: selectedPago.observacion,
              referencia: selectedPago.referencia,
            }}
            numeroRecibo={`REC-${selectedPago.id}`}
            nuevoSaldo={0} // Ya procesado
            detalles={comprobanteDetalles?.detalles || []}
            cliente={comprobanteDetalles?.cliente || selectedPago.comprobante?.cliente}
            company={auth}
            onClose={() => {
              setShowReceipt(false);
              setSelectedPago(null);
              setComprobanteDetalles(null);
            }}
          />
        )}
        
        {loadingDetalles && (
          <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-gray-700">Cargando detalles del comprobante...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Pagos;
