import { useState, useEffect, useRef, memo } from 'react';
import { User, LogOut, X, Minus, Square, Building2, Phone, Mail, UserCircle, Calendar, HelpCircle, Info } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import logoSidebar from '../../assets/logo_sidebar.png';
import FinancialYearModal from '../common/FinancialYearModal';
import { getActiveFinancialYear, checkFinancialYearActive } from '@/utils/financialYearUtils';

const Header = ({ toggleSidebar, restaurantName, title, actions, headerActions, onClose, showClose = true, showProfileControls, isMaster }) => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const [isFYModalOpen, setIsFYModalOpen] = useState(false);
    const [activeFY, setActiveFY] = useState(() => getActiveFinancialYear());
    const profileRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setIsProfileOpen(false);
                setIsHelpOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Listen for keyboard shortcuts globally & FY change custom events
    useEffect(() => {
        const fyCheck = checkFinancialYearActive();
        if (fyCheck.isExpired || fyCheck.isInvalid) {
            setIsFYModalOpen(true);
        }

        const handleKeyDown = (e) => {
            const tag = e.target?.tagName;
            const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target?.isContentEditable;

            if (e.altKey && (e.key === 'F2' || e.code === 'F2' || e.keyCode === 113)) {
                e.preventDefault();
                e.stopPropagation();
                setIsFYModalOpen(true);
                return;
            }

            if (!isInput) {
                if (e.ctrlKey) {
                    if (e.key === 'F2' || e.code === 'F2') {
                        e.preventDefault();
                        navigate('/dashboard/self-service/display');
                    } else if (e.key === 'F5' || e.code === 'F5') {
                        e.preventDefault();
                        navigate('/dashboard/self-service/ledgers');
                    } else if (e.key === 'F6' || e.code === 'F6') {
                        e.preventDefault();
                        navigate('/dashboard/self-service/products');
                    } else if (e.key === 'F9' || e.code === 'F9') {
                        e.preventDefault();
                        navigate('/dashboard/self-service/vouchers');
                    } else if (e.key === 'F12' || e.code === 'F12') {
                        e.preventDefault();
                        navigate('/dashboard/self-service/purchase-history');
                    }
                } else if (!e.altKey && !e.shiftKey) {
                    if (e.key === 'F2' || e.code === 'F2') {
                        e.preventDefault();
                        navigate('/dashboard/self-service/billing');
                    } else if (e.key === 'F3' || e.code === 'F3') {
                        e.preventDefault();
                        navigate('/dashboard/self-service/table-select');
                    } else if (e.key === 'F5' || e.code === 'F5') {
                        e.preventDefault();
                        navigate('/dashboard/self-service/ledgers/create');
                    } else if (e.key === 'F6' || e.code === 'F6') {
                        e.preventDefault();
                        navigate('/dashboard/self-service/products');
                    } else if (e.key === 'F9' || e.code === 'F9') {
                        e.preventDefault();
                        navigate('/dashboard/self-service/vouchers');
                    } else if (e.key === 'F12' || e.code === 'F12') {
                        e.preventDefault();
                        navigate('/dashboard/self-service/purchase');
                    }
                }
            }
        };

        const handleFYChange = (e) => {
            if (e.detail) {
                setActiveFY(e.detail);
            } else {
                setActiveFY(getActiveFinancialYear());
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('financial_year_changed', handleFYChange);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('financial_year_changed', handleFYChange);
        };
    }, [navigate]);

    const storeName = 'YUGAM SOFTWARE';
    const isMainDashboardRoute = location.pathname === '/dashboard/self-service/home' || 
                                location.pathname === '/dashboard/home' || 
                                location.pathname === '/dashboard' || 
                                location.pathname === '/dashboard/self-service' ||
                                location.pathname === '/dashboard/self-service/';
    const isMasterHeader = !isMainDashboardRoute || isMaster === true || showProfileControls === false;

    return (
        <header
            className={`dashboard-header ${isMasterHeader ? 'master-header' : ''}`}
            style={{
                height: '65px',
                backgroundColor: isMasterHeader ? '#ffffff' : '#0F172A',
                color: isMasterHeader ? '#0f172a' : '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 1.25rem',
                borderBottom: isMasterHeader ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
                zIndex: 100,
                flexShrink: 0
            }}
        >
            {/* Left side */}
            <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {title && (
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: isMasterHeader ? '#0f172a' : '#ffffff', margin: 0, letterSpacing: '-0.01em', textTransform: 'uppercase' }}>{title}</h2>
                )}
            </div>

            {/* Center: Store / Company Name in Bold White (Only on Main Dashboard Header) */}
            {!isMasterHeader && (
                <div className="header-center" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#ffffff', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                        {storeName}
                    </span>
                </div>
            )}

            {/* Right: Actions / Buttons */}
            <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', position: 'relative' }} ref={profileRef}>
                {(actions || headerActions) && <div className="flex items-center gap-2.5">{actions || headerActions}</div>}
                
                {/* Close button for Master Page Headers (matching Ledger Master styling) */}
                {isMasterHeader && showClose !== false && (
                    <button
                        type="button"
                        onClick={onClose || (() => navigate('/dashboard/self-service/home'))}
                        className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-md font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ml-1"
                        title="Close Module"
                    >
                        <X size={14} /> CLOSE
                    </button>
                )}
                
                {/* Profile Circle & Window Controls ONLY on Main Dashboard Header */}
                {!isMasterHeader && (
                    <>
                        {/* Help Button */}
                        <button
                            type="button"
                            onClick={() => {
                                setIsHelpOpen(!isHelpOpen);
                                setIsProfileOpen(false);
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                height: '36px',
                                padding: '0 14px',
                                borderRadius: '18px',
                                border: '1.5px solid rgba(255, 255, 255, 0.3)',
                                backgroundColor: isHelpOpen ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                                color: '#ffffff',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: 700,
                                transition: 'all 0.2s',
                                marginRight: '4px'
                            }}
                            title="Keyboard Shortcuts & Help"
                        >
                            <HelpCircle size={16} />
                            <span>Help</span>
                        </button>

                        <div
                            onClick={() => {
                                setIsProfileOpen(!isProfileOpen);
                                setIsHelpOpen(false);
                            }}
                            style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                border: '1.5px solid rgba(255, 255, 255, 0.3)',
                                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: '#ffffff',
                                transition: 'all 0.2s'
                            }}
                            title="Company Profile"
                        >
                            {user?.logo_url ? (
                                <img src={user.logo_url} alt="Logo" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                            ) : (
                                <UserCircle size={24} color="#ffffff" />
                            )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginLeft: '4px' }}>
                            <button
                                type="button"
                                onClick={() => {}}
                                style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: '2px' }}
                                title="Minimize"
                            >
                                <Minus size={16} />
                            </button>
                            <button
                                type="button"
                                onClick={() => {}}
                                style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: '2px' }}
                                title="Maximize"
                            >
                                <Square size={13} />
                            </button>
                            <button
                                type="button"
                                onClick={onClose || (() => navigate('/dashboard/self-service/home'))}
                                style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: '2px' }}
                                title="Close"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </>
                )}

                {/* Help / Keyboard Shortcuts Modal */}
                {isHelpOpen && (
                    <div
                        style={{
                            position: 'absolute',
                            right: '0',
                            top: 'calc(100% + 8px)',
                            width: '320px',
                            backgroundColor: '#ffffff',
                            borderRadius: '16px',
                            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
                            border: '1px solid #e2e8f0',
                            overflow: 'hidden',
                            zIndex: 9999,
                            padding: '0'
                        }}
                        className="animate-in slide-in-from-top-2 duration-200"
                    >
                        {/* Header */}
                        <div style={{ padding: '16px 18px 12px 18px' }}>
                            <h3 style={{ fontSize: '13px', fontWeight: 900, color: '#0F172A', textTransform: 'uppercase', margin: 0, letterSpacing: '0.05em' }}>
                                SHORTCUT KEYS
                            </h3>
                        </div>

                        {/* Shortcuts Table */}
                        <div style={{ padding: '0 16px 12px 16px', maxHeight: '380px', overflowY: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0', fontSize: '12px' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#0F172A', color: '#ffffff' }}>
                                        <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 800, textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.05em', borderTopLeftRadius: '6px', borderBottomLeftRadius: '6px', width: '40%' }}>KEY</th>
                                        <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 800, textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.05em', borderTopRightRadius: '6px', borderBottomRightRadius: '6px', width: '60%' }}>FUNCTION</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        { key: 'F2', func: 'Sales Bill' },
                                        { key: 'F3', func: 'KOT' },
                                        { key: 'F5', func: 'Ledger Creation' },
                                        { key: 'F6', func: 'Item Creation' },
                                        { key: 'F9', func: 'Voucher' },
                                        { key: 'F12', func: 'Purchase Entry' },
                                        { key: 'Ctrl + F2', func: 'Sales Display', isGroupHeader: true },
                                        { key: 'Ctrl + F5', func: 'Ledger Display' },
                                        { key: 'Ctrl + F6', func: 'Item Display' },
                                        { key: 'Ctrl + F9', func: 'Voucher Display' },
                                        { key: 'Ctrl + F12', func: 'Purchase Display' }
                                    ].map((item, index) => (
                                        <tr key={index} style={{ borderBottom: '1px solid #f1f5f9', borderTop: item.isGroupHeader ? '2px solid #e2e8f0' : 'none' }} className="hover:bg-slate-50 transition-colors">
                                            <td style={{ padding: '8px 12px', fontWeight: 800, color: '#2563eb', whiteSpace: 'nowrap' }}>{item.key}</td>
                                            <td style={{ padding: '8px 12px', fontWeight: 600, color: '#1e293b' }}>{item.func}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer Note */}
                        <div style={{ padding: '10px 16px', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Info size={16} style={{ color: '#2563eb', flexShrink: 0 }} />
                            <span style={{ fontSize: '11px', fontWeight: 600, color: '#475569' }}>
                                Use these shortcuts to work faster
                            </span>
                        </div>
                    </div>
                )}

                {/* Company Profile Popup Modal */}
                {isProfileOpen && (
                    <div
                        style={{
                            position: 'absolute',
                            right: '0',
                            top: 'calc(100% + 12px)',
                            width: '320px',
                            backgroundColor: '#ffffff',
                            borderRadius: '16px',
                            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.35)',
                            border: '1px solid #e2e8f0',
                            overflow: 'hidden',
                            zIndex: 9999,
                            padding: '0'
                        }}
                        className="animate-in slide-in-from-top-2 duration-200"
                    >
                        {/* Popup Header with YUGAM SOFTWARE Logo */}
                        <div style={{ padding: '18px 20px', backgroundColor: '#0F172A', color: '#ffffff', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#ffffff', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #e2e8f0' }}>
                                    <img src={logoSidebar} alt="YUGAM" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                </div>
                                <div style={{ overflow: 'hidden' }}>
                                    <h3 style={{ fontSize: '15px', fontWeight: 900, color: '#ffffff', textTransform: 'uppercase', margin: 0, letterSpacing: '0.05em' }}>
                                        YUGAM SOFTWARE
                                    </h3>
                                    <p style={{ fontSize: '11px', fontWeight: 800, color: '#ea580c', textTransform: 'uppercase', margin: '2px 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        Software Solutions
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Popup Body: Yugam Software Company Details */}
                        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '34px', height: '34px', borderRadius: '10px', backgroundColor: '#fff7ed', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Building2 size={18} />
                                </div>
                                <div>
                                    <span style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', display: 'block', letterSpacing: '0.05em' }}>Company Name</span>
                                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#1e293b' }}>Yugam Software</span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '34px', height: '34px', borderRadius: '10px', backgroundColor: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Phone size={18} />
                                </div>
                                <div>
                                    <span style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', display: 'block', letterSpacing: '0.05em' }}>Contact Number</span>
                                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#1e293b' }}>+91 98765 43210</span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '34px', height: '34px', borderRadius: '10px', backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Mail size={18} />
                                </div>
                                <div>
                                    <span style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', display: 'block', letterSpacing: '0.05em' }}>Email ID</span>
                                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#1e293b' }}>support@yugamsoftware.com</span>
                                </div>
                            </div>
                        </div>

                        {/* Popup Footer with Logout option */}
                        <div style={{ padding: '12px 20px', backgroundColor: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Yugam POS v2.0</span>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsProfileOpen(false);
                                    logout();
                                }}
                                style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', padding: '6px 14px', borderRadius: '8px', fontSize: '11px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                                <LogOut size={13} /> LOGOUT
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <FinancialYearModal isOpen={isFYModalOpen} onClose={() => setIsFYModalOpen(false)} />
        </header>
    );
};

export default memo(Header);
