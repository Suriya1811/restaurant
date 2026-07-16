const fs = require('fs');
const filePath = 'c:/Works/Mahix/restaurant/frontend/src/pages/dashboard/ProductMaster.jsx';
let content = fs.readFileSync(filePath, 'utf8');

const startMarker = '<section className="inline-form-panel relative">';
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
<section className="inline-form-panel relative bg-white min-h-[calc(100vh-200px)] p-6 rounded-lg shadow-sm">
    <div className="flex justify-between items-center mb-6 border-b pb-4 border-slate-200">
        <h2 className="text-xl font-black text-[#0F172A] uppercase tracking-wider">ITEM CREATION</h2>
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[#0F172A]">Type</span>
                <select name="item_nature" className="px-3 py-1.5 border-2 border-orange-500 rounded text-sm font-bold text-[#0F172A] outline-none" value={formData.item_nature || 'GOOD'} onChange={handleInputChange}>
                    <option value="GOOD">Goods</option>
                    <option value="SERVICE">Service</option>
                </select>
            </div>
            <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); resetForm(); setShowDrawer(false); }} className="flex items-center gap-2 px-4 py-1.5 bg-red-50 text-red-500 border border-red-200 rounded font-bold hover:bg-red-100 transition-colors">
                <X size={16} className="pointer-events-none" /> CLOSE
            </button>
        </div>
    </div>
    
    <div className="inline-form-panel-body !p-0">
        {error && (
            <div className="bg-rose-50 border border-rose-200 p-4 rounded-none flex items-center gap-3 text-rose-700 font-medium text-sm mb-6 shadow-sm">
                <AlertCircle size={20} />
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
        }} onSubmit={(e) => { e.preventDefault(); handleFormSubmitRequest(); }} className="mx-auto w-full max-w-full flex flex-col gap-6">
            
            {/* ITEM DETAILS */}
            <div>
                <h4 className="text-orange-500 font-black uppercase text-xs mb-3 border-b border-orange-200 pb-1">ITEM DETAILS</h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-4">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center">
                            <label className="w-1/3 text-xs font-semibold text-[#0F172A]">Barcode</label>
                            <div className="w-2/3">
                                <input autoFocus type="text" name="barcode" className="w-full px-2 py-1.5 bg-white border border-orange-200 rounded text-xs text-[#0F172A] outline-none focus:border-orange-500 transition-colors" value={formData.barcode} onChange={handleInputChange} />
                            </div>
                        </div>
                        <div className="flex items-center">
                            <label className="w-1/3 text-xs font-semibold text-[#0F172A]">Code</label>
                            <div className="w-2/3 relative">
                                <input type="text" name="code" className="w-full pl-2 pr-20 py-1.5 bg-white border border-orange-200 rounded text-xs text-[#0F172A] outline-none focus:border-orange-500 transition-colors" value={formData.code} onChange={handleInputChange} />
                                <button type="button" tabIndex="-1" className="absolute right-1 top-1/2 -translate-y-1/2 text-[9px] font-bold text-[#0F172A] bg-white px-2 py-0.5 rounded border border-slate-300 hover:bg-slate-50 transition-colors">ASSIGN CODE</button>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <label className="w-1/3 text-xs font-semibold text-[#0F172A]">Group <span className="text-red-500">*</span></label>
                            <div className="w-2/3 flex items-center gap-1">
                                <select name="category" required className="flex-1 px-2 py-1.5 bg-white border border-orange-200 rounded text-xs text-[#0F172A] outline-none focus:border-orange-500 transition-colors" value={formData.category} onChange={handleInputChange}>
                                    <option value="">Choose Class</option>
                                    {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                                </select>
                                <button type="button" tabIndex="-1" onClick={() => setShowGroupModal(true)} className="bg-orange-500 text-white hover:bg-orange-600 rounded px-2 py-1.5 transition-colors font-bold text-xs">+</button>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <label className="w-1/3 text-xs font-semibold text-[#0F172A]">HSN Code</label>
                            <div className="w-2/3">
                                <input type="text" name="hsn_code" className="w-full px-2 py-1.5 bg-white border border-orange-200 rounded text-xs text-[#0F172A] outline-none focus:border-orange-500 transition-colors" value={formData.hsn_code} onChange={handleInputChange} />
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center">
                            <label className="w-1/3 text-xs font-semibold text-[#0F172A]">Item Name <span className="text-red-500">*</span></label>
                            <div className="w-2/3">
                                <input type="text" name="name" required className="w-full px-2 py-1.5 bg-white border border-orange-200 rounded text-xs text-[#0F172A] outline-none focus:border-orange-500 transition-colors" value={formData.name} onChange={handleInputChange} />
                            </div>
                        </div>
                        <div className="flex items-center">
                            <label className="w-1/3 text-xs font-semibold text-[#0F172A]">Print Name</label>
                            <div className="w-2/3">
                                <input type="text" name="print_name" className="w-full px-2 py-1.5 bg-white border border-orange-200 rounded text-xs text-[#0F172A] outline-none focus:border-orange-500 transition-colors" value={formData.print_name || ''} onChange={handleInputChange} />
                            </div>
                        </div>
                        <div className="flex items-center">
                            <label className="w-1/3 text-xs font-semibold text-[#0F172A]">Brand <span className="text-red-500">*</span></label>
                            <div className="w-2/3 flex items-center gap-1">
                                <select name="brand" required className="flex-1 px-2 py-1.5 bg-white border border-orange-200 rounded text-xs text-[#0F172A] outline-none focus:border-orange-500 transition-colors" value={formData.brand} onChange={handleInputChange}>
                                    <option value="">Generic</option>
                                    {brands.map(b => <option key={b._id} value={b.name}>{b.name}</option>)}
                                </select>
                                <button type="button" tabIndex="-1" onClick={() => setShowBrandModal(true)} className="bg-orange-500 text-white hover:bg-orange-600 rounded px-2 py-1.5 transition-colors font-bold text-xs">+</button>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <label className="w-1/3 text-xs font-semibold text-[#0F172A]">Unit <span className="text-red-500">*</span></label>
                            <div className="w-2/3 flex items-center gap-1">
                                <select name="unit" required className="flex-1 px-2 py-1.5 bg-white border border-orange-200 rounded text-xs text-[#0F172A] outline-none focus:border-orange-500 transition-colors uppercase" value={formData.unit} onChange={handleInputChange}>
                                    <option value="">SELECT UNIT</option>
                                    {units.map(u => <option key={u._id} value={u.name}>{u.name}</option>)}
                                </select>
                                <button type="button" tabIndex="-1" onClick={() => setShowUnitModal(true)} className="bg-orange-500 text-white hover:bg-orange-600 rounded px-2 py-1.5 transition-colors font-bold text-xs">+</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* RATE & TAX DETAILS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-6">
                <div>
                    <h4 className="text-orange-500 font-black uppercase text-xs mb-3 border-b border-orange-200 pb-1">RATE DETAILS</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center">
                            <label className="w-1/2 text-xs font-semibold text-[#0F172A]">Pur Rate</label>
                            <div className="w-1/2">
                                <input type="text" inputMode="decimal" name="purchase_price" className="w-full px-2 py-1.5 bg-white border border-orange-200 rounded text-xs text-[#0F172A] outline-none focus:border-orange-500 transition-colors" value={formData.purchase_price} onChange={handleInputChange} />
                            </div>
                        </div>
                        <div className="flex items-center">
                            <label className="w-1/2 text-xs font-semibold text-[#0F172A]">Cost Rate</label>
                            <div className="w-1/2">
                                <input type="text" inputMode="decimal" name="cost_price" className="w-full px-2 py-1.5 bg-white border border-orange-200 rounded text-xs text-[#0F172A] outline-none focus:border-orange-500 transition-colors" value={formData.cost_price} onChange={handleInputChange} />
                            </div>
                        </div>
                        <div className="flex items-center">
                            <label className="w-1/2 text-xs font-semibold text-[#0F172A]">Sale Rate <span className="text-red-500">*</span></label>
                            <div className="w-1/2">
                                <input type="text" inputMode="decimal" name="selling_price" required className="w-full px-2 py-1.5 bg-white border border-orange-200 rounded text-xs text-[#0F172A] outline-none focus:border-orange-500 transition-colors shadow-sm" value={formData.selling_price} onChange={handleInputChange} />
                            </div>
                        </div>
                        <div className="flex items-center">
                            <label className="w-1/2 text-xs font-semibold text-[#0F172A]">MRP Rate</label>
                            <div className="w-1/2">
                                <input type="text" inputMode="decimal" name="mrp" className="w-full px-2 py-1.5 bg-white border border-orange-200 rounded text-xs text-[#0F172A] outline-none focus:border-orange-500 transition-colors" value={formData.mrp} onChange={handleInputChange} />
                            </div>
                        </div>
                    </div>
                </div>
                <div>
                    <h4 className="text-orange-500 font-black uppercase text-xs mb-3 border-b border-orange-200 pb-1">TAX DETAILS</h4>
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center">
                            <label className="w-1/3 text-xs font-semibold text-[#0F172A]">Tax slab <span className="text-red-500">*</span></label>
                            <div className="w-2/3 flex items-center gap-1">
                                <select name="tax_id" required className="flex-1 px-2 py-1.5 bg-white border border-orange-200 rounded text-xs text-[#0F172A] outline-none focus:border-orange-500 transition-colors" value={formData.tax_id} onChange={handleInputChange}>
                                    <option value="">Select GST Slab</option>
                                    {taxes.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                                </select>
                                <button type="button" tabIndex="-1" onClick={() => setShowTaxModal(true)} className="bg-orange-500 text-white hover:bg-orange-600 rounded px-2 py-1.5 transition-colors font-bold text-xs">+</button>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center">
                                <label className="w-1/2 text-xs font-semibold text-[#0F172A]">GST Sale (%)</label>
                                <div className="w-1/2">
                                    <input type="text" tabIndex="-1" readOnly name="gst_sales" className="w-full px-2 py-1.5 bg-slate-50 border border-orange-200 rounded text-xs text-slate-500 outline-none cursor-not-allowed" value={formData.gst_sales || ''} />
                                </div>
                            </div>
                            <div className="flex items-center">
                                <label className="w-1/2 text-xs font-semibold text-[#0F172A]">IGST Sale (%)</label>
                                <div className="w-1/2">
                                    <input type="text" tabIndex="-1" readOnly name="igst_sales" className="w-full px-2 py-1.5 bg-slate-50 border border-orange-200 rounded text-xs text-slate-500 outline-none cursor-not-allowed" value={formData.igst_sales || ''} />
                                </div>
                            </div>
                            <div className="flex items-center">
                                <label className="w-1/2 text-xs font-semibold text-[#0F172A]">GST Purchase (%)</label>
                                <div className="w-1/2">
                                    <input type="text" tabIndex="-1" readOnly name="gst_purchase" className="w-full px-2 py-1.5 bg-slate-50 border border-orange-200 rounded text-xs text-slate-500 outline-none cursor-not-allowed" value={formData.gst_purchase || ''} />
                                </div>
                            </div>
                            <div className="flex items-center">
                                <label className="w-1/2 text-xs font-semibold text-[#0F172A]">IGST Purchase (%)</label>
                                <div className="w-1/2">
                                    <input type="text" tabIndex="-1" readOnly name="igst_purchase" className="w-full px-2 py-1.5 bg-slate-50 border border-orange-200 rounded text-xs text-slate-500 outline-none cursor-not-allowed" value={formData.igst_purchase || ''} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* STOCK DETAILS */}
            <div>
                <h4 className="text-orange-500 font-black uppercase text-xs mb-3 border-b border-orange-200 pb-1">STOCK DETAILS</h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center">
                            <label className="w-1/2 text-xs font-semibold text-[#0F172A]">Minimum Stock</label>
                            <div className="w-1/2">
                                <input type="text" inputMode="decimal" name="min_stock" className="w-full px-2 py-1.5 bg-white border border-orange-200 rounded text-xs text-[#0F172A] outline-none focus:border-orange-500 transition-colors" value={formData.min_stock} onChange={handleInputChange} />
                            </div>
                        </div>
                        <div className="flex items-center">
                            <label className="w-1/2 text-xs font-semibold text-[#0F172A]">Maximum Stock</label>
                            <div className="w-1/2">
                                <input type="text" inputMode="decimal" name="max_stock" className="w-full px-2 py-1.5 bg-white border border-orange-200 rounded text-xs text-[#0F172A] outline-none focus:border-orange-500 transition-colors" value={formData.max_stock} onChange={handleInputChange} />
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center">
                            <label className="w-1/2 text-xs font-semibold text-[#0F172A]">Re-order Level</label>
                            <div className="w-1/2">
                                <input type="text" inputMode="decimal" name="reorder_level" className="w-full px-2 py-1.5 bg-white border border-orange-200 rounded text-xs text-[#0F172A] outline-none focus:border-orange-500 transition-colors" value={formData.reorder_level} onChange={handleInputChange} />
                            </div>
                        </div>
                        <div className="flex items-center">
                            <label className="w-1/2 text-xs font-semibold text-[#0F172A]">Urgent Order Stk</label>
                            <div className="w-1/2">
                                <input type="text" inputMode="decimal" name="urgent_order_level" className="w-full px-2 py-1.5 bg-white border border-orange-200 rounded text-xs text-[#0F172A] outline-none focus:border-orange-500 transition-colors" value={formData.urgent_order_level} onChange={handleInputChange} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* BOTTOM ACTION BUTTONS */}
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-200">
                <div className="flex gap-4">
                    <button type="button" tabIndex="-1" onClick={() => toggleSection('variations')} className="flex items-center gap-2 px-6 py-2 bg-white text-orange-500 border border-orange-500 rounded font-bold hover:bg-orange-50 transition-colors">
                        <Package size={16} /> VARIATIONS
                    </button>
                    <button type="button" tabIndex="-1" onClick={() => toggleSection('otherInfo')} className="flex items-center gap-2 px-6 py-2 bg-white text-orange-500 border border-orange-500 rounded font-bold hover:bg-orange-50 transition-colors">
                        <FileText size={16} /> OTHER INFO
                    </button>
                    <button type="button" tabIndex="-1" onClick={() => toggleSection('addons')} className="flex items-center gap-2 px-6 py-2 bg-white text-orange-500 border border-orange-500 rounded font-bold hover:bg-orange-50 transition-colors">
                        <Puzzle size={16} /> ADD ONS
                    </button>
                    <button type="button" tabIndex="-1" onClick={() => document.getElementById('image-upload').click()} className="flex items-center gap-2 px-6 py-2 bg-white text-orange-500 border border-orange-500 rounded font-bold hover:bg-orange-50 transition-colors relative">
                        <ImageIcon size={16} /> IMAGE
                        <input id="image-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                        {formData.image && <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>}
                    </button>
                </div>
                <button type="submit" form="product-form" disabled={submitting || uploading} className="flex items-center gap-2 px-10 py-2 bg-orange-500 text-white rounded font-bold hover:bg-orange-600 transition-colors shadow-sm">
                    {submitting ? <Loader2 className="animate-spin" size={16} /> : <><Save size={16} /> SAVE</>}
                </button>
            </div>
            
            {/* POPUPS */}
            {expandedSections.variations && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center">
                    <div className="bg-white w-[500px] rounded-lg shadow-xl flex flex-col">
                        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="font-bold text-orange-500">VARIATIONS</h3>
                            <button type="button" onClick={() => toggleSection('variations')} className="text-slate-400 hover:text-red-500"><X size={20}/></button>
                        </div>
                        <div className="p-6 flex-1 max-h-[60vh] overflow-y-auto flex flex-col gap-4">
                            <div className="flex justify-end">
                                <button type="button" onClick={handleAddVariation} className="px-3 py-1.5 text-xs font-bold text-white bg-orange-500 rounded hover:bg-orange-600">+ ADD VARIANT</button>
                            </div>
                            {formData.variations?.length ? formData.variations.map((v, idx) => (
                                <div key={idx} className="flex items-center gap-3">
                                    <input type="text" placeholder="Variant Name (e.g. Medium)" className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded text-sm text-[#0F172A] outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors" value={v.name} onChange={(e) => handleVariationChange(idx, 'name', e.target.value)} />
                                    <input type="number" placeholder="Rate" className="w-24 px-3 py-2 bg-white border border-slate-300 rounded text-sm text-[#0F172A] outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors" value={v.amount} onChange={(e) => handleVariationChange(idx, 'amount', e.target.value === '' ? '' : parseFloat(e.target.value) || 0)} />
                                    <button type="button" onClick={() => handleRemoveVariation(idx)} className="text-red-500 hover:text-red-700 bg-red-50 p-2 rounded"><Trash2 size={16} /></button>
                                </div>
                            )) : <div className="text-sm text-slate-500 text-center">No variations added.</div>}
                        </div>
                        <div className="p-4 border-t border-slate-200 flex justify-end gap-3">
                            <button type="button" onClick={() => toggleSection('variations')} className="px-6 py-2 bg-slate-100 text-slate-600 font-bold rounded hover:bg-slate-200">CANCEL</button>
                            <button type="button" onClick={() => toggleSection('variations')} className="px-6 py-2 bg-orange-500 text-white font-bold rounded hover:bg-orange-600">SAVE</button>
                        </div>
                    </div>
                </div>
            )}
            
            {expandedSections.addons && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center">
                    <div className="bg-white w-[500px] rounded-lg shadow-xl flex flex-col">
                        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="font-bold text-orange-500">ADD ONS</h3>
                            <button type="button" onClick={() => toggleSection('addons')} className="text-slate-400 hover:text-red-500"><X size={20}/></button>
                        </div>
                        <div className="p-6 flex-1 max-h-[60vh] overflow-y-auto flex flex-col gap-4">
                            <div className="flex justify-end">
                                <button type="button" onClick={handleAddAddon} className="px-3 py-1.5 text-xs font-bold text-white bg-orange-500 rounded hover:bg-orange-600">+ ADD ADDON</button>
                            </div>
                            {formData.addons?.length ? formData.addons.map((addon, idx) => (
                                <div key={idx} className="flex items-center gap-3">
                                    <input type="text" placeholder="Addon Name (e.g. Extra Cheese)" className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded text-sm text-[#0F172A] outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors" value={addon.name} onChange={(e) => handleAddonChange(idx, 'name', e.target.value)} />
                                    <input type="number" placeholder="Rate" className="w-24 px-3 py-2 bg-white border border-slate-300 rounded text-sm text-[#0F172A] outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors" value={addon.rate} onChange={(e) => handleAddonChange(idx, 'rate', e.target.value === '' ? '' : parseFloat(e.target.value) || 0)} />
                                    <button type="button" onClick={() => handleRemoveAddon(idx)} className="text-red-500 hover:text-red-700 bg-red-50 p-2 rounded"><Trash2 size={16} /></button>
                                </div>
                            )) : <div className="text-sm text-slate-500 text-center">No addons added.</div>}
                        </div>
                        <div className="p-4 border-t border-slate-200 flex justify-end gap-3">
                            <button type="button" onClick={() => toggleSection('addons')} className="px-6 py-2 bg-slate-100 text-slate-600 font-bold rounded hover:bg-slate-200">CANCEL</button>
                            <button type="button" onClick={() => toggleSection('addons')} className="px-6 py-2 bg-orange-500 text-white font-bold rounded hover:bg-orange-600">SAVE</button>
                        </div>
                    </div>
                </div>
            )}
            
            {expandedSections.otherInfo && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center">
                    <div className="bg-white w-[500px] rounded-lg shadow-xl flex flex-col">
                        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="font-bold text-orange-500">OTHER INFO</h3>
                            <button type="button" onClick={() => toggleSection('otherInfo')} className="text-slate-400 hover:text-red-500"><X size={20}/></button>
                        </div>
                        <div className="p-6 flex-1 max-h-[60vh] overflow-y-auto flex flex-col gap-6">
                            <div className="flex items-center">
                                <label className="w-1/3 text-sm font-semibold text-[#0F172A]">Food Type</label>
                                <div className="w-2/3">
                                    <select name="food_type" className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm text-[#0F172A] outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors" value={formData.food_type} onChange={handleInputChange}>
                                        <option value="NONE">None</option>
                                        <option value="VEG">Veg</option>
                                        <option value="NON_VEG">Non-Veg</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex items-center">
                                <label className="w-1/3 text-sm font-semibold text-[#0F172A]">Online Order</label>
                                <div className="w-2/3 flex items-center">
                                    <label className="flex items-center cursor-pointer">
                                        <input type="checkbox" className="hidden peer" checked={formData.online_order} onChange={(e) => setFormData(p => ({ ...p, online_order: e.target.checked }))} />
                                        <div className="w-10 h-5 rounded-full bg-slate-300 peer-checked:bg-orange-500 relative transition-all">
                                            <span className={"absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-all " + (formData.online_order ? 'translate-x-5' : '')}></span>
                                        </div>
                                    </label>
                                </div>
                            </div>
                            <div className="flex items-center">
                                <label className="w-1/3 text-sm font-semibold text-[#0F172A]">Item Active</label>
                                <div className="w-2/3 flex items-center">
                                    <label className="flex items-center cursor-pointer">
                                        <input type="checkbox" className="hidden peer" checked={formData.is_active} onChange={(e) => setFormData(p => ({ ...p, is_active: e.target.checked }))} />
                                        <div className="w-10 h-5 rounded-full bg-slate-300 peer-checked:bg-orange-500 relative transition-all">
                                            <span className={"absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-all " + (formData.is_active ? 'translate-x-5' : '')}></span>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 border-t border-slate-200 flex justify-end gap-3">
                            <button type="button" onClick={() => toggleSection('otherInfo')} className="px-6 py-2 bg-slate-100 text-slate-600 font-bold rounded hover:bg-slate-200">CANCEL</button>
                            <button type="button" onClick={() => toggleSection('otherInfo')} className="px-6 py-2 bg-orange-500 text-white font-bold rounded hover:bg-orange-600">SAVE</button>
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
