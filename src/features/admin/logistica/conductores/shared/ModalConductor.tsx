import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import Button from '@/components/Button';
import InputPro from '@/components/InputPro';
import Select from '@/components/Select';
import { Calendar as DateComponent } from '@/components/Date';
import Modal from '@/components/Modal';
import { IConductor, TIPOS_LICENCIA, TIPOS_EMPLEO } from '../ConductoresModel';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  conductor: IConductor | null;
}

export default function ModalConductor({ isOpen, onClose, onSubmit, conductor }: Props) {
  const { handleSubmit, reset, control, formState: { errors } } = useForm();

  useEffect(() => {
    if (isOpen) {
      reset({
        nombre: conductor?.nombre || '',
        apellido: conductor?.apellido || '',
        dni: conductor?.dni || '',
        celular: conductor?.celular || '',
        email: conductor?.email || '',
        nroLicencia: conductor?.nroLicencia || '',
        tipoLicencia: conductor?.tipoLicencia || '',
        vencimientoLicencia: conductor?.vencimientoLicencia || '',
        tipoEmpleo: conductor?.tipoEmpleo || 'PLANILLA',
      });
    }
  }, [isOpen, conductor, reset]);

  if (!isOpen) return null;

  const handleFormSubmit = (data: any) => {
    onSubmit({
      nombre: data.nombre,
      apellido: data.apellido,
      dni: data.dni || undefined,
      celular: data.celular || undefined,
      email: data.email || undefined,
      nroLicencia: data.nroLicencia || undefined,
      tipoLicencia: data.tipoLicencia || undefined,
      vencimientoLicencia: data.vencimientoLicencia ? new Date(data.vencimientoLicencia).toISOString() : undefined,
      tipoEmpleo: data.tipoEmpleo || undefined,
    });
  };

  return (
    <Modal
      isOpenModal={isOpen}
      closeModal={onClose}
      title={conductor ? 'Editar Conductor' : 'Nuevo Conductor'}
      width="600px"
      icon="solar:user-id-bold-duotone"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="p-5 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Controller
            control={control}
            name="nombre"
            rules={{ required: 'Requerido' }}
            render={({ field }) => (
              <InputPro name={field.name} value={field.value} onChange={field.onChange} label="Nombres" error={errors.nombre?.message as string} isLabel />
            )}
          />
          <Controller
            control={control}
            name="apellido"
            rules={{ required: 'Requerido' }}
            render={({ field }) => (
              <InputPro name={field.name} value={field.value} onChange={field.onChange} label="Apellidos" error={errors.apellido?.message as string} isLabel />
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Controller
            control={control}
            name="dni"
            render={({ field }) => (
              <InputPro name={field.name} value={field.value} onChange={field.onChange} label="DNI" error={errors.dni?.message as string} isLabel />
            )}
          />
          <Controller
            control={control}
            name="celular"
            render={({ field }) => (
              <InputPro name={field.name} value={field.value} onChange={field.onChange} label="Celular" error={errors.celular?.message as string} isLabel />
            )}
          />
        </div>

        <Controller
          control={control}
          name="email"
          render={({ field }) => (
            <InputPro name={field.name} value={field.value} onChange={field.onChange} label="Correo Electrónico (opc)" type="email" error={errors.email?.message as string} isLabel />
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <Controller
            control={control}
            name="nroLicencia"
            render={({ field }) => (
              <InputPro name={field.name} value={field.value} onChange={field.onChange} label="Nro Licencia (opc)" error={errors.nroLicencia?.message as string} isLabel />
            )}
          />
          <Controller
            control={control}
            name="tipoLicencia"
            render={({ field }) => (
              <Select
                name={field.name}
                label="Tipo Licencia"
                withLabel
                value={field.value}
                onChange={(id) => field.onChange(id)}
                options={[{ id: '', value: 'Sin definir' }, ...TIPOS_LICENCIA.map(t => ({ id: t.value, value: t.label }))]}
                error={errors.tipoLicencia?.message as string}
              />
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Controller
            control={control}
            name="vencimientoLicencia"
            render={({ field }) => (
              <DateComponent text="Vencimiento Licencia (opc)" value={field.value} isLabel onChange={(date: any) => field.onChange(date)} />
            )}
          />
          <Controller
            control={control}
            name="tipoEmpleo"
            render={({ field }) => (
              <Select
                name={field.name}
                label="Tipo de Empleo"
                withLabel
                value={field.value}
                onChange={(id) => field.onChange(id)}
                options={TIPOS_EMPLEO.map(t => ({ id: t.value, value: t.label }))}
                error={errors.tipoEmpleo?.message as string}
              />
            )}
          />
        </div>

        <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800 mt-4">
          <Button type="button" color="light" onClick={onClose}>Cancelar</Button>
          <Button type="submit" color="primary">Guardar Conductor</Button>
        </div>
      </form>
    </Modal>
  );
}
