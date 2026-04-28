import React from 'react';
import { Icon } from '@iconify/react';
import { cn } from '@/utils/cn';

interface BarcodeScannerInputProps {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onScan?: (value: string) => void;
    inputRef?: React.RefObject<HTMLInputElement>;
    loading?: boolean;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    label?: string;
    name?: string;
}

export const BarcodeScannerInput: React.FC<BarcodeScannerInputProps> = ({
    value,
    onChange,
    onScan,
    inputRef,
    loading = false,
    placeholder = 'Escanear código de barras...',
    disabled = false,
    className,
    label,
    name,
}) => {
    return (
        <div className={cn('relative', className)}>
            {label && (
                <label className="block text-sm font-[400] text-gray-900 dark:!text-gray-300 mb-2">
                    {label}
                </label>
            )}
            <div className="relative">
                <Icon
                    icon="solar:barcode-bold-duotone"
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none"
                    width={18}
                />
                <input
                    ref={inputRef}
                    type="text"
                    name={name}
                    value={value}
                    onChange={onChange}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            e.stopPropagation();
                            onScan?.(value);
                        }
                    }}
                    placeholder={placeholder}
                    disabled={disabled || loading}
                    autoComplete="off"
                    className="w-full rounded-lg border border-gray-200 bg-white pl-9 pr-9 py-2.5 text-sm text-[#6B7280] placeholder:text-[#6B7280] font-[300] dark:bg-[#131620] dark:border-slate-800 dark:text-gray-300 dark:placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-100 focus:border-gray-400 dark:focus:ring-slate-800 dark:focus:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-slate-900 transition-all duration-150"
                />
                {loading && (
                    <Icon
                        icon="solar:refresh-bold"
                        className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-violet-400 pointer-events-none"
                        width={16}
                    />
                )}
            </div>
        </div>
    );
};
