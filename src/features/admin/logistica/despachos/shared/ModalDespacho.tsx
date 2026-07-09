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
  conductores: any[];
  vehiculos: any[];
  almacenes: any[];
}

export default function ModalDespacho({ isOpen, onClose, onSubmit, conductores, vehiculos, almacenes }: Props) {
  const { register, handleSubmit, control, formState: { errors } } = useForm({
    defaultValues: {
      fechaProgramada: new Date().toISOString().split('T')[0],
      conductorId: '',
      vehiculoId: '',
      almacenOrigenId: '',
      kilometrajeInicial: '',
      notas: ''
    }
  });

  if (!isOpen) return null;

  return (
    <Modal
      isOpenModal={isOpen}
      closeModal={onClose}
      title="Programar Despacho (Hoja de Ruta)"
      width="600px"
      icon="solar:route-bold-duotone"
    >
      <form id="form-despacho" onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-5">
        <Controller
          control={control}
          name="fechaProgramada"
          rules={{ required: 'Requerido' }}
          render={({ field }) => (
            <>
              <DateComponent
                text="Fecha Programada"
                value={field.value}
                isLabel
                onChange={(date: any) => field.onChange(date)}
              />
              {errors.fechaProgramada && <span className="text-red-500 text-xs mt-1">{errors.fechaProgramada.message as string}</span>}
            </>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <Controller
            control={control}
            name="conductorId"
            rules={{ required: 'Seleccione conductor' }}
            render={({ field }) => (
              <Select
                name={field.name}
                label="Conductor Asignado"
                withLabel
                value={field.value}
                onChange={(id, val, name) => field.onChange(id)}
                options={[
                  { id: '', value: 'Seleccione...' },
                  ...conductores.map(c => ({ id: c.id, value: `${c.nombre} ${c.apellido}` }))
                ]}
                error={errors.conductorId?.message as string}
              />
            )}
          />

          <Controller
            control={control}
            name="vehiculoId"
            rules={{ required: 'Seleccione vehículo' }}
            render={({ field }) => (
              <Select
                name={field.name}
                label="Vehículo Asignado"
                withLabel
                value={field.value}
                onChange={(id, val, name) => field.onChange(id)}
                options={[
                  { id: '', value: 'Seleccione...' },
                  ...vehiculos.map(v => ({ id: v.id, value: `${v.placa} - ${v.marca}` }))
                ]}
                error={errors.vehiculoId?.message as string}
              />
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Controller
            control={control}
            name="almacenOrigenId"
            render={({ field }) => (
              <Select
                name={field.name}
                label="Almacén de Origen / Base"
                withLabel
                value={field.value}
                onChange={(id, val, name) => field.onChange(id)}
                options={[
                  { id: '', value: 'Ninguno / Principal' },
                  ...almacenes.map(a => ({ id: a.id, value: a.nombre }))
                ]}
                error={errors.almacenOrigenId?.message as string}
              />
            )}
          />
          <Controller
      control={control}
      name="kilometrajeInicial"
      
      render={({ field }) => (
        <InputPro
          name={field.name}
          value={field.value}
          onChange={field.onChange}
          label="Kilometraje Inicial (Opcional)" type="number"
          error={errors.kilometrajeInicial?.message as string}
          isLabel
        />
      )}
    />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 ml-1">Notas / Recomendaciones</label>
          <textarea 
            {...register('notas')}
            rows={2}
            className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-violet-500 outline-none transition-all"
            placeholder="Ruta segura, cuidado con carga frágil, etc."
          ></textarea>
        </div>

        <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800 mt-4">
          <Button type="button" color="light" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="form-despacho" color="primary">Programar Despacho</Button>
        </div>
      </form>
    </Modal>
  );
}
