import { useState } from 'react';
import { Icon } from '@iconify/react';
import {
    PnlResponse,
    GastoOperativo,
    EvolucionPoint,
    formatCurrency,
    formatDate,
    formatPercent,
    getMesFullLabel,
    GastoFormData,
    IngresoManual,
    IngresoFormData,
} from './RentabilidadModel';
import PnlTable from './components/PnlTable';
import GastosPanel from './components/GastosPanel';
import IngresosPanel from './components/IngresosPanel';
import EvolucionChart from './components/EvolucionChart';
import GastoFormModal from './components/GastoFormModal';
import IngresoFormModal from './components/IngresoFormModal';
import HistorialFinancieroDrawer from './components/HistorialFinancieroDrawer';

interface RentabilidadViewProps {
    mesActual: number;
    anioActual: number;
    pnl: PnlResponse | null;
    evolucion: EvolucionPoint[];
    gastos: GastoOperativo[];
    ingresos: IngresoManual[];
    isLoading: boolean;
    isModalOpen: boolean;
    gastoEditando: GastoOperativo | null;
    isSaving: boolean;
    isIngresoModalOpen: boolean;
    ingresoEditando: IngresoManual | null;
    isSavingIngreso: boolean;
    isCurrentOrFuture: boolean;
    navegarMes: (delta: -1 | 1) => void;
    crearGasto: (data: GastoFormData) => Promise<boolean>;
    actualizarGasto: (id: number, data: Partial<GastoFormData>) => Promise<boolean>;
    eliminarGasto: (id: number) => Promise<boolean>;
    abrirModalCrear: () => void;
    abrirModalEditar: (gasto: GastoOperativo) => void;
    cerrarModal: () => void;
    crearIngreso: (data: IngresoFormData) => Promise<boolean>;
    actualizarIngreso: (id: number, data: Partial<IngresoFormData>) => Promise<boolean>;
    eliminarIngreso: (id: number) => Promise<boolean>;
    abrirModalCrearIngreso: () => void;
    abrirModalEditarIngreso: (ingreso: IngresoManual) => void;
    cerrarModalIngreso: () => void;
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
                    <div className="p-2.5 bg-white/20 rounded-2xl  ">
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

function DailyProfitCard({ pnl }: { pnl: PnlResponse }) {
    const topDays = pnl.resumenDiario.slice(0, 7);

    return (
        <div className="bg-white dark:bg-[#111827] rounded-3xl p-6 shadow-sm border border-gray-100/50 dark:border-slate-800">
            <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                        <Icon icon="solar:calendar-mark-bold-duotone" className="text-emerald-600 dark:text-emerald-400 text-xl" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-base">Ganancia diaria real</h3>
                        <p className="text-xs text-gray-400 dark:text-gray-500">Ventas menos productos, publicidad y gastos diarios</p>
                    </div>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400">
                    Últimos {topDays.length || 0} días
                </span>
            </div>

            {topDays.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-gray-500 py-4">
                    Aún no hay ventas con productos para este período.
                </p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {topDays.map((day) => {
                        const positive = day.gananciaNeta >= 0;
                        return (
                            <div
                                key={day.fecha}
                                className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-900/40 p-4"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm font-bold text-gray-900 dark:text-white">{formatDate(day.fecha)}</span>
                                    <span className={`text-xs font-black px-2 py-1 rounded-full ${
                                        positive
                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                            : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
                                    }`}>
                                        Neto {formatPercent(day.margenNeto)}
                                    </span>
                                </div>
                                <div className="space-y-1 text-xs">
                                    <div className="flex justify-between text-gray-500 dark:text-gray-400">
                                        <span>Ventas</span>
                                        <span>{formatCurrency(day.ventasNetas)}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-500 dark:text-gray-400">
                                        <span>Costo real</span>
                                        <span>{formatCurrency(day.costoMercaderia)}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-500 dark:text-gray-400">
                                        <span>Publicidad</span>
                                        <span>{formatCurrency(day.publicidad)}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-500 dark:text-gray-400">
                                        <span>ROAS</span>
                                        <span>{day.roas === null ? '-' : `${day.roas.toFixed(2)}x`}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-500 dark:text-gray-400">
                                        <span>Pedidos / costo pub.</span>
                                        <span>
                                            {day.pedidos} / {day.costoPublicidadPorPedido === null ? '-' : formatCurrency(day.costoPublicidadPorPedido)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between pt-2 mt-2 border-t border-gray-200 dark:border-slate-700">
                                        <span className="font-bold text-gray-700 dark:text-gray-300">Ganancia neta</span>
                                        <span className={`font-black ${positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                                            {formatCurrency(day.gananciaNeta)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ─── Main View ────────────────────────────────────────────────────────────────

export default function RentabilidadView(props: RentabilidadViewProps) {
    const {
        mesActual, anioActual, pnl, evolucion, gastos, ingresos,
        isLoading, isModalOpen, gastoEditando, isSaving, isCurrentOrFuture,
        isIngresoModalOpen, ingresoEditando, isSavingIngreso,
        navegarMes, crearGasto, actualizarGasto, eliminarGasto,
        abrirModalCrear, abrirModalEditar, cerrarModal,
        crearIngreso, actualizarIngreso, eliminarIngreso,
        abrirModalCrearIngreso, abrirModalEditarIngreso, cerrarModalIngreso,
    } = props;

    const isNeta = (pnl?.gananciaNeta ?? 0) >= 0;
    const [isHistorialOpen, setIsHistorialOpen] = useState(false);

    return (
        <div className="space-y-6">
            {/* ── Month Navigator ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Rentabilidad P&amp;L</h2>
                    <div className="flex items-center gap-3 mt-1">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Análisis detallado de ganancias y pérdidas
                        </p>
                        <button onClick={() => setIsHistorialOpen(true)} className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-semibold rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors border border-indigo-100 dark:border-indigo-800/30">
                            <Icon icon="solar:history-bold-duotone" />
                            Ver historial completo
                        </button>
                    </div>
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
                            sub={pnl ? `Margen ${formatPercent(pnl.margenBruto)} · Costo real ${formatCurrency(pnl.costoMercaderia)}` : undefined}
                            subColor="text-blue-500 dark:text-blue-400"
                        />

                        {/* Total Gastos Operativos */}
                        <KpiCard
                            title="Total Gastos Op."
                            value={formatCurrency(pnl?.gastosTotales ?? 0)}
                            icon="solar:bill-list-bold-duotone"
                            iconBg="bg-amber-50 dark:bg-amber-900/20"
                            iconColor="text-amber-600 dark:text-amber-400"
                            sub={pnl
                                ? `Publicidad ${formatCurrency(pnl.gastoPublicidad)}`
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

                    {/* ── Row 2: PnlTable + Panels ── */}
                    {pnl ? (
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                            {/* P&L Table — 60% */}
                            <div className="lg:col-span-3">
                                <PnlTable pnl={pnl} />
                            </div>
                            {/* Right panels — 40%: Gastos + Ingresos stacked */}
                            <div className="lg:col-span-2 flex flex-col gap-6">
                                <GastosPanel
                                    gastos={gastos}
                                    onAgregar={abrirModalCrear}
                                    onEditar={abrirModalEditar}
                                    onEliminar={eliminarGasto}
                                />
                                <IngresosPanel
                                    ingresos={ingresos}
                                    onAgregar={abrirModalCrearIngreso}
                                    onEditar={abrirModalEditarIngreso}
                                    onEliminar={eliminarIngreso}
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

                    {pnl && <DailyProfitCard pnl={pnl} />}

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

            {/* ── Ingreso Form Modal ── */}
            <IngresoFormModal
                isOpen={isIngresoModalOpen}
                mesActual={mesActual}
                anioActual={anioActual}
                ingresoEditando={ingresoEditando}
                isSaving={isSavingIngreso}
                onClose={cerrarModalIngreso}
                onCrear={crearIngreso}
                onActualizar={actualizarIngreso}
            />

            <HistorialFinancieroDrawer
                isOpen={isHistorialOpen}
                onClose={() => setIsHistorialOpen(false)}
                onEditarGasto={abrirModalEditar}
                onEliminarGasto={eliminarGasto}
                onEditarIngreso={abrirModalEditarIngreso}
                onEliminarIngreso={eliminarIngreso}
            />
        </div>
    );
}
