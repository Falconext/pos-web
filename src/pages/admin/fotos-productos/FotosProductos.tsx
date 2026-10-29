import { useCallback, useEffect, useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import { get } from '@/utils/fetch';
import apiClient from '@/utils/apiClient';
import { useDebounce } from '@/hooks/useDebounce';
import useAlertStore from '@/zustand/alert';

/**
 * Fotos de productos: la pantalla del usuario delegado solo para fotos
 * (`soloImagenesProductos`). Busca un producto, cambia la foto principal y
 * agrega, ordena o quita las adicionales. No muestra precio, costo ni stock:
 * el backend (SoloImagenesGuard) rechaza cualquier otra escritura.
 *
 * El admin también la ve: sirve para cargar fotos rápido sin abrir la ficha.
 */

interface ProductoFoto {
    id: number;
    codigo?: string | null;
    descripcion: string;
    imagenUrl?: string | null;
    /** Firmada para mostrar (S3 privado); la otra es la que se guarda. */
    imagenUrlDisplay?: string | null;
}

/** La lista no trae las fotos adicionales: salen del detalle del producto. */
interface Extras {
    guardar: string[];
    ver: string[];
}

const POR_PAGINA = 24;

/** La galería se guarda con la URL limpia; la firmada de S3 vence. */
const urlPersistente = (u: string) => (u.includes('amazonaws.com') ? u.split('?')[0] : u);

const listaDe = (raw: unknown): string[] => {
    if (Array.isArray(raw)) return raw.filter((u): u is string => typeof u === 'string' && !!u);
    if (typeof raw === 'string' && raw.trim()) {
        try {
            return listaDe(JSON.parse(raw));
        } catch {
            return [raw];
        }
    }
    return [];
};

const urlDeRespuesta = (resp: any): string | null =>
    resp?.data?.data?.url || resp?.data?.url || resp?.data?.data?.imagenUrl || resp?.data?.imagenUrl || null;

export default function FotosProductos() {
    const { alert } = useAlertStore();
    const [busqueda, setBusqueda] = useState('');
    const debounce = useDebounce(busqueda, 350);
    const [pagina, setPagina] = useState(1);
    const [productos, setProductos] = useState<ProductoFoto[]>([]);
    const [total, setTotal] = useState(0);
    const [cargando, setCargando] = useState(false);
    const [abierto, setAbierto] = useState<ProductoFoto | null>(null);

    const cargar = useCallback(async () => {
        setCargando(true);
        try {
            const query = new URLSearchParams({ page: String(pagina), limit: String(POR_PAGINA), search: debounce || '' });
            const resp: any = await get(`productos?${query}`);
            setProductos(Array.isArray(resp?.data?.productos) ? resp.data.productos : []);
            setTotal(typeof resp?.data?.total === 'number' ? resp.data.total : 0);
        } catch {
            setProductos([]);
            setTotal(0);
        } finally {
            setCargando(false);
        }
    }, [pagina, debounce]);

    useEffect(() => {
        setPagina(1);
    }, [debounce]);

    useEffect(() => {
        cargar();
    }, [cargar]);

    const actualizarLocal = (p: ProductoFoto) => {
        setProductos((prev) => prev.map((x) => (x.id === p.id ? { ...x, ...p } : x)));
        setAbierto((prev) => (prev && prev.id === p.id ? { ...prev, ...p } : prev));
    };

    const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));

    return (
        <div className="p-4 md:p-6">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Fotos de productos</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Sube, cambia u ordena las fotos. Los datos del producto no se tocan desde aquí.</p>
                </div>
                <div className="relative w-full md:w-80">
                    <Icon icon="solar:magnifer-linear" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        placeholder="Buscar por nombre o código"
                        className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-violet-400 dark:border-slate-700 dark:bg-[#0F1117] dark:text-white"
                    />
                </div>
            </div>

            {cargando && !productos.length ? (
                <p className="py-16 text-center text-sm text-gray-400">Cargando productos…</p>
            ) : !productos.length ? (
                <p className="py-16 text-center text-sm text-gray-400">No hay productos con esa búsqueda.</p>
            ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                    {productos.map((p) => {
                        const foto = p.imagenUrlDisplay || p.imagenUrl;
                        return (
                            <button
                                key={p.id}
                                type="button"
                                onClick={() => setAbierto(p)}
                                className="group overflow-hidden rounded-2xl border border-gray-100 bg-white text-left transition hover:border-violet-300 hover:shadow-sm dark:border-slate-800 dark:bg-[#0F1117]"
                            >
                                <div className="relative aspect-square bg-gray-50 dark:bg-slate-900">
                                    {foto ? (
                                        <img src={foto} alt="" className="h-full w-full object-cover" loading="lazy" />
                                    ) : (
                                        <div className="flex h-full flex-col items-center justify-center gap-1 text-gray-300">
                                            <Icon icon="solar:camera-add-linear" className="text-3xl" />
                                            <span className="text-[11px] font-medium">Sin foto</span>
                                        </div>
                                    )}
                                </div>
                                <div className="p-2.5">
                                    <p className="line-clamp-2 text-xs font-medium text-gray-800 dark:text-gray-100">{p.descripcion}</p>
                                    {p.codigo && <p className="mt-0.5 text-[11px] text-gray-400">{p.codigo}</p>}
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}

            {paginas > 1 && (
                <div className="mt-5 flex items-center justify-center gap-3 text-sm">
                    <button type="button" disabled={pagina <= 1} onClick={() => setPagina((n) => n - 1)} className="rounded-lg border border-gray-200 px-3 py-1.5 disabled:opacity-40 dark:border-slate-700 dark:text-white">
                        Anterior
                    </button>
                    <span className="text-gray-500">
                        {pagina} de {paginas}
                    </span>
                    <button type="button" disabled={pagina >= paginas} onClick={() => setPagina((n) => n + 1)} className="rounded-lg border border-gray-200 px-3 py-1.5 disabled:opacity-40 dark:border-slate-700 dark:text-white">
                        Siguiente
                    </button>
                </div>
            )}

            {abierto && (
                <EditorFotos
                    producto={abierto}
                    onClose={() => setAbierto(null)}
                    onCambio={actualizarLocal}
                    onError={(m) => alert(m, 'error')}
                    onOk={(m) => alert(m, 'success')}
                />
            )}
        </div>
    );
}

function EditorFotos({
    producto,
    onClose,
    onCambio,
    onError,
    onOk,
}: {
    producto: ProductoFoto;
    onClose: () => void;
    onCambio: (p: ProductoFoto) => void;
    onError: (m: string) => void;
    onOk: (m: string) => void;
}) {
    const [subiendo, setSubiendo] = useState(false);
    const [extras, setExtras] = useState<Extras | null>(null);
    const principalRef = useRef<HTMLInputElement>(null);
    const extraRef = useRef<HTMLInputElement>(null);
    const fotoPrincipal = producto.imagenUrlDisplay || producto.imagenUrl;

    useEffect(() => {
        let vivo = true;
        get(`productos/${producto.id}`)
            .then((resp: any) => {
                if (!vivo) return;
                const guardar = listaDe(resp?.data?.imagenesExtra);
                const ver = listaDe(resp?.data?.imagenesExtraDisplay);
                setExtras({ guardar, ver: ver.length === guardar.length ? ver : guardar });
            })
            .catch(() => vivo && setExtras({ guardar: [], ver: [] }));
        return () => {
            vivo = false;
        };
    }, [producto.id]);

    const mensajeError = (e: any) => e?.response?.data?.message || e?.message || 'No se pudo guardar la foto.';

    const subirPrincipal = async (file: File) => {
        setSubiendo(true);
        try {
            const fd = new FormData();
            fd.append('file', file);
            const resp = await apiClient.post(`/productos/${producto.id}/imagen`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            const url = urlDeRespuesta(resp);
            if (url) onCambio({ ...producto, imagenUrl: url, imagenUrlDisplay: url });
            onOk('Foto principal actualizada');
        } catch (e) {
            onError(mensajeError(e));
        } finally {
            setSubiendo(false);
        }
    };

    const guardarExtras = async (lista: Extras) => {
        setSubiendo(true);
        try {
            await apiClient.patch(`/productos/${producto.id}/imagenes-extra`, { imagenesExtra: lista.guardar.map(urlPersistente) });
            setExtras(lista);
        } catch (e) {
            onError(mensajeError(e));
        } finally {
            setSubiendo(false);
        }
    };

    const agregarExtras = async (files: FileList) => {
        if (!extras) return;
        setSubiendo(true);
        const nuevas: string[] = [];
        try {
            for (const file of Array.from(files)) {
                const fd = new FormData();
                fd.append('file', file);
                const resp = await apiClient.post(`/productos/${producto.id}/imagen-extra`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                const url = urlDeRespuesta(resp);
                if (url) nuevas.push(url);
            }
        } catch (e) {
            onError(mensajeError(e));
        } finally {
            setSubiendo(false);
        }
        if (nuevas.length) await guardarExtras({ guardar: [...extras.guardar, ...nuevas], ver: [...extras.ver, ...nuevas] });
    };

    const mover = (i: number, d: -1 | 1) => {
        if (!extras) return;
        const j = i + d;
        if (j < 0 || j >= extras.guardar.length) return;
        const swap = (l: string[]) => {
            const c = [...l];
            [c[i], c[j]] = [c[j], c[i]];
            return c;
        };
        guardarExtras({ guardar: swap(extras.guardar), ver: swap(extras.ver) });
    };

    const quitar = (i: number) => {
        if (!extras) return;
        guardarExtras({ guardar: extras.guardar.filter((_, k) => k !== i), ver: extras.ver.filter((_, k) => k !== i) });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
            <div
                className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl dark:bg-[#0F1117]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                        <h2 className="text-base font-semibold text-gray-900 dark:text-white">{producto.descripcion}</h2>
                        {producto.codigo && <p className="text-xs text-gray-400">{producto.codigo}</p>}
                    </div>
                    <button type="button" onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800">
                        <Icon icon="solar:close-circle-bold-duotone" width={22} className="text-gray-400" />
                    </button>
                </div>

                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">Foto principal</p>
                <div className="mb-5 flex items-center gap-4">
                    <div className="h-32 w-32 flex-none overflow-hidden rounded-xl border border-gray-100 bg-gray-50 dark:border-slate-800 dark:bg-slate-900">
                        {fotoPrincipal ? (
                            <img src={fotoPrincipal} alt="" className="h-full w-full object-cover" />
                        ) : (
                            <div className="flex h-full items-center justify-center text-gray-300">
                                <Icon icon="solar:camera-linear" className="text-3xl" />
                            </div>
                        )}
                    </div>
                    <button
                        type="button"
                        disabled={subiendo}
                        onClick={() => principalRef.current?.click()}
                        className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
                    >
                        <Icon icon="solar:upload-linear" />
                        {producto.imagenUrl ? 'Cambiar foto' : 'Subir foto'}
                    </button>
                    <input
                        ref={principalRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                            const f = e.target.files?.[0];
                            e.target.value = '';
                            if (f) subirPrincipal(f);
                        }}
                    />
                </div>

                <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Fotos adicionales{extras ? ` (${extras.guardar.length})` : ''}</p>
                    <button
                        type="button"
                        disabled={subiendo || !extras}
                        onClick={() => extraRef.current?.click()}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-slate-700 dark:text-gray-200 dark:hover:bg-slate-800"
                    >
                        <Icon icon="solar:add-circle-linear" /> Agregar
                    </button>
                    <input
                        ref={extraRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                            const fs = e.target.files;
                            if (fs?.length) agregarExtras(fs);
                            e.target.value = '';
                        }}
                    />
                </div>
                {!extras ? (
                    <p className="py-6 text-center text-xs text-gray-400">Cargando fotos…</p>
                ) : extras.guardar.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-gray-200 py-6 text-center text-xs text-gray-400 dark:border-slate-700">Sin fotos adicionales.</p>
                ) : (
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                        {extras.ver.map((u, i) => (
                            <div key={u + i} className="group relative aspect-square overflow-hidden rounded-xl border border-gray-100 bg-gray-50 dark:border-slate-800">
                                <img src={u} alt="" className="h-full w-full object-cover" />
                                <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/50 p-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                                    <button type="button" disabled={subiendo || i === 0} onClick={() => mover(i, -1)} className="rounded p-1 text-white disabled:opacity-30" title="Mover antes">
                                        <Icon icon="solar:arrow-left-linear" />
                                    </button>
                                    <button type="button" disabled={subiendo} onClick={() => quitar(i)} className="rounded p-1 text-white" title="Quitar">
                                        <Icon icon="solar:trash-bin-trash-linear" />
                                    </button>
                                    <button type="button" disabled={subiendo || i === extras.ver.length - 1} onClick={() => mover(i, 1)} className="rounded p-1 text-white disabled:opacity-30" title="Mover después">
                                        <Icon icon="solar:arrow-right-linear" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {subiendo && <p className="mt-3 text-xs text-violet-600">Guardando…</p>}
            </div>
        </div>
    );
}
