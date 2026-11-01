/**
 * Tarjeta de TikTok: el WhatsApp que la IA da en sus respuestas. Krezka no
 * tenía ninguno cargado (01-11) y la IA invitaba a "mensaje directo", que en
 * TikTok no atiende nadie.
 */
import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

const getMock = jest.fn()
const putMock = jest.fn()
jest.mock('@/utils/apiClient', () => ({
  __esModule: true,
  default: { get: (...a: any[]) => getMock(...a), put: (...a: any[]) => putMock(...a), delete: jest.fn() },
}))
jest.mock('@/zustand/alert', () => ({ __esModule: true, default: { getState: () => ({ alert: jest.fn() }) } }))
jest.mock('@iconify/react', () => ({ Icon: () => null }))

import ConectarTiktokButton from '../ConectarTiktokButton'

const ESTADO = { disponible: true, conectado: true, usuario: 'krezka.peru', comentarios: true, comentariosClave: 'precio', whatsapp: null, ultimas: [] }

beforeEach(() => {
  getMock.mockReset()
  putMock.mockReset()
})

it('sin número avisa y guarda el que se escribe', async () => {
  getMock.mockResolvedValue({ data: { data: ESTADO } })
  putMock.mockResolvedValue({ data: { data: { ...ESTADO, whatsapp: '991065217' } } })
  render(<ConectarTiktokButton />)
  expect(await screen.findByText(/Sin número, la IA manda/)).toBeInTheDocument()
  fireEvent.change(screen.getByTestId('tiktok-whatsapp'), { target: { value: '991 065 217' } })
  fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
  await waitFor(() => expect(putMock).toHaveBeenCalledWith('/tiktok/comentarios', { activo: true, clave: 'precio', whatsapp: '991 065 217' }))
  await waitFor(() => expect(screen.queryByText(/Sin número, la IA manda/)).not.toBeInTheDocument())
})

it('con número ya resuelto lo muestra y no avisa', async () => {
  getMock.mockResolvedValue({ data: { data: { ...ESTADO, whatsapp: '51991065217' } } })
  render(<ConectarTiktokButton />)
  expect(await screen.findByDisplayValue('51991065217')).toBeInTheDocument()
  expect(screen.queryByText(/Sin número, la IA manda/)).not.toBeInTheDocument()
})
