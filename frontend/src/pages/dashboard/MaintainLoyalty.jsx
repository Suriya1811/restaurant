import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import { Gift, Save, Loader2, AlertCircle, CheckCircle, Search, CalendarDays } from 'lucide-react';
import '../../pages/SettingsPage.css';

const MaintainLoyalty = () => {
    const { user } = useAuth();
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [loyaltyForm, setLoyaltyForm] = useState({
        enabled: false,
        points_per_100: 1,
        target_points: 0,
        point_value: 1
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const toggleSidebar = () => {
        if (window.innerWidth <= 768) { setIsMobileSidebarOpen(!isMobileSidebarOpen); }
        else { const n = !isCollapsed; setIsCollapsed(n); localStorage.setItem('sidebarCollapsed', n); }
    };

    const fetchLoyaltySettings = async () => {
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/settings`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.success && result.data && result.data.loyalty) {
                setLoyaltyForm(result.data.loyalty);
            }
        } catch (err) { console.error("Failed to fetch loyalty settings", err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchLoyaltySettings(); }, []);

    const handleSave = async () => {
        setSaving(true);
        setError('');
        setSuccess(false);
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/settings/loyalty`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(loyaltyForm)
            });
            const result = await response.json();
            if (result.success) {
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
            } else { setError(result.message); }
        } catch (err) { setError('Failed to update loyalty settings'); }
        finally { setSaving(false); }
    };

    return (
        <div className="dashboard-layout">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />
            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}
            <main className="dashboard-main">
                <Header toggleSidebar={toggleSidebar} />
                <div className="master-content-layout fade-in">
                    <div className="master-header-premium">
                        <div className="master-title-premium">
                            <div className="flex items-center gap-2 mb-2">
                                <Gift className="text-indigo-600" size={18} />
                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2.5 py-1 rounded-full">Extra Modules</span>
                            </div>
                            <h2>Maintain Loyalty</h2>
                            <p>Configure point-based customer rewards and redemption parameters.</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] p-10">
                        {error && <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-rose-600 font-bold text-sm mb-6"><AlertCircle size={18} /> {error}</div>}
                        {success && <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3 text-emerald-700 font-bold text-sm mb-6"><CheckCircle size={18} /> Loyalty settings updated successfully!</div>}

                        <div className="max-w-3xl mx-auto space-y-10">
                            <div className="flex flex-col md:flex-row items-center justify-between bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 gap-6">
                                <div className="flex-1 text-center md:text-left">
                                    <p className="text-sm font-black text-slate-800 uppercase tracking-tight">Activate Loyalty Reward System</p>
                                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">Enabling this module will allow customers to earn and redeem points.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="hidden peer" checked={loyaltyForm.enabled} 
                                        onChange={e => setLoyaltyForm({ ...loyaltyForm, enabled: e.target.checked })} />
                                    <div className="w-16 h-8 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all"></div>
                                </label>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="form-group-premium">
                                    <label>Points Earned Per ₹100 Spent</label>
                                    <div className="relative">
                                        <input type="number" className="input-premium pl-12" value={loyaltyForm.points_per_100} 
                                            onChange={e => setLoyaltyForm({ ...loyaltyForm, points_per_100: e.target.value })} 
                                            placeholder="e.g. 1" />
                                        <Gift className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 mt-2">1 Point per ₹100 is standard industry practice.</p>
                                </div>
                                <div className="form-group-premium">
                                    <label>Minimum Wallet Points for Redemption</label>
                                    <div className="relative">
                                        <input type="number" className="input-premium pl-12" value={loyaltyForm.target_points} 
                                            onChange={e => setLoyaltyForm({ ...loyaltyForm, target_points: e.target.value })} 
                                            placeholder="e.g. 500" />
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 mt-2">Minimum points required in user's profile to unlock redemption.</p>
                                </div>
                                <div className="form-group-premium">
                                    <label>Redemption Cash Value per Point (₹)</label>
                                    <div className="relative">
                                        <input type="number" className="input-premium pl-12" value={loyaltyForm.point_value} 
                                            onChange={e => setLoyaltyForm({ ...loyaltyForm, point_value: e.target.value })} 
                                            placeholder="e.g. 1" />
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 mt-2">How many Rupees is each point worth during checkout?</p>
                                </div>
                            </div>

                            <div className="flex justify-end pt-8 border-t border-slate-50 mt-8">
                                <button onClick={handleSave} disabled={saving} className="btn-premium-primary !py-5 !px-16 shadow-xl shadow-indigo-100/50">
                                    {saving ? <><Loader2 className="animate-spin" /> Saving...</> : <><Save size={18} /> Update Rewards Configuration</>}
                                </button>
                            </div>
                        </div>

                        <div className="mt-16 bg-indigo-50/50 rounded-3xl p-8 border border-indigo-50">
                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-indigo-600 shadow-sm flex-shrink-0">
                                    <AlertCircle size={24} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-indigo-900 uppercase tracking-tight">Important Note on Loyalty</h4>
                                    <p className="text-[11px] font-bold text-indigo-700/60 mt-1 leading-relaxed">
                                        Changes to points configuration will apply to all future transactions immediately. 
                                        Points already earned by customers will retain their count, but their redemption value may change if you adjust the 'Redemption Cash Value'.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default MaintainLoyalty;
