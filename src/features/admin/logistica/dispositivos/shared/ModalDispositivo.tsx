import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import Button from '@/components/Button';
import InputPro from '@/components/InputPro';
import Select from '@/components/Select';
import Modal from '@/components/Modal';
import { IDispositivo } from '../DispositivosModel';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  dispositivo: IDispositivo | null;
  vehiculos: any[];
}

export default function ModalDispositivo({ isOpen, onClose, onSubmit, dispositivo, vehiculos }: Props) {
  const { handleSubmit, reset, control, formState: { errors } } = useForm();

  useEffect(() => {
    if (isOpen) {
      reset({
        nombre: dispositivo?.nombre || '',
        identificador: dispositivo?.identificador || '',
        vehiculoId: dispositivo?.vehiculoId ? String(dispositivo.vehiculoId) : '',
      });
    }
  }, [isOpen, dispositivo, reset]);

  if (!isOpen) return null;

  const vehiculoOptions = [
    { id: '', value: 'Sin vehículo asignado' },
    ...vehiculos.map((v) => ({ id: String(v.id), value: `${v.placa} - ${[v.marca, v.modelo].filter(Boolean).join(' ')}` })),
  ];

  const handleFormSubmit = (data: any) => {
    onSubmit({
      nombre: data.nombre,
      identificador: data.identificador,
      vehiculoId: data.vehiculoId ? Number(data.vehiculoId) : undefined,
    });
  };

  return (
    <Modal isOpenModal={isOpen} closeModal={onClose} title={dispositivo ? 'Editar Dispositivo' : 'Nuevo Dispositivo GPS'} width="560px" icon="solar:gps-bold-duotone">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="p-5 space-y-5">
        <Controller control={control} name="nombre" rules={{ required: 'Requerido' }} render={({ field }) => (
          <InputPro name={field.name} value={field.value} onChange={field.onChange} label="Nombre del dispositivo" error={errors.nombre?.message as string} isLabel />
        )} />
        <Controller control={control} name="identificador" rules={{ required: 'Requerido' }} render={({ field }) => (
          <InputPro name={field.name} value={field.value} onChange={field.onChange} label="IMEI / Identificador" error={errors.identificador?.message as string} isLabel />
        )} />
        <Controller control={control} name="vehiculoId" render={({ field }) => (
          <Select name={field.name} label="Vehículo asignado (opc)" withLabel value={field.value} onChange={(id) => field.onChange(id)} options={vehiculoOptions} error={errors.vehiculoId?.message as string} />
        )} />
        {!dispositivo && (
          <p className="text-xs text-gray-500 bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-100 dark:border-cyan-900/40 rounded-lg px-3 py-2">
            Al crear el dispositivo se generará un <b>token</b> único para que el GPS o la app del conductor reporte sus posiciones.
          </p>
        )}
        <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800 mt-4">
          <Button type="button" color="light" onClick={onClose}>Cancelar</Button>
          <Button type="submit" color="primary">Guardar</Button>
        </div>
      </form>
    </Modal>
  );
}
