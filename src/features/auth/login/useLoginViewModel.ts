import { useState, useEffect, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../../zustand/auth";
import useAlertStore from "../../../zustand/alert";
import { ILoginForm, initialLoginForm } from "./LoginModel";

export const useLoginViewModel = () => {
    const navigate = useNavigate();
    const [formValues, setFormValues] = useState<ILoginForm>(initialLoginForm);
    const { login, auth, me, isLoading } = useAuthStore();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                await me();
            } catch (error) {
                console.error("Error al verificar el usuario:", error);
            }
        };
        fetchUser();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (auth && typeof auth === "object" && auth.rol) {
            const token = localStorage.getItem("ACCESS_TOKEN");
            if (token) {
                if (auth.rol === "ADMIN_SISTEMA") {
                    navigate("/administrador/empresas");
                } else if (auth.rol === "ADMIN_EMPRESA" || auth.rol === "USUARIO_EMPRESA") {
                    navigate("/administrador");
                } else if (auth.rol === "RESELLER") {
                    navigate("/reseller");
                }
            }
        }
    }, [auth, navigate]);

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        setFormValues((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleLogin = () => {
        if (formValues?.email && formValues?.password) {
            login(formValues);
        } else {
            useAlertStore.getState().alert("Por favor ingrese el correo y la contraseña", "error");
        }
    };

    const handleKeyDown = (event: any) => {
        if (event.key === "Enter") {
            event.preventDefault();
            handleLogin();
        }
    };

    return {
        formValues,
        isLoading,
        auth,
        handleChange,
        handleLogin,
        handleKeyDown,
        navigate, // Exposing navigate in case View needs generic navigation, though usually VM handles it
    };
};
