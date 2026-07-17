const fs = require('fs');

// 1. Update UnitMaster
let unitContent = fs.readFileSync('frontend/src/pages/dashboard/UnitMaster.jsx', 'utf8');

// Header
unitContent = unitContent.replace(
    /<th>Decimal Places<\/th>\s*<th style=\{\{ textAlign: 'right' \}\}>Management<\/th>/,
    '<th>Decimal Places</th>\n                                    <th>Status</th>\n                                    <th style={{ textAlign: \'right\' }}>Management</th>'
);

// Loading/Empty state colSpan
unitContent = unitContent.replace(/colSpan="3"/g, 'colSpan="4"');

// Body cell
const unitTargetCell = /<td>\s*<span className="font-semibold text-slate-600">\s*\{unit\.decimal_places\}\s*<\/span>\s*<\/td>/;
const unitNewCell = `<td>
                                            <span className="font-semibold text-slate-600">
                                                {unit.decimal_places}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={\`badge-premium \${unit.is_active !== false ? 'active' : 'disabled'}\`}>
                                                {unit.is_active !== false ? 'ACTIVE' : 'DEACTIVE'}
                                            </span>
                                        </td>`;
unitContent = unitContent.replace(unitTargetCell, unitNewCell);

fs.writeFileSync('frontend/src/pages/dashboard/UnitMaster.jsx', unitContent);
console.log('UnitMaster updated');


// 2. Update TaxMaster
let taxContent = fs.readFileSync('frontend/src/pages/dashboard/TaxMaster.jsx', 'utf8');

// Header
taxContent = taxContent.replace(
    /<th>IGST %<\/th>\s*<th style=\{\{ textAlign: 'right' \}\}>Action<\/th>/,
    '<th>IGST %</th>\n                                    <th>Status</th>\n                                    <th style={{ textAlign: \'right\' }}>Action</th>'
);

// Loading/Empty state colSpan
taxContent = taxContent.replace(/colSpan="11"/g, 'colSpan="12"');

// Body cell
const taxTargetCell = /<td>\s*<span className="font-semibold text-slate-600">\s*\{tax\.igst !== null \? `\$\{tax\.igst\}%` : '-'\}\s*<\/span>\s*<\/td>/;
const taxNewCell = `<td>
                                            <span className="font-semibold text-slate-600">
                                                {tax.igst !== null ? \`\${tax.igst}%\` : '-'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={\`badge-premium \${tax.is_active !== false ? 'active' : 'disabled'}\`}>
                                                {tax.is_active !== false ? 'ACTIVE' : 'DEACTIVE'}
                                            </span>
                                        </td>`;
taxContent = taxContent.replace(taxTargetCell, taxNewCell);

fs.writeFileSync('frontend/src/pages/dashboard/TaxMaster.jsx', taxContent);
console.log('TaxMaster updated');
