import React, { useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/zustand/auth';
import { BRAND } from '@/lib/branding';
import { useEstadoSuscripcion, diasParaVencer } from '@/features/admin/suscripcion/useMiPlanViewModel';

/**
 * El recordatorio de que hay una mensualidad por pagar.
 *
 * Antes el único aviso era una notificación en la campana, que se lee una vez y
 * se olvida; el empresario se enteraba de que debía el día que no podía entrar.
 * Esto vive en el encabezado de TODAS las pantallas del panel mientras haya
 * algo pendiente, y desaparece solo cuando se paga.
 *
 * Dos niveles y una regla: el aviso de "está por vencer" se puede posponer
 * hasta mañana, el de "ya venció" no. Cuando el acceso está en juego, dejar
 * cerrar el aviso es ayudarlo a perderlo.
 */

const CLAVE_POSPUESTO = 'AVISO_SUSCRIPCION_POSPUESTO';
const DIAS_PREAVISO = 7;

const fmt = (n: number | string) =>
    `S/ ${Number(n || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fecha = (v?: string | null) =>
    v ? new Date(v).toLocaleDateString('es-PE', { day: '2-digit', month: 'long' }) : '';

const hoyISO = () => new Date().toISOString().slice(0, 10);

export default function AvisoSuscripcion() {
    const { auth } = useAuthStore();
    const esEmpresario = auth?.rol === 'ADMIN_EMPRESA';
    const estado = useEstadoSuscripcion(Boolean(esEmpresario));

    // Posponer dura hasta el final del día: mañana vuelve a aparecer solo.
    const [pospuestoHoy, setPospuestoHoy] = useState(() => {
        try {
            return localStorage.getItem(CLAVE_POSPUESTO) === hoyISO();
        } catch {
            return false;
        }
    });

    const posponer = () => {
        try {
            localStorage.setItem(CLAVE_POSPUESTO, hoyISO());
        } catch {
            /* modo privado: se queda visible, que es el lado seguro */
        }
        setPospuestoHoy(true);
    };

    const dias = diasParaVencer(estado?.fechaExpiracion);

    const nivel = useMemo<'vencida' | 'porVencer' | null>(() => {
        if (!estado) return null;
        if (estado.vencida) return 'vencida';
        if (dias !== null && dias <= DIAS_PREAVISO) return 'porVencer';
        return null;
    }, [estado, dias]);

    if (!esEmpresario || !nivel) return null;
    if (nivel === 'porVencer' && pospuestoHoy) return null;

    const urgente = nivel === 'vencida';
    const monto = estado?.cobroPendiente?.monto;

    const mensajeWsp = encodeURIComponent(
        urgente
            ? `Hola, quiero regularizar el pago de mi plan ${estado?.plan?.nombre ?? ''}.`
            : `Hola, quiero coordinar el pago de mi plan ${estado?.plan?.nombre ?? ''}.`,
    );

    return (
        <div
            role={urgente ? 'alert' : 'status'}
            className={`mb-4 rounded-2xl border px-4 py-3.5 shadow-sm ${urgente
                ? 'border-red-200 bg-red-50 dark:border-red-500/30 dark:bg-red-950/30'
                : 'border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-950/25'
                }`}
        >
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${urgente ? 'bg-red-100 dark:bg-red-500/20' : 'bg-amber-100 dark:bg-amber-500/20'
                            }`}
                    >
                        <Icon
                            icon={urgente ? 'solar:danger-triangle-bold' : 'solar:clock-circle-bold'}
                            width={19}
                            className={urgente ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}
                            aria-hidden="true"
                        />
                    </div>
                    <div className="min-w-0">
                        <p className={`text-sm font-bold ${urgente ? 'text-red-800 dark:text-red-300' : 'text-amber-900 dark:text-amber-300'}`}>
                            {urgente
                                ? estado?.enGracia
                                    ? `Tu plan venció — te ${estado.diasRestantes === 1 ? 'queda 1 día' : `quedan ${estado?.diasRestantes} días`} para regularizarlo`
                                    : 'Tu plan venció'
                                : dias === 0
                                    ? 'Tu plan vence hoy'
                                    : `Tu plan vence ${dias === 1 ? 'mañana' : `en ${dias} días`}`}
                        </p>
                        <p className={`text-xs mt-0.5 ${urgente ? 'text-red-700/90 dark:text-red-400/80' : 'text-amber-800/90 dark:text-amber-400/80'}`}>
                            {monto ? `${fmt(monto)} · ` : ''}
                            {estado?.plan?.nombre ?? 'Tu plan'}
                            {estado?.fechaExpiracion ? ` · vence el ${fecha(estado.fechaExpiracion)}` : ''}
                            {urgente ? '. Pasado el plazo se suspende el acceso.' : ''}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <a
                        href={`https://wa.me/${BRAND.whatsappCobranza || BRAND.whatsapp}?text=${mensajeWsp}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 min-h-[44px] sm:min-h-0 sm:py-2 rounded-xl text-white text-xs font-bold transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${urgente
                            ? 'bg-red-600 hover:bg-red-700 focus-visible:ring-red-500'
                            : 'bg-amber-600 hover:bg-amber-700 focus-visible:ring-amber-500'
                            }`}
                    >
                        <Icon icon="solar:chat-round-dots-bold" width={15} aria-hidden="true" />
                        Coordinar pago
                    </a>
                    <Link
                        to="/administrador/mi-plan"
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 min-h-[44px] sm:min-h-0 sm:py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${urgente
                            ? 'border-red-300 text-red-700 hover:bg-red-100 dark:border-red-500/40 dark:text-red-300 dark:hover:bg-red-500/10'
                            : 'border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-500/40 dark:text-amber-300 dark:hover:bg-amber-500/10'
                            }`}
                    >
                        Ver mi plan
                    </Link>
                    {!urgente && (
                        <button
                            onClick={posponer}
                            aria-label="Recordarme mañana"
                            title="Recordarme mañana"
                            className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 sm:p-2 flex items-center justify-center rounded-xl text-amber-700/70 dark:text-amber-400/70 hover:bg-amber-100 dark:hover:bg-amber-500/10 transition-colors cursor-pointer"
                        >
                            <Icon icon="solar:close-bold" width={16} aria-hidden="true" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
