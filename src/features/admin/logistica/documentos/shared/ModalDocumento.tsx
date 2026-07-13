import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import Button from '@/components/Button';
import InputPro from '@/components/InputPro';
import Select from '@/components/Select';
import { Calendar as DateComponent } from '@/components/Date';
import Modal from '@/components/Modal';
import {
  IDocumento,
  ENTIDADES_DOC,
  TIPOS_DOC_VEHICULO,
  TIPOS_DOC_CONDUCTOR,
} from '../DocumentosModel';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  documento: IDocumento | null;
  vehiculos: any[];
  conductores: any[];
}

export default function ModalDocumento({ isOpen, onClose, onSubmit, documento, vehiculos, conductores }: Props) {
  const { handleSubmit, reset, control, watch, formState: { errors } } = useForm();
  const entidad = watch('entidad');

  useEffect(() => {
    if (isOpen) {
      reset({
        entidad: documento?.entidad || 'VEHICULO',
        vehiculoId: documento?.vehiculoId ? String(documento.vehiculoId) : '',
        conductorId: documento?.conductorId ? String(documento.conductorId) : '',
        tipo: documento?.tipo || '',
        numero: documento?.numero || '',
        fechaEmision: documento?.fechaEmision || '',
        fechaVencimiento: documento?.fechaVencimiento || '',
        notas: documento?.notas || '',
      });
    }
  }, [isOpen, documento, reset]);

  if (!isOpen) return null;

  const esVehiculo = entidad === 'VEHICULO';
  const tipoOptions = (esVehiculo ? TIPOS_DOC_VEHICULO : TIPOS_DOC_CONDUCTOR).map((t) => ({ id: t.value, value: t.label }));
  const titularOptions = esVehiculo
    ? [{ id: '', value: 'Seleccione un vehículo' }, ...vehiculos.map((v) => ({ id: String(v.id), value: `${v.placa} - ${[v.marca, v.modelo].filter(Boolean).join(' ')}` }))]
    : [{ id: '', value: 'Seleccione un conductor' }, ...conductores.map((c) => ({ id: String(c.id), value: `${c.nombre} ${c.apellido}${c.dni ? ` (${c.dni})` : ''}` }))];

  const handleFormSubmit = (data: any) => {
    const esVeh = data.entidad === 'VEHICULO';
    if (esVeh && !data.vehiculoId) return;
    if (!esVeh && !data.conductorId) return;
    onSubmit({
      entidad: data.entidad,
      vehiculoId: esVeh && data.vehiculoId ? Number(data.vehiculoId) : undefined,
      conductorId: !esVeh && data.conductorId ? Number(data.conductorId) : undefined,
      tipo: data.tipo,
      numero: data.numero || undefined,
      fechaEmision: data.fechaEmision ? new Date(data.fechaEmision).toISOString() : undefined,
      fechaVencimiento: data.fechaVencimiento ? new Date(data.fechaVencimiento).toISOString() : undefined,
      notas: data.notas || undefined,
    });
  };

  return (
    <Modal isOpenModal={isOpen} closeModal={onClose} title={documento ? 'Editar Documento' : 'Nuevo Documento'} width="640px" icon="solar:document-text-bold-duotone">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="p-5 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Controller control={control} name="entidad" render={({ field }) => (
            <Select name={field.name} label="Pertenece a" withLabel value={field.value} onChange={(id) => field.onChange(id)} options={ENTIDADES_DOC.map((e) => ({ id: e.value, value: e.label }))} error={errors.entidad?.message as string} />
          )} />
          {esVehiculo ? (
            <Controller control={control} name="vehiculoId" rules={{ required: 'Seleccione un vehículo' }} render={({ field }) => (
              <Select name={field.name} label="Vehículo" withLabel value={field.value} onChange={(id) => field.onChange(id)} options={titularOptions} error={errors.vehiculoId?.message as string} />
            )} />
          ) : (
            <Controller control={control} name="conductorId" rules={{ required: 'Seleccione un conductor' }} render={({ field }) => (
              <Select name={field.name} label="Conductor" withLabel value={field.value} onChange={(id) => field.onChange(id)} options={titularOptions} error={errors.conductorId?.message as string} />
            )} />
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Controller control={control} name="tipo" rules={{ required: 'Requerido' }} render={({ field }) => (
            <Select name={field.name} label="Tipo de documento" withLabel value={field.value} onChange={(id) => field.onChange(id)} options={[{ id: '', value: 'Seleccione...' }, ...tipoOptions]} error={errors.tipo?.message as string} />
          )} />
          <Controller control={control} name="numero" render={({ field }) => (
            <InputPro name={field.name} value={field.value} onChange={field.onChange} label="Número (opc)" error={errors.numero?.message as string} isLabel />
          )} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Controller control={control} name="fechaEmision" render={({ field }) => (
            <DateComponent text="Fecha de emisión (opc)" value={field.value} isLabel onChange={(date: any) => field.onChange(date)} />
          )} />
          <Controller control={control} name="fechaVencimiento" rules={{ required: 'Requerido' }} render={({ field }) => (
            <DateComponent text="Fecha de vencimiento" value={field.value} isLabel onChange={(date: any) => field.onChange(date)} />
          )} />
        </div>

        <Controller control={control} name="notas" render={({ field }) => (
          <InputPro name={field.name} value={field.value} onChange={field.onChange} label="Notas (opc)" error={errors.notas?.message as string} isLabel />
        )} />

        <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800 mt-4">
          <Button type="button" color="light" onClick={onClose}>Cancelar</Button>
          <Button type="submit" color="primary">Guardar Documento</Button>
        </div>
      </form>
    </Modal>
  );
}
