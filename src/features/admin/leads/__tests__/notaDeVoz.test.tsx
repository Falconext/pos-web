/**
 * Notas de voz desde el chat del panel (21-10): grabar, ver el tiempo,
 * descartar o enviar. El servidor la pasa a OGG/Opus para WhatsApp.
 */
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'

const alertMock = jest.fn()
jest.mock('@/zustand/alert', () => ({
  __esModule: true,
  default: () => ({ alert: alertMock, load: jest.fn(), loading: false }),
}))
jest.mock('@/services/leads.service', () => ({}))

import { Composer } from '../LeadsView'
import { formatoDuracion, mimeDeGrabacion, textoDeNotaDeVoz } from '../notaDeVoz'

class GrabadoraFalsa {
  static isTypeSupported = (t: string) => t === 'audio/webm;codecs=opus'
  static ultima: GrabadoraFalsa | null = null
  state = 'inactive'
  mimeType: string
  ondataavailable: ((e: { data: Blob }) => void) | null = null
  onstop: (() => void) | null = null
  constructor(public stream: MediaStream, opciones?: { mimeType?: string }) {
    this.mimeType = opciones?.mimeType ?? ''
    GrabadoraFalsa.ultima = this
  }
  start() {
    this.state = 'recording'
  }
  stop() {
    this.state = 'inactive'
    this.ondataavailable?.({ data: new Blob(['audio'], { type: 'audio/webm' }) })
    this.onstop?.()
  }
}

const pista = { stop: jest.fn() }
beforeEach(() => {
  alertMock.mockReset()
  pista.stop.mockReset()
  ;(globalThis as any).MediaRecorder = GrabadoraFalsa
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia: jest.fn().mockResolvedValue({ getTracks: () => [pista] }) },
  })
})

function armar() {
  const vm: any = {
    enviandoMensaje: false,
    actions: {
      enviarMensajeManual: jest.fn().mockResolvedValue(true),
      enviarImagenManual: jest.fn().mockResolvedValue(true),
      enviarAudioManual: jest.fn().mockResolvedValue(true),
    },
  }
  render(<Composer vm={vm} botActivo />)
  return vm
}

it('graba, envía la nota y suelta el micrófono', async () => {
  const vm = armar()
  await act(async () => {
    fireEvent.click(screen.getByTitle('Grabar una nota de voz'))
  })
  expect(screen.getByTestId('grabando-nota')).toHaveTextContent('Grabando')
  expect(GrabadoraFalsa.ultima?.mimeType).toBe('audio/webm;codecs=opus')

  await act(async () => {
    fireEvent.click(screen.getByTitle('Enviar la nota de voz'))
  })
  await waitFor(() => expect(vm.actions.enviarAudioManual).toHaveBeenCalled())
  const [archivo] = vm.actions.enviarAudioManual.mock.calls[0]
  expect(archivo).toBeInstanceOf(File)
  expect(archivo.name).toBe('nota-de-voz.webm')
  expect(archivo.type).toBe('audio/webm')
  expect(pista.stop).toHaveBeenCalled()
  expect(screen.queryByTestId('grabando-nota')).toBeNull()
})

it('descartar no manda nada', async () => {
  const vm = armar()
  await act(async () => {
    fireEvent.click(screen.getByTitle('Grabar una nota de voz'))
  })
  fireEvent.click(screen.getByTitle('Descartar la nota de voz'))
  expect(vm.actions.enviarAudioManual).not.toHaveBeenCalled()
  expect(pista.stop).toHaveBeenCalled()
  expect(screen.getByTitle('Grabar una nota de voz')).toBeInTheDocument()
})

it('sin permiso de micrófono avisa y no graba', async () => {
  ;(navigator.mediaDevices.getUserMedia as jest.Mock).mockRejectedValueOnce(new Error('NotAllowed'))
  armar()
  await act(async () => {
    fireEvent.click(screen.getByTitle('Grabar una nota de voz'))
  })
  expect(alertMock).toHaveBeenCalledWith('No hay permiso para usar el micrófono.', 'error')
  expect(screen.queryByTestId('grabando-nota')).toBeNull()
})

it('con texto escrito el micrófono se esconde (se envía el texto)', () => {
  armar()
  fireEvent.change(screen.getByPlaceholderText('Escribe tu respuesta…'), { target: { value: 'hola' } })
  expect(screen.queryByTitle('Grabar una nota de voz')).toBeNull()
})

describe('ayudas', () => {
  it('formato del tiempo', () => {
    expect(formatoDuracion(0)).toBe('0:00')
    expect(formatoDuracion(75.9)).toBe('1:15')
    expect(formatoDuracion(180)).toBe('3:00')
  })
  it('prefiere OGG, luego WEBM, luego MP4', () => {
    expect(mimeDeGrabacion(() => true)).toBe('audio/ogg;codecs=opus')
    expect(mimeDeGrabacion((t) => t.startsWith('audio/webm'))).toBe('audio/webm;codecs=opus')
    expect(mimeDeGrabacion((t) => t === 'audio/mp4')).toBe('audio/mp4')
    expect(mimeDeGrabacion(() => false)).toBeUndefined()
  })
  it('quita la marca para la IA', () => {
    expect(textoDeNotaDeVoz('[Nota de voz] Hola, así se toma')).toBe('Hola, así se toma')
    expect(textoDeNotaDeVoz('[Nota de voz]')).toBe('')
  })
})
