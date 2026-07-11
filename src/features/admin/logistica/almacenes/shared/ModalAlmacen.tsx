import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Icon } from '@iconify/react';
import Button from '@/components/Button';
import InputPro from '@/components/InputPro';
import Select from '@/components/Select';
import Modal from '@/components/Modal';
import { IAlmacen, TIPOS_ALMACEN } from '../AlmacenesModel';
import { Controller } from 'react-hook-form';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  almacen: IAlmacen | null;
}

export default function ModalAlmacen({ isOpen, onClose, onSubmit, almacen }: Props) {
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm();

  useEffect(() => {
    if (isOpen) {
      if (almacen) {
        reset({
          nombre: almacen.nombre,
          codigo: almacen.codigo || '',
          tipo: almacen.tipo || 'PRINCIPAL',
          direccion: almacen.direccion,
          distrito: almacen.distrito || '',
          ciudad: almacen.ciudad || '',
          departamento: almacen.departamento || '',
          activo: almacen.activo ? 'true' : 'false'
        });
      } else {
        reset({
          nombre: '',
          codigo: '',
          tipo: 'PRINCIPAL',
          direccion: '',
          distrito: '',
          ciudad: '',
          departamento: '',
          activo: 'true'
        });
      }
    }
  }, [isOpen, almacen, reset]);

  if (!isOpen) return null;

  const handleFormSubmit = (data: any) => {
    onSubmit({
      ...data,
      activo: data.activo === 'true'
    });
  };

  return (
    <Modal
      isOpenModal={isOpen}
      closeModal={onClose}
      title={almacen ? 'Editar Almacén' : 'Nuevo Almacén'}
      width="500px"
      icon="solar:box-bold-duotone"
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
          label="Nombre del Almacén"
          error={errors.nombre?.message as string}
          isLabel
        />
      )}
    />

        <Controller
      control={control}
      name="direccion"
      rules={{ required: 'Requerido' }}
      render={({ field }) => (
        <InputPro
          name={field.name}
          value={field.value}
          onChange={field.onChange}
          label="Dirección Completa"
          error={errors.direccion?.message as string}
          isLabel
        />
      )}
    />

        <div className="grid grid-cols-2 gap-4">
          <Controller
            control={control}
            name="codigo"
            render={({ field }) => (
              <InputPro name={field.name} value={field.value} onChange={field.onChange} label="Código (opc)" error={errors.codigo?.message as string} isLabel />
            )}
          />
          <Controller
            control={control}
            name="tipo"
            render={({ field }) => (
              <Select
                name={field.name}
                label="Tipo de Almacén"
                withLabel
                value={field.value}
                onChange={(id) => field.onChange(id)}
                options={TIPOS_ALMACEN.map(t => ({ id: t.value, value: t.label }))}
                error={errors.tipo?.message as string}
              />
            )}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Controller
            control={control}
            name="distrito"
            render={({ field }) => (
              <InputPro name={field.name} value={field.value} onChange={field.onChange} label="Distrito (opc)" isLabel />
            )}
          />
          <Controller
            control={control}
            name="ciudad"
            render={({ field }) => (
              <InputPro name={field.name} value={field.value} onChange={field.onChange} label="Ciudad (opc)" isLabel />
            )}
          />
          <Controller
            control={control}
            name="departamento"
            render={({ field }) => (
              <InputPro name={field.name} value={field.value} onChange={field.onChange} label="Departamento (opc)" isLabel />
            )}
          />
        </div>

        <Controller
          control={control}
          name="activo"
          render={({ field }) => (
            <Select
              name={field.name}
              label="Estado"
              withLabel
              value={field.value}
              onChange={(id, val, name) => field.onChange(id)}
              options={[
                { id: 'true', value: 'Activo / Operativo' },
                { id: 'false', value: 'Inactivo / Cerrado' },
              ]}
              error={errors.activo?.message as string}
            />
          )}
        />

        <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800 mt-4">
          <Button type="button" color="light" onClick={onClose}>Cancelar</Button>
          <Button type="submit" color="primary">Guardar Almacén</Button>
        </div>
      </form>
    </Modal>
  );
}
