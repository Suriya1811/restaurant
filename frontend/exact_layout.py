import re

def process_file():
    filepath = 'c:/Works/Mahix/restaurant/frontend/src/pages/dashboard/ProductMaster.jsx'
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Remove the background boxes from all sections.
    # Currently they look like:
    # <h3 className="text-sm font-black text-[#f97316] uppercase tracking-wider mb-1">ITEM DETAILS</h3>
    # <div className="bg-white p-3 rounded border border-slate-200 shadow-sm grid grid-cols-2 gap-x-8 gap-y-2 relative overflow-hidden">
    # <div className="absolute top-0 left-0 w-full h-1 bg-[#f97316]"></div>
    
    # We will replace them with:
    # <h3 className="text-[13px] font-black text-[#f97316] uppercase tracking-wider pb-1 border-b border-[#f97316] mb-4">ITEM DETAILS</h3>
    # <div className="grid grid-cols-2 gap-x-12 gap-y-3">
    
    # ITEM DETAILS
    content = re.sub(
        r'<h3[^>]*>ITEM DETAILS</h3>\s*<div[^>]*grid-cols-2[^>]*>\s*<div[^>]*absolute top-0[^>]*></div>',
        r'<h3 className="text-[12px] font-black text-[#f97316] uppercase tracking-wider pb-1.5 border-b border-[#f97316]/50 mb-4">ITEM DETAILS</h3>\n                                        <div className="grid grid-cols-2 gap-x-12 gap-y-3">',
        content, flags=re.DOTALL
    )
    
    # RATE DETAILS
    content = re.sub(
        r'<h3[^>]*>RATE DETAILS</h3>\s*<div[^>]*grid-cols-2[^>]*>\s*<div[^>]*absolute top-0[^>]*></div>',
        r'<h3 className="text-[12px] font-black text-[#f97316] uppercase tracking-wider pb-1.5 border-b border-[#f97316]/50 mb-4 mt-2">RATE DETAILS</h3>\n                                            <div className="grid grid-cols-2 gap-x-8 gap-y-3">',
        content, flags=re.DOTALL
    )
    
    # TAX DETAILS
    content = re.sub(
        r'<h3[^>]*>TAX DETAILS</h3>\s*<div[^>]*overflow-hidden[^>]*>\s*<div[^>]*absolute top-0[^>]*></div>',
        r'<h3 className="text-[12px] font-black text-[#f97316] uppercase tracking-wider pb-1.5 border-b border-[#f97316]/50 mb-4 mt-2">TAX DETAILS</h3>\n                                            <div>',
        content, flags=re.DOTALL
    )
    
    # STOCK DETAILS
    content = re.sub(
        r'<h3[^>]*>STOCK DETAILS</h3>\s*<div[^>]*grid-cols-3[^>]*>\s*<div[^>]*absolute top-0[^>]*></div>',
        r'<h3 className="text-[12px] font-black text-[#f97316] uppercase tracking-wider pb-1.5 border-b border-[#f97316]/50 mb-4 mt-2">STOCK DETAILS</h3>\n                                        <div className="grid grid-cols-3 gap-x-8 gap-y-3">',
        content, flags=re.DOTALL
    )

    # Note: For RATE DETAILS and STOCK DETAILS we had a closing </div> for the box which now we just leave as it correctly closes the grid div.
    # But for TAX DETAILS, the grid was inside the box, so we replaced the box with a simple <div>.
    
    # 2. Update all labels to be smaller, black text, and make the asterisks red.
    # Current: <label className="w-1/3 text-sm font-bold text-slate-700">Barcode</label>
    # Current with asterisk: <label className="w-1/3 text-sm font-bold text-slate-700">Item Name <span className="text-rose-500">*</span></label>
    
    content = content.replace('text-sm font-bold text-slate-700', 'text-[11px] font-bold text-black')
    content = content.replace('text-[11px] font-bold text-slate-600', 'text-[11px] font-bold text-black')
    content = content.replace('text-rose-500', 'text-red-500') # Make asterisk more distinctly red
    
    # 3. Inputs padding and border.
    # Current: px-2 py-1 bg-white border border-[#f97316] rounded text-sm text-slate-800
    # Update to: px-2 py-1 bg-white border border-[#f97316] rounded text-xs text-black h-7
    content = content.replace('px-2 py-1 bg-white border border-[#f97316] rounded text-sm text-slate-800', 'px-2 py-1 bg-white border border-[#f97316]/60 rounded text-xs text-black h-7')
    content = content.replace('px-2 py-1 bg-white border border-[#f97316] rounded text-xs text-slate-800', 'px-2 py-1 bg-white border border-[#f97316]/60 rounded text-xs text-black h-7')
    
    # For readonly inputs:
    content = content.replace('px-2 py-1.5 bg-slate-100 border border-slate-200 rounded text-sm text-slate-600', 'px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs text-slate-500 h-7')
    content = content.replace('px-2 py-1 bg-slate-100 border border-slate-200 rounded text-sm text-slate-600', 'px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs text-slate-500 h-7')
    content = content.replace('px-3 py-2 bg-slate-100 border border-slate-200 rounded text-sm text-slate-600', 'px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs text-slate-500 h-7')
    
    # The bottom action bar
    content = content.replace('bg-white border-t border-slate-200 px-4 py-2', 'bg-white border-t border-slate-200 px-6 py-4 mt-auto')
    
    # Bottom Buttons
    content = content.replace('px-3 py-1.5 text-[10px] font-black text-[#f97316] bg-white border border-[#f97316]', 'px-6 py-2 text-[11px] font-black text-[#f97316] bg-white border border-[#f97316] rounded flex items-center gap-2 hover:bg-orange-50 transition-colors')
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
        
process_file()
print("Done formatting exact UI")
