import { useEffect, useState } from 'react'
import { get } from '@/utils/fetch'
import { nombreNumero, type NumeroWhatsapp } from '@/components/NumerosWhatsapp'

// Una sola consulta por visita a la bandeja: los números cambian muy de vez en cuando.
let cache: Promise<NumeroWhatsapp[]> | null = null

const cargar = () => {
  cache ??= get<NumeroWhatsapp[]>('whatsapp/numeros').then((r) => (Array.isArray(r?.data) ? r.data : []))
  return cache
}

/**
 * Números de WhatsApp de la empresa, para marcar en la bandeja por cuál entró
 * cada chat. Con un solo número no hay nada que marcar: `varios` queda en false.
 */
export function useNumerosWhatsapp() {
  const [numeros, setNumeros] = useState<NumeroWhatsapp[]>([])
  useEffect(() => {
    let vivo = true
    cargar().then((n) => vivo && setNumeros(n)).catch(() => undefined)
    return () => {
      vivo = false
    }
  }, [])
  const varios = numeros.length > 1
  const nombreDe = (phoneNumberId?: string | null) => {
    if (!varios || !phoneNumberId) return null
    const n = numeros.find((x) => x.phoneNumberId === phoneNumberId)
    return n ? nombreNumero(n) : null
  }
  return { numeros, varios, nombreDe }
}
