import { useState } from 'react';
import { Icon } from '@iconify/react';
import apiClient from '@/utils/apiClient';
import { post } from '@/utils/fetch';
import useAlertStore from '@/zustand/alert';

const MESES = [
  { id: 1, value: 'Enero' }, { id: 2, value: 'Febrero' }, { id: 3, value: 'Marzo' },
  { id: 4, value: 'Abril' }, { id: 5, value: 'Mayo' }, { id: 6, value: 'Junio' },
  { id: 7, value: 'Julio' }, { id: 8, value: 'Agosto' }, { id: 9, value: 'Septiembre' },
  { id: 10, value: 'Octubre' }, { id: 11, value: 'Noviembre' }, { id: 12, value: 'Diciembre' },
];

const currentYear = new Date().getFullYear();
const ANIOS = Array.from({ length: 6 }, (_, i) => currentYear - i).map((y) => ({ id: y, value: String(y) }));

export default function LibroCompras() {
  const { alert, load } = useAlertStore();
  const [mes, setMes] = useState<number | null>(null);
  const [anio, setAnio] = useState<number | null>(null);
  const [simple, setSimple] = useState(false);
  const [enviandoCorreo, setEnviandoCorreo] = useState(false);
  const [destinatario, setDestinatario] = useState('');
  const [mostrarCorreo, setMostrarCorreo] = useState(false);

  const validar = () => {
    if (!mes || !anio) {
      alert('Selecciona el mes y año', 'warning');
      return false;
    }
    return true;
  };

  const buildQuery = () => {
    return new URLSearchParams({
      mes: String(mes),
      anio: String(anio),
      simple: String(simple),
    }).toString();
  };

  const handleDescargarTxt = async () => {
    if (!validar()) return;
    try {
      load(true);
      const resp = await apiClient.get(`/contabilidad/sire/compras-txt?${buildQuery()}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([resp.data], { type: 'text/plain' }));
      const link = document.createElement('a');
      link.href = url;
      const periodo = `${anio}${String(mes).padStart(2, '0')}`;
      link.setAttribute('download', `SIRE_RCE_${periodo}.txt`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Error al generar el TXT', 'error');
    } finally {
      load(false);
    }
  };

  const handleDescargarExcel = async () => {
    if (!validar()) return;
    try {
      load(true);
      const resp = await apiClient.get(`/contabilidad/sire/compras-excel?${buildQuery()}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(
        new Blob([resp.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      );
      const link = document.createElement('a');
      link.href = url;
      const periodo = `${anio}${String(mes).padStart(2, '0')}`;
      link.setAttribute('download', `SIRE_RCE_${periodo}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Error al generar el Excel', 'error');
    } finally {
      load(false);
    }
  };

  const handleEnviarCorreo = async () => {
    if (!validar()) return;
    if (!destinatario.trim()) {
      alert('Ingresa el correo destinatario', 'warning');
      return;
    }
    try {
      setEnviandoCorreo(true);
      const result = await post('/contabilidad/sire/compras-correo', {
        mes,
        anio,
        simple,
        destinatario: destinatario.trim(),
      });
      if (!result.success) {
        alert((result as any).error ?? 'Error al enviar el correo', 'error');
        return;
      }
      alert('Correo enviado correctamente', 'success');
      setMostrarCorreo(false);
      setDestinatario('');
    } finally {
      setEnviandoCorreo(false);
    }
  };

  return (
    <div className="min-h-screen px-2 pb-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <span>Reporte SUNAT</span>
        <Icon icon="solar:alt-arrow-right-linear" className="text-xs" />
        <span className="text-blue-600 font-medium">Libro electrónico de compras</span>
      </div>

      <div className="max-w-xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-gray-900 text-center mb-1">
            Libro electrónico de compras
          </h2>
          <p className="text-xs text-gray-400 text-center mb-6">RCE — Registro de Compras Electrónico</p>

          {/* Checkbox */}
          <div className="flex justify-center mb-6">
            <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-gray-700">
              <input
                type="checkbox"
                checked={simple}
                onChange={(e) => setSimple(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Formato simple
            </label>
          </div>

          {/* Selectores */}
          <div className="flex gap-4 mb-8">
            <div className="flex-1">
              <select
                value={mes ?? ''}
                onChange={(e) => setMes(e.target.value ? Number(e.target.value) : null)}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Mes</option>
                {MESES.map((m) => (
                  <option key={m.id} value={m.id}>{m.value}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <select
                value={anio ?? ''}
                onChange={(e) => setAnio(e.target.value ? Number(e.target.value) : null)}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Año</option>
                {ANIOS.map((a) => (
                  <option key={a.id} value={a.id}>{a.value}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Botones principales */}
          <div className="flex justify-center gap-3 mb-3">
            <button
              onClick={handleDescargarTxt}
              className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Icon icon="solar:file-text-bold-duotone" className="text-lg" />
              Descargar TXT
            </button>
            <button
              onClick={() => {
                if (!validar()) return;
                setMostrarCorreo((v) => !v);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Icon icon="solar:letter-bold-duotone" className="text-lg" />
              Enviar por correo
            </button>
          </div>

          <div className="flex justify-center mb-6">
            <button
              onClick={handleDescargarExcel}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors"
            >
              <Icon icon="solar:file-check-bold-duotone" className="text-lg" />
              Descargar Excel
            </button>
          </div>

          {/* Panel correo */}
          {mostrarCorreo && (
            <div className="border-t border-gray-100 pt-6">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 text-center">
                Envío automático
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={destinatario}
                  onChange={(e) => setDestinatario(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleEnviarCorreo}
                  disabled={enviandoCorreo}
                  className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {enviandoCorreo ? (
                    <Icon icon="solar:refresh-circle-bold-duotone" className="animate-spin text-lg" />
                  ) : (
                    <Icon icon="solar:plain-bold-duotone" className="text-lg" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">
                Se enviará el TXT y Excel adjuntos al correo indicado
              </p>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-4">
          <div className="flex gap-3">
            <Icon icon="solar:info-circle-bold-duotone" className="text-blue-500 text-xl shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-semibold mb-1">Sobre el RCE</p>
              <ul className="space-y-0.5 text-xs text-blue-600">
                <li>• El TXT sigue el formato SUNAT para importación en el sistema SIRE.</li>
                <li>• Incluye todas las compras registradas en el período seleccionado.</li>
                <li>• <strong>Formato simple:</strong> incluye solo los campos básicos (base, IGV, total).</li>
                <li>• El proveedor debe estar registrado con su RUC para el formato correcto.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
