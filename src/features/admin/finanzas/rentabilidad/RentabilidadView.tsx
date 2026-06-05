import { Icon } from '@iconify/react';
import {
    PnlResponse,
    GastoOperativo,
    EvolucionPoint,
    formatCurrency,
    formatPercent,
    getMesFullLabel,
    GastoFormData,
} from './RentabilidadModel';
import PnlTable from './components/PnlTable';
import GastosPanel from './components/GastosPanel';
import EvolucionChart from './components/EvolucionChart';
import GastoFormModal from './components/GastoFormModal';

interface RentabilidadViewProps {
    mesActual: number;
    anioActual: number;
    pnl: PnlResponse | null;
    evolucion: EvolucionPoint[];
    gastos: GastoOperativo[];
    isLoading: boolean;
    isModalOpen: boolean;
    gastoEditando: GastoOperativo | null;
    isSaving: boolean;
    isCurrentOrFuture: boolean;
    navegarMes: (delta: -1 | 1) => void;
    crearGasto: (data: GastoFormData) => Promise<boolean>;
    actualizarGasto: (id: number, data: Partial<GastoFormData>) => Promise<boolean>;
    eliminarGasto: (id: number) => Promise<boolean>;
    abrirModalCrear: () => void;
    abrirModalEditar: (gasto: GastoOperativo) => void;
    cerrarModal: () => void;
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

interface KpiCardProps {
    title: string;
    value: string;
    icon: string;
    iconBg: string;
    iconColor: string;
    sub?: string;
    subColor?: string;
    badge?: React.ReactNode;
    highlighted?: boolean;
    highlightColor?: string;
}

function KpiCard({ title, value, icon, iconBg, iconColor, sub, subColor, badge, highlighted, highlightColor }: KpiCardProps) {
    if (highlighted) {
        return (
            <div className={`rounded-3xl p-6 shadow-sm border transition-all hover:shadow-md ${highlightColor ?? 'bg-emerald-500 border-emerald-400'}`}>
                <div className="flex justify-between items-start mb-3">
                    <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-sm">
                        <Icon icon={icon} className="text-white text-xl" />
                    </div>
                    {badge && <div>{badge}</div>}
                </div>
                <p className="text-white/80 font-medium text-sm mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-white tracking-tight">{value}</h3>
                {sub && (
                    <p className={`text-sm mt-1 font-medium ${subColor ?? 'text-white/70'}`}>{sub}</p>
                )}
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-[#111827] rounded-3xl p-6 shadow-sm border border-gray-100/50 dark:border-slate-800 transition-all hover:shadow-md">
            <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${iconBg}`}>
                    <Icon icon={icon} className={iconColor} />
                </div>
                {badge && <div>{badge}</div>}
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium text-sm mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{value}</h3>
            {sub && (
                <p className={`text-sm mt-1 font-medium ${subColor ?? 'text-gray-400'}`}>{sub}</p>
            )}
        </div>
    );
}

// ─── Variación badge ──────────────────────────────────────────────────────────

function VariacionBadge({ variacion }: { variacion: number | null }) {
    if (variacion === null) return null;
    const isPositive = variacion >= 0;
    return (
        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-lg ${
            isPositive
                ? 'bg-white/20 text-white'
                : 'bg-white/20 text-white'
        }`}>
            <Icon
                icon={isPositive ? 'solar:arrow-up-bold' : 'solar:arrow-down-bold'}
                className="text-xs"
            />
            {formatPercent(variacion)} vs mes ant.
        </span>
    );
}

// ─── Main View ────────────────────────────────────────────────────────────────

export default function RentabilidadView(props: RentabilidadViewProps) {
    const {
        mesActual, anioActual, pnl, evolucion, gastos,
        isLoading, isModalOpen, gastoEditando, isSaving, isCurrentOrFuture,
        navegarMes, crearGasto, actualizarGasto, eliminarGasto,
        abrirModalCrear, abrirModalEditar, cerrarModal,
    } = props;

    const isNeta = (pnl?.gananciaNeta ?? 0) >= 0;

    return (
        <div className="space-y-6">
            {/* ── Month Navigator ── */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Rentabilidad P&amp;L</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        Análisis detallado de ganancias y pérdidas
                    </p>
                </div>

                <div className="flex items-center gap-2 bg-white dark:bg-[#111827] border border-gray-100/50 dark:border-slate-800 rounded-2xl p-1.5 shadow-sm">
                    <button
                        onClick={() => navegarMes(-1)}
                        className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                    >
                        <Icon icon="solar:arrow-left-bold" className="text-base" />
                        <span className="hidden sm:inline">Anterior</span>
                    </button>

                    <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/20">
                        <Icon icon="solar:calendar-date-bold-duotone" className="text-indigo-600 dark:text-indigo-400 text-base" />
                        <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300 whitespace-nowrap">
                            {getMesFullLabel(mesActual)} {anioActual}
                        </span>
                    </div>

                    <button
                        onClick={() => navegarMes(1)}
                        disabled={isCurrentOrFuture}
                        className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-gray-600 disabled:hover:bg-transparent"
                    >
                        <span className="hidden sm:inline">Siguiente</span>
                        <Icon icon="solar:arrow-right-bold" className="text-base" />
                    </button>
                </div>
            </div>

            {/* ── Loading ── */}
            {isLoading && (
                <div className="flex items-center justify-center py-20">
                    <Icon icon="eos-icons:loading" className="text-4xl text-indigo-500 animate-spin" />
                    <span className="ml-3 text-gray-500 dark:text-gray-400 font-medium">Calculando rentabilidad...</span>
                </div>
            )}

            {!isLoading && (
                <>
                    {/* ── Row 1: KPI Cards ── */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                        {/* Ventas Netas */}
                        <KpiCard
                            title="Ventas Netas"
                            value={formatCurrency(pnl?.ventasNetas ?? 0)}
                            icon="solar:cart-large-4-bold-duotone"
                            iconBg="bg-indigo-50 dark:bg-indigo-900/20"
                            iconColor="text-indigo-600 dark:text-indigo-400"
                        />

                        {/* Ganancia Bruta */}
                        <KpiCard
                            title="Ganancia Bruta"
                            value={formatCurrency(pnl?.gananciaBruta ?? 0)}
                            icon="solar:chart-bold-duotone"
                            iconBg="bg-blue-50 dark:bg-blue-900/20"
                            iconColor="text-blue-600 dark:text-blue-400"
                            sub={pnl ? `Margen ${formatPercent(pnl.margenBruto)}` : undefined}
                            subColor="text-blue-500 dark:text-blue-400"
                        />

                        {/* Total Gastos Operativos */}
                        <KpiCard
                            title="Total Gastos Op."
                            value={formatCurrency(pnl?.gastosTotales ?? 0)}
                            icon="solar:bill-list-bold-duotone"
                            iconBg="bg-amber-50 dark:bg-amber-900/20"
                            iconColor="text-amber-600 dark:text-amber-400"
                            sub={pnl && pnl.gastosPorCategoria.length > 0
                                ? `${pnl.gastosPorCategoria.length} categorías`
                                : 'Sin gastos registrados'}
                            subColor="text-amber-500 dark:text-amber-400"
                        />

                        {/* Ganancia Neta — highlighted */}
                        <KpiCard
                            title="Ganancia Neta Real"
                            value={formatCurrency(pnl?.gananciaNeta ?? 0)}
                            icon={isNeta ? 'solar:graph-up-bold-duotone' : 'solar:graph-down-bold-duotone'}
                            iconBg=""
                            iconColor=""
                            sub={pnl ? `Margen ${formatPercent(pnl.margenNeto)}` : undefined}
                            subColor="text-white/70"
                            highlighted
                            highlightColor={isNeta
                                ? 'bg-emerald-500 border-emerald-400 hover:shadow-emerald-200 dark:hover:shadow-emerald-900/20'
                                : 'bg-rose-500 border-rose-400 hover:shadow-rose-200 dark:hover:shadow-rose-900/20'}
                            badge={
                                pnl != null && pnl.comparacion.variacionPorcentaje !== null
                                    ? <VariacionBadge variacion={pnl.comparacion.variacionPorcentaje} />
                                    : undefined
                            }
                        />
                    </div>

                    {/* ── Row 2: PnlTable + GastosPanel ── */}
                    {pnl ? (
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                            {/* P&L Table — 60% */}
                            <div className="lg:col-span-3">
                                <PnlTable pnl={pnl} />
                            </div>
                            {/* Gastos Panel — 40% */}
                            <div className="lg:col-span-2">
                                <GastosPanel
                                    gastos={gastos}
                                    onAgregar={abrirModalCrear}
                                    onEditar={abrirModalEditar}
                                    onEliminar={eliminarGasto}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-[#111827] rounded-3xl p-12 border border-gray-100/50 dark:border-slate-800 text-center">
                            <div className="w-16 h-16 rounded-3xl bg-gray-50 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                                <Icon icon="solar:chart-2-bold-duotone" className="text-3xl text-gray-300 dark:text-slate-600" />
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 font-semibold">Sin datos para {getMesFullLabel(mesActual)} {anioActual}</p>
                            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Aún no hay ventas registradas en este período</p>
                        </div>
                    )}

                    {/* ── Row 3: Evolution Chart ── */}
                    <EvolucionChart evolucion={evolucion} />
                </>
            )}

            {/* ── Gasto Form Modal ── */}
            <GastoFormModal
                isOpen={isModalOpen}
                mesActual={mesActual}
                anioActual={anioActual}
                gastoEditando={gastoEditando}
                isSaving={isSaving}
                onClose={cerrarModal}
                onCrear={crearGasto}
                onActualizar={actualizarGasto}
            />
        </div>
    );
}
