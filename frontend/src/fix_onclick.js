const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'pages/dashboard');

// Map of file -> { title, filteredVar, dataVar, columns, rowMapper }
const fileConfigs = {
    'FunctionMaster.jsx': {
        title: 'Function Master',
        filename: 'Function_Master',
        filteredVar: 'filteredFunctions',
        cols: "['#', 'Function Name', 'Description']",
        rowMap: "(f, i) => [i + 1, f.name, f.description || '-']"
    },
    'TableTypeMaster.jsx': {
        title: 'Table Type Master',
        filename: 'TableType_Master',
        filteredVar: 'filteredTableTypes',
        cols: "['#', 'Table Type Name']",
        rowMap: "(t, i) => [i + 1, t.name]"
    },
    'TaxMaster.jsx': {
        title: 'Tax Master',
        filename: 'Tax_Master',
        filteredVar: 'filteredTaxes',
        cols: "['#', 'Tax Name', 'Type', 'CGST %', 'SGST %', 'IGST %']",
        rowMap: "(t, i) => [i + 1, t.name, t.tax_type || '-', t.cgst_rate || 0, t.sgst_rate || 0, t.igst_rate || 0]"
    },
    'GroupMaster.jsx': {
        title: 'Group Master',
        filename: 'Group_Master',
        filteredVar: 'filteredGroups',
        cols: "['#', 'Group Name', 'Nature', 'Parent']",
        rowMap: "(g, i) => [i + 1, g.name, g.nature || '-', g.parent || 'Primary']"
    },
    'WaiterMaster.jsx': {
        title: 'Waiter Master',
        filename: 'Waiter_Master',
        filteredVar: 'filteredWaiters',
        cols: "['#', 'Name', 'Phone', 'Address']",
        rowMap: "(w, i) => [i + 1, w.name, w.phone || '-', w.address || '-']"
    },
    'CaptainMaster.jsx': {
        title: 'Captain Master',
        filename: 'Captain_Master',
        filteredVar: 'filteredCaptains',
        cols: "['#', 'Name', 'Phone', 'Address']",
        rowMap: "(c, i) => [i + 1, c.name, c.phone || '-', c.address || '-']"
    },
    'StaffMaster.jsx': {
        title: 'Staff Master',
        filename: 'Staff_Master',
        filteredVar: 'filteredStaff',
        cols: "['#', 'Name', 'Role', 'Phone']",
        rowMap: "(s, i) => [i + 1, s.name, s.role || '-', s.phone || '-']"
    },
    'TableMaster.jsx': {
        title: 'Table Master',
        filename: 'Table_Master',
        filteredVar: 'filteredTables',
        cols: "['#', 'Table Name', 'Capacity', 'Status']",
        rowMap: "(t, i) => [i + 1, t.name, t.capacity || '-', t.status || '-']"
    },
    'ProductMaster.jsx': {
        title: 'Product Master',
        filename: 'Product_Master',
        filteredVar: 'filteredProducts',
        cols: "['#', 'Product Name', 'Category', 'Code', 'Price']",
        rowMap: "(p, i) => [i + 1, p.name, p.category || '-', p.code || '-', p.price || '-']"
    },
    'MaintainCoupon.jsx': {
        title: 'Coupon Master',
        filename: 'Coupon_Master',
        filteredVar: 'filteredCoupons',
        cols: "['#', 'Coupon Code', 'Discount', 'Type', 'Status']",
        rowMap: "(c, i) => [i + 1, c.code || c.name, c.discount || '-', c.type || '-', c.is_active ? 'Active' : 'Inactive']"
    }
};

// Also fix TableMaster's special space-padded onClick patterns
function fixOnClicks(content, filename) {
    // Fix space-padded onClick={() => { }} 
    content = content.replace(/onClick=\{[()=>\s]*\{\s*\}\s*\}/g, function(match, offset) {
        // Check context - has it already been replaced?
        return match; // Will handle separately
    });
    
    // Simple indexOf approach for `onClick={() => { }}` (with spaces)
    const excelEmpty = 'onClick={() => { }}';
    let idx = content.indexOf(excelEmpty);
    if (idx !== -1) {
        content = content.slice(0, idx) + 'onClick={handleExcelExport}' + content.slice(idx + excelEmpty.length);
    }
    idx = content.indexOf(excelEmpty);
    if (idx !== -1) {
        content = content.slice(0, idx) + 'onClick={handlePDFExport}' + content.slice(idx + excelEmpty.length);
    }
    
    return content;
}

files = Object.keys(fileConfigs);

files.forEach(file => {
    const cfg = fileConfigs[file];
    const filePath = path.join(dir, file);
    
    if (!fs.existsSync(filePath)) { console.log(`SKIP: ${file}`); return; }
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix TableMaster's special onClick pattern
    if (file === 'TableMaster.jsx') {
        content = fixOnClicks(content, file);
    }
    
    // Check if handler functions already defined
    if (content.includes('handleExcelExport = ()')) {
        console.log(`HANDLERS ALREADY EXIST: ${file}`);
        fs.writeFileSync(filePath, content, 'utf8');
        return;
    }
    
    // Build handler code
    const handlerCode = `
    const exportCols = ${cfg.cols};
    const getExportRows = () => ${cfg.filteredVar}.map(${cfg.rowMap});
    const handleExcelExport = () => exportToCSV('${cfg.title}', exportCols, getExportRows(), '${cfg.filename}');
    const handlePDFExport   = () => exportToPDF('${cfg.title}', exportCols, getExportRows(), '${cfg.filename}');
    const handlePrint       = () => printTable('${cfg.title}', \`Total: \${${cfg.filteredVar}.length}\`, exportCols, getExportRows());

    return (`;
    
    // Find `    return (` and replace with handler code + return
    const returnPattern = /(\n|\r\n)    return \(/;
    if (returnPattern.test(content)) {
        content = content.replace(returnPattern, '\n' + handlerCode);
        console.log(`ADDED HANDLERS: ${file}`);
    } else {
        console.log(`WARNING - return not found: ${file}`);
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
});

console.log('\nDone!');
