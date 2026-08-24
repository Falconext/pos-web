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

// Mes de activación en español (abreviado, "Set" para septiembre).
const MESES_ABREV = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'];
const mesAbrev = (fecha?: string | Date | null): string => {
    if (!fecha) return '—';
    const d = new Date(fecha);
    if (isNaN(d.getTime())) return '—';
    return MESES_ABREV[d.getMonth()] ?? '—';
};

const resolveGrupo = (empresa: any): GrupoCliente => {
    const plan = empresa?.plan ?? {};
    const nombre = String(plan.nombre ?? '');
    if (plan.esPrueba === true || empresa?.usaDemo === true || /\b(demo|prueba)\b/i.test(nombre)) return 'DEMO';
    const tipo = String(plan.tipoFacturacion ?? '').toUpperCase();
    const dias = Number(plan.duracionDias ?? 0);
    if (tipo === 'ANUAL' || dias >= 300 || /\banual\b/i.test(nombre)) return 'ANUAL';
    return 'MENSUAL';
};

// Texto humano de la actividad de facturación ("Facturó hoy", "Hace 12 días", "Nunca facturó").
const describirUltimaVenta = (salud?: { ultimaVenta?: string | null; diasSinVender?: number } | null): string => {
    if (!salud) return '—';
    if (!salud.ultimaVenta) return 'Nunca facturó';
    const dias = salud.diasSinVender ?? 0;
    if (dias <= 0) return 'Facturó hoy';
    if (dias === 1) return 'Ayer';
    return `Hace ${dias} días`;
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
    const [saludFiltro, setSaludFiltro] = useState<'' | 'EN_RIESGO'>('');
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
            'Mes Activacion': mesAbrev(empresa.fechaActivacion),
            capacitacion: Boolean(empresa.capacitacion),
            altaSunat: Boolean(empresa.altaSunat),
            contrato: Boolean(empresa.contrato),
            bienvenidaRedes: Boolean(empresa.bienvenidaRedes),
            estado: empresa.estado,
            grupo: resolveGrupo(empresa),
            severidad: resolveSeveridad(diasRestantes),
            diasRestantes,
            salud: empresa.salud ?? null,
            saludEstado: empresa.salud?.estado ?? 'sana',
            diasSinVender: empresa.salud?.diasSinVender ?? null,
            ultimaVentaTexto: describirUltimaVenta(empresa.salud),
            estadoGestion: empresa.estadoGestion ?? null,
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

    // ── Postventa: bitácora de seguimiento + estado de gestión ──
    const [seguimientoEmpresa, setSeguimientoEmpresa] = useState<any>(null); // empresa/row abierto en el modal
    const openSeguimiento = (row: any) => {
        const full = empresas?.find((e: any) => e.id === row.id);
        setSeguimientoEmpresa({ ...(full ?? {}), ...row });
    };
    const closeSeguimiento = () => setSeguimientoEmpresa(null);
    const onGestionActualizada = (id: number, estadoGestion: string | null) => {
        // refresca la fila en memoria para reflejar el nuevo estado sin recargar todo
        useEmpresasStore.setState((s: any) => ({
            empresas: (s.empresas || []).map((e: any) => (e.id === id ? { ...e, estadoGestion } : e)),
        }));
        setSeguimientoEmpresa((prev: any) => (prev && prev.id === id ? { ...prev, estadoGestion } : prev));
    };

    // Abre el chat de WhatsApp del admin de la empresa, EN BLANCO, para escribir libremente.
    // (Distinto del recordatorio: no lleva mensaje predefinido.)
    const handleAbrirWhatsapp = (row: any) => {
        const phone = normalizeWhatsappPhone(row.adminCelular);
        if (!phone) {
            useAlertStore.getState().alert('La empresa no tiene celular de administrador activo', 'warning');
            return;
        }
        window.open(`https://wa.me/${phone}`, '_blank', 'noopener,noreferrer');
    };

    // ── Contrato de servicios (PDF autollenado) ──
    const handleDescargarContrato = async (row: any) => {
        try {
            const resp = await apiClient.get(`/empresa/${row.id}/contrato`, { responseType: 'blob', timeout: 60000 });
            const url = URL.createObjectURL(new Blob([resp.data], { type: 'application/pdf' }));
            const a = document.createElement('a');
            a.href = url;
            a.download = `Contrato_${String(row['Razon Social'] || 'cliente').replace(/[^a-z0-9]+/gi, '_')}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (e: any) {
            useAlertStore.getState().alert(e?.response?.data?.message || e?.message || 'No se pudo generar el contrato', 'error');
        }
    };

    const handleEnviarContrato = async (row: any, canal: 'email' | 'whatsapp') => {
        try {
            const resp: any = await post(`empresa/${row.id}/contrato/enviar`, { canal });
            if (resp?.success === false || resp?.error) {
                useAlertStore.getState().alert(resp?.error || resp?.message || 'No se pudo enviar el contrato', 'error');
                return;
            }
            useAlertStore.getState().alert(
                resp?.message || (canal === 'email' ? 'Contrato enviado por correo' : 'Contrato enviado por WhatsApp'),
                'success',
            );
        } catch (e: any) {
            useAlertStore.getState().alert(e?.response?.data?.message || e?.message || 'No se pudo enviar el contrato', 'error');
        }
    };

    // KPIs de vencimiento sobre el conjunto cargado (respeta búsqueda/estado del servidor)
    // enRiesgoFuga: empresas activas que dejaron de facturar (amarillo + rojo) — máxima prioridad de retención.
    const kpis = empresasTable.reduce(
        (acc: { vencidos: number; porVencer7: number; porVencer30: number; enRiesgoFuga: number }, e: any) => {
            const d = e.diasRestantes;
            // Los clientes DEMO no cuentan como riesgo de fuga (aún no son clientes de pago).
            if (e.grupo !== 'DEMO' && e.estado === 'ACTIVO' && (e.saludEstado === 'riesgo' || e.saludEstado === 'critico')) acc.enRiesgoFuga += 1;
            if (d === null) return acc;
            if (d < 0) acc.vencidos += 1;
            else if (d <= 7) acc.porVencer7 += 1;
            else if (d <= 30) acc.porVencer30 += 1;
            return acc;
        },
        { vencidos: 0, porVencer7: 0, porVencer30: 0, enRiesgoFuga: 0 },
    );

    const pasaVencimiento = (e: any) => {
        const d = e.diasRestantes;
        if (vencimientoFiltro === 'VENCIDOS') return d !== null && d < 0;
        if (vencimientoFiltro === 'POR_VENCER_7') return d !== null && d >= 0 && d <= 7;
        if (vencimientoFiltro === 'POR_VENCER_30') return d !== null && d >= 0 && d <= 30;
        return true;
    };

    const pasaSalud = (e: any) => {
        if (saludFiltro === 'EN_RIESGO') return e.grupo !== 'DEMO' && e.estado === 'ACTIVO' && (e.saludEstado === 'riesgo' || e.saludEstado === 'critico');
        return true;
    };

    const toggleSalud = () => setSaludFiltro((prev) => (prev === 'EN_RIESGO' ? '' : 'EN_RIESGO'));

    const ordenarPorVencimiento = (a: any, b: any) => {
        const da = a.diasRestantes === null ? Number.POSITIVE_INFINITY : a.diasRestantes;
        const db = b.diasRestantes === null ? Number.POSITIVE_INFINITY : b.diasRestantes;
        return da - db;
    };

    const filasVisibles = empresasTable.filter((e: any) => pasaVencimiento(e) && pasaSalud(e));

    // Agrupa por tipo de cliente y ordena cada grupo por proximidad de vencimiento (lo que vence primero, arriba)
    const grupos: Record<GrupoCliente, any[]> = { DEMO: [], MENSUAL: [], ANUAL: [] };
    filasVisibles.forEach((e: any) => { grupos[e.grupo as GrupoCliente].push(e); });
    (Object.keys(grupos) as GrupoCliente[]).forEach((k) => grupos[k].sort(ordenarPorVencimiento));

    const toggleVencimiento = (valor: 'VENCIDOS' | 'POR_VENCER_7' | 'POR_VENCER_30') =>
        setVencimientoFiltro((prev) => (prev === valor ? '' : valor));

    return { exportando, exportarEmpresas, empresas, empresasTable: filasVisibles, grupos, kpis, totalEmpresas, loading, error, searchTerm, tipoFiltro, estadoFiltro, grupoFiltro, setGrupoFiltro, vencimientoFiltro, setVencimientoFiltro, toggleVencimiento, saludFiltro, setSaludFiltro, toggleSalud, itemsPerPage, currentPageState, setCurrentPageState, setItemsPerPage, pages, indexOfFirstItem, indexOfLastItem, isOpenModalConfirm, setIsOpenModalConfirm, selectedEmpresa, openEmpresaModal, setOpenEmpresaModal, empresaModalMode, empresaEditingId, setEmpresaEditingId, setEmpresaModalMode, handleSearch, handleEdit, handleToggleState, handleDelete, confirmAction, refreshEmpresas, setTipoFiltro, setEstadoFiltro, drawerEmpresa, setDrawerEmpresa, handleViewDetails, proximasVencer, alertasDismissed, setAlertasDismissed, filtroPorVencer, setFiltroPorVencer, getDiasRestantes, handleEnviarRecordatorioEmail, handleEnviarRecordatorioWhatsapp, handleAbrirWhatsapp, handleDescargarContrato, handleEnviarContrato, seguimientoEmpresa, openSeguimiento, closeSeguimiento, onGestionActualizada };
};
