import { type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import AutopartesHeader from '@/components/tienda/AutopartesHeader';
import Footer from '@/components/tienda/Footer';

type MedioPago = 'YAPE' | 'PLIN' | 'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA';

interface Props {
  slug: string;
  tienda: any;
  carrito: any[];
  formData: any;
  erroresForm: Record<string, string>;
  configPago: any;
  configEnvio: any;
  enviando: boolean;
  suggestedProducts: any[];
  search: string;
  searchResults: any[];
  setSearch: (v: string) => void;
  handleChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  updateQuantity: (id: any, qty: number) => void;
  removeItem: (id: any) => void;
  calcularSubtotal: () => number;
  calcularCostoEnvio: () => number;
  calcularTotal: () => number;
  onSubmit: () => void;
  onAddToCart: (producto: any) => void;
  freeDeliveryThreshold: number;
  freeDeliveryRemaining: number;
  freeDeliveryProgress: number;
}

const PAYMENT_META: Record<MedioPago, { label: string; icon: string }> = {
  YAPE: { label: 'Yape', icon: 'solar:smartphone-bold' },
  PLIN: { label: 'Plin', icon: 'solar:wallet-money-bold' },
  EFECTIVO: { label: 'Efectivo', icon: 'solar:banknote-2-bold' },
  TRANSFERENCIA: { label: 'Transferencia', icon: 'solar:card-transfer-bold' },
  TARJETA: { label: 'Tarjeta', icon: 'solar:card-2-bold' },
};

export default function AutopartesCheckout({
  slug, tienda, carrito, formData, erroresForm, configPago, configEnvio,
  enviando, search, setSearch, handleChange, updateQuantity, removeItem,
  calcularSubtotal, calcularCostoEnvio, calcularTotal, onSubmit,
}: Props) {
  const navigate = useNavigate();
  const diseno = tienda?.diseno || {};
  const cp = diseno.colorPrimario || '#D92D20';
  const subtotal = calcularSubtotal();
  const envio = calcularCostoEnvio();
  const total = calcularTotal();

  const inputClass = (field: string) =>
    `w-full bg-[#1A1A1A] text-white rounded-md px-4 py-3 text-sm border border-gray-800 focus:outline-none focus:border-[${cp}] transition-colors ${
      erroresForm[field]
        ? 'border-red-500'
        : 'border-gray-800 focus:border-opacity-40'
    }`;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) navigate(`/tienda/${slug}/catalogo?q=${encodeURIComponent(search.trim())}`);
  };

  return (
    <div className="min-h-screen bg-[#0B1120]" style={{ fontFamily: `'${diseno.tipografia || 'Inter'}', sans-serif` }}>
      
      <AutopartesHeader 
        tienda={tienda}
        slug={slug}
        cp={cp}
        carritoSize={carrito.length}
        onOpenCart={() => {}} // Disabled in checkout
        searchQuery={search}
        setSearchQuery={setSearch}
        onSearchSubmit={handleSearchSubmit}
        allCategories={[]}
      />

      <div className="container mx-auto px-4 xl:px-8 pt-10 pb-20">
        
        {/* Page Title */}
        <div className="mb-8 border-b border-gray-800 pb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-white uppercase tracking-wider">Checkout</h1>
            <p className="text-gray-400 text-sm mt-1">Complete your automotive parts order</p>
          </div>
          <button
            onClick={() => navigate(`/tienda/${slug}`)}
            className="flex items-center gap-1.5 text-sm font-bold text-gray-400 hover:text-white transition-colors"
          >
            <Icon icon="solar:arrow-left-linear" width={16} />
            Back to Store
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* ── LEFT: FORM ── */}
          <div className="flex-1 w-full space-y-6">
            
            {/* Customer info */}
            <div className="bg-black rounded-xl border border-gray-800 p-6">
              <h2 className="text-lg font-black text-white uppercase tracking-wide mb-6 border-l-4 pl-3" style={{ borderColor: cp }}>
                Contact Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Full Name *</label>
                  <input type="text" name="clienteNombre" placeholder="Enter your name" value={formData.clienteNombre} onChange={handleChange} className={inputClass('clienteNombre')} />
                  {erroresForm.clienteNombre && <p className="text-red-500 text-xs mt-1">{erroresForm.clienteNombre}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Phone Number *</label>
                  <input type="tel" name="clienteTelefono" placeholder="Enter phone" value={formData.clienteTelefono} onChange={handleChange} className={inputClass('clienteTelefono')} />
                  {erroresForm.clienteTelefono && <p className="text-red-500 text-xs mt-1">{erroresForm.clienteTelefono}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Email Address (Optional)</label>
                  <input type="email" name="clienteEmail" placeholder="you@example.com" value={formData.clienteEmail} onChange={handleChange} className={inputClass('clienteEmail')} />
                  {erroresForm.clienteEmail && <p className="text-red-500 text-xs mt-1">{erroresForm.clienteEmail}</p>}
                </div>
              </div>
            </div>

            {/* Delivery type */}
            {configEnvio && (configEnvio.aceptaEnvio || configEnvio.aceptaRecojo) && (
              <div className="bg-black rounded-xl border border-gray-800 p-6">
                <h2 className="text-lg font-black text-white uppercase tracking-wide mb-6 border-l-4 pl-3" style={{ borderColor: cp }}>
                  Delivery Method
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {configEnvio.aceptaEnvio && (
                    <label className={`flex flex-col items-center justify-center gap-2 p-4 rounded-md cursor-pointer border-2 transition-all ${formData.tipoEntrega === 'ENVIO' ? 'bg-[#1A1A1A] border-red-500' : 'border-gray-800 bg-transparent hover:border-gray-600'}`} style={formData.tipoEntrega === 'ENVIO' ? { borderColor: cp } : {}}>
                      <input type="radio" className="hidden" name="tipoEntrega" value="ENVIO" checked={formData.tipoEntrega === 'ENVIO'} onChange={handleChange} />
                      <Icon icon="solar:delivery-bold" width={28} className={formData.tipoEntrega === 'ENVIO' ? 'text-white' : 'text-gray-500'} />
                      <span className={`font-bold ${formData.tipoEntrega === 'ENVIO' ? 'text-white' : 'text-gray-400'}`}>Delivery</span>
                      {configEnvio.costoEnvio > 0 && (
                        <span className="text-xs text-gray-500">S/ {Number(configEnvio.costoEnvio).toFixed(2)}</span>
                      )}
                    </label>
                  )}
                  {configEnvio.aceptaRecojo && (
                    <label className={`flex flex-col items-center justify-center gap-2 p-4 rounded-md cursor-pointer border-2 transition-all ${formData.tipoEntrega === 'RECOJO' ? 'bg-[#1A1A1A]' : 'border-gray-800 bg-transparent hover:border-gray-600'}`} style={formData.tipoEntrega === 'RECOJO' ? { borderColor: cp } : {}}>
                      <input type="radio" className="hidden" name="tipoEntrega" value="RECOJO" checked={formData.tipoEntrega === 'RECOJO'} onChange={handleChange} />
                      <Icon icon="solar:shop-bold" width={28} className={formData.tipoEntrega === 'RECOJO' ? 'text-white' : 'text-gray-500'} />
                      <span className={`font-bold ${formData.tipoEntrega === 'RECOJO' ? 'text-white' : 'text-gray-400'}`}>Store Pickup</span>
                    </label>
                  )}
                </div>

                {formData.tipoEntrega === 'ENVIO' && (
                  <div className="mt-6 space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Delivery Address *</label>
                      <input type="text" name="clienteDireccion" placeholder="Street name, number, etc." value={formData.clienteDireccion} onChange={handleChange} className={inputClass('clienteDireccion')} />
                      {erroresForm.clienteDireccion && <p className="text-red-500 text-xs mt-1">{erroresForm.clienteDireccion}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Reference (Optional)</label>
                      <input type="text" name="clienteReferencia" placeholder="Near the gas station..." value={formData.clienteReferencia} onChange={handleChange} className={inputClass('clienteReferencia')} />
                    </div>
                  </div>
                )}

                {formData.tipoEntrega === 'RECOJO' && configEnvio.direccionRecojo && (
                   <div className="mt-6 flex items-center gap-3 bg-[#1A1A1A] p-4 rounded-md border border-gray-800">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-black border border-gray-700 text-white">
                        <Icon icon="solar:map-point-bold" width={20} />
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 block uppercase font-bold">Pickup Location</span>
                        <span className="text-sm text-gray-300 font-medium">{configEnvio.direccionRecojo}</span>
                      </div>
                   </div>
                )}
              </div>
            )}

            {/* Payment method */}
            <div className="bg-black rounded-xl border border-gray-800 p-6">
               <h2 className="text-lg font-black text-white uppercase tracking-wide mb-6 border-l-4 pl-3" style={{ borderColor: cp }}>
                Payment Method
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {(['YAPE', 'PLIN', 'EFECTIVO', 'TARJETA'] as MedioPago[]).map(method => {
                  const meta = PAYMENT_META[method];
                  const show =
                    method === 'EFECTIVO' ? Boolean(configPago?.aceptaEfectivo)
                    : method === 'TARJETA' ? Boolean(configPago?.aceptaTarjeta && configPago?.culqiPublicKey)
                    : true;
                  if (!show) return null;
                  const active = formData.medioPago === method;
                  return (
                    <label key={method}
                      className={`flex flex-col items-center justify-center gap-2 p-3 rounded-md cursor-pointer border-2 transition-all ${active ? 'bg-[#1A1A1A]' : 'border-gray-800 bg-transparent hover:border-gray-600'}`}
                      style={active ? { borderColor: cp } : {}}>
                      <input type="radio" className="hidden" name="medioPago" value={method} checked={active} onChange={handleChange} />
                      <Icon icon={meta.icon} width={24} className={active ? 'text-white' : 'text-gray-500'} />
                      <span className={`text-sm font-bold ${active ? 'text-white' : 'text-gray-500'}`}>{meta.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div className="bg-black rounded-xl border border-gray-800 p-6">
              <h2 className="text-lg font-black text-white uppercase tracking-wide mb-6 border-l-4 pl-3" style={{ borderColor: cp }}>
                Order Notes
              </h2>
              <textarea
                name="observaciones"
                placeholder="Mechanic instructions, special packaging..."
                value={formData.observaciones}
                onChange={handleChange}
                rows={3}
                className="w-full bg-[#1A1A1A] text-white rounded-md px-4 py-3 text-sm border border-gray-800 focus:outline-none focus:border-red-500 transition-colors resize-none"
              />
            </div>
          </div>

          {/* ── RIGHT: Order Summary ── */}
          <div className="w-full lg:w-[400px] lg:flex-shrink-0 lg:sticky lg:top-8">
            <div className="bg-black rounded-xl border border-gray-800 overflow-hidden">
              <div className="p-6 border-b border-gray-800 bg-[#1A1A1A]">
                <h2 className="text-lg font-black text-white uppercase tracking-wide">
                  Order Summary
                </h2>
              </div>

              {/* Items List */}
              <div className="p-6 space-y-4 max-h-[40vh] overflow-y-auto no-scrollbar border-b border-gray-800">
                 {carrito.map(item => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-16 h-16 rounded-md bg-white overflow-hidden flex-shrink-0 border border-gray-200 p-1 relative">
                      {item.imagenUrl ? (
                        <img src={item.imagenUrl} className="w-full h-full object-contain" alt="" />
                      ) : (
                        <Icon icon="solar:box-linear" className="text-gray-300 w-full h-full p-2" />
                      )}
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-gray-900 rounded-full flex items-center justify-center text-[9px] font-bold text-white border border-gray-700">
                        {item.cantidad}
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <p className="text-sm font-bold text-gray-300 line-clamp-2 leading-tight">{item.descripcion}</p>
                      {item.partNumber && <p className="text-[10px] text-gray-500 font-mono mt-0.5">PN: {item.partNumber}</p>}
                    </div>
                    <div className="text-right flex-shrink-0 flex flex-col justify-center">
                      <p className="font-black text-white">S/ {(Number(item.precioUnitario) * item.cantidad).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="p-6 space-y-4">
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Subtotal</span>
                  <span className="font-bold text-white">S/ {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Shipping</span>
                  <span className="font-bold text-white">
                    {envio === 0 ? 'Free' : `S/ ${envio.toFixed(2)}`}
                  </span>
                </div>

                <div className="border-t border-gray-800 pt-4 flex justify-between items-center">
                  <span className="text-lg font-black text-white uppercase tracking-wider">Total</span>
                  <span className="text-3xl font-black" style={{ color: cp }}>S/ {total.toFixed(2)}</span>
                </div>

                {erroresForm._minimo && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-md p-3 flex items-start gap-2 mt-4">
                     <Icon icon="mdi:alert" className="text-red-500 mt-0.5" />
                     <p className="text-xs text-red-400 font-medium">{erroresForm._minimo}</p>
                  </div>
                )}

                <button
                  onClick={onSubmit}
                  disabled={enviando || carrito.length === 0}
                  className="w-full py-4 mt-6 rounded-md font-black text-white flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 uppercase tracking-widest text-sm"
                  style={{ backgroundColor: cp }}
                >
                  {enviando ? (
                    <>Processing <Icon icon="solar:refresh-bold" className="animate-spin" width={18} /></>
                  ) : (
                    <>Place Order <Icon icon="solar:arrow-right-line-duotone" width={20} /></>
                  )}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      <Footer tienda={tienda} diseno={diseno} slug={slug} />
    </div>
  );
}
