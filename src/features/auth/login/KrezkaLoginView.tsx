import React, { FormEvent, useState } from 'react';
import Alert from "@/components/Alert";
import Loading from "@/components/Loading";
import useAlertStore from "@/zustand/alert";
import { BRAND } from '@/lib/branding';
import { useLoginViewModel } from "./useLoginViewModel";
import { useNavigate } from 'react-router-dom';
import {
    ArrowRight, BadgeCheck, Bot, Boxes, Eye, EyeOff, Loader2,
    MessageCircle, Receipt, ScanBarcode, ShieldCheck, Store, Truck,
} from 'lucide-react';

// Misma paleta que la landing de krezka.com (hero morado).
const ACCENT = '#5B47E0';

const MODULOS = [
    { icon: Receipt, titulo: 'Facturación SUNAT', detalle: 'Boletas, facturas y guías' },
    { icon: ScanBarcode, titulo: 'Punto de venta', detalle: 'Caja, vuelto y cierres' },
    { icon: Boxes, titulo: 'Inventario', detalle: 'Kardex, lotes y multi-sede' },
    { icon: Store, titulo: 'Tienda virtual', detalle: 'Catálogo y pagos en línea' },
    { icon: Bot, titulo: 'IA de Ventas', detalle: 'Atiende tu WhatsApp 24/7' },
    { icon: Truck, titulo: 'Envíos', detalle: 'Guías Shalom y Olva' },
];

const CIFRAS = [
    { valor: '+500', etiqueta: 'negocios activos' },
    { valor: '1M+', etiqueta: 'comprobantes emitidos' },
    { valor: '24/7', etiqueta: 'soporte e IA' },
];

export default function KrezkaLoginView() {
    const { formValues, isLoading, auth, handleChange, handleLogin } = useLoginViewModel();
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    // login() marca su espera en el store de alertas, no en isLoading (que arranca en true).
    const enviando = useAlertStore(s => !!s.loading);
    const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('ACCESS_TOKEN');

    if (isLoading && hasToken) return <Loading />;
    if (auth && !isLoading) return null;

    const onSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!enviando) handleLogin();
    };

    const asesorUrl = `https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent('Hola, quiero conocer Krezka')}`;

    return (
        <>
            <style>{`
                .krk-root { font-family: 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif; }
                .krk-hero {
                    background:
                        radial-gradient(1200px 600px at 110% -10%, rgba(169,157,248,.55), transparent 60%),
                        radial-gradient(800px 500px at -20% 110%, rgba(56,32,170,.9), transparent 60%),
                        linear-gradient(150deg, #4B3FBE 0%, #5B47E0 45%, #7C6BF0 100%);
                }
                .krk-grid {
                    background-image:
                        linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px);
                    background-size: 44px 44px;
                    mask-image: radial-gradient(ellipse at 70% 30%, #000 20%, transparent 75%);
                }
                .krk-glass {
                    background: rgba(255,255,255,.10);
                    border: 1px solid rgba(255,255,255,.18);
                    backdrop-filter: blur(14px);
                }
                @keyframes krk-up { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
                @keyframes krk-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
                @keyframes krk-ping { 0% { transform: scale(1); opacity: .7; } 100% { transform: scale(2.4); opacity: 0; } }
                .krk-up { animation: krk-up .5s cubic-bezier(.2,.7,.2,1) both; }
                .krk-float { animation: krk-float 6s ease-in-out infinite; }
                .krk-ping { animation: krk-ping 1.6s ease-out infinite; }
                .krk-input:focus { border-color: ${ACCENT}; box-shadow: 0 0 0 4px rgba(91,71,224,.14); }
                @media (prefers-reduced-motion: reduce) {
                    .krk-up, .krk-float, .krk-ping { animation: none !important; }
                }
            `}</style>

            <div className="krk-root min-h-screen w-full flex bg-white text-slate-900">
                <div className="fixed top-5 right-5" style={{ zIndex: 100 }}><Alert /></div>

                {/* ── Izquierda: lo que es Krezka ── */}
                <aside className="krk-hero relative hidden lg:flex w-[54%] xl:w-[56%] flex-col overflow-hidden text-white">
                    <div className="krk-grid absolute inset-0 pointer-events-none" />

                    <div className="relative z-10 flex flex-1 flex-col px-12 xl:px-16 py-10">
                        {/* El logo es azul marino + morado: sobre el fondo morado se pierde, va en placa blanca */}
                        <span className="self-start rounded-2xl bg-white px-3 py-1.5 shadow-[0_12px_32px_-12px_rgba(20,10,80,.6)] ring-1 ring-white/60">
                            <img src={BRAND.logo} alt={BRAND.name} className="h-14 w-auto object-contain"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        </span>

                        <div className="mt-auto pt-10 max-w-[620px]">
                            <span className="krk-glass inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold tracking-wide">
                                <BadgeCheck size={14} /> Certificado PSE incluido · Válido ante SUNAT
                            </span>
                            <h2 className="krk-up mt-5 text-[40px] xl:text-[46px] font-extrabold leading-[1.08] tracking-tight">
                                Todo tu negocio,<br />en un solo lugar.
                            </h2>
                            <p className="krk-up mt-4 text-[15px] leading-relaxed text-white/75 max-w-[500px]" style={{ animationDelay: '.08s' }}>
                                Factura ante SUNAT, vende en caja, controla tu stock, abre tu tienda online
                                y deja que la IA atienda tu WhatsApp las 24 horas.
                            </p>

                            <ul className="mt-8 grid grid-cols-2 xl:grid-cols-3 gap-3">
                                {MODULOS.map(({ icon: Ico, titulo, detalle }, i) => (
                                    <li key={titulo} className="krk-glass krk-up rounded-2xl p-3.5" style={{ animationDelay: `${0.14 + i * 0.05}s` }}>
                                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#4B3FBE]">
                                            <Ico size={18} strokeWidth={2.2} />
                                        </span>
                                        <p className="mt-2.5 text-[13.5px] font-bold leading-tight">{titulo}</p>
                                        <p className="mt-0.5 text-[12px] text-white/65 leading-snug">{detalle}</p>
                                    </li>
                                ))}
                            </ul>

                            <dl className="mt-9 flex gap-10 border-t border-white/15 pt-6 [@media(max-height:820px)]:hidden">
                                {CIFRAS.map(c => (
                                    <div key={c.etiqueta}>
                                        <dt className="sr-only">{c.etiqueta}</dt>
                                        <dd className="text-[26px] font-extrabold leading-none">{c.valor}</dd>
                                        <p className="mt-1.5 text-[12px] text-white/60">{c.etiqueta}</p>
                                    </div>
                                ))}
                            </dl>
                        </div>
                    </div>

                    {/* Tarjetas flotantes: así se ve el sistema trabajando */}
                    <div aria-hidden className="pointer-events-none absolute right-10 top-24 hidden xl:block w-[270px] space-y-3">
                        <div className="krk-float rounded-2xl bg-white p-4 text-slate-900 shadow-[0_24px_60px_-20px_rgba(20,10,80,.55)]">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Boleta electrónica</span>
                                <span className="relative flex h-2 w-2">
                                    <span className="krk-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400" />
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                                </span>
                            </div>
                            <p className="mt-1.5 text-[15px] font-bold">B001-000245</p>
                            <div className="mt-2 flex items-center justify-between">
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                                    <BadgeCheck size={12} /> Aceptada por SUNAT
                                </span>
                                <span className="text-[15px] font-extrabold">S/ 128.50</span>
                            </div>
                        </div>
                        <div className="krk-float ml-8 rounded-2xl bg-white p-4 text-slate-900 shadow-[0_24px_60px_-20px_rgba(20,10,80,.55)]" style={{ animationDelay: '-3s' }}>
                            <div className="flex items-center gap-2">
                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#25D366]/15 text-[#128C4B]">
                                    <MessageCircle size={14} strokeWidth={2.4} />
                                </span>
                                <div>
                                    <p className="text-[12.5px] font-bold leading-tight">IA de Ventas</p>
                                    <p className="text-[11px] text-slate-400">Lead caliente · hace 1 min</p>
                                </div>
                            </div>
                            <p className="mt-2.5 rounded-xl rounded-tl-sm bg-slate-100 px-3 py-2 text-[12px] leading-snug text-slate-600">
                                ¿Tienen 3 cajas en stock? ¿Hacen envío a Arequipa?
                            </p>
                        </div>
                    </div>
                </aside>

                {/* ── Derecha: formulario ── */}
                <main className="flex flex-1 flex-col">
                    <header className="flex items-center justify-between gap-4 px-6 sm:px-10 pt-7">
                        <img src={BRAND.logo} alt={BRAND.name} className="h-8 w-auto object-contain lg:invisible" />
                        <p className="text-[13px] text-slate-500">
                            <span className="hidden sm:inline">¿Aún no tienes cuenta? </span>
                            <a href={asesorUrl} target="_blank" rel="noopener noreferrer"
                                className="font-semibold hover:underline" style={{ color: ACCENT }}>
                                Habla con un asesor
                            </a>
                        </p>
                    </header>

                    <div className="flex flex-1 items-center justify-center px-6 sm:px-10 py-10">
                        <div className="w-full max-w-[400px]">
                            <h1 className="text-[28px] font-extrabold tracking-tight leading-tight">Ingresa a tu cuenta</h1>
                            <p className="mt-2 text-[14px] text-slate-500">Bienvenido de nuevo. Continúa donde lo dejaste.</p>

                            <form onSubmit={onSubmit} noValidate className="mt-9 space-y-5">
                                <div>
                                    <label htmlFor="krk-email" className="mb-2 block text-[13px] font-semibold text-slate-700">Correo electrónico</label>
                                    <input
                                        id="krk-email"
                                        className="krk-input w-full rounded-xl border-[1.5px] border-slate-200 bg-white px-4 py-3.5 text-[15px] outline-none transition placeholder:text-slate-300"
                                        type="email"
                                        name="email"
                                        autoComplete="email"
                                        inputMode="email"
                                        autoFocus
                                        value={formValues.email}
                                        onChange={handleChange}
                                        placeholder="correo@empresa.com"
                                    />
                                </div>

                                <div>
                                    <div className="mb-2 flex items-center justify-between">
                                        <label htmlFor="krk-password" className="text-[13px] font-semibold text-slate-700">Contraseña</label>
                                        <button type="button" onClick={() => navigate('/recuperar-contrasena')}
                                            className="text-[13px] font-medium hover:underline" style={{ color: ACCENT }}>
                                            ¿Olvidaste tu contraseña?
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <input
                                            id="krk-password"
                                            className="krk-input w-full rounded-xl border-[1.5px] border-slate-200 bg-white px-4 py-3.5 pr-12 text-[15px] outline-none transition placeholder:text-slate-300"
                                            type={showPassword ? 'text' : 'password'}
                                            name="password"
                                            autoComplete="current-password"
                                            value={formValues.password}
                                            onChange={handleChange}
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(v => !v)}
                                            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                            className="absolute right-1.5 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={enviando}
                                    className="group flex w-full items-center justify-center gap-2 rounded-xl py-4 text-[15px] font-bold text-white transition hover:brightness-110 active:scale-[.98] disabled:cursor-wait disabled:opacity-80"
                                    style={{ background: ACCENT, boxShadow: '0 12px 28px -10px rgba(91,71,224,.65)' }}
                                >
                                    {enviando ? (
                                        <><Loader2 size={18} className="animate-spin" /> Ingresando…</>
                                    ) : (
                                        <>Iniciar sesión <ArrowRight size={18} className="transition group-hover:translate-x-0.5" /></>
                                    )}
                                </button>
                            </form>

                            <div className="mt-8 flex items-start gap-3 rounded-xl bg-slate-50 px-4 py-3.5">
                                <ShieldCheck size={18} className="mt-0.5 shrink-0" style={{ color: ACCENT }} />
                                <p className="text-[12.5px] leading-relaxed text-slate-500">
                                    Conexión cifrada. Tus comprobantes se emiten con certificado digital propio y quedan registrados ante SUNAT.
                                </p>
                            </div>

                            {/* En celular el panel morado no se ve: los módulos van como chips */}
                            <ul className="mt-6 flex flex-wrap gap-2 lg:hidden">
                                {MODULOS.map(({ icon: Ico, titulo }) => (
                                    <li key={titulo} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-[12px] font-medium text-slate-600">
                                        <Ico size={13} style={{ color: ACCENT }} /> {titulo}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <footer className="flex flex-wrap items-center justify-between gap-2 px-6 sm:px-10 pb-6 text-[12px] text-slate-400">
                        <span>© {new Date().getFullYear()} {BRAND.name}</span>
                        <a href={BRAND.website} target="_blank" rel="noopener noreferrer" className="hover:text-slate-600">krezka.com</a>
                    </footer>
                </main>
            </div>
        </>
    );
}
