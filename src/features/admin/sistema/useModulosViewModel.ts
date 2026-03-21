import { useState, useEffect } from 'react';
import { useModulosStore, IModulo } from '@/zustand/modulos';
import useAlertStore from '@/zustand/alert';

const initialForm: Partial<IModulo> = { codigo: '', nombre: '', descripcion: '', icono: '', activo: true, orden: 0 };

export const useModulosViewModel = () => {
    const { modulos, loading, getAllModulos, createModulo, updateModulo, deleteModulo } = useModulosStore();
    const { alert } = useAlertStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [currentId, setCurrentId] = useState<number | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [modalConfirmOpen, setModalConfirmOpen] = useState(false);
    const [form, setForm] = useState(initialForm);

    useEffect(() => { getAllModulos(); }, []);

    const handleOpenCreate = () => {
        setIsEdit(false);
        setForm({ ...initialForm, orden: modulos.length + 1 });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (modulo: IModulo) => {
        setIsEdit(true); setCurrentId(modulo.id);
        setForm({ ...modulo }); setIsModalOpen(true);
    };

    const handleSubmit = async () => {
        if (!form.codigo || !form.nombre) { alert('Código y nombre son obligatorios', 'warning'); return; }
        const success = isEdit && currentId
            ? await updateModulo(currentId, form)
            : await createModulo(form);
        if (success) {
            alert(isEdit ? 'Módulo actualizado' : 'Módulo creado', 'success');
            setIsModalOpen(false);
        }
    };

    const confirmDelete = (id: number) => { setDeleteId(id); setModalConfirmOpen(true); };

    const handleDelete = async () => {
        if (!deleteId) return;
        const success = await deleteModulo(deleteId);
        if (success) { alert('Módulo eliminado', 'success'); setModalConfirmOpen(false); }
    };

    return { modulos, loading, isModalOpen, setIsModalOpen, isEdit, form, setForm, modalConfirmOpen, setModalConfirmOpen, handleOpenCreate, handleOpenEdit, handleSubmit, confirmDelete, handleDelete };
};
