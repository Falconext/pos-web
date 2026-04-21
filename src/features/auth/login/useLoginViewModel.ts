import { useState, useEffect, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../../zustand/auth";
import useAlertStore from "../../../zustand/alert";
import { ILoginForm, initialLoginForm } from "./LoginModel";

export const useLoginViewModel = () => {
    const navigate = useNavigate();
    const [formValues, setFormValues] = useState<ILoginForm>(initialLoginForm);
    const { login, auth, me, isLoading, pendingSedes, success } = useAuthStore();

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

    // Redirigir según estado post-login
    useEffect(() => {
        // Multi-sede: ir a pantalla de selección
        if (pendingSedes && pendingSedes.length > 0) {
            navigate("/sede-seleccion", { replace: true });
            return;
        }
        // Login completo: redirigir al panel
        if (auth && success && typeof auth === "object" && auth.rol) {
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
    }, [auth, success, pendingSedes, navigate]);

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
        navigate,
    };
};
