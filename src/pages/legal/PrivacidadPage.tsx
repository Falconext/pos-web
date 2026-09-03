import { BRAND } from '@/lib/branding';

/**
 * Política de Privacidad pública (sin autenticación). Requerida por Meta para
 * publicar la app de WhatsApp y para el App Review. Ruta: /privacidad.
 */
export default function PrivacidadPage() {
    const marca = BRAND.name;
    const email = BRAND.email;
    const H = ({ children }: { children: React.ReactNode }) => (
        <h2 className="mt-8 mb-2 text-lg font-bold text-gray-900">{children}</h2>
    );
    const P = ({ children }: { children: React.ReactNode }) => (
        <p className="mb-3 text-sm leading-relaxed text-gray-700">{children}</p>
    );

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4">
            <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100 sm:p-10">
                <h1 className="text-2xl font-black text-gray-900">Política de Privacidad</h1>
                <p className="mt-1 text-xs text-gray-400">Última actualización: septiembre de 2026 · {marca}</p>

                <P>
                    En {marca} (“nosotros”) respetamos tu privacidad. Esta política explica qué datos
                    recopilamos, cómo los usamos y qué derechos tienes cuando utilizas nuestra
                    plataforma de gestión de ventas, facturación electrónica y atención por WhatsApp.
                </P>

                <H>1. Datos que recopilamos</H>
                <P>
                    • <b>Datos de la cuenta y del negocio</b>: nombre, RUC/DNI, correo, teléfono, sede
                    y datos de facturación necesarios para operar el servicio.<br />
                    • <b>Datos de clientes de tu negocio</b>: nombre, documento y contacto que registras
                    para emitir comprobantes o gestionar ventas.<br />
                    • <b>Mensajes de WhatsApp</b>: cuando conectas tu número de WhatsApp Business,
                    procesamos los mensajes que tus clientes te envían y las respuestas generadas,
                    únicamente para brindar el servicio de atención y calificación de prospectos.
                </P>

                <H>2. Uso de WhatsApp Business y datos de Meta</H>
                <P>
                    Nuestra integración con la <b>API de WhatsApp Business (Meta)</b> se usa
                    exclusivamente para: recibir los mensajes entrantes de tus clientes, responderlos
                    de forma automática o asistida, y enviar notificaciones relacionadas con sus pedidos
                    y despachos. Solo accedemos a la cuenta de WhatsApp Business que tú conectas de forma
                    explícita. <b>No vendemos ni compartimos</b> el contenido de los mensajes con terceros,
                    ni lo usamos para publicidad.
                </P>

                <H>3. Cómo usamos los datos</H>
                <P>
                    Usamos los datos para prestar y mejorar el servicio, emitir comprobantes ante SUNAT,
                    procesar pagos, brindar soporte y cumplir obligaciones legales. No usamos los datos
                    para fines distintos a los aquí descritos sin tu consentimiento.
                </P>

                <H>4. Con quién compartimos datos</H>
                <P>
                    Compartimos datos solo con proveedores necesarios para operar (por ejemplo,
                    proveedores de infraestructura en la nube, Meta/WhatsApp para el envío de mensajes,
                    y SUNAT para la facturación electrónica), siempre bajo obligaciones de
                    confidencialidad y solo en la medida requerida.
                </P>

                <H>5. Conservación de datos</H>
                <P>
                    Conservamos los datos mientras tu cuenta esté activa y por el tiempo que exijan las
                    normas tributarias y contables. Los mensajes de WhatsApp se conservan solo el tiempo
                    necesario para prestar el servicio y luego se eliminan o anonimizan.
                </P>

                <H>6. Seguridad</H>
                <P>
                    Aplicamos medidas técnicas y organizativas razonables para proteger tu información
                    (cifrado en tránsito, control de accesos y validación de firmas en las
                    integraciones). Ningún sistema es 100% infalible, pero trabajamos para mantener tus
                    datos seguros.
                </P>

                <H>7. Tus derechos y eliminación de datos</H>
                <P>
                    Puedes solicitar acceder, corregir o eliminar tus datos personales, así como revocar
                    la conexión de tu WhatsApp en cualquier momento desde la configuración de tu cuenta.
                    Para pedir la eliminación de tus datos, escríbenos a{' '}
                    <a className="font-semibold text-emerald-600 underline" href={`mailto:${email}`}>{email}</a>{' '}
                    y atenderemos tu solicitud conforme a la ley aplicable.
                </P>

                <H>8. Cambios a esta política</H>
                <P>
                    Podemos actualizar esta política cuando sea necesario. Publicaremos la versión vigente
                    en esta misma página con su fecha de actualización.
                </P>

                <H>9. Contacto</H>
                <P>
                    Si tienes preguntas sobre esta política o sobre el tratamiento de tus datos,
                    escríbenos a{' '}
                    <a className="font-semibold text-emerald-600 underline" href={`mailto:${email}`}>{email}</a>.
                </P>
            </div>
        </div>
    );
}
