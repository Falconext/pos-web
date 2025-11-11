import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface IThemeState {
    theme: string
    getTheme: (theme: string) => void
}

export const useThemeStore = create<IThemeState>()(devtools((set, _get) => ({
    theme: true,
    getTheme: (theme: string) => {
        set({
            theme: theme
        })
    }
})));


