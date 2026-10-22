/**
 * La bandeja de conversaciones, desde el lado de quien la usa.
 *
 * Lo que se defiende acá es lo que se vino a arreglar:
 *
 *  1. QUE "TOMAR CHAT" SE VEA. El botón existía, pero vivía al final de una
 *     cabecera larga dentro de un cajón de 440px: el empresario preguntó
 *     dónde estaba el "encendido y apagado del chat" porque no lo encontraba.
 *     Si vuelve a quedar fuera de la cabecera, este test cae.
 *  2. QUE PAUSE DE VERDAD. Apretarlo tiene que llamar al backend con
 *     activo=false, que es lo que hace que la IA deje de contestarle al
 *     cliente mientras habla el vendedor.
 *  3. QUE SE PUEDA SALTAR DE UN CHAT A OTRO sin cerrar el anterior.
 */
import { render, screen, waitFor, fireEvent } from '@testing-library/react'

const alertMock = jest.fn()
jest.mock('@/zustand/alert', () => ({
  __esModule: true,
  default: () => ({ alert: alertMock, loading: false }),
}))

const PROSPECTO = {
  id: 7,
  telefonoProspecto: '51987654321',
  nombreProspecto: 'Rosa Quispe',
  puntaje: 82,
  estado: 'CALIENTE',
  presupuesto: 25,
  autoridad: 18,
  necesidad: 22,
  plazo: 17,
  resumen: 'Quiere 3 frascos de uña de gato',
  puntosClave: ['Pregunta por envío a Arequipa'],
  proximaAccion: 'Confirmar dirección de la agencia',
  botActivo: true,
  cotizacion: null,
  clienteId: null,
  conversacionId: 69,
  actualizadoEn: new Date().toISOString(),
}

const OTRO = {
  ...PROSPECTO,
  id: 8,
  nombreProspecto: 'Luis Ramos',
  telefonoProspecto: '51911112222',
  conversacionId: 70,
  puntaje: 40,
  estado: 'TIBIO',
}

const conversacion = (id: number, nombre: string, botActivo = true) => ({
  id,
  botActivo,
  telefonoProspecto: id === 69 ? PROSPECTO.telefonoProspecto : OTRO.telefonoProspecto,
  nombreProspecto: nombre,
  cantidadMensajes: 1,
  mensajes: [
    { id: 1, rol: 'USUARIO', contenido: `hola soy ${nombre}`, creadoEn: new Date().toISOString() },
  ],
  prospecto: { ...(id === 69 ? PROSPECTO : OTRO), botActivo },
})

/** Un chat del propio negocio probando el bot: no genera lead. */
const CHAT_DE_PRUEBA = {
  id: 90,
  telefonoProspecto: '51919755320',
  nombreProspecto: 'StiloColecta',
  cantidadMensajes: 2,
  botActivo: true,
  prospecto: null,
  mensajes: [
    { id: 9, rol: 'USUARIO', contenido: 'hola', creadoEn: new Date().toISOString() },
  ],
}

const api = {
  fetchProspectos: jest.fn().mockResolvedValue([PROSPECTO, OTRO]),
  fetchResumen: jest.fn().mockResolvedValue({ total: 2 }),
  fetchConversaciones: jest.fn().mockResolvedValue([CHAT_DE_PRUEBA]),
  fetchConfig: jest.fn().mockResolvedValue({ iaVentasActiva: true }),
  fetchConversacion: jest.fn((id: number) =>
    Promise.resolve(
      id === 90
        ? CHAT_DE_PRUEBA
        : conversacion(id, id === 69 ? 'Rosa Quispe' : 'Luis Ramos'),
    ),
  ),
  setBotActivo: jest.fn().mockResolvedValue({}),
  eliminarConversacion: jest.fn(),
  fetchDocumentos: jest.fn().mockResolvedValue([]),
}
jest.mock('@/services/leads.service', () => api)

import { MemoryRouter } from 'react-router-dom'
import LeadsView from '../LeadsView'

/** Chats es su propia página desde que cada vista tiene entrada en el menú. */
const Bandeja = () => (
  <MemoryRouter>
    <LeadsView vista="conversaciones" />
  </MemoryRouter>
)

/** Sin CSS, la lista y la cabecera del chat pintan el mismo nombre; en pantalla
 *  están en columnas distintas, así que acá basta con el primero. */
const primero = (texto: string | RegExp) => screen.getAllByText(texto)[0]

beforeEach(() => jest.clearAllMocks())

describe('bandeja de conversaciones', () => {
  it('lista los chats sin que haya que abrir ninguno', async () => {
    render(<Bandeja />)
    await waitFor(() => expect(primero('Rosa Quispe')).toBeInTheDocument())
    expect(primero('Luis Ramos')).toBeInTheDocument()
  })

  it('al abrir un chat muestra "Tomar chat" y la ficha del cliente', async () => {
    render(<Bandeja />)
    await waitFor(() => expect(primero('Rosa Quispe')).toBeInTheDocument())

    fireEvent.click(primero('Rosa Quispe'))

    await waitFor(() => expect(screen.getByText('Tomar chat')).toBeInTheDocument())
    // La ficha ya no es un segundo cajón que tapaba al chat.
    expect(primero(/Confirmar dirección de la agencia/)).toBeInTheDocument()
    expect(primero('82')).toBeInTheDocument()
  })

  it('"Tomar chat" pausa la IA en ese chat', async () => {
    render(<Bandeja />)
    await waitFor(() => expect(primero('Rosa Quispe')).toBeInTheDocument())
    fireEvent.click(primero('Rosa Quispe'))
    await waitFor(() => expect(screen.getByText('Tomar chat')).toBeInTheDocument())

    fireEvent.click(screen.getByText('Tomar chat'))

    // Por conversación (69), no por prospecto (7).
    await waitFor(() => expect(api.setBotActivo).toHaveBeenCalledWith(69, false))
    // Y el botón pasa a ofrecer lo contrario: devolverle el chat a la IA.
    await waitFor(() => expect(screen.getByText('Devolver a la IA')).toBeInTheDocument())
  })

  /**
   * El reclamo del empresario, literal: "antes se quedaba arriba y se perdía".
   * El interruptor de la IA tiene que seguir a la vista mientras se baja a leer
   * los mensajes, y eso se cumple si el botón NO vive dentro del contenedor que
   * scrollea. Si alguien lo mete de vuelta en la lista de mensajes —o le quita
   * el scroll propio a esa lista y deja que scrollee toda la columna— este test
   * cae antes de que lo vuelva a notar él.
   */
  it('el botón de la IA no se va con el scroll de los mensajes', async () => {
    render(<Bandeja />)
    await waitFor(() => expect(primero('Rosa Quispe')).toBeInTheDocument())
    fireEvent.click(primero('Rosa Quispe'))

    const boton = await screen.findByText('Tomar chat')
    expect(boton.closest('.overflow-y-auto')).toBeNull()

    // Y los mensajes sí tienen su propia caja con scroll: es lo que hace que
    // la cabecera se quede quieta en vez de irse hacia arriba.
    const mensaje = primero(/hola soy Rosa Quispe/)
    expect(mensaje.closest('.overflow-y-auto')).not.toBeNull()
  })

  /**
   * "¿dónde está? no lo veo" — lo preguntó mirando un chat de prueba.
   *
   * El interruptor dependía de que la conversación tuviera prospecto, y los
   * chats del propio negocio no lo tienen a propósito (para no ensuciar el
   * embudo). O sea: no había botón justo en los chats que usa para probar su
   * bot, que son los únicos donde él necesita tomar el control.
   */
  it('también aparece en un chat de prueba, que no tiene lead', async () => {
    render(<Bandeja />)
    await waitFor(() => expect(primero('StiloColecta')).toBeInTheDocument())

    fireEvent.click(primero('StiloColecta'))

    await waitFor(() => expect(screen.getByText('Tomar chat')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Tomar chat'))
    await waitFor(() => expect(api.setBotActivo).toHaveBeenCalledWith(90, false))
  })

  it('se salta de un chat a otro sin cerrar el anterior', async () => {
    render(<Bandeja />)
    await waitFor(() => expect(primero('Rosa Quispe')).toBeInTheDocument())

    fireEvent.click(primero('Rosa Quispe'))
    await waitFor(() => expect(api.fetchConversacion).toHaveBeenCalledWith(69))

    fireEvent.click(primero('Luis Ramos'))
    await waitFor(() => expect(api.fetchConversacion).toHaveBeenCalledWith(70))
  })
})
