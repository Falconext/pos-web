import { useState, useEffect } from 'react';
import { useEmpresasStore } from '@/zustand/empresas';
import useAlertStore from '@/zustand/alert';
import { useDebounce } from '@/hooks/useDebounce';
import { get } from '@/utils/fetch';

export const useEmpresaIndexViewModel = (): any => {
    const { empresas, totalEmpresas, currentPage, totalPages, loading, error, listarEmpresas, cambiarEstadoEmpresa, eliminarEmpresa } = useEmpresasStore();
    const { success } = useAlertStore();

    const [searchTerm, setSearchTerm] = useState('');
    const [tipoFiltro, setTipoFiltro] = useState<'FORMAL' | 'INFORMAL' | ''>('');
    const [estadoFiltro, setEstadoFiltro] = useState<'ACTIVO' | 'INACTIVO' | 'TODOS'>('TODOS');
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [isOpenModalConfirm, setIsOpenModalConfirm] = useState(false);
    const [selectedEmpresa, setSelectedEmpresa] = useState<any>(null);
    const [currentPageState, setCurrentPageState] = useState(1);
    const [openEmpresaModal, setOpenEmpresaModal] = useState(false);
    const [empresaModalMode, setEmpresaModalMode] = useState<'create' | 'edit'>('create');
    const [empresaEditingId, setEmpresaEditingId] = useState<number | undefined>(undefined);
    const [usageStats, setUsageStats] = useState<Record<number, any>>({});

    const debounceSearch = useDebounce(searchTerm, 1000);

    const indexOfLastItem = currentPageState * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const pages = Array.from({ length: Math.ceil(totalEmpresas / itemsPerPage) }, (_, i) => i + 1);

    useEffect(() => {
        listarEmpresas({ search: debounceSearch, page: currentPageState, limit: itemsPerPage, sort: 'id', order: 'desc', estado: estadoFiltro, tipoEmpresa: tipoFiltro });
    }, [debounceSearch, currentPageState, itemsPerPage, estadoFiltro, tipoFiltro]);

    useEffect(() => {
        const loadUsageStats = async () => {
            const formalEmpresas = empresas?.filter((e: any) => e.tipoEmpresa === 'FORMAL') || [];
            const stats: Record<number, any> = {};
            for (const emp of formalEmpresas) {
                try { const resp: any = await get(`comprobante/usage/${emp.id}`); if (resp?.data) stats[emp.id] = resp.data; else if (resp && !resp.error) stats[emp.id] = resp; } catch { }
            }
            setUsageStats(stats);
        };
        if (empresas?.length > 0) loadUsageStats();
    }, [empresas]);

    useEffect(() => { if (success === true) { setIsOpenModalConfirm(false); setSelectedEmpresa(null); } }, [success]);

    const handleSearch = (e: any) => { setSearchTerm(e.target.value); setCurrentPageState(1); };
    const handleEdit = (empresa: any) => { setEmpresaEditingId(empresa.id); setEmpresaModalMode('edit'); setOpenEmpresaModal(true); };
    const handleToggleState = (empresa: any) => { setSelectedEmpresa({ ...empresa, accion: 'cambiarEstado' }); setIsOpenModalConfirm(true); };
    const handleDelete = (empresa: any) => { setSelectedEmpresa({ ...empresa, accion: 'eliminar' }); setIsOpenModalConfirm(true); };

    const confirmAction = async () => {
        if (!selectedEmpresa) return;
        if (selectedEmpresa.accion === 'cambiarEstado') await cambiarEstadoEmpresa(selectedEmpresa.id, selectedEmpresa.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO');
        else if (selectedEmpresa.accion === 'eliminar') await eliminarEmpresa(selectedEmpresa.id);
        setIsOpenModalConfirm(false); setSelectedEmpresa(null);
    };

    const empresasTable = empresas?.map((empresa: any) => {
        const tiendaEstado = empresa.plan?.tieneTienda && empresa?.slugTienda ? 'Activa' : empresa.plan?.tieneTienda && !empresa?.slugTienda ? 'Disponible' : 'No disponible';
        const usage = usageStats[empresa.id];
        const usoDisplay = empresa.tipoEmpresa === 'FORMAL' && usage ? `${usage.comprobantesEmitidos}/${usage.limiteMaximo} (${usage.porcentajeUso}%)` : '-';
        return { id: empresa.id, 'RUC': empresa.ruc, 'Razon Social': empresa.razonSocial, 'Rubro': empresa?.rubro?.nombre || '-', plan: empresa.plan?.nombre || '-', 'Uso Mensual': usoDisplay, tienda: tiendaEstado, fechaExpiracion: new Date(empresa.fechaExpiracion).toLocaleDateString(), estado: empresa.estado };
    }) || [];

    const refreshEmpresas = () => listarEmpresas({ search: debounceSearch, page: currentPageState, limit: itemsPerPage, sort: 'id', order: 'desc' });

    return { empresas, empresasTable, totalEmpresas, loading, error, searchTerm, tipoFiltro, estadoFiltro, itemsPerPage, currentPageState, setCurrentPageState, setItemsPerPage, pages, indexOfFirstItem, indexOfLastItem, isOpenModalConfirm, setIsOpenModalConfirm, selectedEmpresa, openEmpresaModal, setOpenEmpresaModal, empresaModalMode, empresaEditingId, setEmpresaEditingId, setEmpresaModalMode, handleSearch, handleEdit, handleToggleState, handleDelete, confirmAction, refreshEmpresas, setTipoFiltro, setEstadoFiltro };
};
