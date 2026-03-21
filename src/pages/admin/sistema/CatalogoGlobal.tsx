import { useCatalogoGlobalViewModel } from '@/features/admin/sistema/useCatalogoGlobalViewModel';
import InputPro from "@/components/InputPro";
import Button from "@/components/Button";
import { Icon } from "@iconify/react";
import Pagination from "@/components/Pagination";
import ModalConfirm from "@/components/ModalConfirm";
import Modal from "@/components/Modal";
import Select from "@/components/Select";
import DataTable from "@/components/Datatable";

const CatalogoGlobal = () => {
    const vm = useCatalogoGlobalViewModel();

    return (
        <div className="p-6 bg-white rounded-lg shadow m-4">
            <h1 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2"><Icon icon="solar:magnifer-linear" className="text-blue-600" />Catálogo Global de Productos</h1>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1"><InputPro name="search" value={vm.search} onChange={(e: any) => vm.setSearch(e.target.value)} label="Buscar plantilla..." placeholder="Nombre, descripción o categoría" isLabel /></div>
                <div className="w-full md:w-64"><Select name="rubro" label="Filtrar por Rubro" options={vm.rubros.map((r: any) => ({ id: r.id, value: r.nombre }))} value={vm.rubros.find((r: any) => r.id === vm.rubroId)?.nombre || ""} onChange={(id: any) => vm.setRubroId(Number(id))} placeholder="Todos los rubros" error="" /></div>
                <div className="flex items-end gap-2">
                    {vm.selectedIds.length > 0 ? (
                        <>
                            <span className="text-sm text-gray-600 font-medium mr-2">{vm.selectedIds.length} de {vm.plantillas.length} seleccionados</span>
                            <Button onClick={vm.handleBulkDeleteImages} disabled={vm.actionLoading} className="bg-orange-500 text-white border-0 hover:bg-orange-600"><Icon icon="solar:gallery-linear" className="mr-2" />Borrar Img ({vm.selectedIds.length})</Button>
                            <Button onClick={vm.handleBulkDelete} disabled={vm.actionLoading} color="danger"><Icon icon="solar:trash-bin-trash-broken" className="mr-2" />Eliminar ({vm.selectedIds.length})</Button>
                            <Button onClick={() => vm.toggleSelectAll()} color="secondary" outline>Cancelar</Button>
                        </>
                    ) : (
                        <>
                            <Button onClick={vm.toggleSelectAll} color="secondary" outline disabled={vm.plantillas.length === 0}><Icon icon="solar:checklist-minimalistic-linear" className="mr-2" />Seleccionar Todo ({vm.plantillas.length})</Button>
                            <Button onClick={vm.handleBuscarImagenesFaltantes} color="secondary" outline disabled={vm.categorizando || vm.buscandoImagenes} className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 hover:from-blue-600 hover:to-cyan-600">{vm.buscandoImagenes ? <><Icon icon="mdi:loading" className="mr-2 animate-spin" />Buscando...</> : <><Icon icon="solar:gallery-add-linear" className="mr-2" />Auto-Imágenes</>}</Button>
                            <Button onClick={vm.handleCategorizarIA} color="secondary" outline disabled={vm.categorizando || vm.buscandoImagenes} className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 hover:from-purple-600 hover:to-pink-600">{vm.categorizando ? <><Icon icon="mdi:loading" className="mr-2 animate-spin" />Categorizando...</> : <><Icon icon="solar:magic-stick-3-linear" className="mr-2" />Auto-Categoría</>}</Button>
                            <Button onClick={() => vm.setIsModalImportOpen(true)} color="secondary" outline><Icon icon="solar:download-minimalistic-linear" className="mr-2" />Importar</Button>
                            <Button onClick={vm.openNew} color="primary"><Icon icon="solar:add-circle-linear" className="mr-2" />Nuevo</Button>
                        </>
                    )}
                </div>
            </div>
            {vm.loading ? <div className="flex justify-center p-10"><span className="loading loading-spinner text-primary"></span></div> : (
                <div className="mt-4">
                    <DataTable
                        headerColumns={['#', 'Imagen', 'Nombre', 'Marca', 'Categoría', 'Rubro', 'Precio Sug.']}
                        bodyData={vm.plantillas.map((p: any) => ({
                            ...p,
                            '#': <div className="flex items-center justify-center"><input type="checkbox" checked={vm.selectedIds.includes(p.id)} onChange={() => vm.toggleSelect(p.id)} className="w-4 h-4 text-indigo-600 rounded border-gray-300 cursor-pointer" /></div>,
                            'imagen': p.imagenUrl ? <div className="h-16 w-16 bg-white border border-gray-200 rounded-lg overflow-hidden flex items-center justify-center shadow-sm"><a href={p.imagenUrl} target="_blank" rel="noopener noreferrer" className="w-full h-full flex items-center justify-center"><img src={p.imagenUrl} alt={p.nombre} referrerPolicy="no-referrer" className="h-full w-full object-contain p-1" /></a></div> : vm.processingId === p.id ? <div className="h-16 w-16 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-center animate-pulse"><Icon icon="mdi:loading" className="text-blue-500 w-6 h-6 animate-spin" /></div> : <div className="h-16 w-16 bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-center"><Icon icon="solar:gallery-linear" className="text-gray-300 w-6 h-6" /></div>,
                            'nombre': p.nombre,
                            'marca': p.marca ? <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">{p.marca}</span> : <span className="text-gray-300 text-xs italic">S/M</span>,
                            'categoría': p.categoria ? <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-600"><Icon icon="solar:tag-linear" width={12} />{p.categoria}</span> : '-',
                            'rubro': p.rubro?.nombre || '-',
                            'precio sug.': <span className="font-semibold text-gray-700">S/ {Number(p.precioSugerido).toFixed(2)}</span>,
                        }))}
                        actions={[
                            { onClick: (item: any) => vm.openEdit(item), icon: <Icon icon="solar:pen-new-square-linear" className="text-blue-600" width={18} />, tooltip: "Editar" },
                            { onClick: (item: any) => { vm.setModalConfirmOpen(true); }, icon: <Icon icon="solar:trash-bin-trash-broken" className="text-red-500" width={18} />, tooltip: "Eliminar" }
                        ]}
                    />
                </div>
            )}
            <Pagination data={vm.plantillas} total={vm.total} currentPage={vm.page} setcurrentPage={vm.setPage} setitemsPerPage={vm.setLimit} indexOfFirstItem={(vm.page - 1) * vm.limit} indexOfLastItem={Math.min(vm.page * vm.limit, vm.total)} pages={Array.from({ length: Math.ceil(vm.total / vm.limit) }, (_, i) => i + 1)} />
            <Modal isOpenModal={vm.isModalOpen} closeModal={() => vm.setIsModalOpen(false)} title={vm.isEdit ? 'Editar Plantilla' : 'Nueva Plantilla'} width="600px">
                <form onSubmit={vm.handleSubmit} className="p-6 space-y-4">
                    <InputPro label="Nombre del Producto *" name="nombre" value={vm.form.nombre} onChange={(e: any) => vm.setForm({ ...vm.form, nombre: e.target.value })} isLabel placeholder="Ej. Coca Cola 3L" />
                    <InputPro label="Descripción" name="descripcion" value={vm.form.descripcion} onChange={(e: any) => vm.setForm({ ...vm.form, descripcion: e.target.value })} isLabel placeholder="Detalles del producto" type="textarea" />
                    <div className="grid grid-cols-2 gap-4">
                        <InputPro label="Marca" name="marca" value={vm.form.marca || ''} onChange={(e: any) => vm.setForm({ ...vm.form, marca: e.target.value })} isLabel placeholder="Ej. Gloria" />
                        <InputPro label="Categoría" name="categoria" value={vm.form.categoria} onChange={(e: any) => vm.setForm({ ...vm.form, categoria: e.target.value })} isLabel placeholder="Ej. Bebidas" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <InputPro label="Precio Sugerido (S/)" name="precioSugerido" type="number" value={vm.form.precioSugerido} onChange={(e: any) => vm.setForm({ ...vm.form, precioSugerido: Number(e.target.value) })} isLabel placeholder="0.00" />
                        <Select label="Rubro *" name="rubroId" options={vm.rubros.map((r: any) => ({ id: r.id, value: r.nombre }))} value={vm.rubros.find((r: any) => r.id === vm.form.rubroId)?.nombre || ""} onChange={(id: any) => vm.setForm({ ...vm.form, rubroId: Number(id) })} placeholder="Seleccione Rubro" error={!vm.form.rubroId ? "Requerido" : ""} />
                    </div>
                    <div className="border-t pt-4 mt-4">
                        <label className="block text-sm font-medium text-[#515C6C] mb-2">Imagen del Producto</label>
                        <input type="file" accept="image/*" className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer mb-4" onChange={e => vm.setSelectedFile(e.target.files ? e.target.files[0] : null)} />
                        {(vm.selectedFile || vm.form.imagenUrl) && <div className="w-full h-64 bg-gray-100 rounded-lg border border-dashed border-gray-300 flex items-center justify-center overflow-hidden relative"><img src={vm.selectedFile ? URL.createObjectURL(vm.selectedFile) : vm.form.imagenUrl} alt="Previsualización" className="max-h-full max-w-full object-contain" /><div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">Vista Previa</div></div>}
                        {!vm.selectedFile && !vm.form.imagenUrl && <div className="w-full h-32 bg-gray-50 rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-sm">Sin imagen seleccionada</div>}
                    </div>
                    <div className="flex justify-end gap-2 mt-6 pt-4 border-t"><Button type="button" onClick={() => vm.setIsModalOpen(false)} color="secondary" outline>Cancelar</Button><Button type="submit" color="primary">Guardar</Button></div>
                </form>
            </Modal>
            <ModalConfirm isOpenModal={vm.modalConfirmOpen} setIsOpenModal={vm.setModalConfirmOpen} confirmSubmit={vm.handleDelete} title="Eliminar Plantilla" information="¿Estás seguro? Esto no afectará a los productos ya importados por las empresas." />
            <Modal isOpenModal={vm.isModalImportOpen} closeModal={() => vm.setIsModalImportOpen(false)} title="Importar desde Empresa" width="500px">
                <div className="p-6 space-y-4">
                    <p className="text-sm text-gray-500 mb-4">Ingresa el ID de la empresa de origen para copiar sus productos al catálogo global.</p>
                    <Select label="Empresa de Origen" name="empresaIdToImport" options={vm.empresas.map((e: any) => ({ id: e.id, value: `${e.ruc} - ${e.razonSocial}` }))} value={vm.empresas.find((e: any) => e.id === vm.empresaIdToImport) ? `${vm.empresas.find((e: any) => e.id === vm.empresaIdToImport)?.ruc} - ${vm.empresas.find((e: any) => e.id === vm.empresaIdToImport)?.razonSocial}` : ""} onChange={(id: any) => vm.setEmpresaIdToImport(Number(id))} placeholder="Seleccione Empresa" error={!vm.empresaIdToImport ? "Requerido" : ""} />
                    <Select label="Asignar al Rubro *" name="rubroIdToImport" options={vm.rubros.map((r: any) => ({ id: r.id, value: r.nombre }))} value={vm.rubros.find((r: any) => r.id === vm.rubroIdToImport)?.nombre || ""} onChange={(id: any) => vm.setRubroIdToImport(Number(id))} placeholder="Seleccione Rubro Destino" error={!vm.rubroIdToImport ? "Requerido" : ""} />
                    <div className="flex justify-end gap-2 mt-6 pt-4 border-t"><Button type="button" onClick={() => vm.setIsModalImportOpen(false)} color="secondary" outline>Cancelar</Button><Button onClick={vm.handleImportFromCompany} color="primary" disabled={vm.loading || !vm.empresaIdToImport || !vm.rubroIdToImport}>{vm.loading ? "Importando..." : "Importar Productos"}</Button></div>
                </div>
            </Modal>
        </div>
    );
};

export default CatalogoGlobal;
