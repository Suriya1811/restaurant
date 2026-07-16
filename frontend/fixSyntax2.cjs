const fs = require('fs');
const filePath = 'c:/Works/Mahix/restaurant/frontend/src/pages/dashboard/ProductMaster.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// The file currently has literal \n injected. Let's find exactly what to replace.
let toReplace1 = '{!showDrawer && (\\n<Header';
let toReplace2 = '<Download size={14} />\\n                )}';

// This is too messy because the closing parenthesis is at line 983 due to my previous bad replacement!

// Let's just find the start: "<main className=\\"dashboard-main\\">"
const startMarker = '<main className="dashboard-main">';
const endMarker = '<div className="master-content-layout fade-in !pt-2">';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker, startIndex);

if (startIndex > -1 && endIndex > -1) {
    const fixedContent = `
            <main className="dashboard-main">
                {!showDrawer && (
                    <Header
                        toggleSidebar={toggleSidebar}
                        title={user?.restaurant_name || "Profile Name"}
                        actions={
                            <>
                                <button
                                    type="button"
                                    className="btn-export excel"
                                    onClick={handleExcelExport}
                                    title="Export to Excel"
                                >
                                    <Download size={14} />
                                    <span className="text-[10px] uppercase font-black text-emerald-500">Excel</span>
                                </button>
                                <button
                                    type="button"
                                    className="btn-export pdf"
                                    onClick={handlePDFExport}
                                    title="Export to PDF"
                                >
                                    <Download size={14} />
                                    <span className="text-[10px] uppercase font-black text-rose-500">PDF</span>
                                </button>
                                <button
                                    type="button"
                                    className="btn-export print"
                                    onClick={handlePrint}
                                    title="Print"
                                >
                                    <Printer size={14} />
                                    <span className="text-[10px] uppercase font-black text-blue-500">Print</span>
                                </button>
                                <button
                                    type="button"
                                    className="px-4 py-2 bg-[#0F172A] text-white rounded text-xs font-bold hover:bg-[#1e293b] transition-colors uppercase tracking-wide flex items-center gap-2 shadow-sm"
                                    onClick={() => setShowColumnSettingsSidebar(true)}
                                    title="Column Settings"
                                >
                                    <Settings size={14} />
                                    <span>COLUMN SETTINGS</span>
                                </button>
                                <button className="btn-action-add" onClick={() => { resetForm(); setSearchTerm(''); setShowDrawer(true); }}>
                                    <PlusCircle size={18} />
                                    <span className="text-[10px] uppercase font-black">Add New Item</span>
                                </button>
                            </>
                        }
                    />
                )}
                {!showDrawer ? (
                    `;
    
    content = content.substring(0, startIndex) + fixedContent.trimStart() + content.substring(endIndex);
    fs.writeFileSync(filePath, content);
    console.log("Successfully fixed the header syntax!");
} else {
    console.log("Could not find markers.");
}
