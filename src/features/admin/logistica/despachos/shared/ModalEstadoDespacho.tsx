import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Icon } from '@iconify/react';
import Button from '@/components/Button';
import Select from '@/components/Select';
import Modal from '@/components/Modal';
import { IDespacho, ESTADOS_DESPACHO } from '../DespachosModel';
import { Controller } from 'react-hook-form';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { estado: string; motivo?: string }) => void;
  despacho: IDespacho | null;
}

export default function ModalEstadoDespacho({ isOpen, onClose, onSubmit, despacho }: Props) {
  const { register, handleSubmit, watch, reset, control, formState: { errors } } = useForm<{ estado: string; motivo?: string }>();
  
  const estadoSeleccionado = watch('estado');

  useEffect(() => {
    if (isOpen && despacho) {
      reset({
        estado: despacho.estado,
        motivo: ''
      });
    }
  }, [isOpen, despacho, reset]);

  if (!isOpen || !despacho) return null;

  return (
    <Modal
      isOpenModal={isOpen}
      closeModal={onClose}
      title="Actualizar Ruta / Despacho"
      width="450px"
      icon="solar:route-bold-duotone"
    >
      <form id="form-estado-despacho" onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-5">
        <p className="text-sm text-gray-500 mb-2 ml-1">Despacho: <strong className="text-gray-900 dark:text-white">{despacho.codigo}</strong></p>

        <Controller
          control={control}
          name="estado"
          rules={{ required: true }}
          render={({ field }) => (
            <Select
              name={field.name}
              label="Estado de Ruta"
              withLabel
              value={field.value}
              onChange={(id, val, name) => field.onChange(id)}
              options={ESTADOS_DESPACHO.map(est => ({ id: est.value, value: est.label }))}
              error={errors.estado?.message as string}
            />
          )}
        />

        {estadoSeleccionado === 'CANCELADO' && (
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 ml-1">Motivo de Cancelación</label>
            <textarea 
              {...register('motivo', { required: 'Indique un motivo' })}
              rows={3}
              className={`w-full bg-white dark:bg-slate-900 border rounded-xl px-3 py-2.5 text-sm focus:ring-2 outline-none transition-all ${errors.motivo ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-slate-700 focus:ring-violet-500'}`}
              placeholder="Explique el motivo..."
            ></textarea>
            {errors.motivo && <span className="text-xs text-red-500 ml-1">{errors.motivo.message}</span>}
          </div>
        )}

        <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800 mt-4">
          <Button type="button" color="light" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="form-estado-despacho" color={estadoSeleccionado === 'CANCELADO' ? 'danger' : 'primary'}>Confirmar Cambio</Button>
        </div>
      </form>
    </Modal>
  );
}
