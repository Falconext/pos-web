import { useSearchParams } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { SegmentosPanel } from './SegmentosPanel'

/**
 * Envíos masivos: mandarle un mensaje a un grupo de contactos que ya le
 * escribieron al negocio. Tres partes: a quién (segmentos), qué (plantillas
 * aprobadas por Meta) y el envío con sus resultados.
 */
type Pestana = 'segmentos'

const PESTANAS: { id: Pestana; label: string; icono: string }[] = [
  { id: 'segmentos', label: 'Segmentos', icono: 'solar:users-group-rounded-linear' },
]

export function EnviosPanel() {
  const [params, setParams] = useSearchParams()
  const pestana = (PESTANAS.find((p) => p.id === params.get('tab'))?.id ?? PESTANAS[0].id) as Pestana

  return (
    <div>
      <div role="tablist" className="mb-4 flex gap-1 overflow-x-auto border-b border-gray-200 dark:border-slate-800">
        {PESTANAS.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={pestana === p.id}
            onClick={() => setParams((prev) => {
              const n = new URLSearchParams(prev)
              n.set('tab', p.id)
              return n
            })}
            className={`-mb-px inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-[13px] font-semibold transition-colors ${
              pestana === p.id
                ? 'border-gray-900 text-gray-900 dark:border-white dark:text-white'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <Icon icon={p.icono} width={16} />
            {p.label}
          </button>
        ))}
      </div>
      {pestana === 'segmentos' && <SegmentosPanel />}
    </div>
  )
}
