/**
 * "Mi vendedor" (22-10): personalidad, temas, entrega y pagos de la IA en
 * una sola pantalla. Lo que se cuida acá: que con un servidor viejo no se
 * pueda guardar (se perderían los campos), que guarde todo junto lo que se
 * editó, y que las zonas no pierdan los alias cargados a mano.
 */
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

jest.mock('../LeadsView', () => ({
  ConfigForm: () => <div>config-form</div>,
  EntrenarPanel: () => <div>entrenar</div>,
}))

import { MiVendedorPanel } from '../MiVendedorPanel'

const base = {
  iaVentasActiva: true,
  iaVentasContexto: '',
  iaVentasSeguimiento: true,
  iaVentasCotizacion: false,
  iaVentasBrochureUrl: '',
}

function vmCon(config: Record<string, unknown>) {
  return {
    config: { ...base, ...config },
    configCargada: true,
    actions: {
      guardarConfig: jest.fn(),
      toggleIaVentas: jest.fn(),
      abrirEntrenar: jest.fn(),
    },
  } as any
}

const abrir = (vm: any, url = '/administrador/leads/vendedor') =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <MiVendedorPanel vm={vm} negocio="Café de Alba" />
    </MemoryRouter>,
  )

describe('Mi vendedor', () => {
  it('con un servidor que no la soporta, avisa y no deja guardar', () => {
    const vm = vmCon({})
    abrir(vm)
    expect(screen.getByText(/se activan con la próxima actualización/)).toBeTruthy()
    fireEvent.change(screen.getByPlaceholderText('Ej. Ana'), { target: { value: 'Ana' } })
    const boton = screen.getByRole('button', { name: /Guardar cambios/ }) as HTMLButtonElement
    expect(boton.disabled).toBe(true)
  })

  it('guarda nombre, perfil, envío y pagos en un solo envío', () => {
    const vm = vmCon({ asesor: '', vendedor: {}, envio: { zonas: [], zonaPorDefecto: '' }, mediosPagoLista: [] })
    abrir(vm)
    expect(screen.getByRole('button', { name: /Guardado/ })).toBeTruthy()

    fireEvent.change(screen.getByPlaceholderText('Ej. Ana'), { target: { value: 'Ana' } })
    fireEvent.click(screen.getByRole('button', { name: 'Muy conciso' }))
    expect(screen.getByText('Cambios sin guardar')).toBeTruthy()
    // La vista previa ya saluda con el nombre.
    expect(screen.getByText(/Soy Ana de Café de Alba/)).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /Guardar cambios/ }))
    expect(vm.actions.guardarConfig).toHaveBeenCalledWith({
      iaVentasContexto: '',
      iaVentasBrochureUrl: '',
      asesor: 'Ana',
      vendedor: { longitud: 1 },
      envio: { zonas: [], zonaPorDefecto: '' },
      mediosPagoLista: [],
    })
  })

  it('las zonas conservan los alias y renombrar la zona por defecto no la pierde', () => {
    const vm = vmCon({
      vendedor: {},
      envio: {
        zonas: [
          { nombre: 'Lima', tipo: 'DOMICILIO', tarifa: 10, lugares: [{ nombre: 'San Juan de Lurigancho', alias: ['SJL'] }] },
        ],
        zonaPorDefecto: 'Lima',
      },
    })
    abrir(vm, '/administrador/leads/vendedor?tab=entrega')

    const nombre = screen.getByDisplayValue('Lima')
    fireEvent.change(nombre, { target: { value: 'Lima Metropolitana' } })
    const lugares = screen.getByPlaceholderText('') as HTMLInputElement
    fireEvent.change(lugares, { target: { value: 'Miraflores' } })
    fireEvent.keyDown(lugares, { key: 'Enter' })

    fireEvent.click(screen.getByRole('button', { name: /Guardar cambios/ }))
    const enviado = vm.actions.guardarConfig.mock.calls[0][0]
    expect(enviado.envio).toEqual({
      zonas: [
        {
          nombre: 'Lima Metropolitana',
          tipo: 'DOMICILIO',
          tarifa: 10,
          lugares: [{ nombre: 'San Juan de Lurigancho', alias: ['SJL'] }, { nombre: 'Miraflores' }],
        },
      ],
      zonaPorDefecto: 'Lima Metropolitana',
    })
  })

  it('no manda métodos de pago a medio llenar', () => {
    const vm = vmCon({ vendedor: {}, mediosPagoLista: [] })
    abrir(vm, '/administrador/leads/vendedor?tab=pagos')
    fireEvent.click(screen.getByRole('button', { name: 'Yape' }))
    fireEvent.click(screen.getByRole('button', { name: /Agregar/ }))
    fireEvent.change(screen.getAllByPlaceholderText('987 654 321')[0], { target: { value: '987654321' } })
    fireEvent.change(screen.getAllByPlaceholderText('Nombre del titular')[0], { target: { value: 'Ana Torres' } })
    expect(screen.getByText(/Yape: 987654321 \(titular: Ana Torres\)/)).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /Guardar cambios/ }))
    expect(vm.actions.guardarConfig.mock.calls[0][0].mediosPagoLista).toEqual([
      { nombre: 'Yape', detalle: '987654321', titular: 'Ana Torres' },
    ])
  })

  it('el texto general se ve completo y, con el servidor de antes, se guarda solo', () => {
    const texto = 'Somos Hierba Sana, tienda naturista en La Merced. Delivery en Lima S/ 15.'
    const vm = vmCon({ iaVentasContexto: texto })
    abrir(vm, '/administrador/leads/vendedor?tab=conocimiento')

    // Plegado muestra el inicio; abierto, el texto entero tal cual.
    fireEvent.click(screen.getByRole('button', { name: /Texto general/ }))
    const area = screen.getByDisplayValue(texto) as HTMLTextAreaElement
    fireEvent.change(area, { target: { value: texto + ' Recojo gratis.' } })

    const boton = screen.getByRole('button', { name: /Guardar cambios/ }) as HTMLButtonElement
    expect(boton.disabled).toBe(false)
    fireEvent.click(boton)
    expect(vm.actions.guardarConfig).toHaveBeenCalledWith({
      iaVentasContexto: texto + ' Recojo gratis.',
      iaVentasBrochureUrl: '',
    })
  })
})
