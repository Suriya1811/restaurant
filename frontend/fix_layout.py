import re

with open('c:/Works/Mahix/restaurant/frontend/src/pages/dashboard/ProductMaster.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Locate main tag
main_start = content.find('<main className="flex-1 flex flex-col h-screen overflow-hidden relative transition-all duration-300">')
if main_start == -1:
    print("Could not find main tag")
    exit(1)

# Find where showDrawer starts
show_drawer_start = content.find('{showDrawer && (')
if show_drawer_start == -1:
    print("Could not find showDrawer start")
    exit(1)

# Find the end of showDrawer. We'll use the SaveConfirmationModal as a marker
save_confirm_idx = content.find('<SaveConfirmationModal', show_drawer_start)
if save_confirm_idx == -1:
    print("Could not find SaveConfirmationModal")
    exit(1)

# The drawer ends a bit before SaveConfirmationModal. We look for ')}'
end_drawer_idx = content.rfind(')}', show_drawer_start, save_confirm_idx)
if end_drawer_idx == -1:
    print("Could not find drawer end")
    exit(1)

# Extract the list view part
list_view_part = content[main_start + len('<main className="flex-1 flex flex-col h-screen overflow-hidden relative transition-all duration-300">'):show_drawer_start].strip()

# Extract the drawer form part, stripping the modal wrapper
form_part = content[show_drawer_start:end_drawer_idx + 2]

# Remove the fixed overlay wrappers from form_part
form_part = form_part.replace('{showDrawer && (', '')
form_part = form_part.rsplit(')}', 1)[0]
form_part = form_part.replace('<div className="fixed inset-0 z-[100] bg-slate-900/50 flex items-center justify-center p-4">', '')
form_part = form_part.replace('<div className="bg-white w-full max-w-6xl h-auto max-h-[95vh] rounded-lg shadow-2xl flex flex-col relative overflow-hidden font-sans">', '<div className="flex-1 flex flex-col h-full bg-white relative font-sans overflow-hidden">')
# Remove the last two closing divs that belonged to the wrapper
form_part = form_part.rsplit('</div>', 1)[0]
form_part = form_part.rsplit('</div>', 1)[0]

new_main_content = f"""<main className="flex-1 flex flex-col h-screen overflow-hidden relative transition-all duration-300">
                {{!showDrawer ? (
                    <>
                        {list_view_part}
                    </>
                ) : (
                    {form_part}
                )}}
                """

content = content[:main_start] + new_main_content + content[save_confirm_idx:]

with open('c:/Works/Mahix/restaurant/frontend/src/pages/dashboard/ProductMaster.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully replaced layout to non-popup style")
