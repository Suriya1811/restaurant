import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';
import './Dashboard.css';
import {
    Printer, Plus, Trash2, Edit2, Save, X, Loader2,
    CheckCircle2, Monitor, Tag, AlertCircle, Wifi
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL;
const getToken = () => { try { return JSON.parse(localStorage.getItem('user'))?.token; } catch { return null; } };

const PRESET_COLORS = [
    '#3b82f6', '#ef4444', '#f59e0b', '#10b981',
    '#6c5fc7', '#ec4899', '#8b5cf6', '#14b8a6',
    '#f97316', '#06b6d4'
];

const emptyForm = () => ({ name: '', ip_address: '', description: '', categories: [], color: '#3b82f6' });

export default function PrinterManagement() {
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    const [printers, setPrinters] = useState([]);
    const [allCategories, setAllCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Drawer state
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyForm());
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);

    const toggleSidebar = () => {
        if (window.innerWidth <= 768) setIsMobileSidebarOpen(!isMobileSidebarOpen);
        else { const n = !isCollapsed; setIsCollapsed(n); localStorage.setItem('sidebarCollapsed', n); }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = getToken();
            const headers = { Authorization: `Bearer ${token}` };
            const [pRes, cRes] = await Promise.all([
                fetch(`${API}/printers`, { headers }),
                fetch(`${API}/categories`, { headers })
            ]);
            const pData = await pRes.json();
            const cData = await cRes.json();
            if (pData.success) setPrinters(pData.data);
            if (cData.success) setAllCategories(cData.data);
        } catch (err) {
            console.error(err);
            setError('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const openCreate = () => {
        setForm(emptyForm());
        setEditingId(null);
        setDrawerOpen(true);
        setError('');
    };

    const openEdit = (p) => {
        setForm({ 
            name: p.name, 
            ip_address: p.ip_address || '', 
            description: p.description || '', 
            categories: p.categories || [], 
            color: p.color || '#3b82f6' 
        });
        setEditingId(p._id);
        setDrawerOpen(true);
        setError('');
    };

    const toggleCategory = (catName) => {
        setForm(prev => ({
            ...prev,
            categories: prev.categories.includes(catName)
                ? prev.categories.filter(c => c !== catName)
                : [...prev.categories, catName]
        }));
    };

    const handleSave = async () => {
        if (!form.name.trim()) return setError('Printer name is required');
        setSaving(true);
        setError('');
        try {
            const token = getToken();
            const url = editingId ? `${API}/printers/${editingId}` : `${API}/printers`;
            const method = editingId ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(form)
            });
            const data = await res.json();
            if (data.success) {
                setSuccess(editingId ? 'Printer updated!' : 'Printer created!');
                setTimeout(() => setSuccess(''), 3000);
                setDrawerOpen(false);
                fetchData();
            } else {
                setError(data.error || 'Save failed');
            }
        } catch (err) {
            setError('Save failed. Check connection.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            const token = getToken();
            const res = await fetch(`${API}/printers/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setSuccess('Printer deleted');
                setTimeout(() => setSuccess(''), 3000);
                setDeleteConfirmId(null);
                fetchData();
            } else {
                setError(data.error || 'Delete failed');
            }
        } catch {
            setError('Delete failed');
        }
    };

    return (
        <div className="dashboard-layout">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />
            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}
            <main className="dashboard-main">
                <Header toggleSidebar={toggleSidebar} />
                <div style={{ padding: '2rem', maxWidth: 1000, margin: '0 auto' }}>

                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg,#3b82f6,#2563eb)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Printer size={22} color="white" />
                                </div>
                                <div>
                                    <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#1a1333', margin: 0 }}>Printer Management</h1>
                                    <p style={{ color: '#7c6b8a', fontSize: '0.82rem', fontWeight: 600, margin: 0 }}>Configure network printers and assign food categories</p>
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button onClick={() => navigate('/dashboard/self-service/printer-display')}
                                style={{ background: '#eff6ff', color: '#3b82f6', border: 'none', borderRadius: 10, padding: '0.6rem 1.2rem', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Monitor size={15} /> VIEW DISPLAYS
                            </button>
                            <button onClick={openCreate}
                                style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 10, padding: '0.6rem 1.2rem', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Plus size={15} /> ADD PRINTER
                            </button>
                        </div>
                    </div>

                    {/* Alerts */}
                    {success && (
                        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 10, padding: '0.9rem 1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 10, color: '#065f46', fontWeight: 700 }}>
                            <CheckCircle2 size={18} /> {success}
                        </div>
                    )}
                    {error && !drawerOpen && (
                        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '0.9rem 1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 10, color: '#991b1b', fontWeight: 700 }}>
                            <AlertCircle size={18} /> {error}
                        </div>
                    )}

                    {/* Printer Cards */}
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '4rem', color: '#7c6b8a' }}>
                            <Loader2 size={40} style={{ animation: 'spin 1s linear infinite' }} />
                            <p style={{ marginTop: 12, fontWeight: 700 }}>Loading printers...</p>
                        </div>
                    ) : printers.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '5rem 2rem', background: '#fff', borderRadius: 16, border: '2px dashed #e2e8f0' }}>
                            <Printer size={64} color="#e2e8f0" style={{ marginBottom: 16 }} />
                            <h3 style={{ color: '#1a1333', fontWeight: 800, fontSize: '1.2rem', marginBottom: 8 }}>No Printers Configured</h3>
                            <p style={{ color: '#7c6b8a', fontWeight: 600, marginBottom: '1.5rem' }}>Configure network printers to route KOTs to specific stations.</p>
                            <button onClick={openCreate}
                                style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 10, padding: '0.7rem 1.5rem', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, margin: '0 auto' }}>
                                <Plus size={16} /> ADD FIRST PRINTER
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
                            {printers.map(p => (
                                <div key={p._id} style={{ background: '#fff', borderRadius: 16, border: '2px solid #f1f5f9', padding: '1.5rem', boxShadow: '0 2px 12px rgba(59,130,246,0.07)', transition: 'box-shadow 0.2s' }}>
                                    {/* Top bar with color */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                        <div style={{ width: 44, height: 44, background: p.color || '#3b82f6', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <Printer size={22} color="white" />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 900, color: '#1a1333', fontSize: '1.05rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                                            <div style={{ color: '#7c6b8a', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <Wifi size={12} /> {p.ip_address || 'No IP Bound'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Categories */}
                                    <div style={{ marginBottom: '1.25rem' }}>
                                        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <Tag size={11} /> ROUTED CATEGORIES
                                        </div>
                                        {p.categories && p.categories.length > 0 ? (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                                {p.categories.map(cat => (
                                                    <span key={cat} style={{ background: '#f1f5f9', color: '#475569', padding: '0.25rem 0.7rem', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700 }}>
                                                        {cat}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, fontStyle: 'italic' }}>Catch-all (all unassigned items)</span>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={() => navigate(`/dashboard/self-service/printer-display/${p._id}`)}
                                            style={{ flex: 1, background: '#eff6ff', color: '#3b82f6', border: 'none', borderRadius: 8, padding: '0.5rem', fontWeight: 800, fontSize: '0.72rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                                            <Monitor size={14} /> LIVE FEED
                                        </button>
                                        <button onClick={() => openEdit(p)}
                                            style={{ flex: 1, background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 8, padding: '0.5rem', fontWeight: 800, fontSize: '0.72rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                                            <Edit2 size={14} /> EDIT
                                        </button>
                                        <button onClick={() => setDeleteConfirmId(p._id)}
                                            style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 8, padding: '0.5rem 0.75rem', fontWeight: 800, fontSize: '0.72rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Info section */}
                <div style={{ maxWidth: 1000, margin: '2rem auto', padding: '0 2rem 3rem' }}>
                    <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '1rem 1.5rem' }}>
                        <h4 style={{ color: '#92400e', fontWeight: 800, fontSize: '0.85rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <AlertCircle size={16} /> How Printer Routing Works
                        </h4>
                        <ul style={{ color: '#78350f', fontSize: '0.78rem', fontWeight: 600, margin: 0, paddingLeft: '1.2rem', lineHeight: 1.8 }}>
                            <li>Each printer feed shows only orders containing items from its <strong>assigned categories</strong>.</li>
                            <li>If no categories are assigned, the printer acts as a <strong>Master Terminal</strong> showing all items.</li>
                            <li>Open the <strong>LIVE FEED</strong> on a tablet or PC connected to the physical printer.</li>
                            <li>The feed can trigger automatic print dialogs or show a list of pending KOTs to print.</li>
                        </ul>
                    </div>
                </div>
            </main>

            {/* ─── Create/Edit Drawer ─── */}
            {drawerOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex' }}>
                    <div style={{ flex: 1, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }} onClick={() => setDrawerOpen(false)} />
                    <div style={{ width: 460, background: '#fff', boxShadow: '-8px 0 40px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                        <div style={{ padding: '1.5rem', borderBottom: '2px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 36, height: 36, background: form.color, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Printer size={18} color="white" />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontWeight: 900, color: '#1a1333', fontSize: '1rem' }}>{editingId ? 'Edit Printer' : 'New Printer'}</h3>
                                    <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.72rem', fontWeight: 600 }}>Configure Routing Gateway</p>
                                </div>
                            </div>
                            <button onClick={() => setDrawerOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            {error && (
                                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '0.75rem 1rem', color: '#991b1b', fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <AlertCircle size={15} /> {error}
                                </div>
                            )}

                            <div>
                                <label style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Printer Name *</label>
                                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                    placeholder="e.g. Bar Printer, Main Kitchen, Buffet Station"
                                    className="input-premium w-full"
                                    style={{ boxSizing: 'border-box' }} />
                            </div>

                            <div>
                                <label style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>IP Address / Port</label>
                                <div style={{ position: 'relative' }}>
                                    <Wifi size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                    <input value={form.ip_address} onChange={e => setForm(p => ({ ...p, ip_address: e.target.value }))}
                                        placeholder="e.g. 192.168.1.101"
                                        className="input-premium w-full !pl-10"
                                        style={{ boxSizing: 'border-box' }} />
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Interface Color</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {PRESET_COLORS.map(c => (
                                        <button key={c} onClick={() => setForm(p => ({ ...p, color: c }))}
                                            style={{ width: 32, height: 32, background: c, borderRadius: 8, border: form.color === c ? '3px solid #1a1333' : '3px solid transparent', cursor: 'pointer', transition: 'all 0.15s' }} />
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                                    Assigned Food Categories
                                </label>
                                <p style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, marginBottom: 10 }}>
                                    Items from these categories will be routed to this printer.
                                </p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {allCategories.map(cat => {
                                        const selected = form.categories.includes(cat.name);
                                        return (
                                            <button key={cat._id} onClick={() => toggleCategory(cat.name)}
                                                style={{
                                                    padding: '0.35rem 0.9rem', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
                                                    background: selected ? form.color : '#f1f5f9',
                                                    color: selected ? '#fff' : '#475569',
                                                    border: selected ? `2px solid ${form.color}` : '2px solid #e2e8f0'
                                                }}>
                                                {cat.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div style={{ padding: '1.25rem 1.5rem', borderTop: '2px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                            <button onClick={() => setDrawerOpen(false)}
                                style={{ padding: '0.6rem 1.2rem', borderRadius: 10, border: '2px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer' }}>
                                Cancel
                            </button>
                            <button onClick={handleSave} disabled={saving}
                                style={{ padding: '0.6rem 1.5rem', borderRadius: 10, border: 'none', background: saving ? '#93c5fd' : '#3b82f6', color: '#fff', fontWeight: 800, fontSize: '0.78rem', cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                                {saving ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> SAVING...</> : <><Save size={14} /> {editingId ? 'UPDATE PRINTER' : 'CREATE PRINTER'}</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {deleteConfirmId && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: '#fff', borderRadius: 16, padding: '2rem', maxWidth: 380, width: '90%', textAlign: 'center' }}>
                        <Trash2 size={40} color="#ef4444" style={{ marginBottom: 12 }} />
                        <h3 style={{ fontWeight: 900, color: '#1a1333', marginBottom: 8 }}>Delete Printer?</h3>
                        <p style={{ color: '#64748b', fontWeight: 600, fontSize: '0.85rem', marginBottom: '1.5rem' }}>This hardware routing bound will be terminated.</p>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                            <button onClick={() => setDeleteConfirmId(null)}
                                style={{ padding: '0.6rem 1.2rem', borderRadius: 10, border: '2px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}>
                                Cancel
                            </button>
                            <button onClick={() => handleDelete(deleteConfirmId)}
                                style={{ padding: '0.6rem 1.2rem', borderRadius: 10, border: 'none', background: '#ef4444', color: '#fff', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}>
                                Yes, Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
