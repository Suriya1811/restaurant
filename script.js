const fs = require('fs');
const path = require('path');
const dir = 'c:/Works/Mahix/restaurant/frontend/src/pages/dashboard';
fs.readdirSync(dir).forEach(f => {
    if (f.endsWith('.jsx')) {
        const p = path.join(dir, f);
        let d = fs.readFileSync(p, 'utf8');
        if (d.includes("width: 'auto'")) {
            d = d.replace(/width: 'auto'/g, "minWidth: '110px'");
            fs.writeFileSync(p, d);
            console.log('Updated ' + f);
        }
    }
});
