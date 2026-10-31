import { useState } from 'react';
import { useCombosViewModel } from '@/features/admin/tienda/useCombosViewModel';
import { Icon } from '@iconify/react';
import InputPro from '@/components/InputPro';
import { Calendar } from '@/components/Date';
import { aIso, aDiaMesAnio } from './combosFechas';
import PacksMasVendidos from '@/features/admin/tienda/PacksMasVendidos';
import Select from '@/components/Select';
import {
  InventoryCard,
  InventoryEmptyState,
  InventoryHero,
  InventoryInfoPill,
  InventoryPage,
  InventorySearchBox,
  InventoryToolbar,
  InventoryToolbarButton,
} from '@/features/admin/kardex/shared/InventoryChrome';

export default function CombosAdmin() {
  const vm = useCombosViewModel();
  const { t } = vm;
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'TODOS' | 'ACTIVOS' | 'INACTIVOS'>('TODOS');

  const filteredCombos = vm.combos.filter((combo) => {
    const matchesSearch = !search.trim()
      || combo.nombre.toLowerCase().includes(search.toLowerCase())
      || String(combo.descripcion || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = status === 'TODOS'
      || (status === 'ACTIVOS' ? combo.activo : !combo.activo);
    return matchesSearch && matchesStatus;
  });

  if (vm.loading) return <div className="flex items-center justify-center h-64"><Icon icon="eos-icons:loading" className="w-12 h-12 text-gray-400" /></div>;

  return (
    <InventoryPage>
      <InventoryHero
        icon="solar:bag-smile-bold-duotone"
        title="Kits y packs"
        subtitle="Organiza tus combos comerciales con una vista más limpia, visual y alineada al resto del panel."
        badge="Promos"
        actions={
          <>
            <InventoryToolbarButton
              icon="solar:refresh-linear"
              label="Actualizar"
              onClick={() => vm.refreshCombos()}
            />
            <InventoryToolbarButton
              icon="solar:add-circle-bold"
              label="Nuevo kit"
              onClick={() => vm.abrirModal()}
              tone="primary"
            />
          </>
        }
      />

      <PacksMasVendidos />

      <InventoryCard>
        <InventoryToolbar>
          <div className="flex flex-wrap items-center gap-3">
            <InventoryInfoPill
              icon="solar:box-linear"
              label={`${filteredCombos.length} kits`}
            />
            <div className="flex flex-wrap gap-2">
              {(['TODOS', 'ACTIVOS', 'INACTIVOS'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setStatus(option)}
                  className={`inline-flex h-11 items-center rounded-2xl border px-4 text-sm font-black transition-all ${
                    status === option
                      ? 'border-[#d5d0ff] bg-[#f3f1ff] text-[#6A5AF9] dark:border-indigo-800/60 dark:bg-indigo-950/50 dark:text-indigo-300'
                      : 'border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300'
                  }`}
                >
                  {option === 'TODOS' ? 'Todos' : option === 'ACTIVOS' ? 'Activos' : 'Inactivos'}
                </button>
              ))}
            </div>
          </div>
          <InventorySearchBox
            value={search}
            onChange={setSearch}
            placeholder="Buscar kit, promo o descripción..."
            className="w-full sm:max-w-md"
            bordered={false}
          />
        </InventoryToolbar>

        <div className="p-5">
      {filteredCombos.length === 0 ? (
        <InventoryEmptyState
          icon="solar:bag-smile-bold-duotone"
          title={vm.combos.length === 0 ? 'No hay kits creados' : 'No hay resultados para esos filtros'}
          subtitle={vm.combos.length === 0 ? 'Crea tu primer kit para empezar a ofrecer promociones y packs.' : 'Prueba con otro término de búsqueda o cambia el estado seleccionado.'}
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredCombos.map((combo) => {
            const precioRegular = Number(combo.precioRegular);
            const precioCombo = Number(combo.precioCombo);
            const ahorro = Math.max(0, precioRegular - precioCombo);
            const descuentoPct = precioRegular > 0 ? Math.round((ahorro / precioRegular) * 100) : 0;
            return (
            <div
              key={combo.id}
              className={`group relative flex flex-col overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_20px_55px_-30px_rgba(15,23,42,0.35)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_35px_80px_-30px_rgba(106,90,249,0.4)] dark:border-slate-800 dark:bg-[#111827] ${!combo.activo ? 'opacity-60 saturate-50' : ''}`}
            >
              {/* Vitrina del logo/imagen: una placa-marco de tamaño fijo (no la imagen suelta)
                  ocupa el espacio de forma consistente sin importar si la imagen es un logo
                  ancho o un póster vertical — antes, limitar solo por alto dejaba las imágenes
                  angostas "perdidas" en medio de espacio vacío. */}
              <div className="relative h-48 shrink-0 overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/70 dark:to-slate-900">
                <div
                  className="absolute inset-0 opacity-70 dark:opacity-[0.08]"
                  style={{
                    backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)',
                    backgroundSize: '18px 18px',
                    color: 'rgb(203 213 225)',
                  }}
                />
                <div className="relative flex h-full items-center justify-center p-5">
                  {combo.imagenUrl ? (
                    <div className="flex h-full max-h-32 w-full max-w-[88%] items-center justify-center rounded-2xl border border-white/70 bg-white/95 p-3 shadow-[0_16px_36px_-16px_rgba(15,23,42,0.35)] dark:border-slate-700/70 dark:bg-slate-900/85">
                      <img
                        src={combo.imagenUrl}
                        alt={combo.nombre}
                        className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-[1.05]"
                      />
                    </div>
                  ) : (
                    <Icon icon="solar:bag-smile-bold-duotone" className="h-16 w-16 text-slate-300 dark:text-white/15" />
                  )}
                </div>

                <div className="absolute left-3 top-3">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider shadow-sm backdrop-blur-md ${combo.activo ? 'bg-emerald-500/90 text-white' : 'bg-slate-500/90 text-white'}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${combo.activo ? 'bg-white' : 'bg-white/70'}`} />
                    {combo.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                {descuentoPct > 0 && (
                  <div className="absolute right-3 top-3">
                    <span className="inline-flex items-center rounded-full bg-slate-900/90 px-2.5 py-1 text-[10px] font-black tracking-wide text-white shadow-sm backdrop-blur-md dark:bg-white/10">
                      -{descuentoPct}%
                    </span>
                  </div>
                )}
              </div>

              {/* Panel de precio elevado, superpuesto a la vitrina — el punto focal de la tarjeta */}
              <div className="relative z-10 mx-5 -mt-6 rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_18px_40px_-20px_rgba(15,23,42,0.25)] dark:border-slate-700/80 dark:bg-slate-800">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    {precioRegular > precioCombo && (
                      <p className="text-xs font-semibold text-slate-400 line-through dark:text-slate-500">S/ {precioRegular.toFixed(2)}</p>
                    )}
                    <p className={`text-2xl font-black tracking-tight tabular-nums ${t.text}`}>S/ {precioCombo.toFixed(2)}</p>
                  </div>
                  {ahorro > 0 && (
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Ahorras</p>
                      <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">S/ {ahorro.toFixed(2)}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-1 flex-col p-5 pt-4">
                <h3 className="text-[17px] font-extrabold tracking-tight text-slate-900 dark:text-white">{combo.nombre}</h3>
                <p className="mt-1 mb-4 line-clamp-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{combo.descripcion || 'Sin descripción'}</p>

                <div className="mt-auto flex gap-2">
                  <button onClick={() => vm.toggleComboActivo(combo)} className={`flex-1 rounded-2xl py-2.5 text-sm font-bold transition-all ${combo.activo ? 'border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700' : 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800/50 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50'}`}>{combo.activo ? 'Desactivar' : 'Activar'}</button>
                  <button onClick={() => vm.abrirModal(combo)} className={`rounded-2xl border p-2.5 transition-all hover:-translate-y-0.5 ${t.soft} border-transparent hover:shadow-sm dark:border-indigo-800/50 dark:bg-indigo-900/30 dark:text-indigo-400`}><Icon icon="solar:pen-bold" width={18} /></button>
                  <button onClick={() => vm.handleEliminarCombo(combo.id)} className="rounded-2xl border border-red-200 bg-red-50 p-2.5 text-red-600 transition-all hover:-translate-y-0.5 hover:bg-red-100 hover:shadow-sm dark:border-red-800/50 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"><Icon icon="solar:trash-bin-trash-bold" width={18} /></button>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}
        </div>
      </InventoryCard>

      {vm.showModal && (() => {
        const precioRegular = vm.calcularPrecioRegular();
        const precioPack = Number(vm.form.precioCombo) || 0;
        const descuento = vm.calcularDescuento();
        const { costo, sinCosto } = vm.calcularCosto();
        const ganancia = precioPack - costo;
        const margen = precioPack > 0 ? (ganancia / precioPack) * 100 : 0;
        const hayProductos = vm.form.items.some((i) => i.productoId);
        const conGanancia = costo > 0 && precioPack > 0;
        const perdida = conGanancia && ganancia < 0;
        const unidades = vm.form.items.reduce((s, i) => s + (Number(i.cantidad) || 0), 0);
        const soles = (n: number) => `S/ ${n.toFixed(2)}`;
        return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" onClick={vm.cerrarModal}>
          <div
            className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-[0_32px_80px_-24px_rgba(15,23,42,0.45)] dark:border-slate-800 dark:bg-[#0f1523]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Encabezado */}
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${t.bg} text-white shadow-lg shadow-indigo-500/20`}>
                  <Icon icon="solar:box-bold-duotone" width={22} />
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-bold text-slate-900 dark:text-white">{vm.editingCombo ? 'Editar kit' : 'Nuevo kit'}</h2>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {hayProductos ? `${vm.form.items.length} producto${vm.form.items.length === 1 ? '' : 's'} · ${unidades} unidad${unidades === 1 ? '' : 'es'}` : 'Junta productos y véndelos a un precio especial'}
                  </p>
                </div>
              </div>
              <button onClick={vm.cerrarModal} className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-white" aria-label="Cerrar"><Icon icon="mdi:close" width={22} /></button>
            </div>

            <div className="grid flex-1 overflow-y-auto lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
              {/* Columna izquierda: datos del kit */}
              <div className="space-y-5 border-slate-100 p-6 dark:border-slate-800 lg:border-r">
                <InputPro name="nombre" isLabel label="Nombre del kit *" value={vm.form.nombre} onChange={(e) => vm.setForm(prev => ({ ...prev, nombre: e.target.value }))} placeholder="Ej: Kit de cervezas" />
                <InputPro isLabel name="descripcion" label="Descripción" value={vm.form.descripcion} onChange={(e) => vm.setForm(prev => ({ ...prev, descripcion: e.target.value }))} placeholder="Lo que verá el cliente en la tienda" />

                <div>
                  <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Imagen</p>
                  {/* La imagen se contiene completa (nunca se recorta), sea un logo ancho o un póster vertical. */}
                  <div className="group relative flex h-44 w-full items-center justify-center overflow-hidden rounded-2xl border border-dashed border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/60">
                    {vm.form.imagenUrl ? (
                      <img src={vm.form.imagenUrl} alt="Imagen del kit" className="h-full w-full object-contain p-4" />
                    ) : (
                      <div className="flex flex-col items-center gap-2 px-6 text-center text-slate-400 dark:text-slate-500">
                        <Icon icon="solar:gallery-add-bold-duotone" width={34} />
                        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Sin imagen</p>
                        <p className="text-xs">{vm.editingCombo ? 'Una buena foto ayuda a vender el kit' : 'Primero crea el kit; luego podrás subir la imagen'}</p>
                      </div>
                    )}
                  </div>
                  {vm.editingCombo && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <input type="file" ref={vm.fileInputRef} className="hidden" accept="image/*" onChange={vm.onFileSelect} />
                      <button
                        type="button"
                        disabled={vm.uploading}
                        onClick={() => vm.fileInputRef.current?.click()}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        <Icon icon="solar:upload-minimalistic-bold" width={16} />{vm.uploading ? 'Subiendo...' : vm.form.imagenUrl ? 'Cambiar imagen' : 'Subir imagen'}
                      </button>
                      {vm.form.imagenUrl && (
                        <button type="button" onClick={() => vm.setForm(p => ({ ...p, imagenUrl: '' }))} className="rounded-xl px-3 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20">
                          Quitar
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="relative z-20">
                    <Calendar text="Desde (opcional)" value={aDiaMesAnio(vm.form.fechaInicio)} onChange={(date: string) => vm.setForm(prev => ({ ...prev, fechaInicio: aIso(date) }))} />
                  </div>
                  <div className="relative z-20">
                    <Calendar text="Hasta (opcional)" value={aDiaMesAnio(vm.form.fechaFin)} onChange={(date: string) => vm.setForm(prev => ({ ...prev, fechaFin: aIso(date) }))} right />
                  </div>
                </div>

                <label htmlFor="activo" className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-slate-100 px-4 py-3 dark:border-slate-800">
                  <span>
                    <span className="block text-sm font-semibold text-slate-800 dark:text-slate-200">Kit activo</span>
                    <span className="block text-xs text-slate-500 dark:text-slate-400">Se puede vender y se ve en la tienda</span>
                  </span>
                  <span className="relative inline-flex">
                    <input type="checkbox" id="activo" checked={vm.form.activo} onChange={(e) => vm.setForm(prev => ({ ...prev, activo: e.target.checked }))} className="peer sr-only" />
                    <span className={`h-6 w-11 rounded-full transition-colors ${vm.form.activo ? t.bg : 'bg-slate-200 dark:bg-slate-700'}`} />
                    <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${vm.form.activo ? 'translate-x-5' : ''}`} />
                  </span>
                </label>
              </div>

              {/* Columna derecha: productos y precio */}
              <div className="space-y-5 bg-slate-50/60 p-6 dark:bg-slate-900/30">
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Productos del kit *</p>
                    <button type="button" onClick={vm.agregarProducto} className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold ${t.text} transition-colors hover:bg-white dark:text-indigo-400 dark:hover:bg-slate-800`}>
                      <Icon icon="mdi:plus" width={18} /> Agregar
                    </button>
                  </div>
                  <div className="space-y-2">
                    {vm.form.items.map((item, index) => {
                      const prod: any = item.productoId ? vm.buscarEnCatalogo(item.productoId) : null;
                      const precio = Number(prod?.precioUnitario || 0);
                      const costoUnit = Number(prod?.costoUnitario ?? prod?.costoPromedio ?? 0);
                      return (
                        <div key={index} className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                          <div className="flex items-end gap-2">
                            <div className="min-w-0 flex-1">
                              <Select
                                label="Producto"
                                name={`producto-${index}`}
                                value={vm.getProductOptionLabel(item.productoId)}
                                options={vm.opcionesProducto.map((p: any) => ({ id: String(p.id), value: `${String(p.descripcion || '').toUpperCase()} - S/ ${Number(p.precioUnitario).toFixed(2)}` }))}
                                onChange={(id: string) => vm.actualizarItem(index, 'productoId', Number(id))}
                                placeholder="Buscar producto por nombre o código..."
                                error={undefined}
                                withLabel={index === 0}
                                isSearch
                                handleGetData={vm.buscarProductos}
                              />
                            </div>
                            <div className="w-20 shrink-0">
                              <InputPro name={`cantidad-${index}`} label="Cant." type="number" value={item.cantidad} onChange={(e) => vm.actualizarItem(index, 'cantidad', Number(e.target.value))} isLabel={index === 0} />
                            </div>
                            <button type="button" onClick={() => vm.eliminarItem(index)} className="mb-[2px] shrink-0 rounded-xl p-2.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20" aria-label="Quitar producto">
                              <Icon icon="solar:trash-bin-trash-bold" width={18} />
                            </button>
                          </div>
                          {prod && (
                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 pl-1 text-xs text-slate-500 dark:text-slate-400">
                              <span>Venta {soles(precio)} c/u</span>
                              <span className={costoUnit > 0 ? '' : 'text-amber-600 dark:text-amber-400'}>{costoUnit > 0 ? `Costo ${soles(costoUnit)} c/u` : 'Sin costo cargado'}</span>
                              <span className="ml-auto font-semibold text-slate-700 dark:text-slate-300">{soles(precio * (Number(item.cantidad) || 0))}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {vm.form.items.length === 0 && (
                      <button type="button" onClick={vm.agregarProducto} className="flex w-full flex-col items-center gap-1 rounded-2xl border-2 border-dashed border-slate-200 bg-white py-8 text-center text-sm text-slate-400 transition-colors hover:border-slate-300 hover:text-slate-500 dark:border-slate-800 dark:bg-slate-900">
                        <Icon icon="solar:add-square-bold-duotone" width={28} />
                        Agrega al menos 2 unidades: dos productos distintos o dos del mismo
                      </button>
                    )}
                  </div>
                </div>

                {/* Resumen de precio */}
                <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="grid grid-cols-2 divide-x divide-slate-100 dark:divide-slate-800">
                    <div className="p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Por separado</p>
                      <p className="mt-1 text-2xl font-bold text-slate-400 line-through decoration-slate-300 dark:text-slate-500">{soles(precioRegular)}</p>
                      <p className="mt-0.5 text-xs text-slate-400">Suma de precios de venta</p>
                    </div>
                    <div className="p-4">
                      <label htmlFor="precioCombo" className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Precio del kit *</label>
                      <div className="mt-1 flex items-baseline gap-1">
                        <span className="text-lg font-bold text-slate-400">S/</span>
                        <input
                          id="precioCombo"
                          type="number"
                          min={0}
                          step="0.10"
                          value={vm.form.precioCombo || ''}
                          onChange={(e) => vm.setForm(prev => ({ ...prev, precioCombo: Number(e.target.value) }))}
                          placeholder="0.00"
                          className="w-full min-w-0 border-0 border-b-2 border-slate-200 bg-transparent p-0 pb-0.5 text-2xl font-bold text-slate-900 outline-none focus:border-indigo-500 focus:ring-0 dark:border-slate-700 dark:text-white"
                        />
                      </div>
                      {precioPack > 0 && precioRegular > 0 && (
                        <span className={`mt-1.5 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${descuento > 0 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                          {descuento > 0 ? `Cliente ahorra ${soles(precioRegular - precioPack)} (${descuento.toFixed(0)}%)` : 'Debe ser menor al precio por separado'}
                        </span>
                      )}
                    </div>
                  </div>

                  {hayProductos && (
                    <div className="border-t border-slate-100 p-4 dark:border-slate-800">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">Te cuesta armarlo</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{soles(costo)}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">Tu ganancia por kit</span>
                        <span className={`text-base font-bold ${!conGanancia ? 'text-slate-400' : perdida ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {conGanancia ? `${soles(ganancia)} · ${margen.toFixed(1)}%` : '—'}
                        </span>
                      </div>
                      {conGanancia && (
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div
                            className={`h-full rounded-full transition-all ${perdida ? 'bg-red-500' : margen < 10 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min(100, Math.max(4, Math.abs(margen)))}%` }}
                          />
                        </div>
                      )}
                      {perdida && (
                        <p className="mt-3 flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700 dark:bg-red-900/20 dark:text-red-400">
                          <Icon icon="solar:danger-triangle-bold" width={18} className="mt-0.5 shrink-0" />
                          Vendes el kit por debajo de lo que te cuesta: pierdes {soles(Math.abs(ganancia))} en cada uno.
                        </p>
                      )}
                      {sinCosto.length > 0 && (
                        <p className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
                          <Icon icon="solar:info-circle-bold" width={16} className="mt-0.5 shrink-0" />
                          <span>Sin costo cargado: <b>{sinCosto.join(', ')}</b>. No se suma; cárgalo en el producto para ver la ganancia real.</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Pie */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-white px-6 py-4 dark:border-slate-800 dark:bg-[#0f1523]">
              <button onClick={vm.cerrarModal} className="rounded-xl px-5 py-2.5 font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">Cancelar</button>
              <button onClick={vm.guardarCombo} className={`flex items-center gap-2 rounded-xl ${t.bg} px-6 py-2.5 font-bold text-white shadow-lg shadow-indigo-500/20 transition-all ${t.hover} active:scale-95`}>
                <Icon icon="solar:diskette-bold" width={18} />{vm.editingCombo ? 'Guardar cambios' : 'Crear kit'}
              </button>
            </div>
          </div>
        </div>
        );
      })()}
    </InventoryPage>
  );
}
