import React, { useEffect } from 'react';
// import './KotPrintTemplate.css'; // Inline styles used instead

const KotPrintTemplate = ({
    kotData,
    restaurantName,
    restaurantAddress,
    restaurantPhone,
    fssaiNo,
    gstinNo,
    tableType,
    tableNo,
    kotNumber,
    date,
    items,
    kotStatus // e.g. "NEW ORDER" or "RUNNING TABLE"
}) => {
    
    useEffect(() => {
        const styleId = 'kot-print-styles';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.innerHTML = `
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #kot-print-content, #kot-print-content * {
                        visibility: visible;
                    }
                    #kot-print-content {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        max-width: 300px;
                        padding: 10px;
                        font-family: 'Courier New', Courier, monospace;
                        margin: 0;
                        background: white;
                    }
                    .kot-header {
                        text-align: center;
                        margin-bottom: 15px;
                    }
                    .kot-header h2 { margin: 0; font-size: 16px; font-weight: bold; }
                    .kot-header p { margin: 2px 0; font-size: 12px; }
                    .kot-meta {
                        margin-bottom: 10px;
                        font-size: 13px;
                        border-bottom: 1px dashed #000;
                        padding-bottom: 5px;
                    }
                    .kot-meta p { margin: 3px 0; }
                    .kot-status-banner {
                        text-align: center;
                        font-weight: bold;
                        font-size: 14px;
                        border: 1px solid #000;
                        padding: 3px;
                        margin-bottom: 10px;
                        text-transform: uppercase;
                    }
                    .kot-table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: 13px;
                    }
                    .kot-table th, .kot-table td {
                        text-align: left;
                        padding: 4px 0;
                    }
                    .kot-table th { border-bottom: 1px solid #000; }
                    .item-remark {
                        display: block;
                        font-size: 11px;
                        font-style: italic;
                        margin-left: 10px;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }, []);

    if (!items || items.length === 0) return null;

    return (
        <div id="kot-print-content" style={{ display: 'none' }}>
            <div className="kot-header">
                <h2>{restaurantName || 'RESTAURANT'}</h2>
                {tableNo && (
                    <div style={{ fontSize: '15px', fontWeight: 900, marginTop: '4px' }}>
                        TABLE {tableNo}
                    </div>
                )}
            </div>

            <div className="kot-status-banner" style={{ background: '#000', color: '#fff', padding: '4px', fontWeight: 900, fontSize: '13px', textAlign: 'center', marginBottom: '8px' }}>
                {kotStatus || 'NEW TABLE'}
            </div>

            <div className="kot-meta">
                <p><strong>Company:</strong> {restaurantName || 'RESTAURANT'}</p>
                <p><strong>Table No:</strong> {tableNo || 'N/A'}</p>
                <p><strong>Status:</strong> {kotStatus || 'NEW TABLE'}</p>
                <p><strong>KOT No:</strong> {kotNumber}</p>
                <p><strong>Date & Time:</strong> {new Date(date || Date.now()).toLocaleString('en-IN', { hour12: true })}</p>
            </div>

            <table className="kot-table">
                <thead>
                    <tr>
                        <th style={{ width: '75%', textAlign: 'left' }}>Item Name</th>
                        <th style={{ width: '25%', textAlign: 'right' }}>Qty</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, idx) => {
                        const remarkText = item.remarks || item.notes || item.remark;
                        return (
                            <tr key={idx} style={{ verticalAlign: 'top' }}>
                                <td style={{ padding: '4px 0', fontWeight: 700 }}>
                                    {item.name || item.item_name}
                                    {remarkText ? ` (${remarkText})` : ''}
                                </td>
                                <td style={{ textAlign: 'right', fontWeight: 900, padding: '4px 0' }}>
                                    {item.quantity}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            
            <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '11px', fontWeight: 900 }}>
                *** KITCHEN KOT END ***
            </div>
        </div>
    );
};

export default KotPrintTemplate;
