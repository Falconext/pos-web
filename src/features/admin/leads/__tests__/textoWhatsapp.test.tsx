import { render } from '@testing-library/react'
import { TextoWhatsapp } from '../textoWhatsapp'

const html = (t: string) => render(<p><TextoWhatsapp texto={t} /></p>).container.innerHTML

describe('TextoWhatsapp: el panel muestra el formato como WhatsApp', () => {
  it('la respuesta del bot de Hierba Sana (24-10)', () => {
    const h = html('- *Vitamina E - OASIS ( 100 cápsulas )* o *Natural Medix* a *S/ 30.00* / *S/ 31.00*')
    expect(h).toContain('<strong class="font-bold">Vitamina E - OASIS ( 100 cápsulas )</strong>')
    expect(h).toContain('<strong class="font-bold">S/ 31.00</strong>')
    expect(h).not.toContain('*')
  })

  it('cursiva y tachado', () => {
    expect(html('_gratis_ y ~S/ 70~')).toBe('<p><em>gratis</em> y <s>S/ 70</s></p>')
  })

  it('no toca lo que WhatsApp tampoco toca', () => {
    expect(html('2 * 3 = 6')).toBe('<p>2 * 3 = 6</p>')
    expect(html('* hola *')).toBe('<p>* hola *</p>')
    expect(html('archivo_de_texto.pdf')).toBe('<p>archivo_de_texto.pdf</p>')
    expect(html('Total: *S/ 59.90')).toBe('<p>Total: *S/ 59.90</p>')
  })

  it('no cruza líneas', () => {
    expect(html('*uno\ndos*')).toBe('<p>*uno\ndos*</p>')
  })
})
