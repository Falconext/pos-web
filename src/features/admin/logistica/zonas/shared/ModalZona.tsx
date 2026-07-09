import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Icon } from '@iconify/react';
import Button from '@/components/Button';
import InputPro from '@/components/InputPro';
import Select from '@/components/Select';
import Modal from '@/components/Modal';
import { IZona } from '../ZonasModel';
import { Controller } from 'react-hook-form';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  zona: IZona | null;
}

export default function ModalZona({ isOpen, onClose, onSubmit, zona }: Props) {
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm();

  useEffect(() => {
    if (isOpen) {
      if (zona) {
        reset({
          nombre: zona.nombre,
          descripcion: zona.descripcion || '',
          tarifaBase: zona.tarifaBase || '',
          activa: zona.activa ? 'true' : 'false'
        });
      } else {
        reset({
          nombre: '',
          descripcion: '',
          tarifaBase: '',
          activa: 'true'
        });
      }
    }
  }, [isOpen, zona, reset]);

  if (!isOpen) return null;

  const handleFormSubmit = (data: any) => {
    onSubmit({
      ...data,
      activa: data.activa === 'true'
    });
  };

  return (
    <Modal
      isOpenModal={isOpen}
      closeModal={onClose}
      title={zona ? 'Editar Zona' : 'Nueva Zona de Entrega'}
      width="500px"
      icon="solar:map-point-bold-duotone"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="p-5 space-y-5">
        <Controller
      control={control}
      name="nombre"
      rules={{ required: 'Requerido' }}
      render={({ field }) => (
        <InputPro
          name={field.name}
          value={field.value}
          onChange={field.onChange}
          label="Nombre de la Zona"
          error={errors.nombre?.message as string}
          isLabel
        />
      )}
    />

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 ml-1">Descripción / Detalles</label>
          <textarea 
            {...register('descripcion')}
            rows={3}
            className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-violet-500 transition-all outline-none"
            placeholder="Ej: Cobertura principal en zona norte..."
          ></textarea>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Controller
      control={control}
      name="tarifaBase"
      
      render={({ field }) => (
        <InputPro
          name={field.name}
          value={field.value}
          onChange={field.onChange}
          label="Tarifa Base" type="number" step="0.01"
          error={errors.tarifaBase?.message as string}
          isLabel
        />
      )}
    />
          <Controller
            control={control}
            name="activa"
            render={({ field }) => (
              <Select
                name={field.name}
                label="Estado"
                withLabel
                value={field.value}
                onChange={(id, val, name) => field.onChange(id)}
                options={[
                  { id: 'true', value: 'Activa' },
                  { id: 'false', value: 'Inactiva' },
                ]}
                error={errors.activa?.message as string}
              />
            )}
          />
        </div>

        <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800 mt-4">
          <Button type="button" color="light" onClick={onClose}>Cancelar</Button>
          <Button type="submit" color="primary">Guardar Zona</Button>
        </div>
      </form>
    </Modal>
  );
}
