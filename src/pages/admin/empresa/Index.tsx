import { useMemo, useState, type MouseEvent } from 'react';
import { useEmpresaIndexViewModel, type GrupoCliente, type Severidad } from '@/features/admin/empresa/useEmpresaIndexViewModel';
import { Icon } from '@iconify/react/dist/iconify.js';
import DataTable from '@/components/Datatable';
import Button from '@/components/Button';
import EmpresaFormModal from '@/components/Empresa/EmpresaFormModal';
import EmpresaDrawer from '@/components/Empresa/EmpresaDrawer';
import InputPro from '@/components/InputPro';
import Select from '@/components/Select';
import ModalConfirm from '@/components/ModalConfirm';
import TableSkeleton from '@/components/Skeletons/table';
import TableActionMenu from '@/components/TableActionMenu';

const GRUPO_META: Record<GrupoCliente, { label: string; badge: string; icon: string; ring: string; bg: string; iconBg: string; text: string; badgeBg: string }> = {
  MENSUAL: {
    label: 'Clientes Mensuales', badge: 'Plan: Mensual', icon: 'solar:calendar-bold-duotone',
    ring: 'border-blue-200 dark:border-blue-800/40', bg: 'bg-blue-50/40 dark:bg-blue-950/10',
    iconBg: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400',
    text: 'text-blue-700 dark:text-blue-400', badgeBg: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  },
  ANUAL: {
    label: 'Clientes Anuales', badge: 'Plan: Anual', icon: 'solar:calendar-mark-bold-duotone',
    ring: 'border-emerald-200 dark:border-emerald-800/40', bg: 'bg-emerald-50/40 dark:bg-emerald-950/10',
    iconBg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400',
    text: 'text-emerald-700 dark:text-emerald-400', badgeBg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  },
  DEMO: {
    label: 'Clientes Demo', badge: 'Plan: Demo', icon: 'solar:test-tube-bold-duotone',
    ring: 'border-slate-200 dark:border-slate-700', bg: 'bg-slate-50/60 dark:bg-slate-900/20',
    iconBg: 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    text: 'text-slate-600 dark:text-slate-300', badgeBg: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  },
};

const VENCE_STYLES: Record<Severidad, { pill: string; icon: string }> = {
  vencido: { pill: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400', icon: 'solar:danger-bold' },
  critico: { pill: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', icon: 'solar:clock-circle-bold' },
  alerta: { pill: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: 'solar:bell-bing-bold' },
  ok: { pill: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: 'solar:check-circle-bold' },
  sinfecha: { pill: 'bg-gray-100 text-gray-500 dark:bg-slate-700/50 dark:text-gray-400', icon: 'solar:minus-circle-bold' },
};

const GRUPO_OPTIONS = [
  { id: '', value: 'Todos' },
  { id: 'MENSUAL', value: 'Mensuales' },
  { id: 'ANUAL', value: 'Anuales' },
  { id: 'DEMO', value: 'Demo' },
];

const EmpresasIndex = () => {
  const vm = useEmpresaIndexViewModel();
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [selectedMenuRow, setSelectedMenuRow] = useState<any>(null);
  const [expanded, setExpanded] = useState<Record<GrupoCliente, boolean>>({ DEMO: false, MENSUAL: false, ANUAL: false });
  const PREVIEW = 5;

  const handleOpenMenu = (event: MouseEvent<HTMLElement>, row: any) => {
    setMenuAnchor(event.currentTarget);
    setSelectedMenuRow(row);
  };

  const handleCloseMenu = () => {
    setMenuAnchor(null);
    setSelectedMenuRow(null);
  };

  const runMenuAction = (handler: (row: any) => void | Promise<void>) => {
    if (!selectedMenuRow) return;
    handler(selectedMenuRow);
    handleCloseMenu();
  };

  const checkCell = (ok: boolean) => (
    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${ok ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-500 dark:bg-rose-900/30 dark:text-rose-400'}`}>
      <Icon icon={ok ? 'solar:check-circle-bold' : 'solar:close-circle-bold'} width={16} height={16} />
    </span>
  );

  const buildRows = (rows: any[]) => rows.map((row: any) => {
    const sev = VENCE_STYLES[row.severidad as Severidad] ?? VENCE_STYLES.sinfecha;
    return {
      ...row,
      'Mes Activacion': (
        <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400">{row['Mes Activacion'] ?? '—'}</span>
      ),
      capacitacion: checkCell(Boolean(row.capacitacion)),
      altaSunat: checkCell(Boolean(row.altaSunat)),
      contrato: checkCell(Boolean(row.contrato)),
      bienvenidaRedes: checkCell(Boolean(row.bienvenidaRedes)),
      'Plan': (
        <div className="flex flex-col leading-tight">
          <span className="font-semibold text-gray-800 dark:text-gray-100">{row['Plan']}</span>
          {row.planCosto != null && (
            <span className="text-xs text-gray-400 dark:text-gray-500">S/ {row.planCosto.toFixed(2)}</span>
          )}
        </div>
      ),
      'Vence en': (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${sev.pill}`}>
          <Icon icon={sev.icon} width={13} height={13} />
          {row['Vence en']}
        </span>
      ),
      'Estado': (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${row.estado === 'ACTIVO' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-gray-100 text-gray-500 dark:bg-slate-700/50 dark:text-gray-400'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${row.estado === 'ACTIVO' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
          {row.estado === 'ACTIVO' ? 'Activo' : 'Inactivo'}
        </span>
      ),
      'Acciones': (
        <button
          type="button"
          onClick={(event) => handleOpenMenu(event, row)}
          className="px-2 py-1 text-xs rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 flex items-center gap-1 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
        >
          <Icon icon="mdi:dots-vertical" width={18} height={18} />
        </button>
      ),
    };
  });

  const gruposData = useMemo(() => ({
    DEMO: buildRows(vm.grupos.DEMO),
    MENSUAL: buildRows(vm.grupos.MENSUAL),
    ANUAL: buildRows(vm.grupos.ANUAL),
  }), [vm.grupos]);

  const totalVisible = vm.grupos.DEMO.length + vm.grupos.MENSUAL.length + vm.grupos.ANUAL.length;
  const gruposVisibles = (Object.keys(GRUPO_META) as GrupoCliente[]).filter(
    (g) => vm.grupoFiltro === '' || vm.grupoFiltro === g,
  );

  const baseColumns: any[] = ['RUC', 'Razon Social', 'Rubro', 'Plan', 'Vence en', 'Estado'];
  const onboardingColumns: any[] = [
    { label: 'Mes Activación', key: 'Mes Activacion' },
    { label: 'Capacitación', key: 'capacitacion' },
    { label: 'Alta SUNAT', key: 'altaSunat' },
    { label: 'Contrato', key: 'contrato' },
    { label: 'Bienvenida Redes', key: 'bienvenidaRedes' },
  ];
  // Las columnas de onboarding solo aplican a clientes reales (mensuales/anuales), no demo.
  const headerColumnsFor = (g: GrupoCliente): any[] =>
    g === 'DEMO' ? [...baseColumns, 'Acciones'] : [...baseColumns, ...onboardingColumns, 'Acciones'];

  const kpiCards: { key: 'VENCIDOS' | 'POR_VENCER_7' | 'POR_VENCER_30'; label: string; value: number; icon: string; active: string; idle: string }[] = [
    { key: 'VENCIDOS', label: 'Vencidos', value: vm.kpis.vencidos, icon: 'solar:danger-triangle-bold-duotone', active: 'border-rose-400 bg-rose-50 dark:bg-rose-950/30 ring-2 ring-rose-300/50', idle: 'border-rose-100 dark:border-rose-900/30 hover:border-rose-300' },
    { key: 'POR_VENCER_7', label: 'Vencen en ≤ 7 días', value: vm.kpis.porVencer7, icon: 'solar:clock-circle-bold-duotone', active: 'border-orange-400 bg-orange-50 dark:bg-orange-950/30 ring-2 ring-orange-300/50', idle: 'border-orange-100 dark:border-orange-900/30 hover:border-orange-300' },
    { key: 'POR_VENCER_30', label: 'Vencen en ≤ 30 días', value: vm.kpis.porVencer30, icon: 'solar:bell-bing-bold-duotone', active: 'border-amber-400 bg-amber-50 dark:bg-amber-950/30 ring-2 ring-amber-300/50', idle: 'border-amber-100 dark:border-amber-900/30 hover:border-amber-300' },
  ];

  const kpiIconColor: Record<string, string> = {
    VENCIDOS: 'text-rose-500', POR_VENCER_7: 'text-orange-500', POR_VENCER_30: 'text-amber-500',
  };

  if (vm.loading && vm.empresas.length === 0) return <TableSkeleton />;

  return (
    <div className="min-h-screen px-2 pb-4 bg-gray-50 dark:bg-[#0A0D14]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5 pt-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            <Icon icon="solar:buildings-bold-duotone" className="text-blue-600 dark:text-blue-400" />
            Empresas
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Control de suscripciones por tipo de cliente y vencimiento</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => vm.exportarEmpresas('pdf')}
            disabled={vm.exportando !== null}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200 bg-white text-sm font-bold text-rose-600 hover:bg-rose-50 transition-all disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-rose-300 dark:hover:bg-slate-700"
            title="Exportar el listado filtrado en PDF"
          >
            <Icon icon={vm.exportando === 'pdf' ? 'svg-spinners:180-ring' : 'solar:file-text-bold-duotone'} className="text-lg" />
            PDF
          </button>
          <button
            onClick={() => vm.exportarEmpresas('excel')}
            disabled={vm.exportando !== null}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-200 bg-white text-sm font-bold text-emerald-600 hover:bg-emerald-50 transition-all disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-emerald-300 dark:hover:bg-slate-700"
            title="Exportar el listado filtrado en Excel"
          >
            <Icon icon={vm.exportando === 'excel' ? 'svg-spinners:180-ring' : 'solar:document-add-bold-duotone'} className="text-lg" />
            Excel
          </button>
          <button
            onClick={() => { vm.setEmpresaEditingId(undefined); vm.setEmpresaModalMode('create'); vm.setOpenEmpresaModal(true); }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
          >
            <Icon icon="solar:add-circle-bold" className="text-lg" />
            Nueva Empresa
          </button>
        </div>
      </div>

      {/* KPIs de vencimiento — clic para filtrar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        {kpiCards.map((c) => {
          const isActive = vm.vencimientoFiltro === c.key;
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => vm.toggleVencimiento(c.key)}
              className={`flex items-center gap-3 p-4 rounded-2xl border bg-white dark:bg-[#111827] text-left transition-all active:scale-[0.98] ${isActive ? c.active : c.idle}`}
            >
              <div className="shrink-0">
                <Icon icon={c.icon} className={`text-3xl ${kpiIconColor[c.key]}`} />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-extrabold text-gray-900 dark:text-white leading-none">{c.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">{c.label}</p>
              </div>
              {isActive && <Icon icon="solar:close-circle-bold" className="ml-auto text-gray-400 text-lg" />}
            </button>
          );
        })}
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-5 mb-5">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1"><InputPro name="search" onChange={vm.handleSearch} label="Buscar por RUC o razón social" isLabel value={vm.searchTerm} /></div>
          <div className="w-full lg:w-44"><Select name="grupoFiltro" label="Grupo" error={() => { }} options={GRUPO_OPTIONS} onChange={(id: any) => vm.setGrupoFiltro(id)} withLabel value={vm.grupoFiltro} /></div>
          <div className="w-full lg:w-44"><Select name="tipoFiltro" label="Tipo" error={() => { }} options={[{ id: '', value: 'Todas' }, { id: 'FORMAL', value: 'Formales' }, { id: 'INFORMAL', value: 'Informales' }]} onChange={(id: any) => { vm.setTipoFiltro(id); vm.setCurrentPageState(1); }} withLabel /></div>
          <div className="w-full lg:w-40"><Select name="estadoFiltro" label="Estado" error={() => { }} options={[{ id: 'TODOS', value: 'Todos' }, { id: 'ACTIVO', value: 'Activos' }, { id: 'INACTIVO', value: 'Inactivos' }]} onChange={(id: any) => { vm.setEstadoFiltro(id); vm.setCurrentPageState(1); }} withLabel value={vm.estadoFiltro} /></div>
        </div>
      </div>

      {vm.error && <div className="mb-5 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400 rounded-lg flex items-center gap-2 font-medium text-sm"><Icon icon="solar:danger-circle-bold" className="text-xl" />{vm.error}</div>}

      {/* Secciones agrupadas */}
      {totalVisible > 0 ? (
        <div className="flex flex-col gap-5">
          {gruposVisibles.map((g) => {
            const meta = GRUPO_META[g];
            const rows = gruposData[g];
            return (
              <div key={g} className={`rounded-2xl border ${meta.ring} ${meta.bg} overflow-hidden`}>
                <div className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${meta.iconBg}`}>
                      <Icon icon={meta.icon} width={20} height={20} />
                    </div>
                    <h2 className={`text-base font-bold ${meta.text}`}>{meta.label}</h2>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${meta.badgeBg}`}>{rows.length}</span>
                  </div>
                  <span className={`hidden sm:inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold ${meta.badgeBg}`}>{meta.badge}</span>
                </div>
                {rows.length > 0 ? (
                  <div className="bg-white dark:bg-[#111827] border-t border-gray-100 dark:border-slate-800">
                    <div className="overflow-hidden overflow-x-auto">
                      <DataTable actions={[]} bodyData={expanded[g] ? rows : rows.slice(0, PREVIEW)} headerColumns={headerColumnsFor(g)} />
                    </div>
                    {rows.length > PREVIEW && (
                      <button
                        type="button"
                        onClick={() => setExpanded((p) => ({ ...p, [g]: !p[g] }))}
                        className={`w-full flex items-center justify-center gap-1.5 py-3 text-sm font-semibold border-t border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors ${meta.text}`}
                      >
                        {expanded[g] ? 'Ver menos' : `Ver todos los ${meta.label.toLowerCase()} (${rows.length})`}
                        <Icon icon={expanded[g] ? 'solar:alt-arrow-up-linear' : 'solar:alt-arrow-down-linear'} width={16} height={16} />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="bg-white dark:bg-[#111827] border-t border-gray-100 dark:border-slate-800 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
                    Sin clientes en este grupo
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : !vm.loading && (
        <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-slate-800 py-12 text-center">
          <Icon icon="solar:buildings-3-linear" className="text-5xl text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">No se encontraron empresas</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            {vm.searchTerm || vm.vencimientoFiltro ? 'Intenta con otros filtros o términos de búsqueda' : 'Aún no tienes empresas registradas'}
          </p>
          <Button variant="default" onClick={() => { vm.setEmpresaEditingId(undefined); vm.setEmpresaModalMode('create'); vm.setOpenEmpresaModal(true); }} className="mt-4"><Icon icon="solar:add-circle-bold" className="mr-2" />Crear Primera Empresa</Button>
        </div>
      )}

      <ModalConfirm isOpenModal={vm.isOpenModalConfirm} setIsOpenModal={vm.setIsOpenModalConfirm}
        title={vm.selectedEmpresa?.accion === 'eliminar' ? 'Eliminar Empresa' : `${vm.selectedEmpresa?.estado === 'ACTIVO' ? 'Desactivar' : 'Activar'} Empresa`}
        information={vm.selectedEmpresa?.accion === 'eliminar' ? `⚠️ Esta acción eliminará PERMANENTEMENTE la empresa "${vm.selectedEmpresa?.['Razon Social']}". Esta acción NO se puede deshacer.` : `¿Estás seguro que deseas ${vm.selectedEmpresa?.estado === 'ACTIVO' ? 'desactivar' : 'activar'} la empresa "${vm.selectedEmpresa?.['Razon Social']}"?`}
        confirmSubmit={vm.confirmAction}
      />
      <EmpresaFormModal open={vm.openEmpresaModal} mode={vm.empresaModalMode} empresaId={vm.empresaEditingId} onClose={() => vm.setOpenEmpresaModal(false)} onSaved={vm.refreshEmpresas} />
      <EmpresaDrawer empresa={vm.drawerEmpresa} onClose={() => vm.setDrawerEmpresa(null)} />
      <TableActionMenu
        isOpen={Boolean(menuAnchor)}
        anchorEl={menuAnchor}
        onClose={handleCloseMenu}
        className="w-56"
      >
        {selectedMenuRow && (
          <>
            <button type="button" onClick={() => runMenuAction(vm.handleViewDetails)} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700">
              <Icon icon="solar:eye-bold-duotone" width={16} height={16} />
              <span>Ver detalles</span>
            </button>
            <button type="button" onClick={() => runMenuAction(vm.handleEdit)} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700">
              <Icon icon="material-symbols:edit" width={16} height={16} />
              <span>Editar</span>
            </button>
            {/* Contrato de servicios — solo clientes reales (mensuales/anuales), no demo */}
            {selectedMenuRow.grupo !== 'DEMO' && (
              <>
                <div className="border-t border-gray-100 dark:border-slate-700 my-1" />
                <button type="button" onClick={() => runMenuAction(vm.handleDescargarContrato)} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700">
                  <Icon icon="solar:file-download-bold-duotone" width={16} height={16} />
                  <span>Descargar contrato</span>
                </button>
                <button type="button" onClick={() => runMenuAction((row) => vm.handleEnviarContrato(row, 'email'))} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30">
                  <Icon icon="solar:letter-bold-duotone" width={16} height={16} />
                  <span>Enviar contrato por correo</span>
                </button>
                <button type="button" onClick={() => runMenuAction((row) => vm.handleEnviarContrato(row, 'whatsapp'))} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/30">
                  <Icon icon="ic:baseline-whatsapp" width={16} height={16} />
                  <span>Enviar contrato por WhatsApp</span>
                </button>
              </>
            )}
            {selectedMenuRow.estado === 'ACTIVO' && (
              <>
                <div className="border-t border-gray-100 dark:border-slate-700 my-1" />
                <button type="button" onClick={() => runMenuAction(vm.handleEnviarRecordatorioEmail)} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30">
                  <Icon icon="solar:letter-bold-duotone" width={16} height={16} />
                  <span>Recordar por correo</span>
                </button>
                <button type="button" onClick={() => runMenuAction(vm.handleEnviarRecordatorioWhatsapp)} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/30">
                  <Icon icon="ic:baseline-whatsapp" width={16} height={16} />
                  <span>Recordar por WhatsApp</span>
                </button>
              </>
            )}
            <div className="border-t border-gray-100 dark:border-slate-700 my-1" />
            <button type="button" onClick={() => runMenuAction(vm.handleToggleState)} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30">
              <Icon icon="mdi:power" width={16} height={16} />
              <span>{selectedMenuRow.estado === 'ACTIVO' ? 'Desactivar' : 'Activar'}</span>
            </button>
            <button type="button" onClick={() => runMenuAction(vm.handleDelete)} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30">
              <Icon icon="mdi:trash-can" width={16} height={16} />
              <span>Eliminar</span>
            </button>
          </>
        )}
      </TableActionMenu>
    </div>
  );
};

export default EmpresasIndex;
