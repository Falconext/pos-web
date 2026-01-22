import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';

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

    const calcularSubtotal = () => {
        return carrito.reduce((sum, item) => sum + Number(item.precioUnitario) * Number(item.cantidad || 1), 0);
    };

    return (
        <div className="fixed inset-0 z-[999999] flex justify-end">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col transform transition-transform duration-300 animate-in slide-in-from-right">
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between bg-white">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900">TU BOLSA ({carrito.length})</h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <Icon icon="mdi:close" className="w-5 h-5 text-gray-600" />
                    </button>
                </div>

                {/* Products List */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {carrito.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                            <Icon icon="solar:bag-linear" className="w-20 h-20 text-gray-300" />
                            <p className="text-gray-500 text-sm">Tu carrito está vacío</p>
                            <button
                                onClick={onClose}
                                className="text-[#045659] underline text-sm font-semibold hover:text-[#034548] transition-colors"
                            >
                                Continuar comprando
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {carrito.map((item) => (
                                <div key={item.id} className="flex gap-4 pb-4 border-b border-gray-100 last:border-b-0">
                                    {/* Product Image */}
                                    <div className="relative w-20 h-20 bg-gray-50 rounded-lg flex-shrink-0 overflow-hidden border border-gray-100">
                                        <button
                                            onClick={() => {
                                                if (setCarrito) {
                                                    setCarrito(carrito.filter((i) => i.id !== item.id));
                                                } else {
                                                    actualizarCantidad(item.id, 0);
                                                }
                                            }}
                                            className="absolute -top-2 -left-2 bg-white rounded-full p-0.5 shadow-md border border-gray-200 hover:bg-red-50 hover:border-red-200 text-gray-500 hover:text-red-600 z-10 transition-all"
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
                                            <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight mb-0.5">
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
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => actualizarCantidad(item.id!, (item.cantidad || 1) - 1)}
                                                    className="w-7 h-7 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors text-gray-600 hover:text-gray-900"
                                                >
                                                    <Icon icon="mdi:minus" width={14} />
                                                </button>
                                                <span className="text-xs w-6 text-center font-semibold text-gray-900">{item.cantidad || 1}</span>
                                                <button
                                                    onClick={() => actualizarCantidad(item.id!, (item.cantidad || 1) + 1)}
                                                    className="w-7 h-7 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors text-gray-600 hover:text-gray-900"
                                                >
                                                    <Icon icon="mdi:plus" width={14} />
                                                </button>
                                            </div>
                                            <div className="text-sm font-bold text-[#045659]">
                                                S/ {(Number(item.precioUnitario) * (item.cantidad || 1)).toFixed(2)}
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
                    <div className="p-6 border-t border-gray-100 bg-gray-50">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-gray-600 font-medium">Subtotal</span>
                            <span className="font-bold text-xl text-gray-900">S/ {calcularSubtotal().toFixed(2)}</span>
                        </div>
                        <button
                            onClick={onCheckout}
                            className="w-full bg-[#FF9903] text-white py-4 font-bold uppercase tracking-widest text-sm hover:bg-gray-900 transition-all shadow-lg hover:shadow-xl rounded-xl flex items-center justify-center gap-2 group"
                        >
                            <span>Ir a Pagar</span>
                            <Icon icon="solar:arrow-right-linear" className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <p className="text-center text-xs text-gray-500 mt-3">
                            Impuestos y envío calculados al finalizar
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
