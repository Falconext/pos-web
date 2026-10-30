import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { BRAND } from '@/lib/branding';
import { get, post } from '@/utils/fetch';
import useAlertStore from '@/zustand/alert';

/**
 * Cierre de la prueba gratis de IA de Ventas: elige plan y autoriza el débito
 * en Mercado Pago. Elegir solo cambia el plan; los días los compra el primer
 * cobro, así que quien elige y no paga se queda con el vencimiento de la prueba.
 */

type PlanVentas = { clave: string; nombre: string; costo: number; maxLeadsMes: number | null };

const ACCENT = BRAND.panelAccent || BRAND.primaryColor;

export default function ElegirPlanVentas({
  cobroAutomaticoDisponible,
  activarCobroAutomatico,
}: {
  cobroAutomaticoDisponible: boolean;
  activarCobroAutomatico: () => Promise<{ ok: boolean; mensaje?: string }>;
}) {
  const { alert } = useAlertStore();
  const [planes, setPlanes] = useState<PlanVentas[]>([]);
  const [elegido, setElegido] = useState<string>('pro');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    void get<{ sugerido: string; planes: PlanVentas[] }>('suscripcion/planes-ventas').then((r) => {
      if (!r.success || !r.data) return;
      setPlanes(r.data.planes);
      setElegido(r.data.sugerido);
    });
  }, []);

  const confirmar = async () => {
    setEnviando(true);
    try {
      const r = await post('suscripcion/elegir-plan-ventas', { plan: elegido });
      if (!r.success) {
        alert(r.error || 'No se pudo elegir el plan', 'error');
        return;
      }
      if (!cobroAutomaticoDisponible) {
        const plan = planes.find((p) => p.clave === elegido);
        window.open(
          `https://wa.me/${BRAND.whatsappCobranza || BRAND.whatsapp}?text=${encodeURIComponent(`Hola, terminé mi prueba y elegí el plan ${plan?.nombre ?? ''}. ¿Cómo pago?`)}`,
          '_blank',
          'noopener,noreferrer',
        );
        return;
      }
      // Se va a Mercado Pago; al volver, Mi plan muestra el cobro automático activo.
      const pago = await activarCobroAutomatico();
      if (!pago.ok) alert(pago.mensaje ?? 'No se pudo abrir Mercado Pago', 'error');
    } finally {
      setEnviando(false);
    }
  };

  if (!planes.length) return null;

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#111827]">
      <h2 className="text-lg font-black text-gray-900 dark:text-white">Elige tu plan</h2>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Todos incluyen facturación electrónica SUNAT y todas las funciones de la IA de Ventas. Cambian los leads al mes.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Planes">
        {planes.map((p) => {
          const activo = elegido === p.clave;
          return (
            <button
              key={p.clave}
              type="button"
              role="radio"
              aria-checked={activo}
              onClick={() => setElegido(p.clave)}
              className={`rounded-2xl border-2 p-4 text-left transition ${activo ? 'shadow-md' : 'border-gray-100 hover:border-gray-200 dark:border-slate-800 dark:hover:border-slate-700'}`}
              style={activo ? { borderColor: ACCENT } : undefined}
            >
              <span className="flex items-center justify-between">
                <span className="font-bold text-gray-900 dark:text-white">{p.nombre}</span>
                {activo && <Icon icon="solar:check-circle-bold" width={20} style={{ color: ACCENT }} aria-hidden="true" />}
              </span>
              <span className="mt-2 block text-2xl font-black text-gray-900 dark:text-white tabular-nums">
                S/ {p.costo}
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400"> /mes</span>
              </span>
              <span className="mt-1 block text-xs font-bold" style={{ color: ACCENT }}>
                {p.maxLeadsMes ? `${p.maxLeadsMes.toLocaleString('es-PE')} leads/mes` : 'Leads ilimitados'}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {cobroAutomaticoDisponible
            ? 'Pagas con tarjeta en Mercado Pago y se renueva cada mes. Puedes cancelar cuando quieras.'
            : 'Te enviamos los datos de pago por WhatsApp.'}
        </p>
        <button
          type="button"
          onClick={confirmar}
          disabled={enviando}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-wait disabled:opacity-70"
          style={{ background: ACCENT }}
        >
          {enviando ? 'Un momento…' : cobroAutomaticoDisponible ? 'Continuar al pago' : 'Coordinar pago'}
        </button>
      </div>
    </section>
  );
}
