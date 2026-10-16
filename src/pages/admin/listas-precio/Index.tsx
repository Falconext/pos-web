import { useEffect, useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import Loading from '@/components/Loading';
import ModalConfirm from '@/components/ModalConfirm';
import { useListasPrecioStore, IListaPrecio } from '@/zustand/listasPrecio';
import ListaPrecioModal from './ListaPrecioModal';

// Celda de asignación (Cliente / Empleado / Tienda). Muestra el primero y
// cuántos más hay: con cinco sedes la tabla se volvía ilegible, y el detalle
// completo ya está al abrir la lista.
const Asignados = ({ nombres }: { nombres?: string[] }) => {
    const lista = nombres || [];
    if (lista.length === 0) {
        return <span className="text-xs text-gray-300 dark:text-slate-600">—</span>;
    }
    return (
        <span className="text-xs text-gray-600 dark:text-gray-300">
            {lista[0]}
            {lista.length > 1 && (
                <span className="ml-1 text-[10px] font-bold text-violet-500">+{lista.length - 1}</span>
            )}
        </span>
    );
};

const ListasPrecioIndex = () => {
    const { listas, loading, listar, eliminar, reordenar } = useListasPrecioStore();
    const [showModal, setShowModal] = useState(false);
    const [selected, setSelected] = useState<IListaPrecio | null>(null);
    const [isEdit, setIsEdit] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [toDelete, setToDelete] = useState<IListaPrecio | null>(null);
    // El id arrastrado vive en un ref además del estado: `drop` llega en un
    // evento distinto al de `dragstart`, y leerlo del estado obliga a que React
    // haya re-renderizado en el medio. El estado queda solo para el atenuado.
    const [arrastrando, setArrastrando] = useState<number | null>(null);
    const arrastrandoRef = useRef<number | null>(null);
    const iniciarArrastre = (id: number) => { arrastrandoRef.current = id; setArrastrando(id); };
    const terminarArrastre = () => { arrastrandoRef.current = null; setArrastrando(null); };

    useEffect(() => { listar(); }, []);

    const handleCreate = () => { setSelected(null); setIsEdit(false); setShowModal(true); };
    const handleEdit = (l: IListaPrecio) => { setSelected(l); setIsEdit(true); setShowModal(true); };
    const confirmDelete = async () => {
        if (toDelete) { await eliminar(toDelete.id); setShowConfirm(false); setToDelete(null); }
    };

    // Reordenar = cambiar quién gana cuando dos listas podrían aplicar.
    const soltarSobre = (destinoId: number) => {
        const origen = arrastrandoRef.current;
        if (origen == null || origen === destinoId) return;
        const ids = listas.map(l => l.id);
        const desde = ids.indexOf(origen);
        const hasta = ids.indexOf(destinoId);
        if (desde < 0 || hasta < 0) return;
        ids.splice(hasta, 0, ids.splice(desde, 1)[0]);
        terminarArrastre();
        reordenar(ids);
    };

    if (loading && listas.length === 0) return <Loading />;

    return (
        <div className="min-h-screen px-4 pb-6 bg-gray-50 dark:bg-[#0A0D14]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 pt-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                        <Icon icon="solar:tag-price-bold-duotone" className="text-violet-600 dark:text-violet-400" />
                        Listas de Precio
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-3xl">
                        Una lista fija precios distintos para un cliente, un vendedor o un local.
                        Si dos podrían aplicar, gana la que esté más arriba: arrastra las filas para cambiarlo.
                        La marcada como <span className="font-semibold">por defecto</span> es el precio general del negocio.
                    </p>
                </div>
                <button
                    onClick={handleCreate}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 transition-all shadow-lg shadow-violet-500/20 active:scale-95"
                >
                    <Icon icon="solar:add-circle-bold" className="text-lg" />
                    Nueva Lista
                </button>
            </div>

            <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
                {listas.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[920px]">
                            <thead>
                                <tr className="border-b border-gray-100 dark:border-slate-800">
                                    {['', 'Posición', 'Nombre', 'Descripción', 'Cliente', 'Empleado', 'Tienda', 'Productos', 'Estado', 'Por defecto', ''].map((h, i) => (
                                        <th key={i} className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500 whitespace-nowrap">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {listas.map((l, idx) => (
                                    <tr
                                        key={l.id}
                                        draggable
                                        onDragStart={() => iniciarArrastre(l.id)}
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={(e) => { e.preventDefault(); soltarSobre(l.id); }}
                                        onDragEnd={terminarArrastre}
                                        className={`border-b border-gray-50 dark:border-slate-800/60 transition-colors ${arrastrando === l.id ? 'opacity-40' : 'hover:bg-violet-50/40 dark:hover:bg-violet-950/10'}`}
                                    >
                                        <td className="px-3 py-3 cursor-grab active:cursor-grabbing text-gray-300 dark:text-slate-600" title="Arrastra para cambiar la prioridad">
                                            <Icon icon="solar:hamburger-menu-linear" width={16} />
                                        </td>
                                        <td className="px-3 py-3 text-xs font-bold text-gray-400 tabular-nums">{idx + 1}</td>
                                        <td className="px-3 py-3">
                                            <span className="font-semibold text-sm text-gray-800 dark:text-white">{l.nombre}</span>
                                        </td>
                                        <td className="px-3 py-3 max-w-[220px]">
                                            <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
                                                {l.descripcion || <span className="text-gray-300 dark:text-slate-600">—</span>}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3"><Asignados nombres={l.clienteNombres} /></td>
                                        <td className="px-3 py-3"><Asignados nombres={l.usuarioNombres} /></td>
                                        <td className="px-3 py-3"><Asignados nombres={l.sedeNombres} /></td>
                                        <td className="px-3 py-3 text-xs font-semibold text-gray-600 dark:text-gray-300 tabular-nums">{l.totalItems ?? 0}</td>
                                        <td className="px-3 py-3">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${l.activo ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${l.activo ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                                {l.activo ? 'Activa' : 'Inactiva'}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3">
                                            {l.esPorDefecto
                                                ? <span className="text-[10px] font-bold text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full uppercase">Sí</span>
                                                : <span className="text-xs text-gray-300 dark:text-slate-600">No</span>}
                                        </td>
                                        <td className="px-3 py-3">
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => handleEdit(l)} title="Editar"
                                                    className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30">
                                                    <Icon icon="solar:pen-bold" width={16} />
                                                </button>
                                                <button onClick={() => { setToDelete(l); setShowConfirm(true); }} title="Eliminar"
                                                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30">
                                                    <Icon icon="solar:trash-bin-trash-bold" width={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        No hay listas de precio. Crea la primera para cobrar distinto a un cliente, un vendedor o un local.
                    </div>
                )}
            </div>

            {showModal && <ListaPrecioModal isOpen={showModal} onClose={() => setShowModal(false)} lista={selected} isEdit={isEdit} />}
            {showConfirm && toDelete && (
                <ModalConfirm isOpenModal={showConfirm} setIsOpenModal={setShowConfirm} title="Eliminar Lista de Precio"
                    information={`¿Eliminar la lista "${toDelete.nombre}"? Sus precios asignados dejarán de aplicarse.`}
                    confirmSubmit={confirmDelete} />
            )}
        </div>
    );
};

export default ListasPrecioIndex;
