import { usePlanesViewModel } from '@/features/admin/sistema/usePlanesViewModel';
import Button from "@/components/Button";
import DataTable from "@/components/Datatable";
import Modal from "@/components/Modal";
import ModalConfirm from "@/components/ModalConfirm";
import InputPro from "@/components/InputPro";
import { Icon } from "@iconify/react";
import ModuloSelector from "@/components/ModuloSelector";

const Toggle = ({ label, value, onChange }: { label: string, value: boolean, onChange: (v: boolean) => void }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 px-2 rounded -mx-2 transition-colors">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <button type="button" onClick={() => onChange(!value)} className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${value ? 'bg-blue-600' : 'bg-gray-200'}`}>
            <span aria-hidden="true" className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${value ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
    </div>
);

const Planes = () => {
    const vm = usePlanesViewModel();

    const commercialPlaybook = [
        { plan: 'Start 100', comprobantesMes: 100, precioMensual: 15, precioAnual: 180, utilidadMeta: 10, tienda: 'No incluida', badge: 'Entrada', modules: ['Facturación electrónica', '1 usuario admin', 'Catálogo simple', 'Reporte básico'] },
        { plan: 'Pyme 300', comprobantesMes: 300, precioMensual: 30, precioAnual: 360, utilidadMeta: 15, tienda: 'No incluida', badge: 'Crecimiento', modules: ['Clientes y proveedores', 'Cotizaciones', 'Reportes mensuales', 'Exportación Excel/CSV'] },
        { plan: 'Pro 500', comprobantesMes: 500, precioMensual: 45, precioAnual: 540, utilidadMeta: 20, tienda: 'Add-on opcional', badge: 'Upsell', modules: ['Inventario + kardex', 'Compras/gastos', 'Caja y movimientos', 'Control operativo'] },
        { plan: 'Negocio 600', comprobantesMes: 600, precioMensual: 55, precioAnual: 660, utilidadMeta: 25, tienda: 'Incluida', badge: 'Recomendado', modules: ['2 sedes', 'Multiusuario + roles', 'Dashboard rentabilidad', 'Soporte prioritario'] },
        { plan: 'Escala 800', comprobantesMes: 800, precioMensual: 70, precioAnual: 840, utilidadMeta: 30, tienda: 'Incluida', badge: 'Escalamiento', modules: ['Tienda online', 'Pasarela de pago', 'Delivery/recojo', 'Campañas comerciales'] },
        { plan: 'Avanzado 1200', comprobantesMes: 1200, precioMensual: 95, precioAnual: 1140, utilidadMeta: 35, tienda: 'Incluida', badge: 'Premium', modules: ['Más sedes y usuarios', 'Integraciones/API', 'Reportes avanzados', 'Auditoría operativa'] },
    ];

    const headerColumns = ['Nombre', 'Costo', 'Duración', 'Anual', 'Max Compr.', 'Max Sedes', 'Max Usuarios', 'Empresas', 'Estado', 'Tienda', 'Ticketera', 'Acciones'];
    const bodyData = vm.planes.map(p => ({
        'Nombre': <div className="font-medium text-gray-900">{p.nombre}<div className="text-xs text-gray-500">{p.descripcion}</div></div>,
        'Costo': `S/ ${Number(p.costo).toFixed(2)}`,
        'Duración': `${p.duracionDias} días`,
        'Anual': p.duracionDias >= 360 ? <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded text-xs font-semibold">Anual</span> : <span className="text-gray-500 text-xs">Mensual</span>,
        'Max Compr.': <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-xs font-medium">{p.maxComprobantes || 100}</span>,
        'Max Sedes': <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-xs font-medium">{p.maxSedes ?? 1} sede{(p.maxSedes ?? 1) !== 1 ? 's' : ''}</span>,
        'Max Usuarios': <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded text-xs font-medium">{p.limiteUsuarios ?? 1} usuar.</span>,
        'Empresas': <span className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-600 font-medium">{p._count?.empresas || 0} asignadas</span>,
        'Estado': p.esPrueba ? <span className="text-orange-600 bg-orange-50 px-2 py-1 rounded text-xs">Prueba</span> : <span className="text-green-600 bg-green-50 px-2 py-1 rounded text-xs">Comercial</span>,
        'Tienda': p.tieneTienda ? <Icon icon="mdi:check-circle" className="text-green-500" width={20} /> : <Icon icon="mdi:close-circle" className="text-gray-300" width={20} />,
        'Ticketera': p.tieneTicketera ? <Icon icon="mdi:printer" className="text-blue-500" width={20} /> : <Icon icon="mdi:close-circle" className="text-gray-300" width={20} />,
        'Acciones': (
            <div className="flex gap-3">
                <button type="button" onClick={() => vm.handleOpenEdit(p)} className="p-1 hover:opacity-70 cursor-pointer"><Icon icon="mdi:pencil" width={20} height={20} style={{ color: '#19A249' }} /></button>
                <button type="button" onClick={() => vm.confirmDelete(p.id)} className="p-1 hover:opacity-70 cursor-pointer"><Icon icon="mdi:trash-can" width={20} height={20} style={{ color: '#EC5F4F' }} /></button>
            </div>
        )
    }));

    return (
        <div className="p-0 md:p-6">
            <div className="flex justify-between items-center mb-6">
                <div><h1 className="text-2xl font-bold text-gray-800">Planes de Suscripción</h1><p className="text-gray-500 text-sm">Gestiona los planes disponibles para las empresas</p></div>
                <Button onClick={vm.handleOpenCreate} color="primary"><Icon icon="mdi:plus" className="mr-2" />Nuevo Plan</Button>
            </div>
            <div className="bg-white rounded-lg shadow border overflow-hidden">
                <DataTable headerColumns={headerColumns} bodyData={bodyData} />
                {!vm.loading && vm.planes.length === 0 && <div className="p-8 text-center text-gray-500">No hay planes registrados</div>}
            </div>

            <div className="mt-6 bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 rounded-3xl shadow-xl overflow-hidden border border-indigo-800/40">
                <div className="p-6 md:p-8 border-b border-white/10">
                    <p className="text-xs uppercase tracking-[0.2em] text-indigo-200/80 font-bold">Playbook Comercial</p>
                    <h3 className="text-xl md:text-2xl font-bold text-white mt-1">Estructura recomendada de planes y módulos</h3>
                    <p className="text-sm text-indigo-100/80 mt-2 max-w-3xl">
                        Escalera para asegurar utilidad neta (S/10, S/15, S/20...) y posicionar tienda virtual como palanca de upgrade.
                    </p>
                </div>

                <div className="p-5 md:p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 font-inter">
                    {commercialPlaybook.map((item) => (
                        <div key={item.plan} className="rounded-2xl bg-white/95 border border-white/20 shadow-sm p-4">
                            <div className="flex items-start justify-between gap-3 mb-3">
                                <div>
                                    <p className="text-sm font-bold text-gray-900">{item.plan}</p>
                                    <p className="text-xs text-gray-500">{item.comprobantesMes} comprobantes/mes</p>
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">{item.badge}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mb-3">
                                <div className="rounded-xl bg-gray-50 border border-gray-100 p-2">
                                    <p className="text-[10px] uppercase text-gray-500 font-semibold">Mensual</p>
                                    <p className="text-sm font-bold text-gray-800">S/ {item.precioMensual.toFixed(2)}</p>
                                </div>
                                <div className="rounded-xl bg-gray-50 border border-gray-100 p-2">
                                    <p className="text-[10px] uppercase text-gray-500 font-semibold">Anual</p>
                                    <p className="text-sm font-bold text-gray-800">S/ {item.precioAnual.toFixed(2)}</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-xs mb-3">
                                <span className="text-emerald-700 font-semibold">Utilidad meta: S/ {item.utilidadMeta.toFixed(2)}</span>
                                <span className={`font-semibold ${item.tienda === 'Incluida' ? 'text-indigo-700' : item.tienda.includes('Add-on') ? 'text-amber-700' : 'text-gray-600'}`}>
                                    Tienda: {item.tienda}
                                </span>
                            </div>

                            <ul className="space-y-1.5">
                                {item.modules.map((module) => (
                                    <li key={module} className="text-xs text-gray-700 flex items-start gap-2">
                                        <Icon icon="solar:check-circle-bold" className="text-emerald-500 mt-0.5" width="14" />
                                        <span>{module}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="px-6 pb-6">
                    <div className="rounded-2xl bg-white/10 border border-white/15 px-4 py-3 text-xs text-indigo-100/90">
                        Recomendación: <span className="font-semibold text-white">sin tienda</span> en planes de entrada,
                        <span className="font-semibold text-white"> add-on en Pro</span> y
                        <span className="font-semibold text-white"> tienda incluida desde Negocio 600</span> para proteger margen y mejorar upsell.
                    </div>
                </div>
            </div>

            <Modal isOpenModal={vm.isModalOpen} closeModal={() => vm.setIsModalOpen(false)} title={vm.isEdit ? 'Editar Plan' : 'Nuevo Plan'} position="right" width="600px">
                <div className="p-6 space-y-5">
                    <div className="bg-white rounded-lg">
                        <h4 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wider">Información Básica</h4>
                        <div className="space-y-4">
                            <InputPro isLabel label="Nombre del Plan" name="nombre" value={vm.form.nombre} onChange={(e) => vm.setForm({ ...vm.form, nombre: e.target.value })} placeholder="Ej. Plan Emprendedor" />
                            <InputPro isLabel label="Descripción Corta" name="descripcion" value={vm.form.descripcion} onChange={(e) => vm.setForm({ ...vm.form, descripcion: e.target.value })} placeholder="Breve descripción..." />
                            <div className="grid grid-cols-2 gap-4">
                                <InputPro isLabel label="Costo (S/)" name="costo" type="number" value={vm.form.costo} onChange={(e) => vm.setForm({ ...vm.form, costo: Number(e.target.value) })} />
                                <InputPro isLabel label="Duración (Días)" name="duracionDias" type="number" value={vm.form.duracionDias} onChange={(e) => vm.setForm({ ...vm.form, duracionDias: Number(e.target.value) })} />
                            </div>
                        </div>
                    </div>
                    <div className="border-t border-gray-100 my-4"></div>
                    <div className="bg-white rounded-lg">
                        <h4 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wider">Límites</h4>
                        <div className="grid grid-cols-3 gap-4">
                            <InputPro isLabel label="Límite Usuarios" name="limiteUsuarios" type="number" value={vm.form.limiteUsuarios} onChange={(e) => vm.setForm({ ...vm.form, limiteUsuarios: Number(e.target.value) })} />
                            <InputPro isLabel label="Máx. Sedes" name="maxSedes" type="number" value={(vm.form as any).maxSedes ?? 1} onChange={(e) => vm.setForm({ ...vm.form, maxSedes: Number(e.target.value) } as any)} />
                            <InputPro isLabel label="Máx. Comprobantes" name="maxComprobantes" type="number" value={vm.form.maxComprobantes} onChange={(e) => vm.setForm({ ...vm.form, maxComprobantes: Number(e.target.value) })} />
                        </div>
                    </div>
                    <div className="border-t border-gray-100 my-4"></div>
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Configuración Avanzada</h4>
                        <button type="button" onClick={() => vm.setShowFeaturesModal(true)} className="w-full flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors group">
                            <div className="flex items-center gap-3"><div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Icon icon="solar:stars-minimalistic-bold-duotone" width={24} /></div><div className="text-left"><div className="font-semibold text-gray-800">Características</div><div className="text-xs text-gray-500">Tienda, delivery, imágenes, etc.</div></div></div>
                            <Icon icon="solar:alt-arrow-right-linear" className="text-gray-400 group-hover:text-gray-600" width={20} />
                        </button>
                        <button type="button" onClick={() => vm.setShowModulesModal(true)} className="w-full flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors group">
                            <div className="flex items-center gap-3"><div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><Icon icon="solar:widget-bold-duotone" width={24} /></div><div className="text-left"><div className="font-semibold text-gray-800">Módulos y Submódulos</div><div className="text-xs text-gray-500">Acceso a secciones del sistema</div></div></div>
                            <div className="flex items-center gap-2">
                                {(vm.form.moduloIds?.length || 0) > 0 && <span className="bg-purple-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">{vm.form.moduloIds?.length} mód.</span>}
                                {(vm.form.subModuloIds?.length || 0) > 0 && <span className="bg-indigo-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">{vm.form.subModuloIds?.length} sub.</span>}
                                <Icon icon="solar:alt-arrow-right-linear" className="text-gray-400" width={20} />
                            </div>
                        </button>
                    </div>
                </div>
                <div className="flex justify-end gap-2 p-6 border-t border-gray-100 bg-white sticky bottom-0 z-10">
                    <Button onClick={() => vm.setIsModalOpen(false)} color="secondary" outline>Cancelar</Button>
                    <Button onClick={vm.handleSubmit} color="primary" disabled={vm.loading}>{vm.loading ? 'Guardando...' : 'Guardar Plan'}</Button>
                </div>
            </Modal>
            <Modal isOpenModal={vm.showFeaturesModal} closeModal={() => vm.setShowFeaturesModal(false)} title="Características del Plan" position="right" width="500px" backdropClassName="bg-black/20">
                <div className="p-6">
                    <div className="space-y-1">
                        <Toggle label="Plan de Prueba (Gratuito)" value={vm.form.esPrueba || false} onChange={v => vm.setForm({ ...vm.form, esPrueba: v })} />
                        <Toggle label="Tienda Virtual" value={vm.form.tieneTienda || false} onChange={v => vm.setForm({ ...vm.form, tieneTienda: v })} />
                        {vm.form.tieneTienda && (
                            <div className="ml-4 pl-4 border-l-2 border-gray-100 mb-2 space-y-2 bg-gray-50 p-3 rounded-r-lg">
                                <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Configuración Tienda</h5>
                                <InputPro isLabel label="Máx. Banners" name="maxBanners" type="number" value={vm.form.maxBanners} onChange={(e) => vm.setForm({ ...vm.form, maxBanners: Number(e.target.value) })} />
                                <InputPro isLabel label="Máx. Img/Producto" name="maxImagenesProducto" type="number" value={vm.form.maxImagenesProducto} onChange={(e) => vm.setForm({ ...vm.form, maxImagenesProducto: Number(e.target.value) })} />
                            </div>
                        )}
                        <Toggle label="Banners Publicitarios" value={vm.form.tieneBanners || false} onChange={v => vm.setForm({ ...vm.form, tieneBanners: v })} />
                        <Toggle label="Galería de Imágenes" value={vm.form.tieneGaleria || false} onChange={v => vm.setForm({ ...vm.form, tieneGaleria: v })} />
                        <Toggle label="Pasarela Pagos (Culqi)" value={vm.form.tieneCulqi || false} onChange={v => vm.setForm({ ...vm.form, tieneCulqi: v })} />
                        <Toggle label="Delivery GPS Tracker" value={vm.form.tieneDeliveryGPS || false} onChange={v => vm.setForm({ ...vm.form, tieneDeliveryGPS: v })} />
                        <Toggle label="Ticketera (Impresión Térmica)" value={vm.form.tieneTicketera || false} onChange={v => vm.setForm({ ...vm.form, tieneTicketera: v })} />
                    </div>
                    <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end"><Button onClick={() => vm.setShowFeaturesModal(false)} color="black">Listo</Button></div>
                </div>
            </Modal>
            <Modal isOpenModal={vm.showModulesModal} closeModal={() => vm.setShowModulesModal(false)} title="Módulos y Submódulos del Plan" position="right" width="900px" backdropClassName="bg-black/20">
                <div className="p-6">
                    <div className="mb-6 bg-purple-50 p-4 rounded-lg border border-purple-100">
                        <h4 className="text-sm font-bold text-purple-800 mb-1">Control de Acceso por Plan</h4>
                        <p className="text-sm text-purple-700">Selecciona los <strong>módulos</strong> que incluye este plan. Para cada módulo seleccionado, haz clic en <strong>▼</strong> para elegir qué <strong>submódulos</strong> estarán disponibles. Si no configuras submódulos, la empresa tendrá acceso a todos los del módulo.</p>
                    </div>
                    <ModuloSelector
                        selectedModulos={vm.form.moduloIds || []}
                        onModulosChange={(modulos) => vm.setForm(prev => ({ ...prev, moduloIds: modulos }))}
                        selectedSubModulos={vm.form.subModuloIds || []}
                        onSubModulosChange={(subs) => vm.setForm(prev => ({ ...prev, subModuloIds: subs }))}
                    />
                    <div className="mt-8 pt-4 border-t border-gray-100 flex justify-end">
                        <Button onClick={() => vm.setShowModulesModal(false)} color="black">Guardar Selección</Button>
                    </div>
                </div>
            </Modal>
            <ModalConfirm isOpenModal={vm.modalConfirmOpen} setIsOpenModal={vm.setModalConfirmOpen} confirmSubmit={vm.handleDelete} title="¿Eliminar Plan?" information="Esta acción eliminará el plan permanentemente. No se puede deshacer.">
                <p className="text-red-500 text-sm mt-2">Nota: No podrás eliminar planes que ya tengan empresas asignadas.</p>
            </ModalConfirm>
        </div>
    );
};

export default Planes;
