import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Plus, Save, Trash2, AlertCircle, CheckCircle, X } from 'lucide-react';

const VoucherSeriesSettings = () => {
    const navigate = useNavigate();
    const [seriesList, setSeriesList] = useState([]);
    const [printers, setPrinters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
    const [selectedSeries, setSelectedSeries] = useState({
        series_name: '',
        numbering_method: 'Automatic',
        starting_number: 1,
        restart_after: 'Never',
        prefix: '',
        suffix: '',
        printer_path: ''
    });

    const fetchSeries = async () => {
        try {
            setLoading(true);
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/voucher-series`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setSeriesList(data);
            } else {
                setError(data.message || 'Failed to fetch series');
            }
        } catch (err) {
            setError('Error fetching voucher series');
        } finally {
            setLoading(false);
        }
    };

    const fetchPrinters = async () => {
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/printers`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setPrinters(data.data || []);
            }
        } catch (err) {
            console.error('Error fetching printers:', err);
        }
    };

    useEffect(() => {
        fetchSeries();
        fetchPrinters();
    }, []);

    const openAddModal = () => {
        setModalMode('create');
        setSelectedSeries({
            series_name: '',
            numbering_method: 'Automatic',
            starting_number: 1,
            restart_after: 'Never',
            prefix: '',
            suffix: '',
            printer_path: ''
        });
        setError('');
        setShowModal(true);
    };

    const openEditModal = (series) => {
        setModalMode('edit');
        setSelectedSeries({
            _id: series._id,
            series_name: series.series_name,
            numbering_method: series.numbering_method || 'Automatic',
            starting_number: series.starting_number || 1,
            restart_after: series.restart_after || 'Never',
            prefix: series.prefix || '',
            suffix: series.suffix || '',
            printer_path: series.printer_path || ''
        });
        setError('');
        setShowModal(true);
    };

    const handleSave = async () => {
        if (modalMode === 'create' && !selectedSeries.series_name.trim()) {
            setError('Series name is required');
            return;
        }

        setSaving(true);
        setError('');
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            
            const url = modalMode === 'edit' 
                ? `${import.meta.env.VITE_API_URL}/voucher-series/${selectedSeries._id}`
                : `${import.meta.env.VITE_API_URL}/voucher-series`;
            
            const method = modalMode === 'edit' ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(selectedSeries)
            });
            
            const data = await res.json();
            if (res.ok) {
                setSuccess(modalMode === 'edit' ? 'Series updated successfully' : 'Series created successfully');
                setShowModal(false);
                fetchSeries();
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setError(data.message || 'Failed to save series');
            }
        } catch (err) {
            setError('Error saving series');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this series?')) return;
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/voucher-series/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchSeries();
                setSuccess('Series deleted successfully');
                setTimeout(() => setSuccess(''), 3000);
            } else {
                const data = await res.json();
                setError(data.message || 'Failed to delete series');
            }
        } catch (err) {
            setError('Error deleting series');
        }
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>;

    return (
        <div className="fade-in relative min-h-[500px]">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-200">
                <div>
                    <h3 className="text-base font-black text-slate-800 uppercase tracking-wider">Voucher Series</h3>
                    <p className="text-xs font-medium text-slate-400 mt-0.5">Configure all voucher series for the application.</p>
                </div>
                <button onClick={openAddModal} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-sm">
                    <Plus size={16} /> Add New Series
                </button>
            </div>

            {error && <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl flex items-center gap-3 text-rose-600 font-bold text-sm mb-6"><AlertCircle size={18} /> {error}</div>}
            {success && <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-center gap-3 text-emerald-700 font-bold text-sm mb-6"><CheckCircle size={18} /> {success}</div>}

            {/* List of Existing Series Table */}
            <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden mb-6">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                <th className="py-3.5 px-6 text-center w-20">S. No</th>
                                <th className="py-3.5 px-6">Series Name</th>
                                <th className="py-3.5 px-6">Numbering Method</th>
                                <th className="py-3.5 px-6 text-center">Starting Number</th>
                                <th className="py-3.5 px-6 text-center">Prefix</th>
                                <th className="py-3.5 px-6 text-center">Suffix</th>
                                <th className="py-3.5 px-6">Restart After</th>
                                <th className="py-3.5 px-6 text-center w-28">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                            {seriesList.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="py-8 text-center text-slate-400 font-semibold">No voucher series configured yet.</td>
                                </tr>
                            ) : (
                                seriesList.map((series, index) => (
                                    <tr key={series._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="py-4 px-6 text-center font-bold text-slate-400">{index + 1}</td>
                                        <td className="py-4 px-6 font-bold text-slate-800">{series.series_name}</td>
                                        <td className="py-4 px-6">
                                            <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                                                (series.numbering_method || 'Automatic') === 'Automatic'
                                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                    : 'bg-amber-50 text-amber-600 border border-amber-100'
                                            }`}>
                                                {series.numbering_method || 'Automatic'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-center font-mono font-bold text-slate-600">{series.starting_number || 1}</td>
                                        <td className="py-4 px-6 text-center font-mono font-semibold text-slate-600">{series.prefix || '-'}</td>
                                        <td className="py-4 px-6 text-center font-mono font-semibold text-slate-600">{series.suffix || '-'}</td>
                                        <td className="py-4 px-6 font-semibold text-slate-500">{series.restart_after || 'Never'}</td>
                                        <td className="py-4 px-6 text-center flex items-center justify-center gap-2">
                                            <button 
                                                onClick={() => openEditModal(series)} 
                                                className="px-3 py-1.5 border border-blue-100 hover:border-blue-200 text-blue-600 hover:bg-blue-50/40 rounded font-bold text-xs transition-all flex items-center gap-1"
                                            >
                                                ✏️ Alter
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(series._id)} 
                                                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50/50 rounded transition-colors"
                                                title="Delete Series"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="text-[11px] font-bold text-rose-500 uppercase tracking-wide mb-8">
                Note : Prefix and Suffix will be added around the auto generated number.
            </div>



            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200 p-8">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-800">
                                {modalMode === 'create' ? 'Add New Series' : selectedSeries.series_name}
                            </h3>
                            <button 
                                onClick={() => setShowModal(false)} 
                                className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors p-2 rounded-full"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Modal Body with Grid Layout */}
                        <div className="grid grid-cols-[160px_1fr] gap-y-5 gap-x-4 items-center mb-6">
                            {modalMode === 'create' && (
                                <>
                                    <span className="text-sm font-semibold text-slate-700">Series Name (Type)</span>
                                    <input
                                        type="text"
                                        value={selectedSeries.series_name}
                                        onChange={e => setSelectedSeries({...selectedSeries, series_name: e.target.value})}
                                        className="input-premium w-full !rounded"
                                        placeholder="e.g. Dine In, KOT, Purchase"
                                    />
                                </>
                            )}

                            <span className="text-sm font-semibold text-slate-700">Numbering Method</span>
                            <div className="flex gap-6 items-center">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="numbering_method"
                                        checked={selectedSeries.numbering_method === 'Automatic'}
                                        onChange={() => setSelectedSeries({...selectedSeries, numbering_method: 'Automatic'})}
                                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-medium text-slate-700">Automatic</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="numbering_method"
                                        checked={selectedSeries.numbering_method === 'Manual'}
                                        onChange={() => setSelectedSeries({...selectedSeries, numbering_method: 'Manual'})}
                                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-medium text-slate-700">Manual</span>
                                </label>
                            </div>

                            <span className="text-sm font-semibold text-slate-700">Starting Number</span>
                            <input
                                type="number"
                                value={selectedSeries.starting_number}
                                onChange={e => setSelectedSeries({...selectedSeries, starting_number: parseInt(e.target.value) || 1})}
                                className="input-premium w-full !rounded"
                                min="1"
                            />

                            <span className="text-sm font-semibold text-slate-700">Restart After</span>
                            <select
                                value={selectedSeries.restart_after}
                                onChange={e => setSelectedSeries({...selectedSeries, restart_after: e.target.value})}
                                className="input-premium w-full !rounded bg-white"
                            >
                                <option value="Never">Never</option>
                                <option value="Restart Yearly">Restart Yearly</option>
                                <option value="Restart Daily">Restart Daily</option>
                            </select>

                            <span className="text-sm font-semibold text-slate-700">Prefix</span>
                            <input
                                type="text"
                                value={selectedSeries.prefix}
                                onChange={e => setSelectedSeries({...selectedSeries, prefix: e.target.value.toUpperCase()})}
                                className="input-premium w-full uppercase !rounded"
                                placeholder="e.g. DIN"
                            />

                            <span className="text-sm font-semibold text-slate-700">Suffix</span>
                            <input
                                type="text"
                                value={selectedSeries.suffix}
                                onChange={e => setSelectedSeries({...selectedSeries, suffix: e.target.value})}
                                className="input-premium w-full !rounded"
                                placeholder="e.g. -KOT"
                            />

                            <span className="text-sm font-semibold text-slate-700">Printer Path</span>
                            <div className="flex gap-3 w-full">
                                <select
                                    value={selectedSeries.printer_path}
                                    onChange={e => setSelectedSeries({...selectedSeries, printer_path: e.target.value})}
                                    className="input-premium flex-1 !rounded bg-white"
                                >
                                    <option value="">Select Printer</option>
                                    {printers.map(p => (
                                        <option key={p._id} value={p.name}>{p.name} {p.ip_address ? `(${p.ip_address})` : ''}</option>
                                    ))}
                                </select>
                                <button 
                                    type="button"
                                    onClick={() => {
                                        if (selectedSeries.printer_path) {
                                            alert(`Printer Selected: ${selectedSeries.printer_path}`);
                                        } else {
                                            alert("Please select a printer path first.");
                                        }
                                    }}
                                    className="px-5 py-2 border border-blue-600 text-blue-600 rounded font-semibold text-xs uppercase tracking-wider hover:bg-blue-50 transition-colors whitespace-nowrap"
                                >
                                    Browse
                                </button>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex justify-end border-t border-slate-100 pt-6">
                            <button 
                                onClick={handleSave} 
                                disabled={saving} 
                                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-md"
                            >
                                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VoucherSeriesSettings;
