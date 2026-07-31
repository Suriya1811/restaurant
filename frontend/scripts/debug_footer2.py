import re

path = r'c:\Users\Naveen\OneDrive\Desktop\resfin\frontend\src\pages\dashboard\ProductMaster.jsx'
content = open(path, encoding='utf-8').read()
m = re.search(r'<div\s+className="dashboard-layout"', content)
start = m.start()
i = content.index('>', start) + 1
depth = 1
step = 0
while i < len(content) and depth > 0 and step < 500:
    step += 1
    no = content.find('<div', i)
    nc = content.find('</div>', i)
    if nc == -1:
        print('ran out of closes at', i, 'depth', depth)
        break
    if no != -1 and no < nc:
        tag_end = content.index('>', no)
        tag = content[no:tag_end]
        self_close = tag.rstrip().endswith('/')
        line = content[:no].count('\n') + 1
        if self_close:
            i = tag_end + 1
        else:
            depth += 1
            if depth > 105:
                print('depth too high at line', line)
                break
            i = no + 4
    else:
        depth -= 1
        line = content[:nc].count('\n') + 1
        if depth == 0:
            print('matched at line', line, 'char', nc)
        i = nc + 6
print('final depth', depth, 'steps', step)
