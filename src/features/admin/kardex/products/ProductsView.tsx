import React from 'react';
import { Icon } from '@iconify/react';
import Button from '@/components/Button';
import InputPro from '@/components/InputPro';
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

export default function ProductsView() {
    const vm = useProductsViewModel();
    const { actions } = vm;

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

        if (!vm.products || vm.products.length === 0) return <TableSkeleton />;

        // Prepare table data for TablaFerreteria
        const productsTable = vm.products.map((item) => {
            const costo = Number(item?.costoUnitario > 0 ? item?.costoUnitario : item?.costoPromedio || 0);
            const precio = Number(item?.precioUnitario || 0);
            const margen = precio > 0 && costo > 0 ? ((precio - costo) / precio * 100) : 0;
            const gananciaUnidad = precio - costo;

            const allData: any = {
                productoId: item?.id,
                'Img': (item as any)?.imagenUrl ? (
                    <div className="h-[43px] w-[43px] bg-white border border-gray-200 rounded-lg overflow-hidden flex items-center justify-center p-1">
                        <img
                            src={(item as any).imagenUrl}
                            alt={item?.descripcion}
                            className="h-full w-full object-contain"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement?.classList.add('bg-gray-50');
                            }}
                        />
                    </div>
                ) : (
                    <div className="h-11 w-11 bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                        <Icon icon="solar:gallery-linear" width={24} height={24} />
                    </div>
                ),
                'Código': item?.codigo,
                'Producto': item?.descripcion,
                'Categoria': item?.categoria?.nombre || 'Sin categoría',
                'Marca': (item as any)?.marca?.nombre || 'Sin marca',
                categoriaId: item?.categoriaId !== null ? "" : item?.categoria?.id,
                unidadMedidaId: item?.unidadMedida?.id || item?.unidadMedidaId,
                marcaId: (item as any)?.marca?.id || (item as any)?.marcaId || null,
                marcaNombre: (item as any)?.marca?.nombre || "",
                'Precio Venta': `S/ ${precio.toFixed(2)}`,
                'Costo': costo > 0 ? `S/ ${costo.toFixed(2)}` : '-',
                'Margen': margen > 0 ? `${margen.toFixed(1)}%` : '-',
                'Ganancia/Unidad': gananciaUnidad > 0 ? `S/ ${gananciaUnidad.toFixed(2)}` : '-',
                'Stock': (
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${item?.stock <= 5
                        ? 'bg-red-100 text-red-700'
                        : item?.stock <= 10
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                        {item?.stock}
                    </span>
                ),
                'Stock minimo': item?.stockMinimo ?? 0,
                'U.M': item?.unidadMedida.nombre,
                'Estado': item.estado,
                _original: item
            };

            const acciones = (
                <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
                    <button
                        type="button"
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
                        className="h-8 w-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
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
                            products={vm.products}
                            onEdit={(p) => actions.handleGetProduct({ ...p, productoId: p.id })}
                            onDelete={(p) => actions.handleOpenDelete({ ...p, productoId: p.id })}
                            onToggleState={(p) => actions.handleToggleClientState({ ...p, productoId: p.id })}
                            onUploadImage={(p) => { actions.setUploadTarget({ id: p.id, tipo: 'principal' }); vm.uploadImageRef.current?.click(); }}
                        />
                        <Pagination
                            data={vm.products}
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
                            products={vm.products}
                            onEdit={(p) => actions.handleGetProduct({ ...p, productoId: p.id })}
                            onDelete={(p) => actions.handleOpenDelete({ ...p, productoId: p.id })}
                            onToggleState={(p) => actions.handleToggleClientState({ ...p, productoId: p.id })}
                        />
                        <Pagination
                            data={vm.products}
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
                        visibleColumns={vm.visibleColumns}
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
        <div className="min-h-screen px-2 pb-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                <div>
                    <h1 className="text-2xl font-[600] text-gray-900 tracking-tight">{vm.labels.titulo}</h1>
                    <p className="text-sm text-gray-500 font-[400] mt-1">Gestiona tu inventario de {vm.labels.titulo.toLowerCase()}</p>
                </div>
                <div className="flex gap-3">
                    <Button
                        outline
                        className="bg-red-50 text-red-600 border-red-200"
                        onClick={() => actions.setIsOpenModalDeleteAll(true)}
                    >
                        <Icon icon="solar:trash-bin-trash-bold" className="text-lg mr-2" />
                        Eliminar todo
                    </Button>
                    <Button
                        color="secondary"
                        onClick={() => {
                            // Reset form logic is handled in VM or could be here calling VM action
                            actions.setFormValues({ ...vm.formValues, productoId: 0 }); // Simplification
                            actions.setIsOpenModal(true);
                        }}
                        className="flex items-center gap-2"
                    >
                        <Icon icon="solar:add-circle-bold" className="text-lg" />
                        {vm.labels.nuevoBtn}
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100">
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
                        <div className="w-full flex md:top-8 relative lg:w-auto overflow-x-auto pb-2 lg:pb-0 hide-scrollbar">
                            <div className="flex gap-2 whitespace-nowrap px-1">
                                <Button color="lila" outline onClick={() => actions.setIsOpenModalCategory(true)} className="text-sm">
                                    <Icon icon="solar:tag-bold-duotone" className="mr-1.5" /> Categorías
                                </Button>
                                <Button color="lila" outline onClick={() => actions.setIsOpenModalBrands(true)} className="text-sm">
                                    <Icon icon="solar:star-bold-duotone" className="mr-1.5" /> Marcas
                                </Button>
                                <Button
                                    color="success"
                                    outline
                                    onMouseEnter={() => actions.setIsHoveredExp(true)}
                                    onMouseLeave={() => actions.setIsHoveredExp(false)}
                                    onClick={actions.exportProducts}
                                    className="text-sm"
                                >
                                    <Icon icon="solar:export-bold" className="mr-1.5" /> Exportar
                                </Button>
                                <div className="relative inline-block">
                                    <input
                                        type="file"
                                        accept=".xlsx, .xls"
                                        ref={vm.fileInputRef}
                                        onChange={actions.handleImportExcel}
                                        className="hidden"
                                    />
                                    <Button
                                        color="success"
                                        outline
                                        onMouseEnter={() => actions.setIsHoveredImp(true)}
                                        onMouseLeave={() => actions.setIsHoveredImp(false)}
                                        onClick={() => vm.fileInputRef.current?.click()}
                                        className="text-sm"
                                    >
                                        <Icon icon="solar:import-bold" className="mr-1.5" /> Importar
                                    </Button>
                                </div>
                                <Button color="primary" onClick={() => actions.setIsOpenModalCatalog(true)} className="text-sm">
                                    <Icon icon="solar:cloud-download-bold" className="mr-1.5" /> Catálogo
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
                            const rowBase = vm.products.find((r) => r.id === vm.openAccionesId);
                            if (!rowBase) return null;
                            return (
                                <>
                                    <button type="button" onClick={() => { actions.handleGetProduct({ ...rowBase, productoId: rowBase.id }); actions.setOpenAccionesId(null); actions.setAnchorEl(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-100">
                                        <Icon icon="material-symbols:edit" width={16} height={16} /> <span>Editar</span>
                                    </button>
                                    <button type="button" onClick={() => { actions.setUploadTarget({ id: rowBase.id, tipo: 'principal' }); vm.uploadImageRef.current?.click(); actions.setOpenAccionesId(null); actions.setAnchorEl(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-100">
                                        <Icon icon="solar:upload-minimalistic-bold" width={16} height={16} /> <span>Subir imagen</span>
                                    </button>
                                    <button type="button" onClick={() => { actions.handleToggleClientState({ ...rowBase, productoId: rowBase.id }); actions.setOpenAccionesId(null); actions.setAnchorEl(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-100">
                                        <Icon icon="mdi:power" width={16} height={16} /> <span>{rowBase.estado === 'INACTIVO' ? 'Activar' : 'Desactivar'}</span>
                                    </button>
                                    <button type="button" onClick={() => { actions.handleOpenDelete({ ...rowBase, productoId: rowBase.id }); actions.setOpenAccionesId(null); actions.setAnchorEl(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50">
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
                closeModal={() => actions.setIsOpenModal(false)}
                errors={vm.errors}
                initialForm={{ ...vm.formValues, productoId: 0 }} // Hack to reset if new
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

            <ModalConfirm
                isOpenModal={vm.isOpenModalDeleteAll}
                setIsOpenModal={actions.setIsOpenModalDeleteAll}
                confirmSubmit={actions.confirmDeleteAllProducts}
                title="Eliminar todos los productos"
                information={`¿Estás seguro que deseas eliminar TODOS los productos? Esta acción no se puede deshacer.`}
            />
        </div>
    );
}
