import type { ChangeEvent } from 'react';
import { Icon } from '@iconify/react';

/**
 * Selector de medio de pago compartido por todas las plantillas de la tienda.
 * Tarjetas rectangulares con logo, nombre y descripción (estilo Mercado Libre).
 * Emite el mismo evento que un <input type="radio" name="medioPago"> para que
 * cualquier checkout lo conecte directamente a su `handleChange`.
 */
export type MedioPagoValue = 'YAPE' | 'PLIN' | 'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA' | 'MERCADO_PAGO';

interface Props {
  configPago: any;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  /** Color de acento de la plantilla (borde/radio del seleccionado). */
  accent?: string;
  /** Radio de borde para respetar el estilo de cada plantilla (ej. '0px', '12px'). */
  radius?: string;
  /** 1 columna (lista) o 2 columnas en desktop. */
  columns?: 1 | 2;
  className?: string;
}

const ORDER: MedioPagoValue[] = ['MERCADO_PAGO', 'YAPE', 'PLIN', 'TARJETA', 'TRANSFERENCIA', 'EFECTIVO'];

const META: Record<MedioPagoValue, { label: string; hint: string; bg: string }> = {
  MERCADO_PAGO:  { label: 'Mercado Pago',  hint: 'Tarjetas, Yape, cuotas y más',       bg: '#009EE3' },
  YAPE:          { label: 'Yape',          hint: 'Escanea el QR y paga al instante',   bg: '#742284' },
  PLIN:          { label: 'Plin',          hint: 'Escanea el QR y paga al instante',   bg: '#00B4A6' },
  TARJETA:       { label: 'Tarjeta',       hint: 'Visa, Mastercard, Amex',             bg: '#111827' },
  TRANSFERENCIA: { label: 'Transferencia', hint: 'Depósito o transferencia bancaria',  bg: '#334155' },
  EFECTIVO:      { label: 'Efectivo',      hint: 'Pagas al recibir o recoger',         bg: '#16A34A' },
};

/** Logo/monograma de cada medio, en un tile con el color de la marca. */
function Logo({ medio }: { medio: MedioPagoValue }) {
  const base = 'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm';
  const style = { backgroundColor: META[medio].bg };
  switch (medio) {
    case 'YAPE':
      return <span className={`${base} font-black text-[13px] tracking-tight`} style={style}>yape</span>;
    case 'PLIN':
      return <span className={`${base} font-black text-[13px] tracking-tight`} style={style}>plin</span>;
    case 'MERCADO_PAGO':
      return <span className={base} style={style}><Icon icon="simple-icons:mercadopago" width={26} /></span>;
    case 'TARJETA':
      return <span className={base} style={style}><Icon icon="solar:card-2-bold" width={24} /></span>;
    case 'TRANSFERENCIA':
      return <span className={base} style={style}><Icon icon="solar:card-transfer-bold" width={24} /></span>;
    case 'EFECTIVO':
    default:
      return <span className={base} style={style}><Icon icon="solar:banknote-2-bold" width={24} /></span>;
  }
}

/** Mismo gating que el checkout base: solo se ofrecen los medios que la tienda tiene configurados. */
export function mediosDisponibles(configPago: any): MedioPagoValue[] {
  return ORDER.filter((m) => {
    switch (m) {
      case 'EFECTIVO':      return Boolean(configPago?.aceptaEfectivo);
      case 'TARJETA':       return Boolean(configPago?.aceptaTarjeta && configPago?.culqiPublicKey);
      case 'MERCADO_PAGO':  return Boolean(configPago?.aceptaMercadoPago);
      case 'YAPE':          return Boolean(configPago?.yapeQrUrl || configPago?.yapeQR || configPago?.yapeNumero);
      case 'PLIN':          return Boolean(configPago?.plinQrUrl || configPago?.plinQR || configPago?.plinNumero);
      case 'TRANSFERENCIA': return Boolean(configPago?.cuentasBancarias?.length > 0);
      default:              return false;
    }
  });
}

export default function MedioPagoSelector({ configPago, value, onChange, accent = '#111827', radius = '12px', columns = 2, className = '' }: Props) {
  const medios = mediosDisponibles(configPago);
  if (medios.length === 0) return null;

  // Transferencia: mostrar los bancos configurados como descripción.
  const bancos = Array.from(new Set((configPago?.cuentasBancarias || []).map((c: any) => String(c.banco || '').trim()).filter(Boolean))) as string[];

  return (
    <div className={`grid gap-3 ${columns === 2 ? 'sm:grid-cols-2' : ''} ${className}`}>
      {medios.map((medio) => {
        const active = value === medio;
        const meta = META[medio];
        const hint = medio === 'TRANSFERENCIA' && bancos.length > 0 ? bancos.slice(0, 3).join(', ') : meta.hint;
        return (
          <label
            key={medio}
            className="relative flex cursor-pointer items-center gap-3 border bg-white p-3 pr-4 transition-all hover:shadow-sm"
            style={{
              borderRadius: radius,
              borderColor: active ? accent : '#E5E7EB',
              boxShadow: active ? `0 0 0 1px ${accent}` : undefined,
              backgroundColor: active ? `${accent}0D` : '#FFFFFF',
            }}
          >
            <input
              type="radio"
              name="medioPago"
              value={medio}
              checked={active}
              onChange={onChange}
              className="sr-only"
            />
            <Logo medio={medio} />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold leading-tight text-gray-900">{meta.label}</span>
              <span className="mt-0.5 block truncate text-xs text-gray-500">{hint}</span>
            </span>
            <span
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors"
              style={{ borderColor: active ? accent : '#CBD5E1' }}
              aria-hidden
            >
              {active && <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: accent }} />}
            </span>
          </label>
        );
      })}
    </div>
  );
}
