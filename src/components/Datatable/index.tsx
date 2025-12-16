import { FC, useState, useEffect, useMemo } from 'react';
import TableHeader from './TableHeader';
import TableBody from './TableBody';
import { IDataTableProps } from './types';
import styles from './table.module.css';
import AutoScrollTable from '../Autoscrolltable';
// import notfound from './../../assets/svg/logoblack.svg';

const DataTable: FC<IDataTableProps> = ({ formValues, headerColumns, bodyData, color, idTable, colorFont, colorRow, actions }: any) => {

    const [data, setData] = useState(bodyData);

    const resolvedColumns = useMemo(() => {
        if (!Array.isArray(headerColumns)) return headerColumns;

        const rows = Array.isArray(bodyData) ? bodyData : [];
        const sample = rows.length > 0 ? rows[0] : undefined;
        if (!sample || typeof sample !== 'object') return headerColumns;

        const sampleKeys = Object.keys(sample);

        const normalize = (value: string) =>
            value
                .toString()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .toLowerCase()
                .replace(/[^a-z0-9]/g, '');

        const aliases: Record<string, string[]> = {
            nro: ['correlativo', 'numero', 'nro', 'nrodoc', 'numdoc'],
            ot: ['numeroot', 'numeroordentrabajo', 'ordentrabajo', 'ot'],
            producto: ['descripcion', 'producto'],
            unimed: ['unidadmedida', 'unidad'],
            pu: ['preciounitario', 'precio'],
            venta: ['sale', 'venta'],
            importe: ['total', 'monto', 'mtoimpventa', 'importe'],
            nrodocumento: ['ruc', 'nrodoc', 'numdoc', 'document', 'documento'],
            opergravada: ['montogravadas', 'mtoopergravadas', 'mtoopergravada', 'opergravada', 'gravadas', 'gravada'],
            igv: ['montoigv', 'mtoigv', 'igv'],
            docafiliado: ['documentoafiliado', 'numdocafectado', 'documentoafectado'],
            numdoc: ['document', 'nrodoc', 'numdoc'],
        };

        const resolveKey = (label: string) => {
            if (Object.prototype.hasOwnProperty.call(sample, label)) return label;

            const labelNorm = normalize(label);

            const exactNorm = sampleKeys.find((k) => normalize(k) === labelNorm);
            if (exactNorm) return exactNorm;

            const aliasList = aliases[labelNorm];
            if (aliasList) {
                for (const aliasNorm of aliasList) {
                    const match = sampleKeys.find((k) => normalize(k) === aliasNorm);
                    if (match) return match;
                }
            }

            const minLen = 4;
            if (labelNorm.length >= minLen) {
                const fuzzy = sampleKeys.find((k) => {
                    const nk = normalize(k);
                    const shortLen = Math.min(nk.length, labelNorm.length);
                    if (shortLen < minLen) return false;
                    return nk.includes(labelNorm) || labelNorm.includes(nk);
                });
                if (fuzzy) return fuzzy;
            }

            return label;
        };

        return headerColumns.map((col: any) => {
            if (typeof col === 'object' && col && 'key' in col && 'label' in col) return col;
            const label = col as string;
            return { label, key: resolveKey(label) };
        });
    }, [headerColumns, bodyData]);

    useEffect(() => {
        setData(bodyData);
    }, [bodyData]);

    const handleSort = (column: string) => {
        const sortedData = [...data].sort((a, b) => (a[column] > b[column] ? 1 : -1));
        setData(sortedData);
    };

    return (
        <AutoScrollTable>
            <div className="shadow-md rounded-lg">
                {
                    data?.length > 0 ?
                        <table className={styles.table} id={idTable} style={{ backgroundColor: color }}>
                            <TableHeader columns={resolvedColumns} colorFont={colorFont} onSort={handleSort} actions={actions} />
                            <TableBody
                                formValues={formValues} data={data} colorRow={colorRow} colorFont={colorFont} actions={actions} columns={resolvedColumns} />
                        </table>
                        : <div className={styles.not__data}>
                            <div className='text-center mx-auto mt-48'>
                                {/* <img className='text-center mx-auto' src={""} alt="" /> */}
                                <div>
                                    <p className='font-bold'>Al parecer no hemos encontrado un registro de dicha búsqueda, inténtelo nuevamente al hacer una nueva búsqueda.</p>
                                </div>
                            </div>

                        </div>
                }
            </div>
        </AutoScrollTable>
    );
};

export default DataTable;



