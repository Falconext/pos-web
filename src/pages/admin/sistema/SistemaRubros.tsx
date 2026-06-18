import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { get, post, patch, del } from '@/utils/fetch';
import useAlertStore from '@/zustand/alert';
import Button from '@/components/Button';
import InputPro from '@/components/InputPro';
import Modal from '@/components/Modal';
import ModalConfirm from '@/components/ModalConfirm';
import DataTableStyles from '@/components/Datatable/table.module.css';
import TableSkeleton from '@/components/Skeletons/table';

interface Rubro {
    id: number;
    nombre: string;
    features?: Record<string, boolean>;
    _count?: { empresas: number };
}

const RUBRO_FEATURES = [
    { key: 'controlStock', label: 'Stock', group: 'Inventario' },
    { key: 'usaCodigoBarras', label: 'Código barras', group: 'Inventario' },
    { key: 'gestionLotes', label: 'Lotes', group: 'Inventario' },
    { key: 'requiereVencimientos', label: 'Vencimientos', group: 'Inventario' },
    { key: 'permiteFraccionamiento', label: 'Fraccionamiento', group: 'Ventas' },
    { key: 'gestionOfertas', label: 'Ofertas', group: 'Ventas' },
    { key: 'fichaTecnicaComputo', label: 'Ficha cómputo', group: 'Cómputo' },
    { key: 'controlSeriesGarantia', label: 'Series/garantía', group: 'Cómputo' },
];

export default function SistemaRubros() {
    const { alert, load } = useAlertStore();

    const [rubros, setRubros] = useState<Rubro[]>([]);
    const [loading, setLocalLoading] = useState(false);
    const [search, setSearch] = useState('');

    const [modalOpen, setModalOpen] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [nombre, setNombre] = useState('');
    const [saving, setSaving] = useState(false);

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [savingFeature, setSavingFeature] = useState<string | null>(null);

    const cargar = async () => {
        setLocalLoading(true);
        try {
            const res = await get<any>('/rubro');
            const lista = Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];
            setRubros(lista);
        } catch {
            alert('No se pudo cargar los rubros', 'error');
        } finally {
            setLocalLoading(false);
        }
    };

    useEffect(() => { cargar(); }, []);

    const handleOpenCreate = () => {
        setIsEdit(false);
        setEditId(null);
        setNombre('');
        setModalOpen(true);
    };

    const handleOpenEdit = (r: Rubro) => {
        setIsEdit(true);
        setEditId(r.id);
        setNombre(r.nombre);
        setModalOpen(true);
    };

    const handleSubmit = async () => {
        if (!nombre.trim()) return alert('El nombre es obligatorio', 'warning');
        setSaving(true);
        try {
            if (isEdit && editId) {
                await patch(`/rubro/${editId}`, { nombre: nombre.trim() });
                alert('Rubro actualizado', 'success');
            } else {
                await post('/rubro', { nombre: nombre.trim() });
                alert('Rubro creado', 'success');
            }
            setModalOpen(false);
            cargar();
        } catch (e: any) {
            alert(e?.response?.data?.message || 'Error al guardar', 'error');
        } finally {
            setSaving(false);
        }
    };

    const confirmDelete = (id: number) => {
        setDeleteId(id);
        setConfirmOpen(true);
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        load(true);
        try {
            await del(`/rubro/${deleteId}`);
            alert('Rubro eliminado', 'success');
            cargar();
        } catch (e: any) {
            alert(e?.response?.data?.message || 'No se pudo eliminar', 'error');
        } finally {
            load(false);
        }
    };

    const toggleFeature = async (rubro: Rubro, featureKey: string) => {
        const nextFeatures = {
            ...(rubro.features ?? {}),
            [featureKey]: !Boolean(rubro.features?.[featureKey]),
        };
        setSavingFeature(`${rubro.id}:${featureKey}`);
        setRubros((prev) => prev.map((item) => item.id === rubro.id ? { ...item, features: nextFeatures } : item));
        try {
            const res = await patch<any>(`/rubro/${rubro.id}/features`, { features: nextFeatures });
            const updated = res.data ?? res;
            setRubros((prev) => prev.map((item) => item.id === rubro.id ? { ...item, ...(updated || {}), features: updated?.features ?? nextFeatures } : item));
        } catch (e: any) {
            alert(e?.response?.data?.message || 'No se pudo actualizar la característica', 'error');
            cargar();
        } finally {
            setSavingFeature(null);
        }
    };

    const filtered = rubros.filter(r =>
        r.nombre.toLowerCase().includes(search.toLowerCase())
    );

    if (loading && rubros.length === 0) return <TableSkeleton />;

    return (
        <div className="min-h-screen px-2 pb-4 bg-gray-50 dark:bg-[#0A0D14]">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 pt-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                        <Icon icon="solar:buildings-3-bold-duotone" className="text-violet-600 dark:text-violet-400" />
                        Rubros de Negocio
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Tipos de negocio que pueden tener las empresas registradas en el sistema
                    </p>
                </div>
                <button
                    onClick={handleOpenCreate}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 transition-all shadow-lg shadow-violet-500/20 active:scale-95"
                >
                    <Icon icon="solar:add-circle-bold" className="text-lg" />
                    Nuevo Rubro
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
                {[
                    { label: 'Total rubros', value: rubros.length, icon: 'solar:buildings-3-bold-duotone', color: 'text-violet-500 bg-violet-50 dark:bg-violet-900/20' },
                    { label: 'Con empresas', value: rubros.filter(r => (r._count?.empresas ?? 0) > 0).length, icon: 'solar:check-circle-bold-duotone', color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' },
                    { label: 'Sin usar', value: rubros.filter(r => (r._count?.empresas ?? 0) === 0).length, icon: 'solar:archive-bold-duotone', color: 'text-gray-400 bg-gray-100 dark:bg-slate-800' },
                ].map(stat => (
                    <div key={stat.label} className="bg-white dark:bg-[#111827] rounded-xl border border-gray-100 dark:border-slate-800 px-4 py-3 flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${stat.color}`}>
                            <Icon icon={stat.icon} width={18} />
                        </div>
                        <div>
                            <p className="text-xl font-bold text-gray-900 dark:text-white leading-none">{stat.value}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Search */}
            <div className="mb-4 max-w-sm">
                <InputPro
                    name="search"
                    placeholder="Buscar rubro..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
                {filtered.length > 0 ? (
                    <table className={DataTableStyles.table}>
                        <thead>
                            <tr>
                                <th style={{ textAlign: 'center', width: 48 }}>#</th>
                                <th>Nombre del Rubro</th>
                                <th style={{ textAlign: 'center' }}>Empresas</th>
                                <th>Características por defecto</th>
                                <th style={{ textAlign: 'center' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((r, i) => (
                                <tr key={r.id} className="group">
                                    <td style={{ textAlign: 'center' }}>
                                        <span className="text-xs text-gray-400 dark:text-slate-500 font-mono">{i + 1}</span>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center flex-shrink-0">
                                                <Icon icon="solar:buildings-3-bold-duotone" width={16} className="text-violet-500" />
                                            </div>
                                            <span className="font-semibold text-gray-800 dark:text-slate-200">{r.nombre}</span>
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        {(r._count?.empresas ?? 0) > 0 ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                                                <Icon icon="solar:buildings-2-bold" width={11} />
                                                {r._count?.empresas} empresa{(r._count?.empresas ?? 0) !== 1 ? 's' : ''}
                                            </span>
                                        ) : (
                                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs text-gray-400 dark:text-slate-500 bg-gray-100 dark:bg-slate-800">
                                                Sin usar
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        <div className="flex flex-wrap gap-1.5 max-w-[520px]">
                                            {RUBRO_FEATURES.map((feature) => {
                                                const active = Boolean(r.features?.[feature.key]);
                                                const savingThis = savingFeature === `${r.id}:${feature.key}`;
                                                return (
                                                    <button
                                                        key={feature.key}
                                                        type="button"
                                                        onClick={() => toggleFeature(r, feature.key)}
                                                        disabled={Boolean(savingFeature)}
                                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all ${active
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800'
                                                            : 'bg-gray-50 text-gray-400 border-gray-200 dark:bg-slate-900 dark:text-slate-500 dark:border-slate-800'
                                                            } ${savingThis ? 'opacity-60' : ''}`}
                                                        title={feature.group}
                                                    >
                                                        <Icon icon={active ? 'solar:check-circle-bold' : 'solar:circle-linear'} width={12} />
                                                        {feature.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <div className="flex items-center justify-center gap-1">
                                            <div className={DataTableStyles.tooltipContainer}>
                                                <button
                                                    onClick={() => handleOpenEdit(r)}
                                                    className="w-7 h-7 rounded-lg flex items-center justify-center bg-violet-50 text-violet-600 hover:bg-violet-100 border border-violet-100 dark:bg-violet-900/20 dark:border-violet-800 dark:text-violet-400 transition-all"
                                                >
                                                    <Icon icon="solar:pen-bold" width={13} />
                                                </button>
                                                <p className={DataTableStyles.tooltip}>Editar</p>
                                            </div>
                                            <div className={DataTableStyles.tooltipContainer}>
                                                <button
                                                    onClick={() => confirmDelete(r.id)}
                                                    className="w-7 h-7 rounded-lg flex items-center justify-center bg-rose-50 text-rose-500 hover:bg-rose-100 border border-rose-100 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400 transition-all"
                                                    disabled={(r._count?.empresas ?? 0) > 0}
                                                    title={(r._count?.empresas ?? 0) > 0 ? 'Tiene empresas asignadas' : 'Eliminar'}
                                                >
                                                    <Icon icon="solar:trash-bin-trash-bold" width={13} />
                                                </button>
                                                <p className={DataTableStyles.tooltip}>
                                                    {(r._count?.empresas ?? 0) > 0 ? 'Tiene empresas' : 'Eliminar'}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <div className="bg-violet-50 dark:bg-violet-900/20 p-6 rounded-full mb-4">
                            <Icon icon="solar:buildings-3-linear" className="text-6xl text-violet-300 dark:text-violet-700" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-1">
                            {search ? 'Sin resultados' : 'No hay rubros registrados'}
                        </h3>
                        <p className="text-sm text-gray-400 dark:text-gray-500 text-center">
                            {search ? `No se encontró "${search}"` : 'Crea el primer rubro del sistema'}
                        </p>
                        {!search && (
                            <button
                                onClick={handleOpenCreate}
                                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-all"
                            >
                                <Icon icon="solar:add-circle-bold" />
                                Crear Rubro
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Modal crear/editar */}
            <Modal
                isOpenModal={modalOpen}
                closeModal={() => setModalOpen(false)}
                title={isEdit ? 'Editar Rubro' : 'Nuevo Rubro'}
            >
                <div className="p-6">
                    <InputPro
                        isLabel
                        label="Nombre del Rubro"
                        name="nombre"
                        value={nombre}
                        onChange={e => setNombre(e.target.value)}
                        placeholder="Ej. Farmacia, Restaurante, Bodega..."
                        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                        autoFocus
                    />
                    <p className="text-xs text-gray-400 mt-2">
                        El nombre debe ser descriptivo del tipo de negocio. Se usa para activar funciones específicas en el sistema.
                    </p>
                </div>
                <div className="flex justify-end gap-2 p-4 pt-0">
                    <Button onClick={() => setModalOpen(false)} color="secondary" outline>Cancelar</Button>
                    <Button onClick={handleSubmit} color="primary" disabled={saving}>
                        {saving ? 'Guardando...' : 'Guardar'}
                    </Button>
                </div>
            </Modal>

            <ModalConfirm
                isOpenModal={confirmOpen}
                setIsOpenModal={setConfirmOpen}
                confirmSubmit={handleDelete}
                title="¿Eliminar Rubro?"
                information="Se eliminará permanentemente este rubro. Solo se puede eliminar si no tiene empresas asignadas."
            />
        </div>
    );
}
