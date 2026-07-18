const fs = require('fs');
const path = require('path');
const dir = 'c:/Works/Mahix/restaurant/frontend/src/pages/dashboard';
fs.readdirSync(dir).forEach(f => {
    if (f.endsWith('.jsx')) {
        const p = path.join(dir, f);
        let d = fs.readFileSync(p, 'utf8');
        const searchStr = '<div className="flex items-center gap-4">';
        if (d.includes(searchStr)) {
            // Only replace the ones that are inside toolbar-premium or generally the first one
            // To be safe, we can replace all because "gap-4 ml-auto" usually does no harm for right-aligned items
            d = d.replace(new RegExp(searchStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '<div className="flex items-center gap-4 ml-auto">');
            fs.writeFileSync(p, d);
            console.log('Updated ' + f);
        }
    }
});
