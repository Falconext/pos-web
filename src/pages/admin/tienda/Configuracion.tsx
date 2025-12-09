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
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Configuración de Tienda Virtual</h1>
          <p className="text-gray-600">Personaliza tu tienda online</p>
        </div>
        {formData.slugTienda && (
          <Button onClick={abrirTienda} className="flex items-center gap-2">
            <Icon icon="mdi:open-in-new" />
            Ver mi tienda
          </Button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información básica */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Información Básica</h3>
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
              <label className="block text-sm font-medium mb-2">Descripción</label>
              <textarea
                name="descripcionTienda"
                value={formData.descripcionTienda}
                onChange={handleChange}
                rows={3}
                className="w-full border rounded-lg p-2"
                placeholder="Breve descripción de tu negocio"
              />
            </div>
            <InputPro
              label="Horario de atención"
              name="horarioAtencion"
              value={formData.horarioAtencion}
              onChange={handleChange}
              placeholder="Lun-Vie 9am-6pm"
            />
          </div>
        </div>

        {/* Redes sociales */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Redes Sociales</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Medios de Pago</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <InputPro
                label="QR Yape (URL de imagen)"
                name="yapeQrUrl"
                value={formData.yapeQrUrl}
                onChange={handleChange}
                placeholder="https://..."
              />
              <div className="mt-2 flex items-center gap-3">
                <input type="file" accept="image/*" onChange={(e) => setYapeFile(e.target.files?.[0] || null)} />
                <button
                  type="button"
                  onClick={() => subirQr('yape')}
                  disabled={yapeUploading || !yapeFile}
                  className="px-3 py-2 rounded-lg border text-sm hover:bg-gray-50 disabled:opacity-50"
                >
                  {yapeUploading ? 'Subiendo...' : 'Subir QR'}
                </button>
              </div>
              {(previewYapeUrl || formData.yapeQrUrl) && (
                <img src={previewYapeUrl || formData.yapeQrUrl} alt="QR Yape" className="mt-2 w-32 h-32 object-cover rounded border" />
              )}
            </div>
            <InputPro
              label="Número Yape"
              name="yapeNumero"
              value={formData.yapeNumero}
              onChange={handleChange}
              placeholder="999 999 999"
            />
            <div>
              <InputPro
                label="QR Plin (URL de imagen)"
                name="plinQrUrl"
                value={formData.plinQrUrl}
                onChange={handleChange}
                placeholder="https://..."
              />
              <div className="mt-2 flex items-center gap-3">
                <input type="file" accept="image/*" onChange={(e) => setPlinFile(e.target.files?.[0] || null)} />
                <button
                  type="button"
                  onClick={() => subirQr('plin')}
                  disabled={plinUploading || !plinFile}
                  className="px-3 py-2 rounded-lg border text-sm hover:bg-gray-50 disabled:opacity-50"
                >
                  {plinUploading ? 'Subiendo...' : 'Subir QR'}
                </button>
              </div>
              {(previewPlinUrl || formData.plinQrUrl) && (
                <img src={previewPlinUrl || formData.plinQrUrl} alt="QR Plin" className="mt-2 w-32 h-32 object-cover rounded border" />
              )}
            </div>
            <InputPro
              label="Número Plin"
              name="plinNumero"
              value={formData.plinNumero}
              onChange={handleChange}
              placeholder="999 999 999"
            />
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="aceptaEfectivo"
                checked={formData.aceptaEfectivo}
                onChange={handleChange}
                className="w-4 h-4"
              />
              <label className="text-sm">Acepto pago en efectivo</label>
            </div>
          </div>
        </div>

        {/* Configuración de Envío */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Configuración de Envío y Recojo</h3>
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
              <div>
                <label className="block text-sm font-medium mb-2">Costo de envío fijo (S/)</label>
                <input
                  type="number"
                  name="costoEnvioFijo"
                  step="0.01"
                  min="0"
                  value={formData.costoEnvioFijo}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="w-full border rounded-lg p-2"
                />
              </div>
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

            <div>
              <label className="block text-sm font-medium mb-2">Tiempo estimado de preparación (minutos)</label>
              <input
                type="number"
                name="tiempoPreparacionMin"
                min="0"
                value={formData.tiempoPreparacionMin}
                onChange={handleChange}
                placeholder="30"
                className="w-full border rounded-lg p-2"
              />
            </div>
          </div>
        </div>

        {/* Colores */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Personalización</h3>
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
