import React from 'react';
import { Icon } from '@iconify/react';
import { useProductModalViewModel } from '../useProductModalViewModel';

type ViewProps = ReturnType<typeof useProductModalViewModel>;

export const ProductFinancialAnalysis: React.FC<{ vm: ViewProps }> = ({ vm }) => {
    const { isRestaurante, isFarmacia, formValues, isEdit, tipoAjusteStock, cantidadAjuste, stockOriginal } = vm;

    if (isRestaurante || isFarmacia || !(Number(formValues?.precioUnitario || 0) > 0 || Number(formValues?.costoUnitario || 0) > 0 || Number(formValues?.stock || 0) > 0)) {
        return null; // Solo se muestra si no es restaurante ni farmacia y tiene valores
    }

    const precioUnitario = Number(formValues?.precioUnitario || 0);
    const costoUnitario = Number(formValues?.costoUnitario || 0);
    const gananciaReunida = precioUnitario - costoUnitario;

    let margen = 0;
    if (precioUnitario > 0 && costoUnitario > 0) {
        margen = (gananciaReunida / precioUnitario) * 100;
    }

    const stockParaProyeccion = isEdit && tipoAjusteStock !== 'ninguno'
        ? (tipoAjusteStock === 'reemplazar' ? cantidadAjuste :
            tipoAjusteStock === 'sumar' ? stockOriginal + cantidadAjuste :
                tipoAjusteStock === 'restar' ? Math.max(0, stockOriginal - cantidadAjuste) : stockOriginal)
        : Number(formValues?.stock || 0);

    return (
        <div className="hidden md:block col-span-2 mt-4 p-3 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
                <div className="p-1 bg-blue-500 rounded-lg">
                    <Icon icon="mdi:chart-line" className="text-white" width={20} height={20} />
                </div>
                <h4 className="text-lg font-[400] text-gray-900">Análisis Financiero</h4>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-white p-3 rounded-lg border border-gray-100 text-center">
                    <div className="text-2xl font-[400] text-gray-600">S/ {precioUnitario.toFixed(2)}</div>
                    <div className="text-xs text-gray-600 mt-1 font-medium">Precio Venta</div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-gray-100 text-center">
                    <div className="text-2xl font-[400] text-gray-600">S/ {costoUnitario.toFixed(2)}</div>
                    <div className="text-xs text-gray-600 mt-1 font-medium">Costo Unitario</div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-gray-100 text-center">
                    <div className={`text-2xl font-[400] ${gananciaReunida > 0 ? 'text-green-600' : 'text-red-500'}`}>
                        S/ {gananciaReunida.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-600 mt-1 font-medium">Ganancia/Unidad</div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-gray-100 text-center">
                    <div className={`text-2xl font-[400] ${margen > 0 ? 'text-orange-600' : (margen < 0 ? 'text-red-500' : 'text-gray-400')}`}>
                        {margen.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-600 mt-1 font-medium">Margen</div>
                </div>
            </div>

            {stockParaProyeccion > 0 && precioUnitario > 0 && costoUnitario > 0 && (
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <h5 className="text-sm font-[400] text-gray-700 mb-2 flex items-center gap-2">
                        <Icon icon="mdi:calculator" width={16} height={16} />
                        Proyección con Stock {isEdit && tipoAjusteStock !== 'ninguno' ? 'Resultante' : 'Actual'}
                    </h5>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="text-center">
                            <div className="font-[400] text-gray-600">S/ {(precioUnitario * stockParaProyeccion).toFixed(2)}</div>
                            <div className="text-xs text-gray-500">Valor Total Venta</div>
                        </div>
                        <div className="text-center">
                            <div className="font-[400] text-green-600">S/ {(costoUnitario * stockParaProyeccion).toFixed(2)}</div>
                            <div className="text-xs text-gray-500">Inversión Total</div>
                        </div>
                        <div className="text-center">
                            <div className="font-[400] text-blue-600">S/ {(gananciaReunida * stockParaProyeccion).toFixed(2)}</div>
                            <div className="text-xs text-gray-500">Ganancia Potencial</div>
                        </div>
                    </div>
                </div>
            )}

            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                    <Icon icon="mdi:information" className="text-red-600 mt-0.5" width={16} height={16} />
                    <div className="text-xs text-red-800">
                        <p className="font-semibold mb-1">Notas importantes:</p>
                        <ul className="space-y-1 text-xs">
                            <li>• Al cambiar el stock se registrará automáticamente un movimiento en kardex</li>
                            <li>• El costo unitario ayuda a calcular el margen de ganancia real</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};
