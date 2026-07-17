const fs = require('fs');
let c = fs.readFileSync('frontend/src/pages/dashboard/TaxMaster.jsx', 'utf8');

// 1. Add handleToggleStatus
if (!c.includes('const handleToggleStatus =')) {
    const handleToggleStatusCode = `const handleToggleStatus = async (tax) => {
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            await fetch(\`\${import.meta.env.VITE_API_URL}/taxes/\${tax._id}/toggle-status\`, {
                method: 'PATCH',
                headers: { 'Authorization': \`Bearer \${token}\` }
            });
            fetchTaxes();
        } catch (err) {
            console.error('Error toggling tax status:', err);
        }
    };

    const handleDelete =`;
    c = c.replace('const handleDelete =', handleToggleStatusCode);
}

// 2. Add onStatusChange to ActionDropdown
if (!c.includes('onStatusChange={handleToggleStatus}')) {
    c = c.replace(
        '<ActionDropdown item={tax} onEdit={handleEdit} onDelete={handleDelete} />',
        '<ActionDropdown item={tax} onEdit={handleEdit} onStatusChange={handleToggleStatus} onDelete={handleDelete} />'
    );
}

fs.writeFileSync('frontend/src/pages/dashboard/TaxMaster.jsx', c);
console.log('Fixed TaxMaster dropdown');
