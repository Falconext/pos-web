import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'node:util';

/**
 * jsdom no trae TextEncoder/TextDecoder y react-router 7 los usa al cargarse:
 * sin esto, cualquier suite que importe react-router-dom moría al requerirlo.
 */
if (typeof globalThis.TextEncoder === 'undefined') {
    (globalThis as any).TextEncoder = TextEncoder;
}
if (typeof globalThis.TextDecoder === 'undefined') {
    (globalThis as any).TextDecoder = TextDecoder;
}

/**
 * `import.meta.env` de Vite no existe en Jest (compila a CommonJS). El
 * transformador de jest/viteEnvTransformer.cjs lo reescribe a esta variable,
 * así que acá viven los valores con los que corren las pruebas.
 */
(globalThis as any).__VITE_ENV__ = {
    VITE_PUBLIC_BRAND: 'krezka',
    ...process.env,
    // Fijos al final a propósito: MODE === 'test' es lo que evita que el store
    // de auth dispare `auth/me` al importarse en cada suite.
    MODE: 'test',
    DEV: false,
    PROD: false,
    SSR: false,
    BASE_URL: '/',
};

/**
 * jsdom no implementa `scrollIntoView`. Lo usa cualquier vista que se abra
 * mostrando el final de una lista — el chat de leads, por ejemplo, que arranca
 * en el último mensaje y no en el de hace tres semanas. Sin este stub el
 * efecto revienta y la prueba falla por algo que no está probando.
 */
if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = function scrollIntoView() {};
}

/**
 * jsdom tampoco trae `ResizeObserver`. Lo usa cualquier vista que mida su
 * propio espacio para llenarlo —la bandeja de leads calcula su alto hasta el
 * borde de la ventana en vez de restarle una constante al 100vh—. Un stub que
 * no observa nada alcanza: en jsdom no hay layout que cambiar.
 */
if (typeof (globalThis as any).ResizeObserver === 'undefined') {
    (globalThis as any).ResizeObserver = class {
        observe() {}
        unobserve() {}
        disconnect() {}
    };
}
