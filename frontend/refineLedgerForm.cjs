const fs = require('fs');
const filePath = 'c:/Works/Mahix/restaurant/frontend/src/pages/dashboard/LedgerMaster.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove max-w-[1000px] mx-auto from the form body container
content = content.replace(
    /className="p-8 max-w-\[1000px\] mx-auto w-full flex flex-col gap-8"/g,
    'className="p-8 w-full flex flex-col gap-8"'
);

// 2. Adjust the left padding of the fixed inset container to match the sidebar better
// If it was lg:pl-[260px], let's make it pl-[250px] as standard Sidebar width is often 250px
content = content.replace(
    /className="fixed inset-0 lg:pl-\[260px\] bg-white z-50 overflow-y-auto animate-in fade-in duration-200"/g,
    'className="fixed inset-0 pl-[250px] bg-white z-50 overflow-y-auto animate-in fade-in duration-200"'
);

// 3. Change all border-orange-300 to border-[#FF5722]/60 to match the distinct orange border
content = content.replace(/border-orange-300/g, 'border-[#FF5722]/60');
// focus:border-orange-500 to focus:border-[#FF5722]
content = content.replace(/focus:border-orange-500/g, 'focus:border-[#FF5722]');

// 4. Update dropdown placeholders to match screenshot:
// "Select Under" is already there.
// Opening balance "Select Type" needs wider width. change w-24 to w-32
content = content.replace(
    /className="w-24 border border-\[\#FF5722\]\/60 rounded px-3 py-1.5/g,
    'className="w-32 border border-[#FF5722]/60 rounded px-3 py-1.5'
);

// 5. Change label widths from w-36 to w-40 or w-44 to match the proportions in the screenshot.
// In the screenshot, the gap between label and colon is quite large. 
content = content.replace(/className="w-36 text-xs/g, 'className="w-48 text-xs');
content = content.replace(/className="w-32 text-xs/g, 'className="w-48 text-xs'); // For bank details

// 6. Increase gap between the two columns
content = content.replace(
    /className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-4"/g,
    'className="grid grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-5"'
);

fs.writeFileSync(filePath, content);
console.log("Updated form styling");
