import { useEffect, useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import storeCatalogService, { StoreProduct, StoreProductPayload } from '@/services/storeCatalogService';
import useAlertStore from '@/zustand/alert';

const EMPTY_FORM: StoreProductPayload = {
  name: '',
  description: '',
  price: 0,
  oldPrice: undefined,
  imageUrl: '',
  badge: '',
  category: '',
  stock: null,
  isActive: true,
  order: 0,
};

export default function CatalogoWebPage() {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<StoreProduct | null>(null);
  const [form, setForm] = useState<StoreProductPayload>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    try {
      setLoading(true);
      setProducts(await storeCatalogService.getAll());
    } catch {
      useAlertStore.getState().alert('Error al cargar el catálogo', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (modalOpen) setTimeout(() => firstInputRef.current?.focus(), 100);
  }, [modalOpen]);

  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (p: StoreProduct) => {
    setEditTarget(p);
    setForm({
      name: p.name,
      description: p.description ?? '',
      price: p.price,
      oldPrice: p.oldPrice ?? undefined,
      imageUrl: p.imageUrl ?? '',
      badge: p.badge ?? '',
      category: p.category ?? '',
      stock: p.stock ?? null,
      isActive: p.isActive,
      order: p.order,
    });
    setModalOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked
        : (name === 'price' || name === 'oldPrice' || name === 'order' || name === 'stock') ? (value === '' ? undefined : Number(value))
        : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { useAlertStore.getState().alert('El nombre es obligatorio', 'warning'); return; }
    setSaving(true);
    try {
      const payload: StoreProductPayload = {
        ...form,
        oldPrice: form.oldPrice && Number(form.oldPrice) > 0 ? Number(form.oldPrice) : null,
        stock: form.stock !== undefined && form.stock !== null ? Number(form.stock) : null,
        category: form.category || undefined,
      };
      if (editTarget) {
        await storeCatalogService.update(editTarget.id, payload);
        useAlertStore.getState().alert('Producto actualizado', 'success');
      } else {
        await storeCatalogService.create(payload);
        useAlertStore.getState().alert('Producto creado', 'success');
      }
      setModalOpen(false);
      await load();
    } catch {
      useAlertStore.getState().alert('Error al guardar el producto', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await storeCatalogService.remove(id);
      useAlertStore.getState().alert('Producto eliminado', 'success');
      setDeleteId(null);
      await load();
    } catch {
      useAlertStore.getState().alert('Error al eliminar el producto', 'error');
    }
  };

  const handleToggleActive = async (p: StoreProduct) => {
    try {
      await storeCatalogService.update(p.id, { isActive: !p.isActive });
      await load();
    } catch {
      useAlertStore.getState().alert('Error al actualizar el estado', 'error');
    }
  };

  return (
    <>
      <style>{`
        .quill-container .ql-toolbar {
          border-top-left-radius: 0.75rem;
          border-top-right-radius: 0.75rem;
          border-color: #f3f4f6;
        }
        .quill-container .ql-container {
          border-bottom-left-radius: 0.75rem;
          border-bottom-right-radius: 0.75rem;
          border-color: #f3f4f6;
          min-height: 120px;
          font-family: inherit;
        }
        .dark .quill-container .ql-toolbar,
        .dark .quill-container .ql-container {
          border-color: #334155;
        }
        .dark .quill-container .ql-editor {
          color: #f8fafc;
        }
        .dark .quill-container .ql-stroke {
          stroke: #94a3b8;
        }
        .dark .quill-container .ql-fill {
          fill: #94a3b8;
        }
        .dark .quill-container .ql-picker-label {
          color: #94a3b8;
        }
      `}</style>
      <div className="space-y-6 animate-in fade-in zoom-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Icon icon="solar:shop-2-bold-duotone" className="text-violet-600" />
            Catálogo Web
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Productos visibles en <span className="font-semibold text-violet-600">/tienda</span> de falconext.pe
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white font-bold rounded-xl shadow-lg shadow-violet-500/30 hover:bg-violet-700 transition-all active:scale-95"
        >
          <Icon icon="solar:add-circle-bold" width="20" />
          Nuevo Producto
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#111827] rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/50 dark:bg-slate-800/50 text-gray-500 dark:text-gray-400 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Orden</th>
                <th className="px-6 py-4">Imagen</th>
                <th className="px-6 py-4">Producto</th>
                <th className="px-6 py-4">Badge</th>
                <th className="px-6 py-4">Categoría</th>
                <th className="px-6 py-4 text-right">Precio</th>
                <th className="px-6 py-4 text-right">Stock</th>
                <th className="px-6 py-4 text-right">Antes</th>
                <th className="px-6 py-4 text-center">Estado</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-sm">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-gray-100 dark:bg-slate-800 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-16 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <Icon icon="solar:shop-2-linear" width="48" className="opacity-30" />
                      <p>Sin productos. Haz clic en "Nuevo Producto" para empezar.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                products.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 text-gray-400 font-mono text-xs">{p.order}</td>
                    <td className="px-6 py-4">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.name} className="w-10 h-10 rounded-lg object-cover border border-gray-100" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
                          <Icon icon="solar:image-linear" className="text-gray-300" width="18" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-800 dark:text-white">{p.name}</p>
                      {p.description && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">
                          {p.description.replace(/<[^>]*>?/gm, '')}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {p.badge ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-50 text-violet-700 border border-violet-100">
                          {p.badge}
                        </span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-6 py-4">
                      {p.category ? (
                        <span className="text-gray-600 dark:text-gray-300 font-medium">{p.category}</span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-gray-800 dark:text-white">
                      S/ {Number(p.price).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono">
                      {p.stock !== null ? (
                        <span className={p.stock === 0 ? 'text-red-500 font-bold' : p.stock <= 5 ? 'text-amber-500 font-bold' : 'text-gray-600 dark:text-gray-300'}>
                          {p.stock}
                        </span>
                      ) : (
                        <span className="text-emerald-500 font-bold text-xs">∞</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-gray-400">
                      {p.oldPrice ? <span className="line-through">S/ {Number(p.oldPrice).toFixed(2)}</span> : <span>—</span>}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleToggleActive(p)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                          p.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100'
                            : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${p.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                        {p.isActive ? 'Activo' : 'Inactivo'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEdit(p)}
                          className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Icon icon="solar:pen-bold" width="17" />
                        </button>
                        <button
                          onClick={() => setDeleteId(p.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Icon icon="solar:trash-bin-trash-bold" width="17" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear / Editar */}
      {modalOpen && (
        <div className="fixed inset-0 top-[-30px] z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white dark:bg-[#111827] rounded-3xl p-8 w-full max-w-lg z-10 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                  {editTarget ? 'Editar Producto' : 'Nuevo Producto'}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {editTarget ? 'Actualiza los datos del producto' : 'Añade un producto al catálogo web'}
                </p>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <Icon icon="solar:close-circle-bold" width="24" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nombre */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Nombre *</label>
                <input
                  ref={firstInputRef}
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="Ej. Sistema de Facturación Plan Pro"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all placeholder:text-gray-400 font-medium dark:text-white"
                />
              </div>

              {/* Descripción */}
              <div className="space-y-1.5 quill-container">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Descripción</label>
                <ReactQuill
                  theme="snow"
                  value={form.description || ''}
                  onChange={(value) => setForm(prev => ({ ...prev, description: value }))}
                  placeholder="Escribe la descripción del producto tipo blog..."
                  className="bg-white dark:bg-slate-800 rounded-xl"
                  modules={{
                    toolbar: [
                      [{ 'header': [1, 2, 3, false] }],
                      ['bold', 'italic', 'underline', 'strike'],
                      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                      ['link', 'image'],
                      ['clean']
                    ]
                  }}
                />
              </div>

              {/* Precios */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Precio (S/) *</label>
                  <input
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all font-mono dark:text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Precio anterior (S/)</label>
                  <input
                    name="oldPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.oldPrice ?? ''}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all font-mono placeholder:text-gray-400 dark:text-white"
                  />
                </div>
              </div>

              {/* URL imagen */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">URL de Imagen</label>
                <input
                  name="imageUrl"
                  value={form.imageUrl ?? ''}
                  onChange={handleChange}
                  placeholder="https://..."
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all placeholder:text-gray-400 dark:text-white"
                />
              </div>

              {/* Categoría y Stock */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Categoría *</label>
                  <select
                    name="category"
                    value={form.category ?? ''}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all font-medium dark:text-white"
                  >
                    <option value="">Selecciona...</option>
                    <option value="Accesorios">Accesorios</option>
                    <option value="Combo">Combo</option>
                    <option value="Equipos">Equipos</option>
                    <option value="Sistema">Sistema</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Stock</label>
                  <input
                    name="stock"
                    type="number"
                    min="0"
                    value={form.stock ?? ''}
                    onChange={handleChange}
                    placeholder="∞"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all font-mono placeholder:text-gray-400 dark:text-white"
                  />
                </div>
              </div>

              {/* Badge + Orden */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Badge</label>
                  <input
                    name="badge"
                    value={form.badge ?? ''}
                    onChange={handleChange}
                    placeholder="Nuevo, Popular..."
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all placeholder:text-gray-400 dark:text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Orden</label>
                  <input
                    name="order"
                    type="number"
                    min="0"
                    value={form.order ?? 0}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all font-mono dark:text-white"
                  />
                </div>
              </div>

              {/* Estado activo */}
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={form.isActive ?? true}
                  onChange={handleChange}
                  className="w-4 h-4 rounded accent-violet-600"
                />
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-white">Producto activo</p>
                  <p className="text-xs text-gray-400">Solo los productos activos aparecen en la web pública</p>
                </div>
              </label>

              {/* Acciones */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-3 text-gray-600 dark:text-gray-300 font-bold bg-gray-100 dark:bg-slate-800 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 text-white font-bold bg-violet-600 rounded-xl hover:bg-violet-700 transition-colors shadow-lg shadow-violet-500/30 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {saving && <Icon icon="svg-spinners:ring-resize" width="16" />}
                  {editTarget ? 'Guardar Cambios' : 'Crear Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal confirmar eliminar */}
      {deleteId !== null && (
        <div className="fixed inset-0 top-[-30px] z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
          <div className="relative bg-white dark:bg-[#111827] rounded-3xl p-8 w-full max-w-sm z-10 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon icon="solar:trash-bin-trash-bold-duotone" width="36" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">¿Eliminar producto?</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-3 text-gray-600 font-bold bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="flex-1 py-3 text-white font-bold bg-red-500 rounded-xl hover:bg-red-600 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
