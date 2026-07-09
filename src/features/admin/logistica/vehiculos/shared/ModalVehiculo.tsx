import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Icon } from '@iconify/react';
import Button from '@/components/Button';
import InputPro from '@/components/InputPro';
import Select from '@/components/Select';
import Modal from '@/components/Modal';
import { IVehiculo, TIPOS_VEHICULO } from '../VehiculosModel';
import { Controller } from 'react-hook-form';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  vehiculo: IVehiculo | null;
}

export default function ModalVehiculo({ isOpen, onClose, onSubmit, vehiculo }: Props) {
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm();

  useEffect(() => {
    if (isOpen) {
      if (vehiculo) {
        reset({
          placa: vehiculo.placa,
          marca: vehiculo.marca,
          modelo: vehiculo.modelo,
          tipo: vehiculo.tipo || 'CAMIONETA',
          anio: vehiculo.anio || '',
          capacidadCargaKg: vehiculo.capacidadCargaKg || '',
          capacidadVolumenM3: vehiculo.capacidadVolumenM3 || '',
          tipoCombustible: vehiculo.tipoCombustible || 'GASOLINA',
        });
      } else {
        reset({
          placa: '',
          marca: '',
          modelo: '',
          tipo: 'CAMIONETA',
          anio: '',
          capacidadCargaKg: '',
          capacidadVolumenM3: '',
          tipoCombustible: 'GASOLINA',
        });
      }
    }
  }, [isOpen, vehiculo, reset]);

  if (!isOpen) return null;

  return (
    <Modal
      isOpenModal={isOpen}
      closeModal={onClose}
      title={vehiculo ? 'Editar Vehículo' : 'Nuevo Vehículo'}
      width="650px"
      icon="solar:bus-bold-duotone"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Controller
      control={control}
      name="placa"
      rules={{ required: 'Requerido' }}
      render={({ field }) => (
        <InputPro
          name={field.name}
          value={field.value}
          onChange={field.onChange}
          label="Placa"
          error={errors.placa?.message as string}
          isLabel
        />
      )}
    />
          <Controller
            control={control}
            name="tipo"
            render={({ field }) => (
              <Select
                name={field.name}
                label="Tipo de Vehículo"
                withLabel
                value={field.value}
                onChange={(id, val, name) => field.onChange(id)}
                options={TIPOS_VEHICULO.map(t => ({ id: t.value, value: t.label }))}
                error={errors.tipo?.message as string}
              />
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Controller
      control={control}
      name="marca"
      rules={{ required: 'Requerido' }}
      render={({ field }) => (
        <InputPro
          name={field.name}
          value={field.value}
          onChange={field.onChange}
          label="Marca"
          error={errors.marca?.message as string}
          isLabel
        />
      )}
    />
          <Controller
      control={control}
      name="modelo"
      rules={{ required: 'Requerido' }}
      render={({ field }) => (
        <InputPro
          name={field.name}
          value={field.value}
          onChange={field.onChange}
          label="Modelo"
          error={errors.modelo?.message as string}
          isLabel
        />
      )}
    />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Controller
      control={control}
      name="anio"
      
      render={({ field }) => (
        <InputPro
          name={field.name}
          value={field.value}
          onChange={field.onChange}
          label="Año de Fabricación" type="number"
          error={errors.anio?.message as string}
          isLabel
        />
      )}
    />
          <Controller
            control={control}
            name="tipoCombustible"
            render={({ field }) => (
              <Select
                name={field.name}
                label="Combustible"
                withLabel
                value={field.value}
                onChange={(id, val, name) => field.onChange(id)}
                options={[
                  { id: 'GASOLINA', value: 'Gasolina' },
                  { id: 'DIESEL', value: 'Diésel' },
                  { id: 'GNV', value: 'GNV' },
                  { id: 'GLP', value: 'GLP' },
                  { id: 'ELECTRICO', value: 'Eléctrico' },
                ]}
                error={errors.tipoCombustible?.message as string}
              />
            )}
          />
        </div>

        <div className="p-4 bg-gray-50 dark:bg-slate-900/50 rounded-xl border border-gray-100 dark:border-slate-800/60 mt-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
            <Icon icon="solar:box-minimalistic-bold-duotone" className="text-violet-500" width={18}/>
            Capacidad de Carga
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Controller
      control={control}
      name="capacidadCargaKg"
      
      render={({ field }) => (
        <InputPro
          name={field.name}
          value={field.value}
          onChange={field.onChange}
          label="Peso Máximo (Kg)" type="number"
          error={errors.capacidadCargaKg?.message as string}
          isLabel
        />
      )}
    />
            <Controller
      control={control}
      name="capacidadVolumenM3"
      
      render={({ field }) => (
        <InputPro
          name={field.name}
          value={field.value}
          onChange={field.onChange}
          label="Volumen (m³)" type="number" step="0.01"
          error={errors.capacidadVolumenM3?.message as string}
          isLabel
        />
      )}
    />
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800 mt-4">
          <Button type="button" color="light" onClick={onClose}>Cancelar</Button>
          <Button type="submit" color="primary">Guardar Vehículo</Button>
        </div>
      </form>
    </Modal>
  );
}
