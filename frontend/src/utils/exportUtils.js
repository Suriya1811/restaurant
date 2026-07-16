import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Export data to CSV and trigger browser download.
 * @param {string} title  - Report title shown as first line
 * @param {string[]} headers - Column header labels
 * @param {(string|number)[][]} rows - 2-D array of row data
 * @param {string} filename - Download filename (without extension)
 */
export const exportToCSV = (title, headers, rows, filename) => {
    const headerLine = headers.map(h => `"${h}"`).join(',');
    const bodyLines = rows.map(row =>
        row.map(cell => `"${String(cell ?? '-').replace(/"/g, '""')}"`).join(',')
    );
    const csvContent =
        'data:text/csv;charset=utf-8,' +
        encodeURIComponent(
            `${title}\nGenerated: ${new Date().toLocaleString('en-GB')}\n\n` +
            headerLine + '\n' +
            bodyLines.join('\n')
        );
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

/**
 * Export data to PDF using jsPDF + autoTable.
 * @param {string} title  - Report title
 * @param {string[]} headers - Column header labels
 * @param {(string|number)[][]} rows - 2-D array of row data
 * @param {string} filename - Download filename (without extension)
 * @param {'portrait'|'landscape'} orientation - PDF orientation
 */
export const exportToPDF = (title, headers, rows, filename, orientation = 'landscape') => {
    const doc = new jsPDF(orientation);
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text(title, 14, 18);
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleString('en-GB')}  |  Total Records: ${rows.length}`, 14, 25);

    autoTable(doc, {
        startY: 30,
        head: [headers],
        body: rows,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], textColor: [249, 115, 22], fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        styles: { cellPadding: 3 },
    });

    doc.save(`${filename}.pdf`);
};

/**
 * Open a print-friendly window with a formatted table.
 * @param {string} title  - Report title
 * @param {string} subMeta - Extra metadata (e.g. filters)
 * @param {string[]} headers - Column header labels
 * @param {(string|number)[][]} rows - 2-D array of row data
 */
export const printTable = (title, subMeta, headers, rows) => {
    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    const thead = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;
    const tbody = rows.map(row =>
        `<tr>${row.map(cell => `<td>${cell ?? '-'}</td>`).join('')}</tr>`
    ).join('');

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #111; background: white; padding: 16px; }
    h1 { font-size: 17px; font-weight: bold; margin-bottom: 3px; }
    .meta { font-size: 10px; color: #555; margin-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; margin-top: 6px; }
    th { background: #0f172a; color: #f97316; font-size: 9px; font-weight: bold; text-transform: uppercase; padding: 6px 8px; text-align: left; border-right: 1px solid #1e293b; }
    td { padding: 5px 8px; font-size: 10px; border-bottom: 1px solid #f1f5f9; border-right: 1px solid #f1f5f9; }
    tr:nth-child(even) td { background: #fafafa; }
    @page { size: landscape; margin: 8mm; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <p class="meta">${subMeta}&nbsp;|&nbsp;Printed: ${new Date().toLocaleString('en-GB')}&nbsp;|&nbsp;Records: ${rows.length}</p>
  <table>
    <thead>${thead}</thead>
    <tbody>${tbody}</tbody>
  </table>
</body>
</html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
};
