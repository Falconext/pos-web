import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../zustand/auth';
import { hasPermission } from '@/utils/permissions';
import Loading from '@/components/Loading';

interface ModuleRouteProps {
  /** Código del módulo requerido (ej. 'logistica'). */
  module: string;
  /** Si se omite, se renderiza <Outlet/> (útil para agrupar rutas hijas). */
  children?: React.ReactNode;
  fallbackPath?: string;
}

/**
 * Protege rutas por módulo del plan. Deja pasar solo si el plan de la empresa
 * incluye el módulo (o el usuario es ADMIN_SISTEMA). Reusa `hasPermission`,
 * que ya valida la capa de plan y la de permisos de usuario.
 */
export function ModuleRoute({
  module,
  children,
  fallbackPath = '/administrador',
}: ModuleRouteProps) {
  const { auth, isLoading } = useAuthStore();
  const hasAccessToken =
    typeof window !== 'undefined' && !!localStorage.getItem('ACCESS_TOKEN');

  if (!hasAccessToken) {
    return <Navigate to="/login" replace />;
  }

  if (!auth) {
    if (isLoading) return <Loading />;
    return <Navigate to="/login" replace />;
  }

  if (!hasPermission(auth, module)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children ?? <Outlet />}</>;
}
