import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import ConectarWhatsAppButton from '@/components/ConectarWhatsAppButton';
import { BRAND } from '@/lib/branding';
import { get, patch, post } from '@/utils/fetch';
import useAlertStore from '@/zustand/alert';
import { useAuthStore } from '@/zustand/auth';
import { diasParaVencer, useEstadoSuscripcion } from '@/features/admin/suscripcion/useMiPlanViewModel';

/**
 * Bienvenida de quien se registró solo: los cuatro pasos que dejan a la IA
 * vendiendo. Cada paso se marca hecho con datos reales (no con un "listo" que
 * el usuario aprieta), así que se puede volver a esta pantalla cuando quiera.
 */

const ACCENT = BRAND.panelAccent || BRAND.primaryColor;

type Progreso = {
  whatsapp: boolean;
  productos: number;
  documentos: number;
  contexto: boolean;
  iaActiva: boolean;
  facturacionLista: boolean;
  logo: string;
};

const INICIAL: Progreso = {
  whatsapp: false,
  productos: 0,
  documentos: 0,
  contexto: false,
  iaActiva: false,
  facturacionLista: false,
  logo: '',
};

const LOGO_MAX_MB = 2.5;

async function cargarProgreso(): Promise<Progreso> {
  const [perfil, productos, docs, config] = await Promise.all([
    get<any>('auth/perfil'),
    get<any>('productos?page=1&limit=1'),
    get<any[]>('leads/entrenamiento'),
    get<any>('leads/config'),
  ]);
  const empresa = perfil.data?.empresa;
  return {
    whatsapp: Boolean(empresa?.whatsappProvider === 'EMPRESA' && empresa?.whatsappApiTokenConfigured),
    productos: Number(productos.data?.total ?? 0),
    documentos: Array.isArray(docs.data) ? docs.data.length : 0,
    // "Mi vendedor" guarda en `vendedor` (audiencia, reglas, estilo…); el texto
    // libre viejo vive en iaVentasContexto. Cualquiera de los dos cuenta.
    contexto:
      Boolean(String(config.data?.iaVentasContexto ?? '').trim()) ||
      Object.values(config.data?.vendedor ?? {}).some((v) => String(v ?? '').trim() !== ''),
    iaActiva: Boolean(config.data?.iaVentasActiva),
    facturacionLista: Boolean(empresa?.facturacionLista),
    logo: String(empresa?.logoVista || empresa?.logo || ''),
  };
}

function Paso({
  n,
  hecho,
  titulo,
  detalle,
  children,
}: {
  n: number;
  hecho: boolean;
  titulo: string;
  detalle: string;
  children?: React.ReactNode;
}) {
  return (
    <li className="flex gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black ${hecho ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-gray-400'}`}
        aria-label={hecho ? 'Paso completado' : `Paso ${n}`}
      >
        {hecho ? <Icon icon="solar:check-read-linear" width={18} /> : n}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-bold text-gray-900 dark:text-white">{titulo}</p>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{detalle}</p>
        {children && <div className="mt-3">{children}</div>}
      </div>
    </li>
  );
}

const boton =
  'inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold text-white transition hover:brightness-110';
const botonSecundario =
  'inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-50 dark:border-slate-700 dark:text-gray-200 dark:hover:bg-slate-800';

export default function BienvenidaPage() {
  const { auth } = useAuthStore();
  const { alert } = useAlertStore();
  const estado = useEstadoSuscripcion(auth?.rol === 'ADMIN_EMPRESA');
  const [progreso, setProgreso] = useState<Progreso>(INICIAL);
  const [cargando, setCargando] = useState(true);
  const [activando, setActivando] = useState(false);
  const [subiendoLogo, setSubiendoLogo] = useState(false);
  const inputLogo = useRef<HTMLInputElement>(null);

  const recargar = useCallback(async () => {
    try {
      setProgreso(await cargarProgreso());
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  const activarIa = async () => {
    setActivando(true);
    try {
      const r = await patch('leads/config', { iaVentasActiva: true });
      if (!r.success) {
        alert(r.error || 'No se pudo activar la IA', 'error');
        return;
      }
      alert('Tu IA de Ventas ya está atendiendo', 'success');
      await recargar();
    } finally {
      setActivando(false);
    }
  };

  // Mismo endpoint que Configuración de la tienda: guarda `empresa.logo`, que
  // es el que sale en boletas, facturas, tickets y la tienda.
  const subirLogo = async (archivo: File | undefined) => {
    if (!archivo) return;
    if (!archivo.type.startsWith('image/')) {
      alert('El logo tiene que ser una imagen (PNG o JPG)', 'error');
      return;
    }
    if (archivo.size > LOGO_MAX_MB * 1024 * 1024) {
      alert(`La imagen pesa más de ${LOGO_MAX_MB} MB`, 'error');
      return;
    }
    setSubiendoLogo(true);
    try {
      const fd = new FormData();
      fd.append('file', archivo);
      const r = await post<any>('tienda/logo', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (!r.success) {
        alert(r.error || 'No se pudo subir el logo', 'error');
        return;
      }
      const vista = r.data?.signedUrl || r.data?.url || (r as any).signedUrl || (r as any).url;
      setProgreso((p) => ({ ...p, logo: vista || URL.createObjectURL(archivo) }));
      alert('Listo: tu logo ya sale en tus comprobantes', 'success');
    } finally {
      setSubiendoLogo(false);
      if (inputLogo.current) inputLogo.current.value = '';
    }
  };

  const entrenada = progreso.documentos > 0 || progreso.contexto;
  const hechos = [progreso.whatsapp, progreso.productos > 0, entrenada, progreso.iaActiva].filter(Boolean).length;
  const dias = diasParaVencer(estado?.fechaExpiracion);
  const enPrueba = Boolean(estado?.plan?.esPrueba);

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-2 pb-10 pt-4">
      <header>
        <p className="text-sm font-semibold" style={{ color: ACCENT }}>
          {hechos === 4 ? 'Todo listo' : `${hechos} de 4 pasos`}
        </p>
        <h1 className="mt-1 text-2xl font-extrabold text-gray-900 dark:text-white">
          Hola{auth?.nombre ? `, ${String(auth.nombre).split(' ')[0]}` : ''}. Deja tu IA vendiendo en 4 pasos
        </h1>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-slate-800">
          <div className="h-full rounded-full transition-all" style={{ width: `${(hechos / 4) * 100}%`, background: ACCENT }} />
        </div>
      </header>

      {enPrueba && (
        <div className="flex flex-col gap-3 rounded-2xl border border-indigo-100 bg-indigo-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-indigo-500/20 dark:bg-indigo-500/10">
          <p className="text-sm text-indigo-900 dark:text-indigo-200">
            <span className="font-bold">
              {dias === null ? 'Estás en tu prueba gratis.' : dias <= 0 ? 'Tu prueba gratis termina hoy.' : `Te ${dias === 1 ? 'queda 1 día' : `quedan ${dias} días`} de prueba gratis.`}
            </span>{' '}
            Los comprobantes de la prueba van al ambiente demo de SUNAT.
          </p>
          <Link to="/administrador/mi-plan" className={boton} style={{ background: ACCENT }}>
            Elegir plan
          </Link>
        </div>
      )}

      <ol className="space-y-3" aria-busy={cargando}>
        <Paso
          n={1}
          hecho={progreso.whatsapp}
          titulo="Conecta tu WhatsApp"
          detalle="La IA responde desde tu propio número. Inicias sesión con Facebook y eliges el número del negocio."
        >
          {!progreso.whatsapp && <ConectarWhatsAppButton onConectado={() => void recargar()} />}
        </Paso>

        <Paso
          n={2}
          hecho={progreso.productos > 0}
          titulo="Carga tus productos"
          detalle={
            progreso.productos > 0
              ? `${progreso.productos} producto${progreso.productos === 1 ? '' : 's'} en tu catálogo. La IA responde con estos precios y stock.`
              : 'La IA cotiza con tu catálogo real: nombre, precio, stock y foto.'
          }
        >
          <Link to="/administrador/kardex/productos" className={progreso.productos > 0 ? botonSecundario : boton} style={progreso.productos > 0 ? undefined : { background: ACCENT }}>
            {progreso.productos > 0 ? 'Ver productos' : 'Agregar productos'}
          </Link>
        </Paso>

        <Paso
          n={3}
          hecho={entrenada}
          titulo="Enséñale a tu IA"
          detalle="Cuéntale cómo vendes: horarios, envíos, medios de pago, garantías. También puedes subir un PDF o tu lista de preguntas frecuentes."
        >
          <Link to="/administrador/leads/vendedor" className={entrenada ? botonSecundario : boton} style={entrenada ? undefined : { background: ACCENT }}>
            {entrenada ? 'Editar lo que sabe' : 'Entrenar mi IA'}
          </Link>
        </Paso>

        <Paso
          n={4}
          hecho={progreso.iaActiva}
          titulo="Actívala y pruébala"
          detalle={
            progreso.iaActiva
              ? 'Escríbele a tu número desde otro celular: la IA responde en segundos. Los chats aparecen en tu bandeja.'
              : 'Cuando la actives empezará a responder los mensajes que lleguen a tu WhatsApp.'
          }
        >
          {progreso.iaActiva ? (
            <Link to="/administrador/leads/chats" className={botonSecundario}>Ver mis chats</Link>
          ) : (
            <button
              type="button"
              onClick={activarIa}
              disabled={activando || !progreso.whatsapp}
              className={`${boton} disabled:cursor-not-allowed disabled:opacity-50`}
              style={{ background: ACCENT }}
              title={progreso.whatsapp ? undefined : 'Primero conecta tu WhatsApp'}
            >
              {activando ? 'Activando…' : 'Activar mi IA'}
            </button>
          )}
        </Paso>
      </ol>

      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="font-bold text-gray-900 dark:text-white">Tus boletas y facturas</h2>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
          La prueba incluye toda la facturación, no solo la IA.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {/* Facturación demo: la activa el registro en QPSE; si no pudo, el equipo. */}
          <div className="flex gap-3 rounded-xl bg-gray-50 p-4 dark:bg-slate-800/60">
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${progreso.facturacionLista ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15' : 'bg-amber-100 text-amber-600 dark:bg-amber-500/15'}`}
            >
              <Icon icon={progreso.facturacionLista ? 'solar:document-add-bold-duotone' : 'solar:clock-circle-bold-duotone'} width={22} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                {progreso.facturacionLista ? 'Facturación de prueba lista' : 'Activando tu facturación de prueba'}
              </p>
              <p className="mt-0.5 text-[13px] text-gray-500 dark:text-gray-400">
                {progreso.facturacionLista
                  ? 'Emite boletas y facturas en el ambiente demo de SUNAT: no tienen valor tributario.'
                  : 'La dejamos lista en unas horas y te avisamos. Mientras tanto puedes emitir notas de venta.'}
              </p>
              {progreso.facturacionLista && (
                <Link to="/administrador/facturacion/nuevo" className="mt-2 inline-flex text-[13px] font-bold hover:underline" style={{ color: ACCENT }}>
                  Emitir una boleta de prueba
                </Link>
              )}
            </div>
          </div>

          {/* Logo: opcional. */}
          <div className="flex gap-3 rounded-xl bg-gray-50 p-4 dark:bg-slate-800/60">
            {progreso.logo ? (
              <img
                src={progreso.logo}
                alt="Logo de tu negocio"
                className="h-10 w-10 shrink-0 rounded-xl bg-white object-contain p-0.5 ring-1 ring-gray-200 dark:ring-slate-700"
              />
            ) : (
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-gray-400 ring-1 ring-dashed ring-gray-300 dark:bg-slate-900 dark:ring-slate-600">
                <Icon icon="solar:gallery-add-bold-duotone" width={22} />
              </span>
            )}
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                Tu logo <span className="font-medium text-gray-400">(opcional)</span>
              </p>
              <p className="mt-0.5 text-[13px] text-gray-500 dark:text-gray-400">
                Sale en tus boletas, facturas, tickets y tienda virtual. PNG o JPG, hasta {LOGO_MAX_MB} MB.
              </p>
              <input
                ref={inputLogo}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => void subirLogo(e.target.files?.[0])}
              />
              <button
                type="button"
                onClick={() => inputLogo.current?.click()}
                disabled={subiendoLogo}
                className="mt-2 inline-flex text-[13px] font-bold hover:underline disabled:opacity-50"
                style={{ color: ACCENT }}
              >
                {subiendoLogo ? 'Subiendo…' : progreso.logo ? 'Cambiar logo' : 'Subir mi logo'}
              </button>
            </div>
          </div>
        </div>
      </section>

      <p className="text-center text-sm text-gray-500 dark:text-gray-400">
        ¿Te ayudamos a configurarlo?{' '}
        <a
          href={`https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent('Hola, estoy en mi prueba gratis y quiero ayuda para configurar mi IA de Ventas.')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold hover:underline"
          style={{ color: ACCENT }}
        >
          Escríbenos por WhatsApp
        </a>
      </p>
    </div>
  );
}
