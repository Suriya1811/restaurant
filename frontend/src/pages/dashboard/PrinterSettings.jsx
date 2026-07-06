import { useState, useEffect } from 'react';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';
import { Loader2, Printer, Save, CheckCircle2 } from 'lucide-react';
import './Dashboard.css';

const PrinterSettings = () => {
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    const [settings, setSettings] = useState({
        kot_printer_ip: '',
        bill_printer_ip: ''
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

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);

            const res = await fetch(`${import.meta.env.VITE_API_URL}/settings`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await res.json();

            if (result.success && result.data?.printer) {
                setSettings({
                    kot_printer_ip: result.data.printer.kot_printer_ip || '',
                    bill_printer_ip: result.data.printer.bill_printer_ip || ''
                });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchSettings(); }, []);

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
                body: JSON.stringify(settings)
            });
            const result = await res.json();

            if (result.success) {
                setSuccessMsg('Printer network settings successfully updated.');
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
                                <Printer className="text-slate-600" size={18} />
                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest bg-slate-100 px-2.5 py-1 rounded-full">Settings</span>
                            </div>
                            <h2>Network Printer Routing</h2>
                            <p>Configure local network topology for direct IP automated printing bounds.</p>
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
                            <Loader2 className="animate-spin text-slate-600 mb-4" size={48} />
                            <p className="text-slate-400 font-bold tracking-widest uppercase text-xs">Parsing Hardware Vectors...</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-100/50 p-8">
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 pb-4 border-b border-slate-100">
                                Output Gateways
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                                        Primary Point of Sale (Bill Printer) IP Address
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.bill_printer_ip}
                                        onChange={(e) => setSettings({ ...settings, bill_printer_ip: e.target.value })}
                                        placeholder="e.g. 192.168.1.100"
                                        className="input-premium w-full"
                                    />
                                    <p className="text-xs text-slate-400 mt-2">The direct hardware matrix IP bound for standard thermal receipt operation.</p>
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                                        Primary KOT (Kitchen) IP Address
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.kot_printer_ip}
                                        onChange={(e) => setSettings({ ...settings, kot_printer_ip: e.target.value })}
                                        placeholder="e.g. 192.168.1.101"
                                        className="input-premium w-full"
                                    />
                                    <p className="text-xs text-slate-400 mt-2">The base fallback gateway for all kitchen slip operations.</p>
                                </div>
                            </div>

                            <div className="flex justify-end pt-6 border-t border-slate-100">
                                <button
                                    onClick={handleSave}
                                    className="btn-premium flex items-center gap-2"
                                    disabled={saving}
                                >
                                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                    {saving ? 'UPDATING BOUNDS...' : 'SAVE GATEWAY CONFIGURATION'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default PrinterSettings;
