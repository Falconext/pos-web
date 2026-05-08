export type BrandConfig = {
  name: string;
  legalName: string;
  website: string;
  email: string;
  phone: string;
  whatsapp: string;
  logo: string;
  logoWhite: string;
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

const brands: Record<string, BrandConfig> = {
  falconext: {
    name: 'Falconext',
    legalName: 'Falconext S.A.C.',
    website: 'https://falconext.pe',
    email: 'ventas@falconext.pe',
    phone: '+51 932 332 556',
    whatsapp: '51932332556',
    logo: '/assets/fnlogo.png',
    logoWhite: '/assets/logofalconwhite.png',
    primaryColor: '#3E2BC7',
    secondaryColor: '#5A45D1',
    socials: {
      facebook: 'https://www.facebook.com/profile.php?id=61576185915016',
      instagram: 'https://www.instagram.com/falconext.pe/',
    },
    dashboardUrl: 'https://app.falconext.pe',
  },
  krezka: {
    name: 'Krezka',
    legalName: 'Krezka Soluciones Digitales',
    website: 'https://krezka.com',
    email: 'ventas@krezka.com',
    phone: '+51 932 332 556',
    whatsapp: '51932332556',
    logo: '/assets/krezka/krezka.png',
    logoWhite: '/assets/krezka/krezkawhite.png',
    primaryColor: '#00D0D4',
    secondaryColor: '#00A0A4',
    socials: {
      facebook: '#',
      instagram: '#',
    },
    dashboardUrl: 'https://app.krezka.com',
  },
};

const activeBrandKey = import.meta.env.VITE_PUBLIC_BRAND || 'krezka';

export const BRAND = brands[activeBrandKey] || brands.krezka;

export const getBrandByKey = (key?: string | null): BrandConfig =>
  brands[(key ?? '').toLowerCase()] || BRAND;
