import React from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { Icon } from '@iconify/react';
import Button from '@/components/Button';
import InputPro from '@/components/InputPro';
import Select from '@/components/Select';
import { Calendar as DateComponent } from '@/components/Date';
import Modal from '@/components/Modal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  clientes: any[];
}

export default function ModalPedido({ isOpen, onClose, onSubmit, clientes }: Props) {
  const { register, handleSubmit, control, watch, formState: { errors } } = useForm({
    defaultValues: {
      clienteId: '',
      direccionEntregaId: '',
      nroOrdenExterna: '',
      fechaSolicitada: '',
      ventanaInicio: '',
      ventanaFin: '',
      prioridad: 'MEDIA',
      cobroContraEntrega: 'false',
      requiereFirma: 'false',
      requiereFoto: 'false',
      notasInternas: '',
      items: [{ descripcion: '', cantidad: 1, pesoUnitarioKg: '', volumenUnitarioM3: '' }] as any[]
    }
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const clienteIdSel = watch('clienteId');
  const clienteSel = clientes.find(c => String(c.id) === String(clienteIdSel));
  const direcciones: any[] = clienteSel?.direcciones || [];

  if (!isOpen) return null;

  const handleFormSubmit = (data: any) => {
    onSubmit({
      clienteId: data.clienteId ? Number(data.clienteId) : undefined,
      direccionEntregaId: data.direccionEntregaId ? Number(data.direccionEntregaId) : undefined,
      nroOrdenExterna: data.nroOrdenExterna || undefined,
      fechaSolicitada: data.fechaSolicitada || undefined,
      ventanaInicio: data.ventanaInicio || undefined,
      ventanaFin: data.ventanaFin || undefined,
      prioridad: data.prioridad,
      cobroContraEntrega: data.cobroContraEntrega === 'true',
      requiereFirma: data.requiereFirma === 'true',
      requiereFoto: data.requiereFoto === 'true',
      notasInternas: data.notasInternas || undefined,
      items: (data.items || []).map((it: any) => ({
        sku: it.sku || undefined,
        descripcion: it.descripcion,
        cantidad: Number(it.cantidad) || 1,
        pesoUnitarioKg: it.pesoUnitarioKg !== '' ? Number(it.pesoUnitarioKg) : undefined,
        volumenUnitarioM3: it.volumenUnitarioM3 !== '' ? Number(it.volumenUnitarioM3) : undefined,
        valorDeclarado: it.valorDeclarado !== '' && it.valorDeclarado != null ? Number(it.valorDeclarado) : undefined,
      })),
    });
  };

  return (
    <Modal
      isOpenModal={isOpen}
      closeModal={onClose}
      title="Nuevo Pedido Logístico"
      width="800px"
      icon="solar:box-bold-duotone"
    >
      <form id="form-pedido" onSubmit={handleSubmit(handleFormSubmit)} className="p-5 space-y-6">

        {/* Destino */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-2">
            <Icon icon="solar:map-point-bold-duotone" width={18}/> Destino y Cliente
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <Controller
              control={control}
              name="clienteId"
              rules={{ required: 'Seleccione un cliente' }}
              render={({ field }) => (
                <Select
                  name={field.name}
                  label="Cliente / Destinatario"
                  withLabel
                  value={field.value}
                  onChange={(id) => field.onChange(id)}
                  options={[
                    { id: '', value: 'Seleccione...' },
                    ...clientes.map(c => ({ id: String(c.id), value: `${c.nroDocumento || ''} ${c.nombre}`.trim() }))
                  ]}
                  error={errors.clienteId?.message as string}
                />
              )}
            />
            <Controller
              control={control}
              name="direccionEntregaId"
              rules={{ required: 'Seleccione una dirección' }}
              render={({ field }) => (
                <Select
                  name={field.name}
                  label="Dirección de Entrega"
                  withLabel
                  value={field.value}
                  onChange={(id) => field.onChange(id)}
                  options={[
                    { id: '', value: direcciones.length ? 'Seleccione...' : 'Cliente sin direcciones' },
                    ...direcciones.map(d => ({ id: String(d.id), value: d.direccion || d.etiqueta || `Dirección ${d.id}` }))
                  ]}
                  error={errors.direccionEntregaId?.message as string}
                />
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Controller
              control={control}
              name="nroOrdenExterna"
              render={({ field }) => (
                <InputPro name={field.name} value={field.value} onChange={field.onChange} label="N° Orden Externa (opc)" isLabel />
              )}
            />
            <Controller
              control={control}
              name="prioridad"
              render={({ field }) => (
                <Select
                  name={field.name}
                  label="Prioridad"
                  withLabel
                  value={field.value}
                  onChange={(id) => field.onChange(id)}
                  options={[
                    { id: 'BAJA', value: 'Baja' },
                    { id: 'MEDIA', value: 'Media' },
                    { id: 'ALTA', value: 'Alta' },
                    { id: 'URGENTE', value: 'Urgente' },
                  ]}
                  error={errors.prioridad?.message as string}
                />
              )}
            />
          </div>
        </div>

        {/* Programación */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-2">
            <Icon icon="solar:calendar-date-bold-duotone" width={18}/> Programación
          </h3>

          <div className="grid grid-cols-3 gap-4">
            <Controller
              control={control}
              name="fechaSolicitada"
              render={({ field }) => (
                <DateComponent
                  text="Fecha Solicitada (opc)"
                  value={field.value}
                  isLabel
                  onChange={(date: any) => field.onChange(date)}
                />
              )}
            />
            <Controller
              control={control}
              name="ventanaInicio"
              render={({ field }) => (
                <InputPro name={field.name} value={field.value} onChange={field.onChange} label="Hora Inicio (opc)" type="time" isLabel />
              )}
            />
            <Controller
              control={control}
              name="ventanaFin"
              render={({ field }) => (
                <InputPro name={field.name} value={field.value} onChange={field.onChange} label="Hora Fin (opc)" type="time" isLabel />
              )}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Controller
              control={control}
              name="cobroContraEntrega"
              render={({ field }) => (
                <Select name={field.name} label="¿Cobro contra entrega?" withLabel value={field.value} onChange={(id) => field.onChange(id)} options={[{ id: 'false', value: 'No' }, { id: 'true', value: 'Sí' }]} error={null} />
              )}
            />
            <Controller
              control={control}
              name="requiereFirma"
              render={({ field }) => (
                <Select name={field.name} label="¿Requiere firma?" withLabel value={field.value} onChange={(id) => field.onChange(id)} options={[{ id: 'false', value: 'No' }, { id: 'true', value: 'Sí' }]} error={null} />
              )}
            />
            <Controller
              control={control}
              name="requiereFoto"
              render={({ field }) => (
                <Select name={field.name} label="¿Requiere foto?" withLabel value={field.value} onChange={(id) => field.onChange(id)} options={[{ id: 'false', value: 'No' }, { id: 'true', value: 'Sí' }]} error={null} />
              )}
            />
          </div>
        </div>

        {/* Items */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
            <h3 className="text-sm font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider flex items-center gap-2">
              <Icon icon="solar:box-bold-duotone" width={18}/> Ítems del Pedido
            </h3>
            <button type="button" onClick={() => append({ descripcion: '', cantidad: 1, pesoUnitarioKg: '', volumenUnitarioM3: '' })} className="text-xs text-violet-600 dark:text-violet-400 font-semibold flex items-center gap-1">
              <Icon icon="solar:add-circle-bold" width={15} /> Agregar ítem
            </button>
          </div>

          {fields.map((f, idx) => (
            <div key={f.id} className="grid grid-cols-12 gap-2 items-start">
              <div className="col-span-5">
                <InputPro
                  name={`items.${idx}.descripcion`}
                  label={idx === 0 ? 'Descripción' : undefined}
                  isLabel={idx === 0}
                  register={register(`items.${idx}.descripcion` as const, { required: true })}
                  error={(errors.items as any)?.[idx]?.descripcion ? 'Requerido' : undefined}
                />
              </div>
              <div className="col-span-2">
                <InputPro name={`items.${idx}.cantidad`} label={idx === 0 ? 'Cant.' : undefined} isLabel={idx === 0} type="number" register={register(`items.${idx}.cantidad` as const, { required: true })} />
              </div>
              <div className="col-span-2">
                <InputPro name={`items.${idx}.pesoUnitarioKg`} label={idx === 0 ? 'Peso Kg' : undefined} isLabel={idx === 0} type="number" step="0.01" register={register(`items.${idx}.pesoUnitarioKg` as const)} />
              </div>
              <div className="col-span-2">
                <InputPro name={`items.${idx}.volumenUnitarioM3`} label={idx === 0 ? 'Vol. m³' : undefined} isLabel={idx === 0} type="number" step="0.001" register={register(`items.${idx}.volumenUnitarioM3` as const)} />
              </div>
              <div className={`col-span-1 flex ${idx === 0 ? 'pt-7' : ''} justify-center`}>
                {fields.length > 1 && (
                  <button type="button" onClick={() => remove(idx)} className="text-rose-500 hover:text-rose-600">
                    <Icon icon="solar:trash-bin-trash-bold-duotone" width={20} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 ml-1">Notas Internas</label>
          <textarea
            {...register('notasInternas')}
            rows={2}
            className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-violet-500 transition-all outline-none"
            placeholder="Instrucciones de entrega, contacto, etc."
          ></textarea>
        </div>

        <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800 mt-4">
          <Button type="button" color="light" onClick={onClose}>Cancelar</Button>
          <Button type="submit" color="primary">Crear Pedido</Button>
        </div>
      </form>
    </Modal>
  );
}
