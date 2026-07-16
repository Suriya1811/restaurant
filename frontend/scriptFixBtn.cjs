const fs = require('fs');
const filePath = 'c:/Works/Mahix/restaurant/frontend/src/pages/dashboard/BillingPage.jsx';
let content = fs.readFileSync(filePath, 'utf8');

const target1 = `<button type="button" className="btn-export print" onClick={() => handleOrderAction('PRINT')} title="Save and print final bill">
                                        SAVE & PRINT
                                    </button>`;
const replacement1 = `<button type="button" className="action-btn" onClick={() => handleOrderAction('PRINT')} title="Save and print final bill">
                                        SAVE &<br/>PRINT
                                    </button>`;
const target2 = `<button type="button" className="btn-export print" onClick={() => handleOrderAction('KOT')} title="Send KOT to kitchen">
                                        KOT PRINT
                                    </button>`;
const replacement2 = `<button type="button" className="action-btn" onClick={() => handleOrderAction('KOT')} title="Send KOT to kitchen">
                                        KOT<br/>PRINT
                                    </button>`;

if (content.includes(target1)) content = content.replace(target1, replacement1);
if (content.includes(target2)) content = content.replace(target2, replacement2);

fs.writeFileSync(filePath, content);
console.log("Fixed classes");
