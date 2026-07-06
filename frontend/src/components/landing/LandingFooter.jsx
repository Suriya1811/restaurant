import { Link } from 'react-router-dom';
import { Workflow } from 'lucide-react';

const LandingFooter = () => {
    return (
        <footer className="pt-32 pb-16 bg-white border-t border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-24 mb-24">
                    <div className="lg:col-span-1">
                        <div className="flex items-center gap-4 mb-8">
                            <img src="/logo.jpeg" alt="Yugam Logo" style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'cover' }} />
                            <span className="text-3xl font-normal tracking-tight text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>Yugam <span className="text-primary-500 font-bold">Software</span></span>
                        </div>
                        <p className="text-slate-500 font-bold mb-8 leading-relaxed">
                            Yugam Software is the definitive enterprise operating system for the modern hospitality industry. Scaling excellence through modular innovation.
                        </p>
                        <div className="flex gap-4">
                            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center font-black cursor-pointer transition-all duration-300 hover:bg-primary-500 hover:text-white hover:-translate-y-1">
                                <Link to="/" className="no-underline text-xl">X</Link>
                            </div>
                            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center font-black cursor-pointer transition-all duration-300 hover:bg-primary-500 hover:text-white hover:-translate-y-1">
                                <Link to="/" className="no-underline text-xl">In</Link>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-lg font-extrabold text-slate-900 mb-8 uppercase tracking-wider">Solution</h4>
                        <Link to="/" className="block text-base text-slate-600 font-semibold mb-5 transition-all duration-200 hover:text-primary-500 hover:translate-x-1">Dashboard Intelligence</Link>
                        <Link to="/" className="block text-base text-slate-600 font-semibold mb-5 transition-all duration-200 hover:text-primary-500 hover:translate-x-1">Modular Inventory</Link>
                        <Link to="/" className="block text-base text-slate-600 font-semibold mb-5 transition-all duration-200 hover:text-primary-500 hover:translate-x-1">Staff Architecture</Link>
                        <Link to="/" className="block text-base text-slate-600 font-semibold mb-5 transition-all duration-200 hover:text-primary-500 hover:translate-x-1">POS Integration</Link>
                    </div>

                    <div>
                        <h4 className="text-lg font-extrabold text-slate-900 mb-8 uppercase tracking-wider">Platform</h4>
                        <Link to="/" className="block text-base text-slate-600 font-semibold mb-5 transition-all duration-200 hover:text-primary-500 hover:translate-x-1">Security Matrix</Link>
                        <Link to="/" className="block text-base text-slate-600 font-semibold mb-5 transition-all duration-200 hover:text-primary-500 hover:translate-x-1">Global Network</Link>
                        <Link to="/" className="block text-base text-slate-600 font-semibold mb-5 transition-all duration-200 hover:text-primary-500 hover:translate-x-1">API Access</Link>
                        <Link to="/" className="block text-base text-slate-600 font-semibold mb-5 transition-all duration-200 hover:text-primary-500 hover:translate-x-1">Status Center</Link>
                    </div>

                    <div>
                        <h4 className="text-lg font-extrabold text-slate-900 mb-8 uppercase tracking-wider">Corporate</h4>
                        <Link to="/" className="block text-base text-slate-600 font-semibold mb-5 transition-all duration-200 hover:text-primary-500 hover:translate-x-1">Terms of Service</Link>
                        <Link to="/" className="block text-base text-slate-600 font-semibold mb-5 transition-all duration-200 hover:text-primary-500 hover:translate-x-1">Privacy Protocol</Link>
                        <Link to="/" className="block text-base text-slate-600 font-semibold mb-5 transition-all duration-200 hover:text-primary-500 hover:translate-x-1">Cookie Policy</Link>
                        <Link to="/" className="block text-base text-slate-600 font-semibold mb-5 transition-all duration-200 hover:text-primary-500 hover:translate-x-1">Contact Support</Link>
                    </div>
                </div>

                <div className="flex justify-between items-center pt-12 border-t border-slate-200">
                    <div className="text-slate-400 font-bold">
                        © 2026 Yugam Software Operations Center. All Rights Reserved.
                    </div>
                    <div className="text-slate-400 font-black tracking-widest uppercase text-xs">
                        Built for professional scale.
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default LandingFooter;
