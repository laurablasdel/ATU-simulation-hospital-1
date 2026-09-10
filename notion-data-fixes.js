const navigationOnlyRecords=new Set(['notion-2d6195d201d58030a978ecadd5f7e7da','notion-db-2d6195d201d580c2b6d1000b146db021','notion-db-2d6195d201d580e18888000b6b8ba532']);
window.NOTION_CHARTS=(window.NOTION_CHARTS||[]).filter(record=>!navigationOnlyRecords.has(record.id));
for(const record of window.NOTION_CHARTS){
  if(/lab|xray|x-ray|radiology|blood bank|diagnostic/i.test(record.title||""))record.category="labs";
  if(/\border(s)?\b/i.test(record.title||""))record.category="orders";
  if(/medication administration|\bMAR\b/i.test(record.title||""))record.category="mar";
}
