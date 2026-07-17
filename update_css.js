const fs = require('fs');
let c = fs.readFileSync('frontend/src/index.css', 'utf8');

c = c.replace(/\.btn-export \{\s*([\s\S]*?)\}/g, `.btn-export {
  padding: 0.375rem 0.75rem !important;
  background-color: white !important;
  border-radius: 4px !important;
  font-weight: 900 !important;
  font-size: 11px !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 0.375rem !important;
  transition: all 0.2s ease-in-out !important;
  text-transform: uppercase !important;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important;
}`);

c += `
.btn-export.excel {
  border: 1px solid #10b981 !important;
  color: #059669 !important;
}
.btn-export.excel:hover {
  background-color: #ecfdf5 !important;
}
.btn-export.excel svg {
  color: #10b981 !important;
  width: 14px !important;
  height: 14px !important;
}
.btn-export.excel span {
  color: #059669 !important;
  font-size: 11px !important;
}

.btn-export.pdf {
  border: 1px solid #f43f5e !important;
  color: #e11d48 !important;
}
.btn-export.pdf:hover {
  background-color: #fff1f2 !important;
}
.btn-export.pdf svg {
  color: #f43f5e !important;
  width: 14px !important;
  height: 14px !important;
}
.btn-export.pdf span {
  color: #e11d48 !important;
  font-size: 11px !important;
}

.btn-export.print {
  border: 1px solid #6366f1 !important;
  color: #4f46e5 !important;
}
.btn-export.print:hover {
  background-color: #eef2ff !important;
}
.btn-export.print svg {
  color: #6366f1 !important;
  width: 14px !important;
  height: 14px !important;
}
.btn-export.print span {
  color: #4f46e5 !important;
  font-size: 11px !important;
}
`;

c = c.replace(/\.btn-action-close \{\s*([\s\S]*?)\}/g, `.btn-action-close {
  padding: 0.375rem 0.75rem !important;
  border: 1px solid #fecdd3 !important;
  background-color: white !important;
  color: #e11d48 !important;
  border-radius: 4px !important;
  font-weight: 900 !important;
  font-size: 11px !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 0.375rem !important;
  transition: all 0.2s ease-in-out !important;
  text-transform: uppercase !important;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important;
}`);

c = c.replace(/\.btn-action-close:hover:not\(:disabled\) \{\s*([\s\S]*?)\}/g, `.btn-action-close:hover:not(:disabled) {
  background-color: #fff1f2 !important;
}`);

c = c.replace(/\.btn-action-add \{\s*([\s\S]*?)\}/g, `.btn-action-add {
  padding: 0.375rem 0.75rem !important;
  background-color: #f97316 !important;
  color: white !important;
  border-radius: 4px !important;
  font-weight: 900 !important;
  font-size: 11px !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 0.375rem !important;
  transition: all 0.2s ease-in-out !important;
  text-transform: uppercase !important;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
  border: none !important;
}`);

c = c.replace(/\.btn-action-add:hover:not\(:disabled\) \{\s*([\s\S]*?)\}/g, `.btn-action-add:hover:not(:disabled) {
  background-color: #ea580c !important;
}`);

fs.writeFileSync('frontend/src/index.css', c);
console.log('Updated CSS classes to perfectly match ProductMaster style.');
