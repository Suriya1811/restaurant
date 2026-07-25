import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
    Store, Mail, Phone, Lock,
    ArrowRight, Loader2, Utensils,
    ShieldCheck, Star, Layers, CheckCircle, FolderOpen
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logoSidebar from '../assets/logo_sidebar.png';
import { useFormNavigation } from '../hooks/useFormNavigation';
import SaveConfirmationModal from '../components/common/SaveConfirmationModal';
import './RegisterRestaurant.css';

const RegisterRestaurant = () => {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showSaveConfirm, setShowSaveConfirm] = useState(false);

    const handleFormSubmitRequest = () => {
        setShowSaveConfirm(true);
    };

    const { formRef, handleKeyDown } = useFormNavigation([], handleFormSubmitRequest);

    const [formData, setFormData] = useState({
        path: '',
        company_name: '',
        short_name: '',
        print_name: '',
        restaurant_type: 'DINING',
        financial_year: '',
        start_from: '',
        start_to: '',
        books_from: '',
        address: '',
        mobile: '',
        email: '',
        gstin: '',
        fssai_no: '',
        logo_url: ''
    });

    const handleChange = (e) => {
        const { name, value, type, checked, files } = e.target;
        
        if (type === 'file') {
            const file = files[0];
            if (file) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setFormData(prev => ({ ...prev, [name]: reader.result }));
                };
                reader.readAsDataURL(file);
            } else {
                setFormData(prev => ({ ...prev, [name]: '' }));
            }
            return;
        }

        let newFormData = {
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        };
        if (name === 'company_name') {
            newFormData.print_name = value;
        }
        setFormData(newFormData);
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        setError('');

        const registrationData = {
            ...formData,
            owner_name: formData.company_name,
            store_name: formData.company_name
        };

        const res = await register(registrationData);

        if (res.success) {
            // Redirect to company selection page instead of logging in automatically
            navigate('/company-selection', {
                state: {
                    company: res.data.restaurant_name,
                    logo_url: res.data.logo_url
                }
            });
        } else {
            setError(res.error);
        }
        setLoading(false);
    };

    const confirmSave = () => {
        setShowSaveConfirm(false);
        handleSubmit();
    };

    const cancelSave = () => {
        setShowSaveConfirm(false);
    };

    return (
        <div className="auth-container">
            {/* Creative Professional Sidebar */}
                <div className="auth-sidebar">
                    <div className="sidebar-glow"></div>

                    <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
                        <Link to="/" className="no-underline">
                            <img 
                                src={logoSidebar} 
                                alt="Yugam Software" 
                                style={{ width: '280px', maxWidth: '100%', height: 'auto', display: 'block', margin: '0 auto' }} 
                            />
                        </Link>
                    </div>

                    <div className="sidebar-main-content" style={{ display: 'flex', flex: 1, flexDirection: 'column', justifyContent: 'center' }}>


                        <div className="testimonial-card-creative" style={{ marginTop: '0' }}>
                            <p className="testimonial-text" style={{ fontStyle: 'normal' }}>
                                The definitive enterprise operating system for the modern hospitality industry. Scaling excellence through modular innovation.
                            </p>
                            
                            <div className="feature-list" style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#e2e8f0', fontSize: '1.05rem', fontWeight: 500 }}>
                                    <CheckCircle size={22} color="#38bdf8" />
                                    <span>Dashboard Intelligence.</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#e2e8f0', fontSize: '1.05rem', fontWeight: 500 }}>
                                    <CheckCircle size={22} color="#38bdf8" />
                                    <span>Modular Inventory.</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#e2e8f0', fontSize: '1.05rem', fontWeight: 500 }}>
                                    <CheckCircle size={22} color="#38bdf8" />
                                    <span>Seamless POS Integration.</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Professional Form Scroll Area */}
                <main className="auth-main-scroll">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="auth-form-wrapper-wide"
                    >
                        <div className="form-header">
                            <Link to="/" className="mobile-auth-logo">
                                <div className="logo-icon-primary">
                                    <Utensils size={24} />
                                </div>
                                <span className="logo-text-primary">Resto<span>SaaS</span></span>
                            </Link>
                            <h1 className="form-title">Create Profile.</h1>
                            <p className="form-subtitle">Setup your company profile.</p>
                        </div>

                        {error && (
                            <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 rounded-xl text-red-600 font-bold flex items-center gap-3">
                                <span className="text-xl">⚠️</span> {error}
                            </div>
                        )}

                        <form ref={formRef} onKeyDown={handleKeyDown} onSubmit={(e) => { e.preventDefault(); handleFormSubmitRequest(); }} className="auth-card-clean">
                            <div className="input-grid">
                                <div className="input-group">
                                    <label className="input-header">Path</label>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <input
                                            type="text"
                                            name="path"
                                            placeholder="Installation/Data location path"
                                            className="input-field-professional"
                                            value={formData.path}
                                            onChange={handleChange}
                                            style={{ flex: 1 }}
                                        />
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                if (window.electronAPI && window.electronAPI.selectDirectory) {
                                                    const selectedPath = await window.electronAPI.selectDirectory();
                                                    if (selectedPath) {
                                                        setFormData(prev => ({ ...prev, path: selectedPath }));
                                                    }
                                                } else {
                                                    alert("Directory selection is only supported in the desktop app.");
                                                }
                                            }}
                                            className="btn-auth-secondary"
                                            style={{ padding: '0 15px', borderRadius: '8px', cursor: 'pointer', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', color: '#0f172a', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '5px' }}
                                        >
                                            <FolderOpen size={18} />
                                            Browse
                                        </button>
                                    </div>
                                </div>
                                <div className="input-group">
                                    <label className="input-header">Business Type</label>
                                    <select
                                        name="restaurant_type"
                                        className="input-field-professional"
                                        style={{ appearance: 'none' }}
                                        value={formData.restaurant_type}
                                        onChange={handleChange}
                                    >
                                        <option value="DINING">DINING POS</option>
                                        <option value="SMART">SMART SERVICE</option>
                                        <option value="SELF_SERVICE">SELF SERVICE</option>
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label className="input-header">Company Name</label>
                                    <input
                                        type="text"
                                        name="company_name"
                                        required
                                        placeholder="Company Name"
                                        className="input-field-professional"
                                        value={formData.company_name}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-header">Print Name</label>
                                    <input
                                        type="text"
                                        name="print_name"
                                        required
                                        placeholder="Print Name"
                                        className="input-field-professional"
                                        value={formData.print_name}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-header">Short Name</label>
                                    <input
                                        type="text"
                                        name="short_name"
                                        placeholder="Short Name"
                                        className="input-field-professional"
                                        value={formData.short_name}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-header">Financial Year</label>
                                    <input
                                        type="text"
                                        name="financial_year"
                                        placeholder="e.g. 2023-2024"
                                        className="input-field-professional"
                                        value={formData.financial_year}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-header">Start From</label>
                                    <input
                                        type="date"
                                        name="start_from"
                                        className="input-field-professional"
                                        value={formData.start_from}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-header">To</label>
                                    <input
                                        type="date"
                                        name="start_to"
                                        className="input-field-professional"
                                        value={formData.start_to}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-header">Books From</label>
                                    <input
                                        type="date"
                                        name="books_from"
                                        className="input-field-professional"
                                        value={formData.books_from}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-header">Address</label>
                                    <input
                                        type="text"
                                        name="address"
                                        required
                                        placeholder="Full address"
                                        className="input-field-professional"
                                        value={formData.address}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-header">Mobile Number</label>
                                    <input
                                        type="text"
                                        name="mobile"
                                        required
                                        placeholder="Mobile Number"
                                        className="input-field-professional"
                                        value={formData.mobile}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-header">Email ID</label>
                                    <input
                                        type="email"
                                        name="email"
                                        required
                                        placeholder="Email Address"
                                        className="input-field-professional"
                                        value={formData.email}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-header">GSTIN NO</label>
                                    <input
                                        type="text"
                                        name="gstin"
                                        placeholder="GSTIN NO"
                                        className="input-field-professional"
                                        value={formData.gstin}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-header">FSSI NO</label>
                                    <input
                                        type="text"
                                        name="fssai_no"
                                        placeholder="FSSI NO"
                                        className="input-field-professional"
                                        value={formData.fssai_no}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-header">Company Logo</label>
                                    <input
                                        type="file"
                                        name="logo_url"
                                        accept=".jpg,.jpeg,.pdf"
                                        className="input-field-professional"
                                        style={{ padding: '10px 14px' }}
                                        onChange={handleChange}
                                    />
                                    {formData.logo_url && (
                                        <div style={{ marginTop: '10px' }}>
                                            <img src={formData.logo_url} alt="Logo Preview" style={{ maxWidth: '100px', maxHeight: '100px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-auth-primary flex items-center justify-center gap-4"
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin" />
                                ) : (
                                    <>
                                        Create Profile <ArrowRight size={22} />
                                    </>
                                )}
                            </button>

                            <div className="auth-footer">
                                Resume access?
                                <Link to="/login" className="auth-redirect no-underline">Login To Dashboard</Link>
                            </div>
                        </form>
                        <SaveConfirmationModal 
                            isOpen={showSaveConfirm} 
                            onConfirm={confirmSave} 
                            onCancel={cancelSave} 
                        />
                    </motion.div>
                </main>
            </div>
    );
};

export default RegisterRestaurant;
