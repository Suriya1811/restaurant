import { useState, useEffect } from 'react';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';
import { Loader2, Globe, Save, CheckCircle2 } from 'lucide-react';
import './Dashboard.css';

const OrderIntegrationSettings = () => {
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    const [integration, setIntegration] = useState({
        enabled: false,
        zomato_api_key: '',
        swiggy_api_key: ''
    });

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

            const res = await fetch(`${import.meta.env.VITE_API_URL}/settings`, { headers });
            const result = await res.json();

            if (result.success && result.data?.orderIntegration) {
                setIntegration({
                    enabled: result.data.orderIntegration.enabled || false,
                    zomato_api_key: result.data.orderIntegration.zomato_api_key || '',
                    swiggy_api_key: result.data.orderIntegration.swiggy_api_key || ''
                });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchConfig(); }, []);

    const handleSave = async () => {
        setSaving(true);
        setSuccessMsg('');
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);

            const payload = {
                order_integration_enabled: integration.enabled,
                zomato_api_key: integration.zomato_api_key,
                swiggy_api_key: integration.swiggy_api_key
            };

            const res = await fetch(`${import.meta.env.VITE_API_URL}/settings/advanced`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            const result = await res.json();

            if (result.success) {
                setSuccessMsg('Third-party Gateway Keys actively synchronized.');
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
                                <Globe className="text-sky-600" size={18} />
                                <span className="text-[10px] font-black text-sky-600 uppercase tracking-widest bg-sky-50 px-2.5 py-1 rounded-full">Integrations</span>
                            </div>
                            <h2>External Point Connectors</h2>
                            <p>Map authentication vectors for 3rd party aggregator ingestion points.</p>
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
                            <Loader2 className="animate-spin text-sky-600 mb-4" size={48} />
                            <p className="text-slate-400 font-bold tracking-widest uppercase text-xs">Authenticating Keyspaces...</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-100/50 p-8">
                            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                                    Integration Keys
                                </h3>

                                <label className="flex items-center gap-3 cursor-pointer">
                                    <span className={`text-xs font-black uppercase tracking-widest ${integration.enabled ? 'text-emerald-600' : 'text-slate-400'}`}>
                                        {integration.enabled ? 'Active Connections Live' : 'Routing Suspended'}
                                    </span>
                                    <div className="relative">
                                        <input
                                            type="checkbox" className="sr-only"
                                            checked={integration.enabled}
                                            onChange={(e) => setIntegration({ ...integration, enabled: e.target.checked })}
                                        />
                                        <div className={`block w-12 h-7 rounded-full transition-colors ${integration.enabled ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>
                                        <div className={`dot absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform ${integration.enabled ? 'transform translate-x-5' : ''}`}></div>
                                    </div>
                                </label>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 opacity-transition" style={{ opacity: integration.enabled ? 1 : 0.5, pointerEvents: integration.enabled ? 'auto' : 'none' }}>
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                                        Zomato Webhook API Secret
                                    </label>
                                    <input
                                        type="password"
                                        value={integration.zomato_api_key}
                                        onChange={(e) => setIntegration({ ...integration, zomato_api_key: e.target.value })}
                                        placeholder="Enter secure API mapping key"
                                        className="input-premium w-full !font-mono"
                                    />
                                    <p className="text-xs text-slate-400 mt-2">Required for validating inbound payload requests.</p>
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                                        Swiggy Integration Token
                                    </label>
                                    <input
                                        type="password"
                                        value={integration.swiggy_api_key}
                                        onChange={(e) => setIntegration({ ...integration, swiggy_api_key: e.target.value })}
                                        placeholder="Enter active secure token"
                                        className="input-premium w-full !font-mono"
                                    />
                                    <p className="text-xs text-slate-400 mt-2">Registers the node to securely handshake events.</p>
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-6 border-t border-slate-100">
                                <span className="text-xs font-bold text-slate-400">Keys are securely hashed in the background processing core.</span>
                                <button
                                    onClick={handleSave}
                                    className="btn-premium flex items-center gap-2"
                                    disabled={saving}
                                >
                                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                    {saving ? 'UPDATING TOKENS...' : 'BIND SECURE CREDENTIALS'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default OrderIntegrationSettings;
