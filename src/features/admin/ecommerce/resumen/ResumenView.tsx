import { Icon } from '@iconify/react';
import { useResumenViewModel } from './useResumenViewModel';
import { ProductoResumen, MESES, fmt } from './ResumenModel';

const ESTADO_CONFIG = {
  bien:    { icon: '✅', label: 'Ganando bien',    color: 'text-emerald-600 dark:text-emerald-400' },
  alerta:  { icon: '⚠️', label: 'Poco margen',     color: 'text-amber-600 dark:text-amber-400' },
  perdida: { icon: '❌', label: 'Perdiendo dinero', color: 'text-red-500' },
};

function FilaWaterfall({ label, valor, esTotal = false, esNegativo = false, icon }: {
  label: string; valor: number; esTotal?: boolean; esNegativo?: boolean; icon?: string;
}) {
  if (!esTotal && valor === 0) return null;
  return (
    <div className={`flex items-center justify-between py-2.5 ${esTotal ? 'border-t-2 border-gray-200 dark:border-slate-600 mt-1 pt-3' : ''}`}>
      <div className="flex items-center gap-2">
        {icon && <Icon icon={icon} className={`text-base ${esNegativo ? 'text-red-400' : esTotal ? (valor >= 0 ? 'text-emerald-500' : 'text-red-500') : 'text-gray-400'}`} />}
        <span className={`text-sm ${esTotal ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
          {esNegativo && !esTotal ? <span className="text-gray-400 mr-1">−</span> : null}
          {label}
        </span>
      </div>
      <span className={`text-sm font-bold tabular-nums ${
        esTotal
          ? valor >= 0 ? 'text-emerald-600 dark:text-emerald-400 text-base' : 'text-red-500 text-base'
          : esNegativo ? 'text-red-500' : 'text-gray-900 dark:text-white'
      }`}>
        {esNegativo && !esTotal ? `(${fmt(valor)})` : fmt(valor)}
      </span>
    </div>
  );
}

function FilaProducto({ p }: { p: ProductoResumen }) {
  const cfg = ESTADO_CONFIG[p.estado];
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-50 dark:border-slate-800 last:border-0">
      <span className="text-xl w-6 text-center flex-shrink-0">{cfg.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{p.descripcion}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {p.unidades} uds. vendidas
          {p.ads > 0 && <span className="ml-2 text-amber-500">· S/ {p.ads.toFixed(0)} en ads</span>}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-xs text-gray-400">Ingresé</p>
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{fmt(p.ingresos)}</p>
      </div>
      <div className="text-right flex-shrink-0 min-w-[90px]">
        <p className="text-xs text-gray-400">Me quedó</p>
        <p className={`text-sm font-bold ${cfg.color}`}>{fmt(p.ganancia)}</p>
      </div>
    </div>
  );
}

export default function ResumenView() {
  const { mes, anio, data, isLoading, navegarMes, esMesActual } = useResumenViewModel();
  const r = data?.resumen;

  return (
    <div className="min-h-screen bg-[#F8F9FB] dark:bg-[#0A0D14] px-4 py-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-3">
        <div>
          <p className="text-xs text-gray-400 font-medium mb-0.5">Mi Negocio</p>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            ¿Cómo me fue en {MESES[mes - 1]} {anio}?
          </h1>
        </div>
        <div className="flex items-center gap-1 bg-white dark:bg-[#111827] rounded-2xl px-3 py-2 border border-gray-100/50 dark:border-slate-800 shadow-sm">
          <button onClick={() => navegarMes(-1)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
            <Icon icon="solar:alt-arrow-left-bold" className="text-gray-500 dark:text-gray-400" />
          </button>
          <span className="text-sm font-bold text-gray-900 dark:text-white min-w-[80px] text-center">{MESES[mes - 1]} {anio}</span>
          <button onClick={() => navegarMes(1)} disabled={esMesActual} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-30">
            <Icon icon="solar:alt-arrow-right-bold" className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Icon icon="mdi:loading" className="animate-spin text-3xl text-indigo-500" />
        </div>
      ) : !r ? (
        <div className="bg-white dark:bg-[#111827] rounded-3xl p-16 text-center border border-gray-100/50 dark:border-slate-800">
          <Icon icon="solar:chart-square-bold-duotone" className="text-5xl text-gray-200 dark:text-slate-700 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-400">Sin datos para este mes</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Waterfall principal */}
          <div className="bg-white dark:bg-[#111827] rounded-2xl p-5 border border-gray-100/50 dark:border-slate-800 shadow-sm">
            <FilaWaterfall label="Vendí en total" valor={r.ingresos} icon="solar:wallet-bold-duotone" />
            <FilaWaterfall label="Costo de mis productos" valor={r.costoMercaderia} esNegativo icon="solar:box-bold-duotone" />
            <FilaWaterfall label="Envíos y empaque" valor={r.costoEnvios} esNegativo icon="solar:delivery-bold-duotone" />
            <FilaWaterfall label="Lo que gasté en publicidad" valor={r.gastoPublicidad} esNegativo icon="solar:target-bold-duotone" />
            <FilaWaterfall label="Comisiones a vendedores" valor={r.comisiones} esNegativo icon="solar:users-group-rounded-bold-duotone" />
            <FilaWaterfall
              label={r.gananciaReal >= 0 ? `Me quedó a mí (${r.margen}%)` : `Estoy perdiendo dinero (${r.margen}%)`}
              valor={r.gananciaReal}
              esTotal
              icon={r.gananciaReal >= 0 ? 'solar:emoji-funny-circle-bold-duotone' : 'solar:emoji-sad-circle-bold-duotone'}
            />
          </div>

          {/* KPIs rápidos */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Ventas realizadas', value: `${r.totalVentas}`, icon: 'solar:cart-large-4-bold-duotone', color: 'bg-indigo-600' },
              { label: 'Ticket promedio', value: fmt(r.ticketPromedio), icon: 'solar:tag-price-bold-duotone', color: 'bg-violet-600' },
              { label: 'Productos vendidos', value: `${r.productosDistintos}`, icon: 'solar:box-minimalistic-bold-duotone', color: 'bg-amber-500' },
            ].map((k, i) => (
              <div key={i} className="bg-white dark:bg-[#111827] rounded-2xl p-4 border border-gray-100/50 dark:border-slate-800 shadow-sm text-center">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-2 ${k.color}`}>
                  <Icon icon={k.icon} className="text-base text-white" />
                </div>
                <p className="text-base font-bold text-gray-900 dark:text-white">{k.value}</p>
                <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{k.label}</p>
              </div>
            ))}
          </div>

          {/* Lista de productos */}
          {data!.productos.length > 0 && (
            <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-100/50 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 dark:border-slate-800">
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">Mis productos este mes</h2>
                <p className="text-xs text-gray-400 mt-0.5">ordenados por lo que más vendiste</p>
              </div>
              <div className="px-5">
                {data!.productos.map(p => <FilaProducto key={p.id} p={p} />)}
              </div>

              {/* Leyenda */}
              <div className="px-5 py-3 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-100 dark:border-slate-800 flex gap-4 flex-wrap">
                {Object.entries(ESTADO_CONFIG).map(([k, v]) => (
                  <span key={k} className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <span>{v.icon}</span> {v.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
