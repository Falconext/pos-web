import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import apiClient from '@/utils/apiClient';
import useAlertStore from '@/zustand/alert';
import Button from '@/components/Button';
import InputPro from '@/components/InputPro';

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
  });

  // Subida de QR
  const [yapeFile, setYapeFile] = useState<File | null>(null);
  const [plinFile, setPlinFile] = useState<File | null>(null);
  const [yapeUploading, setYapeUploading] = useState(false);
  const [plinUploading, setPlinUploading] = useState(false);
  const [previewYapeUrl, setPreviewYapeUrl] = useState<string>('');
  const [previewPlinUrl, setPreviewPlinUrl] = useState<string>('');

  useEffect(() => {
    cargarConfiguracion();
  }, []);

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
    <div className="min-h-screen pb-4">
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
                      <Button
                        type="button"
                        onClick={() => subirQr('yape')}
                        disabled={yapeUploading || !yapeFile}
                        color="lila"
                        className="w-full mt-3"
                      >
                        {yapeUploading ? 'Subiendo...' : 'Subir QR'}
                      </Button>
                    </div>
                    {(previewYapeUrl || formData.yapeQrUrl) ? (
                      <img src={previewYapeUrl || formData.yapeQrUrl} alt="QR Yape" className="w-32 h-32 object-cover rounded-xl border border-gray-200" />
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
                      <Button
                        type="button"
                        onClick={() => subirQr('plin')}
                        disabled={plinUploading || !plinFile}
                        color="lila"
                        className="w-full mt-3"
                      >
                        {plinUploading ? 'Subiendo...' : 'Subir QR'}
                      </Button>
                    </div>
                    {(previewPlinUrl || formData.plinQrUrl) ? (
                      <img src={previewPlinUrl || formData.plinQrUrl} alt="QR Plin" className="w-32 h-32 object-cover rounded-xl border border-gray-200" />
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
              />
            )}

            {formData.aceptaRecojo && (
              <InputPro
                label="Dirección de recojo"
                name="direccionRecojo"
                value={formData.direccionRecojo}
                onChange={handleChange}
                placeholder="Av. Principal 123, Distrito, Ciudad"
              />
            )}

            <InputPro
              label="Tiempo estimado de preparación (minutos)"
              name="tiempoPreparacionMin"
              type="number"
              value={formData.tiempoPreparacionMin}
              onChange={handleChange}
              placeholder="30"
            />
          </div>
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
      </form>
    </div>
  );
}
