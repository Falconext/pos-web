/**
 * Armar un segmento: que cada clic arme exactamente el filtro que dice y que
 * la cuenta muestre por qué a alguien no le llega.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { SegmentoEditor, VistaPreviaSegmento, limpiarFiltros } from '../SegmentoEditor'
import type { FiltrosSegmento } from '@/services/envios.service'

jest.mock('@/hooks/useDebounce', () => ({ useDebounce: (v: unknown) => v }))

const previsualizar = jest.fn()
jest.mock('@/services/envios.service', () => ({
  previsualizarSegmento: (f: unknown) => previsualizar(f),
  buscarProductos: jest.fn().mockResolvedValue([]),
  productosPorId: jest.fn().mockResolvedValue([]),
}))

const ETIQUETAS = [
  { id: 1, nombre: 'Mayorista', color: 'azul' as const, contactos: 2 },
  { id: 2, nombre: 'Cliente VIP', color: 'violeta' as const, contactos: 1 },
]
const OPCIONES = { etapas: ['NUEVO', 'COTIZADO'], anuncios: [], categorias: [{ id: 7, nombre: 'Perfumes' }] }

function Armado({ onFiltros }: { onFiltros: (f: FiltrosSegmento) => void }) {
  const [f, setF] = useState<FiltrosSegmento>({})
  return (
    <SegmentoEditor
      filtros={f}
      onCambiar={(n) => {
        setF(n)
        onFiltros(n)
      }}
      etiquetas={ETIQUETAS}
      opciones={OPCIONES}
    />
  )
}

it('limpiarFiltros deja {} cuando no hay nada elegido', () => {
  expect(limpiarFiltros({ etiquetas: undefined, canales: [], actividad: {} })).toEqual({})
})

it('etiqueta + "compraron" + categoría arman el filtro esperado', () => {
  const onFiltros = jest.fn()
  render(<Armado onFiltros={onFiltros} />)
  fireEvent.click(screen.getAllByText('Mayorista')[0])
  fireEvent.click(screen.getByText('Compraron'))
  fireEvent.click(screen.getByText('Perfumes'))
  expect(onFiltros).toHaveBeenLastCalledWith({
    etiquetas: { incluir: [1], modo: 'alguna' },
    compras: { estado: 'compro', categoriaIds: [7] },
  })
})

it('excluir una etiqueta la saca de las incluidas', () => {
  const onFiltros = jest.fn()
  render(<Armado onFiltros={onFiltros} />)
  fireEvent.click(screen.getAllByText('Mayorista')[0])
  fireEvent.click(screen.getByLabelText('Excluir Mayorista'))
  expect(onFiltros).toHaveBeenLastCalledWith({ etiquetas: { excluir: [1] } })
})

it('la vista previa muestra cuántos reciben y por qué no los demás', async () => {
  previsualizar.mockResolvedValue({
    cumplen: 5,
    recibiran: 3,
    excluidos: { BAJA: 1, TOPE: 1, SIN_VENTANA: 0, INTERNO: 0 },
    porCanal: { WHATSAPP: 3 },
    muestra: [],
  })
  render(<VistaPreviaSegmento filtros={{}} />)
  await waitFor(() => expect(screen.getByText('3')).toBeInTheDocument())
  expect(screen.getByText('de 5 que cumplen el filtro')).toBeInTheDocument()
  expect(screen.getByText('Pidieron la baja')).toBeInTheDocument()
  expect(screen.getByText('Ya recibieron el máximo del mes')).toBeInTheDocument()
  expect(screen.queryByText('Números del negocio')).not.toBeInTheDocument()
})
