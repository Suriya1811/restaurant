const fs = require('fs');
const files = fs.readdirSync('frontend/src/pages/dashboard').filter(f => f.endsWith('.jsx'));
let count = 0;
files.forEach(f => {
    let c = fs.readFileSync('frontend/src/pages/dashboard/' + f, 'utf8');
    const duplicatePattern = /<select[\s\S]*?value=\{statusFilter\}[\s\S]*?<\/select>\s*<select[\s\S]*?value=\{statusFilter\}[\s\S]*?<\/select>/g;
    
    if (duplicatePattern.test(c)) {
        c = c.replace(duplicatePattern, `<select 
                                value={statusFilter} 
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="input-premium w-40 !py-1.5 !px-3"
                                style={{ height: '32px', minHeight: '32px', fontSize: '12px' }}
                            >
                                <option value="ALL">All Status</option>
                                <option value="ACTIVE">Active</option>
                                <option value="DEACTIVE">Deactive</option>
                            </select>`);
        fs.writeFileSync('frontend/src/pages/dashboard/' + f, c);
        console.log('Fixed ' + f);
        count++;
    }
});
console.log('Fixed ' + count + ' files with duplicate select.');
