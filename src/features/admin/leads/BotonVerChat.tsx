/**
 * "Ver chat" en el menú de un comprobante o nota de venta.
 *
 * Hierba Sana (26-10): desde las boletas emitidas o las notas pendientes no
 * había cómo llegar a la conversación del cliente para entrar en contexto.
 * Lleva a Chats con el teléfono; si ese número nunca escribió, la bandeja lo
 * dice. Solo para quien tiene IA de Ventas (módulo `leads`, que se contrata
 * aparte) y si el cliente tiene teléfono.
 */
import { Icon } from '@iconify/react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/zustand/auth'
import { hasPermission, type IUserPermissions } from '@/utils/permissions'
import { rutaAlChat } from './LeadsModel'

export function BotonVerChat({ telefono, onElegir }: { telefono?: string | null; onElegir?: () => void }) {
  const { auth } = useAuthStore()
  const navigate = useNavigate()
  const digitos = (telefono ?? '').replace(/\D/g, '')
  if (digitos.length < 9 || !hasPermission(auth as unknown as IUserPermissions, 'leads')) return null
  return (
    <button
      type="button"
      onClick={() => {
        onElegir?.()
        navigate(rutaAlChat({ telefono: digitos }))
      }}
      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
    >
      <Icon icon="solar:chat-round-dots-bold-duotone" width={16} height={16} />
      <span>Ver chat del cliente</span>
    </button>
  )
}
