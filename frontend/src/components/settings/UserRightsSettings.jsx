import { useState, useEffect } from 'react';
import { Save, AlertCircle, CheckCircle, Loader2, Minus, Plus, MoreHorizontal, Edit2, Trash2 } from 'lucide-react';
import axios from 'axios';

const PERMISSION_CATEGORIES = [
    {
        name: 'Entry',
        modules: [
            { key: 'kot', label: 'KOT' },
            { key: 'sales_bill', label: 'Sales Bill' },
            { key: 'display', label: 'Display' },
            { key: 'vouchers', label: 'Voucher' },
            { key: 'purchase', label: 'Purchase Bill' },
            { key: 'receipts', label: 'Receipt Entry' },
            { key: 'payments', label: 'Payment Entry' },
        ]
    },
    {
        name: 'Master',
        modules: [
            { key: 'party_master', label: 'Party Master' },
            { key: 'products', label: 'Item' },
            { key: 'categories', label: 'Category' },
            { key: 'brands', label: 'Brand' },
            { key: 'tables', label: 'Table Master' },
            { key: 'captains', label: 'Captain Master' },
            { key: 'waiters', label: 'Waiter Master' },
            { key: 'suppliers', label: 'Supplier Master' },
            { key: 'customers', label: 'Customer Master' },
            { key: 'ledgers', label: 'Ledger Master' },
        ]
    },
    {
        name: 'Report',
        modules: [
            { key: 'dashboard', label: 'Dashboard & Analytics' },
            { key: 'reports', label: 'Sales & Inventory Reports' },
        ]
    },
    {
        name: 'Accounts',
        modules: [
            { key: 'accounts', label: 'Accounts & Daybook' },
        ]
    }
];

// All flat modules list for reference
const ALL_MODULES = PERMISSION_CATEGORIES.flatMap(cat => cat.modules);

const UserRightsSettings = () => {
    // Helper to initialize permissions object
    const initPermissions = (existingPerms = []) => {
        const perms = {};
        ALL_MODULES.forEach(mod => {
            const existing = existingPerms.find(p => p.menu_key === mod.key);
            perms[mod.key] = {
                menu_key: mod.key,
                view: existing ? existing.view : false,
                alter: existing ? existing.alter : false,
                cancel: existing ? existing.cancel : false,
                delete: existing ? existing.delete : false
            };
        });
        return perms;
    };

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [userForm, setUserForm] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        role: 'STAFF',
    });
    const [permissions, setPermissions] = useState(() => initPermissions());
    const [expandedCategories, setExpandedCategories] = useState({ Entry: true });
    const [activeActionMenu, setActiveActionMenu] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/roles/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.data.success) {
                setUsers(res.data.data);
            }
        } catch (err) {
            console.error('Failed to fetch users', err);
            setError('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const selectUser = (user) => {
        setActiveActionMenu(null);
        if (!user) {
            setSelectedUserId(null);
            setUserForm({ username: '', password: '', confirmPassword: '', role: 'STAFF' });
            setPermissions(initPermissions());
            setError('');
            setSuccess('');
            return;
        }
        setSelectedUserId(user._id);
        setUserForm({
            username: user.username || user.name || '',
            password: '',
            confirmPassword: '',
            role: user.role === 'ADMIN' ? 'ADMIN' : 'STAFF',
        });
        setPermissions(initPermissions(user.permissions || []));
        setError('');
        setSuccess('');
    };

    const toggleCategoryExpand = (catName) => {
        setExpandedCategories(prev => ({ ...prev, [catName]: !prev[catName] }));
    };

    // Toggle all sub-modules under a category
    const handleCategoryCheck = (category, checked) => {
        setPermissions(prev => {
            const updated = { ...prev };
            category.modules.forEach(mod => {
                const current = updated[mod.key] || { menu_key: mod.key };
                updated[mod.key] = {
                    ...current,
                    view: checked,
                    alter: checked ? current.alter : false,
                    cancel: checked ? current.cancel : false,
                    delete: checked ? current.delete : false,
                };
            });
            return updated;
        });
    };

    // Toggle view permission for a single module
    const handleModuleCheck = (modKey, checked) => {
        setPermissions(prev => {
            const current = prev[modKey] || { menu_key: modKey };
            return {
                ...prev,
                [modKey]: {
                    ...current,
                    view: checked,
                    alter: checked ? current.alter : false,
                    cancel: checked ? current.cancel : false,
                    delete: checked ? current.delete : false,
                }
            };
        });
    };

    // Toggle specific sub-action permission (cancel, alter, delete)
    const handleActionToggle = (modKey, action) => {
        setPermissions(prev => {
            const current = prev[modKey] || { menu_key: modKey, view: false, alter: false, cancel: false, delete: false };
            const newVal = !current[action];
            return {
                ...prev,
                [modKey]: {
                    ...current,
                    [action]: newVal,
                    // If turning on alter/cancel/delete, ensure view is checked
                    view: newVal ? true : current.view
                }
            };
        });
    };

    const isCategoryChecked = (category) => {
        return category.modules.every(mod => permissions[mod.key]?.view);
    };

    const isCategoryPartiallyChecked = (category) => {
        const checkedCount = category.modules.filter(mod => permissions[mod.key]?.view).length;
        return checkedCount > 0 && checkedCount < category.modules.length;
    };

    const saveUser = async () => {
        setError('');
        setSuccess('');
        if (!userForm.username.trim()) {
            setError('User Name is required');
            return;
        }

        if (userForm.password || userForm.confirmPassword) {
            if (userForm.password !== userForm.confirmPassword) {
                setError('Password and Confirm Password do not match');
                return;
            }
        } else if (!selectedUserId) {
            setError('Password is required for new users');
            return;
        }

        setSaving(true);
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);

            const permsArray = Object.values(permissions).filter(p => p.view || p.alter || p.cancel || p.delete);
            const payload = {
                name: userForm.username.trim(),
                username: userForm.username.trim().toLowerCase(),
                role: userForm.role,
                permissions: permsArray
            };

            if (userForm.password) {
                payload.password = userForm.password;
            }

            if (selectedUserId) {
                await axios.put(`${import.meta.env.VITE_API_URL}/roles/users/${selectedUserId}`, payload, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setSuccess('User updated successfully');
            } else {
                await axios.post(`${import.meta.env.VITE_API_URL}/roles/users`, payload, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setSuccess('User created successfully');
            }

            await fetchUsers();
            setTimeout(() => setSuccess(''), 3000);

            if (!selectedUserId) {
                selectUser(null);
            }
        } catch (err) {
            console.error('Save user failed', err);
            setError(err.response?.data?.message || 'Failed to save user');
        } finally {
            setSaving(false);
        }
    };

    const deleteUser = async (id) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            await axios.delete(`${import.meta.env.VITE_API_URL}/roles/users/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (selectedUserId === id) selectUser(null);
            fetchUsers();
        } catch (err) {
            console.error('Delete user failed', err);
            setError('Failed to delete user');
        }
    };

    if (loading && users.length === 0) {
        return (
            <div className="p-8 text-center flex items-center justify-center gap-2 text-slate-500 font-bold">
                <Loader2 className="animate-spin text-[#ff5a1f]" size={24} /> Loading User Rights...
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)] overflow-hidden fade-in">
            {/* LEFT COLUMN: USER CREATION & EXISTING USERS */}
            <div className="w-full lg:w-1/2 flex flex-col h-full overflow-hidden border-r-0 lg:border-r border-slate-100 lg:pr-6">
                <div className="flex-shrink-0">
                    {/* USER CREATION SECTION */}
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-black text-[#1e293b] uppercase tracking-wider">
                            {selectedUserId ? 'EDIT USER' : 'USER CREATION'}
                        </h3>
                        {selectedUserId && (
                            <button
                                onClick={() => selectUser(null)}
                                className="text-xs font-bold text-[#ff5a1f] hover:underline cursor-pointer"
                            >
                                + Create New
                            </button>
                        )}
                    </div>

                    {error && (
                        <div className="bg-rose-50 border border-rose-100 p-2 rounded-lg flex items-center gap-2 text-rose-600 font-bold text-xs mb-3">
                            <AlertCircle size={15} /> {error}
                        </div>
                    )}
                    {success && (
                        <div className="bg-emerald-50 border border-emerald-100 p-2 rounded-lg flex items-center gap-2 text-emerald-700 font-bold text-xs mb-3">
                            <CheckCircle size={15} /> {success}
                        </div>
                    )}

                    {/* FORM FIELDS */}
                    <div className="space-y-2.5 max-w-md">
                        {/* USER TYPE */}
                        <div className="grid grid-cols-[140px_1fr] items-center gap-2">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
                                USER TYPE
                            </label>
                            <select
                                value={userForm.role}
                                onChange={e => setUserForm({ ...userForm, role: e.target.value })}
                                className="w-full bg-white border border-slate-200 text-slate-800 text-[13px] font-semibold py-1.5 px-3 rounded-lg focus:outline-none focus:border-[#ff5a1f] cursor-pointer shadow-2xs"
                            >
                                <option value="STAFF">User</option>
                                <option value="ADMIN">Admin</option>
                            </select>
                        </div>

                        {/* USER NAME */}
                        <div className="grid grid-cols-[140px_1fr] items-center gap-2">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
                                USER NAME
                            </label>
                            <input
                                type="text"
                                value={userForm.username}
                                onChange={e => setUserForm({ ...userForm, username: e.target.value })}
                                placeholder="Enter user name"
                                className="w-full bg-white border border-slate-200 text-slate-800 text-[13px] font-semibold py-1.5 px-3 rounded-lg focus:outline-none focus:border-[#ff5a1f] shadow-2xs placeholder:text-slate-300"
                            />
                        </div>

                        {/* PASSWORD */}
                        <div className="grid grid-cols-[140px_1fr] items-center gap-2">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
                                PASSWORD
                            </label>
                            <input
                                type="password"
                                value={userForm.password}
                                onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                                placeholder="Enter password"
                                className="w-full bg-white border border-slate-200 text-slate-800 text-[13px] font-semibold py-1.5 px-3 rounded-lg focus:outline-none focus:border-[#ff5a1f] shadow-2xs placeholder:text-slate-300"
                            />
                        </div>

                        {/* CONFIRM PASSWORD */}
                        <div className="grid grid-cols-[140px_1fr] items-center gap-2">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
                                CONFIRM PASSWORD
                            </label>
                            <input
                                type="password"
                                value={userForm.confirmPassword}
                                onChange={e => setUserForm({ ...userForm, confirmPassword: e.target.value })}
                                placeholder="Confirm password"
                                className="w-full bg-white border border-slate-200 text-slate-800 text-[13px] font-semibold py-1.5 px-3 rounded-lg focus:outline-none focus:border-[#ff5a1f] shadow-2xs placeholder:text-slate-300"
                            />
                        </div>

                        {/* SAVE BUTTON */}
                        <div className="flex justify-end pt-1">
                            <button
                                onClick={saveUser}
                                disabled={saving}
                                className="bg-[#ff5a1f] hover:bg-[#ea580c] text-white px-5 py-2 rounded-lg font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                            >
                                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                <span>SAVE</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* DIVIDER LINE & EXISTING USERS TABLE */}
                <div className="mt-3 border-t border-slate-200/80 pt-3 flex-1 flex flex-col min-h-0 overflow-hidden">
                    <h4 className="text-xs font-black text-[#1e293b] uppercase tracking-wider mb-2 flex-shrink-0">
                        EXISTING USERS
                    </h4>

                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs flex-1 overflow-y-auto custom-scrollbar min-h-0">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 z-10 bg-[#0f172a]">
                                <tr className="text-white text-[11px] font-black uppercase tracking-wider">
                                    <th className="py-2.5 px-4 text-center w-16 bg-[#0f172a]">ACTION</th>
                                    <th className="py-2.5 px-4 bg-[#0f172a]">USER NAME</th>
                                    <th className="py-2.5 px-4 bg-[#0f172a]">USER TYPE</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-800">
                                {users.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="py-5 text-center text-slate-400 font-semibold">
                                            No users found.
                                        </td>
                                    </tr>
                                ) : (
                                    users.map(u => {
                                        const isSelected = selectedUserId === u._id;
                                        const isMenuOpen = activeActionMenu === u._id;
                                        return (
                                            <tr
                                                key={u._id}
                                                onClick={() => selectUser(u)}
                                                className={`cursor-pointer transition-colors ${isSelected ? 'bg-orange-50/70' : 'hover:bg-slate-50'}`}
                                            >
                                                <td className="py-2.5 px-4 text-center relative" onClick={e => e.stopPropagation()}>
                                                    <button
                                                        onClick={() => setActiveActionMenu(isMenuOpen ? null : u._id)}
                                                        className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                                                    >
                                                        <MoreHorizontal size={16} />
                                                    </button>
                                                    {isMenuOpen && (
                                                        <div className="absolute left-4 top-8 bg-white border border-slate-200 rounded-lg shadow-xl z-20 py-1 w-24 text-left">
                                                            <button
                                                                onClick={() => selectUser(u)}
                                                                className="w-full px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                                            >
                                                                <Edit2 size={12} className="text-[#ff5a1f]" /> Edit
                                                            </button>
                                                            <button
                                                                onClick={() => deleteUser(u._id)}
                                                                className="w-full px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                                                            >
                                                                <Trash2 size={12} /> Delete
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="py-2.5 px-4 text-slate-900 font-extrabold">
                                                    {u.username || u.name}
                                                </td>
                                                <td className="py-2.5 px-4 text-slate-600 font-semibold">
                                                    {u.role === 'ADMIN' ? 'Admin' : 'User'}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: USER PERMISSION ACCORDION */}
            <div className="w-full lg:w-1/2 flex flex-col h-full overflow-hidden">
                <div className="flex items-center justify-between mb-3 flex-shrink-0">
                    <h3 className="text-sm font-black text-[#1e293b] uppercase tracking-wider">
                        USER PERMISSION
                    </h3>
                    {userForm.role === 'ADMIN' && (
                        <span className="text-[11px] font-black text-[#ff5a1f] bg-orange-50 px-2.5 py-1 rounded-full border border-orange-100 uppercase tracking-wider">
                            Admin has full rights
                        </span>
                    )}
                </div>

                <div className={`flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar min-h-0 ${userForm.role === 'ADMIN' ? 'opacity-60 pointer-events-none' : ''}`}>
                    {PERMISSION_CATEGORIES.map(category => {
                        const isExpanded = !!expandedCategories[category.name];
                        const allChecked = isCategoryChecked(category);
                        const partialChecked = isCategoryPartiallyChecked(category);

                        return (
                            <div key={category.name} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                                {/* CATEGORY HEADER ROW */}
                                <div
                                    onClick={() => toggleCategoryExpand(category.name)}
                                    className="flex items-center justify-between p-3.5 cursor-pointer hover:bg-slate-50/80 transition-colors select-none"
                                >
                                    <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
                                        <input
                                            type="checkbox"
                                            checked={allChecked}
                                            ref={el => { if (el) el.indeterminate = partialChecked; }}
                                            onChange={e => handleCategoryCheck(category, e.target.checked)}
                                            className="w-4 h-4 rounded text-[#ff5a1f] focus:ring-[#ff5a1f] accent-[#ff5a1f] cursor-pointer"
                                            style={{ accentColor: '#ff5a1f' }}
                                        />
                                        <span className="font-black text-slate-800 text-sm tracking-tight">
                                            {category.name}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); toggleCategoryExpand(category.name); }}
                                        className="text-[#ff5a1f] hover:text-[#ea580c] font-black p-1 cursor-pointer transition-colors"
                                    >
                                        {isExpanded ? <Minus size={18} strokeWidth={3} /> : <Plus size={18} strokeWidth={3} />}
                                    </button>
                                </div>

                                {/* CATEGORY SUB-MODULES LIST */}
                                {isExpanded && (
                                    <div className="p-3.5 pt-0 space-y-2.5 bg-slate-50/30 border-t border-slate-100">
                                        {category.modules.map(mod => {
                                            const modPerms = permissions[mod.key] || { view: false, alter: false, cancel: false, delete: false };
                                            return (
                                                <div key={mod.key} className="bg-[#fffcf9] border border-orange-100/80 rounded-lg p-3 space-y-2">
                                                    {/* Sub-module Header & Checkbox & Minus Toggle */}
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <input
                                                                type="checkbox"
                                                                checked={!!modPerms.view}
                                                                onChange={e => handleModuleCheck(mod.key, e.target.checked)}
                                                                className="w-4 h-4 rounded text-[#ff5a1f] focus:ring-[#ff5a1f] accent-[#ff5a1f] cursor-pointer"
                                                                style={{ accentColor: '#ff5a1f' }}
                                                            />
                                                            <span className="font-black text-slate-800 text-xs">
                                                                {mod.label}
                                                            </span>
                                                        </div>
                                                        <span className="text-[#ff5a1f] font-black text-sm select-none pr-1">
                                                            −
                                                        </span>
                                                    </div>

                                                    {/* Action Toggles: Cancel, Alter, Delete */}
                                                    <div className="flex items-center gap-4 pl-7 text-[11px] font-bold">
                                                        {/* CANCEL */}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleActionToggle(mod.key, 'cancel')}
                                                            className={`flex items-center gap-1 cursor-pointer transition-colors ${modPerms.cancel ? 'text-[#ff5a1f]' : 'text-slate-400 hover:text-slate-600'}`}
                                                        >
                                                            <span className="font-bold">✓</span>
                                                            <span>Cancel</span>
                                                        </button>

                                                        {/* ALTER */}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleActionToggle(mod.key, 'alter')}
                                                            className={`flex items-center gap-1 cursor-pointer transition-colors ${modPerms.alter ? 'text-[#ff5a1f]' : 'text-slate-400 hover:text-slate-600'}`}
                                                        >
                                                            <span className="font-bold">✓</span>
                                                            <span>Alter</span>
                                                        </button>

                                                        {/* DELETE */}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleActionToggle(mod.key, 'delete')}
                                                            className={`flex items-center gap-1 cursor-pointer transition-colors ${modPerms.delete ? 'text-[#ff5a1f]' : 'text-slate-400 hover:text-slate-600'}`}
                                                        >
                                                            <span className="font-bold">✓</span>
                                                            <span>Delete</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default UserRightsSettings;
