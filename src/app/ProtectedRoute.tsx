import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../zustand/auth'
import Loading from '@/components/Loading'


export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { auth, isLoading } = useAuthStore()
  const hasAccessToken = typeof window !== 'undefined' && !!localStorage.getItem('ACCESS_TOKEN')

  if (!hasAccessToken) {
    return <Navigate to="/login" replace />
  }

  if (isLoading) return <Loading />
  if (!auth) return <Navigate to="/login" replace />
  return <>{children}</>
}
