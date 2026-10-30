/**
 * Chat de la tienda con el vendedor IA (2026-10-30): aparece solo si la tienda
 * lo encendió, manda lo que escribe el cliente con el producto que mira y las
 * fotos de producto traen "Agregar al carrito".
 */
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'

const getMock = jest.fn()
const postMock = jest.fn()
jest.mock('axios', () => ({
  __esModule: true,
  default: { get: (...a: unknown[]) => getMock(...a), post: (...a: unknown[]) => postMock(...a) },
}))
jest.mock('@iconify/react', () => ({ Icon: () => null }))

import ChatTiendaIa from '../ChatTiendaIa'
import { trozosDeTexto, ubicacionEnTienda, unirMensajes } from '../chatTienda'
import { canalDe, contactoVisible, nombreVisible, sinTelefono } from '@/features/admin/leads/LeadsModel'

function Donde() {
  const l = useLocation()
  return <span data-testid="ruta">{l.pathname + l.search}</span>
}

const montar = (ruta: string) =>
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <ChatTiendaIa />
      <Routes>
        <Route path="*" element={<Donde />} />
      </Routes>
    </MemoryRouter>,
  )

const TIENDA = (activo: boolean) => ({
  data: { data: { nombreComercial: 'Moda Ana', colorPrimario: '#7c3aed', chatIa: { activo, asesor: activo ? 'Nicky' : null } } },
})

beforeEach(() => {
  getMock.mockReset()
  postMock.mockReset()
  localStorage.clear()
  // Cada test con su propia tienda: la configuración se cachea por slug.
})

describe('reglas', () => {
  it('lee tienda y producto de la URL', () => {
    expect(ubicacionEnTienda('/tienda/moda-ana')).toEqual({ slug: 'moda-ana', productoId: null, enCheckout: false })
    expect(ubicacionEnTienda('/tienda/moda-ana/producto/55/polo-negro')).toEqual({ slug: 'moda-ana', productoId: 55, enCheckout: false })
    expect(ubicacionEnTienda('/tienda/moda-ana/checkout')?.enCheckout).toBe(true)
    expect(ubicacionEnTienda('/administrador/leads')).toBeNull()
    expect(ubicacionEnTienda('/tienda/login')).toBeNull()
  })

  it('negrita y enlaces sin HTML', () => {
    expect(trozosDeTexto('Precio *S/39.90* ver https://x.pe/p.')).toEqual([
      { tipo: 'texto', valor: 'Precio ' },
      { tipo: 'negrita', valor: 'S/39.90' },
      { tipo: 'texto', valor: ' ver ' },
      { tipo: 'enlace', valor: 'https://x.pe/p' },
      { tipo: 'texto', valor: '.' },
    ])
    expect(trozosDeTexto('<img src=x onerror=alert(1)>')).toEqual([{ tipo: 'texto', valor: '<img src=x onerror=alert(1)>' }])
  })

  it('no repite el mensaje propio cuando el servidor ya lo tiene', () => {
    const base = { tipo: 'TEXTO', url: null, productoId: null, opciones: null, creadoEn: '' }
    const srv = [{ ...base, id: 'u1', de: 'cliente', texto: 'hola', clienteId: 'abc' }] as any
    const pend = [
      { ...base, id: 'p1', de: 'cliente', texto: 'hola', clienteId: 'abc', pendiente: true },
      { ...base, id: 'p2', de: 'cliente', texto: 'otro', clienteId: 'def', pendiente: true },
    ] as any
    expect(unirMensajes(srv, pend).map((m) => m.id)).toEqual(['u1', 'p2'])
  })

  it('bandeja: el cliente de la tienda se ve como "Tienda web"', () => {
    expect(contactoVisible('web:abc')).toBe('Tienda web')
    expect(nombreVisible(null, 'web:abc')).toBe('Cliente de la tienda')
    expect(canalDe('web:abc').nombre).toBe('Tienda web')
    expect(sinTelefono('web:abc')).toBe(true)
  })
})

describe('widget', () => {
  it('no aparece si la tienda no lo encendió', async () => {
    getMock.mockResolvedValue(TIENDA(false))
    montar('/tienda/sin-chat')
    await waitFor(() => expect(getMock).toHaveBeenCalled())
    expect(screen.queryByTestId('chat-tienda-abrir')).not.toBeInTheDocument()
  })

  it('manda lo que escribe con el producto que mira', async () => {
    getMock.mockImplementation((url: string) =>
      url.endsWith('/chat')
        ? Promise.resolve({ data: { data: { mensajes: [], escribiendo: false, atiendePersona: false } } })
        : Promise.resolve(TIENDA(true)),
    )
    postMock.mockResolvedValue({ data: { data: { clienteId: 'c1' } } })
    montar('/tienda/con-chat/producto/55/polo')
    fireEvent.click(await screen.findByTestId('chat-tienda-abrir'))
    expect(screen.getByText(/Soy Nicky/)).toBeInTheDocument()
    fireEvent.change(screen.getByTestId('chat-tienda-texto'), { target: { value: '¿hay talla M?' } })
    fireEvent.click(screen.getByTestId('chat-tienda-enviar'))
    await waitFor(() =>
      expect(postMock).toHaveBeenCalledWith(
        expect.stringMatching(/public\/store\/con-chat\/chat$/),
        expect.objectContaining({ texto: '¿hay talla M?', productoId: 55, sesion: expect.any(String) }),
      ),
    )
    expect(screen.getByText('¿hay talla M?')).toBeInTheDocument()
    expect(await screen.findByTestId('chat-tienda-escribiendo')).toBeInTheDocument()
  })

  it('la foto de un producto agrega al carrito desde la portada', async () => {
    getMock.mockImplementation((url: string) =>
      url.endsWith('/chat')
        ? Promise.resolve({
            data: {
              data: {
                mensajes: [
                  { id: 's1', de: 'tienda', tipo: 'IMAGEN', texto: 'Polo — S/39.90', url: 'https://x/p.jpg', productoId: 77, opciones: null, clienteId: null, creadoEn: '2026-10-30T10:00:00Z' },
                ],
                escribiendo: false,
                atiendePersona: true,
              },
            },
          })
        : Promise.resolve(TIENDA(true)),
    )
    montar('/tienda/carrito-chat/catalogo')
    fireEvent.click(await screen.findByTestId('chat-tienda-abrir'))
    expect(await screen.findByText('Te atiende una persona del equipo')).toBeInTheDocument()
    fireEvent.click(await screen.findByTestId('chat-tienda-agregar'))
    expect(screen.getByTestId('ruta')).toHaveTextContent('/tienda/carrito-chat?product=77&carrito=1')
  })

  it('si el servidor lo frena, devuelve el texto y explica', async () => {
    getMock.mockImplementation((url: string) =>
      url.endsWith('/chat')
        ? Promise.resolve({ data: { data: { mensajes: [], escribiendo: false, atiendePersona: false } } })
        : Promise.resolve(TIENDA(true)),
    )
    postMock.mockRejectedValue({ response: { data: { message: 'Estás escribiendo muy rápido. Espera un momento.' } } })
    montar('/tienda/rapido')
    fireEvent.click(await screen.findByTestId('chat-tienda-abrir'))
    fireEvent.change(screen.getByTestId('chat-tienda-texto'), { target: { value: 'hola' } })
    fireEvent.click(screen.getByTestId('chat-tienda-enviar'))
    expect(await screen.findByText(/muy rápido/)).toBeInTheDocument()
    expect(screen.getByTestId('chat-tienda-texto')).toHaveValue('hola')
  })
})
