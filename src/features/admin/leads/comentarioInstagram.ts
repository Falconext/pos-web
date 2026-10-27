/**
 * Cuando alguien comenta una publicación, la IA recibe el comentario envuelto en
 * instrucciones ("[El cliente comentó en una publicación de Instagram: "…".
 * Tu respuesta le llega como UN solo mensaje privado…]"). Eso es para la IA:
 * en la bandeja solo debe verse lo que la persona escribió.
 */
const MARCA = /^\[El cliente comentó en una publicación de Instagram: "([\s\S]*?)"(?:\]|\.\s)/

/** El texto del comentario, o `null` si el mensaje no viene de un comentario. */
export function comentarioDeInstagram(contenido: string): string | null {
  const m = MARCA.exec(contenido)
  return m ? m[1] : null
}
