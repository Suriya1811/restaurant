import re
import sys
sys.path.insert(0, r'c:\Users\Naveen\OneDrive\Desktop\resfin\frontend\scripts')
from add_dashboard_footer import find_layout_open, find_matching_close

files = [
    'ProductMaster.jsx',
    'LedgerMaster.jsx',
    'PartyMasterHub.jsx',
]
root = r'c:\Users\Naveen\OneDrive\Desktop\resfin\frontend\src\pages\dashboard'
for fn in files:
    content = open(f'{root}/{fn}', encoding='utf-8').read()
    m = find_layout_open(content)
    if not m:
        print(fn, 'no open')
        continue
    close = find_matching_close(content, m.start())
    print(fn, 'open', m.start(), 'close', close)
