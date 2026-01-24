import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import axios from 'axios';
import SelectorTipoEntrega from '@/components/SelectorTipoEntrega';
import StoreHeader from '@/components/tienda/StoreHeader';
import PaymentConfirmationModal from '@/components/tienda/PaymentConfirmationModal';
import ConfirmOrderModal from '@/components/tienda/ConfirmOrderModal';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export default function Checkout() {
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { carrito: carritoStateInitial, tienda } = location.state || {}; // Rename to initial
  const [carritoState, setCarritoState] = useState<any[]>(carritoStateInitial || []);

  const [configPago, setConfigPago] = useState<any>(null);
  const [configEnvio, setConfigEnvio] = useState<any>(null);
  const [enviando, setEnviando] = useState(false);
  const [pedidoCreado, setPedidoCreado] = useState<any>(null);
  const [erroresForm, setErroresForm] = useState<Record<string, string>>({});
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const [formData, setFormData] = useState({
    clienteNombre: '',
    clienteTelefono: '',
    clienteEmail: '',
    clienteDireccion: '',
    clienteReferencia: '',
    medioPago: 'EFECTIVO', // Default to Cash/POS as per visual cues usually
    observaciones: '',
    referenciaTransf: '',
    tipoEntrega: 'RECOJO' as 'RECOJO' | 'ENVIO',
  });

  const [search, setSearch] = useState(''); // For header
  const [searchResults, setSearchResults] = useState<any[]>([]);

  useEffect(() => {
    // rehidratar si no vino por state
    if ((!carritoState || carritoState.length === 0) && slug) {
      try {
        const saved = localStorage.getItem(`tienda:${slug}:carrito`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCarritoState(parsed);
          } else {
            navigate(`/tienda/${slug}`);
            return;
          }
        } else {
          navigate(`/tienda/${slug}`);
          return;
        }
      } catch {
        navigate(`/tienda/${slug}`);
        return;
      }
    }
    setIsLoaded(true);
    cargarConfigPago();
    cargarConfigEnvio();
  }, []);

  // Live search for header suggestions
  useEffect(() => {
    if (!search || search.length < 2) {
      setSearchResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        const { data } = await axios.get(`${BASE_URL}/public/store/${slug}/products`, {
          params: { search, limit: 5 }
        });
        // La API devuelve { code: 1, message: 'OK', data: { data: [...], total: 4 } }
        // Necesitamos extraer data.data.data
        const items = data?.data?.data || data?.data || [];
        setSearchResults(Array.isArray(items) ? items : []);
      } catch (error) {
        console.error("Error searching products:", error);
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, slug]);

  useEffect(() => {
    if (!isLoaded || !slug) return;
    try {
      if (Array.isArray(carritoState) && carritoState.length > 0) {
        localStorage.setItem(`tienda:${slug}:carrito`, JSON.stringify(carritoState));
      } else {
        localStorage.removeItem(`tienda:${slug}:carrito`);
      }
    } catch { }
  }, [slug, carritoState, isLoaded]);

  const cargarConfigPago = async () => {
    try {
      const { data } = await axios.get(`${BASE_URL}/public/store/${slug}/payment-config`);
      const rawConfig = data.data || data;

      // Normalize config for modal
      const normalizedConfig = {
        ...rawConfig,
        yapeQR: rawConfig.yapeQrUrl || rawConfig.yapeQR,
        plinQR: rawConfig.plinQrUrl || rawConfig.plinQR,
        yapeNumero: rawConfig.yapeNumero || rawConfig.yapePhone,
        plinNumero: rawConfig.plinNumero || rawConfig.plinPhone,
        whatsappTienda: rawConfig.whatsappTienda || rawConfig.whatsapp || rawConfig.telefono || rawConfig.celular
      };

      setConfigPago(normalizedConfig);

      // Set default payment method if available
      if (normalizedConfig.aceptaEfectivo) setFormData(p => ({ ...p, medioPago: 'EFECTIVO' }));
      else if (normalizedConfig.yapeQrUrl) setFormData(p => ({ ...p, medioPago: 'YAPE' }));
    } catch (error) {
      console.error('Error al cargar config de pago:', error);
    }
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
      };
      setConfigEnvio(normalized);
      if (normalized.aceptaRecojo && !normalized.aceptaEnvio) {
        setFormData(prev => ({ ...prev, tipoEntrega: 'RECOJO' }));
      } else if (!normalized.aceptaRecojo && normalized.aceptaEnvio) {
        setFormData(prev => ({ ...prev, tipoEntrega: 'ENVIO' }));
      }
    } catch (error) {
      console.error('Error al cargar config de envío:', error);
    }
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (erroresForm[name]) {
      setErroresForm((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validarFormulario = (): boolean => {
    const errores: Record<string, string> = {};

    // Validar nombre
    if (!formData.clienteNombre.trim()) {
      errores.clienteNombre = 'El nombre es requerido';
    }

    // Validar teléfono
    if (!formData.clienteTelefono.trim()) {
      errores.clienteTelefono = 'El teléfono es requerido';
    }

    // Validar email
    if (!formData.clienteEmail.trim()) {
      errores.clienteEmail = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.clienteEmail)) {
      errores.clienteEmail = 'El email no es válido';
    }

    // Validar dirección si es envío
    if (formData.tipoEntrega === 'ENVIO' && !formData.clienteDireccion.trim()) {
      errores.clienteDireccion = 'La dirección es requerida para envío';
    }

    setErroresForm(errores);
    return Object.keys(errores).length === 0;
  };

  const updateQuantity = (id: any, newQty: number) => {
    if (newQty < 1) {
      // Remove item
      const newCart = carritoState.filter(i => i.id !== id);
      setCarritoState(newCart);
      if (newCart.length === 0) navigate(`/tienda/${slug}`);
    } else {
      setCarritoState(carritoState.map(i => i.id === id ? { ...i, cantidad: newQty } : i));
    }
  };

  const calcularSubtotal = () => {
    return carritoState.reduce((sum: number, item: any) => sum + Number(item.precioUnitario) * item.cantidad, 0);
  };

  const calcularCostoEnvio = () => {
    if (formData.tipoEntrega === 'ENVIO' && configEnvio) {
      return Number(configEnvio.costoEnvio || 0);
    }
    return 0;
  };

  const calcularTotal = () => {
    return calcularSubtotal() + calcularCostoEnvio();
  };

  const enviarPedido = async () => {
    // Validar formulario antes de enviar
    if (!validarFormulario()) {
      // Scroll to first error
      const firstErrorField = document.querySelector('.border-red-300');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setEnviando(true);
    try {
      const items = carritoState.map((item: any) => ({
        productoId: item.productoId || item.id, // Use original product ID
        cantidad: item.cantidad,
        modificadores: item.modificadores // Include modifiers if backend supports
      }));

      const { data } = await axios.post(`${BASE_URL}/public/store/${slug}/orders`, {
        ...formData,
        items,
        total: calcularTotal()
      });

      const orderData = data.data || data;
      setPedidoCreado(orderData);
      setShowConfirmModal(false);
      setShowPaymentModal(true); // Show payment confirmation modal
      setCarritoState([]); // Clear state, effect will clear storage
      localStorage.removeItem(`tienda:${slug}:carrito`); // Force clear just in case
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al crear pedido');
    } finally {
      setEnviando(false);
    }
  };

  const diseno = tienda?.diseno || {};
  const fontFamily = diseno.tipografia || 'Inter, sans-serif';

  return (
    <div className="min-h-screen bg-[#F9FAFB]" style={{ fontFamily: '"Mona Sans", ' + fontFamily }}>
      {/* Header for Checkout (simplified or full) */}
      <StoreHeader
        tienda={tienda}
        slug={slug || ''}
        carritoCount={carritoState.length}
        onToggleCart={() => { }} // Disabled in checkout
        isAdminOpen={false}
        setIsAdminOpen={() => { }}
        adminMenuRef={{ current: null }}
        search={search}
        setSearch={setSearch}
        categories={[]}
        onSelectCategory={() => { }}
        recommendedProducts={searchResults}
        hideCart={true}
        onSearch={() => {
          if (search.trim()) {
            window.location.href = `/tienda/${slug}?search=${encodeURIComponent(search)}`;
          }
        }}
      />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">

          {/* Left Column: Delivery & Items */}
          <div className="lg:col-span-2 space-y-6">

            {/* Delivery Information Card */}
            {configEnvio && (
              <div className="bg-white rounded-3xl p-4 md:p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-[#045659]">Información de entrega</h2>
                  <button className="flex items-center gap-1 text-[#F05542] font-semibold text-sm hover:underline">
                    <Icon icon="solar:pen-bold" /> Editar
                  </button>
                </div>

                {/* Address / Type Selector */}
                <div className="flex flex-col md:flex-row gap-4 items-start">
                  <div className="w-12 h-12 bg-gray-100 rounded-2xl hidden md:flex items-center justify-center flex-shrink-0 text-gray-500">
                    <Icon icon="solar:map-point-bold-duotone" width={24} />
                  </div>
                  <div className="flex-1 w-full">
                    {/* Simple Tabs for Delivery Type */}
                    <div className="flex gap-4 mb-4 border-b border-gray-100 pb-2 overflow-x-auto">
                      {configEnvio.aceptaEnvio && (
                        <label className={`cursor-pointer pb-2 font-bold text-sm whitespace-nowrap ${formData.tipoEntrega === 'ENVIO' ? 'text-[#045659] border-b-2 border-[#045659]' : 'text-gray-400'}`}>
                          <input type="radio" className="hidden" name="tipoEntrega" value="ENVIO" checked={formData.tipoEntrega === 'ENVIO'} onChange={handleChange} />
                          Delivery
                        </label>
                      )}
                      {configEnvio.aceptaRecojo && (
                        <label className={`cursor-pointer pb-2 font-bold text-sm whitespace-nowrap ${formData.tipoEntrega === 'RECOJO' ? 'text-[#045659] border-b-2 border-[#045659]' : 'text-gray-400'}`}>
                          <input type="radio" className="hidden" name="tipoEntrega" value="RECOJO" checked={formData.tipoEntrega === 'RECOJO'} onChange={handleChange} />
                          Recojo en tienda
                        </label>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <input
                          type="text"
                          name="clienteNombre"
                          placeholder="Nombre completo *"
                          value={formData.clienteNombre}
                          onChange={handleChange}
                          className={`w-full bg-gray-50 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#045659]/20 ${erroresForm.clienteNombre ? 'border-2 border-red-300' : 'border-none'
                            }`}
                        />
                        {erroresForm.clienteNombre && (
                          <p className="text-red-500 text-xs mt-1 ml-1">{erroresForm.clienteNombre}</p>
                        )}
                      </div>

                      <div>
                        <input
                          type="tel"
                          name="clienteTelefono"
                          placeholder="Teléfono *"
                          value={formData.clienteTelefono}
                          onChange={handleChange}
                          className={`w-full bg-gray-50 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#045659]/20 ${erroresForm.clienteTelefono ? 'border-2 border-red-300' : 'border-none'
                            }`}
                        />
                        {erroresForm.clienteTelefono && (
                          <p className="text-red-500 text-xs mt-1 ml-1">{erroresForm.clienteTelefono}</p>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <input
                          type="email"
                          name="clienteEmail"
                          placeholder="Email *"
                          value={formData.clienteEmail}
                          onChange={handleChange}
                          className={`w-full bg-gray-50 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#045659]/20 ${erroresForm.clienteEmail ? 'border-2 border-red-300' : 'border-none'
                            }`}
                        />
                        {erroresForm.clienteEmail && (
                          <p className="text-red-500 text-xs mt-1 ml-1">{erroresForm.clienteEmail}</p>
                        )}
                      </div>

                      {formData.tipoEntrega === 'ENVIO' ? (
                        <div className="md:col-span-2">
                          <input
                            type="text"
                            name="clienteDireccion"
                            placeholder="Dirección de entrega *"
                            value={formData.clienteDireccion}
                            onChange={handleChange}
                            className={`w-full bg-gray-50 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#045659]/20 ${erroresForm.clienteDireccion ? 'border-2 border-red-300' : 'border-none'
                              }`}
                          />
                          {erroresForm.clienteDireccion && (
                            <p className="text-red-500 text-xs mt-1 ml-1">{erroresForm.clienteDireccion}</p>
                          )}
                        </div>
                      ) : (
                        <div className="md:col-span-2 p-3 bg-yellow-50 text-yellow-800 rounded-xl text-sm flex items-center gap-2">
                          <Icon icon="solar:shop-bold" />
                          <span>Recojo en: {configEnvio.direccionRecojo}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Review Item by Store */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  {tienda?.logo ? <img src={tienda.logo} className="w-8 h-8 rounded-full bg-gray-100" /> : <div className="w-8 h-8 bg-red-500 rounded-full text-white flex items-center justify-center font-bold">T</div>}
                  <div>
                    <h3 className="font-bold text-[#045659]">{tienda?.nombreComercial || 'Tienda'}</h3>
                    <p className="text-xs text-gray-400">Entrega en 15 minutos</p>
                  </div>
                </div>
                <Icon icon="mdi:chevron-up" className="text-gray-400" />
              </div>

              <div className="space-y-6">
                {carritoState.map((item) => (
                  <div key={item.id} className="flex gap-4 items-center bg-[#F9FAFB] p-4 rounded-2xl">
                    <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center p-1 border border-gray-100">
                      {item.imagenUrl ? <img src={item.imagenUrl} className="w-full h-full object-contain" /> : <Icon icon="solar:box-linear" className="text-gray-300" />}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-[#045659] text-sm line-clamp-1">{item.descripcion}</h4>
                      <p className="text-xs text-gray-500">
                        {typeof item.unidadMedida === 'object' && item.unidadMedida !== null
                          ? (item.unidadMedida.nombre || item.unidadMedida.codigo || 'Unidad')
                          : (item.unidadMedida || 'Unidad')}
                      </p>

                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="font-bold text-lg text-[#045659]">{Math.floor(Number(item.precioUnitario))}</span>
                        <span className="text-xs font-bold text-[#045659] align-top">.{Number(item.precioUnitario).toFixed(2).split('.')[1]} S/</span>
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-3">
                      <button onClick={() => updateQuantity(item.id, item.cantidad - 1)} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-white transition-colors text-gray-500">
                        <Icon icon={item.cantidad === 1 ? "solar:trash-bin-trash-linear" : "mdi:minus"} width={16} />
                      </button>
                      <span className="font-bold text-gray-900 w-4 text-center">{item.cantidad}</span>
                      <button onClick={() => updateQuantity(item.id, item.cantidad + 1)} className="w-8 h-8 rounded-full border border-[#045659] text-[#045659] flex items-center justify-center hover:bg-[#045659] hover:text-white transition-colors">
                        <Icon icon="mdi:plus" width={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center text-sm text-gray-500 cursor-pointer hover:text-red-500" onClick={() => navigate(`/tienda/${slug}`)}>
                <div className="flex items-center gap-2">
                  <Icon icon="solar:restart-linear" />
                  Reemplazar con otros productos
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 sticky top-24">
              <h2 className="text-xl font-bold text-[#045659] mb-6">Resumen de orden</h2>

              {/* Payment Methods */}
              <div className="space-y-3 mb-6">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${formData.medioPago === 'YAPE' ? 'border-[#F05542]' : 'border-gray-300'}`}>
                    {formData.medioPago === 'YAPE' && <div className="w-2.5 h-2.5 bg-[#F05542] rounded-full" />}
                  </div>
                  <input type="radio" name="medioPago" value="YAPE" className="hidden" onChange={handleChange} checked={formData.medioPago === 'YAPE'} />
                  <span className="text-sm font-medium text-gray-700">Yape / Plin (Online)</span>
                </label>
                {configPago?.aceptaEfectivo && (
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${formData.medioPago === 'EFECTIVO' ? 'border-[#F05542]' : 'border-gray-300'}`}>
                      {formData.medioPago === 'EFECTIVO' && <div className="w-2.5 h-2.5 bg-[#F05542] rounded-full" />}
                    </div>
                    <input type="radio" name="medioPago" value="EFECTIVO" className="hidden" onChange={handleChange} checked={formData.medioPago === 'EFECTIVO'} />
                    <span className="text-sm font-medium text-gray-700">Contraentrega (Efectivo)</span>
                  </label>
                )}
                {/* <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${formData.medioPago === 'POS' ? 'border-[#F05542]' : 'border-gray-300'}`}>
                    {formData.medioPago === 'POS' && <div className="w-2.5 h-2.5 bg-[#F05542] rounded-full" />}
                  </div>
                  <input type="radio" name="medioPago" value="POS" className="hidden" onChange={handleChange} checked={formData.medioPago === 'POS'} />
                  <span className="text-sm font-medium text-gray-700">Tarjeta (POS)</span>
                </label> */}
              </div>

              {/* Promo Code */}
              <div className="flex gap-2 mb-6 bg-gray-50 p-2 rounded-xl">
                <input type="text" placeholder="Añadir Promo" className="bg-transparent border-none text-sm w-full focus:ring-0 px-2" />
                <button className="bg-[#045659] text-white px-4 py-2 rounded-lg text-xs font-bold uppercase">Aplicar</button>
              </div>

              {/* Cost Breakdown */}
              <div className="space-y-3 border-b border-gray-100 pb-6 mb-6">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-bold text-gray-900">S/ {calcularSubtotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Costo de envío</span>
                  <span className="font-bold text-gray-900">S/ {calcularCostoEnvio().toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-between items-end mb-6">
                <span className="text-xl font-bold text-[#045659]">Total</span>
                <div className="text-right">
                  <span className="text-2xl font-extrabold text-[#045659]">S/ {calcularTotal().toFixed(2)}</span>
                </div>
              </div>

              {/* <div className="border border-gray-200 rounded-xl p-3 flex items-center justify-center gap-2 mb-4 bg-white hover:bg-gray-50 cursor-pointer transition-colors">
                <span className="text-sm font-medium text-gray-600">Pagar en cuotas con</span>
                <span className="bg-pink-100 text-pink-600 px-2 py-0.5 rounded text-xs font-bold italic">Klarna.</span>
              </div> */}

              <button
                onClick={() => {
                  if (validarFormulario()) {
                    setShowConfirmModal(true);
                  }
                }}
                disabled={enviando || carritoState.length === 0}
                className="w-full bg-[#BCE766] hover:bg-[#aed859] text-[#045659] py-4 rounded-full font-bold uppercase tracking-wide transition-all shadow-sm disabled:opacity-50"
              >
                {enviando ? 'Procesando...' : 'Confirmar Orden'}
              </button>

            </div>
          </div>

        </div>
      </div>

      {/* Payment Confirmation Modal */}
      {pedidoCreado && (
        <PaymentConfirmationModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            // Redirect to tracking page
            window.location.href = `/tienda/${slug}/seguimiento?codigo=${pedidoCreado.codigoSeguimiento}`;
          }}
          orderData={{
            id: pedidoCreado.id,
            codigoSeguimiento: pedidoCreado.codigoSeguimiento,
            total: pedidoCreado.total || calcularTotal(),
            medioPago: formData.medioPago,
            tipoEntrega: formData.tipoEntrega,
            clienteNombre: formData.clienteNombre
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
        tiendaColor={diseno?.colorPrimario || '#045659'}
      />
    </div>
  );
}
