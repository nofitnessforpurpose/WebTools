'use strict';





function Button(id,clickcallback,inputId,filecallback){
var _element=document.getElementById(id);
if(!_element){




return;
}

if(inputId){
var _input=document.getElementById(inputId);
this.getFiles=function (){return _input.files;}
_input.addEventListener('change',function (e){
if(!_element.disabled)filecallback(e);

_input.value='';
},false);


_element.addEventListener('click',function (){
if(!_element.disabled)_input.click();
});
}else if(clickcallback){
_element.addEventListener('click',function (e){
if(!_element.disabled)clickcallback(e)
},false);
}

this.setActive=function (active){
_element.disabled=!active;
if(active){
_element.classList.remove('disabled');
}else {
_element.classList.add('disabled');
}
}
}


Object.defineProperty(window,'packs',{get:function (){return AppStore.state.packs;},set:function (v){AppStore.state.packs=v;}});
Object.defineProperty(window,'currentPack',{get:function (){return AppStore.state.currentPack;},set:function (v){AppStore.state.currentPack=v;}});
Object.defineProperty(window,'currentEditor',{get:function (){return AppStore.state.currentEditor;},set:function (v){AppStore.state.currentEditor=v;}});
Object.defineProperty(window,'currentItem',{get:function (){return AppStore.state.currentItem;},set:function (v){AppStore.state.currentItem=v;}});
Object.defineProperty(window,'currentPackIndex',{get:function (){return AppStore.state.currentPackIndex;},set:function (v){AppStore.state.currentPackIndex=v;}});
Object.defineProperty(window,'selectedPackIndex',{get:function (){return AppStore.state.selectedPackIndex;},set:function (v){AppStore.state.selectedPackIndex=v;}});


var selectedItems=[];
var lastFocusedItemIndex=-1;


Object.defineProperty(window,'syntaxHighlightingEnabled',{get:function (){return AppStore.state.syntaxHighlightingEnabled;},set:function (v){AppStore.state.syntaxHighlightingEnabled=v;}});
var decompilerLogWindow;
var packReportWindow;
var variableStorageWindow;
var saveTimer=null;


var inventoryelement=document.getElementById("pack-list");
var fileinfoelement=document.getElementById("current-file-name");
var checksumselement=document.getElementById("status-checksum");
var statusmessageelement=document.getElementById("status-message");

var legacyEditorElement=document.getElementById("legacy-editor");
var codeEditorElement=document.getElementById("code-editor-container");

var editors=[
new HeaderEditor(legacyEditorElement,handleEditorMessage),
new HeaderlessFileEditor(legacyEditorElement,handleEditorMessage),
new DataFileEditor(legacyEditorElement,handleEditorMessage),
new CommsSetupEditor(legacyEditorElement,handleEditorMessage),
new ProcedureFileEditor(legacyEditorElement,codeEditorElement,handleEditorMessage),
new LZNotepadFileEditor(legacyEditorElement,codeEditorElement,handleEditorMessage),
new SpreadsheetFileEditor(legacyEditorElement,handleEditorMessage),
new PagerSetupFileEditor(legacyEditorElement,handleEditorMessage),
new DiaryFileEditor(legacyEditorElement,handleEditorMessage),
new NativeCodeEditor(legacyEditorElement,codeEditorElement,handleEditorMessage),
new RecordEditor(legacyEditorElement,handleEditorMessage),
new HexEditor(legacyEditorElement,handleEditorMessage,[4,8,9,10,11,12,13,14,15]),
new MemoryMapEditor(legacyEditorElement,handleEditorMessage)
];


var discardbutton=new Button("btn-discard",discardEdits);
var applybutton=new Button("btn-apply",applyEdits);
var eraseitembutton=new Button("btn-delete-item",eraseItem);
var optionsbutton=new Button("btn-options",function (){DialogManager.showOptionsDialog();});


var fileInputPack=document.getElementById("file-input-pack");
if(fileInputPack)fileInputPack.addEventListener('change',fileChosen);

var fileInputItem=document.getElementById("file-input-item");
if(fileInputItem)fileInputItem.addEventListener('change',itemChosen);


var registeredMenus=[];

function registerMenu(buttonId,menuId,onOpenCallback){
var btn=document.getElementById(buttonId);
var menu=document.getElementById(menuId);

if(btn&&menu){
var menuObj={
id:menuId,
btn:btn,
menu:menu,
onOpen:onOpenCallback
};

registeredMenus.push(menuObj);

btn.addEventListener('click',function (e){
e.preventDefault();
e.stopPropagation();
toggleMenu(menuId);
});


menu.addEventListener('click',function (e){
e.stopPropagation();
});
}
}

function toggleMenu(menuId){
registeredMenus.forEach(function (m){
if(m.id===menuId){
var isOpening=!m.menu.classList.contains('show');

if(isOpening){

m.menu.classList.add('show');
m.btn.classList.add('active');
if(m.onOpen)m.onOpen();


setTimeout(function (){
var firstLink=m.menu.querySelector('a:not(.disabled)');
if(firstLink)firstLink.focus();
},0);
}else {

m.menu.classList.remove('show');
m.btn.classList.remove('active');
}
}else {

m.menu.classList.remove('show');
m.btn.classList.remove('active');
}
});
}

function closeAllMenus(){
registeredMenus.forEach(function (m){
m.menu.classList.remove('show');
m.btn.classList.remove('active');
});
}


window.addEventListener('click',function (e){



closeAllMenus();
});



registerMenu('btn-file-menu','file-dropdown',populateFileMenu);
registerMenu('btn-view-menu','view-dropdown',populateViewMenu);
registerMenu('btn-help','help-dropdown');



if(document.getElementById('menu-new-pack')){
document.getElementById('menu-new-pack').addEventListener('click',function (e){
e.preventDefault();
createNew(e);
closeAllMenus();
});

document.getElementById('menu-new-proc').addEventListener('click',function (e){
e.preventDefault();
if(this.classList.contains('disabled'))return;
var data=[0x00,0x00,0x00,0x0A,80,82,79,67,78,65,77,69,58,0];
createBlockFile(data,"PROCNAME",3);
closeAllMenus();
});

document.getElementById('menu-new-notepad').addEventListener('click',function (e){
e.preventDefault();
if(this.classList.contains('disabled'))return;
var data=[0x00,0x02,8,0,0x00,0x09,78,79,84,69,80,65,68,58,0];
createBlockFile(data,"NOTEPAD",7);
closeAllMenus();
});

document.getElementById('menu-new-datafile').addEventListener('click',function (e){
e.preventDefault();
if(this.classList.contains('disabled'))return;
var id=getFreeFileId();
if(id>0){
var hdritem=createFileHeader("DATAFILE",1,id+0x8f);
addItemToPack(hdritem);
updateInventory();
}
closeAllMenus();
});

var menuBootablePack=document.getElementById('menu-bootable-pack');
if(menuBootablePack){
menuBootablePack.addEventListener('click',function (e){
e.preventDefault();
openBootableWizard();
closeAllMenus();
});
}
}




if(document.getElementById('menu-open-pack')){
document.getElementById('menu-open-pack').addEventListener('click',function (e){
e.preventDefault();
if(fileInputPack)fileInputPack.click();
closeAllMenus();
});

document.getElementById('menu-open-url').addEventListener('click',function (e){
e.preventDefault();
openPackFromURL();
closeAllMenus();
});

document.getElementById('menu-import-item').addEventListener('click',function (e){
e.preventDefault();
if(this.classList.contains('disabled'))return;
if(fileInputItem)fileInputItem.click();
closeAllMenus();
});
}


if(document.getElementById('menu-save-pack')){
document.getElementById('menu-save-pack').addEventListener('click',function (e){
e.preventDefault();
if(this.classList.contains('disabled'))return;
packSaved();
closeAllMenus();
});

document.getElementById('menu-export-hex').addEventListener('click',function (e){
e.preventDefault();
if(this.classList.contains('disabled'))return;
exportHex();
closeAllMenus();
});
document.getElementById('menu-export-item').addEventListener('click',function (e){
e.preventDefault();
if(this.classList.contains('disabled'))return;
exportCurrentItem();
closeAllMenus();
});
}


if(document.getElementById('menu-pack-header')){
document.getElementById('menu-pack-header').addEventListener('click',function (e){
e.preventDefault();
if(this.classList.contains('disabled'))return;
if(currentPackIndex>=0&&packs[currentPackIndex]){
var pack=packs[currentPackIndex];
var headerIdx=-1;

for(var i=0;i<pack.items.length;i++){
if(pack.items[i].type===-1){
headerIdx=i;
break;
}
}

if(headerIdx>=0){
itemSelected(currentPackIndex,headerIdx);
}else {
selectPack(currentPackIndex);
}
}
closeAllMenus();
});

document.getElementById('menu-pack-report').addEventListener('click',function (e){
e.preventDefault();
if(this.classList.contains('disabled'))return;
var pack=currentPack;
if(!pack&&typeof packs!=='undefined'&&currentPackIndex>=0){
pack=packs[currentPackIndex];
}
if(packReportWindow&&pack){
packReportWindow.open(pack);
}
closeAllMenus();
});

document.getElementById('menu-memory-map').addEventListener('click',function (e){
e.preventDefault();
if(this.classList.contains('disabled'))return;
if(currentPackIndex>=0)selectPack(currentPackIndex);
closeAllMenus();
});

document.getElementById('menu-visualizer').addEventListener('click',function (e){
e.preventDefault();
if(this.classList.contains('disabled'))return;
if(typeof CodeVisualizer!=='undefined')CodeVisualizer.showSystemMap(packs);
closeAllMenus();
});
}


function populateFileMenu(){
var packOpen=(currentPackIndex>=0);
var itemSelected=(currentItem!==null&&currentItem!==undefined);


var packIds=['menu-save-pack','menu-export-hex','menu-open-pack'];
packIds.forEach(function (id){
var el=document.getElementById(id);
if(el){
if(packOpen)el.classList.remove('disabled');
else el.classList.add('disabled');
}
});


var openPackEl=document.getElementById('menu-open-pack');
if(openPackEl)openPackEl.classList.remove('disabled');


var itemIds=['menu-export-item'];

var importItemEl=document.getElementById('menu-import-item');
if(importItemEl){
if(packOpen)importItemEl.classList.remove('disabled');
else importItemEl.classList.add('disabled');
}


var exportItemEl=document.getElementById('menu-export-item');
if(exportItemEl){
var canExport=itemSelected||packOpen;
if(canExport)exportItemEl.classList.remove('disabled');
else exportItemEl.classList.add('disabled');
}



var staticIds=['menu-new-proc','menu-new-notepad','menu-new-datafile'];
staticIds.forEach(function (id){
var el=document.getElementById(id);
if(el){
if(packOpen)el.classList.remove('disabled');
else el.classList.add('disabled');
}
});


var container=document.getElementById('new-dynamic-container');
var separator=document.getElementById('new-dynamic-separator');
if(!container)return;

container.innerHTML='';
if(separator)separator.style.display='none';

if(packOpen){
var files=getDataFiles();
var hasFiles=false;


for(var i=1;i<110;i++){
if(files[i]){
hasFiles=true;
break;
}
}

if(hasFiles){
if(separator)separator.style.display='block';


var a=document.createElement('a');
a.href="#";
a.innerHTML='<i class="fas fa-table-list" style="width: 20px;"></i> New Record...';
a.addEventListener('click',function (e){
e.preventDefault();
closeAllMenus();
createNewRecord();
});
container.appendChild(a);
}
}
}

function populateViewMenu(){
var packOpen=(currentPackIndex>=0);
var ids=['menu-pack-header','menu-pack-report','menu-memory-map','menu-visualizer'];
ids.forEach(function (id){
var el=document.getElementById(id);
if(el){
if(packOpen)el.classList.remove('disabled');
else el.classList.add('disabled');
}
});
}


var menuAbout=document.getElementById('menu-about');
if(menuAbout){
menuAbout.addEventListener('click',function (e){
e.preventDefault();
showAboutDialog();
closeAllMenus();
});
}

var menuPackHeaderHelp=document.getElementById('menu-pack-header-help');
if(menuPackHeaderHelp){
menuPackHeaderHelp.addEventListener('click',function (e){
e.preventDefault();
closeAllMenus();
if(typeof PackHeaderHelp!=='undefined'){
PackHeaderHelp.openWindow();
}else {
alert("Pack Header Help component not loaded.");
}
});
}



var menuHelpStartHere=document.getElementById('menu-help-start-here');
if(menuHelpStartHere){
menuHelpStartHere.addEventListener('click',function (e){
e.preventDefault();
closeAllMenus();
if(typeof HelpStartHere!=='undefined')HelpStartHere.openWindow();
});
}

var menuHelpPhysicalConnection=document.getElementById('menu-help-physical-connection');
if(menuHelpPhysicalConnection){
menuHelpPhysicalConnection.addEventListener('click',function (e){
e.preventDefault();
closeAllMenus();
if(typeof HelpPhysicalConnection!=='undefined')HelpPhysicalConnection.openWindow();
});
}

var menuHelpOverview=document.getElementById('menu-help-overview');
if(menuHelpOverview){
menuHelpOverview.addEventListener('click',function (e){
e.preventDefault();
closeAllMenus();
if(typeof HelpOverview!=='undefined')HelpOverview.openWindow();
});
}

var menuHelpPackContents=document.getElementById('menu-help-pack-contents');
if(menuHelpPackContents){
menuHelpPackContents.addEventListener('click',function (e){
e.preventDefault();
closeAllMenus();
if(typeof HelpPackContents!=='undefined')HelpPackContents.openWindow();
});
}

var menuHelpMemoryMap=document.getElementById('menu-help-memory-map');
if(menuHelpMemoryMap){
menuHelpMemoryMap.addEventListener('click',function (e){
e.preventDefault();
closeAllMenus();
if(typeof HelpMemoryMap!=='undefined')HelpMemoryMap.openWindow();
});
}

var menuHelpBootablePack=document.getElementById('menu-help-bootable-pack');
if(menuHelpBootablePack){
menuHelpBootablePack.addEventListener('click',function (e){
e.preventDefault();
closeAllMenus();
if(typeof HelpBootablePack!=='undefined')HelpBootablePack.openWindow();
});
}

var menuHelpPackSummary=document.getElementById('menu-help-pack-summary');
if(menuHelpPackSummary){
menuHelpPackSummary.addEventListener('click',function (e){
e.preventDefault();
closeAllMenus();
if(typeof HelpPackSummary!=='undefined')HelpPackSummary.openWindow();
});
}

var menuHelpOPLEditor=document.getElementById('menu-help-opl-editor');
if(menuHelpOPLEditor){
menuHelpOPLEditor.addEventListener('click',function (e){
e.preventDefault();
closeAllMenus();
if(typeof HelpOPLEditor!=='undefined')HelpOPLEditor.openWindow();
});
}

var menuHelpVisualizer=document.getElementById('menu-help-visualizer');
if(menuHelpVisualizer){
menuHelpVisualizer.addEventListener('click',function (e){
e.preventDefault();
closeAllMenus();
if(typeof HelpVisualizer!=='undefined')HelpVisualizer.openWindow();
});
}

var menuHelpOptions=document.getElementById('menu-help-options');
if(menuHelpOptions){
menuHelpOptions.addEventListener('click',function (e){
e.preventDefault();
closeAllMenus();
if(typeof HelpOptions!=='undefined')HelpOptions.openWindow();
});
}



var menuOplErrors=document.getElementById('menu-opl-errors');
if(menuOplErrors){
menuOplErrors.addEventListener('click',function (e){
e.preventDefault();
closeAllMenus();
if(typeof OPLErrorCodes!=='undefined'){
OPLErrorCodes.openWindow();
}else {
alert("OPLErrorCodes component not loaded.");
}
});
}

var menuOplRef=document.getElementById('menu-opl-ref');
if(menuOplRef){
menuOplRef.addEventListener('click',function (e){
e.preventDefault();
if(typeof OPLCommandReference!=='undefined'){
new OPLCommandReference().open();
}else {

}
closeAllMenus();
});
}

var menuOplTemplates=document.getElementById('menu-opl-templates');
if(menuOplTemplates){
menuOplTemplates.addEventListener('click',function (e){
e.preventDefault();
if(typeof OPLContentViewer!=='undefined'&&typeof OPL_TEMPLATES!=='undefined'){
new OPLContentViewer("OPL Coding Templates",OPL_TEMPLATES).open();
}
closeAllMenus();
});
}

var menuOplLibrary=document.getElementById('menu-opl-library');
if(menuOplLibrary){
menuOplLibrary.addEventListener('click',function (e){
e.preventDefault();
if(typeof OPLContentViewer!=='undefined'&&typeof OPL_LIBRARY_ROUTINES!=='undefined'){
new OPLContentViewer("OPL Library Routines",OPL_LIBRARY_ROUTINES).open();
}
closeAllMenus();
});
}

var menuGraphicEditor=document.getElementById('menu-graphic-editor');
if(menuGraphicEditor){
menuGraphicEditor.addEventListener('click',function (e){
e.preventDefault();
closeAllMenus();
if(typeof UDGEditor!=='undefined'){
UDGEditor.openWindow();
}else {
alert("UDG Editor component not loaded.");
}
});
}

var menuCharacterMap=document.getElementById('menu-character-map');
if(menuCharacterMap){
menuCharacterMap.addEventListener('click',function (e){
e.preventDefault();
closeAllMenus();
if(typeof CharacterMap!=='undefined'){
CharacterMap.openWindow();
}else {
alert("Character Map component not loaded.");
}
});
}




function showAboutDialog(isSplash){
var element=document.createElement('div');
element.innerHTML=
"<div style='text-align: center; padding: 20px;'>" +
"<img src='assets/pics/logo.gif' alt='Psion Logo' style='width: 25%; margin-bottom: 15px;'>" +
"<h2 style='margin-top: 0;'>OPK Editor 3</h2>" +
"<p>A modern editor for Psion Organiser II packs.</p>" +
"<p>Version "+APP_VERSION+"</p>" +
"<hr style='margin: 15px auto; width: 80%; border: 0; border-top: 1px solid #ccc;'>" +
"<p>Original by <b>Jaap Scherphuis</b></p>" +
"<p>Icons by <b>Font Awesome</b></p>" +
"<p>Implemented with precision by <b>Antigravity</b>.</p>" +
"<p>Reimagined by <b>NFfP</b>.</p>" +
"</div>";

var dialog=new ModalDialog(element,null);
dialog.start();

if(isSplash){
setTimeout(function (){
dialog.stop();
},3000);
}
}


function init(){
var params=new URLSearchParams(window.location.search);
if(params.get ('mode')==='child'){
initChildMode(params.get ('feature'));
return;
}

initIconToolbar();
decompilerLogWindow=new DecompilerLogWindow();
packReportWindow=new PackReportWindow();
variableStorageWindow=new VariableStorageWindow();
updateInventory();

if(OptionsManager.getOption('showSplashScreen')!==false){
showAboutDialog(true);
}


var packList=document.getElementById('pack-list');
if(OptionsManager.getOption('showAddresses')){
packList.classList.add('show-addresses');
}
if(!OptionsManager.getOption('showGuidelines')){
packList.classList.add('hide-guidelines');
}


if(OptionsManager.getOption('restorePacks')){



var legacy=localStorage.getItem('opkedit_cached_pack');
if(legacy){
try{
var lData=JSON.parse(legacy);
var existingPacks=[];
try{existingPacks=JSON.parse(localStorage.getItem('opkedit_cached_packs')||'[]');}catch(e){}


var exists=false;
for(var k=0;k<existingPacks.length;k++){if(existingPacks[k].name===lData.name)exists=true;}

if(!exists){
existingPacks.push(lData);
localStorage.setItem('opkedit_cached_packs',JSON.stringify(existingPacks));

}
localStorage.removeItem('opkedit_cached_pack');
}catch(e){




}
}

var cachedPacks=[];
try{
var stored=localStorage.getItem('opkedit_cached_packs');
if(stored)cachedPacks=JSON.parse(stored);
}catch(e){}

if(cachedPacks.length>0){


cachedPacks.forEach(function (packData){
try{

var binaryString=atob(packData.data);
var len=binaryString.length;
var bytes=new Uint8Array(len);
for(var i=0;i<len;i++){
bytes[i]=binaryString.charCodeAt(i);
}

var newPack=new PackImage(bytes);
newPack.unsaved=false;
newPack.filename=packData.name;

packs.push(newPack);
updatePackChecksums(newPack);

}catch(e){

}
});

if(packs.length>0){
currentPackIndex=0;
selectedPackIndex=0;
updateInventory();
setStatus("Restored "+packs.length+" pack(s).");
}
}
}else {

}


window.addEventListener('themeChanged',function (e){
if(currentEditor instanceof MemoryMapEditor){
currentEditor.initialise(currentEditor.item);
}

if(currentEditor&&currentEditor.codeEditorInstance){

}
});
}



function createNew(e){
if(typeof HexViewer!=='undefined')HexViewer.close();

var lastSize=OptionsManager.getOption('lastPackSize')||3;
var suppressed=OptionsManager.getOption('suppressConfirmations');


function doCreate(sizeCode){
if(sizeCode>=1&&sizeCode<=128){
var newPack=new PackImage(null,sizeCode);
newPack.filename="Pack"+(packs.length+1)+".opk";
packs.push(newPack);
currentPack=newPack;
currentPackIndex=packs.length-1;
updateInventory();

OptionsManager.setOption('lastPackSize',sizeCode);
setStatus("New "+(sizeCode*8)+"KB pack created");
}
}


if(suppressed){
doCreate(lastSize);
return;
}


var element=document.createElement('div');

var optionsHtml="";
var sizes=[
{v:1,l:"8 KB (Standard)"},
{v:2,l:"16 KB"},
{v:4,l:"32 KB"},
{v:8,l:"64 KB"},
{v:16,l:"128 KB"},
{v:32,l:"256 KB"},
{v:64,l:"512 KB"},
{v:128,l:"1 MB"}
];

sizes.forEach(function (opt){
var sel=(opt.v===lastSize)?" selected":"";
optionsHtml+="<option value='"+opt.v+"'"+sel+">"+opt.l+"</option>";
});

element.innerHTML=
"<div>Select Pack Size:</div>" +
"<div><select id='packsize'>" +
optionsHtml +
"</select></div>";

var sel=element.querySelector("#packsize");
var sizeDialog=new ModalDialog(element,function (){
var sizeCode=parseInt(sel.value);
doCreate(sizeCode);
});

sizeDialog.start();

if(sel)setTimeout(function (){sel.focus();},50);
}

function packSaved(){
var packToSave=getActivePack();
if(!packToSave)return;
packToSave.unsaved=false;
var url=packToSave.getURL();
downloadFileFromUrl(packToSave.filename?packToSave.filename:"packname.opk",url);
setStatus("Pack saved");
updateInventory();
}

function exportHex(){
var packToSave=getActivePack();
if(!packToSave)return;
var filename=(packToSave.filename?packToSave.filename.replace(/\.[^/.]+$/,""):"packname")+".hex";
var url=packToSave.getHexURL();
downloadFileFromUrl(filename,url);
setStatus("Hex exported");
}

function getActivePack(){
if(currentPackIndex>=0&&currentPackIndex<packs.length){
return packs[currentPackIndex];
}
if(selectedPackIndex>=0&&selectedPackIndex<packs.length){
return packs[selectedPackIndex];
}
if(packs.length>0)return packs[0];
return null;
}

function downloadFileFromUrl(filename,url){
var a=document.createElement('a');
a.href=url;
a.download=filename;
document.body.appendChild(a);
a.click();
document.body.removeChild(a);
}

function getExportExtension(item){
var type=item.type;
if(type===1)return ".odb";
if(type>=2&&type<=15){

var isText=false;
if(type===3){
if(item.child&&item.child.child&&item.child.child.data){
var payload=item.child.child.data;
if(payload.length>=2){
var lncode=(payload[0]<<8)|payload[1];
if(lncode===0)isText=true;
}
}
}
if(isText)return ".opl";
return ".OB"+type.toString(16).toUpperCase();
}
if(type>=16)return ".odb";
return ".bin";
}

function exportCurrentItem(){
var pack=packs[currentPackIndex];
if(!pack){
alert("There is no Data Pack selected for export.");
return;
}


var isPackExport=(currentItem===null||(currentItem&&(currentItem.type===-1||currentItem.type===255)));

if(isPackExport){
showExportPackDialog(pack);
return;
}

var filename="item.bin";
if(currentItem.name){
filename=currentItem.name.trim();
}


var ext=getExportExtension(currentItem);
if(!filename.toLowerCase().endsWith(ext)){
filename+=ext;
}

var userFilename=prompt("Save item as:",filename);
if(userFilename){
var url=pack.getItemURL(currentItem);
if(url){
downloadFileFromUrl(userFilename,url);
}else {
alert("Cannot export this item type (id: "+currentItem.type+"). Only standard files (OPL, ODB, Notepad, etc) are supported.");
}
}
}

function showExportPackDialog(pack){
var element=document.createElement('div');
var defaultName=pack.filename?pack.filename.replace(/\.[^/.]+$/,""):"PACK";
var supportsPicker=!!window.showDirectoryPicker;
var isSecure=window.isSecureContext;
var hasZip=(typeof ZipUtils!=='undefined');
var pickerStatus="";

if(supportsPicker&&isSecure){
pickerStatus="<div style='color: #2e7d32; margin-top: 5px; font-size: 11px;'><i class='fas fa-circle-check'></i> Folder selection supported. You will be prompted to choose a target directory.</div>";
}else if(hasZip){
pickerStatus="<div style='color: #2e7d32; margin-top: 5px; font-size: 11px;'><i class='fas fa-file-zipper'></i> Folder selection not available. Exporting as a single <b>.ZIP</b> file.</div>";
}else {
pickerStatus="<div style='color: #d32f2f; margin-top: 5px; font-size: 11px;'><i class='fas fa-triangle-exclamation'></i> Batch export not supported. Falling back to individual downloads.</div>";
}

element.innerHTML=
"<div style='padding: 10px;'>" +
"<h3>Export Data Pack</h3>" +
"<p>This will export the pack structure as a <b>.BLD</b> file and all objects as separate files.</p>" +
"<div style='margin: 15px 0;'>" +
"<label>Output Base Filename:<br>" +
"<input type='text' id='export-base-name' value='"+defaultName+"' style='width: 100%; margin-top: 5px; padding: 5px; background: var(--input-bg); color: var(--text-color); border: 1px solid var(--border-color);'></label>" +
"</div>" +
pickerStatus +
"<div style='font-size: 11px; opacity: 0.7; margin-top: 10px;'>" +
"<i class='fas fa-info-circle'></i> Untranslated OPL source will be exported as .OPL but excluded from the .BLD file." +
"</div>" +
"</div>";

var dialog=new ModalDialog(element,function (){
var baseName=element.querySelector('#export-base-name').value.trim()||defaultName;
performPackExport(pack,baseName);
});
dialog.start();
}

async function performPackExport(pack,baseName){

if(window.showDirectoryPicker){
try{
const dirHandle=await window.showDirectoryPicker({
id:'opk-export',
startIn:'downloads'
});

const writeFile=async (handle,name,content)=>{
const fileHandle=await handle.getFileHandle(name,{create:true});
const writable=await fileHandle.createWritable();
await writable.write(content);
await writable.close();
};


var bldContent=generateBLDContent(pack,baseName);
await writeFile(dirHandle,baseName+".bld",bldContent);


var count=0;
for(var i=0;i<pack.items.length;i++){
var item=pack.items[i];
if(item.type===-1||item.type===255||item.deleted)continue;

var name=item.name?item.name.trim():"ITEM"+i;
var ext=getExportExtension(item);
var url=pack.getItemURL(item);

if(url){
const response=await fetch(url);
const blob=await response.blob();
await writeFile(dirHandle,name+ext,blob);
count++;
}
}
alert("Successfully exported "+count+" items and "+baseName+".bld to the selected directory.");
return;
}catch(e){
if(e.name==='AbortError')return;
alert("Folder Picker failed: "+e.message+"\n\nFalling back to standard downloads.");
console.warn("Directory picker failed, falling back to standard downloads:",e);
}
}


if(typeof ZipUtils!=='undefined'){
try{
var zipFiles=[];


var bldContent=generateBLDContent(pack,baseName);
zipFiles.push({name:baseName+".bld",content:bldContent});


var count=0;
for(var i=0;i<pack.items.length;i++){
var item=pack.items[i];
if(item.type===-1||item.type===255||item.deleted)continue;

var name=item.name?item.name.trim():"ITEM"+i;
var ext=getExportExtension(item);
var url=pack.getItemURL(item);

if(url){
const response=await fetch(url);
const blob=await response.blob();
zipFiles.push({name:name+ext,content:blob});
count++;
}
}

const zipBlob=await ZipUtils.createZip(zipFiles);
const zipUrl=URL.createObjectURL(zipBlob);
downloadFileFromUrl(baseName+".zip",zipUrl);
alert("Successfully bundled "+count+" items and "+baseName+".bld into "+baseName+".zip");
return;
}catch(e){
console.warn("ZIP generation failed, falling back to standard downloads:",e);
}
}


var bldContent=generateBLDContent(pack,baseName);
var bldBlob=new Blob([bldContent],{type:'text/plain'});
var bldUrl=URL.createObjectURL(bldBlob);


downloadFileFromUrl(baseName+".bld",bldUrl);


for(var i=0;i<pack.items.length;i++){
var item=pack.items[i];
if(item.type===-1||item.type===255||item.deleted)continue;

var name=item.name?item.name.trim():"ITEM"+i;
var ext=getExportExtension(item);
var url=pack.getItemURL(item);
if(url){
downloadFileFromUrl(name+ext,url);
}
}
}

function generateBLDContent(pack,baseName){
var header=pack.items[0];
var headerByte=header.data[0];
var sc=header.data[1];
var sizeKB=sc*8;

var flags=[];
if(headerByte&0x08)flags.push("NOCOPY");
if(headerByte&0x10)flags.push("NOWRITE");

var flagStr=flags.length>0?", "+flags.join(" "):"";

var sanitizedBaseName=baseName.replace(/ /g,'-').substring(0,8).toUpperCase();

var lines=[];
lines.push(sanitizedBaseName+" "+sizeKB+flagStr);

for(var i=0;i<pack.items.length;i++){
var item=pack.items[i];
if(item.type===-1||item.type===255||item.deleted)continue;

var name=(item.name?item.name.trim():"ITEM"+i).replace(/ /g,'-').substring(0,8).toUpperCase();
var ext=getExportExtension(item).substring(1).toUpperCase();
if(ext==="OPL")continue;


var paddedName=(name+"        ").substring(0,8);
lines.push(paddedName+" "+ext);
}

return lines.join("\r\n")+"\r\n";
}

function updateItemButtons(isDirty){
discardbutton.setActive(isDirty);
applybutton.setActive(isDirty);

var activePack=getActivePack();
var hasPack=!!activePack;








var canDelete=(!isDirty&&((currentItem&&currentItem.type>=0)||selectedPackIndex>=0));
eraseitembutton.setActive(canDelete);


if(toolbarButtons){
toolbarButtons.btnNewPack.setActive(!isDirty);
toolbarButtons.btnOpenPack.setActive(!isDirty);
toolbarButtons.btnSavePack.setActive(hasPack);
toolbarButtons.btnImportItem.setActive(hasPack&&!isDirty);
toolbarButtons.btnExportItem.setActive(hasPack&&!isDirty);
toolbarButtons.btnNewProc.setActive(hasPack&&!isDirty);
toolbarButtons.btnNewNotepad.setActive(hasPack&&!isDirty);
toolbarButtons.btnNewData.setActive(hasPack&&!isDirty);
if(toolbarButtons.btnBootablePack){
toolbarButtons.btnBootablePack.setActive(!isDirty);
}
toolbarButtons.btnDelete.setActive(canDelete);
toolbarButtons.btnApply.setActive(isDirty);
toolbarButtons.btnDiscard.setActive(isDirty);


var hasProcs=false;
if(typeof selectedItems!=='undefined'&&selectedItems.length>0){
hasProcs=selectedItems.some(function (it){return it.type===3&&!it.deleted;});
}else if(currentItem&&currentItem.type===3&&!currentItem.deleted){
hasProcs=true;
}
toolbarButtons.btnCopyObj.setActive(hasProcs&&!isDirty);

toolbarButtons.btnAbout.setActive(true);
toolbarButtons.btnMaxMin.setActive(true);
toolbarButtons.btnOptions.setActive(true);
toolbarButtons.btnOplRef.setActive(true);

var hasActivePack=hasPack&&!isDirty;
toolbarButtons.btnPackHeader.setActive(hasActivePack);
toolbarButtons.btnPackReport.setActive(hasActivePack);
toolbarButtons.btnMemoryMap.setActive(hasActivePack);
toolbarButtons.btnVisualizer.setActive(hasActivePack);
}
}

var toolbarButtons=null;

function initIconToolbar(){
var container=document.getElementById('icon-toolbar');
if(!container)return;

container.innerHTML='';

function createToolbarBtn(id,icon,title,callback){
var btn=document.createElement('button');
btn.className='tool-btn';
btn.id=id;
btn.title=title;
btn.innerHTML='<i class="'+icon+'"></i>';
container.appendChild(btn);
return new Button(id,callback);
}

function createSeparator(){
var sep=document.createElement('div');
sep.className='tool-separator';
container.appendChild(sep);
}

function createSpacer(){
var spacer=document.createElement('div');
spacer.style.flex='1';
container.appendChild(spacer);
}

toolbarButtons={};

toolbarButtons.btnNewPack=createToolbarBtn('tbtn-new-pack','fas fa-box','New Pack',createNew);
toolbarButtons.btnOpenPack=createToolbarBtn('tbtn-open-pack','fas fa-folder-open','Open Pack',function (){if(fileInputPack)fileInputPack.click();});
toolbarButtons.btnSavePack=createToolbarBtn('tbtn-save-pack','fas fa-save','Save Pack',packSaved);

createSeparator();

toolbarButtons.btnImportItem=createToolbarBtn('tbtn-import-item','fas fa-file-import','Import Item',function (){if(fileInputItem)fileInputItem.click();});
toolbarButtons.btnExportItem=createToolbarBtn('tbtn-export-item','fas fa-file-export','Export Item',exportCurrentItem);

createSeparator();

toolbarButtons.btnDelete=createToolbarBtn('tbtn-delete','fas fa-trash-can','Delete',eraseItem);

createSeparator();

toolbarButtons.btnNewProc=createToolbarBtn('tbtn-new-proc','fas fa-file-code','New OPL Procedure',function (){
var data=[0x00,0x00,0x00,0x0A,80,82,79,67,78,65,77,69,58,0];
createBlockFile(data,"PROCNAME",3);
});
toolbarButtons.btnNewNotepad=createToolbarBtn('tbtn-new-notepad','fas fa-sticky-note','New Notepad Entry',function (){
var data=[0x00,0x02,8,0,0x00,0x09,78,79,84,69,80,65,68,58,0];
createBlockFile(data,"NOTEPAD",7);
});
toolbarButtons.btnNewData=createToolbarBtn('tbtn-new-data','fas fa-database','New Data File',function (){
var id=getFreeFileId();
if(id>0){
var hdritem=createFileHeader("DATA"+id,1,id+0x8f);
addItemToPack(hdritem);
updateInventory();
}
});
toolbarButtons.btnBootablePack=createToolbarBtn('tbtn-bootable-pack','fa-solid fa-splotch','Bootable Pack Wizard',openBootableWizard);

createSeparator();

toolbarButtons.btnApply=createToolbarBtn('tbtn-apply','fas fa-circle-check','Apply Changes',applyEdits);
toolbarButtons.btnDiscard=createToolbarBtn('tbtn-discard','fas fa-rotate-left','Discard Changes',discardEdits);

createSeparator();


toolbarButtons.btnCopyObj=createToolbarBtn('tbtn-copy-obj','fa-solid fa-file-zipper','Copy Object Code (Extract)',function (){
if(typeof selectedItems==='undefined'||selectedItems.length===0)return;
var targets=selectedItems.filter(function (it){return it.type===3;});
if(targets.length===0)return;

var procEditor=editors.find(function (e){return e instanceof ProcedureFileEditor;});
if(procEditor){

var oldItem=procEditor.item;
procEditor.item=targets[0];
try{
procEditor.copyObjectCode();
}finally{
procEditor.item=oldItem;
}
}
});

createSeparator();

toolbarButtons.btnPackHeader=createToolbarBtn('tbtn-pack-header','fas fa-receipt','Pack Header / Contents',function (){
if(currentPackIndex>=0&&packs[currentPackIndex]){
var pack=packs[currentPackIndex];
var headerIdx=-1;

for(var i=0;i<pack.items.length;i++){
if(pack.items[i].type===-1){
headerIdx=i;
break;
}
}

if(headerIdx>=0){
itemSelected(currentPackIndex,headerIdx);
}else {
selectPack(currentPackIndex);
}
}
});

toolbarButtons.btnPackReport=createToolbarBtn('tbtn-pack-report','fas fa-clipboard-list','Pack Summary Report',function (){
var pack=currentPack;
if(!pack&&typeof packs!=='undefined'&&currentPackIndex>=0){
pack=packs[currentPackIndex];
}

if(packReportWindow&&pack){
packReportWindow.open(pack);
}
});

toolbarButtons.btnMemoryMap=createToolbarBtn('tbtn-memory-map','fas fa-map','Memory Map',function (){
if(currentPackIndex>=0)selectPack(currentPackIndex);
});

toolbarButtons.btnVisualizer=createToolbarBtn('tbtn-visualizer','fas fa-diagram-project','Code Visualizer',function (){
if(typeof CodeVisualizer!=='undefined')CodeVisualizer.showSystemMap(packs);
});

createSpacer();

toolbarButtons.btnOptions=createToolbarBtn('tbtn-options','fas fa-sliders','Options',function (){
if(typeof DialogManager!=='undefined'&&DialogManager.showOptionsDialog)DialogManager.showOptionsDialog();
});

toolbarButtons.btnOplRef=createToolbarBtn('tbtn-opl-ref','fas fa-book','OPL Command Reference',function (){
if(typeof OPLCommandReference!=='undefined')new OPLCommandReference().open();
});

toolbarButtons.btnAbout=createToolbarBtn('tbtn-about','fas fa-circle-info','About',function (){
if(typeof showAboutDialog==='function')showAboutDialog();
});

toolbarButtons.btnMaxMin=createToolbarBtn('tbtn-max-min','fas fa-expand','Toggle Fullscreen',function (){
if(!document.fullscreenElement){
document.documentElement.requestFullscreen().catch(function (e){

});
}else {
if(document.exitFullscreen){
document.exitFullscreen();
}
}
});


document.addEventListener('fullscreenchange',function (){
var icon=document.querySelector('#tbtn-max-min i');
if(icon){
if(document.fullscreenElement){
icon.className='fas fa-compress';
}else {
icon.className='fas fa-expand';
}
}
});

if(typeof OptionsManager!=='undefined')OptionsManager.applyOptions();
updateItemButtons(false);
}

function discardEdits(){
if(currentEditor&&currentItem){
currentEditor.initialise(currentItem);
updateItemButtons(false);
setStatus("Edits discarded");
}
}

function applyEdits(){
if(currentEditor&&currentItem){
if(currentEditor.applyChanges()){
if(currentPackIndex>=0&&currentPackIndex<packs.length){
packs[currentPackIndex].unsaved=true;
}
updateInventory();
setStatus("Changes applied");
}else {
setStatus("No changes to apply");
}
updateItemButtons(false);
}
}


function handleEditorMessage(msg,arg1,arg2){
if(msg==EditorMessage.CHANGEMADE){
updateItemButtons(true);
}
else if(msg==EditorMessage.GETFILEIDS){
return getDataFiles();
}
else if(msg==EditorMessage.CHANGEFILEID){
var fromtp=arg1&0x7f;
var totp=arg2&0x7f;
var pack=packs[currentPackIndex];
if(!pack)return;
var items=pack.items;
for(var i=0;i<items.length;i++){
var item=items[i];
if(item.type==fromtp){
item.data[1]=totp+(item.deleted?0:0x80);
item.setDescription();
pack.unsaved=true;
}
}
}
else if(msg==EditorMessage.DELETERECORDS){
var fileid=arg1&0x7f;
var deleted=arg2;
var pack=packs[currentPackIndex];
if(!pack)return;
var items=pack.items;
for(var i=0;i<items.length;i++){
var item=items[i];
if(item.type==fileid){
item.data[1]=fileid+(deleted?0:0x80);
item.setDescription();
pack.unsaved=true;
}
}
}
}

function getDataFiles(){
var idlst={};
var pack=packs[currentPackIndex];
if(!pack)return idlst;
var items=pack.items;
for(var i=0;i<items.length;i++){
if(items[i].type==1){
var id=items[i].data[10]-0x8f;
idlst[id]=items[i].name;
}
}
return idlst;
}

function discardUnsavedPack(){


if(!closeEditor())return false;
return true;
}

function updatePackChecksums(pack){
if(!pack)return;
var data=pack.getRawData();
pack.checksums=Checksums.calculate(data);
}

function updateInventory(){
PackContents.render();


var editorContainer=document.getElementById('editor-container');
if(editorContainer){
if(!packs||packs.length===0){
editorContainer.classList.add('watermark');
}else {
editorContainer.classList.remove('watermark');
}
}


if(saveTimer)clearTimeout(saveTimer);
saveTimer=setTimeout(saveSession,1000);
}



var dragSrcInfo=null;

function handleDragStart(e,packIndex,itemIndex){









}



function closeEditor(){
if(currentEditor){
if(currentEditor.hasUnsavedChanges()){






}
currentEditor.finish();
currentEditor=null;


legacyEditorElement.innerHTML="";
legacyEditorElement.style.display='none';
if(codeEditorElement)codeEditorElement.style.display='none';
legacyEditorElement.style.display='none';
}
return true;
}

function getItemAddres(pack,ix){
var addr=0;
for(var i=0;i<ix;i++){
addr+=pack.items[i].getLength();
}
return addr;
}

function clonePackItem(item){
var newItem=new PackItem(item.data,0,item.data.length);
newItem.setDescription();
if(item.child){
newItem.child=clonePackItem(item.child);
}
return newItem;
}

function itemMoved(fromPackIx,fromItemIx,toPackIx,toItemIx,isCopy){

if(!isCopy&&fromPackIx===toPackIx&&fromItemIx===toItemIx&&selectedItems.length<=1)return;

var fromPack=packs[fromPackIx];
var toPack=packs[toPackIx];

if(!fromPack||!toPack)return;



var topMainIdx=-1;
for(var i=0;i<toPack.items.length;i++){
if(toPack.items[i].name==="MAIN"){
topMainIdx=i;
break;
}
}



if(topMainIdx!==-1&&toItemIx<=topMainIdx){




return;
}


var hdata=toPack.items[0].data;

if((hdata[0]&0x10)===0){
var bootAddr=(hdata[6]<<8)+hdata[7];



var targetAddr=0;
for(var i=0;i<toItemIx;i++){















if(fromPackIx===toPackIx&&i===fromItemIx)continue;

targetAddr+=toPack.items[i].getLength();
}







if(targetAddr<bootAddr){
alert("Bootable pack address conflict!");
return;
}
}

var draggedItem=fromPack.items[fromItemIx];
var multiActive=(selectedItems.indexOf(draggedItem)!==-1);


if(multiActive&&selectedItems.length>1){

var oldStatus="";
if(typeof statusmessageelement!=='undefined'&&statusmessageelement){
oldStatus=statusmessageelement.innerText;
statusmessageelement.innerText=(isCopy?"Copying ":"Moving ")+selectedItems.length+" items...";
}

setTimeout(function (){


var itemsToMove=selectedItems.filter(function (i){return fromPack.items.indexOf(i)!==-1;});

itemsToMove.sort(function (a,b){return fromPack.items.indexOf(a)-fromPack.items.indexOf(b);});

if(itemsToMove.length===0){
if(typeof statusmessageelement!=='undefined'&&statusmessageelement)statusmessageelement.innerText=oldStatus;
return;
}

if(isCopy){

var clones=itemsToMove.map(clonePackItem);

for(var i=0;i<clones.length;i++){
toPack.items.splice(toItemIx+i,0,clones[i]);
}
selectedItems=[];
}else {




var indices=itemsToMove.map(function (it){return fromPack.items.indexOf(it);});
indices.sort(function (a,b){return b-a;});

indices.forEach(function (idx){
fromPack.items.splice(idx,1);

if(fromPackIx===toPackIx&&idx<toItemIx){
toItemIx--;
}
});

fromPack.unsaved=true;


for(var i=0;i<itemsToMove.length;i++){
toPack.items.splice(toItemIx+i,0,itemsToMove[i]);
}


if(fromPackIx!==toPackIx)selectedItems=[];
}

toPack.unsaved=true;
updateInventory();


if(typeof statusmessageelement!=='undefined'&&statusmessageelement){
statusmessageelement.innerText=oldStatus;
}
},20);
return;
}





var item=draggedItem;


var bootOffset=-1;
if(!isCopy&&fromPackIx===toPackIx){
if(item.type==0&&(fromPack.items[0].data[0]&0x10)==0){
var addr1=getItemAddres(fromPack,fromItemIx);
var addr2=(fromPack.items[0].data[6]<<8)+fromPack.items[0].data[7];
if(addr2>=addr1&&addr2<addr1+item.getLength()){
bootOffset=addr2-addr1;
}
}
}

if(isCopy){
item=clonePackItem(item);
}else {

fromPack.items.splice(fromItemIx,1);


if(fromPackIx===toPackIx&&fromItemIx<toItemIx){
toItemIx--;
}
fromPack.unsaved=true;
}


toPack.items.splice(toItemIx,0,item);


if(bootOffset>=0&&fromPackIx===toPackIx){
var addr=getItemAddres(toPack,toItemIx)+bootOffset;
toPack.items[0].data[6]=(addr>>8)&0xff;
toPack.items[0].data[7]=addr&0xff;
}

toPack.unsaved=true;

updateInventory();
}

function selectPack(index){

if(selectedPackIndex===index){


selectedPackIndex=index;
currentPackIndex=index;
currentItem=null;


if(typeof PackContents!=='undefined')PackContents.selectPack(index);



if(index>=0&&index<packs.length){
var mmEditor=editors.find(function (e){return e instanceof MemoryMapEditor;});
if(mmEditor){
currentEditor=mmEditor;
mmEditor.initialise({type:255});

var packName=packs[index].filename||"Untitled Pack";
if(document.getElementById('current-file-name'))document.getElementById('current-file-name').innerText=packName;

if(document.getElementById('code-editor-container'))document.getElementById('code-editor-container').style.display='none';
if(legacyEditorElement)legacyEditorElement.style.display='block';
}
}else {
if(document.getElementById('current-file-name'))document.getElementById('current-file-name').innerText="No Pack Selected";
}

updateItemButtons(false);
return;
}

if(!closeEditor())return;
selectedPackIndex=index;
currentPackIndex=index;
currentItem=null;
selectedItems=[];
var lastFocusedItemIndex=-1;
updateInventory();


if(index>=0&&index<packs.length){
var mmEditor=editors.find(function (e){return e instanceof MemoryMapEditor;});
if(mmEditor){
currentEditor=mmEditor;
mmEditor.initialise({type:255});

var packName=packs[index].filename||"Untitled Pack";
if(document.getElementById('current-file-name'))document.getElementById('current-file-name').innerText=packName;

if(document.getElementById('code-editor-container'))document.getElementById('code-editor-container').style.display='none';
if(legacyEditorElement)legacyEditorElement.style.display='block';
}
}else {
if(document.getElementById('current-file-name'))document.getElementById('current-file-name').innerText="No Pack Selected";
}
}

function selectItem(packIdx,itemIdx){
var pack=packs[packIdx];
var item=pack?pack.items[itemIdx]:null;
if(currentItem===item){
if(typeof PackContents!=='undefined')PackContents.selectItem(packIdx,itemIdx);
return;
}
itemSelected(packIdx,itemIdx);
}


function itemSelected(packIndex,itemIndex,event){
if(typeof packs==='undefined'||!packs[packIndex])return false;

var pack=packs[packIndex];
var item=pack.items[itemIndex];
if(!item)return false;


lastFocusedItemIndex=itemIndex;

if(currentItem==item&&(!event||(!event.ctrlKey&&!event.shiftKey))){

if(typeof PackContents!=='undefined'&&PackContents.selectItem){
PackContents.selectItem(packIndex,itemIndex);
}
return true;
}

if(!closeEditor())return false;


var isSpecial=(item.name==="MAIN"||item.type===255);


if(currentPackIndex!==packIndex){
selectedItems=[];
lastFocusedItemIndex=-1;
}

if(event&&!isSpecial){
if(event.ctrlKey){

var idx=selectedItems.indexOf(item);
if(idx>=0){
selectedItems.splice(idx,1);
}else {
selectedItems.push(item);
}
}else if(event.shiftKey&&lastFocusedItemIndex!==-1){

selectedItems=[];
var start=Math.min(lastFocusedItemIndex,itemIndex);
var end=Math.max(lastFocusedItemIndex,itemIndex);
for(var k=start;k<=end;k++){
selectedItems.push(pack.items[k]);
}
}else {
selectedItems=[item];
}
}else {

selectedItems=[item];
}


if(selectedItems.length>1){
setStatus(selectedItems.length+" items selected");
}else if(event&&!event.ctrlKey&&!event.shiftKey){
if(typeof statusmessageelement!=='undefined'&&statusmessageelement){
if(statusmessageelement.innerText.indexOf("selected")!==-1){
statusmessageelement.innerText="";
}
}
}




currentPackIndex=packIndex;

selectedPackIndex=-1;
var it=item;
var tp=it.type;




var checkData=it.getFullData();
if(tp===3&&it.child){
checkData=it.child.getFullData();
}

var selectedEditor=null;

var isNative=(typeof NativeDecoder!=='undefined'&&tp!==3&&tp!==0x83)?NativeDecoder.isNative(checkData,tp):false;

if(checkData){
var hex="";
var logLen=Math.min(checkData.length,16);
for(var i=0;i<logLen;i++)hex+=checkData[i].toString(16).toUpperCase().padStart(2,'0')+" ";
console.log("Record Bytes (first 16 of "+checkData.length+"):",hex);
}

if(isNative){
selectedEditor=editors.find(function (e){return e instanceof NativeCodeEditor;});
}

if(!selectedEditor){

selectedEditor=editors.find(function (e){return e.acceptsType(tp,it);});
}


if(!selectedEditor&&tp===0){

if(it.data.length>=2&&it.data[0]+2===it.data.length){
var recType=it.data[1]&0x7f;
if(recType>=16&&recType<=126){
selectedEditor=editors.find(function (e){return e instanceof RecordEditor;});
}
}


if(!selectedEditor){
selectedEditor=editors.find(function (e){return e instanceof HexEditor;});
}
}

if(selectedEditor){

if(selectedEditor instanceof ProcedureFileEditor){

legacyEditorElement.style.display="block";
codeEditorElement.style.display="block";
}else {

legacyEditorElement.style.display="block";
codeEditorElement.style.display="none";
}

selectedEditor.initialise(it);

currentEditor=selectedEditor;
currentItem=it;
fileinfoelement.innerText=it.name||it.desc||"Item "+itemIndex;

if(typeof PackContents!=='undefined'&&PackContents.selectItem){
PackContents.selectItem(packIndex,itemIndex);
}

updateItemButtons(false);
return true;
}


closeEditor();
if(typeof PackContents!=='undefined'){
PackContents.selectItem(packIndex,itemIndex);
}
updateItemButtons(false);
return false;
}


var selectItem=itemSelected;

function canLoadPack(e){
if(!discardUnsavedPack()){
e.preventDefault();
}
}





function fileChosen(){
var fileInput=document.getElementById("file-input-pack");
if(fileInput&&fileInput.files.length>0){
loadPackFromFiles(fileInput.files);
}
}

function loadPackFromFiles(files){
if(typeof HexViewer!=='undefined')HexViewer.close();
if(files.length!=0){
var file=files[0];
var fname=file.name.toLowerCase();
if(fname.endsWith(".hex")||fname.endsWith(".ihx")){
var reader=new FileReader();
reader.onload=function (e){
try{
var binary=parseIntelHexToBinary(e.target.result);








var validSizes=[1,2,4,8,16,32,64,128];


var features={
isValidType:false,
isValidSize:false,
sizeKB:0,
sizeCode:0,
isBootable:false,
bootAddr:0,
headerID:"Unknown",
typeByte:0
};

if(binary.length>=10){
features.typeByte=binary[0];
features.sizeCode=binary[1];
features.headerID=binary[8].toString(16).toUpperCase().padStart(2,'0')+binary[9].toString(16).toUpperCase().padStart(2,'0');





var isKnownType=(features.typeByte===0x7A||features.typeByte===0x7E);


features.isValidSize=(validSizes.indexOf(features.sizeCode)!==-1);
if(features.isValidSize)features.sizeKB=features.sizeCode*8;

features.bootAddr=(binary[6]<<8)|binary[7];




}

var isNative=(features.isValidSize&&(features.typeByte===0x7A||features.typeByte===0x7E));


var isOPK=(binary.length>=3&&binary[0]===0x4F&&binary[1]===0x50&&binary[2]===0x4B);

var finalBinary=null;

if(isNative){
var hexType=features.typeByte.toString(16).toUpperCase().padStart(2,'0');
var hexSize=features.sizeCode.toString(16).toUpperCase().padStart(2,'0');
var hexBoot=binary[6].toString(16).toUpperCase().padStart(2,'0')+binary[7].toString(16).toUpperCase().padStart(2,'0');

var typeStr=(features.typeByte===0x7E)?"Paged/Bootable (0x7E)":"Standard Data (0x7A)";

var msg="Detected Psion Organiser II Datapack:\n" +
"------------------------------------\n" +
"Pack Type: "+typeStr+"\n" +
"Capacity:  "+features.sizeKB+" KB (Size Code: 0x"+hexSize+")\n" +
"ID Word:   0x"+features.headerID+"\n" +
"Boot Addr: 0x"+features.bootAddr.toString(16).toUpperCase().padStart(4,'0')+" (Bytes: "+hexBoot+")\n" +
"------------------------------------\n\n" +
"Import this pack?";

if(!confirm(msg))return;


finalBinary=new Uint8Array(binary.length+6);
finalBinary[0]=0x4F;finalBinary[1]=0x50;finalBinary[2]=0x4B;

var len=binary.length-2;
if(len<0)len=0;
finalBinary[3]=(len>>16)&0xFF;
finalBinary[4]=(len>>8)&0xFF;
finalBinary[5]=len&0xFF;

finalBinary.set (binary,6);

}else if(isOPK){

finalBinary=binary;

}else {

var details="";
if(binary.length>=10){
var hType=binary[0].toString(16).toUpperCase().padStart(2,'0');
var hSize=binary[1].toString(16).toUpperCase().padStart(2,'0');
var hID=binary[8].toString(16).toUpperCase().padStart(2,'0')+binary[9].toString(16).toUpperCase().padStart(2,'0');

details+="Header Byte 0 (Type): 0x"+hType+"\n";
details+="Header Byte 1 (Size): 0x"+hSize+" ("+(validSizes.indexOf(binary[1])!==-1?"Valid":"Invalid")+")\n";
details+="Header Byte 8-9 (ID): 0x"+hID+"\n";
}else {
details+="File too short (<10 bytes)\n";
}

var msg="Warning: The imported data does not appear to be a standard Psion Datapack.\n" +
"(Missing OPK Header and Invalid Native Header)\n\n" +
"Details:\n"+details+"\n" +
"Import as raw data anyway?";

if(!confirm(msg))return;


finalBinary=new Uint8Array(binary.length+6);
finalBinary[0]=0x4F;finalBinary[1]=0x50;finalBinary[2]=0x4B;
var len=binary.length-2;
if(len<0)len=0;
finalBinary[3]=(len>>16)&0xFF;
finalBinary[4]=(len>>8)&0xFF;
finalBinary[5]=len&0xFF;
finalBinary.set (binary,6);
}

var newPack=new PackImage(finalBinary);
newPack.unsaved=false;
newPack.filename=file.name.replace(/\.[^/.]+$/,"")+".opk";

packs.push(newPack);
currentPackIndex=packs.length-1;
selectedPackIndex=packs.length-1;

updatePackChecksums(newPack);
updateInventory();

setStatus("Loaded HEX file: "+newPack.filename);
}catch(err){
alert("Error parsing HEX file: "+err.message);
}
};
reader.readAsText(file);
}else {

if(OptionsManager.getOption('restorePacks')){
var path=file.path||(file.webkitRelativePath?file.webkitRelativePath:null);
if(path){
var stored=localStorage.getItem('opkedit_open_packs');
var openPacks=stored?JSON.parse(stored):[];
if(openPacks.indexOf(path)===-1){
openPacks.push(path);
localStorage.setItem('opkedit_open_packs',JSON.stringify(openPacks));
}
}else {


setStatus("Warning: Cannot save pack path for restore (Browser restriction).");
}
}

LoadLocalBinaryFile(files[0],
function (data,nm){

var isWrapped=(data.length>=3&&data[0]===79&&data[1]===80&&data[2]===75);


if(!isWrapped){
alert("Error: File is not a valid Psion Pack (missing OPK header).");
return;
}

var newPack=new PackImage(data);
newPack.unsaved=false;
newPack.filename=nm;



if(newPack.items&&newPack.items.length>0){
var header=newPack.items[0];
if(header&&header.data&&header.data.length>1){
var sc=header.data[1];
if(sc<1){
alert("Import Warning: Invalid Pack Size Code ("+sc+") detected.\nDefaulting to 8KB (Code 1).");
header.data[1]=1;
}
}
}


if(OptionsManager.getOption('restorePacks')){
try{
var binary='';
var len=data.byteLength;
for(var i=0;i<len;i++){
binary+=String.fromCharCode(data[i]);
}
var base64=btoa(binary);
var cachedPack={
name:nm,
data:base64
};
var cachedPacks=[];
try{
var stored=localStorage.getItem('opkedit_cached_packs');
if(stored)cachedPacks=JSON.parse(stored);
}catch(e){console.error("Drop handler error:",e);}


cachedPacks=cachedPacks.filter(function (p){return p.name!==nm;});
cachedPacks.push(cachedPack);

localStorage.setItem('opkedit_cached_packs',JSON.stringify(cachedPacks));

}catch(e){


}
}

packs.push(newPack);
currentPackIndex=packs.length-1;
selectedPackIndex=packs.length-1;

updatePackChecksums(newPack);
updateInventory();

setStatus("Loaded OPK file: "+nm);
saveSession();
}
);
}
}
}


function eraseItem(arg){

var isRecycle=false;
if(typeof arg==='boolean'){
isRecycle=arg;
}else if(arg&&arg.type&&arg.shiftKey){
isRecycle=true;
}

if(selectedPackIndex>=0){
var suppress=OptionsManager.getOption('suppressConfirmations');
if(!suppress){
var discard=window.confirm("Are you sure you want to close/remove this pack?");
if(!discard)return;
}

if(!closeEditor())return;


if(OptionsManager.getOption('restorePacks')){
var pack=packs[selectedPackIndex];
if(pack){
try{

var cachedPacks=[];
try{
var stored=localStorage.getItem('opkedit_cached_packs');
if(stored)cachedPacks=JSON.parse(stored);
}catch(e){console.error("File entry read error:",e);}

var initialLen=cachedPacks.length;
cachedPacks=cachedPacks.filter(function (p){return p.name!==pack.filename;});

if(cachedPacks.length<initialLen){
localStorage.setItem('opkedit_cached_packs',JSON.stringify(cachedPacks));
}


var legacy=localStorage.getItem('opkedit_cached_pack');
if(legacy){
try{
var lData=JSON.parse(legacy);
if(lData.name===pack.filename){
localStorage.removeItem('opkedit_cached_pack');
}
}catch(e){console.error("File parse error:",e);}
}
}catch(e){




}


try{
var storedPaths=localStorage.getItem('opkedit_open_packs');
if(storedPaths){
var openPacks=JSON.parse(storedPaths);
var initialOpenLen=openPacks.length;

openPacks=openPacks.filter(function (p){
return!p.endsWith(pack.filename)&&!p.endsWith(pack.filename.replace('.opk','.hex'));
});

if(openPacks.length<initialOpenLen){
localStorage.setItem('opkedit_open_packs',JSON.stringify(openPacks));
}
}
}catch(e){console.error("Remove open pack error:",e);}
}
}

packs.splice(selectedPackIndex,1);
selectedPackIndex=-1;
currentPackIndex=packs.length>0?0:-1;
updateInventory();
return;
}

if(!closeEditor())return;

var pack=packs[currentPackIndex];

if(selectedItems.length>0){

var toDelete=selectedItems.filter(function (it){
return it.type>=0&&it.type!==255;
});

if(toDelete.length===0)return;


var headerData=pack.items[0].data;
var isBootable=(headerData&&(headerData[0]&0x10)===0);
var bootAddr=isBootable?(headerData[6]<<8)+headerData[7]:-1;
var clearBootable=false;

if(isBootable){
toDelete.forEach(function (it){
var idx=pack.items.indexOf(it);
if(idx>0){
var addr1=getItemAddres(pack,idx);
if(bootAddr>=addr1&&bootAddr<addr1+it.getLength()){
clearBootable=true;
}
}
});
}

if(clearBootable){
headerData[0]|=0x10;
headerData[6]=0;
headerData[7]=0;
pack.unsaved=true;
}


if(isRecycle){





var changed=false;
toDelete.forEach(function (it){
it.deleted=!it.deleted;
if(it.data&&it.data.length>1){
if(it.deleted)it.data[1]&=0x7F;
else it.data[1]|=0x80;
}
it.setDescription();
changed=true;
});

if(changed){
pack.unsaved=true;
updateInventory();
saveSession();
}

}else {

var suppress=OptionsManager.getOption('suppressConfirmations');
if(!suppress){
var msg=toDelete.length===1?
"Are you sure you want to permanently erase '"+toDelete[0].name+"'?":
"Are you sure you want to permanently erase these "+toDelete.length+" items?";
if(!confirm(msg))return false;
}


var oldStatus="";
if(typeof statusmessageelement!=='undefined'&&statusmessageelement){
oldStatus=statusmessageelement.innerText;
statusmessageelement.innerText="Deleting "+toDelete.length+" items...";
}


setTimeout(function (){


var indices=toDelete.map(function (it){return pack.items.indexOf(it);}).sort(function (a,b){return b-a;});

indices.forEach(function (idx){
if(idx>=0){
pack.items.splice(idx,1);
}
});

selectedItems=[];
currentItem=null;

pack.unsaved=true;
updateInventory();
saveSession();


if(typeof statusmessageelement!=='undefined'&&statusmessageelement){
statusmessageelement.innerText=oldStatus;
}
},20);
}

return;
}else if(currentItem){







selectedItems=[currentItem];

eraseItem(arg);
return;
}else {
return;
}
}


var availableTypes={
1:"Data file",
3:"Procedure",
7:"Notepad",
};

function createNewItem(){
var pack=packs[currentPackIndex];
if(!pack){
alert("Please select a pack first.");
return;
}

var element=document.createElement('div');
element.innerHTML=
"<div>Select type to add:</div>" +
"<div><select id=choosetype>" +
"</select>";

var sel=element.querySelector("#choosetype");

var chooseTypeScreen=new ModalDialog(element,function (){
var type=parseInt(sel.value);
if(type==1){
var id=getFreeFileId();
if(id<=0)return;
var hdritem=createFileHeader("DATA"+id,type,id+0x8f);
addItemToPack(hdritem);
updateInventory();
}else if(type==3){

var data=[0x00,0x00,0x00,0x09,80,82,79,67,78,65,77,69,58,0x00,0x00];
createBlockFile(data,"PROCNAME",3);
}else if(type==7){
var data=[0x00,0x02,8,0,0x00,0x09,78,79,84,69,80,65,68,58,0];
createBlockFile(data,"NOTEPAD",7);
}else if(type>0x0f){
var hdritem=new PackItem([1,type+0x80,0x20],0,3);
hdritem.setDescription();
addItemToPack(hdritem);
updateInventory();
}
});

for(var i=1;i<15;i++){
if(availableTypes[i]){
var opt=document.createElement('option');
opt.value=i;
opt.innerHTML=availableTypes[i];
sel.appendChild(opt);
}
}
var files=getDataFiles();
for(var i=1;i<110;i++){
if(files[i]){
var opt=document.createElement('option');
opt.value=i+0xf;
opt.innerHTML="Record for file "+files[i]+" ("+i + ")";
sel.appendChild(opt);
}
}
chooseTypeScreen.start();
}

function createNewRecord(){
var files=getDataFiles();
var validFiles=[];
for(var k in files){
if(files.hasOwnProperty(k)){
var id=parseInt(k);
if(id>=1&&id<110){
validFiles.push({id:id,name:files[id]});
}
}
}

if(validFiles.length===0){
alert("No Data Files found in this pack. Please create a Data File first.");
return;
}

var element=document.createElement('div');
element.innerHTML=
"<div>Select Data File:</div>" +
"<div><select id='choosedatafile' style='width: 100%; margin-top: 10px; padding: 5px;'></select></div>";

var sel=element.querySelector("#choosedatafile");

validFiles.forEach(function (f){
var opt=document.createElement('option');
opt.value=f.id;
opt.innerHTML=f.name+" (ID: "+f.id+")";
sel.appendChild(opt);
});

var dialog=new ModalDialog(element,function (){
var fileId=parseInt(sel.value);
if(fileId>0){

var type=fileId+0x0F;
var hdritem=new PackItem([1,type+0x80,0x20],0,3);
hdritem.setDescription();
addItemToPack(hdritem);
updateInventory();
var idx=packs[currentPackIndex].items.indexOf(hdritem);
if(idx!==-1&&typeof selectItem==='function')selectItem(currentPackIndex,idx);
}
});

dialog.start();
}

function saveSession(){
if(!OptionsManager.getOption('restorePacks'))return;

var sessionPacks=[];
try{
for(var i=0;i<packs.length;i++){
var p=packs[i];


var rawData=p.getRawData();


var binary='';
var len=rawData.byteLength;
for(var j=0;j<len;j++){
binary+=String.fromCharCode(rawData[j]);
}
var base64=btoa(binary);

sessionPacks.push({
name:p.filename||"Untitled",
data:base64
});
}
localStorage.setItem('opkedit_cached_packs',JSON.stringify(sessionPacks));
}catch(e){




}
}


function createBlockFile(data,name,type,suppressUpdate){
var hdritem=createFileHeader(name,type,0);
var c2item=new PackItem(data,0,data.length);
var c1item=new PackItem([2,0x80,data.length>>8,data.length&0xff],0,4);
c1item.child=c2item;
c1item.setDescription();
hdritem.child=c1item;
addItemToPack(hdritem);
if(!suppressUpdate)updateInventory();


if(typeof currentPackIndex!=='undefined'&&currentPackIndex>=0&&packs[currentPackIndex]){
var idx=packs[currentPackIndex].items.indexOf(hdritem);
if(idx!==-1){
if(!suppressUpdate)itemSelected(currentPackIndex,idx);
}
}
return hdritem;
}


async function packSaved(){
if(!closeEditor())return;

var pack=packs[currentPackIndex];
if(!pack)return;

var data=pack.getRawData();


if(window.showSaveFilePicker){
try{
const options={
suggestedName:pack.filename||"pack.opk",
types:[
{
description:'Psion Pack File',
accept:{'application/octet-stream':['.opk']},
},
],
};
const handle=await window.showSaveFilePicker(options);
const writable=await handle.createWritable();
await writable.write(data);
await writable.close();

pack.unsaved=false;
pack.filename=handle.name;
updateInventory();
setStatus("Pack saved to "+handle.name);
return;
}catch(err){
if(err.name!=='AbortError'){


}else {
return;
}
}
}


var filename=prompt("Save Pack As:",pack.filename||"pack.opk");
if(filename){
var blob=new Blob([data],{type:"application/octet-stream"});
var url=URL.createObjectURL(blob);
downloadFileFromUrl(filename,url);
URL.revokeObjectURL(url);

pack.unsaved=false;
pack.filename=filename;
updateInventory();
setStatus("Pack downloaded as "+filename);
}
}

function exportHex(){
if(!closeEditor())return;
var pack=packs[currentPackIndex];
if(!pack)return;

var ihex=packToIntelHex(pack);
var filename=pack.filename?pack.filename.replace(/\.opk$/i,"")+".hex":"pack.hex";


if(window.showSaveFilePicker){



}

var userFilename=prompt("Export Hex As:",filename);
if(userFilename){
var blob=new Blob([ihex],{type:"text/plain"});
var url=URL.createObjectURL(blob);
downloadFileFromUrl(userFilename,url);
URL.revokeObjectURL(url);
setStatus("Hex file exported.");
}
}

function itemChosen(){
var pack=packs[currentPackIndex];
if(!pack)return;

var fileInput=document.getElementById("file-input-item");
if(!fileInput)return;

var files=fileInput.files;
importFilesToPack(currentPackIndex,files);

fileInput.value='';
}

function getFreeFileId(){
var ids=getDataFiles();
var id=1;
while(ids[id])id++;
if(id>=111){
return-1;
}
return id;
}

function createItemFromFileData(filedata,name){


if(filedata[0]==79&&filedata[1]==82&&filedata[2]==71){

var isBlockFile=false;
var isSystemBoot=false;

var lnBlock=(filedata[3]<<8)|filedata[4];
if(filedata.length>=6+lnBlock&&filedata[5]>=0x82&&filedata[5]<=0x8f){
isBlockFile=true;
}

var lnBoot=(filedata[3]<<16)|(filedata[4]<<8)|filedata[5];
var bootOffset=-1;


if(filedata.length>=6+lnBoot&&lnBoot>=10){
var hdrByte=filedata[6];

if(hdrByte===0x7A||hdrByte===0x6A||hdrByte===0x7E||hdrByte===0x6E){
var bootAddr=(filedata[12]<<8)|filedata[13];
bootOffset=6+bootAddr;
if(bootOffset>=16&&bootOffset+1<filedata.length){

if(filedata[bootOffset]===0x02&&filedata[bootOffset+1]===0x80){
isSystemBoot=true;
}
}
}
}

if(isSystemBoot){
var ln2=(filedata[bootOffset+2]<<8)|filedata[bootOffset+3];
if(filedata.length<bootOffset+4 + ln2){
alert("The file "+name+" seems to be truncated at the data block!");
return false;
}
var blkhdr=new Uint8Array(4);
blkhdr[0]=2;blkhdr[1]=0x80;blkhdr[2]=filedata[bootOffset+2];blkhdr[3]=filedata[bootOffset+3];
var dataitem=new PackItem(filedata,bootOffset+4,ln2);
var blkhdritem=new PackItem(blkhdr,0,4);
blkhdritem.child=dataitem;
blkhdritem.setDescription();
addItemToPack(blkhdritem);
updateInventory();
var idx=packs[currentPackIndex].items.indexOf(blkhdritem);
if(idx!==-1&&typeof selectItem==='function')selectItem(currentPackIndex,idx);


}else if(isBlockFile){
var type=filedata[5]-0x80;
var ln=(filedata[3]<<8)+filedata[4];
if(filedata.length<6+ln){
alert("The file "+name+" seems to be truncated!");
return false;
}
var hdritem=createFileHeader(name,type,0);
var blkhdr=new Uint8Array(4);
blkhdr[0]=2;blkhdr[1]=0x80;blkhdr[2]=filedata[3];blkhdr[3]=filedata[4];
var dataitem=new PackItem(filedata,6,ln);
var blkhdritem=new PackItem(blkhdr,0,4);
blkhdritem.child=dataitem;
blkhdritem.setDescription();
hdritem.child=blkhdritem;
addItemToPack(hdritem);
updateInventory();
var idx=packs[currentPackIndex].items.indexOf(hdritem);
if(idx!==-1&&typeof selectItem==='function')selectItem(currentPackIndex,idx);
return true;
}else {

if(filedata[5]==0xFF){
var ln=(filedata[3]<<8)+filedata[4];
if(filedata.length<6+ln||ln<0x1d){
alert("The file "+name+" seems to be truncated!");
return false;
}
if(filedata[0x1b]!=0x02||filedata[0x1c]!=0x80){
alert("The file "+name+" does not seem to have\na standard headerless block format!");
return false;
}
var ln2=(filedata[0x1d]<<8)+filedata[0x1e];
if(filedata.length<0x1f+ln2){
alert("The file "+name+" seems to be truncated!");
return false;
}
var blkhdr=new Uint8Array(4);
blkhdr[0]=2;blkhdr[1]=0x80;blkhdr[2]=filedata[0x1d];blkhdr[3]=filedata[0x1e];
var dataitem=new PackItem(filedata,0x1f,ln2);
var blkhdritem=new PackItem(blkhdr,0,4);
blkhdritem.child=dataitem;
blkhdritem.setDescription();
addItemToPack(blkhdritem);
updateInventory();
var idx=packs[currentPackIndex].items.indexOf(blkhdritem);
if(idx!==-1&&typeof selectItem==='function')selectItem(currentPackIndex,idx);
}else {
return false;
}
}

var pack=packs[currentPackIndex];




var itemIdx=pack.items.indexOf(blkhdritem);
if(pack&&itemIdx>0){
var isBootable=(pack.items[0].data[0]&0x10)===0;
var bootAddr=getItemAddres(pack,itemIdx);


if(bootAddr<=0xFFFF){

var onMakeBoot=function (targetIdx){
if(targetIdx!==undefined&&targetIdx!==itemIdx){

pack.items.splice(itemIdx,1);
pack.items.splice(targetIdx,0,blkhdritem);
itemIdx=targetIdx;

bootAddr=getItemAddres(pack,itemIdx);
}
var targetBootAddr=bootAddr+4;

var hdata=pack.items[0].data;
hdata[2]=0;hdata[3]=filedata[9];hdata[4]=filedata[10];hdata[5]=filedata[11];
hdata[6]=(targetBootAddr>>8)&0xff;
hdata[7]=targetBootAddr&0xff;
hdata[0]&=0xEF;

var sum1=hdata[0]+hdata[2]+hdata[4]+hdata[6];
var sum2=hdata[1]+hdata[3]+hdata[5]+hdata[7];
sum1+=(sum2>>8);
hdata[9]=sum2&0xff;
if((hdata[0]&0x40)==0){
hdata[8]&=0x80;
hdata[8]+=sum1&0x7f;
}else {
hdata[8]=sum1&0xff;
}

pack.unsaved=true;
updateInventory();

if(typeof selectItem==='function'){
setTimeout(function (){selectItem(currentPackIndex,itemIdx);},50);
}
};

if(!isBootable){

var mainIdx=0;
for(var i=1;i<pack.items.length;i++){
if(pack.items[i].name==="MAIN"||
(pack.items[i].child&&pack.items[i].child.name==="MAIN")){
mainIdx=i;
break;
}
}
var headIdx=mainIdx>0?mainIdx+1:1;


var content=document.createElement('div');
content.style.textAlign='center';
content.innerHTML="<div style='margin-bottom:10px;'>There is no existing bootable record in this pack.</div>" +
"<div style='font-weight:bold;'>Do you want to place this record at the head of the pack (under MAIN) and set it as the bootable address?</div>";

new ModalDialog(content,function (){onMakeBoot(headIdx);},null,"Yes","No").start();
}else {

var targetBootAddr=bootAddr+4;
var content=document.createElement('div');
content.style.textAlign='center';
content.innerHTML="<div>Do you want this to be used as boot code?</div>" +
"<div style='font-weight:bold; margin:10px 0;'>Boot Address: 0x"+targetBootAddr.toString(16).toUpperCase().padStart(4,'0')+"</div>";

new ModalDialog(content,function (){onMakeBoot(itemIdx);},null,"Yes","No").start();
}
}
}
}else if(name.substr(-4).toUpperCase()==".OPL"){
var hdritem=createFileHeader(name,3,0);
var itemdataList=[];


addItemToPack(hdritem);



function createOPLRecord(dataList){
if(dataList.length===0)return;

var srclen=dataList.length;

var totalPayloadLen=srclen+2;





var itemdata=new Uint8Array(totalPayloadLen+4);
itemdata[0]=0;itemdata[1]=0;


itemdata[2]=(srclen>>8)&0xff;
itemdata[3]=srclen&0xff;

itemdata.set (dataList,4);


itemdata[4+srclen]=0;
itemdata[5+srclen]=0;

var dataitem=new PackItem(itemdata,0,itemdata.length);


var blkhdr=new Uint8Array(4);
var totalLen=itemdata.length;
blkhdr[0]=2;blkhdr[1]=0x80;
blkhdr[2]=(totalLen>>8)&0xff;
blkhdr[3]=totalLen&0xff;

var blkhdritem=new PackItem(blkhdr,0,4);
blkhdritem.child=dataitem;
blkhdritem.setDescription();


if(!hdritem.child){
hdritem.child=blkhdritem;
}
}

var fileLen=filedata.length;

for(var i=0;i<fileLen;i++){
var c=(typeof filedata==='string')?filedata.charCodeAt(i):filedata[i];

if(c===13||c===10){

if(i+1<fileLen){
var nextC=(typeof filedata==='string')?filedata.charCodeAt(i+1):filedata[i+1];
if((c===13&&nextC===10)||(c===10&&nextC===13)){
i++;
}
}

itemdataList.push(0);

}else {

itemdataList.push(c);
}
}


createOPLRecord(itemdataList);

updateInventory();

var idx=packs[currentPackIndex].items.indexOf(hdritem);
if(idx!==-1&&typeof selectItem==='function')selectItem(currentPackIndex,idx);
}else if(name.substr(-4).toUpperCase()==".ODB"){
var id=getFreeFileId();
if(id<=0)return;
var hdritem=createFileHeader(name,1,id+0x8f);
addItemToPack(hdritem);
var itemdataList=[];

itemdataList.push(0);itemdataList.push(id+0x8f);


var lineLen=0;
var fileLen=filedata.length;
var hasTab=false;

for(var i=0;i<fileLen;i++){
var c=(typeof filedata==='string')?filedata.charCodeAt(i):filedata[i];

if(c===9)hasTab=true;

if(c===13||c===10){

if(i+1<fileLen){
var nextC=(typeof filedata==='string')?filedata.charCodeAt(i+1):filedata[i+1];
if((c===13&&nextC===10)||(c===10&&nextC===13)){
i++;
}
}


if(hasTab){
itemdataList[0]=lineLen;
var itemdata=new Uint8Array(itemdataList);
var recitem=new PackItem(itemdata,0,itemdata.length);
recitem.setDescription();
addItemToPack(recitem);
}


itemdataList=[];
itemdataList.push(0);itemdataList.push(id+0x8f);
lineLen=0;
hasTab=false;

}else {


if(lineLen<255){
itemdataList.push(c);
lineLen++;
}

}
}


if(hasTab){
itemdataList[0]=lineLen;
var itemdata=new Uint8Array(itemdataList);
var recitem=new PackItem(itemdata,0,itemdata.length);
recitem.setDescription();
addItemToPack(recitem);
}

updateInventory();
var idx=packs[currentPackIndex].items.indexOf(hdritem);
if(idx!==-1&&typeof selectItem==='function')selectItem(currentPackIndex,idx);
}else if(name.substr(-4).toUpperCase()==".NTS"){
var hdritem=createFileHeader(name,7,0);
var ln=filedata.length+6;
var blkhdr=new Uint8Array(4);
blkhdr[0]=2;blkhdr[1]=0x80;blkhdr[2]=(ln>>8)&0xff;blkhdr[3]=ln&0xff;
var itemdata=new Uint8Array(6+filedata.length);
itemdata[0]=0;itemdata[1]=2;itemdata[2]=8;itemdata[3]=0;
itemdata[4]=(filedata.length>>8)&0xff;itemdata[5]=filedata.length&0xff;
for(var i=0;i<filedata.length;i++){
var c=(typeof filedata==='string')?filedata.charCodeAt(i):filedata[i];
itemdata[6+i]=c==10?0:c;
}
var dataitem=new PackItem(itemdata,0,itemdata.length);
var blkhdritem=new PackItem(blkhdr,0,4);
blkhdritem.child=dataitem;
blkhdritem.setDescription();
hdritem.child=blkhdritem;
addItemToPack(hdritem);
updateInventory();
var idx=packs[currentPackIndex].items.indexOf(hdritem);
if(idx!==-1&&typeof selectItem==='function')selectItem(currentPackIndex,idx);
}else if(name.match(/\.OB([0-9A-F])$/i)){

var match=name.match(/\.OB([0-9A-F])$/i);
var typeExt=parseInt(match[1],16);










var rawBytes;
if(typeof filedata==='string'){
rawBytes=new Uint8Array(filedata.length);
for(var i=0;i<filedata.length;i++)rawBytes[i]=filedata.charCodeAt(i);
}else {
rawBytes=filedata;
}

var ln=(rawBytes[3]<<8)|rawBytes[4];
if(rawBytes.length<6+ln){
alert("The file "+name+" seems to be truncated!");
return false;
}





var hdritem=createFileHeader(name,typeExt,0);
var blkhdr=new Uint8Array(4);
blkhdr[0]=2;blkhdr[1]=0x80;blkhdr[2]=rawBytes[3];blkhdr[3]=rawBytes[4];

var dataitem=new PackItem(rawBytes,6,ln);
var blkhdritem=new PackItem(blkhdr,0,4);
blkhdritem.child=dataitem;
blkhdritem.setDescription();
hdritem.child=blkhdritem;
addItemToPack(hdritem);
updateInventory();
var idx=packs[currentPackIndex].items.indexOf(hdritem);
if(idx!==-1&&typeof selectItem==='function')selectItem(currentPackIndex,idx);
}else if(name.substr(-4).toUpperCase()==".BIN"){
var ln=filedata.length;


var rawBytes;
if(typeof filedata==='string'){
rawBytes=new Uint8Array(ln);
for(var i=0;i<ln;i++)rawBytes[i]=filedata.charCodeAt(i);
}else {
rawBytes=filedata;
}

var hasORG=rawBytes.length>=6&&rawBytes[0]===79&&rawBytes[1]===82&&rawBytes[2]===71;
var dataitem;
var blkhdritem;

var pack=packs[currentPackIndex];
var packHasBoot=false;
if(pack&&pack.items.length>0&&pack.items[0].data.length>=10){
var currBoot=(pack.items[0].data[6]<<8)|pack.items[0].data[7];
if(currBoot!==0xFFFF&&currBoot!==0x0000){
packHasBoot=true;
}
}

if(hasORG){
var tempPack=new PackImage(rawBytes);
var bootItem=null;

if(tempPack.items.length>0&&tempPack.items[0].data.length>=10){
var impBootAddr=(tempPack.items[0].data[6]<<8)|tempPack.items[0].data[7];
if(impBootAddr!==0xFFFF&&impBootAddr!==0x0000){
var tempOffset=0;
for(var i=0;i<tempPack.items.length;i++){
if(tempOffset<=impBootAddr&&tempOffset+tempPack.items[i].getLength()>impBootAddr){
bootItem=tempPack.items[i];
break;
}
tempOffset+=tempPack.items[i].getLength();
}
}
}

if(!bootItem){

for(var i=1;i<tempPack.items.length;i++){

if(tempPack.items[i].type===0||(tempPack.items[i].data&&tempPack.items[i].data[1]===0x80)){
bootItem=tempPack.items[i];
break;
}
}
}

if(!bootItem){
alert("The imported Boot File does not contain any valid records.");
return false;
}

if(packHasBoot){
if(!confirm("This pack already has a boot record. The boot header from the imported file will be removed and the file will be imported as a standard long record. Continue?")){
return false;
}
}

var extractedBytes=bootItem.getFullData();
var payloadLen=extractedBytes.length-4;
var blkhdr=new Uint8Array([extractedBytes[0],extractedBytes[1],extractedBytes[2],extractedBytes[3]]);

blkhdritem=new PackItem(blkhdr,0,4);
dataitem=new PackItem(extractedBytes,4,payloadLen);
}else if(rawBytes.length>=4&&rawBytes[0]===2&&rawBytes[1]===0x80){

var payloadLen=rawBytes.length-4;
var blkhdr=new Uint8Array([rawBytes[0],rawBytes[1],rawBytes[2],rawBytes[3]]);

blkhdritem=new PackItem(blkhdr,0,4);
dataitem=new PackItem(rawBytes,4,payloadLen);
}else {

var blkhdr=new Uint8Array(4);
blkhdr[0]=2;
blkhdr[1]=0x80;
blkhdr[2]=(ln>>8)&0xFF;
blkhdr[3]=ln&0xFF;

blkhdritem=new PackItem(blkhdr,0,4);
dataitem=new PackItem(rawBytes,0,ln);
}

blkhdritem.child=dataitem;
blkhdritem.setDescription();

addItemToPack(blkhdritem);
updateInventory();
var idx=packs[currentPackIndex].items.indexOf(blkhdritem);
if(idx!==-1&&typeof selectItem==='function')selectItem(currentPackIndex,idx);

var itemIdx=pack.items.indexOf(blkhdritem);

if(pack&&itemIdx>0){
var bootAddr=getItemAddres(pack,itemIdx);

if(bootAddr<=0xFFFF){
var targetBootAddr=bootAddr+4;

var onYes=function (){
var hdata=pack.items[0].data;
hdata[6]=(targetBootAddr>>8)&0xff;
hdata[7]=targetBootAddr&0xff;

hdata[0]&=0xEF;
var sum1=hdata[0]+hdata[2]+hdata[4]+hdata[6];
var sum2=hdata[1]+hdata[3]+hdata[5]+hdata[7];
sum1+=(sum2>>8);
hdata[9]=sum2&0xff;
if((hdata[0]&0x40)==0){
hdata[8]&=0x80;
hdata[8]+=sum1&0x7f;
}else {
hdata[8]=sum1&0xff;
}

pack.unsaved=true;
updateInventory();
};

if(hasORG&&!packHasBoot){
onYes();
}else if(!hasORG){
var content=document.createElement('div');
content.style.textAlign='center';
content.innerHTML="<div>Do you want this to be used as boot code?</div>" +
"<div style='font-weight:bold; margin:10px 0;'>Boot Address: 0x"+targetBootAddr.toString(16).toUpperCase().padStart(4,'0')+"</div>";

new ModalDialog(content,onYes,null,"Yes","No").start();
}
}
}

}else {
alert("File format not recognised!");
return false;
}
return true;
}

function createFileHeader(name,type,id){
name=name.replace(/\.((ODB)|(OPL)|(NTS)|(OB[2-9A-F]))$/i,"");
name=name.replace(/_$/i,"%");
name=name.replace(/[^a-z0-9\$\%]/i,"");
name=(name+"        ").substr(0,8);
var hdr=new Uint8Array(11);
hdr[0]=9;
hdr[1]=type+0x80;
hdr[10]=id;
for(var i=0;i<8;i++){
hdr[2+i]=name.charCodeAt(i);
}
var item=new PackItem(hdr,0,11);
item.setDescription();
return item;
}

function addItemToPack(item){
var pack=packs[currentPackIndex];
if(!pack)return;

var items=pack.items;
var items=pack.items;

var insertIndex=-1;
for(var i=0;i<items.length;i++){
if(items[i].type===255){
insertIndex=i;
break;
}
}
if(insertIndex===-1)insertIndex=items.length;


if(item.type>=16){
var fileId=item.type-0x0F;

var dfIndex=-1;
for(var i=0;i<items.length;i++){
if(items[i].type==1&&items[i].data[10]==(fileId+0x8F)){
dfIndex=i;
break;
}
}

if(dfIndex>=0){
insertIndex=dfIndex+1;

while(insertIndex<items.length-1&&items[insertIndex].type==item.type){
insertIndex++;
}
}
}


if((pack.items[0].data[0]&0x10)==0){
var insertOffset=0;
for(var i=0;i<insertIndex;i++){
insertOffset+=items[i].getLength();
}

var bootAddr=(pack.items[0].data[6]<<8)+pack.items[0].data[7];
if(insertOffset<=bootAddr){
var newBootAddr=bootAddr+item.getLength();
pack.items[0].data[6]=(newBootAddr>>8)&0xff;
pack.items[0].data[7]=newBootAddr&0xff;
}
}

items.splice(insertIndex,0,item);
pack.unsaved=true;
}

function setStatus(msg){
if(statusmessageelement){
statusmessageelement.innerText=msg;

setTimeout(function (){
if(statusmessageelement.innerText==msg){
statusmessageelement.innerText="";
}
},3000);
}
}


function parseIntelHexToBinary(hexString){
var lines=hexString.split('\n');
var binary=new Uint8Array(0);
var currentAddr=0;

for(var i=0;i<lines.length;i++){
var line=lines[i].trim();
if(line.length==0||line[0]!=':')continue;

var byteCount=parseInt(line.substr(1,2),16);
var addr=parseInt(line.substr(3,4),16);
var recordType=parseInt(line.substr(7,2),16);

if(recordType==0){
var data=new Uint8Array(byteCount);
for(var j=0;j<byteCount;j++){
data[j]=parseInt(line.substr(9+j*2,2),16);
}


var newBinary=new Uint8Array(binary.length+data.length);
newBinary.set (binary);
newBinary.set (data,binary.length);
binary=newBinary;
}else if(recordType==1){
break;
}
}
return binary;
}


var sidebar=document.getElementById('sidebar');
var resizer=document.getElementById('sidebar-resizer');
var isResizing=false;

resizer.addEventListener('mousedown',function (e){
isResizing=true;
document.body.style.cursor='col-resize';
e.preventDefault();
});

document.addEventListener('mousemove',function (e){
if(!isResizing)return;
var newWidth=e.clientX;
if(newWidth<170)newWidth=170;
if(newWidth>600)newWidth=600;
sidebar.style.width=newWidth+'px';
});

document.addEventListener('mouseup',function (e){
if(isResizing){
isResizing=false;
document.body.style.cursor='default';
}
});





sidebar.addEventListener('dragover',function (e){

var isFile=false;
if(e.dataTransfer.types){
for(var i=0;i<e.dataTransfer.types.length;i++){
if(e.dataTransfer.types[i]==="Files"){
isFile=true;
break;
}
}
}

if(isFile){
e.preventDefault();
e.stopPropagation();
e.dataTransfer.dropEffect='copy';
sidebar.classList.add('drag-over');
}
},true);

sidebar.addEventListener('dragleave',function (e){


sidebar.classList.remove('drag-over');
},true);

sidebar.addEventListener('drop',function (e){
var isFile=false;
if(e.dataTransfer.types){
for(var i=0;i<e.dataTransfer.types.length;i++){
if(e.dataTransfer.types[i]==="Files"){
isFile=true;
break;
}
}
}

if(isFile&&e.dataTransfer.files&&e.dataTransfer.files.length>0){
e.preventDefault();
e.stopPropagation();
sidebar.classList.remove('drag-over');

var files=e.dataTransfer.files;

var fname=files[0].name.toUpperCase();
var isItem=fname.match(/\.OB[0-9A-F]$/)||fname.endsWith(".OPL")||fname.endsWith(".ODB")||fname.endsWith(".NTS")||fname.endsWith(".BIN");

if(isItem){
if(packs.length===0){
createNew();
}

if(currentPackIndex<0&&packs.length>0)currentPackIndex=0;

importFilesToPack(currentPackIndex,files);
}else {

loadPackFromFiles(files);
}
}
},true);






function setupKeyboardShortcuts(){
document.addEventListener('keydown',function (e){

var activeDropdown=null;
registeredMenus.forEach(function (m){
if(m.menu.classList.contains('show'))activeDropdown=m.menu;
});


var isCtrl=e.ctrlKey||e.metaKey;

if(isCtrl){
if(e.key==='n'||e.key==='N'){
e.preventDefault();

var btn=document.getElementById('btn-file-menu');
if(btn)btn.click();
}else if(e.key==='o'||e.key==='O'){
e.preventDefault();

var link=document.getElementById('menu-open-pack');
if(link)link.click();
}else if(e.key==='s'||e.key==='S'){
e.preventDefault();

packSaved();
}
}else {

if(OptionsManager.getOption('enableFunctionKeys')){
if(e.key==='F1'){
e.preventDefault();
if(typeof DialogManager!=='undefined'&&DialogManager.showAboutDialog)DialogManager.showAboutDialog();
}else if(e.key==='F2'){
e.preventDefault();
createNew();
}else if(e.key==='F3'){
e.preventDefault();
if(fileInputPack)fileInputPack.click();
}else if(e.key==='F4'){
e.preventDefault();
packSaved();
}else if(e.key==='F5'){
e.preventDefault();
var btn=document.getElementById('btn-file-menu');
if(btn)btn.click();
}else if(e.key==='F6'){
e.preventDefault();
if(typeof eraseItem==='function')eraseItem();
}else if(e.key==='F7'){
e.preventDefault();
if(fileInputItem)fileInputItem.click();
}else if(e.key==='F8'){
e.preventDefault();
exportHex();
}else if(e.key==='F9'){
e.preventDefault();
applyEdits();
}else if(e.key==='F10'){
e.preventDefault();
discardEdits();
}else if(e.key==='F11'){
e.preventDefault();
if(typeof DialogManager!=='undefined'&&DialogManager.showOptionsDialog)DialogManager.showOptionsDialog();
}else if(e.key==='F12'){
e.preventDefault();
if(typeof DialogManager!=='undefined'&&DialogManager.showKeyMapDialog)DialogManager.showKeyMapDialog();
}
}


if(activeDropdown){
if(e.key==='Escape'){
e.preventDefault();
closeAllMenus();
return;
}else if(e.key==='ArrowDown'||e.key==='ArrowUp'){
e.preventDefault();
navigateMenu(activeDropdown,e.key==='ArrowDown'?1:-1);
return;
}else if(e.key==='Enter'){


if(document.activeElement&&activeDropdown.contains(document.activeElement)){

return;
}
}
}
}
});
}

function navigateMenu(dropdown,direction){

var links=Array.from (dropdown.querySelectorAll('a')).filter(function (el){
return!el.classList.contains('disabled')&&el.offsetParent!==null;
});

if(links.length===0)return;

var index=links.indexOf(document.activeElement);

if(index===-1){

links[0].focus();
}else {
var newIndex=index+direction;

if(newIndex>=0&&newIndex<links.length){
links[newIndex].focus();
}
}
}


setupKeyboardShortcuts();
init();
document.title="Psion OPK Editor v"+APP_VERSION;

function initChildMode(feature){
document.body.classList.add('child-window');


var app=document.getElementById('app');
if(app)app.style.display='none';

if(feature==='visualizer'){
document.title="Code Visualizer";

if(CodeVisualizer&&CodeVisualizer.initChildEnvironment){
CodeVisualizer.initChildEnvironment();
}




if(window.opener){
window.opener.postMessage({type:'VISUALIZER_READY'},'*');


try{
if(window.opener.CodeVisualizer&&window.opener.CodeVisualizer.childWindowReady){
window.opener.CodeVisualizer.childWindowReady(window);
}
}catch(e){}
}
}else if(feature==='command_ref'){
if(typeof OPLCommandReference!=='undefined'){
new OPLCommandReference().render(window);
}
}else if(feature==='opl_content'){
if(typeof OPLContentViewer!=='undefined'){
OPLContentViewer.childWindowReady(window);
}
}else if(feature==='udg'){
document.title="Graphic Character Editor";







}

}



async function importFilesToPack(packIndex,files){

var bldFile=null;
var zipFile=null;
var fileList=[];

for(var i=0;i<files.length;i++){
var fn=files[i].name.toLowerCase();
if(fn.endsWith(".bld"))bldFile=files[i];
if(fn.endsWith(".zip"))zipFile=files[i];
fileList.push(files[i]);
}


if(zipFile){
handleZIPImport(zipFile);
return;
}


if(bldFile){
handleBLDImport(bldFile,fileList);
return;
}


var pack=packs[packIndex];
if(!pack)return;

var originalPackIndex=currentPackIndex;
currentPackIndex=packIndex;

for(var i=0;i<files.length;i++){
var fn=files[i].name;
var success=false;
try{
if(fn.match(/\.((ODB)|(OPL)|(NTS))$/i)){
if(typeof LoadLocalTextFileAsync==='function'){
var result=await LoadLocalTextFileAsync(files[i]);
success=createItemFromFileData(result.data,result.name);
}else {
alert("Loader error: Async helper missing.");
break;
}
}else {
if(typeof LoadLocalBinaryFileAsync==='function'){
var result=await LoadLocalBinaryFileAsync(files[i]);
success=createItemFromFileData(result.data,result.name);
}else {
alert("Loader error: Async helper missing.");
break;
}
}
}catch(e){
alert("Error importing file "+fn+": "+e);
success=false;
}

if(!success)break;
}

updateInventory();
}

function confirmDialog(message,note){
return new Promise(function (resolve){
var element=document.createElement('div');
element.style.padding='10px';
element.innerHTML="<h3>Confirm Import</h3>" +
"<p>"+message+"</p>" +
(note?"<p style='font-size: 11px; opacity: 0.7; border-top: 1px solid var(--border-color); padding-top: 5px;'><i class='fas fa-info-circle'></i> "+note+"</p>":"");

var dialog=new ModalDialog(element,function (){resolve(true);},function (){resolve(false);},"Yes","No");
dialog.start();
});
}

async function handleBLDImport(bldFile,otherFiles){
var result=await LoadLocalTextFileAsync(bldFile);
var content=result.data;
var lines=content.split(/\r?\n/);
if(lines.length===0)return;


var headerLine=lines[0].trim();
if(!headerLine){
alert("Invalid .BLD file: Header line missing.");
return;
}

var parts=headerLine.split(/[\s,]+/);
var packName=parts[0]||"ImportedPack";
var sizeKB=parseInt(parts[1])||64;


var newPackIndex=createAndSelectPack(packName,sizeKB);
var pack=packs[newPackIndex];


var hdata=pack.items[0].data;
if(headerLine.toUpperCase().indexOf("NOCOPY")!==-1)hdata[0]|=0x08;
if(headerLine.toUpperCase().indexOf("NOWRITE")!==-1)hdata[0]|=0x10;


var importedCount=0;
for(var i=1;i<lines.length;i++){
var line=lines[i].trim();
if(!line||line.startsWith("!"))continue;

var itemParts=line.split(/\s+/);
var itemName=itemParts[0];
var itemExt=(itemParts[1]||"BIN").toUpperCase();


if(itemName.toUpperCase()==="MAIN"){
var confirmed=await confirmDialog("A 'MAIN' entry was identified in the import. Do you wish to import it?","Note: A new Data Pack contains a default 'MAIN' entry by default.");
if(!confirmed)continue;
}


var match=null;
var matchName=(itemName+"."+itemExt).toLowerCase();

for(var j=0;j<otherFiles.length;j++){
var fn=otherFiles[j].name.toLowerCase();
if(fn===matchName||fn===itemName.toLowerCase()+"."+itemExt.toLowerCase()){
match=otherFiles[j];
break;
}
}

if(match){
var data;
if(match.content){
data=match.content;
}else {
var res=await LoadLocalBinaryFileAsync(match);
data=res.data;
}

if(createItemFromFileData(data,match.name)){
importedCount++;
}
}
}

updateInventory();
alert("Import complete. Created new "+sizeKB+"KB Pack '"+packName+"' with "+importedCount+" items.");
}

async function handleZIPImport(zipFile){
try{
setStatus("Unzipping "+zipFile.name+"...");
var extractedFiles=await ZipUtils.readZip(zipFile);
if(extractedFiles.length===0){
alert("ZIP file is empty or invalid.");
return;
}


var bldFile=null;
for(var i=0;i<extractedFiles.length;i++){
if(extractedFiles[i].name.toLowerCase().endsWith(".bld")){
bldFile=extractedFiles[i];

bldFile.data=new TextDecoder().decode(bldFile.content);
break;
}
}

if(bldFile){


var originalLoader=LoadLocalTextFileAsync;
window.LoadLocalTextFileAsync=async function (){return bldFile;};
await handleBLDImport(bldFile,extractedFiles);
window.LoadLocalTextFileAsync=originalLoader;
}else {

var packName=zipFile.name.replace(/\.[^/.]+$/,"");
var newPackIndex=createAndSelectPack(packName,64);

var importedCount=0;
for(var i=0;i<extractedFiles.length;i++){
var file=extractedFiles[i];
var baseName=file.name.replace(/\.[^/.]+$/,"").toUpperCase();


if(baseName==="MAIN"){
var confirmed=await confirmDialog("A 'MAIN' entry was identified in the ZIP. Do you wish to import it?","Note: A new Data Pack contains a default 'MAIN' entry by default.");
if(!confirmed)continue;
}

if(createItemFromFileData(file.content,file.name)){
importedCount++;
}
}
updateInventory();
alert("Import complete. Created new 64KB Pack '"+packName+"' from ZIP contents ("+importedCount+" items).");
}
}catch(e){
alert("Error importing ZIP: "+e.message);
}finally{
setStatus("Ready");
}
}

function createAndSelectPack(name,sizeKB){
var sizeCode=Math.ceil(sizeKB/8);
if(sizeCode<1)sizeCode=1;
if(sizeCode>128)sizeCode=128;

var newPack=new PackImage(null,sizeCode);
newPack.filename=name.toLowerCase().endsWith(".opk")?name:name+".opk";

packs.push(newPack);
currentPack=newPack;
currentPackIndex=packs.length-1;


OptionsManager.setOption('lastPackSize',sizeCode);

updateInventory();
return currentPackIndex;
}

function LoadLocalBinaryFileAsync(file){
return new Promise((resolve,reject)=>{
var reader=new FileReader();
reader.onload=function (e){
var data=new Uint8Array(e.target.result);
resolve({name:file.name,data:data});
};
reader.onerror=function (e){
reject(e);
};
reader.readAsArrayBuffer(file);
});
}

function LoadLocalTextFileAsync(file){
return new Promise((resolve,reject)=>{
var reader=new FileReader();
reader.onload=function (e){
resolve({name:file.name,data:e.target.result});
};
reader.onerror=function (e){
reject(e);
};
reader.readAsText(file);
});
}


function openPackFromURL(){
var element=document.createElement('div');
element.style.padding='10px';
element.innerHTML="<h3>Open from URL</h3>" +
"<p>Enter the direct link to a <b>.opk</b> or <b>.hex</b> file:</p>" +
"<input type='text' id='import-url' placeholder='https://example.com/pack.opk' style='width: 100%; padding: 8px; background: var(--input-bg); color: var(--text-color); border: 1px solid var(--border-color); margin-bottom: 10px;'>" +
"<div style='margin: 10px 0;'>" +
"<label style='display: flex; align-items: center; cursor: pointer;'>" +
"<input type='checkbox' id='use-proxy' checked style='margin-right: 8px;'> Use CORS Proxy (Recommended for external links)" +
"</label>" +
"</div>" +
"<p style='font-size: 11px; opacity: 0.7;'><i class='fas fa-info-circle'></i> Use the proxy if you encounter a 'CORS restriction' error. This routes the request through <i>allorigins.win</i> to bypass security blocks.</p>";

var dialog=new ModalDialog(element,async function (){
var url=element.querySelector('#import-url').value.trim();
var useProxy=element.querySelector('#use-proxy').checked;
if(!url)return;

var finalUrl=url;
if(useProxy){

finalUrl="https://api.allorigins.win/raw?url="+encodeURIComponent(url);
}

setStatus("Fetching "+(useProxy?"via proxy... ":"")+url);
console.log("Fetching from:",finalUrl);

try{
const response=await fetch(finalUrl);
if(!response.ok)throw new Error("Server returned "+response.status+": "+response.statusText);

const buffer=await response.arrayBuffer();
const data=new Uint8Array(buffer);


var filename=url.split('/').pop().split('?')[0]||"downloaded.opk";


var isHex=filename.toLowerCase().endsWith(".hex")||filename.toLowerCase().endsWith(".ihx");
var finalData;

if(isHex){
var text=new TextDecoder().decode(data);
finalData=parseIntelHexToBinary(text);
}else {

if(data.length>=3&&data[0]===0x4F&&data[1]===0x50&&data[2]===0x4B){
finalData=data;
}else {

finalData=new Uint8Array(data.length+6);
finalData.set ([0x4F,0x50,0x4B,(data.length>>16)&0xFF,(data.length>>8)&0xFF,data.length&0xFF]);
finalData.set (data,6);
}
}

var newPack=new PackImage(finalData);
newPack.filename=filename.replace(/\.[^/.]+$/,"")+".opk";

packs.push(newPack);
currentPackIndex=packs.length-1;
selectedPackIndex=packs.length-1;

updateInventory();
setStatus("Imported "+filename);
saveSession();

}catch(e){
alert("Failed to import from URL:\n"+e.message+"\n\nReason: Likely a CORS restriction or network error.");
setStatus("Import failed.");
}
},null,"Open","Cancel");

dialog.start();
setTimeout(()=>element.querySelector('#import-url').focus(),100);
}

function openBootableWizard(){
if(typeof packs==='undefined'||packs.length===0){
createNewPackImmediately(1);
}

var activePack=packs[currentPackIndex];

var wizard=new BootableWizard(activePack,function (){
updateInventory();
});
wizard.show();
}

function createNewPackImmediately(sizeCode){
var newPack=new PackImage(null,sizeCode);
newPack.filename="Pack"+(packs.length+1)+".opk";
packs.push(newPack);
currentPack=newPack;
currentPackIndex=packs.length-1;
updateInventory();
setStatus("New 8KB pack created automatically");
}