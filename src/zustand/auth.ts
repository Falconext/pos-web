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
  bootstrapDone: boolean;
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
    const AUTH_ME_TIMEOUT_MS = 10_000;
    const AUTH_BOOTSTRAP_MAX_WAIT_MS = 12_000;

    const getTokenSafe = (): string | null => {
      try {
        return localStorage.getItem("ACCESS_TOKEN");
      } catch {
        return null;
      }
    };

    const withTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
      return new Promise<T>((resolve, reject) => {
        const timeoutId = window.setTimeout(() => {
          reject(new Error('AUTH_ME_TIMEOUT'));
        }, timeoutMs);

        promise
          .then((value) => {
            window.clearTimeout(timeoutId);
            resolve(value);
          })
          .catch((error) => {
            window.clearTimeout(timeoutId);
            reject(error);
          });
      });
    };

    const initAuth = async () => {
      const token = getTokenSafe();
      useAlertStore.setState({ loading: false });
      if (!token) {
        localStorage.removeItem("REFRESH_TOKEN");
        localStorage.removeItem("SEDE_ACTIVA");
        set({ auth: null, success: false, isLoading: false, bootstrapDone: true });
        return;
      }

      let bootstrapCompleted = false;
      const safetyRelease = window.setTimeout(() => {
        if (!bootstrapCompleted) {
          set({ isLoading: false, bootstrapDone: true });
        }
      }, AUTH_BOOTSTRAP_MAX_WAIT_MS);

      set({ isLoading: true, bootstrapDone: false });
      try {
        const resp: any = await withTimeout(get(`auth/me`), AUTH_ME_TIMEOUT_MS);
        if (resp.code === 1) {
          const sedeActivaStr = localStorage.getItem("SEDE_ACTIVA");
          const sedeActiva: ISede | null = sedeActivaStr ? JSON.parse(sedeActivaStr) : null;
          set({ auth: resp.data, success: true, isLoading: false, sedeActiva, bootstrapDone: true });
        } else {
          set({ auth: null, success: false, isLoading: false, bootstrapDone: true });
        }
      } catch (error) {
        console.error("Error en initAuth:", error);
        set({ auth: null, success: false, isLoading: false, bootstrapDone: true });
      } finally {
        bootstrapCompleted = true;
        window.clearTimeout(safetyRelease);
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
      bootstrapDone: false,
      pendingSedes: null,
      sedeActiva: null,

      login: async (data: any) => {
        useAlertStore.setState({ loading: true });
        try {
          const payload = { ...data, brand: BRAND.authBrand || import.meta.env.VITE_PUBLIC_BRAND || 'falconext' };
          const resp: any = await post(`auth/login`, payload);

          if (resp.code === 1) {
            const loginData = resp.data;

            // Caso multi-sede: necesita seleccionar sede
            if (loginData.requiresSedeSelection) {
              localStorage.setItem("ACCESS_TOKEN", loginData.tempToken);
              set({
                auth: loginData.usuario,
                pendingSedes: loginData.sedes,
                success: false,
              });
              return;
            }

            // Caso normal: 1 sede (ya incluida en token) o admin
            localStorage.setItem("ACCESS_TOKEN", loginData.accessToken);
            localStorage.setItem("REFRESH_TOKEN", loginData.refreshToken);

            let sedeActiva: ISede | null = null;
            const sedes = loginData.usuario?.sedes || [];
            if (sedes.length === 1) {
              sedeActiva = sedes[0];
            } else if (sedes.length > 1) {
              sedeActiva = sedes.find((s: ISede) => s.esPrincipal) || sedes[0];
            }
            if (sedeActiva) {
              localStorage.setItem("SEDE_ACTIVA", JSON.stringify(sedeActiva));
            } else {
              localStorage.removeItem("SEDE_ACTIVA");
            }

            set({
              auth: loginData.usuario,
              success: true,
              isLoading: false,
              bootstrapDone: true,
              pendingSedes: null,
              sedeActiva,
            });
            useAlertStore.getState().alert("Bienvenido a la plataforma", "success");
          } else if (resp.code === 11) {
            useAlertStore.getState().alert(`${resp.Message || resp.error}`, "error");
          } else {
            useAlertStore.getState().alert(
              resp.error || "La contraseña o el usuario son incorrectos, intentelo de nuevo por favor",
              "error"
            );
          }
        } catch (error: any) {
          const msg = error?.response?.data?.message || "El usuario o contraseña son incorrectas";
          useAlertStore.getState().alert(msg, "error");
        } finally {
          // Garantiza que loading siempre se apaga sin importar qué ocurra
          useAlertStore.setState({ loading: false });
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
              bootstrapDone: true,
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
        const token = getTokenSafe();
        if (!token) {
          set({ auth: null, success: false, isLoading: false, bootstrapDone: true });
          return;
        }
        // Refresh en background — no toca isLoading para no mostrar spinner al usuario
        try {
          const resp: any = await withTimeout(get(`auth/me`), AUTH_ME_TIMEOUT_MS);
          if (resp.code === 1) {
            const sedeActivaStr = localStorage.getItem("SEDE_ACTIVA");
            const sedeActiva: ISede | null = sedeActivaStr ? JSON.parse(sedeActivaStr) : null;
            set({ auth: resp.data, success: true, sedeActiva });
          } else {
            // El servidor rechazó el token (ej. 401) — cerrar sesión
            set({ auth: null, success: false, isLoading: false, bootstrapDone: true });
          }
        } catch (error: any) {
          if (error?.message === 'AUTH_ME_TIMEOUT') {
            // Problema de red transitorio — mantener sesión activa, sin loading
            console.warn("auth/me timeout en refresh background — sesión mantenida");
          } else {
            set({ auth: null, success: false, isLoading: false, bootstrapDone: true });
          }
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
        useAlertStore.setState({ loading: false });
        set({ auth: null, success: false, isLoading: false, bootstrapDone: true, pendingSedes: null, sedeActiva: null }, false, "LOGOUT");
      },

      refresh: async () => {},
    }
  })
);
