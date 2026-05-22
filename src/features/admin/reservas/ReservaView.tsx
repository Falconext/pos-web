import React from 'react'
import { Icon } from '@iconify/react'
import Button from '@/components/Button'
import Select from '@/components/Select'
import DataTable from '@/components/Datatable'
import ReservaFormModal from './ReservaFormModal'
import { RESERVA_COLUMNS, RESERVA_ESTADOS, EstadoReserva, IReserva } from './ReservaModel'
import { useReservaViewModel } from './useReservaViewModel'

const estadoBadgeClass: Record<EstadoReserva, string> = {
  PENDIENTE: 'bg-amber-50 text-amber-600',
  CONFIRMADA: 'bg-emerald-50 text-emerald-600',
  CANCELADA: 'bg-rose-50 text-rose-600',
}

export default function ReservaView() {
  const vm = useReservaViewModel()

  const tableRows = vm.reservas.map((reserva: IReserva) => ({
    Producto: (
      <div className="flex flex-col">
        <span className="font-semibold text-gray-800">{reserva.producto.nombre}</span>
        <span className="text-xs text-gray-500">{reserva.producto.sku || '-'}</span>
      </div>
    ),
    Cantidad: reserva.cantidad,
    Motivo: reserva.motivo || '-',
    Estado: (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${estadoBadgeClass[reserva.estado]}`}>
        {reserva.estado}
      </span>
    ),
    'Fecha Vencimiento': reserva.fechaVencimiento ? String(reserva.fechaVencimiento).slice(0, 10) : '-',
    Creado: String(reserva.createdAt).slice(0, 10),
    _raw: reserva,
  }))

  const actions = [
    {
      icon: <Icon icon="solar:pen-bold" width="18" />, tooltip: 'Editar',
      onClick: (row: any) => vm.openEditModal(row._raw),
      color: 'blue' as const,
    },
    {
      icon: <Icon icon="solar:check-circle-bold" width="18" />, tooltip: 'Confirmar',
      onClick: (row: any) => { void vm.updateEstado(row._raw, 'CONFIRMADA') },
      color: 'emerald' as const,
      condition: (row: any) => row._raw?.estado !== 'CONFIRMADA',
    },
    {
      icon: <Icon icon="solar:close-circle-bold" width="18" />, tooltip: 'Cancelar',
      onClick: (row: any) => { void vm.updateEstado(row._raw, 'CANCELADA') },
      color: 'amber' as const,
      condition: (row: any) => row._raw?.estado !== 'CANCELADA',
    },
    {
      icon: <Icon icon="solar:trash-bin-trash-bold" width="18" />, tooltip: 'Eliminar',
      onClick: (row: any) => { void vm.deleteReserva(row._raw) },
      color: 'rose' as const,
    },
  ]

  return (
    <div className="min-h-screen px-2 pb-4 bg-gray-50 dark:bg-[#0A0D14]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Reservas</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Reserva stock para pre-órdenes y planificación.</p>
        </div>
        <Button color="secondary" className="flex items-center gap-2 !bg-violet-600 !text-white" onClick={vm.openCreateModal}>
          <Icon icon="solar:bookmark-bold-duotone" className="text-lg" />
          Nueva Reserva
        </Button>
      </div>

      <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Select
            label="Producto"
            name="productoFiltro"
            defaultValue={vm.productoOptions.find((opt) => Number(opt.id) === Number(vm.productoFiltro))?.value || 'Todos'}
            options={[{ id: 0, value: 'Todos' }, ...vm.productoOptions]}
            error=""
            isSearch
            onChange={(id: string | number) => vm.setProductoFiltro(Number(id) === 0 ? null : Number(id))}
          />

          <Select
            label="Estado"
            name="estadoFiltro"
            defaultValue={vm.estadoFiltro}
            options={[{ id: 'TODOS', value: 'TODOS' }, ...RESERVA_ESTADOS.map((item) => ({ id: item.id, value: item.value }))]}
            error=""
            onChange={(id: string | number) => vm.setEstadoFiltro(id as EstadoReserva | 'TODOS')}
          />
        </div>

        {vm.loading ? (
          <div className="py-16 text-center text-gray-500">Cargando reservas...</div>
        ) : (
          <DataTable bodyData={tableRows} headerColumns={RESERVA_COLUMNS} actions={actions} pageSize={20} />
        )}
      </div>

      <ReservaFormModal
        isOpen={vm.isOpenModal}
        onClose={vm.closeModal}
        onSubmit={vm.submitModal}
        productos={vm.productos}
        initialData={vm.editingReserva}
        loading={vm.saving}
      />
    </div>
  )
}
