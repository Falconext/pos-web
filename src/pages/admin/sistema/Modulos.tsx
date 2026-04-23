import { useModulosViewModel } from '@/features/admin/sistema/useModulosViewModel';
import Button from "@/components/Button";
import InputPro from "@/components/InputPro";
import Modal from "@/components/Modal";
import ModalConfirm from "@/components/ModalConfirm";
import { Icon } from "@iconify/react";
import { ISubModulo } from '@/zustand/modulos';

const Toggle = ({ label, value, onChange }: { label: string, value: boolean, onChange: (v: boolean) => void }) => (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
        <span className="text-sm text-gray-700">{label}</span>
        <button type="button" onClick={() => onChange(!value)} className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${value ? 'bg-blue-600' : 'bg-gray-200'}`}>
            <span aria-hidden="true" className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${value ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
    </div>
);

const ModulosPage = () => {
    const vm = useModulosViewModel();

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Administración de Módulos</h1>
                    <p className="text-gray-500 text-sm">Gestiona los módulos y submódulos del sistema disponibles para los planes</p>
                </div>
                <Button onClick={vm.handleOpenCreate} color="primary">
                    <Icon icon="mdi:plus" className="mr-2" />Nuevo Módulo
                </Button>
            </div>

            <div className="space-y-3">
                {vm.modulos.map(modulo => {
                    const isExpanded = vm.expandedModulos.has(modulo.id);
                    return (
                        <div key={modulo.id} className="bg-white rounded-lg shadow border overflow-hidden">
                            {/* Fila del módulo */}
                            <div className="flex items-center gap-4 px-4 py-3">
                                <span className="text-gray-400 text-sm w-8 text-center">{modulo.orden}</span>
                                <div className="text-2xl text-gray-500 w-8 flex justify-center">
                                    <Icon icon={modulo.icono || 'mdi:cube'} />
                                </div>
                                <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded w-32 text-center">{modulo.codigo}</span>
                                <span className="font-medium text-gray-800 w-40">{modulo.nombre}</span>
                                <span className="text-gray-500 text-sm flex-1 truncate">{modulo.descripcion}</span>
                                <div className="flex items-center gap-2">
                                    {modulo.activo
                                        ? <span className="text-green-600 bg-green-50 px-2 py-1 rounded text-xs font-semibold">Activo</span>
                                        : <span className="text-red-600 bg-red-50 px-2 py-1 rounded text-xs font-semibold">Inactivo</span>
                                    }
                                    <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded">
                                        {modulo.subModulos?.length || 0} submódulos
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => vm.toggleExpanded(modulo.id)}
                                        className="p-1.5 hover:opacity-70 cursor-pointer text-indigo-500 rounded hover:bg-indigo-50"
                                        title={isExpanded ? "Ocultar submódulos" : "Ver submódulos"}
                                    >
                                        <Icon icon={isExpanded ? "mdi:chevron-up" : "mdi:chevron-down"} width={20} />
                                    </button>
                                    <button onClick={() => vm.handleOpenCreateSub(modulo.id)} className="p-1.5 hover:opacity-70 cursor-pointer text-emerald-600 rounded hover:bg-emerald-50" title="Agregar submódulo">
                                        <Icon icon="mdi:plus-circle" width={20} />
                                    </button>
                                    <button onClick={() => vm.handleOpenEdit(modulo)} className="p-1.5 hover:opacity-70 cursor-pointer text-blue-600 rounded hover:bg-blue-50" title="Editar módulo">
                                        <Icon icon="mdi:pencil" width={20} />
                                    </button>
                                    <button onClick={() => vm.confirmDelete(modulo.id)} className="p-1.5 hover:opacity-70 cursor-pointer text-red-500 rounded hover:bg-red-50" title="Eliminar módulo">
                                        <Icon icon="mdi:trash-can" width={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Submódulos expandibles */}
                            {isExpanded && (
                                <div className="border-t border-gray-100 bg-gray-50">
                                    {(!modulo.subModulos || modulo.subModulos.length === 0) ? (
                                        <div className="px-8 py-4 text-sm text-gray-400 flex items-center gap-2">
                                            <Icon icon="mdi:information-outline" width={16} />
                                            Este módulo no tiene submódulos. Usa el botón <Icon icon="mdi:plus-circle" className="text-emerald-600" width={16} /> para agregar.
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-gray-100">
                                            {modulo.subModulos.map((sub: ISubModulo) => (
                                                <div key={sub.id} className="flex items-center gap-4 px-8 py-2.5">
                                                    <Icon icon="mdi:subdirectory-arrow-right" className="text-gray-300" width={16} />
                                                    <span className="text-gray-400 text-xs w-6 text-center">{sub.orden}</span>
                                                    <span className="font-mono text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded w-48">{sub.codigo}</span>
                                                    <span className="text-gray-700 text-sm font-medium w-40">{sub.nombre}</span>
                                                    <span className="text-gray-400 text-sm flex-1 truncate">{sub.descripcion}</span>
                                                    <div className="flex items-center gap-2">
                                                        {sub.activo
                                                            ? <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded text-xs">Activo</span>
                                                            : <span className="text-red-500 bg-red-50 px-2 py-0.5 rounded text-xs">Inactivo</span>
                                                        }
                                                        <button onClick={() => vm.handleOpenEditSub(sub)} className="p-1 hover:opacity-70 cursor-pointer text-blue-600 rounded hover:bg-blue-50">
                                                            <Icon icon="mdi:pencil" width={16} />
                                                        </button>
                                                        <button onClick={() => vm.confirmDeleteSub(sub.id)} className="p-1 hover:opacity-70 cursor-pointer text-red-500 rounded hover:bg-red-50">
                                                            <Icon icon="mdi:trash-can" width={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}

                {vm.modulos.length === 0 && !vm.loading && (
                    <div className="bg-white rounded-lg border p-12 text-center text-gray-400">
                        <Icon icon="mdi:cube-off" className="mx-auto mb-3 text-5xl" />
                        <p>No hay módulos registrados</p>
                    </div>
                )}
            </div>

            {/* Modal Módulo */}
            <Modal isOpenModal={vm.isModalOpen} closeModal={() => vm.setIsModalOpen(false)} title={vm.isEdit ? 'Editar Módulo' : 'Nuevo Módulo'}>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-2 md:col-span-1">
                        <InputPro isLabel label="Código (Identificador)" name="codigo" value={vm.form.codigo} onChange={(e) => vm.setForm({ ...vm.form, codigo: e.target.value })} placeholder="Ej. kardex, ventas..." disabled={vm.isEdit} />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                        <InputPro isLabel label="Nombre Visible" name="nombre" value={vm.form.nombre} onChange={(e) => vm.setForm({ ...vm.form, nombre: e.target.value })} placeholder="Ej. Inventario" />
                    </div>
                    <div className="col-span-2">
                        <InputPro isLabel label="Descripción" name="descripcion" value={vm.form.descripcion} onChange={(e) => vm.setForm({ ...vm.form, descripcion: e.target.value })} />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                        <InputPro isLabel label="Icono (Iconify)" name="icono" value={vm.form.icono} onChange={(e) => vm.setForm({ ...vm.form, icono: e.target.value })} placeholder="Ej. mdi:box" />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                        <InputPro isLabel label="Orden" name="orden" type="number" value={vm.form.orden} onChange={(e) => vm.setForm({ ...vm.form, orden: Number(e.target.value) })} />
                    </div>
                    <div className="col-span-2 mt-2">
                        <Toggle label="Módulo Activo" value={vm.form.activo || false} onChange={v => vm.setForm({ ...vm.form, activo: v })} />
                        <p className="text-xs text-gray-500 mt-1">Si se desactiva, no aparecerá disponible para asignar a nuevos planes.</p>
                    </div>
                    <div className="col-span-2 mt-4 bg-blue-50 p-3 rounded text-sm text-blue-800 flex items-start">
                        <Icon icon="mdi:information" className="mr-2 mt-0.5 text-xl" />
                        <div>Preview del Icono: <Icon icon={vm.form.icono || 'mdi:help-circle'} className="inline-block text-2xl ml-2 align-middle" /></div>
                    </div>
                </div>
                <div className="flex justify-end gap-2 p-4 pt-0">
                    <Button onClick={() => vm.setIsModalOpen(false)} color="secondary" outline>Cancelar</Button>
                    <Button onClick={vm.handleSubmit} color="primary" disabled={vm.loading}>{vm.loading ? 'Guardando...' : 'Guardar'}</Button>
                </div>
            </Modal>

            {/* Modal SubMódulo */}
            <Modal isOpenModal={vm.isSubModalOpen} closeModal={() => vm.setIsSubModalOpen(false)} title={vm.isSubEdit ? 'Editar Submódulo' : 'Nuevo Submódulo'}>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {!vm.isSubEdit && (
                        <div className="col-span-2 bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-2 text-sm text-indigo-700 flex items-center gap-2">
                            <Icon icon="mdi:information" width={16} />
                            Submódulo de: <strong>{vm.modulos.find(m => m.id === vm.subForm.moduloId)?.nombre}</strong>
                        </div>
                    )}
                    <div className="col-span-2 md:col-span-1">
                        <InputPro isLabel label="Código" name="codigo" value={vm.subForm.codigo} onChange={(e) => vm.setSubForm({ ...vm.subForm, codigo: e.target.value })} placeholder="Ej. comprobantes:emitir" disabled={vm.isSubEdit} />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                        <InputPro isLabel label="Nombre Visible" name="nombre" value={vm.subForm.nombre} onChange={(e) => vm.setSubForm({ ...vm.subForm, nombre: e.target.value })} placeholder="Ej. Emitir comprobante" />
                    </div>
                    <div className="col-span-2">
                        <InputPro isLabel label="Descripción" name="descripcion" value={vm.subForm.descripcion} onChange={(e) => vm.setSubForm({ ...vm.subForm, descripcion: e.target.value })} />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                        <InputPro isLabel label="Orden" name="orden" type="number" value={vm.subForm.orden} onChange={(e) => vm.setSubForm({ ...vm.subForm, orden: Number(e.target.value) })} />
                    </div>
                    <div className="col-span-2 mt-2">
                        <Toggle label="Submódulo Activo" value={vm.subForm.activo} onChange={v => vm.setSubForm({ ...vm.subForm, activo: v })} />
                    </div>
                </div>
                <div className="flex justify-end gap-2 p-4 pt-0">
                    <Button onClick={() => vm.setIsSubModalOpen(false)} color="secondary" outline>Cancelar</Button>
                    <Button onClick={vm.handleSubmitSub} color="primary" disabled={vm.loading}>{vm.loading ? 'Guardando...' : 'Guardar'}</Button>
                </div>
            </Modal>

            <ModalConfirm isOpenModal={vm.modalConfirmOpen} setIsOpenModal={vm.setModalConfirmOpen} confirmSubmit={vm.handleDelete} title="¿Eliminar Módulo?" information="Esta acción eliminará el módulo y todos sus submódulos. Los planes que lo usen perderán acceso a él." />
            <ModalConfirm isOpenModal={vm.modalConfirmSubOpen} setIsOpenModal={vm.setModalConfirmSubOpen} confirmSubmit={vm.handleDeleteSub} title="¿Eliminar Submódulo?" information="Se eliminará el submódulo y se revocarán los permisos de todos los usuarios que lo tenían asignado." />
        </div>
    );
};

export default ModulosPage;
