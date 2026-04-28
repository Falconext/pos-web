import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import CajaControl from './components/CajaControl';
import CajaHistorial from './components/CajaHistorial';

const CajaIndex: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'CONTROL' | 'HISTORIAL'>('CONTROL');

    return (
        <div className="space-y-6 max-w-8xl px-2 mx-auto bg-gray-50 dark:bg-[#0A0D14] min-h-screen">
            {/* Header */}
            <div className="pt-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Icon icon="solar:cash-out-bold-duotone" className="text-blue-600 dark:text-blue-400" />
                    Gestión de Caja
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Control de turnos, apertura, cierre y reportes de caja</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4">
                <button
                    onClick={() => setActiveTab('CONTROL')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'CONTROL'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700'
                        }`}
                >
                    <Icon icon="solar:shop-2-bold-duotone" className="text-lg" />
                    Control de Caja
                </button>
                <button
                    onClick={() => setActiveTab('HISTORIAL')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'HISTORIAL'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700'
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
