import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SidebarColor = 'primary' | 'dark' | 'info' | 'success' | 'warning' | 'error';
export type SidebarType = 'dark' | 'transparent' | 'white';

interface ThemeState {
    isOpen: boolean;
    sidebarColor: SidebarColor;
    sidebarType: SidebarType;
    navbarFixed: boolean;
    isCompact: boolean;
    isDarkMode: boolean;

    // Actions
    toggleConfigurator: () => void;
    setSidebarColor: (color: SidebarColor) => void;
    setSidebarType: (type: SidebarType) => void;
    setNavbarFixed: (fixed: boolean) => void;
    closeConfigurator: () => void;
    toggleCompact: () => void;
    toggleDarkMode: () => void;
    initTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set, get) => ({
            isOpen: false,
            sidebarColor: 'info', // Default Blue
            sidebarType: 'dark', // Default Dark
            navbarFixed: true,
            isCompact: true,
            isDarkMode: false,

            toggleConfigurator: () => set((state) => ({ isOpen: !state.isOpen })),
            closeConfigurator: () => set({ isOpen: false }),
            setSidebarColor: (color) => set({ sidebarColor: color }),
            setSidebarType: (type) => set({ sidebarType: type }),
            setNavbarFixed: (fixed) => set({ navbarFixed: fixed }),
            toggleCompact: () => set((state) => ({ isCompact: !state.isCompact })),
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
                const { isDarkMode } = get();
                if (isDarkMode) {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
            }
        }),
        {
            name: 'theme-storage-v2',
        }
    )
);
