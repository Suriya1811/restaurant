path = r'c:\Users\Naveen\OneDrive\Desktop\resfin\frontend\src\pages\dashboard\ProductMaster.jsx'
lines = open(path, encoding='utf-8').readlines()
chunk = ''.join(lines[938:2163])  # return block approx
opens = chunk.count('<div')
self = chunk.count('/>')
closes = chunk.count('</div>')
print('opens', opens, 'closes', closes, 'self-close-ish', self)
