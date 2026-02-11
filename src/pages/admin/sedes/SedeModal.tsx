import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import Modal from '@/components/Modal';
import InputPro from '@/components/InputPro';
import Button from '@/components/Button';
import { useSedesStore } from '@/zustand/sedes';
import { Sede } from '@/interfaces/Sede';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    sede: Sede | null;
    isEdit: boolean;
}

const SedeModal: React.FC<Props> = ({ isOpen, onClose, sede, isEdit }) => {
    const { crearSede, actualizarSede, loading } = useSedesStore();

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
                <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                        <Icon icon="mdi:office-building" width={20} height={20} />
                        Datos Generales
                    </h3>
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

                        <div className="flex items-center space-x-2 mt-4">
                            <input
                                type="checkbox"
                                id="esPrincipal"
                                checked={formData.esPrincipal}
                                onChange={(e) => setFormData(prev => ({ ...prev, esPrincipal: e.target.checked }))}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                disabled={isEdit && sede?.esPrincipal} // No permitir desmarcar si ya es principal (debería requerir marcar otra como principal)
                            />
                            <label htmlFor="esPrincipal" className="text-sm text-gray-700">
                                Es Sede Principal
                            </label>
                            {isEdit && sede?.esPrincipal && <span className="text-xs text-yellow-600">(La sede principal no se puede desactivar directamente, asigne otra como principal)</span>}
                        </div>

                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <Button type="button" color="black" outline onClick={onClose} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button type="submit" color="secondary" disabled={loading}>
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
