const fs = require('fs');
const path = require('path');

const filePath = path.join('c:', 'Works', 'Mahix', 'toolnew', 'frontend', 'src', 'pages', 'dashboard', 'BillingPage.css');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Reduce Sidebar Width
content = content.replace(/width: 600px;\s*flex: 0 0 600px;/g, "width: 450px;\n    flex: 0 0 450px;");
content = content.replace(/min-width: 500px;/g, "min-width: 400px;");

// 2. Adjust product grid to 5 columns
content = content.replace(/grid-template-columns: repeat\(4, 1fr\);/g, "grid-template-columns: repeat(5, 1fr);");

// 3. Remove bold from category items
content = content.replace(/\.category-item \{[\s\S]*?font-weight: 500;/g, match => match.replace('font-weight: 500;', 'font-weight: 400;'));
content = content.replace(/\.category-item\.active \{[\s\S]*?font-weight: 600;/g, match => match.replace('font-weight: 600;', 'font-weight: 500;'));

fs.writeFileSync(filePath, content, 'utf8');
console.log("CSS updated");
