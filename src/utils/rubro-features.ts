/**
 * Helper para detectar funcionalidades automáticamente según el rubro
 * ⚡ DETECCIÓN AUTOMÁTICA - Sin configuración manual
 */

export interface RubroFeatures {
    gestionLotes: boolean;           // Farmacia/Botica
    requiereVencimientos: boolean;   // Farmacia/Alimentos
    usaCodigoBarras: boolean;        // Bodega/Supermarket
    permiteFraccionamiento: boolean; // Farmacia
    gestionOfertas: boolean;         // Supermarket
    controlStock: boolean;           // Todos (siempre true)
}

/**
 * Detecta automáticamente las funcionalidades según el nombre del rubro
 */
export function detectarFuncionesRubro(nombreRubro: string | null | undefined): RubroFeatures {
    if (!nombreRubro) {
        return {
            gestionLotes: false,
            requiereVencimientos: false,
            usaCodigoBarras: false,
            permiteFraccionamiento: false,
            gestionOfertas: false,
            controlStock: true,
        };
    }

    const nombre = nombreRubro.toLowerCase();

    // FARMACIA / BOTICA
    const esFarmacia = nombre.includes('farmacia') || nombre.includes('botica');

    // BODEGA / SUPERMARKET / MINIMARKET  
    const esBodega =
        nombre.includes('bodega') ||
        nombre.includes('supermarket') ||
        nombre.includes('supermercado') ||
        nombre.includes('minimarket') ||
        nombre.includes('abarrotes');

    // ALIMENTOS (restaurante, panadería, etc.)
    const esAlimentos =
        nombre.includes('restaurante') ||
        nombre.includes('panadería') ||
        nombre.includes('panaderia') ||
        nombre.includes('pastelería') ||
        nombre.includes('pasteleria');

    return {
        // Lotes: Farmacia principalmente
        gestionLotes: esFarmacia,

        // Vencimientos: Farmacia y alimentos
        requiereVencimientos: esFarmacia || esAlimentos,

        // Código de barras: Bodega/Supermarket
        usaCodigoBarras: esBodega,

        // Fraccionamiento (venta por unidad de caja): Farmacia
        permiteFraccionamiento: esFarmacia,

        // Ofertas/Promociones: Supermarket
        gestionOfertas: esBodega,

        // Control de stock: TODOS
        controlStock: true,
    };
}

/**
 * Hook para usar en componentes de React
 */
export function useRubroFeatures(nombreRubro: string | null | undefined): RubroFeatures {
    return detectarFuncionesRubro(nombreRubro);
}

/**
 * Helpers rápidos para casos específicos
 */
export const RubroHelpers = {
    usaLotes: (nombreRubro: string | null | undefined) => {
        if (!nombreRubro) return false;
        const nombre = nombreRubro.toLowerCase();
        return nombre.includes('farmacia') || nombre.includes('botica');
    },

    usaCodigoBarras: (nombreRubro: string | null | undefined) => {
        if (!nombreRubro) return false;
        const nombre = nombreRubro.toLowerCase();
        return (
            nombre.includes('bodega') ||
            nombre.includes('supermarket') ||
            nombre.includes('supermercado') ||
            nombre.includes('minimarket')
        );
    },

    esRestaurante: (nombreRubro: string | null | undefined) => {
        if (!nombreRubro) return false;
        return nombreRubro.toLowerCase().includes('restaurante');
    },
};
