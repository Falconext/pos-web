import { ChangeEvent, Dispatch, useEffect } from 'react';
import Modal from '@/components/Modal';
import Select from '@/components/Select';
import { IFormClient } from '@/interfaces/clients';
import { useClientsStore } from '@/zustand/clients';
import InputPro from '@/components/InputPro';
import SelectUbigeo from '@/components/Select/SelectUbigeo';
import { useExtentionsStore } from '@/zustand/extentions';
import Button from '@/components/Button';

interface IProps {
    isOpenModal: boolean;
    closeModal: () => void;
    isEdit: boolean;
    setIsOpenModal: Dispatch<boolean>;
    formValues: IFormClient;
    setFormValues: (values: any) => void;
    errors: any;
    setErrors: (errors: any) => void;
    grupoFarmacia?: 'pacientes' | 'empresas' | 'medicos';
}

const persons = [
    { id: 'CLIENTE', value: 'CLIENTE' },
    { id: 'PROVEEDOR', value: 'PROVEEDOR' },
    { id: 'CLIENTE_PROVEEDOR', value: 'CLIENTE-PROVEEDOR' },
];

const DOC_TYPES = [
    { key: 'DNI', label: 'DNI', digits: 8, hint: 'Ingresa 8 dígitos para consultar automáticamente' },
    { key: 'RUC', label: 'RUC', digits: 11, hint: 'Ingresa 11 dígitos para consultar RUC automáticamente' },
    { key: 'CE', label: 'C.E.', digits: null, hint: null },
    { key: 'PASAPORTE', label: 'Pasaporte', digits: null, hint: null },
    { key: 'OTRO', label: 'Otro', digits: null, hint: null },
];

export default function ModalClient({
    isOpenModal,
    closeModal,
    setIsOpenModal,
    isEdit,
    formValues,
    setFormValues,
    errors,
    setErrors,
    grupoFarmacia,
}: IProps) {
    const { editClients, addClients, getClientFromDoc } = useClientsStore();
    const { ubigeos, getUbigeos } = useExtentionsStore();

    const modalTitle = isEdit
        ? grupoFarmacia === 'pacientes' ? 'Editar Paciente'
        : grupoFarmacia === 'empresas'  ? 'Editar Empresa'
        : 'Editar Cliente'
        : grupoFarmacia === 'pacientes' ? 'Nuevo Paciente'
        : grupoFarmacia === 'empresas'  ? 'Nueva Empresa'
        : 'Nuevo Cliente';

    const grupoBadge = grupoFarmacia === 'pacientes'
        ? { label: 'Paciente', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: '👤' }
        : grupoFarmacia === 'empresas'
        ? { label: 'Empresa farmacéutica', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: '🏢' }
        : null;

    useEffect(() => {
        getUbigeos();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const activeTipoDoc = formValues?.tipoDoc || 'DNI';
    const activeDocType = DOC_TYPES.find(d => d.key === activeTipoDoc) ?? DOC_TYPES[0];

    const handleTipoDocChange = (key: string) => {
        setFormValues({ ...formValues, tipoDoc: key, nroDoc: '' });
        setErrors({ ...errors, nroDoc: '' });
    };

    const handleChange = async (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const updatedFormValues = { ...formValues, [name]: value };
        setFormValues(updatedFormValues);

        if (name === 'nroDoc') {
            const clean = value.trim();
            const shouldLookup =
                (activeTipoDoc === 'DNI' && clean.length === 8) ||
                (activeTipoDoc === 'RUC' && clean.length === 11);

            if (shouldLookup) {
                const result = await getClientFromDoc(clean, activeTipoDoc);
                if (result) {
                    setFormValues({
                        ...updatedFormValues,
                        departamento: result.departamento || '',
                        distrito: result.distrito || '',
                        provincia: result.provincia || '',
                        ubigeo: result.ubigeo_sunat || '',
                        nombre: result.nombre_completo || result.nombre_o_razon_social || '',
                        direccion: result.direccion || result.direccion_completa || '',
                    });
                }
            }
        }
    };

    const validateForm = () => {
        const doc = formValues?.nroDoc?.trim() || '';
        let nroDocError = '';

        if (!doc) {
            nroDocError = 'El número de documento es obligatorio';
        } else if (activeTipoDoc === 'DNI') {
            nroDocError = /^\d{8}$/.test(doc) ? '' : 'El DNI debe contener exactamente 8 dígitos numéricos';
        } else if (activeTipoDoc === 'RUC') {
            nroDocError = /^(10|20)\d{9}$/.test(doc) ? '' : 'El RUC debe contener 11 dígitos y comenzar con 10 o 20';
        }

        const newErrors: any = {
            nombre: formValues?.nombre?.trim() ? '' : 'La Razón social o nombre del cliente es obligatorio',
            nroDoc: nroDocError,
        };
        setErrors(newErrors);
        return Object.values(newErrors).every((e) => !e);
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;
        const payload = { ...formValues, tipoDoc: activeTipoDoc };

        if (Number(formValues?.id) !== 0 && isEdit) {
            editClients(payload);
            closeModal();
        } else {
            addClients({ ...payload, estado: 'ACTIVO' });
            closeModal();
        }
    };

    const handleChangeSelect = (idValue: any, value: any, name: any, id: any) => {
        setFormValues({ ...formValues, [name]: value, [id]: idValue });
    };

    const inputPlaceholder = activeDocType.key === 'DNI' ? 'Nro. de DNI'
        : activeDocType.key === 'RUC' ? 'Nro. de RUC'
            : activeDocType.key === 'CE' ? 'Nro. de Carnet de Extranjería'
                : activeDocType.key === 'PASAPORTE' ? 'Nro. de Pasaporte'
                    : 'Nro. de documento';

    // Filtrar tipos de documento según el grupo
    const visibleDocTypes = grupoFarmacia === 'empresas'
        ? DOC_TYPES.filter(d => d.key === 'RUC' || d.key === 'OTRO')
        : grupoFarmacia === 'pacientes'
        ? DOC_TYPES.filter(d => d.key !== 'RUC')
        : DOC_TYPES;

    return (
        <div>
            {isOpenModal && (
                <Modal width="600px" height="auto" position="right" isOpenModal={isOpenModal} closeModal={closeModal} title={modalTitle}>

                    {/* Banner de tipo — solo en modo farmacia */}
                    {grupoBadge && (
                        <div className={`mx-6 mt-4 flex items-center gap-2.5 px-4 py-2.5 rounded-xl ${grupoBadge.color}`}>
                            <span className="text-base">{grupoBadge.icon}</span>
                            <div>
                                <p className="text-xs font-bold">{grupoBadge.label}</p>
                                <p className="text-xs opacity-75">Tipo asignado según el grupo seleccionado</p>
                            </div>
                        </div>
                    )}

                    <div className="md:px-6 mt-5 space-y-4">

                        {/* Fila 1: Tipo de documento (botones) */}
                        <div>
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wide mb-2">N° de Documento</p>
                            <div className="flex flex-wrap gap-2">
                                {visibleDocTypes.map((dt) => (
                                    <button
                                        key={dt.key}
                                        type="button"
                                        onClick={() => handleTipoDocChange(dt.key)}
                                        className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all duration-150 ${activeTipoDoc === dt.key
                                            ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white'
                                            : 'bg-white dark:bg-transparent text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:border-gray-500'
                                        }`}
                                    >
                                        {dt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Fila 2: Nro. documento + Nombre (misma fila) */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <InputPro
                                    autocomplete="off"
                                    error={errors.nroDoc}
                                    value={formValues?.nroDoc}
                                    name="nroDoc"
                                    onChange={handleChange}
                                    isLabel
                                    label={inputPlaceholder}
                                />
                                {activeDocType.hint && (
                                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                        <span className="inline-block w-3.5 h-3.5 rounded-full border border-gray-400 text-center leading-3 text-[10px]">i</span>
                                        {activeDocType.hint}
                                    </p>
                                )}
                            </div>
                            <div>
                                <InputPro autocomplete="off" value={formValues?.nombre} error={errors.nombre} name="nombre" onChange={handleChange} isLabel label="Nombre o Razón social" />
                            </div>
                        </div>

                        {/* Selector persona — solo si no hay grupo farmacia fijo */}
                        {!grupoBadge && (
                            <Select defaultValue={formValues?.persona} error={''} isSearch options={persons} id="persona" name="personaName" value="" onChange={handleChangeSelect} icon="clarity:box-plot-line" isIcon label="Persona" />
                        )}

                        {/* Dirección */}
                        <InputPro autocomplete="off" error={errors.direccion} value={formValues?.direccion} name="direccion" onChange={handleChange} isLabel label="Dirección" />

                        {/* Correo + Celular */}
                        <div className="grid grid-cols-2 gap-4">
                            <InputPro autocomplete="off" value={formValues?.email} error={errors.email} name="email" onChange={handleChange} isLabel label="Correo principal" />
                            <InputPro autocomplete="off" value={formValues?.telefono} error={errors.telefono} name="phone" onChange={handleChange} isLabel label="Celular" />
                        </div>

                        {/* Ubigeo */}
                        <SelectUbigeo
                            value={formValues?.departamento ? `${formValues?.departamento}/${formValues?.provincia}/${formValues?.distrito}` : ''}
                            isSearch
                            options={ubigeos}
                            name="nombreUbigeo"
                            id="ubigeo"
                            onChange={handleChangeSelect}
                            label="Seleccionar ubigeo"
                        />
                    </div>
                    <div className="flex gap-5 justify-end mt-8 mb-5 md:pr-5">
                        <Button color="gray" onClick={() => setIsOpenModal(false)}>Cancelar</Button>
                        <Button color="secondary" onClick={handleSubmit}>{isEdit ? 'Editar' : 'Guardar'}</Button>
                    </div>
                </Modal>
            )}
        </div>
    );
}
