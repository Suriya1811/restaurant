const fs = require('fs');
const filePath = 'c:/Works/Mahix/restaurant/frontend/src/pages/dashboard/ProductMaster.jsx';
let content = fs.readFileSync(filePath, 'utf8');

const startMarker = '<section className="inline-form-panel relative';
const endMarker = '</section>';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker, startIndex) + endMarker.length;

if (startIndex > -1 && endIndex > startIndex) {
    let formContent = content.substring(startIndex, endIndex);

    // Make the orange border important to override any tailwind forms plugin styles
    formContent = formContent.replaceAll('border-[#FF5722]', '!border-[#FF5722]');
    
    // Also check for bg-slate-50 border border-[#FF5722] and make it !border-[#FF5722]
    
    content = content.substring(0, startIndex) + formContent + content.substring(endIndex);
    fs.writeFileSync(filePath, content);
    console.log("Successfully made orange borders important.");
} else {
    console.log("Could not find form markers.");
}
