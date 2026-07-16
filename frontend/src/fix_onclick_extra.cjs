const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'pages/dashboard');

const fileConfigs = {
    'CustomerMaster.jsx': {
        title: 'Customer Master',
        filename: 'Customer_Master',
        filteredVar: 'filteredCustomers',
        cols: "['#', 'Name', 'Phone', 'Email', 'GST', 'Balance', 'Points']",
        rowMap: "(c, i) => [i + 1, c.name, c.phone || '-', c.email || '-', c.gst_number || '-', c.opening_balance || 0, c.loyalty_points || 0]"
    },
    'SupplierMaster.jsx': {
        title: 'Supplier Master',
        filename: 'Supplier_Master',
        filteredVar: 'filteredSuppliers',
        cols: "['#', 'Vendor Entity', 'Contact Person', 'Phone', 'GST', 'Balance']",
        rowMap: "(s, i) => [i + 1, s.name, s.contact_person || '-', s.contact_number || '-', s.gst_number || '-', s.opening_balance || 0]"
    }
};

const files = Object.keys(fileConfigs);
const importLine = "import { exportToCSV, exportToPDF, printTable } from '../../utils/exportUtils';\n";

files.forEach(file => {
    const cfg = fileConfigs[file];
    const filePath = path.join(dir, file);
    
    if (!fs.existsSync(filePath)) { console.log(`SKIP: ${file}`); return; }
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Add import if not present
    if (!content.includes('exportUtils')) {
        content = content.replace(/(import SaveConfirmationModal from '[^']+';)/, `$1\n${importLine}`);
    }

    // Fix empty onClicks
    const excelEmpty = 'onClick={() => {}}';
    let idx = content.indexOf(excelEmpty);
    if (idx !== -1) {
        content = content.slice(0, idx) + 'onClick={handleExcelExport}' + content.slice(idx + excelEmpty.length);
    }
    idx = content.indexOf(excelEmpty);
    if (idx !== -1) {
        content = content.slice(0, idx) + 'onClick={handlePDFExport}' + content.slice(idx + excelEmpty.length);
    }
    content = content.split('onClick={() => window.print()}').join('onClick={handlePrint}');
    
    // Add handler logic if not present
    if (!content.includes('handleExcelExport = ()')) {
        const handlerCode = `
    const exportCols = ${cfg.cols};
    const getExportRows = () => ${cfg.filteredVar}.map(${cfg.rowMap});
    const handleExcelExport = () => exportToCSV('${cfg.title}', exportCols, getExportRows(), '${cfg.filename}');
    const handlePDFExport   = () => exportToPDF('${cfg.title}', exportCols, getExportRows(), '${cfg.filename}');
    const handlePrint       = () => printTable('${cfg.title}', \`Total: \${${cfg.filteredVar}.length}\`, exportCols, getExportRows());

    return (`;
        content = content.replace(/(\n|\r\n)\s*return \(/, '\n' + handlerCode);
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`FIXED: ${file}`);
});
