import re

filepath = 'c:/Works/Mahix/restaurant/frontend/src/pages/dashboard/ProductMaster.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Make all labels uniform
# In my previous script I set them to 'text-xs font-bold text-black' or 'text-xs font-bold text-black uppercase'

# Step 1: Remove all uppercase from labels so we have a clean slate
content = content.replace('text-xs font-bold text-black uppercase', 'text-xs font-bold text-black')

# Step 2: Now add uppercase tracking-wide and text-[12px] to ALL labels in the form
# We target the specific label classes
content = content.replace('text-xs font-bold text-black', 'text-[12px] font-bold text-black uppercase tracking-wide')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Standardized all labels")
