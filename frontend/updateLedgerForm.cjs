const fs = require('fs');
const filePath = 'c:/Works/Mahix/restaurant/frontend/src/pages/dashboard/LedgerMaster.jsx';
let content = fs.readFileSync(filePath, 'utf8');

const startStr = `<div className="flex justify-between items-center px-8 py-5 border-b border-slate-200 bg-slate-50 sticky top-0 z-10">`;
const endStr = `</form>`;

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr, startIndex);

if (startIndex === -1 || endIndex === -1) {
    console.error("Could not find form boundaries.");
    process.exit(1);
}

const replacement = `<div className="flex justify-between items-center px-8 py-4 border-b border-slate-200 sticky top-0 z-10 bg-white">
                            <div className="flex items-center gap-3">
                                <div className="w-1 h-6 bg-blue-600"></div>
                                <h2 className="text-lg font-bold uppercase tracking-wide text-slate-800">
                                    {isEditing ? 'Modify Account Details' : 'Ledger Creation'}
                                </h2>
                            </div>
                            <button
                                onClick={() => { resetForm(); setShowDrawer(false); }}
                                className="border border-red-500 text-red-500 px-4 py-1.5 rounded flex items-center gap-2 font-bold hover:bg-red-50 text-sm outline-none"
                            >
                                <X size={16} /> CLOSE
                            </button>
                        </div>

                        {/* Form Body */}
                        <div className="p-8 max-w-[1200px] mx-auto w-full flex flex-col gap-8">
                            {error && (
                                <div className="bg-rose-50 border border-rose-100 p-4 rounded flex items-center gap-3 text-rose-600 font-bold text-sm">
                                    <AlertCircle size={18} /> {error}
                                </div>
                            )}

                            <form onSubmit={handleSave} className="flex flex-col gap-8">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-4">
                                    {/* LEFT COLUMN */}
                                    <div className="flex flex-col gap-4">
                                        <div className="flex items-center gap-4">
                                            <label className="w-40 text-xs font-bold text-slate-800 uppercase flex justify-between">
                                                <span>NAME <span className="text-red-500">*</span></span>
                                                <span>:</span>
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.name || ''}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                className="flex-1 border border-orange-300 rounded px-3 py-1.5 outline-none focus:border-orange-500 text-sm font-semibold"
                                            />
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <label className="w-40 text-xs font-bold text-slate-800 uppercase flex justify-between">
                                                <span>PRINT NAME</span>
                                                <span>:</span>
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.print_name || ''}
                                                onChange={e => setFormData({ ...formData, print_name: e.target.value })}
                                                className="flex-1 border border-orange-300 rounded px-3 py-1.5 outline-none focus:border-orange-500 text-sm font-semibold"
                                            />
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <label className="w-40 text-xs font-bold text-slate-800 uppercase flex justify-between">
                                                <span>UNDER</span>
                                                <span>:</span>
                                            </label>
                                            <select
                                                value={mapStandardGroupToUI(formData.group) || ''}
                                                onChange={e => setFormData({ ...formData, group: mapUIGroupToStandard(e.target.value) })}
                                                className="flex-1 border border-orange-300 rounded px-3 py-1.5 outline-none focus:border-orange-500 text-sm font-semibold bg-white"
                                            >
                                                <option value="" disabled>Select Under</option>
                                                <option value="Sundry Debtors">Sundry Debtors</option>
                                                <option value="Sundry Creditors">Sundry Creditors</option>
                                                <option value="Purchase Account">Purchase Account</option>
                                                <option value="Sales Account">Sales Account</option>
                                                <option value="Cash-in-Hand">Cash-in-Hand</option>
                                                <option value="Bank Accounts">Bank Accounts</option>
                                                <option value="Duties & Taxes">Duties & Taxes</option>
                                                <option value="Expenses">Expenses</option>
                                                <option value="Income">Income</option>
                                                <option value="Assets">Assets</option>
                                                <option value="Liabilities">Liabilities</option>
                                                <option value="Capital Account">Capital Account</option>
                                            </select>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <label className="w-40 text-xs font-bold text-slate-800 uppercase flex justify-between">
                                                <span>EMAIL</span>
                                                <span>:</span>
                                            </label>
                                            <input
                                                type="email"
                                                value={formData.email || ''}
                                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                className="flex-1 border border-orange-300 rounded px-3 py-1.5 outline-none focus:border-orange-500 text-sm font-semibold"
                                            />
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <label className="w-40 text-xs font-bold text-slate-800 uppercase flex justify-between">
                                                <span>GSTIN NO</span>
                                                <span>:</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.gstin || ''}
                                                onChange={e => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                                                className="flex-1 border border-orange-300 rounded px-3 py-1.5 outline-none focus:border-orange-500 text-sm font-semibold uppercase"
                                            />
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <label className="w-40 text-xs font-bold text-slate-800 uppercase flex justify-between">
                                                <span>OPENING BALANCE <span className="text-red-500">*</span></span>
                                                <span>:</span>
                                            </label>
                                            <div className="flex-1 flex gap-2">
                                                <input
                                                    type="number"
                                                    required
                                                    value={formData.opening_balance || ''}
                                                    onChange={e => setFormData({ ...formData, opening_balance: parseFloat(e.target.value) || 0 })}
                                                    className="w-full border border-orange-300 rounded px-3 py-1.5 outline-none focus:border-orange-500 text-sm font-semibold"
                                                />
                                                <select
                                                    value={formData.balance_type || 'DR'}
                                                    onChange={e => setFormData({ ...formData, balance_type: e.target.value })}
                                                    className="w-24 border border-orange-300 rounded px-3 py-1.5 bg-white font-bold text-slate-700 outline-none focus:border-orange-500 text-sm"
                                                >
                                                    <option value="DR">Select Type</option>
                                                    <option value="DR">DR</option>
                                                    <option value="CR">CR</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2 mt-2">
                                            <label className="text-xs font-bold text-slate-800 uppercase">
                                                ADDRESS (MAX 5 LINES)
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.address_line_1 || ''}
                                                onChange={e => setFormData({ ...formData, address_line_1: e.target.value })}
                                                className="w-full border border-orange-300 rounded px-3 py-1.5 outline-none focus:border-orange-500 text-sm font-semibold"
                                            />
                                            <input
                                                type="text"
                                                value={formData.address_line_2 || ''}
                                                onChange={e => setFormData({ ...formData, address_line_2: e.target.value })}
                                                className="w-full border border-orange-300 rounded px-3 py-1.5 outline-none focus:border-orange-500 text-sm font-semibold"
                                            />
                                            <input
                                                type="text"
                                                value={formData.address_line_3 || ''}
                                                onChange={e => setFormData({ ...formData, address_line_3: e.target.value })}
                                                className="w-full border border-orange-300 rounded px-3 py-1.5 outline-none focus:border-orange-500 text-sm font-semibold"
                                            />
                                            <input
                                                type="text"
                                                value={formData.address_line_4 || ''}
                                                onChange={e => setFormData({ ...formData, address_line_4: e.target.value })}
                                                className="w-full border border-orange-300 rounded px-3 py-1.5 outline-none focus:border-orange-500 text-sm font-semibold"
                                            />
                                            <input
                                                type="text"
                                                value={formData.address_line_5 || ''}
                                                onChange={e => setFormData({ ...formData, address_line_5: e.target.value })}
                                                className="w-full border border-orange-300 rounded px-3 py-1.5 outline-none focus:border-orange-500 text-sm font-semibold"
                                            />
                                        </div>
                                    </div>

                                    {/* RIGHT COLUMN */}
                                    <div className="flex flex-col gap-4">
                                        <div className="flex items-center gap-4">
                                            <label className="w-40 text-xs font-bold text-slate-800 uppercase flex justify-between">
                                                <span>CELL NO</span>
                                                <span>:</span>
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.phone || ''}
                                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                                className="flex-1 border border-orange-300 rounded px-3 py-1.5 outline-none focus:border-orange-500 text-sm font-semibold"
                                            />
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <label className="w-40 text-xs font-bold text-slate-800 uppercase flex justify-between">
                                                <span>CELL NO 1</span>
                                                <span>:</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.mobile2 || ''}
                                                onChange={e => setFormData({ ...formData, mobile2: e.target.value })}
                                                className="flex-1 border border-orange-300 rounded px-3 py-1.5 outline-none focus:border-orange-500 text-sm font-semibold"
                                            />
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <label className="w-40 text-xs font-bold text-slate-800 uppercase flex justify-between">
                                                <span>REGISTERED TYPE</span>
                                                <span>:</span>
                                            </label>
                                            <select
                                                value={formData.registration_type || ''}
                                                onChange={e => setFormData({ ...formData, registration_type: e.target.value })}
                                                className="flex-1 border border-orange-300 rounded px-3 py-1.5 outline-none focus:border-orange-500 text-sm font-semibold bg-white"
                                            >
                                                <option value="" disabled>Select Registered Type</option>
                                                <option value="Composition">Composition</option>
                                                <option value="Regular">Registered</option>
                                                <option value="Unregistered">Unregistered</option>
                                            </select>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <label className="w-40 text-xs font-bold text-slate-800 uppercase flex justify-between">
                                                <span>STATE</span>
                                                <span>:</span>
                                            </label>
                                            <select
                                                value={formData.state || ''}
                                                onChange={e => setFormData({ ...formData, state: e.target.value })}
                                                className="flex-1 border border-orange-300 rounded px-3 py-1.5 outline-none focus:border-orange-500 text-sm font-semibold bg-white"
                                            >
                                                <option value="" disabled>Select State</option>
                                                <option value="Tamil Nadu">Tamil Nadu</option>
                                                <option value="Kerala">Kerala</option>
                                                <option value="Karnataka">Karnataka</option>
                                                <option value="Andhra Pradesh">Andhra Pradesh</option>
                                                <option value="Telangana">Telangana</option>
                                                <option value="Maharashtra">Maharashtra</option>
                                                <option value="Gujarat">Gujarat</option>
                                            </select>
                                        </div>

                                        {/* Bank Details Box */}
                                        <div className="border border-orange-300 rounded mt-4 p-4 relative pt-6">
                                            <span className="absolute -top-3 left-4 bg-white px-2 text-xs font-bold text-slate-800 uppercase flex items-center gap-2">
                                                <div className="w-1 h-3 bg-red-500"></div> BANK DETAILS
                                            </span>
                                            
                                            <div className="flex flex-col gap-4">
                                                <div className="flex items-center gap-4">
                                                    <label className="w-32 text-xs font-bold text-slate-800 uppercase flex justify-between">
                                                        <span>BANK NAME</span>
                                                        <span>:</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={formData.bank_name || ''}
                                                        onChange={e => setFormData({ ...formData, bank_name: e.target.value })}
                                                        className="flex-1 border border-orange-300 rounded px-3 py-1.5 outline-none focus:border-orange-500 text-sm font-semibold"
                                                    />
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    <label className="w-32 text-xs font-bold text-slate-800 uppercase flex justify-between">
                                                        <span>ACCOUNT NUMBER</span>
                                                        <span>:</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={formData.bank_account_number || ''}
                                                        onChange={e => setFormData({ ...formData, bank_account_number: e.target.value })}
                                                        className="flex-1 border border-orange-300 rounded px-3 py-1.5 outline-none focus:border-orange-500 text-sm font-semibold"
                                                    />
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    <label className="w-32 text-xs font-bold text-slate-800 uppercase flex justify-between">
                                                        <span>IFSC CODE</span>
                                                        <span>:</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={formData.ifsc_code || ''}
                                                        onChange={e => setFormData({ ...formData, ifsc_code: e.target.value.toUpperCase() })}
                                                        className="flex-1 border border-orange-300 rounded px-3 py-1.5 outline-none focus:border-orange-500 text-sm font-semibold uppercase"
                                                    />
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    <label className="w-32 text-xs font-bold text-slate-800 uppercase flex justify-between">
                                                        <span>BRANCH</span>
                                                        <span>:</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={formData.branch || ''}
                                                        onChange={e => setFormData({ ...formData, branch: e.target.value })}
                                                        className="flex-1 border border-orange-300 rounded px-3 py-1.5 outline-none focus:border-orange-500 text-sm font-semibold"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex justify-end mt-4 gap-4">
                                    <button
                                        type="button"
                                        className="border border-[#FF5722] text-[#FF5722] font-bold px-6 py-2 rounded flex items-center gap-2 hover:bg-orange-50 transition-colors uppercase text-sm shadow-sm"
                                    >
                                        <FileText size={16} /> OTHER DETAILS
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="bg-[#FF5722] text-white font-bold px-8 py-2 rounded flex items-center gap-2 hover:bg-[#E64A19] transition-colors disabled:opacity-50 uppercase text-sm shadow-sm"
                                    >
                                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} SAVE
                                    </button>
                                </div>
                            </form>`;

const before = content.slice(0, startIndex);
const after = content.slice(endIndex + endStr.length);

fs.writeFileSync(filePath, before + replacement + after);
console.log("Updated LedgerMaster form successfully.");
