/* Faculty-controlled chart editing, staged releases, shift MARs, and blood scanning. */
(function(){
const removeIds=new Set([
 'chart-1d0195d201d5810a9acac8451e662014','chart-1d0195d201d5818b8449cd92cc20db7b',
 'chart-279195d201d580c18d3bcf4493eb6d56','chart-27e195d201d580188376fefb97c68085',
 'chart-1d0195d201d581a696f3d43f99ff1b11'
]);
const changes={
 'chart-27e195d201d5801891bbde543471af1e':{status:'pending',title:'Shift 3 New Orders'},
 'chart-279195d201d5800895eec1b283799808':{status:'pending',title:'Shift 3 Labs'},
 'chart-279195d201d5804db220dbde566bd41d':{status:'pending',title:'Shift 4 Urinalysis'},
 'chart-279195d201d580b1a707ddf4a2e70068':{status:'pending',title:'Shift 2 Labs'},
 'chart-1d0195d201d5812d9d21cf4f7bac2e52':{title:'Admission Labs'},
 'chart-286195d201d580489c7bc8e0770135bf':{status:'pending',title:'MD Orders',content:'**Provider Orders — Pending**\n\n- Racepinephrine 2.25% inhalation solution, 0.5 mL mixed with 3 mL of 0.9% Normal Saline, to be given by respiratory therapy. Call respiratory when needed.\n- Dexamethasone 0.6 mg/kg IV now.'},
 'chart-256195d201d581aebb87f3902a0c5bc0':{status:'pending',title:'Chest X-ray and Radiology Report'}
};
const added=[
 {id:'admin-jane-respiratory',patientId:'jane-fowler',title:'Respiratory Depression — MD Orders',category:'orders',status:'pending',content:'Respiratory depression change in condition. Release to MD Orders when the scenario reaches this stage. Assess airway and breathing, support ventilation, notify provider, and administer reversal agent only per provider order.'},
 {id:'admin-baby-cxr-order',patientId:'baby-boy-sung',title:'Chest X-ray Order',category:'orders',status:'pending',content:'Chest X-ray. Provider: Dr. Craig.'},
 {id:'admin-sanogo-pph-meds',patientId:'fatima-sanogo',title:'Postpartum Hemorrhage Medication Orders',category:'orders',status:'pending',content:'If hemorrhage is suspected, call MD with assessment findings and bleeding amounts for specific medication orders. Expected orders from Dr. Darnell:\n\n1. Methylergonovine (Methergine) 0.2 mg IM every 2–4 hours as needed.\n2. Carboprost (Hemabate) 250 mcg IM every 15–90 minutes as needed; maximum approximately 2 mg total. Specific provider order required before administration.\n3. Misoprostol 600–1000 mcg PR / SL / PO as needed per protocol. Specific provider order required before administration.\n4. Tranexamic Acid (TXA) 1 g IV over 10 minutes once postpartum hemorrhage is diagnosed. May repeat 1 g after 30 minutes–24 hours if bleeding persists, per protocol. Specific provider order required before administration.'},
 {id:'admin-sanogo-followup',patientId:'fatima-sanogo',title:'Postpartum Hemorrhage Follow-up Orders',category:'orders',status:'pending',content:'Provider: Dr. Darnell/KR\n\n- CBC in 6 hours\n- Foley catheter\n- Fundus checks every 15 minutes'}
];
const charlesMeds=[
 ['Lisinopril 20 mg','PO','0900'],['Metoprolol 50 mg','PO','0900'],['Amiodarone 200 mg','PO','0900'],
 ['Digoxin 0.125 mg','PO','0900'],['Metformin 1000 mg','PO','0800'],['Warfarin 2.5 mg','PO','2100'],
 ['Insulin per AC/HS sliding scale','Subcutaneous','AC/HS']
];
for(let shift=1;shift<=4;shift++)added.push({id:`admin-charles-mar-${shift}`,patientId:'charles-jones',title:`MAR — Shift ${shift}`,category:'mar',status:shift===1?'released':'pending',content:`**${shift===1||shift===3?'Day Shift (7 AM–7 PM)':'Night Shift (7 PM–7 AM)'}**\n\n${charlesMeds.filter(m=>(shift===1||shift===3)?m[2]!=='2100':m[2]==='2100'||m[2]==='AC/HS').map(m=>`- ${m[0]} | ${m[1]} | Due ${m[2]}`).join('\n')}`});

window.prepareAdminChartData=function(){
 for(let i=CHART_RECORDS.length-1;i>=0;i--)if(removeIds.has(CHART_RECORDS[i].id))CHART_RECORDS.splice(i,1);
 for(const record of CHART_RECORDS){if(changes[record.id])Object.assign(record,changes[record.id]);record.content=String(record.content||'').replace(/^#\s*$/gm,'').replace(/(?:<br>\s*){3,}/gi,'<br><br>').replace(/\n{3,}/g,'\n\n');}
 const amelia=CHART_RECORDS.find(r=>r.patientId==='amelia-sung'&&r.category==='orders');
 if(amelia)amelia.content=amelia.content.replace(/No additional orders entered\. Record new provider orders in the Provider Orders section\.?/gi,'').trim();
 const babyOrders=CHART_RECORDS.find(r=>r.id==='chart-256195d201d5815b8c66c36fd7f6f9b9');
 if(babyOrders)babyOrders.content=babyOrders.content.replace(/^.*Chest\s*[Xx]-?ray.*(?:Laney|Darrelle).*$/gmi,'').replace(/Laney/gi,'Craig');
 const sanogo=CHART_RECORDS.find(r=>r.id==='chart-28b195d201d5805ca4d1c8978c9278be');
 if(sanogo)sanogo.content=sanogo.content.split(/If hemorrhage is suspected/i)[0].replace(/(?:cbc in 6 hrs|foley cath|15 min fundus checks)[\s\S]*/i,'').trim();
 for(const item of added)if(!CHART_RECORDS.some(r=>r.id===item.id))CHART_RECORDS.push({...item});
};

function sendReleaseMessage(item){
 if(item.kind==='message')return;
 const record=item.chartRecordId&&CHART_RECORDS.find(r=>r.id===item.chartRecordId),destination=record?.category==='orders'||item.kind==='order'?'Orders':record?.category==='mar'?'MAR':'Labs / Diagnostics';
 state.messages ||= [];
 if(state.messages.some(m=>m.releaseItemId===item.id))return;
 state.messages.push({id:uid('msg'),patientId:item.patientId,at:item.releasedAt||nowLocal(),from:'Faculty',to:'Student',subject:`New ${destination==='Orders'?'order':destination==='MAR'?'MAR sheet':'result'} released`,message:`${item.title} is now available in the ${destination} tab.`,read:false,releaseItemId:item.id});
}
function renderBloodAdministration(){
 if(!requirePatient())return;
 const p=activePatient();
 if(!['fatima-sanogo','stephanie-smith'].includes(p.id)){document.getElementById('view').innerHTML=panel('Blood Administration','No blood administration record is assigned to this patient.');return;}
 const rows=patientRows(state.bloodAdministration).slice().reverse();
 document.getElementById('view').innerHTML=panel('Blood Product Scanning & Administration',`<div class="grid3">
 <label>Product<select id="baProduct"><option>Packed red blood cells</option><option>Fresh frozen plasma</option><option>Platelets</option><option>Cryoprecipitate</option></select></label>
 <label>Unit / Donation Number<input id="baUnit"></label><label>Scan Barcode<input id="baBarcode" placeholder="Scan or enter barcode"></label>
 <label>Patient ID Verification<input id="baPatient" value="${esc(p.mrn)}"></label><label>Blood Type / Compatibility<input id="baType"></label><label>Expiration<input id="baExpiry" type="datetime-local"></label>
 <label>Start Time<input id="baStart" type="datetime-local" value="${nowLocal()}"></label><label>End Time<input id="baEnd" type="datetime-local"></label><label>Volume mL<input id="baVolume" type="number"></label>
 <label>Administered By<input id="baStudent"></label><label>Verified By<input id="baVerifier"></label><label>Reaction<select id="baReaction"><option>None</option><option>Suspected reaction—stopped</option><option>Confirmed reaction—stopped</option></select></label>
 <label>Baseline Vitals<input id="baBase" placeholder="T / HR / RR / BP / SpO₂"></label><label>15-minute Vitals<input id="ba15" placeholder="T / HR / RR / BP / SpO₂"></label><label>Completion Vitals<input id="baEndVitals" placeholder="T / HR / RR / BP / SpO₂"></label>
 <label class="wide">Response / Notes<textarea id="baNotes"></textarea></label></div><div class="actions"><button id="baVerify" class="secondary">Verify Scan</button><button id="baSave" class="primary">Save Blood Administration</button></div>`)+panel('Blood Administration Record',`<table><thead><tr><th>Start</th><th>Product / Unit</th><th>Barcode</th><th>Volume</th><th>Reaction</th><th>Administered / Verified</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r.startTime)}</td><td>${esc(r.product)}<br>${esc(r.unit)}</td><td>${esc(r.barcode)}</td><td>${esc(r.volume)} mL</td><td>${esc(r.reaction||'None')}</td><td>${esc(r.student)} / ${esc(r.verifiedBy)}</td></tr>`).join('')||'<tr><td colspan="6">No blood products documented.</td></tr>'}</tbody></table>`);
 baVerify.onclick=()=>{if(!baBarcode.value.trim()||baPatient.value.trim()!==String(p.mrn)){alert('Scan the unit and verify the patient MRN.');return}alert('Patient and blood-product scan verified. Complete the independent verifier check before administration.');};
 baSave.onclick=()=>{if(!baUnit.value.trim()||!baBarcode.value.trim()||!baStudent.value.trim()||!baVerifier.value.trim()){alert('Unit, barcode, administering clinician, and independent verifier are required.');return}state.bloodAdministration.push({id:uid('blood'),patientId:p.id,product:baProduct.value,unit:baUnit.value.trim(),barcode:baBarcode.value.trim(),patientVerification:baPatient.value.trim(),bloodType:baType.value.trim(),expiry:baExpiry.value,startTime:baStart.value,endTime:baEnd.value,volume:baVolume.value,student:baStudent.value.trim(),verifiedBy:baVerifier.value.trim(),reaction:baReaction.value,baselineVitals:baBase.value.trim(),fifteenMinuteVitals:ba15.value.trim(),completionVitals:baEndVitals.value.trim(),response:baNotes.value.trim()});audit('Blood product administration',p.id,`${baProduct.value}, unit ${baUnit.value.trim()}, verified by ${baVerifier.value.trim()}`);renderBloodAdministration();};
}
window.renderBloodAdministration=renderBloodAdministration;

window.initializeAdminEnhancements=function(){
 state.chartContentEdits ||= {};state.marVisibility ||= {};
 for(const [id,edit] of Object.entries(state.chartContentEdits)){const r=CHART_RECORDS.find(x=>x.id===id);if(r)Object.assign(r,edit);}
 const baseRelease=releaseItem;releaseItem=function(id){const item=(state.releaseQueue||[]).find(x=>x.id===id),record=item?.chartRecordId&&CHART_RECORDS.find(r=>r.id===item.chartRecordId);if(record)item.kind=record.category==='orders'?'order':record.category==='mar'?'mar':'result';baseRelease(id);if(item&&item.status==='released'){const n=(state.notifications||[]).find(x=>x.releaseItemId===item.id);if(n&&record?.category==='mar'){n.title='New MAR Sheet';n.type='mar';}sendReleaseMessage(item);save();}};
 const baseSummary=renderSummary;renderSummary=function(){baseSummary();[...document.querySelectorAll('.panel')].find(x=>x.querySelector('h2')?.textContent.includes('Recent Chart Activity'))?.remove();};
 const baseSurgery=renderSurgery;renderSurgery=function(){baseSurgery();[...document.querySelectorAll('.panel')].find(x=>x.querySelector('h2')?.textContent==='Scenario Progression')?.remove();};
 const baseFlows=renderFlowsheets;renderFlowsheets=function(){baseFlows();document.querySelectorAll('#view details').forEach(d=>d.open=true);};
 const baseIO=renderIO;renderIO=function(){baseIO();document.querySelectorAll('#view details').forEach(d=>d.open=true);};
 const baseMAR=renderMAR;renderMAR=function(){
  if(!isFaculty()&&state.marVisibility[activePatientId]===false){document.getElementById('view').innerHTML=panel('MAR','The MAR is hidden by faculty for this simulation.');return;}
  baseMAR();
  document.getElementById('view').insertAdjacentHTML('afterbegin',panel('Medication Scanning',`<div class="grid3"><label>Scan Patient Wristband<input id="marPatientScan" placeholder="MRN / wristband barcode"></label><label>Scan Medication<input id="marMedicationScan" placeholder="Medication barcode"></label><label>Due Shift<select id="marShift"><option>Shift 1 — Day</option><option>Shift 2 — Night</option><option>Shift 3 — Day</option><option>Shift 4 — Night</option></select></label></div><div class="actions"><button id="verifyMarScan" class="primary">Verify Patient & Medication</button></div><div id="marScanResult" class="note" role="status"></div>`));
  verifyMarScan.onclick=()=>{const valid=marPatientScan.value.trim()===String(activePatient().mrn)&&marMedicationScan.value.trim();marScanResult.className=valid?'success':'warn';marScanResult.textContent=valid?'Scan verified. Complete pre-assessment, education, and administration documentation below.':'Patient wristband or medication barcode does not match.';};
 };
 const baseFaculty=renderFaculty;renderFaculty=function(){
  baseFaculty();if(!isFaculty()||!activePatient())return;
  const records=CHART_RECORDS.filter(r=>r.patientId===activePatientId);
  document.getElementById('view').insertAdjacentHTML('beforeend',panel('Editable Chart Content',`<div class="actions"><label style="display:flex;align-items:center;gap:8px"><input id="facultyMarVisible" type="checkbox" style="width:auto" ${state.marVisibility[activePatientId]!==false?'checked':''}> Show MAR to students</label></div><div class="note">Edit, pend, release, or delete any content area for this patient.</div>${records.map(r=>`<div class="releaseCard" data-admin-record="${esc(r.id)}"><div class="grid3"><label>Title<input class="adminTitle" value="${esc(r.title)}"></label><label>Section<select class="adminCategory">${['summary','notes','prenatal','labor','surgery','assessments','flowsheets','io','orders','labs','mar','documents'].map(c=>`<option ${c===r.category?'selected':''}>${c}</option>`).join('')}</select></label><label>Status<select class="adminStatus"><option ${r.status==='released'?'selected':''}>released</option><option ${r.status==='pending'?'selected':''}>pending</option></select></label><label class="wide">Content<textarea class="adminContent">${esc(r.content)}</textarea></label></div><div class="actions"><button class="primary adminSave">Save Edit</button><button class="secondary adminPend">Make Pending</button><button class="secondary adminRelease">Release</button><button class="danger adminDelete">Delete</button></div></div>`).join('')||'<div class="note">No imported content areas for this patient.</div>'}`));
  const liveCollections=['orders','labs','notes','vitals','io','assessments','mar','laborProgress','postpartumRecovery','pphPads','pphMedications','bloodAdministration','surgicalChecklist','surgicalAssessments'];
  const liveRows=liveCollections.flatMap(collection=>(state[collection]||[]).filter(row=>row.patientId===activePatientId).map(row=>({collection,row})));
  document.getElementById('view').insertAdjacentHTML('beforeend',panel('Editable Live Data',`<div class="note">Faculty can correct or delete student-entered and released chart data.</div>${liveRows.map(({collection,row})=>`<div class="releaseCard" data-live-collection="${collection}" data-live-id="${esc(row.id)}"><b>${esc(collection)}</b><textarea class="liveJson" style="min-height:110px">${esc(JSON.stringify(row,null,2))}</textarea><div class="actions"><button class="primary liveSaveRow">Save Edit</button>${['orders','labs','mar'].includes(collection)?'<button class="secondary livePendRow">Move to Pending</button>':''}<button class="danger liveDeleteRow">Delete</button></div></div>`).join('')||'<div class="note">No live entries have been charted for this patient.</div>'}`));
  facultyMarVisible.onchange=()=>{state.marVisibility[activePatientId]=facultyMarVisible.checked;liveSave('mar_visibility_changed',{patientId:activePatientId});};
  document.querySelectorAll('[data-admin-record]').forEach(card=>{const id=card.dataset.adminRecord,record=CHART_RECORDS.find(r=>r.id===id);const persist=status=>{Object.assign(record,{title:card.querySelector('.adminTitle').value.trim(),category:card.querySelector('.adminCategory').value,status:status||card.querySelector('.adminStatus').value,content:card.querySelector('.adminContent').value.trim()});state.chartContentEdits[id]={title:record.title,category:record.category,status:record.status,content:record.content};let q=(state.releaseQueue||[]).find(x=>x.chartRecordId===id);if(record.status==='pending'){if(!q){q=queueRelease(record.category==='orders'?'order':'result',record.patientId,record.title,record.content,{chartRecordId:id});}q.status='pending';q.title=record.title;q.content=record.content;}else if(q&&q.status==='pending')releaseItem(q.id);liveSave('chart_content_changed',{patientId:record.patientId,recordId:id});renderFaculty();};card.querySelector('.adminSave').onclick=()=>persist();card.querySelector('.adminPend').onclick=()=>persist('pending');card.querySelector('.adminRelease').onclick=()=>persist('released');card.querySelector('.adminDelete').onclick=()=>{if(!confirm(`Delete ${record.title}?`))return;CHART_RECORDS.splice(CHART_RECORDS.indexOf(record),1);delete state.chartContentEdits[id];state.releaseQueue=(state.releaseQueue||[]).filter(x=>x.chartRecordId!==id);liveSave('chart_content_deleted',{patientId:activePatientId,recordId:id});renderFaculty();};});
  document.querySelectorAll('[data-live-collection]').forEach(card=>{const collection=card.dataset.liveCollection,id=card.dataset.liveId;const getRow=()=>state[collection].find(x=>x.id===id);card.querySelector('.liveSaveRow').onclick=()=>{try{const edited=JSON.parse(card.querySelector('.liveJson').value);Object.assign(getRow(),edited,{id,patientId:activePatientId});audit('Faculty edited chart data',activePatientId,`${collection}: ${id}`);renderFaculty();}catch(e){alert('Enter valid chart data. Check quotation marks and commas.');}};card.querySelector('.liveDeleteRow').onclick=()=>{if(!confirm('Delete this chart entry?'))return;state[collection]=state[collection].filter(x=>x.id!==id);audit('Faculty deleted chart data',activePatientId,`${collection}: ${id}`);renderFaculty();};const pend=card.querySelector('.livePendRow');if(pend)pend.onclick=()=>{const row=getRow(),kind=collection==='orders'?'order':'result',title=row.test||row.medication||row.text||`${collection} entry`,content=row.result||row.text||row.medication||JSON.stringify(row);state[collection]=state[collection].filter(x=>x.id!==id);queueRelease(kind,activePatientId,title,content,{provider:row.provider,orderType:row.type,flag:row.flag});renderFaculty();};});
 };
 const baseMenu=applyPatientMenu;applyPatientMenu=function(){baseMenu();document.querySelector('[data-view="labor"]')?.classList.toggle('hiddenByPatient',activePatientId==='baby-boy-sung'||!((PATIENT_SPECIALTY_VIEWS[activePatientId]||[]).includes('labor')));};
};
})();
