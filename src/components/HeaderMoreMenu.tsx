import { useState } from 'react';
import { Icon } from '@iconify/react';
import TableActionMenu from '@/components/TableActionMenu';
import { cn } from '@/utils/cn';

export interface HeaderMoreMenuItem {
    key: string;
    label: string;
    icon?: string;
    onClick: () => void;
    disabled?: boolean;
    /** Color del texto del ítem (default: gris). */
    tone?: 'default' | 'primary' | 'danger' | 'success' | 'rose';
}

interface HeaderMoreMenuProps {
    items: HeaderMoreMenuItem[];
    /** Clases extra para el botón "Más" (p. ej. `lg:hidden` para ocultarlo en desktop). */
    className?: string;
    label?: string;
}

const TONE_CLASS: Record<NonNullable<HeaderMoreMenuItem['tone']>, string> = {
    default: 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700',
    primary: 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20',
    danger: 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20',
    success: 'text-emerald-600 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20',
    rose: 'text-rose-600 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-900/20',
};

/**
 * Botón "Más" con menú desplegable para agrupar las acciones secundarias de la
 * cabecera de una página (exportar, importar, configurar formato…) en tablet/móvil.
 * Reutiliza el mismo TableActionMenu que usan las tablas para mantener el estilo.
 */
export default function HeaderMoreMenu({ items, className, label = 'Más' }: HeaderMoreMenuProps) {
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const isOpen = Boolean(anchorEl);
    const close = () => setAnchorEl(null);

    if (!items.length) return null;

    return (
        <>
            <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={isOpen}
                onClick={(e) => setAnchorEl(isOpen ? null : e.currentTarget)}
                className={cn(
                    'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-200 dark:hover:bg-slate-700 sm:py-2.5',
                    className,
                )}
            >
                <Icon icon="solar:menu-dots-bold" className="text-lg" />
                {label}
                <Icon icon={isOpen ? 'solar:alt-arrow-up-linear' : 'solar:alt-arrow-down-linear'} className="text-sm" />
            </button>
            <TableActionMenu isOpen={isOpen} anchorEl={anchorEl} onClose={close} className="min-w-[220px]">
                {items.map((item) => (
                    <button
                        key={item.key}
                        type="button"
                        disabled={item.disabled}
                        onClick={() => { close(); item.onClick(); }}
                        className={cn(
                            'flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50',
                            TONE_CLASS[item.tone || 'default'],
                        )}
                    >
                        {item.icon && <Icon icon={item.icon} width={18} height={18} className="shrink-0" />}
                        <span className="truncate">{item.label}</span>
                    </button>
                ))}
            </TableActionMenu>
        </>
    );
}
