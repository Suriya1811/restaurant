var C=Object.defineProperty;var R=Object.getOwnPropertySymbols;var L=Object.prototype.hasOwnProperty,Y=Object.prototype.propertyIsEnumerable;var S=(m,o,n)=>o in m?C(m,o,{enumerable:!0,configurable:!0,writable:!0,value:n}):m[o]=n,E=(m,o)=>{for(var n in o||(o={}))L.call(o,n)&&S(m,n,o[n]);if(R)for(var n of R(o))Y.call(o,n)&&S(m,n,o[n]);return m};var B=(m,o,n)=>new Promise((f,e)=>{var g=d=>{try{x(n.next(d))}catch(l){e(l)}},r=d=>{try{x(n.throw(d))}catch(l){e(l)}},x=d=>d.done?f(d.value):Promise.resolve(d.value).then(g,r);x((n=n.apply(m,o)).next())});import{j as s}from"./index-zW_UHRZh.js";import{a as b,R as M}from"./react-vendor-CMsF7OE3.js";import{x as $,X as W,L as q,e as K}from"./ui-vendor-1l7_JuxF.js";const Q=({isOpen:m,onClose:o,billId:n,paymentModes:f})=>{var y,N,v,w,_,k,T,A,z;const[e,g]=b.useState(null),[r,x]=b.useState(null),[d,l]=b.useState(!0);b.useEffect(()=>{m&&n&&P()},[m,n]);const P=()=>B(null,null,function*(){try{l(!0);const t=localStorage.getItem("user"),{token:a}=JSON.parse(t),p=yield(yield fetch(`http://localhost:5055/api/bills/${n}`,{headers:{Authorization:`Bearer ${a}`}})).json();if(p.success){g(p.data);const c=yield(yield fetch("http://localhost:5055/api/auth/profile",{headers:{Authorization:`Bearer ${a}`}})).json();c.success&&x(c.data.restaurant)}}catch(t){console.error("Error fetching bill details:",t)}finally{l(!1)}}),I=t=>!t||t.length===0?"N/A":t.length===1?t[0].type:"SPLIT",O=t=>{if(!t)return[];const a=new Map;return t.forEach(i=>{var h;const p=`${i.product_id}_${((h=i.variation)==null?void 0:h.name)||""}_${(i.addons||[]).map(c=>c._id).sort().join(",")}_${i.notes||""}_${i.unit_price}`;if(a.has(p)){const c=a.get(p);c.quantity+=i.quantity,c.total_price+=i.total_price}else a.set(p,E({},i))}),Array.from(a.values())},j=t=>new Date(t).toLocaleDateString("en-IN",{day:"2-digit",month:"2-digit",year:"numeric"}),u=t=>new Date(t).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:!0}),F=()=>{window.print()};return m?s.jsxs("div",{className:"bpm-overlay",children:[s.jsxs("div",{className:"bpm-modal",children:[s.jsxs("div",{className:"bpm-header no-print",children:[s.jsxs("div",{className:"bpm-header-left",children:[s.jsx("div",{className:"bpm-success-icon",children:s.jsx($,{size:22})}),s.jsxs("div",{children:[s.jsx("h3",{className:"bpm-title",children:"Payment Successful"}),s.jsxs("p",{className:"bpm-subtitle",children:["Bill #",(e==null?void 0:e.bill_number)||"..."]})]})]}),s.jsx("button",{className:"bpm-close-btn",onClick:o,children:s.jsx(W,{size:20})})]}),s.jsx("div",{className:"bpm-body",children:d?s.jsxs("div",{className:"bpm-loading no-print",children:[s.jsx(q,{size:32,className:"bpm-spinner"}),s.jsx("p",{children:"Generating receipt..."})]}):s.jsxs(s.Fragment,{children:[s.jsx("div",{className:"bpm-receipt-container",children:s.jsxs("div",{id:"bill-print-content",className:"bpm-receipt",children:[s.jsxs("div",{className:"bpm-receipt-header",children:[s.jsx("h2",{className:"bpm-rest-name",children:(r==null?void 0:r.name)||"RESTOBOARD"}),s.jsx("p",{className:"bpm-rest-addr",children:(r==null?void 0:r.address)||"Main Branch"}),s.jsxs("p",{className:"bpm-rest-phone",children:["Ph: ",(r==null?void 0:r.phone)||"9988776655"]}),(r==null?void 0:r.fssai_no)&&s.jsxs("p",{className:"bpm-rest-fssai",children:["FSSAI: ",r.fssai_no]}),(r==null?void 0:r.gstin)&&s.jsxs("p",{className:"bpm-rest-gstin",children:["GSTIN: ",r.gstin]})]}),s.jsx("div",{className:"bpm-divider-dashed"}),s.jsxs("div",{className:"bpm-meta",children:[s.jsxs("div",{className:"bpm-meta-row",children:[s.jsx("span",{className:"bpm-meta-label",children:"Bill No:"}),s.jsx("span",{className:"bpm-meta-val",children:e==null?void 0:e.bill_number})]}),s.jsxs("div",{className:"bpm-meta-row",children:[s.jsx("span",{className:"bpm-meta-label",children:"Date:"}),s.jsx("span",{className:"bpm-meta-val",children:j(e==null?void 0:e.createdAt)})]}),s.jsxs("div",{className:"bpm-meta-row",children:[s.jsx("span",{className:"bpm-meta-label",children:"Time:"}),s.jsx("span",{className:"bpm-meta-val",children:u(e==null?void 0:e.createdAt)})]}),(e==null?void 0:e.table_no)&&s.jsxs("div",{className:"bpm-meta-row",children:[s.jsx("span",{className:"bpm-meta-label",children:"Table:"}),s.jsx("span",{className:"bpm-meta-val",children:e.table_no})]}),s.jsxs("div",{className:"bpm-meta-row",children:[s.jsx("span",{className:"bpm-meta-label",children:"Payment:"}),s.jsx("span",{className:"bpm-meta-val bpm-pay-badge",children:I(f)})]}),(e==null?void 0:e.kots)&&e.kots.length>0&&s.jsxs("div",{className:"bpm-meta-row",children:[s.jsx("span",{className:"bpm-meta-label",children:"KOT(s):"}),s.jsx("span",{className:"bpm-meta-val",style:{textAlign:"right",wordBreak:"break-word",fontSize:"10px"},children:e.kots.map(t=>t.kot_number||"KOT").join(", ")})]})]}),s.jsx("div",{className:"bpm-divider-dashed"}),((e==null?void 0:e.type)==="PARTY"||(e==null?void 0:e.type)==="PARTY_ORDER")&&s.jsxs("div",{className:"bpm-meta bpm-customer-details",children:[(e==null?void 0:e.customer_name)&&s.jsxs("div",{className:"bpm-meta-row",children:[s.jsx("span",{className:"bpm-meta-label",children:"Customer:"}),s.jsx("span",{className:"bpm-meta-val",children:e.customer_name})]}),(e==null?void 0:e.customer_phone)&&s.jsxs("div",{className:"bpm-meta-row",children:[s.jsx("span",{className:"bpm-meta-label",children:"Phone:"}),s.jsx("span",{className:"bpm-meta-val",children:e.customer_phone})]}),(e==null?void 0:e.function_type)&&s.jsxs("div",{className:"bpm-meta-row",children:[s.jsx("span",{className:"bpm-meta-label",children:"Function:"}),s.jsx("span",{className:"bpm-meta-val",children:e.function_type})]}),(e==null?void 0:e.delivery_date)&&s.jsxs("div",{className:"bpm-meta-row",children:[s.jsx("span",{className:"bpm-meta-label",children:"Event Date:"}),s.jsx("span",{className:"bpm-meta-val",children:j(e.delivery_date)})]}),(e==null?void 0:e.delivery_time)&&s.jsxs("div",{className:"bpm-meta-row",children:[s.jsx("span",{className:"bpm-meta-label",children:"Event Time:"}),s.jsx("span",{className:"bpm-meta-val",children:e.delivery_time})]}),s.jsx("div",{className:"bpm-divider-dashed"})]}),!((e==null?void 0:e.type)==="PARTY"||(e==null?void 0:e.type)==="PARTY_ORDER")&&((e==null?void 0:e.customer_name)||(e==null?void 0:e.customer_phone))&&s.jsxs("div",{className:"bpm-meta bpm-customer-details",children:[(e==null?void 0:e.customer_name)&&s.jsxs("div",{className:"bpm-meta-row",children:[s.jsx("span",{className:"bpm-meta-label",children:"Customer:"}),s.jsx("span",{className:"bpm-meta-val",children:e.customer_name})]}),(e==null?void 0:e.customer_phone)&&s.jsxs("div",{className:"bpm-meta-row",children:[s.jsx("span",{className:"bpm-meta-label",children:"Phone:"}),s.jsx("span",{className:"bpm-meta-val",children:e.customer_phone})]}),(e==null?void 0:e.customer_address)&&s.jsxs("div",{className:"bpm-meta-row",children:[s.jsx("span",{className:"bpm-meta-label",children:"Address:"}),s.jsx("span",{className:"bpm-meta-val",children:e.customer_address})]}),s.jsx("div",{className:"bpm-divider-dashed"})]}),s.jsxs("table",{className:"bpm-items-table",children:[s.jsx("thead",{children:s.jsxs("tr",{children:[s.jsx("th",{className:"th-item",children:"ITEM"}),s.jsx("th",{className:"th-qty",children:"QTY"}),s.jsx("th",{className:"th-amt",children:"AMOUNT"})]})}),s.jsx("tbody",{children:O(e==null?void 0:e.items).map((t,a)=>s.jsx(M.Fragment,{children:s.jsxs("tr",{className:"tr-item",children:[s.jsxs("td",{className:"td-name",children:[s.jsxs("div",{children:[t.name,t.notes?` (${t.notes})`:""]}),t.variation&&s.jsxs("div",{className:"td-var",children:["(",t.variation,")"]})]}),s.jsx("td",{className:"td-qty",children:t.quantity}),s.jsxs("td",{className:"td-amt",children:["₹",t.total_price.toFixed(2)]})]})},a))})]}),s.jsx("div",{className:"bpm-divider-solid"}),s.jsxs("div",{className:"bpm-totals",children:[s.jsxs("div",{className:"bpm-total-row",children:[s.jsx("span",{children:"Subtotal"}),s.jsxs("span",{className:"bpm-mono",children:["₹",(y=e==null?void 0:e.sub_total)==null?void 0:y.toFixed(2)]})]}),(e==null?void 0:e.discount_amount)>0&&s.jsxs("div",{className:"bpm-total-row",children:[s.jsx("span",{children:"Discount (-)"}),s.jsxs("span",{className:"bpm-mono",children:["₹",(N=e==null?void 0:e.discount_amount)==null?void 0:N.toFixed(2)]})]}),(e==null?void 0:e.delivery_charge)>0&&s.jsxs("div",{className:"bpm-total-row",children:[s.jsx("span",{children:"Delivery Chg (+)"}),s.jsxs("span",{className:"bpm-mono",children:["₹",(v=e==null?void 0:e.delivery_charge)==null?void 0:v.toFixed(2)]})]}),(e==null?void 0:e.container_charge)>0&&s.jsxs("div",{className:"bpm-total-row",children:[s.jsx("span",{children:"Package Chg (+)"}),s.jsxs("span",{className:"bpm-mono",children:["₹",(w=e==null?void 0:e.container_charge)==null?void 0:w.toFixed(2)]})]}),(e==null?void 0:e.tax_amount)>0&&s.jsxs("div",{className:"bpm-total-row",children:[s.jsx("span",{children:"Tax (+)"}),s.jsxs("span",{className:"bpm-mono",children:["₹",(_=e==null?void 0:e.tax_amount)==null?void 0:_.toFixed(2)]})]}),(e==null?void 0:e.tip_amount)>0&&s.jsxs("div",{className:"bpm-total-row",children:[s.jsx("span",{children:"Tip / Gratuity (+)"}),s.jsxs("span",{className:"bpm-mono",children:["₹",(k=e==null?void 0:e.tip_amount)==null?void 0:k.toFixed(2)]})]}),(e==null?void 0:e.round_off)!==0&&s.jsxs("div",{className:"bpm-total-row",children:[s.jsx("span",{children:"Round Off"}),s.jsxs("span",{className:"bpm-mono",children:[(e==null?void 0:e.round_off)>0?"+":"","₹",(T=e==null?void 0:e.round_off)==null?void 0:T.toFixed(2)]})]}),s.jsxs("div",{className:"bpm-grand-total-row",children:[s.jsx("span",{children:"GRAND TOTAL"}),s.jsxs("span",{className:"bpm-mono",children:["₹",(A=e==null?void 0:e.grand_total)==null?void 0:A.toFixed(2)]})]}),((e==null?void 0:e.type)==="PARTY"||(e==null?void 0:e.type)==="PARTY_ORDER")&&s.jsxs(s.Fragment,{children:[s.jsxs("div",{className:"bpm-total-row",style:{marginTop:"8px"},children:[s.jsx("span",{children:"Advance / Paid"}),s.jsxs("span",{className:"bpm-mono",children:["₹",((e==null?void 0:e.total_paid)||0).toFixed(2)]})]}),s.jsxs("div",{className:"bpm-total-row",children:[s.jsx("span",{children:"Balance Due"}),s.jsxs("span",{className:"bpm-mono",children:["₹",Math.max(0,((e==null?void 0:e.grand_total)||0)-((e==null?void 0:e.total_paid)||0)).toFixed(2)]})]})]})]}),s.jsx("div",{className:"bpm-divider-dashed"}),s.jsxs("div",{className:"bpm-thankyou",children:[s.jsx("p",{children:"Thank You For Your Order!"}),s.jsx("p",{className:"bpm-visit-again",children:"★ VISIT AGAIN ★"})]}),((printerSettings==null?void 0:printerSettings.print_format)==="NORMAL_3_INCH_WITH_TOKEN"||((z=JSON.parse(localStorage.getItem("pos_printer_settings")||"{}"))==null?void 0:z.print_format)==="NORMAL_3_INCH_WITH_TOKEN")&&s.jsx("div",{className:"bpm-tokens-section",style:{marginTop:"15px"},children:Object.entries(((e==null?void 0:e.items)||[]).reduce((t,a)=>{var p;const i=a.category_name||((p=a.product_id)==null?void 0:p.category)||a.category||"Kitchen Orders";return t[i]||(t[i]=[]),t[i].push(a),t},{})).map(([t,a],i)=>s.jsxs("div",{className:"bpm-token-ticket",style:{marginTop:"16px",borderTop:"2px dashed #000",paddingTop:"10px",pageBreakInside:"avoid"},children:[s.jsx("div",{style:{textAlign:"center",fontWeight:900,fontSize:"10px",textTransform:"uppercase",letterSpacing:"1px"},children:"✂ ----------------------------------------"}),s.jsxs("div",{style:{textAlign:"center",fontWeight:900,fontSize:"13px",textTransform:"uppercase",margin:"4px 0",color:"#000"},children:["TOKEN — ",t]}),s.jsxs("div",{style:{fontSize:"10px",fontWeight:800,display:"flex",justifyBetween:"space-between",marginBottom:"4px",color:"#000"},children:[s.jsxs("span",{children:["TOKEN #",i+1," | BILL #",e==null?void 0:e.bill_number]}),s.jsxs("span",{children:[j(e==null?void 0:e.createdAt)," ",u(e==null?void 0:e.createdAt)]})]}),(e==null?void 0:e.table_no)&&s.jsxs("div",{style:{fontSize:"10px",fontWeight:800,marginBottom:"4px",color:"#000"},children:["TABLE: ",e.table_no," (",e.order_type||"DINE IN",")"]}),s.jsxs("table",{style:{width:"100%",fontSize:"11px",borderCollapse:"collapse",borderTop:"1px dashed #000",borderBottom:"1px dashed #000",margin:"4px 0"},children:[s.jsx("thead",{children:s.jsxs("tr",{style:{textTransform:"uppercase",borderBottom:"1px solid #000",color:"#000"},children:[s.jsx("th",{style:{textAlign:"left",padding:"3px 0"},children:"ITEM"}),s.jsx("th",{style:{textAlign:"right",padding:"3px 0"},children:"QTY"})]})}),s.jsx("tbody",{children:a.map((p,h)=>s.jsxs("tr",{style:{color:"#000"},children:[s.jsx("td",{style:{padding:"3px 0",fontWeight:700},children:p.name||p.item_name}),s.jsx("td",{style:{textAlign:"right",padding:"3px 0",fontWeight:900},children:p.quantity})]},h))})]}),s.jsx("div",{style:{textAlign:"center",fontSize:"9px",fontWeight:800,marginTop:"4px",textTransform:"uppercase",color:"#000"},children:"[ COUNTER COPY — DETACHABLE TOKEN ]"})]},i))})]})}),s.jsxs("div",{className:"bpm-actions no-print",children:[s.jsxs("button",{className:"btn-export print",onClick:F,children:[s.jsx(K,{size:18})," Print POS Receipt"]}),s.jsx("button",{className:"bpm-done-btn",onClick:o,children:"Done"})]})]})})]}),s.jsx("style",{children:`
                .bpm-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(15, 23, 42, 0.75);
                    backdrop-filter: blur(12px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 3000;
                    padding: 1rem;
                    animation: bpmFadeIn 0.3s ease;
                }

                @keyframes bpmFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                .bpm-modal {
                    background: #ffffff;
                    border-radius: 20px;
                    width: 100%;
                    max-width: 360px;
                    max-height: 90vh;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 0 40px 100px -20px rgba(0, 0, 0, 0.4);
                    animation: bpmSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                    overflow: hidden;
                }

                @keyframes bpmSlideUp {
                    from { opacity: 0; transform: translateY(40px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }

                .bpm-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 1rem 1.25rem;
                    border-bottom: 1px solid #f1f5f9;
                    background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);
                }

                .bpm-header-left {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .bpm-success-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 14px;
                    background: #16a34a;
                    color: #ffffff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 8px 16px -4px rgba(22, 163, 74, 0.4);
                }

                .bpm-title {
                    margin: 0;
                    font-size: 1rem;
                    font-weight: 800;
                    color: #0f172a;
                }

                .bpm-subtitle {
                    font-size: 0.85rem;
                    color: #64748b;
                    margin: 0;
                    font-weight: 700;
                }

                .bpm-close-btn {
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    color: #64748b;
                    transition: all 0.2s;
                }

                .bpm-close-btn:hover {
                    background: #ef4444;
                    border-color: #ef4444;
                    color: #fff;
                }

                .bpm-body {
                    flex: 1;
                    overflow-y: auto;
                    padding: 1rem;
                    display: block;
                    scrollbar-width: thin;
                    scrollbar-color: #cbd5e1 transparent;
                }

                .bpm-receipt-container {
                    perspective: 1000px;
                    margin-bottom: 0.5rem;
                }

                .bpm-receipt {
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    border-radius: 4px;
                    padding: 1rem;
                    font-family: 'Inter', system-ui, sans-serif;
                    color: #000;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.05);
                    position: relative;
                }

                .bpm-receipt::before,
                .bpm-receipt::after {
                    content: '';
                    position: absolute;
                    left: 0;
                    right: 0;
                    height: 4px;
                    background-image: radial-gradient(circle, #e2e8f0 1.5px, transparent 1.5px);
                    background-size: 8px 4px;
                }
                .bpm-receipt::before { top: 0; }
                .bpm-receipt::after { bottom: 0; }

                .bpm-receipt-header {
                    text-align: center;
                    margin-bottom: 0.5rem;
                }

                .bpm-rest-name {
                    font-size: 1rem;
                    font-weight: 900;
                    color: #000;
                    margin: 0 0 4px 0;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }

                .bpm-rest-addr, .bpm-rest-phone {
                    font-size: 0.65rem;
                    color: #475569;
                    margin: 2px 0;
                    font-weight: 600;
                }

                .bpm-divider-dashed {
                    border: none;
                    border-top: 1.5px dashed #94a3b8;
                    margin: 0.5rem 0;
                }

                .bpm-divider-solid {
                    border: none;
                    border-top: 2px solid #000;
                    margin: 0.5rem 0;
                }

                .bpm-meta {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .bpm-meta-row {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.7rem;
                    font-weight: 700;
                }

                .bpm-meta-label {
                    color: #64748b;
                    text-transform: uppercase;
                }

                .bpm-pay-badge {
                    background: #000;
                    color: #fff;
                    padding: 1px 8px;
                    border-radius: 4px;
                    font-size: 0.7rem;
                }
                .bpm-items-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 0.5rem 0;
                }

                .bpm-items-table th {
                    border-bottom: 1px solid #000;
                    padding: 4px 0;
                    font-size: 0.65rem;
                    font-weight: 900;
                    text-align: left;
                    color: #64748b;
                }

                .th-qty { text-align: center !important; }
                .th-amt { text-align: right !important; }

                .tr-item {
                    border-bottom: 1px dashed #f1f5f9;
                }

                .td-name {
                    padding: 6px 0;
                    font-size: 0.75rem;
                    font-weight: 700;
                    max-width: 160px;
                    line-height: 1.3;
                }

                .td-var {
                    font-size: 0.7rem;
                    color: #64748b;
                    font-weight: 600;
                }

                .td-qty {
                    text-align: center;
                    padding: 6px 0;
                    font-size: 0.75rem;
                    font-weight: 900;
                    font-family: 'JetBrains Mono', monospace;
                }

                .td-amt {
                    text-align: right;
                    padding: 6px 0;
                    font-size: 0.75rem;
                    font-weight: 900;
                    font-family: 'JetBrains Mono', monospace;
                }

                .bpm-totals {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .bpm-total-row {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.75rem;
                    font-weight: 700;
                }

                .bpm-grand-total-row {
                    display: flex;
                    justify-content: space-between;
                    font-size: 1rem;
                    font-weight: 900;
                    border-top: 2px solid #000;
                    border-bottom: 2px solid #000;
                    padding: 6px 0;
                    margin-top: 4px;
                }

                .bpm-mono { font-family: 'JetBrains Mono', monospace; }

                .bpm-thankyou {
                    text-align: center;
                    padding: 0.25rem 0;
                    font-size: 0.7rem;
                    font-weight: 800;
                    text-transform: uppercase;
                }

                .bpm-visit-again {
                    font-size: 0.6rem;
                    color: #64748b;
                    margin-top: 2px;
                }

                .bpm-actions {
                    display: flex;
                    gap: 1rem;
                    margin-top: 0.5rem;
                }

                .bpm-print-btn {
                    flex: 1.5;
                    height: 48px;
                    background: #0f172a;
                    color: #fff;
                    border-radius: 12px;
                    border: none;
                    font-size: 0.85rem;
                    font-weight: 900;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    cursor: pointer;
                    transition: all 0.2s;
                    box-shadow: 0 12px 24px -8px rgba(15, 23, 42, 0.4);
                }

                .bpm-print-btn:hover { background: #000; transform: translateY(-2px); }

                .bpm-done-btn {
                    flex: 1;
                    height: 48px;
                    background: #f1f5f9;
                    color: #334155;
                    border-radius: 12px;
                    border: 2px solid #e2e8f0;
                    font-size: 0.85rem;
                    font-weight: 900;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .bpm-done-btn:hover { background: #e2e8f0; }

                /* ── PRINT STYLES ── */
                @media print {
                    /* Reset everything */
                    @page {
                        margin: 0;
                        size: auto;
                    }

                    /* General hiding */
                    html, body {
                        height: auto !important;
                        overflow: visible !important;
                        background: #fff !important;
                    }

                    /* Hide everything EXCEPT the modal overlay and its children */
                    body > * {
                        display: none !important;
                    }

                    body > .bpm-overlay {
                        display: block !important;
                        position: absolute !important;
                        top: 0 !important;
                        left: 0 !important;
                        width: 100% !important;
                        background: white !important;
                        visibility: visible !important;
                        backdrop-filter: none !important;
                    }

                    /* Reset Modal appearance for Paper */
                    .bpm-modal {
                        position: static !important;
                        width: 80mm !important;
                        margin: 0 auto !important;
                        box-shadow: none !important;
                        border: none !important;
                        display: block !important;
                        max-width: none !important;
                        max-height: none !important;
                        visibility: visible !important;
                    }

                    .bpm-body {
                        padding: 0 !important;
                        display: block !important;
                        visibility: visible !important;
                        overflow: visible !important;
                    }

                    .bpm-receipt-container {
                        display: block !important;
                        visibility: visible !important;
                    }

                    /* Force ALL Receipt parts to be visible */
                    .bpm-receipt, 
                    .bpm-receipt *,
                    .bpm-receipt-header,
                    .bpm-meta,
                    .bpm-items-table,
                    .bpm-totals,
                    .bpm-thankyou {
                        display: block !important;
                        visibility: visible !important;
                        opacity: 1 !important;
                    }

                    .bpm-items-table {
                        display: table !important;
                        width: 100% !important;
                    }
                    
                    .bpm-items-table tr {
                        display: table-row !important;
                    }
                    
                    .bpm-items-table th, .bpm-items-table td {
                        display: table-cell !important;
                    }

                    .tr-item {
                        border-bottom: 1px dashed #000 !important;
                    }

                    .bpm-pay-badge {
                        background: #000 !important;
                        color: #fff !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }

                    .bpm-grand-total-row {
                        background: #000 !important;
                        color: #fff !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                        display: flex !important;
                    }

                    /* Specifically hide the UI components */
                    .no-print, 
                    .bpm-header, 
                    .bpm-actions,
                    .bpm-success-icon,
                    button {
                        display: none !important;
                    }
                }

                @media (max-width: 480px) {
                    .bpm-modal { max-height: 98vh; width: 95%; }
                    .bpm-body { padding: 1.25rem; }
                    .bpm-receipt { padding: 1.25rem 1rem; }
                    .bpm-actions { flex-direction: column; }
                }

                .bpm-loading { padding: 4rem; text-align: center; }
                .bpm-spinner { animation: spin 1s linear infinite; margin: 0 auto 1rem; }
                @keyframes spin { to { transform: rotate(360deg); } }
            `})]}):null};export{Q as B};
