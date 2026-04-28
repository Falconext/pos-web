import React, { useCallback } from 'react'
import Button from '../Button';
import useEscapeKey from '@/hooks/useEscapeKey';

type Props = {
  isOpenModal: boolean;
  setIsOpenModal: (v: boolean) => void;
  confirmSubmit: () => void;
  title: string;
  information: string;
  children?: React.ReactNode;
  confirmText?: string;
  confirmDisabled?: boolean;
  confirmLoading?: boolean;
};

export default function ModalConfirm({
  isOpenModal,
  setIsOpenModal,
  confirmSubmit,
  title,
  information,
  children,
  confirmText = 'Confirmar',
  confirmDisabled = false,
  confirmLoading = false,
}: Props) {
  const handleClose = useCallback(() => {
    if (isOpenModal) {
      setIsOpenModal(false);
    }
  }, [isOpenModal, setIsOpenModal]);

  useEscapeKey(() => handleClose(), isOpenModal);

  if (!isOpenModal) return null
  return (
    <div className="fixed inset-0 z-[9999999] bg-black/40 grid place-items-center">
      <div className="bg-white dark:bg-[#111827] rounded-xl p-6 w-[520px] max-w-[95vw] shadow-2xl border dark:border-slate-800">
        <h3 className="text-lg font-semibold mb-2 dark:text-white">{title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">{information}</p>
        {children && (
          <div className="mt-4">
            {children}
          </div>
        )}
        <div className="mt-6 text-right space-x-2 flex justify-end">
          <Button outline className="px-4 py-2 rounded" onClick={() => setIsOpenModal(false)}>Cancelar</Button>
          <Button
            color='danger'
            onClick={confirmSubmit}
            disabled={confirmDisabled || confirmLoading}
          >
            {confirmLoading ? 'Procesando...' : confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}
