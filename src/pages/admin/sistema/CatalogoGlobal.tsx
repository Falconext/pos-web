import { ChangeEvent, FormEvent } from "react";
import { useCatalogoGlobalViewModel } from "@/features/admin/sistema/useCatalogoGlobalViewModel";
import Button from "@/components/Button";
import { Icon } from "@iconify/react";
import Pagination from "@/components/Pagination";
import ModalConfirm from "@/components/ModalConfirm";
import Modal from "@/components/Modal";

type CatalogoPlantilla = {
    id: number;
    nombre: string;
    descripcion?: string;
    marca?: string;
    categoria?: string;
    imagenUrl?: string;
    precioSugerido?: number | string;
    rubro?: { nombre?: string };
};

type RubroOption = {
    id: number;
    nombre: string;
};

type EmpresaOption = {
    id: number;
    ruc?: string;
    razonSocial?: string;
};

const inputClass =
    "h-11 w-full rounded-xl border border-slate-300 dark:border-slate-700/80 bg-white dark:bg-slate-900/70 px-4 text-sm font-medium text-slate-800 dark:text-slate-100 outline-none transition placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10";

const labelClass = "mb-2 block text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400";

const textareaClass = `${inputClass} h-24 resize-none py-3`;

const CatalogoGlobal = () => {
    const vm = useCatalogoGlobalViewModel();
    const plantillas = (vm.plantillas || []) as CatalogoPlantilla[];
    const rubros = (vm.rubros || []) as RubroOption[];
    const empresas = (vm.empresas || []) as EmpresaOption[];
    const totalSinImagen = plantillas.filter((p) => !p.imagenUrl).length;

    const selectedRubro = rubros.find((r) => r.id === vm.rubroId)?.nombre || "Todos";

    const handleRubroFilter = (event: ChangeEvent<HTMLSelectElement>) => {
        vm.setRubroId(event.target.value ? Number(event.target.value) : undefined);
    };

    const renderImage = (plantilla: CatalogoPlantilla) => {
        if (plantilla.imagenUrl) {
            return (
                <a
                    href={plantilla.imagenUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white p-1 shadow-sm"
                >
                    <img
                        src={plantilla.imagenUrl}
                        alt={plantilla.nombre}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-contain"
                    />
                </a>
            );
        }

        if (vm.processingId === plantilla.id) {
            return (
                <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-blue-400/30 bg-blue-500/10">
                    <Icon icon="mdi:loading" className="h-6 w-6 animate-spin text-blue-500 dark:text-blue-300" />
                </div>
            );
        }

        return (
            <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-500">
                <Icon icon="solar:gallery-linear" className="h-6 w-6" />
            </div>
        );
    };

    return (
        <div className="min-h-screen px-2 pb-5 text-slate-800 dark:text-slate-100">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-violet-700 dark:text-violet-200">
                        <Icon icon="solar:database-bold-duotone" className="text-violet-500 dark:text-violet-300" />
                        Sistema
                    </div>
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Catálogo Global</h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Biblioteca maestra para importar productos por rubro, imagen y categoría.
                    </p>
                </div>

                <Button
                    onClick={vm.openNew}
                    color="secondary"
                    className="flex items-center gap-2 !border-0 !bg-violet-600 !text-white shadow-lg shadow-violet-950/30"
                >
                    <Icon icon="solar:add-circle-bold" className="text-lg" />
                    Nueva plantilla
                </Button>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] shadow-sm dark:shadow-2xl dark:shadow-black/20">
                <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 p-5">
                    <div className="grid gap-4 xl:grid-cols-[1fr_260px_auto]">
                        <label className="block">
                            <span className={labelClass}>Buscar plantilla</span>
                            <div className="relative">
                                <Icon icon="solar:magnifer-linear" className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                                <input
                                    value={vm.search}
                                    onChange={(event) => vm.setSearch(event.target.value)}
                                    placeholder="Nombre, marca, descripción o categoría"
                                    className={`${inputClass} pl-11`}
                                />
                            </div>
                        </label>

                        <label className="block">
                            <span className={labelClass}>Rubro</span>
                            <select value={vm.rubroId || ""} onChange={handleRubroFilter} className={inputClass}>
                                <option value="">Todos los rubros</option>
                                {rubros.map((rubro) => (
                                    <option key={rubro.id} value={rubro.id}>
                                        {rubro.nombre}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <div className="flex flex-wrap items-end gap-2">
                            {vm.selectedIds.length > 0 ? (
                                <>
                                    <div className="flex h-11 items-center rounded-xl border border-violet-500/25 bg-violet-500/10 px-3 text-sm font-semibold text-violet-700 dark:text-violet-100">
                                        {vm.selectedIds.length} seleccionados
                                    </div>
                                    <Button onClick={vm.handleBulkDeleteImages} disabled={vm.actionLoading} className="!border-orange-500/30 !bg-orange-500/15 !text-orange-700 dark:!text-orange-200 hover:!bg-orange-500/25">
                                        <Icon icon="solar:gallery-remove-linear" className="mr-2" />
                                        Borrar imágenes
                                    </Button>
                                    <Button onClick={vm.handleBulkDelete} disabled={vm.actionLoading} color="danger">
                                        <Icon icon="solar:trash-bin-trash-broken" className="mr-2" />
                                        Eliminar
                                    </Button>
                                    <Button onClick={vm.clearSelection} color="secondary" outline>
                                        Cancelar
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button onClick={vm.toggleSelectAll} color="secondary" outline disabled={plantillas.length === 0}>
                                        <Icon icon="solar:checklist-minimalistic-linear" className="mr-2" />
                                        Seleccionar
                                    </Button>
                                    <Button
                                        onClick={vm.handleBuscarImagenesFaltantes}
                                        color="secondary"
                                        outline
                                        disabled={vm.categorizando || vm.buscandoImagenes}
                                        className="!border-cyan-400/20 !bg-cyan-500/10 !text-cyan-700 dark:!text-cyan-100 hover:!bg-cyan-500/20"
                                    >
                                        {vm.buscandoImagenes ? (
                                            <>
                                                <Icon icon="mdi:loading" className="mr-2 animate-spin" />
                                                Buscando
                                            </>
                                        ) : (
                                            <>
                                                <Icon icon="solar:gallery-add-linear" className="mr-2" />
                                                Auto-imágenes
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        onClick={vm.handleCategorizarIA}
                                        color="secondary"
                                        outline
                                        disabled={vm.categorizando || vm.buscandoImagenes}
                                        className="!border-fuchsia-400/20 !bg-fuchsia-500/10 !text-fuchsia-700 dark:!text-fuchsia-100 hover:!bg-fuchsia-500/20"
                                    >
                                        {vm.categorizando ? (
                                            <>
                                                <Icon icon="mdi:loading" className="mr-2 animate-spin" />
                                                Categorizando
                                            </>
                                        ) : (
                                            <>
                                                <Icon icon="solar:magic-stick-3-linear" className="mr-2" />
                                                Auto-categoría
                                            </>
                                        )}
                                    </Button>
                                    <Button onClick={() => vm.setIsModalImportOpen(true)} color="secondary" outline>
                                        <Icon icon="solar:download-minimalistic-linear" className="mr-2" />
                                        Importar
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-4">
                        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-900/60 p-3">
                            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Plantillas</p>
                            <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{vm.total}</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-900/60 p-3">
                            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Página actual</p>
                            <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{plantillas.length}</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-900/60 p-3">
                            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Sin imagen</p>
                            <p className="mt-1 text-xl font-bold text-cyan-600 dark:text-cyan-200">{totalSinImagen}</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-900/60 p-3">
                            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Filtro</p>
                            <p className="mt-1 truncate text-sm font-bold text-violet-600 dark:text-violet-200">{selectedRubro}</p>
                        </div>
                    </div>
                </div>

                <div className="p-4">
                    {vm.loading ? (
                        <div className="flex min-h-[320px] items-center justify-center">
                            <Icon icon="mdi:loading" className="h-8 w-8 animate-spin text-violet-500 dark:text-violet-300" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                            <table className="min-w-[1120px] w-full border-collapse bg-white dark:bg-slate-950/20 text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 text-left text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                                        <th className="w-12 px-4 py-4">
                                            <input
                                                type="checkbox"
                                                checked={plantillas.length > 0 && vm.selectedIds.length === plantillas.length}
                                                onChange={vm.toggleSelectAll}
                                                className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-violet-500"
                                            />
                                        </th>
                                        <th className="px-4 py-4">Imagen</th>
                                        <th className="px-4 py-4">Producto</th>
                                        <th className="px-4 py-4">Marca</th>
                                        <th className="px-4 py-4">Categoría</th>
                                        <th className="px-4 py-4">Rubro</th>
                                        <th className="px-4 py-4 text-right">Precio sug.</th>
                                        <th className="px-4 py-4 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                                    {plantillas.map((plantilla) => (
                                        <tr key={plantilla.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-800/35">
                                            <td className="px-4 py-4">
                                                <input
                                                    type="checkbox"
                                                    checked={vm.selectedIds.includes(plantilla.id)}
                                                    onChange={() => vm.toggleSelect(plantilla.id)}
                                                    className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-violet-500"
                                                />
                                            </td>
                                            <td className="px-4 py-4">{renderImage(plantilla)}</td>
                                            <td className="max-w-[360px] px-4 py-4">
                                                <p className="font-semibold text-slate-900 dark:text-white">{plantilla.nombre}</p>
                                                <p className="mt-1 line-clamp-2 text-xs text-slate-400 dark:text-slate-500">{plantilla.descripcion || "Sin descripción"}</p>
                                            </td>
                                            <td className="px-4 py-4">
                                                {plantilla.marca ? (
                                                    <span className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                                                        {plantilla.marca}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs italic text-slate-400 dark:text-slate-600">Sin marca</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4">
                                                {plantilla.categoria ? (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/10 px-2.5 py-1 text-xs font-semibold text-violet-700 dark:text-violet-200">
                                                        <Icon icon="solar:tag-linear" width={12} />
                                                        {plantilla.categoria}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 dark:text-slate-600">-</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{plantilla.rubro?.nombre || "-"}</td>
                                            <td className="px-4 py-4 text-right font-bold text-emerald-600 dark:text-emerald-300">
                                                S/ {Number(plantilla.precioSugerido || 0).toFixed(2)}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => vm.openEdit(plantilla)}
                                                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-400/20 bg-blue-500/10 text-blue-600 dark:text-blue-200 transition hover:bg-blue-500/20"
                                                        title="Editar"
                                                    >
                                                        <Icon icon="solar:pen-new-square-linear" width={18} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => vm.openDelete(plantilla.id)}
                                                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-400/20 bg-red-500/10 text-red-600 dark:text-red-200 transition hover:bg-red-500/20"
                                                        title="Eliminar"
                                                    >
                                                        <Icon icon="solar:trash-bin-trash-broken" width={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {plantillas.length === 0 && (
                                        <tr>
                                            <td colSpan={8} className="px-4 py-16 text-center">
                                                <Icon icon="solar:box-minimalistic-linear" className="mx-auto mb-3 h-10 w-10 text-slate-400 dark:text-slate-600" />
                                                <p className="font-semibold text-slate-600 dark:text-slate-300">No hay plantillas para mostrar</p>
                                                <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">Ajusta los filtros o crea una nueva plantilla global.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="mt-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40 px-2 py-3">
                        <Pagination
                            data={plantillas}
                            total={vm.total}
                            currentPage={vm.page}
                            setcurrentPage={vm.setPage}
                            setitemsPerPage={vm.setLimit}
                            indexOfFirstItem={(vm.page - 1) * vm.limit}
                            indexOfLastItem={Math.min(vm.page * vm.limit, vm.total)}
                            pages={Array.from({ length: Math.ceil(vm.total / vm.limit) }, (_, i) => i + 1)}
                        />
                    </div>
                </div>
            </div>

            <Modal isOpenModal={vm.isModalOpen} closeModal={() => vm.setIsModalOpen(false)} title={vm.isEdit ? "Editar plantilla" : "Nueva plantilla"} width="640px">
                <form onSubmit={(event: FormEvent) => vm.handleSubmit(event)} className="space-y-4 p-6">
                    <label className="block">
                        <span className={labelClass}>Nombre del producto *</span>
                        <input value={vm.form.nombre || ""} onChange={(event) => vm.setForm({ ...vm.form, nombre: event.target.value })} className={inputClass} placeholder="Ej. Coca Cola 3L" />
                    </label>
                    <label className="block">
                        <span className={labelClass}>Descripción</span>
                        <textarea value={vm.form.descripcion || ""} onChange={(event) => vm.setForm({ ...vm.form, descripcion: event.target.value })} className={textareaClass} placeholder="Detalles del producto" />
                    </label>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block">
                            <span className={labelClass}>Marca</span>
                            <input value={vm.form.marca || ""} onChange={(event) => vm.setForm({ ...vm.form, marca: event.target.value })} className={inputClass} placeholder="Ej. Gloria" />
                        </label>
                        <label className="block">
                            <span className={labelClass}>Categoría</span>
                            <input value={vm.form.categoria || ""} onChange={(event) => vm.setForm({ ...vm.form, categoria: event.target.value })} className={inputClass} placeholder="Ej. Bebidas" />
                        </label>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block">
                            <span className={labelClass}>Precio sugerido (S/)</span>
                            <input
                                type="number"
                                value={vm.form.precioSugerido || 0}
                                onChange={(event) => vm.setForm({ ...vm.form, precioSugerido: Number(event.target.value) })}
                                className={inputClass}
                                placeholder="0.00"
                            />
                        </label>
                        <label className="block">
                            <span className={labelClass}>Rubro *</span>
                            <select value={vm.form.rubroId || ""} onChange={(event) => vm.setForm({ ...vm.form, rubroId: Number(event.target.value) })} className={inputClass}>
                                <option value="">Seleccione rubro</option>
                                {rubros.map((rubro) => (
                                    <option key={rubro.id} value={rubro.id}>
                                        {rubro.nombre}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4">
                        <div className="mb-3 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-slate-800 dark:text-white">Imagen del producto</p>
                                <p className="text-xs text-slate-500">JPG, PNG o WebP para la plantilla global.</p>
                            </div>
                            <Icon icon="solar:gallery-wide-bold-duotone" className="h-7 w-7 text-violet-500 dark:text-violet-300" />
                        </div>
                        <input
                            type="file"
                            accept="image/*"
                            className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-xl file:border-0 file:bg-violet-600 file:px-4 file:py-2 file:text-sm file:font-bold file:text-white hover:file:bg-violet-500"
                            onChange={(event) => vm.setSelectedFile(event.target.files ? event.target.files[0] : null)}
                        />
                        {(vm.selectedFile || vm.form.imagenUrl) ? (
                            <div className="relative mt-4 flex h-56 items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-950">
                                <img
                                    src={vm.selectedFile ? URL.createObjectURL(vm.selectedFile) : vm.form.imagenUrl}
                                    alt="Previsualización"
                                    className="max-h-full max-w-full object-contain p-3"
                                />
                                <span className="absolute bottom-3 right-3 rounded-lg bg-black/70 px-2 py-1 text-xs font-semibold text-white">Vista previa</span>
                            </div>
                        ) : (
                            <div className="mt-4 flex h-32 items-center justify-center rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-950 text-sm text-slate-400 dark:text-slate-500">
                                Sin imagen seleccionada
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800 pt-4">
                        <Button type="button" onClick={() => vm.setIsModalOpen(false)} color="secondary" outline>
                            Cancelar
                        </Button>
                        <Button type="submit" color="primary">
                            Guardar
                        </Button>
                    </div>
                </form>
            </Modal>

            <ModalConfirm
                isOpenModal={vm.modalConfirmOpen}
                setIsOpenModal={vm.setModalConfirmOpen}
                confirmSubmit={vm.handleDelete}
                title="Eliminar plantilla"
                information="¿Estás seguro? Esto no afectará a los productos ya importados por las empresas."
            />

            <Modal isOpenModal={vm.isModalImportOpen} closeModal={() => vm.setIsModalImportOpen(false)} title="Importar desde empresa" width="520px">
                <div className="space-y-4 p-6">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Copia productos de una empresa hacia el catálogo global y asígnalos a un rubro maestro.</p>
                    <label className="block">
                        <span className={labelClass}>Empresa de origen</span>
                        <select value={vm.empresaIdToImport || ""} onChange={(event) => vm.setEmpresaIdToImport(Number(event.target.value))} className={inputClass}>
                            <option value="">Seleccione empresa</option>
                            {empresas.map((empresa) => (
                                <option key={empresa.id} value={empresa.id}>
                                    {empresa.ruc} - {empresa.razonSocial}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="block">
                        <span className={labelClass}>Rubro destino *</span>
                        <select value={vm.rubroIdToImport || ""} onChange={(event) => vm.setRubroIdToImport(Number(event.target.value))} className={inputClass}>
                            <option value="">Seleccione rubro</option>
                            {rubros.map((rubro) => (
                                <option key={rubro.id} value={rubro.id}>
                                    {rubro.nombre}
                                </option>
                            ))}
                        </select>
                    </label>
                    <div className="flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800 pt-4">
                        <Button type="button" onClick={() => vm.setIsModalImportOpen(false)} color="secondary" outline>
                            Cancelar
                        </Button>
                        <Button onClick={vm.handleImportFromCompany} color="primary" disabled={vm.loading || !vm.empresaIdToImport || !vm.rubroIdToImport}>
                            {vm.loading ? "Importando..." : "Importar productos"}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default CatalogoGlobal;
