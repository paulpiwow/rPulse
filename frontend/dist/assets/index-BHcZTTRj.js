(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))s(n);new MutationObserver(n=>{for(const i of n)if(i.type==="childList")for(const o of i.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&s(o)}).observe(document,{childList:!0,subtree:!0});function a(n){const i={};return n.integrity&&(i.integrity=n.integrity),n.referrerPolicy&&(i.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?i.credentials="include":n.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function s(n){if(n.ep)return;n.ep=!0;const i=a(n);fetch(n.href,i)}})();const{createApp:ga,computed:I,nextTick:Ye,onBeforeUnmount:va,onMounted:pe,reactive:Ee,ref:m,watch:ie}=window.Vue,{createRouter:fa,createWebHashHistory:ba,useRoute:ce,useRouter:ya}=window.VueRouter,we={props:["value","label"],template:`
    <span :class="['status-badge', normalized]">
      <span></span><template v-if="label !== ''">{{ label || displayLabel }}</template>
    </span>
  `,computed:{normalized(){return String(this.value||"unknown").toLowerCase()},displayLabel(){const e=String(this.value||"unknown");return e.charAt(0).toUpperCase()+e.slice(1)}}},wa={productName:"ρPulse",siteName:"Cadre Compressor Skid Demo",siteLocation:"Cadre Compressor Skid",userName:"Cody, Admin",version:"v1.0",company:"Rhobot Ai Solutions, Inc.",syncAge:"14s",status:"green"},Ta=[{label:"Operate",items:[{label:"Site Status",route:"site-status",icon:"status",status:"green"},{label:"Active Alarms",route:"active-alarms",icon:"alarm",count:5,status:"red"},{label:"Alarm History",route:"alarm-history",icon:"history"},{label:"Maintenance Warnings",route:"baseline-deviations",icon:"deviation",count:7,status:"yellow"}]},{label:"Configure",items:[{label:"Assets",route:"asset-inventory",icon:"asset"},{label:"Alarms",route:"alarm-list",icon:"bell"},{label:"Groups",route:"group-list",icon:"groups"}]},{label:"Admin",items:[{label:"Application",route:"license-management",icon:"application"},{label:"Users",route:"user-admin",icon:"user"},{label:"Messages",route:"message-center",icon:"message",count:2}]}],Ca={"dct-panel":"EMIT DCT Panel","adem-gateway":"Engine ECU Gateway","ple-telematics":"Product Link Telematics","cooler-vfd":"Cooler Fan VFD","vib-network":"Vibration Sensors"},Sa={"dct-panel":"EMIT DCT Panel","adem-gateway":"Engine ECU Gateway","ple-telematics":"Product Link Telematics","cooler-vfd":"Cooler Fan VFD","vib-network":"Vibration Sensor Network"},Na=new Date(Date.UTC(2026,5,17,17,25,24)),be=10080,Ne=Array.from({length:be},(e,t)=>new Date(Na.getTime()-(be-1-t)*6e4).toISOString()),Ce={"suct-press":"#1e3a8a","suct-temp":"#9a3412","stg1-dis-press":"#1d4ed8","final-dis-press":"#3b82f6","final-dis-temp":"#ea580c","comp-oil-press":"#075985","comp-oil-temp":"#b45309","scrub-level":"#166534","recycle-valve-pos":"#16a34a","fuel-press":"#0284c7","unit-run-state":"#475569","eng-rpm":"#6d28d9","eng-load":"#059669","eng-oil-press":"#60a5fa","eng-jw-temp":"#d97706","eng-batt-volt":"#0d9488","eng-hours":"#8b4513","cooler-fan-rpm":"#a855f7","vib-engine":"#be185d","vib-comp":"#ec4899"},Aa=[["suct-press","Suction Pressure","cooler-vfd","VFD","MODBUS TCP","1 Minute","float","PSI",0,300,58,51.50206728833905,"raw","EMIT DCT 'Suction Pressure' - holding register 42030"],["suct-temp","Suction Temp","dct-panel","PLC","MODBUS TCP","300 Hz","float","F",-20,150,74,-18.21641502231628,"feature_window","EMIT DCT 'Suction Temperature' - holding register 42044"],["stg1-dis-press","Stage 1 Discharge Press","dct-panel","PLC","MODBUS TCP","1 Hz","float","PSI",0,600,245,283.1641085885706,"feature_window","EMIT DCT 'Discharge 1 Pressure' - holding register 42038"],["final-dis-press","Final Discharge Press","dct-panel","PLC","MODBUS TCP","1 Hz","float","PSI",0,1500,1040,825.6456058025515,"feature_window","EMIT DCT 'Final Discharge Pressure' - holding register 42031"],["final-dis-temp","Final Discharge Temp","dct-panel","PLC","MODBUS TCP","1 Hz","float","F",0,350,262,248.79218924906667,"feature_window","EMIT DCT discharge temp block, final stage"],["comp-oil-press","Compressor Oil Press","dct-panel","PLC","MODBUS TCP","1 Hz","float","PSI",0,100,55,44.82564184114612,"feature_window","EMIT DCT 'Compressor Oil Pressure' - holding register 42032"],["comp-oil-temp","Compressor Oil Temp","dct-panel","PLC","MODBUS TCP","1 Hz","float","F",0,250,168,74.50672439424481,"feature_window","EMIT DCT 'Compressor Oil Temp' - holding register 42037"],["scrub-level","Scrubber Level","dct-panel","PLC","MODBUS TCP","1 Hz","float","%",0,100,18,21.818387873560305,"feature_window","Suction scrubber liquid level - DCT Brain analog input"],["recycle-valve-pos","Recycle Valve Position","dct-panel","PLC","MODBUS TCP","20 Hz","float","%",0,100,12,56.03207611580873,"raw","Recycle control valve position - DCT Brain analog input"],["fuel-press","Fuel Gas Pressure","dct-panel","PLC","MODBUS TCP","20 Hz","float","PSI",0,150,42,43.25722115153374,"raw","EMIT DCT 'Fuel Pressure' - holding register 42046"],["unit-run-state","Unit Run Status","dct-panel","PLC","MODBUS TCP","1 Hz","integer","state",0,5,2,2,"feature_window","EMIT Brain Run Status, compressed enum"],["eng-rpm","Engine Speed","adem-gateway","PLC","OPC UA","1 Hz","integer","RPM",0,1400,1180,1143,"feature_window","CAT ADEM 'Engine Speed' via ECU gateway"],["eng-load","Engine Load","adem-gateway","PLC","OPC UA","1 Hz","float","%",0,110,82,56.33603341574781,"feature_window","CAT ADEM 'Engine Pct Load' via ECU gateway"],["eng-oil-press","Engine Oil Pressure","adem-gateway","PLC","OPC UA","1 Hz","float","PSI",0,100,64,62.54817881880033,"feature_window","CAT ADEM 'Engine Oil Pressure' via ECU gateway"],["eng-jw-temp","Jacket Water Temp","adem-gateway","PLC","OPC UA","1 Hz","float","F",0,230,178,212.32450679267632,"feature_window","CAT ADEM 'Jacket Water Temp' via ECU gateway"],["eng-batt-volt","Battery Voltage","ple-telematics","Historian","MQTT","1 Hz","float","V",0,30,26.1,24.59566179086181,"feature_window","Battery Voltage via Product Link Elite"],["eng-hours","Engine Hours","ple-telematics","Historian","MQTT","1 Minute","integer","Min",0,6e5,154320,154336,"feature_window","Engine Hours Low/High counter via Product Link Elite"],["cooler-fan-rpm","Cooler Fan Speed","cooler-vfd","VFD","PROFINET","1 Hz","integer","RPM",0,900,610,158,"feature_window","Aerial cooler fan speed from the fan VFD"],["vib-engine","Engine Vibration","vib-network","Sensor","MODBUS TCP","1 Minute","float","IPS",0,2,.22,.860079185601187,"raw","Engine Vibration 1 Composite Level - register 43200"],["vib-comp","Compressor Vibration","vib-network","Sensor","MODBUS TCP","1 Minute","float","IPS",0,2,.31,.38070646186694845,"raw","Compressor Vibration 1 Composite Level - register 43203"]],xa=(e,t)=>/Pressure/i.test(e)?"Pressure":/Temp/i.test(e)?"Temperature":/Level/i.test(e)?"Level":/Valve/i.test(e)?"Position":/Run Status/i.test(e)?"State":/Speed|RPM/i.test(e)||t==="RPM"?"Speed":/Load/i.test(e)?"Load":/Voltage/i.test(e)?"Voltage":/Hours/i.test(e)?"Counter":/Vibration/i.test(e)?"Vibration":"Process Value",bt=e=>e.dataType==="integer"||e.unit==="RPM"||e.unit==="Min"||e.unit==="state"?0:e.unit==="IPS"||e.unit==="V"?2:1,Ia=(e,t,a)=>Math.min(Math.max(e,t),a),Qe=Aa.map(e=>{const[t,a,s,n,i,o,r,h,p,d,b,w,T,A]=e,E=xa(a,h);return{tagId:t,tagName:a,kind:"Tag",assetName:Sa[s]||"Cadre Compressor Skid",dataSource:Ca[s]||s,sourceId:s,sourceType:n,protocol:i,measurementType:E,unit:h,samplingRate:o,dataType:r,storageMode:T,minValue:p,maxValue:d,initialValue:b,latestValue:w,description:A,samplingClass:o==="300 Hz"||o==="20 Hz"?"High Frequency":"Standard",lastSync:"17:25",plot:!0,color:Ce[t]||"#2d8fff",trend:{base:b,latest:w,min:p,max:d,amplitude:Math.max((d-p)*(o==="300 Hz"?.18:.035),Math.abs(b)*.02,h==="IPS"?.04:.2),noise:Math.max((d-p)*(o==="300 Hz"?.07:.012),h==="IPS"?.02:.05),decimals:bt({dataType:r,unit:h})}}}),Xe=Object.fromEntries(Qe.map(e=>[e.tagId,e])),se=e=>Xe[e]?.tagName||e,ka=(e,t,a)=>{if(t===be-1)return Number(e.latestValue.toFixed(e.trend.decimals));if(e.unit==="state")return 2;const s=t/Math.max(1,be-1),n=Math.sin(Math.PI*2*t/1440+a*.33),i=Math.sin(Math.PI*2*t/83+a*.21),o=Math.floor(be*.955),r=t<o?0:(t-o)/Math.max(1,be-o-1),h=(e.latestValue-e.initialValue)*s,p=(e.latestValue-e.initialValue)*.35*r,d=e.initialValue+h+p+e.trend.amplitude*n+e.trend.noise*i;return Number(Ia(d,e.minValue,e.maxValue).toFixed(e.trend.decimals))},yt=Object.fromEntries(Qe.map((e,t)=>[e.tagId,Ne.map((a,s)=>ka(e,s,t))])),Te=e=>yt[e]?.[be-1]??0,Da=e=>Xe[e]?.unit||"",ge=(e,t=bt(Xe[e]||{}))=>`${Number(Te(e)).toFixed(t)} ${Da(e)}`.trim(),Me=(e,t=7,a=10)=>{const s=yt[e]||[];return Array.from({length:t},(n,i)=>s[s.length-1-(t-1-i)*a]??null)},Se=(e=7,t=10)=>Array.from({length:e},(a,s)=>{const n=Ne.length-1-(e-1-s)*t;return Ne[Math.max(0,n)]}),Ie=(e,t=7)=>Array.from({length:t},()=>e);Se(7,10);Se(7,5);const Ma=[{alarmEventId:"ALM-CAD-2401",assetName:"EMIT DCT Panel",location:"Compressor Skid",alarmName:"Final Discharge Temperature High",severity:"red",tripTime:"17:06",duration:"19 min",assignment:"Compressor Operations",acknowledgement:"Pending",tracking:"Open"},{alarmEventId:"ALM-CAD-2402",assetName:"Engine ECU Gateway",location:"Compressor Skid",alarmName:"Engine Vibration Near Danger",severity:"red",tripTime:"17:11",duration:"14 min",assignment:"Cadre Reliability",acknowledgement:"Pending",tracking:"Open"},{alarmEventId:"ALM-CAD-2403",assetName:"EMIT DCT Panel",location:"Compressor Skid",alarmName:"Suction Temperature Low",severity:"yellow",tripTime:"17:16",duration:"9 min",assignment:"Unassigned",acknowledgement:"Blocked",tracking:"Not Started"},{alarmEventId:"ALM-CAD-2404",assetName:"EMIT DCT Panel",location:"Compressor Skid",alarmName:"Final Discharge Pressure Below Load Curve",severity:"yellow",tripTime:"17:18",duration:"7 min",assignment:"Compressor Operations",acknowledgement:"Blocked",tracking:"Not Started"},{alarmEventId:"ALM-CAD-2405",assetName:"Engine ECU Gateway",location:"Compressor Skid",alarmName:"Jacket Water Temperature High",severity:"yellow",tripTime:"17:21",duration:"4 min",assignment:"Engine Reliability",acknowledgement:"Blocked",tracking:"Not Started"}];Te("final-dis-temp"),Te("vib-engine"),Te("suct-temp"),Te("final-dis-press"),Te("eng-jw-temp");[...Ma.map(e=>({...e,tripTime:`2026-06-17 ${e.tripTime}`,notificationTime:`2026-06-17 ${e.tripTime}`,acknowledgeTime:e.acknowledgement==="Pending"?"":"Blocked",responsibility:e.assignment,status:e.tracking}))];ge("final-dis-temp",1),ge("final-dis-press",1),ge("comp-oil-press",1),ge("eng-load",1),ge("vib-engine",2),ge("cooler-fan-rpm",0),ge("recycle-valve-pos",1);se("final-dis-temp"),se("final-dis-press"),se("comp-oil-press"),se("eng-load"),se("vib-engine"),se("cooler-fan-rpm");se("final-dis-temp"),Me("final-dis-temp"),Ce["final-dis-temp"],se("final-dis-press"),Me("final-dis-press"),Ce["final-dis-press"],se("eng-rpm"),Me("eng-rpm"),Ce["eng-rpm"],se("vib-engine"),Me("vib-engine"),Ce["vib-engine"];Me("final-dis-temp",7,5),Ce["final-dis-temp"],Ie(180),Ie(225),Ie(216.08),Ie(233.92),Ie(240);Se(7,240),Se(7,1440),Se(13,720),Se(8,1440);Ne[0],Ne[Ne.length-1],Qe.map(({tagId:e,tagName:t,dataSource:a,measurementType:s,unit:n,samplingRate:i,protocol:o,storageMode:r})=>({tagId:e,tagName:t,dataSource:a,measurementType:s,unit:n,samplingRate:i,protocol:o,storageMode:r}));const ue={shell:wa,navSections:Ta},$a="/api/v1";class He extends Error{constructor(t,a,s){super(t),this.name="ApiError",this.status=a,this.detail=s}}function W(e){return e instanceof He&&(e.status===502||e.status===503)}function wt(e){return e instanceof He&&e.status===404}async function Oe(e,t,{body:a,query:s}={}){let n=`${$a}${t}`;if(s){const o=new URLSearchParams;Object.entries(s).forEach(([h,p])=>{p!=null&&p!==""&&o.set(h,p)});const r=o.toString();r&&(n+=`?${r}`)}let i;try{i=await fetch(n,{method:e,headers:a!==void 0?{"Content-Type":"application/json"}:void 0,body:a!==void 0?JSON.stringify(a):void 0})}catch(o){throw new He(`Backend unreachable (${e} ${n})`,0,String(o))}if(!i.ok){let o="";try{const r=await i.text();try{const h=JSON.parse(r);o=h.detail||h.message||h.error||r}catch{o=r}}catch{}throw new He(o||`${e} ${n} failed (${i.status})`,i.status,o)}return i.status===204?null:i.json()}const f={get:(e,t)=>Oe("GET",e,{query:t}),post:(e,t,a)=>Oe("POST",e,{body:t,query:a}),put:(e,t)=>Oe("PUT",e,{body:t}),del:e=>Oe("DELETE",e)};function ye(e){if(!e)return"";const t=new Date(e);if(Number.isNaN(t.getTime()))return String(e);const a=s=>String(s).padStart(2,"0");return`${t.getFullYear()}-${a(t.getMonth()+1)}-${a(t.getDate())} ${a(t.getHours())}:${a(t.getMinutes())}`}function Ea(e){const t=ye(e);return t?t.slice(11):""}function Tt(e){if(e==null)return"";const t=Math.max(0,Math.round(e/60));return t<60?`${t} min`:`${Math.floor(t/60)} hr ${t%60} min`}function et(e){return{groupId:e.code,groupName:e.groupName,purpose:e.purpose,delivery:e.delivery,active:e.active?"Yes":"No",notes:e.notes,members:""}}async function Ae(){return(await f.get("/groups")).map(et)}function Ra(e){return f.post("/groups",e)}function La(e,t){return f.put(`/groups/${encodeURIComponent(e)}`,t)}function Ct(e){return{userId:e.code,userName:e.userName,email:e.email,phone:e.phone,role:e.role,status:e.active?"Active":"Disabled",notifications:e.notificationPrefs||"",emailNotifications:e.emailNotifications,smsNotifications:e.smsNotifications}}async function tt(){return(await f.get("/users")).map(Ct)}async function Pa(e){return Ct(await f.get(`/users/${encodeURIComponent(e)}`))}function Oa(e){return f.post("/users",e)}function Fa(e,t){return f.put(`/users/${encodeURIComponent(e)}`,t)}async function Ua(e){return(await f.get(`/users/${encodeURIComponent(e)}/groups`)).map(et)}async function Va(e,t){return(await f.put(`/users/${encodeURIComponent(e)}/groups`,t)).map(et)}function St(e){return{messageId:e.code,title:e.title,body:e.body,source:e.source,target:e.target||"",createdAt:ye(e.createdAt),status:e.status,acknowledgedAt:e.acknowledgedAt?ye(e.acknowledgedAt):""}}async function Nt(){return(await f.get("/messages")).map(St)}function Ba({title:e,body:t,source:a="MANUAL",target:s}){const n=`MSG-${crypto.randomUUID().slice(0,8).toUpperCase()}`;return f.post("/messages",{code:n,title:e,body:t,source:a,target:s,status:"Unread"})}async function Ha(e){return St(await f.post(`/messages/${encodeURIComponent(e)}/ack`))}function At(e){return{code:e.code,customerName:e.customerName,status:e.status,startDate:e.startDate,endDate:e.endDate,renewalStatus:e.renewalStatus||"",customerContact:e.customerContact||"",requestedTerm:e.requestedTerm||"",renewalNote:e.renewalNote||""}}async function Je(){try{return At(await f.get("/license"))}catch(e){if(wt(e))return null;throw e}}async function xt(e){return At(await f.put("/license",e))}const Wa={ACTIVE:"Open",ACKED:"Acknowledged",CLEARED:"Resolved"};async function It(){const e=await f.get("/site-status");return{siteName:e.siteName,assetCount:e.assetCount,activeAlarmCount:e.activeAlarmCount,maintenanceWarningCount:e.maintenanceWarningCount,assets:(e.assets||[]).map(t=>({assetId:t.assetCode,assetName:t.name,location:t.location,status:(t.status||"green").toLowerCase(),activeAlarms:t.activeAlarms||0,baselineDeviations:t.deviations||0})),trend:{duration:e.trend?e.trend.duration:"14_DAYS",points:e.trend?e.trend.points||[]:[]}}}function Ga(e,t=new Map){return{alarmEventId:e.historyCode,historyCode:e.historyCode,alarmCode:e.alarmCode,assetCode:e.assetCode,assetName:t.get(e.assetCode)||e.assetCode||"",location:"",alarmName:e.alarmName,severity:(e.severity||"yellow").toLowerCase(),tagKey:e.tagKey,currentValue:e.currentValue,thresholdValue:e.thresholdValue,operator:e.operator,tripTime:Ea(e.tripTime),tripTimestamp:e.tripTime,duration:Tt(e.durationSeconds),acknowledgement:e.status==="ACKED"?"Acknowledged":"Pending",tracking:e.status==="ACKED"?"Active":"Open",status:e.status}}async function xe(e){const t=e?`/alarms/active/${encodeURIComponent(e)}`:"/alarms/active",[a,s]=await Promise.all([f.get(t),f.get("/assets")]),n=new Map(s.map(o=>[o.code,o.assetName])),i=new Map(s.map(o=>[o.code,o.location]));return a.map(o=>{const r=Ga(o,n);return r.location=i.get(o.assetCode)||"",r})}function qa(e,t){return f.post(`/alarms/active/${encodeURIComponent(e)}/ack`,void 0,void 0)}function za(e,t){return f.post(`/alarms/active/${encodeURIComponent(e)}/clear`,void 0,void 0)}function kt(e,t=new Map){return{alarmEventId:e.code,assetName:t.get(e.assetId)||"",location:"",alarmName:e.alarmName,severity:(e.severity||"").toLowerCase(),tripTime:ye(e.tripTime),notificationTime:ye(e.notificationTime),acknowledgeTime:e.acknowledgeTime?ye(e.acknowledgeTime):"",clearTime:e.clearTime?ye(e.clearTime):"",duration:Tt(e.durationSeconds),responsibility:e.responsibility||"",status:Wa[e.status]||e.status||"",rawStatus:e.status,acknowledgedByUserId:e.acknowledgedByUserId,clearedByUserId:e.clearedByUserId}}async function Dt(){const e=await f.get("/assets");return{nameById:new Map(e.map(t=>[t.id,t.assetName])),locationById:new Map(e.map(t=>[t.id,t.location]))}}async function Mt({from:e,to:t,assetCode:a,page:s=0,size:n=50}={}){const[i,o]=await Promise.all([f.get("/alarms/history",{from:e,to:t,assetId:a,page:s,size:n}),Dt()]);return{rows:(i.content||[]).map(r=>{const h=kt(r,o.nameById);return h.location=o.locationById.get(r.assetId)||"",h}),page:i.page,size:i.size,totalElements:i.totalElements,totalPages:i.totalPages}}async function Ka(e){const[t,a]=await Promise.all([f.get(`/alarms/history/${encodeURIComponent(e)}`),Dt()]),s=kt(t,a.nameById);return s.location=a.locationById.get(t.assetId)||"",s}const ja={ABOVE:"Exceeds",BELOW:"Below"};async function at(){const[e,t,a,s]=await Promise.all([f.get("/maintenance-warnings"),f.get("/tags"),f.get("/ctags"),f.get("/assets")]),n=new Map(t.map(r=>[r.code,r])),i=new Map(a.map(r=>[r.code,r])),o=new Map(s.map(r=>[r.code,r]));return e.map(r=>{const h=r.scope==="CTag"?i.get(r.tagCode):n.get(r.tagCode),p=o.get(r.assetCode),d=h&&h.unit||"",b=(w,T=2)=>w==null?"":`${Number(w).toFixed(T)}${d?` ${d}`:""}`;return{deviationId:r.tagCode,tagCode:r.tagCode,tagName:h?h.tagName:r.tagCode,scope:r.scope,measurementType:h&&h.measurementType||"",machine:h&&h.datasource&&h.datasource.machine?h.datasource.machine.machineName:"",asset:p?p.assetName:r.assetCode,assetCode:r.assetCode,location:p?p.location:"",direction:ja[r.direction]||r.direction,baseline:b(r.baselineTarget),baselineLow:b(r.baselineLow),baselineHigh:b(r.baselineHigh),baselineStdDev:b(r.baselineStdDev),currentValue:b(r.currentValue),currentValueNumber:r.currentValue,unit:d,status:"yellow"}})}function _a(e,t){return f.post(`/maintenance-warnings/${encodeURIComponent(e)}/notify`,t?{groupCode:t}:void 0)}async function $t(e){const t=e?`/assets/${encodeURIComponent(e)}/alarms`:"/alarms";return f.get(t)}function Ya(e){return f.get(`/alarms/${encodeURIComponent(e)}`)}function Ja(e){return f.post("/alarms",e)}function Za(e,t){return f.put(`/alarms/${encodeURIComponent(e)}`,t)}const re=Ee({activeAlarms:[],maintenanceWarnings:[],unreadMessageCount:0,backendUp:!0,lastRefreshed:null});let ke=null;function me(){return ke||(ke=(async()=>{const[e,t,a]=await Promise.allSettled([xe(),at(),Nt()]);e.status==="fulfilled"&&(re.activeAlarms=e.value),t.status==="fulfilled"&&(re.maintenanceWarnings=t.value),a.status==="fulfilled"&&(re.unreadMessageCount=a.value.filter(s=>s.status==="Unread").length),re.backendUp=[e,t,a].some(s=>s.status==="fulfilled"),re.lastRefreshed=new Date})().finally(()=>{ke=null}),ke)}function Qa(e){return e?{siteCode:e.code,siteName:e.siteName,location:e.location,customerName:e.customerName,description:e.description}:null}function Et(e){return{assetId:e.code,assetName:e.assetName,location:e.location,assetType:e.assetType,assignedTo:e.assignedTo,enabled:e.enabled,baselineRequired:e.baselineRequired,description:e.description,siteCode:e.site?e.site.code:null,status:"green",activeAlarms:0,baselineDeviations:0,lastUpdate:""}}function Xa(e){return{dataSourceId:e.code,sourceName:e.sourceName,sourceType:e.sourceType,type:e.type,protocol:e.protocol,networkAddress:e.networkAddress,location:e.location,machineName:e.machine?e.machine.machineName:"",machineCode:e.machine?e.machine.code:null,status:"green"}}function es(e){return{tagId:e.code,tagName:e.tagName,tagKey:e.tagKey,kind:"Tag",dataSource:e.datasource?e.datasource.sourceName:"",dataSourceCode:e.datasource?e.datasource.code:null,sourceType:e.datasource?e.datasource.sourceType:"",measurementType:e.measurementType,unit:e.unit,dataType:e.dataType,samplingRate:e.samplingRate,storageMode:e.storageMode,minValue:e.minValue,maxValue:e.maxValue,initialValue:e.initialValue,plot:e.plot,color:e.color,description:e.description}}function ts(e){return{tagId:e.code,tagName:e.tagName,tagKey:e.ctagKey,kind:"CTag",assetName:e.asset?e.asset.assetName:"",assetCode:e.asset?e.asset.code:null,dataSource:"Computed",measurementType:e.measurementType,unit:e.unit,samplingRate:e.samplingRate,calculationType:e.calculationType,expression:e.expression,sourceTagIds:e.sourceTagIds?e.sourceTagIds.split(",").map(t=>t.trim()).filter(Boolean):[],plot:e.plot}}function st(e){const t=e.tag||e.ctag;return{baselineId:e.code,scope:e.scope,assetName:e.asset?e.asset.assetName:"",assetCode:e.asset?e.asset.code:null,tagId:t?t.code:"",tagName:t?t.tagName:"",measurementType:e.measurementType,unit:e.unit,baselineLow:e.baselineLow,baselineTarget:e.baselineTarget,baselineStdDev:e.baselineStdDev,baselineHigh:e.baselineHigh,evaluationWindow:e.evaluationWindow,warningDelay:e.warningDelay,enabled:e.enabled?"Yes":"No",owner:e.owner}}async function nt(){return(await f.get("/sites")).map(Qa)}async function Rt(){return(await f.get("/assets")).map(Et)}async function as(){const[e,t]=await Promise.all([f.get("/assets"),f.get("/site-status")]),a=new Map((t.assets||[]).map(s=>[s.assetCode,s]));return e.map(s=>{const n=Et(s),i=a.get(s.code);return i&&(n.status=(i.status||"green").toLowerCase(),n.activeAlarms=i.activeAlarms||0,n.baselineDeviations=i.deviations||0),n})}function ss(e){return f.get(`/assets/${encodeURIComponent(e)}`)}function ns(e){return f.post("/assets",e)}function is(e,t){return f.put(`/assets/${encodeURIComponent(e)}`,t)}function os(e,t){return f.post(`/assets/${encodeURIComponent(e)}/machines`,t)}function ls(e,t){return f.put(`/machines/${encodeURIComponent(e)}`,t)}async function rs(e){const t=e?`/machines/${encodeURIComponent(e)}/datasources`:"/datasources";return(await f.get(t)).map(Xa)}function cs(e,t){return f.post(`/machines/${encodeURIComponent(e)}/datasources`,t)}function ds(e,t){return f.put(`/datasources/${encodeURIComponent(e)}`,t)}async function us(e){return(await f.get(`/datasources/${encodeURIComponent(e)}/available-tags`)).map(a=>({tagId:a.tagKey,tagKey:a.tagKey,tagName:a.name,unit:a.unit}))}async function ms(e){return(await f.get("/tags")).map(es)}function ps(e,t){return f.post(`/datasources/${encodeURIComponent(e)}/tags`,t)}function hs(e,t){return f.put(`/tags/${encodeURIComponent(e)}`,t)}function gs(e){return f.del(`/tags/${encodeURIComponent(e)}`)}async function vs(e){return(await f.get("/ctags")).map(ts)}function fs(e,t){return f.post(`/assets/${encodeURIComponent(e)}/ctags`,t)}function bs(e,t){return f.put(`/ctags/${encodeURIComponent(e)}`,t)}async function Lt(){const[e,t]=await Promise.all([ms(),vs()]);return[...e,...t]}async function ys(e){const t=e?`/assets/${encodeURIComponent(e)}/baselines`:"/baselines";return(await f.get(t)).map(st)}function ws(e,t){return f.put(`/baselines/${encodeURIComponent(e)}`,t)}async function Ts(e,t,a){return(await f.post(`/assets/${encodeURIComponent(e)}/baselines/reestablish`,{windowStart:t,windowEnd:a})).map(st)}const $e=Ee({darkMode:new URLSearchParams(window.location.search).get("theme")==="dark"}),Cs={components:{StatusBadge:we},setup(){const e=m(new Date);me();const t=setInterval(()=>{e.value=new Date,me()},3e4),a=ce();ie(()=>a.fullPath,()=>me());const s=m(ue.shell.siteName),n=m(ue.shell.siteLocation);nt().then(o=>{const r=o&&o[0];r&&(r.siteName&&(s.value=r.siteName),r.location&&(n.value=r.location))}).catch(()=>{}),ie(()=>$e.darkMode,o=>{Ye(()=>{window.dispatchEvent(new CustomEvent("rpulse-theme-change",{detail:{darkMode:o}}))})},{immediate:!0}),va(()=>clearInterval(t));const i=I(()=>ue.navSections.map(o=>({...o,items:o.items.map(r=>r.route==="active-alarms"?{...r,count:re.activeAlarms.length,status:"red"}:r.route==="baseline-deviations"?{...r,count:re.maintenanceWarnings.length,status:"yellow"}:r.route==="message-center"?{...r,count:re.unreadMessageCount}:r)})));return{shell:ue.shell,siteName:s,siteLocation:n,store:re,navSections:i,now:e,themeState:$e}},computed:{isPublic(){return this.$route.meta.public},dateLabel(){return this.now.toLocaleDateString(void 0,{month:"short",day:"numeric",year:"numeric"})},timeLabel(){return this.now.toLocaleTimeString(void 0,{hour:"numeric",minute:"2-digit"})},syncStatus(){return this.store.backendUp?"green":"red"},syncLabel(){return this.store.lastRefreshed?`Synced ${Math.max(0,Math.round((this.now.getTime()-this.store.lastRefreshed.getTime())/1e3))}s`:"Sync pending"},breadcrumb(){return[this.$route.meta.title||""].filter(Boolean)},sectionHomeRoute(){const e=this.$route.meta.group;return e==="Configure"?"asset-inventory":e==="Admin"?"license-management":"site-status"},sectionLabel(){return this.$route.meta.group||"Operate"},currentTitle(){return this.$route.meta.title||"Operations Console"}},methods:{navIconPath(e){const t={status:"M4 11h4l2-5 4 10 2-5h4",alarm:"M10 5a4 4 0 0 1 8 0v4l2 4H8l2-4V5m3 12h4",history:"M12 8v5l4 2M4 12a8 8 0 1 0 2.3-5.7M4 4v5h5",deviation:"M4 17l5-5 3 3 6-8M4 20h16",asset:"M4 7h16v10H4zM7 7V4h10v3M7 17v3m10-3v3",bell:"M10 5a4 4 0 0 1 8 0v5l2 4H8l2-4V5m3 12h4",groups:"M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6m8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6M3 20a5 5 0 0 1 10 0m-2 0a5 5 0 0 1 10 0",application:"M4 5h16v14H4zM4 9h16M8 13h3m3 0h3M8 16h6",user:"M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M4 21a8 8 0 0 1 16 0",message:"M4 5h16v12H7l-3 3z"};return t[e]||t.application}},template:`
    <router-view v-if="isPublic"></router-view>
    <div v-else :class="['app-shell', { 'theme-dark': themeState.darkMode }]">
      <aside class="side-nav">
        <div class="brand-row">
          <img class="brand-logo" src="./src/assets/rpulse-logo.png" alt="rhoPulse" />
        </div>
        <nav>
          <section v-for="section in navSections" :key="section.label">
            <h2>{{ section.label }}</h2>
            <router-link v-for="item in section.items" :key="item.route" :to="{ name: item.route }" class="nav-link">
              <svg class="nav-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path :d="navIconPath(item.icon)" />
              </svg>
              <span>{{ item.label }}</span>
              <strong v-if="item.count" :class="['nav-count', item.status || 'red']">{{ item.count }}</strong>
            </router-link>
          </section>
        </nav>
        <div class="side-footer">
          <span>&copy; {{ shell.company }}</span>
          <span>{{ shell.version }} &rho; Pulse</span>
        </div>
      </aside>
      <div class="shell-main">
        <header class="top-bar">
          <div class="site-context">
            <span>{{ siteName }}</span>
            <span>-</span>
            <span>{{ siteLocation }}</span>
          </div>
          <div class="sync-center">
            <span :class="['status-dot', syncStatus]"></span>
            <span>{{ syncLabel }}</span>
          </div>
          <div class="top-meta">
            <span>{{ dateLabel }}</span>
            <span>{{ timeLabel }}</span>
            <span>{{ shell.userName }}</span>
          </div>
        </header>
        <main class="content-shell">
          <router-view></router-view>
        </main>
      </div>
    </div>
  `},Ss={template:`
    <main class="login-screen">
      <section class="login-panel">
        <div class="login-brand">
          <img class="login-logo" src="./src/assets/rpulse-logo.png" alt="rhoPulse" />
        </div>
        <div class="login-status-stack">
          <div class="login-status">
            <status-badge value="green" label="Site Status" />
            <span>{{ shell.siteName }}</span>
          </div>
          <div class="login-status">
            <status-badge :value="connected === false ? 'red' : 'green'" label="Application Connection Status" />
            <span>{{ connected === null ? 'Checking...' : connected ? 'Connected' : 'Disconnected' }}</span>
          </div>
        </div>
        <h1>Login</h1>
        <div class="field-stack">
          <label>
            <span>User</span>
            <input value="user" />
          </label>
          <label>
            <span>Password</span>
            <input type="password" value="password" />
          </label>
        </div>
        <button type="button" class="primary block" @click="$router.push({ name: 'site-status' })">Authenticate</button>
      </section>
    </main>
  `,components:{StatusBadge:we},data(){return{connected:null}},async created(){try{await nt(),this.connected=!0}catch{this.connected=!1}},setup(){return{shell:ue.shell}}},j={props:["title","subtitle","status","actions"],components:{StatusBadge:we},emits:["action"],setup(){return{themeState:$e}},computed:{visibleActions(){return this.actions||[]},crumbs(){const e=this.$route.name;return{"site-status":[{label:"Operate",route:"site-status"},{label:"Site Status"}],"active-alarms":[{label:"Operate",route:"site-status"},{label:"Active Alarms"}],"asset-alarm-detail":[{label:"Operate",route:"site-status"},{label:"Active Alarms",route:"active-alarms"},{label:"Asset Alarm Detail"}],"alarm-data-trends":[{label:"Operate",route:"site-status"},{label:"Active Alarms",route:"active-alarms"},{label:"Asset Alarm Detail",route:"asset-alarm-detail"},{label:"Alarm Data Trends"}],"alarm-history":[{label:"Operate",route:"site-status"},{label:"Alarm History"}],"alarm-history-detail":[{label:"Operate",route:"site-status"},{label:"Alarm History",route:"alarm-history"},{label:"Alarm History Detail"}],"baseline-deviations":[{label:"Operate",route:"site-status"},{label:"Maintenance Warnings"}],"data-deviation-trends":[{label:"Operate",route:"site-status"},{label:"Maintenance Warnings",route:"baseline-deviations"},{label:"Maintenance Warning Trend"}],"asset-inventory":[{label:"Configure",route:"asset-inventory"},{label:"Assets"}],"asset-configuration":[{label:"Configure",route:"asset-inventory"},{label:"Assets",route:"asset-inventory"},{label:"Asset Configuration"}],"connect-tags":[{label:"Configure",route:"asset-inventory"},{label:"Assets",route:"asset-inventory"},{label:"Asset Configuration",route:"asset-configuration"},{label:"Connect Tags"}],"alarm-list":[{label:"Configure",route:"asset-inventory"},{label:"Alarms"}],"alarm-configuration":[{label:"Configure",route:"asset-inventory"},{label:"Alarms",route:"alarm-list"},{label:"Alarm Configuration"}],"group-list":[{label:"Configure",route:"asset-inventory"},{label:"Groups"}],"group-configuration":[{label:"Configure",route:"asset-inventory"},{label:"Groups",route:"group-list"},{label:"Group Configuration"}],"license-management":[{label:"Admin",route:"license-management"},{label:"Application"}],"renewal-workflow":[{label:"Admin",route:"license-management"},{label:"Application",route:"license-management"},{label:"Renewal Workflow"}],"user-admin":[{label:"Admin",route:"license-management"},{label:"Users"}],"edit-user":[{label:"Admin",route:"license-management"},{label:"Users",route:"user-admin"},{label:"Edit User"}],"message-center":[{label:"Admin",route:"license-management"},{label:"Messages"}]}[e]||[]}},methods:{toggleDarkMode(){$e.darkMode=!$e.darkMode}},template:`
    <header class="screen-header">
      <div class="breadcrumb-row">
        <nav class="sub-breadcrumbs" aria-label="Screen breadcrumb">
          <template v-for="(crumb, index) in crumbs" :key="crumb.label">
            <router-link v-if="crumb.route" :to="{ name: crumb.route }">{{ crumb.label }}</router-link>
            <span v-else>{{ crumb.label }}</span>
            <i v-if="index < crumbs.length - 1">></i>
          </template>
        </nav>
        <button type="button" class="theme-toggle" :aria-pressed="themeState.darkMode" @click="toggleDarkMode">
          <span class="toggle-track" aria-hidden="true"><span class="toggle-thumb"></span></span>
          <span>Dark Mode</span>
        </button>
      </div>
      <div v-if="visibleActions.length" class="screen-actions">
        <button v-for="action in visibleActions" :key="action.key" type="button" :class="action.kind || 'secondary'" @click="$emit('action', action)">
          {{ action.label }}
        </button>
      </div>
    </header>
  `},Ns={components:{ScreenHeader:j,StatusBadge:we},data(){return{license:null,loaded:!1,form:{customerName:"",status:"Active",startDate:"",endDate:""},siteName:"",siteLocation:"",error:"",toast:"",saving:!1}},async created(){await this.loadLicense()},computed:{headerStatus(){return this.license?this.license.status==="Active"?"green":this.license.status==="Expired"?"red":"yellow":"yellow"}},methods:{async loadLicense(){try{const[e,t]=await Promise.all([Je(),nt()]);this.license=e,e&&(this.form={customerName:e.customerName||"",status:e.status||"Active",startDate:e.startDate||"",endDate:e.endDate||""});const a=t&&t[0];this.siteName=a&&a.siteName||"",this.siteLocation=a&&a.location||"",this.error=""}catch(e){this.error=W(e)?"Data source offline":e.message||"Failed to load license."}finally{this.loaded=!0}},async save(){if(!this.saving){this.saving=!0,this.toast="";try{await xt({code:this.license?.code||"LIC-001",customerName:this.form.customerName,status:this.form.status,startDate:this.form.startDate,endDate:this.form.endDate,renewalStatus:this.license?.renewalStatus||"Not Started",customerContact:this.license?.customerContact||"",requestedTerm:this.license?.requestedTerm||"",renewalNote:this.license?.renewalNote||""}),this.toast="License saved.",await this.loadLicense()}catch(e){this.error=W(e)?"Data source offline":e.message||"Save failed."}finally{this.saving=!1}}}},template:`
    <div class="screen">
      <screen-header
        title="Application"
        subtitle="License, customer, and site fields used by the application shell"
        :status="headerStatus"
      />
      <div v-if="error" class="inline-alert">{{ error }}</div>
      <div v-else-if="toast" class="inline-alert success">{{ toast }}</div>
      <div v-else-if="loaded && !license" class="inline-alert">
        No license on record. Fill in the fields below and save to create one.
      </div>
      <section class="panel">
        <div class="panel-header"><h2>License Management</h2></div>
        <div class="field-grid three">
          <label><span>Customer Name</span><input v-model="form.customerName" placeholder="Customer name" /></label>
          <label><span>Site Name</span><input :value="siteName" readonly /></label>
          <label><span>Site Location</span><input :value="siteLocation" readonly /></label>
          <label>
            <span>License Status</span>
            <select v-model="form.status">
              <option>Active</option>
              <option>Expired</option>
              <option>Renewal Pending</option>
            </select>
          </label>
          <label><span>Start Date</span><input v-model="form.startDate" placeholder="YYYY-MM-DD" /></label>
          <label><span>End Date</span><input v-model="form.endDate" placeholder="YYYY-MM-DD" /></label>
        </div>
      </section>
      <div class="table-command-row">
        <button type="button" class="secondary" :disabled="saving" @click="save">{{ saving ? 'Saving...' : 'Save' }}</button>
        <button type="button" class="primary" @click="$router.push({ name: 'renewal-workflow' })">Renew License</button>
      </div>
    </div>
  `},ae=e=>String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"),As=e=>{const a=String(e??"").trim().match(/^([+-]?(?:\d+(?:\.\d+)?|\.\d+))(?:\s*)(.*)$/);return a?{number:a[1],unit:a[2]||""}:{number:e,unit:""}},ne=(e,t)=>{const a=Number(e);if(!Number.isFinite(a))return String(e??"");const s=String(e??""),n=s.includes(".")?s.split(".")[1].length:0,i=Number.isInteger(t)?t:n;return(Object.is(a,-0)?0:a).toFixed(i)},Ze=(e,t={})=>{let a=String(e??"");if(t.type==="numeric"&&(a=ne(e,t.decimals)),t.type==="measurement"){const s=As(e),n=ne(s.number,t.decimals),i=t.unit||s.unit;a=i?`${n} ${i}`:n}return t.maxChars&&a.length>t.maxChars?{text:"*".repeat(Math.max(3,t.maxChars)),overflow:!0}:{text:a,overflow:!1}},ze=e=>String(e??"").trim().toLowerCase().replace(/[^a-z0-9]/g,"").replace(/^last/,"").replace(/hours?$/,"h").replace(/days?$/,"d"),it=e=>String(e||"rpulse-report").trim().toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,80)||"rpulse-report",xs={sortable:!0,filter:!1,resizable:!0},fe=e=>e.type==="numeric"||e.type==="measurement",Ke=e=>{if(fe(e)||e.type==="time"||e.type==="date"||e.type==="tabular")return!0;const t=`${e.headerName||""} ${e.field||""}`;return/(time|date|duration|update|created|occurred|check|sampling)/i.test(t)},Is=e=>{const t=String(e.headerName||""),a=Math.ceil(t.length*6.1+24);return Math.max(e.minWidth||0,Math.min(a,136))},Pt=e=>{const t=String(e||"").toLowerCase();return t==="green"||t==="yellow"||t==="red"?t:/(baseline|deviation|pending|warning|unread)/i.test(t)?"yellow":/(alarm|open|expired|fault|critical|high|blocked|not started)/i.test(t)?"red":/(normal|active|acknowledged|enabled|closed|ok|resolved|reviewed)/i.test(t)?"green":t||"unknown"},Q=e=>{const t=String(e.value||"");return`<span class="status-block ${Pt(t)}" title="${ae(t||"Unknown")}"></span>`},ks=e=>t=>{const a=Ze(t.value,e);return`<span class="${a.overflow?"overflow-warning":"numeric-display"}">${ae(a.text)}</span>`},X={props:{rows:{type:Array,default:()=>[]},columns:{type:Array,default:()=>[]},actions:{type:Array,default:()=>[]},height:{type:String,default:"360px"},compact:{type:Boolean,default:!1}},emits:["action","row-open"],template:`
    <div class="grid-wrap" :class="{ 'grid-wrap-auto': isAutoHeight, 'grid-wrap-compact': compact }" :style="gridWrapStyle">
      <div v-if="agReady" ref="gridEl" class="ag-theme-quartz rpulse-grid" :style="gridStyle"></div>
      <table v-else class="fallback-grid">
        <thead>
          <tr>
            <th v-for="col in columns" :key="col.field" :class="fallbackHeaderClass(col)" :title="col.headerName">{{ col.headerName }}</th>
            <th v-if="actions.length" class="actions-cell center-header">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="rowKey(row)" @dblclick="$emit('row-open', row)">
            <td v-for="col in columns" :key="col.field" :class="fallbackCellClass(col)" :title="cellText(row, col)">
              <span v-if="col.cellRenderer === statusRenderer" :class="['status-block', statusValue(row, col)]" :title="cellText(row, col)"></span>
              <span v-else :class="cellClass(col, row)">{{ cellText(row, col) }}</span>
            </td>
            <td v-if="actions.length" class="table-actions actions-cell">
              <button v-for="action in actions" :key="action.label" type="button" @click="$emit('action', { action, row })">
                {{ actionLabel(action) }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `,components:{StatusBadge:we},data(){return{agReady:!!window.agGrid,gridApi:null,statusRenderer:Q}},computed:{isAutoHeight(){return this.height==="auto"},gridWrapStyle(){return this.isAutoHeight?{}:{minHeight:this.height}},gridStyle(){return this.isAutoHeight?{}:{height:this.height}}},mounted(){this.mountGrid()},beforeUnmount(){this.gridApi&&this.gridApi.destroy&&this.gridApi.destroy()},watch:{rows:{handler(){this.refreshRows()},deep:!0},columns:{handler(){this.mountGrid()},deep:!0}},methods:{rowKey(e){return e.id||e.assetId||e.alarmEventId||e.tagId||e.groupId||e.userId||JSON.stringify(e)},makeColumns(){const e=this.columns.map(t=>{const a=this.isCenteredColumn(t),s=t.align==="left",n=/(note|description|tracking)/i.test(`${t.headerName||""} ${t.field||""}`);return{...xs,...t,minWidth:Is(t),headerClass:[t.headerClass,a?"center-header":""].filter(Boolean).join(" "),cellClass:[t.cellClass,a?"center-cell":"",s?"left-cell":"",t.cellRenderer===Q?"status-cell":"",fe(t)?"numeric-cell":Ke(t)?"tabular-cell":"",n?"wrap-cell":""].filter(Boolean).join(" "),cellRenderer:t.cellRenderer===Q?Q:fe(t)?ks(t):t.cellRenderer}});return this.actions.length&&e.push({headerName:"Actions",field:"__actions",width:this.actionColumnWidth(),minWidth:this.actionColumnWidth(),filter:!1,sortable:!1,resizable:!1,headerClass:"center-header",cellClass:"actions-cell center-cell",cellRenderer:()=>`<div class="ag-action-set">${this.actions.map((t,a)=>`<button class="grid-action" type="button" data-action-index="${a}">${ae(this.actionLabel(t))}</button>`).join("")}</div>`}),e},mountGrid(){if(!this.agReady||!this.$refs.gridEl)return;this.gridApi&&this.gridApi.destroy&&this.gridApi.destroy();const e={theme:"legacy",rowData:this.rows,columnDefs:this.makeColumns(),defaultColDef:{sortable:!0,filter:!1,resizable:!0,minWidth:this.compact?62:72,wrapHeaderText:!0,autoHeaderHeight:!1,suppressSizeToFit:!1,tooltipValueGetter:t=>t.valueFormatted??t.value},animateRows:!1,domLayout:this.isAutoHeight?"autoHeight":"normal",suppressColumnVirtualisation:!0,rowHeight:this.compact?32:34,headerHeight:34,suppressMenuHide:!1,suppressHorizontalScroll:!1,rowSelection:"single",onFirstDataRendered:()=>this.fitColumns(),onRowDoubleClicked:t=>this.$emit("row-open",t.data),onCellClicked:t=>{const a=t.event.target.closest("[data-action-index]");if(!a)return;const s=this.actions[Number(a.dataset.actionIndex)];this.$emit("action",{action:s,row:t.data})}};window.agGrid.createGrid?this.gridApi=window.agGrid.createGrid(this.$refs.gridEl,e):(new window.agGrid.Grid(this.$refs.gridEl,e),this.gridApi=e.api),this.gridApi?.resetColumnState&&this.gridApi.resetColumnState(),this.refreshRows()},fitColumns(){this.gridApi&&Ye(()=>{this.gridApi&&(this.gridApi.sizeColumnsToFit?this.gridApi.sizeColumnsToFit():this.gridApi.autoSizeAllColumns&&this.gridApi.autoSizeAllColumns(!1))})},actionLabel(e){const t=String(e?.label||"");return/>\s*$/.test(t)?t:`${t} >`},actionColumnWidth(){const e=this.actions.map(a=>Math.ceil(this.actionLabel(a).length*6.3+24)),t=Math.max(0,this.actions.length-1)*6;return Math.max(108,e.reduce((a,s)=>a+Math.max(58,s),20)+t)},refreshRows(){this.gridApi&&(this.gridApi.setGridOption?this.gridApi.setGridOption("rowData",this.rows):this.gridApi.setRowData&&this.gridApi.setRowData(this.rows),Ye(()=>{this.fitColumns()}))},cellClass(e,t){return fe(e)?Ze(t[e.field],e).overflow?"overflow-warning":"numeric-display":Ke(e)?"tabular-display":""},fallbackHeaderClass(e){return this.isCenteredColumn(e)?"center-header":""},fallbackCellClass(e){return[this.isCenteredColumn(e)?"center-cell":"",e.align==="left"?"left-cell":"",e.cellRenderer===Q?"status-cell":"",fe(e)?"numeric-cell":Ke(e)?"tabular-cell":"",/(note|description|tracking)/i.test(`${e.headerName||""} ${e.field||""}`)?"wrap-cell":""].filter(Boolean).join(" ")},cellText(e,t){return fe(t)?Ze(e[t.field],t).text:String(e[t.field]??"")},statusValue(e,t){return Pt(e[t.field])},isCenteredColumn(e){return e.align==="left"?!1:e.align==="center"||e.cellRenderer===Q||fe(e)}}},Ds={components:{ScreenHeader:j,GridTable:X},data(){return{rows:[],error:"",toast:""}},async created(){await this.loadRows()},template:`
    <div class="screen">
      <screen-header title="Message Center" subtitle="Unread messages and message history" />
      <div v-if="error" class="inline-alert">{{ error }}</div>
      <div v-else-if="toast" class="inline-alert success">{{ toast }}</div>
      <section class="panel">
        <div class="panel-header"><h2>Unread Message List and History</h2></div>
        <table-context
          title="Message rows"
          description="Unread and acknowledged alarm, license, and application messages."
          :items="[
            { label: 'Messages', value: rows.length },
            { label: 'Unread', value: unreadCount },
            { label: 'Action', value: 'Acknowledge' }
          ]"
        />
        <grid-table
          :rows="rows"
          :columns="columns"
          :actions="[{ label: 'Acknowledge', key: 'ack' }]"
          height="500px"
          @action="acknowledge"
        />
      </section>
    </div>
  `,computed:{unreadCount(){return this.rows.filter(e=>e.status==="Unread").length},columns(){return[{headerName:"Message ID",field:"messageId",width:130},{headerName:"Title",field:"title",flex:1.4},{headerName:"Target",field:"target",flex:1},{headerName:"Created",field:"createdAt",width:170},{headerName:"Status",field:"status",cellRenderer:Q,width:140}]}},methods:{async loadRows(){try{this.rows=await Nt(),this.error=""}catch(e){this.error=W(e)?"Data source offline":e.message||"Failed to load messages."}},async acknowledge({row:e}){if(e.status==="Unread")try{const t=await Ha(e.messageId),a=this.rows.findIndex(s=>s.messageId===e.messageId);a>=0&&(this.rows[a]={...this.rows[a],...t}),this.error="",this.toast=`Message ${e.messageId} acknowledged.`,me()}catch(t){this.toast="",this.error=W(t)?"Data source offline":t.message||"Acknowledge failed."}}}},Ms={components:{ScreenHeader:j,GridTable:X},data(){return{rows:[],error:"",columns:[{headerName:"User ID",field:"userId",width:120},{headerName:"User Name",field:"userName",flex:1},{headerName:"Email",field:"email",flex:1.4},{headerName:"Role",field:"role",flex:1.3},{headerName:"Status",field:"status",cellRenderer:Q,width:120},{headerName:"Notifications",field:"notifications",width:150}]}},async created(){await this.loadRows()},methods:{async loadRows(){try{this.rows=await tt(),this.error=""}catch(e){this.error=W(e)?"Data source offline":e.message||"Failed to load users."}},editUser({row:e}){this.$router.push({name:"edit-user",query:{user:e.userId}})}},template:`
    <div class="screen">
      <screen-header
        title="User Admin"
        subtitle="Users, authorities, contact methods, and notification preferences"
        :actions="[{ key: 'add', label: 'Add User', kind: 'primary' }]"
        @action="$router.push({ name: 'edit-user' })"
      />
      <div v-if="error" class="inline-alert">{{ error }}</div>
      <section class="panel">
        <div class="panel-header"><h2>Users and Authorities</h2></div>
        <table-context
          title="User rows"
          description="Accounts, roles, status, and notification preferences."
          :items="[
            { label: 'Users', value: rows.length },
            { label: 'Action', value: 'Edit user' }
          ]"
        />
        <grid-table
          :rows="rows"
          :columns="columns"
          :actions="[{ label: 'Edit User', key: 'edit' }]"
          height="500px"
          @action="editUser"
        />
      </section>
    </div>
  `},$s={components:{ScreenHeader:j},template:`
    <div class="screen">
      <screen-header
        title="Alarm Configuration"
        subtitle="Build alarm logic from configured asset Tags and CTags"
      />
      <div v-if="errorMessage" class="inline-alert">{{ errorMessage }}</div>
      <section class="panel alarm-config-panel">
        <div class="panel-header">
          <h2>Alarm Definition</h2>
        </div>
        <div class="field-grid three">
          <label>
            <span>Select Asset</span>
            <select v-model="selectedAssetCode">
              <option v-for="asset in assets" :key="asset.assetId" :value="asset.assetId">{{ asset.assetName }} ({{ asset.assetId }})</option>
            </select>
          </label>
          <label>
            <span>Alarm Name</span>
            <input v-model="alarmName" placeholder="Enter alarm name" />
          </label>
          <label>
            <span>Alarm Type</span>
            <select v-model="alarmType">
              <option>Threshold</option>
              <option>Rate of Change</option>
              <option>Combinatorial Logic</option>
            </select>
          </label>
          <label>
            <span>Alarm ID</span>
            <input :value="alarmCode" readonly />
          </label>
          <label>
            <span>Severity</span>
            <select v-model="severity">
              <option value="red">Red</option>
              <option value="yellow">Yellow</option>
            </select>
          </label>
          <label>
            <span>Enabled</span>
            <select v-model="enabledState">
              <option :value="true">Yes</option>
              <option :value="false">No</option>
            </select>
          </label>
        </div>
      </section>

      <section class="panel alarm-config-panel">
        <div class="panel-header">
          <h2>Formula Builder</h2>
        </div>
        <table-context
          title="Formula inputs"
          description="Fields used by the selected alarm type."
          :items="[
            { label: 'Alarm Type', value: alarmType },
            { label: 'Available Tags', value: assetTagOptions.length },
            { label: 'Alarm Name', value: alarmName }
          ]"
        />

        <table v-if="alarmType === 'Threshold'" class="editable-table alarm-formula-table">
          <thead>
            <tr>
              <th>If</th>
              <th>Tag / CTag Selection List for Asset</th>
              <th>Operator</th>
              <th>Input Value</th>
              <th>Then</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><input value="If" readonly /></td>
              <td>
                <select v-model="thresholdRule.tagId">
                  <option v-for="tag in assetTagOptions" :key="tag.value" :value="tag.value">{{ tag.label }}</option>
                </select>
              </td>
              <td>
                <select v-model="thresholdRule.operator">
                  <option>&gt;</option>
                  <option>&lt;</option>
                  <option>=</option>
                </select>
              </td>
              <td><input v-model="thresholdRule.value" class="numeric-input" inputmode="decimal" /></td>
              <td class="display-cell"><span class="table-display-field">Notify selected groups and users</span></td>
            </tr>
          </tbody>
        </table>

        <table v-else-if="alarmType === 'Rate of Change'" class="editable-table alarm-formula-table">
          <thead>
            <tr>
              <th>If</th>
              <th>Tag / CTag Selection List for Asset</th>
              <th>Condition</th>
              <th>Input Value</th>
              <th>Units</th>
              <th>Per</th>
              <th>Then</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><input value="If" readonly /></td>
              <td>
                <select v-model="rateRule.tagId">
                  <option v-for="tag in assetTagOptions" :key="tag.value" :value="tag.value">{{ tag.label }}</option>
                </select>
              </td>
              <td><input value="Rate of Change exceeds" readonly /></td>
              <td><input v-model="rateRule.value" class="numeric-input" inputmode="decimal" /></td>
              <td>
                <select v-model="rateRule.unit">
                  <option v-for="unit in rateUnits" :key="unit">{{ unit }}</option>
                </select>
              </td>
              <td>
                <select v-model="rateRule.period">
                  <option>second</option>
                  <option>minute</option>
                  <option>hour</option>
                  <option>day</option>
                </select>
              </td>
              <td class="display-cell"><span class="table-display-field">Notify selected groups and users</span></td>
            </tr>
          </tbody>
        </table>

        <div v-else class="combinatorial-builder">
          <div class="field-grid two">
            <label>
              <span>Tag / CTag Selector</span>
              <select v-model="logicSelectedTag">
                <option v-for="tag in assetTagOptions" :key="tag.value" :value="tag.value">{{ tag.label }}</option>
              </select>
            </label>
            <label>
              <span>Insert Selection</span>
              <button type="button" class="primary block" @click="insertLogicTag">Insert Tag / CTag</button>
            </label>
            <label>
              <span>Operator</span>
              <select v-model="logicSelectedOperator">
                <option v-for="operator in logicOperatorOptions" :key="operator.value" :value="operator.value">{{ operator.label }}</option>
              </select>
            </label>
            <label>
              <span>Insert Operator</span>
              <button type="button" class="primary block" @click="insertLogicOperator">Insert Operator</button>
            </label>
            <label class="wide">
              <span>Formula Writing Space</span>
              <textarea v-model="logicFormula" rows="6" placeholder="Example: ([Tag] > 39.50) AND ([CTag] = TRUE)"></textarea>
            </label>
          </div>
        </div>
      </section>

      <section class="panel alarm-config-panel">
        <div class="panel-header">
          <h2>Notify</h2>
        </div>
        <div class="notify-target-grid">
          <div>
            <h3>Groups</h3>
            <label v-for="group in groups" :key="group.groupId">
              <input type="checkbox" :value="group.groupId" v-model="selectedGroups" />
              <span>{{ group.groupName }}</span>
            </label>
          </div>
          <div>
            <h3>Users</h3>
            <label v-for="user in users" :key="user.userId">
              <input type="checkbox" :value="user.userId" v-model="selectedUsers" />
              <span>{{ user.userName }}</span>
            </label>
          </div>
        </div>
      </section>

      <div class="table-command-row">
        <button type="button" class="primary" :disabled="saving" @click="updateAlarm">{{ saving ? "Saving..." : isEditing ? "Update" : "Create Alarm" }}</button>
      </div>
      <div v-if="savedMessage" class="inline-alert success">{{ savedMessage }}</div>
    </div>
  `,setup(){const e=ce(),t=String(e.query.alarm||""),a=m(!!t),s=m([]),n=m([]),i=m([]),o=m(String(e.query.asset||"")),r=m(t),h=m(""),p=m("Threshold"),d=m("red"),b=m(!0),w=Ee({tagId:"",operator:">",value:""}),T=Ee({tagId:"",value:"5.00",unit:"%",period:"minute"}),A=m(""),E=m(">"),F=m(""),V=m([]),k=m([]),U=m(""),O=m(""),g=m(!1),R=m([]),$=[{label:"+",value:"+"},{label:"-",value:"-"},{label:"*",value:"*"},{label:"/",value:"/"},{label:">",value:">"},{label:"<",value:"<"},{label:">=",value:">="},{label:"<=",value:"<="},{label:"=",value:"="},{label:"!=",value:"!="},{label:"AND",value:"AND"},{label:"OR",value:"OR"},{label:"NOT",value:"NOT"},{label:"(",value:"("},{label:")",value:")"},{label:"Average",value:"Average()"},{label:"Sum",value:"Sum()"},{label:"Minimum",value:"Min()"},{label:"Maximum",value:"Max()"},{label:"Standard Deviation",value:"StandardDeviation()"},{label:"Rate Of Change",value:"RateOfChange()"},{label:"Absolute Value",value:"Abs()"}],y=u=>W(u)?"Data source offline":u.message,c=u=>{const x=u.reduce((_,Z)=>{const K=String(Z.code||"").match(/^ALR-(\d+)$/);return K?Math.max(_,Number(K[1])):_},0)+1;return`ALR-${String(x).padStart(3,"0")}`},C=async u=>{if(!u){R.value=[];return}const x=await ss(u),_=(x.machines||[]).flatMap(K=>(K.datasources||[]).flatMap(he=>(he.tags||[]).map(H=>({value:H.code,label:`${H.code} - ${H.tagName}`,unit:H.unit||"",kind:"TAG"})))),Z=(x.ctags||[]).map(K=>({value:K.code,label:`${K.code} - ${K.tagName}`,unit:"",kind:"CTAG"}));R.value=[..._,...Z]},L=I(()=>{const u=new Set(["%"]);return R.value.forEach(x=>{x.unit&&u.add(x.unit)}),T.unit&&u.add(T.unit),[...u]}),S=()=>{const u=R.value[0]?.value||"";R.value.some(x=>x.value===w.tagId)||(w.tagId=u),R.value.some(x=>x.value===T.tagId)||(T.tagId=u),R.value.some(x=>x.value===A.value)||(A.value=u)};ie(R,S),ie(o,async u=>{try{await C(u),O.value=""}catch(x){R.value=[],O.value=`Failed to load tags for ${u}: ${y(x)}`}}),ie(p,()=>{U.value=""});const M=u=>{r.value=u.code,o.value=u.assetCode||o.value,h.value=u.alarmName||"",p.value=u.alarmType||"Threshold",d.value=(u.severity||"red").toLowerCase(),b.value=u.enabled!==!1;const x=u.watchedTagCode||"";w.tagId=x,w.operator=u.operator||">",w.value=u.thresholdValue===null||u.thresholdValue===void 0?"":String(u.thresholdValue),T.tagId=x,T.value=u.rateValue===null||u.rateValue===void 0?"5.00":String(u.rateValue),T.unit=u.rateUnit||"%",T.period=u.ratePeriod||"minute",A.value=x,F.value=u.logicFormula||"",V.value=[...u.notifyGroupCodes||[]],k.value=[...u.notifyUserCodes||[]]};pe(async()=>{try{const[u,x,_,Z]=await Promise.all([Rt(),Ae(),tt(),$t()]);s.value=u,n.value=x,i.value=_,a.value?M(await Ya(t)):(r.value=c(Z),o.value||(o.value=u[0]?.assetId||"")),await C(o.value),a.value||S(),O.value=""}catch(u){O.value=`Failed to load alarm configuration: ${y(u)}`}});const B=()=>{if(!A.value)return;const u=`[${A.value}]`;F.value=F.value?`${F.value} ${u}`:u},G=()=>{E.value&&(F.value=F.value?`${F.value} ${E.value}`:E.value)},z=()=>p.value==="Threshold"?w.tagId:p.value==="Rate of Change"?T.tagId:A.value,Y=()=>{const u=z(),x=R.value.find(K=>K.value===u),_=p.value==="Threshold",Z=p.value==="Rate of Change";return{code:r.value,assetCode:o.value,alarmName:h.value.trim(),alarmType:p.value,enabled:b.value,severity:d.value,watchedTagCode:u,watchedKind:x?.kind||"TAG",operator:_?w.operator:null,thresholdValue:_&&w.value!==""?Number(w.value):null,rateValue:Z&&T.value!==""?Number(T.value):null,rateUnit:Z?T.unit:null,ratePeriod:Z?T.period:null,logicFormula:p.value==="Combinatorial Logic"?F.value:null,notifyGroupCodes:[...V.value],notifyUserCodes:[...k.value]}};return{assets:s,groups:n,users:i,isEditing:a,selectedAssetCode:o,alarmCode:r,alarmName:h,alarmType:p,severity:d,enabledState:b,thresholdRule:w,rateRule:T,logicSelectedTag:A,logicSelectedOperator:E,logicFormula:F,logicOperatorOptions:$,selectedGroups:V,selectedUsers:k,savedMessage:U,errorMessage:O,saving:g,assetTagOptions:R,rateUnits:L,insertLogicTag:B,insertLogicOperator:G,updateAlarm:async()=>{U.value="",O.value="";const u=Y();if(!u.alarmName){O.value="Alarm name is required.";return}if(!u.assetCode){O.value="Select an asset for the alarm.";return}if(!u.watchedTagCode){O.value="Select a Tag or CTag for the alarm to watch.";return}g.value=!0;try{a.value?await Za(r.value,u):(await Ja(u),a.value=!0),U.value=`${u.alarmType} alarm ${u.code} saved for ${u.assetCode}.`}catch(x){O.value=`Failed to save alarm: ${y(x)}`}finally{g.value=!1}}}}},Es={components:{ScreenHeader:j,GridTable:X},template:`
    <div class="screen">
      <screen-header
        title="Alarm List"
        :subtitle="assetCode ? 'Alarm rules for asset ' + assetCode : 'All configured alarm rules'"
      />
      <div class="table-command-row">
        <button type="button" class="primary" @click="addAlarm">Add Alarm ></button>
      </div>
      <div v-if="loadError" class="inline-alert">{{ loadError }}</div>
      <section class="panel">
        <div class="panel-header"><h2>Alarm List</h2></div>
        <table-context
          title="Configured alarm rows"
          description="Alarm rule definitions with notification targets and enablement."
          :items="[
            { label: 'Alarms', value: rows.length }
          ]"
        />
        <grid-table
          :rows="rows"
          :columns="columns"
          :actions="[{ label: 'Alarm Configuration', key: 'edit' }]"
          height="500px"
          @action="openAlarm"
        />
      </section>
    </div>
  `,setup(){const e=ce(),t=I(()=>String(e.query.asset||"")),a=m([]),s=m("");return pe(async()=>{try{const n=await $t(t.value||void 0);a.value=n.map(i=>({alarmEventId:i.code,alarmName:i.alarmName,assetName:i.assetCode,severity:(i.severity||"yellow").toLowerCase(),assignment:(i.notifyGroupCodes||[]).join(", "),tracking:i.enabled?"Enabled":"Disabled",assetCode:i.assetCode})),s.value=""}catch(n){s.value=W(n)?"Data source offline":`Failed to load alarm rules: ${n.message}`}}),{assetCode:t,rows:a,loadError:s,columns:[{headerName:"Alarm ID",field:"alarmEventId",width:130},{headerName:"Alarm Name",field:"alarmName",flex:1.4},{headerName:"Asset",field:"assetName",flex:1},{headerName:"Severity",field:"severity",cellRenderer:Q,width:92},{headerName:"Notify Groups",field:"assignment",width:150},{headerName:"Status",field:"tracking",width:120}]}},methods:{addAlarm(){const e=this.assetCode?{asset:this.assetCode}:{};this.$router.push({name:"alarm-configuration",query:e})},openAlarm({row:e}){this.$router.push({name:"alarm-configuration",query:{alarm:e.alarmEventId,asset:e.assetCode}})}}},Ot={props:{title:String,description:String,items:{type:Array,default:()=>[]}},template:`
    <div class="table-context" v-if="visibleItems.length">
      <dl v-if="visibleItems.length" class="table-context-meta">
        <div v-for="item in visibleItems" :key="item.label">
          <dt>{{ item.label }}</dt>
          <dd>{{ item.value }}</dd>
        </div>
      </dl>
    </div>
  `,computed:{visibleItems(){return this.items.filter(e=>e&&e.label&&e.value!==void 0&&e.value!==null&&e.value!=="")}}},Ft={props:["open","title","mode","row"],emits:["close","assigned","acknowledged","sent"],data(){return{assignee:"Operator",note:"",groupCode:"",groups:[],groupsLoaded:!1,loadError:""}},computed:{selectedGroup(){return this.groups.find(e=>e.groupId===this.groupCode)||null}},watch:{open(e){e&&this.mode==="notify"&&this.loadGroups()}},created(){this.open&&this.mode==="notify"&&this.loadGroups()},template:`
    <div v-if="open" class="modal-layer" role="dialog" aria-modal="true">
      <div class="modal">
        <header class="modal-header">
          <h2>{{ title }}</h2>
          <button type="button" class="icon-button" aria-label="Close" @click="$emit('close')">x</button>
        </header>
        <div v-if="mode === 'assign'" class="modal-body">
          <p class="modal-copy">Assignment is required before acknowledgement. Assign responsibility to yourself or another owner before acknowledging this alarm.</p>
          <div class="field-grid two">
            <label>
              <span>Alarm</span>
              <input :value="row?.alarmName || 'Selected alarm'" disabled />
            </label>
            <label>
              <span>Assign To</span>
              <input v-model="assignee" />
            </label>
            <label class="wide">
              <span>Assignment Note</span>
              <textarea v-model="note" rows="3" placeholder="Corrective responsibility before acknowledgement"></textarea>
            </label>
          </div>
          <div class="modal-actions">
            <button type="button" class="secondary" @click="$emit('close')">Cancel</button>
            <button type="button" class="primary" @click="$emit('assigned', { assignee, note })">Assign User</button>
          </div>
        </div>
        <div v-else-if="mode === 'notify'" class="modal-body">
          <p v-if="loadError" class="modal-copy">{{ loadError }}</p>
          <div class="field-grid two">
            <label>
              <span>Target Group</span>
              <select v-model="groupCode">
                <option v-for="item in groups" :key="item.groupId" :value="item.groupId">{{ item.groupName }}</option>
              </select>
            </label>
            <label>
              <span>Delivery</span>
              <input :value="selectedGroup?.delivery || 'Email and SMS where configured'" disabled />
            </label>
            <label class="wide">
              <span>Message</span>
              <textarea v-model="note" rows="3" placeholder="Add context for this notification"></textarea>
            </label>
          </div>
          <div class="modal-actions">
            <button type="button" class="secondary" @click="$emit('close')">Cancel</button>
            <button type="button" class="primary" :disabled="!selectedGroup" @click="sendNotification">Send Notification</button>
          </div>
        </div>
        <div v-else class="modal-body">
          <p class="modal-copy">The selected action completed. Tracking is now available for follow-up ownership.</p>
          <div class="modal-actions">
            <button type="button" class="primary" @click="$emit('acknowledged')">Open Tracking</button>
          </div>
        </div>
      </div>
    </div>
  `,methods:{async loadGroups(){if(!this.groupsLoaded){this.loadError="";try{this.groups=await Ae(),this.groupsLoaded=!0,!this.groupCode&&this.groups.length&&(this.groupCode=this.groups[0].groupId)}catch(e){this.loadError=W(e)?"Data source offline — live telemetry unavailable":`Unable to load notification groups: ${e.message}`}}},sendNotification(){this.selectedGroup&&this.$emit("sent",{group:this.selectedGroup.groupName,groupName:this.selectedGroup.groupName,groupCode:this.selectedGroup.groupId,note:this.note})}}},We={props:{title:String,times:{type:Array,default:()=>[]},series:{type:Array,default:()=>[]},selected:{type:Array,default:()=>[]},height:{type:String,default:"360px"},showLegend:{type:Boolean,default:!0},showSymbols:{type:Boolean,default:!1},smooth:{type:Boolean,default:!0},showDataZoom:{type:Boolean,default:!0},gridTop:{type:Number,default:58},gridBottom:{type:Number,default:36},yMin:{type:Number,default:null},yMax:{type:Number,default:null},yInterval:{type:Number,default:null}},template:`
    <div class="trend-surface" :style="{ height }">
      <div ref="chartEl" class="trend-chart"></div>
      <div v-if="chartNotice" class="trend-notice">{{ chartNotice }}</div>
    </div>
  `,data(){return{chart:null,chartNotice:""}},computed:{visibleSeries(){return this.selected.length?this.series.filter(e=>this.selected.includes(e.name)):this.series}},mounted(){this.mountChart(),window.addEventListener("resize",this.resize),window.addEventListener("rpulse-theme-change",this.renderChart)},beforeUnmount(){window.removeEventListener("resize",this.resize),window.removeEventListener("rpulse-theme-change",this.renderChart),this.chart&&this.chart.dispose()},watch:{title:"renderChart",selected:{handler:"renderChart",deep:!0},times:{handler:"renderChart",deep:!0},series:{handler:"renderChart",deep:!0},showLegend:"renderChart",showSymbols:"renderChart",smooth:"renderChart",showDataZoom:"renderChart"},methods:{mountChart(){if(!window.echarts){this.chartNotice="ECharts is required for chart display.";return}this.$refs.chartEl&&(this.chartNotice="",this.chart=window.echarts.init(this.$refs.chartEl),this.renderChart())},renderChart(){if(!this.chart)return;const e=getComputedStyle(this.$refs.chartEl),t=(N,u)=>e.getPropertyValue(N).trim()||u,a=t("--chart-bg","#ffffff"),s=t("--field-ink","#263246"),n=t("--chart-axis","#8e99ad"),i=t("--chart-axis-text",s),o=t("--chart-grid","rgba(38, 50, 70, .16)"),r=t("--chart-tooltip-bg","rgba(15, 23, 42, .92)"),h=t("--chart-tooltip-border","rgba(148, 163, 184, .35)"),p=t("--chart-tooltip-text","#f8fafc"),d=t("--chart-slider-bg","#f8fafc"),b=t("--chart-slider-border","#d7dce6"),w=t("--chart-slider-fill","rgba(11, 99, 229, .14)"),T=t("--chart-slider-handle","#ffffff"),A=t("--chart-slider-handle-border","#0b63e5"),E=this.visibleSeries,F=[...new Set(E.map(N=>N.unit||""))],V=F.length>1,k=this.times.map(N=>Date.parse(N)).filter(N=>Number.isFinite(N)),U=k.length>0,O=U&&k.length>1?k[k.length-1]-k[0]:0,g=O>=2880*60*1e3,R=new Map(E.map(N=>[N.name,N.unit||""])),$=new Intl.DateTimeFormat(void 0,{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"}),y=new Intl.DateTimeFormat(void 0,{hour:"numeric",minute:"2-digit"}),c=new Intl.DateTimeFormat(void 0,{hour:"numeric"}),C=new Intl.DateTimeFormat(void 0,{month:"short",day:"numeric",hour:"numeric"}),L=N=>{if(!U)return String(N??"");const u=new Date(N);return g?C.format(u).replace(", ",`
`):O>=720*60*1e3?c.format(u):y.format(u)},S=(N,u)=>{const x=Number(N);if(!Number.isFinite(x))return String(N??"");const _=u==="RPM"||u==="Min"||u==="state"?0:Math.abs(x)<10?2:1;return`${ne(x,_)}${u?` ${u}`:""}`},M=!!this.title,B=M?38:12,G=Math.max(this.gridTop,M&&this.showLegend?86:M?62:this.showLegend?54:28),z=this.showDataZoom?Math.max(this.gridBottom,g?88:72):this.gridBottom,Y=F.map((N,u)=>({type:"value",name:N,nameGap:12,nameTextStyle:{color:i,fontSize:10,fontWeight:600},position:V&&u>0?"right":"left",offset:V&&u>1?(u-1)*54:0,min:this.yMin??void 0,max:this.yMax??void 0,interval:this.yInterval??void 0,scale:this.yMin===null&&this.yMax===null,axisTick:{show:!1},axisLine:{lineStyle:{color:n}},splitLine:{show:u===0,lineStyle:{color:o,type:"dashed"}},axisLabel:{color:i}}));this.chart.setOption({animation:!1,backgroundColor:a,color:E.map(N=>N.color),textStyle:{fontFamily:"Inter, Segoe UI, Arial, sans-serif",color:s},title:{show:!!this.title,text:this.title,left:16,top:12,textStyle:{color:s,fontSize:14,fontWeight:600}},tooltip:{trigger:"axis",axisPointer:{type:"cross",lineStyle:{color:n,width:1,type:"dashed"}},backgroundColor:r,borderColor:h,textStyle:{color:p,fontSize:12},extraCssText:"box-shadow: 0 12px 30px rgba(15, 23, 42, .22);",formatter:N=>{const u=Array.isArray(N)?N:[N],x=u[0]?.axisValue??(Array.isArray(u[0]?.value)?u[0].value[0]:u[0]?.value),_=U&&Number.isFinite(Date.parse(x))?$.format(new Date(x)):String(x??""),Z=u.map(K=>{const he=Array.isArray(K.value)?K.value[1]:K.value,H=R.get(K.seriesName)||"";return`<div class="chart-tooltip-row">${K.marker}<span>${ae(K.seriesName)}</span><strong>${ae(S(he,H))}</strong></div>`}).join("");return`<div class="chart-tooltip-title">${ae(_)}</div>${Z}`}},legend:{show:this.showLegend,type:"scroll",top:B,left:16,right:16,height:28,itemWidth:18,itemHeight:9,pageIconSize:10,textStyle:{color:i,fontSize:11},pageTextStyle:{color:i,fontSize:10},selectedMode:"multiple"},grid:{left:58,right:V?78+Math.max(0,F.length-2)*54:24,top:G,bottom:z},xAxis:{type:U?"time":"category",data:U?void 0:this.times,min:U?k[0]:void 0,max:U?k[k.length-1]:void 0,splitNumber:U?g?5:7:void 0,minInterval:U?g?360*60*1e3:1800*1e3:void 0,boundaryGap:!1,axisTick:{show:!1},axisLine:{lineStyle:{color:n}},axisLabel:{color:i,fontSize:10,lineHeight:14,margin:10,hideOverlap:!0,formatter:U?L:void 0},splitLine:{show:!0,lineStyle:{color:o,type:"dashed"}}},yAxis:Y.length?Y:[{type:"value",scale:!0,axisTick:{show:!1},axisLine:{lineStyle:{color:n}},splitLine:{lineStyle:{color:o,type:"dashed"}},axisLabel:{color:i}}],dataZoom:this.showDataZoom?[{type:"inside",xAxisIndex:0,filterMode:"none",zoomOnMouseWheel:!0,moveOnMouseMove:!1,moveOnMouseWheel:!0,throttle:16},{type:"slider",xAxisIndex:0,filterMode:"none",bottom:14,height:28,showDetail:!1,borderColor:b,fillerColor:w,backgroundColor:d,dataBackground:{lineStyle:{color:n},areaStyle:{color:"rgba(148, 163, 184, .18)"}},selectedDataBackground:{areaStyle:{color:w}},handleStyle:{color:T,borderColor:A},moveHandleStyle:{color:A,opacity:.3}}]:[],series:E.map(N=>{const u=U?N.data.map((x,_)=>[this.times[_],x]):N.data;return{name:N.name,type:"line",yAxisIndex:Math.max(0,F.indexOf(N.unit||"")),smooth:N.baselineLine?!1:N.smooth??this.smooth,showSymbol:N.baselineLine?!1:N.showSymbol??this.showSymbols,symbol:N.baselineLine?"none":"circle",symbolSize:7,sampling:U?"lttb":void 0,data:u,lineStyle:{width:N.width??(N.baselineLine?2:2.2),type:N.lineType||"solid",opacity:N.opacity??1},itemStyle:{color:N.color},markLine:N.markLines?.length?{symbol:["none","none"],silent:!0,label:{color:i,fontSize:10,formatter:"{b}"},lineStyle:{color:n,width:1.4,type:"solid"},data:N.markLines.map(x=>({name:x.name,xAxis:x.xAxis,lineStyle:{color:x.color||n,type:x.lineType||"solid",width:x.width||1.4},label:{formatter:x.label||x.name,color:x.color||i}}))}:void 0,markArea:N.markAreas?.length?{silent:!0,label:{show:!1},itemStyle:{color:N.markAreaColor||"rgba(194, 65, 12, 0.12)"},data:N.markAreas.map(x=>[{name:x.name||"Out of Baseline",xAxis:x.start},{xAxis:x.end}])}:void 0}})},!0)},resize(){this.chart&&this.chart.resize()}}},Rs={props:{title:String,rows:{type:Array,default:()=>[]},columns:{type:Array,default:()=>[]},actions:{type:Array,default:()=>[]},toolbarLabel:String,toolbarValue:String,toolbarOptions:{type:Array,default:()=>[]},toolbarControls:{type:Array,default:()=>[]},toolbarActions:{type:Array,default:()=>[]},showUpdate:{type:Boolean,default:!0},contextTitle:String,contextDescription:String,contextItems:{type:Array,default:()=>[]}},emits:["update-table","cell-change","action","toolbar-change","toolbar-action"],components:{TableContext:Ot},template:`
    <section class="panel editable-table-panel">
      <div class="panel-header">
        <h2>{{ title }}</h2>
        <div class="editable-table-actions">
          <label v-for="control in toolbarControls" :key="control.key" class="editable-table-toolbar-field">
            <span>{{ control.label }}</span>
            <input
              v-if="control.type === 'datetime-local'"
              type="datetime-local"
              :value="control.value"
              :min="control.min"
              :max="control.max"
              @change="$emit('toolbar-change', { key: control.key, value: $event.target.value })"
            />
            <select v-else :value="control.value" @change="$emit('toolbar-change', { key: control.key, value: $event.target.value })">
              <option v-for="option in control.options || []" :key="option.value" :value="option.value">{{ option.label }}</option>
            </select>
          </label>
          <label v-if="toolbarOptions.length" class="editable-table-toolbar-field">
            <span>{{ toolbarLabel }}</span>
            <select :value="toolbarValue" @change="$emit('toolbar-change', $event.target.value)">
              <option v-for="option in toolbarOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
            </select>
          </label>
          <button v-for="action in toolbarActions" :key="action.key" type="button" class="primary" @click="$emit('toolbar-action', action)">
            {{ action.label }}
          </button>
          <button v-for="action in actions" :key="action.key" type="button" class="primary" @click="$emit('action', action)">
            {{ action.label }}
          </button>
          <button v-if="showUpdate" type="button" class="primary" @click="$emit('update-table')">Update</button>
        </div>
      </div>
      <table-context
        :title="contextTitle"
        :description="contextDescription"
        :items="contextItems"
      />
      <div class="editable-table-scroll">
        <table class="editable-table">
        <thead>
          <tr>
            <th v-for="column in columns" :key="column.field" :class="column.className" :style="columnStyle(column)" :title="column.headerName">{{ column.headerName }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, rowIndex) in rows" :key="row.__rowId || rowIndex">
            <td v-for="column in columns" :key="column.field" :class="column.className" :style="columnStyle(column)" :title="cellTitle(row, column)">
              <button
                v-if="column.type === 'button'"
                type="button"
                class="primary table-action-button"
                @click="$emit('action', { action: { key: column.actionKey, label: column.buttonLabel }, row, column })"
              >
                {{ column.buttonLabel }}
              </button>
              <select
                v-else-if="column.type === 'select'"
                v-model="row[column.field]"
                :aria-label="column.headerName"
                :disabled="column.readonly"
                @change="$emit('cell-change', { row, column })"
              >
                <option value=""></option>
                <option v-for="option in optionList(column, row)" :key="option.value" :value="option.value">{{ option.label }}</option>
              </select>
              <input
                v-else
                v-model="row[column.field]"
                :aria-label="column.headerName"
                :class="column.type === 'numeric' ? 'numeric-input' : 'text-input'"
                :inputmode="column.type === 'numeric' ? 'decimal' : undefined"
                :readonly="column.readonly"
                @change="$emit('cell-change', { row, column })"
              />
            </td>
          </tr>
          </tbody>
        </table>
      </div>
    </section>
  `,methods:{optionList(e,t){return typeof e.options=="function"?e.options(t,this.rows):e.options||[]},columnStyle(e){return{width:e.width||void 0,minWidth:e.minWidth||e.width||void 0}},cellTitle(e,t){return String(e[t.field]??t.buttonLabel??"")}}},Ls=`
    <div class="screen">
      <screen-header
        title="Asset Configuration"
        subtitle="Asset, Machines, Data Sources, Tags, and CTags"
      />
      <div v-if="errorToast" class="inline-alert">{{ errorToast }}</div>
      <div v-if="toast" class="inline-alert success">{{ toast }}</div>
      <div v-if="baselineToast" class="inline-alert success">{{ baselineToast }}</div>
      <div v-if="loading" class="inline-alert">Loading asset configuration...</div>
      <template v-else>
      <editable-table
        title="Asset"
        context-title="Current record"
        context-description="Asset row being edited. Update saves changes to the backend."
        :context-items="assetContextItems"
        :rows="assetRows"
        :columns="assetColumns"
        @update-table="saveAsset"
      />
      <editable-table
        title="Machines"
        context-title="Equipment rows"
        context-description="Machines and their data sources. Cell edits save immediately."
        :context-items="machineContextItems"
        :rows="machineRows"
        :columns="machineColumns"
        :actions="[{ key: 'add-machine', label: 'Add Machine' }]"
        :show-update="false"
        @action="handleMachineTableAction"
        @cell-change="handleMachineChange"
      />
      <editable-table
        title="Data Sources"
        context-title="Linked sources"
        context-description="Source rows for this asset's machines. Cell edits save immediately."
        :context-items="dataSourceContextItems"
        :rows="dataSourceRows"
        :columns="dataSourceColumns"
        :show-update="false"
        @cell-change="handleDatasourceChange"
      />
      <editable-table
        title="Tags"
        context-title="Tag connection scope"
        context-description="Machine/source rows used to connect source tags."
        :context-items="tagContextItems"
        :rows="tagRows"
        :columns="tagColumns"
        :show-update="false"
        @action="openTagConnector"
      />
      <editable-table
        title="CTags"
        context-title="Calculated tag scope"
        context-description="CTags built from connected source tags. Cell edits save immediately."
        :context-items="ctagContextItems"
        :rows="ctagRows"
        :columns="ctagColumns"
        :actions="[{ key: 'create-ctag', label: 'Create CTag' }]"
        :show-update="false"
        @action="openCtagBuilder"
        @cell-change="handleCtagChange"
      />
      <editable-table
        title="Baselines"
        context-title="Automated tag baselines"
        context-description="Choose a start and stop time, then Reestablish All recomputes low, high, mean, and standard deviation from history."
        :context-items="baselineContextItems"
        :rows="baselineRows"
        :columns="baselineColumns"
        :toolbar-controls="baselineDateTimeControls"
        :toolbar-actions="baselineToolbarActions"
        :show-update="false"
        @toolbar-change="handleBaselineRangeChange"
        @toolbar-action="handleBaselineToolbarAction"
        @cell-change="handleBaselineChange"
      />
      </template>
      <div v-if="ctagBuilderOpen" class="modal-layer" role="dialog" aria-modal="true">
        <div class="modal ctag-builder-modal">
          <header class="modal-header">
            <h2>Create CTag Calculation</h2>
            <button type="button" class="icon-button" aria-label="Close" @click="ctagBuilderOpen = false">x</button>
          </header>
          <div class="modal-body">
            <div class="field-grid two">
              <label>
                <span>CTag Name</span>
                <input v-model="ctagDraft.name" />
              </label>
              <label>
                <span>Asset Name</span>
                <input :value="selectedAssetName" readonly />
              </label>
              <label>
                <span>Calculation Type</span>
                <select v-model="ctagDraft.calculationType">
                  <option v-for="option in ctagCalculationOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
                </select>
              </label>
              <label class="wide">
                <span>Equation Builder</span>
                <div class="ctag-equation-builder">
                  <div v-for="(term, index) in ctagDraft.terms" :key="index" class="ctag-equation-row">
                    <span v-if="index === 0" class="ctag-equation-prefix">CTag =</span>
                    <select v-else v-model="term.operator" aria-label="Operator">
                      <option v-for="option in ctagOperatorOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
                    </select>
                    <select v-model="term.tagId" aria-label="Asset tag">
                      <option value=""></option>
                      <option v-for="option in ctagTagOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
                    </select>
                  </div>
                  <button type="button" class="secondary" @click="addCtagTerm">Add Term</button>
                </div>
              </label>
              <label class="wide">
                <span>Formula Preview</span>
                <input :value="ctagFormulaPreview" readonly />
              </label>
              <label>
                <span>Units</span>
                <input v-model="ctagDraft.unit" />
              </label>
              <label>
                <span>Sampling</span>
                <input v-model="ctagDraft.samplingRate" />
              </label>
            </div>
            <div class="modal-actions">
              <button type="button" class="secondary" @click="ctagBuilderOpen = false">Cancel</button>
              <button type="button" class="primary" @click="createCtagRule">Create CTag</button>
            </div>
          </div>
        </div>
      </div>
    </div>
`,Ps={components:{ScreenHeader:j,EditableTable:Rs},template:Ls,setup(){const e=ce(),t=ya(),a=(()=>{let l=0;return()=>`editable-${l++}`})(),s=l=>({__rowId:a(),...l}),n=(l,v)=>{const P=new Set(v.map(String));let q=v.reduce((te,D)=>{const J=String(D||"").match(new RegExp(`^${l}-(\\d+)$`));return J?Math.max(te,Number(J[1])):te},0)+1,ee=`${l}-${String(q).padStart(3,"0")}`;for(;P.has(ee);)q+=1,ee=`${l}-${String(q).padStart(3,"0")}`;return ee},i=m(""),o=m(""),r=m(!0),h=m(""),p=m(""),d=m(""),b=l=>W(l)?"Data source offline":l.message,w=(l,v)=>{p.value=`${l}: ${b(v)}`},T=l=>{h.value=l,p.value=""};let A=null;const E=new Map,F=new Map,V=new Map,k=new Map,U=m([]),O=m([]),g=m([]),R=m([]),$=m([]),y=m([]),c=m([]),C=l=>s(st(l)),L=async()=>{const l=await f.get(`/assets/${encodeURIComponent(i.value)}/baselines`);k.clear(),l.forEach(v=>k.set(v.code,v)),y.value=l.map(C)},S=async()=>{const l=await f.get(`/assets/${encodeURIComponent(i.value)}/ctags`);V.clear(),l.forEach(v=>V.set(v.code,v)),$.value=l.map(v=>s({ctagId:v.code,ctagName:v.tagName,assetName:v.asset?v.asset.assetName:o.value,sourceTagIds:v.sourceTagIds||"",calculationType:v.calculationType||"Algebraic",expression:v.expression||"",unit:v.unit||"",samplingRate:v.samplingRate||""}))},M=async()=>{const[l,v]=await Promise.all([f.get(`/assets/${encodeURIComponent(i.value)}/machines`),f.get("/tags")]);E.clear(),l.forEach(D=>E.set(D.code,D));const q=(await Promise.all(l.map(D=>f.get(`/machines/${encodeURIComponent(D.code)}/datasources`)))).flat();F.clear(),q.forEach(D=>F.set(D.code,D));const ee=new Set(q.map(D=>D.code));c.value=v.filter(D=>D.datasource&&ee.has(D.datasource.code));const te=new Map;c.value.forEach(D=>{const J=te.get(D.datasource.code)||[];J.push(D),te.set(D.datasource.code,J)}),O.value=l.map(D=>s({machineId:D.code,machineName:D.machineName||"",machineType:D.machineType||"",location:D.location||"",description:D.description||"",sourcesLabel:q.filter(J=>J.machine&&J.machine.code===D.code).map(J=>J.sourceName||J.code).join(", ")})),g.value=q.map(D=>s({dataSourceId:D.code,machineCode:D.machine?D.machine.code:"",machineName:D.machine?D.machine.machineName:"",sourceName:D.sourceName||"",sourceType:D.sourceType||"",location:D.location||"",networkAddress:D.networkAddress||""})),R.value=q.map(D=>s({machineCode:D.machine?D.machine.code:"",machineName:D.machine?D.machine.machineName:"",dataSourceId:D.code,sourceName:D.sourceName||"",connectedTagsLabel:(te.get(D.code)||[]).map(J=>`${J.code} - ${J.tagName}`).join(", ")}))},B=async()=>{r.value=!0;try{const l=await f.get("/assets"),v=String(e.query.asset||"");if(A=l.find(P=>P.code===v)||l[0]||null,!A){p.value="No assets are configured yet. Add an asset from the inventory screen.",r.value=!1;return}i.value=A.code,o.value=A.assetName||A.code,U.value=[s({assetId:A.code,assetName:A.assetName||"",location:A.location||"",description:A.description||""})],await Promise.all([M(),S(),L()]),p.value=""}catch(l){w("Failed to load asset configuration",l)}finally{r.value=!1}};pe(B),ie(()=>e.query.asset,(l,v)=>{e.name==="asset-configuration"&&l!==v&&B()});const G=async()=>{const l=U.value[0];if(!(!l||!A))try{A=await is(A.code,{...A,assetName:l.assetName,location:l.location,description:l.description}),o.value=A.assetName||A.code,T(`Saved asset ${A.code}.`)}catch(v){w(`Failed to save asset ${l.assetId}`,v)}},z=async()=>{try{const l=await f.get("/machines"),v=n("MCH",l.map(P=>P.code));await os(i.value,{code:v,machineName:`New Machine ${O.value.length+1}`,machineType:"",location:U.value[0]?.location||"",description:""}),await M(),T(`Added machine ${v}.`)}catch(l){w("Failed to add machine",l)}},Y=async({row:l})=>{const v=E.get(l.machineId);if(v)try{const P=await ls(l.machineId,{...v,machineName:l.machineName,machineType:l.machineType,location:l.location,description:l.description});E.set(P.code,P),T(`Saved machine ${l.machineId}.`)}catch(P){w(`Failed to save machine ${l.machineId}`,P)}},N=async l=>{try{const v=await f.get("/datasources"),P=n("DS",v.map(q=>q.code));await cs(l.machineId,{code:P,sourceName:`New Source ${P}`,sourceType:"",type:"PLC",protocol:"",networkAddress:"",location:l.location||""}),await M(),T(`Added data source ${P} to ${l.machineId}.`)}catch(v){w(`Failed to add data source to ${l.machineId}`,v)}},u=l=>{const v=l?.action||l;v?.key==="add-machine"&&z(),v?.key==="add-datasource"&&l?.row&&N(l.row)},x=async({row:l})=>{const v=F.get(l.dataSourceId);if(v)try{const P=await ds(l.dataSourceId,{...v,sourceName:l.sourceName,sourceType:l.sourceType,location:l.location,networkAddress:l.networkAddress});F.set(P.code,P),T(`Saved data source ${l.dataSourceId}.`)}catch(P){w(`Failed to save data source ${l.dataSourceId}`,P)}},_=({action:l,row:v})=>{l.key==="connect-tags"&&t.push({name:"connect-tags",query:{machine:v.machineCode,source:v.dataSourceId}})},Z=[{value:"Algebraic",label:"Algebraic"},{value:"Addition",label:"Addition"},{value:"Subtraction",label:"Subtraction"},{value:"Kurtosis",label:"Kurtosis"},{value:"Jitter",label:"Jitter"},{value:"Standard Deviation",label:"Standard Deviation"}],K=[{value:"+",label:"+"},{value:"-",label:"-"},{value:"*",label:"*"},{value:"/",label:"/"},{value:"^",label:"^"}],he=m(!1),H=Ee({name:"",calculationType:"Algebraic",terms:[],unit:"",samplingRate:"1Hz"}),Gt=I(()=>c.value.map(l=>({value:l.code,label:`${l.code} - ${l.tagName} (${l.datasource?.machine?.machineName||""} / ${l.datasource?.sourceName||""})`}))),qt=()=>{H.terms=[{tagId:"",operator:"+"},{tagId:"",operator:"+"},{tagId:"",operator:"+"}]},zt=()=>{H.terms.push({tagId:"",operator:"+"})},ct=()=>H.terms.map(l=>l.tagId).filter(Boolean),dt=()=>{const l=ct();return l.length?H.calculationType==="Addition"?l.join(" + "):H.calculationType==="Subtraction"?l.join(" - "):["Kurtosis","Jitter","Standard Deviation"].includes(H.calculationType)?`${H.calculationType.replace(/\s+/g,"")}(${l.join(", ")})`:H.terms.filter(v=>v.tagId).map((v,P)=>P===0?v.tagId:`${v.operator||"+"} ${v.tagId}`).join(" "):""},Kt=I(()=>`CTag = ${dt()||"[Tag] [Operator] [Tag]"}`),jt=l=>{(l?.action||l)?.key==="create-ctag"&&(H.name="",H.calculationType="Algebraic",qt(),H.unit="",H.samplingRate="1Hz",he.value=!0)},_t=async()=>{const l=[...new Set(ct())];if(!l.length){p.value="Select at least one source tag for the CTag.";return}try{const v=await f.get("/ctags"),P=n("CTAG",v.map(q=>q.code));await fs(i.value,{code:P,tagName:H.name||`CTag ${$.value.length+1}`,ctagKey:P,calculationType:H.calculationType,expression:dt(),sourceTagIds:l.join(","),unit:H.unit,samplingRate:H.samplingRate,plot:!0}),he.value=!1,await S(),T(`Created CTag ${P}.`)}catch(v){w("Failed to create CTag",v)}},Yt=async({row:l})=>{const v=V.get(l.ctagId);if(v)try{const P=await bs(l.ctagId,{...v,tagName:l.ctagName,calculationType:l.calculationType,expression:l.expression,unit:l.unit,samplingRate:l.samplingRate});V.set(P.code,P),T(`Saved CTag ${l.ctagId}.`)}catch(P){w(`Failed to save CTag ${l.ctagId}`,P)}},Jt=[{value:"Yes",label:"Yes"},{value:"No",label:"No"}],Re=l=>String(l).padStart(2,"0"),ut=l=>`${l.getFullYear()}-${Re(l.getMonth()+1)}-${Re(l.getDate())}T${Re(l.getHours())}:${Re(l.getMinutes())}`,oe=m(ut(new Date(Date.now()-1440*6e4))),le=m(ut(new Date)),Zt=I(()=>[{key:"start",label:"Start",type:"datetime-local",value:oe.value,max:le.value},{key:"stop",label:"Stop",type:"datetime-local",value:le.value,min:oe.value}]),Qt=[{key:"reestablish-asset-baselines",label:"Reestablish All"}],Le=l=>String(l||"").replace("T"," "),Xt=()=>`${Le(oe.value)} to ${Le(le.value)}`,ea=({key:l,value:v})=>{l==="start"&&v&&(oe.value=v),l==="stop"&&v&&(le.value=v),oe.value>le.value&&(l==="start"?le.value=oe.value:oe.value=le.value)},Pe=m(!1),ta=async l=>{if(l?.key!=="reestablish-asset-baselines"||Pe.value)return;const v=new Date(oe.value),P=new Date(le.value);if(Number.isNaN(v.getTime())||Number.isNaN(P.getTime())){d.value="",p.value="Choose a valid start and stop time before reestablishing baselines.";return}Pe.value=!0,d.value="";try{const q=await Ts(i.value,v.toISOString(),P.toISOString());y.value=q.map(te=>s(te));const ee=await f.get(`/assets/${encodeURIComponent(i.value)}/baselines`);k.clear(),ee.forEach(te=>k.set(te.code,te)),p.value="",d.value=`Reestablished ${q.length} baseline${q.length===1?"":"s"} from ${Xt()}.`}catch(q){w("Failed to reestablish baselines",q)}finally{Pe.value=!1}},aa=async({row:l,column:v})=>{if(v?.field!=="enabled")return;const P=k.get(l.baselineId);if(!P)return;const q=String(l.enabled).toLowerCase()!=="no";l.enabled=q?"Yes":"No";try{const ee=await ws(l.baselineId,{...P,enabled:q});k.set(ee.code,ee),T(`Baseline ${l.baselineId} ${q?"enabled":"disabled"}.`)}catch(ee){l.enabled=P.enabled?"Yes":"No",w(`Failed to update baseline ${l.baselineId}`,ee)}},sa=[{headerName:"Asset ID",field:"assetId",readonly:!0,width:"118px"},{headerName:"Asset Name",field:"assetName",minWidth:"220px"},{headerName:"Location",field:"location",minWidth:"190px"},{headerName:"Description",field:"description",minWidth:"340px"}],na=[{headerName:"Machine ID",field:"machineId",readonly:!0,width:"118px"},{headerName:"Machine Name",field:"machineName",minWidth:"180px"},{headerName:"Type",field:"machineType",minWidth:"130px"},{headerName:"Location",field:"location",minWidth:"160px"},{headerName:"Description",field:"description",minWidth:"220px"},{headerName:"Data Sources",field:"sourcesLabel",readonly:!0,minWidth:"180px"},{headerName:"Actions",field:"actions",type:"button",buttonLabel:"Add Data Source",actionKey:"add-datasource"}],ia=[{headerName:"Source ID",field:"dataSourceId",readonly:!0,width:"110px"},{headerName:"Machine Name",field:"machineName",readonly:!0,minWidth:"160px"},{headerName:"Data Source Name",field:"sourceName",minWidth:"190px"},{headerName:"Type",field:"sourceType",minWidth:"130px"},{headerName:"Location",field:"location",minWidth:"160px"},{headerName:"Network Address",field:"networkAddress",minWidth:"170px"}],oa=[{headerName:"Machine Name",field:"machineName",readonly:!0,minWidth:"160px"},{headerName:"Data Source",field:"sourceName",readonly:!0,minWidth:"170px"},{headerName:"Connected Tags",field:"connectedTagsLabel",readonly:!0,minWidth:"320px"},{headerName:"Actions",field:"actions",type:"button",buttonLabel:"Connect Tags",actionKey:"connect-tags"}],la=[{headerName:"CTag ID",field:"ctagId",readonly:!0,width:"150px"},{headerName:"CTag Name",field:"ctagName",minWidth:"190px"},{headerName:"Asset Name",field:"assetName",readonly:!0,minWidth:"200px"},{headerName:"Source Tags",field:"sourceTagIds",readonly:!0,minWidth:"230px"},{headerName:"Calculation Type",field:"calculationType",minWidth:"150px"},{headerName:"Expression",field:"expression",minWidth:"320px",className:"expression-column"},{headerName:"Units",field:"unit",width:"84px"},{headerName:"Sampling",field:"samplingRate",width:"104px"}],ra=[{headerName:"Baseline ID",field:"baselineId",readonly:!0,minWidth:"140px"},{headerName:"Tag Name",field:"tagName",readonly:!0,minWidth:"200px"},{headerName:"Scope",field:"scope",readonly:!0,width:"88px"},{headerName:"Low",field:"baselineLow",type:"numeric",readonly:!0,width:"92px"},{headerName:"High",field:"baselineHigh",type:"numeric",readonly:!0,width:"94px"},{headerName:"Mean",field:"baselineTarget",type:"numeric",readonly:!0,width:"96px"},{headerName:"Std Dev",field:"baselineStdDev",type:"numeric",readonly:!0,width:"96px"},{headerName:"Enabled",field:"enabled",type:"select",options:Jt,width:"104px"}],ca=I(()=>[{label:"Asset",value:o.value},{label:"Asset ID",value:i.value}]),da=I(()=>[{label:"Machines",value:O.value.length},{label:"Data Sources",value:g.value.length}]),ua=I(()=>[{label:"Sources",value:g.value.length},{label:"Machines",value:O.value.length}]),ma=I(()=>[{label:"Source Rows",value:R.value.length},{label:"Connected Tags",value:c.value.length}]),pa=I(()=>[{label:"CTags",value:$.value.length},{label:"Source Tags",value:c.value.length}]),ha=I(()=>[{label:"Baselines",value:y.value.length},{label:"Enabled",value:y.value.filter(l=>l.enabled==="Yes").length},{label:"Start",value:Le(oe.value)},{label:"Stop",value:Le(le.value)}]);return{loading:r,toast:h,errorToast:p,baselineToast:d,assetRows:U,assetColumns:sa,assetContextItems:ca,saveAsset:G,machineRows:O,machineColumns:na,machineContextItems:da,handleMachineTableAction:u,handleMachineChange:Y,dataSourceRows:g,dataSourceColumns:ia,dataSourceContextItems:ua,handleDatasourceChange:x,tagRows:R,tagColumns:oa,tagContextItems:ma,openTagConnector:_,ctagRows:$,ctagColumns:la,ctagContextItems:pa,handleCtagChange:Yt,ctagBuilderOpen:he,ctagDraft:H,ctagCalculationOptions:Z,ctagOperatorOptions:K,ctagTagOptions:Gt,ctagFormulaPreview:Kt,openCtagBuilder:jt,addCtagTerm:zt,createCtagRule:_t,selectedAssetName:o,baselineRows:y,baselineColumns:ra,baselineContextItems:ha,baselineDateTimeControls:Zt,baselineToolbarActions:Qt,reestablishing:Pe,handleBaselineRangeChange:ea,handleBaselineToolbarAction:ta,handleBaselineChange:aa}}},Os={components:{ScreenHeader:j,GridTable:X},template:`
    <div class="screen">
      <screen-header
        title="Asset Inventory"
        subtitle="Configured assets with access to asset configuration and alarm list"
        :actions="[{ key: 'add', label: 'Add Asset', kind: 'primary' }]"
        @action="$router.push({ name: 'new-asset' })"
      />
      <div v-if="loadError" class="inline-alert">{{ loadError }}</div>
      <section class="panel">
        <div class="panel-header"><h2>Asset Inventory List</h2></div>
        <table-context
          title="Configured asset rows"
          description="Assets available for configuration, alarms, and maintenance warning review."
          :items="[
            { label: 'Assets', value: rows.length },
            { label: 'Open Alarms', value: rows.reduce((total, row) => total + row.activeAlarms, 0) },
            { label: 'Warnings', value: rows.reduce((total, row) => total + row.baselineDeviations, 0) }
          ]"
        />
        <grid-table
          :rows="rows"
          :columns="columns"
          :actions="[{ label: 'Asset Configuration', key: 'configure' }, { label: 'Alarm List', key: 'alarms' }]"
          height="520px"
          @action="handleAction"
        />
      </section>
    </div>
  `,setup(){const e=m([]),t=m("");return pe(async()=>{try{e.value=await as(),t.value=""}catch(a){t.value=W(a)?"Data source offline":`Failed to load assets: ${a.message}`}}),{rows:e,loadError:t,columns:[{headerName:"Asset ID",field:"assetId",width:120},{headerName:"Asset Name",field:"assetName",flex:1.2},{headerName:"Location",field:"location",flex:1},{headerName:"Status",field:"status",cellRenderer:Q,width:92},{headerName:"Active Alarms",field:"activeAlarms",type:"numeric",width:140},{headerName:"Maintenance Warnings",field:"baselineDeviations",type:"numeric",width:190}]}},methods:{handleAction({action:e,row:t}){this.$router.push({name:e.key==="alarms"?"alarm-list":"asset-configuration",query:{asset:t.assetId}})}}},Fs={components:{ScreenHeader:j},template:`
    <div class="screen">
      <screen-header
        title="Connect Tags"
        :subtitle="connectionTitle"
      />
      <div v-if="toast" class="inline-alert success">{{ toast }}</div>
      <div v-if="errorMessage" class="inline-alert">{{ errorMessage }}</div>
      <section class="panel connect-tags-screen-panel">
        <div class="connect-tags-context">
          <span>Machine: {{ machineLabel }}</span>
          <span>Data Source: {{ sourceLabel }}</span>
        </div>
        <label class="connect-tags-search">
          <span>Search Tags</span>
          <input v-model="searchTerm" placeholder="Search Tag ID, Tag Name, or Alias" />
        </label>
        <div class="connect-tags-layout">
          <section class="connect-tags-pane">
            <div class="panel-header"><h2>Tag List</h2></div>
            <table-context
              title="Available source tags"
              description="Tags discoverable from the data source's backing store."
              :items="availableContextItems"
            />
            <div class="connect-tags-table-scroll">
              <p v-if="!availableTagRows.length" class="connect-tags-empty">No discoverable tags for this source type.</p>
              <table v-else class="editable-table connect-tags-table">
                <thead>
                  <tr>
                    <th>Tag ID</th>
                    <th>Tag Name</th>
                    <th>Alias</th>
                    <th>Connect</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="tag in filteredAvailableTagRows" :key="tag.tagKey">
                    <td><input :value="tag.tagKey" readonly /></td>
                    <td><span class="table-display-field" :title="tag.tagName">{{ tag.tagName }}</span></td>
                    <td><input v-model="tag.alias" placeholder="Optional" /></td>
                    <td><button type="button" class="primary table-action-button" :disabled="isConnected(tag.tagKey)" @click="connectTag(tag)">Connect</button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
          <section class="connect-tags-pane">
            <div class="panel-header">
              <h2>Selected Tags</h2>
              <button type="button" class="primary" :disabled="saving" @click="updateSelectedTags">{{ saving ? "Saving..." : "Update" }}</button>
            </div>
            <table-context
              title="Selected source tags"
              description="Update commits connections, removals, and alias edits to the backend."
              :items="selectedContextItems"
            />
            <div class="connect-tags-table-scroll">
              <table class="editable-table connect-tags-table">
                <thead>
                  <tr>
                    <th>Tag ID</th>
                    <th>Tag Name</th>
                    <th>Alias</th>
                    <th>Deselect</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="tag in selectedTagRows" :key="tag.rowKey">
                    <td><input :value="tag.tagId" readonly /></td>
                    <td><span class="table-display-field" :title="tag.tagName">{{ tag.tagName }}</span></td>
                    <td><input v-model="tag.alias" placeholder="Optional" /></td>
                    <td><button type="button" class="secondary table-action-button" @click="deselectTag(tag)">Deselect</button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </section>
    </div>
  `,setup(){const e=ce(),t=I(()=>String(e.query.machine||"")),a=I(()=>String(e.query.source||"")),s=m(""),n=m(""),i=I(()=>`${s.value||t.value} / ${n.value||a.value}`),o=m(""),r=m(""),h=m(""),p=m(!1),d=m([]),b=m([]),w=y=>W(y)?"Data source offline":y.message,T=async()=>{const[y,c]=await Promise.all([us(a.value),f.get(`/datasources/${encodeURIComponent(a.value)}/tags`)]),C=new Map(y.map(L=>[L.tagKey,L.tagName]));d.value=y.map(L=>({...L,alias:""})),b.value=c.map(L=>({kind:"server",rowKey:`server-${L.code}`,tagId:L.code,tagKey:L.tagKey||L.code,tagName:C.get(L.tagKey)||L.tagName,alias:L.tagName||"",unit:L.unit,raw:L}))},A=async()=>{try{const c=(await rs(t.value)).find(C=>C.dataSourceId===a.value);s.value=c?.machineName||t.value,n.value=c?.sourceName||a.value}catch{s.value=t.value,n.value=a.value}};pe(async()=>{try{await Promise.all([T(),A()]),h.value=""}catch(y){h.value=`Failed to load tags: ${w(y)}`}});const E=I(()=>{const y=o.value.trim().toLowerCase();return y?d.value.filter(c=>[c.tagKey,c.tagName,c.alias].some(C=>String(C||"").toLowerCase().includes(y))):d.value}),F=I(()=>b.value),V=y=>b.value.some(c=>c.tagKey===y),k=I(()=>[{label:"Visible Rows",value:E.value.length},{label:"Discovered Rows",value:d.value.length}]),U=I(()=>[{label:"Selected Tags",value:F.value.length},{label:"Pending Adds",value:b.value.filter(y=>y.kind==="new").length}]),O=m([]);return{machineLabel:s,sourceLabel:n,connectionTitle:i,availableContextItems:k,selectedContextItems:U,searchTerm:o,toast:r,errorMessage:h,saving:p,availableTagRows:d,filteredAvailableTagRows:E,selectedTagRows:F,isConnected:V,connectTag:y=>{V(y.tagKey)||(b.value.push({kind:"new",rowKey:`new-${y.tagKey}`,tagId:y.tagKey,tagKey:y.tagKey,tagName:y.tagName,alias:String(y.alias||"").trim(),unit:y.unit}),y.alias="",r.value="")},deselectTag:y=>{b.value=b.value.filter(c=>c.rowKey!==y.rowKey),y.kind==="server"&&O.value.push(y)},updateSelectedTags:async()=>{p.value=!0,r.value="",h.value="";let y=0;try{for(const c of b.value.filter(C=>C.kind==="new"))await ps(a.value,{code:c.tagKey,tagName:String(c.alias||"").trim()||c.tagName,tagKey:c.tagKey,unit:c.unit,plot:!0}),y+=1;for(const c of O.value)await gs(c.tagId),y+=1;for(const c of b.value.filter(C=>C.kind==="server")){const C=String(c.alias||"").trim()||c.tagName;C!==c.raw.tagName&&(await hs(c.tagId,{...c.raw,tagName:C}),y+=1)}O.value=[],await T(),r.value=y?`Saved ${y} tag connection change${y===1?"":"s"}.`:"No tag connection changes to save."}catch(c){h.value=`Failed to save tag connections: ${w(c)}`;try{O.value=[],await T()}catch{}}finally{p.value=!1}}}}},Us={components:{ScreenHeader:j,GridTable:X},template:`
    <div class="screen">
      <screen-header
        title="Group List"
        subtitle="Notification and administration groups"
      />
      <div class="table-command-row">
        <button type="button" class="primary" @click="$router.push({ name: 'group-configuration' })">Add Group ></button>
      </div>
      <div v-if="loadError" class="inline-alert">{{ loadError }}</div>
      <section class="panel">
        <div class="panel-header"><h2>Group List</h2></div>
        <table-context
          title="Group rows"
          description="Notification routing and administrative ownership."
          :items="[
            { label: 'Groups', value: rows.length }
          ]"
        />
        <grid-table
          :rows="rows"
          :columns="columns"
          :actions="[{ label: 'Group Configuration', key: 'edit' }]"
          height="500px"
          @action="openGroup"
        />
      </section>
    </div>
  `,setup(){const e=m([]),t=m("");return pe(async()=>{try{e.value=await Ae(),t.value=""}catch(a){t.value=W(a)?"Data source offline":`Failed to load groups: ${a.message}`}}),{rows:e,loadError:t,columns:[{headerName:"Group ID",field:"groupId",width:130},{headerName:"Group Name",field:"groupName",flex:1.2},{headerName:"Purpose",field:"purpose",flex:1.4},{headerName:"Delivery",field:"delivery",width:150},{headerName:"Active",field:"active",width:100}]}},methods:{openGroup({row:e}){this.$router.push({name:"group-configuration",query:{group:e.groupId}})}}},Vs={components:{ScreenHeader:j,GridTable:X,StatusBadge:we},data(){return{rows:[],toast:""}},created(){this.loadRows()},computed:{columns(){return[{headerName:"Asset",field:"assetName",width:130,minWidth:120},{headerName:"Location",field:"location",width:100,minWidth:88},{headerName:"Alarm",field:"alarmName",width:226,minWidth:200},{headerName:"Status",field:"severity",cellRenderer:Q,width:82,minWidth:74},{headerName:"Trip Time",field:"tripTime",width:76,minWidth:68},{headerName:"Dur",field:"duration",width:90,minWidth:68},{headerName:"Ack",field:"acknowledgement",width:110,minWidth:100}]}},template:`
    <div class="screen">
      <screen-header
        title="Active Alarms"
        subtitle="Alarm workflow: table to detail to trend to acknowledge to clear"
        status="red"
      />
      <div v-if="toast" class="inline-alert success">{{ toast }}</div>
      <section class="panel">
        <div class="panel-header">
          <h2>Active Alarm Summary</h2>
        </div>
        <table-context
          title="Open alarm queue"
          description="Rows needing detail review, acknowledgement, or clearing."
          :items="[
            { label: 'Open Alarms', value: rows.length },
            { label: 'Sort', value: 'Severity first' },
            { label: 'Actions', value: 'Detail / Ack / Clear' }
          ]"
        />
        <grid-table
          :rows="rows"
          :columns="columns"
          :actions="[
            { label: 'Alarm Detail', key: 'detail' },
            { label: 'Acknowledge', key: 'ack' },
            { label: 'Clear', key: 'clear' }
          ]"
          height="470px"
          @action="handleAction"
          @row-open="openDetail"
        />
      </section>
    </div>
  `,methods:{errorText(e,t){return W(e)?"Data source offline — live telemetry unavailable":`${t}: ${e.message}`},async loadRows(){try{this.rows=await xe()}catch(e){this.rows=[],this.toast=this.errorText(e,"Failed to load active alarms")}},handleAction({action:e,row:t}){e.key==="detail"&&this.openDetail(t),e.key==="ack"&&this.acknowledgeAlarm(t),e.key==="clear"&&this.clearAlarm(t)},openDetail(e){this.$router.push({name:"asset-alarm-detail",query:{asset:e?.assetCode}})},async acknowledgeAlarm(e){try{await qa(e.historyCode),await this.loadRows(),me(),this.toast=`Alarm ${e.alarmName} acknowledged. It stays in the active list until cleared.`}catch(t){this.toast=this.errorText(t,"Failed to acknowledge alarm")}},async clearAlarm(e){try{await za(e.historyCode),await this.loadRows(),me(),this.toast=`Alarm ${e.alarmName} cleared and moved to alarm history.`}catch(t){this.toast=this.errorText(t,"Failed to clear alarm")}}}},Ut=[{key:"1h",label:"1 Hour",hours:1},{key:"6h",label:"6 Hours",hours:6},{key:"24h",label:"24 Hours",hours:24},{key:"7d",label:"7 Days",hours:168},{key:"14d",label:"14 Days",hours:336}];async function ot(e,t,a="24h"){const s=e==="CTag"?"ctag":"tag",n=await f.get(`/trends/${s}/${encodeURIComponent(t)}`,{duration:a}),i=n.points||[];return{id:n.id,duration:n.duration,times:i.map(o=>o.time),values:i.map(o=>o.value)}}async function Bs(e,t="24h"){const a=await Promise.allSettled(e.map(n=>ot(n.kind,n.tagId||n.code,t))),s=new Map;return a.forEach((n,i)=>{n.status==="fulfilled"&&s.set(e[i].tagId||e[i].code,n.value)}),s}const mt=e=>{const t=String(e??"");return/[",\r\n]/.test(t)?`"${t.replace(/"/g,'""')}"`:t},Hs=(e,t)=>{const a=t?.length?t.map(i=>({key:i.field,label:i.headerName||i.label||i.field})):Object.keys(e[0]||{}).map(i=>({key:i,label:i})),s=a.map(i=>mt(i.label)).join(","),n=e.map(i=>a.map(o=>mt(i[o.key])).join(","));return[s,...n].join(`\r
`)},Vt=(e,t,a="text/plain;charset=utf-8")=>{const s=e.includes(".")?e:`${it(e)}.txt`,n=new Blob([t],{type:a}),i=URL.createObjectURL(n),o=document.createElement("a");return o.href=i,o.download=s,document.body.appendChild(o),o.click(),o.remove(),URL.revokeObjectURL(i),s},Ws=(e,t,a)=>Vt(`${it(e)}.csv`,Hs(t,a),"text/csv;charset=utf-8"),Gs=(e,t)=>{const a=[{Section:"Report",Record:"",Field:"Title",Value:e},{Section:"Report",Record:"",Field:"Generated",Value:new Date().toLocaleString()}];return t.forEach(s=>{(s.rows||[]).forEach((n,i)=>{if(n&&"label"in n&&"value"in n){a.push({Section:s.title,Record:"",Field:n.label,Value:n.value});return}Object.entries(n||{}).forEach(([o,r])=>{a.push({Section:s.title,Record:i+1,Field:o,Value:r})})})}),a},Ge=(e,t,a)=>Ws(e,Gs(t,a),[{field:"Section",headerName:"Section"},{field:"Record",headerName:"Record"},{field:"Field",headerName:"Field"},{field:"Value",headerName:"Value"}]),qs=(e=[])=>{if(!e.length)return"<tr><td>No rows</td></tr>";const a=e.every(o=>o&&"label"in o&&"value"in o)?["label","value"]:Array.from(e.reduce((o,r)=>(Object.keys(r||{}).forEach(h=>o.add(h)),o),new Set)),s=o=>({label:"Field",value:"Value"})[o]||o,n=`<tr>${a.map(o=>`<th>${ae(s(o))}</th>`).join("")}</tr>`,i=e.map(o=>`<tr>${a.map(r=>`<td>${ae(o?.[r]??"")}</td>`).join("")}</tr>`).join("");return`${n}${i}`},qe=(e,t,a)=>{const s=a.map(i=>`
        <h2>${ae(i.title)}</h2>
        <table>${qs(i.rows||[])}</table>`).join(""),n=`\uFEFF<!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: Arial, sans-serif; color: #111827; }
          h1 { font-size: 18px; margin: 0 0 6px; }
          h2 { font-size: 14px; margin: 18px 0 6px; }
          p { margin: 0 0 14px; color: #475569; }
          table { border-collapse: collapse; margin-bottom: 14px; }
          th { background: #e8edf4; font-weight: 700; }
          th, td { border: 1px solid #aeb8c6; padding: 6px 8px; mso-number-format: "\\@"; }
        </style>
      </head>
      <body>
        <h1>${ae(t)}</h1>
        <p>Generated: ${ae(new Date().toLocaleString())}</p>
        ${s}
      </body>
    </html>`;return Vt(`${it(e)}.xls`,n,"application/vnd.ms-excel;charset=utf-8")},Bt=(e,t,a=[])=>{const s=a.length?a:t.map(i=>i.name),n=t.filter(i=>s.includes(i.name));return e.map((i,o)=>n.reduce((r,h)=>(r[`${h.name}${h.unit?` (${h.unit})`:""}`]=h.data[o]??"",r),{Time:i}))},pt=["#3b82f6","#ea580c","#6d28d9","#059669","#be185d","#16a34a","#0284c7","#a855f7"],ht=e=>e?.tagName||e?.tagId||"Unmapped Tag",zs={components:{ScreenHeader:j,TrendChart:We,GridTable:X},data(){return{exportModalOpen:!1,toast:""}},template:`
    <div class="screen">
      <screen-header
        title="Alarm Data Trends"
        subtitle="Trend related Tags and CTags before acknowledgement and tracking"
        status="red"
        :actions="[{ key: 'export-report', label: 'Export Report', kind: 'primary' }]"
        @action="handleHeaderAction"
      />
      <div v-if="toast" class="inline-alert success">{{ toast }}</div>
      <div v-if="loadError" class="inline-alert">{{ loadError }}</div>
      <section class="split-layout trend-layout">
        <aside class="control-panel">
          <h2>Plot Duration</h2>
          <label class="duration-control trend-select-control">
            <span>Window</span>
            <select v-model="durationKey">
              <option v-for="option in durationOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
            </select>
          </label>
          <div class="trend-add-row">
            <label>
              <span>Add Tag / CTag</span>
              <select v-model="tagToAdd">
                <option value=""></option>
                <option v-for="option in availableTagOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
              </select>
            </label>
            <button type="button" class="primary" @click="addTagToTrend">Add</button>
          </div>
          <div class="check-list trend-check-list">
            <label v-for="line in currentTrend.series" :key="line.name">
              <input type="checkbox" :value="line.name" v-model="selected" />
              <span class="trend-tag-row">
                <span class="trend-series-label" :title="line.name + ' - ' + line.color">
                  <i class="trend-color-swatch" :style="{ '--series-color': line.color }" aria-hidden="true"></i>
                  <span class="trend-series-name">{{ line.name }}</span>
                </span>
                <strong v-if="line.alarmAssociated" class="association-badge alarm">Alarm</strong>
                <strong v-else class="association-badge ad-hoc">Added</strong>
              </span>
            </label>
          </div>
        </aside>
        <trend-chart
          :title="chartTitle"
          :times="currentTrend.times"
          :series="currentTrend.series"
          :selected="selected"
          height="390px"
          :show-legend="false"
        />
      </section>
      <section class="panel">
        <div class="panel-header">
          <h2>Trend Tags</h2>
        </div>
        <table-context
          title="Plotted signal rows"
          description="Alarm-associated signals are marked separately from ad hoc tags added to this trend."
          :items="[
            { label: 'Rows', value: trendTagRows.length },
            { label: 'Alarm Associated', value: trendTagRows.filter((row) => row.alarmAssociation === 'Alarm Associated').length },
            { label: 'Selected Series', value: selected.length },
            { label: 'Duration', value: durationInput },
            { label: 'Trend Points', value: currentTrend.times.length }
          ]"
        />
        <grid-table :rows="trendTagRows" :columns="columns" height="260px" compact />
      </section>
      <export-format-modal
        :open="exportModalOpen"
        title="Export Alarm Data Trends"
        @close="exportModalOpen = false"
        @select="handleExportFormat"
      />
    </div>
  `,setup(){const e=ce(),t=String(e.query.asset||""),a=Ut.map(g=>({value:g.key,label:g.label})),s=m("6h"),n=m(""),i=m(""),o=m([]),r=m(new Set),h=m([]),p=m(new Map),d=m([]),b=I(()=>new Map(o.value.map(g=>[g.tagId,g]))),w=I(()=>h.value.map(g=>b.value.get(g)).filter(Boolean)),T=I(()=>a.find(g=>g.value===s.value)?.label||s.value),A=g=>W(g)?"Data source offline — live telemetry unavailable":g?.message||String(g);let E=0;const F=async()=>{const g=++E,R=w.value;if(!R.length){p.value=new Map;return}try{const $=await Bs(R,s.value);if($.size||$.set(R[0].tagId,await ot(R[0].kind,R[0].tagId,s.value)),g!==E)return;p.value=$,i.value=""}catch($){if(g!==E)return;p.value=new Map,i.value=A($)}};pe(async()=>{try{const[g,R]=await Promise.all([Lt(),xe(t||void 0)]);o.value=g;const $=new Set(R.map(c=>c.tagKey).filter(Boolean)),y=g.filter(c=>$.has(c.tagKey)||$.has(c.tagId));r.value=new Set(y.map(c=>c.tagId)),h.value=y.map(c=>c.tagId)}catch(g){i.value=A(g)}}),ie(s,F),ie(h,F,{deep:!0});const V=I(()=>{let g=[];const R=w.value.map(($,y)=>{const c=p.value.get($.tagId);return!c||!c.values.length?null:(g.length||(g=c.times),{tagId:$.tagId,name:ht($),unit:$.unit||"",data:c.values,color:$.color||pt[y%pt.length],alarmAssociated:r.value.has($.tagId),dataSource:$.dataSource||""})}).filter(Boolean);return{times:g,series:R}}),k=I(()=>`Tags for Selected Alarms - ${T.value}`),U=I(()=>o.value.filter(g=>g.plot!==!1).map(g=>({value:g.tagId,label:`${r.value.has(g.tagId)?"[Alarm] ":""}${g.tagId} - ${g.tagName}`}))),O=()=>{const g=n.value;if(!g)return;h.value.includes(g)||h.value.push(g);const R=b.value.get(g),$=ht(R);$&&!d.value.includes($)&&d.value.push($),n.value=""};return ie(V,g=>{const R=new Set(g.series.map($=>$.name));if(d.value=d.value.filter($=>R.has($)),!d.value.length){const $=g.series.filter(y=>y.alarmAssociated).map(y=>y.name);d.value=$.length?$:g.series.map(y=>y.name)}},{immediate:!0}),{durationOptions:a,durationKey:s,durationInput:T,tagToAdd:n,loadError:i,availableTagOptions:U,selected:d,currentTrend:V,chartTitle:k,addTagToTrend:O,trendTagRows:I(()=>V.value.series.map(g=>({tagId:g.tagId,tagName:g.name,kind:b.value.get(g.tagId)?.kind||"Tag",measurementType:b.value.get(g.tagId)?.measurementType||"",unit:g.unit,dataSource:g.dataSource,alarmAssociation:g.alarmAssociated?"Alarm Associated":"Ad Hoc",plotState:d.value.includes(g.name)?"Visible":"Hidden",latestValue:g.data[g.data.length-1]}))),columns:[{headerName:"Tag ID",field:"tagId",width:116},{headerName:"Tag Name",field:"tagName",flex:1.2},{headerName:"Type",field:"kind",width:82},{headerName:"Alarm Association",field:"alarmAssociation",width:150},{headerName:"Plot State",field:"plotState",width:104},{headerName:"Latest",field:"latestValue",type:"numeric",decimals:2,width:100},{headerName:"Measurement",field:"measurementType",flex:1},{headerName:"Units",field:"unit",width:90},{headerName:"Data Source",field:"dataSource",flex:1}]}},methods:{handleHeaderAction(e){e.key==="export-report"&&(this.exportModalOpen=!0)},handleExportFormat(e){if(this.exportModalOpen=!1,e==="csv"){this.exportTrendCsv();return}this.exportTrendExcel()},exportTrendCsv(){const e=Ge("rpulse-alarm-data-trends-report","rhoPulse Alarm Data Trends Report",this.alarmTrendReportSections());this.toast=`Exported ${e}.`},exportTrendExcel(){const e=qe("rpulse-alarm-data-trends-report","rhoPulse Alarm Data Trends Report",this.alarmTrendReportSections());this.toast=`Exported ${e}.`},alarmTrendReportSections(){const e=Bt(this.currentTrend.times,this.currentTrend.series,this.selected);return[{title:"Trend Context",rows:[{label:"Site",value:ue.shell.siteName},{label:"Duration",value:this.durationInput},{label:"Selected Series",value:this.selected.join(", ")||"All series"},{label:"Visible Points",value:e.length}]},{title:"Latest Values",rows:this.currentTrend.series.filter(t=>!this.selected.length||this.selected.includes(t.name)).map(t=>({Series:t.name,Unit:t.unit||"",Latest:t.data[t.data.length-1]??""}))},{title:"Trend Data",rows:e}]}}},Ks={components:{ScreenHeader:j,GridTable:X},template:`
    <div class="screen">
      <screen-header title="Alarm History" :subtitle="subtitle" />
      <section class="panel">
        <div class="panel-header">
          <h2>Master Alarm Table</h2>
        </div>
        <table-context
          title="Alarm event rows"
          description="Notification, acknowledgement, owner, and status history."
          :items="[
            { label: 'Scope', value: 'All assets' },
            { label: 'Events', value: rows.length },
            { label: 'Detail', value: 'Double-click row' }
          ]"
        />
        <grid-table
          :rows="rows"
          :columns="columns"
          :actions="[{ label: 'Alarm Detail', key: 'detail' }]"
          height="520px"
          @action="openDetail"
          @row-open="openDetail"
        />
      </section>
    </div>
  `,setup(){const e=m([]),t=m(""),a=I(()=>t.value||"Sortable master alarm history with detail navigation");async function s(){try{const n=await Mt({size:100});e.value=n.rows,t.value=""}catch(n){t.value=W(n)?"Data source offline — live telemetry unavailable":`Failed to load alarm history: ${n.message}`}}return s(),{rows:e,subtitle:a,columns:[{headerName:"Asset",field:"assetName",flex:1},{headerName:"Location",field:"location",flex:1},{headerName:"Alarm",field:"alarmName",flex:1.4},{headerName:"Trip Time",field:"tripTime",width:112},{headerName:"Notification",field:"notificationTime",width:124},{headerName:"Ack",field:"acknowledgeTime",width:112},{headerName:"Duration",field:"duration",width:110},{headerName:"Responsibility",field:"responsibility",width:140},{headerName:"Status",field:"status",cellRenderer:Q,width:124}]}},methods:{openDetail(e){const t=e?.row||e||{};this.$router.push({name:"alarm-history-detail",query:{alarmEventId:t.alarmEventId}})}}},js={GT:"Greater Than",GTE:"Greater Than or Equal",LT:"Less Than",LTE:"Less Than or Equal",EQ:"Equal To"},Fe=e=>({date:String(e).slice(0,10),time:String(e).slice(11)}),_s={components:{ScreenHeader:j,ActionModal:Ft,GridTable:X},data(){return{exportModalOpen:!1,notifyOpen:!1,toast:""}},template:`
    <div class="screen">
      <screen-header
        title="Alarm History Detail"
        :subtitle="subtitle"
        :actions="[
          { key: 'notify', label: 'Notify Group', kind: 'primary' },
          { key: 'export-report', label: 'Export Report' }
        ]"
        @action="handleHeaderAction"
      />
      <div v-if="toast" class="inline-alert success">{{ toast }}</div>
      <section class="detail-layout alarm-history-detail-layout">
        <div class="panel">
          <div class="panel-header"><h2>Alarm Detail</h2></div>
          <dl class="detail-list">
            <template v-for="item in detailItems" :key="item.label">
              <dt>{{ item.label }}</dt>
              <dd>{{ item.value }}</dd>
            </template>
          </dl>
        </div>
        <div class="panel">
          <div class="panel-header"><h2>Work History</h2></div>
          <table-context
            title="Work history entries"
            description="Lifecycle timeline reconstructed from this alarm event's recorded timestamps."
            :items="[
              { label: 'Status', value: selectedEvent.status },
              { label: 'Entries', value: workHistoryRows.length },
              { label: 'Event ID', value: selectedEvent.alarmEventId }
            ]"
          />
          <table class="work-history">
            <thead><tr><th>Date</th><th>Time</th><th>User</th><th>Action</th><th>Note</th><th>Notify</th></tr></thead>
            <tbody>
              <tr v-for="entry in workHistoryRows" :key="entry.date + entry.time + entry.action">
                <td>{{ entry.date }}</td>
                <td>{{ entry.time }}</td>
                <td>{{ entry.user }}</td>
                <td>{{ entry.action }}</td>
                <td>{{ entry.note }}</td>
                <td><button @click="notifyOpen = true">Notify Group ></button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      <section v-if="evidenceRows.length" class="panel">
        <div class="panel-header"><h2>Triggered Tags</h2></div>
        <table-context
          title="Alarm evidence"
          description="Live tag values for this alarm while it remains in the active list."
          :items="[
            { label: 'Rows', value: evidenceRows.length },
            { label: 'Export', value: 'Included in report' }
          ]"
        />
        <grid-table :rows="evidenceRows" :columns="evidenceColumns" height="240px" compact />
      </section>
      <action-modal
        :open="notifyOpen"
        title="Notify Group"
        mode="notify"
        @close="notifyOpen = false"
        @sent="sendNotification"
      />
      <export-format-modal
        :open="exportModalOpen"
        title="Export Alarm History Detail"
        @close="exportModalOpen = false"
        @select="handleExportFormat"
      />
    </div>
  `,setup(){const e=ce(),t=m(null),a=m(null),s=m(""),n=I(()=>s.value||"Historical alarm status, ownership, notes, and notification follow-up"),i=I(()=>t.value||{});async function o(){const d=String(e.query.alarmEventId||"");if(!d){s.value="No alarm event selected — open a row from Alarm History.";return}try{t.value=await Ka(d)}catch(b){wt(b)?s.value=`Alarm event ${d} was not found.`:W(b)?s.value="Data source offline — live telemetry unavailable":s.value=`Failed to load alarm event: ${b.message}`;return}if(t.value.rawStatus!=="CLEARED")try{const b=await xe();a.value=b.find(w=>w.historyCode===d)||null}catch{a.value=null}}o();const r=I(()=>[{label:"Event ID",value:i.value.alarmEventId||""},{label:"Status",value:i.value.status||""},{label:"Asset",value:i.value.assetName||""},{label:"Asset Location",value:i.value.location||""},{label:"Alarm Name",value:i.value.alarmName||""},{label:"Trip Time",value:i.value.tripTime||""},{label:"Notification Time",value:i.value.notificationTime||""},{label:"Acknowledgement",value:i.value.acknowledgeTime||"Pending"},{label:"Cleared",value:i.value.clearTime||""},{label:"Duration",value:i.value.duration||""},{label:"Responsibility",value:i.value.responsibility||""}]),h=I(()=>{const d=i.value,b=d.responsibility||"Operator",w=[];return d.tripTime&&w.push({...Fe(d.tripTime),user:"System",action:"Trip",note:`Alarm ${d.alarmName||""} tripped and the event was opened.`.trim()}),d.notificationTime&&w.push({...Fe(d.notificationTime),user:"System",action:"Notification",note:`Notification issued to ${b}.`}),d.acknowledgeTime&&w.push({...Fe(d.acknowledgeTime),user:b,action:"Acknowledged",note:"Alarm acknowledged; tracking active for follow-up."}),d.clearTime&&w.push({...Fe(d.clearTime),user:b,action:"Cleared",note:"Alarm cleared and event closed."}),w}),p=I(()=>{const d=a.value;return d?[{tagName:d.tagKey,tagType:"Tag",condition:js[d.operator]||d.operator||"",limitValue:ne(d.thresholdValue,2),currentValue:ne(d.currentValue,2),duration:d.duration,lastSync:d.tripTime}]:[]});return{selectedEvent:i,subtitle:n,detailItems:r,workHistoryRows:h,evidenceRows:p,evidenceColumns:[{headerName:"Tag",field:"tagName",flex:1.2},{headerName:"Type",field:"tagType",width:100},{headerName:"Condition",field:"condition",flex:1},{headerName:"Limit",field:"limitValue",width:110},{headerName:"Current",field:"currentValue",width:120},{headerName:"Duration",field:"duration",width:110},{headerName:"Last Sync",field:"lastSync",width:110}]}},methods:{handleHeaderAction(e){if(e.key==="notify"){this.notifyOpen=!0;return}e.key==="export-report"&&(this.exportModalOpen=!0)},async sendNotification(e){this.notifyOpen=!1;const t=this.selectedEvent;try{await Ba({title:`Alarm ${t.alarmName||t.alarmEventId||""}`.trim(),body:e.note||`Alarm ${t.alarmName||""} on ${t.assetName||"asset"} (event ${t.alarmEventId||""}, status ${t.status||""}) requires review by ${e.groupName}.`,source:"ALARM",target:e.groupName}),me(),this.toast=`Notification sent to ${e.groupName} and logged in Message Center.`}catch(a){this.toast=W(a)?"Data source offline — live telemetry unavailable":`Failed to send notification: ${a.message}`}},handleExportFormat(e){if(this.exportModalOpen=!1,e==="csv"){this.exportHistoryCsv();return}this.exportHistoryExcel()},exportHistoryCsv(){const e=this.selectedEvent.alarmEventId||"alarm-event",t=Ge(`rpulse-alarm-history-detail-${e}`,"rhoPulse Alarm History Detail Report",this.historyReportSections());this.toast=`Exported ${t}.`},exportHistoryExcel(){const e=this.selectedEvent.alarmEventId||"alarm-event",t=qe(`rpulse-alarm-history-detail-${e}`,"rhoPulse Alarm History Detail Report",this.historyReportSections());this.toast=`Exported ${t}.`},historyReportSections(){return[{title:"Alarm Event",rows:this.detailItems},{title:"Work History",rows:this.workHistoryRows},{title:"Triggered Tags",rows:this.evidenceRows}]}}},Ys={GT:"Greater Than",GTE:"Greater Than or Equal",LT:"Less Than",LTE:"Less Than or Equal",EQ:"Equal To"},Js={components:{ScreenHeader:j,GridTable:X},template:`
    <div class="screen">
      <screen-header
        title="Asset Alarm Detail"
        :subtitle="detailSubtitle"
        status="red"
      />
      <div class="table-command-row">
        <button type="button" class="primary" @click="plotTags">Plot Tags ></button>
      </div>
      <section class="panel">
        <div class="panel-header">
          <h2>Alarm Detail Table</h2>
        </div>
        <table-context
          :title="detailTitle"
          description="Tags and CTags driving this alarm state."
          :items="tableContextItems"
        />
        <grid-table :rows="rows" :columns="columns" height="360px" />
      </section>
    </div>
  `,setup(){const e=ce(),t=m([]),a=m({}),s=m(String(e.query.asset||"")),n=m(""),i=I(()=>{if(n.value)return n.value;const p=a.value;return`${p.assetName||"Selected asset"} at ${p.location||"site"} has ${p.activeAlarms??t.value.length} active alarms`}),o=I(()=>`${a.value.assetName||"Selected asset"} alarm tags`),r=I(()=>[{label:"Asset ID",value:s.value},{label:"Active Alarms",value:a.value.activeAlarms??t.value.length},{label:"Rows",value:t.value.length}]);async function h(){try{const p=await It();if(!s.value){const d=p.assets.find(b=>b.activeAlarms>0)||p.assets[0];s.value=d?d.assetId:""}a.value=p.assets.find(d=>d.assetId===s.value)||{},t.value=s.value?(await xe(s.value)).map(d=>({tagName:d.tagKey,tagType:"Tag",currentValue:d.currentValue,condition:Ys[d.operator]||d.operator||"",value:d.thresholdValue,unit:"",duration:d.duration,lastSync:d.tripTime})):[],n.value=""}catch(p){n.value=W(p)?"Data source offline — live telemetry unavailable":`Failed to load asset alarms: ${p.message}`}}return h(),{rows:t,assetCode:s,detailSubtitle:i,detailTitle:o,tableContextItems:r,columns:[{headerName:"Alarm Tag",field:"tagName",flex:1.2},{headerName:"Alarm Type",field:"tagType",width:126},{headerName:"Current Value",field:"currentValue",type:"numeric",decimals:2,width:132},{headerName:"Condition",field:"condition",flex:1},{headerName:"Limit Value",field:"value",type:"numeric",decimals:2,width:118},{headerName:"Units",field:"unit",width:100},{headerName:"Time Duration",field:"duration",width:128},{headerName:"Last Sync",field:"lastSync",width:110}]}},methods:{plotTags(){this.$router.push({name:"alarm-data-trends",query:{asset:this.assetCode}})}}},Zs={components:{ScreenHeader:j,GridTable:X,ActionModal:Ft},data(){return{rows:[],exportModalOpen:!1,notifyOpen:!1,selectedDeviation:null,toast:""}},created(){this.loadRows()},template:`
    <div class="screen">
      <screen-header
        title="Maintenance Warnings"
        subtitle="Tags and CTags outside established baseline ranges"
        status="yellow"
        :actions="[{ key: 'export-report', label: 'Export Report', kind: 'primary' }]"
        @action="handleHeaderAction"
      />
      <div v-if="toast" class="inline-alert success">{{ toast }}</div>
      <section class="panel">
        <div class="panel-header">
          <h2>Maintenance Warnings</h2>
        </div>
        <table-context
          title="Baseline deviation rows"
          description="Measurements outside configured limits."
          :items="[
            { label: 'Scope', value: scopeLabel },
            { label: 'Warnings', value: rows.length },
            { label: 'Actions', value: 'Plot / Notify' }
          ]"
        />
        <grid-table
          :rows="rows"
          :columns="columns"
          :actions="[{ label: 'Plot Trend', key: 'plot' }, { label: 'Notify Group', key: 'notify' }]"
          height="520px"
          @action="handleAction"
        />
      </section>
      <action-modal
        :open="notifyOpen"
        title="Notification Action"
        mode="notify"
        @close="notifyOpen = false"
        @sent="markNotified"
      />
      <export-format-modal
        :open="exportModalOpen"
        title="Export Maintenance Warnings"
        @close="exportModalOpen = false"
        @select="handleExportFormat"
      />
    </div>
  `,computed:{assetFilter(){return String(this.$route.query.asset||"")},scopeLabel(){return this.assetFilter||"All assets"},columns(){return[{headerName:"Tag",field:"tagName",width:146,minWidth:136},{headerName:"Measure",field:"measurementType",width:112,minWidth:102},{headerName:"Asset",field:"asset",width:168,minWidth:156},{headerName:"Baseline",field:"baseline",type:"measurement",decimals:2,align:"left",width:94,minWidth:86},{headerName:"Current Value",field:"currentValue",type:"measurement",decimals:2,align:"left",width:126,minWidth:116},{headerName:"Condition",field:"condition",width:172,minWidth:162}]}},methods:{async loadRows(){try{let e=await at();this.assetFilter&&(e=e.filter(t=>t.assetCode===this.assetFilter)),this.rows=e.map(t=>({...t,condition:t.direction==="Below"?"Below Low Baseline":"Above High Baseline"}))}catch(e){this.rows=[],this.toast=W(e)?"Data source offline — live telemetry unavailable":`Failed to load maintenance warnings: ${e.message}`}},handleHeaderAction(e){e.key==="export-report"&&(this.exportModalOpen=!0)},handleExportFormat(e){if(this.exportModalOpen=!1,e==="csv"){this.exportWarningsCsv();return}this.exportWarningsExcel()},handleAction({action:e,row:t}){e.key==="plot"&&this.$router.push({name:"data-deviation-trends",query:{deviationId:t.tagCode}}),e.key==="notify"&&(this.selectedDeviation=t,this.notifyOpen=!0)},exportWarningsCsv(){const e=Ge("rpulse-maintenance-warnings-report","rhoPulse Maintenance Warnings Report",this.warningReportSections());this.toast=`Exported ${e}.`},exportWarningsExcel(){const e=qe("rpulse-maintenance-warnings-report","rhoPulse Maintenance Warnings Report",this.warningReportSections());this.toast=`Exported ${e}.`},warningReportSections(){return[{title:"Warning Summary",rows:[{label:"Site",value:ue.shell.siteName},{label:"Open Warnings",value:this.rows.length},{label:"Assets Affected",value:new Set(this.rows.map(e=>e.asset)).size},{label:"Generated By",value:ue.shell.userName}]},{title:"Warning Rows",rows:this.rows.map(e=>({Warning:e.deviationId,Asset:e.asset,Tag:e.tagName,Baseline:e.baseline,Current:e.currentValue,Condition:e.condition}))}]},async markNotified(e){this.notifyOpen=!1;const t=this.selectedDeviation;if(t)try{await _a(t.tagCode,e.groupCode);const a=this.rows.find(s=>s.deviationId===t.deviationId);a&&(a.notified="Yes"),me(),this.toast=`Notification for ${t.tagName} sent to ${e.groupName}.`}catch(a){this.toast=W(a)?"Data source offline — live telemetry unavailable":`Failed to send notification: ${a.message}`}}}},lt={props:{modelValue:{type:String,default:""},label:{type:String,default:"Duration"},options:{type:Array,default:()=>[]},listId:{type:String,default:"duration-options"}},emits:["update:modelValue","commit"],template:`
    <label class="duration-control">
      <span v-if="label">{{ label }}</span>
      <select
        v-if="options.length"
        class="duration-input"
        :value="modelValue"
        @change="handleSelectChange"
      >
        <option v-for="option in options" :key="option.value" :value="option.label">{{ option.label }}</option>
      </select>
      <input
        v-else
        class="duration-input text-input"
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
        @blur="$emit('commit')"
        @keydown.enter.prevent="$emit('commit')"
      />
    </label>
  `,methods:{handleSelectChange(e){this.$emit("update:modelValue",e.target.value),this.$emit("commit")}}},rt=(e,t,a)=>{const s=ze(e),n=t.find(i=>ze(i.value)===s||ze(i.label)===s);return n?n.value:a},Ht=(e,t,a)=>{const s=rt(e,t,a);return t.find(n=>n.value===s)?.label||e},Qs=`
    <div class="screen">
      <screen-header
        title="Maintenance Warning Trend"
        subtitle="Measured tag data against calculated baseline envelope"
        status="yellow"
        :actions="[{ key: 'export-report', label: 'Export Report', kind: 'primary' }]"
        @action="handleHeaderAction"
      />
      <div v-if="toast" class="inline-alert success">{{ toast }}</div>
      <div v-if="loadError" class="inline-alert">{{ loadError }}</div>
      <template v-if="!warningMissing">
      <div class="chart-control-row">
        <duration-input
          v-model="durationInput"
          :options="durationOptions"
          list-id="deviation-duration-options"
          @commit="normalizeDurationInput"
        />
      </div>
      <trend-chart
        :title="plotTitle"
        :times="currentTrend.times"
        :series="currentTrend.series"
        height="480px"
        :show-symbols="true"
      />
      <section class="panel baseline-relationship-panel">
        <div class="panel-header">
          <h2>Baseline Relationship</h2>
          <span class="panel-note">Pre-alarm maintenance warning context</span>
        </div>
        <div class="relationship-summary-grid">
          <div v-for="item in preAlarmSummary" :key="item.label">
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </div>
        </div>
        <trend-chart
          title="Baseline Relationship: Maintenance Warning to Alarm Trip"
          :times="relationshipTrend.times"
          :series="relationshipTrend.series"
          height="380px"
          :show-symbols="false"
          :grid-top="96"
        />
        <div class="relationship-timeline">
          <div class="relationship-timeline-rail">
            <span
              v-for="segment in relationshipTimeline"
              :key="segment.label"
              :class="['relationship-segment', segment.kind]"
              :style="{ flexGrow: segment.weight }"
            ></span>
          </div>
          <div class="relationship-timeline-labels">
            <span v-for="segment in relationshipTimeline" :key="segment.label + '-label'">{{ segment.label }}</span>
          </div>
        </div>
      </section>
      <section class="panel prealarm-analysis-panel">
        <div class="panel-header">
          <h2>Pre-Alarm Baseline Analysis</h2>
        </div>
        <p class="prealarm-narrative">{{ preAlarmNarrative }}</p>
        <div class="prealarm-event-list">
          <div v-if="!preAlarmEvents.length" class="prealarm-empty">No out-of-baseline events were detected before the mapped alarm in this window.</div>
          <div v-for="event in preAlarmEvents" :key="event.id" class="prealarm-event-row">
            <strong>{{ event.label }}</strong>
            <span>{{ event.startLabel }}</span>
            <span>{{ event.durationLabel }}</span>
            <span>{{ event.peakLabel }}</span>
          </div>
        </div>
      </section>
      <section class="panel deviation-report-panel">
        <div class="panel-header">
          <h2>Maintenance Warning Report</h2>
        </div>
        <div class="deviation-report-grid">
          <div v-for="item in deviationReport" :key="item.label">
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </div>
        </div>
      </section>
      </template>
      <export-format-modal
        :open="exportModalOpen"
        title="Export Maintenance Warning Trend"
        @close="exportModalOpen = false"
        @select="handleExportFormat"
      />
    </div>
`,Ue=(e,t=0)=>{const a=Number(String(e||"").match(/-?\d+(\.\d+)?/)?.[0]),s=Number(t);return Number.isFinite(a)?a:Number.isFinite(s)?s:0},Ve=(...e)=>{for(const t of e){if(t==null||t==="")continue;const a=Number(t);if(Number.isFinite(a))return a}return null},Wt=(e="")=>/rpm|state/i.test(e)?0:2,De=(e,t,a)=>{const s=Wt(a);return Array.from({length:e},()=>Number.isFinite(t)?Number(t.toFixed(s)):null)},Xs=(e,t={},a={},s={})=>{const n=e?.times||[],i=e?.values||[],o=t.unit||a.unit||"",r=Ve(s.baselineTarget)??Ue(a.baseline,Number(t.initialValue??0)),h=Ve(s.baselineLow)??Ue(a.baselineLow,Number(t.minValue??r)),p=Ve(s.baselineHigh)??Ue(a.baselineHigh,Number(t.maxValue??r)),d=Ve(s.baselineStdDev)??Ue(a.baselineStdDev,Math.max(Math.abs(p-h)/4,0)),b=r-d,w=r+d,T=i.map(A=>Number.isFinite(Number(A))?Number(A):null);return{times:n,baselineStats:{low:h,baseline:r,high:p,stdDev:d,stdDevLow:b,stdDevHigh:w,sampleCount:T.filter(A=>A!==null).length,unit:o},series:[{name:"Measured Tag Data",tagId:t.tagId,unit:o,data:T,color:t.color||"#ea580c",showSymbol:!0},{name:"Baseline Low",unit:o,data:De(n.length,h,o),color:"#0f766e",baselineLine:!0,lineType:"dashed",width:1.8},{name:"Baseline Target",unit:o,data:De(n.length,r,o),color:"#1d4ed8",baselineLine:!0,width:2},{name:"Std Dev -1 SD",unit:o,data:De(n.length,b,o),color:"#64748b",baselineLine:!0,lineType:"dotted",width:1.5},{name:"Std Dev +1 SD",unit:o,data:De(n.length,w,o),color:"#64748b",baselineLine:!0,lineType:"dotted",width:1.5},{name:"Baseline High",unit:o,data:De(n.length,p,o),color:"#c2410c",baselineLine:!0,lineType:"dashed",width:1.8}]}},de=(e,t="")=>`${ne(e,Wt(t))}${t?` ${t}`:""}`,en=e=>{const t=[...e].sort((s,n)=>s-n),a=Math.floor(t.length/2);return t.length%2?t[a]:(t[a-1]+t[a])/2},tn=e=>{const t=String(e||"").match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{1,2}):(\d{2})/);if(!t)return null;const[,a,s,n,i,o]=t.map(Number),r=new Date(a,s-1,n,i,o).getTime();return Number.isFinite(r)?{timeMs:r,iso:new Date(r).toISOString()}:null},gt=e=>String(e||"").toLowerCase().replace(/[^a-z0-9]/g,""),vt=(e=[],t=[],a={},s={})=>{const n=e.find(h=>h.tagKey===a.tagCode||s.tagKey&&h.tagKey===s.tagKey);if(n){const h=Date.parse(n.tripTimestamp);return{alarmName:n.alarmName,tripTime:n.tripTimestamp||"",tripMs:Number.isFinite(h)?h:null,threshold:[n.operator,n.thresholdValue].filter(p=>p!=null&&p!=="").join(" ")}}const i=gt(s.tagName||a.tagName||a.tagCode);if(!i)return null;const o=t.find(h=>gt(h.alarmName).includes(i));if(!o)return null;const r=tn(o.tripTime);return{alarmName:o.alarmName,tripTime:r?.iso||"",tripMs:r?.timeMs??null,threshold:o.status||""}},ve=e=>{const t=Math.max(0,Math.round(e/6e4)),a=Math.floor(t/60),s=t%60;return a&&s?`${a}h ${s}m`:a?`${a}h`:`${s}m`},ft=e=>e?new Intl.DateTimeFormat(void 0,{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"}).format(new Date(e)):"",an=e=>{if(e.length<2)return 6e4;const t=e.slice(1).map((a,s)=>a.timeMs-e[s].timeMs).filter(a=>a>0);return t.length?(t.sort((a,s)=>a-s),t[Math.floor(t.length/2)]):6e4},sn=(e,t={},a={},s=null)=>{const n=e?.times||[],i=e?.values||[],o=t.unit||a.baselineStats?.unit||"",r=a.baselineStats||{},h=Number(r.low),p=Number(r.high),d=Number(r.baseline),b=Math.max(Number(r.stdDev)||0,1e-4),w=n.map((S,M)=>{const B=Number(i[M]),G=Date.parse(S);return Number.isFinite(B)&&Number.isFinite(G)?{index:M,value:B,iso:S,timeMs:G}:null}).filter(Boolean),T=an(w),A=w.length?w[w.length-1].timeMs:Date.now(),E=Number.isFinite(s?.tripMs)?s.tripMs:A,F=Math.max(10*6e4,2*T),V=[];let k=null;w.filter(S=>S.timeMs<=E).forEach(S=>{if(!(Number.isFinite(h)&&Number.isFinite(p)&&(S.value<h||S.value>p))){k&&V.push(k),k=null;return}const B=Math.abs(S.value-d),G=B/b;if(!k){k={startMs:S.timeMs,endMs:S.timeMs,startIso:S.iso,endIso:S.iso,peakValue:S.value,peakDeviation:B,peakSigma:G,direction:S.value>p?"High":"Low"};return}k.endMs=S.timeMs,k.endIso=S.iso,B>k.peakDeviation&&(k.peakValue=S.value,k.peakDeviation=B,k.peakSigma=G,k.direction=S.value>p?"High":"Low")}),k&&V.push(k);const O=V.reduce((S,M)=>{const B=S[S.length-1];return B&&M.startMs-B.endMs<=F?(B.endMs=M.endMs,B.endIso=M.endIso,M.peakDeviation>B.peakDeviation&&Object.assign(B,{peakValue:M.peakValue,peakDeviation:M.peakDeviation,peakSigma:M.peakSigma,direction:M.direction}),S):(S.push({...M}),S)},[]).map((S,M)=>({...S,id:`prealarm-${M+1}`,durationMs:Math.max(T,Math.min(S.endMs,E)-S.startMs+T)})),g=O[0],R=s?O.find(S=>S.startMs<=E&&S.endMs+T>=E):null,$=O.reduce((S,M)=>S+M.durationMs,0),y=O.reduce((S,M)=>Math.max(S,M.durationMs),0),c=O.reduce((S,M)=>Math.max(S,M.peakSigma||0),0),C=s&&g?Math.max(0,E-g.startMs):0,L=R?Math.max(0,E-R.startMs):0;return{alarm:s,low:h,high:p,mean:d,stdDev:b,unit:o,events:O,eventCount:O.length,totalDurationMs:$,longestDurationMs:y,maxSigma:c,leadTimeMs:C,continuousBeforeTripMs:L,firstEvent:g,eventAtTrip:R,alarmMs:E,stepMs:T}},nn={components:{ScreenHeader:j,TrendChart:We,DurationInput:lt},data(){return{exportModalOpen:!1,toast:""}},template:Qs,setup(){const e=ce(),t=String(e.query.deviationId||""),a=Ut.map(c=>({value:c.key,label:c.label})),s=m("6h"),n=m(a.find(c=>c.value==="6h")?.label||"6h"),i=m(null),o=m({}),r=m({}),h=m(null),p=m({times:[],values:[]}),d=m(""),b=m(!1),w=c=>W(c)?"Data source offline — live telemetry unavailable":c?.message||String(c);let T=0;const A=async()=>{if(!i.value)return;const c=++T;try{const C=await ot(o.value.kind||"Tag",i.value.tagCode,s.value);if(c!==T)return;p.value=C,d.value=""}catch(C){if(c!==T)return;p.value={times:[],values:[]},d.value=w(C)}};pe(async()=>{try{const c=await at(),C=t?c.find(z=>z.tagCode===t):c[0];if(!C){b.value=!0,d.value=t?`No maintenance warning found for tag "${t}".`:"No maintenance warnings are currently active.";return}i.value=C;const[L,S,M]=await Promise.all([Lt(),ys(C.assetCode),xe(C.assetCode)]),B=L.filter(z=>z.tagId===C.tagCode);o.value=B.find(z=>C.scope==="CTag"?z.kind==="CTag":z.kind==="Tag")||B[0]||{tagId:C.tagCode,tagName:C.tagName,kind:C.scope==="CTag"?"CTag":"Tag",unit:C.unit},r.value=S.find(z=>z.tagId===C.tagCode)||{};let G=vt(M,[],C,o.value);if(!G){const z=await Mt({assetCode:C.assetCode,size:50});G=vt([],z.rows,C,o.value)}h.value=G,await A()}catch(c){d.value=w(c)}}),ie(s,A);const E=I(()=>i.value||{}),F=I(()=>`Maintenance Warning: ${E.value.tagName||"Selected Warning"}`),V=I(()=>Xs(p.value,o.value,E.value,r.value)),k=I(()=>sn(p.value,o.value,V.value,h.value)),U=I(()=>{const c=V.value,C=k.value,L=C.events.map(M=>({name:"Out of Baseline",start:M.startIso,end:M.endIso})),S=[C.firstEvent?{name:"First Deviation",label:"First Deviation",xAxis:C.firstEvent.startIso,color:"#b45309",lineType:"dashed"}:null,C.alarm?.tripTime?{name:"Alarm Trip",label:"Alarm Trip",xAxis:C.alarm.tripTime,color:"#b91c1c",width:2}:null].filter(Boolean);return{times:c.times,series:c.series.map(M=>/measured/i.test(M.name)?{...M,markAreas:L,markLines:S,markAreaColor:"rgba(194, 65, 12, 0.12)",showSymbol:!1}:{...M,showSymbol:!1})}}),O=I(()=>{const c=k.value;return[{label:"Linked Alarm Trip",value:c.alarm?.tripTime?ft(c.alarm.tripTime):"No linked alarm trip in window"},{label:"First Deviation Before Alarm",value:c.alarm?c.firstEvent?ve(c.leadTimeMs):"None in window":"No linked alarm"},{label:"Out-of-Baseline Events",value:ne(c.eventCount,0)},{label:"Total Time Out",value:ve(c.totalDurationMs)},{label:"Continuous Before Trip",value:c.alarm?c.eventAtTrip?ve(c.continuousBeforeTripMs):"Not out at trip":"No linked alarm"},{label:"Max Deviation",value:`${ne(c.maxSigma,1)} SD`}]}),g=I(()=>k.value.events.slice(0,6).map((c,C)=>({id:c.id,label:`Deviation ${C+1}`,startLabel:ft(c.startIso),durationLabel:ve(c.durationMs),peakLabel:`${c.direction} peak ${de(c.peakValue,k.value.unit)} (${ne(c.peakSigma,1)} SD)`}))),R=I(()=>{const c=k.value;return[{label:"Baseline Window",kind:"normal",weight:3},{label:`${c.eventCount} Deviations`,kind:"warning",weight:Math.max(1,c.eventCount)},{label:c.alarm?"Alarm Trip":"No Alarm Mapped",kind:c.alarm?"alarm":"muted",weight:1}]}),$=I(()=>{const c=k.value,C=o.value?.tagName||E.value?.tagName||"Selected tag";if(!c.alarm){const S=c.eventCount?`left the calculated baseline envelope ${c.eventCount} time${c.eventCount===1?"":"s"}`:"stayed inside the calculated baseline envelope";return`${C} ${S} in the selected ${n.value} window, but there is no linked alarm trip in window, so trip-relative metrics are skipped.`}if(!c.eventCount)return`${C} did not leave the calculated baseline envelope before the linked alarm trip in the selected ${n.value} window.`;const L=c.eventAtTrip?` It was continuously out of baseline for ${ve(c.continuousBeforeTripMs)} before the alarm tripped.`:" It had returned inside baseline before the alarm trip.";return`${C} left the calculated baseline envelope ${c.eventCount} time${c.eventCount===1?"":"s"} before the alarm. The first deviation started ${ve(c.leadTimeMs)} before trip, with ${ve(c.totalDurationMs)} total out-of-baseline time.${L}`}),y=I(()=>{const c=V.value,C=c.series.find(Y=>/measured/i.test(Y.name)),L=(C?.data||[]).map(Number).filter(Number.isFinite);if(!L.length)return[];const S=L.reduce((Y,N)=>Y+N,0)/L.length,M=L.reduce((Y,N)=>Y+Math.abs(N-S),0)/L.length,B=L.reduce((Y,N)=>Y+Math.pow(N-S,2),0)/L.length,G=C?.unit||c.baselineStats?.unit||"",z=c.baselineStats||{};return[{label:"Baseline Low",value:de(z.low,G)},{label:"Baseline Target",value:de(z.baseline,G)},{label:"Baseline High",value:de(z.high,G)},{label:"Baseline Std Dev",value:de(z.stdDev,G)},{label:"Baseline Samples",value:ne(z.sampleCount||L.length,0)},{label:"Average Deviation From Mean",value:de(M,G)},{label:"Median",value:de(en(L),G)},{label:"Trend Standard Deviation",value:de(Math.sqrt(B),G)}]});return{durationOptions:a,durationInput:n,loadError:d,warningMissing:b,plottedDeviation:E,warningTag:o,plotTitle:F,currentTrend:V,relationshipTrend:U,preAlarmSummary:O,preAlarmEvents:g,relationshipTimeline:R,preAlarmNarrative:$,deviationReport:y,normalizeDurationInput(){n.value=Ht(n.value,a,"6h"),s.value=rt(n.value,a,"6h")}}},methods:{handleHeaderAction(e){e.key==="export-report"&&(this.exportModalOpen=!0)},handleExportFormat(e){if(this.exportModalOpen=!1,e==="csv"){this.exportDeviationCsv();return}this.exportDeviationExcel()},exportDeviationCsv(){const e=this.plottedDeviation||{},t=Ge(`rpulse-maintenance-warning-trend-${e.deviationId||"selected"}`,"rhoPulse Maintenance Warning Trend Report",this.deviationReportSections());this.toast=`Exported ${t}.`},exportDeviationExcel(){const e=this.plottedDeviation||{},t=qe(`rpulse-maintenance-warning-trend-${e.deviationId||"selected"}`,"rhoPulse Maintenance Warning Trend Report",this.deviationReportSections());this.toast=`Exported ${t}.`},deviationReportSections(){const e=this.plottedDeviation||{};return[{title:"Warning Context",rows:[{label:"Warning ID",value:e.deviationId||""},{label:"Asset",value:e.asset||""},{label:"Tag",value:e.tagName||""},{label:"Duration",value:this.durationInput},{label:"Condition",value:e.direction||""}]},{title:"Pre-Alarm Baseline Analysis",rows:[{label:"Summary",value:this.preAlarmNarrative},...this.preAlarmSummary,...this.preAlarmEvents.map(t=>({label:t.label,value:`${t.startLabel}; ${t.durationLabel}; ${t.peakLabel}`}))]},{title:"Calculated Metrics",rows:this.deviationReport},{title:"Trend Data",rows:Bt(this.currentTrend.times,this.currentTrend.series)}]}}},on=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];function ln(e,t){if(t)return"Today";const a=new Date(e);return Number.isNaN(a.getTime())?String(e):`${on[a.getMonth()]} ${a.getDate()}`}const rn={components:{ScreenHeader:j,GridTable:X,TrendChart:We,DurationInput:lt},template:`
    <div class="screen">
      <screen-header
        title="Site Status"
        :subtitle="subtitle"
        status="green"
      />
      <section class="panel site-status-summary-card">
        <div class="site-status-titlebar">
          <h2>Site Status</h2>
          <div class="site-kpi-line" aria-label="Site status summary">
            <span>Assets: <strong>{{ kpis.assets }}</strong></span>
            <i></i>
            <span>Active Alarms: <strong>{{ kpis.activeAlarms }}</strong></span>
            <i></i>
            <span>Maintenance Warnings: <strong>{{ kpis.deviations }}</strong></span>
          </div>
        </div>
      </section>
      <section class="panel site-table-panel">
        <div class="site-table-section">
          <table-context
            title="Asset status table"
            description="Rows show current health, alarm counts, and maintenance warning counts by asset."
            :items="[
              { label: 'Assets', value: kpis.assets },
              { label: 'Active Alarms', value: kpis.activeAlarms },
              { label: 'Warnings', value: kpis.deviations }
            ]"
          />
          <grid-table :rows="rows" :columns="columns" :actions="actions" height="auto" @action="handleAction" @row-open="openAsset" />
        </div>
      </section>
      <section class="panel site-chart-panel">
        <div class="site-chart-section">
          <div class="site-chart-header">
            <div class="site-chart-title">
              <h3>Asset Health Trend</h3>
            </div>
            <div class="site-chart-tools">
              <duration-input
                v-model="durationInput"
                :options="durationOptions"
                list-id="site-duration-options"
                @commit="normalizeDurationInput"
              />
              <div class="site-chart-legend" aria-label="Chart legend">
                <span v-for="item in currentTrend.series" :key="item.name">
                  <i :style="{ '--legend-color': item.color }"></i>{{ item.name }}
                </span>
              </div>
            </div>
          </div>
          <trend-chart
            title=""
            :times="currentTrend.times"
            :series="currentTrend.series"
            height="100%"
            :show-legend="false"
            :show-symbols="true"
            :smooth="false"
            :grid-top="20"
            :grid-bottom="44"
            :y-max="10"
            :y-interval="2"
          />
        </div>
      </section>
    </div>
  `,setup(){const e={red:0,yellow:1,green:2},t=m([]),a=m({assets:0,activeAlarms:0,deviations:0}),s=m([]),n=m(""),i="Asset health by active alarms and maintenance warning state",o=I(()=>n.value||i),r=[{label:"24 Hours",value:"24h"},{label:"7 Days",value:"7d"},{label:"14 Days",value:"14d"}],h={"24h":2,"7d":7,"14d":14},p=m("14 Days");async function d(){try{const b=await It();t.value=[...b.assets].sort((w,T)=>(e[w.status]??99)-(e[T.status]??99)),a.value={assets:b.assetCount,activeAlarms:b.activeAlarmCount,deviations:b.maintenanceWarningCount},s.value=b.trend.points,n.value=""}catch(b){n.value=W(b)?"Data source offline — live telemetry unavailable":`Failed to load site status: ${b.message}`}}return d(),{rows:t,kpis:a,subtitle:o,columns:[{headerName:"Asset",field:"assetName",flex:30,minWidth:190,cellClass:"asset-primary-cell"},{headerName:"Location",field:"location",flex:20,minWidth:150,cellClass:"asset-secondary-cell"},{headerName:"Status",field:"status",cellRenderer:Q,flex:8,minWidth:74,cellClass:"center-cell",cellStyle:{justifyContent:"center",textAlign:"center"},headerClass:"center-header"},{headerName:"Active Alarms",field:"activeAlarms",type:"numeric",flex:12,minWidth:116,cellClass:"metric-cell center-cell",cellStyle:{justifyContent:"center",textAlign:"center"},headerClass:"center-header"},{headerName:"Deviations",field:"baselineDeviations",type:"numeric",flex:12,minWidth:110,cellClass:"metric-cell center-cell",cellStyle:{justifyContent:"center",textAlign:"center"},headerClass:"center-header"}],actions:[{label:"Alarm Detail",route:"asset-alarm-detail"},{label:"Maintenance Warnings",route:"baseline-deviations"}],durationOptions:r,durationInput:p,currentTrend:I(()=>{const b=rt(p.value,r,"14d"),w=h[b]||14,T=s.value.slice(-w);return{times:T.map((A,E)=>ln(A.timestamp,E===T.length-1)),series:[{name:"Active Alarms",data:T.map(A=>A.activeAlarms),color:"#c83d3d"},{name:"Maintenance Warnings",data:T.map(A=>A.warnings),color:"#c89a19"}]}}),normalizeDurationInput(){p.value=Ht(p.value,r,"14d")}}},methods:{handleAction({action:e,row:t}){this.$router.push({name:e.route,query:{asset:t.assetId}})},openAsset(e){this.$router.push({name:"asset-alarm-detail",query:{asset:e?.assetId}})}}};function je(e){return e.name||e.label}const cn={props:["title","subtitle","fields","primaryLabel","load","onSubmit"],components:{ScreenHeader:j},data(){const e={};return(this.fields||[]).forEach(t=>{e[je(t)]=t.type==="multiselect"?[]:t.value??""}),{values:e,loadedOptions:{},toast:"",error:"",loading:!1,saving:!1}},async created(){if(this.load){this.loading=!0;try{const e=await this.load(this.$route)||{},a=e.values!==void 0||e.options!==void 0?e.values||{}:e;Object.entries(a).forEach(([s,n])=>{s in this.values&&n!==void 0&&n!==null&&(this.values[s]=n)}),e.options&&(this.loadedOptions={...this.loadedOptions,...e.options})}catch(e){this.error=W(e)?"Data source offline":e.message||"Failed to load form data."}finally{this.loading=!1}}},methods:{name(e){return je(e)},fieldOptions(e){return this.loadedOptions[je(e)]||e.options||[]},optionValue(e){return e&&typeof e=="object"?e.value:e},optionLabel(e){return e&&typeof e=="object"?e.label:e},async submit(){if(!(!this.onSubmit||this.saving)){this.saving=!0,this.error="",this.toast="";try{const e=await this.onSubmit({...this.values},this.$route);this.toast="Saved.",typeof e=="string"?this.$router.push({name:e}):this.$router.back()}catch(e){this.error=W(e)?"Data source offline":e.message||"Save failed."}finally{this.saving=!1}}}},template:`
    <div class="screen">
      <screen-header :title="title" :subtitle="subtitle" />
      <div v-if="error" class="inline-alert">{{ error }}</div>
      <div v-else-if="toast" class="inline-alert success">{{ toast }}</div>
      <section class="panel">
        <div class="field-grid three">
          <label v-for="field in fields" :key="name(field)" :class="{ wide: field.wide }">
            <span>{{ field.label }}</span>
            <select v-if="field.type === 'select'" v-model="values[name(field)]" :disabled="field.readonly">
              <option v-for="option in fieldOptions(field)" :key="optionValue(option)" :value="optionValue(option)">
                {{ optionLabel(option) }}
              </option>
            </select>
            <select
              v-else-if="field.type === 'multiselect'"
              multiple
              v-model="values[name(field)]"
              :disabled="field.readonly"
              :size="Math.min(Math.max(fieldOptions(field).length, 3), 6)"
            >
              <option v-for="option in fieldOptions(field)" :key="optionValue(option)" :value="optionValue(option)">
                {{ optionLabel(option) }}
              </option>
            </select>
            <textarea
              v-else-if="field.type === 'textarea'"
              rows="3"
              v-model="values[name(field)]"
              :placeholder="field.placeholder || ''"
              :readonly="field.readonly"
            ></textarea>
            <input
              v-else
              :class="field.type === 'numeric' ? 'numeric-input' : 'text-input'"
              :inputmode="field.type === 'numeric' ? 'decimal' : undefined"
              v-model="values[name(field)]"
              :placeholder="field.placeholder || ''"
              :readonly="field.readonly"
            />
          </label>
        </div>
        <div class="form-actions">
          <button type="button" class="secondary" @click="$router.back()">Cancel</button>
          <button type="button" class="primary" :disabled="saving || loading" @click="submit">
            {{ saving ? 'Saving...' : primaryLabel || 'Save' }}
          </button>
        </div>
      </section>
    </div>
  `};function _e(e,t){const a=new Set(t);let s=1;const n=new RegExp(`^${e}-(\\d+)$`);t.forEach(o=>{const r=n.exec(o||"");r&&(s=Math.max(s,Number(r[1])+1))});let i=`${e}-${String(s).padStart(3,"0")}`;for(;a.has(i);)s+=1,i=`${e}-${String(s).padStart(3,"0")}`;return i}const dn=["Viewer","Operator","Maintenance / Reliability","Configurator","System Administrator"],un=["Not Started","Requested","Pending Approval","Renewed"];function Be(e,t,a,s,n="Save",i={}){return{path:"/"+e,name:e,component:cn,meta:{title:t},props:{title:t,subtitle:a,fields:s,primaryLabel:n,load:i.load,onSubmit:i.onSubmit}}}const mn=[{path:"/",redirect:"/login"},{path:"/login",name:"login",component:Ss,meta:{public:!0,title:"Login"}},{path:"/site-status",name:"site-status",component:rn,meta:{title:"Site Status",group:"Operate"}},{path:"/active-alarms",name:"active-alarms",component:Vs,meta:{title:"Active Alarms",group:"Operate"}},{path:"/asset-alarm-detail",name:"asset-alarm-detail",component:Js,meta:{title:"Asset Alarm Detail",group:"Operate"}},{path:"/alarm-data-trends",name:"alarm-data-trends",component:zs,meta:{title:"Alarm Data Trends",group:"Operate"}},{path:"/alarm-history",name:"alarm-history",component:Ks,meta:{title:"Alarm History",group:"Operate"}},{path:"/alarm-history-detail",name:"alarm-history-detail",component:_s,meta:{title:"Alarm History Detail",group:"Operate"}},{path:"/baseline-deviations",name:"baseline-deviations",component:Zs,meta:{title:"Maintenance Warnings",group:"Operate"}},{path:"/data-deviation-trends",name:"data-deviation-trends",component:nn,meta:{title:"Maintenance Warning Trend",group:"Operate"}},{path:"/asset-inventory",name:"asset-inventory",component:Os,meta:{title:"Asset Inventory",group:"Configure"}},{path:"/asset-configuration",name:"asset-configuration",component:Ps,meta:{title:"Asset Configuration",group:"Configure"}},{path:"/connect-tags",name:"connect-tags",component:Fs,meta:{title:"Connect Tags",group:"Configure"}},{path:"/alarm-list",name:"alarm-list",component:Es,meta:{title:"Alarm List",group:"Configure"}},{path:"/alarm-configuration",name:"alarm-configuration",component:$s,meta:{title:"Alarm Configuration",group:"Configure"}},{path:"/group-list",name:"group-list",component:Us,meta:{title:"Group List",group:"Configure"}},{path:"/license-management",name:"license-management",component:Ns,meta:{title:"Application",group:"Admin"}},{path:"/user-admin",name:"user-admin",component:Ms,meta:{title:"Users",group:"Admin"}},{path:"/message-center",name:"message-center",component:Ds,meta:{title:"Messages",group:"Admin"}},Be("new-asset","New Asset","Full-screen add asset flow from the matrix",[{label:"Asset ID",name:"assetId",placeholder:"Blank to auto-generate (AST-###)"},{label:"Asset Name",name:"assetName",placeholder:"Enter asset name"},{label:"Asset Location",name:"location",placeholder:"Physical site location"},{label:"Asset Type",name:"assetType",placeholder:"Line, skid, process area"},{label:"Initial Status",name:"initialStatus",type:"select",options:["Active","Disabled","Commissioning"],value:"Active"},{label:"Baseline Required",name:"baselineRequired",type:"select",options:["Yes","No"],value:"Yes"},{label:"Notes",name:"description",type:"textarea",placeholder:"Configuration notes"}],"Create Asset",{async onSubmit(e){const[t,a]=await Promise.all([Rt(),f.get("/sites")]),s=(e.assetId||"").trim()||_e("AST",t.map(n=>n.assetId));return await ns({code:s,assetName:e.assetName,location:e.location,assetType:e.assetType,description:e.description,enabled:e.initialStatus!=="Disabled",baselineRequired:e.baselineRequired!=="No",site:a.length?{id:a[0].id}:null}),"asset-inventory"}}),Be("group-configuration","Group Configuration","Selected group configuration and group members",[{label:"Group Name",name:"groupName",placeholder:"Enter group name"},{label:"Purpose",name:"purpose",wide:!0,placeholder:"What this group responds to"},{label:"Delivery Methods",name:"delivery",type:"select",options:["Email","SMS","Email, SMS"],value:"Email"},{label:"Active",name:"active",type:"select",options:["Yes","No"],value:"Yes"},{label:"Notes",name:"notes",type:"textarea"}],"Save Group",{async load(e){if(!e.query.group)return{};const t=(await Ae()).find(a=>a.groupId===e.query.group);return t?{groupName:t.groupName,purpose:t.purpose,delivery:t.delivery,active:t.active,notes:t.notes}:{}},async onSubmit(e,t){const a={groupName:e.groupName,purpose:e.purpose,delivery:e.delivery,active:e.active!=="No",notes:e.notes},s=t.query.group;if(s)await La(s,{code:s,...a});else{const n=_e("GRP",(await Ae()).map(i=>i.groupId));await Ra({code:n,...a})}}}),Be("renewal-workflow","Renewal Workflow","Application renewal workflow",[{label:"Current License",name:"code",readonly:!0},{label:"Renewal Status",name:"renewalStatus",type:"select",options:un,value:"Requested"},{label:"Customer Contact",name:"customerContact",placeholder:"Renewal contact"},{label:"Requested Term",name:"requestedTerm",type:"select",options:["12 months","24 months","36 months"],value:"12 months"},{label:"Renewal Note",name:"renewalNote",type:"textarea",wide:!0}],"Submit Renewal",{async load(){const e=await Je();return e?{code:e.code,renewalStatus:e.renewalStatus||"Requested",customerContact:e.customerContact,requestedTerm:e.requestedTerm,renewalNote:e.renewalNote}:{code:"LIC-001"}},async onSubmit(e){const t=await Je();return await xt({code:t?.code||e.code||"LIC-001",customerName:t?.customerName||"",startDate:t?.startDate||"",endDate:t?.endDate||"",status:"Renewal Pending",renewalStatus:e.renewalStatus||"Requested",customerContact:e.customerContact,requestedTerm:e.requestedTerm,renewalNote:e.renewalNote}),"license-management"}}),Be("edit-user","Edit User","User information and authority update",[{label:"User Name",name:"userName",placeholder:"Full name"},{label:"Email",name:"email",placeholder:"name@company.com"},{label:"Phone / SMS",name:"phone",placeholder:"+1 555 0100"},{label:"Role",name:"role",type:"select",options:dn,value:"Viewer"},{label:"Active",name:"active",type:"select",options:["Yes","No"],value:"Yes"},{label:"Notification Preferences",name:"notificationPrefs",type:"select",options:["Email","SMS","Email, SMS"],value:"Email"},{label:"Groups",name:"groups",type:"multiselect",options:[],wide:!0}],"Update User",{async load(e){const a={groups:(await Ae()).map(o=>({value:o.groupId,label:`${o.groupName} (${o.groupId})`}))},s=e.query.user;if(!s)return{values:{},options:a};const[n,i]=await Promise.all([Pa(s),Ua(s)]);return{values:{userName:n.userName,email:n.email,phone:n.phone,role:n.role,active:n.status==="Active"?"Yes":"No",notificationPrefs:n.notifications||"Email",groups:i.map(o=>o.groupId)},options:a}},async onSubmit(e,t){const a=e.notificationPrefs||"",s={userName:e.userName,email:e.email,phone:e.phone,role:e.role,active:e.active!=="No",notificationPrefs:a,emailNotifications:a.includes("Email"),smsNotifications:a.includes("SMS")};let n=t.query.user;n?await Fa(n,{code:n,...s}):(n=_e("USR",(await tt()).map(i=>i.userId)),await Oa({code:n,...s})),await Va(n,e.groups||[])}}),{path:"/:pathMatch(.*)*",redirect:"/site-status"}],pn=fa({history:ba(),routes:mn}),hn={props:{open:{type:Boolean,default:!1},title:{type:String,default:"Export Report"}},emits:["close","select"],template:`
    <div v-if="open" class="modal-layer" @click.self="$emit('close')">
      <div class="modal export-format-modal" role="dialog" aria-modal="true" :aria-label="title">
        <div class="modal-header">
          <h2>{{ title }}</h2>
          <button type="button" class="icon-button modal-close-button" aria-label="Close export options" @click="$emit('close')">x</button>
        </div>
        <div class="modal-body">
          <p class="modal-copy">Choose the file format for this report.</p>
          <div class="export-format-grid">
            <button type="button" class="export-format-option" @click="$emit('select', 'excel')">
              <strong>Excel</strong>
              <span>Formatted report workbook</span>
            </button>
            <button type="button" class="export-format-option" @click="$emit('select', 'csv')">
              <strong>CSV</strong>
              <span>Comma-separated data file</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `};window.agGrid&&window.agGrid.LicenseManager&&window.AG_GRID_LICENSE_KEY&&window.agGrid.LicenseManager.setLicenseKey(window.AG_GRID_LICENSE_KEY);ga(Cs).component("status-badge",we).component("table-context",Ot).component("duration-input",lt).component("export-format-modal",hn).component("grid-table",X).component("trend-chart",We).use(pn).mount("#app");
