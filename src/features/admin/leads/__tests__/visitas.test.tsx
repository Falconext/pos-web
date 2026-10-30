/**
 * Visitas a la tienda física (Hierba Sana, 26-10).
 *
 * Lo que se protege: que las próximas salgan agrupadas por día (Hoy, Mañana…),
 * que se vea si dejó reserva y si ya le llegó cómo llegar, que "Vino" y
 * "Reenviar cómo llegar" pidan lo correcto, y que cuando no se pudo reenviar
 * se muestre el motivo del servidor. En Mi vendedor, que la tienda se guarde
 * entera, que un link nuevo no arrastre las coordenadas del anterior y que la
 * foto se guarde sola al subirla.
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router-dom'

const getMock = jest.fn()
const patchMock = jest.fn()
const postMock = jest.fn()
const alertMock = jest.fn()

jest.mock('@/utils/apiClient', () => ({
  __esModule: true,
  default: {
    get: (u: string) => getMock(u),
    patch: (u: string, b: unknown) => patchMock(u, b),
    post: (u: string, b: unknown) => postMock(u, b),
  },
}))
jest.mock('@/zustand/alert', () => ({
  __esModule: true,
  default: () => ({ alert: alertMock }),
  useAlertStore: () => ({ alert: alertMock }),
}))
jest.mock('@iconify/react', () => ({ Icon: () => null }))
jest.mock('../LeadsView', () => ({
  ConfigForm: () => <div>config-form</div>,
  EntrenarPanel: () => <div>entrenar</div>,
}))
const subirFotoMock = jest.fn()
jest.mock('@/services/leads.service', () => ({
  ...jest.requireActual('@/services/leads.service'),
  subirFotoTienda: (f: File) => subirFotoMock(f),
}))

import { VisitasPanel, agruparPorDia, etiquetaDia, hoyEnLima } from '../VisitasPanel'
import { MiVendedorPanel } from '../MiVendedorPanel'

const masDias = (iso: string, n: number) => {
  const d = new Date(`${iso}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}
const HOY = hoyEnLima()

const visita = (over: Record<string, unknown> = {}) => ({
  id: 1,
  conversacionId: 40,
  telefono: '51925085731',
  nombre: 'Rosa Quispe',
  cuando: 'hoy en la tarde',
  fecha: HOY,
  estado: 'AGENDADA',
  conPedido: false,
  comprobanteId: null,
  reserva: null,
  indicacionesEnviadas: false,
  resumen: 'Quiere moringa y uña de gato',
  creadoEn: '2026-10-26T15:00:00.000Z',
  ...over,
})

const ok = (data: unknown) => Promise.resolve({ data: { code: 1, message: 'ok', data } })

const montarVisitas = (filas: unknown[], tienda: any = undefined) => {
  getMock.mockImplementation(() => ok(filas))
  return render(
    <MemoryRouter>
      <VisitasPanel tienda={tienda} />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  getMock.mockReset()
  patchMock.mockReset()
  postMock.mockReset()
  alertMock.mockReset()
  subirFotoMock.mockReset()
})

describe('Visitas: días', () => {
  it('dice Hoy, Mañana o el día con nombre', () => {
    expect(etiquetaDia('2026-10-26', '2026-10-26')).toBe('Hoy')
    expect(etiquetaDia('2026-10-27', '2026-10-26')).toBe('Mañana')
    expect(etiquetaDia('2026-10-29', '2026-10-26')).toBe('Jueves 29 de octubre')
  })

  it('agrupa por día sin desordenar', () => {
    const g = agruparPorDia(
      [visita({ id: 1 }), visita({ id: 2 }), visita({ id: 3, fecha: masDias(HOY, 1) })] as any,
      HOY,
    )
    expect(g.map((x) => [x.titulo, x.visitas.length])).toEqual([
      ['Hoy', 2],
      ['Mañana', 1],
    ])
  })
})

describe('Visitas: el panel', () => {
  it('muestra las próximas por día con sus chips y el link al chat', async () => {
    montarVisitas([
      visita({ id: 1, conPedido: true, indicacionesEnviadas: true, reserva: { monto: 50, validada: false } }),
      visita({ id: 2, nombre: 'Juan', telefono: '51999111222', conversacionId: null, fecha: masDias(HOY, 1), cuando: 'mañana temprano' }),
    ])
    expect(await screen.findByText('Rosa Quispe')).toBeInTheDocument()
    expect(getMock).toHaveBeenCalledWith('/leads/crm/visitas?filtro=proximas')
    expect(screen.getByRole('region', { name: 'Hoy' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Mañana' })).toBeInTheDocument()
    expect(screen.getByText('Con pedido')).toBeInTheDocument()
    expect(screen.getByText('Reserva S/ 50 (por validar)')).toBeInTheDocument()
    expect(screen.getByText('Ubicación enviada')).toBeInTheDocument()
    expect(screen.getByText('“mañana temprano”')).toBeInTheDocument()

    const chats = screen.getAllByRole('link', { name: /Abrir chat/ })
    expect(chats[0]).toHaveAttribute('href', '/administrador/leads/chats?conv=40')
    // Sin conversación, la bandeja lo busca por teléfono.
    expect(chats[1]).toHaveAttribute('href', '/administrador/leads/chats?tel=51999111222')
  })

  it('"Vino" marca la visita y recarga', async () => {
    montarVisitas([visita()])
    patchMock.mockImplementation(() => ok({ id: 1, estado: 'VINO' }))
    fireEvent.click(await screen.findByRole('button', { name: /^Vino$/ }))
    await waitFor(() => expect(patchMock).toHaveBeenCalledWith('/leads/crm/visitas/1', { estado: 'VINO' }))
    await waitFor(() => expect(getMock).toHaveBeenCalledTimes(2))
  })

  it('si no se pudo reenviar cómo llegar, muestra el motivo del servidor', async () => {
    montarVisitas([visita()])
    postMock.mockImplementation(() =>
      Promise.reject({ response: { status: 400, data: { code: 0, message: 'No se pudo enviar: revisa la ubicación' } } }),
    )
    fireEvent.click(await screen.findByRole('button', { name: /Reenviar cómo llegar/ }))
    await waitFor(() =>
      expect(alertMock).toHaveBeenCalledWith('No se pudo enviar: revisa la ubicación', 'error'),
    )
    expect(postMock).toHaveBeenCalledWith('/leads/crm/visitas/1/como-llegar', {})
  })

  it('cada pestaña pide su filtro y explica cuando está vacía', async () => {
    montarVisitas([])
    expect(await screen.findByText('Sin visitas aquí')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Con reserva/ }))
    await waitFor(() => expect(getMock).toHaveBeenCalledWith('/leads/crm/visitas?filtro=con_reserva'))
    expect(await screen.findByText(/Nadie dejó un adelanto/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Dicen que vendrán/ }))
    await waitFor(() => expect(getMock).toHaveBeenCalledWith('/leads/crm/visitas?filtro=sin_fecha'))
  })

  it('en pasadas se ve cómo terminó y se puede deshacer', async () => {
    montarVisitas([visita({ estado: 'NO_VINO', fecha: masDias(HOY, -3) })])
    expect(await screen.findByText('No vino')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Vino$/ })).toBeNull()
    patchMock.mockImplementation(() => ok({ id: 1, estado: 'AGENDADA' }))
    fireEvent.click(screen.getByRole('button', { name: /Deshacer/ }))
    await waitFor(() => expect(patchMock).toHaveBeenCalledWith('/leads/crm/visitas/1', { estado: 'AGENDADA' }))
  })

  it('sin cómo llegar configurado, avisa y lleva a Mi vendedor', async () => {
    montarVisitas([], { direccion: '', mapsUrl: '', lat: null, lng: null, indicaciones: '', fotoUrl: '' })
    const link = await screen.findByRole('link', { name: /Configurar mi tienda/ })
    expect(link).toHaveAttribute('href', '/administrador/leads/vendedor?tab=entrega')
  })

  it('con la tienda configurada no molesta con el aviso', async () => {
    montarVisitas([], { direccion: 'Mercado La Merced', mapsUrl: '', lat: null, lng: null, indicaciones: 'Puerta 3', fotoUrl: '' })
    await screen.findByText('Sin visitas aquí')
    expect(screen.queryByRole('link', { name: /Configurar mi tienda/ })).toBeNull()
  })
})

// ─── Mi vendedor → Entrega → Tu tienda física ────────────────────────────────

const TIENDA = {
  direccion: 'Av. Emancipación 687',
  mapsUrl: 'https://www.google.com/maps/place/x/@-12.0501,-77.0302,17z',
  lat: -12.0501,
  lng: -77.0302,
  indicaciones: '',
  fotoUrl: '',
}

function vmCon(config: Record<string, unknown>) {
  return {
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
    actions: {
      guardarConfig: jest.fn(),
      recargarConfig: jest.fn().mockResolvedValue(undefined),
      toggleIaVentas: jest.fn(),
      abrirEntrenar: jest.fn(),
    },
  } as any
}

const abrirEntrega = (vm: any) =>
  render(
    <MemoryRouter initialEntries={['/administrador/leads/vendedor?tab=entrega']}>
      <MiVendedorPanel vm={vm} negocio="Hierba Sana" />
    </MemoryRouter>,
  )

describe('Mi vendedor: tu tienda física', () => {
  it('con link guardado y coordenadas, dice que irá como mapa', () => {
    abrirEntrega(vmCon({ tienda: TIENDA }))
    expect(screen.getByText('Tu tienda física')).toBeInTheDocument()
    expect(screen.getByTestId('estado-mapa')).toHaveTextContent('Se enviará como mapa')
  })

  it('sin coordenadas, dice que irá como enlace', () => {
    abrirEntrega(vmCon({ tienda: { ...TIENDA, mapsUrl: 'https://maps.app.goo.gl/abc', lat: null, lng: null } }))
    expect(screen.getByTestId('estado-mapa')).toHaveTextContent('Se enviará como enlace')
  })

  it('un link nuevo se guarda sin las coordenadas del anterior y con la tienda entera', () => {
    const vm = vmCon({ tienda: { ...TIENDA, fotoUrl: 'https://s3/foto.jpg' } })
    abrirEntrega(vm)
    fireEvent.change(screen.getByDisplayValue(TIENDA.mapsUrl), { target: { value: ' https://maps.app.goo.gl/nuevo ' } })
    expect(screen.getByTestId('estado-mapa')).toHaveTextContent('Guarda los cambios')
    fireEvent.change(screen.getByPlaceholderText(/Entra al mercado/), { target: { value: 'Puerta 3, al fondo' } })
    fireEvent.click(screen.getByRole('button', { name: /Guardar cambios/ }))
    expect(vm.actions.guardarConfig).toHaveBeenCalledWith({
      tienda: {
        direccion: 'Av. Emancipación 687',
        mapsUrl: 'https://maps.app.goo.gl/nuevo',
        lat: null,
        lng: null,
        indicaciones: 'Puerta 3, al fondo',
        fotoUrl: 'https://s3/foto.jpg',
      },
    })
  })

  it('si solo cambian las indicaciones, conserva las coordenadas', () => {
    const vm = vmCon({ tienda: TIENDA })
    abrirEntrega(vm)
    fireEvent.change(screen.getByPlaceholderText(/Entra al mercado/), { target: { value: 'Puerta 3' } })
    fireEvent.click(screen.getByRole('button', { name: /Guardar cambios/ }))
    expect(vm.actions.guardarConfig.mock.calls[0][0].tienda).toMatchObject({ lat: -12.0501, lng: -77.0302 })
  })

  it('la foto se guarda al subirla y refresca la configuración', async () => {
    const vm = vmCon({ tienda: TIENDA })
    subirFotoMock.mockResolvedValue('https://s3/fachada.jpg')
    abrirEntrega(vm)
    const foto = new File(['x'], 'fachada.jpg', { type: 'image/jpeg' })
    fireEvent.change(screen.getByTestId('input-foto-tienda'), { target: { files: [foto] } })
    await waitFor(() => expect(subirFotoMock).toHaveBeenCalledWith(foto))
    await waitFor(() => expect(vm.actions.recargarConfig).toHaveBeenCalled())
    expect(alertMock).toHaveBeenCalledWith('Foto de la tienda guardada', 'success')
  })

  it('refrescar la config tras subir la foto no borra lo que se está escribiendo', () => {
    const vm = vmCon({ tienda: TIENDA })
    const { rerender } = abrirEntrega(vm)
    fireEvent.change(screen.getByPlaceholderText(/Entra al mercado/), { target: { value: 'Puerta 3' } })
    const refrescado = { ...vm, config: { ...vm.config, tienda: { ...TIENDA, fotoUrl: 'https://s3/nueva.jpg' } } }
    rerender(
      <MemoryRouter initialEntries={['/administrador/leads/vendedor?tab=entrega']}>
        <MiVendedorPanel vm={refrescado} negocio="Hierba Sana" />
      </MemoryRouter>,
    )
    expect(screen.getByDisplayValue('Puerta 3')).toBeInTheDocument()
    expect(screen.getByAltText('Foto de la fachada')).toHaveAttribute('src', 'https://s3/nueva.jpg')
  })

  it('no sube un archivo que no es JPG ni PNG', () => {
    abrirEntrega(vmCon({ tienda: TIENDA }))
    const pdf = new File(['x'], 'a.pdf', { type: 'application/pdf' })
    fireEvent.change(screen.getByTestId('input-foto-tienda'), { target: { files: [pdf] } })
    expect(subirFotoMock).not.toHaveBeenCalled()
    expect(alertMock).toHaveBeenCalledWith('La foto tiene que ser JPG o PNG.', 'error')
  })

  it('quitar la foto la borra y deja lo demás como está', () => {
    const vm = vmCon({ tienda: { ...TIENDA, fotoUrl: 'https://s3/foto.jpg' } })
    abrirEntrega(vm)
    expect(screen.getByAltText('Foto de la fachada')).toHaveAttribute('src', 'https://s3/foto.jpg')
    fireEvent.click(screen.getByRole('button', { name: /Quitar/ }))
    expect(vm.actions.guardarConfig).toHaveBeenCalledWith({ tienda: { ...TIENDA, fotoUrl: '' } })
  })

  it('con un servidor que no conoce la tienda, no aparece', () => {
    abrirEntrega(vmCon({}))
    expect(screen.queryByText('Tu tienda física')).toBeNull()
  })
})
