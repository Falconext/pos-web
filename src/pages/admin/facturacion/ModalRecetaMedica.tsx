import { useState } from "react";
import { Icon } from "@iconify/react";
import { get } from "@/utils/fetch";
import type { IDatosReceta } from "@/features/admin/facturacion/FacturacionModel";

interface Props {
    isOpen: boolean;
    item: any;
    onConfirmar: (datos: IDatosReceta) => void;
    onCerrar: () => void;
}

const inputCls = "w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none";

export const ModalRecetaMedica = ({ isOpen, item, onConfirmar, onCerrar }: Props) => {
    const [datos, setDatos] = useState<IDatosReceta>({});
    const [reniecLoading, setReniecLoading] = useState(false);
    const [reniecNombre, setReniecNombre] = useState<string | null>(null);
    const [reniecError, setReniecError] = useState<string | null>(null);

    if (!isOpen || !item) return null;

    const requiereNumero = item.requiereReceta;
    const requiereControlado = item.controlado;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (requiereNumero && !datos.numeroReceta?.trim()) return;
        if (requiereControlado && (!datos.dniPaciente?.trim() || !datos.medicoNombre?.trim())) return;
        onConfirmar(datos);
    };

    const handleValidarDni = async () => {
        const dni = datos.dniPaciente?.trim();
        if (!dni || dni.length !== 8) {
            setReniecError('Ingresa un DNI de 8 dígitos');
            return;
        }
        setReniecLoading(true);
        setReniecNombre(null);
        setReniecError(null);
        try {
            const resp: any = await get(`clientes/consultar?numero=${dni}&tipo=DNI`);
            const nombre = resp?.nombre || resp?.data?.nombre || resp?.nombreCompleto || resp?.data?.nombreCompleto;
            if (nombre) {
                setReniecNombre(nombre);
                setDatos(d => ({ ...d, nombrePaciente: nombre }));
            } else {
                setReniecError('DNI no encontrado en RENIEC');
            }
        } catch {
            setReniecError('No se pudo consultar RENIEC — continúa igualmente');
        } finally {
            setReniecLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50  " onClick={onCerrar} />
            <div className="relative bg-white dark:bg-[#1E2435] rounded-2xl shadow-2xl w-full max-w-md p-6 z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                        <div className="w-9 h-9 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                            <Icon icon="solar:document-medicine-bold" className="text-red-600 dark:text-red-400 text-xl" />
                        </div>
                        <div>
                            <h3 className="font-black text-gray-900 dark:text-white text-base">Datos de Receta</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{item.descripcion}</p>
                        </div>
                    </div>
                    <button onClick={onCerrar} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                        <Icon icon="solar:close-circle-linear" className="text-gray-500 text-xl" />
                    </button>
                </div>

                {item.controlado && (
                    <div className="mb-4 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                        <p className="text-xs text-amber-700 dark:text-amber-300 font-semibold flex items-center gap-1.5">
                            <Icon icon="solar:danger-triangle-bold" />
                            Medicamento controlado — datos del paciente y médico obligatorios
                        </p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {requiereNumero && (
                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">
                                Número de Receta <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={datos.numeroReceta ?? ""}
                                onChange={e => setDatos(d => ({ ...d, numeroReceta: e.target.value }))}
                                placeholder="Ej. RX-2024-001"
                                className={inputCls}
                                required
                            />
                        </div>
                    )}

                    {requiereControlado && (
                        <>
                            {/* DNI con validación RENIEC */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">
                                    DNI del Paciente <span className="text-red-500">*</span>
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={datos.dniPaciente ?? ""}
                                        onChange={e => {
                                            setDatos(d => ({ ...d, dniPaciente: e.target.value }));
                                            setReniecNombre(null);
                                            setReniecError(null);
                                        }}
                                        placeholder="12345678"
                                        maxLength={8}
                                        className={inputCls + " flex-1"}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={handleValidarDni}
                                        disabled={reniecLoading || (datos.dniPaciente?.length ?? 0) !== 8}
                                        className="px-3 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1 flex-shrink-0"
                                    >
                                        {reniecLoading
                                            ? <Icon icon="solar:spinner-bold" className="animate-spin" />
                                            : <Icon icon="solar:user-check-rounded-bold" />
                                        }
                                        Validar
                                    </button>
                                </div>
                                {reniecNombre && (
                                    <div className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                                        <Icon icon="solar:check-circle-bold" />
                                        {reniecNombre}
                                    </div>
                                )}
                                {reniecError && (
                                    <div className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-semibold">
                                        <Icon icon="solar:info-circle-bold" />
                                        {reniecError}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">
                                    Nombre del Médico <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={datos.medicoNombre ?? ""}
                                    onChange={e => setDatos(d => ({ ...d, medicoNombre: e.target.value }))}
                                    placeholder="Dr. García López"
                                    className={inputCls}
                                    required
                                />
                            </div>
                        </>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onCerrar}
                            className="flex-1 py-2.5 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
                        >
                            <Icon icon="solar:check-circle-bold" />
                            Confirmar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
