import { useResellersViewModel } from '@/features/admin/sistema/useResellersViewModel';
import { Icon } from '@iconify/react';

export default function AdminResellers() {
    const vm = useResellersViewModel();

    return (
        <div className="space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Icon icon="solar:users-group-two-rounded-bold-duotone" className="text-indigo-600" />Distribuidores</h1>
                    <p className="text-gray-500 text-sm mt-1">Gestiona los socios comerciales y sus saldos</p>
                </div>
                <button onClick={vm.openCreateModal} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition-all active:scale-95">
                    <Icon icon="solar:user-plus-bold" width="20" />Nuevo Distribuidor
                </button>
            </div>
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase font-semibold">
                            <tr><th className="px-6 py-4">Nombre / Código</th><th className="px-6 py-4">Representante</th><th className="px-6 py-4">Contacto</th><th className="px-6 py-4 text-right">Saldo</th><th className="px-6 py-4 text-center">Clientes</th><th className="px-6 py-4 text-center">Estado</th><th className="px-6 py-4 text-center">Acciones</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {vm.resellers.length === 0 ? (
                                <tr><td className="px-6 py-12" colSpan={7}><div className="flex flex-col items-center justify-center text-gray-400"><Icon icon="solar:users-group-two-rounded-linear" width="48" className="mb-2 opacity-50" /><p>No hay distribuidores registrados</p></div></td></tr>
                            ) : (
                                vm.resellers.map((reseller) => (
                                    <tr key={reseller.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4"><p className="font-bold text-gray-800">{reseller.nombre}</p><span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded border border-indigo-100 font-mono">{reseller.codigo}</span></td>
                                        <td className="px-6 py-4 text-gray-600">{reseller.representante || '-'}</td>
                                        <td className="px-6 py-4"><div className="flex flex-col text-xs text-gray-500 gap-1">{reseller.email && <div className="flex items-center gap-1.5"><Icon icon="solar:letter-linear" width="14" />{reseller.email}</div>}{reseller.telefono && <div className="flex items-center gap-1.5"><Icon icon="solar:phone-linear" width="14" />{reseller.telefono}</div>}</div></td>
                                        <td className="px-6 py-4 text-right font-mono font-bold text-gray-700">S/ {Number(reseller.saldo).toFixed(2)}</td>
                                        <td className="px-6 py-4 text-center"><span className="inline-flex items-center justify-center bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full text-xs font-bold">{reseller._count?.empresas || 0}</span></td>
                                        <td className="px-6 py-4 text-center"><div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${reseller.activo ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}><div className={`w-1.5 h-1.5 rounded-full ${reseller.activo ? 'bg-emerald-500' : 'bg-red-500'}`}></div>{reseller.activo ? 'Activo' : 'Inactivo'}</div></td>
                                        <td className="px-6 py-4 text-center"><div className="flex items-center justify-center gap-2"><button onClick={() => vm.openRechargeModal(reseller)} title="Recargar Saldo" className="text-indigo-600 hover:text-indigo-800 p-1.5 hover:bg-indigo-50 rounded-lg transition-colors"><Icon icon="solar:wallet-money-bold" width="18" /></button><button onClick={() => vm.openEditModal(reseller)} title="Editar" className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-50 rounded-lg transition-colors"><Icon icon="solar:pen-bold" width="18" /></button></div></td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {vm.isCreateModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => vm.setIsCreateModalOpen(false)}></div>
                    <div className="bg-white rounded-3xl p-8 w-full max-w-lg z-10 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-start mb-6"><div><h2 className="text-xl font-bold text-gray-800">{vm.isEditMode ? 'Editar Distribuidor' : 'Nuevo Distribuidor'}</h2><p className="text-sm text-gray-500">{vm.isEditMode ? 'Actualiza los datos del socio' : 'Registra un nuevo socio comercial'}</p></div><button onClick={() => vm.setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600"><Icon icon="solar:close-circle-bold" width="24" /></button></div>
                        <form onSubmit={vm.handleCreateSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5 col-span-2"><label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Nombre Comercial</label><input required name="nombre" value={vm.formData.nombre} onChange={vm.handleCreateChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-gray-400 font-medium" placeholder="Ej. Distribuciones Lima Norte" /></div>
                                <div className="space-y-1.5"><label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Código Único</label><input required name="codigo" value={vm.formData.codigo} onChange={vm.handleCreateChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-gray-400 font-medium font-mono" placeholder="Ej. RES-001" /></div>
                                <div className="space-y-1.5"><label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Teléfono</label><input name="telefono" value={vm.formData.telefono} onChange={vm.handleCreateChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-gray-400 font-medium" placeholder="999 999 999" /></div>
                                <div className="space-y-1.5 col-span-2"><label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Email (Usuario)</label><input required type="email" name="email" value={vm.formData.email} onChange={vm.handleCreateChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-gray-400 font-medium" placeholder="contacto@distribuidor.com" /></div>
                                <div className="space-y-1.5 col-span-2"><label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Representante Legal</label><input name="representante" value={vm.formData.representante} onChange={vm.handleCreateChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-gray-400 font-medium" placeholder="Nombre completo" /></div>
                            </div>
                            <div className="pt-4 flex gap-3"><button type="button" onClick={() => vm.setIsCreateModalOpen(false)} className="flex-1 py-3 text-gray-600 font-bold bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">Cancelar</button><button type="submit" className="flex-1 py-3 text-white font-bold bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/30">{vm.isEditMode ? 'Guardar Cambios' : 'Crear Distribuidor'}</button></div>
                        </form>
                    </div>
                </div>
            )}
            {vm.isRechargeModalOpen && vm.selectedReseller && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => vm.setIsRechargeModalOpen(false)}></div>
                    <div className="bg-white rounded-3xl p-8 w-full max-w-sm z-10 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="text-center mb-6"><div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4"><Icon icon="solar:wallet-money-bold-duotone" width="36" /></div><h2 className="text-xl font-bold text-gray-800">Recargar Saldo</h2><p className="text-xs text-gray-500 mt-1 uppercase tracking-wide font-bold">{vm.selectedReseller.nombre}</p><p className="text-sm text-gray-400 mt-2">Saldo Actual: <span className="text-gray-800 font-bold font-mono">S/ {Number(vm.selectedReseller.saldo).toFixed(2)}</span></p></div>
                        <form onSubmit={vm.handleRechargeSubmit} className="space-y-4">
                            <div className="space-y-1.5"><label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Monto a Recargar (S/)</label><input required type="number" step="0.01" min="1" name="monto" value={vm.rechargeData.monto} onChange={vm.handleRechargeChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder:text-gray-400 font-bold text-center text-lg" placeholder="0.00" autoFocus /></div>
                            <div className="space-y-1.5"><label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Referencia (Opcional)</label><input name="referencia" value={vm.rechargeData.referencia} onChange={vm.handleRechargeChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500 outline-none transition-all placeholder:text-gray-400 text-sm" placeholder="Ej. Transferencia BCP #1234" /></div>
                            <div className="pt-2 flex gap-3"><button type="button" onClick={() => vm.setIsRechargeModalOpen(false)} className="flex-1 py-3 text-gray-600 font-bold bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">Cancelar</button><button type="submit" className="flex-1 py-3 text-white font-bold bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/30">Confirmar</button></div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
