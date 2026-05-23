import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../zustand/auth'


export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { auth, isLoading } = useAuthStore()
  const hasAccessToken = typeof window !== 'undefined' && !!localStorage.getItem('ACCESS_TOKEN')

  if (!hasAccessToken) {
    return <Navigate to="/login" replace />
  }

  if (auth) {
    return <>{children}</>
  }

  // Si ya hay token, permitimos renderizar mientras se hidrata `auth/me`
  // para evitar bloqueos infinitos del loader en sesiones válidas.
  if (hasAccessToken && isLoading) {
    return <>{children}</>
  }

  return <Navigate to="/login" replace />
}
