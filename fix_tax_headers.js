const fs = require('fs');
let c = fs.readFileSync('frontend/src/pages/dashboard/TaxMaster.jsx', 'utf8');

// 3. Add Status column <th>
if (!c.includes('<th>Status</th>')) {
    c = c.replace(
        /<th>IGST %<\/th>\s*<th style=\{\{\s*textAlign:\s*'right'\s*\}\}>Action<\/th>/,
        "<th>IGST %</th>\n                                    <th>Status</th>\n                                    <th style={{ textAlign: 'right' }}>Action</th>"
    );
}
// Fix colSpan to 12
c = c.replace(/colSpan=\"11\"/g, 'colSpan="12"');

fs.writeFileSync('frontend/src/pages/dashboard/TaxMaster.jsx', c);
console.log('Fixed TaxMaster headers properly');
