import axios from 'axios'
import { useAuthStore } from '@/zustand/auth'

const BASE_URL = import.meta.env.VITE_API_URL || 'https://api.falconext.pe/api'

let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (err: any) => void
}> = []

function processQueue(error: any, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    error ? reject(error) : resolve(token!)
  })
  failedQueue = []
}

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor: inject access token
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('ACCESS_TOKEN')
  if (token && config.headers) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

// Response interceptor: handle token refresh
apiClient.interceptors.response.use(
  res => res,
  async err => {
    const originalReq = err.config
    const status = err.response?.status
    const errorCode = err.response?.data?.code
    const url = (originalReq?.url || '') as string
    const isAuthLogin = url.includes('/auth/login')
    const isAuthRefresh = url.includes('/auth/refresh')

    // Never try to refresh for authentication endpoints
    if (isAuthLogin || isAuthRefresh) {
      return Promise.reject(err)
    }

    if (!originalReq._retry && (status === 401 || errorCode === 21)) {
      originalReq._retry = true

      const storedRefresh = localStorage.getItem('REFRESH_TOKEN')
      if (!storedRefresh) {
        // No refresh token available: reject without redirect to avoid page reloads on login screen
        return Promise.reject(err)
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          originalReq.headers!['Authorization'] = `Bearer ${token}`
          return apiClient(originalReq)
        })
      }

      isRefreshing = true
      try {
        const refreshToken = storedRefresh

        const { data: refreshResp }: any = await axios.post(
          `${BASE_URL}/auth/refresh`,
          { refreshToken }
        )

        // Support both wrapped and plain responses
        const payload = refreshResp?.data && refreshResp?.code !== undefined ? refreshResp.data : refreshResp
        if (!payload?.accessToken || !payload?.refreshToken) {
          throw new Error('Refresh failed')
        }

        const { accessToken, refreshToken: newRt } = payload
        localStorage.setItem('ACCESS_TOKEN', accessToken)
        localStorage.setItem('REFRESH_TOKEN', newRt)

        processQueue(null, accessToken)

        originalReq.headers!['Authorization'] = `Bearer ${accessToken}`
        return apiClient(originalReq)

      } catch (refreshError) {
        processQueue(refreshError, null)
        // Only force logout+redirect if user had tokens stored
        const hadAccess = !!localStorage.getItem('ACCESS_TOKEN')
        const hadRefresh = !!localStorage.getItem('REFRESH_TOKEN')
        if (hadAccess || hadRefresh) {
          useAuthStore.getState().logout()
          window.location.href = '/login'
        }
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(err)
  }
)

export default apiClient
