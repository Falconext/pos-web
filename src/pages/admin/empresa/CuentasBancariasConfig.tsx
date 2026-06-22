import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@iconify/react';
import { useCuentasBancariasStore, BANCOS_PERU, ICuentaBancaria, ICreateCuentaBancaria } from '@/zustand/cuentasBancarias';

import { BancoLogo } from '@/components/shared/BancoLogo';

const EMPTY_FORM: ICreateCuentaBancaria = {
  banco: 'BCP',
  numeroCuenta: '',
  cci: '',
  titular: '',
  tipoCuenta: 'AHORROS',
  moneda: 'PEN',
  alias: '',
};

export default function CuentasBancariasConfig() {
  const { cuentas, loading, listar, crear, actualizar, eliminar } = useCuentasBancariasStore();
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<ICuentaBancaria | null>(null);
  const [form, setForm] = useState<ICreateCuentaBancaria>(EMPTY_FORM);
  const [mostrarInactivas, setMostrarInactivas] = useState(false);
  const [confirmarEliminar, setConfirmarEliminar] = useState<ICuentaBancaria | null>(null);

  useEffect(() => { listar(); }, [listar]);

  const cuentasVisibles = mostrarInactivas ? cuentas : cuentas.filter((c) => c.activo);

  const abrirNuevo = () => { setEditando(null); setForm(EMPTY_FORM); setShowForm(true); };

  const abrirEditar = (cuenta: ICuentaBancaria) => {
    setEditando(cuenta);
    setForm({
      banco: cuenta.banco,
      numeroCuenta: cuenta.numeroCuenta,
      cci: cuenta.cci ?? '',
      titular: cuenta.titular ?? '',
      tipoCuenta: cuenta.tipoCuenta,
      moneda: cuenta.moneda,
      alias: cuenta.alias ?? '',
    });
    setShowForm(true);
  };

  const cerrar = () => { setShowForm(false); setEditando(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.numeroCuenta.trim()) return;
    const payload = { ...form, cci: form.cci || undefined, titular: form.titular || undefined, alias: form.alias || undefined };
    if (editando) {
      await actualizar(editando.id, payload);
    } else {
      await crear(payload);
    }
    cerrar();
  };

  const handleToggle = async (cuenta: ICuentaBancaria) => {
    if (cuenta.activo) {
      await eliminar(cuenta.id);
    } else {
      await actualizar(cuenta.id, { activo: true });
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Icon icon="solar:card-bold-duotone" className="text-blue-500" width={20} />
            Cuentas Bancarias
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Agrega las cuentas donde recibes transferencias. Se mostrarán al registrar pagos.
          </p>
        </div>
        <button
          onClick={abrirNuevo}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-sm"
        >
          <Icon icon="solar:add-circle-bold" width={16} />
          Nueva cuenta
        </button>
      </div>

      {/* Lista */}
      {cuentasVisibles.length === 0 && !loading ? (
        <div className="py-10 text-center border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-2xl">
          <Icon icon="solar:bank-bold-duotone" width={40} className="mx-auto text-gray-300 dark:text-slate-600 mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">No hay cuentas bancarias registradas</p>
          <button onClick={abrirNuevo} className="mt-3 text-sm text-blue-600 hover:underline font-medium">
            Agregar primera cuenta
          </button>
        </div>
      ) : (
        <div className="grid gap-2">
          {cuentasVisibles.map((cuenta) => (
            <div
              key={cuenta.id}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                cuenta.activo
                  ? 'bg-white dark:bg-[#111827] border-gray-100 dark:border-slate-800'
                  : 'bg-gray-50 dark:bg-slate-900/50 border-gray-100 dark:border-slate-800 opacity-60'
              }`}
            >
              <div className="shrink-0">
                <BancoLogo banco={cuenta.banco} size={36} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {cuenta.alias ? `${cuenta.alias} · ${cuenta.banco}` : cuenta.banco} · {cuenta.numeroCuenta}
                </p>
                <p className="text-xs text-gray-400">
                  {cuenta.tipoCuenta} · {cuenta.moneda}
                  {cuenta.cci ? ` · CCI: ${cuenta.cci}` : ''}
                </p>
              </div>

              {!cuenta.activo && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-gray-400">
                  INACTIVA
                </span>
              )}

              <div className="flex items-center gap-1">
                <button
                  onClick={() => abrirEditar(cuenta)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  title="Editar"
                >
                  <Icon icon="solar:pen-bold" width={15} />
                </button>
                <button
                  onClick={() => cuenta.activo ? setConfirmarEliminar(cuenta) : handleToggle(cuenta)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    cuenta.activo
                      ? 'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                      : 'text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                  }`}
                  title={cuenta.activo ? 'Desactivar' : 'Reactivar'}
                >
                  <Icon icon={cuenta.activo ? 'solar:trash-bin-trash-bold' : 'solar:restart-bold'} width={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {cuentas.some((c) => !c.activo) && (
        <button
          onClick={() => setMostrarInactivas((v) => !v)}
          className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex items-center gap-1"
        >
          <Icon icon={mostrarInactivas ? 'solar:eye-closed-bold' : 'solar:eye-bold'} width={13} />
          {mostrarInactivas ? 'Ocultar inactivas' : 'Mostrar inactivas'}
        </button>
      )}

      {/* Modal confirmación eliminar */}
      {confirmarEliminar && createPortal(
        <div className="fixed inset-0 z-[1000001] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[1px]">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#111827] shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/30">
                <Icon icon="solar:trash-bin-trash-bold" className="text-red-500" width={22} />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white text-base">Eliminar cuenta bancaria</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Esta acción desactivará la cuenta</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-800/60 mb-5">
              <BancoLogo banco={confirmarEliminar.banco} size={32} />
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {confirmarEliminar.alias ? `${confirmarEliminar.alias} · ${confirmarEliminar.banco}` : confirmarEliminar.banco} · {confirmarEliminar.numeroCuenta}
                </p>
                <p className="text-xs text-gray-400">{confirmarEliminar.tipoCuenta} · {confirmarEliminar.moneda}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
              ¿Estás seguro de que deseas eliminar esta cuenta? Podrás reactivarla en cualquier momento desde "Mostrar inactivas".
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmarEliminar(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                disabled={loading}
                onClick={async () => {
                  await handleToggle(confirmarEliminar);
                  setConfirmarEliminar(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-60"
              >
                {loading ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {showForm && createPortal(
        <div className="fixed inset-0 z-[1000000] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[1px]">
          <div className="w-full max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl shadow-black/25 dark:bg-[#111827]">
            <div className="flex items-center gap-3 mb-5">
              <BancoLogo banco={form.banco} size={36} />
              <h4 className="flex-1 font-bold text-gray-900 dark:text-white text-base">
                {editando ? 'Editar cuenta bancaria' : 'Nueva cuenta bancaria'}
              </h4>
              <button onClick={cerrar} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <Icon icon="solar:close-circle-bold" width={22} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                    Banco *
                  </label>
                  <select
                    value={form.banco}
                    onChange={(e) => setForm((f) => ({ ...f, banco: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    {BANCOS_PERU.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                    Número de cuenta *
                  </label>
                  <input
                    type="text"
                    value={form.numeroCuenta}
                    onChange={(e) => setForm((f) => ({ ...f, numeroCuenta: e.target.value }))}
                    placeholder="Ej: 191-123456789-0-12"
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                    CCI (opcional)
                  </label>
                  <input
                    type="text"
                    value={form.cci}
                    onChange={(e) => setForm((f) => ({ ...f, cci: e.target.value }))}
                    placeholder="20 dígitos"
                    maxLength={20}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                    Titular de la cuenta
                  </label>
                  <input
                    type="text"
                    value={form.titular || ''}
                    onChange={(e) => setForm((f) => ({ ...f, titular: e.target.value }))}
                    placeholder="Nombre del empresario o empresa"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                    Tipo
                  </label>
                  <select
                    value={form.tipoCuenta}
                    onChange={(e) => setForm((f) => ({ ...f, tipoCuenta: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="AHORROS">Ahorros</option>
                    <option value="CORRIENTE">Corriente</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                    Moneda
                  </label>
                  <select
                    value={form.moneda}
                    onChange={(e) => setForm((f) => ({ ...f, moneda: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="PEN">PEN (Soles)</option>
                    <option value="USD">USD (Dólares)</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                    Nombre del Titular (opcional)
                  </label>
                  <input
                    type="text"
                    value={form.alias}
                    onChange={(e) => setForm((f) => ({ ...f, alias: e.target.value }))}
                    placeholder="Ej: Juan Pérez o Empresa SAC"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={cerrar}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
                >
                  {loading ? 'Guardando...' : editando ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
