import { ChangeEvent, useEffect, useState } from "react";
import { IAuthState, useAuthStore } from "../zustand/auth";
import Input from "../components/Input";
import { useLocation, useNavigate } from "react-router-dom";
import Alert from "../components/Alert";
import Button from "../components/Button";
import useAlertStore from "@/zustand/alert";
import banner from '@/assets/fnlogin.png'
import { Icon } from "@iconify/react";
import apiClient from "@/utils/apiClient";

interface IUserForm {
  email: string;
  password: string;
}

export default function TiendaLogin() {
  const initialForm: IUserForm = {
    email: "",
    password: "",
  };

  const navigate = useNavigate();
  const location = useLocation();
  const [formValues, setFormValues] = useState(initialForm);
  const { login, auth, me, isLoading }: IAuthState = useAuthStore();

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
    const routeAfterLogin = async () => {
      if (!(auth && typeof auth === 'object' && auth.rol)) return;
      const token = localStorage.getItem('ACCESS_TOKEN');
      if (!token) return;

      // ADMIN_SISTEMA: no tiene tienda propia
      if (auth.rol === 'ADMIN_SISTEMA') {
        navigate('/administrador/empresas', { replace: true });
        return;
      }

      // ADMIN_EMPRESA / USUARIO_EMPRESA: intenta ir directo al slug
      try {
        const { data } = await apiClient.get('/tienda/config');
        const cfg: any = data?.data || data;
        const hasStore = cfg?.plan?.tieneTienda === true;
        const slug = cfg?.slugTienda;

        if (hasStore && slug) {
          navigate(`/tienda/${slug}`, { replace: true });
          return;
        }
        if (hasStore && !slug) {
          useAlertStore.getState().alert('Configura el nombre de tu tienda para hacerla pública', 'notification');
          navigate('/administrador/tienda/configuracion', { replace: true });
          return;
        }
        // Si el plan no incluye tienda, ir al panel admin normal
        navigate('/administrador', { replace: true });
      } catch (e) {
        // Si falla la carga, enviar al panel de tienda para que resuelva
        navigate('/tienda/home', { replace: true });
      }
    };
    routeAfterLogin();
  }, [auth, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Alert />
      </div>
    );
  }

  if (auth && !isLoading) {
    return null;
  }

  return (
    <div className="min-h-screen w-full grid md:grid-cols-2 bg-white">
      <Alert />

      {/* Left: Banner panel (hidden on mobile) */}
      <div className="hidden md:flex items-center justify-center p-8">
        <div className="w-full h-[85vh] rounded-2xl overflow-hidden relative bg-gradient-to-br from-[#050509] via-[#111322] to-[#050509] flex items-center justify-center">
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_center,#6a00ff_0%,transparent_60%)]" />
          <div className="relative max-w-4xl mx-auto gap-6 items-center px-10">
            <h2 className="text-xl font-semibold text-white text-center mb-5">Tu tienda virtual para emprendedores</h2>
            <div className="relative">
              <img
                src={banner}
                alt="Tienda virtual Nephi"
                className="w-full rounded-2xl shadow-2xl object-cover"
              />
            </div>
            <div className="text-white">
              <p className="text-sm text-white/80 mb-4 text-center mt-5">
                Crea tu catálogo online, recibe pedidos por Yape/Plin y gestiona todo desde un solo lugar.
              </p>
              <div className="flex justify-center items-center gap-2 text-sm text-white/80">
                <Icon icon="mdi:storefront" className="w-5 h-5 text-emerald-400" />
                <span>Tienda pensada para emprendedores y negocios pequeños.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          <div className="text-left mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Iniciar Sesión - Tienda</h1>
            <p className="text-gray-500 mt-2">Accede a la configuración y pedidos de tu tienda virtual</p>
          </div>

          <form onKeyDown={handleKeyDown} className="space-y-5">
            <Input
              form="no-form"
              autoComplete="off"
              readOnly={false}
              isIcon
              icon="lets-icons:e-mail"
              type="email"
              name="email"
              onChange={handleChange}
              label="Email"
            />

            <Input
              form="no-form"
              autoComplete="off"
              readOnly={false}
              isIcon
              icon="iconamoon:lock"
              type="password"
              name="password"
              onChange={handleChange}
              label="Password"
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input type="checkbox" className="accent-[#050509]" />
                Remember me
              </label>
            </div>

            <Button type="button" onClick={accessPanel} className="w-full">
              INICIAR SESIÓN
            </Button>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-sm text-[#6a00ff] hover:underline"
              >
                Ir a mi facturación
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
