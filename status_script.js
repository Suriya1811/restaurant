const fs = require('fs');

const replacements = [
    {
        file: 'frontend/src/pages/dashboard/BrandMaster.jsx',
        regex: /'Verified'\s*:\s*'Deactivated'/g,
        replacement: "'ACTIVE' : 'DEACTIVE'"
    },
    {
        file: 'frontend/src/pages/dashboard/CategoryMaster.jsx',
        regex: /'Synchronized'\s*:\s*'Offline'/g,
        replacement: "'ACTIVE' : 'DEACTIVE'"
    },
    {
        file: 'frontend/src/pages/dashboard/FunctionMaster.jsx',
        regex: /'Synchronized'\s*:\s*'Offline'/g,
        replacement: "'ACTIVE' : 'DEACTIVE'"
    },
    {
        file: 'frontend/src/pages/dashboard/TableTypeMaster.jsx',
        regex: /'Operational'\s*:\s*'Restricted'/g,
        replacement: "'ACTIVE' : 'DEACTIVE'"
    },
    {
        file: 'frontend/src/pages/dashboard/StaffMaster.jsx',
        regex: /'VERIFIED'\s*:\s*'DEACTIVATED'/g,
        replacement: "'ACTIVE' : 'DEACTIVE'"
    },
    {
        file: 'frontend/src/pages/dashboard/CaptainMaster.jsx',
        regex: /'VERIFIED'\s*:\s*'DEACTIVATED'/g,
        replacement: "'ACTIVE' : 'DEACTIVE'"
    },
    {
        file: 'frontend/src/pages/dashboard/WaiterMaster.jsx',
        regex: /'VERIFIED'\s*:\s*'DEACTIVATED'/g,
        replacement: "'ACTIVE' : 'DEACTIVE'"
    }
];

replacements.forEach(({ file, regex, replacement }) => {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        let newContent = content.replace(regex, replacement);
        if (content !== newContent) {
            fs.writeFileSync(file, newContent);
            console.log(`Updated ${file}`);
        }
    }
});
