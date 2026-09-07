import { useEffect, useState } from 'react';
import { shalomService, type ShalomProducto } from '@/services/shalom.service';

const inp = 'w-full h-10 px-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 transition-all';

/**
 * Tipo de paquete que se registra en Shalom. El catálogo es por cuenta de Shalom
 * Pro, así que se pide al backend, que lo deriva del historial de esa empresa.
 * Un id fuera del catálogo crea la guía con contenido "N/A" y monto S/ 0.00.
 */
export function ShalomProductoSelect({ value, onChange }: { value?: number | string | null; onChange: (id: number | undefined) => void }) {
    const [productos, setProductos] = useState<ShalomProducto[]>([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        let vivo = true;
        shalomService.productos()
            .then(p => { if (vivo) setProductos(p); })
            .catch(() => { if (vivo) setProductos([]); })
            .finally(() => { if (vivo) setCargando(false); });
        return () => { vivo = false; };
    }, []);

    return (
        <select
            value={value != null && value !== '' ? String(value) : ''}
            disabled={cargando}
            onChange={e => onChange(e.target.value ? Number(e.target.value) : undefined)}
            className={inp}
        >
            <option value="">{cargando ? 'Cargando productos…' : 'Usar el predeterminado'}</option>
            {productos.map(p => (
                <option key={p.id} value={p.id}>
                    {p.nombre}
                </option>
            ))}
        </select>
    );
}
