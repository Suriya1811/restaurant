import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';
import './Dashboard.css';
import {
    ChefHat, Printer, Plus, Trash2, Edit2, Save, X, Loader2,
    CheckCircle2, Monitor, Tag, AlertCircle, Wifi
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL;
const getToken = () => { try { return JSON.parse(localStorage.getItem('user'))?.token; } catch { return null; } };

const PRESET_COLORS = [
    '#6c5fc7', '#3b82f6', '#10b981', '#f59e0b',
    '#ef4444', '#ec4899', '#8b5cf6', '#14b8a6',
    '#f97316', '#06b6d4'
];

const emptyKitchenForm = () => ({ name: '', description: '', categories: [], color: '#6c5fc7' });
const emptyPrinterForm = () => ({ name: '', ip_address: '', description: '', categories: [], color: '#3b82f6' });

/* ─────────────────────────────────────────────
   KITCHEN TAB
───────────────────────────────────────────── */
function KitchenTab({ allCategories, navigate }) {
    const [kitchens, setKitchens] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyKitchenForm());
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);

    const fetchKitchens = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/kitchens`, { headers: { Authorization: `Bearer ${getToken()}` } });
            const data = await res.json();
            if (data.success) setKitchens(data.data);
        } catch { setError('Failed to load kitchens'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchKitchens(); }, []);

    const openCreate = () => { setForm(emptyKitchenForm()); setEditingId(null); setDrawerOpen(true); setError(''); };
    const openEdit = (k) => {
        setForm({ name: k.name, description: k.description || '', categories: k.categories || [], color: k.color || '#6c5fc7' });
        setEditingId(k._id); setDrawerOpen(true); setError('');
    };
    const toggleCategory = (catName) => setForm(p => ({
        ...p, categories: p.categories.includes(catName) ? p.categories.filter(c => c !== catName) : [...p.categories, catName]
    }));

    const handleSave = async () => {
        if (!form.name.trim()) return setError('Kitchen name is required');
        setSaving(true); setError('');
        try {
            const url = editingId ? `${API}/kitchens/${editingId}` : `${API}/kitchens`;
            const method = editingId ? 'PUT' : 'POST';
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }, body: JSON.stringify(form) });
            const data = await res.json();
            if (data.success) {
                setSuccess(editingId ? 'Kitchen updated!' : 'Kitchen created!');
                setTimeout(() => setSuccess(''), 3000);
                setDrawerOpen(false); fetchKitchens();
            } else { setError(data.error || 'Save failed'); }
        } catch { setError('Save failed. Check connection.'); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id) => {
        try {
            const res = await fetch(`${API}/kitchens/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } });
            const data = await res.json();
            if (data.success) {
                setSuccess('Kitchen deleted'); setTimeout(() => setSuccess(''), 3000);
                setDeleteConfirmId(null); fetchKitchens();
            } else { setError(data.error || 'Delete failed'); }
        } catch { setError('Delete failed'); }
    };

    return (
        <>
            <button id="add-kitchen-btn" onClick={openCreate} className="hidden" />

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
                <div style={{ textAlign: 'center', padding: '5rem 2rem', background: '#fff', borderRadius: 16, border: '2px dashed #ffedd5' }}>
                    <ChefHat size={64} color="#ffedd5" style={{ marginBottom: 16 }} />
                    <h3 style={{ color: '#1a1333', fontWeight: 800, fontSize: '1.2rem', marginBottom: 8 }}>No Kitchens Created Yet</h3>
                    <p style={{ color: '#7c6b8a', fontWeight: 600, marginBottom: '1.5rem' }}>Create kitchens and assign food categories to route orders correctly.</p>
                    <button onClick={openCreate} className="btn-action-add" style={{ margin: '0 auto' }}>
                        <Plus size={16} /> CREATE FIRST KITCHEN
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {kitchens.map(k => (
                        <div key={k._id} style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                <div style={{ width: 44, height: 44, background: k.color || '#f97316', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <ChefHat size={22} color="white" />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 900, color: '#1a1333', fontSize: '1.05rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{k.name}</div>
                                    {k.description && <div style={{ color: '#7c6b8a', fontSize: '0.75rem', fontWeight: 600 }}>{k.description}</div>}
                                </div>
                            </div>
                            <div style={{ marginBottom: '1.25rem' }}>
                                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#f97316', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <Tag size={11} /> ASSIGNED CATEGORIES
                                </div>
                                {k.categories && k.categories.length > 0 ? (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                        {k.categories.map(cat => (
                                            <span key={cat} style={{ background: '#fff7ed', color: '#ea580c', padding: '0.25rem 0.7rem', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700 }}>{cat}</span>
                                        ))}
                                    </div>
                                ) : (
                                    <span style={{ fontSize: '0.75rem', color: '#b0a0c0', fontWeight: 600, fontStyle: 'italic' }}>Catch-all (all unassigned items)</span>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button onClick={() => navigate(`/dashboard/self-service/kitchen-display/${k._id}`)}
                                    style={{ flex: 1, background: '#fff7ed', color: '#ea580c', border: 'none', borderRadius: 8, padding: '0.5rem', fontWeight: 800, fontSize: '0.72rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                                    <Monitor size={14} /> DISPLAY
                                </button>
                                <button onClick={() => openEdit(k)}
                                    style={{ flex: 1, background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 8, padding: '0.5rem', fontWeight: 800, fontSize: '0.72rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                                    <Edit2 size={14} /> EDIT
                                </button>
                                <button onClick={() => setDeleteConfirmId(k._id)}
                                    style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 8, padding: '0.5rem 0.75rem', fontWeight: 800, fontSize: '0.72rem', cursor: 'pointer' }}>
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Info tip */}
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '1rem 1.5rem', marginTop: '2rem' }}>
                <h4 style={{ color: '#92400e', fontWeight: 800, fontSize: '0.85rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AlertCircle size={16} /> How Kitchen Display Works
                </h4>
                <ul style={{ color: '#78350f', fontSize: '0.78rem', fontWeight: 600, margin: 0, paddingLeft: '1.2rem', lineHeight: 1.8 }}>
                    <li>Each kitchen shows only orders containing items from its <strong>assigned categories</strong></li>
                    <li>A kitchen with <strong>no categories</strong> assigned acts as a catch-all and shows all items</li>
                    <li>Click <strong>DISPLAY</strong> on a kitchen card to open its live KDS screen</li>
                    <li>The display auto-refreshes every 5 seconds with instant KOT sync</li>
                </ul>
            </div>

            {/* ─── Kitchen Drawer ─── */}
            {drawerOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex' }}>
                    <div style={{ flex: 1, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }} onClick={() => setDrawerOpen(false)} />
                    <div style={{ width: 460, background: '#fff', boxShadow: '-8px 0 40px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
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
                            <button onClick={() => setDrawerOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9b86aa', padding: 4 }}><X size={20} /></button>
                        </div>
                        <div style={{ flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            {error && (
                                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '0.75rem 1rem', color: '#991b1b', fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <AlertCircle size={15} /> {error}
                                </div>
                            )}
                            <div>
                                <label style={{ fontSize: '0.68rem', fontWeight: 800, color: '#7c6b8a', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Kitchen Name *</label>
                                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                    placeholder="e.g. Main Kitchen, Grill Counter, Dessert Station"
                                    style={{ width: '100%', padding: '0.6rem 0.9rem', border: '2px solid #e8dff5', borderRadius: 10, fontSize: '0.88rem', fontWeight: 600, color: '#1a1333', outline: 'none', boxSizing: 'border-box' }} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.68rem', fontWeight: 800, color: '#7c6b8a', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Description (Optional)</label>
                                <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                    placeholder="Short description..."
                                    style={{ width: '100%', padding: '0.6rem 0.9rem', border: '2px solid #e8dff5', borderRadius: 10, fontSize: '0.85rem', fontWeight: 600, color: '#1a1333', outline: 'none', boxSizing: 'border-box' }} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.68rem', fontWeight: 800, color: '#7c6b8a', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Display Color</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {PRESET_COLORS.map(c => (
                                        <button key={c} onClick={() => setForm(p => ({ ...p, color: c }))}
                                            style={{ width: 32, height: 32, background: c, borderRadius: 8, border: form.color === c ? '3px solid #1a1333' : '3px solid transparent', cursor: 'pointer', transition: 'all 0.15s' }} />
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.68rem', fontWeight: 800, color: '#7c6b8a', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Assigned Food Categories</label>
                                <p style={{ fontSize: '0.72rem', color: '#b0a0c0', fontWeight: 600, marginBottom: 10 }}>Select which categories this kitchen handles. Leave empty to show all.</p>
                                {allCategories.length === 0 ? (
                                    <p style={{ color: '#b0a0c0', fontSize: '0.8rem', fontStyle: 'italic' }}>No categories found. Add categories in Master → Category.</p>
                                ) : (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        {allCategories.map(cat => {
                                            const selected = form.categories.includes(cat.name);
                                            return (
                                                <button key={cat._id} onClick={() => toggleCategory(cat.name)}
                                                    style={{ padding: '0.35rem 0.9rem', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s', background: selected ? form.color : '#f5f2fa', color: selected ? '#fff' : '#5a4a72', border: selected ? `2px solid ${form.color}` : '2px solid #e8dff5' }}>
                                                    {cat.name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                                {form.categories.length > 0 && <div style={{ marginTop: 10, fontSize: '0.72rem', color: '#ea580c', fontWeight: 700 }}>✓ {form.categories.length} categories selected</div>}
                                {form.categories.length === 0 && <div style={{ marginTop: 10, fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>ℹ No categories selected — catch-all (shows all items)</div>}
                            </div>
                        </div>
                        <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                            <button onClick={() => setDrawerOpen(false)} style={{ padding: '0.6rem 1.2rem', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', color: '#475569', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer' }}>Cancel</button>
                            <button onClick={handleSave} disabled={saving}
                                style={{ padding: '0.6rem 1.5rem', borderRadius: 10, border: 'none', background: saving ? '#fdba74' : '#f97316', color: '#fff', fontWeight: 800, fontSize: '0.78rem', cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                                {saving ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</> : <><Save size={14} /> {editingId ? 'Update Kitchen' : 'Create Kitchen'}</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Kitchen Delete Modal ─── */}
            {deleteConfirmId && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: '#fff', borderRadius: 16, padding: '2rem', maxWidth: 380, width: '90%', textAlign: 'center' }}>
                        <Trash2 size={40} color="#ef4444" style={{ marginBottom: 12 }} />
                        <h3 style={{ fontWeight: 900, color: '#1a1333', marginBottom: 8 }}>Delete Kitchen?</h3>
                        <p style={{ color: '#7c6b8a', fontWeight: 600, fontSize: '0.85rem', marginBottom: '1.5rem' }}>This action cannot be undone. The kitchen display will stop showing orders.</p>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                            <button onClick={() => setDeleteConfirmId(null)} style={{ padding: '0.6rem 1.2rem', borderRadius: 10, border: '2px solid #e8dff5', background: '#fff', color: '#7c6b8a', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}>Cancel</button>
                            <button onClick={() => handleDelete(deleteConfirmId)} style={{ padding: '0.6rem 1.2rem', borderRadius: 10, border: 'none', background: '#ef4444', color: '#fff', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}>Yes, Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

/* ─────────────────────────────────────────────
   PRINTER TAB
───────────────────────────────────────────── */
function PrinterTab({ allCategories, navigate }) {
    const [printers, setPrinters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyPrinterForm());
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);

    const fetchPrinters = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/printers`, { headers: { Authorization: `Bearer ${getToken()}` } });
            const data = await res.json();
            if (data.success) setPrinters(data.data);
        } catch { setError('Failed to load printers'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchPrinters(); }, []);

    const openCreate = () => { setForm(emptyPrinterForm()); setEditingId(null); setDrawerOpen(true); setError(''); };
    const openEdit = (p) => {
        setForm({ name: p.name, ip_address: p.ip_address || '', description: p.description || '', categories: p.categories || [], color: p.color || '#3b82f6' });
        setEditingId(p._id); setDrawerOpen(true); setError('');
    };
    const toggleCategory = (catName) => setForm(p => ({
        ...p, categories: p.categories.includes(catName) ? p.categories.filter(c => c !== catName) : [...p.categories, catName]
    }));

    const handleSave = async () => {
        if (!form.name.trim()) return setError('Printer name is required');
        setSaving(true); setError('');
        try {
            const url = editingId ? `${API}/printers/${editingId}` : `${API}/printers`;
            const method = editingId ? 'PUT' : 'POST';
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }, body: JSON.stringify(form) });
            const data = await res.json();
            if (data.success) {
                setSuccess(editingId ? 'Printer updated!' : 'Printer created!');
                setTimeout(() => setSuccess(''), 3000);
                setDrawerOpen(false); fetchPrinters();
            } else { setError(data.error || 'Save failed'); }
        } catch { setError('Save failed. Check connection.'); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id) => {
        try {
            const res = await fetch(`${API}/printers/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } });
            const data = await res.json();
            if (data.success) {
                setSuccess('Printer deleted'); setTimeout(() => setSuccess(''), 3000);
                setDeleteConfirmId(null); fetchPrinters();
            } else { setError(data.error || 'Delete failed'); }
        } catch { setError('Delete failed'); }
    };

    return (
        <>
            <button id="add-printer-btn" onClick={openCreate} className="hidden" />

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
                <div style={{ textAlign: 'center', padding: '5rem 2rem', background: '#fff', borderRadius: 16, border: '2px dashed #ffedd5' }}>
                    <Printer size={64} color="#ffedd5" style={{ marginBottom: 16 }} />
                    <h3 style={{ color: '#1a1333', fontWeight: 800, fontSize: '1.2rem', marginBottom: 8 }}>No Printers Configured</h3>
                    <p style={{ color: '#7c6b8a', fontWeight: 600, marginBottom: '1.5rem' }}>Configure network printers to route KOTs to specific stations.</p>
                    <button onClick={openCreate} className="btn-action-add" style={{ margin: '0 auto' }}>
                        <Plus size={16} /> ADD FIRST PRINTER
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {printers.map(p => (
                        <div key={p._id} style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                <div style={{ width: 44, height: 44, background: p.color || '#f97316', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Printer size={22} color="white" />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 900, color: '#1a1333', fontSize: '1.05rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                                    <div style={{ color: '#7c6b8a', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <Wifi size={12} /> {p.ip_address || 'No IP Bound'}
                                    </div>
                                </div>
                            </div>
                            <div style={{ marginBottom: '1.25rem' }}>
                                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#f97316', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <Tag size={11} /> ROUTED CATEGORIES
                                </div>
                                {p.categories && p.categories.length > 0 ? (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                        {p.categories.map(cat => (
                                            <span key={cat} style={{ background: '#fff7ed', color: '#ea580c', padding: '0.25rem 0.7rem', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700 }}>{cat}</span>
                                        ))}
                                    </div>
                                ) : (
                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, fontStyle: 'italic' }}>Catch-all (all unassigned items)</span>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button onClick={() => navigate(`/dashboard/self-service/printer-display/${p._id}`)}
                                    style={{ flex: 1, background: '#fff7ed', color: '#ea580c', border: 'none', borderRadius: 8, padding: '0.5rem', fontWeight: 800, fontSize: '0.72rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                                    <Monitor size={14} /> LIVE FEED
                                </button>
                                <button onClick={() => openEdit(p)}
                                    style={{ flex: 1, background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 8, padding: '0.5rem', fontWeight: 800, fontSize: '0.72rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                                    <Edit2 size={14} /> EDIT
                                </button>
                                <button onClick={() => setDeleteConfirmId(p._id)}
                                    style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 8, padding: '0.5rem 0.75rem', fontWeight: 800, fontSize: '0.72rem', cursor: 'pointer' }}>
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Info tip */}
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: '1rem 1.5rem', marginTop: '2rem' }}>
                <h4 style={{ color: '#1e40af', fontWeight: 800, fontSize: '0.85rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AlertCircle size={16} /> How Printer Routing Works
                </h4>
                <ul style={{ color: '#1e3a8a', fontSize: '0.78rem', fontWeight: 600, margin: 0, paddingLeft: '1.2rem', lineHeight: 1.8 }}>
                    <li>Each printer feed shows only orders containing items from its <strong>assigned categories</strong></li>
                    <li>If no categories are assigned, the printer acts as a <strong>Master Terminal</strong> showing all items</li>
                    <li>Open the <strong>LIVE FEED</strong> on a device connected to the physical printer to print KOTs</li>
                    <li>The feed auto-refreshes every 5 seconds with instant KOT sync on new orders</li>
                </ul>
            </div>

            {/* ─── Printer Drawer ─── */}
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
                            <button onClick={() => setDrawerOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }}><X size={20} /></button>
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
                                    style={{ width: '100%', padding: '0.6rem 0.9rem', border: '2px solid #e2e8f0', borderRadius: 10, fontSize: '0.88rem', fontWeight: 600, color: '#1a1333', outline: 'none', boxSizing: 'border-box' }} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>IP Address / Port</label>
                                <div style={{ position: 'relative' }}>
                                    <Wifi size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                    <input value={form.ip_address} onChange={e => setForm(p => ({ ...p, ip_address: e.target.value }))}
                                        placeholder="e.g. 192.168.1.101"
                                        style={{ width: '100%', padding: '0.6rem 0.9rem 0.6rem 2.4rem', border: '2px solid #e2e8f0', borderRadius: 10, fontSize: '0.88rem', fontWeight: 600, color: '#1a1333', outline: 'none', boxSizing: 'border-box' }} />
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
                                <label style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Assigned Food Categories</label>
                                <p style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, marginBottom: 10 }}>Items from these categories will be routed to this printer.</p>
                                {allCategories.length === 0 ? (
                                    <p style={{ color: '#94a3b8', fontSize: '0.8rem', fontStyle: 'italic' }}>No categories found. Add categories in Master → Category.</p>
                                ) : (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        {allCategories.map(cat => {
                                            const selected = form.categories.includes(cat.name);
                                            return (
                                                <button key={cat._id} onClick={() => toggleCategory(cat.name)}
                                                    style={{ padding: '0.35rem 0.9rem', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s', background: selected ? form.color : '#f1f5f9', color: selected ? '#fff' : '#475569', border: selected ? `2px solid ${form.color}` : '2px solid #e2e8f0' }}>
                                                    {cat.name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                                {form.categories.length > 0 && <div style={{ marginTop: 10, fontSize: '0.72rem', color: '#ea580c', fontWeight: 700 }}>✓ {form.categories.length} categories selected</div>}
                                {form.categories.length === 0 && <div style={{ marginTop: 10, fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>ℹ No categories selected — catch-all (master terminal)</div>}
                            </div>
                        </div>
                        <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                            <button onClick={() => setDrawerOpen(false)} style={{ padding: '0.6rem 1.2rem', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', color: '#475569', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer' }}>Cancel</button>
                            <button onClick={handleSave} disabled={saving}
                                style={{ padding: '0.6rem 1.5rem', borderRadius: 10, border: 'none', background: saving ? '#fdba74' : '#f97316', color: '#fff', fontWeight: 800, fontSize: '0.78rem', cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                                {saving ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</> : <><Save size={14} /> {editingId ? 'Update Printer' : 'Create Printer'}</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Printer Delete Modal ─── */}
            {deleteConfirmId && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: '#fff', borderRadius: 16, padding: '2rem', maxWidth: 380, width: '90%', textAlign: 'center' }}>
                        <Trash2 size={40} color="#ef4444" style={{ marginBottom: 12 }} />
                        <h3 style={{ fontWeight: 900, color: '#1a1333', marginBottom: 8 }}>Delete Printer?</h3>
                        <p style={{ color: '#64748b', fontWeight: 600, fontSize: '0.85rem', marginBottom: '1.5rem' }}>This hardware routing configuration will be permanently removed.</p>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                            <button onClick={() => setDeleteConfirmId(null)} style={{ padding: '0.6rem 1.2rem', borderRadius: 10, border: '2px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}>Cancel</button>
                            <button onClick={() => handleDelete(deleteConfirmId)} style={{ padding: '0.6rem 1.2rem', borderRadius: 10, border: 'none', background: '#ef4444', color: '#fff', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}>Yes, Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

/* ─────────────────────────────────────────────
   MAIN COMBINED PAGE
───────────────────────────────────────────── */
export default function KitchenPrinterManagement() {
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('kitchen'); // 'kitchen' | 'printer'
    const [allCategories, setAllCategories] = useState([]);

    const toggleSidebar = () => {
        if (window.innerWidth <= 768) setIsMobileSidebarOpen(!isMobileSidebarOpen);
        else { const n = !isCollapsed; setIsCollapsed(n); localStorage.setItem('sidebarCollapsed', n); }
    };

    // Fetch shared categories once at page level
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${API}/categories`, { headers: { Authorization: `Bearer ${getToken()}` } });
                const data = await res.json();
                if (data.success) setAllCategories(data.data);
            } catch {}
        })();
    }, []);

    const tabs = [
        { id: 'kitchen', label: 'Kitchen Displays', icon: ChefHat, color: '#f97316', bg: '#fff7ed', count: null },
        { id: 'printer', label: 'Printers',         icon: Printer,  color: '#f97316', bg: '#fff7ed', count: null },
    ];

    const activeColor = '#f97316';
    const ActiveIcon = activeTab === 'kitchen' ? ChefHat : Printer;

    return (
        <div className="dashboard-layout">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />
            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)} />
            )}
            <main className="dashboard-main flex-1 overflow-hidden font-sans flex flex-col bg-slate-50">
                <Header 
                    toggleSidebar={toggleSidebar} 
                    title="Kitchen & Printer Management" 
                    actions={
                        activeTab === 'kitchen' ? (
                            <button onClick={() => document.getElementById('add-kitchen-btn')?.click()} className="btn-action-add">
                                <Plus size={15} /> Add Kitchen
                            </button>
                        ) : (
                            <div className="flex items-center gap-3">
                                <button onClick={() => navigate('/dashboard/self-service/printer-display')}
                                    className="px-3 py-1.5 border border-orange-500 bg-white text-orange-600 rounded-lg text-[10px] font-black uppercase flex items-center gap-1.5 hover:bg-orange-50 transition-colors shadow-sm cursor-pointer"
                                >
                                    <Monitor size={14} /> View Feeds
                                </button>
                                <button onClick={() => document.getElementById('add-printer-btn')?.click()} className="btn-action-add">
                                    <Plus size={15} /> Add Printer
                                </button>
                            </div>
                        )
                    }
                />
                <div className="master-content-layout fade-in !p-6">

                    {/* ─── Tab Switcher ─── */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', background: '#f1f5f9', borderRadius: 14, padding: '0.35rem', width: 'fit-content' }}>
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 8,
                                        padding: '0.6rem 1.4rem', borderRadius: 10, border: 'none',
                                        fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        background: isActive ? tab.color : 'transparent',
                                        color: isActive ? '#fff' : '#64748b',
                                        boxShadow: isActive ? `0 4px 14px ${tab.color}44` : 'none',
                                    }}
                                >
                                    <Icon size={15} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* ─── Tab Content ─── */}
                    <div className="flex-1 overflow-y-auto min-h-0 pr-1 pb-8">
                        {activeTab === 'kitchen' && (
                            <KitchenTab allCategories={allCategories} navigate={navigate} />
                        )}
                        {activeTab === 'printer' && (
                            <PrinterTab allCategories={allCategories} navigate={navigate} />
                        )}
                    </div>

                </div>
            </main>

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
