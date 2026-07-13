import { Icon } from '@iconify/react';
import Button from '@/components/Button';
import InputPro from '@/components/InputPro';
import DataTable from '@/components/Datatable';
import { useDocumentosViewModel } from './useDocumentosViewModel';
import ModalDocumento from './shared/ModalDocumento';
import { ENTIDADES_DOC, ESTADOS_DOC, BADGE_COLORS, labelTipoDoc } from './DocumentosModel';
import { format } from 'date-fns';

function KpiCard({ icon, label, value, color }: { icon: string; label: string; value: string | number; color: string }) {
  return (
    <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-slate-800 p-4 flex items-center gap-3 shadow-sm">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
        <Icon icon={icon} width={22} />
      </div>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}

export default function DocumentosView() {
  const vm = useDocumentosViewModel();
  const { documentos, resumen, actions } = vm;

  const tableActions = [
    { tooltip: 'Editar', icon: <Icon icon="solar:pen-bold-duotone" width={18} />, onClick: (d: any) => actions.openEditModal(d._original), color: 'blue' as const },
    { tooltip: 'Eliminar', icon: <Icon icon="solar:trash-bin-trash-bold-duotone" width={18} />, onClick: (d: any) => actions.handleDelete(d.id), color: 'rose' as const },
  ];

  const tableData = documentos.map((d) => {
    const estadoObj = ESTADOS_DOC.find((e) => e.value === d.estado);
    const titular = d.entidad === 'VEHICULO'
      ? { icon: 'solar:bus-bold-duotone', main: d.vehiculo?.placa ?? '—', sub: [d.vehiculo?.marca, d.vehiculo?.modelo].filter(Boolean).join(' '), color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' }
      : { icon: 'solar:user-bold-duotone', main: `${d.conductor?.nombre ?? ''} ${d.conductor?.apellido ?? ''}`.trim() || '—', sub: d.conductor?.dni ? `DNI ${d.conductor.dni}` : '', color: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400' };

    const dias = d.diasRestantes ?? 0;
    const diasTxt = d.estado === 'VENCIDO' ? `Venció hace ${Math.abs(dias)}d` : `Faltan ${dias}d`;
    const diasColor = d.estado === 'VENCIDO' ? 'text-rose-600 dark:text-rose-400' : d.estado === 'POR_VENCER' ? 'text-amber-600 dark:text-amber-400' : 'text-gray-500';

    return {
      id: d.id,
      Documento: (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold text-gray-900 dark:text-white">{labelTipoDoc(d.tipo)}</span>
          {d.numero && <span className="text-xs text-gray-500">N° {d.numero}</span>}
        </div>
      ),
      Titular: (
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${titular.color}`}>
            <Icon icon={titular.icon} width={20} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{titular.main}</p>
            <p className="text-xs text-gray-500">{titular.sub}</p>
          </div>
        </div>
      ),
      Vencimiento: (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm text-gray-700 dark:text-gray-300">{format(new Date(d.fechaVencimiento), 'dd/MM/yyyy')}</span>
          <span className={`text-xs font-medium ${diasColor}`}>{diasTxt}</span>
        </div>
      ),
      Estado: estadoObj ? (
        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${BADGE_COLORS[estadoObj.color] || BADGE_COLORS.gray}`}>{estadoObj.label}</span>
      ) : null,
      _original: d,
    };
  });

  return (
    <div className="min-h-screen px-2 pb-4 relative z-1 dark:bg-[#0A0D14]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Documentos y Alertas</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Control de vencimientos: SOAT, revisión técnica, licencias y más</p>
        </div>
        <Button color="secondary" onClick={actions.openNewModal} className="flex items-center gap-2 !bg-indigo-600 border-none shadow-md shadow-indigo-200/50">
          <Icon icon="solar:add-circle-bold" className="text-lg" />
          Nuevo Documento
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <KpiCard icon="solar:danger-triangle-bold-duotone" label="Vencidos" value={resumen?.vencidos ?? 0} color="bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400" />
        <KpiCard icon="solar:clock-circle-bold-duotone" label="Por vencer (30d)" value={resumen?.porVencer ?? 0} color="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" />
        <KpiCard icon="solar:check-circle-bold-duotone" label="Vigentes" value={resumen?.vigentes ?? 0} color="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" />
        <KpiCard icon="solar:document-text-bold-duotone" label="Total" value={resumen?.total ?? 0} color="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400" />
      </div>

      <div className="bg-white dark:bg-[#111827] relative z-0 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
        <div className="p-5 border-b border-gray-100 dark:border-slate-800">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <InputPro name="search" placeholder="Buscar por tipo o número..." value={vm.searchTerm} onChange={(e) => vm.setSearchTerm(e.target.value)} />
            </div>
            <div className="w-full lg:w-44">
              <select value={vm.entidadFilter} onChange={(e) => vm.setEntidadFilter(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500">
                <option value="">Todos</option>
                {ENTIDADES_DOC.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
              </select>
            </div>
            <div className="w-full lg:w-44">
              <select value={vm.estadoFilter} onChange={(e) => vm.setEstadoFilter(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500">
                <option value="">Todos los estados</option>
                {ESTADOS_DOC.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="p-0">
          <DataTable
            actions={tableActions}
            headerColumns={[
              { label: 'Documento', key: 'Documento' },
              { label: 'Titular', key: 'Titular' },
              { label: 'Vencimiento', key: 'Vencimiento' },
              { label: 'Estado', key: 'Estado' },
            ]}
            bodyData={tableData}
          />
        </div>
      </div>

      <ModalDocumento isOpen={vm.isModalOpen} onClose={() => vm.setIsModalOpen(false)} onSubmit={actions.handleCreateOrUpdate} documento={vm.selected} vehiculos={vm.vehiculos} conductores={vm.conductores} />
    </div>
  );
}
