import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { get } from '@/utils/fetch';
import { type ConexionWhatsapp, RUTA_CONEXION_WHATSAPP, formatearNumeroWhatsapp } from './whatsappConexion';

interface Props {
    /** Dentro de Configuración se abre la sección en el sitio, sin navegar. */
    onAbrir?: () => void;
    /** Avisa el estado leído (p. ej. para habilitar "Enviar desde mi número"). */
    onConexion?: (conexion: ConexionWhatsapp) => void;
    className?: string;
}

/**
 * Acceso corto a "Conectar mi WhatsApp" desde donde se usan los envíos
 * (avisos de despacho, envío del comprobante). Sin la función habilitada
 * para la empresa no muestra nada.
 */
export default function WhatsappConexionAcceso({ onAbrir, onConexion, className = '' }: Props) {
    const [conexion, setConexion] = useState<ConexionWhatsapp | null>(null);

    useEffect(() => {
        let vivo = true;
        void get<ConexionWhatsapp>('/whatsapp/conexion').then((res) => {
            if (!vivo || !res.success || !res.data) return;
            setConexion(res.data);
            onConexion?.(res.data);
        });
        return () => {
            vivo = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!conexion?.disponible) return null;

    const conectado = conexion.estado === 'CONECTADO';
    const caido = conexion.estado === 'DESCONECTADO';
    const texto = conectado
        ? `Enviando desde tu WhatsApp ${formatearNumeroWhatsapp(conexion.numero)}`
        : caido
          ? 'Tu WhatsApp se desconectó: vuelve a escanear el QR'
          : 'Envía estos mensajes desde tu propio número';
    const accion = conectado ? 'Ver' : caido ? 'Reconectar' : 'Conectar mi WhatsApp';
    const tono = conectado
        ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-900/20 dark:text-emerald-200'
        : caido
          ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-200'
          : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200';
    const claseBoton = 'shrink-0 rounded-lg px-2 py-1 text-xs font-bold underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500';

    return (
        <div className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs ${tono} ${className}`} data-testid="wa-acceso">
            <span className="flex items-center gap-2">
                <Icon icon={caido ? 'solar:danger-triangle-bold' : 'mdi:whatsapp'} className="shrink-0 text-base" />
                {texto}
            </span>
            {onAbrir ? (
                <button type="button" className={claseBoton} onClick={onAbrir}>{accion} →</button>
            ) : (
                <Link to={RUTA_CONEXION_WHATSAPP} className={claseBoton}>{accion} →</Link>
            )}
        </div>
    );
}
