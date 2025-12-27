import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import CajaControl from './components/CajaControl';
import CajaHistorial from './components/CajaHistorial';

const CajaIndex: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'CONTROL' | 'HISTORIAL'>('CONTROL');

    return (
        <div className="space-y-6 max-w-8xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Icon icon="solar:cash-out-bold-duotone" className="text-blue-600" />
                    Gestión de Caja
                </h1>
                <p className="text-sm text-gray-500 mt-1">Control de turnos, apertura, cierre y reportes de caja</p>
            </div>

            {/* Tabs */}
            <div className="flex p-1 bg-gray-100 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('CONTROL')}
                    className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'CONTROL'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <Icon icon="solar:shop-2-bold-duotone" className="text-lg" />
                    Control de Caja
                </button>
                <button
                    onClick={() => setActiveTab('HISTORIAL')}
                    className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'HISTORIAL'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <Icon icon="solar:history-bold-duotone" className="text-lg" />
                    Historial de Turnos
                </button>
            </div>

            {/* Content */}
            <div className="mt-6">
                {activeTab === 'CONTROL' && <CajaControl />}
                {activeTab === 'HISTORIAL' && <CajaHistorial />}
            </div>
        </div>
    );
};

export default CajaIndex;
