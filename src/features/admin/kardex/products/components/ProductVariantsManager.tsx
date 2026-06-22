import React, { useMemo } from 'react';
import { Icon } from '@iconify/react';
import { useProductModalViewModel } from '../useProductModalViewModel';
import Button from '@/components/Button';
import useAlertStore from '@/zustand/alert';

type ViewProps = ReturnType<typeof useProductModalViewModel>;

type VariantOption = {
  nombre: string;
  valores: string[];
};

type VariantConfig = {
  id?: number;
  valoresAtributos: Record<string, string>;
  codigo?: string;
  precioUnitario?: number;
  stock?: number;
  imagenUrl?: string | null;
  imagenUrlDisplay?: string | null;
  codigoBarras?: string | null;
  estado?: 'ACTIVO' | 'INACTIVO';
};

const comboKey = (combo: Record<string, string>) =>
  Object.entries(combo)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}:${value}`)
    .join('|');

const normalizeCodeToken = (value: string) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '')
    .slice(0, 4)
    .toUpperCase();

const generateCombinations = (options: VariantOption[]) => {
  const validOptions = options.filter((option) => option.nombre && option.valores.length > 0);
  if (validOptions.length === 0) return [];

  return validOptions.reduce<Record<string, string>[]>(
    (acc, option) =>
      acc.flatMap((combo) =>
        option.valores.map((value) => ({
          ...combo,
          [option.nombre]: value,
        })),
      ),
    [{}],
  );
};

export const ProductVariantsManager: React.FC<{ vm: ViewProps }> = ({ vm }) => {
  const {
    formValues,
    setFormValues,
    variantImageFiles,
    setVariantImageFiles,
    variantImagePreviews,
    setVariantImagePreviews,
  } = vm;

  const opcionesAtributos: VariantOption[] = Array.isArray((formValues as any).opcionesAtributos)
    ? (formValues as any).opcionesAtributos
    : [];
  const variantesConfig: VariantConfig[] = Array.isArray((formValues as any).variantesConfig)
    ? (formValues as any).variantesConfig
    : [];
  const variantesExistentes: VariantConfig[] = Array.isArray((formValues as any).variantes)
    ? (formValues as any).variantes.map((variant: any) => ({
        id: variant.id,
        valoresAtributos: variant.valoresAtributos || {},
        codigo: variant.codigo || '',
        precioUnitario: Number(variant.precioUnitario || formValues.precioUnitario || 0),
        stock: Number(variant.stock || 0),
        imagenUrl: variant.imagenUrl || '',
        imagenUrlDisplay: variant.imagenUrlDisplay || variant.imagenUrl || '',
        codigoBarras: variant.codigoBarras || '',
        estado: variant.estado || 'ACTIVO',
      }))
    : [];

  const colorOptionName = useMemo(() => {
    const colorOption = opcionesAtributos.find((option) =>
      option.nombre.toLowerCase().includes('color'),
    );
    return colorOption?.nombre || opcionesAtributos[0]?.nombre || 'Color';
  }, [opcionesAtributos]);

  const combinations = useMemo(() => generateCombinations(opcionesAtributos), [opcionesAtributos]);
  const colorValues = useMemo(
    () => Array.from(new Set(combinations.map((combo) => combo[colorOptionName]).filter(Boolean))),
    [colorOptionName, combinations],
  );

  const buildConfig = (options: VariantOption[], previous: VariantConfig[] = variantesConfig) => {
    const combos = generateCombinations(options);
    const previousRows = previous.length > 0 ? previous : variantesExistentes;
    const previousByKey = new Map(previousRows.map((row) => [comboKey(row.valoresAtributos || {}), row]));
    const imageByColor = new Map<string, Pick<VariantConfig, 'imagenUrl' | 'imagenUrlDisplay'>>();

    previousRows.forEach((row) => {
      const color = row.valoresAtributos?.[colorOptionName];
      if (color && (row.imagenUrl || row.imagenUrlDisplay) && !imageByColor.has(color)) {
        imageByColor.set(color, {
          imagenUrl: row.imagenUrl,
          imagenUrlDisplay: row.imagenUrlDisplay,
        });
      }
    });

    return combos.map((combo, index) => {
      const key = comboKey(combo);
      const previousRow = previousByKey.get(key);
      const colorImage = imageByColor.get(combo[colorOptionName]);
      const codeSuffix = Object.values(combo).map(normalizeCodeToken).filter(Boolean).join('-');

      return {
        valoresAtributos: combo,
        codigo: previousRow?.codigo || `${formValues.codigo || 'VAR'}-${codeSuffix || index + 1}`.slice(0, 60),
        precioUnitario: Number(previousRow?.precioUnitario ?? formValues.precioUnitario ?? 0),
        stock: Number(previousRow?.stock ?? 0),
        imagenUrl: previousRow?.imagenUrl || colorImage?.imagenUrl || '',
        imagenUrlDisplay: previousRow?.imagenUrlDisplay || colorImage?.imagenUrlDisplay || '',
        codigoBarras: previousRow?.codigoBarras || '',
        estado: previousRow?.estado || 'ACTIVO',
      };
    });
  };

  const commitOptionsAndConfig = (nextOptions: VariantOption[], previousConfig = variantesConfig) => {
    const nextConfig = buildConfig(nextOptions, previousConfig);
    const stockTotal = nextConfig.reduce((sum, row) => sum + Number(row.stock || 0), 0);
    setFormValues({
      ...formValues,
      opcionesAtributos: nextOptions,
      variantesConfig: nextConfig,
      stock: nextConfig.length > 0 ? stockTotal : formValues.stock,
    } as any);
  };

  const updateOptionName = (index: number, name: string) => {
    const next = [...opcionesAtributos];
    next[index] = { ...next[index], nombre: name };
    commitOptionsAndConfig(next);
  };

  const updateOptionValues = (index: number, valuesStr: string) => {
    const next = [...opcionesAtributos];
    next[index] = {
      ...next[index],
      valores: valuesStr
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
    };
    commitOptionsAndConfig(next);
  };

  const addOption = () => {
    const defaultName = opcionesAtributos.length === 0 ? 'Color' : opcionesAtributos.length === 1 ? 'Talla' : '';
    commitOptionsAndConfig([...opcionesAtributos, { nombre: defaultName, valores: [] }]);
  };

  const removeOption = (index: number) => {
    commitOptionsAndConfig(opcionesAtributos.filter((_, optionIndex) => optionIndex !== index));
  };

  const applyFashionPreset = () => {
    commitOptionsAndConfig([
      { nombre: 'Color', valores: ['Negro', 'Blanco', 'Beige'] },
      { nombre: 'Talla', valores: ['S', 'M', 'L'] },
    ]);
  };

  const updateVariant = (key: string, patch: Partial<VariantConfig>) => {
    const nextConfig = buildConfig(opcionesAtributos).map((row) =>
      comboKey(row.valoresAtributos) === key ? { ...row, ...patch } : row,
    );
    const stockTotal = nextConfig.reduce((sum, row) => sum + Number(row.stock || 0), 0);
    setFormValues({
      ...formValues,
      variantesConfig: nextConfig,
      stock: stockTotal,
    } as any);
  };

  const handleColorImage = (color: string, file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      useAlertStore.getState().alert('El archivo debe ser una imagen', 'error');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      useAlertStore.getState().alert('La imagen no debe superar 2MB', 'error');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setVariantImageFiles({ ...variantImageFiles, [color]: file });
    setVariantImagePreviews({ ...variantImagePreviews, [color]: previewUrl });
  };

  const removeColorImage = (color: string) => {
    const nextFiles = { ...variantImageFiles };
    const nextPreviews = { ...variantImagePreviews };
    delete nextFiles[color];
    delete nextPreviews[color];
    setVariantImageFiles(nextFiles);
    setVariantImagePreviews(nextPreviews);

    const nextConfig = buildConfig(opcionesAtributos).map((row) =>
      row.valoresAtributos?.[colorOptionName] === color
        ? { ...row, imagenUrl: '', imagenUrlDisplay: '' }
        : row,
    );
    setFormValues({ ...formValues, variantesConfig: nextConfig } as any);
  };

  if (vm.isFarmacia || vm.isRestaurante || !vm.isModaRubro) return null;

  const rows = buildConfig(opcionesAtributos);

  return (
    <div className="col-span-1 md:col-span-2 mt-4 rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50/80 to-white p-5 dark:border-violet-900/40 dark:from-violet-950/20 dark:to-slate-950/10">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h5 className="flex items-center gap-2 text-sm font-black text-violet-900 dark:text-violet-300">
            <Icon icon="solar:layers-minimalistic-bold-duotone" width={20} />
            Variantes avanzadas para moda
          </h5>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Crea matriz Color × Talla con stock, SKU, precio e imagen por color para ropa, calzado y carteras.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" outline color="primary" onClick={applyFashionPreset} className="px-3 py-1.5 text-xs">
            <Icon icon="solar:magic-stick-3-bold-duotone" width={15} className="mr-1.5" />
            Preset moda
          </Button>
          <Button type="button" outline color="primary" onClick={addOption} className="px-3 py-1.5 text-xs">
            <Icon icon="solar:add-circle-bold" width={15} className="mr-1.5" />
            Añadir opción
          </Button>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {opcionesAtributos.length === 0 && (
          <button
            type="button"
            onClick={applyFashionPreset}
            className="w-full rounded-2xl border border-dashed border-violet-200 bg-white/70 p-5 text-left transition hover:border-violet-400 hover:bg-violet-50 dark:border-violet-900/40 dark:bg-slate-900/40 dark:hover:bg-violet-950/20"
          >
            <span className="block text-sm font-black text-gray-900 dark:text-white">Configurar tallas y colores</span>
            <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">Ejemplo: Color Negro/Blanco/Beige y Talla S/M/L.</span>
          </button>
        )}

        {opcionesAtributos.map((option, index) => (
          <div key={index} className="grid gap-3 rounded-2xl border border-gray-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900 md:grid-cols-[180px_1fr_40px]">
            <label className="block">
              <span className="mb-1 block text-[10px] font-black uppercase tracking-wide text-gray-500">Opción</span>
              <input
                type="text"
                placeholder="Color / Talla"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold outline-none focus:border-violet-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                value={option.nombre}
                onChange={(event) => updateOptionName(index, event.target.value)}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[10px] font-black uppercase tracking-wide text-gray-500">Valores separados por coma</span>
              <input
                type="text"
                placeholder="Ej: Negro, Blanco, Beige"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold outline-none focus:border-violet-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                value={(option.valores || []).join(', ')}
                onChange={(event) => updateOptionValues(index, event.target.value)}
              />
            </label>
            <button
              type="button"
              onClick={() => removeOption(index)}
              className="mt-5 flex h-10 w-10 items-center justify-center rounded-xl text-red-500 transition hover:bg-red-50 dark:hover:bg-red-950/30"
              title="Eliminar opción"
            >
              <Icon icon="solar:trash-bin-trash-bold" width={18} />
            </button>
          </div>
        ))}
      </div>

      {colorValues.length > 0 && (
        <div className="mt-5 rounded-2xl border border-white/70 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-950/20">
          <div className="mb-3 flex items-center justify-between">
            <h6 className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">Imágenes por color</h6>
            <span className="text-[11px] font-semibold text-violet-600 dark:text-violet-300">Se aplican a todas sus tallas</span>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {colorValues.map((color) => {
              const rowWithImage = rows.find(
                (row) => row.valoresAtributos?.[colorOptionName] === color && (row.imagenUrlDisplay || row.imagenUrl),
              );
              const preview = variantImagePreviews[color] || rowWithImage?.imagenUrlDisplay || rowWithImage?.imagenUrl || '';
              return (
                <div key={color} className="rounded-2xl border border-gray-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-black text-gray-800 dark:text-white">{color}</span>
                    {(preview || variantImageFiles[color]) && (
                      <button type="button" onClick={() => removeColorImage(color)} className="text-[10px] font-bold text-red-500">
                        Quitar
                      </button>
                    )}
                  </div>
                  <label className="flex h-24 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-gray-300 bg-gray-50 text-center text-[11px] font-bold text-gray-500 transition hover:border-violet-400 dark:border-slate-700 dark:bg-slate-800">
                    {preview ? (
                      <img src={preview} alt={color} className="h-full w-full object-cover" />
                    ) : (
                      <span>
                        <Icon icon="solar:gallery-add-bold-duotone" width={22} className="mx-auto mb-1" />
                        Subir imagen
                      </span>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => handleColorImage(color, event.target.files?.[0])}
                    />
                  </label>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {rows.length > 0 && (
        <div className="mt-5 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-[10px] font-black uppercase tracking-wide text-gray-500 dark:border-slate-700 dark:bg-slate-800">
                <tr>
                  <th className="px-4 py-3">Variante</th>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">Precio</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">Barras</th>
                  <th className="px-4 py-3">Activo</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const key = comboKey(row.valoresAtributos);
                  return (
                    <tr key={key} className="border-b border-gray-100 last:border-0 dark:border-slate-800">
                      <td className="px-4 py-3">
                        <div className="font-black text-gray-900 dark:text-white">
                          {Object.values(row.valoresAtributos).join(' / ')}
                        </div>
                        <div className="text-[11px] text-gray-500">
                          {Object.entries(row.valoresAtributos).map(([name, value]) => `${name}: ${value}`).join(' · ')}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          value={row.codigo || ''}
                          onChange={(event) => updateVariant(key, { codigo: event.target.value })}
                          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold outline-none focus:border-violet-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          step="0.01"
                          value={row.precioUnitario ?? 0}
                          onChange={(event) => updateVariant(key, { precioUnitario: Number(event.target.value || 0) })}
                          className="w-28 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold outline-none focus:border-violet-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={row.stock ?? 0}
                          onChange={(event) => updateVariant(key, { stock: Number(event.target.value || 0) })}
                          className="w-24 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold outline-none focus:border-violet-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          value={row.codigoBarras || ''}
                          onChange={(event) => updateVariant(key, { codigoBarras: event.target.value })}
                          placeholder="Opcional"
                          className="w-36 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold outline-none focus:border-violet-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => updateVariant(key, { estado: row.estado === 'INACTIVO' ? 'ACTIVO' : 'INACTIVO' })}
                          className={`rounded-full px-3 py-1 text-[11px] font-black ${
                            row.estado === 'INACTIVO'
                              ? 'bg-gray-100 text-gray-500 dark:bg-slate-800'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                          }`}
                        >
                          {row.estado === 'INACTIVO' ? 'Inactivo' : 'Activo'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
