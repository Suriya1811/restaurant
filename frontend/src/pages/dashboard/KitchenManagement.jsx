import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';
import './Dashboard.css';
import {
    ChefHat, Plus, Trash2, Edit2, Save, X, Loader2,
    CheckCircle2, Monitor, Tag, AlertCircle
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL;
const getToken = () => { try { return JSON.parse(localStorage.getItem('user'))?.token; } catch { return null; } };

const PRESET_COLORS = [
    '#6c5fc7', '#ef4444', '#f59e0b', '#10b981',
    '#3b82f6', '#ec4899', '#8b5cf6', '#14b8a6',
    '#f97316', '#06b6d4'
];

const emptyForm = () => ({ name: '', description: '', categories: [], color: '#6c5fc7' });

export default function KitchenManagement() {
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    const [kitchens, setKitchens] = useState([]);
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
            const [kRes, cRes] = await Promise.all([
                fetch(`${API}/kitchens`, { headers }),
                fetch(`${API}/categories`, { headers })
            ]);
            const kData = await kRes.json();
            const cData = await cRes.json();
            if (kData.success) setKitchens(kData.data);
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

    const openEdit = (k) => {
        setForm({ name: k.name, description: k.description || '', categories: k.categories || [], color: k.color || '#6c5fc7' });
        setEditingId(k._id);
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
        if (!form.name.trim()) return setError('Kitchen name is required');
        setSaving(true);
        setError('');
        try {
            const token = getToken();
            const url = editingId ? `${API}/kitchens/${editingId}` : `${API}/kitchens`;
            const method = editingId ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(form)
            });
            const data = await res.json();
            if (data.success) {
                setSuccess(editingId ? 'Kitchen updated!' : 'Kitchen created!');
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
            const res = await fetch(`${API}/kitchens/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setSuccess('Kitchen deleted');
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
                <div style={{ padding: '2rem', maxWidth: 1600, margin: '0 auto' }}>

                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg,#f59e0b,#d97706)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <ChefHat size={22} color="white" />
                                </div>
                                <div>
                                    <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#1a1333', margin: 0 }}>Kitchen Management</h1>
                                    <p style={{ color: '#7c6b8a', fontSize: '0.82rem', fontWeight: 600, margin: 0 }}>Create kitchens and assign food categories to them</p>
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button onClick={openCreate}
                                style={{ background: '#6c5fc7', color: '#fff', border: 'none', borderRadius: 10, padding: '0.6rem 1.2rem', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Plus size={15} /> ADD KITCHEN
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

                    {/* Kitchen Cards */}
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '4rem', color: '#7c6b8a' }}>
                            <Loader2 size={40} style={{ animation: 'spin 1s linear infinite' }} />
                            <p style={{ marginTop: 12, fontWeight: 700 }}>Loading kitchens...</p>
                        </div>
                    ) : kitchens.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '5rem 2rem', background: '#fff', borderRadius: 16, border: '2px dashed #e8dff5' }}>
                            <ChefHat size={64} color="#e8dff5" style={{ marginBottom: 16 }} />
                            <h3 style={{ color: '#1a1333', fontWeight: 800, fontSize: '1.2rem', marginBottom: 8 }}>No Kitchens Created Yet</h3>
                            <p style={{ color: '#7c6b8a', fontWeight: 600, marginBottom: '1.5rem' }}>Create kitchens and assign food categories to route orders correctly.</p>
                            <button onClick={openCreate}
                                style={{ background: '#6c5fc7', color: '#fff', border: 'none', borderRadius: 10, padding: '0.7rem 1.5rem', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, margin: '0 auto' }}>
                                <Plus size={16} /> CREATE FIRST KITCHEN
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
                            {kitchens.map(k => (
                                <div key={k._id} style={{ background: '#fff', borderRadius: 16, border: '2px solid #f0ecff', padding: '1.5rem', boxShadow: '0 2px 12px rgba(108,95,199,0.07)', transition: 'box-shadow 0.2s' }}>
                                    {/* Top bar with color */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                        <div style={{ width: 44, height: 44, background: k.color || '#6c5fc7', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <ChefHat size={22} color="white" />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 900, color: '#1a1333', fontSize: '1.05rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{k.name}</div>
                                            {k.description && <div style={{ color: '#7c6b8a', fontSize: '0.75rem', fontWeight: 600 }}>{k.description}</div>}
                                        </div>
                                    </div>

                                    {/* Categories */}
                                    <div style={{ marginBottom: '1.25rem' }}>
                                        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#9b86aa', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <Tag size={11} /> ASSIGNED CATEGORIES
                                        </div>
                                        {k.categories && k.categories.length > 0 ? (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                                {k.categories.map(cat => (
                                                    <span key={cat} style={{ background: '#f0ecff', color: '#6c5fc7', padding: '0.25rem 0.7rem', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700 }}>
                                                        {cat}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span style={{ fontSize: '0.75rem', color: '#b0a0c0', fontWeight: 600, fontStyle: 'italic' }}>Catch-all (all unassigned items)</span>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={() => navigate(`/dashboard/self-service/kitchen-display/${k._id}`)}
                                            style={{ flex: 1, background: '#f0ecff', color: '#6c5fc7', border: 'none', borderRadius: 8, padding: '0.5rem', fontWeight: 800, fontSize: '0.72rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                                            <Monitor size={14} /> DISPLAY
                                        </button>
                                        <button onClick={() => openEdit(k)}
                                            style={{ flex: 1, background: '#f9f7ff', color: '#5a4a72', border: '1px solid #e8dff5', borderRadius: 8, padding: '0.5rem', fontWeight: 800, fontSize: '0.72rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                                            <Edit2 size={14} /> EDIT
                                        </button>
                                        <button onClick={() => setDeleteConfirmId(k._id)}
                                            style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 8, padding: '0.5rem 0.75rem', fontWeight: 800, fontSize: '0.72rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Info section at bottom */}
                <div style={{ maxWidth: 1000, margin: '2rem auto', padding: '0 2rem 3rem' }}>
                    <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '1rem 1.5rem' }}>
                        <h4 style={{ color: '#92400e', fontWeight: 800, fontSize: '0.85rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <AlertCircle size={16} /> How Kitchen Display Works
                        </h4>
                        <ul style={{ color: '#78350f', fontSize: '0.78rem', fontWeight: 600, margin: 0, paddingLeft: '1.2rem', lineHeight: 1.8 }}>
                            <li>Each kitchen shows only orders containing items from its <strong>assigned categories</strong></li>
                            <li>A kitchen with <strong>no categories</strong> assigned acts as a catch-all and shows all items</li>
                            <li>Click <strong>DISPLAY</strong> on a kitchen card to open its live Kitchen Display Screen</li>
                            <li>The display auto-refreshes every 10 seconds to show new orders from captains</li>
                        </ul>
                    </div>
                </div>
            </main>

            {/* ─── Create/Edit Drawer ─── */}
            {drawerOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex' }}>
                    <div style={{ flex: 1, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }} onClick={() => setDrawerOpen(false)} />
                    <div style={{ width: 460, background: '#fff', boxShadow: '-8px 0 40px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                        {/* Drawer Header */}
                        <div style={{ padding: '1.5rem', borderBottom: '2px solid #f0ecff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fdfbff' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 36, height: 36, background: form.color, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <ChefHat size={18} color="white" />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontWeight: 900, color: '#1a1333', fontSize: '1rem' }}>{editingId ? 'Edit Kitchen' : 'New Kitchen'}</h3>
                                    <p style={{ margin: 0, color: '#9b86aa', fontSize: '0.72rem', fontWeight: 600 }}>Kitchen Display Station</p>
                                </div>
                            </div>
                            <button onClick={() => setDrawerOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9b86aa', padding: 4 }}>
                                <X size={20} />
                            </button>
                        </div>

                        {/* Drawer Body */}
                        <div style={{ flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            {error && (
                                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '0.75rem 1rem', color: '#991b1b', fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <AlertCircle size={15} /> {error}
                                </div>
                            )}

                            {/* Name */}
                            <div>
                                <label style={{ fontSize: '0.68rem', fontWeight: 800, color: '#7c6b8a', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Kitchen Name *</label>
                                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                    placeholder="e.g. Main Kitchen, Grill Counter, Dessert Station"
                                    style={{ width: '100%', padding: '0.6rem 0.9rem', border: '2px solid #e8dff5', borderRadius: 10, fontSize: '0.88rem', fontWeight: 600, color: '#1a1333', outline: 'none', boxSizing: 'border-box' }} />
                            </div>

                            {/* Description */}
                            <div>
                                <label style={{ fontSize: '0.68rem', fontWeight: 800, color: '#7c6b8a', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Description (Optional)</label>
                                <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                    placeholder="Short description..."
                                    style={{ width: '100%', padding: '0.6rem 0.9rem', border: '2px solid #e8dff5', borderRadius: 10, fontSize: '0.85rem', fontWeight: 600, color: '#1a1333', outline: 'none', boxSizing: 'border-box' }} />
                            </div>

                            {/* Color */}
                            <div>
                                <label style={{ fontSize: '0.68rem', fontWeight: 800, color: '#7c6b8a', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Display Color</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {PRESET_COLORS.map(c => (
                                        <button key={c} onClick={() => setForm(p => ({ ...p, color: c }))}
                                            style={{ width: 32, height: 32, background: c, borderRadius: 8, border: form.color === c ? '3px solid #1a1333' : '3px solid transparent', cursor: 'pointer', transition: 'all 0.15s' }} />
                                    ))}
                                </div>
                            </div>

                            {/* Categories */}
                            <div>
                                <label style={{ fontSize: '0.68rem', fontWeight: 800, color: '#7c6b8a', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                                    Assigned Food Categories
                                </label>
                                <p style={{ fontSize: '0.72rem', color: '#b0a0c0', fontWeight: 600, marginBottom: 10 }}>
                                    Select which categories this kitchen will handle. Leave empty to show all.
                                </p>
                                {allCategories.length === 0 ? (
                                    <p style={{ color: '#b0a0c0', fontSize: '0.8rem', fontStyle: 'italic' }}>No categories found. Add categories in Master → Category.</p>
                                ) : (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        {allCategories.map(cat => {
                                            const selected = form.categories.includes(cat.name);
                                            return (
                                                <button key={cat._id} onClick={() => toggleCategory(cat.name)}
                                                    style={{
                                                        padding: '0.35rem 0.9rem', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
                                                        background: selected ? form.color : '#f5f2fa',
                                                        color: selected ? '#fff' : '#5a4a72',
                                                        border: selected ? `2px solid ${form.color}` : '2px solid #e8dff5'
                                                    }}>
                                                    {cat.name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                                {form.categories.length > 0 && (
                                    <div style={{ marginTop: 10, fontSize: '0.72rem', color: '#6c5fc7', fontWeight: 700 }}>
                                        ✓ {form.categories.length} categories selected
                                    </div>
                                )}
                                {form.categories.length === 0 && (
                                    <div style={{ marginTop: 10, fontSize: '0.72rem', color: '#b0a0c0', fontWeight: 600 }}>
                                        ℹ No categories selected — this kitchen will show all items (catch-all)
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Drawer Footer */}
                        <div style={{ padding: '1.25rem 1.5rem', borderTop: '2px solid #f0ecff', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                            <button onClick={() => setDrawerOpen(false)}
                                style={{ padding: '0.6rem 1.2rem', borderRadius: 10, border: '2px solid #e8dff5', background: '#fff', color: '#7c6b8a', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer' }}>
                                Cancel
                            </button>
                            <button onClick={handleSave} disabled={saving}
                                style={{ padding: '0.6rem 1.5rem', borderRadius: 10, border: 'none', background: saving ? '#a097d6' : '#6c5fc7', color: '#fff', fontWeight: 800, fontSize: '0.78rem', cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                                {saving ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</> : <><Save size={14} /> {editingId ? 'Update Kitchen' : 'Create Kitchen'}</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Delete Modal ─── */}
            {deleteConfirmId && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: '#fff', borderRadius: 16, padding: '2rem', maxWidth: 380, width: '90%', textAlign: 'center' }}>
                        <Trash2 size={40} color="#ef4444" style={{ marginBottom: 12 }} />
                        <h3 style={{ fontWeight: 900, color: '#1a1333', marginBottom: 8 }}>Delete Kitchen?</h3>
                        <p style={{ color: '#7c6b8a', fontWeight: 600, fontSize: '0.85rem', marginBottom: '1.5rem' }}>This action cannot be undone. The kitchen display will stop showing orders.</p>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                            <button onClick={() => setDeleteConfirmId(null)}
                                style={{ padding: '0.6rem 1.2rem', borderRadius: 10, border: '2px solid #e8dff5', background: '#fff', color: '#7c6b8a', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}>
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
