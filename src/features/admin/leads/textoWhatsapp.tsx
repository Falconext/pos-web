import { Fragment, type ReactNode } from 'react'

/**
 * El texto de un mensaje como lo ve el cliente en WhatsApp: *negrita*,
 * _cursiva_ y ~tachado~. El bot escribe con esas marcas y en el panel se
 * veían los asteriscos sueltos, como si el mensaje estuviera mal (Hierba
 * Sana, 24-10).
 *
 * Mismas reglas que WhatsApp: la marca va pegada al texto por dentro
 * ("*hola*" sí, "* hola *" no) y no en medio de una palabra ("3*4*5" no),
 * y no cruza saltos de línea.
 */
const MARCAS =
  /(?<![\p{L}\p{N}])(\*[^\s*](?:[^*\n]*[^\s*])?\*|_[^\s_](?:[^_\n]*[^\s_])?_|~[^\s~](?:[^~\n]*[^\s~])?~)(?![\p{L}\p{N}])/gu

export function TextoWhatsapp({ texto }: { texto: string }): ReactNode {
  const partes: ReactNode[] = []
  let desde = 0
  for (const m of texto.matchAll(MARCAS)) {
    const i = m.index ?? 0
    if (i > desde) partes.push(texto.slice(desde, i))
    const marca = m[0]
    const dentro = marca.slice(1, -1)
    partes.push(
      marca[0] === '*' ? (
        <strong key={i} className="font-bold">{dentro}</strong>
      ) : marca[0] === '_' ? (
        <em key={i}>{dentro}</em>
      ) : (
        <s key={i}>{dentro}</s>
      ),
    )
    desde = i + marca.length
  }
  if (desde < texto.length) partes.push(texto.slice(desde))
  return <Fragment>{partes}</Fragment>
}
