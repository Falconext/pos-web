import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import Modal from '@/components/Modal';
import InputPro from '@/components/InputPro';
import Button from '@/components/Button';
import { useSedesStore } from '@/zustand/sedes';
import { useAuthStore } from '@/zustand/auth';
import { Sede } from '@/interfaces/Sede';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    sede: Sede | null;
    isEdit: boolean;
}

const SedeModal: React.FC<Props> = ({ isOpen, onClose, sede, isEdit }) => {
    const { crearSede, actualizarSede, loading, sedes } = useSedesStore();
    const { auth } = useAuthStore();

    // Leer maxSedes desde el plan del usuario autenticado
    // Aseguramos fallback a 1 por seguridad, pero si tiene plan (MEGA-ANUAL) debería tomarlo
    const maxSedes = (auth as any)?.empresa?.plan?.maxSedes || 1;
    const currentSedes = sedes.filter(s => (s as any).activo !== false).length;
    const canCreate = isEdit || currentSedes < maxSedes;

    const [formData, setFormData] = useState({
        nombre: '',
        direccion: '',
        codigoSunat: '',
        esPrincipal: false,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (sede && isEdit) {
            setFormData({
                nombre: sede.nombre,
                direccion: sede.direccion || '',
                codigoSunat: sede.codigoSunat || '',
                esPrincipal: sede.esPrincipal,
            });
        } else {
            setFormData({
                nombre: '',
                direccion: '',
                codigoSunat: '',
                esPrincipal: false,
            });
        }
        setErrors({});
    }, [sede, isEdit, isOpen]);

    const handleInputChange = (e: any) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es obligatorio';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            if (isEdit && sede) {
                await actualizarSede(sede.id, formData);
            } else {
                await crearSede(formData);
            }
            onClose();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <Modal
            isOpenModal={isOpen}
            closeModal={onClose}
            title={`${isEdit ? 'Editar' : 'Crear'} Sede`}
            width="600px"
        >
            <form onSubmit={handleSubmit} className="space-y-6 p-6">
                <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-slate-800 p-5">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                        <Icon icon="solar:buildings-bold-duotone" className="text-blue-600 dark:text-blue-400" />
                        Datos de la Sede
                    </h3>

                    {!isEdit && !canCreate && (
                        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 mb-5 rounded-r-xl">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <Icon icon="mdi:alert-circle" className="h-5 w-5 text-red-500" />
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-red-700 dark:text-red-400 font-bold">
                                        Límite de sedes alcanzado ({maxSedes})
                                    </p>
                                    <p className="text-xs text-red-600 dark:text-red-400/80 mt-1">
                                        Has alcanzado el límite permitido por tu plan. Contacta a soporte para actualizarlo.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        <InputPro
                            type="text"
                            name="nombre"
                            value={formData.nombre}
                            onChange={handleInputChange}
                            label="Nombre de la Sede"
                            isLabel
                            error={errors.nombre}
                            placeholder="Ej: Sede Principal, Sucursal A"
                        />

                        <InputPro
                            type="text"
                            name="direccion"
                            value={formData.direccion}
                            onChange={handleInputChange}
                            label="Dirección"
                            isLabel
                            placeholder="Av. Ejemplo 123"
                        />

                        <InputPro
                            type="text"
                            name="codigoSunat"
                            value={formData.codigoSunat}
                            onChange={handleInputChange}
                            label="Código SUNAT (Anexo)"
                            isLabel
                            placeholder="0000"
                            maxLength={4}
                        />

                        <div className="flex items-center space-x-2 mt-4 bg-gray-50/50 dark:bg-slate-900/30 p-3 rounded-xl border border-gray-100 dark:border-slate-800">
                            <input
                                type="checkbox"
                                id="esPrincipal"
                                checked={formData.esPrincipal}
                                onChange={(e) => setFormData(prev => ({ ...prev, esPrincipal: e.target.checked }))}
                                className="h-5 w-5 text-blue-600 dark:text-blue-500 focus:ring-blue-500 dark:focus:ring-blue-600 bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700 rounded transition-colors"
                                disabled={isEdit && sede?.esPrincipal}
                            />
                            <label htmlFor="esPrincipal" className="text-sm font-bold text-gray-700 dark:text-gray-300 cursor-pointer">
                                Es Sede Principal
                            </label>
                            {isEdit && sede?.esPrincipal && <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold ml-2 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-full border border-emerald-200 dark:border-emerald-800/50 uppercase tracking-wider">Sede Principal</span>}
                        </div>

                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <Button type="button" color="black" outline onClick={onClose} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button type="submit" color="secondary" disabled={loading || (!isEdit && !canCreate)}>
                        {loading ? (
                            <>
                                <Icon icon="mdi:loading" className="animate-spin mr-2" /> Saving...
                            </>
                        ) : (
                            <>
                                <Icon icon="mdi:content-save" className="mr-2" /> {isEdit ? 'Actualizar' : 'Crear'}
                            </>
                        )}

                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default SedeModal;
