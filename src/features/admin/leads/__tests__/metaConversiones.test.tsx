/**
 * Avisar a Meta las ventas de los anuncios (2026-10-29): se activa desde
 * Ajustes, muestra lo avisado y el error de Meta tal cual.
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
jest.mock('@/zustand/alert', () => ({ __esModule: true, default: () => ({ alert: alertMock }) }))
jest.mock('@iconify/react', () => ({ Icon: () => null }))

import { MetaConversionesCard } from '../MetaConversionesCard'

const BASE = {
  activo: false,
  conectado: true,
  datasetId: null,
  ultimoError: null,
  ultimos30Dias: { comprasAvisadas: 0, montoAvisado: 0, leadsAvisados: 0, pendientes: 0, conError: 0 },
  ultimos: [],
}
const ACTIVO = {
  ...BASE,
  activo: true,
  datasetId: 'DS1',
  ultimos30Dias: { comprasAvisadas: 2, montoAvisado: 179.9, leadsAvisados: 1, pendientes: 0, conError: 0 },
  ultimos: [
    { id: 1, evento: 'Purchase', valor: 59.9, moneda: 'PEN', estado: 'ENVIADO', error: null, ocurridoEn: '2026-10-29T15:00:00Z', comprobante: 'NV01-40', cliente: 'Ana' },
    { id: 2, evento: 'LeadSubmitted', valor: null, moneda: null, estado: 'ERROR', error: 'sin permiso', ocurridoEn: '2026-10-29T14:00:00Z', comprobante: null, cliente: 'Luis' },
  ],
}

beforeEach(() => {
  getMock.mockReset()
  patchMock.mockReset()
  postMock.mockReset()
  alertMock.mockReset()
})

it('se activa y muestra lo avisado', async () => {
  getMock.mockResolvedValue({ data: { data: BASE } })
  patchMock.mockResolvedValue({ data: { data: ACTIVO } })
  render(<MetaConversionesCard />)
  fireEvent.click(await screen.findByTestId('meta-conversiones-switch'))
  await waitFor(() => expect(patchMock).toHaveBeenCalledWith('/leads/meta-conversiones', { activo: true }))
  expect(await screen.findByText(/2 compras avisadas/)).toHaveTextContent('S/ 179.90')
  expect(screen.getByText('NV01-40')).toBeInTheDocument()
  expect(screen.getByText('Falló')).toHaveAttribute('title', 'sin permiso')
})

it('sin WhatsApp conectado no se puede activar', async () => {
  getMock.mockResolvedValue({ data: { data: { ...BASE, conectado: false } } })
  render(<MetaConversionesCard />)
  expect(await screen.findByTestId('meta-conversiones-switch')).toBeDisabled()
  expect(screen.getByText(/Primero conecta el WhatsApp/)).toBeInTheDocument()
})

it('muestra el error de Meta y manda la compra de prueba con el código', async () => {
  getMock.mockResolvedValue({ data: { data: { ...ACTIVO, ultimoError: 'Meta no dio permiso para enviar eventos' } } })
  postMock.mockResolvedValue({ data: { data: { ...ACTIVO, enviados: 0, prueba: true } } })
  render(<MetaConversionesCard />)
  expect(await screen.findByTestId('meta-conversiones-error')).toHaveTextContent('Meta no dio permiso')
  fireEvent.click(screen.getByText('Probar en el Administrador de eventos'))
  fireEvent.change(screen.getByTestId('meta-conversiones-codigo'), { target: { value: ' TEST9 ' } })
  fireEvent.click(screen.getByTestId('meta-conversiones-enviar-prueba'))
  await waitFor(() => expect(postMock).toHaveBeenCalledWith('/leads/meta-conversiones/probar', { testEventCode: 'TEST9' }))
  await waitFor(() => expect(alertMock).toHaveBeenCalledWith(expect.stringMatching(/Compra de prueba enviada/), 'success'))
})

it('no aparece con un servidor sin la función', async () => {
  getMock.mockRejectedValue(new Error('404'))
  const { container } = render(<MetaConversionesCard />)
  await waitFor(() => expect(getMock).toHaveBeenCalled())
  expect(container).toBeEmptyDOMElement()
})
