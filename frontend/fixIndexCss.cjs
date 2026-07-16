const fs = require('fs');
const filePath = 'c:/Works/Mahix/restaurant/frontend/src/index.css';
let content = fs.readFileSync(filePath, 'utf8');

const regex = /\/\* Forced Dark Blue Background and Orange Text for Table Headers \*\/[\s\S]*?white-space: nowrap !important;\s*\}/m;

const replacementStr = `/* Forced Dark Blue Background and Orange Text for Table Headers */
.table-premium th,
.table-ent th {
  background-color: #0F172A !important;
  color: #F97316 !important;
  padding: 1.25rem 1.5rem !important;
  font-size: 0.75rem !important;
  font-weight: 900 !important;
  text-transform: uppercase !important;
  letter-spacing: 0.1em !important;
  text-align: left !important;
  border-bottom: none !important;
  border-radius: 0 !important;
  white-space: nowrap !important;
}`;

if (regex.test(content)) {
    content = content.replace(regex, replacementStr);
    fs.writeFileSync(filePath, content);
    console.log("Fixed index.css table th override via regex");
} else {
    console.log("Regex not found in index.css");
}
