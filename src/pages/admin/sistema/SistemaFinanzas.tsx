import { Icon } from '@iconify/react';
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from 'recharts';
import {
    useSistemaFinanzasViewModel,
    CATEGORIAS_GASTO,
    CATEGORIAS_INGRESO,
} from '@/features/admin/sistema/useSistemaFinanzasViewModel';
import { Calendar } from '@/components/Date';
import Select from '@/components/Select';

// ── helpers ────────────────────────────────────────────────────────────────────

const toDisplay = (iso: string) => {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    if (!y || !m || !d) return '';
    return `${d}/${m}/${y}`;
};

const toISO = (display: string) => {
    if (!display || display.length < 10) return '';
    const parts = display.split('/');
    if (parts.length !== 3) return '';
    const [d, m, y] = parts;
    return `${y}-${m}-${d}`;
};

const PERIODICIDAD_OPS = [
    { id: 'MENSUAL', value: 'Mensual' },
    { id: 'ANUAL', value: 'Anual' },
];

const fmt = (n: number) =>
    `S/ ${Number(n || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const pct = (n: number) => `${Number(n || 0).toFixed(1)}%`;

const catInfo = (value: string) =>
    CATEGORIAS_GASTO.find((c) => c.value === value) ?? CATEGORIAS_GASTO[CATEGORIAS_GASTO.length - 1];

const tipoInfo = (value: string) =>
    CATEGORIAS_INGRESO.find((c) => c.value === value) ?? CATEGORIAS_INGRESO[CATEGORIAS_INGRESO.length - 1];

// ── KPI card ───────────────────────────────────────────────────────────────────

function KpiCard({
    label, value, sub, icon, color, trend, trendLabel,
}: {
    label: string; value: string; sub?: string;
    icon: string; color: string; trend?: number; trendLabel?: string;
}) {
    const up = (trend ?? 0) >= 0;
    return (
        <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-slate-800 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</span>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: color + '20' }}>
                    <Icon icon={icon} width={20} style={{ color }} />
                </div>
            </div>
            <p className="text-2xl font-black text-gray-900 dark:text-white leading-none mb-1">{value}</p>
            {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
            {trend !== undefined && (
                <div className={`flex items-center gap-1 mt-2 text-xs font-semibold ${up ? 'text-emerald-600' : 'text-red-500'}`}>
                    <Icon icon={up ? 'solar:arrow-up-bold' : 'solar:arrow-down-bold'} width={12} />
                    {pct(Math.abs(trend))} {trendLabel}
                </div>
            )}
        </div>
    );
}

// ── Tooltip personalizado ─────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white dark:bg-[#1E2435] border border-gray-100 dark:border-slate-700 rounded-xl shadow-xl p-3 text-[13px] font-inter min-w-[160px]">
            <p className="font-bold text-gray-700 dark:text-gray-200 mb-2">{label}</p>
            {payload.map((p: any) => (
                <div key={p.name} className="flex items-center justify-between gap-4">
                    <span style={{ color: p.color }} className="font-semibold">{p.name}</span>
                    <span className="font-bold text-gray-900 dark:text-white">{fmt(p.value)}</span>
                </div>
            ))}
        </div>
    );
}

// ── Modal Gasto ────────────────────────────────────────────────────────────────

function ModalGasto({ vm }: { vm: ReturnType<typeof useSistemaFinanzasViewModel> }) {
    if (!vm.showModal) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => vm.setShowModal(false)} />
            <div className="relative bg-white dark:bg-[#111827] rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">
                        {vm.editingId ? 'Editar gasto' : 'Registrar gasto'}
                    </h3>
                    <button onClick={() => vm.setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400">
                        <Icon icon="solar:close-bold" width={18} />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    {/* Concepto */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Concepto *</label>
                        <input
                            type="text"
                            value={vm.form.concepto}
                            onChange={(e) => vm.setFormField('concepto', e.target.value)}
                            placeholder="ej. Servidor AWS, Dominio, etc."
                            className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-[#0A0D14] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                        />
                    </div>

                    {/* Categoría + Monto */}
                    <div className="grid grid-cols-2 gap-3">
                        <Select
                            label="Categoría *"
                            name="categoria"
                            options={CATEGORIAS_GASTO.map((c) => ({ id: c.value, value: c.label }))}
                            value={CATEGORIAS_GASTO.find((c) => c.value === vm.form.categoria)?.label ?? ''}
                            onChange={(id: any) => vm.setFormField('categoria', id)}
                            error=""
                            readOnly
                        />
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Monto (S/) *</label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={vm.form.monto}
                                onChange={(e) => vm.setFormField('monto', e.target.value)}
                                placeholder="0.00"
                                className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-[#0A0D14] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                            />
                        </div>
                    </div>

                    {/* Fecha */}
                    <Calendar
                        text="Fecha *"
                        name="fecha"
                        value={toDisplay(vm.form.fecha)}
                        onChange={(v: string) => vm.setFormField('fecha', toISO(v))}
                    />

                    {/* Recurrente */}
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-900/40 rounded-xl">
                        <button
                            type="button"
                            onClick={() => vm.setFormField('recurrente', !vm.form.recurrente)}
                            className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${vm.form.recurrente ? 'bg-violet-600' : 'bg-gray-300 dark:bg-slate-600'}`}
                        >
                            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${vm.form.recurrente ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </button>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Gasto recurrente</span>
                        {vm.form.recurrente && (
                            <div className="ml-auto w-40">
                                <Select
                                    label="Periodicidad"
                                    name="periodicidad"
                                    options={PERIODICIDAD_OPS}
                                    value={PERIODICIDAD_OPS.find((o) => o.id === vm.form.periodicidad)?.value ?? ''}
                                    onChange={(id: any) => vm.setFormField('periodicidad', id)}
                                    error=""
                                    readOnly
                                />
                            </div>
                        )}
                    </div>

                    {/* Descripción */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Descripción (opcional)</label>
                        <textarea
                            value={vm.form.descripcion}
                            onChange={(e) => vm.setFormField('descripcion', e.target.value)}
                            rows={2}
                            placeholder="Notas adicionales..."
                            className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-[#0A0D14] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/40 resize-none"
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 dark:border-slate-800">
                    <button onClick={() => vm.setShowModal(false)} className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-slate-800 rounded-xl hover:bg-gray-200 transition-colors">
                        Cancelar
                    </button>
                    <button
                        onClick={vm.guardarGasto}
                        disabled={vm.guardando}
                        className="px-5 py-2 text-sm font-bold text-white bg-violet-600 rounded-xl hover:bg-violet-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {vm.guardando && <Icon icon="eos-icons:loading" width={16} />}
                        {vm.editingId ? 'Actualizar' : 'Registrar'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Modal Ingreso ─────────────────────────────────────────────────────────────

function ModalIngreso({ vm }: { vm: ReturnType<typeof useSistemaFinanzasViewModel> }) {
    if (!vm.showModalIngreso) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => vm.setShowModalIngreso(false)} />
            <div className="relative bg-white dark:bg-[#111827] rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Icon icon="solar:wallet-money-bold-duotone" width={20} className="text-emerald-500" />
                        {vm.editingIdIngreso ? 'Editar ingreso' : 'Registrar ingreso'}
                    </h3>
                    <button onClick={() => vm.setShowModalIngreso(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400">
                        <Icon icon="solar:close-bold" width={18} />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    {/* Concepto */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Concepto *</label>
                        <input
                            type="text"
                            value={vm.formIngreso.concepto}
                            onChange={(e) => vm.setFormIngresoField('concepto', e.target.value)}
                            placeholder="ej. Pago mensualidad Empresa X, Activación plan Pro..."
                            className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-[#0A0D14] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                        />
                    </div>

                    {/* Tipo + Monto */}
                    <div className="grid grid-cols-2 gap-3">
                        <Select
                            label="Tipo *"
                            name="tipo"
                            options={CATEGORIAS_INGRESO.map((c) => ({ id: c.value, value: c.label }))}
                            value={CATEGORIAS_INGRESO.find((c) => c.value === vm.formIngreso.tipo)?.label ?? ''}
                            onChange={(id: any) => vm.setFormIngresoField('tipo', id)}
                            error=""
                            readOnly
                        />
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Monto (S/) *</label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={vm.formIngreso.monto}
                                onChange={(e) => vm.setFormIngresoField('monto', e.target.value)}
                                placeholder="0.00"
                                className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-[#0A0D14] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                            />
                        </div>
                    </div>

                    {/* Fecha */}
                    <Calendar
                        text="Fecha *"
                        name="fechaIngreso"
                        value={toDisplay(vm.formIngreso.fecha)}
                        onChange={(v: string) => vm.setFormIngresoField('fecha', toISO(v))}
                    />

                    {/* Descripción */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Descripción (opcional)</label>
                        <textarea
                            value={vm.formIngreso.descripcion}
                            onChange={(e) => vm.setFormIngresoField('descripcion', e.target.value)}
                            rows={2}
                            placeholder="Notas adicionales..."
                            className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-[#0A0D14] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 resize-none"
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 dark:border-slate-800">
                    <button onClick={() => vm.setShowModalIngreso(false)} className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-slate-800 rounded-xl hover:bg-gray-200 transition-colors">
                        Cancelar
                    </button>
                    <button
                        onClick={vm.guardarIngreso}
                        disabled={vm.guardando}
                        className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {vm.guardando && <Icon icon="eos-icons:loading" width={16} />}
                        {vm.editingIdIngreso ? 'Actualizar' : 'Registrar'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Tab: Dashboard ─────────────────────────────────────────────────────────────

function TabDashboard({ vm }: { vm: ReturnType<typeof useSistemaFinanzasViewModel> }) {
    const d = vm.dashboard;
    if (vm.loadingDash || !d) {
        return (
            <div className="flex items-center justify-center h-64">
                <Icon icon="eos-icons:loading" className="w-10 h-10 text-violet-500" />
            </div>
        );
    }

    const pieData = (d.distribucionPlanes ?? []).map((p: any) => ({ name: p.nombre, value: p.count }));
    const COLORS = ['#7C3AED', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

    const gananciaPositiva = d.gananciaNetaMes >= 0;

    return (
        <div className="space-y-6">
            {/* KPIs row 1 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                    label="MRR (Ingreso Mensual Recurrente)"
                    value={fmt(d.mrr)}
                    sub={`ARR: ${fmt(d.arr)}`}
                    icon="solar:chart-2-bold-duotone"
                    color="#7C3AED"
                />
                <KpiCard
                    label="Ingresos este mes"
                    value={fmt(d.ingMes)}
                    sub={`Año: ${fmt(d.ingAnio)}`}
                    icon="solar:wallet-money-bold-duotone"
                    color="#10B981"
                    trend={d.ingMes > 0 ? ((d.ingMes - d.mrr) / d.mrr) * 100 : undefined}
                    trendLabel="vs MRR objetivo"
                />
                <KpiCard
                    label="Gastos este mes"
                    value={fmt(d.gastMes)}
                    sub={`Año: ${fmt(d.gastAnio)}`}
                    icon="solar:card-bold-duotone"
                    color="#EF4444"
                />
                <KpiCard
                    label="Ganancia neta"
                    value={fmt(d.gananciaNetaMes)}
                    sub={`Margen: ${pct(d.margenMes)}`}
                    icon={gananciaPositiva ? 'solar:arrow-up-bold-duotone' : 'solar:arrow-down-bold-duotone'}
                    color={gananciaPositiva ? '#10B981' : '#EF4444'}
                />
            </div>

            {/* KPIs row 2 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                    label="Empresas activas"
                    value={String(d.totalActivos ?? 0)}
                    sub={`${d.totalInactivos ?? 0} inactivas`}
                    icon="solar:buildings-2-bold-duotone"
                    color="#3B82F6"
                />
                <KpiCard
                    label="Nuevas este mes"
                    value={String(d.nuevosEsteMes ?? 0)}
                    sub={`Mes anterior: ${d.nuevosMesAnterior ?? 0}`}
                    icon="solar:user-plus-bold-duotone"
                    color="#10B981"
                    trend={d.crecimientoClientes}
                    trendLabel="vs mes ant."
                />
                <KpiCard
                    label="Vencen en 7 días"
                    value={String(d.proximasVencer ?? 0)}
                    sub="Requieren renovación"
                    icon="solar:calendar-bold-duotone"
                    color="#F59E0B"
                />
                <KpiCard
                    label="Cobros fallidos"
                    value={String(d.rechazadosMes?.count ?? 0)}
                    sub={fmt(d.rechazadosMes?.monto ?? 0)}
                    icon="solar:close-circle-bold-duotone"
                    color="#EF4444"
                />
            </div>

            {/* Charts row */}
            <div className="grid lg:grid-cols-3 gap-5">
                {/* Area chart ingresos vs gastos */}
                <div className="lg:col-span-2 bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-slate-800 p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-gray-800 dark:text-white">Ingresos vs Gastos</h3>
                        <div className="flex gap-1">
                            {[6, 12].map((m) => (
                                <button
                                    key={m}
                                    onClick={() => vm.setMesesTendencia(m)}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${vm.mesesTendencia === m ? 'bg-violet-600 text-white' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'}`}
                                >
                                    {m}M
                                </button>
                            ))}
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={240}>
                        <AreaChart data={vm.tendencia} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                            <defs>
                                <linearGradient id="gIng" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="gGas" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                            <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={(v) => `S/${(v / 1000).toFixed(0)}k`} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ fontSize: 12 }} />
                            <Area type="monotone" dataKey="ingresos" name="Ingresos" stroke="#7C3AED" strokeWidth={2.5} fill="url(#gIng)" />
                            <Area type="monotone" dataKey="gastos" name="Gastos" stroke="#EF4444" strokeWidth={2} strokeDasharray="4 3" fill="url(#gGas)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Pie distribución planes */}
                <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-slate-800 p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-4">Clientes por plan</h3>
                    {pieData.length > 0 ? (
                        <>
                            <ResponsiveContainer width="100%" height={160}>
                                <PieChart>
                                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3} dataKey="value">
                                        {pieData.map((_: any, i: number) => (
                                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(v: number) => [`${v} empresas`, '']} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="space-y-1.5 mt-2">
                                {pieData.map((p: any, i: number) => (
                                    <div key={p.name} className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                        <span className="text-xs text-gray-600 dark:text-gray-400 flex-1 truncate">{p.name}</span>
                                        <span className="text-xs font-bold text-gray-900 dark:text-white">{p.value}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-40 text-gray-400 text-sm">Sin datos</div>
                    )}
                </div>
            </div>

            {/* Ganancia neta mensual bar */}
            <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-slate-800 p-5 shadow-sm">
                <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-4">Ganancia neta mensual</h3>
                <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={vm.tendencia} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                        <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={(v) => `S/${(v / 1000).toFixed(0)}k`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="ganancia" name="Ganancia" radius={[6, 6, 0, 0]}>
                            {vm.tendencia.map((entry: any, i: number) => (
                                <Cell key={i} fill={entry.ganancia >= 0 ? '#10B981' : '#EF4444'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

// ── Tab: Gastos ────────────────────────────────────────────────────────────────

function TabGastos({ vm }: { vm: ReturnType<typeof useSistemaFinanzasViewModel> }) {
    // Group gastos por categoría para resumen
    const resumenCat = CATEGORIAS_GASTO.map((c) => ({
        ...c,
        total: vm.gastos.filter((g) => g.categoria === c.value).reduce((s: number, g: any) => s + Number(g.monto), 0),
        count: vm.gastos.filter((g) => g.categoria === c.value).length,
    })).filter((c) => c.count > 0);

    return (
        <div className="space-y-5">
            {/* Filtros + botón nuevo */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <div className="flex items-center gap-2 flex-1 flex-wrap">
                    <div className="w-40">
                        <Calendar
                            text="Desde"
                            name="filtroDesde"
                            value={toDisplay(vm.filtroDesde)}
                            onChange={(v: string) => vm.setFiltroDesde(toISO(v))}
                        />
                    </div>
                    <span className="text-gray-400 text-sm">—</span>
                    <div className="w-40">
                        <Calendar
                            text="Hasta"
                            name="filtroHasta"
                            value={toDisplay(vm.filtroHasta)}
                            onChange={(v: string) => vm.setFiltroHasta(toISO(v))}
                        />
                    </div>
                    <div className="w-56">
                        <Select
                            label="Categoría"
                            name="filtroCategoria"
                            options={[{ id: '', value: 'Todas las categorías' }, ...CATEGORIAS_GASTO.map((c) => ({ id: c.value, value: c.label }))]}
                            value={vm.filtroCategoria ? (CATEGORIAS_GASTO.find((c) => c.value === vm.filtroCategoria)?.label ?? '') : 'Todas las categorías'}
                            onChange={(id: any) => vm.setFiltroCategoria(id)}
                            error=""
                            readOnly
                        />
                    </div>
                    <button onClick={vm.cargarGastos} className="p-2 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-500 transition-colors">
                        <Icon icon="solar:refresh-bold" width={16} />
                    </button>
                </div>
                <button
                    onClick={vm.abrirNuevo}
                    className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-bold shadow-md shadow-violet-200 transition-colors flex-shrink-0"
                >
                    <Icon icon="solar:add-circle-bold" width={18} />
                    Registrar gasto
                </button>
            </div>

            {/* Resumen por categoría */}
            {resumenCat.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {resumenCat.map((c) => (
                        <div key={c.value} className="bg-white dark:bg-[#111827] rounded-xl border border-gray-100 dark:border-slate-800 p-3 text-center">
                            <div className="w-8 h-8 rounded-lg mx-auto mb-2 flex items-center justify-center" style={{ backgroundColor: c.color + '20' }}>
                                <Icon icon={c.icon} width={18} style={{ color: c.color }} />
                            </div>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium truncate">{c.label}</p>
                            <p className="text-sm font-black text-gray-900 dark:text-white">{fmt(c.total)}</p>
                            <p className="text-[10px] text-gray-400">{c.count} gastos</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Total */}
            <div className="flex items-center justify-between px-4 py-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800/40">
                <span className="text-sm font-bold text-red-700 dark:text-red-400 flex items-center gap-2">
                    <Icon icon="solar:card-bold-duotone" width={18} />
                    Total gastos filtrados
                </span>
                <span className="text-lg font-black text-red-700 dark:text-red-400">{fmt(vm.totalGastos)}</span>
            </div>

            {/* Tabla */}
            <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-slate-800 overflow-hidden shadow-sm">
                {vm.loadingGastos ? (
                    <div className="flex items-center justify-center h-40">
                        <Icon icon="eos-icons:loading" className="w-8 h-8 text-violet-500" />
                    </div>
                ) : vm.gastos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                        <Icon icon="solar:card-search-bold-duotone" width={48} className="mb-3 opacity-40" />
                        <p className="text-base font-semibold">No hay gastos registrados</p>
                        <p className="text-sm mt-1">Registra el primer gasto del sistema</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 dark:border-slate-800 bg-gray-50/60 dark:bg-slate-900/30">
                                    <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Fecha</th>
                                    <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Concepto</th>
                                    <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Categoría</th>
                                    <th className="text-right px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Monto</th>
                                    <th className="text-center px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Recurrente</th>
                                    <th className="px-5 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                                {vm.gastos.map((g) => {
                                    const cat = catInfo(g.categoria);
                                    return (
                                        <tr key={g.id} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/40 transition-colors">
                                            <td className="px-5 py-3.5 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                                {new Date(g.fecha).toLocaleDateString('es-PE')}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <p className="font-semibold text-gray-900 dark:text-white">{g.concepto}</p>
                                                {g.descripcion && <p className="text-xs text-gray-400 mt-0.5">{g.descripcion}</p>}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: cat.color + '18', color: cat.color }}>
                                                    <Icon icon={cat.icon} width={12} />
                                                    {cat.label}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-right font-bold text-red-600 dark:text-red-400 whitespace-nowrap">
                                                {fmt(g.monto)}
                                            </td>
                                            <td className="px-5 py-3.5 text-center">
                                                {g.recurrente ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">
                                                        <Icon icon="solar:refresh-circle-bold" width={12} />
                                                        {g.periodicidad ?? 'Mensual'}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-gray-300 dark:text-gray-600">—</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-1 justify-end">
                                                    <button onClick={() => vm.abrirEditar(g)} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500 transition-colors">
                                                        <Icon icon="solar:pen-bold" width={15} />
                                                    </button>
                                                    <button onClick={() => vm.eliminarGasto(g.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors">
                                                        <Icon icon="solar:trash-bin-trash-bold" width={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Tab: Ingresos ─────────────────────────────────────────────────────────────

function TabIngresos({ vm }: { vm: ReturnType<typeof useSistemaFinanzasViewModel> }) {
    const resumenTipo = CATEGORIAS_INGRESO.map((c) => ({
        ...c,
        total: vm.ingresos.filter((i) => i.tipo === c.value).reduce((s: number, i: any) => s + Number(i.monto), 0),
        count: vm.ingresos.filter((i) => i.tipo === c.value).length,
    })).filter((c) => c.count > 0);

    const balance = vm.totalIngresos - vm.totalGastos;

    return (
        <div className="space-y-5">
            {/* Filtros + botón nuevo */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <div className="flex items-center gap-2 flex-1 flex-wrap">
                    <div className="w-40">
                        <Calendar
                            text="Desde"
                            name="filtroDesdeIng"
                            value={toDisplay(vm.filtroDesdeIngreso)}
                            onChange={(v: string) => vm.setFiltroDesdeIngreso(toISO(v))}
                        />
                    </div>
                    <span className="text-gray-400 text-sm">—</span>
                    <div className="w-40">
                        <Calendar
                            text="Hasta"
                            name="filtroHastaIng"
                            value={toDisplay(vm.filtroHastaIngreso)}
                            onChange={(v: string) => vm.setFiltroHastaIngreso(toISO(v))}
                        />
                    </div>
                    <div className="w-56">
                        <Select
                            label="Tipo"
                            name="filtroTipo"
                            options={[{ id: '', value: 'Todos los tipos' }, ...CATEGORIAS_INGRESO.map((c) => ({ id: c.value, value: c.label }))]}
                            value={vm.filtroTipoIngreso ? (CATEGORIAS_INGRESO.find((c) => c.value === vm.filtroTipoIngreso)?.label ?? '') : 'Todos los tipos'}
                            onChange={(id: any) => vm.setFiltroTipoIngreso(id)}
                            error=""
                            readOnly
                        />
                    </div>
                    <button onClick={vm.cargarIngresos} className="p-2 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-500 transition-colors">
                        <Icon icon="solar:refresh-bold" width={16} />
                    </button>
                </div>
                <button
                    onClick={vm.abrirNuevoIngreso}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-200 transition-colors flex-shrink-0"
                >
                    <Icon icon="solar:add-circle-bold" width={18} />
                    Registrar ingreso
                </button>
            </div>

            {/* Resumen por tipo */}
            {resumenTipo.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {resumenTipo.map((c) => (
                        <div key={c.value} className="bg-white dark:bg-[#111827] rounded-xl border border-gray-100 dark:border-slate-800 p-3 text-center">
                            <div className="w-8 h-8 rounded-lg mx-auto mb-2 flex items-center justify-center" style={{ backgroundColor: c.color + '20' }}>
                                <Icon icon={c.icon} width={18} style={{ color: c.color }} />
                            </div>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium truncate">{c.label}</p>
                            <p className="text-sm font-black text-gray-900 dark:text-white">{fmt(c.total)}</p>
                            <p className="text-[10px] text-gray-400">{c.count} ingreso{c.count !== 1 ? 's' : ''}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Totales + balance */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex items-center justify-between px-4 py-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800/40">
                    <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                        <Icon icon="solar:wallet-money-bold-duotone" width={18} />
                        Total ingresos
                    </span>
                    <span className="text-lg font-black text-emerald-700 dark:text-emerald-400">{fmt(vm.totalIngresos)}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800/40">
                    <span className="text-sm font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                        <Icon icon="solar:card-bold-duotone" width={18} />
                        Total gastos
                    </span>
                    <span className="text-lg font-black text-red-600 dark:text-red-400">{fmt(vm.totalGastos)}</span>
                </div>
                <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${balance >= 0 ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800/40' : 'bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-800/40'}`}>
                    <span className={`text-sm font-bold flex items-center gap-2 ${balance >= 0 ? 'text-blue-700 dark:text-blue-400' : 'text-orange-700 dark:text-orange-400'}`}>
                        <Icon icon={balance >= 0 ? 'solar:graph-up-bold-duotone' : 'solar:graph-down-bold-duotone'} width={18} />
                        Balance neto
                    </span>
                    <span className={`text-lg font-black ${balance >= 0 ? 'text-blue-700 dark:text-blue-400' : 'text-orange-700 dark:text-orange-400'}`}>{fmt(balance)}</span>
                </div>
            </div>

            {/* Tabla */}
            <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-slate-800 overflow-hidden shadow-sm">
                {vm.loadingIngresos ? (
                    <div className="flex items-center justify-center h-40">
                        <Icon icon="eos-icons:loading" className="w-8 h-8 text-emerald-500" />
                    </div>
                ) : vm.ingresos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                        <Icon icon="solar:wallet-money-bold-duotone" width={48} className="mb-3 opacity-40" />
                        <p className="text-base font-semibold">No hay ingresos registrados</p>
                        <p className="text-sm mt-1">Registra el primer ingreso de caja del sistema</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 dark:border-slate-800 bg-gray-50/60 dark:bg-slate-900/30">
                                    <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Fecha</th>
                                    <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Concepto</th>
                                    <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Tipo</th>
                                    <th className="text-right px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Monto</th>
                                    <th className="px-5 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                                {vm.ingresos.map((ing) => {
                                    const tipo = tipoInfo(ing.tipo);
                                    return (
                                        <tr key={ing.id} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/40 transition-colors">
                                            <td className="px-5 py-3.5 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                                {new Date(ing.fecha).toLocaleDateString('es-PE')}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <p className="font-semibold text-gray-900 dark:text-white">{ing.concepto}</p>
                                                {ing.descripcion && <p className="text-xs text-gray-400 mt-0.5">{ing.descripcion}</p>}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: tipo.color + '18', color: tipo.color }}>
                                                    <Icon icon={tipo.icon} width={12} />
                                                    {tipo.label}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-right font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                                                {fmt(ing.monto)}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-1 justify-end">
                                                    <button onClick={() => vm.abrirEditarIngreso(ing)} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500 transition-colors">
                                                        <Icon icon="solar:pen-bold" width={15} />
                                                    </button>
                                                    <button onClick={() => vm.eliminarIngreso(ing.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors">
                                                        <Icon icon="solar:trash-bin-trash-bold" width={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Tab: Clientes ──────────────────────────────────────────────────────────────

function TabClientes({ vm }: { vm: ReturnType<typeof useSistemaFinanzasViewModel> }) {
    if (vm.loadingDash || !vm.dashboard) {
        return <div className="flex items-center justify-center h-64"><Icon icon="eos-icons:loading" className="w-10 h-10 text-violet-500" /></div>;
    }

    const hoy = new Date();
    const en7Dias = new Date(); en7Dias.setDate(en7Dias.getDate() + 7);

    return (
        <div className="space-y-6">
            {/* KPIs clientes */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard label="Empresas activas" value={String(vm.dashboard.totalActivos ?? 0)} icon="solar:buildings-2-bold-duotone" color="#3B82F6" />
                <KpiCard label="Inactivas / Churn" value={String(vm.dashboard.totalInactivos ?? 0)} icon="solar:user-minus-bold-duotone" color="#EF4444" />
                <KpiCard label="Nuevas este mes" value={String(vm.dashboard.nuevosEsteMes ?? 0)} trend={vm.dashboard.crecimientoClientes} trendLabel="vs mes ant." icon="solar:user-plus-bold-duotone" color="#10B981" />
                <KpiCard label="Vencen en 7 días" value={String(vm.dashboard.proximasVencer ?? 0)} sub="Requieren renovación" icon="solar:calendar-bold-duotone" color="#F59E0B" />
            </div>

            {/* Buscador + lista de empresas */}
            <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-slate-800">
                    <h3 className="text-sm font-bold text-gray-800 dark:text-white flex-1">
                        Empresas activas
                        <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold dark:bg-blue-900/30 dark:text-blue-400">
                            {vm.empresasFiltradas.length}
                        </span>
                    </h3>
                    <div className="relative w-64">
                        <Icon icon="solar:magnifer-linear" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Buscar Falconext, Krezka..."
                            value={vm.busquedaEmpresa}
                            onChange={(e) => vm.setBusquedaEmpresa(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-[#0A0D14] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                        />
                    </div>
                </div>

                {vm.empresasFiltradas.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-14 text-gray-400">
                        <Icon icon="solar:buildings-2-bold-duotone" width={40} className="mb-2 opacity-30" />
                        <p className="text-sm font-semibold">{vm.busquedaEmpresa ? 'Sin resultados' : 'No hay empresas activas'}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50/70 dark:bg-slate-900/30 border-b border-gray-100 dark:border-slate-800">
                                    <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Empresa</th>
                                    <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">RUC</th>
                                    <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Plan</th>
                                    <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Admin principal</th>
                                    <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Vence</th>
                                    <th className="text-right px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">S/ mensual</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-slate-800/60">
                                {vm.empresasFiltradas.map((e: any) => {
                                    const exp = e.fechaExpiracion ? new Date(e.fechaExpiracion) : null;
                                    const venceProximo = exp && exp <= en7Dias && exp >= hoy;
                                    const vencido = exp && exp < hoy;
                                    return (
                                        <tr key={e.id} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/40 transition-colors">
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-2.5">
                                                    {e.logo ? (
                                                        <img src={e.logo} alt="" className="w-8 h-8 rounded-lg object-contain border border-gray-100" />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white text-xs font-black">
                                                            {(e.nombre ?? '?')[0].toUpperCase()}
                                                        </div>
                                                    )}
                                                    <span className="font-semibold text-gray-900 dark:text-white">{e.nombre}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400 font-mono text-xs">{e.ruc}</td>
                                            <td className="px-5 py-3.5">
                                                <span className="px-2.5 py-1 rounded-full bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 text-xs font-semibold">
                                                    {e.plan}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                {e.adminEmail ? (
                                                    <div>
                                                        <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">{e.admin.split(' (')[0]}</p>
                                                        <p className="text-xs text-gray-400">{e.adminEmail}</p>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                                        <Icon icon="solar:danger-triangle-bold" width={12} />
                                                        Sin admin asignado
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                {exp ? (
                                                    <span className={`text-xs font-semibold ${vencido ? 'text-red-600 dark:text-red-400' : venceProximo ? 'text-amber-600 dark:text-amber-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                                        {vencido && <Icon icon="solar:close-circle-bold" className="inline mr-1" width={12} />}
                                                        {venceProximo && <Icon icon="solar:danger-triangle-bold" className="inline mr-1" width={12} />}
                                                        {exp.toLocaleDateString('es-PE')}
                                                    </span>
                                                ) : <span className="text-xs text-gray-300">—</span>}
                                            </td>
                                            <td className="px-5 py-3.5 text-right font-bold text-gray-900 dark:text-white">
                                                {fmt(e.costoMensual)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Chart nuevos vs bajas */}
            <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-slate-800 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-gray-800 dark:text-white">Adquisición vs Bajas (histórico)</h3>
                    <div className="flex gap-1">
                        {[6, 12].map((m) => (
                            <button key={m} onClick={() => vm.setMesesTendencia(m)} className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${vm.mesesTendencia === m ? 'bg-violet-600 text-white' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'}`}>{m}M</button>
                        ))}
                    </div>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={vm.tendencia} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                        <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Bar dataKey="nuevosClientes" name="Nuevas empresas" fill="#10B981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="bajasClientes" name="Bajas" fill="#EF4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

// ── Página principal ───────────────────────────────────────────────────────────

const TABS = [
    { key: 'dashboard', label: 'Dashboard', icon: 'solar:chart-2-bold-duotone' },
    { key: 'gastos', label: 'Gastos', icon: 'solar:card-bold-duotone' },
    { key: 'ingresos', label: 'Ingresos', icon: 'solar:wallet-money-bold-duotone' },
    { key: 'clientes', label: 'Clientes', icon: 'solar:buildings-2-bold-duotone' },
] as const;

export default function SistemaFinanzas() {
    const vm = useSistemaFinanzasViewModel();

    return (
        <div className="min-h-screen pb-10">
            {/* Header */}
            <div className="flex items-start gap-4 mb-7">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center shadow-lg shadow-violet-500/25 flex-shrink-0">
                    <Icon icon="solar:chart-square-bold-duotone" className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Finanzas del Sistema</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Panel financiero exclusivo para los socios — ingresos, gastos, caja y crecimiento de clientes</p>
                </div>
                <button
                    onClick={() => vm.cargarGastos()}
                    className="p-2.5 rounded-xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-slate-700 text-gray-400 hover:text-gray-600 shadow-sm transition-colors"
                    title="Actualizar"
                >
                    <Icon icon="solar:refresh-bold" width={18} />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 bg-white dark:bg-[#111827] p-1 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm w-fit">
                {TABS.map((t) => (
                    <button
                        key={t.key}
                        onClick={() => vm.setTab(t.key)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${vm.tab === t.key
                            ? 'bg-violet-600 text-white shadow-md shadow-violet-500/25'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800'
                            }`}
                    >
                        <Icon icon={t.icon} width={17} />
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            {vm.tab === 'dashboard' && <TabDashboard vm={vm} />}
            {vm.tab === 'gastos' && <TabGastos vm={vm} />}
            {vm.tab === 'ingresos' && <TabIngresos vm={vm} />}
            {vm.tab === 'clientes' && <TabClientes vm={vm} />}

            {/* Modals */}
            <ModalGasto vm={vm} />
            <ModalIngreso vm={vm} />
        </div>
    );
}
