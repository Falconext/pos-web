import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { useProductModalViewModel } from '../useProductModalViewModel';

type ViewProps = ReturnType<typeof useProductModalViewModel>;

/**
 * Editores "pegar nada más" para Especificaciones y Destacados de la tienda.
 * Guardan el texto crudo en claves reservadas de `atributosTecnicos`
 * (`__especificacionesTexto` / `__destacadosTexto`). La tienda parsea cada línea
 * como "Etiqueta: Valor" y la muestra ordenada, sin necesidad de llenar campos.
 */
const PLACEHOLDER = `Pega aquí, una línea por dato con formato "Etiqueta: Valor". Ejemplo:
Procesador: Intel Core i7-13620H
Memoria RAM: 16GB DDR5
Almacenamiento: SSD 512GB NVMe
Pantalla: 15.6" FHD 144Hz`;

const PasteBlock: React.FC<{
  open: boolean;
  onToggle: () => void;
  icon: string;
  title: string;
  subtitle: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}> = ({ open, onToggle, icon, title, subtitle, value, onChange, placeholder }) => (
  <div className={`rounded-2xl border transition-all duration-200 overflow-hidden ${open ? 'border-rose-200 dark:border-rose-900/40' : 'border-gray-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-900/50 hover:shadow-sm'}`}>
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between p-4 text-left group bg-white dark:bg-[#1E2435]"
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg transition-colors ${open ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400' : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 group-hover:bg-rose-100 dark:group-hover:bg-rose-900/30 group-hover:text-rose-600 dark:group-hover:text-rose-400'}`}>
          <Icon icon={icon} width={20} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-gray-900 dark:text-white">{title}</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {value.trim() && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400">Activo</span>
        )}
        <Icon icon="solar:alt-arrow-down-bold" width={16} className={`text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </div>
    </button>

    {open && (
      <div className="px-4 pb-4 border-t border-rose-100 dark:border-rose-900/30 pt-4 bg-rose-50/30 dark:bg-rose-950/5">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={7}
          className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-[#1E293B] px-3 py-2.5 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-rose-300 dark:focus:border-rose-700 resize-y font-mono leading-relaxed"
        />
        <div className="flex items-center justify-between mt-3">
          <p className="text-[11px] text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
            <Icon icon="solar:info-circle-linear" width={13} />
            Una línea por dato · formato "Etiqueta: Valor". Se muestra ordenado en la tienda.
          </p>
          {value.trim() && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="text-[11px] text-red-400 hover:text-red-600 transition-colors flex items-center gap-1"
            >
              <Icon icon="solar:trash-bin-minimalistic-linear" width={12} />
              Limpiar
            </button>
          )}
        </div>
      </div>
    )}
  </div>
);

export const ProductPasteSpecs: React.FC<{ vm: ViewProps }> = ({ vm }) => {
  const { productSections, formValues, setFormValues } = vm;
  const [openEspec, setOpenEspec] = useState(false);
  const [openDest, setOpenDest] = useState(false);

  if (!productSections.descripcionRica) return null;

  const attrs = (formValues as any)?.atributosTecnicos || {};
  const setAttr = (key: string, value: string) =>
    setFormValues({
      ...formValues,
      atributosTecnicos: { ...attrs, [key]: value },
    } as any);

  return (
    <div className="mt-4 space-y-3">
      <PasteBlock
        open={openEspec}
        onToggle={() => setOpenEspec((o) => !o)}
        icon="solar:clipboard-list-bold-duotone"
        title="Especificaciones (pegar)"
        subtitle="Pega la ficha completa · se muestra en la pestaña Especificaciones"
        value={String(attrs.__especificacionesTexto || '')}
        onChange={(v) => setAttr('__especificacionesTexto', v)}
        placeholder={PLACEHOLDER}
      />
      <PasteBlock
        open={openDest}
        onToggle={() => setOpenDest((o) => !o)}
        icon="solar:star-bold-duotone"
        title="Destacados (pegar)"
        subtitle="Pega los datos clave · se muestra en el recuadro Destacados"
        value={String(attrs.__destacadosTexto || '')}
        onChange={(v) => setAttr('__destacadosTexto', v)}
        placeholder={`Código: PR035\nMarca: LENOVO\nCategoría: LAPTOP\nStock: 2 unidades\nGarantía: 12 meses`}
      />
    </div>
  );
};
