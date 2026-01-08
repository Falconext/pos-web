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
}: any) => {


    const localComponentRef = useRef(null);

    useEffect(() => {
        // Force re-render or update logic if needed
        // This ensures the component updates when props change
    }, [productsInvoice, totalInWords, qrCodeDataUrl, observation, company, formValues, mode, total, receipt, selectedClient, discount, size, includeProductImages, quotationDiscount, quotationValidity, quotationSignature]);

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
                                            <span className={`${size === 'TICKET' ? 'text-[18px]' : 'text-xs'}`}>{formValues.tipoDetraccion.codigo} - {formValues.tipoDetraccion.descripcion} ({formValues.tipoDetraccion.porcentaje}%)</span>
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
                                                <span className={`${size === 'TICKET' ? 'text-[18px]' : 'text-xs'}`}>{formValues.medioPagoDetraccion.codigo} - {formValues.medioPagoDetraccion.descripcion}</span>
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
                        <label className={`${size === 'TICKET' ? 'text-[18px]' : 'text-xs'} flex justify-between`}><div className="">TOTAL GRAVADAS:</div> <div>{Number(totalReceipt * 0.82).toFixed(2)}</div></label>
                        <label className={`${size === 'TICKET' ? 'text-[18px]' : 'text-xs'} flex justify-between`}><div className="">I.G.V 18.00 %:</div> <div>{Number(totalReceipt * 0.18).toFixed(2)}</div></label>
                        <label className={`${size === 'TICKET' ? 'text-[18px]' : 'text-xs'} flex justify-between`}><div className="">IMPORTE TOTAL:</div> <div>{Number(totalReceipt).toFixed(2)}</div></label>
                        <hr className="my-1 border-dashed border-[#222]" />
                        <p className={`${size === 'TICKET' ? 'text-[18px]' : 'text-xs'}`}><span className="">CONDICIÓN DE PAGO: </span>{formValues?.formaPagoTipo?.toUpperCase() || 'CONTADO'}</p>
                        {formValues?.formaPagoTipo === 'Credito' && formValues?.cuotas?.length > 0 && (
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
                    <div className="w-full">
                        {/* Use visual layout with images for quotations */}
                        {receipt === "COTIZACIÓN" && includeProductImages ? (
                            <div className="w-full">
                                <div className="flex justify-between items-start mb-4">
                                    {logoDataUrl && <img src={logoDataUrl} alt="logo" className="w-[150px] h-[150px] mr-4 object-contain object-left" />}
                                    <div className="flex-1">
                                        <h6 className="text-xl font-bold">{company?.empresa?.nombreComercial.toUpperCase()}</h6>
                                        <p className="text-xs">{company?.empresa?.direccion}<br />{company?.empresa?.rubro?.nombre?.toUpperCase()}<br />RUC: {company?.empresa?.ruc}</p>
                                    </div>
                                    <div className="border border-black px-4 pt-2 pb-2 text-center">
                                        <div className="text-xs">RUC: {company?.empresa?.ruc}</div>
                                        <div className="text-lg font-bold">COTIZACIÓN</div>
                                        <div>{formValues?.serie}-{formValues?.correlativo}</div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                                    <div>
                                        <p><span className="font-bold">CLIENTE:</span> {selectedClient?.nombre?.toUpperCase() || ''}</p>
                                        <p><span className="font-bold">RUC/DNI:</span> {selectedClient?.nroDoc || ''}</p>
                                    </div>
                                    <div className="text-right">
                                        <p><span className="font-bold">FECHA:</span> {new Date().toLocaleDateString()}</p>
                                        <p><span className="font-bold">VIGENCIA:</span> 7 días</p>
                                    </div>
                                </div>
                                <div className="border border-gray-300 rounded-lg overflow-hidden mb-3">
                                    <div className="grid grid-cols-12 gap-2 bg-gray-100 p-2 text-xs font-bold border-b">
                                        <div className="col-span-2 text-center">IMAGEN</div>
                                        <div className="col-span-5">DESCRIPCIÓN</div>
                                        <div className="col-span-1 text-center">CANT.</div>
                                        <div className="col-span-2 text-right">P.U.</div>
                                        <div className="col-span-2 text-right">IMPORTE</div>
                                    </div>
                                    {productsInvoice?.map((item: any, i: any) => (
                                        <div key={i} className="grid grid-cols-12 gap-2 p-2 items-center text-xs">
                                            <div className="col-span-2 flex justify-center">
                                                {item.imagenUrl ? (
                                                    <img src={item.imagenUrl} alt={item.descripcion} className="w-16 h-16 object-cover rounded" />
                                                ) : (
                                                    <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                                                        <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" /></svg>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="col-span-5">
                                                <p className="font-medium">{item?.descripcion?.toUpperCase() || ''}</p>
                                                {item.categoria?.nombre && <p className="text-gray-500 text-[10px]">{item.categoria.nombre}</p>}
                                                {item?.lotes && item.lotes.length > 0 && (
                                                    <div className="flex flex-col mt-1 text-gray-600">
                                                        {item.lotes.map((l: any, idx: number) => (
                                                            <span key={idx} className="text-[9px]">Lote: {l.lote} - Venc: {moment(l.fechaVencimiento).format('DD/MM/YYYY')}</span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="col-span-1 text-center font-medium">{item?.cantidad || 0}</div>
                                            <div className="col-span-2 text-right">S/ {Number(item?.precioUnitario || item?.producto?.precioUnitario || 0).toFixed(2)}</div>
                                            <div className="col-span-2 text-right font-bold">S/ {Number(item?.total || (item?.cantidad * item?.producto?.precioUnitario) || 0).toFixed(2)}</div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-between items-start mb-3">
                                    <div className="w-1/2">
                                        <p className="text-xs font-bold mb-1">SON: {totalInWords || ''}</p>
                                        {observation && <p className="text-xs mt-2"><span className="font-bold">OBSERVACIONES:</span><br />{observation?.toUpperCase()}</p>}
                                    </div>
                                    <div className="w-1/2 bg-gray-50 p-3 rounded border">
                                        <div className="flex justify-between text-xs mb-1">
                                            <span>Subtotal:</span>
                                            <span>S/ {round2(Number(total) / 1.18).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span>IGV (18%):</span>
                                            <span>S/ {round2(Number(total) * 0.18 / 1.18).toFixed(2)}</span>
                                        </div>
                                        {quotationDiscount > 0 && (
                                            <div className="flex justify-between text-xs text-green-600 mb-1">
                                                <span>Descuento ({quotationDiscount}%):</span>
                                                <span>- S/ {round2(Number(total) * quotationDiscount / 100).toFixed(2)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-sm font-bold border-t pt-2 mt-2">
                                            <span>TOTAL:</span>
                                            <span>S/ {quotationDiscount > 0 ? round2(Number(total) * (1 - quotationDiscount / 100)).toFixed(2) : round2(Number(total)).toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-center text-xs text-gray-600 mt-4 pt-3 border-t">
                                    <p>Esta cotización tiene una vigencia de {quotationValidity} día{quotationValidity > 1 ? 's' : ''} calendario</p>
                                    <p className="mt-1">{company?.celular} | {company?.email}</p>
                                    {quotationSignature && (
                                        <div className="mt-6 pt-4 inline-block">
                                            <div className="mb-2">_______________________________</div>
                                            <p className="font-bold">{quotationSignature}</p>
                                            <p className="text-[10px] text-gray-500">Firma del Responsable</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            /* Standard template without images */
                            <div className="w-full">
                                <div className="flex justify-between items-start">
                                    {logoDataUrl && <img src={logoDataUrl} alt="logo" className="w-[150px] h-[150px] object-contain object-left" />}
                                    <div className="flex-1 ml-4">
                                        <h6 className="text-xl font-bold">{company?.empresa?.nombreComercial.toUpperCase()}</h6>
                                        <p className="text-xs">{company?.empresa?.direccion}<br />{company?.empresa?.rubro?.nombre?.toUpperCase()}<br />RAZON SOCIAL: {company?.empresa?.razonSocial}<br />CELULAR: {company?.celular}<br />EMAIL: {company?.email}</p>
                                    </div>
                                    <div className="border border-black px-4 pt-4 pb-2 text-center ml-4">
                                        <div className="text-xs">RUC: {company?.empresa?.ruc}</div>
                                        <div className="text-lg font-bold">{receipt === "COTIZACIÓN" ? "COTIZACIÓN" : receipt}</div>
                                        <div className='font-bold text-lg'>{receipt === "COTIZACIÓN" ? "" : "ELECTRONICA"}</div>
                                        <div>{formValues?.serie}-{formValues?.correlativo}</div>
                                    </div>
                                </div>
                                <div className="flex mt-4 justify-between mb-2">
                                    <div>
                                        <label className="text-xs mt-1 flex"><div className="font-bold w-[100px]">CLIENTE:</div> {selectedClient?.nombre?.toUpperCase() || ''}</label>
                                        <label className="text-xs mt-1 flex"><div className="font-bold w-[100px]">DIRECCION:</div><p className='w-[450px]'> {selectedClient?.direccion?.toUpperCase() || '-'}</p></label>
                                        <label className="text-xs mt-1 flex"><div className="font-bold w-[100px]">FORMA PAGO:</div> {formValues?.formaPagoTipo?.toUpperCase() || 'CONTADO'}</label>
                                        <label className="text-xs mt-1 flex"><div className="font-bold w-[100px]">MEDIO PAGO:</div> {formValues?.medioPago?.toUpperCase()} S/ {round2(totalPrices).toFixed(2)}</label>

                                        {formValues?.formaPagoTipo === 'Credito' && formValues?.cuotas?.length > 0 && (
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
                                                <span className="text-xs">{formValues.tipoDetraccion.codigo} - {formValues.tipoDetraccion.descripcion} ({formValues.tipoDetraccion.porcentaje}%)</span>
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
                                                    <span className="text-xs">{formValues.medioPagoDetraccion.codigo} - {formValues.medioPagoDetraccion.descripcion}</span>
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
                                    </div>
                                </div>
                                <div className="border border-black p-2 mt-2 relative mb-10">
                                    {receipt === "COTIZACIÓN" ? (
                                        /* Quotation-specific footer */
                                        <div>
                                            <p className="text-xs"><span className="font-bold">OBSERVACIONES:</span><br />{observation?.toUpperCase() || ''}</p>

                                            {quotationTerms && (
                                                <p className="text-xs mt-2"><span className="font-bold">TÉRMINOS Y CONDICIONES:</span><br />{quotationTerms}</p>
                                            )}

                                            <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                                                <div>
                                                    <span className="font-bold">CONDICIÓN DE PAGO:</span> {
                                                        quotationPaymentType === 'CONTADO' ? 'Contado' :
                                                            quotationPaymentType === 'CREDITO_30' ? 'Crédito 30 días' :
                                                                quotationPaymentType === 'CREDITO_60' ? 'Crédito 60 días' :
                                                                    quotationPaymentType === 'CREDITO_90' ? 'Crédito 90 días' :
                                                                        quotationPaymentType === 'ADELANTO' ? `Adelanto ${quotationAdvance}%` : 'Contado'
                                                    }
                                                </div>
                                                <div className="text-right">
                                                    <span className="font-bold">VIGENCIA:</span> {quotationValidity} día{quotationValidity > 1 ? 's' : ''}
                                                </div>
                                            </div>

                                            <p className="text-xs mt-2 text-center">{company?.celular} | {company?.email}</p>
                                            {quotationSignature && (
                                                <div className="mt-6 pt-4 border-t text-center">
                                                    <div className="mb-2">_______________________________</div>
                                                    <p className="font-bold">{quotationSignature}</p>
                                                    <p className="text-[10px] text-gray-500">Firma del Responsable</p>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        /* Standard invoice footer */
                                        <p className="text-xs"><span className="font-bold">OBSERVACIONES:</span><br />{observation?.toUpperCase() || ''}<br />Representación impresa del Comprobante de Pago Electrónico.<br />Autorizado mediante Resolución de Intendencia N° 080-005-000153/SUNAT.<br />Emite a través de APISPERU - Proveedor Autorizado por SUNAT.</p>
                                    )}
                                    {qrCodeDataUrl && !receipt?.includes("COTIZACIÓN") && <img src={qrCodeDataUrl} alt="QR" className="absolute bottom-2 right-2 w-12 h-12" />}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ComprobantePrintPage;