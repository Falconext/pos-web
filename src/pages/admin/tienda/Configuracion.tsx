import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import apiClient from '@/utils/apiClient';
import useAlertStore from '@/zustand/alert';
import Button from '@/components/Button';
import InputPro from '@/components/InputPro';
import ModalConfirm from '@/components/ModalConfirm';

export default function ConfiguracionTienda() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { alert } = useAlertStore();

  const [formData, setFormData] = useState({
    slugTienda: '',
    descripcionTienda: '',
    whatsappTienda: '',
    facebookUrl: '',
    instagramUrl: '',
    tiktokUrl: '',
    horarioAtencion: '',
    colorPrimario: '#000000',
    colorSecundario: '#ffffff',
    yapeQrUrl: '',
    yapeNumero: '',
    plinQrUrl: '',
    plinNumero: '',
    aceptaEfectivo: true,
    // Configuración de envío
    costoEnvioFijo: 0,
    aceptaRecojo: true,
    aceptaEnvio: true,
    direccionRecojo: '',
    tiempoPreparacionMin: 30,
    // Información Bancaria
    bancoNombre: '',
    numeroCuenta: '',
    cci: '',
    monedaCuenta: 'SOLES',
  });

  // Subida de QR
  const [yapeFile, setYapeFile] = useState<File | null>(null);
  const [plinFile, setPlinFile] = useState<File | null>(null);
  const [yapeUploading, setYapeUploading] = useState(false);
  const [plinUploading, setPlinUploading] = useState(false);
  const [previewYapeUrl, setPreviewYapeUrl] = useState<string>('');
  const [previewPlinUrl, setPreviewPlinUrl] = useState<string>('');

  // Estado para modal de confirmación
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleteQrType, setDeleteQrType] = useState<'yape' | 'plin' | null>(null);

  // Estado para banners
  const [banners, setBanners] = useState<any[]>([]);
  const [loadingBanners, setLoadingBanners] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  // New banner fields
  const [newBannerTitle, setNewBannerTitle] = useState('');
  const [newBannerSubtitle, setNewBannerSubtitle] = useState('');
  const [newBannerLink, setNewBannerLink] = useState('');
  const [newBannerOrden, setNewBannerOrden] = useState<number | ''>('');

  // Search products for banners
  const [productSearch, setProductSearch] = useState('');
  const [productResults, setProductResults] = useState<any[]>([]);
  const [searchingProducts, setSearchingProducts] = useState(false);

  // Editing state
  const [editingBanner, setEditingBanner] = useState<any>(null);
  const [editBannerTitle, setEditBannerTitle] = useState('');
  const [editBannerSubtitle, setEditBannerSubtitle] = useState('');
  const [editBannerLink, setEditBannerLink] = useState('');
  const [editBannerOrden, setEditBannerOrden] = useState<number | ''>('');
  const [editBannerFile, setEditBannerFile] = useState<File | null>(null);
  const [editSearch, setEditSearch] = useState('');
  const [editResults, setEditResults] = useState<any[]>([]);
  const [searchingEdit, setSearchingEdit] = useState(false);

  useEffect(() => {
    cargarConfiguracion();
    cargarBanners();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (productSearch.trim().length > 2) {
        setSearchingProducts(true);
        try {
          // Using public endpoint for ease, or admin endpoint if available.
          // Admin usually has /producto
          const { data } = await apiClient.get('/producto', {
            params: {
              limit: 5,
              page: 1,
              search: productSearch
            }
          });
          // data.data (response from axios) -> .data (payload) -> .productos (array based on user input)
          const payload = data.data;
          setProductResults(payload?.productos || payload?.data || payload || []);
        } catch (error) {
          console.error(error);
          setProductResults([]);
        } finally {
          setSearchingProducts(false);
        }
      } else {
        setProductResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [productSearch]);

  // Efecto para búsqueda en edición
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (editSearch.trim().length > 2) {
        setSearchingEdit(true);
        try {
          const { data } = await apiClient.get('/producto', {
            params: { limit: 5, page: 1, search: editSearch }
          });
          const payload = data.data;
          setEditResults(payload?.productos || payload?.data || payload || []);
        } catch (error) {
          console.error(error);
          setEditResults([]);
        } finally {
          setSearchingEdit(false);
        }
      } else {
        setEditResults([]);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [editSearch]);

  const handleUpdateBanner = async () => {
    if (!editingBanner) return;
    try {
      setSaving(true);
      const fd = new FormData();
      if (editBannerTitle) fd.append('titulo', editBannerTitle);
      if (editBannerSubtitle) fd.append('subtitulo', editBannerSubtitle);
      if (editBannerLink) fd.append('linkUrl', editBannerLink);
      if (editBannerFile) fd.append('file', editBannerFile);
      if (editBannerOrden !== '' && editBannerOrden !== undefined) fd.append('orden', String(editBannerOrden));

      // Even if fields are empty, we might want to allow clearing them? 
      // Current logic implies upsert. Backend uses partial update.

      await apiClient.patch(`/banners/${editingBanner.id}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('Banner actualizado correctamente', 'success');
      setEditingBanner(null);
      setEditBannerTitle('');
      setEditBannerSubtitle('');
      setEditBannerLink('');
      setEditBannerOrden('');
      setEditBannerFile(null);
      setEditSearch('');
      cargarBanners();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al actualizar banner', 'error');
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (banner: any) => {
    setEditingBanner(banner);
    setEditBannerTitle(banner.titulo || '');
    setEditBannerSubtitle(banner.subtitulo || '');
    setEditBannerLink(banner.linkUrl || '');
    setEditBannerOrden(banner.orden ?? '');
    setEditBannerFile(null);
    setEditSearch('');
  };

  const cargarConfiguracion = async () => {
    try {
      const { data } = await apiClient.get('/tienda/config');
      setConfig(data.data);
      setFormData({
        slugTienda: data.data.slugTienda || '',
        descripcionTienda: data.data.descripcionTienda || '',
        whatsappTienda: data.data.whatsappTienda || '',
        facebookUrl: data.data.facebookUrl || '',
        instagramUrl: data.data.instagramUrl || '',
        tiktokUrl: data.data.tiktokUrl || '',
        horarioAtencion: data.data.horarioAtencion || '',
        colorPrimario: data.data.colorPrimario || '#000000',
        colorSecundario: data.data.colorSecundario || '#ffffff',
        yapeQrUrl: data.data.yapeQrUrl || '',
        yapeNumero: data.data.yapeNumero || '',
        plinQrUrl: data.data.plinQrUrl || '',
        plinNumero: data.data.plinNumero || '',
        aceptaEfectivo: data.data.aceptaEfectivo ?? true,
        costoEnvioFijo: Number(data.data.costoEnvioFijo || 0),
        aceptaRecojo: data.data.aceptaRecojo ?? true,
        aceptaEnvio: data.data.aceptaEnvio ?? true,
        direccionRecojo: data.data.direccionRecojo || '',
        tiempoPreparacionMin: data.data.tiempoPreparacionMin || 30,
        bancoNombre: data.data.bancoNombre || '',
        numeroCuenta: data.data.numeroCuenta || '',
        cci: data.data.cci || '',
        monedaCuenta: data.data.monedaCuenta || 'SOLES',
      });
      setPreviewYapeUrl(data.data.yapeQrSignedUrl || data.data.yapeQrUrl || '');
      setPreviewPlinUrl(data.data.plinQrSignedUrl || data.data.plinQrUrl || '');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al cargar configuración', 'error');
    } finally {
      setLoading(false);
    }
  };

  const subirQr = async (tipo: 'yape' | 'plin') => {
    try {
      const file = tipo === 'yape' ? yapeFile : plinFile;
      if (!file) {
        alert('Selecciona una imagen primero', 'warning');
        return;
      }
      tipo === 'yape' ? setYapeUploading(true) : setPlinUploading(true);
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await apiClient.post(`/tienda/qr/${tipo}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = data?.data?.url || data?.url;
      const signed = data?.data?.signedUrl || data?.signedUrl || url;
      setFormData((prev) => ({
        ...prev,
        yapeQrUrl: tipo === 'yape' ? url : prev.yapeQrUrl,
        plinQrUrl: tipo === 'plin' ? url : prev.plinQrUrl,
      }));
      if (tipo === 'yape') setPreviewYapeUrl(signed);
      if (tipo === 'plin') setPreviewPlinUrl(signed);
      alert('QR subido correctamente', 'success');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al subir QR', 'error');
    } finally {
      tipo === 'yape' ? setYapeUploading(false) : setPlinUploading(false);
    }
  };

  const eliminarQr = async (tipo: 'yape' | 'plin') => {
    // Mostrar modal de confirmación
    setDeleteQrType(tipo);
    setShowConfirmDelete(true);
  };

  const confirmarEliminarQr = async () => {
    if (!deleteQrType) return;
    const tipo = deleteQrType;
    setShowConfirmDelete(false);
    setDeleteQrType(null);
    try {
      // Limpiar del formData
      setFormData((prev) => ({
        ...prev,
        yapeQrUrl: tipo === 'yape' ? '' : prev.yapeQrUrl,
        plinQrUrl: tipo === 'plin' ? '' : prev.plinQrUrl,
      }));
      if (tipo === 'yape') {
        setPreviewYapeUrl('');
        setYapeFile(null);
      }
      if (tipo === 'plin') {
        setPreviewPlinUrl('');
        setPlinFile(null);
      }
      // Guardar en servidor (enviar URL vacía)
      await apiClient.patch('/tienda/config', {
        [tipo === 'yape' ? 'yapeQrUrl' : 'plinQrUrl']: null,
      });
      alert(`QR de ${tipo.toUpperCase()} eliminado correctamente`, 'success');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al eliminar QR', 'error');
    }
  };

  // Helper para transformar texto en slug válido
  const slugify = (text: string) =>
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // quitar acentos
      .replace(/[^a-z0-9\s-]/g, '') // quitar caracteres no permitidos
      .trim()
      .replace(/[\s_]+/g, '-') // espacios a guiones
      .replace(/-+/g, '-') // colapsar guiones
      .replace(/^-+|-+$/g, ''); // quitar guiones extremos

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    const nextValue = type === 'checkbox' ? checked : value;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'slugTienda' ? slugify(String(nextValue)) : nextValue,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // No enviar URLs vacías (los campos con @IsUrl fallan si llega '')
      const payload: any = { ...formData };
      ['facebookUrl', 'instagramUrl', 'tiktokUrl', 'yapeQrUrl', 'plinQrUrl'].forEach((k) => {
        if (payload[k] === '') {
          delete payload[k];
        } else if (typeof payload[k] === 'string' && !/^https?:\/\//i.test(payload[k])) {
          payload[k] = `https://${payload[k]}`;
        }
      });
      // Slug: asegurar formato válido aunque el usuario escriba libre
      if (payload.slugTienda) payload.slugTienda = slugify(payload.slugTienda);
      // Coaccionar valores numéricos para evitar guardar strings en backend
      if (payload.costoEnvioFijo !== undefined && payload.costoEnvioFijo !== null && payload.costoEnvioFijo !== '') {
        payload.costoEnvioFijo = Number(payload.costoEnvioFijo);
      }
      if (payload.tiempoPreparacionMin !== undefined && payload.tiempoPreparacionMin !== null && payload.tiempoPreparacionMin !== '') {
        payload.tiempoPreparacionMin = Number(payload.tiempoPreparacionMin);
      }

      await apiClient.patch('/tienda/config', payload);
      alert('Configuración guardada exitosamente', 'success');
      cargarConfiguracion();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al guardar configuración', 'error');
    } finally {
      setSaving(false);
    }
  };

  const abrirTienda = () => {
    if (formData.slugTienda) {
      window.open(`/tienda/${formData.slugTienda}`, '_blank');
    } else {
      alert('Primero configura el nombre de tu tienda (slug)', 'warning');
    }
  };

  // Funciones para banners
  const cargarBanners = async () => {
    try {
      setLoadingBanners(true);
      const { data } = await apiClient.get('/banners');
      setBanners(data.data || []);
    } catch (error: any) {
      console.error('Error al cargar banners:', error);
    } finally {
      setLoadingBanners(false);
    }
  };

  const subirBanner = async (file: File) => {
    try {
      // Validar tamaño
      if (file.size > 2.5 * 1024 * 1024) {
        alert('El archivo es demasiado grande. Máximo 2.5MB', 'error');
        return;
      }

      // Validar tipo
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        alert('Tipo de archivo no permitido. Solo JPG, PNG o WebP', 'error');
        return;
      }

      setUploadingBanner(true);
      const fd = new FormData();
      fd.append('file', file);
      fd.append('titulo', newBannerTitle || 'Banner');
      fd.append('subtitulo', newBannerSubtitle || '');
      fd.append('linkUrl', newBannerLink || '');
      // Use provided orden or calculate next orden
      const ordenValue = newBannerOrden !== '' ? newBannerOrden : banners.length;
      fd.append('orden', String(ordenValue));

      await apiClient.post('/banners/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      alert('Banner subido exitosamente', 'success');
      cargarBanners();
      // Reset selection
      setNewBannerTitle('');
      setNewBannerSubtitle('');
      setNewBannerLink('');
      setNewBannerOrden('');
      setProductSearch('');
      setProductResults([]);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al subir banner', 'error');
    } finally {
      setUploadingBanner(false);
    }
  };

  const eliminarBanner = async (id: number) => {
    try {
      await apiClient.delete(`/banners/${id}`);
      alert('Banner eliminado exitosamente', 'success');
      cargarBanners();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al eliminar banner', 'error');
    }
  };

  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      subirBanner(file);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Icon icon="eos-icons:loading" className="w-12 h-12 text-gray-400" />
      </div>
    );
  }

  if (!config?.plan?.tieneTienda) {
    return (
      <div className="max-w-2xl mx-auto mt-12 p-8 bg-white rounded-lg shadow text-center">
        <Icon icon="mdi:store-off" className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Tienda Virtual no disponible</h2>
        <p className="text-gray-600 mb-6">
          Tu plan actual no incluye tienda virtual. Actualiza tu plan para activar esta funcionalidad.
        </p>
        <Button onClick={() => window.location.href = '/administrador/perfil'}>
          Ver Planes
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-4 px-2">
      {/* Modal de confirmación para eliminar QR */}
      <ModalConfirm
        isOpenModal={showConfirmDelete}
        setIsOpenModal={setShowConfirmDelete}
        confirmSubmit={confirmarEliminarQr}
        title={`Eliminar QR de ${deleteQrType?.toUpperCase() || ''}`}
        information={`¿Estás seguro de que deseas eliminar el código QR de ${deleteQrType?.toUpperCase() || ''}? Esta acción no se puede deshacer.`}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Configuración de Tienda Virtual</h1>
          <p className="text-sm text-gray-500 mt-1">Personaliza tu tienda online y medios de pago</p>
        </div>
        {formData.slugTienda && (
          <Button onClick={abrirTienda} color="secondary" className="flex items-center gap-2">
            <Icon icon="solar:shop-2-bold" />
            Ver mi tienda
          </Button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información básica */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-5 flex items-center gap-2">
            <Icon icon="solar:info-circle-bold-duotone" className="text-xl text-blue-500" />
            Información Básica
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <InputPro
                label="Nombre de la tienda (URL)"
                name="slugTienda"
                value={formData.slugTienda}
                onChange={handleChange}
                placeholder="mi-negocio"
              />
              <p className="mt-1 text-xs text-gray-500">Solo letras minúsculas, números y guiones. Se generará automáticamente.</p>
            </div>
            <InputPro
              label="WhatsApp"
              name="whatsappTienda"
              value={formData.whatsappTienda}
              onChange={handleChange}
              placeholder="+51 999 999 999"
            />
            <div className="md:col-span-2">
              <InputPro
                label="Descripción"
                name="descripcionTienda"
                value={formData.descripcionTienda}
                onChange={handleChange}
                placeholder="Breve descripción de tu negocio"
                type="textarea"
                rows={3}
                isLabel
              />
            </div>
            <InputPro
              label="Horario de atención"
              name="horarioAtencion"
              value={formData.horarioAtencion}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Redes sociales */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-5 flex items-center gap-2">
            <Icon icon="solar:share-circle-bold-duotone" className="text-xl text-purple-500" />
            Redes Sociales
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InputPro
              label="Facebook"
              name="facebookUrl"
              value={formData.facebookUrl}
              onChange={handleChange}
              placeholder="https://facebook.com/tu-pagina"
            />
            <InputPro
              label="Instagram"
              name="instagramUrl"
              value={formData.instagramUrl}
              onChange={handleChange}
              placeholder="https://instagram.com/tu-cuenta"
            />
            <InputPro
              label="TikTok"
              name="tiktokUrl"
              value={formData.tiktokUrl}
              onChange={handleChange}
              placeholder="https://tiktok.com/@tu-cuenta"
            />
          </div>
        </div>

        {/* Medios de pago */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-5 flex items-center gap-2">
            <Icon icon="solar:wallet-money-bold-duotone" className="text-xl text-emerald-500" />
            Medios de Pago
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Yape */}
            <div className="border border-gray-100 rounded-xl p-5 bg-gray-50/50">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-lg">💜</span>
                </div>
                <span className="font-semibold text-gray-800">Yape</span>
              </div>
              <div className="space-y-4">
                <InputPro
                  label="Número Yape"
                  name="yapeNumero"
                  value={formData.yapeNumero}
                  onChange={handleChange}
                  placeholder="999 999 999"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Código QR</label>
                  <div className="flex items-stretch gap-4">
                    <div className="flex-1 flex flex-col">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-white hover:bg-gray-50 transition-colors">
                        <input type="file" accept="image/*" onChange={(e) => setYapeFile(e.target.files?.[0] || null)} className="hidden" />
                        <Icon icon="solar:upload-minimalistic-bold-duotone" className="text-3xl text-gray-400 mb-2" />
                        <span className="text-sm text-gray-500">{yapeFile ? yapeFile.name : 'Seleccionar imagen'}</span>
                      </label>
                      <div className='mt-3'>
                        <Button
                          type="button"
                          onClick={() => subirQr('yape')}
                          disabled={yapeUploading || !yapeFile}
                          color="lila"
                          fill
                          className="w-full mt-3 object-cover"
                        >
                          {yapeUploading ? 'Subiendo...' : 'Subir QR'}
                        </Button>
                      </div>
                    </div>
                    {(previewYapeUrl || formData.yapeQrUrl) ? (
                      <div className="relative">
                        <img src={previewYapeUrl || formData.yapeQrUrl} alt="QR Yape" className="w-28 h-auto max-h-40 object-contain rounded-xl border border-gray-200" />
                        <button
                          type="button"
                          onClick={() => eliminarQr('yape')}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
                          title="Eliminar QR"
                        >
                          <Icon icon="solar:trash-bin-trash-bold" className="text-xs" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-32 h-32 rounded-xl border border-gray-200 bg-gray-100 flex items-center justify-center">
                        <Icon icon="solar:qr-code-linear" className="text-4xl text-gray-300" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Plin */}
            <div className="border border-gray-100 rounded-xl p-5 bg-gray-50/50">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                  <span className="text-lg">💚</span>
                </div>
                <span className="font-semibold text-gray-800">Plin</span>
              </div>
              <div className="space-y-4">
                <InputPro
                  label="Número Plin"
                  name="plinNumero"
                  value={formData.plinNumero}
                  onChange={handleChange}
                  placeholder="999 999 999"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Código QR</label>
                  <div className="flex items-stretch gap-4">
                    <div className="flex-1 flex flex-col">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-white hover:bg-gray-50 transition-colors">
                        <input type="file" accept="image/*" onChange={(e) => setPlinFile(e.target.files?.[0] || null)} className="hidden" />
                        <Icon icon="solar:upload-minimalistic-bold-duotone" className="text-3xl text-gray-400 mb-2" />
                        <span className="text-sm text-gray-500">{plinFile ? plinFile.name : 'Seleccionar imagen'}</span>
                      </label>
                      <div className='mt-3'>
                        <Button
                          type="button"
                          onClick={() => subirQr('plin')}
                          disabled={plinUploading || !plinFile}
                          color="lila"
                          fill
                          className="w-full mt-3"
                        >

                          {plinUploading ? 'Subiendo...' : 'Subir QR'}
                        </Button>
                      </div>
                    </div>
                    {(previewPlinUrl || formData.plinQrUrl) ? (
                      <div className="relative">
                        <img src={previewPlinUrl || formData.plinQrUrl} alt="QR Plin" className="w-28 h-auto max-h-40 object-contain rounded-xl border border-gray-200" />
                        <button
                          type="button"
                          onClick={() => eliminarQr('plin')}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
                          title="Eliminar QR"
                        >
                          <Icon icon="solar:trash-bin-trash-bold" className="text-xs" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-32 h-32 rounded-xl border border-gray-200 bg-gray-100 flex items-center justify-center">
                        <Icon icon="solar:qr-code-linear" className="text-4xl text-gray-300" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-5 pt-5 border-t border-gray-100">
            <input
              type="checkbox"
              name="aceptaEfectivo"
              checked={formData.aceptaEfectivo}
              onChange={handleChange}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label className="text-sm text-gray-700">Acepto pago en efectivo contra entrega</label>
          </div>

          {/* Información Bancaria (Cotizaciones) */}
          <div className="mt-8 pt-5 border-t border-gray-100">
            <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Icon icon="solar:card-transfer-bold-duotone" className="text-xl text-blue-500" />
              Cuenta Bancaria (Para Cotizaciones)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <InputPro
                  name="bancoNombre"
                  label="Nombre del Banco"
                  value={formData.bancoNombre}
                  onChange={handleChange}
                  isLabel
                  placeholder="Ej: INTERBANK"
                />
              </div>
              <div>
                <div className="mb-1">
                  <label className="block text-sm font-medium text-gray-700">Moneda</label>
                </div>
                <select
                  name="monedaCuenta"
                  value={formData.monedaCuenta}
                  onChange={handleChange}
                  className="w-full rounded-lg border-gray-300 focus:ring-black focus:border-black"
                >
                  <option value="SOLES">SOLES</option>
                  <option value="DOLARES">DOLARES</option>
                </select>
              </div>
              <div>
                <InputPro
                  name="numeroCuenta"
                  label="N° Cuenta"
                  value={formData.numeroCuenta}
                  onChange={handleChange}
                  isLabel
                  placeholder="Ej: 200-3006350516"
                />
              </div>
              <div>
                <InputPro
                  name="cci"
                  label="CCI"
                  value={formData.cci}
                  onChange={handleChange}
                  isLabel
                  placeholder="Ej: 003-200-003006350516-35"
                />
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Esta información se mostrará en el pie de página de tus cotizaciones impresas.
            </p>
          </div>

        </div>

        {/* Configuración de Envío */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Icon icon="solar:delivery-bold" className="text-xl text-amber-500" />
            Configuración de Envío y Recojo
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="aceptaRecojo"
                  checked={formData.aceptaRecojo}
                  onChange={handleChange}
                  className="w-4 h-4"
                />
                <label className="text-sm">Acepto recojo en tienda</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="aceptaEnvio"
                  checked={formData.aceptaEnvio}
                  onChange={handleChange}
                  className="w-4 h-4"
                />
                <label className="text-sm">Acepto envío a domicilio</label>
              </div>
            </div>

            {formData.aceptaEnvio && (
              <InputPro
                label="Costo de envío fijo (S/)"
                name="costoEnvioFijo"
                type="number"
                value={formData.costoEnvioFijo}
                onChange={handleChange}
                placeholder="0.00"
                isLabel
              />
            )}

            {formData.aceptaRecojo && (
              <InputPro
                label="Dirección de recojo"
                name="direccionRecojo"
                value={formData.direccionRecojo}
                onChange={handleChange}
                placeholder="Av. Principal 123, Distrito, Ciudad"
                isLabel
              />
            )}

            <InputPro
              label="Tiempo estimado de preparación (minutos)"
              name="tiempoPreparacionMin"
              type="number"
              value={formData.tiempoPreparacionMin}
              onChange={handleChange}
              placeholder="30"
              isLabel
            />
          </div>
        </div>

        {/* Banners de Tienda Virtual */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Icon icon="solar:gallery-bold-duotone" className="text-xl text-purple-500" />
              Banners de Tienda Virtual
            </h3>
            <span className="text-xs text-gray-500">{banners.length} / 5 banners</span>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Los banners aparecerán en el slider principal de tu tienda. Tamaño recomendado: 1920x600px, máximo 2.5MB.
          </p>

          {loadingBanners ? (
            <div className="flex items-center justify-center py-12">
              <Icon icon="eos-icons:loading" className="w-8 h-8 text-gray-400" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Banners existentes */}
              {banners.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[...banners].sort((a, b) => (a.orden ?? 999) - (b.orden ?? 999)).map((banner, index) => (
                    <div key={banner.id} className="relative group">
                      <div className="aspect-[21/9] rounded-lg overflow-hidden border-2 border-gray-200">
                        <img
                          src={banner.imagenUrl}
                          alt={banner.titulo || `Banner ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {/* Orden Badge */}
                      <div className="absolute top-2 left-2 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded-full">
                        Orden: {banner.orden ?? '-'}
                      </div>
                      <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => openEditModal(banner)}
                          className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 shadow-lg transition-colors"
                          title="Editar banner"
                        >
                          <Icon icon="solar:pen-bold" className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => eliminarBanner(banner.id)}
                          className="bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg transition-colors"
                          title="Eliminar banner"
                        >
                          <Icon icon="mdi:delete" className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="mt-2 text-sm font-medium text-gray-700 text-center truncate px-2">
                        {banner.titulo || `Banner ${index + 1}`}
                        <span className="block text-xs text-gray-400 font-normal truncate">{banner.subtitulo}</span>
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Modal Edición de Banner */}
              {editingBanner && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                  <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
                    <h3 className="text-lg font-bold mb-4">Editar Banner</h3>

                    <div className="space-y-4">
                      {/* Image Preview/Edit */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Imagen del Banner</label>
                        <div className="relative aspect-[21/9] rounded-lg overflow-hidden border-2 border-dashed border-gray-300 hover:border-blue-500 transition-colors cursor-pointer bg-gray-50 flex items-center justify-center group/edit-img">
                          <input
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 opacity-0 z-10 cursor-pointer"
                            onChange={(e) => setEditBannerFile(e.target.files?.[0] || null)}
                          />
                          {editBannerFile ? (
                            <img src={URL.createObjectURL(editBannerFile)} className="w-full h-full object-cover" alt="Preview" />
                          ) : editingBanner.imagenUrl ? (
                            <img src={editingBanner.imagenUrl} className="w-full h-full object-cover" alt="Current" />
                          ) : (
                            <span className="text-gray-400">Clic para subir imagen</span>
                          )}

                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/edit-img:opacity-100 transition-opacity pointer-events-none">
                            <Icon icon="solar:camera-bold" className="text-white text-3xl" />
                          </div>
                        </div>
                        {editBannerFile && <p className="text-xs text-green-600 mt-1">Nueva imagen seleccionada: {editBannerFile.name}</p>}
                      </div>

                      <InputPro
                        label="Título"
                        name="titulo"
                        value={editBannerTitle}
                        onChange={(e: any) => setEditBannerTitle(e.target.value)}
                        placeholder="Ej: Gran Liquidación"
                      />
                      <InputPro
                        label="Subtítulo / Descripción"
                        name="subtitulo"
                        value={editBannerSubtitle}
                        onChange={(e: any) => setEditBannerSubtitle(e.target.value)}
                        placeholder="Ej: Hasta 50% de descuento"
                      />
                      <InputPro
                        label="Enlace / Link (Opcional)"
                        name="link"
                        value={editBannerLink}
                        onChange={(e: any) => setEditBannerLink(e.target.value)}
                        placeholder="Ej: /tienda/producto/xyz o https://..."
                      />
                      <InputPro
                        label="Orden de visualización"
                        name="orden"
                        type="number"
                        value={editBannerOrden}
                        onChange={(e: any) => setEditBannerOrden(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="Ej: 0, 1, 2... (menor = primero)"
                      />

                      {/* Helper para buscar producto y llenar link */}
                      <div className="relative pt-2 border-t border-gray-100">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Buscar enlace a producto (Ayuda)</label>
                        <input
                          type="text"
                          value={editSearch}
                          onChange={(e) => setEditSearch(e.target.value)}
                          placeholder="Buscar producto para obtener enlace..."
                          className="w-full text-sm rounded-lg border-gray-300 focus:ring-black focus:border-black"
                        />
                        {editSearch.length > 2 && (
                          <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 shadow-xl rounded-b-lg z-10 max-h-48 overflow-y-auto mt-1">
                            {searchingEdit ? (
                              <div className="p-3 text-center text-xs text-gray-500">Buscando...</div>
                            ) : editResults.length > 0 ? (
                              editResults.map(p => (
                                <div
                                  key={p.id}
                                  onClick={() => {
                                    setEditBannerLink(`/tienda/producto/${p.slug || p.id}`); // Assuming slug exists or fallback to id, ideally slug
                                    setEditSearch('');
                                    setEditResults([]);
                                  }}
                                  className="p-2 hover:bg-gray-50 cursor-pointer text-sm border-b last:border-0"
                                >
                                  <div className="font-medium truncate">{p.descripcion}</div>
                                  <div className="text-xs text-gray-500">S/ {p.precioUnitario}</div>
                                </div>
                              ))
                            ) : (
                              <div className="p-3 text-center text-xs text-gray-500">No se encontraron productos</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-6">
                      <Button type="button" color="secondary" onClick={() => setEditingBanner(null)}>Cancelar</Button>
                      <Button type="button" onClick={handleUpdateBanner} disabled={saving}>
                        {saving ? 'Guardando...' : 'Guardar Cambios'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Botón para subir nuevo banner */}
              {banners.length < 5 && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-semibold mb-3">Subir Nuevo Banner</h4>

                  <div className="mb-4 space-y-3">
                    <InputPro
                      label="Título del Banner"
                      name="tituloNew"
                      value={newBannerTitle}
                      onChange={(e: any) => setNewBannerTitle(e.target.value)}
                      placeholder="Ej: Nueva Colección"
                    />
                    <InputPro
                      label="Subtítulo (Opcional)"
                      name="subtituloNew"
                      value={newBannerSubtitle}
                      onChange={(e: any) => setNewBannerSubtitle(e.target.value)}
                      placeholder="Ej: Descuentos de verano"
                    />
                    <InputPro
                      label="Enlace / Link (Opcional)"
                      name="linkNew"
                      value={newBannerLink}
                      onChange={(e: any) => setNewBannerLink(e.target.value)}
                      placeholder="Ej: /tienda/producto/xyz o https://..."
                    />
                    <InputPro
                      label="Orden de visualización"
                      name="ordenNew"
                      type="number"
                      value={newBannerOrden}
                      onChange={(e: any) => setNewBannerOrden(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="Ej: 0, 1, 2... (menor = primero)"
                    />

                    <div className="relative pt-2">
                      <label className="block text-xs font-bold text-gray-500 mb-1">Ayuda: Buscar enlace de producto</label>
                      <input
                        type="text"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        placeholder="Buscar producto para autocompletar enlace..."
                        className="w-full text-sm border-gray-300 rounded-md focus:ring-black focus:border-black placeholder-gray-400"
                        disabled={!!newBannerLink && newBannerLink.length > 100} // Just visual feedback
                      />
                      {/* Results Dropdown inside relative container */}
                      {productSearch.length > 2 && (
                        <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 shadow-xl rounded-b-lg z-10 max-h-48 overflow-y-auto mt-1">
                          {searchingProducts ? (
                            <div className="p-3 text-center text-xs text-gray-500">Buscando...</div>
                          ) : productResults.length > 0 ? (
                            productResults.map(p => (
                              <div
                                key={p.id}
                                onClick={() => {
                                  setNewBannerLink(`/tienda/producto/${p.slug || p.id}`);
                                  setProductSearch('');
                                  setProductResults([]);
                                }}
                                className="p-2 hover:bg-gray-50 cursor-pointer text-sm border-b last:border-0"
                              >
                                <div className="font-medium truncate">{p.descripcion}</div>
                                <div className="text-xs text-gray-500">S/ {p.precioUnitario}</div>
                              </div>
                            ))
                          ) : (
                            <div className="p-3 text-center text-xs text-gray-500">No se encontraron productos</div>
                          )}
                        </div>
                      )}
                    </div>

                  </div>

                  <div className="mt-6">
                    <span className="block text-xs font-bold text-gray-700 mb-2">Subir Imagen del Banner</span>
                    <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-white hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {uploadingBanner ? (
                          <>
                            <Icon icon="eos-icons:loading" className="w-10 h-10 text-blue-500 mb-3" />
                            <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Subiendo banner...</span></p>
                          </>
                        ) : (
                          <>
                            <Icon icon="solar:cloud-upload-linear" className="w-10 h-10 text-gray-400 mb-3" />
                            <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Clic para subir</span> o arrastra la imagen</p>
                            <p className="text-xs text-gray-500">PNG, JPG o WEBP (MAX. 2.5MB)</p>
                          </>
                        )}
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/png, image/jpeg, image/jpg, image/webp"
                        onChange={handleBannerFileChange}
                        disabled={uploadingBanner}
                      />
                    </label>
                  </div>
                  {banners.length === 0 && !uploadingBanner && (
                    <div className="text-center py-8 text-gray-500">
                      <Icon icon="solar:gallery-bold" className="w-16 h-16 mx-auto mb-3 text-gray-300" />
                      <p className="text-sm">No hay banners aún. Sube tu primer banner para comenzar.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Colores */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Icon icon="solar:pallete-2-bold" className="text-xl text-pink-500" />
            Personalización
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Color Primario</label>
              <input
                type="color"
                name="colorPrimario"
                value={formData.colorPrimario}
                onChange={handleChange}
                className="w-full h-12 rounded border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Color Secundario</label>
              <input
                type="color"
                name="colorSecundario"
                value={formData.colorSecundario}
                onChange={handleChange}
                className="w-full h-12 rounded border"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" onClick={cargarConfiguracion} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar Configuración'}
          </Button>
        </div>
      </form >
    </div >
  );
}
