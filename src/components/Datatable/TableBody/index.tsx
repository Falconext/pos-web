import { FC, useEffect, useState } from 'react';
import styles from './../table.module.css';
import { useInvoiceStore } from '@/zustand/invoices';
import useAlertStore from '@/zustand/alert';
import { motion } from 'framer-motion';
import { listItemFadeUp, listItemHidden, listStagger } from '@/lib/motion/presets';
import { motionTransitions } from '@/lib/motion/transitions';
import { useReducedMotionPreference } from '@/lib/motion/reducedMotion';
import MenuAcciones from '../MenuAcciones';
import { esColumnaMonto, esColumnaPersona, iniciales, tonoAvatar, tonoEstado } from '../columnas';


/**
 * Columnas que se pintan como chip de estado en vez de texto plano.
 *
 * Vive acá y no como una cadena de `||` porque ya pasó: la pantalla de
 * comprobantes renombró su columna a `estadoTabla` (para poder pintar las
 * anulaciones en trámite) y los chips desaparecieron sin que nada fallara —
 * el valor caía al render genérico y salía "Pendiente_conciliacion".
 * Si aparece otra variante, se agrega acá.
 */
const COLUMNAS_DE_ESTADO = new Set([
    'estado', 'estadoTabla', 'tipo', 'status', 'ambiente', 'Ambiente',
]);

const DOCUMENT_TOKEN_CAPTURE_REGEX = /([a-zA-Z0-9]+-[a-zA-Z0-9]+)/g;
const DOCUMENT_TOKEN_REGEX = /^[a-zA-Z0-9]+-[a-zA-Z0-9]+$/;

const CENTERED_KEYS = new Set(['estado', 'estadotabla', 'tipo', 'status', 'acciones']);

const CLASE_TONO_ESTADO = {
    spruce: styles.stSpruce,
    iris: styles.stIris,
    saffron: styles.stSaffron,
    ember: styles.stEmber,
    plain: '',
} as const;

/** Botón de acción fantasma; las acciones destructivas se tiñen al pasar. */
const getButtonStyle = (action: any, row: any): string => {
    const raw = typeof action.tooltip === 'function' ? action.tooltip(row) : (action.tooltip ?? '');
    const peligroso = action.color === 'rose' || /(elim|borra|anula|cancel|delet)/.test(raw.toString().toLowerCase());
    return peligroso ? `${styles.ibtn} ${styles.ibtnDanger}` : styles.ibtn;
};

const EditableCell = ({ value, type, onChange, disabled, className }: any) => {
    const [localValue, setLocalValue] = useState(value);

    useEffect(() => { setLocalValue(value); }, [value]);

    const handleBlur = () => { if (localValue != value) onChange(localValue); };
    const handleKeyDown = (e: any) => { if (e.key === 'Enter') e.currentTarget.blur(); };

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
    onRowClick?: (row: any) => void;
    /** Acciones detrás de un solo botón "⋯" en vez de una fila de íconos. */
    actionsMenu?: boolean;
}

// Un clic sobre algo interactivo de la fila (⋮, casilla, enlace, campo
// editable) hace lo suyo y no abre el detalle.
const ES_INTERACTIVO = 'button, a, input, select, textarea, label, [role="button"], [role="menuitem"]';

const TableBody: FC<ITableBodyProps> = ({ data, formValues, actions, columns, onRowClick, actionsMenu }) => {
    const { updateProductInvoice, productsInvoice } = useInvoiceStore();
    const reduceMotion = useReducedMotionPreference();

    const getOriginalQuantity = (row: any) => {
        const orig = productsInvoice.find((item: any) => item.descripcion === row.descripcion);
        if (!orig) return Number(row.cantidad);
        return orig.cantidadOriginal !== undefined ? Number(orig.cantidadOriginal) : Number(orig.cantidad);
    };

    const handleInputChange = (index: number, field: string, value: string | number) => {
        const updatedProduct = { ...data[index] };
        const originalQuantity = getOriginalQuantity(updatedProduct);

        if (field === 'cantidad' && formValues?.motivoId === 7) {
            const newQuantity = value === '' ? 0 : Number(value);
            if (newQuantity > originalQuantity) {
                useAlertStore.getState().alert("No puedes colocar un número mayor que la cantidad original", "error");
                return;
            }
            if (newQuantity <= 0 && value !== '') return;
            updatedProduct[field] = value === '' ? '' : newQuantity;
        } else {
            updatedProduct[field] = value;
        }

        const descount = parseFloat(updatedProduct.descuento) || 0;
        if (field === 'descuento' && (descount < 0 || descount > 100)) return;

        if (updatedProduct.cantidad !== '') {
            const unitPrice = parseFloat(updatedProduct.precioUnitario) || 0;
            const quantity = parseFloat(updatedProduct.cantidad) || 1;
            const sale = (unitPrice * quantity * (1 - descount / 100)) / 1.18;
            updatedProduct.sale = sale.toFixed(2);
            const igv = sale * 0.18;
            updatedProduct.igv = igv.toFixed(2);
            const total = sale + igv;
            updatedProduct.total = total.toFixed(2);
            updateProductInvoice(index, updatedProduct);
        }
    };

    return (
        <motion.tbody variants={listStagger} initial="initial" animate="animate" exit="exit">
            {data.map((row, index) => {
                const isCanceled = formValues === undefined || row.estado === 'cancelado' || row.estado === 'completado' ||
                    ([1, 2, 4, 6].includes(formValues?.motivoId));
                const isNoteType03 = formValues?.motivoId === 3;
                const isNoteType04 = formValues?.motivoId === 4;
                const isNoteType05 = formValues?.motivoId === 5;
                const isNoteType07 = formValues?.motivoId === 7;
                const isNoteType08 = formValues?.motivoId === 8;
                const isNoteType09 = formValues?.motivoId === 9;
                const isNoteType10 = formValues?.motivoId === 10;

                return (
                    <motion.tr
                        key={index}
                        className={`group transition-colors duration-150 ${onRowClick ? 'cursor-pointer' : ''}`}
                        onClick={onRowClick ? (e: React.MouseEvent) => {
                            if ((e.target as HTMLElement).closest(ES_INTERACTIVO)) return;
                            onRowClick(row);
                        } : undefined}
                        variants={reduceMotion ? undefined : {
                            initial: listItemHidden,
                            animate: listItemFadeUp,
                            exit: listItemHidden,
                        }}
                        initial={reduceMotion ? false : { opacity: 0, y: 10, scale: 0.995 }}
                        animate={reduceMotion ? { opacity: 1 } : {
                            opacity: 1,
                            y: 0,
                            scale: 1,
                            transition: {
                                ...motionTransitions.normal,
                                delay: Math.min(index * 0.028, 0.2),
                            },
                        }}
                        exit={reduceMotion ? { opacity: 0 } : {
                            opacity: 0,
                            y: 6,
                            scale: 0.995,
                            transition: motionTransitions.fast,
                        }}
                        layout
                    >
                        {columns.map((col, cellIndex) => {
                            const isObject = typeof col === 'object';
                            const key = isObject ? col.key : (col as string);
                            const keyLower = key.toString().toLowerCase();
                            const cell = row[key];

                            let isEditable: boolean;
                            if (isNoteType05 || isNoteType04) {
                                isEditable = key === 'precioUnitario';
                            } else if (isNoteType03) {
                                isEditable = key === 'descripcion';
                            } else if (isNoteType07) {
                                isEditable = key === 'cantidad' && !isCanceled;
                            } else {
                                isEditable = ['descripcion', 'cantidad', 'precioUnitario', 'descuento'].includes(key) && !isCanceled;
                            }
                            if (isNoteType08 || isNoteType09 || isNoteType10) isEditable = key === 'precioUnitario';

                            const cellValue = cell === null || cell === undefined ? '' : cell.toString();
                            const isTruncatable = key === 'direccion' || key === 'nombre' || key === 'razonSocial' || key === 'client' || key === 'cliente';
                            const isConceptoColumn = keyLower === 'concepto';
                            const centered = CENTERED_KEYS.has(keyLower);
                            const monto = esColumnaMonto(key) || (isObject && typeof col.label === 'string' && esColumnaMonto(col.label));

                            return (
                                <td
                                    key={cellIndex}
                                    className={monto ? styles.r : undefined}
                                    style={{
                                        color: isCanceled ? '#B8B2A7' : undefined,
                                        textAlign: centered ? 'center' : monto ? 'right' : 'left',
                                    }}
                                >
                                    {isEditable ? (
                                        <EditableCell
                                            type={key === 'descripcion' ? 'text' : 'number'}
                                            value={cellValue}
                                            onChange={(newValue: any) => handleInputChange(index, key, newValue)}
                                            className="w-full py-1.5 px-3 border border-[rgba(40,30,20,0.09)] bg-[#fffdfa] text-[#1d1915] text-sm rounded-[10px] focus:ring-2 focus:ring-[rgba(40,30,20,0.12)] focus:bg-white transition-all dark:bg-slate-900 dark:text-slate-100 dark:border-white/10"
                                            disabled={!isEditable}
                                        />
                                    ) : key === 'stock' || key === 'Stock' ? (
                                        cell !== null && cell !== '' ? (
                                            <span className={Number(cell) <= 5 ? styles.toneEmber : Number(cell) <= 15 ? styles.toneSaffron : styles.toneSpruce}>
                                                {cell as React.ReactNode}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400">—</span>
                                        )
                                    ) : keyLower === 'cantidad' && !isEditable ? (
                                        <span className={Number(cell) > 10 ? styles.toneSpruce : Number(cell) > 0 ? styles.toneSaffron : styles.toneEmber}>
                                            {cell?.toString()}
                                        </span>
                                    ) : COLUMNAS_DE_ESTADO.has(key) ? (
                                        <div className={`${styles.status} ${CLASE_TONO_ESTADO[tonoEstado(cell)]}`}>
                                            {cell === 'ANULACION_EN_TRAMITE' ? 'Anulación en trámite'
                                                : cell === 'ANULACION_NO_CONFIRMADA' ? 'Anulación no confirmada'
                                                : cell === 'PENDIENTE_CONCILIACION' ? 'Conciliación SUNAT'
                                                : cell === 'PENDIENTE' ? 'En procesamiento'
                                                : cell === 'INGRESO' ? 'Ingreso'
                                                : cell === 'SALIDA' ? 'Salida'
                                                : cell === 'AJUSTE' ? 'Ajuste'
                                                : cell === 'TRANSFERENCIA' ? 'Transferencia'
                                                : cell === 'ACTIVO' ? 'Activo'
                                                : cell === 'EMITIDO' ? 'Emitido'
                                                : cell === 'RECHAZADO' ? 'Rechazado'
                                                : cell === 'ANULADO' ? 'Anulado'
                                                : cell === 'PENDIENTE_PAGO' ? 'Pendiente Pago'
                                                : cell === 'PAGO_PARCIAL' ? 'Parcial'
                                                : cell === 'COMPLETADO' ? 'Completado'
                                                : cell === 'ACEPTADO' ? 'Aceptado'
                                                : cell === 'ENVIANDO' ? 'Enviando'
                                                : cell === 'FALLIDO_ENVIO' ? 'Fallido Envío'
                                                : cell === 'PRODUCCIÓN' ? 'Producción'
                                                : cell === 'DEMO' ? 'Demo'
                                                : cell?.toString().toLowerCase()}
                                        </div>
                                    ) : esColumnaPersona(key) && typeof cell === 'string' && cellValue ? (
                                        <span className={styles.person} title={cellValue}>
                                            <span className={`${styles.avatar} ${styles[`av${tonoAvatar(cellValue)}`]}`} aria-hidden="true">
                                                {iniciales(cellValue)}
                                            </span>
                                            <b>{cellValue.toLowerCase()}</b>
                                        </span>
                                    ) : isTruncatable ? (
                                        <span className={`${styles.truncate} capitalize`} title={cellValue}>
                                            {cellValue.toLowerCase()}
                                        </span>
                                    ) : (
                                        <div className="flex">
                                            {(() => {
                                                const isCode = keyLower.includes('código') || keyLower.includes('codigo') || keyLower.includes('code') || keyLower.includes('serie') || keyLower.includes('seria') || keyLower.includes('doc') || keyLower === 'referencia' || keyLower === 'comprobante' || keyLower === 'email' || keyLower.includes('email');
                                                const isString = typeof cell === 'string';

                                                if (isConceptoColumn && isString) {
                                                    const segments = cellValue.split(DOCUMENT_TOKEN_CAPTURE_REGEX);
                                                    return (
                                                        <span className="capitalize">
                                                            {segments.map((segment: string, segIdx: number) => {
                                                                if (!segment) return null;
                                                                const isDocToken = DOCUMENT_TOKEN_REGEX.test(segment);
                                                                return isDocToken ? (
                                                                    <span key={`tok-${segIdx}`} className="uppercase tracking-wide">{segment.toUpperCase()}</span>
                                                                ) : segment.toLowerCase();
                                                            })}
                                                        </span>
                                                    );
                                                }

                                                // Correos/emails siempre en minúscula (nunca capitalizados).
                                                const isEmail = keyLower.includes('correo') || keyLower.includes('email') || keyLower.includes('e-mail');
                                                if (isString && isEmail) {
                                                    return <span className="lowercase" title={cellValue}>{cell.toString().toLowerCase()}</span>;
                                                }

                                                if (isString && !isCode) {
                                                    return <span className="capitalize">{cell.toString().toLowerCase()}</span>;
                                                }
                                                return cell as React.ReactNode;
                                            })()}
                                        </div>
                                    )}
                                </td>
                            );
                        })}

                        {actions && actions.length > 0 && (
                            <td className="text-center">
                                {actionsMenu ? (
                                    <MenuAcciones actions={actions} row={row} />
                                ) : (
                                <div className="flex items-center justify-center gap-1.5">
                                    {actions.map((action: any, actionIndex: number) => {
                                        if (action.condition && !action.condition(row)) return null;
                                        if (action.hide && action.hide(row)) return null;

                                        const iconElement = typeof action.icon === 'function' ? action.icon(row) : action.icon;
                                        const tooltipText = typeof action.tooltip === 'function' ? action.tooltip(row) : action.tooltip;
                                        const btnStyle = getButtonStyle(action, row);

                                        return (
                                            <div key={actionIndex} className={styles.tooltipContainer}>
                                                <button
                                                    type="button"
                                                    onClick={() => action.onClick(row)}
                                                    className={btnStyle}
                                                >
                                                    {iconElement}
                                                </button>
                                                {tooltipText && (
                                                    <p className={styles.tooltip}>{tooltipText}</p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                )}
                            </td>
                        )}
                    </motion.tr>
                );
            })}
        </motion.tbody>
    );
};

export default TableBody;
