import re

filepath = 'c:/Works/Mahix/restaurant/frontend/src/pages/dashboard/ProductMaster.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

def make_modal(match):
    width = match.group(1)
    return f'<div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 animate-in fade-in"><div className="bg-white rounded-lg shadow-2xl w-[{width}] max-w-[90vw] max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95">'

content = re.sub(
    r'<div className="absolute bottom-\[calc\(100%\+12px\)\] left-0 w-\[(\d+px)\] bg-white rounded-lg shadow-\[0_0_20px_rgba\(0,0,0,0\.15\)\] border border-slate-200 z-\[110\] animate-in slide-in-from-bottom-2">',
    make_modal,
    content
)

# Fix the closing tags.
# Currently the structure is:
# {expandedSections.X && (
#     <div className="absolute ...">
#         ...
#     </div>
# )}
# Now it is:
# {expandedSections.X && (
#     <div className="fixed inset-0 ...">
#         <div className="bg-white ...">
#             ...
#         </div>
#     </div>
# )}
# So we need to add an extra </div>.

# The end of each block looks like this:
#                                                 <div className="p-3 border-t border-slate-100 bg-slate-50 flex justify-end gap-2 rounded-b-lg">
#                                                     <button type="button" onClick={() => setExpandedSections(p => ({...p, [section]: false}))} className="...">DELETE / CLOSE</button>
#                                                     <button type="button" onClick={() => setExpandedSections(p => ({...p, [section]: false}))} className="...">SAVE</button>
#                                                 </div>
#                                             </div>
#                                         )}

content = re.sub(
    r'(<div className="p-3 border-t border-slate-100 bg-slate-50 flex justify-end gap-2 rounded-b-lg">.*?</div>\s*</div>\s*)\)}',
    r'\1    </div>\n                                        )}',
    content,
    flags=re.DOTALL
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Modals created successfully")
