import React, { useEffect, useMemo, useState } from 'react'
import { useDashboardStore, type IDashboardState } from '@/zustand/dashboard'
import { Icon } from '@iconify/react'
import DataTable from '@/components/Datatable'
import moment from 'moment'
import { Calendar } from '@/components/Date'
import { AreaChart, BarChart, Card, Flex, Grid, Metric, Text, Title } from '@tremor/react'

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
    getTotalAmountByDate(fechaInicio, fechaFin)
    getTotalAmountByDatePayment(fechaInicio, fechaFin)
    getNewClientsByDate(fechaInicio, fechaFin)
    getTopSells(fechaInicio, fechaFin)
  }, [fechaInicio, fechaFin])

  useEffect(() => {
    if (fechaInicio && fechaFin) {
      getTotalHeaderDashboard(fechaInicio, fechaFin)
    }
  }, [fechaInicio, fechaFin])

  const handleDate = (date: string, name: string) => {
    // Calendar component returns DD/MM/YYYY
    if (!moment(date, 'DD/MM/YYYY', true).isValid()) return

    const formattedDate = moment(date, 'DD/MM/YYYY').format('YYYY-MM-DD')

    if (name === 'fechaInicio') setFechaInicio(formattedDate)
    if (name === 'fechaFin') setFechaFin(formattedDate)
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


  const topTableData = useMemo(() => {
    return (topSells ?? []).map((item: any) => ({
      'Codigo': item?.producto?.codigo ?? '',
      'Descripcion': item?.producto?.descripcion ?? '',
      'Stock': item?.producto?.stock ?? 0,
      'Cant. Vendido': item?.cantidad ?? 0,
    }))
  }, [topSells])

  return (
    <div className="min-h-screen px-2 pb-4">

      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard General</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 py-2 rounded-xl">
            <Calendar name="fechaInicio" onChange={handleDate} text="Fecha inicio" />
          </div>
          <div className="flex items-center gap-2 py-2 rounded-xl">
            <Calendar left name="fechaFin" onChange={handleDate} text="Fecha Fin" />
          </div>
        </div>
      </div>

      <Grid numItemsSm={2} numItemsLg={4} className="gap-4 md:gap-6 mb-6">
        <Card className="ring-1 ring-gray-200 shadow-sm rounded-xl hover:shadow-md transition-shadow p">
          <Flex justifyContent="between" alignItems="center">
            <div>
              <Text className="font-medium text-gray-500">Comprobantes</Text>
              <Metric className="text-gray-900 mt-1">{totalInvoices}</Metric>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
              <Icon className="text-blue-600" icon="solar:bill-list-bold-duotone" width="24" height="24" />
            </div>
          </Flex>
        </Card>
        <Card className="ring-1 ring-gray-200 shadow-sm rounded-xl hover:shadow-md transition-shadow">
          <Flex justifyContent="between" alignItems="center">
            <div>
              <Text className="font-medium text-gray-500">Clientes</Text>
              <Metric className="text-gray-900 mt-1">{totalCLients}</Metric>
            </div>
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
              <Icon className="text-emerald-600" icon="solar:users-group-rounded-bold-duotone" width="24" height="24" />
            </div>
          </Flex>
        </Card>
        <Card className="ring-1 ring-gray-200 shadow-sm rounded-xl hover:shadow-md transition-shadow">
          <Flex justifyContent="between" alignItems="center">
            <div>
              <Text className="font-medium text-gray-500">Productos</Text>
              <Metric className="text-gray-900 mt-1">{totalProducts}</Metric>
            </div>
            <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center">
              <Icon className="text-amber-600" icon="solar:box-bold-duotone" width="24" height="24" />
            </div>
          </Flex>
        </Card>
        <Card className="ring-1 ring-gray-200 shadow-sm rounded-xl hover:shadow-md transition-shadow">
          <Flex justifyContent="between" alignItems="center">
            <div>
              <Text className="font-medium text-gray-500">Ingresos Totales</Text>
              <Metric className="text-gray-900 mt-1">S/ {Number(totalAmount || 0).toFixed(2)}</Metric>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
              <Icon className="text-blue-600" icon="solar:wallet-money-bold-duotone" width="24" height="24" />
            </div>
          </Flex>
        </Card>
      </Grid>

      <Grid numItemsSm={1} numItemsLg={2} className="gap-4 md:gap-6">
        <Card className="ring-1 ring-gray-200 shadow-sm rounded-xl p-4">
          <Title className="text-gray-900 font-bold mb-4">Ingresos por comprobantes</Title>
          <AreaChart
            className="mt-4 h-64 md:h-72"
            data={chartData}
            index="date"
            categories={["Boletas", "Facturas", "NotasCredito", "NotasDebito"]}
            colors={["blue", "cyan", "rose", "slate"]}
            curveType="monotone"
            showLegend
            showGridLines={false}
            showAnimation
            yAxisWidth={64}
            valueFormatter={(value: number) =>
              `S/ ${Number(value || 0).toLocaleString("es-PE", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`
            }
          />
        </Card>
        <Card className="ring-1 ring-gray-200 shadow-sm rounded-xl p-4">
          <Title className="text-gray-900 font-bold mb-4">Ingresos por método de pago</Title>
          <BarChart
            className="mt-4 h-64 md:h-72"
            data={chartDataPayments}
            index="date"
            categories={["Yape", "Plin", "Efectivo"]}
            colors={["violet", "pink", "emerald"]}
            showLegend
            showGridLines={false}
            showAnimation
            yAxisWidth={64}
            valueFormatter={(value: number) =>
              `S/ ${Number(value || 0).toLocaleString("es-PE", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`
            }
          />
        </Card>
      </Grid>

      <Grid numItemsSm={1} numItemsLg={2} className="gap-4 md:gap-6 mt-4 md:mt-6">
        <Card className="ring-1 ring-gray-200 shadow-sm rounded-xl p-4">
          <Title className="text-gray-900 font-bold mb-4">Top de productos más vendidos</Title>
          <div className="mt-4 overflow-x-auto ring-1 ring-gray-200 rounded-lg">
            <DataTable
              bodyData={topTableData}
              headerColumns={["Codigo", "Descripcion", "Stock", "Cant. Vendido"]}
            />
          </div>
        </Card>
        <Card className="ring-1 ring-gray-200 shadow-sm rounded-xl p-4">
          <Title className="text-gray-900 font-bold mb-4">Nuevos clientes por fecha</Title>
          <BarChart
            className="mt-6 h-64 md:h-72"
            data={chartDataClients}
            index="date"
            categories={["nuevos"]}
            colors={["blue"]}
            showGridLines={false}
            valueFormatter={(value: number) => `${Number(value || 0).toFixed(0)}`}
          />
        </Card>
      </Grid>
    </div>
  )
}
