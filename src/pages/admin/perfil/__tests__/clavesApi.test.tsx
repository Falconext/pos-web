/**
 * Claves API (2026-10-22): el negocio saca la clave para su página web. La
 * clave completa se ve UNA vez; después solo su prefijo y sus últimos 4.
 */
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

const getMock = jest.fn()
const postMock = jest.fn()
const deleteMock = jest.fn()
const alertMock = jest.fn()
jest.mock('@/utils/apiClient', () => ({
    __esModule: true,
    default: {
        defaults: { baseURL: 'https://api.krezka.com/api' },
        get: (u: string) => getMock(u),
        post: (u: string, b: unknown) => postMock(u, b),
        delete: (u: string) => deleteMock(u),
    },
}))
jest.mock('@/zustand/alert', () => ({ __esModule: true, default: () => ({ alert: alertMock }) }))
jest.mock('@iconify/react', () => ({ Icon: () => null }))
jest.mock('@/components/ModalConfirm', () => ({
    __esModule: true,
    default: ({ isOpenModal, confirmSubmit, information }: any) =>
        isOpenModal ? (
            <div>
                <p>{information}</p>
                <button onClick={confirmSubmit}>confirmar-anular</button>
            </div>
        ) : null,
}))

import { ClavesApiCard, baseApiPublica } from '../ClavesApiCard'

const CLAVE = {
    id: 3,
    nombre: 'Página web',
    entorno: 'live',
    prefijo: 'sk_live_5z6Q',
    ultimosCuatro: 'cgnF',
    ultimoUsoEn: null,
    creadoEn: '2026-10-22T06:00:00Z',
}

beforeEach(() => {
    getMock.mockReset()
    postMock.mockReset()
    deleteMock.mockReset()
    alertMock.mockReset()
})

it('la dirección pública sale de la del panel', () => {
    expect(baseApiPublica()).toBe('https://api.krezka.com/api/v1/erp')
})

it('lista las claves sin mostrar la clave completa', async () => {
    getMock.mockResolvedValue({ data: { data: [CLAVE] } })
    render(<ClavesApiCard />)
    expect(await screen.findByTestId('clave-3')).toHaveTextContent('Página web')
    expect(screen.getByTestId('clave-3')).toHaveTextContent('sk_live_5z6Q…cgnF')
    expect(screen.getByTestId('clave-3')).toHaveTextContent('último uso Nunca')
})

it('al crear, muestra la clave UNA vez para copiarla', async () => {
    getMock.mockResolvedValueOnce({ data: { data: [] } }).mockResolvedValue({ data: { data: [CLAVE] } })
    postMock.mockResolvedValue({ data: { data: { apiKey: 'sk_live_COMPLETA_123' } } })
    render(<ClavesApiCard />)
    expect(await screen.findByTestId('claves-vacio')).toBeInTheDocument()
    fireEvent.change(screen.getByTestId('clave-nombre'), { target: { value: 'Página web' } })
    fireEvent.click(screen.getByTestId('clave-crear'))
    await waitFor(() => expect(postMock).toHaveBeenCalledWith('/integraciones/claves-api', { nombre: 'Página web' }))
    expect(await screen.findByTestId('clave-nueva')).toHaveTextContent('sk_live_COMPLETA_123')
    fireEvent.click(screen.getByText('Ya la guardé'))
    expect(screen.queryByTestId('clave-nueva')).not.toBeInTheDocument()
    expect(screen.queryByText('sk_live_COMPLETA_123')).not.toBeInTheDocument()
})

it('anular pide confirmación y avisa que lo que la use deja de funcionar', async () => {
    getMock.mockResolvedValueOnce({ data: { data: [CLAVE] } }).mockResolvedValue({ data: { data: [] } })
    deleteMock.mockResolvedValue({ data: { data: { id: 3 } } })
    render(<ClavesApiCard />)
    fireEvent.click(await screen.findByTestId('clave-anular-3'))
    expect(screen.getByText(/dejará de funcionar ahora mismo/)).toBeInTheDocument()
    expect(deleteMock).not.toHaveBeenCalled()
    fireEvent.click(screen.getByText('confirmar-anular'))
    await waitFor(() => expect(deleteMock).toHaveBeenCalledWith('/integraciones/claves-api/3'))
    expect(await screen.findByTestId('claves-vacio')).toBeInTheDocument()
})

it('si el backend no deja crear (plan sin la API), se muestra su motivo', async () => {
    getMock.mockResolvedValue({ data: { data: [] } })
    postMock.mockRejectedValue({ response: { data: { message: 'Su plan no incluye acceso al módulo: api' } } })
    render(<ClavesApiCard />)
    fireEvent.click(await screen.findByTestId('clave-crear'))
    await waitFor(() => expect(alertMock).toHaveBeenCalledWith('Su plan no incluye acceso al módulo: api', 'error'))
})
