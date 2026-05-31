'use strict';
function BootableWizard(activePack,callback){
this.pack=activePack;
this.callback=callback;
this.dialog=null;
}
BootableWizard.BOOT_BIN_PAYLOAD=new Uint8Array([
0x00,0xD3,0x00,0x00,0x00,0x90,0x10,0x01,0x00,0x08,0xB6,0xFF,0xE8,0x85,0x08,0x27,
0x09,0xB6,0xFF,0xCB,0x2A,0x04,0x86,0x01,0x3F,0x82,0xDC,0x5E,0x4A,0x18,0xCC,0xFD,
0x0C,0xA7,0x09,0xA7,0x0D,0xE7,0x10,0xFC,0x20,0x65,0x93,0xA5,0x27,0x09,0x83,0x00,
0x08,0x27,0x04,0xDC,0xA7,0x26,0x2E,0x3F,0x46,0xCE,0x00,0xCC,0xF6,0x00,0x02,0xCB,
0x41,0xE7,0x01,0xC6,0x83,0x3F,0x24,0x25,0x30,0xFE,0x22,0xC9,0x3C,0xFE,0x22,0xCB,
0x3C,0xCC,0x00,0x12,0xDD,0x41,0xDC,0x5E,0x4A,0x37,0x36,0xCE,0x00,0x65,0x3F,0x6D,
0xCE,0x00,0xCC,0x5F,0x39,0x20,0x65,0x3F,0x64,0x24,0x02,0x3F,0x20,0x4F,0x5F,0x38,
0xFF,0x22,0xCB,0x38,0xFF,0x22,0xC9,0x0D,0x39,0xB6,0x21,0x84,0x27,0x2C,0x3F,0x6F,
0x0C,0x0D,0x0A,0x20,0x20,0x20,0x4E,0x6F,0x20,0x4F,0x50,0x4C,0x20,0x70,0x72,0x6F,
0x67,0x72,0x61,0x6D,0x0D,0x0A,0x20,0x20,0x20,0x20,0x63,0x61,0x6C,0x6C,0x65,0x64,
0x20,0x20,0x42,0x4F,0x4F,0x54,0x10,0x00,0x20,0x20,0x3F,0x6F,0x0C,0x4E,0x6F,0x20,
0x4F,0x50,0x4C,0x20,0x70,0x72,0x6F,0x67,0x72,0x61,0x6D,0x20,0x20,0x63,0x61,0x6C,
0x6C,0x65,0x64,0x20,0x42,0x4F,0x4F,0x54,0x10,0x00,0x3F,0x48,0x0D,0x39,0x06,0x42,
0x3A,0x42,0x4F,0x4F,0x54,0x46,0x1D,0x00,0x05,0x00,0x06,0x00,0x38,0x00,0x3B,0x00,
0x5A,0x00,0x5F,0x01,0x32
]);
BootableWizard.ACMENU_BIN_PAYLOAD=new Uint8Array([
0x00,0x3C,0x00,0x00,0x00,0x90,0x10,0x03,0x00,0x1F,0x00,0x33,0x00,0x3A,0x10,0x41,
0x42,0x43,0x44,0x45,0x46,0x47,0x48,0x49,0x4A,0x4B,0x4C,0x4D,0x4E,0x4F,0x50,0x00,
0x00,0xCE,0x00,0x0C,0xE6,0x00,0xCB,0x03,0x4F,0xDD,0x41,0xCC,0x21,0x87,0x3F,0x6D,
0xC6,0xFF,0x3F,0x65,0x39,0xCE,0x00,0x0C,0x3F,0x67,0x0C,0x39,0x0D,0x39,0x10,0x8F,
0x00,0x05,0x00,0x06,0x00,0x08,0x00,0x0A,0x00,0x20,0x00,0x34,0x00,0x6C
]);
BootableWizard.DEVICE_IDS=[
{value:0x90,label:"0x90 - Bootable ODK packs (Default)"},
{value:0x02,label:"0x02 - SDRP software pack"},
{value:0x09,label:"0x09 - Formulator"},
{value:0x0A,label:"0x0A - Concise Oxford Spelling Checker, OWI interface"},
{value:0x0B,label:"0x0B - Thesaurus and Spelling Checker"},
{value:0x20,label:"0x20 - FlightMaster software pack 1"},
{value:0x40,label:"0x40 - Microtima SigSet software pack"},
{value:0x41,label:"0x41 - Dial-Link software pack, AutoScribe Plus"},
{value:0x50,label:"0x50 - HB Games Pack"},
{value:0x80,label:"0x80 - KDG Mobrey MSP100 software pack"},
{value:0xBC,label:"0xBC - Extech Comms Modem"},
{value:0xBE,label:"0xBE - Magnetic Card Reader"},
{value:0xBF,label:"0xBF - Barcode Reader"},
{value:0xC0,label:"0xC0 - RS232 Link, Comms Link"},
{value:0xC1,label:"0xC1 - CNF41 Hart Interface, Hand-held Terminal"},
{value:0xC2,label:"0xC2 - Psion Printer"},
{value:0xC3,label:"0xC3 - Sony Lisa-1 EVR packs"},
{value:0xC4,label:"0xC4 - Extech Comms Printer II"},
{value:0xC6,label:"0xC6 - Pager"},
{value:0xC8,label:"0xC8 - Pocket Spreadsheet"},
{value:0xCB,label:"0xCB - Sony PRM-1 pack"},
{value:0xCD,label:"0xCD - Dynapen"},
{value:0xCF,label:"0xCF - Sony Lisa-1 pixel repair pack"},
{value:0xF7,label:"0xF7 - Flashpak"},
{value:0xF8,label:"0xF8 - Flashpak"},
{value:0xFF,label:"0xFF - Paralink (earlier versions)"}
];
BootableWizard.prototype.getProcedureSourceText=function (item){
if(!item||!item.child||!item.child.child)return "";
var chld=item.child.child;
if(!chld.data)return "";
if(chld.data.length<4)return "";
var lncode=(chld.data[0]<<8)|chld.data[1];
if(lncode+4>chld.data.length)return "";
var lnsrc=(chld.data[lncode+2]<<8)|chld.data[lncode+3];
if(lnsrc<=0)return "";
var s="";
var limit=lnsrc;
if(lncode+4 + limit>chld.data.length){
limit=chld.data.length-(lncode+4);
}
if(limit>0&&chld.data[lncode+4 + limit-1]===0){
limit--;
}
for(var i=0;i<limit;i++){
var c=chld.data[lncode+4 + i];
if(c===0)s+="\n";
else s+=String.fromCharCode(c);
}
return s;
};
BootableWizard.prototype.show=function (){
var self=this;
var jumpAddr=0x0000;
var isSpecialAddr=(jumpAddr===0x0000||jumpAddr===0x0001||jumpAddr===0x0002);
var maxNameLen=isSpecialAddr?8:16;
var helpText=isSpecialAddr?"Menu item & proc name (Max 8 characters for OPL/Notepad/Database).":"Menu item & proc name (Max 16 characters).";
var packHeader=this.pack.items[0];
var isBootable=(packHeader.data[0]&0x10)===0;
this.isOriginallyBootable=isBootable;
this.originalBootRecordIndex=-1;
this.originalMethod='classic';
this.bootAndAddtopPresent=false;
this.removeClassicProcedures=false;
var recovered=null;
if(isBootable){
var bootAddress=(packHeader.data[6]<<8)|packHeader.data[7];
for(var i=0;i<this.pack.items.length;i++){
if(getItemAddres(this.pack,i)===bootAddress-4){
this.originalBootRecordIndex=i;
break;
}
}
if(this.originalBootRecordIndex>=0){
var recordItem=this.pack.items[this.originalBootRecordIndex];
var payloadItem=recordItem.child;
if(payloadItem&&payloadItem.data){
var payload=payloadItem.data;
if(payload[1]===0xD3){
this.originalMethod='classic';
var hasBootProc=false;
var hasAddtopProc=false;
for(var i=0;i<this.pack.items.length;i++){
var item=this.pack.items[i];
if(item.type===3&&!item.deleted){
var name=item.name.trim().toUpperCase();
if(name==="BOOT")hasBootProc=true;
if(name==="ADDTOP")hasAddtopProc=true;
}
}
this.bootAndAddtopPresent=hasBootProc&&hasAddtopProc;
var classicProc="MYMENU";
for(var i=0;i<this.pack.items.length;i++){
var item=this.pack.items[i];
if(item.type===3&&item.name.trim().toUpperCase()==="BOOT"){
var bootSrc=this.getProcedureSourceText(item);
var match=bootSrc.match(/ADDTOP\s*:\s*\(\s*"([^"]+)"/i);
if(match){
classicProc=match[1];
}
break;
}
}
recovered={
method:'classic',
deviceId:packHeader.data[3],
version:packHeader.data[4],
priority:packHeader.data[5],
classicProc:classicProc
};
}else if(payload[1]===0x3C){
this.originalMethod='acmenu';
var nameLen=payload[14];
var menuName="";
if(nameLen>0&&nameLen<=16){
for(var j=0;j<nameLen;j++){
menuName+=String.fromCharCode(payload[15+j]);
}
}
if(!menuName)menuName="ACMENU";
var jumpAddr=(payload[15+nameLen]<<8)|payload[15+nameLen+1];
var position=payload[49];
recovered={
method:'acmenu',
deviceId:packHeader.data[3],
version:packHeader.data[4],
priority:packHeader.data[5],
menuName:menuName,
position:position,
jumpAddr:jumpAddr
};
}
}
}
}
var container=document.createElement('div');
container.className="bootable-wizard-wrapper";
if(!document.getElementById('bootable-wizard-styles')){
var style=document.createElement('style');
style.id='bootable-wizard-styles';
style.textContent=
".bootable-wizard-container { display: flex; flex-direction: row; gap: 24px; max-width: 820px; color: var(--text-color); font-family: sans-serif; }\n" +
".wizard-sidebar { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(0, 0, 0, 0.15); padding: 20px; border-radius: 8px; border: 1px solid var(--border-color); min-width: 250px; transition: background 0.3s ease, border-color 0.3s ease; }\n" +
".wizard-sidebar.mode-classic { background: rgba(59, 130, 246, 0.05); border-color: rgba(59, 130, 246, 0.25); }\n" +
".wizard-sidebar.mode-acmenu { background: rgba(168, 85, 247, 0.05); border-color: rgba(168, 85, 247, 0.25); }\n" +
".wizard-sidebar img { max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3); border: 1px solid var(--border-color); padding: 12px; transition: background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease; }\n" +
".wizard-sidebar.mode-classic img { background: radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.02) 100%); border-color: rgba(59, 130, 246, 0.35); }\n" +
".wizard-sidebar.mode-acmenu img { background: radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, rgba(168, 85, 247, 0.02) 100%); border-color: rgba(168, 85, 247, 0.35); }\n" +
".wizard-sidebar .sidebar-caption { font-size: 11px; margin-top: 12px; opacity: 0.7; text-align: center; font-family: 'Consolas', monospace; transition: color 0.3s ease; }\n" +
".wizard-sidebar.mode-classic .sidebar-caption { color: #60a5fa; }\n" +
".wizard-sidebar.mode-acmenu .sidebar-caption { color: #c084fc; }\n" +
".wizard-form { flex: 1.4; display: flex; flex-direction: column; gap: 14px; min-width: 320px; }\n" +
".wizard-form h3 { margin: 0 0 8px 0; color: var(--list-selected-bg); font-family: 'Consolas', 'Courier New', monospace; font-size: 1.3rem; border-bottom: 2px solid var(--border-color); padding-bottom: 8px; display: flex; align-items: center; gap: 8px; transition: color 0.3s ease, border-color 0.3s ease; }\n" +
".bootable-wizard-container.mode-classic h3 { color: #3b82f6; border-bottom-color: rgba(59, 130, 246, 0.25); }\n" +
".bootable-wizard-container.mode-acmenu h3 { color: #a855f7; border-bottom-color: rgba(168, 85, 247, 0.25); }\n" +
".wizard-form-group { display: flex; flex-direction: column; gap: 4px; }\n" +
".wizard-form-group label { font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.9; }\n" +
".wizard-input { padding: 8px 10px; border-radius: 4px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--input-text-color); font-family: 'Consolas', monospace; font-size: 13px; outline: none; transition: border-color 0.2s, box-shadow 0.2s; }\n" +
".bootable-wizard-container.mode-classic .wizard-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2); }\n" +
".bootable-wizard-container.mode-acmenu .wizard-input:focus { border-color: #a855f7; box-shadow: 0 0 0 2px rgba(168, 85, 247, 0.2); }\n" +
".wizard-help-text { font-size: 10px; opacity: 0.7; margin-top: 1px; }\n" +
"@media (max-width: 680px) { .bootable-wizard-container { flex-direction: column; } .wizard-sidebar { min-width: 100%; } }\n";
document.head.appendChild(style);
}
var deviceIdHtml="";
BootableWizard.DEVICE_IDS.forEach(function (d){
deviceIdHtml+="<option value='"+d.value+"'>"+d.label+"</option>";
});
container.innerHTML=
"<div class='bootable-wizard-container'>" +
"  <div class='wizard-sidebar'>" +
"     <img src='assets/pics/data_pack_diagram.png' alt='Data Pack Diagram'>" +
"     <div class='sidebar-caption'>Psion Organiser II Datapak Layout</div>" +
"  </div>" +
"  <div class='wizard-form'>" +
"     <h3><i class='fa-solid fa-splotch'></i> Bootable Pack Wizard</h3>" +
"     " +
"     <div class='wizard-form-group'>" +
"        <label>Boot Mechanism</label>" +
"        <select id='wizard-method' class='wizard-input'>" +
"           <option value='classic'>Classic BOOT.BIN (BOOT & ADDTOP OPL)</option>" +
"           <option value='acmenu'>Self-Removing ACMENU.BIN</option>" +
"        </select>" +
"     </div>" +
"     " +
"     <div class='wizard-form-group'>" +
"        <label>Device ID (Byte 3)</label>" +
"        <select id='wizard-device-id' class='wizard-input'>" +
"           "+deviceIdHtml +
"        </select>" +
"     </div>" +
"     " +
"     <div class='wizard-form-group'>" +
"        <label>Boot Priority (Byte 5)</label>" +
"        <select id='wizard-priority' class='wizard-input'>" +
"           <option value='144'>0x90 - Standard (Default)</option>" +
"           <option value='128'>0x80 - Low</option>" +
"           <option value='255'>0xFF - High</option>" +
"        </select>" +
"     </div>" +
"     " +
"     <div class='wizard-form-group'>" +
"        <label>Boot Version (Byte 4)</label>" +
"        <input type='number' id='wizard-version' class='wizard-input' min='1' max='255' value='16'>" +
"        <span class='wizard-help-text'>Default: 16 (0x10 = v1.0)</span>" +
"     </div>" +
"     " +
"     <!-- Classic Fields -->" +
"     <div id='classic-fields' class='wizard-form-group' style='border-top: 1px dashed var(--border-color); padding-top: 10px; display: flex; flex-direction: column; gap: 10px;'>" +
"        <div class='wizard-form-group'>" +
"           <label>Boot Procedure Name (Hardcoded)</label>" +
"           <input type='text' class='wizard-input' value='BOOT' disabled style='opacity: 0.6; cursor: not-allowed;'>" +
"           <span class='wizard-help-text'>Hardcoded in BOOT.BIN and cannot be modified.</span>" +
"        </div>" +
"        <div class='wizard-form-group'>" +
"           <label>Menu Item / Procedure Name</label>" +
"           <input type='text' id='wizard-classic-proc' class='wizard-input' maxlength='16' value='MYMENU'>" +
"           <span class='wizard-help-text'>OPL procedure added to menu (Max 16 characters).</span>" +
"        </div>" +
"     </div>" +
"     " +
"     <!-- ACMENU Fields -->" +
"     <div id='acmenu-fields' style='border-top: 1px dashed var(--border-color); padding-top: 10px; display: none; flex-direction: column; gap: 10px;'>" +
"        <div class='wizard-form-group-row' style='display:flex; gap:12px; align-items:flex-start;'>" +
"           <div class='wizard-form-group' style='flex:1.2;'>" +
"              <label>Menu / Procedure Name</label>" +
"              <input type='text' id='wizard-menu-name' class='wizard-input' maxlength='"+maxNameLen+"' value='ACMENU'>" +
"              <span class='wizard-help-text' id='wizard-menu-name-help'>"+helpText+"</span>" +
"           </div>" +
"           <div class='wizard-form-group' style='flex:1;'>" +
"              <label>Mode / Addr</label>" +
"              <select id='wizard-menu-addr-select' class='wizard-input'>" +
"                 <option value='0000' selected>0000 - OPL Procedure</option>" +
"                 <option value='0001'>0001 - Notepad File (LZ)</option>" +
"                 <option value='0002'>0002 - Database File (LZ)</option>" +
"                 <option value='custom'>Custom Hex Address...</option>" +
"              </select>" +
"              <input type='text' id='wizard-menu-addr-custom' class='wizard-input' maxlength='4' placeholder='0000' style='display:none; margin-top:4px;' value='0000'>" +
"           </div>" +
"        </div>" +
"        <div class='wizard-form-group'>" +
"           <label>Menu Position</label>" +
"           <input type='number' id='wizard-menu-pos' class='wizard-input' min='0' max='255' value='255'>" +
"           <span class='wizard-help-text'>0 = Start, 255 = Before \"OFF\" (Last), or custom index (1, 2, 3...)</span>" +
"        </div>" +
"     </div>" +
"  </div>" +
"</div>";
if(recovered){
container.querySelector('#wizard-method').value=recovered.method;
container.querySelector('#wizard-device-id').value=recovered.deviceId;
container.querySelector('#wizard-priority').value=recovered.priority;
container.querySelector('#wizard-version').value=recovered.version;
if(recovered.method==='classic'){
container.querySelector('#wizard-classic-proc').value=recovered.classicProc;
}else {
container.querySelector('#wizard-menu-name').value=recovered.menuName;
container.querySelector('#wizard-menu-pos').value=recovered.position;
var addrSelect=container.querySelector('#wizard-menu-addr-select');
var addrCustom=container.querySelector('#wizard-menu-addr-custom');
var jumpAddrVal=(recovered.jumpAddr!==undefined)?recovered.jumpAddr:0;
var addrHex=jumpAddrVal.toString(16).toUpperCase().padStart(4,'0');
if(jumpAddrVal===0x0000||jumpAddrVal===0x0001||jumpAddrVal===0x0002){
addrSelect.value=addrHex;
addrCustom.style.display='none';
}else {
addrSelect.value='custom';
addrCustom.value=addrHex;
addrCustom.style.display='block';
}
}
}
var methodSelect=container.querySelector('#wizard-method');
var classicFields=container.querySelector('#classic-fields');
var acmenuFields=container.querySelector('#acmenu-fields');
var sidebar=container.querySelector('.wizard-sidebar');
function updateSidebarMode(){
var wizardContainer=container.querySelector('.bootable-wizard-container');
if(methodSelect.value==='acmenu'){
if(wizardContainer)wizardContainer.className='bootable-wizard-container mode-acmenu';
sidebar.className='wizard-sidebar mode-acmenu';
classicFields.style.display='none';
acmenuFields.style.display='flex';
}else {
if(wizardContainer)wizardContainer.className='bootable-wizard-container mode-classic';
sidebar.className='wizard-sidebar mode-classic';
classicFields.style.display='flex';
acmenuFields.style.display='none';
}
}
var originalMethodVal=methodSelect.value;
methodSelect.addEventListener('change',function (e){
var newMethod=methodSelect.value;
if(self.isOriginallyBootable&&newMethod!==originalMethodVal){
var promptDiv=document.createElement('div');
promptDiv.style.padding='10px';
promptDiv.innerHTML="<h3>Modify Boot Process?</h3>" +
"<p>Changing the boot mechanism selection will modify the pack contents and boot process if you continue.</p>" +
"<p>Do you want to continue?</p>";
var promptDialog=new ModalDialog(
promptDiv,
function (){
originalMethodVal=newMethod;
if(self.originalMethod==='classic'&&self.bootAndAddtopPresent){
var askRemoveDiv=document.createElement('div');
askRemoveDiv.style.padding='10px';
askRemoveDiv.innerHTML="<h3>Remove BOOT and ADDTOP?</h3>" +
"<p>A classic <b>BOOT.BIN</b> is present on this pack, along with <b>BOOT</b> and <b>ADDTOP</b> procedures.</p>" +
"<p>Do you want to remove the BOOT and ADDTOP procedures from the pack, or leave them in place?</p>";
var removeDialog=new ModalDialog(
askRemoveDiv,
function (){
self.removeClassicProcedures=true;
updateSidebarMode();
},
function (){
self.removeClassicProcedures=false;
updateSidebarMode();
},
"Remove",
"Leave"
);
removeDialog.start();
}else {
updateSidebarMode();
}
},
function (){
methodSelect.value=originalMethodVal;
updateSidebarMode();
},
"Continue",
"Cancel"
);
promptDialog.start();
}else {
originalMethodVal=newMethod;
self.removeClassicProcedures=false;
updateSidebarMode();
}
});
updateSidebarMode();
var classicProcInput=container.querySelector('#wizard-classic-proc');
classicProcInput.addEventListener('input',function (){
classicProcInput.value=classicProcInput.value.replace(/[^A-Za-z0-9_]/g,'').toUpperCase();
});
var menuNameInput=container.querySelector('#wizard-menu-name');
menuNameInput.addEventListener('input',function (){
menuNameInput.value=menuNameInput.value.replace(/[^A-Za-z0-9_]/g,'').toUpperCase();
});
var menuAddrSelect=container.querySelector('#wizard-menu-addr-select');
var menuAddrCustom=container.querySelector('#wizard-menu-addr-custom');
var menuNameHelp=container.querySelector('#wizard-menu-name-help');
function getMenuAddress(){
if(menuAddrSelect.value==='custom'){
var val=menuAddrCustom.value.trim();
if(!val)return 0;
var parsed=parseInt(val,16);
return isNaN(parsed)?0:parsed;
}else {
return parseInt(menuAddrSelect.value,16);
}
}
function updateNameLengthConstraint(){
var addr=getMenuAddress();
var isSpecial=(addr===0x0000||addr===0x0001||addr===0x0002);
var maxLen=isSpecial?8:16;
menuNameInput.setAttribute('maxlength',maxLen);
if(menuNameInput.value.length>maxLen){
menuNameInput.value=menuNameInput.value.substring(0,maxLen);
}
menuNameHelp.textContent=isSpecial
?"Max 8 characters for special modes."
:"Max 16 characters for machine code.";
}
menuAddrSelect.addEventListener('change',function (){
if(menuAddrSelect.value==='custom'){
menuAddrCustom.style.display='block';
menuAddrCustom.focus();
}else {
menuAddrCustom.style.display='none';
}
updateNameLengthConstraint();
});
menuAddrCustom.addEventListener('input',function (){
menuAddrCustom.value=menuAddrCustom.value.replace(/[^0-9A-Fa-f]/g,'').toUpperCase();
updateNameLengthConstraint();
});
if(recovered&&recovered.method==='acmenu'){
updateNameLengthConstraint();
}
this.dialog=new ModalDialog(
container,
function (){
self.executeCompilation(container);
},
null,
"Compile & Write",
"Cancel"
);
this.dialog.start();
};
BootableWizard.prototype.executeCompilation=function (element){
var self=this;
var method=element.querySelector('#wizard-method').value;
var deviceId=parseInt(element.querySelector('#wizard-device-id').value,10);
var priority=parseInt(element.querySelector('#wizard-priority').value,10);
var version=parseInt(element.querySelector('#wizard-version').value,10);
if(self.isOriginallyBootable){
if(self.originalBootRecordIndex>=0){
var oldRecord=self.pack.items[self.originalBootRecordIndex];
var idx=self.pack.items.indexOf(oldRecord);
if(idx>=0){
self.pack.items.splice(idx,1);
}
}
if(method==='classic'||(method==='acmenu'&&self.removeClassicProcedures)){
for(var i=self.pack.items.length-1;i>=0;i--){
var item=self.pack.items[i];
if(item.type===3){
var name=item.name.trim().toUpperCase();
if(name==="BOOT"||name==="ADDTOP"){
self.pack.items.splice(i,1);
}
}
}
}
}
var mainIdx=-1;
for(var i=0;i<this.pack.items.length;i++){
var item=this.pack.items[i];
var name=item.name||(item.child&&item.child.name)||"";
if(name.trim().toUpperCase()==="MAIN"){
mainIdx=i;
break;
}
}
var insertIndex=mainIdx>=0?mainIdx+1:1;
var originalAddItemToPack=(typeof window!=='undefined'&&window.addItemToPack)||(typeof global!=='undefined'&&global.addItemToPack);
var tempAddItemToPack=function (item){
self.pack.items.splice(insertIndex,0,item);
insertIndex++;
};
if(typeof window!=='undefined')window.addItemToPack=tempAddItemToPack;
if(typeof global!=='undefined')global.addItemToPack=tempAddItemToPack;
try{
var bootRecordData=null;
var recordItem=null;
if(method==='classic'){
var classicProc=element.querySelector('#wizard-classic-proc').value.trim();
if(!classicProc)classicProc="MYMENU";
bootRecordData=BootableWizard.BOOT_BIN_PAYLOAD;
var payloadItem=new PackItem(bootRecordData,0,bootRecordData.length);
recordItem=new PackItem([2,0x80,bootRecordData.length>>8,bootRecordData.length&0xff],0,4);
recordItem.child=payloadItem;
recordItem.setDescription();
addItemToPack(recordItem);
var bootOplSource="BOOT:\nREM Replace ADDTOP string param. with your PROC name\nADDTOP:(\""+classicProc+"\",0)\n";
var bootBlockData=this.compileOplStringToBlockData(bootOplSource);
createBlockFile(bootBlockData,"BOOT",3,true);
var addtopOplSource=
"ADDTOP:(item$,pos%)\n" +
"REM Adds a menu item\n" +
"LOCAL I%,A%(2)\n" +
"IF LEN(item$)>16\n" +
"        RAISE 202 :REM Menu too big\n" +
"ENDIF\n" +
"POKEB $2187,LEN(item$)\n" +
"I%=1\n" +
"WHILE I%<=LEN(item$)\n" +
"POKEB $2187+I%,ASC(MID$(item$,I%,1))\n" +
"I%=I%+1\n" +
"ENDWH\n" +
"POKEW $2188+LEN(item$),0\n" +
"A%(1)=$3F65 :REM Careful here\n" +
"A%(2)=$3900 :REM Careful here\n" +
"USR(ADDR(A%()), pos%)\n";
var addtopBlockData=this.compileOplStringToBlockData(addtopOplSource);
createBlockFile(addtopBlockData,"ADDTOP",3,true);
}else {
var menuName=element.querySelector('#wizard-menu-name').value.trim();
if(!menuName)menuName="ACMENU";
var positionInput=element.querySelector('#wizard-menu-pos').value;
var position=parseInt(positionInput,10);
if(isNaN(position)||position<0)position=0;
if(position>255)position=255;
bootRecordData=new Uint8Array(BootableWizard.ACMENU_BIN_PAYLOAD);
var addrSelect=element.querySelector('#wizard-menu-addr-select').value;
var jumpAddr=0;
if(addrSelect==='custom'){
var val=element.querySelector('#wizard-menu-addr-custom').value.trim();
var parsed=parseInt(val,16);
jumpAddr=isNaN(parsed)?0:parsed;
}else {
jumpAddr=parseInt(addrSelect,16);
}
var isSpecialAddr=(jumpAddr===0x0000||jumpAddr===0x0001||jumpAddr===0x0002);
var maxNameLen=isSpecialAddr?8:16;
var nameLen=Math.min(menuName.length,maxNameLen);
bootRecordData[14]=nameLen;
for(var i=0;i<nameLen;i++){
bootRecordData[15+i]=menuName.charCodeAt(i);
}
bootRecordData[15+nameLen]=(jumpAddr>>8)&0xFF;
bootRecordData[15+nameLen+1]=jumpAddr&0xFF;
for(var i=15+nameLen+2;i<=32;i++){
bootRecordData[i]=0x20;
}
bootRecordData[49]=position;
var sum=0;
for(var i=5;i<=61;i++){
sum=(sum+bootRecordData[i])&0xFFFF;
}
bootRecordData[62]=(sum>>8)&0xFF;
bootRecordData[63]=sum&0xFF;
var payloadItem=new PackItem(bootRecordData,0,bootRecordData.length);
recordItem=new PackItem([2,0x80,bootRecordData.length>>8,bootRecordData.length&0xff],0,4);
recordItem.child=payloadItem;
recordItem.setDescription();
addItemToPack(recordItem);
}
var packHeader=this.pack.items[0];
packHeader.data[0]&=0xEF;
packHeader.data[2]=0;
packHeader.data[3]=deviceId;
packHeader.data[4]=version;
packHeader.data[5]=priority;
var targetIndex=this.pack.items.indexOf(recordItem);
var epromAddress=getItemAddres(this.pack,targetIndex);
var bootAddress=epromAddress+4;
packHeader.data[6]=(bootAddress>>8)&0xff;
packHeader.data[7]=bootAddress&0xff;
var hdata=packHeader.data;
var sum1=hdata[0]+hdata[2]+hdata[4]+hdata[6];
var sum2=hdata[1]+hdata[3]+hdata[5]+hdata[7];
sum1+=(sum2>>8);
hdata[9]=sum2&0xff;
if((hdata[0]&0x40)===0){
hdata[8]&=0x80;
hdata[8]+=sum1&0x7f;
}else {
hdata[8]=sum1&0xff;
}
this.pack.unsaved=true;
if(this.callback){
this.callback();
}
if(typeof itemSelected!=='undefined'){
setTimeout(function (){
itemSelected(currentPackIndex,targetIndex);
setStatus("Bootable record successfully created and written to pack!");
},100);
}
}finally{
if(typeof window!=='undefined')window.addItemToPack=originalAddItemToPack;
if(typeof global!=='undefined')global.addItemToPack=originalAddItemToPack;
}
};
BootableWizard.prototype.compileOplStringToBlockData=function (sourceText){
var normalized=sourceText.replace(/\r\n/g,"\n").replace(/\r/g,"\n");
if(normalized.charAt(normalized.length-1)!=="\n"){
normalized+="\n";
}
var bytes=[];
for(var i=0;i<normalized.length;i++){
var c=normalized.charCodeAt(i);
if(c===10){
bytes.push(0);
}else {
bytes.push(c);
}
}
var lnsrc=bytes.length;
var data=new Uint8Array(4+lnsrc);
data[0]=0;
data[1]=0;
data[2]=(lnsrc>>8)&0xff;
data[3]=lnsrc&0xff;
for(var i=0;i<lnsrc;i++){
data[4+i]=bytes[i];
}
return data;
};
if(typeof window!=='undefined'){
window.BootableWizard=BootableWizard;
}
if(typeof module!=='undefined'){
module.exports=BootableWizard;
}