/**
 * El interruptor "Cobrar con link de Mercado Pago" de la configuración de la
 * IA (21-10). Es opcional por empresa —Mercado Pago cobra comisión— y no
 * sirve sin el Mercado Pago del negocio conectado: ahí no se puede prender.
 */
import { render, screen, fireEvent } from '@testing-library/react'

jest.mock('@/zustand/alert', () => ({
  __esModule: true,
  default: () => ({ alert: jest.fn(), load: jest.fn(), loading: false }),
}))
jest.mock('@/services/leads.service', () => ({}))

import { ConfigForm } from '../LeadsView'

const base = {
  iaVentasActiva: true,
  iaVentasContexto: '',
  iaVentasSeguimiento: true,
  iaVentasCotizacion: true,
  iaVentasBrochureUrl: '',
}

function fila() {
  return screen.getByText('Cobrar con link de Mercado Pago').closest('div')!.parentElement!
}

it('con Mercado Pago conectado se prende y se guarda', () => {
  const onSave = jest.fn()
  render(<ConfigForm initial={{ ...base, mpConectado: true }} onSave={onSave} onToggle={jest.fn()} />)
  fireEvent.click(fila().querySelector('button')!)
  fireEvent.click(screen.getByText('Guardar'))
  expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ cobroConLink: true }))
})

it('sin Mercado Pago conectado avisa dónde conectarlo y no se prende', () => {
  const onSave = jest.fn()
  render(<ConfigForm initial={{ ...base, mpConectado: false }} onSave={onSave} onToggle={jest.fn()} />)
  expect(screen.getByText(/conecta tu Mercado Pago en Mi perfil/i)).toBeInTheDocument()
  fireEvent.click(fila().querySelector('button')!)
  fireEvent.click(screen.getByText('Guardar'))
  expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ cobroConLink: false }))
})

it('lo ya activado aparece prendido', () => {
  render(<ConfigForm initial={{ ...base, mpConectado: true, cobroConLink: true }} onSave={jest.fn()} onToggle={jest.fn()} />)
  expect(fila().querySelector('button')!.className).toMatch(/emerald/)
})
