import React, { useEffect, useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import { useAuthStore } from '@/zustand/auth';
import { useResellerPanelStore } from '@/zustand/reseller-panel';
import Select from '@/components/Select';
import ClienteDetalleModal from '@/components/reseller/ClienteDetalleModal';
import DataTable from '@/components/Datatable';
import Modal from '@/components/Modal';
import InputPro from '@/components/InputPro';
import Button from '@/components/Button';
import { BRAND } from '@/lib/branding';

const FALCONEXT_VOLUME_PRICING: Record<string, [number, number, number, number]> = {
    'Emprendedor': [14.90, 13.90, 12.90, 11.90],
    'Negocio':     [34.90, 32.90, 29.90, 27.90],
    'Corporativo': [59.90, 56.90, 52.90, 49.90],
};

function getVolumeTierCost(planNombre: string, clientesActivos: number): number | null {
    const prices = FALCONEXT_VOLUME_PRICING[planNombre];
    if (!prices) return null;
    if (clientesActivos <= 5)  return prices[0];
    if (clientesActivos <= 15) return prices[1];
    if (clientesActivos <= 30) return prices[2];
    return prices[3];
}

function getTierLabel(clientesActivos: number): string {
    if (clientesActivos <= 5)  return '1-5 clientes';
    if (clientesActivos <= 15) return '6-15 clientes';
    if (clientesActivos <= 30) return '16-30 clientes';
    return '31+ clientes';
}

const isFalconext = BRAND.key === 'falconext';

export default function ResellerClientes() {
    const { auth } = useAuthStore();
    const { clientes, getClientes, createCliente, stats, getDashboard, planes, getPlanes } = useResellerPanelStore(); // Added planes, getPlanes
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [selectedClientId, setSelectedClientId] = useState<number>(0);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState<'empresa' | 'facturacion'>('empresa');

    useEffect(() => {
        if (isModalOpen) setActiveTab('empresa');
    }, [isModalOpen]);

    // Form State
    const [formData, setFormData] = useState({
        rut: '',
        razonSocial: '',
        representa: '',
        email: '',
        telefono: '',
        password: '',
        planId: '',
        billingProvider: 'QPSE',
        providerId: '',
        providerToken: '',
        usuarioPse: '',
        contrasenaPse: '',
        billingApiBaseUrl: '',
        billingApiToken: '',
        billingApiUser: '',
        billingApiPassword: '',
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
                planId: '',
                billingProvider: 'QPSE',
                providerId: '',
                providerToken: '',
                usuarioPse: '',
                contrasenaPse: '',
                billingApiBaseUrl: '',
                billingApiToken: '',
                billingApiUser: '',
                billingApiPassword: '',
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
            <Modal
                isOpenModal={isModalOpen}
                closeModal={() => setIsModalOpen(false)}
                title="Nuevo Cliente"
                icon="solar:buildings-bold-duotone"
                iconClass="bg-indigo-50 text-indigo-600"
                width="580px"
                height="auto"
            >
                <form onSubmit={handleSubmit}>
                    <div className="flex border-b border-gray-100">
                        <button
                            type="button"
                            onClick={() => setActiveTab('empresa')}
                            className={`flex items-center gap-1.5 px-5 py-3 text-xs font-semibold uppercase tracking-wide border-b-2 transition-colors ${activeTab === 'empresa' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                        >
                            <Icon icon="solar:buildings-bold" width="14" />Empresa
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('facturacion')}
                            className={`flex items-center gap-1.5 px-5 py-3 text-xs font-semibold uppercase tracking-wide border-b-2 transition-colors ${activeTab === 'facturacion' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                        >
                            <Icon icon="solar:bill-bold" width="14" />Facturación
                        </button>
                    </div>

                    <div className="p-5">
                        {activeTab === 'empresa' && (
                            <div className="grid grid-cols-2 gap-3">
                                <InputPro isLabel label="RUC" name="rut" value={formData.rut} onChange={handleChange as any} placeholder="20100100100" maxLength={11} />
                                <InputPro isLabel label="Teléfono" name="telefono" value={formData.telefono} onChange={handleChange as any} placeholder="999 999 999" />
                                <div className="col-span-2">
                                    <InputPro isLabel label="Razón Social" name="razonSocial" value={formData.razonSocial} onChange={handleChange as any} placeholder="Empresa SAC" />
                                </div>
                                <div className="col-span-2">
                                    <InputPro isLabel label="Email (Admin)" name="email" type="email" value={formData.email} onChange={handleChange as any} placeholder="admin@empresa.com" />
                                </div>
                                <div className="col-span-2">
                                    <div className="flex justify-end mb-1.5">
                                        {isFalconext ? (
                                            <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                                                Nivel: {getTierLabel((stats.clientesActivos || 0) + 1)} con este cliente
                                            </span>
                                        ) : (
                                            <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                                                Tu descuento: {stats.porcentajeDescuento || 0}%
                                            </span>
                                        )}
                                    </div>
                                    <Select
                                        label="Tipo de Plan"
                                        name="planId"
                                        value={planes.find((p: any) => String(p.id) === String(formData.planId)) ?
                                            (() => {
                                                const p = planes.find((p: any) => String(p.id) === String(formData.planId));
                                                const clientesConNuevo = (stats.clientesActivos || 0) + 1;
                                                const finalCost = isFalconext
                                                    ? (getVolumeTierCost(p.nombre, clientesConNuevo) ?? Number(p.costo))
                                                    : Number(p.costo) * (1 - (Number(stats.porcentajeDescuento) || 0) / 100);
                                                return `${p.nombre} (S/${finalCost.toFixed(2)})`;
                                            })()
                                            : ""}
                                        options={planes.map((plan: any) => {
                                            const clientesConNuevo = (stats.clientesActivos || 0) + 1;
                                            const finalCost = isFalconext
                                                ? (getVolumeTierCost(plan.nombre, clientesConNuevo) ?? Number(plan.costo))
                                                : Number(plan.costo) * (1 - (Number(stats.porcentajeDescuento) || 0) / 100);
                                            return { id: plan.id, value: `${plan.nombre} (S/${finalCost.toFixed(2)})` };
                                        })}
                                        onChange={(id: any) => setFormData(prev => ({ ...prev, planId: id }))}
                                        error={null}
                                        readOnly={true}
                                    />
                                    <p className="text-[10px] text-gray-400 mt-1">
                                        {isFalconext
                                            ? 'El costo depende de tu volumen total de clientes activos.'
                                            : 'El costo final depende del precio base del plan menos tu descuento.'}
                                    </p>
                                </div>
                                <div className="col-span-2">
                                    <InputPro isLabel label="Contraseña Inicial" name="password" value={formData.password} onChange={handleChange as any} placeholder="123456" />
                                </div>
                            </div>
                        )}

                        {activeTab === 'facturacion' && (
                            <div className="grid grid-cols-2 gap-3">
                                <div className="col-span-2">
                                    <Select
                                        label="Proveedor de Facturación"
                                        name="billingProvider"
                                        value={formData.billingProvider === 'JAMBLE' ? 'JAMBLE (API propia)' : formData.billingProvider}
                                        options={[
                                            { id: 'QPSE', value: 'QPSE' },
                                            { id: 'APISUNAT', value: 'APISUNAT' },
                                            { id: 'JAMBLE', value: 'JAMBLE (API propia)' },
                                        ]}
                                        onChange={(id: any) => setFormData(prev => ({ ...prev, billingProvider: id }))}
                                        error={null}
                                        readOnly={true}
                                    />
                                </div>

                                {formData.billingProvider === 'QPSE' && (
                                    <>
                                        <InputPro isLabel label="Usuario QPSE" name="usuarioPse" value={formData.usuarioPse} onChange={handleChange as any} placeholder="usuario_qpse" />
                                        <InputPro isLabel label="Clave QPSE" name="contrasenaPse" type="password" value={formData.contrasenaPse} onChange={handleChange as any} placeholder="••••••••" />
                                    </>
                                )}

                                {formData.billingProvider === 'APISUNAT' && (
                                    <>
                                        <InputPro isLabel label="Persona ID" name="providerId" value={formData.providerId} onChange={handleChange as any} placeholder="personaId" />
                                        <InputPro isLabel label="Persona Token" name="providerToken" value={formData.providerToken} onChange={handleChange as any} placeholder="token" />
                                    </>
                                )}

                                {formData.billingProvider === 'JAMBLE' && (
                                    <>
                                        <div className="col-span-2">
                                            <InputPro isLabel label="Base URL API" name="billingApiBaseUrl" value={formData.billingApiBaseUrl} onChange={handleChange as any} placeholder="https://api.tu-proveedor.com" />
                                        </div>
                                        <div className="col-span-2">
                                            <InputPro isLabel label="Token API" name="billingApiToken" value={formData.billingApiToken} onChange={handleChange as any} placeholder="token (opcional si usas usuario/clave)" />
                                        </div>
                                        <InputPro isLabel label="Usuario API" name="billingApiUser" value={formData.billingApiUser} onChange={handleChange as any} placeholder="usuario_api" />
                                        <InputPro isLabel label="Clave API" name="billingApiPassword" type="password" value={formData.billingApiPassword} onChange={handleChange as any} placeholder="••••••••" />
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3 px-5 pb-5">
                        <Button type="button" onClick={() => setIsModalOpen(false)} color="default" className="flex-1">Cancelar</Button>
                        <Button type="submit" color="primary" className="flex-1">Crear Cliente</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
