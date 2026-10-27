import { useEffect, useState } from "react";
import { Icon } from '@iconify/react';
import DrawerHearth, { DRAWER_BTN, DRAWER_H3, DRAWER_MONTO_STYLE, DRAWER_ROW, DRAWER_WELL, DrawerCargando, DrawerDato, DrawerEstado, DrawerHeader } from "@/components/DrawerHearth";
import { useComprasStore } from "@/zustand/compras";
import moment from "moment";

type Props = {
    isOpen: boolean;
    onClose: () => void;
    compraId: number | null;
};

const ModalDetalleCompra = ({ isOpen, onClose, compraId }: Props) => {
    const { obtenerCompra, compraDetalle } = useComprasStore();
    const [localCompra, setLocalCompra] = useState<any>(null);
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            if (isOpen && compraId) {
                setIsInitialLoading(true);
                await obtenerCompra(compraId);
                setIsInitialLoading(false);
            }
        };
        fetch();
    }, [isOpen, compraId, obtenerCompra]);

    // Sync local state to prevent stale data flash
    useEffect(() => {
        if (isOpen && compraDetalle && compraDetalle.id === compraId) {
            setLocalCompra(compraDetalle);
        }
    }, [isOpen, compraDetalle, compraId]);

    const isLoading = isInitialLoading || !localCompra || localCompra.id !== compraId;

    // Safety check for calculations
    const total = localCompra ? Number(localCompra.total) : 0;
    // Desglose tal como se grabó: las líneas de productos exonerados/inafectos
    // no llevan IGV, así que no se puede derivar el neto como total ÷ 1.18.
    const igv = localCompra?.igv != null ? Number(localCompra.igv) : total - total / 1.18;
    const detalles: any[] = (localCompra as any)?.detalles ?? [];
    const opNoGravada = detalles.reduce(
        (acc: number, d: any) => acc + (Number(d.igv ?? 0) > 0 ? 0 : Number(d.subtotal ?? 0)),
        0,
    );
    const subtotal = Math.max(0, total - igv - opNoGravada);
    // Moneda del documento: los montos se muestran tal como se registraron.
    const esUSD = String(localCompra?.moneda || 'PEN').toUpperCase() === 'USD';
    const simbolo = esUSD ? '$' : 'S/';
    const tipoCambio = Number((localCompra as any)?.tipoCambio) || 0;

    const estadoCompra = String(localCompra?.estado || '').toUpperCase();
    const estadoTone = ['ANULADO', 'ANULADA', 'RECHAZADA', 'RECHAZADO'].includes(estadoCompra)
        ? 'ember'
        : estadoCompra === 'PENDIENTE_APROBACION' ? 'saffron' : 'spruce';
    const pagada = localCompra?.estadoPago === 'PAGADO' || localCompra?.estadoPago === 'COMPLETADO';

    return (
        <DrawerHearth isOpen={isOpen} onClose={onClose} label="Detalle de compra" contentKey={isLoading ? 'cargando' : localCompra?.id}>
            {isLoading ? (
                <DrawerCargando texto="Cargando compra..." />
            ) : (
                <div data-drawer-stagger className="flex flex-col gap-6">
                    <DrawerHeader
                        icon="solar:bill-list-linear"
                        title={`Compra ${localCompra?.serie}-${localCompra?.numero}`}
                        subtitle={
                            <>
                                {moment(localCompra?.fechaEmision).format('DD/MM/YYYY')}
                                <span aria-hidden>·</span>
                                <DrawerEstado
                                    label={pagada ? 'Pagada' : localCompra?.estadoPago === 'PAGO_PARCIAL' ? 'Pago parcial' : 'Por pagar'}
                                    tone={pagada ? 'spruce' : 'saffron'}
                                />
                            </>
                        }
                    />

                    <p className="-mt-1 text-[15px] text-[#4a443d] dark:text-slate-300">
                        Comprada a <b className="font-bold text-[#1d1915] dark:text-slate-100">{localCompra?.proveedor?.nombre || localCompra?.proveedor?.nroDoc || 'proveedor sin nombre'}</b>
                        {localCompra?.sede?.nombre ? <> para <b className="font-bold text-[#1d1915] dark:text-slate-100">{localCompra.sede.nombre}</b>{localCompra?.sede?.tipo === 'ALMACEN' ? ' (almacén)' : ''}</> : null}.
                    </p>

                    {/* Total, como el bloque "Last sync" de Hearth */}
                    <div className={DRAWER_WELL}>
                        <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-[#6b645c] dark:text-slate-400">Total</p>
                            <p className="text-[24px] font-bold leading-tight tabular-nums text-[#1d1915] dark:text-slate-100" style={DRAWER_MONTO_STYLE}>
                                {simbolo} {total.toFixed(2)}
                            </p>
                            {esUSD && tipoCambio > 0 && (
                                <p className="text-[13px] text-[#6b645c] dark:text-slate-400">Equivale a S/ {(total * tipoCambio).toFixed(2)} (TC {tipoCambio.toFixed(3)})</p>
                            )}
                        </div>
                        <div className="text-right">
                            <p className="text-[13px] font-semibold text-[#6b645c] dark:text-slate-400">Saldo</p>
                            <p className={`text-[17px] font-bold tabular-nums ${Number(localCompra?.saldo || 0) > 0.01 ? 'text-[#b53f19] dark:text-orange-300' : 'text-[#0a7a63] dark:text-emerald-300'}`}>
                                {simbolo} {Number(localCompra?.saldo || 0).toFixed(2)}
                            </p>
                        </div>
                    </div>

                    <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
                        <DrawerDato label="Proveedor" value={localCompra?.proveedor?.nombre || localCompra?.proveedor?.nroDoc || '-'} />
                        <DrawerDato label="Sede destino" value={localCompra?.sede?.nombre || '-'} />
                        <DrawerDato label="Comprobante" value={`${localCompra?.serie || '-'}-${localCompra?.numero || ''}`} />
                        <DrawerDato label="Moneda" value={esUSD ? `US$ Dólares · TC ${tipoCambio ? tipoCambio.toFixed(3) : '-'}` : 'S/ Soles'} />
                        <DrawerDato label="Emisión" value={moment(localCompra?.fechaEmision).format('DD/MM/YYYY')} />
                        <DrawerDato label="Vencimiento" value={localCompra?.fechaVencimiento ? moment(localCompra?.fechaVencimiento).format('DD/MM/YYYY') : '-'} />
                        <DrawerDato label="Estado" value={<DrawerEstado label={String(localCompra?.estado || '-').replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c: string) => c.toUpperCase())} tone={estadoTone as any} />} />
                    </dl>

                    <section>
                        <h3 className={DRAWER_H3}>Productos comprados ({detalles.length})</h3>
                        {detalles.length === 0 ? (
                            <p className="text-[13.5px] text-[#978f86]">No hay productos registrados en esta compra</p>
                        ) : (
                            <ul>
                                {detalles.map((item: any, idx: number) => (
                                    <li key={idx} className={DRAWER_ROW}>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[15px] font-bold text-[#1d1915] dark:text-slate-100">{item.descripcion || item.producto?.descripcion}</p>
                                            <p className="mt-0.5 text-[13px] text-[#6b645c] dark:text-slate-400">
                                                {item.cantidad} × {simbolo} {Number(item.precioUnitario).toFixed(2)}
                                                {/* Distribución por sede: la línea entró a una sede distinta a la de la cabecera */}
                                                {item.sede?.nombre && item.sede.id !== localCompra?.sedeId && <> · entró a {item.sede.nombre}</>}
                                                {item.lote && <> · Lote {item.lote}</>}
                                                {item.fechaVencimiento && <> · Vence {moment(item.fechaVencimiento).format('DD/MM/YYYY')}</>}
                                            </p>
                                        </div>
                                        <p className="shrink-0 text-[15px] font-bold tabular-nums text-[#1d1915] dark:text-slate-100">
                                            {simbolo} {Number(item.total || (item.cantidad * item.precioUnitario)).toFixed(2)}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        )}
                        <div className="mt-2 space-y-1.5 border-t border-[rgba(40,30,20,0.09)] pt-3 text-[14px] dark:border-white/10">
                            <Linea label="Op. gravada" valor={`${simbolo} ${subtotal.toFixed(2)}`} />
                            {opNoGravada > 0 && <Linea label="Op. exonerada / inafecta" valor={`${simbolo} ${opNoGravada.toFixed(2)}`} />}
                            <Linea label="IGV (18%)" valor={`${simbolo} ${igv.toFixed(2)}`} />
                        </div>
                    </section>

                    {/* Foto de la factura/boleta (evidencia leída por IA) */}
                    {localCompra?.fotoUrl && (
                        <section>
                            <h3 className={DRAWER_H3}>Foto del comprobante</h3>
                            <a
                                href={localCompra.fotoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group block w-fit overflow-hidden rounded-2xl border border-[rgba(40,30,20,0.09)] dark:border-white/10"
                            >
                                <img
                                    src={localCompra.fotoUrl}
                                    alt="Foto de la factura o boleta de la compra"
                                    className="max-h-80 w-auto bg-[#f7f3ed] object-contain dark:bg-slate-800"
                                />
                            </a>
                            <a href={localCompra.fotoUrl} target="_blank" rel="noopener noreferrer" className={`${DRAWER_BTN} mt-3`}>
                                <Icon icon="solar:maximize-square-linear" width={17} />
                                Ver en tamaño completo
                            </a>
                        </section>
                    )}
                </div>
            )}
        </DrawerHearth>
    );
};

function Linea({ label, valor }: { label: string; valor: string }) {
    return (
        <div className="flex justify-between text-[#6b645c] dark:text-slate-400">
            <span>{label}</span>
            <span className="font-semibold tabular-nums text-[#1d1915] dark:text-slate-100">{valor}</span>
        </div>
    );
}

export default ModalDetalleCompra;
