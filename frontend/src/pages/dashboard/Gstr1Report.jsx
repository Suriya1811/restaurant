import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '@/components/dashboard/Sidebar';
import DashboardPageShell from '../../components/dashboard/DashboardPageShell';
import { Menu, FileSpreadsheet, FileText, Printer, Code, X, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../services/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const Gstr1Report = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const filterParam = (searchParams.get('filter') || 'gstr1').toLowerCase();

    const getReportTitle = () => {
        if (filterParam === 'gstr2') return 'GSTR-2 Reports';
        if (filterParam === 'gstr3b') return 'GSTR-3B Reports';
        return 'GSTR-1 Reports';
    };
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('B2B');
    const [currentPage, setCurrentPage] = useState(1);

    const getItemsPerPage = () => {
        if (activeTab === 'B2C Small' || activeTab.includes('HSN')) return 5;
        return 4;
    };
    const itemsPerPage = getItemsPerPage();

    const toggleSidebar = () => {
        if (window.innerWidth <= 768) {
            setIsMobileSidebarOpen(!isMobileSidebarOpen);
        } else {
            const newState = !isCollapsed;
            setIsCollapsed(newState);
            localStorage.setItem('sidebarCollapsed', newState);
        }
    };

    const tabs = [
        'B2B', 'B2C Large', 'B2C Small', 'Cr / Dr Note', 'Cr / Dr Note for Unregistered',
        'Exempted GST', 'HSN B2B', 'HSN B2C', 'List of Document', 'Export'
    ];

    const [liveData, setLiveData] = useState({ b2b: [], b2cLarge: [], b2cSmall: [], hsn: [] });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchGstData = async () => {
            setLoading(true);
            try {
                const response = await api.get('/reports/gst/gstr1');
                if (response && response.success) {
                    setLiveData(response.data);
                }
            } catch (error) {
                console.error('Error fetching GSTR1 data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchGstData();
    }, []);

    const b2bData = liveData.b2b || [];
    const b2clData = liveData.b2cLarge || [];
    const b2csData = liveData.b2cSmall || [];
    const hsnData = liveData.hsn || [];

    const getPaginatedData = (dataArray) => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return dataArray.slice(startIndex, startIndex + itemsPerPage);
    };

    const exportToCSV = () => {
        let headers = [];
        let rows = [];
        let filename = `GSTR1_${activeTab}_Report`;

        if (activeTab === 'B2B') {
            headers = ["GSTN/UIN of Recipient", "Receiver Name", "Invoice Number", "Invoice Date", "Invoice Value (Rs)", "Place of Supply", "Reverse Charge", "Applicable % of Tax Rate", "Invoice Type", "E-Commerce GSTIN", "Rate (%)", "Taxable Value (Rs)", "Cess Amount (Rs)"];
            rows = b2bData.map(row => [
                row.gstin, row.receiver, row.invNo, row.invDate, row.invValue, row.pos, row.revCharge, row.appTaxRate, row.invType, row.ecommGstin, row.rate, row.taxableValue, row.cess
            ]);
        } else if (activeTab === 'B2C Large') {
            headers = ["Invoice Number", "Invoice Date", "Invoice Value (Rs)", "Place of Supply", "Applicable % of Tax Rate", "Taxable Value (Rs)", "Cess Amount (Rs)", "E-commerce GSTIN"];
            rows = b2clData.map(row => [
                row.invNo, row.invDate, row.invValue, row.pos, row.appTaxRate, row.taxableValue, row.cess, row.ecommGstin
            ]);
        } else if (activeTab === 'B2C Small') {
            headers = ["Type", "Place of Supply", "Applicable % of Tax Rate", "Taxable Value (Rs)", "Cess Amount (Rs)", "E-commerce GSTIN"];
            rows = b2csData.map(row => [
                row.type, row.pos, row.appTaxRate, row.taxableValue, row.cess, row.ecommGstin
            ]);
        } else if (activeTab === 'HSN B2B' || activeTab === 'HSN B2C') {
            headers = ["HSN", "Description", "UQC", "Total Quantity", "Total Value (Rs)", "Taxable Value (Rs)", "Rate", "Integrated Tax (Rs)", "Central Tax (Rs)", "State / UT Tax (Rs)", "Cess (Rs)"];
            rows = hsnData.map(row => [
                row.hsn, row.desc, row.uqc, row.qty, row.val, row.taxVal, row.rate, row.igst, row.cgst, row.sgst, row.cess
            ]);
        } else {
            headers = ["Message"];
            rows = [["Data not available for export in this tab"]];
        }

        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + 
            [headers.join(','), ...rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
            
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${filename}_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportToPDF = () => {
        let headers = [];
        let body = [];
        let title = `GSTR-1 ${activeTab} Report`;

        if (activeTab === 'B2B') {
            headers = [["GSTN/UIN", "Receiver", "Inv No", "Inv Date", "Inv Val", "POS", "Rev", "Tax Rate", "Type", "Ecomm", "Rate", "Taxable", "Cess"]];
            body = b2bData.map(row => [
                row.gstin, row.receiver, row.invNo, row.invDate, row.invValue.toFixed(2), row.pos, row.revCharge, row.appTaxRate, row.invType, row.ecommGstin, row.rate, row.taxableValue.toFixed(2), row.cess.toFixed(2)
            ]);
        } else if (activeTab === 'B2C Large') {
            headers = [["Inv No", "Inv Date", "Inv Value", "POS", "Tax Rate", "Taxable Val", "Cess", "Ecomm"]];
            body = b2clData.map(row => [
                row.invNo, row.invDate, row.invValue.toFixed(2), row.pos, row.appTaxRate, row.taxableValue.toFixed(2), row.cess.toFixed(2), row.ecommGstin
            ]);
        } else if (activeTab === 'B2C Small') {
            headers = [["Type", "POS", "Tax Rate", "Taxable Val", "Cess", "Ecomm"]];
            body = b2csData.map(row => [
                row.type, row.pos, row.appTaxRate, row.taxableValue.toFixed(2), row.cess.toFixed(2), row.ecommGstin
            ]);
        } else if (activeTab === 'HSN B2B' || activeTab === 'HSN B2C') {
            headers = [["HSN", "Description", "UQC", "Qty", "Val", "Taxable Val", "Rate", "IGST", "CGST", "SGST", "Cess"]];
            body = hsnData.map(row => [
                row.hsn, row.desc, row.uqc, row.qty, row.val.toFixed(2), row.taxVal.toFixed(2), row.rate, row.igst.toFixed(2), row.cgst.toFixed(2), row.sgst.toFixed(2), row.cess.toFixed(2)
            ]);
        } else {
            headers = [["Message"]];
            body = [["Data not available for export in this tab"]];
        }

        const doc = new jsPDF('landscape');
        doc.setFontSize(16);
        doc.text(title, 14, 20);
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleString('en-GB')}`, 14, 28);

        autoTable(doc, {
            startY: 34,
            head: headers,
            body: body,
            theme: 'grid',
            styles: { fontSize: 7 }
        });

        doc.save(`GSTR1_${activeTab}_Report_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.pdf`);
    };

    const handlePrint = () => {
        let headers = [];
        let rows = [];
        let title = `GSTR-1 ${activeTab} Report`;

        if (activeTab === 'B2B') {
            headers = ["GSTN/UIN", "Receiver", "Inv No", "Inv Date", "Inv Value", "POS", "Rev", "Tax Rate", "Type", "Ecomm", "Rate", "Taxable", "Cess"];
            rows = b2bData.map(row => [
                row.gstin, row.receiver, row.invNo, row.invDate, row.invValue.toFixed(2), row.pos, row.revCharge, row.appTaxRate, row.invType, row.ecommGstin, row.rate, row.taxableValue.toFixed(2), row.cess.toFixed(2)
            ]);
        } else if (activeTab === 'B2C Large') {
            headers = ["Inv No", "Inv Date", "Inv Value", "POS", "Tax Rate", "Taxable Val", "Cess", "Ecomm"];
            rows = b2clData.map(row => [
                row.invNo, row.invDate, row.invValue.toFixed(2), row.pos, row.appTaxRate, row.taxableValue.toFixed(2), row.cess.toFixed(2), row.ecommGstin
            ]);
        } else if (activeTab === 'B2C Small') {
            headers = ["Type", "POS", "Tax Rate", "Taxable Val", "Cess", "Ecomm"];
            rows = b2csData.map(row => [
                row.type, row.pos, row.appTaxRate, row.taxableValue.toFixed(2), row.cess.toFixed(2), row.ecommGstin
            ]);
        } else if (activeTab === 'HSN B2B' || activeTab === 'HSN B2C') {
            headers = ["HSN", "Description", "UQC", "Qty", "Val", "Taxable Val", "Rate", "IGST", "CGST", "SGST", "Cess"];
            rows = hsnData.map(row => [
                row.hsn, row.desc, row.uqc, row.qty, row.val.toFixed(2), row.taxVal.toFixed(2), row.rate, row.igst.toFixed(2), row.cgst.toFixed(2), row.sgst.toFixed(2), row.cess.toFixed(2)
            ]);
        } else {
            headers = ["Message"];
            rows = [["Data not available for export in this tab"]];
        }

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
    body { font-family: Arial, sans-serif; font-size: 11px; color: #111; padding: 16px; }
    h1 { font-size: 17px; font-weight: bold; margin-bottom: 3px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th { background: #0f172a; color: #f97316; font-size: 9px; font-weight: bold; text-transform: uppercase; padding: 6px 8px; text-align: left; }
    td { padding: 5px 8px; font-size: 10px; border-bottom: 1px solid #f1f5f9; }
    @page { size: landscape; margin: 8mm; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <p>Printed on: ${new Date().toLocaleString('en-GB')}</p>
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

    const exportToJSON = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(liveData, null, 2));
        const link = document.createElement("a");
        link.setAttribute("href", dataStr);
        link.setAttribute("download", `GSTR1_Full_Data_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.json`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount).replace('₹', '');
    };

    const renderSummaryCards = () => {
        if (activeTab === 'B2B') {
            const numRecipients = new Set(b2bData.map(r => r.gstin)).size;
            const numInvoices = b2bData.length;
            const totalInvoiceValue = b2bData.reduce((sum, item) => sum + item.invValue, 0);

            return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex flex-col">
                        <span className="text-slate-800 font-bold text-sm mb-2">Number of Recipient</span>
                        <span className="text-orange-500 font-black text-3xl">{numRecipients}</span>
                    </div>
                    <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex flex-col">
                        <span className="text-slate-800 font-bold text-sm mb-2">Number of Invoices</span>
                        <span className="text-orange-500 font-black text-3xl">{numInvoices}</span>
                    </div>
                    <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex flex-col">
                        <span className="text-slate-800 font-bold text-sm mb-2">Total Invoice Value</span>
                        <span className="text-orange-500 font-black text-3xl">₹ {formatCurrency(totalInvoiceValue)}</span>
                    </div>
                </div>
            );
        } else if (activeTab === 'B2C Large') {
            const numInvoices = b2clData.length;
            const totalInvoiceValue = b2clData.reduce((sum, item) => sum + item.invValue, 0);
            const totalTaxableValue = b2clData.reduce((sum, item) => sum + item.taxableValue, 0);

            return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex flex-col">
                        <span className="text-slate-800 font-bold text-sm mb-2">Number of Invoices</span>
                        <span className="text-orange-500 font-black text-3xl">{numInvoices}</span>
                    </div>
                    <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex flex-col">
                        <span className="text-slate-800 font-bold text-sm mb-2">Total Invoice Value</span>
                        <span className="text-orange-500 font-black text-3xl">₹ {formatCurrency(totalInvoiceValue)}</span>
                    </div>
                    <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex flex-col">
                        <span className="text-slate-800 font-bold text-sm mb-2">Total Taxable Value</span>
                        <span className="text-orange-500 font-black text-3xl">₹ {formatCurrency(totalTaxableValue)}</span>
                    </div>
                </div>
            );
        } else if (activeTab === 'B2C Small') {
            const numInvoices = b2csData.length;
            const totalTaxableValue = b2csData.reduce((sum, item) => sum + item.taxableValue, 0);

            return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex flex-col">
                        <span className="text-slate-800 font-bold text-sm mb-2">Number of Invoices</span>
                        <span className="text-orange-500 font-black text-3xl">{numInvoices}</span>
                    </div>
                    <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex flex-col">
                        <span className="text-slate-800 font-bold text-sm mb-2">Total Taxable Value</span>
                        <span className="text-orange-500 font-black text-3xl">₹ {formatCurrency(totalTaxableValue)}</span>
                    </div>
                </div>
            );
        } else if (activeTab === 'HSN B2B' || activeTab === 'HSN B2C') {
            const numHsn = hsnData.length;
            const totalValue = hsnData.reduce((sum, item) => sum + item.val, 0);
            const totalTaxable = hsnData.reduce((sum, item) => sum + item.taxVal, 0);
            const totalIgst = hsnData.reduce((sum, item) => sum + item.igst, 0);
            const totalCgst = hsnData.reduce((sum, item) => sum + item.cgst, 0);
            const totalSgst = hsnData.reduce((sum, item) => sum + item.sgst, 0);
            const totalCess = hsnData.reduce((sum, item) => sum + item.cess, 0);

            return (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
                    <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm flex flex-col items-center justify-center text-center">
                        <span className="text-slate-800 font-bold text-xs mb-1">No. of HSN</span>
                        <span className="text-orange-500 font-black text-lg">{numHsn}</span>
                    </div>
                    <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm flex flex-col items-center justify-center text-center">
                        <span className="text-slate-800 font-bold text-xs mb-1">Total Value (₹)</span>
                        <span className="text-orange-500 font-black text-lg">{formatCurrency(totalValue)}</span>
                    </div>
                    <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm flex flex-col items-center justify-center text-center">
                        <span className="text-slate-800 font-bold text-xs mb-1">Total Taxable Value (₹)</span>
                        <span className="text-orange-500 font-black text-lg">{formatCurrency(totalTaxable)}</span>
                    </div>
                    <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm flex flex-col items-center justify-center text-center">
                        <span className="text-slate-800 font-bold text-xs mb-1">Total Integrated Tax (₹)</span>
                        <span className="text-orange-500 font-black text-lg">{formatCurrency(totalIgst)}</span>
                    </div>
                    <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm flex flex-col items-center justify-center text-center">
                        <span className="text-slate-800 font-bold text-xs mb-1">Total Central Tax (₹)</span>
                        <span className="text-orange-500 font-black text-lg">{formatCurrency(totalCgst)}</span>
                    </div>
                    <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm flex flex-col items-center justify-center text-center">
                        <span className="text-slate-800 font-bold text-xs mb-1">Total State / UT Tax (₹)</span>
                        <span className="text-orange-500 font-black text-lg">{formatCurrency(totalSgst)}</span>
                    </div>
                    <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm flex flex-col items-center justify-center text-center">
                        <span className="text-slate-800 font-bold text-xs mb-1">Total Cess (₹)</span>
                        <span className="text-orange-500 font-black text-lg">{formatCurrency(totalCess)}</span>
                    </div>
                </div>
            );
        }
        return null;
    };

    const renderTable = () => {
        if (activeTab === 'B2B') {
            return (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-max text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200">
                                <th className="p-3 text-[11px] font-bold text-slate-800">GSTN / UIN<br />of Recipient</th>
                                <th className="p-3 text-[11px] font-bold text-slate-800">Receiver Name</th>
                                <th className="p-3 text-[11px] font-bold text-slate-800">Invoice Number</th>
                                <th className="p-3 text-[11px] font-bold text-slate-800">Invoice Date</th>
                                <th className="p-3 text-[11px] font-bold text-slate-800 text-right">Invoice Value<br />(₹)</th>
                                <th className="p-3 text-[11px] font-bold text-slate-800">Place of<br />Supply</th>
                                <th className="p-3 text-[11px] font-bold text-slate-800 text-center">Reverse<br />Charge</th>
                                <th className="p-3 text-[11px] font-bold text-slate-800 text-center">Applicable %<br />of Tax Rate</th>
                                <th className="p-3 text-[11px] font-bold text-slate-800">Invoice<br />Type</th>
                                <th className="p-3 text-[11px] font-bold text-slate-800">E-Commerce<br />GSTIN</th>
                                <th className="p-3 text-[11px] font-bold text-slate-800 text-center">Rate<br />(%)</th>
                                <th className="p-3 text-[11px] font-bold text-slate-800 text-right">Taxable Value<br />(₹)</th>
                                <th className="p-3 text-[11px] font-bold text-slate-800 text-right">Cess Amount<br />(₹)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {getPaginatedData(b2bData).map((row, idx) => (
                                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                    <td className="p-3 text-xs text-slate-700 font-medium">{row.gstin}</td>
                                    <td className="p-3 text-xs text-slate-700">{row.receiver}</td>
                                    <td className="p-3 text-xs text-slate-700">{row.invNo}</td>
                                    <td className="p-3 text-xs text-slate-700">{row.invDate}</td>
                                    <td className="p-3 text-xs text-slate-700 text-right">{formatCurrency(row.invValue)}</td>
                                    <td className="p-3 text-xs text-slate-700">{row.pos}</td>
                                    <td className="p-3 text-xs text-slate-700 text-center">{row.revCharge}</td>
                                    <td className="p-3 text-xs text-slate-700 text-center">{row.appTaxRate}</td>
                                    <td className="p-3 text-xs text-slate-700">{row.invType}</td>
                                    <td className="p-3 text-xs text-slate-700">{row.ecommGstin}</td>
                                    <td className="p-3 text-xs text-slate-700 text-center">{row.rate}</td>
                                    <td className="p-3 text-xs text-slate-700 text-right">{formatCurrency(row.taxableValue)}</td>
                                    <td className="p-3 text-xs text-slate-700 text-right">{row.cess.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        } else if (activeTab === 'B2C Large') {
            return (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-max text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200">
                                <th className="p-3 text-xs font-bold text-slate-800">Invoice Number</th>
                                <th className="p-3 text-xs font-bold text-slate-800">Invoice Date</th>
                                <th className="p-3 text-xs font-bold text-slate-800 text-right">Invoice Value (₹)</th>
                                <th className="p-3 text-xs font-bold text-slate-800">Place of Supply</th>
                                <th className="p-3 text-xs font-bold text-slate-800 text-center">Applicable % of Tax Rate</th>
                                <th className="p-3 text-xs font-bold text-slate-800 text-right">Taxable Value (₹)</th>
                                <th className="p-3 text-xs font-bold text-slate-800 text-right">Cess Amount (₹)</th>
                                <th className="p-3 text-xs font-bold text-slate-800">E-commerce GSTIN</th>
                            </tr>
                        </thead>
                        <tbody>
                            {getPaginatedData(b2clData).map((row, idx) => (
                                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                    <td className="p-3 text-sm text-slate-700">{row.invNo}</td>
                                    <td className="p-3 text-sm text-slate-700">{row.invDate}</td>
                                    <td className="p-3 text-sm text-slate-700 text-right">{formatCurrency(row.invValue)}</td>
                                    <td className="p-3 text-sm text-slate-700">{row.pos}</td>
                                    <td className="p-3 text-sm text-slate-700 text-center">{row.appTaxRate}</td>
                                    <td className="p-3 text-sm text-slate-700 text-right">{formatCurrency(row.taxableValue)}</td>
                                    <td className="p-3 text-sm text-slate-700 text-right">{row.cess.toFixed(2)}</td>
                                    <td className="p-3 text-sm text-slate-700">{row.ecommGstin}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        } else if (activeTab === 'B2C Small') {
            return (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-max text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200">
                                <th className="p-3 text-xs font-bold text-slate-800">Type</th>
                                <th className="p-3 text-xs font-bold text-slate-800">Place of Supply</th>
                                <th className="p-3 text-xs font-bold text-slate-800 text-center">Applicable % of Tax Rate</th>
                                <th className="p-3 text-xs font-bold text-slate-800 text-right">Taxable Value (₹)</th>
                                <th className="p-3 text-xs font-bold text-slate-800 text-right">Cess Amount (₹)</th>
                                <th className="p-3 text-xs font-bold text-slate-800">E-commerce GSTIN</th>
                            </tr>
                        </thead>
                        <tbody>
                            {getPaginatedData(b2csData).map((row, idx) => (
                                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                    <td className="p-3 text-sm text-slate-700">{row.type}</td>
                                    <td className="p-3 text-sm text-slate-700">{row.pos}</td>
                                    <td className="p-3 text-sm text-slate-700 text-center">{row.appTaxRate}</td>
                                    <td className="p-3 text-sm text-slate-700 text-right">{formatCurrency(row.taxableValue)}</td>
                                    <td className="p-3 text-sm text-slate-700 text-right">{row.cess.toFixed(2)}</td>
                                    <td className="p-3 text-sm text-slate-700">{row.ecommGstin}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        } else if (activeTab === 'HSN B2B' || activeTab === 'HSN B2C') {
            return (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-max text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200">
                                <th className="p-3 text-xs font-bold text-slate-800">HSN</th>
                                <th className="p-3 text-xs font-bold text-slate-800">Description</th>
                                <th className="p-3 text-xs font-bold text-slate-800">UQC</th>
                                <th className="p-3 text-xs font-bold text-slate-800 text-right">Total Quantity</th>
                                <th className="p-3 text-xs font-bold text-slate-800 text-right">Total Value (₹)</th>
                                <th className="p-3 text-xs font-bold text-slate-800 text-right">Taxable Value (₹)</th>
                                <th className="p-3 text-xs font-bold text-slate-800 text-center">Rate</th>
                                <th className="p-3 text-xs font-bold text-slate-800 text-right">Integrated Tax (₹)</th>
                                <th className="p-3 text-xs font-bold text-slate-800 text-right">Central Tax (₹)</th>
                                <th className="p-3 text-xs font-bold text-slate-800 text-right">State / UT Tax (₹)</th>
                                <th className="p-3 text-xs font-bold text-slate-800 text-right">Cess (₹)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {getPaginatedData(hsnData).map((row, idx) => (
                                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                    <td className="p-3 text-sm text-slate-700 font-medium">{row.hsn}</td>
                                    <td className="p-3 text-sm text-slate-700">{row.desc}</td>
                                    <td className="p-3 text-sm text-slate-700">{row.uqc}</td>
                                    <td className="p-3 text-sm text-slate-700 text-right">{row.qty.toFixed(2)}</td>
                                    <td className="p-3 text-sm text-slate-700 text-right">{formatCurrency(row.val)}</td>
                                    <td className="p-3 text-sm text-slate-700 text-right">{formatCurrency(row.taxVal)}</td>
                                    <td className="p-3 text-sm text-slate-700 text-center">{row.rate}</td>
                                    <td className="p-3 text-sm text-slate-700 text-right">{formatCurrency(row.igst)}</td>
                                    <td className="p-3 text-sm text-slate-700 text-right">{formatCurrency(row.cgst)}</td>
                                    <td className="p-3 text-sm text-slate-700 text-right">{formatCurrency(row.sgst)}</td>
                                    <td className="p-3 text-sm text-slate-700 text-right">{formatCurrency(row.cess)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        } else {
            return (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <p className="text-sm font-bold uppercase tracking-wider mb-2">No Data Available</p>
                    <p className="text-xs">There are no records found for {activeTab} in this period.</p>
                </div>
            );
        }
    };

    const renderPagination = () => {
        let currentDataLength = 0;
        if (activeTab === 'B2B') currentDataLength = b2bData.length;
        else if (activeTab === 'B2C Large') currentDataLength = b2clData.length;
        else if (activeTab === 'B2C Small') currentDataLength = b2csData.length;
        else if (activeTab.includes('HSN')) currentDataLength = hsnData.length;

        if (currentDataLength === 0) return null;

        const totalPages = Math.ceil(currentDataLength / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage + 1;
        const endIndex = Math.min(startIndex + itemsPerPage - 1, currentDataLength);

        const handlePageChange = (newPage) => {
            if (newPage >= 1 && newPage <= totalPages) {
                setCurrentPage(newPage);
            }
        };

        return (
            <div className="border-t border-slate-100 p-4 flex items-center justify-between bg-white rounded-b-xl">
                <div className="text-sm text-slate-500">
                    Showing {startIndex} to {endIndex} of {currentDataLength} entries
                </div>
                <div className="flex items-center gap-1">
                    <button 
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`px-3 py-1.5 text-sm font-medium transition-colors ${currentPage === 1 ? 'text-slate-400 opacity-50 cursor-not-allowed' : 'text-orange-600 hover:text-orange-700'}`}
                    >
                        Previous
                    </button>
                    
                    {Array.from({ length: totalPages }).map((_, i) => {
                        const page = i + 1;
                        if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                            return (
                                <button
                                    key={page}
                                    onClick={() => handlePageChange(page)}
                                    className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold text-sm transition-colors ${
                                        currentPage === page 
                                        ? 'bg-orange-500 text-white' 
                                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                                    }`}
                                >
                                    {page}
                                </button>
                            );
                        } else if (page === currentPage - 2 || page === currentPage + 2) {
                            return <span key={page} className="text-slate-400 px-1">...</span>;
                        }
                        return null;
                    })}

                    <button 
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`px-3 py-1.5 text-sm font-medium transition-colors ${currentPage === totalPages ? 'text-slate-400 opacity-50 cursor-not-allowed' : 'text-orange-600 hover:text-orange-700'}`}
                    >
                        Next
                    </button>
                </div>
            </div>
        );
    };

    return (
        <DashboardPageShell className="bg-slate-50 min-h-screen flex">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />
            
            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay z-40 fixed inset-0 bg-black/50" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}

            <main className="dashboard-main flex-1 flex flex-col h-screen overflow-hidden bg-slate-50 relative">
                {/* Custom Header */}
                <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <h1 className="text-lg font-black text-slate-900 tracking-tight">{getReportTitle()}</h1>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <button onClick={exportToCSV} className="btn-export excel">
                            <FileSpreadsheet size={14} /> Excel
                        </button>
                        <button onClick={exportToPDF} className="btn-export pdf">
                            <FileText size={14} /> PDF
                        </button>
                        <button onClick={handlePrint} className="btn-export print">
                            <Printer size={14} /> Print
                        </button>
                        <button onClick={exportToJSON} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-xs font-bold transition-colors">
                            <Code size={14} /> JSON
                        </button>
                        <button
                            onClick={() => navigate('/dashboard/self-service/home')}
                            className="btn-action-close ml-2"
                            title="Close and Return to Home"
                        >
                            <X size={16} /> <span className="text-[10px] uppercase font-black">CLOSE</span>
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50">
                    {/* Horizontal Tabs */}
                    <div className="flex overflow-x-auto custom-scrollbar gap-2 pb-2 mb-6">
                        {tabs.map(tab => (
                            <button
                                key={tab}
                                onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
                                className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${
                                    activeTab === tab 
                                    ? 'bg-orange-500 text-white border-orange-600 shadow-sm' 
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-800'
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Summary Cards */}
                    {renderSummaryCards()}

                    {/* Data Table Area */}
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col">
                        <div className="overflow-x-auto min-h-[400px]">
                            {renderTable()}
                        </div>
                        
                        {/* Pagination Footer */}
                        {renderPagination()}
                    </div>
                </div>
            </main>
        </DashboardPageShell>
    );
};

export default Gstr1Report;
