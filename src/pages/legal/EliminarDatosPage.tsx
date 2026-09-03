import { BRAND } from '@/lib/branding';

/**
 * Página pública de "Eliminación de datos" (sin autenticación). Meta la exige
 * para el App Review de WhatsApp (Data Deletion Instructions URL). Ruta:
 * /eliminar-datos.
 */
export default function EliminarDatosPage() {
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
                <h1 className="text-2xl font-black text-gray-900">Eliminación de datos</h1>
                <p className="mt-1 text-xs text-gray-400">Última actualización: septiembre de 2026 · {marca}</p>

                <P>
                    En {marca} respetamos tu derecho a eliminar tu información. Esta página explica
                    cómo solicitar la eliminación de tus datos personales y de los datos asociados a
                    tu cuenta de WhatsApp Business conectada a nuestra plataforma.
                </P>

                <H>Qué datos eliminamos</H>
                <P>
                    A tu solicitud eliminamos los datos personales que tratamos por ti: datos de tu
                    cuenta y negocio, contactos de clientes que registraste, y los mensajes de WhatsApp
                    procesados por el asistente (conversaciones y prospectos). Al desconectar tu número,
                    dejamos de acceder a tu cuenta de WhatsApp Business de inmediato.
                </P>

                <H>Cómo solicitar la eliminación</H>
                <P>
                    Tienes dos formas:
                </P>
                <P>
                    <b>1. Desde la app:</b> ingresa a tu cuenta en {marca}, ve a{' '}
                    <b>Perfil → Conectar mi WhatsApp</b> y desconecta tu número. Luego, desde{' '}
                    <b>Configuración</b>, puedes solicitar la eliminación de tu cuenta y sus datos.
                </P>
                <P>
                    <b>2. Por correo:</b> escríbenos a{' '}
                    <a className="font-semibold text-emerald-600 underline" href={`mailto:${email}?subject=Solicitud%20de%20eliminación%20de%20datos`}>{email}</a>{' '}
                    con el asunto <b>“Solicitud de eliminación de datos”</b>, indicando el nombre de tu
                    negocio y el número de WhatsApp conectado. Verificaremos tu identidad y procesaremos
                    la solicitud.
                </P>

                <H>Plazo</H>
                <P>
                    Procesamos las solicitudes de eliminación en un plazo máximo de <b>30 días</b>.
                    Podemos conservar cierta información cuando una ley (por ejemplo, tributaria o
                    contable) nos obligue a hacerlo; en ese caso, la mantenemos solo durante el tiempo
                    exigido y luego la eliminamos.
                </P>

                <H>Contacto</H>
                <P>
                    Para cualquier consulta sobre este proceso, escríbenos a{' '}
                    <a className="font-semibold text-emerald-600 underline" href={`mailto:${email}`}>{email}</a>.
                </P>
            </div>
        </div>
    );
}
