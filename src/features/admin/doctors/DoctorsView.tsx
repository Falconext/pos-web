import { Icon } from '@iconify/react';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import { useDoctorsViewModel } from './useDoctorsViewModel';
import { ESPECIALIDADES } from './DoctorsModel';

interface Props {
  hideHeader?: boolean;
  embedded?: boolean;   // usa la misma card y toolbar que ClientsView
}

export default function DoctorsView({ hideHeader, embedded }: Props = {}) {
  const vm = useDoctorsViewModel();

  // ── Tabla de médicos (compartida entre modos) ────────────────────────
  const tableContent = (
    <>
      {vm.isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Icon icon="mdi:loading" className="animate-spin text-violet-600" width={32} />
        </div>
      ) : vm.doctors.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <Icon icon="solar:stethoscope-bold-duotone" width={48} className="mb-3 text-gray-300" />
          <p className="font-medium text-gray-500">No hay médicos registrados</p>
          <p className="text-sm mt-1">Agrega el primer médico con el botón de arriba</p>
        </div>
      ) : (
        <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50">
              <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300 text-xs uppercase tracking-wide">Médico</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300 text-xs uppercase tracking-wide">CMP</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300 text-xs uppercase tracking-wide">Especialidad</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300 text-xs uppercase tracking-wide">Contacto</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300 text-xs uppercase tracking-wide">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
            {vm.doctors.map(doc => (
              <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center flex-shrink-0">
                      <Icon icon="solar:stethoscope-bold-duotone" width={16} className="text-violet-600 dark:text-violet-400" />
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">Dr. {doc.nombre}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{doc.cmp || '—'}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{doc.especialidad || '—'}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                  {doc.telefono && <div>{doc.telefono}</div>}
                  {doc.email && <div className="text-xs text-gray-400">{doc.email}</div>}
                  {!doc.telefono && !doc.email && '—'}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    doc.estado === 'ACTIVO'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${doc.estado === 'ACTIVO' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                    {doc.estado === 'ACTIVO' ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    <button
                      onClick={() => vm.openEdit(doc)}
                      className="p-1.5 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-900/20 text-violet-600 transition-colors"
                      title="Editar"
                    >
                      <Icon icon="solar:pen-bold-duotone" width={16} />
                    </button>
                    <button
                      onClick={() => vm.confirmDelete(doc.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors"
                      title="Desactivar"
                    >
                      <Icon icon="solar:trash-bin-trash-bold-duotone" width={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
    </>
  );

  // ── Modales (compartidos) ────────────────────────────────────────────
  const modals = (
    <>
      {vm.isModalOpen && (
        <Modal
          width="520px"
          height="auto"
          position="right"
          isOpenModal={vm.isModalOpen}
          closeModal={vm.closeModal}
          title={vm.isEdit ? 'Editar médico' : 'Nuevo médico'}
          icon="solar:stethoscope-bold-duotone"
        >
          <div className="md:px-6 mt-5 space-y-4">
            {/* Nombre */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                Nombre completo <span className="text-red-500">*</span>
              </label>
              <input
                value={vm.form.nombre}
                onChange={e => vm.handleChange('nombre', e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="Ej: Juan Pérez García"
              />
            </div>
            {/* CMP + Especialidad */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">CMP</label>
                <input
                  value={vm.form.cmp ?? ''}
                  onChange={e => vm.handleChange('cmp', e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="Ej: 12345"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Especialidad</label>
                <select
                  value={vm.form.especialidad ?? ''}
                  onChange={e => vm.handleChange('especialidad', e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="">Seleccionar...</option>
                  {ESPECIALIDADES.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
            </div>
            {/* Teléfono + Correo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Teléfono</label>
                <input
                  value={vm.form.telefono ?? ''}
                  onChange={e => vm.handleChange('telefono', e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="+51 999 999 999"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Correo</label>
                <input
                  type="email"
                  value={vm.form.email ?? ''}
                  onChange={e => vm.handleChange('email', e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="doctor@clinica.pe"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-4 justify-end mt-8 mb-5 md:pr-5">
            <Button color="gray" onClick={vm.closeModal}>Cancelar</Button>
            <Button color="secondary" onClick={vm.handleSubmit}>
              {vm.isEdit ? 'Guardar cambios' : 'Registrar médico'}
            </Button>
          </div>
        </Modal>
      )}

      {vm.deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4 border border-gray-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Icon icon="solar:trash-bin-trash-bold-duotone" width={20} className="text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">¿Desactivar médico?</h3>
                <p className="text-sm text-gray-500">Esta acción lo ocultará del directorio.</p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={vm.cancelDelete} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl">
                Cancelar
              </button>
              <button onClick={vm.handleDelete} className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-xl">
                Desactivar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  // ── Modo EMBEDDED: encaja dentro de la card de ClientsView ───────────
  if (embedded) {
    return (
      <>
        {/* Toolbar: igual al de ClientsView */}
        <div className="p-5 border-b border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-xs">
            <Icon icon="solar:magnifer-bold" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width={16} />
            <input
              type="text"
              placeholder="Buscar por nombre, CMP o especialidad..."
              value={vm.search}
              onChange={e => vm.setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <button
            onClick={vm.openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium text-sm transition-colors shadow-md shadow-violet-200/50 flex-shrink-0"
          >
            <Icon icon="solar:add-circle-bold" width={18} />
            Nuevo médico
          </button>
        </div>
        {/* Tabla */}
        <div className="p-4 min-h-[450px]">
          {tableContent}
        </div>
        {modals}
      </>
    );
  }

  // ── Modo STANDALONE: página propia con header y card ─────────────────
  return (
    <div className="p-6 space-y-6">
      {!hideHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Médicos</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Directorio de doctores vinculados a recetas y dispensación
            </p>
          </div>
          <button
            onClick={vm.openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium text-sm transition-colors"
          >
            <Icon icon="solar:add-circle-bold" width={18} />
            Nuevo médico
          </button>
        </div>
      )}
      <div className="relative max-w-sm">
        <Icon icon="solar:magnifer-bold" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width={16} />
        <input
          type="text"
          placeholder="Buscar por nombre, CMP o especialidad..."
          value={vm.search}
          onChange={e => vm.setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-slate-800 overflow-hidden">
        {tableContent}
      </div>
      {modals}
    </div>
  );
}
