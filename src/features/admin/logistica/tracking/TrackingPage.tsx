import React, { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import * as api from '@/utils/api/logistica';

export default function TrackingPage() {
  const [conductores, setConductores] = useState<any[]>([]);

  useEffect(() => {
    // Demo fetch
    api.getConductoresTracking().then(res => {
      if(res.success && Array.isArray(res.data)) setConductores(res.data);
    });
  }, []);

  return (
    <div className="min-h-screen px-2 pb-4 relative z-1 dark:bg-[#0A0D14] flex flex-col">
      <div className="mb-4 shrink-0">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Tracking de Flota en Tiempo Real</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Monitorea la ubicación de tus conductores activos</p>
      </div>

      <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 flex items-center justify-center relative overflow-hidden">
        {/* Placeholder de Mapa */}
        <div className="absolute inset-0 opacity-20 dark:opacity-10 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle at center, #6b7280 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
        </div>
        
        <div className="text-center relative z-10 flex flex-col items-center">
          <Icon icon="solar:map-bold-duotone" className="text-violet-500 mb-4" width={64} />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Vista de Mapa (Próximamente)</h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm">
            La integración con Google Maps / Mapbox está planificada para la fase de Microservicios.
          </p>
        </div>
      </div>
    </div>
  );
}
