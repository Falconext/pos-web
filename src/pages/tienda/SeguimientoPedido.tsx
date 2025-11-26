import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import axios from 'axios';
import LineaTiempoEstados from '@/components/LineaTiempoEstados';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export default function SeguimientoPedido() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const codigoParam = searchParams.get('codigo');

    const [codigo, setCodigo] = useState(codigoParam || '');
    const [pedido, setPedido] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (codigoParam) {
            buscarPedido(codigoParam);
        }
    }, [codigoParam]);

    const buscarPedido = async (codigoBusqueda: string) => {
        if (!codigoBusqueda.trim()) {
            setError('Ingresa un código de seguimiento');
            return;
        }

        setLoading(true);
        setError('');
        setPedido(null);

        try {
            const { data } = await axios.get(`${BASE_URL}/public/store/track/${codigoBusqueda}`);
            const raw: any = data?.data || data;
            const normalizado = {
                ...raw,
                subtotal: Number(raw?.subtotal ?? 0),
                igv: Number(raw?.igv ?? 0),
                total: Number(raw?.total ?? 0),
                costoEnvio: Number(raw?.costoEnvio ?? 0),
                items: (raw?.items || []).map((it: any) => ({
                    ...it,
                    precioUnit: Number(it?.precioUnit ?? it?.precioUnitario ?? 0),
                    subtotal: Number(it?.subtotal ?? 0),
                })),
            };
            setPedido(normalizado);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Pedido no encontrado');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        buscarPedido(codigo);
    };

    const getEstadoColor = (estado: string) => {
        const colors: any = {
            PENDIENTE: 'bg-yellow-100 text-yellow-800',
            CONFIRMADO: 'bg-blue-100 text-blue-800',
            EN_PREPARACION: 'bg-purple-100 text-purple-800',
            LISTO: 'bg-green-100 text-green-800',
            ENTREGADO: 'bg-gray-100 text-gray-800',
            CANCELADO: 'bg-red-100 text-red-800',
        };
        return colors[estado] || 'bg-gray-100 text-gray-800';
    };

    const getEstadoLabel = (estado: string) => {
        const labels: any = {
            PENDIENTE: 'Pendiente',
            CONFIRMADO: 'Confirmado',
            EN_PREPARACION: 'En Preparación',
            LISTO: 'Listo',
            ENTREGADO: 'Entregado',
            CANCELADO: 'Cancelado',
        };
        return labels[estado] || estado;
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-3xl mx-auto px-4">
                {/* Encabezado */}
                <div className="flex items-center gap-3 mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-full bg-white shadow hover:bg-gray-50"
                        aria-label="Volver"
                    >
                        <Icon icon="mdi:chevron-left" className="w-6 h-6" />
                    </button>
                    <h1 className="text-2xl md:text-3xl font-bold">Order status</h1>
                </div>

                {/* Formulario de búsqueda */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <form onSubmit={handleSubmit} className="flex gap-3">
                        <input
                            type="text"
                            value={codigo}
                            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                            placeholder="Ej: PED-ABC123-XYZ"
                            className="flex-1 border rounded-lg px-4 py-3 text-lg"
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
                        >
                            {loading ? 'Buscando...' : 'Buscar'}
                        </button>
                    </form>
                    {error && (
                        <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg flex items-center gap-2">
                            <Icon icon="mdi:alert-circle" className="w-5 h-5" />
                            <span>{error}</span>
                        </div>
                    )}
                </div>

                {/* Resultado */}
                {pedido && (() => {
                    const tiempoBase = (pedido?.empresa as any)?.tiempoPreparacionMin ?? 20;
                    const estimada = new Date(new Date(pedido.creadoEn).getTime() + tiempoBase * 60000);
                    const horaEstimada = estimada.toLocaleTimeString('es-PE', { hour: 'numeric', minute: '2-digit' });
                    const fechaEstimada = estimada.toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' });
                    return (
                        <div className="space-y-6">
                            {/* Tarjeta: Estimated delivery */}
                            <div className="bg-white rounded-2xl shadow-sm p-4 flex items-center justify-between border border-gray-100">
                                <div className="flex items-center gap-3">
                                    <span className="p-2 rounded-lg bg-orange-50 text-orange-600">
                                        <Icon icon="mdi:alarm" className="w-5 h-5" />
                                    </span>
                                    <div>
                                        <p className="text-[13px] text-orange-600 font-semibold">Estimated delivery</p>
                                        <p className="text-xs text-gray-500">{fechaEstimada}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-semibold">{horaEstimada}</p>
                                    <p className="text-xs text-gray-500">{tiempoBase}-{tiempoBase + 10} min</p>
                                </div>
                            </div>

                            {/* Tarjeta: Order tracking */}
                            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-semibold">Order tracking</h2>
                                    <span className="text-orange-600 font-semibold">№{pedido.codigoSeguimiento}</span>
                                </div>
                                {/* Estado actual */}
                                <div className="flex items-center justify-between mb-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoColor(pedido.estado)}`}>{getEstadoLabel(pedido.estado)}</span>
                                    <div className="text-sm text-gray-600">
                                        {new Date(pedido.creadoEn).toLocaleString('es-PE')}
                                    </div>
                                </div>
                                {/* Timeline */}
                                {pedido.historialEstados && pedido.historialEstados.length > 0 ? (
                                    <LineaTiempoEstados historial={pedido.historialEstados} estadoActual={pedido.estado} />
                                ) : (
                                    <p className="text-gray-600">No hay historial disponible</p>
                                )}
                            </div>

                            {/* Detalle de orden */}
                            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                                <h3 className="text-lg font-semibold mb-4">Order №{pedido.codigoSeguimiento}</h3>
                                <div className="space-y-3 mb-4">
                                    {pedido.items.map((item: any) => (
                                        <div key={item.id} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3 min-w-0">
                                                {item.producto?.imagenUrl ? (
                                                    <img src={item.producto.imagenUrl} alt={item.producto.descripcion} className="w-12 h-12 rounded object-cover" />
                                                ) : (
                                                    <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center text-gray-400">
                                                        <Icon icon="mdi:image-off" />
                                                    </div>
                                                )}
                                                <div className="min-w-0">
                                                    <p className="truncate font-medium text-sm">{item.producto.descripcion}</p>
                                                    <p className="text-xs text-gray-500">{item.cantidad} item{item.cantidad > 1 ? 's' : ''}</p>
                                                </div>
                                            </div>
                                            <div className="text-sm font-semibold">S/ {item.subtotal.toFixed(2)}</div>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between text-gray-600">
                                        <span>Subtotal</span>
                                        <span>S/ {Number(pedido.subtotal).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                        <span>Delivery</span>
                                        <span>{pedido.costoEnvio > 0 ? `S/ ${pedido.costoEnvio.toFixed(2)}` : 'Free'}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                        <span>Delivery time</span>
                                        <span>{tiempoBase}-{tiempoBase + 10} min</span>
                                    </div>
                                    <div className="flex justify-between font-bold pt-2 border-t">
                                        <span>Total</span>
                                        <span>S/ {pedido.total.toFixed(2)}</span>
                                    </div>
                                </div>

                                {/* Contacto */}
                                {pedido.empresa?.whatsappTienda && (
                                    <a
                                        href={`https://wa.me/${pedido.empresa.whatsappTienda.replace(/\D/g, '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-6 flex items-center justify-center gap-2 w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700"
                                    >
                                        <Icon icon="mdi:whatsapp" className="w-5 h-5" />
                                        Contactar al negocio
                                    </a>
                                )}
                            </div>

                            {/* Botón Back to Home */}
                            <button
                                onClick={() => navigate('/')}
                                className="w-full py-3 rounded-xl text-white font-semibold"
                                style={{ backgroundColor: '#f97316' }}
                            >
                                Back to Home
                            </button>
                        </div>
                    );
                })()}
            </div>
        </div>
    );
}
