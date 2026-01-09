import { ChangeEvent, useEffect, useState } from "react";
import { IAuthState, useAuthStore } from "../zustand/auth";
import Input from "../components/Input";
import { useNavigate } from "react-router-dom";
import Alert from "../components/Alert";
import Button from "../components/Button";
import useAlertStore from "@/zustand/alert";
import banner from '@/assets/fnlogin.png'
import { Icon } from "@iconify/react";
import Loading from "../components/Loading";

interface IUserForm {
  email: string;
  password: string;
}

export default function Login() {
  const initialForm: IUserForm = {
    email: "",
    password: "",
  };

  const navigate = useNavigate();
  const [formValues, setFormValues] = useState(initialForm);
  const { login, auth, me, refresh, isLoading }: IAuthState = useAuthStore();

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormValues({
      ...formValues,
      [name]: value,
    });
  };

  const handleKeyDown = (event: any) => {
    if (event.key === "Enter") {
      event.preventDefault();
      accessPanel();
    }
  };

  const accessPanel = () => {
    if (formValues?.email && formValues?.password) {
      login(formValues);
    } else {
      useAlertStore.getState().alert("Por favor ingrese el correo y la contraseña", "error");
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        await me();
      } catch (error) {
        console.error("Error al verificar el usuario:", error);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (auth && typeof auth === "object" && auth.rol) {
      const token = localStorage.getItem("ACCESS_TOKEN");
      if (token) {
        if (auth.rol === "ADMIN_SISTEMA") {
          navigate("/administrador/empresas");
        } else if (auth.rol === "ADMIN_EMPRESA" || auth.rol === "USUARIO_EMPRESA") {
          navigate("/administrador");
        }
      }
    }
  }, [auth, navigate]);

  if (isLoading) {
    return <Loading />;
  }

  if (auth && !isLoading) {
    return null;
  }

  return (
    <div className="flex min-h-screen w-full font-sans">
      {/* Alert Positioned Absolute or Top */}
      <div className="fixed top-5 right-5 z-50">
        <Alert />
      </div>

      {/* LEFT PANEL: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white relative">
        {/* Mobile Header Logo (Optional) */}

        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Bienvenido de nuevo</h1>
            <p className="text-gray-500 text-sm">Ingresa tus credenciales para acceder a tu cuenta.</p>
          </div>

          <form onKeyDown={handleKeyDown} className="space-y-5">
            {/* Visual Social Auth - REMOVED */}

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 block">Correo electrónico</label>
                <div className="relative">
                  <input
                    autoComplete="off"
                    type="email"
                    name="email"
                    onChange={handleChange}
                    placeholder="Ingresa tu correo"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] text-gray-900 placeholder:text-gray-400 transition-all text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 block">Contraseña</label>
                <div className="relative">
                  <input
                    autoComplete="off"
                    type="password"
                    name="password"
                    onChange={handleChange}
                    placeholder="Ingresa tu contraseña"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] text-gray-900 placeholder:text-gray-400 transition-all text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative flex items-center">
                  <input type="checkbox" className="peer w-4 h-4 cursor-pointer appearance-none rounded border border-gray-300 checked:bg-[#4F46E5] checked:border-[#4F46E5] transition-all" />
                  <Icon icon="solar:check-outline" className="text-white absolute w-3 h-3 top-0.5 left-0.5 opacity-0 peer-checked:opacity-100 pointer-events-none" />
                </div>
                <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors">Recordarme</span>
              </label>
              <button type="button" className="text-sm font-medium text-[#4F46E5] hover:text-[#4338ca] transition-colors">
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <button
              type="button"
              onClick={accessPanel}
              className="w-full py-3 rounded-xl block bg-[#4F46E5] hover:bg-[#4338ca] text-white font-semibold text-sm shadow-lg shadow-[#4F46E5]/30 transform active:scale-[0.98] transition-all duration-200"
            >
              INICIAR SESIÓN
            </button>

            <div className="text-center pt-2">
              <span className="text-sm text-gray-500">¿Aún no tienes cuenta? </span>
              <button
                type="button"
                className="text-sm font-semibold text-[#4F46E5] hover:underline"
              >
                Regístrate
              </button>
            </div>

            <div className="text-center mt-2">
              <button
                type="button"
                onClick={() => navigate('/tienda/login')}
                className="text-xs text-gray-400 hover:text-gray-600 hover:underline transition-colors"
              >
                Ir a mi tienda virtual
              </button>
            </div>

          </form>

          <div className="pt-8 text-center text-xs text-gray-300">
            © 2025 Falconext. Todos los derechos reservados.
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Brand & Promo */}
      <div className="hidden lg:flex w-1/2 bg-[#4F46E5] relative flex-col items-center justify-center p-12 overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 translate-y-1/2 -translate-x-1/2"></div>

        {/* Brand Header */}
        <div className="absolute top-10 left-10 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Icon icon="solar:bolt-bold" className="text-white text-xl" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">Falconext</span>
        </div>

        {/* Content Container */}
        <div className="w-full max-w-lg z-10 flex flex-col gap-10">

          {/* Text Content */}
          <div className="text-left space-y-4">
            <h2 className="text-4xl font-bold text-white leading-tight">
              Control de Ventas <br />
              <span className="text-indigo-200">para Decisiones Inteligentes</span>
            </h2>
            <p className="text-indigo-100 text-lg leading-relaxed max-w-md">
              Mantente a la vanguardia con información en tiempo real, análisis de rendimiento y estrategias impulsadas por datos. Todo en un solo panel.
            </p>
          </div>

          {/* Dashboard Preview / "Browser Window" */}
          <div className="relative w-full bg-white rounded-xl shadow-2xl overflow-hidden transform hover:rotate-0 transition-transform duration-500 ease-out border-4 border-white/10 ring-1 ring-black/5">
            {/* Browser Header */}
            <div className="h-8 bg-gray-50 border-b border-gray-200 flex items-center px-3">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
              <div className="ml-4 h-4 w-32 bg-gray-200 rounded-full opacity-50"></div>
            </div>
            {/* Image */}
            <div className="w-full h-full relative">
              <img
                src={banner}
                alt="Falconext Dashboard"
                className="w-full h-full object-contain top-[-15px] relative"
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}