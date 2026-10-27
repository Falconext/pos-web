import { comentarioDeInstagram } from '../comentarioInstagram'

describe('comentarioDeInstagram', () => {
  it('saca el comentario de las instrucciones para la IA', () => {
    const msg =
      '[El cliente comentó en una publicación de Instagram: "Hola cuánto cuesta el plan para mi tienda?". ' +
      'Tu respuesta le llega como UN solo mensaje privado y no podrás mandarle nada más hasta que te conteste: ' +
      'que sea solo texto, breve y cordial. No mandes fotos, catálogos ni enlaces largos todavía.]'
    expect(comentarioDeInstagram(msg)).toBe('Hola cuánto cuesta el plan para mi tienda?')
  })

  it('reconoce la versión corta (cuando ya conversan por DM)', () => {
    expect(comentarioDeInstagram('[El cliente comentó en una publicación de Instagram: "precio?"]')).toBe('precio?')
  })

  it('no toca los mensajes normales', () => {
    expect(comentarioDeInstagram('Hola, ¿tienen talla M?')).toBeNull()
    expect(comentarioDeInstagram('[Nota de voz] hola')).toBeNull()
  })
})
