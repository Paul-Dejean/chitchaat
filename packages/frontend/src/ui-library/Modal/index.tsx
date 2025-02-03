"use client";

import { useRef, useEffect } from "react";
import ReactDOM from "react-dom";

export function Modal({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Focus the modal when opened
  useEffect(() => {
    if (isOpen) {
      modalRef.current?.focus();
    }
  }, [isOpen]);

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0  flex items-center justify-center z-1000">
      <div
        className="absolute inset-0 bg-gray-500 opacity-25"
        onClick={handleBackdropClick}
      />
      <div ref={modalRef} className="relative opacity-100 z-1001">
        {children}
      </div>
    </div>,
    document.body
  );
}
