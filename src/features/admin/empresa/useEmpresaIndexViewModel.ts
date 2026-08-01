import { useState, useEffect } from 'react';
import { useEmpresasStore } from '@/zustand/empresas';
import useAlertStore from '@/zustand/alert';
import { useDebounce } from '@/hooks/useDebounce';
import { post } from '@/utils/fetch';
import apiClient from '@/utils/apiClient';

const DAY_MS = 86400000;

const normalizeDateOnly = (value?: string | Date | null): string => {
    if (!value) return '';
    const raw = typeof value === 'string' ? value : value.toISOString();
    const iso = raw.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10);
};

const formatDateOnly = (value?: string | Date | null): string => {
    const iso = normalizeDateOnly(value);
    if (!iso) return '-';
    const [year, month, day] = iso.split('-');
    return `${day}/${month}/${year}`;
};

const getDaysUntilDate = (value?: string | Date | null): number | null => {
    const iso = normalizeDateOnly(value);
    if (!iso) return null;
    const [year, month, day] = iso.split('-').map(Number);
    const today = new Date();
    const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    const targetUtc = Date.UTC(year, month - 1, day);
    return Math.ceil((targetUtc - todayUtc) / DAY_MS);
};

const formatDaysUntil = (days: number | null): string => {
    if (days === null) return '-';
    if (days < 0) {
        const expiredDays = Math.abs(days);
        return `Vencido hace ${expiredDays} día${expiredDays === 1 ? '' : 's'}`;
    }
    if (days === 0) return 'Vence hoy';
    return `${days} día${days === 1 ? '' : 's'}`;
};

export type GrupoCliente = 'DEMO' | 'MENSUAL' | 'ANUAL';
export type Severidad = 'vencido' | 'critico' | 'alerta' | 'ok' | 'sinfecha';

const resolveGrupo = (empresa: any): GrupoCliente => {
    const plan = empresa?.plan ?? {};
    const nombre = String(plan.nombre ?? '');
    if (plan.esPrueba === true || empresa?.usaDemo === true || /\b(demo|prueba)\b/i.test(nombre)) return 'DEMO';
    const tipo = String(plan.tipoFacturacion ?? '').toUpperCase();
    const dias = Number(plan.duracionDias ?? 0);
    if (tipo === 'ANUAL' || dias >= 300 || /\banual\b/i.test(nombre)) return 'ANUAL';
    return 'MENSUAL';
};

const resolveSeveridad = (dias: number | null): Severidad => {
    if (dias === null) return 'sinfecha';
    if (dias < 0) return 'vencido';
    if (dias <= 7) return 'critico';
    if (dias <= 30) return 'alerta';
    return 'ok';
};

const normalizeWhatsappPhone = (value?: string | null): string => {
    const digits = String(value ?? '').replace(/\D/g, '');
    if (!digits) return '';
    if (digits.length === 9) return `51${digits}`;
    if (digits.length === 11 && digits.startsWith('51')) return digits;
    return digits;
};

export const useEmpresaIndexViewModel = (): any => {
    const { empresas, totalEmpresas, currentPage, totalPages, loading, error, listarEmpresas, cambiarEstadoEmpresa, eliminarEmpresa } = useEmpresasStore();
    const { success } = useAlertStore();

    const [searchTerm, setSearchTerm] = useState('');
    const [tipoFiltro, setTipoFiltro] = useState<'FORMAL' | 'INFORMAL' | ''>('');
    const [estadoFiltro, setEstadoFiltro] = useState<'ACTIVO' | 'INACTIVO' | 'TODOS'>('TODOS');
    const [grupoFiltro, setGrupoFiltro] = useState<GrupoCliente | ''>('');
    const [vencimientoFiltro, setVencimientoFiltro] = useState<'' | 'VENCIDOS' | 'POR_VENCER_7' | 'POR_VENCER_30'>('');
    const [itemsPerPage, setItemsPerPage] = useState(300);
    const [isOpenModalConfirm, setIsOpenModalConfirm] = useState(false);
    const [selectedEmpresa, setSelectedEmpresa] = useState<any>(null);
    const [currentPageState, setCurrentPageState] = useState(1);
    const [openEmpresaModal, setOpenEmpresaModal] = useState(false);
    const [empresaModalMode, setEmpresaModalMode] = useState<'create' | 'edit'>('create');
    const [empresaEditingId, setEmpresaEditingId] = useState<number | undefined>(undefined);

    const debounceSearch = useDebounce(searchTerm, 1000);

    const indexOfLastItem = currentPageState * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const pages = Array.from({ length: Math.ceil(totalEmpresas / itemsPerPage) }, (_, i) => i + 1);

    useEffect(() => {
        listarEmpresas({ search: debounceSearch, page: currentPageState, limit: itemsPerPage, sort: 'id', order: 'desc', estado: estadoFiltro, tipoEmpresa: tipoFiltro });
    }, [debounceSearch, currentPageState, itemsPerPage, estadoFiltro, tipoFiltro]);

    // Exporta el listado filtrado de empresas en PDF o Excel
    const [exportando, setExportando] = useState<'pdf' | 'excel' | null>(null);
    const exportarEmpresas = async (formato: 'pdf' | 'excel') => {
        if (exportando) return;
        setExportando(formato);
        try {
            const params = new URLSearchParams({ formato });
            if (debounceSearch) params.set('search', debounceSearch);
            if (estadoFiltro !== 'TODOS') params.set('estado', estadoFiltro);
            if (tipoFiltro) params.set('tipoEmpresa', tipoFiltro);
            const resp = await apiClient.get(`/empresa/exportar?${params.toString()}`, {
                responseType: 'blob',
                timeout: 60_000,
            });
            const url = window.URL.createObjectURL(new Blob([resp.data as any]));
            const link = document.createElement('a');
            link.href = url;
            link.download = `empresas.${formato === 'pdf' ? 'pdf' : 'xlsx'}`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch {
            useAlertStore.getState().alert('No se pudo exportar el listado de empresas', 'error');
        } finally {
            setExportando(null);
        }
    };

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
        const ambienteDisplay = empresa.ambienteFacturacion ?? (empresa.usaDemo ? 'DEMO' : 'PRODUCCIÓN');
        const tiendaEstado = empresa.plan?.tieneTienda && empresa?.slugTienda ? 'Activa' : empresa.plan?.tieneTienda && !empresa?.slugTienda ? 'Disponible' : 'No disponible';
        const diasRestantes = getDaysUntilDate(empresa.fechaExpiracion);
        const adminPrincipal = empresa.usuarios?.[0];
        return {
            id: empresa.id,
            'RUC': empresa.ruc,
            'Razon Social': empresa.razonSocial,
            nombreComercial: empresa.nombreComercial,
            adminNombre: adminPrincipal?.nombre || '',
            adminCelular: adminPrincipal?.celular || '',
            'Ambiente': ambienteDisplay,
            'Rubro': empresa?.rubro?.nombre || '-',
            'Plan': empresa.plan?.nombre || '-',
            planCosto: empresa.plan?.costo != null ? Number(empresa.plan.costo) : null,
            'Tienda Virtual': tiendaEstado,
            fechaExpiracion: formatDateOnly(empresa.fechaExpiracion),
            'Vence en': formatDaysUntil(diasRestantes),
            estado: empresa.estado,
            grupo: resolveGrupo(empresa),
            severidad: resolveSeveridad(diasRestantes),
            diasRestantes,
        };
    }) || [];

    const [drawerEmpresa, setDrawerEmpresa] = useState<any>(null);
    const [alertasDismissed, setAlertasDismissed] = useState(false);
    const [filtroPorVencer, setFiltroPorVencer] = useState(false);

    const getDiasRestantes = (fechaExpiracion: string) => getDaysUntilDate(fechaExpiracion) ?? 0;

    const proximasVencer = (empresas || []).filter((e: any) => {
        if (!e.fechaExpiracion) return false;
        const dias = getDiasRestantes(e.fechaExpiracion);
        return dias >= 0 && dias <= 7;
    });

    const handleViewDetails = (row: any) => {
        const full = empresas?.find((e: any) => e.id === row.id);
        setDrawerEmpresa(full ?? row);
    };

    const refreshEmpresas = () => listarEmpresas({ search: debounceSearch, page: currentPageState, limit: itemsPerPage, sort: 'id', order: 'desc' });

    const handleEnviarRecordatorioEmail = async (row: any) => {
        if (row.estado !== 'ACTIVO') {
            useAlertStore.getState().alert('Solo se puede recordar a empresas activas', 'warning');
            return;
        }
        const resp = await post(`empresa/${row.id}/enviar-email`, { tipo: 'RECORDATORIO' });
        if (resp.success === false || resp.error) {
            useAlertStore.getState().alert(resp.error || 'No se pudo enviar el correo de recordatorio', 'error');
            return;
        }
        useAlertStore.getState().alert('Correo de recordatorio enviado correctamente', 'success');
    };

    const handleEnviarRecordatorioWhatsapp = async (row: any) => {
        if (row.estado !== 'ACTIVO') {
            useAlertStore.getState().alert('Solo se puede recordar a empresas activas', 'warning');
            return;
        }
        const phone = normalizeWhatsappPhone(row.adminCelular);
        if (!phone) {
            useAlertStore.getState().alert('La empresa no tiene celular de administrador activo', 'warning');
            return;
        }
        const empresaNombre = row.nombreComercial || row['Razon Social'] || 'tu empresa';
        const fechaExpiracion = row.fechaExpiracion && row.fechaExpiracion !== '-' ? row.fechaExpiracion : 'por confirmar';
        const estadoVencimiento = String(row['Vence en'] || '').toLowerCase();
        const mensaje = [
            `Hola ${row.adminNombre || 'equipo'}, te recordamos que la suscripción de ${empresaNombre} ${estadoVencimiento}.`,
            `Plan actual: ${row.Plan || 'Suscripción activa'}.`,
            `Fecha de vencimiento: ${fechaExpiracion}.`,
            'Renueva a tiempo para mantener activo tu acceso, facturación, inventario, ventas y tienda virtual.',
        ].join('\n');

        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(mensaje)}`, '_blank', 'noopener,noreferrer');
    };

    // KPIs de vencimiento sobre el conjunto cargado (respeta búsqueda/estado del servidor)
    const kpis = empresasTable.reduce(
        (acc: { vencidos: number; porVencer7: number; porVencer30: number }, e: any) => {
            const d = e.diasRestantes;
            if (d === null) return acc;
            if (d < 0) acc.vencidos += 1;
            else if (d <= 7) acc.porVencer7 += 1;
            else if (d <= 30) acc.porVencer30 += 1;
            return acc;
        },
        { vencidos: 0, porVencer7: 0, porVencer30: 0 },
    );

    const pasaVencimiento = (e: any) => {
        const d = e.diasRestantes;
        if (vencimientoFiltro === 'VENCIDOS') return d !== null && d < 0;
        if (vencimientoFiltro === 'POR_VENCER_7') return d !== null && d >= 0 && d <= 7;
        if (vencimientoFiltro === 'POR_VENCER_30') return d !== null && d >= 0 && d <= 30;
        return true;
    };

    const ordenarPorVencimiento = (a: any, b: any) => {
        const da = a.diasRestantes === null ? Number.POSITIVE_INFINITY : a.diasRestantes;
        const db = b.diasRestantes === null ? Number.POSITIVE_INFINITY : b.diasRestantes;
        return da - db;
    };

    const filasVisibles = empresasTable.filter(pasaVencimiento);

    // Agrupa por tipo de cliente y ordena cada grupo por proximidad de vencimiento (lo que vence primero, arriba)
    const grupos: Record<GrupoCliente, any[]> = { DEMO: [], MENSUAL: [], ANUAL: [] };
    filasVisibles.forEach((e: any) => { grupos[e.grupo as GrupoCliente].push(e); });
    (Object.keys(grupos) as GrupoCliente[]).forEach((k) => grupos[k].sort(ordenarPorVencimiento));

    const toggleVencimiento = (valor: 'VENCIDOS' | 'POR_VENCER_7' | 'POR_VENCER_30') =>
        setVencimientoFiltro((prev) => (prev === valor ? '' : valor));

    return { exportando, exportarEmpresas, empresas, empresasTable: filasVisibles, grupos, kpis, totalEmpresas, loading, error, searchTerm, tipoFiltro, estadoFiltro, grupoFiltro, setGrupoFiltro, vencimientoFiltro, setVencimientoFiltro, toggleVencimiento, itemsPerPage, currentPageState, setCurrentPageState, setItemsPerPage, pages, indexOfFirstItem, indexOfLastItem, isOpenModalConfirm, setIsOpenModalConfirm, selectedEmpresa, openEmpresaModal, setOpenEmpresaModal, empresaModalMode, empresaEditingId, setEmpresaEditingId, setEmpresaModalMode, handleSearch, handleEdit, handleToggleState, handleDelete, confirmAction, refreshEmpresas, setTipoFiltro, setEstadoFiltro, drawerEmpresa, setDrawerEmpresa, handleViewDetails, proximasVencer, alertasDismissed, setAlertasDismissed, filtroPorVencer, setFiltroPorVencer, getDiasRestantes, handleEnviarRecordatorioEmail, handleEnviarRecordatorioWhatsapp };
};
