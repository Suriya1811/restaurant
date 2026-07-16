import re

with open('c:/Works/Mahix/restaurant/frontend/src/pages/dashboard/ProductMaster.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Reduce padding in Header
content = content.replace('px-6 py-4 border-b border-slate-200', 'px-4 py-2 border-b border-slate-200')
content = content.replace('text-xl font-black', 'text-lg font-black')
content = content.replace('px-4 py-1.5 border border-red-200', 'px-3 py-1 border border-red-200 text-xs')

# 2. Reduce padding in Body
content = content.replace('px-6 py-4 custom-scrollbar bg-slate-50 relative', 'px-4 py-2 custom-scrollbar bg-slate-50 relative overflow-hidden')
content = content.replace('flex flex-col gap-6', 'flex flex-col gap-2 h-full')
content = content.replace('mb-3', 'mb-1')

# 3. Compact ITEM DETAILS section
content = content.replace('p-5 rounded border', 'p-3 rounded border')
content = content.replace('grid-cols-2 gap-x-12 gap-y-4', 'grid-cols-2 gap-x-8 gap-y-2')
content = content.replace('flex flex-col gap-4', 'flex flex-col gap-1.5')
content = content.replace('px-3 py-2', 'px-2 py-1') # For all inputs
content = content.replace('w-9 h-9', 'w-7 h-7 text-xs') # For + buttons

# 4. Compact RATE DETAILS & TAX DETAILS section
content = content.replace('grid grid-cols-2 gap-x-12', 'grid grid-cols-2 gap-x-8')
content = content.replace('h-[180px]', '') # Remove fixed height
content = content.replace('grid-cols-2 gap-x-6 gap-y-4', 'grid-cols-2 gap-x-4 gap-y-2')
content = content.replace('mb-4', 'mb-2') # Tax Slab margin

# 5. Compact STOCK DETAILS section
content = content.replace('grid-cols-3 gap-x-8 gap-y-4', 'grid-cols-3 gap-x-4 gap-y-2')

# 6. Compact Footer Action Bar
content = content.replace('bg-white border-t border-slate-200 px-6 py-4', 'bg-white border-t border-slate-200 px-4 py-2')
content = content.replace('px-10 py-3', 'px-6 py-2') # SAVE button
content = content.replace('px-4 py-2 text-[11px]', 'px-3 py-1.5 text-[10px]') # Footer buttons

# Ensure body doesn't scroll
# The body div currently has `overflow-y-auto`. We can change it to `overflow-hidden` 
# or just let it not scroll by reducing sizes enough. The user wants "non scrollable".
content = content.replace('overflow-y-auto px-6 py-4', 'overflow-hidden px-4 py-2')
content = content.replace('overflow-y-auto px-4 py-2', 'overflow-hidden px-4 py-2') # Catch if already replaced

with open('c:/Works/Mahix/restaurant/frontend/src/pages/dashboard/ProductMaster.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Compacted form layout")
