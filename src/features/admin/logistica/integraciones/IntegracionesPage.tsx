import React, { useState } from 'react';
import { Card, Title, Text, TabGroup, TabList, Tab, TabPanels, TabPanel, Button, Badge } from '@tremor/react';
import { Icon } from '@iconify/react';

const IntegracionesPage: React.FC = () => {
  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Title className="text-2xl font-bold">Integraciones Logísticas</Title>
          <Text className="text-gray-500">
            Configura y administra integraciones con sistemas externos (Drivin, APIs propias, Webhooks).
          </Text>
        </div>
      </div>

      <Card className="p-0 overflow-hidden shadow-sm border border-gray-200">
        <TabGroup>
          <div className="px-6 pt-4 border-b border-gray-200">
            <TabList className="flex gap-4">
              <Tab icon={() => <Icon icon="solar:key-bold-duotone" className="mr-2 text-lg" />}>API Keys</Tab>
              <Tab icon={() => <Icon icon="solar:link-bold-duotone" className="mr-2 text-lg" />}>Webhooks</Tab>
              <Tab icon={() => <Icon icon="solar:document-text-bold-duotone" className="mr-2 text-lg" />}>Documentación</Tab>
              <Tab icon={() => <Icon icon="solar:history-bold-duotone" className="mr-2 text-lg" />}>Logs</Tab>
              <Tab icon={() => <Icon icon="solar:code-square-bold-duotone" className="mr-2 text-lg" />}>Sandbox</Tab>
            </TabList>
          </div>
          
          <TabPanels>
            {/* API Keys Panel */}
            <TabPanel>
              <div className="p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">API Keys</h3>
                    <p className="text-sm text-gray-500">Credenciales para autenticar sistemas externos hacia Falconext.</p>
                  </div>
                  <Button size="sm" icon={() => <Icon icon="solar:add-circle-bold-duotone" className="mr-1" />}>
                    Generar Nueva Key
                  </Button>
                </div>
                
                <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Key (Oculta)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Creada</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Drivin Prod</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">sk_prod_...8x9a</td>
                        <td className="px-6 py-4 whitespace-nowrap"><Badge color="emerald">Activa</Badge></td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">hace 2 días</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button className="text-red-600 hover:text-red-900">Revocar</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </TabPanel>

            {/* Webhooks Panel */}
            <TabPanel>
              <div className="p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Webhooks</h3>
                    <p className="text-sm text-gray-500">Notifica a tus sistemas cuando ocurran eventos logísticos.</p>
                  </div>
                  <Button size="sm" icon={() => <Icon icon="solar:add-circle-bold-duotone" className="mr-1" />}>
                    Añadir Webhook
                  </Button>
                </div>
                
                <div className="mt-4 border border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center text-center bg-gray-50">
                  <Icon icon="solar:link-broken-bold-duotone" className="text-4xl text-gray-400 mb-2" />
                  <p className="text-gray-600 font-medium">No hay webhooks configurados</p>
                  <p className="text-sm text-gray-500 mt-1">Crea un webhook para recibir actualizaciones en tiempo real de tus pedidos y despachos.</p>
                </div>
              </div>
            </TabPanel>

            {/* Docs Panel */}
            <TabPanel>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Documentación API</h3>
                <div className="prose max-w-none text-sm text-gray-700">
                  <p>La API de Falconext Logística permite crear y gestionar pedidos externamente. Base URL: <code>https://api.falconext.pe/api/v1/logistics</code></p>
                  <h4 className="font-semibold mt-4">Endpoints Principales:</h4>
                  <ul className="list-disc pl-5 mt-2 space-y-2">
                    <li><code>POST /orders</code>: Crear un nuevo pedido logístico.</li>
                    <li><code>POST /orders/bulk</code>: Crear múltiples pedidos.</li>
                    <li><code>GET /orders/:id/status</code>: Obtener estado del pedido.</li>
                    <li><code>POST /orders/:id/cancel</code>: Cancelar pedido.</li>
                  </ul>
                  <h4 className="font-semibold mt-4">Eventos de Webhook:</h4>
                  <ul className="list-disc pl-5 mt-2">
                    <li><code>delivery.created</code>, <code>delivery.assigned</code>, <code>delivery.started</code>, <code>delivery.arrived</code>, <code>delivery.completed</code>, <code>delivery.failed</code>, <code>delivery.returned</code>, <code>delivery.cancelled</code></li>
                  </ul>
                </div>
              </div>
            </TabPanel>

            {/* Logs Panel */}
            <TabPanel>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Logs de Integración</h3>
                <p className="text-sm text-gray-500 mb-4">Revisa las últimas peticiones entrantes y salientes de tu cuenta.</p>
                <div className="bg-gray-900 rounded-lg p-4 font-mono text-xs text-green-400 overflow-x-auto">
                  <p>[2026-07-09 10:15:22] POST /api/v1/logistics/orders - 201 Created (120ms)</p>
                  <p>[2026-07-09 10:18:05] GET /api/v1/logistics/orders/1502/status - 200 OK (45ms)</p>
                  <p className="text-red-400">[2026-07-09 10:20:12] POST /api/v1/logistics/orders - 400 Bad Request - "Missing externalOrderId"</p>
                </div>
              </div>
            </TabPanel>

            {/* Sandbox Panel */}
            <TabPanel>
              <div className="p-6 flex flex-col gap-4">
                <h3 className="text-lg font-semibold">Sandbox de Pruebas</h3>
                <p className="text-sm text-gray-500">Envía peticiones de prueba a la API sin afectar tus datos reales.</p>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-mono text-sm font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded">POST /orders</span>
                  </div>
                  <textarea 
                    className="w-full h-48 p-3 font-mono text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500" 
                    defaultValue={`{\n  "externalOrderId": "EXT-9921",\n  "cliente": {\n    "nombre": "Juan Perez",\n    "telefono": "999888777"\n  },\n  "direccion": "Av. Principal 123",\n  "pesoTotalKg": 2.5\n}`}
                  />
                  <div className="mt-4 flex justify-end">
                    <Button icon={() => <Icon icon="solar:play-bold" className="mr-2" />}>
                      Ejecutar Petición
                    </Button>
                  </div>
                </div>
              </div>
            </TabPanel>
          </TabPanels>
        </TabGroup>
      </Card>
    </div>
  );
};

export default IntegracionesPage;
