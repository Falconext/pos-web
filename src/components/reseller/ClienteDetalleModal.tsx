import React, { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { useResellerPanelStore } from '@/zustand/reseller-panel';
import Modal from '@/components/Modal';
import InputPro from '@/components/InputPro';
import Button from '@/components/Button';
import Select from '@/components/Select';

interface Props {
    resellerId: number;
    clienteId: number;
    isOpen: boolean;
    onClose: () => void;
}

export default function ClienteDetalleModal({ resellerId, clienteId, isOpen, onClose }: Props) {
    const { getClienteDetalle, toggleEstadoCliente, updateClienteConfig } = useResellerPanelStore();
    const [cliente, setCliente] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'info' | 'config'>('info');
    const [configForm, setConfigForm] = useState<any>({
        billingProvider: 'QPSE',
        providerId: '',
        providerToken: '',
        usuarioPse: '',
        contrasenaPse: '',
        billingApiBaseUrl: '',
        billingApiToken: '',
        billingApiUser: '',
        billingApiPassword: '',
        adminNombre: '',
        adminEmail: '',
        adminCelular: '',
        adminPassword: '',
    });

    useEffect(() => {
        if (isOpen && clienteId) {
            setLoading(true);
            setActiveTab('info');
            getClienteDetalle(resellerId, clienteId).then((data) => {
                setCliente(data);
                setConfigForm({
                    billingProvider: data?.billingProvider || 'QPSE',
                    providerId: data?.providerId || '',
                    providerToken: data?.providerToken || '',
                    usuarioPse: data?.usuarioPse || '',
                    contrasenaPse: data?.contrasenaPse || '',
                    billingApiBaseUrl: data?.billingApiBaseUrl || '',
                    billingApiToken: data?.billingApiToken || '',
                    billingApiUser: data?.billingApiUser || '',
                    billingApiPassword: data?.billingApiPassword || '',
                    adminNombre: data?.usuarios?.[0]?.nombre || '',
                    adminEmail: data?.usuarios?.[0]?.email || '',
                    adminCelular: data?.usuarios?.[0]?.celular || '',
                    adminPassword: '',
                });
                setLoading(false);
            });
        }
    }, [isOpen, clienteId]);

    const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setConfigForm((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleSaveConfig = async () => {
        setSaving(true);
        const payload = { ...configForm };
        if (!payload.adminPassword) delete payload.adminPassword;
        const result = await updateClienteConfig(resellerId, clienteId, payload);
        if (result.success) {
            const updated = await getClienteDetalle(resellerId, clienteId);
            setCliente(updated);
        }
        setSaving(false);
    };

    const handleToggleEstado = async () => {
        if (!cliente) return;
        const nuevoEstado = cliente.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
        if (!window.confirm(`¿Estás seguro de ${nuevoEstado === 'ACTIVO' ? 'ACTIVAR' : 'SUSPENDER'} a este cliente?`)) return;
        const result = await toggleEstadoCliente(resellerId, clienteId, nuevoEstado);
        if (result.success) setCliente({ ...cliente, estado: nuevoEstado });
    };

    const isActive = cliente?.estado === 'ACTIVO';

    return (
        <Modal
            isOpenModal={isOpen}
            closeModal={onClose}
            title={loading ? 'Cargando...' : (cliente?.nombreComercial || 'Detalles del Cliente')}
            icon="solar:buildings-bold-duotone"
            iconClass="bg-indigo-50 text-indigo-600"
            width="680px"
            height="auto"
        >
            {loading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
                    <Icon icon="svg-spinners:3-dots-fade" width="40" className="text-indigo-500" />
                    <p className="text-sm">Cargando información...</p>
                </div>
            ) : !cliente ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2 text-gray-400">
                    <Icon icon="solar:buildings-linear" width="40" className="opacity-40" />
                    <p className="text-sm">No se encontró información del cliente.</p>
                </div>
            ) : (
                <>
                    {/* Tab bar */}
                    <div className="flex border-b border-gray-100">
                        <button
                            type="button"
                            onClick={() => setActiveTab('info')}
                            className={`flex items-center gap-1.5 px-5 py-3 text-xs font-semibold uppercase tracking-wide border-b-2 transition-colors ${activeTab === 'info' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                        >
                            <Icon icon="solar:info-circle-bold" width="14" />Información
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('config')}
                            className={`flex items-center gap-1.5 px-5 py-3 text-xs font-semibold uppercase tracking-wide border-b-2 transition-colors ${activeTab === 'config' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                        >
                            <Icon icon="solar:settings-bold" width="14" />Configuración
                        </button>
                    </div>

                    {/* Info tab */}
                    {activeTab === 'info' && (
                        <div className="p-5 grid grid-cols-2 gap-4">
                            {/* Company card */}
                            <div className="col-span-2 md:col-span-1 bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Empresa</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-lg uppercase flex-shrink-0">
                                        {cliente.nombreComercial?.charAt(0) || 'E'}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-800 leading-tight">{cliente.nombreComercial}</p>
                                        <p className="text-xs text-gray-400 font-mono mt-0.5">{cliente.ruc}</p>
                                    </div>
                                </div>
                                <div className="space-y-0 divide-y divide-gray-100 text-sm">
                                    <div className="flex justify-between py-2">
                                        <span className="text-gray-400 text-xs">Razón Social</span>
                                        <span className="font-medium text-gray-700 text-xs text-right max-w-[55%]">{cliente.razonSocial}</span>
                                    </div>
                                    <div className="flex justify-between py-2">
                                        <span className="text-gray-400 text-xs">Plan</span>
                                        <span className="font-semibold text-indigo-600 text-xs">{cliente.plan?.nombre || '-'}</span>
                                    </div>
                                    <div className="flex justify-between py-2 items-center">
                                        <span className="text-gray-400 text-xs">Estado</span>
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                            {cliente.estado}
                                        </span>
                                    </div>
                                    <div className="flex justify-between py-2">
                                        <span className="text-gray-400 text-xs">Facturación</span>
                                        <span className="font-mono text-xs text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">{configForm.billingProvider}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Admin access card */}
                            <div className="col-span-2 md:col-span-1">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Acceso Administrativo</p>
                                {cliente.usuarios?.length > 0 ? (
                                    <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100 space-y-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
                                                <Icon icon="solar:user-id-bold" width="16" />
                                            </div>
                                            <span className="text-sm font-bold text-indigo-800">Usuario Principal</span>
                                        </div>
                                        <div className="space-y-2.5">
                                            <div>
                                                <p className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wide">Email de Acceso</p>
                                                <p className="text-sm font-semibold text-gray-800 break-all select-all mt-0.5">{cliente.usuarios[0].email}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wide">Celular</p>
                                                <p className="text-sm font-semibold text-gray-800 mt-0.5">{cliente.usuarios[0].celular || '—'}</p>
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-indigo-300 leading-snug pt-1 border-t border-indigo-100">
                                            Si el cliente olvidó su contraseña, deberá usar "Recuperar Contraseña" desde el login.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-gray-50 rounded-xl text-sm text-gray-400 border border-dashed border-gray-200 flex items-center gap-2">
                                        <Icon icon="solar:user-minus-linear" width="18" />
                                        Sin usuario administrador vinculado.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Config tab */}
                    {activeTab === 'config' && (
                        <div className="p-5 space-y-5">
                            {/* Billing section */}
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                    <Icon icon="solar:bill-bold" width="12" />Integración de Facturación
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="col-span-2">
                                        <Select
                                            label="Proveedor"
                                            name="billingProvider"
                                            value={configForm.billingProvider === 'JAMBLE' ? 'JAMBLE (API propia)' : configForm.billingProvider}
                                            options={[
                                                { id: 'QPSE', value: 'QPSE' },
                                                { id: 'APISUNAT', value: 'APISUNAT' },
                                                { id: 'JAMBLE', value: 'JAMBLE (API propia)' },
                                            ]}
                                            onChange={(id: any) => setConfigForm((prev: any) => ({ ...prev, billingProvider: id }))}
                                            error={null}
                                            readOnly={true}
                                        />
                                    </div>

                                    {configForm.billingProvider === 'QPSE' && (
                                        <>
                                            <InputPro isLabel label="Usuario QPSE" name="usuarioPse" value={configForm.usuarioPse} onChange={handleConfigChange as any} placeholder="usuario_qpse" />
                                            <InputPro isLabel label="Clave QPSE" name="contrasenaPse" type="password" value={configForm.contrasenaPse} onChange={handleConfigChange as any} placeholder="••••••••" />
                                        </>
                                    )}

                                    {configForm.billingProvider === 'APISUNAT' && (
                                        <>
                                            <InputPro isLabel label="Persona ID" name="providerId" value={configForm.providerId} onChange={handleConfigChange as any} placeholder="personaId" />
                                            <InputPro isLabel label="Persona Token" name="providerToken" value={configForm.providerToken} onChange={handleConfigChange as any} placeholder="token" />
                                        </>
                                    )}

                                    {configForm.billingProvider === 'JAMBLE' && (
                                        <>
                                            <div className="col-span-2">
                                                <InputPro isLabel label="Base URL API" name="billingApiBaseUrl" value={configForm.billingApiBaseUrl} onChange={handleConfigChange as any} placeholder="https://api.tu-proveedor.com" />
                                            </div>
                                            <div className="col-span-2">
                                                <InputPro isLabel label="Token API" name="billingApiToken" value={configForm.billingApiToken} onChange={handleConfigChange as any} placeholder="token (opcional)" />
                                            </div>
                                            <InputPro isLabel label="Usuario API" name="billingApiUser" value={configForm.billingApiUser} onChange={handleConfigChange as any} placeholder="usuario_api" />
                                            <InputPro isLabel label="Clave API" name="billingApiPassword" type="password" value={configForm.billingApiPassword} onChange={handleConfigChange as any} placeholder="••••••••" />
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Admin credentials section */}
                            <div className="border-t border-gray-100 pt-4">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                    <Icon icon="solar:user-id-bold" width="12" />Acceso del Administrador
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    <InputPro isLabel label="Nombre" name="adminNombre" value={configForm.adminNombre} onChange={handleConfigChange as any} placeholder="Nombre Admin" />
                                    <InputPro isLabel label="Celular" name="adminCelular" value={configForm.adminCelular} onChange={handleConfigChange as any} placeholder="999 999 999" />
                                    <div className="col-span-2">
                                        <InputPro isLabel label="Email" name="adminEmail" type="email" value={configForm.adminEmail} onChange={handleConfigChange as any} placeholder="admin@empresa.com" />
                                    </div>
                                    <div className="col-span-2">
                                        <InputPro isLabel label="Nueva contraseña (opcional)" name="adminPassword" type="password" value={configForm.adminPassword} onChange={handleConfigChange as any} placeholder="Dejar vacío para no cambiar" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center gap-2 px-5 pb-5 border-t border-gray-100 pt-4">
                        <Button type="button" onClick={onClose} color="default">Cerrar</Button>
                        <div className="flex-1" />
                        {activeTab === 'config' && (
                            <Button
                                type="button"
                                onClick={handleSaveConfig}
                                disabled={saving}
                                color="primary"
                            >
                                <Icon icon={saving ? 'svg-spinners:3-dots-fade' : 'solar:diskette-bold'} width="15" className="mr-1.5" />
                                {saving ? 'Guardando...' : 'Guardar'}
                            </Button>
                        )}
                        {cliente && (
                            isActive ? (
                                <Button type="button" onClick={handleToggleEstado} color="danger" outline>
                                    <Icon icon="solar:forbidden-circle-bold" width="15" className="mr-1.5" />
                                    Suspender
                                </Button>
                            ) : (
                                <Button type="button" onClick={handleToggleEstado} color="success">
                                    <Icon icon="solar:check-circle-bold" width="15" className="mr-1.5" />
                                    Reactivar
                                </Button>
                            )
                        )}
                    </div>
                </>
            )}
        </Modal>
    );
}
