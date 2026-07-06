const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'pages/dashboard/SelfServiceDashboard.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove Left Panel
const leftPanelStart = content.indexOf('{/* Left Panel - Cash & Bank Info */}');
const middlePanelStart = content.indexOf('{/* Middle Panel - Daily Sales + Outstanding */}');
if (leftPanelStart !== -1 && middlePanelStart !== -1) {
    content = content.substring(0, leftPanelStart) + content.substring(middlePanelStart);
}

// 2. Change Middle Panel wrapper
content = content.replace(
    '{/* Middle Panel - Daily Sales + Outstanding */}\n                            <div className="lg:col-span-2 xl:col-span-6 flex flex-col gap-3 lg:h-full min-h-0">',
    '{/* Middle Panel - Sales Graph */}\n                            <div className="lg:col-span-3 xl:col-span-9 flex flex-col gap-3 lg:h-full min-h-0">'
);

// 3. Remove Outstanding Balance
const outstandingStart = content.indexOf('<div className="bg-white rounded-2xl border border-slate-100/40 shadow-[0_8px_30px_rgb(15,23,42,0.03)] p-4 flex flex-col min-h-0 flex-1">\n                                    <h3 className="text-[11px] font-medium text-slate-700 uppercase tracking-wider mb-2.5 flex-shrink-0">Outstanding Balance</h3>');
const rightPanelStart = content.indexOf('{/* Right Panel - Quick Actions & Top Categories */}');
if (outstandingStart !== -1 && rightPanelStart !== -1) {
    // We want to keep rightPanelStart but delete from outstandingStart up to rightPanelStart
    content = content.substring(0, outstandingStart) + content.substring(rightPanelStart);
}

// 4. Update Daily Sales title and add Daily button
content = content.replace(
    '<h3 className="text-[11px] font-medium text-slate-700 uppercase tracking-wider">Daily Sales</h3>',
    '<h3 className="text-[11px] font-medium text-slate-700 uppercase tracking-wider">Sales Graph</h3>'
);

const weekButtonStr = `<button
                                                className={\`px-2 py-1 rounded-md text-[9px] font-medium uppercase transition-all tracking-wider \${salesRange === 'Week' ? 'bg-white text-violet-600 shadow-xs' : 'text-slate-400 hover:text-slate-600 bg-transparent'}\`}
                                                onClick={() => applySalesRange('Week')}
                                            >
                                                Week
                                            </button>`;
const dailyButtonStr = `<button
                                                className={\`px-2 py-1 rounded-md text-[9px] font-medium uppercase transition-all tracking-wider \${salesRange === 'Daily' ? 'bg-white text-violet-600 shadow-xs' : 'text-slate-400 hover:text-slate-600 bg-transparent'}\`}
                                                onClick={() => applySalesRange('Daily')}
                                            >
                                                Daily
                                            </button>\n                                            ` + weekButtonStr;

if (content.includes(weekButtonStr) && !content.includes("applySalesRange('Daily')")) {
    content = content.replace(weekButtonStr, dailyButtonStr);
}

// 5. Remove Top Categories
const topCategoriesStart = content.indexOf('{/* Top Categories Chart */}');
const endOfRightPanel = content.indexOf('</div>\n                        </div>\n\n                    </div>');
if (topCategoriesStart !== -1 && endOfRightPanel !== -1) {
    content = content.substring(0, topCategoriesStart) + content.substring(endOfRightPanel);
}

// 6. Right Panel wrapper change
content = content.replace(
    '{/* Right Panel - Quick Actions & Top Categories */}\n                            <div className="lg:col-span-1 xl:col-span-3 flex flex-col gap-3 lg:h-full min-h-0">',
    '{/* Right Panel - Quick Actions */}\n                            <div className="lg:col-span-1 xl:col-span-3 flex flex-col gap-3 lg:h-full min-h-0">'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done modifying SelfServiceDashboard.jsx');
