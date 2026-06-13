import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

// Clave inline — NO importar branding.ts aquí para evitar que BRAND se evalúe
// antes de que bootstrapBranding() resuelva el fetch y setee __FALCONEXT_PUBLIC_BRAND__
const BRANDING_STORAGE_KEY = 'PUBLIC_BRANDING_CONFIG'
type BrandConfig = { name?: string; favicon?: string; [key: string]: unknown }

const getLocalWhiteLabelBrand = (host: string): Partial<BrandConfig> | null => {
  const normalized = host.toLowerCase().replace(/:\d+$/, '')
  if (!normalized.includes('jamble')) return null

  return {
    key: 'jamble-peru',
    authBrand: 'falconext',
    isWhiteLabel: true,
    name: 'Jamble Perú',
    legalName: 'Jamble Perú',
    website: 'https://jambleperu.com',
    email: 'ventas@jambleperu.com',
    phone: '+51 932 332 556',
    whatsapp: '51932332556',
    logo: '/assets/fnlogo.png',
    logoWhite: '/assets/logofalconwhite.png',
    favicon: '/assets/logofalconext.png',
    primaryColor: '#111827',
    secondaryColor: '#3E2BC7',
    dashboardUrl: `http://${host}`,
  }
}

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
  const localWhiteLabelBrand = getLocalWhiteLabelBrand(host)
  try {
    const baseUrl = inferDefaultBaseUrl()
    const resp = await fetch(`${baseUrl}/branding/public?host=${encodeURIComponent(host)}`)
    const data = await resp.json()
    let brand = data?.data || data
    if (localWhiteLabelBrand && brand && typeof brand === 'object' && !brand.isWhiteLabel) {
      brand = localWhiteLabelBrand
    }
    if (brand && typeof brand === 'object' && brand.name) {
      ;(window as any).__FALCONEXT_PUBLIC_BRAND__ = brand
      localStorage.setItem(hostStorageKey, JSON.stringify(brand))
      applyBrandToDocument(brand)
    }
  } catch {
    const cached = localStorage.getItem(hostStorageKey)
    if (cached) {
      try {
        const brand = JSON.parse(cached)
        if (localWhiteLabelBrand && brand && typeof brand === 'object' && !brand.isWhiteLabel) {
          throw new Error('Ignoring non white-label cache for custom host')
        }
        ;(window as any).__FALCONEXT_PUBLIC_BRAND__ = brand
        applyBrandToDocument(brand)
        return
      } catch {
        // ignore malformed cache
      }
    }
    if (localWhiteLabelBrand?.name) {
      ;(window as any).__FALCONEXT_PUBLIC_BRAND__ = localWhiteLabelBrand
      localStorage.setItem(hostStorageKey, JSON.stringify(localWhiteLabelBrand))
      applyBrandToDocument(localWhiteLabelBrand)
    }
  }
}

const start = async () => {
  await bootstrapBranding()
  const { default: App } = await import('./App')

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <App />
  )
}

void start()
