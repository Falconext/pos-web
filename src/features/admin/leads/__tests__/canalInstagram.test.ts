import { canalDe, contactoVisible, esInstagram, iniciales, nombreVisible } from '../LeadsModel'

describe('Cliente de Instagram en la bandeja', () => {
  it('nunca muestra el id interno ig:<id>', () => {
    expect(esInstagram('ig:178414')).toBe(true)
    expect(contactoVisible('ig:178414')).toBe('Instagram')
    expect(nombreVisible(null, 'ig:178414')).toBe('Cliente de Instagram')
    expect(nombreVisible('@ana.compras', 'ig:178414')).toBe('@ana.compras')
  })

  it('las iniciales no salen del @ ni del id', () => {
    expect(iniciales('@ana.compras', 'ig:178414')).toBe('AN')
    expect(iniciales(null, '51987654321')).toBe('21')
    expect(iniciales(null, 'ig:178414')).toBe('IG')
  })

  it('el ícono es de Instagram o de WhatsApp según el cliente', () => {
    expect(canalDe('ig:1').icono).toBe('mdi:instagram')
    expect(canalDe('51987654321').icono).toBe('mdi:whatsapp')
    expect(contactoVisible('51987654321')).toBe('51987654321')
  })
})
