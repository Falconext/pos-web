import { useEffect } from 'react'
import { Navigate, useLocation, useParams } from 'react-router-dom'
import LeadsView from './LeadsView'
import { VISTA_POR_RUTA } from './LeadsModel'

export default function LeadsPage() {
  const { vista } = useParams<{ vista?: string }>()
  const { search } = useLocation()

  // Todo el módulo va en Inter Tight (ver index.css). La clase va en <html>
  // porque los modales se montan en <body>, fuera de este árbol.
  useEffect(() => {
    document.documentElement.classList.add('modulo-leads')
    return () => document.documentElement.classList.remove('modulo-leads')
  }, [])

  // /administrador/leads a secas (links viejos, el menú plegado) abre Chats.
  const actual = vista ? VISTA_POR_RUTA[vista] : undefined
  if (!actual) return <Navigate to={`/administrador/leads/chats${search}`} replace />

  return (
    <div data-modulo-leads className="contents">
      <LeadsView vista={actual} />
    </div>
  )
}
