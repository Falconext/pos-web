import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../zustand/auth'

interface RoleRouteProps {
  children: React.ReactNode
  allowedRoles: string[]
  fallbackPath?: string
}

export function RoleRoute({ children, allowedRoles, fallbackPath = '/administrador' }: RoleRouteProps) {
  const { auth, isLoading } = useAuthStore()

  if (isLoading) return null

  if (!auth) {
    return <Navigate to="/login" replace />
  }

  if (!allowedRoles.includes(auth.rol)) {
    return <Navigate to={fallbackPath} replace />
  }

  return <>{children}</>
}
