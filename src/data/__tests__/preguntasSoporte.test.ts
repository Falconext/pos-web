import { PREGUNTAS_SOPORTE, buscarPreguntas } from '../preguntasSoporte'

describe('banco de preguntas de soporte', () => {
  it('encuentra la pregunta como la escribe la gente, sin tildes ni signos', () => {
    expect(buscarPreguntas('como anulo una boleta?')[0].id).toBe('anular-comprobante')
    expect(buscarPreguntas('SUNAT me rechazó la factura')[0].id).toBe('sunat-rechazo')
    expect(buscarPreguntas('mi caja no cuadra')[0].id).toBe('caja-no-cuadra')
    expect(buscarPreguntas('envio por shalom')[0].id).toBe('envio-shalom')
  })

  it('un saludo solo no sugiere nada', () => {
    expect(buscarPreguntas('hola buenas tardes')).toEqual([])
  })

  it('los ids no se repiten', () => {
    const ids = PREGUNTAS_SOPORTE.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
