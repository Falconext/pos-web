import { FC } from 'react';
import { ITableHeaderProps } from '../types';

const TableHeader: FC<ITableHeaderProps> = ({ columns, colorFont, onSort, actions }) => {
    return (
        <thead>
            <tr>
                {columns.map((column) => {
                    const isObject = typeof column === 'object';
                    const key = isObject ? column.key : (column as string);
                    const label = isObject ? column.label : (column as string);
                    return (
                        <th key={key} style={{ color: colorFont }} onClick={() => onSort(key)}>
                            {label}
                        </th>
                    );
                })}
                {actions && actions.length ? <th>Acciones</th> : ''}
            </tr>
        </thead>
    );
};

export default TableHeader;