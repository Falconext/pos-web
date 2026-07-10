import { useState } from 'react';
import { Icon } from '@iconify/react';
import Modal from '@/components/Modal';
import Button from '@/components/Button';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** 'apiKey' → texto plano sk_... | 'webhook' → secret whsec_... */
  kind: 'apiKey' | 'webhook';
  secret: string;
  onCopied?: () => void;
}

export default function ModalRevelarSecreto({ isOpen, onClose, kind, secret, onCopied }: Props) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(secret);
    } catch {
      // fallback silencioso
    }
    setCopied(true);
    onCopied?.();
    setTimeout(() => setCopied(false), 2000);
  };

  const isKey = kind === 'apiKey';
  const title = isKey ? 'Tu nueva API key' : 'Secret del webhook';
  const label = isKey ? 'API key' : 'Signing secret';

  return (
    <Modal
      isOpenModal={isOpen}
      closeModal={onClose}
      title={title}
      width="560px"
      icon="solar:shield-keyhole-bold-duotone"
      iconClass="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
    >
      <div className="p-5 space-y-5">
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-900/20 p-3.5">
          <Icon icon="solar:danger-triangle-bold-duotone" className="text-xl text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            <span className="font-bold">Guárdala ahora.</span> Por seguridad no volveremos a mostrarte este valor.
            Si la pierdes, deberás generar {isKey ? 'una nueva key' : 'un nuevo webhook'}.
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
            {label}
          </label>
          <div className="flex items-stretch gap-2">
            <code className="flex-1 min-w-0 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 px-3 py-2.5 font-mono text-sm text-gray-800 dark:text-gray-100 break-all">
              {secret}
            </code>
            <button
              type="button"
              onClick={copy}
              className="shrink-0 flex items-center gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 px-3.5 text-sm font-semibold text-white transition-colors"
            >
              <Icon icon={copied ? 'solar:check-read-bold' : 'solar:copy-bold-duotone'} className="text-base" />
              {copied ? 'Copiado' : 'Copiar'}
            </button>
          </div>
        </div>

        <div className="pt-4 flex justify-end border-t border-gray-100 dark:border-slate-800">
          <Button type="button" color="secondary" onClick={onClose} className="!bg-violet-600 border-none">
            Entendido, la guardé
          </Button>
        </div>
      </div>
    </Modal>
  );
}
