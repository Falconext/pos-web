import { FormEvent, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Check, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';
import Alert from '@/components/Alert';
import { BRAND } from '@/lib/branding';
import { post } from '@/utils/fetch';
import { useAuthStore } from '@/zustand/auth';

/**
 * Prueba gratis de IA de Ventas: el destino de los botones de planes de la web.
 *
 * Crea la cuenta (7 días, facturación en demo), inicia sesión con lo mismo que
 * escribió y lo deja en la bienvenida. El plan que marque acá es solo una
 * preferencia: al terminar la prueba lo vuelve a elegir y paga.
 */

const ACCENT = BRAND.panelAccent || BRAND.primaryColor;

const PLANES = [
  { clave: 'start', nombre: 'Start', precio: 199, leads: '500' },
  { clave: 'pro', nombre: 'Pro', precio: 299, leads: '1,500' },
  { clave: 'scale', nombre: 'Scale', precio: 499, leads: '5,000' },
] as const;
type ClavePlan = (typeof PLANES)[number]['clave'];

const INCLUYE = [
  'Facturación electrónica SUNAT (modo prueba)',
  'IA que atiende tu WhatsApp 24/7',
  'Hasta 50 leads durante la prueba',
  'Sin tarjeta. Eliges plan al final.',
];

const esPlan = (v: string | null): v is ClavePlan => PLANES.some((p) => p.clave === v);

type Campos = {
  nombreNegocio: string;
  ruc: string;
  nombre: string;
  celular: string;
  email: string;
  password: string;
};

const VACIO: Campos = { nombreNegocio: '', ruc: '', nombre: '', celular: '', email: '', password: '' };

function validar(c: Campos): string | null {
  if (!c.nombreNegocio.trim()) return 'Escribe el nombre de tu negocio.';
  if (!/^(10|15|17|20)\d{9}$/.test(c.ruc.trim())) return 'El RUC debe tener 11 dígitos.';
  if (!c.nombre.trim()) return 'Escribe tu nombre.';
  if (!/^9\d{8}$/.test(c.celular.replace(/\D/g, ''))) return 'El celular debe tener 9 dígitos y empezar con 9.';
  if (!/^\S+@\S+\.\S+$/.test(c.email.trim())) return 'Revisa tu correo.';
  if (c.password.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
  return null;
}

export default function RegistroPruebaView() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [plan, setPlan] = useState<ClavePlan>(() => {
    const p = params.get('plan');
    return esPlan(p) ? p : 'pro';
  });
  const [campos, setCampos] = useState<Campos>(VACIO);
  // Trampa para bots: oculto a la vista y al lector de pantalla.
  const [sitio, setSitio] = useState('');
  const [verPassword, setVerPassword] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cambiar = (k: keyof Campos) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setCampos((prev) => ({ ...prev, [k]: e.target.value }));

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    if (enviando) return;
    const problema = validar(campos);
    if (problema) {
      setError(problema);
      return;
    }
    setError(null);
    setEnviando(true);
    try {
      const resp = await post('empresa/registro', {
        ...campos,
        ruc: campos.ruc.trim(),
        celular: campos.celular.replace(/\D/g, ''),
        plan,
        brand: BRAND.authBrand || 'krezka',
        sitio,
      });
      if (!resp.success) {
        setError(resp.error || 'No se pudo crear tu cuenta. Inténtalo de nuevo.');
        return;
      }
      await useAuthStore.getState().login({ email: campos.email.trim(), password: campos.password });
      if (useAuthStore.getState().success) {
        navigate('/administrador/bienvenida', { replace: true });
      } else {
        // La cuenta existe aunque el login automático falle: que entre a mano.
        navigate('/login', { replace: true });
      }
    } finally {
      setEnviando(false);
    }
  };

  const input =
    'w-full rounded-xl border-[1.5px] border-slate-200 bg-white px-4 py-3 text-[15px] outline-none transition placeholder:text-slate-300 focus:border-[var(--acento)] focus:shadow-[0_0_0_4px_rgba(91,71,224,.12)]';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900" style={{ ['--acento' as string]: ACCENT }}>
      <div className="fixed top-5 right-5" style={{ zIndex: 100 }}><Alert /></div>

      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 pt-6 sm:px-6">
        <img src={BRAND.logo} alt={BRAND.name} className="h-8 w-auto object-contain" />
        <p className="text-[13px] text-slate-500">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-semibold hover:underline" style={{ color: ACCENT }}>Inicia sesión</Link>
        </p>
      </header>

      <main className="mx-auto grid max-w-5xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_440px] lg:py-14">
        <section>
          <span className="inline-flex rounded-full px-3 py-1 text-xs font-bold text-white" style={{ background: ACCENT }}>
            7 días gratis
          </span>
          <h1 className="mt-4 text-[30px] font-extrabold leading-tight tracking-tight sm:text-[36px]">
            Crea tu asesor con IA y empieza a vender por WhatsApp hoy
          </h1>
          <p className="mt-3 max-w-lg text-[15px] text-slate-500">
            Conecta tu WhatsApp, carga tus productos y la IA atiende, cotiza y da seguimiento por ti.
          </p>

          <fieldset className="mt-7">
            <legend className="text-[13px] font-semibold text-slate-700">¿Qué plan te interesa?</legend>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {PLANES.map((p) => {
                const activo = plan === p.clave;
                return (
                  <button
                    key={p.clave}
                    type="button"
                    onClick={() => setPlan(p.clave)}
                    aria-pressed={activo}
                    className={`rounded-xl border-[1.5px] bg-white p-3 text-left transition ${activo ? 'shadow-md' : 'border-slate-200 hover:border-slate-300'}`}
                    style={activo ? { borderColor: ACCENT } : undefined}
                  >
                    <span className="block text-sm font-bold">{p.nombre}</span>
                    <span className="block text-[13px] text-slate-500">S/ {p.precio}/mes</span>
                    <span className="mt-1 block text-[11px] font-semibold" style={{ color: ACCENT }}>{p.leads} leads/mes</span>
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-[12px] text-slate-400">No se cobra nada ahora. Lo confirmas al terminar la prueba.</p>
          </fieldset>

          <ul className="mt-7 space-y-2.5">
            {INCLUYE.map((t) => (
              <li key={t} className="flex items-start gap-2.5 text-[14px] text-slate-600">
                <Check size={17} className="mt-0.5 shrink-0" style={{ color: ACCENT }} strokeWidth={2.5} />
                {t}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-[0_24px_60px_-30px_rgba(20,10,80,.35)] ring-1 ring-slate-100 sm:p-8">
          <h2 className="text-xl font-extrabold">Crea tu cuenta</h2>
          <form onSubmit={enviar} noValidate className="mt-6 space-y-4">
            <div>
              <label htmlFor="rg-negocio" className="mb-1.5 block text-[13px] font-semibold text-slate-700">Nombre de tu negocio</label>
              <input id="rg-negocio" className={input} value={campos.nombreNegocio} onChange={cambiar('nombreNegocio')} autoComplete="organization" placeholder="Ferretería El Progreso" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="rg-ruc" className="mb-1.5 block text-[13px] font-semibold text-slate-700">RUC</label>
                <input id="rg-ruc" className={input} value={campos.ruc} onChange={cambiar('ruc')} inputMode="numeric" maxLength={11} placeholder="20123456789" />
              </div>
              <div>
                <label htmlFor="rg-celular" className="mb-1.5 block text-[13px] font-semibold text-slate-700">Celular</label>
                <input id="rg-celular" className={input} value={campos.celular} onChange={cambiar('celular')} inputMode="tel" autoComplete="tel" placeholder="987654321" />
              </div>
            </div>
            <div>
              <label htmlFor="rg-nombre" className="mb-1.5 block text-[13px] font-semibold text-slate-700">Tu nombre</label>
              <input id="rg-nombre" className={input} value={campos.nombre} onChange={cambiar('nombre')} autoComplete="name" placeholder="Nombre y apellido" />
            </div>
            <div>
              <label htmlFor="rg-email" className="mb-1.5 block text-[13px] font-semibold text-slate-700">Correo</label>
              <input id="rg-email" type="email" className={input} value={campos.email} onChange={cambiar('email')} autoComplete="email" inputMode="email" placeholder="correo@negocio.com" />
            </div>
            <div>
              <label htmlFor="rg-password" className="mb-1.5 block text-[13px] font-semibold text-slate-700">Contraseña</label>
              <div className="relative">
                <input
                  id="rg-password"
                  type={verPassword ? 'text' : 'password'}
                  className={`${input} pr-12`}
                  value={campos.password}
                  onChange={cambiar('password')}
                  autoComplete="new-password"
                  placeholder="Mínimo 8 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setVerPassword((v) => !v)}
                  aria-label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute right-1.5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  {verPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <input
              type="text"
              name="sitio"
              value={sitio}
              onChange={(e) => setSitio(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="absolute -left-[9999px] h-0 w-0 opacity-0"
            />

            {error && (
              <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-[13px] font-medium text-red-700">{error}</p>
            )}

            <button
              type="submit"
              disabled={enviando}
              className="group flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-[15px] font-bold text-white transition hover:brightness-110 active:scale-[.98] disabled:cursor-wait disabled:opacity-80"
              style={{ background: ACCENT }}
            >
              {enviando ? (
                <><Loader2 size={18} className="animate-spin" /> Creando tu cuenta…</>
              ) : (
                <>Empezar prueba gratis <ArrowRight size={18} className="transition group-hover:translate-x-0.5" /></>
              )}
            </button>
          </form>

          <p className="mt-5 flex items-start gap-2 text-[12px] leading-relaxed text-slate-400">
            <ShieldCheck size={15} className="mt-0.5 shrink-0" />
            Al crear tu cuenta aceptas la{' '}
            <Link to="/privacidad" className="underline hover:text-slate-600">política de privacidad</Link>.
          </p>
        </section>
      </main>
    </div>
  );
}
