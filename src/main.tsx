import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { BRANDING_STORAGE_KEY, type BrandConfig } from './lib/branding'

const inferDefaultBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:4001/api'
    }
    if (/^192\.168\./.test(hostname) || /^10\./.test(hostname)) {
      return `http://${hostname}:4001/api`
    }
    // Custom local hosts (e.g. app.jamble.peru in /etc/hosts) should still hit local backend
    if (window.location.port === '5174' && hostname !== 'api.falconext.pe') {
      return 'http://localhost:4001/api'
    }
  }

  return import.meta.env.VITE_API_FALLBACK_URL || 'https://api.falconext.pe/api'
}

const applyBrandToDocument = (brand: Partial<BrandConfig>) => {
  if (typeof document === 'undefined') return
  if (brand.name) document.title = brand.name
  const host = typeof window !== 'undefined' ? window.location.hostname : ''
  const hostFavicon =
    host === 'app.krezka.com'
      ? '/assets/krezka/krezkalogo.png'
      : host === 'app.falconext.pe'
        ? '/assets/logofalconext.png'
        : undefined

  const finalFavicon = hostFavicon || brand.favicon
  if (!finalFavicon) return

  const existing = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
  if (existing) {
    existing.href = finalFavicon
    return
  }

  const link = document.createElement('link')
  link.rel = 'icon'
  link.type = 'image/png'
  link.href = finalFavicon
  document.head.appendChild(link)
}

const bootstrapBranding = async () => {
  if (typeof window === 'undefined') return
  if (String(import.meta.env.VITE_DISABLE_PUBLIC_BRANDING_FETCH || '').toLowerCase() === 'true') return
  const host = window.location.host
  const hostStorageKey = `${BRANDING_STORAGE_KEY}:${host}`
  try {
    const baseUrl = inferDefaultBaseUrl()
    const resp = await fetch(`${baseUrl}/branding/public?host=${encodeURIComponent(host)}`)
    const data = await resp.json()
    const brand = data?.data || data
    if (brand && typeof brand === 'object' && brand.name) {
      ;(window as any).__FALCONEXT_PUBLIC_BRAND__ = brand
      localStorage.setItem(hostStorageKey, JSON.stringify(brand))
      applyBrandToDocument(brand)
    }
  } catch {
    const cached = localStorage.getItem(hostStorageKey) || localStorage.getItem(BRANDING_STORAGE_KEY)
    if (cached) {
      try {
        const brand = JSON.parse(cached)
        ;(window as any).__FALCONEXT_PUBLIC_BRAND__ = brand
        applyBrandToDocument(brand)
      } catch {
        // ignore malformed cache
      }
    }
  }
}

const start = async () => {
  await bootstrapBranding()
  const { default: App } = await import('./App')

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}

void start()
