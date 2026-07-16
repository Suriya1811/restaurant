import re

filepath = 'c:/Works/Mahix/restaurant/frontend/src/pages/dashboard/GroupMaster.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the imports to include ChevronRight
content = content.replace('import { PlusCircle, Search, Edit, Trash2, Loader2, AlertCircle, XCircle, CheckCircle2, Layers, ChevronDown, Info, TrendingUp, TrendingDown, Package, Wallet, Triangle, X , Download, Printer} from \'lucide-react\';',
                          'import { PlusCircle, Search, Edit, Trash2, Loader2, AlertCircle, XCircle, CheckCircle2, Layers, ChevronDown, ChevronRight, Info, TrendingUp, TrendingDown, Package, Wallet, Triangle, X , Download, Printer, ChevronLeft, ArrowLeft} from \'lucide-react\';')

# Add expandedGroups state
content = content.replace('const [showSaveConfirm, setShowSaveConfirm] = useState(false);',
                          'const [showSaveConfirm, setShowSaveConfirm] = useState(false);\n    const [expandedGroups, setExpandedGroups] = useState({});\n    const toggleExpand = (name) => setExpandedGroups(p => ({...p, [name]: !p[name]}));')

# Build Tree logic
tree_logic = """
    // Build grouped structure for display
    const buildTree = (allGroups) => {
        const map = {};
        const roots = [];
        allGroups.forEach(g => { map[g.name] = { ...g, children: [] }; });
        allGroups.forEach(g => {
            if (g.parent && map[g.parent]) {
                map[g.parent].children.push(map[g.name]);
            } else {
                roots.push(map[g.name]);
            }
        });
        return roots;
    };

    const filterTree = (nodes, term, nature) => {
        if (!nodes) return [];
        return nodes.map(node => {
            const matchesTerm = node.name.toLowerCase().includes(term.toLowerCase());
            const matchesNature = nature === 'ALL' || node.nature === nature;
            const filteredChildren = filterTree(node.children, term, nature);
            
            if ((matchesTerm && matchesNature) || filteredChildren.length > 0) {
                return { ...node, children: filteredChildren };
            }
            return null;
        }).filter(Boolean);
    };

    const treeData = filterTree(buildTree(groups), searchTerm, filterNature);

    const renderTreeRow = (node, depth = 0) => {
        const isExpanded = expandedGroups[node.name];
        const hasChildren = node.children && node.children.length > 0;
        const cfg = NATURE_CONFIG[node.nature] || NATURE_CONFIG.ASSETS;

        return (
            <React.Fragment key={node._id}>
                <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors group/row">
                    <td className="py-3 px-4" style={{ paddingLeft: `${depth * 30 + 16}px` }}>
                        <div className="flex items-center gap-3">
                            <div className="w-5 flex justify-center shrink-0">
                                {hasChildren ? (
                                    <button onClick={() => toggleExpand(node.name)} className="p-1 hover:bg-slate-200 rounded text-slate-500">
                                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                    </button>
                                ) : (
                                    <span className="w-5"></span>
                                )}
                            </div>
                            <div>
                                <div className="font-bold text-[14px] text-slate-800">{node.name}</div>
                            </div>
                        </div>
                    </td>
                    <td className="py-3 px-4">
                        <span className="px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest bg-orange-50 text-[#f97316]">
                            {cfg.label}
                        </span>
                    </td>
                    <td className="py-3 px-4 w-32 text-center">
                        <button onClick={() => handleEdit(node)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-200">
                            <Edit size={16} />
                        </button>
                    </td>
                </tr>
                {isExpanded && hasChildren && node.children.map(child => renderTreeRow(child, depth + 1))}
            </React.Fragment>
        );
    };
"""

# We need to replace from `// Build grouped structure for display` down to `const getExportRows = ...`
# Actually let's just replace from `// Build grouped structure for display` to `return (`
regex_pattern = r'// Build grouped structure for display.*?return \('

replacement = tree_logic + "\n    return (\n        <React.Fragment>\n" # We'll just put React.Fragment temporarily if needed, but wait, we can just replace up to `return (`.

content = re.sub(r'// Build grouped structure for display.*?return\s*\(', tree_logic + "\n    return (", content, flags=re.DOTALL)

# Now replace the return statement UI
new_ui = """
        <div className="dashboard-layout">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />
            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}

            <main className="dashboard-main flex flex-col h-screen relative bg-slate-50 font-sans">
                {/* Custom Header matching the screenshot */}
                <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight">GROUP MASTER</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 px-5 py-2.5 bg-[#f97316] hover:bg-[#ea580c] text-white rounded-lg font-black text-[12px] uppercase tracking-wide transition-colors shadow-sm" onClick={() => { resetForm(); setShowDrawer(true); }}>
                            <PlusCircle size={16} strokeWidth={2.5} /> ADD NEW GROUP
                        </button>
                        <button className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200 rounded-lg font-black text-[12px] uppercase tracking-wide transition-colors shadow-sm" onClick={() => window.history.back()}>
                            <XCircle size={16} strokeWidth={2.5} /> CLOSE
                        </button>
                    </div>
                </div>

                <div className="p-6 flex flex-col gap-4 flex-1 overflow-y-auto">
                    
                    {/* Search and Filter Bar */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                        <div className="relative w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search groups..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white border-2 border-[#f97316]/30 focus:border-[#f97316] rounded-lg text-sm text-slate-700 outline-none transition-colors"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-slate-700">Filter:</span>
                            <select 
                                value={filterNature}
                                onChange={e => setFilterNature(e.target.value)}
                                className="border border-slate-200 rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 outline-none bg-slate-50 cursor-pointer min-w-[120px]"
                            >
                                <option value="ALL">All</option>
                                <option value="ASSETS">Assets</option>
                                <option value="LIABILITIES">Liabilities</option>
                                <option value="INCOME">Income</option>
                                <option value="EXPENSES">Expenses</option>
                            </select>
                        </div>
                    </div>

                    {/* Tree Table */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
                        <div className="overflow-x-auto flex-1 custom-scrollbar">
                            <table className="w-full text-left whitespace-nowrap">
                                <thead>
                                    <tr className="bg-[#0b1727]">
                                        <th className="py-4 px-4 font-black text-[12px] text-[#f97316] uppercase tracking-widest w-1/2 rounded-tl-xl">GROUP NAME</th>
                                        <th className="py-4 px-4 font-black text-[12px] text-[#f97316] uppercase tracking-widest">NATURE</th>
                                        <th className="py-4 px-4 font-black text-[12px] text-[#f97316] uppercase tracking-widest text-center rounded-tr-xl w-32">ACTION</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan="3" className="text-center py-12">
                                                <Loader2 className="animate-spin text-[#f97316] mb-3 mx-auto" size={32} />
                                                <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Loading Hierarchy...</p>
                                            </td>
                                        </tr>
                                    ) : treeData.length === 0 ? (
                                        <tr>
                                            <td colSpan="3" className="text-center py-12">
                                                <Layers size={40} className="mx-auto mb-3 text-slate-200" />
                                                <p className="font-black text-slate-400 uppercase tracking-widest text-[12px]">No Groups Found</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        treeData.map(node => renderTreeRow(node, 0))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Keep existing Modals intact */}
"""

# Now replace the return statement UI
# from `<div className="dashboard-layout">` up to `{showDrawer && (`
content = re.sub(r'<div className="dashboard-layout">.*?\{showDrawer && \(', new_ui + '\n                {showDrawer && (', content, flags=re.DOTALL)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("GroupMaster.jsx has been rewritten!")
