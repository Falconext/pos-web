import React, { useEffect, useMemo, useState } from 'react';
import { useCajaStore } from '../../../../zustand/caja';
import { Icon } from '@iconify/react';
import Button from '@/components/Button';
import InputPro from '@/components/InputPro';
import useEscapeKey from '@/hooks/useEscapeKey';
import ModalRegistrarGasto from './ModalRegistrarGasto';

const CajaControl: React.FC = () => {
    const {
        estadoCaja,
        loading,
        error,
        obtenerEstadoCaja,
        abrirCaja,
        cerrarCaja,
        clearError,
    } = useCajaStore();

    const [showApertura, setShowApertura] = useState(false);
    const [showCierre, setShowCierre] = useState(false);
    const [showGasto, setShowGasto] = useState(false);
    const [confirmCierre, setConfirmCierre] = useState(false);
    const [formApertura, setFormApertura] = useState({
        montoInicial: '' as string | number,
        observaciones: ''
    });
    const [formCierre, setFormCierre] = useState({
        montoEfectivo: '' as string | number,
        montoYape: '' as string | number,
        montoPlin: '' as string | number,
        montoTransferencia: '' as string | number,
        montoTarjeta: '' as string | number,
        observaciones: ''
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        obtenerEstadoCaja();
    }, [obtenerEstadoCaja]);

    const totalDeclarado = useMemo(() => {
        return (
            (parseFloat(String(formCierre.montoEfectivo)) || 0) +
            (parseFloat(String(formCierre.montoYape)) || 0) +
            (parseFloat(String(formCierre.montoPlin)) || 0) +
            (parseFloat(String(formCierre.montoTransferencia)) || 0) +
            (parseFloat(String(formCierre.montoTarjeta)) || 0)
        );
    }, [formCierre]);

    const totalSistema = useMemo(() => {
        return Number(estadoCaja?.ventasDelDia?.totalIngresos || 0);
    }, [estadoCaja]);

    const diferencia = useMemo(() => totalDeclarado - totalSistema, [totalDeclarado, totalSistema]);

    const validateApertura = () => {
        const errors: Record<string, string> = {};
        const monto = parseFloat(String(formApertura.montoInicial));
        if (isNaN(monto) || String(formApertura.montoInicial) === '') {
            errors.montoInicial = 'El monto inicial es requerido';
        } else if (monto < 0) {
            errors.montoInicial = 'El monto no puede ser negativo';
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleAbrirCaja = async () => {
        if (!validateApertura()) return;
        const result = await abrirCaja({
            montoInicial: parseFloat(String(formApertura.montoInicial)) || 0,
            observaciones: formApertura.observaciones,
        });
        if (result.success) {
            setShowApertura(false);
            setFormApertura({ montoInicial: '', observaciones: '' });
            setFormErrors({});
        }
    };

    const handleCerrarCaja = async () => {
        const result = await cerrarCaja({
            montoEfectivo: parseFloat(String(formCierre.montoEfectivo)) || 0,
            montoYape: parseFloat(String(formCierre.montoYape)) || 0,
            montoPlin: parseFloat(String(formCierre.montoPlin)) || 0,
            montoTransferencia: parseFloat(String(formCierre.montoTransferencia)) || 0,
            montoTarjeta: parseFloat(String(formCierre.montoTarjeta)) || 0,
            observaciones: formCierre.observaciones,
        });
        if (result.success) {
            setShowCierre(false);
            setConfirmCierre(false);
            setFormCierre({
                montoEfectivo: '',
                montoYape: '',
                montoPlin: '',
                montoTransferencia: '',
                montoTarjeta: '',
                observaciones: ''
            });
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-PE', {
            style: 'currency',
            currency: 'PEN',
            minimumFractionDigits: 2,
        }).format(amount);
    };

    const isAbierta = estadoCaja?.estado === 'ABIERTA';

    useEscapeKey(() => setShowApertura(false), showApertura);
    useEscapeKey(() => setShowCierre(false), showCierre);
    useEscapeKey(() => setShowGasto(false), showGasto);

    if (loading && !estadoCaja) {
        return <div className="p-8 flex justify-center"><Icon icon="eos-icons:loading" className="text-3xl text-blue-600" /></div>;
    }

    const handleOpenCierre = () => {
        if (estadoCaja && estadoCaja.ventasDelDia) {
            const { mediosPago } = estadoCaja.ventasDelDia;
            const montoInicial = Number(estadoCaja.movimiento?.montoInicial || 0);

            setFormCierre({
                montoEfectivo: (montoInicial + Number(mediosPago.EFECTIVO || 0)).toFixed(2),
                montoYape: Number(mediosPago.YAPE || 0).toFixed(2),
                montoPlin: Number(mediosPago.PLIN || 0).toFixed(2),
                montoTransferencia: Number(mediosPago.TRANSFERENCIA || 0).toFixed(2),
                montoTarjeta: Number(mediosPago.TARJETA || 0).toFixed(2),
                observaciones: ''
            });
        }
        setShowCierre(true);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* Error global */}
            {error && (
                <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl">
                    <Icon icon="solar:danger-circle-bold" className="text-xl flex-shrink-0" />
                    <span className="text-sm font-medium flex-1">{error}</span>
                    <button onClick={clearError} className="text-red-400 dark:text-red-500 hover:text-red-600 dark:hover:text-red-400">
                        <Icon icon="solar:close-circle-bold" className="text-lg" />
                    </button>
                </div>
            )}

            {/* Hero Status Card */}
            <div className={`relative overflow-hidden rounded-3xl p-8 shadow-sm border transition-all
        ${isAbierta
                    ? 'bg-white dark:bg-[#111827] border-emerald-200 dark:border-emerald-900/30'
                    : 'bg-white dark:bg-[#111827] border-slate-200 dark:border-slate-800'}`}
            >
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-6">
                        <div className={`p-4 rounded-2xl ${isAbierta ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400'} backdrop-blur-sm`}>
                            <Icon
                                icon={isAbierta ? "solar:shop-2-bold-duotone" : "solar:lock-keyhole-minimalistic-bold-duotone"}
                                className="text-5xl"
                            />
                        </div>
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 font-medium mb-1">Estado del Turno</p>
                            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                                {isAbierta ? 'Turno Abierto' : 'Turno Cerrado'}
                            </h2>
                            {isAbierta && estadoCaja?.movimiento && (
                                <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 inline-flex items-center px-3 py-1 rounded-full border border-emerald-100 dark:border-emerald-900/50">
                                    <Icon icon="solar:clock-circle-linear" className="mr-1.5" />
                                    Abierto desde: {new Date(estadoCaja.movimiento.fecha).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                        {isAbierta ? (
                            <div className="flex flex-wrap gap-2 justify-end">
                                <button
                                    onClick={() => setShowGasto(true)}
                                    className="bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/30 border border-orange-200 dark:border-orange-800/50 px-5 py-3 rounded-xl font-bold shadow-sm transition-all transform hover:scale-105 flex items-center gap-2"
                                >
                                    <Icon icon="solar:wallet-money-bold-duotone" className="text-xl" />
                                    Registrar Gasto
                                </button>
                                <button
                                    onClick={handleOpenCierre}
                                    className="bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/50 px-6 py-3 rounded-xl font-bold shadow-sm transition-all transform hover:scale-105 flex items-center gap-2"
                                >
                                    <Icon icon="solar:stop-circle-bold" className="text-xl" />
                                    Cerrar Turno del Día
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowApertura(true)}
                                className="bg-emerald-600 text-white hover:bg-emerald-700 border-0 px-8 py-3 rounded-xl font-bold shadow-lg shadow-emerald-200 dark:shadow-emerald-900/20 transition-all transform hover:scale-105 flex items-center gap-2"
                            >
                                <Icon icon="solar:play-circle-bold" className="text-xl" />
                                Abrir Nuevo Turno
                            </button>
                        )}
                    </div>
                </div>

                <div className={`absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full blur-3xl opacity-20 ${isAbierta ? 'bg-emerald-100' : 'bg-slate-100'}`} />
            </div>

            {/* Stats Grid - Only visible when Open */}
            {isAbierta && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-[#111827] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex items-center gap-4 transition-all hover:shadow-lg dark:hover:shadow-blue-500/5">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl">
                            <Icon icon="solar:wallet-money-bold-duotone" className="text-3xl" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">Monto Inicial</p>
                            <p className="text-2xl font-bold text-gray-800 dark:text-white mt-0.5">
                                {formatCurrency(Number(estadoCaja?.movimiento?.montoInicial || 0))}
                            </p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#111827] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex items-center gap-4 transition-all hover:shadow-lg dark:hover:shadow-emerald-500/5">
                        <div className="p-3 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-2xl">
                            <Icon icon="solar:hand-money-bold-duotone" className="text-3xl" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">Ingresos del Turno</p>
                            <p className="text-2xl font-bold text-gray-800 dark:text-white mt-0.5">
                                {formatCurrency(Number(estadoCaja?.ventasDelDia?.totalIngresos || 0))}
                            </p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#111827] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex items-center gap-4 transition-all hover:shadow-lg dark:hover:shadow-orange-500/5">
                        <div className="p-3 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-2xl">
                            <Icon icon="solar:bill-list-bold-duotone" className="text-3xl" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">Gastos del Turno</p>
                            <p className="text-2xl font-bold text-gray-800 dark:text-white mt-0.5">
                                {formatCurrency(Number(estadoCaja?.totalEgresos || 0))}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Apertura */}
            {showApertura && (
                <div className="fixed inset-0 bg-black/50 z-50 top-[-30px] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#111827] rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border dark:border-slate-800">
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 border-b border-emerald-100 dark:border-emerald-900/30">
                            <h3 className="text-xl font-bold text-emerald-900 dark:text-emerald-400 flex items-center gap-2">
                                <Icon icon="solar:wad-of-money-bold" className="text-2xl" /> Apertura de Caja
                            </h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <InputPro
                                label="Monto Inicial (S/)"
                                name="montoInicial"
                                type="number"
                                value={formApertura.montoInicial}
                                onChange={(e: any) => {
                                    setFormApertura({ ...formApertura, montoInicial: e.target.value });
                                    setFormErrors({});
                                }}
                                autoFocus
                                isLabel
                            />
                            {formErrors.montoInicial && (
                                <p className="text-red-500 text-xs flex items-center gap-1 -mt-2">
                                    <Icon icon="solar:danger-circle-bold" />
                                    {formErrors.montoInicial}
                                </p>
                            )}
                            <InputPro
                                label="Observaciones"
                                name="observaciones"
                                value={formApertura.observaciones}
                                onChange={(e: any) => setFormApertura({ ...formApertura, observaciones: e.target.value })}
                                isLabel
                                placeholder="Opcional"
                            />
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-slate-900 border-t dark:border-slate-800 flex justify-end gap-3">
                            <button onClick={() => { setShowApertura(false); setFormErrors({}); }} className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors">Cancelar</button>
                            <Button onClick={handleAbrirCaja} disabled={loading} className="bg-emerald-600 text-white hover:bg-emerald-700 border-none">
                                {loading ? <Icon icon="eos-icons:loading" className="mr-2" /> : null}
                                Confirmar Apertura
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Cierre */}
            {showCierre && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#111827] rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border dark:border-slate-800">
                        <div className="bg-slate-50 dark:bg-slate-900 p-6 border-b border-gray-100 dark:border-slate-800">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Icon icon="solar:safe-circle-bold" className="text-red-500" /> Cierre de Turno
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Ingresa los montos finales contados en caja.</p>
                        </div>
                        <div className="p-6 grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <InputPro
                                    label="Efectivo en Caja (S/)"
                                    name="montoEfectivo"
                                    type="number"
                                    value={formCierre.montoEfectivo}
                                    onChange={(e: any) => setFormCierre({ ...formCierre, montoEfectivo: e.target.value })}
                                    isLabel
                                    autoFocus
                                />
                            </div>
                            <InputPro
                                label="Yape (S/)"
                                name="montoYape"
                                type="number"
                                value={formCierre.montoYape}
                                onChange={(e: any) => setFormCierre({ ...formCierre, montoYape: e.target.value })}
                                isLabel
                            />
                            <InputPro
                                label="Plin (S/)"
                                name="montoPlin"
                                type="number"
                                value={formCierre.montoPlin}
                                onChange={(e: any) => setFormCierre({ ...formCierre, montoPlin: e.target.value })}
                                isLabel
                            />
                            <InputPro
                                label="Tarjetas (S/)"
                                name="montoTarjeta"
                                type="number"
                                value={formCierre.montoTarjeta}
                                onChange={(e: any) => setFormCierre({ ...formCierre, montoTarjeta: e.target.value })}
                                isLabel
                            />
                            <InputPro
                                label="Transferencias (S/)"
                                name="montoTransferencia"
                                type="number"
                                value={formCierre.montoTransferencia}
                                onChange={(e: any) => setFormCierre({ ...formCierre, montoTransferencia: e.target.value })}
                                isLabel
                            />
                            <div className="col-span-2">
                                <InputPro
                                    label="Observaciones"
                                    name="observaciones"
                                    value={formCierre.observaciones}
                                    onChange={(e: any) => setFormCierre({ ...formCierre, observaciones: e.target.value })}
                                    isLabel
                                    type="textarea"
                                    rows={2}
                                    placeholder="Comentarios finales del turno..."
                                />
                            </div>

                            {/* Resumen en tiempo real */}
                            <div className="col-span-2 bg-gray-50 dark:bg-slate-900/50 rounded-xl p-4 space-y-2 border border-gray-200 dark:border-slate-700">
                                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                                    <span>Total del sistema:</span>
                                    <span className="font-semibold dark:text-white">{formatCurrency(totalSistema)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                                    <span>Total declarado:</span>
                                    <span className="font-semibold dark:text-white">{formatCurrency(totalDeclarado)}</span>
                                </div>
                                <div className={`flex justify-between text-sm font-bold border-t border-gray-200 dark:border-slate-700 pt-2 ${Math.abs(diferencia) < 0.01 ? 'text-emerald-600 dark:text-emerald-400' : diferencia > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                                    <span>Diferencia:</span>
                                    <span>{diferencia >= 0 ? '+' : ''}{formatCurrency(diferencia)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Confirmación antes de cerrar */}
                        {!confirmCierre ? (
                            <div className="p-4 bg-gray-50 dark:bg-slate-900 border-t dark:border-slate-800 flex justify-end gap-3">
                                <button onClick={() => setShowCierre(false)} className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors">Cancelar</button>
                                <Button onClick={() => setConfirmCierre(true)} className="bg-amber-500 text-white hover:bg-amber-600 border-none">
                                    <Icon icon="solar:shield-warning-bold" className="mr-1" />
                                    Revisar y Cerrar
                                </Button>
                            </div>
                        ) : (
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 border-t border-red-100 dark:border-red-900/30 space-y-3">
                                <p className="text-sm text-red-700 dark:text-red-400 font-medium text-center flex items-center justify-center gap-2">
                                    <Icon icon="solar:danger-triangle-bold" className="text-lg" />
                                    ¿Confirmas el cierre de caja? Esta acción no se puede deshacer.
                                </p>
                                <div className="flex justify-center gap-3">
                                    <button onClick={() => setConfirmCierre(false)} className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors">Volver</button>
                                    <Button onClick={handleCerrarCaja} disabled={loading} className="bg-red-500 text-white hover:bg-red-600 border-none">
                                        {loading ? <Icon icon="eos-icons:loading" className="mr-2" /> : <Icon icon="solar:stop-circle-bold" className="mr-1" />}
                                        Confirmar Cierre
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <ModalRegistrarGasto
                isOpen={showGasto}
                onClose={() => setShowGasto(false)}
                onSuccess={() => obtenerEstadoCaja()}
            />
        </div>
    );
};

export default CajaControl;
