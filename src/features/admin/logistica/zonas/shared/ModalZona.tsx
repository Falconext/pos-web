import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import Button from '@/components/Button';
import InputPro from '@/components/InputPro';
import Select from '@/components/Select';
import Modal from '@/components/Modal';
import { IZona, DIFICULTADES_ZONA } from '../ZonasModel';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  zona: IZona | null;
}

export default function ModalZona({ isOpen, onClose, onSubmit, zona }: Props) {
  const { handleSubmit, reset, control, formState: { errors } } = useForm();

  useEffect(() => {
    if (isOpen) {
      reset({
        nombre: zona?.nombre || '',
        codigo: zona?.codigo || '',
        color: zona?.color || '#8b5cf6',
        costoBase: zona?.costoBase ?? '',
        costoPorKm: zona?.costoPorKm ?? '',
        dificultad: zona?.dificultad || 'MEDIA',
        activa: zona?.activa === false ? 'false' : 'true'
      });
    }
  }, [isOpen, zona, reset]);

  if (!isOpen) return null;

  const handleFormSubmit = (data: any) => {
    onSubmit({
      nombre: data.nombre,
      codigo: data.codigo || undefined,
      color: data.color || undefined,
      costoBase: data.costoBase !== '' ? Number(data.costoBase) : undefined,
      costoPorKm: data.costoPorKm !== '' ? Number(data.costoPorKm) : undefined,
      dificultad: data.dificultad || undefined,
      activa: data.activa === 'true'
    });
  };

  return (
    <Modal
      isOpenModal={isOpen}
      closeModal={onClose}
      title={zona ? 'Editar Zona' : 'Nueva Zona de Entrega'}
      width="520px"
      icon="solar:map-point-bold-duotone"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="p-5 space-y-5">
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <Controller
              control={control}
              name="nombre"
              rules={{ required: 'Requerido' }}
              render={({ field }) => (
                <InputPro name={field.name} value={field.value} onChange={field.onChange} label="Nombre de la Zona" error={errors.nombre?.message as string} isLabel />
              )}
            />
          </div>
          <Controller
            control={control}
            name="codigo"
            render={({ field }) => (
              <InputPro name={field.name} value={field.value} onChange={field.onChange} label="Código (opc)" isLabel />
            )}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Controller
            control={control}
            name="costoBase"
            render={({ field }) => (
              <InputPro name={field.name} value={field.value} onChange={field.onChange} label="Costo Base" type="number" step="0.01" isLabel />
            )}
          />
          <Controller
            control={control}
            name="costoPorKm"
            render={({ field }) => (
              <InputPro name={field.name} value={field.value} onChange={field.onChange} label="Costo por Km" type="number" step="0.01" isLabel />
            )}
          />
          <Controller
            control={control}
            name="dificultad"
            render={({ field }) => (
              <Select
                name={field.name}
                label="Dificultad"
                withLabel
                value={field.value}
                onChange={(id) => field.onChange(id)}
                options={DIFICULTADES_ZONA.map(d => ({ id: d.value, value: d.label }))}
                error={errors.dificultad?.message as string}
              />
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 items-center">
          <Controller
            control={control}
            name="color"
            render={({ field }) => (
              <div className="flex flex-col gap-1.5">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Color</label>
                <input type="color" value={field.value} onChange={(e) => field.onChange(e.target.value)} className="h-10 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer" />
              </div>
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
                onChange={(id) => field.onChange(id)}
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
