import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useResellerStore } from '@/zustand/resellers';

export default function AdminResellers() {
    const { resellers, getAllResellers, createReseller, recargarSaldo } = useResellerStore();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);
    const [selectedReseller, setSelectedReseller] = useState<any>(null);

    const [isEditMode, setIsEditMode] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    // Form State for Create/Edit
    const [formData, setFormData] = useState({
        nombre: '',
        codigo: '',
        representante: '',
        telefono: '',
        email: ''
    });

    // Form State for Recharge
    const [rechargeData, setRechargeData] = useState({
        monto: '',
        referencia: ''
    });

    useEffect(() => {
        getAllResellers();
    }, []);

    const handleCreateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleRechargeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setRechargeData(prev => ({ ...prev, [name]: value }));
    };

    const openCreateModal = () => {
        setIsEditMode(false);
        setEditingId(null);
        setFormData({
            nombre: '',
            codigo: '',
            representante: '',
            telefono: '',
            email: ''
        });
        setIsCreateModalOpen(true);
    };

    const openEditModal = (reseller: any) => {
        setIsEditMode(true);
        setEditingId(reseller.id);
        setFormData({
            nombre: reseller.nombre,
            codigo: reseller.codigo,
            representante: reseller.representante || '',
            telefono: reseller.telefono || '',
            email: reseller.email
        });
        setIsCreateModalOpen(true);
    };

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        let result;
        if (isEditMode && editingId) {
            result = await useResellerStore.getState().updateReseller(editingId, formData);
        } else {
            result = await createReseller(formData);
        }

        if (result.success) {
            setIsCreateModalOpen(false);
            setFormData({
                nombre: '',
                codigo: '',
                representante: '',
                telefono: '',
                email: ''
            });
        }
    };

    const openRechargeModal = (reseller: any) => {
        setSelectedReseller(reseller);
        setRechargeData({ monto: '', referencia: '' });
        setIsRechargeModalOpen(true);
    };

    const handleRechargeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedReseller) return;

        const monto = parseFloat(rechargeData.monto);
        if (isNaN(monto) || monto <= 0) return; // Alert handled by store if needed or add validation here

        const result = await recargarSaldo(selectedReseller.id, monto, rechargeData.referencia);
        if (result.success) {
            setIsRechargeModalOpen(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Icon icon="solar:users-group-two-rounded-bold-duotone" className="text-indigo-600" />
                        Distribuidores
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Gestiona los socios comerciales y sus saldos</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition-all active:scale-95 hover:shadow-indigo-500/40"
                >
                    <Icon icon="solar:user-plus-bold" width="20" />
                    Nuevo Distribuidor
                </button>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase font-semibold">
                            <tr>
                                <th className="px-6 py-4">Nombre / Código</th>
                                <th className="px-6 py-4">Representante</th>
                                <th className="px-6 py-4">Contacto</th>
                                <th className="px-6 py-4 text-right">Saldo</th>
                                <th className="px-6 py-4 text-center">Clientes</th>
                                <th className="px-6 py-4 text-center">Estado</th>
                                <th className="px-6 py-4 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {resellers.length === 0 ? (
                                <tr>
                                    <td className="px-6 py-12" colSpan={7}>
                                        <div className="flex flex-col items-center justify-center text-gray-400">
                                            <Icon icon="solar:users-group-two-rounded-linear" width="48" className="mb-2 opacity-50" />
                                            <p>No hay distribuidores registrados</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                resellers.map((reseller) => (
                                    <tr key={reseller.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-gray-800">{reseller.nombre}</p>
                                            <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded border border-indigo-100 font-mono">
                                                {reseller.codigo}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">{reseller.representante || '-'}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col text-xs text-gray-500 gap-1">
                                                {reseller.email && (
                                                    <div className="flex items-center gap-1.5">
                                                        <Icon icon="solar:letter-linear" width="14" />
                                                        {reseller.email}
                                                    </div>
                                                )}
                                                {reseller.telefono && (
                                                    <div className="flex items-center gap-1.5">
                                                        <Icon icon="solar:phone-linear" width="14" />
                                                        {reseller.telefono}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono font-bold text-gray-700">
                                            S/ {Number(reseller.saldo).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center justify-center bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full text-xs font-bold">
                                                {reseller._count?.empresas || 0}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${reseller.activo ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${reseller.activo ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                                                {reseller.activo ? 'Activo' : 'Inactivo'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => openRechargeModal(reseller)}
                                                    title="Recargar Saldo"
                                                    className="text-indigo-600 hover:text-indigo-800 p-1.5 hover:bg-indigo-50 rounded-lg transition-colors"
                                                >
                                                    <Icon icon="solar:wallet-money-bold" width="18" />
                                                </button>
                                                {/* Edit functionality not fully implemented on backend yet, so just placeholder or same modal with hydrate */}
                                                <button
                                                    onClick={() => openEditModal(reseller)}
                                                    title="Editar"
                                                    className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-50 rounded-lg transition-colors"
                                                >
                                                    <Icon icon="solar:pen-bold" width="18" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsCreateModalOpen(false)}></div>
                    <div className="bg-white rounded-3xl p-8 w-full max-w-lg z-10 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">{isEditMode ? 'Editar Distribuidor' : 'Nuevo Distribuidor'}</h2>
                                <p className="text-sm text-gray-500">{isEditMode ? 'Actualiza los datos del socio' : 'Registra un nuevo socio comercial'}</p>
                            </div>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <Icon icon="solar:close-circle-bold" width="24" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5 col-span-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Nombre Comercial</label>
                                    <input
                                        required
                                        name="nombre"
                                        value={formData.nombre}
                                        onChange={handleCreateChange}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-gray-400 font-medium"
                                        placeholder="Ej. Distribuciones Lima Norte"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Código Único</label>
                                    <input
                                        required
                                        name="codigo"
                                        value={formData.codigo}
                                        onChange={handleCreateChange}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-gray-400 font-medium font-mono"
                                        placeholder="Ej. RES-001"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Teléfono</label>
                                    <input
                                        name="telefono"
                                        value={formData.telefono}
                                        onChange={handleCreateChange}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-gray-400 font-medium"
                                        placeholder="999 999 999"
                                    />
                                </div>

                                <div className="space-y-1.5 col-span-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Email (Usuario)</label>
                                    <input
                                        required
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleCreateChange}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-gray-400 font-medium"
                                        placeholder="contacto@distribuidor.com"
                                    />
                                </div>

                                <div className="space-y-1.5 col-span-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Representante Legal</label>
                                    <input
                                        name="representante"
                                        value={formData.representante}
                                        onChange={handleCreateChange}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-gray-400 font-medium"
                                        placeholder="Nombre completo"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="flex-1 py-3 text-gray-600 font-bold bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 text-white font-bold bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/30"
                                >
                                    {isEditMode ? 'Guardar Cambios' : 'Crear Distribuidor'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Recharge Modal */}
            {isRechargeModalOpen && selectedReseller && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsRechargeModalOpen(false)}></div>
                    <div className="bg-white rounded-3xl p-8 w-full max-w-sm z-10 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Icon icon="solar:wallet-money-bold-duotone" width="36" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-800">Recargar Saldo</h2>
                            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide font-bold">{selectedReseller.nombre}</p>
                            <p className="text-sm text-gray-400 mt-2">Saldo Actual: <span className="text-gray-800 font-bold font-mono">S/ {Number(selectedReseller.saldo).toFixed(2)}</span></p>
                        </div>

                        <form onSubmit={handleRechargeSubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Monto a Recargar (S/)</label>
                                <input
                                    required
                                    type="number"
                                    step="0.01"
                                    min="1"
                                    name="monto"
                                    value={rechargeData.monto}
                                    onChange={handleRechargeChange}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder:text-gray-400 font-bold text-center text-lg"
                                    placeholder="0.00"
                                    autoFocus
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Referencia (Opcional)</label>
                                <input
                                    name="referencia"
                                    value={rechargeData.referencia}
                                    onChange={handleRechargeChange}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500 outline-none transition-all placeholder:text-gray-400 text-sm"
                                    placeholder="Ej. Transferencia BCP #1234"
                                />
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsRechargeModalOpen(false)}
                                    className="flex-1 py-3 text-gray-600 font-bold bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 text-white font-bold bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/30"
                                >
                                    Confirmar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
