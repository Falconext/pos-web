import React from 'react';
import { Icon } from '@iconify/react';
import { useLogisticaStore } from '@/zustand/logistica';
import { Card, Title, Text, Metric, Flex, Grid, Color } from '@tremor/react';

export default function LogisticaDashboard() {
  // En un caso real, estas métricas vendrían del backend.
  // Usamos valores de prueba para la demostración visual.
  const categories: {
    title: string;
    metric: string;
    icon: string;
    color: Color;
  }[] = [
    {
      title: 'Pedidos Pendientes',
      metric: '24',
      icon: 'solar:box-minimalistic-bold-duotone',
      color: 'amber',
    },
    {
      title: 'Despachos en Curso',
      metric: '5',
      icon: 'solar:route-bold-duotone',
      color: 'blue',
    },
    {
      title: 'Conductores Activos',
      metric: '12',
      icon: 'solar:user-bold-duotone',
      color: 'indigo',
    },
    {
      title: 'Entregas Exitosas (Hoy)',
      metric: '84',
      icon: 'solar:check-circle-bold-duotone',
      color: 'emerald',
    },
  ];

  return (
    <div className="min-h-screen px-2 pb-4 relative z-1 dark:bg-[#0A0D14]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Dashboard Logístico</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Resumen general de operaciones y estado de flota</p>
      </div>

      <Grid numItemsSm={2} numItemsLg={4} className="gap-6">
        {categories.map((item) => (
          <Card key={item.title} decoration="top" decorationColor={item.color} className="dark:bg-[#111827] dark:border-slate-800">
            <Flex justifyContent="start" className="space-x-4">
              <div className={`p-3 rounded-xl bg-${item.color}-100 dark:bg-${item.color}-900/30 text-${item.color}-600 dark:text-${item.color}-400`}>
                <Icon icon={item.icon} width={28} />
              </div>
              <div className="truncate">
                <Text className="dark:text-gray-400">{item.title}</Text>
                <Metric className="dark:text-white">{item.metric}</Metric>
              </div>
            </Flex>
          </Card>
        ))}
      </Grid>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="dark:bg-[#111827] dark:border-slate-800">
          <Title className="dark:text-white">Últimos Pedidos Asignados</Title>
          <div className="mt-4 flex flex-col gap-3">
            {[1,2,3].map(i => (
              <div key={i} className="p-3 rounded-lg border border-gray-100 dark:border-slate-700 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center">
                    <Icon icon="solar:box-bold" width={16}/>
                  </div>
                  <div>
                    <p className="text-sm font-semibold dark:text-white">PED-{1000 + i}</p>
                    <p className="text-xs text-gray-500">Cliente {i} S.A.C.</p>
                  </div>
                </div>
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">Asignado</span>
              </div>
            ))}
          </div>
        </Card>
        <Card className="dark:bg-[#111827] dark:border-slate-800">
          <Title className="dark:text-white">Estado de la Flota (Demo)</Title>
          <div className="mt-4 flex flex-col gap-3">
            {[1,2,3].map(i => (
              <div key={i} className="p-3 rounded-lg border border-gray-100 dark:border-slate-700 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center">
                    <Icon icon="solar:car-bold" width={16}/>
                  </div>
                  <div>
                    <p className="text-sm font-semibold dark:text-white">Vehículo ABC-{123+i}</p>
                    <p className="text-xs text-gray-500">Conductor: Juan Pérez</p>
                  </div>
                </div>
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1">
                  <Icon icon="solar:map-point-bold" /> En Ruta
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
