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
console.log('PASS: labels/codes/dates/drafts; Jane released pre-op meds and individual pending later meds.');setTimeout(()=>w.close(),200);
