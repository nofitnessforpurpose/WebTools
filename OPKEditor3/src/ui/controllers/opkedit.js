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
}




if(document.getElementById('menu-open-pack')){
document.getElementById('menu-open-pack').addEventListener('click',function (e){
e.preventDefault();
if(fileInputPack)fileInputPack.click();
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
if(itemSelected)exportItemEl.classList.remove('disabled');
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

function exportCurrentItem(){
var pack=packs[currentPackIndex];
if(!pack||!currentItem)return;

var filename="item.bin";
if(currentItem.name){
filename=currentItem.name.trim();
}


var type=currentItem.type;
if(type===1)filename+=".odb";
else if(type>=2&&type<=15){
filename+=".OB"+type.toString(16).toUpperCase();
}else if(type>=16)filename+=".odb";
else if(!filename.match(/\.[a-z0-9]{3}$/i))filename+=".bin";

var userFilename=prompt("Save item as:",filename);
if(userFilename){
var url=pack.getItemURL(currentItem);
if(url){
downloadFileFromUrl(userFilename,url);
}else {
alert("Cannot export this item type (id: "+type+"). Only standard files (OPL, ODB, Notepad, etc) are supported.");
}
}
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
toolbarButtons.btnExportItem.setActive(!!currentItem&&!isDirty);
toolbarButtons.btnNewProc.setActive(hasPack&&!isDirty);
toolbarButtons.btnNewNotepad.setActive(hasPack&&!isDirty);
toolbarButtons.btnNewData.setActive(hasPack&&!isDirty);
toolbarButtons.btnDelete.setActive(canDelete);
toolbarButtons.btnApply.setActive(isDirty);
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
var pack=packs[packIndex];
if(!pack)return false;
var isok=itemIndex>=0&&itemIndex<pack.items.length;
if(!isok)return false;

var item=pack.items[itemIndex];


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
var it=pack.items[k];





selectedItems.push(it);
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







lastFocusedItemIndex=itemIndex;

if(currentItem==pack.items[itemIndex]){


if(typeof PackContents!=='undefined'&&PackContents.selectItem){
PackContents.selectItem(packIndex,itemIndex);
}
return true;
}

if(!closeEditor())return false;

currentPackIndex=packIndex;
selectedPackIndex=-1;
currentItem=pack.items[itemIndex];
var tp=currentItem.type;

var i=0;
var selectedEditor=null;


if(tp===0){



if(currentItem.data.length>=2&&currentItem.data[0]+2===currentItem.data.length){


var recType=currentItem.data[1]&0x7f;
if(recType>=16&&recType<=126){

var recordEditor=editors.find(function (e){return e instanceof RecordEditor;});
if(recordEditor){
selectedEditor=recordEditor;
}
}else {

var hexEditor=editors.find(function (e){return e instanceof HexEditor;});
if(hexEditor){
selectedEditor=hexEditor;
}
}
}else {

var hexEditor=editors.find(function (e){return e instanceof HexEditor;});
if(hexEditor){
selectedEditor=hexEditor;
}
}
}

if(!selectedEditor){
while(i<editors.length&&!editors[i].acceptsType(tp)){
i++;
}
if(i<editors.length){
selectedEditor=editors[i];
}
}

if(selectedEditor){
if(selectedEditor instanceof HexEditor){
if(!OptionsManager.getOption('enableHexView')){



selectedEditor=null;
}
}
}

if(selectedEditor){
currentEditor=selectedEditor;
legacyEditorElement.style.display='block';


var startAddr=0;
currentEditor.initialise(currentItem,startAddr);
}else {




}


if(typeof PackContents!=='undefined'&&PackContents.selectItem){
PackContents.selectItem(packIndex,itemIndex);
}else {
updateInventory();
}
updateItemButtons(false);
return true;
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


if(filedata[0]==79&&filedata[1]==82&&filedata[2]==71&&filedata[5]>=0x82&&filedata[5]<=0x8f){
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
}else if(filedata[0]==79&&filedata[1]==82&&filedata[2]==71&&filedata[5]==0xFF){
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

var pack=packs[currentPackIndex];




var itemIdx=pack.items.indexOf(blkhdritem);
if(pack&&itemIdx>0){
var bootAddr=getItemAddres(pack,itemIdx);


if(bootAddr<=0xFFFF){

var targetBootAddr=bootAddr+4;



var content=document.createElement('div');
content.style.textAlign='center';
content.innerHTML="<div>Do you want this to be used as boot code?</div>" +
"<div style='font-weight:bold; margin:10px 0;'>Boot Address: 0x"+targetBootAddr.toString(16).toUpperCase().padStart(4,'0')+"</div>";

var onYes=function (){
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
};



var makeBoot=false;
new ModalDialog(content,onYes,null,"Yes","No").start();


if(makeBoot){
var hdata=pack.items[0].data;
hdata[2]=0;hdata[3]=filedata[9];hdata[4]=filedata[10];hdata[5]=filedata[11];


































hdata[6]=(bootAddr>>8)&0xff;
hdata[7]=bootAddr&0xff;
















hdata[2]=0;
hdata[3]=filedata[9];
hdata[4]=filedata[10];
hdata[5]=filedata[11];

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




var blkhdr=new Uint8Array(4);
blkhdr[0]=2;
blkhdr[1]=0x80;
blkhdr[2]=(ln>>8)&0xFF;
blkhdr[3]=ln&0xFF;

var blkhdritem=new PackItem(blkhdr,0,4);
var dataitem=new PackItem(rawBytes,0,ln);

blkhdritem.child=dataitem;
blkhdritem.setDescription();

addItemToPack(blkhdritem);
updateInventory();
var idx=packs[currentPackIndex].items.indexOf(blkhdritem);
if(idx!==-1&&typeof selectItem==='function')selectItem(currentPackIndex,idx);


var pack=packs[currentPackIndex];



var itemIdx=pack.items.indexOf(blkhdritem);

if(pack&&itemIdx>0){

var bootAddr=getItemAddres(pack,itemIdx);


if(bootAddr<=0xFFFF){

var targetBootAddr=bootAddr+4;


var content=document.createElement('div');
content.style.textAlign='center';
content.innerHTML="<div>Do you want this to be used as boot code?</div>" +
"<div style='font-weight:bold; margin:10px 0;'>Boot Address: 0x"+targetBootAddr.toString(16).toUpperCase().padStart(4,'0')+"</div>";

var onYes=function (){
var hdata=pack.items[0].data;

hdata[6]=(targetBootAddr>>8)&0xff;
hdata[7]=targetBootAddr&0xff;


hdata[0]&=0xEF;


var sum1=hdata[0]+hdata[2]+hdata[4]+hdata[6];
var sum2=hdata[1]+hdata[3]+hdata[5]+hdata[7];
sum1+=(sum2>>8);


if((hdata[0]&0x40)==0){
hdata[8]&=0x80;
hdata[8]+=sum1&0x7f;
}else {
hdata[8]=sum1&0xff;
}
hdata[9]=sum2&0xff;

pack.unsaved=true;
updateInventory();
};


new ModalDialog(content,onYes,null,"Yes","No").start();
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

alert("Loader error: Sync fallback not supported for batch.");
break;
}
}else {

if(typeof LoadLocalBinaryFileAsync==='function'){
var result=await LoadLocalBinaryFileAsync(files[i]);
success=createItemFromFileData(result.data,result.name);
}else {
alert("Loader error: Sync fallback not supported for batch.");
break;
}
}
}catch(e){
alert("Error importing file "+fn+": "+e);
success=false;
}

if(!success){

break;
}
}



updateInventory();
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