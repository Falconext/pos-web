import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import Button from '@/components/Button';
import InputPro from '@/components/InputPro';
import Select from '@/components/Select';
import { Calendar as DateComponent } from '@/components/Date';
import Modal from '@/components/Modal';
import { IPeaje, TIPOS_PEAJE, ESTADOS_PEAJE } from '../PeajesModel';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  registro: IPeaje | null;
  vehiculos: any[];
}

export default function ModalPeaje({ isOpen, onClose, onSubmit, registro, vehiculos }: Props) {
  const { handleSubmit, reset, control, formState: { errors } } = useForm();

  useEffect(() => {
    if (isOpen) {
      reset({
        vehiculoId: registro?.vehiculoId ? String(registro.vehiculoId) : '',
        tipo: registro?.tipo || 'PEAJE',
        estado: registro?.estado || 'PENDIENTE',
        fecha: registro?.fecha || '',
        monto: registro?.monto != null ? String(registro.monto) : '',
        lugar: registro?.lugar || '',
        descripcion: registro?.descripcion || '',
        placa: registro?.placa || '',
        notas: registro?.notas || '',
      });
    }
  }, [isOpen, registro, reset]);

  if (!isOpen) return null;

  const vehiculoOptions = [
    { id: '', value: 'Sin vehículo' },
    ...vehiculos.map((v) => ({ id: String(v.id), value: `${v.placa} - ${[v.marca, v.modelo].filter(Boolean).join(' ')}` })),
  ];

  const handleFormSubmit = (data: any) => {
    onSubmit({
      vehiculoId: data.vehiculoId ? Number(data.vehiculoId) : undefined,
      tipo: data.tipo || undefined,
      estado: data.estado || undefined,
      fecha: data.fecha ? new Date(data.fecha).toISOString() : undefined,
      monto: data.monto !== '' ? Number(data.monto) : undefined,
      lugar: data.lugar || undefined,
      descripcion: data.descripcion || undefined,
      placa: data.placa || undefined,
      notas: data.notas || undefined,
    });
  };

  return (
    <Modal isOpenModal={isOpen} closeModal={onClose} title={registro ? 'Editar Registro' : 'Nuevo Peaje / Multa'} width="620px" icon="solar:banknote-2-bold-duotone">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="p-5 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Controller control={control} name="tipo" render={({ field }) => (
            <Select name={field.name} label="Tipo" withLabel value={field.value} onChange={(id) => field.onChange(id)} options={TIPOS_PEAJE.map((t) => ({ id: t.value, value: t.label }))} error={errors.tipo?.message as string} />
          )} />
          <Controller control={control} name="estado" render={({ field }) => (
            <Select name={field.name} label="Estado" withLabel value={field.value} onChange={(id) => field.onChange(id)} options={ESTADOS_PEAJE.map((e) => ({ id: e.value, value: e.label }))} error={errors.estado?.message as string} />
          )} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Controller control={control} name="fecha" rules={{ required: 'Requerido' }} render={({ field }) => (
            <DateComponent text="Fecha" value={field.value} isLabel onChange={(date: any) => field.onChange(date)} />
          )} />
          <Controller control={control} name="monto" rules={{ required: 'Requerido' }} render={({ field }) => (
            <InputPro name={field.name} value={field.value} onChange={field.onChange} label="Monto (S/)" type="number" error={errors.monto?.message as string} isLabel />
          )} />
        </div>

        <Controller control={control} name="descripcion" render={({ field }) => (
          <InputPro name={field.name} value={field.value} onChange={field.onChange} label="Descripción (opc)" error={errors.descripcion?.message as string} isLabel />
        )} />

        <div className="grid grid-cols-2 gap-4">
          <Controller control={control} name="vehiculoId" render={({ field }) => (
            <Select name={field.name} label="Vehículo (opc)" withLabel value={field.value} onChange={(id) => field.onChange(id)} options={vehiculoOptions} error={errors.vehiculoId?.message as string} />
          )} />
          <Controller control={control} name="lugar" render={({ field }) => (
            <InputPro name={field.name} value={field.value} onChange={field.onChange} label="Lugar (opc)" error={errors.lugar?.message as string} isLabel />
          )} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Controller control={control} name="placa" render={({ field }) => (
            <InputPro name={field.name} value={field.value} onChange={field.onChange} label="Placa (opc)" error={errors.placa?.message as string} isLabel />
          )} />
          <Controller control={control} name="notas" render={({ field }) => (
            <InputPro name={field.name} value={field.value} onChange={field.onChange} label="Notas (opc)" error={errors.notas?.message as string} isLabel />
          )} />
        </div>

        <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800 mt-4">
          <Button type="button" color="light" onClick={onClose}>Cancelar</Button>
          <Button type="submit" color="primary">Guardar</Button>
        </div>
      </form>
    </Modal>
  );
}
