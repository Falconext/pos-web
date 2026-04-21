import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import axios from 'axios';
import StoreHeader from '@/components/tienda/StoreHeader';
import Footer from '@/components/tienda/Footer';
import ProductCardPio from '@/components/tienda/ProductCardPio';
import PaymentConfirmationModal from '@/components/tienda/PaymentConfirmationModal';
import ConfirmOrderModal from '@/components/tienda/ConfirmOrderModal';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export default function Checkout() {
    const { slug } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { carrito: carritoStateInitial, tienda } = location.state || {};
    const [carritoState, setCarritoState] = useState<any[]>(carritoStateInitial || []);

    const [configPago, setConfigPago] = useState<any>(null);
    const [configEnvio, setConfigEnvio] = useState<any>(null);
    const [enviando, setEnviando] = useState(false);
    const [pedidoCreado, setPedidoCreado] = useState<any>(null);
    const [erroresForm, setErroresForm] = useState<Record<string, string>>({});
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [promoExpanded, setPromoExpanded] = useState(false);
    const [promoCode, setPromoCode] = useState('');
    const [suggestedProducts, setSuggestedProducts] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        clienteNombre: '',
        clienteTelefono: '',
        clienteEmail: '',
        clienteDireccion: '',
        clienteReferencia: '',
        medioPago: 'EFECTIVO',
        observaciones: '',
        referenciaTransf: '',
        tipoEntrega: 'RECOJO' as 'RECOJO' | 'ENVIO',
    });

    const [search, setSearch] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);

    useEffect(() => {
        if ((!carritoState || carritoState.length === 0) && slug) {
            try {
                const saved = localStorage.getItem(`tienda:${slug}:carrito`);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (Array.isArray(parsed) && parsed.length > 0) setCarritoState(parsed);
                    else { navigate(`/tienda/${slug}`); return; }
                } else { navigate(`/tienda/${slug}`); return; }
            } catch { navigate(`/tienda/${slug}`); return; }
        }
        setIsLoaded(true);
        cargarConfigPago();
        cargarConfigEnvio();
        cargarSugeridos();
    }, []);

    useEffect(() => {
        if (!search || search.length < 2) { setSearchResults([]); return; }
        const timeout = setTimeout(async () => {
            try {
                const { data } = await axios.get(`${BASE_URL}/public/store/${slug}/products`, { params: { search, limit: 5 } });
                const items = data?.data?.data || data?.data || [];
                setSearchResults(Array.isArray(items) ? items : []);
            } catch { setSearchResults([]); }
        }, 300);
        return () => clearTimeout(timeout);
    }, [search, slug]);

    useEffect(() => {
        if (!isLoaded || !slug) return;
        try {
            if (Array.isArray(carritoState) && carritoState.length > 0) localStorage.setItem(`tienda:${slug}:carrito`, JSON.stringify(carritoState));
            else localStorage.removeItem(`tienda:${slug}:carrito`);
        } catch { }
    }, [slug, carritoState, isLoaded]);

    const cargarConfigPago = async () => {
        try {
            const { data } = await axios.get(`${BASE_URL}/public/store/${slug}/payment-config`);
            const rawConfig = data.data || data;
            const normalizedConfig = {
                ...rawConfig,
                yapeQR: rawConfig.yapeQrUrl || rawConfig.yapeQR,
                plinQR: rawConfig.plinQrUrl || rawConfig.plinQR,
                yapeNumero: rawConfig.yapeNumero || rawConfig.yapePhone,
                plinNumero: rawConfig.plinNumero || rawConfig.plinPhone,
                whatsappTienda: rawConfig.whatsappTienda || rawConfig.whatsapp || rawConfig.telefono,
            };
            setConfigPago(normalizedConfig);
            if (normalizedConfig.aceptaEfectivo) setFormData(p => ({ ...p, medioPago: 'EFECTIVO' }));
            else if (normalizedConfig.yapeQrUrl) setFormData(p => ({ ...p, medioPago: 'YAPE' }));
        } catch { }
    };

    const cargarConfigEnvio = async () => {
        try {
            const { data } = await axios.get(`${BASE_URL}/public/store/${slug}/shipping-config`);
            const raw = data.data || data;
            const normalized = {
                aceptaRecojo: !!raw.aceptaRecojo,
                aceptaEnvio: !!raw.aceptaEnvio,
                direccionRecojo: raw.direccionRecojo || raw.direccion || '',
                costoEnvio: Number(raw.costoEnvioFijo ?? raw.costoEnvio ?? 0),
                envioGratisDesdeSoles: Number(raw.envioGratisDesdeSoles ?? 0),
            };
            setConfigEnvio(normalized);
            if (normalized.aceptaRecojo && !normalized.aceptaEnvio) setFormData(prev => ({ ...prev, tipoEntrega: 'RECOJO' }));
            else if (!normalized.aceptaRecojo && normalized.aceptaEnvio) setFormData(prev => ({ ...prev, tipoEntrega: 'ENVIO' }));
        } catch { }
    };

    const cargarSugeridos = async () => {
        try {
            const { data } = await axios.get(`${BASE_URL}/public/store/${slug}/products`, { params: { limit: 12 } });
            const items = data?.data?.data || data?.data || [];
            setSuggestedProducts(Array.isArray(items) ? items : []);
        } catch { }
    };

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (erroresForm[name]) setErroresForm(prev => { const n = { ...prev }; delete n[name]; return n; });
    };

    const validarFormulario = (): boolean => {
        const errores: Record<string, string> = {};
        if (!formData.clienteNombre.trim()) errores.clienteNombre = 'El nombre es requerido';
        if (!formData.clienteTelefono.trim()) errores.clienteTelefono = 'El teléfono es requerido';
        if (!formData.clienteEmail.trim()) errores.clienteEmail = 'El email es requerido';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.clienteEmail)) errores.clienteEmail = 'Email inválido';
        if (formData.tipoEntrega === 'ENVIO' && !formData.clienteDireccion.trim()) errores.clienteDireccion = 'La dirección es requerida para envío';
        setErroresForm(errores);
        return Object.keys(errores).length === 0;
    };

    const updateQuantity = (id: any, newQty: number) => {
        if (newQty < 1) {
            const newCart = carritoState.filter(i => i.id !== id);
            setCarritoState(newCart);
            if (newCart.length === 0) navigate(`/tienda/${slug}`);
        } else setCarritoState(carritoState.map(i => i.id === id ? { ...i, cantidad: newQty } : i));
    };

    const removeItem = (id: any) => {
        const newCart = carritoState.filter(i => i.id !== id);
        setCarritoState(newCart);
        if (newCart.length === 0) navigate(`/tienda/${slug}`);
    };

    const calcularSubtotal = () => carritoState.reduce((sum: number, item: any) => sum + Number(item.precioUnitario) * item.cantidad, 0);
    const calcularCostoEnvio = () => formData.tipoEntrega === 'ENVIO' && configEnvio ? Number(configEnvio.costoEnvio || 0) : 0;
    const calcularTotal = () => calcularSubtotal() + calcularCostoEnvio();

    const freeDeliveryThreshold = configEnvio?.envioGratisDesdeSoles || 0;
    const subtotal = calcularSubtotal();
    const freeDeliveryProgress = freeDeliveryThreshold > 0 ? Math.min((subtotal / freeDeliveryThreshold) * 100, 100) : 100;
    const freeDeliveryRemaining = freeDeliveryThreshold > 0 ? Math.max(freeDeliveryThreshold - subtotal, 0) : 0;

    const enviarPedido = async () => {
        if (!validarFormulario()) { document.querySelector('.border-red-300')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
        setEnviando(true);
        try {
            const items = carritoState.map((item: any) => ({ productoId: item.productoId || item.id, cantidad: item.cantidad, modificadores: item.modificadores }));
            const { data } = await axios.post(`${BASE_URL}/public/store/${slug}/orders`, { ...formData, items, total: calcularTotal() });
            const orderData = data.data || data;
            setPedidoCreado(orderData);
            setShowConfirmModal(false);
            setShowPaymentModal(true);
            setCarritoState([]);
            localStorage.removeItem(`tienda:${slug}:carrito`);
        } catch (error: any) {
            alert(error.response?.data?.message || 'Error al crear pedido');
        } finally { setEnviando(false); }
    };

    const diseno = tienda?.diseno || {};

    return (
        <div className="min-h-screen bg-[#F6F6F6]" style={{ fontFamily: '"Mona Sans", Inter, sans-serif' }}>
            <StoreHeader
                tienda={tienda || {}}
                slug={slug || ''}
                carritoCount={carritoState.length}
                onToggleCart={() => { }}
                isAdminOpen={false}
                setIsAdminOpen={() => { }}
                adminMenuRef={{ current: null }}
                search={search}
                setSearch={setSearch}
                categories={[]}
                onSelectCategory={() => { }}
                recommendedProducts={searchResults}
                hideCart={true}
                onSearch={() => { if (search.trim()) window.location.href = `/tienda/${slug}?search=${encodeURIComponent(search)}`; }}
            />

            <div className="max-w-screen-xl mx-auto px-4 mt-5 md:px-8 pt-28 md:pt-32 pb-8">
                <div className="flex gap-6 items-start">

                    {/* ── Left: Cart + Form ── */}
                    <div className="flex-1 min-w-0 space-y-5">

                        {/* Shopping Cart Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100">
                                <h2 className="text-xl font-black text-[#1A1A1A]">Carrito de compras</h2>
                            </div>

                            <div className="divide-y divide-gray-50">
                                {carritoState.map((item) => {
                                    const price = Number(item.precioUnitario || 0);
                                    const original = Number(item.precioOriginal || 0);
                                    const hasDiscount = original > price;
                                    return (
                                        <div key={item.id} className="px-6 py-4 flex items-center gap-4">
                                            {/* Image */}
                                            <div className="w-20 h-20 bg-[#FAF6F1] rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                {item.imagenUrl
                                                    ? <img src={item.imagenUrl} className="w-full h-full object-contain p-1" alt="" />
                                                    : <Icon icon="solar:box-linear" className="text-gray-300 text-2xl" />
                                                }
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-[#1A1A1A] text-sm line-clamp-2 leading-snug">{item.descripcion}</h4>
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    {typeof item.unidadMedida === 'object' && item.unidadMedida !== null
                                                        ? (item.unidadMedida.nombre || item.unidadMedida.codigo || 'Unidad')
                                                        : (item.unidadMedida || 'Unidad')}
                                                </p>
                                                {/* Heart + Delete */}
                                                <div className="flex items-center gap-3 mt-2">
                                                    <button className="text-gray-300 hover:text-[#FF9500] transition-colors">
                                                        <Icon icon="solar:heart-linear" width={18} />
                                                    </button>
                                                    <button onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-[#EF4444] transition-colors">
                                                        <Icon icon="solar:trash-bin-trash-linear" width={18} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Qty controls */}
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.cantidad - 1)}
                                                    className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-[#FF9500] hover:text-[#FF9500] transition-colors text-sm font-bold"
                                                >
                                                    −
                                                </button>
                                                <span className="w-6 text-center font-bold text-sm text-[#1A1A1A]">{item.cantidad}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.cantidad + 1)}
                                                    className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-[#FF9500] hover:text-[#FF9500] transition-colors text-sm font-bold"
                                                >
                                                    +
                                                </button>
                                            </div>

                                            {/* Price */}
                                            <div className="text-right flex-shrink-0 min-w-[80px]">
                                                <div className={`font-bold text-base ${hasDiscount ? 'text-[#EF4444]' : 'text-[#1A1A1A]'}`}>
                                                    S/ {(price * item.cantidad).toFixed(2)}
                                                </div>
                                                {hasDiscount && (
                                                    <div className="text-xs text-gray-400 line-through">
                                                        S/ {(original * item.cantidad).toFixed(2)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="px-6 py-3 border-t border-gray-50">
                                <button
                                    onClick={() => navigate(`/tienda/${slug}`)}
                                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-[#FF9500] transition-colors"
                                >
                                    <Icon icon="solar:arrow-left-linear" width={16} />
                                    Seguir comprando
                                </button>
                            </div>
                        </div>

                        {/* Customer Info Form */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                                <h2 className="text-lg font-black text-[#1A1A1A]">Datos de entrega</h2>
                                {configEnvio && (
                                    <div className="flex gap-3">
                                        {configEnvio.aceptaEnvio && (
                                            <label className={`flex items-center gap-2 cursor-pointer text-sm font-bold px-3 py-1.5 rounded-full transition-colors ${formData.tipoEntrega === 'ENVIO' ? 'bg-[#FF9500] text-white' : 'border border-gray-200 text-gray-500'}`}>
                                                <input type="radio" className="hidden" name="tipoEntrega" value="ENVIO" checked={formData.tipoEntrega === 'ENVIO'} onChange={handleChange} />
                                                <Icon icon="solar:delivery-linear" width={14} />
                                                Delivery
                                            </label>
                                        )}
                                        {configEnvio.aceptaRecojo && (
                                            <label className={`flex items-center gap-2 cursor-pointer text-sm font-bold px-3 py-1.5 rounded-full transition-colors ${formData.tipoEntrega === 'RECOJO' ? 'bg-[#1A1A1A] text-white' : 'border border-gray-200 text-gray-500'}`}>
                                                <input type="radio" className="hidden" name="tipoEntrega" value="RECOJO" checked={formData.tipoEntrega === 'RECOJO'} onChange={handleChange} />
                                                <Icon icon="solar:shop-bold" width={14} />
                                                Recojo
                                            </label>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <input type="text" name="clienteNombre" placeholder="Nombre completo *" value={formData.clienteNombre} onChange={handleChange}
                                        className={`w-full bg-[#F5F5F5] rounded-xl px-4 py-3 text-sm border focus:outline-none focus:ring-2 focus:ring-[#FF9500]/20 ${erroresForm.clienteNombre ? 'border-red-300' : 'border-transparent'}`} />
                                    {erroresForm.clienteNombre && <p className="text-red-500 text-xs mt-1 ml-1">{erroresForm.clienteNombre}</p>}
                                </div>
                                <div>
                                    <input type="tel" name="clienteTelefono" placeholder="Teléfono *" value={formData.clienteTelefono} onChange={handleChange}
                                        className={`w-full bg-[#F5F5F5] rounded-xl px-4 py-3 text-sm border focus:outline-none focus:ring-2 focus:ring-[#FF9500]/20 ${erroresForm.clienteTelefono ? 'border-red-300' : 'border-transparent'}`} />
                                    {erroresForm.clienteTelefono && <p className="text-red-500 text-xs mt-1 ml-1">{erroresForm.clienteTelefono}</p>}
                                </div>
                                <div className="md:col-span-2">
                                    <input type="email" name="clienteEmail" placeholder="Email *" value={formData.clienteEmail} onChange={handleChange}
                                        className={`w-full bg-[#F5F5F5] rounded-xl px-4 py-3 text-sm border focus:outline-none focus:ring-2 focus:ring-[#FF9500]/20 ${erroresForm.clienteEmail ? 'border-red-300' : 'border-transparent'}`} />
                                    {erroresForm.clienteEmail && <p className="text-red-500 text-xs mt-1 ml-1">{erroresForm.clienteEmail}</p>}
                                </div>
                                {formData.tipoEntrega === 'ENVIO' ? (
                                    <div className="md:col-span-2">
                                        <input type="text" name="clienteDireccion" placeholder="Dirección de entrega *" value={formData.clienteDireccion} onChange={handleChange}
                                            className={`w-full bg-[#F5F5F5] rounded-xl px-4 py-3 text-sm border focus:outline-none focus:ring-2 focus:ring-[#FF9500]/20 ${erroresForm.clienteDireccion ? 'border-red-300' : 'border-transparent'}`} />
                                        {erroresForm.clienteDireccion && <p className="text-red-500 text-xs mt-1 ml-1">{erroresForm.clienteDireccion}</p>}
                                    </div>
                                ) : configEnvio?.direccionRecojo ? (
                                    <div className="md:col-span-2 p-3 bg-[#FFF3E0] rounded-xl text-sm flex items-center gap-2 text-[#FF9500]">
                                        <Icon icon="solar:shop-bold" width={16} />
                                        <span className="text-[#1A1A1A]">Recojo en: <strong>{configEnvio.direccionRecojo}</strong></span>
                                    </div>
                                ) : null}

                                {/* Payment method */}
                                <div className="md:col-span-2">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Método de pago</p>
                                    <div className="flex flex-wrap gap-2">
                                        {['YAPE', 'PLIN', 'EFECTIVO'].map(method => {
                                            const labels: Record<string, string> = { YAPE: 'Yape', PLIN: 'Plin', EFECTIVO: 'Efectivo' };
                                            const icons: Record<string, string> = { YAPE: 'solar:smartphone-bold', PLIN: 'solar:wallet-money-bold', EFECTIVO: 'solar:banknote-2-bold' };
                                            const show = method === 'EFECTIVO' ? configPago?.aceptaEfectivo : true;
                                            if (!show) return null;
                                            return (
                                                <label key={method} className={`flex items-center gap-2 cursor-pointer px-4 py-2 rounded-full text-sm font-bold border-2 transition-colors ${formData.medioPago === method ? 'border-[#FF9500] bg-[#FFF3E0] text-[#FF9500]' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                                                    <input type="radio" className="hidden" name="medioPago" value={method} checked={formData.medioPago === method} onChange={handleChange} />
                                                    <Icon icon={icons[method]} width={14} />
                                                    {labels[method]}
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Suggested products */}
                        {suggestedProducts.length > 0 && (
                            <div>
                                <h3 className="text-xl font-black text-[#1A1A1A] mb-4">También te puede gustar</h3>
                                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                                    {suggestedProducts.slice(0, 8).map((producto) => (
                                        <div key={producto.id} className="flex-shrink-0 w-44">
                                            <ProductCardPio
                                                producto={producto}
                                                slug={slug || ''}
                                                diseno={diseno}
                                                onAddToCart={() => {
                                                    const nuevoItem = { ...producto, id: producto.id, productoId: producto.id, cantidad: 1, precioBase: producto.precioUnitario, modificadores: [] };
                                                    const existe = carritoState.find((i: any) => i.id === producto.id && !i.modificadores?.length);
                                                    if (existe) setCarritoState(carritoState.map((i: any) => i.id === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i));
                                                    else setCarritoState([...carritoState, nuevoItem]);
                                                }}
                                                onClick={() => navigate(`/tienda/${slug}/producto/${producto.id}`)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Similar products */}
                        {suggestedProducts.length > 8 && (
                            <div>
                                <h3 className="text-xl font-black text-[#1A1A1A] mb-4">Productos similares</h3>
                                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                                    {suggestedProducts.slice(8, 14).map((producto) => (
                                        <div key={producto.id} className="flex-shrink-0 w-44">
                                            <ProductCardPio
                                                producto={producto}
                                                slug={slug || ''}
                                                diseno={diseno}
                                                onAddToCart={() => {
                                                    const nuevoItem = { ...producto, id: producto.id, productoId: producto.id, cantidad: 1, precioBase: producto.precioUnitario, modificadores: [] };
                                                    const existe = carritoState.find((i: any) => i.id === producto.id && !i.modificadores?.length);
                                                    if (existe) setCarritoState(carritoState.map((i: any) => i.id === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i));
                                                    else setCarritoState([...carritoState, nuevoItem]);
                                                }}
                                                onClick={() => navigate(`/tienda/${slug}/producto/${producto.id}`)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Right: Order Summary ── */}
                    <div className="w-80 flex-shrink-0 sticky top-32">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100">
                                <h2 className="text-lg font-black text-[#1A1A1A]">Resumen del pedido</h2>
                            </div>

                            <div className="px-6 py-4 space-y-3">
                                <div className="flex justify-between text-sm text-gray-500">
                                    <span>Productos</span>
                                    <span className="font-bold text-[#1A1A1A]">{carritoState.reduce((s: number, i: any) => s + i.cantidad, 0)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-500">
                                    <span>Subtotal</span>
                                    <span className="font-bold text-[#1A1A1A]">S/ {calcularSubtotal().toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-500">
                                    <span>Envío</span>
                                    <span className="font-bold text-[#1A1A1A]">
                                        {calcularCostoEnvio() === 0 ? <span className="text-[#22C55E]">Gratis</span> : `S/ ${calcularCostoEnvio().toFixed(2)}`}
                                    </span>
                                </div>

                                {/* Free delivery progress bar */}
                                {freeDeliveryThreshold > 0 && freeDeliveryRemaining > 0 && (
                                    <div className="bg-[#F0FDF4] rounded-xl px-3 py-2.5">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Icon icon="solar:delivery-linear" width={14} className="text-[#22C55E]" />
                                            <span className="text-xs text-[#22C55E] font-bold">
                                                S/ {freeDeliveryRemaining.toFixed(2)} para envío gratis
                                            </span>
                                        </div>
                                        <div className="h-1.5 bg-[#DCFCE7] rounded-full overflow-hidden">
                                            <div className="h-full bg-[#22C55E] rounded-full transition-all" style={{ width: `${freeDeliveryProgress}%` }} />
                                        </div>
                                    </div>
                                )}

                                <div className="border-t border-gray-100 pt-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-base font-black text-[#1A1A1A]">Total</span>
                                        <span className="text-xl font-black text-[#1A1A1A]">S/ {calcularTotal().toFixed(2)}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => { if (validarFormulario()) setShowConfirmModal(true); }}
                                    disabled={enviando || carritoState.length === 0}
                                    className="w-full bg-[#FF9500] hover:bg-[#E08500] text-white py-3.5 rounded-full font-black text-sm tracking-wide transition-all disabled:opacity-50 mt-2"
                                >
                                    {enviando ? 'Procesando...' : 'Confirmar pedido'}
                                </button>
                            </div>

                            {/* Promo code */}
                            <div className="border-t border-gray-100">
                                <button
                                    onClick={() => setPromoExpanded(!promoExpanded)}
                                    className="w-full flex items-center justify-between px-6 py-3.5 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        <Icon icon="solar:ticket-bold" width={16} className="text-[#FF9500]" />
                                        <span className="font-medium">Tengo un código de descuento</span>
                                    </div>
                                    <Icon icon="solar:alt-arrow-right-linear" width={16} className={`transition-transform ${promoExpanded ? 'rotate-90' : ''}`} />
                                </button>
                                {promoExpanded && (
                                    <div className="px-6 pb-4 flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Ingresa tu código"
                                            value={promoCode}
                                            onChange={e => setPromoCode(e.target.value)}
                                            className="flex-1 bg-[#F5F5F5] rounded-xl px-3 py-2.5 text-sm border-none focus:outline-none focus:ring-2 focus:ring-[#FF9500]/20"
                                        />
                                        <button className="bg-[#1A1A1A] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#2D2D2D] transition-colors">
                                            Aplicar
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8">
                <Footer tienda={tienda || {}} diseno={diseno} />
            </div>

            {pedidoCreado && (
                <PaymentConfirmationModal
                    isOpen={showPaymentModal}
                    onClose={() => {
                        setShowPaymentModal(false);
                        window.location.href = `/tienda/${slug}/seguimiento?codigo=${pedidoCreado.codigoSeguimiento}`;
                    }}
                    orderData={{
                        id: pedidoCreado.id,
                        codigoSeguimiento: pedidoCreado.codigoSeguimiento,
                        total: pedidoCreado.total || calcularTotal(),
                        medioPago: formData.medioPago,
                        tipoEntrega: formData.tipoEntrega,
                        clienteNombre: formData.clienteNombre,
                    }}
                    paymentConfig={configPago}
                    storeSlug={slug || ''}
                />
            )}

            <ConfirmOrderModal
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={enviarPedido}
                total={calcularTotal()}
                loading={enviando}
                tiendaColor="#FF9500"
            />
        </div>
    );
}
