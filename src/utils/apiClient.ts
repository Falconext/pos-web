import axios from 'axios'
import { useAuthStore } from '@/zustand/auth'

const BASE_URL = import.meta.env.VITE_API_URL

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

    if (!originalReq._retry && (status === 401 || errorCode === 21)) {
      originalReq._retry = true

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
        const refreshToken = localStorage.getItem('REFRESH_TOKEN')
        if (!refreshToken) throw new Error('No refresh token stored')

        const { data: refreshResp }: any = await axios.post(
          `${BASE_URL}/auth/refresh`,
          { refreshToken }
        )

        if (refreshResp.code !== 1) {
          throw new Error('Refresh failed')
        }

        const { accessToken, refreshToken: newRt } = refreshResp.data
        localStorage.setItem('ACCESS_TOKEN', accessToken)
        localStorage.setItem('REFRESH_TOKEN', newRt)

        processQueue(null, accessToken)

        originalReq.headers!['Authorization'] = `Bearer ${accessToken}`
        return apiClient(originalReq)

      } catch (refreshError) {
        processQueue(refreshError, null)
        useAuthStore.getState().logout()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(err)
  }
)

export default apiClient
