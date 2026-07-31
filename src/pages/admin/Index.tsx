import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDashboardStore, type IDashboardState } from '@/zustand/dashboard'
import { get } from '@/utils/fetch'
import { useAuthStore } from '@/zustand/auth'
import { useSedesStore } from '@/zustand/sedes'
import { hasPermission } from '@/utils/permissions'
import { Icon } from '@iconify/react'
import moment from 'moment'
import Select from '@/components/Select'
import { Calendar } from '@/components/Date'
import { AreaChart, DonutChart, ProgressCircle, SparkAreaChart } from '@tremor/react'
import { WelcomeModal, TourSpotlight, useWelcomeTour } from '@/components/WelcomeTour'

export default function AdminIndex() {
  const { overviewData, getOverview, topPorCategoria, getTopPorCategoria }: IDashboardState = useDashboardStore()
  const navigate = useNavigate()
  const { auth, sedeActiva } = useAuthStore()
  const { showModal, tourStep, startTour, skipTour, nextStep, prevStep, endTour } = useWelcomeTour(auth)
  const { sedes, listarSedes } = useSedesStore()
  const isAdmin = auth?.rol === 'ADMIN_EMPRESA' || auth?.rol === 'ADMIN_SISTEMA'
  const esPrincipal = !sedeActiva || sedeActiva.esPrincipal === true

  const [fechaInicio, setFechaInicio] = useState<string>(moment().subtract(6, 'days').format('YYYY-MM-DD'))
  const [fechaFin, setFechaFin] = useState<string>(moment().format('YYYY-MM-DD'))
  const [selectedSedeId, setSelectedSedeId] = useState<number | null>(null)

  const [period, setPeriod] = useState<string>('Esta semana')

  // "Productos Más Vendidos" — modal de detalle + exportable
  const [showTopModal, setShowTopModal] = useState(false)
  const [topDetalle, setTopDetalle] = useState<any[]>([])
  const [loadingTop, setLoadingTop] = useState(false)

  // "Productos Más Vendidos por Categoría" — segmento moneda + selector de categoría
  const [catMoneda, setCatMoneda] = useState<'PEN' | 'USD'>('PEN')
  const [catSelId, setCatSelId] = useState<number | null>(null)

  const effectiveSedeId = esPrincipal ? selectedSedeId : (sedeActiva?.id ?? null)

  const abrirTopDetalle = async () => {
    setShowTopModal(true)
    setLoadingTop(true)
    try {
      const params = new URLSearchParams({ fechaInicio, fechaFin, limit: '100' })
      if (effectiveSedeId) params.append('sedeId', String(effectiveSedeId))
      const resp: any = await get(`dashboard/top-productos?${params}`)
      setTopDetalle(resp?.code === 1 && Array.isArray(resp.data) ? resp.data : [])
    } catch {
      setTopDetalle([])
    } finally {
      setLoadingTop(false)
    }
  }

  const exportarTopCSV = () => {
    const encabezado = ['#', 'Producto', 'Código', 'Unidades vendidas', 'Total (S/)']
    const filas = topDetalle.map((p: any, i: number) => [
      i + 1,
      p.producto?.descripcion || 'Producto sin nombre',
      p.producto?.codigo || '',
      p.cantidad ?? 0,
      Number(p.total ?? 0).toFixed(2),
    ])
    const csv = [encabezado, ...filas]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `productos-vendidos-${fechaInicio}-a-${fechaFin}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Empresa "solo logística" (plan sin dashboard core): llevar a su panel
  const soloLogistica = !!auth && !hasPermission(auth, 'dashboard') && hasPermission(auth, 'logistica')
  useEffect(() => {
    if (soloLogistica) navigate('/administrador/logistica/dashboard', { replace: true })
  }, [soloLogistica, navigate])

  useEffect(() => {
    if (isAdmin && esPrincipal) listarSedes()
  }, [isAdmin, esPrincipal])

  useEffect(() => {
    if (fechaInicio && fechaFin) {
      getOverview(fechaInicio, fechaFin, effectiveSedeId)
    }
  }, [fechaInicio, fechaFin, effectiveSedeId])

  useEffect(() => {
    if (fechaInicio && fechaFin) {
      getTopPorCategoria(fechaInicio, fechaFin, {
        sedeId: effectiveSedeId,
        moneda: catMoneda,
        categoriaId: catSelId,
        limit: 5,
      })
    }
  }, [fechaInicio, fechaFin, effectiveSedeId, catMoneda, catSelId])

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

  const { kpis, chartVentas, chartCanales, actividad, topProductos, financiero, alertas } = overviewData

  const formatMoney = (val: number) => `S/ ${val.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const formatMoneda = (val: number, moneda: 'PEN' | 'USD') =>
    `${moneda === 'USD' ? 'US$' : 'S/'} ${val.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

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
    <>
      <div className="min-h-screen pb-8 max-w-8xl mx-auto px-3 sm:px-4 pt-2 font-inter bg-transparent">
        {/* Header */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-4 mb-5 sm:mb-8">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-2 leading-tight">
              ¡Hola, {auth?.nombre?.split(' ')[0] || 'Administrador'}! <span>👋</span>
            </h1>
            <p className="text-sm sm:text-[15px] text-gray-500 dark:text-gray-400 font-medium mt-1">Aquí tienes un resumen de tu negocio hoy.</p>
          </div>
          <div className="w-full xl:w-auto grid grid-cols-1 sm:grid-cols-[minmax(0,220px)_minmax(0,1fr)] xl:flex items-stretch xl:items-center gap-3">
            {isAdmin && esPrincipal && (
              <div className="w-full xl:w-48 rounded-xl shadow-sm">
                <Select name="sedeId" label="Sede" options={sedesOptions} onChange={(id) => setSelectedSedeId(Number(id))} value={selectedSedeId ? sedes.find(s => s.id === selectedSedeId)?.nombre || '' : 'Todas las sedes'} error="" />
              </div>
            )}
            <div className="grid grid-cols-2 gap-2 min-w-0">
              <Calendar name="fechaInicio" onChange={handleDate} value={moment(fechaInicio).format('DD/MM/YYYY')} text="Fecha Inicio" />
              <Calendar left name="fechaFin" onChange={handleDate} value={moment(fechaFin).format('DD/MM/YYYY')} text="Fecha Fin" />
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-5 mb-5 sm:mb-6">
          <div className="bg-white dark:bg-[#131620] rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col justify-between group hover:shadow-md transition-shadow min-w-0">
            <div className="flex justify-between items-start gap-2 mb-4">
              <h3 className="text-violet-600 text-[13px] font-bold tracking-wide">Ventas Totales</h3>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[14px] bg-violet-600 flex items-center justify-center text-white shadow-violet-200 group-hover:-translate-y-1 transition-transform shrink-0">
                <Icon icon="solar:dollar-bold" className="text-xl" />
              </div>
            </div>
            <div>
              <h2 className="text-xl sm:text-[28px] leading-none font-extrabold text-gray-900 dark:text-white mb-2 truncate">{formatMoney(kpis.ventas.value)}</h2>
              <div className="flex flex-wrap items-center gap-1.5">
                {renderTrend(kpis.ventas.trend)}
                <span className="text-gray-400 text-[11px] sm:text-xs font-medium">vs semana pasada</span>
              </div>
            </div>
            <div className="mt-4 h-10 sm:h-12 opacity-80">
              <SparkAreaChart data={chartVentas.length ? chartVentas.slice(-7) : [{ date: '1', total: 0 }]} categories={['total']} index="date" colors={['violet']} />
            </div>
          </div>

          <div className="bg-white dark:bg-[#131620] rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col justify-between group hover:shadow-md transition-shadow min-w-0">
            <div className="flex justify-between items-start gap-2 mb-4">
              <h3 className="text-blue-500 text-[13px] font-bold tracking-wide">Pedidos</h3>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[14px] bg-blue-500 flex items-center justify-center text-white shadow-blue-200 group-hover:-translate-y-1 transition-transform shrink-0">
                <Icon icon="solar:bag-bold" className="text-xl" />
              </div>
            </div>
            <div>
              <h2 className="text-xl sm:text-[28px] leading-none font-extrabold text-gray-900 dark:text-white mb-2">{kpis.pedidos.value.toLocaleString()}</h2>
              <div className="flex flex-wrap items-center gap-1.5">
                {renderTrend(kpis.pedidos.trend)}
                <span className="text-gray-400 text-[11px] sm:text-xs font-medium">vs semana pasada</span>
              </div>
            </div>
            <div className="mt-4 h-10 sm:h-12 opacity-80">
              <SparkAreaChart data={chartVentas.length ? chartVentas.slice(-7) : [{ date: '1', total: 0 }]} categories={['total']} index="date" colors={['blue']} />
            </div>
          </div>

          <div className="bg-white dark:bg-[#131620] rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col justify-between group hover:shadow-md transition-shadow min-w-0">
            <div className="flex justify-between items-start gap-2 mb-4">
              <h3 className="text-emerald-500 text-[13px] font-bold tracking-wide">Clientes Nuevos</h3>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[14px] bg-emerald-500 flex items-center justify-center text-white shadow-emerald-200 group-hover:-translate-y-1 transition-transform shrink-0">
                <Icon icon="solar:user-bold" className="text-xl" />
              </div>
            </div>
            <div>
              <h2 className="text-xl sm:text-[28px] leading-none font-extrabold text-gray-900 dark:text-white mb-2">{kpis.clientes.value.toLocaleString()}</h2>
              <div className="flex flex-wrap items-center gap-1.5">
                {renderTrend(kpis.clientes.trend)}
                <span className="text-gray-400 text-[11px] sm:text-xs font-medium">vs semana pasada</span>
              </div>
            </div>
            <div className="mt-4 h-10 sm:h-12 opacity-80">
              <SparkAreaChart data={chartVentas.length ? chartVentas.slice(-7) : [{ date: '1', total: 0 }]} categories={['total']} index="date" colors={['emerald']} />
            </div>
          </div>

          <div className="bg-white dark:bg-[#131620] rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col justify-between group hover:shadow-md transition-shadow min-w-0">
            <div className="flex justify-between items-start gap-2 mb-4">
              <h3 className="text-amber-500 text-[13px] font-bold tracking-wide">Ticket Promedio</h3>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[14px] bg-amber-500 flex items-center justify-center text-white shadow-amber-200 group-hover:-translate-y-1 transition-transform shrink-0">
                <Icon icon="solar:cart-check-bold" className="text-xl" />
              </div>
            </div>
            <div>
              <h2 className="text-xl sm:text-[28px] leading-none font-extrabold text-gray-900 dark:text-white mb-2 truncate">{formatMoney(kpis.conversion.value)}</h2>
              <div className="flex flex-wrap items-center gap-1.5">
                {renderTrend(kpis.conversion.trend)}
                <span className="text-gray-400 text-[11px] sm:text-xs font-medium">vs semana pasada</span>
              </div>
            </div>
            <div className="mt-4 h-10 sm:h-12 opacity-80">
              <SparkAreaChart data={chartVentas.length ? chartVentas.slice(-7) : [{ date: '1', total: 0 }]} categories={['total']} index="date" colors={['amber']} />
            </div>
          </div>
        </div>

        {/* Middle Row Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-10 gap-4 sm:gap-5 mb-5 sm:mb-6">
          {/* Main Area Chart */}
          <div className="lg:col-span-2 xl:col-span-5 bg-white dark:bg-[#131620] rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-slate-800 min-w-0">
            <div className="flex justify-between items-start gap-3 mb-2">
              <div>
                <h3 className="text-gray-900 dark:text-white font-bold text-lg">Ventas</h3>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1">
                  <span className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white">{formatMoney(kpis.ventas.value)}</span>
                  {renderTrend(kpis.ventas.trend)}
                </div>
              </div>
            </div>
            {chartVentas.length > 0 ? (
              <AreaChart
                className="h-56 sm:h-64 mt-4"
                data={chartVentas}
                index="date"
                categories={['total']}
                colors={['violet']}
                valueFormatter={(number: number) => `S/ ${number.toLocaleString('es-PE')}`}
                showLegend={false}
                showGridLines={true}
                curveType="monotone"
                showAnimation={true}
              />
            ) : (
              <div className="h-56 sm:h-64 mt-4 flex items-center justify-center text-gray-400 text-sm">No hay ventas en este periodo</div>
            )}
          </div>

          {/* Donut Chart */}
          <div className="lg:col-span-1 xl:col-span-3 bg-white dark:bg-[#131620] rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col min-w-0">
            <h3 className="text-gray-900 dark:text-white font-bold text-lg mb-4 sm:mb-6">Ventas por Canal</h3>
            <div className="flex-1 flex flex-col justify-center">
              {chartCanales.length > 0 ? (
                <DonutChart
                  className="h-40 sm:h-44"
                  data={chartCanales}
                  category="value"
                  index="name"
                  valueFormatter={(val: number) => formatMoney(val)}
                  colors={['violet', 'blue', 'emerald', 'amber']}
                  showAnimation
                />
              ) : (
                <div className="text-center text-gray-400 text-sm h-40 sm:h-44 flex items-center justify-center">No hay datos</div>
              )}

              <div className="mt-6 sm:mt-8 space-y-3">
                {chartCanales.map((c: any, i: number) => {
                  const colorMap = ['bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500'];
                  return (
                    <div key={c.name} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-2.5 h-2.5 rounded-full ${colorMap[i % 4]}`}></div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300 truncate">{c.name}</span>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        <span className="text-xs sm:text-sm text-gray-400 dark:text-gray-500">{formatMoney(c.value)}</span>
                        <span className="text-[13px] font-bold text-violet-600 dark:text-violet-400 w-10 text-right">{c.percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="lg:col-span-3 xl:col-span-2 bg-white dark:bg-[#131620] rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col min-w-0">
            <h3 className="text-gray-900 dark:text-white font-bold text-lg mb-5">Actividad Reciente</h3>
            <div className="flex-1 overflow-y-auto pr-1 space-y-4 sm:space-y-5 max-h-[420px] xl:max-h-none">
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
                  <div key={a.id} className="flex items-start gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconMap[idx].bg}`}>
                      <Icon icon={iconMap[idx].icon} className="text-lg" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-gray-900 dark:text-white leading-snug truncate">{a.tipo}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{a.descripcion} • {a.cliente}</p>
                    </div>
                    <div className="text-right shrink-0 max-w-[96px]">
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
            <button
              onClick={() => navigate('/administrador/facturacion/comprobantes')}
              className="w-full mt-4 py-2.5 bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 text-sm font-bold rounded-xl hover:bg-violet-100 dark:hover:bg-violet-500/20 transition-colors"
            >
              Ver toda la actividad <Icon icon="solar:alt-arrow-right-linear" className="inline ml-1" />
            </button>
          </div>
        </div>

        {/* Alertas del Negocio */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">

          {/* Stock Bajo */}
          <div className="bg-white dark:bg-[#131620] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${alertas?.stockBajo?.length > 0 ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400' : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'}`}>
                <Icon icon={alertas?.stockBajo?.length > 0 ? 'solar:danger-triangle-bold' : 'solar:check-circle-bold'} className="text-lg" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Stock Bajo</h3>
                <p className={`text-xs font-medium ${alertas?.stockBajo?.length > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                  {alertas?.stockBajo?.length > 0 ? `${alertas.stockBajo.length} producto${alertas.stockBajo.length > 1 ? 's' : ''}` : 'Todo en orden'}
                </p>
              </div>
            </div>
            <div className="flex-1 min-h-[80px]">
              {alertas?.stockBajo?.length > 0 ? (
                <div className="space-y-2">
                  {alertas.stockBajo.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between gap-2">
                      <p className="text-xs text-gray-600 dark:text-gray-300 truncate flex-1">{p.descripcion}</p>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-xs font-bold text-rose-500">{p.stock}</span>
                        <span className="text-xs text-gray-400">/</span>
                        <span className="text-xs text-gray-500">{p.stockMinimo}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-3">Todos los productos tienen stock suficiente</p>
              )}
            </div>
            <button onClick={() => navigate('/administrador/kardex/productos')} className="mt-4 w-full py-2 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold rounded-xl hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors flex items-center justify-center gap-1">
              Ver Kardex <Icon icon="solar:alt-arrow-right-linear" className="text-sm" />
            </button>
          </div>

          {/* SUNAT Pendientes */}
          <div className={`bg-white dark:bg-[#131620] rounded-2xl p-5 shadow-sm border ${alertas?.sunatPendientes?.count > 0 ? 'border-rose-200 dark:border-rose-500/30' : 'border-gray-100 dark:border-slate-800'} flex flex-col`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${alertas?.sunatPendientes?.count > 0 ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400' : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'}`}>
                <Icon icon={alertas?.sunatPendientes?.count > 0 ? 'solar:shield-warning-bold' : 'solar:shield-check-bold'} className="text-lg" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">SUNAT</h3>
                <p className={`text-xs font-medium ${alertas?.sunatPendientes?.count > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                  {alertas?.sunatPendientes?.count > 0 ? `${alertas.sunatPendientes.count} pendiente${alertas.sunatPendientes.count > 1 ? 's' : ''}` : 'Al día'}
                </p>
              </div>
            </div>
            <div className="flex-1 min-h-[80px]">
              {alertas?.sunatPendientes?.items?.length > 0 ? (
                <div className="space-y-2">
                  {alertas.sunatPendientes.items.map((c: any) => {
                    const estadoLabel = c.estado === 'FALLIDO_ENVIO' ? 'Error envío' : c.estado === 'RECHAZADO' ? 'Rechazado' : 'Pendiente';
                    const estadoColor = c.estado === 'PENDIENTE' ? 'text-amber-500' : 'text-rose-500';
                    return (
                      <div key={c.id} className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold text-gray-700 dark:text-gray-200">{c.serie}-{String(c.correlativo).padStart(8, '0')}</p>
                        <span className={`text-[10px] font-bold ${estadoColor}`}>{estadoLabel}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-3">Todos los comprobantes enviados correctamente</p>
              )}
            </div>
            <button onClick={() => navigate('/administrador/facturacion/comprobantes')} className="mt-4 w-full py-2 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-xl hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors flex items-center justify-center gap-1">
              Ver Comprobantes <Icon icon="solar:alt-arrow-right-linear" className="text-sm" />
            </button>
          </div>

          {/* Cuentas por Cobrar */}
          <div className="bg-white dark:bg-[#131620] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400">
                <Icon icon="solar:bill-check-bold" className="text-lg" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Por Cobrar</h3>
                <p className="text-xs font-medium text-blue-500">{alertas?.cuentasCobrar?.cantidad ?? 0} comprobante{alertas?.cuentasCobrar?.cantidad !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <div className="flex-1 min-h-[80px] flex flex-col justify-center">
              <p className="text-2xl font-extrabold text-gray-900 dark:text-white">{formatMoney(alertas?.cuentasCobrar?.total ?? 0)}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">pendiente de cobro</p>
            </div>
            <button onClick={() => navigate('/administrador/pagos/cuentas-cobrar')} className="mt-4 w-full py-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-xl hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors flex items-center justify-center gap-1">
              Ver Cuentas <Icon icon="solar:alt-arrow-right-linear" className="text-sm" />
            </button>
          </div>

          {/* Pedidos Tienda Pendientes */}
          <div className="bg-white dark:bg-[#131620] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${alertas?.pedidosTiendaPendientes > 0 ? 'bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400' : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'}`}>
                <Icon icon="solar:shop-bold" className="text-lg" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Tienda Online</h3>
                <p className={`text-xs font-medium ${alertas?.pedidosTiendaPendientes > 0 ? 'text-violet-500' : 'text-emerald-500'}`}>
                  {alertas?.pedidosTiendaPendientes > 0 ? `${alertas.pedidosTiendaPendientes} pendiente${alertas.pedidosTiendaPendientes > 1 ? 's' : ''}` : 'Sin pendientes'}
                </p>
              </div>
            </div>
            <div className="flex-1 min-h-[80px] flex flex-col justify-center">
              {alertas?.pedidosTiendaPendientes > 0 ? (
                <>
                  <p className="text-4xl font-extrabold text-violet-600 dark:text-violet-400">{alertas.pedidosTiendaPendientes}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">pedido{alertas.pedidosTiendaPendientes > 1 ? 's' : ''} esperando atención</p>
                </>
              ) : (
                <div className="flex items-center gap-2 text-emerald-500">
                  <Icon icon="solar:check-circle-bold" className="text-2xl" />
                  <p className="text-sm font-bold">Sin pedidos pendientes</p>
                </div>
              )}
            </div>
            <button onClick={() => navigate('/administrador/tienda/pedidos')} className="mt-4 w-full py-2 bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 text-xs font-bold rounded-xl hover:bg-violet-100 dark:hover:bg-violet-500/20 transition-colors flex items-center justify-center gap-1">
              Ver Pedidos <Icon icon="solar:alt-arrow-right-linear" className="text-sm" />
            </button>
          </div>

        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Top Products */}
          <div className="bg-white dark:bg-[#131620] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-gray-900 dark:text-white font-bold text-lg">Productos Más Vendidos</h3>
              <button
                onClick={abrirTopDetalle}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
              >
                Ver más detalles
                <Icon icon="solar:alt-arrow-right-linear" width={14} />
              </button>
            </div>
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
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Icon icon="solar:cart-large-2-bold" className="text-xl" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">COMPRAS</p>
                  <div className="flex items-baseline justify-between mt-0.5">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{formatMoney(financiero.compras?.value ?? 0)}</p>
                    {renderTrend(-(financiero.compras?.trend ?? 0))}
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
              <ProgressCircle value={Math.max(0, Math.min(100, financiero.margen))} size="lg" color={financiero.margen >= 0 ? 'violet' : 'rose'} strokeWidth={8} showAnimation>
                <span className={`text-lg font-bold ${financiero.margen >= 0 ? 'text-gray-900 dark:text-white' : 'text-rose-500'}`}>{financiero.margen.toFixed(0)}%</span>
              </ProgressCircle>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">Margen de Ganancia</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-snug">Salud financiera<br />del negocio</p>
              </div>
            </div>
          </div>

        </div>

        {/* Productos Más Vendidos por Categoría */}
        <div className="mt-5 bg-white dark:bg-[#131620] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <h3 className="text-gray-900 dark:text-white font-bold text-lg">Productos Más Vendidos por Categoría</h3>
            <div className="flex items-center gap-3">
              {/* Segmento moneda: General (S/) vs Exportación (US$) */}
              <div className="inline-flex bg-gray-100 dark:bg-slate-800 rounded-xl p-1">
                <button
                  onClick={() => setCatMoneda('PEN')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${catMoneda === 'PEN' ? 'bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-400 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
                >
                  General (S/)
                </button>
                <button
                  onClick={() => setCatMoneda('USD')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${catMoneda === 'USD' ? 'bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-400 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
                >
                  Exportación (US$)
                </button>
              </div>
              {/* Selector de categoría */}
              <select
                value={catSelId ?? 0}
                onChange={(e) => setCatSelId(Number(e.target.value) || null)}
                className="text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value={0}>Todas las categorías</option>
                {(topPorCategoria?.categorias ?? []).map((c: any) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          {(!topPorCategoria || (topPorCategoria.grupos ?? []).length === 0) ? (
            <div className="text-center text-gray-400 text-sm py-8">No hay productos vendidos en {catMoneda === 'USD' ? 'Exportación (US$)' : 'General (S/)'} para el rango seleccionado</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {(topPorCategoria.grupos ?? []).map((g: any) => {
                const maxVal = g.productos[0]?.total || 1
                const colorMap = ['bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500']
                return (
                  <div key={g.categoriaId} className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate pr-2">{g.categoriaNombre}</h4>
                      <span className="text-xs font-bold text-gray-500 dark:text-gray-400 shrink-0">{formatMoneda(g.total, topPorCategoria.moneda)}</span>
                    </div>
                    <div className="space-y-3">
                      {g.productos.map((p: any, i: number) => {
                        const percent = (p.total / maxVal) * 100
                        return (
                          <div key={p.productoId || i}>
                            <div className="flex justify-between items-baseline mb-1">
                              <span className="text-[13px] font-semibold text-gray-800 dark:text-gray-200 truncate pr-2">{p.producto?.descripcion || 'Producto sin nombre'}</span>
                              <span className="text-[13px] font-bold text-gray-600 dark:text-gray-300 shrink-0">{formatMoneda(p.total, topPorCategoria.moneda)}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
                              <span>{p.cantidad} unidades</span>
                            </div>
                            <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-1.5">
                              <div className={`h-1.5 rounded-full ${colorMap[i % colorMap.length]}`} style={{ width: `${percent}%` }}></div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Tour de bienvenida — solo primer login */}
      {showModal && auth && (
        <WelcomeModal user={auth} onStartTour={startTour} onSkip={skipTour} />
      )}
      {tourStep !== null && (
        <TourSpotlight step={tourStep} onNext={nextStep} onPrev={prevStep} onEnd={endTour} />
      )}

      {/* Modal: detalle de productos más vendidos + exportable */}
      {showTopModal && (
        <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4" onClick={() => setShowTopModal(false)}>
          <div className="w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden rounded-t-2xl sm:rounded-2xl bg-white dark:bg-[#131620] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 border-b border-gray-100 dark:border-slate-800 p-5">
              <div>
                <h3 className="text-gray-900 dark:text-white font-bold text-lg">Productos Más Vendidos</h3>
                <p className="text-xs text-gray-400 mt-0.5">{moment(fechaInicio).format('DD/MM/YYYY')} – {moment(fechaFin).format('DD/MM/YYYY')}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={exportarTopCSV}
                  disabled={loadingTop || topDetalle.length === 0}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                >
                  <Icon icon="solar:file-download-bold" width={16} />
                  Exportar
                </button>
                <button onClick={() => setShowTopModal(false)} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors" aria-label="Cerrar">
                  <Icon icon="solar:close-circle-bold" width={18} />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto p-2 sm:p-4">
              {loadingTop ? (
                <div className="flex items-center justify-center gap-2 py-12 text-gray-400 text-sm">
                  <Icon icon="line-md:loading-twotone-loop" className="text-2xl text-violet-600" />
                  Cargando…
                </div>
              ) : topDetalle.length === 0 ? (
                <div className="text-center text-gray-400 text-sm py-12">No hay productos vendidos en este periodo</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wide text-gray-400 border-b border-gray-100 dark:border-slate-800">
                      <th className="py-2.5 px-3 w-8">#</th>
                      <th className="py-2.5 px-3">Producto</th>
                      <th className="py-2.5 px-3 text-right whitespace-nowrap">Unidades</th>
                      <th className="py-2.5 px-3 text-right whitespace-nowrap">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topDetalle.map((p: any, i: number) => (
                      <tr key={p.productoId || i} className="border-b border-gray-50 dark:border-slate-800/60 hover:bg-gray-50 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-bold text-gray-400">{i + 1}</td>
                        <td className="py-2.5 px-3">
                          <p className="font-bold text-gray-900 dark:text-white leading-tight">{p.producto?.descripcion || 'Producto sin nombre'}</p>
                          {p.producto?.codigo && <p className="text-[11px] text-gray-400">{p.producto.codigo}</p>}
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">{p.cantidad ?? 0}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-gray-900 dark:text-white whitespace-nowrap">{formatMoney(Number(p.total ?? 0))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
