import { useRef, useState, useEffect } from 'react';
import styles from './autoScrollTable.module.css';
import Button from '../Button';

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

    return (
        <div className={styles.autoScrollTable}>
            <div className="flex justify-between items-center px-4 py-3 border-b border-[#e5e7eb]">
                <Button
                    onClick={startScrollLeft}
                    disabled={isScrollingLeft}
                    color="lila"
                    outline
                    title="Desplazar hacia la izquierda"
                >
                    Inicio
                </Button>

                <Button
                    onClick={startScrollRight}
                    disabled={isScrollingRight}
                    color="lila"
                    outline
                    title="Desplazar hacia la derecha"
                >
                    Final
                </Button>
            </div>
            <div ref={tableContainerRef} className={styles.tableContainer}>
                {children}
            </div>
        </div>
    );
};

export default AutoScrollTable;