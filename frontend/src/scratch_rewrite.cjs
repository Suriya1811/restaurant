const fs = require('fs');
const path = require('path');

const filePath = path.join('c:', 'Works', 'Mahix', 'toolnew', 'frontend', 'src', 'pages', 'dashboard', 'SelfServiceDashboard.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove Top Stat Cards background hovers and bold text
content = content.replace(/font-black/g, 'font-medium');
content = content.replace(/font-bold/g, 'font-medium');
content = content.replace(/font-extrabold/g, 'font-medium');
content = content.replace(/hover:bg-[a-z]+-\d+(?:\/\d+)?/g, '');

// 2. Remove overflow-y-auto and overflow-hidden
content = content.replace(/overflow-hidden/g, '');
content = content.replace(/overflow-y-auto/g, '');

// 3. Find and replace "Main Content Area" block
const mainAreaRegex = /\{\/\* Main Content Area \*\/\}(.|\n)*?\{\/\* Top Categories Chart \*\/\}(.|\n)*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/main>\s*<\/div>\s*\);\s*\};\s*export default SelfServiceDashboard;/;

const newMainArea = `{/* Main Content Area */}
                    <div className="flex-1 flex flex-col min-h-0">
                        <div className="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-12 gap-4 flex-1 min-h-0 mb-4">

                            {/* Left Panel - Sales Graph */}
                            <div className="lg:col-span-3 xl:col-span-9 flex flex-col gap-3 min-h-0">
                                <div className="bg-white rounded-2xl border border-slate-100/40 shadow-sm p-4 flex flex-col min-h-0 flex-1">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2 flex-shrink-0">
                                        <h3 className="text-sm font-medium text-slate-700 uppercase tracking-wider">Sales Graph</h3>
                                        <div className="flex flex-wrap gap-2 bg-slate-50 p-1 rounded-lg border border-slate-100">
                                            <button
                                                className={\`px-3 py-1.5 rounded-md text-xs font-medium uppercase transition-all \${salesRange === 'Day' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700 bg-transparent'}\`}
                                                onClick={() => applySalesRange('Day')}
                                            >
                                                Daily
                                            </button>
                                            <button
                                                className={\`px-3 py-1.5 rounded-md text-xs font-medium uppercase transition-all \${salesRange === 'Week' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700 bg-transparent'}\`}
                                                onClick={() => applySalesRange('Week')}
                                            >
                                                Weekly
                                            </button>
                                            <button
                                                className={\`px-3 py-1.5 rounded-md text-xs font-medium uppercase transition-all \${salesRange === 'Month' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700 bg-transparent'}\`}
                                                onClick={() => applySalesRange('Month')}
                                            >
                                                Monthly
                                            </button>
                                            <button
                                                className={\`px-3 py-1.5 rounded-md text-xs font-medium uppercase transition-all \${salesRange === 'Year' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700 bg-transparent'}\`}
                                                onClick={() => applySalesRange('Year')}
                                            >
                                                Yearly
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex-1 min-h-0 relative w-full mt-4">
                                        <div className="absolute inset-0">
                                            <Bar
                                                data={inflowChartData}
                                                options={{
                                                    ...chartOptions,
                                                    maintainAspectRatio: false,
                                                    plugins: {
                                                        ...chartOptions.plugins,
                                                        legend: { ...chartOptions.plugins.legend, display: true, position: 'bottom' }
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Panel - Quick Actions */}
                            <div className="lg:col-span-1 xl:col-span-3 flex flex-col gap-3 min-h-0">
                                <div className="bg-white rounded-2xl border border-slate-100/40 shadow-sm p-5 flex-shrink-0">
                                    <h3 className="text-base font-medium text-slate-800 uppercase tracking-wider mb-4">Quick Actions</h3>
                                    <div className="flex flex-col gap-3">
                                        <button onClick={() => navigate('/dashboard/self-service/kitchen-display')} className="w-full flex items-center gap-3 p-3 bg-indigo-50/30 border border-indigo-100/50 rounded-xl transition-all group text-left">
                                            <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <Monitor size={16} />
                                            </div>
                                            <span className="text-sm font-medium text-slate-700 truncate">KOT</span>
                                        </button>

                                        <button onClick={() => navigate('/dashboard/self-service/billing')} className="w-full flex items-center gap-3 p-3 bg-purple-50/30 border border-purple-100/50 rounded-xl transition-all group text-left">
                                            <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <PlusCircle size={16} />
                                            </div>
                                            <span className="text-sm font-medium text-slate-700 truncate">SALES BILL</span>
                                        </button>
                                        
                                        <button onClick={() => navigate('/dashboard/self-service/purchase')} className="w-full flex items-center gap-3 p-3 bg-rose-50/30 border border-rose-100/50 rounded-xl transition-all group text-left">
                                            <div className="w-8 h-8 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <ShoppingCart size={16} />
                                            </div>
                                            <span className="text-sm font-medium text-slate-700 truncate">PURCHASE</span>
                                        </button>

                                        <button onClick={() => navigate('/dashboard/self-service/products')} className="w-full flex items-center gap-3 p-3 bg-violet-50/30 border border-violet-100/50 rounded-xl transition-all group text-left">
                                            <div className="w-8 h-8 bg-violet-100 text-violet-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <Box size={16} />
                                            </div>
                                            <span className="text-sm font-medium text-slate-700 truncate">ITEM CREATION</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SelfServiceDashboard;
`;

content = content.replace(mainAreaRegex, newMainArea);

fs.writeFileSync(filePath, content, 'utf8');
console.log("SelfServiceDashboard.jsx rewritten successfully");
