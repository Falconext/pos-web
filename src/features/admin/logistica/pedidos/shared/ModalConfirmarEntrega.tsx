import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Icon } from '@iconify/react';
import Button from '@/components/Button';
import InputPro from '@/components/InputPro';
import Select from '@/components/Select';
import Modal from '@/components/Modal';
import { IPedidoLogistica, METODOS_PAGO } from '../PedidosModel';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  pedido: IPedidoLogistica | null;
}

export default function ModalConfirmarEntrega({ isOpen, onClose, onSubmit, pedido }: Props) {
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm();

  useEffect(() => {
    if (isOpen) {
      reset({
        nombreReceptor: '',
        dniReceptor: '',
        parentesco: '',
        montoCobrado: '',
        metodoPago: 'EFECTIVO',
        firmaUrl: '',
        fotosUrls: '',
        notas: ''
      });
    }
  }, [isOpen, reset]);

  if (!isOpen || !pedido) return null;

  const handleFormSubmit = (data: any) => {
    onSubmit({
      nombreReceptor: data.nombreReceptor || undefined,
      dniReceptor: data.dniReceptor || undefined,
      parentesco: data.parentesco || undefined,
      montoCobrado: data.montoCobrado !== '' ? Number(data.montoCobrado) : undefined,
      metodoPago: data.metodoPago || undefined,
      firmaUrl: data.firmaUrl || undefined,
      fotosUrls: data.fotosUrls ? String(data.fotosUrls).split(',').map((s: string) => s.trim()).filter(Boolean) : undefined,
      notas: data.notas || undefined,
    });
  };

  return (
    <Modal
      isOpenModal={isOpen}
      closeModal={onClose}
      title="Confirmar Entrega (Prueba de Entrega)"
      width="520px"
      icon="solar:check-circle-bold-duotone"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="p-5 space-y-5">
        <p className="text-sm text-gray-500 mb-2 ml-1">Pedido: <strong className="text-gray-900 dark:text-white">{pedido.codigo}</strong></p>

        <div className="grid grid-cols-2 gap-4">
          <Controller
            control={control}
            name="nombreReceptor"
            render={({ field }) => (
              <InputPro name={field.name} value={field.value} onChange={field.onChange} label="Nombre del Receptor" error={errors.nombreReceptor?.message as string} isLabel />
            )}
          />
          <Controller
            control={control}
            name="dniReceptor"
            render={({ field }) => (
              <InputPro name={field.name} value={field.value} onChange={field.onChange} label="DNI del Receptor" error={errors.dniReceptor?.message as string} isLabel />
            )}
          />
        </div>

        <Controller
          control={control}
          name="parentesco"
          render={({ field }) => (
            <InputPro name={field.name} value={field.value} onChange={field.onChange} label="Parentesco / Relación (opc)" isLabel />
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <Controller
            control={control}
            name="montoCobrado"
            render={({ field }) => (
              <InputPro name={field.name} value={field.value} onChange={field.onChange} label="Monto Cobrado (opc)" type="number" step="0.01" isLabel />
            )}
          />
          <Controller
            control={control}
            name="metodoPago"
            render={({ field }) => (
              <Select
                name={field.name}
                label="Método de Pago"
                withLabel
                value={field.value}
                onChange={(id) => field.onChange(id)}
                options={METODOS_PAGO.map(m => ({ id: m.value, value: m.label }))}
                error={null}
              />
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Controller
            control={control}
            name="firmaUrl"
            render={({ field }) => (
              <InputPro name={field.name} value={field.value} onChange={field.onChange} label="URL Firma (opc)" isLabel />
            )}
          />
          <Controller
            control={control}
            name="fotosUrls"
            render={({ field }) => (
              <InputPro name={field.name} value={field.value} onChange={field.onChange} label="URLs Fotos (separadas por coma)" isLabel />
            )}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 ml-1">Notas de Entrega</label>
          <textarea
            {...register('notas')}
            rows={2}
            className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-violet-500 outline-none transition-all"
            placeholder="Observaciones de la entrega..."
          ></textarea>
        </div>

        <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800 mt-4">
          <Button type="button" color="light" onClick={onClose}>Cancelar</Button>
          <Button type="submit" color="primary">Confirmar Entrega</Button>
        </div>
      </form>
    </Modal>
  );
}
