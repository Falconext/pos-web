import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';

interface TableActionMenuProps {
    isOpen: boolean;
    onClose: () => void;
    anchorEl: HTMLElement | null;
    children: React.ReactNode;
}

const TableActionMenu = ({ isOpen, onClose, anchorEl, children }: TableActionMenuProps) => {
    const [position, setPosition] = useState<{ top: number; left: number | 'auto'; right: number | 'auto' }>({ top: 0, left: 0, right: 'auto' });
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const updatePosition = () => {
            if (isOpen && anchorEl) {
                const rect = anchorEl.getBoundingClientRect();
                const scrollY = window.scrollY;
                const scrollX = window.scrollX;

                // Default: align top-right of menu to bottom-right of anchor
                // We want the menu to appear below the button, aligned to the right edge of the button usually, or centered.
                // Let's align to the right edge of the button (so menu expands to the left) to avoid going off-screen on the right.

                let top = rect.bottom + scrollY + 4; // 4px gap
                let left: number | 'auto' = 'auto';
                let right: number | 'auto' = document.documentElement.clientWidth - (rect.right + scrollX);

                // Simple collision detection (if needed later, expand here)

                setPosition({ top, left, right });
            }
        };

        if (isOpen) {
            updatePosition();
            window.addEventListener('scroll', onClose, true); // Close on any scroll to avoid floating menu
            window.addEventListener('resize', onClose);
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            window.removeEventListener('scroll', onClose, true);
            window.removeEventListener('resize', onClose);
            document.removeEventListener('mousedown', handleClickOutside);
        };
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
            className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-xl py-1 min-w-[150px] flex flex-col"
            style={{
                top: position.top,
                right: position.right,
                // left: position.left, // We use right positioning to align with the column edge usually
            }}
            onClick={(e) => e.stopPropagation()}
        >
            {children}
        </div>,
        document.body
    );
};

export default TableActionMenu;
