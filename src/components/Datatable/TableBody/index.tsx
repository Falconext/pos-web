import { ChangeEvent, FC } from 'react';
import styles from './../table.module.css';
import { useInvoiceStore } from '@/zustand/invoices';
import useAlertStore from '@/zustand/alert';


interface ITableBodyProps {
    data: any[];
    colorRow?: string;
    colorFont?: string;
    actions?: any[];
    formValues: any;
    columns: any[];
}

const TableBody: FC<ITableBodyProps> = ({
    data,
    formValues,
    colorFont,
    actions,
    columns
}) => {
    const { updateProductInvoice, productsInvoice } = useInvoiceStore();

    // Función para obtener la cantidad original desde productsInvoice
    const getOriginalQuantity = (row: any) => {
        const originalProduct = productsInvoice.find((item: any) => item.descripcion === row.descripcion);
        if (!originalProduct) {
            return Number(row.cantidad);
        }
        const originalQty = originalProduct.cantidadOriginal !== undefined
            ? Number(originalProduct.cantidadOriginal)
            : Number(originalProduct.cantidad);
        return originalQty;
    };

    // Función para manejar cambios en los inputs
    const handleInputChange = (
        index: number,
        field: string,
        value: string | number
    ) => {
        const updatedProduct = { ...data[index] };
        const originalQuantity = getOriginalQuantity(updatedProduct);
        // Validar la cantidad si el campo es 'quantity'
        if (field === 'cantidad' && formValues?.motivoId === 7) {
            const newQuantity = value === '' ? 0 : Number(value); // Permitir input vacío temporalmente
            // No permitir que la cantidad sea mayor a la original
            if (newQuantity > originalQuantity) {
                useAlertStore.getState().alert("No puedes colocar un número mayor que la cantidad original", "error")
                return; // No actualizar si la cantidad es mayor a la original
            }
            // No permitir valores negativos o cero
            if (newQuantity <= 0 && value !== '') {
                return; // No actualizar si la cantidad es menor o igual a cero
            }
            updatedProduct[field] = value === '' ? '' : newQuantity; // Mantener el valor como string si está vacío
        } else {
            updatedProduct[field] = value;
        }

        // Validar el descuento si el campo es 'descount'
        const descount = parseFloat(updatedProduct.descuento) || 0;
        if (field === 'descuento' && (descount < 0 || descount > 100)) {
            return; // No actualizar si el descuento es inválido
        }

        // Recalcular venta, IGV e importe solo si quantity no está vacío
        if (updatedProduct.cantidad !== '') {
            const unitPrice = parseFloat(updatedProduct.precioUnitario) || 0;
            const quantity = parseFloat(updatedProduct.cantidad) || 1;
            // Calcular venta (sin IGV)
            const sale = (unitPrice * quantity * (1 - descount / 100)) / 1.18;
            updatedProduct.sale = sale.toFixed(2);

            // Calcular IGV (18%)
            const igv = sale * 0.18;
            updatedProduct.igv = igv.toFixed(2);

            // Calcular importe total
            const total = sale + igv;
            updatedProduct.total = total.toFixed(2);

            // Actualizar el store
            updateProductInvoice(index, updatedProduct);
        }
    };

    return (
        <tbody>
            {data.map((row, index) => {
                const isCanceled = formValues === undefined || row.estado === 'cancelado' || row.estado === "completado" || (formValues?.motivoId === 1 || formValues?.motivoId === 2 || formValues?.motivoId === 4 || formValues?.motivoId === 6);
                const hasAddressAndName = row.hasOwnProperty('address') && row.hasOwnProperty('name');
                const isNoteType03 = formValues?.motivoId === 3;
                const isNoteType04 = formValues?.motivoId === 4;
                const isNoteType05 = formValues?.motivoId === 5;
                const isNoteType07 = formValues?.motivoId === 7;
                const isNoteType08 = formValues?.motivoId === 8;
                const isNoteType09 = formValues?.motivoId === 9;
                const isNoteType10 = formValues?.motivoId === 10;
                return (
                    <tr
                        key={index}
                        style={{
                            backgroundColor: isCanceled ? '#24262E' : "#fff",
                            opacity: isCanceled ? 1 : 1,
                        }}
                    >
                        {columns.map((col, cellIndex) => {
                            // Handle logic for column key extraction (similar to TableHeader)
                            const isObject = typeof col === 'object';
                            const key = isObject ? col.key : (col as string);

                            // Access row[key] to get the cell value.
                            const cell = row[key];

                            // Determinar si la celda es editable
                            let isEditable: boolean

                            if (isNoteType05) {
                                // Solo descripcion editable en nota tipo 4
                                isEditable = key === 'precioUnitario'
                            } else
                                if (isNoteType04) {
                                    // Solo descripcion editable en nota tipo 4
                                    isEditable = key === 'precioUnitario'
                                } else if (isNoteType03) {
                                    // Solo descripcion editable en nota tipo 3
                                    isEditable = key === 'descripcion'
                                } else if (isNoteType07) {
                                    // tu vieja regla para notas 07
                                    isEditable = key === 'cantidad' && !isCanceled
                                } else {
                                    // tu regla normal (factura/boleta)
                                    isEditable = ['descripcion', 'cantidad', 'precioUnitario', 'descuento']
                                        .includes(key) && !isCanceled
                                }
                            if (isNoteType08) {
                                isEditable = key === 'precioUnitario'
                            }
                            if (isNoteType09) {
                                isEditable = key === 'precioUnitario'
                            }
                            if (isNoteType10) {
                                isEditable = key === 'precioUnitario'
                            }
                            const cellValue =
                                cell === null || cell === undefined ? '' : cell.toString();
                            const isTruncatable = key === 'direccion' || key === 'nombre' || key === 'razonSocial';

                            return (
                                <td
                                    key={cellIndex}
                                    style={{
                                        color: colorFont,
                                        whiteSpace: hasAddressAndName ? 'normal' : undefined,
                                        overflowWrap: hasAddressAndName ? 'break-word' : undefined,
                                        textAlign: (key === 'estado' || key === 'tipo' || key === 'status') ? 'center' : 'left'
                                    }}
                                >
                                    {isEditable ? (
                                        <input
                                            type={key === 'descripcion' ? 'text' : 'number'}
                                            value={cellValue}
                                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                                handleInputChange(
                                                    index,
                                                    key,
                                                    key === 'descripcion' ? e.target.value : e.target.value
                                                )
                                            }
                                            className="w-full py-1 px-3 border text-[#4d4d4d] text-[13px] border-[#dadada] rounded-xl"
                                            disabled={!isEditable}
                                        />
                                    )

                                        : key === 'stock' || key === 'Stock' ? (
                                            cell !== null && cell !== '' ? (
                                                <p
                                                    className={
                                                        Number(cell) <= 5
                                                            ? ''
                                                            : ''
                                                    }
                                                >
                                                    {cell as React.ReactNode}
                                                </p>
                                            ) : (
                                                // cuando está vacío no le ponemos clase
                                                <p className=''>{cell}</p>
                                            )
                                        ) : key === 'estado' || key === 'tipo' ? (
                                            <div
                                                className={
                                                    cell === 'EMITIDO' || cell === 'ACEPTADO'
                                                        ? styles.successOrder
                                                        : cell === 'ACTIVO'
                                                            ? styles.activeOrder
                                                            : cell === 'PENDIENTE' || cell === 'ENVIANDO'
                                                                ? styles.activeOrder
                                                                : cell === 'RECHAZADO' || cell === 'FALLIDO_ENVIO'
                                                                    ? styles.inactiveOrder
                                                                    : cell === 'PENDIENTE_PAGO'
                                                                        ? styles.activeOrder
                                                                        : cell === 'PAGO_PARCIAL'
                                                                            ? styles.activeOrder
                                                                            : cell === 'COMPLETADO'
                                                                                ? styles.activeOrder
                                                                                : cell === 'INGRESO'
                                                                                    ? styles.successOrder
                                                                                    : cell === 'SALIDA'
                                                                                        ? styles.inactiveOrder
                                                                                        : cell === 'AJUSTE'
                                                                                            ? styles.activeOrder
                                                                                            : cell === 'TRANSFERENCIA'
                                                                                                ? styles.successOrder
                                                                                                : cell === 'ANULADO'
                                                                                                    ? styles.inactiveOrder
                                                                                                    : styles.inactiveOrder
                                                }
                                            >
                                                {cell === 'PENDIENTE'
                                                    ? 'PENDIENTE'
                                                    : cell === 'INGRESO'
                                                        ? 'INGRESO'
                                                        : cell === 'SALIDA'
                                                            ? 'SALIDA'
                                                            : cell === 'AJUSTE'
                                                                ? 'AJUSTE'
                                                                : cell === 'TRANSFERENCIA'
                                                                    ? 'TRANSFERENCIA'
                                                                    : cell === 'ACTIVO'
                                                                        ? 'ACTIVO'
                                                                        : cell === 'EMITIDO'
                                                                            ? 'EMITIDO'
                                                                            : cell === 'RECHAZADO'
                                                                                ? 'RECHAZADO'
                                                                                : cell === 'ANULADO'
                                                                                    ? 'ANULADO'
                                                                                    : cell === 'PENDIENTE_PAGO'
                                                                                        ? 'PENDIENTE DE PAGO'
                                                                                        : cell === 'PAGO_PARCIAL'
                                                                                            ? 'PENDIENTE PAGO'
                                                                                            : cell === 'COMPLETADO'
                                                                                                ? 'COMPLETADO'
                                                                                                : cell === 'ACEPTADO'
                                                                                                    ? 'ACEPTADO'
                                                                                                    : cell === 'ENVIANDO'
                                                                                                        ? 'ENVIANDO'
                                                                                                        : cell === 'FALLIDO_ENVIO'
                                                                                                            ? 'FALLIDO ENVÍO'
                                                                                                            : 'INACTIVO'}
                                            </div>
                                        ) : (
                                            isTruncatable ? (
                                                <span className={styles.truncate} title={cellValue}>
                                                    {cellValue}
                                                </span>
                                            ) : (
                                                <div className="flex">
                                                    {cell as React.ReactNode}
                                                </div>
                                            )
                                        )}
                                </td>
                            );
                        })}
                        {actions && actions.length > 0 && (
                            <td
                                style={{
                                    color: colorFont,
                                    whiteSpace: hasAddressAndName ? 'normal' : undefined,
                                    overflowWrap: hasAddressAndName ? 'break-word' : undefined
                                }}
                                className={styles.tableActions}
                            >
                                {actions.map((action: any, actionIndex: number) => {
                                    // Check condition (legacy)
                                    if (action.condition && !action.condition(row)) {
                                        return null;
                                    }
                                    // Check hide (new property used in Compras module)
                                    if (action.hide && action.hide(row)) {
                                        return null; // Hide the action if hide function returns true
                                    }

                                    const iconElement = typeof action.icon === 'function' ? action.icon(row) : action.icon;
                                    const tooltipText = typeof action.tooltip === 'function' ? action.tooltip(row) : action.tooltip;

                                    return (
                                        <div key={actionIndex} className={styles.tooltipContainer}>
                                            <button
                                                className={styles[`${action.className}`]}
                                                onClick={() => action.onClick(row)}
                                            >
                                                {iconElement}
                                            </button>
                                            <p className={styles.tooltip}>{tooltipText}</p>
                                        </div>
                                    );
                                })}
                            </td>
                        )}
                    </tr>
                );
            })}
        </tbody>
    );
};

export default TableBody;