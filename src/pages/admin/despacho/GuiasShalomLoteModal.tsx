import { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import Modal from '@/components/Modal';
import { shalomService, mensajeErrorShalom } from '@/services/shalom.service';
import useAlertStore from '@/zustand/alert';
import type { RotuloLoteItem } from './RotulosLotePrint';
import {
    ERRORES_IGUALES_PARA_CORTAR,
    generarEnLote,
    rotulosDeGeneradas,
    type EstadoGuiaLote,
    type PendienteDeGuia,
} from './guiasShalomLote';

interface Props {
    pendientes: PendienteDeGuia[];
    onClose: () => void;
    /** Al terminar (o cerrar con algo hecho): recargar el panel. */
    onTerminado: () => void;
    onImprimirRotulos: (items: RotuloLoteItem[]) => void;
    onCorregir: (comprobanteId: number) => void | Promise<void>;
}

// Si Shalom tarda más que el timeout, la guía pudo crearse igual: al recargar
// el panel aparece con su N° de orden y reintentarla no la duplica.
const SIN_RESPUESTA =
    'Shalom no respondió a tiempo. Puede que la guía sí se haya creado: revisa la lista al cerrar antes de reintentar.';

export function GuiasShalomLoteModal({ pendientes, onClose, onTerminado, onImprimirRotulos, onCorregir }: Props) {
    // Marcadas por defecto las que tienen lo necesario; las que no, se ven
    // pero no se pueden marcar hasta corregirlas.
    const [marcadas, setMarcadas] = useState<Set<number>>(
        () => new Set(pendientes.filter((p) => p.faltan.length === 0).map((p) => p.comprobanteId)),
    );
    const [estados, setEstados] = useState<Record<number, EstadoGuiaLote>>({});
    const [corriendo, setCorriendo] = useState(false);
    const [terminado, setTerminado] = useState(false);
    const detener = useRef(false);
    const [cortadoPor, setCortadoPor] = useState<string | null>(null);
    // Si se sale del panel a mitad, el lote sigue (cada guía ya pedida se
    // crea igual) y el resultado llega como aviso, no se pierde en silencio.
    const montado = useRef(true);
    useEffect(() => () => { montado.current = false; }, []);
    // Cerrar o recargar la pestaña sí lo corta: se pregunta antes.
    useEffect(() => {
        if (!corriendo) return;
        const avisar = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
        window.addEventListener('beforeunload', avisar);
        return () => window.removeEventListener('beforeunload', avisar);
    }, [corriendo]);

    const listas = pendientes.filter((p) => p.faltan.length === 0);
    const cuenta = useMemo(() => {
        const valores = Object.values(estados);
        return {
            ok: valores.filter((e) => e.estado === 'ok').length,
            error: valores.filter((e) => e.estado === 'error').length,
            omitidas: valores.filter((e) => e.estado === 'omitida').length,
            detenidas: valores.filter((e) => e.estado === 'detenida').length,
            hechas: valores.filter((e) => e.estado !== 'esperando' && e.estado !== 'generando' && e.estado !== 'detenida').length,
        };
    }, [estados]);
    const aGenerar = pendientes.filter((p) => marcadas.has(p.comprobanteId)).map((p) => p.comprobanteId);
    const rotulos = rotulosDeGeneradas(pendientes, estados);

    const alternar = (id: number) =>
        setMarcadas((prev) => {
            const nueva = new Set(prev);
            if (nueva.has(id)) nueva.delete(id);
            else nueva.add(id);
            return nueva;
        });
    const todas = marcadas.size === listas.length && listas.length > 0;

    const generar = async () => {
        if (aGenerar.length === 0 || corriendo) return;
        detener.current = false;
        setCorriendo(true);
        setTerminado(false);
        setCortadoPor(null);
        setEstados(Object.fromEntries(aGenerar.map((id) => [id, { estado: 'esperando' } as EstadoGuiaLote])));
        const resultado: Record<number, EstadoGuiaLote> = {};
        const { cortadoPor: corte } = await generarEnLote(
            aGenerar,
            (id) => shalomService.crearGuia(id),
            (id, estado) => {
                resultado[id] = estado;
                if (montado.current) setEstados((prev) => ({ ...prev, [id]: estado }));
            },
            () => detener.current,
            (e) => mensajeErrorShalom(e, SIN_RESPUESTA),
        );
        if (!montado.current) {
            const valores = Object.values(resultado);
            const hechas = valores.filter((e) => e.estado === 'ok').length;
            const fallas = valores.filter((e) => e.estado === 'error').length;
            useAlertStore.getState().alert(
                `Guías Shalom: ${hechas} generada${hechas === 1 ? '' : 's'}${fallas ? `, ${fallas} con error (revísalas en el Panel de ventas)` : ''}.`,
                fallas ? 'warning' : 'success',
            );
            return;
        }
        setCortadoPor(corte);
        setCorriendo(false);
        setTerminado(true);
    };

    const cerrar = () => {
        if (corriendo) return; // Escape a mitad del lote no lo corta: para eso está "Detener".
        if (cuenta.hechas > 0) onTerminado();
        onClose();
    };

    const insignia = (p: PendienteDeGuia) => {
        const e = estados[p.comprobanteId];
        if (!e) return null;
        switch (e.estado) {
            case 'esperando':
                return <span className="text-[11px] font-bold text-gray-400">En cola</span>;
            case 'generando':
                return (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-blue-600">
                        <Icon icon="svg-spinners:180-ring" className="text-sm" /> Generando…
                    </span>
                );
            case 'ok':
                return (
                    <span className="flex items-center gap-1 text-[11px] font-black text-emerald-600" data-testid={`guia-lote-ok-${p.comprobanteId}`}>
                        <Icon icon="solar:check-circle-bold" className="text-sm" />
                        {e.nroOrden ? `Guía ${e.nroOrden}` : 'Registrada'}
                    </span>
                );
            case 'omitida':
                return <span className="text-[11px] font-bold text-gray-500" data-testid={`guia-lote-omitida-${p.comprobanteId}`}>Ya tenía guía</span>;
            case 'detenida':
                return <span className="text-[11px] font-bold text-gray-500" data-testid={`guia-lote-detenida-${p.comprobanteId}`}>No se generó (detenido)</span>;
            case 'error':
                return (
                    <span className="text-[11px] font-bold text-rose-600" data-testid={`guia-lote-error-${p.comprobanteId}`}>
                        {e.mensaje}
                    </span>
                );
        }
    };

    return (
        <Modal isOpenModal closeModal={cerrar} title="Generar guías Shalom" icon="solar:box-bold-duotone" width="760px" height="auto">
            <div className="p-5">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    Despachos de Shalom en <b>Preparando</b> y <b>sin guía</b> de la lista que estás viendo (respeta la fecha y los filtros).
                    Se generan una tras otra con los datos de cada despacho, igual que desde "Editar despacho".
                </p>

                {pendientes.length === 0 ? (
                    <div className="mt-5 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700 p-6 text-center text-sm text-gray-500">
                        No hay despachos de Shalom sin guía en esta lista. Si son de otro día, cambia la fecha o el rango del panel.
                    </div>
                ) : (
                    <>
                        <div className="mt-4 flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
                                {pendientes.length} sin guía · {marcadas.size} marcada{marcadas.size === 1 ? '' : 's'}
                            </span>
                            {!corriendo && !terminado && listas.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setMarcadas(todas ? new Set() : new Set(listas.map((p) => p.comprobanteId)))}
                                    className="text-[11px] font-bold text-blue-600 hover:underline"
                                    data-testid="guias-lote-todas"
                                >
                                    {todas ? 'Ninguna' : 'Todas'}
                                </button>
                            )}
                        </div>

                        <div className="mt-2 max-h-[50vh] overflow-y-auto rounded-2xl border border-gray-100 dark:border-slate-800 divide-y divide-gray-100 dark:divide-slate-800">
                            {pendientes.map((p) => {
                                const bloqueada = p.faltan.length > 0;
                                const estado = estados[p.comprobanteId];
                                return (
                                    <div key={p.comprobanteId} className="flex items-start gap-3 px-3 py-2.5" data-testid={`guia-lote-fila-${p.comprobanteId}`}>
                                        <input
                                            type="checkbox"
                                            checked={marcadas.has(p.comprobanteId)}
                                            disabled={bloqueada || corriendo || terminado}
                                            onChange={() => alternar(p.comprobanteId)}
                                            data-testid={`guia-lote-check-${p.comprobanteId}`}
                                            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 disabled:opacity-40"
                                        />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-baseline gap-x-2">
                                                <span className="text-xs font-black text-gray-800 dark:text-gray-100">{p.referencia}</span>
                                                <span className="text-xs text-gray-600 dark:text-gray-300 truncate">{p.cliente || 'Sin cliente'}</span>
                                            </div>
                                            <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                                                {p.agenciaDestino || 'Sin agencia'}{p.celular ? ` · ${p.celular}` : ''}
                                            </div>
                                            {bloqueada && (
                                                <div className="mt-0.5 text-[11px] font-bold text-amber-600">Falta {p.faltan.join(' y ')}</div>
                                            )}
                                            {estado && <div className="mt-0.5">{insignia(p)}</div>}
                                        </div>
                                        {(bloqueada || estado?.estado === 'error') && !corriendo && (
                                            <button
                                                type="button"
                                                onClick={() => onCorregir(p.comprobanteId)}
                                                data-testid={`guia-lote-corregir-${p.comprobanteId}`}
                                                className="shrink-0 rounded-lg border border-gray-200 dark:border-slate-700 px-2 py-1 text-[11px] font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                                            >
                                                Corregir
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}

                {cortadoPor && (
                    <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-900/20 px-4 py-3 text-xs text-amber-800 dark:text-amber-200" data-testid="guias-lote-cortado">
                        <b>Se detuvo solo:</b> las últimas {ERRORES_IGUALES_PARA_CORTAR} fallaron con el mismo error, que parece de la cuenta y no de cada pedido.
                        Revisa tu conexión con Shalom (Perfil → Shalom) y vuelve a intentar con las que quedaron.
                        <div className="mt-1 font-bold">{cortadoPor}</div>
                    </div>
                )}

                {(corriendo || terminado) && (
                    <div className="mt-4 rounded-2xl bg-gray-50 dark:bg-slate-800/60 px-4 py-3 text-xs font-bold text-gray-700 dark:text-gray-200" data-testid="guias-lote-resumen">
                        {corriendo ? `Generando ${cuenta.hechas + 1} de ${aGenerar.length}…` : 'Listo.'}{' '}
                        <span className="text-emerald-600">{cuenta.ok} generada{cuenta.ok === 1 ? '' : 's'}</span>
                        {cuenta.error > 0 && <span className="text-rose-600"> · {cuenta.error} con error</span>}
                        {cuenta.omitidas > 0 && <span className="text-gray-500"> · {cuenta.omitidas} ya tenían guía</span>}
                        {cuenta.detenidas > 0 && <span className="text-gray-500"> · {cuenta.detenidas} sin generar (detenido)</span>}
                    </div>
                )}

                <div className="mt-5 flex flex-wrap justify-end gap-2">
                    {corriendo ? (
                        <button
                            type="button"
                            onClick={() => { detener.current = true; }}
                            data-testid="guias-lote-detener"
                            className="rounded-xl border border-gray-200 dark:border-slate-700 px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-300"
                        >
                            Detener después de esta
                        </button>
                    ) : terminado ? (
                        <>
                            {rotulos.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => onImprimirRotulos(rotulos)}
                                    data-testid="guias-lote-rotulos"
                                    className="flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-slate-700 px-4 py-2 text-xs font-bold text-gray-700 dark:text-gray-200"
                                >
                                    <Icon icon="solar:printer-2-bold-duotone" className="text-base" />
                                    Imprimir {rotulos.length} rótulo{rotulos.length === 1 ? '' : 's'}
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={cerrar}
                                data-testid="guias-lote-cerrar"
                                className="rounded-xl bg-gray-900 dark:bg-white px-4 py-2 text-xs font-bold text-white dark:text-gray-900"
                            >
                                Cerrar
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                type="button"
                                onClick={cerrar}
                                className="rounded-xl border border-gray-200 dark:border-slate-700 px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-300"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={() => void generar()}
                                disabled={aGenerar.length === 0}
                                data-testid="guias-lote-generar"
                                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {aGenerar.length === 0
                                    ? 'Marca al menos una'
                                    : `Generar ${aGenerar.length} guía${aGenerar.length === 1 ? '' : 's'}`}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </Modal>
    );
}
