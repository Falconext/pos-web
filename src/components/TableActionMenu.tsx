import { useLayoutEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface TableActionMenuProps {
    isOpen: boolean;
    onClose: () => void;
    anchorEl: HTMLElement | null;
    children: React.ReactNode;
}

const TableActionMenu = ({ isOpen, onClose, anchorEl, children }: TableActionMenuProps) => {
    const [position, setPosition] = useState<{ top: number; left: number | 'auto'; right: number | 'auto' } | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const rafRef = useRef<number | null>(null);

    const updatePosition = useCallback(() => {
        if (!isOpen || !anchorEl) return;

        const rect = anchorEl.getBoundingClientRect();
        let top = rect.bottom + 4;
        const right = document.documentElement.clientWidth - rect.right;

        if (menuRef.current) {
            const menuHeight = menuRef.current.offsetHeight;
            if (top + menuHeight > window.innerHeight) {
                top = rect.top - menuHeight - 4;
            }
        }

        setPosition({ top, left: 'auto', right });
    }, [isOpen, anchorEl]);

    const handleClickOutside = useCallback((event: MouseEvent) => {
        const target = event.target as Node;
        const clickedInsideMenu = !!menuRef.current && menuRef.current.contains(target);
        const clickedAnchor = !!anchorEl && anchorEl.contains(target);
        if (!clickedInsideMenu && !clickedAnchor) {
            onClose();
        }
    }, [anchorEl, onClose]);

    useLayoutEffect(() => {
        if (isOpen) {
            updatePosition();
            const handleReposition = () => {
                if (rafRef.current !== null) {
                    cancelAnimationFrame(rafRef.current);
                }
                rafRef.current = requestAnimationFrame(() => {
                    updatePosition();
                });
            };

            window.addEventListener('scroll', handleReposition, true);
            window.addEventListener('resize', handleReposition);
            document.addEventListener('mousedown', handleClickOutside);

            return () => {
                if (rafRef.current !== null) {
                    cancelAnimationFrame(rafRef.current);
                    rafRef.current = null;
                }
                window.removeEventListener('scroll', handleReposition, true);
                window.removeEventListener('resize', handleReposition);
                document.removeEventListener('mousedown', handleClickOutside);
            };
        } else {
            setPosition(null);
        }
    }, [isOpen, updatePosition, handleClickOutside]);

    if (!isOpen) return null;

    return createPortal(
        <div
            ref={menuRef}
            className="fixed z-[1000001] bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-2xl py-1 min-w-[160px] flex flex-col transition-opacity duration-75"
            style={{
                top: position?.top ?? 0,
                right: position?.right ?? 0,
                opacity: position ? 1 : 0,
                pointerEvents: position ? 'auto' : 'none'
            }}
            onClick={(e) => e.stopPropagation()}
        >
            {children}
        </div>,
        document.body
    );
};

export default TableActionMenu;
