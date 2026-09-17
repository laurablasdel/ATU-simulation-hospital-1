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
console.log('PASS: all three label sizes and numeric codes; current base dates with DOB retained; released order on MAR; navigation warning and named-field drafts.');setTimeout(()=>w.close(),200);
