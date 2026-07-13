import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import Button from '@/components/Button';
import InputPro from '@/components/InputPro';
import Modal from '@/components/Modal';
import { IGeocerca } from '../GeocercasModel';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  geocerca: IGeocerca | null;
}

export default function ModalGeocerca({ isOpen, onClose, onSubmit, geocerca }: Props) {
  const { handleSubmit, reset, control, formState: { errors } } = useForm();

  useEffect(() => {
    if (isOpen) {
      reset({
        nombre: geocerca?.nombre || '',
        descripcion: geocerca?.descripcion || '',
        lat: geocerca?.lat != null ? String(geocerca.lat) : '',
        lng: geocerca?.lng != null ? String(geocerca.lng) : '',
        radio: geocerca?.radio != null ? String(geocerca.radio) : '500',
        color: geocerca?.color || '#6366f1',
      });
    }
  }, [isOpen, geocerca, reset]);

  if (!isOpen) return null;

  const handleFormSubmit = (data: any) => {
    onSubmit({
      nombre: data.nombre,
      descripcion: data.descripcion || undefined,
      tipo: 'CIRCULO',
      lat: data.lat !== '' ? Number(data.lat) : undefined,
      lng: data.lng !== '' ? Number(data.lng) : undefined,
      radio: data.radio !== '' ? Number(data.radio) : undefined,
      color: data.color || undefined,
    });
  };

  return (
    <Modal isOpenModal={isOpen} closeModal={onClose} title={geocerca ? 'Editar Geocerca' : 'Nueva Geocerca'} width="580px" icon="solar:map-point-wave-bold-duotone">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="p-5 space-y-5">
        <Controller control={control} name="nombre" rules={{ required: 'Requerido' }} render={({ field }) => (
          <InputPro name={field.name} value={field.value} onChange={field.onChange} label="Nombre" error={errors.nombre?.message as string} isLabel />
        )} />
        <Controller control={control} name="descripcion" render={({ field }) => (
          <InputPro name={field.name} value={field.value} onChange={field.onChange} label="Descripción (opc)" error={errors.descripcion?.message as string} isLabel />
        )} />
        <div className="grid grid-cols-2 gap-4">
          <Controller control={control} name="lat" rules={{ required: 'Requerido' }} render={({ field }) => (
            <InputPro name={field.name} value={field.value} onChange={field.onChange} label="Latitud" type="number" error={errors.lat?.message as string} isLabel />
          )} />
          <Controller control={control} name="lng" rules={{ required: 'Requerido' }} render={({ field }) => (
            <InputPro name={field.name} value={field.value} onChange={field.onChange} label="Longitud" type="number" error={errors.lng?.message as string} isLabel />
          )} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Controller control={control} name="radio" rules={{ required: 'Requerido' }} render={({ field }) => (
            <InputPro name={field.name} value={field.value} onChange={field.onChange} label="Radio (metros)" type="number" error={errors.radio?.message as string} isLabel />
          )} />
          <Controller control={control} name="color" render={({ field }) => (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Color</label>
              <input type="color" value={field.value} onChange={field.onChange} className="w-full h-11 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 cursor-pointer" />
            </div>
          )} />
        </div>
        <p className="text-xs text-gray-500 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/40 rounded-lg px-3 py-2">
          La geocerca circular vigila un radio alrededor del punto. Cuando un dispositivo GPS entra o sale, se genera un evento automáticamente.
        </p>
        <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800 mt-4">
          <Button type="button" color="light" onClick={onClose}>Cancelar</Button>
          <Button type="submit" color="primary">Guardar Geocerca</Button>
        </div>
      </form>
    </Modal>
  );
}
