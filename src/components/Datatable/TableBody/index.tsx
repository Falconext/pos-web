import { ChangeEvent, FC, useEffect, useState } from 'react';
import styles from './../table.module.css';
import { Icon } from '@iconify/react';
import { useInvoiceStore } from '@/zustand/invoices';
import useAlertStore from '@/zustand/alert';

// Componente optimizado para edición local
const EditableCell = ({ value, type, onChange, disabled, className }: any) => {
    const [localValue, setLocalValue] = useState(value);

    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    const handleBlur = () => {
        // Solo notificar si hubo cambios
        if (localValue != value) {
            onChange(localValue);
        }
    };

    const handleKeyDown = (e: any) => {
        if (e.key === 'Enter') {
            e.currentTarget.blur();
        }
    };

    return (
        <input
            type={type}
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className={className}
            disabled={disabled}
        />
    );
};

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
                        className={`
                            group transition-colors duration-200
                            ${isCanceled ? 'bg-gray-50' : 'bg-white'}
                        `}
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
                                        color: isCanceled ? '#5b6982ff' : "#000000", // Dim text if canceled
                                        textAlign: (key === 'estado' || key === 'tipo' || key === 'status') ? 'center' : 'left'
                                    }}
                                    className="py-2 bg-[#fff] px-6 text-sm text-gray-600 border-b border-[#E6E7EB]"
                                >
                                    {isEditable ? (
                                        <EditableCell
                                            type={key === 'descripcion' ? 'text' : 'number'}
                                            value={cellValue}
                                            onChange={(newValue: any) =>
                                                handleInputChange(
                                                    index,
                                                    key,
                                                    newValue
                                                )
                                            }
                                            className="w-full py-1.5 px-3 border-0 bg-gray-50 text-gray-700 text-sm rounded-lg focus:ring-2 focus:ring-blue-100 transition-all"
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
                                                className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md text-xs font-medium
                                                    ${cell === 'EMITIDO' || cell === 'ACEPTADO' || cell === 'INGRESO' || cell === 'TRANSFERENCIA' || cell === 'SENT' ? 'bg-emerald-100 text-emerald-700' :
                                                        cell === 'PENDIENTE' || cell === 'PENDIENTE_PAGO' || cell === 'PAGO_PARCIAL' || cell === 'ACTIVO' || cell === 'COMPLETADO' || cell === 'AJUSTE' || cell === 'ENVIANDO' ? 'bg-amber-100 text-amber-700' :
                                                            cell === 'PARTIAL' ? 'bg-blue-100 text-blue-700' :
                                                                cell === 'RECHAZADO' || cell === 'ANULADO' || cell === 'SALIDA' || cell === 'FALLIDO_ENVIO' ? 'bg-red-100 text-red-700' :
                                                                    'bg-gray-100 text-gray-700'
                                                    }`}
                                            >
                                                <span className="capitalize">
                                                    {cell === 'PENDIENTE'
                                                        ? 'Pendiente'
                                                        : cell === 'INGRESO'
                                                            ? 'Ingreso'
                                                            : cell === 'SALIDA'
                                                                ? 'Salida'
                                                                : cell === 'AJUSTE'
                                                                    ? 'Ajuste'
                                                                    : cell === 'TRANSFERENCIA'
                                                                        ? 'Transferencia'
                                                                        : cell === 'ACTIVO'
                                                                            ? 'Activo'
                                                                            : cell === 'EMITIDO'
                                                                                ? 'Emitido'
                                                                                : cell === 'RECHAZADO'
                                                                                    ? 'Rechazado'
                                                                                    : cell === 'ANULADO'
                                                                                        ? 'Anulado'
                                                                                        : cell === 'PENDIENTE_PAGO'
                                                                                            ? 'Pendiente Pago'
                                                                                            : cell === 'PAGO_PARCIAL'
                                                                                                ? 'Parcial'
                                                                                                : cell === 'COMPLETADO'
                                                                                                    ? 'Completado'
                                                                                                    : cell === 'ACEPTADO'
                                                                                                        ? 'Aceptado'
                                                                                                        : cell === 'ENVIANDO'
                                                                                                            ? 'Enviando'
                                                                                                            : cell === 'FALLIDO_ENVIO'
                                                                                                                ? 'Fallido Envío'
                                                                                                                : cell?.toString().toLowerCase()}
                                                </span>
                                            </div>
                                        ) : (
                                            isTruncatable ? (
                                                <span className={`${styles.truncate} font-medium capitalize`} title={cellValue}>
                                                    {cellValue.toLowerCase()}
                                                </span>
                                            ) : (
                                                <div className="flex font-medium">
                                                    {(() => {
                                                        const keyLower = key.toString().toLowerCase();
                                                        const isCode = keyLower.includes('código') || keyLower.includes('codigo') || keyLower.includes('code') || keyLower.includes('serie') || keyLower.includes('seria');
                                                        const isString = typeof cell === 'string';

                                                        if (isString && !isCode) {
                                                            return <span className="capitalize">{cell.toString().toLowerCase()}</span>;
                                                        }
                                                        return cell as React.ReactNode;
                                                    })()}
                                                </div>
                                            )
                                        )}
                                </td>
                            );
                        })}
                        {actions && actions.length > 0 && (
                            <td
                                className={`py-4 px-6 border-b border-[#E6E7EB] sticky right-0 z-10 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)] ${isCanceled ? 'bg-[#fff]' : 'bg-white'}`}
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
                                        <div key={actionIndex} className={styles.tooltipContainer} style={{ marginRight: '8px' }}>
                                            <button
                                                className="p-2 rounded-lg text-gray-500 transition-colors"
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