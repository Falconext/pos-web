
import { useState } from 'react';
import { useAuthStore } from '@/zustand/auth';
import apiClient from '@/utils/apiClient';
import Button from '@/components/Button';
import InputPro from '@/components/InputPro';
import { Icon } from '@iconify/react';
import useAlertStore from '@/zustand/alert';
import DataTable from '@/components/Datatable';

interface GeneradorProductosProps {
    onImport: (selectedProducts: any[]) => void;
    onCancel: () => void;
}

export default function GeneradorProductos({ onImport, onCancel }: GeneradorProductosProps) {
    const { auth } = useAuthStore();
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [generatedProducts, setGeneratedProducts] = useState<any[]>([]);
    const [selectedIndexes, setSelectedIndexes] = useState<number[]>([]);

    const handleGenerate = async () => {
        if (!query.trim() || !auth?.empresa?.rubroId) return;

        setLoading(true);
        setGeneratedProducts([]);
        setSelectedIndexes([]);

        try {
            const { data } = await apiClient.post('/plantillas/generar-ia', {
                query,
                rubroId: auth.empresa.rubroId
            });

            // Map data to handle potential wrapper { code, message, data: [...] }
            // If the backend returns the array directly, utilize it.
            const responseBody = data;
            const products = Array.isArray(responseBody)
                ? responseBody
                : (Array.isArray(responseBody?.data) ? responseBody.data : []);

            setGeneratedProducts(products);

            // Auto-select all by default
            setSelectedIndexes(products.map((_: any, i: number) => i));

        } catch (error: any) {
            console.error(error);
            useAlertStore.getState().alert(
                error.response?.data?.message || 'Error generando productos con IA',
                'error'
            );
        } finally {
            setLoading(false);
        }
    };

    const toggleSelect = (index: number) => {
        setSelectedIndexes(prev =>
            prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
        );
    };

    const handleImportClick = () => {
        const selected = generatedProducts.filter((_, i) => selectedIndexes.includes(i));
        onImport(selected);
    };

    // Table Config
    const headerColumns = ['#', 'Imagen', 'Nombre', 'Descripción', 'Precio Sug.', 'Categoría', 'U. Medida'];
    const bodyData = generatedProducts.map((p, index) => ({
        '#': (
            <div className="flex items-center justify-center">
                <input
                    type="checkbox"
                    checked={selectedIndexes.includes(index)}
                    onChange={() => toggleSelect(index)}
                    className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500 cursor-pointer"
                />
            </div>
        ),
        'Imagen': (
            <div className="flex items-center justify-center h-12 w-12 bg-gray-100 rounded overflow-hidden border border-gray-200">
                {p.imagenUrl ? (
                    <img
                        src={p.imagenUrl}
                        alt={p.nombre}
                        className="w-full h-full object-cover hover:scale-150 transition-transform cursor-zoom-in"
                        title={p.nombre}
                    />
                ) : (
                    <Icon icon="mdi:image-off-outline" className="text-gray-400" width={24} />
                )}
            </div>
        ),
        'Nombre': p.nombre,
        'Descripción': p.descripcion,
        'Precio Sug.': `S/ ${Number(p.precioSugerido).toFixed(2)}`,
        'Categoría': p.categoria || '-',
        'U. Medida': p.unidadConteo || 'NIU'
    }));

    return (
        <div className="flex flex-col h-full bg-gray-50">
            {/* Search Bar */}
            <div className="p-6 bg-white border-b shadow-sm">
                <div className="max-w-3xl mx-auto text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-500">
                        Generador de Productos con IA
                        <Icon icon="solar:magic-stick-3-bold-duotone" className="inline ml-2 text-purple-500" />
                    </h2>
                    <p className="text-gray-500 mt-2">
                        Describe qué necesitas (ej: "Jarabes para la tos", "Cervezas importadas", "Tuberías de PVC") y la IA creará el catálogo por ti.
                    </p>
                </div>

                <div className="flex gap-2 max-w-2xl mx-auto">
                    <div className="flex-1">
                        <InputPro
                            name="query"
                            placeholder="¿Qué productos buscas hoy?"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                        />
                    </div>
                    <Button
                        onClick={handleGenerate}
                        color="purple"
                        disabled={loading || !query.trim()}
                        className="h-[42px] px-6"
                    >
                        {loading ? (
                            <><span className="animate-spin mr-2">✨</span> Generando...</>
                        ) : (
                            <>Generar <Icon icon="solar:stars-minimalistic-bold" className="ml-2" /></>
                        )}
                    </Button>
                </div>
            </div>

            {/* Results Area */}
            <div className="flex-1 p-4 overflow-hidden flex flex-col">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 overflow-hidden relative">
                    {loading && (
                        <div className="absolute inset-0 bg-white/90 z-10 flex flex-col items-center justify-center">
                            <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4"></div>
                            <p className="text-purple-600 font-medium animate-pulse">Consultando mercado y creando productos...</p>
                        </div>
                    )}

                    <div className="h-full overflow-auto">
                        {generatedProducts.length > 0 ? (
                            <DataTable
                                headerColumns={headerColumns}
                                bodyData={bodyData}
                            />
                        ) : (
                            !loading && (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                    <Icon icon="solar:ufo-3-bold-duotone" width={64} className="mb-4 opacity-50" />
                                    <p>Los resultados aparecerán aquí</p>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 bg-white border-t flex justify-between items-center">
                <div className="text-sm text-gray-500">
                    {selectedIndexes.length} productos seleccionados
                </div>
                <div className="flex gap-3">
                    <Button onClick={onCancel} color="secondary" outline>
                        Volver al catálogo
                    </Button>
                    <Button
                        onClick={handleImportClick}
                        color="primary"
                        disabled={selectedIndexes.length === 0}
                    >
                        <Icon icon="mdi:check-circle" className="mr-2" />
                        Importar Selección
                    </Button>
                </div>
            </div>
        </div>
    );
}
