import { FC } from 'react';
import { ITableHeaderProps } from '../types';

const TableHeader: FC<ITableHeaderProps> = ({ columns, colorFont, onSort, actions }) => {
    return (
        <thead className="bg-gray-50 border-b border-gray-200">
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
                            className="py-3 px-6 text-xs font-medium text-gray-500 border-none cursor-pointer hover:text-gray-700 transition-colors"
                        >
                            {label}
                        </th>
                    );
                })}
                {actions && actions.length ? (
                    <th className="py-3 px-6 text-xs font-medium text-gray-500 border-none text-center sticky right-0 z-20 bg-gray-50 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)]">
                        Acciones
                    </th>
                ) : ''}
            </tr>
        </thead>
    );
};

export default TableHeader;