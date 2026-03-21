// src/features/admin/facturacion/FacturacionModel.ts

export const tiposComprobanteFormales = [
    { id: "01", value: "FACTURA" }, { id: "03", value: "BOLETA" }, { id: "07", value: "NOTA DE CREDITO" },
    { id: "08", value: "NOTA DE DEBITO" }, { id: "TICKET", value: "TICKET" }, { id: "OT", value: "ORDEN DE TRABAJO" },
    { id: "NV", value: "NOTA DE VENTA" }, { id: "NP", value: "NOTA DE PEDIDO" }, { id: "CP", value: "COMPROBANTE DE PAGO" },
    { id: "RH", value: "RECIBO POR HONORARIO" }
];

export const tiposComprobantesInformales = [
    { id: "TICKET", value: "TICKET" }, { id: "OT", value: "ORDEN DE TRABAJO" }, { id: "NV", value: "NOTA DE VENTA" },
    { id: "NP", value: "NOTA DE PEDIDO" }, { id: "CP", value: "COMPROBANTE DE PAGO" }, { id: "RH", value: "RECIBO POR HONORARIO" },
];

export const tiposCotizacion = [{ id: "COT", value: "COTIZACIÓN" }];

export const metodosContado = ['Efectivo', 'Yape', 'Plin'];
export const metodosCredito = ['Transferencia', 'Tarjeta'];

export interface IRetencionData {
    montoDetraccion: number;
    porcentajeDetraccion: number;
}
