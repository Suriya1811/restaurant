const fs = require('fs');
const path = require('path');
const dir = 'c:/Works/Mahix/restaurant/frontend/src/pages/dashboard';
fs.readdirSync(dir).forEach(f => {
    if (f.endsWith('.jsx')) {
        const p = path.join(dir, f);
        let d = fs.readFileSync(p, 'utf8');
        const searchStr = 'className="text-xs font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 italic"';
        if (d.includes(searchStr)) {
            d = d.replace(new RegExp(searchStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), 'className="whitespace-nowrap text-xs font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 italic"');
            fs.writeFileSync(p, d);
            console.log('Updated ' + f);
        }
    }
});
