import { useState } from 'react';
import { useCombosViewModel } from '@/features/admin/tienda/useCombosViewModel';
import { Icon } from '@iconify/react';
import InputPro from '@/components/InputPro';
import { Calendar } from '@/components/Date';
import Select from '@/components/Select';
import Button from '@/components/Button';
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

      {vm.showModal && (
        <div className="fixed inset-0 bg-black/60   z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border dark:border-slate-800">
            <div className="sticky top-0 bg-white/80 dark:bg-[#111827]/80 backdrop-blur-md border-b dark:border-slate-800 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold dark:text-white">{vm.editingCombo ? 'Editar Kit' : 'Nuevo Kit'}</h2>
              <button onClick={vm.cerrarModal} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-white"><Icon icon="mdi:close" width={24} /></button>
            </div>
            <div className="p-6 space-y-6">
              <InputPro name="nombre" isLabel label="Nombre del Kit *" value={vm.form.nombre} onChange={(e) => vm.setForm(prev => ({ ...prev, nombre: e.target.value }))} placeholder="Ej: Kit de Baño Completo" />
              <InputPro isLabel name="descripcion" label="Descripción" value={vm.form.descripcion} onChange={(e) => vm.setForm(prev => ({ ...prev, descripcion: e.target.value }))} placeholder="Descripción del kit..." />
              <div className="rounded-2xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/40">
                <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">Imagen del Kit</label>
                <div className="space-y-3">
                  {/* Misma placa con textura de puntos + marco blanco de las tarjetas del listado:
                      la imagen se contiene completa (nunca se recorta), sea un logo ancho o un póster vertical. */}
                  <div className="relative h-52 w-full overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/70 dark:to-slate-900">
                    <div
                      className="absolute inset-0 opacity-70 dark:opacity-[0.08]"
                      style={{
                        backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)',
                        backgroundSize: '18px 18px',
                        color: 'rgb(203 213 225)',
                      }}
                    />
                    <div className="relative flex h-full items-center justify-center p-5">
                      {vm.form.imagenUrl ? (
                        <div className="flex h-full max-h-36 w-full max-w-[85%] items-center justify-center rounded-2xl border border-white/70 bg-white/95 p-3 shadow-[0_16px_36px_-16px_rgba(15,23,42,0.35)] dark:border-slate-700/70 dark:bg-slate-900/85">
                          <img src={vm.form.imagenUrl} alt="Imagen del kit" className="h-full w-full object-contain" />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-slate-400 dark:text-slate-500">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-600">
                            <Icon icon="solar:camera-bold-duotone" width={22} />
                          </div>
                          <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Sin imagen</p>
                          <p className="text-xs">Sube una imagen para destacar el kit</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {vm.editingCombo ? (
                      <>
                        <input type="file" ref={vm.fileInputRef} className="hidden" accept="image/*" onChange={vm.onFileSelect} />
                        <Button color="primary" size="sm" disabled={vm.uploading} onClick={() => vm.fileInputRef.current?.click()}>
                          <Icon icon="solar:upload-minimalistic-bold" className="mr-2" />{vm.uploading ? 'Subiendo...' : 'Seleccionar Imagen'}
                        </Button>
                        {vm.form.imagenUrl && (
                          <button
                            type="button"
                            onClick={() => vm.setForm(p => ({ ...p, imagenUrl: '' }))}
                            className="px-3 py-2 text-sm rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
                          >
                            Quitar imagen
                          </button>
                        )}
                      </>
                    ) : (
                      <div className="w-full rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-300">
                        Primero crea el kit. Luego podrás subir la imagen en modo edición.
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Productos del Kit *</label>
                  <button type="button" onClick={vm.agregarProducto} className={`text-sm ${t.text} dark:text-indigo-400 hover:opacity-80 flex items-center gap-1 font-semibold`}><Icon icon="mdi:plus" /> Agregar producto</button>
                </div>
                <div className="space-y-3">
                    {vm.form.items.map((item, index) => (
                    <div key={index} className="flex gap-3 items-end bg-gray-50 dark:bg-slate-900/50 p-4 rounded-xl border border-gray-100 dark:border-slate-800">
                      <div className="flex-1">
                        <Select
                          label={index === 0 ? "Producto" : "Producto"}
                          name={`producto-${index}`}
                          value={vm.getProductOptionLabel(item.productoId)}
                          options={vm.products.map(p => ({ id: String(p.id), value: `${String(p.descripcion || '').toUpperCase()} - S/ ${Number(p.precioUnitario).toFixed(2)}` }))}
                          onChange={(id: string) => vm.actualizarItem(index, 'productoId', Number(id))}
                          placeholder="Seleccionar producto..."
                          error={undefined}
                          withLabel={true}
                        />
                      </div>
                      <div className="w-24"><InputPro name={`cantidad-${index}`} label={index === 0 ? "Cant." : "Cant."} type="number" value={item.cantidad} onChange={(e) => vm.actualizarItem(index, 'cantidad', Number(e.target.value))} isLabel={true} /></div>
                      <button type="button" onClick={() => vm.eliminarItem(index)} className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors mb-[2px]"><Icon icon="solar:trash-bin-trash-bold" width={20} /></button>
                    </div>
                  ))}
                  {vm.form.items.length === 0 && <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8 border-2 border-dashed border-gray-100 dark:border-slate-800 rounded-xl">Agrega al menos 2 productos al kit</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Precio Regular</label>
                  <div className={`w-full border rounded-lg px-4 py-2 focus:ring-2 ${t.ring} ${t.border} dark:bg-slate-800 dark:text-white dark:border-slate-700`}>S/ {vm.calcularPrecioRegular().toFixed(2)}</div>
                </div>
                <InputPro name="precioCombo" label="Precio Kit / Pack *" type="number" isLabel value={vm.form.precioCombo} onChange={(e) => vm.setForm(prev => ({ ...prev, precioCombo: Number(e.target.value) }))} />
              </div>
              {vm.form.precioCombo > 0 && vm.calcularPrecioRegular() > 0 && (
                <div className={`p-3 rounded-lg ${vm.calcularDescuento() > 0 ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'}`}>
                  <p className="text-sm font-medium">{vm.calcularDescuento() > 0 ? `✓ Descuento: ${vm.calcularDescuento().toFixed(1)}% (Ahorro: S/ ${(vm.calcularPrecioRegular() - vm.form.precioCombo).toFixed(2)})` : '✗ El precio del kit debe ser menor al precio regular'}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="relative z-20">
                  <Calendar text="Fecha Inicio (opcional)" value={vm.form.fechaInicio ? vm.form.fechaInicio.split('T')[0].split('-').reverse().join('/') : ''} onChange={(date: string) => { const [d, m, y] = date.split('/'); vm.setForm(prev => ({ ...prev, fechaInicio: `${y}-${m}-${d}` })); }} />
                </div>
                <div className="relative z-20">
                  <Calendar text="Fecha Fin (opcional)" value={vm.form.fechaFin ? vm.form.fechaFin.split('T')[0].split('-').reverse().join('/') : ''} onChange={(date: string) => { const [d, m, y] = date.split('/'); vm.setForm(prev => ({ ...prev, fechaFin: `${y}-${m}-${d}` })); }} right />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="activo" checked={vm.form.activo} onChange={(e) => vm.setForm(prev => ({ ...prev, activo: e.target.checked }))} className={`w-5 h-5 ${t.text} rounded ${t.ring} dark:bg-slate-800 dark:border-slate-600`} />
                <label htmlFor="activo" className="text-sm font-medium text-gray-700 dark:text-gray-300">Kit activo (visible en la tienda)</label>
              </div>
            </div>
            <div className="sticky bottom-0 bg-gray-50 dark:bg-slate-900 border-t dark:border-slate-800 px-6 py-4 flex justify-end gap-3 z-10">
              <button onClick={vm.cerrarModal} className="px-5 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors font-medium">Cancelar</button>
              <button onClick={vm.guardarCombo} className={`px-6 py-2.5 ${t.bg} text-white rounded-xl ${t.hover} flex items-center gap-2 font-bold shadow-lg shadow-indigo-500/20 transition-all active:scale-95`}><Icon icon="mdi:content-save" />{vm.editingCombo ? 'Guardar Cambios' : 'Crear Kit'}</button>
            </div>
          </div>
        </div>
      )}
    </InventoryPage>
  );
}
