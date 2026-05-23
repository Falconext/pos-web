export type BrandConfig = {
  key?: string;
  authBrand?: 'falconext' | 'krezka';
  isWhiteLabel?: boolean;
  name: string;
  legalName: string;
  website: string;
  email: string;
  phone: string;
  whatsapp: string;
  logo: string;
  logoWhite: string;
  favicon?: string;
  primaryColor: string;
  secondaryColor: string;
  socials: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    twitter?: string;
  };
  dashboardUrl: string;
};

const LOCAL_STORAGE_KEY = 'PUBLIC_BRANDING_CONFIG';

const staticBrands: Record<string, BrandConfig> = {
  falconext: {
    key: 'falconext',
    authBrand: 'falconext',
    isWhiteLabel: false,
    name: 'Falconext',
    legalName: 'Falconext S.A.C.',
    website: 'https://falconext.pe',
    email: 'ventas@falconext.pe',
    phone: '+51 932 332 556',
    whatsapp: '51932332556',
    logo: '/assets/fnlogo.png',
    logoWhite: '/assets/logofalconwhite.png',
    favicon: '/favicon.ico',
    primaryColor: '#3E2BC7',
    secondaryColor: '#5A45D1',
    socials: {
      facebook: 'https://www.facebook.com/profile.php?id=61576185915016',
      instagram: 'https://www.instagram.com/falconext.pe/',
    },
    dashboardUrl: 'https://app.falconext.pe',
  },
  krezka: {
    key: 'krezka',
    authBrand: 'krezka',
    isWhiteLabel: false,
    name: 'Krezka',
    legalName: 'Krezka Soluciones Digitales',
    website: 'https://krezka.com',
    email: 'ventas@krezka.com',
    phone: '+51 932 332 556',
    whatsapp: '51932332556',
    logo: '/assets/krezka/krezka.png',
    logoWhite: '/assets/krezka/krezkawhite.png',
    favicon: '/favicon.ico',
    primaryColor: '#00D0D4',
    secondaryColor: '#00A0A4',
    socials: {
      facebook: '#',
      instagram: '#',
    },
    dashboardUrl: 'https://app.krezka.com',
  },
};

const envDefaultBrandKey = (import.meta.env.VITE_PUBLIC_BRAND || 'krezka').toLowerCase();
const envDefaultBrand = staticBrands[envDefaultBrandKey] || staticBrands.krezka;
const isPublicBrandingFetchDisabled =
  String(import.meta.env.VITE_DISABLE_PUBLIC_BRANDING_FETCH || '').toLowerCase() === 'true';

const getRuntimeBranding = (): BrandConfig | null => {
  if (typeof window === 'undefined') return null;
  if (isPublicBrandingFetchDisabled) return null;

  const runtime = (window as any).__FALCONEXT_PUBLIC_BRAND__;
  if (runtime && typeof runtime === 'object' && runtime.name) {
    return { ...envDefaultBrand, ...runtime };
  }

  const host = window.location.host;
  const hostStorageKey = `${LOCAL_STORAGE_KEY}:${host}`;
  const cached = localStorage.getItem(hostStorageKey) || localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!cached) return null;
  try {
    const parsed = JSON.parse(cached);
    if (parsed && typeof parsed === 'object' && parsed.name) {
      return { ...envDefaultBrand, ...parsed };
    }
  } catch {
    return null;
  }
  return null;
};

export const BRAND: BrandConfig = getRuntimeBranding() || envDefaultBrand;

export const getBrandByKey = (key?: string | null): BrandConfig => {
  const runtime = getRuntimeBranding();
  if (runtime && key && runtime.key?.toLowerCase() === String(key).toLowerCase()) {
    return runtime;
  }
  return staticBrands[(key ?? '').toLowerCase()] || runtime || BRAND;
};

export const BRANDING_STORAGE_KEY = LOCAL_STORAGE_KEY;
