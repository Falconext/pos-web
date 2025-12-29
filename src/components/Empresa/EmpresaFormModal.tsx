import { useEffect, useMemo, useRef, useState, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import InputPro from '@/components/InputPro';
import Select from '@/components/Select';
import { useEmpresasStore } from '@/zustand/empresas';
import { useAuthStore } from '@/zustand/auth';
import { useExtentionsStore } from '@/zustand/extentions';
import useAlertStore from '@/zustand/alert';
import { useClientsStore } from '@/zustand/clients';

export type EmpresaFormMode = 'create' | 'edit';

interface EmpresaFormModalProps {
  open: boolean;
  mode: EmpresaFormMode;
  empresaId?: number;
  onClose: () => void;
  onSaved?: () => void;
}

interface CreateFormData {
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

interface EditFormData {
  id: number;
  ruc: string;
  razonSocial: string;
  direccion: string;
  logo?: any;
  planId: number;
  tipoEmpresa: 'FORMAL' | 'INFORMAL';
  departamento: string;
  provincia: string;
  distrito: string;
  ubigeo: string;
  rubroId: number;
  nombreComercial: string;
  fechaActivacion: string;
  fechaExpiracion: string;
  providerToken?: string;
  providerId?: string;
  usuario?: {
    nombre?: string;
    email?: string;
    password?: string;
    dni?: string;
    celular?: string;
  };
}

export default function EmpresaFormModal({ open, mode, empresaId, onClose, onSaved }: EmpresaFormModalProps) {
  const isEdit = mode === 'edit';
  const navigate = useNavigate();
  const { success, alert } = useAlertStore();
  const { crearEmpresa, actualizarEmpresa, obtenerEmpresa, empresa, listarEmpresas } = useEmpresasStore();
  const { planes, rubros, ubigeos, getPlanes, getRubros, getUbigeos } = useExtentionsStore();
  const { getClientFromDoc } = useClientsStore();
  const { auth } = useAuthStore();
  const isAdminSistema = auth?.rol === 'ADMIN_SISTEMA';

  const [activeTab, setActiveTab] = useState<'datos' | 'suscripcion' | 'sunat' | 'admin'>('datos');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [searchingRuc, setSearchingRuc] = useState(false);

  const initialCreate: CreateFormData = useMemo(() => ({
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
    usuario: { nombre: '', email: '', password: '', dni: '', celular: '' },
  }), []);

  const initialEdit: EditFormData = useMemo(() => ({
    id: 0,
    ruc: '',
    razonSocial: '',
    direccion: '',
    planId: 0,
    tipoEmpresa: 'FORMAL',
    departamento: '',
    provincia: '',
    distrito: '',
    ubigeo: '',
    rubroId: 0,
    nombreComercial: '',
    fechaActivacion: '',
    fechaExpiracion: '',
    providerToken: '',
    providerId: '',
    usuario: { nombre: '', email: '', password: '', dni: '', celular: '' },
  }), []);

  const [createData, setCreateData] = useState<CreateFormData>(initialCreate);
  const [editData, setEditData] = useState<EditFormData>(initialEdit);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [initialEditPlanId, setInitialEditPlanId] = useState<number | undefined>(undefined);

  // Load catalogs and entity when opens
  useEffect(() => {
    if (!open) return;
    getRubros();
    getUbigeos();
    getPlanes();
    setActiveTab('datos');

    if (isEdit && empresaId) {
      obtenerEmpresa(empresaId);
    } else {
      setCreateData(initialCreate);
      setLogoPreview('');
    }
  }, [open, isEdit, empresaId, getRubros, getUbigeos, getPlanes, obtenerEmpresa, initialCreate]);

  // Resto del código...

  // Populate edit form when empresa loads
  useEffect(() => {
    if (open && isEdit && empresa && empresaId && empresa.id === empresaId) {
      const adminUser = (empresa as any).usuarios && (empresa as any).usuarios.length > 0
        ? (empresa as any).usuarios[0]
        : {};

      setEditData({
        id: empresa.id,
        ruc: empresa.ruc,
        razonSocial: empresa.razonSocial,
        direccion: empresa.direccion,
        planId: empresa.plan?.id || 0,
        tipoEmpresa: (empresa as any).tipoEmpresa || 'FORMAL',
        departamento: empresa.departamento || '',
        provincia: empresa.provincia || '',
        distrito: empresa.distrito || '',
        ubigeo: empresa.ubigeo || '',
        rubroId: empresa.rubro?.id || 0,
        nombreComercial: empresa.nombreComercial || '',
        fechaActivacion: empresa.fechaActivacion.split('T')[0],
        fechaExpiracion: empresa.fechaExpiracion.split('T')[0],
        providerToken: (empresa as any).providerToken || '',
        providerId: (empresa as any).providerId || '',
        usuario: {
          nombre: adminUser.nombre || '',
          email: adminUser.email || '',
          dni: adminUser.dni || '',
          celular: adminUser.celular || '',
          password: '', // Password empty by default
        }
      });
      setInitialEditPlanId(empresa.plan?.id || 0);
      // Resetear y asignar logo según la empresa actual
      setLogoPreview(empresa.logo ? empresa.logo : '');
    }
  }, [open, isEdit, empresa, empresaId]);

  // Limpiar preview de logo al cambiar de empresa a editar antes de que cargue
  useEffect(() => {
    if (open && isEdit) {
      setLogoPreview('');
    }
  }, [empresaId, open, isEdit]);

  const rubrosOptions = rubros && Array.isArray(rubros) ? rubros : [];
  const ubigeosOptions = ubigeos.map((u: any) => ({ id: u.codigo, value: `${u.departamento} - ${u.provincia} - ${u.distrito}` }));
  const selectedPlan: any = useMemo(() => {
    const id = isEdit ? editData.planId : createData.planId;
    return (planes as any[] || []).find((p: any) => p.id === id);
  }, [planes, isEdit, editData.planId, createData.planId]);

  // Planes que incluyen tienda virtual
  const storePlans: any[] = useMemo(() => {
    return (planes as any[] || []).filter((p: any) => !!p?.tieneTienda);
  }, [planes]);

  console.log(storePlans)
  // Seleccionar automáticamente un plan con tienda virtual
  const selectFirstStorePlan = () => {
    if (!storePlans || storePlans.length === 0) {
      alert('No hay planes con tienda virtual disponibles. Crea o habilita uno en el administrador de planes.', 'warning');
      return;
    }
    const id = storePlans[0].id;
    if (isEdit) setEditData(prev => ({ ...prev, planId: id }));
    else setCreateData(prev => ({ ...prev, planId: id }));
  };

  const handleSelect = (id: any, _value: string, name: string) => {
    if (isEdit) {
      setEditData(prev => ({ ...prev, [name]: name === 'rubroId' ? parseInt(id) : id } as any));
    } else {
      setCreateData(prev => ({ ...prev, [name]: name === 'rubroId' ? parseInt(id) : id } as any));
    }
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleUbigeoChange = (id: any) => {
    const selected: any = ubigeos.find((u: any) => u.codigo === id);
    if (!selected) return;
    if (isEdit) {
      setEditData(prev => ({ ...prev, ubigeo: selected.codigo, departamento: selected.departamento, provincia: selected.provincia, distrito: selected.distrito }));
    } else {
      setCreateData(prev => ({ ...prev, ubigeo: selected.codigo, departamento: selected.departamento, provincia: selected.provincia, distrito: selected.distrito }));
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target as any;
    if (isEdit) {
      if (name.startsWith('usuario.')) {
        const field = name.split('.')[1];
        setEditData(prev => ({
          ...prev,
          usuario: {
            ...prev.usuario,
            [field]: value
          }
        }));
      } else {
        setEditData(prev => ({ ...prev, [name]: value } as any));
      }
    } else {
      if (name.startsWith('usuario.')) {
        const field = name.split('.')[1];
        setCreateData(prev => ({ ...prev, usuario: { ...prev.usuario, [field]: value } }));
      } else {
        setCreateData(prev => ({ ...prev, [name]: value } as any));
      }
    }
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleEsPrueba = (e: React.ChangeEvent<HTMLInputElement>) => {
    const esPrueba = e.target.checked;
    setCreateData(prev => ({ ...prev, esPrueba }));
  };

  const handleLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      const max = 300; let { width, height } = img;
      if (width > height) { if (width > max) { height = (height * max) / width; width = max; } }
      else { if (height > max) { width = (width * max) / height; height = max; } }
      canvas.width = width; canvas.height = height;
      ctx?.clearRect(0, 0, width, height); ctx?.drawImage(img, 0, 0, width, height);
      const base64 = canvas.toDataURL('image/png');
      setLogoPreview(base64);
      if (isEdit) setEditData(prev => ({ ...prev, logo: base64 }));
      else setCreateData(prev => ({ ...prev, logo: base64 }));
    };
    img.src = URL.createObjectURL(file);
  };

  const handleRucBlur = async () => {
    if (!createData.ruc || createData.ruc.length !== 11) return;
    setSearchingRuc(true);
    try {
      const response: any = await getClientFromDoc(createData.ruc);
      if (response) {
        const razonSocial = response.nombre_o_razon_social || response.razonSocial || '';
        const direccion = response.direccion_completa || response.direccion || '';
        const departamento = response.departamento || '';
        const provincia = response.provincia || '';
        const distrito = response.distrito || '';
        const ubigeo = response.ubigeo_sunat || '';
        const selected: any = ubigeos.find((u: any) => u.codigo === ubigeo);
        setCreateData(prev => ({
          ...prev,
          razonSocial,
          nombreComercial: razonSocial,
          direccion,
          departamento,
          provincia,
          distrito,
          ubigeo: selected?.codigo || ubigeo || '',
        }));
        setErrors(prev => ({ ...prev, razonSocial: '', nombreComercial: '', direccion: '', ubigeo: '' }));
      }
    } catch {
      // ignore
    } finally {
      setSearchingRuc(false);
    }
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    const base = isEdit ? editData : createData;
    if (!base.ruc) e.ruc = 'RUC es requerido';
    if (!base.razonSocial) e.razonSocial = 'Razón social es requerida';
    if (!base.direccion) e.direccion = 'Dirección es requerida';
    if (!base.nombreComercial) e.nombreComercial = 'Nombre comercial es requerido';
    if (!base.rubroId) e.rubroId = 'Rubro es requerido';
    if (!base.ubigeo) e.ubigeo = 'Ubigeo es requerido';
    if (!isEdit && !createData.usuario?.nombre) e['usuario.nombre'] = 'Nombre del administrador es requerido';
    if (!isEdit && !createData.usuario?.email) e['usuario.email'] = 'Email del administrador es requerido';
    if (!isEdit && !createData.usuario?.password) e['usuario.password'] = 'Contraseña es requerida';
    if (!isEdit && !createData.usuario?.dni) e['usuario.dni'] = 'DNI es requerido';
    if (!isEdit && !createData.usuario?.celular) e['usuario.celular'] = 'Celular es requerido';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      if (isEdit) {
        await actualizarEmpresa(editData as any);
        alert('Empresa actualizada correctamente', 'success');
      } else {
        await crearEmpresa(createData as any);
        alert('Empresa creada correctamente', 'success');
      }
      onSaved?.();
      onClose();
    } catch (_err) {
      // El store ya maneja errores
    } finally {
      setIsSubmitting(false);
    }
  };

  const width = '1100px';

  return (
    <Modal isOpenModal={open} closeModal={onClose} title={isEdit ? 'Editar empresa' : 'Nueva empresa'} width={width}>
      <div className="grid grid-cols-1 md:grid-cols-12">
        {/* Sidebar */}
        <aside className="md:col-span-3 border-r border-gray-100 p-5 bg-gray-50">
          <div className="flex flex-col items-center text-center">
            <div className="h-20 w-20 rounded-full bg-gray-200 overflow-hidden mb-3 border">
              {logoPreview ? <img src={logoPreview} className="h-full w-full object-cover" /> : null}
            </div>
            <p className="text-sm font-semibold text-gray-900">
              {isEdit ? (empresa?.razonSocial || '-') : 'Nueva empresa'}
            </p>
            <p className="text-xs text-gray-500">{isEdit ? empresa?.ruc : 'RUC por registrar'}</p>
          </div>
          <nav className="mt-6 space-y-1">
            {[
              { id: 'datos', label: 'Datos de empresa' },
              { id: 'suscripcion', label: 'Plan y vigencia' },
              { id: 'sunat', label: 'SUNAT' },
              { id: 'admin', label: 'Administrador' },
            ].map((t: any) => (
              <button
                key={t.id}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm ${activeTab === t.id ? 'bg-white shadow border border-gray-200 font-semibold' : 'hover:bg-white'
                  }`}
                onClick={() => setActiveTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <section className="md:col-span-9 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {activeTab === 'datos' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputPro name="ruc" label="RUC" isLabel value={isEdit ? editData.ruc : createData.ruc} onChange={handleChange} handleOnBlur={!isEdit ? () => handleRucBlur() : undefined} error={errors.ruc} maxLength={11} />
                  <InputPro name="razonSocial" label="Razón Social" isLabel value={isEdit ? editData.razonSocial : createData.razonSocial} onChange={handleChange} error={errors.razonSocial} />
                  <InputPro name="nombreComercial" label="Nombre Comercial" isLabel value={isEdit ? editData.nombreComercial : createData.nombreComercial} onChange={handleChange} error={errors.nombreComercial} />
                  <Select name="rubroId" label="Rubro" options={rubrosOptions} onChange={(id: any, v: string) => handleSelect(id, v, 'rubroId')} error={errors.rubroId} withLabel />
                  <Select error={() => { }} name="tipoEmpresa" label="Tipo de Empresa" options={[{ id: 'FORMAL', value: 'Empresa Formal' }, { id: 'INFORMAL', value: 'Empresa Informal' }]} value={isEdit ? (editData.tipoEmpresa === 'FORMAL' ? 'Empresa Formal' : 'Empresa Informal') : (createData.tipoEmpresa === 'FORMAL' ? 'Empresa Formal' : 'Empresa Informal')} onChange={(id: any, v: string) => handleSelect(id, v, 'tipoEmpresa')} withLabel />
                  <div className="md:col-span-2">
                    <InputPro name="direccion" label="Dirección" isLabel value={isEdit ? editData.direccion : createData.direccion} onChange={handleChange} error={errors.direccion} />
                  </div>
                  <div className="md:col-span-2">
                    <Select name="ubigeo" label="Ubicación (Departamento - Provincia - Distrito)" options={ubigeosOptions} onChange={(id: any) => handleUbigeoChange(id)} error={errors.ubigeo} isSearch withLabel />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
                    <input type="file" accept="image/*" onChange={handleLogoChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                    {logoPreview && <img src={logoPreview} alt="preview" className="h-16 w-16 mt-2 rounded object-cover" />}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'suscripcion' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputPro name="fechaActivacion" label="Fecha de Activación" type="date" isLabel value={isEdit ? editData.fechaActivacion : createData.fechaActivacion} onChange={handleChange} />
                  <InputPro name="fechaExpiracion" label="Fecha de Expiración" type="date" isLabel value={isEdit ? editData.fechaExpiracion : (createData.fechaExpiracion || '')} onChange={handleChange} />
                </div>
                {/* Planes como tarjetas */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {planes && Array.isArray(planes) && planes.map((plan: any) => {
                    const selected = (isEdit ? editData.planId : createData.planId) === plan.id;
                    return (
                      <div key={plan.id} onClick={() => (isEdit ? setEditData(prev => ({ ...prev, planId: plan.id })) : setCreateData(prev => ({ ...prev, planId: plan.id })))} className={`p-4 border rounded-lg cursor-pointer transition ${selected ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}>
                        <div className="font-semibold text-gray-800">{plan.nombre}</div>
                        <div className="text-sm text-gray-600">{plan.descripcion || ''}</div>
                        <div className="text-lg font-bold text-blue-600 mt-2">S/ {plan.costo?.toString()} {plan.tipoFacturacion && (<span className="text-xs text-gray-500 ml-1">/ {plan.tipoFacturacion.toLowerCase()}</span>)}</div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">{plan.limiteUsuarios && <span>Usuarios: {plan.limiteUsuarios}</span>}{plan.duracionDias && <span>{plan.duracionDias} días</span>}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Info de tienda virtual según plan seleccionado */}
                <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <p className="text-gray-700">
                        <span className="font-medium">Tienda virtual del plan:</span>{' '}
                        {selectedPlan?.tieneTienda ? (
                          <span className="text-emerald-600 font-semibold">Incluida</span>
                        ) : (
                          <span className="text-gray-500">No incluida</span>
                        )}
                      </p>
                      {selectedPlan?.tieneTienda && isEdit && (
                        <p className="text-xs text-gray-500 mt-1">
                          Estado: {(empresa as any)?.slugTienda ? 'Activa' : 'Pendiente de configurar'}
                          {(empresa as any)?.slugTienda && (
                            <>
                              {' '}• URL:{' '}
                              <span className="underline break-all">{window.location.origin}/tienda/{(empresa as any).slugTienda}</span>
                            </>
                          )}
                        </p>
                      )}
                    </div>
                    {selectedPlan?.tieneTienda ? (
                      // Si el plan cambió y aún no se ha guardado, deshabilitar navegación
                      isAdminSistema ? (
                        <Button type="button" color="secondary" disabled>
                          Disponible solo para el administrador de la empresa
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          color="secondary"
                          disabled={isEdit ? initialEditPlanId !== undefined && initialEditPlanId !== editData.planId : true}
                          onClick={() => navigate('/administrador/tienda/configuracion')}
                        >
                          {isEdit
                            ? (initialEditPlanId !== undefined && initialEditPlanId !== editData.planId
                              ? 'Guardar cambios para configurar'
                              : ((empresa as any)?.slugTienda ? 'Gestionar tienda' : 'Configurar tienda'))
                            : 'Guardar y configurar'}
                        </Button>
                      )
                    ) : (
                      <Button type="button" color="secondary" onClick={selectFirstStorePlan}>
                        Incluir tienda virtual
                      </Button>
                    )}
                  </div>
                </div>
                {!isEdit && (
                  <label className="flex items-center mt-2">
                    <input type="checkbox" checked={createData.esPrueba} onChange={handleEsPrueba} className="w-4 h-4 text-blue-600 rounded border-gray-300" />
                    <span className="ml-2 text-sm text-gray-700">Esto es una versión de prueba (sin costo)</span>
                  </label>
                )}
              </div>
            )}

            {activeTab === 'sunat' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputPro name="providerToken" label="Token del Proveedor" isLabel value={isEdit ? (editData.providerToken || '') : (createData.providerToken || '')} onChange={handleChange} placeholder="Token para integración SUNAT" />
                  <InputPro name="providerId" label="ID del Proveedor" isLabel value={isEdit ? (editData.providerId || '') : (createData.providerId || '')} onChange={handleChange} placeholder="ID asignado por el proveedor" />
                </div>
              </div>
            )}

            {activeTab === 'admin' && !isEdit && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputPro name="usuario.nombre" label="Nombre Completo" isLabel value={createData.usuario.nombre} onChange={handleChange} error={errors['usuario.nombre']} />
                  <InputPro name="usuario.dni" label="DNI" isLabel value={createData.usuario.dni} onChange={handleChange} error={errors['usuario.dni']} maxLength={8} />
                  <InputPro name="usuario.email" label="Email" type="email" isLabel value={createData.usuario.email} onChange={handleChange} error={errors['usuario.email']} />
                  <InputPro name="usuario.celular" label="Celular" isLabel value={createData.usuario.celular} onChange={handleChange} error={errors['usuario.celular']} />
                  <div className="md:col-span-2">
                    <InputPro name="usuario.password" label="Contraseña" type="password" isLabel value={createData.usuario.password} onChange={handleChange} error={errors['usuario.password']} />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'admin' && isEdit && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800">
                    <span className="font-semibold">Nota:</span> Aquí puedes actualizar los datos del administrador principal de la empresa.
                    Si dejas la contraseña en blanco, se mantendrá la actual.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputPro name="usuario.nombre" label="Nombre Completo" isLabel value={editData.usuario?.nombre || ''} onChange={handleChange} />
                  <InputPro name="usuario.dni" label="DNI" isLabel value={editData.usuario?.dni || ''} onChange={handleChange} maxLength={8} />
                  <InputPro name="usuario.email" label="Email" type="email" isLabel value={editData.usuario?.email || ''} onChange={handleChange} />
                  <InputPro name="usuario.celular" label="Celular" isLabel value={editData.usuario?.celular || ''} onChange={handleChange} />
                  <div className="md:col-span-2">
                    <InputPro name="usuario.password" label="Nueva Contraseña (dejar en blanco para mantener)" type="password" isLabel value={editData.usuario?.password || ''} onChange={handleChange} />
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <div className="flex gap-3">
                <Button type="button" color="tertiary" onClick={onClose}>Cancelar</Button>
                <Button type="submit" color="secondary" disabled={isSubmitting}>{isSubmitting ? (isEdit ? 'Actualizando...' : 'Creando...') : (isEdit ? 'Actualizar' : 'Crear')}</Button>
              </div>
            </div>
          </form>
        </section>
      </div>
    </Modal>
  );
}
