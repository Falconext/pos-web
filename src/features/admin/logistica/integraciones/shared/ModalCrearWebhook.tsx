import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import InputPro from '@/components/InputPro';
import { cn } from '@/utils';
import { WEBHOOK_EVENTS } from '../IntegracionesModel';

interface Props {
  isOpen: boolean;
  creating: boolean;
  onClose: () => void;
  onSubmit: (data: { url: string; events: string[] }) => void;
}

const isValidHttpUrl = (value: string): boolean => {
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
};

export default function ModalCrearWebhook({ isOpen, creating, onClose, onSubmit }: Props) {
  const [url, setUrl] = useState('');
  const [events, setEvents] = useState<string[]>([]);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setUrl('');
      setEvents([]);
      setTouched(false);
    }
  }, [isOpen]);

  const urlError = touched && !isValidHttpUrl(url) ? 'Ingresa una URL http/https válida' : '';
  const eventsError = touched && events.length === 0 ? 'Selecciona al menos un evento' : '';

  const toggleEvent = (value: string) =>
    setEvents((prev) => (prev.includes(value) ? prev.filter((e) => e !== value) : [...prev, value]));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!isValidHttpUrl(url) || events.length === 0) return;
    onSubmit({ url: url.trim(), events });
  };

  const allSelected = events.length === WEBHOOK_EVENTS.length;

  return (
    <Modal
      isOpenModal={isOpen}
      closeModal={onClose}
      title="Registrar webhook"
      width="560px"
      icon="solar:link-bold-duotone"
      iconClass="bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400"
    >
      <form onSubmit={handleSubmit} className="p-5 space-y-5">
        <InputPro
          name="url"
          type="text"
          label="URL del endpoint"
          isLabel
          value={url}
          placeholder="https://tu-servidor.com/webhooks/falconext"
          onChange={(e) => setUrl(e.target.value)}
          handleOnBlur={() => setTouched(true)}
          error={urlError}
        />

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Eventos a suscribir
            </label>
            <button
              type="button"
              onClick={() => setEvents(allSelected ? [] : WEBHOOK_EVENTS.map((e) => e.value))}
              className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline"
            >
              {allSelected ? 'Quitar todos' : 'Seleccionar todos'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {WEBHOOK_EVENTS.map((evt) => {
              const active = events.includes(evt.value);
              return (
                <button
                  key={evt.value}
                  type="button"
                  onClick={() => toggleEvent(evt.value)}
                  className={cn(
                    'flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all',
                    active
                      ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 ring-1 ring-violet-500/30'
                      : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600',
                  )}
                >
                  <Icon icon={evt.icon} className={cn('text-lg shrink-0', evt.color)} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{evt.label}</p>
                    <p className="text-[11px] font-mono text-gray-400 truncate">{evt.value}</p>
                  </div>
                  <span
                    className={cn(
                      'w-4 h-4 rounded-md border flex items-center justify-center shrink-0',
                      active ? 'bg-violet-600 border-violet-600' : 'border-gray-300 dark:border-slate-600',
                    )}
                  >
                    {active && <Icon icon="solar:check-read-linear" className="text-white text-xs" />}
                  </span>
                </button>
              );
            })}
          </div>
          {eventsError && <p className="text-[#D35130] font-bold text-sm mt-1.5">{eventsError}</p>}
        </div>

        <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-slate-800">
          <Button type="button" color="light" onClick={onClose} disabled={creating}>
            Cancelar
          </Button>
          <Button type="submit" color="secondary" isLoading={creating} className="!bg-violet-600 border-none">
            Registrar webhook
          </Button>
        </div>
      </form>
    </Modal>
  );
}
