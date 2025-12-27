import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import Modal from '@/components/Modal';
import InputPro from '@/components/InputPro';
import Button from '@/components/Button';
import useAlertStore from '@/zustand/alert';
import { enviarComprobantePorWhatsApp, verificarEstadoWhatsApp } from '@/zustand/whatsapp';

interface ModalEnviarWhatsAppProps {
    isOpen: boolean;
    onClose: () => void;
    comprobante: {
        id: number;
        serie: string;
        correlativo: number;
        comprobante: string;
        total: number;
        clienteNombre: string;
        clienteCelular?: string;
        pdfUrl?: string;
    };
}

const ModalEnviarWhatsApp = ({ isOpen, onClose, comprobante }: ModalEnviarWhatsAppProps) => {
    const { alert } = useAlertStore();
    const [numeroDestino, setNumeroDestino] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && comprobante.clienteCelular) {
            setNumeroDestino(comprobante.clienteCelular);
        }
    }, [isOpen, comprobante]);

    const handleEnviar = () => {
        if (!numeroDestino || numeroDestino.trim() === '') {
            alert('Por favor ingrese un número de WhatsApp válido', 'error');
            return;
        }

        setLoading(true);
        try {
            // Construir mensaje
            const mensaje = `Hola ${comprobante.clienteNombre}, le enviamos su comprobante electrónico ${comprobante.serie}-${String(comprobante.correlativo).padStart(8, '0')} por un total de S/ ${comprobante.total.toFixed(2)}.\n\nPuede descargarlo aquí: ${comprobante.pdfUrl || 'Solicítelo a administración'}\n\nGracias por su preferencia.`;

            const link = `https://wa.me/51${numeroDestino.replace(/\+/g, '').replace('51', '').trim()}?text=${encodeURIComponent(mensaje)}`;
            window.open(link, '_blank');

            onClose();
            setNumeroDestino('');
            useAlertStore.getState().alert('WhatsApp abierto correctamente', 'success');
        } catch (err: any) {
            useAlertStore.getState().alert('Error al abrir WhatsApp', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setNumeroDestino('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[999999999] flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Icon icon="mdi:whatsapp" className="text-4xl text-green-500" />
                        <h3 className="text-xl font-semibold">Enviar por WhatsApp</h3>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <Icon icon="mdi:close" className="text-2xl" />
                    </button>
                </div>

                {/* Información del comprobante */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">
                        Información del Comprobante
                    </h4>
                    <div className="space-y-1 text-sm">
                        <p>
                            <span className="text-gray-600">Tipo:</span>{' '}
                            <span className="font-medium">{comprobante.comprobante}</span>
                        </p>
                        <p>
                            <span className="text-gray-600">Serie-Número:</span>{' '}
                            <span className="font-medium">
                                {comprobante.serie}-{String(comprobante.correlativo).padStart(8, '0')}
                            </span>
                        </p>
                        <p>
                            <span className="text-gray-600">Cliente:</span>{' '}
                            <span className="font-medium">{comprobante.clienteNombre}</span>
                        </p>
                        <p>
                            <span className="text-gray-600">Monto:</span>{' '}
                            <span className="font-medium">S/ {comprobante.total.toFixed(2)}</span>
                        </p>
                        {!comprobante.pdfUrl && (
                            <p className="text-amber-600 text-xs mt-2 italic">
                                * Este comprobante aún no tiene PDF generado.
                            </p>
                        )}
                    </div>
                </div>

                {/* Número de destino */}
                <div className="mb-4">
                    <InputPro
                        name="numeroDestino"
                        label="Número de WhatsApp"
                        placeholder="Ej: 999 999 999"
                        value={numeroDestino}
                        onChange={(e) => setNumeroDestino(e.target.value)}
                        isLabel
                        type="text"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Ingrese el número (9 dígitos)
                    </p>
                </div>

                {/* Preview del mensaje */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <p className="text-xs text-gray-600 mb-2 font-semibold">
                        Vista previa del mensaje:
                    </p>
                    <div className="text-xs text-gray-700 whitespace-pre-wrap">
                        {`Hola ${comprobante.clienteNombre}, le enviamos su comprobante electrónico ${comprobante.serie}-${String(comprobante.correlativo).padStart(8, '0')} por un total de S/ ${comprobante.total.toFixed(2)}.\n\nPuede descargarlo aquí: ${comprobante.pdfUrl || '[Enlace no disponible]'}\n\nGracias por su preferencia.`}
                    </div>
                </div>

                {/* Botones */}
                <div className="flex gap-3">
                    <Button
                        onClick={handleClose}
                        className="flex-1 bg-gray-500 hover:bg-gray-600"
                        disabled={loading}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleEnviar}
                        className="flex-1 bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2"
                        disabled={loading || !comprobante.pdfUrl}
                    >
                        <Icon icon="mdi:whatsapp" className="text-xl" />
                        Abrir WhatsApp
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ModalEnviarWhatsApp;
