#!/usr/bin/env python3
"""Add DashboardPageShell wrapper to all dashboard-layout pages."""
import re
import os

ROOT = r'c:\Users\Naveen\OneDrive\Desktop\resfin\frontend\src'

SKIP_FILES = {
    'SelfServiceDashboard.jsx',
    'SelfServiceDashboard_PREMIUM.jsx',
    'SelfServiceDashboard_HEAD.jsx',
    'test.jsx',
    'TableSelectionPage.orig.jsx',
    'ProductMaster_backup.jsx',
}

IMPORT_PATHS = {
    'pages/dashboard': '../../components/dashboard/DashboardPageShell',
    'pages': '../components/dashboard/DashboardPageShell',
}


def get_import_path(filepath):
    rel = os.path.relpath(filepath, ROOT).replace('\\', '/')
    if rel.startswith('pages/dashboard/'):
        return IMPORT_PATHS['pages/dashboard']
    if rel.startswith('pages/'):
        return IMPORT_PATHS['pages']
    return '../../components/dashboard/DashboardPageShell'


def is_self_closing_tag(content, tag_start):
    gt = content.index('>', tag_start)
    return content[tag_start:gt].rstrip().endswith('/')


def find_matching_close(content, open_start):
    """Find index after '>' of opening tag, return index of matching </div>."""
    i = content.index('>', open_start) + 1
    depth = 1
    n = len(content)
    while i < n and depth > 0:
        next_open = content.find('<div', i)
        next_close = content.find('</div>', i)
        if next_close == -1:
            return -1
        if next_open != -1 and next_open < next_close:
            if is_self_closing_tag(content, next_open):
                i = content.index('>', next_open) + 1
            else:
                depth += 1
                i = next_open + 4
        else:
            depth -= 1
            if depth == 0:
                return next_close
            i = next_close + 6
    return -1


def find_layout_open(content):
    patterns = [
        r'<div\s+className="([^"]*dashboard-layout[^"]*)"([^>]*)>',
        r"<div\s+className=\{`([^`]*dashboard-layout[^`]*)`\}([^>]*)>",
    ]
    for pat in patterns:
        m = re.search(pat, content)
        if m:
            return m
    # VoucherManagement-style layout
    m = re.search(r'<div\s+className="flex h-screen bg-\[#F8FAFC\]"([^>]*)>', content)
    if m:
        return m
    return None


def extract_extra_classes(class_str):
    if not class_str:
        return ''
    parts = class_str.split()
    extra = [p for p in parts if p != 'dashboard-layout']
    return ' '.join(extra)


def add_import(content, import_path):
    import_line = f"import DashboardPageShell from '{import_path}';\n"
    if re.search(r"import DashboardPageShell from ", content):
        return content
    # After last dashboard import or after react import
    m = re.search(r"import Header from '[^']+';\n", content)
    if m:
        return content[:m.end()] + import_line + content[m.end():]
    m = re.search(r"import Sidebar from '[^']+';\n", content)
    if m:
        return content[:m.end()] + import_line + content[m.end():]
    m = re.search(r"^import .+\n", content, re.M)
    if m:
        # find last import block
        imports = list(re.finditer(r'^import .+\n', content, re.M))
        last = imports[-1]
        return content[:last.end()] + import_line + content[last.end():]
    return import_line + content


def process_file(filepath):
    name = os.path.basename(filepath)
    if name in SKIP_FILES:
        return False, 'skipped'

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    if 'DashboardPageShell' in content:
        return False, 'already done'

    m = find_layout_open(content)
    if not m:
        return False, 'no layout'

    open_start = m.start()
    open_end = content.index('>', open_start) + 1
    close_start = find_matching_close(content, open_start)
    if close_start == -1:
        return False, 'no matching close'

    full_class = m.group(1) if m.lastindex and m.lastindex >= 1 else ''
    is_voucher = 'flex h-screen' in (full_class or m.group(0))

    if is_voucher:
        extra = 'bg-[#F8FAFC]'
    else:
        extra = extract_extra_classes(full_class)

    if extra.strip():
        replacement_open = f'<DashboardPageShell className="{extra.strip()}">'
    else:
        replacement_open = '<DashboardPageShell>'

    new_content = (
        content[:open_start]
        + replacement_open
        + content[open_end:close_start]
        + '</DashboardPageShell>'
        + content[close_start + len('</div>'):]
    )

    import_path = get_import_path(filepath)
    new_content = add_import(new_content, import_path)

    with open(filepath, 'w', encoding='utf-8', newline='\n') as f:
        f.write(new_content)

    return True, 'updated'


def main():
    updated = []
    skipped = []
    for dirpath, _, filenames in os.walk(ROOT):
        for fn in filenames:
            if not fn.endswith('.jsx'):
                continue
            fp = os.path.join(dirpath, fn)
            ok, reason = process_file(fp)
            rel = os.path.relpath(fp, ROOT)
            if ok:
                updated.append(rel)
            elif reason not in ('no layout', 'already done', 'skipped'):
                skipped.append((rel, reason))

    print(f'Updated {len(updated)} files:')
    for f in sorted(updated):
        print(f'  + {f}')
    if skipped:
        print(f'Failed {len(skipped)} files:')
        for f, r in skipped:
            print(f'  ! {f}: {r}')


if __name__ == '__main__':
    main()
