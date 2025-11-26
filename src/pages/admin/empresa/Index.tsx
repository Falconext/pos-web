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
    cambiarEstadoEmpresa
  } = useEmpresasStore();

  // Estados locales
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [tipoFiltro, setTipoFiltro] = useState<string>(''); // '' = todos, 'FORMAL', 'INFORMAL'
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isOpenModalConfirm, setIsOpenModalConfirm] = useState(false);
  const [selectedEmpresa, setSelectedEmpresa] = useState<any>(null);
  const [currentPageState, setCurrentPageState] = useState(1);
  const [openEmpresaModal, setOpenEmpresaModal] = useState(false);
  const [empresaModalMode, setEmpresaModalMode] = useState<'create' | 'edit'>('create');
  const [empresaEditingId, setEmpresaEditingId] = useState<number | undefined>(undefined);

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
      order: 'desc'
    });
  }, [debounceSearch, currentPageState, itemsPerPage]);

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

  // Confirmar acciones
  const confirmAction = async () => {
    if (selectedEmpresa) {
      if (selectedEmpresa.accion === 'contactar') {
        // Al contactar una empresa informal, se activa automáticamente
        await cambiarEstadoEmpresa(selectedEmpresa.id, 'ACTIVO');
      } else if (selectedEmpresa.accion === 'cambiarEstado') {
        const newState = selectedEmpresa.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
        await cambiarEstadoEmpresa(selectedEmpresa.id, newState);
      }
      setIsOpenModalConfirm(false);
      setSelectedEmpresa(null);
    }
  };

  // Formatear datos para la tabla

  console.log(empresas)

  const empresasTable = empresas?.map((empresa: any) => {
    console.log('Empresa individual:', empresa); // Debug

    const incluyeTienda = empresa?.plan?.tieneTienda;
    const tiendaEstado = !incluyeTienda
      ? 'No incluida'
      : empresa.slugTienda
        ? 'Activa'
        : 'Incluida (sin configurar)';

    return {
      id: empresa.id,
      ruc: empresa.ruc,
      razonSocial: empresa.razonSocial,
      nombreComercial: empresa.nombreComercial || '-',
      plan:
        typeof empresa.plan === 'object' && empresa.plan
          ? `${empresa.plan.nombre} (S/ ${empresa.plan.costo})`
          : typeof empresa.plan === 'string'
            ? empresa.plan
            : '-',
      tienda: tiendaEstado,
      fechaActivacion: new Date(empresa.fechaActivacion).toLocaleDateString(),
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
        className: "delete", // Usaremos esta clase genérica y la lógica estará en TableBody
        icon: <Icon icon="healthicons:cancel-24px" color="#EF443C" />,
        tooltip: "Eliminar", // Tooltip genérico (se cambiará en TableBody)
      }
    ]
    ;


  if (loading && empresas.length === 0) {
    return <TableSkeleton />;
  }

  return (
    <div className="px-0 py-0 md:px-8 md:py-4">
      <div className="md:p-10 px-4 pt-0 z-0 md:px-8 bg-[#fff] rounded-lg">


        <div className="md:flex md:justify-between items-center mb-5 gap-4">
          <div className="md:w-2/5 w-full">
            <InputPro
              name="search"
              onChange={handleSearch}
              label="Buscar por RUC, razón social o nombre comercial"
              isLabel
              value={searchTerm}
            />
          </div>
          <div className="md:w-1/5 w-full">
            <Select
              name="tipoFiltro"
              label="Tipo de Empresa"
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
          <div className="flex md:block items-center mt-5 md:mt-0">
            <Button
              color="secondary"
              onClick={() => {
                setEmpresaEditingId(undefined);
                setEmpresaModalMode('create');
                setOpenEmpresaModal(true);
              }}
            >
              Nueva Empresa
            </Button>
          </div>
        </div>

        {/* Mostrar error si existe */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Tabla de datos */}
        <div className="">
          {empresasTable?.length > 0 ? (
            <>
              <div className="overflow-hidden overflow-x-scroll md:overflow-x-visible">
                <DataTable
                  actions={actions}
                  bodyData={empresasTable}
                  headerColumns={[
                    'RUC',
                    'Razon Social',
                    'Nombre Comercial',
                    'Plan',
                    'Tienda Virtual',
                    'Activación',
                    'Expiración',
                    'Estado',
                  ]}
                />
              </div>

              {/* Paginación */}
              <div className="mt-6">
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
              <div className="text-center py-10">
                <Icon icon="mdi:office-building-outline" className="mx-auto text-6xl text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600">No se encontraron empresas</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm ? 'No hay empresas que coincidan con tu búsqueda' : 'Aún no tienes empresas registradas'}
                </p>
                <Button
                  color="secondary"
                  onClick={() => {
                    setEmpresaEditingId(undefined);
                    setEmpresaModalMode('create');
                    setOpenEmpresaModal(true);
                  }}
                >
                  Crear Primera Empresa
                </Button>
              </div>
            )
          )}
        </div>

        {/* Modal de confirmación */}
        <ModalConfirm
          isOpenModal={isOpenModalConfirm}
          setIsOpenModal={setIsOpenModalConfirm}
          title={selectedEmpresa?.accion === 'contactar' ? 'Activar Empresa Informal' : `${selectedEmpresa?.estado === 'ACTIVO' ? 'Desactivar' : 'Activar'} Empresa`}
          information={
            selectedEmpresa?.accion === 'contactar'
              ? `Al contactar a "${selectedEmpresa?.razonSocial}", se creará automáticamente una suscripción INFORMAL de S/ 20 con vigencia de 30 días. ¿Deseas proceder?`
              : `¿Estás seguro que deseas ${selectedEmpresa?.estado === 'ACTIVO' ? 'desactivar' : 'activar'} la empresa "${selectedEmpresa?.razonSocial}"?`
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
    </div>
  );
};

export default EmpresasIndex;