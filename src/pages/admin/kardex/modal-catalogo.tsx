
import { useEffect, useState } from "react";
import Button from "@/components/Button";
import { useAuthStore } from "@/zustand/auth";
import apiClient from "@/utils/apiClient";
import { Icon } from "@iconify/react";
import useAlertStore from "@/zustand/alert";
import DataTable from "@/components/Datatable";
import InputPro from "@/components/InputPro";
import Pagination from "@/components/Pagination";
import ModalConfirm from "@/components/ModalConfirm";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function ModalCatalogo({ isOpen, onClose, onSuccess }: Props) {
    const { auth } = useAuthStore();
    const [plantillas, setPlantillas] = useState<any[]>([]);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);
    const [importing, setImporting] = useState(false);

    // Pagination & Search
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState("");

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (isOpen) {
                setPage(1); // Reset page on search
                loadPlantillas();
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [search, isOpen]); // Listen to search change

    // Listen to page change
    useEffect(() => {
        if (isOpen) {
            loadPlantillas();
        }
    }, [page, isOpen]);

    // Reset when modal opens
    useEffect(() => {
        if (isOpen) {
            setPage(1);
            setSearch("");
            setSelectedIds([]);
            loadPlantillas();
        }
    }, [isOpen]);

    const loadPlantillas = async () => {
        if (!auth?.empresa?.rubroId) return;
        try {
            setLoading(true);
            const { data } = await apiClient.get('/plantillas', {
                params: {
                    page,
                    limit,
                    search,
                    rubroId: auth.empresa.rubroId
                }
            });
            const body = data?.data || data; // Handle potential wrapper
            const list = Array.isArray(body?.data) ? body.data : (Array.isArray(body) ? body : []);
            setPlantillas(list);
            setTotal(body?.total || 0);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

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

    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    const handleImport = async () => {
        if (selectedIds.length === 0) return;
        try {
            setImporting(true);
            await apiClient.post('/plantillas/importar', { plantillasIds: selectedIds });
            useAlertStore.getState().alert(`${selectedIds.length} productos importados correctamente`, "success");
            onSuccess();
            onClose();
            setSelectedIds([]);
        } catch (error: any) {
            useAlertStore.getState().alert(error.response?.data?.message || "Error al importar", "error");
        } finally {
            setImporting(false);
        }
    };

    const handleImportAllClick = () => {
        setIsConfirmOpen(true);
    };

    const executeImportAll = async () => {
        try {
            setImporting(true);
            setIsConfirmOpen(false);
            const { data } = await apiClient.post('/plantillas/importar-todo');
            const msg = `${data.message}: ${data.imported} nuevos, ${data.updated || 0} imágenes actualizadas`;
            useAlertStore.getState().alert(msg, "success");
            onSuccess();
            onClose();
        } catch (error: any) {
            useAlertStore.getState().alert(error.response?.data?.message || "Error al importar todo", "error");
        } finally {
            setImporting(false);
        }
    };

    if (!isOpen) return null;

    // Prepare DataTable props
    const headerColumns = ['#', 'Nombre', 'Descripción', 'Precio', 'Categoría', 'U. Medida'];

    const bodyData = plantillas.map((p) => ({
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
        'Nombre': p.nombre,
        'Descripción': p.descripcion,
        'Precio': `S/ ${Number(p.precioSugerido).toFixed(2)}`,
        'Categoría': p.categoria || 'Sin Categoría',
        'U. Medida': p.unidadConteo || 'NIU'
    }));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-lg">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">
                            Catálogo de Productos - {auth?.empresa?.rubro?.nombre}
                        </h2>
                        <p className="text-sm text-gray-500">Selecciona los productos que deseas importar a tu inventario</p>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors">
                        <Icon icon="mdi:close" width={28} />
                    </button>
                </div>

                {/* Filters */}
                <div className="p-4 border-b flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="w-full md:w-1/3">
                        <InputPro
                            name="search"
                            label="Buscar producto"
                            placeholder="Nombre, código o descripción..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 font-medium">
                            {selectedIds.length} seleccionados
                        </span>
                        {selectedIds.length > 0 && (
                            <button
                                onClick={() => setSelectedIds([])}
                                className="text-xs text-red-500 hover:text-red-700 underline"
                            >
                                Limpiar selección
                            </button>
                        )}
                    </div>
                </div>

                {/* Table Content */}
                <div className="flex-1 overflow-hidden p-4 bg-gray-50 flex flex-col">
                    <div className="bg-white rounded-lg border shadow-sm flex-1 overflow-hidden relative">
                        {loading && (
                            <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                            </div>
                        )}

                        <div className="h-full overflow-auto">
                            {plantillas.length > 0 ? (
                                <DataTable
                                    headerColumns={headerColumns}
                                    bodyData={bodyData}
                                />
                            ) : (
                                !loading && (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                        <Icon icon="mdi:package-variant-closed" width={48} className="mb-2 opacity-50" />
                                        <p>No se encontraron productos en el catálogo</p>
                                    </div>
                                )
                            )}
                        </div>
                    </div>

                    {/* Pagination */}
                    {total > limit && (
                        <div className="mt-4 flex justify-center">
                            <Pagination
                                pages={Array.from({ length: Math.ceil(total / limit) }, (_, i) => i + 1)}
                                currentPage={page}
                                setcurrentPage={setPage}
                                indexOfFirstItem={(page - 1) * limit}
                                indexOfLastItem={Math.min(page * limit, total)}
                                total={total}
                            />
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t flex justify-between gap-3 bg-white rounded-b-lg">
                    <div>
                        <Button
                            onClick={handleImportAllClick}
                            color="secondary"
                            disabled={importing || plantillas.length === 0}
                            className="bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100"
                        >
                            {importing ? '...' : (
                                <>
                                    <Icon icon="mdi:database-arrow-down-outline" className="mr-2" />
                                    Importar TODO el catálogo
                                </>
                            )}
                        </Button>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={onClose} color="secondary" outline>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleImport}
                            color="primary"
                            disabled={selectedIds.length === 0 || importing}
                        >
                            {importing ? (
                                <><span className="animate-spin mr-2">⏳</span> Importando...</>
                            ) : (
                                <>
                                    <Icon icon="mdi:import" className="mr-2" />
                                    Importar ({selectedIds.length})
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            <ModalConfirm
                isOpenModal={isConfirmOpen}
                setIsOpenModal={setIsConfirmOpen}
                confirmSubmit={executeImportAll}
                title="¿Importar TODO el catálogo?"
                information="Esta acción importará todos los productos disponibles para tu rubro."
            >
                <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-gray-600">
                    <li>Se omitirán los productos ya registrados (por código).</li>
                    <li>Se actualizarán imágenes faltantes.</li>
                    <li>Solo se agregarán nuevos productos.</li>
                </ul>
            </ModalConfirm>
        </div>
    );
}
