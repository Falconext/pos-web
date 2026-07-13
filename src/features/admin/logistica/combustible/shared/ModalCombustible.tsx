import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import Button from '@/components/Button';
import InputPro from '@/components/InputPro';
import Select from '@/components/Select';
import { Calendar as DateComponent } from '@/components/Date';
import Modal from '@/components/Modal';
import { ICombustible, TIPOS_COMBUSTIBLE } from '../CombustibleModel';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  registro: ICombustible | null;
  vehiculos: any[];
}

export default function ModalCombustible({ isOpen, onClose, onSubmit, registro, vehiculos }: Props) {
  const { handleSubmit, reset, control, formState: { errors } } = useForm();

  useEffect(() => {
    if (isOpen) {
      reset({
        vehiculoId: registro?.vehiculoId ? String(registro.vehiculoId) : '',
        fecha: registro?.fecha || '',
        tipoCombustible: registro?.tipoCombustible || 'DIESEL',
        cantidadLitros: registro?.cantidadLitros != null ? String(registro.cantidadLitros) : '',
        costoTotal: registro?.costoTotal != null ? String(registro.costoTotal) : '',
        odometroKm: registro?.odometroKm != null ? String(registro.odometroKm) : '',
        estacion: registro?.estacion || '',
        numeroComprobante: registro?.numeroComprobante || '',
        notas: registro?.notas || '',
      });
    }
  }, [isOpen, registro, reset]);

  if (!isOpen) return null;

  const vehiculoOptions = [
    { id: '', value: 'Seleccione un vehículo' },
    ...vehiculos.map((v) => ({ id: String(v.id), value: `${v.placa} - ${[v.marca, v.modelo].filter(Boolean).join(' ')}` })),
  ];

  const handleFormSubmit = (data: any) => {
    if (!data.vehiculoId) return;
    onSubmit({
      vehiculoId: Number(data.vehiculoId),
      fecha: data.fecha ? new Date(data.fecha).toISOString() : undefined,
      tipoCombustible: data.tipoCombustible || undefined,
      cantidadLitros: data.cantidadLitros !== '' ? Number(data.cantidadLitros) : undefined,
      costoTotal: data.costoTotal !== '' ? Number(data.costoTotal) : undefined,
      odometroKm: data.odometroKm !== '' ? Number(data.odometroKm) : undefined,
      estacion: data.estacion || undefined,
      numeroComprobante: data.numeroComprobante || undefined,
      notas: data.notas || undefined,
    });
  };

  return (
    <Modal isOpenModal={isOpen} closeModal={onClose} title={registro ? 'Editar Carga' : 'Registrar Carga de Combustible'} width="620px" icon="solar:gas-station-bold-duotone">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="p-5 space-y-5">
        <Controller control={control} name="vehiculoId" rules={{ required: 'Seleccione un vehículo' }} render={({ field }) => (
          <Select name={field.name} label="Vehículo" withLabel value={field.value} onChange={(id) => field.onChange(id)} options={vehiculoOptions} error={errors.vehiculoId?.message as string} />
        )} />

        <div className="grid grid-cols-2 gap-4">
          <Controller control={control} name="fecha" rules={{ required: 'Requerido' }} render={({ field }) => (
            <DateComponent text="Fecha" value={field.value} isLabel onChange={(date: any) => field.onChange(date)} />
          )} />
          <Controller control={control} name="tipoCombustible" render={({ field }) => (
            <Select name={field.name} label="Tipo de combustible" withLabel value={field.value} onChange={(id) => field.onChange(id)} options={TIPOS_COMBUSTIBLE.map((t) => ({ id: t.value, value: t.label }))} error={errors.tipoCombustible?.message as string} />
          )} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Controller control={control} name="cantidadLitros" rules={{ required: 'Requerido' }} render={({ field }) => (
            <InputPro name={field.name} value={field.value} onChange={field.onChange} label="Litros" type="number" error={errors.cantidadLitros?.message as string} isLabel />
          )} />
          <Controller control={control} name="costoTotal" rules={{ required: 'Requerido' }} render={({ field }) => (
            <InputPro name={field.name} value={field.value} onChange={field.onChange} label="Costo total (S/)" type="number" error={errors.costoTotal?.message as string} isLabel />
          )} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Controller control={control} name="odometroKm" render={({ field }) => (
            <InputPro name={field.name} value={field.value} onChange={field.onChange} label="Odómetro (km, opc)" type="number" error={errors.odometroKm?.message as string} isLabel />
          )} />
          <Controller control={control} name="estacion" render={({ field }) => (
            <InputPro name={field.name} value={field.value} onChange={field.onChange} label="Estación / Grifo (opc)" error={errors.estacion?.message as string} isLabel />
          )} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Controller control={control} name="numeroComprobante" render={({ field }) => (
            <InputPro name={field.name} value={field.value} onChange={field.onChange} label="Nº comprobante (opc)" error={errors.numeroComprobante?.message as string} isLabel />
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
