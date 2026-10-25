import { FC } from 'react';
import { Icon } from '@iconify/react';
import { ITableHeaderProps } from '../types';
import { esColumnaMonto } from '../columnas';

const CENTERED_KEYS = new Set(['estado', 'estadotabla', 'tipo', 'status', 'acciones']);

const TableHeader: FC<ITableHeaderProps> = ({ columns, onSort, actions, sortColumn, sortDirection }) => {
    return (
        <thead className="bg-transparent">
            <tr>
                {columns.map((column) => {
                    const isObject = typeof column === 'object';
                    const key = isObject ? column.key : (column as string);
                    const label = isObject ? column.label : (column as string);
                    const centered = CENTERED_KEYS.has(key.toLowerCase());
                    const isSorted = sortColumn != null && key === sortColumn;
                    const monto = esColumnaMonto(key) || (typeof label === 'string' && esColumnaMonto(label));
                    return (
                        <th
                            key={key}
                            onClick={() => onSort(key)}
                            aria-sort={isSorted ? (sortDirection === 'asc' ? 'ascending' : 'descending') : undefined}
                            style={{ textAlign: centered ? 'center' : monto ? 'right' : 'left' }}
                            className="select-none"
                        >
                            <span className="inline-flex items-center gap-1">
                                {label}
                                <Icon
                                    icon={!isSorted ? 'solar:sort-vertical-linear' : sortDirection === 'asc' ? 'solar:arrow-up-linear' : 'solar:arrow-down-linear'}
                                    className={`text-[13px] ${isSorted ? 'opacity-100' : 'opacity-60'}`}
                                />
                            </span>
                        </th>
                    );
                })}
                {actions && actions.length > 0 && (
                    <th style={{ textAlign: 'center', cursor: 'default' }}>Acciones</th>
                )}
            </tr>
        </thead>
    );
};

export default TableHeader;
