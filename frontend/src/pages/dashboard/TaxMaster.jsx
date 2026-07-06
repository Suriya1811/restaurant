import { useState, useEffect } from 'react';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';
import './Dashboard.css';
import {
    PlusCircle,
    Search,
    Edit,
    CheckCircle2,
    XCircle,
    Loader2,
    Percent,
    AlertCircle,
    X,
    Trash2
} from 'lucide-react';
import { useFormNavigation } from '../../hooks/useFormNavigation';
import SaveConfirmationModal from '../../components/common/SaveConfirmationModal';

const TaxMaster = () => {
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [taxes, setTaxes] = useState([]);
    const [ledgers, setLedgers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDrawer, setShowDrawer] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        sales_account_id: '',
        purchase_account_id: '',
        tax_type: 'TAXABLE',
        local_central: 'LOCAL',
        cgst_rate: 0,
        sgst_rate: 0,
        igst_rate: 0,
        gst_sales_ledger_id: '',
        gst_purchase_ledger_id: '',
        igst_sales_ledger_id: '',
        igst_purchase_ledger_id: ''
    });
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

    const fetchTaxes = async () => {
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);

            const response = await fetch(`${import.meta.env.VITE_API_URL}/taxes`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setTaxes(data.data);
            }
        } catch (err) {
            console.error("Failed to fetch taxes", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchLedgers = async () => {
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);

            const response = await fetch(`${import.meta.env.VITE_API_URL}/ledgers`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setLedgers(data.data);
            }
        } catch (err) {
            console.error("Failed to fetch Duties & Taxes ledgers", err);
        }
    };

    useEffect(() => {
        fetchTaxes();
        fetchLedgers();
    }, []);

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);

            const url = isEditing
                ? `${import.meta.env.VITE_API_URL}/taxes/${formData._id}`
                : `${import.meta.env.VITE_API_URL}/taxes`;

            const method = isEditing ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: formData.name,
                    sales_account_id: formData.sales_account_id || null,
                    purchase_account_id: formData.purchase_account_id || null,
                    tax_type: formData.tax_type,
                    local_central: formData.local_central,
                    cgst_rate: formData.local_central === 'LOCAL' ? Number(formData.cgst_rate || 0) : 0,
                    sgst_rate: formData.local_central === 'LOCAL' ? Number(formData.sgst_rate || 0) : 0,
                    igst_rate: formData.local_central === 'CENTRAL' ? Number(formData.igst_rate || 0) : 0,
                    gst_sales_ledger_id: formData.gst_sales_ledger_id || null,
                    gst_purchase_ledger_id: formData.gst_purchase_ledger_id || null,
                    igst_sales_ledger_id: formData.igst_sales_ledger_id || null,
                    igst_purchase_ledger_id: formData.igst_purchase_ledger_id || null
                })
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || result.message);
            }

            fetchTaxes();
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

    const handleDelete = async (tax) => {
        if (!window.confirm(`Are you sure you want to delete the tax "${tax.name}"?`)) {
            return;
        }

        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);

            const response = await fetch(`${import.meta.env.VITE_API_URL}/taxes/${tax._id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const result = await response.json();

            if (result.success) {
                fetchTaxes();
            } else {
                alert(`Error: ${result.error || result.message}`);
            }
        } catch (err) {
            console.error('Error deleting tax:', err);
            alert('An error occurred while deleting the tax.');
        }
    };

    const handleEdit = (tax) => {
        setFormData({
            ...tax,
            sales_account_id: tax.sales_account_id?._id || tax.sales_account_id || '',
            purchase_account_id: tax.purchase_account_id?._id || tax.purchase_account_id || '',
            gst_sales_ledger_id: tax.gst_sales_ledger_id?._id || tax.gst_sales_ledger_id || '',
            gst_purchase_ledger_id: tax.gst_purchase_ledger_id?._id || tax.gst_purchase_ledger_id || '',
            igst_sales_ledger_id: tax.igst_sales_ledger_id?._id || tax.igst_sales_ledger_id || '',
            igst_purchase_ledger_id: tax.igst_purchase_ledger_id?._id || tax.igst_purchase_ledger_id || ''
        });
        setIsEditing(true);
        setShowDrawer(true);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            sales_account_id: '',
            purchase_account_id: '',
            tax_type: 'TAXABLE',
            local_central: 'LOCAL',
            cgst_rate: 0,
            sgst_rate: 0,
            igst_rate: 0,
            gst_sales_ledger_id: '',
            gst_purchase_ledger_id: '',
            igst_sales_ledger_id: '',
            igst_purchase_ledger_id: ''
        });
        setIsEditing(false);
        setError('');
    };

    const filteredTaxes = taxes.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="dashboard-layout">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />

            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}

            <main className="dashboard-main">
                <Header
                    toggleSidebar={toggleSidebar}
                    title="Tax Master"
                    actions={
                        <button className="btn-premium-primary !py-1.5 !px-4" onClick={() => { resetForm(); setShowDrawer(true); }}>
                            <PlusCircle size={18} />
                            <span className="text-[10px] uppercase font-black">Add New Tax</span>
                        </button>
                    }
                />
                <div className="master-content-layout fade-in">
                    <div className="toolbar-premium">
                        <div className="search-premium">
                            <Search size={20} />
                            <input
                                type="text"
                                placeholder="Search taxes..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 italic">
                                Scoped Result: {filteredTaxes.length}
                            </span>
                        </div>
                    </div>

                    <div className="table-container-premium">
                        <table className="table-premium">
                            <thead>
                                <tr>
                                    <th>GST Name</th>
                                    <th>GST %</th>
                                    <th>Sales Account</th>
                                    <th>Purchase Account</th>
                                    <th>Taxable / Exempted</th>
                                    <th>Local Tax / Central Tax</th>
                                    <th>GST Classification</th>
                                    <th>CGST %</th>
                                    <th>SGST %</th>
                                    <th>IGST %</th>
                                    <th style={{ textAlign: 'right' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="11" style={{ textAlign: 'center', padding: '100px 0' }}>
                                            <Loader2 className="animate-spin text-indigo-600 mx-auto mb-4" size={48} />
                                            <p className="font-black text-slate-300 uppercase tracking-[0.2em] text-xs">Accessing Archives...</p>
                                        </td>
                                    </tr>
                                ) : filteredTaxes.length === 0 ? (
                                    <tr>
                                        <td colSpan="11" style={{ textAlign: 'center', padding: '100px 0' }}>
                                            <Percent size={64} className="text-slate-100 mx-auto mb-4" />
                                            <p className="font-bold text-slate-400">No taxes found.</p>
                                        </td>
                                    </tr>
                                ) : filteredTaxes.map((tax) => (
                                    <tr key={tax._id} className="group">
                                        <td>
                                            <div className="flex items-center gap-4">
                                                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                                                    <Percent size={18} />
                                                </div>
                                                <span className="text-sm font-black text-slate-800 uppercase tracking-tight leading-none group-hover:text-indigo-600 transition-colors">{tax.name}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="font-semibold text-slate-600">
                                                {tax.percentage}%
                                            </span>
                                        </td>
                                        <td>
                                            <span className="text-xs font-semibold text-slate-700">
                                                {tax.sales_account_id?.name || '-'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="text-xs font-semibold text-slate-700">
                                                {tax.purchase_account_id?.name || '-'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`px-2 py-1 text-[10px] font-bold rounded-lg ${
                                                tax.tax_type === 'TAXABLE' 
                                                ? 'bg-green-50 text-green-700 border border-green-100' 
                                                : 'bg-slate-50 text-slate-700 border border-slate-100'
                                            }`}>
                                                {tax.tax_type === 'TAXABLE' ? 'Taxable' : 'Exempted'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`px-2 py-1 text-[10px] font-bold rounded-lg ${
                                                tax.local_central === 'LOCAL' 
                                                ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                                                : 'bg-purple-50 text-purple-700 border border-purple-100'
                                            }`}>
                                                {tax.local_central === 'LOCAL' ? 'Local Tax' : 'Central Tax'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="text-xs font-bold text-slate-600">
                                                {tax.local_central === 'LOCAL' ? 'Regular GST' : 'IGST'}
                                            </span>
                                        </td>
                                        <td>{tax.local_central === 'LOCAL' ? `${tax.cgst_rate || 0}%` : '-'}</td>
                                        <td>{tax.local_central === 'LOCAL' ? `${tax.sgst_rate || 0}%` : '-'}</td>
                                        <td>{tax.local_central === 'CENTRAL' ? `${tax.igst_rate || 0}%` : '-'}</td>
                                        <td>
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleEdit(tax)} className="action-icon-btn edit"><Edit size={18} /></button>
                                                <button onClick={() => handleDelete(tax)} className="action-icon-btn delete"><Trash2 size={18} /></button>
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
                        <div className="fixed inset-0 flex items-center justify-center z-[1000] p-4">
                            <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                <div className="border-b border-slate-100 px-6 py-4 flex justify-between items-center bg-white">
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{isEditing ? 'GST ALTERATION' : 'GST CREATION'}</h3>
                                        <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">Master Entity Registry</p>
                                    </div>
                                    <button onClick={() => { resetForm(); setShowDrawer(false); }} className="px-3 py-1.5 border border-red-200 rounded-lg text-red-600 hover:bg-red-50 text-xs font-black uppercase tracking-wider transition-colors flex items-center gap-1.5">
                                        <X size={14} /> CLOSE
                                    </button>
                                </div>
                                <div className="px-6 py-4 overflow-y-auto flex-1">
                                    {error && (
                                        <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl flex items-center gap-3 text-rose-600 font-bold text-sm mb-4">
                                            <AlertCircle size={20} /> {error}
                                        </div>
                                    )}
                                    <form id="tax-form" ref={formRef} onKeyDown={handleKeyDown} onSubmit={(e) => { e.preventDefault(); handleFormSubmitRequest(); }} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="form-group-premium col-span-2">
                                            <label>Tax Name *</label>
                                            <input
                                                type="text"
                                                name="name"
                                                required
                                                className="input-premium"
                                                placeholder="e.g. 5% GST"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            />
                                        </div>

                                        <div className="form-group-premium">
                                            <label>Sales Account *</label>
                                            <select
                                                required
                                                className="input-premium bg-white"
                                                value={formData.sales_account_id}
                                                onChange={(e) => setFormData({ ...formData, sales_account_id: e.target.value })}
                                            >
                                                <option value="">Select Sales Account</option>
                                                {ledgers.map(l => (
                                                    <option key={l._id} value={l._id}>{l.name} ({l.group})</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="form-group-premium">
                                            <label>Purchase Account *</label>
                                            <select
                                                required
                                                className="input-premium bg-white"
                                                value={formData.purchase_account_id}
                                                onChange={(e) => setFormData({ ...formData, purchase_account_id: e.target.value })}
                                            >
                                                <option value="">Select Purchase Account</option>
                                                {ledgers.map(l => (
                                                    <option key={l._id} value={l._id}>{l.name} ({l.group})</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="form-group-premium">
                                            <label>Taxable / Exempted *</label>
                                            <select
                                                required
                                                className="input-premium bg-white"
                                                value={formData.tax_type}
                                                onChange={(e) => setFormData({ ...formData, tax_type: e.target.value })}
                                            >
                                                <option value="TAXABLE">Taxable</option>
                                                <option value="EXEMPTED">Exempted</option>
                                            </select>
                                        </div>

                                        <div className="form-group-premium">
                                            <label>Local / Central *</label>
                                            <select
                                                required
                                                className="input-premium bg-white"
                                                value={formData.local_central}
                                                onChange={(e) => setFormData({ ...formData, local_central: e.target.value })}
                                            >
                                                <option value="LOCAL">Local</option>
                                                <option value="CENTRAL">Central</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="border-t border-slate-100 pt-4">
                                        <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-4">
                                            {formData.local_central === 'LOCAL' ? 'LOCAL GST' : 'CENTRAL GST'}
                                        </h4>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="form-group-premium">
                                                <label>CGST Percentage (%)</label>
                                                <input
                                                    type="number"
                                                    disabled={formData.local_central !== 'LOCAL'}
                                                    min="0"
                                                    max="100"
                                                    step="0.01"
                                                    className="input-premium disabled:bg-slate-50 disabled:text-slate-400"
                                                    placeholder="Enter CGST %"
                                                    value={formData.cgst_rate}
                                                    onChange={(e) => setFormData({ ...formData, cgst_rate: e.target.value })}
                                                />
                                            </div>
                                            <div className="form-group-premium">
                                                <label>SGST Percentage (%)</label>
                                                <input
                                                    type="number"
                                                    disabled={formData.local_central !== 'LOCAL'}
                                                    min="0"
                                                    max="100"
                                                    step="0.01"
                                                    className="input-premium disabled:bg-slate-50 disabled:text-slate-400"
                                                    placeholder="Enter SGST %"
                                                    value={formData.sgst_rate}
                                                    onChange={(e) => setFormData({ ...formData, sgst_rate: e.target.value })}
                                                />
                                            </div>
                                            <div className="form-group-premium">
                                                <label>IGST Percentage (%)</label>
                                                <input
                                                    type="number"
                                                    disabled={formData.local_central !== 'CENTRAL'}
                                                    min="0"
                                                    max="100"
                                                    step="0.01"
                                                    className="input-premium disabled:bg-slate-50 disabled:text-slate-400"
                                                    placeholder="Enter IGST %"
                                                    value={formData.igst_rate}
                                                    onChange={(e) => setFormData({ ...formData, igst_rate: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t border-slate-100 pt-4">
                                        <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-4">
                                            ADDITIONAL LEDGER MAPPING
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="form-group-premium">
                                                <label>GST Sales</label>
                                                <select
                                                    className="input-premium bg-white"
                                                    value={formData.gst_sales_ledger_id}
                                                    onChange={(e) => setFormData({ ...formData, gst_sales_ledger_id: e.target.value })}
                                                >
                                                    <option value="">Select Ledger</option>
                                                    {ledgers.map(l => (
                                                        <option key={l._id} value={l._id}>{l.name} ({l.group})</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="form-group-premium">
                                                <label>GST Purchase</label>
                                                <select
                                                    className="input-premium bg-white"
                                                    value={formData.gst_purchase_ledger_id}
                                                    onChange={(e) => setFormData({ ...formData, gst_purchase_ledger_id: e.target.value })}
                                                >
                                                    <option value="">Select Ledger</option>
                                                    {ledgers.map(l => (
                                                        <option key={l._id} value={l._id}>{l.name} ({l.group})</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="form-group-premium">
                                                <label>IGST Sales</label>
                                                <select
                                                    className="input-premium bg-white"
                                                    value={formData.igst_sales_ledger_id}
                                                    onChange={(e) => setFormData({ ...formData, igst_sales_ledger_id: e.target.value })}
                                                >
                                                    <option value="">Select Ledger</option>
                                                    {ledgers.map(l => (
                                                        <option key={l._id} value={l._id}>{l.name} ({l.group})</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="form-group-premium">
                                                <label>IGST Purchase</label>
                                                <select
                                                    className="input-premium bg-white"
                                                    value={formData.igst_purchase_ledger_id}
                                                    onChange={(e) => setFormData({ ...formData, igst_purchase_ledger_id: e.target.value })}
                                                >
                                                    <option value="">Select Ledger</option>
                                                    {ledgers.map(l => (
                                                        <option key={l._id} value={l._id}>{l.name} ({l.group})</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-center gap-4 pt-6 pb-2">
                                        <button type="submit" form="tax-form" disabled={submitting} className="px-12 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-black uppercase tracking-wider transition-colors shadow-sm flex items-center gap-2">
                                            {submitting ? <Loader2 className="animate-spin" size={14} /> : 'SAVE'}
                                        </button>
                                        <button type="button" onClick={() => { resetForm(); setShowDrawer(false); }} className="px-12 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold transition-colors">Discard</button>
                                    </div>
                                </form>
                                </div>
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

export default TaxMaster;
