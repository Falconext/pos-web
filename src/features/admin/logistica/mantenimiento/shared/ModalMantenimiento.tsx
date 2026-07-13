import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import Button from '@/components/Button';
import InputPro from '@/components/InputPro';
import Select from '@/components/Select';
import { Calendar as DateComponent } from '@/components/Date';
import Modal from '@/components/Modal';
import {
  IMantenimiento,
  TIPOS_MANTENIMIENTO,
  ESTADOS_MANTENIMIENTO,
} from '../MantenimientoModel';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  mantenimiento: IMantenimiento | null;
  vehiculos: any[];
}

export default function ModalMantenimiento({
  isOpen,
  onClose,
  onSubmit,
  mantenimiento,
  vehiculos,
}: Props) {
  const {
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    if (isOpen) {
      reset({
        vehiculoId: mantenimiento?.vehiculoId ? String(mantenimiento.vehiculoId) : '',
        tipo: mantenimiento?.tipo || 'PREVENTIVO',
        estado: mantenimiento?.estado || 'PROGRAMADO',
        descripcion: mantenimiento?.descripcion || '',
        taller: mantenimiento?.taller || '',
        fechaProgramada: mantenimiento?.fechaProgramada || '',
        fechaRealizado: mantenimiento?.fechaRealizado || '',
        costo: mantenimiento?.costo != null ? String(mantenimiento.costo) : '',
        odometroKm: mantenimiento?.odometroKm != null ? String(mantenimiento.odometroKm) : '',
        proximoMantenimientoKm:
          mantenimiento?.proximoMantenimientoKm != null
            ? String(mantenimiento.proximoMantenimientoKm)
            : '',
        proximoMantenimientoFecha: mantenimiento?.proximoMantenimientoFecha || '',
        notas: mantenimiento?.notas || '',
      });
    }
  }, [isOpen, mantenimiento, reset]);

  if (!isOpen) return null;

  const vehiculoOptions = [
    { id: '', value: 'Seleccione un vehículo' },
    ...vehiculos.map((v) => ({
      id: String(v.id),
      value: `${v.placa} - ${[v.marca, v.modelo].filter(Boolean).join(' ')}`,
    })),
  ];

  const handleFormSubmit = (data: any) => {
    if (!data.vehiculoId) return;
    onSubmit({
      vehiculoId: Number(data.vehiculoId),
      tipo: data.tipo || undefined,
      estado: data.estado || undefined,
      descripcion: data.descripcion,
      taller: data.taller || undefined,
      fechaProgramada: data.fechaProgramada
        ? new Date(data.fechaProgramada).toISOString()
        : undefined,
      fechaRealizado: data.fechaRealizado
        ? new Date(data.fechaRealizado).toISOString()
        : undefined,
      costo: data.costo !== '' ? Number(data.costo) : undefined,
      odometroKm: data.odometroKm !== '' ? Number(data.odometroKm) : undefined,
      proximoMantenimientoKm:
        data.proximoMantenimientoKm !== '' ? Number(data.proximoMantenimientoKm) : undefined,
      proximoMantenimientoFecha: data.proximoMantenimientoFecha
        ? new Date(data.proximoMantenimientoFecha).toISOString()
        : undefined,
      notas: data.notas || undefined,
    });
  };

  return (
    <Modal
      isOpenModal={isOpen}
      closeModal={onClose}
      title={mantenimiento ? 'Editar Mantenimiento' : 'Nuevo Mantenimiento'}
      width="640px"
      icon="solar:wrench-bold-duotone"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="p-5 space-y-5">
        <Controller
          control={control}
          name="vehiculoId"
          rules={{ required: 'Seleccione un vehículo' }}
          render={({ field }) => (
            <Select
              name={field.name}
              label="Vehículo"
              withLabel
              value={field.value}
              onChange={(id) => field.onChange(id)}
              options={vehiculoOptions}
              error={errors.vehiculoId?.message as string}
            />
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <Controller
            control={control}
            name="tipo"
            render={({ field }) => (
              <Select
                name={field.name}
                label="Tipo"
                withLabel
                value={field.value}
                onChange={(id) => field.onChange(id)}
                options={TIPOS_MANTENIMIENTO.map((t) => ({ id: t.value, value: t.label }))}
                error={errors.tipo?.message as string}
              />
            )}
          />
          <Controller
            control={control}
            name="estado"
            render={({ field }) => (
              <Select
                name={field.name}
                label="Estado"
                withLabel
                value={field.value}
                onChange={(id) => field.onChange(id)}
                options={ESTADOS_MANTENIMIENTO.map((e) => ({ id: e.value, value: e.label }))}
                error={errors.estado?.message as string}
              />
            )}
          />
        </div>

        <Controller
          control={control}
          name="descripcion"
          rules={{ required: 'Requerido' }}
          render={({ field }) => (
            <InputPro
              name={field.name}
              value={field.value}
              onChange={field.onChange}
              label="Descripción"
              error={errors.descripcion?.message as string}
              isLabel
            />
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <Controller
            control={control}
            name="taller"
            render={({ field }) => (
              <InputPro
                name={field.name}
                value={field.value}
                onChange={field.onChange}
                label="Taller (opc)"
                error={errors.taller?.message as string}
                isLabel
              />
            )}
          />
          <Controller
            control={control}
            name="costo"
            render={({ field }) => (
              <InputPro
                name={field.name}
                value={field.value}
                onChange={field.onChange}
                label="Costo (S/)"
                type="number"
                error={errors.costo?.message as string}
                isLabel
              />
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Controller
            control={control}
            name="fechaProgramada"
            rules={{ required: 'Requerido' }}
            render={({ field }) => (
              <DateComponent
                text="Fecha Programada"
                value={field.value}
                isLabel
                onChange={(date: any) => field.onChange(date)}
              />
            )}
          />
          <Controller
            control={control}
            name="fechaRealizado"
            render={({ field }) => (
              <DateComponent
                text="Fecha Realizado (opc)"
                value={field.value}
                isLabel
                onChange={(date: any) => field.onChange(date)}
              />
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Controller
            control={control}
            name="odometroKm"
            render={({ field }) => (
              <InputPro
                name={field.name}
                value={field.value}
                onChange={field.onChange}
                label="Odómetro (km, opc)"
                type="number"
                error={errors.odometroKm?.message as string}
                isLabel
              />
            )}
          />
          <Controller
            control={control}
            name="proximoMantenimientoKm"
            render={({ field }) => (
              <InputPro
                name={field.name}
                value={field.value}
                onChange={field.onChange}
                label="Próximo mant. (km, opc)"
                type="number"
                error={errors.proximoMantenimientoKm?.message as string}
                isLabel
              />
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Controller
            control={control}
            name="proximoMantenimientoFecha"
            render={({ field }) => (
              <DateComponent
                text="Próximo mant. (fecha, opc)"
                value={field.value}
                isLabel
                onChange={(date: any) => field.onChange(date)}
              />
            )}
          />
          <Controller
            control={control}
            name="notas"
            render={({ field }) => (
              <InputPro
                name={field.name}
                value={field.value}
                onChange={field.onChange}
                label="Notas (opc)"
                error={errors.notas?.message as string}
                isLabel
              />
            )}
          />
        </div>

        <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800 mt-4">
          <Button type="button" color="light" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" color="primary">
            Guardar Mantenimiento
          </Button>
        </div>
      </form>
    </Modal>
  );
}
