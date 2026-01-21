import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { PaymentType } from '@/hooks/usePaymentFlow';
import Button from './Button';
import { Icon } from '@iconify/react';

interface IPaymentReceiptProps {
  comprobante: any;
  payment: {
    tipo: PaymentType;
    monto: number;
    medioPago: string;
    observacion?: string;
    referencia?: string;
  };
  numeroRecibo: string;
  saldo: any;
  nuevoSaldo: number;
  company: any;
  detalles?: any[];
  cliente?: any;
  pagosHistorial?: any[];
  totalPagado?: number;
  comprobanteDetails?: any;
  onClose?: () => void;
  onPrint?: () => void;
}

const PaymentReceipt = ({
  comprobante,
  saldo,
  payment,
  numeroRecibo,
  nuevoSaldo,
  company,
  detalles,
  cliente,
  onClose,
  onPrint,
}: IPaymentReceiptProps) => {
  const componentRef = useRef(null);

  // Manejar diferentes formatos de logo
  const logoRaw = company?.empresa?.logo;
  const logoDataUrl = logoRaw
    ? (logoRaw.startsWith('data:image') ? logoRaw : `data:image/png;base64,${logoRaw}`)
    : '';

  // Obtener RUC de diferentes propiedades posibles
  const empresaRuc = company?.empresa?.ruc || company?.empresa?.nroDoc || '';

  const fechaActual = new Date();
  const horaActual = fechaActual.toLocaleTimeString();
  const fechaFormato = fechaActual.toLocaleDateString();

  const printFn = useReactToPrint({
    // @ts-ignore
    contentRef: componentRef,
    pageStyle: `@media print {
      @page {
        size: 80mm 297mm;
        margin: 0;
      }
      body {
        width: 80mm;
        height: 297mm;
        overflow: hidden;
      }
      .p-5 {
        width: 100%;
        height: 100%;
        box-sizing: border-box;
      }
    }`,
  });

  const getTitleByType = () => {
    switch (payment.tipo) {
      case 'ADELANTO':
        return 'RECIBO DE ADELANTO';
      case 'PAGO_PARCIAL':
        return 'RECIBO DE PAGO PARCIAL';
      case 'PAGO_TOTAL':
        return 'RECIBO DE PAGO TOTAL';
      default:
        return 'RECIBO DE PAGO';
    }
  };

  const getStatusMessage = () => {
    if (payment.tipo === 'ADELANTO') {
      return `Se ha registrado un adelanto de S/ ${payment.monto.toFixed(2)}`;
    } else if (payment.tipo === 'PAGO_TOTAL') {
      return 'Comprobante pagado en su totalidad';
    } else {
      return `Pago parcial registrado. ${nuevoSaldo > 0 ? `Saldo pendiente: S/ ${nuevoSaldo.toFixed(2)}` : 'Comprobante pagado en su totalidad'}`;
    }
  };

  const handlePrint = () => {
    printFn();
    onPrint?.();
  };


  console.log("ESTE ES EL COMPROBANTE", comprobante)

  console.log("EL SALDO", saldo)

  console.log(comprobante?.data?.serie)
  console.log(company)
  console.log(comprobante?.data?.correlativo)
  console.log(detalles)
  console.log("nuevoSaldo", nuevoSaldo)
  return (
    <>
      <div className="hidden">
        <div
          ref={componentRef}
          className="print-area p-5 text-sm"
          style={{
            fontFamily: 'VT323, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            lineHeight: 1.2,
            letterSpacing: '0.2px'
          }}
        >
          <div>
            {logoDataUrl && <img src={logoDataUrl} alt="logo" className="mx-auto w-16 h-16" style={{ filter: 'grayscale(100%)' }} />}
            <h2 className="text-center text-[18px] mt-3">{company?.empresa?.nombreComercial?.toUpperCase()}</h2>
            <p className="text-center text-[18px]">
              RAZON SOCIAL: {company?.empresa?.razonSocial?.toUpperCase()}<br />
              DIRECCION: {company?.empresa?.direccion?.toUpperCase()}<br />
              RUC: {empresaRuc}
            </p>
            <hr className="my-1 border-dashed border-[#222]" />

            <h2 className="text-center text-[18px]">{getTitleByType()}</h2>
            <hr className="my-1 border-dashed border-[#222]" />

            <div className="text-center text-[18px] mb-2">
              <p><span className="">Recibo Nro:</span> {numeroRecibo}</p>
              <p><span className="">Fecha:</span> {fechaFormato} {horaActual}</p>
            </div>
            <hr className="my-1 border-dashed border-[#222]" />

            <div className="text-[18px] mb-2">
              <p><span className="">Comprobante Original:</span></p>
              <p className="">Serie - Nro: {comprobante?.serie || comprobante?.data?.serie}-{comprobante?.correlativo || comprobante?.data?.correlativo}</p>
              <p className="capitalize">Cliente: {(cliente || comprobante?.cliente?.toLowerCase() || comprobante?.data?.cliente)?.nombre?.toLowerCase()}</p>
              <p className="">RUC/DNI: {(comprobante?.data?.cliente)?.nroDoc}</p>
            </div>
            <hr className="my-1 border-dashed border-[#222]" />

            {/* Productos/Servicios */}
            <div className="">
              <div className="flex text-center">
                <span className="w-1/5 text-[18px]">Cant.</span>
                <span className="w-3/5 text-[18px]">Descripción</span>
                <span className="w-1/5 text-[18px]">P.U.</span>
                <span className="w-1/5 text-[18px]">Importe</span>
              </div>
              {(detalles || comprobante?.data?.detalles || comprobante?.detalles)?.map((item: any, i: any) => (
                <div key={i} className="flex flex-col mb-1">
                  <div className="flex">
                    <span className="w-1/5 text-[18px] text-center">{item?.cantidad || 0}</span>
                    <span className="w-3/5 text-[18px] text-left capitalize">{item?.descripcion?.toLowerCase() || ''}</span>
                    <span className="w-1/5 text-[18px] text-left">{Number(item?.mtoPrecioUnitario || item?.mtoValorUnitario || 0).toFixed(2)}</span>
                    <span className="w-1/5 text-[18px] text-right">{Number((item?.mtoPrecioUnitario || 0) * (item?.cantidad || 1)).toFixed(2)}</span>
                  </div>
                  {/* Mostrar Lote y Vencimiento si existen */}
                  {(item?.lotes && Array.isArray(item.lotes) && item.lotes.length > 0) ? (
                    item.lotes.map((lote: any, lIdx: number) => (
                      <div key={lIdx} className="text-left w-full pl-8 text-[16px]">
                        LOTE: {lote.lote} | VENC: {new Date(lote.fechaVencimiento).toLocaleDateString('es-PE')}
                      </div>
                    ))
                  ) : item?.lote ? (
                    <div className="text-left w-full pl-8 text-[16px]">
                      LOTE: {item.lote} {item.fechaVencimiento ? `| VENC: ${new Date(item.fechaVencimiento).toLocaleDateString('es-PE')}` : ''}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
            <hr className="my-1 border-dashed border-[#222]" />
            <div className="text-[18px] mb-2">
              <p className="flex justify-between">
                <span className="">Total Comprobante:</span>
                <span className="">S/ {Number(comprobante?.mtoImpVenta > 0 ? comprobante?.mtoImpVenta : comprobante?.data?.mtoImpVenta || 0).toFixed(2)}</span>
              </p>
              {/* {totalPagado !== undefined && (
                <p className="flex justify-between">
                  <span className="">Total Pagado Anteriormente:</span>
                  <span>S/ {Number(totalPagado - payment.monto).toFixed(2)}</span>
                </p>
              )} */}
              <p className="flex justify-between">
                <span className="">
                  {payment.tipo === 'ADELANTO' ? 'Saldo Antes de Adelanto:' : 'Saldo Anterior:'}
                </span>
                <span>S/ {Number(nuevoSaldo + payment.monto).toFixed(2)}</span>
              </p>
            </div>
            <hr className="my-1 border-dashed border-[#222]" />

            <div className="text-[18px] mb-2">
              <p className="flex justify-between  text-sm bg-gray-100">
                <span className="text-[18px]">{payment.tipo === 'ADELANTO' ? 'Adelanto:' : 'Monto Pagado:'}</span>
                <span className="text-[18px]">S/ {Number(payment.monto).toFixed(2)}</span>
              </p>
              <p className="flex justify-between mt-1">
                <span className="">Método de Pago:</span>
                <span>{payment.medioPago?.toUpperCase()}</span>
              </p>
              {payment.referencia && (
                <p className="flex justify-between mt-1">
                  <span className="">{payment.medioPago === 'Tarjeta' ? 'N° Operación:' : 'Referencia:'}:</span>
                  <span>{payment.referencia}</span>
                </p>
              )}
              {payment.observacion && (
                <div className="mt-1">
                  <p className="">Observación:</p>
                  <p className="text-[18px]">{payment.observacion}</p>
                </div>
              )}
            </div>
            <hr className="my-1 border-dashed border-[#222]" />

            <div className="text-[18px]">
              <p className="text-center ">
                {payment.tipo === 'ADELANTO' ? 'Nuevo Saldo a Pagar:' : 'Nuevo Saldo Pendiente:'}
              </p>
              <p className="text-center text-md ">
                S/ {Number(nuevoSaldo ?? 0).toFixed(2)}
              </p>
            </div>

            <hr className="my-1 border-dashed border-[#222]" />
            <p className="text-[18px] text-center mt-4">
              Sistema punto de venta - FalcoNext.<br />
              Desarrollado por FalcoNext.<br />
              www.falconext.pe.
            </p>
            <hr className="my-1 border-dashed border-[#222]" />
            <p className="text-[18px] text-center">
              GRACIAS POR SU COMPRA, VUELVA PRONTO !
            </p>
          </div>
        </div>
      </div>

      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
          {/* Header del Modal */}
          <div className="bg-[#111] p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Icon icon="solar:check-circle-bold" className="text-2xl text-green-400" width="24" height="24" />
              </div>
              <div>
                <h3 className="font-bold">Pago Registrado</h3>
                <p className="text-[18px] text-white/70">{getTitleByType()}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white">
              <Icon icon="mdi:close" width="20" height="20" />
            </button>
          </div>

          {/* Contenido del Recibo */}
          <div className="p-5">
            {/* Logo de empresa */}
            {logoDataUrl && (
              <div className="text-center mb-4">
                <img src={logoDataUrl} alt="logo" className="mx-auto w-14 h-14 object-contain" />
              </div>
            )}

            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Comprobante:</span>
                  <span className="font-bold">{comprobante?.serie || comprobante?.data?.serie}-{comprobante?.correlativo || comprobante?.data?.correlativo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Cliente:</span>
                  <span className="font-medium">{(cliente || comprobante?.cliente || comprobante?.data?.cliente)?.nombre}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Comprobante:</span>
                  <span className="font-medium">S/ {(comprobante?.data?.mtoImpVenta || comprobante?.mtoImpVenta)?.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Monto Pagado */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-green-800 font-medium">Monto Pagado:</span>
                <span className="text-green-800 font-bold text-xl">S/ {payment.monto?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-green-700">Método:</span>
                <span className="text-green-800 font-medium">{payment.medioPago?.toUpperCase()}</span>
              </div>
            </div>

            {/* Nuevo Saldo */}
            <div className={`text-center p-4 rounded-xl ${nuevoSaldo > 0 ? 'bg-orange-50 border border-orange-200' : 'bg-emerald-50 border border-emerald-200'}`}>
              <p className="text-[18px] text-gray-500 mb-1">Nuevo Saldo Pendiente</p>
              <p className={`text-2xl font-black ${nuevoSaldo > 0 ? 'text-orange-600' : 'text-emerald-600'}`}>
                S/ {Number(nuevoSaldo ?? 0).toFixed(2)}
              </p>
              {nuevoSaldo === 0 && (
                <p className="text-[18px] text-emerald-600 mt-1 flex items-center justify-center gap-1">
                  <Icon icon="solar:check-circle-bold" width="14" height="14" />
                  Comprobante pagado en su totalidad
                </p>
              )}
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="p-4 border-t border-gray-100 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Cerrar
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 px-4 py-2.5 bg-[#111] text-white rounded-lg hover:bg-[#333] transition-colors font-medium flex items-center justify-center gap-2"
            >
              <Icon icon="solar:printer-bold" width="18" height="18" />
              Imprimir Ticket
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default PaymentReceipt;
