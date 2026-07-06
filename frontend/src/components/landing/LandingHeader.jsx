import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const LandingHeader = () => {
    const [scrolled, setScrolled] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const isRegister = location.pathname === '/register';

    return (
        <nav className={`fixed top-0 w-full z-50 py-6 transition-all duration-400 ${scrolled ? 'py-3 bg-white/80 backdrop-blur-xl border-b border-slate-200' : ''}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-end items-center">
                <div className="flex items-center gap-4">
                    {isRegister ? (
                        <Link to="/login" className="btn-primary no-underline px-8 py-3.5 rounded-xl text-base shadow-lg shadow-primary-500/40">
                            Sign In
                        </Link>
                    ) : (
                        <Link to="/register" className="btn-primary no-underline px-8 py-3.5 rounded-xl text-base shadow-lg shadow-primary-500/40">
                            Sign Up
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default LandingHeader;
