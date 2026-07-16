import { useState, useEffect, memo, useRef } from 'react';
import { Menu, User, LogOut, XCircle, X, Bell, Mail, Phone, Building2, UserCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';


const Header = ({ toggleSidebar, restaurantName, title, actions, headerActions }) => {
    const { user, logout, hasModuleAccess } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const profileRef = useRef(null);

    const isHomeScreen = location.pathname === '/dashboard/self-service/home';

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className={`dashboard-header ${title ? 'master-header-mode' : ''}`}>
            <div className="header-left">
                {title && (
                    <h2 className="premium-page-title">{title}</h2>
                )}
            </div>

            {!title && (
                <div className="header-center">
                    <span className="company-profile-name text-lg font-semibold text-slate-700 tracking-wide">
                        {restaurantName || user?.businessName || user?.restaurant_name || 'Storefront'}
                    </span>
                </div>
            )}

            <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative' }}>
                {actions ? (
                    <div className="flex items-center gap-3">
                        {actions}
                    </div>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {headerActions && (
                            <div className="flex items-center gap-3 mr-2">
                                {headerActions}
                            </div>
                        )}

                        <div className="relative" ref={profileRef}>
                            <div className="user-profile bg-slate-50 border border-slate-100 shadow-sm !p-1.5" onClick={() => setIsProfileOpen(!isProfileOpen)}>
                                <div className="user-avatar" style={{ width: '36px', height: '36px' }}>
                                    {user?.logo_url ? (
                                        <img src={user.logo_url} alt="Logo" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                    ) : (
                                        <User size={19} className="text-indigo-600" />
                                    )}
                                </div>
                            </div>

                            {isProfileOpen && (
                                <div className="absolute right-0 top-full mt-3 w-72 bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden animate-in slide-in-from-top-2 duration-200" style={{ zIndex: 9999, pointerEvents: 'auto' }}>
                                    <div className="p-5 bg-gradient-to-br from-indigo-50 to-white border-b border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                                                {user?.logo_url ? (
                                                    <img src={user.logo_url} alt="Logo" className="w-full h-full object-cover rounded-xl" />
                                                ) : (
                                                    <Building2 size={24} />
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-black text-slate-800 text-lg leading-tight">{restaurantName || user?.businessName || user?.restaurant_name || 'Storefront'}</span>
                                                <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">{user?.role || 'Administrator'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-3">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                                                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0"><UserCircle size={16} /></div>
                                                <div className="flex flex-col overflow-hidden">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Person</span>
                                                    <span className="text-sm font-bold text-slate-700 truncate">{user?.name || user?.contact_person || 'Not Provided'}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                                                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0"><Mail size={16} /></div>
                                                <div className="flex flex-col overflow-hidden">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</span>
                                                    <span className="text-sm font-bold text-slate-700 truncate">{user?.email || 'Not Provided'}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                                                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0"><Phone size={16} /></div>
                                                <div className="flex flex-col overflow-hidden">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone Number</span>
                                                    <span className="text-sm font-bold text-slate-700 truncate">{user?.phone || 'Not Provided'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-slate-50 border-t border-slate-100 flex gap-2">
                                        <button
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setIsProfileOpen(false);
                                                logout();
                                            }}
                                            className="flex-1 flex items-center justify-center gap-2 bg-white text-rose-600 border border-slate-200 hover:border-rose-200 hover:bg-rose-50 px-4 py-2.5 rounded-xl font-black text-sm transition-all shadow-sm"
                                        >
                                            <LogOut size={16} pointerEvents="none" /> SIGN OUT
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {!isHomeScreen && (
                    <button
                        onClick={() => navigate('/dashboard/self-service/home')}
                        className="btn-action-close ml-2"
                        title="Close and Return to Home"
                    >
                        <X size={16} /> <span className="text-[10px] uppercase font-black">CLOSE</span>
                    </button>
                )}
            </div>
        </header>
    );
};

export default memo(Header);
