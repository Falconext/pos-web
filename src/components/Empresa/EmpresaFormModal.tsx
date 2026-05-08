import { useEffect, useMemo, useRef, useState, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import InputPro from '@/components/InputPro';
import Select from '@/components/Select';
import { Icon } from '@iconify/react';
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
  usuarioPse?: string;
  contrasenaPse?: string;
  usaCodigoBarrasManual?: boolean;
  brand?: string;
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
  usuarioPse?: string;
  contrasenaPse?: string;
  esAgenteRetencion?: boolean;
  usaCodigoBarrasManual?: boolean;
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
  const esSuperAdmin = isAdminSistema && !auth?.sistemaNegocio;

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
    usaCodigoBarrasManual: false,
    brand: '',
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
    usuarioPse: '',
    contrasenaPse: '',
    esAgenteRetencion: false,
    usaCodigoBarrasManual: false,
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
        planId: Number(empresa?.plan?.id || (empresa as any)?.planId || 0),
        tipoEmpresa: (empresa as any).tipoEmpresa || 'FORMAL',
        departamento: empresa.departamento || '',
        provincia: empresa.provincia || '',
        distrito: empresa.distrito || '',
        ubigeo: empresa.ubigeo || '',
        rubroId: empresa.rubro?.id || 0,
        nombreComercial: empresa.nombreComercial || '',
        fechaActivacion: empresa.fechaActivacion.split('T')[0],
        fechaExpiracion: empresa.fechaExpiracion.split('T')[0],
        usuarioPse: (empresa as any).usuarioPse || '',
        contrasenaPse: (empresa as any).contrasenaPse || '',
        usaCodigoBarrasManual: Boolean((empresa as any).usaCodigoBarrasManual),
        usuario: {
          nombre: adminUser.nombre || '',
          email: adminUser.email || '',
          dni: adminUser.dni || '',
          celular: adminUser.celular || '',
          password: '', // Password empty by default
        },
        esAgenteRetencion: (empresa as any).esAgenteRetencion || false,
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
    console.log('[DEBUG] selectedPlan - isEdit:', isEdit, 'editData.planId:', editData.planId, 'createData.planId:', createData.planId, 'looking for id:', id);
    return (planes as any[] || []).find((p: any) => p.id === id);
  }, [planes, isEdit, editData.planId, createData.planId]);

  // Planes que incluyen tienda virtual
  const storePlans: any[] = useMemo(() => {
    return (planes as any[] || []).filter((p: any) => !!p?.tieneTienda);
  }, [planes]);

  console.log('[DEBUG] empresa:', empresa, 'empresa.plan:', empresa?.plan, 'editData.planId:', editData.planId);
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
    if (!isEdit && esSuperAdmin && !createData.brand) e.brand = 'Selecciona la plataforma de destino';
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

  const width = '1200px';

  return (
    <Modal isOpenModal={open} closeModal={onClose} title={isEdit ? 'Editar Empresa' : 'Nueva Empresa'} width={width}>
      <div className="grid grid-cols-1 md:grid-cols-12 min-h-[600px]">
        {/* Sidebar */}
        <aside className="md:col-span-3 border-r border-gray-100 p-6 bg-slate-50/50 flex flex-col">
          <div className="flex flex-col items-center text-center pb-6 border-b border-gray-100 mb-6">
            <div className="h-24 w-24 rounded-full bg-white shadow-sm overflow-hidden mb-4 border border-gray-200 flex items-center justify-center">
              {logoPreview ? (
                <img src={logoPreview} className="h-full w-full object-cover" alt="Logo de la empresa" />
              ) : (
                <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              )}
            </div>
            <p className="text-base font-bold text-gray-900 leading-tight">
              {isEdit ? (empresa?.razonSocial || '-') : 'Nueva Empresa'}
            </p>
            <p className="text-xs text-gray-500 mt-1 font-medium bg-gray-100 px-2 py-1 rounded-md">{isEdit ? empresa?.ruc : 'RUC por registrar'}</p>
          </div>
          
          <nav className="space-y-1.5 flex-1">
            {[
              { id: 'datos', label: 'Datos de Empresa', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
              { id: 'suscripcion', label: 'Plan y Vigencia', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
              { id: 'sunat', label: 'Integración SUNAT', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
              { id: 'admin', label: 'Administrador Principal', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
            ].map((t: any) => (
              <button
                key={t.id}
                type="button"
                className={`w-full flex items-center px-4 py-3 rounded-xl text-sm transition-all duration-200 ${
                  activeTab === t.id 
                    ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-500/20' 
                    : 'text-gray-600 hover:bg-white hover:text-gray-900 border border-transparent hover:border-gray-200 hover:shadow-sm'
                }`}
                onClick={() => setActiveTab(t.id)}
              >
                <svg className={`w-5 h-5 mr-3 ${activeTab === t.id ? 'text-white' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={activeTab === t.id ? "2" : "1.5"} d={t.icon} />
                </svg>
                {t.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <section className="md:col-span-9 p-8 bg-white overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6 h-full flex flex-col">
            
            <div className="flex-1">
              {activeTab === 'datos' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2 mb-4">Información General</h3>

                  {/* Selector de plataforma — solo supermegaadmin en modo creación */}
                  {!isEdit && esSuperAdmin && (
                    <div className="mb-2">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Plataforma de destino <span className="text-red-500">*</span></p>
                      <div className="grid grid-cols-2 gap-3">
                        {([
                          { id: 'falconext', label: 'Falconext', icon: 'solar:rocket-bold-duotone', color: '#6366F1' },
                          { id: 'krezka', label: 'Krezka', icon: 'solar:star-bold-duotone', color: '#10B981' },
                        ] as const).map((p) => {
                          const sel = createData.brand === p.id;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => { setCreateData(prev => ({ ...prev, brand: p.id })); if (errors.brand) setErrors(prev => ({ ...prev, brand: '' })); }}
                              className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${sel ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-200 hover:border-blue-300 bg-white'}`}
                            >
                              <Icon icon={p.icon} width={22} style={{ color: sel ? p.color : '#9CA3AF' }} />
                              <span className={`font-semibold text-sm ${sel ? 'text-gray-900' : 'text-gray-500'}`}>{p.label}</span>
                              {sel && <Icon icon="solar:check-circle-bold" width={18} className="ml-auto text-blue-500" />}
                            </button>
                          );
                        })}
                      </div>
                      {errors.brand && <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1"><Icon icon="solar:danger-circle-bold" width={13} />{errors.brand}</p>}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <InputPro name="ruc" label="RUC" isLabel value={isEdit ? editData.ruc : createData.ruc} onChange={handleChange} handleOnBlur={!isEdit ? () => handleRucBlur() : undefined} error={errors.ruc} maxLength={11} />
                    <InputPro name="razonSocial" label="Razón Social" isLabel value={isEdit ? editData.razonSocial : createData.razonSocial} onChange={handleChange} error={errors.razonSocial} />
                    <InputPro name="nombreComercial" label="Nombre Comercial" isLabel value={isEdit ? editData.nombreComercial : createData.nombreComercial} onChange={handleChange} error={errors.nombreComercial} />
                    {/* @ts-ignore */}
                    <div className="relative">
                      <Select name="rubroId" label="Rubro" options={rubrosOptions} value={isEdit ? (rubrosOptions as any[]).find((r: any) => r.id === editData.rubroId)?.value : (rubrosOptions as any[]).find((r: any) => r.id === createData.rubroId)?.value} onChange={(id: any, v: string) => handleSelect(id, v, 'rubroId')} error={errors.rubroId} withLabel />
                    </div>
                    <Select error={() => { }} name="tipoEmpresa" label="Tipo de Empresa" options={[{ id: 'FORMAL', value: 'Empresa Formal' }, { id: 'INFORMAL', value: 'Empresa Informal' }]} value={isEdit ? (editData.tipoEmpresa === 'FORMAL' ? 'Empresa Formal' : 'Empresa Informal') : (createData.tipoEmpresa === 'FORMAL' ? 'Empresa Formal' : 'Empresa Informal')} onChange={(id: any, v: string) => handleSelect(id, v, 'tipoEmpresa')} withLabel />
                    
                    <div className="md:col-span-2">
                      <InputPro name="direccion" label="Dirección" isLabel value={isEdit ? editData.direccion : createData.direccion} onChange={handleChange} error={errors.direccion} />
                    </div>
                    
                    <div className="md:col-span-2">
                       <Select value={isEdit ? `${editData.departamento} - ${editData.provincia} - ${editData.distrito}` : `${createData.departamento} - ${createData.provincia} - ${createData.distrito}`} name="ubigeo" label="Ubicación (Departamento - Provincia - Distrito)" options={ubigeosOptions} onChange={(id: any) => handleUbigeoChange(id)} error={errors.ubigeo} isSearch withLabel />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Logo de la Empresa</label>
                      <div className="flex items-center space-x-4">
                        {logoPreview && (
                          <div className="h-16 w-16 rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
                            <img src={logoPreview} alt="preview" className="h-full w-full object-cover" />
                          </div>
                        )}
                        <label className="flex flex-col items-center justify-center w-full max-w-sm h-16 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 hover:border-blue-300 transition-colors">
                            <div className="flex flex-row items-center justify-center space-x-2">
                                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                                <p className="text-sm text-gray-500 font-medium">Click para subir un logo</p>
                            </div>
                            <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                        </label>
                      </div>
                    </div>

                    {isEdit && (
                      <div className="md:col-span-2 mt-2">
                        <label className="flex items-start space-x-3 p-4 border rounded-xl bg-blue-50/50 border-blue-100 cursor-pointer hover:bg-blue-50 transition-colors mb-3">
                          <input
                            type="checkbox"
                            name="usaCodigoBarrasManual"
                            checked={Boolean(editData.usaCodigoBarrasManual)}
                            onChange={(e) => setEditData(prev => ({ ...prev, usaCodigoBarrasManual: e.target.checked }))}
                            className="mt-1 w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          />
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900">Habilitar código de barras en productos</span>
                            <span className="text-sm text-gray-600 mt-0.5">
                              Fuerza la visualización del campo "Código de Barras" en productos, sin depender del rubro.
                            </span>
                          </div>
                        </label>

                        <label className="flex items-start space-x-3 p-4 border rounded-xl bg-blue-50/50 border-blue-100 cursor-pointer hover:bg-blue-50 transition-colors">
                          <input
                            type="checkbox"
                            name="esAgenteRetencion"
                            checked={editData.esAgenteRetencion || false}
                            onChange={(e) => setEditData(prev => ({ ...prev, esAgenteRetencion: e.target.checked }))}
                            className="mt-1 w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          />
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900">Agente de Retención (SUNAT)</span>
                            <span className="text-sm text-gray-600 mt-0.5">
                              Activa esta opción si la empresa ha sido designada como Agente de Retención por SUNAT (Régimen de Retenciones del IGV).
                            </span>
                          </div>
                        </label>
                      </div>
                    )}

                    {!isEdit && (
                      <div className="md:col-span-2 mt-2">
                        <label className="flex items-start space-x-3 p-4 border rounded-xl bg-blue-50/50 border-blue-100 cursor-pointer hover:bg-blue-50 transition-colors">
                          <input
                            type="checkbox"
                            name="usaCodigoBarrasManual"
                            checked={Boolean(createData.usaCodigoBarrasManual)}
                            onChange={(e) => setCreateData(prev => ({ ...prev, usaCodigoBarrasManual: e.target.checked }))}
                            className="mt-1 w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          />
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900">Habilitar código de barras en productos</span>
                            <span className="text-sm text-gray-600 mt-0.5">
                              Activa el campo "Código de Barras" en productos para esta empresa desde el inicio.
                            </span>
                          </div>
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'suscripcion' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2 mb-4">Planes Disponibles</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {planes && Array.isArray(planes) && planes.map((plan: any) => {
                      const selectedPlanId = Number(isEdit ? editData.planId : createData.planId);
                      const selected = selectedPlanId === Number(plan.id);
                      return (
                        <div key={plan.id} onClick={() => (isEdit ? setEditData(prev => ({ ...prev, planId: plan.id })) : setCreateData(prev => ({ ...prev, planId: plan.id })))} className={`relative p-5 border-2 rounded-2xl cursor-pointer transition-all duration-200 flex flex-col h-full ${selected ? 'border-blue-600 bg-blue-50/40 shadow-lg ring-1 ring-blue-600' : 'border-gray-200 hover:border-blue-300 hover:shadow-md bg-white'}`}>
                          {selected && (
                            <div className="absolute top-3 right-3 text-blue-600">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                          <div className="font-extrabold text-gray-900 mb-1 text-lg pr-6">{plan.nombre}</div>
                          <div className="text-xs text-gray-500 mb-4 line-clamp-2 min-h-[32px]">{plan.descripcion || 'Plan estándar para uso general'}</div>
                          <div className="mt-auto">
                            <div className="text-2xl font-black text-blue-700 tracking-tight">
                              <span className="text-lg text-blue-600 font-bold mr-1">S/</span>
                              {Number(plan.costo || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              {plan.tipoFacturacion && (<span className="text-xs font-medium text-gray-500 ml-1">/{plan.tipoFacturacion.toLowerCase()}</span>)}
                            </div>
                            <div className="flex justify-between items-center text-xs font-medium text-gray-600 mt-4 pt-3 border-t border-gray-100">
                              {plan.limiteUsuarios ? <span className="flex items-center"><svg className="w-3.5 h-3.5 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>{plan.limiteUsuarios} Usu.</span> : <span />}
                              {plan.duracionDias ? <span className="flex items-center"><svg className="w-3.5 h-3.5 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>{plan.duracionDias} días</span> : <span />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2 mb-4 mt-8">Fechas de Vigencia</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <InputPro name="fechaActivacion" label="Fecha de Activación" type="date" isLabel value={isEdit ? editData.fechaActivacion : createData.fechaActivacion} onChange={handleChange} />
                    <InputPro name="fechaExpiracion" label="Fecha de Expiración" type="date" isLabel value={isEdit ? editData.fechaExpiracion : (createData.fechaExpiracion || '')} onChange={handleChange} />
                  </div>

                  <div className="rounded-xl border border-blue-100 bg-blue-50/30 p-5 mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-gray-900">Módulo de Tienda Virtual</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {selectedPlan?.tieneTienda ? (
                          <span>Este plan <strong className="text-emerald-600 font-semibold">incluye tienda virtual</strong>.</span>
                        ) : (
                          <span>Este plan no incluye módulo de tienda virtual.</span>
                        )}
                      </p>
                      {selectedPlan?.tieneTienda && isEdit && (
                        <div className="mt-2 text-xs text-gray-600 flex items-center space-x-2">
                          <span className={`w-2 h-2 rounded-full ${(empresa as any)?.slugTienda ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                          <span>Estado: <strong className="font-medium">{(empresa as any)?.slugTienda ? 'Activa' : 'Pendiente de configurar'}</strong></span>
                          {(empresa as any)?.slugTienda && (
                            <>
                              <span className="text-gray-300">|</span>
                              <a href={`${window.location.origin}/tienda/{(empresa as any).slugTienda}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline">
                                Ver Tienda
                              </a>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    {selectedPlan?.tieneTienda ? (
                      isAdminSistema ? (
                        <div className="bg-white px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-500 text-center">Solo administradores<br/>de la empresa</div>
                      ) : (
                        <Button
                          type="button"
                          color="secondary"
                          className="shrink-0 font-medium whitespace-nowrap shadow-sm"
                          disabled={isEdit ? initialEditPlanId !== undefined && initialEditPlanId !== editData.planId : true}
                          onClick={() => navigate('/administrador/tienda/configuracion')}
                        >
                          {isEdit
                            ? (initialEditPlanId !== undefined && initialEditPlanId !== editData.planId
                              ? 'Guardar para configurar'
                              : ((empresa as any)?.slugTienda ? 'Gestionar Tienda' : 'Configurar Tienda'))
                            : 'Guardar y Configurar'}
                        </Button>
                      )
                    ) : (
                      <Button type="button" color="white" outline onClick={selectFirstStorePlan} className="shrink-0 border-gray-300 shadow-sm font-medium">
                        Ver planes con tienda
                      </Button>
                    )}
                  </div>
                  
                  {!isEdit && (
                    <label className="flex items-center mt-4 w-max group cursor-pointer">
                      <div className="relative flex items-center">
                        <input type="checkbox" checked={createData.esPrueba} onChange={handleEsPrueba} className="w-5 h-5 text-blue-600 rounded border-gray-300 cursor-pointer peer focus:ring-blue-500 focus:ring-2" />
                      </div>
                      <span className="ml-3 text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">Activar versión de prueba gratuita</span>
                    </label>
                  )}
                </div>
              )}

              {activeTab === 'sunat' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2 mb-4">Credenciales SUNAT / PSE</h3>
                  <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-5 mb-6">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-amber-500 mt-0.5 mr-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm text-amber-800 leading-relaxed">
                        Credenciales QPSE asignadas por el Proveedor de Servicios Electrónicos. Son necesarias para la emisión de comprobantes electrónicos válidos. Si se dejan en blanco, se usarán las credenciales globales del sistema.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <InputPro name="usuarioPse" label="Usuario PSE (QPSE)" isLabel value={isEdit ? (editData.usuarioPse || '') : (createData.usuarioPse || '')} onChange={handleChange} placeholder="Ej. 0HGRQ55B" />
                    <InputPro name="contrasenaPse" label="Contraseña PSE (QPSE)" type="password" isLabel value={isEdit ? (editData.contrasenaPse || '') : (createData.contrasenaPse || '')} onChange={handleChange} placeholder="Ej. R8101ZBD" />
                  </div>
                </div>
              )}

              {activeTab === 'admin' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2 mb-4">Superusuario de la Empresa</h3>
                  
                  {isEdit && (
                    <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-4 mb-6">
                      <div className="flex items-start">
                        <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm text-blue-800 leading-relaxed">
                          Aquí puedes actualizar los datos del administrador principal de esta empresa. <strong>Si dejas la contraseña en blanco, se mantendrá la actual.</strong>
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <InputPro name="usuario.nombre" label="Nombre Completo" isLabel value={isEdit ? editData.usuario?.nombre || '' : createData.usuario.nombre} onChange={handleChange} error={isEdit ? '' : errors['usuario.nombre']} />
                    <InputPro name="usuario.dni" label="DNI" isLabel value={isEdit ? editData.usuario?.dni || '' : createData.usuario.dni} onChange={handleChange} error={isEdit ? '' : errors['usuario.dni']} maxLength={8} />
                    <InputPro name="usuario.email" label="Correo Electrónico" type="email" isLabel value={isEdit ? editData.usuario?.email || '' : createData.usuario.email} onChange={handleChange} error={isEdit ? '' : errors['usuario.email']} />
                    <InputPro name="usuario.celular" label="Número de Celular" isLabel value={isEdit ? editData.usuario?.celular || '' : createData.usuario.celular} onChange={handleChange} error={isEdit ? '' : errors['usuario.celular']} />
                    <div className="md:col-span-2">
                       <InputPro name="usuario.password" label={isEdit ? "Nueva Contraseña (Opcional)" : "Contraseña de Acceso"} type="password" isLabel value={isEdit ? editData.usuario?.password || '' : createData.usuario.password} onChange={handleChange} error={isEdit ? '' : errors['usuario.password']} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions Footer */}
            <div className="pt-6 border-t border-gray-100 flex items-center justify-between mt-auto">
              <div>
                {Object.keys(errors).length > 0 && (
                  <span className="text-sm text-red-500 font-medium flex items-center">
                    <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Por favor, completa los campos requeridos
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                <Button type="button" color="white" outline onClick={onClose} className="px-6 font-medium bg-white hover:bg-gray-50 border-gray-200">
                  Cancelar
                </Button>
                <Button type="submit" color="secondary" disabled={isSubmitting} className="px-8 shadow-sm">
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {isEdit ? 'Guardando...' : 'Creando...'}
                    </span>
                  ) : (isEdit ? 'Guardar Cambios' : 'Crear Empresa')}
                </Button>
              </div>
            </div>
            
          </form>
        </section>
      </div>
    </Modal>
  );
}
