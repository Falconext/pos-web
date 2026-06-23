import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';

interface ModaCartModalProps {
    isOpen: boolean;
    onClose: () => void;
    carrito: any[];
    tienda: any;
    actualizarCantidad: (id: number | string, cantidad: number) => void;
    onCheckout: () => void;
    slug?: string;
    setCarrito?: (carrito: any[]) => void;
}

export default function ModaCartModal({
    isOpen,
    onClose,
    carrito,
    actualizarCantidad,
    onCheckout,
    setCarrito
}: ModaCartModalProps) {
    if (!isOpen) return null;

    const calcularSubtotal = () => {
        return carrito.reduce((sum, item) => sum + Number(item.precioUnitario) * Number(item.cantidad || 1), 0);
    };

    return (
        <div className="fixed inset-0 z-[999999] flex justify-end" style={{ fontFamily: '"Inter", sans-serif' }}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div className="relative w-full max-w-[400px] bg-[#FAF9F6] h-full shadow-2xl flex flex-col transform transition-transform duration-300 animate-in slide-in-from-right">
                
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-200/60 flex items-center justify-between bg-white">
                    <h2 className="text-lg font-bold text-gray-900 tracking-tight">Tu bolsa <span className="text-gray-400 font-normal text-sm ml-1">({carrito.length})</span></h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-200 transition-colors"
                    >
                        <Icon icon="solar:close-circle-bold" className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                    </button>
                </div>

                {/* Products List */}
                <div className="flex-1 overflow-y-auto px-6 py-6">
                    {carrito.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-70">
                            <Icon icon="solar:bag-3-linear" className="w-16 h-16 text-gray-300 mb-2" />
                            <h3 className="text-lg font-semibold text-gray-900">Tu bolsa está vacía</h3>
                            <p className="text-sm text-gray-500 max-w-[200px]">Parece que aún no has añadido nada a tu bolsa de compras.</p>
                            <button
                                onClick={onClose}
                                className="mt-4 px-6 py-2.5 bg-white border border-gray-200 rounded-full text-sm font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
                            >
                                Seguir comprando
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {carrito.map((item) => (
                                <div key={item.id} className="flex gap-4 group">
                                    {/* Product Image */}
                                    <div className="relative w-[90px] h-[100px] bg-white rounded-lg flex-shrink-0 overflow-hidden border border-gray-100 p-2 shadow-sm">
                                        {item.imagenUrl ? (
                                            <img src={item.imagenUrl} className="w-full h-full object-contain" alt={item.descripcion} />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Icon icon="solar:box-linear" className="text-gray-300 w-8 h-8" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Product Info */}
                                    <div className="flex-1 flex flex-col min-w-0 py-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug pr-4">
                                                {item.descripcion}
                                            </h3>
                                            <button
                                                onClick={() => {
                                                    if (setCarrito) {
                                                        setCarrito(carrito.filter((i) => i.id !== item.id));
                                                    } else {
                                                        actualizarCantidad(item.id, 0);
                                                    }
                                                }}
                                                className="text-gray-300 hover:text-red-500 transition-colors mt-0.5"
                                            >
                                                <Icon icon="solar:trash-bin-trash-bold" width={16} />
                                            </button>
                                        </div>

                                        <p className="text-sm font-bold text-gray-600 mb-auto">
                                            S/ {Number(item.precioUnitario).toFixed(2)}
                                        </p>

                                        {/* Modifiers (Talla/Color) */}
                                        {item.modificadores && item.modificadores.length > 0 && item.modificadores[0]?.opcionNombre && (
                                            <p className="text-xs text-gray-400 mb-3 uppercase tracking-wider">
                                                {item.modificadores.filter((m: any) => m && m.opcionNombre).map((m: any) => m.opcionNombre).join(' / ')}
                                            </p>
                                        )}

                                        {/* Quantity Controls */}
                                        <div className="flex items-center justify-between mt-3">
                                            <div className="flex items-center gap-3 border border-gray-200 rounded-full px-3 py-1 bg-white">
                                                <button
                                                    onClick={() => actualizarCantidad(item.id!, Math.max(1, (item.cantidad || 1) - 1))}
                                                    className="text-gray-400 hover:text-gray-900 transition-colors"
                                                >
                                                    <Icon icon="mdi:minus" width={14} />
                                                </button>
                                                <span className="text-xs w-4 text-center font-bold text-gray-900">{item.cantidad || 1}</span>
                                                <button
                                                    onClick={() => actualizarCantidad(item.id!, (item.cantidad || 1) + 1)}
                                                    className="text-gray-400 hover:text-gray-900 transition-colors"
                                                >
                                                    <Icon icon="mdi:plus" width={14} />
                                                </button>
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
                    <div className="p-6 bg-white border-t border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                            <span className="text-gray-500 text-sm">Subtotal</span>
                            <span className="font-bold text-2xl text-gray-900 tracking-tight">S/ {calcularSubtotal().toFixed(2)}</span>
                        </div>
                        <button
                            onClick={onCheckout}
                            className="w-full bg-[#1A1A1A] text-white py-4 font-bold text-sm hover:bg-black transition-colors rounded-full flex items-center justify-center gap-2 group"
                        >
                            <span>Ir a pagar</span>
                            <Icon icon="solar:arrow-right-linear" className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <p className="text-center text-[11px] text-gray-400 mt-4 uppercase tracking-wider">
                            Impuestos y envíos calculados al finalizar
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
