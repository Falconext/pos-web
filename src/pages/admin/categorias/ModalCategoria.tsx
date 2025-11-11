import React, { ChangeEvent, useEffect, useState } from 'react'
import Modal from '@/components/Modal'
import InputPro from '@/components/InputPro'

type Props = {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { nombre: string; categoriaId?: number }) => void
  initial?: { nombre: string; categoriaId?: number }
}

export default function ModalCategoria({ isOpen, onClose, onSubmit, initial }: Props) {
  const [nombre, setNombre] = useState('')

  useEffect(() => {
    setNombre(initial?.nombre ?? '')
  }, [initial])

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => setNombre(e.target.value)
  const handleSave = () => onSubmit({ nombre, categoriaId: initial?.categoriaId })

  return (
    <Modal isOpenModal={isOpen} closeModal={onClose} title={initial?.categoriaId ? 'Editar categoría' : 'Nueva categoría'} width="520px">
      <div className="p-4">
        <InputPro isLabel name="nombre" label="Nombre" value={nombre} onChange={handleChange as any} autocomplete="off" />
      </div>
      <div className="flex justify-end gap-2 px-4 pb-4">
        <button className="px-4 py-2 rounded bg-gray-200" onClick={onClose}>Cancelar</button>
        <button className="px-4 py-2 rounded bg-[#6A6CFF] text-white" onClick={handleSave}>Guardar</button>
      </div>
    </Modal>
  )
}
