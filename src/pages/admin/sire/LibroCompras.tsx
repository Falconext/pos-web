import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import apiClient from '@/utils/apiClient';
import { get, post } from '@/utils/fetch';
import useAlertStore from '@/zustand/alert';

// Totales del período tal como saldrán en el TXT/Excel (mismo origen de datos).
interface ResumenCompras {
  periodo: string;
  cantidad: number;
  base: number;
  /** Adquisiciones no gravadas (productos exonerados/inafectos), campo 21 del RCE. */
  noGravadas?: number;
  igv: number;
  total: number;
  porTipoDoc: Record<string, { cantidad: number; total: number }>;
}

/** Una compra del período tal como la revisa el contador (aprobar / denegar). */
interface CompraRevision {
  id: number;
  documento: string;
  fechaEmision: string;
  proveedor: string;
  proveedorDoc: string;
  base: number;
  igv: number;
  total: number;
  esGasto: boolean;
  estadoContador: 'PENDIENTE' | 'APROBADA' | 'DENEGADA';
  motivoContador: string | null;
}

interface RevisionCompras {
  items: CompraRevision[];
  resumen: {
    total: number;
    pendientes: number;
    aprobadas: number;
    denegadas: number;
    igvDeclarable: number;
    igvDenegado: number;
  };
}

/** Resultado del cruce con la propuesta del RCE que publica SUNAT. */
interface CruceCompras {
  cuadra: boolean;
  igvNoAprovechado: number;
  igvDenegado: number;
  totales: { sunat: { cantidad: number; igv: number; total: number }; sistema: { cantidad: number; igv: number; total: number } };
  soloEnSunat: Array<{ comprobante: string; proveedor: string; proveedorDoc: string; fechaEmision: string; base: number; igv: number; total: number }>;
  soloEnSistema: Array<{ comprobante: string; proveedor: string; total: number }>;
  diferencias: Array<{ comprobante: string; sunat: { base: number; igv: number; total: number }; sistema: { base: number; igv: number; total: number } }>;
  denegadas: Array<{ comprobante: string; proveedor: string; motivo: string | null; igv: number }>;
  totalSoloEnSunat: number;
  totalSoloEnSistema: number;
  totalDiferencias: number;
  totalDenegadas: number;
}

const ESTADO_STYLE: Record<string, { label: string; cls: string; icon: string }> = {
  PENDIENTE: { label: 'Por revisar', cls: 'bg-slate-100 text-slate-600 border-slate-200', icon: 'solar:clock-circle-bold-duotone' },
  APROBADA: { label: 'Aprobada', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: 'solar:check-circle-bold' },
  DENEGADA: { label: 'Denegada', cls: 'bg-rose-50 text-rose-700 border-rose-200', icon: 'solar:close-circle-bold' },
};

const TIPO_DOC_LABEL: Record<string, string> = {
  '01': 'Facturas',
  '02': 'Recibos por honorarios',
  '03': 'Boletas',
  '04': 'Liquidaciones',
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

export default function LibroCompras() {
  const { alert, load } = useAlertStore();
  const [mes, setMes] = useState<number | null>(null);
  const [anio, setAnio] = useState<number | null>(null);
  const [enviandoCorreo, setEnviandoCorreo] = useState(false);
  const [destinatario, setDestinatario] = useState('');
  const [mostrarCorreo, setMostrarCorreo] = useState(false);
  const [resumen, setResumen] = useState<ResumenCompras | null>(null);
  const [cargandoResumen, setCargandoResumen] = useState(false);
  // Revisión del contador: aprobar o denegar cada compra antes de declarar.
  const [revision, setRevision] = useState<RevisionCompras | null>(null);
  const [cargandoRevision, setCargandoRevision] = useState(false);
  const [seleccion, setSeleccion] = useState<number[]>([]);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [pidiendoMotivo, setPidiendoMotivo] = useState(false);
  // Cruce con la propuesta del RCE de SUNAT.
  const [cruce, setCruce] = useState<CruceCompras | null>(null);
  const [cruzando, setCruzando] = useState(false);
  // Sincronización directa con la API del SIRE (alternativa a subir el archivo).
  const [sireConfigurado, setSireConfigurado] = useState<boolean | null>(null);
  const [sincronizando, setSincronizando] = useState(false);

  // El resumen corresponde a un período concreto: si cambia, se descarta para
  // no mostrar totales que ya no corresponden a lo que se descargaría.
  const resetResumen = () => {
    setResumen(null);
    setRevision(null);
    setCruce(null);
    setSeleccion([]);
  };

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
    }).toString();
  };

  const handlePrevisualizar = async () => {
    if (!validar()) return;
    try {
      setCargandoResumen(true);
      const resp = await get<ResumenCompras>(
        `contabilidad/sire/compras-resumen?mes=${mes}&anio=${anio}`,
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

  const cargarRevision = async (silencioso = false) => {
    if (!validar()) return;
    try {
      setCargandoRevision(true);
      const resp = await get<RevisionCompras>(
        `contabilidad/sire/compras-revision?mes=${mes}&anio=${anio}`,
      );
      if (resp.error || !resp.data) {
        if (!silencioso) alert(resp.error ?? 'No se pudo cargar la revisión', 'error');
        return;
      }
      setRevision(resp.data);
      setSeleccion([]);
    } finally {
      setCargandoRevision(false);
    }
  };

  const revisar = async (estado: 'APROBADA' | 'DENEGADA' | 'PENDIENTE', motivo?: string) => {
    if (!seleccion.length) {
      alert('Marca al menos una compra', 'warning');
      return;
    }
    try {
      load(true);
      const resp = await post<{ actualizadas: number }>('contabilidad/sire/compras-revisar', {
        ids: seleccion,
        estado,
        motivo,
      });
      if (resp.error) {
        alert(resp.error, 'error');
        return;
      }
      const etiqueta = estado === 'APROBADA' ? 'aprobada' : estado === 'DENEGADA' ? 'denegada' : 'devuelta a pendiente';
      alert(`${seleccion.length} compra(s) ${etiqueta}(s)`, 'success');
      setMotivoRechazo('');
      setPidiendoMotivo(false);
      await cargarRevision(true);
      // Los totales del RCE cambian si se deniega algo: se recalculan.
      if (resumen) await handlePrevisualizar();
      if (cruce) setCruce(null);
    } finally {
      load(false);
    }
  };

  // Se consulta una vez: define si se ofrece el botón de traer de SUNAT.
  useEffect(() => {
    let vivo = true;
    void get<{ configurado: boolean }>('contabilidad/sire/estado-conexion').then((r) => {
      if (vivo) setSireConfigurado(Boolean(r.data?.configurado));
    });
    return () => { vivo = false; };
  }, []);

  const handleTraerDeSunat = async () => {
    if (!validar()) return;
    try {
      setSincronizando(true);
      const resp = await post<CruceCompras & { pendiente?: boolean; mensaje?: string }>(
        'contabilidad/sire/compras-sincronizar',
        { mes, anio },
      );
      if (resp.error || !resp.data) {
        alert(resp.error ?? 'No se pudo traer la información del SIRE', 'error');
        return;
      }
      if ((resp.data as any).pendiente) {
        alert((resp.data as any).mensaje ?? 'SUNAT está preparando el archivo, vuelve a intentar en unos minutos.', 'info');
        return;
      }
      setCruce(resp.data);
      alert('Compras traídas del SIRE de SUNAT', 'success');
    } catch {
      alert('No se pudo traer la información del SIRE', 'error');
    } finally {
      setSincronizando(false);
    }
  };

  const handleCruzarConSunat = async (file: File) => {
    if (!validar()) return;
    try {
      setCruzando(true);
      const contenido = await file.text();
      const resp = await post<CruceCompras>('contabilidad/sire/compras-comparar', {
        mes,
        anio,
        contenido,
      });
      if (resp.error || !resp.data) {
        alert(resp.error ?? 'No se pudo leer el archivo de SUNAT', 'error');
        return;
      }
      setCruce(resp.data);
    } catch {
      alert('No se pudo leer el archivo', 'error');
    } finally {
      setCruzando(false);
    }
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
      link.setAttribute(
        'download',
        nombreDesdeRespuesta(resp.headers, `SIRE_RCE_${periodo}.txt`),
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
                  No hay compras registradas en este período.
                </p>
              ) : (
                <>
                  <div className={`grid ${Number(resumen.noGravadas) > 0 ? 'grid-cols-2' : 'grid-cols-3'} gap-2 mb-3`}>
                    {[
                      { label: 'Compras', valor: String(resumen.cantidad) },
                      { label: 'Base gravada', valor: fmtMoneda(resumen.base) },
                      { label: 'IGV', valor: fmtMoneda(resumen.igv) },
                      // Solo aparece cuando hay compras de exonerados/inafectos.
                      ...(Number(resumen.noGravadas) > 0
                        ? [{ label: 'No gravadas', valor: fmtMoneda(Number(resumen.noGravadas)) }]
                        : []),
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

                  <p className="text-[11px] text-gray-400 text-center mt-3">
                    Solo incluye compras en estado REGISTRADO (excluye anuladas, rechazadas y pendientes de aprobación).
                  </p>
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

        {/* ── Revisión del contador: aprobar / denegar antes de declarar ── */}
        <div className="mt-4 bg-white border border-gray-200 rounded-xl p-4" data-testid="revision-contador">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <p className="font-semibold text-gray-900 flex items-center gap-2">
                <Icon icon="solar:clipboard-check-bold-duotone" className="text-blue-500 text-xl" />
                Revisión del contador
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Aprueba o deniega cada compra. Las denegadas no entran al TXT del RCE y el negocio ve el motivo.
              </p>
            </div>
            <button
              onClick={() => cargarRevision()}
              disabled={cargandoRevision}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <Icon icon={cargandoRevision ? 'solar:refresh-circle-bold-duotone' : 'solar:eye-bold-duotone'} className={`text-lg ${cargandoRevision ? 'animate-spin' : ''}`} />
              {revision ? 'Actualizar' : 'Ver compras del período'}
            </button>
          </div>

          {revision && (
            <>
              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { k: 'Por revisar', v: revision.resumen.pendientes, cls: 'text-slate-700' },
                  { k: 'Aprobadas', v: revision.resumen.aprobadas, cls: 'text-emerald-600' },
                  { k: 'Denegadas', v: revision.resumen.denegadas, cls: 'text-rose-600' },
                  { k: 'IGV a declarar', v: fmtMoneda(revision.resumen.igvDeclarable), cls: 'text-blue-600' },
                ].map((c) => (
                  <div key={c.k} className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
                    <p className="text-[11px] uppercase tracking-wide text-gray-400 font-bold">{c.k}</p>
                    <p className={`text-sm font-black ${c.cls}`}>{c.v}</p>
                  </div>
                ))}
              </div>

              {revision.resumen.igvDenegado > 0 && (
                <p className="mt-2 text-xs text-rose-600">
                  Se excluye {fmtMoneda(revision.resumen.igvDenegado)} de crédito fiscal por las compras denegadas.
                </p>
              )}

              {/* Acciones en lote */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-xs text-gray-500">{seleccion.length} seleccionada(s)</span>
                <button
                  onClick={() => revisar('APROBADA')}
                  disabled={!seleccion.length}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-40"
                >
                  Aprobar
                </button>
                <button
                  onClick={() => setPidiendoMotivo(true)}
                  disabled={!seleccion.length}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 disabled:opacity-40"
                  data-testid="btn-denegar"
                >
                  Denegar
                </button>
                <button
                  onClick={() => revisar('PENDIENTE')}
                  disabled={!seleccion.length}
                  className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 text-xs font-bold hover:bg-gray-50 disabled:opacity-40"
                >
                  Marcar por revisar
                </button>
              </div>

              {pidiendoMotivo && (
                <div className="mt-2 rounded-xl border border-rose-200 bg-rose-50 p-3" data-testid="motivo-rechazo">
                  <label className="text-xs font-bold text-rose-700">Motivo del rechazo (lo verá el negocio)</label>
                  <div className="mt-1 flex gap-2">
                    <input
                      autoFocus
                      value={motivoRechazo}
                      onChange={(e) => setMotivoRechazo(e.target.value)}
                      placeholder="Ej: no corresponde al giro del negocio"
                      className="flex-1 h-9 px-3 text-sm rounded-lg border border-rose-200 bg-white outline-none focus:ring-2 focus:ring-rose-300"
                    />
                    <button
                      onClick={() => revisar('DENEGADA', motivoRechazo)}
                      disabled={!motivoRechazo.trim()}
                      className="px-3 h-9 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 disabled:opacity-40"
                    >
                      Denegar
                    </button>
                    <button
                      onClick={() => { setPidiendoMotivo(false); setMotivoRechazo(''); }}
                      className="px-3 h-9 rounded-lg border border-rose-200 text-rose-700 text-xs font-bold"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-gray-400 uppercase tracking-wide">
                      <th className="py-2 w-8">
                        <input
                          type="checkbox"
                          checked={!!revision.items.length && seleccion.length === revision.items.length}
                          onChange={(e) => setSeleccion(e.target.checked ? revision.items.map((i) => i.id) : [])}
                        />
                      </th>
                      <th className="py-2">Documento</th>
                      <th className="py-2">Proveedor</th>
                      <th className="py-2 text-right">Base</th>
                      <th className="py-2 text-right">IGV</th>
                      <th className="py-2 text-right">Total</th>
                      <th className="py-2">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revision.items.map((it) => {
                      const st = ESTADO_STYLE[it.estadoContador];
                      return (
                        <tr key={it.id} className="border-t border-gray-100">
                          <td className="py-2">
                            <input
                              type="checkbox"
                              checked={seleccion.includes(it.id)}
                              onChange={(e) =>
                                setSeleccion((prev) => (e.target.checked ? [...prev, it.id] : prev.filter((x) => x !== it.id)))
                              }
                            />
                          </td>
                          <td className="py-2 font-mono font-semibold text-gray-800">{it.documento}</td>
                          <td className="py-2 text-gray-600">
                            {it.proveedor}
                            {it.motivoContador && (
                              <span className="block text-[11px] text-rose-600 italic">{it.motivoContador}</span>
                            )}
                          </td>
                          <td className="py-2 text-right tabular-nums">{fmtMoneda(it.base)}</td>
                          <td className="py-2 text-right tabular-nums">{fmtMoneda(it.igv)}</td>
                          <td className="py-2 text-right tabular-nums font-semibold">{fmtMoneda(it.total)}</td>
                          <td className="py-2">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-bold ${st.cls}`}>
                              <Icon icon={st.icon} className="text-xs" />
                              {st.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {!revision.items.length && (
                      <tr><td colSpan={7} className="py-4 text-center text-gray-400">Sin compras registradas en el período</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* ── Cruce con la propuesta del RCE de SUNAT ── */}
        <div className="mt-4 bg-white border border-gray-200 rounded-xl p-4" data-testid="cruce-sunat">
          <p className="font-semibold text-gray-900 flex items-center gap-2">
            <Icon icon="solar:compare-bold-duotone" className="text-blue-500 text-xl" />
            Comparar con la propuesta de SUNAT
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            Sube el archivo del RCE (Clave SOL → SIRE → Compras → Propuesta → Exportar). Detecta las facturas que SUNAT
            tiene a nombre del negocio y que nunca se registraron: ese IGV se está perdiendo.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {/* Si la empresa configuró las credenciales del SIRE, se puede traer
                la propuesta sin bajar y subir el archivo a mano. */}
            {sireConfigurado && (
              <button
                onClick={handleTraerDeSunat}
                disabled={sincronizando}
                data-testid="traer-de-sunat"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                <Icon icon={sincronizando ? 'solar:refresh-circle-bold-duotone' : 'solar:cloud-download-bold-duotone'} className={`text-lg ${sincronizando ? 'animate-spin' : ''}`} />
                {sincronizando ? 'Trayendo de SUNAT…' : 'Traer mis compras de SUNAT'}
              </button>
            )}
          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-blue-300 text-blue-700 text-sm font-medium cursor-pointer hover:bg-blue-50">
            <Icon icon={cruzando ? 'solar:refresh-circle-bold-duotone' : 'solar:upload-bold-duotone'} className={`text-lg ${cruzando ? 'animate-spin' : ''}`} />
            {cruzando ? 'Comparando…' : 'Subir propuesta de SUNAT'}
            <input
              type="file"
              accept=".txt,.csv"
              className="hidden"
              data-testid="input-propuesta"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleCruzarConSunat(f); e.currentTarget.value = ''; }}
            />
          </label>
          </div>
          {sireConfigurado === false && (
            <p className="mt-2 text-xs text-gray-400">
              Si configuras las credenciales del SIRE en Perfil → Configuración, el sistema puede traer estas compras solo, sin subir el archivo.
            </p>
          )}

          {cruce && (
            <div className="mt-3 space-y-3">
              <div className={`rounded-xl px-4 py-3 text-sm ${cruce.cuadra ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>
                {cruce.cuadra
                  ? 'Todo cuadra con la propuesta de SUNAT.'
                  : <>SUNAT tiene <b>{cruce.totales.sunat.cantidad}</b> comprobantes y el sistema <b>{cruce.totales.sistema.cantidad}</b>.</>}
                {cruce.igvNoAprovechado > 0 && (
                  <p className="mt-1 font-bold">
                    Crédito fiscal sin aprovechar: {fmtMoneda(cruce.igvNoAprovechado)}
                  </p>
                )}
              </div>

              {!!cruce.totalSoloEnSunat && (
                <div>
                  <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                    SUNAT las tiene y no están registradas ({cruce.totalSoloEnSunat})
                  </p>
                  <div className="rounded-xl border border-amber-200 divide-y divide-amber-100">
                    {cruce.soloEnSunat.map((i) => (
                      <div key={i.comprobante} className="flex items-center justify-between gap-3 px-3 py-2 text-xs">
                        <span className="font-mono font-semibold text-gray-800">{i.comprobante}</span>
                        <span className="flex-1 truncate text-gray-600">{i.proveedor}</span>
                        <span className="tabular-nums text-gray-500">IGV {fmtMoneda(i.igv)}</span>
                        <span className="tabular-nums font-semibold">{fmtMoneda(i.total)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!!cruce.totalDiferencias && (
                <div>
                  <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                    Con diferencias de importe ({cruce.totalDiferencias})
                  </p>
                  <div className="rounded-xl border border-gray-200 divide-y divide-gray-100">
                    {cruce.diferencias.map((d) => (
                      <div key={d.comprobante} className="flex items-center justify-between gap-3 px-3 py-2 text-xs">
                        <span className="font-mono font-semibold text-gray-800">{d.comprobante}</span>
                        <span className="text-gray-500">SUNAT {fmtMoneda(d.sunat.total)}</span>
                        <span className="text-gray-500">Sistema {fmtMoneda(d.sistema.total)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!!cruce.totalSoloEnSistema && (
                <div>
                  <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                    Registradas y SUNAT no las tiene ({cruce.totalSoloEnSistema})
                  </p>
                  <div className="rounded-xl border border-gray-200 divide-y divide-gray-100">
                    {cruce.soloEnSistema.map((i) => (
                      <div key={i.comprobante} className="flex items-center justify-between gap-3 px-3 py-2 text-xs">
                        <span className="font-mono font-semibold text-gray-800">{i.comprobante}</span>
                        <span className="flex-1 truncate text-gray-600">{i.proveedor}</span>
                        <span className="tabular-nums font-semibold">{fmtMoneda(i.total)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!!cruce.totalDenegadas && (
                <div>
                  <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                    Denegadas por el contador ({cruce.totalDenegadas}) · {fmtMoneda(cruce.igvDenegado)} de IGV excluido
                  </p>
                  <div className="rounded-xl border border-rose-200 divide-y divide-rose-100">
                    {cruce.denegadas.map((i) => (
                      <div key={i.comprobante} className="flex items-center justify-between gap-3 px-3 py-2 text-xs">
                        <span className="font-mono font-semibold text-gray-800">{i.comprobante}</span>
                        <span className="flex-1 truncate text-rose-600 italic">{i.motivo}</span>
                        <span className="tabular-nums text-gray-500">IGV {fmtMoneda(i.igv)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                <li>• Sigue la RS 000040-2022/SUNAT (37 campos). Validado con el Programa Validador SIRE.</li>
                <li>• El proveedor debe estar registrado con su RUC para el formato correcto.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
