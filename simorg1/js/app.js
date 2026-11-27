'use strict';
document.addEventListener("DOMContentLoaded",function (){
var psion=new Psion("lcd-canvas");
psion.reset();
psion.startRunning();
var coverElem=document.getElementById("device-cover");
var coverToggleBtn=document.getElementById("btn-cover-toggle");
var btnHamburger=document.getElementById("btn-hamburger");
var btnCloseDrawer=document.getElementById("btn-close-drawer");
var drawerBackdrop=document.getElementById("drawer-backdrop");
var drawerPanel=document.getElementById("drawer-panel");
var toastEl=document.getElementById("toast-msg");
var packCountBadge=document.getElementById("pack-count-badge");
var tabBtns=document.querySelectorAll(".drawer-tabs .tab-btn");
var tabPanes=document.querySelectorAll(".drawer-body .tab-pane");
var chkSyncClockOnPower=document.getElementById("chk-sync-clock-on-power");
var btnSetClock=document.getElementById("btn-set-clock");
var switchSound=document.getElementById("switch-sound");
var keyboardOverlay=document.getElementById("keyboard-overlay");
var packDropOverlay=document.getElementById("pack-drop-overlay");
var contrastSlider=document.getElementById("contrast-slider");
var contrastVal=document.getElementById("contrast-val");
var spacingSlider=document.getElementById("spacing-slider");
var spacingVal=document.getElementById("spacing-val");
var checkLowBattery=document.getElementById("check-low-battery");
var isSoundEnabled=true;
var toastTimer=null;
function showToast(text,duration){
if(!toastEl)return;
toastEl.textContent=text;
toastEl.classList.add("show");
clearTimeout(toastTimer);
toastTimer=setTimeout(function (){
toastEl.classList.remove("show");
},duration||2200);
}
var audioCtx=null;
var buzzerOsc=null;
var buzzerGain=null;
var silentKeepAliveNode=null;
function initAudioContext(){
if(audioCtx){
if(audioCtx.state==="suspended")audioCtx.resume();
return;
}
try{
var AudioContextClass=window.AudioContext||window.webkitAudioContext;
if(!AudioContextClass)return;
audioCtx=new AudioContextClass();
var buffer=audioCtx.createBuffer(1,audioCtx.sampleRate*2,audioCtx.sampleRate);
silentKeepAliveNode=audioCtx.createBufferSource();
silentKeepAliveNode.buffer=buffer;
silentKeepAliveNode.loop=true;
var silentGain=audioCtx.createGain();
silentGain.gain.setValueAtTime(0.0001,audioCtx.currentTime);
silentKeepAliveNode.connect(silentGain);
silentGain.connect(audioCtx.destination);
silentKeepAliveNode.start(0);
}catch(err){
console.warn("Web Audio API initialization failed:",err);
}
}
function playKeyClick(){
if(!isSoundEnabled||!audioCtx)return;
try{
var osc=audioCtx.createOscillator();
var gain=audioCtx.createGain();
osc.type="square";
osc.frequency.setValueAtTime(2600,audioCtx.currentTime);
gain.gain.setValueAtTime(0.08,audioCtx.currentTime);
gain.gain.exponentialRampToValueAtTime(0.001,audioCtx.currentTime+0.007);
osc.connect(gain);
gain.connect(audioCtx.destination);
osc.start(audioCtx.currentTime);
osc.stop(audioCtx.currentTime+0.008);
}catch(_){}
}
function startBuzzerTone(freq){
if(!isSoundEnabled)return;
initAudioContext();
if(!audioCtx)return;
try{
stopBuzzerTone();
buzzerOsc=audioCtx.createOscillator();
buzzerGain=audioCtx.createGain();
buzzerOsc.type="square";
buzzerOsc.frequency.setValueAtTime(freq||3600,audioCtx.currentTime);
buzzerGain.gain.setValueAtTime(0.09,audioCtx.currentTime);
buzzerOsc.connect(buzzerGain);
buzzerGain.connect(audioCtx.destination);
buzzerOsc.start();
}catch(_){}
}
function stopBuzzerTone(){
if(buzzerOsc){
try{
buzzerOsc.stop();
buzzerOsc.disconnect();
}catch(_){}
buzzerOsc=null;
buzzerGain=null;
}
}
psion.setOnBuzzer(function (state,freq){
if(state==="stop"){
stopBuzzerTone();
}else if(state==="click"){
playKeyClick();
}else {
startBuzzerTone(freq);
}
});
if(switchSound){
switchSound.checked=isSoundEnabled;
switchSound.addEventListener("change",function (e){
isSoundEnabled=!!e.target.checked;
initAudioContext();
showToast(isSoundEnabled?"Sound enabled":"Sound muted");
});
}
function openDrawer(tabName){
if(drawerPanel&&drawerBackdrop){
drawerPanel.classList.add("is-open");
drawerBackdrop.classList.add("is-visible");
if(btnHamburger)btnHamburger.classList.add("is-open");
if(tabName)selectTab(tabName);
}
}
function closeDrawer(){
if(drawerPanel&&drawerBackdrop){
drawerPanel.classList.remove("is-open");
drawerBackdrop.classList.remove("is-visible");
if(btnHamburger)btnHamburger.classList.remove("is-open");
}
}
function toggleDrawer(){
if(drawerPanel&&drawerPanel.classList.contains("is-open")){
closeDrawer();
}else {
openDrawer();
}
}
if(btnHamburger){
btnHamburger.addEventListener("click",function (){
toggleDrawer();
});
}
if(btnCloseDrawer){
btnCloseDrawer.addEventListener("click",closeDrawer);
}
if(drawerBackdrop){
drawerBackdrop.addEventListener("click",closeDrawer);
}
function selectTab(tabName){
tabBtns.forEach(function (btn){
var isActive=btn.getAttribute("data-tab")===tabName;
btn.classList.toggle("is-active",isActive);
});
tabPanes.forEach(function (pane){
var isActive=pane.id===("tab-"+tabName);
pane.classList.toggle("is-active",isActive);
});
}
tabBtns.forEach(function (btn){
btn.addEventListener("click",function (){
var targetTab=btn.getAttribute("data-tab");
if(targetTab)selectTab(targetTab);
});
});
var syncClockOnPowerOn=localStorage.getItem("simorg1_sync_clock_on_power")==="true";
psion.autoSyncClock=syncClockOnPowerOn;
if(chkSyncClockOnPower){
chkSyncClockOnPower.checked=syncClockOnPowerOn;
chkSyncClockOnPower.addEventListener("change",function (e){
syncClockOnPowerOn=!!e.target.checked;
localStorage.setItem("simorg1_sync_clock_on_power",syncClockOnPowerOn?"true":"false");
psion.autoSyncClock=syncClockOnPowerOn;
if(syncClockOnPowerOn){
psion.setClock();
showToast("Clock autosync enabled & synced");
}else {
showToast("Clock autosync disabled");
}
});
}
if(btnSetClock){
btnSetClock.addEventListener("click",function (){
psion.setClock();
showToast("Clock synced to host local time");
});
}
var keyCells=[];
function buildVirtualKeyboard(){
keyboardOverlay.innerHTML="";
keyCells=[];
for(var r=0;r<6;r++){
keyCells[r]=[];
for(var c=0;c<6;c++){
var cell=document.createElement("div");
cell.className="key-cell";
cell.setAttribute("data-row",r);
cell.setAttribute("data-col",c);
(function (row,col,el){
function press(e){
e.preventDefault();
initAudioContext();
el.classList.add("key-pressed");
psion.pressKey(row,col,true);
playKeyClick();
}
function release(e){
e.preventDefault();
el.classList.remove("key-pressed");
psion.pressKey(row,col,false);
}
el.addEventListener("pointerdown",press);
el.addEventListener("pointerup",release);
el.addEventListener("pointercancel",release);
el.addEventListener("pointerleave",release);
})(r,c,cell);
keyboardOverlay.appendChild(cell);
keyCells[r][c]=cell;
}
}
}
buildVirtualKeyboard();
window.addEventListener("pointerdown",initAudioContext,{passive:true});
window.addEventListener("keydown",function (e){
initAudioContext();
if(e.key==="Escape"&&drawerPanel&&drawerPanel.classList.contains("is-open")){
closeDrawer();
return;
}
if(document.activeElement&&(document.activeElement.tagName==="INPUT"||document.activeElement.tagName==="SELECT")){
return;
}
psion.handleKeyDown(e);
playKeyClick();
});
window.addEventListener("keyup",function (e){
if(document.activeElement&&(document.activeElement.tagName==="INPUT"||document.activeElement.tagName==="SELECT")){
return;
}
psion.handleKeyUp(e);
});
var isCoverOpen=true;
function setCoverState(open){
isCoverOpen=!!open;
coverElem.classList.toggle("is-open",isCoverOpen);
coverElem.classList.toggle("is-closed",!isCoverOpen);
if(coverToggleBtn){
coverToggleBtn.textContent=isCoverOpen?"Slide Case Cover Closed":"Slide Case Cover Open";
}
}
if(coverToggleBtn){
coverToggleBtn.addEventListener("click",function (){
setCoverState(!isCoverOpen);
});
}
var dragStartY=0;
var isDraggingCover=false;
var lastCoverTapTime=0;
var coverTapTimer=null;
coverElem.addEventListener("pointerdown",function (e){
var rect=coverElem.getBoundingClientRect();
if(rect.height>0){
var relY=(e.clientY-rect.top)/rect.height;
if(!isCoverOpen&&relY<0.304)return;
}
isDraggingCover=true;
dragStartY=e.clientY;
coverElem.classList.add("is-dragging");
try{coverElem.setPointerCapture(e.pointerId);}catch(_){}
});
coverElem.addEventListener("pointermove",function (e){
if(!isDraggingCover)return;
var deltaY=e.clientY-dragStartY;
if(isCoverOpen&&deltaY<-35){
setCoverState(false);
isDraggingCover=false;
coverElem.classList.remove("is-dragging");
}else if(!isCoverOpen&&deltaY>35){
setCoverState(true);
isDraggingCover=false;
coverElem.classList.remove("is-dragging");
}
});
coverElem.addEventListener("pointerup",function (e){
if(!isDraggingCover)return;
isDraggingCover=false;
coverElem.classList.remove("is-dragging");
var deltaY=e.clientY-dragStartY;
if(Math.abs(deltaY)>35){
if(coverTapTimer){
clearTimeout(coverTapTimer);
coverTapTimer=null;
}
return;
}
var now=Date.now();
if(now-lastCoverTapTime<320){
if(coverTapTimer){
clearTimeout(coverTapTimer);
coverTapTimer=null;
}
lastCoverTapTime=0;
openDrawer();
}else {
lastCoverTapTime=now;
coverTapTimer=setTimeout(function (){
coverTapTimer=null;
setCoverState(!isCoverOpen);
},260);
}
});
coverElem.addEventListener("pointercancel",function (){
isDraggingCover=false;
coverElem.classList.remove("is-dragging");
});
function updatePackUI(){
var bus=psion.getBus();
var packs=bus?bus.getPacks():[null,null];
var count=0;
for(var slot=0;slot<2;slot++){
var num=slot+1;
var p=packs[slot];
var nameEl=document.getElementById("slot-name-"+num);
var metaEl=document.getElementById("slot-meta-"+num);
var dropStatusEl=document.getElementById("drop-status-"+num);
var raw=p?p.getRawData():null;
var isFitted=p&&p.isFormatted()&&raw&&raw.length>0;
if(isFitted){
count++;
var info=p.getInfo();
if(raw[0]===0x02){
nameEl.textContent="Link-Up Hardware Adapter";
metaEl.textContent="RS-232 Interface (ID $02)";
dropStatusEl.textContent="Link Active";
}else {
nameEl.textContent=info.name||("Datapak Slot "+(slot===0?"A":"B"));
metaEl.textContent=(info.size/1024)+"K Linear Datapak ("+(info.isEprom?"EPROM":"RAM")+")";
dropStatusEl.textContent=(info.size/1024)+"K Inserted";
}
}else {
nameEl.textContent="Empty (No Pack)";
metaEl.textContent="Linear Datapak Slot "+(slot===0?"A":"B");
dropStatusEl.textContent="Empty";
}
}
if(packCountBadge)packCountBadge.textContent=count;
var connectorNow=psion.isConnectorPackFitted();
var justFittedConnector=!lastConnectorFitted&&connectorNow&&hasCompletedInitialBoot;
if(lastConnectorFitted&&!connectorNow&&webSerialPort){
disconnectWebSerial();
}
lastConnectorFitted=connectorNow;
updateSerialUI();
if(hasCompletedInitialBoot&&!isRestoringSession){
saveSessionPacks();
}
if(justFittedConnector&&!isRestoringSession){
if(hasWebSerialSupport&&!webSerialPort){
connectWebSerial();
}else if(!hasWebSerialSupport){
showToast("Connector Pack ($02) fitted — Web Serial not supported in this browser",3500);
}
}
}
function loadBundledPack(slot,packPath){
if(!packPath)return;
var failed=false;
var file=new BinaryFile(packPath,false,function (err){
if(err){
failed=true;
psion.setPack(null,slot);
var sel=document.getElementById("select-pack-"+(slot+1));
if(sel)sel.value="";
updatePackUI();
showToast("Pack not available: "+packPath);
return;
}
updatePackUI();
var bus=psion.getBus();
var p=bus?bus.getPacks()[slot]:null;
if(p&&p.getRawData()&&p.getRawData()[0]===0x03){
psion.reset();
psion.autoSyncClock=syncClockOnPowerOn;
psion.powerOn();
if(syncClockOnPowerOn)psion.setClock();
updatePackUI();
}
});
if(failed)return;
var pack=new Pack(file,function (){
if(failed)return;
updatePackUI();
showToast("Datapak loaded in Slot "+(slot+1));
if(pack.getRawData()&&pack.getRawData()[0]===0x03){
psion.reset();
psion.autoSyncClock=syncClockOnPowerOn;
psion.powerOn();
if(syncClockOnPowerOn)psion.setClock();
updatePackUI();
}
});
psion.setPack(pack,slot);
updatePackUI();
}
function probePackOverHttp(packPath){
if(typeof window!=="undefined"&&window.location&&window.location.protocol==="file:"){
return Promise.resolve(false);
}
if(typeof fetch==="function"){
return fetch(packPath,{method:"HEAD",cache:"no-store"}).then(function (res){
if(res.ok)return true;
if(res.status===405){
return fetch(packPath,{method:"GET",cache:"no-store"}).then(function (getRes){
return!!getRes.ok;
});
}
return false;
}).catch(function (){
return false;
});
}
return new Promise(function (resolve){
try{
var req=new XMLHttpRequest();
req.open("HEAD",packPath,true);
req.onload=function (){
resolve(req.status>=200&&req.status<300);
};
req.onerror=function (){resolve(false);};
req.send(null);
}catch(e){
resolve(false);
}
});
}
function isPackAvailable(packPath){
if(!packPath)return Promise.resolve(false);
if(typeof EmbeddedAssets!=="undefined"&&EmbeddedAssets[packPath]){
return Promise.resolve(true);
}
if(typeof AssetStore!=="undefined"&&AssetStore.isSupported()){
return AssetStore.has(packPath).then(function (found){
if(found)return true;
return probePackOverHttp(packPath);
}).catch(function (){
return probePackOverHttp(packPath);
});
}
return probePackOverHttp(packPath);
}
function filterAvailableBundledPacks(){
var selects=[
document.getElementById("select-pack-1"),
document.getElementById("select-pack-2")
];
var uniquePaths={};
var i,j,sel,opts;
for(i=0;i<selects.length;i++){
sel=selects[i];
if(!sel)continue;
opts=sel.options;
for(j=0;j<opts.length;j++){
if(opts[j].value){
uniquePaths[opts[j].value]=true;
}
}
}
var paths=Object.keys(uniquePaths);
if(paths.length===0)return Promise.resolve();
var checks=paths.map(function (p){
return isPackAvailable(p).then(function (available){
return {path:p,available:available};
});
});
return Promise.all(checks).then(function (results){
var availableMap={};
for(i=0;i<results.length;i++){
availableMap[results[i].path]=results[i].available;
}
for(i=0;i<selects.length;i++){
sel=selects[i];
if(!sel)continue;
var toRemove=[];
var remainingCount=0;
var placeholder=null;
for(j=0;j<sel.options.length;j++){
var opt=sel.options[j];
if(!opt.value){
placeholder=opt;
continue;
}
if(!availableMap[opt.value]){
toRemove.push(opt);
}else {
remainingCount++;
}
}
for(j=0;j<toRemove.length;j++){
sel.removeChild(toRemove[j]);
}
if(remainingCount===0){
if(placeholder){
placeholder.textContent="-- No Bundled Packs --";
}
sel.disabled=true;
}
}
});
}
function formatBlank(slot,sizeBytes){
var name=(sizeBytes/1024)+"K BLANK";
var pack=Pack.createBlank(sizeBytes,name);
psion.setPack(pack,slot);
updatePackUI();
showToast("Formatted blank "+(sizeBytes/1024)+"K pack in Slot "+(slot+1));
}
function ejectPack(slot){
psion.setPack(null,slot);
updatePackUI();
showToast("Ejected Datapak from Slot "+(slot+1));
}
function downloadPack(slot){
var bus=psion.getBus();
var packs=bus?bus.getPacks():[null,null];
var p=packs[slot];
if(!p){
showToast("Slot "+(slot+1)+" is empty");
return;
}
var bytes=p.exportBytes();
var blob=new Blob([bytes],{type:"application/octet-stream"});
var url=URL.createObjectURL(blob);
var a=document.createElement("a");
a.href=url;
a.download=(slot===0?"slotA_":"slotB_")+(p.getName()||"pack").toLowerCase().replace(/[^a-z0-9]/g,"_")+".op1";
document.body.appendChild(a);
a.click();
document.body.removeChild(a);
setTimeout(function (){URL.revokeObjectURL(url);},1000);
}
function parseIntelHex(text){
var lines=text.split(/\r?\n/);
var records=[];
var maxAddr=0;
var hasValid=false;
for(var i=0;i<lines.length;i++){
var line=lines[i].trim();
if(!line||line[0]!==':')continue;
line=line.slice(1);
if(line.length<10)continue;
var count=parseInt(line.slice(0,2),16);
var addr=parseInt(line.slice(2,6),16);
var type=parseInt(line.slice(6,8),16);
if(type===0x00){
var data=new Uint8Array(count);
for(var b=0;b<count;b++){
data[b]=parseInt(line.slice(8+b*2,10+b*2),16);
}
records.push({addr:addr,data:data});
if(addr+count>maxAddr)maxAddr=addr+count;
hasValid=true;
}else if(type===0x01){
break;
}
}
if(!hasValid||maxAddr===0)return null;
var out=new Uint8Array(maxAddr);
for(var k=0;k<maxAddr;k++)out[k]=0xff;
for(var r=0;r<records.length;r++){
out.set (records[r].data,records[r].addr);
}
return out;
}
function handleFileUpload(slot,file){
if(!file)return;
var reader=new FileReader();
reader.onload=function (e){
try{
var arr=new Uint8Array(e.target.result);
if(arr.length>0&&arr[0]===0x3a){
try{
var hexDecoded=parseIntelHex(new TextDecoder().decode(arr));
if(hexDecoded&&hexDecoded.length>0){
arr=hexDecoded;
}
}catch(_){}
}
var pack=new Pack({bytes:arr,name:file.name});
psion.setPack(pack,slot);
if(pack.getRawData()&&pack.getRawData()[0]===0x03){
psion.reset();
psion.autoSyncClock=syncClockOnPowerOn;
psion.powerOn();
if(syncClockOnPowerOn)psion.setClock();
}
updatePackUI();
setCoverState(true);
playKeyClick();
showToast("Uploaded pack to Slot "+(slot+1));
}catch(err){
console.error("Failed to load pack file:",err);
showToast("Error loading Datapak: "+err.message);
}
};
reader.onerror=function (err){
console.error("FileReader error:",err);
showToast("Could not read file");
};
reader.readAsArrayBuffer(file);
}
document.getElementById("select-pack-1").addEventListener("change",function (e){
loadBundledPack(0,e.target.value);
});
document.getElementById("btn-format-8k-1").addEventListener("click",function (){formatBlank(0,8192);});
document.getElementById("btn-format-16k-1").addEventListener("click",function (){formatBlank(0,16384);});
document.getElementById("btn-format-32k-1").addEventListener("click",function (){formatBlank(0,32768);});
document.getElementById("btn-eject-1").addEventListener("click",function (){ejectPack(0);});
document.getElementById("btn-download-1").addEventListener("click",function (){downloadPack(0);});
document.getElementById("file-upload-1").addEventListener("change",function (e){
if(e.target.files&&e.target.files[0]){
handleFileUpload(0,e.target.files[0]);
}
e.target.value='';
});
document.getElementById("select-pack-2").addEventListener("change",function (e){
loadBundledPack(1,e.target.value);
});
document.getElementById("btn-format-8k-2").addEventListener("click",function (){formatBlank(1,8192);});
document.getElementById("btn-format-16k-2").addEventListener("click",function (){formatBlank(1,16384);});
document.getElementById("btn-format-32k-2").addEventListener("click",function (){formatBlank(1,32768);});
document.getElementById("btn-eject-2").addEventListener("click",function (){ejectPack(1);});
document.getElementById("btn-download-2").addEventListener("click",function (){downloadPack(1);});
document.getElementById("file-upload-2").addEventListener("change",function (e){
if(e.target.files&&e.target.files[0]){
handleFileUpload(1,e.target.files[0]);
}
e.target.value='';
});
filterAvailableBundledPacks();
var windowDragCounter=0;
function isFilesDrag(e){
if(!e.dataTransfer||!e.dataTransfer.types)return false;
for(var i=0;i<e.dataTransfer.types.length;i++){
if(e.dataTransfer.types[i]==="Files")return true;
}
return false;
}
function showDropOverlay(){
if(!drawerPanel||!drawerPanel.classList.contains("is-open")){
packDropOverlay.classList.add("is-active");
}
}
function hideDropOverlay(){
windowDragCounter=0;
packDropOverlay.classList.remove("is-active");
clearAllDropZoneHighlights();
}
window.addEventListener("dragenter",function (e){
if(!isFilesDrag(e))return;
windowDragCounter++;
if(windowDragCounter===1){
showDropOverlay();
}
});
window.addEventListener("dragleave",function (e){
if(!isFilesDrag(e))return;
windowDragCounter--;
if(windowDragCounter<=0){
hideDropOverlay();
}
});
window.addEventListener("dragover",function (e){
if(!isFilesDrag(e))return;
e.preventDefault();
if(e.dataTransfer){
e.dataTransfer.dropEffect="copy";
}
});
function clearAllDropZoneHighlights(){
var highlighted=document.querySelectorAll(".drag-over");
for(var i=0;i<highlighted.length;i++){
highlighted[i].classList.remove("drag-over");
}
}
window.addEventListener("drop",function (e){
e.preventDefault();
var wasActive=packDropOverlay.classList.contains("is-active");
hideDropOverlay();
if(wasActive&&e.dataTransfer&&e.dataTransfer.files&&e.dataTransfer.files.length>0){
var rect=packDropOverlay.getBoundingClientRect();
if(e.clientX>=rect.left&&e.clientX<=rect.right&&
e.clientY>=rect.top&&e.clientY<=rect.bottom){
var midY=rect.top+(rect.height/2);
var targetSlot=(e.clientY<midY)?0:1;
handleFileUpload(targetSlot,e.dataTransfer.files[0]);
}
}
});
function setupDropZone(zoneElem,slotIndex){
if(!zoneElem)return;
zoneElem.addEventListener("dragenter",function (e){
if(!isFilesDrag(e))return;
e.preventDefault();
zoneElem.classList.add("drag-over");
});
zoneElem.addEventListener("dragover",function (e){
if(!isFilesDrag(e))return;
e.preventDefault();
e.stopPropagation();
if(e.dataTransfer){
e.dataTransfer.dropEffect="copy";
}
zoneElem.classList.add("drag-over");
});
zoneElem.addEventListener("dragleave",function (e){
if(e.relatedTarget&&zoneElem.contains(e.relatedTarget)){
return;
}
zoneElem.classList.remove("drag-over");
});
zoneElem.addEventListener("drop",function (e){
e.preventDefault();
e.stopPropagation();
hideDropOverlay();
if(e.dataTransfer&&e.dataTransfer.files&&e.dataTransfer.files.length>0){
handleFileUpload(slotIndex,e.dataTransfer.files[0]);
}
});
}
setupDropZone(document.getElementById("drop-zone-1"),0);
setupDropZone(document.getElementById("drop-zone-2"),1);
setupDropZone(document.getElementById("slot-card-1"),0);
setupDropZone(document.getElementById("slot-card-2"),1);
var savedContrast=localStorage.getItem("simorg1_contrast_level");
if(savedContrast!==null){
var parsedContrast=parseInt(savedContrast,10);
if(!isNaN(parsedContrast)&&parsedContrast>=0&&parsedContrast<=10){
psion.setContrastLevel(parsedContrast);
if(contrastSlider)contrastSlider.value=parsedContrast;
if(contrastVal)contrastVal.textContent=parsedContrast+" / 10";
}
}
var savedSpacing=localStorage.getItem("simorg1_pixel_spacing");
if(savedSpacing!==null){
var parsedSpacing=parseInt(savedSpacing,10);
if(!isNaN(parsedSpacing)&&parsedSpacing>=0&&parsedSpacing<=2){
psion.setPixelSpacing(parsedSpacing);
if(spacingSlider)spacingSlider.value=parsedSpacing;
if(spacingVal)spacingVal.textContent=parsedSpacing===0?"0 px (Solid)":(parsedSpacing+" px");
}
}
contrastSlider.addEventListener("input",function (e){
var val=parseInt(e.target.value,10);
psion.setContrastLevel(val);
contrastVal.textContent=val+" / 10";
try{
localStorage.setItem("simorg1_contrast_level",val.toString());
}catch(err){
console.warn("Could not save contrast to localStorage:",err);
}
});
if(spacingSlider){
spacingSlider.addEventListener("input",function (e){
var val=parseInt(e.target.value,10);
psion.setPixelSpacing(val);
if(spacingVal)spacingVal.textContent=val===0?"0 px (Solid)":(val+" px");
try{
localStorage.setItem("simorg1_pixel_spacing",val.toString());
}catch(err){
console.warn("Could not save pixel spacing to localStorage:",err);
}
});
}
var switchLcdSmooth=document.getElementById("switch-lcd-smooth");
var lcdCanvasEl=document.getElementById("lcd-canvas");
function applyLcdSmoothing(enabled){
psion.setLcdSmoothing(enabled);
if(lcdCanvasEl)lcdCanvasEl.classList.toggle("is-smooth",!!enabled);
if(switchLcdSmooth)switchLcdSmooth.checked=!!enabled;
}
try{
applyLcdSmoothing(localStorage.getItem("simorg1_lcd_smooth")==="1");
}catch(_){}
if(switchLcdSmooth){
switchLcdSmooth.addEventListener("change",function (e){
var enabled=!!e.target.checked;
applyLcdSmoothing(enabled);
try{
localStorage.setItem("simorg1_lcd_smooth",enabled?"1":"0");
}catch(err){
console.warn("Could not save LCD smoothing to localStorage:",err);
}
});
}
checkLowBattery.addEventListener("change",function (e){
psion.getKeyboard().setBatteryLow(e.target.checked);
});
document.getElementById("btn-power-toggle").addEventListener("click",function (){
initAudioContext();
if(psion.isSwitchedOff()){
psion.powerOn();
if(syncClockOnPowerOn)psion.setClock();
showToast("Powered ON");
}else {
psion.powerOff();
showToast("Standby / Power OFF");
}
});
document.getElementById("btn-cold-reset").addEventListener("click",function (){
if(confirm("Perform Cold Hardware Reset? This will clear all 2K RAM, resetting internal state.")){
psion.reset();
psion.autoSyncClock=syncClockOnPowerOn;
psion.powerOn();
if(syncClockOnPowerOn)psion.setClock();
updatePackUI();
showToast("Cold Reset Completed");
}
});
document.getElementById("btn-save-snapshot").addEventListener("click",function (){
try{
var snap=psion.createSnapshot();
if(snap){
localStorage.setItem("simorg1_snapshot_state",snap.getDataUrl());
showToast("Snapshot saved successfully to browser storage");
}
}catch(err){
showToast("Failed to save snapshot: "+err.message);
}
});
document.getElementById("btn-load-snapshot").addEventListener("click",function (){
try{
var dataUrl=localStorage.getItem("simorg1_snapshot_state");
if(!dataUrl){
showToast("No saved snapshot found in browser storage");
return;
}
var bin=new BinaryFile("snapshot.bin",true);
bin.setLoadedData(BinaryFile.decodeBase64(dataUrl.split(",")[1]));
var snap=new Snapshot(bin);
psion.applySnapshotData(snap);
updatePackUI();
showToast("Snapshot restored successfully");
}catch(err){
showToast("Failed to restore snapshot: "+err.message);
}
});
var serialStatusBadge=document.getElementById("serial-status-badge");
var serialPackHint=document.getElementById("serial-pack-hint");
var serialSciModeEl=document.getElementById("serial-sci-mode");
var serialCountersEl=document.getElementById("serial-counters");
var selectSerialBaud=document.getElementById("select-serial-baud");
var btnSerialConnect=document.getElementById("btn-serial-connect");
var inputSerialSend=document.getElementById("input-serial-send");
var selectSerialEol=document.getElementById("select-serial-eol");
var btnSerialSend=document.getElementById("btn-serial-send");
var serialTxLogWrap=document.getElementById("serial-tx-log-wrap");
var serialTxLogEl=document.getElementById("serial-tx-log");
var btnSerialClearLog=document.getElementById("btn-serial-clear-log");
var hasWebSerialSupport=typeof navigator!=="undefined"&&"serial" in navigator;
var webSerialPort=null;
var webSerialReader=null;
var webSerialKeepReading=false;
var webSerialActiveBaud=9600;
var webSerialTxBuffer=[];
var webSerialFlushScheduled=false;
var webSerialFlushing=false;
var serialUiFlushScheduled=false;
var serialTxLogDirty=false;
var serialTxLogText="";
var lastConnectorFitted=false;
var hasCompletedInitialBoot=false;
function getTargetSerialBaud(){
if(selectSerialBaud&&selectSerialBaud.value!=="auto"){
var parsed=parseInt(selectSerialBaud.value,10);
if(!isNaN(parsed)&&parsed>0)return parsed;
}
var st=psion&&typeof psion.getSerialState==="function"?psion.getSerialState():null;
return (st&&st.baudRate>=50)?st.baudRate:9600;
}
function updateSerialUI(){
var st=psion&&typeof psion.getSerialState==="function"?psion.getSerialState():null;
var connectorFitted=!!(st&&st.connectorFitted);
if(serialSciModeEl&&st){
var activeFlag=(st.rxEnabled||st.txEnabled)?"Active":(connectorFitted?"Ready":"Idle");
serialSciModeEl.textContent="SCI: "+st.baudRate+" baud ("+activeFlag+")";
}
if(serialCountersEl&&st){
serialCountersEl.textContent="TX: "+st.txCount+" B • RX: "+st.rxCount+" B";
}
if(serialPackHint){
serialPackHint.style.display=connectorFitted?"none":"block";
}
if(serialStatusBadge){
if(!connectorFitted){
serialStatusBadge.textContent="Needs $02 Pack";
serialStatusBadge.className="serial-badge is-disabled";
}else if(!hasWebSerialSupport){
serialStatusBadge.textContent="No Web Serial API";
serialStatusBadge.className="serial-badge is-unsupported";
}else if(webSerialPort){
serialStatusBadge.textContent="Connected • "+webSerialActiveBaud;
serialStatusBadge.className="serial-badge is-connected";
}else {
serialStatusBadge.textContent="Disconnected";
serialStatusBadge.className="serial-badge is-disconnected";
}
}
if(btnSerialConnect){
btnSerialConnect.disabled=!connectorFitted;
btnSerialConnect.textContent=webSerialPort?"Disconnect Serial":"Connect Serial Port";
btnSerialConnect.classList.toggle("danger-btn",!!webSerialPort);
}
if(selectSerialBaud)selectSerialBaud.disabled=!connectorFitted;
if(inputSerialSend)inputSerialSend.disabled=!connectorFitted;
if(selectSerialEol)selectSerialEol.disabled=!connectorFitted;
if(btnSerialSend)btnSerialSend.disabled=!connectorFitted;
}
async function flushWebSerialTxQueue(){
webSerialFlushScheduled=false;
if(webSerialFlushing||webSerialTxBuffer.length===0)return;
if(!webSerialPort||!webSerialPort.writable){
webSerialTxBuffer.length=0;
return;
}
if(webSerialPort.writable.locked)return;
webSerialFlushing=true;
var writer=null;
try{
writer=webSerialPort.writable.getWriter();
while(webSerialTxBuffer.length>0&&webSerialPort&&webSerialPort.writable){
var chunk=new Uint8Array(webSerialTxBuffer);
webSerialTxBuffer.length=0;
await writer.write(chunk);
}
}catch(err){
console.warn("Web Serial write error:",err);
}finally{
if(writer){
try{writer.releaseLock();}catch(_){}
}
webSerialFlushing=false;
if(webSerialTxBuffer.length>0&&webSerialPort&&webSerialPort.writable&&!webSerialFlushScheduled){
webSerialFlushScheduled=true;
Promise.resolve().then(flushWebSerialTxQueue);
}
}
}
function flushSerialUiUpdates(){
serialUiFlushScheduled=false;
if(serialTxLogDirty&&serialTxLogEl&&serialTxLogWrap){
serialTxLogDirty=false;
serialTxLogWrap.style.display="flex";
serialTxLogEl.textContent=serialTxLogText;
serialTxLogEl.scrollTop=serialTxLogEl.scrollHeight;
}
updateSerialUI();
}
function scheduleSerialUiFlush(){
if(serialUiFlushScheduled)return;
serialUiFlushScheduled=true;
if(typeof requestAnimationFrame==="function"&&(typeof document==="undefined"||document.visibilityState!=="hidden")){
requestAnimationFrame(flushSerialUiUpdates);
}else {
setTimeout(flushSerialUiUpdates,16);
}
}
function appendSerialTxLog(b){
if(!serialTxLogEl||!serialTxLogWrap)return;
if(b===0x11||b===0x13)return;
var ch="";
if(b===0x0d){
ch="\n";
}else if(b===0x0a){
if(!serialTxLogText.endsWith("\n"))ch="\n";
}else if(b>=32&&b<127){
ch=String.fromCharCode(b);
}else {
ch="["+b.toString(16).toUpperCase().padStart(2,"0")+"]";
}
serialTxLogText+=ch;
if(serialTxLogText.length>2048){
serialTxLogText=serialTxLogText.slice(-2048);
}
serialTxLogDirty=true;
}
async function readWebSerialLoop(port){
while(port&&port.readable&&webSerialKeepReading){
try{
webSerialReader=port.readable.getReader();
while(webSerialKeepReading){
var res=await webSerialReader.read();
if(res.done)break;
if(res.value&&res.value.length>0&&psion){
psion.sendSerialBytes(res.value);
updateSerialUI();
}
}
}catch(err){
if(webSerialKeepReading){
console.warn("Web Serial read error:",err);
}
break;
}finally{
if(webSerialReader){
try{webSerialReader.releaseLock();}catch(_){}
webSerialReader=null;
}
}
}
}
async function connectWebSerial(){
if(!psion.isConnectorPackFitted()){
showToast("Insert a Connector Pack (ID $02) first to enable Web Serial",3500);
return;
}
if(!hasWebSerialSupport){
showToast("Web Serial API is not supported in this browser (use Chrome or Edge)",4000);
return;
}
try{
var port=await navigator.serial.requestPort();
var baudRate=getTargetSerialBaud();
await port.open({
baudRate:baudRate,
dataBits:8,
stopBits:1,
parity:"none",
flowControl:"none"
});
if(typeof port.setSignals==="function"){
port.setSignals({dataTerminalReady:true,requestToSend:true}).catch(function (){});
}
webSerialPort=port;
webSerialActiveBaud=baudRate;
webSerialKeepReading=true;
if(psion&&typeof psion.setSerialLines==="function"){
psion.setSerialLines(true,true);
}
updateSerialUI();
showToast("Web Serial connected at "+baudRate+" baud");
readWebSerialLoop(port);
}catch(err){
if(err&&err.name==="SecurityError"){
showToast("Connector Pack ($02) fitted — click 'Connect Serial Port' to choose a port",4000);
}else if(err&&err.name!=="NotFoundError"){
showToast("Serial connection failed: "+(err.message||err),3500);
}
}
}
async function disconnectWebSerial(){
webSerialKeepReading=false;
if(webSerialReader){
try{await webSerialReader.cancel();}catch(_){}
webSerialReader=null;
}
if(webSerialPort){
try{await webSerialPort.close();}catch(_){}
webSerialPort=null;
}
updateSerialUI();
showToast("Web Serial disconnected");
}
function sendQuickSerialInput(){
if(!inputSerialSend||!psion||!psion.isConnectorPackFitted())return;
var raw=inputSerialSend.value;
var eol=selectSerialEol?selectSerialEol.value:"cr";
var suffix="";
if(eol==="cr")suffix="\r";
else if(eol==="crlf")suffix="\r\n";
var fullStr=raw+suffix;
if(fullStr.length===0)return;
var bytes=new Uint8Array(fullStr.length);
for(var i=0;i<fullStr.length;i++){
bytes[i]=fullStr.charCodeAt(i)&0xff;
}
psion.sendSerialBytes(bytes);
inputSerialSend.value="";
updateSerialUI();
showToast("Sent "+bytes.length+" byte"+(bytes.length===1?"":"s")+" to Psion SCI RX ($0012)",1800);
}
function initWebSerialUI(){
if(psion){
psion.setSerialTxCallback(function (txByte){
webSerialTxBuffer.push(txByte&0xff);
if(!webSerialFlushScheduled&&!webSerialFlushing){
webSerialFlushScheduled=true;
Promise.resolve().then(flushWebSerialTxQueue);
}
appendSerialTxLog(txByte&0xff);
scheduleSerialUiFlush();
});
psion.setSerialConfigCallback(function (){
scheduleSerialUiFlush();
});
}
if(btnSerialConnect){
btnSerialConnect.addEventListener("click",function (){
if(webSerialPort){
disconnectWebSerial();
}else {
connectWebSerial();
}
});
}
if(btnSerialSend){
btnSerialSend.addEventListener("click",sendQuickSerialInput);
}
if(inputSerialSend){
inputSerialSend.addEventListener("keydown",function (e){
if(e.key==="Enter"){
e.preventDefault();
sendQuickSerialInput();
}
});
}
if(btnSerialClearLog){
btnSerialClearLog.addEventListener("click",function (){
serialTxLogText="";
serialTxLogDirty=false;
if(serialTxLogEl)serialTxLogEl.textContent="";
if(serialTxLogWrap)serialTxLogWrap.style.display="none";
if(psion&&typeof psion.resetSerialCounters==="function"){
psion.resetSerialCounters();
}
updateSerialUI();
});
}
if(hasWebSerialSupport&&navigator.serial&&typeof navigator.serial.addEventListener==="function"){
navigator.serial.addEventListener("disconnect",function (e){
if(webSerialPort&&e.target===webSerialPort){
webSerialKeepReading=false;
webSerialReader=null;
webSerialPort=null;
updateSerialUI();
showToast("Serial device disconnected");
}
});
}
updateSerialUI();
}
initWebSerialUI();
var AUTO_SNAPSHOT_B64_KEY="simorg1_auto_snapshot_b64";
var AUTO_SNAPSHOT_IDB_KEY="simorg1/auto_last_state.sna";
var isRestoringSession=false;
var lastAutoSnapshotTime=0;
function uint8ToBase64(bytes){
var binary="";
var chunk=8192;
for(var i=0;i<bytes.length;i+=chunk){
binary+=String.fromCharCode.apply(null,bytes.subarray(i,i+chunk));
}
return window.btoa(binary);
}
function base64ToUint8(b64){
var binary=window.atob(b64);
var len=binary.length;
var bytes=new Uint8Array(len);
for(var i=0;i<len;i++){
bytes[i]=binary.charCodeAt(i);
}
return bytes;
}
function saveSessionPacks(){
var bus=psion.getBus();
var packs=bus?bus.getPacks():[null,null];
for(var slot=0;slot<2;slot++){
var p=packs[slot];
var raw=p?p.getRawData():null;
if(p&&p.isFormatted()&&raw&&raw.length>0){
try{
var op1Bytes=p.exportBytes();
if(op1Bytes&&op1Bytes.length>0){
var meta={
name:p.getName()||("Slot "+(slot+1)),
size:op1Bytes.length,
savedAt:Date.now()
};
localStorage.setItem("simorg1_slot_meta_"+slot,JSON.stringify(meta));
if(typeof AssetStore!=="undefined"&&AssetStore.isSupported()){
AssetStore.put("simorg1/auto_pack_"+slot+".op1",op1Bytes).catch(function (){});
}
if(op1Bytes.length<=65536){
try{
localStorage.setItem("simorg1_slot_data_b64_"+slot,uint8ToBase64(op1Bytes));
}catch(_){
localStorage.removeItem("simorg1_slot_data_b64_"+slot);
}
}else {
localStorage.removeItem("simorg1_slot_data_b64_"+slot);
}
}
}catch(err){
console.warn("Could not persist pack in slot "+slot+":",err);
}
}else {
try{
localStorage.removeItem("simorg1_slot_meta_"+slot);
localStorage.removeItem("simorg1_slot_data_b64_"+slot);
}catch(_){}
if(typeof AssetStore!=="undefined"&&AssetStore.isSupported()){
AssetStore.remove("simorg1/auto_pack_"+slot+".op1").catch(function (){});
}
}
}
}
function saveAutoSnapshot(force){
if(isRestoringSession||!hasCompletedInitialBoot)return;
var now=Date.now();
if(!force&&(now-lastAutoSnapshotTime)<500)return;
lastAutoSnapshotTime=now;
saveSessionPacks();
try{
var sna=psion.createSnapshot();
if(!sna)return;
var rawData=sna.getRawData();
if(!rawData)return;
var len=rawData.length;
var fileBytes=new Uint8Array(len+4);
fileBytes[0]=83;
fileBytes[1]=78;
fileBytes[2]=65;
fileBytes[3]=1;
fileBytes.set (rawData,4);
try{
localStorage.setItem(AUTO_SNAPSHOT_B64_KEY,uint8ToBase64(fileBytes));
}catch(e){
console.warn("Could not save auto-snapshot to localStorage:",e);
}
if(typeof AssetStore!=="undefined"&&AssetStore.isSupported()){
AssetStore.put(AUTO_SNAPSHOT_IDB_KEY,fileBytes).catch(function (){});
}
}catch(err){
console.warn("Auto-snapshot save failed:",err);
}
}
function restoreSessionPacks(){
for(var slot=0;slot<2;slot++){
var metaRaw=null;
var b64=null;
try{
metaRaw=localStorage.getItem("simorg1_slot_meta_"+slot);
b64=localStorage.getItem("simorg1_slot_data_b64_"+slot);
}catch(_){}
if(b64&&metaRaw){
try{
var meta=JSON.parse(metaRaw);
var bytes=base64ToUint8(b64);
if(bytes&&bytes.length>0){
var pack=new Pack({bytes:bytes,name:meta.name||("Slot "+(slot+1))});
psion.setPack(pack,slot);
continue;
}
}catch(e){
console.warn("Failed restoring pack from localStorage for slot "+slot+":",e);
}
}
if(metaRaw&&typeof AssetStore!=="undefined"&&AssetStore.isSupported()){
(function (s,mRaw){
try{
var m=JSON.parse(mRaw);
AssetStore.get ("simorg1/auto_pack_"+s + ".op1").then(function (cachedBytes){
if(cachedBytes&&cachedBytes.length>0){
isRestoringSession=true;
var pk=new Pack({bytes:cachedBytes,name:m.name||("Slot "+(s+1))});
psion.setPack(pk,s);
lastConnectorFitted=psion.isConnectorPackFitted();
updatePackUI();
isRestoringSession=false;
}
}).catch(function (){});
}catch(_){}
})(slot,metaRaw);
}
}
}
function applyAutoSnapshotBytes(bytes){
if(!bytes||bytes.length<5)return false;
if(bytes[0]!==83||bytes[1]!==78||bytes[2]!==65||bytes[3]!==1)return false;
var rawData=new Uint8Array(bytes.subarray(4));
var snap=new Snapshot({data:rawData});
psion.applySnapshotData(snap);
return true;
}
function restoreAutoSnapshotSync(){
try{
var b64=localStorage.getItem(AUTO_SNAPSHOT_B64_KEY);
if(b64){
return applyAutoSnapshotBytes(base64ToUint8(b64));
}
}catch(e){
console.warn("Could not restore auto-snapshot from localStorage:",e);
}
return false;
}
document.addEventListener("visibilitychange",function (){
if(document.visibilityState==="hidden"){
saveAutoSnapshot(true);
}
});
window.addEventListener("pagehide",function (){saveAutoSnapshot(true);});
window.addEventListener("beforeunload",function (){saveAutoSnapshot(true);});
setInterval(function (){
if(hasCompletedInitialBoot&&!isRestoringSession){
saveAutoSnapshot(false);
}
},5000);
setTimeout(function (){
var didAutoload=false;
try{
var urlParams=new URLSearchParams(window.location.search);
if(urlParams.get ("autoload")==="1"){
var b64=localStorage.getItem("simorg1_staged_pack");
var stagedName=localStorage.getItem("simorg1_staged_name")||"ForthPack.op1";
if(b64){
var binStr=atob(b64);
var len=binStr.length;
var arr=new Uint8Array(len);
for(var i=0;i<len;i++)arr[i]=binStr.charCodeAt(i);
var pack=new Pack({bytes:arr,name:stagedName});
psion.setPack(pack,0);
console.log("Autoloaded staged pack from Org-Forth:",stagedName);
psion.reset();
didAutoload=true;
}
}
}catch(err){
console.warn("Autoload error:",err);
}
if(!didAutoload){
isRestoringSession=true;
restoreSessionPacks();
var restored=restoreAutoSnapshotSync();
if(!restored){
psion.powerOn();
if(syncClockOnPowerOn){
psion.setClock();
}
if(typeof AssetStore!=="undefined"&&AssetStore.isSupported()){
AssetStore.get (AUTO_SNAPSHOT_IDB_KEY).then(function (bytes){
if(bytes){
isRestoringSession=true;
applyAutoSnapshotBytes(bytes);
lastConnectorFitted=psion.isConnectorPackFitted();
updatePackUI();
isRestoringSession=false;
}
}).catch(function (){});
}
}else if(syncClockOnPowerOn){
psion.setClock();
}
lastConnectorFitted=psion.isConnectorPackFitted();
updatePackUI();
isRestoringSession=false;
}else {
psion.powerOn();
if(syncClockOnPowerOn){
psion.setClock();
}
lastConnectorFitted=psion.isConnectorPackFitted();
updatePackUI();
}
hasCompletedInitialBoot=true;
},50);
});