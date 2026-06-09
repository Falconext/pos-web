import React from 'react';
import { Icon } from '@iconify/react';
import { cn } from '@/utils/cn';

interface BarcodeScannerInputProps {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onScan?: (value: string) => void;
    inputRef?: React.RefObject<HTMLInputElement | null>;
    loading?: boolean;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    label?: string;
    name?: string;
    error?: boolean;
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
    error = false,
}) => {
    return (
        <div className={cn('relative group', className)}>
            {label && (
                <label className="block text-[12px] font-bold text-gray-700 dark:text-gray-300 mb-1.5 ml-1 uppercase">
                    {label}
                </label>
            )}
            <div className="relative">
                <Icon
                    icon="solar:barcode-bold-duotone"
                    className={cn(
                        "absolute left-3 top-1/2 -translate-y-1/2 transition-colors",
                        loading ? "text-violet-500" : error ? "text-red-500" : "text-gray-400 dark:text-gray-500"
                    )}
                    width={20}
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
                            if (value.trim()) {
                                onScan?.(value.trim());
                            }
                        }
                    }}
                    placeholder={placeholder}
                    disabled={disabled || loading}
                    autoComplete="off"
                    className={cn(
                        "w-full rounded-xl border border-gray-200 bg-white pl-10 pr-10 py-2.4 text-sm text-gray-900 border-solid placeholder:text-gray-400 font-medium dark:bg-[#1E293B] dark:border-slate-800 dark:text-gray-300 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 transition-all duration-150 shadow-sm",
                        error 
                            ? "border-red-300 focus:ring-red-100 focus:border-red-500 dark:border-red-900/50" 
                            : "focus:ring-violet-100 focus:border-violet-500 dark:focus:ring-violet-900/20 dark:focus:border-violet-500",
                        disabled && "opacity-50 cursor-not-allowed bg-gray-50 dark:bg-slate-900"
                    )}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                    {loading ? (
                        <Icon
                            icon="solar:refresh-bold"
                            className="animate-spin text-violet-500"
                            width={16}
                        />
                    ) : error ? (
                        <Icon
                            icon="solar:danger-bold"
                            className="text-red-500"
                            width={16}
                        />
                    ) : null}
                </div>
            </div>
        </div>
    );
};
