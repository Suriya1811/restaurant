const fs = require('fs');
const filePath = 'c:/Works/Mahix/restaurant/frontend/src/pages/dashboard/LedgerMaster.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// The issue is that `max-w-[1200px]` centers the form in the `fixed inset-0` container.
// If the screen is small, the left side of the form falls behind the sidebar.
// We will replace `fixed inset-0` with `absolute inset-0` so it only covers the content area,
// OR we add padding left. Since we want to make it narrower to prevent squishing, 
// we will change `max-w-[1200px]` to `max-w-5xl` (1024px) or `max-w-[1000px]`,
// and we will wrap the content in a pl-[260px] or just change max-w to 4xl.

// Let's replace:
// <div className="fixed inset-0 bg-white z-50 overflow-y-auto animate-in fade-in duration-200">
// with:
// <div className="fixed inset-0 lg:pl-[260px] bg-white z-50 overflow-y-auto animate-in fade-in duration-200">
let newContent = content.replace(
    `<div className="fixed inset-0 bg-white z-50 overflow-y-auto animate-in fade-in duration-200">`,
    `<div className="fixed inset-0 lg:pl-[260px] bg-white z-50 overflow-y-auto animate-in fade-in duration-200">`
);

// Also change max-w-[1200px] to max-w-[1000px] just in case
newContent = newContent.replace(
    `<div className="p-8 max-w-[1200px] mx-auto w-full flex flex-col gap-8">`,
    `<div className="p-8 max-w-[1000px] mx-auto w-full flex flex-col gap-8">`
);

// The label widths are w-40. We can change them to w-36 to save space.
newContent = newContent.replace(/w-40/g, 'w-36');

fs.writeFileSync(filePath, newContent);
console.log("Fixed collapsed issue");
