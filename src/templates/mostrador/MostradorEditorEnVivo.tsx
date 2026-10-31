import { lazy, Suspense, useCallback, useMemo, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/zustand/auth';

// Solo el dueño lo ve: se carga aparte para no sumar peso a la tienda de los clientes.
const StoreLiveEditorDrawer = lazy(() => import('@/components/tienda/StoreLiveEditorDrawer'));

/**
 * "Personalizar tienda" en Mostrador. Esta plantilla no tiene portada (el inicio
 * redirige al catálogo), así que el editor en vivo que monta el inicio nunca se
 * veía: se monta aquí con la misma lógica que `pages/tienda/[slug].tsx`
 * (solo el dueño, `?edit=1` lo abre, los cambios se ven al instante).
 */
export function useEditorEnVivo(slug: string | undefined, diseno: any): { diseno: any; editor: ReactNode } {
  const auth = useAuthStore((s) => s.auth);
  const [params] = useSearchParams();
  const [cambios, setCambios] = useState<Record<string, any>>({});
  const disenoVivo = useMemo(() => (Object.keys(cambios).length ? { ...(diseno || {}), ...cambios } : diseno), [diseno, cambios]);
  const onChange = useCallback((campos: Record<string, any>) => setCambios((prev) => ({ ...prev, ...campos })), []);
  const esDueno = !!slug && !!auth?.empresa?.slugTienda && auth.empresa.slugTienda === slug;

  const editor = esDueno ? (
    <Suspense fallback={null}>
      <StoreLiveEditorDrawer slug={slug || ''} diseno={disenoVivo} onChange={onChange} defaultOpen={params.get('edit') === '1'} />
    </Suspense>
  ) : null;
  return { diseno: disenoVivo, editor };
}
