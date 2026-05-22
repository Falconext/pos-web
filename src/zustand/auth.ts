// src/app/zustand/auth.ts
import { create } from "zustand";
import { get, post } from "../utils/fetch";
import { IUser, ISede } from "../interfaces/auth";
import useAlertStore from "./alert";
import { devtools } from "zustand/middleware";
import { BRAND } from "@/lib/branding";

export interface IAuthState {
  auth: IUser | null;
  isLoading: boolean;
  pendingSedes: ISede[] | null;      // Sedes pendientes cuando el usuario tiene 2+
  sedeActiva: ISede | null;          // Sede activa de la sesión actual
  me: () => void;
  login: (data: any) => void;
  selectSede: (sedeId: number) => Promise<void>;
  setSedeActiva: (sede: ISede) => void;  // Cambio local de sede (para admin)
  success: boolean;
  logout: () => void;
  refresh: () => Promise<void>;
}

export const useAuthStore = create<IAuthState>()(
  devtools((set, _get) => {
    const initAuth = async () => {
      set({ isLoading: true });
      try {
        const token = localStorage.getItem("ACCESS_TOKEN");
        if (!token) {
          set({ auth: null, success: false, isLoading: false });
          return;
        }
        const resp: any = await get(`auth/me`);
        console.log("Me response:", resp);
        if (resp.code === 1) {
          // Restaurar sede activa desde localStorage si existe
          const sedeActivaStr = localStorage.getItem("SEDE_ACTIVA");
          const sedeActiva: ISede | null = sedeActivaStr ? JSON.parse(sedeActivaStr) : null;
          set({ auth: resp.data, success: true, isLoading: false, sedeActiva });
        } else {
          set({ auth: null, success: false, isLoading: false });
        }
      } catch (error) {
        console.error("Error en initAuth:", error);
        set({ auth: null, success: false, isLoading: false });
      }
    };

    initAuth();

    if (typeof window !== 'undefined') {
      let lastRefreshAt = 0;
      const refreshOnVisibility = () => {
        if (document.visibilityState !== 'visible') return;
        const token = localStorage.getItem('ACCESS_TOKEN');
        if (!token) return;

        const now = Date.now();
        if (now - lastRefreshAt < 30_000) return;
        lastRefreshAt = now;

        void _get().me();
      };

      document.addEventListener('visibilitychange', refreshOnVisibility);
    }

    return {
      success: false,
      auth: null,
      isLoading: true,
      pendingSedes: null,
      sedeActiva: null,

      login: async (data: any) => {
        try {
          useAlertStore.setState({ loading: true });
          const payload = { ...data, brand: BRAND.authBrand || import.meta.env.VITE_PUBLIC_BRAND || 'falconext' };
          const resp: any = await post(`auth/login`, payload);
          console.log("Login response:", resp);

          if (resp.code === 1) {
            const loginData = resp.data;

            // Caso multi-sede: necesita seleccionar sede
            if (loginData.requiresSedeSelection) {
              // Guardar token temporal para poder llamar a select-sede
              localStorage.setItem("ACCESS_TOKEN", loginData.tempToken);
              useAlertStore.setState({ loading: false });
              set({
                auth: loginData.usuario,
                pendingSedes: loginData.sedes,
                success: false, // No completó el login aún
              });
              return;
            }

            // Caso normal: 1 sede (ya incluida en token) o admin
            localStorage.setItem("ACCESS_TOKEN", loginData.accessToken);
            localStorage.setItem("REFRESH_TOKEN", loginData.refreshToken);

            // Detectar sede activa desde las sedes del usuario
            let sedeActiva: ISede | null = null;
            const sedes = loginData.usuario?.sedes || [];
            if (sedes.length === 1) {
              sedeActiva = sedes[0];
            } else if (sedes.length > 1) {
              // Multi-sede: iniciar siempre en la sede principal para evitar estado residual
              sedeActiva = sedes.find((s: ISede) => s.esPrincipal) || sedes[0];
            }
            if (sedeActiva) {
              localStorage.setItem("SEDE_ACTIVA", JSON.stringify(sedeActiva));
            } else {
              localStorage.removeItem("SEDE_ACTIVA");
            }

            useAlertStore.getState().alert("Bienvenido a la plataforma", "success");
            await _get().me();
            useAlertStore.setState({ loading: false });
            set({
              auth: loginData.usuario,
              success: true,
              pendingSedes: null,
              sedeActiva,
            });
          } else if (resp.code === 11) {
            useAlertStore.setState({ loading: false });
            useAlertStore.getState().alert(`${resp.Message || resp.error}`, "error");
          } else {
            useAlertStore.setState({ loading: false });
            useAlertStore.getState().alert(
              resp.error || "La contraseña o el usuario son incorrectos, intentelo de nuevo por favor",
              "error"
            );
          }
        } catch (error: any) {
          useAlertStore.setState({ loading: false });
          const msg = error?.response?.data?.message || "El usuario o contraseña son incorrectas";
          useAlertStore.getState().alert(msg, "error");
        }
      },

      selectSede: async (sedeId: number) => {
        try {
          useAlertStore.setState({ loading: true });
          const resp: any = await post(`auth/select-sede`, { sedeId });
          console.log("SelectSede response:", resp);

          if (resp.code === 1) {
            const { accessToken, refreshToken, usuario, sede } = resp.data;
            localStorage.setItem("ACCESS_TOKEN", accessToken);
            localStorage.setItem("REFRESH_TOKEN", refreshToken);
            localStorage.setItem("SEDE_ACTIVA", JSON.stringify(sede));

            useAlertStore.setState({ loading: false });
            useAlertStore.getState().alert(`Entrando a ${sede.nombre}`, "success");
            set({
              auth: usuario,
              success: true,
              pendingSedes: null,
              sedeActiva: sede,
            });
          } else {
            useAlertStore.setState({ loading: false });
            useAlertStore.getState().alert(resp.error || "Error al seleccionar sede", "error");
          }
        } catch (error: any) {
          useAlertStore.setState({ loading: false });
          const msg = error?.response?.data?.message || "Error al seleccionar sede";
          useAlertStore.getState().alert(msg, "error");
        }
      },

      me: async () => {
        set({ isLoading: true });
        try {
          const token = localStorage.getItem("ACCESS_TOKEN");
          if (!token) {
            set({ auth: null, success: false, isLoading: false });
            return;
          }
          const resp: any = await get(`auth/me`);
          console.log("Me response:", resp);
          if (resp.code === 1) {
            const sedeActivaStr = localStorage.getItem("SEDE_ACTIVA");
            const sedeActiva: ISede | null = sedeActivaStr ? JSON.parse(sedeActivaStr) : null;
            set({ auth: resp.data, success: true, isLoading: false, sedeActiva });
          } else {
            set({ auth: null, success: false, isLoading: false });
          }
        } catch (error) {
          console.error("Error en me:", error);
          set({ isLoading: false });
        }
      },

      setSedeActiva: (sede: ISede) => {
        localStorage.setItem("SEDE_ACTIVA", JSON.stringify(sede));
        set({ sedeActiva: sede }, false, "SET_SEDE_ACTIVA");
        useAlertStore.getState().alert(`Sede cambiada a ${sede.nombre}`, "success");
      },

      logout: () => {
        localStorage.removeItem("ACCESS_TOKEN");
        localStorage.removeItem("REFRESH_TOKEN");
        localStorage.removeItem("SEDE_ACTIVA");
        set({ auth: null, success: false, isLoading: false, pendingSedes: null, sedeActiva: null }, false, "LOGOUT");
      },

      refresh: async () => {},
    }
  })
);
