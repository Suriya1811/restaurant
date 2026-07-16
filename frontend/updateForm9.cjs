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
    formContent = formContent.replaceAll('text-[14px]', 'text-[15px]');
    formContent = formContent.replaceAll('text-[13px]', 'text-[14px]');
    
    // Increase input padding for more size slightly if needed, but py-1.5 is already pretty good. Let's just increase to py-2 to make inputs bigger
    formContent = formContent.replaceAll('py-1.5', 'py-2');
    
    // Make text darker black
    formContent = formContent.replaceAll('text-slate-800', 'text-black');
    // Inputs don't explicitly set text color in previous script except for read-only ones.
    // Wait, the generic inputs just have 'text-[15px]' and inherit color or use default. 
    // Let's explicitly add text-black to the inputs.
    // 'bg-white !border' is part of all standard inputs. Let's add text-black there.
    formContent = formContent.replaceAll('bg-white !border', 'bg-white text-black font-medium !border');
    
    content = content.substring(0, startIndex) + formContent + content.substring(endIndex);
    fs.writeFileSync(filePath, content);
    console.log("Successfully increased text size and made text darker.");
} else {
    console.log("Could not find form markers.");
}
