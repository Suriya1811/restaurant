const fs = require('fs');

const file = 'frontend/src/pages/dashboard/TaxMaster.jsx';
let c = fs.readFileSync(file, 'utf8');

c = c.replace(
    '<th>IGST %</th>\n                                    <th style={{ textAlign: \'right\' }}>Action</th>',
    '<th>IGST %</th>\n                                    <th>Status</th>\n                                    <th style={{ textAlign: \'right\' }}>Action</th>'
);

c = c.replace(
    'colSpan="11" style={{ textAlign: \'center\', padding: \'100px 0\' }}',
    'colSpan="12" style={{ textAlign: \'center\', padding: \'100px 0\' }}'
);
c = c.replace(
    'colSpan="11" style={{ textAlign: \'center\', padding: \'100px 0\' }}',
    'colSpan="12" style={{ textAlign: \'center\', padding: \'100px 0\' }}'
);
c = c.replace( // just in case
    'colSpan="11"', 'colSpan="12"'
);

const targetCell = `                                        <td>
                                            <span className="font-semibold text-slate-600">
                                                {tax.igst !== null ? \`\${tax.igst}%\` : '-'}
                                            </span>
                                        </td>`;

const newCell = `                                        <td>
                                            <span className="font-semibold text-slate-600">
                                                {tax.igst !== null ? \`\${tax.igst}%\` : '-'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={\`badge-premium \${tax.is_active !== false ? 'active' : 'disabled'}\`}>
                                                {tax.is_active !== false ? 'ACTIVE' : 'DEACTIVE'}
                                            </span>
                                        </td>`;

c = c.replace(targetCell, newCell);

fs.writeFileSync(file, c);
console.log('TaxMaster updated');
