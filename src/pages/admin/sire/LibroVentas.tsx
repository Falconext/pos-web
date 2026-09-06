import { useState } from 'react';
import { Icon } from '@iconify/react';
import apiClient from '@/utils/apiClient';
import { get, post } from '@/utils/fetch';
import useAlertStore from '@/zustand/alert';

// Totales del período tal como saldrán en el TXT/Excel (mismo origen de datos).
interface ResumenVentas {
  periodo: string;
  cantidad: number;
  gravadas: number;
  igv: number;
  exoneradas: number;
  inafectas: number;
  exportacion: number;
  total: number;
  anulados: number;
  notasCredito: number;
  porTipoDoc: Record<string, { cantidad: number; total: number }>;
}

const TIPO_DOC_LABEL: Record<string, string> = {
  '01': 'Facturas',
  '03': 'Boletas',
  '07': 'Notas de crédito',
  '08': 'Notas de débito',
};

const fmtMoneda = (v: number) =>
  `S/ ${Number(v ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// El backend manda el nombre oficial que exige SUNAT (LE+RUC+periodo+...) en
// la cabecera Content-Disposition. Hay que respetarlo: si el navegador guarda
// el archivo con otro nombre, el validador PVSIRE y el portal lo rechazan.
function nombreDesdeRespuesta(headers: any, fallback: string): string {
  const cd = headers?.['content-disposition'] ?? headers?.['Content-Disposition'];
  const m = typeof cd === 'string' ? cd.match(/filename="?([^";]+)"?/i) : null;
  return m?.[1]?.trim() || fallback;
}

const MESES = [
  { id: 1, value: 'Enero' }, { id: 2, value: 'Febrero' }, { id: 3, value: 'Marzo' },
  { id: 4, value: 'Abril' }, { id: 5, value: 'Mayo' }, { id: 6, value: 'Junio' },
  { id: 7, value: 'Julio' }, { id: 8, value: 'Agosto' }, { id: 9, value: 'Septiembre' },
  { id: 10, value: 'Octubre' }, { id: 11, value: 'Noviembre' }, { id: 12, value: 'Diciembre' },
];

const currentYear = new Date().getFullYear();
const ANIOS = Array.from({ length: 6 }, (_, i) => currentYear - i).map((y) => ({ id: y, value: String(y) }));

export default function LibroVentas() {
  const { alert, load } = useAlertStore();
  const [mes, setMes] = useState<number | null>(null);
  const [anio, setAnio] = useState<number | null>(null);
  const [empresarial, setEmpresarial] = useState(false);
  const [enviandoCorreo, setEnviandoCorreo] = useState(false);
  const [destinatario, setDestinatario] = useState('');
  const [mostrarCorreo, setMostrarCorreo] = useState(false);
  const [resumen, setResumen] = useState<ResumenVentas | null>(null);
  const [cargandoResumen, setCargandoResumen] = useState(false);

  // El resumen corresponde a un período/alcance concreto: si cambian, se
  // descarta para no mostrar totales que ya no corresponden a lo que se
  // descargaría.
  const resetResumen = () => setResumen(null);

  const validar = () => {
    if (!mes || !anio) {
      alert('Selecciona el mes y año', 'warning');
      return false;
    }
    return true;
  };

  const buildQuery = () => {
    const params = new URLSearchParams({
      mes: String(mes),
      anio: String(anio),
      empresarial: String(empresarial),
    });
    return params.toString();
  };

  const handlePrevisualizar = async () => {
    if (!validar()) return;
    try {
      setCargandoResumen(true);
      const resp = await get<ResumenVentas>(
        `contabilidad/sire/ventas-resumen?mes=${mes}&anio=${anio}&empresarial=${empresarial}`,
      );
      if (resp.error || !resp.data) {
        alert(resp.error ?? 'No se pudo calcular el resumen', 'error');
        return;
      }
      setResumen(resp.data);
    } catch {
      alert('No se pudo calcular el resumen', 'error');
    } finally {
      setCargandoResumen(false);
    }
  };

  const handleDescargarTxt = async () => {
    if (!validar()) return;
    try {
      load(true);
      const resp = await apiClient.get(`/contabilidad/sire/ventas-txt?${buildQuery()}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([resp.data], { type: 'text/plain' }));
      const link = document.createElement('a');
      link.href = url;
      const periodo = `${anio}${String(mes).padStart(2, '0')}`;
      link.setAttribute(
        'download',
        nombreDesdeRespuesta(resp.headers, `SIRE_RVIE_${periodo}.txt`),
      );
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
      const resp = await apiClient.get(`/contabilidad/sire/ventas-excel?${buildQuery()}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(
        new Blob([resp.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      );
      const link = document.createElement('a');
      link.href = url;
      const periodo = `${anio}${String(mes).padStart(2, '0')}`;
      link.setAttribute('download', `SIRE_RVIE_${periodo}.xlsx`);
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
      const result = await post('/contabilidad/sire/ventas-correo', {
        mes,
        anio,
        empresarial,
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
        <span className="text-blue-600 font-medium">Libro electrónico de ventas</span>
      </div>

      <div className="max-w-xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-gray-900 text-center mb-1">
            Libro electrónico de ventas
          </h2>
          <p className="text-xs text-gray-400 text-center mb-6">RVIE — Registro de Ventas e Ingresos Electrónico</p>

          {/* Alcance */}
          <div className="flex justify-center gap-6 mb-6">
            <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-gray-700">
              <input
                type="checkbox"
                checked={empresarial}
                onChange={(e) => { setEmpresarial(e.target.checked); resetResumen(); }}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Reporte empresarial
            </label>
          </div>

          {/* Selectores */}
          <div className="flex gap-4 mb-8">
            <div className="flex-1">
              <select
                value={mes ?? ''}
                onChange={(e) => { setMes(e.target.value ? Number(e.target.value) : null); resetResumen(); }}
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
                onChange={(e) => { setAnio(e.target.value ? Number(e.target.value) : null); resetResumen(); }}
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

          <div className="flex justify-center gap-3 mb-6">
            <button
              onClick={handleDescargarExcel}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors"
            >
              <Icon icon="solar:file-check-bold-duotone" className="text-lg" />
              Descargar Excel
            </button>
            <button
              onClick={handlePrevisualizar}
              disabled={cargandoResumen}
              className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <Icon
                icon={cargandoResumen ? 'solar:refresh-circle-bold-duotone' : 'solar:calculator-minimalistic-bold-duotone'}
                className={`text-lg ${cargandoResumen ? 'animate-spin' : ''}`}
              />
              Ver totales
            </button>
          </div>

          {/* Resumen del período — para cuadrar antes de exportar */}
          {resumen && (
            <div className="border-t border-gray-100 pt-6 mb-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 text-center">
                Totales del período {resumen.periodo}
              </p>

              {resumen.cantidad === 0 ? (
                <p className="text-sm text-gray-400 text-center py-3">
                  No hay comprobantes válidos en este período.
                </p>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {[
                      { label: 'Comprobantes', valor: String(resumen.cantidad) },
                      { label: 'Base gravada', valor: fmtMoneda(resumen.gravadas) },
                      { label: 'IGV', valor: fmtMoneda(resumen.igv) },
                      { label: 'Exoneradas', valor: fmtMoneda(resumen.exoneradas) },
                      { label: 'Inafectas', valor: fmtMoneda(resumen.inafectas) },
                      { label: 'Exportación', valor: fmtMoneda(resumen.exportacion) },
                    ].map((f) => (
                      <div key={f.label} className="bg-gray-50 rounded-xl px-3 py-2">
                        <p className="text-[11px] text-gray-400">{f.label}</p>
                        <p className="text-sm font-semibold text-gray-800">{f.valor}</p>
                      </div>
                    ))}
                  </div>

                  <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 mb-3 flex justify-between items-center">
                    <span className="text-xs font-semibold text-blue-700">Importe total</span>
                    <span className="text-base font-bold text-blue-700">{fmtMoneda(resumen.total)}</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {Object.entries(resumen.porTipoDoc).map(([tipo, d]) => (
                      <span key={tipo} className="text-[11px] bg-gray-100 text-gray-600 rounded-lg px-2 py-1">
                        {TIPO_DOC_LABEL[tipo] ?? tipo}: {d.cantidad} · {fmtMoneda(d.total)}
                      </span>
                    ))}
                  </div>

                  {(resumen.notasCredito > 0 || resumen.anulados > 0) && (
                    <p className="text-[11px] text-gray-400 text-center mt-3">
                      {resumen.notasCredito > 0 && `${resumen.notasCredito} nota(s) de crédito restan del total. `}
                      {resumen.anulados > 0 && `${resumen.anulados} comprobante(s) van con estado 6 (anulado).`}
                    </p>
                  )}
                </>
              )}
            </div>
          )}

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
              <p className="font-semibold mb-1">Sobre el RVIE</p>
              <ul className="space-y-0.5 text-xs text-blue-600">
                <li>• El TXT sigue el formato SUNAT para importación en el sistema SIRE.</li>
                <li>• Incluye Facturas (01), Boletas (03), Notas de Crédito (07) y Débito (08).</li>
                <li>• <strong>Formato simple:</strong> incluye los campos básicos del registro.</li>
                <li>• <strong>Reporte empresarial:</strong> consolida todas las sedes.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
