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
    <div className="min-h-screen px-3 md:px-8 pt-0 md:pt-5 md:mt-0 pb-10 bg-tremor-background-muted">

      <div className="flex flex-col sm:flex-row justify-start gap-3 mb-5">
        <Calendar name="fechaInicio" onChange={handleDate} text="Fecha inicio" />
        <Calendar name="fechaFin" onChange={handleDate} text="Fecha Fin" />
      </div>

      <Grid numItemsSm={2} numItemsLg={4} className="gap-4 md:gap-6 mb-6">
        <Card
          className="border border-tremor-border bg-tremor-background shadow-tremorCard"
          decoration="top"
          decorationColor="indigo"
        >
          <Flex justifyContent="between" alignItems="center">
            <div>
              <Text>Comprobantes</Text>
              <Metric>{totalInvoices}</Metric>
            </div>
            <Icon className="text-indigo-500" icon="iconamoon:invoice-fill" width="28" height="28" />
          </Flex>
        </Card>
        <Card
          className="border border-tremor-border bg-tremor-background shadow-tremorCard"
          decoration="top"
          decorationColor="emerald"
        >
          <Flex justifyContent="between" alignItems="center">
            <div>
              <Text>Clientes</Text>
              <Metric>{totalCLients}</Metric>
            </div>
            <Icon className="text-emerald-500" icon="fa:users" width="28" height="28" />
          </Flex>
        </Card>
        <Card
          className="border border-tremor-border bg-tremor-background shadow-tremorCard"
          decoration="top"
          decorationColor="amber"
        >
          <Flex justifyContent="between" alignItems="center">
            <div>
              <Text>Productos</Text>
              <Metric>{totalProducts}</Metric>
            </div>
            <Icon className="text-amber-500" icon="fluent:box-32-filled" width="28" height="28" />
          </Flex>
        </Card>
        <Card
          className="border border-tremor-border bg-tremor-background shadow-tremorCard"
          decoration="top"
          decorationColor="emerald"
        >
          <Flex justifyContent="between" alignItems="center">
            <div>
              <Text>Ingresos</Text>
              <Metric>S/ {Number(totalAmount || 0).toFixed(2)}</Metric>
            </div>
            <Icon className="text-emerald-500" icon="game-icons:receive-money" width="28" height="28" />
          </Flex>
        </Card>
      </Grid>

      <Grid numItemsSm={1} numItemsLg={2} className="gap-4 md:gap-6">
        <Card className="border border-tremor-border bg-tremor-background shadow-tremorCard">
          <Title>Ingresos por comprobantes</Title>
          <AreaChart
            className="mt-4 h-64 md:h-72"
            data={chartData}
            index="date"
            categories={["Boletas", "Facturas", "NotasCredito", "NotasDebito"]}
            curveType="monotone"
            showLegend
            showGridLines
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
        <Card className="border border-tremor-border bg-tremor-background shadow-tremorCard">
          <Title>Ingresos por método de pago</Title>
          <BarChart
            className="mt-4 h-64 md:h-72"
            data={chartDataPayments}
            index="date"
            categories={["Yape", "Plin", "Efectivo"]}
            showLegend
            showGridLines
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

      <Grid numItemsSm={1} numItemsLg={2} className="gap-4 md:gap-6 mt-6 md:mt-8">
        <Card className="border border-tremor-border bg-tremor-background shadow-tremorCard">
          <Title>Top de productos más vendidos</Title>
          <div className="mt-4 overflow-x-auto">
            <DataTable
              bodyData={topTableData}
              headerColumns={["Codigo", "Descripcion", "Stock", "Cant. Vendido"]}
            />
          </div>
        </Card>
        <Card className="border border-tremor-border bg-tremor-background shadow-tremorCard">
          <Title>Nuevos clientes por fecha</Title>
          <BarChart
            className="mt-6 h-64 md:h-72"
            data={chartDataClients}
            index="date"
            categories={["nuevos"]}
            colors={["slate"]}
            valueFormatter={(value: number) => `${Number(value || 0).toFixed(0)}`}
          />
        </Card>
      </Grid>
    </div>
  )
}
