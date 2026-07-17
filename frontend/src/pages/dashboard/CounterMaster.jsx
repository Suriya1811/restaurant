import { useState, useEffect } from 'react';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';
import './Dashboard.css';
import {
    PlusCircle,
    Search,
    Edit,
    Loader2,
    Store,
    AlertCircle,
    XCircle,
    Monitor,
    Activity,
    Cpu,
    CheckCircle2,
    X
, Download, Printer} from 'lucide-react';
import { useFormNavigation } from '../../hooks/useFormNavigation';
import SaveConfirmationModal from '../../components/common/SaveConfirmationModal';

const CounterMaster = () => {
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [counters, setCounters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [showDrawer, setShowDrawer] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        type: 'BILLING',
        cash_ledger_id: '',
        upi_ledger_id: '',
        card_ledger_id: ''
    });
    const [ledgers, setLedgers] = useState({ cash: [], bank: [] });
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [showSaveConfirm, setShowSaveConfirm] = useState(false);

    const handleFormSubmitRequest = () => {
        setShowSaveConfirm(true);
    };

    const { formRef, handleKeyDown } = useFormNavigation([showDrawer], handleFormSubmitRequest);

    const toggleSidebar = () => {
        if (window.innerWidth <= 768) {
            setIsMobileSidebarOpen(!isMobileSidebarOpen);
        } else {
            const newState = !isCollapsed;
            setIsCollapsed(newState);
            localStorage.setItem('sidebarCollapsed', newState);
        }
    };

    const fetchCounters = async () => {
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);

            const [countersResponse, ledgersResponse] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_URL}/counters`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${import.meta.env.VITE_API_URL}/ledgers`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);
            const countersData = await countersResponse.json();
            const ledgersData = await ledgersResponse.json();
            
            if (countersData.success) {
                setCounters(countersData.data);
            }
            if (ledgersData.success) {
                setLedgers({
                    cash: ledgersData.data.filter(l => l.group === 'Cash in Hand' || l.group === 'Cash-in-Hand'),
                    bank: ledgersData.data.filter(l => l.group === 'Bank Accounts')
                });
            }
        } catch (err) {
            console.error("Failed to fetch counters", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCounters();
    }, []);

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);

            const url = isEditing
                ? `${import.meta.env.VITE_API_URL}/counters/${formData._id}`
                : `${import.meta.env.VITE_API_URL}/counters`;

            const method = isEditing ? 'PUT' : 'POST';

            const payload = { ...formData };
            if (payload.cash_ledger_id === '') payload.cash_ledger_id = null;
            if (payload.upi_ledger_id === '') payload.upi_ledger_id = null;
            if (payload.card_ledger_id === '') payload.card_ledger_id = null;

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error);
            }

            fetchCounters();
            setShowDrawer(false);
            resetForm();
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const confirmSave = () => {
        setShowSaveConfirm(false);
        handleSubmit();
    };

    const cancelSave = () => {
        setShowSaveConfirm(false);
    };

    const handleEdit = (counter) => {
        setFormData(counter);
        setIsEditing(true);
        setShowDrawer(true);
    };

    const resetForm = () => {
        setFormData({ name: '', code: '', type: 'BILLING', cash_ledger_id: '', upi_ledger_id: '', card_ledger_id: '' });
        setIsEditing(false);
        setError('');
    };

    const filteredCounters = counters.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.code.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' ? true : (statusFilter === 'ACTIVE' ? c.is_active !== false : c.is_active === false);
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="dashboard-layout">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />

            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}

            <main className="dashboard-main">
                <Header 
                    toggleSidebar={toggleSidebar} 
                    title="Counter Master"
                    actions={
                        <>

                            <button
                                type="button"
                                className="btn-export excel"
                                onClick={() => {}}
                                title="Export to Excel"
                            >
                                <Download size={14} />
                                <span className="text-[10px] uppercase font-black text-emerald-500">Excel</span>
                            </button>
                            <button
                                type="button"
                                className="btn-export pdf"
                                onClick={() => {}}
                                title="Export to PDF"
                            >
                                <Download size={14} />
                                <span className="text-[10px] uppercase font-black text-rose-500">PDF</span>
                            </button>
                            <button
                                type="button"
                                className="btn-export print"
                                onClick={() => window.print()}
                                title="Print"
                            >
                                <Printer size={14} />
                                <span className="text-[10px] uppercase font-black text-blue-500">Print</span>
                            </button>
<button className="btn-action-add " onClick={() => { resetForm(); setShowDrawer(true); }}>
                            <PlusCircle size={18} /> 
                            <span className="text-[10px] uppercase font-black">Initialize Terminal</span>
                        </button>
                    </>
}
                />
                <div className="master-content-layout fade-in">
                    {/* Header relocated */}

                    <div className="toolbar-premium">
                        <div className="search-premium">
                            <Search size={20} />
                            <input
                                type="text"
                                placeholder="Search terminal identifiers..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <select 
                                value={statusFilter} 
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="input-premium w-40 !py-1.5 !px-3"
                                style={{ height: '32px', minHeight: '32px', fontSize: '12px' }}
                            >
                                <option value="ALL">All Status</option>
                                <option value="ACTIVE">Active</option>
                                <option value="DEACTIVE">Deactive</option>
                            </select>
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 italic">
                                Active Nodes: {filteredCounters.length}
                            </span>
                        </div>
                    </div>

                    <div className="table-container-premium">
                        <table className="table-premium">
                            <thead>
                                <tr>
                                    <th>Terminal Identity</th>
                                    <th>Link Code</th>
                                    <th>Classification</th>
                                    <th>Network Status</th>
                                    <th style={{ textAlign: 'right' }}>Management</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', padding: '60px 0' }}>
                                            <Loader2 className="animate-spin text-indigo-600 mx-auto mb-4" size={48} />
                                            <p className="font-black text-slate-300 uppercase tracking-[0.2em] text-xs">Scanning Terminal Network...</p>
                                        </td>
                                    </tr>
                                ) : filteredCounters.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', padding: '60px 0' }}>
                                            <Monitor size={48} className="text-slate-100 mx-auto mb-4" />
                                            <p className="font-bold text-slate-400">No terminal definitions found.</p>
                                        </td>
                                    </tr>
                                ) : filteredCounters.map((counter) => (
                                    <tr key={counter._id} className="group">
                                        <td>
                                            <div className="flex items-center gap-4">
                                                <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-md shadow-slate-900/10 group-hover:bg-indigo-600 transition-all">
                                                    <Cpu size={16} />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-black text-slate-800 uppercase tracking-tight leading-none group-hover:text-indigo-600 transition-colors">{counter.name}</div>
                                                    <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest flex items-center gap-1.5 italic">Terminal Instance</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="font-black text-indigo-600 tracking-widest text-xs bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
                                                {counter.code}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${counter.type === 'BILLING' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                    counter.type === 'SELF_SERVICE' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                                        'bg-amber-50 text-amber-600 border-amber-100'
                                                }`}>
                                                {counter.type.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${counter.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${counter.is_active ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                    {counter.is_active ? 'ACTIVE' : 'DEACTIVE'}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleEdit(counter)} className="action-icon-btn edit"><Edit size={18} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {showDrawer && (
                    <>
                        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[999]" onClick={() => setShowDrawer(false)}></div>
                        <div className="drawer-premium">
                            <div className="drawer-header-premium">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{isEditing ? 'Modify Terminal' : 'Architect Terminal'}</h3>
                                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Network Topology Registry</p>
                                </div>
                                <button onClick={() => { resetForm(); setShowDrawer(false); }} className="w-12 h-12 rounded-full hover:bg-slate-100 flex items-center justify-center transition-all">
                                    <X size={32} className="text-slate-500 hover:text-slate-800" />
                                </button>
                            </div>
                            <div className="drawer-body-premium !p-6">
                                {error && (
                                    <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl flex items-center gap-2 text-rose-600 font-bold text-sm mb-4">
                                        <AlertCircle size={18} /> {error}
                                    </div>
                                )}
                                <form id="counter-form" ref={formRef} onKeyDown={handleKeyDown} onSubmit={(e) => { e.preventDefault(); handleFormSubmitRequest(); }} className="space-y-4">
                                    <div className="form-group-premium !mb-3">
                                        <label>Terminal Label *</label>
                                        <input
                                            type="text"
                                            name="name"
                                            required
                                            className="input-premium"
                                            placeholder="e.g. MAIN GATEWAY"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                                        />
                                    </div>
                                    <div className="form-group-premium">
                                        <label>Unique Link Code *</label>
                                        <div className="relative">
                                            <Store size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                            <input
                                                type="text"
                                                name="code"
                                                required
                                                className="input-premium !pl-12 uppercase"
                                                placeholder="e.g. CTR-01"
                                                value={formData.code}
                                                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group-premium">
                                        <label>Terminal Logic Classification *</label>
                                        <div className="grid grid-cols-1 gap-2">
                                            {['BILLING', 'SELF_SERVICE', 'TAKEAWAY'].map(type => (
                                                <button key={type} type="button" onClick={() => setFormData({ ...formData, type })} className={`p-2.5 rounded-xl border-2 flex items-center justify-between transition-all ${formData.type === type ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-sm' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                                                    <span className="font-bold text-[11px] uppercase tracking-wider">{type.replace('_', ' ')}</span>
                                                    {formData.type === type && <CheckCircle2 size={16} />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="form-group-premium">
                                        <label>Associated Cash Ledger (Optional)</label>
                                        <select 
                                            value={formData.cash_ledger_id || ''} 
                                            onChange={(e) => setFormData({ ...formData, cash_ledger_id: e.target.value })}
                                            className="input-premium"
                                        >
                                            <option value="">-- Select Cash Account --</option>
                                            {ledgers.cash.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group-premium">
                                        <label>Associated UPI Bank Ledger (Optional)</label>
                                        <select 
                                            value={formData.upi_ledger_id || ''} 
                                            onChange={(e) => setFormData({ ...formData, upi_ledger_id: e.target.value })}
                                            className="input-premium"
                                        >
                                            <option value="">-- Select Bank Account --</option>
                                            {ledgers.bank.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group-premium">
                                        <label>Associated CARD Bank Ledger (Optional)</label>
                                        <select 
                                            value={formData.card_ledger_id || ''} 
                                            onChange={(e) => setFormData({ ...formData, card_ledger_id: e.target.value })}
                                            className="input-premium"
                                        >
                                            <option value="">-- Select Bank Account --</option>
                                            {ledgers.bank.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
                                        </select>
                                    </div>
                                </form>
                            </div>
                            <div className="drawer-footer-premium !p-4">
                                <button type="submit" form="counter-form" disabled={submitting} className="btn-action-add flex-1 justify-center !py-2.5 !text-sm">
                                    {submitting ? <Loader2 className="animate-spin" size={18} /> : (isEditing ? 'COMMIT CONFIGURATION' : 'INITIALIZE NODE')}
                                </button>
                                <button type="button" onClick={() => { resetForm(); setShowDrawer(false); }} className="btn-premium-outline !py-2.5 !text-sm">TERMINATE</button>
                            </div>
                        </div>
                        <SaveConfirmationModal 
                            isOpen={showSaveConfirm} 
                            onConfirm={confirmSave} 
                            onCancel={cancelSave} 
                        />
                    </>
                )}
            </main>
        </div>
    );
};

export default CounterMaster;
