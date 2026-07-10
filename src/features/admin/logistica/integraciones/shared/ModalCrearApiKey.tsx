import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import InputPro from '@/components/InputPro';
import { cn } from '@/utils';
import type { Entorno } from '../IntegracionesModel';

interface Props {
  isOpen: boolean;
  creating: boolean;
  onClose: () => void;
  onSubmit: (data: { nombre?: string; entorno: Entorno }) => void;
}

export default function ModalCrearApiKey({ isOpen, creating, onClose, onSubmit }: Props) {
  const [nombre, setNombre] = useState('');
  const [entorno, setEntorno] = useState<Entorno>('live');

  useEffect(() => {
    if (isOpen) {
      setNombre('');
      setEntorno('live');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ nombre: nombre.trim() || undefined, entorno });
  };

  return (
    <Modal
      isOpenModal={isOpen}
      closeModal={onClose}
      title="Generar API key"
      width="480px"
      icon="solar:key-bold-duotone"
      iconClass="bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400"
    >
      <form onSubmit={handleSubmit} className="p-5 space-y-5">
        <InputPro
          name="nombre"
          label="Nombre (opcional)"
          isLabel
          value={nombre}
          placeholder="Ej. Integración Drivin — producción"
          onChange={(e) => setNombre(e.target.value)}
        />

        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Entorno
          </label>
          <div className="grid grid-cols-2 gap-3">
            {([
              { id: 'live', title: 'Producción', desc: 'Datos y pedidos reales', icon: 'solar:bolt-bold-duotone' },
              { id: 'test', title: 'Pruebas', desc: 'Entorno sandbox', icon: 'solar:test-tube-bold-duotone' },
            ] as const).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setEntorno(opt.id)}
                className={cn(
                  'flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all',
                  entorno === opt.id
                    ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 ring-2 ring-violet-500/30'
                    : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600',
                )}
              >
                <Icon
                  icon={opt.icon}
                  className={cn('text-xl', entorno === opt.id ? 'text-violet-600 dark:text-violet-400' : 'text-gray-400')}
                />
                <span className="text-sm font-bold text-gray-900 dark:text-white">{opt.title}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-slate-800">
          <Button type="button" color="light" onClick={onClose} disabled={creating}>
            Cancelar
          </Button>
          <Button type="submit" color="secondary" isLoading={creating} className="!bg-violet-600 border-none">
            Generar key
          </Button>
        </div>
      </form>
    </Modal>
  );
}
