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

    const [showOptionsDropdown, setShowOptionsDropdown] = React.useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowOptionsDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="min-h-screen px-2 pb-4 relative z-1 dark:bg-[#0A0D14]">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Clientes</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Administra</p>
                </div>
                <Button color="secondary" onClick={actions.openNewModal} className="flex items-center gap-2 !bg-violet-600 border-none shadow-md shadow-violet-200/50">
                    <Icon icon="solar:add-circle-bold" className="text-lg" />
                    Nuevo cliente
                </Button>
            </div>

            {/* Main Content Card */}
            <div className="bg-white dark:bg-[#111827] relative z-0 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
                {/* Search and Actions Toolbar */}
                <div className="p-5 border-b border-gray-100 dark:border-slate-800 relative z-50 overflow-visible">
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
                            <div className="relative inline-block" ref={dropdownRef}>
                                <Button
                                    color="success"
                                    outline
                                    onClick={() => setShowOptionsDropdown(!showOptionsDropdown)}
                                    className="text-sm flex items-center gap-1"
                                >
                                    <Icon icon="solar:file-bold-duotone" className="mr-1" width={16} />
                                    Excel / CSV
                                    <Icon icon={showOptionsDropdown ? "solar:alt-arrow-up-linear" : "solar:alt-arrow-down-linear"} className="ml-1" width={14} />
                                </Button>

                                {showOptionsDropdown && (
                                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-700 rounded-xl shadow-lg z-50 overflow-hidden py-1 font-inter">
                                        <input
                                            type="file"
                                            accept=".xlsx, .xls"
                                            ref={vm.fileInputRef}
                                            onChange={(e) => {
                                                actions.handleImportExcel(e);
                                                setShowOptionsDropdown(false);
                                            }}
                                            className="hidden"
                                        />
                                        <button
                                            onClick={() => { actions.exportClients(); setShowOptionsDropdown(false); }}
                                            className="w-full flex items-center px-4 py-2.5 text-[13px] font-[500] text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-700 dark:hover:text-green-400 transition-colors"
                                        >
                                            <Icon icon="solar:export-bold" className="mr-2 text-green-500" width={18} />
                                            Exportar Clientes
                                        </button>
                                        <button
                                            onClick={() => { vm.fileInputRef.current?.click(); }}
                                            className="w-full flex items-center px-4 py-2.5 text-[13px] font-[500] text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
                                        >
                                            <Icon icon="solar:import-bold" className="mr-2 text-blue-500" width={18} />
                                            Importar desde Excel
                                        </button>
                                        <div className="mx-4 my-1 border-t border-gray-100 dark:border-slate-800"></div>
                                        <a
                                            href="/formatos/plantilla_clientes.xlsx"
                                            target="_blank"
                                            download
                                            onClick={() => setShowOptionsDropdown(false)}
                                            className="w-full flex items-center px-4 py-2.5 text-[13px] font-[500] text-gray-700 dark:text-gray-300 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-700 dark:hover:text-amber-400 transition-colors"
                                        >
                                            <Icon icon="solar:file-download-bold" className="mr-2 text-amber-500" width={18} />
                                            Descargar Modelo (Guía)
                                        </a>
                                    </div>
                                )}
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
                                        'Estado': row['Estado'] ? (
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                                row['Estado'] === 'ACTIVO'
                                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                    : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                                            }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${row['Estado'] === 'ACTIVO' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                                {row['Estado'] === 'ACTIVO' ? 'Activo' : 'Inactivo'}
                                            </span>
                                        ) : null,
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
                                                    className="px-2 py-1 text-xs rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 flex items-center gap-1"
                                                >
                                                    <Icon icon="mdi:dots-vertical" width={18} height={18} />
                                                </button>
                                            </div>
                                        ),
                                    }))}
                                    headerColumns={vm.visibleColumns}
                                />
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-800">
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
