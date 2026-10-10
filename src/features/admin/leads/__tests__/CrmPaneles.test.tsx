/**
 * E2/E3 — QA de render del BI y de la ficha 360°.
 *
 * Lo que se protege: que el "sin dato" se muestre como lo que es (y no como
 * un cero que invita a leerlo mal), y que la unión de dos números por DNI se
 * diga en pantalla — si no, los pedidos "de otro chat" parecen un error.
 */
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

const getMock = jest.fn()
jest.mock('@/utils/apiClient', () => ({
  __esModule: true,
  default: { get: (u: string) => getMock(u) },
}))
jest.mock('@/zustand/alert', () => ({
  __esModule: true,
  default: () => ({ alert: jest.fn() }),
  useAlertStore: () => ({ alert: jest.fn() }),
}))
jest.mock('@iconify/react', () => ({ Icon: () => null }))

import { BiPanel } from '../BiPanel'
import { Ficha360 } from '../Ficha360'

const BI = {
  productos: {
    disponibles: [{ texto: 'moringa', veces: 12 }],
    noHabidos: [
      { texto: 'naturplus 3000', veces: 5 },
      { texto: 'omega 7', veces: 2 },
    ],
    totalConsultas: 19,
    porcentajeSinStock: 36.8,
  },
  malestares: [{ texto: 'gastritis', veces: 7 }],
  conversaciones: 40,
  pedidos: 10,
  tasaConversion: 25,
  vendido: 1340.5,
  ticketPromedio: 134.05,
  descuentosOtorgados: 90,
  pesoDescuentos: 6.3,
  porEtapa: [],
  demografia: {
    sexo: { hombres: 8, mujeres: 21, sinDato: 11 },
    edades: [
      { etiqueta: '18-29', total: 3 },
      { etiqueta: '30-44', total: 9 },
      { etiqueta: '45-59', total: 14 },
      { etiqueta: '60+', total: 4 },
      { etiqueta: 'sin dato', total: 10 },
    ],
    ubicacion: { lima: 22, provincia: 14, recojo: 2, sinDato: 2 },
    topDistritos: [{ lugar: 'SJL', total: 6 }],
  },
}

beforeEach(() => getMock.mockReset())

describe('el panel de analítica', () => {
  it('pone primero lo accionable: lo que piden y no hay', async () => {
    getMock.mockResolvedValue({ data: { data: BI } })
    render(<BiPanel />)
    await waitFor(() =>
      expect(screen.getByText(/lo que piden y no tenemos/i)).toBeInTheDocument(),
    )
    expect(screen.getByText('naturplus 3000')).toBeInTheDocument()
    expect(
      screen.getByText(/36.8% de las búsquedas se fueron sin nada/i),
    ).toBeInTheDocument()
  })

  it('trae las métricas del negocio con sus unidades', async () => {
    getMock.mockResolvedValue({ data: { data: BI } })
    render(<BiPanel />)
    await waitFor(() => expect(screen.getByText('25%')).toBeInTheDocument())
    expect(screen.getByText('S/ 134.05')).toBeInTheDocument()
    expect(screen.getByText('S/ 90.00')).toBeInTheDocument()
    expect(screen.getByText(/6.3% del total/i)).toBeInTheDocument()
  })

  it('explica el "sin dato" en vez de dejarlo pasar por un cero', async () => {
    getMock.mockResolvedValue({ data: { data: BI } })
    render(<BiPanel />)
    await waitFor(() =>
      expect(screen.getByText(/no se adivinan/i)).toBeInTheDocument(),
    )
  })

  it('sin datos todavía, lo dice sin pintar métricas vacías como si fueran reales', async () => {
    getMock.mockResolvedValue({
      data: {
        data: {
          ...BI,
          productos: { disponibles: [], noHabidos: [], totalConsultas: 0, porcentajeSinStock: 0 },
          malestares: [],
          conversaciones: 0,
        },
      },
    })
    render(<BiPanel />)
    await waitFor(() =>
      expect(screen.getByText(/todavía no hay conversaciones/i)).toBeInTheDocument(),
    )
  })
})

const FICHA = {
  cliente: {
    id: 1,
    telefonoProspecto: '51900000111',
    nombreProspecto: 'ROSA QUISPE',
    etapa: 'POR_DESPACHAR',
    etapaEn: new Date().toISOString(),
    estado: 'CALIENTE',
    puntaje: 80,
    sexo: 'F',
    edad: 52,
    resumen: null,
    puntosClave: [],
    dni: '44556677',
    telefonos: ['51900000111', '51900000222'],
    unidoPorDni: true,
    conversacionId: 9,
  },
  pedidos: [
    {
      comprobanteId: 5,
      comprobante: 'NV01-8',
      monto: 139,
      descuento: 10,
      estadoPago: 'PAGADO',
      fecha: new Date().toISOString(),
      destino: 'Lima · SJL',
    },
  ],
  resumenCompras: { cantidad: 1, gastado: 139, ticketPromedio: 139, ultimaCompra: null },
  consultasDeSalud: [{ texto: 'gastritis', tipo: 'MALESTAR', hubo: true, creadoEn: new Date().toISOString() }],
  productosConsultados: [],
  noHabidos: [{ texto: 'naturplus 3000', tipo: 'PRODUCTO', hubo: false, creadoEn: new Date().toISOString() }],
  historialEtapas: [
    { desde: 'COTIZADO', hacia: 'POR_DESPACHAR', actor: 'ROSA (ENCARGADA)', nota: 'Pago validado', creadoEn: new Date().toISOString() },
  ],
  comprobantesPago: [
    { id: 7, url: 'https://s3/v.webp', recibidoEn: new Date().toISOString(), validadoEn: new Date().toISOString(), validadoPor: 'ROSA (ENCARGADA)' },
  ],
}

describe('la ficha 360°', () => {
  const montar = (ficha: unknown = FICHA, duplicados: unknown[] = []) => {
    getMock.mockImplementation((u: string) =>
      Promise.resolve({
        data: { data: u.includes('posibles-duplicados') ? duplicados : ficha },
      }),
    )
    return render(<Ficha360 telefono="51900000111" onCerrar={() => {}} />)
  }

  it('dice en pantalla que el historial está unido por DNI', async () => {
    montar()
    const aviso = await screen.findByTestId('aviso-union')
    expect(aviso).toHaveTextContent('2 números con el mismo DNI')
  })

  it('muestra compras, con qué llegó y qué pidió que no había', async () => {
    montar()
    await waitFor(() => expect(screen.getByText('NV01-8')).toBeInTheDocument())
    expect(screen.getByText('gastritis')).toBeInTheDocument()
    expect(screen.getByText('naturplus 3000')).toBeInTheDocument()
    // La razón de ser de esa lista: cuando llegue el stock, hay a quién avisar.
    expect(screen.getByText(/este cliente lo estaba buscando/i)).toBeInTheDocument()
  })

  it('en el rastro, un movimiento del bot se lee como "automático"', async () => {
    montar({
      ...FICHA,
      historialEtapas: [
        { desde: null, hacia: 'COTIZADO', actor: 'bot', nota: null, creadoEn: new Date().toISOString() },
      ],
    })
    await waitFor(() => expect(screen.getByText('automático')).toBeInTheDocument())
  })

  it('dice quién validó el pago', async () => {
    montar()
    await waitFor(() =>
      expect(screen.getByText(/validado por ROSA \(ENCARGADA\)/i)).toBeInTheDocument(),
    )
  })

  it('los nombres parecidos se presentan como sugerencia, no como un hecho', async () => {
    montar(FICHA, [{ telefono: '51900000333', nombre: 'ROSA QUISPE H', parecido: 0.72 }])
    await waitFor(() =>
      expect(screen.getByText(/solo el DNI une solo/i)).toBeInTheDocument(),
    )
    expect(screen.getByText('72% parecido')).toBeInTheDocument()
  })

  it('un número sin historial lo dice, no muestra una ficha vacía', async () => {
    montar(null)
    await waitFor(() =>
      expect(screen.getByText(/todavía no tiene historial/i)).toBeInTheDocument(),
    )
  })
})
