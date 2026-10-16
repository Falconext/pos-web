import { Icon } from "@iconify/react";
import { useState } from "react";
import useAlertStore from "@/zustand/alert";

// Línea de PAQUETE (ej. six-pack escaneado): el vendedor piensa en packs, no en
// unidades — el carrito muestra/edita PACKS y por dentro la cantidad sigue en
// unidades (packs × unidadesPorPaquete) para que el stock descuente correcto.
const getPkgUnits = (item: any): number => {
    const u = Number(item?.unidadesPorPaquete) || 1;
    return item?.esPaquete && u > 1 ? u : 1;
};

// Afectación IGV por línea (Catálogo 07) para operaciones gratuitas — mismo set
// que el picker de la app móvil. La línea marcada así no suma al importe a pagar
// pero sigue declarada ante SUNAT con el valor referencial.
const AFECTACIONES_GRATUITAS: { value: string; label: string }[] = [
    { value: '11', label: 'Gratuito – Premio (gravado)' },
    { value: '12', label: 'Gratuito – Donación (gravado)' },
    { value: '13', label: 'Gratuito – Retiro (gravado)' },
    { value: '14', label: 'Gratuito – Publicidad (gravado)' },
    { value: '15', label: 'Bonificación (gravado)' },
    { value: '21', label: 'Transferencia gratuita (exonerado)' },
    { value: '31', label: 'Bonificación (inafecto)' },
];
const esAfectacionGratuitaCode = (codigo: any): boolean => {
    const n = Number(codigo);
    return (n >= 11 && n <= 16) || n === 21 || (n >= 31 && n <= 37);
};

/**
 * Las presentaciones en que se puede vender un producto: la unidad suelta y
 * cada paquete configurado (`ProductoCodigoBarras`).
 *
 * Se leen del catálogo por id y no de la propia línea para que, si alguien
 * cambia el precio de un paquete, el carrito no siga ofreciendo el viejo.
 */
const presentacionesDe = (item: any, vm: any) => {
    const catalogo = vm?.products || vm?.filteredProducts || [];
    const producto = catalogo.find((p: any) => Number(p?.id) === Number(item?.id));
    // El catálogo guarda los precios en la moneda NATIVA del producto. La línea
    // trae en `tipoCambio` el factor con que se la llevó a la moneda del
    // documento, así que los precios del catálogo pasan por el mismo factor:
    // de lo contrario una factura en dólares cobraría el número en soles.
    const factor = Number(item?.tipoCambio) > 0 ? Number(item.tipoCambio) : 1;
    // Precio de la unidad suelta. Se prefiere el que la línea guardó al pasar a
    // paquete, porque ya viene con la conversión y el precio de lote aplicados;
    // el del catálogo es el respaldo.
    const precioUnidad = Number(item?.precioUnidadSuelta) > 0
        ? Number(item.precioUnidadSuelta)
        : getPkgUnits(item) === 1
            ? Number(item?.precioBase ?? item?.precioUnitario ?? 0)
            : Number(producto?.precioUnitario ?? 0) * factor;
    const base = {
        clave: '',
        nombre: 'UNIDAD',
        unidades: 1,
        // Precio TOTAL de la presentación: el de la unidad suelta es el del producto.
        precio: precioUnidad,
    };
    const paquetes = (Array.isArray(producto?.paquetes) ? producto.paquetes : [])
        .map((paq: any) => {
            const unidades = Math.max(2, Number(paq?.unidadesPorPaquete) || 2);
            return {
                clave: String(paq?.codigo ?? ''),
                nombre: String(paq?.alias || `PAQUETE x${unidades}`).toUpperCase(),
                unidades,
                // Sin precio propio, el paquete vale unidades × precio unitario.
                precio: Number(paq?.precioPaquete) > 0
                    ? Number(paq.precioPaquete) * factor
                    : base.precio * unidades,
            };
        });
    return [base, ...paquetes];
};

/**
 * Cambiar la presentación de una línea ya agregada (UNIDAD ↔ PACK ↔ CAJA).
 *
 * Antes había que borrar la línea y volver a agregar el producto desde la
 * tarjeta correcta del catálogo: la cajera que se equivocaba de presentación
 * perdía la línea entera.
 *
 * La cantidad se conserva EN PRESENTACIONES, no en unidades: 1 caja pasa a ser
 * 1 unidad, no 12. Es lo que espera quien está mirando "1" en la pantalla.
 */
const PresentacionSelect = ({ item, index, vm }: { item: any; index: number; vm: any }) => {
    const opciones = presentacionesDe(item, vm);
    // Con una sola presentación el desplegable no agrega nada.
    if (opciones.length < 2) return null;

    const unidadesActuales = getPkgUnits(item);
    const actual = opciones.find((o) => o.unidades === unidadesActuales) ?? opciones[0];
    const cantidadEnPresentaciones = Number(item.cantidad) / unidadesActuales;
    const stockEnPresentacion = item?.stock !== undefined
        ? Number(item.stock) / (actual.unidades || 1)
        : null;

    const cambiar = (clave: string) => {
        const destino = opciones.find((o) => o.clave === clave);
        if (!destino || destino.unidades === unidadesActuales) return;

        const unidades = Math.round(cantidadEnPresentaciones * destino.unidades * 10000) / 10000;
        const esServicioLinea = String(item?.atributosTecnicos?.tipoProducto || '').toUpperCase() === 'SERVICIO';
        if (!esServicioLinea && item.stock !== undefined && Number(item.stock) < unidades && !vm.permitirVentaSinStock) {
            useAlertStore.getState().alert(
                `Solo hay ${item.stock} unidades de ${String(item.descripcion || 'este producto').toUpperCase()}`,
                'warning',
            );
            return;
        }

        const esPaquete = destino.unidades > 1;
        const lineaConPresentacion = {
            ...item,
            esPaquete,
            unidadesPorPaquete: destino.unidades,
            // Identidad de la presentación elegida ('' = unidad suelta). Sin
            // esto, al cambiar de lista de precios no había cómo saber QUÉ
            // presentación reprecia: se miraba `codigoBarras`, que sigue siendo
            // el del producto, y la lista devolvía el precio de la unidad.
            presentacionCodigo: destino.clave,
            // El precio de la línea va POR UNIDAD: cantidad × precio da el total
            // de la presentación, que es como lo espera el comprobante.
            //
            // `precioBase` manda: `calculateLineItem` recalcula con
            // `getApplicablePrice`, que lee `precioBase ?? precioUnitario`. Si acá
            // solo se tocara `precioUnitario`, el recálculo lo pisaría con el precio
            // de la unidad suelta y el six-pack de S/ 40 se cobraría 6 × 10 = S/ 60.
            precioBase: destino.precio / destino.unidades,
            precioUnitario: destino.precio / destino.unidades,
            precioOrigen: esPaquete ? 'PAQUETE' : 'UNIDAD',
            // Se guarda el precio de la unidad suelta para poder volver a él sin
            // releer el catálogo (que está en la moneda nativa).
            precioUnidadSuelta: opciones[0].precio,
            descripcion: esPaquete ? destino.nombre : (item.descripcionBase || item.descripcion),
            // Se guarda el nombre del producto suelto para poder volver a él.
            descripcionBase: item.descripcionBase || (esPaquete ? item.descripcion : item.descripcion),
        };
        vm.updateProductInvoice(index, {
            ...lineaConPresentacion,
            ...vm.calculateLineItem(lineaConPresentacion, unidades),
        });
    };

    return (
        <div className="mt-2 flex w-full min-w-0 items-center gap-1.5">
            <select
                value={actual.clave}
                onChange={(e) => cambiar(e.target.value)}
                data-testid={`presentacion-${index}`}
                title={`Presentación: ${actual.nombre}. Cambiarla recalcula precio y stock.`}
                // Los alias de paquete que pone el cliente pueden ser largos
                // ("SIX PACK LATAS DE CERVEZA PILSEN"), así que el selector va en
                // su propia fila y toma el ancho de la tarjeta: la cajera tiene
                // que poder leer qué presentación está vendiendo sin desplegarlo.
                className="h-7 min-w-0 flex-1 rounded-md border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-1.5 text-[11px] font-bold leading-none text-gray-700 dark:text-gray-200 outline-none"
            >
                {opciones.map((o) => (
                    <option key={o.clave || 'base'} value={o.clave}>
                        {o.nombre}
                    </option>
                ))}
            </select>
            {stockEnPresentacion !== null && (
                <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-500 dark:bg-slate-800 dark:text-gray-400 whitespace-nowrap">
                    Stock {stockEnPresentacion.toFixed(stockEnPresentacion % 1 === 0 ? 0 : 3)}
                </span>
            )}
        </div>
    );
};

const QtyInput = ({ item, index, vm }: { item: any; index: number; vm: any }) => {
    const factor = getPkgUnits(item);
    const displayQty = Number(item.cantidad) / factor;
    const [localValue, setLocalValue] = useState<string>(String(displayQty));
    const esServicio = String(item?.atributosTecnicos?.tipoProducto || '').toUpperCase() === 'SERVICIO';

    const commit = (raw: string) => {
        const parsed = parseFloat(raw);
        if (!Number.isFinite(parsed) || parsed <= 0) {
            setLocalValue(String(displayQty));
            return;
        }
        const unidades = Math.round(parsed * factor * 10000) / 10000;
        if (!esServicio && item.stock !== undefined && item.stock < unidades) {
            if (!vm.permitirVentaSinStock) {
                setLocalValue(String(displayQty));
                useAlertStore.getState().alert(`Solo hay ${item.stock} disponibles de ${String(item.descripcion || 'este producto').toUpperCase()}`, "warning");
                return;
            }
            // Sobreventa activa: se permite, pero con advertencia visible.
            if (vm.avisarSobreventa) useAlertStore.getState().alert(`Ojo: estás vendiendo por encima del stock (${item.stock} disponibles de ${String(item.descripcion || 'este producto').toUpperCase()})`, "warning");
        }
        setLocalValue(String(Math.round(parsed * 10000) / 10000));
        vm.updateProductInvoice(index, vm.calculateLineItem(item, unidades));
    };

    // Keep local value in sync when external updates happen (e.g. +/- buttons)
    if (String(Number(item.cantidad) / factor) !== localValue && document.activeElement?.getAttribute('data-qty-index') !== String(index)) {
        setLocalValue(String(Number(item.cantidad) / factor));
    }

    return (
        // Input de texto en modo decimal: sin flechas/spinner que puedan bajar
        // 0.5 -> 0.499 por accidente (stepping). Acepta solo dígitos y un punto.
        <input
            type="text"
            inputMode="decimal"
            data-qty-index={index}
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'))}
            onBlur={(e) => commit(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
            }}
            className="w-14 md:w-12 text-center font-bold text-sm dark:text-white bg-transparent border-0 outline-none focus:bg-white dark:focus:bg-slate-600 focus:rounded focus:ring-1 focus:ring-violet-400 px-1 py-0.5 transition-all"
        />
    );
};

export const POSCartLayout = ({ vm }: { vm: any }) => {
    const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});
    const [afectPickerIndex, setAfectPickerIndex] = useState<number | null>(null);
    const esFacturaOBoleta = ['FACTURA', 'BOLETA'].includes(vm.formValues?.comprobante);
    const requiereSerie = (item: any) => {
        const attrs = item?.atributosTecnicos || {};
        const control = String(attrs.controlSeries ?? attrs.requiereSerie ?? '').toLowerCase();
        return attrs.controlSeries === true || attrs.requiereSerie === true || ['true', 'si', 'sí', '1'].includes(control);
    };
    const esServicio = (item: any) => String(item?.atributosTecnicos?.tipoProducto || '').toUpperCase() === 'SERVICIO';

    // Devuelve los atajos de fracción según la unidad de medida del producto.
    // `unidadMedida` puede venir como string ("KILOGRAMO") u objeto ({codigo,nombre}).
    // Retorna null para unidades que se venden en enteros (unidad, gramo, ml, etc.).
    const getUnidadAtajos = (item: any): { sufijo: string; opciones: { v: number; l: string }[] } | null => {
        const um = item?.unidadMedida;
        const raw = um && typeof um === 'object' ? (um.codigo ?? um.nombre) : um;
        const u = String(
            raw ?? item?.unidadMedidaNombre ?? item?.unidadMedidaCodigo ?? item?.unidad ?? ''
        ).toUpperCase();

        if (u.includes('KGM') || u.includes('KILO') || u === 'KG') {
            return { sufijo: 'kg', opciones: [{ v: 0.25, l: '¼' }, { v: 0.5, l: '½' }, { v: 0.75, l: '¾' }, { v: 1, l: '1' }] };
        }
        if (u.includes('MTR') || u.includes('METRO') || u === 'M') {
            return { sufijo: 'm', opciones: [{ v: 0.5, l: '0.5' }, { v: 1, l: '1' }, { v: 2, l: '2' }, { v: 5, l: '5' }] };
        }
        if (u.includes('LTR') || u.includes('LITRO') || u === 'L') {
            return { sufijo: 'L', opciones: [{ v: 0.25, l: '¼' }, { v: 0.5, l: '½' }, { v: 1, l: '1' }, { v: 2, l: '2' }] };
        }
        // Galón (GLL / GALON / GALÓN / GALONES): venta por fracción de galón.
        if (u.includes('GLL') || u.includes('GAL')) {
            return { sufijo: 'gal', opciones: [{ v: 0.0625, l: '1/16' }, { v: 0.125, l: '⅛' }, { v: 0.25, l: '¼' }, { v: 0.5, l: '½' }, { v: 1, l: '1' }] };
        }
        return null;
    };

    // Fija la cantidad exacta (venta fraccionada), validando stock.
    // 4 decimales para soportar fracciones de galón (1/16 = 0.0625).
    const setQty = (item: any, index: number, value: number) => {
        const v = Math.round(value * 10000) / 10000;
        if (v <= 0) return;
        if (!esServicio(item) && item.stock !== undefined && Number(item.stock) < v) {
            if (!vm.permitirVentaSinStock) {
                useAlertStore.getState().alert(`Solo hay ${item.stock} disponibles de ${String(item.descripcion || 'este producto').toUpperCase()}`, "warning");
                return;
            }
            if (vm.avisarSobreventa) useAlertStore.getState().alert(`Ojo: estás vendiendo por encima del stock (${item.stock} disponibles de ${String(item.descripcion || 'este producto').toUpperCase()})`, "warning");
        }
        vm.updateProductInvoice(index, vm.calculateLineItem(item, v));
    };

    return (
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 scrollbar-thin">
            {vm.productsInvoice.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                    <Icon icon="solar:cart-large-minimalistic-linear" className="text-6xl mb-4" />
                    <p className="font-medium">El carrito está vacío</p>
                    <p className="text-sm">Agrega productos del catálogo</p>
                </div>
            ) : (
                vm.productsInvoice.map((item: any, index: number) => (
                    <div key={index} className="flex flex-col gap-2.5 bg-white dark:bg-[#111c44]/60 dark:backdrop-blur-sm p-3 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm hover:shadow-md hover:border-gray-200 dark:hover:border-white/20 transition-all group relative">
                        {/* Fila 1: imagen + descripción (ancho completo) + precio + acciones */}
                        <div className="flex items-start gap-3">
                            <div className="w-14 h-14 bg-gray-50 dark:bg-slate-800 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                                {item.imagenUrl && !brokenImages[`${item.productoId}-${index}`] ? (
                                    <img
                                        src={item.imagenUrl}
                                        alt={item.descripcion || "Producto"}
                                        className="w-full h-full object-contain rounded-lg"
                                        loading="lazy"
                                        onError={() => setBrokenImages((prev) => ({ ...prev, [`${item.productoId}-${index}`]: true }))}
                                    />
                                ) : (
                                    <Icon icon="solar:box-linear" className="text-gray-400 dark:text-gray-500" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h5 className="font-bold text-gray-800 dark:text-gray-200 text-sm line-clamp-2 leading-tight mb-0.5">{item.descripcion}</h5>
                                <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                                    {Number(item.descuento) > 0 && (
                                        <span className="text-green-600 dark:text-green-400 font-bold">-{item.descuento}%</span>
                                    )}
                                    {/* Farmacia: lote asignado */}
                                    {item.loteNumero && (
                                        <span className="text-slate-500 dark:text-slate-400">Lote: {item.loteNumero}</span>
                                    )}
                                    {/* Farmacia: cadena de frío */}
                                    {vm.usaLotesFarmacia && item.refrigerado && (
                                        <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 px-1.5 py-0.5 rounded-full font-semibold text-[10px]">🧊 Frío</span>
                                    )}
                                    {/* Farmacia/droguería: receta pendiente */}
                                    {vm.habilitaRecetaMedica && item.pendienteReceta && (
                                        <button
                                            onClick={() => vm.handleAbrirRecetaModal(index)}
                                            className="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 px-1.5 py-0.5 rounded-full font-semibold text-[10px] hover:bg-red-200 transition-colors"
                                        >
                                            📋 Receta
                                        </button>
                                    )}
                                    {/* Farmacia/droguería: receta confirmada */}
                                    {vm.habilitaRecetaMedica && item.datosReceta && !item.pendienteReceta && (
                                        <span className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 px-1.5 py-0.5 rounded-full font-semibold text-[10px]">✅ Receta OK</span>
                                    )}
                                    {requiereSerie(item) && (
                                        <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 px-1.5 py-0.5 rounded-full font-semibold text-[10px]">Serie obligatoria</span>
                                    )}
                                    {esServicio(item) && (
                                        <span className="bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 px-1.5 py-0.5 rounded-full font-semibold text-[10px]">Servicio</span>
                                    )}
                                    {item.esKit ? (
                                        <span
                                            className="bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/40 dark:text-fuchsia-300 px-1.5 py-0.5 rounded-full font-semibold text-[10px]"
                                            title={item.detalleKit ? `Incluye: ${item.detalleKit}` : undefined}
                                        >
                                            🎁 Kit
                                        </span>
                                    ) : item.esItemLibre && (
                                        <span className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 px-1.5 py-0.5 rounded-full font-semibold text-[10px]">Ítem libre</span>
                                    )}
                                    {getUnidadAtajos(item) && (
                                        <span className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 px-1.5 py-0.5 rounded-full font-semibold text-[10px]">⚖️ Por {getUnidadAtajos(item)!.sufijo}</span>
                                    )}
                                </div>
                                {/* Marcar línea como operación gratuita (Catálogo 07) — solo aplica a
                                    Factura/Boleta, que declaran a SUNAT. No suma al importe a pagar. */}
                                {esFacturaOBoleta && (
                                    <div className="relative mt-1.5 inline-block">
                                        <button
                                            type="button"
                                            onClick={() => setAfectPickerIndex(afectPickerIndex === index ? null : index)}
                                            className={`flex items-center gap-1 text-[11px] font-semibold ${esAfectacionGratuitaCode(item.tipoAfectacionIGV) ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500 hover:text-violet-600 dark:hover:text-violet-400'}`}
                                        >
                                            <Icon icon="solar:gift-linear" width={13} />
                                            {esAfectacionGratuitaCode(item.tipoAfectacionIGV)
                                                ? (AFECTACIONES_GRATUITAS.find(a => a.value === String(item.tipoAfectacionIGV))?.label ?? 'Operación gratuita')
                                                : 'Marcar como gratuito'}
                                        </button>
                                        {afectPickerIndex === index && (
                                            <>
                                                <div className="fixed inset-0 z-10" onClick={() => setAfectPickerIndex(null)} />
                                                <div className="absolute left-0 top-full mt-1 z-20 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-100 dark:border-white/10 py-1.5 max-h-64 overflow-y-auto">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            vm.updateProductInvoice(index, { tipoAfectacionIGV: '10', afectacionNombre: 'Gravado – Operación Onerosa' });
                                                            setAfectPickerIndex(null);
                                                        }}
                                                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700"
                                                    >
                                                        <Icon icon="solar:tag-price-linear" width={14} />
                                                        Onerosa (venta normal)
                                                    </button>
                                                    <div className="border-t border-gray-100 dark:border-white/10 my-1" />
                                                    {AFECTACIONES_GRATUITAS.map((a) => (
                                                        <button
                                                            key={a.value}
                                                            type="button"
                                                            onClick={() => {
                                                                vm.updateProductInvoice(index, { tipoAfectacionIGV: a.value, afectacionNombre: a.label });
                                                                setAfectPickerIndex(null);
                                                            }}
                                                            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                                                        >
                                                            <Icon icon="solar:gift-linear" width={14} />
                                                            {a.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                                {/* Venta fraccionada: atajos según la unidad (kg / m / L) */}
                                {(() => {
                                    const cfg = getUnidadAtajos(item);
                                    if (!cfg) return null;
                                    return (
                                        <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                                            {cfg.opciones.map((op) => (
                                                <button
                                                    key={op.v}
                                                    onClick={() => setQty(item, index, op.v)}
                                                    className="px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 text-[11px] font-bold hover:bg-amber-100 dark:hover:bg-amber-900/30 active:scale-95 transition-all"
                                                >
                                                    {op.l} {cfg.sufijo}
                                                </button>
                                            ))}
                                            <span className="text-[10px] text-gray-400 ml-0.5">o escribe la cantidad exacta →</span>
                                        </div>
                                    );
                                })()}
                                {requiereSerie(item) && (
                                    <textarea
                                        value={item.numerosSerie || ''}
                                        onChange={(e) => {
                                            const raw = e.target.value;
                                            // Cada serie = una unidad. Al escribir/pegar series (por línea o
                                            // separadas por coma) la cantidad se ajusta automáticamente al
                                            // número de series ingresadas. Si el campo queda vacío, se respeta
                                            // la cantidad actual.
                                            const count = raw.split(/[\n,]+/).map((s: string) => s.trim()).filter(Boolean).length;
                                            if (count > 0) {
                                                vm.updateProductInvoice(index, { ...vm.calculateLineItem(item, count), numerosSerie: raw });
                                            } else {
                                                vm.updateProductInvoice(index, { numerosSerie: raw });
                                            }
                                        }}
                                        placeholder={`Series (${Number(item.cantidad || 0)}): una por línea o separadas por coma`}
                                        className="mt-2 w-full min-h-[42px] rounded-lg border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/10 dark:border-emerald-900/50 px-3 py-2 text-xs font-semibold text-gray-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-300"
                                    />
                                )}
                                {/* Cantidad — justo debajo de la descripción.
                                    En líneas de paquete el stepper opera en PACKS
                                    (±unidadesPorPaquete por dentro). */}
                                <div className="mt-2 flex w-full flex-wrap items-center gap-2">
                                    <div className="flex shrink-0 items-center bg-gray-100 dark:bg-slate-800 rounded-lg p-1">
                                        <button
                                            onClick={() => {
                                                const paso = getPkgUnits(item);
                                                const cur = Number(item.cantidad);
                                                const next = Math.round((cur - paso) * 10000) / 10000;
                                                if (next <= 0) {
                                                    vm.handleDeleteProductByIndex(index);
                                                } else {
                                                    vm.updateProductInvoice(index, vm.calculateLineItem(item, next));
                                                }
                                            }}
                                            className="w-7 h-7 flex items-center justify-center bg-white dark:bg-slate-700 rounded shadow-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white active:scale-95 transition-transform"
                                        >
                                            <Icon icon="solar:minus-circle-linear" width={18} />
                                        </button>
                                        <QtyInput item={item} index={index} vm={vm} />
                                        <button
                                            onClick={() => {
                                                const paso = getPkgUnits(item);
                                                const newQty = Math.round((Number(item.cantidad) + paso) * 10000) / 10000;
                                                if (!esServicio(item) && item.stock !== undefined && item.stock < newQty) {
                                                    if (!vm.permitirVentaSinStock) {
                                                        useAlertStore.getState().alert(`Solo hay ${item.stock} disponibles de ${String(item.descripcion || 'este producto').toUpperCase()}`, "warning");
                                                        return;
                                                    }
                                                    if (vm.avisarSobreventa) useAlertStore.getState().alert(`Ojo: estás vendiendo por encima del stock (${item.stock} disponibles de ${String(item.descripcion || 'este producto').toUpperCase()})`, "warning");
                                                }
                                                vm.updateProductInvoice(index, vm.calculateLineItem(item, newQty));
                                            }}
                                            className="w-7 h-7 flex items-center justify-center bg-white dark:bg-slate-700 rounded shadow-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white active:scale-95 transition-transform"
                                        >
                                            <Icon icon="solar:add-circle-linear" width={18} />
                                        </button>
                                    </div>
                                    {getPkgUnits(item) > 1 && (
                                        <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 px-2 py-0.5 rounded-md whitespace-nowrap">
                                            = {Number(item.cantidad)} unid.
                                        </span>
                                    )}
                                </div>
                                <PresentacionSelect item={item} index={index} vm={vm} />
                            </div>{/* /descripción */}

                            {/* Precio + acciones (derecha de la fila 1) */}
                            <div className="flex flex-col items-end gap-1 shrink-0">
                                {esAfectacionGratuitaCode(item.tipoAfectacionIGV) ? (
                                    <div className="flex items-center gap-1.5">
                                        <p className="text-xs font-semibold text-gray-400 line-through whitespace-nowrap">{vm.monedaSimbolo} {Number(item.total).toFixed(2)}</p>
                                        <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">GRATIS</span>
                                    </div>
                                ) : (
                                    <p className="font-extrabold text-gray-900 dark:text-white text-sm whitespace-nowrap">{vm.monedaSimbolo} {Number(item.total).toFixed(2)}</p>
                                )}
                                {item.monedaOriginal === 'USD' && Number(item.tipoCambio) > 1 && (
                                    <p className="text-[10px] font-medium text-blue-500 dark:text-blue-400 leading-tight text-right">
                                        ${Number(item.precioOriginalUSD).toFixed(2)} × {Number(item.tipoCambio).toFixed(3)}
                                    </p>
                                )}
                                <div className="flex items-center -mr-1">
                                    <button onClick={() => vm.setEditingIndex(index)} title="Editar línea" aria-label="Editar línea" className="text-gray-500 dark:text-white/60 hover:text-violet-600 dark:hover:text-violet-400 p-1.5 transition-colors">
                                        <Icon icon="solar:pen-new-square-linear" width={18} />
                                    </button>
                                    <button onClick={() => vm.handleDeleteProductByIndex(index)} title="Eliminar línea" aria-label="Eliminar línea" className="text-red-400 dark:text-red-500 hover:text-red-600 p-1.5 transition-colors">
                                        <Icon icon="hugeicons:delete-02" width={18} />
                                    </button>
                                </div>
                            </div>
                        </div>{/* /Fila 1 */}
                    </div>
                ))
            )}
        </div>
    );
};
