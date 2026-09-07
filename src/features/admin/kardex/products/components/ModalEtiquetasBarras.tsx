import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@iconify/react';
import { useReactToPrint } from 'react-to-print';
import apiClient from '@/utils/apiClient';
import useAlertStore from '@/zustand/alert';
import { useAuthStore } from '@/zustand/auth';
import CodigoBarrasEAN13 from '@/components/CodigoBarrasEAN13';
import { esEan13Valido } from '@/utils/ean13';

interface EtiquetaProducto {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  codigoBarras: string | null;
  valido: boolean;
  precio: number;
  variante: string | null;
  esVariante: boolean;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Productos a etiquetar. Se piden al backend al abrir. */
  productoIds: number[];
}

/** Formatos de papel soportados. Medidas en mm. */
const FORMATOS = {
  rollo: {
    label: 'Rollo térmico',
    detalle: '50 × 25 mm, una etiqueta por corte',
    ancho: 50,
    alto: 25,
    columnas: 1,
  },
  a4: {
    label: 'Hoja A4',
    detalle: '3 × 8 etiquetas de 65 × 35 mm',
    ancho: 65,
    alto: 35,
    columnas: 3,
  },
} as const;

type FormatoKey = keyof typeof FORMATOS;

export default function ModalEtiquetasBarras({ isOpen, onClose, productoIds }: Props) {
  const auth = useAuthStore((s) => s.auth);
  const [cargando, setCargando] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [productos, setProductos] = useState<EtiquetaProducto[]>([]);
  const [seleccionados, setSeleccionados] = useState<Set<number>>(new Set());
  const [cantidades, setCantidades] = useState<Record<number, number>>({});
  const [formato, setFormato] = useState<FormatoKey>('rollo');

  // El código escaneado ya trae nombre/variante/precio desde el sistema, así que
  // el texto va apagado por defecto: se enciende para el vendedor que mira la
  // caja sin escáner a la mano.
  const [mostrarNombre, setMostrarNombre] = useState(false);
  const [mostrarVariante, setMostrarVariante] = useState(false);
  const [mostrarPrecio, setMostrarPrecio] = useState(false);

  useEffect(() => {
    if (!isOpen || !productoIds.length) return;
    let cancelado = false;
    (async () => {
      setCargando(true);
      try {
        const resp = await apiClient.post('/productos/codigos-barras/etiquetas', { productoIds });
        const data: EtiquetaProducto[] = resp.data?.data ?? resp.data ?? [];
        if (cancelado) return;
        setProductos(data);
        setSeleccionados(new Set(data.filter((p) => p.valido).map((p) => p.id)));
        setCantidades(Object.fromEntries(data.map((p) => [p.id, 1])));
      } catch {
        if (!cancelado) useAlertStore.getState().alert('No se pudieron cargar los productos', 'error');
      } finally {
        if (!cancelado) setCargando(false);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [isOpen, productoIds]);

  const sinCodigo = useMemo(() => productos.filter((p) => !p.valido), [productos]);

  /** Asigna EAN-13 interno a los que aún no tienen y refresca la lista. */
  const generarFaltantes = async () => {
    if (!sinCodigo.length) return;
    setGenerando(true);
    try {
      await apiClient.post('/productos/codigos-barras/generar', {
        productoIds: sinCodigo.map((p) => p.id),
      });
      const resp = await apiClient.post('/productos/codigos-barras/etiquetas', { productoIds });
      const data: EtiquetaProducto[] = resp.data?.data ?? resp.data ?? [];
      setProductos(data);
      setSeleccionados(new Set(data.filter((p) => p.valido).map((p) => p.id)));
      useAlertStore.getState().alert(`Se generaron ${sinCodigo.length} códigos de barra`, 'success');
    } catch (e: any) {
      useAlertStore
        .getState()
        .alert(e?.response?.data?.message || 'No se pudieron generar los códigos', 'error');
    } finally {
      setGenerando(false);
    }
  };

  /** Una entrada por etiqueta física a imprimir (producto × cantidad). */
  const etiquetas = useMemo(() => {
    const out: EtiquetaProducto[] = [];
    for (const p of productos) {
      if (!seleccionados.has(p.id) || !p.valido) continue;
      const n = Math.max(1, Math.min(200, Number(cantidades[p.id]) || 1));
      for (let i = 0; i < n; i++) out.push(p);
    }
    return out;
  }, [productos, seleccionados, cantidades]);

  const cfg = FORMATOS[formato];
  const printRef = useRef<HTMLDivElement>(null);
  const imprimir = useReactToPrint({
    // @ts-ignore la versión instalada usa contentRef
    contentRef: printRef,
    documentTitle: `Etiquetas_${auth?.empresa?.razonSocial?.replace(/\s+/g, '_') || 'Productos'}`,
    pageStyle:
      formato === 'rollo'
        ? `@page { size: ${cfg.ancho}mm ${cfg.alto}mm; margin: 0; }
           @media print { html, body { margin: 0 !important; padding: 0 !important; } }`
        : `@page { size: A4; margin: 6mm; }
           @media print { html, body { margin: 0 !important; padding: 0 !important; } }`,
  });

  const toggle = (id: number) =>
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="flex h-[95vh] w-full max-w-[1200px] flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/30">
              <Icon icon="mdi:barcode" className="text-xl text-violet-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">Etiquetas de código de barras</h2>
              <p className="text-xs text-gray-500">
                {etiquetas.length} etiqueta{etiquetas.length === 1 ? '' : 's'} a imprimir ·{' '}
                {seleccionados.size} de {productos.length} productos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-slate-700"
          >
            <Icon icon="solar:close-circle-bold" className="text-2xl" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Configuración */}
          <div className="flex w-80 shrink-0 flex-col gap-5 overflow-y-auto border-r border-gray-100 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div>
              <p className="mb-2 text-[10px] font-black uppercase tracking-wide text-gray-500">Formato</p>
              <div className="flex flex-col gap-2">
                {(Object.keys(FORMATOS) as FormatoKey[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFormato(key)}
                    className={`rounded-xl border p-3 text-left transition ${
                      formato === key
                        ? 'border-violet-400 bg-violet-50 dark:bg-violet-900/20'
                        : 'border-gray-200 hover:border-violet-300 dark:border-slate-700'
                    }`}
                  >
                    <span className="block text-xs font-black text-gray-800 dark:text-white">
                      {FORMATOS[key].label}
                    </span>
                    <span className="block text-[11px] text-gray-500">{FORMATOS[key].detalle}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-1 text-[10px] font-black uppercase tracking-wide text-gray-500">
                Texto en la etiqueta
              </p>
              <p className="mb-2 text-[11px] leading-snug text-gray-400">
                Al escanear, el sistema ya trae nombre, variante y precio. Enciéndelos solo si el
                vendedor necesita leerlos sin escáner.
              </p>
              <div className="flex flex-col gap-1.5">
                {[
                  ['Nombre del producto', mostrarNombre, setMostrarNombre],
                  ['Variante (color / talla)', mostrarVariante, setMostrarVariante],
                  ['Precio', mostrarPrecio, setMostrarPrecio],
                ].map(([label, valor, set]: any) => (
                  <label key={label} className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={valor}
                      onChange={(e) => set(e.target.checked)}
                      className="h-4 w-4 accent-violet-600"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            {sinCodigo.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/50 dark:bg-amber-900/20">
                <p className="text-[11px] font-bold text-amber-800 dark:text-amber-300">
                  {sinCodigo.length} producto{sinCodigo.length === 1 ? '' : 's'} sin código de barras
                </p>
                <p className="mt-0.5 text-[11px] leading-snug text-amber-700 dark:text-amber-400">
                  Se les asignará un EAN-13 interno (prefijo 2), válido para cualquier escáner y sin
                  riesgo de chocar con un producto de fábrica.
                </p>
                <button
                  type="button"
                  onClick={generarFaltantes}
                  disabled={generando}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-amber-600 disabled:opacity-50"
                >
                  <Icon icon={generando ? 'svg-spinners:180-ring-with-bg' : 'mdi:barcode'} width={14} />
                  Generar los que faltan
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => imprimir?.()}
              disabled={!etiquetas.length}
              className="mt-auto inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-black text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Icon icon="solar:printer-bold" width={18} />
              Imprimir {etiquetas.length || ''}
            </button>
          </div>

          {/* Lista + vista previa */}
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="max-h-[38%] overflow-y-auto border-b border-gray-100 p-4 dark:border-slate-800">
              {cargando ? (
                <p className="text-xs text-gray-500">Cargando productos…</p>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="text-[10px] font-black uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="py-1.5 pr-2 w-8" />
                      <th className="py-1.5 pr-2">Producto</th>
                      <th className="py-1.5 pr-2">Código</th>
                      <th className="py-1.5 pr-2 w-24">Cantidad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productos.map((p) => (
                      <tr key={p.id} className="border-t border-gray-100 dark:border-slate-800">
                        <td className="py-1.5 pr-2">
                          <input
                            type="checkbox"
                            checked={seleccionados.has(p.id)}
                            disabled={!p.valido}
                            onChange={() => toggle(p.id)}
                            className="h-4 w-4 accent-violet-600 disabled:opacity-30"
                          />
                        </td>
                        <td className="py-1.5 pr-2 font-semibold text-gray-700 dark:text-gray-300">
                          {p.descripcion}
                          {p.variante && (
                            <span className="ml-1 text-[11px] font-bold text-violet-600 dark:text-violet-300">
                              {p.variante}
                            </span>
                          )}
                        </td>
                        <td className="py-1.5 pr-2 font-mono text-[11px] text-gray-500">
                          {p.valido ? p.codigoBarras : <span className="text-amber-600">sin código</span>}
                        </td>
                        <td className="py-1.5 pr-2">
                          <input
                            type="number"
                            min={1}
                            max={200}
                            value={cantidades[p.id] ?? 1}
                            disabled={!p.valido}
                            onChange={(e) =>
                              setCantidades((prev) => ({ ...prev, [p.id]: Number(e.target.value) }))
                            }
                            className="w-20 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-bold outline-none focus:border-violet-400 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="flex-1 overflow-auto bg-gray-100 p-5 dark:bg-slate-950">
              <div ref={printRef}>
                <div
                  className="mx-auto bg-white"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${cfg.columnas}, ${cfg.ancho}mm)`,
                    width: `${cfg.columnas * cfg.ancho}mm`,
                  }}
                >
                  {etiquetas.map((p, i) => (
                    <div
                      key={`${p.id}-${i}`}
                      style={{
                        width: `${cfg.ancho}mm`,
                        height: `${cfg.alto}mm`,
                        // Cada etiqueta del rollo es su propia página física.
                        breakInside: 'avoid',
                        pageBreakInside: 'avoid',
                        ...(formato === 'rollo' && i > 0 ? { pageBreakBefore: 'always' } : {}),
                      }}
                      className="flex flex-col items-center justify-center overflow-hidden bg-white px-1 text-center text-black"
                    >
                      {mostrarNombre && (
                        <span className="w-full truncate text-[6.5pt] font-bold leading-tight">
                          {p.descripcion}
                        </span>
                      )}
                      {mostrarVariante && p.variante && (
                        <span className="w-full truncate text-[6pt] leading-tight">{p.variante}</span>
                      )}
                      {p.codigoBarras && esEan13Valido(p.codigoBarras) && (
                        <CodigoBarrasEAN13
                          codigo={p.codigoBarras}
                          moduloPx={formato === 'rollo' ? 1.3 : 1.5}
                          altoBarras={formato === 'rollo' ? 34 : 42}
                          altoTexto={9}
                          margenModulos={6}
                        />
                      )}
                      {mostrarPrecio && (
                        <span className="text-[8pt] font-black leading-tight">
                          S/ {p.precio.toFixed(2)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                {!etiquetas.length && (
                  <p className="py-10 text-center text-xs text-gray-400">
                    Selecciona al menos un producto con código de barras.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
