import React, { useEffect, useRef } from 'react';
import { HelpCircle, Check, X } from 'lucide-react';

const SaveConfirmationModal = ({ isOpen, onConfirm, onCancel, title = 'Save Data', message = 'Do you want to save the entered data?' }) => {
    const yesBtnRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Enter' || e.key === 'y' || e.key === 'Y') {
                e.preventDefault();
                e.stopPropagation();
                if (onConfirm) onConfirm();
            } else if (e.key === 'Escape' || e.key === 'n' || e.key === 'N') {
                e.preventDefault();
                e.stopPropagation();
                if (onCancel) onCancel();
            }
        };

        window.addEventListener('keydown', handleKeyDown, true);

        const focusTimer = setTimeout(() => {
            if (yesBtnRef.current && typeof yesBtnRef.current.focus === 'function') {
                yesBtnRef.current.focus();
            }
        }, 50);

        return () => {
            window.removeEventListener('keydown', handleKeyDown, true);
            clearTimeout(focusTimer);
        };
    }, [isOpen, onConfirm, onCancel]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden transform scale-100 transition-all m-4">
                <div className="p-6 text-center">
                    <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <HelpCircle size={32} />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">{title}</h3>
                    <p className="text-sm font-medium text-slate-500 mb-6">{message}</p>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                            <X size={18} /> No (Esc/N)
                        </button>
                        <button
                            ref={yesBtnRef}
                            type="button"
                            onClick={onConfirm}
                            className="flex-1 py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md shadow-orange-500/20"
                        >
                            <Check size={18} /> Yes (Enter/Y)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SaveConfirmationModal;
