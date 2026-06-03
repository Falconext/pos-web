import React from 'react';
import { Icon } from '@iconify/react';
import DataTable from '@/components/Datatable';
import Button from '@/components/Button';
import InputPro from '@/components/InputPro';
import Pagination from '@/components/Pagination';
import ModalConfirm from '@/components/ModalConfirm';
import Loading from '@/components/Loading';
import ModalUsuario from '../../../pages/admin/usuarios/ModalUsuario';
import { useUsersViewModel } from './useUsersViewModel';

export default function UsersView() {
    const {
        usuarios,
        totalUsuarios,
        loading,
        currentPage,
        itemsPerPage,
        searchTerm,
        showUserModal,
        showConfirmModal,
        selectedUser,
        isEdit,
        handleCreateUser,
        handleEditUser,
        handleToggleState,
        confirmToggleState,
        handleCloseUserModal,
        handleCloseConfirmModal,
        handleSearchChange,
        handlePageChange,
        handleItemsPerPageChange,
        getPermisosData
    } = useUsersViewModel();

    const getEstadoBadge = (estado: string) => {
        return estado === 'ACTIVO'
            ? <span className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-900/50">Activo</span>
            : <span className="px-2 py-1 text-xs rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-900/50">Inactivo</span>;
    };

    const getRolBadge = (rol: string) => {
        return rol === 'ADMIN_EMPRESA'
            ? <span className="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50">Admin</span>
            : <span className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-gray-300 border border-gray-200 dark:border-slate-700">Usuario</span>;
    };

    const getPermisosSummary = (permisos: string[] = [], rol?: string) => {
        const data = getPermisosData(permisos, rol);
        if (data.type === 'none') {
            return <span className="text-gray-400 text-xs">{data.label}</span>;
        }
        if (data.type === 'full') {
            return <span className="text-green-600 dark:text-green-400 text-xs font-medium">{data.label}</span>;
        }
        return (
            <span className="text-blue-600 dark:text-blue-400 text-xs" title={data.tooltip}>
                {data.label}
            </span>
        );
    };

    const actions = [
        { onClick: (row: any) => handleEditUser(row._original), icon: <Icon icon="solar:pen-bold" width={18} />, tooltip: 'Editar', color: 'blue' as const },
        { onClick: (row: any) => handleToggleState(row._original), icon: <Icon icon="solar:power-bold" width={18} />, tooltip: 'Cambiar estado', color: 'amber' as const },
    ];

    const usuariosTableData = usuarios.map((usuario) => ({
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        dni: usuario.dni,
        celular: usuario.celular,
        rol: getRolBadge(usuario.rol),
        permisos: getPermisosSummary(usuario.permisos, usuario.rol),
        'Estado': (
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                usuario.estado === 'ACTIVO'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
            }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${usuario.estado === 'ACTIVO' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                {usuario.estado === 'ACTIVO' ? 'Activo' : 'Inactivo'}
            </span>
        ),
        _original: usuario,
    }));

    if (loading && usuarios.length === 0) {
        return <Loading />;
    }

    return (
        <div className="min-h-screen px-4 pb-6 bg-gray-50 dark:bg-[#0A0D14]">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 pt-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                        <Icon icon="solar:users-group-rounded-bold-duotone" className="text-blue-600 dark:text-blue-400" />
                        Gestión de Usuarios
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Administra los usuarios y sus permisos del sistema</p>
                </div>
                <button
                    onClick={handleCreateUser}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                >
                    <Icon icon="solar:user-plus-bold" className="text-lg" />
                    Nuevo Usuario
                </button>
            </div>

            {/* Estadísticas rápidas - Simplified logic here or moved to VM if complex */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-5 overflow-hidden relative">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Usuarios</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{totalUsuarios}</p>
                        </div>
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Icon icon="solar:users-group-rounded-bold" width={24} className="text-white" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Card */}
            <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
                {/* Search Section */}
                <div className="p-5 border-b border-gray-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-4">
                        <Icon icon="solar:magnifer-bold-duotone" className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <h3 className="font-semibold text-gray-800 dark:text-white">Buscar Usuarios</h3>
                    </div>
                    <div className="max-w-md">
                        <InputPro
                            type="text"
                            value={searchTerm}
                            name="search"
                            onChange={(e) => handleSearchChange(e.target.value)}
                            label="Buscar por nombre, email o DNI..."
                            isLabel
                        />
                    </div>
                </div>

                {/* Tabla */}
                <div className="p-4">
                    {usuariosTableData.length > 0 ? (
                        <>
                            <div className="overflow-hidden overflow-x-scroll md:overflow-x-visible">
                                <DataTable
                                    actions={actions}
                                    bodyData={usuariosTableData}
                                    headerColumns={[
                                        'Nombre', 'Email', 'DNI', 'Celular', 'Rol', 'Permisos',
                                        { label: 'Estado', key: 'Estado' },
                                    ]}
                                />
                            </div>

                            <Pagination
                                data={usuariosTableData}
                                optionSelect
                                currentPage={currentPage}
                                indexOfFirstItem={(currentPage - 1) * itemsPerPage}
                                indexOfLastItem={Math.min(currentPage * itemsPerPage, totalUsuarios)}
                                setcurrentPage={handlePageChange}
                                setitemsPerPage={handleItemsPerPageChange}
                                pages={Array.from({ length: Math.ceil(totalUsuarios / itemsPerPage) }, (_, i) => i + 1)}
                                total={totalUsuarios}
                            />
                        </>
                    ) : (
                        <div className="text-center py-12">
                            <Icon icon="mdi:account-group" width={64} height={64} className="text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                No hay usuarios registrados
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-4">
                                {searchTerm
                                    ? 'No se encontraron usuarios con ese criterio de búsqueda.'
                                    : 'Comienza creando tu primer usuario.'
                                }
                            </p>
                            {!searchTerm && (
                                <Button color="secondary" onClick={handleCreateUser}>
                                    <Icon icon="material-symbols:add" width={20} height={20} className="mr-2" />
                                    Crear primer usuario
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Modales */}
            {showUserModal && (
                <ModalUsuario
                    isOpen={showUserModal}
                    onClose={handleCloseUserModal}
                    user={selectedUser}
                    isEdit={isEdit}
                />
            )}

            {showConfirmModal && selectedUser && (
                <ModalConfirm
                    isOpenModal={showConfirmModal}
                    setIsOpenModal={handleCloseConfirmModal}
                    title="Cambiar Estado de Usuario"
                    information={`¿Estás seguro que deseas ${selectedUser.estado === 'ACTIVO' ? 'desactivar' : 'activar'
                        } al usuario ${selectedUser.nombre}?`}
                    confirmSubmit={confirmToggleState}
                />
            )}
        </div>
    );
};
