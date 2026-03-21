import { FC } from 'react';
import { ITableHeaderProps } from '../types';

const TableHeader: FC<ITableHeaderProps> = ({ columns, colorFont, onSort, actions }) => {
    return (
        <thead className="bg-transparent">
            <tr>
                {columns.map((column) => {
                    const isObject = typeof column === 'object';
                    const key = isObject ? column.key : (column as string);
                    const label = isObject ? column.label : (column as string);
                    return (
                        <th
                            key={key}
                            style={{ textAlign: (key === 'estado' || key === 'tipo' || key === 'status' || key === 'acciones') ? 'center' : 'left' }}
                            onClick={() => onSort(key)}
                            // Payments style: gray bg, medium text, title case (no uppercase)
                            className="cursor-pointer hover:text-gray-700 transition-colors"
                        >
                            {label}
                        </th>
                    );
                })}
                {actions && actions.length ? (
                    <th className="text-center">
                        Acciones
                    </th>
                ) : ''}
            </tr>
        </thead>
    );
};

export default TableHeader;