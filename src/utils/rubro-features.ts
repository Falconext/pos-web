/**
 * Helper para detectar funcionalidades automáticamente según el rubro
 * ⚡ DETECCIÓN AUTOMÁTICA - Sin configuración manual
 */

export interface RubroFeatures {
    gestionLotes: boolean;           // Farmacia / Fabricación
    requiereVencimientos: boolean;   // Farmacia/Alimentos
    usaCodigoBarras: boolean;        // Bodega/Supermarket
    permiteFraccionamiento: boolean; // Farmacia
    gestionOfertas: boolean;         // Supermarket
    controlStock: boolean;           // Todos (siempre true)
}

/**
 * Farmacia retail: farmacia o botica. Habilita receta médica y fraccionamiento.
 * NO incluye droguería (mayorista sin dispensación al público).
 */
export function esFarmaciaRetailRubro(nombre: string | null | undefined): boolean {
    if (!nombre) return false;
    const n = nombre.toLowerCase();
    return n.includes('farmacia') || n.includes('botica');
}

/**
 * Droguería: mayorista farmacéutico. Habilita FEFO + vencimientos + cadena de frío.
 * Sin receta médica ni fraccionamiento.
 */
export function esDrogueriaRubro(nombre: string | null | undefined): boolean {
    if (!nombre) return false;
    const n = nombre.toLowerCase();
    return n.includes('drogueria') || n.includes('droguería');
}

/**
 * Cualquier rubro farmacéutico regulado (farmacia, botica o droguería).
 * Activa FEFO, vencimientos y cadena de frío.
 */
export function usaLotesFarmaciaRubro(nombre: string | null | undefined): boolean {
    return esFarmaciaRetailRubro(nombre) || esDrogueriaRubro(nombre);
}

export function esRubroFabricacion(
    nombreRubro: string | null | undefined,
): boolean {
    if (!nombreRubro) return false;
    const nombre = nombreRubro.toLowerCase();
    return (
        nombre.includes('fabricación') ||
        nombre.includes('fabricacion') ||
        nombre.includes('manufactura') ||
        nombre.includes('industria') ||
        nombre.includes('producción') ||
        nombre.includes('produccion')
    );
}

type FeatureOverrides = {
    usaCodigoBarrasManual?: boolean | null;
};

/**
 * Detecta automáticamente las funcionalidades según el nombre del rubro
 */
export function detectarFuncionesRubro(
    nombreRubro: string | null | undefined,
    overrides?: FeatureOverrides,
): RubroFeatures {
    if (!nombreRubro) {
        return {
            gestionLotes: false,
            requiereVencimientos: false,
            usaCodigoBarras:
                typeof overrides?.usaCodigoBarrasManual === 'boolean'
                    ? overrides.usaCodigoBarrasManual
                    : false,
            permiteFraccionamiento: false,
            gestionOfertas: false,
            controlStock: true,
        };
    }

    const nombre = nombreRubro.toLowerCase();

    // FARMACIA / BOTICA (retail — vende al público, requiere receta)
    const esFarmacia = nombre.includes('farmacia') || nombre.includes('botica');

    // DROGUERÍA (mayorista — distribuye a empresas, sin dispensación al público)
    const esDrogueria = nombre.includes('drogueria') || nombre.includes('droguería');

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

    // FABRICACIÓN / MANUFACTURA
    const esFabricacion = esRubroFabricacion(nombreRubro);

    const usaCodigoBarras =
        typeof overrides?.usaCodigoBarrasManual === 'boolean'
            ? overrides.usaCodigoBarrasManual
            : esBodega;

    return {
        // Lotes: Farmacia, droguería y fabricación
        gestionLotes: esFarmacia || esFabricacion || esDrogueria,

        // Vencimientos: Farmacia, droguería y alimentos
        requiereVencimientos: esFarmacia || esAlimentos || esDrogueria,

        // Código de barras: Bodega/Supermarket
        usaCodigoBarras,

        // Fraccionamiento (venta por unidad de caja): solo Farmacia retail, NO droguería
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
export function useRubroFeatures(
    nombreRubro: string | null | undefined,
    overrides?: FeatureOverrides,
): RubroFeatures {
    return detectarFuncionesRubro(nombreRubro, overrides);
}

/**
 * Helpers rápidos para casos específicos
 */
export const RubroHelpers = {
    usaLotes: (_nombreRubro: string | null | undefined) => true,

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
