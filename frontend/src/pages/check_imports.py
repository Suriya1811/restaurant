
import os
import re

def check_missing_imports(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(".jsx"):
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Find lucide-react import block
                lucide_match = re.search(r"import\s*\{([^}]+)\}\s*from\s*['\"]lucide-react['\"]", content)
                if not lucide_match:
                    continue
                
                imported_icons = [i.strip() for i in lucide_match.group(1).split(',')]
                
                # Find all potential lucide-react icon usages (PascalCase components like <Calendar ... />)
                usages = re.findall(r"<([A-Z][a-zA-Z0-9]+)", content)
                
                # Filter out components that are clearly not icons (starting with lowercase or imported from elsewhere)
                # This is heuristic.
                common_lucide_patterns = ["Loader2", "Search", "Download", "Calendar", "Chevron", "Arrow", "Trash", "Plus", "Edit", "Check", "File", "Database", "Box", "Layers", "Activity", "Refresh", "User", "LogOut", "Settings", "Eye", "Filter", "X", "Building", "Landmark", "Briefcase", "Dollar", "Tag", "Smartphone", "Credit", "Wallet", "Table", "Grid", "Pie", "List", "History", "Trending", "Alert", "Minus", "Package", "Menu", "Bell", "Clock", "Circle", "MapPin", "ChevronRight", "ChevronLeft", "CheckCircle2", "PlusCircle", "Trash2", "FileText", "LayoutDashboard", "Utensils", "Store", "Shield", "ChefHat", "Lock", "Globe", "LayoutGrid", "Monitor", "Receipt"]
                
                missing = []
                for usage in set(usages):
                    if usage not in imported_icons:
                        # Check if it looks like a Lucide icon
                        is_likely_lucide = any(pattern in usage for pattern in common_lucide_patterns)
                        if is_likely_lucide:
                            missing.append(usage)
                
                if missing:
                    print(f"File: {path}")
                    print(f"  Missing: {missing}")
                    print(f"  Imported: {imported_icons}")

check_missing_imports("c:\\Users\\navee\\Downloads\\tool (2)to\\toolto\\tool\\frontend\\src\\pages")
