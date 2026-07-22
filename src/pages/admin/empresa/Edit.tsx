import { useState, useEffect, ChangeEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Icon } from '@iconify/react/dist/iconify.js';
import Button from '@/components/Button';
import InputPro from '@/components/InputPro';
import Select from '@/components/Select';
import Loading from '@/components/Loading';
import { useEmpresasStore } from '@/zustand/empresas';
import { useExtentionsStore } from '@/zustand/extentions';
import useAlertStore from '@/zustand/alert';

interface FormData {
  id: number;
  ruc: string;
  razonSocial: string;
  direccion: string;
  logo?: File | string;
  planId: number;
  tipoEmpresa: 'FORMAL' | 'INFORMAL';
  regimenTributario: 'GENERAL' | 'RER' | 'MYPE' | 'RUS';
  departamento: string;
  provincia: string;
  distrito: string;
  ubigeo: string;
  rubroId: number;
  rubro: string;
  nombreComercial: string;
  fechaActivacion: string;
  fechaExpiracion: string;
  usuarioPse?: string;
  contrasenaPse?: string;
  bancoNombre?: string;
  numeroCuenta?: string;
  cci?: string;
  monedaCuenta?: string;
  usaCodigoBarrasManual?: boolean;
}

interface FormErrors {
  [key: string]: string;
}

const EditEmpresa = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { success } = useAlertStore();

  const {
    empresa,
    loading,
    error,
    obtenerEmpresa,
    actualizarEmpresa
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
    id: 0,
    ruc: '',
    razonSocial: '',
    direccion: '',
    planId: 0,
    tipoEmpresa: 'FORMAL',
    regimenTributario: 'GENERAL',
    departamento: '',
    rubro: '',
    provincia: '',
    distrito: '',
    ubigeo: '',
    rubroId: 0,
    nombreComercial: '',
    fechaActivacion: '',
    fechaExpiracion: '',
    usuarioPse: '',
    contrasenaPse: '',
    usaCodigoBarrasManual: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Cargar datos iniciales
  useEffect(() => {
    if (id) {
      const loadData = async () => {
        setIsLoading(true);
        await Promise.all([
          obtenerEmpresa(parseInt(id)),
          getRubros(),
          getUbigeos(),
          getPlanes()
        ]);
        setIsLoading(false);
      };
      loadData();
    }
  }, [id, obtenerEmpresa, getRubros, getUbigeos, getPlanes]);

  console.log(empresa)

  // Cargar datos de la empresa en el formulario
  useEffect(() => {
    if (empresa && empresa.id === parseInt(id || '0')) {
      console.log('Datos de empresa cargados:', empresa);
      console.log('Rubro:', empresa.rubro);
      console.log('Plan:', empresa.plan);

      setFormData({
        id: empresa.id,
        ruc: empresa.ruc,
        razonSocial: empresa.razonSocial,
        direccion: empresa.direccion,
        planId: empresa.plan?.id || 0,
        tipoEmpresa: (empresa as any).tipoEmpresa || 'FORMAL',
        regimenTributario: (empresa as any).regimenTributario || 'GENERAL',
        departamento: empresa.departamento || '',
        provincia: empresa.provincia || '',
        distrito: empresa.distrito || '',
        rubro: empresa?.rubro?.nombre || '',
        ubigeo: empresa.ubigeo || '',
        rubroId: empresa.rubro?.id || 0,
        nombreComercial: empresa.nombreComercial || '',
        fechaActivacion: empresa.fechaActivacion.split('T')[0],
        fechaExpiracion: empresa.fechaExpiracion.split('T')[0],
        usuarioPse: (empresa as any).usuarioPse || '',
        contrasenaPse: (empresa as any).contrasenaPse || '',
        bancoNombre: (empresa as any).bancoNombre || '',
        numeroCuenta: (empresa as any).numeroCuenta || '',
        cci: (empresa as any).cci || '',
        monedaCuenta: (empresa as any).monedaCuenta || 'SOLES',
        usaCodigoBarrasManual: Boolean((empresa as any).usaCodigoBarrasManual),
      });

      // Mostrar logo actual si existe
      if (empresa.logo) {
        setLogoPreview(empresa.logo);
      }
    }
  }, [empresa, id]);

  // Preparar opciones para selects - Moved up for access in debug useEffect
  const planesOptions = planes && Array.isArray(planes) ? planes.map((plan: any) => ({
    id: plan.id,
    value: `${plan.nombre} - S/ ${plan.costo} ${plan.descripcion ? `(${plan.descripcion})` : ''}`
  })) : [];

  const rubrosOptions = rubros && Array.isArray(rubros) ? rubros : [];

  const ubigeosOptions = ubigeos && Array.isArray(ubigeos) ? ubigeos.map((ubigeo: any) => ({
    id: ubigeo.codigo,
    value: `${ubigeo.departamento} - ${ubigeo.provincia} - ${ubigeo.distrito}`
  })) : [];

  // Debug useEffect for Rubro
  useEffect(() => {
    console.log('[DEBUG RUBRO]', {
      empresaRubro: empresa?.rubro,
      formDataRubro: formData.rubro,
      formDataRubroId: formData.rubroId,
      rubrosOptionsLen: rubrosOptions?.length,
      rubrosOptions: rubrosOptions,
      derivedValueFromOptions: (rubrosOptions as any[])?.find((r: any) => r.id === formData.rubroId)?.value
    });
  }, [empresa, formData.rubro, formData.rubroId, rubrosOptions]);

  console.log(formData)

  // Redirigir cuando se actualice exitosamente
  useEffect(() => {
    if (success === true && !isSubmitting) {
      navigate('/administrador/empresas');
    }
  }, [success, navigate, isSubmitting]);

  // Validar formulario
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.ruc) newErrors.ruc = 'RUC es requerido';
    if (!formData.razonSocial) newErrors.razonSocial = 'Razón social es requerida';
    if (!formData.direccion) newErrors.direccion = 'Dirección es requerida';
    if (!formData.planId) newErrors.planId = 'Plan es requerido';
    if (!formData.rubroId) newErrors.rubroId = 'Rubro es requerido';
    if (!formData.nombreComercial) newErrors.nombreComercial = 'Nombre comercial es requerido';
    if (!formData.ubigeo) newErrors.ubigeo = 'Ubigeo es requerido';

    // Validar RUC (11 dígitos)
    if (formData.ruc && formData.ruc.length !== 11) {
      newErrors.ruc = 'RUC debe tener 11 dígitos';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar cambios en inputs
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Limpiar error si existe
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
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

  // Manejar cambio de tipo de empresa
  const handleTipoEmpresaChange = (id: any, value: string) => {
    setFormData(prev => ({
      ...prev,
      tipoEmpresa: id as 'FORMAL' | 'INFORMAL'
    }));
  };

  // Manejar cambio de régimen tributario (RUS bloquea la emisión de facturas)
  const handleRegimenChange = (id: any) => {
    setFormData(prev => ({
      ...prev,
      regimenTributario: id as 'GENERAL' | 'RER' | 'MYPE' | 'RUS'
    }));
  };

  const handleCheckboxChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  // Manejar archivo de logo
  const handleLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          logo: 'El archivo no debe superar los 5MB'
        }));
        return;
      }

      // Crear canvas para redimensionar la imagen
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Establecer dimensiones máximas
        const maxWidth = 300;
        const maxHeight = 300;
        let { width, height } = img;

        // Redimensionar manteniendo aspect ratio
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

        // Limpiar y dibujar imagen redimensionada preservando transparencia
        ctx?.clearRect(0, 0, width, height);
        ctx?.drawImage(img, 0, 0, width, height);

        // Convertir a base64 en PNG para mantener el canal alfa (transparencia)
        const base64String = canvas.toDataURL('image/png');
        setLogoPreview(base64String);
        setFormData(prev => ({
          ...prev,
          logo: base64String
        }));

        // Limpiar error si existía
        if (errors.logo) {
          setErrors(prev => ({
            ...prev,
            logo: ''
          }));
        }
      };

      img.src = URL.createObjectURL(file);
    }
  };

  // Enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await actualizarEmpresa(formData);
    } catch (error) {
      console.error('Error al actualizar empresa:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Opciones movidas arriba


  if (isLoading) {
    return (
      <div className="px-0 py-0 md:px-0 md:py-4 bg-gray-50 dark:bg-[#0A0D14] min-h-screen">
        <Loading />
      </div>
    );
  }

  if (!empresa) {
    return (
      <div className="px-0 py-0 md:px-0 md:py-4 bg-gray-50 dark:bg-[#0A0D14] min-h-screen">
        <div className="md:p-10 px-4 pt-0 z-0 md:px-8 bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
          <div className="text-center py-10">
            <Icon icon="mdi:alert-circle-outline" className="mx-auto text-6xl text-red-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400">Empresa no encontrada</h3>
            <p className="text-gray-500 dark:text-gray-500 mb-4">La empresa que intentas editar no existe.</p>
            <Button color="secondary" onClick={() => navigate('/administrador/empresas')}>
              Volver a Empresas
            </Button>
          </div>
        </div>
      </div>
    );
  }

  console.log("EL FORMDATA DEL FORMULARIO", formData)

  return (
    <div className="px-0 py-0 md:px-0 md:py-4 bg-gray-50 dark:bg-[#0A0D14] min-h-screen">
      <div className="md:p-10 px-4 pt-0 z-0 md:px-8 bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
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
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2 ml-4">Editar Empresa</h1>
            <p className="text-gray-600 dark:text-gray-400 ml-4">Modifica los datos de la empresa: {empresa.razonSocial}</p>
          </div>
        </div>

        {/* Mostrar error si existe */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Datos de la Empresa */}
          <div className="bg-gray-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-gray-100 dark:border-slate-800">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Datos de la Empresa</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <InputPro
                  name="ruc"
                  label="RUC"
                  value={formData.ruc}
                  onChange={handleInputChange}
                  error={errors.ruc}
                  isLabel
                  maxLength={11}
                  readOnly // RUC no debe ser editable
                />
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

              <div className="md:col-span-2">
                <label className="flex items-start space-x-3 p-4 border rounded-xl bg-blue-50/40 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                  <input
                    type="checkbox"
                    name="usaCodigoBarrasManual"
                    checked={Boolean(formData.usaCodigoBarrasManual)}
                    onChange={handleCheckboxChange}
                    className="mt-1 w-5 h-5 text-blue-600 dark:text-blue-500 rounded border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-blue-500"
                  />
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-900 dark:text-white">Habilitar código de barras en productos</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                      Fuerza la visualización del campo "Código de Barras" en el formulario de productos, sin depender del rubro.
                    </span>
                  </div>
                </label>
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
                  value={formData.rubro || (rubrosOptions as any[])?.find((r: any) => r.id === formData.rubroId)?.value || ''}
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

              <div>
                <Select
                  name="regimenTributario"
                  label="Régimen Tributario"
                  options={[
                    { id: 'GENERAL', value: 'Régimen General' },
                    { id: 'RER', value: 'Régimen Especial (RER)' },
                    { id: 'MYPE', value: 'Régimen MYPE Tributario' },
                    { id: 'RUS', value: 'Nuevo RUS (solo boletas)' },
                  ]}
                  value={
                    formData.regimenTributario === 'RUS' ? 'Nuevo RUS (solo boletas)'
                      : formData.regimenTributario === 'RER' ? 'Régimen Especial (RER)'
                        : formData.regimenTributario === 'MYPE' ? 'Régimen MYPE Tributario'
                          : 'Régimen General'
                  }
                  onChange={handleRegimenChange}
                  error={(errors as any).regimenTributario}
                  withLabel
                />
                {formData.regimenTributario === 'RUS' && (
                  <p className="text-xs text-amber-600 mt-1">
                    En RUS solo se pueden emitir Boletas (la Factura queda deshabilitada).
                  </p>
                )}
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
                  value={ubigeosOptions.find((u: any) => u.id === formData.ubigeo)?.value || ''}
                  onChange={handleUbigeoChange}
                  error={errors.ubigeo}
                  isSearch
                  withLabel
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Logo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-900/30 file:text-blue-700 dark:file:text-blue-400 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/50"
                />
                {errors.logo && (
                  <p className="text-red-500 text-sm mt-1">{errors.logo}</p>
                )}
                {logoPreview && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 dark:text-gray-500 mb-1">Logo actual:</p>
                    <img src={logoPreview} alt="Logo" className="h-20 w-20 object-cover rounded-xl border border-gray-200 dark:border-slate-700" />
                  </div>
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
                />
              </div>

              <div>
                <InputPro
                  name="fechaExpiracion"
                  label="Fecha de Expiración"
                  type="date"
                  value={formData.fechaExpiracion}
                  onChange={handleInputChange}
                  error={errors.fechaExpiracion}
                  isLabel
                />
              </div>

              <div>
                <InputPro
                  name="fechaExpiracion"
                  label="Fecha de Expiración"
                  type="date"
                  value={formData.fechaExpiracion}
                  onChange={handleInputChange}
                  error={errors.fechaExpiracion}
                  isLabel
                />
              </div>
            </div>
          </div>

          {/* Las cuentas bancarias ahora se gestionan en Perfil → Cuentas Bancarias
              (soporta múltiples cuentas y alimenta cotizaciones/comprobantes). */}

          {/* Integración SUNAT - Solo para empresas FORMALES */}
          {formData.tipoEmpresa === 'FORMAL' && (
            <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/30">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Integración SUNAT</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Datos proporcionados por el proveedor SUNAT para facturación electrónica.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <InputPro
                    name="usuarioPse"
                    label="Usuario PSE (QPSE)"
                    value={formData.usuarioPse || ''}
                    onChange={handleInputChange}
                    error={errors.usuarioPse}
                    isLabel
                    placeholder="Ej. 0HGRQ55B"
                  />
                </div>

                <div>
                  <InputPro
                    name="contrasenaPse"
                    label="Contraseña PSE (QPSE)"
                    type="password"
                    value={formData.contrasenaPse || ''}
                    onChange={handleInputChange}
                    error={errors.contrasenaPse}
                    isLabel
                    placeholder="Ej. R8101ZBD"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Información adicional */}
          <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/30">
            <h3 className="text-md font-semibold text-blue-800 dark:text-blue-400 mb-2">Información del Plan</h3>
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <p><strong>Plan actual:</strong> {empresa?.plan?.nombre}</p>
              {empresa?.plan?.descripcion && (
                <p><strong>Descripción:</strong> {empresa?.plan?.descripcion}</p>
              )}
              {empresa?.plan?.limiteUsuarios && (
                <p><strong>Límite de usuarios:</strong> {empresa?.plan?.limiteUsuarios}</p>
              )}
              <p><strong>Estado:</strong>
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-bold ${empresa?.estado === 'ACTIVO'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-900/50'
                  : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-900/50'
                  }`}>
                  {empresa.estado}
                </span>
              </p>
            </div>
          </div>

          {/* Tarjetas de planes (solo precios) */}
          {planes && planes.length > 0 && (
            <div className="mt-4">
              <h3 className="text-md font-semibold text-[#0F172A] dark:text-white mb-3">Planes disponibles</h3>
              <div className="grid gap-4 md:grid-cols-3">
                {planes.map((plan: any) => {
                  const isCurrent = plan.id === formData.planId;
                  return (
                    <div
                      key={plan.id}
                      className={`flex flex-col justify-between rounded-2xl border bg-white dark:bg-[#0A0D14] p-5 shadow-sm transition-all duration-200 ${isCurrent
                        ? 'border-[#4F46E5] dark:border-indigo-500 shadow-[0_0_0_1px_rgba(79,70,229,0.4)] dark:shadow-indigo-500/20'
                        : 'border-gray-200 dark:border-slate-800 hover:shadow-md'
                        }`}
                    >
                      <div>
                        <p className="text-xs uppercase tracking-[0.14em] text-[#9CA3AF] dark:text-gray-500 mb-1">
                          {plan.nombre}
                        </p>
                        <p className="text-2xl font-semibold text-[#111827] dark:text-white mb-1">
                          S/ {plan.costo}
                          <span className="text-sm font-normal text-[#6B7280] dark:text-gray-500 ml-1">
                            / {plan.tipoFacturacion ? plan.tipoFacturacion.toLowerCase() : 'mensual'}
                          </span>
                        </p>
                        <div className="mt-2 space-y-1">
                          {plan.tieneTienda && (
                            <div className="flex items-center text-xs text-gray-700 dark:text-gray-400">
                              <span className="text-green-500 mr-1">✓</span> Tienda Virtual
                            </div>
                          )}
                          {plan.tieneCulqi && (
                            <div className="flex items-center text-xs text-gray-700 dark:text-gray-400">
                              <span className="text-green-500 mr-1">✓</span> Pagos con Culqi
                            </div>
                          )}
                          {plan.tieneDeliveryGPS && (
                            <div className="flex items-center text-xs text-gray-700 dark:text-gray-400">
                              <span className="text-green-500 mr-1">✓</span> Delivery con GPS
                            </div>
                          )}
                          {plan.tieneGaleria && (
                            <div className="flex items-center text-xs text-gray-700 dark:text-gray-400">
                              <span className="text-green-500 mr-1">✓</span> Galería de Imágenes
                            </div>
                          )}
                          {plan.tieneBanners && (
                            <div className="flex items-center text-xs text-gray-700 dark:text-gray-400">
                              <span className="text-green-500 mr-1">✓</span> Banners Promocionales
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        className={`mt-4 w-full h-10 rounded-full text-sm font-semibold transition-colors ${isCurrent
                          ? 'bg-[#1D4ED8] text-white'
                          : 'bg-white text-[#1D4ED8] border border-[#1D4ED8] hover:bg-[#1D4ED8] hover:text-white'
                          }`}
                        onClick={() =>
                          handleSelectChange(
                            plan.id,
                            `${plan.nombre} - S/ ${plan.costo}`,
                            'planId'
                          )
                        }
                      >
                        {isCurrent ? 'Plan actual' : 'Seleccionar plan'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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
              {isSubmitting ? 'Actualizando...' : 'Actualizar Empresa'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditEmpresa;