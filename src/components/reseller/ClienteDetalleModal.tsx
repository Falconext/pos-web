import React, { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { useResellerPanelStore } from '@/zustand/reseller-panel';
import dayjs from 'dayjs'; // Or moment if dayjs not avail? User has moment.

const EstadoBadge = ({ estado }: { estado: string }) => {
    const isActive = estado === 'ACTIVO';
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
            {estado}
        </span>
    );
};

interface Props {
    resellerId: number;
    clienteId: number;
    isOpen: boolean;
    onClose: () => void;
}

export default function ClienteDetalleModal({ resellerId, clienteId, isOpen, onClose }: Props) {
    const { getClienteDetalle, toggleEstadoCliente } = useResellerPanelStore();
    const [cliente, setCliente] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && clienteId) {
            setLoading(true);
            getClienteDetalle(resellerId, clienteId).then((data) => {
                setCliente(data);
                setLoading(false);
            });
        }
    }, [isOpen, clienteId]);

    const handleToggleEstado = async () => {
        if (!cliente) return;
        const nuevoEstado = cliente.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';

        // Confirm
        if (!window.confirm(`¿Estás seguro de que deseas ${nuevoEstado === 'ACTIVO' ? 'ACTIVAR' : 'SUSPENDER'} a este cliente?`)) return;

        const result = await toggleEstadoCliente(resellerId, clienteId, nuevoEstado);
        if (result.success) {
            setCliente({ ...cliente, estado: nuevoEstado });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-white rounded-3xl p-0 w-full max-w-2xl z-10 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Detalles del Cliente</h2>
                        <p className="text-sm text-gray-500">Información de la empresa y accesos</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <Icon icon="solar:close-circle-bold" width="24" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Icon icon="svg-spinners:3-dots-fade" width="40" className="text-indigo-600" />
                        </div>
                    ) : !cliente ? (
                        <div className="text-center py-12 text-gray-500">No se encontró información del cliente.</div>
                    ) : (
                        <div className="space-y-8">
                            {/* Empresa Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Empresa</h3>

                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 font-bold text-xl uppercase">
                                            {cliente.nombreComercial?.charAt(0) || 'E'}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800 text-lg">{cliente.nombreComercial}</p>
                                            <p className="text-sm text-gray-500 font-mono">{cliente.ruc}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between py-2 border-b border-gray-50">
                                            <span className="text-gray-500">Razón Social</span>
                                            <span className="font-medium text-gray-800 text-right">{cliente.razonSocial}</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b border-gray-50">
                                            <span className="text-gray-500">Plan Actual</span>
                                            <span className="font-medium text-indigo-600">{cliente.plan?.nombre}</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b border-gray-50">
                                            <span className="text-gray-500">Estado</span>
                                            <EstadoBadge estado={cliente.estado} />
                                        </div>
                                    </div>
                                </div>

                                {/* Access Info */}
                                <div className="space-y-4">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Acceso Administrativo</h3>

                                    {cliente.usuarios && cliente.usuarios.length > 0 ? (
                                        <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100 space-y-3">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-indigo-600 shadow-sm">
                                                    <Icon icon="solar:user-id-bold" width="16" />
                                                </div>
                                                <span className="text-sm font-bold text-indigo-900">Usuario Principal</span>
                                            </div>

                                            <div className="space-y-1">
                                                <p className="text-xs text-indigo-400 font-medium uppercase">Email de Acceso</p>
                                                <p className="text-sm font-semibold text-gray-800 break-all select-all">{cliente.usuarios[0].email}</p>
                                            </div>

                                            <div className="space-y-1">
                                                <p className="text-xs text-indigo-400 font-medium uppercase">Celular</p>
                                                <p className="text-sm font-semibold text-gray-800">{cliente.usuarios[0].celular || '-'}</p>
                                            </div>

                                            <div className="pt-2">
                                                <p className="text-[10px] text-indigo-400 leading-tight">
                                                    * La contraseña inicial fue asignada al crear. Si el cliente la olvidó, deberá usar "Recuperar Contraseña".
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-4 bg-gray-50 rounded-xl text-sm text-gray-500 border border-gray-100 dashed">
                                            No se encontró usuario administrador vinculado.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2.5 text-gray-600 font-bold bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
                        Cerrar
                    </button>

                    {cliente && (
                        cliente.estado === 'ACTIVO' ? (
                            <button
                                onClick={handleToggleEstado}
                                className="px-5 py-2.5 text-red-600 font-bold bg-white border border-red-200 rounded-xl hover:bg-red-50 transition-colors shadow-sm flex items-center gap-2"
                            >
                                <Icon icon="solar:forbidden-circle-bold" />
                                Suspender Servicio
                            </button>
                        ) : (
                            <button
                                onClick={handleToggleEstado}
                                className="px-5 py-2.5 text-white font-bold bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                            >
                                <Icon icon="solar:check-circle-bold" />
                                Reactivar Servicio
                            </button>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}
