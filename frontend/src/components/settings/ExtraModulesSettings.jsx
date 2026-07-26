import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Lock, Save, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';

const ExtraModulesSettings = () => {
    const { user } = useAuth();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [authLoading, setAuthLoading] = useState(false);
    const [authError, setAuthError] = useState('');
    
    const [modules, setModules] = useState({
        coupon_enabled: false,
        loyalty_enabled: false,
        kot_enabled: false,
        printer_enabled: false,
        reports_enabled: false,
        party_order_enabled: true
    });
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const verifyPassword = async (e) => {
        e.preventDefault();
        setAuthLoading(true);
        setAuthError('');
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/settings/extra-modules/verify-password`, { password }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.data.success) {
                setIsAuthenticated(true);
                fetchModules();
            } else {
                setAuthError(res.data.message || 'Invalid password');
            }
        } catch (err) {
            setAuthError(err.response?.data?.message || 'Invalid password');
        } finally {
            setAuthLoading(false);
        }
    };

    const fetchModules = async () => {
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/settings`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.data.success && res.data.data.modules) {
                setModules(prev => ({
                    ...prev,
                    coupon_enabled: res.data.data.modules.coupon_enabled || false,
                    loyalty_enabled: res.data.data.modules.loyalty_enabled || false,
                    kot_enabled: res.data.data.modules.kot_enabled || false,
                    printer_enabled: res.data.data.modules.printer_enabled || false,
                    reports_enabled: res.data.data.modules.reports_enabled || false,
                    party_order_enabled: res.data.data.modules.party_order_enabled !== false
                }));
            }
        } catch (err) {
            console.error('Failed to fetch modules', err);
        }
    };

    const saveModules = async () => {
        setSaving(true);
        setError('');
        setSuccess('');
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            await axios.put(`${import.meta.env.VITE_API_URL}/settings/modules`, modules, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setSuccess('Modules updated successfully. Refresh the page if menus do not update immediately.');
            setTimeout(() => setSuccess(''), 5000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save modules');
        } finally {
            setSaving(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-lg border border-slate-200 shadow-sm max-w-md mx-auto mt-10">
                <div className="w-16 h-16 bg-orange-50 text-orange-600 flex items-center justify-center rounded-full mb-6">
                    <Lock size={32} />
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-2">Extra Modules</h3>
                <p className="text-sm text-slate-500 text-center mb-8">
                    This area is protected. Please contact Yugam software for this module.
                </p>
                <form onSubmit={verifyPassword} className="w-full space-y-4">
                    {authError && <div className="text-rose-600 text-sm font-semibold bg-rose-50 p-3 rounded">{authError}</div>}
                    <input 
                        type="password" 
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Enter Password" 
                        className="input-premium w-full text-center tracking-widest text-lg"
                        autoFocus
                    />
                    <button type="submit" disabled={authLoading || !password} className="w-full btn-premium-primary !py-3 flex justify-center items-center gap-2">
                        {authLoading ? <Loader2 className="animate-spin" size={18} /> : <Lock size={18} />}
                        Unlock Settings
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="fade-in">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-200">
                <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Extra Modules</h3>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] mt-0.5">Enable or disable additional features</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={saveModules} disabled={saving} className="btn-premium-primary !py-1.5 !px-4 !text-xs flex items-center gap-1.5">
                        {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} SAVE MODULES
                    </button>
                </div>
            </div>

            {error && <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-rose-600 font-bold text-sm mb-6"><AlertCircle size={18} /> {error}</div>}
            {success && <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3 text-emerald-700 font-bold text-sm mb-6"><CheckCircle size={18} /> {success}</div>}

            <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    
                    {/* Module Cards */}
                    <div className="p-5 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-between">
                        <div>
                            <h4 className="font-bold text-slate-800 text-sm">Coupon Module</h4>
                            <p className="text-xs text-slate-500 mt-1">Enable discount coupons</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={modules.coupon_enabled} onChange={e => setModules({...modules, coupon_enabled: e.target.checked})} className="sr-only peer" />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                        </label>
                    </div>

                    <div className="p-5 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-between">
                        <div>
                            <h4 className="font-bold text-slate-800 text-sm">Loyalty Module</h4>
                            <p className="text-xs text-slate-500 mt-1">Enable loyalty points system</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={modules.loyalty_enabled} onChange={e => setModules({...modules, loyalty_enabled: e.target.checked})} className="sr-only peer" />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                        </label>
                    </div>

                    <div className="p-5 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-between">
                        <div>
                            <h4 className="font-bold text-slate-800 text-sm">KOT Module</h4>
                            <p className="text-xs text-slate-500 mt-1">Kitchen Order Tickets</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={modules.kot_enabled} onChange={e => setModules({...modules, kot_enabled: e.target.checked})} className="sr-only peer" />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                        </label>
                    </div>

                    <div className="p-5 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-between">
                        <div>
                            <h4 className="font-bold text-slate-800 text-sm">Printer Settings</h4>
                            <p className="text-xs text-slate-500 mt-1">Thermal Printing</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={modules.printer_enabled} onChange={e => setModules({...modules, printer_enabled: e.target.checked})} className="sr-only peer" />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                        </label>
                    </div>

                    <div className="p-5 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-between">
                        <div>
                            <h4 className="font-bold text-slate-800 text-sm">Advanced Reports</h4>
                            <p className="text-xs text-slate-500 mt-1">Data Export & Analysis</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={modules.reports_enabled} onChange={e => setModules({...modules, reports_enabled: e.target.checked})} className="sr-only peer" />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                        </label>
                    </div>

                    <div className="p-5 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-between">
                        <div>
                            <h4 className="font-bold text-slate-800 text-sm">Party Order Module</h4>
                            <p className="text-xs text-slate-500 mt-1">Show Party Order in Sales Bill</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={modules.party_order_enabled !== false} onChange={e => setModules({...modules, party_order_enabled: e.target.checked})} className="sr-only peer" />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                        </label>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ExtraModulesSettings;
