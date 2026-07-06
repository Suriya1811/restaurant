import { useState, useEffect } from 'react';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';
import { Loader2, ChefHat, Save, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import './Dashboard.css';

const KitchenSettings = () => {
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [categories, setCategories] = useState([]);

    const [mapping, setMapping] = useState([]);

    const toggleSidebar = () => {
        if (window.innerWidth <= 768) {
            setIsMobileSidebarOpen(!isMobileSidebarOpen);
        } else {
            const newState = !isCollapsed;
            setIsCollapsed(newState);
            localStorage.setItem('sidebarCollapsed', newState);
        }
    };

    const fetchConfig = async () => {
        setLoading(true);
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);
            const headers = { 'Authorization': `Bearer ${token}` };

            // Get mapping settings
            const resSet = await fetch(`${import.meta.env.VITE_API_URL}/settings`, { headers });
            const resultSet = await resSet.json();

            if (resultSet.success && resultSet.data?.printer) {
                setMapping(resultSet.data.printer.kitchen_mapping || []);
            }

            // Get live categories for dropdown mapping
            const resCat = await fetch(`${import.meta.env.VITE_API_URL}/categories`, { headers });
            const resultCat = await resCat.json();
            if (resultCat.success) setCategories(resultCat.data);

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchConfig(); }, []);

    const addMappingRow = () => {
        setMapping([...mapping, { category: '', printer_ip: '' }]);
    };

    const removeMappingRow = (index) => {
        const newMap = [...mapping];
        newMap.splice(index, 1);
        setMapping(newMap);
    };

    const updateMapping = (index, field, value) => {
        const newMap = [...mapping];
        newMap[index][field] = value;
        setMapping(newMap);
    };

    const handleSave = async () => {
        setSaving(true);
        setSuccessMsg('');
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);

            const res = await fetch(`${import.meta.env.VITE_API_URL}/settings/advanced`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ kitchen_mapping: mapping })
            });
            const result = await res.json();

            if (result.success) {
                setSuccessMsg('Categorical Kitchen Display matrices successfully integrated.');
                setTimeout(() => setSuccessMsg(''), 3000);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="dashboard-layout">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />

            <main className="dashboard-main">
                <Header toggleSidebar={toggleSidebar} />

                <div className="master-content-layout fade-in max-w-4xl mx-auto mt-8">
                    <div className="master-header-premium mb-8">
                        <div className="master-title-premium">
                            <div className="flex items-center gap-2 mb-2">
                                <ChefHat className="text-amber-600" size={18} />
                                <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest bg-amber-50 px-2.5 py-1 rounded-full">KDS Mapping</span>
                            </div>
                            <h2>Kitchen Displays (KDS)</h2>
                            <p>Map structural categories directly to distinct external station gateways.</p>
                        </div>
                    </div>

                    {successMsg && (
                        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3 text-emerald-700 font-bold fade-in">
                            <CheckCircle2 size={20} />
                            {successMsg}
                        </div>
                    )}

                    {loading ? (
                        <div className="flex flex-col items-center justify-center p-20">
                            <Loader2 className="animate-spin text-amber-600 mb-4" size={48} />
                            <p className="text-slate-400 font-bold tracking-widest uppercase text-xs">Parsing Topological Integrations...</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-100/50 p-8">
                            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                                    Categorical IP Sub-Routing
                                </h3>
                                <button onClick={addMappingRow} className="btn-premium-outline flex items-center gap-2 text-xs py-1.5 px-3">
                                    <Plus size={14} /> NEW ROUTE
                                </button>
                            </div>

                            {mapping.length === 0 ? (
                                <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200 mb-8">
                                    <p className="text-slate-400 font-bold">No structural station mappings active.</p>
                                    <p className="text-xs text-slate-400 mt-2">All unmapped items fallback to Primary KOT Base.</p>
                                </div>
                            ) : (
                                <div className="space-y-4 mb-8">
                                    {mapping.map((row, index) => (
                                        <div key={index} className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100 fade-in">
                                            <div className="flex-1">
                                                <select
                                                    value={row.category}
                                                    onChange={(e) => updateMapping(index, 'category', e.target.value)}
                                                    className="input-premium w-full !bg-white"
                                                >
                                                    <option value="">Select Target Menu Category</option>
                                                    {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                                                </select>
                                            </div>
                                            <div className="text-slate-400 font-bold text-lg">→</div>
                                            <div className="flex-1">
                                                <input
                                                    type="text"
                                                    value={row.printer_ip}
                                                    onChange={(e) => updateMapping(index, 'printer_ip', e.target.value)}
                                                    placeholder="Target Gateway IP (ex: 192.168.1.115)"
                                                    className="input-premium w-full !bg-white"
                                                />
                                            </div>
                                            <button
                                                onClick={() => removeMappingRow(index)}
                                                className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Drop Mapping Route"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex justify-between items-center pt-6 border-t border-slate-100">
                                <span className="text-xs font-bold text-slate-400">Items missing map routing resolve to the Default IP matrix.</span>
                                <button
                                    onClick={handleSave}
                                    className="btn-premium flex items-center gap-2"
                                    disabled={saving}
                                >
                                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                    {saving ? 'SECURING ROUTES...' : 'COMMIT MAP TOPOLOGY'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default KitchenSettings;
