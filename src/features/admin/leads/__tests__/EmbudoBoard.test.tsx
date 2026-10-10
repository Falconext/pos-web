/**
 * E1 — QA de render del tablero.
 *
 * Lo que se protege: que las 12 columnas estén siempre, que el aviso de pagos
 * por validar se vea (es lo único del tablero que bloquea plata) y que cuando
 * el backend rechaza un movimiento por el candado, el encargado LEA el motivo
 * en vez de un "no se pudo".
 */
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

const getMock = jest.fn()
const patchMock = jest.fn()
const postMock = jest.fn()
const alertMock = jest.fn()

jest.mock('@/utils/apiClient', () => ({
  __esModule: true,
  default: {
    get: (u: string) => getMock(u),
    patch: (u: string, b: unknown) => patchMock(u, b),
    post: (u: string, b: unknown) => postMock(u, b),
  },
}))
jest.mock('@/zustand/alert', () => ({
  __esModule: true,
  default: () => ({ alert: alertMock }),
  useAlertStore: () => ({ alert: alertMock }),
}))
jest.mock('@iconify/react', () => ({ Icon: () => null }))

import { EmbudoBoard } from '../EmbudoBoard'
import { ETAPA_META, type EtapaCrm } from '@/services/crm.service'

const ETAPAS = Object.keys(ETAPA_META) as EtapaCrm[]

const pedido = (id: number, over: Record<string, unknown> = {}) => ({
  id,
  telefonoProspecto: `5190000${id}`,
  nombreProspecto: `CLIENTE ${id}`,
  etapaEn: new Date().toISOString(),
  puntaje: 40,
  estado: 'TIBIO',
  conversacion: { id },
  comprobantesPago: [],
  ...over,
})

function tablero(over: Record<string, unknown> = {}) {
  return {
    data: {
      data: {
        pagosPorValidar: 0,
        columnas: ETAPAS.map((etapa) => ({
          etapa,
          etiqueta: ETAPA_META[etapa].label,
          total: 0,
          pedidos: [],
        })),
        ...over,
      },
    },
  }
}

beforeEach(() => {
  getMock.mockReset()
  patchMock.mockReset()
  postMock.mockReset()
  alertMock.mockReset()
})

describe('el tablero', () => {
  it('pinta las 12 columnas del anexo, incluso vacías', async () => {
    getMock.mockResolvedValue(tablero())
    render(<EmbudoBoard />)
    await waitFor(() => expect(screen.getByText('Nuevo')).toBeInTheDocument())
    for (const e of ETAPAS) {
      expect(screen.getByText(ETAPA_META[e].label)).toBeInTheDocument()
    }
    expect(screen.getAllByText('Vacío')).toHaveLength(12)
  })

  it('avisa arriba cuántos pagos esperan validación', async () => {
    getMock.mockResolvedValue(tablero({ pagosPorValidar: 3 }))
    render(<EmbudoBoard />)
    const aviso = await screen.findByTestId('aviso-pagos')
    expect(aviso).toHaveTextContent('3 pagos por validar')
    expect(aviso).toHaveTextContent(/ningún pedido pasa a despacho/i)
  })

  it('sin pagos pendientes no mete un aviso que no aporta', async () => {
    getMock.mockResolvedValue(tablero({ pagosPorValidar: 0 }))
    render(<EmbudoBoard />)
    await waitFor(() => expect(screen.getByText('Nuevo')).toBeInTheDocument())
    expect(screen.queryByTestId('aviso-pagos')).toBeNull()
  })
})

describe('mover un pedido', () => {
  const conUno = () =>
    tablero({
      columnas: ETAPAS.map((etapa) => ({
        etapa,
        etiqueta: ETAPA_META[etapa].label,
        total: etapa === 'COTIZADO' ? 1 : 0,
        pedidos: etapa === 'COTIZADO' ? [pedido(1)] : [],
      })),
    })

  /** Las opciones del menú son botones; los títulos de columna, no. */
  const opcion = (label: string) =>
    screen.queryAllByRole('button').find((b) => b.textContent === label)

  it('no ofrece mover a la etapa en la que ya está', async () => {
    getMock.mockResolvedValue(conUno())
    render(<EmbudoBoard />)
    fireEvent.click(await screen.findByText('Mover'))
    // "Cotizado" sigue como título de columna, pero no como opción del menú.
    expect(opcion('Cotizado')).toBeUndefined()
    expect(opcion('Por despachar')).toBeDefined()
  })

  it('no ofrece En ruta ni Entregado: eso lo pone la logística', async () => {
    getMock.mockResolvedValue(conUno())
    render(<EmbudoBoard />)
    fireEvent.click(await screen.findByText('Mover'))
    // Mover el envío a mano desde acá desincronizaría el despacho.
    expect(opcion('En ruta')).toBeUndefined()
    expect(opcion('Entregado')).toBeUndefined()
  })

  it('cuando el candado lo rechaza, muestra el motivo del backend tal cual', async () => {
    getMock.mockResolvedValue(conUno())
    patchMock.mockRejectedValue({
      response: {
        data: {
          message: 'El cliente mandó un comprobante de pago que todavía nadie revisó.',
        },
      },
    })
    render(<EmbudoBoard />)
    fireEvent.click(await screen.findByText('Mover'))
    fireEvent.click(opcion('Por despachar')!)

    await waitFor(() =>
      expect(alertMock).toHaveBeenCalledWith(
        'El cliente mandó un comprobante de pago que todavía nadie revisó.',
        'error',
      ),
    )
  })
})

describe('el comprobante de pago', () => {
  const conVoucher = (url: string | null) =>
    tablero({
      pagosPorValidar: 1,
      columnas: ETAPAS.map((etapa) => ({
        etapa,
        etiqueta: ETAPA_META[etapa].label,
        total: etapa === 'PENDIENTE_VALIDACION_PAGO' ? 1 : 0,
        pedidos:
          etapa === 'PENDIENTE_VALIDACION_PAGO'
            ? [
                pedido(1, {
                  comprobantesPago: [
                    { id: 77, url, recibidoEn: new Date().toISOString() },
                  ],
                }),
              ]
            : [],
      })),
    })

  it('se puede abrir y ver la imagen antes de aprobar', async () => {
    getMock.mockResolvedValue(conVoucher('https://s3/voucher.webp'))
    render(<EmbudoBoard />)
    fireEvent.click(await screen.findByText(/revisar el comprobante/i))
    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://s3/voucher.webp')
    expect(screen.getByText(/el pago está bien/i)).toBeInTheDocument()
  })

  it('si la imagen no se guardó, lo dice en vez de dejar un hueco', async () => {
    // Aprobar un pago sin verlo es exactamente lo que este paso evita.
    getMock.mockResolvedValue(conVoucher(null))
    render(<EmbudoBoard />)
    fireEvent.click(await screen.findByText(/revisar el comprobante/i))
    expect(screen.getByText(/ábrela en el chat de whatsapp antes de validar/i)).toBeInTheDocument()
    expect(screen.queryByRole('img')).toBeNull()
  })

  it('validarlo llama al endpoint del candado', async () => {
    getMock.mockResolvedValue(conVoucher('https://s3/v.webp'))
    postMock.mockResolvedValue({ data: { data: { validado: true } } })
    render(<EmbudoBoard />)
    fireEvent.click(await screen.findByText(/revisar el comprobante/i))
    fireEvent.click(screen.getByText(/el pago está bien/i))

    await waitFor(() =>
      expect(postMock).toHaveBeenCalledWith('/leads/crm/pagos/77/validar', {
        pasarADespacho: true,
      }),
    )
  })

  it('rechazar sin escribir motivo no manda nada', async () => {
    getMock.mockResolvedValue(conVoucher('https://s3/v.webp'))
    const prompt = jest.spyOn(window, 'prompt').mockReturnValue('  ')
    render(<EmbudoBoard />)
    fireEvent.click(await screen.findByText(/revisar el comprobante/i))
    fireEvent.click(screen.getByText(/rechazar/i))
    expect(postMock).not.toHaveBeenCalled()
    prompt.mockRestore()
  })

  it('con motivo, lo manda', async () => {
    getMock.mockResolvedValue(conVoucher('https://s3/v.webp'))
    postMock.mockResolvedValue({ data: { data: { rechazado: true } } })
    const prompt = jest.spyOn(window, 'prompt').mockReturnValue('el voucher es de otra cuenta')
    render(<EmbudoBoard />)
    fireEvent.click(await screen.findByText(/revisar el comprobante/i))
    fireEvent.click(screen.getByText(/rechazar/i))
    await waitFor(() =>
      expect(postMock).toHaveBeenCalledWith('/leads/crm/pagos/77/rechazar', {
        motivo: 'el voucher es de otra cuenta',
      }),
    )
    prompt.mockRestore()
  })
})
