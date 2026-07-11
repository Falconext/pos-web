import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import Button from '@/components/Button';
import InputPro from '@/components/InputPro';
import Select from '@/components/Select';
import Modal from '@/components/Modal';
import { IClienteLogistica } from '../ClientesModel';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  cliente: IClienteLogistica | null;
}

export default function ModalClienteLogistica({ isOpen, onClose, onSubmit, cliente }: Props) {
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm();

  useEffect(() => {
    if (isOpen) {
      reset({
        nombre: cliente?.nombre || '',
        tipoDocumento: cliente?.tipoDocumento || 'DNI',
        nroDocumento: cliente?.nroDocumento || '',
        celular: cliente?.celular || '',
        whatsapp: cliente?.whatsapp || '',
        email: cliente?.email || '',
        scoreConfianza: cliente?.scoreConfianza ?? ''
      });
    }
  }, [isOpen, cliente, reset]);

  if (!isOpen) return null;

  const handleFormSubmit = (data: any) => {
    onSubmit({
      nombre: data.nombre,
      tipoDocumento: data.tipoDocumento || undefined,
      nroDocumento: data.nroDocumento || undefined,
      celular: data.celular || undefined,
      whatsapp: data.whatsapp || undefined,
      email: data.email || undefined,
      scoreConfianza: data.scoreConfianza !== '' ? Number(data.scoreConfianza) : undefined,
    });
  };

  return (
    <Modal
      isOpenModal={isOpen}
      closeModal={onClose}
      title={cliente ? 'Editar Cliente' : 'Nuevo Cliente'}
      width="600px"
      icon="solar:users-group-rounded-bold-duotone"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="p-5 space-y-5">
        <Controller
          control={control}
          name="nombre"
          rules={{ required: 'Requerido' }}
          render={({ field }) => (
            <InputPro name={field.name} value={field.value} onChange={field.onChange} label="Nombre Completo o Razón Social" error={errors.nombre?.message as string} isLabel />
          )}
        />

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
                onChange={(id) => field.onChange(id)}
                options={[
                  { id: 'DNI', value: 'DNI' },
                  { id: 'RUC', value: 'RUC' },
                  { id: 'CE', value: 'CE' },
                  { id: 'PASAPORTE', value: 'Pasaporte' },
                ]}
                error={errors.tipoDocumento?.message as string}
              />
            )}
          />
          <Controller
            control={control}
            name="nroDocumento"
            render={({ field }) => (
              <InputPro name={field.name} value={field.value} onChange={field.onChange} label="Nro Documento" error={errors.nroDocumento?.message as string} isLabel />
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Controller
            control={control}
            name="celular"
            render={({ field }) => (
              <InputPro name={field.name} value={field.value} onChange={field.onChange} label="Celular" error={errors.celular?.message as string} isLabel />
            )}
          />
          <Controller
            control={control}
            name="whatsapp"
            render={({ field }) => (
              <InputPro name={field.name} value={field.value} onChange={field.onChange} label="WhatsApp" error={errors.whatsapp?.message as string} isLabel />
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Controller
            control={control}
            name="email"
            render={({ field }) => (
              <InputPro name={field.name} value={field.value} onChange={field.onChange} label="Correo Electrónico" type="email" error={errors.email?.message as string} isLabel />
            )}
          />
          <Controller
            control={control}
            name="scoreConfianza"
            render={({ field }) => (
              <InputPro name={field.name} value={field.value} onChange={field.onChange} label="Score de Confianza (opc)" type="number" error={errors.scoreConfianza?.message as string} isLabel />
            )}
          />
        </div>

        <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800 mt-4">
          <Button type="button" color="light" onClick={onClose}>Cancelar</Button>
          <Button type="submit" color="primary">Guardar Cliente</Button>
        </div>
      </form>
    </Modal>
  );
}
