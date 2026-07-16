import re

def adjust_spacing():
    filepath = 'c:/Works/Mahix/restaurant/frontend/src/pages/dashboard/ProductMaster.jsx'
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Increase gap between grid rows
    content = content.replace('gap-y-3', 'gap-y-4')
    
    # 2. Increase label text size from 11px to xs (12px)
    content = content.replace('text-[11px] font-bold text-black uppercase', 'text-xs font-bold text-black uppercase')
    content = content.replace('text-[11px] font-bold text-black', 'text-xs font-bold text-black')
    
    # 3. Increase input height and text size from h-7/text-xs to h-8/text-sm
    content = content.replace('text-xs text-black h-7', 'text-sm text-black h-8 py-1.5')
    content = content.replace('text-xs text-slate-500 h-7', 'text-sm text-slate-600 h-8 py-1.5')
    
    # 4. For the select dropdowns, make sure they match
    # It might be caught by the above replacement, let's double check.
    
    # 5. Increase section title font size and spacing
    content = content.replace('text-[12px] font-black text-[#f97316]', 'text-[13px] font-black text-[#f97316]')
    content = content.replace('mb-4 mt-2', 'mb-5 mt-4')
    content = content.replace('mb-4">ITEM DETAILS', 'mb-5 mt-2">ITEM DETAILS') # Item Details doesn't have mt-2 initially
    
    # 6. Increase the '+' button sizes to match the new h-8 inputs
    content = content.replace('w-7 h-7 text-xs flex', 'w-8 h-8 text-sm flex')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

adjust_spacing()
print("Adjusted spacing and sizes successfully")
