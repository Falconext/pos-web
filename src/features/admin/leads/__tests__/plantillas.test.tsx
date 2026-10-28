/**
 * La vista previa de una plantilla: lo que el empresario ve tiene que ser lo
 * que le llega al cliente, con el pie de baja en las promociones.
 */
import { render, screen } from '@testing-library/react'
import { BurbujaWhatsapp, PIE_BAJA } from '../PlantillasPanel'
import type { DatosPlantilla } from '@/services/envios.service'

const base: DatosPlantilla = {
  titulo: 'Cyber',
  categoria: 'MARKETING',
  cabeceraTipo: 'TEXTO',
  cabeceraTexto: 'Cyber Wow',
  cuerpo: 'Hola {{nombre}}, tenemos {{dato1}} solo hoy.',
  pie: 'esto no va',
  botones: [{ tipo: 'RESPUESTA', texto: 'Lo quiero' }],
  ejemplos: { dato1: '20% de descuento' },
}

it('reemplaza las variables por ejemplos y pone el pie de baja en promociones', () => {
  render(<BurbujaWhatsapp d={base} />)
  expect(screen.getByText('Hola María, tenemos 20% de descuento solo hoy.')).toBeInTheDocument()
  expect(screen.getByText(PIE_BAJA)).toBeInTheDocument()
  expect(screen.queryByText('esto no va')).not.toBeInTheDocument()
  expect(screen.getByText('Cyber Wow')).toBeInTheDocument()
  expect(screen.getByText('Lo quiero')).toBeInTheDocument()
})

it('en avisos de servicio el pie es el que escribió el negocio', () => {
  render(<BurbujaWhatsapp d={{ ...base, categoria: 'UTILITY', pie: 'Tienda Bulldog' }} />)
  expect(screen.getByText('Tienda Bulldog')).toBeInTheDocument()
  expect(screen.queryByText(PIE_BAJA)).not.toBeInTheDocument()
})
