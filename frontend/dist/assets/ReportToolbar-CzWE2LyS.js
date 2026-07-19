import"./index-CJwhnc3K.js";import"./react-vendor-CMsF7OE3.js";const g=(i,p,e,r,t=null)=>{const o=window.open("","_blank","width=1200,height=800"),a=`<tr>${e.map(n=>`<th>${n}</th>`).join("")}</tr>`,l=r.map(n=>`<tr>${n.map(d=>`<td>${d!=null?d:"-"}</td>`).join("")}</tr>`).join(""),s=t?`<tfoot><tr class="total-row"><td colspan="${t.cells.length>0?e.length-t.cells.length:e.length}" style="text-align:right;font-weight:bold">${t.label}</td>${t.cells.map(n=>`<td>${n}</td>`).join("")}</tr></tfoot>`:"";o.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>${i}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #111; background: white; padding: 16px; }
    h1 { font-size: 17px; font-weight: bold; margin-bottom: 3px; }
    .meta { font-size: 10px; color: #555; margin-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; margin-top: 6px; }
    th { background: #0f172a; color: #f97316; font-size: 9px; font-weight: bold; text-transform: uppercase; padding: 6px 8px; text-align: left; border-right: 1px solid #1e293b; }
    td { padding: 5px 8px; font-size: 10px; border-bottom: 1px solid #f1f5f9; border-right: 1px solid #f1f5f9; }
    tr:nth-child(even) td { background: #fafafa; }
    .total-row td { font-weight: bold; background: #fff7ed; border-top: 2px solid #f97316; color: #c2410c; }
    @page { size: landscape; margin: 8mm; }
  </style>
</head>
<body>
  <h1>${i}</h1>
  <p class="meta">${p} &nbsp;|&nbsp; Printed on: ${new Date().toLocaleString("en-GB")} &nbsp;|&nbsp; Total Records: ${r.length}</p>
  <table>
    <thead>${a}</thead>
    <tbody>${l}</tbody>
    ${s}
  </table>
</body>
</html>`),o.document.close(),o.focus(),setTimeout(()=>{o.print(),o.close()},500)};export{g as p};
