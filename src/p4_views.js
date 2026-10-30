(function(){
'use strict';
const X=window.__AML,{KIND,STATUS,SEVL,CC,RULEID,AUDf,esc,ts,dt,dtl,age,ALERTS,byId,fmtMs,BASE}=X;
const S={view:'alerts',sel:'AL-24119',fk:'all',fs:'all',tab:'tx',node:null,closing:false,smrBusy:null,drafts:{},sign:{},audit:[],af:'all',ar:'all',json:false};
X.S=S;
const sevPill=s=>'<span class="pill sev-'+s+'"><i></i>'+SEVL[s]+'</span>';
const stPill=s=>'<span class="pill st-'+s+'">'+STATUS[s]+'</span>';
const SECS=[['who','Who','Customer, beneficial owners, counterparties'],['what','What','Instrument, amounts, frequency, currency'],['when','When','Dates, velocity window, baseline'],['where','Where','Institutions, locations, jurisdictions'],['why','Why','Basis for suspicion and typology'],['how','How','How the funds were routed']];
const REASONS=['Consistent with customer baseline','Verified legitimate source of funds','Duplicate of an existing alert','Insufficient indicators after review'];
X.SECS=SECS;X.REASONS=REASONS;

function visible(){return ALERTS.filter(a=>(S.fk==='all'||a.kind===S.fk)&&(S.fs==='all'||a.status===S.fs)).sort((x,y)=>y.score-x.score)}
const opts=(o,cur)=>Object.entries(o).map(e=>'<option value="'+e[0]+'"'+(e[0]===cur?' selected':'')+'>'+e[1]+'</option>').join('');

function txTable(a){
  const s=X.stats(a),L=k=>esc(a.nodes[k].label);
  return '<div class="scroll"><table><thead><tr><th>ID</th><th>Time</th><th>From</th><th>To</th><th>Instrument</th><th class="r">Amount</th></tr></thead><tbody>'+
   s.tx.map(t=>'<tr><td class="id">'+t.id+'</td><td class="num" style="white-space:nowrap">'+dt(t.time)+'</td><td>'+L(t.from)+'</td><td>'+L(t.to)+'</td><td>'+esc(t.inst)+'</td><td class="r num">'+AUDf(t.amt).replace('AUD ','')+'</td></tr>').join('')+
   '<tr class="tot"><td colspan="5">Total, '+s.tx.length+' transactions (AUD)</td><td class="r num">'+AUDf(s.all).replace('AUD ','')+'</td></tr></tbody></table></div>';
}
function screenTab(a){
  const rows=Object.entries(a.nodes).map(e=>{const n=e[1],sc=n.screen;
    const res=!sc?'<span class="muted">Customer, KYC on file</span>':sc.s==='clear'?'<span class="pill hit-clear">Clear</span>':'<span class="pill hit-'+sc.s+'">'+(sc.s==='pep'?'PEP candidate':'Sanctions candidate')+' · '+sc.score.toFixed(2)+'</span><span class="sub">'+esc(sc.detail)+'</span>';
    return '<tr><td>'+esc(n.label)+'<span class="sub">'+n.type+'</span></td><td>'+(CC[n.cc]||n.cc)+'</td><td>'+res+'</td></tr>'}).join('');
  const media=(a.media||[]).length?a.media.map(m=>'<div class="note" style="margin:0 0 8px"><b>'+esc(m.entity)+'</b><br>'+esc(m.summary.charAt(0).toUpperCase()+m.summary.slice(1))+'<span class="sub">'+esc(m.source)+' · '+m.date+'</span></div>').join(''):'<p class="muted" style="margin:0">No relevant adverse media found for the counterparties.</p>';
  return '<div class="scroll"><table><thead><tr><th>Entity</th><th>Country</th><th>Screening result</th></tr></thead><tbody>'+rows+'</tbody></table></div><div class="pad"><h3 style="margin-bottom:8px">Adverse media</h3>'+media+'</div>';
}
function traceTab(a){
  return '<div class="pad">'+X.trace(a).map(t=>'<div class="step"><div class="h"><b>'+t.actor+'</b><span class="mono muted">'+t.tool+'</span><span class="mono muted">'+fmtMs(t.t)+'</span></div><pre>'+esc(t.text)+'</pre><div class="res">'+esc(t.res)+'</div></div>').join('')+'</div>';
}
function actions(a){
  if(a.status==='closed')return '<span class="muted">Closed: '+esc(a.closeReason||'')+'</span><button class="btn" data-act="reopen" data-id="'+a.id+'">Reopen</button>';
  if(S.closing)return '<select id="closeReason" aria-label="Reason for closing">'+REASONS.map(r=>'<option>'+r+'</option>').join('')+'</select><button class="btn pri" data-act="close-do" data-id="'+a.id+'">Close alert</button><button class="btn" data-act="close-cancel">Cancel</button>';
  let h='';
  if(a.status==='new')h+='<button class="btn pri" data-act="start" data-id="'+a.id+'">Start investigation</button>';
  if(a.status==='investigating')h+='<button class="btn pri" data-act="draft" data-id="'+a.id+'">Draft SMR</button>';
  if(a.status==='drafted'||a.status==='ready')h+='<button class="btn pri" data-act="go-smr" data-id="'+a.id+'">Open in SMR studio</button>';
  h+='<button class="btn" data-act="go-net" data-id="'+a.id+'">View network</button>';
  if(a.status==='new'||a.status==='investigating')h+='<button class="btn" data-act="close-open">Close as no suspicion</button>';
  return h;
}
function detail(a){
  const c=a.cust,s=X.stats(a);
  return '<section class="panel" id="detail"><header><div><h2 class="mono" style="font-size:16px">'+a.id+'</h2><span class="muted">'+KIND[a.kind]+' · rule '+RULEID[a.kind]+' · raised '+dt(a.raised)+', '+age(a.raised)+' ago</span></div><div class="row">'+sevPill(a.sev)+stPill(a.status)+'</div></header>'+
   '<div class="pad"><dl class="kv"><dt>Customer</dt><dd><b>'+esc(c.name)+'</b> · '+c.type+' · '+c.acct+'</dd><dt>Profile</dt><dd>'+esc(c.occ)+', customer since '+c.since+', KYC risk '+c.risk+'</dd><dt>Ultimate owners</dt><dd>'+esc(c.ubo)+'</dd><dt>Baseline</dt><dd>'+esc(c.baseline)+'</dd><dt>Score</dt><dd class="num">'+a.score+' / 100 · '+s.tx.length+' transactions · '+AUDf(s.all)+'</dd></dl></div>'+
   '<div class="pad row" style="border-top:1px solid var(--line)">'+actions(a)+'</div>'+
   '<div class="tabs" role="tablist">'+[['tx','Transactions'],['screen','Screening & media'],['trace','Agent trace']].map(t=>'<button role="tab" class="'+(S.tab===t[0]?'on':'')+'" data-act="tab" data-id="'+t[0]+'">'+t[1]+'</button>').join('')+'</div>'+
   (S.tab==='tx'?txTable(a):S.tab==='screen'?screenTab(a):traceTab(a))+'</section>';
}
function alertsView(){
  const open=ALERTS.filter(a=>a.status==='new'||a.status==='investigating').length,hi=ALERTS.filter(a=>(a.sev==='high'||a.sev==='critical')&&a.status!=='closed').length;
  const dr=ALERTS.filter(a=>a.status==='drafted').length,rd=ALERTS.filter(a=>a.status==='ready').length;
  const list=visible(),a=byId(S.sel)||list[0];
  return '<div class="strip"><div><b>'+open+'</b><span>Open alerts</span></div><div><b>'+hi+'</b><span>High or critical</span></div><div><b>'+dr+'</b><span>SMR drafts awaiting sign-off</span></div><div><b>'+rd+'</b><span>Ready to submit</span></div></div>'+
  '<div class="split"><section class="panel"><header><h2>Alert queue</h2><div class="filters"><select id="fk" aria-label="Typology">'+opts(Object.assign({all:'All typologies'},KIND),S.fk)+'</select><select id="fs" aria-label="Status">'+opts(Object.assign({all:'All statuses'},STATUS),S.fs)+'</select></div></header>'+
  '<div class="scroll"><table class="q"><thead><tr><th>Alert</th><th>Typology</th><th class="hm">Customer</th><th class="r hm">Flow (AUD)</th><th class="r">Score</th><th>Status</th></tr></thead><tbody>'+
  (list.length?list.map(x=>'<tr data-act="sel" data-id="'+x.id+'" class="'+(x.id===S.sel?'sel':'')+'"><td class="id">'+x.id+'<span class="sub">'+age(x.raised)+' old</span></td><td>'+KIND[x.kind]+'<span class="sub">'+sevPill(x.sev)+'</span></td><td class="hm">'+esc(x.cust.name)+'<span class="sub">'+x.cust.acct+'</span></td><td class="r num hm">'+X.stats(x).all.toLocaleString('en-AU')+'</td><td class="r num">'+x.score+'</td><td>'+stPill(x.status)+'</td></tr>').join(''):'<tr><td colspan="6" class="empty">No alerts match these filters.</td></tr>')+
  '</tbody></table></div></section>'+detail(a)+'</div>';
}
function netView(){
  const a=byId(S.sel),n=S.node&&a.nodes[S.node],s=X.stats(a);
  let side='<p class="muted" style="margin:0">Select a node to see its transactions and screening result. Line width shows the amount moved.</p>';
  if(n){
    const t=a.tx.filter(x=>x.from===S.node||x.to===S.node),ino=X.sum(t.filter(x=>x.to===S.node)),outo=X.sum(t.filter(x=>x.from===S.node)),sc=n.screen;
    side='<h3>'+esc(n.label)+'</h3><dl class="kv" style="margin:8px 0 12px"><dt>Type</dt><dd>'+n.type+'</dd><dt>Country</dt><dd>'+(CC[n.cc]||n.cc)+'</dd><dt>Received</dt><dd class="num">'+AUDf(ino)+'</dd><dt>Sent</dt><dd class="num">'+AUDf(outo)+'</dd><dt>Screening</dt><dd>'+(!sc?'Customer, KYC on file':sc.s==='clear'?'<span class="pill hit-clear">Clear</span>':'<span class="pill hit-'+sc.s+'">'+(sc.s==='pep'?'PEP candidate':'Sanctions candidate')+' · '+sc.score.toFixed(2)+'</span> '+esc(sc.detail))+'</dd></dl><div class="scroll"><table><tbody>'+t.map(x=>'<tr><td class="id">'+x.id+'</td><td class="num">'+AUDf(x.amt).replace('AUD ','')+'</td></tr>').join('')+'</tbody></table></div>';
  }
  return '<section class="panel"><header><div class="row"><h2>Network</h2><select id="netSel" aria-label="Alert">'+ALERTS.map(x=>'<option value="'+x.id+'"'+(x.id===S.sel?' selected':'')+'>'+x.id+' · '+KIND[x.kind]+'</option>').join('')+'</select></div><div class="row">'+sevPill(a.sev)+stPill(a.status)+'<button class="btn" data-act="open-alert" data-id="'+a.id+'">Open alert</button></div></header>'+
  '<div class="split" style="gap:0;grid-template-columns:minmax(0,2.2fr) minmax(240px,1fr)"><div><div class="graphbox">'+X.graphSVG(a,S.node)+'</div><div class="legend"><span><i style="background:var(--accent);border-color:var(--accent)"></i>Customer account</span><span><i style="background:var(--low-bg)"></i>Cash source</span><span><i style="border-color:var(--high)"></i>Shell or exchange</span><span><i style="border-color:var(--crit)"></i>Screening candidate</span></div></div><aside class="pad" style="border-left:1px solid var(--line)">'+side+'</aside></div></section>';
}
function smrView(){
  const el=ALERTS.filter(a=>a.status!=='closed'),a=byId(S.sel).status==='closed'?el[0]:byId(S.sel);
  S.sel=a.id;
  const rail='<div class="panel rail"><header><h3>Alerts</h3></header>'+el.map(x=>'<button data-act="smr-sel" data-id="'+x.id+'" class="'+(x.id===a.id?'on':'')+'"><span class="mono">'+x.id+'</span> '+stPill(x.status)+'<span class="sub">'+KIND[x.kind]+'</span></button>').join('')+'</div>';
  const d=S.drafts[a.id];let mid;
  if(S.smrBusy===a.id)mid='<div class="panel empty">Drafting narrative from ledger records…</div>';
  else if(!d)mid='<div class="panel empty"><p style="margin:0 0 12px">No SMR draft exists for <b>'+a.id+'</b> ('+KIND[a.kind]+').</p><button class="btn pri" data-act="draft" data-id="'+a.id+'">Draft SMR narrative</button></div>';
  else{
    const locked=a.status==='ready';
    mid='<section class="panel"><header><div><h2>Suspicious Matter Report, draft</h2><span class="mono muted">SMR-DRAFT-'+a.id.slice(3)+' · '+esc(a.cust.name)+'</span></div><div class="row">'+stPill(a.status)+'<span class="muted" id="citeCt"></span></div></header>'+
     SECS.map(s=>'<div class="sec"><label>'+s[1]+' <small>'+s[2]+(d.edited[s[0]]?' · edited by officer':'')+'</small></label><div class="ed" data-sec="'+s[0]+'" contenteditable="'+(locked?'false':'true')+'" role="textbox" aria-label="'+s[1]+'">'+d.sections[s[0]]+'</div></div>').join('')+'</section>';
  }
  let rrail='<section class="panel"><header><h3>Officer sign-off</h3></header><div class="pad">';
  if(!d)rrail+='<p class="muted" style="margin:0">Draft the narrative first. The agent writes the draft and cites ledger records. An officer reviews and signs off.</p>';
  else{
    const g=S.sign[a.id]||(S.sign[a.id]={name:'',c:[false,false,false]});
    if(a.status==='ready')rrail+='<div class="note" style="border-color:var(--ok)"><b>Signed off</b> by '+esc(g.name)+' at '+g.when+'.<br>Ready to submit. This prototype does not transmit reports to AUSTRAC.</div><div class="row" style="margin-top:12px"><button class="btn" data-act="unsign" data-id="'+a.id+'">Reopen for editing</button></div>';
    else rrail+=['Every claim has a ledger citation I have checked','Customer identity and owners are verified','I have edited the narrative where needed'].map((t,i)=>'<label class="chk"><input type="checkbox" data-chk="'+i+'"'+(g.c[i]?' checked':'')+'><span>'+t+'</span></label>').join('')+'<label for="officer" class="muted" style="display:block;margin:12px 0 4px">Officer name</label><input type="text" id="officer" style="width:100%" value="'+esc(g.name)+'" autocomplete="off"><div class="row" style="margin-top:12px"><button class="btn pri" id="signBtn" data-act="sign" data-id="'+a.id+'" disabled>Sign off</button></div><p class="muted" style="font-size:12px;margin:12px 0 0">AI drafts the narrative. A human officer decides. Reports are due to AUSTRAC within 3 business days of forming the suspicion, or 24 hours where terrorism financing is suspected.</p>';
  }
  return '<div class="desk">'+rail+mid+rrail+'</div></section></div>';
}
function rulesView(){
  const R=[['structuring','Cash deposits aggregated just under the AUD 10,000 threshold transaction reporting level.',[['Deposit band','AUD 8,500 to 9,950'],['Window','48 hours'],['Minimum','3 deposits']]],
   ['passthrough','An account receives several transfers and passes on almost all of the money within hours.',[['Outflow share','over 95%'],['Window','1 to 4 hours'],['Minimum','3 incoming senders']]],
   ['circular','Funds leave the account, pass through shell entities and return to the account or an affiliate.',[['Path length','3 to 5 hops'],['Detection','Neo4j cycle match'],['Return share','over 80%']]],
   ['fanout','One large deposit is scattered into many small transfers to unrelated people across jurisdictions.',[['Transfers','8 or more'],['Share dispersed','over 90%'],['Window','72 hours'],['Jurisdictions','3 or more']]],
   ['dormant','A dormant account suddenly sends a high-value wire.',[['Dormancy','180 days or more'],['Outbound wire','AUD 25,000 or more'],['Trigger','within 7 days of first credit']]]];
  const tier=(l,items)=>'<div class="tier"><b>'+l+'</b><div class="bx">'+items.map(i=>'<div>'+i[0]+'<small>'+i[1]+'</small></div>').join('')+'</div></div>';
  return '<div class="note">This is a front-end prototype. Rules run on synthetic data and agent steps are scripted. The structure below follows the platform design: rule-based ingestion feeds an agent dispatcher, and agents reach data through MCP servers.</div>'+
  '<div class="cards">'+R.map(r=>'<section class="panel"><header><h3>'+RULEID[r[0]]+' · '+KIND[r[0]]+'</h3><span class="pill st-investigating">'+ALERTS.filter(a=>a.kind===r[0]).length+' alerts</span></header><div class="pad"><p style="margin:0 0 10px">'+r[1]+'</p><dl class="kv mono" style="font-size:12.5px">'+r[2].map(p=>'<dt>'+p[0]+'</dt><dd>'+p[1]+'</dd>').join('')+'</dl></div></section>').join('')+'</div>'+
  '<section class="panel"><header><h2>Agents and data access</h2></header><div class="pad">'+tier('Frontend',[['Next.js 15','Alerts queue, graph visualiser, SMR studio']])+tier('Orchestration',[['Rule-based ingestion','Five typology rules'],['Agent dispatcher','REST and SSE to the frontend']])+tier('Agents',[['Triage','Haiku · alert scoring'],['Investigation','Sonnet · transaction review, Cypher'],['Adverse media','Haiku · entity extraction'],['SMR drafter','Sonnet · narrative with citations']])+tier('MCP tools',[['aml-postgres','Transactions and KYC'],['aml-neo4j','Graph topology'],['opensanctions-screening','Sanctions and PEP lists'],['adverse-media-search','Web search']])+'</div></section>';
}
function auditView(){
  let rows=S.audit.filter(e=>(S.af==='all'||e.alert===S.af)&&(S.ar==='all'||e.actor===S.ar)).sort((x,y)=>y.t-x.t);
  const actors=[...new Set(S.audit.map(e=>e.actor))];
  const json=JSON.stringify(rows.map(e=>({timestamp:fmtMs(e.t),actor:e.actor,tool:e.tool,event:e.event,alert:e.alert,detail:e.detail})),null,2);
  S.jsonText=json;
  return '<section class="panel"><header><div><h2>Audit log</h2><span class="muted">Agent actions, tool calls and officer decisions. Account numbers are masked.</span></div><div class="filters"><select id="af" aria-label="Alert"><option value="all">All alerts</option>'+ALERTS.map(a=>'<option value="'+a.id+'"'+(a.id===S.af?' selected':'')+'>'+a.id+'</option>').join('')+'</select><select id="ar" aria-label="Actor"><option value="all">All actors</option>'+actors.map(x=>'<option'+(x===S.ar?' selected':'')+'>'+x+'</option>').join('')+'</select><button class="btn" data-act="json">'+(S.json?'Show table':'Show JSON')+'</button><button class="btn" data-act="copyjson">Copy JSON</button></div></header>'+
  (S.json?'<div class="pad"><pre style="max-height:560px">'+esc(json)+'</pre></div>':'<div class="scroll"><table><thead><tr><th>Time</th><th>Actor</th><th>Event</th><th>Alert</th><th>Detail</th></tr></thead><tbody>'+rows.slice(0,80).map(e=>'<tr><td class="num" style="white-space:nowrap">'+fmtMs(e.t)+'</td><td>'+e.actor+(e.tool?'<span class="sub mono">'+e.tool+'</span>':'')+'</td><td>'+e.event+'</td><td class="id">'+e.alert+'</td><td>'+esc(e.detail)+'</td></tr>').join('')+'</tbody></table></div>')+'</section>';
}
X.views={alerts:alertsView,network:netView,smr:smrView,rules:rulesView,audit:auditView};
})();
