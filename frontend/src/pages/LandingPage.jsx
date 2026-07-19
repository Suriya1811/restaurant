import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Login.css'; // Reuse login styling

const LandingPage = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Get selected company
    const selectedCompany = location.state?.company;
    const companyLogo = location.state?.logo_url;

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isPasswordRequired, setIsPasswordRequired] = useState(true);
    const [checkingPassword, setCheckingPassword] = useState(false);
    
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });

    useEffect(() => {
        if (!selectedCompany) {
            navigate('/');
        } else {
            // Auto check password requirement for admin on mount
            checkPasswordRequirement('admin');
        }
    }, [selectedCompany, navigate]);
    
    const checkPasswordRequirement = async (username) => {
        if (!username || !selectedCompany) return;
        setCheckingPassword(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/check-status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, company_name: selectedCompany })
            });
            const data = await response.json();
            if (data.success && data.password_enabled !== undefined) {
                setIsPasswordRequired(data.password_enabled);
            }
        } catch (err) {
            console.error('Failed to check password requirement', err);
        } finally {
            setCheckingPassword(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const res = await login({ username: formData.username, password: formData.password, company_name: selectedCompany });

        if (res.success) {
            navigate('/dashboard/self-service/home');
        } else {
            setError(res.error);
        }
        setLoading(false);
    };

    return (
        <div className="h-screen w-screen flex overflow-hidden relative">
            {/* Left Column: Login Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 lg:p-16 h-full overflow-y-auto"
                 style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
                <motion.div 
                    initial={{ opacity: 0, x: -25 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="auth-form-wrapper w-full lg:w-[90%] max-w-[400px]"
                >
                    <div className="form-header mb-8 flex flex-col items-center text-center">
                        <Link to="/">
                            {companyLogo ? (
                                <img src={companyLogo} alt={selectedCompany} style={{ maxWidth: '150px', height: 'auto', marginBottom: '1rem', borderRadius: '8px' }} />
                            ) : (
                                <div className="w-16 h-16 bg-[#2563eb] text-white rounded-xl flex items-center justify-center text-2xl font-bold mb-4 shadow-lg shadow-blue-500/30">
                                    {selectedCompany?.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </Link>
                        <h2 className="text-2xl font-bold text-gray-800">{selectedCompany}</h2>
                        <p className="text-gray-500 text-sm mt-1">Please sign in to continue</p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded-xl text-red-600 font-bold flex items-center gap-2 text-sm">
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="w-full mt-6">
                        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6 shadow-sm">
                            {/* Email Field */}
                            <div className="px-5 py-3 border-b border-gray-200 relative">
                                <label className="block text-[13px] font-medium text-gray-500 mb-1">User ID or Email</label>
                                <input
                                    type="text"
                                    name="username"
                                    required
                                    className="w-full text-base font-semibold text-gray-900 bg-[#edf2f7] outline-none border-none py-1.5 px-3 rounded-sm focus:ring-0"
                                    value={formData.username}
                                    onChange={handleChange}
                                    onBlur={(e) => checkPasswordRequirement(e.target.value)}
                                />
                            </div>
                            
                            {/* Password Field */}
                            {isPasswordRequired && (
                                <div className="px-5 pt-3 pb-5 relative">
                                    <label className="block text-[13px] font-medium text-gray-500 mb-1">Password</label>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        required={isPasswordRequired}
                                        className="w-full text-base font-semibold text-gray-900 bg-[#edf2f7] outline-none border-none py-1.5 px-3 rounded-sm focus:ring-0 pr-10"
                                        value={formData.password}
                                        onChange={handleChange}
                                    />
                                    <div 
                                        className="absolute right-5 top-10 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                         {showPassword ? (
                                             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
                                         ) : (
                                             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                                         )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Remember me */}
                        <div className="flex justify-between items-center mb-8 text-sm">
                            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                                <input type="checkbox" className="rounded border-gray-300 w-4 h-4 text-[#2563eb] focus:ring-[#2563eb]" />
                                Remember me
                            </label>
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-start">
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white h-12 px-10 rounded-lg font-bold text-base transition-colors flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin w-5 h-5" />
                                ) : (
                                    'LOGIN'
                                )}
                            </button>
                        </div>

                        <div className="mt-8 text-sm text-slate-300">
                            New to Yugam software?{' '}
                            <Link to="/register" className="text-[#2563eb] font-semibold hover:text-[#1d4ed8] transition-colors">
                                Register here
                            </Link>
                        </div>
                    </form>
                </motion.div>
            </div>

            {/* Right Column: Engaged Graphic & Marketing Panel */}
            <div className="hidden lg:flex lg:w-1/2 flex-col justify-between h-full p-16 relative overflow-hidden"
                 style={{
                     background: 'linear-gradient(135deg, #1e3a5f 0%, #0F172A 100%)'
                 }}>
                {/* Curved line background graphic inspired by reference screenshot */}
                <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
                    <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
                        <circle cx="100" cy="0" r="30" fill="none" stroke="white" strokeWidth="0.5" />
                        <circle cx="100" cy="0" r="45" fill="none" stroke="white" strokeWidth="0.5" />
                        <circle cx="100" cy="0" r="60" fill="none" stroke="white" strokeWidth="0.5" />
                        <circle cx="100" cy="0" r="75" fill="none" stroke="white" strokeWidth="0.5" />
                    </svg>
                </div>

                <div className="mt-20 relative z-10">
                    <h2 className="text-4xl font-extrabold text-white mb-4 leading-tight">
                        Delight Your Customers Effortlessly
                    </h2>
                    <p className="text-slate-300 text-lg leading-relaxed max-w-md">
                        Make your billing, stock, and accounting fast and simple with Yugam Software in a single click.
                    </p>
                </div>

                {/* Dashboard Interface Mockup at the bottom */}
                <div className="w-full mt-auto flex justify-center overflow-hidden max-h-[45vh] rounded-t-3xl relative z-10 border border-slate-700/50 shadow-2xl">
                    <img
                        src="/login.png"
                        alt="Yugam Dashboard Mockup"
                        className="w-full object-cover object-top rounded-t-3xl"
                    />
                </div>
            </div>
        </div>
    );
};

export default LandingPage;
