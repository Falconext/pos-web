import React, { useEffect, useState } from 'react'
import { useDashboardStore, type IDashboardState } from '@/zustand/dashboard'
import { useAuthStore } from '@/zustand/auth'
import { useSedesStore } from '@/zustand/sedes'
import { Icon } from '@iconify/react'
import moment from 'moment'
import Select from '@/components/Select'
import { Calendar } from '@/components/Date'
import { AreaChart, DonutChart, ProgressCircle, SparkAreaChart } from '@tremor/react'

export default function AdminIndex() {
  const { overviewData, getOverview }: IDashboardState = useDashboardStore()
  const { auth, sedeActiva } = useAuthStore()
  const { sedes, listarSedes } = useSedesStore()
  const isAdmin = auth?.rol === 'ADMIN_EMPRESA' || auth?.rol === 'ADMIN_SISTEMA'
  const esPrincipal = !sedeActiva || sedeActiva.esPrincipal === true

  const [fechaInicio, setFechaInicio] = useState<string>(moment().subtract(6, 'days').format('YYYY-MM-DD'))
  const [fechaFin, setFechaFin] = useState<string>(moment().format('YYYY-MM-DD'))
  const [selectedSedeId, setSelectedSedeId] = useState<number | null>(null)

  const [period, setPeriod] = useState<string>('Esta semana')

  const effectiveSedeId = esPrincipal ? selectedSedeId : (sedeActiva?.id ?? null)

  useEffect(() => {
    if (isAdmin && esPrincipal) listarSedes()
  }, [isAdmin, esPrincipal])

  useEffect(() => {
    if (fechaInicio && fechaFin) {
      getOverview(fechaInicio, fechaFin, effectiveSedeId)
    }
  }, [fechaInicio, fechaFin, effectiveSedeId])

  const sedesOptions = [
    { id: 0, value: 'Todas las sedes' },
    ...sedes.map(s => ({ id: s.id, value: s.esPrincipal ? `${s.nombre}` : s.nombre }))
  ]

  const handleDate = (date: string, name: string) => {
    const parsed = moment(date, 'DD/MM/YYYY').format('YYYY-MM-DD')
    if (name === 'fechaInicio') setFechaInicio(parsed)
    if (name === 'fechaFin') setFechaFin(parsed)
  }

  if (!overviewData) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6 text-gray-500">
        <Icon icon="line-md:loading-twotone-loop" className="text-4xl text-violet-600 mr-2" />
        Cargando resumen del negocio...
      </div>
    )
  }

  const { kpis, chartVentas, chartCanales, actividad, topProductos, financiero } = overviewData

  const formatMoney = (val: number) => `S/ ${val.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const renderTrend = (trend: number) => {
    const isPos = trend >= 0
    return (
      <span className={`text-[13px] font-bold ${isPos ? 'text-emerald-500' : 'text-rose-500'} flex items-center gap-0.5`}>
        <Icon icon={isPos ? "solar:alt-arrow-up-bold" : "solar:alt-arrow-down-bold"} />
        {Math.abs(trend).toFixed(1)}%
      </span>
    )
  }

  return (
    <div className="min-h-screen pb-8 max-w-8xl mx-auto px-4 pt-2 font-inter bg-transparent">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            ¡Hola, {auth?.nombre?.split(' ')[0] || 'Administrador'}! <span>👋</span>
          </h1>
          <p className="text-[15px] text-gray-500 dark:text-gray-400 font-medium mt-1">Aquí tienes un resumen de tu negocio hoy.</p>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && esPrincipal && (
            <div className="w-48 rounded-xl shadow-sm">
              <Select name="sedeId" label="Sede" options={sedesOptions} onChange={(id) => setSelectedSedeId(Number(id))} value={selectedSedeId ? sedes.find(s => s.id === selectedSedeId)?.nombre || '' : 'Todas las sedes'} error="" />
            </div>
          )}
          <div className="flex items-center gap-2">
            <Calendar name="fechaInicio" onChange={handleDate} value={moment(fechaInicio).format('DD/MM/YYYY')} text="Fecha Inicio" />
            <Calendar left name="fechaFin" onChange={handleDate} value={moment(fechaFin).format('DD/MM/YYYY')} text="Fecha Fin" />
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
        <div className="bg-white dark:bg-[#131620] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col justify-between group hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-violet-600 text-[13px] font-bold tracking-wide">Ventas Totales</h3>
            <div className="w-10 h-10 rounded-[14px] bg-violet-600 flex items-center justify-center text-white shadow-lg shadow-violet-200 group-hover:-translate-y-1 transition-transform">
              <Icon icon="solar:dollar-bold" className="text-xl" />
            </div>
          </div>
          <div>
            <h2 className="text-[28px] leading-none font-extrabold text-gray-900 dark:text-white mb-2">{formatMoney(kpis.ventas.value)}</h2>
            <div className="flex items-center gap-1.5">
              {renderTrend(kpis.ventas.trend)}
              <span className="text-gray-400 text-xs font-medium">vs semana pasada</span>
            </div>
          </div>
          <div className="mt-4 h-12 opacity-80">
            <SparkAreaChart data={chartVentas.length ? chartVentas.slice(-7) : [{ date: '1', total: 0 }]} categories={['total']} index="date" colors={['violet']} />
          </div>
        </div>

        <div className="bg-white dark:bg-[#131620] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col justify-between group hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-blue-500 text-[13px] font-bold tracking-wide">Pedidos</h3>
            <div className="w-10 h-10 rounded-[14px] bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-200 group-hover:-translate-y-1 transition-transform">
              <Icon icon="solar:bag-bold" className="text-xl" />
            </div>
          </div>
          <div>
            <h2 className="text-[28px] leading-none font-extrabold text-gray-900 dark:text-white mb-2">{kpis.pedidos.value.toLocaleString()}</h2>
            <div className="flex items-center gap-1.5">
              {renderTrend(kpis.pedidos.trend)}
              <span className="text-gray-400 text-xs font-medium">vs semana pasada</span>
            </div>
          </div>
          <div className="mt-4 h-12 opacity-80">
            <SparkAreaChart data={chartVentas.length ? chartVentas.slice(-7) : [{ date: '1', total: 0 }]} categories={['total']} index="date" colors={['blue']} />
          </div>
        </div>

        <div className="bg-white dark:bg-[#131620] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col justify-between group hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-emerald-500 text-[13px] font-bold tracking-wide">Clientes Nuevos</h3>
            <div className="w-10 h-10 rounded-[14px] bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-200 group-hover:-translate-y-1 transition-transform">
              <Icon icon="solar:user-bold" className="text-xl" />
            </div>
          </div>
          <div>
            <h2 className="text-[28px] leading-none font-extrabold text-gray-900 dark:text-white mb-2">{kpis.clientes.value.toLocaleString()}</h2>
            <div className="flex items-center gap-1.5">
              {renderTrend(kpis.clientes.trend)}
              <span className="text-gray-400 text-xs font-medium">vs semana pasada</span>
            </div>
          </div>
          <div className="mt-4 h-12 opacity-80">
            <SparkAreaChart data={chartVentas.length ? chartVentas.slice(-7) : [{ date: '1', total: 0 }]} categories={['total']} index="date" colors={['emerald']} />
          </div>
        </div>

        <div className="bg-white dark:bg-[#131620] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col justify-between group hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-amber-500 text-[13px] font-bold tracking-wide">Ticket Promedio</h3>
            <div className="w-10 h-10 rounded-[14px] bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-200 group-hover:-translate-y-1 transition-transform">
              <Icon icon="solar:cart-check-bold" className="text-xl" />
            </div>
          </div>
          <div>
            <h2 className="text-[28px] leading-none font-extrabold text-gray-900 dark:text-white mb-2">{formatMoney(kpis.conversion.value)}</h2>
            <div className="flex items-center gap-1.5">
              {renderTrend(kpis.conversion.trend)}
              <span className="text-gray-400 text-xs font-medium">vs semana pasada</span>
            </div>
          </div>
          <div className="mt-4 h-12 opacity-80">
            <SparkAreaChart data={chartVentas.length ? chartVentas.slice(-7) : [{ date: '1', total: 0 }]} categories={['total']} index="date" colors={['amber']} />
          </div>
        </div>
      </div>

      {/* Middle Row Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-10 gap-5 mb-6">
        {/* Main Area Chart */}
        <div className="lg:col-span-2 xl:col-span-5 bg-white dark:bg-[#131620] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-800">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-gray-900 dark:text-white font-bold text-lg">Ventas</h3>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-2xl font-extrabold text-gray-900 dark:text-white">{formatMoney(kpis.ventas.value)}</span>
                {renderTrend(kpis.ventas.trend)}
              </div>
            </div>
          </div>
          {chartVentas.length > 0 ? (
            <AreaChart
              className="h-64 mt-4"
              data={chartVentas}
              index="date"
              categories={['total']}
              colors={['violet']}
              valueFormatter={(number: number) => `$${number.toLocaleString()}`}
              showLegend={false}
              showGridLines={true}
              curveType="monotone"
              showAnimation={true}
            />
          ) : (
            <div className="h-64 mt-4 flex items-center justify-center text-gray-400 text-sm">No hay ventas en este periodo</div>
          )}
        </div>

        {/* Donut Chart */}
        <div className="lg:col-span-1 xl:col-span-3 bg-white dark:bg-[#131620] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col">
          <h3 className="text-gray-900 dark:text-white font-bold text-lg mb-6">Ventas por Canal</h3>
          <div className="flex-1 flex flex-col justify-center">
            {chartCanales.length > 0 ? (
              <DonutChart
                className="h-44"
                data={chartCanales}
                category="value"
                index="name"
                valueFormatter={(val: number) => formatMoney(val)}
                colors={['violet', 'blue', 'emerald', 'amber']}
                showAnimation
              />
            ) : (
              <div className="text-center text-gray-400 text-sm h-44 flex items-center justify-center">No hay datos</div>
            )}

            <div className="mt-8 space-y-3">
              {chartCanales.map((c: any, i: number) => {
                const colorMap = ['bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500'];
                return (
                  <div key={c.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${colorMap[i % 4]}`}></div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{c.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-400 dark:text-gray-500">{formatMoney(c.value)}</span>
                      <span className="text-[13px] font-bold text-violet-600 dark:text-violet-400 w-10 text-right">{c.percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="lg:col-span-3 xl:col-span-2 bg-white dark:bg-[#131620] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col">
          <h3 className="text-gray-900 dark:text-white font-bold text-lg mb-5">Actividad Reciente</h3>
          <div className="flex-1 overflow-y-auto pr-1 space-y-5">
            {actividad.length > 0 ? actividad.map((a: any, i: number) => {
              const isRefund = a.tipo === 'Reembolso procesado';
              const iconMap = [
                { icon: 'solar:cart-large-bold', bg: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' },
                { icon: 'solar:user-bold', bg: 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400' },
                { icon: 'solar:letter-bold', bg: 'bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400' },
                { icon: 'solar:refresh-circle-bold', bg: 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400' },
              ];
              const idx = isRefund ? 3 : (i % 3);
              return (
                <div key={a.id} className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconMap[idx].bg}`}>
                    <Icon icon={iconMap[idx].icon} className="text-lg" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-gray-900 dark:text-white leading-snug truncate">{a.tipo}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{a.descripcion} • {a.cliente}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-[13px] font-bold ${isRefund ? 'text-rose-500 dark:text-rose-400' : 'text-emerald-500 dark:text-emerald-400'}`}>
                      {isRefund ? '-' : '+'}{formatMoney(Math.abs(a.monto))}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{moment(a.fecha).fromNow(true)}</p>
                  </div>
                </div>
              )
            }) : (
              <div className="text-center text-gray-400 text-sm">No hay actividad</div>
            )}
          </div>
          <button className="w-full mt-4 py-2 bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 text-sm font-bold rounded-xl hover:bg-violet-100 dark:hover:bg-violet-500/20 transition-colors">
            Ver toda la actividad <Icon icon="solar:alt-arrow-down-linear" className="inline ml-1" />
          </button>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Top Products */}
        <div className="bg-white dark:bg-[#131620] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-800">
          <h3 className="text-gray-900 dark:text-white font-bold text-lg mb-5">Productos Más Vendidos</h3>
          <div className="space-y-5">
            {topProductos.map((p: any, i: number) => {
              const colorMap = ['bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500'];
              const maxVal = topProductos[0]?.total || 1;
              const percent = (p.total / maxVal) * 100;
              return (
                <div key={p.productoId || i} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-gray-100 dark:border-slate-700">
                    <Icon icon="solar:box-bold" className="text-gray-400 dark:text-gray-500 text-xl" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h4 className="text-[13px] font-bold text-gray-900 dark:text-white truncate pr-2">{p.producto?.descripcion || 'Producto sin nombre'}</h4>
                      <span className="text-[13px] font-bold text-gray-600 dark:text-gray-300">{formatMoney(p.total)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-400 mb-1.5">
                      <span>{p.cantidad} unidades</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full ${colorMap[i % 4]}`} style={{ width: `${percent}%` }}></div>
                    </div>
                  </div>
                </div>
              )
            })}
            {topProductos.length === 0 && (
              <div className="text-center text-gray-400 text-sm py-4">No hay productos vendidos</div>
            )}
          </div>
        </div>

        {/* Map / Locations */}
        <div className="bg-white dark:bg-[#131620] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col relative overflow-hidden">
          <h3 className="text-gray-900 dark:text-white font-bold text-lg mb-2 relative z-10">Clientes por Ubicación</h3>
          <div className="flex-1 flex flex-col items-center justify-center relative z-10 w-full mt-2">
            <div className="w-full flex-1 min-h-[140px] bg-[#f8fafc] dark:bg-[#0A0D14] rounded-xl border border-gray-100 dark:border-slate-800 relative flex items-center justify-center overflow-hidden">
              <div className="absolute top-[30%] left-[20%] w-3 h-3 bg-violet-500 rounded-full shadow-[0_0_0_4px_rgba(139,92,246,0.2)] animate-pulse"></div>
              <div className="absolute top-[40%] left-[25%] w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_0_3px_rgba(59,130,246,0.2)]"></div>
              <div className="absolute top-[25%] right-[30%] w-4 h-4 bg-violet-600 rounded-full shadow-[0_0_0_5px_rgba(139,92,246,0.2)]"></div>
              <div className="absolute top-[45%] right-[20%] w-2 h-2 bg-emerald-500 rounded-full"></div>
              <div className="absolute bottom-[30%] right-[35%] w-3 h-3 bg-amber-500 rounded-full shadow-[0_0_0_4px_rgba(245,158,11,0.2)]"></div>
              <Icon icon="lucide:globe" className="text-[180px] text-gray-200 dark:text-slate-800 stroke-[0.5]" />
            </div>

            <div className="w-full flex items-center justify-between mt-5">
              <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">Menos</span>
              <div className="flex-1 mx-4 h-1.5 bg-gradient-to-r from-gray-200 dark:from-slate-700 via-violet-300 dark:via-violet-500/50 to-violet-600 rounded-full"></div>
              <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">Más</span>
            </div>
          </div>
        </div>

        {/* Resumen Financiero */}
        <div className="bg-white dark:bg-[#131620] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col">
          <h3 className="text-gray-900 dark:text-white font-bold text-lg mb-5">Resumen Financiero</h3>

          <div className="space-y-4">
            <div className="flex items-center gap-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl p-3">
              <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
                <Icon icon="solar:wallet-bold" className="text-xl" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">INGRESOS</p>
                <div className="flex items-baseline justify-between mt-0.5">
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{formatMoney(financiero.ingresos.value)}</p>
                  {renderTrend(financiero.ingresos.trend)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl p-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-500/20 text-rose-500 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Icon icon="solar:bill-bold" className="text-xl" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">GASTOS</p>
                <div className="flex items-baseline justify-between mt-0.5">
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{formatMoney(financiero.gastos.value)}</p>
                  {renderTrend(-financiero.gastos.trend)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl p-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Icon icon="solar:chart-square-bold" className="text-xl" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">GANANCIAS</p>
                <div className="flex items-baseline justify-between mt-0.5">
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{formatMoney(financiero.ganancias.value)}</p>
                  {renderTrend(financiero.ganancias.trend)}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-6 flex items-center justify-center gap-6">
            <ProgressCircle value={financiero.margen} size="lg" color="violet" strokeWidth={8} showAnimation>
              <span className="text-lg font-bold text-gray-900 dark:text-white">{financiero.margen.toFixed(0)}%</span>
            </ProgressCircle>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">Margen de Ganancia</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-snug">Salud financiera<br />del negocio</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
