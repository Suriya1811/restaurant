const fs = require('fs');
const filePath = 'c:/Works/Mahix/restaurant/frontend/src/pages/dashboard/ProductMaster.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Hide Header when showDrawer is true
const headerStart = '<Header';
const headerEndString = '/>';
let startIndex = content.indexOf(headerStart);
if (startIndex !== -1) {
    let endIndex = content.indexOf(headerEndString, startIndex) + headerEndString.length;
    let headerCode = content.substring(startIndex, endIndex);
    
    // check if it's already wrapped
    if (!content.substring(startIndex - 20, startIndex).includes('{!showDrawer &&')) {
        let newHeaderCode = '{!showDrawer && (\\n                    ' + headerCode + '\\n                )}';
        content = content.substring(0, startIndex) + newHeaderCode + content.substring(endIndex);
    }
}

// 2. Change h-[calc(100vh-80px)] to h-full in the form to take up the newly freed space
content = content.replace('h-[calc(100vh-80px)]', 'h-full');

fs.writeFileSync(filePath, content);
console.log("Successfully hidden header and adjusted form height.");
