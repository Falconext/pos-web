import React, { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { useAuthStore } from '@/zustand/auth';
import { useResellerPanelStore } from '@/zustand/reseller-panel';
import Select from '@/components/Select';
import ClienteDetalleModal from '@/components/reseller/ClienteDetalleModal';

export default function ResellerClientes() {
    const { auth } = useAuthStore();
    const { clientes, getClientes, createCliente, stats, getDashboard, planes, getPlanes } = useResellerPanelStore(); // Added planes, getPlanes
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [selectedClientId, setSelectedClientId] = useState<number>(0);

    // Form State
    const [formData, setFormData] = useState({
        rut: '',
        razonSocial: '',
        representa: '',
        email: '',
        telefono: '',
        password: '',
        planId: ''
    });

    useEffect(() => {
        console.log("ResellerClientes mounted. Auth:", auth);
        getPlanes(); // Call plans immediately (does not require resellerId arg)

        if (auth?.resellerId) {
            console.log("Fetching Reseller Data for ID:", auth.resellerId);
            getClientes(auth.resellerId);
            getDashboard(auth.resellerId);
        } else {
            console.warn("No resellerId found in auth object");
        }
    }, [auth]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log("HANDLE SUBMIT TRIGGERED"); // Debug log

        if (!auth) {
            alert("Error: No autenticado");
            return;
        }

        // Check ResellerId fallback (e.g. if key is different)
        const resellerId = (auth as any).resellerId;
        console.log("Auth Object:", auth);
        console.log("Reseller ID:", resellerId);

        if (!resellerId) {
            alert("Error: No se encontró ID de Reseller en la sesión. Recarga la página.");
            return;
        }

        console.log("Submitting Client Create Payload:", formData);

        const result = await createCliente(resellerId, {
            ...formData,
            celular: formData.telefono // Mapping for backend
        });

        if (result.success) {
            setIsModalOpen(false);
            setFormData({
                rut: '',
                razonSocial: '',
                representa: '',
                email: '',
                telefono: '',
                password: '',
                planId: ''
            });
            getClientes(auth.resellerId!); // Refresh list
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Mis Clientes</h1>
                    <p className="text-gray-500">Gestiona las empresas bajo tu distribución</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition-all active:scale-95"
                >
                    <Icon icon="solar:add-circle-bold" width="20" />
                    Nuevo Cliente
                </button>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Filters / Search to be added here */}
                <div className="p-4 border-b border-gray-100 flex gap-4">
                    <div className="relative flex-1">
                        <Icon icon="solar:magnifer-linear" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="20" />
                        <input
                            type="text"
                            placeholder="Buscar cliente..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-100 text-sm"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase font-semibold">
                            <tr>
                                <th className="px-6 py-4">Empresa / RUC</th>
                                <th className="px-6 py-4">Plan (ID)</th>
                                <th className="px-6 py-4">Contacto</th>
                                <th className="px-6 py-4">Estado</th>
                                <th className="px-6 py-4 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {clientes.length === 0 ? (
                                <tr>
                                    <td className="px-6 py-12" colSpan={5}>
                                        <div className="flex flex-col items-center justify-center text-gray-400">
                                            <Icon icon="solar:users-group-rounded-linear" width="48" className="mb-2 opacity-50" />
                                            <p>No tienes clientes registrados aún</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                clientes.map((cliente: any) => (
                                    <tr key={cliente.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-gray-800">{cliente.razonSocial}</p>
                                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200 font-mono">
                                                {cliente.ruc}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {cliente.planId === 1 ? 'Plan Emprendedor (75)' :
                                                cliente.planId === 4 ? 'Plan Negocio (100)' :
                                                    `Plan ID: ${cliente.planId}`}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {/* Contacto info lookup if available */}
                                            -
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cliente.estado === 'ACTIVO' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${cliente.estado === 'ACTIVO' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                                                {cliente.estado}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => {
                                                    setSelectedClientId(cliente.id);
                                                    setIsDetailsOpen(true);
                                                }}
                                                title="Ver Detalles"
                                                className="text-gray-400 hover:text-indigo-600 p-1.5 hover:bg-indigo-50 rounded-lg transition-colors"
                                            >
                                                <Icon icon="solar:eye-bold" width="18" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Details Modal */}
            <ClienteDetalleModal
                resellerId={auth?.resellerId!}
                clienteId={selectedClientId}
                isOpen={isDetailsOpen}
                onClose={() => setIsDetailsOpen(false)}
            />

            {/* Create Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <div className="bg-white rounded-3xl p-8 w-full max-w-lg z-10 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">Nuevo Cliente</h2>
                                <p className="text-sm text-gray-500">Registra una nueva empresa (Esto descontará saldo)</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <Icon icon="solar:close-circle-bold" width="24" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">RUC</label>
                                    <input
                                        required
                                        name="rut"
                                        value={formData.rut}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-gray-400 font-medium font-mono"
                                        placeholder="20100100100"
                                        maxLength={11}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Teléfono</label>
                                    <input
                                        name="telefono"
                                        value={formData.telefono}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-gray-400 font-medium"
                                        placeholder="999 999 999"
                                    />
                                </div>
                                <div className="space-y-1.5 col-span-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Razón Social</label>
                                    <input
                                        required
                                        name="razonSocial"
                                        value={formData.razonSocial}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-gray-400 font-medium"
                                        placeholder="Empresa SAC"
                                    />
                                </div>
                                <div className="space-y-1.5 col-span-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Email (Admin)</label>
                                    <input
                                        required
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-gray-400 font-medium"
                                        placeholder="admin@empresa.com"
                                    />
                                </div>
                                <div className="space-y-1.5 col-span-2">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <div className="flex-1"></div>
                                        <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                                            Tu descuento: {stats.porcentajeDescuento || 0}%
                                        </span>
                                    </div>
                                    <Select
                                        label="Tipo de Plan"
                                        name="planId"
                                        value={planes.find((p: any) => String(p.id) === String(formData.planId)) ?
                                            (() => {
                                                const p = planes.find((p: any) => String(p.id) === String(formData.planId));
                                                const cost = Number(p.costo);
                                                const discount = Number(stats.porcentajeDescuento) || 0;
                                                const finalCost = cost * (1 - discount / 100);
                                                return `${p.nombre} - ${p.maxComprobantes} Comprobantes (Tu Precio: S/${finalCost.toFixed(2)})`;
                                            })()
                                            : ""}
                                        options={planes.map((plan: any) => {
                                            const cost = Number(plan.costo);
                                            const discount = Number(stats.porcentajeDescuento) || 0;
                                            const finalCost = cost * (1 - discount / 100);
                                            return {
                                                id: plan.id,
                                                value: `${plan.nombre} - ${plan.maxComprobantes} Comprobantes (Tu Precio: S/${finalCost.toFixed(2)})`
                                            };
                                        })}
                                        onChange={(id: any) => {
                                            console.log("Plan Selected ID:", id);
                                            setFormData(prev => ({ ...prev, planId: id }));
                                        }}
                                        error={null}
                                        readOnly={true} // Using as select, so input readonly
                                    />
                                    <p className="text-[10px] text-gray-400 mt-1">El costo final dependerá del precio base del plan menos tu descuento.</p>
                                </div>

                                <div className="space-y-1.5 col-span-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Contraseña Inicial</label>
                                    <input
                                        required
                                        type="text"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-gray-400 font-medium font-mono"
                                        placeholder="123456"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-3 text-gray-600 font-bold bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 text-white font-bold bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/30"
                                >
                                    Crear Cliente
                                </button>
                            </div>
                        </form>
                    </div>
                </div >
            )
            }
        </div >
    );
}
