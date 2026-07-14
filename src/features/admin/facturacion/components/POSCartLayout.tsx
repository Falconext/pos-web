import { Icon } from "@iconify/react";
import { useState } from "react";

const QtyInput = ({ item, index, vm }: { item: any; index: number; vm: any }) => {
    const [localValue, setLocalValue] = useState<string>(String(item.cantidad));
    const esServicio = String(item?.atributosTecnicos?.tipoProducto || '').toUpperCase() === 'SERVICIO';

    const commit = (raw: string) => {
        const parsed = parseFloat(raw);
        if (!Number.isFinite(parsed) || parsed <= 0) {
            setLocalValue(String(item.cantidad));
            return;
        }
        if (!esServicio && item.stock !== undefined && item.stock < parsed) {
            setLocalValue(String(item.cantidad));
            return;
        }
        const rounded = Math.round(parsed * 1000) / 1000;
        setLocalValue(String(rounded));
        vm.updateProductInvoice(index, vm.calculateLineItem(item, rounded));
    };

    // Keep local value in sync when external updates happen (e.g. +/- buttons)
    if (String(item.cantidad) !== localValue && document.activeElement?.getAttribute('data-qty-index') !== String(index)) {
        setLocalValue(String(item.cantidad));
    }

    return (
        // Input de texto en modo decimal: sin flechas/spinner que puedan bajar
        // 0.5 -> 0.499 por accidente (stepping). Acepta solo dígitos y un punto.
        <input
            type="text"
            inputMode="decimal"
            data-qty-index={index}
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'))}
            onBlur={(e) => commit(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
            }}
            className="w-14 md:w-12 text-center font-bold text-sm dark:text-white bg-transparent border-0 outline-none focus:bg-white dark:focus:bg-slate-600 focus:rounded focus:ring-1 focus:ring-violet-400 px-1 py-0.5 transition-all"
        />
    );
};

export const POSCartLayout = ({ vm }: { vm: any }) => {
    const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});
    const requiereSerie = (item: any) => {
        const attrs = item?.atributosTecnicos || {};
        const control = String(attrs.controlSeries ?? attrs.requiereSerie ?? '').toLowerCase();
        return attrs.controlSeries === true || attrs.requiereSerie === true || ['true', 'si', 'sí', '1'].includes(control);
    };
    const esServicio = (item: any) => String(item?.atributosTecnicos?.tipoProducto || '').toUpperCase() === 'SERVICIO';

    // Devuelve los atajos de fracción según la unidad de medida del producto.
    // `unidadMedida` puede venir como string ("KILOGRAMO") u objeto ({codigo,nombre}).
    // Retorna null para unidades que se venden en enteros (unidad, gramo, ml, etc.).
    const getUnidadAtajos = (item: any): { sufijo: string; opciones: { v: number; l: string }[] } | null => {
        const um = item?.unidadMedida;
        const raw = um && typeof um === 'object' ? (um.codigo ?? um.nombre) : um;
        const u = String(
            raw ?? item?.unidadMedidaNombre ?? item?.unidadMedidaCodigo ?? item?.unidad ?? ''
        ).toUpperCase();

        if (u.includes('KGM') || u.includes('KILO') || u === 'KG') {
            return { sufijo: 'kg', opciones: [{ v: 0.25, l: '¼' }, { v: 0.5, l: '½' }, { v: 0.75, l: '¾' }, { v: 1, l: '1' }] };
        }
        if (u.includes('MTR') || u.includes('METRO') || u === 'M') {
            return { sufijo: 'm', opciones: [{ v: 0.5, l: '0.5' }, { v: 1, l: '1' }, { v: 2, l: '2' }, { v: 5, l: '5' }] };
        }
        if (u.includes('LTR') || u.includes('LITRO') || u === 'L') {
            return { sufijo: 'L', opciones: [{ v: 0.25, l: '¼' }, { v: 0.5, l: '½' }, { v: 1, l: '1' }, { v: 2, l: '2' }] };
        }
        return null;
    };

    // Fija la cantidad exacta (venta fraccionada), validando stock.
    const setQty = (item: any, index: number, value: number) => {
        const v = Math.round(value * 1000) / 1000;
        if (v <= 0) return;
        if (!esServicio(item) && item.stock !== undefined && Number(item.stock) < v) return;
        vm.updateProductInvoice(index, vm.calculateLineItem(item, v));
    };

    return (
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 scrollbar-thin">
            {vm.productsInvoice.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                    <Icon icon="solar:cart-large-minimalistic-linear" className="text-6xl mb-4" />
                    <p className="font-medium">El carrito está vacío</p>
                    <p className="text-sm">Agrega productos del catálogo</p>
                </div>
            ) : (
                vm.productsInvoice.map((item: any, index: number) => (
                    <div key={index} className="flex flex-col md:flex-row items-stretch md:items-center gap-3 bg-white dark:bg-[#1E2435] p-3 md:p-2 rounded-xl border border-dashed border-gray-200 dark:border-slate-800 hover:border-gray-900/30 dark:hover:border-slate-600 transition-colors group relative">
                        {/* Top Section: Image & Description */}
                        <div className="flex items-start md:items-center gap-3 w-full md:w-auto md:flex-1">
                            <div className="w-16 h-16 md:w-12 md:h-12 bg-gray-50 dark:bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0">
                                {item.imagenUrl && !brokenImages[`${item.productoId}-${index}`] ? (
                                    <img
                                        src={item.imagenUrl}
                                        alt={item.descripcion || "Producto"}
                                        className="w-full h-full object-contain rounded-lg"
                                        loading="lazy"
                                        onError={() => setBrokenImages((prev) => ({ ...prev, [`${item.productoId}-${index}`]: true }))}
                                    />
                                ) : (
                                    <Icon icon="solar:box-linear" className="text-gray-400 dark:text-gray-500" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h5 className="font-bold text-gray-800 dark:text-gray-200 text-sm md:text-sm line-clamp-2 md:line-clamp-1 leading-tight md:leading-normal mb-0.5">{item.descripcion}</h5>
                                <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                                    {Number(item.descuento) > 0 && (
                                        <span className="text-green-600 dark:text-green-400 font-bold">-{item.descuento}%</span>
                                    )}
                                    {/* Farmacia: lote asignado */}
                                    {item.loteNumero && (
                                        <span className="text-slate-500 dark:text-slate-400">Lote: {item.loteNumero}</span>
                                    )}
                                    {/* Farmacia: cadena de frío */}
                                    {vm.usaLotesFarmacia && item.refrigerado && (
                                        <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 px-1.5 py-0.5 rounded-full font-semibold text-[10px]">🧊 Frío</span>
                                    )}
                                    {/* Farmacia/droguería: receta pendiente */}
                                    {vm.habilitaRecetaMedica && item.pendienteReceta && (
                                        <button
                                            onClick={() => vm.handleAbrirRecetaModal(index)}
                                            className="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 px-1.5 py-0.5 rounded-full font-semibold text-[10px] hover:bg-red-200 transition-colors"
                                        >
                                            📋 Receta
                                        </button>
                                    )}
                                    {/* Farmacia/droguería: receta confirmada */}
                                    {vm.habilitaRecetaMedica && item.datosReceta && !item.pendienteReceta && (
                                        <span className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 px-1.5 py-0.5 rounded-full font-semibold text-[10px]">✅ Receta OK</span>
                                    )}
                                    {requiereSerie(item) && (
                                        <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 px-1.5 py-0.5 rounded-full font-semibold text-[10px]">Serie obligatoria</span>
                                    )}
                                    {esServicio(item) && (
                                        <span className="bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 px-1.5 py-0.5 rounded-full font-semibold text-[10px]">Servicio</span>
                                    )}
                                    {item.esItemLibre && (
                                        <span className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 px-1.5 py-0.5 rounded-full font-semibold text-[10px]">Ítem libre</span>
                                    )}
                                    {getUnidadAtajos(item) && (
                                        <span className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 px-1.5 py-0.5 rounded-full font-semibold text-[10px]">⚖️ Por {getUnidadAtajos(item)!.sufijo}</span>
                                    )}
                                </div>
                                {/* Venta fraccionada: atajos según la unidad (kg / m / L) */}
                                {(() => {
                                    const cfg = getUnidadAtajos(item);
                                    if (!cfg) return null;
                                    return (
                                        <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                                            {cfg.opciones.map((op) => (
                                                <button
                                                    key={op.v}
                                                    onClick={() => setQty(item, index, op.v)}
                                                    className="px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 text-[11px] font-bold hover:bg-amber-100 dark:hover:bg-amber-900/30 active:scale-95 transition-all"
                                                >
                                                    {op.l} {cfg.sufijo}
                                                </button>
                                            ))}
                                            <span className="text-[10px] text-gray-400 ml-0.5">o escribe la cantidad exacta →</span>
                                        </div>
                                    );
                                })()}
                                {requiereSerie(item) && (
                                    <textarea
                                        value={item.numerosSerie || ''}
                                        onChange={(e) => vm.updateProductInvoice(index, { numerosSerie: e.target.value })}
                                        placeholder={`Series (${Number(item.cantidad || 0)}): una por línea o separadas por coma`}
                                        className="mt-2 w-full min-h-[42px] rounded-lg border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/10 dark:border-emerald-900/50 px-3 py-2 text-xs font-semibold text-gray-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-300"
                                    />
                                )}
                            </div>
                            {/* Mobile Only Delete Button */}
                            <button onClick={() => vm.handleDeleteProduct(item)} className="md:hidden text-gray-400 dark:text-gray-500 hover:text-red-500 p-1 -mt-1 -mr-1">
                                <Icon icon="solar:trash-bin-trash-linear" width={20} />
                            </button>
                        </div>

                        {/* Bottom Section: Controls & Total */}
                        <div className="flex items-center justify-between gap-3 w-full md:w-auto">
                            {/* Qty Controls */}
                            <div className="flex items-center bg-gray-100 dark:bg-slate-800 rounded-lg p-1">
                                <button
                                    onClick={() => {
                                        const cur = Number(item.cantidad);
                                        const next = Math.round((cur - 1) * 1000) / 1000;
                                        if (next <= 0) {
                                            vm.handleDeleteProduct(item);
                                        } else {
                                            vm.updateProductInvoice(index, vm.calculateLineItem(item, next));
                                        }
                                    }}
                                    className="w-8 h-8 md:w-6 md:h-6 flex items-center justify-center bg-white dark:bg-slate-700 rounded shadow-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white active:scale-95 transition-transform"
                                >
                                    <Icon icon="solar:minus-circle-linear" width={18} />
                                </button>
                                <QtyInput item={item} index={index} vm={vm} />
                                <button
                                    onClick={() => {
                                        const newQty = Math.round((Number(item.cantidad) + 1) * 1000) / 1000;
                                        if (!esServicio(item) && item.stock !== undefined && item.stock < newQty) return;
                                        vm.updateProductInvoice(index, vm.calculateLineItem(item, newQty));
                                    }}
                                    className="w-8 h-8 md:w-6 md:h-6 flex items-center justify-center bg-white dark:bg-slate-700 rounded shadow-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white active:scale-95 transition-transform"
                                >
                                    <Icon icon="solar:add-circle-linear" width={18} />
                                </button>
                            </div>

                            {/* Price & Actions Wrapper */}
                            <div className="flex items-center gap-3">
                                <div className="text-right min-w-[70px]">
                                    <p className="font-extrabold text-gray-900 dark:text-white text-base md:text-sm">{vm.monedaSimbolo} {Number(item.total).toFixed(2)}</p>
                                    {item.monedaOriginal === 'USD' && Number(item.tipoCambio) > 1 && (
                                        <p className="text-[10px] font-medium text-blue-500 dark:text-blue-400 leading-tight">
                                            ${Number(item.precioOriginalUSD).toFixed(2)} × {Number(item.tipoCambio).toFixed(3)}
                                        </p>
                                    )}
                                </div>

                                {/* Desktop Actions */}
                                <div className="flex items-center">
                                    <button onClick={() => vm.setEditingIndex(index)} className="text-gray-900/50 dark:text-white/50 hover:text-gray-900 dark:hover:text-white p-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                        <Icon icon="solar:pen-new-square-linear" width={20} />
                                    </button>
                                    <button onClick={() => vm.handleDeleteProduct(item)} className="hidden md:block text-red-400 dark:text-red-500 hover:text-red-600 p-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
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
