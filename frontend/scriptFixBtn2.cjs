const fs = require('fs');
const filePath = 'c:/Works/Mahix/restaurant/frontend/src/pages/dashboard/BillingPage.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// Replace "SAVE & PRINT" button
content = content.replace(
    /<button[^>]*className="btn-export print"[^>]*onClick=\{[^}]*handleOrderAction\('PRINT'\)[^}]*\}[^>]*>[\s\S]*?SAVE & PRINT[\s\S]*?<\/button>/g,
    `<button type="button" className="action-btn" onClick={() => handleOrderAction('PRINT')} title="Save and print final bill">
                                        SAVE &<br/>PRINT
                                    </button>`
);

// Replace "KOT PRINT" button
content = content.replace(
    /<button[^>]*className="btn-export print"[^>]*onClick=\{[^}]*handleOrderAction\('KOT'\)[^}]*\}[^>]*>[\s\S]*?KOT PRINT[\s\S]*?<\/button>/g,
    `<button type="button" className="action-btn" onClick={() => handleOrderAction('KOT')} title="Send KOT to kitchen">
                                        KOT<br/>PRINT
                                    </button>`
);

fs.writeFileSync(filePath, content);
console.log("Fixed classes with regex");
