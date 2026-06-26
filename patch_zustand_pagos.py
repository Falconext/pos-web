import re

with open('src/zustand/pagos.ts', 'r') as f:
    content = f.read()

old_getHistorial = """      getHistorialPagos: async (comprobanteId: number) => {
        try {
          const resp: any = await get(`pago/comprobante/${comprobanteId}/historial`);
          if (resp.code === 1 && resp.data) {
            // Respuesta con wrapper code/data
            return {
              success: true,
              pagos: resp.data.pagos || [],
              totalPagado: resp.data.totalPagado || 0
            };
          } else if (resp.comprobanteId || resp.pagos) {
            // Respuesta directa del backend
            return {
              success: true,
              pagos: resp.pagos || [],
              totalPagado: resp.totalPagado || 0
            };
          } else {
            return { success: false, error: 'Error al obtener historial' };
          }
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      },"""

new_getHistorial = """      getHistorialPagos: async (comprobanteId: number) => {
        try {
          const resp: any = await get(`pago/comprobante/${comprobanteId}/historial`);
          
          let pagos = [];
          let totalPagado = 0;
          
          if (resp?.data?.pagos) {
             pagos = resp.data.pagos;
             totalPagado = resp.data.totalPagado || 0;
          } else if (resp?.pagos) {
             pagos = resp.pagos;
             totalPagado = resp.totalPagado || 0;
          } else if (Array.isArray(resp?.data)) {
             pagos = resp.data;
             totalPagado = pagos.reduce((acc, p) => acc + (Number(p.monto) || 0), 0);
          } else if (Array.isArray(resp)) {
             pagos = resp;
             totalPagado = pagos.reduce((acc, p) => acc + (Number(p.monto) || 0), 0);
          } else {
             console.error("Respuesta inesperada en getHistorialPagos:", resp);
             return { success: false, error: 'Respuesta inválida del servidor' };
          }
          
          return {
            success: true,
            pagos: pagos,
            totalPagado: totalPagado
          };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      },"""

content = content.replace(old_getHistorial, new_getHistorial)

with open('src/zustand/pagos.ts', 'w') as f:
    f.write(content)

