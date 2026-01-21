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
  departamento: string;
  provincia: string;
  distrito: string;
  ubigeo: string;
  rubroId: number;
  rubro: string;
  nombreComercial: string;
  fechaActivacion: string;
  fechaExpiracion: string;
  providerToken?: string;
  providerId?: string;
  bancoNombre?: string;
  numeroCuenta?: string;
  cci?: string;
  monedaCuenta?: string;
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
    departamento: '',
    rubro: '',
    provincia: '',
    distrito: '',
    ubigeo: '',
    rubroId: 0,
    nombreComercial: '',
    fechaActivacion: '',
    fechaExpiracion: '',
    providerToken: '',
    providerId: ''
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
        departamento: empresa.departamento || '',
        provincia: empresa.provincia || '',
        distrito: empresa.distrito || '',
        rubro: empresa?.rubro?.nombre || '',
        ubigeo: empresa.ubigeo || '',
        rubroId: empresa.rubro?.id || 0,
        nombreComercial: empresa.nombreComercial || '',
        fechaActivacion: empresa.fechaActivacion.split('T')[0],
        fechaExpiracion: empresa.fechaExpiracion.split('T')[0],
        providerToken: (empresa as any).providerToken || '',
        providerId: (empresa as any).providerId || '',
        bancoNombre: (empresa as any).bancoNombre || '',
        numeroCuenta: (empresa as any).numeroCuenta || '',
        cci: (empresa as any).cci || '',
        monedaCuenta: (empresa as any).monedaCuenta || 'SOLES'
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
    return <Loading />;
  }

  if (!empresa) {
    return (
      <div className="px-0 py-0 md:px-0 md:py-4">
        <div className="md:p-10 px-4 pt-0 z-0 md:px-8 bg-[#fff] rounded-lg">
          <div className="text-center py-10">
            <Icon icon="mdi:alert-circle-outline" className="mx-auto text-6xl text-red-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600">Empresa no encontrada</h3>
            <p className="text-gray-500 mb-4">La empresa que intentas editar no existe.</p>
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
            <h1 className="text-2xl font-bold text-gray-800 mb-2 ml-4">Editar Empresa</h1>
            <p className="text-gray-600 ml-4">Modifica los datos de la empresa: {empresa.razonSocial}</p>
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
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Datos de la Empresa</h2>

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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {errors.logo && (
                  <p className="text-red-500 text-sm mt-1">{errors.logo}</p>
                )}
                {logoPreview && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 mb-1">Logo actual:</p>
                    <img src={logoPreview} alt="Logo" className="h-20 w-20 object-cover rounded" />
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

          {/* Información Bancaria */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Información Bancaria (Para Cotizaciones)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <InputPro
                  name="bancoNombre"
                  label="Nombre del Banco"
                  value={formData.bancoNombre || ''}
                  onChange={handleInputChange}
                  isLabel
                  placeholder="Ej: INTERBANK"
                />
              </div>
              <div>
                <Select
                  name="monedaCuenta"
                  label="Moneda"
                  options={[
                    { id: 'SOLES', value: 'SOLES' },
                    { id: 'DOLARES', value: 'DOLARES' }
                  ]}
                  value={formData.monedaCuenta || 'SOLES'}
                  onChange={(id, value) => setFormData(prev => ({ ...prev, monedaCuenta: id as string }))}
                  withLabel
                  error={errors.monedaCuenta}
                />
              </div>
              <div>
                <InputPro
                  name="numeroCuenta"
                  label="N° Cuenta"
                  value={formData.numeroCuenta || ''}
                  onChange={handleInputChange}
                  isLabel
                  placeholder="Ej: 200-3006350516"
                />
              </div>
              <div>
                <InputPro
                  name="cci"
                  label="CCI"
                  value={formData.cci || ''}
                  onChange={handleInputChange}
                  isLabel
                  placeholder="Ej: 003-200-003006350516-35"
                />
              </div>
            </div>
          </div>

          {/* Integración SUNAT - Solo para empresas FORMALES */}
          {formData.tipoEmpresa === 'FORMAL' && (
            <div className="bg-blue-50 p-6 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Integración SUNAT</h2>
              <p className="text-sm text-gray-600 mb-4">
                Datos proporcionados por el proveedor SUNAT para facturación electrónica.
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

          {/* Información adicional */}
          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="text-md font-semibold text-blue-800 mb-2">Información del Plan</h3>
            <div className="text-sm text-blue-700">
              <p><strong>Plan actual:</strong> {empresa?.plan?.nombre}</p>
              {empresa?.plan?.descripcion && (
                <p><strong>Descripción:</strong> {empresa?.plan?.descripcion}</p>
              )}
              {empresa?.plan?.limiteUsuarios && (
                <p><strong>Límite de usuarios:</strong> {empresa?.plan?.limiteUsuarios}</p>
              )}
              <p><strong>Estado:</strong>
                <span className={`ml-2 px-2 py-1 rounded text-xs ${empresa?.estado === 'ACTIVO'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
                  }`}>
                  {empresa.estado}
                </span>
              </p>
            </div>
          </div>

          {/* Tarjetas de planes (solo precios) */}
          {planes && planes.length > 0 && (
            <div className="mt-4">
              <h3 className="text-md font-semibold text-[#0F172A] mb-3">Planes disponibles</h3>
              <div className="grid gap-4 md:grid-cols-3">
                {planes.map((plan: any) => {
                  const isCurrent = plan.id === formData.planId;
                  return (
                    <div
                      key={plan.id}
                      className={`flex flex-col justify-between rounded-2xl border bg-white p-5 shadow-sm transition-all duration-200 ${isCurrent
                        ? 'border-[#4F46E5] shadow-[0_0_0_1px_rgba(79,70,229,0.4)]'
                        : 'border-gray-200 hover:shadow-md'
                        }`}
                    >
                      <div>
                        <p className="text-xs uppercase tracking-[0.14em] text-[#9CA3AF] mb-1">
                          {plan.nombre}
                        </p>
                        <p className="text-2xl font-semibold text-[#111827] mb-1">
                          S/ {plan.costo}
                          <span className="text-sm font-normal text-[#6B7280] ml-1">
                            / {plan.tipoFacturacion ? plan.tipoFacturacion.toLowerCase() : 'mensual'}
                          </span>
                        </p>
                        <div className="mt-2 space-y-1">
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