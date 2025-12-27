import { useState, useEffect, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react/dist/iconify.js';
import Button from '@/components/Button';
import InputPro from '@/components/InputPro';
import Select from '@/components/Select';
import { useEmpresasStore } from '@/zustand/empresas';
import { useExtentionsStore } from '@/zustand/extentions';
import useAlertStore from '@/zustand/alert';
import { useClientsStore } from '@/zustand/clients';

interface FormData {
  ruc: string;
  razonSocial: string;
  direccion: string;
  logo?: any;
  planId?: number;
  esPrueba: boolean;
  tipoEmpresa: 'FORMAL' | 'INFORMAL';
  departamento: string;
  provincia: string;
  distrito: string;
  ubigeo: string;
  rubroId: number;
  nombreComercial: string;
  fechaActivacion: string;
  fechaExpiracion?: string;
  providerToken?: string;
  providerId?: string;
  usuario: {
    nombre: string;
    email: string;
    password: string;
    dni: string;
    celular: string;
  };
}

interface FormErrors {
  [key: string]: string;
}

const CreateEmpresa = () => {
  const navigate = useNavigate();
  const { success } = useAlertStore();
  const {
    loading,
    error,
    crearEmpresa
  } = useEmpresasStore();
  const {
    planes,
    rubros,
    ubigeos,
    getRubros,
    getUbigeos,
    getPlanes
  } = useExtentionsStore();

  // Estado del formulario
  const [formData, setFormData] = useState<FormData>({
    ruc: '',
    razonSocial: '',
    direccion: '',
    tipoEmpresa: 'FORMAL',
    esPrueba: false,
    departamento: '',
    provincia: '',
    distrito: '',
    logo: '',
    ubigeo: '',
    rubroId: 0,
    nombreComercial: '',
    fechaActivacion: new Date().toISOString().split('T')[0],
    fechaExpiracion: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    usuario: {
      nombre: '',
      email: '',
      password: '',
      dni: '',
      celular: ''
    }
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [searchingRuc, setSearchingRuc] = useState(false);
  const [ubigeoSelected, setUbigeoSelected] = useState<any>('');
  // Cargar catálogos desde extensiones al montar el componente
  useEffect(() => {
    getRubros();
    getUbigeos();
    getPlanes();
  }, [getRubros, getUbigeos, getPlanes]);

  console.log(rubros)
  // Funciones de clientes
  const { getClientFromDoc } = useClientsStore();

  // Redirigir cuando se cree exitosamente
  useEffect(() => {
    if (success === true && !isSubmitting) {
      navigate('/administrador/empresas');
    }
  }, [success, navigate, isSubmitting]);

  // Validar formulario
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validar empresa
    if (!formData.ruc) newErrors.ruc = 'RUC es requerido';
    if (!formData.razonSocial) newErrors.razonSocial = 'Razón social es requerida';
    if (!formData.direccion) newErrors.direccion = 'Dirección es requerida';
    if (!formData.rubroId) newErrors.rubroId = 'Rubro es requerido';
    if (!formData.nombreComercial) newErrors.nombreComercial = 'Nombre comercial es requerido';
    if (!formData.ubigeo) newErrors.ubigeo = 'Ubigeo es requerido';

    // Validar usuario administrador
    if (!formData.usuario.nombre) newErrors['usuario.nombre'] = 'Nombre del administrador es requerido';
    if (!formData.usuario.email) newErrors['usuario.email'] = 'Email del administrador es requerido';
    if (!formData.usuario.password) newErrors['usuario.password'] = 'Contraseña es requerida';
    if (!formData.usuario.dni) newErrors['usuario.dni'] = 'DNI del administrador es requerido';
    if (!formData.usuario.celular) newErrors['usuario.celular'] = 'Celular del administrador es requerido';

    // Validar formato email
    if (formData.usuario.email && !/\S+@\S+\.\S+/.test(formData.usuario.email)) {
      newErrors['usuario.email'] = 'Email inválido';
    }

    // Validar RUC (11 dígitos)
    if (formData.ruc && formData.ruc.length !== 11) {
      newErrors.ruc = 'RUC debe tener 11 dígitos';
    }

    // Validar DNI (8 dígitos)
    if (formData.usuario.dni && formData.usuario.dni.length !== 8) {
      newErrors['usuario.dni'] = 'DNI debe tener 8 dígitos';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar cambios en inputs
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name.startsWith('usuario.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        usuario: {
          ...prev.usuario,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Limpiar error si existe
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Manejar cambio de tipo de empresa
  const handleTipoEmpresaChange = (id: any, value: string) => {
    setFormData(prev => ({
      ...prev,
      tipoEmpresa: id as 'FORMAL' | 'INFORMAL',
      fechaExpiracion: recalcularFechaExpiracion(prev.esPrueba, id, prev.planId)
    }));
  };

  // Manejar cambio de versión de prueba
  const handleEsPruebaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const esPrueba = e.target.checked;
    setFormData(prev => ({
      ...prev,
      esPrueba,
      fechaExpiracion: recalcularFechaExpiracion(esPrueba, prev.tipoEmpresa, prev.planId)
    }));
  };

  // Manejar selección de plan
  const handlePlanSelect = (planId: number) => {
    setFormData(prev => ({
      ...prev,
      planId,
      fechaExpiracion: recalcularFechaExpiracion(prev.esPrueba, prev.tipoEmpresa, planId)
    }));

    if (errors.planId) {
      setErrors(prev => ({
        ...prev,
        planId: ''
      }));
    }
  };

  // Manejar selects
  const handleSelectChange = (id: any, value: string, name: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: parseInt(id) || 0
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Manejar cambio de ubigeo
  const handleUbigeoChange = (id: any, value: string) => {
    const selectedUbigeo: any = ubigeos.find((u: any) => u.codigo === id);

    if (selectedUbigeo) {
      setFormData(prev => ({
        ...prev,
        ubigeo: selectedUbigeo.codigo,
        departamento: selectedUbigeo.departamento,
        provincia: selectedUbigeo.provincia,
        distrito: selectedUbigeo.distrito
      }));
    }
  };

  // Manejar archivo de logo
  const handleLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        const maxWidth = 300;
        const maxHeight = 300;
        let { width, height } = img;

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        ctx?.clearRect(0, 0, width, height);
        ctx?.drawImage(img, 0, 0, width, height);

        const base64String = canvas.toDataURL('image/png');
        setLogoPreview(base64String);
        setFormData(prev => ({
          ...prev,
          logo: base64String
        }));
      };

      img.src = URL.createObjectURL(file);
    }
  };

  // Buscar empresa por RUC
  const handleRucBlur = async () => {
    if (formData.ruc && formData.ruc.length === 11) {
      setSearchingRuc(true);
      try {
        const response = await getClientFromDoc(formData.ruc);
        if (response) {
          // Mapear datos de RENIEC al formulario
          const razonSocial = response.nombre_o_razon_social || response.razonSocial || '';
          const direccion = response.direccion_completa || response.direccion || '';
          const departamento = response.departamento || '';
          const provincia = response.provincia || '';
          const distrito = response.distrito || '';
          const ubigeo = response.ubigeo_sunat || '';

          // Buscar ubigeo en la lista para asignarlo
          const ubigeoEncontrado: any = ubigeos.find((u: any) => u.codigo === ubigeo);
          setUbigeoSelected(ubigeoEncontrado);
          setFormData(prev => ({
            ...prev,
            razonSocial,
            nombreComercial: razonSocial,
            direccion,
            departamento,
            provincia,
            distrito,
            ubigeo: ubigeoEncontrado?.codigo || ubigeo || '',
            fechaActivacion: new Date().toISOString().split('T')[0],
            fechaExpiracion: recalcularFechaExpiracion(prev.esPrueba, prev.tipoEmpresa, prev.planId)
          }));

          // Limpiar errores de estos campos
          setErrors(prev => ({
            ...prev,
            razonSocial: '',
            nombreComercial: '',
            direccion: '',
            ubigeo: ''
          }));
        }
      } catch (error) {
        console.log('No se encontró información del RUC en RENIEC');
      } finally {
        setSearchingRuc(false);
      }
    }
  };

  // Recalcular fecha de expiración usando duración del plan seleccionado
  const recalcularFechaExpiracion = (esPrueba: boolean, tipoEmpresa: string, planId?: number) => {
    const ahora = new Date();
    let diasExpiracion = 30; // default

    if (planId && planes && Array.isArray(planes)) {
      const planSeleccionado: any = planes.find((p: any) => p.id === planId);
      if (planSeleccionado?.duracionDias) {
        diasExpiracion = planSeleccionado.duracionDias;
      }
    } else {
      // Fallback a lógica anterior si no hay plan seleccionado
      if (esPrueba) {
        diasExpiracion = 15;
      } else if (tipoEmpresa === 'INFORMAL') {
        diasExpiracion = 30;
      } else {
        diasExpiracion = 30; // Ahora todos son mensuales por defecto
      }
    }

    const fechaExpiracion = new Date(ahora.getTime() + diasExpiracion * 24 * 60 * 60 * 1000);
    return fechaExpiracion.toISOString().split('T')[0];
  };

  // Enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await crearEmpresa(formData);
    } catch (error) {
      console.error('Error al crear empresa:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Preparar opciones para selects
  // Rubros viene ya formateado desde extensiones
  const rubrosOptions = rubros && Array.isArray(rubros) ? rubros : [];

  const ubigeosOptions = ubigeos.map((ubigeo: any) => ({
    id: ubigeo.codigo,
    value: `${ubigeo.departamento} - ${ubigeo.provincia} - ${ubigeo.distrito}`
  }));

  console.log(ubigeoSelected)

  return (
    <div className="px-0 py-0 md:px-0 md:py-4">
      <div className="md:p-10 px-4 pt-0 z-0 md:px-8 bg-[#fff] rounded-lg">
        {/* Header */}
        <div className="flex items-center mb-6 pt-5 md:pt-0">
          <Button
            color="tertiary"
            onClick={() => navigate('/administrador/empresas')}
            className="mr-4"
          >
            <Icon icon="material-symbols:arrow-back" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2 ml-4">Nueva Empresa</h1>
            <p className="text-gray-600 ml-4">Registra una nueva empresa en el sistema</p>
          </div>
        </div>

        {/* Mostrar error si existe */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="max-w-5xl mx-auto bg-white rounded-3xl border border-gray-200 p-6 md:p-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Ingresa los datos de la empresa</h2>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Datos de la Empresa */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Datos de la Empresa</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <InputPro
                    name="ruc"
                    label="RUC"
                    value={formData.ruc}
                    onChange={handleInputChange}
                    handleOnBlur={handleRucBlur}
                    error={errors.ruc}
                    isLabel
                    maxLength={11}
                  />
                  {searchingRuc && (
                    <p className="text-sm text-blue-600 mt-1">Buscando información...</p>
                  )}
                </div>

                <div>
                  <InputPro
                    name="razonSocial"
                    label="Razón Social"
                    value={formData.razonSocial}
                    onChange={handleInputChange}
                    error={errors.razonSocial}
                    isLabel
                  />
                </div>

                <div>
                  <InputPro
                    name="nombreComercial"
                    label="Nombre Comercial"
                    value={formData.nombreComercial}
                    onChange={handleInputChange}
                    error={errors.nombreComercial}
                    isLabel
                  />
                </div>

                <div>
                  <Select
                    name="rubroId"
                    label="Rubro"
                    options={rubrosOptions}
                    onChange={handleSelectChange}
                    error={errors.rubroId}
                    withLabel
                  />
                </div>

                <div>
                  <Select
                    name="tipoEmpresa"
                    label="Tipo de Empresa"
                    options={[
                      { id: 'FORMAL', value: 'Empresa Formal' },
                      { id: 'INFORMAL', value: 'Empresa Informal' }
                    ]}
                    value={formData.tipoEmpresa === 'FORMAL' ? 'Empresa Formal' : 'Empresa Informal'}
                    onChange={handleTipoEmpresaChange}
                    error={errors.tipoEmpresa}
                    withLabel
                  />
                </div>

                <div className="md:col-span-2">
                  <InputPro
                    name="direccion"
                    label="Dirección"
                    value={formData.direccion}
                    onChange={handleInputChange}
                    error={errors.direccion}
                    isLabel
                  />
                </div>

                <div className="md:col-span-2">
                  <Select
                    name="ubigeo"
                    label="Ubicación (Departamento - Provincia - Distrito)"
                    options={ubigeosOptions}
                    onChange={handleUbigeoChange}
                    error={errors.ubigeo}
                    isSearch
                    withLabel
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-4">Plan</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {planes && Array.isArray(planes) && planes.map((plan: any) => (
                      <div
                        key={plan.id}
                        onClick={() => handlePlanSelect(plan.id)}
                        className={`p-4 border rounded-lg cursor-pointer transition ${formData.planId === plan.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:border-blue-400'
                          }`}
                      >
                        <div className="font-semibold text-gray-800">{plan.nombre}</div>
                        <div className="text-sm text-gray-600">{plan.descripcion || ''}</div>
                        <div className="text-lg font-bold text-blue-600 mt-2">
                          S/ {plan.costo?.toString()}
                          {plan.tipoFacturacion && (
                            <span className="text-xs text-gray-500 ml-1">/ {plan.tipoFacturacion.toLowerCase()}</span>
                          )}
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          {plan.limiteUsuarios && <span>Usuarios: {plan.limiteUsuarios}</span>}
                          {plan.duracionDias && <span>{plan.duracionDias} días</span>}
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
                          {plan.tieneTienda && (
                            <div className="flex items-center text-xs text-gray-700">
                              <span className="text-green-500 mr-1">✓</span> Tienda Virtual
                            </div>
                          )}
                          {plan.tieneCulqi && (
                            <div className="flex items-center text-xs text-gray-700">
                              <span className="text-green-500 mr-1">✓</span> Pagos con Culqi
                            </div>
                          )}
                          {plan.tieneDeliveryGPS && (
                            <div className="flex items-center text-xs text-gray-700">
                              <span className="text-green-500 mr-1">✓</span> Delivery con GPS
                            </div>
                          )}
                          {plan.tieneGaleria && (
                            <div className="flex items-center text-xs text-gray-700">
                              <span className="text-green-500 mr-1">✓</span> Galería de Imágenes
                            </div>
                          )}
                          {plan.tieneBanners && (
                            <div className="flex items-center text-xs text-gray-700">
                              <span className="text-green-500 mr-1">✓</span> Banners Promocionales
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {errors.planId && <p className="text-red-600 text-sm mt-2">{errors.planId}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.esPrueba}
                      onChange={handleEsPruebaChange}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Esto es una versión de prueba (sin costo)</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo (Opcional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {logoPreview && (
                    <img src={logoPreview} alt="Preview" className="mt-2 h-20 w-20 object-cover rounded" />
                  )}
                </div>

                <div>
                  <InputPro
                    name="fechaActivacion"
                    label="Fecha de Activación"
                    type="date"
                    value={formData.fechaActivacion}
                    onChange={handleInputChange}
                    error={errors.fechaActivacion}
                    isLabel
                    disabled
                  />
                </div>

                <div>
                  <InputPro
                    name="fechaExpiracion"
                    label="Fecha de Expiración (Auto-calculada)"
                    type="date"
                    value={formData.fechaExpiracion || ''}
                    onChange={handleInputChange}
                    error={errors.fechaExpiracion}
                    isLabel
                  />
                </div>
              </div>
            </div>

            {/* Integración SUNAT - Solo para empresas FORMALES */}
            {formData.tipoEmpresa === 'FORMAL' && !formData.esPrueba && (
              <div className="bg-blue-50 p-6 rounded-lg">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Integración SUNAT (Opcional)</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Estos datos se obtienen del proveedor SUNAT después del registro. Puedes agregarlos más tarde.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <InputPro
                      name="providerToken"
                      label="Token del Proveedor"
                      value={formData.providerToken || ''}
                      onChange={handleInputChange}
                      error={errors.providerToken}
                      isLabel
                      placeholder="Token para integración SUNAT"
                    />
                  </div>

                  <div>
                    <InputPro
                      name="providerId"
                      label="ID del Proveedor"
                      value={formData.providerId || ''}
                      onChange={handleInputChange}
                      error={errors.providerId}
                      isLabel
                      placeholder="ID asignado por el proveedor"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Datos del Administrador */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Administrador de la Empresa</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <InputPro
                    name="usuario.nombre"
                    label="Nombre Completo"
                    value={formData.usuario.nombre}
                    onChange={handleInputChange}
                    error={errors['usuario.nombre']}
                    isLabel
                  />
                </div>

                <div>
                  <InputPro
                    name="usuario.dni"
                    label="DNI"
                    value={formData.usuario.dni}
                    onChange={handleInputChange}
                    error={errors['usuario.dni']}
                    isLabel
                    maxLength={8}
                  />
                </div>

                <div>
                  <InputPro
                    name="usuario.email"
                    label="Email"
                    type="email"
                    value={formData.usuario.email}
                    onChange={handleInputChange}
                    error={errors['usuario.email']}
                    isLabel
                  />
                </div>

                <div>
                  <InputPro
                    name="usuario.celular"
                    label="Celular"
                    value={formData.usuario.celular}
                    onChange={handleInputChange}
                    error={errors['usuario.celular']}
                    isLabel
                  />
                </div>

                <div className="md:col-span-2">
                  <InputPro
                    name="usuario.password"
                    label="Contraseña"
                    type="password"
                    value={formData.usuario.password}
                    onChange={handleInputChange}
                    error={errors['usuario.password']}
                    isLabel
                  />
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                color="tertiary"
                onClick={() => navigate('/administrador/empresas')}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                color="secondary"
                disabled={loading || isSubmitting}
              >
                {isSubmitting ? 'Creando...' : 'Crear Empresa'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateEmpresa;