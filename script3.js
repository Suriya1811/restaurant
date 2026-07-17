const fs = require('fs');
const files = [
    {
        path: 'frontend/src/pages/dashboard/TableTypeMaster.jsx',
        endpoint: 'table-types',
        fetchFunc: 'fetchTableTypes'
    },
    {
        path: 'frontend/src/pages/dashboard/TaxMaster.jsx',
        endpoint: 'taxes',
        fetchFunc: 'fetchTaxes'
    },
    {
        path: 'frontend/src/pages/dashboard/UnitMaster.jsx',
        endpoint: 'units',
        fetchFunc: 'fetchUnits'
    }
];
files.forEach(({ path, endpoint, fetchFunc }) => {
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
    if (!content.includes('const handleToggleStatus')) {
        const editIndex = content.indexOf('const handleEdit =');
        if (editIndex !== -1) {
            content = content.substring(0, editIndex) + toggleFunc + '\n' + content.substring(editIndex);
        } else {
            const deleteIndex = content.indexOf('const handleDelete =');
            if (deleteIndex !== -1) {
                content = content.substring(0, deleteIndex) + toggleFunc + '\n' + content.substring(deleteIndex);
            }
        }
    }
    content = content.replace(
        /<ActionDropdown\s+item=\{([^}]+)\}\s+onEdit=\{handleEdit\}\s+onDelete=\{handleDelete\}\s*\/>/g,
        '<ActionDropdown item={$1} onEdit={handleEdit} onStatusChange={handleToggleStatus} onDelete={handleDelete} />'
    );
    fs.writeFileSync(path, content);
    console.log(`Successfully updated ${path}`);
});
