/**
 * F — QA de render del panel de avisos.
 *
 * Lo que se protege: que el dueño VEA por qué un aviso no salió (un aviso que
 * no salió sin explicación es un reclamo que nadie puede responder), que los
 * comerciales se distingan de los transaccionales, y que "enviar ahora" diga
 * el motivo cuando una regla lo frena en vez de fingir que se mandó.
 */
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

const getMock = jest.fn()
const postMock = jest.fn()
const alertMock = jest.fn()

jest.mock('@/utils/apiClient', () => ({
  __esModule: true,
  default: {
    get: (u: string) => getMock(u),
    post: (u: string, b: unknown) => postMock(u, b),
  },
}))
jest.mock('@/zustand/alert', () => ({
  __esModule: true,
  default: () => ({ alert: alertMock }),
  useAlertStore: () => ({ alert: alertMock }),
}))
jest.mock('@iconify/react', () => ({ Icon: () => null }))

import { DisparadoresPanel } from '../DisparadoresPanel'

const CONFIG = {
  activos: ['RECUPERAR_COTIZACION', 'RECOMPRA'],
  horaDesde: 9,
  horaHasta: 21,
  topeMarketing: 2,
  topeMarketingDias: 30,
}

const disparo = (over: Record<string, unknown> = {}) => ({
  id: 1,
  tipo: 'RECOMPRA',
  telefono: '51925085731',
  referencia: 'producto:12',
  programadoPara: '2026-10-12T14:00:00.000Z',
  estado: 'PROGRAMADO',
  motivo: null,
  plantilla: null,
  textoEnviado: null,
  enviadoEn: null,
  ...over,
})

function montar(listado: Record<string, unknown> = {}) {
  getMock.mockImplementation((u: string) =>
    Promise.resolve({
      data: {
        data: u.includes('/config')
          ? CONFIG
          : { disparos: [], porEstado: [], bajas: 0, ...listado },
      },
    }),
  )
  return render(<DisparadoresPanel />)
}

beforeEach(() => {
  getMock.mockReset()
  postMock.mockReset()
  alertMock.mockReset()
})

describe('qué está encendido', () => {
  it('muestra los 6 avisos, encendidos y apagados', async () => {
    montar()
    await waitFor(() =>
      expect(screen.getByTestId('disparador-RECOMPRA')).toBeInTheDocument(),
    )
    for (const t of [
      'VUELTA_DISPONIBILIDAD',
      'RECUPERAR_COTIZACION',
      'CARRITO_EN_ESPERA',
      'POST_ENTREGA',
      'RECOMPRA',
      'REACTIVACION',
    ]) {
      expect(screen.getByTestId(`disparador-${t}`)).toBeInTheDocument()
    }
    expect(screen.getAllByText('Encendido')).toHaveLength(2)
    expect(screen.getAllByText('Apagado')).toHaveLength(4)
  })

  it('marca los comerciales: no cuestan ni pesan lo mismo', async () => {
    montar()
    await waitFor(() =>
      expect(screen.getByTestId('disparador-RECOMPRA')).toBeInTheDocument(),
    )
    // Solo recompra y reactivación son MARKETING.
    expect(screen.getAllByText('COMERCIAL')).toHaveLength(2)
    expect(screen.getByTestId('disparador-RECOMPRA')).toHaveTextContent('COMERCIAL')
    expect(screen.getByTestId('disparador-POST_ENTREGA')).not.toHaveTextContent(
      'COMERCIAL',
    )
  })

  it('dice el horario y el tope, que es lo que evita que lo reporten', async () => {
    montar()
    await waitFor(() =>
      expect(
        screen.getByText(/9:00 a 21:00 · máximo 2 comerciales cada 30 días/i),
      ).toBeInTheDocument(),
    )
  })

  it('cuenta cuántos pidieron la baja y explica para qué sirve', async () => {
    montar({ bajas: 4 })
    await waitFor(() =>
      expect(screen.getByText(/evita que reporten el número/i)).toBeInTheDocument(),
    )
    expect(screen.getByText('4')).toBeInTheDocument()
  })
})

describe('el historial de avisos', () => {
  it('sin nada programado lo dice sin alarmar', async () => {
    montar()
    await waitFor(() =>
      expect(screen.getByText(/aparecen solos cuando alguien cotiza/i)).toBeInTheDocument(),
    )
  })

  it('cuando un aviso NO salió, muestra el motivo', async () => {
    // Es lo más útil de la fila: sin esto, "no le llegó" no tiene respuesta.
    montar({
      disparos: [
        disparo({
          estado: 'OMITIDO',
          motivo: 'El producto del aviso ya no está disponible.',
        }),
      ],
      porEstado: [{ estado: 'OMITIDO', total: 1 }],
    })
    await waitFor(() =>
      expect(
        screen.getByText('El producto del aviso ya no está disponible.'),
      ).toBeInTheDocument(),
    )
    expect(screen.getAllByText(/No se envió/i).length).toBeGreaterThan(0)
  })

  it('cuando salió por plantilla, explica por qué no fue texto', async () => {
    montar({
      disparos: [
        disparo({
          estado: 'ENVIADO',
          plantilla: 'recompra_25',
          enviadoEn: '2026-10-12T14:05:00.000Z',
        }),
      ],
      porEstado: [{ estado: 'ENVIADO', total: 1 }],
    })
    await waitFor(() =>
      expect(screen.getByText(/más de 24 h sin mensajes del cliente/i)).toBeInTheDocument(),
    )
  })

  it('un aviso ya enviado no ofrece "enviar ahora"', async () => {
    montar({
      disparos: [disparo({ estado: 'ENVIADO', enviadoEn: '2026-10-12T14:05:00.000Z' })],
      porEstado: [{ estado: 'ENVIADO', total: 1 }],
    })
    await waitFor(() => expect(screen.getByText('Enviado')).toBeInTheDocument())
    expect(screen.queryByText(/enviar ahora/i)).toBeNull()
  })
})

describe('las acciones', () => {
  const conUno = () =>
    montar({
      disparos: [disparo()],
      porEstado: [{ estado: 'PROGRAMADO', total: 1 }],
    })

  it('"enviar ahora" manda al endpoint que pasa por las reglas', async () => {
    conUno()
    postMock.mockResolvedValue({ data: { data: { enviado: true, via: 'plantilla' } } })
    fireEvent.click(await screen.findByText(/enviar ahora/i))
    await waitFor(() =>
      expect(postMock).toHaveBeenCalledWith('/leads/crm/disparadores/1/enviar', {}),
    )
  })

  it('si una regla lo frena, se muestra el motivo y NO se dice que se envió', async () => {
    conUno()
    postMock.mockResolvedValue({
      data: {
        data: {
          enviado: false,
          motivo: 'Ya recibió 2 avisos comerciales en los últimos 30 días.',
        },
      },
    })
    fireEvent.click(await screen.findByText(/enviar ahora/i))
    await waitFor(() =>
      expect(alertMock).toHaveBeenCalledWith(
        'Ya recibió 2 avisos comerciales en los últimos 30 días.',
        'warning',
      ),
    )
  })

  it('"no escribirle más" da de baja al número del aviso', async () => {
    conUno()
    postMock.mockResolvedValue({ data: { data: { dadoDeBaja: true, cancelados: 3 } } })
    fireEvent.click(await screen.findByText(/no escribirle más/i))
    await waitFor(() =>
      expect(postMock).toHaveBeenCalledWith(
        '/leads/crm/disparadores/baja/51925085731',
        {},
      ),
    )
    expect(alertMock).toHaveBeenCalledWith(
      expect.stringContaining('3 avisos pendientes'),
      'success',
    )
  })

  it('se puede filtrar por estado', async () => {
    montar({
      disparos: [disparo()],
      porEstado: [
        { estado: 'PROGRAMADO', total: 1 },
        { estado: 'OMITIDO', total: 2 },
      ],
    })
    fireEvent.click(await screen.findByText(/No se envió · 2/i))
    await waitFor(() =>
      expect(
        getMock.mock.calls.some((c) => String(c[0]).includes('estado=OMITIDO')),
      ).toBe(true),
    )
  })
})
