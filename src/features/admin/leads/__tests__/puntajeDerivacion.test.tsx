/**
 * Puntaje del vendedor y casillas de derivación (29-10, ideas de YaVendió).
 */
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

jest.mock('../LeadsView', () => ({
  ConfigForm: () => <div>config-form</div>,
  EntrenarPanel: () => <div>entrenar</div>,
}))

jest.mock('@/services/leads.service', () => ({
  ...jest.requireActual('@/services/leads.service'),
  fetchPuntajeVendedor: jest.fn().mockResolvedValue({
    puntaje: 62,
    nivel: 'CASI',
    items: [
      { id: 'envios', titulo: 'Zonas y costos de envío', ok: false, puntos: 10, consejo: 'Configura tus zonas', pestana: 'entrega' },
      { id: 'ia', titulo: 'IA encendida', ok: true, puntos: 5, consejo: '', pestana: 'ajustes' },
    ],
  }),
}))

import { MiVendedorPanel } from '../MiVendedorPanel'

function abrir(config: Record<string, unknown> = {}) {
  const vm = {
    config: {
      iaVentasActiva: true,
      iaVentasContexto: '',
      iaVentasSeguimiento: true,
      iaVentasCotizacion: false,
      iaVentasBrochureUrl: '',
      vendedor: {},
      ...config,
    },
    configCargada: true,
    actions: { guardarConfig: jest.fn(), toggleIaVentas: jest.fn(), abrirEntrenar: jest.fn() },
  } as any
  render(
    <MemoryRouter initialEntries={['/administrador/leads/vendedor']}>
      <MiVendedorPanel vm={vm} negocio="Krezka" />
    </MemoryRouter>,
  )
  return vm
}

describe('Puntaje del vendedor', () => {
  it('muestra el puntaje y, al abrirlo, solo lo que falta', async () => {
    abrir()
    expect(await screen.findByText('62')).toBeTruthy()
    expect(screen.getByText('Casi listo')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Puntaje de tu vendedor/ }))
    expect(screen.getByText('Zonas y costos de envío')).toBeTruthy()
    expect(screen.queryByText('IA encendida')).toBeNull()
  })
})

describe('Cuándo pasa el chat a una persona', () => {
  it('sin configurar todas vienen marcadas y "pide hablar con una persona" no se puede apagar', () => {
    abrir()
    const fija = screen.getByLabelText(/Pide hablar con una persona/) as HTMLInputElement
    expect(fija.checked).toBe(true)
    expect(fija.disabled).toBe(true)
    expect((screen.getByLabelText(/Compra al por mayor/) as HTMLInputElement).checked).toBe(true)
  })

  it('desmarcar guarda la lista sin ese motivo; volver a marcar todo guarda null', () => {
    const vm = abrir()
    fireEvent.click(screen.getByLabelText(/Compra al por mayor/))
    fireEvent.click(screen.getByRole('button', { name: /Guardar cambios/ }))
    expect(vm.actions.guardarConfig).toHaveBeenLastCalledWith({
      derivarEn: [
        'pide_hablar_con_persona',
        'reclamo',
        'cancelacion',
        'seguimiento_de_pedido',
        'descuento_especial',
        'producto_no_disponible',
      ],
    })
  })

  it('lo guardado sin mayorista vuelve desmarcado, y marcarlo de nuevo guarda null', () => {
    const vm = abrir({ derivarEn: ['reclamo', 'pide_hablar_con_persona', 'cancelacion', 'seguimiento_de_pedido', 'descuento_especial', 'producto_no_disponible'] })
    const mayorista = screen.getByLabelText(/Compra al por mayor/) as HTMLInputElement
    expect(mayorista.checked).toBe(false)
    fireEvent.click(mayorista)
    fireEvent.click(screen.getByRole('button', { name: /Guardar cambios/ }))
    expect(vm.actions.guardarConfig).toHaveBeenLastCalledWith({ derivarEn: null })
  })
})
