import { Icon } from "@iconify/react";
import { useMemo, useRef, useState } from "react";
import Pagination from "@/components/Pagination";
import { BarcodeScannerInput } from "@/components/BarcodeScannerInput";
import apiClient from "@/utils/apiClient";

export const POSCatalogLayout = ({ vm }: { vm: any }) => {
    const [infoProduct, setInfoProduct] = useState<any | null>(null);
    const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});
    const [uploadingId, setUploadingId] = useState<number | null>(null);
    const [uploadedImages, setUploadedImages] = useState<Record<number, string>>({});
    const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

    const handleImageUpload = async (productoId: number, file: File) => {
        setUploadingId(productoId);
        try {
            const form = new FormData();
            form.append('file', file);
            const { data } = await apiClient.post(`/productos/${productoId}/imagen`, form, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const url = data?.data?.imagenUrl ?? data?.imagenUrl;
            if (url) {
                setUploadedImages(prev => ({ ...prev, [productoId]: url }));
                // remove broken flag so new image renders
                setBrokenImages(prev => { const n = { ...prev }; delete n[`PRODUCTO-${productoId}`]; return n; });
            }
        } catch {
            // silently ignore — user can retry
        } finally {
            setUploadingId(null);
        }
    };

    const getProvisionInfo = (item: any) => {
        const stockBase = Number(item?.stockBase ?? item?.stock ?? 0);
        const porcentajeProvision = Number(item?.porcentajeProvision ?? 0);
        const cupoProvision = Math.max(0, Math.floor((stockBase * porcentajeProvision) / 100));
        const reservadoActual = Number(item?.stockReservado ?? 0);
        const cupoVenta = Math.max(0, stockBase - cupoProvision);
        const disponibleVenta = Math.max(0, Math.min(stockBase - reservadoActual, cupoVenta));
        return { cupoProvision, reservadoActual, porcentajeProvision, cupoVenta, disponibleVenta };
    };
    const formatDate = (value: string | Date | null | undefined) => {
        if (!value) return null;
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return null;
        return date.toLocaleDateString("es-PE");
    };
    const lotesInfo = useMemo(() => {
        // El catálogo farmacia retorna lotesDisponibles; el catálogo general retorna lotes
        const raw: any[] = Array.isArray(infoProduct?.lotesDisponibles)
            ? infoProduct.lotesDisponibles
            : Array.isArray(infoProduct?.lotes)
                ? infoProduct.lotes
                : [];
        return raw.map((l: any) => ({
            lote: l?.loteNumero || l?.lote || "-",
            stock: Number(l?.stockActual ?? 0),
            costo: l?.costoUnitario !== null && l?.costoUnitario !== undefined ? Number(l.costoUnitario) : null,
            venc: formatDate(l?.fechaVencimiento),
            fechaOrden: l?.fechaVencimiento ? new Date(l.fechaVencimiento).getTime() : Number.MAX_SAFE_INTEGER,
        })).sort((a: any, b: any) => a.fechaOrden - b.fechaOrden);
    }, [infoProduct]);

    const getComboStock = (combo: any) => {
        const items = Array.isArray(combo?.items) ? combo.items : [];
        if (!items.length) return 0;

        const stockByItem = items.map((item: any) => {
            const stock = Number(item?.producto?.stock || 0);
            const qty = Number(item?.cantidad || 1);
            if (!Number.isFinite(stock) || !Number.isFinite(qty) || qty <= 0) return 0;
            return Math.floor(stock / qty);
        });

        return Math.max(0, Math.min(...stockByItem));
    };

    return (
        <>
        <div className="w-full md:w-[65%] flex flex-col gap-4 bg-white dark:bg-[#111827] rounded-[24px] shadow-gray-200/50 h-auto min-h-[500px] md:h-full overflow-hidden border border-white dark:border-slate-800">
            {/* Header: Search & Categories */}
            <div className="p-4 md:p-5 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-[#111827]">
                <div className="flex gap-2 mb-3">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            placeholder="Buscar productos..."
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 text-gray-700 dark:text-gray-200 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500 font-medium"
                            value={vm.searchTerm}
                            onChange={(e) => vm.setSearchTerm(e.target.value)}
                        />
                        <Icon icon="solar:magnifer-linear" className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-xl" />
                    </div>

                    <button
                        onClick={() => vm.setIsOpenModalProduct(true)}
                        className="flex items-center gap-2 px-4 py-3 !bg-violet-600 hover:!bg-violet-700 text-white rounded-xl font-semibold shadow-md shadow-violet-200/50 transition-all"
                        title="Crear producto nuevo"
                    >
                        <Icon icon="solar:add-circle-bold" className="text-xl" />
                        <span className="hidden md:inline">Producto</span>
                    </button>
                </div>

                {/* Barcode scanner — auto-adds to cart on Enter */}
                <BarcodeScannerInput
                    className="mb-4"
                    inputRef={vm.barcodeRef}
                    value={vm.barcodeInput}
                    onChange={(e) => vm.setBarcodeInput(e.target.value)}
                    onScan={(val) => vm.handleBarcodeScan(val)}
                    loading={vm.barcodeLoading}
                    error={vm.barcodeError}
                />

                <div className="flex gap-3 overflow-x-auto pb-4 pt-1 scrollbar-hide px-1">
                    <button
                        onClick={() => vm.setSelectedCategoryId(0)}
                        className={`group flex items-center gap-2 px-5 py-2.5 rounded-2xl whitespace-nowrap text-sm font-bold transition-all ${vm.selectedCategoryId === 0 ? '!bg-blue-500 text-white shadow-md shadow-blue-200/50 border-none' : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700'}`}
                    >
                        <span>TODOS</span>
                        <span className={`min-w-[24px] h-5 px-2 flex items-center justify-center rounded-full text-xs font-bold ${vm.selectedCategoryId === 0 ? 'bg-white text-blue-600' : 'bg-gray-100 dark:bg-slate-900 text-gray-600 dark:text-gray-400 group-hover:bg-gray-200 dark:group-hover:bg-slate-950'}`}>
                            {(vm.totalProducts || 0) + (vm.filteredCombos?.length || 0)}
                        </span>
                    </button>
                    {vm.categories?.map((cat: any) => (
                        <button
                            key={cat.id}
                            onClick={() => vm.setSelectedCategoryId(cat.id)}
                            className={`group flex items-center gap-2 px-5 py-2.5 rounded-2xl whitespace-nowrap text-sm font-bold transition-all ${vm.selectedCategoryId === cat.id ? '!bg-blue-500 text-white shadow-md shadow-blue-200/50 border-none' : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700'}`}
                        >
                            <span>{cat.nombre.toUpperCase()}</span>
                            <span className={`min-w-[24px] h-5 px-2 flex items-center justify-center rounded-full text-xs font-bold ${vm.selectedCategoryId === cat.id ? 'bg-white text-blue-600' : 'bg-gray-100 dark:bg-slate-900 text-gray-600 dark:text-gray-400 group-hover:bg-gray-200 dark:group-hover:bg-slate-950'}`}>
                                {cat._count?.productos || 0}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Product Grid */}
            <div className="flex-1 overflow-y-auto p-3 md:p-4 scrollbar-thin">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-3 md:gap-4">
                    {vm.catalogItems?.map((item: any, itemIndex: number) => (
                        <div
                            key={`${item.__catalogType}-${item.id}-${itemIndex}`}
                            className="group bg-white dark:bg-[#1E2435] rounded-[20px] p-2 hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-slate-800 flex flex-col"
                        >
                            <div className="aspect-[4/3] bg-[#F3F4F6] dark:bg-slate-800/50 rounded-xl mb-2 overflow-hidden relative flex items-center justify-center">
                                {(uploadedImages[item.id] || item.imagenUrl) && !brokenImages[`${item.__catalogType}-${item.id}`] ? (
                                    <img
                                        src={uploadedImages[item.id] ?? item.imagenUrl}
                                        alt={item.descripcion || "Producto"}
                                        className="w-full h-full object-contain"
                                        loading="lazy"
                                        onError={() => setBrokenImages((prev) => ({ ...prev, [`${item.__catalogType}-${item.id}`]: true }))}
                                    />
                                ) : (
                                    <Icon icon="solar:box-minimalistic-linear" className="text-3xl text-gray-300 dark:text-slate-600" />
                                )}
                                {item.__catalogType === 'COMBO' && (
                                    <span className="absolute left-2 top-2 text-[10px] px-2 py-0.5 rounded-full bg-violet-600 text-white font-bold tracking-wide">
                                        KIT
                                    </span>
                                )}
                                {/* Farmacia: badge cadena de frío */}
                                {vm.usaLotesFarmacia && item.refrigerado && (
                                    <span className="absolute right-2 top-2 text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500 text-white font-bold flex items-center gap-0.5">
                                        🧊
                                    </span>
                                )}
                                {/* Farmacia: badge vencimiento */}
                                {vm.usaLotesFarmacia && item.__catalogType === 'PRODUCTO' && (() => {
                                    const dias = item?.loteFefo?.diasAlVencimiento;
                                    if (dias === null || dias === undefined) return null;
                                    if (dias < 0) return (
                                        <span className="absolute left-2 bottom-2 text-[9px] px-1.5 py-0.5 rounded-full bg-red-600 text-white font-bold">
                                            🚫 Vencido
                                        </span>
                                    );
                                    if (dias <= 30) return (
                                        <span className="absolute left-2 bottom-2 text-[9px] px-1.5 py-0.5 rounded-full bg-amber-400 text-white font-bold">
                                            ⚠️ Vence en {dias}d
                                        </span>
                                    );
                                    return null;
                                })()}
                            </div>

                            <div className="flex-1 flex flex-col justify-between px-1">
                                <h4 className="font-bold text-gray-800 dark:text-gray-200 text-[13px] mb-2 line-clamp-2 leading-snug uppercase">
                                    {item.__catalogType === 'COMBO' ? item.nombre : item.descripcion}
                                </h4>

                                {/* Fraccionamiento: selector CAJA / UNIDAD */}
                                {vm.isFarmaciaRetail && item.__catalogType === 'PRODUCTO' && Number(item.factorConversion ?? 1) > 1 && (
                                    <div className="flex gap-1 mb-1.5">
                                        {(['CAJA', 'UNIDAD'] as const).map((modo) => {
                                            const activo = (vm.modoFraccionPorProducto[item.id] ?? 'CAJA') === modo;
                                            return (
                                                <button
                                                    key={modo}
                                                    onClick={(e) => { e.stopPropagation(); vm.setModoFraccionProducto(item.id, modo); }}
                                                    className={`flex-1 text-[10px] font-bold py-0.5 rounded-md transition-colors ${activo ? 'bg-violet-600 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400'}`}
                                                >
                                                    {modo === 'CAJA' ? (item.unidadCompra || 'CAJA') : (item.unidadVenta || 'UNIDAD')}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                <div className="flex items-end justify-between gap-2">
                                    <div>
                                        <p className="text-base font-black text-gray-900 dark:text-white leading-none mb-0.5">
                                            {(() => {
                                                if (item.__catalogType === 'COMBO') return `S/${Number(item.precioCombo).toFixed(2)}`;
                                                const factor = Number(item.factorConversion ?? 1);
                                                const modo = vm.modoFraccionPorProducto?.[item.id] ?? 'CAJA';
                                                const precio = Number(item.precioUnitario);
                                                return `S/${(vm.isFarmaciaRetail && factor > 1 && modo === 'UNIDAD' ? precio / factor : precio).toFixed(2)}`;
                                            })()}
                                        </p>
                                        <div className="text-[10px] leading-tight font-medium space-y-0.5">
                                            <p className="text-emerald-600 dark:text-emerald-400">
                                                Disponible: {item.__catalogType === 'COMBO' ? getComboStock(item) : (item.stock ?? 0)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        {/* Ver detalle */}
                                        <button
                                            onClick={() => setInfoProduct(item)}
                                            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-100 rounded-lg transition-all active:scale-95 flex items-center justify-center"
                                            title="Ver detalle"
                                        >
                                            <Icon icon="solar:info-circle-linear" className="text-lg" />
                                        </button>

                                        {/* Subir imagen (solo productos, no combos) */}
                                        {item.__catalogType === 'PRODUCTO' && (
                                            <>
                                                <input
                                                    ref={el => { fileInputRefs.current[item.id] = el; }}
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={e => {
                                                        const f = e.target.files?.[0];
                                                        if (f) handleImageUpload(item.id, f);
                                                        e.target.value = '';
                                                    }}
                                                />
                                                <button
                                                    onClick={() => fileInputRefs.current[item.id]?.click()}
                                                    disabled={uploadingId === item.id}
                                                    className="p-2 bg-sky-50 hover:bg-sky-100 dark:bg-sky-900/30 dark:hover:bg-sky-800/50 text-sky-600 dark:text-sky-400 rounded-lg transition-all active:scale-95 flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed border border-sky-200 dark:border-sky-800/50"
                                                    title={(uploadedImages[item.id] || item.imagenUrl) ? "Cambiar imagen" : "Subir imagen"}
                                                >
                                                    {uploadingId === item.id
                                                        ? <Icon icon="eos-icons:loading" className="text-lg animate-spin" />
                                                        : <Icon icon={uploadedImages[item.id] || item.imagenUrl ? "solar:camera-rotate-bold-duotone" : "solar:camera-add-bold-duotone"} className="text-lg" />
                                                    }
                                                </button>
                                            </>
                                        )}

                                        {/* Agregar al carrito */}
                                        <button
                                            onClick={() => item.__catalogType === 'COMBO' ? vm.handleComboClick(item) : vm.handleProductClick(item)}
                                            disabled={vm.usaLotesFarmacia && item.__catalogType === 'PRODUCTO' && item?.loteFefo?.diasAlVencimiento !== undefined && item?.loteFefo?.diasAlVencimiento < 0}
                                            className="p-2 !bg-violet-600 hover:!bg-violet-700 disabled:!bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg shadow-md shadow-violet-200/50 transition-all active:scale-95 flex items-center justify-center"
                                        >
                                            <Icon icon="solar:add-circle-bold" className="text-lg" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                {!vm.catalogItems?.length && (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <Icon icon="solar:sad-square-linear" className="text-6xl mb-2 opacity-50" />
                        <p>No se encontraron productos ni kits</p>
                    </div>
                )}
            </div>

            <div className="px-4 py-2 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-[#111827]">
                <Pagination
                    data={vm.catalogItems}
                    optionSelect
                    currentPage={vm.page}
                    indexOfFirstItem={vm.indexOfFirstItem}
                    indexOfLastItem={vm.indexOfLastItem}
                    setcurrentPage={vm.setPage}
                    setitemsPerPage={vm.setLimit}
                    pages={vm.pages}
                    total={vm.totalProducts || 0}
                />
            </div>
        </div>
        {infoProduct && (
            <div className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-[1px] flex items-center justify-center p-4">
                <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-slate-700 shadow-2xl">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700">
                        <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">
                            {String(infoProduct.__catalogType === 'COMBO' ? infoProduct.nombre : infoProduct.descripcion || "").toUpperCase()}
                        </h3>
                        <button
                            onClick={() => setInfoProduct(null)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-700"
                        >
                            <Icon icon="solar:close-circle-linear" className="text-2xl" />
                        </button>
                    </div>
                    <div className="p-5 space-y-4">
                        {infoProduct.__catalogType === 'COMBO' ? (
                            <>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3">
                                        <p className="text-xs text-slate-500">Precio combo</p>
                                        <p className="text-lg font-bold text-slate-900 dark:text-white">S/{Number(infoProduct.precioCombo || 0).toFixed(2)}</p>
                                    </div>
                                    <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 p-3">
                                        <p className="text-xs text-emerald-700 dark:text-emerald-300">Precio regular</p>
                                        <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">S/{Number(infoProduct.precioRegular || 0).toFixed(2)}</p>
                                    </div>
                                    <div className="rounded-xl bg-violet-50 dark:bg-violet-900/20 p-3">
                                        <p className="text-xs text-violet-700 dark:text-violet-300">Ahorro</p>
                                        <p className="text-lg font-bold text-violet-700 dark:text-violet-300">-{Number(infoProduct.descuentoPorcentaje || 0).toFixed(1)}%</p>
                                    </div>
                                </div>
                                <div className="rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                                    <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/70">
                                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Componentes del kit</p>
                                    </div>
                                    <div className="divide-y divide-gray-100 dark:divide-slate-700">
                                        {(infoProduct?.items || []).map((kitItem: any, idx: number) => (
                                            <div key={`kit-item-${kitItem?.productoId}-${idx}`} className="px-4 py-3 flex items-center justify-between gap-3">
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{String(kitItem?.producto?.descripcion || "-").toUpperCase()}</p>
                                                    <p className="text-xs text-gray-500 dark:text-slate-400">Cantidad en kit: {Number(kitItem?.cantidad || 0)}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Stock: {Number(kitItem?.producto?.stock || 0)}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3">
                                        <p className="text-xs text-slate-500">Precio venta</p>
                                        <p className="text-lg font-bold text-slate-900 dark:text-white">S/{Number(infoProduct.precioUnitario || 0).toFixed(2)}</p>
                                    </div>
                                    <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 p-3">
                                        <p className="text-xs text-emerald-700 dark:text-emerald-300">Disponible venta</p>
                                        <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{getProvisionInfo(infoProduct).disponibleVenta}</p>
                                    </div>
                                    <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 p-3">
                                        <p className="text-xs text-blue-700 dark:text-blue-300">Stock base</p>
                                        <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{infoProduct.stockBase ?? infoProduct.stock ?? 0}</p>
                                    </div>
                                    <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 p-3">
                                        <p className="text-xs text-amber-700 dark:text-amber-300">Reservado actual</p>
                                        <p className="text-lg font-bold text-amber-700 dark:text-amber-300">{getProvisionInfo(infoProduct).reservadoActual}</p>
                                    </div>
                                    <div className="rounded-xl bg-purple-50 dark:bg-purple-900/20 p-3">
                                        <p className="text-xs text-purple-700 dark:text-purple-300">Cupo provisión ({getProvisionInfo(infoProduct).porcentajeProvision}%)</p>
                                        <p className="text-lg font-bold text-purple-700 dark:text-purple-300">{getProvisionInfo(infoProduct).cupoProvision}</p>
                                    </div>
                                    <div className="rounded-xl bg-cyan-50 dark:bg-cyan-900/20 p-3">
                                        <p className="text-xs text-cyan-700 dark:text-cyan-300">Cupo venta</p>
                                        <p className="text-lg font-bold text-cyan-700 dark:text-cyan-300">{getProvisionInfo(infoProduct).cupoVenta}</p>
                                    </div>
                                </div>

                                <div className="rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                                    <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/70">
                                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Lotes activos (FEFO primero)</p>
                                    </div>
                                    <div className="divide-y divide-gray-100 dark:divide-slate-700">
                                        {lotesInfo.length > 0 ? lotesInfo.map((l: any, i: number) => (
                                            <div key={`${l.lote}-${i}`} className="px-4 py-3 flex items-center justify-between gap-3">
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                                        {l.lote} {i === 0 && <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">FEFO ACTIVO</span>}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-slate-400">Vence: {l.venc || "-"}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Stock: {l.stock}</p>
                                                    <p className="text-xs text-gray-600 dark:text-amber-400">Costo lote: {l.costo !== null ? `S/${l.costo.toFixed(2)}` : "-"}</p>
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="px-4 py-5 text-sm text-gray-500 dark:text-slate-400">
                                                Este producto no tiene lotes activos con stock.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        )}
        </>
    );
};
