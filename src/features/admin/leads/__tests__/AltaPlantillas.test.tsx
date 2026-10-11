/**
 * El alta de plantillas tiene que decir QUÉ pasó.
 *
 * Pasó en vivo: el dueño apretó el botón y le salió "No se pudieron dar de
 * alta las plantillas", que no dice nada y no deja hacer nada. El mensaje
 * genérico tapaba dos cosas distintas: un error del servidor y un fallo de
 * mi propio código al leer la respuesta.
 */
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

const getMock = jest.fn()
const postMock = jest.fn()
const alertMock = jest.fn()

jest.mock('@/utils/apiClient', () => ({
  __esModule: true,
  default: { get: (u: string) => getMock(u), post: (u: string, b: unknown) => postMock(u, b) },
}))
jest.mock('@/zustand/alert', () => ({
  __esModule: true,
  default: () => ({ alert: alertMock }),
  useAlertStore: () => ({ alert: alertMock }),
}))
jest.mock('@iconify/react', () => ({ Icon: () => null }))

import { DisparadoresPanel } from '../DisparadoresPanel'

const CONFIG = {
  activos: ['RECOMPRA'],
  horaDesde: 9,
  horaHasta: 21,
  topeMarketing: 2,
  topeMarketingDias: 30,
}

const montar = () => {
  getMock.mockImplementation((u: string) =>
    Promise.resolve({
      data: { data: u.includes('/config') ? CONFIG : { disparos: [], porEstado: [], bajas: 0 } },
    }),
  )
  return render(<DisparadoresPanel />)
}

const apretar = async () => {
  montar()
  fireEvent.click(await screen.findByTestId('btn-plantillas'))
}

beforeEach(() => {
  getMock.mockReset()
  postMock.mockReset()
  alertMock.mockReset()
})

describe('cuando sale bien', () => {
  it('dice cuántas se mandaron y cuántas ya estaban', async () => {
    postMock.mockResolvedValue({
      data: { data: { creadas: ['recompra_25', 'carrito_en_espera'], existentes: ['pedido_en_camino'], errores: [] } },
    })
    await apretar()
    await waitFor(() =>
      expect(alertMock).toHaveBeenCalledWith(
        expect.stringContaining('2 enviadas a aprobación, 1 ya estaban'),
        'success',
      ),
    )
  })
})

describe('cuando Meta rechaza alguna', () => {
  it('muestra SU motivo, no un contador', async () => {
    // El motivo de Meta casi siempre dice exactamente qué corregir.
    postMock.mockResolvedValue({
      data: {
        data: {
          creadas: ['recompra_25'],
          existentes: [],
          errores: ['reactivacion_45: Template name already exists'],
        },
      },
    })
    await apretar()
    await waitFor(() =>
      expect(alertMock).toHaveBeenCalledWith(
        expect.stringContaining('Template name already exists'),
        'warning',
      ),
    )
  })
})

describe('cuando falla de verdad', () => {
  it('muestra el mensaje del servidor si lo hay', async () => {
    postMock.mockRejectedValue({
      response: { status: 400, data: { message: 'Esta empresa no tiene una cuenta de WhatsApp Business conectada.' } },
    })
    await apretar()
    await waitFor(() =>
      expect(alertMock).toHaveBeenCalledWith(
        'Esta empresa no tiene una cuenta de WhatsApp Business conectada.',
        'error',
      ),
    )
  })

  it('y si el servidor no manda mensaje, al menos el código', async () => {
    postMock.mockRejectedValue({ response: { status: 500, data: {} } })
    await apretar()
    await waitFor(() =>
      expect(alertMock).toHaveBeenCalledWith(
        expect.stringContaining('respondió 500'),
        'error',
      ),
    )
  })

  it('y si ni siquiera hubo respuesta, lo dice: es otra cosa', async () => {
    // Un timeout o un CORS no es "no se pudieron dar de alta": es que la
    // petición nunca llegó, y eso se arregla en otro lado.
    postMock.mockRejectedValue({ message: 'Network Error' })
    await apretar()
    await waitFor(() =>
      expect(alertMock).toHaveBeenCalledWith(
        expect.stringContaining('No se pudo contactar al servidor: Network Error'),
        'error',
      ),
    )
  })
})

describe('una respuesta incompleta', () => {
  it('ya no revienta y lo dice en vez de culpar al alta', async () => {
    // Era el bug: cualquier campo que faltara tiraba un TypeError y el
    // usuario veía "no se pudieron dar de alta", que era falso.
    postMock.mockResolvedValue({ data: { data: {} } })
    await apretar()
    await waitFor(() =>
      expect(alertMock).toHaveBeenCalledWith(
        expect.stringContaining('Meta no devolvió ninguna plantilla'),
        'warning',
      ),
    )
  })
})
