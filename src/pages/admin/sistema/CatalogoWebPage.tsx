import { useEffect, useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import storeCatalogService, { StoreProduct, StoreProductPayload } from '@/services/storeCatalogService';
import useAlertStore from '@/zustand/alert';
import Modal from '@/components/Modal';
import InputPro from '@/components/InputPro';
import Button from '@/components/Button';
import Select from '@/components/Select';

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
                    <td className="px-6 py-4 text-right text-gray-700 dark:text-gray-300">
                      S/ {Number(p.price).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {p.stock !== null ? (
                        <span className={p.stock === 0 ? 'text-red-500' : p.stock <= 5 ? 'text-amber-500' : 'text-gray-600 dark:text-gray-300'}>
                          {p.stock}
                        </span>
                      ) : (
                        <span className="text-emerald-500 text-xs">∞</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-400">
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
      <Modal
        isOpenModal={modalOpen}
        closeModal={() => setModalOpen(false)}
        title={editTarget ? 'Editar Producto' : 'Nuevo Producto'}
        icon="solar:shop-2-bold-duotone"
        iconClass="bg-violet-50 text-violet-600"
        width="560px"
        height="auto"
      >
        <form onSubmit={handleSubmit}>
          <div className="p-5 space-y-3">
            <InputPro
              isLabel
              label="Nombre *"
              name="name"
              value={form.name}
              onChange={handleChange as any}
              placeholder="Ej. Sistema de Facturación Plan Pro"
              reference={firstInputRef as any}
            />

            <div className="quill-container">
              <label className="block text-sm font-[400] text-gray-900 dark:!text-gray-300 mb-2">Descripción</label>
              <ReactQuill
                theme="snow"
                value={form.description || ''}
                onChange={(value) => setForm(prev => ({ ...prev, description: value }))}
                placeholder="Escribe la descripción del producto..."
                className="bg-white dark:bg-slate-800 rounded-xl"
                modules={{ toolbar: [[{ header: [1, 2, 3, false] }], ['bold', 'italic', 'underline'], [{ list: 'ordered' }, { list: 'bullet' }], ['link'], ['clean']] }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InputPro isLabel label="Precio (S/) *" name="price" type="number" step="0.01" value={String(form.price)} onChange={handleChange as any} />
              <InputPro isLabel label="Precio anterior (S/)" name="oldPrice" type="number" step="0.01" value={String(form.oldPrice ?? '')} onChange={handleChange as any} placeholder="0.00" />
            </div>

            <InputPro isLabel label="URL de Imagen" name="imageUrl" value={form.imageUrl ?? ''} onChange={handleChange as any} placeholder="https://..." />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label="Categoría *"
                name="category"
                value={form.category ?? ''}
                options={[
                  { id: 'Accesorios', value: 'Accesorios' },
                  { id: 'Combo', value: 'Combo' },
                  { id: 'Equipos', value: 'Equipos' },
                  { id: 'Sistema', value: 'Sistema' },
                ]}
                onChange={(id: any) => setForm(prev => ({ ...prev, category: id }))}
                error={null}
                readOnly={true}
              />
              <InputPro isLabel label="Stock (vacío = ∞)" name="stock" type="number" value={String(form.stock ?? '')} onChange={handleChange as any} placeholder="∞" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InputPro isLabel label="Badge" name="badge" value={form.badge ?? ''} onChange={handleChange as any} placeholder="Nuevo, Popular..." />
              <InputPro isLabel label="Orden" name="order" type="number" value={String(form.order ?? 0)} onChange={handleChange as any} />
            </div>

            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors border border-gray-100 dark:border-slate-700">
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
          </div>

          <div className="flex gap-3 px-5 pb-5">
            <Button type="button" onClick={() => setModalOpen(false)} color="default" className="flex-1">Cancelar</Button>
            <Button type="submit" color="primary" disabled={saving} className="flex-1">
              {saving && <Icon icon="svg-spinners:ring-resize" width="15" className="mr-1.5" />}
              {editTarget ? 'Guardar Cambios' : 'Crear Producto'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal confirmar eliminar */}
      <Modal
        isOpenModal={deleteId !== null}
        closeModal={() => setDeleteId(null)}
        title="Eliminar producto"
        icon="solar:trash-bin-trash-bold-duotone"
        iconClass="bg-red-50 text-red-500"
        width="360px"
        height="auto"
      >
        <div className="px-5 py-4 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">Esta acción no se puede deshacer.</p>
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <Button type="button" onClick={() => setDeleteId(null)} color="default" className="flex-1">Cancelar</Button>
          <Button type="button" onClick={() => deleteId !== null && handleDelete(deleteId)} color="danger" className="flex-1">Eliminar</Button>
        </div>
      </Modal>
    </div>
    </>
  );
}
