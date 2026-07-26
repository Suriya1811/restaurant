import React, { useState, useEffect } from 'react';
import { Calendar, Check, X, Clock, RefreshCw } from 'lucide-react';
import { getActiveFinancialYear, setActiveFinancialYear, generateFYPresets, validateSingleFinancialYear } from '@/utils/financialYearUtils';

const FinancialYearModal = ({ isOpen, onClose }) => {
    const presets = generateFYPresets(6);
    const activeFY = getActiveFinancialYear();

    const [startDate, setStartDate] = useState(activeFY.startDate);
    const [endDate, setEndDate] = useState(activeFY.endDate);
    const [selectedPreset, setSelectedPreset] = useState('');
    const [savedSuccess, setSavedSuccess] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const current = getActiveFinancialYear();
            setStartDate(current.startDate);
            setEndDate(current.endDate);
            // Check matching preset
            const match = presets.find(p => p.startDate === current.startDate && p.endDate === current.endDate);
            if (match) setSelectedPreset(match.label);
            else setSelectedPreset('CUSTOM');
            setSavedSuccess(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handlePresetChange = (e) => {
        const val = e.target.value;
        setSelectedPreset(val);
        if (val !== 'CUSTOM') {
            const match = presets.find(p => p.label === val);
            if (match) {
                setStartDate(match.startDate);
                setEndDate(match.endDate);
            }
        }
    };

    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        if (!startDate || !endDate) return alert('Please select both Start Date and End Date.');

        const validation = validateSingleFinancialYear(startDate, endDate);
        if (!validation.isValid) {
            alert(`⚠️ Invalid Financial Year!\n\n${validation.message}`);
            return;
        }

        setIsSaving(true);
        const startY = new Date(startDate).getFullYear();
        const endY = new Date(endDate).getFullYear();
        const label = `01-04-${startY} to 31-03-${endY}`;

        const newFY = {
            startDate,
            endDate,
            startYear: startY,
            endYear: endY,
            label
        };

        try {
            const savedUser = localStorage.getItem('user');
            if (savedUser) {
                const { token } = JSON.parse(savedUser);
                await fetch(`${import.meta.env.VITE_API_URL}/settings/financial-year`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({
                        financial_year_start: startDate,
                        financial_year_end: endDate
                    })
                });
            }
        } catch (err) {
            console.error('Failed to sync financial year to backend', err);
        } finally {
            setIsSaving(false);
        }

        setActiveFinancialYear(newFY);
        setSavedSuccess(true);
        setTimeout(() => {
            setSavedSuccess(false);
            if (onClose) onClose();
        }, 1200);
    };

    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
                            <Calendar size={20} />
                        </div>
                        <div>
                            <h3 className="font-black text-sm uppercase tracking-wider text-white">Change Financial Year</h3>
                            <p className="text-[11px] font-bold text-slate-400 mt-0.5">Press <kbd className="px-1.5 py-0.5 bg-slate-700 text-orange-400 rounded text-[10px] border border-slate-600 font-mono">Alt + F2</kbd> anytime</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSave} className="p-6 space-y-5">
                    {savedSuccess && (
                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3.5 rounded-xl font-bold text-xs flex items-center gap-2 animate-in fade-in duration-200">
                            <Check size={18} className="text-emerald-600" />
                            Financial Year switched to {startDate} to {endDate}!
                        </div>
                    )}

                    {/* Quick Preset Selector */}
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                            <Clock size={13} className="text-orange-500" /> Quick Financial Year Selection
                        </label>
                        <select
                            value={selectedPreset}
                            onChange={handlePresetChange}
                            className="w-full h-11 px-3 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 bg-slate-50 outline-none focus:border-orange-500 focus:bg-white cursor-pointer transition-colors shadow-sm"
                        >
                            {presets.map(p => (
                                <option key={p.label} value={p.label}>{p.label}</option>
                            ))}
                            <option value="CUSTOM">-- Custom Date Range --</option>
                        </select>
                    </div>

                    {/* Start Date & End Date Inputs */}
                    <div className="grid grid-cols-2 gap-4 pt-1">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                                Start Date
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={e => {
                                    setStartDate(e.target.value);
                                    setSelectedPreset('CUSTOM');
                                }}
                                className="w-full h-11 px-3 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 bg-white outline-none focus:border-orange-500 shadow-sm"
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                                End Date
                            </label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={e => {
                                    setEndDate(e.target.value);
                                    setSelectedPreset('CUSTOM');
                                }}
                                className="w-full h-11 px-3 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 bg-white outline-none focus:border-orange-500 shadow-sm"
                                required
                            />
                        </div>
                    </div>

                    {/* Helpful Info Note */}
                    <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 text-[11px] text-amber-800 font-semibold leading-relaxed">
                        💡 Changing the Financial Year will filter viewable transactions and ledger records to the selected date range.
                    </div>

                    {/* Actions */}
                    <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                            CANCEL
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-black tracking-wider uppercase flex items-center gap-2 shadow-lg shadow-orange-600/20 transition-all cursor-pointer"
                        >
                            <RefreshCw size={14} /> SWITCH FINANCIAL YEAR
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FinancialYearModal;
