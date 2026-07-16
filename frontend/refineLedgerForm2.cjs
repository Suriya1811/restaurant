const fs = require('fs');
const filePath = 'c:/Works/Mahix/restaurant/frontend/src/pages/dashboard/LedgerMaster.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Solid orange borders for all inputs
content = content.replace(/border-\[\#FF5722\]\/60/g, 'border-[#FF5722]');

// 2. Reduce the gap between columns
content = content.replace(/gap-x-16/g, 'gap-x-6');

// 3. Make labels black and slightly larger if needed (text-xs is fine if it's bold, but let's ensure it's black)
content = content.replace(/text-slate-800/g, 'text-black');

// 4. Change BANK DETAILS text to orange
content = content.replace(
    /className="absolute -top-3 left-4 bg-white px-2 text-xs font-bold text-black uppercase flex items-center gap-2"/g,
    'className="absolute -top-3 left-4 bg-white px-2 text-xs font-bold text-[#FF5722] uppercase flex items-center gap-2"'
);

// 5. Adjust the Bank details top line to be solid orange
content = content.replace(/className="border border-\[\#FF5722\] rounded mt-4 p-4 relative pt-6"/g, 'className="border border-[#FF5722] rounded mt-4 p-4 relative pt-6"');

// 6. Address spacing: change gap-2 to gap-1
content = content.replace(/className="flex flex-col gap-2 mt-2"/g, 'className="flex flex-col gap-1 mt-2"');

// 7. Make the labels container width a bit smaller if the gap is smaller so inputs can be even wider
content = content.replace(/w-48/g, 'w-40');

// 8. Header title - make it bolder and larger
content = content.replace(
    /className="text-lg font-bold uppercase tracking-wide text-black"/g,
    'className="text-xl font-black uppercase tracking-wide text-black"'
);

fs.writeFileSync(filePath, content);
console.log("Refined LedgerMaster form layout and colors");
