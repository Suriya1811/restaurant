import { useState, useEffect } from 'react';
import { Shield, Plus, Edit2, Trash2, Save, X, Search, Check, AlertCircle, Loader2, ChevronRight, ChevronDown } from 'lucide-react';
import axios from 'axios';

const PERMISSION_MODULES = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'kot', label: 'KOT' },
    { key: 'sales_bill', label: 'Sales Bill' },
    { key: 'display', label: 'Display' },
    { key: 'party_master', label: 'Party Master' },
    { key: 'purchase', label: 'Purchase Entry' },
    { key: 'receipts', label: 'Receipt Entry' },
    { key: 'payments', label: 'Payment Entry' },
    { key: 'vouchers', label: 'Voucher Master' },
    { key: 'products', label: 'Item' },
    { key: 'categories', label: 'Category' },
    { key: 'brands', label: 'Brand' },
    { key: 'tables', label: 'Table Master' },
    { key: 'captains', label: 'Captain Master' },
    { key: 'waiters', label: 'Waiter Master' },
    { key: 'suppliers', label: 'Supplier Master' },
    { key: 'customers', label: 'Customer Master' },
    { key: 'ledgers', label: 'Ledger Master' }
];

const UserRightsSettings = () => {
    // Initialize permissions object
    const initPermissions = (existingPerms = []) => {
        const perms = {};
        PERMISSION_MODULES.forEach(mod => {
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
    const [filterRole, setFilterRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [userForm, setUserForm] = useState({
        name: '', username: '', password: '', role: 'STAFF', is_active: true, password_enabled: true
    });
    const [permissions, setPermissions] = useState(() => initPermissions());
    const [expandedModules, setExpandedModules] = useState({});
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
        if (!user) {
            setSelectedUserId(null);
            setUserForm({ name: '', username: '', password: '', role: 'STAFF', is_active: true, password_enabled: true });
            setPermissions(initPermissions());
            setError('');
            setSuccess('');
            return;
        }
        setSelectedUserId(user._id);
        setUserForm({
            name: user.name || '',
            username: user.username || '',
            password: '', // blank on edit
            role: user.role || 'STAFF',
            is_active: user.is_active !== false,
            password_enabled: user.password_enabled !== false
        });
        setPermissions(initPermissions(user.permissions || []));
        setError('');
        setSuccess('');
    };

    const handlePermToggle = (modKey, action, val) => {
        setPermissions(prev => {
            const mod = { ...prev[modKey] };
            if (action === 'view') {
                mod.view = val;
                if (!val) {
                    mod.alter = false;
                    mod.cancel = false;
                    mod.delete = false;
                }
            } else {
                mod[action] = val;
                if (val) mod.view = true;
            }
            return { ...prev, [modKey]: mod };
        });
    };

    const toggleModuleExpand = (modKey) => {
        setExpandedModules(prev => ({ ...prev, [modKey]: !prev[modKey] }));
    };

    const saveUser = async () => {
        setError('');
        setSuccess('');
        if (!userForm.name || !userForm.username || !userForm.role) {
            setError('Name, Username, and User Type are required');
            return;
        }
        if (!selectedUserId && userForm.password_enabled && !userForm.password) {
            setError('Password is required for new users when password protection is enabled');
            return;
        }
        
        setSaving(true);
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            
            const permsArray = Object.values(permissions).filter(p => p.view || p.alter || p.cancel || p.delete);
            const payload = {
                ...userForm,
                permissions: permsArray
            };

            let updatedUser = null;
            if (selectedUserId) {
                const res = await axios.put(`${import.meta.env.VITE_API_URL}/roles/users/${selectedUserId}`, payload, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.data.success && res.data.data) {
                    updatedUser = res.data.data;
                }
                setSuccess('User updated successfully');
            } else {
                const res = await axios.post(`${import.meta.env.VITE_API_URL}/roles/users`, payload, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.data.success && res.data.data) {
                    updatedUser = res.data.data;
                }
                setSuccess('User created successfully');
            }
            await fetchUsers();
            setTimeout(() => setSuccess(''), 3000);
            
            if (!selectedUserId) {
                selectUser(null);
            } else if (updatedUser) {
                selectUser(updatedUser);
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
        return <div className="p-8 text-center"><Loader2 className="animate-spin inline mr-2"/> Loading Users...</div>;
    }

    return (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row" style={{ height: 'calc(100vh - 220px)' }}>
            {/* Users List Sidebar */}
            <div className="w-full md:w-64 border-r border-slate-200 bg-slate-50 flex flex-col shrink-0 overflow-y-auto">
                <div className="p-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-slate-50 z-10">
                    <div className="flex gap-4">
                        <button 
                            onClick={() => setFilterRole(filterRole === 'ADMIN' ? null : 'ADMIN')}
                            className={`text-xs font-black uppercase tracking-widest transition-colors ${filterRole === 'ADMIN' ? 'text-orange-600 underline underline-offset-4 decoration-2' : 'text-orange-400 hover:text-orange-500'}`}
                        >
                            Admins
                        </button>
                        <button 
                            onClick={() => setFilterRole(filterRole === 'STAFF' ? null : 'STAFF')}
                            className={`text-xs font-black uppercase tracking-widest transition-colors ${filterRole === 'STAFF' ? 'text-orange-600 underline underline-offset-4 decoration-2' : 'text-orange-400 hover:text-orange-500'}`}
                        >
                            Users
                        </button>
                    </div>
                    <button onClick={() => selectUser(null)} className="p-1.5 bg-orange-100 text-orange-600 rounded hover:bg-orange-200 transition-colors" title="Add New User">
                        <Plus size={16} />
                    </button>
                </div>
                <div className="p-2 space-y-1">
                    {(filterRole ? users.filter(u => u.role === filterRole) : users).map(u => (
                        <div key={u._id} onClick={() => selectUser(u)}
                            className={`p-3 rounded cursor-pointer flex items-center justify-between group transition-colors ${selectedUserId === u._id ? 'bg-orange-500 text-white shadow' : 'hover:bg-slate-200 text-slate-700'}`}>
                            <div className="truncate flex-1 pr-2">
                                <div className="flex items-center gap-2">
                                    <p className="font-semibold text-sm truncate">{u.name}</p>
                                    <span className={`text-[9px] uppercase font-black px-1.5 py-0.5 rounded ${selectedUserId === u._id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                        {u.role === 'ADMIN' ? 'Admin' : 'User'}
                                    </span>
                                </div>
                                <p className={`text-xs mt-0.5 truncate ${selectedUserId === u._id ? 'text-orange-100' : 'text-slate-500'}`}>@{u.username}</p>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); deleteUser(u._id); }} className={`p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity ${selectedUserId === u._id ? 'hover:bg-orange-600 text-orange-100' : 'hover:bg-red-100 text-red-500'}`}>
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                    {users.length === 0 && <p className="text-center text-slate-500 text-sm mt-4">No users found</p>}
                    {users.length > 0 && filterRole && users.filter(u => u.role === filterRole).length === 0 && (
                        <p className="text-center text-slate-500 text-sm mt-4">No {filterRole === 'ADMIN' ? 'admins' : 'users'} found</p>
                    )}
                </div>
            </div>

            {/* Split Screen Form */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-white relative">
                
                {/* Left Section: User Details */}
                <div className="w-full md:w-1/3 border-r border-slate-200 p-4 lg:p-5 overflow-y-auto bg-slate-50/30">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-3">
                        {selectedUserId ? 'Edit User' : 'New User'}
                    </h3>

                    {error && <div className="bg-rose-50 text-rose-600 p-3 rounded mb-3 text-sm font-semibold flex items-center gap-2"><AlertCircle size={16}/> {error}</div>}
                    {success && <div className="bg-emerald-50 text-emerald-700 p-3 rounded mb-3 text-sm font-semibold flex items-center gap-2"><Check size={16}/> {success}</div>}

                    <div className="space-y-3">
                        <div className="form-group-premium">
                            <label>User Type</label>
                            <select className="input-premium !rounded !bg-white" 
                                value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})}>
                                <option value="STAFF">User</option>
                                <option value="ADMIN">Admin</option>
                            </select>
                        </div>
                        <div className="form-group-premium">
                            <label>Name</label>
                            <input type="text" className="input-premium !rounded !bg-white" placeholder="Full Name" 
                                autoComplete="off"
                                value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} />
                        </div>
                        <div className="form-group-premium">
                            <label>Username</label>
                            <input type="text" className="input-premium !rounded !bg-white" placeholder="Username (login ID)" 
                                autoComplete="off"
                                value={userForm.username} onChange={e => setUserForm({...userForm, username: e.target.value.toLowerCase()})} />
                        </div>
                        <div className="form-group-premium">
                            <div className="flex items-center justify-between mb-2">
                                <label className="mb-0">Password {selectedUserId && <span className="text-slate-400 font-normal">(Leave blank to keep current)</span>}</label>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={userForm.password_enabled} 
                                        onChange={(e) => setUserForm({ ...userForm, password_enabled: e.target.checked })} 
                                        className="sr-only peer" 
                                    />
                                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-600"></div>
                                </label>
                            </div>
                            {userForm.password_enabled && (
                                <input type="password" className="input-premium !rounded !bg-white" placeholder="Password" 
                                    autoComplete="new-password"
                                    value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} />
                            )}
                            {!userForm.password_enabled && (
                                <div className="text-xs text-slate-500 italic mt-1">Password protection is disabled. User can login using username only.</div>
                            )}
                        </div>
                    </div>

                    <div className="mt-5">
                        <button onClick={saveUser} disabled={saving} className="w-full !bg-orange-500 hover:!bg-orange-600 text-white shadow-lg shadow-orange-200 font-bold rounded-lg !py-2.5 flex items-center justify-center gap-2 transition-all">
                            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            SAVE
                        </button>
                    </div>
                </div>

                {/* Right Section: Permissions Tree */}
                <div className="w-full md:w-2/3 p-6 overflow-y-auto">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">User Permissions</h3>
                        {userForm.role === 'ADMIN' && (
                            <span className="bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                Admins have full access
                            </span>
                        )}
                    </div>
                    
                    <div className={`space-y-2 ${userForm.role === 'ADMIN' ? 'opacity-50 pointer-events-none' : ''}`}>
                        {PERMISSION_MODULES.map(mod => {
                            const isExpanded = expandedModules[mod.key];
                            const perms = permissions[mod.key] || { view: false, alter: false, cancel: false, delete: false };
                            
                            return (
                                <div key={mod.key} className="border border-slate-200 rounded-lg overflow-hidden">
                                    <div className={`flex items-center justify-between p-3 cursor-pointer ${isExpanded ? 'bg-orange-50/50 border-b border-slate-200' : 'hover:bg-slate-50'}`}
                                        onClick={() => toggleModuleExpand(mod.key)}>
                                        <div className="flex items-center gap-3">
                                            <div onClick={e => e.stopPropagation()} className="flex items-center h-full">
                                                <input 
                                                    type="checkbox" 
                                                    checked={perms.view} 
                                                    onChange={(e) => handlePermToggle(mod.key, 'view', e.target.checked)}
                                                    className="w-4 h-4 text-orange-600 rounded border-slate-300 cursor-pointer"
                                                />
                                            </div>
                                            <span className="font-bold text-slate-700 text-sm">{mod.label}</span>
                                        </div>
                                        {isExpanded ? <ChevronDown size={18} className="text-slate-400" /> : <ChevronRight size={18} className="text-slate-400" />}
                                    </div>
                                    
                                    {isExpanded && (
                                        <div className="p-4 bg-slate-50/50 grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="checkbox" checked={perms.view} onChange={e => handlePermToggle(mod.key, 'view', e.target.checked)} className="rounded text-orange-600 w-3.5 h-3.5 border-slate-300"/>
                                                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">View</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="checkbox" checked={perms.alter} onChange={e => handlePermToggle(mod.key, 'alter', e.target.checked)} className="rounded text-orange-600 w-3.5 h-3.5 border-slate-300"/>
                                                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Alter</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="checkbox" checked={perms.cancel} onChange={e => handlePermToggle(mod.key, 'cancel', e.target.checked)} className="rounded text-orange-600 w-3.5 h-3.5 border-slate-300"/>
                                                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Cancel</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="checkbox" checked={perms.delete} onChange={e => handlePermToggle(mod.key, 'delete', e.target.checked)} className="rounded text-rose-600 w-3.5 h-3.5 border-slate-300"/>
                                                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Delete</span>
                                            </label>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserRightsSettings;
