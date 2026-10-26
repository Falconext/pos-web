import { linkAlChat, rutaAlChat } from '../LeadsModel'

describe('ir al chat del cliente', () => {
  it('con el id abre esa conversación; con el teléfono la busca', () => {
    expect(rutaAlChat({ conversacionId: 81, telefono: '51935099488' })).toBe('/administrador/leads/chats?conv=81')
    expect(rutaAlChat({ telefono: '51935099488' })).toBe('/administrador/leads/chats?tel=51935099488')
  })

  it('los avisos de IA de Ventas llevan al chat (alto riesgo, lead caliente, visita)', () => {
    expect(linkAlChat({ origen: 'ia-ventas-alto-riesgo', telefono: '51935099488' })).toBe(
      '/administrador/leads/chats?tel=51935099488',
    )
    expect(linkAlChat({ origen: 'ia-ventas', conversacionId: 12, telefono: '519' })).toBe(
      '/administrador/leads/chats?conv=12',
    )
  })

  it('otros avisos, o sin a quién llevar, no', () => {
    expect(linkAlChat({ comprobanteId: 5 })).toBeNull()
    expect(linkAlChat({ origen: 'ia-ventas-tope', tope: 100 })).toBeNull()
    expect(linkAlChat(null)).toBeNull()
  })
})
