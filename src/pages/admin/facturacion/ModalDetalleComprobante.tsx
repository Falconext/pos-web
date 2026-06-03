import { useCallback, useEffect, useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import moment from 'moment';
import { useReactToPrint } from 'react-to-print';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import InputPro from '@/components/InputPro';
import { Calendar } from '@/components/Date';
import ModalConfirm from '@/components/ModalConfirm';
import { get, post, put } from '@/utils/fetch';
import { useAuthStore } from '@/zustand/auth';
import useAlertStore from '@/zustand/alert';
import ComprobantePrintPage from './comprobanteImprimir';
import { numberToWords } from '@/utils/numberToLetters';

// ─── Types ───────────────────────────────────────────────────────────────────

type EstadoDespacho = 'PREPARANDO' | 'EN_CAMINO' | 'EN_DESTINO' | 'ENTREGADO' | 'DEVUELTO';
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

const getEstado = (id: string) => ESTADOS_DESPACHO.find(e => e.id === id) ?? ESTADOS_DESPACHO[0];

const planPermiteDespacho = (auth: any) => {
    const plan = String(auth?.empresa?.plan?.nombre || '').toUpperCase();
    return plan.includes('NEGOCIO') || plan.includes('CORPORAT') || auth?.rol === 'ADMIN_SISTEMA';
};

// ─── Component ───────────────────────────────────────────────────────────────

interface Props {
    comprobanteId: number | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function ModalDetalleComprobante({ comprobanteId, isOpen, onClose }: Props) {
    const { auth } = useAuthStore();
    const { alert } = useAlertStore();
    const puedeDespacho = planPermiteDespacho(auth);

    const [comprobante, setComprobante] = useState<any>(null);
    const [envio, setEnvio] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [savingEnvio, setSavingEnvio] = useState(false);
    const [showDespachoForm, setShowDespachoForm] = useState(false);
    const [confirmDevuelto, setConfirmDevuelto] = useState(false);

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

    const [despachoForm, setDespachoForm] = useState({
        transportista: '',
        codigoGuia: '',
        estado: 'PREPARANDO' as EstadoDespacho,
        observaciones: '',
        direccionDestino: '',
        fechaEstimada: '',
    });

    const load = useCallback(async () => {
        if (!comprobanteId) return;
        setLoading(true);
        try {
            const [respComp, respEnvio] = await Promise.all([
                get<any>(`comprobante/${comprobanteId}`),
                puedeDespacho
                    ? get<any>(`envio-despacho/comprobante/${comprobanteId}`).catch(() => ({ data: null }))
                    : Promise.resolve({ data: null }),
            ]);
            const comp = (respComp as any)?.data ?? respComp;
            setComprobante(comp);
            setWaNumber(comp?.cliente?.telefono || comp?.cliente?.celular || '');
            setEmailDest(comp?.cliente?.email || '');
            const env = (respEnvio as any)?.data ?? null;
            setEnvio(env);
            if (env) {
                setDespachoForm({
                    transportista: env.transportista ?? '',
                    codigoGuia: env.codigoGuia ?? '',
                    estado: env.estado,
                    observaciones: env.observaciones ?? '',
                    direccionDestino: env.direccionDestino ?? '',
                    fechaEstimada: env.fechaEstimada ? moment(env.fechaEstimada).format('YYYY-MM-DD') : '',
                });
            } else if (comp?.cliente?.direccion) {
                setDespachoForm(f => ({ ...f, direccionDestino: comp.cliente.direccion }));
            }
        } finally {
            setLoading(false);
        }
    }, [comprobanteId, puedeDespacho]);

    useEffect(() => {
        if (!isOpen || !comprobanteId) return;
        setComprobante(null);
        setEnvio(null);
        setShowDespachoForm(false);
        setPdfUrl(null);
        load();
    }, [isOpen, comprobanteId, load]);

    // ── Print logic ──
    const dim = PRINT_DIMENSIONS[printSize];
    const printFn = useReactToPrint({
        // @ts-ignore
        contentRef: componentRef,
        pageStyle: `
            @import url('https://fonts.googleapis.com/css2?family=VT323&family=Inter:wght@400;500;600;700&display=swap');
            @media print {
                @page { size: ${dim.width}mm ${dim.height}mm; margin: 0; background-color: #fff; }
                * {
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                    font-family: ${dim.width <= 80 ? "'VT323', monospace" : "'Inter', system-ui, sans-serif"} !important;
                }
                body { width: ${dim.width}mm; height: ${dim.height}mm; overflow: hidden; background-color: #fff; }
            }
        `,
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
            const res = await post<{ pdfUrl: string }>(`comprobante/${comprobanteId}/generar-pdf`, {});
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
    const handleEnviarWhatsApp = () => {
        const num = waNumber.trim().replace(/\D/g, '');
        if (!num) { alert('Ingrese un número de WhatsApp válido', 'error'); return; }
        if (!pdfUrl && !comprobante?.s3PdfUrl) {
            alert('Primero genera el PDF para compartirlo', 'warning');
            return;
        }
        const finalNum = num.startsWith('51') ? num : `51${num}`;
        const serie = `${comprobante.serie}-${String(comprobante.correlativo).padStart(8, '0')}`;
        const monto = `S/ ${Number(comprobante.mtoImpVenta ?? 0).toFixed(2)}`;
        const link = pdfUrl || comprobante.s3PdfUrl || '';
        const mensaje = encodeURIComponent(
            `Hola ${comprobante?.cliente?.nombre || ''}, te enviamos tu ${comprobante?.comprobante || 'comprobante'} ${serie} por ${monto}.\n\nPuedes descargarlo aquí: ${link}`
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

    // ── Despacho ──
    const handleSaveDespacho = async () => {
        if (!comprobanteId) return;
        setSavingEnvio(true);
        try {
            const payload = { ...despachoForm, fechaEstimada: despachoForm.fechaEstimada || undefined };
            const res: any = envio
                ? await put(`envio-despacho/comprobante/${comprobanteId}`, payload)
                : await post(`envio-despacho/comprobante/${comprobanteId}`, payload);

            if (res?.error || res?.success === false) {
                alert(res.error || 'Error al guardar el despacho', 'error');
                return;
            }
            await load();
            setShowDespachoForm(false);
            alert(envio ? 'Despacho actualizado' : 'Seguimiento creado', 'success');
        } catch {
            alert('Error al guardar el despacho', 'error');
        } finally {
            setSavingEnvio(false);
        }
    };

    const handleCambiarEstado = async (nuevoEstado: EstadoDespacho) => {
        if (!comprobanteId || !envio) return;
        setSavingEnvio(true);
        try {
            const res: any = await put(`envio-despacho/comprobante/${comprobanteId}`, { estado: nuevoEstado });
            if (res?.error || res?.success === false) {
                alert(res.error || 'Error al cambiar el estado', 'error');
                return;
            }
            await load();
        } catch {
            alert('Error al cambiar el estado', 'error');
        } finally {
            setSavingEnvio(false);
        }
    };

    const total = Number(comprobante?.mtoImpVenta ?? 0);
    const historial: any[] = Array.isArray(envio?.historial) ? envio.historial : [];

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
                    discount={comprobante.discount ?? null}
                    receipt={comprobante.comprobante}
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

        <Modal
            isOpenModal={isOpen}
            closeModal={onClose}
            title="Detalle del comprobante"
            icon="solar:document-text-bold-duotone"
            iconClass="bg-blue-50 dark:bg-blue-900/20 text-blue-600"
            width="800px"
        >
            {loading ? (
                <div className="py-16 flex flex-col items-center justify-center gap-3 text-gray-400">
                    <Icon icon="line-md:loading-twotone-loop" className="text-4xl text-blue-500 animate-spin" />
                    <span className="text-sm">Cargando comprobante...</span>
                </div>
            ) : comprobante ? (
                <div className="divide-y divide-gray-100 dark:divide-slate-800">

                    {/* ── Cabecera ── */}
                    <div className="p-5 grid grid-cols-2 gap-y-4 gap-x-6">
                        <div>
                            <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Comprobante</p>
                            <p className="font-bold text-gray-900 dark:text-white text-lg leading-tight">
                                {comprobante.comprobante}
                            </p>
                            <p className="text-sm text-gray-500 font-mono">
                                {comprobante.serie}-{String(comprobante.correlativo).padStart(8, '0')}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                {moment(comprobante.fechaEmision).format('DD/MM/YYYY HH:mm')}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Total</p>
                            <p className="text-3xl font-black text-gray-900 dark:text-white">
                                S/ {total.toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">{comprobante.medioPago || 'Sin medio de pago'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Cliente</p>
                            <p className="font-semibold text-gray-800 dark:text-gray-200">{comprobante.cliente?.nombre || '-'}</p>
                            <p className="text-xs text-gray-500">{comprobante.cliente?.nroDoc || ''}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Estado SUNAT</p>
                            <SunatBadge estado={comprobante.estadoEnvioSunat} />
                        </div>
                    </div>

                    {/* ── Productos ── */}
                    <div className="p-5">
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
                            Productos / Servicios ({comprobante.detalles?.length ?? 0})
                        </p>
                        <div className="rounded-xl border border-gray-100 dark:border-slate-800 overflow-hidden">
                            {(comprobante.detalles ?? []).map((det: any, i: number) => (
                                <div
                                    key={i}
                                    className="flex items-start justify-between gap-3 px-4 py-3 border-b border-gray-50 dark:border-slate-800/50 last:border-0 hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                                            {det.descripcion}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            {det.unidad} &middot; {Number(det.cantidad)} und &times; S/ {Number(det.mtoPrecioUnitario ?? det.mtoValorUnitario).toFixed(2)}
                                        </p>
                                    </div>
                                    <p className="text-sm font-bold text-gray-800 dark:text-white shrink-0">
                                        S/ {Number(det.mtoValorVenta ?? det.subtotal ?? 0).toFixed(2)}
                                    </p>
                                </div>
                            ))}
                        </div>
                        <div className="mt-3 space-y-1 text-sm">
                            <div className="flex justify-between text-gray-500">
                                <span>IGV (18%)</span>
                                <span>S/ {Number(comprobante.mtoIGV ?? 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-gray-900 dark:text-white pt-1 border-t border-gray-100 dark:border-slate-800">
                                <span>Total</span>
                                <span>S/ {total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* ── Imprimir / Compartir ── */}
                    <div className="p-5 space-y-4">
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                            Imprimir / Compartir
                        </p>

                        {/* Selector de tamaño */}
                        <div className="flex gap-2">
                            {PRINT_SIZES.map(s => (
                                <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => setPrintSize(s.id)}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                                        printSize === s.id
                                            ? 'border-violet-500 text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 ring-1 ring-violet-400'
                                            : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 bg-white dark:bg-slate-800 hover:border-gray-300 dark:hover:border-slate-600'
                                    }`}
                                >
                                    <Icon icon={s.icon} width={13} />
                                    {s.label}
                                </button>
                            ))}
                        </div>

                        {/* Botones de acción */}
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={handleImprimir}
                                className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-slate-800 transition-all"
                            >
                                <Icon icon="solar:printer-minimalistic-bold-duotone" width={16} />
                                Imprimir
                            </button>
                            <button
                                type="button"
                                onClick={handleCompartirPdf}
                                disabled={generandoPdf}
                                className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-slate-800 transition-all disabled:opacity-60"
                            >
                                {generandoPdf ? (
                                    <Icon icon="line-md:loading-twotone-loop" className="text-base" />
                                ) : (
                                    <Icon icon="solar:share-bold-duotone" width={16} />
                                )}
                                Compartir PDF
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={handlePdfServidor}
                            disabled={generandoPdf}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-violet-200 dark:border-violet-800/50 text-violet-600 dark:text-violet-400 text-sm font-semibold hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all disabled:opacity-60"
                        >
                            {generandoPdf ? (
                                <Icon icon="line-md:loading-twotone-loop" className="text-base" />
                            ) : (
                                <Icon icon="solar:cloud-download-bold-duotone" width={16} />
                            )}
                            PDF servidor
                        </button>
                    </div>

                    {/* ── Enviar por WhatsApp ── */}
                    <div className="p-5 space-y-3">
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                            Enviar por WhatsApp
                        </p>
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                                <Icon icon="mdi:whatsapp" className="text-green-600 dark:text-green-400 text-xl" />
                            </div>
                            <input
                                type="text"
                                value={waNumber}
                                onChange={e => setWaNumber(e.target.value)}
                                placeholder="Número (ej: 51999...)"
                                className="flex-1 h-10 px-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
                            />
                            <button
                                type="button"
                                onClick={handleEnviarWhatsApp}
                                className="h-10 px-4 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-bold transition-colors shrink-0"
                            >
                                Enviar
                            </button>
                        </div>
                        {!pdfUrl && !comprobante?.s3PdfUrl && (
                            <p className="text-[11px] text-amber-500 dark:text-amber-400 flex items-center gap-1">
                                <Icon icon="solar:danger-bold" width={12} />
                                Genera el PDF primero para incluir el enlace en el mensaje
                            </p>
                        )}
                    </div>

                    {/* ── Enviar por Correo ── */}
                    <div className="p-5 space-y-3">
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                            Enviar por Correo
                        </p>
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
                                <Icon icon="solar:letter-bold-duotone" className="text-violet-600 dark:text-violet-400 text-xl" />
                            </div>
                            <input
                                type="email"
                                value={emailDest}
                                onChange={e => setEmailDest(e.target.value)}
                                placeholder="Correo electrónico"
                                className="flex-1 h-10 px-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
                            />
                            <button
                                type="button"
                                onClick={handleEnviarEmail}
                                disabled={enviandoEmail}
                                className="h-10 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold transition-colors shrink-0 disabled:opacity-60 flex items-center gap-1.5"
                            >
                                {enviandoEmail && <Icon icon="line-md:loading-twotone-loop" className="text-base" />}
                                Enviar
                            </button>
                        </div>
                    </div>

                    {/* ── Seguimiento de despacho ── */}
                    {puedeDespacho && (
                        <div className="p-5">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Icon icon="solar:delivery-bold-duotone" className="text-blue-500 text-xl" />
                                    <p className="text-sm font-bold text-gray-800 dark:text-white">
                                        Seguimiento de despacho
                                    </p>
                                </div>
                                <Button
                                    color={showDespachoForm ? 'default' : envio ? 'secondary' : 'primary'}
                                    outline={showDespachoForm}
                                    onClick={() => setShowDespachoForm(!showDespachoForm)}
                                >
                                    <Icon icon={showDespachoForm ? 'mdi:close' : envio ? 'solar:pen-bold' : 'solar:add-circle-bold'} width={14} className="mr-1" />
                                    {showDespachoForm ? 'Cancelar' : envio ? 'Editar' : 'Crear despacho'}
                                </Button>
                            </div>

                            {/* Despacho existente */}
                            {envio && !showDespachoForm && (
                                <div className="space-y-5">
                                    <div className="grid grid-cols-2 gap-3">
                                        <InfoCard icon="solar:bus-bold-duotone" label="Transportista" value={envio.transportista || '-'} />
                                        <InfoCard icon="solar:tag-bold-duotone" label="Código guía / SKU" value={envio.codigoGuia || '-'} />
                                        <InfoCard icon="solar:map-point-bold-duotone" label="Dirección destino" value={envio.direccionDestino || '-'} />
                                        <InfoCard
                                            icon="solar:calendar-bold-duotone"
                                            label="Fecha estimada"
                                            value={envio.fechaEstimada ? moment(envio.fechaEstimada).format('DD/MM/YYYY') : '-'}
                                        />
                                    </div>

                                    <div>
                                        <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-2">Estado del envío</p>
                                        <div className="flex flex-wrap gap-2">
                                            {ESTADOS_DESPACHO.map(e => (
                                                <button
                                                    key={e.id}
                                                    type="button"
                                                    disabled={savingEnvio}
                                                    onClick={() => {
                                                        if (e.id === 'DEVUELTO') {
                                                            setConfirmDevuelto(true);
                                                        } else {
                                                            handleCambiarEstado(e.id as EstadoDespacho);
                                                        }
                                                    }}
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all disabled:opacity-50 ${
                                                        envio.estado === e.id
                                                            ? `${e.bg} ring-2 ring-offset-1`
                                                            : 'bg-white dark:bg-slate-800 text-gray-500 border-gray-200 dark:border-slate-700 hover:border-gray-300'
                                                    }`}
                                                >
                                                    <Icon icon={e.icon} width={14} />
                                                    {e.value}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {historial.length > 0 && (
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-3">Historial de estados</p>
                                            <div className="space-y-0">
                                                {[...historial].reverse().map((h: any, i: number) => {
                                                    const info = getEstado(h.estado);
                                                    const isFirst = i === 0;
                                                    const isLast = i === historial.length - 1;
                                                    return (
                                                        <div key={i} className="flex gap-3">
                                                            <div className="flex flex-col items-center">
                                                                <div
                                                                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2"
                                                                    style={isFirst
                                                                        ? { backgroundColor: info.color, borderColor: info.color }
                                                                        : { backgroundColor: '#f3f4f6', borderColor: '#e5e7eb' }
                                                                    }
                                                                >
                                                                    <Icon icon={info.icon} className={`w-4 h-4 ${isFirst ? 'text-white' : 'text-gray-400'}`} />
                                                                </div>
                                                                {!isLast && <div className="w-0.5 flex-1 min-h-[20px] mt-1 bg-gray-100 dark:bg-slate-800" />}
                                                            </div>
                                                            <div className={`flex-1 pb-4 ${!isFirst ? 'opacity-50' : ''}`}>
                                                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{info.value}</p>
                                                                <p className="text-xs text-gray-400">{moment(h.fecha).format('DD/MM/YYYY HH:mm')}</p>
                                                                {h.nota && <p className="text-xs text-gray-400 mt-0.5 italic">{h.nota}</p>}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Formulario crear / editar */}
                            {showDespachoForm && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <InputPro
                                            name="transportista"
                                            isLabel
                                            label="Transportista"
                                            placeholder="Ej: Olva, Shalom, Motorizado..."
                                            value={despachoForm.transportista}
                                            onChange={e => setDespachoForm(f => ({ ...f, transportista: e.target.value }))}
                                        />
                                        <InputPro
                                            name="codigoGuia"
                                            isLabel
                                            label="Código guía / SKU proveedor"
                                            placeholder="Ej: OLV-2024-000123"
                                            value={despachoForm.codigoGuia}
                                            onChange={e => setDespachoForm(f => ({ ...f, codigoGuia: e.target.value }))}
                                        />
                                        <InputPro
                                            name="direccionDestino"
                                            isLabel
                                            label="Dirección de destino"
                                            placeholder="Calle, ciudad, referencia..."
                                            value={despachoForm.direccionDestino}
                                            onChange={e => setDespachoForm(f => ({ ...f, direccionDestino: e.target.value }))}
                                        />
                                        <div>
                                            <Calendar
                                                text="Fecha estimada de entrega"
                                                name="fechaEstimada"
                                                value={despachoForm.fechaEstimada
                                                    ? moment(despachoForm.fechaEstimada, 'YYYY-MM-DD').format('DD/MM/YYYY')
                                                    : ''}
                                                onChange={(val: string) =>
                                                    setDespachoForm(f => ({
                                                        ...f,
                                                        fechaEstimada: moment(val, 'DD/MM/YYYY').format('YYYY-MM-DD'),
                                                    }))
                                                }
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Estado inicial</p>
                                        <div className="flex flex-wrap gap-2">
                                            {ESTADOS_DESPACHO.map(e => (
                                                <button
                                                    key={e.id}
                                                    type="button"
                                                    onClick={() => setDespachoForm(f => ({ ...f, estado: e.id as EstadoDespacho }))}
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                                                        despachoForm.estado === e.id
                                                            ? `${e.bg} ring-2 ring-offset-1`
                                                            : 'bg-white dark:bg-slate-800 text-gray-500 border-gray-200 dark:border-slate-700 hover:border-gray-300'
                                                    }`}
                                                >
                                                    <Icon icon={e.icon} width={13} />{e.value}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <InputPro
                                        name="observaciones"
                                        isLabel
                                        label="Observaciones"
                                        placeholder="Notas adicionales sobre el despacho..."
                                        value={despachoForm.observaciones}
                                        onChange={e => setDespachoForm(f => ({ ...f, observaciones: e.target.value }))}
                                    />

                                    <Button
                                        color="primary"
                                        fill
                                        isLoading={savingEnvio}
                                        onClick={handleSaveDespacho}
                                    >
                                        <Icon icon="solar:check-circle-bold" width={16} className="mr-1.5" />
                                        {envio ? 'Actualizar despacho' : 'Crear seguimiento'}
                                    </Button>
                                </div>
                            )}

                            {/* Sin despacho todavía */}
                            {!envio && !showDespachoForm && (
                                <div className="text-center py-8 rounded-xl border border-dashed border-gray-200 dark:border-slate-700">
                                    <Icon icon="solar:delivery-linear" className="text-4xl text-gray-300 dark:text-slate-600 mx-auto mb-2" />
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Sin seguimiento de despacho</p>
                                    <p className="text-xs text-gray-400 mt-1">Crea uno para rastrear el envío de este comprobante</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <div className="py-12 text-center text-gray-400 text-sm">
                    No se pudo cargar el comprobante
                </div>
            )}
        </Modal>

        <ModalConfirm
            isOpenModal={confirmDevuelto}
            setIsOpenModal={setConfirmDevuelto}
            title="Marcar como Devuelto"
            information="¿Estás seguro que deseas marcar este envío como Devuelto? Esta acción indica que el paquete regresó al origen y quedará registrado en el historial."
            confirmText="Sí, marcar como Devuelto"
            confirmLoading={savingEnvio}
            confirmSubmit={() => {
                setConfirmDevuelto(false);
                handleCambiarEstado('DEVUELTO');
            }}
        />
        </>
    );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SunatBadge({ estado }: { estado: string }) {
    const map: Record<string, { label: string; cls: string }> = {
        ACEPTADO:  { label: 'Aceptado',  cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
        PENDIENTE: { label: 'Pendiente', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
        RECHAZADO: { label: 'Rechazado', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
        ANULADO:   { label: 'Anulado',   cls: 'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-gray-400' },
        NO_APLICA: { label: 'N/A',       cls: 'bg-gray-100 text-gray-400' },
    };
    const info = map[estado] ?? { label: estado, cls: 'bg-gray-100 text-gray-500' };
    return (
        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${info.cls}`}>
            {info.label}
        </span>
    );
}

function InfoCard({ icon, label, value }: { icon: string; label: string; value: string }) {
    return (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800">
            <Icon icon={icon} className="text-gray-400 mt-0.5 shrink-0 text-lg" />
            <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-0.5">{label}</p>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 truncate">{value}</p>
            </div>
        </div>
    );
}
