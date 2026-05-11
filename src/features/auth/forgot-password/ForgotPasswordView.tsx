import React from 'react';
import Alert from '@/components/Alert';
import { BRAND } from '@/lib/branding';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import loginPhoto from '@/assets/krezka_login_photo.png';
import { useForgotPasswordViewModel } from './useForgotPasswordViewModel';

const ACCENT = '#642AE5';

export default function ForgotPasswordView() {
    const navigate = useNavigate();
    const { email, isLoading, sent, handleChange, handleSubmit, handleKeyDown } = useForgotPasswordViewModel();

    return (
        <>
            <style>{`
                * { box-sizing: border-box; margin: 0; padding: 0; }
                .fp-root {
                    min-height: 100vh; width: 100%;
                    display: flex; font-family: 'Inter', sans-serif; background: #fff;
                }
                .fp-left {
                    width: 48%; flex-shrink: 0;
                    position: relative; overflow: hidden;
                }
                .fp-left img { width: 100%; height: 100%; object-fit: cover; display: block; }
                .fp-overlay {
                    position: absolute; inset: 0;
                    background: linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 40%, rgba(0,0,0,0.7) 100%);
                }
                .fp-logo-wrap {
                    position: absolute; top: 28px; left: 28px;
                    display: flex; align-items: center; gap: 8px; z-index: 2;
                }
                .fp-logo-icon {
                    width: 36px; height: 36px;
                    background: rgba(255,255,255,0.15); backdrop-filter: blur(8px);
                    border-radius: 10px; display: flex; align-items: center; justify-content: center;
                    border: 1px solid rgba(255,255,255,0.25); overflow: hidden;
                }
                .fp-right {
                    flex: 1; display: flex; flex-direction: column;
                    align-items: center; background: #fff;
                }
                .fp-form-wrap {
                    flex: 1; display: flex; flex-direction: column;
                    justify-content: center; padding: 48px 40px;
                    max-width: 480px; width: 100%;
                }
                .fp-input {
                    width: 100%; padding: 13px 16px;
                    border: 1.5px solid #E5E7EB; border-radius: 10px;
                    font-size: 14px; color: #111; outline: none;
                    background: #fff; transition: border-color 0.2s, box-shadow 0.2s;
                }
                .fp-input::placeholder { color: #C0C4CC; }
                .fp-input:focus { border-color: ${ACCENT}; box-shadow: 0 0 0 3px ${ACCENT}20; }
                .fp-btn {
                    width: 100%; padding: 15px; border-radius: 10px;
                    background: ${ACCENT}; color: #fff; font-size: 15px;
                    font-weight: 700; border: none; cursor: pointer;
                    box-shadow: 0 6px 20px ${ACCENT}40;
                    transition: opacity 0.2s, transform 0.1s;
                }
                .fp-btn:hover { opacity: 0.88; }
                .fp-btn:active { transform: scale(0.98); }
                .fp-btn:disabled { opacity: 0.6; cursor: not-allowed; }
                .fp-success-box {
                    text-align: center; padding: 32px 24px;
                    background: #F0FDF4; border-radius: 16px;
                    border: 1.5px solid #86EFAC;
                }
                @media (max-width: 768px) { .fp-left { display: none; } .fp-form-wrap { padding: 60px 28px; } }
            `}</style>

            <div className="fp-root">
                <div className="fixed top-5 right-5 z-50"><Alert /></div>

                {/* Left photo */}
                <div className="fp-left">
                    <img src={loginPhoto} alt={BRAND.name} />
                    <div className="fp-overlay" />
                    <div className="fp-logo-wrap">
                        <div className="fp-logo-icon">
                            <img src={BRAND.logoWhite} alt={BRAND.name} style={{ height: 22, objectFit: 'contain' }}
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        </div>
                    </div>
                </div>

                {/* Right form */}
                <div className="fp-right">
                    <div className="fp-form-wrap">
                        {/* Back to login */}
                        <button
                            onClick={() => navigate('/login')}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 13, marginBottom: 32, padding: 0 }}
                        >
                            <Icon icon="solar:arrow-left-linear" style={{ fontSize: 16 }} />
                            Volver al inicio de sesión
                        </button>

                        {sent ? (
                            <div className="fp-success-box">
                                <div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>
                                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#166534', marginBottom: 8 }}>
                                    ¡Revisa tu correo!
                                </h2>
                                <p style={{ fontSize: 14, color: '#15803D', lineHeight: 1.6 }}>
                                    Si tu correo está registrado, recibirás un enlace para restablecer tu contraseña en los próximos minutos.
                                </p>
                                <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 16 }}>
                                    Revisa también tu carpeta de spam.
                                </p>
                            </div>
                        ) : (
                            <>
                                <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111', marginBottom: 6 }}>
                                    ¿Olvidaste tu contraseña?
                                </h1>
                                <p style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 32, lineHeight: 1.5 }}>
                                    Ingresa tu correo y te enviaremos un enlace para recuperar el acceso a tu cuenta.
                                </p>

                                <form onKeyDown={handleKeyDown} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                                            Correo electrónico
                                        </label>
                                        <input
                                            className="fp-input"
                                            type="email"
                                            value={email}
                                            onChange={handleChange}
                                            placeholder="correo@empresa.com"
                                            autoComplete="email"
                                        />
                                    </div>

                                    <button type="button" className="fp-btn" onClick={handleSubmit} disabled={isLoading}>
                                        {isLoading ? (
                                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                                <Icon icon="solar:spinner-bold" style={{ fontSize: 18, animation: 'spin 1s linear infinite' }} />
                                                Enviando...
                                            </span>
                                        ) : 'Enviar instrucciones'}
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
