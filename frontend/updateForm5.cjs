const fs = require('fs');
const filePath = 'c:/Works/Mahix/restaurant/frontend/src/pages/dashboard/ProductMaster.jsx';
let content = fs.readFileSync(filePath, 'utf8');

const startMarker = '<section className="inline-form-panel relative';
const endMarker = '</section>';

const startIndex = content.indexOf(startMarker);
if (startIndex === -1) {
    console.log("Could not find start marker.");
    process.exit(1);
}

const firstEndIndex = content.indexOf(endMarker, startIndex);
if (firstEndIndex === -1) {
    console.log("Could not find end marker.");
    process.exit(1);
}

let newForm = `
<section className="inline-form-panel relative bg-white h-[calc(100vh-80px)] flex flex-col overflow-hidden font-sans">
    <div className="flex justify-between items-center px-4 py-2 shrink-0">
        <h2 className="text-xl font-bold text-[#0F172A] uppercase tracking-wider">ITEM CREATION</h2>
        <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
                <span className="text-[13px] font-semibold text-slate-700">Type</span>
                <select name="item_nature" className="px-3 py-1 border border-[#FF5722] rounded text-[13px] font-semibold text-slate-800 outline-none w-32" value={formData.item_nature || 'GOOD'} onChange={handleInputChange}>
                    <option value="GOOD">Goods</option>
                    <option value="SERVICE">Service</option>
                </select>
            </div>
            <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); resetForm(); setShowDrawer(false); }} className="flex items-center gap-1.5 px-3 py-1 bg-white text-red-500 border border-red-500 rounded font-bold hover:bg-red-50 transition-colors text-[13px]">
                <XCircle size={16} className="pointer-events-none" /> CLOSE
            </button>
        </div>
    </div>
    
    <div className="inline-form-panel-body flex-1 flex flex-col px-4 pb-4 pt-0 w-full overflow-hidden">
        {error && (
            <div className="bg-rose-50 border border-rose-200 p-2 rounded-md flex items-center gap-2 text-rose-700 font-medium text-[13px] mb-1 shadow-sm shrink-0">
                <AlertCircle size={16} />
                {error}
            </div>
        )}
        <form id="product-form" ref={formRef} onKeyDown={(e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const formElements = Array.from(formRef.current.elements).filter(el => !el.disabled && !el.readOnly && el.tabIndex !== -1 && el.type !== 'hidden');
                const index = formElements.indexOf(document.activeElement);
                if (index > -1 && index < formElements.length - 1) {
                    formElements[index + 1].focus();
                } else if (index === formElements.length - 1) {
                    handleFormSubmitRequest();
                }
            } else if (e.key === 'Backspace') {
                if (document.activeElement.value === '' || document.activeElement.value === undefined) {
                    e.preventDefault();
                    const formElements = Array.from(formRef.current.elements).filter(el => !el.disabled && !el.readOnly && el.tabIndex !== -1 && el.type !== 'hidden');
                    const index = formElements.indexOf(document.activeElement);
                    if (index > 0) {
                        formElements[index - 1].focus();
                    }
                }
            } else {
                handleKeyDown(e);
            }
        }} onSubmit={(e) => { e.preventDefault(); handleFormSubmitRequest(); }} className="w-full flex flex-col h-full justify-between">
            
            <div className="flex flex-col flex-1 justify-around">
                
                {/* ITEM DETAILS */}
                <div>
                    <div className="flex items-center mb-3">
                        <h4 className="text-[#FF5722] font-bold uppercase text-[13px] whitespace-nowrap pr-2">ITEM DETAILS</h4>
                        <div className="h-[1px] bg-[#FF5722]/40 flex-1"></div>
                    </div>
                    
                    <div className="flex w-full divide-x divide-slate-200">
                        {/* LEFT COLUMN */}
                        <div className="flex-1 pr-6 flex flex-col gap-2.5">
                            <div className="flex items-center">
                                <label className="w-1/3 text-[13px] font-semibold text-slate-800">Barcode</label>
                                <div className="w-2/3">
                                    <input autoFocus type="text" name="barcode" className="w-full px-2 py-1 bg-white border border-[#FF5722] rounded text-[13px] outline-none focus:ring-1 focus:ring-[#FF5722]" value={formData.barcode} onChange={handleInputChange} />
                                </div>
                            </div>
                            <div className="flex items-center">
                                <label className="w-1/3 text-[13px] font-semibold text-slate-800">Code</label>
                                <div className="w-2/3 relative">
                                    <input type="text" name="code" className="w-full pl-2 pr-24 py-1 bg-white border border-[#FF5722] rounded text-[13px] outline-none focus:ring-1 focus:ring-[#FF5722]" value={formData.code} onChange={handleInputChange} />
                                    <button type="button" tabIndex="-1" className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 hover:bg-slate-100">ASSIGN CODE</button>
                                </div>
                            </div>
                            <div className="flex items-center">
                                <label className="w-1/3 text-[13px] font-semibold text-slate-800">Group <span className="text-red-500">*</span></label>
                                <div className="w-2/3 flex items-stretch">
                                    <select name="category" required className="flex-1 px-2 py-1 bg-white border border-[#FF5722] border-r-0 rounded-l text-[13px] outline-none focus:ring-1 focus:ring-[#FF5722]" value={formData.category} onChange={handleInputChange}>
                                        <option value=""></option>
                                        {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                                    </select>
                                    <button type="button" tabIndex="-1" onClick={() => setShowGroupModal(true)} className="bg-[#FF5722] text-white rounded-r px-3 flex items-center justify-center font-bold text-sm hover:bg-[#E64A19]">+</button>
                                </div>
                            </div>
                            <div className="flex items-center">
                                <label className="w-1/3 text-[13px] font-semibold text-slate-800">HSN Code</label>
                                <div className="w-2/3">
                                    <input type="text" name="hsn_code" className="w-full px-2 py-1 bg-white border border-[#FF5722] rounded text-[13px] outline-none focus:ring-1 focus:ring-[#FF5722]" value={formData.hsn_code} onChange={handleInputChange} />
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN */}
                        <div className="flex-1 pl-6 flex flex-col gap-2.5">
                            <div className="flex items-center">
                                <label className="w-1/3 text-[13px] font-semibold text-slate-800">Item Name <span className="text-red-500">*</span></label>
                                <div className="w-2/3">
                                    <input type="text" name="name" required className="w-full px-2 py-1 bg-white border border-[#FF5722] rounded text-[13px] outline-none focus:ring-1 focus:ring-[#FF5722]" value={formData.name} onChange={handleInputChange} />
                                </div>
                            </div>
                            <div className="flex items-center">
                                <label className="w-1/3 text-[13px] font-semibold text-slate-800">Print Name</label>
                                <div className="w-2/3">
                                    <input type="text" name="print_name" className="w-full px-2 py-1 bg-white border border-[#FF5722] rounded text-[13px] outline-none focus:ring-1 focus:ring-[#FF5722]" value={formData.print_name || ''} onChange={handleInputChange} />
                                </div>
                            </div>
                            <div className="flex items-center">
                                <label className="w-1/3 text-[13px] font-semibold text-slate-800">Brand</label>
                                <div className="w-2/3 flex items-stretch">
                                    <select name="brand" className="flex-1 px-2 py-1 bg-white border border-[#FF5722] border-r-0 rounded-l text-[13px] outline-none focus:ring-1 focus:ring-[#FF5722]" value={formData.brand} onChange={handleInputChange}>
                                        <option value=""></option>
                                        {brands.map(b => <option key={b._id} value={b.name}>{b.name}</option>)}
                                    </select>
                                    <button type="button" tabIndex="-1" onClick={() => setShowBrandModal(true)} className="bg-[#FF5722] text-white rounded-r px-3 flex items-center justify-center font-bold text-sm hover:bg-[#E64A19]">+</button>
                                </div>
                            </div>
                            <div className="flex items-center">
                                <label className="w-1/3 text-[13px] font-semibold text-slate-800">Unit <span className="text-red-500">*</span></label>
                                <div className="w-2/3 flex items-stretch">
                                    <select name="unit" required className="flex-1 px-2 py-1 bg-white border border-[#FF5722] border-r-0 rounded-l text-[13px] outline-none focus:ring-1 focus:ring-[#FF5722] uppercase" value={formData.unit} onChange={handleInputChange}>
                                        <option value="">SELECT UNIT</option>
                                        {units.map(u => <option key={u._id} value={u.name}>{u.name}</option>)}
                                    </select>
                                    <button type="button" tabIndex="-1" onClick={() => setShowUnitModal(true)} className="bg-[#FF5722] text-white rounded-r px-3 flex items-center justify-center font-bold text-sm hover:bg-[#E64A19]">+</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RATE & TAX DETAILS (Side by Side Sections) */}
                <div className="flex w-full divide-x divide-slate-200 mt-2">
                    
                    {/* RATE DETAILS */}
                    <div className="flex-1 pr-6 flex flex-col justify-between">
                        <div className="flex items-center mb-3">
                            <h4 className="text-[#FF5722] font-bold uppercase text-[13px] whitespace-nowrap pr-2">RATE DETAILS</h4>
                            <div className="h-[1px] bg-[#FF5722]/40 flex-1"></div>
                        </div>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                            <div className="flex items-center">
                                <label className="w-1/2 text-[12px] font-semibold text-slate-800">Pur Rate</label>
                                <div className="w-1/2">
                                    <input type="text" inputMode="decimal" name="purchase_price" className="w-full px-2 py-1 bg-white border border-[#FF5722] rounded text-[13px] outline-none focus:ring-1 focus:ring-[#FF5722]" value={formData.purchase_price} onChange={handleInputChange} />
                                </div>
                            </div>
                            <div className="flex items-center">
                                <label className="w-1/2 text-[12px] font-semibold text-slate-800">Cost Rate</label>
                                <div className="w-1/2">
                                    <input type="text" inputMode="decimal" name="cost_price" className="w-full px-2 py-1 bg-white border border-[#FF5722] rounded text-[13px] outline-none focus:ring-1 focus:ring-[#FF5722]" value={formData.cost_price} onChange={handleInputChange} />
                                </div>
                            </div>
                            <div className="flex items-center">
                                <label className="w-1/2 text-[12px] font-semibold text-slate-800">Sale Rate <span className="text-red-500">*</span></label>
                                <div className="w-1/2">
                                    <input type="text" inputMode="decimal" name="selling_price" required className="w-full px-2 py-1 bg-white border border-[#FF5722] rounded text-[13px] outline-none focus:ring-1 focus:ring-[#FF5722]" value={formData.selling_price} onChange={handleInputChange} />
                                </div>
                            </div>
                            <div className="flex items-center">
                                <label className="w-1/2 text-[12px] font-semibold text-slate-800">MRP Rate</label>
                                <div className="w-1/2">
                                    <input type="text" inputMode="decimal" name="mrp" className="w-full px-2 py-1 bg-white border border-[#FF5722] rounded text-[13px] outline-none focus:ring-1 focus:ring-[#FF5722]" value={formData.mrp} onChange={handleInputChange} />
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* TAX DETAILS */}
                    <div className="flex-1 pl-6 flex flex-col justify-between">
                        <div className="flex items-center mb-3">
                            <h4 className="text-[#FF5722] font-bold uppercase text-[13px] whitespace-nowrap pr-2">TAX DETAILS</h4>
                            <div className="h-[1px] bg-[#FF5722]/40 flex-1"></div>
                        </div>
                        <div className="flex items-center w-[60%] mb-2.5">
                            <label className="w-1/3 text-[12px] font-semibold text-slate-800">Tax slab <span className="text-red-500">*</span></label>
                            <div className="w-2/3 flex items-stretch">
                                <select name="tax_id" className="flex-1 px-2 py-1 bg-white border border-[#FF5722] border-r-0 rounded-l text-[13px] outline-none focus:ring-1 focus:ring-[#FF5722]" value={formData.tax_id} onChange={handleInputChange}>
                                    <option value=""></option>
                                    {taxes.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                                </select>
                                <button type="button" tabIndex="-1" onClick={() => setShowTaxModal(true)} className="bg-[#FF5722] text-white rounded-r px-3 flex items-center justify-center font-bold hover:bg-[#E64A19]">+</button>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                            <div className="flex items-center">
                                <label className="w-1/2 text-[12px] font-semibold text-slate-800">GST Sale(%)</label>
                                <div className="w-1/2">
                                    <input type="text" tabIndex="-1" readOnly name="gst_sales" className="w-full px-2 py-1 bg-slate-50 border border-[#FF5722] rounded text-[13px] text-slate-500 outline-none" value={formData.gst_sales || ''} />
                                </div>
                            </div>
                            <div className="flex items-center">
                                <label className="w-1/2 text-[12px] font-semibold text-slate-800">IGST Sale(%)</label>
                                <div className="w-1/2">
                                    <input type="text" tabIndex="-1" readOnly name="igst_sales" className="w-full px-2 py-1 bg-slate-50 border border-[#FF5722] rounded text-[13px] text-slate-500 outline-none" value={formData.igst_sales || ''} />
                                </div>
                            </div>
                            <div className="flex items-center">
                                <label className="w-1/2 text-[12px] font-semibold text-slate-800">GST Pur(%)</label>
                                <div className="w-1/2">
                                    <input type="text" tabIndex="-1" readOnly name="gst_purchase" className="w-full px-2 py-1 bg-slate-50 border border-[#FF5722] rounded text-[13px] text-slate-500 outline-none" value={formData.gst_purchase || ''} />
                                </div>
                            </div>
                            <div className="flex items-center">
                                <label className="w-1/2 text-[12px] font-semibold text-slate-800">IGST Pur(%)</label>
                                <div className="w-1/2">
                                    <input type="text" tabIndex="-1" readOnly name="igst_purchase" className="w-full px-2 py-1 bg-slate-50 border border-[#FF5722] rounded text-[13px] text-slate-500 outline-none" value={formData.igst_purchase || ''} />
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* STOCK DETAILS */}
                <div className="mt-2">
                    <div className="flex items-center mb-3">
                        <h4 className="text-[#FF5722] font-bold uppercase text-[13px] whitespace-nowrap pr-2">STOCK DETAILS</h4>
                        <div className="h-[1px] bg-[#FF5722]/40 flex-1"></div>
                    </div>
                    <div className="grid grid-cols-3 gap-x-8 gap-y-2.5">
                        <div className="flex items-center">
                            <label className="w-1/3 text-[12px] font-semibold text-slate-800">Opening Stk</label>
                            <div className="w-2/3">
                                <input type="text" inputMode="decimal" name="opening_stock" className="w-full px-2 py-1 bg-white border border-[#FF5722] rounded text-[13px] outline-none focus:ring-1 focus:ring-[#FF5722]" value={formData.opening_stock || ''} onChange={handleInputChange} />
                            </div>
                        </div>
                        <div className="flex items-center pl-2">
                            <label className="w-1/3 text-[12px] font-semibold text-slate-800">Maximum Stk</label>
                            <div className="w-2/3">
                                <input type="text" inputMode="decimal" name="max_stock" className="w-full px-2 py-1 bg-white border border-[#FF5722] rounded text-[13px] outline-none focus:ring-1 focus:ring-[#FF5722]" value={formData.max_stock} onChange={handleInputChange} />
                            </div>
                        </div>
                        <div className="flex items-center pl-2">
                            <label className="w-[40%] text-[12px] font-semibold text-slate-800">Re-order Level</label>
                            <div className="w-[60%]">
                                <input type="text" inputMode="decimal" name="reorder_level" className="w-full px-2 py-1 bg-white border border-[#FF5722] rounded text-[13px] outline-none focus:ring-1 focus:ring-[#FF5722]" value={formData.reorder_level} onChange={handleInputChange} />
                            </div>
                        </div>
                        
                        <div className="flex items-center">
                            <label className="w-1/3 text-[12px] font-semibold text-slate-800">Stock Value</label>
                            <div className="w-2/3">
                                <input type="text" tabIndex="-1" readOnly className="w-full px-2 py-1 bg-slate-50 border border-[#FF5722] rounded text-[13px] text-slate-500 outline-none" value={((parseFloat(formData.opening_stock) || 0) * (parseFloat(formData.purchase_price) || parseFloat(formData.cost_price) || 0)).toFixed(2)} />
                            </div>
                        </div>
                        <div className="flex items-center pl-2">
                            <label className="w-1/3 text-[12px] font-semibold text-slate-800">Minimum Stock</label>
                            <div className="w-2/3">
                                <input type="text" inputMode="decimal" name="min_stock" className="w-full px-2 py-1 bg-white border border-[#FF5722] rounded text-[13px] outline-none focus:ring-1 focus:ring-[#FF5722]" value={formData.min_stock} onChange={handleInputChange} />
                            </div>
                        </div>
                        <div className="flex items-center pl-2">
                            <label className="w-[40%] text-[12px] font-semibold text-slate-800">Urgent Order Stk</label>
                            <div className="w-[60%]">
                                <input type="text" inputMode="decimal" name="urgent_order_level" className="w-full px-2 py-1 bg-white border border-[#FF5722] rounded text-[13px] outline-none focus:ring-1 focus:ring-[#FF5722]" value={formData.urgent_order_level} onChange={handleInputChange} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* BOTTOM ACTION BUTTONS */}
            <div className="flex justify-between items-center mt-3 pt-3 shrink-0">
                <div className="flex gap-4">
                    <button type="button" tabIndex="-1" onClick={() => toggleSection('variations')} className="flex items-center justify-center gap-1.5 px-6 py-2 bg-white text-[#FF5722] border border-[#FF5722] rounded text-[13px] font-bold hover:bg-[#FF5722]/5 transition-colors">
                        <Package size={16} /> VARIATIONS
                    </button>
                    <button type="button" tabIndex="-1" onClick={() => toggleSection('otherInfo')} className="flex items-center justify-center gap-1.5 px-6 py-2 bg-white text-[#FF5722] border border-[#FF5722] rounded text-[13px] font-bold hover:bg-[#FF5722]/5 transition-colors">
                        <FileText size={16} /> OTHER INFO
                    </button>
                    <button type="button" tabIndex="-1" onClick={() => toggleSection('addons')} className="flex items-center justify-center gap-1.5 px-6 py-2 bg-white text-[#FF5722] border border-[#FF5722] rounded text-[13px] font-bold hover:bg-[#FF5722]/5 transition-colors">
                        <Puzzle size={16} /> ADD ONS
                    </button>
                    <button type="button" tabIndex="-1" onClick={() => document.getElementById('image-upload').click()} className="flex items-center justify-center gap-1.5 px-6 py-2 bg-white text-[#FF5722] border border-[#FF5722] rounded text-[13px] font-bold hover:bg-[#FF5722]/5 transition-colors relative">
                        <ImageIcon size={16} /> IMAGE
                        <input id="image-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                        {formData.image && <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white"></span>}
                    </button>
                </div>
                <button type="submit" form="product-form" disabled={submitting || uploading} className="flex items-center justify-center gap-2 px-10 py-2 bg-[#FF5722] text-white rounded text-[13px] font-bold hover:bg-[#E64A19] shadow-sm transition-colors">
                    {submitting ? <Loader2 className="animate-spin" size={16} /> : <><Save size={16} /> SAVE</>}
                </button>
            </div>
            
            {/* POPUPS */}
            {expandedSections.variations && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center">
                    <div className="bg-white w-[500px] rounded-lg shadow-xl flex flex-col">
                        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="font-bold text-[#FF5722] text-sm">VARIATIONS</h3>
                            <button type="button" onClick={() => toggleSection('variations')} className="text-slate-400 hover:text-red-500"><X size={18}/></button>
                        </div>
                        <div className="p-5 flex-1 max-h-[60vh] overflow-y-auto flex flex-col gap-4">
                            <div className="flex justify-end">
                                <button type="button" onClick={handleAddVariation} className="px-4 py-1.5 text-[13px] font-bold text-white bg-[#FF5722] rounded hover:bg-[#E64A19] transition-colors">+ ADD VARIANT</button>
                            </div>
                            {formData.variations?.length ? formData.variations.map((v, idx) => (
                                <div key={idx} className="flex items-center gap-3">
                                    <input type="text" placeholder="Variant Name" className="flex-1 px-3 py-1.5 bg-white border border-[#FF5722] rounded text-[13px] outline-none" value={v.name} onChange={(e) => handleVariationChange(idx, 'name', e.target.value)} />
                                    <input type="number" placeholder="Rate" className="w-24 px-3 py-1.5 bg-white border border-[#FF5722] rounded text-[13px] outline-none" value={v.amount} onChange={(e) => handleVariationChange(idx, 'amount', e.target.value === '' ? '' : parseFloat(e.target.value) || 0)} />
                                    <button type="button" onClick={() => handleRemoveVariation(idx)} className="text-red-500 hover:text-red-700 bg-red-50 p-2 rounded transition-colors"><Trash2 size={16} /></button>
                                </div>
                            )) : <div className="text-[13px] text-slate-500 text-center">No variations added.</div>}
                        </div>
                        <div className="p-4 border-t border-slate-200 flex justify-end gap-3">
                            <button type="button" onClick={() => toggleSection('variations')} className="px-6 py-1.5 bg-slate-100 text-slate-600 text-[13px] font-bold rounded hover:bg-slate-200 transition-colors">CANCEL</button>
                            <button type="button" onClick={() => toggleSection('variations')} className="px-6 py-1.5 bg-[#FF5722] text-white text-[13px] font-bold rounded hover:bg-[#E64A19] transition-colors">SAVE</button>
                        </div>
                    </div>
                </div>
            )}
            
            {expandedSections.addons && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center">
                    <div className="bg-white w-[500px] rounded-lg shadow-xl flex flex-col">
                        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="font-bold text-[#FF5722] text-sm">ADD ONS</h3>
                            <button type="button" onClick={() => toggleSection('addons')} className="text-slate-400 hover:text-red-500"><X size={18}/></button>
                        </div>
                        <div className="p-5 flex-1 max-h-[60vh] overflow-y-auto flex flex-col gap-4">
                            <div className="flex justify-end">
                                <button type="button" onClick={handleAddAddon} className="px-4 py-1.5 text-[13px] font-bold text-white bg-[#FF5722] rounded hover:bg-[#E64A19] transition-colors">+ ADD ADDON</button>
                            </div>
                            {formData.addons?.length ? formData.addons.map((addon, idx) => (
                                <div key={idx} className="flex items-center gap-3">
                                    <input type="text" placeholder="Addon Name" className="flex-1 px-3 py-1.5 bg-white border border-[#FF5722] rounded text-[13px] outline-none" value={addon.name} onChange={(e) => handleAddonChange(idx, 'name', e.target.value)} />
                                    <input type="number" placeholder="Rate" className="w-24 px-3 py-1.5 bg-white border border-[#FF5722] rounded text-[13px] outline-none" value={addon.rate} onChange={(e) => handleAddonChange(idx, 'rate', e.target.value === '' ? '' : parseFloat(e.target.value) || 0)} />
                                    <button type="button" onClick={() => handleRemoveAddon(idx)} className="text-red-500 hover:text-red-700 bg-red-50 p-2 rounded transition-colors"><Trash2 size={16} /></button>
                                </div>
                            )) : <div className="text-[13px] text-slate-500 text-center">No addons added.</div>}
                        </div>
                        <div className="p-4 border-t border-slate-200 flex justify-end gap-3">
                            <button type="button" onClick={() => toggleSection('addons')} className="px-6 py-1.5 bg-slate-100 text-slate-600 text-[13px] font-bold rounded hover:bg-slate-200 transition-colors">CANCEL</button>
                            <button type="button" onClick={() => toggleSection('addons')} className="px-6 py-1.5 bg-[#FF5722] text-white text-[13px] font-bold rounded hover:bg-[#E64A19] transition-colors">SAVE</button>
                        </div>
                    </div>
                </div>
            )}
            
            {expandedSections.otherInfo && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center">
                    <div className="bg-white w-[500px] rounded-lg shadow-xl flex flex-col">
                        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="font-bold text-[#FF5722] text-sm">OTHER INFO</h3>
                            <button type="button" onClick={() => toggleSection('otherInfo')} className="text-slate-400 hover:text-red-500"><X size={18}/></button>
                        </div>
                        <div className="p-5 flex-1 max-h-[60vh] overflow-y-auto flex flex-col gap-5">
                            <div className="flex items-center">
                                <label className="w-1/3 text-[13px] font-semibold text-slate-800">Food Type</label>
                                <div className="w-2/3">
                                    <select name="food_type" className="w-full px-3 py-1.5 bg-white border border-[#FF5722] rounded text-[13px] outline-none" value={formData.food_type} onChange={handleInputChange}>
                                        <option value="NONE">None</option>
                                        <option value="VEG">Veg</option>
                                        <option value="NON_VEG">Non-Veg</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex items-center">
                                <label className="w-1/3 text-[13px] font-semibold text-slate-800">Online Order</label>
                                <div className="w-2/3 flex items-center">
                                    <label className="flex items-center cursor-pointer">
                                        <input type="checkbox" className="hidden peer" checked={formData.online_order} onChange={(e) => setFormData(p => ({ ...p, online_order: e.target.checked }))} />
                                        <div className="w-10 h-5 rounded-full bg-slate-300 peer-checked:bg-[#FF5722] relative transition-all">
                                            <span className={"absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-all " + (formData.online_order ? 'translate-x-5' : '')}></span>
                                        </div>
                                    </label>
                                </div>
                            </div>
                            <div className="flex items-center">
                                <label className="w-1/3 text-[13px] font-semibold text-slate-800">Item Active</label>
                                <div className="w-2/3 flex items-center">
                                    <label className="flex items-center cursor-pointer">
                                        <input type="checkbox" className="hidden peer" checked={formData.is_active} onChange={(e) => setFormData(p => ({ ...p, is_active: e.target.checked }))} />
                                        <div className="w-10 h-5 rounded-full bg-slate-300 peer-checked:bg-[#FF5722] relative transition-all">
                                            <span className={"absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-all " + (formData.is_active ? 'translate-x-5' : '')}></span>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 border-t border-slate-200 flex justify-end gap-3">
                            <button type="button" onClick={() => toggleSection('otherInfo')} className="px-6 py-1.5 bg-slate-100 text-slate-600 text-[13px] font-bold rounded hover:bg-slate-200 transition-colors">CANCEL</button>
                            <button type="button" onClick={() => toggleSection('otherInfo')} className="px-6 py-1.5 bg-[#FF5722] text-white text-[13px] font-bold rounded hover:bg-[#E64A19] transition-colors">SAVE</button>
                        </div>
                    </div>
                </div>
            )}
        </form>
    </div>
</section>
`;

content = content.substring(0, startIndex) + newForm + content.substring(firstEndIndex + endMarker.length);
fs.writeFileSync(filePath, content);
console.log("Successfully replaced the inline-form-panel section.");
