// src/app/zustand/auth.ts
import { create } from "zustand";
import { get, post } from "../utils/fetch";
import { IUser } from "../interfaces/auth";
import useAlertStore from "./alert";
import { devtools } from "zustand/middleware";

export interface IAuthState {
  auth: IUser | null;
  isLoading: boolean;
  me: () => void;
  login: (data: any) => void;
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
          set({ auth: resp.data, success: true, isLoading: false });
        } else {

        }
      } catch (error) {
        console.error("Error en initAuth:", error);

      }
    };

    initAuth();

    return {
      success: false,
      auth: null,
      isLoading: true,
      login: async (data: any) => {
        try {
          useAlertStore.setState({ loading: true });
          const resp: any = await post(`auth/login`, data);
          console.log("Login response:", resp);
          if (resp.code === 1) {
            localStorage.setItem("ACCESS_TOKEN", resp.data.accessToken);
            localStorage.setItem("REFRESH_TOKEN", resp.data.refreshToken);
            useAlertStore.getState().alert("Bienvenido a la plataforma", "success");
            await _get().me();
            useAlertStore.setState({ loading: false });
            set(
              {
                auth: resp.data.usuario,
                success: true,
              },
              false,
              "LOGIN"
            );
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
        } catch (error) {
          useAlertStore.setState({ loading: false });
          useAlertStore.getState().alert("El usuario o contraseña son incorrectas", "error");
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
            set({ auth: resp.data, success: true, isLoading: false });
          } 
        } catch (error) {
          console.error("Error en me:", error);
        }
      },
      logout: () => {
        localStorage.removeItem("ACCESS_TOKEN");
        localStorage.removeItem("REFRESH_TOKEN");
        set({ auth: null, success: false, isLoading: false }, false, "LOGOUT");
      },
    }
  })
);