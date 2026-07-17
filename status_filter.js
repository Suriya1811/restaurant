const fs = require('fs');

const files = [
    'BrandMaster.jsx',
    'CategoryMaster.jsx',
    'FunctionMaster.jsx',
    'TableTypeMaster.jsx',
    'StaffMaster.jsx',
    'CaptainMaster.jsx',
    'WaiterMaster.jsx',
    'UnitMaster.jsx',
    'TaxMaster.jsx',
    'CounterMaster.jsx',
    'LedgerMaster.jsx',
    'GroupMaster.jsx',
    'TableMaster.jsx'
];

files.forEach(filename => {
    const path = 'frontend/src/pages/dashboard/' + filename;
    if (!fs.existsSync(path)) return;
    
    let c = fs.readFileSync(path, 'utf8');

    // 1. Add state
    if (!c.includes('const [statusFilter')) {
        c = c.replace(
            "const [searchTerm, setSearchTerm] = useState('');",
            "const [searchTerm, setSearchTerm] = useState('');\n    const [statusFilter, setStatusFilter] = useState('ALL');"
        );
    }

    // 2. Modify filter logic
    // This looks for something like `const filteredUnits = units.filter(u =>`
    const arrayNameMatch = c.match(/const filtered([A-Za-z]+) = ([a-z]+)\.filter\(([a-zA-Z0-9_]+) =>[\s\S]*?\);/);
    if (arrayNameMatch) {
        if (!arrayNameMatch[0].includes('matchesStatus')) {
            const filteredName = arrayNameMatch[1];
            const arrayName = arrayNameMatch[2];
            const param = arrayNameMatch[3];

            // In some files, there are complex filters (e.g. LedgerMaster).
            // We just wrap the existing body in a matchesSearch const, and add matchesStatus.
            // Actually, a simpler way is to replace `return existing_cond;` or implicit return.
            // Let's just find the inner part of `.filter(param => ... )`
            let inner = arrayNameMatch[0].substring(arrayNameMatch[0].indexOf('=>') + 2, arrayNameMatch[0].length - 2).trim();
            
            // if it's implicitly returning (no brackets)
            if (!inner.startsWith('{')) {
                const newFilter = `const filtered${filteredName} = ${arrayName}.filter(${param} => {
        const matchesSearch = ${inner};
        const matchesStatus = statusFilter === 'ALL' ? true : (statusFilter === 'ACTIVE' ? ${param}.is_active !== false : ${param}.is_active === false);
        return matchesSearch && matchesStatus;
    });`;
                c = c.replace(arrayNameMatch[0], newFilter);
            } else {
                // If it has brackets, replace `return ...;` with `const matchesSearch = ...;`
                let returnMatch = inner.match(/return ([\s\S]*?);/);
                if (returnMatch) {
                    const newInner = inner.replace(returnMatch[0], `const matchesSearch = ${returnMatch[1]};\n        const matchesStatus = statusFilter === 'ALL' ? true : (statusFilter === 'ACTIVE' ? ${param}.is_active !== false : ${param}.is_active === false);\n        return matchesSearch && matchesStatus;`);
                    const newFilter = `const filtered${filteredName} = ${arrayName}.filter(${param} => ${newInner});`;
                    c = c.replace(arrayNameMatch[0], newFilter);
                }
            }
        }
    }

    // 3. Add dropdown to toolbar
    // Find the Scoped Result div and prepend the select
    const resultSpanRegex = /<span className="text-xs font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1\.5 rounded-lg border border-slate-100 italic">/;
    if (c.match(resultSpanRegex) && !c.includes('<select value={statusFilter}')) {
        const selectHTML = `<select 
                                value={statusFilter} 
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="input-premium w-40 !py-1.5 !px-3"
                                style={{ height: '32px', minHeight: '32px', fontSize: '12px' }}
                            >
                                <option value="ALL">All Status</option>
                                <option value="ACTIVE">Active</option>
                                <option value="DEACTIVE">Deactive</option>
                            </select>\n                            `;
        c = c.replace(resultSpanRegex, selectHTML + '$&');
    }

    fs.writeFileSync(path, c);
    console.log(`Updated ${path}`);
});
