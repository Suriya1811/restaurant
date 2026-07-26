import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical, X, Edit, XCircle, CheckCircle, Trash2, Eye } from 'lucide-react';
import { checkDataLock } from '@/utils/dataLockUtils';

const ActionDropdown = ({ item, onView, onEdit, onAlter, onCancel, onStatusChange, onDelete }) => {
    const [isOpen, setIsOpen] = useState(false);
    const hasStatusChange = !!onStatusChange;
    const isActive = item.is_active !== false;
    const handleAlter = onAlter || onEdit;

    const handleAlterAction = (e) => {
        e.stopPropagation();
        setIsOpen(false);
        const itemDate = item?.createdAt || item?.created_at || item?.date || item?.bill_date;
        const lockCheck = checkDataLock(itemDate);
        if (lockCheck.isLocked) {
            alert(`❌ Cannot Alter Entry!\n\n${lockCheck.message}`);
            return;
        }
        if (handleAlter) handleAlter(item);
    };

    const handleDeleteAction = (e) => {
        e.stopPropagation();
        setIsOpen(false);
        const itemDate = item?.createdAt || item?.created_at || item?.date || item?.bill_date;
        const lockCheck = checkDataLock(itemDate);
        if (lockCheck.isLocked) {
            alert(`❌ Cannot Delete Entry!\n\n${lockCheck.message}`);
            return;
        }
        if (onDelete) onDelete(item);
    };

    const handleCancelAction = (e) => {
        e.stopPropagation();
        setIsOpen(false);
        const itemDate = item?.createdAt || item?.created_at || item?.date || item?.bill_date;
        const lockCheck = checkDataLock(itemDate);
        if (lockCheck.isLocked) {
            alert(`❌ Cannot Cancel Entry!\n\n${lockCheck.message}`);
            return;
        }
        if (onCancel) onCancel(item);
    };

    return (
        <div className="relative inline-block text-left">
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(true);
                }}
                className="w-7 h-7 rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 flex items-center justify-center transition-colors mx-auto shadow-sm focus:outline-none"
                title="Actions"
            >
                <MoreVertical size={16} />
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
                                    onClick={handleAlterAction}
                                    className="w-full px-4 py-3 text-sm font-bold text-slate-700 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-3 rounded-lg transition-colors outline-none"
                                >
                                    <Edit size={18} className="text-orange-500" /> Alter
                                </button>
                            )}

                            {onCancel && (
                                <button
                                    type="button"
                                    onClick={handleCancelAction}
                                    className="w-full px-4 py-3 text-sm font-bold text-slate-700 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-3 rounded-lg transition-colors outline-none"
                                >
                                    <XCircle size={18} className="text-orange-500" /> Cancel
                                </button>
                            )}

                            {hasStatusChange && (
                                <>
                                    {isActive ? (
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); setIsOpen(false); onStatusChange(item, false); }}
                                            className="w-full px-4 py-3 text-sm font-bold text-slate-700 hover:bg-amber-50 hover:text-amber-600 flex items-center gap-3 rounded-lg transition-colors outline-none"
                                        >
                                            <XCircle size={18} className="text-amber-500" /> Deactivate
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); setIsOpen(false); onStatusChange(item, true); }}
                                            className="w-full px-4 py-3 text-sm font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-600 flex items-center gap-3 rounded-lg transition-colors outline-none"
                                        >
                                            <CheckCircle size={18} className="text-emerald-500" /> Activate
                                        </button>
                                    )}
                                </>
                            )}

                            {onDelete && (
                                <button
                                    type="button"
                                    onClick={handleDeleteAction}
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
