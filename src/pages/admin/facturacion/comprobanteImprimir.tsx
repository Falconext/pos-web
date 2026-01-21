import moment from 'moment';
import React, { useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';

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

    console.log(formValues)
    console.log(company)
    const rawBase64 = company?.empresa?.logo;
    // Detecta MIME si no viene con prefijo
    const detectMime = (b64?: string) => {
        if (!b64) return undefined;
        if (b64.startsWith('data:')) return undefined; // ya viene completo
        if (b64.startsWith('/9j/')) return 'image/jpeg'; // JPEG
        if (b64.startsWith('iVBOR')) return 'image/png'; // PNG
        return 'image/png';
    };

    const mime = detectMime(rawBase64);
    const logoDataUrl = rawBase64
        ? (rawBase64.startsWith('data:')
            ? rawBase64
            : `data:${mime};base64,${rawBase64}`)
        : undefined;

    // Fallback: Detect retention from observation if data prop is missing
    const hasRetentionText = observation?.toUpperCase().includes("RETENCIÓN") && observation?.toUpperCase().includes("3%");
    const calculatedRetention = hasRetentionText ? Number((Number(total) * 0.03).toFixed(2)) : 0;

    const displayRetencionMonto = retencionData ? Number(retencionData.montoDetraccion || 0) : calculatedRetention;
    const shouldShowRetention = retencionData || (hasRetentionText && calculatedRetention > 0);

    console.log(formValues)

    return (
        <div id="print-root" className='hidden h-full bg-[#fff]'>
            <div
                ref={componentRef || localComponentRef}
                className={`px-5 bg-[#fff] py-0 text-sm ${size === 'TICKET' ? 'pt-10 pb-10' : 'pt-5 pb-10'}`}
                style={{
                    fontFamily:
                        size === 'TICKET'
                            ? 'SFMono-Regular,VT323, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
                            : 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif',
                    lineHeight: size === 'TICKET' ? 1.2 : undefined,
                    letterSpacing: size === 'TICKET' ? '0.2px' : undefined
                }}
            >
                {size === 'TICKET' ? (
                    <div className="">
                        {logoDataUrl && <img src={logoDataUrl} alt="logo" className="mx-auto w-[150px] h-[150px] mb-3 object-contain" />}
                        <p className={`text-center ${size === 'TICKET' ? 'text-[18px]' : 'text-xs'}`}>
                            RAZON SOCIAL: {company?.empresa?.razonSocial?.toUpperCase()}<br />
                            DIRECCION: {company?.empresa?.direccion?.toUpperCase()}<br />
                            <span className="">RUC: {company?.empresa?.ruc}</span>
                        </p>
                        <hr className="my-1 border-dashed border-[#222]" />
                        <h2 className={`text-center font-bold ${size === 'TICKET' ? 'text-[18px]' : 'text-xs'}`}>{receipt === "COTIZACIÓN" ? "COTIZACIÓN" : receipt} DE VENTA ELECTRÓNICA<br />{formValues?.serie}-{formValues?.correlativo}</h2>
                        <hr className="my-1 border-dashed border-[#222]" />
                        <div>
                            <p className={`${size === 'TICKET' ? 'text-[18px]' : 'text-xs'}`}><span className="">FECHA/HORA:</span> {moment(formValues?.fechaEmision).format('DD/MM/YYYY HH:mm:ss')}</p>
                            <p className={`${size === 'TICKET' ? 'text-[18px]' : 'text-xs'}`}><span className="">RAZON SOCIAL:</span> {selectedClient?.nombre?.toUpperCase() || ''}</p>
                            <p className={`${size === 'TICKET' ? 'text-[18px]' : 'text-xs'}`}><span className="">NÚMERO DE DOCUMENTO:</span> {selectedClient?.nroDoc || ''}</p>
                            <p className={`${size === 'TICKET' ? 'text-[18px]' : 'text-xs'}`}><span className="">DIRECCION:</span> {selectedClient?.direccion?.toUpperCase() || ''}</p>
                        </div>
                        {/* Información de Detracción - ANTES de productos */}
                        {formValues?.tipoDetraccion && (
                            <>
                                <hr className="my-1 border-dashed border-[#222]" />
                                <div className="">
                                    <p className={`${size === 'TICKET' ? 'text-[18px]' : 'text-xs'} font-bold mb-1`}>OPERACIÓN SUJETA A DETRACCIÓN</p>
                                    <div className="space-y-0.5">
                                        <div className="flex justify-between">
                                            <span className={`${size === 'TICKET' ? 'text-[18px]' : 'text-xs'} font-bold`}>Tipo Detracción:</span>
                                            <span className={`${size === 'TICKET' ? 'text-[18px]' : 'text-xs'}`}>{formValues.tipoDetraccion?.codigo} - {formValues.tipoDetraccion?.descripcion} ({formValues.tipoDetraccion?.porcentaje}%)</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className={`${size === 'TICKET' ? 'text-[18px]' : 'text-xs'} font-bold`}>Monto Detracción:</span>
                                            <span className={`${size === 'TICKET' ? 'text-[18px]' : 'text-xs'}`}>S/ {Number(formValues.montoDetraccion || 0).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className={`${size === 'TICKET' ? 'text-[18px]' : 'text-xs'} font-bold`}>Cuenta BN:</span>
                                            <span className={`${size === 'TICKET' ? 'text-[18px]' : 'text-xs'}`}>{formValues.cuentaBancoNacion || '-'}</span>
                                        </div>
                                        {formValues.medioPagoDetraccion && (
                                            <div className="flex justify-between">
                                                <span className={`${size === 'TICKET' ? 'text-[18px]' : 'text-xs'} font-bold`}>Medio de Pago:</span>
                                                <span className={`${size === 'TICKET' ? 'text-[18px]' : 'text-xs'}`}>{formValues.medioPagoDetraccion?.codigo} - {formValues.medioPagoDetraccion?.descripcion}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                        <hr className="my-1 border-dashed border-[#222]" />
                        <div className="">
                            <div className="flex text-center">
                                <span className={`w-1/5 ${size === 'TICKET' ? 'text-[18px]' : 'text-xs'}`}>CANT.</span>
                                <span className={`w-3/5 ${size === 'TICKET' ? 'text-[18px]' : 'text-xs'}`}>DESCRIPCION</span>
                                <span className={`w-1/5 ${size === 'TICKET' ? 'text-[18px]' : 'text-xs'}`}>P.U.</span>
                                <span className={`w-1/5 ${size === 'TICKET' ? 'text-[18px]' : 'text-xs'}`}>IMP.</span>
                            </div>
                            {productsInvoice?.map((item: any, i: any) => (
                                <div key={i} className="flex">
                                    <span className={`w-1/5 ${size === 'TICKET' ? 'text-[18px]' : 'text-xs'} text-left`}>{item?.cantidad || 0}</span>
                                    <span className={`w-3/5 ${size === 'TICKET' ? 'text-[18px]' : 'text-xs'} text-left`}>
                                        {item?.descripcion?.toUpperCase() || ''}
                                        {item?.lotes && item.lotes.length > 0 && (
                                            <div className="flex flex-col mt-0.5">
                                                {item.lotes.map((l: any, idx: number) => (
                                                    <span key={idx} className={`${size === 'TICKET' ? 'text-[14px]' : 'text-[9px]'}`}>Lote: {l.lote} Venc: {moment(l.fechaVencimiento).format('DD/MM/YYYY')}</span>
                                                ))}
                                            </div>
                                        )}
                                    </span>
                                    <span className={`w-1/5 ${size === 'TICKET' ? 'text-[18px]' : 'text-xs'} text-left`}>{Number(item?.mtoPrecioUnitario || item?.producto?.precioUnitario || item?.precioUnitario || 0).toFixed(2)}</span>
                                    <span className={`w-1/5 ${size === 'TICKET' ? 'text-[18px]' : 'text-xs'} text-right`}>{Number(item?.total || (Number(item?.mtoPrecioUnitario || item?.producto?.precioUnitario || item?.precioUnitario || 0) * item?.cantidad)).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                        <hr className="my-1 border-dashed border-[#222]" />
                        <p className={`${size === 'TICKET' ? 'text-[18px]' : 'text-xs'} `}>SON: {totalInWords || ''}</p>
                        <hr className="my-1 border-dashed border-[#222]" />
                        <label className={`${size === 'TICKET' ? 'text-[18px]' : 'text-xs'} flex justify-between`}><div className="">TOTAL GRAVADAS:</div> <div>{Number(formValues?.mtoOperGravadas ?? (totalReceipt / 1.18)).toFixed(2)}</div></label>
                        <label className={`${size === 'TICKET' ? 'text-[18px]' : 'text-xs'} flex justify-between`}><div className="">I.G.V 18.00 %:</div> <div>{Number(formValues?.mtoIGV ?? (totalReceipt - (totalReceipt / 1.18))).toFixed(2)}</div></label>
                        <label className={`${size === 'TICKET' ? 'text-[18px]' : 'text-xs'} flex justify-between`}><div className="">IMPORTE TOTAL:</div> <div>{Number(formValues?.mtoImpVenta ?? totalReceipt).toFixed(2)}</div></label>
                        {
                            shouldShowRetention && (
                                <>
                                    <label className={`${size === 'TICKET' ? 'text-[18px]' : 'text-xs'} flex justify-between`}>
                                        <div className="">RETENCIÓN (3%):</div>
                                        <div>{displayRetencionMonto.toFixed(2)}</div>
                                    </label>
                                    <label className={`${size === 'TICKET' ? 'text-[18px]' : 'text-xs'} flex justify-between font-bold`}>
                                        <div className="">IMPORTE NETO:</div>
                                        <div>{Number(totalReceipt - displayRetencionMonto).toFixed(2)}</div>
                                    </label>
                                </>
                            )
                        }
                        <hr className="my-1 border-dashed border-[#222]" />
                        <p className={`${size === 'TICKET' ? 'text-[18px]' : 'text-xs'}`}><span className="">CONDICIÓN DE PAGO: </span>{formValues?.medioPago?.toUpperCase() || 'CONTADO'}</p>
                        {formValues?.medioPago?.toLowerCase() === 'credito' && formValues?.cuotas?.length > 0 && (
                            <div className="mt-1 mb-1">
                                <p className={`${size === 'TICKET' ? 'text-[16px]' : 'text-xs'} font-bold`}>CUOTAS:</p>
                                {formValues.cuotas.map((cuota: any, idx: number) => (
                                    <p key={idx} className={`${size === 'TICKET' ? 'text-[16px]' : 'text-xs'}`}>
                                        Cuota {idx + 1}: {moment(cuota.fechaVencimiento).format('DD/MM/YYYY')} - S/ {Number(cuota.monto).toFixed(2)}
                                    </p>
                                ))}
                            </div>
                        )}
                        <p className={`${size === 'TICKET' ? 'text-[18px]' : 'text-xs'}`}><span className="">MEDIO DE PAGO: </span>{formValues?.medioPago?.toUpperCase()}</p>
                        <p className={`${size === 'TICKET' ? 'text-[18px]' : 'text-xs'}`}><span className="">VUELTO: </span> S/ {formValues?.vuelto?.toFixed(2) || (0).toFixed(2)}</p>
                        <p className={`${size === 'TICKET' ? 'text-[18px]' : 'text-xs'}`}><span className="">PAGADO: </span>S/ {Number(totalPrices).toFixed(2)}</p>
                        <p className={`${size === 'TICKET' ? 'text-[18px]' : 'text-xs'}`}><span className="">VENDEDOR: </span>{formValues?.vendedor?.toUpperCase()}</p>
                        <hr className="my-1 border-dashed border-[#222]" />
                        <p className={`${size === 'TICKET' ? 'text-[18px]' : 'text-xs'}`}><span className="">OBSERVACIONES : </span>{observation?.toUpperCase() || ''}</p>
                        <div className="uppercase">
                            <p className={`${size === 'TICKET' ? 'text-[16px]' : 'text-xs'} text-center mt-10`}>
                                Sistema punto de venta - FalcoNext.</p>
                            <p className={`${size === 'TICKET' ? 'text-[16px]' : 'text-xs'} text-center`}>Desarrollado por FalcoNext.</p>
                            <p className={`${size === 'TICKET' ? 'text-[16px]' : 'text-xs'} text-center`}>www.falconext.pe.</p>
                        </div>
                        <hr className="my-1 border-dashed border-[#222]" />
                        <p className={`${size === 'TICKET' ? 'text-[16px]' : 'text-xs'} text-center`}>GRACIAS POR SU COMPRA, VUELVA PRONTO !</p>
                        <hr className="my-1 border-dashed border-[#222]" />
                    </div>
                ) : (
                    <div className="w-full text-xs font-sans">
                        {receipt === "COTIZACIÓN" ? (
                            <div className="w-full">
                                {/* Header with Emisor and Cliente Boxes */}
                                {/* RESTORED: Header with Logo and Company Info */}
                                <div className="flex justify-between items-start mb-4">
                                    {logoDataUrl && <img src={logoDataUrl} alt="logo" className="w-[150px] h-[150px] object-contain object-left" />}
                                    <div className="flex-1 ml-4">
                                        <h6 className="text-xl font-bold">{company?.empresa?.nombreComercial.toUpperCase()}</h6>
                                        <p className="text-xs">{company?.empresa?.direccion}<br />{company?.empresa?.rubro?.nombre?.toUpperCase()}<br />RAZON SOCIAL: {company?.empresa?.razonSocial}<br />CELULAR: {company?.celular}<br />EMAIL: {company?.email}</p>
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
                                                <div className="w-[10%] text-center border-r border-gray-300 py-1">{cant.toFixed(3)}</div>
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
                                <div className="border border-black rounded-lg p-2 mb-2 font-bold text-center italic text-lg bg-gray-50">
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
                                                <span>S/ {Number(formValues?.mtoOperGravadas ?? (totalReceipt / 1.18)).toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="font-bold">OP. EXONERADAS:</span>
                                                <span>S/ 0.00</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="font-bold">OP. INAFECTAS:</span>
                                                <span>S/ 0.00</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="font-bold">OP. GRATUITAS:</span>
                                                <span>S/ 0.00</span>
                                            </div>
                                            <div className="flex justify-between font-bold">
                                                <span>SUB TOTAL:</span>
                                                <span>S/ {Number(formValues?.subTotal ?? totalReceipt).toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>DESCUENTOS TOTAL:</span>
                                                <span>S/ 0.00</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="font-bold">IGV 18%:</span>
                                                <span>S/ {Number(formValues?.mtoIGV ?? (totalReceipt - (totalReceipt / 1.18))).toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-lg font-bold border-t border-black pt-1 mt-1">
                                                <span>MONTO TOTAL:</span>
                                                <span>S/ {Number(formValues?.mtoImpVenta ?? totalReceipt).toFixed(2)}</span>
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
                                            <div className="font-bold italic">FalcoNext ™</div>
                                            <div>Comprobante emitido a través de www.falconext.pe</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Standard invoice footer (Existing Logic for non-quotation) */
                            <div className="w-full">
                                <div className="flex justify-between items-start">
                                    {logoDataUrl && <img src={logoDataUrl} alt="logo" className="w-[150px] h-[150px] object-contain object-left" />}
                                    <div className="flex-1 ml-4">
                                        <h6 className="text-xl font-bold">{company?.empresa?.nombreComercial.toUpperCase()}</h6>
                                        <p className="text-xs">{company?.empresa?.direccion}<br />{company?.empresa?.rubro?.nombre?.toUpperCase()}<br />RAZON SOCIAL: {company?.empresa?.razonSocial}<br />CELULAR: {company?.celular}<br />EMAIL: {company?.email}</p>
                                    </div>
                                    <div className="border border-black px-4 pt-4 pb-2 text-center ml-4">
                                        <div className="text-xs">RUC: {company?.empresa?.ruc}</div>
                                        <div className="text-lg font-bold">{receipt}</div>
                                        <div className='font-bold text-lg'>ELECTRONICA</div>
                                        <div>{formValues?.serie}-{formValues?.correlativo}</div>
                                    </div>
                                </div>
                                <div className="flex mt-4 justify-between mb-2">
                                    <div>
                                        <label className="text-xs mt-1 flex"><div className="font-bold w-[100px]">CLIENTE:</div> {selectedClient?.nombre?.toUpperCase() || ''}</label>
                                        <label className="text-xs mt-1 flex"><div className="font-bold w-[100px]">DIRECCION:</div><p className='w-[450px]'> {selectedClient?.direccion?.toUpperCase() || '-'}</p></label>
                                        <label className="text-xs mt-1 flex"><div className="font-bold w-[100px]">FORMA PAGO:</div> {formValues?.medioPago?.toUpperCase() || 'CONTADO'}</label>
                                        <label className="text-xs mt-1 flex"><div className="font-bold w-[100px]">MEDIO PAGO:</div> {formValues?.medioPago?.toUpperCase()} S/ {round2(totalPrices).toFixed(2)}</label>

                                        {formValues?.medioPago?.toLowerCase() === 'credito' && formValues?.cuotas?.length > 0 && (
                                            <div className="mt-2 border p-1 border-gray-300">
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
                                    <div>
                                        <label className="text-xs mt-1 flex"><div className="font-bold w-[110px]">RUC:</div> {selectedClient?.nroDoc || ''}</label>
                                        <label className="text-xs mt-1 flex"><div className="font-bold w-[110px]">FECHA:</div> {new Date().toLocaleDateString()}</label>
                                        <label className="text-xs mt-1 flex"><div className="font-bold w-[110px]">HORA:</div> {new Date().toLocaleTimeString()}</label>
                                        <label className="text-xs mt-1 mb-2 flex"><div className="font-bold w-[110px]">MONEDA:</div> SOLES</label>
                                    </div>
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
                                <div className="border border-[#222] mt-2">
                                    <div className="flex border-b border-gray-400 pb-1 mb-2">
                                        <span className="w-[8%] text-xs font-bold text-center">CANT.</span>
                                        <span className="w-[8%] text-xs font-bold text-center">U.M.</span>
                                        <span className="w-[34%] text-xs font-bold text-left">DESCRIPCION</span>
                                        <span className="w-[15%] text-xs font-bold text-center">LOTE</span>
                                        <span className="w-[15%] text-xs font-bold text-center">VENC.</span>
                                        <span className="w-[10%] text-xs font-bold text-right">P.U.</span>
                                        <span className="w-[10%] text-xs font-bold text-right">IMPORTE</span>
                                    </div>
                                    {productsInvoice?.map((item: any, i: any) => (
                                        <div key={i} className="flex items-start mb-1">
                                            <span className="w-[8%] text-xs text-center">{item?.cantidad || 0}</span>
                                            <span className="w-[8%] text-xs text-center">{item?.unidad?.toUpperCase() || item?.unidadMedida?.toUpperCase() || item?.producto?.unidadMedida?.codigo?.toUpperCase() || ''}</span>
                                            <span className="w-[34%] text-xs text-left">{item?.descripcion?.toUpperCase() || ''}</span>
                                            <span className="w-[15%] text-xs text-center flex flex-col">
                                                {item?.lotes && item.lotes.length > 0 ? (
                                                    item.lotes.map((l: any, idx: number) => (
                                                        <span key={idx} className="text-[10px]">{l.lote}</span>
                                                    ))
                                                ) : <span className="text-[10px]">-</span>}
                                            </span>
                                            <span className="w-[15%] text-xs text-center flex flex-col">
                                                {item?.lotes && item.lotes.length > 0 ? (
                                                    item.lotes.map((l: any, idx: number) => (
                                                        <span key={idx} className="text-[10px]">{moment(l.fechaVencimiento).format('DD/MM/YYYY')}</span>
                                                    ))
                                                ) : <span className="text-[10px]">-</span>}
                                            </span>
                                            <span className="w-[10%] text-xs text-right">{Number(item?.mtoPrecioUnitario || item?.precioUnitario || item?.producto?.precioUnitario || 0).toFixed(2)}</span>
                                            <span className="w-[10%] text-xs text-right">{Number(item?.total || (Number(item?.mtoPrecioUnitario || item?.precioUnitario || item?.producto?.precioUnitario || 0) * item?.cantidad)).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-between mt-2">
                                    <p className="w-1/2 text-xs font-bold">SON: {totalInWords || ''}</p>
                                    <div>
                                        {quotationDiscount > 0 && (
                                            <p className="text-xs text-green-600"><span className="font-bold">DESCUENTO ({quotationDiscount}%):</span> - S/ {round2(Number(total) * quotationDiscount / 100).toFixed(2)}</p>
                                        )}
                                        <p className="text-xs"><span className="font-bold">IMPORTE TOTAL:</span> S/ {quotationDiscount > 0 ? round2(Number(total) * (1 - quotationDiscount / 100)).toFixed(2) : round2(Number(total)).toFixed(2)}</p>
                                        {shouldShowRetention && (
                                            <>
                                                <p className="text-xs"><span className="font-bold">RETENCIÓN (3%):</span> S/ {displayRetencionMonto.toFixed(2)}</p>
                                                <p className="text-xs"><span className="font-bold">IMPORTE NETO:</span> S/ {Number(Number(total) - displayRetencionMonto).toFixed(2)}</p>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="border border-black p-2 mt-2 relative mb-10">
                                    <p className="text-xs"><span className="font-bold">OBSERVACIONES:</span><br />{observation?.toUpperCase() || ''}<br />Representación impresa del Comprobante de Pago Electrónico.<br />Autorizado mediante Resolución de Intendencia N° 080-005-000153/SUNAT.<br />Emite a través de APISPERU - Proveedor Autorizado por SUNAT.</p>
                                    {qrCodeDataUrl && !receipt?.includes("COTIZACIÓN") && <img src={qrCodeDataUrl} alt="QR" className="absolute bottom-2 right-2 w-12 h-12" />}
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