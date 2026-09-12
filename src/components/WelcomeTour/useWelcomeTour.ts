import { useState, useCallback } from 'react';
import { IUser } from '@/interfaces/auth';

export interface TourStep {
    /** Código del módulo del sidebar (Modulo.codigo). */
    modulo: string;
    /** Código del submódulo a resaltar (SubModulo.codigo). Si falta, se resalta el módulo. */
    sub?: string;
    /** Alternativas por si el plan no tiene ese submódulo/módulo (se prueban en orden). */
    alternativas?: Array<{ modulo: string; sub?: string }>;
    title: string;
    description: string;
    icon: string;
    position: 'right' | 'bottom' | 'left';
}

/**
 * Recorrido de bienvenida: cada paso resalta un ítem REAL del menú lateral.
 * Los módulos con submódulos se abren solos y se resalta el submódulo (antes
 * el tour buscaba anclas que no existían y decía "no estuvo visible").
 */
export const TOUR_STEPS: TourStep[] = [
    {
        modulo: 'dashboard',
        title: 'Dashboard',
        description: 'Tus ventas, cobros y métricas del negocio en tiempo real.',
        icon: 'solar:home-angle-bold-duotone',
        position: 'right',
    },
    {
        modulo: 'comprobantes',
        sub: 'comprobantes:emitir',
        title: 'Facturación',
        description: 'Emite boletas, facturas y tickets con validez SUNAT en segundos.',
        icon: 'solar:bill-list-bold-duotone',
        position: 'right',
    },
    {
        modulo: 'kardex',
        sub: 'kardex:productos',
        title: 'Kardex',
        description: 'Desde aquí controlas inventario, movimientos, lotes y reservas.',
        icon: 'solar:box-bold-duotone',
        position: 'right',
    },
    {
        modulo: 'usuarios',
        sub: 'usuarios:clientes',
        alternativas: [{ modulo: 'clientes' }],
        title: 'Clientes',
        description: 'Registro de clientes con DNI/RUC para emitir comprobantes.',
        icon: 'solar:users-group-rounded-bold-duotone',
        position: 'right',
    },
    {
        modulo: 'comprobantes',
        sub: 'comprobantes:cotizaciones',
        alternativas: [{ modulo: 'cotizaciones' }],
        title: 'Cotizaciones',
        description: 'Crea presupuestos y conviértelos en facturas con un clic.',
        icon: 'solar:document-text-bold-duotone',
        position: 'right',
    },
];

const getTourKey = (userId: number) => `tour:done:${userId}`;

export const useWelcomeTour = (user: IUser | null) => {
    const userId = user?.id;
    const alreadySeen = userId ? localStorage.getItem(getTourKey(userId)) === '1' : true;

    const [showModal, setShowModal] = useState(!alreadySeen);
    const [tourStep, setTourStep] = useState<number | null>(null);

    const markDone = useCallback(() => {
        if (userId) localStorage.setItem(getTourKey(userId), '1');
    }, [userId]);

    const startTour = useCallback(() => {
        setShowModal(false);
        markDone();
        setTourStep(0);
    }, [markDone]);

    const skipTour = useCallback(() => {
        setShowModal(false);
        markDone();
    }, [markDone]);

    const nextStep = useCallback(() => {
        setTourStep(prev => {
            if (prev === null) return null;
            if (prev >= TOUR_STEPS.length - 1) { return null; }
            return prev + 1;
        });
    }, []);

    const prevStep = useCallback(() => {
        setTourStep(prev => (prev !== null && prev > 0 ? prev - 1 : prev));
    }, []);

    const endTour = useCallback(() => setTourStep(null), []);

    return { showModal, tourStep, startTour, skipTour, nextStep, prevStep, endTour };
};
