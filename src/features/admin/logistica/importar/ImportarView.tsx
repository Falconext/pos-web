import { useRef } from 'react';
import { Icon } from '@iconify/react';
import Button from '@/components/Button';
import { useImportarViewModel } from './useImportarViewModel';
import { COLUMNAS, TipoImport } from './ImportarModel';

const TIPOS: { value: TipoImport; label: string; icon: string }[] = [
  { value: 'vehiculos', label: 'Vehículos', icon: 'solar:bus-bold-duotone' },
  { value: 'conductores', label: 'Conductores', icon: 'solar:user-bold-duotone' },
];

export default function ImportarView() {
  const vm = useImportarViewModel();
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="min-h-screen px-2 pb-4 relative z-1 dark:bg-[#0A0D14]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Importar Flota</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Carga masiva de vehículos y conductores desde un Excel</p>
      </div>

      <div className="max-w-3xl space-y-5">
        {/* Selector de tipo */}
        <div className="grid grid-cols-2 gap-3">
          {TIPOS.map((t) => (
            <button
              key={t.value}
              onClick={() => vm.cambiarTipo(t.value)}
              className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition ${
                vm.tipo === t.value
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                  : 'border-gray-200 dark:border-slate-800 bg-white dark:bg-[#111827]'
              }`}
            >
              <Icon icon={t.icon} width={26} className={vm.tipo === t.value ? 'text-emerald-600' : 'text-gray-400'} />
              <span className={`font-semibold ${vm.tipo === t.value ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-300'}`}>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Instrucciones + plantilla */}
        <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-slate-800 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Columnas esperadas</p>
            <button onClick={vm.descargarPlantilla} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1.5">
              <Icon icon="solar:download-minimalistic-bold" width={16} /> Descargar plantilla
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {COLUMNAS[vm.tipo].map((c) => (
              <span key={c} className="px-2.5 py-1 text-xs font-medium rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300">{c}</span>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3">La primera fila debe ser el encabezado. Placa/Nombre y Marca/Apellido son obligatorios. Los duplicados se omiten.</p>
        </div>

        {/* Carga de archivo */}
        <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-slate-800 p-5">
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => vm.setArchivo(e.target.files?.[0] ?? null)}
          />
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-xl p-8 text-center cursor-pointer hover:border-emerald-400 transition"
          >
            <Icon icon="solar:cloud-upload-bold-duotone" width={40} className="mx-auto text-emerald-500 mb-2" />
            {vm.archivo ? (
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{vm.archivo.name}</p>
            ) : (
              <p className="text-sm text-gray-500">Haz clic para seleccionar un archivo .xlsx / .csv</p>
            )}
          </div>
          <div className="mt-4 flex justify-end">
            <Button color="secondary" onClick={vm.importar} disabled={!vm.archivo || vm.cargando} className="flex items-center gap-2 !bg-emerald-600 border-none">
              <Icon icon={vm.cargando ? 'svg-spinners:180-ring' : 'solar:upload-bold'} width={18} />
              {vm.cargando ? 'Importando…' : 'Importar'}
            </Button>
          </div>
        </div>

        {/* Resultado */}
        {vm.resultado && (
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-slate-800 p-5">
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Resultado de la importación</p>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center p-3 rounded-xl bg-green-50 dark:bg-green-900/20">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{vm.resultado.creados}</p>
                <p className="text-xs text-gray-500">Creados</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20">
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{vm.resultado.omitidos}</p>
                <p className="text-xs text-gray-500">Omitidos (duplicados)</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-rose-50 dark:bg-rose-900/20">
                <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">{vm.resultado.errores.length}</p>
                <p className="text-xs text-gray-500">Con errores</p>
              </div>
            </div>
            {vm.resultado.errores.length > 0 && (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {vm.resultado.errores.map((er, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400">
                    <Icon icon="solar:close-circle-bold" width={14} />
                    <span>Fila {er.fila}: {er.motivo}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
