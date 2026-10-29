'use strict';
document.addEventListener('DOMContentLoaded',()=>{
const analyser=new OpkPackAnalyser();
let currentReport=null;
let currentRawBytes=null;
const dropZone=document.getElementById('drop-zone');
const fileInput=document.getElementById('file-input');
const btnBrowse=document.getElementById('btn-browse');
const dashboardSection=document.getElementById('dashboard-section');
const tabsNav=document.getElementById('tabs-nav');
const modalBackdrop=document.getElementById('modal-hex');
const modalTitle=document.getElementById('modal-title');
const modalBody=document.getElementById('modal-body');
const btnCloseModal=document.getElementById('btn-close-modal');
const recordSearch=document.getElementById('record-search');
const recordFilterType=document.getElementById('record-filter-type');
const registry=new PackRegistry();
let currentModalEntry=null;
const registryMatchBanner=document.getElementById('registry-match-banner');
const countRegistryBadge=document.getElementById('count-registry');
const registryStatsBadge=document.getElementById('registry-stats-badge');
const registryActiveCard=document.getElementById('registry-active-card');
const registryTableBody=document.getElementById('registry-table-body');
const registryFilterCount=document.getElementById('registry-filter-count');
const registrySearch=document.getElementById('registry-search');
const registryFilterSource=document.getElementById('registry-filter-source');
const btnLoadReference=document.getElementById('btn-load-reference');
const btnAddCurrentPack=document.getElementById('btn-add-current-pack');
const btnImportRegistry=document.getElementById('btn-import-registry');
const registryImportFile=document.getElementById('registry-import-file');
const btnExportRegistry=document.getElementById('btn-export-registry');
const btnClearRegistry=document.getElementById('btn-clear-registry');
const modalPackName=document.getElementById('modal-pack-name');
const modalPackTitle=document.getElementById('modal-pack-title');
const btnClosePackModal=document.getElementById('btn-close-pack-modal');
const btnCancelPackModal=document.getElementById('btn-cancel-pack-modal');
const btnSavePackModal=document.getElementById('btn-save-pack-modal');
const editPackId=document.getElementById('edit-pack-id');
const editPackName=document.getElementById('edit-pack-name');
const editPackFilename=document.getElementById('edit-pack-filename');
const editPackHashesPreview=document.getElementById('edit-pack-hashes-preview');
const editPackNotes=document.getElementById('edit-pack-notes');
const btnThemeToggle=document.getElementById('btn-theme-toggle');
const themeIconSun=document.getElementById('theme-icon-sun');
const themeIconMoon=document.getElementById('theme-icon-moon');
const themeToggleText=document.getElementById('theme-toggle-text');
function applyTheme(theme){
document.documentElement.setAttribute('data-theme',theme);
try{
localStorage.setItem('opk_theme',theme);
}catch(e){}
if(theme==='light'){
if(themeIconSun)themeIconSun.style.display='none';
if(themeIconMoon)themeIconMoon.style.display='inline-block';
if(themeToggleText)themeToggleText.innerText='Dark';
if(btnThemeToggle){
btnThemeToggle.title='Switch to Dark Mode';
btnThemeToggle.setAttribute('aria-label','Switch to Dark Mode');
}
}else{
if(themeIconSun)themeIconSun.style.display='inline-block';
if(themeIconMoon)themeIconMoon.style.display='none';
if(themeToggleText)themeToggleText.innerText='Light';
if(btnThemeToggle){
btnThemeToggle.title='Switch to Light Mode';
btnThemeToggle.setAttribute('aria-label','Switch to Light Mode');
}
}
}
let initialTheme='dark';
try{
const saved=localStorage.getItem('opk_theme');
if(saved==='light'||saved==='dark'){
initialTheme=saved;
}else if(window.matchMedia&&window.matchMedia('(prefers-color-scheme: light)').matches){
initialTheme='light';
}
}catch(e){
initialTheme='dark';
}
applyTheme(initialTheme);
if(btnThemeToggle){
btnThemeToggle.addEventListener('click',(e)=>{
e.stopPropagation();
const currentTheme=document.documentElement.getAttribute('data-theme')||'dark';
const newTheme=currentTheme==='light'?'dark':'light';
applyTheme(newTheme);
});
}
if(btnBrowse){
btnBrowse.addEventListener('click',(e)=>{
e.stopPropagation();
fileInput.click();
});
btnBrowse.addEventListener('dragover',(e)=>{
e.preventDefault();
e.stopPropagation();
e.dataTransfer.dropEffect='copy';
btnBrowse.classList.add('dragover');
});
btnBrowse.addEventListener('dragleave',(e)=>{
e.preventDefault();
e.stopPropagation();
btnBrowse.classList.remove('dragover');
});
btnBrowse.addEventListener('drop',(e)=>{
e.preventDefault();
e.stopPropagation();
btnBrowse.classList.remove('dragover');
if(e.dataTransfer.files&&e.dataTransfer.files.length>0){
handleFile(e.dataTransfer.files[0]);
}
});
}
if(dropZone){
dropZone.addEventListener('click',()=>{
fileInput.click();
});
dropZone.addEventListener('dragover',(e)=>{
e.preventDefault();
dropZone.classList.add('dragover');
});
dropZone.addEventListener('dragleave',()=>{
dropZone.classList.remove('dragover');
});
dropZone.addEventListener('drop',(e)=>{
e.preventDefault();
dropZone.classList.remove('dragover');
if(e.dataTransfer.files&&e.dataTransfer.files.length>0){
handleFile(e.dataTransfer.files[0]);
}
});
}
if(fileInput){
fileInput.addEventListener('change',(e)=>{
if(e.target.files&&e.target.files.length>0){
handleFile(e.target.files[0]);
}
});
}
function handleFile(file){
const reader=new FileReader();
reader.onload=(e)=>{
const buffer=e.target.result;
processBuffer(buffer,file.name);
};
reader.readAsArrayBuffer(file);
}
function processBuffer(buffer,filename){
currentRawBytes=new Uint8Array(buffer);
currentReport=analyser.analyse(buffer,filename);
renderReport(currentReport);
}
const btnTabsLeft=document.getElementById('btn-tabs-scroll-left');
const btnTabsRight=document.getElementById('btn-tabs-scroll-right');
function updateTabsScrollButtons(){
if(!tabsNav||!btnTabsLeft||!btnTabsRight)return;
const maxScroll=tabsNav.scrollWidth-tabsNav.clientWidth;
if(maxScroll<=4){
btnTabsLeft.style.display='none';
btnTabsRight.style.display='none';
return;
}
btnTabsLeft.style.display='flex';
btnTabsRight.style.display='flex';
btnTabsLeft.disabled=tabsNav.scrollLeft<=4;
btnTabsRight.disabled=tabsNav.scrollLeft>=maxScroll-4;
}
if(btnTabsLeft){
btnTabsLeft.addEventListener('click',()=>{
if(!tabsNav)return;
tabsNav.scrollBy({left:-220,behavior:'smooth'});
});
}
if(btnTabsRight){
btnTabsRight.addEventListener('click',()=>{
if(!tabsNav)return;
tabsNav.scrollBy({left:220,behavior:'smooth'});
});
}
if(tabsNav){
tabsNav.addEventListener('click',(e)=>{
const targetBtn=e.target.closest('.tab-btn');
if(!targetBtn)return;
const targetTabId=targetBtn.getAttribute('data-tab');
document.querySelectorAll('.tab-btn').forEach(btn=>btn.classList.remove('active'));
targetBtn.classList.add('active');
targetBtn.scrollIntoView({behavior:'smooth',block:'nearest',inline:'nearest'});
document.querySelectorAll('.tab-pane').forEach(pane=>{
if(pane.id===targetTabId){
pane.classList.add('active');
}else{
pane.classList.remove('active');
}
});
setTimeout(updateTabsScrollButtons,350);
});
tabsNav.addEventListener('scroll',()=>{
updateTabsScrollButtons();
});
tabsNav.addEventListener('wheel',(e)=>{
if(e.deltaY!==0&&!e.shiftKey){
e.preventDefault();
tabsNav.scrollLeft+=e.deltaY;
}
},{passive:false});
}
window.addEventListener('resize',()=>{
updateTabsScrollButtons();
});
function renderReport(report){
if(!report)return;
dashboardSection.style.display='flex';
const elFilename=document.getElementById('metric-filename');
if(elFilename)elFilename.innerText=report.filename;
const elFilesize=document.getElementById('metric-filesize');
if(elFilesize)elFilesize.innerText=`${report.totalFileSize.toLocaleString()} B (${(report.totalFileSize/1024).toFixed(1)} KB)`;
const elFormat=document.getElementById('metric-format');
if(elFormat){
let formatText=report.header.isFlashpack?'Flashpack (EEPROM)':(report.header.flags.bit1_eprom?'EPROM Datapak':'RAMpak');
if(report.header.isPaged)formatText+=' · Paged';
if(report.header.isBootable)formatText+=' · Bootable';
elFormat.innerText=formatText;
}
const elCapacity=document.getElementById('metric-capacity');
if(elCapacity)elCapacity.innerText=`${report.header.capacityKb} KB (${report.header.capacityBytes.toLocaleString()} B)`;
const elUsed=document.getElementById('metric-used');
if(elUsed)elUsed.innerText=`${report.summary.usedBytes.toLocaleString()} B (${report.summary.utilizationPercent}%)`;
const verdictPill=document.getElementById('metric-verdict');
if(verdictPill){
if(report.verdict==='CLEAN'){
verdictPill.className='status-pill status-clean';
verdictPill.innerText='HEALTHY / VALID';
}else if(report.verdict==='WARNINGS'){
verdictPill.className='status-pill status-warnings';
verdictPill.innerText='WARNINGS DETECTED';
}else{
verdictPill.className='status-pill status-critical';
verdictPill.innerText='CRITICAL ANOMALIES';
}
}
const elCensusTotal=document.getElementById('metric-records-total');
if(elCensusTotal)elCensusTotal.innerText=report.summary.totalRecords.toLocaleString();
const elProcs=document.getElementById('metric-procs');
if(elProcs)elProcs.innerText=`${report.summary.proceduresCount} Procedures`;
const elDatafiles=document.getElementById('metric-datafiles');
if(elDatafiles)elDatafiles.innerText=`${report.summary.dataFilesCount} Data Files (${report.summary.dataRecordsCount} data records)`;
const elNotepads=document.getElementById('metric-notepads');
if(elNotepads)elNotepads.innerText=`${report.summary.notepadsCount} Notepads`;
const elCountCrit=document.getElementById('count-diag-crit');
if(elCountCrit)elCountCrit.innerText=report.diagnostics.filter(d=>d.level==='critical').length;
const elCountRecords=document.getElementById('count-records');
if(elCountRecords)elCountRecords.innerText=report.records.length;
const elCountCollisions=document.getElementById('count-collisions');
if(elCountCollisions)elCountCollisions.innerText=report.collisions.length;
renderRegistryMatchBanner(report);
renderStructure(report);
renderHeader(report);
renderRecords(report);
renderChecksums(report);
renderRegistryTab(report);
renderCollisions(report);
renderDiagnostics(report);
renderReportExport(report);
setTimeout(updateTabsScrollButtons,50);
}
function renderStructure(report){
const metaGrid=document.getElementById('container-metadata-grid');
if(metaGrid){
metaGrid.innerHTML=`
<div class="bit-card">
<div>
<div class="bit-name">Signature Magic</div>
<div class="bit-desc">${report.container.isOpkContainer?'Valid .OPK Signature':'Raw Binary Image'}</div>
</div>
<span class="status-pill ${report.container.isOpkContainer?'status-clean':'status-notice'}">
${report.container.isOpkContainer?report.container.signature:'Raw Memory'}
</span>
</div>
<div class="bit-card">
<div>
<div class="bit-name">Declared Payload Length</div>
<div class="bit-desc">24-Bit Big-Endian Header Word</div>
</div>
<span class="status-pill status-notice">
${report.container.isOpkContainer?`${report.container.declaredPayloadLen.toLocaleString()} B`:'N/A'}
</span>
</div>
<div class="bit-card">
<div>
<div class="bit-name">Physical Data On Disk</div>
<div class="bit-desc">Payload Stream Size</div>
</div>
<span class="status-pill status-notice">
${report.container.payloadSizeOnDisk.toLocaleString()} B
</span>
</div>
<div class="bit-card">
<div>
<div class="bit-name">Stream Framing Verdict</div>
<div class="bit-desc">Declared Length vs File Length</div>
</div>
<span class="status-pill ${report.container.lengthMatch?'status-clean':'status-warnings'}">
${report.container.lengthMatch?'MATCH / VALID':'LENGTH MISMATCH'}
</span>
</div>
`;
}
const regionsBody=document.getElementById('structure-regions-table-body');
if(regionsBody&&report.regions){
regionsBody.innerHTML='';
report.regions.forEach(reg=>{
const tr=document.createElement('tr');
const isZero=reg.size===0;
const startHex='0x'+reg.start.toString(16).toUpperCase().padStart(6,'0');
const endHex='0x'+(reg.end>reg.start?(reg.end-1).toString(16).toUpperCase().padStart(6,'0'):reg.start.toString(16).toUpperCase().padStart(6,'0'));
const fileRangeText=isZero?'—':`${startHex} - ${endHex}`;
const packStart=Math.max(0,reg.start-report.container.headerSize);
const packEnd=Math.max(0,reg.end-report.container.headerSize);
const packStartHex='0x'+packStart.toString(16).toUpperCase().padStart(5,'0');
const packEndHex='0x'+(packEnd>packStart?(packEnd-1).toString(16).toUpperCase().padStart(5,'0'):packStart.toString(16).toUpperCase().padStart(5,'0'));
const packRangeText=isZero?'—':(reg.start>=report.container.headerSize?`${packStartHex} - ${packEndHex}`:'Header');
const pct=report.totalFileSize>0?((reg.size/report.totalFileSize)*100).toFixed(1):0;
tr.innerHTML=`
<td><strong>${escapeHtml(reg.name)}</strong></td>
<td class="mono">${fileRangeText}</td>
<td class="mono">${packRangeText}</td>
<td>${reg.size.toLocaleString()} B</td>
<td>${pct}%</td>
<td style="color: var(--text-secondary);">${escapeHtml(reg.desc)}</td>
`;
regionsBody.appendChild(tr);
});
}
const capacityBox=document.getElementById('capacity-allocation-box');
if(capacityBox){
const usedPct=report.summary.utilizationPercent;
const freePct=(100-parseFloat(usedPct)).toFixed(1);
let barClass='progress-bar-fill';
if(usedPct>90)barClass+=' critical';
else if(usedPct>75)barClass+=' warning';
capacityBox.innerHTML=`
<div class="capacity-stats-row">
<div>High Water Mark (Used): <strong>${report.summary.usedBytes.toLocaleString()} B</strong> (${usedPct}%)</div>
<div>Unallocated Free Space: <strong>${report.summary.freeBytes.toLocaleString()} B</strong> (${freePct}%)</div>
</div>
<div class="progress-bar-container">
<div class="${barClass}" style="width: ${Math.min(100,usedPct)}%;"></div>
</div>
<div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--text-muted); margin-top: 0.5rem; flex-wrap: wrap;">
<span>Total Sized Capacity: <strong>${report.header.capacityKb} KB</strong> (${report.header.numSegments16K} × 16KB hardware segments)</span>
<span>Trailing Erase Integrity: <strong style="color: ${report.summary.trailingBytesErased?'var(--status-pass)':'var(--status-warning)'};">${report.summary.trailingBytesErased?'Clean, unwritten / erased bytes ($FF)':`${report.summary.trailingBytesCount} trailing non-$FF remnant bytes`}</strong></span>
</div>
`;
}
}
function renderHeader(report){
const h=report.header;
const hexRow=document.getElementById('hex-bytes-row');
if(hexRow){
hexRow.innerHTML='';
const byteLabels=[
'Byte 0: Flags','Byte 1: Size','Byte 2: YR/Code','Byte 3: MO/Dev',
'Byte 4: DA/Ver','Byte 5: HR/Prio','Byte 6: ADDR/MSB','Byte 7: ADDR/LSB',
'Byte 8: CHK1','Byte 9: CHK2'
];
h.rawBytes.forEach((b,idx)=>{
const box=document.createElement('div');
box.className='hex-byte-box';
box.innerHTML=`
<span class="hex-byte-val">${b.toString(16).toUpperCase().padStart(2,'0')}</span>
<span class="hex-byte-lbl">${byteLabels[idx]}</span>
`;
hexRow.appendChild(box);
});
}
const headerTableBody=document.getElementById('header-bytes-table-body');
if(headerTableBody&&h.bytesDetailed){
headerTableBody.innerHTML='';
h.bytesDetailed.forEach(item=>{
const tr=document.createElement('tr');
tr.innerHTML=`
<td class="mono">Byte [${item.byteIndex}]</td>
<td><strong>${escapeHtml(item.name)}</strong></td>
<td class="mono">${item.valHex}</td>
<td class="mono">${item.valDec}</td>
<td class="mono">${item.valBin}</td>
<td>${escapeHtml(item.meaning)}</td>
<td class="diagnostic-techref">${escapeHtml(item.techRef)}</td>
`;
headerTableBody.appendChild(tr);
});
}
const bitfieldsGrid=document.getElementById('bitfield-grid');
if(bitfieldsGrid){
const f=h.flags;
bitfieldsGrid.innerHTML=`
<div class="bit-card">
<div>
<div class="bit-name">Bit 6: Flashpack Media Flag</div>
<div class="bit-desc">Active Low (0 = Flashpack EEPROM)</div>
</div>
<span class="status-pill ${f.bit6_flashpack?'status-clean':'status-notice'}">
${f.bit6_flashpack?'Active (Flash EEPROM)':'Standard Media'}
</span>
</div>
<div class="bit-card">
<div>
<div class="bit-name">Bit 4: Bootable Datapak Flag</div>
<div class="bit-desc">Active Low (0 = Bootable Pack)</div>
</div>
<span class="status-pill ${f.bit4_bootable?'status-clean':'status-notice'}">
${f.bit4_bootable?'Bootable (Auto-start)':'Standard'}
</span>
</div>
<div class="bit-card">
<div>
<div class="bit-name">Bit 2: Paged / Multi-Bank Mode</div>
<div class="bit-desc">Active High (1 = Segmented / Paged)</div>
</div>
<span class="status-pill ${f.bit2_paged?'status-clean':'status-notice'}">
${f.bit2_paged?'Paged (>= 32K)':'Linear'}
</span>
</div>
<div class="bit-card">
<div>
<div class="bit-name">Bit 3: Write Protection Flag</div>
<div class="bit-desc">Active Low (0 = Protected)</div>
</div>
<span class="status-pill ${f.bit3_writeProtect?'status-warnings':'status-clean'}">
${f.bit3_writeProtect?'Protected':'Unprotected'}
</span>
</div>
<div class="bit-card">
<div>
<div class="bit-name">Bit 1: EPROM Memory Type</div>
<div class="bit-desc">Active High (1 = EPROM, 0 = RAM)</div>
</div>
<span class="status-pill status-notice">
${f.bit1_eprom?'EPROM':'RAM / Flash'}
</span>
</div>
<div class="bit-card">
<div>
<div class="bit-name">Bit 5: Copy Protection Flag</div>
<div class="bit-desc">Active Low (0 = Protected)</div>
</div>
<span class="status-pill ${f.bit5_copyProtect?'status-warnings':'status-clean'}">
${f.bit5_copyProtect?'Protected':'Copyable'}
</span>
</div>
<div class="bit-card">
<div>
<div class="bit-name">Bit 7: MK1 Format Indicator</div>
<div class="bit-desc">Active High (1 = MK1 Pack)</div>
</div>
<span class="status-pill status-notice">
${f.bit7_mk1Pack?'MK1 Legacy':'MK2 Standard'}
</span>
</div>
<div class="bit-card">
<div>
<div class="bit-name">Bit 0: Valid MK2 Pack Format</div>
<div class="bit-desc">Must be 0 in valid Datapaks</div>
</div>
<span class="status-pill ${f.bit0_validMkii?'status-clean':'status-critical'}">
${f.bit0_validMkii?'Valid (0)':'Invalid (1)'}
</span>
</div>
`;
}
const elStored=document.getElementById('header-chk-stored');
if(elStored)elStored.innerText=h.checksum.stored;
const elCalc=document.getElementById('header-chk-calc');
if(elCalc)elCalc.innerText=h.checksum.calculated;
const chkStatusPill=document.getElementById('header-chk-status');
if(chkStatusPill){
chkStatusPill.className=`status-pill ${h.checksum.isValid?'status-clean':'status-critical'}`;
chkStatusPill.innerText=h.checksum.isValid?'MATCH / VALID':'MISMATCH';
}
const elFormula=document.getElementById('header-chk-formula');
if(elFormula){
elFormula.innerText=`Formula: (${h.checksum.w0} + ${h.checksum.w2} + ${h.checksum.w4} + ${h.checksum.w6}) & 0xFFFF = ${h.checksum.calculated}`;
}
const elNote=document.getElementById('header-chk-note');
if(elNote){
if(!h.checksum.isValid){
elNote.style.display='block';
elNote.innerHTML=`⚠️ <strong>Diagnostic Note:</strong> It's possible the copy protect or write protect attributes were set after pack creation. If the OPK is re-used, a new calculated checksum will be calculated when the pack is downloaded.`;
}else{
elNote.style.display='none';
}
}
const bootParamsBox=document.getElementById('header-boot-params');
if(bootParamsBox){
if(h.isBootable&&h.bootParams){
bootParamsBox.innerHTML=`
<table style="width: 100%;">
<tr>
<td><strong>OS Model Target:</strong> 0x${h.bootParams.osCode.toString(16).toUpperCase()} (${h.bootParams.osCode===0?'All Models':'Specific Model'})</td>
<td><strong>Boot Device ID:</strong> 0x${h.bootParams.bootId.toString(16).toUpperCase()} (${h.bootParams.bootId} dec)</td>
</tr>
<tr>
<td><strong>Software Version:</strong> 0x${h.bootParams.version.toString(16).toUpperCase()} (v${(h.bootParams.version>>4)}.${h.bootParams.version&0x0F})</td>
<td><strong>Execution Priority:</strong> ${h.bootParams.priority}</td>
</tr>
<tr>
<td colspan="2"><strong>Boot Vector Target Address:</strong> <span class="mono" style="color: var(--accent-blue);">${h.bootParams.bootAddressHex}</span> (Pack Offset ${h.bootParams.bootAddress} bytes &mdash; points directly to Boot Machine Code inside Record [001])</td>
</tr>
</table>
`;
}else if(h.timestamp){
bootParamsBox.innerHTML=`
<div><strong>Pack Authoring Timestamp:</strong> ${h.timestamp.formatted}</div>
<div><strong>Free Running Counter Word:</strong> 0x${h.timestamp.counter.toString(16).toUpperCase().padStart(4,'0')}</div>
`;
}
}
}
function renderRecords(report){
const tbody=document.getElementById('records-table-body');
if(!tbody)return;
tbody.innerHTML='';
const searchTerm=recordSearch?recordSearch.value.toLowerCase().trim():'';
const filterType=recordFilterType?recordFilterType.value:'all';
report.records.forEach(r=>{
if(filterType!=='all'){
if(filterType==='proc'&&r.typeByte!==0x83&&!r.procedureDetails)return;
if(filterType==='file'&&r.typeByte!==0x81)return;
if(filterType==='data'&&(r.typeByte<0x90||r.typeByte>0xFF||r.typeByte===0xFF))return;
if(filterType==='long'&&!r.isLongRecord)return;
if(filterType==='straddle'&&!r.crossesSegment)return;
}
if(searchTerm){
const matchName=(r.name||'').toLowerCase().includes(searchTerm);
const matchType=(r.typeName||'').toLowerCase().includes(searchTerm);
const matchOffset=(r.offsetHex||'').toLowerCase().includes(searchTerm);
const matchRole=(r.roleSummary||'').toLowerCase().includes(searchTerm);
const matchPreview=(r.preview||'').toLowerCase().includes(searchTerm);
if(!matchName&&!matchType&&!matchOffset&&!matchRole&&!matchPreview)return;
}
const tr=document.createElement('tr');
tr.style.cursor='pointer';
tr.title='Click to inspect raw bytes in Hex Inspector';
let statusPillClass='status-clean';
let statusText=r.packStatus||'Valid';
if(statusText.includes('Warning')||statusText.includes('Orphan')){
statusPillClass='status-warnings';
}else if(statusText.includes('Error')||statusText.includes('Corrupt')){
statusPillClass='status-critical';
}else if(statusText.includes('Boot')){
statusPillClass='status-notice';
}
let straddleHtml='';
if(r.crossesSegment){
const endSeg=Math.floor((r.offset+r.totalLen-1)/16384);
const tooltipText=`⚡ Straddles 16KB hardware boundary (crosses from Segment ${r.segmentIndex} to Segment ${endSeg}). Supported natively: Organiser II PK$READ automatically manages segment bank switching on-the-fly (TechRef §9.2.2.3 & §9.5.3).`;
straddleHtml=` <span style="color:var(--status-notice); cursor:help;" title="${escapeHtml(tooltipText)}">⚡</span>`;
}
tr.innerHTML=`
<td class="mono">[${r.index.toString().padStart(3,'0')}]</td>
<td class="mono">
${r.offsetHex}
<div style="font-size: 0.72rem; color: var(--text-muted);">Disk: ${r.fileOffsetHex}</div>
</td>
<td class="mono" style="color: var(--accent-blue);">${r.linear24}</td>
<td class="mono">
Seg ${r.segmentIndex}, Pg ${r.pageIndex}:${r.byteInPage}${straddleHtml}
</td>
<td class="mono">
<span class="status-pill status-notice" style="font-size:0.7rem; padding:0.15rem 0.4rem;">${r.typeHex}</span>
<span style="font-size:0.75rem; margin-left:0.25rem;">${escapeHtml(r.typeName)}</span>
</td>
<td>${r.totalLen.toLocaleString()} B</td>
<td><strong>${escapeHtml(r.name||r.preview||'-')}</strong></td>
<td>
<span class="status-pill ${statusPillClass}" style="font-size:0.7rem; padding:0.15rem 0.5rem; margin-right:0.4rem;">${escapeHtml(statusText)}</span>
<span style="font-size:0.82rem; color:var(--text-secondary);">${escapeHtml(r.roleSummary)}</span>
</td>
`;
tr.addEventListener('click',()=>{
openRecordInspector(r,report);
});
tbody.appendChild(tr);
});
}
if(recordSearch){
recordSearch.addEventListener('input',()=>{
if(currentReport)renderRecords(currentReport);
});
}
if(recordFilterType){
recordFilterType.addEventListener('change',()=>{
if(currentReport)renderRecords(currentReport);
});
}
function renderChecksums(report){
if(!report||!report.checksums)return;
const chk=report.checksums;
const elOverall=document.getElementById('chk-overall-status');
if(elOverall){
const hasDeltaMismatch=(chk.packPayload.wholePack.sumBytes-chk.packPayload.recordsOnly.sumBytes)!==chk.packPayload.headerDelta.sumBytes;
if(hasDeltaMismatch){
elOverall.className='status-pill status-critical';
elOverall.innerText='DELTA MISMATCH';
}else{
elOverall.className='status-pill status-clean';
elOverall.innerText='VERIFIED';
}
}
const elFileSizeBadge=document.getElementById('chk-file-size-badge');
if(elFileSizeBadge)elFileSizeBadge.innerText=`${chk.file.size.toLocaleString()} B (${(chk.file.size/1024).toFixed(2)} KB)`;
const fileGrid=document.getElementById('chk-file-grid');
if(fileGrid){
fileGrid.innerHTML=`
<div class="bit-card" style="flex-direction: column; align-items: stretch; gap: 0.5rem;">
<div style="display: flex; justify-content: space-between; align-items: center;">
<span class="bit-name">MD5 Hash (Whole File)</span>
<button class="copy-btn-mini copy-hash-btn" data-hash="${chk.file.md5}" title="Copy MD5 to clipboard">Copy</button>
</div>
<div class="hash-val">${chk.file.md5}</div>
<div class="bit-desc">128-bit RFC 1321 message digest over all ${chk.file.size.toLocaleString()} file bytes</div>
</div>
<div class="bit-card" style="flex-direction: column; align-items: stretch; gap: 0.5rem;">
<div style="display: flex; justify-content: space-between; align-items: center;">
<span class="bit-name">SHA-256 Hash (Whole File)</span>
<button class="copy-btn-mini copy-hash-btn" data-hash="${chk.file.sha256}" title="Copy SHA-256 to clipboard">Copy</button>
</div>
<div class="hash-val" style="font-size: 0.8rem;">${chk.file.sha256}</div>
<div class="bit-desc">256-bit FIPS 180-4 cryptographic hash over entire disk image</div>
</div>
<div class="bit-card" style="flex-direction: column; align-items: stretch; gap: 0.5rem;">
<div style="display: flex; justify-content: space-between; align-items: center;">
<span class="bit-name">CRC-32 (Whole File / Excl16)</span>
<button class="copy-btn-mini copy-hash-btn" data-hash="${chk.file.crc32Hex||chk.file.crc32}" title="Copy CRC-32 to clipboard">Copy</button>
</div>
<div class="hash-val" style="font-size: 1.15rem; font-weight: 700; color: var(--accent-blue);">
${chk.file.crc32Hex||chk.file.crc32} <span style="font-size: 0.82rem; color: var(--text-muted); font-weight: 400;">(Excl16: ${chk.file.crc32Excl16Hex||'N/A'})</span>
</div>
<div class="bit-desc">Standard IEEE 802.3 CRC-32 across whole file and records payload (offset 16+)</div>
</div>
<div class="bit-card" style="flex-direction: column; align-items: stretch; gap: 0.5rem;">
<div style="display: flex; justify-content: space-between; align-items: center;">
<span class="bit-name">32-Bit Byte Sum (SumAll / SumExcl16)</span>
<button class="copy-btn-mini copy-hash-btn" data-hash="${chk.file.sumAllHex||''}" title="Copy SumAll to clipboard">Copy</button>
</div>
<div class="hash-val" style="font-size: 1.15rem; font-weight: 700; color: var(--accent-blue);">
${chk.file.sumAllHex||'N/A'} <span style="font-size: 0.82rem; color: var(--text-muted); font-weight: 400;">(Excl16: ${chk.file.sumExcl16Hex||'N/A'})</span>
</div>
<div class="bit-desc">Reference catalog byte sum mod 2^32 across whole file and excluding 16-byte header</div>
</div>
<div class="bit-card" style="flex-direction: column; align-items: stretch; gap: 0.5rem;">
<div style="display: flex; justify-content: space-between; align-items: center;">
<span class="bit-name">File Container Framing</span>
<span class="status-pill status-notice">${report.container.isOpkContainer?'OPK Container':'Raw BIN'}</span>
</div>
<div class="hash-val" style="color: var(--text-primary); font-size: 1.1rem; font-weight: 700;">
${chk.file.size.toLocaleString()} <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 400;">bytes</span>
</div>
<div class="bit-desc">${report.container.isOpkContainer?`6-byte header + ${report.container.payloadSizeOnDisk.toLocaleString()} B stream`:'Direct raw pack image'}</div>
</div>
`;
}
const elPackSizeBadge=document.getElementById('chk-pack-size-badge');
if(elPackSizeBadge)elPackSizeBadge.innerText=`${chk.packPayload.wholePack.length.toLocaleString()} B (${(chk.packPayload.wholePack.length/1024).toFixed(2)} KB)`;
const elPackDiskStart=document.getElementById('chk-pack-disk-start');
if(elPackDiskStart)elPackDiskStart.innerText=`0x${chk.packPayload.startFileOffset.toString(16).toUpperCase().padStart(6,'0')}`;
const packGrid=document.getElementById('chk-pack-grid');
if(packGrid){
packGrid.innerHTML=`
<div class="bit-card" style="flex-direction: column; align-items: stretch; gap: 0.5rem;">
<div style="display: flex; justify-content: space-between; align-items: center;">
<span class="bit-name">Sum of Bytes (Whole Pack)</span>
<button class="copy-btn-mini copy-hash-btn" data-hash="${chk.packPayload.wholePack.sumBytes}" title="Copy byte sum to clipboard">Copy</button>
</div>
<div class="hash-val" style="font-size: 1.15rem; font-weight: 700; color: var(--accent-blue);">
${chk.packPayload.wholePack.sumBytes.toLocaleString()} <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 400;">(${chk.packPayload.wholePack.sumBytesHex})</span>
</div>
<div class="bit-desc">16-bit word sum: <strong>${chk.packPayload.wholePack.sum16Word}</strong> &middot; 8-bit mod 256: <strong>${chk.packPayload.wholePack.sum8Mod}</strong></div>
</div>
<div class="bit-card" style="flex-direction: column; align-items: stretch; gap: 0.5rem;">
<div style="display: flex; justify-content: space-between; align-items: center;">
<span class="bit-name">MD5 Digest (Whole Pack)</span>
<button class="copy-btn-mini copy-hash-btn" data-hash="${chk.packPayload.wholePack.md5}" title="Copy MD5 to clipboard">Copy</button>
</div>
<div class="hash-val">${chk.packPayload.wholePack.md5}</div>
<div class="bit-desc">MD5 message digest from Header Byte 0 to end (excl. FF FF)</div>
</div>
<div class="bit-card" style="flex-direction: column; align-items: stretch; gap: 0.5rem;">
<div style="display: flex; justify-content: space-between; align-items: center;">
<span class="bit-name">CRC-32 (Whole Pack)</span>
<button class="copy-btn-mini copy-hash-btn" data-hash="${chk.packPayload.wholePack.crc32}" title="Copy CRC-32 to clipboard">Copy</button>
</div>
<div class="hash-val">${chk.packPayload.wholePack.crc32}</div>
<div class="bit-desc">Standard IEEE 802.3 CRC-32 across whole pack payload</div>
</div>
<div class="bit-card" style="flex-direction: column; align-items: stretch; gap: 0.5rem;">
<div style="display: flex; justify-content: space-between; align-items: center;">
<span class="bit-name">CRC-16 (CCITT)</span>
<button class="copy-btn-mini copy-hash-btn" data-hash="${chk.packPayload.wholePack.crc16}" title="Copy CRC-16 to clipboard">Copy</button>
</div>
<div class="hash-val">${chk.packPayload.wholePack.crc16}</div>
<div class="bit-desc">16-bit CCITT polynomial (0x1021, init 0xFFFF) across whole pack</div>
</div>
`;
}
const elRecsSizeBadge=document.getElementById('chk-recs-size-badge');
if(elRecsSizeBadge)elRecsSizeBadge.innerText=`${chk.packPayload.recordsOnly.length.toLocaleString()} B (${(chk.packPayload.recordsOnly.length/1024).toFixed(2)} KB)`;
const elRecsDiskStart=document.getElementById('chk-recs-disk-start');
if(elRecsDiskStart)elRecsDiskStart.innerText=`0x${(chk.packPayload.startFileOffset+10).toString(16).toUpperCase().padStart(6,'0')}`;
const recsGrid=document.getElementById('chk-recs-grid');
if(recsGrid){
recsGrid.innerHTML=`
<div class="bit-card" style="flex-direction: column; align-items: stretch; gap: 0.5rem;">
<div style="display: flex; justify-content: space-between; align-items: center;">
<span class="bit-name">Sum of Bytes (Records Stream)</span>
<button class="copy-btn-mini copy-hash-btn" data-hash="${chk.packPayload.recordsOnly.sumBytes}" title="Copy byte sum to clipboard">Copy</button>
</div>
<div class="hash-val" style="font-size: 1.15rem; font-weight: 700; color: var(--accent-blue);">
${chk.packPayload.recordsOnly.sumBytes.toLocaleString()} <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 400;">(${chk.packPayload.recordsOnly.sumBytesHex})</span>
</div>
<div class="bit-desc">16-bit word sum: <strong>${chk.packPayload.recordsOnly.sum16Word}</strong> &middot; 8-bit mod 256: <strong>${chk.packPayload.recordsOnly.sum8Mod}</strong></div>
</div>
<div class="bit-card" style="flex-direction: column; align-items: stretch; gap: 0.5rem;">
<div style="display: flex; justify-content: space-between; align-items: center;">
<span class="bit-name">MD5 Digest (Records Stream)</span>
<button class="copy-btn-mini copy-hash-btn" data-hash="${chk.packPayload.recordsOnly.md5}" title="Copy MD5 to clipboard">Copy</button>
</div>
<div class="hash-val">${chk.packPayload.recordsOnly.md5}</div>
<div class="bit-desc">MD5 message digest of record stream starting after 10-byte header</div>
</div>
<div class="bit-card" style="flex-direction: column; align-items: stretch; gap: 0.5rem;">
<div style="display: flex; justify-content: space-between; align-items: center;">
<span class="bit-name">CRC-32 (Records Stream)</span>
<button class="copy-btn-mini copy-hash-btn" data-hash="${chk.packPayload.recordsOnly.crc32}" title="Copy CRC-32 to clipboard">Copy</button>
</div>
<div class="hash-val">${chk.packPayload.recordsOnly.crc32}</div>
<div class="bit-desc">CRC-32 across records stream starting at offset 0x00000A</div>
</div>
<div class="bit-card" style="flex-direction: column; align-items: stretch; gap: 0.5rem;">
<div style="display: flex; justify-content: space-between; align-items: center;">
<span class="bit-name">CRC-16 (CCITT, Records Stream)</span>
<button class="copy-btn-mini copy-hash-btn" data-hash="${chk.packPayload.recordsOnly.crc16}" title="Copy CRC-16 to clipboard">Copy</button>
</div>
<div class="hash-val">${chk.packPayload.recordsOnly.crc16}</div>
<div class="bit-desc">16-bit CCITT polynomial across records stream only</div>
</div>
`;
}
const deltaBox=document.getElementById('chk-delta-box');
if(deltaBox){
const wholeSum=chk.packPayload.wholePack.sumBytes;
const recSum=chk.packPayload.recordsOnly.sumBytes;
const hdrSum=chk.packPayload.headerDelta.sumBytes;
const diff=wholeSum-recSum;
const isMatch=diff===hdrSum;
deltaBox.innerHTML=`
<div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
<div>
<strong style="color: var(--text-primary); font-size: 0.95rem;">Pack Header Isolation Formula</strong>
<div style="color: var(--text-secondary); font-size: 0.85rem; margin-top: 0.2rem;">
Sum(Whole Pack Payload) &minus; Sum(Records Stream) &equiv; Sum(10-Byte Pack Header)
</div>
</div>
<span class="status-pill ${isMatch?'status-clean':'status-critical'}">
${isMatch?'EXACT ARITHMETIC MATCH':'DELTA MISMATCH!'}
</span>
</div>
<div class="chk-delta-grid">
<div class="chk-delta-item">
<div class="chk-delta-lbl">Whole Pack Byte Sum</div>
<div class="chk-delta-val">${wholeSum.toLocaleString()} <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 400;">(${chk.packPayload.wholePack.sumBytesHex})</span></div>
</div>
<div class="chk-delta-item">
<div class="chk-delta-lbl">Records Stream Byte Sum</div>
<div class="chk-delta-val">${recSum.toLocaleString()} <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 400;">(${chk.packPayload.recordsOnly.sumBytesHex})</span></div>
</div>
<div class="chk-delta-item">
<div class="chk-delta-lbl">10-Byte Header Byte Sum</div>
<div class="chk-delta-val">${hdrSum.toLocaleString()} <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 400;">(${chk.packPayload.headerDelta.sumBytesHex})</span></div>
</div>
<div class="chk-delta-item">
<div class="chk-delta-lbl">Calculated Delta (Difference)</div>
<div class="chk-delta-val" style="color: ${isMatch?'var(--status-pass)':'var(--status-critical)'};">${diff.toLocaleString()} <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 400;">(0x${diff.toString(16).toUpperCase()})</span></div>
</div>
</div>
`;
}
document.querySelectorAll('.copy-hash-btn').forEach(btn=>{
btn.addEventListener('click',(e)=>{
e.stopPropagation();
const text=btn.getAttribute('data-hash');
if(!text)return;
navigator.clipboard.writeText(text).then(()=>{
const originalText=btn.innerText;
btn.classList.add('copied');
btn.innerText='Copied!';
setTimeout(()=>{
btn.classList.remove('copied');
btn.innerText=originalText;
},1500);
}).catch(err=>{
console.error('Failed to copy to clipboard',err);
});
});
});
}
function renderCollisions(report){
const container=document.getElementById('collisions-container');
if(container){
container.innerHTML='';
if(report.collisions.length===0){
container.innerHTML=`
<div style="padding: 2rem; text-align: center; color: var(--status-pass); background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px;">
<h3>✅ No File ID Collisions Detected</h3>
<p style="color: var(--text-secondary); margin-top: 0.5rem;">All ${report.files.length} data files declare distinct, non-conflicting internal File IDs ($90..$FF).</p>
</div>
`;
}else{
report.collisions.forEach(col=>{
const card=document.createElement('div');
card.className='collision-alert-card';
let tableRows='';
col.collidingFiles.forEach(f=>{
tableRows+=`
<tr>
<td><strong>${escapeHtml(f.name)}</strong></td>
<td class="mono">Record [${f.recordIndex}]</td>
<td class="mono">${f.offsetHex}</td>
<td>${f.recordsCount} records</td>
</tr>
`;
});
card.innerHTML=`
<div class="collision-title">
<span>🚨 Namespace Collision on File ID <strong>${col.fileIdHex}</strong> (${col.fileId} decimal)</span>
</div>
<p style="color: var(--text-secondary); margin-bottom: 0.75rem; font-size: 0.9rem;">
The following ${col.collidingFiles.length} distinct Data Files share this exact internal ID. Opening any of these files on an Organiser II causes all matching records to interleave into the same field schema:
</p>
<div class="table-responsive">
<table>
<thead>
<tr><th>File Name</th><th>Header Record</th><th>Offset</th><th>Assigned Records</th></tr>
</thead>
<tbody>${tableRows}</tbody>
</table>
</div>
`;
container.appendChild(card);
});
}
}
const allFilesContainer=document.getElementById('all-files-table-body');
if(allFilesContainer&&report.files){
allFilesContainer.innerHTML='';
report.files.forEach(f=>{
const isColliding=report.collisions.some(c=>c.fileId===f.fileId);
const tr=document.createElement('tr');
tr.innerHTML=`
<td><strong>${escapeHtml(f.name)}</strong></td>
<td class="mono">${f.fileIdHex} (${f.fileId})</td>
<td class="mono">Record [${f.fileHeaderRecordIndex}]</td>
<td>${f.recordsCount}</td>
<td>${f.totalBytes.toLocaleString()} B</td>
<td>
<span class="status-pill ${isColliding?'status-critical':'status-clean'}">
${isColliding?'COLLIDING':'UNIQUE'}
</span>
</td>
`;
allFilesContainer.appendChild(tr);
});
}
}
function renderDiagnostics(report){
const container=document.getElementById('diagnostic-list');
if(!container)return;
container.innerHTML='';
report.diagnostics.forEach(diag=>{
const item=document.createElement('div');
item.className=`diagnostic-item diag-${diag.level}`;
let icon='ℹ️';
if(diag.level==='pass')icon='✅';
else if(diag.level==='critical')icon='🚨';
else if(diag.level==='warning')icon='⚠️';
else if(diag.level==='notice')icon='🔍';
item.innerHTML=`
<div class="diagnostic-icon">${icon}</div>
<div class="diagnostic-content">
<div class="diagnostic-header">
<div class="diagnostic-title">${escapeHtml(diag.title)}</div>
<span class="status-pill status-${diag.level==='critical'?'critical':(diag.level==='warning'?'warnings':'clean')}">${diag.level}</span>
</div>
<div class="diagnostic-desc">${escapeHtml(diag.description)}</div>
<div class="diagnostic-meta">
<span>Category: <strong>${escapeHtml(diag.category)}</strong></span>
<span class="diagnostic-techref">Ref: ${escapeHtml(diag.techRef)}</span>
</div>
</div>
`;
container.appendChild(item);
});
}
function renderReportExport(report){
const textArea=document.getElementById('report-text-area');
if(!textArea)return;
let md=`# Organiser II Pack Audit Report: ${report.filename}\n\n`;
md+=`**Audit Date**: ${new Date().toISOString()}\n`;
md+=`**Tool**: OPK Pack Analyser v00.00.01\n`;
md+=`**Overall Verdict**: ${report.verdict}\n\n`;
md+=`## 1. Container & Pack Specifications\n`;
md+=`- **Container**: ${report.container.isOpkContainer?report.container.signature:'Raw Datapak Image'}\n`;
md+=`- **Declared Payload Size**: ${report.container.declaredPayloadLen.toLocaleString()} bytes\n`;
md+=`- **Pack Sized Capacity**: ${report.header.capacityKb} KB (${report.header.capacityBytes.toLocaleString()} bytes across ${report.header.numSegments16K} segments of 16KB)\n`;
md+=`- **High Water Mark (Used)**: ${report.summary.usedBytes.toLocaleString()} bytes (${report.summary.utilizationPercent}% utilized)\n`;
md+=`- **Free Capacity**: ${report.summary.freeBytes.toLocaleString()} bytes\n`;
md+=`- **Header Checksum**: Stored ${report.header.checksum.stored} / Calculated ${report.header.checksum.calculated} (${report.header.checksum.isValid?'Valid Match':'Mismatch!'})\n`;
if(!report.header.checksum.isValid){
md+=`  *(Note: It's possible the copy protect or write protect attributes were set after pack creation. If the OPK is re-used, a new calculated checksum will be calculated when the pack is downloaded.)*\n`;
}
md+=`\n`;
md+=`## 2. Record Census & Pack Content\n`;
md+=`- **Total Records**: ${report.summary.totalRecords}\n`;
md+=`- **Procedures**: ${report.summary.proceduresCount}\n`;
md+=`- **Data Files**: ${report.summary.dataFilesCount} files declaring ${report.summary.dataRecordsCount} records\n`;
md+=`- **Notepads**: ${report.summary.notepadsCount}\n`;
md+=`- **Long Records (Type 0x80)**: ${report.summary.longRecordsCount}\n\n`;
md+=`## 3. Diagnostics & Integrity Findings\n\n`;
report.diagnostics.forEach(d=>{
md+=`### [${d.level.toUpperCase()}] ${d.title}\n`;
md+=`${d.description}\n`;
md+=`*Ref: ${d.techRef}*\n\n`;
});
const match=registry.matchReport(report);
md+=`## 4. Pack Registry Identity & Renamed Recognition\n`;
md+=`- **Registry Status**: ${match.status}\n`;
md+=`- **Pack Name**: ${match.matchedItem?match.matchedItem.packName:(report.suggestedPackName||'Unregistered')}\n`;
md+=`- **Authoritative Stored Filename**: ${match.matchedItem?match.matchedItem.filename:report.filename}\n`;
md+=`- **Loaded Filename**: ${report.filename}\n`;
md+=`- **Renamed Status**: ${match.isRenamed?`RECOGNIZED RENAMED FILE (matches "${match.originalFilename}")`:(match.status==='VERIFIED_MATCH'?'Identical to Stored File':'Unchanged / Not in Registry')}\n\n`;
if(report.checksums){
const chk=report.checksums;
md+=`## 5. Checksums, Cryptographic Hashes & Byte Sums\n\n`;
md+=`### Entire OPK Container File (${chk.file.size.toLocaleString()} bytes)\n`;
md+=`- **MD5**: \`${chk.file.md5}\`\n`;
md+=`- **SHA-256**: \`${chk.file.sha256}\`\n`;
md+=`- **CRC-32 (Whole File)**: \`${chk.file.crc32Hex||chk.file.crc32}\`\n`;
md+=`- **CRC-32 (Excl. 16-Byte Header)**: \`${chk.file.crc32Excl16Hex||'N/A'}\`\n`;
md+=`- **SumAll (32-Bit Byte Sum)**: \`${chk.file.sumAllHex||'N/A'}\`\n`;
md+=`- **SumExcl16 (32-Bit Byte Sum)**: \`${chk.file.sumExcl16Hex||'N/A'}\`\n\n`;
md+=`### Whole Pack Payload (Byte 0 to End, excl. FF FF Terminator, ${chk.packPayload.wholePack.length.toLocaleString()} bytes)\n`;
md+=`- **Sum of Bytes**: ${chk.packPayload.wholePack.sumBytes.toLocaleString()} (\`${chk.packPayload.wholePack.sumBytesHex}\`)\n`;
md+=`- **16-Bit Word Sum**: \`${chk.packPayload.wholePack.sum16Word}\`\n`;
md+=`- **8-Bit Modulo Sum**: \`${chk.packPayload.wholePack.sum8Mod}\`\n`;
md+=`- **CRC-32**: \`${chk.packPayload.wholePack.crc32}\`\n`;
md+=`- **CRC-16 (CCITT)**: \`${chk.packPayload.wholePack.crc16}\`\n`;
md+=`- **MD5**: \`${chk.packPayload.wholePack.md5}\`\n\n`;
md+=`### Records Stream (After 10-Byte Header to End, excl. FF FF Terminator, ${chk.packPayload.recordsOnly.length.toLocaleString()} bytes)\n`;
md+=`- **Sum of Bytes**: ${chk.packPayload.recordsOnly.sumBytes.toLocaleString()} (\`${chk.packPayload.recordsOnly.sumBytesHex}\`)\n`;
md+=`- **16-Bit Word Sum**: \`${chk.packPayload.recordsOnly.sum16Word}\`\n`;
md+=`- **8-Bit Modulo Sum**: \`${chk.packPayload.recordsOnly.sum8Mod}\`\n`;
md+=`- **CRC-32**: \`${chk.packPayload.recordsOnly.crc32}\`\n`;
md+=`- **CRC-16 (CCITT)**: \`${chk.packPayload.recordsOnly.crc16}\`\n`;
md+=`- **MD5**: \`${chk.packPayload.recordsOnly.md5}\`\n\n`;
md+=`### Header Delta Cross-Verification\n`;
md+=`- **10-Byte Header Byte Sum**: ${chk.packPayload.headerDelta.sumBytes} (\`${chk.packPayload.headerDelta.sumBytesHex}\`)\n`;
md+=`- **Verification Identity**: ${chk.packPayload.wholePack.sumBytes.toLocaleString()} - ${chk.packPayload.recordsOnly.sumBytes.toLocaleString()} = ${chk.packPayload.wholePack.sumBytes-chk.packPayload.recordsOnly.sumBytes} bytes (Exact Match: ${chk.packPayload.wholePack.sumBytes-chk.packPayload.recordsOnly.sumBytes===chk.packPayload.headerDelta.sumBytes?'YES':'NO'})\n\n`;
}
if(report.collisions.length>0){
md+=`## 5. Critical File ID Namespace Collisions\n\n`;
report.collisions.forEach(c=>{
md+=`- **File ID ${c.fileIdHex}**: Shared by [${c.collidingFiles.map(f=>f.name).join(', ')}]\n`;
});
md+=`\n`;
}
textArea.value=md;
const btnCopy=document.getElementById('btn-copy-report');
if(btnCopy){
btnCopy.onclick=()=>{
navigator.clipboard.writeText(textArea.value);
alert('Report copied to clipboard!');
};
}
}
function openRecordInspector(record,report){
if(!modalTitle||!modalBody||!modalBackdrop)return;
modalTitle.innerText=`Record [${record.index}]: ${record.typeName} at Pack Offset ${record.offsetHex}`;
const packOffsetInFile=report.container.headerSize;
const start=packOffsetInFile+record.offset;
const end=Math.min(start+record.totalLen,currentRawBytes.length);
const recordBytes=currentRawBytes.subarray(start,end);
let detailsHeader=`=== RECORD ATTRIBUTES & PACK TELEMETRY ===\n`;
detailsHeader+=`Record Index: [${record.index}] | Type: ${record.typeHex} (${record.typeName})\n`;
detailsHeader+=`Pack Relative Offset: ${record.offsetHex} (${record.offset} dec)\n`;
detailsHeader+=`Physical File Offset: ${record.fileOffsetHex} (${start} dec)\n`;
detailsHeader+=`24-Bit Linear Address (PK$SADD): Accumulator B = 0x${((record.offset>>16)&0xFF).toString(16).toUpperCase()}, Register X = 0x${(record.offset&0xFFFF).toString(16).toUpperCase().padStart(4,'0')} (${record.linear24})\n`;
detailsHeader+=`Hardware Coordinates: Segment ${record.segmentIndex} (16KB block A14-A18), Page ${record.pageIndex} (256B page A8-A13), Byte ${record.byteInPage}\n`;
detailsHeader+=`Total Pack Footprint: ${record.totalLen} bytes | Declared Payload: ${record.payloadLen} bytes\n`;
detailsHeader+=`Pack Structural Role: ${record.roleSummary}\n`;
detailsHeader+=`Validation Verdict: ${record.packStatus}\n`;
if(record.crossesSegment){
const endSeg=Math.floor((record.offset+record.totalLen-1)/16384);
detailsHeader+=`\n--- 16KB HARDWARE SEGMENT STRADDLE ---\n`;
detailsHeader+=`Boundary Transition: Spans Segment ${record.segmentIndex} -> Segment ${endSeg} (crosses 16KB boundary at 0x${((record.segmentIndex+1)*16384).toString(16).toUpperCase()})\n`;
detailsHeader+=`Hardware Addressing: Organiser II PK$READ automatically manages segment bank register switching on-the-fly (TechRef §9.2.2.3 & §9.5.3) on paged/segmented media.\n`;
}
if(record.procedureDetails){
detailsHeader+=`\n--- PROCEDURE BODY STRUCTURAL FRAMING ---\n`;
detailsHeader+=`Parent Procedure: ${record.procedureDetails.parentProc}\n`;
detailsHeader+=`Object Code Length: ${record.procedureDetails.codeLen} bytes\n`;
detailsHeader+=`Source Code Length: ${record.procedureDetails.srcLen} bytes\n`;
detailsHeader+=`Framing Math: codeLen (${record.procedureDetails.codeLen}) + srcLen (${record.procedureDetails.srcLen}) + 4 = ${record.procedureDetails.codeLen+record.procedureDetails.srcLen+4} <= payloadLen (${record.payloadLen})\n`;
detailsHeader+=`Framing Status: ${record.procedureDetails.isValid?'VALID':'CORRUPTED'}\n`;
}
detailsHeader+=`\n=== RAW BYTE INSPECTION (PACK OFFSETS) ===\n`;
detailsHeader+=generateHexDump(recordBytes,record.offset);
modalBody.innerHTML=`<pre>${escapeHtml(detailsHeader)}</pre>`;
modalBackdrop.classList.add('open');
}
if(btnCloseModal){
btnCloseModal.addEventListener('click',()=>{
modalBackdrop.classList.remove('open');
});
}
if(modalBackdrop){
modalBackdrop.addEventListener('click',(e)=>{
if(e.target===modalBackdrop)modalBackdrop.classList.remove('open');
});
}
function generateHexDump(bytes,baseOffset=0){
let lines=[];
for(let i=0;i<bytes.length;i+=16){
const chunk=bytes.subarray(i,Math.min(i+16,bytes.length));
const hexParts=[];
let asciiParts='';
for(let j=0;j<16;j++){
if(j<chunk.length){
hexParts.push(chunk[j].toString(16).toUpperCase().padStart(2,'0'));
const c=chunk[j];
asciiParts+=(c>=32&&c<=126)?String.fromCharCode(c):'.';
}else{
hexParts.push('  ');
asciiParts+=' ';
}
}
const offsetStr=(baseOffset+i).toString(16).toUpperCase().padStart(5,'0');
lines.push(`${offsetStr}  ${hexParts.slice(0,8).join(' ')}  ${hexParts.slice(8).join(' ')}  |${asciiParts}|`);
}
return lines.join('\n');
}
function switchToTab(tabId){
const targetBtn=document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
if(targetBtn){
targetBtn.click();
targetBtn.scrollIntoView({behavior:'smooth',block:'nearest',inline:'nearest'});
}
}
function highlightRegistryRow(id){
setTimeout(()=>{
const row=document.getElementById(`reg-row-${id}`);
if(row){
row.scrollIntoView({behavior:'smooth',block:'center'});
row.style.outline='2px solid var(--accent-blue)';
setTimeout(()=>{row.style.outline='none';},2000);
}
},120);
}
function renderRegistryMatchBanner(report){
if(!registryMatchBanner)return;
if(!report){
registryMatchBanner.style.display='none';
return;
}
const match=registry.matchReport(report);
let bannerHtml='';
if(match.status==='VERIFIED_MATCH'){
bannerHtml=`
<div class="registry-match-box match-verified">
<div class="match-hdr">
<div class="match-title-row">
<span class="match-icon">✅</span>
<div>
<div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
<h4 class="match-title" style="margin: 0;">Verified Datapak: ${escapeHtml(match.matchedItem.packName)}</h4>
<span class="status-pill status-clean">VERIFIED MATCH</span>
</div>
<div class="match-sub" style="margin-top: 0.35rem;">
Authoritative Stored Filename: <strong class="mono">${escapeHtml(match.matchedItem.filename)}</strong> &middot; Cryptographic checksums and byte sums match catalog entry identically.
</div>
<div style="font-size: 0.75rem; font-family: var(--font-mono); color: var(--text-muted); margin-top: 0.3rem;">
MD5: ${match.matchedItem.md5} &middot; CRC32: ${match.matchedItem.crc32All} &middot; SumAll: ${match.matchedItem.sumAll}
</div>
</div>
</div>
<div class="match-actions">
<button class="btn btn-secondary btn-view-in-reg">View in Registry</button>
<button class="btn btn-secondary btn-edit-pack-entry">Edit Entry</button>
</div>
</div>
</div>
`;
}else if(match.status==='RENAMED_MATCH'){
bannerHtml=`
<div class="registry-match-box match-renamed">
<div class="match-hdr">
<div class="match-title-row">
<span class="match-icon">🏷️</span>
<div>
<div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
<span class="status-pill status-renamed">RENAMED FILE RECOGNIZED</span>
<h4 class="match-title" style="margin: 0;">Original Pack: ${escapeHtml(match.matchedItem.packName)}</h4>
</div>
<div class="match-sub" style="margin-top: 0.35rem;">
Loaded as <code class="mono" style="color: var(--status-renamed); font-weight: 700;">${escapeHtml(match.currentFilename)}</code>, but cryptographic hashes identify this as <strong class="mono">${escapeHtml(match.originalFilename)}</strong>.
</div>
<div style="font-size: 0.75rem; font-family: var(--font-mono); color: var(--text-muted); margin-top: 0.3rem;">
MD5: ${match.matchedItem.md5} &middot; CRC32: ${match.matchedItem.crc32All} &middot; SumAll: ${match.matchedItem.sumAll}
</div>
</div>
</div>
<div class="match-actions">
<button class="btn btn-primary btn-update-filename" title="Update the registry stored filename to this loaded filename">Update Stored Name</button>
<button class="btn btn-secondary btn-view-in-reg">View in Registry</button>
<button class="btn btn-secondary btn-edit-pack-entry">Edit Entry</button>
</div>
</div>
</div>
`;
}else if(match.status==='MODIFIED_DIFFERENT_HASH'){
bannerHtml=`
<div class="registry-match-box match-modified">
<div class="match-hdr">
<div class="match-title-row">
<span class="match-icon">⚠️</span>
<div>
<div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
<span class="status-pill status-warnings">MODIFIED / DIFFERENT VERSION</span>
<h4 class="match-title" style="margin: 0;">Filename Match: ${escapeHtml(match.matchedItem.packName)}</h4>
</div>
<div class="match-sub" style="margin-top: 0.35rem;">
Loaded file name <strong class="mono">${escapeHtml(report.filename)}</strong> matches stored entry, but the checksums &amp; hashes differ. This pack image may have been altered, recompiled, or is a different revision.
</div>
</div>
</div>
<div class="match-actions">
<button class="btn btn-primary btn-store-as-new">Store as Revision</button>
<button class="btn btn-secondary btn-view-in-reg">View Stored</button>
</div>
</div>
</div>
`;
}else{
bannerHtml=`
<div class="registry-match-box match-unregistered">
<div class="match-hdr">
<div class="match-title-row">
<span class="match-icon">📂</span>
<div>
<h4 class="match-title" style="margin: 0;">Unregistered Datapak</h4>
<div class="match-sub" style="margin-top: 0.35rem;">
<strong class="mono">${escapeHtml(report.filename)}</strong> is not yet stored in your Pack Registry. Store it to track its identity and enable renamed recognition.
</div>
</div>
</div>
<div class="match-actions">
<button class="btn btn-primary btn-store-current">+ Store in Registry</button>
</div>
</div>
</div>
`;
}
registryMatchBanner.innerHTML=bannerHtml;
registryMatchBanner.style.display='block';
const btnView=registryMatchBanner.querySelector('.btn-view-in-reg');
if(btnView){
btnView.addEventListener('click',()=>{
switchToTab('tab-registry');
if(match.matchedItem){
highlightRegistryRow(match.matchedItem.id);
}
});
}
const btnEdit=registryMatchBanner.querySelector('.btn-edit-pack-entry');
if(btnEdit&&match.matchedItem){
btnEdit.addEventListener('click',()=>{
openEditPackModal(match.matchedItem,false);
});
}
const btnUpdate=registryMatchBanner.querySelector('.btn-update-filename');
if(btnUpdate&&match.matchedItem){
btnUpdate.addEventListener('click',()=>{
if(confirm(`Update the stored filename for "${match.matchedItem.packName}" from "${match.originalFilename}" to "${match.currentFilename}"?`)){
registry.updateFilename(match.matchedItem.id,match.currentFilename);
renderRegistryMatchBanner(currentReport);
renderRegistryTab(currentReport);
}
});
}
const btnStoreNew=registryMatchBanner.querySelector('.btn-store-as-new');
if(btnStoreNew){
btnStoreNew.addEventListener('click',()=>{
openStoreCurrentPackModal();
});
}
const btnStoreCur=registryMatchBanner.querySelector('.btn-store-current');
if(btnStoreCur){
btnStoreCur.addEventListener('click',()=>{
openStoreCurrentPackModal();
});
}
}
function renderRegistryTab(report){
const allEntries=registry.getAll();
if(countRegistryBadge)countRegistryBadge.innerText=allEntries.length;
if(registryStatsBadge)registryStatsBadge.innerText=`${allEntries.length} Stored Packs`;
if(registryActiveCard){
if(!report){
registryActiveCard.innerHTML=`
<div style="text-align: center; color: var(--text-secondary); padding: 1rem;">
<p style="margin: 0; font-size: 0.95rem;">No Datapak image currently loaded.</p>
<p style="margin-top: 0.35rem; font-size: 0.82rem; color: var(--text-muted);">Open or drop an OPK file to inspect and compare its identity against the library.</p>
</div>
`;
}else{
const match=registry.matchReport(report);
const chk=report.checksums?report.checksums.file:null;
let statusBadge='<span class="status-pill status-notice">UNREGISTERED</span>';
if(match.status==='VERIFIED_MATCH'){
statusBadge='<span class="status-pill status-clean">VERIFIED MATCH</span>';
}else if(match.status==='RENAMED_MATCH'){
statusBadge='<span class="status-pill status-renamed">RENAMED ITEM</span>';
}else if(match.status==='MODIFIED_DIFFERENT_HASH'){
statusBadge='<span class="status-pill status-warnings">MODIFIED / HASH MISMATCH</span>';
}
let comparisonRows=`
<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin-top: 1rem;">
<div style="background: var(--bg-secondary); padding: 0.75rem 1rem; border-radius: 6px; border: 1px solid var(--border-subtle);">
<div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase;">Loaded Filename</div>
<div class="mono" style="font-size: 0.95rem; font-weight: 600; color: var(--text-primary); margin-top: 0.2rem;">${escapeHtml(report.filename)}</div>
</div>
<div style="background: var(--bg-secondary); padding: 0.75rem 1rem; border-radius: 6px; border: 1px solid var(--border-subtle);">
<div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase;">Suggested / Stored Name</div>
<div class="mono" style="font-size: 0.95rem; font-weight: 600; color: var(--text-primary); margin-top: 0.2rem;">${escapeHtml(match.matchedItem?match.matchedItem.packName:(report.suggestedPackName||'—'))}</div>
</div>
<div style="background: var(--bg-secondary); padding: 0.75rem 1rem; border-radius: 6px; border: 1px solid var(--border-subtle);">
<div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase;">Registry Pack Source</div>
<div style="font-size: 0.95rem; font-weight: 600; color: var(--text-primary); margin-top: 0.2rem;">${match.matchedItem?(match.matchedItem.source==='reference'?'Standard Reference':'User Catalog'):'Not in Library'}</div>
</div>
<div style="background: var(--bg-secondary); padding: 0.75rem 1rem; border-radius: 6px; border: 1px solid var(--border-subtle);">
<div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase;">Catalog MD5 Hash</div>
<div class="mono" style="font-size: 0.8rem; font-weight: 600; color: var(--accent-blue); margin-top: 0.2rem; word-break: break-all;">${escapeHtml(match.matchedItem?match.matchedItem.md5:(chk?chk.md5:'—'))}</div>
</div>
</div>
`;
if(match.isRenamed&&match.matchedItem){
comparisonRows+=`
<div style="margin-top: 1rem; padding: 0.75rem 1rem; border-radius: 6px; background: rgba(99, 102, 241, 0.08); border: 1px solid rgba(99, 102, 241, 0.25); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
<div>
<strong style="color: var(--status-renamed); font-size: 0.9rem;">Renamed File Correlation:</strong>
<span style="font-size: 0.85rem; color: var(--text-secondary); margin-left: 0.5rem;">
Registry Authoritative: <code class="mono" style="color: var(--text-primary); font-weight: 600;">${escapeHtml(match.originalFilename)}</code> &rarr; Loaded: <code class="mono" style="color: var(--status-renamed); font-weight: 600;">${escapeHtml(match.currentFilename)}</code>
</span>
</div>
<button class="btn btn-primary btn-sm btn-update-filename-card">Update Stored Name</button>
</div>
`;
}
registryActiveCard.innerHTML=`
<div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
<div>
<span style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.5px;">Active Pack Analysis</span>
<h4 style="margin: 0.15rem 0 0 0; font-size: 1.05rem;">${escapeHtml(report.filename)}</h4>
</div>
<div style="display: flex; align-items: center; gap: 0.75rem;">
${statusBadge}
<button class="btn btn-secondary btn-sm" id="btn-card-store-pack">${match.matchedItem?'Edit Entry':'+ Store Pack'}</button>
</div>
</div>
${comparisonRows}
`;
const btnCardStore=document.getElementById('btn-card-store-pack');
if(btnCardStore){
btnCardStore.addEventListener('click',()=>{
if(match.matchedItem){
openEditPackModal(match.matchedItem,false);
}else{
openStoreCurrentPackModal();
}
});
}
const btnUpdateCard=registryActiveCard.querySelector('.btn-update-filename-card');
if(btnUpdateCard&&match.matchedItem){
btnUpdateCard.addEventListener('click',()=>{
if(confirm(`Update the stored filename for "${match.matchedItem.packName}" from "${match.originalFilename}" to "${match.currentFilename}"?`)){
registry.updateFilename(match.matchedItem.id,match.currentFilename);
renderRegistryMatchBanner(currentReport);
renderRegistryTab(currentReport);
}
});
}
}
}
renderRegistryTable();
}
function renderRegistryTable(){
if(!registryTableBody)return;
const allEntries=registry.getAll();
const searchQuery=(registrySearch?registrySearch.value:'').trim().toLowerCase();
const filterSource=registryFilterSource?registryFilterSource.value:'all';
const matchInfo=currentReport?registry.matchReport(currentReport):null;
const matchedId=matchInfo&&matchInfo.matchedItem?matchInfo.matchedItem.id:null;
let filtered=allEntries.filter(e=>{
if(filterSource==='reference'&&e.source!=='reference')return false;
if(filterSource==='user'&&e.source!=='user')return false;
if(filterSource==='matched'){
if(!matchedId||e.id!==matchedId)return false;
}
if(searchQuery){
const matchName=(e.packName||'').toLowerCase().includes(searchQuery);
const matchFile=(e.filename||'').toLowerCase().includes(searchQuery);
const matchMd5=(e.md5||'').toLowerCase().includes(searchQuery);
const matchCrc=(e.crc32All||'').toLowerCase().includes(searchQuery);
const matchSum=(e.sumAll||'').toLowerCase().includes(searchQuery);
const matchNotes=(e.notes||'').toLowerCase().includes(searchQuery);
if(!matchName&&!matchFile&&!matchMd5&&!matchCrc&&!matchSum&&!matchNotes){
return false;
}
}
return true;
});
filtered.sort((a,b)=>{
if(matchedId){
if(a.id===matchedId)return -1;
if(b.id===matchedId)return 1;
}
return (a.packName||a.filename).localeCompare(b.packName||b.filename);
});
if(registryFilterCount){
registryFilterCount.innerText=`Showing ${filtered.length} of ${allEntries.length} packs`;
}
if(filtered.length===0){
registryTableBody.innerHTML=`
<tr>
<td colspan="8" style="text-align: center; color: var(--text-muted); padding: 2rem;">
${allEntries.length===0?'No packs stored in registry yet. Click "Load Reference Catalog" to populate 142 known packs, or store your own packs.':'No packs matching current filter.'}
</td>
</tr>
`;
return;
}
registryTableBody.innerHTML='';
filtered.forEach(item=>{
const tr=document.createElement('tr');
tr.id=`reg-row-${item.id}`;
let matchBadge='<span style="color: var(--text-muted);">—</span>';
let rowClass='';
if(currentReport&&matchInfo){
if(item.id===matchedId){
if(matchInfo.status==='VERIFIED_MATCH'){
matchBadge='<span class="status-pill status-clean" style="font-size: 0.72rem;">MATCH</span>';
rowClass='tr-matched-pack';
}else if(matchInfo.status==='RENAMED_MATCH'){
matchBadge='<span class="status-pill status-renamed" style="font-size: 0.72rem;">RENAMED</span>';
rowClass='tr-renamed-pack';
}else if(matchInfo.status==='MODIFIED_DIFFERENT_HASH'){
matchBadge='<span class="status-pill status-warnings" style="font-size: 0.72rem;">NAME ONLY</span>';
}
}
}
if(rowClass)tr.className=rowClass;
const isRenamed=currentReport&&matchInfo&&matchInfo.isRenamed&&item.id===matchedId;
tr.innerHTML=`
<td>${matchBadge}</td>
<td>
<strong>${escapeHtml(item.packName)}</strong>
${item.notes?`<div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.15rem;">${escapeHtml(item.notes)}</div>`:''}
</td>
<td>
<span class="mono">${escapeHtml(item.filename)}</span>
${isRenamed?`<div style="font-size: 0.72rem; color: var(--status-renamed); font-weight: 600; margin-top: 0.15rem;">Loaded as: ${escapeHtml(currentReport.filename)}</div>`:''}
${item.previousFilename?`<div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 0.15rem;">prev: ${escapeHtml(item.previousFilename)}</div>`:''}
</td>
<td class="mono" style="font-size: 0.75rem;">
${item.md5?`<span title="${escapeHtml(item.md5)}">${escapeHtml(item.md5)}</span>`:'<span style="color: var(--text-muted);">—</span>'}
</td>
<td class="mono" style="font-size: 0.75rem;">
<div>All: <strong>${item.crc32All||'—'}</strong></div>
<div style="color: var(--text-muted); font-size: 0.7rem;">Ex16: ${item.crc32Excl16||'—'}</div>
</td>
<td class="mono" style="font-size: 0.75rem;">
<div>All: <strong>${item.sumAll||'—'}</strong></div>
<div style="color: var(--text-muted); font-size: 0.7rem;">Ex16: ${item.sumExcl16||'—'}</div>
</td>
<td>
<span class="status-pill ${item.source==='reference'?'status-notice':'status-clean'}" style="font-size: 0.72rem;">
${item.source==='reference'?'Reference':'Custom'}
</span>
</td>
<td style="text-align: right; white-space: nowrap;">
<button class="btn-icon-mini btn-edit-entry" data-id="${escapeHtml(item.id)}" title="Edit pack details">✏️</button>
<button class="btn-icon-mini btn-delete-entry" data-id="${escapeHtml(item.id)}" title="Delete pack from registry" style="color: var(--status-critical);">🗑️</button>
</td>
`;
registryTableBody.appendChild(tr);
});
registryTableBody.querySelectorAll('.btn-edit-entry').forEach(btn=>{
btn.addEventListener('click',(e)=>{
e.stopPropagation();
const id=btn.getAttribute('data-id');
const entry=registry.getById(id);
if(entry)openEditPackModal(entry,false);
});
});
registryTableBody.querySelectorAll('.btn-delete-entry').forEach(btn=>{
btn.addEventListener('click',(e)=>{
e.stopPropagation();
const id=btn.getAttribute('data-id');
const entry=registry.getById(id);
if(entry&&confirm(`Delete "${entry.packName}" (${entry.filename}) from the registry?`)){
registry.remove(id);
renderRegistryMatchBanner(currentReport);
renderRegistryTab(currentReport);
}
});
});
}
function openStoreCurrentPackModal(){
if(!currentReport)return;
const chk=currentReport.checksums?currentReport.checksums.file:{};
const newEntry={
id:'',
filename:currentReport.filename,
packName:currentReport.suggestedPackName||currentReport.filename.replace(/\.[^/.]+$/,''),
md5:chk.md5||'',
crc32All:chk.crc32Hex||chk.crc32||'',
crc32Excl16:chk.crc32Excl16Hex||'',
sumAll:chk.sumAllHex||'',
sumExcl16:chk.sumExcl16Hex||'',
fileSize:currentReport.totalFileSize||null,
source:'user',
notes:''
};
openEditPackModal(newEntry,true);
}
function openEditPackModal(entry,isNew=false){
if(!modalPackName)return;
currentModalEntry=Object.assign({},entry);
if(modalPackTitle){
modalPackTitle.innerText=isNew?'Store Datapak in Registry':'Edit Stored Pack Details';
}
if(editPackId)editPackId.value=entry.id||'';
if(editPackName)editPackName.value=entry.packName||'';
if(editPackFilename)editPackFilename.value=entry.filename||'';
if(editPackNotes)editPackNotes.value=entry.notes||'';
if(editPackHashesPreview){
editPackHashesPreview.innerHTML=`
<div>MD5 Hash: <strong style="color: var(--text-primary);">${entry.md5||'N/A'}</strong></div>
<div>CRC-32: All: <strong style="color: var(--text-primary);">${entry.crc32All||'N/A'}</strong> | Excl16: <strong style="color: var(--text-primary);">${entry.crc32Excl16||'N/A'}</strong></div>
<div>Sum Bytes: All: <strong style="color: var(--text-primary);">${entry.sumAll||'N/A'}</strong> | Excl16: <strong style="color: var(--text-primary);">${entry.sumExcl16||'N/A'}</strong></div>
`;
}
modalPackName.classList.add('open');
if(editPackName)editPackName.focus();
}
function closePackModal(){
if(modalPackName)modalPackName.classList.remove('open');
currentModalEntry=null;
}
if(btnSavePackModal){
btnSavePackModal.addEventListener('click',()=>{
if(!currentModalEntry)return;
const enteredName=editPackName?editPackName.value.trim():'';
const enteredFilename=editPackFilename?editPackFilename.value.trim():'';
const enteredNotes=editPackNotes?editPackNotes.value.trim():'';
if(!enteredFilename){
alert('Filename is required.');
return;
}
if(!enteredName){
alert('Pack name is required.');
return;
}
currentModalEntry.packName=enteredName;
currentModalEntry.filename=enteredFilename;
currentModalEntry.notes=enteredNotes;
registry.addOrUpdate(currentModalEntry);
closePackModal();
renderRegistryMatchBanner(currentReport);
renderRegistryTab(currentReport);
});
}
if(btnClosePackModal)btnClosePackModal.addEventListener('click',closePackModal);
if(btnCancelPackModal)btnCancelPackModal.addEventListener('click',closePackModal);
if(modalPackName){
modalPackName.addEventListener('click',(e)=>{
if(e.target===modalPackName)closePackModal();
});
}
if(btnLoadReference){
btnLoadReference.addEventListener('click',()=>{
const catalog=(typeof window!=='undefined'&&window.REFERENCE_CATALOG)?window.REFERENCE_CATALOG:[];
if(!catalog||catalog.length===0){
alert('Reference catalog is not available in window.REFERENCE_CATALOG.');
return;
}
const added=registry.loadReferenceCatalog(catalog);
alert(`Reference catalog loaded successfully! ${added} new packs added. Total stored packs: ${registry.getAll().length}.`);
renderRegistryMatchBanner(currentReport);
renderRegistryTab(currentReport);
});
}
if(btnAddCurrentPack){
btnAddCurrentPack.addEventListener('click',()=>{
if(!currentReport){
alert('Please load a Data pack image first to store it into the registry.');
return;
}
openStoreCurrentPackModal();
});
}
if(btnExportRegistry){
btnExportRegistry.addEventListener('click',()=>{
const jsonText=registry.exportJSON();
const blob=new Blob([jsonText],{type:'application/json'});
const url=URL.createObjectURL(blob);
const a=document.createElement('a');
a.href=url;
a.download=`psion_opk_pack_registry_${new Date().toISOString().slice(0,10)}.json`;
document.body.appendChild(a);
a.click();
document.body.removeChild(a);
URL.revokeObjectURL(url);
});
}
if(btnImportRegistry&&registryImportFile){
btnImportRegistry.addEventListener('click',()=>{
registryImportFile.click();
});
registryImportFile.addEventListener('change',(e)=>{
if(e.target.files&&e.target.files.length>0){
const file=e.target.files[0];
const reader=new FileReader();
reader.onload=(event)=>{
try{
const result=registry.importJSON(event.target.result,'merge');
alert(`Successfully imported ${result.imported} packs from "${file.name}"! Total registry count: ${result.total}.`);
renderRegistryMatchBanner(currentReport);
renderRegistryTab(currentReport);
}catch(err){
alert('Error importing registry JSON: '+err.message);
}
registryImportFile.value='';
};
reader.readAsText(file);
}
});
}
if(btnClearRegistry){
btnClearRegistry.addEventListener('click',()=>{
const count=registry.getAll().length;
if(count===0){
alert('Registry is already empty.');
return;
}
if(confirm(`Are you sure you want to remove ALL ${count} stored packs from the registry? This cannot be undone.`)){
registry.clear();
renderRegistryMatchBanner(currentReport);
renderRegistryTab(currentReport);
}
});
}
if(registrySearch){
registrySearch.addEventListener('input',()=>{
renderRegistryTable();
});
}
if(registryFilterSource){
registryFilterSource.addEventListener('change',()=>{
renderRegistryTable();
});
}
renderRegistryTab(null);
function escapeHtml(str){
if(!str)return '';
return String(str)
.replace(/&/g,'&amp;')
.replace(/</g,'&lt;')
.replace(/>/g,'&gt;')
.replace(/"/g,'&quot;');
}
});