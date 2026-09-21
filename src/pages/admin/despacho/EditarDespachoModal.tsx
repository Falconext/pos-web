import { Icon } from "@iconify/react";
import { useState, useEffect } from "react";
import { Calendar } from "@/components/Date";
import Select from "@/components/Select";
import moment from "moment";
import apiClient from "@/utils/apiClient";
import useAlertStore from "@/zustand/alert";
import { useExtentionsStore } from '@/zustand/extentions';
import { TIPOS_VENTA_REPARTO, FORMAS_PAGO_COBRO, filtrarDistritos, cobraEnDestinoReparto } from './repartoPropio';
import { useRepartidoresStore } from "@/zustand/repartidores";
import { ShalomAgenciaSelect } from "@/components/ShalomAgenciaSelect";
import { ShalomProductoSelect } from "@/components/ShalomProductoSelect";
import { mensajeErrorShalom, shalomService, type ShalomClaveRetiro, type ShalomInstancia, type ShalomTarifa } from "@/services/shalom.service";
import { OlvaAgenciaSelect } from "@/components/OlvaAgenciaSelect";
import { mensajeErrorOlva, olvaService, type OlvaConfig } from "@/services/olva.service";
import { EstablecimientoCombobox } from "@/components/EstablecimientoCombobox";

export const COURIERS = [
    { value: 'SHALOM_PRO', label: 'Shalom PRO' },
    { value: 'SHALOM_COD', label: 'Shalom COD' },
    { value: 'OLVA', label: 'Olva Courier' },
    { value: 'PROPIOS', label: 'Reparto propio' },
];

export const TURNOS = [
    { value: 'MANANA', label: 'Mañana' },
    { value: 'TARDE', label: 'Tarde' },
    { value: 'NOCHE', label: 'Noche' },
];

const SHALOM_COURIERS = new Set(['SHALOM_PRO', 'SHALOM_COD']);
const OLVA_COURIER = 'OLVA';

const inp = "w-full h-10 px-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 transition-all placeholder:text-slate-400";
const lbl = "block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5";

function PasswordField({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
    const [show, setShow] = useState(false);
    return (
        <div className="relative">
            <input
                type={show ? 'text' : 'password'}
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                className={inp + ' pr-10'}
            />
            <button
                type="button"
                onClick={() => setShow(v => !v)}
                className="absolute inset-y-0 right-2.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
            >
                <Icon icon={show ? 'solar:eye-bold' : 'solar:eye-closed-bold'} className="text-base" />
            </button>
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label className={lbl}>{label}</label>
            {children}
        </div>
    );
}

/**
 * Payload del despacho para el PUT. `@IsOptional()` de class-validator solo salta
 * null/undefined, así que los vacíos del formulario ('' en la fecha, 0 en el peso)
 * rebotan contra @IsDateString y @Min(0.1). Aquí se omiten en vez de enviarse.
 */
function construirPayloadDespacho(envioData: any) {
    const opcional = (v: any) => (v === '' || v === null ? undefined : v);
    // Con Shalom/Olva el rastreo es el N° de orden del courier: se copia al código
    // de guía genérico para que WhatsApp al cliente, trazabilidad y Excel lo muestren.
    const esCourierConOrden = SHALOM_COURIERS.has(envioData.transportista) || envioData.transportista === OLVA_COURIER;
    const codigoGuia = String(envioData.codigoGuia ?? '').trim() || (esCourierConOrden ? String(envioData.nroOrden ?? '').trim() : '');
    // Las claves son de Shalom: si se cambió a otro courier (p. ej. la clave del
    // día se precargó y luego eligieron Reparto propio) no deben quedar guardadas,
    // porque el WhatsApp/rótulo las mostrarían como "clave de retiro".
    const esShalomPayload = SHALOM_COURIERS.has(envioData.transportista);
    return {
        ...envioData,
        codigoGuia,
        claveEnvio: esShalomPayload ? envioData.claveEnvio : '',
        claveOrden: esShalomPayload ? envioData.claveOrden : '',
        pagarFlete: envioData.aplicacionMontoCliente === 'NEGOCIO' ? 'NEGOCIO' : 'CLIENTE',
        repartidorId: envioData.repartidorId ? Number(envioData.repartidorId) : undefined,
        repartidor: envioData.repartidorId ? undefined : envioData.repartidor,
        fechaEstimada: opcional(envioData.fechaEstimada),
        // Turno vacío rebota contra @IsIn(MANANA|TARDE|NOCHE): se omite, igual que la fecha.
        turnoEnvio: opcional(envioData.turnoEnvio),
        pesoKg: Number(envioData.pesoKg) > 0 ? Number(envioData.pesoKg) : undefined,
        shalomTipoProducto: Number(envioData.shalomTipoProducto) > 0 ? Number(envioData.shalomTipoProducto) : undefined,
        nroPaquetes: Number(envioData.nroPaquetes) > 0 ? Number(envioData.nroPaquetes) : undefined,
        montoCOD: Number(envioData.montoCOD) >= 0 ? Number(envioData.montoCOD) : undefined,
        costoEnvio: Number(envioData.costoEnvio) >= 0 ? Number(envioData.costoEnvio) : undefined,
        // Reparto propio: los selects vacíos rebotan contra @IsIn, se omiten.
        tipoVentaReparto: opcional(envioData.tipoVentaReparto),
        formaPagoCobro: opcional(envioData.formaPagoCobro),
        revisarProducto: !!envioData.revisarProducto,
        // Solo lectura (viene del comprobante / lo pone el backend al crear la guía).
        sedeOrigenNombre: undefined,
        shalomFleteCotizado: undefined,
    };
}

export { TIPOS_VENTA_REPARTO, FORMAS_PAGO_COBRO } from './repartoPropio';
export function EditarDespachoModal({ comprobanteId, onClose, onSuccess }: { comprobanteId: number; onClose: () => void; onSuccess: () => void }) {
    const [envioData, setEnvioData] = useState<any>({
        transportista: '',
        codigoGuia: '',
        observaciones: '',
        tipoEnvio: 'DOMICILIO',
        agenciaDestino: '',
        celularDest: '',
        // Destinatario de la guía (Shalom/Olva lo exigen). Si el cliente fue dado
        // de alta solo con WhatsApp ("WSP 9…"), aquí se completa por primera vez.
        dniDestinatario: '',
        nombreDestinatario: '',
        actualizarFichaCliente: false,
        nroPaquetes: 1,
        turnoEnvio: '',
        tipoMercaderia: '',
        claveEnvio: '',
        nroOrden: '',
        claveOrden: '',
        establecimiento: '',
        repartidorId: '',
        repartidor: '',
        empaquetador: '',
        fechaEstimada: '',
        costoEnvio: 0,
        pagarFlete: 'CLIENTE' as 'CLIENTE' | 'NEGOCIO',
        aplicacionMontoCliente: 'ADELANTO' as 'ITEM_ENVIO' | 'ADELANTO' | 'NEGOCIO',
        montoCOD: 0,
        pesoKg: 0,
        shalomAgenciaDestinoId: '',
        shalomTipoProducto: undefined as number | undefined,
        shalomFleteCotizado: null as number | null,
        olvaAgenciaDestinoCodigo: '',
        // Reparto propio / motorizado externo (plantilla de carga masiva del courier)
        tipoVentaReparto: '',
        distritoUbigeo: '',
        distrito: '',
        coordenadas: '',
        formaPagoCobro: '',
        revisarProducto: false,
        sedeOrigenNombre: '',
    });
    // Cuenta Shalom Pro conectada (plan Corporativo): habilita generar la guía.
    const [shalomPro, setShalomPro] = useState<ShalomInstancia | null>(null);
    // Config Olva de la empresa: `habilitadoPorPlan` habilita generar la guía.
    const [olva, setOlva] = useState<OlvaConfig | null>(null);
    const [generandoGuia, setGenerandoGuia] = useState(false);
    // Clave de retiro sugerida (la del día / configurada / aleatoria) y las que
    // Shalom rechaza hoy por ser de ayer. Se precarga cuando el despacho aún no
    // tiene guía y el usuario no escribió ninguna.
    const [claveInfo, setClaveInfo] = useState<ShalomClaveRetiro | null>(null);
    // Tarifa cotizada de la ruta (la devuelve el selector de tamaño) para el resumen.
    const [tarifaShalom, setTarifaShalom] = useState<ShalomTarifa | null>(null);
    // Ficha del cliente del comprobante, para saber si ya tiene DNI o es "WSP 9…".
    const [clienteFicha, setClienteFicha] = useState<{ id: number | null; nombre: string; nroDoc: string; telefono: string } | null>(null);
    const [buscandoDni, setBuscandoDni] = useState(false);
    const [esNV, setEsNV] = useState(false);
    // Saldo pendiente de la venta: decide el tipo de venta por defecto del reparto propio.
    const [saldoVenta, setSaldoVenta] = useState(0);
    // Resumen de cobro de la venta: se muestra arriba para que quede claro si ya
    // está pagada (y entonces no hay monto que registrar) o cuánto falta.
    const [ventaInfo, setVentaInfo] = useState<{ referencia: string; total: number; pagado: number; saldo: number; estadoPago: string; simbolo: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { alert } = useAlertStore();
    const { repartidores, fetchRepartidores } = useRepartidoresStore();
    // Distritos (ubigeo) para el reparto propio: se cargan una sola vez.
    const { ubigeos, getUbigeos } = useExtentionsStore();
    const [distritoQuery, setDistritoQuery] = useState('');
    const [distritoOpen, setDistritoOpen] = useState(false);

    useEffect(() => {
        const fetchDespacho = async () => {
            try {
                const [, despachoResp, comprobanteResp] = await Promise.all([
                    fetchRepartidores(),
                    apiClient.get<any>(`/envio-despacho/comprobante/${comprobanteId}`),
                    apiClient.get<any>(`/comprobante/${comprobanteId}`).catch(() => null),
                ]);
                const data = despachoResp.data;
                const payload = data?.data ?? data;
                const comprobantePayload = comprobanteResp?.data?.data ?? comprobanteResp?.data ?? null;
                const vendedorNombre = comprobantePayload?.usuario?.nombre ?? '';
                const tipoComp = comprobantePayload?.tipoDoc ?? comprobantePayload?.tipoComprobante ?? comprobantePayload?.tipo ?? '';
                const FORMALES = ['01', '03', '07', '08'];
                setEsNV(!FORMALES.includes(tipoComp) || tipoComp === '');
                setSaldoVenta(Number(comprobantePayload?.saldo ?? 0));
                if (comprobantePayload) {
                    const totalVenta = Number(comprobantePayload.mtoImpVenta ?? 0);
                    const saldo = Math.max(Number(comprobantePayload.saldo ?? 0), 0);
                    setVentaInfo({
                        referencia: [comprobantePayload.serie, comprobantePayload.correlativo].filter(Boolean).join('-'),
                        total: totalVenta,
                        pagado: Math.max(totalVenta - saldo, 0),
                        saldo,
                        estadoPago: String(comprobantePayload.estadoPago ?? ''),
                        simbolo: String(comprobantePayload.tipoMoneda ?? '').toUpperCase() === 'USD' ? 'US$' : 'S/',
                    });
                }
                const adelantoComprobante = Number(comprobantePayload?.adelanto ?? 0);
                const cli = comprobantePayload?.cliente ?? null;
                const cliNroDoc = String(cli?.nroDoc ?? '').trim();
                const cliNombre = String(cli?.nombre ?? '').trim();
                // "10000000" es el documento del cliente genérico del POS: no es un DNI real.
                const cliTieneDni = /^\d{8}$/.test(cliNroDoc) && cliNroDoc !== '10000000';
                const cliEsWsp = /^WSP\s/i.test(cliNombre) || !cliTieneDni;
                // "CLIENTES VARIOS" es el genérico del POS: no sirve como nombre de quien recibe.
                const cliEsGenerico = /^CLIENTES?\s+VARIOS$/i.test(cliNombre);
                setClienteFicha(cli ? { id: cli.id ?? null, nombre: cliNombre, nroDoc: cliNroDoc, telefono: String(cli.telefono ?? '') } : null);
                if (payload) {
                    // (direccionDestino no cuenta: el backend la precarga desde la ficha del cliente.)
                    setEsNuevo(!payload.agenciaDestino && !payload.nroOrden && !payload.codigoGuia && !payload.claveOrden && !payload.repartidor && !payload.repartidorId && !payload.distrito);
                    setEnvioData({
                        transportista: payload.transportista || '',
                        codigoGuia: payload.codigoGuia || '',
                        observaciones: payload.observaciones || '',
                        tipoEnvio: payload.tipoEnvio || 'DOMICILIO',
                        agenciaDestino: payload.agenciaDestino || '',
                        celularDest: payload.celularDest || (/^9\d{8}$/.test(String(cli?.telefono ?? '').replace(/\D/g, '')) ? String(cli.telefono).replace(/\D/g, '') : ''),
                        // Si el despacho no tiene destinatario, se toma el del cliente
                        // solo cuando su ficha es real (DNI de 8 dígitos y no "WSP …").
                        dniDestinatario: payload.dniDestinatario || (cliTieneDni ? cliNroDoc : ''),
                        nombreDestinatario: payload.nombreDestinatario || (cliEsWsp || cliEsGenerico ? '' : cliNombre),
                        // Cliente sin DNI: por defecto se corrige su ficha al guardar.
                        actualizarFichaCliente: cliEsWsp,
                        nroPaquetes: payload.nroPaquetes || 1,
                        turnoEnvio: payload.turnoEnvio || '',
                        tipoMercaderia: payload.tipoMercaderia || '',
                        claveEnvio: payload.claveEnvio || '',
                        nroOrden: payload.nroOrden || '',
                        claveOrden: payload.claveOrden || '',
                        establecimiento: payload.establecimiento || '',
                        repartidorId: payload.repartidorId ? String(payload.repartidorId) : '',
                        repartidor: payload.repartidor || '',
                        empaquetador: payload.empaquetador || vendedorNombre || '',
                        fechaEstimada: payload.fechaEstimada ? moment(payload.fechaEstimada).format('YYYY-MM-DD') : '',
                        costoEnvio: payload.costoEnvio ?? adelantoComprobante ?? 0,
                        pagarFlete: payload.pagarFlete ?? (adelantoComprobante > 0 ? 'CLIENTE' : 'NEGOCIO'),
                        aplicacionMontoCliente: payload.aplicacionMontoCliente ?? (adelantoComprobante > 0 ? 'ADELANTO' : 'NEGOCIO'),
                        montoCOD: payload.montoCOD ?? 0,
                        pesoKg: payload.pesoKg ?? 0,
                        shalomAgenciaDestinoId: payload.shalomAgenciaDestinoId || '',
                        shalomTipoProducto: payload.shalomTipoProducto ?? undefined,
                        shalomFleteCotizado: payload.shalomFleteCotizado ?? null,
                        olvaAgenciaDestinoCodigo: payload.olvaAgenciaDestinoCodigo || '',
                        tipoVentaReparto: payload.tipoVentaReparto || '',
                        distritoUbigeo: payload.distritoUbigeo || '',
                        distrito: payload.distrito || '',
                        coordenadas: payload.coordenadas || '',
                        formaPagoCobro: payload.formaPagoCobro || '',
                        revisarProducto: !!payload.revisarProducto,
                        sedeOrigenNombre: payload.sedeOrigenNombre || '',
                    });
                }
            } catch (error) {
                alert('No se pudo cargar el despacho', 'error');
                onClose();
            } finally {
                setLoading(false);
            }
        };
        fetchDespacho();
    // Solo al cambiar de comprobante: `onClose` llega como arrow inline del
    // padre y cambia en cada render (p. ej. al mostrar un toast), y volver a
    // cargar el despacho borraba lo que el usuario estaba escribiendo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [comprobanteId]);

    useEffect(() => {
        let vivo = true;
        shalomService.getInstancia()
            .then(data => {
                if (!vivo) return;
                setShalomPro(data);
                if (data?.habilitadoPorPlan && data?.conectada) {
                    shalomService.claveRetiro()
                        .then(info => { if (vivo) setClaveInfo(info); })
                        .catch(() => { if (vivo) setClaveInfo(null); });
                }
            })
            .catch(() => { if (vivo) setShalomPro(null); });
        olvaService.getConfig()
            .then(data => { if (vivo) setOlva(data); })
            .catch(() => { if (vivo) setOlva(null); });
        return () => { vivo = false; };
    }, []);

    const set = (field: string, value: any) =>
        setEnvioData((prev: any) => ({ ...prev, [field]: value }));

    // Se precarga cuando YA cargó el despacho (si la sugerencia llega antes que
    // el despacho, el setEnvioData de la carga la pisaba con '' y el campo
    // quedaba vacío aunque la ayuda dijera "la clave que ya usaste hoy").
    useEffect(() => {
        if (!claveInfo?.clave || loading) return;
        setEnvioData((prev: any) => (!prev.claveEnvio && !prev.nroOrden ? { ...prev, claveEnvio: claveInfo.clave } : prev));
    }, [claveInfo, loading]);

    // Validación local de la clave escrita (el backend la repite): 4 dígitos y
    // distinta a la usada ayer, que Shalom rechaza con "clave del día anterior".
    const claveEscrita = String(envioData.claveEnvio ?? '').trim();
    const claveEsDeAyer = Boolean(claveEscrita) && (claveInfo?.usadasAyer ?? []).includes(claveEscrita);
    const claveFormatoOk = !claveEscrita || /^\d{4}$/.test(claveEscrita);
    // Shalom rechaza cualquier año del calendario como clave ("Por seguridad…").
    const claveEsAnio = /^(19|20)\d{2}$/.test(claveEscrita);
    const claveManual = Boolean(claveEscrita) && claveInfo != null && claveEscrita !== claveInfo.clave && !envioData.nroOrden;
    const claveAlternativa = claveInfo && claveInfo.clave !== claveEscrita ? claveInfo.clave : (claveInfo?.configuradas.find(c => !claveInfo.usadasAyer.includes(c) && c !== claveEscrita) ?? null);

    useEffect(() => {
        if (envioData.transportista === 'PROPIOS' && (!ubigeos || ubigeos.length === 0)) void getUbigeos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [envioData.transportista]);

    const distritosFiltrados = filtrarDistritos(ubigeos, distritoQuery);
    const cobraEnDestino = cobraEnDestinoReparto(envioData.tipoVentaReparto);

    // Lo que exigen Shalom/Olva para registrar la guía: DNI de 8 dígitos, nombre y
    // celular. Se calcula acá para deshabilitar el botón y decir qué falta.
    const dniOk = /^\d{8}$/.test(String(envioData.dniDestinatario ?? '').trim());
    const nombreOk = String(envioData.nombreDestinatario ?? '').trim().length >= 3;
    const celularOk = /^9\d{8}$/.test(String(envioData.celularDest ?? '').replace(/\D/g, ''));
    const faltanDestinatario: string[] = [
        ...(!dniOk ? ['el DNI del destinatario (bloque "Destinatario")'] : []),
        ...(!nombreOk ? ['el nombre del destinatario'] : []),
        ...(!celularOk ? ['un celular de 9 dígitos (campo "Celular destinatario")'] : []),
    ];
    const clienteSinDni = !!clienteFicha && !/^\d{8}$/.test(clienteFicha.nroDoc);

    // RENIEC (apiperu) al completar los 8 dígitos: rellena el nombre como lo
    // exige Shalom (apellidos y nombres separados por coma).
    const buscarDni = async (dni: string) => {
        if (!/^\d{8}$/.test(dni) || buscandoDni) return;
        setBuscandoDni(true);
        try {
            const { data } = await apiClient.get<any>(`/clientes/consultar/DNI/${dni}`);
            const d = data?.data ?? data;
            const nombres = String(d?.nombres ?? '').trim();
            const paterno = String(d?.apellido_paterno ?? d?.apellidoPaterno ?? '').trim();
            const materno = String(d?.apellido_materno ?? d?.apellidoMaterno ?? '').trim();
            const completo = d?.nombre_completo ?? (nombres && paterno ? `${paterno} ${materno}, ${nombres}`.replace(/\s+,/, ',') : '');
            if (completo) {
                set('nombreDestinatario', String(completo).trim());
                alert('Datos de RENIEC cargados', 'success');
            } else {
                alert('RENIEC no devolvió datos para ese DNI; escribe el nombre a mano.', 'warning');
            }
        } catch {
            alert('No se pudo consultar RENIEC; escribe el nombre a mano.', 'warning');
        } finally {
            setBuscandoDni(false);
        }
    };

    const selectedCourier = COURIERS.find(c => c.value === envioData.transportista);
    const esShalom = SHALOM_COURIERS.has(envioData.transportista);
    const esPropio = envioData.transportista === 'PROPIOS';
    const esOlva = envioData.transportista === OLVA_COURIER;
    const esCOD = envioData.transportista === 'SHALOM_COD';
    // Despacho recién creado desde "Coordinar envío" (solo trae courier por defecto):
    // el modal se presenta como coordinación, no como edición de algo que no existe.
    const [esNuevo, setEsNuevo] = useState(false);
    const ventaPagada = !!ventaInfo && ventaInfo.saldo <= 0.009;
    const fmt = (n: number) => `${ventaInfo?.simbolo ?? 'S/'} ${Number(n || 0).toFixed(2)}`;
    // Qué hace cada courier con el dinero: es lo que más confunde al empresario.
    const COURIER_HINTS: Record<string, string> = {
        SHALOM_PRO: 'Registra la guía en tu cuenta Shalom Pro. El flete se paga según tu acuerdo con Shalom (normalmente el destinatario al recoger); Shalom no cobra la mercadería.',
        SHALOM_COD: 'Igual que PRO, pero además anotas el saldo que el cliente aún debe por la venta, para tu control y el Excel de cobros. Shalom NO cobra ese monto por ti.',
        OLVA: 'Envío por Olva; el rastreo funciona con el N° de guía.',
        PROPIOS: 'Tu motorizado entrega en la puerta y, si la venta tiene saldo, lo cobra ahí.',
    };

    // Genera la guía en Shalom Pro con los datos ya cargados y trae de vuelta el
    // N° de orden / clave, que es lo que el rastreo necesita después.
    const handleGenerarGuia = async () => {
        if (generandoGuia) return;
        setGenerandoGuia(true);
        try {
            // Se guarda primero para que el backend arme la guía con lo que se ve en pantalla.
            await apiClient.put(`/envio-despacho/comprobante/${comprobanteId}`, construirPayloadDespacho(envioData));
            const guia = await shalomService.crearGuia(comprobanteId, {
                destinoId: envioData.shalomAgenciaDestinoId || undefined,
                destinoNombre: envioData.agenciaDestino || undefined,
                clave: claveEscrita || undefined,
            });
            setEnvioData((prev: any) => ({
                ...prev,
                nroOrden: guia.nroOrden ?? prev.nroOrden,
                claveOrden: guia.claveOrden ?? prev.claveOrden,
                claveEnvio: guia.claveEnvio ?? prev.claveEnvio,
            }));
            alert(guia.nroOrden ? `Guía ${guia.nroOrden} generada en Shalom` : 'Envío registrado en Shalom', 'success');
            if (guia.claveReemplazada) {
                alert(`Shalom no aceptó la clave ${guia.claveReemplazada.solicitada} (${guia.claveReemplazada.motivo || 'clave rechazada'}). La guía salió con la clave ${guia.claveReemplazada.usada}: esa es la que le mandas al cliente.`, 'warning');
            }
        } catch (error: unknown) {
            alert(mensajeErrorShalom(error, 'No se pudo generar la guía en Shalom'), 'error');
        } finally {
            setGenerandoGuia(false);
        }
    };

    // Genera la guía en Olva con los datos ya cargados y trae de vuelta el N° de
    // guía, que es lo que el rastreo necesita después. Olva no usa clave: el
    // número de guía viaja solo, y se guarda también como código de guía.
    const handleGenerarGuiaOlva = async () => {
        if (generandoGuia) return;
        setGenerandoGuia(true);
        try {
            // Se guarda primero para que el backend arme la guía con lo que se ve en pantalla.
            await apiClient.put(`/envio-despacho/comprobante/${comprobanteId}`, construirPayloadDespacho(envioData));
            const guia = await olvaService.crearGuia(comprobanteId, {
                tipoEnvio: envioData.tipoEnvio === 'DOMICILIO' ? 'DOMICILIO' : 'AGENCIA',
                destinoCodigo: envioData.olvaAgenciaDestinoCodigo || undefined,
                destinoNombre: envioData.agenciaDestino || undefined,
                pesoKg: Number(envioData.pesoKg) > 0 ? Number(envioData.pesoKg) : undefined,
                contenido: envioData.tipoMercaderia || undefined,
                forzar: Boolean(envioData.nroOrden),
            });
            setEnvioData((prev: any) => ({
                ...prev,
                nroOrden: guia.nroOrden ?? prev.nroOrden,
                codigoGuia: guia.codigoGuia ?? prev.codigoGuia,
                olvaAgenciaDestinoCodigo: guia.olvaAgenciaDestinoCodigo ?? prev.olvaAgenciaDestinoCodigo,
            }));
            alert(guia.nroOrden ? `Guía ${guia.nroOrden} generada en Olva` : 'Envío registrado en Olva', 'success');
        } catch (error: unknown) {
            alert(mensajeErrorOlva(error, 'No se pudo generar la guía en Olva'), 'error');
        } finally {
            setGenerandoGuia(false);
        }
    };

    const handleConfirmar = async () => {
        setSaving(true);
        try {
            await apiClient.put(`/envio-despacho/comprobante/${comprobanteId}`, construirPayloadDespacho(envioData));
            alert('Despacho actualizado correctamente', 'success');
            onSuccess();
        } catch (error: unknown) {
            alert(mensajeErrorShalom(error, 'Error al actualizar el despacho'), 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return null;

    return (
        <div className="fixed inset-0 z-[9999] top-[-30px] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50  " onClick={onClose} />
            <div className="relative w-full max-w-2xl bg-white dark:bg-[#111827] rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-5 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                                <Icon icon={esNuevo ? 'solar:delivery-bold-duotone' : 'solar:pen-bold-duotone'} className="text-white text-xl" />
                            </div>
                            <div>
                                <h2 className="text-white font-black text-lg leading-none">{esNuevo ? 'Coordinar envío' : 'Editar despacho'}</h2>
                                <p className="text-indigo-200 text-xs mt-0.5">{esNuevo ? 'Elige el courier, completa el destino y genera la guía' : 'Actualizar datos de envío o agregar número de guía'}</p>
                            </div>
                        </div>
                        <button type="button" onClick={onClose}
                            className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors">
                            <Icon icon="solar:close-circle-bold" className="text-lg" />
                        </button>
                    </div>

                    {/* Courier chips */}
                    <div className="mt-4 flex flex-wrap gap-2">
                        {COURIERS.map(c => (
                            <button key={c.value} type="button" onClick={() => {
                                set('transportista', c.value);
                                // El motorizado entrega en la puerta: reparto propio = a domicilio salvo que el usuario cambie.
                                if (c.value === 'PROPIOS' && envioData.tipoEnvio !== 'DOMICILIO') set('tipoEnvio', 'DOMICILIO');
                                // Shalom COD: lo que Shalom cobra en destino es, por defecto, lo que falta pagar de la venta.
                                if (c.value === 'SHALOM_COD' && !(Number(envioData.montoCOD) > 0) && saldoVenta > 0.009) set('montoCOD', Number(saldoVenta.toFixed(2)));
                                // Tipo de venta por defecto: si la venta tiene saldo, el motorizado cobra; si ya está pagada, solo entrega.
                                if (c.value === 'PROPIOS' && !envioData.tipoVentaReparto) {
                                    if (saldoVenta > 0.009) { set('tipoVentaReparto', 'CONTRAENTREGA'); if (!envioData.formaPagoCobro || envioData.formaPagoCobro === 'NO_COBRAR') set('formaPagoCobro', 'EFECTIVO'); }
                                    else { set('tipoVentaReparto', 'SOLO_ENTREGA'); set('formaPagoCobro', 'NO_COBRAR'); }
                                }
                            }}
                                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${envioData.transportista === c.value
                                        ? 'bg-white text-indigo-700 shadow-lg shadow-indigo-900/20'
                                        : 'bg-white/15 text-white/80 hover:bg-white/25'
                                    }`}>
                                {c.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Body — scrollable */}
                <div className="overflow-y-auto p-6 space-y-4 flex-1">

                    {selectedCourier && COURIER_HINTS[selectedCourier.value] && (
                        <p className="-mt-2 text-[11px] leading-4 text-slate-500 dark:text-slate-400" data-testid="courier-hint">
                            <b className="text-slate-700 dark:text-slate-200">{selectedCourier.label}:</b> {COURIER_HINTS[selectedCourier.value]}
                        </p>
                    )}

                    {/* Estado de cobro de la venta: decide si hay algo que cobrar en el envío */}
                    {ventaInfo && (
                        <div className={`flex flex-wrap items-center justify-between gap-2 rounded-2xl border px-4 py-2.5 text-xs ${ventaPagada
                            ? 'border-emerald-200 bg-emerald-50/70 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300'
                            : 'border-amber-200 bg-amber-50/70 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300'}`}
                            data-testid="venta-cobro">
                            <span className="flex items-center gap-1.5 font-black">
                                <Icon icon={ventaPagada ? 'solar:check-circle-bold' : 'solar:wallet-money-bold-duotone'} className="text-base" />
                                {ventaInfo.referencia ? `Venta ${ventaInfo.referencia}` : 'Venta'} · {ventaPagada ? 'PAGADA por completo' : `Saldo pendiente ${fmt(ventaInfo.saldo)}`}
                            </span>
                            <span className="font-semibold opacity-80">Total {fmt(ventaInfo.total)} · Pagado {fmt(ventaInfo.pagado)}</span>
                        </div>
                    )}

                    {/* SECCIÓN 1: Origen del despacho */}
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                            <Icon icon="solar:shop-bold-duotone" className="text-indigo-400" />
                            Origen del despacho
                        </p>
                        <Field label="Establecimiento">
                            <EstablecimientoCombobox
                                value={envioData.establecimiento}
                                onChange={v => set('establecimiento', v)}
                            />
                        </Field>
                    </div>

                    {/* SECCIÓN SHALOM — visible solo con Shalom PRO o COD */}
                    {esShalom && (
                        <div className="rounded-2xl border border-red-200 dark:border-red-900/50">
                            <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-500">
                                <div className="flex items-center gap-2">
                                    <Icon icon="solar:box-bold-duotone" className="text-white text-base" />
                                    <span className="text-white text-xs font-black tracking-wide">Datos de envío Shalom</span>
                                </div>
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                                    envioData.transportista === 'SHALOM_COD'
                                        ? 'bg-amber-100 text-amber-700'
                                        : 'bg-white/20 text-white'
                                }`}>
                                    {envioData.transportista === 'SHALOM_COD' ? 'COD · Saldo por cobrar (control interno)' : 'PRO · Guía en tu cuenta Shalom'}
                                </span>
                            </div>
                            <div className="p-4 bg-red-50/30 dark:bg-red-950/10 space-y-3">
                                {esCOD && ventaPagada && (
                                    <p className="flex items-start gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-[11px] leading-4 font-semibold text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300" data-testid="aviso-cod-pagada">
                                        <Icon icon="solar:danger-triangle-bold" className="mt-0.5 shrink-0" />
                                        <span>Esta venta ya está pagada: no queda saldo por cobrar, así que COD no aporta nada. Elige <b>Shalom PRO</b>.</span>
                                    </p>
                                )}
                                {/* Credenciales */}
                                <div className="grid grid-cols-2 gap-3">
                                    <Field label="Clave de retiro (se la mandas al cliente)">
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={4}
                                            value={envioData.claveEnvio}
                                            onChange={e => set('claveEnvio', e.target.value.replace(/\D/g, '').slice(0, 4))}
                                            placeholder="4 dígitos"
                                            autoComplete="off"
                                            className={`${inp} ${claveEsDeAyer || !claveFormatoOk ? 'border-amber-400 focus:border-amber-500' : ''}`}
                                            data-testid="clave-retiro"
                                        />
                                    </Field>
                                    <Field label="Código de orden Shalom (rastreo)">
                                        <input
                                            type="text"
                                            value={envioData.claveOrden}
                                            onChange={e => set('claveOrden', e.target.value)}
                                            placeholder="Lo asigna Shalom al crear la guía"
                                            autoComplete="off"
                                            readOnly={Boolean(envioData.nroOrden)}
                                            className={`${inp} ${envioData.nroOrden ? 'bg-slate-50 text-slate-500 dark:bg-slate-900/60' : ''}`}
                                        />
                                    </Field>
                                </div>
                                {claveInfo && !envioData.nroOrden && (
                                    <p className="-mt-1 text-[11px] leading-4 text-slate-500 dark:text-slate-400" data-testid="clave-ayuda">
                                        {claveEsDeAyer
                                            ? <span className="font-semibold text-amber-700 dark:text-amber-400">La clave {claveEscrita} fue la de ayer: Shalom no permite repetirla hoy.{claveAlternativa ? ` Usa ${claveAlternativa}.` : ''}</span>
                                            : !claveFormatoOk
                                                ? <span className="font-semibold text-amber-700 dark:text-amber-400">La clave debe tener 4 dígitos.</span>
                                                : claveEsAnio
                                                    ? <span className="font-semibold text-amber-700 dark:text-amber-400">Shalom no acepta un año como clave ({claveEscrita}). Usa otra combinación de 4 dígitos.</span>
                                                    : claveManual
                                                        ? <>Usarás <b>{claveEscrita}</b> en esta guía; desde ahora será la clave del día para las siguientes.</>
                                                : claveInfo.origen === 'HOY'
                                                    ? <>Es la clave que ya usaste hoy: todas las guías del día salen con la misma.</>
                                                    : claveInfo.origen === 'CONFIGURADA'
                                                        ? <>Clave de hoy según tu configuración ({claveInfo.configuradas.join(' / ')}); mañana se alterna sola.</>
                                                        : <>Clave generada al azar. Puedes escribir la tuya; en Perfil → Shalom Pro puedes fijar tus claves para no volver a pensar en esto.</>}
                                    </p>
                                )}
                                {/* N° Orden + Tipo paquetería */}
                                <div className="grid grid-cols-2 gap-3">
                                    <Field label="N° de orden Shalom (rastreo)">
                                        <input type="text" value={envioData.nroOrden}
                                            onChange={e => set('nroOrden', e.target.value)}
                                            placeholder="Ej: 78560415" className={inp} />
                                    </Field>
                                    <Field label="Tipo de paquetería">
                                        <input type="text" value={envioData.tipoMercaderia}
                                            onChange={e => set('tipoMercaderia', e.target.value)}
                                            placeholder="Ej: Caja, Sobre, Frágil..." className={inp} />
                                    </Field>
                                </div>
                                {/* Producto de Shalom: el catálogo es POR CUENTA, se lee del propio Shalom. */}
                                <div className="grid grid-cols-1 gap-3">
                                    <Field label="Tamaño del paquete (define el flete)">
                                        <ShalomProductoSelect
                                            value={envioData.shalomTipoProducto}
                                            onChange={v => set('shalomTipoProducto', v)}
                                            destinoId={envioData.shalomAgenciaDestinoId || null}
                                            onTarifa={setTarifaShalom}
                                        />
                                    </Field>
                                </div>
                                {/* Fecha + monto COD */}
                                <div className={`grid gap-3 ${envioData.transportista === 'SHALOM_COD' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                    <Calendar
                                        text="Fecha estimada de despacho"
                                        name="fechaEstimada"
                                        value={envioData.fechaEstimada ? moment(envioData.fechaEstimada).format('DD/MM/YYYY') : ''}
                                        onChange={(date) => {
                                            if (!date) { set('fechaEstimada', ''); return; }
                                            const parsed = moment(date, 'DD/MM/YYYY');
                                            set('fechaEstimada', parsed.isValid() ? parsed.format('YYYY-MM-DD') : '');
                                        }}
                                    />
                                    {envioData.transportista === 'SHALOM_COD' && (
                                        <Field label={ventaPagada ? 'Saldo por cobrar S/ (no hay)' : `Saldo por cobrar al cliente S/ (saldo ${fmt(ventaInfo?.saldo ?? 0)})`}>
                                            <div className="relative">
                                                <span className="absolute inset-y-0 left-3 flex items-center text-xs font-bold text-slate-400 pointer-events-none">S/</span>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    step={0.01}
                                                    value={envioData.montoCOD || ''}
                                                    onChange={e => set('montoCOD', Number(e.target.value) || 0)}
                                                    placeholder="0.00"
                                                    className={`${inp} pl-9`}
                                                />
                                            </div>
                                        </Field>
                                    )}
                                </div>

                                {/* Generar la guía en Shalom Pro (plan Corporativo con cuenta conectada) */}
                                {shalomPro?.habilitadoPorPlan && (
                                    shalomPro.conectada ? (
                                        <div className="flex flex-col gap-2 rounded-xl border border-red-200 bg-white p-3 dark:border-red-900/40 dark:bg-slate-900/40">
                                            <button
                                                type="button"
                                                onClick={handleGenerarGuia}
                                                disabled={generandoGuia || !envioData.agenciaDestino || faltanDestinatario.length > 0 || claveEsDeAyer || !claveFormatoOk || claveEsAnio}
                                                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-500 px-4 text-sm font-black text-white shadow-lg shadow-red-500/20 transition-opacity hover:opacity-90 disabled:opacity-50"
                                            >
                                                <Icon icon={generandoGuia ? 'eos-icons:loading' : 'solar:add-square-bold'} className="text-lg" />
                                                {envioData.nroOrden ? 'Regenerar guía en Shalom' : 'Generar guía en Shalom'}
                                            </button>
                                            <p className="text-[11px] leading-4 text-slate-500 dark:text-slate-400">
                                                Registra el envío en tu cuenta Shalom Pro y completa solo el N° de orden y la clave.
                                                {!envioData.agenciaDestino && ' Elige primero la agencia de destino.'}
                                            </p>
                                            {faltanDestinatario.length > 0 && (
                                                <p className="flex items-start gap-1.5 text-[11px] leading-4 font-semibold text-amber-700 dark:text-amber-400">
                                                    <Icon icon="solar:danger-triangle-bold" className="mt-0.5 shrink-0" />
                                                    Para generar la guía falta {faltanDestinatario.join(', ')}.
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="flex items-start gap-2 rounded-xl bg-white p-3 text-[11px] leading-4 text-slate-500 dark:bg-slate-900/40 dark:text-slate-400">
                                            <Icon icon="solar:info-circle-bold" className="mt-0.5 shrink-0 text-red-400" />
                                            Conecta tu cuenta Shalom Pro en Perfil → Configuración para generar las guías desde aquí.
                                        </p>
                                    )
                                )}
                            </div>
                        </div>
                    )}

                    {/* SECCIÓN OLVA — visible solo con Olva Courier */}
                    {esOlva && (
                        <div className="rounded-2xl border border-amber-200 dark:border-amber-900/50">
                            <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400">
                                <div className="flex items-center gap-2">
                                    <Icon icon="solar:box-bold-duotone" className="text-white text-base" />
                                    <span className="text-white text-xs font-black tracking-wide">Datos de envío Olva</span>
                                </div>
                                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/25 text-white">
                                    {envioData.tipoEnvio === 'DOMICILIO' ? 'A domicilio' : 'Para agencia'}
                                </span>
                            </div>

                            <div className="p-4 bg-amber-50/30 dark:bg-amber-950/10 space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <Field label="N° de guía Olva">
                                        <input
                                            type="text"
                                            value={envioData.nroOrden}
                                            onChange={e => set('nroOrden', e.target.value)}
                                            placeholder="Ej: 2071856-26"
                                            className={inp}
                                        />
                                    </Field>
                                    <Field label="Peso del paquete (kg)">
                                        <input
                                            type="number"
                                            min={0.1}
                                            step={0.1}
                                            value={envioData.pesoKg || ''}
                                            onChange={e => set('pesoKg', Number(e.target.value) || 0)}
                                            placeholder="Ej: 2.5"
                                            className={inp}
                                        />
                                    </Field>
                                </div>

                                {/* Generar la guía en Olva (plan Corporativo) */}
                                {olva?.habilitadoPorPlan ? (
                                    olva.apiConfigurada && olva.agenciaOrigenCodigo ? (
                                        <div className="flex flex-col gap-2 rounded-xl border border-amber-200 bg-white p-3 dark:border-amber-900/40 dark:bg-slate-900/40">
                                            <button
                                                type="button"
                                                onClick={handleGenerarGuiaOlva}
                                                disabled={generandoGuia || !envioData.agenciaDestino}
                                                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 text-sm font-black text-white shadow-lg shadow-amber-500/20 transition-opacity hover:opacity-90 disabled:opacity-50"
                                            >
                                                <Icon icon={generandoGuia ? 'eos-icons:loading' : 'solar:add-square-bold'} className="text-lg" />
                                                {envioData.nroOrden ? 'Regenerar guía en Olva' : 'Generar guía en Olva'}
                                            </button>
                                            <p className="text-[11px] leading-4 text-slate-500 dark:text-slate-400">
                                                Registra el envío en Olva desde {olva.agenciaOrigenNombre ?? 'tu agencia de origen'} y completa solo el N° de guía.
                                                {!envioData.agenciaDestino && (envioData.tipoEnvio === 'DOMICILIO' ? ' Ingresa primero la dirección de entrega.' : ' Elige primero la agencia de destino.')}
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="flex items-start gap-2 rounded-xl bg-white p-3 text-[11px] leading-4 text-slate-500 dark:bg-slate-900/40 dark:text-slate-400">
                                            <Icon icon="solar:info-circle-bold" className="mt-0.5 shrink-0 text-amber-400" />
                                            {olva.apiConfigurada
                                                ? 'Configura tu agencia Olva de origen en Perfil → Configuración para generar las guías desde aquí.'
                                                : 'La API de Olva no está configurada. Contacta al administrador.'}
                                        </p>
                                    )
                                ) : (
                                    <p className="flex items-start gap-2 rounded-xl bg-white p-3 text-[11px] leading-4 text-slate-500 dark:bg-slate-900/40 dark:text-slate-400">
                                        <Icon icon="solar:info-circle-bold" className="mt-0.5 shrink-0 text-amber-400" />
                                        Generar guías en Olva está disponible en el plan Corporativo. El rastreo funciona igual con el N° de guía.
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* SECCIÓN 2: Tipo envío + Agencia destino (Shalom/Olva/otros; el reparto propio la lleva en su propia sección) */}
                    {!esPropio && (
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                            <Icon icon="solar:map-point-bold-duotone" className="text-indigo-400" />
                            Datos de entrega
                        </p>
                       {!esPropio && (<div className="mt-4 mb-4">
                       <Field label="Agencia de destino / Dirección">
                            {esShalom && envioData.tipoEnvio === 'AGENCIA' ? (
                                <ShalomAgenciaSelect
                                    value={envioData.agenciaDestino}
                                    onChange={v => setEnvioData((prev: any) => ({ ...prev, agenciaDestino: v, shalomAgenciaDestinoId: '' }))}
                                    onSelectAgencia={a => setEnvioData((prev: any) => ({ ...prev, shalomAgenciaDestinoId: a.terId }))}
                                    placeholder="Buscar agencia Shalom por nombre, provincia o departamento..."
                                />
                            ) : esOlva && envioData.tipoEnvio === 'AGENCIA' ? (
                                <OlvaAgenciaSelect
                                    value={envioData.agenciaDestino}
                                    onChange={v => setEnvioData((prev: any) => ({ ...prev, agenciaDestino: v, olvaAgenciaDestinoCodigo: '' }))}
                                    onSelectAgencia={a => setEnvioData((prev: any) => ({ ...prev, olvaAgenciaDestinoCodigo: a.codigo }))}
                                    placeholder="Buscar agencia Olva por nombre, distrito o departamento..."
                                />
                            ) : (
                                <input type="text" value={envioData.agenciaDestino}
                                    onChange={e => set('agenciaDestino', e.target.value)}
                                    placeholder={envioData.tipoEnvio === 'AGENCIA' ? 'Ej: Olva Cusco Centro' : 'Dirección de entrega'}
                                    className={inp} />
                            )}
                        </Field>
                       </div>)}
                        <div className="grid grid-cols-2 gap-3">

                            <Field label="Tipo de envío">
                                <div className="flex gap-2 w-full">
                                    {[
                                        { value: 'AGENCIA', label: 'Para agencia', icon: 'solar:buildings-2-bold-duotone' },
                                        { value: 'DOMICILIO', label: 'A domicilio', icon: 'solar:home-2-bold-duotone' },
                                    ].map(t => (
                                        <button key={t.value} type="button" onClick={() => set('tipoEnvio', t.value)}
                                            className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl border-2 text-xs font-bold transition-all ${envioData.tipoEnvio === t.value
                                                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                                                    : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'
                                                }`}>
                                            <Icon icon={t.icon} className="text-lg" />
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            </Field>

                        </div>
                    </div>
                    )}

                    {/* DESTINATARIO: Shalom/Olva exigen DNI + nombre; los clientes "WSP 9…" no lo tienen */}
                    {(esShalom || esOlva) && (
                        <div className={`rounded-2xl border p-4 space-y-3 ${clienteSinDni && !dniOk ? 'border-amber-300 bg-amber-50/60 dark:border-amber-900/50 dark:bg-amber-950/20' : 'border-slate-200 bg-slate-50/60 dark:border-slate-700 dark:bg-slate-900/30'}`}>
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Destinatario (para la guía)</p>
                                {clienteFicha && (
                                    <span className="text-[11px] text-slate-400 truncate">Cliente: {clienteFicha.nombre || '—'}{clienteFicha.nroDoc ? ` · ${clienteFicha.nroDoc}` : ''}</span>
                                )}
                            </div>
                            {clienteSinDni && !dniOk && (
                                <p className="flex items-start gap-1.5 text-xs leading-5 text-amber-700 dark:text-amber-400">
                                    <Icon icon="solar:info-circle-bold" className="mt-0.5 shrink-0" />
                                    Este cliente se registró solo con WhatsApp. Ingresa su DNI para poder generar la guía; el nombre se completa desde RENIEC.
                                </p>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-3">
                                <Field label="DNI">
                                    <div className="relative">
                                        <input type="text" inputMode="numeric" maxLength={8} value={envioData.dniDestinatario}
                                            onChange={e => {
                                                const v = e.target.value.replace(/\D/g, '').slice(0, 8);
                                                set('dniDestinatario', v);
                                                if (v.length === 8) void buscarDni(v);
                                            }}
                                            placeholder="8 dígitos" className={inp} />
                                        {buscandoDni && <Icon icon="eos-icons:loading" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />}
                                    </div>
                                </Field>
                                <Field label="Nombres y apellidos">
                                    <input type="text" value={envioData.nombreDestinatario}
                                        onChange={e => set('nombreDestinatario', e.target.value)}
                                        placeholder="APELLIDOS, NOMBRES (se llena con RENIEC)" className={inp} />
                                </Field>
                            </div>
                            {clienteSinDni && (
                                <label className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                                    <input type="checkbox" className="mt-0.5" checked={!!envioData.actualizarFichaCliente}
                                        onChange={e => set('actualizarFichaCliente', e.target.checked)} />
                                    <span>Actualizar también la ficha del cliente con este DNI y nombre (deja de ser "{clienteFicha?.nombre || 'WSP'}" para la próxima venta y sus comprobantes).</span>
                                </label>
                            )}
                        </div>
                    )}

                    {/* SECCIÓN REPARTO PROPIO — lo que pide el motorizado / courier de última milla */}
                    {esPropio && (
                        <div className="rounded-2xl border border-fuchsia-200 bg-fuchsia-50/50 p-4 space-y-3 dark:border-fuchsia-900/40 dark:bg-fuchsia-950/10" data-testid="seccion-reparto-propio">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                                <p className="text-[11px] font-black uppercase tracking-widest text-fuchsia-700 dark:text-fuchsia-300 flex items-center gap-1.5">
                                    <Icon icon="solar:scooter-bold-duotone" className="text-base" />
                                    Reparto propio / motorizado
                                </p>
                                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                    Sale de: <span className="text-slate-800 dark:text-white">{envioData.sedeOrigenNombre || envioData.establecimiento || 'sede del comprobante'}</span>
                                </span>
                            </div>

                            <Field label="Tipo de venta">
                                <div className="flex flex-wrap gap-2">
                                    {TIPOS_VENTA_REPARTO.map(t => (
                                        <button key={t.value} type="button" title={t.hint}
                                            onClick={() => {
                                                set('tipoVentaReparto', t.value);
                                                const cobra = t.value === 'CONTRAENTREGA' || t.value === 'CONTRAENTREGA_CAMBIO';
                                                if (!cobra) set('formaPagoCobro', 'NO_COBRAR');
                                                else if (envioData.formaPagoCobro === 'NO_COBRAR' || !envioData.formaPagoCobro) set('formaPagoCobro', 'EFECTIVO');
                                            }}
                                            className={`px-3 py-1.5 rounded-xl border-2 text-xs font-bold transition-all ${envioData.tipoVentaReparto === t.value
                                                ? 'border-fuchsia-500 bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/40 dark:text-fuchsia-200'
                                                : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-fuchsia-300'}`}>
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            </Field>

                            <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px] gap-3">
                                <Field label="Dirección de entrega">
                                    <input type="text" value={envioData.agenciaDestino}
                                        onChange={e => set('agenciaDestino', e.target.value)}
                                        placeholder="Calle, número, referencia (ej: Av. Perú 123, 2do piso, puerta negra)"
                                        className={inp} />
                                </Field>
                                <Field label="Tipo de envío">
                                    <select value={envioData.tipoEnvio} onChange={e => set('tipoEnvio', e.target.value)} className={inp}>
                                        <option value="DOMICILIO">A domicilio</option>
                                        <option value="AGENCIA">Para agencia</option>
                                    </select>
                                </Field>
                            </div>

                            <Field label="Nombre de quien recibe">
                                <input type="text" value={envioData.nombreDestinatario}
                                    onChange={e => set('nombreDestinatario', e.target.value)}
                                    placeholder={clienteSinDni && /^WSP\s/i.test(clienteFicha?.nombre || '') ? 'El cliente se registró solo con WhatsApp: escribe el nombre para el motorizado' : /^CLIENTES?\s+VARIOS$/i.test(clienteFicha?.nombre || '') ? 'Venta a "Clientes varios": escribe el nombre de quien recibe' : 'Nombre y apellido de quien recibe el pedido'}
                                    className={inp} />
                            </Field>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Field label="Distrito de entrega">
                                    <div className="relative">
                                        <input type="text"
                                            value={distritoOpen ? distritoQuery : (envioData.distrito || distritoQuery)}
                                            onFocus={() => { setDistritoQuery(envioData.distrito || ''); setDistritoOpen(true); }}
                                            onChange={e => { setDistritoQuery(e.target.value); setDistritoOpen(true); if (!e.target.value) { set('distrito', ''); set('distritoUbigeo', ''); } }}
                                            onBlur={() => setTimeout(() => setDistritoOpen(false), 150)}
                                            placeholder="Escribe el distrito (ej: Ate, Comas, Ancón)"
                                            className={inp} />
                                        {distritoOpen && distritosFiltrados.length > 0 && (
                                            <ul className="absolute z-20 mt-1 w-full max-h-52 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
                                                {distritosFiltrados.map((u: any) => (
                                                    <li key={u.codigo}>
                                                        <button type="button"
                                                            onMouseDown={e => e.preventDefault()}
                                                            onClick={() => { set('distrito', u.distrito); set('distritoUbigeo', u.codigo); setDistritoQuery(u.distrito); setDistritoOpen(false); }}
                                                            className="w-full px-3 py-2 text-left text-sm hover:bg-fuchsia-50 dark:hover:bg-slate-700">
                                                            <span className="font-semibold text-slate-800 dark:text-white">{u.distrito}</span>
                                                            <span className="ml-2 text-[11px] text-slate-400">{u.provincia?.trim()} · {u.departamento}</span>
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </Field>
                                <Field label="Coordenadas (opcional)">
                                    <input type="text" value={envioData.coordenadas}
                                        onChange={e => set('coordenadas', e.target.value)}
                                        placeholder="-12.0464, -77.0428 (pegar de Google Maps)" className={inp} />
                                </Field>
                            </div>

                            <div className={`grid gap-3 ${cobraEnDestino ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                                {cobraEnDestino && (
                                    <Field label="Monto a cobrar al entregar (S/)">
                                        <input type="number" min={0} step={0.01} value={envioData.montoCOD || ''}
                                            onChange={e => set('montoCOD', Number(e.target.value) || 0)}
                                            placeholder="0.00 = lo que falta por pagar del comprobante" className={inp} />
                                    </Field>
                                )}
                                <Field label={cobraEnDestino ? 'El cliente paga con' : 'Cobro en destino'}>
                                    <select value={envioData.formaPagoCobro || (cobraEnDestino ? '' : 'NO_COBRAR')}
                                        onChange={e => set('formaPagoCobro', e.target.value)}
                                        disabled={!cobraEnDestino}
                                        className={inp + (cobraEnDestino ? '' : ' opacity-60')}>
                                        <option value="">Seleccionar</option>
                                        {FORMAS_PAGO_COBRO.filter(f => cobraEnDestino ? f.value !== 'NO_COBRAR' : f.value === 'NO_COBRAR').map(f => (
                                            <option key={f.value} value={f.value}>{f.label}</option>
                                        ))}
                                    </select>
                                </Field>
                            </div>

                            <label className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                                <input type="checkbox" className="mt-0.5" checked={!!envioData.revisarProducto}
                                    onChange={e => set('revisarProducto', e.target.checked)} />
                                <span>El cliente puede revisar el producto antes de pagar.</span>
                            </label>
                            <p className="text-[11px] leading-4 text-slate-500 dark:text-slate-400">
                                Estos datos salen en <b>Exportar reparto</b> del Panel de Despacho con el formato de carga masiva del motorizado (nombre, teléfono, distrito, dirección, fecha, detalle, monto a cobrar, forma de pago).
                            </p>
                        </div>
                    )}

                    {/* SECCIÓN 3: Celular + Paquetes + Turno (+ Fecha y N° Orden para no-Shalom) */}
                    <div className="grid grid-cols-3 gap-3">
                        <Field label="Celular destinatario">
                            <input type="text" value={envioData.celularDest}
                                onChange={e => set('celularDest', e.target.value)}
                                placeholder="9XXXXXXXX" className={inp} />
                        </Field>
                        <Field label="N° Paquetes">
                            <input type="number" min={1} value={envioData.nroPaquetes}
                                onChange={e => set('nroPaquetes', Number(e.target.value))} className={inp} />
                        </Field>
                        <Field label="Turno">
                            <Select
                                label=""
                                name="turnoEnvio"
                                error=""
                                value={TURNOS.find(t => t.value === envioData.turnoEnvio)?.label ?? ''}
                                options={TURNOS.map(t => ({ id: t.value, value: t.label }))}
                                onChange={(id) => set('turnoEnvio', String(id))}
                            />
                        </Field>

                        {/* Fecha y N° Orden solo para couriers no-Shalom (para Shalom van en su propio card) */}
                        {!esShalom && (<>
                            <Calendar
                                text="Fecha"
                                name="fechaEstimada"
                                value={envioData.fechaEstimada ? moment(envioData.fechaEstimada).format('DD/MM/YYYY') : ''}
                                onChange={(date) => {
                                    if (!date) { set('fechaEstimada', ''); return; }
                                    const parsed = moment(date, 'DD/MM/YYYY');
                                    set('fechaEstimada', parsed.isValid() ? parsed.format('YYYY-MM-DD') : '');
                                }}
                            />
                            <Field label="N° Orden courier">
                                <input type="text" value={envioData.nroOrden}
                                    onChange={e => set('nroOrden', e.target.value)}
                                    placeholder="Número de orden" className={inp} />
                            </Field>
                        </>)}
                    </div>

                    {/* SECCIÓN 4: Personal */}
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                            <Icon icon="solar:users-group-rounded-bold-duotone" className="text-indigo-400" />
                            Personal asignado
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            {esPropio && (
                                <Field label="Repartidor">
                                    {repartidores.length > 0 ? (
                                        <select
                                            value={envioData.repartidorId}
                                            onChange={e => {
                                                set('repartidorId', e.target.value);
                                                const selected = repartidores.find(r => String(r.id) === e.target.value);
                                                set('repartidor', selected?.nombre ?? '');
                                            }}
                                            className={inp}
                                        >
                                            <option value="">Seleccionar repartidor</option>
                                            {repartidores.map(r => (
                                                <option key={r.id} value={r.id}>
                                                    {r.nombre}{r.celular ? ` · ${r.celular}` : ''}{r.sede?.nombre ? ` · ${r.sede.nombre}` : ''}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input type="text" value={envioData.repartidor}
                                            onChange={e => set('repartidor', e.target.value)}
                                            placeholder="Nombre del repartidor" className={inp} />
                                    )}
                                </Field>
                            )}
                            <Field label="Empaquetador">
                                <input type="text" value={envioData.empaquetador}
                                    onChange={e => set('empaquetador', e.target.value)}
                                    placeholder="Nombre del empaquetador" className={inp} />
                            </Field>
                        </div>
                    </div>

                    {/* Código de seguimiento genérico: solo cuando no hay courier con N° de orden
                        (Shalom/Olva lo llevan en su propia tarjeta y se copia al guardar). */}
                    {!esShalom && !esOlva && (
                        <Field label="Código de seguimiento (opcional)">
                            <input type="text" value={envioData.codigoGuia}
                                onChange={e => set('codigoGuia', e.target.value)}
                                placeholder="Si el motorizado o courier te da un código de rastreo, anótalo aquí" className={inp} data-testid="codigo-seguimiento" />
                        </Field>
                    )}

                    {/* Observaciones */}
                    <Field label="Observaciones">
                        <input type="text" value={envioData.observaciones}
                            onChange={e => set('observaciones', e.target.value)}
                            placeholder="Instrucciones especiales de embalaje o entrega..." className={inp} />
                    </Field>

                    {/* Monto cobrado al cliente — solo editable en NV (informales) */}
                    {esNV && ventaPagada && !(Number(envioData.costoEnvio) > 0) && (
                        <p className="flex items-center gap-1.5 text-[11px] leading-4 text-emerald-700 dark:text-emerald-400" data-testid="sin-monto-por-pagada">
                            <Icon icon="solar:check-circle-bold" className="shrink-0" />
                            La venta ya está pagada por completo: no hay adelanto ni monto que registrar en este envío.
                        </p>
                    )}
                    {esNV && !(ventaPagada && !(Number(envioData.costoEnvio) > 0)) && (
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                <Icon icon="solar:wallet-money-bold-duotone" className="text-indigo-400" />
                                {esPropio ? 'Adelanto ya pagado antes del envío' : 'Monto cobrado al cliente'}
                            </p>
                            {esPropio && (
                                <p className="-mt-1 mb-2 text-[11px] leading-4 text-slate-500 dark:text-slate-400">Solo lo que el cliente <b>ya pagó</b> (Yape, transferencia…) antes de salir el pedido. Lo que cobra el motorizado en la puerta va arriba, en <b>Monto a cobrar al entregar</b>.</p>
                            )}
                            {!esPropio && !ventaPagada && (
                                <p className="-mt-1 mb-2 text-[11px] leading-4 text-slate-500 dark:text-slate-400">Escribe aquí solo si el cliente <b>ya pagó una parte</b> (Yape, transferencia…) que aún no está registrada en la venta. Si no pagó nada, déjalo en 0: el saldo de {fmt(ventaInfo?.saldo ?? 0)} sigue pendiente.</p>
                            )}
                            <div className={`grid gap-3 ${Number(envioData.costoEnvio) > 0 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                <Field label={esPropio ? 'Adelanto ya pagado (S/)' : 'Monto cobrado / adelanto (S/)'}>
                                    <input
                                        type="number"
                                        min={0}
                                        step={0.01}
                                        value={envioData.costoEnvio ?? 0}
                                        onChange={e => set('costoEnvio', Number(e.target.value) || 0)}
                                        placeholder={esPropio ? '0 si el cliente paga todo al motorizado' : '0.00 — dejar en 0 si no aplica'}
                                        className={inp}
                                    />
                                </Field>
                                {Number(envioData.costoEnvio) > 0 && (
                                    <Field label="Aplicar como">
                                        <div className="flex gap-2 w-full">
                                            {[
                                                { value: 'ADELANTO', label: 'Adelanto' },
                                                { value: 'ITEM_ENVIO', label: 'Item envío' },
                                                { value: 'NEGOCIO', label: 'Negocio absorbe' },
                                            ].map(opt => (
                                                <button key={opt.value} type="button"
                                                    onClick={() => {
                                                        set('aplicacionMontoCliente', opt.value);
                                                        set('pagarFlete', opt.value === 'NEGOCIO' ? 'NEGOCIO' : 'CLIENTE');
                                                    }}
                                                    className={`flex-1 py-2.5 rounded-xl border-2 text-xs font-bold transition-all ${(envioData.aplicacionMontoCliente ?? 'ADELANTO') === opt.value
                                                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                                                        : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300 dark:hover:border-slate-600'
                                                    }`}>
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </Field>
                                )}
                            </div>
                            {Number(envioData.costoEnvio) > 0 && (envioData.aplicacionMontoCliente ?? 'ADELANTO') === 'ADELANTO' && (
                                <p className="mt-2 text-[11px] font-semibold text-blue-600 dark:text-blue-300 flex items-center gap-1">
                                    <Icon icon="solar:card-recive-bold-duotone" className="text-base" />
                                    Se registrará como adelanto y el panel mostrará el saldo pendiente.
                                </p>
                            )}
                            {Number(envioData.costoEnvio) > 0 && envioData.aplicacionMontoCliente === 'ITEM_ENVIO' && (
                                <p className="mt-2 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                    <Icon icon="solar:bill-check-bold-duotone" className="text-base" />
                                    Este monto queda como cobro de envío, no como pago adelantado.
                                </p>
                            )}
                        </div>
                    )}

                    {/* Resumen */}
                    {(selectedCourier || envioData.agenciaDestino) && (
                        <div className="flex items-center gap-3 px-4 py-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800/40">
                            <Icon icon="solar:info-circle-bold-duotone" className="text-indigo-500 text-lg flex-shrink-0" />
                            <p className="text-xs text-indigo-700 dark:text-indigo-300 font-semibold">
                                {selectedCourier?.label ?? '—'}
                                {' · '}{envioData.tipoEnvio === 'AGENCIA' ? 'Para agencia' : 'A domicilio'}
                                {envioData.agenciaDestino ? ` · ${envioData.agenciaDestino}` : ''}
                                {envioData.nroPaquetes > 1 ? ` · ${envioData.nroPaquetes} paquetes` : ''}
                                {envioData.establecimiento ? ` · ${envioData.establecimiento}` : ''}
                                {(() => {
                                    if (!esShalom) return '';
                                    const id = Number(envioData.shalomTipoProducto) || null;
                                    const t = tarifaShalom?.tamanos.find(x => id ? x.id === id : false);
                                    const precio = t?.precio ?? (envioData.shalomFleteCotizado != null ? Number(envioData.shalomFleteCotizado) : null);
                                    return precio != null ? ` · flete S/ ${Number(precio).toFixed(2)}` : '';
                                })()}
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 pb-6 pt-3 flex gap-3 flex-shrink-0 border-t border-slate-100 dark:border-slate-800">
                    <button type="button" onClick={onClose} disabled={saving}
                        className="flex-1 h-11 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        Cancelar
                    </button>
                    <button type="button" onClick={handleConfirmar} disabled={saving}
                        className="flex-[2] h-11 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-black text-sm shadow-lg shadow-indigo-500/25 hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                        {saving ? (
                            <Icon icon="eos-icons:loading" className="text-lg" />
                        ) : (
                            <Icon icon="solar:check-circle-bold" className="text-lg" />
                        )}
                        {esNuevo ? 'Guardar despacho' : 'Guardar cambios'}
                    </button>
                </div>
            </div>
        </div>
    );
}
