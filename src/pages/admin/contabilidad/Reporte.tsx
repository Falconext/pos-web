"use client";
import { useState } from 'react';
import moment from 'moment';
import { useReporteViewModel, useReporteInformalesViewModel, useReporteComprasViewModel, useReporteGastosViewModel } from '@/features/admin/contabilidad/useContabilidadReporteViewModel';
import DataTable from "@/components/Datatable";
import { Calendar } from "@/components/Date";
import { Icon } from "@iconify/react";
import Select from "@/components/Select";
import useOutsideClick from "@/hooks/useOutsideClick";

const FORMAL_COLUMNS = [
    { label: 'Sede', key: 'sede' },
    { label: 'Comprobante', key: 'comprobante' },
    { label: 'Serie', key: 'serie' },
    { label: 'Correlativo', key: 'correlativo' },
    { label: 'RUC/DNI', key: 'ruc' },
    { label: 'Cliente', key: 'cliente' },
    { label: 'Vendedor', key: 'vendedor' },
    { label: 'Fecha', key: 'fecha' },
    { label: 'Moneda', key: 'monedaDoc' },
    { label: 'Forma Pago', key: 'formaPago' },
    { label: 'Medio Pago', key: 'medioPago' },
    { label: 'Estado SUNAT', key: 'estadoSunat' },
    { label: 'Estado Pago', key: 'estadoPago' },
    { label: 'Op. Gravada', key: 'gravadas' },
    { label: 'Op. Inafecta', key: 'inafectas' },
    { label: 'Op. Exonerada', key: 'exoneradas' },
    { label: 'Op. Exportación', key: 'exportacion' },
    { label: 'IGV', key: 'igv' },
    { label: 'Total', key: 'total' },
    { label: 'Saldo', key: 'saldo' },
    { label: 'Motivo NC/ND', key: 'motivo' },
];

// Mismas columnas que el listado + por qué el documento no entra al total.
const EXCLUIDOS_COLUMNS = [
    { label: 'Comprobante', key: 'comprobante' },
    { label: 'Serie', key: 'serie' },
    { label: 'Correlativo', key: 'correlativo' },
    { label: 'RUC/DNI', key: 'ruc' },
    { label: 'Cliente', key: 'cliente' },
    { label: 'Fecha', key: 'fecha' },
    { label: 'Estado SUNAT', key: 'estadoSunat' },
    { label: 'Total', key: 'total' },
    { label: 'Por qué no suma', key: 'motivoDocExcluido' },
];

const INFORMAL_COLUMNS = [
    { label: 'Sede', key: 'sede' },
    { label: 'Comprobante', key: 'comprobante' },
    { label: 'Serie', key: 'serie' },
    { label: 'Correlativo', key: 'correlativo' },
    { label: 'Nro. Documento', key: 'ruc' },
    { label: 'Cliente', key: 'cliente' },
    { label: 'Fecha', key: 'fecha' },
    { label: 'Estado Pago', key: 'estadoPago' },
    { label: 'Saldo', key: 'saldo' },
    { label: 'Medio Pago', key: 'medioPago' },
    { label: 'Estado OT', key: 'estadoOT' },
    { label: 'Adelanto', key: 'adelanto' },
    { label: 'Total', key: 'total' },
];

const COMPRAS_COLUMNS = [
    { label: 'Sede', key: 'sede' },
    { label: 'Tipo', key: 'comprobante' },
    { label: 'Serie', key: 'serie' },
    { label: 'Número', key: 'numero' },
    { label: 'RUC/DNI', key: 'ruc' },
    { label: 'Proveedor', key: 'proveedor' },
    { label: 'Fecha', key: 'fecha' },
    { label: 'Moneda', key: 'monedaDoc' },
    { label: 'Estado Pago', key: 'estadoPago' },
    { label: 'Base Gravada', key: 'gravadas' },
    { label: 'IGV', key: 'igv' },
    { label: 'Total', key: 'total' },
    { label: 'Saldo', key: 'saldo' },
];

const GASTOS_COLUMNS = [
    { label: 'Fecha', key: 'fecha' },
    { label: 'Categoría', key: 'categoria' },
    { label: 'Etiqueta', key: 'etiqueta' },
    { label: 'Descripción', key: 'descripcion' },
    { label: 'Recurrente', key: 'recurrente' },
    { label: 'Monto', key: 'monto' },
];

const money = (value: number) => `S/ ${typeof value === 'number' ? value.toFixed(2) : '0.00'}`;

// [label, monto, clase de color?, ocultar si es cero?]. Las líneas "opcionales"
// (NC, ND, descuentos, inafectas…) solo se muestran cuando tienen valor: un
// "Nota de Crédito: S/ 0.00" en un mes con NC de anulación parecía un error.
type SummaryItem = [string, number, string?, boolean?];

const SummaryBox = ({ items, total, notas }: { items: SummaryItem[]; total: number; notas?: React.ReactNode }) => (
    <div className="w-full rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-slate-800 dark:bg-slate-900/50 sm:min-w-[300px] sm:p-6">
        {items
            .filter(([, val, , hideIfZero]) => !hideIfZero || Math.abs(val || 0) >= 0.005)
            .map(([label, val, colorClass = '']) => (
                <div key={label} className="flex justify-between gap-4 border-b border-gray-200 py-1.5 last:border-0 dark:border-slate-800">
                    <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
                    <span className={`text-sm font-semibold dark:text-white ${colorClass}`}>{money(val)}</span>
                </div>
            ))}
        <div className="mt-2 flex justify-between border-t-2 border-blue-500/30 pt-4">
            <span className="text-base font-bold dark:text-white">Total:</span>
            <strong className="text-lg font-black text-blue-600 dark:text-blue-400">{money(total)}</strong>
        </div>
        {notas}
    </div>
);

// Anulados, sus NC y rechazados leídos juntos. El anulado suma en su mes
// (criterio SUNAT/SIRE); lo resta su NC en el mes en que ella se emitió; el
// rechazado no suma nunca.
type Cuenta = { n: number; monto: number };
const NotasResumen = ({ r }: { r: { anulados: Cuenta; ncAnulacion: Cuenta; rechazados: Cuenta } }) => {
    const filas: [string, Cuenta, string][] = [
        ['Anulados por NC (suman en su mes)', r.anulados, ''],
        ['NC de anulación (restan en el suyo)', r.ncAnulacion, 'text-red-500 dark:text-red-400'],
        ['Rechazados por SUNAT (no suman)', r.rechazados, 'text-gray-400'],
    ];
    const visibles = filas.filter(([, v]) => v.n > 0);
    if (visibles.length === 0) return null;
    return (
        <div className="mt-4 rounded-xl border border-dashed border-gray-300 p-3 dark:border-slate-700">
            <p className="mb-1.5 text-[11px] font-black uppercase tracking-wide text-gray-400">Anulaciones del período</p>
            {visibles.map(([label, v, cls]) => (
                <div key={label} className="flex justify-between gap-4 py-1 text-xs">
                    <span className="text-gray-500 dark:text-gray-400">{label} <span className="text-gray-400">({v.n})</span></span>
                    <span className={`font-semibold text-gray-500 dark:text-gray-400 ${cls}`}>{money(v.monto)}</span>
                </div>
            ))}
            {r.anulados.n > 0 && r.ncAnulacion.n === 0 && (
                <p className="mt-1.5 text-[11px] text-gray-400">La NC que anula estos documentos se emitió en otro mes y resta allí.</p>
            )}
        </div>
    );
};

const MobileReportCards = ({ reports, type }: { reports: any[]; type: 'formal' | 'informal' }) => (
    <div className="space-y-3 md:hidden">
        {reports.map((row, index) => (
            <article key={`${row.serie}-${row.correlativo}-${index}`} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#0F172A]">
                <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-[11px] font-black uppercase tracking-wide text-gray-400">{row.sede || 'Sin sede'}</p>
                        <h3 className="mt-1 truncate text-base font-black text-gray-900 dark:text-white">
                            {row.comprobante || 'Comprobante'} {row.serie}-{row.correlativo}
                        </h3>
                        <p className="text-xs font-semibold text-gray-500">{row.fecha}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-[11px] font-black uppercase text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                        {row.estadoPago || '-'}
                    </span>
                </div>

                <div className="mb-3 rounded-2xl bg-gray-50 p-3 dark:bg-slate-900/60">
                    <p className="truncate text-sm font-black uppercase text-gray-900 dark:text-white">{row.cliente || 'Cliente no registrado'}</p>
                    <p className="text-xs text-gray-500">{row.ruc || '-'} · {row.medioPago || 'Sin medio de pago'}</p>
                </div>

                <div className="grid grid-cols-3 gap-2 rounded-2xl bg-gray-50 p-3 dark:bg-slate-900/60">
                    <div>
                        <p className="text-[10px] font-black uppercase text-gray-400">Total</p>
                        <p className="text-sm font-black text-gray-900 dark:text-white">{row.total || 'S/ 0.00'}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-gray-400">Saldo</p>
                        <p className="text-sm font-black text-amber-600 dark:text-amber-300">{row.saldo || '-'}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-gray-400">{type === 'formal' ? 'IGV' : 'Adelanto'}</p>
                        <p className="text-sm font-black text-gray-900 dark:text-white">{type === 'formal' ? row.igv : row.adelanto}</p>
                    </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-xl border border-gray-100 p-3 dark:border-slate-800">
                        <p className="font-black uppercase text-gray-400">{type === 'formal' ? 'SUNAT' : 'Estado OT'}</p>
                        <p className="mt-1 font-bold text-gray-700 dark:text-gray-200">{type === 'formal' ? row.estadoSunat || '-' : row.estadoOT || '-'}</p>
                    </div>
                    <div className="rounded-xl border border-gray-100 p-3 dark:border-slate-800">
                        <p className="font-black uppercase text-gray-400">{type === 'formal' ? 'Forma pago' : 'Documento'}</p>
                        <p className="mt-1 font-bold text-gray-700 dark:text-gray-200">{type === 'formal' ? row.formaPago || '-' : row.comprobante || '-'}</p>
                    </div>
                </div>
            </article>
        ))}
    </div>
);

const TabFormal = () => {
    const vm = useReporteViewModel();
    const [pdfMenuOpen, setPdfMenuOpen, pdfMenuRef] = useOutsideClick(false);
    const [showExcluidos, setShowExcluidos] = useState(false);
    const nExcluidos = vm.excluidos?.length ?? 0;
    return (
        <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
            <div data-krk-filtros-seccion className="border-b border-gray-100 p-4 dark:border-slate-800 sm:p-5">
                <div data-krk-filtros-head className="flex items-center gap-2 mb-4">
                    <Icon icon="solar:filter-bold-duotone" className="text-blue-600 text-xl" />
                    <h3 className="font-semibold text-gray-800 dark:text-white">Filtros</h3>
                </div>
                <div data-krk-filtros className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[0.8fr_0.8fr_0.9fr_auto_auto] xl:items-end">
                    <Calendar name="fechaInicio" value={moment(vm.fechaInicio).format('DD/MM/YYYY')} onChange={vm.handleDate} text="Fecha inicio" className="admin-date-filter" portal />
                    <Calendar name="fechaFin" value={moment(vm.fechaFin).format('DD/MM/YYYY')} onChange={vm.handleDate} text="Fecha Fin" className="admin-date-filter" portal />
                    {vm.canFilterSede && (
                        <div className="w-full">
                            <Select error="" label="Sede" name="sedeId" defaultValue="Todas las sedes" onChange={vm.handleSelectSede} options={vm.sedesOptions} />
                        </div>
                    )}
                    <div className="relative w-full md:w-auto xl:ml-auto" ref={pdfMenuRef}>
                        <button
                            type="button"
                            onClick={() => setPdfMenuOpen(!pdfMenuOpen)}
                            disabled={vm.isExportingPdf}
                            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-200 transition-all hover:bg-gray-50 dark:hover:bg-slate-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"
                        >
                            <Icon icon={vm.isExportingPdf ? 'line-md:loading-twotone-loop' : 'solar:export-bold-duotone'} className="text-base text-blue-600 dark:text-blue-400" />
                            {vm.isExportingPdf ? 'Exportando...' : 'Exportar PDF'}
                            {!vm.isExportingPdf && <Icon icon="solar:alt-arrow-down-linear" className="text-sm text-gray-400" />}
                        </button>
                        {pdfMenuOpen && !vm.isExportingPdf && (
                            <div className="absolute right-0 z-20 mt-2 w-72 rounded-xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => { setPdfMenuOpen(false); vm.handleExportPdf('pdf'); }}
                                    className="w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                >
                                    <Icon icon="mdi:file-pdf-box" className="text-xl text-rose-600 mt-0.5" />
                                    <span>
                                        <span className="block text-sm font-bold text-gray-800 dark:text-gray-100">PDF único (combinado)</span>
                                        <span className="block text-xs text-gray-400">Todos los comprobantes en un solo archivo</span>
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setPdfMenuOpen(false); vm.handleExportPdf('zip'); }}
                                    className="w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors border-t border-gray-100 dark:border-slate-700"
                                >
                                    <Icon icon="mdi:zip-box-outline" className="text-xl text-amber-600 mt-0.5" />
                                    <span>
                                        <span className="block text-sm font-bold text-gray-800 dark:text-gray-100">ZIP (archivos separados)</span>
                                        <span className="block text-xs text-gray-400">Un PDF por cada comprobante</span>
                                    </span>
                                </button>
                            </div>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={vm.handleExport}
                        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-700 active:scale-95 md:w-auto"
                    >
                        <Icon icon="solar:export-bold" className="text-base" />
                        Exportar Excel
                    </button>
                </div>
            </div>
            <div className="p-4">
                {vm.reports?.length > 0 || nExcluidos > 0 ? (
                    <>
                        <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
                            <Icon icon="solar:documents-bold-duotone" className="text-lg text-indigo-600 dark:text-indigo-400" />
                            <h3 className="text-sm font-bold text-gray-800 dark:text-white">
                                Comprobantes <span className="text-indigo-600 dark:text-indigo-400">({vm.reports.length})</span>
                            </h3>
                            {nExcluidos > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setShowExcluidos(!showExcluidos)}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/20"
                                    title="Emitidos en el rango que SUNAT no aceptó (rechazados o con envío fallido): no entran al total"
                                >
                                    <Icon icon="solar:eye-closed-linear" className="text-sm" />
                                    {vm.reports.length + nExcluidos} emitidos · {nExcluidos} no suman
                                    <Icon icon={showExcluidos ? 'solar:alt-arrow-up-linear' : 'solar:alt-arrow-down-linear'} className="text-sm" />
                                </button>
                            )}
                        </div>
                        {showExcluidos && nExcluidos > 0 && (
                            <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50/40 p-3 dark:border-amber-500/20 dark:bg-amber-500/5">
                                <p className="mb-2 text-xs text-amber-800 dark:text-amber-200">
                                    Estos documentos aparecen en la lista de Comprobantes porque se emitieron, pero SUNAT no los aceptó, así que no son venta. Los anulados por nota de crédito, en cambio, sí suman en su mes de emisión y los resta la NC en el mes en que ella se emitió — mismo criterio que el Libro de Ventas (SIRE).
                                </p>
                                <div className="overflow-x-auto">
                                    <DataTable actions={[]} bodyData={vm.excluidos} headerColumns={EXCLUIDOS_COLUMNS} />
                                </div>
                            </div>
                        )}
                        <MobileReportCards reports={vm.reports} type="formal" />
                        <div className="hidden overflow-x-auto md:block">
                            <DataTable actions={[]} bodyData={vm.reports} headerColumns={FORMAL_COLUMNS} />
                        </div>
                        {vm.resumenReporte !== null && (
                            <div className="mt-5 flex justify-end sm:mt-8 sm:mb-5 sm:pr-6">
                                <SummaryBox
                                    items={[
                                        ['Boletas:', vm.resumenReporte.totalBoletas],
                                        ['Facturas:', vm.resumenReporte.totalFacturas],
                                        ['Nota de Crédito (restan):', -vm.resumenReporte.totalNotasCredito, 'text-red-500 dark:text-red-400', true],
                                        ['Nota de Débito:', vm.resumenReporte.totalNotasDebito, '', true],
                                        ['Total Descuentos:', vm.resumenReporte.totalDescuentos, 'text-orange-500 dark:text-orange-400', true],
                                        ['Op. Gravadas:', vm.resumenReporte.totalGravadas],
                                        ['Op. Inafectas:', vm.resumenReporte.totalInafectas, '', true],
                                        ['Op. Exoneradas:', vm.resumenReporte.totalExoneradas, '', true],
                                        ['Op. Exportación:', vm.resumenReporte.totalExportacion, '', true],
                                        ['Total IGV (18%):', vm.resumenReporte.totalIGV],
                                    ]}
                                    total={vm.resumenReporte.totalVenta}
                                    notas={<NotasResumen r={vm.notasResumen} />}
                                />
                            </div>
                        )}
                    </>
                ) : (
                    <div className="py-12 text-center">
                        <Icon icon="solar:chart-2-linear" className="text-5xl text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No se encontraron comprobantes</p>
                        <p className="text-sm text-gray-400 mt-1">Selecciona un rango de fechas diferente</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const TabInformal = () => {
    const vm = useReporteInformalesViewModel();
    const r = vm.resumenReporteInformal;
    return (
        <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
            <div data-krk-filtros-seccion className="border-b border-gray-100 p-4 dark:border-slate-800 sm:p-5">
                <div data-krk-filtros-head className="flex items-center gap-2 mb-4">
                    <Icon icon="solar:filter-bold-duotone" className="text-blue-600 text-xl" />
                    <h3 className="font-semibold text-gray-800 dark:text-white">Filtros</h3>
                </div>
                <div data-krk-filtros className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[0.8fr_0.8fr_0.9fr_auto] xl:items-end">
                    <Calendar name="fechaInicio" value={moment(vm.fechaInicio).format('DD/MM/YYYY')} onChange={vm.handleDate} text="Fecha inicio" className="admin-date-filter" portal />
                    <Calendar name="fechaFin" value={moment(vm.fechaFin).format('DD/MM/YYYY')} onChange={vm.handleDate} text="Fecha Fin" className="admin-date-filter" portal />
                    {vm.canFilterSede && (
                        <div className="w-full">
                            <Select error="" label="Sede" name="sedeId" defaultValue="Todas las sedes" onChange={vm.handleSelectSede} options={vm.sedesOptions} />
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={vm.handleExport}
                        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-700 active:scale-95 md:w-auto xl:ml-auto"
                    >
                        <Icon icon="solar:export-bold" className="text-base" />
                        Exportar Excel
                    </button>
                </div>
            </div>
            <div className="p-4">
                {vm.reports?.length > 0 ? (
                    <>
                        <div className="mb-3 flex items-center gap-2">
                            <Icon icon="solar:documents-bold-duotone" className="text-lg text-indigo-600 dark:text-indigo-400" />
                            <h3 className="text-sm font-bold text-gray-800 dark:text-white">
                                Comprobantes <span className="text-indigo-600 dark:text-indigo-400">({vm.reports.length})</span>
                            </h3>
                        </div>
                        <MobileReportCards reports={vm.reports} type="informal" />
                        <div className="hidden overflow-x-auto md:block">
                            <DataTable actions={[]} bodyData={vm.reports} headerColumns={INFORMAL_COLUMNS} />
                        </div>
                        {r !== null && (
                            <div className="mt-5 flex justify-end sm:mt-8 sm:mb-5 sm:pr-6">
                                <SummaryBox
                                    items={[
                                        ['Tickets:', r.totalTickets],
                                        ['Notas de Venta:', r.totalNotasVenta],
                                        ['Recibos por Honorarios:', r.totalRecibosHonorarios],
                                        ['Comprobantes de Pago:', r.totalComprobantesPago],
                                        ['Notas de Pedido:', r.totalNotasPedido],
                                        ['Órdenes de Trabajo:', r.totalOrdenesTrabajo],
                                        [`Ya convertidos a SUNAT (${r.cantidadConvertidos ?? 0}, no suman):`, r.totalConvertidos ?? 0, 'text-gray-400 dark:text-gray-500', true],
                                    ]}
                                    total={r.totalVenta}
                                />
                            </div>
                        )}
                    </>
                ) : (
                    <div className="py-12 text-center">
                        <Icon icon="solar:chart-2-linear" className="text-5xl text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No se encontraron comprobantes</p>
                        <p className="text-sm text-gray-400 mt-1">Selecciona un rango de fechas diferente</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const TabCompras = () => {
    const vm = useReporteComprasViewModel();
    const r = vm.resumenReporteCompras;
    return (
        <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
            <div data-krk-filtros-seccion className="border-b border-gray-100 p-4 dark:border-slate-800 sm:p-5">
                <div data-krk-filtros-head className="flex items-center gap-2 mb-4">
                    <Icon icon="solar:filter-bold-duotone" className="text-blue-600 text-xl" />
                    <h3 className="font-semibold text-gray-800 dark:text-white">Filtros</h3>
                </div>
                <div data-krk-filtros className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[0.8fr_0.8fr_0.9fr_auto] xl:items-end">
                    <Calendar name="fechaInicio" value={moment(vm.fechaInicio).format('DD/MM/YYYY')} onChange={vm.handleDate} text="Fecha inicio" className="admin-date-filter" portal />
                    <Calendar name="fechaFin" value={moment(vm.fechaFin).format('DD/MM/YYYY')} onChange={vm.handleDate} text="Fecha Fin" className="admin-date-filter" portal />
                    {vm.canFilterSede && (
                        <div className="w-full">
                            <Select error="" label="Sede" name="sedeId" defaultValue="Todas las sedes" onChange={vm.handleSelectSede} options={vm.sedesOptions} />
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={vm.handleExport}
                        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-700 active:scale-95 md:w-auto xl:ml-auto"
                    >
                        <Icon icon="solar:export-bold" className="text-base" />
                        Exportar Excel
                    </button>
                </div>
            </div>
            <div className="p-4">
                {vm.reports?.length > 0 ? (
                    <>
                        <div className="mb-3 flex items-center gap-2">
                            <Icon icon="solar:cart-large-2-bold-duotone" className="text-lg text-indigo-600 dark:text-indigo-400" />
                            <h3 className="text-sm font-bold text-gray-800 dark:text-white">
                                Compras <span className="text-indigo-600 dark:text-indigo-400">({vm.reports.length})</span>
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <DataTable actions={[]} bodyData={vm.reports} headerColumns={COMPRAS_COLUMNS} />
                        </div>
                        {r !== null && (
                            <div className="mt-5 flex justify-end sm:mt-8 sm:mb-5 sm:pr-6">
                                <SummaryBox
                                    items={[
                                        ['Facturas:', r.totalFacturas],
                                        ['Boletas:', r.totalBoletas],
                                        ['Otros:', r.totalOtros],
                                        ['Base Gravada:', r.totalGravadas],
                                        ['Total IGV:', r.totalIGV],
                                        ['Saldo Pendiente:', r.totalSaldo, 'text-amber-500 dark:text-amber-400'],
                                    ]}
                                    total={r.totalCompra}
                                />
                            </div>
                        )}
                    </>
                ) : (
                    <div className="py-12 text-center">
                        <Icon icon="solar:cart-cross-linear" className="text-5xl text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No se encontraron compras</p>
                        <p className="text-sm text-gray-400 mt-1">Selecciona un rango de fechas diferente</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const TabGastos = () => {
    const vm = useReporteGastosViewModel();
    const r = vm.resumenReporteGastos;
    return (
        <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
            <div data-krk-filtros-seccion className="border-b border-gray-100 p-4 dark:border-slate-800 sm:p-5">
                <div data-krk-filtros-head className="flex items-center gap-2 mb-4">
                    <Icon icon="solar:filter-bold-duotone" className="text-blue-600 text-xl" />
                    <h3 className="font-semibold text-gray-800 dark:text-white">Filtros</h3>
                </div>
                <div data-krk-filtros className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[0.8fr_0.8fr_auto] xl:items-end">
                    <Calendar name="fechaInicio" value={moment(vm.fechaInicio).format('DD/MM/YYYY')} onChange={vm.handleDate} text="Fecha inicio" className="admin-date-filter" portal />
                    <Calendar name="fechaFin" value={moment(vm.fechaFin).format('DD/MM/YYYY')} onChange={vm.handleDate} text="Fecha Fin" className="admin-date-filter" portal />
                    <button
                        type="button"
                        onClick={vm.handleExport}
                        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-700 active:scale-95 md:w-auto xl:ml-auto"
                    >
                        <Icon icon="solar:export-bold" className="text-base" />
                        Exportar Excel
                    </button>
                </div>
            </div>
            <div className="p-4">
                {vm.reports?.length > 0 ? (
                    <>
                        <div className="mb-3 flex items-center gap-2">
                            <Icon icon="solar:wallet-money-bold-duotone" className="text-lg text-indigo-600 dark:text-indigo-400" />
                            <h3 className="text-sm font-bold text-gray-800 dark:text-white">
                                Gastos <span className="text-indigo-600 dark:text-indigo-400">({vm.reports.length})</span>
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <DataTable actions={[]} bodyData={vm.reports} headerColumns={GASTOS_COLUMNS} />
                        </div>
                        {r !== null && (
                            <div className="mt-5 flex justify-end sm:mt-8 sm:mb-5 sm:pr-6">
                                <SummaryBox
                                    items={[
                                        ['Publicidad:', r.totalPublicidad],
                                        ['Sueldos:', r.totalSueldos],
                                        ['Envíos:', r.totalEnvios],
                                        ['Comisiones:', r.totalComisiones],
                                        ['Alquiler:', r.totalAlquiler],
                                        ['Otros:', r.totalOtros],
                                    ]}
                                    total={r.totalGastos}
                                />
                            </div>
                        )}
                    </>
                ) : (
                    <div className="py-12 text-center">
                        <Icon icon="solar:wallet-linear" className="text-5xl text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No se encontraron gastos</p>
                        <p className="text-sm text-gray-400 mt-1">Selecciona un rango de fechas diferente</p>
                    </div>
                )}
            </div>
        </div>
    );
};

type Tab = 'formal' | 'informal' | 'compras' | 'gastos';

const TABS: { key: Tab; label: string; icon: string; desc: string }[] = [
    { key: 'formal', label: 'Comprobantes SUNAT', icon: 'solar:document-text-bold-duotone', desc: 'Boletas, facturas y notas electrónicas' },
    { key: 'informal', label: 'Comprobantes Internos', icon: 'solar:receipt-bold-duotone', desc: 'Tickets, notas de venta y documentos informales' },
    { key: 'compras', label: 'Compras', icon: 'solar:cart-large-2-bold-duotone', desc: 'Facturas y boletas de compra registradas en el período' },
    { key: 'gastos', label: 'Gastos', icon: 'solar:wallet-money-bold-duotone', desc: 'Gastos operativos (publicidad, sueldos, alquiler, etc.)' },
];

const ReportesComprobantes = () => {
    const [activeTab, setActiveTab] = useState<Tab>('formal');

    return (
        <div className="min-h-screen bg-gray-50 px-3 pb-4 dark:bg-[#0A0D14] sm:px-2">
            <div className="mb-4 flex flex-col items-start justify-between gap-3 pt-4 sm:mb-6 sm:flex-row sm:items-center">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
                        <Icon icon="solar:chart-2-bold-duotone" className="text-blue-600 dark:text-blue-400" />
                        Reporte Contable
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Resumen de comprobantes por período</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="mb-5 flex w-full gap-2 rounded-2xl border border-gray-100 bg-white p-1.5 dark:border-slate-800 dark:bg-[#111827] sm:w-fit">
                {TABS.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex flex-1 items-center justify-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 sm:flex-none ${
                            activeTab === tab.key
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800'
                        }`}
                    >
                        <Icon icon={tab.icon} className="text-lg shrink-0" />
                        <span className="hidden sm:inline">{tab.label}</span>
                        <span className="sm:hidden">
                            {tab.key === 'formal' ? 'SUNAT' : tab.key === 'informal' ? 'Internos' : tab.label}
                        </span>
                    </button>
                ))}
            </div>

            {/* Tab description */}
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-4 flex items-center gap-1.5">
                <Icon icon={TABS.find(t => t.key === activeTab)!.icon} className="text-sm" />
                {TABS.find(t => t.key === activeTab)!.desc}
            </p>

            {activeTab === 'formal' && <TabFormal />}
            {activeTab === 'informal' && <TabInformal />}
            {activeTab === 'compras' && <TabCompras />}
            {activeTab === 'gastos' && <TabGastos />}
        </div>
    );
};

export default ReportesComprobantes;
