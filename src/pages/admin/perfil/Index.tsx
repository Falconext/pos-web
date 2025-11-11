import React, { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import { get } from '../../../utils/fetch'
import Loading from '../../../components/Loading'
import useAlertStore from '../../../zustand/alert'

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

  useEffect(() => {
    cargarPerfil()
  }, [])

  const cargarPerfil = async () => {
    try {
      setLoading(true)
      const response : any = await get('auth/perfil')
      
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

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatearFechaSolo = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
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

  console.log(perfil)

  return (
    <div className="p-6 px-8 space-y-6">
      {/* Header con información básica */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
            {perfil.empresa.logo ? (
              <img 
                src={perfil.empresa.logo} 
                alt="Logo empresa" 
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <Icon icon="mdi:account-circle" className="w-12 h-12 text-gray-400" />
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-800">{perfil.nombre}</h1>
            <p className="text-gray-600">{perfil.email}</p>
            <div className="flex items-center space-x-4 mt-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {perfil.rol.replace('ADMIN_', '').replace('_', ' ')}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${obtenerColorEstado()}`}>
                {obtenerEstadoSuscripcion()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Información Personal */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Icon icon="mdi:account" className="mr-2" />
            Información Personal
          </h2>
          
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-500">Nombre completo</label>
              <p className="text-gray-800">{perfil.nombre}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Email</label>
              <p className="text-gray-800">{perfil.email}</p>
            </div>
            
            {perfil.celular && (
              <div>
                <label className="text-sm font-medium text-gray-500">Celular</label>
                <p className="text-gray-800">{perfil.celular}</p>
              </div>
            )}
            
            {perfil.telefono && (
              <div>
                <label className="text-sm font-medium text-gray-500">Teléfono</label>
                <p className="text-gray-800">{perfil.telefono}</p>
              </div>
            )}
            
            <div>
              <label className="text-sm font-medium text-gray-500">Estado</label>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${perfil.estado === 'ACTIVO' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {perfil.estado}
              </span>
            </div>
            
            {/* <div>
              <label className="text-sm font-medium text-gray-500">Usuario desde</label>
              <p className="text-gray-800">{formatearFechaSolo(perfil.fechaCreacion)}</p>
            </div> */}
          </div>
        </div>

        {/* Información de la Empresa */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Icon icon="mdi:office-building" className="mr-2" />
            Información de la Empresa
          </h2>
          
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-500">Razón Social</label>
              <p className="text-gray-800">{perfil.empresa.razonSocial}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Nombre Comercial</label>
              <p className="text-gray-800">{perfil.empresa.nombreComercial}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">RUC</label>
              <p className="text-gray-800">{perfil.empresa.ruc}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Dirección</label>
              <p className="text-gray-800">{perfil.empresa.direccion}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Tipo de Empresa</label>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${perfil.empresa.tipoEmpresa === 'FORMAL' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                {perfil.empresa.tipoEmpresa === 'FORMAL' ? 'Formal' : 'Informal'}
              </span>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Rubro</label>
              <p className="text-gray-800">{perfil.empresa.rubro.nombre}</p>
            </div>

            {perfil.empresa.ubicacion && (
              <div>
                <label className="text-sm font-medium text-gray-500">Ubicación</label>
                <p className="text-gray-800">
                  {perfil.empresa.ubicacion.distrito}, {perfil.empresa.ubicacion.provincia}, {perfil.empresa.ubicacion.departamento}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Plan Actual */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Icon icon="mdi:card-account-details" className="mr-2" />
            Plan Actual
          </h2>
          
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-500">Nombre del Plan</label>
              <p className="text-gray-800 font-medium">{perfil.empresa.plan.nombre}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Descripción</label>
              <p className="text-gray-800">{perfil.empresa.plan.descripcion}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Precio</label>
              <p className="text-gray-800 font-medium">S/ {Number(perfil.empresa?.plan?.costo).toFixed(2)}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Duración</label>
              <p className="text-gray-800">{perfil.empresa.plan.duracionDias} días</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Tipo de Facturación</label>
              <p className="text-gray-800">{perfil.empresa.plan.tipoFacturacion}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Tipo de Plan</label>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${perfil.empresa.plan.esPrueba ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                {perfil.empresa.plan.esPrueba ? 'Versión de Prueba' : 'Plan Premium'}
              </span>
            </div>
          </div>
        </div>

        {/* Suscripción Actual */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Icon icon="mdi:calendar-clock" className="mr-2" />
            Suscripción Actual
          </h2>
          
          <div className="space-y-3">
            {perfil.empresa.fechaActivacion && (
              <div>
                <label className="text-sm font-medium text-gray-500">Fecha de Activación</label>
                <p className="text-gray-800">{formatearFechaSolo(perfil.empresa.fechaActivacion)}</p>
              </div>
            )}
            
            {perfil.empresa.fechaExpiracion && (
              <div>
                <label className="text-sm font-medium text-gray-500">Fecha de Expiración</label>
                <p className="text-gray-800">{formatearFechaSolo(perfil.empresa.fechaExpiracion)}</p>
              </div>
            )}
            
            <div>
              <label className="text-sm font-medium text-gray-500">Estado</label>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${obtenerColorEstado()}`}>
                {obtenerEstadoSuscripcion()}
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}