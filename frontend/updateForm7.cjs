const fs = require('fs');
const filePath = 'c:/Works/Mahix/restaurant/frontend/src/pages/dashboard/ProductMaster.jsx';
let content = fs.readFileSync(filePath, 'utf8');

const startMarker = '<section className="inline-form-panel relative';
const endMarker = '</section>';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker, startIndex) + endMarker.length;

if (startIndex > -1 && endIndex > startIndex) {
    let formContent = content.substring(startIndex, endIndex);

    // Increase text sizes
    formContent = formContent.replaceAll('text-[13px]', 'text-[14px]');
    formContent = formContent.replaceAll('text-[12px]', 'text-[13px]');
    
    // Increase input padding for more size
    formContent = formContent.replaceAll('py-1 ', 'py-1.5 ');
    formContent = formContent.replaceAll('py-1"', 'py-1.5"');
    
    content = content.substring(0, startIndex) + formContent + content.substring(endIndex);
    fs.writeFileSync(filePath, content);
    console.log("Successfully increased text and input sizes.");
} else {
    console.log("Could not find form markers.");
}
