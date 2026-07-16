import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, X, Edit, XCircle, CheckCircle, Trash2 } from 'lucide-react';

const ActionDropdown = ({ item, onEdit, onStatusChange, onDelete }) => {
    const [isOpen, setIsOpen] = useState(false);
    const hasStatusChange = !!onStatusChange;
    const isActive = item.is_active !== false;

    return (
        <div className="relative inline-block text-left">
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(true);
                }}
                className="px-3 py-1.5 border border-slate-300 rounded bg-white text-[12px] font-bold text-slate-800 flex items-center justify-center gap-1 hover:bg-slate-50 transition-colors mx-auto shadow-sm"
            >
                Actions <ChevronDown size={14} />
            </button>

            {isOpen && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-auto">
                    <div
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsOpen(false);
                        }}
                    />
                    <div className="relative w-64 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <h3 className="font-black text-slate-800 text-[13px] uppercase">Actions</h3>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsOpen(false);
                                }}
                                className="text-slate-400 hover:text-red-500 transition-colors"
                            >
                                <X size={16} strokeWidth={2.5} />
                            </button>
                        </div>
                        <div className="p-2 flex flex-col gap-1 text-left">
                            {onEdit && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsOpen(false);
                                        onEdit(item);
                                    }}
                                    className="w-full px-4 py-2.5 text-[13px] font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-3 rounded-lg transition-colors outline-none"
                                >
                                    <Edit size={16} className="text-blue-500" /> Alter
                                </button>
                            )}

                            {hasStatusChange && (
                                <>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsOpen(false);
                                            onStatusChange(item, false);
                                        }}
                                        disabled={!isActive}
                                        className={`w-full px-4 py-2.5 text-[13px] font-bold flex items-center gap-3 rounded-lg transition-colors outline-none ${
                                            isActive
                                                ? 'text-slate-700 hover:bg-orange-50 hover:text-orange-600'
                                                : 'text-slate-400 bg-slate-50 opacity-50 cursor-not-allowed'
                                        }`}
                                    >
                                        <XCircle size={16} className={isActive ? 'text-orange-500' : 'text-slate-400'} /> Deactivate
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsOpen(false);
                                            onStatusChange(item, true);
                                        }}
                                        disabled={isActive}
                                        className={`w-full px-4 py-2.5 text-[13px] font-bold flex items-center gap-3 rounded-lg transition-colors outline-none ${
                                            isActive
                                                ? 'text-slate-400 bg-slate-50 opacity-50 cursor-not-allowed'
                                                : 'text-slate-700 hover:bg-green-50 hover:text-green-600'
                                        }`}
                                    >
                                        <CheckCircle size={16} className={isActive ? 'text-slate-400' : 'text-green-500'} /> Activate
                                    </button>
                                </>
                            )}

                            {onDelete && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsOpen(false);
                                        onDelete(item.id || item._id);
                                    }}
                                    className="w-full px-4 py-2.5 text-[13px] font-bold text-slate-700 hover:bg-red-50 hover:text-red-600 flex items-center gap-3 rounded-lg transition-colors outline-none"
                                >
                                    <Trash2 size={16} className="text-red-500" /> Delete
                                </button>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default ActionDropdown;
