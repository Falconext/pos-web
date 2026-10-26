import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'

let auth: any = null
jest.mock('@/zustand/auth', () => ({ useAuthStore: () => ({ auth }) }))
const hasPermission = jest.fn()
jest.mock('@/utils/permissions', () => ({ hasPermission: (...a: any[]) => hasPermission(...a) }))

import { BotonVerChat } from '../BotonVerChat'

function Donde() {
  const l = useLocation()
  return <p data-testid="ruta">{l.pathname + l.search}</p>
}

const montar = (telefono: string | null) =>
  render(
    <MemoryRouter initialEntries={['/administrador/facturacion/comprobantes']}>
      <Routes>
        <Route path="*" element={<><BotonVerChat telefono={telefono} /><Donde /></>} />
      </Routes>
    </MemoryRouter>,
  )

describe('Ver chat desde un comprobante', () => {
  beforeEach(() => {
    auth = { rol: 'ADMIN_EMPRESA' }
    hasPermission.mockReturnValue(true)
  })

  it('lleva a Chats con el teléfono del cliente', () => {
    montar('987 654 321')
    fireEvent.click(screen.getByText('Ver chat del cliente'))
    expect(screen.getByTestId('ruta')).toHaveTextContent('/administrador/leads/chats?tel=987654321')
  })

  it('no aparece sin IA de Ventas ni sin teléfono', () => {
    hasPermission.mockReturnValue(false)
    montar('987654321')
    expect(screen.queryByText('Ver chat del cliente')).toBeNull()
  })

  it('no aparece si el cliente no tiene teléfono', () => {
    montar(null)
    expect(screen.queryByText('Ver chat del cliente')).toBeNull()
  })
})
