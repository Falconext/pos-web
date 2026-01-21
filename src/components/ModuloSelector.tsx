import React, { useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useModulosStore, IModulo } from '@/zustand/modulos';

interface ModuloSelectorProps {
    selectedModulos: number[];
    onModulosChange: (modulos: number[]) => void;
    disabled?: boolean;
}

const getModuleIcon = (codigo: string): string => {
    const iconMap: Record<string, string> = {
        dashboard: 'mdi:view-dashboard',
        comprobantes: 'mdi:file-document',
        clientes: 'mdi:account-group',
        kardex: 'mdi:package-variant',
        reportes: 'mdi:chart-bar',
        configuracion: 'mdi:cog',
        usuarios: 'mdi:account-multiple',
        caja: 'mdi:cash-register',
        pagos: 'mdi:credit-card',
    };
    return iconMap[codigo] || 'mdi:puzzle';
};

export const ModuloSelector: React.FC<ModuloSelectorProps> = ({
    selectedModulos,
    onModulosChange,
    disabled = false
}) => {
    const { modulos, loading, getAllModulos } = useModulosStore();

    useEffect(() => {
        if (modulos.length === 0) {
            getAllModulos();
        }
    }, []);

    const handleToggle = (moduloId: number) => {
        if (disabled) return;

        const isSelected = selectedModulos.includes(moduloId);
        if (isSelected) {
            onModulosChange(selectedModulos.filter(id => id !== moduloId));
        } else {
            onModulosChange([...selectedModulos, moduloId]);
        }
    };

    const handleSelectAll = () => {
        if (disabled) return;
        if (selectedModulos.length === modulos.length) {
            onModulosChange([]);
        } else {
            onModulosChange(modulos.map(m => m.id));
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Icon icon="mdi:loading" className="animate-spin text-blue-600" width={32} />
                <span className="ml-2 text-gray-600">Cargando módulos...</span>
            </div>
        );
    }

    const allSelected = selectedModulos.length === modulos.length && modulos.length > 0;

    return (
        <div>
            <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-600">
                    Seleccionados: <strong>{selectedModulos.length}</strong> de {modulos.length}
                </p>
                <button
                    type="button"
                    onClick={handleSelectAll}
                    disabled={disabled}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {allSelected ? 'Deseleccionar todos' : 'Seleccionar todos'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {modulos.map((modulo: IModulo) => {
                    const isSelected = selectedModulos.includes(modulo.id);

                    return (
                        <button
                            key={modulo.id}
                            type="button"
                            onClick={() => handleToggle(modulo.id)}
                            disabled={disabled}
                            className={`
                relative p-4 rounded-lg border-2 transition-all text-left
                ${isSelected
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`
                  flex-shrink-0 p-2 rounded-lg
                  ${isSelected ? 'bg-blue-100' : 'bg-gray-100'}
                `}>
                                    <Icon
                                        icon={modulo.icono || getModuleIcon(modulo.codigo)}
                                        className={isSelected ? 'text-blue-600' : 'text-gray-600'}
                                        width={24}
                                    />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className={`font-semibold text-sm ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                                            {modulo.nombre}
                                        </h4>
                                        {isSelected && (
                                            <Icon
                                                icon="mdi:check-circle"
                                                className="text-blue-600 flex-shrink-0"
                                                width={18}
                                            />
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-600 line-clamp-2">
                                        {modulo.descripcion}
                                    </p>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {modulos.length === 0 && !loading && (
                <div className="text-center py-8 text-gray-500">
                    No hay módulos disponibles
                </div>
            )}
        </div>
    );
};

export default ModuloSelector;
