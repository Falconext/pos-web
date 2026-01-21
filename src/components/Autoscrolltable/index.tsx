import { useRef, useState, useEffect } from 'react';
import styles from './autoScrollTable.module.css';
import Button from '../Button';
import { Icon } from '@iconify/react';

interface AutoScrollTableProps {
    children: React.ReactNode;
    scrollSpeed?: number;
    intervalTime?: number;
}

const AutoScrollTable = ({
    children,
    scrollSpeed = 100,
    intervalTime = 0,
}: AutoScrollTableProps) => {
    const tableContainerRef = useRef<HTMLDivElement>(null);
    const [isScrollingRight, setIsScrollingRight] = useState(false);
    const [isScrollingLeft, setIsScrollingLeft] = useState(false);

    // Función para desplazar hacia la derecha
    const scrollRight = () => {
        if (tableContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = tableContainerRef.current;
            // Si no hemos llegado al final, seguimos desplazándonos
            if (scrollLeft + clientWidth < scrollWidth) {
                tableContainerRef.current.scrollLeft += scrollSpeed;
            } else {
                // Si llegamos al final, detenemos el desplazamiento
                setIsScrollingRight(false);
            }
        }
    };

    // Función para desplazar hacia la izquierda
    const scrollLeft = () => {
        if (tableContainerRef.current) {
            const { scrollLeft } = tableContainerRef.current;
            // Si no hemos llegado al inicio, seguimos desplazándonos
            if (scrollLeft > 0) {
                tableContainerRef.current.scrollLeft -= scrollSpeed;
            } else {
                // Si llegamos al inicio, detenemos el desplazamiento
                setIsScrollingLeft(false);
            }
        }
    };

    // Efecto para manejar el desplazamiento hacia la derecha
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isScrollingRight) {
            interval = setInterval(scrollRight, intervalTime);
        }
        return () => clearInterval(interval);
    }, [isScrollingRight, scrollSpeed, intervalTime]);

    // Efecto para manejar el desplazamiento hacia la izquierda
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isScrollingLeft) {
            interval = setInterval(scrollLeft, intervalTime);
        }
        return () => clearInterval(interval);
    }, [isScrollingLeft, scrollSpeed, intervalTime]);

    // Iniciar desplazamiento hacia la derecha
    const startScrollRight = () => {
        setIsScrollingLeft(false);
        setIsScrollingRight(true);
    };

    // Iniciar desplazamiento hacia la izquierda
    const startScrollLeft = () => {
        setIsScrollingRight(false);
        setIsScrollingLeft(true);
    };

    const [hasOverflow, setHasOverflow] = useState(false);

    const checkOverflow = () => {
        if (tableContainerRef.current) {
            const { scrollWidth, clientWidth } = tableContainerRef.current;
            setHasOverflow(scrollWidth > clientWidth);
        }
    };

    useEffect(() => {
        checkOverflow();
        window.addEventListener('resize', checkOverflow);
        return () => window.removeEventListener('resize', checkOverflow);
    }, [children]);

    return (
        <div className={styles.autoScrollTable}>
            {hasOverflow && (
                <div className="flex justify-end items-center gap-2 px-4 py-2 rounded-t-xl">
                    <span className="text-xs text-gray-400 font-medium mr-2">Desplazamiento rápido</span>
                    <button
                        onClick={startScrollLeft}
                        disabled={isScrollingLeft}
                        className={`p-1.5 rounded-lg border border-gray-200 transition-all duration-200 ${isScrollingLeft ? 'bg-indigo-50 text-indigo-600 shadow-inner' : 'bg-white text-gray-500 hover:text-indigo-600 hover:border-indigo-200 hover:shadow-sm'}`}
                        title="Ir al inicio"
                    >
                        <Icon icon="solar:double-alt-arrow-left-bold-duotone" width={20} height={20} />
                    </button>

                    <button
                        onClick={startScrollRight}
                        disabled={isScrollingRight}
                        className={`p-1.5 rounded-lg border border-gray-200 transition-all duration-200 ${isScrollingRight ? 'bg-indigo-50 text-indigo-600 shadow-inner' : 'bg-white text-gray-500 hover:text-indigo-600 hover:border-indigo-200 hover:shadow-sm'}`}
                        title="Ir al final"
                    >
                        <Icon icon="solar:double-alt-arrow-right-bold-duotone" width={20} height={20} />
                    </button>
                </div>
            )}
            <div ref={tableContainerRef} className={styles.tableContainer}>
                {children}
            </div>
        </div>
    );
};

export default AutoScrollTable;