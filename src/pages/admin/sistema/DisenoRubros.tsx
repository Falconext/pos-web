import { useDisenoRubrosViewModel, PLANTILLAS, TIPOGRAFIAS } from '@/features/admin/sistema/useDisenoRubrosViewModel';
import Button from '@/components/Button';
import { Icon } from '@iconify/react';

export default function DisenoRubros() {
  const vm = useDisenoRubrosViewModel();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Configuración de Diseño por Rubro</h1>
        <p className="text-gray-600">Personaliza el diseño de las tiendas virtuales según su rubro</p>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-semibold mb-4">Rubros</h2>
            <div className="space-y-2">
              {vm.rubros.map((rubro) => (
                <button key={rubro.id} onClick={() => vm.setRubroSeleccionado(rubro.id)} className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${vm.rubroSeleccionado === rubro.id ? 'bg-[#6A6CFF] text-white' : 'bg-gray-50 hover:bg-gray-100'}`}>{rubro.nombre}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="md:col-span-2">
          {vm.rubroSeleccionado ? (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="font-semibold text-lg mb-6">Configurar Diseño - {vm.rubros.find(r => r.id === vm.rubroSeleccionado)?.nombre}</h2>
              {vm.loading ? (
                <div className="flex items-center justify-center h-64"><Icon icon="eos-icons:loading" className="w-12 h-12 text-gray-400" /></div>
              ) : (
                <div className="space-y-6">
                  <div><label className="block text-sm font-medium mb-2">Plantilla Base</label><div className="grid md:grid-cols-2 gap-3">{PLANTILLAS.map(p => <button key={p.id} onClick={() => vm.setDiseno({ ...vm.diseno, plantillaId: p.id })} className={`p-4 rounded-lg border-2 text-left transition-colors ${vm.diseno.plantillaId === p.id ? 'border-[#6A6CFF] bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}><div className="font-medium">{p.nombre}</div><div className="text-sm text-gray-600">{p.descripcion}</div></button>)}</div></div>
                  <div className="grid md:grid-cols-3 gap-4">
                    {[['Color Primario', 'colorPrimario'], ['Color Secundario', 'colorSecundario'], ['Color Acento', 'colorAccento']].map(([label, key]) => (
                      <div key={key}><label className="block text-sm font-medium mb-2">{label}</label><div className="flex gap-2"><input type="color" value={(vm.diseno as any)[key]} onChange={e => vm.setDiseno({ ...vm.diseno, [key]: e.target.value })} className="w-16 h-10 rounded border cursor-pointer" /><input type="text" value={(vm.diseno as any)[key]} onChange={e => vm.setDiseno({ ...vm.diseno, [key]: e.target.value })} className="flex-1 px-3 py-2 border rounded" /></div></div>
                    ))}
                  </div>
                  <div><label className="block text-sm font-medium mb-2">Tipografía</label><select value={vm.diseno.tipografia} onChange={e => vm.setDiseno({ ...vm.diseno, tipografia: e.target.value })} className="w-full px-4 py-2 border rounded-lg">{TIPOGRAFIAS.map(f => <option key={f} value={f}>{f}</option>)}</select></div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div><label className="block text-sm font-medium mb-2">Espaciado</label><select value={vm.diseno.espaciado} onChange={e => vm.setDiseno({ ...vm.diseno, espaciado: e.target.value })} className="w-full px-4 py-2 border rounded-lg"><option value="compact">Compacto</option><option value="normal">Normal</option><option value="spacious">Espacioso</option></select></div>
                    <div><label className="block text-sm font-medium mb-2">Radio de Bordes</label><select value={vm.diseno.bordeRadius} onChange={e => vm.setDiseno({ ...vm.diseno, bordeRadius: e.target.value })} className="w-full px-4 py-2 border rounded-lg"><option value="none">Sin bordes</option><option value="small">Pequeño</option><option value="medium">Mediano</option><option value="large">Grande</option></select></div>
                    <div><label className="block text-sm font-medium mb-2">Estilo de Botón</label><select value={vm.diseno.estiloBoton} onChange={e => vm.setDiseno({ ...vm.diseno, estiloBoton: e.target.value })} className="w-full px-4 py-2 border rounded-lg"><option value="rounded">Redondeado</option><option value="square">Cuadrado</option><option value="pill">Píldora</option></select></div>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div><label className="block text-sm font-medium mb-2">Vista de Productos</label><select value={vm.diseno.vistaProductos || 'cards'} onChange={e => vm.setDiseno({ ...vm.diseno, vistaProductos: e.target.value })} className="w-full px-4 py-2 border rounded-lg"><option value="cards">Cards (Restaurantes)</option><option value="lista">Lista (Bodegas)</option><option value="tabla">Tabla (Ferreterías)</option></select></div>
                    <div><label className="block text-sm font-medium mb-2">Tiempo Mínimo (min)</label><input type="number" min="1" value={vm.diseno.tiempoEntregaMin || 15} onChange={e => vm.setDiseno({ ...vm.diseno, tiempoEntregaMin: Number(e.target.value) })} className="w-full px-4 py-2 border rounded-lg" /></div>
                    <div><label className="block text-sm font-medium mb-2">Tiempo Máximo (min)</label><input type="number" min="1" value={vm.diseno.tiempoEntregaMax || 25} onChange={e => vm.setDiseno({ ...vm.diseno, tiempoEntregaMax: Number(e.target.value) })} className="w-full px-4 py-2 border rounded-lg" /></div>
                  </div>
                  <div className="border-t pt-6"><h3 className="font-medium mb-4">Vista Previa</h3><div className="p-6 rounded-lg" style={{ backgroundColor: vm.diseno.colorSecundario, fontFamily: vm.diseno.tipografia }}><button className="px-6 py-3 text-white font-medium" style={{ backgroundColor: vm.diseno.colorPrimario, borderRadius: vm.diseno.bordeRadius === 'none' ? '0' : vm.diseno.bordeRadius === 'small' ? '4px' : vm.diseno.bordeRadius === 'medium' ? '8px' : '16px' }}>Botón de Ejemplo</button><div className="mt-4"><h4 className="text-2xl font-bold" style={{ color: vm.diseno.colorPrimario }}>Título de Ejemplo</h4><p className="mt-2 text-gray-700">Este es un texto de ejemplo para mostrar cómo se verá el diseño en la tienda virtual.</p></div></div></div>
                  <div className="flex justify-end pt-4 border-t"><Button color="lila" onClick={vm.guardarDiseno} disabled={vm.loading}>{vm.loading ? <><Icon icon="eos-icons:loading" className="mr-2" width={20} />Guardando...</> : <><Icon icon="mdi:content-save" className="mr-2" width={20} />Guardar Diseño</>}</Button></div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center"><Icon icon="mdi:palette-outline" className="w-16 h-16 mx-auto text-gray-400 mb-4" /><p className="text-gray-600">Selecciona un rubro para configurar su diseño</p></div>
          )}
        </div>
      </div>
    </div>
  );
}
