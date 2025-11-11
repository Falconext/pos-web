import React, { useEffect, useMemo, useState } from 'react'
import Alert from '@/components/Alert'
import { useDashboardStore, type IDashboardState } from '@/zustand/dashboard'
import { Icon } from '@iconify/react'
import DataTable from '@/components/Datatable'
import moment from 'moment'
import { ResponsiveContainer, AreaChart as RCAreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart as RCBarChart, Bar } from 'recharts'
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'
import { Calendar } from '@/components/Date'

export default function AdminIndex() {
  const {
    getNewClientsByDate,
    newClientsByDate,
    getTotalAmountByDatePayment,
    getTopSells,
    topSells,
    totalAmount,
    totalCLients,
    totalInvoices,
    totalProducts,
    amountByDate,
    getTotalAmountByDate,
    getTotalHeaderDashboard,
    dataPaymentMethods,
  }: IDashboardState = useDashboardStore()

  const [fechaInicio, setFechaInicio] = useState<string>(moment(new Date()).format('YYYY-MM-DD'))
  const [fechaFin, setFechaFin] = useState<string>(moment(new Date()).format('YYYY-MM-DD'))

  useEffect(() => {
    getTotalAmountByDate()
    getTotalAmountByDatePayment()
    getNewClientsByDate(fechaInicio, fechaFin)
    getTopSells(fechaInicio, fechaFin)
  }, [fechaInicio, fechaFin])

  useEffect(() => {
    if (fechaInicio && fechaFin) {
      getTotalHeaderDashboard(fechaInicio, fechaFin)
    }
  }, [fechaInicio, fechaFin])

  const handleDate = (date: string, name: string) => {
    if (!moment(date, 'YYYY-MM-DD', true).isValid()) return
    if (name === 'fechaInicio') setFechaInicio(moment(date, 'YYYY-MM-DD').format('YYYY-MM-DD'))
    if (name === 'fechaFin') setFechaFin(moment(date, 'YYYY-MM-DD').format('YYYY-MM-DD'))
  }

  const chartData = useMemo(() => {
    return (amountByDate ?? []).map((row: any) => {
      const [y, m, d] = String(row?.fecha ?? '').split('-').map(Number)
      const fechaLocal = new Date(y, (m || 1) - 1, d || 1)
      const mesShort = fechaLocal.toLocaleString('es-ES', { month: 'short' })
      const mesCap = mesShort.charAt(0).toUpperCase() + mesShort.slice(1)
      return {
        date: `${mesCap} ${fechaLocal.getDate()}`,
        Facturas: row?.facturas ?? 0,
        Boletas: row?.boletas ?? 0,
        NotasCredito: row?.notasCredito ?? 0,
        NotasDebito: row?.notasDebito ?? 0,
      }
    })
  }, [amountByDate])

  const chartDataPayments = useMemo(() => {
    return (dataPaymentMethods ?? []).map((row: any) => {
      const [y, m, d] = String(row?.fecha ?? '').split('-').map(Number)
      const fechaLocal = new Date(y, (m || 1) - 1, d || 1)
      const mesShort = fechaLocal.toLocaleString('es-ES', { month: 'short' })
      const mesCap = mesShort.charAt(0).toUpperCase() + mesShort.slice(1)
      return {
        date: `${mesCap} ${fechaLocal.getDate()}`,
        Yape: row?.YAPE ?? 0,
        Plin: row?.PLIN ?? 0,
        Efectivo: row?.EFECTIVO ?? 0,
      }
    })
  }, [dataPaymentMethods])

  const chartDataClients = useMemo(() => {
    return (newClientsByDate ?? []).map((row: any) => {
      const [y, m, d] = String(row?.fecha ?? '').split('-').map(Number)
      const fechaLocal = new Date(y, (m || 1) - 1, d || 1)
      const mesShort = fechaLocal.toLocaleString('es-ES', { month: 'short' })
      const mesCap = mesShort.charAt(0).toUpperCase() + mesShort.slice(1)
      return {
        date: `${mesCap} ${fechaLocal.getDate()}`,
        nuevos: row?.nuevos ?? 0,
      }
    })
  }, [newClientsByDate])

  console.log(topSells)

  const topTableData = useMemo(() => {
    return (topSells ?? []).map((item: any) => ({
      'Codigo': item?.producto?.codigo ?? '',
      'Descripcion': item?.producto?.descripcion ?? '',
      'Stock': item?.producto?.stock ?? 0,
      'Cant. Vendido': item?.cantidad ?? 0,
    }))
  }, [topSells])

  return (
    <div className="min-h-screen md:px-8 pt-0 md:pt-5 md:mt-0 pb-10">
      <Alert />

      <div className="flex justify-start gap-3 mb-5">
        <Calendar name="fechaInicio" onChange={handleDate} text="Fecha inicio" />
        <Calendar name="fechaFin" onChange={handleDate} text="Fecha Fin" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-1 xl:grid-cols-4 gap-6 mb-6">
        <div className="rounded-xl p-4  bg-white">
          <Icon className="mb-2" icon="iconamoon:invoice-fill" width="20" height="20" color="#3477FF" />
          <h3 className="font-normal">Comprobantes</h3>
          <p className="text-2xl font-bold text-[#3477FF]">{totalInvoices}</p>
        </div>
        <div className="rounded-xl p-4  bg-white">
          <Icon className="mb-2" icon="fa:users" width="20" height="20" color="#25CE83" />
          <h3 className="font-normal">Clientes</h3>
          <p className="text-2xl font-bold text-[#25CE83]">{totalCLients}</p>
        </div>
        <div className="rounded-xl p-4  bg-white">
          <Icon className="mb-2" icon="fluent:box-32-filled" width="20" height="20" color="#FEAA61" />
          <h3 className="font-normal">Productos</h3>
          <p className="text-2xl font-bold text-[#FEAA61]">{totalProducts}</p>
        </div>
        <div className="rounded-xl p-4 bg-[linear-gradient(90deg,_#11998E_-6.25%,_#38EF7D_107.5%)] text-white">
          <Icon className="mb-2" icon="game-icons:receive-money" width="20" height="20" color="#fff" />
          <h3 className="font-normal">Ingresos</h3>
          <p className="text-2xl font-bold">S/ {Number(totalAmount || 0).toFixed(2)}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-xl p-4  bg-white">
          <h3 className="font-medium mb-4">Ingresos por comprobantes</h3>
          <div className="h-72">
            <ChartContainer className="h-full">
              <ResponsiveContainer>
                <RCAreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="Boletas" stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.15} />
                  <Area type="monotone" dataKey="Facturas" stroke="#2563eb" fill="#2563eb" fillOpacity={0.15} />
                  <Area type="monotone" dataKey="NotasCredito" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} />
                  <Area type="monotone" dataKey="NotasDebito" stroke="#ef4444" fill="#ef4444" fillOpacity={0.15} />
                </RCAreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </div>
        <div className="rounded-xl p-4  bg-white">
          <h3 className="font-medium mb-4">Ingresos por método de pago</h3>
          <div className="h-72">
            <ChartContainer className="h-full">
              <ResponsiveContainer width="100%" height="100%">
                <RCBarChart data={chartDataPayments} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="Yape" fill="#8b5cf6" />
                  <Bar dataKey="Plin" fill="#06b6d4" />
                  <Bar dataKey="Efectivo" fill="#10b981" />
                </RCBarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </div>
      </div>

      <div className="grid xl:grid-cols-2 gap-6 mt-8">
        <div className="rounded-xl p-4  bg-white">
          <h3 className="font-medium">Top de productos más vendidos en tu empresa</h3>
          <div className="mt-4">
            <DataTable
              bodyData={topTableData}
              headerColumns={["Codigo", "Descripcion", "Stock", "Cant. Vendido"]}
            />
          </div>
        </div>
        <div className="rounded-xl p-4  bg-white">
          <h3 className="font-medium">Nuevos clientes por fecha</h3>
          <div className="h-72 mt-6">
            <ChartContainer className="h-full">
              <ResponsiveContainer width="100%" height="100%">
                <RCBarChart data={chartDataClients} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="nuevos" fill="#64748b" />
                </RCBarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
