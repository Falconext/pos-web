import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import moment from 'moment';
import { useComprasStore } from '@/zustand/compras';
import DrawerHearth, { DRAWER_H3, DRAWER_MONTO_STYLE, DRAWER_ROW, DRAWER_WELL, DrawerCargando, DrawerDato, DrawerEstado, DrawerHeader } from '@/components/DrawerHearth';
import ModalConfirm from '@/components/ModalConfirm';

interface ModalHistorialPagosCompraProps {
    isOpen: boolean;
    compra: any; // ICompra
    onClose: () => void;
    /** Se llama tras anular un abono para refrescar el listado (saldo/estado). */
    onChange?: () => void;
}

const ModalHistorialPagosCompra = ({ isOpen, compra, onClose, onChange }: ModalHistorialPagosCompraProps) => {
    const { getHistorialPagos, anularPagoCompra } = useComprasStore();
    const [pagos, setPagos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalPagado, setTotalPagado] = useState(0);
    const [resumenUsd, setResumenUsd] = useState<{ totalPagadoSoles: number; diferenciaCambioTotal: number } | null>(null);
    const [localCompra, setLocalCompra] = useState<any>(null);
    // Compra en dólares: montos en US$ y, por abono, su valor en soles y la diferencia de cambio.
    const esUSD = String(localCompra?.moneda || 'PEN').toUpperCase() === 'USD';
    const simbolo = esUSD ? '$' : 'S/';
    const tcCompra = Number(localCompra?.tipoCambio) || 0;
    const [pagoAAnular, setPagoAAnular] = useState<any>(null);
    const [recarga, setRecarga] = useState(0);
    const compraAnulada = String(localCompra?.estado || '').toUpperCase() === 'ANULADO';
    const confirmarAnularPago = async () => {
        if (!pagoAAnular || !localCompra?.id) return;
        const r = await anularPagoCompra(localCompra.id, pagoAAnular.id);
        setPagoAAnular(null);
        if (r) {
            setLocalCompra((c: any) => c ? { ...c, saldo: r.nuevoSaldo, estadoPago: r.nuevoEstado } : c);
            setRecarga((n) => n + 1);
            onChange?.();
        }
    };

    // Sync local state to preserve data during closing animation
    useEffect(() => {
        if (isOpen && compra) {
            setLocalCompra(compra);
        }
    }, [isOpen, compra]);

    useEffect(() => {
        const fetchPagos = async () => {
            if (!localCompra?.id) return;
            try {
                setLoading(true);
                const result: any = await getHistorialPagos(localCompra.id);
                if (result.success || Array.isArray(result)) {
                    let pagosList = result.pagos || (Array.isArray(result) ? result : []);
                    if (!Array.isArray(pagosList)) pagosList = [];
                    setPagos(pagosList);

                    const total = result.totalPagado ?? pagosList.reduce((sum: number, p: any) => sum + Number(p.monto), 0);
                    setTotalPagado(total);
                    setResumenUsd(result.totalPagadoSoles != null ? { totalPagadoSoles: Number(result.totalPagadoSoles) || 0, diferenciaCambioTotal: Number(result.diferenciaCambioTotal) || 0 } : null);
                }
            } catch (error) {
                console.error('Error fetching pagos:', error);
            } finally {
                setLoading(false);
            }
        };

        if (isOpen && localCompra?.id) {
            fetchPagos();
        }
    }, [isOpen, localCompra?.id, getHistorialPagos, recarga]);

    const totalCompra = Number(localCompra?.total || 0);
    const saldoPendiente = Number(localCompra?.saldo || 0);

    const pagada = saldoPendiente <= 0.01;

    return (
        <>
        <DrawerHearth isOpen={isOpen} onClose={onClose} label="Historial de pagos" contentKey={loading ? 'cargando' : `${localCompra?.id}-${recarga}`}>
            <div data-drawer-stagger className="flex flex-col gap-6">
                <DrawerHeader
                    icon="solar:history-linear"
                    tone="spruce"
                    title={localCompra ? `Pagos ${localCompra.serie}-${localCompra.numero}` : 'Historial de pagos'}
                    subtitle={
                        <>
                            {localCompra?.proveedor?.nombre || 'Sin nombre'}
                            <span aria-hidden>·</span>
                            <DrawerEstado label={pagada ? 'Pagada' : 'Con saldo'} tone={pagada ? 'spruce' : 'saffron'} />
                        </>
                    }
                />

                {/* Pagado vs. saldo, como el bloque "Last sync" de Hearth */}
                <div className={DRAWER_WELL}>
                    <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-[#6b645c] dark:text-slate-400">Total pagado</p>
                        <p className="text-[24px] font-bold leading-tight tabular-nums text-[#0a7a63] dark:text-emerald-300" style={DRAWER_MONTO_STYLE}>
                            {simbolo} {totalPagado.toFixed(2)}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-[13px] font-semibold text-[#6b645c] dark:text-slate-400">Saldo</p>
                        <p className={`text-[17px] font-bold tabular-nums ${saldoPendiente > 0 ? 'text-[#b53f19] dark:text-orange-300' : 'text-[#0a7a63] dark:text-emerald-300'}`}>
                            {simbolo} {saldoPendiente.toFixed(2)}
                        </p>
                    </div>
                </div>

                <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
                    <DrawerDato label="Total compra" value={`${simbolo} ${totalCompra.toFixed(2)}`} />
                    <DrawerDato label="Emisión" value={localCompra?.fechaEmision ? moment(localCompra.fechaEmision).format('DD/MM/YYYY') : '-'} />
                    {esUSD && resumenUsd && (
                        <>
                            <DrawerDato label="Pagado en soles" value={`S/ ${resumenUsd.totalPagadoSoles.toFixed(2)}`} extra={[`Compra al TC ${tcCompra.toFixed(3)}`]} />
                            <DrawerDato
                                label="Diferencia de cambio"
                                value={resumenUsd.diferenciaCambioTotal > 0.004 ? `Pérdida S/ ${resumenUsd.diferenciaCambioTotal.toFixed(2)}` : resumenUsd.diferenciaCambioTotal < -0.004 ? `Ganancia S/ ${Math.abs(resumenUsd.diferenciaCambioTotal).toFixed(2)}` : 'S/ 0.00'}
                            />
                        </>
                    )}
                </dl>

                <section>
                    <h3 className={DRAWER_H3}>Abonos ({pagos.length})</h3>
                    {loading ? (
                        <DrawerCargando texto="Cargando historial..." />
                    ) : pagos.length === 0 ? (
                        <div className="rounded-2xl border-[1.5px] border-dashed border-[rgba(40,30,20,0.16)] px-4 py-8 text-center dark:border-white/15">
                            <p className="text-[15px] font-bold text-[#1d1915] dark:text-slate-100">Sin pagos registrados</p>
                            <p className="mt-1 text-[13px] text-[#6b645c] dark:text-slate-400">Esta compra aún no cuenta con abonos realizados.</p>
                        </div>
                    ) : (
                        <ul>
                            {pagos.map((pago: any, index: number) => (
                                <li key={pago.id || index} className={DRAWER_ROW}>
                                    <div className="flex min-w-0 flex-1 items-start gap-3">
                                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#dcf2ec] text-[#0a7a63] dark:bg-emerald-500/15 dark:text-emerald-300">
                                            <Icon icon="solar:check-circle-linear" width={18} />
                                        </span>
                                        <div className="min-w-0">
                                            <p className="text-[15px] font-bold text-[#1d1915] dark:text-slate-100">Abono #{pagos.length - index}</p>
                                            <p className="mt-0.5 text-[13px] text-[#6b645c] dark:text-slate-400">
                                                {moment(pago.fecha).format('DD/MM/YYYY HH:mm')} · {pago.metodoPago || pago.medioPago}
                                            </p>
                                            {pago.referencia && <p className="mt-0.5 text-[13px] text-[#6b645c] dark:text-slate-400">Ref. {pago.referencia}</p>}
                                            {pago.observacion && <p className="mt-0.5 text-[13px] text-[#6b645c] dark:text-slate-400">{pago.observacion}</p>}
                                            {esUSD && (
                                                <p className="mt-0.5 text-[12px] text-[#6b645c] dark:text-slate-400">
                                                    TC {Number(pago.tipoCambio || tcCompra).toFixed(3)} · S/ {Number(pago.montoSoles ?? Number(pago.monto) * (Number(pago.tipoCambio) || tcCompra)).toFixed(2)}
                                                    {Math.abs(Number(pago.diferenciaCambio || 0)) > 0.004 && (
                                                        <span className={Number(pago.diferenciaCambio) > 0 ? ' text-[#b53f19]' : ' text-[#0a7a63]'}>
                                                            {' '}· dif. cambio {Number(pago.diferenciaCambio) > 0 ? 'pérdida' : 'ganancia'} S/ {Math.abs(Number(pago.diferenciaCambio)).toFixed(2)}
                                                        </span>
                                                    )}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <p className="text-[15px] font-bold tabular-nums text-[#1d1915] dark:text-slate-100">{simbolo} {Number(pago.monto).toFixed(2)}</p>
                                        {!compraAnulada && (
                                            <button
                                                type="button"
                                                onClick={() => setPagoAAnular(pago)}
                                                className="mt-1 inline-flex items-center gap-1 rounded-lg px-1.5 py-0.5 text-[12px] font-bold text-[#b53f19] hover:bg-[#fbe6dd] dark:text-orange-300 dark:hover:bg-orange-500/15"
                                                title="Anular este abono: devuelve el monto al saldo de la compra"
                                            >
                                                <Icon icon="solar:trash-bin-trash-linear" width={13} /> Anular
                                            </button>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </DrawerHearth>
            <ModalConfirm
                isOpenModal={!!pagoAAnular}
                setIsOpenModal={(v: boolean) => { if (!v) setPagoAAnular(null); }}
                title="Anular abono"
                information={pagoAAnular ? `Se anulará el abono de ${simbolo} ${Number(pagoAAnular.monto).toFixed(2)} (${pagoAAnular.metodoPago || pagoAAnular.medioPago || '-'}). El saldo de la compra se restablece${String(pagoAAnular.metodoPago || pagoAAnular.medioPago).toUpperCase() === 'EFECTIVO' ? ' y el egreso de caja queda anulado' : ''}.` : ''}
                confirmText="Anular abono"
                confirmSubmit={confirmarAnularPago}
            />
        </>
    );
};

export default ModalHistorialPagosCompra;
