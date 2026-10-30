(function(){
'use strict';
const X=window.__AML,S=X.S,{ALERTS,byId,esc,dt,nowMs,fmtMs,ts}=X;
const $=(q,r)=>(r||document).querySelector(q);
const VIEWS=['alerts','network','smr','rules','audit'];

function log(actor,event,alert,detail,tool){S.audit.push({t:nowMs(),actor,event,alert,detail:detail||'',tool:tool||''})}
function makeDraft(a){
  const n=X.narr(a);return {sections:n,edited:{},at:nowMs()};
}
function countCites(d){return Object.values(d.sections).reduce((s,h)=>s+(h.match(/class="cite"/g)||[]).length,0)}
function toast(msg){const t=$('#toast');t.textContent=msg;t.hidden=false;clearTimeout(toast.h);toast.h=setTimeout(()=>{t.hidden=true},2200)}

/* seed audit log and the pre-drafted SMR */
ALERTS.forEach(a=>{X.trace(a).forEach(t=>S.audit.push({t:t.t,actor:t.actor,event:t.event,alert:a.id,detail:t.res,tool:t.tool}))});
S.drafts['AL-24119']=makeDraft(ALERTS.find(a=>a.id==='AL-24119'));
S.drafts['AL-24119'].at=ts('2026-10-30 19:05');
S.audit.push({t:ts('2026-10-30 19:05'),actor:'SMR drafter',event:'SMR draft generated',alert:'AL-24119',detail:countCites(S.drafts['AL-24119'])+' ledger citations',tool:''});
const c=ALERTS.find(a=>a.id==='AL-24122');
S.audit.push({t:ts('2026-10-27 11:40'),actor:'Compliance officer',event:'Alert closed',alert:'AL-24122',detail:c.closeReason,tool:''});

function updSign(){
  const b=$('#signBtn');if(!b)return;const g=S.sign[S.sel];
  b.disabled=!(g.c.every(Boolean)&&g.name.trim().length>=3);
}
function updCites(){const el=$('#citeCt');const d=S.drafts[S.sel];if(el&&d){el.textContent=countCites(d)+' citations'}}
function render(keepScroll){
  if(!VIEWS.includes(S.view))S.view='alerts';
  document.querySelectorAll('#nav a').forEach(a=>a.classList.toggle('on',a.dataset.v===S.view));
  $('#ctAlerts').textContent=ALERTS.filter(a=>a.status==='new'||a.status==='investigating').length;
  const y=window.scrollY;
  $('#app').innerHTML=X.views[S.view]();
  if(S.view==='smr'){updSign();updCites()}
  if(keepScroll)window.scrollTo(0,y);
}
function route(){
  const h=location.hash.replace('#','');
  S.view=VIEWS.includes(h)?h:'alerts';S.node=null;S.closing=false;render();
}
function go(v){if(location.hash==='#'+v)route();else location.hash=v}
function setStatus(a,st,actor,event,detail){a.status=st;log(actor,event,a.id,detail)}
function draft(id){
  const a=byId(id);
  S.sel=id;S.view='smr';
  if(location.hash!=='#smr'){history.replaceState(null,'','#smr')}
  S.smrBusy=id;render();
  setTimeout(()=>{
    S.drafts[id]=makeDraft(a);S.smrBusy=null;
    if(a.status==='new'||a.status==='investigating')setStatus(a,'drafted','SMR drafter','SMR draft generated',countCites(S.drafts[id])+' ledger citations');
    render();window.scrollTo(0,0);
  },900);
}
document.addEventListener('click',e=>{
  const el=e.target.closest('[data-act]');if(!el)return;
  const act=el.dataset.act,id=el.dataset.id,a=id&&byId(id);
  if(act==='sel'){S.sel=id;S.tab='tx';S.closing=false;render(true);
    if(window.innerWidth<1100){const d=$('#detail');if(d)d.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'})}}
  else if(act==='tab'){S.tab=id;render(true)}
  else if(act==='start'){setStatus(a,'investigating','Compliance officer','Investigation started','Alert assigned to the officer');render(true)}
  else if(act==='draft'){draft(id)}
  else if(act==='close-open'){S.closing=true;render(true)}
  else if(act==='close-cancel'){S.closing=false;render(true)}
  else if(act==='close-do'){const r=$('#closeReason').value;a.closeReason=r;S.closing=false;setStatus(a,'closed','Compliance officer','Alert closed',r);render(true);toast('Alert closed')}
  else if(act==='reopen'){a.closeReason='';setStatus(a,'investigating','Compliance officer','Alert reopened','');render(true)}
  else if(act==='go-smr'){S.sel=id;go('smr')}
  else if(act==='go-net'){S.sel=id;S.node=null;go('network')}
  else if(act==='open-alert'){S.sel=id;go('alerts')}
  else if(act==='smr-sel'){S.sel=id;render()}
  else if(act==='node'){S.node=S.node===id?null:id;render(true)}
  else if(act==='sign'){const g=S.sign[id];g.when=fmtMs(nowMs());a.status='ready';log('Compliance officer','SMR signed off',id,'Signed by '+g.name+' after review of '+countCites(S.drafts[id])+' citations');render(true);toast('Signed off, ready to submit')}
  else if(act==='unsign'){a.status='drafted';const g=S.sign[id];g.c=[false,false,false];log('Compliance officer','SMR reopened for editing',id,'');render(true)}
  else if(act==='json'){S.json=!S.json;render(true)}
  else if(act==='copyjson'){
    const txt=S.jsonText||'';
    if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(txt).then(()=>toast('Copied JSON')).catch(()=>{S.json=true;render(true);toast('Select the JSON to copy it')})}
    else{S.json=true;render(true);toast('Select the JSON to copy it')}
  }
});
document.addEventListener('keydown',e=>{
  if(e.key!=='Enter'&&e.key!==' ')return;
  const n=e.target.closest&&e.target.closest('g[data-act="node"]');
  if(n){e.preventDefault();S.node=S.node===n.dataset.id?null:n.dataset.id;render(true)}
});
document.addEventListener('change',e=>{
  const t=e.target;
  if(t.id==='fk'){S.fk=t.value;render(true)}
  else if(t.id==='fs'){S.fs=t.value;render(true)}
  else if(t.id==='netSel'){S.sel=t.value;S.node=null;render(true)}
  else if(t.id==='af'){S.af=t.value;render(true)}
  else if(t.id==='ar'){S.ar=t.value;render(true)}
  else if(t.dataset&&t.dataset.chk!==undefined){S.sign[S.sel].c[+t.dataset.chk]=t.checked;updSign()}
});
document.addEventListener('input',e=>{
  const t=e.target;
  if(t.id==='officer'){S.sign[S.sel].name=t.value;updSign()}
  const sec=t.closest&&t.closest('[data-sec]');
  if(sec){const d=S.drafts[S.sel];d.sections[sec.dataset.sec]=sec.innerHTML;d.edited[sec.dataset.sec]=true;updCites()}
});
window.addEventListener('hashchange',route);
route();
})();
