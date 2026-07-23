import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, X, Edit, XCircle, CheckCircle, Trash2, Eye } from 'lucide-react';

const ActionDropdown = ({ item, onView, onEdit, onAlter, onCancel, onStatusChange, onDelete }) => {
    const [isOpen, setIsOpen] = useState(false);
    const hasStatusChange = !!onStatusChange;
    const isActive = item.is_active !== false;
    const handleAlter = onAlter || onEdit;

    return (
        <div className="relative inline-block text-left">
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(true);
                }}
                className="min-w-[90px] px-3 py-1 border border-slate-200 !rounded-md bg-white text-[12px] font-bold text-slate-800 flex items-center justify-center gap-1 hover:bg-slate-50 transition-colors mx-auto shadow-sm"
            >
                Actions <ChevronDown size={14} className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && createPortal(
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsOpen(false);
                        }}
                    />
                    <div className="bg-white rounded-2xl w-full max-w-xs shadow-2xl relative z-10 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
                        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 uppercase tracking-wider text-sm">Select Action</h3>
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                                className="text-slate-400 hover:text-red-500"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-2 flex flex-col gap-1">
                            {onView && (
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setIsOpen(false); onView(item); }}
                                    className="w-full px-4 py-3 text-sm font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-3 rounded-lg transition-colors outline-none"
                                >
                                    <Eye size={18} className="text-blue-500" /> View
                                </button>
                            )}

                            {handleAlter && (
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setIsOpen(false); handleAlter(item); }}
                                    className="w-full px-4 py-3 text-sm font-bold text-slate-700 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-3 rounded-lg transition-colors outline-none"
                                >
                                    <Edit size={18} className="text-orange-500" /> Alter
                                </button>
                            )}

                            {onCancel && (
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setIsOpen(false); onCancel(item); }}
                                    className="w-full px-4 py-3 text-sm font-bold text-slate-700 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-3 rounded-lg transition-colors outline-none"
                                >
                                    <XCircle size={18} className="text-orange-500" /> Cancel
                                </button>
                            )}

                            {hasStatusChange && (
                                <>
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); setIsOpen(false); onStatusChange(item, false); }}
                                        disabled={!isActive}
                                        className={`w-full px-4 py-3 text-sm font-bold flex items-center gap-3 rounded-lg transition-colors outline-none ${isActive
                                                ? 'text-slate-700 hover:bg-orange-50 hover:text-orange-600'
                                                : 'text-slate-400 bg-slate-50 opacity-50 cursor-not-allowed'
                                            }`}
                                    >
                                        <XCircle size={18} className={isActive ? 'text-orange-500' : 'text-slate-400'} /> Deactivate
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); setIsOpen(false); onStatusChange(item, true); }}
                                        disabled={isActive}
                                        className={`w-full px-4 py-3 text-sm font-bold flex items-center gap-3 rounded-lg transition-colors outline-none ${isActive
                                                ? 'text-slate-400 bg-slate-50 opacity-50 cursor-not-allowed'
                                                : 'text-slate-700 hover:bg-green-50 hover:text-green-600'
                                            }`}
                                    >
                                        <CheckCircle size={18} className={isActive ? 'text-slate-400' : 'text-green-500'} /> Activate
                                    </button>
                                </>
                            )}

                            {onDelete && (
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setIsOpen(false); onDelete(item); }}
                                    className="w-full px-4 py-3 text-sm font-bold text-slate-700 hover:bg-red-50 hover:text-red-600 flex items-center gap-3 rounded-lg transition-colors outline-none"
                                >
                                    <Trash2 size={18} className="text-red-500" /> Delete
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
