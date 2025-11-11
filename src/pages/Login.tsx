import { ChangeEvent, useEffect, useState } from "react";
import { IAuthState, useAuthStore } from "../zustand/auth";
import Input from "../components/Input";
import { useNavigate } from "react-router-dom";
import Alert from "../components/Alert";
import Button from "../components/Button";
import useAlertStore from "@/zustand/alert";

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
    <div className="w-full z-0 grid grid-cols-12 md:gap-20 bg-gradient-to-r from-[#413E83] via-[#050114] to-[#413E83]">
      <Alert />

      <div className="flex md:col-span-4 w-full justify-center md:justify-start col-span-12 items-center md:h-screen pl-0 md:pl-20">
        <div className="w-full md:border rounded md:border-solid md:border-[#fff] relative md:shadow-xl bg-[#f4fffb]">
          <div className="bg-[#fff] grid md:grid-cols-1 grid-cols-1 border border-solid border-[#fff] relative">
            <div className="md:p-8 md:px-10 p-8 md:pt-0">
              <div className="text-center flex justify-center mt-5">
                <img onClick={() => navigate('/')} src="/logonephi.png" className="object-cover cursor-pointer rounded-l-xl" width={150} height={120} alt="imagen" />
              </div>
              <h3 className="font-medium text-xl mt-6 md:mt-0 md:text-center text-center">! Bienvenido de nuevo al sistema Nephi !</h3>
              <p className="text-[#767676] mt-2 mb-12 rounded-xl font-light md:text-center text-center text-[14px]">
                Ingrese sus credenciales correctos para acceder al sistema
              </p>
              <form action="" onKeyDown={handleKeyDown} className="">
                <div className="mt-5">
                  <Input form="no-form" autoComplete="off" readOnly={false} isIcon icon="lets-icons:e-mail" type="email" name="email" onChange={handleChange} label="Correo electrónico" />
                </div>
                <div className="mt-5">
                  <Input form="no-form" autoComplete="off" readOnly={false} isIcon icon="iconamoon:lock" type="password" name="password" onChange={handleChange} label="Contraseña" />
                </div>
                <div className="mt-[20px]">
                  <button className="bg-[#262626] cursor-pointer w-full rounded-md text-white px-5 py-2.5" type="button" onClick={accessPanel}>
                    Ingresar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      <div className="md:col-span-8 w-full h-full hidden md:block">
        <img alt="" src="/bannermype.png" className="rounded-xl w-full" width={300} height={300} />
      </div>
    </div>
  );
}