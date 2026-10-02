import { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@iconify/react';
import { useSedesStore } from '@/zustand/sedes';
import {
    filasDeVariantes,
    nombresDeAtributos,
    sinStock,
    totalDeFilas,
} from '../stockPorVariante';

interface Props {
    /** El modelo (producto padre) con sus variantes, tal cual viene de la lista. */
    producto: any | null;
    onClose: () => void;
    /** Sede por la que está filtrada la lista; sin ella se muestra el global. */
    sedeId?: number;
}

/**
 * El stock de un modelo, abierto por talla y color.
 *
 * Pedido de un negocio de ropa: en la lista solo se ve el total del modelo
 * ("77") y la vendedora no tiene dónde mirar cuántos quedan en cada talla sin
 * meterse a vender. El dato ya existía; esto solo lo muestra.
 */
export const ModalStockVariantes = ({ producto, onClose, sedeId }: Props) => {
    const sedes = useSedesStore((s) => s.sedes);

    const { columnas, filas, total, faltantes, mostrarSedes } = useMemo(() => {
        const columnas = nombresDeAtributos(producto);
        const filas = filasDeVariantes(producto, sedeId);
        return {
            columnas,
            filas,
            total: totalDeFilas(filas),
            faltantes: sinStock(filas),
            // Con una sola sede la columna por sede no agrega nada; con varias
            // es justo lo que hace falta para saber a cuál tienda mandar al
            // cliente cuando la talla no está acá.
            mostrarSedes: !sedeId && sedes.length > 1,
        };
    }, [producto, sedeId, sedes.length]);

    if (!producto) return null;

    const tono = (stock: number) =>
        stock <= 0
            ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300'
            : stock <= 3
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300';

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
            onClick={onClose}
        >
            <div
                className="w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-[#1E2435] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-3 border-b border-gray-100 p-4 dark:border-slate-800">
                    <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                            <Icon icon="solar:widget-5-bold-duotone" width={20} />
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-gray-900 dark:text-white">
                                {producto?.descripcion}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {filas.length} {filas.length === 1 ? 'combinación' : 'combinaciones'} · {total} en total
                                {faltantes > 0 && (
                                    <span className="text-rose-600 dark:text-rose-400">
                                        {' '}· {faltantes} sin stock
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-slate-800"
                        aria-label="Cerrar"
                    >
                        <Icon icon="solar:close-circle-bold" width={22} />
                    </button>
                </div>

                <div className="overflow-auto p-4">
                    <table className="w-full text-left text-xs">
                        <thead className="text-[11px] uppercase tracking-wide text-gray-400 dark:text-gray-500">
                            <tr className="border-b border-gray-100 dark:border-slate-800">
                                {columnas.map((columna) => (
                                    <th key={columna} className="pb-2 pr-3 font-bold">{columna}</th>
                                ))}
                                <th className="pb-2 pr-3 font-bold">Código</th>
                                <th className="pb-2 pr-3 text-right font-bold">Stock</th>
                                {mostrarSedes &&
                                    sedes.map((sede: any) => (
                                        <th key={sede.id} className="pb-2 pr-3 text-right font-bold">
                                            {sede.nombre}
                                        </th>
                                    ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filas.map((fila) => (
                                <tr
                                    key={fila.id}
                                    className="border-b border-gray-50 last:border-0 dark:border-slate-800/60"
                                >
                                    {columnas.map((columna) => (
                                        <td key={columna} className="py-2 pr-3 font-bold text-gray-900 dark:text-white">
                                            {fila.atributos[columna] || '—'}
                                        </td>
                                    ))}
                                    <td className="py-2 pr-3 font-mono text-[11px] text-gray-500 dark:text-gray-400">
                                        {fila.sku || '—'}
                                    </td>
                                    <td className="py-2 pr-3 text-right">
                                        <span className={`inline-flex min-w-[2.2rem] justify-center rounded-full px-2 py-0.5 text-[11px] font-black ${tono(fila.stock)}`}>
                                            {fila.stock}
                                        </span>
                                    </td>
                                    {mostrarSedes &&
                                        sedes.map((sede: any) => {
                                            const enSede = fila.porSede.find((s) => s.sedeId === sede.id);
                                            const valor = Number(enSede?.stock ?? 0);
                                            return (
                                                <td
                                                    key={sede.id}
                                                    className={`py-2 pr-3 text-right font-bold ${valor > 0 ? 'text-gray-700 dark:text-gray-200' : 'text-gray-300 dark:text-slate-600'}`}
                                                >
                                                    {valor}
                                                </td>
                                            );
                                        })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>,
        document.body,
    );
};

export default ModalStockVariantes;
