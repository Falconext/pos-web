import React from 'react'

type Props = {
  isOpenModal: boolean
  closeModal: () => void
  title?: string
  width?: string
  children: React.ReactNode
}

export default function Modal({ isOpenModal, closeModal, title, width = '750px', children }: Props) {
  if (!isOpenModal) return null
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40">
      <div className="bg-white rounded-xl w-[95vw] max-h-[98%] overflow-auto" style={{ maxWidth: width }}>
        <div className="flex items-center justify-between p-4 border-b border-[#e5e7eb]">
          <h3 className="text-sm leading-3.5 font-medium uppercase text-center w-full">{title}</h3>
          <button className="px-2 py-1 rounded hover:bg-gray-100 cursor-pointer" onClick={closeModal}>✕</button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  )
}
