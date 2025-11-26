import { ChangeEvent, useEffect, useState } from "react";
import { IAuthState, useAuthStore } from "../zustand/auth";
import Input from "../components/Input";
import { useNavigate } from "react-router-dom";
import Alert from "../components/Alert";
import Button from "../components/Button";
import useAlertStore from "@/zustand/alert";
import banner from '@/assets/fnlogin.png'
import { Icon } from "@iconify/react";

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
    return (
      <div className="flex items-center justify-center h-screen">
        <Alert /> {/* Renderiza el componente Alert */}
      </div>
    );
  }

  if (auth && !isLoading) {
    return null;
  }

  return (
    <div className="min-h-screen w-full grid md:grid-cols-2 bg-white">
      <Alert />

      {/* Left: Form */}
      <div className="flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          <div className="text-left mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Iniciar Sesión</h1>
            <p className="text-gray-500 mt-2">Bienvenido a tu sistema, factura y gestiona tu negocio</p>
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

            <button
              type="button"
              onClick={accessPanel}
              className="w-full py-3 rounded-md text-white font-semibold shadow-sm bg-[#050509] hover:opacity-95 transition"
            >
              INICIAR SESIÓN
            </button>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => navigate('/tienda/login')}
                className="text-sm text-[#6a00ff] hover:underline"
              >
                Ir a mi tienda virtual
              </button>
            </div>

            {/* <p className="text-center text-sm text-gray-600">
              Don't have an account? <a className="font-semibold text-[#6a00ff]" href="#">Sign up</a>
            </p> */}
          </form>
        </div>
      </div>

      {/* Right: Banner panel (hidden on mobile) */}
      <div className="hidden md:flex items-center justify-center p-8">
        <div className="w-full h-[85vh] rounded-2xl overflow-hidden relative bg-gradient-to-br from-[#050509] via-[#111322] to-[#050509] flex items-center justify-center">
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_center,#6a00ff_0%,transparent_60%)]" />
          <div className="relative max-w-4xl mx-auto gap-6 items-center px-10">
            <h2 className="text-xl font-semibold text-white text-center mb-5">Facturación electrónica sin complicaciones</h2>
            <div className="relative">
              <img
                src={banner}
                alt="Panel de facturación Nephi"
                className="w-full rounded-2xl shadow-2xl object-cover"
              />
            </div>
            <div className="text-white">
             
              <p className="text-sm text-white/80 mb-4 text-center mt-5">
                Centraliza tus ventas, controla tu caja y mantén tus comprobantes siempre al día con Nephi.
              </p>
              <div className="flex justify-center items-center gap-2 text-sm text-white/80">
                <Icon icon="mdi:check-decagram" className="w-5 h-5 text-emerald-400" />
                <span>Plataforma pensada para emprendedores y negocios en crecimiento.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}