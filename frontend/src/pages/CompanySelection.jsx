import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const CompanySelection = () => {
    const navigate = useNavigate();
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/companies`);
                const result = await response.json();
                if (result.success) {
                    setCompanies(result.data || []);
                }
            } catch (err) {
                console.error("Failed to fetch companies:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchCompanies();
    }, []);

    const handleSelectCompany = (company) => {
        navigate('/login', { state: { company: company.company_name, logo_url: company.logo_url } });
    };

    return (
        <div className="h-screen w-screen flex overflow-hidden relative">
            {/* Left Column: Company List */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 lg:p-16 h-full overflow-y-auto"
                 style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
                <motion.div 
                    initial={{ opacity: 0, x: -25 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="w-full lg:w-[90%] max-w-[500px]"
                >
                    <div className="form-header mb-8 flex flex-col items-center text-center">
                        <img
                            src="/Logo_new_bg.png"
                            alt="Yugam Software Logo"
                            style={{ maxWidth: '250px', height: 'auto' }}
                        />
                        <h2 className="text-3xl font-bold text-white mt-6 mb-2">Select Your Company</h2>
                        <p className="text-slate-400 text-sm">Please select your company to proceed to login.</p>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="animate-spin text-blue-500 mb-4" size={40} />
                            <p className="text-slate-400 font-semibold text-sm uppercase tracking-widest">Loading Companies...</p>
                        </div>
                    ) : companies.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="bg-slate-800/50 rounded-2xl p-8 max-w-md mx-auto border border-slate-700">
                                <h3 className="text-lg font-bold text-slate-200 mb-2">No Companies Found</h3>
                                <p className="text-slate-400 text-sm mb-6">It looks like there are no registered companies on this system yet.</p>
                                <Link to="/register" className="inline-block bg-[#2563eb] text-white font-bold py-3 px-8 rounded-xl hover:bg-[#1d4ed8] transition-colors shadow-lg shadow-blue-500/30">
                                    Register New Company
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                            {companies.map((company) => (
                                <div 
                                    key={company._id}
                                    onClick={() => handleSelectCompany(company)}
                                    className="bg-slate-800/50 border border-slate-700 hover:border-blue-500 hover:bg-slate-800 rounded-2xl p-4 flex items-center cursor-pointer transition-all group"
                                >
                                    <div className="flex-shrink-0 mr-4">
                                        {company.logo_url ? (
                                            <img 
                                                src={company.logo_url} 
                                                alt={company.company_name} 
                                                className="w-16 h-16 object-contain rounded-xl bg-white p-1 group-hover:scale-105 transition-transform"
                                            />
                                        ) : (
                                            <div className="w-16 h-16 bg-[#2563eb] text-white rounded-xl flex items-center justify-center text-3xl font-bold group-hover:scale-105 transition-transform shadow-lg shadow-blue-500/30">
                                                {company.company_name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-grow">
                                        <h3 className="text-lg font-bold text-white leading-tight group-hover:text-blue-400 transition-colors">{company.company_name}</h3>
                                        {company.store_name && company.store_name !== company.company_name && (
                                            <p className="text-sm text-slate-400 font-medium mt-1 line-clamp-1">{company.store_name}</p>
                                        )}
                                    </div>
                                    <div className="text-slate-500 group-hover:text-blue-500 transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {companies.length > 0 && (
                        <div className="mt-8 text-center pt-6 border-t border-slate-700/50">
                            <p className="text-sm text-slate-400 font-medium">
                                Need to register a new company?{' '}
                                <Link to="/register" className="text-[#2563eb] font-bold hover:text-[#1d4ed8] transition-colors ml-1 hover:underline underline-offset-4">
                                    Click here
                                </Link>
                            </p>
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Right Column: Engaged Graphic & Marketing Panel */}
            <div className="hidden lg:flex lg:w-1/2 flex-col justify-between h-full p-16 relative overflow-hidden"
                 style={{
                     background: 'linear-gradient(135deg, #1e3a5f 0%, #0F172A 100%)'
                 }}>
                {/* Curved line background graphic */}
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
                        src="/restaurant_pos_mockup.png"
                        alt="Yugam Dashboard Mockup"
                        className="w-full object-cover object-top rounded-t-3xl"
                    />
                </div>
            </div>
        </div>
    );
};

export default CompanySelection;
