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
    <div className="px-0 py-0 md:px-8 md:py-4">
      <div className="md:p-10 px-4 pt-0 z-0 md:px-8 bg-[#fff] rounded-lg">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 pt-5 md:pt-0">
          <div className="mb-4 md:mb-0">
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 md:items-center">
            <div className="relative max-w-md">
              <Icon
                icon="material-symbols:search"
                width={20}
                height={20}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <InputPro
                type="text"
                value={searchTerm}
                name="search"
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre, email o DNI..."
                className="pl-10"
              />
            </div>
            
            <Button
              color="secondary"
              onClick={handleCreateUser}
              className="flex items-center gap-2"
            >
              <Icon icon="material-symbols:add" width={20} height={20} />
              Nuevo Usuario
            </Button>
          </div>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 rounded-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">Total Usuarios</p>
                <p className="text-2xl font-bold">{totalUsuarios}</p>
              </div>
              <Icon icon="mdi:account-group" width={32} height={32} className="text-blue-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 rounded-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">Usuarios Activos</p>
                <p className="text-2xl font-bold">
                  {usuarios.filter(u => u.estado === 'ACTIVO').length}
                </p>
              </div>
              <Icon icon="mdi:account-check" width={32} height={32} className="text-green-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4 rounded-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100">Administradores</p>
                <p className="text-2xl font-bold">
                  {usuarios.filter(u => u.rol === 'ADMIN_EMPRESA').length}
                </p>
              </div>
              <Icon icon="mdi:account-star" width={32} height={32} className="text-purple-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4 rounded-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100">Con Acceso Completo</p>
                <p className="text-2xl font-bold">
                  {usuarios.filter(u => u.permisos?.includes('*')).length}
                </p>
              </div>
              <Icon icon="mdi:key" width={32} height={32} className="text-orange-200" />
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="w-full">
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
          information={`¿Estás seguro que deseas ${
            selectedUser.estado === 'ACTIVO' ? 'desactivar' : 'activar'
          } al usuario ${selectedUser.nombre}?`}
          confirmSubmit={confirmToggleState}
        />
      )}
    </div>
  );
};

export default UsuariosIndex;