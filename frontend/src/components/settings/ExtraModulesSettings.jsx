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
            <h2 className="text-xl font-black uppercase tracking-wider mb-6" style={{ color: '#ea580c' }}>
                EXTRA MODULES
            </h2>

            {error && <div className="bg-rose-50 border border-rose-200 p-4 rounded-lg flex items-center gap-3 text-rose-600 font-bold text-sm mb-6"><AlertCircle size={18} /> {error}</div>}
            {success && <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg flex items-center gap-3 text-emerald-700 font-bold text-sm mb-6"><CheckCircle size={18} /> {success}</div>}

            <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                {[
                    { key: 'coupon_enabled', label: 'Coupon Module' },
                    { key: 'printer_enabled', label: 'Printer Settings' },
                    { key: 'loyalty_enabled', label: 'Loyalty Module' },
                    { key: 'kot_enabled', label: 'KOT Module' },
                    { key: 'reports_enabled', label: 'Advanced Reports' },
                    { key: 'party_order_enabled', label: 'Party Order Module' }
                ].map((mod, index) => (
                    <label
                        key={mod.key}
                        className={`flex items-center gap-5 px-6 py-4 cursor-pointer hover:bg-slate-50 transition-colors ${index !== 5 ? 'border-b border-slate-200' : ''}`}
                    >
                        <input
                            type="checkbox"
                            checked={modules[mod.key] || false}
                            onChange={(e) => setModules({...modules, [mod.key]: e.target.checked})}
                            className="w-5 h-5 rounded border-2 border-slate-400 text-orange-500 focus:ring-orange-500 focus:ring-2 cursor-pointer"
                            style={{ accentColor: '#ea580c' }}
                        />
                        <span className="text-base font-bold text-slate-800">
                            {mod.label}
                        </span>
                    </label>
                ))}
            </div>

            <div className="flex justify-end mt-8">
                <button
                    onClick={saveModules}
                    disabled={saving}
                    className="px-8 py-3 text-white font-black uppercase tracking-widest rounded-md shadow-lg hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50 text-sm"
                    style={{ backgroundColor: '#ea580c', minWidth: '150px', justifyContent: 'center' }}
                >
                    {saving ? (
                        <Loader2 size={16} className="animate-spin" />
                    ) : (
                        <>
                            <Save size={16} />
                            SAVE
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default ExtraModulesSettings;
