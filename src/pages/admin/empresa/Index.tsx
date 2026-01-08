import { ChangeEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react/dist/iconify.js';
import DataTable from '@/components/Datatable';
import Pagination from '@/components/Pagination';
import Button from '@/components/Button';
import EmpresaFormModal from '@/components/Empresa/EmpresaFormModal';
import InputPro from '@/components/InputPro';
import Select from '@/components/Select';
import ModalConfirm from '@/components/ModalConfirm';
import TableSkeleton from '@/components/Skeletons/table';
import useAlertStore from '@/zustand/alert';
import { useEmpresasStore } from '@/zustand/empresas';
import { useDebounce } from '@/hooks/useDebounce';
import { get } from '@/utils/fetch';

const EmpresasIndex = () => {
  const navigate = useNavigate();
  const { success } = useAlertStore();
  const {
    empresas,
    totalEmpresas,
    currentPage,
    totalPages,
    loading,
    error,
    listarEmpresas,
    cambiarEstadoEmpresa,
    eliminarEmpresa
  } = useEmpresasStore();

  // Estados locales
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [tipoFiltro, setTipoFiltro] = useState<'FORMAL' | 'INFORMAL' | ''>(''); // '' = todos, 'FORMAL', 'INFORMAL'
  const [estadoFiltro, setEstadoFiltro] = useState<'ACTIVO' | 'INACTIVO' | 'TODOS'>('TODOS');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isOpenModalConfirm, setIsOpenModalConfirm] = useState(false);
  const [selectedEmpresa, setSelectedEmpresa] = useState<any>(null);
  const [currentPageState, setCurrentPageState] = useState(1);
  const [openEmpresaModal, setOpenEmpresaModal] = useState(false);
  const [empresaModalMode, setEmpresaModalMode] = useState<'create' | 'edit'>('create');
  const [empresaEditingId, setEmpresaEditingId] = useState<number | undefined>(undefined);
  const [usageStats, setUsageStats] = useState<Record<number, any>>({});

  const debounceSearch = useDebounce(searchTerm, 1000);

  // Calcular índices para paginación
  const indexOfLastItem = currentPageState * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const pages = [];
  for (let i = 1; i <= Math.ceil(totalEmpresas / itemsPerPage); i++) {
    pages.push(i);
  }

  // Cargar empresas cuando cambien los filtros
  useEffect(() => {
    listarEmpresas({
      search: debounceSearch,
      page: currentPageState,
      limit: itemsPerPage,
      sort: 'id',
      order: 'desc',
      estado: estadoFiltro,
      tipoEmpresa: tipoFiltro
    });
  }, [debounceSearch, currentPageState, itemsPerPage, estadoFiltro, tipoFiltro]);

  // Cargar usage stats para las empresas FORMALES
  useEffect(() => {
    const loadUsageStats = async () => {
      const formalEmpresas = empresas?.filter((e: any) => e.tipoEmpresa === 'FORMAL') || [];
      const stats: Record<number, any> = {};

      for (const emp of formalEmpresas) {
        try {
          const resp: any = await get(`comprobante/usage/${emp.id}`);
          if (resp && resp.data) {
            stats[emp.id] = resp.data;
          } else if (resp && !resp.error) {
            stats[emp.id] = resp;
          }
        } catch (err) {
          console.error(`Error loading usage for empresa ${emp.id}:`, err);
        }
      }
      setUsageStats(stats);
    };

    if (empresas && empresas.length > 0) {
      loadUsageStats();
    }
  }, [empresas]);

  // Cerrar modal cuando se complete una acción exitosa
  useEffect(() => {
    if (success === true) {
      setIsOpenModalConfirm(false);
      setSelectedEmpresa(null);
    }
  }, [success]);

  // Manejar búsqueda
  const handleSearch = (e: any) => {
    setSearchTerm(e.target.value);
    setCurrentPageState(1); // Reset a primera página al buscar
  };

  // Manejar edición de empresa
  const handleEdit = (empresa: any) => {
    setEmpresaEditingId(empresa.id);
    setEmpresaModalMode('edit');
    setOpenEmpresaModal(true);
  };

  console.log(empresas)

  // Manejar contacto de empresa informal
  const handleContactarInformal = (empresa: any) => {
    setSelectedEmpresa({ ...empresa, accion: 'contactar' });
    setIsOpenModalConfirm(true);
  };

  // Manejar cambio de estado
  const handleToggleState = (empresa: any) => {
    setSelectedEmpresa({ ...empresa, accion: 'cambiarEstado' });
    setIsOpenModalConfirm(true);
  };

  // Manejar eliminación de empresa
  const handleDelete = (empresa: any) => {
    setSelectedEmpresa({ ...empresa, accion: 'eliminar' });
    setIsOpenModalConfirm(true);
  };

  // Confirmar acciones
  const confirmAction = async () => {
    if (selectedEmpresa) {
      if (selectedEmpresa.accion === 'contactar') {
        // Al contactar una empresa informal, se activa automáticamente
        await cambiarEstadoEmpresa(selectedEmpresa.id, 'ACTIVO');
      } else if (selectedEmpresa.accion === 'cambiarEstado') {
        const newState = selectedEmpresa.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
        await cambiarEstadoEmpresa(selectedEmpresa.id, newState);
      } else if (selectedEmpresa.accion === 'eliminar') {
        await eliminarEmpresa(selectedEmpresa.id);
      }
      setIsOpenModalConfirm(false);
      setSelectedEmpresa(null);
    }
  };

  // Formatear datos para la tabla

  console.log(empresas)

  const empresasTable = empresas?.map((empresa: any) => {
    console.log('Empresa individual:', empresa); // Debug

    const tiendaEstado = empresa.plan?.tieneTienda && empresa?.slugTienda
      ? 'Activa'
      : empresa.plan?.tieneTienda && !empresa?.slugTienda
        ? 'Disponible'
        : 'No disponible';

    // Format usage stats for FORMAL companies
    const usage = usageStats[empresa.id];
    let usoDisplay = '-';
    if (empresa.tipoEmpresa === 'FORMAL' && usage) {
      usoDisplay = `${usage.comprobantesEmitidos}/${usage.limiteMaximo} (${usage.porcentajeUso}%)`;
    }

    return {
      id: empresa.id,
      'RUC': empresa.ruc,
      'Razon Social': empresa.razonSocial,
      'Rubro': empresa?.rubro?.nombre || '-',
      plan: empresa.plan?.nombre || '-',
      'Uso Mensual': usoDisplay,
      tienda: tiendaEstado,
      _usageData: usage, // for action conditional logic
      fechaExpiracion: new Date(empresa.fechaExpiracion).toLocaleDateString(),
      estado: empresa.estado,
    };
  }) || [];


  // Configurar acciones de la tabla
  const actions: any =
    [
      {
        onClick: handleEdit,
        className: "edit",
        icon: <Icon color="#66AD78" icon="material-symbols:edit" />,
        tooltip: "Editar"
      },
      {
        onClick: handleToggleState,
        className: "toggle",
        icon: <Icon icon="mdi:power" color="#F59E0B" />,
        tooltip: "Activar/Desactivar",
      },
      {
        onClick: handleDelete,
        className: "delete",
        icon: <Icon icon="mdi:trash-can" color="#EF443C" />,
        tooltip: "Eliminar",
      }
    ]
    ;


  if (loading && empresas.length === 0) {
    return <TableSkeleton />;
  }

  return (
    <div className="min-h-screen px-2 pb-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Empresas</h1>
          <p className="text-sm text-gray-500 mt-1">Administra las empresas registradas en el sistema</p>
        </div>
        <Button
          color="secondary"
          onClick={() => {
            setEmpresaEditingId(undefined);
            setEmpresaModalMode('create');
            setOpenEmpresaModal(true);
          }}
          className="flex items-center gap-2"
        >
          <Icon icon="solar:add-circle-bold" className="text-lg" />
          Nueva Empresa
        </Button>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Search and Filters */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <InputPro
                name="search"
                onChange={handleSearch}
                label="Buscar por RUC o razón social"
                isLabel
                value={searchTerm}
              />
            </div>
            <div className="w-full lg:w-48">
              <Select
                name="tipoFiltro"
                label="Tipo"
                error={() => { }}
                options={[
                  { id: '', value: 'Todas' },
                  { id: 'FORMAL', value: 'Formales' },
                  { id: 'INFORMAL', value: 'Informales' }
                ]}
                onChange={(id: any) => {
                  setTipoFiltro(id);
                  setCurrentPageState(1);
                }}
                withLabel
              />
            </div>
            <div className="w-full lg:w-40">
              <Select
                name="estadoFiltro"
                label="Estado"
                error={() => { }}
                options={[
                  { id: 'TODOS', value: 'Todos' },
                  { id: 'ACTIVO', value: 'Activos' },
                  { id: 'INACTIVO', value: 'Inactivos' }
                ]}
                onChange={(id: any) => {
                  setEstadoFiltro(id);
                  setCurrentPageState(1);
                }}
                withLabel
                value={estadoFiltro}
              />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-5 mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
            <Icon icon="solar:danger-circle-bold" className="text-xl" />
            {error}
          </div>
        )}

        {/* Table Content */}
        <div className="p-4">
          {empresasTable?.length > 0 ? (
            <>
              <div className="overflow-hidden overflow-x-auto">
                <DataTable
                  actions={actions}
                  bodyData={empresasTable}
                  headerColumns={[
                    'RUC',
                    'Razon Social',
                    'Rubro',
                    'Plan',
                    'Uso Mensual',
                    'Tienda Virtual',
                    'Expiración',
                    'Estado',
                  ]}
                />
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <Pagination
                  pages={pages}
                  currentPage={currentPageState}
                  setcurrentPage={setCurrentPageState}
                  indexOfFirstItem={indexOfFirstItem}
                  indexOfLastItem={Math.min(indexOfLastItem, totalEmpresas)}
                  total={totalEmpresas}
                  setitemsPerPage={setItemsPerPage}
                  optionSelect={true}
                />
              </div>
            </>
          ) : (
            !loading && (
              <div className="py-12 text-center">
                <Icon icon="solar:buildings-3-linear" className="text-5xl text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No se encontraron empresas</p>
                <p className="text-sm text-gray-400 mt-1">
                  {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Aún no tienes empresas registradas'}
                </p>
                <Button
                  color="secondary"
                  onClick={() => {
                    setEmpresaEditingId(undefined);
                    setEmpresaModalMode('create');
                    setOpenEmpresaModal(true);
                  }}
                  className="mt-4"
                >
                  <Icon icon="solar:add-circle-bold" className="mr-2" />
                  Crear Primera Empresa
                </Button>
              </div>
            )
          )}
        </div>
      </div>

      {/* Modal de confirmación */}
      <ModalConfirm
        isOpenModal={isOpenModalConfirm}
        setIsOpenModal={setIsOpenModalConfirm}
        title={
          selectedEmpresa?.accion === 'contactar'
            ? 'Activar Empresa Informal'
            : selectedEmpresa?.accion === 'eliminar'
              ? 'Eliminar Empresa'
              : `${selectedEmpresa?.estado === 'ACTIVO' ? 'Desactivar' : 'Activar'} Empresa`
        }
        information={
          selectedEmpresa?.accion === 'contactar'
            ? `Al contactar a "${selectedEmpresa?.['Razon Social']}", se creará automáticamente una suscripción INFORMAL de S/ 20 con vigencia de 30 días. ¿Deseas proceder?`
            : selectedEmpresa?.accion === 'eliminar'
              ? `⚠️ ATENCIÓN: Esta acción eliminará PERMANENTEMENTE la empresa "${selectedEmpresa?.['Razon Social']}" junto con todos sus comprobantes, clientes, productos y usuarios. Esta acción NO se puede deshacer. ¿Estás seguro?`
              : `¿Estás seguro que deseas ${selectedEmpresa?.estado === 'ACTIVO' ? 'desactivar' : 'activar'} la empresa "${selectedEmpresa?.['Razon Social']}"?`
        }
        confirmSubmit={confirmAction}
      />

      {/* Modal Crear/Editar Empresa */}
      <EmpresaFormModal
        open={openEmpresaModal}
        mode={empresaModalMode}
        empresaId={empresaEditingId}
        onClose={() => setOpenEmpresaModal(false)}
        onSaved={() => listarEmpresas({
          search: debounceSearch,
          page: currentPageState,
          limit: itemsPerPage,
          sort: 'id',
          order: 'desc'
        })}
      />
    </div>
  );
};

export default EmpresasIndex;