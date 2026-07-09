import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Icon } from '@iconify/react';
import Button from '@/components/Button';
import InputPro from '@/components/InputPro';
import Select from '@/components/Select';
import Modal from '@/components/Modal';
import { IClienteLogistica } from '../ClientesModel';
import { Controller } from 'react-hook-form';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  cliente: IClienteLogistica | null;
  zonasActivas: any[];
}

export default function ModalClienteLogistica({ isOpen, onClose, onSubmit, cliente, zonasActivas }: Props) {
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm();

  useEffect(() => {
    if (isOpen) {
      if (cliente) {
        reset({
          nombre: cliente.nombre,
          tipoDocumento: cliente.tipoDocumento || 'DNI',
          nroDocumento: cliente.nroDocumento,
          telefono: cliente.telefono || '',
          email: cliente.email || '',
          direccionPrincipal: cliente.direccionPrincipal || '',
          zonaId: cliente.zonaId || '',
          notas: cliente.notas || ''
        });
      } else {
        reset({
          nombre: '',
          tipoDocumento: 'DNI',
          nroDocumento: '',
          telefono: '',
          email: '',
          direccionPrincipal: '',
          zonaId: '',
          notas: ''
        });
      }
    }
  }, [isOpen, cliente, reset]);

  if (!isOpen) return null;

  return (
    <Modal
      isOpenModal={isOpen}
      closeModal={onClose}
      title={cliente ? 'Editar Cliente' : 'Nuevo Cliente'}
      width="600px"
      icon="solar:users-group-rounded-bold-duotone"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-5">
        <Controller
      control={control}
      name="nombre"
      rules={{ required: 'Requerido' }}
      render={({ field }) => (
        <InputPro
          name={field.name}
          value={field.value}
          onChange={field.onChange}
          label="Nombre Completo o Razón Social"
          error={errors.nombre?.message as string}
          isLabel
        />
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
                onChange={(id, val, name) => field.onChange(id)}
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

        <div className="grid grid-cols-2 gap-4">
          <Controller
      control={control}
      name="telefono"
      
      render={({ field }) => (
        <InputPro
          name={field.name}
          value={field.value}
          onChange={field.onChange}
          label="Teléfono / Celular"
          error={errors.telefono?.message as string}
          isLabel
        />
      )}
    />
          <Controller
      control={control}
      name="email"
      
      render={({ field }) => (
        <InputPro
          name={field.name}
          value={field.value}
          onChange={field.onChange}
          label="Correo Electrónico" type="email"
          error={errors.email?.message as string}
          isLabel
        />
      )}
    />
        </div>

        <Controller
      control={control}
      name="direccionPrincipal"
      
      render={({ field }) => (
        <InputPro
          name={field.name}
          value={field.value}
          onChange={field.onChange}
          label="Dirección Principal"
          error={errors.direccionPrincipal?.message as string}
          isLabel
        />
      )}
    />

        <Controller
          control={control}
          name="zonaId"
          render={({ field }) => (
            <Select
              name={field.name}
              label="Zona de Entrega Asociada (Opcional)"
              withLabel
              value={field.value}
              onChange={(id, val, name) => field.onChange(id)}
              options={[{ id: '', value: 'Ninguna / Por Definir' }, ...zonasActivas.map(z => ({ id: z.id, value: z.nombre }))]}
              error={errors.zonaId?.message as string}
            />
          )}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 ml-1">Notas / Referencias</label>
          <textarea 
            {...register('notas')}
            rows={2}
            className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-violet-500 outline-none transition-all"
            placeholder="Referencia de domicilio, horarios de atención, etc."
          ></textarea>
        </div>

        <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800 mt-4">
          <Button type="button" color="light" onClick={onClose}>Cancelar</Button>
          <Button type="submit" color="primary">Guardar Cliente</Button>
        </div>
      </form>
    </Modal>
  );
}
