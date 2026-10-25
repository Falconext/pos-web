import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SidebarColor = 'ember' | 'primary' | 'dark' | 'info' | 'success' | 'warning' | 'error';
export type SidebarType = 'dark' | 'transparent' | 'white';
export type ZoomLevel = 0 | 1 | 2 | 3;
/** Fondo del modo oscuro: 'warm' = neutros cálidos (estilo Hearth), 'navy' = azul noche de siempre. */
export type DarkVariant = 'warm' | 'navy';

// La clase vive en <html> junto a `dark`; solo tiene efecto con el modo oscuro.
const applyDarkVariant = (variant: DarkVariant) => {
    document.documentElement.classList.toggle('dark-warm', variant === 'warm');
};

export const ZOOM_OPTIONS: { level: ZoomLevel; label: string; zoom: number; height: string }[] = [
    { level: 0, label: '100%', zoom: 1,    height: '100vh' },
    { level: 1, label: '90%',  zoom: 0.9,  height: '111vh' },
    { level: 2, label: '82%',  zoom: 0.82, height: '122vh' },
    { level: 3, label: '75%',  zoom: 0.75, height: '133vh' },
];

interface ThemeState {
    isOpen: boolean;
    sidebarColor: SidebarColor;
    sidebarType: SidebarType;
    sidebarCollapsed: boolean;
    navbarFixed: boolean;
    zoomLevel: ZoomLevel;
    isDarkMode: boolean;
    darkVariant: DarkVariant;

    // Actions
    toggleConfigurator: () => void;
    setSidebarColor: (color: SidebarColor) => void;
    setSidebarType: (type: SidebarType) => void;
    setSidebarCollapsed: (collapsed: boolean) => void;
    setNavbarFixed: (fixed: boolean) => void;
    closeConfigurator: () => void;
    setZoomLevel: (level: ZoomLevel) => void;
    toggleDarkMode: () => void;
    setDarkVariant: (variant: DarkVariant) => void;
    initTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set, get) => ({
            isOpen: false,
            sidebarColor: 'ember',
            sidebarType: 'dark',
            sidebarCollapsed: false,
            navbarFixed: true,
            zoomLevel: 1,
            isDarkMode: false,
            darkVariant: 'warm',

            toggleConfigurator: () => set((state) => ({ isOpen: !state.isOpen })),
            closeConfigurator: () => set({ isOpen: false }),
            setSidebarColor: (color) => set({ sidebarColor: color }),
            setSidebarType: (type) => set({ sidebarType: type }),
            setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
            setNavbarFixed: (fixed) => set({ navbarFixed: fixed }),
            setZoomLevel: (level) => set({ zoomLevel: level }),
            setDarkVariant: (variant) => {
                applyDarkVariant(variant);
                set({ darkVariant: variant });
            },
            toggleDarkMode: () => {
                const { isDarkMode } = get();
                const newMode = !isDarkMode;
                if (newMode) {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
                set({ isDarkMode: newMode });
            },
            initTheme: () => {
                const { isDarkMode, darkVariant } = get();
                applyDarkVariant(darkVariant);
                if (isDarkMode) {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
            }
        }),
        {
            name: 'theme-storage-v3',
            // v1: el menú pasó al estilo cálido; quien tenía el color de fábrica
            // anterior ('info') arranca con el nuevo acento 'ember'.
            version: 1,
            migrate: (persisted: any, version) => {
                if (version < 1 && persisted?.sidebarColor === 'info') persisted.sidebarColor = 'ember';
                return persisted;
            },
        }
    )
);
