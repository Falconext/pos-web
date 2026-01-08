import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import DataTable from '@/components/Datatable';
import Button from '@/components/Button';
import InputPro from '@/components/InputPro';
import Pagination from '@/components/Pagination';
import ModalConfirm from '@/components/ModalConfirm';
import Loading from '@/components/Loading';
import { useDebounce } from '@/hooks/useDebounce';
import { useUsersStore, IUsuario, MODULOS_SISTEMA } from '@/zustand/users';
import ModalUsuario from './ModalUsuario';

const UsuariosIndex: React.FC = () => {
  const {
    usuarios,
    totalUsuarios,
    loading,
    getAllUsers,
    toggleUserState,
  } = useUsersStore();

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUserModal, setShowUserModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<IUsuario | null>(null);
  const [isEdit, setIsEdit] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 1000);

  useEffect(() => {
    getAllUsers({
      page: currentPage,
      limit: itemsPerPage,
      search: debouncedSearchTerm || undefined,
    });
  }, [currentPage, itemsPerPage, debouncedSearchTerm]);

  const handleCreateUser = () => {
    setSelectedUser(null);
    setIsEdit(false);
    setShowUserModal(true);
  };

  const handleEditUser = (user: IUsuario) => {
    setSelectedUser(user);
    setIsEdit(true);
    setShowUserModal(true);
  };

  const handleToggleState = (user: IUsuario) => {
    setSelectedUser(user);
    setShowConfirmModal(true);
  };

  const confirmToggleState = async () => {
    if (selectedUser) {
      await toggleUserState(selectedUser.id);
      setShowConfirmModal(false);
      setSelectedUser(null);
    }
  };

  const getEstadoBadge = (estado: string) => {
    return estado === 'ACTIVO'
      ? <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Activo</span>
      : <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Inactivo</span>;
  };

  const getRolBadge = (rol: string) => {
    return rol === 'ADMIN_EMPRESA'
      ? <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">Admin</span>
      : <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Usuario</span>;
  };

  const getPermisosSummary = (permisos: string[] = []) => {
    if (!permisos || permisos.length === 0) {
      return <span className="text-gray-400 text-xs">Sin permisos</span>;
    }

    if (permisos.includes('*')) {
      return <span className="text-green-600 text-xs font-medium">Acceso completo</span>;
    }

    const nombresModulos = permisos.map(permiso => {
      const modulo = MODULOS_SISTEMA.find(m => m.id === permiso);
      return modulo ? modulo.nombre : permiso;
    }).join(', ');

    return (
      <span className="text-blue-600 text-xs" title={nombresModulos}>
        {permisos.length} módulo{permisos.length !== 1 ? 's' : ''}
      </span>
    );
  };

  const usuariosTableData = usuarios.map((usuario) => ({
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    dni: usuario.dni,
    celular: usuario.celular,
    rol: getRolBadge(usuario.rol),
    permisos: getPermisosSummary(usuario.permisos),
    estado: usuario.estado,
    // Para las acciones
    _original: usuario,
  }));

  const actions = [
    {
      onClick: (data: any) => handleEditUser(data._original),
      className: "edit",
      icon: <Icon color="#66AD78" icon="material-symbols:edit" />,
      tooltip: "Editar usuario"
    },
    {
      onClick: (data: any) => handleToggleState(data._original),
      className: "delete",
      icon: <Icon icon="healthicons:cancel-24px" color="#EF443C" />,
      tooltip: "Cambiar estado"
    }
  ];

  if (loading && usuarios.length === 0) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen px-2 pb-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Gestión de Usuarios</h1>
          <p className="text-sm text-gray-500 mt-1">Administra los usuarios y sus permisos del sistema</p>
        </div>
        <Button
          color="secondary"
          onClick={handleCreateUser}
          className="flex items-center gap-2"
        >
          <Icon icon="solar:user-plus-bold" width={18} />
          Nuevo Usuario
        </Button>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 overflow-hidden relative">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Usuarios</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{totalUsuarios}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Icon icon="solar:users-group-rounded-bold" width={24} className="text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 overflow-hidden relative">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Activos</p>
              <p className="text-3xl font-bold text-emerald-600 mt-1">
                {usuarios.filter(u => u.estado === 'ACTIVO').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Icon icon="solar:user-check-bold" width={24} className="text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 overflow-hidden relative">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Administradores</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">
                {usuarios.filter(u => u.rol === 'ADMIN_EMPRESA').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Icon icon="solar:user-id-bold" width={24} className="text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 overflow-hidden relative">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Acceso Completo</p>
              <p className="text-3xl font-bold text-amber-600 mt-1">
                {usuarios.filter(u => u.permisos?.includes('*')).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Icon icon="solar:key-bold" width={24} className="text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Search Section */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Icon icon="solar:magnifer-bold-duotone" className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-800">Buscar Usuarios</h3>
          </div>
          <div className="max-w-md">
            <InputPro
              type="text"
              value={searchTerm}
              name="search"
              onChange={(e) => setSearchTerm(e.target.value)}
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
                    'Nombre',
                    'Email',
                    'DNI',
                    'Celular',
                    'Rol',
                    'Permisos',
                    'Estado'
                  ]}
                />
              </div>

              <Pagination
                data={usuariosTableData}
                optionSelect
                currentPage={currentPage}
                indexOfFirstItem={(currentPage - 1) * itemsPerPage}
                indexOfLastItem={Math.min(currentPage * itemsPerPage, totalUsuarios)}
                setcurrentPage={setCurrentPage}
                setitemsPerPage={setItemsPerPage}
                pages={Array.from({ length: Math.ceil(totalUsuarios / itemsPerPage) }, (_, i) => i + 1)}
                total={totalUsuarios}
              />
            </>
          ) : (
            <div className="text-center py-12">
              <Icon icon="mdi:account-group" width={64} height={64} className="text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay usuarios registrados
              </h3>
              <p className="text-gray-500 mb-4">
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
          onClose={() => setShowUserModal(false)}
          user={selectedUser}
          isEdit={isEdit}
        />
      )}

      {showConfirmModal && selectedUser && (
        <ModalConfirm
          isOpenModal={showConfirmModal}
          setIsOpenModal={setShowConfirmModal}
          title="Cambiar Estado de Usuario"
          information={`¿Estás seguro que deseas ${selectedUser.estado === 'ACTIVO' ? 'desactivar' : 'activar'
            } al usuario ${selectedUser.nombre}?`}
          confirmSubmit={confirmToggleState}
        />
      )}
    </div>
  );
};

export default UsuariosIndex;