import { useLayoutEffect, useState, useRef } from 'react';
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

    useLayoutEffect(() => {
        const updatePosition = () => {
            if (isOpen && anchorEl) {
                const rect = anchorEl.getBoundingClientRect();
                
                // We use fixed positioning, so we don't need scrollY/scrollX if we use rect values directly
                // but getBoundingClientRect is relative to viewport, which is what 'fixed' uses.
                
                let top = rect.bottom + 4; // 4px gap
                let right = document.documentElement.clientWidth - rect.right;

                // Adjust if it goes off bottom
                if (menuRef.current) {
                    const menuHeight = menuRef.current.offsetHeight;
                    if (top + menuHeight > window.innerHeight) {
                        top = rect.top - menuHeight - 4;
                    }
                }

                setPosition({ top, left: 'auto', right });
            }
        };

        if (isOpen) {
            updatePosition();
            const handleScroll = (e: any) => {
                // Only close if scrolling the main window or a parent container
                onClose();
            };
            window.addEventListener('scroll', handleScroll, true);
            window.addEventListener('resize', onClose);
            document.addEventListener('mousedown', handleClickOutside);
            
            return () => {
                window.removeEventListener('scroll', handleScroll, true);
                window.removeEventListener('resize', onClose);
                document.removeEventListener('mousedown', handleClickOutside);
            };
        } else {
            setPosition(null);
        }
    }, [isOpen, anchorEl, onClose]);

    const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node) && anchorEl && !anchorEl.contains(event.target as Node)) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div
            ref={menuRef}
            className="fixed z-[9999] bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-2xl py-1 min-w-[160px] flex flex-col transition-opacity duration-75"
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
