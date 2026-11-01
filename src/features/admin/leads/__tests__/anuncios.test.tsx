/**
 * De qué anuncio vino cada cliente (2026-10-21): WhatsApp mandaba la etiqueta
 * del anuncio en el primer mensaje y se descartaba, así que el negocio pagaba
 * publicidad sin saber cuál le traía ventas.
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
}))
jest.mock('@iconify/react', () => ({ Icon: () => null }))

import { BiPanel } from '../BiPanel'
import { BandejaChats } from '../BandejaChats'

const BI = {
  productos: { disponibles: [], noHabidos: [], totalConsultas: 3, porcentajeSinStock: 0 },
  malestares: [],
  conversaciones: 12,
  pedidos: 2,
  tasaConversion: 16.7,
  vendido: 230,
  ticketPromedio: 115,
  descuentosOtorgados: 0,
  pesoDescuentos: 0,
  porEtapa: [],
  demografia: {
    sexo: { hombres: 0, mujeres: 0, sinDato: 0 },
    edades: [],
    ubicacion: { lima: 0, provincia: 0, recojo: 0, sinDato: 0 },
    topDistritos: [],
  },
}

beforeEach(() => getMock.mockReset())

describe('qué anuncio te trajo ventas', () => {
  it('muestra cada anuncio con sus conversaciones, ventas y lo vendido', async () => {
    getMock.mockResolvedValue({
      data: {
        data: {
          ...BI,
          anuncios: {
            filas: [
              { anuncioId: '1202', tipo: 'ad', titulo: 'Zapatillas rojas 2x1', url: 'https://fb.me/2ABC', imagenUrl: null, conversaciones: 8, pedidos: 2, vendido: 230, conversion: 25 },
              { anuncioId: '1203', tipo: 'ad', titulo: null, url: null, imagenUrl: null, conversaciones: 3, pedidos: 0, vendido: 0, conversion: 0 },
            ],
            conversacionesPorAnuncio: 11,
            conversacionesSinAnuncio: 1,
          },
        },
      },
    })
    render(<BiPanel />)
    const fila = await screen.findByTestId('anuncio-1202')
    expect(fila).toHaveTextContent('Zapatillas rojas 2x1')
    expect(fila).toHaveTextContent('8')
    expect(fila).toHaveTextContent('25%')
    expect(fila).toHaveTextContent('S/ 230.00')
    expect(screen.getByRole('link', { name: 'Ver anuncio' })).toHaveAttribute('href', 'https://fb.me/2ABC')
    // Sin título ni enlace: se muestra igual, con su id para buscarlo en Meta.
    expect(screen.getByTestId('anuncio-1203')).toHaveTextContent('Anuncio sin título')
    expect(screen.getByTestId('anuncio-1203')).toHaveTextContent('1203')
    expect(screen.getByText('11 conversaciones llegaron por un anuncio · 1 escribieron directo')).toBeInTheDocument()
  })

  it('TikTok sale como una fila más', async () => {
    getMock.mockResolvedValue({
      data: {
        data: {
          ...BI,
          anuncios: {
            filas: [{ anuncioId: 'tiktok', tipo: 'tiktok', titulo: 'TikTok', url: null, imagenUrl: null, conversaciones: 4, pedidos: 1, vendido: 99, conversion: 25 }],
            conversacionesPorAnuncio: 4,
            conversacionesSinAnuncio: 8,
          },
        },
      },
    })
    render(<BiPanel />)
    const fila = await screen.findByTestId('anuncio-tiktok')
    expect(fila).toHaveTextContent('TikTok')
    expect(fila).toHaveTextContent('Anuncios, videos y perfil de TikTok')
    expect(fila).toHaveTextContent('S/ 99.00')
  })

  it('sin anuncios todavía, explica desde cuándo se cuenta', async () => {
    getMock.mockResolvedValue({
      data: { data: { ...BI, anuncios: { filas: [], conversacionesPorAnuncio: 0, conversacionesSinAnuncio: 12 } } },
    })
    render(<BiPanel />)
    expect(await screen.findByTestId('anuncios-vacio')).toHaveTextContent(/lo de antes no quedó guardado/)
  })

  it('con el backend de antes (sin anuncios) no rompe ni muestra la tarjeta', async () => {
    getMock.mockResolvedValue({ data: { data: BI } })
    render(<BiPanel />)
    await waitFor(() => expect(screen.getByText('El negocio')).toBeInTheDocument())
    expect(screen.queryByText('Qué anuncio te trajo ventas')).not.toBeInTheDocument()
  })
})

describe('en la bandeja de chats', () => {
  const PROSPECTO: any = {
    id: 7,
    telefonoProspecto: '51987654321',
    nombreProspecto: 'Rosa Quispe',
    puntaje: 40,
    estado: 'TIBIO',
    presupuesto: 0,
    autoridad: 0,
    necesidad: 0,
    plazo: 0,
    resumen: null,
    puntosClave: [],
    proximaAccion: null,
    botActivo: true,
    cotizacion: null,
    clienteId: null,
    conversacionId: 69,
    actualizadoEn: new Date().toISOString(),
    anuncio: {
      anuncioId: '1202',
      tipo: 'ad',
      titulo: 'Zapatillas rojas 2x1',
      texto: 'Solo esta semana',
      url: 'https://fb.me/2ABC',
      creadoEn: new Date().toISOString(),
    },
  }
  const bandeja = (p: any) => (
    <BandejaChats
      prospectos={[p]}
      chatsDePrueba={[]}
      conversacionAbiertaId={69}
      cargando={false}
      busqueda=""
      onBuscar={() => undefined}
      onAbrir={() => undefined}
      onVerHistorial={() => undefined}
      chat={null}
      prospectoActivo={p}
      etiquetas={[]}
      onPonerEtiqueta={() => undefined}
      onQuitarEtiqueta={() => undefined}
      onCrearEtiqueta={async () => true}
      onEditarEtiqueta={async () => true}
      onEliminarEtiqueta={() => undefined}
    />
  )

  it('el vendedor ve qué anuncio vio el cliente antes de escribir', () => {
    render(bandeja(PROSPECTO))
    expect(screen.getByTestId('ficha-anuncio')).toHaveTextContent('Llegó por un anuncio')
    expect(screen.getByTestId('ficha-anuncio')).toHaveTextContent('Zapatillas rojas 2x1')
    expect(screen.getByTestId('ficha-anuncio')).toHaveTextContent('Solo esta semana')
    expect(screen.getByTitle('Zapatillas rojas 2x1')).toHaveTextContent('Anuncio')
  })

  it('el que llegó desde TikTok se ve como TikTok, con lo que escribió', () => {
    render(
      bandeja({
        ...PROSPECTO,
        anuncio: { anuncioId: 'tiktok', tipo: 'tiktok', titulo: 'TikTok', texto: 'Hola, vengo de TikTok', url: null, creadoEn: new Date().toISOString() },
      }),
    )
    expect(screen.getByTestId('ficha-anuncio')).toHaveTextContent('Llegó desde TikTok')
    expect(screen.getByTestId('ficha-anuncio')).toHaveTextContent('Hola, vengo de TikTok')
    expect(screen.getByTitle('Llegó desde TikTok')).toHaveTextContent('TikTok')
  })

  it('si escribió directo, no aparece nada', () => {
    render(bandeja({ ...PROSPECTO, anuncio: null }))
    expect(screen.queryByTestId('ficha-anuncio')).not.toBeInTheDocument()
  })
})
