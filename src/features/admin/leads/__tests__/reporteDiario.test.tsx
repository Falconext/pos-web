/**
 * Reporte diario por WhatsApp (2026-10-21): el dueño lo activa en Configurar
 * IA y puede pedir uno al instante para ver cómo llega.
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
    post: (u: string) => postMock(u),
  },
}))
jest.mock('@/zustand/alert', () => ({ __esModule: true, default: () => ({ alert: alertMock }) }))
jest.mock('@iconify/react', () => ({ Icon: () => null }))

import { ReporteDiarioCard } from '../ReporteDiarioCard'

const ESTADO = {
  activo: false,
  hora: '21:00',
  ultimoEnvio: null,
  destinatarios: [{ nombre: 'Diego Ortega', numero: '991 065 217' }],
}

beforeEach(() => {
  getMock.mockReset()
  patchMock.mockReset()
  postMock.mockReset()
  alertMock.mockReset()
})

it('muestra a qué celulares llega y lo activa al tocar', async () => {
  getMock.mockResolvedValue({ data: { data: ESTADO } })
  patchMock.mockResolvedValue({ data: { data: { ...ESTADO, activo: true } } })
  render(<ReporteDiarioCard />)
  expect(await screen.findByText('Diego · 991 065 217')).toBeInTheDocument()
  expect(screen.queryByTestId('reporte-diario-probar')).not.toBeInTheDocument()

  fireEvent.click(screen.getByTestId('reporte-diario-switch'))
  await waitFor(() => expect(patchMock).toHaveBeenCalledWith('/leads/reporte-diario', { activo: true }))
  expect(await screen.findByTestId('reporte-diario-probar')).toBeInTheDocument()
  expect(screen.getByTestId('reporte-diario-switch')).toHaveAttribute('aria-checked', 'true')
})

it('"mandarme el de hoy" avisa a cuántos, o el motivo si no salió', async () => {
  getMock.mockResolvedValue({ data: { data: { ...ESTADO, activo: true } } })
  postMock.mockResolvedValueOnce({ data: { data: { enviados: 1 } } })
  render(<ReporteDiarioCard />)
  fireEvent.click(await screen.findByTestId('reporte-diario-probar'))
  await waitFor(() => expect(alertMock).toHaveBeenCalledWith('Enviado a 1 celular. Revisa tu WhatsApp.', 'success'))

  postMock.mockRejectedValueOnce({ response: { data: { message: 'La plantilla puede estar todavía en revisión de Meta' } } })
  fireEvent.click(screen.getByTestId('reporte-diario-probar'))
  await waitFor(() => expect(alertMock).toHaveBeenLastCalledWith('La plantilla puede estar todavía en revisión de Meta', 'error'))
})

it('sin celulares válidos lo explica y no deja activarlo', async () => {
  getMock.mockResolvedValue({ data: { data: { ...ESTADO, destinatarios: [] } } })
  render(<ReporteDiarioCard />)
  expect(await screen.findByText(/Ningún administrador tiene un celular válido/)).toBeInTheDocument()
  expect(screen.getByTestId('reporte-diario-switch')).toBeDisabled()
})

it('sin el módulo (403) o con un backend viejo no se muestra', async () => {
  getMock.mockRejectedValue({ response: { status: 404 } })
  const { container } = render(<ReporteDiarioCard />)
  await waitFor(() => expect(getMock).toHaveBeenCalled())
  expect(container).toBeEmptyDOMElement()
})
