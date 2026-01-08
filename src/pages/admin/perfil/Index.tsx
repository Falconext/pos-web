import React, { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import { get } from '../../../utils/fetch'
import Loading from '../../../components/Loading'
import useAlertStore from '../../../zustand/alert'
import useEmpresasStore from '@/zustand/empresas'

interface PerfilData {
    id: number
    nombre: string
    email: string
    rol: string
    celular?: string
    telefono?: string
    empresaId: number
    estado: string
    fechaCreacion: string
    fechaActualizacion: string
    empresa: {
        id: number
        razonSocial: string
        nombreComercial: string
        direccion: string
        logo?: string
        ruc: string
        tipoEmpresa: string
        fechaCreacion: string
        fechaActivacion?: string
        fechaExpiracion?: string
        rubro: {
            id: number
            nombre: string
            descripcion: string
        }
        plan: {
            id: number
            nombre: string
            descripcion: string
            costo: number
            duracionDias: number
            tipoFacturacion: string
            esPrueba: boolean
            activo: boolean
        }
        departamento?: string
        provincia?: string
        distrito?: string
        ubicacion?: {
            codigo: string
            departamento: string
            provincia: string
            distrito: string
        }
    }
}

export default function PerfilIndex() {
    const [perfil, setPerfil] = useState<PerfilData | null>(null)
    const [loading, setLoading] = useState(true)
    const { alert } = useAlertStore()
    const [usageStats, setUsageStats] = useState<any>(null)

    useEffect(() => {
        cargarPerfil()
        cargarUsageStats()
    }, [])

    const cargarPerfil = async () => {
        try {
            setLoading(true)
            const response: any = await get('auth/perfil')

            if (response.code === 1) {
                setPerfil(response.data)
            } else {
                alert('Error al cargar el perfil', 'error')
            }
        } catch (error) {
            console.error('Error:', error)
            alert('Error al cargar el perfil', 'error')
        } finally {
            setLoading(false)
        }
    }

    const cargarUsageStats = async () => {
        try {
            const response: any = await get('comprobante/usage')
            if (response && response.data) {
                setUsageStats(response.data)
            } else if (response && !response.error) {
                // Response might be direct data
                setUsageStats(response)
            }
        } catch (error) {
            console.error('Error loading usage stats:', error)
        }
    }

    const formatearFecha = (fecha: string) => {
        return new Date(fecha).toLocaleDateString('es-PE', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            try {
                // Call store action
                await useEmpresasStore.getState().actualizarMiEmpresa({ logo: file });
                useAlertStore.getState().alert("Logo actualizado correctamente", "success");
                // Refresh profile to show new logo
                cargarPerfil();
            } catch (error) {
                console.error(error);
                useAlertStore.getState().alert("Error al actualizar logo", "error");
            }
        }
    };

    const formatearFechaSolo = (fecha: string) => {
        return new Date(fecha).toLocaleDateString('es-PE', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    // Si es Super Admin, mostrar vista simplificada
    if (perfil?.rol === 'ADMIN_SISTEMA') {
        return (
            <div className="p-6 max-w-4xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">Perfil de Administrador del Sistema</h1>
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-2xl">
                            {perfil.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold">{perfil.nombre}</h2>
                            <p className="text-gray-500">{perfil.email}</p>
                            <span className="inline-block mt-1 bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-bold">SUPER ADMIN</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-1">Rol</h3>
                            <p className="font-medium text-gray-900">{perfil.rol}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-1">Estado</h3>
                            <p className="font-medium text-green-600">{perfil.estado}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-1">Fecha Creación</h3>
                            <p className="font-medium text-gray-900">{formatearFecha(perfil.fechaCreacion)}</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    const obtenerEstadoSuscripcion = () => {
        if (!perfil?.empresa.fechaExpiracion) return 'Sin información'

        const fechaExp = new Date(perfil.empresa.fechaExpiracion)
        const hoy = new Date()

        if (fechaExp < hoy) {
            return 'Expirada'
        } else {
            const diasRestantes = Math.ceil((fechaExp.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
            if (diasRestantes <= 7) {
                return `Expira en ${diasRestantes} días`
            }
            return 'Activa'
        }
    }

    const obtenerColorEstado = () => {
        const estado = obtenerEstadoSuscripcion()
        if (estado === 'Expirada') return 'text-red-600 bg-red-100'
        if (estado.includes('Expira en')) return 'text-orange-600 bg-orange-100'
        return 'text-green-600 bg-green-100'
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <Loading />
            </div>
        )
    }

    if (!perfil) {
        return (
            <div className="text-center text-gray-500 py-8">
                No se pudo cargar la información del perfil
            </div>
        )
    }

    const isSystemAdmin = perfil?.rol === 'ADMIN_SISTEMA'
    const theme = {
        bg: isSystemAdmin ? 'bg-indigo-50' : 'bg-blue-50',
        text: isSystemAdmin ? 'text-indigo-600' : 'text-blue-600',
        textDark: isSystemAdmin ? 'text-indigo-700' : 'text-blue-700',
        border: isSystemAdmin ? 'border-indigo-100' : 'border-blue-100',
        icon: isSystemAdmin ? 'text-indigo-300' : 'text-blue-300',
    }

    return (
        <div className="min-h-screen px-2 pb-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Mi Perfil</h1>
                    <p className="text-sm text-gray-500 mt-1">Información de tu cuenta y empresa</p>
                </div>
            </div>

            <div className="space-y-4">
                {/* Header con información básica */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">

                    <div className="flex items-center space-x-5">
                        <div className={`w-24 h-24 rounded-full p-1 border-2 ${theme.border} bg-white`}>
                            <div className="w-full h-full bg-gray-50 rounded-full flex items-center justify-center overflow-hidden relative group cursor-pointer">
                                {perfil.empresa.logo ? (
                                    <img
                                        src={perfil.empresa.logo}
                                        alt="Logo empresa"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <Icon icon="solar:user-circle-bold-duotone" className={`w-14 h-14 ${theme.icon}`} />
                                )}

                                {/* Overlay for upload */}
                                <div
                                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => document.getElementById('logoInput')?.click()}
                                >
                                    <Icon icon="solar:camera-add-bold" className="text-white w-8 h-8" />
                                </div>
                                <input
                                    type="file"
                                    id="logoInput"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleLogoChange}
                                />
                            </div>
                        </div>
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{perfil.nombre}</h1>
                            <p className="text-gray-500 font-medium">{perfil.email}</p>
                            <div className="flex items-center gap-3 mt-3">
                                <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold ${theme.bg} ${theme.textDark} uppercase tracking-wide`}>
                                    {perfil.rol.replace('ADMIN_', '').replace('USUARIO_', '').replace('_', ' ')}
                                </span>
                                <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide ${obtenerColorEstado()}`}>
                                    {obtenerEstadoSuscripcion()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Usage Stats Card - Only for FORMAL companies */}
                {perfil.empresa.tipoEmpresa === 'FORMAL' && usageStats && (
                    <div className={`bg-white rounded-2xl shadow-sm border ${usageStats.limiteAlcanzado ? 'border-red-200' : usageStats.alerta80 ? 'border-orange-200' : 'border-gray-100'} p-5`}>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <div className={`p-2 rounded-lg ${usageStats.limiteAlcanzado ? 'bg-red-100 text-red-600' : usageStats.alerta80 ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                                    <Icon icon="solar:document-bold-duotone" width="20" />
                                </div>
                                Uso de Comprobantes SUNAT
                            </h2>
                            <span className="text-sm text-gray-500">{usageStats.mesActual}</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-4">
                            <div className="flex justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700">
                                    {usageStats.comprobantesEmitidos} / {usageStats.limiteMaximo} comprobantes
                                </span>
                                <span className={`text-sm font-bold ${usageStats.limiteAlcanzado ? 'text-red-600' : usageStats.alerta80 ? 'text-orange-600' : 'text-blue-600'}`}>
                                    {usageStats.porcentajeUso}%
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                                <div
                                    className={`h-3 rounded-full transition-all duration-500 ${usageStats.limiteAlcanzado ? 'bg-red-500' : usageStats.alerta80 ? 'bg-orange-500' : 'bg-blue-500'}`}
                                    style={{ width: `${Math.min(usageStats.porcentajeUso, 100)}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* Alert messages */}
                        {usageStats.limiteAlcanzado && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                                <Icon icon="solar:danger-triangle-bold" className="text-red-500 text-xl flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-bold text-red-700">Límite de comprobantes alcanzado</p>
                                    <p className="text-sm text-red-600 mt-1">
                                        Has alcanzado el máximo de {usageStats.limiteMaximo} comprobantes de tu plan "{usageStats.plan}".
                                        Para continuar emitiendo, contacta a soporte para actualizar tu plan.
                                    </p>
                                </div>
                            </div>
                        )}

                        {usageStats.alerta80 && !usageStats.limiteAlcanzado && (
                            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
                                <Icon icon="solar:bell-bold" className="text-orange-500 text-xl flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-bold text-orange-700">Atención: 80% del límite utilizado</p>
                                    <p className="text-sm text-orange-600 mt-1">
                                        Te quedan {usageStats.restantes} comprobantes disponibles este mes.
                                        Considera actualizar tu plan si necesitas emitir más.
                                    </p>
                                </div>
                            </div>
                        )}

                        {!usageStats.alerta80 && !usageStats.limiteAlcanzado && (
                            <p className="text-sm text-gray-500">
                                Te quedan <span className="font-bold text-blue-600">{usageStats.restantes}</span> comprobantes disponibles este mes.
                            </p>
                        )}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Información Personal */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 p-4">
                        <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                            <div className={`p-2 ${theme.bg} rounded-lg ${theme.text}`}>
                                <Icon icon="solar:user-id-bold-duotone" width="20" />
                            </div>
                            Información Personal
                        </h2>

                        <div className="space-y-4">
                            <div className="pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Nombre completo</label>
                                <p className="text-gray-700 font-medium text-sm">{perfil.nombre}</p>
                            </div>

                            <div className="pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Email</label>
                                <p className="text-gray-700 font-medium text-sm">{perfil.email}</p>
                            </div>

                            {perfil.celular && (
                                <div className="pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Celular</label>
                                    <p className="text-gray-700 font-medium text-sm">{perfil.celular}</p>
                                </div>
                            )}

                            {perfil.telefono && (
                                <div className="pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Teléfono</label>
                                    <p className="text-gray-700 font-medium text-sm">{perfil.telefono}</p>
                                </div>
                            )}

                            <div className="pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Estado</label>
                                <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-bold ${perfil.estado === 'ACTIVO' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                                    {perfil.estado}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Información de la Empresa */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 p-4">
                        <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                            <div className={`p-2 ${theme.bg} rounded-lg ${theme.text}`}>
                                <Icon icon="solar:buildings-bold-duotone" width="20" />
                            </div>
                            Información de la Empresa
                        </h2>

                        <div className="space-y-4">
                            <div className="pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Razón Social</label>
                                <p className="text-gray-700 font-medium text-sm">{perfil.empresa.razonSocial}</p>
                            </div>

                            <div className="pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Nombre Comercial</label>
                                <p className="text-gray-700 font-medium text-sm">{perfil.empresa.nombreComercial}</p>
                            </div>

                            <div className="pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">RUC</label>
                                <p className="text-gray-700 font-medium text-sm">{perfil.empresa.ruc}</p>
                            </div>

                            <div className="pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Dirección</label>
                                <p className="text-gray-700 font-medium text-sm">{perfil.empresa.direccion}</p>
                            </div>

                            <div className="pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Tipo de Empresa</label>
                                <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-bold ${perfil.empresa.tipoEmpresa === 'FORMAL' ? 'bg-sky-50 text-sky-700' : 'bg-gray-100 text-gray-700'}`}>
                                    {perfil.empresa.tipoEmpresa === 'FORMAL' ? 'Formal' : 'Informal'}
                                </span>
                            </div>

                            <div className="pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Rubro</label>
                                <p className="text-gray-700 font-medium text-sm">{perfil.empresa.rubro.nombre}</p>
                            </div>

                            {perfil.empresa.ubicacion && (
                                <div className="pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Ubicación</label>
                                    <p className="text-gray-700 font-medium text-sm">
                                        {perfil.empresa.ubicacion.distrito}, {perfil.empresa.ubicacion.provincia}, {perfil.empresa.ubicacion.departamento}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Plan Actual */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 p-4">
                        <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                            <div className={`p-2 ${theme.bg} rounded-lg ${theme.text}`}>
                                <Icon icon="solar:card-bold-duotone" width="20" />
                            </div>
                            Plan Actual
                        </h2>

                        <div className="space-y-4">
                            <div className="pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Nombre del Plan</label>
                                <p className={`${theme.text} font-bold text-sm`}>{perfil.empresa.plan.nombre}</p>
                            </div>

                            <div className="pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Descripción</label>
                                <p className="text-gray-700 font-medium text-sm">{perfil.empresa.plan.descripcion}</p>
                            </div>

                            <div className="pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Precio</label>
                                <p className="text-gray-900 font-bold text-lg">S/ {Number(perfil.empresa?.plan?.costo).toFixed(2)}</p>
                            </div>

                            <div className="pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Duración</label>
                                <p className="text-gray-700 font-medium text-sm">{perfil.empresa.plan.duracionDias} días</p>
                            </div>

                            <div className="pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Tipo de Facturación</label>
                                <p className="text-gray-700 font-medium text-sm">{perfil.empresa.plan.tipoFacturacion}</p>
                            </div>

                            <div className="pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Tipo de Plan</label>
                                <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-bold ${perfil.empresa.plan.esPrueba ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                                    {perfil.empresa.plan.esPrueba ? 'Versión de Prueba' : 'Plan Premium'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Suscripción Actual */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 p-4">
                        <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                            <div className={`p-2 ${theme.bg} rounded-lg ${theme.text}`}>
                                <Icon icon="solar:calendar-mark-bold-duotone" width="20" />
                            </div>
                            Suscripción Actual
                        </h2>

                        <div className="space-y-4">
                            {perfil.empresa.fechaActivacion && (
                                <div className="pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Fecha de Activación</label>
                                    <p className="text-gray-700 font-medium text-sm">{formatearFechaSolo(perfil.empresa.fechaActivacion)}</p>
                                </div>
                            )}

                            {perfil.empresa.fechaExpiracion && (
                                <div className="pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Fecha de Expiración</label>
                                    <p className="text-gray-700 font-medium text-sm">{formatearFechaSolo(perfil.empresa.fechaExpiracion)}</p>
                                </div>
                            )}

                            <div className="pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Estado actual</label>
                                <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-bold ${obtenerColorEstado()}`}>
                                    {obtenerEstadoSuscripcion()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
