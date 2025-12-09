import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useCombosStore, Combo } from '@/zustand/combos';
import { useProductsStore } from '@/zustand/products';

export default function CombosAdmin() {
  // Zustand stores
  const { combos, loading, fetchCombos, createCombo, updateCombo, deleteCombo, toggleActivo: toggleComboActivo } = useCombosStore();
  const { products, getAllProducts } = useProductsStore();
  
  const [showModal, setShowModal] = useState(false);
  const [editingCombo, setEditingCombo] = useState<Combo | null>(null);

  // Form state
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    imagenUrl: '',
    precioCombo: 0,
    activo: true,
    fechaInicio: '',
    fechaFin: '',
    items: [] as { productoId: number; cantidad: number }[],
  });

  useEffect(() => {
    fetchCombos(true);
    getAllProducts({ limit: 500 });
  }, []);

  const abrirModal = (combo?: Combo) => {
    if (combo) {
      setEditingCombo(combo);
      setForm({
        nombre: combo.nombre,
        descripcion: combo.descripcion || '',
        imagenUrl: combo.imagenUrl || '',
        precioCombo: Number(combo.precioCombo),
        activo: combo.activo,
        fechaInicio: combo.fechaInicio ? combo.fechaInicio.split('T')[0] : '',
        fechaFin: combo.fechaFin ? combo.fechaFin.split('T')[0] : '',
        items: combo.items.map(i => ({ productoId: i.productoId, cantidad: i.cantidad })),
      });
    } else {
      setEditingCombo(null);
      setForm({
        nombre: '',
        descripcion: '',
        imagenUrl: '',
        precioCombo: 0,
        activo: true,
        fechaInicio: '',
        fechaFin: '',
        items: [],
      });
    }
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setEditingCombo(null);
  };

  const agregarProducto = () => {
    setForm(prev => ({
      ...prev,
      items: [...prev.items, { productoId: 0, cantidad: 1 }],
    }));
  };

  const actualizarItem = (index: number, field: 'productoId' | 'cantidad', value: number) => {
    setForm(prev => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const eliminarItem = (index: number) => {
    setForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const calcularPrecioRegular = () => {
    return form.items.reduce((sum, item) => {
      const producto = products.find((p) => p.id === item.productoId);
      if (!producto) return sum;
      return sum + Number(producto.precioUnitario) * item.cantidad;
    }, 0);
  };

  const calcularDescuento = () => {
    const precioRegular = calcularPrecioRegular();
    if (precioRegular === 0) return 0;
    return ((precioRegular - form.precioCombo) / precioRegular) * 100;
  };

  const guardarCombo = async () => {
    if (!form.nombre.trim()) {
      window.alert('El nombre es requerido');
      return;
    }
    if (form.items.length < 2) {
      window.alert('Un combo debe tener al menos 2 productos');
      return;
    }
    if (form.items.some(i => i.productoId === 0)) {
      window.alert('Selecciona todos los productos');
      return;
    }
    if (form.precioCombo <= 0) {
      window.alert('El precio del combo debe ser mayor a 0');
      return;
    }
    if (form.precioCombo >= calcularPrecioRegular()) {
      window.alert('El precio del combo debe ser menor al precio regular');
      return;
    }

    const payload = {
      nombre: form.nombre,
      descripcion: form.descripcion || undefined,
      imagenUrl: form.imagenUrl || undefined,
      precioCombo: form.precioCombo,
      activo: form.activo,
      fechaInicio: form.fechaInicio || undefined,
      fechaFin: form.fechaFin || undefined,
      items: form.items,
    };

    let success = false;
    if (editingCombo) {
      success = await updateCombo(editingCombo.id, payload);
    } else {
      success = await createCombo(payload);
    }

    if (success) {
      cerrarModal();
    }
  };

  const handleEliminarCombo = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este combo?')) return;
    await deleteCombo(id);
  };

  const handleToggleActivo = async (combo: Combo) => {
    await toggleComboActivo(combo);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Icon icon="eos-icons:loading" className="w-12 h-12 text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Combos</h1>
          <p className="text-sm text-gray-500">Gestiona tus combos y ofertas especiales</p>
        </div>
        <button
          onClick={() => abrirModal()}
          className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
        >
          <Icon icon="mdi:plus" width={20} />
          Nuevo Combo
        </button>
      </div>

      {/* Lista de Combos */}
      {combos.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Icon icon="mdi:food" className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 mb-4">No hay combos creados</p>
          <button
            onClick={() => abrirModal()}
            className="text-orange-500 hover:text-orange-600 font-medium"
          >
            Crear tu primer combo
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {combos.map((combo) => (
            <div
              key={combo.id}
              className={`bg-white rounded-xl shadow-sm border overflow-hidden ${!combo.activo ? 'opacity-60' : ''}`}
            >
              {/* Imagen */}
              <div className="relative h-40 bg-gradient-to-br from-orange-400 to-red-500">
                {combo.imagenUrl ? (
                  <img src={combo.imagenUrl} alt={combo.nombre} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Icon icon="mdi:food" className="w-16 h-16 text-white/30" />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${combo.activo ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}>
                    {combo.activo ? 'Activo' : 'Inactivo'}
                  </span>
                  <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                    -{Math.round(Number(combo.descuentoPorcentaje))}%
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="font-bold text-lg mb-1">{combo.nombre}</h3>
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">{combo.descripcion || 'Sin descripción'}</p>

                {/* Productos */}
                <div className="mb-3 text-xs text-gray-600">
                  <p className="font-semibold mb-1">Incluye:</p>
                  <ul className="space-y-1">
                    {combo.items.slice(0, 3).map((item, idx) => (
                      <li key={idx} className="flex items-center gap-1">
                        <Icon icon="mdi:check" className="text-green-500" />
                        {item.cantidad}x {item.producto?.descripcion || `Producto #${item.productoId}`}
                      </li>
                    ))}
                    {combo.items.length > 3 && (
                      <li className="text-gray-400">+{combo.items.length - 3} más</li>
                    )}
                  </ul>
                </div>

                {/* Precios */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-gray-400 line-through">S/ {Number(combo.precioRegular).toFixed(2)}</p>
                    <p className="text-xl font-bold text-orange-500">S/ {Number(combo.precioCombo).toFixed(2)}</p>
                  </div>
                  <p className="text-sm text-green-600 font-semibold">
                    Ahorra S/ {(Number(combo.precioRegular) - Number(combo.precioCombo)).toFixed(2)}
                  </p>
                </div>

                {/* Acciones */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleActivo(combo)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${combo.activo
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                  >
                    {combo.activo ? 'Desactivar' : 'Activar'}
                  </button>
                  <button
                    onClick={() => abrirModal(combo)}
                    className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
                  >
                    <Icon icon="mdi:pencil" width={18} />
                  </button>
                  <button
                    onClick={() => handleEliminarCombo(combo.id)}
                    className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                  >
                    <Icon icon="mdi:trash-can" width={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {editingCombo ? 'Editar Combo' : 'Nuevo Combo'}
              </h2>
              <button onClick={cerrarModal} className="p-2 hover:bg-gray-100 rounded-lg">
                <Icon icon="mdi:close" width={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Combo *
                </label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm(prev => ({ ...prev, nombre: e.target.value }))}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Ej: Combo Familiar"
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={form.descripcion}
                  onChange={(e) => setForm(prev => ({ ...prev, descripcion: e.target.value }))}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  rows={2}
                  placeholder="Descripción del combo..."
                />
              </div>

              {/* URL Imagen */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL de Imagen
                </label>
                <input
                  type="url"
                  value={form.imagenUrl}
                  onChange={(e) => setForm(prev => ({ ...prev, imagenUrl: e.target.value }))}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="https://..."
                />
              </div>

              {/* Productos */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Productos del Combo *
                  </label>
                  <button
                    type="button"
                    onClick={agregarProducto}
                    className="text-sm text-orange-500 hover:text-orange-600 flex items-center gap-1"
                  >
                    <Icon icon="mdi:plus" /> Agregar producto
                  </button>
                </div>

                <div className="space-y-2">
                  {form.items.map((item, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <select
                        value={item.productoId}
                        onChange={(e) => actualizarItem(index, 'productoId', Number(e.target.value))}
                        className="flex-1 border rounded-lg px-3 py-2 text-sm"
                      >
                        <option value={0}>Seleccionar producto...</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.descripcion} - S/ {Number(p.precioUnitario).toFixed(2)}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min={1}
                        value={item.cantidad}
                        onChange={(e) => actualizarItem(index, 'cantidad', Number(e.target.value))}
                        className="w-20 border rounded-lg px-3 py-2 text-sm text-center"
                      />
                      <button
                        type="button"
                        onClick={() => eliminarItem(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Icon icon="mdi:trash-can" />
                      </button>
                    </div>
                  ))}

                  {form.items.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4 border-2 border-dashed rounded-lg">
                      Agrega al menos 2 productos al combo
                    </p>
                  )}
                </div>
              </div>

              {/* Precios */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precio Regular
                  </label>
                  <div className="bg-gray-100 border rounded-lg px-4 py-2 text-gray-600">
                    S/ {calcularPrecioRegular().toFixed(2)}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precio Combo *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={form.precioCombo}
                    onChange={(e) => setForm(prev => ({ ...prev, precioCombo: Number(e.target.value) }))}
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Descuento calculado */}
              {form.precioCombo > 0 && calcularPrecioRegular() > 0 && (
                <div className={`p-3 rounded-lg ${calcularDescuento() > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  <p className="text-sm font-medium">
                    {calcularDescuento() > 0
                      ? `✓ Descuento: ${calcularDescuento().toFixed(1)}% (Ahorro: S/ ${(calcularPrecioRegular() - form.precioCombo).toFixed(2)})`
                      : '✗ El precio del combo debe ser menor al precio regular'
                    }
                  </p>
                </div>
              )}

              {/* Fechas */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha Inicio (opcional)
                  </label>
                  <input
                    type="date"
                    value={form.fechaInicio}
                    onChange={(e) => setForm(prev => ({ ...prev, fechaInicio: e.target.value }))}
                    className="w-full border rounded-lg px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha Fin (opcional)
                  </label>
                  <input
                    type="date"
                    value={form.fechaFin}
                    onChange={(e) => setForm(prev => ({ ...prev, fechaFin: e.target.value }))}
                    className="w-full border rounded-lg px-4 py-2"
                  />
                </div>
              </div>

              {/* Activo */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="activo"
                  checked={form.activo}
                  onChange={(e) => setForm(prev => ({ ...prev, activo: e.target.checked }))}
                  className="w-5 h-5 text-orange-500 rounded focus:ring-orange-500"
                />
                <label htmlFor="activo" className="text-sm font-medium text-gray-700">
                  Combo activo (visible en la tienda)
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end gap-3">
              <button
                onClick={cerrarModal}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={guardarCombo}
                className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-2"
              >
                <Icon icon="mdi:content-save" />
                {editingCombo ? 'Guardar Cambios' : 'Crear Combo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
