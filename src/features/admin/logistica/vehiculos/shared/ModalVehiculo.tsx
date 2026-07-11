import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Icon } from '@iconify/react';
import Button from '@/components/Button';
import InputPro from '@/components/InputPro';
import Select from '@/components/Select';
import Modal from '@/components/Modal';
import { IVehiculo, ITipoVehiculo, ESTADOS_VEHICULO, TIPOS_COMBUSTIBLE } from '../VehiculosModel';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  vehiculo: IVehiculo | null;
  tiposVehiculo: ITipoVehiculo[];
  onCreateTipo: (data: { nombre: string; capacidadPesoKg: number; capacidadVolumenM3: number }) => Promise<ITipoVehiculo | null>;
}

export default function ModalVehiculo({ isOpen, onClose, onSubmit, vehiculo, tiposVehiculo, onCreateTipo }: Props) {
  const { handleSubmit, reset, control, setValue, formState: { errors } } = useForm();
  const [showNewTipo, setShowNewTipo] = useState(false);
  const [nuevoTipo, setNuevoTipo] = useState({ nombre: '', capacidadPesoKg: '', capacidadVolumenM3: '' });

  useEffect(() => {
    if (isOpen) {
      setShowNewTipo(false);
      setNuevoTipo({ nombre: '', capacidadPesoKg: '', capacidadVolumenM3: '' });
      reset({
        placa: vehiculo?.placa || '',
        marca: vehiculo?.marca || '',
        modelo: vehiculo?.modelo || '',
        tipoVehiculoId: vehiculo?.tipoVehiculoId ? String(vehiculo.tipoVehiculoId) : '',
        anio: vehiculo?.anio || '',
        estado: vehiculo?.estado || 'DISPONIBLE',
        capacidadPesoKg: vehiculo?.capacidadPesoKg || '',
        capacidadVolumenM3: vehiculo?.capacidadVolumenM3 || '',
        tipoCombustible: vehiculo?.tipoCombustible || 'GASOLINA',
        tieneRefrigeracion: vehiculo?.tieneRefrigeracion ? 'true' : 'false',
        tieneGPSIntegrado: vehiculo?.tieneGPSIntegrado ? 'true' : 'false',
      });
    }
  }, [isOpen, vehiculo, reset]);

  if (!isOpen) return null;

  const handleFormSubmit = (data: any) => {
    onSubmit({
      placa: data.placa,
      marca: data.marca,
      modelo: data.modelo || undefined,
      tipoVehiculoId: data.tipoVehiculoId ? Number(data.tipoVehiculoId) : undefined,
      anio: data.anio ? Number(data.anio) : undefined,
      estado: data.estado,
      capacidadPesoKg: data.capacidadPesoKg !== '' ? Number(data.capacidadPesoKg) : undefined,
      capacidadVolumenM3: data.capacidadVolumenM3 !== '' ? Number(data.capacidadVolumenM3) : undefined,
      tipoCombustible: data.tipoCombustible,
      tieneRefrigeracion: data.tieneRefrigeracion === 'true',
      tieneGPSIntegrado: data.tieneGPSIntegrado === 'true',
    });
  };

  const handleGuardarTipo = async () => {
    if (!nuevoTipo.nombre) return;
    const creado = await onCreateTipo({
      nombre: nuevoTipo.nombre,
      capacidadPesoKg: Number(nuevoTipo.capacidadPesoKg) || 0,
      capacidadVolumenM3: Number(nuevoTipo.capacidadVolumenM3) || 0,
    });
    if (creado) {
      setValue('tipoVehiculoId', String(creado.id));
      setShowNewTipo(false);
      setNuevoTipo({ nombre: '', capacidadPesoKg: '', capacidadVolumenM3: '' });
    }
  };

  return (
    <Modal
      isOpenModal={isOpen}
      closeModal={onClose}
      title={vehiculo ? 'Editar Vehículo' : 'Nuevo Vehículo'}
      width="650px"
      icon="solar:bus-bold-duotone"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="p-5 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Controller
            control={control}
            name="placa"
            rules={{ required: 'Requerido' }}
            render={({ field }) => (
              <InputPro name={field.name} value={field.value} onChange={field.onChange} label="Placa" error={errors.placa?.message as string} isLabel />
            )}
          />
          <div>
            <Controller
              control={control}
              name="tipoVehiculoId"
              rules={{ required: 'Requerido' }}
              render={({ field }) => (
                <Select
                  name={field.name}
                  label="Tipo de Vehículo"
                  withLabel
                  value={field.value}
                  onChange={(id) => field.onChange(id)}
                  options={[
                    { id: '', value: 'Seleccione...' },
                    ...tiposVehiculo.map(t => ({ id: String(t.id), value: t.nombre }))
                  ]}
                  error={errors.tipoVehiculoId?.message as string}
                />
              )}
            />
            <button type="button" onClick={() => setShowNewTipo(v => !v)} className="text-xs text-violet-600 dark:text-violet-400 font-semibold mt-1 ml-1 flex items-center gap-1">
              <Icon icon="solar:add-circle-bold" width={13} /> Crear tipo
            </button>
          </div>
        </div>

        {showNewTipo && (
          <div className="p-3 bg-violet-50 dark:bg-violet-900/10 rounded-xl border border-violet-100 dark:border-violet-900/40 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <InputPro name="nuevoTipoNombre" value={nuevoTipo.nombre} onChange={(e: any) => setNuevoTipo(p => ({ ...p, nombre: e.target.value }))} label="Nombre" isLabel />
              <InputPro name="nuevoTipoPeso" value={nuevoTipo.capacidadPesoKg} onChange={(e: any) => setNuevoTipo(p => ({ ...p, capacidadPesoKg: e.target.value }))} label="Peso Kg" type="number" isLabel />
              <InputPro name="nuevoTipoVol" value={nuevoTipo.capacidadVolumenM3} onChange={(e: any) => setNuevoTipo(p => ({ ...p, capacidadVolumenM3: e.target.value }))} label="Volumen m³" type="number" step="0.01" isLabel />
            </div>
            <div className="flex justify-end">
              <Button type="button" color="primary" onClick={handleGuardarTipo}>Guardar Tipo</Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Controller
            control={control}
            name="marca"
            rules={{ required: 'Requerido' }}
            render={({ field }) => (
              <InputPro name={field.name} value={field.value} onChange={field.onChange} label="Marca" error={errors.marca?.message as string} isLabel />
            )}
          />
          <Controller
            control={control}
            name="modelo"
            render={({ field }) => (
              <InputPro name={field.name} value={field.value} onChange={field.onChange} label="Modelo" error={errors.modelo?.message as string} isLabel />
            )}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Controller
            control={control}
            name="anio"
            render={({ field }) => (
              <InputPro name={field.name} value={field.value} onChange={field.onChange} label="Año" type="number" error={errors.anio?.message as string} isLabel />
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
                onChange={(id) => field.onChange(id)}
                options={TIPOS_COMBUSTIBLE.map(t => ({ id: t.value, value: t.label }))}
                error={errors.tipoCombustible?.message as string}
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
                options={ESTADOS_VEHICULO.map(e => ({ id: e.value, value: e.label }))}
                error={errors.estado?.message as string}
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
              name="capacidadPesoKg"
              rules={{ required: 'Requerido' }}
              render={({ field }) => (
                <InputPro name={field.name} value={field.value} onChange={field.onChange} label="Peso Máximo (Kg)" type="number" error={errors.capacidadPesoKg?.message as string} isLabel />
              )}
            />
            <Controller
              control={control}
              name="capacidadVolumenM3"
              rules={{ required: 'Requerido' }}
              render={({ field }) => (
                <InputPro name={field.name} value={field.value} onChange={field.onChange} label="Volumen (m³)" type="number" step="0.01" error={errors.capacidadVolumenM3?.message as string} isLabel />
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <Controller
              control={control}
              name="tieneRefrigeracion"
              render={({ field }) => (
                <Select
                  name={field.name}
                  label="¿Refrigeración?"
                  withLabel
                  value={field.value}
                  onChange={(id) => field.onChange(id)}
                  options={[{ id: 'false', value: 'No' }, { id: 'true', value: 'Sí' }]}
                  error={null}
                />
              )}
            />
            <Controller
              control={control}
              name="tieneGPSIntegrado"
              render={({ field }) => (
                <Select
                  name={field.name}
                  label="¿GPS Integrado?"
                  withLabel
                  value={field.value}
                  onChange={(id) => field.onChange(id)}
                  options={[{ id: 'false', value: 'No' }, { id: 'true', value: 'Sí' }]}
                  error={null}
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
