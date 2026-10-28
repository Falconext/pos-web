/**
 * Etiquetas en la bandeja: ponerlas, quitarlas y filtrar por ellas.
 *
 * Lo que se defiende es lo que hace que sirvan para un envío masivo: que
 * escribir el nombre de una etiqueta que ya existe la REUTILICE en vez de
 * crear otra, y que el filtro deje en la lista solo a quienes la tienen.
 */
import { render, screen, fireEvent, within } from '@testing-library/react'
import { BandejaChats } from '../BandejaChats'

const base = {
  empresaId: 1,
  estado: 'TIBIO',
  puntaje: 40,
  presupuesto: 0,
  autoridad: 0,
  necesidad: 0,
  plazo: 0,
  resumen: null,
  puntosClave: [],
  proximaAccion: null,
  botActivo: true,
  notificadoEn: null,
  cotizacion: null,
  cotizacionId: null,
  clienteId: null,
  creadoEn: new Date().toISOString(),
  actualizadoEn: new Date().toISOString(),
}

const MAYORISTA = { id: 1, nombre: 'Mayorista', color: 'azul' as const }
const VIP = { id: 2, nombre: 'Cliente VIP', color: 'violeta' as const }

const ROSA: any = {
  ...base,
  id: 7,
  nombreProspecto: 'Rosa Quispe',
  telefonoProspecto: '51987654321',
  conversacionId: 69,
  etiquetas: [MAYORISTA],
}
const LUIS: any = {
  ...base,
  id: 8,
  nombreProspecto: 'Luis Ramos',
  telefonoProspecto: '51911112222',
  conversacionId: 70,
  etiquetas: [],
}

function armar(activo: any = ROSA) {
  const onPoner = jest.fn()
  const onQuitar = jest.fn()
  render(
    <BandejaChats
      prospectos={[ROSA, LUIS]}
      chatsDePrueba={[]}
      conversacionAbiertaId={activo.conversacionId}
      cargando={false}
      busqueda=""
      onBuscar={() => undefined}
      onAbrir={() => undefined}
      onVerHistorial={() => undefined}
      chat={null}
      prospectoActivo={activo}
      etiquetas={[
        { ...MAYORISTA, contactos: 1 },
        { ...VIP, contactos: 0 },
      ]}
      onPonerEtiqueta={onPoner}
      onQuitarEtiqueta={onQuitar}
      onCrearEtiqueta={async () => true}
      onEditarEtiqueta={async () => true}
      onEliminarEtiqueta={() => undefined}
    />,
  )
  return { onPoner, onQuitar }
}

/** La fila de la lista (el nombre también sale en la ficha de al lado). */
const fila = (nombre: string) =>
  screen.queryAllByText(nombre).map((n) => n.closest('button')).find(Boolean) ?? null

it('la fila del chat muestra sus etiquetas', () => {
  armar()
  const filaRosa = fila('Rosa Quispe')!
  expect(within(filaRosa).getByText('Mayorista')).toBeInTheDocument()
})

it('filtrar por etiqueta deja solo a quienes la tienen', () => {
  armar()
  fireEvent.click(screen.getByLabelText('Filtrar por etiqueta'))
  const menu = screen.getByText('Todas').closest('div')!
  fireEvent.click(within(menu).getByText('Mayorista'))
  expect(fila('Rosa Quispe')).not.toBeNull()
  expect(fila('Luis Ramos')).toBeNull()
})

it('escribir una etiqueta que ya existe la reutiliza, no crea otra', () => {
  const { onPoner } = armar(LUIS)
  fireEvent.click(screen.getByText('Agregar etiqueta'))
  const input = screen.getByLabelText('Buscar o crear etiqueta')
  fireEvent.change(input, { target: { value: 'cliente vip' } })
  expect(screen.queryByText(/Crear «/)).not.toBeInTheDocument()
  fireEvent.keyDown(input, { key: 'Enter' })
  expect(onPoner).toHaveBeenCalledWith(70, { etiquetaId: 2 })
})

it('un nombre nuevo ofrece crearla y la pone en el chat', () => {
  const { onPoner } = armar(LUIS)
  fireEvent.click(screen.getByText('Agregar etiqueta'))
  fireEvent.change(screen.getByLabelText('Buscar o crear etiqueta'), {
    target: { value: 'Talla 38' },
  })
  fireEvent.click(screen.getByText('Crear «Talla 38»'))
  expect(onPoner).toHaveBeenCalledWith(70, expect.objectContaining({ nombre: 'Talla 38' }))
})

it('la X del chip quita la etiqueta del chat', () => {
  const { onQuitar } = armar()
  fireEvent.click(screen.getByLabelText('Quitar la etiqueta Mayorista'))
  expect(onQuitar).toHaveBeenCalledWith(69, 1)
})

it('si el chat ya tiene una parecida, Enter no crea un casi-duplicado', () => {
  const { onPoner } = armar()
  fireEvent.click(screen.getByText('Agregar'))
  const input = screen.getByLabelText('Buscar o crear etiqueta')
  fireEvent.change(input, { target: { value: 'mayor' } })
  expect(screen.getByText('ya la tiene')).toBeInTheDocument()
  fireEvent.keyDown(input, { key: 'Enter' })
  expect(onPoner).not.toHaveBeenCalled()
})
