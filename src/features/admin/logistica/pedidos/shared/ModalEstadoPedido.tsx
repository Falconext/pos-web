import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Icon } from '@iconify/react';
import Button from '@/components/Button';
import Select from '@/components/Select';
import Modal from '@/components/Modal';
import { IPedidoLogistica, ESTADOS_PEDIDO } from '../PedidosModel';
import { Controller } from 'react-hook-form';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { estado: string; motivo?: string; notas?: string }) => void;
  pedido: IPedidoLogistica | null;
}

export default function ModalEstadoPedido({ isOpen, onClose, onSubmit, pedido }: Props) {
  const { register, handleSubmit, watch, reset, control } = useForm();
  
  const estadoSeleccionado = watch('estado');

  useEffect(() => {
    if (isOpen && pedido) {
      reset({
        estado: pedido.estado,
        motivo: '',
        notas: ''
      });
    }
  }, [isOpen, pedido, reset]);

  if (!isOpen || !pedido) return null;

  return (
    <Modal
      isOpenModal={isOpen}
      closeModal={onClose}
      title="Actualizar Estado del Pedido"
      width="450px"
      icon="solar:box-minimalistic-bold-duotone"
    >
      <form onSubmit={handleSubmit((data: any) => onSubmit(data))} className="p-5 space-y-5">
        <p className="text-sm text-gray-500 mb-2 ml-1">Pedido: <strong className="text-gray-900 dark:text-white">{pedido.codigo}</strong></p>

        <Controller
          control={control}
          name="estado"
          rules={{ required: true }}
          render={({ field }) => (
            <Select
              name={field.name}
              label="Nuevo Estado"
              withLabel
              value={field.value}
              onChange={(id, val, name) => field.onChange(id)}
              options={ESTADOS_PEDIDO.map(est => ({ id: est.value, value: est.label }))}
              error={null}
            />
          )}
        />

        {estadoSeleccionado === 'FALLIDO' && (
          <Controller
            control={control}
            name="motivo"
            render={({ field }) => (
              <Select
                name={field.name}
                label="Motivo de Fallo"
                withLabel
                value={field.value}
                onChange={(id, val, name) => field.onChange(id)}
                options={[
                  { id: 'CLIENTE_AUSENTE', value: 'Cliente Ausente' },
                  { id: 'DIRECCION_INCORRECTA', value: 'Dirección Incorrecta' },
                  { id: 'RECHAZADO', value: 'Rechazado por el Cliente' },
                  { id: 'VEHICULO_AVERIADO', value: 'Vehículo Averiado / Accidente' },
                  { id: 'OTROS', value: 'Otros' },
                ]}
                error={null}
              />
            )}
          />
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 ml-1">Notas de actualización</label>
          <textarea 
            {...register('notas')}
            rows={3}
            className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-violet-500 outline-none transition-all"
            placeholder="Añade un comentario sobre este cambio..."
          ></textarea>
        </div>

        <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800 mt-4">
          <Button type="button" color="light" onClick={onClose}>Cancelar</Button>
          <Button type="submit" color={estadoSeleccionado === 'FALLIDO' ? 'danger' : 'primary'}>Confirmar Cambio</Button>
        </div>
      </form>
    </Modal>
  );
}
