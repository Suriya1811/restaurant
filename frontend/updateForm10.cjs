const fs = require('fs');
const filePath = 'c:/Works/Mahix/restaurant/frontend/src/pages/dashboard/ProductMaster.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// The current Tax Details block:
/*
                        <div className="flex items-center mb-3">
                            <h4 className="text-[#FF5722] font-bold uppercase text-[15px] whitespace-nowrap pr-2">TAX DETAILS</h4>
                            <div className="h-[1px] bg-[#FF5722]/40 flex-1"></div>
                        </div>
                        <div className="flex items-center w-[60%] mb-2.5">
                            <label className="w-1/3 text-black font-semibold text-[14px]">Tax slab <span className="text-red-500">*</span></label>
                            <div className="w-2/3 flex items-stretch">
                                <select name="tax_id" className="flex-1 px-2 py-2 bg-white text-black font-medium !border !border-[#FF5722] border-r-0 rounded-l text-[15px] outline-none focus:ring-1 focus:ring-[#FF5722]" value={formData.tax_id} onChange={handleInputChange}>
                                    <option value=""></option>
                                    {taxes.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                                </select>
                                <button type="button" tabIndex="-1" onClick={() => setShowTaxModal(true)} className="bg-[#FF5722] text-white rounded-r px-3 flex items-center justify-center font-bold hover:bg-[#E64A19]">+</button>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
*/

const searchStr = `<div className="flex items-center w-[60%] mb-2.5">
                            <label className="w-1/3 text-black font-semibold text-[14px]">Tax slab <span className="text-red-500">*</span></label>
                            <div className="w-2/3 flex items-stretch">
                                <select name="tax_id" className="flex-1 px-2 py-2 bg-white text-black font-medium !border !border-[#FF5722] border-r-0 rounded-l text-[15px] outline-none focus:ring-1 focus:ring-[#FF5722]" value={formData.tax_id} onChange={handleInputChange}>
                                    <option value=""></option>
                                    {taxes.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                                </select>
                                <button type="button" tabIndex="-1" onClick={() => setShowTaxModal(true)} className="bg-[#FF5722] text-white rounded-r px-3 flex items-center justify-center font-bold hover:bg-[#E64A19]">+</button>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">`;

const replaceStr = `<div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                            <div className="flex items-center">
                                <label className="w-1/2 text-black font-semibold text-[14px]">Tax slab <span className="text-red-500">*</span></label>
                                <div className="w-1/2 flex items-stretch">
                                    <select name="tax_id" className="flex-1 px-2 py-2 bg-white text-black font-medium !border !border-[#FF5722] border-r-0 rounded-l text-[15px] outline-none focus:ring-1 focus:ring-[#FF5722]" value={formData.tax_id} onChange={handleInputChange}>
                                        <option value=""></option>
                                        {taxes.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                                    </select>
                                    <button type="button" tabIndex="-1" onClick={() => setShowTaxModal(true)} className="bg-[#FF5722] text-white rounded-r px-3 flex items-center justify-center font-bold hover:bg-[#E64A19]">+</button>
                                </div>
                            </div>
                            <div></div>`;

if (content.includes(searchStr)) {
    content = content.replace(searchStr, replaceStr);
    fs.writeFileSync(filePath, content);
    console.log("Successfully aligned tax slab.");
} else {
    // try a more fuzzy search if exact match fails
    const regex = /<div className="flex items-center w-\[60%\] mb-2\.5">([\s\S]*?)<div className="grid grid-cols-2 gap-x-6 gap-y-2\.5">/;
    const match = content.match(regex);
    if (match) {
        let taxSlabHtml = match[1];
        taxSlabHtml = taxSlabHtml.replace('w-1/3', 'w-1/2').replace('w-2/3', 'w-1/2');
        
        let newHtml = `<div className="grid grid-cols-2 gap-x-6 gap-y-2.5">\n                            <div className="flex items-center">` + taxSlabHtml + `</div>\n                            <div></div>\n`;
        content = content.replace(match[0], newHtml);
        fs.writeFileSync(filePath, content);
        console.log("Successfully aligned tax slab using regex.");
    } else {
        console.log("Could not find the tax slab section.");
    }
}
