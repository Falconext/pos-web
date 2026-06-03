import { usePerfilViewModel } from '@/features/admin/perfil/usePerfilViewModel';
import { Icon } from '@iconify/react';
import Loading from '@/components/Loading';
import { usaLotesFarmaciaRubro } from '@/utils/rubro-features';
import { useState } from 'react';

export default function PerfilIndex() {
    const vm = usePerfilViewModel();
    const { perfil, loading, usageStats, savingBarcodeConfig, savingFefoPriceConfig, savingDirectorTecnico, savingWhatsAppConfig, whatsAppForm, whatsappConfigDirty } = vm;
    const [directorInput, setDirectorInput] = useState<string | null>(null);

    if (loading) return <div className="flex justify-center items-center h-96"><Loading /></div>;
    if (!perfil) return <div className="text-center text-gray-500 py-8">No se pudo cargar la información del perfil</div>;

    const isSystemAdmin = perfil?.rol === 'ADMIN_SISTEMA';
    const theme = {
        bg: isSystemAdmin ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'bg-blue-50 dark:bg-blue-900/20',
        text: isSystemAdmin ? 'text-indigo-600 dark:text-indigo-400' : 'text-blue-600 dark:text-blue-400',
        textDark: isSystemAdmin ? 'text-indigo-700 dark:text-indigo-300' : 'text-blue-700 dark:text-blue-300',
        border: isSystemAdmin ? 'border-indigo-100 dark:border-indigo-800' : 'border-blue-100 dark:border-blue-800',
        icon: isSystemAdmin ? 'text-indigo-300 dark:text-indigo-600' : 'text-blue-300 dark:text-blue-600',
    };
    const limiteRaw = Number(usageStats?.limiteMaximo ?? 0);
    const comprobantesIlimitados = !!usageStats && (!Number.isFinite(limiteRaw) || limiteRaw <= 0);
    const planNombre = String(perfil?.empresa?.plan?.nombre || '').toUpperCase();
    const fefoPermitidoPorPlan = planNombre.includes('NEGOCIO') || planNombre.includes('CORPORAT');

    if (perfil?.rol === 'ADMIN_SISTEMA') {
        return (
            <div className="p-6 max-w-4xl mx-auto bg-gray-50 dark:bg-[#0A0D14] min-h-screen">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Perfil de Administrador del Sistema</h1>
                <div className="bg-white dark:bg-[#111827] rounded-lg shadow p-6 border dark:border-slate-800">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-2xl">
                            {perfil.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold dark:text-white">{perfil.nombre}</h2>
                            <p className="text-gray-500 dark:text-gray-400">{perfil.email}</p>
                            <span className="inline-block mt-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded text-xs font-bold">SUPER ADMIN</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div><h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Rol</h3><p className="font-medium text-gray-900 dark:text-gray-200">{perfil.rol}</p></div>
                        <div><h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Estado</h3><p className="font-medium text-green-600 dark:text-green-400">{perfil.estado}</p></div>
                        <div><h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Fecha Creación</h3><p className="font-medium text-gray-900 dark:text-gray-200">{vm.formatearFecha(perfil.fechaCreacion)}</p></div>
                    </div>
                </div>
            </div>
        );
    }

    const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
        <div className="pb-3 border-b border-gray-50 dark:border-slate-800/50 last:border-0 last:pb-0">
            <label className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1">{label}</label>
            {children}
        </div>
    );

    return (
        <div className="min-h-screen px-2 pb-4 bg-gray-50 dark:bg-[#0A0D14]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 pt-4 px-2">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Mi Perfil</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Información de tu cuenta y empresa</p>
                </div>
            </div>
            <div className="space-y-4">
                <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-5">
                    <div className="flex items-center space-x-5">
                        <div className={`w-24 h-24 rounded-full p-1 border-2 ${theme.border} bg-white dark:bg-[#0A0D14]`}>
                            <div className="w-full h-full bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center overflow-hidden relative group cursor-pointer">
                                {perfil.empresa.logo ? <img src={perfil.empresa.logo} alt="Logo empresa" className="w-full h-full object-cover" /> : <Icon icon="solar:user-circle-bold-duotone" className={`w-14 h-14 ${theme.icon}`} />}
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => document.getElementById('logoInput')?.click()}><Icon icon="solar:camera-add-bold" className="text-white w-8 h-8" /></div>
                                <input type="file" id="logoInput" className="hidden" accept="image/*" onChange={vm.handleLogoChange} />
                            </div>
                        </div>
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{perfil.nombre}</h1>
                            <p className="text-gray-500 dark:text-gray-400 font-medium">{perfil.email}</p>
                            <div className="flex items-center gap-3 mt-3">
                                <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold ${theme.bg} ${theme.textDark} uppercase tracking-wide`}>{perfil.rol.replace('ADMIN_', '').replace('USUARIO_', '').replace('_', ' ')}</span>
                                <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide ${vm.obtenerColorEstado()}`}>{vm.obtenerEstadoSuscripcion()}</span>
                            </div>
                        </div>
                    </div>
                </div>
                {perfil.empresa.tipoEmpresa === 'FORMAL' && usageStats && (
                    <div className={`bg-white dark:bg-[#111827] rounded-2xl shadow-sm border ${usageStats.limiteAlcanzado ? 'border-red-200 dark:border-red-900/50' : usageStats.alerta80 ? 'border-orange-200 dark:border-orange-900/50' : 'border-gray-100 dark:border-slate-800'} p-5`}>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <div className={`p-2 rounded-lg ${usageStats.limiteAlcanzado ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : usageStats.alerta80 ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}`}>
                                    <Icon icon="solar:document-bold-duotone" width="20" />
                                </div>
                                Uso de Comprobantes SUNAT
                            </h2>
                            <span className="text-sm text-gray-500 dark:text-gray-400">{usageStats.mesActual}</span>
                        </div>
                        <div className="mb-4">
                            <div className="flex justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {usageStats.comprobantesEmitidos} / {comprobantesIlimitados ? 'Ilimitado' : usageStats.limiteMaximo} comprobantes
                                </span>
                                {!comprobantesIlimitados && (
                                    <span className={`text-sm font-bold ${usageStats.limiteAlcanzado ? 'text-red-600 dark:text-red-400' : usageStats.alerta80 ? 'text-orange-600 dark:text-orange-400' : 'text-blue-600 dark:text-blue-400'}`}>{usageStats.porcentajeUso}%</span>
                                )}
                            </div>
                            {!comprobantesIlimitados && (
                                <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3">
                                    <div className={`h-3 rounded-full transition-all duration-500 ${usageStats.limiteAlcanzado ? 'bg-red-500' : usageStats.alerta80 ? 'bg-orange-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(usageStats.porcentajeUso, 100)}%` }}></div>
                                </div>
                            )}
                            {(usageStats.facturasYBoletas !== undefined || usageStats.guiasRemision !== undefined) && (
                                <div className="flex gap-4 mt-2">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">Facturas/Boletas: <span className="font-semibold text-gray-700 dark:text-gray-200">{usageStats.facturasYBoletas ?? 0}</span></span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">Guías de Remisión: <span className="font-semibold text-gray-700 dark:text-gray-200">{usageStats.guiasRemision ?? 0}</span></span>
                                </div>
                            )}
                        </div>
                        {!comprobantesIlimitados && usageStats.limiteAlcanzado && (
                            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl p-4 flex items-start gap-3">
                                <Icon icon="solar:danger-triangle-bold" className="text-red-500 text-xl flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-bold text-red-700 dark:text-red-400">Límite de comprobantes alcanzado</p>
                                    <p className="text-sm text-red-600 dark:text-red-500 mt-1">Has alcanzado el máximo de {usageStats.limiteMaximo} comprobantes de tu plan "{usageStats.plan}". Para continuar emitiendo, contacta a soporte.</p>
                                </div>
                            </div>
                        )}
                        {!comprobantesIlimitados && usageStats.alerta80 && !usageStats.limiteAlcanzado && (
                            <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-900/30 rounded-xl p-4 flex items-start gap-3">
                                <Icon icon="solar:bell-bold" className="text-orange-500 text-xl flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-bold text-orange-700 dark:text-orange-400">Atención: 80% del límite utilizado</p>
                                    <p className="text-sm text-orange-600 dark:text-orange-500 mt-1">Te quedan {usageStats.restantes} comprobantes disponibles este mes.</p>
                                </div>
                            </div>
                        )}
                        {comprobantesIlimitados ? (
                            <p className="text-sm text-gray-500 dark:text-gray-400">Plan sin límite de comprobantes este mes.</p>
                        ) : (
                            !usageStats.alerta80 && !usageStats.limiteAlcanzado && (<p className="text-sm text-gray-500 dark:text-gray-400">Te quedan <span className="font-bold text-blue-600 dark:text-blue-400">{usageStats.restantes}</span> comprobantes disponibles este mes.</p>)
                        )}
                    </div>
                )}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-gray-200/60 dark:border-slate-800 p-4">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2"><div className={`p-2 ${theme.bg} rounded-lg ${theme.text}`}><Icon icon="solar:user-id-bold-duotone" width="20" /></div>Información Personal</h2>
                        <div className="space-y-4">
                            <Field label="Nombre completo"><p className="text-gray-700 dark:text-gray-300 font-medium text-sm">{perfil.nombre}</p></Field>
                            <Field label="Email"><p className="text-gray-700 dark:text-gray-300 font-medium text-sm">{perfil.email}</p></Field>
                            {perfil.celular && <Field label="Celular"><p className="text-gray-700 dark:text-gray-300 font-medium text-sm">{perfil.celular}</p></Field>}
                            {perfil.telefono && <Field label="Teléfono"><p className="text-gray-700 dark:text-gray-300 font-medium text-sm">{perfil.telefono}</p></Field>}
                            <Field label="Estado"><span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-bold ${perfil.estado === 'ACTIVO' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>{perfil.estado}</span></Field>
                        </div>
                    </div>
                    <div className="lg:col-span-2 overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm dark:border-emerald-900/30 dark:bg-[#111827]">
                        <div className="relative border-b border-emerald-100/70 bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-5 dark:border-emerald-900/30 dark:from-emerald-950/30 dark:via-[#111827] dark:to-sky-950/20">
                            <div className="absolute right-5 top-5 hidden rounded-full border border-emerald-200 bg-white/80 px-3 py-1 text-xs font-bold text-emerald-700 shadow-sm dark:border-emerald-800 dark:bg-slate-900/70 dark:text-emerald-300 sm:inline-flex">
                                WhatsApp Cloud API
                            </div>
                            <div className="flex items-start gap-3 pr-0 sm:pr-40">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
                                    <Icon icon="mdi:whatsapp" width={24} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-gray-950 dark:text-white">Envío automático por WhatsApp</h2>
                                    <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-400">
                                        Define si los comprobantes se envían con el número oficial de la plataforma o con el número propio de esta empresa.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-4 p-5 lg:grid-cols-[1.1fr_0.9fr]">
                            <div className="space-y-4">
                                <div className="grid gap-3 md:grid-cols-3">
                                    {[
                                        { value: 'PLATFORM', title: 'Plataforma', icon: 'solar:cloud-bold-duotone', description: 'Falconext/Krezka envía por ti.' },
                                        { value: 'EMPRESA', title: 'Propio', icon: 'solar:smartphone-bold-duotone', description: 'Usa el número de Meta de la empresa.' },
                                        { value: 'DISABLED', title: 'Desactivado', icon: 'solar:close-circle-bold-duotone', description: 'Bloquea envíos automáticos.' },
                                    ].map(option => {
                                        const selected = whatsAppForm.provider === option.value;
                                        return (
                                            <button
                                                key={option.value}
                                                type="button"
                                                onClick={() => vm.setWhatsAppProvider(option.value as 'PLATFORM' | 'EMPRESA' | 'DISABLED')}
                                                className={`rounded-2xl border p-4 text-left transition-all ${
                                                    selected
                                                        ? 'border-emerald-400 bg-emerald-50 shadow-sm shadow-emerald-500/10 dark:border-emerald-700 dark:bg-emerald-950/20'
                                                        : 'border-gray-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/40 dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-emerald-900/50'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${selected ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-gray-400'}`}>
                                                        <Icon icon={option.icon} width={19} />
                                                    </span>
                                                    {selected && <Icon icon="solar:check-circle-bold" className="text-emerald-500" width={20} />}
                                                </div>
                                                <p className="mt-3 text-sm font-black text-gray-950 dark:text-white">{option.title}</p>
                                                <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">{option.description}</p>
                                            </button>
                                        );
                                    })}
                                </div>

                                {whatsAppForm.provider === 'EMPRESA' && (
                                    <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/40">
                                        <div className="mb-4 flex items-center justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-black text-gray-950 dark:text-white">Credenciales propias de Meta</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">El token no se muestra por seguridad. Si escribes uno nuevo, se reemplaza.</p>
                                            </div>
                                            <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${perfil.empresa.whatsappApiTokenConfigured ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'}`}>
                                                {perfil.empresa.whatsappApiTokenConfigured ? 'Token configurado' : 'Sin token'}
                                            </span>
                                        </div>
                                        <div className="grid gap-3 md:grid-cols-2">
                                            <label className="space-y-1.5">
                                                <span className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Phone Number ID *</span>
                                                <input
                                                    value={whatsAppForm.phoneNumberId}
                                                    onChange={e => vm.updateWhatsAppField('phoneNumberId', e.target.value)}
                                                    placeholder="Ej. 123456789012345"
                                                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-emerald-900/30"
                                                />
                                            </label>
                                            <label className="space-y-1.5">
                                                <span className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">WhatsApp Business Account ID</span>
                                                <input
                                                    value={whatsAppForm.businessId}
                                                    onChange={e => vm.updateWhatsAppField('businessId', e.target.value)}
                                                    placeholder="Opcional, pero recomendado"
                                                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-emerald-900/30"
                                                />
                                            </label>
                                            <label className="space-y-1.5 md:col-span-2">
                                                <span className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Permanent Access Token</span>
                                                <input
                                                    value={whatsAppForm.apiToken}
                                                    onChange={e => vm.updateWhatsAppField('apiToken', e.target.value)}
                                                    type="password"
                                                    autoComplete="new-password"
                                                    placeholder={perfil.empresa.whatsappApiTokenConfigured ? 'Dejar vacío para conservar el token actual' : 'Pega aquí el token permanente de Meta'}
                                                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-emerald-900/30"
                                                />
                                            </label>
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="text-xs leading-5 text-gray-500 dark:text-gray-400">
                                        Estado actual: <span className="font-bold text-gray-800 dark:text-gray-200">{whatsAppForm.provider === 'DISABLED' ? 'Desactivado' : whatsAppForm.provider === 'EMPRESA' ? 'Número propio' : 'Número de plataforma'}</span>
                                    </div>
                                    <button
                                        type="button"
                                        disabled={!whatsappConfigDirty || savingWhatsAppConfig}
                                        onClick={vm.handleWhatsAppConfigSave}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-emerald-600/15 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none dark:disabled:bg-slate-700"
                                    >
                                        <Icon icon={savingWhatsAppConfig ? 'svg-spinners:180-ring' : 'solar:diskette-bold'} width={18} />
                                        {savingWhatsAppConfig ? 'Guardando...' : 'Guardar WhatsApp'}
                                    </button>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4 dark:border-sky-900/30 dark:bg-sky-950/20">
                                <p className="flex items-center gap-2 text-sm font-black text-sky-900 dark:text-sky-200">
                                    <Icon icon="solar:info-circle-bold-duotone" width={19} />
                                    Qué necesitas de Meta
                                </p>
                                <div className="mt-4 space-y-3 text-sm leading-6 text-sky-900/80 dark:text-sky-100/75">
                                    <p><span className="font-black">1.</span> Crear o entrar a una app en Meta for Developers.</p>
                                    <p><span className="font-black">2.</span> Agregar el producto WhatsApp y vincular un número.</p>
                                    <p><span className="font-black">3.</span> Copiar el <span className="font-bold">Phone Number ID</span>.</p>
                                    <p><span className="font-black">4.</span> Crear un <span className="font-bold">System User</span> y generar un token permanente con permisos de WhatsApp.</p>
                                </div>
                                <div className="mt-4 rounded-xl border border-sky-200 bg-white/70 p-3 text-xs leading-5 text-sky-900 dark:border-sky-900/40 dark:bg-slate-950/40 dark:text-sky-100/75">
                                    Para empresas normales puedes dejar “Plataforma”. Para reseller white-label o corporativo con su propio número, usa “Propio”.
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-gray-200/60 dark:border-slate-800 p-4">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2"><div className={`p-2 ${theme.bg} rounded-lg ${theme.text}`}><Icon icon="solar:buildings-bold-duotone" width="20" /></div>Información de la Empresa</h2>
                        <div className="space-y-4">
                            <Field label="Razón Social"><p className="text-gray-700 dark:text-gray-300 font-medium text-sm">{perfil.empresa.razonSocial}</p></Field>
                            <Field label="Nombre Comercial"><p className="text-gray-700 dark:text-gray-300 font-medium text-sm">{perfil.empresa.nombreComercial}</p></Field>
                            <Field label="RUC"><p className="text-gray-700 dark:text-gray-300 font-medium text-sm">{perfil.empresa.ruc}</p></Field>
                            <Field label="Dirección"><p className="text-gray-700 dark:text-gray-300 font-medium text-sm">{perfil.empresa.direccion}</p></Field>
                            <Field label="Tipo de Empresa"><span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-bold ${perfil.empresa.tipoEmpresa === 'FORMAL' ? 'bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400' : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-400'}`}>{perfil.empresa.tipoEmpresa === 'FORMAL' ? 'Formal' : 'Informal'}</span></Field>
                            <Field label="Rubro"><p className="text-gray-700 dark:text-gray-300 font-medium text-sm">{perfil.empresa.rubro.nombre}</p></Field>
                            {perfil.empresa.ubicacion && <Field label="Ubicación"><p className="text-gray-700 dark:text-gray-300 font-medium text-sm">{perfil.empresa.ubicacion.distrito}, {perfil.empresa.ubicacion.provincia}, {perfil.empresa.ubicacion.departamento}</p></Field>}
                            <div className="pt-2 border-t border-gray-100 dark:border-slate-800">
                                <label className="flex items-start gap-3 p-3 rounded-lg border border-blue-100 dark:border-blue-900/30 bg-blue-50/40 dark:bg-blue-900/10 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(perfil.empresa.usaCodigoBarrasManual)}
                                        disabled={savingBarcodeConfig}
                                        onChange={(e) => vm.handleBarcodeToggle(e.target.checked)}
                                        className="mt-1 w-4 h-4 text-blue-600 dark:text-blue-500 rounded border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-blue-500"
                                    />
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">Habilitar código de barras en productos</p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Muestra el campo "Código de Barras" en el formulario de productos, incluso si el rubro no lo activa automáticamente.</p>
                                        {savingBarcodeConfig && <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Guardando configuración...</p>}
                                    </div>
                                </label>
                                <label className={`mt-3 flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                                    fefoPermitidoPorPlan
                                        ? 'border-violet-100 dark:border-violet-900/30 bg-violet-50/40 dark:bg-violet-900/10 cursor-pointer hover:bg-violet-50 dark:hover:bg-violet-900/20'
                                        : 'border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/60 opacity-70 cursor-not-allowed'
                                }`}>
                                    <input
                                        type="checkbox"
                                        checked={Boolean(perfil.empresa.usarPrecioLoteFefo)}
                                        disabled={savingFefoPriceConfig || !fefoPermitidoPorPlan}
                                        onChange={(e) => vm.handleFefoPriceToggle(e.target.checked)}
                                        className="mt-1 w-4 h-4 text-violet-600 dark:text-violet-500 rounded border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-violet-500"
                                    />
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">Usar precio por lote FEFO en facturación</p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Cuando esté activo, el precio sugerido al agregar productos en comprobantes se tomará del costo del lote FEFO activo.</p>
                                        {!fefoPermitidoPorPlan && (
                                            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">Disponible solo para planes Negocio y Corporativo.</p>
                                        )}
                                        {savingFefoPriceConfig && <p className="text-xs text-violet-600 dark:text-violet-400 mt-1">Guardando configuración...</p>}
                                    </div>
                                </label>
                                {usaLotesFarmaciaRubro(perfil.empresa.rubro?.nombre) && (
                                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-800">
                                        <p className="text-xs font-bold text-violet-700 dark:text-violet-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                            <Icon icon="solar:medical-kit-bold-duotone" width={14} />
                                            Director Técnico Q.F. (Libro Control DIGEMID)
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                className="flex-1 px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                                                placeholder="Q.F. Nombre Apellido — CQP 12345"
                                                value={directorInput ?? (perfil.empresa.directorTecnico ?? '')}
                                                onChange={e => setDirectorInput(e.target.value)}
                                            />
                                            <button
                                                disabled={savingDirectorTecnico || directorInput === null}
                                                onClick={() => vm.handleDirectorTecnicoSave(directorInput ?? '', () => setDirectorInput(null))}
                                                className="px-3 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-colors"
                                            >
                                                {savingDirectorTecnico ? '...' : 'Guardar'}
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Aparece en el Libro de Control de Psicotrópicos — DS 023-2001-SA</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-gray-200/60 dark:border-slate-800 p-4">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2"><div className={`p-2 ${theme.bg} rounded-lg ${theme.text}`}><Icon icon="solar:card-bold-duotone" width="20" /></div>Plan Actual</h2>
                        <div className="space-y-4">
                            <Field label="Nombre del Plan"><p className={`${theme.text} font-bold text-sm`}>{perfil.empresa.plan.nombre}</p></Field>
                            <Field label="Descripción"><p className="text-gray-700 dark:text-gray-300 font-medium text-sm">{perfil.empresa.plan.descripcion}</p></Field>
                            <Field label="Precio"><p className="text-gray-900 dark:text-white font-bold text-lg">S/ {Number(perfil.empresa?.plan?.costo).toFixed(2)}</p></Field>
                            <Field label="Duración"><p className="text-gray-700 dark:text-gray-300 font-medium text-sm">{perfil.empresa.plan.duracionDias} días</p></Field>
                            <Field label="Tipo de Plan"><span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-bold ${perfil.empresa.plan.esPrueba ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'}`}>{perfil.empresa.plan.esPrueba ? 'Versión de Prueba' : 'Plan Premium'}</span></Field>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-gray-200/60 dark:border-slate-800 p-4">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2"><div className={`p-2 ${theme.bg} rounded-lg ${theme.text}`}><Icon icon="solar:calendar-mark-bold-duotone" width="20" /></div>Suscripción Actual</h2>
                        <div className="space-y-4">
                            {perfil.empresa.fechaActivacion && <Field label="Fecha de Activación"><p className="text-gray-700 dark:text-gray-300 font-medium text-sm">{vm.formatearFechaSolo(perfil.empresa.fechaActivacion)}</p></Field>}
                            {perfil.empresa.fechaExpiracion && <Field label="Fecha de Expiración"><p className="text-gray-700 dark:text-gray-300 font-medium text-sm">{vm.formatearFechaSolo(perfil.empresa.fechaExpiracion)}</p></Field>}
                            <Field label="Estado actual"><span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-bold ${vm.obtenerColorEstado()}`}>{vm.obtenerEstadoSuscripcion()}</span></Field>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
