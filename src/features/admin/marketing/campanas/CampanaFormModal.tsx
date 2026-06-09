import { Icon } from '@iconify/react';
import { useCampanasViewModel } from './useCampanasViewModel';
import { PlataformaAds, MESES } from './CampanasModel';

type VM = ReturnType<typeof useCampanasViewModel>;

const PLATAFORMAS: { key: PlataformaAds; label: string; color: string }[] = [
  { key: 'META', label: 'META', color: '#1877f2' },
  { key: 'TIKTOK', label: 'TIKTOK', color: '#ff0050' },
];

export default function CampanaFormModal({ vm }: { vm: VM }) {
  const { isModalOpen, setIsModalOpen, editando, form, setForm, isSaving, guardar, products, diasEstimadosMes } = vm;
  if (!isModalOpen) return null;

  const dias = diasEstimadosMes();
  const gastoEstimado = Number(form.presupuestoDiario || 0) * dias;
  const sym = form.moneda === 'USD' ? '$' : 'S/';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4" onClick={() => setIsModalOpen(false)}>
      <div className="bg-white dark:bg-[#111827] rounded-3xl w-full max-w-lg shadow-2xl border border-gray-100/50 dark:border-slate-800" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
              <Icon icon="solar:target-bold-duotone" className="text-indigo-600 dark:text-indigo-400 text-lg" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white text-base">
              {editando ? 'Editar Campaña' : 'Nueva Campaña'}
            </h3>
          </div>
          <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
            <Icon icon="solar:close-circle-bold-duotone" className="text-gray-400 text-xl" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Nombre */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Nombre de la campaña</label>
            <input
              type="text"
              value={form.nombre}
              onChange={e => setForm({ ...form, nombre: e.target.value })}
              placeholder="Ej: Blusa Negra — Invierno 2026"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Plataforma */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Plataforma</label>
            <div className="flex gap-3">
              {PLATAFORMAS.map(p => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setForm({ ...form, plataforma: p.key })}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${form.plataforma === p.key ? 'text-white shadow-md' : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400'}`}
                  style={form.plataforma === p.key ? { backgroundColor: p.color } : {}}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Producto */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Producto estrella <span className="text-gray-400 font-normal normal-case">(opcional)</span></label>
            <select
              value={form.productoId ?? ''}
              onChange={e => setForm({ ...form, productoId: e.target.value ? Number(e.target.value) : null })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Sin producto vinculado</option>
              {products.map((p: any) => (
                <option key={p.id} value={p.id}>{p.descripcion}</option>
              ))}
            </select>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Las ventas de este producto definen el CPA automáticamente</p>
          </div>

          {/* Presupuesto + Moneda */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Presupuesto diario</label>
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.presupuestoDiario || ''}
                onChange={e => setForm({ ...form, presupuestoDiario: Number(e.target.value) })}
                placeholder="50.00"
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 text-sm font-bold">
                {(['PEN', 'USD'] as const).map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setForm({ ...form, moneda: m })}
                    className={`px-4 py-2.5 transition-colors ${form.moneda === m ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
                  >
                    {m === 'PEN' ? 'S/' : '$'}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">El gasto real puede variar ±20% según la plataforma</p>
          </div>

          {/* Fecha inicio */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Fecha de inicio</label>
            <input
              type="date"
              value={form.fechaInicio}
              onChange={e => setForm({ ...form, fechaInicio: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Preview gasto estimado */}
          {gastoEstimado > 0 && (
            <div className="rounded-xl bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 px-4 py-3 flex items-center gap-2 text-sm">
              <Icon icon="solar:calculator-minimalistic-bold-duotone" className="text-indigo-500 text-lg flex-shrink-0" />
              <span className="text-gray-600 dark:text-gray-300">
                {sym} {form.presupuestoDiario}/día × {dias} días =
                <strong className="text-indigo-600 dark:text-indigo-400 ml-1">{sym} {gastoEstimado.toFixed(2)} est.</strong>
                <span className="text-gray-400 ml-1 text-xs">(±20%)</span>
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 pb-6 pt-2 gap-3">
          {editando && (
            <button
              onClick={() => { vm.eliminar(editando.id); setIsModalOpen(false); }}
              className="px-4 py-2.5 rounded-xl border border-red-200 dark:border-red-900/40 text-red-500 text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
            >
              Eliminar
            </button>
          )}
          <div className="flex gap-3 ml-auto">
            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 text-sm font-semibold hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">
              Cancelar
            </button>
            <button
              onClick={guardar}
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving && <Icon icon="mdi:loading" className="animate-spin" />}
              {editando ? 'Guardar' : 'Crear Campaña'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
