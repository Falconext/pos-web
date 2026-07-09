import React from 'react';
import { useForm } from 'react-hook-form';
import { Icon } from '@iconify/react';
import Button from '@/components/Button';
import InputPro from '@/components/InputPro';
import Select from '@/components/Select';
import { Calendar as DateComponent } from '@/components/Date';
import Modal from '@/components/Modal';
import { Controller } from 'react-hook-form';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  clientes: any[];
  zonasActivas: any[];
}

export default function ModalPedido({ isOpen, onClose, onSubmit, clientes, zonasActivas }: Props) {
  const { register, handleSubmit, control, formState: { errors } } = useForm({
    defaultValues: {
      clienteId: '',
      direccionEntrega: '',
      zonaId: '',
      fechaPrometida: '',
      ventanaInicio: '',
      ventanaFin: '',
      prioridad: 'MEDIA',
      pesoTotalKg: '',
      volumenTotalM3: '',
      bultos: 1,
      notas: ''
    }
  });

  if (!isOpen) return null;

  return (
    <Modal
      isOpenModal={isOpen}
      closeModal={onClose}
      title="Nuevo Pedido Logístico"
      width="750px"
      icon="solar:box-bold-duotone"
    >
      <form id="form-pedido" onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-6">
        
        {/* Destino */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-2">
            <Icon icon="solar:map-point-bold-duotone" width={18}/> Destino y Cliente
          </h3>
          
          <Controller
            control={control}
            name="clienteId"
            rules={{ required: 'Seleccione un cliente' }}
            render={({ field }) => (
              <Select
                name={field.name}
                label="Cliente / Destinatario"
                withLabel
                value={field.value}
                onChange={(id, val, name) => field.onChange(id)}
                options={[
                  { id: '', value: 'Seleccione...' },
                  ...clientes.map(c => ({ id: c.id, value: `${c.nroDocumento} - ${c.nombre}` }))
                ]}
                error={errors.clienteId?.message as string}
              />
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <Controller
      control={control}
      name="direccionEntrega"
      rules={{ required: 'Requerido' }}
      render={({ field }) => (
        <InputPro
          name={field.name}
          value={field.value}
          onChange={field.onChange}
          label="Dirección Exacta de Entrega"
          error={errors.direccionEntrega?.message as string}
          isLabel
        />
      )}
    />
            <Controller
              control={control}
              name="zonaId"
              render={({ field }) => (
                <Select
                  name={field.name}
                  label="Zona de Entrega"
                  withLabel
                  value={field.value}
                  onChange={(id, val, name) => field.onChange(id)}
                  options={[
                    { id: '', value: 'Automática o Sin Definir' },
                    ...zonasActivas.map(z => ({ id: z.id, value: z.nombre }))
                  ]}
                  error={errors.zonaId?.message as string}
                />
              )}
            />
          </div>
        </div>

        {/* Operaciones */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-2">
            <Icon icon="solar:calendar-date-bold-duotone" width={18}/> Programación
          </h3>

          <div className="grid grid-cols-3 gap-4">
            <Controller
              control={control}
              name="fechaPrometida"
              render={({ field }) => (
                <DateComponent
                  text="Fecha Prometida (Opcional)"
                  value={field.value}
                  isLabel
                  onChange={(date: any) => field.onChange(date)}
                />
              )}
            />
            <Controller
      control={control}
      name="ventanaInicio"
      
      render={({ field }) => (
        <InputPro
          name={field.name}
          value={field.value}
          onChange={field.onChange}
          label="Hora Inicio (opc)" type="time"
          error={errors.ventanaInicio?.message as string}
          isLabel
        />
      )}
    />
            <Controller
      control={control}
      name="ventanaFin"
      
      render={({ field }) => (
        <InputPro
          name={field.name}
          value={field.value}
          onChange={field.onChange}
          label="Hora Fin (opc)" type="time"
          error={errors.ventanaFin?.message as string}
          isLabel
        />
      )}
    />
          </div>

          <div className="w-1/3">
            <Controller
              control={control}
              name="prioridad"
              render={({ field }) => (
                <Select
                  name={field.name}
                  label="Prioridad"
                  withLabel
                  value={field.value}
                  onChange={(id, val, name) => field.onChange(id)}
                  options={[
                    { id: 'BAJA', value: 'Baja' },
                    { id: 'MEDIA', value: 'Media' },
                    { id: 'ALTA', value: 'Alta' },
                    { id: 'URGENTE', value: 'Urgente' },
                  ]}
                  error={errors.prioridad?.message as string}
                />
              )}
            />
          </div>
        </div>

        {/* Carga */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-2">
            <Icon icon="solar:box-bold-duotone" width={18}/> Detalles de Carga
          </h3>

          <div className="grid grid-cols-3 gap-4">
            <Controller
      control={control}
      name="bultos"
      
      render={({ field }) => (
        <InputPro
          name={field.name}
          value={field.value}
          onChange={field.onChange}
          label="N° Bultos" type="number"
          error={errors.bultos?.message as string}
          isLabel
        />
      )}
    />
            <Controller
      control={control}
      name="pesoTotalKg"
      
      render={({ field }) => (
        <InputPro
          name={field.name}
          value={field.value}
          onChange={field.onChange}
          label="Peso Total (Kg)" type="number" step="0.01"
          error={errors.pesoTotalKg?.message as string}
          isLabel
        />
      )}
    />
            <Controller
      control={control}
      name="volumenTotalM3"
      
      render={({ field }) => (
        <InputPro
          name={field.name}
          value={field.value}
          onChange={field.onChange}
          label="Volumen Total (m³)" type="number" step="0.01"
          error={errors.volumenTotalM3?.message as string}
          isLabel
        />
      )}
    />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 ml-1">Notas para el Repartidor</label>
          <textarea 
            {...register('notas')}
            rows={2}
            className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-violet-500 transition-all outline-none"
            placeholder="Instrucciones de entrega, contacto, etc."
          ></textarea>
        </div>

        <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800 mt-4">
          <Button type="button" color="light" onClick={onClose}>Cancelar</Button>
          <Button type="submit" color="primary">Crear Pedido</Button>
        </div>
      </form>
    </Modal>
  );
}
