import moment from 'moment';
import React, { useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { BRAND } from '@/lib/branding';

const ComprobantePrintPage = ({
    productsInvoice,
    totalInWords,
    qrCodeDataUrl,
    componentRef,
    observation,
    company,
    formValues,
    mode,
    total,
    receipt,
    selectedClient,
    discount,
    printFn,
    size,
    includeProductImages = false,
    quotationDiscount = 0,
    quotationValidity = 7,
    quotationSignature = '',
    quotationTerms = '',
    quotationPaymentType = 'CONTADO',
    quotationAdvance = 0,
    retencionData = null
}: any) => {


    const localComponentRef = useRef(null);

    useEffect(() => {
        // Force re-render or update logic if needed
        // This ensures the component updates when props change
    }, [productsInvoice, totalInWords, qrCodeDataUrl, observation, company, formValues, mode, total, receipt, selectedClient, discount, size, includeProductImages, quotationDiscount, quotationValidity, quotationSignature, retencionData]);

    const totalReceipt = productsInvoice?.reduce((sum: any, p: any) => sum + Number(p.total || p.mtoPrecioUnitario * p.cantidad || 0), 0);
    const totalPrices = productsInvoice?.reduce((sum: any, p: any) => sum + (Number(p.precioUnitario || p.mtoPrecioUnitario || 0) * (p.cantidad || 0)), 0);

    const round2 = (n: any) => parseFloat(n?.toFixed(2)) || 0;
    const parseAmount = (value: any, fallback = 0): number => {
        if (value === null || value === undefined || value === '') return fallback;
        if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
        const normalized = String(value).replace(/\s/g, '').replace(',', '.');
        const parsed = Number(normalized);
        return Number.isFinite(parsed) ? parsed : fallback;
    };
    const formatCantidad = (value: any): string => {
        const cantidad = parseAmount(value, 0);
        if (Number.isInteger(cantidad)) return String(cantidad);
        return cantidad.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
    };

    console.log(formValues)
    console.log(company)
    const rawBase64 = company?.empresa?.logo;
    const logoDataUrl = (() => {
        if (!rawBase64) return undefined;
        const t = rawBase64.trim();
        if (t.startsWith('data:')) return t;
        if (/^https?:\/\//i.test(t) || t.startsWith('/')) return t;
        return `data:${t.startsWith('/9j/') ? 'image/jpeg' : 'image/png'};base64,${t}`;
    })();

    // Fallback: Detect retention from observation if data prop is missing
    const hasRetentionText = observation?.toUpperCase().includes("RETENCIÓN") && observation?.toUpperCase().includes("3%");
    const calculatedRetention = hasRetentionText ? Number((Number(total) * 0.03).toFixed(2)) : 0;

    const displayRetencionMonto = retencionData ? Number(retencionData.montoDetraccion || 0) : calculatedRetention;
    const shouldShowRetention = retencionData || (hasRetentionText && calculatedRetention > 0);
    const isDocumentoFiscal = ['01', '03', '07', '08'].includes(String(formValues?.tipoDoc || ''));
    const explicitDiscount = parseAmount(
        formValues?.mtoDescuentoGlobal ??
        formValues?.totalDescuentos ??
        discount,
        0
    );
    const netTotalFallback = Math.max(0, totalReceipt - explicitDiscount);
    const totalDescuentos = parseAmount(
        formValues?.totalDescuentos ??
        formValues?.mtoDescuentos ??
        formValues?.mtoDescuentoGlobal ??
        discount ??
        (totalPrices > totalReceipt ? totalPrices - totalReceipt : 0)
    );
    const mtoOperGravadas = parseAmount(formValues?.mtoOperGravadas, netTotalFallback / 1.18);
    const mtoOperGratuitas = parseAmount(formValues?.mtoOperGratuitas, 0);
    const mtoOperInafectas = parseAmount(formValues?.mtoOperInafectas, 0);
    const mtoOperExoneradas = parseAmount(formValues?.mtoOperExoneradas, 0);
    const mtoIcbper = parseAmount(formValues?.icbper ?? formValues?.mtoIcbper, 0);
    const mtoIgv = parseAmount(formValues?.mtoIGV, netTotalFallback - (netTotalFallback / 1.18));
    const mtoImpVenta = parseAmount(formValues?.mtoImpVenta, netTotalFallback);
    const displayVuelto = parseAmount(formValues?.vuelto, 0);
    const splitPaidTotal = formValues?.medioPago?.toUpperCase() === 'MIXTO' && Array.isArray(formValues?.splitPayments)
        ? formValues.splitPayments.reduce((sum: number, sp: { amount: number }) => sum + parseAmount(sp.amount, 0), 0)
        : 0;
    const displayPagado = splitPaidTotal > 0 ? splitPaidTotal : mtoImpVenta + displayVuelto;
    const paymentDetails = formValues?.paymentDetails || {};
    const splitPaymentDetails = Array.isArray(paymentDetails?.splitPayments)
        ? paymentDetails.splitPayments
        : (Array.isArray(formValues?.splitPayments) ? formValues.splitPayments : []);
    const singlePaymentDetail = paymentDetails?.mode === 'SIMPLE' ? paymentDetails : {
        method: formValues?.medioPago,
        amount: mtoImpVenta,
        referencia: paymentDetails?.referencia,
        cuentaBancariaLabel: paymentDetails?.cuentaBancariaLabel,
        tarjetaTipo: paymentDetails?.tarjetaTipo,
        tarjetaMarca: paymentDetails?.tarjetaMarca,
        tarjetaUltimos4: paymentDetails?.tarjetaUltimos4,
    };
    const formatPaymentExtra = (payment: any) => {
        const extras = [];
        if (payment?.cuentaBancariaLabel) extras.push(`Cuenta: ${payment.cuentaBancariaLabel}`);
        if (payment?.referencia) extras.push(`Op/Voucher: ${payment.referencia}`);
        const method = (payment?.method || '').toUpperCase();
        if (method === 'TARJETA') {
            const tarjeta = [payment?.tarjetaMarca, payment?.tarjetaTipo, payment?.tarjetaUltimos4 ? `****${payment.tarjetaUltimos4}` : ''].filter(Boolean).join(' ');
            if (tarjeta) extras.push(`Tarjeta: ${tarjeta}`);
        }
        return extras;
    };
    const vendedorNombre = (formValues?.vendedor || company?.nombre || 'ADMIN').toString().toUpperCase();
    const empresaNumero = (
        company?.empresa?.celular ||
        company?.empresa?.telefono ||
        company?.celular ||
        company?.telefono ||
        ''
    ).toString().trim();

    console.log(formValues)

    const isScreenHidden = mode === 'off';

    return (
        <div
            id="print-root"
            aria-hidden={isScreenHidden}
            className={isScreenHidden ? 'pointer-events-none opacity-0 fixed -left-[200vw] top-0 z-[-1]' : 'bg-[#fff]'}
        >
            <div
                ref={componentRef || localComponentRef}
                className={`bg-[#fff] py-0 text-sm ${size === 'TICKET' ? 'px-4 pt-3 pb-2' : 'px-5 pt-5 pb-10'}`}
                style={{
                    width: size === 'TICKET' ? '80mm' : (size === 'A5' ? '148mm' : '210mm'),
                    margin: '0 auto',
                    minHeight: size === 'TICKET' ? '330mm' : (size === 'A5' ? '210mm' : '297mm'),
                    fontFamily:
                        size === 'TICKET'
                            ? 'VT323, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
                            : 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                    lineHeight: size === 'TICKET' ? 1.05 : undefined,
                    letterSpacing: size === 'TICKET' ? '0.1px' : undefined
                }}
            >
                {size === 'TICKET' ? (
                    <div className="">
                        {logoDataUrl && <img src={logoDataUrl} alt="logo" className="mx-auto mb-1 object-contain" style={{ maxWidth: company?.empresa?.ticketLogoSize ?? 96, maxHeight: company?.empresa?.ticketLogoSize ?? 96, width: '100%', height: 'auto', objectFit: 'contain', display: 'block', margin: '0 auto 4px' }} />}
                        <p className={`text-center ${size === 'TICKET' ? 'text-[16px]' : 'text-xs'}`}>
                            RAZON SOCIAL: {company?.empresa?.razonSocial?.toUpperCase()}<br />
                            DIRECCION: {company?.empresa?.direccion?.toUpperCase()}<br />
                            {empresaNumero && <>CELULAR: {empresaNumero}<br /></>}
                            <span className="">RUC: {company?.empresa?.ruc}</span>
                        </p>
                        <hr className="my-1 border-dashed border-[#222]" />
                        <h2 className={`text-center font-bold ${size === 'TICKET' ? 'text-[16px]' : 'text-xs'}`}>
                            {receipt === "COTIZACIÓN" ? "COTIZACIÓN" : receipt === "ORDEN DE PAGO" ? "ORDEN DE PAGO" : `${receipt || 'NOTA'} DE VENTA ELECTRÓNICA`}
                            <br />{formValues?.serie}-{formValues?.correlativo}
                        </h2>
                        <hr className="my-1 border-dashed border-[#222]" />
                        <div>
                            <p className={`${size === 'TICKET' ? 'text-[16px]' : 'text-xs'}`}><span className="">FECHA/HORA:</span> {moment(formValues?.fechaEmision).format('DD/MM/YYYY HH:mm:ss')}</p>
                            <p className={`${size === 'TICKET' ? 'text-[16px]' : 'text-xs'}`}><span className="">RAZON SOCIAL:</span> {selectedClient?.nombre?.toUpperCase() || ''}</p>
                            <p className={`${size === 'TICKET' ? 'text-[16px]' : 'text-xs'}`}><span className="">NÚMERO DE DOCUMENTO:</span> {selectedClient?.nroDoc || ''}</p>
                            <p className={`${size === 'TICKET' ? 'text-[16px]' : 'text-xs'}`}><span className="">DIRECCION:</span> {selectedClient?.direccion?.toUpperCase() || ''}</p>
                        </div>
                        {/* Información de Detracción - ANTES de productos */}
                        {formValues?.tipoDetraccion && (
                            <>
                                <hr className="my-1 border-dashed border-[#222]" />
                                <div className="">
                                    <p className={`${size === 'TICKET' ? 'text-[16px]' : 'text-xs'} font-bold mb-1`}>OPERACIÓN SUJETA A DETRACCIÓN</p>
                                    <div className="space-y-0.5">
                                        <div className="flex justify-between">
                                            <span className={`${size === 'TICKET' ? 'text-[16px]' : 'text-xs'} font-bold`}>Tipo Detracción:</span>
                                            <span className={`${size === 'TICKET' ? 'text-[16px]' : 'text-xs'}`}>{formValues.tipoDetraccion?.codigo} - {formValues.tipoDetraccion?.descripcion} ({formValues.tipoDetraccion?.porcentaje}%)</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className={`${size === 'TICKET' ? 'text-[16px]' : 'text-xs'} font-bold`}>Monto Detracción:</span>
                                            <span className={`${size === 'TICKET' ? 'text-[16px]' : 'text-xs'}`}>S/ {Number(formValues.montoDetraccion || 0).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className={`${size === 'TICKET' ? 'text-[16px]' : 'text-xs'} font-bold`}>Cuenta BN:</span>
                                            <span className={`${size === 'TICKET' ? 'text-[16px]' : 'text-xs'}`}>{formValues.cuentaBancoNacion || '-'}</span>
                                        </div>
                                        {formValues.medioPagoDetraccion && (
                                            <div className="flex justify-between">
                                                <span className={`${size === 'TICKET' ? 'text-[16px]' : 'text-xs'} font-bold`}>Medio de Pago:</span>
                                                <span className={`${size === 'TICKET' ? 'text-[16px]' : 'text-xs'}`}>{formValues.medioPagoDetraccion?.codigo} - {formValues.medioPagoDetraccion?.descripcion}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                        <hr className="my-1 border-dashed border-[#222]" />
                        <div className="">
                            <div className="flex text-center">
                                <span className={`basis-[16%] shrink-0 text-center ${size === 'TICKET' ? 'text-[16px]' : 'text-xs'}`}>CANT.</span>
                                <span className={`basis-[44%] shrink-0 text-left ${size === 'TICKET' ? 'text-[16px]' : 'text-xs'}`}>DESCRIPCION</span>
                                <span className={`basis-[20%] shrink-0 text-center ${size === 'TICKET' ? 'text-[16px]' : 'text-xs'}`}>P.U.</span>
                                <span className={`basis-[20%] shrink-0 text-center ${size === 'TICKET' ? 'text-[16px]' : 'text-xs'}`}>IMP.</span>
                            </div>
                            {productsInvoice?.map((item: any, i: any) => (
                                <div key={i} className="flex">
                                    <span className={`basis-[16%] shrink-0 ${size === 'TICKET' ? 'text-[16px]' : 'text-xs'} text-center`}>{item?.cantidad || 0}</span>
                                    <span className={`basis-[44%] shrink-0 ${size === 'TICKET' ? 'text-[16px]' : 'text-xs'} text-left`}>
                                        {item?.descripcion?.toUpperCase() || ''}
                                        {item?.lotes && item.lotes.length > 0 && (
                                            <div className="flex flex-col mt-0.5">
                                                {item.lotes.map((l: any, idx: number) => (
                                                    <span key={idx} className={`${size === 'TICKET' ? 'text-[12px]' : 'text-[9px]'}`}>Lote: {l.lote} Venc: {moment(l.fechaVencimiento).format('DD/MM/YYYY')}</span>
                                                ))}
                                            </div>
                                        )}
                                        {/* Lote directo desde DetalleComprobante (farmacia POS) */}
                                        {!item?.lotes?.length && item?.lote && (
                                            <div className={`${size === 'TICKET' ? 'text-[12px]' : 'text-[9px]'} mt-0.5`}>
                                                Lote: {item.lote.lote}{item.lote.fechaVencimiento ? ` Venc: ${moment(item.lote.fechaVencimiento).format('DD/MM/YYYY')}` : ''}
                                            </div>
                                        )}
                                        {/* Datos de receta médica */}
                                        {item?.numeroReceta && (
                                            <div className={`${size === 'TICKET' ? 'text-[12px]' : 'text-[9px]'} mt-0.5 text-gray-600`}>
                                                Receta: {item.numeroReceta}
                                                {item.medicoNombre ? ` — Dr. ${item.medicoNombre}` : ''}
                                                {item.dniPaciente ? ` — Pac. DNI: ${item.dniPaciente}` : ''}
                                            </div>
                                        )}
                                    </span>
                                    <span className={`basis-[20%] shrink-0 ${size === 'TICKET' ? 'text-[16px]' : 'text-xs'} text-center`}>{Number(item?.mtoPrecioUnitario || item?.producto?.precioUnitario || item?.precioUnitario || 0).toFixed(2)}</span>
                                    <span className={`basis-[20%] shrink-0 ${size === 'TICKET' ? 'text-[16px]' : 'text-xs'} text-center`}>{Number(item?.total || (Number(item?.mtoPrecioUnitario || item?.producto?.precioUnitario || item?.precioUnitario || 0) * item?.cantidad)).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                        <hr className="my-1 border-dashed border-[#222]" />
                        <p className={`${size === 'TICKET' ? 'text-[16px]' : 'text-xs'} `}>SON: {totalInWords || ''}</p>
                        <hr className="my-1 border-dashed border-[#222]" />
                        <label className={`${size === 'TICKET' ? 'text-[16px]' : 'text-xs'} flex justify-between`}><div className="">TOTAL GRAVADAS:</div> <div>{round2(mtoOperGravadas).toFixed(2)}</div></label>
                        {mtoOperExoneradas > 0 && (
                            <label className={`${size === 'TICKET' ? 'text-[16px]' : 'text-xs'} flex justify-between`}><div className="">OP. EXONERADAS:</div> <div>{round2(mtoOperExoneradas).toFixed(2)}</div></label>
                        )}
                        {mtoOperInafectas > 0 && (
                            <label className={`${size === 'TICKET' ? 'text-[16px]' : 'text-xs'} flex justify-between`}><div className="">OP. INAFECTAS:</div> <div>{round2(mtoOperInafectas).toFixed(2)}</div></label>
                        )}
                        <label className={`${size === 'TICKET' ? 'text-[16px]' : 'text-xs'} flex justify-between`}><div className="">I.G.V 18.00 %:</div> <div>{round2(mtoIgv).toFixed(2)}</div></label>
                        {totalDescuentos > 0 && (
                            <label className={`${size === 'TICKET' ? 'text-[16px]' : 'text-xs'} flex justify-between`}>
                                <div className="">DESCUENTO:</div>
                                <div>- {round2(totalDescuentos).toFixed(2)}</div>
                            </label>
                        )}
                        <label className={`${size === 'TICKET' ? 'text-[16px]' : 'text-xs'} flex justify-between`}><div className="">IMPORTE TOTAL:</div> <div>{round2(mtoImpVenta).toFixed(2)}</div></label>
                        {
                            shouldShowRetention && (
                                <>
                                    <label className={`${size === 'TICKET' ? 'text-[16px]' : 'text-xs'} flex justify-between`}>
                                        <div className="">RETENCIÓN (3%):</div>
                                        <div>{displayRetencionMonto.toFixed(2)}</div>
                                    </label>
                                    <label className={`${size === 'TICKET' ? 'text-[16px]' : 'text-xs'} flex justify-between font-bold`}>
                                        <div className="">IMPORTE NETO:</div>
                                        <div>{Number(mtoImpVenta - displayRetencionMonto).toFixed(2)}</div>
                                    </label>
                                </>
                            )
                        }
                        <hr className="my-1 border-dashed border-[#222]" />
                        <p className={`${size === 'TICKET' ? 'text-[16px]' : 'text-xs'} flex justify-between`}><span className="">CONDICIÓN DE PAGO:</span> <span>{formValues?.formaPagoTipo?.toUpperCase() === 'CREDITO' ? 'CRÉDITO' : 'CONTADO'}</span></p>
                        {formValues?.formaPagoTipo?.toUpperCase() === 'CREDITO' && (formValues?.cuotas?.length > 0 ? (
                            <div className="mt-1 mb-1">
                                <p className={`${size === 'TICKET' ? 'text-[15px]' : 'text-xs'} font-bold`}>CUOTAS:</p>
                                {formValues.cuotas.map((cuota: any, idx: number) => (
                                    <p key={idx} className={`${size === 'TICKET' ? 'text-[15px]' : 'text-xs'} flex justify-between`}>
                                        <span>CUOTA {idx + 1}:</span>
                                        <span>{moment(cuota.fechaVencimiento).format('DD/MM/YYYY')} - S/ {Number(cuota.monto).toFixed(2)}</span>
                                    </p>
                                ))}
                            </div>
                        ) : (
                            formValues?.fechaVencimientoCredito && (
                                <label className={`${size === 'TICKET' ? 'text-[16px]' : 'text-xs'} flex justify-between`}><div className="">VENCIMIENTO:</div> <div>{moment(formValues.fechaVencimientoCredito).format('DD/MM/YYYY')}</div></label>
                            )
                        ))}
                        {formValues?.formaPagoTipo?.toUpperCase() !== 'CREDITO' && (
                            <>
                                {formValues?.medioPago?.toUpperCase() === 'MIXTO' && Array.isArray(formValues?.splitPayments) && formValues.splitPayments.length > 0 ? (
                                    <div>
                                        <p className={`${size === 'TICKET' ? 'text-[16px]' : 'text-xs'} font-bold`}>MEDIOS DE PAGO:</p>
                                        {formValues.splitPayments.map((sp: { method: string; amount: number }, idx: number) => {
                                            const detail = splitPaymentDetails[idx] || sp;
                                            return (
                                                <div key={idx} className="mb-0.5">
                                                    <p className={`${size === 'TICKET' ? 'text-[16px]' : 'text-xs'} flex justify-between`}>
                                                        <span>{sp.method?.toUpperCase()}:</span>
                                                        <span>S/ {Number(sp.amount).toFixed(2)}</span>
                                                    </p>
                                                    {formatPaymentExtra(detail).map((line) => (
                                                        <p key={line} className={`${size === 'TICKET' ? 'text-[14px]' : 'text-[10px]'} text-left`}>{line}</p>
                                                    ))}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <>
                                        <p className={`${size === 'TICKET' ? 'text-[16px]' : 'text-xs'}`}><span className="">MEDIO DE PAGO: </span>{formValues?.medioPago?.toUpperCase()}</p>
                                        {formatPaymentExtra(singlePaymentDetail).map((line) => (
                                            <p key={line} className={`${size === 'TICKET' ? 'text-[14px]' : 'text-[10px]'}`}>{line}</p>
                                        ))}
                                    </>
                                )}
                                <p className={`${size === 'TICKET' ? 'text-[16px]' : 'text-xs'} flex justify-between`}>
                                    <span>VUELTO:</span>
                                    <span>S/ {displayVuelto.toFixed(2)}</span>
                                </p>
                                <p className={`${size === 'TICKET' ? 'text-[16px]' : 'text-xs'} flex justify-between`}>
                                    <span>PAGADO:</span>
                                    <span>S/ {displayPagado.toFixed(2)}</span>
                                </p>
                            </>
                        )}
                        <p className={`${size === 'TICKET' ? 'text-[16px]' : 'text-xs'} flex justify-between`}>
                            <span>VENDEDOR:</span>
                            <span className="text-right">{vendedorNombre}</span>
                        </p>
                        <hr className="my-1 border-dashed border-[#222]" />
                        <p className={`${size === 'TICKET' ? 'text-[16px]' : 'text-xs'}`}><span className="">OBSERVACIONES : </span>{observation?.toUpperCase() || ''}</p>
                        <div className="uppercase">
                            {(() => {
                                const reseller = company?.empresa?.reseller;
                                const brandName = reseller?.nombre || BRAND.name;
                                const developerName = reseller?.whiteLabelNombre || brandName;
                                const brandWebsite = reseller?.whiteLabelWebsite || BRAND.website;
                                return (
                                    <>
                                        <p className={`${size === 'TICKET' ? 'text-[15px]' : 'text-xs'} text-center mt-4`}>
                                            Sistema punto de venta - {brandName}.</p>
                                        <p className={`${size === 'TICKET' ? 'text-[15px]' : 'text-xs'} text-center`}>Desarrollado por {developerName}.</p>
                                        <p className={`${size === 'TICKET' ? 'text-[15px]' : 'text-xs'} text-center`}>{brandWebsite}.</p>
                                    </>
                                );
                            })()}
                        </div>
                        <hr className="my-1 border-dashed border-[#222]" />
                        <p className={`${size === 'TICKET' ? 'text-[15px]' : 'text-xs'} text-center`}>GRACIAS POR SU COMPRA, VUELVA PRONTO !</p>
                        <hr className="my-1 border-dashed border-[#222]" />
                    </div>
                ) : (
                    <div className="w-full text-xs font-sans">
                        {receipt === "COTIZACIÓN" ? (
                            <div className="w-full">
                                {/* Header with Emisor and Cliente Boxes */}
                                {/* RESTORED: Header with Logo and Company Info */}
                                <div className="flex justify-between items-start mb-4">
                                    {logoDataUrl && <img src={logoDataUrl} alt="logo" className="w-[150px] h-[150px] object-contain object-left" style={{ width: 150, height: 150, objectFit: 'contain', objectPosition: 'left' }} />}
                                    <div className="flex-1 ml-4">
                                        <h6 className="text-xl font-bold">{company?.empresa?.nombreComercial.toUpperCase()}</h6>
                                        <p className="text-xs">{company?.empresa?.direccion}<br />{company?.empresa?.rubro?.nombre?.toUpperCase()}<br />RAZON SOCIAL: {company?.empresa?.razonSocial}<br />{empresaNumero && <>CELULAR: {empresaNumero}<br /></>}EMAIL: {company?.email}</p>
                                    </div>
                                    <div className="border border-black px-4 pt-4 pb-2 text-center ml-4">
                                        <div className="text-xs">RUC: {company?.empresa?.ruc}</div>
                                        <div className="text-lg font-bold">COTIZACIÓN</div>
                                        {/* <div className='font-bold text-lg'>ELECTRONICA</div> */}
                                        <div>{formValues?.serie}-{formValues?.correlativo}</div>
                                    </div>
                                </div>

                                {/* Data Section: Cliente (Left) and Datos Cotización (Right) */}
                                <div className="flex gap-4 mb-8 items-stretch">
                                    {/* Cliente Box */}
                                    <div className="w-1/2 flex flex-col">
                                        <div className="font-bold text-gray-500 mb-1 border-b border-gray-300 pb-1">DATOS DEL CLIENTE</div>
                                        <div className="border border-black rounded-lg p-3 flex-1 h-auto">
                                            <div className="grid grid-cols-[70px_1fr] gap-y-1">
                                                <span className="font-bold">CLIENTE:</span>
                                                <span className="break-words">{selectedClient?.nombre?.toUpperCase()}</span>

                                                <span className="font-bold">RUC:</span>
                                                <span>{selectedClient?.nroDoc}</span>

                                                <span className="font-bold">EMAIL:</span>
                                                <span className="break-all">{selectedClient?.email || '-'}</span>

                                                <span className="font-bold">TELF:</span>
                                                <span>{selectedClient?.telefono || '-'}</span>

                                                <span className="font-bold">DIR:</span>
                                                <span className="break-words leading-tight">{selectedClient?.direccion?.toUpperCase() || '-'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Datos de la Cotización Box */}
                                    <div className="w-1/2 flex flex-col">
                                        <div className="font-bold text-gray-500 mb-1 border-b border-gray-300 pb-1">DATOS DE LA COTIZACIÓN</div>
                                        <div className="border border-black rounded-lg p-3 flex-1 h-auto">
                                            <div className="grid grid-cols-[110px_1fr] gap-y-1">
                                                <span className="font-bold">FECHA EMISIÓN:</span>
                                                <span>{moment(formValues?.fechaEmision).format('DD/MM/YYYY')}</span>

                                                <span className="font-bold">CONDICIÓN:</span>
                                                <span>
                                                    {quotationPaymentType === 'CONTADO' ? 'CONTADO' :
                                                        quotationPaymentType === 'CREDITO_30' ? 'CREDITO 30 DIAS' :
                                                            quotationPaymentType === 'CREDITO_60' ? 'CREDITO 60 DIAS' :
                                                                quotationPaymentType === 'CREDITO_90' ? 'CREDITO 90 DIAS' :
                                                                    quotationPaymentType === 'ADELANTO' ? `ADELANTO ${quotationAdvance}%` : 'CONTADO'}
                                                </span>

                                                <span className="font-bold">VALIDEZ:</span>
                                                <span>{quotationValidity} días</span>

                                                <span className="font-bold">MONEDA:</span>
                                                <span>SOLES</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Product Table */}
                                <div className="w-full mb-4">
                                    {/* Table Header */}
                                    <div className="flex bg-gray-300 text-black font-bold border border-gray-400 text-xs py-1">
                                        <div className="w-[8%] text-center border-r border-gray-400">N°</div>
                                        <div className="w-[10%] text-center border-r border-gray-400">CANT.</div>
                                        <div className="w-[10%] text-center border-r border-gray-400">UNIDAD</div>
                                        {includeProductImages && <div className="w-[10%] text-center border-r border-gray-400">IMAGEN</div>}
                                        {/* <div className="w-[10%] text-center border-r border-gray-400">CÓDIGO</div> */}
                                        <div className={`flex-1 text-center border-r border-gray-400 px-2`}>DESCRIPCIÓN</div>
                                        {/* <div className="w-[10%] text-center border-r border-gray-400">V.UNIT.</div> */}
                                        {/* <div className="w-[8%] text-center border-r border-gray-400">IGV.</div> */}
                                        <div className="w-[10%] text-center border-r border-gray-400">P.UNIT.</div>
                                        <div className="w-[10%] text-center">TOTAL</div>
                                    </div>

                                    {/* Table Body */}
                                    {productsInvoice?.map((item: any, i: number) => {
                                        const pUnit = Number(item?.mtoPrecioUnitario || item?.precioUnitario || item?.producto?.precioUnitario || 0);
                                        const cant = Number(item?.cantidad || 0);
                                        const totalItem = Number(item?.total || (pUnit * cant));

                                        return (
                                            <div key={i} className="flex border-b border-l border-r border-gray-300 text-xs">
                                                <div className="w-[8%] text-center border-r border-gray-300 py-1">{i + 1}</div>
                                                <div className="w-[10%] text-center border-r border-gray-300 py-1">{formatCantidad(cant)}</div>
                                                <div className="w-[10%] text-center border-r border-gray-300 py-1">{item?.unidad?.toUpperCase() || item?.unidadMedida?.toUpperCase() || 'NIU'}</div>
                                                {includeProductImages && (
                                                    <div className="w-[10%] flex justify-center items-center border-r border-gray-300 py-1">
                                                        {item.imagenUrl ? <img src={item.imagenUrl} className="w-8 h-8 object-cover" alt="" /> : '-'}
                                                    </div>
                                                )}
                                                {/* <div className="w-[10%] text-center border-r border-gray-300 py-1">{item?.codigo || '-'}</div> */}
                                                <div className="flex-1 text-left border-r border-gray-300 px-2 py-1">{item?.descripcion?.toUpperCase()}</div>
                                                {/* <div className="w-[10%] text-right border-r border-gray-300 px-1 py-1">{round2(pUnit / 1.18).toFixed(2)}</div> */}
                                                {/* <div className="w-[8%] text-right border-r border-gray-300 px-1 py-1">{round2(pUnit - (pUnit / 1.18)).toFixed(2)}</div> */}
                                                <div className="w-[10%] text-right border-r border-gray-300 px-1 py-1">{pUnit.toFixed(2)}</div>
                                                <div className="w-[10%] text-right px-1 py-1">{totalItem.toFixed(2)}</div>
                                            </div>
                                        )
                                    })}
                                </div>

                                {/* Total in Words & Footer Section */}
                                <div className="border border-black rounded-lg p-2 mb-2 font-bold text-center text-lg bg-gray-50">
                                    SON: {totalInWords}
                                </div>

                                <div className="border border-black rounded-lg p-3">
                                    <div className="flex justify-between items-start">
                                        <div className="w-2/3 pr-4">
                                            <div className="font-bold mb-1">OBSERVACIONES:</div>
                                            <div className="text-xs">{observation?.toUpperCase() || 'TIEMPO DE ENTREGA 1 DIAS DESPUES DE HABER RECIBIDO Y CONFIRMADO LA OC'}</div>

                                            {quotationTerms && (
                                                <div className="mt-2 text-xs">
                                                    <span className="font-bold">TÉRMINOS:</span> {quotationTerms}
                                                </div>
                                            )}

                                            {/* Footer Info */}
                                            <div className="mt-8">
                                                <p className="font-bold">DEPOSITAR A NOMBRE DE {company?.empresa?.razonSocial}</p>
                                                <p className="mt-1 font-bold">BANCO {(company?.empresa as any)?.bancoNombre?.toUpperCase() || ''}</p>
                                                <p className="font-bold">MONEDA {(company?.empresa as any)?.monedaCuenta || 'SOLES'}</p>
                                                <p className="font-bold">N° CUENTA</p>
                                                <p>{(company?.empresa as any)?.numeroCuenta || ''}</p>
                                                <p className="font-bold">CCI</p>
                                                <p>{(company?.empresa as any)?.cci || ''}</p>
                                            </div>
                                        </div>

                                        <div className="w-1/3 text-right space-y-1">
                                            <div className="flex justify-between">
                                                <span className="font-bold">OP. GRAVADAS:</span>
                                                <span>S/ {round2(mtoOperGravadas).toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="font-bold">OP. EXONERADAS:</span>
                                                <span>S/ {round2(mtoOperExoneradas).toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="font-bold">OP. INAFECTAS:</span>
                                                <span>S/ {round2(mtoOperInafectas).toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="font-bold">OP. GRATUITAS:</span>
                                                <span>S/ 0.00</span>
                                            </div>
                                            <div className="flex justify-between font-bold">
                                                <span>SUB TOTAL:</span>
                                                <span>S/ {round2(mtoOperGravadas).toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>DESCUENTOS TOTAL:</span>
                                                <span>S/ {round2(totalDescuentos).toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="font-bold">IGV 18%:</span>
                                                <span>S/ {round2(mtoIgv).toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-lg font-bold border-t border-black pt-1 mt-1">
                                                <span>MONTO TOTAL:</span>
                                                <span>S/ {round2(mtoImpVenta).toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {/* <div className="mt-4 flex justify-center">
                                        {qrCodeDataUrl && <img src={qrCodeDataUrl} className="w-24 h-24" alt="QR" />}
                                    </div> */}


                                {/* Custom Footer: Gracias / Vuelva Pronto / FalcoNext */}
                                <div className="mt-8 text-center text-xs">
                                    <div className="font-bold mb-1">
                                        GRACIAS POR ELEGIR {company?.empresa?.nombreComercial?.toUpperCase() || company?.empresa?.razonSocial?.toUpperCase()} PARA CUBRIR SUS REQUERIMIENTOS DE {company?.empresa?.rubro?.nombre?.toUpperCase() || 'SERVICIOS'}
                                    </div>
                                    <div className="font-bold mb-8">VUELVA PRONTO</div>

                                    <div className="flex justify-between items-end border-t border-gray-400 pt-1">
                                        <div className="text-left text-[10px] text-gray-500 font-mono">
                                            USUARIO: {formValues?.vendedor || 'ADMIN'} {moment().format('DD/MM/YYYY HH:mm')}
                                        </div>

                                        <div className="text-right text-[10px] text-gray-500">
                                            {(() => {
                                                const reseller = company?.empresa?.reseller;
                                                const brandName = reseller?.whiteLabelNombre || BRAND.name;
                                                const brandWebsite = reseller?.whiteLabelWebsite || BRAND.website;
                                                return (
                                                    <>
                                                        <div className="font-bold italic">{brandName} ™</div>
                                                        <div>Comprobante emitido a través de {brandWebsite}</div>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Standard invoice footer (Existing Logic for non-quotation) */
                            <div className="w-full">
                                <div className="flex justify-between items-start">
                                    {logoDataUrl && <img src={logoDataUrl} alt="logo" className="w-[150px] h-[150px] object-contain object-left" style={{ width: 150, height: 150, objectFit: 'contain', objectPosition: 'left' }} />}
                                    <div className="flex-1 ml-4">
                                        <h6 className="text-xl font-bold">{company?.empresa?.nombreComercial.toUpperCase()}</h6>
                                        <p className="text-xs">{company?.empresa?.direccion}<br />{company?.empresa?.rubro?.nombre?.toUpperCase()}<br />RAZON SOCIAL: {company?.empresa?.razonSocial}<br />{empresaNumero && <>CELULAR: {empresaNumero}<br /></>}EMAIL: {company?.email}</p>
                                    </div>
                                    <div className="border border-black px-4 pt-4 pb-2 text-center ml-4">
                                        <div className="text-xs">RUC: {company?.empresa?.ruc}</div>
                                        <div className="text-lg font-bold">{receipt}</div>
                                        {receipt !== "ORDEN DE PAGO" && receipt !== "COTIZACIÓN" && <div className='font-bold text-lg'>ELECTRONICA</div>}
                                        <div>{formValues?.serie}-{formValues?.correlativo}</div>
                                    </div>
                                </div>
                                <div className="mt-4 mb-4">
                                    <div className="flex gap-4 mb-2 items-stretch">
                                        <div className="w-1/2 flex flex-col">
                                            <div className="font-bold text-gray-500 mb-1 border-b border-gray-300 pb-1">DATOS DEL CLIENTE</div>
                                            <div className="border border-black rounded-lg p-3 flex-1">
                                                <div className="grid grid-cols-[80px_1fr] gap-y-1">
                                                    <span className="font-bold text-xs">CLIENTE:</span>
                                                    <span className="text-xs break-words">{selectedClient?.nombre?.toUpperCase() || '-'}</span>

                                                    <span className="font-bold text-xs">RUC:</span>
                                                    <span className="text-xs">{selectedClient?.nroDoc || '-'}</span>

                                                    <span className="font-bold text-xs">EMAIL:</span>
                                                    <span className="text-xs break-all">{selectedClient?.email || '-'}</span>

                                                    <span className="font-bold text-xs">TELF:</span>
                                                    <span className="text-xs">{selectedClient?.telefono || '-'}</span>

                                                    <span className="font-bold text-xs">DIR:</span>
                                                    <span className="text-xs break-words">{selectedClient?.direccion?.toUpperCase() || '-'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="w-1/2 flex flex-col">
                                            <div className="font-bold text-gray-500 mb-1 border-b border-gray-300 pb-1">DATOS DEL COMPROBANTE</div>
                                            <div className="border border-black rounded-lg p-3 flex-1">
                                                <div className="grid grid-cols-[115px_1fr] gap-y-1">
                                                    <span className="font-bold text-xs">FECHA:</span>
                                                    <span className="text-xs">{moment(formValues?.fechaEmision || new Date()).format('DD/MM/YYYY')}</span>

                                                    <span className="font-bold text-xs">HORA:</span>
                                                    <span className="text-xs">{moment(formValues?.fechaEmision || new Date()).format('h:mm:ss a')}</span>

                                                    <span className="font-bold text-xs">MONEDA:</span>
                                                    <span className="text-xs">SOLES</span>

                                                    <span className="font-bold text-xs">FORMA PAGO:</span>
                                                    <span className="text-xs">{formValues?.formaPagoTipo?.toUpperCase() === 'CREDITO' ? 'CRÉDITO' : 'CONTADO'}</span>

                                                    {formValues?.formaPagoTipo?.toUpperCase() === 'CREDITO' && (formValues?.cuotas?.length > 0 ? (
                                                        <>
                                                            <span className="font-bold text-xs">CUOTAS:</span>
                                                            <span className="text-xs">
                                                                {formValues.cuotas.map((cuota: any, idx: number) => (
                                                                    <span key={idx} className="block">
                                                                        Cuota {idx + 1}: {moment(cuota.fechaVencimiento).format('DD/MM/YYYY')} - S/ {Number(cuota.monto).toFixed(2)}
                                                                    </span>
                                                                ))}
                                                            </span>
                                                        </>
                                                    ) : (
                                                        formValues?.fechaVencimientoCredito && (
                                                            <>
                                                                <span className="font-bold text-xs">VENCIMIENTO:</span>
                                                                <span className="text-xs">{moment(formValues.fechaVencimientoCredito).format('DD/MM/YYYY')}</span>
                                                            </>
                                                        )
                                                    ))}

                                                    {formValues?.formaPagoTipo?.toUpperCase() !== 'CREDITO' && (
                                                        <>
                                                            {formValues?.medioPago?.toUpperCase() === 'MIXTO' && Array.isArray(formValues?.splitPayments) && formValues.splitPayments.length > 0 ? (
                                                                <>
                                                                    <span className="font-bold text-xs">MEDIOS PAGO:</span>
                                                                    <span className="text-xs">
                                                                        {formValues.splitPayments.map((sp: { method: string; amount: number }, idx: number) => {
                                                                            const detail = splitPaymentDetails[idx] || sp;
                                                                            return (
                                                                                <span key={idx} className="block">
                                                                                    <span className="flex justify-between">
                                                                                        <span>{sp.method?.toUpperCase()}:</span>
                                                                                        <span>S/ {Number(sp.amount).toFixed(2)}</span>
                                                                                    </span>
                                                                                    {formatPaymentExtra(detail).map((line) => (
                                                                                        <span key={line} className="block text-[10px] text-gray-700">{line}</span>
                                                                                    ))}
                                                                                </span>
                                                                            );
                                                                        })}
                                                                    </span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <span className="font-bold text-xs">MEDIO PAGO:</span>
                                                                    <span className="text-xs">
                                                                        {formValues?.medioPago?.toUpperCase() || 'EFECTIVO'} S/ {round2(mtoImpVenta).toFixed(2)}
                                                                        {formatPaymentExtra(singlePaymentDetail).map((line) => (
                                                                            <span key={line} className="block text-[10px] text-gray-700">{line}</span>
                                                                        ))}
                                                                    </span>
                                                                </>
                                                            )}
        
                                                            <span className="font-bold text-xs">VUELTO:</span>
                                                            <span className="text-xs">S/ {displayVuelto.toFixed(2)}</span>
        
                                                            <span className="font-bold text-xs">PAGADO:</span>
                                                            <span className="text-xs">S/ {displayPagado.toFixed(2)}</span>
                                                        </>
                                                    )}

                                                    <span className="font-bold text-xs">VENDEDOR:</span>
                                                    <span className="text-xs">{vendedorNombre}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {formValues?.medioPago?.toLowerCase() === 'credito' && formValues?.cuotas?.length > 0 && (
                                        <div className="mt-2 border p-2 border-gray-300 rounded-md">
                                            <div className="text-xs font-bold mb-1">Cronograma de Cuotas:</div>
                                            <div className="grid grid-cols-2 gap-2">
                                                {formValues.cuotas.map((cuota: any, idx: number) => (
                                                    <div key={idx} className="text-[10px] flex justify-between px-1">
                                                        <span>Cuota {idx + 1} ({moment(cuota.fechaVencimiento).format('DD/MM/YYYY')}):</span>
                                                        <span>S/ {Number(cuota.monto).toFixed(2)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {/* Información de Detracción - ANTES de productos */}
                                {formValues?.tipoDetraccion && (
                                    <div className="p-3 mt-3">
                                        <p className="text-sm font-bold mb-2">OPERACIÓN SUJETA A DETRACCIÓN</p>
                                        <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                                            <div className="flex">
                                                <span className="text-xs font-bold w-[130px]">Tipo Detracción:</span>
                                                <span className="text-xs">{formValues.tipoDetraccion?.codigo} - {formValues.tipoDetraccion?.descripcion} ({formValues.tipoDetraccion?.porcentaje}%)</span>
                                            </div>
                                            <div className="flex">
                                                <span className="text-xs font-bold w-[100px]">Cuenta BN:</span>
                                                <span className="text-xs">{formValues.cuentaBancoNacion || '-'}</span>
                                            </div>
                                            <div className="flex">
                                                <span className="text-xs font-bold w-[130px]">Monto Detracción:</span>
                                                <span className="text-xs">S/ {Number(formValues.montoDetraccion || 0).toFixed(2)}</span>
                                            </div>
                                            {formValues.medioPagoDetraccion && (
                                                <div className="flex">
                                                    <span className="text-xs font-bold w-[100px]">Medio de Pago:</span>
                                                    <span className="text-xs">{formValues.medioPagoDetraccion?.codigo} - {formValues.medioPagoDetraccion?.descripcion}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                                <div className="w-full mb-3">
                                    <div className="flex bg-gray-300 text-black font-bold border border-gray-400 text-xs py-1">
                                        <div className="w-[8%] text-center border-r border-gray-400">N°</div>
                                        <div className="w-[10%] text-center border-r border-gray-400">CANT.</div>
                                        <div className="w-[10%] text-center border-r border-gray-400">UNIDAD</div>
                                        {includeProductImages && <div className="w-[10%] text-center border-r border-gray-400">IMAGEN</div>}
                                        <div className="flex-1 text-center border-r border-gray-400 px-2">DESCRIPCIÓN</div>
                                        <div className="w-[10%] text-center border-r border-gray-400">P.UNIT.</div>
                                        <div className="w-[10%] text-center">TOTAL</div>
                                    </div>

                                    {productsInvoice?.map((item: any, i: number) => {
                                        const pUnit = Number(item?.mtoPrecioUnitario || item?.precioUnitario || item?.producto?.precioUnitario || 0);
                                        const cant = Number(item?.cantidad || 0);
                                        const totalItem = Number(item?.total || (pUnit * cant));

                                        return (
                                            <div key={i} className="flex border-b border-l border-r border-gray-300 text-xs">
                                                <div className="w-[8%] text-center border-r border-gray-300 py-1">{i + 1}</div>
                                                <div className="w-[10%] text-center border-r border-gray-300 py-1">{formatCantidad(cant)}</div>
                                                <div className="w-[10%] text-center border-r border-gray-300 py-1">{item?.unidad?.toUpperCase() || item?.unidadMedida?.toUpperCase() || 'NIU'}</div>
                                                {includeProductImages && (
                                                    <div className="w-[10%] flex justify-center items-center border-r border-gray-300 py-1">
                                                        {item.imagenUrl ? <img src={item.imagenUrl} className="w-8 h-8 object-cover" alt="" /> : '-'}
                                                    </div>
                                                )}
                                                <div className="flex-1 text-left border-r border-gray-300 px-2 py-1">
                                                    <div>{item?.descripcion?.toUpperCase()}</div>
                                                    {item?.lotes && item.lotes.length > 0 && (
                                                        <div className="flex flex-col mt-0.5">
                                                            {item.lotes.map((l: any, idx: number) => (
                                                                <span key={idx} className="text-[9px] text-gray-500">Lote: {l.lote} | Venc: {moment(l.fechaVencimiento).format('DD/MM/YYYY')}</span>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {/* Lote directo desde DetalleComprobante (farmacia POS) */}
                                                    {!item?.lotes?.length && item?.lote && (
                                                        <div className="text-[9px] text-gray-500 mt-0.5">
                                                            Lote: {item.lote.lote}{item.lote.fechaVencimiento ? ` | Venc: ${moment(item.lote.fechaVencimiento).format('DD/MM/YYYY')}` : ''}
                                                        </div>
                                                    )}
                                                    {/* Datos de receta médica */}
                                                    {item?.numeroReceta && (
                                                        <div className="text-[9px] text-gray-500 mt-0.5">
                                                            Receta: {item.numeroReceta}
                                                            {item.medicoNombre ? ` — Dr. ${item.medicoNombre}` : ''}
                                                            {item.dniPaciente ? ` — Pac. DNI: ${item.dniPaciente}` : ''}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="w-[10%] text-right border-r border-gray-300 px-1 py-1">{pUnit.toFixed(2)}</div>
                                                <div className="w-[10%] text-right px-1 py-1">{totalItem.toFixed(2)}</div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="border border-black rounded-lg p-2 mb-2 font-bold text-center text-lg bg-gray-50">
                                    SON: {totalInWords || ''}
                                </div>

                                <div className="border border-black rounded-lg p-3 relative mb-10">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="w-2/3 pr-2">
                                            <div className="font-bold mb-1">OBSERVACIONES:</div>
                                            <div className="text-xs">{observation?.toUpperCase() || ''}</div>
                                            <div className="text-xs mt-2">
                                                Representación impresa del Comprobante de Pago Electrónico.
                                                <br />
                                                Autorizado mediante Resolución de Intendencia N° 080-005-000153/SUNAT.
                                                <br />
                                                Emite a través de APISPERU - Proveedor Autorizado por SUNAT.
                                            </div>
                                        </div>

                                        <div className="w-1/3 text-right space-y-0.5">
                                            {isDocumentoFiscal && (
                                                <>
                                                    <div className="flex justify-between"><span className="font-bold">OP. GRAVADAS:</span><span>S/ {round2(mtoOperGravadas).toFixed(2)}</span></div>
                                                    <div className="flex justify-between"><span className="font-bold">OP. EXONERADAS:</span><span>S/ {round2(mtoOperExoneradas).toFixed(2)}</span></div>
                                                    <div className="flex justify-between"><span className="font-bold">OP. INAFECTAS:</span><span>S/ {round2(mtoOperInafectas).toFixed(2)}</span></div>
                                                    <div className="flex justify-between"><span className="font-bold">OP. GRATUITAS:</span><span>S/ {round2(mtoOperGratuitas).toFixed(2)}</span></div>
                                                    <div className="flex justify-between"><span className="font-bold">ICBPER:</span><span>S/ {round2(mtoIcbper).toFixed(2)}</span></div>
                                                    <div className="flex justify-between"><span className="font-bold">SUB TOTAL:</span><span>S/ {round2(mtoOperGravadas).toFixed(2)}</span></div>
                                                    <div className="flex justify-between"><span>DESCUENTOS TOTAL:</span><span>S/ {round2(totalDescuentos).toFixed(2)}</span></div>
                                                    <div className="flex justify-between"><span className="font-bold">IGV 18%:</span><span>S/ {round2(mtoIgv).toFixed(2)}</span></div>
                                                </>
                                            )}
                                            {!isDocumentoFiscal && totalDescuentos > 0 && (
                                                <div className="flex justify-between">
                                                    <span>DESCUENTO:</span>
                                                    <span>- S/ {round2(totalDescuentos).toFixed(2)}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between text-md font-bold border-t border-black pt-1 mt-1">
                                                <span>MONTO TOTAL:</span>
                                                <span>S/ {round2(mtoImpVenta).toFixed(2)}</span>
                                            </div>
                                            {shouldShowRetention && (
                                                <>
                                                    <div className="flex justify-between"><span className="font-bold">RETENCIÓN (3%):</span><span>S/ {displayRetencionMonto.toFixed(2)}</span></div>
                                                    <div className="flex justify-between font-bold"><span>IMPORTE NETO:</span><span>S/ {Number(mtoImpVenta - displayRetencionMonto).toFixed(2)}</span></div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 text-center text-xs">
                                    <div className="font-bold mb-1">
                                        GRACIAS POR ELEGIR {company?.empresa?.nombreComercial?.toUpperCase() || company?.empresa?.razonSocial?.toUpperCase()} PARA CUBRIR SUS REQUERIMIENTOS DE {company?.empresa?.rubro?.nombre?.toUpperCase() || 'SERVICIOS'}
                                    </div>
                                    <div className="font-bold mb-8">VUELVA PRONTO</div>

                                    <div className="flex justify-between items-end border-t border-gray-400 pt-1">
                                        <div className="text-left text-[10px] text-gray-500 font-mono">
                                            USUARIO: {formValues?.vendedor || 'ADMIN'} {moment().format('DD/MM/YYYY HH:mm')}
                                        </div>

                                        <div className="text-right text-[10px] text-gray-500">
                                            {(() => {
                                                const reseller = company?.empresa?.reseller;
                                                const brandName = reseller?.whiteLabelNombre || BRAND.name;
                                                const brandWebsite = reseller?.whiteLabelWebsite || BRAND.website;
                                                return (
                                                    <>
                                                        <div className="font-bold italic">{brandName} ™</div>
                                                        <div>Comprobante emitido a través de {brandWebsite}</div>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div >
    );
};

export default ComprobantePrintPage;
