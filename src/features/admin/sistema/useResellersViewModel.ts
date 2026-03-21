import { useState, useEffect } from 'react';
import { useResellerStore } from '@/zustand/resellers';

export const useResellersViewModel = () => {
    const { resellers, getAllResellers, createReseller, recargarSaldo } = useResellerStore();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);
    const [selectedReseller, setSelectedReseller] = useState<any>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const [formData, setFormData] = useState({ nombre: '', codigo: '', representante: '', telefono: '', email: '' });
    const [rechargeData, setRechargeData] = useState({ monto: '', referencia: '' });

    useEffect(() => { getAllResellers(); }, []);

    const handleCreateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleRechargeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setRechargeData(prev => ({ ...prev, [name]: value }));
    };

    const openCreateModal = () => {
        setIsEditMode(false); setEditingId(null);
        setFormData({ nombre: '', codigo: '', representante: '', telefono: '', email: '' });
        setIsCreateModalOpen(true);
    };

    const openEditModal = (reseller: any) => {
        setIsEditMode(true); setEditingId(reseller.id);
        setFormData({ nombre: reseller.nombre, codigo: reseller.codigo, representante: reseller.representante || '', telefono: reseller.telefono || '', email: reseller.email });
        setIsCreateModalOpen(true);
    };

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const result = isEditMode && editingId
            ? await useResellerStore.getState().updateReseller(editingId, formData)
            : await createReseller(formData);
        if (result.success) { setIsCreateModalOpen(false); setFormData({ nombre: '', codigo: '', representante: '', telefono: '', email: '' }); }
    };

    const openRechargeModal = (reseller: any) => {
        setSelectedReseller(reseller);
        setRechargeData({ monto: '', referencia: '' });
        setIsRechargeModalOpen(true);
    };

    const handleRechargeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedReseller) return;
        const monto = parseFloat(rechargeData.monto);
        if (isNaN(monto) || monto <= 0) return;
        const result = await recargarSaldo(selectedReseller.id, monto, rechargeData.referencia);
        if (result.success) setIsRechargeModalOpen(false);
    };

    return { resellers, isCreateModalOpen, setIsCreateModalOpen, isRechargeModalOpen, setIsRechargeModalOpen, selectedReseller, isEditMode, formData, rechargeData, handleCreateChange, handleRechargeChange, openCreateModal, openEditModal, handleCreateSubmit, openRechargeModal, handleRechargeSubmit };
};
