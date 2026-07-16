import re

filepath = 'c:/Works/Mahix/restaurant/frontend/src/pages/dashboard/LedgerMaster.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('bg-blue-600', 'bg-[#f97316]')
content = content.replace('bg-blue-700', 'bg-[#ea580c]')
content = content.replace('border-blue-600', 'border-[#f97316]')
content = content.replace('text-blue-600', 'text-[#f97316]')
content = content.replace('ring-blue-500', 'ring-[#f97316]/20')
content = content.replace('shadow-blue-600', 'shadow-[#f97316]')
content = content.replace('bg-blue-50', 'bg-orange-50')
content = content.replace('text-blue-500', 'text-[#f97316]')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed colors")
