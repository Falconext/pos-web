import React, { useState } from 'react';
import Alert from "@/components/Alert";
import Loading from "@/components/Loading";
import { BRAND } from '@/lib/branding';
import { Icon } from "@iconify/react";
import { useLoginViewModel } from "./useLoginViewModel";
import loginPhoto from '@/assets/krezka_login_photo.png';
import { useNavigate } from 'react-router-dom';

const ACCENT = '#642AE5';

export default function KrezkaLoginView() {
    const { formValues, isLoading, auth, handleChange, handleLogin, handleKeyDown } = useLoginViewModel();
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('ACCESS_TOKEN');

    if (isLoading && hasToken) return <Loading />;
    if (auth && !isLoading) return null;

    return (
        <>
            <style>{`
                * { box-sizing: border-box; margin: 0; padding: 0; }
                .krk-root {
                    min-height: 100vh;
                    width: 100%;
                    display: flex;
                    font-family: 'Inter', sans-serif;
                    background: #fff;
                }
                /* ─── LEFT: full-bleed photo ─── */
                .krk-left {
                    width: 48%;
                    flex-shrink: 0;
                    position: relative;
                    overflow: hidden;
                }
                .krk-left-img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    display: block;
                }
                .krk-left-overlay {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(
                        to bottom,
                        rgba(0,0,0,0.25) 0%,
                        transparent 35%,
                        transparent 55%,
                        rgba(0,0,0,0.72) 100%
                    );
                }
                .krk-logo-wrap {
                    position: absolute;
                    top: 28px; left: 28px;
                    display: flex; align-items: center; gap: 8px;
                    z-index: 2;
                }
                .krk-logo-icon {
                    width: 36px; height: 36px;
                    background: rgba(255,255,255,0.15);
                    backdrop-filter: blur(8px);
                    border-radius: 10px;
                    display: flex; align-items: center; justify-content: center;
                    border: 1px solid rgba(255,255,255,0.25);
                    overflow: hidden;
                }
                .krk-logo-name {
                    color: #fff;
                    font-size: 15px;
                    font-weight: 700;
                    letter-spacing: 0.5px;
                }
                .krk-left-text {
                    position: absolute;
                    bottom: 40px; left: 32px; right: 32px;
                    z-index: 2;
                }
                .krk-left-title {
                    font-size: 28px;
                    font-weight: 800;
                    color: #fff;
                    line-height: 1.25;
                    margin-bottom: 8px;
                }
                .krk-left-sub {
                    font-size: 13px;
                    color: rgba(255,255,255,0.65);
                    line-height: 1.5;
                    margin-bottom: 20px;
                    max-width: 320px;
                }
                .krk-dots {
                    display: flex; gap: 6px; align-items: center;
                }
                .krk-dot {
                    width: 8px; height: 8px; border-radius: 50%;
                    background: rgba(255,255,255,0.35);
                }
                .krk-dot.active {
                    width: 22px; border-radius: 4px;
                    background: #fff;
                }
                /* ─── RIGHT: white form panel ─── */
                .krk-right {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    position: relative;
                    background: #fff;
                }
                .krk-signin-btn {
                    position: absolute;
                    top: 28px; right: 32px;
                    background: #111;
                    color: #fff;
                    border: none;
                    border-radius: 50px;
                    padding: 10px 22px;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                .krk-signin-btn:hover { background: #333; }
                .krk-form-wrap {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    padding: 48px 40px;
                    max-width: 480px;
                    width: 100%;
                }
                .krk-form-title {
                    font-size: 26px;
                    font-weight: 800;
                    color: #111;
                    margin-bottom: 4px;
                }
                .krk-form-sub {
                    font-size: 13px;
                    color: #9CA3AF;
                    margin-bottom: 32px;
                }
                .krk-field-label {
                    font-size: 13px;
                    font-weight: 600;
                    color: #374151;
                    display: block;
                    margin-bottom: 8px;
                }
                .krk-input {
                    width: 100%;
                    padding: 13px 16px;
                    border: 1.5px solid #E5E7EB;
                    border-radius: 10px;
                    font-size: 14px;
                    color: #111;
                    outline: none;
                    background: #fff;
                    transition: border-color 0.2s, box-shadow 0.2s;
                }
                .krk-input::placeholder { color: #C0C4CC; }
                .krk-input:focus {
                    border-color: ${ACCENT};
                    box-shadow: 0 0 0 3px rgba(100,42,229,0.12);
                }
                .krk-login-btn {
                    width: 100%;
                    padding: 15px;
                    border-radius: 10px;
                    background: ${ACCENT};
                    color: #fff;
                    font-size: 15px;
                    font-weight: 700;
                    border: none;
                    cursor: pointer;
                    box-shadow: 0 6px 20px rgba(100,42,229,0.35);
                    transition: opacity 0.2s, transform 0.1s;
                    letter-spacing: 0.3px;
                }
                .krk-login-btn:hover { opacity: 0.88; }
                .krk-login-btn:active { transform: scale(0.98); }
                .krk-checkbox-wrap {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                    user-select: none;
                }
                .krk-checkbox {
                    width: 16px; height: 16px;
                    border: 2px solid #D1D5DB;
                    border-radius: 4px;
                    display: flex; align-items: center; justify-content: center;
                    background: #fff;
                    flex-shrink: 0;
                    transition: background 0.2s, border-color 0.2s;
                }
                .krk-checkbox.checked {
                    background: ${ACCENT};
                    border-color: ${ACCENT};
                }
                @media (max-width: 768px) {
                    .krk-left { display: none; }
                    .krk-form-wrap { padding: 60px 28px 40px; }
                }
            `}</style>

            <div className="krk-root">
                <div className="fixed top-5 right-5 z-50" style={{ zIndex: 100 }}><Alert /></div>

                {/* ── LEFT: Photo ── */}
                <div className="krk-left">
                    <img src={loginPhoto} alt="Krezka" className="krk-left-img" />
                    <div className="krk-left-overlay" />

                    {/* Logo */}
                    <div className="krk-logo-wrap">
                        <div className="">
                            <img src={BRAND.logoWhite} alt={BRAND.name} style={{ height: 48, objectFit: 'contain' }}
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        </div>

                    </div>

                    {/* Bottom text */}
                    <div className="krk-left-text">
                        <h2 className="krk-left-title">Gestiona tu negocio<br />de forma inteligente</h2>
                        <p className="krk-left-sub">Facturación electrónica, control de inventario y más en una sola plataforma.</p>
                        <div className="krk-dots">
                            <div className="krk-dot" />
                            <div className="krk-dot active" />
                            <div className="krk-dot" />
                            <div className="krk-dot" />
                        </div>
                    </div>
                </div>

                {/* ── RIGHT: Form ── */}
                <div className="krk-right">
                    <div className="krk-form-wrap">
                        <h1 className="krk-form-title">¡Bienvenido de nuevo a {BRAND.name}!</h1>
                        <p className="krk-form-sub">Ingresa a tu cuenta</p>

                        <form onKeyDown={handleKeyDown} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            {/* Email */}
                            <div>
                                <label className="krk-field-label">Tu correo electrónico</label>
                                <input
                                    className="krk-input"
                                    autoComplete="off"
                                    type="email"
                                    name="email"
                                    value={formValues.email}
                                    onChange={handleChange}
                                    placeholder="correo@empresa.com"
                                />
                            </div>

                            {/* Password */}
                            <div>
                                <label className="krk-field-label">Contraseña</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        className="krk-input"
                                        style={{ paddingRight: 46 }}
                                        autoComplete="off"
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={formValues.password}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', display: 'flex', padding: 0 }}
                                    >
                                        <Icon icon={showPassword ? "solar:eye-bold" : "solar:eye-closed-bold"} style={{ fontSize: 18 }} />
                                    </button>
                                </div>
                            </div>

                            {/* Remember me + Forgot */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label className="krk-checkbox-wrap" onClick={() => setRememberMe(!rememberMe)}>
                                    <div className={`krk-checkbox${rememberMe ? ' checked' : ''}`}>
                                        {rememberMe && <Icon icon="solar:check-read-bold" style={{ fontSize: 10, color: '#fff' }} />}
                                    </div>
                                    <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>Recuérdame</span>
                                </label>
                                <button type="button" onClick={() => navigate('/recuperar-contrasena')} style={{ background: 'none', border: 'none', fontSize: 13, color: '#9CA3AF', cursor: 'pointer', padding: 0 }}>
                                    ¿Olvidaste tu contraseña?
                                </button>
                            </div>

                            {/* CTA */}
                            <button type="button" className="krk-login-btn" onClick={handleLogin}>
                                Iniciar Sesión
                            </button>
                        </form>

                    </div>
                </div>
            </div>
        </>
    );
}
