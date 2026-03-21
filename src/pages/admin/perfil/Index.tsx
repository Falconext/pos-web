import { usePerfilViewModel } from '@/features/admin/perfil/usePerfilViewModel';
import { Icon } from '@iconify/react';
import Loading from '@/components/Loading';

export default function PerfilIndex() {
    const vm = usePerfilViewModel();
    const { perfil, loading, usageStats } = vm;

    if (loading) return <div className="flex justify-center items-center h-96"><Loading /></div>;
    if (!perfil) return <div className="text-center text-gray-500 py-8">No se pudo cargar la información del perfil</div>;

    const isSystemAdmin = perfil?.rol === 'ADMIN_SISTEMA';
    const theme = {
        bg: isSystemAdmin ? 'bg-indigo-50' : 'bg-blue-50',
        text: isSystemAdmin ? 'text-indigo-600' : 'text-blue-600',
        textDark: isSystemAdmin ? 'text-indigo-700' : 'text-blue-700',
        border: isSystemAdmin ? 'border-indigo-100' : 'border-blue-100',
        icon: isSystemAdmin ? 'text-indigo-300' : 'text-blue-300',
    };

    if (perfil?.rol === 'ADMIN_SISTEMA') {
        return (
            <div className="p-6 max-w-4xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">Perfil de Administrador del Sistema</h1>
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center gap-4 mb-6"><div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-2xl">{perfil.nombre.charAt(0).toUpperCase()}</div><div><h2 className="text-xl font-semibold">{perfil.nombre}</h2><p className="text-gray-500">{perfil.email}</p><span className="inline-block mt-1 bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-bold">SUPER ADMIN</span></div></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div><h3 className="text-sm font-medium text-gray-500 mb-1">Rol</h3><p className="font-medium text-gray-900">{perfil.rol}</p></div><div><h3 className="text-sm font-medium text-gray-500 mb-1">Estado</h3><p className="font-medium text-green-600">{perfil.estado}</p></div><div><h3 className="text-sm font-medium text-gray-500 mb-1">Fecha Creación</h3><p className="font-medium text-gray-900">{vm.formatearFecha(perfil.fechaCreacion)}</p></div></div>
                </div>
            </div>
        );
    }

    const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
        <div className="pb-3 border-b border-gray-50 last:border-0 last:pb-0"><label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">{label}</label>{children}</div>
    );

    return (
        <div className="min-h-screen px-2 pb-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6"><div><h1 className="text-2xl font-bold text-gray-900 tracking-tight">Mi Perfil</h1><p className="text-sm text-gray-500 mt-1">Información de tu cuenta y empresa</p></div></div>
            <div className="space-y-4">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                    <div className="flex items-center space-x-5">
                        <div className={`w-24 h-24 rounded-full p-1 border-2 ${theme.border} bg-white`}>
                            <div className="w-full h-full bg-gray-50 rounded-full flex items-center justify-center overflow-hidden relative group cursor-pointer">
                                {perfil.empresa.logo ? <img src={perfil.empresa.logo} alt="Logo empresa" className="w-full h-full object-cover" /> : <Icon icon="solar:user-circle-bold-duotone" className={`w-14 h-14 ${theme.icon}`} />}
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => document.getElementById('logoInput')?.click()}><Icon icon="solar:camera-add-bold" className="text-white w-8 h-8" /></div>
                                <input type="file" id="logoInput" className="hidden" accept="image/*" onChange={vm.handleLogoChange} />
                            </div>
                        </div>
                        <div className="flex-1"><h1 className="text-2xl font-bold text-gray-900 tracking-tight">{perfil.nombre}</h1><p className="text-gray-500 font-medium">{perfil.email}</p><div className="flex items-center gap-3 mt-3"><span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold ${theme.bg} ${theme.textDark} uppercase tracking-wide`}>{perfil.rol.replace('ADMIN_', '').replace('USUARIO_', '').replace('_', ' ')}</span><span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide ${vm.obtenerColorEstado()}`}>{vm.obtenerEstadoSuscripcion()}</span></div></div>
                    </div>
                </div>
                {perfil.empresa.tipoEmpresa === 'FORMAL' && usageStats && (
                    <div className={`bg-white rounded-2xl shadow-sm border ${usageStats.limiteAlcanzado ? 'border-red-200' : usageStats.alerta80 ? 'border-orange-200' : 'border-gray-100'} p-5`}>
                        <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><div className={`p-2 rounded-lg ${usageStats.limiteAlcanzado ? 'bg-red-100 text-red-600' : usageStats.alerta80 ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}><Icon icon="solar:document-bold-duotone" width="20" /></div>Uso de Comprobantes SUNAT</h2><span className="text-sm text-gray-500">{usageStats.mesActual}</span></div>
                        <div className="mb-4"><div className="flex justify-between mb-2"><span className="text-sm font-medium text-gray-700">{usageStats.comprobantesEmitidos} / {usageStats.limiteMaximo} comprobantes</span><span className={`text-sm font-bold ${usageStats.limiteAlcanzado ? 'text-red-600' : usageStats.alerta80 ? 'text-orange-600' : 'text-blue-600'}`}>{usageStats.porcentajeUso}%</span></div><div className="w-full bg-gray-200 rounded-full h-3"><div className={`h-3 rounded-full transition-all duration-500 ${usageStats.limiteAlcanzado ? 'bg-red-500' : usageStats.alerta80 ? 'bg-orange-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(usageStats.porcentajeUso, 100)}%` }}></div></div></div>
                        {usageStats.limiteAlcanzado && (<div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3"><Icon icon="solar:danger-triangle-bold" className="text-red-500 text-xl flex-shrink-0 mt-0.5" /><div><p className="text-sm font-bold text-red-700">Límite de comprobantes alcanzado</p><p className="text-sm text-red-600 mt-1">Has alcanzado el máximo de {usageStats.limiteMaximo} comprobantes de tu plan "{usageStats.plan}". Para continuar emitiendo, contacta a soporte.</p></div></div>)}
                        {usageStats.alerta80 && !usageStats.limiteAlcanzado && (<div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3"><Icon icon="solar:bell-bold" className="text-orange-500 text-xl flex-shrink-0 mt-0.5" /><div><p className="text-sm font-bold text-orange-700">Atención: 80% del límite utilizado</p><p className="text-sm text-orange-600 mt-1">Te quedan {usageStats.restantes} comprobantes disponibles este mes.</p></div></div>)}
                        {!usageStats.alerta80 && !usageStats.limiteAlcanzado && (<p className="text-sm text-gray-500">Te quedan <span className="font-bold text-blue-600">{usageStats.restantes}</span> comprobantes disponibles este mes.</p>)}
                    </div>
                )}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 p-4">
                        <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2"><div className={`p-2 ${theme.bg} rounded-lg ${theme.text}`}><Icon icon="solar:user-id-bold-duotone" width="20" /></div>Información Personal</h2>
                        <div className="space-y-4">
                            <Field label="Nombre completo"><p className="text-gray-700 font-medium text-sm">{perfil.nombre}</p></Field>
                            <Field label="Email"><p className="text-gray-700 font-medium text-sm">{perfil.email}</p></Field>
                            {perfil.celular && <Field label="Celular"><p className="text-gray-700 font-medium text-sm">{perfil.celular}</p></Field>}
                            {perfil.telefono && <Field label="Teléfono"><p className="text-gray-700 font-medium text-sm">{perfil.telefono}</p></Field>}
                            <Field label="Estado"><span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-bold ${perfil.estado === 'ACTIVO' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{perfil.estado}</span></Field>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 p-4">
                        <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2"><div className={`p-2 ${theme.bg} rounded-lg ${theme.text}`}><Icon icon="solar:buildings-bold-duotone" width="20" /></div>Información de la Empresa</h2>
                        <div className="space-y-4">
                            <Field label="Razón Social"><p className="text-gray-700 font-medium text-sm">{perfil.empresa.razonSocial}</p></Field>
                            <Field label="Nombre Comercial"><p className="text-gray-700 font-medium text-sm">{perfil.empresa.nombreComercial}</p></Field>
                            <Field label="RUC"><p className="text-gray-700 font-medium text-sm">{perfil.empresa.ruc}</p></Field>
                            <Field label="Dirección"><p className="text-gray-700 font-medium text-sm">{perfil.empresa.direccion}</p></Field>
                            <Field label="Tipo de Empresa"><span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-bold ${perfil.empresa.tipoEmpresa === 'FORMAL' ? 'bg-sky-50 text-sky-700' : 'bg-gray-100 text-gray-700'}`}>{perfil.empresa.tipoEmpresa === 'FORMAL' ? 'Formal' : 'Informal'}</span></Field>
                            <Field label="Rubro"><p className="text-gray-700 font-medium text-sm">{perfil.empresa.rubro.nombre}</p></Field>
                            {perfil.empresa.ubicacion && <Field label="Ubicación"><p className="text-gray-700 font-medium text-sm">{perfil.empresa.ubicacion.distrito}, {perfil.empresa.ubicacion.provincia}, {perfil.empresa.ubicacion.departamento}</p></Field>}
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 p-4">
                        <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2"><div className={`p-2 ${theme.bg} rounded-lg ${theme.text}`}><Icon icon="solar:card-bold-duotone" width="20" /></div>Plan Actual</h2>
                        <div className="space-y-4">
                            <Field label="Nombre del Plan"><p className={`${theme.text} font-bold text-sm`}>{perfil.empresa.plan.nombre}</p></Field>
                            <Field label="Descripción"><p className="text-gray-700 font-medium text-sm">{perfil.empresa.plan.descripcion}</p></Field>
                            <Field label="Precio"><p className="text-gray-900 font-bold text-lg">S/ {Number(perfil.empresa?.plan?.costo).toFixed(2)}</p></Field>
                            <Field label="Duración"><p className="text-gray-700 font-medium text-sm">{perfil.empresa.plan.duracionDias} días</p></Field>
                            <Field label="Tipo de Plan"><span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-bold ${perfil.empresa.plan.esPrueba ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>{perfil.empresa.plan.esPrueba ? 'Versión de Prueba' : 'Plan Premium'}</span></Field>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 p-4">
                        <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2"><div className={`p-2 ${theme.bg} rounded-lg ${theme.text}`}><Icon icon="solar:calendar-mark-bold-duotone" width="20" /></div>Suscripción Actual</h2>
                        <div className="space-y-4">
                            {perfil.empresa.fechaActivacion && <Field label="Fecha de Activación"><p className="text-gray-700 font-medium text-sm">{vm.formatearFechaSolo(perfil.empresa.fechaActivacion)}</p></Field>}
                            {perfil.empresa.fechaExpiracion && <Field label="Fecha de Expiración"><p className="text-gray-700 font-medium text-sm">{vm.formatearFechaSolo(perfil.empresa.fechaExpiracion)}</p></Field>}
                            <Field label="Estado actual"><span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-bold ${vm.obtenerColorEstado()}`}>{vm.obtenerEstadoSuscripcion()}</span></Field>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
