import { useCallback, useEffect, useRef, useState } from 'react'

/** WhatsApp corta las notas largas; tres minutos alcanzan para explicar algo. */
export const MAX_SEGUNDOS_NOTA = 180

/**
 * Formato de la grabación. El servidor lo convierte igual a OGG/Opus para
 * WhatsApp; se prefiere OGG (Firefox) y si no WEBM (Chrome, Edge). Safari
 * graba MP4/AAC y también sirve.
 */
export function mimeDeGrabacion(
  soporta: (tipo: string) => boolean = (t) =>
    typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t),
): string | undefined {
  return ['audio/ogg;codecs=opus', 'audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find(soporta)
}

/** 75 → "1:15". */
export function formatoDuracion(segundos: number): string {
  const s = Math.max(0, Math.floor(segundos))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/** La marca "[Nota de voz]" es para la IA; en el globo ya se ve el reproductor. */
export function textoDeNotaDeVoz(contenido: string): string {
  return contenido.replace(/^(🎤\s*)?\[Nota de voz\]\s*/, '')
}

export interface NotaGrabada {
  archivo: File
  segundos: number
}

/**
 * Grabadora del chat: empezar, cancelar y terminar. Corta sola a los tres
 * minutos. Suelta el micrófono al terminar o al salir del chat.
 */
export function useGrabadoraNota(onError: (mensaje: string) => void) {
  const [grabando, setGrabando] = useState(false)
  const [segundos, setSegundos] = useState(0)
  // Nota que se cortó sola al llegar al tope: queda lista hasta enviarla.
  const [pendiente, setPendiente] = useState<NotaGrabada | null>(null)
  const grabadora = useRef<MediaRecorder | null>(null)
  const trozos = useRef<Blob[]>([])
  const inicio = useRef(0)
  const reloj = useRef<ReturnType<typeof setInterval> | null>(null)
  const alTerminar = useRef<((nota: NotaGrabada | null) => void) | null>(null)

  const soltar = useCallback(() => {
    if (reloj.current) clearInterval(reloj.current)
    reloj.current = null
    grabadora.current?.stream.getTracks().forEach((t) => t.stop())
    grabadora.current = null
    setGrabando(false)
    setSegundos(0)
  }, [])

  useEffect(() => () => {
    alTerminar.current = null
    if (grabadora.current?.state === 'recording') grabadora.current.stop()
    soltar()
  }, [soltar])

  const detener = useCallback((): Promise<NotaGrabada | null> => {
    if (pendiente) {
      setPendiente(null)
      return Promise.resolve(pendiente)
    }
    const g = grabadora.current
    if (!g || g.state !== 'recording') return Promise.resolve(null)
    return new Promise((resolve) => {
      alTerminar.current = resolve
      g.stop()
    })
  }, [pendiente])

  const empezar = useCallback(async (): Promise<boolean> => {
    if (grabadora.current) return false
    setPendiente(null)
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      onError('Este navegador no puede grabar audio.')
      return false
    }
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      onError('No hay permiso para usar el micrófono.')
      return false
    }
    const mimeType = mimeDeGrabacion()
    const g = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
    trozos.current = []
    g.ondataavailable = (e) => {
      if (e.data.size) trozos.current.push(e.data)
    }
    g.onstop = () => {
      const tipo = (g.mimeType || mimeType || 'audio/webm').split(';')[0]
      const extension = tipo.includes('ogg') ? 'ogg' : tipo.includes('mp4') ? 'm4a' : 'webm'
      const duracion = (Date.now() - inicio.current) / 1000
      const blob = new Blob(trozos.current, { type: tipo })
      const nota = blob.size
        ? { archivo: new File([blob], `nota-de-voz.${extension}`, { type: tipo }), segundos: duracion }
        : null
      if (alTerminar.current) alTerminar.current(nota)
      else if (nota && duracion >= MAX_SEGUNDOS_NOTA - 1) setPendiente(nota)
      alTerminar.current = null
      soltar()
    }
    grabadora.current = g
    inicio.current = Date.now()
    g.start(250)
    setGrabando(true)
    setSegundos(0)
    reloj.current = setInterval(() => {
      const s = (Date.now() - inicio.current) / 1000
      setSegundos(s)
      // Al tope se detiene; la nota queda lista y se manda al tocar enviar.
      if (s >= MAX_SEGUNDOS_NOTA && g.state === 'recording') g.stop()
    }, 250)
    return true
  }, [onError, soltar])

  const cancelar = useCallback(() => {
    alTerminar.current = null
    setPendiente(null)
    if (grabadora.current?.state === 'recording') grabadora.current.stop()
    soltar()
  }, [soltar])

  return { grabando, segundos, pendiente, empezar, detener, cancelar }
}
