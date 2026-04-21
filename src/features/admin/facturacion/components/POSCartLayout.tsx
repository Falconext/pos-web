import { Icon } from "@iconify/react";

export const POSCartLayout = ({ vm }: { vm: any }) => {
    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
            {vm.productsInvoice.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                    <Icon icon="solar:cart-large-minimalistic-linear" className="text-6xl mb-4" />
                    <p className="font-medium">El carrito está vacío</p>
                    <p className="text-sm">Agrega productos del catálogo</p>
                </div>
            ) : (
                vm.productsInvoice.map((item: any, index: number) => (
                    <div key={index} className="flex flex-col md:flex-row items-stretch md:items-center gap-3 bg-white p-3 md:p-2 rounded-xl border border-dashed border-gray-200 hover:border-gray-900/30 transition-colors group relative">
                        {/* Top Section: Image & Description */}
                        <div className="flex items-start md:items-center gap-3 w-full md:w-auto md:flex-1">
                            <div className="w-16 h-16 md:w-12 md:h-12 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                {item.imagenUrl ? <img src={item.imagenUrl} className="w-full h-full object-contain rounded-lg" /> : <Icon icon="solar:box-linear" className="text-gray-400" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h5 className="font-bold text-gray-800 text-sm md:text-sm line-clamp-2 md:line-clamp-1 leading-tight md:leading-normal mb-1 md:mb-0">{item.descripcion}</h5>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-medium">PU: S/{Number(item.precioUnitario).toFixed(2)}</span>
                                    {Number(item.descuento) > 0 && <span className="text-green-600 font-bold">-{item.descuento}%</span>}
                                </div>
                            </div>
                            {/* Mobile Only Delete Button */}
                            <button onClick={() => vm.handleDeleteProduct(item)} className="md:hidden text-gray-400 hover:text-red-500 p-1 -mt-1 -mr-1">
                                <Icon icon="solar:trash-bin-trash-linear" width={20} />
                            </button>
                        </div>

                        {/* Bottom Section: Controls & Total */}
                        <div className="flex items-center justify-between gap-3 w-full md:w-auto">
                            {/* Qty Controls */}
                            <div className="flex items-center bg-gray-100 rounded-lg p-1">
                                <button
                                    onClick={() => {
                                        if (item.cantidad > 1) {
                                            vm.updateProductInvoice(index, vm.calculateLineItem(item, Number(item.cantidad) - 1));
                                        } else {
                                            vm.handleDeleteProduct(item)
                                        }
                                    }}
                                    className="w-8 h-8 md:w-6 md:h-6 flex items-center justify-center bg-white rounded shadow-sm text-gray-600 hover:text-gray-900 active:scale-95 transition-transform"
                                >
                                    <Icon icon="solar:minus-circle-linear" width={18} />
                                </button>
                                <span className="w-10 md:w-8 text-center font-bold text-sm">{item.cantidad}</span>
                                <button
                                    onClick={() => {
                                        const newQty = Number(item.cantidad) + 1;
                                        if (item.stock !== undefined && item.stock < newQty) {
                                            return;
                                        }
                                        vm.updateProductInvoice(index, vm.calculateLineItem(item, newQty));
                                    }}
                                    className="w-8 h-8 md:w-6 md:h-6 flex items-center justify-center bg-white rounded shadow-sm text-gray-600 hover:text-gray-900 active:scale-95 transition-transform"
                                >
                                    <Icon icon="solar:add-circle-linear" width={18} />
                                </button>
                            </div>

                            {/* Price & Actions Wrapper */}
                            <div className="flex items-center gap-3">
                                <div className="text-right min-w-[70px]">
                                    <p className="font-extrabold text-gray-900 text-base md:text-sm">S/ {Number(item.total).toFixed(2)}</p>
                                </div>

                                {/* Desktop Actions */}
                                <div className="flex items-center">
                                    <button onClick={() => vm.setEditingIndex(index)} className="text-gray-900/50 hover:text-gray-900 p-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                        <Icon icon="solar:pen-new-square-linear" width={20} />
                                    </button>
                                    <button onClick={() => vm.handleDeleteProduct(item)} className="hidden md:block text-red-400 hover:text-red-600 p-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                        <Icon icon="hugeicons:delete-02" width={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};
