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
    };
}

const ModalEnviarWhatsApp = ({ isOpen, onClose, comprobante }: ModalEnviarWhatsAppProps) => {
    const { alert } = useAlertStore();
    const [numeroDestino, setNumeroDestino] = useState('');
    const [incluyeXML, setIncluyeXML] = useState(false);
    const [loading, setLoading] = useState(false);
    const [whatsappHabilitado, setWhatsappHabilitado] = useState(true);

    useEffect(() => {
        // Verificar si WhatsApp está habilitado
        verificarEstadoWhatsApp().then((habilitado: boolean) => {
            setWhatsappHabilitado(habilitado);
        });
    }, []);

    useEffect(() => {
        if (isOpen && comprobante.clienteCelular) {
            setNumeroDestino(comprobante.clienteCelular);
        }
    }, [isOpen, comprobante]);

    const handleEnviar = async () => {
        if (!numeroDestino || numeroDestino.trim() === '') {
            alert('Por favor ingrese un número de WhatsApp válido', 'error');
            return;
        }

        setLoading(true);
        try {
            const resultado = await enviarComprobantePorWhatsApp(
                comprobante.id,
                numeroDestino,
                incluyeXML
            );
            console.log(resultado)
            if (resultado.success) {
                useAlertStore.getState().alert('Comprobante enviado por WhatsApp exitosamente', 'success');
                onClose();
                setNumeroDestino('');
                setIncluyeXML(false);
            } else {
                useAlertStore.getState().alert(resultado.error || 'Error al enviar comprobante por WhatsApp', 'error');
            }
        } catch (err: any) {
            useAlertStore.getState().alert(err.message || 'Error al enviar comprobante por WhatsApp', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setNumeroDestino('');
        setIncluyeXML(false);
        onClose();
    };

    if (!isOpen) return null;

    if (!whatsappHabilitado) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className="bg-white rounded-lg p-6 max-w-md">
                    <div className="flex items-center justify-center mb-4">
                        <Icon icon="mdi:whatsapp" className="text-6xl text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-center mb-4">
                        WhatsApp no disponible
                    </h3>
                    <p className="text-center text-gray-600 mb-6">
                        El servicio de WhatsApp no está configurado. Contacte al administrador del sistema.
                    </p>
                    <div className="flex justify-center">
                        <Button onClick={handleClose} className="bg-gray-500 hover:bg-gray-600">
                            Cerrar
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
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
                    </div>
                </div>

                {/* Número de destino */}
                <div className="mb-4">
                    <InputPro
                        name="numeroDestino"
                        label="Número de WhatsApp"
                        placeholder="Ej: 987654321 o +51987654321"
                        value={numeroDestino}
                        onChange={(e) => setNumeroDestino(e.target.value)}
                        isLabel
                        type="text"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Ingrese el número con código de país (+51) o solo los 9 dígitos
                    </p>
                </div>

                {/* Checkbox para incluir XML (solo para comprobantes formales) */}
                {/* {['FACTURA', 'BOLETA', 'NOTA DE CREDITO', 'NOTA DE DEBITO'].includes(
                    comprobante.comprobante
                ) && (
                    <div className="mb-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={incluyeXML}
                                onChange={(e) => setIncluyeXML(e.target.checked)}
                                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                            />
                            <span className="text-sm text-gray-700">
                                Incluir archivo XML y CDR de SUNAT
                            </span>
                        </label>
                    </div>
                )} */}

                {/* Preview del mensaje */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <p className="text-xs text-gray-600 mb-2 font-semibold">
                        Vista previa del mensaje:
                    </p>
                    <div className="text-xs text-gray-700 whitespace-pre-line">
                        🧾 <strong>Comprobante Electrónico</strong>
                        {'\n\n'}
                        Tipo: {comprobante.comprobante}
                        {'\n'}
                        Serie-Número: <strong>{comprobante.serie}-{String(comprobante.correlativo).padStart(8, '0')}</strong>
                        {'\n'}
                        Monto: <strong>S/ {comprobante.total.toFixed(2)}</strong>
                        {'\n\n'}
                        📄 <strong>Adjuntos:</strong>
                        {'\n'}- Comprobante PDF
                        {incluyeXML && (
                            <>
                                {'\n'}- Archivo XML
                                {'\n'}- Constancia SUNAT (CDR)
                            </>
                        )}
                        {'\n\n'}
                        Gracias por su preferencia. 🙏
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
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Icon icon="eos-icons:loading" className="text-xl" />
                                Enviando...
                            </>
                        ) : (
                            <>
                                <Icon icon="mdi:whatsapp" className="text-xl" />
                                Enviar
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ModalEnviarWhatsApp;
