import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../zustand/auth';
import { esRubroFabricacion } from '@/utils/rubro-features';

interface ProduccionRouteProps {
  children: React.ReactNode;
  fallbackPath?: string;
}

export function ProduccionRoute({
  children,
  fallbackPath = '/administrador',
}: ProduccionRouteProps) {
  const { auth, isLoading } = useAuthStore();

  if (isLoading) return null;

  if (!auth) {
    return <Navigate to="/login" replace />;
  }

  const habilitado = esRubroFabricacion(auth?.empresa?.rubro?.nombre);
  if (!habilitado) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
}
