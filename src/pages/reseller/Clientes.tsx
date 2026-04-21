import React, { useEffect, useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import { useAuthStore } from '@/zustand/auth';
import { useResellerPanelStore } from '@/zustand/reseller-panel';
import Select from '@/components/Select';
import ClienteDetalleModal from '@/components/reseller/ClienteDetalleModal';
import DataTable from '@/components/Datatable';

export default function ResellerClientes() {
    const { auth } = useAuthStore();
    const { clientes, getClientes, createCliente, stats, getDashboard, planes, getPlanes } = useResellerPanelStore(); // Added planes, getPlanes
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [selectedClientId, setSelectedClientId] = useState<number>(0);
    const [search, setSearch] = useState('');

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

    const formatCurrency = (value: number) => `S/ ${value.toFixed(2)}`;

    const clientsTable = useMemo(() => {
        const term = search.trim().toLowerCase();
        const filtered = !term
            ? clientes
            : clientes.filter((cliente: any) => {
                const razon = String(cliente.razonSocial || '').toLowerCase();
                const ruc = String(cliente.ruc || '').toLowerCase();
                return razon.includes(term) || ruc.includes(term);
            });

        return filtered.map((cliente: any) => ({
            id: cliente.id,
            empresa: cliente.razonSocial,
            ruc: cliente.ruc,
            plan: cliente?.plan?.nombre
                ? `${cliente.plan.nombre}${cliente?.plan?.maxComprobantes ? ` · ${cliente.plan.maxComprobantes} comprob.` : ''}`
                : `Plan ID: ${cliente.planId}`,
            costo: formatCurrency(Number(cliente.costoActivacionReseller ?? cliente.plan?.costo ?? 0)),
            estado: cliente.estado,
        }));
    }, [clientes, search]);

    const actions = [
        {
            icon: <Icon icon="solar:eye-bold" width="18" />,
            tooltip: 'Ver Detalles',
            onClick: (row: any) => {
                setSelectedClientId(row.id);
                setIsDetailsOpen(true);
            },
        },
    ];

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

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100">
                    <div className="flex items-center gap-2 mb-4">
                        <Icon icon="solar:filter-bold-duotone" className="text-blue-600 text-xl" />
                        <h3 className="font-semibold text-gray-800">Filtros</h3>
                    </div>
                    <div className="relative flex-1">
                        <Icon icon="solar:magnifer-linear" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="20" />
                        <input
                            type="text"
                            placeholder="Buscar cliente..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-100 text-sm"
                        />
                    </div>
                </div>
                <div className="p-4 relative z-0">
                    <div className="overflow-x-auto font-inter">
                        <DataTable
                            headerColumns={[
                                { label: 'ID', key: 'id' },
                                { label: 'Empresa', key: 'empresa' },
                                { label: 'RUC', key: 'ruc' },
                                { label: 'Plan', key: 'plan' },
                                { label: 'Costo Reseller', key: 'costo' },
                                { label: 'Estado', key: 'estado' },
                            ]}
                            bodyData={clientsTable}
                            actions={actions}
                        />
                    </div>
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
                <div className="fixed inset-0 top-[-30px] z-[60] flex items-center justify-center">
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
