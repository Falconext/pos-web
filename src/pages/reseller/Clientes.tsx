import React, { useEffect, useMemo, useRef, useState } from 'react';
import apiClient from '@/utils/apiClient';
import { Icon } from '@iconify/react';
import { useAuthStore } from '@/zustand/auth';
import { useResellerPanelStore } from '@/zustand/reseller-panel';
import Select from '@/components/Select';
import ClienteDetalleModal from '@/components/reseller/ClienteDetalleModal';
import DataTable from '@/components/Datatable';
import type { IAction } from '@/components/Datatable/types';
import Modal from '@/components/Modal';
import InputPro from '@/components/InputPro';
import Button from '@/components/Button';
import { BRAND } from '@/lib/branding';
import { useExtentionsStore } from '@/zustand/extentions';

const FALCONEXT_VOLUME_PRICING: Record<string, [number, number, number, number]> = {
    'Emprendedor': [14.90, 13.90, 12.90, 11.90],
    'Negocio':     [34.90, 32.90, 29.90, 27.90],
    'Corporativo': [59.90, 56.90, 52.90, 49.90],
};

// Precio anual reseller = mensual × 10 (2 meses gratis)
const FALCONEXT_ANNUAL_PRICING: Record<string, number> = {
    'Emprendedor': 149.00,
    'Negocio':     349.00,
    'Corporativo': 599.00,
};

function getVolumeTierCost(planNombre: string, clientesActivos: number): number | null {
    const key = Object.keys(FALCONEXT_VOLUME_PRICING).find(
        k => k.toLowerCase() === planNombre.toLowerCase().trim()
    );
    const prices = key ? FALCONEXT_VOLUME_PRICING[key] : undefined;
    if (!prices) return null;
    if (clientesActivos <= 5)  return prices[0];
    if (clientesActivos <= 15) return prices[1];
    if (clientesActivos <= 30) return prices[2];
    return prices[3];
}

function getAnnualCost(planNombre: string): number | null {
    const key = Object.keys(FALCONEXT_ANNUAL_PRICING).find(
        k => k.toLowerCase() === planNombre.toLowerCase().trim()
    );
    return key ? FALCONEXT_ANNUAL_PRICING[key] : null;
}

function getTierLabel(clientesActivos: number): string {
    if (clientesActivos <= 5)  return '1-5 clientes';
    if (clientesActivos <= 15) return '6-15 clientes';
    if (clientesActivos <= 30) return '16-30 clientes';
    return '31+ clientes';
}

const isFalconext = BRAND.key === 'falconext';

const DEFAULT_SERIES = [
    { tipoDoc: '01', nombre: 'Factura', serie: 'F001', correlativo: 1, activo: true },
    { tipoDoc: '03', nombre: 'Boleta', serie: 'B001', correlativo: 1, activo: true },
    { tipoDoc: '07', nombre: 'Nota crédito', serie: 'FC01', correlativo: 1, activo: true },
    { tipoDoc: '08', nombre: 'Nota débito', serie: 'FD01', correlativo: 1, activo: true },
    { tipoDoc: 'NV', nombre: 'Nota venta', serie: 'NV01', correlativo: 1, activo: true },
];

const initialFormData = {
    rut: '',
    razonSocial: '',
    nombreComercial: '',
    direccion: '',
    logo: '',
    departamento: '',
    provincia: '',
    distrito: '',
    ubigeo: '',
    rubroId: '',
    representa: '',
    email: '',
    telefono: '',
    password: '',
    planId: '',
    usaCodigoBarrasManual: false,
    usaDemo: true,
    billingProvider: 'QPSE',
    providerId: '',
    providerToken: '',
    usuarioPse: '',
    contrasenaPse: '',
    billingApiBaseUrl: '',
    billingApiDemoBaseUrl: '',
    billingApiToken: '',
    billingApiUser: '',
    billingApiPassword: '',
};

export default function ResellerClientes() {
    const { auth } = useAuthStore();
    const { clientes, getClientes, createCliente, updateCliente, deleteDemoCliente, stats, getDashboard, planes, getPlanes, consultarDocumento, getClienteSeries, updateClienteSeries } = useResellerPanelStore();
    const { rubros, ubigeos, getRubros, getUbigeos } = useExtentionsStore();
    // Solo planes de facturación (excluir hotel)
    const planesFacturacion = useMemo(
        () => planes.filter((p: any) => String(p.producto ?? 'facturacion').toLowerCase() !== 'hotel'),
        [planes]
    );
    const logoFileRef = useRef<HTMLInputElement>(null);
    const [logoUploading, setLogoUploading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [selectedClientId, setSelectedClientId] = useState<number>(0);
    const [editingCliente, setEditingCliente] = useState<any>(null);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState<'empresa' | 'facturacion' | 'series'>('empresa');
    const [searchingDoc, setSearchingDoc] = useState(false);
    const [seriesData, setSeriesData] = useState(DEFAULT_SERIES);

    useEffect(() => {
        if (isModalOpen) setActiveTab('empresa');
    }, [isModalOpen]);

    // Form State
    const [formData, setFormData] = useState(initialFormData);

    useEffect(() => {
        console.log("ResellerClientes mounted. Auth:", auth);
        getPlanes(); // Call plans immediately (does not require resellerId arg)
        getRubros();
        getUbigeos();

        if (auth?.resellerId) {
            console.log("Fetching Reseller Data for ID:", auth.resellerId);
            getClientes(auth.resellerId);
            getDashboard(auth.resellerId);
        } else {
            console.warn("No resellerId found in auth object");
        }
    }, [auth]);

    const [editData, setEditData] = useState({
        planId: '',
        razonSocial: '',
        nombreComercial: '',
        direccion: '',
        logo: '',
        departamento: '',
        provincia: '',
        distrito: '',
        ubigeo: '',
        rubroId: '',
        telefono: '',
        adminEmail: '',
        adminPassword: '',
        usaCodigoBarrasManual: false,
        usaDemo: true,
    });

    const openEditModal = async (cliente: any) => {
        const raw = clientes.find((c: any) => c.id === cliente.id);
        setEditingCliente(raw);
        setEditData({
            planId: String(raw?.planId || ''),
            razonSocial: raw?.razonSocial || '',
            nombreComercial: raw?.nombreComercial || '',
            direccion: raw?.direccion || '',
            logo: raw?.logo || '',
            departamento: raw?.departamento || '',
            provincia: raw?.provincia || '',
            distrito: raw?.distrito || '',
            ubigeo: raw?.ubigeo || raw?.empresaUbigeo || '',
            rubroId: String(raw?.rubroId || raw?.rubro?.id || ''),
            telefono: raw?.telefono || '',
            adminEmail: raw?.usuarios?.[0]?.email || '',
            adminPassword: '',
            usaCodigoBarrasManual: Boolean(raw?.usaCodigoBarrasManual),
            usaDemo: Boolean(raw?.usaDemo),
        });
        if (auth?.resellerId) {
            const currentSeries = await getClienteSeries(auth.resellerId, raw.id);
            setSeriesData(DEFAULT_SERIES.map((base) => {
                const found = currentSeries.find((s: any) => s.tipoDoc === base.tipoDoc);
                return found ? { ...base, serie: found.serie, correlativo: found.correlativo ?? base.correlativo, activo: found.activo ?? base.activo } : base;
            }));
        }
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth || !editingCliente) return;
        const payload: any = {
            razonSocial: editData.razonSocial,
            nombreComercial: editData.nombreComercial,
            direccion: editData.direccion,
            logo: editData.logo?.startsWith('data:') ? undefined : editData.logo,
            departamento: editData.departamento,
            provincia: editData.provincia,
            distrito: editData.distrito,
            ubigeo: editData.ubigeo,
            rubroId: editData.rubroId ? Number(editData.rubroId) : null,
            usaCodigoBarrasManual: editData.usaCodigoBarrasManual,
            usaDemo: editData.usaDemo,
            telefono: editData.telefono,
            adminEmail: editData.adminEmail,
        };
        if (editData.planId) payload.planId = Number(editData.planId);
        if (editData.adminPassword) payload.adminPassword = editData.adminPassword;
        const result = await updateCliente(auth.resellerId!, editingCliente.id, payload);
        if (result.success) {
            await updateClienteSeries(auth.resellerId!, editingCliente.id, seriesData);
            setIsEditModalOpen(false);
            getClientes(auth.resellerId!);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleLogoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !auth?.resellerId) return;
        setLogoUploading(true);
        try {
            const fd = new FormData();
            fd.append('file', file);
            const resp: any = await apiClient.post(`/resellers/${auth.resellerId}/upload-logo`, fd);
            const url = resp.data?.data?.url ?? resp.data?.url ?? '';
            if (url) setFormData(prev => ({ ...prev, logo: url }));
        } catch {
            // silent
        } finally {
            setLogoUploading(false);
        }
    };

    const handleSearchDocument = async () => {
        if (!auth?.resellerId || formData.rut.replace(/\D/g, '').length !== 11) {
            alert('Ingresa un RUC válido de 11 dígitos.');
            return;
        }
        setSearchingDoc(true);
        try {
            const data = await consultarDocumento(auth.resellerId, 'RUC', formData.rut);
            setFormData(prev => ({
                ...prev,
                razonSocial: data?.nombre_o_razon_social || data?.razonSocial || data?.nombre || prev.razonSocial,
                nombreComercial: data?.nombre_comercial || data?.nombre_o_razon_social || prev.nombreComercial,
                direccion: data?.direccion || prev.direccion,
                departamento: data?.departamento || prev.departamento,
                provincia: data?.provincia || prev.provincia,
                distrito: data?.distrito || prev.distrito,
                ubigeo: data?.ubigeo || prev.ubigeo,
            }));
        } catch (error: any) {
            alert(error.message || 'No se pudo consultar el RUC.');
        } finally {
            setSearchingDoc(false);
        }
    };

    const rubrosOptions = Array.isArray(rubros) ? rubros as any[] : [];
    const ubigeosOptions = (Array.isArray(ubigeos) ? ubigeos as any[] : []).map((u: any) => ({
        id: u.codigo,
        value: `${u.departamento} - ${u.provincia} - ${u.distrito}`,
    }));

    const formatUbigeoValue = (data: { departamento?: string; provincia?: string; distrito?: string; ubigeo?: string }) => {
        if (data.departamento && data.provincia && data.distrito) return `${data.departamento} - ${data.provincia} - ${data.distrito}`;
        const selected = (ubigeos as any[])?.find?.((u: any) => u.codigo === data.ubigeo);
        return selected ? `${selected.departamento} - ${selected.provincia} - ${selected.distrito}` : '';
    };

    const normalizeUbigeo = (value: unknown) => {
        if (Array.isArray(value)) { const f = value.filter(Boolean); return String(f[f.length - 1] || ''); }
        return String(value || '');
    };

    const applyUbigeoToForm = (id: any, target: 'create' | 'edit') => {
        const ubigeoCode = normalizeUbigeo(id);
        const selected = (ubigeos as any[])?.find?.((u: any) => u.codigo === ubigeoCode);
        if (!selected) return;
        const next = {
            ubigeo: selected.codigo,
            departamento: selected.departamento,
            provincia: selected.provincia,
            distrito: selected.distrito,
        };
        if (target === 'edit') setEditData(prev => ({ ...prev, ...next }));
        else setFormData(prev => ({ ...prev, ...next }));
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
            ubigeo: normalizeUbigeo(formData.ubigeo),
            rubroId: formData.rubroId ? Number(formData.rubroId) : null,
            series: seriesData,
            celular: formData.telefono // Mapping for backend
        });

        if (result.success) {
            setIsModalOpen(false);
            setFormData(initialFormData);
            setSeriesData(DEFAULT_SERIES);
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
            usaDemo: Boolean(cliente.usaDemo),
        }));
    }, [clientes, search]);

    const actions: IAction[] = [
        {
            icon: <Icon icon="solar:eye-bold" width="18" />,
            tooltip: 'Ver Detalles',
            onClick: (row: any) => {
                setSelectedClientId(row.id);
                setIsDetailsOpen(true);
            },
        },
        {
            icon: <Icon icon="solar:pen-bold" width="18" />,
            tooltip: 'Editar',
            onClick: (row: any) => openEditModal(row),
        },
        {
            icon: <Icon icon="solar:trash-bin-trash-bold" width="18" />,
            tooltip: 'Eliminar demo',
            color: 'rose',
            condition: (row: any) => row.usaDemo === true,
            onClick: async (row: any) => {
                const ok = window.confirm('Este cliente demo se ocultará del panel y sus usuarios quedarán inactivos. ¿Continuar?');
                if (!ok || !auth?.resellerId) return;
                await deleteDemoCliente(auth.resellerId, row.id);
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

            {/* Edit Modal */}
            <Modal
                isOpenModal={isEditModalOpen}
                closeModal={() => setIsEditModalOpen(false)}
                title="Editar Cliente"
                icon="solar:pen-bold-duotone"
                iconClass="bg-amber-50 text-amber-600"
                width="500px"
                height="auto"
            >
                <form onSubmit={handleEditSubmit}>
                    <div className="p-5 grid grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto">
                        <div className="col-span-2">
                            <InputPro isLabel label="Razón Social" name="razonSocial" value={editData.razonSocial} onChange={(e: any) => setEditData(prev => ({ ...prev, razonSocial: e.target.value }))} placeholder="Empresa SAC" />
                        </div>
                        <div className="col-span-2">
                            <InputPro isLabel label="Nombre Comercial" name="nombreComercial" value={editData.nombreComercial} onChange={(e: any) => setEditData(prev => ({ ...prev, nombreComercial: e.target.value }))} placeholder="Marca comercial" />
                        </div>
                        <div className="col-span-2">
                            <InputPro isLabel label="Dirección fiscal" name="direccion" value={editData.direccion} onChange={(e: any) => setEditData(prev => ({ ...prev, direccion: e.target.value }))} placeholder="Dirección completa" />
                        </div>
                        <div className="col-span-2">
                            <Select
                                label="Ubicación"
                                name="ubigeo"
                                value={formatUbigeoValue(editData)}
                                options={ubigeosOptions}
                                onChange={(id: any) => applyUbigeoToForm(id, 'edit')}
                                error={null}
                                isSearch
                                withLabel
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Logo</label>
                            <div className="flex items-center gap-2">
                                <div
                                    className="relative w-14 h-14 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 hover:border-indigo-300 hover:bg-indigo-50 flex items-center justify-center overflow-hidden flex-shrink-0 transition-colors cursor-pointer"
                                    onClick={() => {
                                        const inp = document.createElement('input');
                                        inp.type = 'file';
                                        inp.accept = 'image/*';
                                        inp.onchange = async (ev: any) => {
                                            const file = ev.target.files?.[0];
                                            if (!file || !editingCliente?.resellerId) return;
                                            try {
                                                const fd = new FormData();
                                                fd.append('file', file);
                                                const resp: any = await apiClient.post(`/resellers/${auth?.resellerId}/upload-logo`, fd);
                                                const url = resp.data?.data?.url ?? resp.data?.url ?? '';
                                                if (url) setEditData(prev => ({ ...prev, logo: url }));
                                            } catch { /* silent */ }
                                        };
                                        inp.click();
                                    }}
                                    title="Haz clic para subir logo"
                                >
                                    {editData.logo
                                        ? <img src={editData.logo} alt="Logo" className="w-full h-full object-contain p-0.5" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                        : <div className="flex flex-col items-center gap-0.5">
                                            <Icon icon="solar:upload-minimalistic-bold-duotone" className="text-lg text-gray-300" />
                                            <span className="text-[9px] text-gray-300 font-medium">Logo</span>
                                        </div>
                                    }
                                </div>
                                <input name="logo" value={editData.logo} onChange={(e: any) => setEditData(prev => ({ ...prev, logo: e.target.value }))} placeholder="o pega URL aquí..." className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400" />
                            </div>
                        </div>
                        <div className="col-span-2">
                            <Select
                                label="Rubro"
                                name="rubroId"
                                value={(rubros as any[]).find((r: any) => String(r.id) === String(editData.rubroId))?.value || ''}
                                options={rubrosOptions}
                                onChange={(id: any) => setEditData(prev => ({ ...prev, rubroId: String(id) }))}
                                error={null}
                                readOnly={true}
                            />
                        </div>
                        <InputPro isLabel label="Teléfono" name="telefono" value={editData.telefono} onChange={(e: any) => setEditData(prev => ({ ...prev, telefono: e.target.value }))} placeholder="999 999 999" />
                        <InputPro isLabel label="Email Admin" name="adminEmail" type="email" value={editData.adminEmail} onChange={(e: any) => setEditData(prev => ({ ...prev, adminEmail: e.target.value }))} placeholder="admin@empresa.com" />
                        <div className="col-span-2">
                            <InputPro isLabel label="Nueva Contraseña (opcional)" name="adminPassword" type="password" value={editData.adminPassword} onChange={(e: any) => setEditData(prev => ({ ...prev, adminPassword: e.target.value }))} placeholder="Dejar vacío para no cambiar" />
                        </div>
                        <div className="col-span-2">
                            <Select
                                label="Plan"
                                name="planId"
                                value={(() => {
                                    const p = planesFacturacion.find((x: any) => String(x.id) === String(editData.planId));
                                    if (!p) return '';
                                    const finalCost = isFalconext
                                        ? (getVolumeTierCost(p.nombre, stats.clientesActivos || 0) ?? Number(p.costo))
                                        : Number(p.costo) * (1 - (Number(stats.porcentajeDescuento) || 0) / 100);
                                    return `${p.nombre} (S/${finalCost.toFixed(2)})`;
                                })()}
                                options={planesFacturacion.map((plan: any) => {
                                    const finalCost = isFalconext
                                        ? (getVolumeTierCost(plan.nombre, stats.clientesActivos || 0) ?? Number(plan.costo))
                                        : Number(plan.costo) * (1 - (Number(stats.porcentajeDescuento) || 0) / 100);
                                    return { id: plan.id, value: `${plan.nombre} (S/${finalCost.toFixed(2)})` };
                                })}
                                onChange={(id: any) => setEditData(prev => ({ ...prev, planId: String(id) }))}
                                error={null}
                                readOnly={true}
                            />
                        </div>
                        {editingCliente && (
                            <div className="col-span-2 bg-gray-50 rounded-xl p-3 text-xs text-gray-500 space-y-0.5">
                                <p><span className="font-semibold">RUC:</span> {editingCliente.ruc}</p>
                                <p><span className="font-semibold">Plan actual:</span> {editingCliente.plan?.nombre}</p>
                                <p><span className="font-semibold">Estado:</span> {editingCliente.estado}</p>
                            </div>
                        )}
                        <label className="col-span-2 flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm">
                            <span>
                                <strong className="block text-gray-800">Producción SUNAT</strong>
                                <span className="text-xs text-gray-500">Apagado = Demo, encendido = Producción</span>
                            </span>
                            <input type="checkbox" checked={!editData.usaDemo} onChange={(e) => setEditData(prev => ({ ...prev, usaDemo: !e.target.checked }))} className="h-5 w-5 accent-indigo-600" />
                        </label>
                        <label className="col-span-2 flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm">
                            <span>
                                <strong className="block text-gray-800">Código de barras</strong>
                                <span className="text-xs text-gray-500">Muestra el campo código de barras en productos.</span>
                            </span>
                            <input type="checkbox" checked={editData.usaCodigoBarrasManual} onChange={(e) => setEditData(prev => ({ ...prev, usaCodigoBarrasManual: e.target.checked }))} className="h-5 w-5 accent-indigo-600" />
                        </label>
                        <div className="col-span-2 rounded-xl border border-gray-100 p-3">
                            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">Series</p>
                            <div className="space-y-2">
                                {seriesData.map((item, index) => (
                                    <div key={item.tipoDoc} className="grid grid-cols-[1fr_90px_90px_24px] items-center gap-2">
                                        <span className="text-xs font-semibold text-gray-600">{item.nombre}</span>
                                        <input className="rounded-lg border border-gray-200 px-2 py-1 text-xs uppercase" value={item.serie} onChange={(e) => setSeriesData(prev => prev.map((s, i) => i === index ? { ...s, serie: e.target.value.toUpperCase() } : s))} />
                                        <input className="rounded-lg border border-gray-200 px-2 py-1 text-xs" type="number" min={1} value={item.correlativo} onChange={(e) => setSeriesData(prev => prev.map((s, i) => i === index ? { ...s, correlativo: Number(e.target.value || 1) } : s))} />
                                        <input type="checkbox" checked={item.activo} onChange={(e) => setSeriesData(prev => prev.map((s, i) => i === index ? { ...s, activo: e.target.checked } : s))} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3 px-5 pb-5">
                        <Button type="button" onClick={() => setIsEditModalOpen(false)} color="default" className="flex-1">Cancelar</Button>
                        <Button type="submit" color="primary" className="flex-1">Guardar Cambios</Button>
                    </div>
                </form>
            </Modal>

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
                        <button
                            type="button"
                            onClick={() => setActiveTab('series')}
                            className={`flex items-center gap-1.5 px-5 py-3 text-xs font-semibold uppercase tracking-wide border-b-2 transition-colors ${activeTab === 'series' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                        >
                            <Icon icon="solar:hashtag-square-bold" width="14" />Series
                        </button>
                    </div>

                    <div className="p-5 max-h-[72vh] overflow-y-auto">
                        {activeTab === 'empresa' && (
                            <div className="space-y-4">
                                {/* ── Fila 1: RUC + búsqueda + Logo preview ── */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="grid grid-cols-[1fr_auto] gap-2">
                                        <InputPro isLabel label="RUC" name="rut" value={formData.rut} onChange={handleChange as any} placeholder="20100100100" maxLength={11} />
                                        <button type="button" onClick={handleSearchDocument} disabled={searchingDoc} className="mt-6 rounded-xl bg-indigo-50 px-4 text-sm font-bold text-indigo-600 hover:bg-indigo-100 disabled:opacity-60">
                                            {searchingDoc ? '...' : 'Buscar'}
                                        </button>
                                    </div>
                                    {/* Logo upload */}
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Logo</label>
                                        <input ref={logoFileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoFile} />
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => logoFileRef.current?.click()}
                                                disabled={logoUploading}
                                                className="relative w-14 h-14 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 hover:border-indigo-300 hover:bg-indigo-50 flex items-center justify-center overflow-hidden flex-shrink-0 transition-colors"
                                                title="Haz clic para subir logo"
                                            >
                                                {logoUploading ? (
                                                    <Icon icon="svg-spinners:ring-resize" className="text-indigo-500 text-xl" />
                                                ) : formData.logo ? (
                                                    <img src={formData.logo} alt="Logo" className="w-full h-full object-contain p-0.5" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                                ) : (
                                                    <div className="flex flex-col items-center gap-0.5">
                                                        <Icon icon="solar:upload-minimalistic-bold-duotone" className="text-lg text-gray-300" />
                                                        <span className="text-[9px] text-gray-300 font-medium">Logo</span>
                                                    </div>
                                                )}
                                            </button>
                                            <input name="logo" value={formData.logo} onChange={handleChange as any} placeholder="o pega URL aquí..." className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400" />
                                        </div>
                                    </div>
                                </div>

                                {/* ── Fila 2: Razón Social + Nombre Comercial ── */}
                                <div className="grid grid-cols-2 gap-3">
                                    <InputPro isLabel label="Razón Social" name="razonSocial" value={formData.razonSocial} onChange={handleChange as any} placeholder="Empresa SAC" />
                                    <InputPro isLabel label="Nombre Comercial" name="nombreComercial" value={formData.nombreComercial} onChange={handleChange as any} placeholder="Nombre visible" />
                                </div>

                                {/* ── Fila 3: Teléfono + Representante ── */}
                                <div className="grid grid-cols-2 gap-3">
                                    <InputPro isLabel label="Teléfono" name="telefono" value={formData.telefono} onChange={handleChange as any} placeholder="999 999 999" />
                                    <InputPro isLabel label="Representante" name="representa" value={formData.representa} onChange={handleChange as any} placeholder="Nombre del contacto" />
                                </div>

                                {/* ── Fila 4: Dirección + Ubicación ── */}
                                <div className="grid grid-cols-2 gap-3">
                                    <InputPro isLabel label="Dirección fiscal" name="direccion" value={formData.direccion} onChange={handleChange as any} placeholder="Dirección completa" />
                                    <Select label="Ubicación" name="ubigeo" value={formatUbigeoValue(formData)} options={ubigeosOptions} onChange={(id: any) => applyUbigeoToForm(id, 'create')} error={null} isSearch withLabel />
                                </div>

                                {/* ── Fila 5: Rubro + Email ── */}
                                <div className="grid grid-cols-2 gap-3">
                                    <Select label="Rubro" name="rubroId" value={(rubros as any[]).find((r: any) => String(r.id) === String(formData.rubroId))?.value || ''} options={rubrosOptions} onChange={(id: any) => setFormData(prev => ({ ...prev, rubroId: String(id) }))} error={null} readOnly={true} />
                                    <InputPro isLabel label="Email (Admin)" name="email" type="email" value={formData.email} onChange={handleChange as any} placeholder="admin@empresa.com" />
                                </div>

                                {/* ── Fila 6: Contraseña + toggles ── */}
                                <div className="grid grid-cols-2 gap-3">
                                    <InputPro isLabel label="Contraseña Inicial" name="password" value={formData.password} onChange={handleChange as any} placeholder="123456" />
                                    <div className="flex flex-col gap-2 pt-5">
                                        <label className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-xs cursor-pointer">
                                            <span><strong className="block text-gray-700 text-xs">Producción SUNAT</strong><span className="text-gray-400">Apagado = Demo</span></span>
                                            <input type="checkbox" checked={!formData.usaDemo} onChange={(e) => setFormData(prev => ({ ...prev, usaDemo: !e.target.checked }))} className="h-4 w-4 accent-indigo-600" />
                                        </label>
                                        <label className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-xs cursor-pointer">
                                            <span><strong className="block text-gray-700 text-xs">Código de barras</strong><span className="text-gray-400">Activa el campo</span></span>
                                            <input name="usaCodigoBarrasManual" type="checkbox" checked={formData.usaCodigoBarrasManual} onChange={handleChange as any} className="h-4 w-4 accent-indigo-600" />
                                        </label>
                                    </div>
                                </div>

                                {/* ── Selector de plan ── */}
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="text-xs font-semibold text-gray-600">Tipo de Plan</label>
                                        {isFalconext ? (
                                            <span className="text-[10px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                                                Nivel: {getTierLabel((stats.clientesActivos || 0) + 1)} con este cliente
                                            </span>
                                        ) : (
                                            <span className="text-[10px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                                                Tu descuento: {stats.porcentajeDescuento || 0}%
                                            </span>
                                        )}
                                    </div>
                                    <Select
                                        label=""
                                        name="planId"
                                        value={planesFacturacion.find((p: any) => String(p.id) === String(formData.planId))?.nombre || ''}
                                        options={planesFacturacion.map((plan: any) => ({ id: plan.id, value: plan.nombre }))}
                                        onChange={(id: any) => setFormData(prev => ({ ...prev, planId: id }))}
                                        error={null}
                                        readOnly={true}
                                    />
                                    {/* Pill de costo reseller al seleccionar */}
                                    {(() => {
                                        const p = planesFacturacion.find((x: any) => String(x.id) === String(formData.planId));
                                        if (!p) return null;
                                        const clientesConNuevo = (stats.clientesActivos || 0) + 1;
                                        const costoMensual = isFalconext
                                            ? (getVolumeTierCost(p.nombre, clientesConNuevo) ?? Number(p.costo) * (1 - (Number(stats.porcentajeDescuento) || 0) / 100))
                                            : Number(p.costo) * (1 - (Number(stats.porcentajeDescuento) || 0) / 100);
                                        const costoAnual = isFalconext
                                            ? (getAnnualCost(p.nombre) ?? costoMensual * 10)
                                            : costoMensual * 10;
                                        return (
                                            <div className="mt-2 flex items-center gap-3 rounded-xl bg-indigo-50 border border-indigo-100 px-4 py-2.5">
                                                <Icon icon="solar:tag-price-bold-duotone" className="text-indigo-400 text-base flex-shrink-0" />
                                                <div className="flex items-center gap-4 flex-1">
                                                    <div>
                                                        <div className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wide">Tu costo mensual</div>
                                                        <div className="text-base font-extrabold text-indigo-700">S/ {costoMensual.toFixed(2)}</div>
                                                    </div>
                                                    <div className="w-px h-8 bg-indigo-200" />
                                                    <div>
                                                        <div className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wide">Tu costo anual</div>
                                                        <div className="text-base font-extrabold text-indigo-700">S/ {costoAnual.toFixed(2)}</div>
                                                    </div>
                                                    <div className="ml-auto text-[10px] text-indigo-300 italic">Tú defines cuánto cobras al cliente</div>
                                                </div>
                                            </div>
                                        );
                                    })()}
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
                                            <InputPro isLabel label="URL API Producción" name="billingApiBaseUrl" value={formData.billingApiBaseUrl} onChange={handleChange as any} placeholder="https://facturas.jambleperu.com" />
                                        </div>
                                        <div className="col-span-2">
                                            <InputPro isLabel label="URL API Demo" name="billingApiDemoBaseUrl" value={formData.billingApiDemoBaseUrl} onChange={handleChange as any} placeholder="https://demo-facturas.jambleperu.com" />
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
                        {activeTab === 'series' && (
                            <div className="space-y-3">
                                {seriesData.map((item, index) => (
                                    <div key={item.tipoDoc} className="grid grid-cols-[1fr_110px_110px_40px] items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 p-3">
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">{item.nombre}</p>
                                            <p className="text-[11px] text-gray-400">Tipo {item.tipoDoc}</p>
                                        </div>
                                        <input className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-bold uppercase" value={item.serie} onChange={(e) => setSeriesData(prev => prev.map((s, i) => i === index ? { ...s, serie: e.target.value.toUpperCase() } : s))} />
                                        <input className="rounded-lg border border-gray-200 px-3 py-2 text-sm" type="number" min={1} value={item.correlativo} onChange={(e) => setSeriesData(prev => prev.map((s, i) => i === index ? { ...s, correlativo: Number(e.target.value || 1) } : s))} />
                                        <input type="checkbox" checked={item.activo} onChange={(e) => setSeriesData(prev => prev.map((s, i) => i === index ? { ...s, activo: e.target.checked } : s))} className="h-5 w-5 accent-indigo-600" />
                                    </div>
                                ))}
                                <p className="text-xs text-gray-500">Estas series se usarán como base para los comprobantes nuevos de esta empresa.</p>
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
