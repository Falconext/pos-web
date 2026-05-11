import { Icon } from "@iconify/react";
import Pagination from "@/components/Pagination";
import { BarcodeScannerInput } from "@/components/BarcodeScannerInput";

export const POSCatalogLayout = ({ vm }: { vm: any }) => {
    return (
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
                            {vm.totalProducts || 0}
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
                    {vm.filteredProducts?.map((item: any) => (
                        <div
                            key={item.id}
                            className="group bg-white dark:bg-[#1E2435] rounded-[20px] p-2 hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-slate-800 flex flex-col"
                        >
                            <div className="aspect-[4/3] bg-[#F3F4F6] dark:bg-slate-800/50 rounded-xl mb-2 overflow-hidden relative flex items-center justify-center">
                                {item.imagenUrl ? (
                                    <img
                                        src={item.imagenUrl}
                                        alt={item.descripcion}
                                        className="w-full h-full object-contain p-2 mix-blend-multiply dark:mix-blend-normal transition-transform duration-500 group-hover:scale-105"
                                    />
                                ) : (
                                    <Icon icon="solar:box-minimalistic-linear" className="text-3xl text-gray-300 dark:text-slate-600" />
                                )}
                            </div>

                            <div className="flex-1 flex flex-col justify-between px-1">
                                <h4 className="font-bold text-gray-800 dark:text-gray-200 text-[13px] mb-2 line-clamp-2 leading-snug capitalize" style={{ textTransform: 'none' }}>
                                    {item.descripcion?.toLowerCase()}
                                </h4>

                                <div className="flex items-end justify-between gap-2">
                                    <div>
                                        <p className="text-base font-black text-gray-900 dark:text-white leading-none mb-0.5">
                                            S/{Number(item.precioUnitario).toFixed(2)}
                                        </p>
                                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                                            Stock: {item.stock}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => vm.handleProductClick(item)}
                                        className="p-2 !bg-violet-600 hover:!bg-violet-700 text-white rounded-lg shadow-md shadow-violet-200/50 transition-all active:scale-95 flex items-center justify-center"
                                    >
                                        <Icon icon="solar:add-circle-bold" className="text-lg" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                {!vm.filteredProducts?.length && (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <Icon icon="solar:sad-square-linear" className="text-6xl mb-2 opacity-50" />
                        <p>No se encontraron productos</p>
                    </div>
                )}
            </div>

            <div className="px-4 py-2 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-[#111827]">
                <Pagination
                    data={vm.filteredProducts}
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
    );
};
