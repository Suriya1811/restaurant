const fs = require('fs');
const filePath = 'c:/Works/Mahix/restaurant/frontend/src/pages/dashboard/ProductMaster.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// The faulty string inserted was '{!showDrawer && (\\n                    <Header' where \\n are literal characters.
// We can just replace '{!showDrawer && (\\n                    ' with '{!showDrawer && ( ' + '\\n' + ' '
// Let's use regex to clean it up.
content = content.replace('{!showDrawer && (\\n                    <Header', '{!showDrawer && (\\n<Header');
content = content.replace('</button>\\n                )}', '</button>\\n)}');

fs.writeFileSync(filePath, content);
console.log("Fixed newline characters.");
