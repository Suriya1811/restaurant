const fs = require('fs');

const file = 'frontend/src/pages/dashboard/UnitMaster.jsx';
let c = fs.readFileSync(file, 'utf8');

c = c.replace(
    '<th>Decimal Places</th>\n                                    <th style={{ textAlign: \'right\' }}>Management</th>',
    '<th>Decimal Places</th>\n                                    <th>Status</th>\n                                    <th style={{ textAlign: \'right\' }}>Management</th>'
);

c = c.replace(
    'colSpan="3" style={{ textAlign: \'center\', padding: \'100px 0\' }}',
    'colSpan="4" style={{ textAlign: \'center\', padding: \'100px 0\' }}'
);
// replace again in case there is a second one
c = c.replace(
    'colSpan="3" style={{ textAlign: \'center\', padding: \'100px 0\' }}',
    'colSpan="4" style={{ textAlign: \'center\', padding: \'100px 0\' }}'
);

// Add the cell right after the decimal_places cell
const targetCell = `                                        <td>
                                            <span className="font-semibold text-slate-600">
                                                {unit.decimal_places}
                                            </span>
                                        </td>`;

const newCell = `                                        <td>
                                            <span className="font-semibold text-slate-600">
                                                {unit.decimal_places}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={\`badge-premium \${unit.is_active !== false ? 'active' : 'disabled'}\`}>
                                                {unit.is_active !== false ? 'ACTIVE' : 'DEACTIVE'}
                                            </span>
                                        </td>`;
c = c.replace(targetCell, newCell);

fs.writeFileSync(file, c);
console.log('UnitMaster updated');
