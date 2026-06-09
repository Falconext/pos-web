import { Icon } from '@iconify/react';
import { useCampanasViewModel } from './useCampanasViewModel';
import CampanaFormModal from './CampanaFormModal';
import { Campana, MESES, formatCurrency, PlataformaAds } from './CampanasModel';

const PLATAFORMA_CONFIG = {
  META: { label: 'META', color: '#1877f2', bg: 'bg-[#1877f2]' },
  TIKTOK: { label: 'TIKTOK', color: '#ff0050', bg: 'bg-[#ff0050]' },
};

function KpiCard({ label, value, icon, colorClass }: { label: string; value: string; icon: string; colorClass: string }) {
  return (
    <div className="bg-white dark:bg-[#111827] rounded-2xl p-5 border border-gray-100/50 dark:border-slate-800 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass}`}>
          <Icon icon={icon} className="text-xl text-white" />
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}

function CampanaCard({ c, onEditar, onToggle }: { c: Campana; onEditar: () => void; onToggle: () => void }) {
  const plat = PLATAFORMA_CONFIG[c.plataforma];
  const activa = c.estado === 'ACTIVA';
  const moneda = c.moneda;

  return (
    <div className={`bg-white dark:bg-[#111827] rounded-2xl border border-gray-100/50 dark:border-slate-800 shadow-sm overflow-hidden transition-opacity ${!activa ? 'opacity-60' : ''}`}>
      {/* Header de la card */}
      <div className="flex items-center gap-3 p-4">
        <div className={`${plat.bg} text-white rounded-xl px-3 py-1.5 text-xs font-black flex-shrink-0`}>
          {plat.label}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{c.nombre}</p>
          {c.producto && (
            <p className="text-xs text-indigo-500 dark:text-indigo-400 truncate mt-0.5">{c.producto.descripcion}</p>
          )}
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0 ${activa ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400'}`}>
          {activa ? 'ACTIVA' : 'PAUSADA'}
        </span>
        <div className="flex gap-1.5 flex-shrink-0">
          <button onClick={onToggle} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${activa ? 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
            {activa ? 'Pausar' : 'Activar'}
          </button>
          <button onClick={onEditar} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
            <Icon icon="solar:pen-bold-duotone" className="text-gray-400 text-base" />
          </button>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-4 gap-px bg-gray-100 dark:bg-slate-800 border-t border-gray-100 dark:border-slate-800">
        {[
          { label: 'Presup./día', value: formatCurrency(c.presupuestoDiario, moneda) },
          { label: 'Días del mes', value: String(c.diasProyectados ?? c.diasActivos) },
          { label: 'Invertido', value: formatCurrency(c.gastoEstimado, moneda), sub: `${c.diasActivos} días` },
          { label: 'Ventas', value: String(c.ventasAtribuidas), sub: 'unidades' },
        ].map((m, i) => (
          <div key={i} className="bg-white dark:bg-[#111827] px-3 py-3 text-center">
            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wide">{m.label}</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">{m.value}</p>
            {m.sub && <p className="text-[9px] text-gray-400 dark:text-gray-500">{m.sub}</p>}
          </div>
        ))}
      </div>

      {/* Ganancia real por unidad vendida */}
      {c.pnlUnidad && (
        <div className="px-4 py-3 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-100 dark:border-slate-800">
          <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wide mb-1.5">
            ¿Cuánto gano por cada unidad vendida?
          </p>
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <span className="text-gray-600 dark:text-gray-300">{formatCurrency(c.pnlUnidad.precio, moneda)}</span>
            <span className="text-gray-400 text-[10px]">precio neto (sin IGV)</span>
            <span className="text-gray-400 mx-0.5">−</span>
            <span className="text-gray-600 dark:text-gray-300">{formatCurrency(c.pnlUnidad.costoProducto, moneda)}</span>
            <span className="text-gray-400 text-[10px]">costo producto</span>
            {c.pnlUnidad.costoFijo > 0 && <>
              <span className="text-gray-400 mx-0.5">−</span>
              <span className="text-gray-600 dark:text-gray-300">{formatCurrency(c.pnlUnidad.costoFijo, moneda)}</span>
              <span className="text-gray-400 text-[10px]">costo fijo/envío</span>
            </>}
            {c.pnlUnidad.comisionVenta > 0 && <>
              <span className="text-gray-400 mx-0.5">−</span>
              <span className="text-gray-600 dark:text-gray-300">{formatCurrency(c.pnlUnidad.comisionVenta, moneda)}</span>
              <span className="text-gray-400 text-[10px]">comisión vendedor</span>
            </>}
            {c.cpa > 0 && <>
              <span className="text-gray-400 mx-0.5">−</span>
              <span className="text-amber-600 dark:text-amber-400 font-semibold">{formatCurrency(c.cpa, moneda)}</span>
              <span className="text-gray-400 text-[10px]">publicidad por venta</span>
            </>}
            <span className="text-gray-400 mx-0.5">=</span>
            <span className={`font-bold text-sm ${c.pnlUnidad.gananciaReal >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
              {formatCurrency(c.pnlUnidad.gananciaReal, moneda)}
            </span>
            <span className={`text-[10px] font-semibold ${c.pnlUnidad.gananciaReal >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
              {c.pnlUnidad.gananciaReal >= 0 ? 'ganancia neta' : 'estás perdiendo dinero'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CampanasView() {
  const vm = useCampanasViewModel();
  const { mes, anio, data, isLoading, filtroPlataforma, setFiltroPlataforma, campanasFiltradas, navegarMes, abrirCrear, abrirEditar, toggleEstado } = vm;
  const now = new Date();
  const resumen = data?.resumen;

  return (
    <div className="min-h-screen bg-[#F8F9FB] dark:bg-[#0A0D14] px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium mb-1">
            <span>Marketing</span>
            <Icon icon="solar:alt-arrow-right-linear" />
            <span className="text-indigo-600 dark:text-indigo-400">Campañas</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Campañas de Publicidad</h1>
        </div>
        <button onClick={abrirCrear} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-colors shadow-sm">
          <Icon icon="solar:add-circle-bold-duotone" />
          Nueva Campaña
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Gasté en publicidad" value={resumen ? formatCurrency(resumen.gastoTotalEstimado) : '—'} icon="solar:wallet-bold-duotone" colorClass="bg-indigo-600" />
        <KpiCard label="Ventas logradas con ads" value={resumen ? `${resumen.ventasAtribuidas} ventas` : '—'} icon="solar:cart-large-4-bold-duotone" colorClass="bg-violet-600" />
        <KpiCard label="Cuánto me costó cada venta" value={resumen ? formatCurrency(resumen.cpaPromedio) : '—'} icon="solar:target-bold-duotone" colorClass="bg-amber-500" />
        <KpiCard label="Campañas activas" value={data ? `${data.campanas.filter(c => c.estado === 'ACTIVA').length} de ${data.campanas.length}` : '—'} icon="solar:play-circle-bold-duotone" colorClass="bg-emerald-600" />
      </div>

      {/* Filtros + navegación mes */}
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-2 bg-white dark:bg-[#111827] rounded-2xl p-1 border border-gray-100/50 dark:border-slate-800 shadow-sm">
          {(['TODAS', 'META', 'TIKTOK'] as const).map(p => (
            <button
              key={p}
              onClick={() => setFiltroPlataforma(p as PlataformaAds | 'TODAS')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${filtroPlataforma === p ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
            >
              {p === 'META' ? <span><span style={{color:'#1877f2'}}>●</span> META</span> : p === 'TIKTOK' ? <span><span style={{color:'#ff0050'}}>●</span> TIKTOK</span> : 'Todas'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 bg-white dark:bg-[#111827] rounded-2xl px-3 py-2 border border-gray-100/50 dark:border-slate-800 shadow-sm">
          <button onClick={() => navegarMes(-1)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
            <Icon icon="solar:alt-arrow-left-bold" className="text-gray-500 dark:text-gray-400" />
          </button>
          <span className="text-sm font-bold text-gray-900 dark:text-white min-w-[90px] text-center">{MESES[mes - 1]} {anio}</span>
          <button onClick={() => navegarMes(1)} disabled={mes === now.getMonth() + 1 && anio === now.getFullYear()} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-30">
            <Icon icon="solar:alt-arrow-right-bold" className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Lista campañas */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Icon icon="mdi:loading" className="animate-spin text-3xl text-indigo-500" />
        </div>
      ) : campanasFiltradas.length === 0 ? (
        <div className="bg-white dark:bg-[#111827] rounded-3xl p-16 border border-gray-100/50 dark:border-slate-800 text-center">
          <Icon icon="solar:target-bold-duotone" className="text-5xl text-gray-200 dark:text-slate-700 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-400 dark:text-gray-500">Sin campañas todavía</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Crea tu primera campaña para saber cuánto te cuesta cada venta y cuánto ganas realmente</p>
          <button onClick={abrirCrear} className="mt-4 px-5 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors">
            + Nueva Campaña
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {campanasFiltradas.map(c => (
            <CampanaCard key={c.id} c={c} onEditar={() => abrirEditar(c)} onToggle={() => toggleEstado(c)} />
          ))}
        </div>
      )}

      <CampanaFormModal vm={vm} />
    </div>
  );
}
