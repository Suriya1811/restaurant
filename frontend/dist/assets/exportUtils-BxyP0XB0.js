import{E as l,a as b}from"./jspdf.plugin.autotable-CgZ2M3yH.js";const h=(a,r,d,i)=>{const e=r.map(n=>`"${n}"`).join(","),t=d.map(n=>n.map(p=>`"${String(p!=null?p:"-").replace(/"/g,'""')}"`).join(",")),s="data:text/csv;charset=utf-8,"+encodeURIComponent(`${a}
Generated: ${new Date().toLocaleString("en-GB")}

`+e+`
`+t.join(`
`)),o=document.createElement("a");o.setAttribute("href",s),o.setAttribute("download",`${i}.csv`),document.body.appendChild(o),o.click(),document.body.removeChild(o)},m=(a,r,d,i,e="landscape")=>{const t=new l(e);t.setFontSize(16),t.setTextColor(15,23,42),t.text(a,14,18),t.setFontSize(9),t.setTextColor(100),t.text(`Generated: ${new Date().toLocaleString("en-GB")}  |  Total Records: ${d.length}`,14,25),b(t,{startY:30,head:[r],body:d,theme:"grid",headStyles:{fillColor:[15,23,42],textColor:[249,115,22],fontStyle:"bold",fontSize:8},bodyStyles:{fontSize:8},alternateRowStyles:{fillColor:[248,250,252]},styles:{cellPadding:3}}),t.save(`${i}.pdf`)},f=(a,r,d,i)=>{const e=window.open("","_blank","width=1200,height=800"),t=`<tr>${d.map(o=>`<th>${o}</th>`).join("")}</tr>`,s=i.map(o=>`<tr>${o.map(n=>`<td>${n!=null?n:"-"}</td>`).join("")}</tr>`).join("");e.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>${a}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #111; background: white; padding: 16px; }
    h1 { font-size: 17px; font-weight: bold; margin-bottom: 3px; }
    .meta { font-size: 10px; color: #555; margin-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; margin-top: 6px; }
    th { background: #0f172a; color: #f97316; font-size: 9px; font-weight: bold; text-transform: uppercase; padding: 6px 8px; text-align: left; border-right: 1px solid #1e293b; }
    td { padding: 5px 8px; font-size: 10px; border-bottom: 1px solid #f1f5f9; border-right: 1px solid #f1f5f9; }
    tr:nth-child(even) td { background: #fafafa; }
    @page { size: landscape; margin: 8mm; }
  </style>
</head>
<body>
  <h1>${a}</h1>
  <p class="meta">${r}&nbsp;|&nbsp;Printed: ${new Date().toLocaleString("en-GB")}&nbsp;|&nbsp;Records: ${i.length}</p>
  <table>
    <thead>${t}</thead>
    <tbody>${s}</tbody>
  </table>
</body>
</html>`),e.document.close(),e.focus(),setTimeout(()=>{e.print(),e.close()},500)};export{m as a,h as e,f as p};
