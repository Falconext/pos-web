import { Icon } from '@iconify/react';
import { useLibroControlViewModel } from './useLibroControlViewModel';
import { Calendar } from '@/components/Date';
import Select from '@/components/Select';
import moment from 'moment';

export default function LibroControlView() {
    const vm = useLibroControlViewModel();
    const empresa = (vm.auth?.empresa as any);

    const medicamentoOptions = [
        { id: '', value: 'Todos los controlados' },
        ...vm.productosControlados.map(p => ({
            id: p.id,
            value: `${p.descripcion}${p.concentracion ? ` ${p.concentracion}` : ''}`
        }))
    ];
    const selectedMedicamentoValue = vm.productoId === '' 
        ? 'Todos los controlados' 
        : (medicamentoOptions.find(o => o.id === vm.productoId)?.value || 'Todos los controlados');

    return (
        <div className="p-4 md:p-6 min-h-screen dark:bg-[#0A0D14] space-y-5 print:p-4">
            <style>{`
                @media print {
                    @page { size: A4 landscape; margin: 10mm; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    table { page-break-inside: auto; }
                    tr { page-break-inside: avoid; page-break-after: auto; }
                }
            `}</style>
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
            <div className="hidden print:block border-b border-black pb-2 mb-2">
                <h2 className="text-xl font-bold text-center text-black">LIBRO DE CONTROL DE PSICOTRÓPICOS Y ESTUPEFACIENTES</h2>
                <p className="text-center text-sm text-black">(DS 023-2001-SA)</p>
                <div className="flex justify-between items-end mt-2 text-xs text-black">
                    <div className="space-y-1">
                        <p><strong>Establecimiento:</strong> {empresa?.razonSocial ?? empresa?.nombre}</p>
                        <p><strong>Dirección:</strong> {empresa?.direccion}</p>
                        <p><strong>Período:</strong> {vm.fechaInicio} al {vm.fechaFin}</p>
                    </div>
                    <div className="space-y-1 text-right">
                        <p><strong>RUC:</strong> {empresa?.ruc ?? empresa?.nroDoc}</p>
                        <p><strong>Director Técnico Q.F.:</strong> {empresa?.directorTecnico ?? '_______________'}</p>
                    </div>
                </div>
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap gap-3 print:hidden items-center">
                <div className="w-40 z-10">
                    <Calendar
                        text="Desde"
                        name="fechaInicio"
                        withOutFormat={true}
                        portal={true}
                        onChange={(date) => vm.setFechaInicio(date)}
                        value={vm.fechaInicio ? moment(vm.fechaInicio).format('DD/MM/YYYY') : ''}
                    />
                </div>
                <div className="w-40 z-10">
                    <Calendar
                        text="Hasta"
                        name="fechaFin"
                        withOutFormat={true}
                        portal={true}
                        onChange={(date) => vm.setFechaFin(date)}
                        value={vm.fechaFin ? moment(vm.fechaFin).format('DD/MM/YYYY') : ''}
                    />
                </div>
                <div className="w-64 z-20">
                    <Select
                        label="Medicamento"
                        name="productoId"
                        options={medicamentoOptions}
                        value={selectedMedicamentoValue}
                        onChange={(id) => vm.setProductoId(id ? Number(id) : '')}
                        error={null}
                        isSearch={true}
                    />
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
            <div className="bg-white dark:bg-[#1E2435] rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm print:shadow-none print:border-none print:rounded-none">
                {vm.loading ? (
                    <div className="flex items-center justify-center py-16 gap-3 text-gray-400 print:hidden">
                        <Icon icon="solar:spinner-bold" className="text-2xl animate-spin" />
                        Cargando libro de control...
                    </div>
                ) : vm.movimientos.length === 0 ? (
                    <div className="text-center py-16 text-gray-400 print:hidden">
                        <Icon icon="solar:document-medicine-linear" width={48} className="mx-auto mb-3 opacity-30" />
                        <p className="font-medium">Sin movimientos de medicamentos controlados</p>
                        <p className="text-sm mt-1">Verifica que los productos estén marcados como "Controlado" en su ficha</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto print:overflow-visible">
                        <table className="w-full text-xs print:border-collapse print:border print:border-black">
                            <thead className="print:text-[7px]">
                                <tr className="border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 print:bg-transparent">
                                    {['N°', 'Fecha', 'Tipo', 'Proveedor / Paciente', 'DNI / RUC', 'N° Receta / Comprobante', 'Médico', 'Medicamento', 'Conc.', 'F. Farm.', 'Lote', 'Entrada', 'Salida', 'Saldo'].map(h => (
                                        <th key={h} className={`text-left text-[10px] print:text-[7px] font-bold text-gray-500 dark:text-gray-400 print:text-black uppercase tracking-wide px-3 py-2.5 print:px-1 print:py-1 print:border print:border-black first:pl-4 last:pr-4 print:first:pl-1 print:last:pr-1 whitespace-nowrap ${h === 'N°' ? 'print:hidden' : ''}`}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-slate-800/60 print:divide-black print:text-[7px]">
                                {vm.movimientos.map((m, i) => (
                                    <tr key={i} className={`hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors ${m.tipo === 'ENTRADA' ? 'bg-emerald-50/20 dark:bg-emerald-900/5' : 'bg-red-50/20 dark:bg-red-900/5'} print:bg-transparent`}>
                                        <td className="px-3 py-2 print:hidden pl-4 text-gray-400 font-mono">{i + 1}</td>
                                        <td className="px-3 py-2 print:px-1 print:py-1 print:border print:border-black whitespace-nowrap text-gray-700 dark:text-gray-300 print:text-black print:pl-1">
                                            {new Date(m.fecha).toLocaleDateString('es-PE')}
                                        </td>
                                        <td className="px-3 py-2 print:px-1 print:py-1 print:border print:border-black text-center">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] print:text-[7px] font-bold print:font-normal print:bg-transparent print:p-0 print:text-black ${m.tipo === 'ENTRADA' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>
                                                {m.tipo}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 print:px-1 print:py-1 print:border print:border-black max-w-[150px] print:max-w-[100px]">
                                            <p className="font-semibold text-gray-800 dark:text-gray-200 print:text-black truncate print:whitespace-normal">
                                                {m.tipo === 'ENTRADA' ? m.proveedor : m.paciente}
                                            </p>
                                        </td>
                                        <td className="px-3 py-2 print:px-1 print:py-1 print:border print:border-black font-mono text-gray-500 dark:text-gray-400 print:text-black print:whitespace-normal print:break-all print:max-w-[50px]">
                                            {m.tipo === 'ENTRADA' ? m.proveedorDoc : m.dniPaciente}
                                        </td>
                                        <td className="px-3 py-2 print:px-1 print:py-1 print:border print:border-black font-mono text-gray-500 dark:text-gray-400 print:text-black print:whitespace-normal print:break-all print:max-w-[60px]">
                                            {m.tipo === 'ENTRADA' ? m.documento : m.numeroReceta}
                                        </td>
                                        <td className="px-3 py-2 print:px-1 print:py-1 print:border print:border-black max-w-[120px] print:max-w-[80px]">
                                            <p className="text-gray-600 dark:text-gray-400 print:text-black truncate print:whitespace-normal">{m.medico}</p>
                                        </td>
                                        <td className="px-3 py-2 print:px-1 print:py-1 print:border print:border-black max-w-[160px] print:max-w-[100px]">
                                            <p className="font-semibold text-gray-800 dark:text-gray-200 print:text-black truncate print:whitespace-normal">{m.productoNombre}</p>
                                        </td>
                                        <td className="px-3 py-2 print:px-1 print:py-1 print:border print:border-black text-gray-500 dark:text-gray-400 print:text-black print:whitespace-normal print:max-w-[40px]">{m.concentracion}</td>
                                        <td className="px-3 py-2 print:px-1 print:py-1 print:border print:border-black text-gray-500 dark:text-gray-400 print:text-black print:whitespace-normal print:max-w-[40px]">{m.formaFarmaceutica}</td>
                                        <td className="px-3 py-2 print:px-1 print:py-1 print:border print:border-black font-mono text-gray-500 dark:text-gray-400 print:text-black print:whitespace-normal print:max-w-[40px]">{m.lote}</td>
                                        <td className="px-3 py-2 print:px-1 print:py-1 print:border print:border-black font-bold text-emerald-700 dark:text-emerald-400 print:text-black text-right print:font-normal">
                                            {m.tipo === 'ENTRADA' ? m.cantidad : ''}
                                        </td>
                                        <td className="px-3 py-2 print:px-1 print:py-1 print:border print:border-black font-bold text-red-600 dark:text-red-400 print:text-black text-right print:font-normal">
                                            {m.tipo === 'SALIDA' ? m.cantidad : ''}
                                        </td>
                                        <td className="px-3 py-2 print:px-1 print:py-1 print:border print:border-black pr-4 print:pr-1 font-black text-gray-900 dark:text-white print:text-black text-right print:font-bold">{m.saldo}</td>
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
                <div className="text-center border-t border-black pt-2">
                    <p className="text-sm font-bold">Director Técnico Q.F.</p>
                    <p className="text-xs">{empresa?.directorTecnico ?? '_______________________'}</p>
                </div>
                <div className="text-center border-t border-black pt-2">
                    <p className="text-sm font-bold">Representante Legal</p>
                    <p className="text-xs">RUC: {empresa?.ruc ?? empresa?.nroDoc ?? '_______________________'}</p>
                </div>
            </div>
        </div>
    );
}
