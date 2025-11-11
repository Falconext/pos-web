import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../zustand/auth'  
import Alert from '@/components/Alert'


export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { auth, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Alert />
      </div>
    )
  }

  if (!auth) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
