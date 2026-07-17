const fs = require('fs');

let c = fs.readFileSync('frontend/src/pages/dashboard/TaxMaster.jsx', 'utf8');

// 1. Add statusFilter state
if (!c.includes('const [statusFilter')) {
    c = c.replace(
        "const [searchTerm, setSearchTerm] = useState('');",
        "const [searchTerm, setSearchTerm] = useState('');\n    const [statusFilter, setStatusFilter] = useState('ALL');"
    );
}

// 2. Update filteredTaxes logic
if (!c.includes('matchesActive')) {
    c = c.replace(
        /const filteredTaxes = taxes\.filter\(tax => \{\s*const term = searchTerm\.toLowerCase\(\);\s*return\s*\(\s*tax\.name\.toLowerCase\(\)\.includes\(term\)\s*\);\s*\}\);/,
        `const filteredTaxes = taxes.filter(tax => {
        const term = searchTerm.toLowerCase();
        const matchesSearch = tax.name.toLowerCase().includes(term);
        const isActive = tax.is_active !== false;
        const matchesActive = statusFilter === 'ALL' ? true : statusFilter === 'ACTIVE' ? isActive : !isActive;
        return matchesSearch && matchesActive;
    });`
    );
}

// 3. Add Status column <th>
if (!c.includes('<th>Status</th>')) {
    c = c.replace(
        "<th>IGST %</th>\n                                    <th style={{ textAlign: 'right' }}>Action</th>",
        "<th>IGST %</th>\n                                    <th>Status</th>\n                                    <th style={{ textAlign: 'right' }}>Action</th>"
    );
}

// 4. Add Status column <td>
if (!c.includes('badge-premium')) {
    c = c.replace(
        /<td>\{tax\.local_central === 'CENTRAL' \? `\$\{tax\.igst_rate \|\| 0\}%` : '-'\}<\/td>\s*<td>\s*<ActionDropdown/g,
        `<td>{tax.local_central === 'CENTRAL' ? \`\${tax.igst_rate || 0}%\` : '-'}</td>
                                        <td>
                                            <span className={\`badge-premium \${tax.is_active !== false ? 'active' : 'disabled'}\`}>
                                                {tax.is_active !== false ? 'ACTIVE' : 'DEACTIVE'}
                                            </span>
                                        </td>
                                        <td>
                                                            <ActionDropdown`
    );
}

// 5. Add status filter dropdown
if (!c.includes('value={statusFilter}')) {
    c = c.replace(
        /<div className=\"search-premium\">\s*<Search size=\{20\} \/>\s*<input\s*type=\"text\"\s*placeholder=\"Search taxes\.\.\.\"\s*value=\{searchTerm\}\s*onChange=\{\(e\) => setSearchTerm\(e\.target\.value\)\}\s*\/>\s*<\/div>/g,
        `<div className="search-premium">
                            <Search size={20} />
                            <input
                                type="text"
                                placeholder="Search taxes..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <select 
                                value={statusFilter} 
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="input-premium w-40 !py-1.5 !px-3"
                                style={{ height: '32px', minHeight: '32px', fontSize: '12px' }}
                            >
                                <option value="ALL">All Status</option>
                                <option value="ACTIVE">Active</option>
                                <option value="DEACTIVE">Deactive</option>
                            </select>
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 italic">
                                Scoped Result: {filteredTaxes.length}
                            </span>
                        </div>`
    );
    // Remove the original Scoped Result if it existed outside the gap-4 div
    c = c.replace(
        /<div className=\"flex items-center gap-4\">\s*<span className=\"text-xs font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 italic\">\s*Scoped Result: \{filteredTaxes\.length\}\s*<\/span>\s*<\/div>/g,
        ''
    );
}

fs.writeFileSync('frontend/src/pages/dashboard/TaxMaster.jsx', c);
console.log('Fixed TaxMaster completely');
