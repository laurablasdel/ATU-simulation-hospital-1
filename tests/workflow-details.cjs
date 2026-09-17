const assert=require('assert'),boot=require('./boot.cjs'),w=boot(),a=w.testApp,$=id=>w.document.getElementById(id);
w.sessionStorage.setItem('atuEhrTabMode','faculty');a.setPatient('stephanie-smith');a.setView('barcodes');w.renderBarcodeCenter();const card=w.document.querySelector('[data-med-label]');assert(card);let html='';w.open=()=>({document:{write:s=>html=s,close:()=>{}}});for(const [size,width] of [['extraSmall','1.5'],['small','2'],['medium','2.625']]){card.querySelector('.medSize').value=size;card.querySelector('.printMed').click();assert(html.includes(`width:${width}in`));assert(/>\d{4}<\/text>/.test(html));}
const now=new Date(),date=`${String(now.getMonth()+1).padStart(2,'0')}/${String(now.getDate()).padStart(2,'0')}/${now.getFullYear()}`;
const content=w.renderChartDoc('Date: 02/24/2025\nDOB: 07/14/2000');assert(content.includes(date));assert(content.includes('07/14/2000'));
// Released linked orders enter the MAR; pending orders stay out.
a.setPatient('stephanie-smith');a.setView('mar');w.sessionStorage.setItem('atuEhrTabMode','student');w.renderMAR();assert(!$('view').textContent.includes('Acetaminophen'));
const order=a.state.releaseQueue.find(q=>q.chartRecordId==='admin-stephanie-acetaminophen');w.releaseItem(order.id);w.renderMAR();assert($('view').textContent.includes('Acetaminophen'));assert($('view').textContent.includes('650 mg'));
// Draft warning stops navigation when learner chooses Cancel.
a.setView('notes');w.render();$('nNarrative').value='unfinished';$('nNarrative').dispatchEvent(new w.Event('input',{bubbles:true}));w.confirm=()=>false;w.document.querySelector('aside [data-view="io"]').click();assert($('nNarrative'));assert.equal($('nNarrative').value,'unfinished');
// Named assessment fields are preserved through a redraw too.
w.clearCurrentViewDraft();a.setView('assessments');w.render();const named=w.document.querySelector('#view input[name]');if(named){named.value='draft assessment';named.dispatchEvent(new w.Event('input',{bubbles:true}));w.saveCurrentViewDraft();w.render();assert([...w.document.querySelectorAll('#view input[name]')].some(e=>e.value==='draft assessment'));}
// Jane keeps her released pre-op medications while each later medication remains separately pending.
const janeMeds=a.state.medicationCatalog.filter(m=>m.patientId==='jane-fowler'),janePending=a.state.releaseQueue.filter(q=>q.patientId==='jane-fowler'&&q.status==='pending');
for(const name of ['Cefazolin (Ancef)','Metoclopramide (Reglan)','Midazolam (Versed)']){const med=janeMeds.find(m=>m.name===name);assert(med);assert.equal(med.releaseStatus,'released');}
for(const name of ['Morphine sulfate (Duramorph)','Ondansetron (Zofran)','Naloxone (Narcan)','Ketorolac (Toradol)']){const med=janeMeds.find(m=>m.name===name);assert(med);assert.equal(med.releaseStatus,'pending');assert(janePending.some(q=>q.title.includes(name)));}
assert(!janeMeds.some(m=>m.sourceOrderId&&janeMeds.some(other=>other!==m&&!other.sourceOrderId&&other.name.split(' (')[0]===m.name.split(' (')[0])));
const janeShift2=a.records.find(r=>r.id==='chart-2d6195d201d58030b0ded95695bbcb1e');assert(janeShift2);assert(!/Morphine|Ondansetron|Zofran/.test(janeShift2.content));
assert(!a.records.some(r=>r.id==='chart-2d6195d201d58013a186edd649f28647'||r.id==='chart-form-jane-fowler'));
a.setPatient('jane-fowler');a.setView('summary');w.render();const janeSummary=$('view').textContent;
for(const removed of ['Opioid respiratory depression','Simulation complication','Patient Summary'])assert(!janeSummary.includes(removed));
const janeAdmission=a.records.find(r=>r.id==='chart-1d0195d201d581b98e64df9f11bd51d4');assert(janeAdmission);assert(janeAdmission.content.includes('\n\n### Past Medical History\n\n'));assert(!janeAdmission.content.includes('<columns>'));
assert(!a.records.some(r=>r.id==='chart-2d6195d201d580a19062cdbe1706684f'));
a.setView('surgery');w.render();assert($('jpf-procedure'));assert($('jpc-identifiers'));assert($('jpc-surgicalConsent'));assert($('jpc-jewelry'));assert($('jpf-readiness'));assert.equal($('jpf-lastSolid').type,'datetime-local');assert.equal($('jpf-lastClearLiquids').type,'datetime-local');
$('janeChecklistStudent').value='RN Test';$('jpc-identifiers').checked=true;$('jpf-procedure').value='Matches patient statement, consent, and schedule';$('jpf-readiness').value='Ready for OR';$('saveJaneChecklist').click();
const savedChecklist=a.state.surgicalChecklist.find(x=>x.patientId==='jane-fowler');assert(savedChecklist);assert(savedChecklist.checks.identifiers);assert.equal(savedChecklist.fields.readiness,'Ready for OR');assert.equal(savedChecklist.student,'RN Test');
w.renderSurgery();assert.equal($('jpf-readiness').value,'Ready for OR');assert($('jpc-identifiers').checked);
console.log('PASS: labels/codes/dates/drafts; Jane medications, summary cleanup, note spacing, and interactive pre-op checklist.');setTimeout(()=>w.close(),200);
