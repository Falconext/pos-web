import { Icon } from '@iconify/react';
import { useLibroControlViewModel } from './useLibroControlViewModel';

export default function LibroControlView() {
    const vm = useLibroControlViewModel();
    const empresa = (vm.auth?.empresa as any);

    return (
        <div className="p-4 md:p-6 min-h-screen dark:bg-[#0A0D14] space-y-5 print:p-4">

            {/* Header */}
            <div className="flex items-start justify-between flex-wrap gap-3 print:hidden">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white">Libro de Control</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        Psicotrópicos y Estupefacientes · DS 023-2001-SA
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={vm.exportarCSV}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-colors"
                    >
                        <Icon icon="solar:file-download-bold" />
                        Exportar CSV
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-colors"
                    >
                        <Icon icon="solar:printer-bold" />
                        Imprimir
                    </button>
                </div>
            </div>

            {/* Cabecera impresión */}
            <div className="hidden print:block border-b pb-3 mb-4">
                <h2 className="text-xl font-black text-center">LIBRO DE CONTROL DE PSICOTRÓPICOS Y ESTUPEFACIENTES</h2>
                <p className="text-center text-sm mt-1">(DS 023-2001-SA)</p>
                <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                    <p><strong>Establecimiento:</strong> {empresa?.razonSocial ?? empresa?.nombre}</p>
                    <p><strong>RUC:</strong> {empresa?.ruc ?? empresa?.nroDoc}</p>
                    <p><strong>Dirección:</strong> {empresa?.direccion}</p>
                    <p><strong>Director Técnico Q.F.:</strong> {empresa?.directorTecnico ?? '_______________'}</p>
                    <p><strong>Período:</strong> {vm.fechaInicio} al {vm.fechaFin}</p>
                </div>
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap gap-3 print:hidden">
                <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Desde</label>
                    <input type="date" value={vm.fechaInicio} onChange={e => vm.setFechaInicio(e.target.value)}
                        className="px-3 py-2 bg-white dark:bg-[#1E2435] border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none" />
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Hasta</label>
                    <input type="date" value={vm.fechaFin} onChange={e => vm.setFechaFin(e.target.value)}
                        className="px-3 py-2 bg-white dark:bg-[#1E2435] border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none" />
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Medicamento</label>
                    <select value={vm.productoId} onChange={e => vm.setProductoId(e.target.value ? Number(e.target.value) : '')}
                        className="px-3 py-2 bg-white dark:bg-[#1E2435] border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none min-w-[200px]">
                        <option value="">Todos los controlados</option>
                        {vm.productosControlados.map(p => (
                            <option key={p.id} value={p.id}>{p.descripcion}{p.concentracion ? ` ${p.concentracion}` : ''}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Info legal */}
            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-xl px-4 py-2.5 flex items-start gap-2 print:hidden">
                <Icon icon="solar:info-circle-bold" className="text-amber-600 dark:text-amber-400 text-lg flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-300">
                    Este libro incluye solo productos marcados como <strong>Medicamento Controlado</strong> en la ficha del producto. Solo registra movimientos desde el uso de Falconext — el saldo inicial es 0 (no incluye histórico previo).
                </p>
            </div>

            {/* Tabla */}
            <div className="bg-white dark:bg-[#1E2435] rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
                {vm.loading ? (
                    <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
                        <Icon icon="solar:spinner-bold" className="text-2xl animate-spin" />
                        Cargando libro de control...
                    </div>
                ) : vm.movimientos.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                        <Icon icon="solar:document-medicine-linear" width={48} className="mx-auto mb-3 opacity-30" />
                        <p className="font-medium">Sin movimientos de medicamentos controlados</p>
                        <p className="text-sm mt-1">Verifica que los productos estén marcados como "Controlado" en su ficha</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50">
                                    {['N°', 'Fecha', 'Tipo', 'Proveedor / Paciente', 'DNI / RUC', 'N° Receta / Comprobante', 'Médico', 'Medicamento', 'Conc.', 'F. Farm.', 'Lote', 'Entrada', 'Salida', 'Saldo'].map(h => (
                                        <th key={h} className="text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-3 py-2.5 first:pl-4 last:pr-4 whitespace-nowrap">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-slate-800/60">
                                {vm.movimientos.map((m, i) => (
                                    <tr key={i} className={`hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors ${m.tipo === 'ENTRADA' ? 'bg-emerald-50/20 dark:bg-emerald-900/5' : 'bg-red-50/20 dark:bg-red-900/5'}`}>
                                        <td className="px-3 py-2 pl-4 text-gray-400 font-mono">{i + 1}</td>
                                        <td className="px-3 py-2 whitespace-nowrap text-gray-700 dark:text-gray-300">
                                            {new Date(m.fecha).toLocaleDateString('es-PE')}
                                        </td>
                                        <td className="px-3 py-2">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${m.tipo === 'ENTRADA' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>
                                                {m.tipo}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 max-w-[150px]">
                                            <p className="font-semibold text-gray-800 dark:text-gray-200 truncate">
                                                {m.tipo === 'ENTRADA' ? m.proveedor : m.paciente}
                                            </p>
                                        </td>
                                        <td className="px-3 py-2 font-mono text-gray-500 dark:text-gray-400">
                                            {m.tipo === 'ENTRADA' ? m.proveedorDoc : m.dniPaciente}
                                        </td>
                                        <td className="px-3 py-2 font-mono text-gray-500 dark:text-gray-400">
                                            {m.tipo === 'ENTRADA' ? m.documento : m.numeroReceta}
                                        </td>
                                        <td className="px-3 py-2 max-w-[120px]">
                                            <p className="text-gray-600 dark:text-gray-400 truncate">{m.medico}</p>
                                        </td>
                                        <td className="px-3 py-2 max-w-[160px]">
                                            <p className="font-semibold text-gray-800 dark:text-gray-200 truncate">{m.productoNombre}</p>
                                        </td>
                                        <td className="px-3 py-2 text-gray-500 dark:text-gray-400 whitespace-nowrap">{m.concentracion}</td>
                                        <td className="px-3 py-2 text-gray-500 dark:text-gray-400 whitespace-nowrap">{m.formaFarmaceutica}</td>
                                        <td className="px-3 py-2 font-mono text-gray-500 dark:text-gray-400">{m.lote}</td>
                                        <td className="px-3 py-2 font-bold text-emerald-700 dark:text-emerald-400 text-right">
                                            {m.tipo === 'ENTRADA' ? m.cantidad : ''}
                                        </td>
                                        <td className="px-3 py-2 font-bold text-red-600 dark:text-red-400 text-right">
                                            {m.tipo === 'SALIDA' ? m.cantidad : ''}
                                        </td>
                                        <td className="px-3 py-2 pr-4 font-black text-gray-900 dark:text-white text-right">{m.saldo}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pie de tabla */}
                {vm.movimientos.length > 0 && (
                    <div className="px-4 py-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {vm.movimientos.filter(m => m.tipo === 'ENTRADA').length} entradas · {vm.movimientos.filter(m => m.tipo === 'SALIDA').length} salidas
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 print:hidden">
                            Generado: {new Date().toLocaleDateString('es-PE')}
                        </p>
                    </div>
                )}
            </div>

            {/* Firma impresión */}
            <div className="hidden print:grid grid-cols-2 gap-8 mt-16">
                <div className="text-center border-t border-gray-400 pt-2">
                    <p className="text-sm font-semibold">Director Técnico Q.F.</p>
                    <p className="text-xs text-gray-500">Nombre y N° CQFP</p>
                </div>
                <div className="text-center border-t border-gray-400 pt-2">
                    <p className="text-sm font-semibold">Representante Legal</p>
                    <p className="text-xs text-gray-500">Nombre y Sello</p>
                </div>
            </div>
        </div>
    );
}
