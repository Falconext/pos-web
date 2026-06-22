import React, { useState, useRef } from 'react';
import { BarcodeScannerInput } from '@/components/BarcodeScannerInput';
import { Icon } from '@iconify/react';
import Button from '@/components/Button';
import InputPro from '@/components/InputPro';
import Select from '@/components/Select';
import ModalProduct from '@/pages/admin/kardex/modal-productos';
import ModalCategories from '@/pages/admin/kardex/modal-categorias';
import ModalMarcas from '@/pages/admin/kardex/modal-marcas';
import ModalCatalog from '@/features/admin/kardex/shared/ModalCatalog';
import ModalConfirm from '@/components/ModalConfirm';
import Pagination from '@/components/Pagination';
import CardRestaurante from '@/components/productos/CardRestaurante';
import ListaBodega from '@/components/productos/ListaBodega';
import TablaFerreteria from '@/components/productos/TablaFerreteria';
import TableActionMenu from '@/components/TableActionMenu';
import TableSkeleton from '@/components/Skeletons/table';
import { useProductsViewModel } from './useProductsViewModel';
import { get } from '@/utils/fetch';
import useAlertStore from '@/zustand/alert';
import ModalPreviewCatalogo from '../shared/ModalPreviewCatalogo';

export default function ProductsView() {
    const vm = useProductsViewModel();
    const { actions } = vm;
    const { alert } = useAlertStore();
    const productsSource = Array.isArray(vm.products) ? vm.products : [];

    const [barcodeInput, setBarcodeInput] = useState('');
    const [barcodeLoading, setBarcodeLoading] = useState(false);
    const barcodeRef = useRef<HTMLInputElement>(null);

    const handleBarcodeScan = async (codigo: string) => {
        const trimmed = codigo.trim();
        if (!trimmed) return;
        setBarcodeLoading(true);
        try {
            const resp: any = await get(`productos/barcode/${encodeURIComponent(trimmed)}`);
            if (resp.code === 1 && resp.data) {
                // Vuelca la descripción en el buscador existente → el debounce filtra la lista
                actions.setSearchClient({ target: { value: resp.data.descripcion } });
                setBarcodeInput('');
            } else {
                alert(`Producto no encontrado: ${trimmed}`, 'error');
                setBarcodeInput('');
            }
        } catch {
            alert(`Código de barras no encontrado: ${trimmed}`, 'error');
            setBarcodeInput('');
        } finally {
            setBarcodeLoading(false);
            barcodeRef.current?.focus();
        }
    };

    const [showOptionsDropdown, setShowOptionsDropdown] = useState(false);
    const [isOpenModalPreviewCatalogo, setIsOpenModalPreviewCatalogo] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowOptionsDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const renderContent = () => {
        if (vm.vistaActual === 'cards' && vm.loading) {
            return (
                <CardRestaurante
                    loading
                    skeletonCount={vm.itemsPerPage > 0 ? Math.min(vm.itemsPerPage, 12) : 8}
                    products={[] as any}
                    onEdit={() => { }}
                    onDelete={() => { }}
                    onToggleState={() => { }}
                    onUploadImage={() => { }}
                />
            );
        }

        if (!vm.productsLoaded && productsSource.length === 0) return <TableSkeleton />;

        // Palette for category badges — picked deterministically from the category name
        const CAT_PALETTE = [
            { bg: '#EEF2FF', text: '#6366F1' },
            { bg: '#F0FDF4', text: '#16A34A' },
            { bg: '#FFF7ED', text: '#EA580C' },
            { bg: '#FDF4FF', text: '#A855F7' },
            { bg: '#F0F9FF', text: '#0284C7' },
            { bg: '#FFF1F2', text: '#E11D48' },
            { bg: '#FEFCE8', text: '#CA8A04' },
            { bg: '#F0FDFA', text: '#0D9488' },
            { bg: '#F5F3FF', text: '#7C3AED' },
            { bg: '#FFF8F1', text: '#C2410C' },
        ];
        const getCatColor = (name: string) => {
            let h = 0;
            for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
            return CAT_PALETTE[Math.abs(h) % CAT_PALETTE.length];
        };

        // Prepare table data for TablaFerreteria
        const productsTable = productsSource.map((item) => {
            const itemAny = item as any;
            const unidadNombre =
                item?.unidadMedida?.nombre ||
                (typeof itemAny?.unidadMedidaNombre === 'string' ? itemAny.unidadMedidaNombre : '') ||
                (typeof item?.unidadMedidaId !== 'undefined' ? 'Unidad' : '-') ||
                '-';
            const formatMoney = (value: number) => value.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            const costo = Number(item?.costoUnitario > 0 ? item?.costoUnitario : item?.costoPromedio || 0);
            const precio = Number(item?.precioUnitario || 0);
            const stock = Number(item?.stock || 0);
            const esServicio = String(itemAny?.atributosTecnicos?.tipoProducto || '').toUpperCase() === 'SERVICIO';
            const costoFijo = Number(itemAny?.costoFijo || 0);
            const costoFijoUnitario = costo + costoFijo;
            const valorInventario = stock * costo;
            const costoTotalFijo = stock * costoFijoUnitario;
            const margen = precio > 0 && costo > 0 ? ((precio - costo) / precio * 100) : 0;
            const gananciaUnidad = precio - costo;
            const imageSrc = (item as any)?.imagenUrlDisplay || (item as any)?.imagenUrl;

            const allData: any = {
                productoId: item?.id,
                'Img': imageSrc ? (
                    <div className="h-[43px] w-[43px] bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden flex items-center justify-center p-1">
                        <img
                            key={imageSrc}
                            src={imageSrc}
                            alt={item?.descripcion}
                            className="h-full w-full object-contain"
                            onError={(e) => {
                                const target = e.currentTarget;
                                target.onerror = null; // Prevent infinite loop
                                target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBmaWxsPSIjOWNhM2FmIiBkPSJNMjEgMTlWMWMwLS41NS0uNDUtMS0xLTFIM2MtLjU1IDAtMSAuNDUtMSAxdjE4YzAgLjU1LjQ1IDEgMWgxN2MuNTUgMCAxLS40NSAxLTF6TTguNSAxMy41bDIuNSAzLjAxTDE0LjUgMTJsNC41IDZIM2w1LjUtNy41eiIvPjwvc3ZnPg==';
                                target.className = "h-6 w-6 object-contain opacity-50";
                            }}
                        />
                    </div>
                ) : (
                    <div className="h-11 w-11 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-lg flex items-center justify-center text-gray-400 dark:text-slate-500">
                        <Icon icon="solar:gallery-linear" width={24} height={24} />
                    </div>
                ),
                'Código': item?.codigo?.toUpperCase(),
                'Producto': (
                    <div className="flex flex-col">
                        <span className="font-semibold text-gray-900 dark:text-white text-[13px] leading-tight uppercase">{item?.descripcion}</span>
                        <span className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 uppercase">{item?.codigo}</span>
                        {item?.codigoBarras && (
                            <span className="text-[10px] text-violet-400 dark:text-violet-400 mt-0.5 font-mono tracking-wide">{item.codigoBarras}</span>
                        )}
                    </div>
                ),
                'Categoria': (() => {
                    const nombre = item?.categoria?.nombre || 'Sin categoría';
                    const c = getCatColor(nombre);
                    return (
                        <span
                            style={{ backgroundColor: c.bg, color: c.text }}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap uppercase"
                        >
                            {nombre}
                        </span>
                    );
                })(),
                'Marca': ((item as any)?.marca?.nombre || 'Sin marca').toUpperCase(),
                categoriaId: item?.categoriaId !== null ? "" : item?.categoria?.id,
                unidadMedidaId: item?.unidadMedida?.id || item?.unidadMedidaId,
                marcaId: (item as any)?.marca?.id || (item as any)?.marcaId || null,
                marcaNombre: (item as any)?.marca?.nombre || "",
                'Precio Venta': `S/ ${precio.toFixed(2)}`,
                'Costo': costo > 0 ? `S/ ${costo.toFixed(2)}` : '-',
                'Valor Inventario': esServicio ? '-' : valorInventario > 0 ? `S/ ${formatMoney(valorInventario)}` : '-',
                'Costo Total Fijo': !esServicio && costoTotalFijo > 0 ? (
                    <div className="flex flex-col">
                        <span className="font-semibold text-gray-800 dark:text-gray-100">S/ {formatMoney(costoTotalFijo)}</span>
                        <span className="text-[10px] text-gray-400">Unit. S/ {formatMoney(costoFijoUnitario)}</span>
                    </div>
                ) : '-',
                'Margen': margen > 0 ? `${margen.toFixed(1)}%` : '-',
                'Ganancia/Unidad': gananciaUnidad > 0 ? `S/ ${gananciaUnidad.toFixed(2)}` : '-',
                'Stock': (
                    <span
                        style={{
                            backgroundColor: esServicio ? '#7C3AED' : stock <= 0 ? '#F43F5F' : stock <= 10 ? '#F49D0D' : '#0BB980',
                            color: '#ffffff',
                        }}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                    >
                        {esServicio ? 'Servicio' : stock}
                    </span>
                ),
                'Localización': item?.localizacion?.trim() ? item.localizacion.toUpperCase() : '-',
                '% Venta': `${Number((item as any)?.porcentajeVenta ?? 100)}%`,
                '% Provisión': `${Number((item as any)?.porcentajeProvision ?? 0)}%`,
                'Stock minimo': esServicio ? '-' : item?.stockMinimo ?? 0,
                'U.M': unidadNombre.toUpperCase(),
                'Estado': item.estado,
                'Tienda': (item as any).publicarEnTienda ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-600">
                        <Icon icon="mdi:store" width={12} /> Sí
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-400">
                        <Icon icon="mdi:store-off" width={12} /> No
                    </span>
                ),
                _original: item
            };

            const acciones = (
                <div
                    className="relative inline-block"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        type="button"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (vm.openAccionesId === item.id) {
                                actions.setOpenAccionesId(null);
                                actions.setAnchorEl(null);
                            } else {
                                actions.setOpenAccionesId(item.id);
                                actions.setAnchorEl(e.currentTarget);
                            }
                        }}
                        className="h-8 w-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                    >
                        <Icon icon="mdi:dots-vertical" width={20} height={20} />
                    </button>
                </div>
            );

            return { ...allData, 'Acciones': acciones };
        });

        switch (vm.vistaActual) {
            case 'cards':
                return (
                    <>
                        <CardRestaurante
                            loading={vm.loading}
                            skeletonCount={vm.itemsPerPage > 0 ? Math.min(vm.itemsPerPage, 12) : 8}
                            products={productsSource}
                            onEdit={(p) => actions.handleGetProduct({ ...p, productoId: p.id })}
                            onDelete={(p) => actions.handleOpenDelete({ ...p, productoId: p.id })}
                            onToggleState={(p) => actions.handleToggleClientState({ ...p, productoId: p.id })}
                            onUploadImage={(p) => { actions.setUploadTarget({ id: p.id, tipo: 'principal' }); vm.uploadImageRef.current?.click(); }}
                        />
                        <Pagination
                            data={productsSource}
                            optionSelect
                            currentPage={vm.currentPage}
                            indexOfFirstItem={vm.indexOfFirstItem}
                            indexOfLastItem={vm.indexOfLastItem}
                            setcurrentPage={actions.setcurrentPage}
                            setitemsPerPage={actions.setitemsPerPage}
                            pages={vm.pages}
                            total={vm.totalProducts}
                        />
                    </>
                );
            case 'lista':
                return (
                    <>
                        <ListaBodega
                            products={productsSource}
                            onEdit={(p) => actions.handleGetProduct({ ...p, productoId: p.id })}
                            onDelete={(p) => actions.handleOpenDelete({ ...p, productoId: p.id })}
                            onToggleState={(p) => actions.handleToggleClientState({ ...p, productoId: p.id })}
                        />
                        <Pagination
                            data={productsSource}
                            optionSelect
                            currentPage={vm.currentPage}
                            indexOfFirstItem={vm.indexOfFirstItem}
                            indexOfLastItem={vm.indexOfLastItem}
                            setcurrentPage={actions.setcurrentPage}
                            setitemsPerPage={actions.setitemsPerPage}
                            pages={vm.pages}
                            total={vm.totalProducts}
                        />
                    </>
                );
            case 'tabla':
            default:
                return (
                    <TablaFerreteria
                        productsTable={productsTable}
                        productsLoaded={vm.productsLoaded}
                        visibleColumns={vm.safeVisibleColumns}
                        currentPage={vm.currentPage}
                        itemsPerPage={vm.itemsPerPage}
                        totalProducts={vm.totalProducts}
                        indexOfFirstItem={vm.indexOfFirstItem}
                        indexOfLastItem={vm.indexOfLastItem}
                        pages={vm.pages}
                        setcurrentPage={actions.setcurrentPage}
                        setitemsPerPage={actions.setitemsPerPage}
                    />
                );
        }
    };

    return (
        <div className="min-h-screen px-2 pb-4 relative z-1">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                <div>
                    <h1 className="text-2xl font-[600] text-gray-900 dark:text-white tracking-tight">{vm.labels.titulo}</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-[400] mt-1">Gestiona tu inventario de {vm.labels.titulo.toLowerCase()}</p>
                </div>
                <div className="flex gap-3">
                    <Button
                        color="secondary"
                        onClick={actions.openNewProduct}
                        className="flex items-center gap-2 !bg-violet-600 !text-white shadow-md shadow-violet-200 border-none"
                    >
                        <Icon icon="solar:add-circle-bold" className="text-lg" />
                        {vm.labels.nuevoBtn}
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 relative z-0 overflow-hidden">
                <div className="p-5 border-b border-gray-100 dark:border-slate-800">
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="flex-1">
                            <InputPro
                                name="search"
                                value={vm.searchClient}
                                onChange={actions.setSearchClient}
                                label={vm.labels.buscar}
                                isLabel
                            />
                        </div>
                        <BarcodeScannerInput
                            className="min-w-[220px]"
                            inputRef={barcodeRef}
                            value={barcodeInput}
                            onChange={(e) => setBarcodeInput(e.target.value)}
                            onScan={handleBarcodeScan}
                            loading={barcodeLoading}
                            label='Escanear código de barras'
                            placeholder=""
                        />
                        {vm.isAdmin && vm.esPrincipal && (
                            <div className="w-48">
                                <Select
                                    onChange={(id: any) => vm.handleSelectSede(id)}
                                    label="Sede"
                                    name="sedeId"
                                    options={vm.sedesOptions}
                                    error=""
                                    defaultValue="Todas las sedes"
                                />
                            </div>
                        )}
                        <div className="w-full flex md:top-3 relative z-50 lg:w-auto overflow-visible pb-2 lg:pb-0">
                            <div className="flex flex-wrap gap-2 px-1 items-center">
                                <Button color="default" onClick={() => actions.setIsOpenModalCategory(true)} className="text-sm !bg-blue-500 !text-white border-none shadow-sm shadow-blue-200/50">
                                    <Icon icon="solar:tag-bold-duotone" className="mr-1.5 !text-white" /> Categorías
                                </Button>
                                <Button color="default" onClick={() => actions.setIsOpenModalBrands(true)} className="text-sm !bg-emerald-500 !text-white border-none shadow-sm shadow-emerald-200/50">
                                    <Icon icon="solar:star-bold-duotone" className="mr-1.5 !text-white" /> Marcas
                                </Button>
                                <div className="relative inline-block" ref={dropdownRef}>
                                    <Button
                                        color="default"
                                        onClick={() => setShowOptionsDropdown(!showOptionsDropdown)}
                                        className="text-sm flex items-center gap-1 !bg-amber-500 !text-white border-none shadow-sm shadow-amber-200/50"
                                    >
                                        <Icon icon="solar:file-bold-duotone" className="mr-1 !text-white" width={16} />
                                        Excel / CSV
                                        <Icon icon={showOptionsDropdown ? "solar:alt-arrow-up-linear" : "solar:alt-arrow-down-linear"} className="ml-1" width={14} />
                                    </Button>

                                    {showOptionsDropdown && (
                                        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#1E2435] border border-gray-100 dark:border-slate-700 rounded-xl shadow-lg z-50 overflow-hidden py-1 font-inter">
                                            <input
                                                type="file"
                                                accept=".xlsx, .xls"
                                                ref={vm.fileInputRef}
                                                onChange={(e) => {
                                                    actions.handleImportExcel(e);
                                                    setShowOptionsDropdown(false);
                                                }}
                                                className="hidden"
                                            />
                                            <button
                                                onClick={() => { actions.exportProducts(); setShowOptionsDropdown(false); }}
                                                className="w-full flex items-center px-4 py-2.5 text-[13px] font-[500] text-gray-700 dark:text-gray-200 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-700 dark:hover:text-green-400 transition-colors"
                                            >
                                                <Icon icon="solar:export-bold" className="mr-2 text-green-500" width={18} />
                                                Exportar Productos
                                            </button>
                                            <button
                                                onClick={() => { vm.fileInputRef.current?.click(); }}
                                                className="w-full flex items-center px-4 py-2.5 text-[13px] font-[500] text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
                                            >
                                                <Icon icon="solar:import-bold" className="mr-2 text-blue-500" width={18} />
                                                Importar desde Excel
                                            </button>
                                            <div className="mx-4 my-1 border-t border-gray-100 dark:border-slate-700"></div>
                                            <button
                                                onClick={async () => {
                                                    setShowOptionsDropdown(false);
                                                    const baseUrl = (import.meta.env.VITE_API_URL as string) || '';
                                                    const resp = await fetch(`${baseUrl}/productos/plantilla`, {
                                                        headers: { Authorization: `Bearer ${localStorage.getItem('ACCESS_TOKEN')}` },
                                                    });
                                                    const blob = await resp.blob();
                                                    const url = URL.createObjectURL(blob);
                                                    const a = document.createElement('a');
                                                    a.href = url;
                                                    a.download = 'plantilla_productos.xlsx';
                                                    a.click();
                                                    URL.revokeObjectURL(url);
                                                }}
                                                className="w-full flex items-center px-4 py-2.5 text-[13px] font-[500] text-gray-700 dark:text-gray-200 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-700 dark:hover:text-amber-400 transition-colors"
                                            >
                                                <Icon icon="solar:file-download-bold" className="mr-2 text-amber-500" width={18} />
                                                Descargar Modelo (Guía)
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <Button color="default" onClick={() => setIsOpenModalPreviewCatalogo(true)} className="text-sm !bg-blue-600 !text-white border-none shadow-sm shadow-blue-200/50">
                                    <Icon icon="solar:shop-bold" className="mr-1.5 !text-white" /> Catálogo PDF
                                </Button>
                                <Button color="default" onClick={() => actions.setIsOpenModalCatalog(true)} className="text-sm !bg-slate-500 !text-white border-none shadow-sm shadow-slate-200/50">
                                    <Icon icon="solar:magic-stick-3-bold" className="mr-1.5 !text-white" /> Autocompletar
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4">
                    <input
                        type="file"
                        accept="image/*"
                        ref={vm.uploadImageRef}
                        onChange={actions.handleUploadImage}
                        className="hidden"
                        disabled={vm.uploading}
                    />

                    <div className="overflow-x-auto">
                        {renderContent()}
                    </div>

                    {/* Modals */}
                    <ModalCategories isOpenModal={vm.isOpenModalCategory} closeModal={() => actions.setIsOpenModalCategory(false)} setIsOpenModal={actions.setIsOpenModalCategory} />
                    <ModalMarcas isOpenModal={vm.isOpenModalBrands} closeModal={() => actions.setIsOpenModalBrands(false)} setIsOpenModal={actions.setIsOpenModalBrands} />
                    {vm.isOpenModalCatalog && <ModalCatalog
                        isOpen={vm.isOpenModalCatalog}
                        onClose={() => actions.setIsOpenModalCatalog(false)}
                        onSuccess={() => {
                            actions.setIsOpenModalCatalog(false);
                            actions.refreshProducts();
                        }}
                    />}

                    <TableActionMenu
                        isOpen={!!vm.openAccionesId && !!vm.anchorEl}
                        anchorEl={vm.anchorEl}
                        onClose={() => { actions.setOpenAccionesId(null); actions.setAnchorEl(null); }}
                    >
                        {vm.openAccionesId && (() => {
                            const rowBase = productsSource.find((r) => r.id === vm.openAccionesId);
                            if (!rowBase) return null;
                            return (
                                <>
                                    <button type="button" onClick={() => { actions.handleGetProduct({ ...rowBase, productoId: rowBase.id }); actions.setOpenAccionesId(null); actions.setAnchorEl(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700">
                                        <Icon icon="material-symbols:edit" width={16} height={16} /> <span>Editar</span>
                                    </button>
                                    <button type="button" onClick={() => { actions.setUploadTarget({ id: rowBase.id, tipo: 'principal' }); vm.uploadImageRef.current?.click(); actions.setOpenAccionesId(null); actions.setAnchorEl(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700">
                                        <Icon icon="solar:upload-minimalistic-bold" width={16} height={16} /> <span>Subir imagen</span>
                                    </button>
                                    <button type="button" onClick={() => { actions.handleToggleClientState({ ...rowBase, productoId: rowBase.id }); actions.setOpenAccionesId(null); actions.setAnchorEl(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700">
                                        <Icon icon="mdi:power" width={16} height={16} /> <span>{rowBase.estado === 'INACTIVO' ? 'Activar' : 'Desactivar'}</span>
                                    </button>
                                    {vm.tieneTienda && (
                                        <button type="button" onClick={() => { actions.togglePublicarTienda(rowBase); actions.setOpenAccionesId(null); actions.setAnchorEl(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700">
                                            <Icon icon={(rowBase as any).publicarEnTienda ? 'mdi:store-off' : 'mdi:store'} width={16} height={16} className={(rowBase as any).publicarEnTienda ? 'text-orange-500 dark:text-orange-400' : 'text-emerald-500 dark:text-emerald-400'} />
                                            <span>{(rowBase as any).publicarEnTienda ? 'Quitar de tienda' : 'Publicar en tienda'}</span>
                                        </button>
                                    )}
                                    <button type="button" onClick={() => { actions.handleOpenDelete({ ...rowBase, productoId: rowBase.id }); actions.setOpenAccionesId(null); actions.setAnchorEl(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/10 border-t border-gray-100 dark:border-slate-700">
                                        <Icon icon="solar:trash-bin-trash-bold" width={16} height={16} /> <span>Eliminar</span>
                                    </button>
                                </>
                            );
                        })()}
                    </TableActionMenu>
                </div>
            </div>

            {vm.isOpenModal && <ModalProduct
                isOpenModal={vm.isOpenModal}
                setIsOpenModal={actions.setIsOpenModal}
                closeModal={actions.closeProductModal}
                errors={vm.errors}
                initialForm={vm.emptyProductForm}
                formValues={vm.formValues}
                setErrors={actions.setErrors}
                setFormValues={actions.setFormValues}
                isEdit={vm.isEdit}
            />}

            <ModalConfirm
                isOpenModal={vm.isOpenModalConfirm}
                setIsOpenModal={actions.setIsOpenModalConfirm}
                confirmSubmit={actions.confirmToggleroduct}
                title={vm.labels.confirmarEstado}
                information={`¿Estás seguro que deseas cambiar el estado de este ${vm.isRestaurante ? 'plato' : 'producto'}?`}
            />

            <ModalConfirm
                isOpenModal={vm.isOpenModalDelete}
                setIsOpenModal={actions.setIsOpenModalDelete}
                confirmSubmit={actions.confirmDeleteProduct}
                title={vm.labels.eliminar}
                information={vm.labels.eliminarInfo}
            />

            <ModalPreviewCatalogo 
                isOpen={isOpenModalPreviewCatalogo} 
                onClose={() => setIsOpenModalPreviewCatalogo(false)} 
            />

        </div>
    );
}
