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

    // Actions
    toggleConfigurator: () => void;
    setSidebarColor: (color: SidebarColor) => void;
    setSidebarType: (type: SidebarType) => void;
    setNavbarFixed: (fixed: boolean) => void;
    closeConfigurator: () => void;
    toggleCompact: () => void;
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set) => ({
            isOpen: false,
            sidebarColor: 'info', // Default Blue
            sidebarType: 'dark', // Default Dark
            navbarFixed: true,
            isCompact: true,

            toggleConfigurator: () => set((state) => ({ isOpen: !state.isOpen })),
            closeConfigurator: () => set({ isOpen: false }),
            setSidebarColor: (color) => set({ sidebarColor: color }),
            setSidebarType: (type) => set({ sidebarType: type }),
            setNavbarFixed: (fixed) => set({ navbarFixed: fixed }),
            toggleCompact: () => set((state) => ({ isCompact: !state.isCompact })),
        }),
        {
            name: 'theme-storage-v2',
        }
    )
);
