import React from 'react';
import { Icon } from '@iconify/react';
import Button from '@/components/Button';
import InputPro from '@/components/InputPro';
import DataTable from '@/components/Datatable';
import Pagination from '@/components/Pagination';
import ModalConfirm from '@/components/ModalConfirm';
import { useProveedoresViewModel } from './useProveedoresViewModel';
import ModalProveedor from '@/pages/admin/compras/ModalProveedor';
import { VISIBLE_PROVEEDOR_COLUMNS } from './ComprasModel';

export default function ProveedoresView() {
    const vm = useProveedoresViewModel();
    const { actions, clients, proveedoresTable, totalClients } = vm;

    return (
        <div className="min-h-screen px-2 pb-4 bg-gray-50 dark:bg-[#0A0D14]">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Proveedores</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestión de proveedores para compras</p>
                </div>
                <Button color="secondary" onClick={actions.openNewModal} className="flex items-center gap-2 !bg-violet-600 border-none shadow-md shadow-violet-200/50">
                    <Icon icon="solar:add-circle-bold" className="text-lg" />
                    Nuevo Proveedor
                </Button>
            </div>

            <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
                {/* Search */}
                <div className="p-5 border-b border-gray-100 dark:border-slate-800">
                    <div className="max-w-md">
                        <InputPro
                            name="cliente"
                            value={vm.searchClient}
                            onChange={actions.handleSearchChange}
                            label="Buscar proveedor"
                            isLabel
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="p-4">
                    {proveedoresTable && proveedoresTable.length > 0 ? (
                        <>
                            <div className="overflow-hidden overflow-x-auto">
                                <DataTable
                                    bodyData={proveedoresTable.map((row: any) => ({
                                        ...row,
                                        'Acciones': (
                                            <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    type="button"
                                                    onClick={() => actions.setOpenAccionesId(
                                                        vm.openAccionesId === row.id ? null : row.id
                                                    )}
                                                    className="px-2 py-1 text-xs rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 flex items-center gap-1"
                                                >
                                                    <Icon icon="mdi:dots-vertical" width={18} height={18} />
                                                </button>
                                                {vm.openAccionesId === row.id && (
                                                    <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg z-20 overflow-hidden">
                                                        <button
                                                            type="button"
                                                            onClick={() => actions.openEditModal(row._raw)}
                                                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                                                        >
                                                            <Icon icon="material-symbols:edit" width={16} height={16} />
                                                            <span>Editar</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => actions.openConfirmToggle(row._raw)}
                                                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                                                        >
                                                            <Icon icon="mdi:power" width={16} height={16} />
                                                            <span>{row._raw.estado === 'INACTIVO' ? 'Activar' : 'Desactivar'}</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ),
                                    }))}
                                    headerColumns={VISIBLE_PROVEEDOR_COLUMNS}
                                />
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-800">
                                <Pagination
                                    data={proveedoresTable}
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
                            <p className="text-gray-500">No se encontraron proveedores</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {vm.isOpenModal && (
                <ModalProveedor
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
                    information="¿Estás seguro que deseas cambiar el estado del proveedor?"
                />
            )}
        </div>
    );
}
