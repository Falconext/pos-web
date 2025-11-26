import { Icon } from '@iconify/react';

interface HistorialEstado {
    estadoAnterior: string | null;
    estadoNuevo: string;
    creadoEn: string;
    notas?: string;
}

interface LineaTiempoEstadosProps {
    historial: HistorialEstado[];
    estadoActual: string;
}

const ESTADOS_CONFIG = {
    PENDIENTE: {
        label: 'Pendiente',
        icon: 'mdi:clock-outline',
        color: 'yellow',
    },
    CONFIRMADO: {
        label: 'Confirmado',
        icon: 'mdi:check-circle',
        color: 'blue',
    },
    EN_PREPARACION: {
        label: 'En Preparación',
        icon: 'mdi:chef-hat',
        color: 'purple',
    },
    LISTO: {
        label: 'Listo',
        icon: 'mdi:package-variant',
        color: 'green',
    },
    ENTREGADO: {
        label: 'Entregado',
        icon: 'mdi:check-all',
        color: 'gray',
    },
    CANCELADO: {
        label: 'Cancelado',
        icon: 'mdi:close-circle',
        color: 'red',
    },
};

export default function LineaTiempoEstados({
    historial,
    estadoActual,
}: LineaTiempoEstadosProps) {
    const formatearFecha = (fecha: string) => {
        return new Date(fecha).toLocaleString('es-PE', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getColorClass = (color: string, type: 'bg' | 'text' | 'border') => {
        const colors: any = {
            yellow: { bg: 'bg-yellow-500', text: 'text-yellow-600', border: 'border-yellow-500' },
            blue: { bg: 'bg-blue-500', text: 'text-blue-600', border: 'border-blue-500' },
            purple: { bg: 'bg-purple-500', text: 'text-purple-600', border: 'border-purple-500' },
            green: { bg: 'bg-green-500', text: 'text-green-600', border: 'border-green-500' },
            gray: { bg: 'bg-gray-500', text: 'text-gray-600', border: 'border-gray-500' },
            red: { bg: 'bg-red-500', text: 'text-red-600', border: 'border-red-500' },
        };
        return colors[color]?.[type] || colors.gray[type];
    };

    return (
        <div className="space-y-4">
            {historial.map((item, index) => {
                const config = ESTADOS_CONFIG[item.estadoNuevo as keyof typeof ESTADOS_CONFIG];
                const isLast = index === historial.length - 1;

                return (
                    <div key={index} className="flex gap-4">
                        <div className="flex flex-col items-center">
                            <div
                                className={`w-10 h-10 rounded-full ${getColorClass(config.color, 'bg')} flex items-center justify-center`}
                            >
                                <Icon icon={config.icon} className="w-5 h-5 text-white" />
                            </div>
                            {!isLast && (
                                <div className={`w-0.5 h-full min-h-[40px] ${getColorClass(config.color, 'bg')}`} />
                            )}
                        </div>
                        <div className="flex-1 pb-4">
                            <p className="font-semibold">{config.label}</p>
                            <p className="text-sm text-gray-600">{formatearFecha(item.creadoEn)}</p>
                            {item.notas && (
                                <p className="text-sm text-gray-500 mt-1">{item.notas}</p>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
