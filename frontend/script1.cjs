const fs = require('fs');
const filePath = 'c:/Works/Mahix/restaurant/frontend/src/pages/dashboard/TableSelectionPage.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Replace TableCard component completely
const tcStart = 'const TableCard = memo(({ table, onSelect, onReserve, onCancelReserve, onReset }) => {';
const tcEnd = '});\n\n/* ─── Reservation Modal ─── */';

const newTableCard = `const TableCard = memo(({ table, onSelect, onReserve, onCancelReserve, onReset, showAmount, showTime }) => {
    const isAvail = table.status === 'AVAILABLE';
    const isOccupied = table.status === 'OCCUPIED';
    const isPrinted = table.status === 'PRINTED';
    const isReserved = table.status === 'RESERVED';
    const isActive = isOccupied || isPrinted;

    const bg = isOccupied ? '#f97316' : isPrinted ? '#86efac' : isReserved ? '#c4b5fd' : '#f8fafc';
    const border = isActive || isReserved ? '2px solid #000' : '1px solid #cbd5e1';

    return (
        <div style={{ flexShrink: 0, width: '100%', height: '105px', display: 'flex', flexDirection: 'column' }}>
            <div
                onClick={() => onSelect(table)}
                style={{
                    width: '100%', height: '100%', background: bg, border: border,
                    borderRadius: '8px', cursor: 'pointer', display: 'flex', flexDirection: 'column',
                    padding: '4px 6px', boxSizing: 'border-box', boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    userSelect: 'none', position: 'relative'
                }}
            >
                {/* Top: Table No */}
                <div style={{ textAlign: 'center', fontSize: '15px', fontWeight: 900, color: '#000', lineHeight: 1, marginTop: '2px' }}>
                    {table.table_number}
                </div>

                {/* Middle: Amount */}
                <div style={{ textAlign: 'center', fontSize: '14px', fontWeight: 800, color: '#000', margin: 'auto 0' }}>
                    {!isAvail && !isReserved ? (showAmount ? \`₹\${Math.round(table.running_amount || 0)}\` : '₹***') : (isReserved ? 'RSV' : '₹0')}
                </div>

                {/* Bottom: Time */}
                <div style={{ textAlign: 'center', fontSize: '12px', fontWeight: 800, color: '#000', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                    {!isAvail && !isReserved && showTime ? (
                        <><Clock size={12} strokeWidth={3} /> <LiveTimer since={table.occupied_since} /></>
                    ) : (isReserved ? table.reservation_time : '-')}
                </div>

                {/* Icons row at bottom */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginTop: 'auto', background: 'rgba(255,255,255,0.6)', padding: '3px', borderRadius: '4px' }}>
                    {isAvail && (
                        <button onClick={(e) => { e.stopPropagation(); onReserve(table); }} title="Reserve" style={{ width: '22px', height: '22px', borderRadius: '4px', background: '#fff', color: '#f97316', border: '1px solid #f97316', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}><Plus size={14} strokeWidth={3} /></button>
                    )}
                    {isReserved && (
                        <>
                            <button onClick={(e) => { e.stopPropagation(); onCancelReserve(table); }} title="Cancel Reserve" style={{ width: '22px', height: '22px', borderRadius: '4px', background: '#fff', color: '#ef4444', border: '1px solid #ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}><X size={14} strokeWidth={3} /></button>
                            <button onClick={(e) => { e.stopPropagation(); onSelect(table); }} title="Bill" style={{ width: '22px', height: '22px', borderRadius: '4px', background: '#fff', color: '#7c3aed', border: '1px solid #7c3aed', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}><StickyNote size={14} strokeWidth={3} /></button>
                        </>
                    )}
                    {isActive && !isPrinted && !isReserved && (
                        <>
                            <button onClick={(e) => { e.stopPropagation(); onSelect(table, true); }} title="Print Bill" style={{ width: '22px', height: '22px', borderRadius: '4px', background: '#fff', color: '#10b981', border: '1px solid #10b981', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}><Printer size={14} strokeWidth={3} /></button>
                            <button onClick={(e) => { e.stopPropagation(); onSelect(table); }} title="View Table" style={{ width: '22px', height: '22px', borderRadius: '4px', background: '#fff', color: '#6366f1', border: '1px solid #6366f1', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}><Eye size={14} strokeWidth={3} /></button>
                            <button onClick={(e) => { e.stopPropagation(); if(window.confirm('Clear table?')) onReset(table); }} title="Clear Table" style={{ width: '22px', height: '22px', borderRadius: '4px', background: '#fff', color: '#ef4444', border: '1px solid #ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}><RefreshCw size={14} strokeWidth={3} /></button>
                        </>
                    )}
                    {isPrinted && !isReserved && (
                        <>
                            <button onClick={(e) => { e.stopPropagation(); onSelect(table, true); }} title="Pay" style={{ width: '22px', height: '22px', borderRadius: '4px', background: '#fff', color: '#16a34a', border: '1px solid #16a34a', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}><CheckCircle2 size={14} strokeWidth={3} /></button>
                            <button onClick={(e) => { e.stopPropagation(); onReset(table); }} title="Reset Table" style={{ width: '22px', height: '22px', borderRadius: '4px', background: '#fff', color: '#64748b', border: '1px solid #64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}><RefreshCw size={14} strokeWidth={3} /></button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
});

/* ─── Reservation Modal ─── */`;

content = content.replace(content.substring(content.indexOf(tcStart), content.indexOf(tcEnd) + tcEnd.length), newTableCard);

// 2. Add Settings State
const stateStart = 'const [searchQuery, setSearchQuery] = useState("");';
const newState = stateStart + `\n    const [showAmount, setShowAmount] = useState(true);\n    const [showTime, setShowTime] = useState(true);\n    const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);`;
content = content.replace(stateStart, newState);

// 3. Add Settings Toggle in Header
const headerStart = `<button
                                onClick={() => handleSpecialOrder('PARTY_ORDER')}
                                style={{
                                    padding: '0 24px', background: 'none', border: 'none',
                                    borderRight: '1px solid #f1f5f9', cursor: 'pointer',
                                    fontSize: '13px', fontWeight: 800, color: '#3b82f6',
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    whiteSpace: 'nowrap', transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.color = '#000'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#3b82f6'; }}
                            >
                                <Users2 size={16} /> PARTY ORDER
                            </button>`;
const headerReplace = headerStart + `
                            <div style={{ position: 'relative' }}>
                                <button
                                    onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
                                    style={{
                                        padding: '0 24px', height: '100%', background: 'none', border: 'none',
                                        borderRight: '1px solid #f1f5f9', cursor: 'pointer',
                                        fontSize: '13px', fontWeight: 800, color: '#64748b',
                                        display: 'flex', alignItems: 'center', gap: '8px',
                                        whiteSpace: 'nowrap', transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#000'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#64748b'; }}
                                >
                                    <Settings size={16} /> SETTINGS
                                </button>
                                {showSettingsDropdown && (
                                    <div style={{ position: 'absolute', top: '100%', right: 0, background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 50, minWidth: '180px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>Show Amount</span>
                                            <input type="checkbox" checked={showAmount} onChange={e => setShowAmount(e.target.checked)} style={{ cursor: 'pointer' }} />
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>Show Time</span>
                                            <input type="checkbox" checked={showTime} onChange={e => setShowTime(e.target.checked)} style={{ cursor: 'pointer' }} />
                                        </div>
                                    </div>
                                )}
                            </div>`;
if (content.includes(headerStart)) {
    content = content.replace(headerStart, headerReplace);
}

// 4. Update the Grid layout & Headers
const gridStart = `{/* Zone header */}
                                    <div style={{
                                        padding: '8px 20px',
                                        fontSize: '13px', fontWeight: 900, color: '#334155',
                                        textTransform: 'uppercase', letterSpacing: '0.18em',
                                        background: 'linear-gradient(to right, #f8fafc, #ffffff)',
                                        borderBottom: '1px solid #f1f5f9',
                                        display: 'flex', alignItems: 'center', gap: '16px'
                                    }}>
                                        <div style={{ width: '4px', height: '14px', background: '#6366f1', borderRadius: '4px' }} />
                                        {zoneName}
                                        <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>`;

const gridStartRegex = /{\/\* Zone header \*\/}[\s\S]*?<div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>/;

const newGridStart = `{/* Zone header */}
                                    <div style={{
                                        padding: '8px 20px',
                                        fontSize: '14px', fontWeight: 900, color: '#ea580c',
                                        textTransform: 'uppercase', letterSpacing: '0.05em',
                                        background: '#fff',
                                        borderBottom: '1px solid #f1f5f9',
                                        display: 'flex', alignItems: 'center', gap: '16px'
                                    }}>
                                        {zoneName}
                                        {tableTypes.find(t => t.name === zoneName)?.captain && (
                                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569', marginLeft: '16px', textTransform: 'none' }}>
                                                C- {tableTypes.find(t => t.name === zoneName)?.captain} | W- {tableTypes.find(t => t.name === zoneName)?.waiter}
                                            </span>
                                        )}
                                        <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                                            <span style={{ fontSize: '11px', fontWeight: 900, color: '#3b82f6' }}>TOTAL: {zoneTables.length}</span>
                                            <span style={{ fontSize: '11px', fontWeight: 900, color: '#ea580c' }}>RUNNING: {zoneTables.filter(t => t.status === 'OCCUPIED').length}</span>
                                            <span style={{ fontSize: '11px', fontWeight: 900, color: '#475569' }}>EMPTY: {zoneTables.filter(t => t.status === 'AVAILABLE').length}</span>
                                            <span style={{ fontSize: '11px', fontWeight: 900, color: '#16a34a' }}>PRINTED: {zoneTables.filter(t => t.status === 'PRINTED').length}</span>
                                        </div>
                                    </div>`;

content = content.replace(gridStartRegex, newGridStart);

const mapStart = `{/* Horizontal scrollable table row */}
                                    <div style={{
                                        display: 'flex', gap: '16px', padding: '12px 20px 8px 20px',
                                        overflowX: 'auto', background: '#fff',
                                        borderBottom: '1px solid #f8fafc',
                                        scrollbarWidth: 'thin', scrollbarColor: '#e2e8f0 transparent',
                                        alignItems: 'flex-start',
                                        minHeight: '100px'
                                    }}>
                                        {zoneTables.map(table => (
                                            <TableCard
                                                key={table._id}
                                                table={table}
                                                onSelect={handleSelect}
                                                onReserve={t => setReserveTarget(t)}
                                                onCancelReserve={handleCancelReserve}
                                                onReset={handleResetTable}
                                            />
                                        ))}
                                    </div>`;

const mapReplace = `{/* 10-column Grid Layout */}
                                    <div style={{
                                        display: 'grid', gridTemplateColumns: 'repeat(10, minmax(0, 1fr))', gap: '10px', 
                                        padding: '16px 20px', background: '#fff', borderBottom: '1px solid #f8fafc'
                                    }}>
                                        {zoneTables.map(table => (
                                            <TableCard
                                                key={table._id}
                                                table={table}
                                                onSelect={handleSelect}
                                                onReserve={t => setReserveTarget(t)}
                                                onCancelReserve={handleCancelReserve}
                                                onReset={handleResetTable}
                                                showAmount={showAmount}
                                                showTime={showTime}
                                            />
                                        ))}
                                    </div>`;
content = content.replace(mapStart, mapReplace);

fs.writeFileSync(filePath, content);
console.log("Successfully rewrote TableSelectionPage");
