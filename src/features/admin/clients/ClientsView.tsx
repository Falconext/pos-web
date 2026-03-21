import React from 'react';
import { Icon } from '@iconify/react';
import Button from '@/components/Button';
import InputPro from '@/components/InputPro';
import DataTable from '@/components/Datatable';
import Pagination from '@/components/Pagination';
import ModalConfirm from '@/components/ModalConfirm';
import TableActionMenu from '@/components/TableActionMenu';
import { useClientsViewModel } from './useClientsViewModel';
import ModalClient from './shared/ModalClient';

export default function ClientsView() {
    const vm = useClientsViewModel();
    const { actions, clients, clientsTable, totalClients } = vm;

    return (
        <div className="min-h-screen px-2 pb-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Clientes</h1>
                    <p className="text-sm text-gray-500 mt-1">Administra tu cartera de clientes y proveedores</p>
                </div>
                <Button color="secondary" onClick={actions.openNewModal} className="flex items-center gap-2">
                    <Icon icon="solar:add-circle-bold" className="text-lg" />
                    Nuevo cliente
                </Button>
            </div>

            {/* Main Content Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                {/* Search and Actions Toolbar */}
                <div className="p-5 border-b border-gray-100">
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="flex-1">
                            <InputPro
                                name="cliente"
                                value={vm.searchClient}
                                onChange={actions.handleSearchChange}
                                label="Buscar por cliente y RUC"
                                isLabel
                            />
                        </div>
                        <div className="flex flex-wrap gap-2 items-end">
                            <Button
                                color="success"
                                outline
                                onMouseEnter={() => actions.setIsHoveredExp(true)}
                                onMouseLeave={() => actions.setIsHoveredExp(false)}
                                onClick={actions.exportClients}
                            >
                                <Icon icon="solar:export-bold" className="mr-1.5" />
                                Exportar
                            </Button>
                            <div className="relative">
                                <input
                                    type="file"
                                    accept=".xlsx, .xls"
                                    ref={vm.fileInputRef}
                                    onChange={actions.handleImportExcel}
                                    className="hidden"
                                />
                                <Button
                                    color="success"
                                    outline
                                    onMouseEnter={() => actions.setIsHoveredImp(true)}
                                    onMouseLeave={() => actions.setIsHoveredImp(false)}
                                    onClick={() => vm.fileInputRef.current?.click()}
                                >
                                    <Icon icon="solar:import-bold" className="mr-1.5" />
                                    Importar
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="p-4">
                    {clientsTable && clientsTable.length > 0 ? (
                        <>
                            <div className="min-h-[450px]">
                                <DataTable
                                    bodyData={clientsTable.map((row: any) => ({
                                        ...row,
                                        'Acciones': (
                                            <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (vm.openAccionesId === row.id) {
                                                            actions.setOpenAccionesId(null);
                                                            actions.setAnchorEl(null);
                                                        } else {
                                                            actions.setOpenAccionesId(row.id);
                                                            actions.setAnchorEl(e.currentTarget);
                                                        }
                                                    }}
                                                    className="px-2 py-1 text-xs rounded-lg border border-gray-300 bg-white flex items-center gap-1"
                                                >
                                                    <Icon icon="mdi:dots-vertical" width={18} height={18} />
                                                </button>
                                            </div>
                                        ),
                                    }))}
                                    headerColumns={vm.visibleColumns}
                                />
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <Pagination
                                    data={clientsTable}
                                    optionSelect
                                    currentPage={vm.currentPage}
                                    indexOfFirstItem={vm.indexOfFirstItem}
                                    indexOfLastItem={vm.indexOfLastItem}
                                    setcurrentPage={actions.setcurrentPage}
                                    setitemsPerPage={actions.setitemsPerPage}
                                    pages={vm.pages}
                                    total={totalClients}
                                />
                            </div>
                        </>
                    ) : (
                        <div className="py-12 text-center">
                            <Icon icon="solar:users-group-rounded-linear" className="text-5xl text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">No se encontraron clientes</p>
                            <p className="text-sm text-gray-400 mt-1">Intenta con otros términos de búsqueda</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Actions Dropdown Menu */}
            <TableActionMenu
                isOpen={!!vm.openAccionesId && !!vm.anchorEl}
                anchorEl={vm.anchorEl}
                onClose={() => { actions.setOpenAccionesId(null); actions.setAnchorEl(null); }}
            >
                {vm.openAccionesId && (() => {
                    const rowBase = clients?.find((c: any) => c.id === vm.openAccionesId);
                    if (!rowBase) return null;
                    return (
                        <>
                            <button
                                type="button"
                                onClick={() => actions.openEditModal(rowBase)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-100"
                            >
                                <Icon icon="material-symbols:edit" width={16} height={16} />
                                <span>Editar</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => actions.openConfirmToggle(rowBase)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-100"
                            >
                                <Icon icon="mdi:power" width={16} height={16} />
                                <span>{rowBase.estado === 'INACTIVO' ? 'Activar' : 'Desactivar'}</span>
                            </button>
                        </>
                    );
                })()}
            </TableActionMenu>

            {/* Modals */}
            {vm.isOpenModal && (
                <ModalClient
                    setErrors={actions.setErrors}
                    errors={vm.errors}
                    formValues={vm.formValues}
                    setFormValues={actions.setFormValues}
                    isEdit={vm.isEdit}
                    isOpenModal={vm.isOpenModal}
                    setIsOpenModal={(v: boolean) => !v && actions.closeModal()}
                    closeModal={actions.closeModal}
                />
            )}
            {vm.isOpenModalConfirm && (
                <ModalConfirm
                    confirmSubmit={actions.confirmToggleState}
                    isOpenModal={vm.isOpenModalConfirm}
                    setIsOpenModal={actions.setIsOpenModalConfirm}
                    title="Confirmación"
                    information="¿Estás seguro que deseas cambiar el estado del cliente?"
                />
            )}
        </div>
    );
}
