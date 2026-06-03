import React from 'react';
import { Icon } from '@iconify/react';
import moment from 'moment';
import { Calendar } from '@/components/Date';
import { useVendedoresViewModel } from './useVendedoresViewModel';
import { VendedorDetalleDrawer } from './components/VendedorDetalleDrawer';
import { MEDALLAS } from './VendedoresModel';

function CrecimientoBadge({ pct }: { pct: number | null }) {
    if (pct === null) return <span className="text-xs text-gray-400">—</span>;
    const positivo = pct >= 0;
    return (
        <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${positivo ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400'}`}>
            <Icon icon={positivo ? 'solar:arrow-up-bold' : 'solar:arrow-down-bold'} width={10} />
            {Math.abs(pct).toFixed(1)}%
        </span>
    );
}

export default function VendedoresView() {
    const vm = useVendedoresViewModel();

    const topVendedor = vm.rankingTotal[0];
    const maxVentas = topVendedor?.totalVentas ?? 1;

    // Podio usa el ranking sin filtrar por vendedor (solo sede+fecha)
    const podioData = vm.rankingTotal.slice(0, 3);
    const hayFiltroVendedor = vm.vendedorSearch.trim().length > 0;

    return (
        <div className="p-4 md:p-6 space-y-5">

            {/* ── Header + controles ───────────────────────────────────── */}
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Icon icon="solar:cup-star-bold-duotone" className="text-amber-500" width={22} />
                        Ranking Vendedores
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        Desempeño de tu equipo de ventas
                    </p>
                </div>

                {/* ── Filtros en grid ── */}
                <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-slate-800 p-4 shadow-sm">
                    <div className="flex flex-wrap gap-3 items-end">

                        {/* Fechas */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <Calendar
                                text="Desde"
                                name="fechaInicio"
                                value={moment(vm.fechaInicio).format('DD/MM/YYYY')}
                                onChange={vm.handleDateChange}
                            />
                            <Calendar
                                text="Hasta"
                                name="fechaFin"
                                value={moment(vm.fechaFin).format('DD/MM/YYYY')}
                                onChange={vm.handleDateChange}
                            />
                            <button
                                onClick={vm.handleAplicarFiltro}
                                className="relative top-2 flex items-center gap-1.5 px-3 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-xl shadow-sm transition-colors"
                                title="Actualizar ranking"
                            >
                                <Icon icon="solar:refresh-bold" width={16} />
                            </button>
                        </div>

                        {/* Divisor vertical */}
                        {vm.sedes.length > 1 && (
                            <div className="hidden md:block w-px h-10 bg-gray-100 dark:bg-slate-700 self-end mb-1" />
                        )}

                        {/* Filtro sede */}
                        {vm.sedes.length > 1 && (
                            <div className="flex flex-col gap-1 min-w-[180px]">
                                <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                    Sede
                                </label>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <button
                                        onClick={() => vm.handleSelectSede(null)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                                            vm.selectedSedeId === null
                                                ? 'bg-blue-600 text-white border-blue-600'
                                                : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:border-blue-400'
                                        }`}
                                    >
                                        Todas
                                    </button>
                                    {vm.sedes.map((sede) => (
                                        <button
                                            key={sede.id}
                                            onClick={() => vm.handleSelectSede(sede.id)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1 ${
                                                vm.selectedSedeId === sede.id
                                                    ? 'bg-blue-600 text-white border-blue-600'
                                                    : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:border-blue-400'
                                            }`}
                                        >
                                            {sede.esPrincipal && (
                                                <Icon icon="solar:buildings-bold-duotone" width={11} className={vm.selectedSedeId === sede.id ? 'text-white' : 'text-amber-500'} />
                                            )}
                                            {sede.nombre}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Divisor vertical */}
                        <div className="hidden md:block w-px h-10 bg-gray-100 dark:bg-slate-700 self-end mb-1" />

                        {/* Buscador vendedor */}
                        <div className="flex flex-col gap-1 min-w-[200px] flex-1">
                            <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                Buscar vendedor
                            </label>
                            <div className="relative">
                                <Icon
                                    icon="solar:magnifer-linear"
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                    width={15}
                                />
                                <input
                                    type="text"
                                    value={vm.vendedorSearch}
                                    onChange={(e) => vm.setVendedorSearch(e.target.value)}
                                    placeholder="Nombre o email..."
                                    className="w-full pl-9 pr-8 py-2 text-sm bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                {vm.vendedorSearch && (
                                    <button
                                        onClick={() => vm.setVendedorSearch('')}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        <Icon icon="solar:close-circle-bold" width={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Badge resumen de filtros activos */}
                    {(vm.selectedSedeId !== null || vm.vendedorSearch) && (
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-slate-800 flex-wrap">
                            <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Filtros activos:</span>
                            {vm.selectedSedeId !== null && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full text-xs font-semibold">
                                    <Icon icon="solar:buildings-3-bold-duotone" width={12} />
                                    {vm.sedes.find((s) => s.id === vm.selectedSedeId)?.nombre ?? 'Sede'}
                                    <button onClick={() => vm.handleSelectSede(null)} className="ml-1 hover:text-blue-500">×</button>
                                </span>
                            )}
                            {vm.vendedorSearch && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 rounded-full text-xs font-semibold">
                                    <Icon icon="solar:user-bold-duotone" width={12} />
                                    "{vm.vendedorSearch}"
                                    <button onClick={() => vm.setVendedorSearch('')} className="ml-1 hover:text-violet-500">×</button>
                                </span>
                            )}
                            <span className="text-xs text-gray-400">
                                {vm.ranking.length} / {vm.rankingTotal.length} vendedor{vm.rankingTotal.length !== 1 ? 'es' : ''}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Podio top 3 (sin filtrar por vendedor) ── */}
            {!vm.isLoadingRanking && podioData.length >= 3 && !hayFiltroVendedor && (
                <div className="grid grid-cols-3 gap-3">
                    {[podioData[1], podioData[0], podioData[2]].map((v, i) => {
                        if (!v) return null;
                        const realPos = i === 1 ? 0 : i === 0 ? 1 : 2;
                        const heights = ['h-28', 'h-36', 'h-24'];
                        const bgColors = [
                            'from-slate-100 to-slate-200/60 dark:from-slate-800 dark:to-slate-700/60',
                            'from-amber-50 to-yellow-100/60 dark:from-amber-900/30 dark:to-yellow-900/20',
                            'from-orange-50 to-orange-100/60 dark:from-orange-900/20 dark:to-orange-900/10',
                        ];
                        return (
                            <button
                                key={v.usuario?.id}
                                onClick={() => v.usuario && vm.handleVerDetalle(v.usuario.id)}
                                className={`flex flex-col items-center justify-end pt-4 pb-3 px-2 rounded-2xl border border-gray-100 dark:border-slate-700/60 bg-gradient-to-b ${bgColors[realPos]} ${heights[i]} transition-all hover:scale-[1.02] hover:shadow-md cursor-pointer`}
                            >
                                <span className="text-2xl mb-1">{MEDALLAS[realPos]}</span>
                                <p className="text-xs font-bold text-gray-800 dark:text-white text-center leading-tight truncate w-full">
                                    {v.usuario?.nombre?.split(' ')[0] ?? '—'}
                                </p>
                                <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 mt-0.5">
                                    S/ {v.totalVentas.toFixed(0)}
                                </p>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* ── Tabla ranking ── */}
            <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-[#0F1117] overflow-hidden shadow-sm">
                {vm.isLoadingRanking ? (
                    <div className="flex items-center justify-center h-48">
                        <Icon icon="mdi:loading" className="animate-spin text-3xl text-blue-500" />
                    </div>
                ) : vm.ranking.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 gap-3">
                        <Icon icon="solar:users-group-two-rounded-bold-duotone" width={40} className="text-gray-300 dark:text-gray-600" />
                        <p className="text-sm text-gray-400">
                            {hayFiltroVendedor
                                ? `Sin resultados para "${vm.vendedorSearch}"`
                                : 'Sin ventas en este período'}
                        </p>
                        {hayFiltroVendedor && (
                            <button
                                onClick={() => vm.setVendedorSearch('')}
                                className="text-xs text-blue-500 hover:text-blue-600 underline"
                            >
                                Limpiar búsqueda
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Encabezado con conteo */}
                        {hayFiltroVendedor && (
                            <div className="px-5 py-2.5 border-b border-gray-100 dark:border-slate-800 bg-violet-50/50 dark:bg-violet-900/10 flex items-center gap-2">
                                <Icon icon="solar:magnifer-bold-duotone" className="text-violet-500" width={14} />
                                <span className="text-xs text-violet-700 dark:text-violet-300 font-medium">
                                    Mostrando {vm.ranking.length} de {vm.rankingTotal.length} vendedores · Búsqueda: <strong>"{vm.vendedorSearch}"</strong>
                                </span>
                            </div>
                        )}
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-slate-800/60 border-b border-gray-100 dark:border-slate-800">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide w-12">#</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Vendedor</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total vendido</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden sm:table-cell">Comprobantes</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden md:table-cell">Ticket prom.</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden md:table-cell">vs anterior</th>
                                        <th className="px-4 py-3 w-10" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-slate-800/60">
                                    {vm.ranking.map((v) => {
                                        const isResaltado = hayFiltroVendedor;
                                        return (
                                            <tr
                                                key={v.usuario?.id ?? v.posicion}
                                                onClick={() => v.usuario && vm.handleVerDetalle(v.usuario.id)}
                                                className={`hover:bg-blue-50/40 dark:hover:bg-slate-800/40 cursor-pointer transition-colors group ${isResaltado ? 'bg-violet-50/30 dark:bg-violet-900/5' : ''}`}
                                            >
                                                <td className="px-4 py-3.5">
                                                    <span className="text-base">
                                                        {v.posicion <= 3
                                                            ? MEDALLAS[v.posicion - 1]
                                                            : <span className="text-sm font-bold text-gray-400">{v.posicion}</span>
                                                        }
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                                            {v.usuario?.nombre?.charAt(0).toUpperCase() ?? '?'}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-800 dark:text-white leading-tight">{v.usuario?.nombre ?? '—'}</p>
                                                            <p className="text-xs text-gray-400 dark:text-gray-500">{v.usuario?.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5 text-right">
                                                    <p className="text-sm font-bold text-gray-800 dark:text-white">S/ {v.totalVentas.toFixed(2)}</p>
                                                    <div className="w-24 h-1 bg-gray-100 dark:bg-slate-700 rounded-full mt-1 ml-auto">
                                                        <div
                                                            className="h-1 bg-blue-500 rounded-full"
                                                            style={{ width: `${Math.min(100, (v.totalVentas / maxVentas) * 100)}%` }}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5 text-right text-sm text-gray-600 dark:text-gray-400 hidden sm:table-cell">
                                                    {v.numComprobantes}
                                                </td>
                                                <td className="px-4 py-3.5 text-right text-sm text-gray-600 dark:text-gray-400 hidden md:table-cell">
                                                    S/ {v.ticketPromedio.toFixed(2)}
                                                </td>
                                                <td className="px-4 py-3.5 text-center hidden md:table-cell">
                                                    <CrecimientoBadge pct={v.crecimientoPct} />
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <Icon icon="solar:alt-arrow-right-linear" width={16} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>

            {/* Drawer detalle */}
            <VendedorDetalleDrawer
                open={vm.drawerOpen}
                detalle={vm.detalle}
                isLoading={vm.isLoadingDetalle}
                fechaInicio={vm.fechaInicio}
                fechaFin={vm.fechaFin}
                onClose={vm.handleCerrarDrawer}
            />
        </div>
    );
}
