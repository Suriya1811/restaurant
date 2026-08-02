// Utility for managing system printers and directing Sales Bill / KOT print jobs

export const getSavedSalesBillPrinter = () => {
    return localStorage.getItem('pos_sales_bill_printer') || 'Sales Bill Printer';
};

export const getSavedKOTPrinter = () => {
    return localStorage.getItem('pos_kot_printer') || 'KOT Printer';
};

export const fetchSystemPrinters = async () => {
    try {
        const savedUser = localStorage.getItem('user');
        if (!savedUser) return ['Default System Printer', 'Sales Bill Thermal Printer (POS-80)', 'KOT Kitchen Thermal Printer (KOT-80)', 'Microsoft Print to PDF'];
        const { token } = JSON.parse(savedUser);
        const res = await fetch(`${import.meta.env.VITE_API_URL}/printers/system-printers`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
            return data.data;
        }
    } catch (err) {
        console.error('Error fetching system printers:', err);
    }
    return ['Default System Printer', 'Sales Bill Thermal Printer (POS-80)', 'KOT Kitchen Thermal Printer (KOT-80)', 'Microsoft Print to PDF'];
};

export const printDocumentToPrinter = (htmlContent, printerType = 'SALES_BILL', documentTitle = '') => {
    const selectedPrinter = printerType === 'KOT' ? getSavedKOTPrinter() : getSavedSalesBillPrinter();
    const title = documentTitle || (printerType === 'KOT' ? 'Kitchen Order Ticket (KOT)' : 'Sales Bill Receipt');

    // 1. Desktop App Direct Printing via Electron if available
    if (window.electronAPI && window.electronAPI.print) {
        try {
            window.electronAPI.print({
                html: htmlContent,
                printerName: selectedPrinter,
                deviceName: selectedPrinter,
                silent: false
            });
            return;
        } catch (e) {
            console.error('Electron print error:', e);
        }
    }

    // 2. Standard Web Print Fallback targeting the assigned printer
    const printWindow = window.open('', '_blank', 'width=450,height=650');
    if (!printWindow) {
        alert(`Popup blocked. Please allow popups to send print to ${selectedPrinter}.`);
        return;
    }

    const fullHtml = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${title} [Target: ${selectedPrinter}]</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @page { size: 80mm auto; margin: 0; }
        html, body {
            font-family: 'Courier New', Courier, monospace, 'Lucida Console', system-ui, sans-serif;
            width: 72mm;
            margin: 0 auto;
            padding: 3mm 2mm 15mm 2mm;
            color: #000000;
            background: #ffffff;
            font-size: 11px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        table { width: 100%; border-collapse: collapse; table-layout: fixed; }
        th, td { color: #000000; }
        @media print {
            body { width: 72mm !important; margin: 0 auto !important; }
        }
    </style>
</head>
<body>
    ${htmlContent}
</body>
</html>`;

    printWindow.document.open();
    printWindow.document.write(fullHtml);
    printWindow.document.close();
    printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
        printWindow.onafterprint = () => printWindow.close();
    };
};
