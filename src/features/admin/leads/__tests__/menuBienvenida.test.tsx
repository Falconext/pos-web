/**
 * Menú de bienvenida (28-10, Krezka): el saludo sale tal cual con preguntas
 * para tocar. Lo que se cuida: que al encenderlo arranque con un ejemplo, que
 * la vista previa muestre el saludo exacto y los botones, y que al guardar no
 * viajen opciones vacías.
 */
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

jest.mock('../LeadsView', () => ({
  ConfigForm: () => <div>config-form</div>,
  EntrenarPanel: () => <div>entrenar</div>,
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

describe('Menú de bienvenida', () => {
  it('al encenderlo arranca con una pregunta de ejemplo', () => {
    abrir()
    fireEvent.click(screen.getByRole('switch', { name: /Saludar con el menú/ }))
    expect((screen.getByDisplayValue('¿En qué te podemos ayudar?') as HTMLInputElement).value).toBeTruthy()
    expect(screen.getByDisplayValue('Hablar con un asesor')).toBeTruthy()
  })

  it('la vista previa muestra el saludo exacto y los botones; al guardar no van opciones vacías', () => {
    const vm = abrir({
      menu: {
        activo: true,
        bienvenida: '',
        pasos: [{ pregunta: '¿Dónde vendes?', opciones: [{ titulo: 'Tienda física' }, { titulo: 'Internet' }] }],
      },
    })
    fireEvent.change(screen.getByPlaceholderText(/Bienvenido\(a\) a Krezka/), {
      target: { value: '¡Hola! 👋 Bienvenido(a) a KREZKA 🚀' },
    })
    expect(screen.getAllByText('Internet').length).toBeGreaterThan(0)
    expect(screen.getByText(/Así sale el menú, tal cual/)).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /Agregar opción/ }))
    fireEvent.click(screen.getByRole('button', { name: /Guardar cambios/ }))
    expect(vm.actions.guardarConfig).toHaveBeenCalledWith({
      menu: {
        activo: true,
        bienvenida: '¡Hola! 👋 Bienvenido(a) a KREZKA 🚀',
        pasos: [{ pregunta: '¿Dónde vendes?', opciones: [{ titulo: 'Tienda física' }, { titulo: 'Internet' }] }],
      },
    })
  })
})
