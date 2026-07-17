const fs = require('fs');
const files = [
    {
        path: 'frontend/src/pages/dashboard/TableTypeMaster.jsx',
        endpoint: 'table-types',
        fetchFunc: 'fetchTableTypes',
        varName: 'type'
    },
    {
        path: 'frontend/src/pages/dashboard/TaxMaster.jsx',
        endpoint: 'taxes',
        fetchFunc: 'fetchTaxes',
        varName: 'tax'
    },
    {
        path: 'frontend/src/pages/dashboard/UnitMaster.jsx',
        endpoint: 'units',
        fetchFunc: 'fetchUnits',
        varName: 'unit'
    }
];
files.forEach(({ path, endpoint, fetchFunc, varName }) => {
    let content = fs.readFileSync(path, 'utf8');
    const toggleFunc = `
    const handleToggleStatus = async (item, nextStatus) => {
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            const statusToApply = typeof nextStatus === 'boolean' ? nextStatus : !item.is_active;
            const response = await fetch(\`\${import.meta.env.VITE_API_URL}/${endpoint}/\${item._id}\`, {
                method: 'PUT',
                headers: { 
                    'Authorization': \`Bearer \${token}\`,
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({ ...item, is_active: statusToApply })
            });
            const result = await response.json();
            if (result.success || response.ok) {
                ${fetchFunc}();
            } else {
                alert(\`Error: \${result.error || result.message || 'Update failed'}\`);
            }
        } catch (err) {
            console.error('Error updating status:', err);
            alert('An error occurred while updating status.');
        }
    };
`;
    // Insert handleToggleStatus after handleDelete
    const deleteMatch = content.match(/const handleDelete = async \([^\)]+\) => \{[\s\S]*?\n    \};\n/);
    if (deleteMatch) {
        if (!content.includes('const handleToggleStatus')) {
            content = content.replace(deleteMatch[0], deleteMatch[0] + toggleFunc);
        }
    }
    // Add onStatusChange={handleToggleStatus} to ActionDropdown
    content = content.replace(
        /<ActionDropdown\s+item=\{([^}]+)\}\s+onEdit=\{handleEdit\}\s+onDelete=\{handleDelete\}\s*\/>/g,
        '<ActionDropdown item={$1} onEdit={handleEdit} onStatusChange={handleToggleStatus} onDelete={handleDelete} />'
    );
    fs.writeFileSync(path, content);
    console.log(`Updated ${path}`);
});
