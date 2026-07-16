import re

with open('c:/Works/Mahix/restaurant/frontend/src/pages/dashboard/ProductMaster.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update expandedSections to include 'image'
old_state = """    const [expandedSections, setExpandedSections] = useState({
        inventory: false,
        otherInfo: false,
        variations: false,
        addons: false
    });

    const toggleSection = (section) => { setExpandedSections(prev => { const isCurrentlyOpen = prev[section]; return { inventory: false, otherInfo: false, variations: false, addons: false, [section]: !isCurrentlyOpen }; }); };"""

new_state = """    const [expandedSections, setExpandedSections] = useState({
        inventory: false,
        otherInfo: false,
        variations: false,
        addons: false,
        image: false
    });

    const toggleSection = (section) => { setExpandedSections(prev => { const isCurrentlyOpen = prev[section]; return { inventory: false, otherInfo: false, variations: false, addons: false, image: false, [section]: !isCurrentlyOpen }; }); };
    const closeAllSections = () => setExpandedSections({ inventory: false, otherInfo: false, variations: false, addons: false, image: false });"""

content = content.replace(old_state, new_state)

# 2. Extract the showDrawer section using string manipulation to ensure correct replacement
start_marker = "{showDrawer && ("
end_marker = "                <SaveConfirmationModal"
start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print("Could not find drawer section")
    exit(1)

new_drawer = """{showDrawer && (
                    <div className="fixed inset-0 z-[100] bg-slate-900/50 flex items-center justify-center p-4">
                        <div className="bg-white w-full max-w-6xl h-auto max-h-[95vh] rounded-lg shadow-2xl flex flex-col relative overflow-hidden font-sans">
                            
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                                <h2 className="text-xl font-black text-[#0b1727] tracking-wider uppercase">ITEM CREATION</h2>
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-2">
                                        <label className="text-sm font-bold text-slate-600">Type</label>
                                        <select 
                                            name="item_nature" 
                                            className="px-3 py-1.5 bg-white border border-[#f97316] text-[#f97316] font-bold rounded outline-none focus:ring-2 focus:ring-[#f97316]/20 transition-all cursor-pointer"
                                            value={formData.item_nature} 
                                            onChange={handleInputChange}
                                        >
                                            <option value="GOOD">Goods</option>
                                            <option value="SERVICE">Service</option>
                                        </select>
                                    </div>
                                    <button onClick={() => { resetForm(); setShowDrawer(false); }} className="flex items-center gap-2 px-4 py-1.5 border border-red-200 text-red-500 rounded hover:bg-red-50 font-bold text-sm transition-colors">
                                        <XCircle size={16} /> CLOSE
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div className="bg-rose-50 border-b border-rose-200 px-6 py-3 flex items-center gap-3 text-rose-700 font-medium text-sm">
                                    <AlertCircle size={18} /> {error}
                                </div>
                            )}

                            {/* Body */}
                            <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar bg-slate-50 relative">
                                <form id="product-form" ref={formRef} onKeyDown={handleKeyDown} onSubmit={(e) => { e.preventDefault(); handleFormSubmitRequest(); }} className="flex flex-col gap-6">
                                    
                                    {/* ITEM DETAILS */}
                                    <div>
                                        <h3 className="text-sm font-black text-[#f97316] uppercase tracking-wider mb-3">ITEM DETAILS</h3>
                                        <div className="bg-white p-5 rounded border border-slate-200 shadow-sm grid grid-cols-2 gap-x-12 gap-y-4 relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-full h-1 bg-[#f97316]"></div>
                                            
                                            {/* Left */}
                                            <div className="flex flex-col gap-4">
                                                <div className="flex items-center">
                                                    <label className="w-1/3 text-sm font-bold text-slate-700">Barcode</label>
                                                    <div className="w-2/3">
                                                        <input type="text" name="barcode" className="w-full px-3 py-2 bg-white border border-[#f97316] rounded text-sm text-slate-800 outline-none focus:ring-2 focus:ring-[#f97316]/20 transition-all" value={formData.barcode} onChange={handleInputChange} />
                                                    </div>
                                                </div>
                                                <div className="flex items-center">
                                                    <label className="w-1/3 text-sm font-bold text-slate-700">Code</label>
                                                    <div className="w-2/3">
                                                        <input type="text" name="code" className="w-full px-3 py-2 bg-white border border-[#f97316] rounded text-sm text-slate-800 outline-none focus:ring-2 focus:ring-[#f97316]/20 transition-all" value={formData.code} onChange={handleInputChange} />
                                                    </div>
                                                </div>
                                                <div className="flex items-center">
                                                    <label className="w-1/3 text-sm font-bold text-slate-700">Group <span className="text-rose-500">*</span></label>
                                                    <div className="w-2/3 flex items-center gap-2">
                                                        <select name="category" required className="flex-1 px-3 py-2 bg-white border border-[#f97316] rounded text-sm text-slate-800 outline-none focus:ring-2 focus:ring-[#f97316]/20 transition-all" value={formData.category} onChange={handleInputChange}>
                                                            <option value="">Choose Class</option>
                                                            {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                                                        </select>
                                                        <button type="button" onClick={() => setShowGroupModal(true)} className="bg-[#f97316] hover:bg-[#ea580c] text-white rounded w-9 h-9 flex items-center justify-center transition-colors font-black">+</button>
                                                    </div>
                                                </div>
                                                <div className="flex items-center">
                                                    <label className="w-1/3 text-sm font-bold text-slate-700">HSN Code</label>
                                                    <div className="w-2/3">
                                                        <input type="text" name="hsn_code" className="w-full px-3 py-2 bg-white border border-[#f97316] rounded text-sm text-slate-800 outline-none focus:ring-2 focus:ring-[#f97316]/20 transition-all" value={formData.hsn_code} onChange={handleInputChange} />
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Right */}
                                            <div className="flex flex-col gap-4">
                                                <div className="flex items-center">
                                                    <label className="w-1/3 text-sm font-bold text-slate-700">Item Name <span className="text-rose-500">*</span></label>
                                                    <div className="w-2/3">
                                                        <input type="text" name="name" required className="w-full px-3 py-2 bg-white border border-[#f97316] rounded text-sm text-slate-800 outline-none focus:ring-2 focus:ring-[#f97316]/20 transition-all" value={formData.name} onChange={handleInputChange} />
                                                    </div>
                                                </div>
                                                <div className="flex items-center">
                                                    <label className="w-1/3 text-sm font-bold text-slate-700">Print Name</label>
                                                    <div className="w-2/3">
                                                        <input type="text" name="print_name" className="w-full px-3 py-2 bg-white border border-[#f97316] rounded text-sm text-slate-800 outline-none focus:ring-2 focus:ring-[#f97316]/20 transition-all" value={formData.print_name || ''} onChange={handleInputChange} />
                                                    </div>
                                                </div>
                                                <div className="flex items-center">
                                                    <label className="w-1/3 text-sm font-bold text-slate-700">Brand <span className="text-rose-500">*</span></label>
                                                    <div className="w-2/3 flex items-center gap-2">
                                                        <select name="brand" required className="flex-1 px-3 py-2 bg-white border border-[#f97316] rounded text-sm text-slate-800 outline-none focus:ring-2 focus:ring-[#f97316]/20 transition-all" value={formData.brand} onChange={handleInputChange}>
                                                            <option value="">Generic</option>
                                                            {brands.map(b => <option key={b._id} value={b.name}>{b.name}</option>)}
                                                        </select>
                                                        <button type="button" onClick={() => setShowBrandModal(true)} className="bg-[#f97316] hover:bg-[#ea580c] text-white rounded w-9 h-9 flex items-center justify-center transition-colors font-black">+</button>
                                                    </div>
                                                </div>
                                                <div className="flex items-center">
                                                    <label className="w-1/3 text-sm font-bold text-slate-700">Unit <span className="text-rose-500">*</span></label>
                                                    <div className="w-2/3 flex items-center gap-2">
                                                        <select name="unit" required className="flex-1 px-3 py-2 bg-white border border-[#f97316] rounded text-sm text-slate-800 outline-none focus:ring-2 focus:ring-[#f97316]/20 transition-all uppercase" value={formData.unit} onChange={handleInputChange}>
                                                            <option value="">Select Unit</option>
                                                            {units.map(u => <option key={u._id} value={u.name}>{u.name}</option>)}
                                                        </select>
                                                        <button type="button" onClick={() => setShowUnitModal(true)} className="bg-[#f97316] hover:bg-[#ea580c] text-white rounded w-9 h-9 flex items-center justify-center transition-colors font-black">+</button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Middle Section: Rates & Tax */}
                                    <div className="grid grid-cols-2 gap-x-12">
                                        {/* RATE DETAILS */}
                                        <div>
                                            <h3 className="text-sm font-black text-[#f97316] uppercase tracking-wider mb-3">RATE DETAILS</h3>
                                            <div className="bg-white p-5 rounded border border-slate-200 shadow-sm relative overflow-hidden h-[180px]">
                                                <div className="absolute top-0 left-0 w-full h-1 bg-[#f97316]"></div>
                                                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                                    <div className="flex flex-col gap-1.5">
                                                        <label className="text-[11px] font-bold text-slate-600 uppercase">Pur Rate</label>
                                                        <input type="text" inputMode="decimal" name="purchase_price" className="w-full px-3 py-2 bg-white border border-[#f97316] rounded text-sm text-slate-800 outline-none focus:ring-2 focus:ring-[#f97316]/20 transition-all" value={formData.purchase_price} onChange={handleInputChange} />
                                                    </div>
                                                    <div className="flex flex-col gap-1.5">
                                                        <label className="text-[11px] font-bold text-slate-600 uppercase">Cost Rate</label>
                                                        <input type="text" inputMode="decimal" name="cost_price" className="w-full px-3 py-2 bg-white border border-[#f97316] rounded text-sm text-slate-800 outline-none focus:ring-2 focus:ring-[#f97316]/20 transition-all" value={formData.cost_price} onChange={handleInputChange} />
                                                    </div>
                                                    <div className="flex flex-col gap-1.5">
                                                        <label className="text-[11px] font-bold text-slate-600 uppercase">Sale Rate <span className="text-rose-500">*</span></label>
                                                        <input type="text" inputMode="decimal" name="selling_price" required className="w-full px-3 py-2 bg-white border border-[#f97316] rounded text-sm text-slate-800 outline-none focus:ring-2 focus:ring-[#f97316]/20 transition-all" value={formData.selling_price} onChange={handleInputChange} />
                                                    </div>
                                                    <div className="flex flex-col gap-1.5">
                                                        <label className="text-[11px] font-bold text-slate-600 uppercase">MRP Rate</label>
                                                        <input type="text" inputMode="decimal" name="mrp" className="w-full px-3 py-2 bg-white border border-[#f97316] rounded text-sm text-slate-800 outline-none focus:ring-2 focus:ring-[#f97316]/20 transition-all" value={formData.mrp} onChange={handleInputChange} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* TAX DETAILS */}
                                        <div>
                                            <h3 className="text-sm font-black text-[#f97316] uppercase tracking-wider mb-3">TAX DETAILS</h3>
                                            <div className="bg-white p-5 rounded border border-slate-200 shadow-sm relative overflow-hidden h-[180px]">
                                                <div className="absolute top-0 left-0 w-full h-1 bg-[#f97316]"></div>
                                                
                                                <div className="flex items-center gap-2 mb-4">
                                                    <label className="w-1/4 text-[11px] font-bold text-slate-600 uppercase">Tax Slab <span className="text-rose-500">*</span></label>
                                                    <select name="tax_id" required className="flex-1 px-3 py-2 bg-white border border-[#f97316] rounded text-sm text-slate-800 outline-none focus:ring-2 focus:ring-[#f97316]/20 transition-all" value={formData.tax_id} onChange={handleInputChange}>
                                                        <option value="">Select GST Slab</option>
                                                        {taxes.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                                                    </select>
                                                </div>

                                                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                                    <div className="flex items-center gap-2">
                                                        <label className="w-1/2 text-[11px] font-bold text-slate-600 uppercase">GST Sale(%)</label>
                                                        <input type="text" readOnly name="gst_sales" className="w-1/2 px-2 py-1.5 bg-slate-100 border border-slate-200 rounded text-sm text-slate-600 outline-none cursor-not-allowed" value={formData.gst_sales || ''} />
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <label className="w-1/2 text-[11px] font-bold text-slate-600 uppercase">IGST Sale(%)</label>
                                                        <input type="text" readOnly name="igst_sales" className="w-1/2 px-2 py-1.5 bg-slate-100 border border-slate-200 rounded text-sm text-slate-600 outline-none cursor-not-allowed" value={formData.igst_sales || ''} />
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <label className="w-1/2 text-[11px] font-bold text-slate-600 uppercase">GST Purchase(%)</label>
                                                        <input type="text" readOnly name="gst_purchase" className="w-1/2 px-2 py-1.5 bg-slate-100 border border-slate-200 rounded text-sm text-slate-600 outline-none cursor-not-allowed" value={formData.gst_purchase || ''} />
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <label className="w-1/2 text-[11px] font-bold text-slate-600 uppercase">IGST Purchase(%)</label>
                                                        <input type="text" readOnly name="igst_purchase" className="w-1/2 px-2 py-1.5 bg-slate-100 border border-slate-200 rounded text-sm text-slate-600 outline-none cursor-not-allowed" value={formData.igst_purchase || ''} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* STOCK DETAILS */}
                                    <div>
                                        <h3 className="text-sm font-black text-[#f97316] uppercase tracking-wider mb-3">STOCK DETAILS</h3>
                                        <div className="bg-white p-5 rounded border border-slate-200 shadow-sm grid grid-cols-3 gap-x-8 gap-y-4 relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-full h-1 bg-[#f97316]"></div>
                                            <div className="flex items-center gap-2">
                                                <label className="w-1/2 text-[11px] font-bold text-slate-600 uppercase">Opening Stk</label>
                                                <input type="text" inputMode="decimal" name="opening_stock" className="w-1/2 px-3 py-2 bg-white border border-[#f97316] rounded text-sm text-slate-800 outline-none focus:ring-2 focus:ring-[#f97316]/20 transition-all" value={formData.opening_stock} onChange={handleInputChange} />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <label className="w-1/2 text-[11px] font-bold text-slate-600 uppercase">Maximum Stk</label>
                                                <input type="text" inputMode="decimal" name="max_stock" className="w-1/2 px-3 py-2 bg-white border border-[#f97316] rounded text-sm text-slate-800 outline-none focus:ring-2 focus:ring-[#f97316]/20 transition-all" value={formData.max_stock} onChange={handleInputChange} />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <label className="w-1/2 text-[11px] font-bold text-slate-600 uppercase">Re-order Level</label>
                                                <input type="text" inputMode="decimal" name="reorder_level" className="w-1/2 px-3 py-2 bg-white border border-[#f97316] rounded text-sm text-slate-800 outline-none focus:ring-2 focus:ring-[#f97316]/20 transition-all" value={formData.reorder_level} onChange={handleInputChange} />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <label className="w-1/2 text-[11px] font-bold text-slate-600 uppercase">Stock Value</label>
                                                <input type="text" readOnly className="w-1/2 px-3 py-2 bg-slate-100 border border-slate-200 rounded text-sm text-slate-600 outline-none cursor-not-allowed" value={((parseFloat(formData.opening_stock) || 0) * (parseFloat(formData.purchase_price) || parseFloat(formData.cost_price) || 0)).toFixed(2)} />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <label className="w-1/2 text-[11px] font-bold text-slate-600 uppercase">Minimum Stock</label>
                                                <input type="text" inputMode="decimal" name="min_stock" className="w-1/2 px-3 py-2 bg-white border border-[#f97316] rounded text-sm text-slate-800 outline-none focus:ring-2 focus:ring-[#f97316]/20 transition-all" value={formData.min_stock} onChange={handleInputChange} />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <label className="w-1/2 text-[11px] font-bold text-slate-600 uppercase">Urgent Order Stk</label>
                                                <input type="text" inputMode="decimal" name="urgent_order_level" className="w-1/2 px-3 py-2 bg-white border border-[#f97316] rounded text-sm text-slate-800 outline-none focus:ring-2 focus:ring-[#f97316]/20 transition-all" value={formData.urgent_order_level} onChange={handleInputChange} />
                                            </div>
                                        </div>
                                    </div>
                                    {/* Invisible submit button to catch Enter if no other buttons caught it */}
                                    <button type="submit" className="hidden">Submit</button>
                                </form>
                            </div>

                            {/* Footer Action Bar */}
                            <div className="bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-4 relative">
                                    
                                    {/* VARIATIONS BUTTON & POPUP */}
                                    <div className="relative">
                                        <button type="button" onClick={() => toggleSection('variations')} className="flex items-center gap-2 px-6 py-2 border-2 border-[#f97316] text-[#f97316] font-black rounded uppercase text-sm hover:bg-orange-50 transition-colors shadow-sm">
                                            <Package size={16} strokeWidth={2.5} /> VARIATIONS
                                        </button>
                                        {expandedSections.variations && (
                                            <div className="absolute bottom-[calc(100%+12px)] left-0 w-[400px] bg-white rounded-lg shadow-[0_0_20px_rgba(0,0,0,0.15)] border border-slate-200 z-[110] animate-in slide-in-from-bottom-2">
                                                <div className="p-3 border-b border-slate-100 bg-slate-50 font-black text-slate-800 text-sm flex justify-between items-center rounded-t-lg">
                                                    <span>Variations</span>
                                                    <button onClick={() => setExpandedSections(p => ({...p, variations: false}))} className="text-slate-400 hover:text-slate-700"><X size={16} /></button>
                                                </div>
                                                <div className="p-4 max-h-[300px] overflow-y-auto custom-scrollbar">
                                                    <div className="flex justify-end mb-3">
                                                        <button type="button" onClick={handleAddVariation} className="px-3 py-1.5 text-[11px] font-black text-white bg-[#f97316] rounded hover:bg-[#ea580c] transition-colors shadow-sm">+ ADD VARIANT</button>
                                                    </div>
                                                    <div className="flex flex-col gap-3">
                                                        {formData.variations?.length ? formData.variations.map((v, idx) => (
                                                            <div key={idx} className="flex items-center gap-2">
                                                                <input type="text" placeholder="Variant Name" className="w-1/2 px-3 py-2 bg-white border-2 border-slate-300 rounded text-sm text-slate-800 outline-none focus:border-[#f97316] transition-all" value={v.name} onChange={(e) => handleVariationChange(idx, 'name', e.target.value)} />
                                                                <input type="number" placeholder="Rate" className="w-1/3 px-3 py-2 bg-white border-2 border-slate-300 rounded text-sm text-slate-800 outline-none focus:border-[#f97316] transition-all" value={v.amount} onChange={(e) => handleVariationChange(idx, 'amount', e.target.value === '' ? '' : parseFloat(e.target.value) || 0)} />
                                                                <button type="button" onClick={() => handleRemoveVariation(idx)} className="p-2 text-rose-500 hover:bg-rose-50 rounded transition-colors"><Trash2 size={16} /></button>
                                                            </div>
                                                        )) : <div className="text-sm font-bold text-slate-400 text-center py-4">No variations added.</div>}
                                                    </div>
                                                </div>
                                                <div className="p-3 border-t border-slate-100 bg-slate-50 flex justify-end gap-2 rounded-b-lg">
                                                    <button type="button" onClick={() => setExpandedSections(p => ({...p, variations: false}))} className="px-5 py-2 text-xs font-black text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded transition-colors shadow-sm">DELETE / CLOSE</button>
                                                    <button type="button" onClick={() => setExpandedSections(p => ({...p, variations: false}))} className="px-5 py-2 text-xs font-black text-white bg-[#f97316] hover:bg-[#ea580c] rounded transition-colors shadow-sm">SAVE</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* OTHER INFO BUTTON & POPUP */}
                                    <div className="relative">
                                        <button type="button" onClick={() => toggleSection('otherInfo')} className="flex items-center gap-2 px-6 py-2 border-2 border-[#f97316] text-[#f97316] font-black rounded uppercase text-sm hover:bg-orange-50 transition-colors shadow-sm">
                                            <FileText size={16} strokeWidth={2.5} /> OTHER INFO
                                        </button>
                                        {expandedSections.otherInfo && (
                                            <div className="absolute bottom-[calc(100%+12px)] left-0 w-[350px] bg-white rounded-lg shadow-[0_0_20px_rgba(0,0,0,0.15)] border border-slate-200 z-[110] animate-in slide-in-from-bottom-2">
                                                <div className="p-3 border-b border-slate-100 bg-slate-50 font-black text-slate-800 text-sm flex justify-between items-center rounded-t-lg">
                                                    <span>Other Info</span>
                                                    <button onClick={() => setExpandedSections(p => ({...p, otherInfo: false}))} className="text-slate-400 hover:text-slate-700"><X size={16} /></button>
                                                </div>
                                                <div className="p-5 flex flex-col gap-5">
                                                    <div className="flex items-center justify-between">
                                                        <label className="text-sm font-bold text-slate-700">Food Type</label>
                                                        <select name="food_type" className="w-1/2 px-3 py-2 bg-white border-2 border-[#f97316] rounded text-sm text-slate-800 outline-none focus:ring-2 focus:ring-[#f97316]/20 transition-all font-bold" value={formData.food_type} onChange={handleInputChange}>
                                                            <option value="NONE">None</option>
                                                            <option value="VEG">Veg</option>
                                                            <option value="NON_VEG">Non-Veg</option>
                                                        </select>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <label className="text-sm font-bold text-slate-700">Online Order</label>
                                                        <label className="flex items-center cursor-pointer">
                                                            <input type="checkbox" className="hidden peer" checked={formData.online_order} onChange={(e) => setFormData(p => ({ ...p, online_order: e.target.checked }))} />
                                                            <div className="w-11 h-6 rounded-full bg-slate-300 peer-checked:bg-[#f97316] relative transition-all">
                                                                <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-all ${formData.online_order ? 'translate-x-5' : ''}`}></span>
                                                            </div>
                                                        </label>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <label className="text-sm font-bold text-slate-700">Item Active</label>
                                                        <label className="flex items-center cursor-pointer">
                                                            <input type="checkbox" className="hidden peer" checked={formData.is_active} onChange={(e) => setFormData(p => ({ ...p, is_active: e.target.checked }))} />
                                                            <div className="w-11 h-6 rounded-full bg-slate-300 peer-checked:bg-[#f97316] relative transition-all">
                                                                <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-all ${formData.is_active ? 'translate-x-5' : ''}`}></span>
                                                            </div>
                                                        </label>
                                                    </div>
                                                </div>
                                                <div className="p-3 border-t border-slate-100 bg-slate-50 flex justify-end gap-2 rounded-b-lg">
                                                    <button type="button" onClick={() => setExpandedSections(p => ({...p, otherInfo: false}))} className="px-5 py-2 text-xs font-black text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded transition-colors shadow-sm">DELETE / CLOSE</button>
                                                    <button type="button" onClick={() => setExpandedSections(p => ({...p, otherInfo: false}))} className="px-5 py-2 text-xs font-black text-white bg-[#f97316] hover:bg-[#ea580c] rounded transition-colors shadow-sm">SAVE</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* ADD ONS BUTTON & POPUP */}
                                    <div className="relative">
                                        <button type="button" onClick={() => toggleSection('addons')} className="flex items-center gap-2 px-6 py-2 border-2 border-[#f97316] text-[#f97316] font-black rounded uppercase text-sm hover:bg-orange-50 transition-colors shadow-sm">
                                            <Layers size={16} strokeWidth={2.5} /> ADD ONS
                                        </button>
                                        {expandedSections.addons && (
                                            <div className="absolute bottom-[calc(100%+12px)] left-0 w-[400px] bg-white rounded-lg shadow-[0_0_20px_rgba(0,0,0,0.15)] border border-slate-200 z-[110] animate-in slide-in-from-bottom-2">
                                                <div className="p-3 border-b border-slate-100 bg-slate-50 font-black text-slate-800 text-sm flex justify-between items-center rounded-t-lg">
                                                    <span>Add-ons</span>
                                                    <button onClick={() => setExpandedSections(p => ({...p, addons: false}))} className="text-slate-400 hover:text-slate-700"><X size={16} /></button>
                                                </div>
                                                <div className="p-4 max-h-[300px] overflow-y-auto custom-scrollbar">
                                                    <div className="flex justify-end mb-3">
                                                        <button type="button" onClick={handleAddAddon} className="px-3 py-1.5 text-[11px] font-black text-white bg-[#f97316] rounded hover:bg-[#ea580c] transition-colors shadow-sm">+ ADD ADDON</button>
                                                    </div>
                                                    <div className="flex flex-col gap-3">
                                                        {formData.addons?.length ? formData.addons.map((addon, idx) => (
                                                            <div key={idx} className="flex items-center gap-2">
                                                                <input type="text" placeholder="Addon Name" className="w-1/2 px-3 py-2 bg-white border-2 border-slate-300 rounded text-sm text-slate-800 outline-none focus:border-[#f97316] transition-all" value={addon.name} onChange={(e) => handleAddonChange(idx, 'name', e.target.value)} />
                                                                <input type="number" placeholder="Rate" className="w-1/3 px-3 py-2 bg-white border-2 border-slate-300 rounded text-sm text-slate-800 outline-none focus:border-[#f97316] transition-all" value={addon.rate} onChange={(e) => handleAddonChange(idx, 'rate', e.target.value === '' ? '' : parseFloat(e.target.value) || 0)} />
                                                                <button type="button" onClick={() => handleRemoveAddon(idx)} className="p-2 text-rose-500 hover:bg-rose-50 rounded transition-colors"><Trash2 size={16} /></button>
                                                            </div>
                                                        )) : <div className="text-sm font-bold text-slate-400 text-center py-4">No addons added.</div>}
                                                    </div>
                                                </div>
                                                <div className="p-3 border-t border-slate-100 bg-slate-50 flex justify-end gap-2 rounded-b-lg">
                                                    <button type="button" onClick={() => setExpandedSections(p => ({...p, addons: false}))} className="px-5 py-2 text-xs font-black text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded transition-colors shadow-sm">DELETE / CLOSE</button>
                                                    <button type="button" onClick={() => setExpandedSections(p => ({...p, addons: false}))} className="px-5 py-2 text-xs font-black text-white bg-[#f97316] hover:bg-[#ea580c] rounded transition-colors shadow-sm">SAVE</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* IMAGE BUTTON & POPUP */}
                                    <div className="relative">
                                        <button type="button" onClick={() => toggleSection('image')} className="flex items-center gap-2 px-6 py-2 border-2 border-[#f97316] text-[#f97316] font-black rounded uppercase text-sm hover:bg-orange-50 transition-colors shadow-sm">
                                            <ImageIcon size={16} strokeWidth={2.5} /> IMAGE
                                        </button>
                                        {expandedSections.image && (
                                            <div className="absolute bottom-[calc(100%+12px)] left-0 w-[300px] bg-white rounded-lg shadow-[0_0_20px_rgba(0,0,0,0.15)] border border-slate-200 z-[110] animate-in slide-in-from-bottom-2">
                                                <div className="p-3 border-b border-slate-100 bg-slate-50 font-black text-slate-800 text-sm flex justify-between items-center rounded-t-lg">
                                                    <span>Item Image</span>
                                                    <button onClick={() => setExpandedSections(p => ({...p, image: false}))} className="text-slate-400 hover:text-slate-700"><X size={16} /></button>
                                                </div>
                                                <div className="p-6 flex flex-col items-center justify-center gap-4">
                                                    {formData.image ? (
                                                        <div className="relative w-32 h-32 border-2 border-[#f97316] rounded overflow-hidden group shadow-md">
                                                            <img src={`${import.meta.env.VITE_API_URL.replace('/api', '')}${formData.image}`} alt="Item" className="w-full h-full object-cover" />
                                                            <div className="absolute inset-0 bg-black/60 hidden group-hover:flex items-center justify-center gap-4 transition-all">
                                                                <button type="button" className="text-white hover:text-orange-400 transition-colors" onClick={() => document.getElementById('image-upload-new').click()}><Edit size={20} /></button>
                                                                <button type="button" className="text-white hover:text-rose-500 transition-colors" onClick={() => setFormData(p => ({...p, image: ''}))}><Trash2 size={20} /></button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="w-32 h-32 border-2 border-dashed border-[#f97316] bg-orange-50/50 rounded flex flex-col items-center justify-center cursor-pointer hover:bg-orange-50 transition-colors" onClick={() => document.getElementById('image-upload-new').click()}>
                                                            <ImageIcon size={32} className="text-[#f97316] mb-2 opacity-50" />
                                                            <span className="text-[11px] font-black text-[#f97316]">UPLOAD IMAGE</span>
                                                        </div>
                                                    )}
                                                    <input id="image-upload-new" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                                                </div>
                                                <div className="p-3 border-t border-slate-100 bg-slate-50 flex justify-end gap-2 rounded-b-lg">
                                                    <button type="button" onClick={() => setExpandedSections(p => ({...p, image: false}))} className="px-5 py-2 text-xs font-black text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded transition-colors shadow-sm">DELETE / CLOSE</button>
                                                    <button type="button" onClick={() => setExpandedSections(p => ({...p, image: false}))} className="px-5 py-2 text-xs font-black text-white bg-[#f97316] hover:bg-[#ea580c] rounded transition-colors shadow-sm">SAVE</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    
                                </div>
                                
                                <button type="button" onClick={() => handleFormSubmitRequest()} disabled={submitting || uploading} className="flex items-center gap-2 px-10 py-3 bg-[#f97316] hover:bg-[#ea580c] text-white font-black rounded uppercase text-sm transition-colors shadow-md disabled:opacity-70">
                                    {submitting ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} strokeWidth={3} />} SAVE
                                </button>
                            </div>

                        </div>
                    </div>
                )}"""

content = content[:start_idx] + new_drawer + content[end_idx:]

with open('c:/Works/Mahix/restaurant/frontend/src/pages/dashboard/ProductMaster.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully replaced layout")
