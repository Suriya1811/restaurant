import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';
import './Dashboard.css';
import {
    Bell,
    Hash,
    PlusCircle,
    Minus,
    Search,
    Edit,
    Trash,
    CheckCircle2,
    XCircle,
    Package,
    AlertCircle,
    Loader2,
    Plus,
    Trash2,
    Clock,
    Layers,
    ShoppingCart,
    Tag,
    Image as ImageIcon,
    Check,
    Download,
    Upload,
    Activity,
    ChevronRight,
    ArrowRight,
    Eye,
    EyeOff,
    Table,
    Truck,
    Users2,
    ChevronDown,
    ChevronUp,
    Printer,
    X
} from 'lucide-react';
import { TableSkeleton } from '../../components/Skeleton';
import { useFormNavigation } from '../../hooks/useFormNavigation';
import SaveConfirmationModal from '../../components/common/SaveConfirmationModal';

const ProductMaster = () => {
    const { user, hasModuleAccess } = useAuth();
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDrawer, setShowDrawer] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [selectedBrand, setSelectedBrand] = useState('ALL');
    const [selectedFoodType, setSelectedFoodType] = useState('ALL');
    const [units, setUnits] = useState([]);
    const [taxes, setTaxes] = useState([]);
    const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
    const [showSaveConfirm, setShowSaveConfirm] = useState(false);

    const handleFormSubmitRequest = () => {
        setShowSaveConfirm(true);
    };

    const { formRef, handleKeyDown } = useFormNavigation([showDrawer], handleFormSubmitRequest);

    // Collapsible sections state
    const [expandedSections, setExpandedSections] = useState({
        inventory: false,
        otherInfo: false,
        variations: false,
        addons: false
    });

    const toggleSection = (section) => { setExpandedSections(prev => { const isCurrentlyOpen = prev[section]; return { inventory: false, otherInfo: false, variations: false, addons: false, [section]: !isCurrentlyOpen }; }); };

    // Modals state
    const [showGroupModal, setShowGroupModal] = useState(false);
    const [showBrandModal, setShowBrandModal] = useState(false);
    const [showUnitModal, setShowUnitModal] = useState(false);
    const [showTaxModal, setShowTaxModal] = useState(false);

    // Quick creation form data
    const [quickGroupData, setQuickGroupData] = useState({ name: '', description: '', hsn_code: '' });
    const [quickBrandData, setQuickBrandData] = useState({ name: '', description: '' });
    const [quickUnitData, setQuickUnitData] = useState({ name: '', description: '', accept_decimal: false });
    const [quickTaxData, setQuickTaxData] = useState({ name: '', percentage: 0 });
    const fileInputRef = useRef(null);
    const actionMenuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (actionMenuRef.current && !actionMenuRef.current.contains(event.target)) {
                setIsActionMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const initialFormState = {
        code: '',
        barcode: '',
        name: '',
        short_name: '',
        print_name: '',
        category: '',
        brand: '',
        food_type: 'NONE',
        item_nature: 'GOOD',
        product_type: 'GOODS',
        // IMPORTANT: store as strings so inputs never get stuck at '0'
        purchase_price: '',
        cost_price: '',
        selling_price: '',
        mrp: '',
        gst_sales: '',
        gst_purchase: '',
        igst_sales: '',
        igst_purchase: '',
        hsn_code: '',
        unit: '',
        opening_stock: '',
        min_stock: '',
        max_stock: '',
        reorder_level: '',
        urgent_order_level: '',
        available_timings: [
            { label: 'Morning', start_time: '08:00', end_time: '12:00', enabled: true },
            { label: 'Afternoon', start_time: '12:00', end_time: '16:00', enabled: true },
            { label: 'Evening', start_time: '16:00', end_time: '23:00', enabled: true }
        ],
        addons: [],
        variations: [],
        serve_types: {
            dine_in: true,
            delivery: true,
            pickup: true,
            party_order: true
        },
        image: '',
        online_order: false,
        is_active: true
    };

    const [formData, setFormData] = useState(initialFormState);

    const getBaseUrl = () => {
        const fullUrl = import.meta.env.VITE_API_URL;
        return fullUrl.replace('/api', '');
    };

    // Wrapper around fetch that auto-redirects on 401 (token expired/invalid)
    const fetchWithAuth = async (url, options = {}) => {
        const savedUser = localStorage.getItem('user');
        if (!savedUser) {
            window.location.href = '/login';
            throw new Error('Not authenticated');
        }
        const { token } = JSON.parse(savedUser);
        const headers = {
            ...(options.headers || {}),
            'Authorization': `Bearer ${token}`
        };
        const res = await fetch(url, { ...options, headers });
        if (res.status === 401) {
            localStorage.removeItem('user');
            localStorage.removeItem('permissions');
            localStorage.removeItem('moduleSettings');
            window.location.href = '/login';
            throw new Error('Session expired. Please log in again.');
        }
        return res;
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);
            const headers = { 'Authorization': `Bearer ${token}` };

            const [prodRes, catRes, brandRes, unitRes, taxRes] = await Promise.all([
                fetchWithAuth(`${import.meta.env.VITE_API_URL}/products`),
                fetchWithAuth(`${import.meta.env.VITE_API_URL}/categories`),
                fetchWithAuth(`${import.meta.env.VITE_API_URL}/brands`),
                fetchWithAuth(`${import.meta.env.VITE_API_URL}/units`),
                fetchWithAuth(`${import.meta.env.VITE_API_URL}/taxes`)
            ]);

            const prodData = await prodRes.json();
            const catData = await catRes.json();
            const brandData = await brandRes.json();
            const unitData = await unitRes.json();
            const taxData = await taxRes.json();

            if (prodData.success) setProducts(prodData.data);
            if (catData.success) setCategories(catData.data);
            if (brandData.success) setBrands(brandData.data);
            if (unitData.success) setUnits(unitData.data);
            if (taxData.success) setTaxes(taxData.data);

        } catch (err) {
            console.error("Failed to fetch data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const exportCSV = () => {
        if (!products.length) return;

        // Define columns matching the creation form precisely
        const columns = [
            { header: 'Item Name', key: 'name' },
            { header: 'Item Code', key: 'code' },
            { header: 'Barcode', key: 'barcode' },
            { header: 'Short Name', key: 'short_name' },
            { header: 'Print Name', key: 'print_name' },
            { header: 'Category', key: 'category' },
            { header: 'Brand', key: 'brand' },
            { header: 'Food Type', key: 'food_type' },
            { header: 'Item Nature', key: 'item_nature' },
            { header: 'Product Type', key: 'product_type' },
            { header: 'Unit', key: 'unit' },
            { header: 'Purchase Rate', key: 'purchase_price' },
            { header: 'Cost Rate', key: 'cost_price' },
            { header: 'Selling Price', key: 'selling_price' },
            { header: 'MRP', key: 'mrp' },
            { header: 'GST Purchase %', key: 'gst_purchase' },
            { header: 'GST Sales %', key: 'gst_sales' },
            { header: 'IGST Purchase %', key: 'igst_purchase' },
            { header: 'IGST Sales %', key: 'igst_sales' },
            { header: 'HSN Code', key: 'hsn_code' },
            { header: 'Opening Stock', key: 'opening_stock' },
            { header: 'Stock Value', key: 'stock_value' },
            { header: 'Max Stock', key: 'max_stock' },
            { header: 'Min Stock', key: 'min_stock' },
            { header: 'Reorder Level', key: 'reorder_level' },
            { header: 'Urgent Level', key: 'urgent_order_level' },
            { header: 'Dine In', get: (p) => p.serve_types?.dine_in ? 'YES' : 'NO' },
            { header: 'Delivery', get: (p) => p.serve_types?.delivery ? 'YES' : 'NO' },
            { header: 'Pickup', get: (p) => p.serve_types?.pickup ? 'YES' : 'NO' },
            { header: 'Party Order', get: (p) => p.serve_types?.party_order ? 'YES' : 'NO' },
            { header: 'Variations', get: (p) => p.variations?.map(v => `${v.name}(${v.amount})`).join(' | ') || '' },
            { header: 'Addons', get: (p) => p.addons?.map(a => `${a.name}(${a.rate})`).join(' | ') || '' },
            { header: 'Online Order', get: (p) => p.online_order ? 'YES' : 'NO' },
            { header: 'Active Status', get: (p) => p.is_active ? 'ACTIVE' : 'INACTIVE' }
        ];

        let csvContent = "\uFEFF"; // Add BOM for Excel UTF-8 support

        // Add Headers row
        csvContent += columns.map(c => `"${c.header}"`).join(',') + '\n';

        // Add Data rows
        filteredProducts.forEach(p => {
            const row = columns.map(col => {
                let cellData = col.get ? col.get(p) : (p[col.key] || '');
                // Escape quotes and wrap in quotes to handle commas and newlines
                cellData = String(cellData).replace(/"/g, '""');
                return `"${cellData}"`;
            });
            csvContent += row.join(',') + '\n';
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "Enterprise_Product_Master.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleCSVImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setLoading(true);

        const parseCSVLine = (text) => {
            const result = [];
            let cur = '', inQuote = false;
            for (let i = 0; i < text.length; i++) {
                const c = text[i];
                if (c === '"') {
                    if (inQuote && text[i + 1] === '"') { cur += '"'; i++; }
                    else { inQuote = !inQuote; }
                } else if (c === ',' && !inQuote) {
                    result.push(cur);
                    cur = '';
                } else {
                    cur += c;
                }
            }
            result.push(cur);
            return result;
        };

        const reader = new FileReader();
        reader.onload = async (event) => {
            let text = event.target.result;
            if (text.charCodeAt(0) === 0xFEFF) text = text.substring(1); // Remove BOM

            const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
            if (lines.length < 2) {
                alert("File is empty or invalid format");
                setLoading(false);
                return;
            }

            const headers = parseCSVLine(lines[0]).map(h => h.trim());

            const colMap = {
                'Item Name': 'name', 'Item Code': 'code', 'Barcode': 'barcode',
                'Short Name': 'short_name', 'Print Name': 'print_name',
                'Category': 'category', 'Brand': 'brand', 'Food Type': 'food_type',
                'Item Nature': 'item_nature', 'Product Type': 'product_type',
                'Unit': 'unit', 'Purchase Rate': 'purchase_price', 'Cost Rate': 'cost_price',
                'Selling Price': 'selling_price', 'MRP': 'mrp', 'GST Purchase %': 'gst_purchase',
                'GST Sales %': 'gst_sales', 'HSN Code': 'hsn_code', 'Opening Stock': 'opening_stock',
                'Stock Value': 'stock_value', 'Max Stock': 'max_stock', 'Min Stock': 'min_stock',
                'Reorder Level': 'reorder_level', 'Urgent Level': 'urgent_order_level'
            };

            const parseExtras = (str) => {
                if (!str || !str.trim()) return [];
                return str.split('|').map(s => {
                    let name = s.trim();
                    let amount = 0;
                    const match = name.match(/^(.*?)\(([\d.]+)\)$/);
                    if (match) {
                        name = match[1].trim();
                        amount = parseFloat(match[2]) || 0;
                    }
                    return { name, amount, rate: amount };
                }).filter(x => x.name);
            };

            const parseBool = (str) => /^(YES|ACTIVE|TRUE|1)$/i.test((str || '').trim());

            const items = lines.slice(1).map(line => {
                const values = parseCSVLine(line);
                const obj = JSON.parse(JSON.stringify(initialFormState)); // Deep copy 

                headers.forEach((h, i) => {
                    let val = (values[i] || '').trim();
                    if (colMap[h]) {
                        const key = colMap[h];
                        // Convert numeric fields
                        const numFields = ['purchase_price', 'cost_price', 'selling_price', 'mrp', 'gst_purchase', 'gst_sales', 'opening_stock', 'stock_value', 'max_stock', 'min_stock', 'reorder_level', 'urgent_order_level'];
                        if (numFields.includes(key)) {
                            obj[key] = parseFloat(val) || 0;
                        } else {
                            obj[key] = val;
                        }
                    } else {
                        // Custom Handlers
                        if (h === 'Dine In') obj.serve_types.dine_in = parseBool(val);
                        if (h === 'Delivery') obj.serve_types.delivery = parseBool(val);
                        if (h === 'Pickup') obj.serve_types.pickup = parseBool(val);
                        if (h === 'Party Order') obj.serve_types.party_order = parseBool(val);
                        if (h === 'Online Order') obj.online_order = parseBool(val);
                        if (h === 'Active Status') obj.is_active = parseBool(val);

                        if (h === 'Variations') {
                            obj.variations = parseExtras(val).map(v => ({ name: v.name, amount: v.amount }));
                        }
                        if (h === 'Addons') {
                            obj.addons = parseExtras(val).map(a => ({ name: a.name, rate: a.rate }));
                        }
                    }
                });
                return obj;
            }).filter(i => i.name);

            if (items.length === 0) {
                alert("No valid items found to import. Make sure Item Name is provided.");
                setLoading(false);
                return;
            }

            try {
                const savedUser = localStorage.getItem('user');
                const { token } = JSON.parse(savedUser);

                let successCount = 0;
                let failCount = 0;

                // Process sequentially or chunks to avoid overwhelming the server
                for (const item of items) {
                    try {
                        const res = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/products`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(item)
                        });
                        if (res.ok) successCount++;
                        else failCount++;
                    } catch (err) {
                        failCount++;
                    }
                }

                alert(`Import Complete:\nSuccessfully Imported: ${successCount}\nFailed: ${failCount}`);
                fetchData();
            } catch (err) {
                alert("Import process failed: " + err.message);
            } finally {
                setLoading(false);
                // Reset file input
                if (e.target) e.target.value = '';
            }
        };
        reader.readAsText(file);
    };

    // Live computed stock value â€” shown in disabled Asset Value field
    const computedStockValue = ((parseFloat(formData.purchase_price) || 0) * (parseFloat(formData.opening_stock) || 0)).toFixed(2);

    // Simple handleInputChange â€” stores raw string for ALL fields.
    // Number fields are kept as strings during editing to prevent the
    // React controlled-input "stuck at 0" bug where typing '5' into a
    // field showing 0 produces no state change and the input won't update.
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: checked }));
            return;
        }

        // Handle specific fields
        if (name === 'category') {
            const selectedCat = categories.find(c => c.name === value);
            setFormData(prev => ({
                ...prev,
                [name]: value,
                hsn_code: selectedCat?.hsn_code || ''
            }));
            return;
        }

        // Numeric fields filtering logic
        const numberFields = ['purchase_price', 'cost_price', 'selling_price', 'mrp', 'gst_sales', 'gst_purchase', 'opening_stock', 'min_stock', 'max_stock', 'reorder_level', 'urgent_order_level'];
        if (numberFields.includes(name)) {
            // Only allow numbers, decimals, and empty strings
            const sanitizedValue = value.replace(/[^0-9.]/g, '');
            // Prevent multiple decimal points
            const parts = sanitizedValue.split('.');
            if (parts.length > 2) return;

            setFormData(prev => ({ ...prev, [name]: sanitizedValue }));
            return;
        }

        // Store raw value for everything else
        setFormData(prev => {
            const nextState = { ...prev, [name]: value };
            // Auto-sync print_name when name changes (unconditionally as requested)
            if (name === 'name') {
                nextState.print_name = value;
            }
            return nextState;
        });
    };

    const handleServeTypeChange = (type) => {
        setFormData(prev => ({
            ...prev,
            serve_types: { ...prev.serve_types, [type]: !prev.serve_types[type] }
        }));
    };

    const handleAddAddon = () => {
        setFormData(prev => ({ ...prev, addons: [...prev.addons, { name: '', rate: 0 }] }));
    };

    const handleAddonChange = (index, field, value) => {
        const newAddons = [...formData.addons];
        newAddons[index][field] = value;
        setFormData(prev => ({ ...prev, addons: newAddons }));
    };

    const handleRemoveAddon = (index) => {
        setFormData(prev => ({ ...prev, addons: prev.addons.filter((_, i) => i !== index) }));
    };

    const handleAddVariation = () => {
        setFormData(prev => ({ ...prev, variations: [...prev.variations, { name: '', amount: 0 }] }));
    };

    const handleVariationChange = (index, field, value) => {
        const newVars = [...formData.variations];
        newVars[index][field] = value;
        setFormData(prev => ({ ...prev, variations: newVars }));
    };

    const handleRemoveVariation = (index) => {
        setFormData(prev => ({ ...prev, variations: prev.variations.filter((_, i) => i !== index) }));
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);

            // Sanitize: ensure all number fields are actual numbers (not empty strings)
            const numberFields = ['purchase_price', 'cost_price', 'selling_price', 'mrp', 'gst_sales', 'gst_purchase', 'igst_sales', 'igst_purchase', 'opening_stock', 'min_stock', 'max_stock', 'reorder_level', 'urgent_order_level'];
            const sanitizedData = { ...formData };
            numberFields.forEach(f => {
                sanitizedData[f] = parseFloat(sanitizedData[f]) || 0;
            });
            // Update stock_value based on sanitized values
            sanitizedData.stock_value = (sanitizedData.purchase_price * sanitizedData.opening_stock);

            const url = isEditing
                ? `${import.meta.env.VITE_API_URL}/products/${formData._id}`
                : `${import.meta.env.VITE_API_URL}/products`;

            const method = isEditing ? 'PUT' : 'POST';

            const response = await fetchWithAuth(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sanitizedData)
            });

            const result = await response.json();
            if (!result.success) throw new Error(result.message);

            alert(isEditing ? 'Product Master updated successfully!' : 'New Product created successfully in Master!');
            fetchData();
            setShowDrawer(false);
            resetForm();
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const confirmSave = () => {
        setShowSaveConfirm(false);
        handleSubmit();
    };

    const cancelSave = () => {
        setShowSaveConfirm(false);
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        const fData = new FormData();
        fData.append('image', file);
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            const response = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/products/upload`, {
                method: 'POST',
                body: fData
            });
            const result = await response.json();
            if (result.success) {
                setFormData(prev => ({ ...prev, image: result.data }));
            } else {
                throw new Error(result.message || 'Unknown upload error');
            }
        } catch (err) {
            console.error("Upload Error:", err);
            setError('Upload failed: ' + err.message);
            alert('Upload failed: ' + err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleEdit = (product) => {
        const numFields = ['purchase_price', 'cost_price', 'selling_price', 'mrp', 'gst_sales', 'gst_purchase', 'igst_sales', 'igst_purchase', 'opening_stock', 'min_stock', 'max_stock', 'reorder_level', 'urgent_order_level'];
        const productAsStrings = { ...product };
        numFields.forEach(f => {
            // Convert number from DB to string for form (e.g. 150 â†’ '150', 0 â†’ '')
            const v = product[f];
            productAsStrings[f] = (v === 0 || v === null || v === undefined) ? '' : String(v);
        });
        setFormData({ ...initialFormState, ...productAsStrings, serve_types: product.serve_types || initialFormState.serve_types });
        setIsEditing(true);
        setShowDrawer(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this master item?")) return;
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            await fetchWithAuth(`${import.meta.env.VITE_API_URL}/products/${id}`, {
                method: 'DELETE'
            });
            fetchData();
        } catch (err) { console.error(err); }
    };

    const resetForm = () => {
        setFormData(initialFormState);
        setIsEditing(false);
        setError('');
    };

    // Quick Creation Handlers
    const handleQuickSubmit = async (type, e) => {
        e.preventDefault();
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);

            let url = '';
            let payload = {};

            if (type === 'group') {
                url = `${import.meta.env.VITE_API_URL}/categories`;
                payload = quickGroupData;
            } else if (type === 'brand') {
                url = `${import.meta.env.VITE_API_URL}/brands`;
                payload = quickBrandData;
            } else if (type === 'unit') {
                url = `${import.meta.env.VITE_API_URL}/units`;
                payload = quickUnitData;
            } else if (type === 'tax') {
                url = `${import.meta.env.VITE_API_URL}/taxes`;
                payload = quickTaxData;
            }

            const res = await fetchWithAuth(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await res.json();
            if (!result.success) throw new Error(result.message);

            // Refetch all and close modal
            fetchData();
            if (type === 'group') { setShowGroupModal(false); setQuickGroupData({ name: '', description: '', hsn_code: '' }); setFormData(p => ({ ...p, category: payload.name })); }
            if (type === 'brand') { setShowBrandModal(false); setQuickBrandData({ name: '', description: '' }); setFormData(p => ({ ...p, brand: payload.name })); }
            if (type === 'unit') { setShowUnitModal(false); setQuickUnitData({ name: '', description: '', accept_decimal: false }); setFormData(p => ({ ...p, unit: payload.name })); }
            if (type === 'tax') { setShowTaxModal(false); setQuickTaxData({ name: '', percentage: 0 }); } // User will select tax manually or we could auto select

            alert(`${type} created successfully!`);

        } catch (err) {
            alert(`Failed to create ${type}: ` + err.message);
        }
    };

    const toggleSidebar = () => {
        if (window.innerWidth <= 768) setIsMobileSidebarOpen(!isMobileSidebarOpen);
        else {
            const newState = !isCollapsed;
            setIsCollapsed(newState);
            localStorage.setItem('sidebarCollapsed', newState);
        }
    };

    const handleClose = () => {
        if (window.confirm('Need to close the tab ( Yes / No ) ?')) {
            setShowDrawer(false);
            resetForm();
        }
    };



    const filteredProducts = products.filter(p => {
        const matchesSearch =
            (p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (p.code && p.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (p.barcode && p.barcode.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
        const matchesBrand = selectedBrand === 'ALL' || (p.brand || 'No Brand') === selectedBrand;
        const matchesFoodType = selectedFoodType === 'ALL' || p.food_type === selectedFoodType;

        return matchesSearch && matchesCategory && matchesBrand && matchesFoodType;
    });

    return (
        <div className="dashboard-layout">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />

            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}

            <main className="dashboard-main">
                <Header
                    toggleSidebar={toggleSidebar}
                    title={user?.restaurant_name || "Profile Name"}
                    actions={
                        <>
                            <button
                                type="button"
                                className="btn-premium-outline !py-2 !px-4 flex items-center gap-2"
                                onClick={exportCSV}
                                title="Export to Excel"
                            >
                                <Download size={14} />
                                <span className="text-[10px] uppercase font-black">Excel</span>
                            </button>
                            <button
                                type="button"
                                className="btn-premium-outline !py-2 !px-4 flex items-center gap-2"
                                onClick={() => window.print()}
                                title="Export to PDF"
                            >
                                <Download size={14} />
                                <span className="text-[10px] uppercase font-black">PDF</span>
                            </button>
                            <button
                                type="button"
                                className="btn-premium-outline !py-2 !px-4 flex items-center gap-2"
                                onClick={() => window.print()}
                                title="Print"
                            >
                                <Printer size={14} />
                                <span className="text-[10px] uppercase font-black">Print</span>
                            </button>
                            <button className="btn-premium-primary !py-1 !px-4" onClick={() => { resetForm(); setSearchTerm(''); setShowDrawer(true); }}>
                                <PlusCircle size={18} />
                                <span className="text-[10px] uppercase font-black">Add New Item</span>
                            </button>
                        </>
                    }
                />
                {!showDrawer ? (
                    <div className="master-content-layout fade-in !pt-2">

                        <div className="toolbar-premium">
                            <div className="flex flex-row items-center gap-4 flex-1">
                                <div className="search-premium" style={{ width: '400px', flexShrink: 0 }}>
                                    <Search size={20} />
                                    <input
                                        type="text"
                                        placeholder="Search by Name, Code, Barcode..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>

                                <div className="flex flex-row gap-2">
                                    <select
                                        className="filter-select-premium"
                                        value={selectedCategory}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                    >
                                        <option value="ALL">ALL CATEGORIES</option>
                                        {categories.map(cat => (
                                            <option key={cat._id} value={cat.name}>{cat.name}</option>
                                        ))}
                                    </select>

                                    <select
                                        className="filter-select-premium"
                                        value={selectedBrand}
                                        onChange={(e) => setSelectedBrand(e.target.value)}
                                    >
                                        <option value="ALL">ALL BRANDS</option>
                                        {brands.map(brand => (
                                            <option key={brand._id} value={brand.name}>{brand.name}</option>
                                        ))}
                                    </select>

                                    <select
                                        className="filter-select-premium"
                                        value={selectedFoodType}
                                        onChange={(e) => setSelectedFoodType(e.target.value)}
                                    >
                                        <option value="ALL">ANY FOOD TYPE</option>
                                        <option value="VEG">VEG</option>
                                        <option value="NON_VEG">NON-VEG</option>
                                        <option value="NONE">NONE</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex flex-col items-end flex-shrink-0">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Registry</span>
                                <span className="text-lg font-black text-slate-800">{filteredProducts.length} <span className="text-xs text-slate-300">Units</span></span>
                            </div>
                        </div>

                        <div className="table-container-premium" style={{ overflowX: 'auto', maxWidth: '100%', borderRadius: '1rem', background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                            <table className="modern-table-premium" style={{ minWidth: '4500px', width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                                <thead>
                                    <tr style={{ background: '#f8fafc' }}>
                                        <th className="sticky-col left-0" style={{ background: '#f8fafc', zIndex: 20 }}>Item Name</th>
                                        <th>Item Code</th>
                                        <th>Barcode</th>
                                        <th>Category</th>
                                        <th>Brand</th>
                                        <th>Food Type</th>
                                        <th>Unit</th>
                                        <th>Purchase Rate</th>
                                        <th>Cost Rate</th>
                                        <th>MRP</th>
                                        <th>Sales Rate</th>
                                        <th>GST Purchase (%)</th>
                                        <th>GST Sales (%)</th>
                                        <th>Dine In</th>
                                        <th>Pickup</th>
                                        <th>Delivery</th>
                                        <th>Party Order</th>
                                        <th>Opening Stock</th>
                                        <th>Stock Value</th>
                                        <th>Maximum</th>
                                        <th>Minimum</th>
                                        <th>Re-order</th>
                                        <th>Urgent</th>
                                        <th>Variations (e.g. Small, Medium, Large)</th>
                                        <th>Addons (Extras like Cheese)</th>
                                        <th>Morning (Begin)</th>
                                        <th>Morning (Terminate)</th>
                                        <th>Afternoon (Begin)</th>
                                        <th>Afternoon (Terminate)</th>
                                        <th>Evening (Begin)</th>
                                        <th>Evening (Terminate)</th>
                                        <th>Status (Active/Halted)</th>
                                        <th className="sticky-col right-0" style={{ background: '#f8fafc', zIndex: 20, textAlign: 'right' }}>Management</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan="33" style={{ textAlign: 'center', padding: '100px 0' }}>
                                                <Loader2 className="animate-spin text-indigo-600 mx-auto mb-4" size={48} />
                                                <p className="font-black text-slate-300 uppercase tracking-[0.2em] text-xs">Accessing Data Cluster...</p>
                                            </td>
                                        </tr>
                                    ) : filteredProducts.map(p => (
                                        <tr key={p._id} className={`group hover:bg-slate-50 transition-all ${!p.is_active ? 'opacity-60 grayscale-[0.8] bg-slate-50/50' : ''}`}>
                                            <td className="sticky-col left-0 group-hover:bg-slate-50 font-black text-slate-800 uppercase tracking-tighter text-sm" style={{ background: !p.is_active ? '#f8fafc' : 'white', zIndex: 10 }}>{p.name}</td>
                                            <td className="text-[10px] font-black text-slate-400 tracking-tighter uppercase">{p.code || 'Auto'}</td>
                                            <td className="text-slate-400 text-[10px] font-bold">{p.barcode || '-'}</td>
                                            <td><span className={`badge-premium ${p.is_active ? 'active' : 'disabled'} !text-[10px] uppercase font-black tracking-[0.15em]`}>{p.category}</span></td>
                                            <td className="text-slate-600 text-xs font-black uppercase tracking-tighter">{p.brand || '-'}</td>
                                            <td>
                                                {p.food_type !== 'NONE' ? (
                                                    <span className={`text-[10px] font-black py-1.5 px-2 rounded-none border ${p.food_type === 'VEG' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                                        {p.food_type}
                                                    </span>
                                                ) : <span className="text-slate-200">-</span>}
                                            </td>
                                            <td className="text-slate-600 font-black uppercase text-xs tracking-widest">{p.unit || '-'}</td>
                                            <td className="font-black text-rose-500 text-sm">₹{p.purchase_price}</td>
                                            <td className="font-black text-rose-500 text-sm">₹{p.cost_price}</td>
                                            <td className="font-black text-slate-700 text-sm">₹{p.mrp}</td>
                                            <td className="font-black text-indigo-600 text-sm">₹{p.selling_price}</td>
                                            <td className="text-slate-600 font-bold text-xs">{p.gst_purchase}%</td>
                                            <td className="text-slate-600 font-bold text-xs">{p.gst_sales}%</td>
                                            <td className={`text-[10px] font-black uppercase ${p.serve_types?.dine_in ? 'text-emerald-500' : 'text-slate-300'}`}>{p.serve_types?.dine_in ? 'YES' : 'NO'}</td>
                                            <td className={`text-[10px] font-black uppercase ${p.serve_types?.pickup ? 'text-emerald-500' : 'text-slate-300'}`}>{p.serve_types?.pickup ? 'YES' : 'NO'}</td>
                                            <td className={`text-[10px] font-black uppercase ${p.serve_types?.delivery ? 'text-emerald-500' : 'text-slate-300'}`}>{p.serve_types?.delivery ? 'YES' : 'NO'}</td>
                                            <td className={`text-[10px] font-black uppercase ${p.serve_types?.party_order ? 'text-emerald-500' : 'text-slate-300'}`}>{p.serve_types?.party_order ? 'YES' : 'NO'}</td>
                                            <td className="text-slate-600 font-black text-xs text-center">{p.opening_stock}</td>
                                            <td className="font-black text-emerald-600 text-xs text-center">₹{p.stock_value}</td>
                                            <td className="text-slate-500 font-black text-xs text-center">{p.max_stock}</td>
                                            <td className="text-slate-500 font-black text-xs text-center">{p.min_stock}</td>
                                            <td className="text-rose-400 font-black text-xs text-center">{p.reorder_level}</td>
                                            <td className="text-rose-600 font-black text-xs text-center">{p.urgent_order_level}</td>
                                            <td>
                                                <div className="flex flex-wrap gap-1 max-w-[300px]">
                                                    {p.variations?.map((v, i) => (
                                                        <span key={i} className="text-[9px] font-black uppercase bg-slate-100 text-slate-700 px-2 py-1.5 rounded-none border border-slate-200">{v.name} (+₹{v.amount})</span>
                                                    )) || <span className="text-slate-200">No Variations</span>}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex flex-wrap gap-1 max-w-[300px]">
                                                    {p.addons?.map((a, i) => (
                                                        <span key={i} className="text-[9px] font-black uppercase bg-indigo-50 text-indigo-600 px-2 py-1.5 rounded-none border border-indigo-100">{a.name} (₹{a.rate})</span>
                                                    )) || <span className="text-slate-200">No Addons</span>}
                                                </div>
                                            </td>
                                            <td className="text-[10px] font-black text-indigo-500 uppercase">{p.available_timings?.[0]?.enabled ? p.available_timings[0].start_time : '-'}</td>
                                            <td className="text-[10px] font-black text-indigo-500 uppercase">{p.available_timings?.[0]?.enabled ? p.available_timings[0].end_time : '-'}</td>
                                            <td className="text-[10px] font-black text-indigo-500 uppercase">{p.available_timings?.[1]?.enabled ? p.available_timings[1].start_time : '-'}</td>
                                            <td className="text-[10px] font-black text-indigo-500 uppercase">{p.available_timings?.[1]?.enabled ? p.available_timings[1].end_time : '-'}</td>
                                            <td className="text-[10px] font-black text-indigo-500 uppercase">{p.available_timings?.[2]?.enabled ? p.available_timings[2].start_time : '-'}</td>
                                            <td className="text-[10px] font-black text-indigo-500 uppercase">{p.available_timings?.[2]?.enabled ? p.available_timings[2].end_time : '-'}</td>
                                            <td>
                                                <span className={`badge-premium ${p.is_active ? 'active' : 'disabled'} !text-[10px] font-black tracking-[0.2em]`}>
                                                    {p.is_active ? 'OPERATIONAL' : 'DEACTIVATED'}
                                                </span>
                                            </td>
                                            <td className="sticky-col right-0 group-hover:bg-slate-50" style={{ background: !p.is_active ? '#f8fafc' : 'white', zIndex: 10 }}>
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => p.is_active && handleEdit(p)} className={`action-icon-btn edit shadow-sm scale-75 ${!p.is_active ? 'cursor-not-allowed opacity-30 shadow-none' : ''}`} disabled={!p.is_active}><Edit size={18} /></button>
                                                    <button onClick={() => handleDelete(p._id)} className={`action-icon-btn delete shadow-sm scale-75 ${!p.is_active ? 'cursor-not-allowed opacity-30 shadow-none' : ''}`} disabled={!p.is_active}><Trash size={18} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <section className="inline-form-panel relative">
                        <button onClick={() => { resetForm(); setShowDrawer(false); }} className="absolute right-2 top-2 z-50 w-8 h-8 rounded-full bg-white border border-slate-200 shadow-sm hover:bg-slate-100 flex items-center justify-center transition-all">
                            <X size={18} className="text-slate-600 hover:text-slate-900" />
                        </button>
                        <div className="inline-form-panel-body !p-1 pt-4">
                            {error && (
                                <div className="bg-rose-50 border border-rose-200 p-4 rounded-none flex items-center gap-3 text-rose-700 font-medium text-sm mb-6 shadow-sm">
                                    <AlertCircle size={20} />
                                    {error}
                                </div>
                            )}
                            <form id="product-form" ref={formRef} onKeyDown={handleKeyDown} onSubmit={(e) => { e.preventDefault(); handleFormSubmitRequest(); }} className="mx-auto w-full max-w-full">
                                <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden px-4 py-2">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-2">

                                        {/* LEFT COLUMN */}
                                        <div className="flex flex-col gap-3">



                                            <div className="flex items-center">
                                                <label className="w-1/3 text-sm font-semibold text-[#0F172A]">Barcode</label>
                                                <div className="w-2/3">
                                                    <input type="text" name="barcode" className="w-full px-2 py-1.5 bg-white border-2 border-slate-300 rounded-sm text-sm text-[#0F172A] outline-none hover:border-[#0F172A] focus:border-[#0F172A] transition-colors" value={formData.barcode} onChange={handleInputChange} />
                                                </div>
                                            </div>

                                            <div className="flex items-center">
                                                <label className="w-1/3 text-sm font-semibold text-[#0F172A]">Item Name <span className="text-[#0F172A]">*</span></label>
                                                <div className="w-2/3">
                                                    <input type="text" name="name" required className="w-full px-2 py-1.5 bg-white border-2 border-slate-300 rounded-sm text-sm text-[#0F172A] outline-none hover:border-[#0F172A] focus:border-[#0F172A] transition-colors" value={formData.name} onChange={handleInputChange} />
                                                </div>
                                            </div>

                                            <div className="flex items-center">
                                                <label className="w-1/3 text-sm font-semibold text-[#0F172A]">Group <span className="text-[#0F172A]">*</span></label>
                                                <div className="w-2/3 flex items-center gap-1">
                                                    <select name="category" required className="flex-1 px-2 py-1.5 bg-white border-2 border-slate-300 rounded-sm text-sm text-[#0F172A] outline-none hover:border-[#0F172A] focus:border-[#0F172A] transition-colors" value={formData.category} onChange={handleInputChange}>
                                                        <option value="">Choose Class</option>
                                                        {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                                                    </select>
                                                    <button type="button" onClick={() => setShowGroupModal(true)} className="text-[#0F172A] bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-sm px-2 py-1.5 transition-colors font-bold">+</button>
                                                </div>
                                            </div>

                                            <div className="flex items-center">
                                                <label className="w-1/3 text-sm font-semibold text-[#0F172A]">Brand</label>
                                                <div className="w-2/3 flex items-center gap-1">
                                                    <select name="brand" className="flex-1 px-2 py-1.5 bg-white border-2 border-slate-300 rounded-sm text-sm text-[#0F172A] outline-none hover:border-[#0F172A] focus:border-[#0F172A] transition-colors" value={formData.brand} onChange={handleInputChange}>
                                                        <option value="">Generic</option>
                                                        {brands.map(b => <option key={b._id} value={b.name}>{b.name}</option>)}
                                                    </select>
                                                    <button type="button" onClick={() => setShowBrandModal(true)} className="text-[#0F172A] bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-sm px-2 py-1.5 transition-colors font-bold">+</button>
                                                </div>
                                            </div>

                                            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-wider mt-1 mb-0 border-b border-slate-100 pb-0.5">Tax Details</h4>

                                            <div className="flex items-center">
                                                <label className="w-1/3 text-sm font-semibold text-[#0F172A]">GST Sale</label>
                                                <div className="w-2/3">
                                                    <input type="text" inputMode="decimal" name="gst_sales" className="w-full px-2 py-1.5 bg-white border-2 border-slate-300 rounded-sm text-sm text-[#0F172A] outline-none hover:border-[#0F172A] focus:border-[#0F172A] transition-colors" value={formData.gst_sales || ''} onChange={handleInputChange} />
                                                </div>
                                            </div>

                                            <div className="flex items-center">
                                                <label className="w-1/3 text-sm font-semibold text-[#0F172A]">GST Purchase</label>
                                                <div className="w-2/3">
                                                    <input type="text" inputMode="decimal" name="gst_purchase" className="w-full px-2 py-1.5 bg-white border-2 border-slate-300 rounded-sm text-sm text-[#0F172A] outline-none hover:border-[#0F172A] focus:border-[#0F172A] transition-colors" value={formData.gst_purchase || ''} onChange={handleInputChange} />
                                                </div>
                                            </div>

                                            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-wider mt-1 mb-0 border-b border-slate-100 pb-0.5">Rate Details</h4>

                                            <div className="flex items-center">
                                                <label className="w-1/3 text-sm font-semibold text-[#0F172A]">Purchase</label>
                                                <div className="w-2/3">
                                                    <input type="text" inputMode="decimal" name="purchase_price" className="w-full px-2 py-1.5 bg-white border-2 border-slate-300 rounded-sm text-sm text-[#0F172A] outline-none hover:border-[#0F172A] focus:border-[#0F172A] transition-colors" value={formData.purchase_price} onChange={handleInputChange} />
                                                </div>
                                            </div>

                                            <div className="flex items-center">
                                                <label className="w-1/3 text-sm font-semibold text-[#0F172A]">Cost Rate</label>
                                                <div className="w-2/3">
                                                    <input type="text" inputMode="decimal" name="cost_price" className="w-full px-2 py-1.5 bg-white border-2 border-slate-300 rounded-sm text-sm text-[#0F172A] outline-none hover:border-[#0F172A] focus:border-[#0F172A] transition-colors shadow-sm" value={formData.cost_price} onChange={handleInputChange} />
                                                </div>
                                            </div>

                                            <div className="flex items-center">
                                                <label className="w-1/3 text-sm font-semibold text-[#0F172A]">Item Image</label>
                                                <div className="w-2/3 flex items-center gap-4">
                                                    {formData.image ? (
                                                        <div className="relative w-16 h-16 border-2 border-slate-300 rounded-sm overflow-hidden group">
                                                            <img src={`${import.meta.env.VITE_API_URL.replace('/api', '')}${formData.image}`} alt="Item" className="w-full h-full object-cover" />
                                                            <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center cursor-pointer" onClick={() => document.getElementById('image-upload').click()}>
                                                                <ImageIcon size={16} className="text-white" />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="w-16 h-16 border-2 border-dashed border-slate-300 rounded-sm flex items-center justify-center cursor-pointer hover:border-[#0F172A] transition-colors bg-slate-50" onClick={() => document.getElementById('image-upload').click()}>
                                                            <ImageIcon size={20} className="text-slate-400 hover:text-[#0F172A] transition-colors" />
                                                        </div>
                                                    )}
                                                    <input id="image-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                                                    <div className="text-xs text-slate-500">
                                                        {uploading ? 'Uploading...' : 'Click to upload'}
                                                    </div>
                                                </div>
                                            </div>

                                        </div>

                                        {/* RIGHT COLUMN */}
                                        <div className="flex flex-col gap-3">


                                            <div className="flex items-center">
                                                <label className="w-1/3 text-sm font-semibold text-[#0F172A]">Code</label>
                                                <div className="w-2/3 relative">
                                                    <input type="text" name="code" className="w-full pl-2 pr-24 py-1.5 bg-white border-2 border-slate-300 rounded-sm text-sm text-[#0F172A] outline-none hover:border-[#0F172A] focus:border-[#0F172A] transition-colors" value={formData.code} onChange={handleInputChange} placeholder="Enter Code" />
                                                    <button type="button" className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#0F172A] bg-white px-2 py-0.5 rounded border border-slate-300 hover:border-[#0F172A] hover:bg-slate-50 transition-colors">ASSIGN CODE</button>
                                                </div>
                                            </div>

                                            <div className="flex items-center">
                                                <label className="w-1/3 text-sm font-semibold text-[#0F172A]">Print Name</label>
                                                <div className="w-2/3">
                                                    <input type="text" name="print_name" className="w-full px-2 py-1.5 bg-white border-2 border-slate-300 rounded-sm text-sm text-[#0F172A] outline-none hover:border-[#0F172A] focus:border-[#0F172A] transition-colors" value={formData.print_name || ''} onChange={handleInputChange} />
                                                </div>
                                            </div>

                                            <div className="flex items-center">
                                                <label className="w-1/3 text-sm font-semibold text-[#0F172A]">HSN Code</label>
                                                <div className="w-2/3">
                                                    <input type="text" name="hsn_code" className="w-full px-2 py-1.5 bg-white border-2 border-slate-300 rounded-sm text-sm text-[#0F172A] outline-none hover:border-[#0F172A] focus:border-[#0F172A] transition-colors" value={formData.hsn_code} onChange={handleInputChange} />
                                                </div>
                                            </div>

                                            <div className="flex items-center">
                                                <label className="w-1/3 text-sm font-semibold text-[#0F172A]">Unit</label>
                                                <div className="w-2/3 flex items-center gap-1">
                                                    <select name="unit" className="flex-1 px-2 py-1.5 bg-white border-2 border-slate-300 rounded-sm text-sm text-[#0F172A] outline-none hover:border-[#0F172A] focus:border-[#0F172A] transition-colors uppercase" value={formData.unit} onChange={handleInputChange}>
                                                        <option value="">Select Unit</option>
                                                        {units.map(u => <option key={u._id} value={u.name}>{u.name}</option>)}
                                                    </select>
                                                    <button type="button" onClick={() => setShowUnitModal(true)} className="text-[#0F172A] bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-sm px-2 py-1.5 transition-colors font-bold">+</button>
                                                </div>
                                            </div>

                                            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-wider mt-1 mb-0 border-b border-slate-100 pb-0.5 opacity-0 pointer-events-none select-none">Tax Space</h4>

                                            <div className="flex items-center">
                                                <label className="w-1/3 text-sm font-semibold text-[#0F172A]">IGST Sale</label>
                                                <div className="w-2/3">
                                                    <input type="text" inputMode="decimal" name="igst_sales" className="w-full px-2 py-1.5 bg-white border-2 border-slate-300 rounded-sm text-sm text-[#0F172A] outline-none hover:border-[#0F172A] focus:border-[#0F172A] transition-colors" value={formData.igst_sales || ''} onChange={handleInputChange} />
                                                </div>
                                            </div>

                                            <div className="flex items-center">
                                                <label className="w-1/3 text-sm font-semibold text-[#0F172A]">IGST Purchase</label>
                                                <div className="w-2/3">
                                                    <input type="text" inputMode="decimal" name="igst_purchase" className="w-full px-2 py-1.5 bg-white border-2 border-slate-300 rounded-sm text-sm text-[#0F172A] outline-none hover:border-[#0F172A] focus:border-[#0F172A] transition-colors" value={formData.igst_purchase || ''} onChange={handleInputChange} />
                                                </div>
                                            </div>

                                            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-wider mt-1 mb-0 border-b border-slate-100 pb-0.5 opacity-0 pointer-events-none select-none">Rate Space</h4>

                                            <div className="flex items-center">
                                                <label className="w-1/3 text-sm font-semibold text-[#0F172A]">Sale Rate <span className="text-[#0F172A]">*</span></label>
                                                <div className="w-2/3">
                                                    <input type="text" inputMode="decimal" name="selling_price" required className="w-full px-2 py-1.5 bg-white border-2 border-slate-300 rounded-sm text-sm text-[#0F172A] outline-none hover:border-[#0F172A] focus:border-[#0F172A] transition-colors shadow-sm" value={formData.selling_price} onChange={handleInputChange} />
                                                </div>
                                            </div>

                                            <div className="flex items-center">
                                                <label className="w-1/3 text-sm font-semibold text-[#0F172A]">MRP Rate</label>
                                                <div className="w-2/3">
                                                    <input type="text" inputMode="decimal" name="mrp" className="w-full px-2 py-1.5 bg-white border-2 border-slate-300 rounded-sm text-sm text-[#0F172A] outline-none hover:border-[#0F172A] focus:border-[#0F172A] transition-colors" value={formData.mrp} onChange={handleInputChange} />
                                                </div>
                                            </div>





                                        </div>




                                        {/* BOTTOM TAB BUTTONS */}
                                        <div className="col-span-1 lg:col-span-2 mt-4 pt-4 border-t border-slate-200">
                                            <div className="flex flex-wrap gap-2 mb-4">
                                                {hasModuleAccess('stock_level') && (
                                                    <button type="button" onClick={() => toggleSection('inventory')} className={`px-4 py-2 text-sm font-bold rounded transition-colors ${expandedSections.inventory ? 'bg-indigo-50 text-indigo-700 border-2 border-indigo-200' : 'bg-slate-50 text-slate-600 border-2 border-slate-200 hover:bg-slate-100'}`}>Stock Levels</button>
                                                )}
                                                <button type="button" onClick={() => toggleSection('otherInfo')} className={`px-4 py-2 text-sm font-bold rounded transition-colors ${expandedSections.otherInfo ? 'bg-indigo-50 text-indigo-700 border-2 border-indigo-200' : 'bg-slate-50 text-slate-600 border-2 border-slate-200 hover:bg-slate-100'}`}>Other Info</button>
                                                <button type="button" onClick={() => toggleSection('variations')} className={`px-4 py-2 text-sm font-bold rounded transition-colors ${expandedSections.variations ? 'bg-indigo-50 text-indigo-700 border-2 border-indigo-200' : 'bg-slate-50 text-slate-600 border-2 border-slate-200 hover:bg-slate-100'}`}>Variations</button>
                                                <button type="button" onClick={() => toggleSection('addons')} className={`px-4 py-2 text-sm font-bold rounded transition-colors ${expandedSections.addons ? 'bg-indigo-50 text-indigo-700 border-2 border-indigo-200' : 'bg-slate-50 text-slate-600 border-2 border-slate-200 hover:bg-slate-100'}`}>Add-ons</button>
                                            </div>

                                            {/* TAB CONTENT */}
                                            {(expandedSections.inventory || expandedSections.otherInfo || expandedSections.variations || expandedSections.addons) && (
                                                <div className="bg-slate-50 p-4 rounded-md border border-slate-200 shadow-inner">
                                                    {expandedSections.inventory && hasModuleAccess('stock_level') && (
                                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                            <div className="flex flex-col gap-3">
                                                                <div className="flex items-center">
                                                                    <label className="w-1/3 text-sm font-semibold text-[#0F172A]">Min Stock</label>
                                                                    <div className="w-2/3">
                                                                        <input type="text" inputMode="decimal" name="min_stock" className="w-full px-2 py-1.5 bg-white border-2 border-slate-300 rounded-sm text-sm text-[#0F172A] outline-none hover:border-[#0F172A] focus:border-[#0F172A] transition-colors" value={formData.min_stock} onChange={handleInputChange} />
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center">
                                                                    <label className="w-1/3 text-sm font-semibold text-[#0F172A]">Max Stock</label>
                                                                    <div className="w-2/3">
                                                                        <input type="text" inputMode="decimal" name="max_stock" className="w-full px-2 py-1.5 bg-white border-2 border-slate-300 rounded-sm text-sm text-[#0F172A] outline-none hover:border-[#0F172A] focus:border-[#0F172A] transition-colors" value={formData.max_stock} onChange={handleInputChange} />
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center">
                                                                    <label className="w-1/3 text-sm font-semibold text-[#0F172A]">Re-order Level</label>
                                                                    <div className="w-2/3">
                                                                        <input type="text" inputMode="decimal" name="reorder_level" className="w-full px-2 py-1.5 bg-white border-2 border-slate-300 rounded-sm text-sm text-[#0F172A] outline-none hover:border-[#0F172A] focus:border-[#0F172A] transition-colors" value={formData.reorder_level} onChange={handleInputChange} />
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center">
                                                                    <label className="w-1/3 text-sm font-semibold text-[#0F172A]">Crisis Level</label>
                                                                    <div className="w-2/3">
                                                                        <input type="text" inputMode="decimal" name="urgent_order_level" className="w-full px-2 py-1.5 bg-white border-2 border-slate-300 rounded-sm text-sm text-[#0F172A] outline-none hover:border-[#0F172A] focus:border-[#0F172A] transition-colors" value={formData.urgent_order_level} onChange={handleInputChange} />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {expandedSections.otherInfo && (
                                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                            <div className="flex flex-col gap-3">
                                                                <div className="flex items-center">
                                                                    <label className="w-1/3 text-sm font-semibold text-[#0F172A]">Opening Stock</label>
                                                                    <div className="w-2/3">
                                                                        <input type="text" inputMode="decimal" name="opening_stock" className="w-full px-2 py-1.5 bg-white border-2 border-slate-300 rounded-sm text-sm text-[#0F172A] outline-none hover:border-[#0F172A] focus:border-[#0F172A] transition-colors" value={formData.opening_stock} onChange={handleInputChange} />
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center">
                                                                    <label className="w-1/3 text-sm font-semibold text-[#0F172A]">Stock Value</label>
                                                                    <div className="w-2/3">
                                                                        <input type="text" readOnly className="w-full px-2 py-1.5 bg-slate-50 border-2 border-slate-200 rounded-sm text-sm text-slate-500 outline-none cursor-not-allowed" value={((parseFloat(formData.opening_stock) || 0) * (parseFloat(formData.purchase_price) || parseFloat(formData.cost_price) || 0)).toFixed(2)} />
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center">
                                                                    <label className="w-1/3 text-sm font-semibold text-[#0F172A]">Item Nature</label>
                                                                    <div className="w-2/3">
                                                                        <select name="item_nature" className="w-full px-2 py-1.5 bg-white border-2 border-slate-300 rounded-sm text-sm text-[#0F172A] outline-none hover:border-[#0F172A] focus:border-[#0F172A] transition-colors" value={formData.item_nature} onChange={handleInputChange}>
                                                                            <option value="GOOD">Good</option>
                                                                            <option value="SERVICE">Service</option>
                                                                        </select>
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center">
                                                                    <label className="w-1/3 text-sm font-semibold text-[#0F172A]">Food Type</label>
                                                                    <div className="w-2/3">
                                                                        <select name="food_type" className="w-full px-2 py-1.5 bg-white border-2 border-slate-300 rounded-sm text-sm text-[#0F172A] outline-none hover:border-[#0F172A] focus:border-[#0F172A] transition-colors" value={formData.food_type} onChange={handleInputChange}>
                                                                            <option value="NONE">None</option>
                                                                            <option value="VEG">Veg</option>
                                                                            <option value="NON_VEG">Non-Veg</option>
                                                                        </select>
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center">
                                                                    <div className="flex items-center w-1/2">
                                                                        <label className="w-2/3 text-sm font-semibold text-[#0F172A]">Online Order</label>
                                                                        <div className="w-1/3 flex items-center">
                                                                            <label className="flex items-center cursor-pointer">
                                                                                <input type="checkbox" className="hidden peer" checked={formData.online_order} onChange={(e) => setFormData(p => ({ ...p, online_order: e.target.checked }))} />
                                                                                <div className="w-8 h-4 rounded-full bg-slate-300 peer-checked:bg-[#0F172A] relative transition-all">
                                                                                    <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-all ${formData.online_order ? 'translate-x-4' : ''}`}></span>
                                                                                </div>
                                                                            </label>
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex items-center w-1/2">
                                                                        <label className="w-2/3 text-sm font-semibold text-[#0F172A]">Item Active</label>
                                                                        <div className="w-1/3 flex items-center">
                                                                            <label className="flex items-center cursor-pointer">
                                                                                <input type="checkbox" className="hidden peer" checked={formData.is_active} onChange={(e) => setFormData(p => ({ ...p, is_active: e.target.checked }))} />
                                                                                <div className="w-8 h-4 rounded-full bg-slate-300 peer-checked:bg-[#0F172A] relative transition-all">
                                                                                    <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-all ${formData.is_active ? 'translate-x-4' : ''}`}></span>
                                                                                </div>
                                                                            </label>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {expandedSections.variations && (
                                                        <div className="grid grid-cols-1 gap-4">
                                                            <div className="flex justify-end mb-2">
                                                                <button type="button" onClick={handleAddVariation} className="px-3 py-1 text-xs font-bold text-indigo-600 bg-indigo-50 rounded border border-indigo-200 hover:bg-indigo-100">+ ADD VARIANT</button>
                                                            </div>
                                                            <div className="flex flex-col gap-3 pt-1">
                                                                {formData.variations?.length ? formData.variations.map((v, idx) => (
                                                                    <div key={idx} className="flex items-center gap-2">
                                                                        <input type="text" placeholder="Variant Name (e.g. Medium)" className="w-1/2 px-2 py-1.5 bg-white border-2 border-slate-300 rounded-sm text-xs text-[#0F172A] hover:border-[#0F172A] focus:border-[#0F172A] transition-colors" value={v.name} onChange={(e) => handleVariationChange(idx, 'name', e.target.value)} />
                                                                        <input type="number" placeholder="Additional Rate" className="w-1/3 px-2 py-1.5 bg-white border-2 border-slate-300 rounded-sm text-xs text-[#0F172A] hover:border-[#0F172A] focus:border-[#0F172A] transition-colors" value={v.amount} onChange={(e) => handleVariationChange(idx, 'amount', e.target.value === '' ? '' : parseFloat(e.target.value) || 0)} />
                                                                        <button type="button" onClick={() => handleRemoveVariation(idx)} className="text-[#0F172A] hover:text-slate-600"><Trash2 size={12} /></button>
                                                                    </div>
                                                                )) : <div className="text-xs text-[#0F172A]">No variations configured for this item.</div>}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {expandedSections.addons && (
                                                        <div className="grid grid-cols-1 gap-4">
                                                            <div className="flex justify-end mb-2">
                                                                <button type="button" onClick={handleAddAddon} className="px-3 py-1 text-xs font-bold text-indigo-600 bg-indigo-50 rounded border border-indigo-200 hover:bg-indigo-100">+ ADD ADDON</button>
                                                            </div>
                                                            <div className="flex flex-col gap-3 pt-1">
                                                                {formData.addons?.length ? formData.addons.map((addon, idx) => (
                                                                    <div key={idx} className="flex items-center gap-2">
                                                                        <input type="text" placeholder="Addon Name (e.g. Extra Cheese)" className="w-1/2 px-2 py-1.5 bg-white border-2 border-slate-300 rounded-sm text-xs text-[#0F172A] hover:border-[#0F172A] focus:border-[#0F172A] transition-colors" value={addon.name} onChange={(e) => handleAddonChange(idx, 'name', e.target.value)} />
                                                                        <input type="number" placeholder="Addon Rate" className="w-1/3 px-2 py-1.5 bg-white border-2 border-slate-300 rounded-sm text-xs text-[#0F172A] hover:border-[#0F172A] focus:border-[#0F172A] transition-colors" value={addon.rate} onChange={(e) => handleAddonChange(idx, 'rate', e.target.value === '' ? '' : parseFloat(e.target.value) || 0)} />
                                                                        <button type="button" onClick={() => handleRemoveAddon(idx)} className="text-[#0F172A] hover:text-slate-600"><Trash2 size={12} /></button>
                                                                    </div>
                                                                )) : <div className="text-xs text-[#0F172A]">No addons configured for this item.</div>}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                    </div>
                                </div>
                            </form>
                        </div>
                        <div className="inline-form-panel-footer">
                            <button type="button" onClick={() => { resetForm(); setShowDrawer(false); }} className="btn-premium-outline">Discard</button>
                            <button type="submit" form="product-form" disabled={submitting || uploading} className="btn-premium-primary">
                                {submitting ? <Loader2 className="animate-spin" size={16} /> : (isEditing ? 'Save Changes' : 'Create Item')}
                            </button>
                        </div>
                    </section>
                )}
                <SaveConfirmationModal 
                    isOpen={showSaveConfirm} 
                    onConfirm={confirmSave} 
                    onCancel={cancelSave} 
                />
            </main>

            {/* QUICK CREATION MODALS */}
            {/* Group Modal */}
            {showGroupModal && (
                <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[100]">
                    <div className="bg-white rounded-md shadow-xl w-[400px] overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800">Create New Group</h3>
                            <button onClick={() => setShowGroupModal(false)} className="text-slate-400 hover:text-rose-500"><XCircle size={20} /></button>
                        </div>
                        <form onSubmit={(e) => handleQuickSubmit('group', e)} className="p-4 flex flex-col gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Group Name <span className="text-rose-500">*</span></label>
                                <input type="text" required className="w-full px-3 py-2 border-2 border-slate-200 rounded-sm text-sm focus:border-indigo-500 outline-none" value={quickGroupData.name} onChange={e => setQuickGroupData({ ...quickGroupData, name: e.target.value })} placeholder="e.g. Beverages" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">HSN Code</label>
                                <input type="text" className="w-full px-3 py-2 border-2 border-slate-200 rounded-sm text-sm focus:border-indigo-500 outline-none" value={quickGroupData.hsn_code} onChange={e => setQuickGroupData({ ...quickGroupData, hsn_code: e.target.value })} />
                            </div>
                            <div className="flex justify-end gap-2 mt-2">
                                <button type="button" onClick={() => setShowGroupModal(false)} className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded hover:bg-slate-200">Cancel</button>
                                <button type="submit" className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 rounded hover:bg-indigo-700">Save Group</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Brand Modal */}
            {showBrandModal && (
                <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[100]">
                    <div className="bg-white rounded-md shadow-xl w-[400px] overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800">Create New Brand</h3>
                            <button onClick={() => setShowBrandModal(false)} className="text-slate-400 hover:text-rose-500"><XCircle size={20} /></button>
                        </div>
                        <form onSubmit={(e) => handleQuickSubmit('brand', e)} className="p-4 flex flex-col gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Brand Name <span className="text-rose-500">*</span></label>
                                <input type="text" required className="w-full px-3 py-2 border-2 border-slate-200 rounded-sm text-sm focus:border-indigo-500 outline-none" value={quickBrandData.name} onChange={e => setQuickBrandData({ ...quickBrandData, name: e.target.value })} placeholder="e.g. Coca Cola" />
                            </div>
                            <div className="flex justify-end gap-2 mt-2">
                                <button type="button" onClick={() => setShowBrandModal(false)} className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded hover:bg-slate-200">Cancel</button>
                                <button type="submit" className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 rounded hover:bg-indigo-700">Save Brand</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Unit Modal */}
            {showUnitModal && (
                <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[100]">
                    <div className="bg-white rounded-md shadow-xl w-[400px] overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800">Create New Unit</h3>
                            <button onClick={() => setShowUnitModal(false)} className="text-slate-400 hover:text-rose-500"><XCircle size={20} /></button>
                        </div>
                        <form onSubmit={(e) => handleQuickSubmit('unit', e)} className="p-4 flex flex-col gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Unit Name <span className="text-rose-500">*</span></label>
                                <input type="text" required className="w-full px-3 py-2 border-2 border-slate-200 rounded-sm text-sm focus:border-indigo-500 outline-none" value={quickUnitData.name} onChange={e => setQuickUnitData({ ...quickUnitData, name: e.target.value })} placeholder="e.g. KGS, PCS" />
                            </div>
                            <div>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" className="w-4 h-4 text-indigo-600 rounded border-slate-300" checked={quickUnitData.accept_decimal} onChange={e => setQuickUnitData({ ...quickUnitData, accept_decimal: e.target.checked })} />
                                    <span className="text-xs font-bold text-slate-700">Accept Decimals (e.g., 0.500)</span>
                                </label>
                            </div>
                            <div className="flex justify-end gap-2 mt-2">
                                <button type="button" onClick={() => setShowUnitModal(false)} className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded hover:bg-slate-200">Cancel</button>
                                <button type="submit" className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 rounded hover:bg-indigo-700">Save Unit</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Tax Modal */}
            {showTaxModal && (
                <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[100]">
                    <div className="bg-white rounded-md shadow-xl w-[400px] overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800">Create New Tax</h3>
                            <button onClick={() => setShowTaxModal(false)} className="text-slate-400 hover:text-rose-500"><XCircle size={20} /></button>
                        </div>
                        <form onSubmit={(e) => handleQuickSubmit('tax', e)} className="p-4 flex flex-col gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Tax Name <span className="text-rose-500">*</span></label>
                                <input type="text" required className="w-full px-3 py-2 border-2 border-slate-200 rounded-sm text-sm focus:border-indigo-500 outline-none" value={quickTaxData.name} onChange={e => setQuickTaxData({ ...quickTaxData, name: e.target.value })} placeholder="e.g. GST 18%" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Percentage <span className="text-rose-500">*</span></label>
                                <input type="number" required step="0.01" className="w-full px-3 py-2 border-2 border-slate-200 rounded-sm text-sm focus:border-indigo-500 outline-none" value={quickTaxData.percentage} onChange={e => setQuickTaxData({ ...quickTaxData, percentage: e.target.value === '' ? '' : parseFloat(e.target.value) || 0 })} />
                            </div>
                            <div className="flex justify-end gap-2 mt-2">
                                <button type="button" onClick={() => setShowTaxModal(false)} className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded hover:bg-slate-200">Cancel</button>
                                <button type="submit" className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 rounded hover:bg-indigo-700">Save Tax</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductMaster;

