import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useModificadoresStore } from '@/zustand/modificadores';

interface Opcion {
  id: number;
  nombre: string;
  descripcion?: string;
  precioExtra: number;
  orden: number;
  activo: boolean;
  esDefault: boolean;
}

interface GrupoModificador {
  id: number;
  nombre: string;
  descripcion?: string;
  esObligatorio: boolean;
  seleccionMin: number;
  seleccionMax: number;
  orden: number;
  activo: boolean;
  opciones: Opcion[];
  _count?: { productos: number };
}

export default function Modificadores() {
  const {
    grupos,
    loading,
    getAllGrupos,
    crearGrupo,
    actualizarGrupo,
    eliminarGrupo: eliminarGrupoStore,
    agregarOpcion,
    actualizarOpcion,
    eliminarOpcion: eliminarOpcionStore,
    toggleOpcionActivo: toggleOpcionActivoStore,
  } = useModificadoresStore();
  const [showModal, setShowModal] = useState(false);
  const [editingGrupo, setEditingGrupo] = useState<GrupoModificador | null>(null);
  const [showOpcionModal, setShowOpcionModal] = useState(false);
  const [editingOpcion, setEditingOpcion] = useState<Opcion | null>(null);
  const [selectedGrupoId, setSelectedGrupoId] = useState<number | null>(null);

  // Form state para grupo
  const [grupoForm, setGrupoForm] = useState({
    nombre: '',
    descripcion: '',
    esObligatorio: false,
    seleccionMin: 0,
    seleccionMax: 3,
    orden: 0,
  });

  // Form state para opción
  const [opcionForm, setOpcionForm] = useState({
    nombre: '',
    descripcion: '',
    precioExtra: 0,
    orden: 0,
    esDefault: false,
  });

  useEffect(() => {
    getAllGrupos();
  }, [getAllGrupos]);

  const abrirModalGrupo = (grupo?: GrupoModificador) => {
    if (grupo) {
      setEditingGrupo(grupo);
      setGrupoForm({
        nombre: grupo.nombre,
        descripcion: grupo.descripcion || '',
        esObligatorio: grupo.esObligatorio,
        seleccionMin: grupo.seleccionMin,
        seleccionMax: grupo.seleccionMax,
        orden: grupo.orden,
      });
    } else {
      setEditingGrupo(null);
      setGrupoForm({
        nombre: '',
        descripcion: '',
        esObligatorio: false,
        seleccionMin: 0,
        seleccionMax: 3,
        orden: grupos.length,
      });
    }
    setShowModal(true);
  };

  const guardarGrupo = async () => {
    if (!grupoForm.nombre.trim()) {
      // Validación simple en el cliente
      alert('El nombre es requerido');
      return;
    }

    try {
      if (editingGrupo) {
        await actualizarGrupo(editingGrupo.id, grupoForm);
      } else {
        await crearGrupo(grupoForm);
      }
      setShowModal(false);
    } catch (error) {
      // Errores ya son manejados en el store mediante alertas
    }
  };

  const handleEliminarGrupo = async (grupoId: number) => {
    if (!confirm('¿Estás seguro de eliminar este grupo y todas sus opciones?')) return;

    try {
      await eliminarGrupoStore(grupoId);
    } catch (error) {
      // Errores ya son manejados en el store
    }
  };

  const abrirModalOpcion = (grupoId: number, opcion?: Opcion) => {
    setSelectedGrupoId(grupoId);
    if (opcion) {
      setEditingOpcion(opcion);
      setOpcionForm({
        nombre: opcion.nombre,
        descripcion: opcion.descripcion || '',
        precioExtra: Number(opcion.precioExtra) || 0,
        orden: opcion.orden,
        esDefault: opcion.esDefault,
      });
    } else {
      setEditingOpcion(null);
      const grupo = grupos.find((g) => g.id === grupoId);
      setOpcionForm({
        nombre: '',
        descripcion: '',
        precioExtra: 0,
        orden: grupo?.opciones.length || 0,
        esDefault: false,
      });
    }
    setShowOpcionModal(true);
  };

  const guardarOpcion = async () => {
    if (!opcionForm.nombre.trim()) {
      alert('El nombre es requerido');
      return;
    }

    try {
      if (editingOpcion) {
        await actualizarOpcion(editingOpcion.id, opcionForm);
      } else {
        if (selectedGrupoId == null) return;
        await agregarOpcion(selectedGrupoId, opcionForm);
      }
      setShowOpcionModal(false);
    } catch (error) {
      // Errores ya son manejados en el store
    }
  };

  const handleEliminarOpcion = async (opcionId: number) => {
    if (!confirm('¿Estás seguro de eliminar esta opción?')) return;

    try {
      await eliminarOpcionStore(opcionId);
    } catch (error) {
      // Errores ya son manejados en el store
    }
  };

  const handleToggleOpcionActivo = async (opcion: Opcion) => {
    try {
      await toggleOpcionActivoStore(opcion as any);
    } catch (error) {
      // Errores ya son manejados en el store
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Icon icon="eos-icons:loading" className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-2 pb-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Modificadores de Productos</h1>
          <p className="text-sm text-gray-500 mt-1">Configura cremas, acompañamientos, extras y más para tus productos</p>
        </div>
        <button
          onClick={() => abrirModalGrupo()}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-5 py-2.5 rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all shadow-sm hover:shadow-md font-medium"
        >
          <Icon icon="solar:add-circle-bold" className="w-5 h-5" />
          Nuevo Grupo
        </button>
      </div>

      {grupos.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <Icon icon="solar:dishes-linear" className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay grupos de modificadores</h3>
          <p className="text-gray-500 mb-6">
            Crea grupos como "Cremas", "Acompañamientos" o "Extras"
          </p>
          <button
            onClick={() => abrirModalGrupo()}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 shadow-sm hover:shadow-md font-medium transition-all"
          >
            Crear primer grupo
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {grupos?.map((grupo: any) => (
            <div key={grupo.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${grupo.activo ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <div>
                    <h3 className="font-semibold text-gray-800">{grupo.nombre}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      {grupo.esObligatorio && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded text-xs">
                          Obligatorio
                        </span>
                      )}
                      <span>
                        Selección: {grupo.seleccionMin === 0 ? 'opcional' : `mín ${grupo.seleccionMin}`}
                        {grupo.seleccionMax > 1 && ` - máx ${grupo.seleccionMax}`}
                      </span>
                      {grupo._count && (
                        <span className="text-gray-400">
                          • {grupo._count.productos} producto(s)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => abrirModalOpcion(grupo.id)}
                    className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    title="Agregar opción"
                  >
                    <Icon icon="mdi:plus-circle" className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => abrirModalGrupo(grupo)}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Editar grupo"
                  >
                    <Icon icon="mdi:pencil" className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleEliminarGrupo(grupo.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar grupo"
                  >
                    <Icon icon="mdi:delete" className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {grupo.opciones.length > 0 ? (
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {grupo.opciones.map((opcion: any) => (
                      <div
                        key={opcion.id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${opcion.activo ? 'bg-gray-50 border-gray-300' : 'bg-gray-100 border-gray-200 opacity-60'
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleOpcionActivo(opcion)}
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${opcion.activo
                                ? 'bg-primary border-[#6B6CFF] text-white'
                                : 'border-gray-300'
                              }`}
                          >
                            {opcion.activo && <Icon color='#6B6CFF' icon="mdi:check" className="w-4 h-4" />}
                          </button>
                          <div>
                            <span className="font-medium text-gray-700">{opcion.nombre}</span>
                            {opcion.esDefault && (
                              <span className="ml-2 text-xs text-primary">(default)</span>
                            )}
                            {Number(opcion.precioExtra) > 0 && (
                              <span className="ml-2 text-sm text-green-600">
                                +S/{Number(opcion.precioExtra).toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => abrirModalOpcion(grupo.id, opcion)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            <Icon icon="mdi:pencil" className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEliminarOpcion(opcion.id)}
                            className="p-1 text-gray-400 hover:text-red-500"
                          >
                            <Icon icon="mdi:close" className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center text-gray-400">
                  <p>Sin opciones. Haz clic en + para agregar.</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal Grupo */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {editingGrupo ? 'Editar Grupo' : 'Nuevo Grupo de Modificadores'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <Icon icon="mdi:close" className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del grupo *
                </label>
                <input
                  type="text"
                  value={grupoForm.nombre}
                  onChange={(e) => setGrupoForm({ ...grupoForm, nombre: e.target.value })}
                  placeholder="Ej: Elige tus cremas"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción (opcional)
                </label>
                <input
                  type="text"
                  value={grupoForm.descripcion}
                  onChange={(e) => setGrupoForm({ ...grupoForm, descripcion: e.target.value })}
                  placeholder="Ej: Selecciona hasta 3 cremas gratis"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="esObligatorio"
                  checked={grupoForm.esObligatorio}
                  onChange={(e) => setGrupoForm({ ...grupoForm, esObligatorio: e.target.checked })}
                  className="w-4 h-4 text-primary rounded"
                />
                <label htmlFor="esObligatorio" className="text-sm text-gray-700">
                  Es obligatorio elegir al menos una opción
                </label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Selección mínima
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={grupoForm.seleccionMin}
                    onChange={(e) => setGrupoForm({ ...grupoForm, seleccionMin: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Selección máxima
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={grupoForm.seleccionMax}
                    onChange={(e) => setGrupoForm({ ...grupoForm, seleccionMax: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>
            </div>
            <div className="p-4 border-t flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={guardarGrupo}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
              >
                {editingGrupo ? 'Guardar cambios' : 'Crear grupo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Opción */}
      {showOpcionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {editingOpcion ? 'Editar Opción' : 'Nueva Opción'}
              </h2>
              <button onClick={() => setShowOpcionModal(false)} className="text-gray-400 hover:text-gray-600">
                <Icon icon="mdi:close" className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={opcionForm.nombre}
                  onChange={(e) => setOpcionForm({ ...opcionForm, nombre: e.target.value })}
                  placeholder="Ej: Mayonesa, Con papas fritas"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio extra (S/)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={opcionForm.precioExtra}
                  onChange={(e) => setOpcionForm({ ...opcionForm, precioExtra: Number(e.target.value) })}
                  placeholder="0 = gratis"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <p className="text-xs text-gray-400 mt-1">Deja en 0 si es gratis</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="esDefault"
                  checked={opcionForm.esDefault}
                  onChange={(e) => setOpcionForm({ ...opcionForm, esDefault: e.target.checked })}
                  className="w-4 h-4 text-primary rounded"
                />
                <label htmlFor="esDefault" className="text-sm text-gray-700">
                  Seleccionado por defecto
                </label>
              </div>
            </div>
            <div className="p-4 border-t flex justify-end gap-2">
              <button
                onClick={() => setShowOpcionModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={guardarOpcion}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
              >
                {editingOpcion ? 'Guardar cambios' : 'Agregar opción'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
