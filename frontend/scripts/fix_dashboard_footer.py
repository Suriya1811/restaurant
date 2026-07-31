#!/usr/bin/env python3
"""Fix missing DashboardPageShell imports and update remaining pages."""
import re
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from add_dashboard_footer import (
    SKIP_FILES, get_import_path, find_layout_open, find_matching_close,
    extract_extra_classes, add_import, process_file,
)

ROOT = r'c:\Users\Naveen\OneDrive\Desktop\resfin\frontend\src'


def fix_imports_only():
    fixed = []
    for dirpath, _, filenames in os.walk(ROOT):
        for fn in filenames:
            if not fn.endswith('.jsx'):
                continue
            fp = os.path.join(dirpath, fn)
            try:
                with open(fp, 'r', encoding='utf-8') as f:
                    content = f.read()
            except UnicodeDecodeError:
                continue
            if 'DashboardPageShell' not in content:
                continue
            if re.search(r"import DashboardPageShell from ", content):
                continue
            import_path = get_import_path(fp)
            new_content = add_import(content, import_path)
            with open(fp, 'w', encoding='utf-8', newline='\n') as f:
                f.write(new_content)
            fixed.append(os.path.relpath(fp, ROOT))
    print(f'Fixed imports in {len(fixed)} files')


def process_remaining():
    updated = []
    for dirpath, _, filenames in os.walk(ROOT):
        for fn in filenames:
            if fn.endswith('.jsx'):
                ok, reason = process_file(os.path.join(dirpath, fn))
                if ok:
                    updated.append(os.path.relpath(os.path.join(dirpath, fn), ROOT))
    print(f'Updated {len(updated)} remaining files')


if __name__ == '__main__':
    fix_imports_only()
    process_remaining()
