import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';
import { useState } from 'react';
import {
    Construction, ArrowRight, Star, Sparkles,
    Layout, Database, Activity, Rocket,
    Cpu, Lock, ChevronRight
} from 'lucide-react';
import './Dashboard.css';

const GenericModulePlaceholder = ({ title, moduleName }) => {
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    const toggleSidebar = () => {
        if (window.innerWidth <= 768) {
            setIsMobileSidebarOpen(!isMobileSidebarOpen);
        } else {
            const newState = !isCollapsed;
            setIsCollapsed(newState);
            localStorage.setItem('sidebarCollapsed', newState);
        }
    };

    const features = [
        { icon: <Sparkles size={16} />, label: 'AI-Powered Insights', desc: 'Predictive analytics and smart forecasting' },
        { icon: <Database size={16} />, label: 'Historical Archiving', desc: 'Deep data retention and audit logging' },
        { icon: <Activity size={16} />, label: 'Real-Time Monitoring', desc: 'Live dashboards with sub-second updates' },
        { icon: <Lock size={16} />, label: 'Enterprise Security', desc: 'Role-based access with audit trails' },
    ];

    return (
        <div className="dashboard-layout">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />
            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}
            <main className="dashboard-main">
                <Header toggleSidebar={toggleSidebar} />

                <div className="master-content-layout fade-in">
                    {/* Page Header */}
                    <div className="master-header-premium">
                        <div className="master-title-premium">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <Rocket size={16} style={{ color: '#7ea1c4' }} />
                                <span style={{
                                    fontSize: '0.65rem', fontWeight: 800, color: '#5788b7',
                                    textTransform: 'uppercase', letterSpacing: '0.08em',
                                    background: '#f0f7ff', padding: '0.2rem 0.65rem',
                                    borderRadius: '9999px', border: '1px solid rgba(126,161,196,0.2)'
                                }}>Enterprise Feature</span>
                            </div>
                            <h2>{title || 'Module Coming Soon'}</h2>
                            <p>Part of the RestoBoard Enterprise 2026 Intelligence Ecosystem.</p>
                        </div>
                        <button onClick={() => window.history.back()} className="btn-premium-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                            <ArrowRight className="rotate-180" size={16} /> Back
                        </button>
                    </div>

                    {/* Main Content — overlay area */}
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', position: 'relative' }}>
                        {/* Overlay badge */}
                        <div style={{
                            position: 'absolute', inset: 0, zIndex: 10,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            pointerEvents: 'none'
                        }}>
                            <div style={{
                                background: 'rgba(255,255,255,0.95)',
                                backdropFilter: 'blur(16px)',
                                border: '2px solid #E2E8F0',
                                borderRadius: '20px',
                                padding: '2.5rem 3rem',
                                textAlign: 'center',
                                boxShadow: '0 20px 60px rgba(15,23,42,0.12)',
                                maxWidth: '460px',
                                pointerEvents: 'auto'
                            }}>
                                <div style={{
                                    width: '64px', height: '64px',
                                    background: 'linear-gradient(135deg, #7ea1c4, #5788b7)',
                                    borderRadius: '16px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    margin: '0 auto 1.25rem',
                                    boxShadow: '0 8px 20px rgba(126,161,196,0.3)'
                                }}>
                                    <Construction size={32} style={{ color: 'white' }} />
                                </div>
                                <h3 style={{
                                    fontSize: '1.3rem', fontWeight: 800, color: '#0F172A',
                                    letterSpacing: '-0.02em', marginBottom: '0.75rem', textTransform: 'uppercase'
                                }}>
                                    {moduleName || 'Under Construction'}
                                </h3>
                                <p style={{
                                    color: '#64748B', fontWeight: 500, lineHeight: 1.6,
                                    marginBottom: '1.5rem', fontSize: '0.875rem'
                                }}>
                                    This module is being engineered with state-of-the-art capabilities. Expect real-time analytics, predictive intelligence, and enterprise-grade audit trails.
                                </p>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Build Progress</span>
                                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#7ea1c4', textTransform: 'uppercase', letterSpacing: '0.08em' }}>75%</span>
                                </div>
                                <div style={{ width: '100%', height: '6px', background: '#F1F5F9', borderRadius: '9999px', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: '75%', background: 'linear-gradient(90deg, #7ea1c4, #5788b7)', borderRadius: '9999px' }}></div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }}></div>
                                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Alpha v1.2 · Testing Phase Active</span>
                                </div>
                            </div>
                        </div>

                        {/* Blurred mockup background */}
                        <div style={{ gridColumn: '1', opacity: 0.15, filter: 'blur(2px)', pointerEvents: 'none', userSelect: 'none' }}>
                            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                                    <Layout size={18} style={{ color: '#7ea1c4' }} />
                                    <div style={{ height: '12px', width: '160px', background: '#F1F5F9', borderRadius: '9999px' }}></div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.875rem', borderBottom: '1px solid #F8FAFC' }}>
                                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                                <div style={{ width: '36px', height: '36px', background: '#F8FAFC', borderRadius: '8px' }}></div>
                                                <div>
                                                    <div style={{ height: '10px', background: '#F1F5F9', borderRadius: '9999px', width: `${80 + i * 20}px`, marginBottom: '6px' }}></div>
                                                    <div style={{ height: '8px', background: '#F8FAFC', borderRadius: '9999px', width: '70px' }}></div>
                                                </div>
                                            </div>
                                            <div style={{ height: '10px', width: '60px', background: '#F1F5F9', borderRadius: '9999px' }}></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', alignItems: 'flex-end' }}>
                                    {[...Array(6)].map((_, i) => (
                                        <div key={i} style={{ width: '32px', borderRadius: '4px 4px 0 0', background: '#E2E8F0', height: `${40 + (i * 12)}px` }}></div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div style={{ opacity: 0.15, filter: 'blur(2px)', pointerEvents: 'none', userSelect: 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                                <h4 style={{ fontWeight: 800, color: '#1E293B', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                    <Star size={16} style={{ color: '#f59e0b' }} /> Upcoming Features
                                </h4>
                                <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', listStyle: 'none' }}>
                                    {features.map((feat, i) => (
                                        <li key={i} style={{ display: 'flex', gap: '0.75rem', padding: '0.75rem', background: '#F8FAFC', borderRadius: '8px', alignItems: 'center' }}>
                                            <div style={{ padding: '0.4rem', background: 'white', borderRadius: '6px', color: '#7ea1c4' }}>{feat.icon}</div>
                                            <div>
                                                <div style={{ fontWeight: 700, color: '#334155', fontSize: '0.82rem' }}>{feat.label}</div>
                                                <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{feat.desc}</div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div style={{ background: '#0F172A', padding: '1.25rem', borderRadius: '12px', color: 'white' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.875rem' }}>
                                    <Cpu size={16} style={{ color: '#7ea1c4' }} />
                                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#7ea1c4', textTransform: 'uppercase', letterSpacing: '0.08em' }}>System Status</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                    {[{ l: 'Core Engine', v: 95 }, { l: 'API Layer', v: 80 }, { l: 'UI Components', v: 60 }].map(({ l, v }) => (
                                        <div key={l}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 700, color: '#64748B', marginBottom: '4px' }}>
                                                <span>{l}</span><span>{v}%</span>
                                            </div>
                                            <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '9999px', overflow: 'hidden' }}>
                                                <div style={{ height: '100%', background: '#7ea1c4', borderRadius: '9999px', width: `${v}%` }}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default GenericModulePlaceholder;
