/**
 * La lista de envíos masivos: cada envío con su avance y lo que no salió.
 */
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { EnviosMasivosPanel } from '../EnviosMasivosPanel'

jest.mock('@/zustand/alert', () => ({ __esModule: true, default: () => ({ alert: jest.fn() }) }))
jest.mock('@/services/envios.service', () => ({
  fetchEnvios: jest.fn().mockResolvedValue([
    {
      id: 1,
      nombre: 'Liquidación invierno',
      estado: 'TERMINADO',
      programadoPara: '2026-10-26T21:00:00Z',
      iniciadoEn: '2026-10-26T21:00:00Z',
      terminadoEn: '2026-10-26T21:02:00Z',
      porMinuto: 30,
      nota: null,
      plantilla: { id: 7, titulo: 'Liquidación' },
      conteos: { total: 14, pendientes: 0, enviados: 9, omitidos: 4, fallidos: 1, cancelados: 0 },
      creadoEn: '2026-10-26T21:00:00Z',
    },
  ]),
}))
jest.mock('@/services/leads.service', () => ({ fetchEtiquetas: jest.fn().mockResolvedValue([]) }))

it('muestra cada envío con enviados, los que no salieron y los que fallaron', async () => {
  render(
    <MemoryRouter>
      <EnviosMasivosPanel />
    </MemoryRouter>,
  )
  await waitFor(() => expect(screen.getByText('Liquidación invierno')).toBeInTheDocument())
  expect(screen.getByText('Terminado')).toBeInTheDocument()
  expect(screen.getByText('9')).toBeInTheDocument()
  expect(screen.getByText(/4 no se enviaron/)).toBeInTheDocument()
  expect(screen.getByText('1 fallaron')).toBeInTheDocument()
})
