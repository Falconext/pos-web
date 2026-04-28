import React, { useCallback } from 'react'
import { createPortal } from 'react-dom'
import useEscapeKey from '@/hooks/useEscapeKey'

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
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

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

  const handleEscape = useCallback(() => {
    if (isOpenModal) {
      closeModal();
    }
  }, [isOpenModal, closeModal]);

  useEscapeKey(handleEscape, isVisible || isOpenModal);

  if (!isVisible && !isOpenModal) return null;

  const backdropClasses = position === 'right'
    ? `fixed inset-0 z-[999999] flex justify-end ${height === 'full' ? 'items-stretch' : 'items-center'} ${backdropClassName || 'bg-black/40'} ${isClosing ? 'opacity-0 transition-opacity duration-300' : 'opacity-100'} p-5`
    : `fixed inset-0 z-[999999] grid place-items-center ${backdropClassName || 'bg-black/40'}`;

  const animationClass = position === 'right'
    ? (isClosing ? 'animate-slide-out-right' : 'animate-slide-in-right')
    : '';

  const modalClasses = position === 'right'
    ? `bg-white dark:bg-[#111827] w-full h-full rounded-none md:w-[95vw] max-w-none md:max-w-[var(--modal-width)] ${height === 'full' ? 'md:rounded-l-2xl md:h-full md:max-h-screen' : 'md:rounded-2xl md:h-auto md:max-h-[90vh]'} overflow-auto shadow-2xl border dark:border-slate-800 ${animationClass}`
    : "bg-white dark:bg-[#111827] w-full h-full rounded-none max-w-none md:max-w-[var(--modal-width)] md:rounded-xl md:w-[95vw] md:max-h-[98%] md:h-auto overflow-auto shadow-xl border dark:border-slate-800";

  const modalContent = (
    <div className={backdropClasses}>
      <div className={modalClasses} style={{ '--modal-width': width, ...style } as React.CSSProperties}>
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-[#e5e7eb] dark:border-slate-800 bg-white dark:bg-[#111827]">
          <div className="flex items-center gap-3">
            {icon && (
              <div className={`p-1.5 rounded-lg ${iconClass || 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400'}`}>
                <Icon icon={icon} width={20} height={20} />
              </div>
            )}
            <h3 className="text-sm leading-3.5 font-medium uppercase text-gray-800 dark:text-white">{title}</h3>
          </div>
          <button className="px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer text-gray-500 dark:text-gray-400" onClick={closeModal}>✕</button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );

  if (!mounted) return null;

  return createPortal(modalContent, document.body);
}
