import React from 'react';
// import { useBatchesViewModel } from './useBatchesViewModel';

export default function BatchesView() {
    // const vm = useBatchesViewModel();

    return (
        <div className='p-6 min-h-screen dark:bg-[#0A0D14]'>
            <h1 className="text-2xl font-bold mb-4 dark:text-white">Gestión de Lotes</h1>
            <div className="bg-white dark:bg-[#111827] p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800">
                <p className="text-gray-500 dark:text-gray-400">Módulo de gestión de lotes en construcción.</p>
            </div>
        </div>
    );
}
