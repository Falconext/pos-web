import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useAuthStore } from '@/zustand/auth';
import { useRubroFeatures } from '@/utils/rubro-features';
import apiClient from '@/utils/apiClient';
import useAlertStore from '@/zustand/alert';
import Button from '@/components/Button';
import InputPro from '@/components/InputPro';
import TableSkeleton from '@/components/Skeletons/table';
import { useNavigate } from 'react-router-dom';
import ModalCrearLote from './ModalCrearLote';

interface ProductoLote {
    id: number;
    lote: string;
    fechaVencimiento: string;
    stockActual: number;
    stockInicial: number;
    activo: boolean;
    producto: {
        id: number;
        codigo: string;
        descripcion: string;
        precioUnitario: number;
    };
    costoUnitario?: number;
    proveedor?: string;
}

const GestionLotes = () => {
    const { auth } = useAuthStore();
    const navigate = useNavigate();
    const features = useRubroFeatures(auth?.empresa?.rubro?.nombre);

    const [lotes, setLotes] = useState<ProductoLote[]>([]);
    const [loading, setLoading] = useState(true);
    const [filtro, setFiltro] = useState<'todos' | 'por-vencer' | 'vencidos'>('por-vencer');
    const [diasAnticipacion, setDiasAnticipacion] = useState(30);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Redirigir si el rubro no usa lotes
    useEffect(() => {
        if (!features.gestionLotes) {
            useAlertStore.getState().alert('Esta funcionalidad solo está disponible para farmacias y boticas', 'info');
            navigate('/admin/productos');
        }
    }, [features, navigate]);

    const cargarLotes = async () => {
        try {
            setLoading(true);
            let endpoint = '/producto/lotes/por-vencer';

            if (filtro === 'vencidos') {
                endpoint = '/producto/lotes/vencidos';
            } else if (filtro === 'por-vencer') {
                endpoint = `/producto/lotes/por-vencer?dias=${diasAnticipacion}`;
            }

            const { data } = await apiClient.get(endpoint);
            setLotes(data?.data || data || []);
        } catch (error: any) {
            console.error('Error al cargar lotes:', error);
            useAlertStore.getState().alert('Error al cargar lotes', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (features.gestionLotes) {
            cargarLotes();
        }
        // eslint-disable-next-line
    }, [filtro, diasAnticipacion, features.gestionLotes]);

    const calcularDiasParaVencer = (fechaVencimiento: string) => {
        const hoy = new Date();
        const vencimiento = new Date(fechaVencimiento);
        const diferencia = vencimiento.getTime() - hoy.getTime();
        return Math.ceil(diferencia / (1000 * 60 * 60 * 24));
    };

    const handleDesactivarLote = async (loteId: number) => {
        try {
            await apiClient.patch(`/producto/lotes/${loteId}/desactivar`);
            useAlertStore.getState().alert('Lote desactivado correctamente', 'success');
            cargarLotes();
        } catch (error) {
            useAlertStore.getState().alert('Error al desactivar lote', 'error');
        }
    };

    if (!features.gestionLotes) {
        return null;
    }

    return (
        <div className="min-h-screen pb-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Gestión de Lotes</h1>
                    <p className="text-sm text-gray-500 mt-1">Control de vencimientos y stock por lote</p>
                </div>
                <Button
                    color="secondary"
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2"
                >
                    <Icon icon="solar:add-circle-bold" className="text-lg" />
                    Nuevo Lote
                </Button>
            </div>

            {/* Main Content Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Filters */}
                <div className="p-5 border-b border-gray-100">
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="flex gap-2">
                            <Button
                                color={filtro === 'por-vencer' ? 'warning' : 'lila'}
                                outline={filtro !== 'por-vencer'}
                                onClick={() => setFiltro('por-vencer')}
                                className="text-sm"
                            >
                                <Icon icon="solar:danger-triangle-bold" className="mr-1.5" />
                                Por Vencer
                            </Button>
                            <Button
                                color={filtro === 'vencidos' ? 'danger' : 'lila'}
                                outline={filtro !== 'vencidos'}
                                onClick={() => setFiltro('vencidos')}
                                className="text-sm"
                            >
                                <Icon icon="solar:close-circle-bold" className="mr-1.5" />
                                Vencidos
                            </Button>
                        </div>

                        {filtro === 'por-vencer' && (
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">Próximos:</span>
                                <select
                                    value={diasAnticipacion}
                                    onChange={(e) => setDiasAnticipacion(Number(e.target.value))}
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6A6CFF] focus:border-transparent"
                                >
                                    <option value={15}>15 días</option>
                                    <option value={30}>30 días</option>
                                    <option value={60}>60 días</option>
                                    <option value={90}>90 días</option>
                                </select>
                            </div>
                        )}
                    </div>
                </div>

                {/* Table */}
                <div className="p-4">
                    {loading ? (
                        <TableSkeleton />
                    ) : lotes.length === 0 ? (
                        <div className="text-center py-12">
                            <Icon icon="solar:box-bold-duotone" className="mx-auto text-gray-300 mb-4" width={64} height={64} />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay lotes {filtro === 'vencidos' ? 'vencidos' : 'por vencer'}</h3>
                            <p className="text-sm text-gray-500">
                                {filtro === 'vencidos'
                                    ? '¡Excelente! No tienes productos vencidos.'
                                    : `No hay productos que venzan en los próximos ${diasAnticipacion} días.`
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Producto</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Código</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Lote</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Vencimiento</th>
                                        <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Stock</th>
                                        <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Estado</th>
                                        <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lotes.map((lote) => {
                                        const diasRestantes = calcularDiasParaVencer(lote.fechaVencimiento);
                                        const isVencido = diasRestantes < 0;
                                        const isPorVencer = diasRestantes >= 0 && diasRestantes <= 30;

                                        return (
                                            <tr
                                                key={lote.id}
                                                className={`border-b border-gray-100 hover:bg-gray-50 ${isVencido ? 'bg-red-50' : isPorVencer ? 'bg-yellow-50' : ''
                                                    }`}
                                            >
                                                <td className="py-3 px-4 text-sm text-gray-900 font-medium">{lote.producto.descripcion}</td>
                                                <td className="py-3 px-4 text-sm text-gray-600">{lote.producto.codigo}</td>
                                                <td className="py-3 px-4 text-sm text-gray-900 font-mono">{lote.lote}</td>
                                                <td className="py-3 px-4 text-sm text-gray-900">
                                                    {new Date(lote.fechaVencimiento).toLocaleDateString('es-PE')}
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${lote.stockActual === 0
                                                        ? 'bg-gray-100 text-gray-700'
                                                        : lote.stockActual <= 5
                                                            ? 'bg-red-100 text-red-700'
                                                            : lote.stockActual <= 10
                                                                ? 'bg-yellow-100 text-yellow-700'
                                                                : 'bg-green-100 text-green-700'
                                                        }`}>
                                                        {lote.stockActual}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    {isVencido ? (
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                                                            <Icon icon="solar:close-circle-bold" className="mr-1" width={14} />
                                                            Vencido
                                                        </span>
                                                    ) : isPorVencer ? (
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                                                            <Icon icon="solar:danger-triangle-bold" className="mr-1" width={14} />
                                                            {diasRestantes} días
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                                                            <Icon icon="solar:check-circle-bold" className="mr-1" width={14} />
                                                            Vigente
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    {lote.activo && (
                                                        <button
                                                            onClick={() => handleDesactivarLote(lote.id)}
                                                            className="text-red-600 hover:text-red-700 text-xs font-medium"
                                                            title="Desactivar lote"
                                                        >
                                                            <Icon icon="solar:trash-bin-bold" width={18} />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Stats Summary */}
                    {lotes.length > 0 && (
                        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-yellow-500 rounded-lg">
                                        <Icon icon="solar:danger-triangle-bold" className="text-white" width={24} />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-gray-900">{lotes.length}</div>
                                        <div className="text-sm text-gray-600">Lotes en alerta</div>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-500 rounded-lg">
                                        <Icon icon="solar:box-bold" className="text-white" width={24} />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-gray-900">
                                            {lotes.reduce((acc, l) => acc + l.stockActual, 0)}
                                        </div>
                                        <div className="text-sm text-gray-600">Unidades totales</div>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-500 rounded-lg">
                                        <Icon icon="solar:dollar-bold" className="text-white" width={24} />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-gray-900">
                                            S/ {lotes.reduce((acc, l) => acc + (l.producto.precioUnitario * l.stockActual), 0).toFixed(2)}
                                        </div>
                                        <div className="text-sm text-gray-600">Valor en inventario</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Crear Lote */}
            <ModalCrearLote
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {
                    cargarLotes();
                    setIsModalOpen(false);
                }}
            />
        </div>
    );
};

export default GestionLotes;
