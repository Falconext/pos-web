import { useState } from 'react';
import { Icon } from '@iconify/react';
import Button from '@/components/Button';
import ModalConfirm from '@/components/ModalConfirm';
import { cn } from '@/utils';
import { useIntegracionesViewModel } from './useIntegracionesViewModel';
import { EVENT_LABELS, type IApiKey, type IWebhook } from './IntegracionesModel';
import ModalCrearApiKey from './shared/ModalCrearApiKey';
import ModalCrearWebhook from './shared/ModalCrearWebhook';
import ModalRevelarSecreto from './shared/ModalRevelarSecreto';

const fmtDate = (iso: string | null): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
};

const fmtRelative = (iso: string | null): string => {
  if (!iso) return 'Nunca';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Nunca';
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'hace instantes';
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const days = Math.floor(h / 24);
  if (days < 30) return `hace ${days} d`;
  return fmtDate(iso);
};

function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <span className="w-7 h-7 border-[3px] border-violet-500 border-b-transparent rounded-full inline-block animate-spin" />
    </div>
  );
}

/** Valor copiable en un click (URL base, comando de instalación, etc.). */
function CopyRow({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <button
      type="button"
      onClick={copy}
      title="Copiar"
      className="group flex items-center gap-2 w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/60 px-3 py-2 text-left transition-colors hover:border-violet-400 dark:hover:border-violet-500"
    >
      <span className="flex-1 truncate font-mono text-xs text-gray-700 dark:text-gray-200">{value}</span>
      <Icon
        icon={copied ? 'solar:check-circle-bold' : 'solar:copy-bold-duotone'}
        className={cn('text-base shrink-0', copied ? 'text-emerald-500' : 'text-gray-400 group-hover:text-violet-500')}
      />
    </button>
  );
}

/** Card de arranque rápido: todo lo que el integrador (p. ej. Bata) necesita. */
function Quickstart() {
  return (
    <section className="mb-6 rounded-2xl border border-violet-200 dark:border-violet-900/50 bg-gradient-to-br from-violet-50 to-white dark:from-violet-900/20 dark:to-[#111827] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Icon icon="solar:rocket-2-bold-duotone" className="text-xl text-violet-600 dark:text-violet-400" />
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Conecta tu sistema en minutos</h2>
        </div>
        <a
          href="https://developers.falconext.pe"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline"
        >
          Ver documentación completa
          <Icon icon="solar:arrow-right-up-linear" className="text-sm" />
        </a>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <p className="text-[0.7rem] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5">
            1 · Genera tu API key
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-300">
            Abajo. Usa <b>test</b> para probar sin efectos reales y <b>live</b> para producción. La clave se muestra una sola vez.
          </p>
        </div>
        <div>
          <p className="text-[0.7rem] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5">
            2 · URL base de la API
          </p>
          <CopyRow value="https://api.falconext.pe/api/v1/logistics" />
          <p className="text-[0.7rem] text-gray-500 dark:text-gray-400 mt-1.5">
            Autentica con <code className="font-mono">Authorization: Bearer TU_API_KEY</code>
          </p>
        </div>
        <div>
          <p className="text-[0.7rem] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5">
            3 · SDK oficial (opcional)
          </p>
          <div className="space-y-1.5">
            <CopyRow value="npm install @falconext/logistica" />
            <CopyRow value="pip install falconext-logistica" />
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        <Icon icon="solar:info-circle-bold-duotone" className="inline text-sm text-violet-500 mr-1 -mt-0.5" />
        Para dar acceso a un integrador (tu cliente, ERP externo, etc.): genera una API key con un nombre que lo identifique, y compártele esa key + la URL base + el link de documentación.
      </p>
    </section>
  );
}

function EmptyState({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-3">
        <Icon icon={icon} className="text-3xl text-gray-400" />
      </div>
      <p className="text-sm font-bold text-gray-700 dark:text-gray-200">{title}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm">{subtitle}</p>
    </div>
  );
}

export default function IntegracionesView() {
  const vm = useIntegracionesViewModel();

  return (
    <div className="min-h-screen px-2 pb-10 dark:bg-[#0A0D14]">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Integraciones API</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Genera credenciales y configura webhooks para conectar Falconext Logística con tus sistemas.
        </p>
      </div>

      {/* ── Quickstart / onboarding ── */}
      <Quickstart />

      {/* ── Sección API Keys ── */}
      <section className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
              <Icon icon="solar:key-bold-duotone" className="text-2xl" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">API Keys</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Credenciales para autenticar tus peticiones a la API.</p>
            </div>
          </div>
          <Button color="secondary" onClick={vm.actions.openKeyModal} className="!bg-violet-600 border-none shadow-md shadow-violet-200/50 dark:shadow-none flex items-center gap-2">
            <Icon icon="solar:add-circle-bold" className="text-lg" />
            Generar API key
          </Button>
        </div>

        {vm.loadingKeys ? (
          <Spinner />
        ) : vm.apiKeys.length === 0 ? (
          <EmptyState
            icon="solar:key-minimalistic-square-bold-duotone"
            title="Aún no tienes API keys"
            subtitle="Genera tu primera key para empezar a autenticar peticiones desde tus sistemas externos."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-gray-400 border-b border-gray-100 dark:border-slate-800">
                  <th className="px-5 py-3 font-semibold">Nombre</th>
                  <th className="px-5 py-3 font-semibold">Key</th>
                  <th className="px-5 py-3 font-semibold">Entorno</th>
                  <th className="px-5 py-3 font-semibold">Último uso</th>
                  <th className="px-5 py-3 font-semibold">Creada</th>
                  <th className="px-5 py-3 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-800/60">
                {vm.apiKeys.map((k: IApiKey) => (
                  <tr key={k.id} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/30">
                    <td className="px-5 py-3.5">
                      <span className="font-semibold text-gray-900 dark:text-white">{k.nombre || 'Sin nombre'}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <code className="font-mono text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                        {k.prefijo}…{k.ultimosCuatro}
                      </code>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={cn(
                          'px-2.5 py-1 text-xs font-semibold rounded-full border',
                          k.entorno === 'live'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
                        )}
                      >
                        {k.entorno === 'live' ? 'Producción' : 'Pruebas'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 dark:text-gray-400">{fmtRelative(k.ultimoUsoEn)}</td>
                    <td className="px-5 py-3.5 text-gray-600 dark:text-gray-400">{fmtDate(k.creadoEn)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => vm.actions.requestDeleteApiKey(k)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 px-2.5 py-1.5 rounded-lg transition-colors"
                      >
                        <Icon icon="solar:shield-cross-bold-duotone" className="text-base" />
                        Revocar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Sección Webhooks ── */}
      <section className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
              <Icon icon="solar:link-bold-duotone" className="text-2xl" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Webhooks</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Recibe notificaciones en tiempo real de eventos logísticos.</p>
            </div>
          </div>
          <Button color="secondary" onClick={vm.actions.openHookModal} className="!bg-violet-600 border-none shadow-md shadow-violet-200/50 dark:shadow-none flex items-center gap-2">
            <Icon icon="solar:add-circle-bold" className="text-lg" />
            Registrar endpoint
          </Button>
        </div>

        {vm.loadingHooks ? (
          <Spinner />
        ) : vm.webhooks.length === 0 ? (
          <EmptyState
            icon="solar:link-broken-bold-duotone"
            title="No hay webhooks configurados"
            subtitle="Registra un endpoint para recibir actualizaciones de tus pedidos en tiempo real."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-gray-400 border-b border-gray-100 dark:border-slate-800">
                  <th className="px-5 py-3 font-semibold">Endpoint</th>
                  <th className="px-5 py-3 font-semibold">Eventos</th>
                  <th className="px-5 py-3 font-semibold">Estado</th>
                  <th className="px-5 py-3 font-semibold">Último envío</th>
                  <th className="px-5 py-3 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-800/60">
                {vm.webhooks.map((w: IWebhook) => (
                  <tr key={w.id} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/30 align-top">
                    <td className="px-5 py-3.5 max-w-xs">
                      <code className="font-mono text-xs text-gray-700 dark:text-gray-200 break-all">{w.url}</code>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1.5 max-w-sm">
                        {w.events.map((e) => (
                          <span
                            key={e}
                            className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 border border-violet-100 dark:border-violet-900/40"
                          >
                            {EVENT_LABELS[e] || e}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border',
                          w.activo
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                            : 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-gray-400 border-gray-200 dark:border-slate-700',
                        )}
                      >
                        <span className={cn('w-1.5 h-1.5 rounded-full', w.activo ? 'bg-emerald-500' : 'bg-gray-400')} />
                        {w.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 dark:text-gray-400">{fmtRelative(w.ultimoEnvioEn)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => vm.actions.requestDeleteWebhook(w)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 px-2.5 py-1.5 rounded-lg transition-colors"
                      >
                        <Icon icon="solar:trash-bin-trash-bold-duotone" className="text-base" />
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modales */}
      <ModalCrearApiKey
        isOpen={vm.isKeyModalOpen}
        creating={vm.creating}
        onClose={vm.actions.closeKeyModal}
        onSubmit={vm.actions.handleCreateApiKey}
      />
      <ModalCrearWebhook
        isOpen={vm.isHookModalOpen}
        creating={vm.creating}
        onClose={vm.actions.closeHookModal}
        onSubmit={vm.actions.handleCreateWebhook}
      />
      <ModalRevelarSecreto
        isOpen={!!vm.reveal}
        onClose={vm.actions.closeReveal}
        kind={vm.reveal?.kind ?? 'apiKey'}
        secret={
          vm.reveal?.kind === 'apiKey'
            ? vm.reveal.data.apiKey
            : vm.reveal?.kind === 'webhook'
            ? vm.reveal.data.secret
            : ''
        }
      />
      <ModalConfirm
        isOpenModal={!!vm.pendingDelete}
        setIsOpenModal={(v) => !v && vm.actions.cancelDelete()}
        confirmSubmit={vm.actions.confirmDelete}
        title={vm.pendingDelete?.kind === 'apiKey' ? 'Revocar API key' : 'Eliminar webhook'}
        information={
          vm.pendingDelete?.kind === 'apiKey'
            ? `¿Seguro que deseas revocar "${vm.pendingDelete?.label}"? Las peticiones que la usen dejarán de funcionar de inmediato.`
            : `¿Seguro que deseas eliminar el webhook "${vm.pendingDelete?.label}"? Dejarás de recibir notificaciones en ese endpoint.`
        }
        confirmText={vm.pendingDelete?.kind === 'apiKey' ? 'Revocar' : 'Eliminar'}
        confirmLoading={vm.deleting}
      />
    </div>
  );
}
