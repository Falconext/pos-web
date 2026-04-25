import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import InputPro from '@/components/InputPro';
import Button from '@/components/Button';
import useAlertStore from '@/zustand/alert';
import { post } from '@/utils/fetch';

interface ModalEnviarWhatsAppProps {
    isOpen: boolean;
    onClose: () => void;
    defaultTab?: 'whatsapp' | 'email';
    comprobante: {
        id: number;
        serie: string;
        correlativo: number;
        comprobante: string;
        total: number;
        clienteNombre: string;
        clienteCelular?: string;
        clienteEmail?: string;
        pdfUrl?: string;
    };
}

type Tab = 'whatsapp' | 'email';

const ModalEnviarWhatsApp = ({ isOpen, onClose, defaultTab = 'whatsapp', comprobante }: ModalEnviarWhatsAppProps) => {
    const { alert } = useAlertStore();

    const [tab, setTab] = useState<Tab>(defaultTab);
    const [numeroDestino, setNumeroDestino] = useState('');
    const [emailDestino, setEmailDestino] = useState('');
    const [pdfUrl, setPdfUrl] = useState<string | undefined>(comprobante.pdfUrl);
    const [generando, setGenerando] = useState(false);
    const [enviandoWhatsApp, setEnviandoWhatsApp] = useState(false);
    const [enviandoEmail, setEnviandoEmail] = useState(false);

    // Reset y pre-llenar al abrir
    useEffect(() => {
        if (!isOpen) return;
        setTab(defaultTab);
        setPdfUrl(comprobante.pdfUrl);
        setNumeroDestino(comprobante.clienteCelular || '');
        setEmailDestino(comprobante.clienteEmail || '');
        generarPdf();
    }, [isOpen, comprobante.id, defaultTab]);

    const generarPdf = async () => {
        setGenerando(true);
        try {
            const res = await post<{ pdfUrl: string }>(
                `/comprobante/${comprobante.id}/generar-pdf`,
                {},
            );
            const url = (res as any)?.data?.pdfUrl;
            if (url) setPdfUrl(url);
        } finally {
            setGenerando(false);
        }
    };

    const handleEnviarWhatsApp = async () => {
        const num = numeroDestino.trim();
        if (!num) {
            alert('Ingrese un número de WhatsApp válido', 'error');
            return;
        }
        setEnviandoWhatsApp(true);
        const res = await post(`/comprobante/${comprobante.id}/enviar-whatsapp`, { celular: num });
        setEnviandoWhatsApp(false);
        if ((res as any).error) {
            alert((res as any).error, 'error');
            return;
        }
        alert('Mensaje de WhatsApp enviado correctamente', 'success');
        handleClose();
    };

    const handleEnviarEmail = async () => {
        const email = emailDestino.trim();
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            alert('Ingrese un correo electrónico válido', 'error');
            return;
        }
        setEnviandoEmail(true);
        const res = await post(`/comprobante/${comprobante.id}/enviar-email`, { email });
        setEnviandoEmail(false);
        if ((res as any).error) {
            alert((res as any).error, 'error');
            return;
        }
        alert('Correo enviado correctamente', 'success');
        handleClose();
    };

    const handleClose = () => {
        setNumeroDestino('');
        setEmailDestino('');
        onClose();
    };

    if (!isOpen) return null;

    const serie = `${comprobante.serie}-${String(comprobante.correlativo).padStart(8, '0')}`;
    const monto = `S/ ${(comprobante.total ?? 0).toFixed(2)}`;

    return (
        <div className="fixed inset-0 z-[999999999] flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900">Enviar comprobante</h3>
                    <button
                        onClick={handleClose}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
                    >
                        <Icon icon="mdi:close" className="text-xl" />
                    </button>
                </div>

                <div className="px-6 pt-4 pb-6 space-y-4">
                    {/* Info del comprobante */}
                    <div className="bg-gray-50 rounded-xl p-4 space-y-1.5 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Tipo</span>
                            <span className="font-semibold text-gray-900">{comprobante.comprobante}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Serie-Número</span>
                            <span className="font-semibold text-gray-900">{serie}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Cliente</span>
                            <span className="font-semibold text-gray-900 truncate max-w-[60%] text-right">{comprobante.clienteNombre}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Monto</span>
                            <span className="font-bold text-gray-900">{monto}</span>
                        </div>

                        {/* Estado PDF */}
                        <div className="pt-1">
                            {generando ? (
                                <div className="flex items-center gap-2 text-violet-600 text-xs font-medium">
                                    <Icon icon="line-md:loading-twotone-loop" className="text-base" />
                                    Generando PDF...
                                </div>
                            ) : pdfUrl ? (
                                <div className="flex items-center gap-2 text-emerald-600 text-xs font-medium">
                                    <Icon icon="solar:check-circle-bold" className="text-base" />
                                    PDF listo
                                    <a href={pdfUrl} target="_blank" rel="noreferrer" className="underline ml-1">Ver</a>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <span className="text-amber-600 text-xs italic">PDF no disponible</span>
                                    <button
                                        onClick={generarPdf}
                                        className="text-xs text-violet-600 font-semibold hover:underline"
                                    >
                                        Generar ahora
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                        <button
                            onClick={() => setTab('whatsapp')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
                                tab === 'whatsapp'
                                    ? 'bg-white text-green-600 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <Icon icon="mdi:whatsapp" className="text-lg" />
                            WhatsApp
                        </button>
                        <button
                            onClick={() => setTab('email')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
                                tab === 'email'
                                    ? 'bg-white text-violet-600 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <Icon icon="solar:letter-bold" className="text-lg" />
                            Email
                        </button>
                    </div>

                    {/* WhatsApp tab */}
                    {tab === 'whatsapp' && (
                        <div className="space-y-4">
                            <InputPro
                                name="numeroDestino"
                                label="Número de WhatsApp"
                                placeholder="Ej: 999 999 999"
                                value={numeroDestino}
                                onChange={(e) => setNumeroDestino(e.target.value)}
                                isLabel
                                type="text"
                            />

                            {/* Info */}
                            <div className="bg-green-50 border border-green-100 rounded-xl p-3 flex items-start gap-2">
                                <Icon icon="mdi:whatsapp" className="text-green-500 text-base mt-0.5 shrink-0" />
                                <p className="text-xs text-gray-600 leading-relaxed">
                                    El PDF del comprobante se enviará directamente al WhatsApp del cliente como documento adjunto.
                                </p>
                            </div>

                            <div className="flex gap-3 pt-1">
                                <Button onClick={handleClose} className="flex-1 text-gray-700 bg-gray-100 hover:bg-gray-200">
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={handleEnviarWhatsApp}
                                    disabled={enviandoWhatsApp || !numeroDestino.trim()}
                                    className="flex-1 bg-green-500 hover:bg-green-600 text-white flex items-center justify-center gap-2 disabled:opacity-60"
                                >
                                    {enviandoWhatsApp ? (
                                        <Icon icon="line-md:loading-twotone-loop" className="text-xl" />
                                    ) : (
                                        <Icon icon="mdi:whatsapp" className="text-xl" />
                                    )}
                                    {enviandoWhatsApp ? 'Enviando...' : 'Enviar por WhatsApp'}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Email tab */}
                    {tab === 'email' && (
                        <div className="space-y-4">
                            <InputPro
                                name="emailDestino"
                                label="Correo electrónico"
                                placeholder="cliente@ejemplo.com"
                                value={emailDestino}
                                onChange={(e) => setEmailDestino(e.target.value)}
                                isLabel
                                type="email"
                            />
                            <p className="text-xs text-gray-400">
                                El PDF del comprobante se enviará como adjunto al correo indicado.
                            </p>

                            <div className="flex gap-3 pt-1">
                                <Button onClick={handleClose} className="flex-1 text-gray-700 bg-gray-100 hover:bg-gray-200">
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={handleEnviarEmail}
                                    disabled={enviandoEmail || generando || !emailDestino.trim()}
                                    className="flex-1 bg-violet-600 hover:bg-violet-700 text-white flex items-center justify-center gap-2 disabled:opacity-60"
                                >
                                    {enviandoEmail ? (
                                        <Icon icon="line-md:loading-twotone-loop" className="text-xl" />
                                    ) : (
                                        <Icon icon="solar:letter-bold" className="text-xl" />
                                    )}
                                    {enviandoEmail ? 'Enviando...' : 'Enviar correo'}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ModalEnviarWhatsApp;
