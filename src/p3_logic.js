(function(){
'use strict';
const X=window.__AML,{CC,RULEID,AUDf,esc,ts,dt,dtl,BASE}=X;
const sum=l=>l.reduce((s,t)=>s+t.amt,0);
function stats(a){
  const k=a.cust.key,tx=[...a.tx].sort((x,y)=>x.time<y.time?-1:1);
  const inn=tx.filter(t=>t.to===k),out=tx.filter(t=>t.from===k);
  return {tx,inn,out,inT:sum(inn),outT:sum(out),all:sum(tx)};
}
function cite(a,t){
  const k=a.cust.key,L=x=>esc(a.nodes[x].label);
  const who=t.from===k?L(t.to):t.to===k?L(t.from):L(t.from)+' → '+L(t.to);
  return '<span class="cite" contenteditable="false">'+t.id+' · '+who+' · '+dt(t.time)+'</span>';
}
function cites(a,l){
  if(l.length<=4) return l.map(t=>cite(a,t)).join(' ');
  return cite(a,l[0])+' … '+cite(a,l[l.length-1])+' <span class="cite-note">('+l.length+' transactions)</span>';
}
function riskNotes(a){
  const n=[];
  Object.values(a.nodes).forEach(v=>{if(v.screen&&v.screen.s!=='clear')n.push(esc(v.label)+' returned a '+v.screen.list+' candidate match (score '+v.screen.score.toFixed(2)+'): '+v.screen.detail+'. The match is unconfirmed pending manual disposition.');});
  (a.media||[]).forEach(m=>n.push('Adverse media on '+esc(m.entity)+': '+m.summary));
  return n.join(' ');
}
function base(a){
  const c=a.cust,others=Object.entries(a.nodes).filter(e=>e[0]!==c.key).map(e=>e[1]);
  const shown=others.slice(0,4).map(v=>esc(v.label)+' ('+v.cc+')').join(', ')+(others.length>4?' and '+(others.length-4)+' others':'');
  return esc(c.name)+' ('+c.type.toLowerCase()+'), account '+c.acct+', customer since '+c.since+'. '+esc(c.occ)+'. Beneficial owners: '+esc(c.ubo)+'. KYC risk rating: '+c.risk+'. Counterparties in the alert: '+shown+'.';
}
function narr(a){
  const s=stats(a),L=k=>esc(a.nodes[k].label),cc=k=>CC[a.nodes[k].cc]||a.nodes[k].cc;
  const risk=riskNotes(a),ipn=esc(a.ip||'No device or IP anomalies were recorded for the period.');
  const hrs=(x,y)=>Math.max(1,Math.round((ts(y)-ts(x))/36e5));
  const r={who:base(a)},bl=esc(a.cust.baseline);
  const lastOf=l=>l[l.length-1];
  if(a.kind==='structuring'){
    const d=s.inn,mn=Math.min(...d.map(t=>t.amt)),mx=Math.max(...d.map(t=>t.amt));
    const br=[...new Set(d.map(t=>a.nodes[t.from].label.replace('Cash · ','')))],o=s.out[0],w=hrs(d[0].time,lastOf(d).time);
    r.what=d.length+' cash deposits totalling '+AUDf(s.inT)+' were made to the account, each between '+AUDf(mn)+' and '+AUDf(mx)+', which is '+AUDf(10000-mx)+' to '+AUDf(10000-mn)+' under the AUD 10,000 threshold transaction reporting level '+cites(a,d)+'.'+(o?' The funds were then sent out by '+o.inst.toLowerCase()+': '+AUDf(s.outT)+' to '+L(o.to)+' ('+cc(o.to)+') '+cites(a,s.out)+'.':'');
    r.when='First deposit '+dtl(d[0].time)+'; last deposit '+dtl(lastOf(d).time)+', a window of '+w+' hours.'+(o?' Outbound transfer on '+dtl(o.time)+'.':'')+' Baseline: '+bl;
    r.where='Cash was deposited at '+br.length+' location'+(br.length>1?'s':'')+': '+br.join(', ')+'.'+(o?' Outgoing funds went to '+L(o.to)+' in '+cc(o.to)+'.':'')+' '+ipn;
    r.why='Rule TM-01 (Structuring) matched on '+d.length+' deposits inside a '+w+' hour window, each placed just under the reporting level.'+(o?' Combined with a prompt offshore transfer of the pooled funds, the activity is consistent with deliberate avoidance of threshold reporting and layering of cash.':' The pattern alone is consistent with avoidance of threshold reporting.')+' '+risk;
    r.how='Cash was split into amounts under AUD 10,000 and placed across '+br.length+' branch'+(br.length>1?'es':'')+' in rotation ('+br.join(', ')+').'+(o?' The pooled balance was then moved in a single international wire, which leaves the source of the cash unexplained.':'');
  }else if(a.kind==='passthrough'){
    const pct=(s.outT/s.inT*100).toFixed(1),w=hrs(s.inn[0].time,lastOf(s.out).time);
    r.what=s.inn.length+' incoming transfers totalling '+AUDf(s.inT)+' arrived from '+s.inn.length+' different senders '+cites(a,s.inn)+'. '+s.out.length+' outgoing payments totalling '+AUDf(s.outT)+', '+pct+'% of the funds received, followed '+cites(a,s.out)+'.';
    r.when='Credits arrived between '+dtl(s.inn[0].time)+' and '+dtl(lastOf(s.inn).time)+'. The last payment left '+w+' hours after the first credit, on '+dtl(lastOf(s.out).time)+'. Baseline: '+bl;
    r.where='Senders are in '+[...new Set(s.inn.map(t=>cc(t.from)))].join(', ')+'. Recipients: '+s.out.map(t=>L(t.to)+' ('+cc(t.to)+')').join(' and ')+'. '+ipn;
    r.why='Rule TM-02 (Pass-through velocity) matched: the account passed on '+pct+'% of incoming funds within '+w+' hours of the first credit. Rapid pooling and onward transfer of this kind is consistent with a money mule account unless the account holder can explain it. '+risk;
    r.how='Credits from '+s.inn.length+' senders were pooled, then '+s.out.map(t=>AUDf(t.amt)+' was sent by '+t.inst.toLowerCase()+' to '+L(t.to)).join(', and ')+'. The account kept '+AUDf(s.inT-s.outT)+'.';
  }else if(a.kind==='circular'){
    const n=Object.keys(a.nodes).length,c1=s.tx.slice(0,n),cyc=s.out.length;
    const days=Math.round((ts(c1[n-1].time)-ts(c1[0].time))/864e5);
    r.what=s.tx.length+' international wires totalling '+AUDf(s.all)+' moved between '+n+' entities in '+cyc+' cycles. In the first cycle '+AUDf(s.out[0].amt)+' left the account '+cites(a,[s.out[0]])+' and '+AUDf(s.inn[0].amt)+' came back from '+L(s.inn[0].from)+' '+cites(a,[s.inn[0]])+'.';
    r.when='Cycle 1 ran from '+dtl(c1[0].time)+' to '+dtl(c1[n-1].time)+' ('+days+' days). Cycle 2 ran from '+dtl(s.tx[n].time)+' to '+dtl(lastOf(s.tx).time)+'. Baseline: '+bl;
    r.where='Funds passed through '+[...new Set(s.tx.map(t=>cc(t.to)))].join(', ')+'. Path: '+c1.map(t=>L(t.from)+' ('+cc(t.from)+')').join(' → ')+' → '+L(c1[n-1].to)+'. '+ipn;
    r.why='Rule TM-03 (Circular flow) matched: funds returned to the account through an affiliate after passing through '+(n-2)+' intermediaries. Each cycle returned '+(s.inn[0].amt/s.out[0].amt*100).toFixed(1)+'% of the amount sent, a small loss that reads like a service charge, and no supporting contracts are on file. '+risk;
    r.how=c1.map((t,i)=>(i+1)+'. '+L(t.from)+' sent '+AUDf(t.amt)+' to '+L(t.to)+' '+cite(a,t)).join(' ')+' The second cycle repeated the route with smaller amounts.';
  }else if(a.kind==='fanout'){
    const i0=s.inn[0],o=s.out,mn=Math.min(...o.map(t=>t.amt)),mx=Math.max(...o.map(t=>t.amt)),pct=(s.outT/i0.amt*100).toFixed(1);
    const by={};o.forEach(t=>{const k=cc(t.to);by[k]=(by[k]||0)+1});
    const spread=Object.entries(by).map(e=>e[0]+' ('+e[1]+')').join(', '),w=hrs(o[0].time,lastOf(o).time);
    r.what='A single '+i0.inst.toLowerCase()+' of '+AUDf(i0.amt)+' from '+L(i0.from)+' '+cite(a,i0)+' was followed by '+o.length+' transfers of '+AUDf(mn)+' to '+AUDf(mx)+' to '+o.length+' different beneficiaries, totalling '+AUDf(s.outT)+' ('+pct+'% of the deposit) '+cites(a,o)+'.';
    r.when='The deposit arrived on '+dtl(i0.time)+'. Disbursements ran from '+dtl(o[0].time)+' to '+dtl(lastOf(o).time)+', a window of '+w+' hours. Baseline: '+bl;
    r.where='Beneficiaries are in '+Object.keys(by).length+' countries: '+spread+'. The deposit came from '+L(i0.from)+' ('+cc(i0.from)+'). '+ipn;
    r.why='Rule TM-04 (Fan-out) matched: '+pct+'% of a single large deposit was scattered across '+o.length+' beneficiaries in '+Object.keys(by).length+' jurisdictions within '+w+' hours. The activity does not fit the customer profile ('+esc(a.cust.occ.toLowerCase())+'). '+risk;
    r.how='One large credit was split into '+o.length+' near-equal international transfers over '+Math.ceil(w/24)+' days to beneficiaries not seen before in the customer\'s history, spreading the funds across '+Object.keys(by).length+' jurisdictions.';
  }else{
    const i0=s.inn[0],o0=s.out[0],dd=Math.floor((ts(i0.time)-ts(a.dormantSince))/864e5),w=hrs(i0.time,o0.time);
    r.what='After '+dd+' days with no activity (last transaction '+dtl(a.dormantSince)+'), the account received '+AUDf(i0.amt)+' from '+L(i0.from)+' ('+cc(i0.from)+') '+cite(a,i0)+' and sent '+AUDf(o0.amt)+' to '+L(o0.to)+' ('+cc(o0.to)+') '+cite(a,o0)+', which is '+(o0.amt/i0.amt*100).toFixed(1)+'% of the amount received.';
    r.when='The account was dormant from '+dtl(a.dormantSince)+'. The credit arrived on '+dtl(i0.time)+' and the debit left '+w+' hours later, on '+dtl(o0.time)+'. Baseline: '+bl;
    r.where='Funds moved '+cc(i0.from)+' → Australia → '+cc(o0.to)+'. '+ipn;
    r.why='Rule TM-05 (Dormant revival) matched: an account inactive for '+dd+' days received a high-value credit and sent most of it on within '+w+' hours. '+risk;
    r.how='The dormant account was reactivated by an inbound payment from '+L(i0.from)+' and the balance was forwarded to '+L(o0.to)+' by '+o0.inst.toLowerCase()+', leaving '+AUDf(s.inT-s.outT)+' in the account.';
  }
  return r;
}
function trace(a){
  const ref='ACC-'+a.cust.acct.slice(-4),s=stats(a),t0=ts(a.raised),first=s.tx[0].time.slice(0,10);
  const nodes=Object.keys(a.nodes).length,hits=Object.values(a.nodes).filter(v=>v.screen&&v.screen.s!=='clear').length;
  const sql={structuring:"SELECT txn_id, booked_at, branch, amount\nFROM ledger\nWHERE account_ref = '"+ref+"'\n  AND instrument = 'CASH_DEPOSIT'\n  AND amount BETWEEN 8500 AND 9950\n  AND booked_at >= now() - interval '48 hours'\nORDER BY booked_at;",
   passthrough:"SELECT direction, SUM(amount), COUNT(*), MIN(booked_at), MAX(booked_at)\nFROM ledger\nWHERE account_ref = '"+ref+"' AND booked_at >= now() - interval '4 hours'\nGROUP BY direction;",
   circular:"SELECT txn_id, src_ref, dst_ref, amount, booked_at\nFROM ledger\nWHERE account_ref = '"+ref+"' AND instrument LIKE 'INTL_WIRE%'\n  AND booked_at >= '"+first+"'\nORDER BY booked_at;",
   fanout:"SELECT txn_id, dst_ref, dst_country, amount, booked_at\nFROM ledger\nWHERE account_ref = '"+ref+"' AND direction = 'OUT'\n  AND booked_at >= '"+first+"'\nORDER BY booked_at;",
   dormant:"SELECT MAX(booked_at) AS last_activity, COUNT(*)\nFROM ledger\nWHERE account_ref = '"+ref+"' AND booked_at < '"+first+"';"}[a.kind];
  const cy=a.kind==='circular'?"MATCH p = (a:Account {ref:'"+ref+"'})-[:TRANSFERRED*3..5]->(a)\nRETURN p, reduce(s = 0, r IN relationships(p) | s + r.amount) AS flow\nORDER BY flow DESC LIMIT 10;":"MATCH p = (a:Account {ref:'"+ref+"'})-[:TRANSFERRED*1..3]-(b:Account)\nWHERE all(r IN relationships(p) WHERE r.ts >= datetime('"+first+"'))\nRETURN p LIMIT 50;";
  const mt=(a.media&&a.media[0])?a.media[0].entity:Object.values(a.nodes).filter(v=>v!==a.nodes[a.cust.key])[0].label;
  return [
   {m:0,actor:'Rule engine',tool:'rule-engine',event:'Rule matched',text:'Rule '+RULEID[a.kind]+' ('+X.KIND[a.kind]+') matched on account '+a.cust.acct+'.',res:s.tx.length+' transactions in scope'},
   {m:1,actor:'Triage agent',tool:'aml-postgres',event:'Queried ledger',text:sql,res:s.tx.length+' rows · total '+AUDf(s.all)+' · scored '+a.score+'/100 ('+X.SEVL[a.sev].toLowerCase()+')'},
   {m:3,actor:'Investigation agent',tool:'aml-neo4j',event:'Traced network',text:cy,res:nodes+' nodes · '+new Set(a.tx.map(t=>t.from+'>'+t.to)).size+' edges'},
   {m:4,actor:'Investigation agent',tool:'opensanctions-screening',event:'Screened counterparties',text:'POST /match/default\n{"queries":{"q1":{"schema":"Entity","properties":{"name":["<counterparty>"]}}, ... x'+(nodes-1)+'}}',res:(nodes-1)+' entities screened · '+hits+' candidate'+(hits===1?'':'s')+' above 0.70'},
   {m:5,actor:'Adverse media agent',tool:'adverse-media-search',event:'Searched adverse media',text:'"'+mt+'" AND (laundering OR fraud OR sanctions)',res:(a.media||[]).length+' relevant article'+((a.media||[]).length===1?'':'s')}
  ].map(x=>Object.assign(x,{t:t0+x.m*60000}));
}
function layout(a){
  const ids=Object.keys(a.nodes),pos={},CX=430;let H=380;
  if(a.kind==='circular'){
    H=400;ids.forEach((id,i)=>{const ang=-Math.PI/2+i*2*Math.PI/ids.length;pos[id]={x:CX+190*Math.cos(ang),y:200+130*Math.sin(ang)}});
    return {pos,H};
  }
  const hub=a.cust.key,toHub=new Set(a.tx.filter(t=>t.to===hub).map(t=>t.from)),fromHub=new Set(a.tx.filter(t=>t.from===hub).map(t=>t.to));
  const srcs=ids.filter(i=>i!==hub&&toHub.has(i)),dsts=ids.filter(i=>i!==hub&&!toHub.has(i));
  H=Math.max(360,Math.max(srcs.length,dsts.length)*30+80);
  const put=(l,x)=>{const gap=Math.min(56,(H-80)/Math.max(1,l.length-1));l.forEach((id,i)=>{pos[id]={x,y:H/2+(i-(l.length-1)/2)*gap}})};
  put(srcs,250);put(dsts,610);pos[hub]={x:CX,y:H/2};
  return {pos,H};
}
const fmtK=n=>n>=1000?(Math.round(n/100)/10)+'k':String(n);
const trunc=(s,n)=>s.length>n?s.slice(0,n-1)+'…':s;
function graphSVG(a,selNode){
  const {pos,H}=layout(a),ids=Object.keys(a.nodes),CX=430,E={};
  a.tx.forEach(t=>{const k=t.from+'>'+t.to;(E[k]=E[k]||{f:t.from,t:t.to,amt:0,n:0});E[k].amt+=t.amt;E[k].n++});
  const edges=Object.values(E),max=Math.max(...edges.map(e=>e.amt)),R=k=>k===a.cust.key?16:8;
  let s='<svg class="graph" viewBox="0 0 860 '+H+'" role="img" aria-label="Transaction network for '+a.id+'"><defs><marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="currentColor"/></marker></defs>';
  edges.forEach(e=>{
    const p=pos[e.f],q=pos[e.t],dx=q.x-p.x,dy=q.y-p.y,len=Math.hypot(dx,dy)||1,ux=dx/len,uy=dy/len;
    const x1=p.x+ux*(R(e.f)+3),y1=p.y+uy*(R(e.f)+3),x2=q.x-ux*(R(e.t)+8),y2=q.y-uy*(R(e.t)+8);
    const dim=selNode&&selNode!==e.f&&selNode!==e.t,w=(1+5*Math.sqrt(e.amt/max)).toFixed(1);
    s+='<g class="edge'+(dim?' dim':'')+'"><line x1="'+x1.toFixed(1)+'" y1="'+y1.toFixed(1)+'" x2="'+x2.toFixed(1)+'" y2="'+y2.toFixed(1)+'" stroke-width="'+w+'" marker-end="url(#ah)"/><title>'+esc(a.nodes[e.f].label)+' to '+esc(a.nodes[e.t].label)+': '+AUDf(e.amt)+' in '+e.n+' transaction'+(e.n>1?'s':'')+'</title>';
    if(edges.length<=8)s+='<text class="elab" x="'+((x1+x2)/2).toFixed(1)+'" y="'+(((y1+y2)/2)-5).toFixed(1)+'">'+fmtK(e.amt)+'</text>';
    s+='</g>';
  });
  ids.forEach(id=>{
    const n=a.nodes[id],p=pos[id],hit=n.screen&&n.screen.s!=='clear',mid=Math.abs(p.x-CX)<30;
    let tx,ty,an;
    if(mid){tx=p.x;ty=p.y<H/2?p.y-20:p.y+34;an='middle'}else if(p.x<CX){tx=p.x-14;ty=p.y+4;an='end'}else{tx=p.x+14;ty=p.y+4;an='start'}
    s+='<g class="node '+n.type+(hit?' hit':'')+(selNode===id?' sel':'')+'" data-act="node" data-id="'+id+'" tabindex="0" role="button" aria-label="'+esc(n.label)+'"><circle cx="'+p.x.toFixed(1)+'" cy="'+p.y.toFixed(1)+'" r="'+R(id)+'"/><text x="'+tx.toFixed(1)+'" y="'+ty.toFixed(1)+'" text-anchor="'+an+'">'+esc(trunc(n.label,27))+'</text></g>';
  });
  return s+'</svg>';
}
Object.assign(X,{stats,narr,trace,graphSVG,cites,cite,riskNotes,sum});
})();
