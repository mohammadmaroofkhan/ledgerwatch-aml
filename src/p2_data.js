(function(){
'use strict';
const MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const CC={AU:'Australia',HK:'Hong Kong',NZ:'New Zealand',PH:'Philippines',VN:'Vietnam',TH:'Thailand',ID:'Indonesia',VG:'British Virgin Islands',AE:'United Arab Emirates',MY:'Malaysia',CY:'Cyprus',EE:'Estonia',SC:'Seychelles'};
const KIND={structuring:'Structuring',passthrough:'Pass-through',circular:'Circular flow',fanout:'Fan-out',dormant:'Dormant revival'};
const RULEID={structuring:'TM-01',passthrough:'TM-02',circular:'TM-03',fanout:'TM-04',dormant:'TM-05'};
const STATUS={new:'New',investigating:'Investigating',drafted:'SMR draft',ready:'Ready to submit',closed:'Closed'};
const SEVL={critical:'Critical',high:'High',medium:'Medium',low:'Low'};
const AUDf=n=>'AUD '+Math.round(n).toLocaleString('en-AU');
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const p2=n=>String(n).padStart(2,'0');
const ts=s=>{const[d,t]=s.split(' ');const[y,m,da]=d.split('-').map(Number);const[h,mi]=(t||'00:00').split(':').map(Number);return Date.UTC(y,m-1,da,h,mi)};
const dt=s=>{const[d,t]=s.split(' ');const[,m,da]=d.split('-').map(Number);return da+' '+MON[m-1]+' '+t};
const dtl=s=>{const[d,t]=s.split(' ');const[y,m,da]=d.split('-').map(Number);return da+' '+MON[m-1]+' '+y+(t?', '+t+' AEDT':'')};
const BASE=ts('2026-10-31 04:38'),LOAD=Date.now();
const nowMs=()=>BASE+(Date.now()-LOAD);
const fmtMs=ms=>{const d=new Date(ms);return d.getUTCDate()+' '+MON[d.getUTCMonth()]+' '+p2(d.getUTCHours())+':'+p2(d.getUTCMinutes())+':'+p2(d.getUTCSeconds())};
const age=s=>{const h=Math.floor((BASE-ts(s))/36e5);return Math.floor(h/24)+'d '+(h%24)+'h'};
const T=(id,time,from,to,amt,inst)=>({id,time,from,to,amt,inst});

const A4names=[['Marisol Quintero-Vance','PH'],['Jun Bautista','PH'],['Anh Tuan Pham','VN'],['Kamol Siriwat','TH'],['Dewi Anggraini','ID'],['Ruben Castellan','AU'],['Priya Nair','AU'],['Hone Parata','NZ'],['Tui Wetere','NZ'],['Linh Tran','VN'],['Somchai Preecha','TH'],['Putri Lestari','ID'],['Mateo Ferreira','PH'],['Grace Adeyemi-Cole','AU']];
const A4amts=[18500,17200,16800,17900,15400,16100,18200,17600,15800,16900,17300,16400,15900,16300];
const A4times=['2026-10-24 09:10','2026-10-24 10:25','2026-10-24 12:40','2026-10-24 14:05','2026-10-24 16:30','2026-10-25 09:45','2026-10-25 11:10','2026-10-25 13:20','2026-10-25 15:55','2026-10-25 17:05','2026-10-26 09:30','2026-10-26 11:50','2026-10-26 14:15','2026-10-26 16:40'];
const A4nodes={c:{label:'Tomas Aldridge',type:'customer',cc:'AU'},src:{label:'Cobalt Estate Settlements',type:'company',cc:'AU',screen:{s:'clear'}}};
const A4tx=[T('TX-884501','2026-10-23 10:30','src','c',240000,'Domestic wire (RTGS)')];
A4names.forEach((n,i)=>{
  A4nodes['d'+i]={label:n[0],type:'person',cc:n[1],screen:i===0?{s:'pep',score:0.91,list:'politically exposed persons',detail:'regional councillor with the same name and birth year'}:{s:'clear'}};
  A4tx.push(T('TX-8845'+p2(i+2),A4times[i],'c','d'+i,A4amts[i],'International wire (outbound)'));
});

const ALERTS=[
{id:'AL-24119',kind:'circular',sev:'critical',score:96,status:'drafted',raised:'2026-10-30 18:20',
 cust:{key:'a',name:'Solstice Maritime Pty Ltd',acct:'****5590',type:'Company',since:'2017-06',occ:'Marine freight broker',ubo:'E. Varga (60%), T. Nakamura (40%)',risk:'High',baseline:'Prior 12 months: domestic freight receipts only, average monthly turnover AUD 310,000. No contracts on file for the payments referencing consulting fees and loan repayment.'},
 nodes:{a:{label:'Solstice Maritime Pty Ltd',type:'customer',cc:'AU'},b:{label:'Bellwether Consulting Ltd',type:'shell',cc:'VG',screen:{s:'clear'}},c:{label:'Oaken Quay Trading LLC',type:'shell',cc:'AE',screen:{s:'sanction',score:0.82,list:'consolidated sanctions list',detail:'name similarity to a listed trading entity, no matching address'}},d:{label:'Solstice Marine Services Sdn Bhd',type:'company',cc:'MY',screen:{s:'clear'}}},
 tx:[T('TX-884401','2026-10-20 10:05','a','b',480000,'International wire'),T('TX-884402','2026-10-21 09:40','b','c',468000,'International wire'),T('TX-884403','2026-10-22 11:15','c','d',455000,'International wire'),T('TX-884404','2026-10-23 14:30','d','a',450000,'Wire, loan repayment'),T('TX-884405','2026-10-27 10:20','a','b',210000,'International wire'),T('TX-884406','2026-10-28 09:55','b','c',203500,'International wire'),T('TX-884407','2026-10-29 10:40','c','d',198000,'International wire'),T('TX-884408','2026-10-30 09:15','d','a',195000,'Wire, loan repayment')],
 media:[{entity:'Oaken Quay Trading LLC',summary:'a corporate registry review lists two nominee directors who sit on more than 40 other thinly capitalised companies.',source:'Corporate registry review (synthetic)',date:'2026-06'}]},
{id:'AL-24117',kind:'structuring',sev:'high',score:92,status:'new',raised:'2026-10-29 07:42',
 cust:{key:'c',name:'Kestrel Auto Imports Pty Ltd',acct:'****3321',type:'Company',since:'2019-03',occ:'Used vehicle wholesaler',ubo:'R. Delacroix (80%), M. Lindqvist (20%)',risk:'Medium',baseline:'Prior 90 days: 3 cash deposits, average AUD 2,100.'},
 nodes:{c:{label:'Kestrel Auto Imports',type:'customer',cc:'AU'},b1:{label:'Cash · Parramatta',type:'cash',cc:'AU'},b2:{label:'Cash · Liverpool',type:'cash',cc:'AU'},b3:{label:'Cash · Blacktown',type:'cash',cc:'AU'},d:{label:'Tang Wei Logistics Ltd',type:'company',cc:'HK',screen:{s:'clear'}}},
 tx:[T('TX-884201','2026-10-26 09:12','b1','c',9400,'Cash deposit'),T('TX-884202','2026-10-26 11:48','b2','c',9850,'Cash deposit'),T('TX-884203','2026-10-26 15:20','b3','c',8900,'Cash deposit'),T('TX-884204','2026-10-27 09:05','b1','c',9700,'Cash deposit'),T('TX-884205','2026-10-27 12:31','b2','c',9250,'Cash deposit'),T('TX-884206','2026-10-27 16:02','b3','c',9950,'Cash deposit'),T('TX-884207','2026-10-28 08:44','b1','c',8700,'Cash deposit'),T('TX-884208','2026-10-28 14:10','c','d',64000,'International wire (SWIFT)')],media:[]},
{id:'AL-24120',kind:'fanout',sev:'high',score:88,status:'new',raised:'2026-10-27 09:05',
 cust:{key:'c',name:'Tomas Aldridge',acct:'****6104',type:'Individual',since:'2011-02',occ:'Retired schoolteacher, pension income',ubo:'Not applicable (individual)',risk:'Low',baseline:'Prior 12 months: average monthly turnover AUD 5,200. No international transfers and no new beneficiaries.'},
 nodes:A4nodes,tx:A4tx,media:[]},
{id:'AL-24121',kind:'dormant',sev:'high',score:84,status:'new',raised:'2026-10-29 10:30',dormantSince:'2026-03-27 16:40',
 cust:{key:'c',name:'Halloran and Beck Pty Ltd',acct:'****0918',type:'Company',since:'2014-09',occ:'Dormant professional services company',ubo:'A. Halloran (50%), S. Beck (50%)',risk:'Medium',baseline:'Account inactive since March 2026. Prior 12 months: payroll and rent only.'},
 nodes:{c:{label:'Halloran and Beck Pty Ltd',type:'customer',cc:'AU'},s:{label:'Meridian Pacific Capital Ltd',type:'company',cc:'CY',screen:{s:'clear'}},d:{label:'Zephyr Holdings FZE',type:'shell',cc:'AE',screen:{s:'clear'}}},
 tx:[T('TX-884601','2026-10-28 09:20','s','c',195000,'International wire (inbound)'),T('TX-884602','2026-10-29 10:05','c','d',190000,'International wire (outbound)')],
 media:[{entity:'Zephyr Holdings FZE',summary:'a 2025 trade finance article names the company among free-zone entities used to receive payments for goods that were never shipped.',source:'Trade finance press (synthetic)',date:'2025-11'}]},
{id:'AL-24118',kind:'passthrough',sev:'high',score:79,status:'investigating',raised:'2026-10-27 15:30',
 cust:{key:'c',name:'Nadia Okonkwo-Reyes',acct:'****7782',type:'Individual',since:'2026-08',occ:'Student, part-time hospitality',ubo:'Not applicable (individual)',risk:'Medium',baseline:'Account opened August 2026. Prior activity: wages of about AUD 600 per week.'},
 ip:'Online banking sessions on 27 Oct came from two VPN exit points in the Netherlands and Singapore, not the customer\'s usual Sydney device.',
 nodes:{c:{label:'Nadia Okonkwo-Reyes',type:'customer',cc:'AU'},s1:{label:'Liam Hartnett',type:'person',cc:'AU',screen:{s:'clear'}},s2:{label:'Chloe Wen',type:'person',cc:'AU',screen:{s:'clear'}},s3:{label:'Marcus Obi',type:'person',cc:'AU',screen:{s:'clear'}},s4:{label:'Sofia Marchetti',type:'person',cc:'AU',screen:{s:'clear'}},s5:{label:'Daniel Kerr',type:'person',cc:'AU',screen:{s:'clear'}},o1:{label:'Northgate Digital Exchange',type:'exchange',cc:'SC',screen:{s:'clear'}},o2:{label:'Ilya Brandt',type:'person',cc:'EE',screen:{s:'clear'}}},
 tx:[T('TX-884301','2026-10-27 13:05','s1','c',4800,'Osko transfer'),T('TX-884302','2026-10-27 13:22','s2','c',6200,'Osko transfer'),T('TX-884303','2026-10-27 13:48','s3','c',5500,'Osko transfer'),T('TX-884304','2026-10-27 14:02','s4','c',7100,'Osko transfer'),T('TX-884305','2026-10-27 14:20','s5','c',5900,'Osko transfer'),T('TX-884306','2026-10-27 15:10','c','o1',21000,'Crypto exchange purchase'),T('TX-884307','2026-10-27 16:55','c','o2',7700,'International wire')],media:[]},
{id:'AL-24123',kind:'passthrough',sev:'medium',score:68,status:'new',raised:'2026-10-28 18:10',
 cust:{key:'c',name:'Priya Venkataraman',acct:'****4410',type:'Individual',since:'2022-04',occ:'Online craft seller',ubo:'Not applicable (individual)',risk:'Low',baseline:'Typical monthly credits AUD 1,200 to 1,900 from marketplace payouts.'},
 nodes:{c:{label:'Priya Venkataraman',type:'customer',cc:'AU'},s1:{label:'Marketplace buyer A',type:'person',cc:'AU',screen:{s:'clear'}},s2:{label:'Marketplace buyer B',type:'person',cc:'AU',screen:{s:'clear'}},s3:{label:'Marketplace buyer C',type:'person',cc:'AU',screen:{s:'clear'}},o:{label:'Venkataraman Crafts Pty Ltd',type:'company',cc:'AU',screen:{s:'clear'}}},
 tx:[T('TX-884701','2026-10-28 10:05','s1','c',1850,'Osko transfer'),T('TX-884702','2026-10-28 10:40','s2','c',2200,'Osko transfer'),T('TX-884703','2026-10-28 11:15','s3','c',1640,'Osko transfer'),T('TX-884704','2026-10-28 13:30','c','o',5420,'Osko transfer')],media:[]},
{id:'AL-24124',kind:'dormant',sev:'medium',score:57,status:'new',raised:'2026-10-27 12:15',dormantSince:'2025-09-30 11:00',
 cust:{key:'c',name:'Gordon Fairweather',acct:'****1189',type:'Individual',since:'2003-05',occ:'Retired engineer',ubo:'Not applicable (individual)',risk:'Low',baseline:'Account inactive since September 2025. Previously a low-use savings account.'},
 nodes:{c:{label:'Gordon Fairweather',type:'customer',cc:'AU'},s:{label:'Harlow Estate Lawyers',type:'company',cc:'AU',screen:{s:'clear'}},d:{label:'G. Fairweather (other bank)',type:'person',cc:'AU',screen:{s:'clear'}}},
 tx:[T('TX-884801','2026-10-26 10:10','s','c',90000,'Domestic wire (inbound)'),T('TX-884802','2026-10-27 09:30','c','d',40000,'Domestic wire (outbound)')],media:[]},
{id:'AL-24122',kind:'structuring',sev:'low',score:41,status:'closed',raised:'2026-10-27 08:00',closeReason:'Consistent with customer baseline',
 cust:{key:'c',name:'Brightwater Cafe Pty Ltd',acct:'****2275',type:'Company',since:'2020-11',occ:'Cafe and catering',ubo:'J. Moretti (100%)',risk:'Low',baseline:'Prior 90 days: weekly cash deposits of AUD 8,000 to 9,500 after weekend trading.'},
 nodes:{c:{label:'Brightwater Cafe',type:'customer',cc:'AU'},b1:{label:'Cash · Chatswood',type:'cash',cc:'AU'}},
 tx:[T('TX-884901','2026-10-25 17:05','b1','c',8650,'Cash deposit'),T('TX-884902','2026-10-26 17:20','b1','c',9100,'Cash deposit'),T('TX-884903','2026-10-27 09:15','b1','c',8800,'Cash deposit')],media:[]}
];
const byId=id=>ALERTS.find(a=>a.id===id);
window.__AML={MON,CC,KIND,RULEID,STATUS,SEVL,AUDf,esc,p2,ts,dt,dtl,BASE,nowMs,fmtMs,age,ALERTS,byId};
})();
