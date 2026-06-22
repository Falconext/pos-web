import { useState } from 'react';
import { Icon } from '@iconify/react';
import { useRentabilidadViewModel } from './rentabilidad/useRentabilidadViewModel';
import RentabilidadView from './rentabilidad/RentabilidadView';
import FinanceDashboardView from './FinanceDashboardView';
import ComisionesView from './comisiones/ComisionesView';
import CategoriasView from './categorias/CategoriasView';
import MetodosPagoView from './metodos-pago/MetodosPagoView';

type TabId = 'rentabilidad' | 'flujo' | 'comisiones' | 'categorias' | 'metodosPago';

interface Tab {
    id: TabId;
    label: string;
    icon: string;
    description: string;
}

const TABS: Tab[] = [
    {
        id: 'rentabilidad',
        label: 'Rentabilidad',
        icon: 'solar:chart-2-bold-duotone',
        description: 'P&L — Análisis de ganancias y pérdidas',
    },
    {
        id: 'flujo',
        label: 'Flujo de Caja',
        icon: 'solar:wallet-money-bold-duotone',
        description: 'Ingresos y egresos del período',
    },
    {
        id: 'comisiones',
        label: 'Comisiones',
        icon: 'solar:users-group-rounded-bold-duotone',
        description: 'Comisiones por vendedor',
    },
    {
        id: 'categorias',
        label: 'Categorías',
        icon: 'solar:tag-bold-duotone',
        description: 'Ganancia por categoría de producto',
    },
    {
        id: 'metodosPago',
        label: 'Métodos de pago',
        icon: 'solar:card-2-bold-duotone',
        description: 'Cobros por método, voucher y cuenta',
    },
];

export default function FinanzasTabs() {
    const [activeTab, setActiveTab] = useState<TabId>('rentabilidad');
    const vm = useRentabilidadViewModel();

    return (
        <div className="min-h-screen bg-[#F8F9FB] dark:bg-[#0A0D14]">
            {/* ── Header + Tab bar area ── */}
            <div className="px-6 pt-6">
                {/* Page Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-2 text-sm text-gray-400 font-medium mb-1">
                        <span>Finanzas</span>
                        <Icon icon="solar:alt-arrow-right-linear" />
                        <span className="text-indigo-600 dark:text-indigo-400">
                            {TABS.find(t => t.id === activeTab)?.label}
                        </span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                        Análisis Financiero
                    </h1>
                </div>

                {/* Tab Switcher */}
                <div className="flex items-center gap-2 mb-6 bg-white dark:bg-[#111827] rounded-2xl p-1.5 border border-gray-100/50 dark:border-slate-800 shadow-sm w-fit">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                                activeTab === tab.id
                                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200 dark:shadow-indigo-900/30'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800'
                            }`}
                        >
                            <Icon icon={tab.icon} className="text-base flex-shrink-0" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Tab Content ── */}
            {activeTab === 'rentabilidad' && (
                <div className="px-6 pb-6">
                    <RentabilidadView
                        mesActual={vm.mesActual}
                        anioActual={vm.anioActual}
                        pnl={vm.pnl}
                        evolucion={vm.evolucion}
                        gastos={vm.gastos}
                        isLoading={vm.isLoading}
                        isModalOpen={vm.isModalOpen}
                        gastoEditando={vm.gastoEditando}
                        isSaving={vm.isSaving}
                        isCurrentOrFuture={vm.isCurrentOrFuture}
                        navegarMes={vm.navegarMes}
                        crearGasto={vm.crearGasto}
                        actualizarGasto={vm.actualizarGasto}
                        eliminarGasto={vm.eliminarGasto}
                        abrirModalCrear={vm.abrirModalCrear}
                        abrirModalEditar={vm.abrirModalEditar}
                        cerrarModal={vm.cerrarModal}
                    />
                </div>
            )}

            {/* Flujo tab: FinanceDashboardView owns its own full-page container */}
            {activeTab === 'flujo' && (
                <FinanceDashboardView />
            )}

            {activeTab === 'comisiones' && (
                <div className="px-6 pb-6">
                    <ComisionesView />
                </div>
            )}

            {activeTab === 'categorias' && (
                <div className="px-6 pb-6">
                    <CategoriasView />
                </div>
            )}

            {activeTab === 'metodosPago' && (
                <div className="px-6 pb-6">
                    <MetodosPagoView />
                </div>
            )}
        </div>
    );
}
