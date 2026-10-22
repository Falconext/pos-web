import { useMemo, useState } from 'react';
import { baseApiPublica } from '@/pages/admin/perfil/ClavesApiCard';
import {
    RUTAS,
    codigoPara,
    leerCuerpo,
    necesitaId,
    rutaPorId,
    tipoDeClave,
    urlDe,
    type Lenguaje,
    type Respuesta,
} from './ApiKrezkaModel';

const cuerpoInicial = (id: string) => {
    const c = rutaPorId(id).cuerpo;
    return c ? JSON.stringify(c, null, 2) : '';
};

/**
 * El probador llama a la API pública directo desde el navegador, con la
 * clave que pega el usuario —no con su sesión del panel—: así ve exactamente
 * lo mismo que verá su web, errores incluidos.
 */
export function useApiKrezkaViewModel() {
    const base = baseApiPublica();
    const [rutaId, setRutaId] = useState(RUTAS[0].id);
    const ruta = rutaPorId(rutaId);
    const [clave, setClave] = useState('');
    const [id, setId] = useState('');
    const [query, setQuery] = useState(RUTAS[0].query ?? '');
    const [cuerpo, setCuerpo] = useState(cuerpoInicial(RUTAS[0].id));
    const [lenguaje, setLenguaje] = useState<Lenguaje>('curl');
    const [enviando, setEnviando] = useState(false);
    const [respuesta, setRespuesta] = useState<Respuesta | null>(null);
    const [error, setError] = useState<string | null>(null);

    const elegir = (nuevo: string) => {
        setRutaId(nuevo);
        setQuery(rutaPorId(nuevo).query ?? '');
        setCuerpo(cuerpoInicial(nuevo));
        setRespuesta(null);
        setError(null);
    };

    const url = urlDe(base, ruta, id, query);
    const conCuerpo = ruta.metodo === 'POST' || ruta.metodo === 'PATCH';
    const cuerpoLeido = conCuerpo ? leerCuerpo(cuerpo) : ({ ok: true, valor: undefined } as const);
    const codigo = useMemo(
        () => codigoPara(lenguaje, ruta, url, cuerpoLeido.ok ? cuerpoLeido.valor : ruta.cuerpo),
        [lenguaje, ruta, url, cuerpo], // eslint-disable-line react-hooks/exhaustive-deps
    );
    const tipo = tipoDeClave(clave.trim());
    const escribeDeVerdad = tipo === 'live' && conCuerpo;

    const enviar = async () => {
        setError(null);
        setRespuesta(null);
        if (!tipo) return setError('Pega una clave que empiece con sk_test_ (de prueba) o sk_live_ (real).');
        if (necesitaId(ruta) && !id.trim()) return setError('Esta ruta necesita el id (del producto o de la venta).');
        if (!cuerpoLeido.ok) return setError(cuerpoLeido.error);
        setEnviando(true);
        const inicio = performance.now();
        try {
            const res = await fetch(url, {
                method: ruta.metodo,
                headers: {
                    Authorization: `Bearer ${clave.trim()}`,
                    ...(conCuerpo ? { 'Content-Type': 'application/json' } : {}),
                    ...(ruta.idempotente ? { 'Idempotency-Key': crypto.randomUUID() } : {}),
                },
                body: conCuerpo && cuerpoLeido.valor !== undefined ? JSON.stringify(cuerpoLeido.valor) : undefined,
            });
            const texto = await res.text();
            let bonito = texto;
            try {
                bonito = JSON.stringify(JSON.parse(texto), null, 2);
            } catch {
                /* no es JSON: se muestra tal cual */
            }
            setRespuesta({ estado: res.status, ms: Math.round(performance.now() - inicio), cuerpo: bonito });
        } catch {
            setError('No se pudo conectar con la API. Revisa tu conexión e inténtalo otra vez.');
        } finally {
            setEnviando(false);
        }
    };

    const usarClave = (nueva: string, entorno: 'test' | 'live') => {
        if (entorno === 'test') setClave(nueva);
    };

    return {
        base,
        ruta,
        rutaId,
        elegir,
        clave,
        setClave,
        tipo,
        escribeDeVerdad,
        id,
        setId,
        query,
        setQuery,
        cuerpo,
        setCuerpo,
        conCuerpo,
        url,
        lenguaje,
        setLenguaje,
        codigo,
        enviar,
        enviando,
        respuesta,
        error,
        usarClave,
    };
}

export type ApiKrezkaVM = ReturnType<typeof useApiKrezkaViewModel>;
