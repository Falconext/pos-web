# FLUJO COMPLETO DE PAGOS - Explicación Detallada

## EL PROBLEMA ACTUAL

El modal aparece y desaparece porque:
1. El hook `usePaymentFlow` abre el modal
2. ComprobantesInformales tiene OTRO estado `isOpenModalPagoParcial`
3. Hay conflicto de estados - uno cierra el otro abre

## LA SOLUCIÓN: FLUJO CORRECTO

### PASO 1: Usuario hace clic en "Pago Parcial"
```
ComprobantesInformales.tsx línea 113
↓
handleCompletePay(data) se ejecuta
```

### PASO 2: Inicializar modal de pago
```typescript
const handleCompletePay = (data: any) => {
    setFormValues(data);
    setPaymentType('PAGO_PARCIAL');
    // IMPORTANTE: Solo abrir el modal local
    setIsOpenModalPagoParcial(true);
    // NO inicializar paymentFlow aquí
}
```

### PASO 3: Modal abierto muestra ModalPaymentUnified
```
ComprobantesInformales.tsx línea 381-402
↓
{isOpenModalPagoParcial && (
    <ModalPaymentUnified
        isOpen={isOpenModalPagoParcial}
        ...
    />
)}
```

### PASO 4: Usuario ingresa monto y confirma en modal
```
ModalPaymentUnified.tsx línea 248
↓
onConfirm(monto, medioPago) se ejecuta
↓
handleConfirmPago(monto, medioPago) en ComprobantesInformales
```

### PASO 5: Procesar pago en backend
```typescript
const handleConfirmPago = async (monto: number, medioPago: string) => {
    setIsLoadingPago(true);
    try {
        // 1. Procesar en backend
        const result = await completePay(formValues, medioPago, monto);
        
        if (result.success) {
            // 2. Cerrar modal de pago
            setIsOpenModalPayment(false);
            
            // 3. MOSTRAR RECIBO
            setShowReceipt(true);
            setReceiptData({
                comprobante: formValues,
                payment: result.payment,
                nuevoSaldo: result.nuevoSaldo,
            });
        }
    } finally {
        setIsLoadingPago(false);
    }
}
```

### PASO 6: Mostrar recibo
```
Se muestra PaymentReceipt modal
↓
Usuario puede imprimir o cerrar
↓
onClose() limpia todo y recarga tabla
```

---

## CÓDIGO CORRECTO PARA ComprobantesInformales.tsx

```typescript
// Estados necesarios
const [isOpenModalPagoParcial, setIsOpenModalPagoParcial] = useState(false);
const [paymentType, setPaymentType] = useState<PaymentType>('PAGO_PARCIAL');
const [formValues, setFormValues] = useState<any>({});
const [isLoadingPago, setIsLoadingPago] = useState(false);

// Mostrar recibo
const [showReceipt, setShowReceipt] = useState(false);
const [receiptData, setReceiptData] = useState<any>(null);

// PASO 1: Usuario hace clic en "Pago Parcial"
const handleCompletePay = (data: any) => {
    setFormValues(data);
    setPaymentType('PAGO_PARCIAL');
    setIsOpenModalPagoParcial(true);
}

// PASO 4 + 5: Confirmar pago
const handleConfirmPago = async (monto: number, medioPago: string) => {
    setIsLoadingPago(true);
    try {
        const result = await completePay(formValues, medioPago, monto);
        
        if (result.success) {
            // Cerrar modal de pago
            setIsOpenModalPagoParcial(false);
            
            // Mostrar recibo
            setShowReceipt(true);
            setReceiptData({
                comprobante: formValues,
                montoPagado: monto,
                medioPago: medioPago,
                nuevoSaldo: result.nuevoSaldo || (formValues.saldo - monto),
                numeroRecibo: `REC-${Date.now()}`,
            });
        }
    } finally {
        setIsLoadingPago(false);
    }
}

// PASO 6: Cerrar recibo y recargar
const handleCloseReceipt = async () => {
    setShowReceipt(false);
    setReceiptData(null);
    
    // Recargar tabla
    setTimeout(() => {
        getAllInvoices({
            tipoComprobante: "INFORMAL",
            page: currentPage,
            limit: itemsPerPage,
            search: debounce,
            fechaInicio: fechaInicio,
            fechaFin: fechaFin,
            estadoPago: stateInvoice !== "TODOS" ? stateInvoice : ""
        });
    }, 500);
}

// EN EL RETURN:
return (
    <>
        {/* Modal de pago - PASO 3 */}
        {isOpenModalPagoParcial && (
            <ModalPaymentUnified
                isOpen={isOpenModalPagoParcial}
                isLoading={isLoadingPago}
                paymentType={paymentType}
                saldoPendiente={parseFloat(formValues?.saldo?.replace('S/ ', '') || 0)}
                totalComprobante={parseFloat(formValues?.total?.replace('S/ ', '') || 0)}
                comprobanteInfo={{
                    id: formValues.id,
                    serie: formValues.serie,
                    correlativo: formValues.correlativo,
                    cliente: formValues.client,
                    total: parseFloat(formValues?.total?.replace('S/ ', '') || 0)
                }}
                onConfirm={handleConfirmPago}  // PASO 5
                onCancel={() => setIsOpenModalPagoParcial(false)}
            />
        )}
        
        {/* Recibo - PASO 6 */}
        {showReceipt && receiptData && (
            <PaymentReceipt
                comprobante={receiptData.comprobante}
                payment={{
                    tipo: paymentType,
                    monto: receiptData.montoPagado,
                    medioPago: receiptData.medioPago,
                }}
                numeroRecibo={receiptData.numeroRecibo}
                nuevoSaldo={receiptData.nuevoSaldo}
                company={auth}
                onClose={handleCloseReceipt}
            />
        )}
    </>
)
```

---

## FLUJO VISUAL

```
┌─────────────────────────────────────────────────────────────┐
│ TABLA DE NOTAS DE PEDIDO                                    │
│ [Fecha] [Serie] [Cliente] [Saldo] [💵 Pago Parcial]        │
└─────────────────────────────────────────────────────────────┘
                           ↓
                    Click "💵 Pago Parcial"
                           ↓
            ┌───────────────────────────────┐
            │  MODAL 1: Ingresa Monto       │
            │  [Input: 100]                 │
            │  [Método: Efectivo] [Confirmar│
            └───────────────────────────────┘
                           ↓
                  Backend procesa pago
                           ↓
         Modal 1 se cierra automáticamente
                           ↓
            ┌───────────────────────────────┐
            │  MODAL 2: Recibo de Pago      │
            │  Comprobante: NP-001-0001    │
            │  Monto Pagado: S/ 100        │
            │  Saldo Nuevo: S/ 500         │
            │  [🖨️ Imprimir] [Cerrar]      │
            └───────────────────────────────┘
                           ↓
                  Usuario imprime o cierra
                           ↓
         Modal 2 se cierra y tabla se recarga
```

---

## EL PROBLEMA CON usePaymentFlow

`usePaymentFlow` es un hook genérico pero **NO debería controlar los modales de ComprobantesInformales**.

**Lo correcto es:**
- ComprobantesInformales maneja sus propios estados
- Solo usa el backend para procesar el pago
- Muestra 2 modales en secuencia:
  1. Modal de input (ModalPaymentUnified)
  2. Modal de recibo (PaymentReceipt)

---

## CAMBIOS NECESARIOS

### 1. Eliminar uso de `paymentFlow` en ComprobantesInformales
```typescript
// ANTES (mal):
const paymentFlow = usePaymentFlow();  // ❌ NO USAR AQUÍ

// DESPUÉS (correcto):
// Solo usar estados locales
const [isOpenModalPagoParcial, setIsOpenModalPagoParcial] = useState(false);
const [showReceipt, setShowReceipt] = useState(false);
```

### 2. Simplificar handleConfirmPago
```typescript
// ANTES (confuso):
const result = await paymentFlow.processPayment(...)

// DESPUÉS (claro):
const result = await completePay(formValues, medioPago, monto);
if (result.success) {
    // Mostrar recibo
}
```

### 3. Agregar handleCloseReceipt
```typescript
const handleCloseReceipt = () => {
    setShowReceipt(false);
    setReceiptData(null);
    // Recargar datos
    getAllInvoices({...});
}
```

---

## RESUMEN

**¿Por qué desaparece el modal?**
- Porque hay conflicto entre `paymentFlow.isLoading` y estados locales
- El modal intenta sincronizarse con 2 sistemas diferentes

**Solución:**
- Usar SOLO estados locales en ComprobantesInformales
- Mantener `paymentFlow` solo para OrdenesDeTrabajoPage si lo necesitas
- 2 modales secuenciales: Input → Recibo
- Flujo claro: Click → Modal 1 → Backend → Modal 2 → Recarga

Este es el flujo correcto y completo.
