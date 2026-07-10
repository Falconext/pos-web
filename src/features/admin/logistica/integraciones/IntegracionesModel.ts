// Modelos y constantes para la página de Integraciones API (Logística)

export type Entorno = 'live' | 'test';

/** API key tal como la devuelve el listado (enmascarada). */
export interface IApiKey {
  id: string;
  nombre: string | null;
  entorno: Entorno;
  prefijo: string;
  ultimosCuatro: string;
  activo: boolean;
  ultimoUsoEn: string | null;
  creadoEn: string;
}

/** Respuesta al crear una API key — incluye el texto plano UNA sola vez. */
export interface IApiKeyCreada {
  id: string;
  apiKey: string;
  nombre: string | null;
  entorno: Entorno;
  prefijo: string;
  ultimosCuatro: string;
  creadoEn: string;
}

/** Webhook tal como lo devuelve el listado. */
export interface IWebhook {
  id: string;
  url: string;
  events: string[];
  activo: boolean;
  ultimoEnvioEn: string | null;
  creadoEn: string;
}

/** Respuesta al crear un webhook — incluye el secret UNA sola vez. */
export interface IWebhookCreado {
  id: string;
  url: string;
  secret: string;
  events: string[];
}

/** Los ÚNICOS 7 eventos disponibles para suscribir un webhook. */
export const WEBHOOK_EVENTS: { value: string; label: string; icon: string; color: string }[] = [
  { value: 'order.created', label: 'Pedido creado', icon: 'solar:add-circle-bold-duotone', color: 'text-blue-500' },
  { value: 'order.assigned', label: 'Pedido asignado', icon: 'solar:user-check-bold-duotone', color: 'text-violet-500' },
  { value: 'order.picked_up', label: 'Recogido', icon: 'solar:box-bold-duotone', color: 'text-amber-500' },
  { value: 'order.in_transit', label: 'En tránsito', icon: 'solar:delivery-bold-duotone', color: 'text-cyan-500' },
  { value: 'order.delivered', label: 'Entregado', icon: 'solar:check-circle-bold-duotone', color: 'text-emerald-500' },
  { value: 'order.failed', label: 'Fallido', icon: 'solar:close-circle-bold-duotone', color: 'text-rose-500' },
  { value: 'order.returned', label: 'Devuelto', icon: 'solar:undo-left-round-bold-duotone', color: 'text-orange-500' },
];

export const EVENT_LABELS: Record<string, string> = WEBHOOK_EVENTS.reduce(
  (acc, e) => ({ ...acc, [e.value]: e.label }),
  {} as Record<string, string>,
);
