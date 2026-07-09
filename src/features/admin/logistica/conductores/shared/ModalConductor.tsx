import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Icon } from '@iconify/react';
import Button from '@/components/Button';
import InputPro from '@/components/InputPro';
import Select from '@/components/Select';
import Modal from '@/components/Modal';
import { IConductor } from '../ConductoresModel';
import { Controller } from 'react-hook-form';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  conductor: IConductor | null;
}

export default function ModalConductor({ isOpen, onClose, onSubmit, conductor }: Props) {
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm();

  useEffect(() => {
    if (isOpen) {
      if (conductor) {
        reset({
          nombre: conductor.nombre,
          apellido: conductor.apellido,
          tipoDocumento: conductor.tipoDocumento || 'DNI',
          nroDocumento: conductor.nroDocumento,
          licenciaNro: conductor.licenciaNro || '',
          telefono: conductor.telefono || '',
        });
      } else {
        reset({
          nombre: '',
          apellido: '',
          tipoDocumento: 'DNI',
          nroDocumento: '',
          licenciaNro: '',
          telefono: '',
        });
      }
    }
  }, [isOpen, conductor, reset]);

  if (!isOpen) return null;

  return (
    <Modal
      isOpenModal={isOpen}
      closeModal={onClose}
      title={conductor ? 'Editar Conductor' : 'Nuevo Conductor'}
      width="600px"
      icon="solar:user-id-bold-duotone"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Controller
      control={control}
      name="nombre"
      rules={{ required: 'Requerido' }}
      render={({ field }) => (
        <InputPro
          name={field.name}
          value={field.value}
          onChange={field.onChange}
          label="Nombres"
          error={errors.nombre?.message as string}
          isLabel
        />
      )}
    />
          <Controller
      control={control}
      name="apellido"
      rules={{ required: 'Requerido' }}
      render={({ field }) => (
        <InputPro
          name={field.name}
          value={field.value}
          onChange={field.onChange}
          label="Apellidos"
          error={errors.apellido?.message as string}
          isLabel
        />
      )}
    />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Controller
            control={control}
            name="tipoDocumento"
            render={({ field }) => (
              <Select
                name={field.name}
                label="Tipo Doc."
                withLabel
                value={field.value}
                onChange={(id, val, name) => field.onChange(id)}
                options={[
                  { id: 'DNI', value: 'DNI' },
                  { id: 'CE', value: 'Carnet Extranjería' },
                  { id: 'PASAPORTE', value: 'Pasaporte' },
                ]}
                error={errors.tipoDocumento?.message as string}
              />
            )}
          />
          <Controller
      control={control}
      name="nroDocumento"
      rules={{ required: 'Requerido' }}
      render={({ field }) => (
        <InputPro
          name={field.name}
          value={field.value}
          onChange={field.onChange}
          label="Nro Documento"
          error={errors.nroDocumento?.message as string}
          isLabel
        />
      )}
    />
        </div>

        <Controller
      control={control}
      name="licenciaNro"
      
      render={({ field }) => (
        <InputPro
          name={field.name}
          value={field.value}
          onChange={field.onChange}
          label="Nro Licencia de Conducir (Opcional)"
          error={errors.licenciaNro?.message as string}
          isLabel
        />
      )}
    />
        
        <Controller
      control={control}
      name="telefono"
      
      render={({ field }) => (
        <InputPro
          name={field.name}
          value={field.value}
          onChange={field.onChange}
          label="Teléfono / Celular (Opcional)"
          error={errors.telefono?.message as string}
          isLabel
        />
      )}
    />

        <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800 mt-4">
          <Button type="button" color="light" onClick={onClose}>Cancelar</Button>
          <Button type="submit" color="primary">Guardar Conductor</Button>
        </div>
      </form>
    </Modal>
  );
}
