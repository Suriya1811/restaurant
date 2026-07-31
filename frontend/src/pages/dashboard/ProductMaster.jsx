import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';
import DashboardPageShell from '../../components/dashboard/DashboardPageShell';
import ActionDropdown from '../../components/dashboard/ActionDropdown';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
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
    X,
    Settings,
    RotateCcw,
    FileText,
    Puzzle,
    Save
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
    const [units, setUnits] = useState([]);
    const [taxes, setTaxes] = useState([]);

    // Filters
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [selectedBrand, setSelectedBrand] = useState('ALL');
    const [selectedActiveStatus, setSelectedActiveStatus] = useState('ALL');

    // Column Settings Panel
    const [showColumnSettings, setShowColumnSettings] = useState(false);
    const defaultVisibleColumns = {
        code: true,
        barcode: true,
        name: true,
        print_name: true,
        category: true,
        brand: true,
        unit: true,
        hsn_code: true,
        purchase_price: true,
        cost_price: true,
        selling_price: true,
        mrp: true,
        opening_stock: true,
        stock_value: true,
        gst_sales: true,
        gst_purchase: true,
        igst_sales: true,
        igst_purchase: true,
        action: true
    };
    const [visibleColumns, setVisibleColumns] = useState(() => {
        const saved = localStorage.getItem('productVisibleColumns');
        return saved ? JSON.parse(saved) : defaultVisibleColumns;
    });
    const [tempVisibleColumns, setTempVisibleColumns] = useState(visibleColumns);

    // Bottom Popovers
    const [activePopover, setActivePopover] = useState(null); // 'variations', 'otherInfo', 'addons'

    // Confirmation Modals & Quick Add Modal State
    const [showSaveConfirm, setShowSaveConfirm] = useState(false);
    const [showGroupModal, setShowGroupModal] = useState(false);
    const [showBrandModal, setShowBrandModal] = useState(false);
    const [showUnitModal, setShowUnitModal] = useState(false);
    const [showTaxModal, setShowTaxModal] = useState(false);

    // Quick Creation Form Data
    const [quickGroupData, setQuickGroupData] = useState({ name: '', description: '', hsn_code: '' });
    const [quickBrandData, setQuickBrandData] = useState({ name: '', description: '' });
    const [quickUnitData, setQuickUnitData] = useState({ name: '', description: '', accept_decimal: false });
    const [quickTaxData, setQuickTaxData] = useState({ name: '', percentage: 0 });

    const fileInputRef = useRef(null);
    const imageUploadInputRef = useRef(null);
    const inputRefs = useRef({});

    // Navigation Sequence
    const NAVIGATION_SEQUENCE = [
        'barcode',
        'name',
        'category',
        'hsn_code',
        'code',
        'print_name',
        'brand',
        'unit',
        'purchase_price',
        'cost_price',
        'selling_price',
        'mrp',
        'gst_sales',
        'igst_sales',
        'gst_purchase',
        'igst_purchase',
        'opening_stock',
        'stock_value',
        'max_stock',
        'min_stock',
        'reorder_level',
        'urgent_order_level'
    ];

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
        purchase_price: '',
        cost_price: '',
        selling_price: '',
        mrp: '',
        gst_sales: '',
        gst_purchase: '',
        igst_sales: '',
        igst_purchase: '',
        hsn_code: '',
        tax_id: '',
        unit: '',
        opening_stock: '',
        min_stock: '',
        max_stock: '',
        reorder_level: '',
        urgent_order_level: '',
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

    // Selection & Bulk Action State
    const [selectedIds, setSelectedIds] = useState([]);
    const [showBulkMenu, setShowBulkMenu] = useState(false);

    const toggleSelectAll = () => {
        const currentIds = filteredProducts.map(p => p._id || p.id);
        const allSelected = currentIds.every(id => selectedIds.includes(id));
        if (allSelected) {
            setSelectedIds(prev => prev.filter(id => !currentIds.includes(id)));
        } else {
            setSelectedIds(prev => Array.from(new Set([...prev, ...currentIds])));
        }
    };

    const toggleSelectOne = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const handleBulkAction = async (actionType) => {
        if (selectedIds.length === 0) {
            alert("Please select at least one record.");
            return;
        }

        if (actionType === 'DELETE') {
            if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} selected item(s)?`)) return;
            let blockedMessages = [];
            for (const id of selectedIds) {
                try {
                    const res = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/products/${id}`, { method: 'DELETE' });
                    const data = await res.json();
                    if (!res.ok || !data.success) {
                        if (data.message || data.error) blockedMessages.push(data.message || data.error);
                    }
                } catch (err) { }
            }
            if (blockedMessages.length > 0) {
                alert(blockedMessages[0]);
            }
            fetchData();
        } else if (actionType === 'ACTIVATE') {
            for (const id of selectedIds) {
                try {
                    await fetchWithAuth(`${import.meta.env.VITE_API_URL}/products/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ is_active: true })
                    });
                } catch (err) { }
            }
            setProducts(prev => prev.map(x => selectedIds.includes(x._id || x.id) ? { ...x, is_active: true } : x));
        } else if (actionType === 'DEACTIVATE') {
            for (const id of selectedIds) {
                try {
                    await fetchWithAuth(`${import.meta.env.VITE_API_URL}/products/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ is_active: false })
                    });
                } catch (err) { }
            }
            setProducts(prev => prev.map(x => selectedIds.includes(x._id || x.id) ? { ...x, is_active: false } : x));
        } else if (actionType === 'CANCEL') {
            if (!window.confirm(`Are you sure you want to cancel ${selectedIds.length} selected item(s)?`)) return;
            for (const id of selectedIds) {
                try {
                    await fetchWithAuth(`${import.meta.env.VITE_API_URL}/products/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ is_cancelled: true, is_active: false })
                    });
                } catch (err) { }
            }
            setProducts(prev => prev.map(x => selectedIds.includes(x._id || x.id) ? { ...x, is_cancelled: true, is_active: false } : x));
        }

        setSelectedIds([]);
        setShowBulkMenu(false);
    };

    const fetchData = async () => {
        try {
            setLoading(true);
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

    // Autofocus on Barcode when drawer opens
    useEffect(() => {
        if (showDrawer) {
            setActivePopover(null);
            setTimeout(() => {
                const barcodeEl = inputRefs.current['barcode'];
                if (barcodeEl) {
                    barcodeEl.focus();
                    if (barcodeEl.select) barcodeEl.select();
                }
            }, 150);
        }
    }, [showDrawer]);

    // Validation
    const validateForm = () => {
        if (!formData.name?.trim()) return 'Item Name is required';
        if (!formData.category) return 'Group (Category) is required';
        if (!formData.brand) return 'Brand is required';
        if (!formData.unit) return 'Unit is required';
        if (formData.gst_sales === '' || formData.gst_sales === undefined) return 'GST Sale % is required';
        if (formData.gst_purchase === '' || formData.gst_purchase === undefined) return 'GST Purchase % is required';
        if (formData.igst_sales === '' || formData.igst_sales === undefined) return 'IGST Sale % is required';
        if (formData.igst_purchase === '' || formData.igst_purchase === undefined) return 'IGST Purchase % is required';
        return null;
    };

    const handleFormSubmitRequest = () => {
        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            alert(validationError);
            return;
        }
        setError('');
        setShowSaveConfirm(true);
    };

    const confirmSave = () => {
        setShowSaveConfirm(false);
        handleSubmit();
    };

    const cancelSave = () => {
        setShowSaveConfirm(false);
    };

    // Keyboard navigation forward and backward
    const handleFormKeyDown = (e, fieldName) => {
        const currentIndex = NAVIGATION_SEQUENCE.indexOf(fieldName);
        if (currentIndex === -1) return;

        if (e.key === 'Enter') {
            e.preventDefault();
            // If it is the last item
            if (currentIndex === NAVIGATION_SEQUENCE.length - 1) {
                handleFormSubmitRequest();
            } else {
                // Find next visible & editable input
                let nextIdx = currentIndex + 1;
                let found = false;
                while (nextIdx < NAVIGATION_SEQUENCE.length) {
                    const nextField = NAVIGATION_SEQUENCE[nextIdx];
                    const nextEl = inputRefs.current[nextField];
                    if (nextEl && !nextEl.readOnly && !nextEl.disabled) {
                        nextEl.focus();
                        if (nextEl.select) nextEl.select();
                        found = true;
                        break;
                    }
                    nextIdx++;
                }
                // If not found, trigger save
                if (!found) {
                    handleFormSubmitRequest();
                }
            }
        } else if (e.key === 'Backspace') {
            let isCursorAtStart = false;
            try {
                if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') && typeof e.target.selectionStart === 'number') {
                    isCursorAtStart = e.target.selectionStart === 0 && e.target.selectionEnd === 0;
                }
            } catch (err) {
                isCursorAtStart = false;
            }
            if (isCursorAtStart && currentIndex > 0) {
                e.preventDefault();
                let prevIdx = currentIndex - 1;
                while (prevIdx >= 0) {
                    const prevField = NAVIGATION_SEQUENCE[prevIdx];
                    const prevEl = inputRefs.current[prevField];
                    if (prevEl && !prevEl.readOnly && !prevEl.disabled) {
                        prevEl.focus();
                        if (prevEl.select) prevEl.select();
                        break;
                    }
                    prevIdx--;
                }
            }
        }
    };

    // Input changes
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: checked }));
            return;
        }

        if (name === 'category') {
            const selectedCat = categories.find(c => c.name === value);
            setFormData(prev => ({
                ...prev,
                [name]: value,
                hsn_code: selectedCat?.hsn_code || ''
            }));
            return;
        }

        const numberFields = [
            'purchase_price', 'cost_price', 'selling_price', 'mrp',
            'opening_stock', 'min_stock', 'max_stock', 'reorder_level', 'urgent_order_level'
        ];

        if (numberFields.includes(name)) {
            const sanitizedValue = value.replace(/[^0-9.]/g, '');
            const parts = sanitizedValue.split('.');
            if (parts.length > 2) return;

            setFormData(prev => {
                const nextState = { ...prev, [name]: sanitizedValue };
                // Live computed stock value sync
                if (name === 'purchase_price' || name === 'opening_stock') {
                    const pur = parseFloat(name === 'purchase_price' ? sanitizedValue : prev.purchase_price) || 0;
                    const op = parseFloat(name === 'opening_stock' ? sanitizedValue : prev.opening_stock) || 0;
                    nextState.stock_value = (pur * op).toFixed(2);
                }
                return nextState;
            });
            return;
        }

        // Tax dropdown overrides (GST/IGST Sale/Purchase)
        const taxFields = ['gst_sales', 'gst_purchase', 'igst_sales', 'igst_purchase'];
        if (taxFields.includes(name)) {
            setFormData(prev => ({ ...prev, [name]: value }));
            return;
        }

        setFormData(prev => {
            const nextState = { ...prev, [name]: value };
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

    // Addons Handlers
    const handleAddAddon = () => {
        setFormData(prev => ({ ...prev, addons: [...prev.addons, { name: '', rate: '' }] }));
    };

    const handleAddonChange = (index, field, value) => {
        const newAddons = [...formData.addons];
        newAddons[index][field] = value;
        setFormData(prev => ({ ...prev, addons: newAddons }));
    };

    const handleRemoveAddon = (index) => {
        setFormData(prev => ({ ...prev, addons: prev.addons.filter((_, i) => i !== index) }));
    };

    // Variations Handlers
    const handleAddVariation = () => {
        setFormData(prev => ({ ...prev, variations: [...prev.variations, { name: '', amount: '' }] }));
    };

    const handleVariationChange = (index, field, value) => {
        const newVars = [...formData.variations];
        newVars[index][field] = value;
        setFormData(prev => ({ ...prev, variations: newVars }));
    };

    const handleRemoveVariation = (index) => {
        setFormData(prev => ({ ...prev, variations: prev.variations.filter((_, i) => i !== index) }));
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        setError('');

        try {
            const numberFields = [
                'purchase_price', 'cost_price', 'selling_price', 'mrp',
                'gst_sales', 'gst_purchase', 'igst_sales', 'igst_purchase',
                'opening_stock', 'min_stock', 'max_stock', 'reorder_level', 'urgent_order_level'
            ];

            const sanitizedData = { ...formData };
            numberFields.forEach(f => {
                sanitizedData[f] = parseFloat(sanitizedData[f]) || 0;
            });
            sanitizedData.stock_value = sanitizedData.purchase_price * sanitizedData.opening_stock;

            // Ensure variations and addons numbers are parsed correctly
            sanitizedData.variations = formData.variations.map(v => ({ name: v.name, amount: parseFloat(v.amount) || 0 }));
            sanitizedData.addons = formData.addons.map(a => ({ name: a.name, rate: parseFloat(a.rate) || 0 }));

            // Clean up empty ObjectIds to prevent BSONError
            ['category', 'brand', 'tax_id', 'unit'].forEach(f => {
                if (sanitizedData[f] === '') {
                    sanitizedData[f] = null;
                }
            });

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

            alert(isEditing ? 'Item updated successfully!' : 'New Item created successfully in Master!');
            fetchData();
            resetForm();
            setTimeout(() => {
                const firstField = inputRefs.current['barcode'] || inputRefs.current['code'] || inputRefs.current['name'];
                if (firstField) firstField.focus();
            }, 100);
        } catch (err) {
            setError(err.message);
            alert("Error: " + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        const fData = new FormData();
        fData.append('image', file);
        try {
            const response = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/products/upload`, {
                method: 'POST',
                body: fData
            });
            const result = await response.json();
            if (result.success) {
                setFormData(prev => ({ ...prev, image: result.data }));
                alert("Image uploaded successfully!");
            } else {
                throw new Error(result.message || 'Unknown upload error');
            }
        } catch (err) {
            console.error("Upload Error:", err);
            alert('Upload failed: ' + err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleEdit = (product) => {
        const numFields = [
            'purchase_price', 'cost_price', 'selling_price', 'mrp',
            'gst_sales', 'gst_purchase', 'igst_sales', 'igst_purchase',
            'opening_stock', 'min_stock', 'max_stock', 'reorder_level', 'urgent_order_level'
        ];
        const productAsStrings = { ...product };
        numFields.forEach(f => {
            const v = product[f];
            productAsStrings[f] = (v === 0 || v === null || v === undefined) ? '' : String(v);
        });

        // Set variations and addons values as strings to avoid stuck at 0
        const vars = (product.variations || []).map(v => ({ name: v.name, amount: String(v.amount) }));
        const ads = (product.addons || []).map(a => ({ name: a.name, rate: String(a.rate) }));

        setFormData({
            ...initialFormState,
            ...productAsStrings,
            variations: vars,
            addons: ads,
            tax_id: product.tax_id?._id || product.tax_id || '',
            serve_types: product.serve_types || initialFormState.serve_types
        });
        setIsEditing(true);
        setShowDrawer(true);
    };

    const handleDelete = async (product) => {
        const id = product._id || product.id;
        if (!window.confirm("Delete this master item?")) return;
        try {
            const res = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/products/${id}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                alert(data.message || data.error || "Cannot delete record because it is used in transaction history.");
            }
            fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    const handleToggleStatus = async (product, nextStatus) => {
        try {
            const statusToApply = typeof nextStatus === 'boolean' ? nextStatus : !product.is_active;
            await fetchWithAuth(`${import.meta.env.VITE_API_URL}/products/${product._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...product, is_active: statusToApply })
            });
            fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    const resetForm = () => {
        setFormData(initialFormState);
        setIsEditing(false);
        setError('');
        setActivePopover(null);
    };

    const handleClose = () => {
        if (window.confirm('Need to close the tab ( Yes / No ) ?')) {
            setShowDrawer(false);
            resetForm();
        }
    };

    // Exports
    const exportCSV = () => {
        if (!products.length) return;
        const columns = [
            { header: 'Item Code', key: 'code' },
            { header: 'Barcode', key: 'barcode' },
            { header: 'Item Name', key: 'name' },
            { header: 'Print Name', key: 'print_name' },
            { header: 'Category', key: 'category' },
            { header: 'Brand', key: 'brand' },
            { header: 'Unit', key: 'unit' },
            { header: 'HSN Code', key: 'hsn_code' },
            { header: 'Purchase Price', key: 'purchase_price' },
            { header: 'Cost Price', key: 'cost_price' },
            { header: 'Selling Price', key: 'selling_price' },
            { header: 'MRP', key: 'mrp' },
            { header: 'Opening Stock', key: 'opening_stock' },
            { header: 'Stock Value', key: 'stock_value' },
            { header: 'GST Sales', key: 'gst_sales' },
            { header: 'GST Purchase', key: 'gst_purchase' },
            { header: 'IGST Sales', key: 'igst_sales' },
            { header: 'IGST Purchase', key: 'igst_purchase' }
        ];

        let csvContent = "\uFEFF";
        csvContent += columns.map(c => `"${c.header}"`).join(',') + '\n';
        filteredProducts.forEach(p => {
            const row = columns.map(col => {
                let cellData = p[col.key] || '';
                cellData = String(cellData).replace(/"/g, '""');
                return `"${cellData}"`;
            });
            csvContent += row.join(',') + '\n';
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "Item_Display_Report.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const exportPDF = () => {
        if (!products.length) return;
        const doc = new jsPDF('l');

        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text("Item Display Report", 14, 20);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text(`Generated on: ${new Date().toLocaleString()}  |  Total Items: ${filteredProducts.length}`, 14, 27);

        const head = [["Code", "Barcode", "Item Name", "Category", "Brand", "Unit", "Pur Rate", "Sale Rate", "MRP", "Stock"]];
        const body = filteredProducts.map(p => [
            p.code || 'Auto',
            p.barcode || '-',
            p.name || '',
            p.category || '',
            p.brand || '-',
            p.unit || '',
            `Rs. ${p.purchase_price || 0}`,
            `Rs. ${p.selling_price || 0}`,
            `Rs. ${p.mrp || 0}`,
            p.opening_stock || 0
        ]);

        autoTable(doc, {
            startY: 33,
            head: head,
            body: body,
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [15, 23, 42], textColor: 255 }
        });

        doc.save("Item_Display_Report.pdf");
    };

    const printTableLayout = () => {
        const printWindow = window.open('', '_blank', 'width=1200,height=800');
        const headers = ["Code", "Barcode", "Item Name", "Category", "Brand", "Unit", "Pur Rate", "Sale Rate", "MRP", "Opening Stock"];
        const thead = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;
        const tbody = filteredProducts.map(p =>
            `<tr>
                <td>${p.code || 'Auto'}</td>
                <td>${p.barcode || '-'}</td>
                <td>${p.name || ''}</td>
                <td>${p.category || ''}</td>
                <td>${p.brand || '-'}</td>
                <td>${p.unit || ''}</td>
                <td>₹${p.purchase_price || 0}</td>
                <td>₹${p.selling_price || 0}</td>
                <td>₹${p.mrp || 0}</td>
                <td>${p.opening_stock || 0}</td>
            </tr>`
        ).join('');

        printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Item Display</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #111; background: white; padding: 16px; }
    h1 { font-size: 17px; font-weight: bold; margin-bottom: 3px; }
    .meta { font-size: 10px; color: #555; margin-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; margin-top: 6px; }
    th { background: #0f172a; color: white; font-size: 9px; font-weight: bold; text-transform: uppercase; padding: 6px 8px; text-align: left; border-right: 1px solid #1e293b; }
    td { padding: 5px 8px; font-size: 10px; border-bottom: 1px solid #f1f5f9; border-right: 1px solid #f1f5f9; }
    tr:nth-child(even) td { background: #fafafa; }
    @page { size: landscape; margin: 8mm; }
  </style>
</head>
<body>
  <h1>Item Display Master</h1>
  <p class="meta">Printed: ${new Date().toLocaleString()}&nbsp;|&nbsp;Total Items: ${filteredProducts.length}</p>
  <table>
    <thead>${thead}</thead>
    <tbody>${tbody}</tbody>
  </table>
</body>
</html>`);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
    };

    // Quick creation quick submits
    const handleQuickSubmit = async (type, e) => {
        e.preventDefault();
        try {
            let url = '';
            let payload = {};

            if (type === 'group') {
                url = `${import.meta.env.VITE_API_URL}/categories`;
                payload = {
                    name: quickGroupData.name,
                    hsn_code: quickGroupData.hsn_code || ''
                };
            } else if (type === 'brand') {
                url = `${import.meta.env.VITE_API_URL}/brands`;
                payload = {
                    name: quickBrandData.name
                };
            } else if (type === 'unit') {
                url = `${import.meta.env.VITE_API_URL}/units`;
                payload = {
                    name: quickUnitData.name,
                    decimal_places: quickUnitData.accept_decimal ? 3 : 0
                };
            } else if (type === 'tax') {
                url = `${import.meta.env.VITE_API_URL}/taxes`;
                const rate = parseFloat(quickTaxData.percentage) || 0;
                const half = rate / 2;
                payload = {
                    name: quickTaxData.name,
                    percentage: rate,
                    local_central: 'LOCAL',
                    cgst_rate: half,
                    sgst_rate: half,
                    igst_rate: rate
                };
            }

            const res = await fetchWithAuth(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await res.json();
            if (!result.success) throw new Error(result.error || result.message || 'Operation failed');

            fetchData();
            if (type === 'group') {
                setShowGroupModal(false);
                setQuickGroupData({ name: '', description: '', hsn_code: '' });
                setFormData(p => ({
                    ...p,
                    category: payload.name,
                    hsn_code: payload.hsn_code || p.hsn_code
                }));
            }
            if (type === 'brand') {
                setShowBrandModal(false);
                setQuickBrandData({ name: '', description: '' });
                setFormData(p => ({ ...p, brand: payload.name }));
            }
            if (type === 'unit') {
                setShowUnitModal(false);
                setQuickUnitData({ name: '', description: '', accept_decimal: false });
                setFormData(p => ({ ...p, unit: payload.name }));
            }
            if (type === 'tax') {
                setShowTaxModal(false);
                setQuickTaxData({ name: '', percentage: 0 });
                if (result.data) {
                    setFormData(p => ({
                        ...p,
                        tax_id: result.data._id || result.data.id,
                        gst_sales: String(payload.percentage),
                        gst_purchase: String(payload.percentage),
                        igst_sales: String(payload.percentage),
                        igst_purchase: String(payload.percentage)
                    }));
                }
            }

            alert(`${type.toUpperCase()} created successfully!`);
        } catch (err) {
            alert(`Failed to create ${type}: ` + err.message);
        }
    };

    // Filter Logic
    const filteredProducts = products.filter(p => {
        const matchesSearch =
            (p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (p.code && p.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (p.barcode && p.barcode.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
        const matchesBrand = selectedBrand === 'ALL' || (p.brand || 'No Brand') === selectedBrand;
        const matchesActiveStatus =
            selectedActiveStatus === 'ALL' ||
            (selectedActiveStatus === 'ACTIVE' && p.is_active !== false) ||
            (selectedActiveStatus === 'DEACTIVE' && p.is_active === false);

        return matchesSearch && matchesCategory && matchesBrand && matchesActiveStatus;
    });

    const toggleSidebar = () => {
        if (window.innerWidth <= 768) setIsMobileSidebarOpen(!isMobileSidebarOpen);
        else {
            const newState = !isCollapsed;
            setIsCollapsed(newState);
            localStorage.setItem('sidebarCollapsed', newState);
        }
    };

    return (
        <DashboardPageShell>
            {/* Inline stylesheet to force spreadsheet layout with custom grid lines */}
            <style>{`
                .item-table-grid {
                    width: 100%;
                    border-collapse: collapse;
                }
                .item-table-grid th {
                    background: #0f172a !important;
                    color: #ff7a00 !important;
                    font-weight: 800;
                    font-size: 11px;
                    text-transform: uppercase;
                    border: 1px solid #e2e8f0 !important;
                    padding: 18px 12px !important;
                    text-align: left;
                    white-space: nowrap;
                    position: sticky;
                    top: 0;
                    z-index: 10;
                }
                .item-table-grid td {
                    border: 1px solid #e2e8f0 !important;
                    padding: 8px 12px;
                    font-size: 12px;
                    color: #334155;
                    background: white;
                    white-space: nowrap;
                }
                .item-table-grid tr:hover td {
                    background: #f8fafc;
                }
            `}</style>

            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />

            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}

            <main className="dashboard-main">
                {/* Header Section */}
                <Header
                    toggleSidebar={toggleSidebar}
                    title={!showDrawer ? "ITEM DISPLAY" : (isEditing ? "ITEM MODIFICATION" : "ITEM CREATION")}
                    onClose={!showDrawer ? () => {
                        if (window.confirm("Close current module?")) {
                            window.location.href = "/dashboard/self-service/home";
                        }
                    } : handleClose}
                    actions={
                        !showDrawer ? (
                            <>
                                <button type="button" className="px-3 py-1.5 border border-emerald-500 bg-white text-emerald-600 rounded text-[11px] font-black uppercase flex items-center gap-1.5 hover:bg-emerald-50 transition-colors shadow-sm" onClick={exportCSV} title="Export to Excel">
                                    <Download size={14} className="text-emerald-500" />
                                    <span>Excel</span>
                                </button>
                                <button type="button" className="px-3 py-1.5 border border-rose-500 bg-white text-rose-600 rounded text-[11px] font-black uppercase flex items-center gap-1.5 hover:bg-rose-50 transition-colors shadow-sm" onClick={exportPDF} title="Export to PDF">
                                    <Download size={14} className="text-rose-500" />
                                    <span>PDF</span>
                                </button>
                                <button type="button" className="px-3 py-1.5 border border-indigo-500 bg-white text-indigo-600 rounded text-[11px] font-black uppercase flex items-center gap-1.5 hover:bg-indigo-50 transition-colors shadow-sm" onClick={printTableLayout} title="Print">
                                    <Printer size={14} className="text-indigo-500" />
                                    <span>Print</span>
                                </button>
                                <button
                                    type="button"
                                    className="btn-column-settings"
                                    onClick={() => {
                                        setTempVisibleColumns(visibleColumns);
                                        setShowColumnSettings(true);
                                    }}
                                >
                                    <Settings size={14} />
                                    <span>Column Settings</span>
                                </button>
                                <button
                                    type="button"
                                    className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded text-[11px] font-black uppercase flex items-center gap-1.5 transition-colors shadow-md whitespace-nowrap flex-shrink-0"
                                    onClick={() => { resetForm(); setSearchTerm(''); setShowDrawer(true); }}
                                >
                                    <PlusCircle size={14} />
                                    <span>Add Item</span>
                                </button>
                            </>
                        ) : (
                            <div className="flex items-center gap-2.5 ml-auto">
                                <span className="text-xs font-medium text-slate-700">Type</span>
                                <select
                                    name="product_type"
                                    value={formData.product_type || 'GOODS'}
                                    onChange={handleInputChange}
                                    className="w-48 px-3 py-1.5 bg-white text-slate-800 border border-orange-300 rounded text-xs outline-none focus:border-orange-500 font-medium cursor-pointer shadow-sm"
                                >
                                    <option value="GOODS">Goods</option>
                                    <option value="SERVICE">Service</option>
                                </select>
                            </div>
                        )
                    }
                />

                {/* Main Table Page */}
                {!showDrawer ? (
                    <div className="master-content-layout fade-in !pt-2 flex flex-col">
                        <div className="toolbar-premium no-print">
                            <div className="flex flex-row items-center gap-4 flex-1">
                                <div className="search-premium" style={{ width: '320px', flexShrink: 0 }}>
                                    <Search size={20} />
                                    <input
                                        type="text"
                                        placeholder="Search items..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="border-orange-500 focus:ring-orange-500"
                                        style={{ borderColor: '#f97316' }}
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
                                        value={selectedActiveStatus}
                                        onChange={(e) => setSelectedActiveStatus(e.target.value)}
                                    >
                                        <option value="ACTIVE">ACTIVE</option>
                                        <option value="DEACTIVE">DEACTIVE</option>
                                        <option value="ALL">ALL</option>
                                    </select>
                                </div>

                                {/* Action Dropdown Button - right aligned, white/orange */}
                                <div className="relative ml-auto">
                                    <button
                                        type="button"
                                        onClick={() => setShowBulkMenu(!showBulkMenu)}
                                        className="px-4 py-2 bg-white border border-orange-400 text-[#ea580c] rounded-lg text-xs font-bold hover:bg-orange-50 transition-colors shadow-sm uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                                    >
                                        Actions {selectedIds.length > 0 && <span className="bg-[#ea580c] text-white px-1.5 py-0.5 rounded-full text-[10px]">{selectedIds.length}</span>}
                                        <ChevronDown size={14} />
                                    </button>
                                    {showBulkMenu && (
                                        <div className="absolute right-0 mt-1 w-40 bg-white border border-orange-200 rounded-lg shadow-xl z-50 py-1 font-bold text-xs">
                                            <button onClick={() => handleBulkAction('ACTIVATE')} className="w-full text-left px-4 py-2 hover:bg-emerald-50 text-emerald-700 transition-colors">Activate</button>
                                            <button onClick={() => handleBulkAction('DEACTIVATE')} className="w-full text-left px-4 py-2 hover:bg-slate-100 text-slate-700 transition-colors">Deactivate</button>
                                            <button onClick={() => handleBulkAction('DELETE')} className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 transition-colors">Delete</button>
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>

                        {/* Responsive Scrollable Container */}
                        <div
                            className="table-container-premium"
                            style={{
                                overflowX: 'auto',
                                overflowY: 'auto',
                                maxHeight: 'calc(100vh - 275px)',
                                maxWidth: '100%',
                                borderRadius: '1rem',
                                background: 'white',
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                            }}
                        >
                            <table className="item-table-grid">
                                <thead>
                                    <tr>
                                        <th style={{ textAlign: 'center', width: '40px' }}>
                                            <input
                                                type="checkbox"
                                                checked={filteredProducts.length > 0 && filteredProducts.every(p => selectedIds.includes(p._id || p.id))}
                                                onChange={toggleSelectAll}
                                                className="w-4 h-4 rounded accent-[#ff6b00] cursor-pointer"
                                            />
                                        </th>
                                        {visibleColumns.action && <th style={{ textAlign: 'center', width: '60px' }}>Action</th>}
                                        {visibleColumns.code && <th>Code</th>}
                                        {visibleColumns.barcode && <th>Barcode</th>}
                                        {visibleColumns.name && <th style={{ minWidth: '200px' }}>Item Name</th>}
                                        {visibleColumns.print_name && <th>Print Name</th>}
                                        {visibleColumns.category && <th>Category</th>}
                                        {visibleColumns.brand && <th>Brand</th>}
                                        {visibleColumns.unit && <th>Unit</th>}
                                        {visibleColumns.hsn_code && <th>HSN Code</th>}
                                        {visibleColumns.purchase_price && <th>Purchase Rate</th>}
                                        {visibleColumns.cost_price && <th>Cost Rate</th>}
                                        {visibleColumns.selling_price && <th>Sales Rate</th>}
                                        {visibleColumns.mrp && <th>MRP</th>}
                                        {visibleColumns.opening_stock && <th>Opening Stock</th>}
                                        {visibleColumns.stock_value && <th>Stock Value</th>}
                                        {visibleColumns.gst_sales && <th>GST Sales (%)</th>}
                                        {visibleColumns.gst_purchase && <th>GST Purchase (%)</th>}
                                        {visibleColumns.igst_sales && <th>IGST Sales (%)</th>}
                                        {visibleColumns.igst_purchase && <th>IGST Purchase (%)</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan="20" style={{ textAlign: 'center', padding: '100px 0' }}>
                                                <Loader2 className="animate-spin text-indigo-600 mx-auto mb-4" size={48} />
                                                <p className="font-black text-slate-300 uppercase tracking-[0.2em] text-xs">Querying Archives...</p>
                                            </td>
                                        </tr>
                                    ) : filteredProducts.length === 0 ? (
                                        <tr>
                                            <td colSpan="20" style={{ textAlign: 'center', padding: '100px 0' }}>
                                                <Layers size={64} className="text-slate-100 mx-auto mb-4" />
                                                <p className="font-bold text-slate-400">No items matched the criteria.</p>
                                            </td>
                                        </tr>
                                    ) : filteredProducts.map(p => (
                                        <tr key={p._id} className={`group hover:bg-slate-50 transition-all ${!p.is_active ? 'opacity-60 grayscale-[0.8] bg-slate-50/50' : ''}`}>
                                            <td style={{ textAlign: 'center', width: '40px' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(p._id || p.id)}
                                                    onChange={() => toggleSelectOne(p._id || p.id)}
                                                    className="w-4 h-4 rounded accent-[#ff6b00] cursor-pointer"
                                                />
                                            </td>
                                            {visibleColumns.action && (
                                                <td style={{ textAlign: 'center', width: '40px' }} className="no-print">
                                                    <ActionDropdown item={p} onEdit={handleEdit} onStatusChange={handleToggleStatus} onDelete={handleDelete} />
                                                </td>
                                            )}
                                            {visibleColumns.code && <td>{p.code || 'Auto'}</td>}
                                            {visibleColumns.barcode && <td>{p.barcode || '-'}</td>}
                                            {visibleColumns.name && <td className="font-black">{p.name}</td>}
                                            {visibleColumns.print_name && <td>{p.print_name || '-'}</td>}
                                            {visibleColumns.category && <td><span className={`badge-premium ${p.is_active ? 'active' : 'disabled'} !text-[10px] uppercase font-black`}>{p.category}</span></td>}
                                            {visibleColumns.brand && <td>{p.brand || '-'}</td>}
                                            {visibleColumns.unit && <td className="font-black uppercase">{p.unit || '-'}</td>}
                                            {visibleColumns.hsn_code && <td>{p.hsn_code || '-'}</td>}
                                            {visibleColumns.purchase_price && <td>₹{parseFloat(p.purchase_price || 0).toFixed(2)}</td>}
                                            {visibleColumns.cost_price && <td>₹{parseFloat(p.cost_price || 0).toFixed(2)}</td>}
                                            {visibleColumns.selling_price && <td>₹{parseFloat(p.selling_price || 0).toFixed(2)}</td>}
                                            {visibleColumns.mrp && <td>₹{parseFloat(p.mrp || 0).toFixed(2)}</td>}
                                            {visibleColumns.opening_stock && <td style={{ textAlign: 'center' }}>{p.opening_stock || 0}</td>}
                                            {visibleColumns.stock_value && <td style={{ textAlign: 'center' }} className="font-black text-emerald-600">₹{parseFloat(p.stock_value || 0).toFixed(2)}</td>}
                                            {visibleColumns.gst_sales && <td>{p.gst_sales || 0}%</td>}
                                            {visibleColumns.gst_purchase && <td>{p.gst_purchase || 0}%</td>}
                                            {visibleColumns.igst_sales && <td>{p.igst_sales || 0}%</td>}
                                            {visibleColumns.igst_purchase && <td>{p.igst_purchase || 0}%</td>}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Bottom Total Buttons */}
                        <div className="mt-2 flex items-center justify-end gap-3 flex-shrink-0">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-orange-400 text-[#ea580c] rounded-lg shadow-sm text-xs font-black uppercase tracking-wider">
                                <span>TOTAL RECORDS:</span>
                                <span className="text-sm">{filteredProducts.length}</span>
                            </div>
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-orange-400 text-[#ea580c] rounded-lg shadow-sm text-xs font-black uppercase tracking-wider">
                                <span>TOTAL STOCK VALUE:</span>
                                <span className="font-bold text-sm">₹{filteredProducts.reduce((sum, p) => sum + parseFloat(p.stock_value || 0), 0).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col overflow-hidden bg-white animate-in fade-in duration-200">
                        <div className="p-6 flex flex-col flex-1 relative bg-white">
                            {error && (
                                <div className="bg-rose-50 border border-rose-200 p-2.5 rounded flex items-center gap-2 text-rose-700 font-medium text-xs mb-3 flex-shrink-0 animate-in fade-in duration-200">
                                    <AlertCircle size={16} />
                                    {error}
                                </div>
                            )}

                            <form onSubmit={(e) => { e.preventDefault(); handleFormSubmitRequest(); }} className="flex-1 flex flex-col justify-between overflow-hidden gap-4">
                                <div className="flex-1 overflow-hidden pr-2 space-y-5">

                                    {/* ITEM DETAILS */}
                                    <div>
                                        <div className="w-full mb-1">
                                            <h3 className="text-xs font-bold text-[#ea580c] uppercase tracking-wider">Item Details</h3>
                                        </div>
                                        <hr className="border-t border-orange-400 mt-1 mb-4" />

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3 relative">
                                            {/* Left Column */}
                                            <div className="space-y-3">
                                                <div className="grid grid-cols-12 items-center gap-2">
                                                    <label className="col-span-3 text-[12px] font-bold text-slate-700">Barcode</label>
                                                    <div className="col-span-9">
                                                        <input
                                                            ref={el => { if (el) inputRefs.current['barcode'] = el; }}
                                                            type="text"
                                                            name="barcode"
                                                            value={formData.barcode}
                                                            onChange={handleInputChange}
                                                            onKeyDown={(e) => handleFormKeyDown(e, 'barcode')}
                                                            className="w-full px-3 py-2 bg-white border border-orange-300 rounded text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-semibold"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-12 items-center gap-2">
                                                    <label className="col-span-3 text-[12px] font-bold text-slate-700">Item Name *</label>
                                                    <div className="col-span-9">
                                                        <input
                                                            ref={el => { if (el) inputRefs.current['name'] = el; }}
                                                            type="text"
                                                            name="name"
                                                            required
                                                            value={formData.name}
                                                            onChange={handleInputChange}
                                                            onKeyDown={(e) => handleFormKeyDown(e, 'name')}
                                                            className="w-full px-3 py-2 bg-white border border-orange-300 rounded text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-semibold"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-12 items-center gap-2">
                                                    <label className="col-span-3 text-[12px] font-bold text-slate-700">Group</label>
                                                    <div className="col-span-9 flex gap-1.5 items-center">
                                                        <select
                                                            ref={el => { if (el) inputRefs.current['category'] = el; }}
                                                            name="category"
                                                            required
                                                            value={formData.category}
                                                            onChange={handleInputChange}
                                                            onKeyDown={(e) => handleFormKeyDown(e, 'category')}
                                                            className="flex-1 px-3 py-2 bg-white border border-orange-300 rounded text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-semibold"
                                                        >
                                                            <option value="">Choose Class</option>
                                                            {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                                                        </select>
                                                        <button type="button" onClick={() => setShowGroupModal(true)} className="w-[36px] h-[36px] bg-[#ea580c] hover:bg-orange-600 text-white rounded font-bold text-lg flex items-center justify-center transition-colors shadow-sm flex-shrink-0">+</button>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-12 items-center gap-2">
                                                    <label className="col-span-3 text-[12px] font-bold text-slate-700">HSN Code</label>
                                                    <div className="col-span-9">
                                                        <input
                                                            ref={el => { if (el) inputRefs.current['hsn_code'] = el; }}
                                                            type="text"
                                                            name="hsn_code"
                                                            value={formData.hsn_code}
                                                            onChange={handleInputChange}
                                                            onKeyDown={(e) => handleFormKeyDown(e, 'hsn_code')}
                                                            className="w-full px-3 py-2 bg-white border border-orange-300 rounded text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-semibold"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Middle vertical line between left & right column under item details */}
                                            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-slate-200 -translate-x-1/2" />

                                            {/* Right Column */}
                                            <div className="space-y-3">
                                                <div className="grid grid-cols-12 items-center gap-2">
                                                    <label className="col-span-3 text-[12px] font-bold text-slate-700">Code</label>
                                                    <div className="col-span-9">
                                                        <input
                                                            ref={el => { if (el) inputRefs.current['code'] = el; }}
                                                            type="text"
                                                            name="code"
                                                            placeholder="Auto"
                                                            value={formData.code}
                                                            onChange={handleInputChange}
                                                            onKeyDown={(e) => handleFormKeyDown(e, 'code')}
                                                            className="w-full px-3 py-2 bg-white border border-orange-300 rounded text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-semibold"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-12 items-center gap-2">
                                                    <label className="col-span-3 text-[12px] font-bold text-slate-700">Print Name</label>
                                                    <div className="col-span-9">
                                                        <input
                                                            ref={el => { if (el) inputRefs.current['print_name'] = el; }}
                                                            type="text"
                                                            name="print_name"
                                                            value={formData.print_name}
                                                            onChange={handleInputChange}
                                                            onKeyDown={(e) => handleFormKeyDown(e, 'print_name')}
                                                            className="w-full px-3 py-2 bg-white border border-orange-300 rounded text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-semibold"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-12 items-center gap-2">
                                                    <label className="col-span-3 text-[12px] font-bold text-slate-700">Brand</label>
                                                    <div className="col-span-9 flex gap-1.5 items-center">
                                                        <select
                                                            ref={el => { if (el) inputRefs.current['brand'] = el; }}
                                                            name="brand"
                                                            required
                                                            value={formData.brand}
                                                            onChange={handleInputChange}
                                                            onKeyDown={(e) => handleFormKeyDown(e, 'brand')}
                                                            className="flex-1 px-3 py-2 bg-white border border-orange-300 rounded text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-semibold"
                                                        >
                                                            <option value="">Select Brand</option>
                                                            {brands.map(b => <option key={b._id} value={b.name}>{b.name}</option>)}
                                                        </select>
                                                        <button type="button" onClick={() => setShowBrandModal(true)} className="w-[36px] h-[36px] bg-[#ea580c] hover:bg-orange-600 text-white rounded font-bold text-lg flex items-center justify-center transition-colors shadow-sm flex-shrink-0">+</button>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-12 items-center gap-2">
                                                    <label className="col-span-3 text-[12px] font-bold text-slate-700">Unit</label>
                                                    <div className="col-span-9 flex gap-1.5 items-center">
                                                        <select
                                                            ref={el => { if (el) inputRefs.current['unit'] = el; }}
                                                            name="unit"
                                                            required
                                                            value={formData.unit}
                                                            onChange={handleInputChange}
                                                            onKeyDown={(e) => handleFormKeyDown(e, 'unit')}
                                                            className="flex-1 px-3 py-2 bg-white border border-orange-300 rounded text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 uppercase transition-all font-semibold"
                                                        >
                                                            <option value="">SELECT UNIT</option>
                                                            {units.map(u => <option key={u._id} value={u.name}>{u.name}</option>)}
                                                        </select>
                                                        <button type="button" onClick={() => setShowUnitModal(true)} className="w-[36px] h-[36px] bg-[#ea580c] hover:bg-orange-600 text-white rounded font-bold text-lg flex items-center justify-center transition-colors shadow-sm flex-shrink-0">+</button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 relative">
                                        {/* RATE DETAILS */}
                                        <div>
                                            <div className="w-full mb-1">
                                                <h3 className="text-xs font-bold text-[#ea580c] uppercase tracking-wider">Rate Details</h3>
                                            </div>
                                            <hr className="border-t border-orange-400 mt-1 mb-4" />
                                            <div className="space-y-3">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="grid grid-cols-12 items-center gap-2">
                                                        <label className="col-span-5 text-[12px] font-bold text-slate-700">Pur Rate</label>
                                                        <div className="col-span-7">
                                                            <input
                                                                ref={el => { if (el) inputRefs.current['purchase_price'] = el; }}
                                                                type="text"
                                                                inputMode="decimal"
                                                                name="purchase_price"
                                                                value={formData.purchase_price}
                                                                onChange={handleInputChange}
                                                                onKeyDown={(e) => handleFormKeyDown(e, 'purchase_price')}
                                                                className="w-full px-3 py-2 bg-white border border-orange-300 rounded text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-semibold"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-12 items-center gap-2">
                                                        <label className="col-span-5 text-[12px] font-bold text-slate-700">Cost Rate</label>
                                                        <div className="col-span-7">
                                                            <input
                                                                ref={el => { if (el) inputRefs.current['cost_price'] = el; }}
                                                                type="text"
                                                                inputMode="decimal"
                                                                name="cost_price"
                                                                value={formData.cost_price}
                                                                onChange={handleInputChange}
                                                                onKeyDown={(e) => handleFormKeyDown(e, 'cost_price')}
                                                                className="w-full px-3 py-2 bg-white border border-orange-300 rounded text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-semibold"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="grid grid-cols-12 items-center gap-2">
                                                        <label className="col-span-5 text-[12px] font-bold text-slate-700">Sale Rate *</label>
                                                        <div className="col-span-7">
                                                            <input
                                                                ref={el => { if (el) inputRefs.current['selling_price'] = el; }}
                                                                type="text"
                                                                inputMode="decimal"
                                                                name="selling_price"
                                                                required
                                                                value={formData.selling_price}
                                                                onChange={handleInputChange}
                                                                onKeyDown={(e) => handleFormKeyDown(e, 'selling_price')}
                                                                className="w-full px-3 py-2 bg-white border border-orange-300 rounded text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-semibold"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-12 items-center gap-2">
                                                        <label className="col-span-5 text-[12px] font-bold text-slate-700">MRP Rate</label>
                                                        <div className="col-span-7">
                                                            <input
                                                                ref={el => { if (el) inputRefs.current['mrp'] = el; }}
                                                                type="text"
                                                                inputMode="decimal"
                                                                name="mrp"
                                                                value={formData.mrp}
                                                                onChange={handleInputChange}
                                                                onKeyDown={(e) => handleFormKeyDown(e, 'mrp')}
                                                                className="w-full px-3 py-2 bg-white border border-orange-300 rounded text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-semibold"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Middle vertical line between Rates & Taxes */}
                                        <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-slate-200 -translate-x-1/2" />

                                        {/* TAX DETAILS */}
                                        <div>
                                            <div className="w-full mb-1">
                                                <h3 className="text-xs font-bold text-[#ea580c] uppercase tracking-wider">Tax Details</h3>
                                            </div>
                                            <hr className="border-t border-orange-400 mt-1 mb-4" />
                                            <div className="space-y-3">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="grid grid-cols-12 items-center gap-2">
                                                        <label className="col-span-5 text-[12px] font-bold text-slate-700">GST Sale (%)</label>
                                                        <div className="col-span-7">
                                                            <select
                                                                ref={el => { if (el) inputRefs.current['gst_sales'] = el; }}
                                                                name="gst_sales"
                                                                value={formData.gst_sales}
                                                                onChange={handleInputChange}
                                                                onKeyDown={(e) => handleFormKeyDown(e, 'gst_sales')}
                                                                className="w-full px-3 py-2 bg-white border border-orange-300 rounded text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-semibold"
                                                            >
                                                                <option value="">Select Tax</option>
                                                                {taxes.map(t => (
                                                                    <option key={t._id} value={t.percentage}>{t.name} ({t.percentage}%)</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-12 items-center gap-2">
                                                        <label className="col-span-5 text-[12px] font-bold text-slate-700">IGST Sale (%)</label>
                                                        <div className="col-span-7">
                                                            <select
                                                                ref={el => { if (el) inputRefs.current['igst_sales'] = el; }}
                                                                name="igst_sales"
                                                                value={formData.igst_sales}
                                                                onChange={handleInputChange}
                                                                onKeyDown={(e) => handleFormKeyDown(e, 'igst_sales')}
                                                                className="w-full px-3 py-2 bg-white border border-orange-300 rounded text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-semibold"
                                                            >
                                                                <option value="">Select Tax</option>
                                                                {taxes.map(t => (
                                                                    <option key={t._id} value={t.percentage}>{t.name} ({t.percentage}%)</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="grid grid-cols-12 items-center gap-2">
                                                        <label className="col-span-5 text-[12px] font-bold text-slate-700">GST Purchase (%)</label>
                                                        <div className="col-span-7">
                                                            <select
                                                                ref={el => { if (el) inputRefs.current['gst_purchase'] = el; }}
                                                                name="gst_purchase"
                                                                value={formData.gst_purchase}
                                                                onChange={handleInputChange}
                                                                onKeyDown={(e) => handleFormKeyDown(e, 'gst_purchase')}
                                                                className="w-full px-3 py-2 bg-white border border-orange-300 rounded text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-semibold"
                                                            >
                                                                <option value="">Select Tax</option>
                                                                {taxes.map(t => (
                                                                    <option key={t._id} value={t.percentage}>{t.name} ({t.percentage}%)</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-12 items-center gap-2">
                                                        <label className="col-span-5 text-[12px] font-bold text-slate-700">IGST Purchase (%)</label>
                                                        <div className="col-span-7">
                                                            <select
                                                                ref={el => { if (el) inputRefs.current['igst_purchase'] = el; }}
                                                                name="igst_purchase"
                                                                value={formData.igst_purchase}
                                                                onChange={handleInputChange}
                                                                onKeyDown={(e) => handleFormKeyDown(e, 'igst_purchase')}
                                                                className="w-full px-3 py-2 bg-white border border-orange-300 rounded text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-semibold"
                                                            >
                                                                <option value="">Select Tax</option>
                                                                {taxes.map(t => (
                                                                    <option key={t._id} value={t.percentage}>{t.name} ({t.percentage}%)</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* STOCK DETAILS */}
                                    <div>
                                        <div className="w-full mb-1">
                                            <h3 className="text-xs font-bold text-[#ea580c] uppercase tracking-wider">Stock Details</h3>
                                        </div>
                                        <hr className="border-t border-orange-400 mt-1 mb-4" />

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-3 relative">
                                            {/* Column 1 */}
                                            <div className="space-y-3">
                                                <div className="grid grid-cols-12 items-center gap-2">
                                                    <label className="col-span-5 text-[12px] font-bold text-slate-700">Opening Stk</label>
                                                    <div className="col-span-7">
                                                        <input
                                                            ref={el => { if (el) inputRefs.current['opening_stock'] = el; }}
                                                            type="text"
                                                            inputMode="decimal"
                                                            name="opening_stock"
                                                            value={formData.opening_stock}
                                                            onChange={handleInputChange}
                                                            onKeyDown={(e) => handleFormKeyDown(e, 'opening_stock')}
                                                            className="w-full px-3 py-2 bg-white border border-orange-300 rounded text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-semibold"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-12 items-center gap-2">
                                                    <label className="col-span-5 text-[12px] font-bold text-slate-700">Stock Value</label>
                                                    <div className="col-span-7">
                                                        <input
                                                            ref={el => { if (el) inputRefs.current['stock_value'] = el; }}
                                                            type="text"
                                                            readOnly
                                                            name="stock_value"
                                                            value={formData.stock_value || ((parseFloat(formData.purchase_price) || 0) * (parseFloat(formData.opening_stock) || 0)).toFixed(2)}
                                                            className="w-full px-3 py-2 bg-slate-50 border border-orange-200 rounded text-sm outline-none cursor-not-allowed text-slate-500 font-semibold"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Column divider 1 */}
                                            <div className="hidden md:block absolute left-[33.33%] top-0 bottom-0 w-px bg-slate-200" />

                                            {/* Column 2 */}
                                            <div className="space-y-3">
                                                <div className="grid grid-cols-12 items-center gap-2">
                                                    <label className="col-span-5 text-[12px] font-bold text-slate-700">Maximum Stk</label>
                                                    <div className="col-span-7">
                                                        <input
                                                            ref={el => { if (el) inputRefs.current['max_stock'] = el; }}
                                                            type="text"
                                                            inputMode="decimal"
                                                            name="max_stock"
                                                            value={formData.max_stock}
                                                            onChange={handleInputChange}
                                                            onKeyDown={(e) => handleFormKeyDown(e, 'max_stock')}
                                                            className="w-full px-3 py-2 bg-white border border-orange-300 rounded text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-semibold"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-12 items-center gap-2">
                                                    <label className="col-span-5 text-[12px] font-bold text-slate-700">Minimum Stock</label>
                                                    <div className="col-span-7">
                                                        <input
                                                            ref={el => { if (el) inputRefs.current['min_stock'] = el; }}
                                                            type="text"
                                                            inputMode="decimal"
                                                            name="min_stock"
                                                            value={formData.min_stock}
                                                            onChange={handleInputChange}
                                                            onKeyDown={(e) => handleFormKeyDown(e, 'min_stock')}
                                                            className="w-full px-3 py-2 bg-white border border-orange-300 rounded text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-semibold"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Column divider 2 */}
                                            <div className="hidden md:block absolute left-[66.66%] top-0 bottom-0 w-px bg-slate-200" />

                                            {/* Column 3 */}
                                            <div className="space-y-3">
                                                <div className="grid grid-cols-12 items-center gap-2">
                                                    <label className="col-span-5 text-[12px] font-bold text-slate-700">Re-order Level</label>
                                                    <div className="col-span-7">
                                                        <input
                                                            ref={el => { if (el) inputRefs.current['reorder_level'] = el; }}
                                                            type="text"
                                                            inputMode="decimal"
                                                            name="reorder_level"
                                                            value={formData.reorder_level}
                                                            onChange={handleInputChange}
                                                            onKeyDown={(e) => handleFormKeyDown(e, 'reorder_level')}
                                                            className="w-full px-3 py-2 bg-white border border-orange-300 rounded text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-semibold"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-12 items-center gap-2">
                                                    <label className="col-span-5 text-[12px] font-bold text-slate-700">Urgent Order Stk</label>
                                                    <div className="col-span-7">
                                                        <input
                                                            ref={el => { if (el) inputRefs.current['urgent_order_level'] = el; }}
                                                            type="text"
                                                            inputMode="decimal"
                                                            name="urgent_order_level"
                                                            value={formData.urgent_order_level}
                                                            onChange={handleInputChange}
                                                            onKeyDown={(e) => handleFormKeyDown(e, 'urgent_order_level')}
                                                            className="w-full px-3 py-2 bg-white border border-orange-300 rounded text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-semibold"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* bottom actions bar & popups */}
                                <div className="pt-3 border-t border-slate-100 flex flex-row justify-between items-center bg-white flex-shrink-0 relative">
                                    {/* Modal popup implementations - centered on screen */}
                                    {activePopover && (
                                        <div className="fixed inset-0 z-[9999] flex items-center justify-center" onClick={() => setActivePopover(null)}>
                                            <div className="absolute inset-0 bg-black/30" />

                                            {/* VARIATIONS POPUP */}
                                            {activePopover === 'variations' && (
                                                <div className="relative bg-white rounded-lg shadow-2xl border border-orange-200 w-[380px] max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex justify-between items-center px-5 py-3 border-b border-slate-100">
                                                        <span className="text-sm font-black text-slate-800 uppercase tracking-wider">Variations</span>
                                                        <button type="button" onClick={() => setActivePopover(null)} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={18} /></button>
                                                    </div>
                                                    <div className="px-5 py-4 max-h-[50vh] overflow-y-auto space-y-3">
                                                        {formData.variations?.map((v, idx) => (
                                                            <div key={idx} className="flex gap-2 items-center">
                                                                <input
                                                                    type="text"
                                                                    value={v.name}
                                                                    placeholder="e.g. Small"
                                                                    onChange={(e) => handleVariationChange(idx, 'name', e.target.value)}
                                                                    className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded text-sm outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                                                />
                                                                <input
                                                                    type="text"
                                                                    value={v.amount}
                                                                    placeholder="Rate"
                                                                    onChange={(e) => handleVariationChange(idx, 'amount', e.target.value.replace(/[^0-9.]/g, ''))}
                                                                    className="w-24 px-3 py-2 bg-white border border-slate-300 rounded text-sm outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                                                />
                                                                <button type="button" onClick={() => handleRemoveVariation(idx)} className="text-rose-500 hover:text-rose-700 p-1"><Trash2 size={16} /></button>
                                                            </div>
                                                        ))}
                                                        {(!formData.variations || formData.variations.length === 0) && (
                                                            <p className="text-sm text-slate-400 font-medium italic py-4 text-center">No variations added.</p>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/50">
                                                        <button type="button" onClick={handleAddVariation} className="px-3 py-1.5 text-xs font-bold text-orange-500 bg-orange-50 border border-orange-200 rounded hover:bg-orange-100 transition-colors uppercase">+ Add</button>
                                                        <div className="flex gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => { setFormData(prev => ({ ...prev, variations: [] })); setActivePopover(null); }}
                                                                className="px-4 py-1.5 text-xs font-bold text-white rounded hover:opacity-90 transition-colors uppercase"
                                                                style={{ backgroundColor: '#ef4444' }}
                                                            >
                                                                DELETE
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setActivePopover(null)}
                                                                className="px-4 py-1.5 text-xs font-bold text-white rounded hover:opacity-90 transition-colors uppercase"
                                                                style={{ backgroundColor: '#f97316' }}
                                                            >
                                                                SAVE
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* ADDONS POPUP */}
                                            {activePopover === 'addons' && (
                                                <div className="relative bg-white rounded-lg shadow-2xl border border-orange-200 w-[380px] max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex justify-between items-center px-5 py-3 border-b border-slate-100">
                                                        <span className="text-sm font-black text-slate-800 uppercase tracking-wider">Add Ons</span>
                                                        <button type="button" onClick={() => setActivePopover(null)} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={18} /></button>
                                                    </div>
                                                    <div className="px-5 py-4 max-h-[50vh] overflow-y-auto space-y-3">
                                                        {formData.addons?.map((addon, idx) => (
                                                            <div key={idx} className="flex gap-2 items-center">
                                                                <input
                                                                    type="text"
                                                                    value={addon.name}
                                                                    placeholder="e.g. Cheese"
                                                                    onChange={(e) => handleAddonChange(idx, 'name', e.target.value)}
                                                                    className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded text-sm outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                                                />
                                                                <input
                                                                    type="text"
                                                                    value={addon.rate}
                                                                    placeholder="Rate"
                                                                    onChange={(e) => handleAddonChange(idx, 'rate', e.target.value.replace(/[^0-9.]/g, ''))}
                                                                    className="w-24 px-3 py-2 bg-white border border-slate-300 rounded text-sm outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                                                />
                                                                <button type="button" onClick={() => handleRemoveAddon(idx)} className="text-rose-500 hover:text-rose-700 p-1"><Trash2 size={16} /></button>
                                                            </div>
                                                        ))}
                                                        {(!formData.addons || formData.addons.length === 0) && (
                                                            <p className="text-sm text-slate-400 font-medium italic py-4 text-center">No addons added.</p>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/50">
                                                        <button type="button" onClick={handleAddAddon} className="px-3 py-1.5 text-xs font-bold text-orange-500 bg-orange-50 border border-orange-200 rounded hover:bg-orange-100 transition-colors uppercase">+ Add</button>
                                                        <div className="flex gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => { setFormData(prev => ({ ...prev, addons: [] })); setActivePopover(null); }}
                                                                className="px-4 py-1.5 text-xs font-bold text-white rounded hover:opacity-90 transition-colors uppercase"
                                                                style={{ backgroundColor: '#ef4444' }}
                                                            >
                                                                DELETE
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setActivePopover(null)}
                                                                className="px-4 py-1.5 text-xs font-bold text-white rounded hover:opacity-90 transition-colors uppercase"
                                                                style={{ backgroundColor: '#f97316' }}
                                                            >
                                                                SAVE
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* OTHER INFO POPUP */}
                                            {activePopover === 'otherInfo' && (
                                                <div className="relative bg-white rounded-lg shadow-2xl border border-orange-200 w-[380px] max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex justify-between items-center px-5 py-3 border-b border-slate-100">
                                                        <span className="text-sm font-black text-slate-800 uppercase tracking-wider">Other Info</span>
                                                        <button type="button" onClick={() => setActivePopover(null)} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={18} /></button>
                                                    </div>
                                                    <div className="px-5 py-4 space-y-4 max-h-[50vh] overflow-y-auto">
                                                        <div className="space-y-1.5">
                                                            <label className="block text-xs font-bold text-slate-700 uppercase">Food Type</label>
                                                            <select
                                                                name="food_type"
                                                                value={formData.food_type}
                                                                onChange={handleInputChange}
                                                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-semibold"
                                                            >
                                                                <option value="NONE">None</option>
                                                                <option value="VEG">Veg</option>
                                                                <option value="NON_VEG">Non-Veg</option>
                                                            </select>
                                                        </div>
                                                        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                                                            <span className="text-xs font-bold text-slate-700 uppercase">Online Order Available</span>
                                                            <input
                                                                type="checkbox"
                                                                name="online_order"
                                                                checked={formData.online_order}
                                                                onChange={(e) => setFormData(p => ({ ...p, online_order: e.target.checked }))}
                                                                className="w-4 h-4 text-orange-500 border-slate-300 rounded focus:ring-orange-500 cursor-pointer accent-orange-500"
                                                            />
                                                        </div>
                                                        <div className="space-y-2 border-t border-slate-100 pt-3">
                                                            <span className="block text-xs font-bold text-slate-700 uppercase">Serve Types</span>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                {Object.entries({
                                                                    dine_in: 'Dine In',
                                                                    delivery: 'Delivery',
                                                                    pickup: 'Pickup',
                                                                    party_order: 'Party Order'
                                                                }).map(([key, label]) => (
                                                                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={!!formData.serve_types[key]}
                                                                            onChange={() => handleServeTypeChange(key)}
                                                                            className="w-4 h-4 text-orange-500 border-slate-300 rounded focus:ring-orange-500 accent-orange-500"
                                                                        />
                                                                        <span className="text-xs font-bold text-slate-700 uppercase">{label}</span>
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-end gap-2 px-5 py-3 border-t border-slate-100 bg-slate-50/50">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setFormData(prev => ({
                                                                    ...prev,
                                                                    food_type: 'NONE',
                                                                    online_order: false,
                                                                    serve_types: { dine_in: true, delivery: true, pickup: true, party_order: true }
                                                                }));
                                                                setActivePopover(null);
                                                            }}
                                                            className="px-4 py-1.5 text-xs font-bold text-white rounded hover:opacity-90 transition-colors uppercase"
                                                            style={{ backgroundColor: '#ef4444' }}
                                                        >
                                                            DELETE
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setActivePopover(null)}
                                                            className="px-4 py-1.5 text-xs font-bold text-white rounded hover:opacity-90 transition-colors uppercase"
                                                            style={{ backgroundColor: '#f97316' }}
                                                        >
                                                            SAVE
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* IMAGE POPUP */}
                                            {activePopover === 'image' && (
                                                <div className="relative bg-white rounded-lg shadow-2xl border border-orange-200 w-[380px] max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex justify-between items-center px-5 py-3 border-b border-slate-100">
                                                        <span className="text-sm font-black text-slate-800 uppercase tracking-wider">Item Image</span>
                                                        <button type="button" onClick={() => setActivePopover(null)} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={18} /></button>
                                                    </div>
                                                    <div className="px-5 py-5 flex flex-col items-center gap-4">
                                                        {formData.image ? (
                                                            <div className="flex flex-col items-center gap-2">
                                                                <div className="w-28 h-28 rounded border border-orange-300 overflow-hidden shadow-inner bg-slate-50">
                                                                    <img src={`${getBaseUrl()}${formData.image}`} alt="Uploaded" className="w-full h-full object-cover" />
                                                                </div>
                                                                <span className="text-xs text-slate-500 font-medium">Image uploaded</span>
                                                            </div>
                                                        ) : (
                                                            <div className="w-28 h-28 rounded border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 bg-slate-50">
                                                                <ImageIcon size={32} className="stroke-[1.5]" />
                                                                <span className="text-[10px] font-bold mt-1.5 uppercase">No Image</span>
                                                            </div>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => imageUploadInputRef.current?.click()}
                                                            className="w-full px-4 py-2 bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100 rounded text-sm font-bold uppercase transition-colors text-center"
                                                        >
                                                            {formData.image ? 'CHANGE FILE' : 'UPLOAD FILE'}
                                                        </button>
                                                        {formData.image && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setFormData(p => ({ ...p, image: '' }))}
                                                                className="w-full px-4 py-2 bg-rose-50 text-rose-500 border border-rose-200 hover:bg-rose-100 rounded text-sm font-bold uppercase transition-colors text-center"
                                                            >
                                                                DELETE IMAGE
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="flex justify-end px-5 py-3 border-t border-slate-100 bg-slate-50/50">
                                                        <button
                                                            type="button"
                                                            onClick={() => setActivePopover(null)}
                                                            className="px-5 py-1.5 text-xs font-bold text-white rounded hover:opacity-90 transition-colors uppercase"
                                                            style={{ backgroundColor: '#f97316' }}
                                                        >
                                                            SAVE
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* bottom button triggers - 5-column full-width grid */}
                                    <div className="grid grid-cols-5 gap-3 w-full items-center">
                                        <button
                                            type="button"
                                            onClick={() => setActivePopover(activePopover === 'variations' ? null : 'variations')}
                                            className="w-full h-[40px] px-3 border border-orange-300 bg-white text-[#ea580c] hover:bg-orange-50 rounded text-xs font-bold uppercase flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
                                        >
                                            <Package size={16} className="text-[#ea580c]" /> VARIATIONS
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setActivePopover(activePopover === 'otherInfo' ? null : 'otherInfo')}
                                            className="w-full h-[40px] px-3 border border-orange-300 bg-white text-[#ea580c] hover:bg-orange-50 rounded text-xs font-bold uppercase flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
                                        >
                                            <FileText size={16} className="text-[#ea580c]" /> OTHER INFO
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setActivePopover(activePopover === 'addons' ? null : 'addons')}
                                            className="w-full h-[40px] px-3 border border-orange-300 bg-white text-[#ea580c] hover:bg-orange-50 rounded text-xs font-bold uppercase flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
                                        >
                                            <Puzzle size={16} className="text-[#ea580c]" /> ADD ONS
                                        </button>
                                        <div className="relative w-full">
                                            <button
                                                type="button"
                                                onClick={() => setActivePopover(activePopover === 'image' ? null : 'image')}
                                                className="w-full h-[40px] px-3 border border-orange-300 bg-white text-[#ea580c] hover:bg-orange-50 rounded text-xs font-bold uppercase flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
                                            >
                                                <ImageIcon size={16} className="text-[#ea580c]" /> IMAGE
                                                {formData.image && !uploading && (
                                                    <div className="w-5 h-5 rounded border border-orange-400 overflow-hidden ml-1 flex-shrink-0">
                                                        <img src={`${getBaseUrl()}${formData.image}`} alt="Uploaded" className="w-full h-full object-cover" />
                                                    </div>
                                                )}
                                            </button>
                                            <input
                                                ref={imageUploadInputRef}
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleFileChange}
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={submitting || uploading}
                                            className="w-full h-[40px] px-3 bg-[#ea580c] hover:bg-orange-700 text-white rounded text-xs font-bold uppercase flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                                        >
                                            <Save size={16} /> SAVE
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Column Settings Sidebar Drawer Panel */}
                {showColumnSettings && (
                    <>
                        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999]" onClick={() => setShowColumnSettings(false)} />
                        <div className="fixed top-0 right-0 w-80 h-full bg-white shadow-2xl border-l border-slate-200 z-[10000] flex flex-col animate-in slide-in-from-right duration-300">
                            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                                <div>
                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Column Settings</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Select columns to display</p>
                                </div>
                                <button onClick={() => setShowColumnSettings(false)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-all text-slate-500 hover:text-slate-800">
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                {Object.entries({
                                    code: 'Code',
                                    barcode: 'Barcode',
                                    name: 'Item Name',
                                    print_name: 'Print Name',
                                    category: 'Category',
                                    brand: 'Brand',
                                    unit: 'Unit',
                                    hsn_code: 'HSN Code',
                                    purchase_price: 'Purchase Rate',
                                    cost_price: 'Cost Rate',
                                    selling_price: 'Sales Rate',
                                    mrp: 'MRP',
                                    opening_stock: 'Opening Stock',
                                    stock_value: 'Stock Value',
                                    gst_sales: 'GST Sales (%)',
                                    gst_purchase: 'GST Purchase (%)',
                                    igst_sales: 'IGST Sales (%)',
                                    igst_purchase: 'IGST Purchase (%)',
                                    action: 'Action'
                                }).map(([key, label]) => (
                                    <label key={key} className="flex items-center gap-3 cursor-pointer group py-1">
                                        <input
                                            type="checkbox"
                                            checked={!!tempVisibleColumns[key]}
                                            onChange={(e) => setTempVisibleColumns(prev => ({ ...prev, [key]: e.target.checked }))}
                                            className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500 accent-orange-500 cursor-pointer"
                                            style={{ accentColor: '#f97316' }}
                                        />
                                        <span className="text-xs font-bold text-slate-700 group-hover:text-orange-500 transition-colors uppercase tracking-tight">{label}</span>
                                    </label>
                                ))}
                            </div>
                            <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setTempVisibleColumns(defaultVisibleColumns)}
                                    className="flex-1 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
                                >
                                    RESET
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setVisibleColumns(tempVisibleColumns);
                                        localStorage.setItem('productVisibleColumns', JSON.stringify(tempVisibleColumns));
                                        setShowColumnSettings(false);
                                    }}
                                    className="flex-1 py-2 text-xs font-bold text-white bg-orange-500 rounded hover:bg-orange-600 transition-colors"
                                >
                                    APPLY
                                </button>
                            </div>
                        </div>
                    </>
                )}

                <SaveConfirmationModal
                    isOpen={showSaveConfirm}
                    onConfirm={confirmSave}
                    onCancel={cancelSave}
                />
            </main>

            {/* QUICK CREATION MODALS */}
            {showGroupModal && (
                <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[10001]">
                    <div className="bg-white rounded-md shadow-xl w-[400px] overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800">Create New Group</h3>
                            <button onClick={() => setShowGroupModal(false)} className="text-slate-400 hover:text-rose-500"><XCircle size={20} /></button>
                        </div>
                        <form onSubmit={(e) => handleQuickSubmit('group', e)} className="p-4 flex flex-col gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Group Name *</label>
                                <input type="text" required className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:border-orange-500 outline-none" value={quickGroupData.name} onChange={e => setQuickGroupData({ ...quickGroupData, name: e.target.value })} placeholder="e.g. Beverages" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">HSN Code</label>
                                <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:border-orange-500 outline-none" value={quickGroupData.hsn_code} onChange={e => setQuickGroupData({ ...quickGroupData, hsn_code: e.target.value })} />
                            </div>
                            <div className="flex justify-end gap-2 mt-2">
                                <button type="button" onClick={() => setShowGroupModal(false)} className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded hover:bg-slate-200">Cancel</button>
                                <button type="submit" className="px-4 py-2 text-xs font-bold text-white bg-orange-500 rounded hover:bg-orange-600">Save Group</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showBrandModal && (
                <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[10001]">
                    <div className="bg-white rounded-md shadow-xl w-[400px] overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800">Create New Brand</h3>
                            <button onClick={() => setShowBrandModal(false)} className="text-slate-400 hover:text-rose-500"><XCircle size={20} /></button>
                        </div>
                        <form onSubmit={(e) => handleQuickSubmit('brand', e)} className="p-4 flex flex-col gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Brand Name *</label>
                                <input type="text" required className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:border-orange-500 outline-none" value={quickBrandData.name} onChange={e => setQuickBrandData({ ...quickBrandData, name: e.target.value })} placeholder="e.g. Coca Cola" />
                            </div>
                            <div className="flex justify-end gap-2 mt-2">
                                <button type="button" onClick={() => setShowBrandModal(false)} className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded hover:bg-slate-200">Cancel</button>
                                <button type="submit" className="px-4 py-2 text-xs font-bold text-white bg-orange-500 rounded hover:bg-orange-600">Save Brand</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showUnitModal && (
                <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[10001]">
                    <div className="bg-white rounded-md shadow-xl w-[400px] overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800">Create New Unit</h3>
                            <button onClick={() => setShowUnitModal(false)} className="text-slate-400 hover:text-rose-500"><XCircle size={20} /></button>
                        </div>
                        <form onSubmit={(e) => handleQuickSubmit('unit', e)} className="p-4 flex flex-col gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Unit Name *</label>
                                <input type="text" required className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:border-orange-500 outline-none" value={quickUnitData.name} onChange={e => setQuickUnitData({ ...quickUnitData, name: e.target.value })} placeholder="e.g. KGS, PCS" />
                            </div>
                            <div>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" className="w-4 h-4 text-orange-500 border-orange-500 rounded focus:ring-orange-500" checked={quickUnitData.accept_decimal} onChange={e => setQuickUnitData({ ...quickUnitData, accept_decimal: e.target.checked })} />
                                    <span className="text-xs font-bold text-slate-700">Accept Decimals (e.g., 0.500)</span>
                                </label>
                            </div>
                            <div className="flex justify-end gap-2 mt-2">
                                <button type="button" onClick={() => setShowUnitModal(false)} className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded hover:bg-slate-200">Cancel</button>
                                <button type="submit" className="px-4 py-2 text-xs font-bold text-white bg-orange-500 rounded hover:bg-orange-600">Save Unit</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showTaxModal && (
                <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[10001]">
                    <div className="bg-white rounded-md shadow-xl w-[400px] overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800">Create New Tax</h3>
                            <button onClick={() => setShowTaxModal(false)} className="text-slate-400 hover:text-rose-500"><XCircle size={20} /></button>
                        </div>
                        <form onSubmit={(e) => handleQuickSubmit('tax', e)} className="p-4 flex flex-col gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Tax Name *</label>
                                <input type="text" required className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:border-orange-500 outline-none" value={quickTaxData.name} onChange={e => setQuickTaxData({ ...quickTaxData, name: e.target.value })} placeholder="e.g. GST 18%" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Percentage *</label>
                                <input type="number" required step="0.01" className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:border-orange-500 outline-none" value={quickTaxData.percentage} onChange={e => setQuickTaxData({ ...quickTaxData, percentage: e.target.value === '' ? '' : parseFloat(e.target.value) || 0 })} />
                            </div>
                            <div className="flex justify-end gap-2 mt-2">
                                <button type="button" onClick={() => setShowTaxModal(false)} className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded hover:bg-slate-200">Cancel</button>
                                <button type="submit" className="px-4 py-2 text-xs font-bold text-white bg-orange-500 rounded hover:bg-orange-600">Save Tax</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardPageShell>
    );
};

export default ProductMaster;
