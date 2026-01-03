import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import axios from 'axios';
import SelectorTipoEntrega from '@/components/SelectorTipoEntrega';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export default function Checkout() {
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { carrito, tienda } = location.state || {};
  const [carritoState, setCarritoState] = useState<any[]>(carrito || []);

  const [configPago, setConfigPago] = useState<any>(null);
  const [configEnvio, setConfigEnvio] = useState<any>(null);
  const [enviando, setEnviando] = useState(false);
  const [pedidoCreado, setPedidoCreado] = useState<any>(null);

  const [formData, setFormData] = useState({
    clienteNombre: '',
    clienteTelefono: '',
    clienteEmail: '',
    clienteDireccion: '',
    clienteReferencia: '',
    medioPago: 'YAPE',
    observaciones: '',
    referenciaTransf: '',
    tipoEntrega: 'RECOJO' as 'RECOJO' | 'ENVIO',
  });

  useEffect(() => {
    // rehidratar si no vino por state
    if ((!carrito || carrito.length === 0) && slug) {
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
    cargarConfigPago();
    cargarConfigEnvio();
  }, []);

  // Asegurar persistencia: guardar carrito de Checkout en localStorage
  useEffect(() => {
    try {
      if (slug && Array.isArray(carritoState) && carritoState.length > 0) {
        localStorage.setItem(`tienda:${slug}:carrito`, JSON.stringify(carritoState));
      }
    } catch { }
  }, [slug, carritoState]);

  const cargarConfigPago = async () => {
    try {
      const { data } = await axios.get(`${BASE_URL}/public/store/${slug}/payment-config`);
      setConfigPago(data.data || data);
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
        costoEnvio: Number(
          raw.costoEnvioFijo ?? raw.costoEnvio ?? raw.shippingCost ?? raw.costo_envio_fijo ?? 0
        ),
      };
      setConfigEnvio(normalized);
      // Si solo acepta uno, establecerlo por defecto
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
  };

  const calcularSubtotal = () => {
    return carritoState.reduce((sum: number, item: any) => sum + Number(item.precioUnitario) * item.cantidad, 0);
  };

  const calcularIGV = () => {
    // El IGV ya está incluido, así que lo extraemos: Total - (Total / 1.18)
    return calcularSubtotal() - (calcularSubtotal() / 1.18);
  };

  const calcularCostoEnvio = () => {
    if (formData.tipoEntrega === 'ENVIO' && configEnvio) {
      return Number(configEnvio.costoEnvio || 0);
    }
    return 0;
  };

  const calcularTotal = () => {
    // El subtotal ya incluye IGV, solo sumamos el costo de envío
    return calcularSubtotal() + calcularCostoEnvio();
  };

  const enviarPedido = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);

    try {
      const items = carritoState.map((item: any) => ({
        productoId: item.id,
        cantidad: item.cantidad,
      }));

      const { data } = await axios.post(`${BASE_URL}/public/store/${slug}/orders`, {
        ...formData,
        items,
      });

      setPedidoCreado(data.data || data);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al crear pedido');
    } finally {
      setEnviando(false);
    }
  };

  const diseno = tienda?.diseno || {};

  const getBordeRadius = () => {
    switch (diseno.bordeRadius) {
      case 'none': return 'rounded-none';
      case 'small': return 'rounded';
      case 'large': return 'rounded-2xl';
      case 'full': return 'rounded-3xl';
      default: return 'rounded-xl';
    }
  };

  const getBotonStyle = () => {
    switch (diseno.estiloBoton) {
      case 'square': return 'rounded-none';
      case 'pill': return 'rounded-full';
      default: return 'rounded-lg';
    }
  };

  const getFontFamily = () => {
    switch (diseno.tipografia) {
      case 'Roboto': return 'font-roboto';
      case 'Open Sans': return 'font-opensans';
      case 'Lato': return 'font-lato';
      case 'Poppins': return 'font-poppins';
      case 'Montserrat': return 'font-montserrat';
      case 'Raleway': return 'font-raleway';
      case 'Ubuntu': return 'font-ubuntu';
      case 'Manrope': return 'font-manrope';
      case 'Rubik': return 'font-rubik';
      case 'Inter': return 'font-inter';
      default: return 'font-sans';
    }
  };

  const borderRadius = getBordeRadius();
  const btnRadius = getBotonStyle();
  const fontFamily = getFontFamily();

  if (pedidoCreado) {
    return (
      <div className={`min-h-screen bg-gray-50 flex items-center justify-center p-4 ${fontFamily}`} style={{ fontFamily: diseno.tipografia }}>
        <div className={`max-w-md w-full bg-white ${borderRadius} border border-gray-100 shadow-sm p-8 text-center`}>
          <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: `${diseno.colorPrimario}10` }}>
            <Icon icon="mdi:check" className="w-10 h-10 text-orange-600" style={{ color: diseno.colorPrimario }} />
          </div>
          <h2 className="text-2xl font-bold mb-1">¡Pedido recibido!</h2>
          <p className="text-gray-600 mb-4">Tu pedido #{pedidoCreado.id} ha sido registrado.</p>

          <div className={`bg-orange-50 p-4 ${borderRadius} mb-4 border border-orange-100`} style={{ backgroundColor: `${diseno.colorPrimario}10`, borderColor: `${diseno.colorPrimario}30` }}>
            <p className="text-sm text-gray-600 mb-1">Código de seguimiento</p>
            <p className="text-xl font-bold text-orange-600" style={{ color: diseno.colorPrimario }}>{pedidoCreado.codigoSeguimiento}</p>
            <p className="text-xs text-gray-500 mt-2">Guárdalo para rastrear tu pedido</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => navigate(`/tienda/${slug}/seguimiento?codigo=${pedidoCreado.codigoSeguimiento}`)}
              className={`w-full py-3 ${btnRadius} text-white font-semibold hover:opacity-95`}
              style={{ backgroundColor: diseno.colorPrimario || '#f97316' }}
            >
              Rastrear mi pedido
            </button>
            <button
              onClick={() => navigate(`/tienda/${slug}`)}
              className={`w-full py-3 ${btnRadius} font-semibold border border-gray-200 hover:bg-gray-50`}
            >
              Volver a la tienda
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 py-8 ${fontFamily}`} style={{ fontFamily: diseno.tipografia }}>
      <div className="max-w-4xl mx-auto px-4">
        <button
          onClick={() => navigate(`/tienda/${slug}`)}
          className="flex items-center gap-2 text-gray-600 hover:text-black mb-6"
        >
          <Icon icon="mdi:arrow-left" />
          Volver a la tienda
        </button>

        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(`/tienda/${slug}`)} className="p-2 rounded-full bg-white shadow hover:bg-gray-50" aria-label="Volver">
            <Icon icon="mdi:chevron-left" className="w-6 h-6" />
          </button>
          <h1 className="text-2xl md:text-3xl font-bold">Complete su pedido</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20 md:pb-0">
          {/* Formulario */}
          <div className={`bg-white ${borderRadius} border border-gray-100 shadow-sm p-4 md:p-6`}>
            <h2 className="text-lg font-semibold mb-4">Tus Datos</h2>
            <form onSubmit={enviarPedido} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre completo *</label>
                <input
                  type="text"
                  name="clienteNombre"
                  value={formData.clienteNombre}
                  onChange={handleChange}
                  required
                  className={`w-full border ${borderRadius} p-2`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Teléfono / WhatsApp *</label>
                <input
                  type="tel"
                  name="clienteTelefono"
                  value={formData.clienteTelefono}
                  onChange={handleChange}
                  required
                  className={`w-full border ${borderRadius} p-2`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email (opcional)</label>
                <input
                  type="email"
                  name="clienteEmail"
                  value={formData.clienteEmail}
                  onChange={handleChange}
                  className={`w-full border ${borderRadius} p-2`}
                />
              </div>

              {/* Selector de tipo de entrega */}
              {configEnvio && (
                <SelectorTipoEntrega
                  tipoEntrega={formData.tipoEntrega}
                  onChange={(tipo) => setFormData(prev => ({ ...prev, tipoEntrega: tipo }))}
                  aceptaRecojo={configEnvio.aceptaRecojo}
                  aceptaEnvio={configEnvio.aceptaEnvio}
                  costoEnvio={Number(configEnvio.costoEnvio || 0)}
                  direccionRecojo={configEnvio.direccionRecojo}
                />
              )}

              <div>
                <label className="block text-sm font-medium mb-1">
                  {formData.tipoEntrega === 'ENVIO' ? 'Dirección de entrega *' : 'Dirección de entrega (opcional)'}
                </label>
                <input
                  type="text"
                  name="clienteDireccion"
                  value={formData.clienteDireccion}
                  onChange={handleChange}
                  required={formData.tipoEntrega === 'ENVIO'}
                  className={`w-full border ${borderRadius} p-2`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Referencia de ubicación</label>
                <input
                  type="text"
                  name="clienteReferencia"
                  value={formData.clienteReferencia}
                  onChange={handleChange}
                  placeholder="Ej: Casa blanca, puerta verde"
                  className={`w-full border ${borderRadius} p-2`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Método de pago *</label>
                <div className="space-y-2">
                  {configPago?.yapeQrUrl && (
                    <label className={`flex items-center gap-3 p-3 border ${borderRadius} hover:bg-gray-50`}>
                      <input
                        type="radio"
                        name="medioPago"
                        value="YAPE"
                        checked={formData.medioPago === 'YAPE'}
                        onChange={handleChange}
                      />
                      <span>Yape</span>
                    </label>
                  )}
                  {configPago?.plinQrUrl && (
                    <label className={`flex items-center gap-3 p-3 border ${borderRadius} hover:bg-gray-50`}>
                      <input
                        type="radio"
                        name="medioPago"
                        value="PLIN"
                        checked={formData.medioPago === 'PLIN'}
                        onChange={handleChange}
                      />
                      <span>Plin</span>
                    </label>
                  )}
                  {configPago?.aceptaEfectivo && (
                    <label className={`flex items-center gap-3 p-3 border ${borderRadius} hover:bg-gray-50`}>
                      <input
                        type="radio"
                        name="medioPago"
                        value="EFECTIVO"
                        checked={formData.medioPago === 'EFECTIVO'}
                        onChange={handleChange}
                      />
                      <span>Efectivo</span>
                    </label>
                  )}
                </div>
              </div>

              {(formData.medioPago === 'YAPE' || formData.medioPago === 'PLIN') && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm font-medium mb-2">Escanea el QR para pagar:</p>
                  {formData.medioPago === 'YAPE' && configPago?.yapeQrUrl && (
                    <div className="text-center">
                      <img
                        src={configPago.yapeQrUrl}
                        alt="QR Yape"
                        className="w-full h-full mx-auto mb-2"
                      />
                      <p className="text-sm">Número: {configPago.yapeNumero}</p>
                    </div>
                  )}
                  {formData.medioPago === 'PLIN' && configPago?.plinQrUrl && (
                    <div className="text-center">
                      <img
                        src={configPago.plinQrUrl}
                        alt="QR Plin"
                        className="w-48 h-48 mx-auto mb-2"
                      />
                      <p className="text-sm">Número: {configPago.plinNumero}</p>
                    </div>
                  )}
                  <div className="mt-3">
                    <label className="block text-sm font-medium mb-1">
                      Número desde el que pagaste (opcional)
                    </label>
                    <input
                      type="text"
                      name="referenciaTransf"
                      value={formData.referenciaTransf}
                      onChange={handleChange}
                      placeholder="999 999 999"
                      className={`w-full border ${borderRadius} p-2`}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Observaciones</label>
                <textarea
                  name="observaciones"
                  value={formData.observaciones}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Ej: Sin cebolla, extra picante..."
                  className={`w-full border ${borderRadius} p-2`}
                />
              </div>

              <button
                type="submit"
                disabled={enviando}
                className={`w-full text-white py-3 ${btnRadius} font-semibold hover:opacity-95 disabled:bg-gray-400`}
                style={{ backgroundColor: diseno.colorPrimario || '#f97316' }}
              >
                {enviando ? 'Enviando...' : 'Completar pedido'}
              </button>
            </form>
          </div>

          {/* Resumen */}
          <div className={`bg-white ${borderRadius} border border-gray-100 shadow-sm p-4 md:p-6 h-fit md:sticky md:top-24`}>
            <h2 className="text-lg font-semibold mb-4">Resumen del pedido</h2>
            <div className="space-y-3 mb-4">
              {carritoState.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    {item.imagenUrl ? (
                      <img src={item.imagenUrl} alt={item.descripcion} className="w-12 h-12 rounded object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center text-gray-400">
                        <Icon icon="mdi:image-off" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-medium text-sm">{item.descripcion}</p>
                      {/* Mostrar modificadores seleccionados */}
                      {item.modificadores && item.modificadores.length > 0 && (
                        <p className="text-xs text-gray-400 truncate">
                          {item.modificadores.map((m: any) => m.opcionNombre).join(', ')}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">{item.cantidad} item{item.cantidad > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="text-sm font-semibold">S/ {(Number(item.precioUnitario) * item.cantidad).toFixed(2)}</div>
                </div>
              ))}
            </div>
            <div className="border-t pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal (Base)</span>
                <span>S/ {(calcularSubtotal() / 1.18).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>IGV (18%)</span>
                <span>S/ {calcularIGV().toFixed(2)}</span>
              </div>
              {formData.tipoEntrega === 'ENVIO' && calcularCostoEnvio() > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Costo de envío</span>
                  <span>S/ {calcularCostoEnvio().toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span>Tiempo de entrega</span>
                <span>{((tienda as any)?.diseno?.tiempoEntregaMin ?? (tienda as any)?.tiempoPreparacionMin ?? 15)}-
                  {(((tienda as any)?.diseno?.tiempoEntregaMax ?? (((tienda as any)?.diseno?.tiempoEntregaMin ?? (tienda as any)?.tiempoPreparacionMin ?? 15) + 10)))} min
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total</span>
                <span>S/ {calcularTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
