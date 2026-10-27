import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import DrawerHearth, { DRAWER_BTN, DRAWER_H3, DRAWER_INPUT, DRAWER_ROW, DrawerDato } from '@/components/DrawerHearth';
import moment from 'moment';
import { useReactToPrint } from 'react-to-print';
import Button from '@/components/Button';
import ModalConfirm from '@/components/ModalConfirm';
import { get, post, put, patch } from '@/utils/fetch';
import { useAuthStore } from '@/zustand/auth';
import { useUsersStore } from '@/zustand/users';
import Select from '@/components/Select';
import useAlertStore from '@/zustand/alert';
import ComprobantePrintPage from './comprobanteImprimir';
import { numberToWords } from '@/utils/numberToLetters';
import { hasPlanFeature } from '@/utils/permissions';
import { buildComprobantePrintPageStyle } from '@/utils/printStyles';
import { etiquetaMedioPago, lineasPagoMixto } from '@/utils/pagoMixto';

// ─── Types ───────────────────────────────────────────────────────────────────

type PrintSize = 'TICKET' | 'A4' | 'A5';

const ESTADOS_DESPACHO = [
    { id: 'PREPARANDO', value: 'Preparando',   icon: 'solar:box-bold-duotone',           color: '#F59E0B', bg: 'bg-amber-50  border-amber-200  text-amber-600'   },
    { id: 'EN_CAMINO',  value: 'En camino',    icon: 'solar:delivery-bold-duotone',      color: '#3B82F6', bg: 'bg-blue-50   border-blue-200   text-blue-600'    },
    { id: 'EN_DESTINO', value: 'En destino',   icon: 'solar:map-point-bold-duotone',     color: '#8B5CF6', bg: 'bg-violet-50 border-violet-200 text-violet-600'  },
    { id: 'ENTREGADO',  value: 'Entregado',    icon: 'solar:check-circle-bold-duotone',  color: '#10B981', bg: 'bg-emerald-50 border-emerald-200 text-emerald-600' },
    { id: 'DEVUELTO',   value: 'Devuelto',     icon: 'solar:arrow-left-bold-duotone',    color: '#EF4444', bg: 'bg-red-50    border-red-200    text-red-600'     },
];

const PRINT_SIZES: { id: PrintSize; label: string; icon: string }[] = [
    { id: 'TICKET', label: 'Ticket 80mm', icon: 'solar:printer-minimalistic-bold-duotone' },
    { id: 'A4',     label: 'A4',          icon: 'solar:document-bold-duotone' },
    { id: 'A5',     label: 'A5',          icon: 'solar:document-bold-duotone' },
];

const PRINT_DIMENSIONS: Record<PrintSize, { width: number; height: number }> = {
    TICKET: { width: 80,  height: 330 },
    A4:     { width: 210, height: 297 },
    A5:     { width: 148, height: 210 },
};

const COMPROBANTE_LABELS: Record<string, string> = {
    '01': 'FACTURA',
    '03': 'BOLETA',
    '07': 'NOTA DE CRÉDITO',
    '08': 'NOTA DE DÉBITO',
    NV: 'NOTA DE VENTA',
    NP: 'NOTA DE PEDIDO',
    OT: 'ORDEN DE TRABAJO',
    TICKET: 'TICKET',
    CP: 'COMPROBANTE DE PAGO',
    RH: 'RECIBO POR HONORARIO',
};

const getEstado = (id: string) => ESTADOS_DESPACHO.find(e => e.id === id) ?? ESTADOS_DESPACHO[0];
const unwrapApiPayload = (response: any) => {
    if (!response || response.success === false) return null;
    return response.data ?? response;
};
const getComprobanteLabel = (comprobante: any) => (
    comprobante?.comprobante ||
    COMPROBANTE_LABELS[String(comprobante?.tipoDoc ?? '')] ||
    comprobante?.tipoDoc ||
    'COMPROBANTE'
);
const getComprobanteTotal = (comprobante: any) => Number(
    comprobante?.mtoImpVenta ??
    comprobante?.total ??
    comprobante?.subTotal ??
    comprobante?.valorVenta ??
    0
);
const getDetalleDescripcion = (detalle: any) => (
    detalle?.descripcion ||
    detalle?.producto?.descripcion ||
    detalle?.producto?.nombre ||
    'Producto / servicio'
);
const getDetallePrecio = (detalle: any) => Number(
    detalle?.mtoPrecioUnitario ??
    detalle?.mtoValorUnitario ??
    detalle?.precioUnitario ??
    0
);
const getDetalleSubtotal = (detalle: any) => Number(
    detalle?.mtoValorVenta ??
    detalle?.subtotal ??
    (Number(detalle?.cantidad ?? 0) * getDetallePrecio(detalle))
);
// Línea marcada como operación gratuita (Catálogo 07: 11-16/21/31-37) — no suma al
// total a pagar, pero el precio referencial se muestra igual (tachado + "GRATIS")
// para que no parezca un error de suma en el detalle.
const esDetalleGratuito = (detalle: any) => {
    const n = Number(detalle?.tipAfeIgv ?? detalle?.tipoAfectacionIGV ?? 10);
    return (n >= 11 && n <= 16) || n === 21 || (n >= 31 && n <= 37);
};

const planPermiteDespacho = (auth: any) => {
    return hasPlanFeature(auth, 'tieneDeliveryGPS');
};

const hasUsefulText = (value: unknown) => {
    const text = String(value ?? '').trim();
    return Boolean(text) && !['-', '—', 'NO_APLICA', 'NULL', 'UNDEFINED'].includes(text.toUpperCase());
};

const hasRealDespacho = (envio: any) => {
    if (!envio?.id) return false;

    const estado = String(envio.estado ?? '').trim().toUpperCase();
    if (estado && estado !== 'PREPARANDO' && estado !== 'NO_APLICA') return true;

    const hasDestino = hasUsefulText(envio.direccionDestino) || hasUsefulText(envio.agenciaDestino);
    const hasCourier = hasUsefulText(envio.transportista);
    const hasTracking = hasUsefulText(envio.codigoGuia) || hasUsefulText(envio.nroOrden) || hasUsefulText(envio.claveOrden);
    const hasContacto = String(envio.celularDest ?? '').replace(/\D/g, '').length >= 9;
    const hasFecha = hasUsefulText(envio.fechaEstimada);
    const hasPaquetes = Number(envio.nroPaquetes ?? 0) > 0;
    const hasOperativo = hasUsefulText(envio.establecimiento) || hasUsefulText(envio.empaquetador) || hasUsefulText(envio.repartidor);

    return hasCourier || hasDestino || hasTracking || hasContacto || hasFecha || hasPaquetes || hasOperativo;
};

// ─── Component ───────────────────────────────────────────────────────────────

interface Props {
    comprobanteId: number | null;
    isOpen: boolean;
    onClose: () => void;
    // Se dispara cuando algo del comprobante cambió (p. ej. el vendedor de campo),
    // para que la vista que abrió el modal refresque su listado.
    onUpdated?: () => void;
}

export default function ModalDetalleComprobante({ comprobanteId, isOpen, onClose, onUpdated }: Props) {
    const { auth } = useAuthStore();
    const { alert } = useAlertStore();
    const navigate = useNavigate();
    const puedeDespacho = planPermiteDespacho(auth);

    const [comprobante, setComprobante] = useState<any>(null);
    const [envio, setEnvio] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // ── Cobranza en campo: reasignar vendedor de campo (retroactivo) ──
    const cobranzaCampo = Boolean((auth as any)?.empresa?.cobranzaCampo);
    const { usuarios, getAllUsers } = useUsersStore();
    const [guardandoVendedorCampo, setGuardandoVendedorCampo] = useState(false);
    useEffect(() => {
        if (isOpen && cobranzaCampo) getAllUsers({ page: 1, limit: 100 });
    }, [isOpen, cobranzaCampo]); // eslint-disable-line react-hooks/exhaustive-deps

    const guardarVendedorCampo = async (vendedorCampoId: number | null) => {
        if (!comprobante?.id) return;
        if (comprobante?.comisionLiquidada) {
            alert('La comisión de esta venta ya fue liquidada; no se puede cambiar el vendedor.', 'error');
            return;
        }
        const nombre = usuarios.find((u: any) => u.id === vendedorCampoId)?.nombre ?? null;
        setGuardandoVendedorCampo(true);
        try {
            await patch(`comprobante/${comprobante.id}/vendedor-campo`, {
                vendedorCampoId,
                vendedorCampoNombre: nombre,
            });
            setComprobante((prev: any) => prev ? { ...prev, vendedorCampoId, vendedorCampoNombre: nombre } : prev);
            alert('Vendedor de campo actualizado', 'success');
            onUpdated?.();
        } catch (e: any) {
            alert(e?.message || 'No se pudo actualizar el vendedor', 'error');
        } finally {
            setGuardandoVendedorCampo(false);
        }
    };

    // ── Print / Share state ──
    const [printSize, setPrintSize] = useState<PrintSize>('TICKET');
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [generandoPdf, setGenerandoPdf] = useState(false);
    const [shouldPrint, setShouldPrint] = useState(false);
    const componentRef = useRef<HTMLDivElement>(null);

    // ── WhatsApp / Email state ──
    const [waNumber, setWaNumber] = useState('');
    const [emailDest, setEmailDest] = useState('');
    const [enviandoEmail, setEnviandoEmail] = useState(false);

    const load = useCallback(async () => {
        if (!comprobanteId) return;
        setLoading(true);
        try {
            const [respComp, respEnvio] = await Promise.all([
                get<any>(`comprobante/${comprobanteId}`),
                puedeDespacho
                    ? get<any>(`envio-despacho/comprobante/${comprobanteId}`).catch(() => null)
                    : Promise.resolve(null),
            ]);
            const comp = unwrapApiPayload(respComp);
            if (!comp) return;
            setComprobante(comp);
            setWaNumber(comp?.cliente?.telefono || comp?.cliente?.celular || '');
            setEmailDest(comp?.cliente?.email || '');
            setEnvio(unwrapApiPayload(respEnvio));
        } finally {
            setLoading(false);
        }
    }, [comprobanteId, puedeDespacho]);

    useEffect(() => {
        if (!isOpen || !comprobanteId) return;
        setComprobante(null);
        setEnvio(null);
        setPdfUrl(null);
        load();
    }, [isOpen, comprobanteId, load]);

    // ── Print logic ──
    const dim = PRINT_DIMENSIONS[printSize];
    const printFn = useReactToPrint({
        // @ts-ignore
        contentRef: componentRef,
        pageStyle: buildComprobantePrintPageStyle(dim),
        // Nombre sugerido al "Guardar como PDF": serie-correlativo del comprobante
        documentTitle: comprobante?.serie ? `${comprobante.serie}-${comprobante.correlativo}` : undefined,
    });

    useEffect(() => {
        if (!shouldPrint || !comprobante) return;
        const timer = setTimeout(() => {
            if (componentRef?.current) printFn();
            setShouldPrint(false);
        }, 400);
        return () => clearTimeout(timer);
    }, [shouldPrint, comprobante, printFn]);

    const handleImprimir = () => setShouldPrint(true);

    const handleGenerarPdf = async (): Promise<string | null> => {
        if (pdfUrl) return pdfUrl;
        if (!comprobanteId) return null;
        setGenerandoPdf(true);
        try {
            const res = await post<{ pdfUrl: string }>(`comprobante/${comprobanteId}/generar-pdf?force=true`, {});
            const url = (res as any)?.data?.pdfUrl || (res as any)?.pdfUrl;
            if (url) { setPdfUrl(url); return url; }
            return null;
        } finally {
            setGenerandoPdf(false);
        }
    };

    const handleCompartirPdf = async () => {
        const url = await handleGenerarPdf();
        if (url) window.open(url, '_blank');
        else alert('No se pudo generar el PDF', 'error');
    };

    const handlePdfServidor = async () => {
        const url = await handleGenerarPdf();
        if (url) window.open(url, '_blank');
        else alert('No se pudo generar el PDF desde el servidor', 'error');
    };

    // ── WhatsApp ──
    // Siempre regenera el PDF antes de armar el link: usar comprobante.s3PdfUrl
    // directamente mandaba al cliente un PDF cacheado con la plantilla o marca
    // (branding) de la primera vez que se generó, en vez de la vigente.
    const handleEnviarWhatsApp = async () => {
        const num = waNumber.trim().replace(/\D/g, '');
        if (!num) { alert('Ingrese un número de WhatsApp válido', 'error'); return; }
        const link = await handleGenerarPdf();
        if (!link) {
            alert('No se pudo generar el PDF para compartir', 'error');
            return;
        }
        const finalNum = num.startsWith('51') ? num : `51${num}`;
        const serie = `${comprobante.serie}-${String(comprobante.correlativo).padStart(8, '0')}`;
        const monto = `${monedaSimbolo} ${getComprobanteTotal(comprobante).toFixed(2)}`;
        const mensaje = encodeURIComponent(
            `Hola ${comprobante?.cliente?.nombre || ''}, te enviamos tu ${getComprobanteLabel(comprobante)} ${serie} por ${monto}.\n\nPuedes descargarlo aquí: ${link}`
        );
        window.open(`https://wa.me/${finalNum}?text=${mensaje}`, '_blank');
    };

    // ── Email ──
    const handleEnviarEmail = async () => {
        const email = emailDest.trim();
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            alert('Ingrese un correo electrónico válido', 'error');
            return;
        }
        if (!comprobanteId) return;
        setEnviandoEmail(true);
        const res = await post(`comprobante/${comprobanteId}/enviar-email`, { email });
        setEnviandoEmail(false);
        if ((res as any).error) { alert((res as any).error, 'error'); return; }
        alert('Correo enviado correctamente', 'success');
    };

    const total = getComprobanteTotal(comprobante);
    const monedaSimbolo = String(comprobante?.tipoMoneda || '').toUpperCase() === 'USD' ? 'US$' : 'S/';
    const comprobanteLabel = getComprobanteLabel(comprobante);
    // Condición de pago (crédito) — no depende del medio de pago: una venta al
    // crédito tiene medioPago 'EFECTIVO' por defecto pero formaPagoTipo=CREDITO
    // / estadoPago pendiente / saldo>0.
    const esVentaCredito =
        String(comprobante?.formaPagoTipo || '').toUpperCase() === 'CREDITO' ||
        ['PENDIENTE_PAGO', 'PAGO_PARCIAL'].includes(
            String(comprobante?.estadoPago || '').toUpperCase(),
        ) ||
        Number(comprobante?.saldo || 0) > 0;
    const showDespacho = puedeDespacho && hasRealDespacho(envio);

    return (
        <>
        {/* Hidden print component */}
        {comprobante && (
            <div style={{ position: 'fixed', left: '-9999px', top: '-9999px', visibility: 'hidden', pointerEvents: 'none', zIndex: -1 }}>
                <ComprobantePrintPage
                    company={auth}
                    componentRef={componentRef}
                    formValues={comprobante}
                    size={printSize}
                    serie={comprobante.serie}
                    correlative={comprobante.correlativo}
                    productsInvoice={comprobante.detalles}
                    total={total.toFixed(2)}
                    mode="off"
                    qrCodeDataUrl={undefined}
                    discount={comprobante.mtoDescuentoGlobal ? comprobante.mtoDescuentoGlobal.toString() : null}
                    receipt={comprobanteLabel}
                    selectedClient={comprobante.cliente}
                    totalInWords={numberToWords(total) + ' SOLES'}
                    observation={comprobante.observaciones}
                    includeProductImages={false}
                    quotationDiscount={0}
                    quotationValidity={7}
                    quotationSignature=""
                    quotationTerms=""
                />
            </div>
        )}

        <DrawerHearth isOpen={isOpen} onClose={onClose} label="Detalle del comprobante" contentKey={comprobante?.id ?? null}>
            {loading ? (
                <div className="py-24 flex flex-col items-center justify-center gap-3 text-[#978f86]">
                    <Icon icon="line-md:loading-twotone-loop" className="text-4xl" />
                    <span className="text-sm">Cargando comprobante...</span>
                </div>
            ) : comprobante ? (
                <div data-drawer-stagger className="flex flex-col gap-6">

                    {/* ── Cabecera ── */}
                    <header className="flex items-start gap-4 pr-12">
                        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#e8e6fb] text-[#4a41c4] dark:bg-[#7a72e6]/20 dark:text-[#aaa4f5]">
                            <Icon icon="solar:document-text-linear" width={26} />
                        </span>
                        <div className="min-w-0">
                            <h2 className="text-[26px] font-bold leading-tight text-[#1d1915] dark:text-slate-100">
                                {comprobanteLabel.charAt(0) + comprobanteLabel.slice(1).toLowerCase()} {comprobante.serie}-{String(comprobante.correlativo).padStart(8, '0')}
                            </h2>
                            <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-[14px] font-semibold text-[#6b645c] dark:text-slate-400">
                                {moment(comprobante.fechaEmision).format('DD/MM/YYYY · HH:mm')}
                                <span aria-hidden>·</span>
                                <SunatEstado estado={comprobante.estadoEnvioSunat} />
                            </p>
                        </div>
                    </header>

                    <p className="-mt-1 text-[15px] text-[#4a443d] dark:text-slate-300">
                        Emitido a <b className="font-bold text-[#1d1915] dark:text-slate-100">{comprobante.cliente?.nombre || 'cliente sin nombre'}</b>
                        {comprobante.cliente?.nroDoc ? ` (${comprobante.cliente.nroDoc})` : ''}.
                    </p>

                    {/* ── Total ── */}
                    <div className="flex items-center justify-between gap-4 rounded-2xl bg-[#f3eee6] px-5 py-4 dark:bg-slate-800/70">
                        <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-[#6b645c] dark:text-slate-400">Total</p>
                            <p className="text-[24px] font-bold leading-tight text-[#1d1915] tabular-nums dark:text-slate-100" style={{ fontFamily: "'Bricolage Grotesque', 'Manrope', sans-serif" }}>
                                {monedaSimbolo} {total.toFixed(2)}
                            </p>
                        </div>
                        <button type="button" onClick={handleImprimir} className={BTN}>
                            <Icon icon="solar:printer-minimalistic-linear" width={17} />
                            Imprimir
                        </button>
                    </div>

                    {/* ── Datos ── */}
                    <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
                        <Dato label="Cliente" value={comprobante.cliente?.nombre || '-'} />
                        <Dato label="Documento" value={comprobante.cliente?.nroDoc || '-'} />
                        <Dato
                            label="Forma de pago"
                            value={esVentaCredito
                                ? `Crédito${comprobante.medioPago ? ` · ${comprobante.medioPago}` : ''}`
                                : comprobante.medioPago || 'Sin medio de pago'}
                            extra={String(comprobante.medioPago || '').toUpperCase() === 'MIXTO'
                                ? lineasPagoMixto(comprobante).map((l) => `${etiquetaMedioPago(l.method)} ${monedaSimbolo} ${l.amount.toFixed(2)}`)
                                : undefined}
                        />
                        <Dato label="IGV (18%)" value={`${monedaSimbolo} ${Number(comprobante.mtoIGV ?? 0).toFixed(2)}`} />
                    </dl>

                    {/* ── Cobranza en campo: reasignar vendedor de campo ── */}
                    {cobranzaCampo && (
                        <section>
                            <h3 className={H3}>Vendedor de campo</h3>
                            <Select
                                error=""
                                label=""
                                name="vendedorCampoDetalle"
                                value={comprobante.vendedorCampoNombre || comprobante.usuario?.nombre || ''}
                                options={(usuarios || []).map((u: any) => ({ id: u.id, value: u.nombre || u.email || `Usuario ${u.id}` }))}
                                onChange={(id: any) => guardarVendedorCampo(Number(id) || null)}
                                disabled={!!comprobante.comisionLiquidada || guardandoVendedorCampo}
                            />
                            <p className="mt-1.5 text-[13px] text-[#6b645c] dark:text-slate-400">
                                {comprobante.comisionLiquidada
                                    ? 'La comisión de esta venta ya fue liquidada (pagada al vendedor). No se puede cambiar el vendedor.'
                                    : guardandoVendedorCampo
                                        ? 'Guardando…'
                                        : 'Se muestra como vendedor en el panel, la nota de venta y el comprobante. Al cambiarlo, la comisión se recalcula para el nuevo vendedor.'}
                            </p>
                        </section>
                    )}

                    {/* ── Productos ── */}
                    <section>
                        <h3 className={H3}>Productos y servicios ({comprobante.detalles?.length ?? 0})</h3>
                        <ul>
                            {(comprobante.detalles ?? []).map((det: any, i: number) => (
                                <li key={i} className={ROW}>
                                    <div className="min-w-0 flex-1">
                                        <p className="flex items-center gap-1.5 text-[15px] font-bold text-[#1d1915] dark:text-slate-100">
                                            <span className="truncate">{getDetalleDescripcion(det)}</span>
                                            {esDetalleGratuito(det) && (
                                                <span className="shrink-0 rounded-full bg-[#dcf2ec] px-2 py-0.5 text-[11px] font-bold text-[#0a7a63] dark:bg-emerald-500/15 dark:text-emerald-300">Gratis</span>
                                            )}
                                        </p>
                                        <p className="mt-0.5 text-[13px] text-[#6b645c] dark:text-slate-400">
                                            {Number(det.cantidad ?? 0)} {det.unidad || 'NIU'} × {monedaSimbolo} {getDetallePrecio(det).toFixed(2)}
                                            {esDetalleGratuito(det) && ' · valor referencial'}
                                        </p>
                                    </div>
                                    <p className={`shrink-0 text-[15px] font-bold tabular-nums ${esDetalleGratuito(det) ? 'text-[#978f86] line-through' : 'text-[#1d1915] dark:text-slate-100'}`}>
                                        {monedaSimbolo} {getDetalleSubtotal(det).toFixed(2)}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    </section>

                    {/* ── Imprimir y compartir ── */}
                    <section>
                        <h3 className={H3}>Imprimir y compartir</h3>
                        <div className="inline-flex rounded-xl bg-[rgba(40,30,20,0.055)] p-[3px] dark:bg-white/5">
                            {PRINT_SIZES.map(s => (
                                <button
                                    key={s.id}
                                    type="button"
                                    aria-pressed={printSize === s.id}
                                    onClick={() => setPrintSize(s.id)}
                                    className={`rounded-[10px] px-3.5 py-[7px] text-[12.5px] font-bold transition-all ${printSize === s.id
                                        ? 'bg-[#fffdfa] text-[#1d1915] shadow-[0_1px_2px_rgba(0,0,0,0.06),0_4px_10px_-4px_rgba(0,0,0,0.14)] dark:bg-slate-700 dark:text-slate-100'
                                        : 'text-[#6b645c] dark:text-slate-400'}`}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                            <button type="button" onClick={handleImprimir} className={BTN}>
                                <Icon icon="solar:printer-minimalistic-linear" width={17} />
                                Imprimir
                            </button>
                            <button type="button" onClick={handleCompartirPdf} disabled={generandoPdf} className={BTN}>
                                <Icon icon={generandoPdf ? 'line-md:loading-twotone-loop' : 'solar:share-linear'} width={17} />
                                Compartir PDF
                            </button>
                            <button type="button" onClick={handlePdfServidor} disabled={generandoPdf} className={BTN}>
                                <Icon icon={generandoPdf ? 'line-md:loading-twotone-loop' : 'solar:cloud-download-linear'} width={17} />
                                PDF servidor
                            </button>
                        </div>
                    </section>

                    {/* ── Enviar ── */}
                    <section>
                        <h3 className={H3}>Enviar al cliente</h3>
                        <div className={ROW}>
                            <div className="min-w-0 flex-1">
                                <p className="text-[15px] font-bold text-[#1d1915] dark:text-slate-100">WhatsApp</p>
                                <p className="mt-0.5 text-[13px] text-[#6b645c] dark:text-slate-400">Va con el enlace al PDF vigente.</p>
                                <div className="mt-2 flex gap-2">
                                    <input type="text" value={waNumber} onChange={e => setWaNumber(e.target.value)} placeholder="Número (ej: 51999...)" className={INPUT} />
                                    <button type="button" onClick={handleEnviarWhatsApp} className={`${BTN} shrink-0`}>
                                        <Icon icon="mdi:whatsapp" width={17} className="text-[#0a8f74]" />
                                        Enviar
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className={ROW}>
                            <div className="min-w-0 flex-1">
                                <p className="text-[15px] font-bold text-[#1d1915] dark:text-slate-100">Correo</p>
                                <p className="mt-0.5 text-[13px] text-[#6b645c] dark:text-slate-400">Adjunta el comprobante en PDF.</p>
                                <div className="mt-2 flex gap-2">
                                    <input type="email" value={emailDest} onChange={e => setEmailDest(e.target.value)} placeholder="Correo electrónico" className={INPUT} />
                                    <button type="button" onClick={handleEnviarEmail} disabled={enviandoEmail} className={`${BTN} shrink-0`}>
                                        <Icon icon={enviandoEmail ? 'line-md:loading-twotone-loop' : 'solar:letter-linear'} width={17} />
                                        Enviar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ── Seguimiento de despacho (solo lectura) ── */}
                    {showDespacho && (
                        <section>
                            <h3 className={H3}>Seguimiento de despacho</h3>
                            <p className="mb-3 text-[14px] font-semibold text-[#6b645c] dark:text-slate-400">
                                Estado: <b className="text-[#1d1915] dark:text-slate-100">{getEstado(envio.estado).value}</b>
                            </p>
                            <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
                                <Dato label="Transportista" value={envio.transportista || '-'} />
                                <Dato label="Código guía / SKU" value={envio.codigoGuia || '-'} />
                                <Dato label="Dirección destino" value={envio.direccionDestino || '-'} />
                                <Dato label="Fecha estimada" value={envio.fechaEstimada ? moment(envio.fechaEstimada).format('DD/MM/YYYY') : '-'} />
                            </dl>
                            <button
                                type="button"
                                onClick={() => { onClose(); navigate(`/administrador/ventas?fecha=${moment(comprobante.fechaEmision).format('YYYY-MM-DD')}&comprobanteId=${comprobante.id}`); }}
                                className={`${BTN} mt-4`}
                            >
                                <Icon icon="solar:arrow-right-up-linear" width={17} />
                                Ir al Panel de Despacho
                            </button>
                        </section>
                    )}
                </div>
            ) : (
                <div className="py-16 text-center text-sm text-[#978f86]">
                    No se pudo cargar el comprobante
                </div>
            )}
        </DrawerHearth>

</>
    );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

const BTN = DRAWER_BTN;
const H3 = DRAWER_H3;
const ROW = DRAWER_ROW;
const INPUT = DRAWER_INPUT;

function SunatEstado({ estado }: { estado: string }) {
    const map: Record<string, { label: string; dot: string; text: string }> = {
        ACEPTADO:  { label: 'Aceptado',  dot: 'bg-[#0a8f74]', text: 'text-[#0a7a63] dark:text-emerald-300' },
        EMITIDO:   { label: 'Emitido',   dot: 'bg-[#0a8f74]', text: 'text-[#0a7a63] dark:text-emerald-300' },
        ENVIANDO:  { label: 'Enviando a SUNAT', dot: 'bg-[#c98a12]', text: 'text-[#8f600a] dark:text-amber-300' },
        PENDIENTE_CONCILIACION: { label: 'Conciliación SUNAT', dot: 'bg-[#5b52d6]', text: 'text-[#4a41c4] dark:text-indigo-300' },
        FALLIDO_ENVIO: { label: 'Fallido envío', dot: 'bg-[#e4572e]', text: 'text-[#b53f19] dark:text-orange-300' },
        PENDIENTE: { label: 'Pendiente', dot: 'bg-[#c98a12]', text: 'text-[#8f600a] dark:text-amber-300' },
        RECHAZADO: { label: 'Rechazado', dot: 'bg-[#e4572e]', text: 'text-[#b53f19] dark:text-orange-300' },
        ANULADO:   { label: 'Anulado',   dot: 'bg-[#978f86]', text: 'text-[#6b645c] dark:text-slate-400' },
        NO_APLICA: { label: 'Sin envío a SUNAT', dot: 'bg-[#978f86]', text: 'text-[#6b645c] dark:text-slate-400' },
    };
    const info = map[estado] ?? { label: estado || '—', dot: 'bg-[#978f86]', text: 'text-[#6b645c]' };
    return (
        <span className={`inline-flex items-center gap-1.5 ${info.text}`}>
            <span className={`h-2 w-2 rounded-full ${info.dot}`} />
            {info.label}
        </span>
    );
}

const Dato = DrawerDato;
