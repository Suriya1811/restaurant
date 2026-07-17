const fs = require('fs');

function processFile(filename) {
    let content = fs.readFileSync(filename, 'utf8');

    // Replace thead tr class properly
    content = content.replace(/<tr className="bg-\\[#0b1727\\][^\"]*">/g, '<tr>');
    
    fs.writeFileSync(filename, content);
}

processFile('frontend/src/pages/dashboard/LedgerMaster.jsx');
processFile('frontend/src/pages/dashboard/GroupMaster.jsx');
console.log('Fixed tr');
