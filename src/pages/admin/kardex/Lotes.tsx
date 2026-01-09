import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useAuthStore } from '@/zustand/auth';
import { useRubroFeatures } from '@/utils/rubro-features';
import apiClient from '@/utils/apiClient';
import useAlertStore from '@/zustand/alert';
import Button from '@/components/Button';
import DataTable from '@/components/Datatable';
import Pagination from '@/components/Pagination';
import TableActionMenu from '@/components/TableActionMenu';
import Select from '@/components/Select';
import ModalCrearLote from './ModalCrearLote';
import ModalAjusteStockLote from './ModalAjusteStockLote';
import ModalHistorialLote from './ModalHistorialLote';
import { useNavigate } from 'react-router-dom';

interface ProductoLote {
    id: number;
    lote: string;
    productoId: number;
    fechaVencimiento: string;
    stockActual: number;
    stockInicial: number;
    activo: boolean;
    producto: {
        id: number;
        codigo: string;
        descripcion: string;
        precioUnitario: number;
    };
    costoUnitario?: number;
    proveedor?: string;
}

const GestionLotes = () => {
    const { auth } = useAuthStore();
    const navigate = useNavigate();
    const features = useRubroFeatures(auth?.empresa?.rubro?.nombre);

    const [lotes, setLotes] = useState<ProductoLote[]>([]);
    const [loading, setLoading] = useState(true);
    const [filtro, setFiltro] = useState<'todos' | 'por-vencer' | 'vencidos'>('todos');
    const [diasAnticipacion, setDiasAnticipacion] = useState(30);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loteSeleccionado, setLoteSeleccionado] = useState<ProductoLote | null>(null);
    const [isAjusteOpen, setIsAjusteOpen] = useState(false);
    const [isHistorialOpen, setIsHistorialOpen] = useState(false);

    // Estado para paginación
    const [currentPage, setcurrentPage] = useState(1);
    const [itemsPerPage, setitemsPerPage] = useState(50);

    // Estado para menú de acciones
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const [openAccionesId, setOpenAccionesId] = useState<number | null>(null);

    const abrirAjuste = (lote: ProductoLote) => {
        setLoteSeleccionado(lote);
        setIsAjusteOpen(true);
        closeMenu();
    };

    const abrirHistorial = (lote: ProductoLote) => {
        setLoteSeleccionado(lote);
        setIsHistorialOpen(true);
        closeMenu();
    };

    const closeMenu = () => {
        setOpenAccionesId(null);
        setAnchorEl(null);
    };

    // Redirigir si el rubro no usa lotes
    useEffect(() => {
        if (!features.gestionLotes) {
            useAlertStore.getState().alert('Esta funcionalidad solo está disponible para farmacias y boticas', 'info');
            navigate('/admin/productos');
        }
    }, [features, navigate]);

    const cargarLotes = async () => {
        try {
            setLoading(true);
            let endpoint = '/producto/lotes/por-vencer';

            if (filtro === 'vencidos') {
                endpoint = '/producto/lotes/vencidos';
            } else if (filtro === 'por-vencer') {
                endpoint = `/producto/lotes/por-vencer?dias=${diasAnticipacion}`;
            } else {
                endpoint = '/producto/lotes/todos';
            }

            const { data } = await apiClient.get(endpoint);
            setLotes(data?.data || data || []);
            setcurrentPage(1); // Resetear a página 1 al cambiar filtro
        } catch (error: any) {
            console.error('Error al cargar lotes:', error);
            useAlertStore.getState().alert('Error al cargar lotes', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (features.gestionLotes) {
            cargarLotes();
        }
        // eslint-disable-next-line
    }, [filtro, diasAnticipacion, features.gestionLotes]);

    const calcularDiasParaVencer = (fechaVencimiento: string) => {
        const hoy = new Date();
        const vencimiento = new Date(fechaVencimiento);
        const diferencia = vencimiento.getTime() - hoy.getTime();
        return Math.ceil(diferencia / (1000 * 60 * 60 * 24));
    };

    const handleDesactivarLote = async (loteId: number) => {
        try {
            await apiClient.patch(`/producto/lotes/${loteId}/desactivar`);
            useAlertStore.getState().alert('Lote desactivado correctamente', 'success');
            closeMenu();
            cargarLotes();
        } catch (error) {
            useAlertStore.getState().alert('Error al desactivar lote', 'error');
        }
    };

    // Paginación client-side
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = lotes.slice(indexOfFirstItem, indexOfLastItem);
    const pages: number[] = [];
    for (let i = 1; i <= Math.ceil(lotes.length / itemsPerPage); i++) {
        pages.push(i);
    }

    // Preparar datos para DataTable
    const lotesTable = currentItems.map((lote) => {
        const diasRestantes = calcularDiasParaVencer(lote.fechaVencimiento);
        const isVencido = diasRestantes < 0;
        const isPorVencer = diasRestantes >= 0 && diasRestantes <= 30;

        const estadoBadge = isVencido ? (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 w-full justify-center">
                <Icon icon="solar:close-circle-bold" className="mr-1" width={14} />
                Vencido
            </span>
        ) : isPorVencer ? (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 w-full justify-center">
                <Icon icon="solar:danger-triangle-bold" className="mr-1" width={14} />
                {diasRestantes} días
            </span>
        ) : (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 w-full justify-center">
                <Icon icon="solar:check-circle-bold" className="mr-1" width={14} />
                Vigente
            </span>
        );

        const stockBadge = (
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${lote.stockActual === 0
                ? 'bg-gray-100 text-gray-700'
                : lote.stockActual <= 5
                    ? 'bg-red-100 text-red-700'
                    : lote.stockActual <= 10
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-green-100 text-green-700'
                }`}>
                {lote.stockActual}
            </span>
        );

        const acciones = (
            <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (openAccionesId === lote.id) {
                            setOpenAccionesId(null);
                            setAnchorEl(null);
                        } else {
                            setOpenAccionesId(lote.id);
                            setAnchorEl(e.currentTarget);
                        }
                    }}
                    className="px-2 py-1 text-xs rounded-lg border border-gray-300 bg-white flex items-center gap-1 hover:bg-gray-50 transition-colors"
                >
                    <Icon icon="mdi:dots-vertical" width={18} height={18} />
                </button>
            </div>
        );

        return {
            loteId: lote.id,
            'Producto': lote.producto.descripcion,
            'Código': lote.producto.codigo,
            'Lote': lote.lote,
            'Vencimiento': new Date(lote.fechaVencimiento).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }),
            'Stock': stockBadge,
            'Estado': estadoBadge,
            'Acciones': acciones,
            // Keep original object for actions
            original: lote
        };
    });

    const headerColumns = [
        'Producto',
        'Código',
        'Lote',
        'Vencimiento',
        'Stock',
        'Estado',
        'Acciones'
    ];

    if (!features.gestionLotes) {
        return null;
    }

    return (
        <div className="min-h-screen px-2 pb-4">
            {/* Header */}

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Gestión de Lotes</h1>
                    <p className="text-sm text-gray-500 mt-1">Control de vencimientos y stock por lote</p>
                </div>
                <Button
                    color="secondary"
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2"
                >
                    <Icon icon="solar:add-circle-bold" className="text-lg" />
                    Nuevo Lote
                </Button>
            </div>

            {/* Main Content Card */}
            {lotes.length > 0 && (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 bg-white rounded-2xl shadow-sm border border-orange-100 flex items-center gap-4">
                        <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                            <Icon icon="solar:danger-triangle-bold-duotone" width={24} />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-gray-900">{lotes.length}</div>
                            <div className="text-sm text-gray-500">Lotes en lista</div>
                        </div>
                    </div>
                    <div className="p-4 bg-white rounded-2xl shadow-sm border border-indigo-100 flex items-center gap-4">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                            <Icon icon="solar:box-bold-duotone" width={24} />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-gray-900">
                                {lotes.reduce((acc, l) => acc + l.stockActual, 0)}
                            </div>
                            <div className="text-sm text-gray-500">Unidades totales</div>
                        </div>
                    </div>
                    <div className="p-4 bg-white rounded-2xl shadow-sm border border-emerald-100 flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                            <Icon icon="solar:dollar-bold-duotone" width={24} />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-gray-900">
                                S/ {lotes.reduce((acc, l) => acc + (l.producto.precioUnitario * l.stockActual), 0).toFixed(2)}
                            </div>
                            <div className="text-sm text-gray-500">Valor en inventario</div>
                        </div>
                    </div>
                </div>
            )}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Filters */}


                <div className="p-5 border-b border-gray-100">
                    <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                        <div className="flex flex-wrap gap-2">
                            <Button
                                color={filtro === 'todos' ? 'primary' : 'lila'}
                                outline={filtro !== 'todos'}
                                onClick={() => setFiltro('todos')}
                                className="text-sm"
                            >
                                <Icon icon="solar:box-bold" className="mr-1.5" />
                                Todos
                            </Button>
                            <Button
                                color={filtro === 'por-vencer' ? 'warning' : 'lila'}
                                outline={filtro !== 'por-vencer'}
                                onClick={() => setFiltro('por-vencer')}
                                className="text-sm"
                            >
                                <Icon icon="solar:danger-triangle-bold" className="mr-1.5" />
                                Por Vencer
                            </Button>
                            <Button
                                color={filtro === 'vencidos' ? 'danger' : 'lila'}
                                outline={filtro !== 'vencidos'}
                                onClick={() => setFiltro('vencidos')}
                                className="text-sm"
                            >
                                <Icon icon="solar:close-circle-bold" className="mr-1.5" />
                                Vencidos
                            </Button>
                        </div>

                        {filtro === 'por-vencer' && (
                            <div className="w-48">
                                <Select
                                    label="Próximos"
                                    name="diasAnticipacion"
                                    value={diasAnticipacion + ' días'}
                                    onChange={(id: any) => setDiasAnticipacion(Number(id))}
                                    options={[
                                        { id: 15, value: '15 días' },
                                        { id: 30, value: '30 días' },
                                        { id: 60, value: '60 días' },
                                        { id: 90, value: '90 días' }
                                    ]}
                                    error={null}
                                    readOnly
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Table */}
                {/* Table or Empty State */}
                {!loading && lotes.length === 0 ? (
                    <div className="text-center py-12">
                        <Icon icon="solar:box-bold-duotone" className="mx-auto text-gray-300 mb-4" width={64} height={64} />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay lotes {filtro === 'vencidos' ? 'vencidos' : 'por vencer'}</h3>
                        <p className="text-sm text-gray-500">
                            {filtro === 'vencidos'
                                ? '¡Excelente! No tienes productos vencidos.'
                                : `No hay productos que venzan en los próximos ${diasAnticipacion} días.`
                            }
                        </p>
                    </div>
                ) : (
                    <div className="p-3">
                        <div className="overflow-x-auto">
                            <DataTable
                                bodyData={lotesTable}
                                headerColumns={headerColumns}
                            />
                        </div>
                        {lotes.length > 0 && (
                            <Pagination
                                data={lotes}
                                optionSelect
                                currentPage={currentPage}
                                indexOfFirstItem={indexOfFirstItem}
                                indexOfLastItem={indexOfLastItem}
                                setcurrentPage={setcurrentPage}
                                setitemsPerPage={setitemsPerPage}
                                pages={pages}
                                total={lotes.length}
                            />
                        )}
                    </div>
                )}
            </div>

            {/* Stats Summary - Only show if there is data */}


            {/* Modales */}
            <ModalCrearLote
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {
                    cargarLotes();
                    setIsModalOpen(false);
                }}
            />

            <ModalAjusteStockLote
                isOpen={isAjusteOpen}
                onClose={() => {
                    setIsAjusteOpen(false);
                    setLoteSeleccionado(null);
                }}
                lote={loteSeleccionado}
                onSuccess={cargarLotes}
            />

            <ModalHistorialLote
                isOpen={isHistorialOpen}
                onClose={() => {
                    setIsHistorialOpen(false);
                    setLoteSeleccionado(null);
                }}
                lote={loteSeleccionado}
            />

            <TableActionMenu
                isOpen={!!openAccionesId && !!anchorEl}
                anchorEl={anchorEl}
                onClose={closeMenu}
            >
                {openAccionesId && (() => {
                    const selectedLote = lotes.find(l => l.id === openAccionesId);
                    if (!selectedLote) return null;

                    return (
                        <>
                            <button
                                type="button"
                                onClick={() => abrirHistorial(selectedLote)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-100"
                            >
                                <Icon icon="solar:history-bold" width={16} />
                                <span>Ver historial</span>
                            </button>
                            {selectedLote.activo && (
                                <button
                                    type="button"
                                    onClick={() => abrirAjuste(selectedLote)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-100"
                                >
                                    <Icon icon="solar:pen-bold" width={16} />
                                    <span>Ajustar stock</span>
                                </button>
                            )}
                            {selectedLote.activo && (
                                <button
                                    type="button"
                                    onClick={() => handleDesactivarLote(selectedLote.id)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50"
                                >
                                    <Icon icon="solar:trash-bin-bold" width={16} />
                                    <span>Dar de baja</span>
                                </button>
                            )}
                        </>
                    )
                })()}
            </TableActionMenu>
        </div>
    );
};

export default GestionLotes;
