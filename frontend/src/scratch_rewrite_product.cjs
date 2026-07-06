const fs = require('fs');
const path = require('path');

const filePath = path.join('c:', 'Works', 'Mahix', 'toolnew', 'frontend', 'src', 'pages', 'dashboard', 'ProductMaster.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Import useAuth
if (!content.includes("import { useAuth } from")) {
    content = content.replace("import Sidebar from", "import { useAuth } from '../../context/AuthContext';\nimport Sidebar from");
}

// 2. Add useAuth destructuring
if (!content.includes("const { user } = useAuth()")) {
    content = content.replace("const ProductMaster = () => {", "const ProductMaster = () => {\n    const { user } = useAuth();");
}

// 3. handleInputChange auto sync
const oldInputChange = `        // Handle specific fields
        if (name === 'category') {`;

const newInputChange = `        // Handle specific fields
        if (name === 'name') {
            setFormData(prev => {
                const autoUpdate = prev.print_name === prev.name || !prev.print_name;
                return { ...prev, name: value, print_name: autoUpdate ? value : prev.print_name };
            });
            return;
        }
        if (name === 'category') {`;

if (content.includes(oldInputChange) && !content.includes("if (name === 'name') {")) {
    content = content.replace(oldInputChange, newInputChange);
}

// 4. Header Actions Replacement
const oldHeaderRegex = /<Header[\s\S]*?actions=\{[\s\S]*?\}[\s\S]*?\/>/;
const newHeader = `<Header 
                    toggleSidebar={toggleSidebar} 
                    title={user?.restaurant_name || "Profile Name"}
                    actions={
                        <>
                            <div className="relative group inline-block mr-2">
                                <button className="btn-premium-outline !py-2 !px-4 flex items-center gap-2">
                                    <span className="text-[10px] uppercase font-black">Action</span>
                                    <ChevronDown size={14} />
                                </button>
                                <div className="absolute right-0 top-full mt-1 hidden group-hover:flex flex-col bg-white shadow-lg border border-slate-200 rounded-md z-50 min-w-[120px]">
                                    <button className="text-left px-4 py-2 text-xs font-semibold hover:bg-slate-50 border-b border-slate-100" onClick={exportCSV}>Excel</button>
                                    <button className="text-left px-4 py-2 text-xs font-semibold hover:bg-slate-50 border-b border-slate-100" onClick={() => window.print()}>PDF</button>
                                    <button className="text-left px-4 py-2 text-xs font-semibold hover:bg-slate-50" onClick={() => window.print()}>Print</button>
                                </div>
                            </div>
                            <button className="btn-premium-primary !py-2 !px-6" onClick={() => { resetForm(); setSearchTerm(''); setShowDrawer(true); }}>
                                <PlusCircle size={18} /> 
                                <span className="text-[10px] uppercase font-black">Add New Item</span>
                            </button>
                        </>
                    }
                />`;
content = content.replace(oldHeaderRegex, newHeader);

// 5. Replace Form Layout
const formStartRegex = new RegExp('<form id="product-form"[\\\\s\\\\S]*?\\{\\/\\* LEFT COLUMN \\*\\/\\}');

// Because it's too complex to regex everything safely, let's extract the form content starting from <div className="grid grid-cols-1 lg:grid-cols-2...
// We will replace the entire grid

const formGridStart = `<div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-6">`;
// This is fragile. Let's do string replacement for specific elements if possible, or rewrite the whole form grid block.
// To do this reliably, I'll use a precise replacement. Let's replace the whole Left/Right column part up to VARIATIONS & ADDONS SECTION.

const fullFormSearch = content.substring(content.indexOf(formGridStart), content.indexOf("{/* VARIATIONS & ADDONS SECTION */}"));

const newFormGrid = `<div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-6">
            
            {/* LEFT COLUMN */}
            <div className="flex flex-col gap-3">
                
                <div className="flex items-center">
                    <label className="w-1/3 text-sm font-semibold text-[#0F172A]">Product Type</label>
                    <div className="w-2/3">
                        <select name="product_type" className="w-full px-2 py-1.5 bg-white border-2 border-slate-300 rounded-sm text-sm text-[#0F172A] outline-none hover:border-[#0F172A] focus:border-[#0F172A] transition-colors" value={formData.product_type} onChange={handleInputChange}>
                            <option value="BUY_SELL">Buy & Sell</option>
                            <option value="SERVICE">Service</option>
                            <option value="RAW_MATERIAL">Raw Material</option>
                        </select>
                    </div>
                </div>

                <div className="flex items-center">
                    <label className="w-1/3 text-sm font-semibold text-[#0F172A]">Code</label>
                    <div className="w-2/3 relative">
                        <input type="text" name="code" className="w-full pl-2 pr-24 py-1.5 bg-white border-2 border-slate-300 rounded-sm text-sm text-[#0F172A] outline-none hover:border-[#0F172A] focus:border-[#0F172A] transition-colors" value={formData.code} onChange={handleInputChange} placeholder="Enter Code" />
                        <button type="button" className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#0F172A] bg-white px-2 py-0.5 rounded border border-slate-300 hover:border-[#0F172A] hover:bg-slate-50 transition-colors">ASSIGN CODE</button>
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
                        <button type="button" className="text-[#0F172A] bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-sm px-2 py-1.5 transition-colors font-bold">+</button>
                    </div>
                </div>

                <div className="flex items-center">
                    <label className="w-1/3 text-sm font-semibold text-[#0F172A]">Brand</label>
                    <div className="w-2/3 flex items-center gap-1">
                        <select name="brand" className="flex-1 px-2 py-1.5 bg-white border-2 border-slate-300 rounded-sm text-sm text-[#0F172A] outline-none hover:border-[#0F172A] focus:border-[#0F172A] transition-colors" value={formData.brand} onChange={handleInputChange}>
                            <option value="">Generic</option>
                            {brands.map(b => <option key={b._id} value={b.name}>{b.name}</option>)}
                        </select>
                        <button type="button" className="text-[#0F172A] bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-sm px-2 py-1.5 transition-colors font-bold">+</button>
                    </div>
                </div>

                <h4 className="text-base font-bold text-[#0F172A] mt-4 mb-2 uppercase tracking-wider">Tax Details</h4>
                
                <div className="flex items-center">
                    <label className="w-1/3 text-sm font-semibold text-[#0F172A]">GST Purchase</label>
                    <div className="w-2/3">
                        <input type="text" inputMode="decimal" name="gst_purchase" className="w-full px-2 py-1.5 bg-white border-2 border-slate-300 rounded-sm text-sm text-[#0F172A] outline-none hover:border-[#0F172A] focus:border-[#0F172A] transition-colors" value={formData.gst_purchase} onChange={handleInputChange} />
                    </div>
                </div>
                
                <div className="flex items-center">
                    <label className="w-1/3 text-sm font-semibold text-[#0F172A]">IGST Purchase</label>
                    <div className="w-2/3">
                        <input type="text" inputMode="decimal" name="igst_purchase" className="w-full px-2 py-1.5 bg-white border-2 border-slate-300 rounded-sm text-sm text-[#0F172A] outline-none hover:border-[#0F172A] focus:border-[#0F172A] transition-colors" value={formData.igst_purchase || ''} onChange={handleInputChange} />
                    </div>
                </div>

                <div className="flex items-center">
                    <label className="w-1/3 text-sm font-semibold text-[#0F172A]">GST Sale</label>
                    <div className="w-2/3">
                        <input type="text" inputMode="decimal" name="gst_sales" className="w-full px-2 py-1.5 bg-white border-2 border-slate-300 rounded-sm text-sm text-[#0F172A] outline-none hover:border-[#0F172A] focus:border-[#0F172A] transition-colors" value={formData.gst_sales} onChange={handleInputChange} />
                    </div>
                </div>

                <h4 className="text-base font-bold text-[#0F172A] mt-4 mb-2 uppercase tracking-wider">Rate Details</h4>

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

            {/* RIGHT COLUMN */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center opacity-0 pointer-events-none">
                    {/* Placeholder for alignment with Product Type */}
                    <label className="w-1/3 text-sm font-semibold text-[#0F172A]">Placeholder</label>
                    <div className="w-2/3"><input type="text" className="w-full py-1.5" /></div>
                </div>

                <div className="flex items-center">
                    <label className="w-1/3 text-sm font-semibold text-[#0F172A]">Barcode</label>
                    <div className="w-2/3">
                        <input type="text" name="barcode" className="w-full px-2 py-1.5 bg-white border-2 border-slate-300 rounded-sm text-sm text-[#0F172A] outline-none hover:border-[#0F172A] focus:border-[#0F172A] transition-colors" value={formData.barcode} onChange={handleInputChange} />
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
                        <input type="text" name="unit" className="flex-1 px-2 py-1.5 bg-white border-2 border-slate-300 rounded-sm text-sm text-[#0F172A] outline-none hover:border-[#0F172A] focus:border-[#0F172A] transition-colors uppercase" value={formData.unit} onChange={handleInputChange} />
                        <button type="button" className="text-[#0F172A] bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-sm px-2 py-1.5 transition-colors font-bold">+</button>
                    </div>
                </div>

                <h4 className="text-base font-bold text-[#0F172A] mt-4 mb-2 uppercase tracking-wider">Inventory Controls</h4>

                <div className="flex items-center">
                    <label className="w-1/3 text-sm font-semibold text-[#0F172A]">Opening Stock</label>
                    <div className="w-2/3">
                        <input type="text" inputMode="decimal" name="opening_stock" className="w-full px-2 py-1.5 bg-white border-2 border-slate-300 rounded-sm text-sm text-[#0F172A] outline-none hover:border-[#0F172A] focus:border-[#0F172A] transition-colors" value={formData.opening_stock} onChange={handleInputChange} />
                    </div>
                </div>

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

                <h4 className="text-base font-bold text-[#0F172A] mt-4 mb-2 uppercase tracking-wider">Other Info</h4>

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
                                <input type="checkbox" className="sr-only peer" checked={formData.online_order} onChange={(e) => setFormData(p => ({ ...p, online_order: e.target.checked }))} />
                                <div className="w-8 h-4 rounded-full bg-slate-300 peer-checked:bg-[#0F172A] relative transition-all">
                                    <span className={\`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-all \${formData.online_order ? 'translate-x-4' : ''}\`}></span>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div className="flex items-center w-1/2">
                        <label className="w-2/3 text-sm font-semibold text-[#0F172A]">Item Active</label>
                        <div className="w-1/3 flex items-center">
                            <label className="flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={formData.is_active} onChange={(e) => setFormData(p => ({ ...p, is_active: e.target.checked }))} />
                                <div className="w-8 h-4 rounded-full bg-slate-300 peer-checked:bg-[#0F172A] relative transition-all">
                                    <span className={\`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-all \${formData.is_active ? 'translate-x-4' : ''}\`}></span>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

            </div>
            
`;

if (fullFormSearch.includes("LEFT COLUMN")) {
    content = content.replace(fullFormSearch, newFormGrid);
}

// 6. Close button logic + drawer header. 
const closeBtnSearch = `<button type="button" onClick={() => setShowDrawer(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                            <XCircle size={24} />
                                        </button>`;
const newCloseBtn = `<button type="button" onClick={() => { if(window.confirm('Need to close the tab ( Yes/ No ) ?')) setShowDrawer(false); }} className="text-slate-400 hover:text-slate-600 transition-colors bg-rose-50 hover:bg-rose-100 p-1 rounded-md text-rose-600">
                                            <span className="text-xs font-black uppercase px-2">Close</span>
                                        </button>`;
content = content.replace(closeBtnSearch, newCloseBtn);

fs.writeFileSync(filePath, content, 'utf8');
console.log("ProductMaster.jsx rewritten successfully");
