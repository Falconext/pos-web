import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';

import {
    calcularDescuento,
    enlaceDePedido,
    mensajeDePedido,
    soles,
} from '@/utils/reglasDescuento';

interface ShoppingCartModalProps {
    isOpen: boolean;
    onClose: () => void;
    carrito: any[];
    tienda: any;
    actualizarCantidad: (id: number | string, cantidad: number) => void;
    onCheckout: () => void;
    // Prop opcional para override del router si es necesario
    navigateOverride?: (path: string) => void;
    slug?: string;
    setCarrito?: (carrito: any[]) => void;
}

export default function ShoppingCartModal({
    isOpen,
    onClose,
    carrito,
    tienda,
    actualizarCantidad,
    onCheckout,
    slug,
    setCarrito
}: ShoppingCartModalProps) {
    const navigate = useNavigate();

    if (!isOpen) return null;

    // Los tramos llegan con los datos de la tienda: cada empresa tiene los
    // suyos y el cálculo es el mismo que hace la IA en el chat, para que los
    // dos sitios no puedan decir números distintos.
    const calculo = calcularDescuento(
        carrito.map((i) => ({ precioUnitario: i.precioUnitario, cantidad: i.cantidad || 1 })),
        // Envío 0: en la web todavía no se sabe el distrito, y el envío solo
        // SUMA al total. Así el carrito nunca promete un descuento que el chat
        // no vaya a dar; como mucho se queda corto y el cliente se lleva una
        // sorpresa buena. Al revés sería fatal: prometer S/ 20 y cobrar S/ 10.
        0,
        tienda?.reglasDescuento,
    );
    const whatsappTienda: string | undefined = tienda?.whatsappTienda;

    return (
        <div className="fixed inset-0 z-[999999] flex justify-end">
            <div className="absolute inset-0 bg-black/35   transition-opacity" onClick={onClose} />
            <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col transform transition-transform duration-300 animate-in slide-in-from-right border-l border-gray-100">
                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-b from-white to-[#FBFBFB]">
                    <div>
                        <h2 className="text-[11px] font-black uppercase tracking-[0.14em] text-gray-500">Tu bolsa</h2>
                        <p className="text-base font-bold text-[#1A1A1A] mt-0.5">{carrito.length} producto{carrito.length === 1 ? '' : 's'}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 hover:bg-gray-100 rounded-full transition-colors flex items-center justify-center"
                    >
                        <Icon icon="mdi:close" className="w-5 h-5 text-gray-600" />
                    </button>
                </div>

                {/* Products List */}
                <div className="flex-1 overflow-y-auto px-4 py-4">
                    {carrito.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                            <div className="w-20 h-20 rounded-2xl bg-[#FFF3E0] flex items-center justify-center">
                                <Icon icon="solar:bag-linear" className="w-10 h-10 text-[#FF9500]" />
                            </div>
                            <p className="text-gray-500 text-sm">Tu bolsa está vacía</p>
                            <button
                                onClick={onClose}
                                className="text-[#FF9500] underline text-sm font-semibold hover:text-[#E08500] transition-colors"
                            >
                                Continuar comprando
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-2.5">
                            {carrito.map((item) => (
                                <div key={item.id} className="flex gap-3 p-3 rounded-2xl border border-gray-100 bg-white">
                                    {/* Product Image */}
                                    <div className="relative w-[68px] h-[68px] bg-[#FAFBFC] rounded-xl flex-shrink-0 overflow-hidden border border-gray-100">
                                        <button
                                            onClick={() => {
                                                if (setCarrito) {
                                                    setCarrito(carrito.filter((i) => i.id !== item.id));
                                                } else {
                                                    actualizarCantidad(item.id, 0);
                                                }
                                            }}
                                            className="absolute -top-1.5 -left-1.5 bg-white rounded-full p-0.5 shadow-sm border border-gray-200 hover:bg-red-50 hover:border-red-200 text-gray-500 hover:text-red-600 z-10 transition-all"
                                        >
                                            <Icon icon="mdi:close" width={12} />
                                        </button>
                                        {item.imagenUrl ? (
                                            <img src={item.imagenUrl} className="w-full h-full object-contain p-1" alt={item.descripcion} />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Icon icon="mdi:image-off" className="text-gray-300 w-8 h-8" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Product Info */}
                                    <div className="flex-1 flex flex-col justify-between min-w-0">
                                        <div className="mb-2">
                                            <h3 className="text-[13px] font-bold text-[#1A1A1A] line-clamp-2 leading-tight mb-0.5 uppercase">
                                                {item.descripcion}
                                            </h3>
                                            {/* Display modifiers if any */}
                                            {item.modificadores && item.modificadores.length > 0 && !(['ferreteria', 'ventas de materiales de construccion', 'farmacia', 'botica'].some(r => tienda?.rubro?.nombre?.toLowerCase().includes(r))) && (
                                                <p className="text-xs text-gray-500 line-clamp-1">
                                                    + {item.modificadores.length} extras
                                                </p>
                                            )}

                                            {/* For detail view which has different modifier structure */}
                                            {item.modificadores && item.modificadores.length > 0 && item.modificadores[0]?.opcionNombre && (
                                                <p className="text-xs text-gray-500 line-clamp-1">
                                                    {item.modificadores.filter((m: any) => m && m.opcionNombre).map((m: any) => m.opcionNombre).join(', ')}
                                                </p>
                                            )}
                                        </div>

                                        {/* Quantity Controls & Price */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 bg-[#F5F6F8] rounded-lg px-1.5 py-1">
                                                <button
                                                    onClick={() => actualizarCantidad(item.id!, (item.cantidad || 1) - 1)}
                                                    className="w-6 h-6 rounded-md border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 transition-colors text-gray-600 hover:text-gray-900"
                                                >
                                                    <Icon icon="mdi:minus" width={12} />
                                                </button>
                                                <span className="text-xs w-5 text-center font-bold text-gray-900">{item.cantidad || 1}</span>
                                                <button
                                                    onClick={() => actualizarCantidad(item.id!, (item.cantidad || 1) + 1)}
                                                    className="w-6 h-6 rounded-md border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 transition-colors text-gray-600 hover:text-gray-900"
                                                >
                                                    <Icon icon="mdi:plus" width={12} />
                                                </button>
                                            </div>
                                            <div className="text-sm font-black text-[#1A1A1A] flex items-baseline gap-1.5">
                                                S/ {(Number(item.precioUnitario) * (item.cantidad || 1)).toFixed(2)}
                                                {item.enOferta && Number(item.precioRegular) > Number(item.precioUnitario) && (
                                                    <span className="text-[11px] font-medium text-gray-400 line-through">S/ {(Number(item.precioRegular) * (item.cantidad || 1)).toFixed(2)}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {carrito.length > 0 && (
                    <div className="p-4 border-t border-gray-100 bg-white">
                        <div className="rounded-2xl border border-gray-100 bg-[#FAFBFC] p-4 mb-3">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600 font-medium text-sm">Subtotal</span>
                                <span className="font-black text-2xl text-[#1A1A1A] leading-none">{soles(calculo.subtotal)}</span>
                            </div>
                            {calculo.descuento > 0 && (
                                <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
                                    <span className="text-emerald-700 font-medium text-sm">Descuento por pack</span>
                                    <span className="font-bold text-emerald-700">−{soles(calculo.descuento)}</span>
                                </div>
                            )}
                        </div>
                        {/* El empujón al siguiente tramo solo sale cuando el monto
                            YA alcanza: decirle "te falta 1" cuando también le
                            faltan S/ 70 es empujarlo a una compra que no esperaba. */}
                        {calculo.faltaParaSiguiente && (
                            <p className="text-center text-xs text-emerald-700 bg-emerald-50 rounded-lg py-2 mb-3">
                                Con {calculo.faltaParaSiguiente.unidades} producto
                                {calculo.faltaParaSiguiente.unidades > 1 ? 's' : ''} más llegas al
                                descuento de {soles(calculo.faltaParaSiguiente.descuento)}
                            </p>
                        )}
                        <button
                            onClick={onCheckout}
                            className="w-full bg-[#FF9903] text-white py-3 font-bold text-sm hover:bg-[#E08500] transition-all shadow-sm hover:shadow-md rounded-xl flex items-center justify-center gap-2 group"
                        >
                            <span>Ir a Pagar</span>
                            <Icon icon="solar:arrow-right-linear" className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                        {/* Mucha gente prefiere cerrar por chat antes que llenar un
                            formulario. El pedido va escrito para que el asistente
                            lo retome sin que el cliente lo repita. */}
                        {whatsappTienda && (
                            <a
                                href={enlaceDePedido(whatsappTienda, mensajeDePedido(carrito, calculo))}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2 w-full border border-[#25D366] text-[#128C7E] py-3 font-bold text-sm hover:bg-[#25D366]/10 transition-all rounded-xl flex items-center justify-center gap-2"
                            >
                                <Icon icon="ic:baseline-whatsapp" className="w-5 h-5" />
                                <span>Pedir por WhatsApp</span>
                            </a>
                        )}
                        <p className="text-center text-[11px] text-gray-500 mt-2.5">
                            Impuestos y envío calculados al finalizar
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
