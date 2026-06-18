import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { get, post } from '@/utils/fetch';
import useAlertStore from '@/zustand/alert';
import { ALL_PLANTILLAS, type PlantillaId } from '@/components/tienda/resolveTemplate';
import StorePreview from '@/components/tienda/StorePreview';
import { getRubroDemo } from '@/data/rubroDemo';

interface Rubro {
  id: number;
  nombre: string;
  _count?: { empresas: number };
}

interface DisenoRubro {
  rubroId: number;
  plantillaId: string;
  colorPrimario: string;
  colorSecundario: string;
  colorAccento: string;
  tipografia: string;
  vistaProductos: string;
}

const TIPOGRAFIAS = ['Inter', 'Poppins', 'Lato', 'Roboto', 'Playfair Display', 'Montserrat'];

const ColorPicker = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700">
    <label className="relative cursor-pointer flex-shrink-0">
      <input type="color" value={value} onChange={e => onChange(e.target.value)} className="sr-only" />
      <div className="w-9 h-9 rounded-lg shadow-inner border-2 border-white ring-1 ring-gray-200" style={{ background: value }} />
    </label>
    <div className="min-w-0">
      <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">{label}</p>
      <p className="text-xs font-mono text-gray-400">{value}</p>
    </div>
  </div>
);

export default function DisenoRubroPage() {
  const { alert, load } = useAlertStore();
  const [rubros, setRubros] = useState<Rubro[]>([]);
  const [disenos, setDisenos] = useState<Record<number, DisenoRubro>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [form, setForm] = useState<Partial<DisenoRubro>>({});

  const cargar = async () => {
    setLoading(true);
    try {
      const [rubrosRes, disenosRes] = await Promise.all([
        get<any>('/rubro'),
        get<DisenoRubro[]>('/diseno-rubro'),
      ]);
      const lista: Rubro[] = Array.isArray(rubrosRes.data) ? rubrosRes.data : Array.isArray(rubrosRes) ? rubrosRes : [];
      const disenosList: DisenoRubro[] = Array.isArray(disenosRes) ? disenosRes : (disenosRes as any)?.data ?? [];
      setRubros(lista);
      const map: Record<number, DisenoRubro> = {};
      disenosList.forEach(d => { map[d.rubroId] = d; });
      setDisenos(map);
    } catch {
      alert('No se pudieron cargar los rubros', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void cargar(); }, []);

  const abrirRubro = (rubro: Rubro) => {
    setSelected(rubro.id);
    const d = disenos[rubro.id];
    const demo = getRubroDemo(rubro.nombre);
    setForm({
      plantillaId: d?.plantillaId ?? demo.plantillaDefault,
      colorPrimario: d?.colorPrimario ?? demo.colorDefault,
      colorSecundario: d?.colorSecundario ?? '#ffffff',
      colorAccento: d?.colorAccento ?? '#FF6B6B',
      tipografia: d?.tipografia ?? 'Inter',
      vistaProductos: d?.vistaProductos ?? 'cards',
    });
  };

  const abrirPreviewCompleto = () => {
    if (!rubroSeleccionado) return;
    const previewConfig = {
      plantillaId: form.plantillaId,
      colorPrimario: form.colorPrimario,
      colorSecundario: form.colorSecundario,
      colorAccento: form.colorAccento,
      tipografia: form.tipografia,
      rubroNombre: rubroSeleccionado.nombre,
    };
    sessionStorage.setItem('store-preview-config', JSON.stringify(previewConfig));
    const params = new URLSearchParams(
      Object.entries(previewConfig).reduce<Record<string, string>>((acc, [key, value]) => {
        if (value) acc[key] = String(value);
        return acc;
      }, {}),
    );
    window.open(`/diseno-preview?${params.toString()}`, '_blank');
  };

  const guardar = async () => {
    if (!selected) return;
    setSaving(selected);
    load(true);
    try {
      const res = await post<DisenoRubro>(`/diseno-rubro/${selected}`, form);
      const saved = (res as any)?.data ?? res;
      setDisenos(prev => ({ ...prev, [selected]: saved as DisenoRubro }));
      alert('Diseño guardado correctamente', 'success');
    } catch {
      alert('No se pudo guardar el diseño', 'error');
    } finally {
      setSaving(null);
      load(false);
    }
  };

  const rubroSeleccionado = rubros.find(r => r.id === selected);
  const plantillaActual = (form.plantillaId ?? 'moderna') as PlantillaId;

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Icon icon="svg-spinners:ring-resize" className="text-primary text-3xl" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* ── Rubros sidebar ── */}
      <div className="w-64 border-r border-gray-100 dark:border-slate-800 bg-white dark:bg-[#111827] overflow-y-auto flex-shrink-0">
        <div className="p-4 border-b border-gray-100 dark:border-slate-800">
          <h1 className="text-sm font-bold text-gray-800 dark:text-white">Diseño por Rubro</h1>
          <p className="text-xs text-gray-400 mt-0.5">{rubros.length} rubros disponibles</p>
        </div>
        <div className="p-2 space-y-1">
          {rubros.map(rubro => {
            const d = disenos[rubro.id];
            const plantilla = ALL_PLANTILLAS.find(p => p.id === (d?.plantillaId ?? 'moderna'));
            const isActive = selected === rubro.id;
            return (
              <button
                key={rubro.id}
                onClick={() => abrirRubro(rubro)}
                className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center gap-3 ${isActive ? 'bg-primary/10 border border-primary/20' : 'hover:bg-gray-50 dark:hover:bg-slate-800 border border-transparent'}`}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: (d?.colorPrimario ?? '#6A6CFF') + '20' }}
                >
                  <Icon icon={plantilla?.icon ?? 'solar:shop-2-bold'} className="text-sm" style={{ color: d?.colorPrimario ?? '#6A6CFF' }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold capitalize truncate ${isActive ? 'text-primary' : 'text-gray-700 dark:text-gray-200'}`}>{rubro.nombre}</p>
                  <p className="text-xs text-gray-400">{rubro._count?.empresas ?? 0} negocios</p>
                </div>
                {d && <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main area ── */}
      {!selected ? (
        <div className="flex-1 flex items-center justify-center text-center p-8 bg-gray-50 dark:bg-slate-900">
          <div>
            <Icon icon="solar:palette-bold" className="text-gray-200 dark:text-slate-700 text-6xl mb-4 mx-auto" />
            <p className="font-semibold text-gray-500 dark:text-gray-400">Selecciona un rubro para diseñar su tienda</p>
            <p className="text-sm text-gray-300 dark:text-gray-600 mt-1">Los cambios aplican a todas las tiendas de ese rubro</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">

          {/* ── Config panel ── */}
          <div className="w-80 flex-shrink-0 border-r border-gray-100 dark:border-slate-800 bg-white dark:bg-[#111827] overflow-y-auto flex flex-col">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="font-bold text-gray-900 dark:text-white capitalize text-sm">{rubroSeleccionado?.nombre}</h2>
                <p className="text-xs text-gray-400">{rubroSeleccionado?._count?.empresas ?? 0} negocios</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                <Icon icon="solar:close-circle-linear" className="text-lg" />
              </button>
            </div>

            {/* Config content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">

              {/* Plantilla */}
              <div>
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Plantilla de tienda</p>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_PLANTILLAS.map(plantilla => {
                    const isOn = plantillaActual === plantilla.id;
                    return (
                      <button
                        key={plantilla.id}
                        onClick={() => setForm(f => ({ ...f, plantillaId: plantilla.id }))}
                        className={`relative text-left p-3 rounded-xl border-2 transition-all ${isOn ? 'border-primary bg-primary/5 shadow-sm' : 'border-gray-100 dark:border-slate-700 hover:border-gray-200 dark:hover:border-slate-600 bg-white dark:bg-slate-800'}`}
                      >
                        {isOn && (
                          <span className="absolute top-2 right-2">
                            <Icon icon="solar:check-circle-bold" className="text-primary text-sm" />
                          </span>
                        )}
                        <div className="w-full h-7 rounded-lg mb-2 flex items-center justify-center" style={{ backgroundColor: plantilla.accentColor + '18' }}>
                          <Icon icon={plantilla.icon} className="text-base" style={{ color: plantilla.accentColor }} />
                        </div>
                        <p className="text-xs font-bold text-gray-800 dark:text-gray-100">{plantilla.label}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-2">{plantilla.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Colores */}
              <div>
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Colores</p>
                <div className="space-y-2">
                  <ColorPicker label="Color Principal" value={form.colorPrimario ?? '#6A6CFF'} onChange={v => setForm(f => ({ ...f, colorPrimario: v }))} />
                  <ColorPicker label="Color de Fondo" value={form.colorSecundario ?? '#ffffff'} onChange={v => setForm(f => ({ ...f, colorSecundario: v }))} />
                  <ColorPicker label="Color de Acento / CTA" value={form.colorAccento ?? '#FF6B6B'} onChange={v => setForm(f => ({ ...f, colorAccento: v }))} />
                </div>
              </div>

              {/* Tipografía */}
              <div>
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Tipografía</p>
                <div className="grid grid-cols-1 gap-1.5">
                  {TIPOGRAFIAS.map(t => (
                    <button
                      key={t}
                      onClick={() => setForm(f => ({ ...f, tipografia: t }))}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition-all ${form.tipografia === t ? 'border-primary bg-primary/5 text-primary font-semibold' : 'border-gray-100 dark:border-slate-700 text-gray-600 dark:text-gray-400 hover:border-gray-200 dark:hover:border-slate-600'}`}
                      style={{ fontFamily: t }}
                    >
                      <span>{t}</span>
                      {form.tipografia === t && <Icon icon="solar:check-circle-bold" className="text-primary text-sm" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-gray-100 dark:border-slate-800 flex-shrink-0 space-y-2">
              <button
                onClick={abrirPreviewCompleto}
                className="w-full py-2.5 rounded-xl text-sm font-semibold border transition-all flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-slate-800"
                style={{ borderColor: form.colorPrimario ?? '#6A6CFF', color: form.colorPrimario ?? '#6A6CFF' }}
              >
                <Icon icon="solar:maximize-square-bold" className="text-sm" />
                Ver en pantalla completa
              </button>
              <button
                onClick={guardar}
                disabled={saving === selected}
                className="w-full py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60 transition-all flex items-center justify-center gap-2"
                style={{ backgroundColor: form.colorPrimario ?? '#6A6CFF' }}
              >
                {saving === selected
                  ? <><Icon icon="svg-spinners:ring-resize" className="text-sm" /> Guardando...</>
                  : <><Icon icon="solar:check-bold" className="text-sm" /> Guardar diseño</>
                }
              </button>
            </div>
          </div>

          {/* ── Live preview ── */}
          <div className="flex-1 bg-gray-100 dark:bg-slate-900 overflow-hidden">
            <StorePreview
              plantillaId={form.plantillaId}
              colorPrimario={form.colorPrimario}
              colorSecundario={form.colorSecundario}
              colorAccento={form.colorAccento}
              tipografia={form.tipografia}
              rubroNombre={rubroSeleccionado?.nombre}
            />
          </div>

        </div>
      )}
    </div>
  );
}
