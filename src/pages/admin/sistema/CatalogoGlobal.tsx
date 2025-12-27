import { useEffect, useState } from "react";
import InputPro from "@/components/InputPro";
import Button from "@/components/Button";
import { Icon } from "@iconify/react"; // Keeping Iconify for general use or legacy

import apiClient from "@/utils/apiClient";
import useAlertStore from "@/zustand/alert";
import Pagination from "@/components/Pagination";
import ModalConfirm from "@/components/ModalConfirm";
import Modal from "@/components/Modal";
import Select from "@/components/Select";
import { useAuthStore } from "@/zustand/auth";
import DataTable from "@/components/Datatable";

interface Plantilla {
    id: number;
    nombre: string;
    descripcion: string;
    imagenUrl: string;
    precioSugerido: number;
    rubroId: number;
    categoria?: string;
    rubro?: { nombre: string; id: number };
    unidadConteo: string;
    marca?: string | null;
}

const CatalogoGlobal = () => {
    const [plantillas, setPlantillas] = useState<Plantilla[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(50);
    const [total, setTotal] = useState(0);
    const [rubros, setRubros] = useState<any[]>([]);
    const [selectedRubro, setSelectedRubro] = useState<number | undefined>(undefined);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [form, setForm] = useState<Partial<Plantilla>>({});
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [modalConfirmOpen, setModalConfirmOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    // Import Modal States
    const [isModalImportOpen, setIsModalImportOpen] = useState(false);
    const [empresaIdToImport, setEmpresaIdToImport] = useState<number | undefined>(undefined);
    const [rubroIdToImport, setRubroIdToImport] = useState<number | undefined>(undefined);

    // AI Categorization
    const [categorizando, setCategorizando] = useState(false);

    const { alert } = useAlertStore();
    const { auth } = useAuthStore();

    useEffect(() => {
        loadRubros();
    }, []);

    useEffect(() => {
        loadPlantillas();
    }, [page, search, selectedRubro]);

    const loadRubros = async () => {
        try {
            const response = await apiClient.get('/rubro');
            console.log(response)
            const data = response.data;
            // Handle { data: [...] } or [...]
            const list = Array.isArray(data) ? data : (data?.data || []);
            setRubros(list);
            console.log("Rubros loaded:", list);
        } catch (error) {
            console.error(error);
        }
    };

    const loadPlantillas = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/plantillas', {
                params: { page, limit, search, rubroId: selectedRubro }
            });
            const body = response.data;
            const list = Array.isArray(body?.data?.data) ? body.data?.data : [];
            setPlantillas(list);
            setTotal(body?.data?.total || 0);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            let plantillaId: number | null | undefined = isEdit && form.id ? form.id : null;

            const payload = {
                nombre: form.nombre,
                descripcion: form.descripcion,
                precioSugerido: Number(form.precioSugerido),
                rubroId: Number(form.rubroId),
                categoria: form.categoria,
                imagenUrl: form.imagenUrl,
                unidadConteo: form.unidadConteo || 'NIU',
                marca: form.marca,
            };

            if (isEdit && form.id) {
                await apiClient.post(`/plantillas/${form.id}`, payload);
                alert("Plantilla actualizada", "success");
            } else {
                const { data } = await apiClient.post('/plantillas', payload);
                plantillaId = data.id;
                alert("Plantilla creada", "success");
            }

            if (selectedFile && plantillaId) {
                const formData = new FormData();
                formData.append('file', selectedFile);
                await apiClient.post(`/plantillas/${plantillaId}/imagen`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                alert("Imagen subida correctamente", "success");
            }

            setIsModalOpen(false);
            setSelectedFile(null);
            loadPlantillas();
        } catch (error: any) {
            console.error("Error submitting form:", error);
            alert(error.response?.data?.message || "Error al guardar (ver consola)", "error");
        }
    };
    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await apiClient.post(`/plantillas/${deleteId}/delete`);
            alert("Plantilla eliminada", "success");
            setModalConfirmOpen(false);
            loadPlantillas();
        } catch (error: any) {
            alert(error.response?.data?.message || "Error al eliminar", "error");
        }
    };

    const handleImportFromCompany = async () => {
        if (!empresaIdToImport || !rubroIdToImport) return;
        try {
            setLoading(true);
            const { data } = await apiClient.post('/plantillas/importar-de-empresa', {
                empresaId: empresaIdToImport,
                rubroId: rubroIdToImport
            });
            alert(data.message || `Importación completada: ${data.importados} productos`, "success");
            setIsModalImportOpen(false);
            setEmpresaIdToImport(undefined);
            setRubroIdToImport(undefined);
            loadPlantillas();
        } catch (error: any) {
            alert(error.response?.data?.message || "Error al importar", "error");
        } finally {
            setLoading(false);
        }
    };

    const openNew = () => {
        setForm({ rubroId: rubros[0]?.id });
        setSelectedFile(null);
        setIsEdit(false);
        setIsModalOpen(true);
    };

    const openEdit = (item: any) => {
        const original = plantillas.find(p => p.id === item.id);
        if (original) {
            setForm(original);
            setSelectedFile(null);
            setIsEdit(true);
            setIsModalOpen(true);
        }
    };

    const handleCategorizarIA = async () => {
        try {
            setCategorizando(true);
            const { data } = await apiClient.post('/plantillas/categorizar-ia', {
                rubroId: selectedRubro,
                soloSinCategoria: false  // Recategorizar TODOS los productos
            });

            if (data.success) {
                alert(`✅ ${data.message}. Procesados: ${data.procesados} de ${data.total}`, "success");
                loadPlantillas();
            } else {
                alert(data.message || "Error al categorizar", "error");
            }
        } catch (error: any) {
            console.error("Error categorizando:", error);
            alert(error.response?.data?.message || "Error al categorizar con IA", "error");
        } finally {
            setCategorizando(false);
        }
    };

    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [actionLoading, setActionLoading] = useState(false);
    const [buscandoImagenes, setBuscandoImagenes] = useState(false);

    const toggleSelect = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === plantillas.length && plantillas.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(plantillas.map(p => p.id));
        }
    };

    const handleBuscarImagenesFaltantes = async () => {
        const sinImagen = plantillas.filter(p => !p.imagenUrl);
        if (sinImagen.length === 0) {
            alert("No hay productos sin imagen en esta página.", "info");
            return;
        }

        if (!window.confirm(`Se buscarán imágenes para ${sinImagen.length} productos. ¿Continuar?`)) return;

        setBuscandoImagenes(true);
        let count = 0;

        try {
            for (const p of sinImagen) {
                try {
                    const { data } = await apiClient.post('/plantillas/search-image', {
                        id: p.id,
                        nombre: p.nombre
                    });

                    if (data.success && data.url) {
                        count++;
                        setPlantillas(prev => prev.map(item =>
                            item.id === p.id ? { ...item, imagenUrl: data.url } : item
                        ));
                    }
                    await new Promise(r => setTimeout(r, 1000));
                } catch (error) {
                    console.error("Error buscando imagen:", error);
                }
            }
            alert(`Proceso finalizado. Se encontraron ${count} imágenes nuevas.`, "success");
        } catch (e) {
            console.error(e);
        } finally {
            setBuscandoImagenes(false);
        }
    };

    const handleBulkDeleteImages = async () => {
        if (!window.confirm(`¿Estás seguro de eliminar las IMÁGENES de ${selectedIds.length} productos?\nEsta acción no se puede deshacer.`)) return;
        try {
            setActionLoading(true);
            await apiClient.post('/plantillas/masivo/delete-images', { ids: selectedIds });
            alert("Imágenes eliminadas correctamente", "success");
            setSelectedIds([]);
            loadPlantillas();
        } catch (error: any) {
            alert(error.response?.data?.message || "Error al eliminar imágenes", "error");
        } finally {
            setActionLoading(false);
        }
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`¿Estás seguro de ELIMINAR ${selectedIds.length} PRODUCTOS del catálogo?\nEsta acción es irreversible y eliminará las plantillas.`)) return;
        try {
            setActionLoading(true);
            await apiClient.post('/plantillas/masivo/delete', { ids: selectedIds });
            alert("Productos eliminados correctamente", "success");
            setSelectedIds([]);
            loadPlantillas();
        } catch (error: any) {
            alert(error.response?.data?.message || "Error al eliminar productos", "error");
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow m-4">
            <h1 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
                <Icon icon="solar:magnifer-linear" className="text-blue-600" />
                Catálogo Global de Productos
            </h1>

            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                    <InputPro
                        name="search"
                        value={search}
                        onChange={(e: any) => setSearch(e.target.value)}
                        label="Buscar plantilla..."
                        placeholder="Nombre, descripción o categoría"
                        isLabel
                    />
                </div>
                <div className="w-full md:w-64">
                    <Select
                        name="rubro"
                        label="Filtrar por Rubro"
                        options={rubros.map(r => ({ id: r.id, value: r.nombre }))}
                        value={rubros.find(r => r.id === selectedRubro)?.nombre || ""}
                        onChange={(id) => setSelectedRubro(Number(id))}
                        placeholder="Todos los rubros"
                        error=""
                    />
                </div>
                <div className="flex items-end gap-2">
                    {selectedIds.length > 0 ? (
                        <>
                            <span className="text-sm text-gray-600 font-medium mr-2">
                                {selectedIds.length} de {plantillas.length} seleccionados
                            </span>
                            <Button
                                onClick={handleBulkDeleteImages}
                                disabled={actionLoading}
                                className="bg-orange-500 text-white border-0 hover:bg-orange-600"
                            >
                                <Icon icon="solar:gallery-linear" className="mr-2" />
                                Borrar Img ({selectedIds.length})
                            </Button>
                            <Button
                                onClick={handleBulkDelete}
                                disabled={actionLoading}
                                color="danger"
                            >
                                <Icon icon="solar:trash-bin-trash-broken" className="mr-2" />
                                Eliminar ({selectedIds.length})
                            </Button>
                            <Button
                                onClick={() => setSelectedIds([])}
                                color="secondary"
                                outline
                            >
                                Cancelar
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                onClick={toggleSelectAll}
                                color="secondary"
                                outline
                                disabled={plantillas.length === 0}
                            >
                                <Icon icon="solar:checklist-minimalistic-linear" className="mr-2" />
                                Seleccionar Todo ({plantillas.length})
                            </Button>
                            <Button
                                onClick={handleBuscarImagenesFaltantes}
                                color="secondary"
                                outline
                                disabled={categorizando || buscandoImagenes}
                                className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 hover:from-blue-600 hover:to-cyan-600"
                            >
                                {buscandoImagenes ? (
                                    <>
                                        <Icon icon="mdi:loading" className="mr-2 animate-spin" />
                                        Buscando...
                                    </>
                                ) : (
                                    <>
                                        <Icon icon="solar:gallery-add-linear" className="mr-2" />
                                        Auto-Imágenes
                                    </>
                                )}
                            </Button>
                            <Button
                                onClick={handleCategorizarIA}
                                color="secondary"
                                outline
                                disabled={categorizando || buscandoImagenes}
                                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 hover:from-purple-600 hover:to-pink-600"
                            >
                                {categorizando ? (
                                    <>
                                        <Icon icon="mdi:loading" className="mr-2 animate-spin" />
                                        Categorizando...
                                    </>
                                ) : (
                                    <>
                                        <Icon icon="solar:magic-stick-3-linear" className="mr-2" />
                                        Auto-Categoría
                                    </>
                                )}
                            </Button>
                            <Button onClick={() => setIsModalImportOpen(true)} color="secondary" outline>
                                <Icon icon="solar:download-minimalistic-linear" className="mr-2" /> Importar
                            </Button>
                            <Button onClick={openNew} color="primary">
                                <Icon icon="solar:add-circle-linear" className="mr-2" /> Nuevo
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-10"><span className="loading loading-spinner text-primary"></span></div>
            ) : (
                <div className="mt-4">
                    <DataTable
                        headerColumns={['#', 'Imagen', 'Nombre', 'Marca', 'Categoría', 'Rubro', 'Precio Sug.']}
                        bodyData={plantillas.map(p => ({
                            ...p,
                            '#': (
                                <div className="flex items-center justify-center">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(p.id)}
                                        onChange={() => toggleSelect(p.id)}
                                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                                    />
                                </div>
                            ),
                            'imagen': p.imagenUrl ? (
                                <div className="h-12 w-12 bg-white border border-gray-200 rounded-md overflow-hidden flex items-center justify-center shadow-sm">
                                    <img
                                        src={p.imagenUrl}
                                        alt={p.nombre}
                                        className="h-full w-full object-contain"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = 'none';
                                            target.parentElement!.innerHTML = '<span class="text-[10px] text-gray-300">N/A</span>';
                                        }}
                                    />
                                </div>
                            ) : (
                                <div className="h-12 w-12 bg-gray-50 border border-gray-100 rounded-md flex items-center justify-center">
                                    <Icon icon="solar:gallery-linear" className="text-gray-300 w-5 h-5" />
                                </div>
                            ),
                            'nombre': p.nombre,
                            'marca': p.marca ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                                    {p.marca}
                                </span>
                            ) : (
                                <span className="text-gray-300 text-xs italic">S/M</span>
                            ),
                            'categoría': p.categoria ? <span className="bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-0.5 rounded-full border border-blue-100">{p.categoria}</span> : '-',
                            'rubro': p.rubro?.nombre || '-',
                            'precio sug.': <span className="font-semibold text-gray-700">S/ {Number(p.precioSugerido).toFixed(2)}</span>,
                        }))}
                        actions={[
                            {
                                onClick: (item: any) => openEdit(item),
                                icon: <Icon icon="solar:pen-new-square-linear" className="text-blue-600" width={18} />,
                                tooltip: "Editar"
                            },
                            {
                                onClick: (item: any) => { setDeleteId(item.id); setModalConfirmOpen(true); },
                                icon: <Icon icon="solar:trash-bin-trash-broken" className="text-red-500" width={18} />,
                                tooltip: "Eliminar"
                            }
                        ]}
                    />
                </div>
            )}

            <Pagination
                data={plantillas}
                total={total}
                currentPage={page}
                setcurrentPage={setPage}
                setitemsPerPage={setLimit}
                indexOfFirstItem={(page - 1) * limit}
                indexOfLastItem={Math.min(page * limit, total)}
                pages={Array.from({ length: Math.ceil(total / limit) }, (_, i) => i + 1)}
            />

            <Modal isOpenModal={isModalOpen} closeModal={() => setIsModalOpen(false)} title={isEdit ? 'Editar Plantilla' : 'Nueva Plantilla'} width="600px">
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <InputPro
                        label="Nombre del Producto *"
                        name="nombre"
                        value={form.nombre}
                        onChange={(e: any) => setForm({ ...form, nombre: e.target.value })}
                        isLabel
                        placeholder="Ej. Coca Cola 3L"
                    />

                    <InputPro
                        label="Descripción"
                        name="descripcion"
                        value={form.descripcion}
                        onChange={(e: any) => setForm({ ...form, descripcion: e.target.value })}
                        isLabel
                        placeholder="Detalles del producto"
                        type="textarea"
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <InputPro
                            label="Marca"
                            name="marca"
                            value={form.marca || ''}
                            onChange={(e: any) => setForm({ ...form, marca: e.target.value })}
                            isLabel
                            placeholder="Ej. Gloria"
                        />
                        <InputPro
                            label="Categoría"
                            name="categoria"
                            value={form.categoria}
                            onChange={(e: any) => setForm({ ...form, categoria: e.target.value })}
                            isLabel
                            placeholder="Ej. Bebidas"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <InputPro
                            label="Precio Sugerido (S/)"
                            name="precioSugerido"
                            type="number"
                            value={form.precioSugerido}
                            onChange={(e: any) => setForm({ ...form, precioSugerido: Number(e.target.value) })}
                            isLabel
                            placeholder="0.00"
                        />
                        <Select
                            label="Rubro *"
                            name="rubroId"
                            options={rubros.map(r => ({ id: r.id, value: r.nombre }))}
                            value={rubros.find(r => r.id === form.rubroId)?.nombre || ""}
                            onChange={(id) => setForm({ ...form, rubroId: Number(id) })}
                            placeholder="Seleccione Rubro"
                            error={!form.rubroId ? "Requerido" : ""}
                        />
                    </div>

                    <div className="border-t pt-4 mt-4">
                        <label className="block text-sm font-medium text-[#515C6C] mb-2">Imagen del Producto</label>

                        <div className="w-full">
                            <input
                                type="file"
                                accept="image/*"
                                className="block w-full text-sm text-slate-500
                                  file:mr-4 file:py-2 file:px-4
                                  file:rounded-full file:border-0
                                  file:text-sm file:font-semibold
                                  file:bg-blue-50 file:text-blue-700
                                  hover:file:bg-blue-100
                                  cursor-pointer mb-4"
                                onChange={e => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                            />

                            {(selectedFile || form.imagenUrl) && (
                                <div className="w-full h-64 bg-gray-100 rounded-lg border border-dashed border-gray-300 flex items-center justify-center overflow-hidden relative">
                                    <img
                                        src={selectedFile ? URL.createObjectURL(selectedFile) : form.imagenUrl}
                                        alt="Previsualización"
                                        className="max-h-full max-w-full object-contain"
                                    />
                                    <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                                        Vista Previa
                                    </div>
                                </div>
                            )}

                            {!selectedFile && !form.imagenUrl && (
                                <div className="w-full h-32 bg-gray-50 rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-sm">
                                    Sin imagen seleccionada
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                        <Button type="button" onClick={() => setIsModalOpen(false)} color="secondary" outline>Cancelar</Button>
                        <Button type="submit" color="primary">Guardar</Button>
                    </div>
                </form>
            </Modal>

            <ModalConfirm
                isOpenModal={modalConfirmOpen}
                setIsOpenModal={setModalConfirmOpen}
                confirmSubmit={handleDelete}
                title="Eliminar Plantilla"
                information="¿Estás seguro? Esto no afectará a los productos ya importados por las empresas."
            />

            <Modal isOpenModal={isModalImportOpen} closeModal={() => setIsModalImportOpen(false)} title="Importar desde Empresa" width="500px">
                <div className="p-6 space-y-4">
                    <p className="text-sm text-gray-500 mb-4">
                        Ingresa el ID de la empresa de origen para copiar sus productos al catálogo global.
                        Se usarán los códigos de producto para evitar duplicados.
                    </p>

                    <InputPro
                        label="Empresa ID"
                        name="empresaIdToImport"
                        type="number"
                        value={empresaIdToImport}
                        onChange={(e: any) => setEmpresaIdToImport(Number(e.target.value))}
                        isLabel
                        placeholder="Ej. 1"
                    />

                    <Select
                        label="Asignar al Rubro *"
                        name="rubroIdToImport"
                        options={rubros.map(r => ({ id: r.id, value: r.nombre }))}
                        value={rubros.find(r => r.id === rubroIdToImport)?.nombre || ""}
                        onChange={(id) => setRubroIdToImport(Number(id))}
                        placeholder="Seleccione Rubro Destino"
                        error={!rubroIdToImport ? "Requerido" : ""}
                    />

                    <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                        <Button type="button" onClick={() => setIsModalImportOpen(false)} color="secondary" outline>Cancelar</Button>
                        <Button onClick={handleImportFromCompany} color="primary" disabled={loading || !empresaIdToImport || !rubroIdToImport}>
                            {loading ? "Importando..." : "Importar Productos"}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default CatalogoGlobal;
