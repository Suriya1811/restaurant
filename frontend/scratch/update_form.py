import re

with open(r'c:\Works\Mahix\restaurant\frontend\src\pages\dashboard\ProductMaster.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# We only want to modify the part inside the Item Creation form
start_idx = content.find('{/* ITEM DETAILS */}')
end_idx = content.find('</form>', start_idx)

form_content = content[start_idx:end_idx]

# Update labels to text-[13px] text-slate-800
form_content = re.sub(r'text-xs font-bold text-slate-700', r'text-[13px] font-bold text-slate-800', form_content)

# Update inputs/selects to py-2 text-sm
form_content = re.sub(r'px-2\.5 py-1 bg-white border border-orange-400 rounded text-xs', r'px-3 py-2 bg-white border border-orange-400 rounded text-sm', form_content)
form_content = re.sub(r'px-2\.5 py-1 bg-slate-50 border border-orange-300 rounded text-xs', r'px-3 py-2 bg-slate-50 border border-orange-300 rounded text-sm', form_content)

# Update the + buttons for Brand and Unit
form_content = re.sub(r'px-2\.5 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded font-bold text-xs h-7 flex items-center justify-center', r'w-[38px] h-[38px] bg-orange-500 hover:bg-orange-600 text-white rounded font-bold text-lg flex items-center justify-center', form_content)

# Update the bottom action buttons from steel blue to orange
form_content = form_content.replace(
    'border border-[#4a74a9] bg-white text-[#4a74a9] hover:bg-[#f0f4f8] rounded text-xs font-bold uppercase',
    'border border-orange-500 bg-white text-orange-500 hover:bg-orange-50 rounded text-sm font-bold uppercase'
)

# Update Save button
form_content = form_content.replace(
    'px-6 py-2 bg-[#ff5722] hover:bg-[#e64a19] text-white rounded text-xs font-black uppercase',
    'px-8 py-2.5 bg-[#ff5722] hover:bg-[#e64a19] text-white rounded text-sm font-black uppercase'
)

# Replace in the main content
new_content = content[:start_idx] + form_content + content[end_idx:]

# Also update the Type select in the Header
new_content = new_content.replace(
    'span className="text-xs font-bold text-slate-700">Type</span>',
    'span className="text-[13px] font-bold text-slate-800">Type</span>'
)
new_content = new_content.replace(
    'className="px-3 py-1 bg-white border border-orange-500 rounded text-xs outline-none focus:ring-1 focus:ring-orange-500 font-bold"',
    'className="px-3 py-2 bg-white border border-orange-500 rounded text-sm outline-none focus:ring-1 focus:ring-orange-500 font-bold"'
)

with open(r'c:\Works\Mahix\restaurant\frontend\src\pages\dashboard\ProductMaster.jsx', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Updated ProductMaster.jsx successfully!")
