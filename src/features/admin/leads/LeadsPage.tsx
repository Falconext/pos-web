import { useEffect } from 'react'
import LeadsView from './LeadsView'

export default function LeadsPage() {
  // Todo el módulo va en Inter Tight (ver index.css). La clase va en <html>
  // porque los modales se montan en <body>, fuera de este árbol.
  useEffect(() => {
    document.documentElement.classList.add('modulo-leads')
    return () => document.documentElement.classList.remove('modulo-leads')
  }, [])

  return (
    <div data-modulo-leads className="contents">
      <LeadsView />
    </div>
  )
}
