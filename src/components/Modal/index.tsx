import React from 'react'

type Props = {
  isOpenModal: boolean
  closeModal: () => void
  title?: string
  width?: string
  children: React.ReactNode
  position?: 'center' | 'right'
  icon?: string
  iconClass?: string
  style?: React.CSSProperties
  height?: 'auto' | 'full'
  backdropClassName?: string
}

import { Icon } from "@iconify/react"

export default function Modal({ isOpenModal, closeModal, title, width = '750px', children, position = 'center', icon, iconClass, style, height = 'full', backdropClassName }: Props) {
  const [isVisible, setIsVisible] = React.useState(false);
  const [isClosing, setIsClosing] = React.useState(false);

  React.useEffect(() => {
    if (isOpenModal) {
      setIsVisible(true);
      setIsClosing(false);
    } else {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setIsClosing(false);
      }, 300); // Animation duration
      return () => clearTimeout(timer);
    }
  }, [isOpenModal]);

  if (!isVisible && !isOpenModal) return null;

  const backdropClasses = position === 'right'
    ? `fixed inset-0 z-50 flex justify-end ${height === 'full' ? 'items-stretch' : 'items-center'} ${backdropClassName || 'bg-black/40'} ${isClosing ? 'opacity-0 transition-opacity duration-300' : 'opacity-100'} p-5`
    : `fixed inset-0 z-50 grid place-items-center ${backdropClassName || 'bg-black/40'}`;

  const animationClass = position === 'right'
    ? (isClosing ? 'animate-slide-out-right' : 'animate-slide-in-right')
    : '';

  const modalClasses = position === 'right'
    ? `bg-white ${height === 'full' ? 'rounded-l-2xl h-full max-h-screen' : 'rounded-2xl h-auto max-h-[90vh]'} w-[95vw] overflow-auto shadow-2xl ${animationClass}`
    : "bg-white rounded-xl w-[95vw] max-h-[98%] overflow-auto shadow-xl";

  return (
    <div className={backdropClasses}>
      <div className={modalClasses} style={{ maxWidth: width, ...style }}>
        <div className="flex items-center justify-between p-4 border-b border-[#e5e7eb] sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            {icon && (
              <div className={`p-1.5 rounded-lg ${iconClass || 'bg-gray-100 text-gray-600'}`}>
                <Icon icon={icon} width={20} height={20} />
              </div>
            )}
            <h3 className="text-sm leading-3.5 font-medium uppercase text-gray-800">{title}</h3>
          </div>
          <button className="px-2 py-1 rounded hover:bg-gray-100 cursor-pointer text-gray-500" onClick={closeModal}>✕</button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  )
}
