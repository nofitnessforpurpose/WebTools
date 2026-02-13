'use strict';



function ProcedureFileEditor(editorelement,codeEditorContainer,callback){
BlockFileEditor.call(this,editorelement,callback,[2,3],codeEditorContainer);
}
ProcedureFileEditor.prototype=Object.create(BlockFileEditor.prototype);
ProcedureFileEditor.prototype.initialise=function (item){
var self=this;
var extraelement=null;

if(!this.myelement){

extraelement=document.createElement('div');
extraelement.innerHTML=
"<form action='#'><fieldset><legend>Procedure</legend>" +
"<div>Size of Object Code: <span id='objectcode'></span> bytes</div>" +
"<div>Note: Editing source code here will not change the object code</div>" +
"<div class='opl-editor-container' id='opl-legacy-container'>" +
"<textarea id='sourcecode' class='opl-source-input' rows=20 cols=60 spellcheck='false'></textarea>" +
"<div id='highlightedcode' class='opl-code-view' aria-hidden='true'></div>" +
"</div>" +
"</fieldset></form>";
}
BlockFileEditor.prototype.initialise.call(this,item,extraelement);


if(this.item.deleted){
var ta=document.getElementById('sourcecode');
if(ta)ta.disabled=true;
if(this.codeEditorInstance){


this.codeEditorInstance.setReadOnly(true);
}


var fn=document.getElementById('filename');
if(fn)fn.disabled=true;
}else {


if(this.codeEditorInstance){

this.codeEditorInstance.setReadOnly(false);
}
var ta=document.getElementById('sourcecode');
if(ta)ta.disabled=false;
var fn=document.getElementById('filename');
if(fn)fn.disabled=false;
}


this.createToobarButtons();


var chld=this.item.child.child;
var lncode=chld.data[0]*256+chld.data[1];
document.getElementById("objectcode").innerHTML=""+lncode;


var ckEl=document.getElementById("status-checksum");
if(ckEl)ckEl.style.display="none";

var lnsrc=chld.data[lncode+2]*256+chld.data[lncode+3];

setTimeout(function (){
var s="";
var hasSource=(lnsrc>0);


if(hasSource){
var limit=lnsrc;
if(limit>0&&chld.data[lncode+4 + limit-1]===0){
limit--;
}
for(var i=0;i<limit;i++){
var c=chld.data[lncode+4 + i];
if(c==0)s+="\n";
else s+=String.fromCharCode(c);
}
}


var decompiledResult=self.refreshDecompilerLog(hasSource);
if(!hasSource&&decompiledResult){
s=decompiledResult;
}

self.originalSource=s;
self.updateEditorContent(s);

self.updateToolbarButtons();
},10);

var s="REM Loading...";


if(this.codeEditorContainer){
var legacyContainer=document.getElementById('opl-legacy-container');
if(legacyContainer)legacyContainer.style.display='none';

this.codeEditorContainer.style.display='flex';

if(!this.codeEditorWrapper){
this.codeEditorWrapper=document.createElement('div');
this.codeEditorWrapper.style.flex='1';
this.codeEditorWrapper.style.display='flex';
this.codeEditorWrapper.style.overflow='hidden';
this.codeEditorContainer.appendChild(this.codeEditorWrapper);
}
this.codeEditorWrapper.style.display='flex';

var targetSplitMode=OptionsManager.getOption('stickyProcedureHeader')!==false;
if(this.codeEditorInstance&&this.codeEditorInstance.isSplitMode()!==targetSplitMode){
this.codeEditorInstance=null;
this.codeEditorWrapper.innerHTML='';
}

if(!this.codeEditorInstance){
this.codeEditorInstance=new CodeEditor(this.codeEditorWrapper,{
value:s,
language:'opl',
readOnly:false,
lineNumbers:OptionsManager.getOption('showLineNumbers'),
folding:OptionsManager.getOption('codeFolding'),
minimap:{enabled:false},
theme:ThemeManager.currentTheme,
targetSystem:OptionsManager.getOption('targetSystem'),
procedureMode:true,
onHeaderBlur:function (headerValue){
var match=headerValue.match(/^\s*([a-zA-Z][a-zA-Z0-9]{0,7}[%$]?)\s*:/i);
if(match&&match[1]){
var newName=match[1];
if(self.item.name!==newName){
self.item.name=newName;
self.item.text=newName;
var fnInput=document.getElementById('filename');
if(fnInput)fnInput.value=newName;
if(window.updateInventory)window.updateInventory();
}
}
}
});

this.codeEditorInstance.onChange=function (){
self.callback(EditorMessage.CHANGEMADE);
self.updateToolbarButtons();
};
}else {
this.codeEditorInstance.setValue(s);
this.codeEditorInstance.update();
this.codeEditorInstance.onChange=function (){
self.callback(EditorMessage.CHANGEMADE);
self.updateToolbarButtons();
};
}

initialiseForm("sourcecode",s,this);

}else {

if(this.codeEditorContainer)this.codeEditorContainer.style.display='none';
var legacyContainer=document.getElementById('opl-legacy-container');
if(legacyContainer)legacyContainer.style.display='block';

initialiseForm("sourcecode",s,this);

var hl=document.getElementById("highlightedcode");
var sc=document.getElementById("sourcecode");
if(hl&&sc){
hl.innerHTML=SyntaxHighlighter.highlight(sc.value,OptionsManager.getOption('targetSystem'));
sc.oninput=function (){
hl.innerHTML=SyntaxHighlighter.highlight(this.value,OptionsManager.getOption('targetSystem'));
hl.scrollTop=this.scrollTop;
hl.scrollLeft=this.scrollLeft;
self.callback(EditorMessage.CHANGEMADE);
self.updateToolbarButtons();
};
}
}
}

ProcedureFileEditor.prototype.createToobarButtons=function (){
var self=this;
var header=document.getElementById('editor-header');
if(!header)return;


var existingLeft=document.getElementById('editor-left-tools');
if(existingLeft)existingLeft.remove();
var existingRight=document.getElementById('editor-right-tools');
if(existingRight)existingRight.remove();

var leftTools=document.createElement('div');
leftTools.id='editor-left-tools';
leftTools.style.display='inline-flex';
leftTools.style.alignItems='center';
leftTools.style.marginRight='10px';

function createHeaderBtn(iconClass,title,clickHandler){
var b=document.createElement('button');
b.innerHTML='<i class="'+iconClass+'"></i>';
b.className='icon-btn';
b.style.background='none';
b.style.border='none';
b.style.color='var(--text-color)';
b.style.cursor='pointer';
b.style.fontSize='14px';
b.style.marginRight='8px';
b.style.padding='2px';
b.title=title;
b.addEventListener('click',function (e){
e.preventDefault();
clickHandler(e);
});
b.addEventListener('mousedown',function (e){e.preventDefault();});
return b;
}


var applyBtn=createHeaderBtn('fas fa-circle-check','Apply Changes',function (){
if(self.item.deleted)return;
self.applyChanges();
});
if(this.item.deleted)applyBtn.disabled=true;
leftTools.appendChild(applyBtn);
this.applyBtn=applyBtn;


var discardBtn=createHeaderBtn('fas fa-undo','Discard Changes',function (){
if(self.item.deleted)return;
if(confirm("Discard unsaved changes?")){
self.updateEditorContent(self.originalSource);

self.updateToolbarButtons();
}
});

discardBtn.disabled=true;
leftTools.appendChild(discardBtn);
this.discardBtn=discardBtn;


var divFormat=document.createElement('span');
divFormat.innerHTML='|';
divFormat.style.margin='0 10px 0 2px';
divFormat.style.color='var(--border-color)';
divFormat.style.opacity='0.5';
leftTools.appendChild(divFormat);


var formatBtn=createHeaderBtn('fa-solid fa-feather-pointed','Pretty Print (Format Selection)',function (){
if(self.item.deleted)return;
if(self.codeEditorInstance){
self.codeEditorInstance.formatSelection();
}
});
leftTools.appendChild(formatBtn);
this.formatBtn=formatBtn;

var minifyBtn=createHeaderBtn('fa-solid fa-hammer','Minify & Compress (Selection)',function (){
if(self.item.deleted)return;
var suppressed=OptionsManager.getOption('suppressConfirmations');
if(!suppressed){
if(!confirm("Minify Selection?\n\nThis will remove comments and compact whitespace in the selected area.")){
return;
}
}
if(self.codeEditorInstance){
self.codeEditorInstance.minifySelection();
}
});
leftTools.appendChild(minifyBtn);
this.minifyBtn=minifyBtn;


var div1=document.createElement('span');
div1.innerHTML='|';
div1.style.margin='0 10px 0 2px';
div1.style.color='var(--border-color)';
div1.style.opacity='0.5';
leftTools.appendChild(div1);


var indentBtn=createHeaderBtn('fas fa-indent','Increase Indent',function (){
if(self.item.deleted)return;
if(self.codeEditorInstance){
self.codeEditorInstance.indentSelection();
}
});
leftTools.appendChild(indentBtn);
this.indentBtn=indentBtn;

var outdentBtn=createHeaderBtn('fas fa-outdent','Decrease Indent',function (){
if(self.item.deleted)return;
if(self.codeEditorInstance){
self.codeEditorInstance.outdentSelection();
}
});
leftTools.appendChild(outdentBtn);
this.outdentBtn=outdentBtn;


var div2=document.createElement('span');
div2.innerHTML='|';
div2.style.margin='0 10px 0 2px';
div2.style.color='var(--border-color)';
div2.style.opacity='0.5';
leftTools.appendChild(div2);

leftTools.appendChild(createHeaderBtn('fas fa-mouse-pointer','Select All',function (){
if(self.codeEditorInstance){
self.codeEditorInstance.selectAll();
}else {
var ta=document.getElementById('sourcecode');
if(ta)ta.select();
}
}));

leftTools.appendChild(createHeaderBtn('far fa-copy','Copy the selected text to clipboard',function (){
document.execCommand('copy');
}));

leftTools.appendChild(createHeaderBtn('fas fa-file-export','Copy the entire source code to clipboard',function (){
if(self.codeEditorInstance){
var text=self.codeEditorInstance.getValue();
navigator.clipboard.writeText(text);
}else {
var ta=document.getElementById('sourcecode');
if(ta)navigator.clipboard.writeText(ta.value);
}
}));

var pasteBtn=createHeaderBtn('fas fa-paste','Paste text from clipboard at cursor position',function (){
if(self.item.deleted)return;
navigator.clipboard.readText().then(function (text){
if(!text)return;

var target=null;
if(self.codeEditorInstance)target=self.codeEditorInstance.inputLayer;
else target=document.getElementById('sourcecode');

if(target){
if(typeof target.setRangeText==='function'){
target.setRangeText(text,target.selectionStart,target.selectionEnd,'end');
target.dispatchEvent(new Event('input'));
}else {
target.value+=text;
target.dispatchEvent(new Event('input'));
}

if(self.codeEditorInstance)self.codeEditorInstance.onChange();
}
}).catch(function (e){console.error(e);});
});
if(this.item.deleted)pasteBtn.disabled=true;
leftTools.appendChild(pasteBtn);

var div=document.createElement('span');
div.innerHTML='|';
div.style.margin='0 5px 0 2px';
div.style.color='var(--border-color)';
div.style.opacity='0.5';
leftTools.appendChild(div);


var btn=document.createElement('button');
btn.innerHTML='<i class="fas fa-gears"></i>';
btn.className='icon-btn';
btn.style.background='none';
btn.style.border='none';
btn.style.color='var(--text-color)';
btn.style.cursor='pointer';
btn.style.fontSize='13px';
btn.title='Translate (Compile Source to Object Code)';
btn.addEventListener('click',function (e){
if(self.item.deleted)return;
self.translateAndSave();
});

if(this.item.deleted)btn.disabled=true;
leftTools.appendChild(btn);
this.translateBtn=btn;


var stripBtn=document.createElement('button');
stripBtn.innerHTML='<i class="fa-solid fa-file-zipper"></i>';
stripBtn.className='icon-btn';
stripBtn.style.marginLeft='5px';
stripBtn.style.background='none';
stripBtn.style.border='none';
stripBtn.style.color='var(--text-color)';
stripBtn.style.cursor='pointer';
stripBtn.style.fontSize='13px';
stripBtn.title='Copy Object Code';
stripBtn.addEventListener('click',function (e){
if(self.item.deleted)return;
self.copyObjectCode();
});
if(this.item.deleted)stripBtn.disabled=true;
leftTools.appendChild(stripBtn);
this.stripBtn=stripBtn;


var extractBtn=document.createElement('button');
extractBtn.innerHTML='<i class="fa-solid fa-file-circle-plus"></i>';
extractBtn.className='icon-btn';
extractBtn.style.marginLeft='5px';
extractBtn.style.background='none';
extractBtn.style.border='none';
extractBtn.style.color='var(--text-color)';
extractBtn.style.cursor='pointer';
extractBtn.style.fontSize='13px';
extractBtn.title='Extract Source to New Record';
extractBtn.addEventListener('click',function (e){
if(self.item.deleted)return;
self.extractSourceCode();
});
if(this.item.deleted)extractBtn.disabled=true;
leftTools.appendChild(extractBtn);
this.extractBtn=extractBtn;


var divider=document.createElement('span');
divider.innerHTML='|';
divider.style.margin='0 10px';
divider.style.color='var(--border-color)';
divider.style.opacity='0.5';
leftTools.appendChild(divider);
this.headerDivider=divider;

header.insertBefore(leftTools,header.firstChild);


var rightTools=document.createElement('div');
rightTools.id='editor-right-tools';
rightTools.style.display='inline-flex';
rightTools.style.alignItems='center';
rightTools.style.marginLeft='auto';



var targetIndicator=document.createElement('span');
targetIndicator.style.marginRight='5px';
targetIndicator.style.color='var(--text-color)';
targetIndicator.style.fontSize='12px';
targetIndicator.style.opacity='0.7';
targetIndicator.title='Current Compiler Target';

var updateTargetLabel=function (){
var current=OptionsManager.getOption('targetSystem')||'Standard';
var label=(current==='LZ')?'LZ Mode':'XP Mode';
var icon=(current==='LZ')?'fa-memory':'fa-microchip';
targetIndicator.innerHTML='<i class="fas '+icon+'"></i> '+label;
};
updateTargetLabel();
rightTools.appendChild(targetIndicator);
this.targetIndicator=targetIndicator;

this.targetOptionListener=function (e){
if(e.detail&&e.detail.key==='targetSystem'){
updateTargetLabel();
if(self.codeEditorInstance){
self.codeEditorInstance.setTargetSystem(OptionsManager.getOption('targetSystem')||'Standard');
}
}
};
window.addEventListener('optionsChanged',this.targetOptionListener);

header.appendChild(rightTools);
};

ProcedureFileEditor.prototype.updateToolbarButtons=function (){
var hasChanges=this.hasUnsavedChanges();
var isDeleted=this.item.deleted;

if(this.translateBtn){
this.translateBtn.disabled=isDeleted||hasChanges;
this.translateBtn.title=hasChanges?"Save changes before Translating":"Translate (Compile Source to Object Code)";
this.translateBtn.style.opacity=(isDeleted||hasChanges)?'0.5':'1';
}
if(this.stripBtn){
this.stripBtn.disabled=isDeleted||hasChanges;
this.stripBtn.title=hasChanges?"Save changes before Copying Object Code":"Copy Object Code";
this.stripBtn.style.opacity=(isDeleted||hasChanges)?'0.5':'1';
}
if(this.extractBtn){
this.extractBtn.disabled=isDeleted||hasChanges;
this.extractBtn.title=hasChanges?"Save changes before Extracting Source":"Extract Source to New Record";
this.extractBtn.style.opacity=(isDeleted||hasChanges)?'0.5':'1';
}


if(this.applyBtn){
this.applyBtn.disabled=isDeleted||!hasChanges;
this.applyBtn.style.opacity=(isDeleted||!hasChanges)?'0.5':'1';
}
if(this.discardBtn){
this.discardBtn.disabled=isDeleted||!hasChanges;
this.discardBtn.style.opacity=(isDeleted||!hasChanges)?'0.5':'1';
}

if(this.formatBtn){
this.formatBtn.disabled=isDeleted;
this.formatBtn.style.opacity=isDeleted?'0.5':'1';
}
if(this.minifyBtn){
this.minifyBtn.disabled=isDeleted;
this.minifyBtn.style.opacity=isDeleted?'0.5':'1';
}

if(this.indentBtn){
this.indentBtn.disabled=isDeleted;
this.indentBtn.style.opacity=isDeleted?'0.5':'1';
}
if(this.outdentBtn){
this.outdentBtn.disabled=isDeleted;
this.outdentBtn.style.opacity=isDeleted?'0.5':'1';
}
}

ProcedureFileEditor.prototype.finish=function (){
BlockFileEditor.prototype.finish.call(this);
if(this.codeEditorWrapper){
this.codeEditorWrapper.style.display='none';
}


if(this.translateBtn&&this.translateBtn.parentNode){
this.translateBtn.parentNode.removeChild(this.translateBtn);
this.translateBtn=null;
}
if(this.targetIndicator&&this.targetIndicator.parentNode){
this.targetIndicator.parentNode.removeChild(this.targetIndicator);
this.targetIndicator=null;
}
if(this.headerDivider&&this.headerDivider.parentNode){
this.headerDivider.parentNode.removeChild(this.headerDivider);
this.headerDivider=null;
}
if(this.targetOptionListener){
window.removeEventListener('optionsChanged',this.targetOptionListener);
this.targetOptionListener=null;
}
if(this.stripBtn&&this.stripBtn.parentNode){
this.stripBtn.parentNode.removeChild(this.stripBtn);
this.stripBtn=null;
}
if(this.extractBtn&&this.extractBtn.parentNode){
this.extractBtn.parentNode.removeChild(this.extractBtn);
this.extractBtn=null;
}
}

ProcedureFileEditor.prototype.updateEditorContent=function (s){
if(this.codeEditorInstance){
this.codeEditorInstance.setValue(s);
this.codeEditorInstance.update();
initialiseForm("sourcecode",s,this);
}else {
initialiseForm("sourcecode",s,this);
var hl=document.getElementById("highlightedcode");
var sc=document.getElementById("sourcecode");
if(hl&&sc){
hl.innerHTML=SyntaxHighlighter.highlight(sc.value,OptionsManager.getOption('targetSystem'));
}
}
}

ProcedureFileEditor.prototype.toggleHighlight=function (){
if(this.codeEditorContainer&&this.codeEditorInstance)return false;

var sc=document.getElementById("sourcecode");
var hl=document.getElementById("highlightedcode");

if(hl.style.display==="none"){
hl.innerHTML=SyntaxHighlighter.highlight(sc.value,OptionsManager.getOption('targetSystem'));
hl.style.display="block";
sc.classList.add("transparent-text");
hl.scrollTop=sc.scrollTop;
hl.scrollLeft=sc.scrollLeft;
return true;
}else {
hl.style.display="none";
sc.classList.remove("transparent-text");
return false;
}
}

ProcedureFileEditor.prototype.getProcedureData=function (){
var chld=this.item.child.child;



if(this.item.type===2){
return new Uint8Array(chld.data);
}

var lncode=chld.data[0]*256+chld.data[1];

var txt;

if(this.codeEditorInstance&&this.codeEditorContainer&&this.codeEditorContainer.style.display!=='none'){
txt=this.codeEditorInstance.getValue();
}else {
txt=document.getElementById("sourcecode").value;
}




var srcBytes=[];
for(var i=0;i<txt.length;i++){
var c=txt.charCodeAt(i);
srcBytes.push(c===10?0:c);
}


srcBytes.push(0);
srcBytes.push(0);


var newlnsrc=srcBytes.length-2;



var headerSize=lncode+2;
var totalSize=headerSize+2 + srcBytes.length;

var newdata=new Uint8Array(totalSize);


for(var i=0;i<headerSize;i++){
newdata[i]=chld.data[i];
}


newdata[headerSize]=(newlnsrc>>8)&0xff;
newdata[headerSize+1]=newlnsrc&0xff;


for(var i=0;i<srcBytes.length;i++){
newdata[headerSize+2 + i]=srcBytes[i];
}

return newdata;
}
ProcedureFileEditor.prototype.hasUnsavedChanges=function (){
if(this.item.deleted)return false;
if(BlockFileEditor.prototype.hasUnsavedChanges.call(this))return true;

var txt;
if(this.codeEditorInstance&&this.codeEditorContainer&&this.codeEditorContainer.style.display!=='none'){
txt=this.codeEditorInstance.getValue();
}else {
txt=document.getElementById("sourcecode").value;
}

if(this.originalSource!==undefined&&txt===this.originalSource)return false;

var chld=this.item.child.child;
var newdata=this.getProcedureData();
return!arraysAreEqual(newdata,chld.data);
}
ProcedureFileEditor.prototype.applyChanges=function (){
var chld=this.item.child.child;


var txt="";
if(this.codeEditorInstance)txt=this.codeEditorInstance.getValue();
else txt=document.getElementById("sourcecode").value;

var lines=txt.split('\n');
var firstLine=lines[0];
var colonIndex=firstLine.indexOf(':');
var sanitizedLine=firstLine;
var nameChanged=false;

if(colonIndex!==-1){
var namePart=firstLine.substring(0,colonIndex);
var rest=firstLine.substring(colonIndex);
var trimmed=namePart.trim();
if(trimmed.length>8){
var leading=namePart.match(/^\s*/)[0];
var truncated=trimmed.substring(0,8);
sanitizedLine=leading+truncated+rest;
nameChanged=true;
}
}else {
var trimmed=firstLine.trim();
if(trimmed.length>8&&trimmed.indexOf(' ')===-1){
var match=firstLine.match(/^(\s*)(.*)$/);
if(match){
sanitizedLine=match[1]+match[2].substring(0,8)+":";
nameChanged=true;
}
}
}

if(nameChanged){

lines[0]=sanitizedLine;
txt=lines.join('\n');
if(this.codeEditorInstance){
this.codeEditorInstance.setValue(txt);
}else {
document.getElementById("sourcecode").value=txt;
}
}


var newdata=this.getProcedureData();
var differ=!arraysAreEqual(newdata,chld.data);
var headerChanged=false;


if(differ){
chld.setData(newdata);
chld=this.item.child;
var ln=newdata.length;
chld.data[2]=(ln>>8)&0xff;
chld.data[3]=ln&0xff;
}





var match=lines[0].match(/^\s*([a-zA-Z][a-zA-Z0-9]{0,7}[%$]?)\s*:/i);
var newName=(match&&match[1])?match[1]:null;

if(newName){

var headerData=new Uint8Array(this.item.data.length);
headerData.set (this.item.data);



var encName=(newName+"        ").substr(0,8);
for(var i=0;i<8;i++){
headerData[2+i]=encName.charCodeAt(i);
}


var headerDiffer=!arraysAreEqual(headerData,this.item.data);

if(headerDiffer){
this.item.setData(headerData);
this.item.setDescription();
headerChanged=true;


var fnInput=document.getElementById('filename');
if(fnInput)fnInput.value=newName;
}
}


try{
BlockFileEditor.prototype.applyChanges.call(this);
}catch(e){console.warn("Base applyChanges warn:",e);}



if(headerChanged||differ){
if(window.updateInventory){
window.updateInventory();
}else if(window.opkedit_refresh_view){
window.opkedit_refresh_view();
}else {
var event=new CustomEvent('itemRenamed',{detail:{item:this.item}});
window.dispatchEvent(event);
}
}




this.originalSource=txt;

this.updateToolbarButtons();

return differ||headerChanged;
};

ProcedureFileEditor.prototype.copyObjectCode=function (){

var targets=[];
if(typeof selectedItems!=='undefined'&&selectedItems.length>0){


if(selectedItems.indexOf(this.item)!==-1){
targets=selectedItems.filter(function (it){return it.type===3||it.type===2;});
}else {
targets=[this.item];
}
}else {
targets=[this.item];
}

if(targets.length===0)return;

if(!OptionsManager.getOption('suppressConfirmations')){
var msg=(targets.length===1)?
"Are you sure you want to Copy the Object Code?\n\nThis will:\n1. Mark this 'OPL Procedure' as DELETED.\n2. Create/Update an 'OPL Object' record.":
"Are you sure you want to Copy the Object Code for "+targets.length+" items?\n\nThis will mark sources as DELETED and create/update Object records.";

if(!confirm(msg))return;
}

var pack=packs[currentPackIndex];
var successCount=0;
var self=this;

targets.forEach(function (targetItem){
var result=self.processItemCopyObject(targetItem,pack);
if(result===true||(result&&result.success)){
successCount++;
}else {

if(targets.length===1){
var reason=(result&&result.error)?result.error:"Unknown validation error";
alert("Failed to copy object code: "+reason);
}
}
});


if(this.item.deleted){
var delChk=document.getElementById('deleted');
if(delChk)delChk.checked=true;
var ta=document.getElementById('sourcecode');
if(ta)ta.disabled=true;
if(this.codeEditorInstance)this.codeEditorInstance.setReadOnly(true);
if(this.translateBtn)this.translateBtn.disabled=true;
if(this.stripBtn)this.stripBtn.disabled=true;
if(this.extractBtn)this.extractBtn.disabled=true;
}


if(successCount>0){
if(window.saveSession)window.saveSession();

if(window.updateInventory)window.updateInventory();

if(!OptionsManager.getOption('suppressConfirmations')){
if(targets.length>1)alert("Processed "+successCount+" items.");


}
}
};


ProcedureFileEditor.prototype.processItemCopyObject=function (targetItem,pack){
if(targetItem.deleted)return {success:false,error:"Item is already deleted"};




var flatData=null;
var parts=[];


if(targetItem.data)parts.push(targetItem.data);

if(targetItem.child&&targetItem.child.data)parts.push(targetItem.child.data);

if(targetItem.child&&targetItem.child.child&&targetItem.child.child.data){
parts.push(targetItem.child.child.data);
}


var totalFlatLen=parts.reduce(function (a,b){return a+b.length;},0);
flatData=new Uint8Array(totalFlatLen);
var offset=0;
for(var i=0;i<parts.length;i++){
flatData.set (parts[i],offset);
offset+=parts[i].length;
}



function parseRecordStructure(data,itemType){
var result={valid:false,error:"Unknown Error"};
var recStart=0;
var qcodeSizeVal=0;
var oplBase=0;
var isType3=(itemType===3);


if(isType3){

if(data.length<13)return {valid:false,error:"Record too short"};
var recHdrLen=data[0];
var syncOffset=1+recHdrLen;


if(data[syncOffset]!==0x00)return {valid:false,error:"Missing Terminator 0x00 at "+syncOffset};


if(data[syncOffset+1]!==0x02||data[syncOffset+2]!==0x80){
return {valid:false,error:"Missing Sync 02 80 at "+(syncOffset+1)};
}







oplBase=syncOffset+7;
recStart=0;
}else if(itemType===2){


var syncFound=-1;
for(var i=0;i<Math.min(data.length-1,20);i++){
if(data[i]===0x02&&data[i+1]===0x80){
syncFound=i;
break;
}
}
if(syncFound!==-1){
oplBase=syncFound+6;

}else {

oplBase=0;
}
}

if(oplBase+4>=data.length)return {valid:false,error:"Data too short for OPL Header"};



qcodeSizeVal=(data[oplBase+2]<<8)|data[oplBase+3];
var nParams=data[oplBase+4];


var cursor=oplBase+5;


cursor+=nParams;
if(cursor>=data.length)return {valid:false,error:"Truncated Param Types"};


function readWord(){
if(cursor+1>=data.length)return-1;
var val=(data[cursor]<<8)|data[cursor+1];
cursor+=2;
return val;
}





var globalTblSize=readWord();
if(globalTblSize===-1)return {valid:false,error:"Truncated Global Tbl Size"};
cursor+=globalTblSize;
if(cursor>data.length)return {valid:false,error:"Truncated Global Table"};


var externTblSize=readWord();
if(externTblSize===-1)return {valid:false,error:"Truncated Extern Tbl Size"};
cursor+=externTblSize;
if(cursor>data.length)return {valid:false,error:"Truncated Extern Table"};


var strFixTblSize=readWord();
if(strFixTblSize===-1)return {valid:false,error:"Truncated String Fixup Tbl Size"};
cursor+=strFixTblSize;
if(cursor>data.length)return {valid:false,error:"Truncated String Fixup Table"};


var arrFixTblSize=readWord();
if(arrFixTblSize===-1)return {valid:false,error:"Truncated Array Fixup Tbl Size"};
cursor+=arrFixTblSize;
if(cursor>data.length)return {valid:false,error:"Truncated Array Fixup Table"};


var instructionStart=cursor;




var calculatedBodySize=(instructionStart-oplBase)+qcodeSizeVal;


if(oplBase+calculatedBodySize>data.length){
return {valid:false,error:"Calculated Body Size exceeds Data"};
}

return {
valid:true,
oplBase:oplBase,
calculatedBodySize:calculatedBodySize,
longRecLenOffset:oplBase-4,
totalLenOffset:oplBase-2,
fullData:data
};
}


var struct=parseRecordStructure(flatData,targetItem.type);
if(!struct.valid)return {success:false,error:struct.error};



var cutLength=struct.oplBase+struct.calculatedBodySize;

var newData=new Uint8Array(cutLength);
newData.set (flatData.subarray(0,cutLength));


var totalLen=struct.calculatedBodySize;
var longRecLen=totalLen+2;


if(struct.totalLenOffset>=0){
newData[struct.totalLenOffset]=(totalLen>>8)&0xFF;
newData[struct.totalLenOffset+1]=totalLen&0xFF;
}


if(struct.longRecLenOffset>=0){
newData[struct.longRecLenOffset]=(longRecLen>>8)&0xFF;
newData[struct.longRecLenOffset+1]=longRecLen&0xFF;
}










var hdrLen=newData[0];
var split1=hdrLen+2;


if(split1>newData.length)split1=newData.length;


var newHeaderData=newData.subarray(0,split1);
var headerItem=new PackItem(newHeaderData,0,newHeaderData.length);
headerItem.setDescription();



var split2=split1+4;


if(split2>newData.length)split2=newData.length;

var newBlockHdrData=newData.subarray(split1,split2);

var blkHeaderItem=new PackItem(newBlockHdrData,0,newBlockHdrData.length);
blkHeaderItem.setDescription();


var newBodyData=newData.subarray(split2);
var bodyItem=new PackItem(newBodyData,0,newBodyData.length);


blkHeaderItem.child=bodyItem;
headerItem.child=blkHeaderItem;


if(typeof addItemToPack==='function'){
addItemToPack(headerItem);

if(window.updateInventory)window.updateInventory();
}else {
return {success:false,error:"addItemToPack is missing"};
}


targetItem.deleted=true;
targetItem.data[1]&=0x7F;

return {success:true};

};



function buildProcMap(){
var procMap={};
if(window.packs){
window.packs.forEach(function (pack){
pack.items.forEach(function (item){
if(item.type===3&&!item.deleted&&item.child){


var target=(item.child.child&&item.child.child.data)?item.child.child:(item.child.data?item.child:null);
if(target){
try{
var tempDecompiler=new OPLDecompiler();
var header=tempDecompiler.parseHeader(target.data,0);
if(header&&header.numParams!==undefined){
procMap[item.name.toUpperCase()]={paramCount:header.numParams};
}
}catch(e){


}
}
}
});
});
}
return procMap;
}

ProcedureFileEditor.prototype.translateAndSave=function (){
var self=this;









var targets=[];
if(typeof selectedItems!=='undefined'&&selectedItems.length>1){

targets=selectedItems.filter(function (it){return it.type===3||it.type===2;});
}


if(targets.length===0){
targets=[this.item];
}

var successes=0;
var errors=[];


if(!window.OPLCompiler){
alert("Translator (Compiler) not found!");
return;
}


var statusEl=document.getElementById("status-message");
var oldStatus=statusEl?statusEl.innerText:"";
if(statusEl)statusEl.innerText="Translating "+targets.length+" items...";









var isBatch=(targets.length>1);

targets.forEach(function (targetItem){


var sourceCode="";





sourceCode=self.getSourceFromItem(targetItem)||self.getDecompiledSource(targetItem);


try{




if(targetItem===self.item&&self.codeEditorInstance){
self.codeEditorInstance.setErrorLine(-1);
}

var result=self.compileAndSaveItem(targetItem,sourceCode,targetItem===self.item,isBatch);
if(result.success)successes++;
else {
errors.push(targetItem.name+": "+result.error);

if(targetItem===self.item&&self.codeEditorInstance){
var match=result.error.match(/line\s+(\d+)/i);
if(match&&match[1]){
var lineNum=parseInt(match[1],10);
if(!isNaN(lineNum)&&lineNum>0){
self.codeEditorInstance.setErrorLine(lineNum-1);
}
}
}
}
}catch(e){
errors.push(targetItem.name+": "+e.message);

if(targetItem===self.item&&self.codeEditorInstance){
var match=e.message.match(/line\s+(\d+)/i);
if(match&&match[1]){
var lineNum=parseInt(match[1],10);
if(!isNaN(lineNum)&&lineNum>0){
self.codeEditorInstance.setErrorLine(lineNum-1);
}
}
}
}
});



if(isBatch){
if(targets.indexOf(self.item)!==-1){
self.refreshDecompilerLog(true);
}
if(window.updateInventory)window.updateInventory();
}

if(!OptionsManager.getOption('suppressConfirmations')){
if(errors.length===0){

if(statusEl){
statusEl.textContent="Translated successfully.";
statusEl.style.color="lightgreen";
setTimeout(function (){if(statusEl){statusEl.style.color="";statusEl.textContent="Ready";}},3000);
}

if(isBatch){
alert("Translated "+successes+" item(s) successfully!");
}
}else {

if(isBatch){

var displayErrors=errors;
if(errors.length>20){
displayErrors=errors.slice(0,20);
displayErrors.push("... and "+(errors.length-20)+" more errors.");
}
DialogManager.showErrorDialog("Translated "+successes+" item(s).\n\nErrors:\n"+displayErrors.join("\n"));
}else {

var msg=errors[0];
if(msg.startsWith(targets[0].name+": ")){
msg=msg.substring(targets[0].name.length+2);
}


var ckEl=document.getElementById("status-checksum");

if(statusEl){


statusEl.textContent=targets[0].name+": - Error: "+msg+"\u00A0\u00A0";
statusEl.style.color="#e00000";


if(ckEl)ckEl.style.display="none";


setTimeout(function (){
if(statusEl)statusEl.style.color="";

},5000);
}


if(!OptionsManager.getOption('suppressConfirmations')){
DialogManager.showErrorDialog("Error: in "+targets[0].name+": - "+msg);
}
}
}
}
};

ProcedureFileEditor.prototype.getSourceFromItem=function (item){
if(!item||!item.child)return "";


var data=null;
var isNested=false;

if(item.child.child&&item.child.child.data){
data=item.child.child.data;
isNested=true;
}else if(item.child.data){
data=item.child.data;
}else {
return "";
}



var offset=0;
while(offset<data.length&&data[offset]===0)offset++;

var sync=-1;






if(!isNested){
for(var i=offset;i<data.length-1;i++){
if(data[i]===0x02&&data[i+1]===0x80){sync=i;break;}
}
}



var lncode=0;
var base=0;


if(sync===-1&&isNested){

if(data.length>=2){
lncode=(data[0]<<8)|data[1];
base=0;
}else return "";
}else {

if(sync!==-1){


if(sync+5>=data.length)return "";
lncode=(data[sync+4]<<8)|data[sync+5];
base=sync+4;
}else {
if(data.length>=2){
lncode=(data[0]<<8)|data[1];
base=0;
}else return "";
}
}


if(base+2>data.length)return "";

var lnsrcOffset=base+2 + lncode;
if(lnsrcOffset+1>=data.length)return "";


var lnsrc=(data[lnsrcOffset]<<8)|data[lnsrcOffset+1];

if(lnsrc<=0)return "";
var srcStart=lnsrcOffset+2;


if(srcStart+lnsrc>data.length){

lnsrc=data.length-srcStart;
if(lnsrc<=0)return "";
}


var src="";
var current=srcStart;


for(var i=0;i<lnsrc;i++){
var c=data[current+i];
if(c===0&&i===lnsrc-1)continue;
if(c===0)src+="\n";
else src+=String.fromCharCode(c);
}

return src;
};


ProcedureFileEditor.prototype.getDecompiledSource=function (item){
if(!item||!window.OPLDecompiler)return "";

var qcodeBuffer=null;
var procName=(item.name||"MAIN").trim();


if(item.type===2){

if(item.child&&item.child.child&&item.child.child.data){
qcodeBuffer=item.child.child.data;
}else if(item.child&&item.child.data){
qcodeBuffer=item.child.data;
}
}else if(item.type===3){



var payload=null;
if(item.child&&item.child.child&&item.child.child.data){
payload=item.child.child.data;
}

if(payload&&payload.length>2){
var qLen=(payload[0]<<8)|payload[1];
if(payload.length>=2+qLen){
qcodeBuffer=payload.subarray(2,2+qLen);
}
}
}

if(!qcodeBuffer)return "";



try{
var nameStr=(procName+"        ").substring(0,8);
var totalLen=17+qcodeBuffer.length;
var stamped=new Uint8Array(totalLen);


stamped[0]=0x09;stamped[1]=0x83;
for(var k=0;k<8;k++)stamped[2+k]=nameStr.charCodeAt(k);
stamped[10]=0x00;


var longRecLen=qcodeBuffer.length+2;
stamped[11]=0x02;stamped[12]=0x80;
stamped[13]=(longRecLen>>8)&0xFF;
stamped[14]=longRecLen&0xFF;
stamped[15]=(qcodeBuffer.length>>8)&0xFF;
stamped[16]=qcodeBuffer.length&0xFF;

stamped.set (qcodeBuffer,17);

var decomp=new window.OPLDecompiler();

var analysis=decomp.getRawAnalysis(stamped,procName,{procMap:{}});
var genResult=decomp.sourceGen.generateSource(analysis.header,analysis.varMap,analysis.flow,stamped,analysis.finalProcName,{oplBase:decomp.oplBase});
return (genResult&&typeof genResult==='object'&&genResult.source)?genResult.source:genResult;
}catch(e){


return "";
}
};

ProcedureFileEditor.prototype.compileAndSaveItem=function (targetItem,source,interactive,suppressUpdate){

if(!source)return {success:false,error:"No source code found"};

var options={};
if(typeof OptionsManager!=='undefined'){
options.targetSystem=OptionsManager.getOption('targetSystem');
}
var qcode=window.OPLCompiler.compile(source,options);

if(!qcode||qcode.length===0){
return {success:false,error:"Compilation produced no output"};
}

var saveSource=true;






var srcBytes=[];
for(var i=0;i<source.length;i++){
var c=source.charCodeAt(i);
srcBytes.push(c===10?0:c);
}
srcBytes.push(0);



var contentSize=2+qcode.length+2;
if(saveSource)contentSize+=srcBytes.length;


var newData=new Uint8Array(contentSize);
var cursor=0;


newData[cursor++]=(qcode.length>>8)&0xFF;
newData[cursor++]=qcode.length&0xFF;


newData.set (qcode,cursor);
cursor+=qcode.length;


var srcLen=saveSource?srcBytes.length:0;
newData[cursor++]=(srcLen>>8)&0xFF;
newData[cursor++]=srcLen&0xFF;


if(saveSource){
newData.set (srcBytes,cursor);
cursor+=srcBytes.length;
}




targetItem.deleted=true;
if(targetItem.data&&targetItem.data.length>1){
targetItem.data[1]&=0x7F;
}




if(typeof createBlockFile==='function'){



var newItem=createBlockFile(newData,targetItem.name,3,true);


if(!suppressUpdate){

if(window.updateInventory)window.updateInventory();



if(newItem&&window.packs&&window.packs[window.currentPackIndex]){
var idx=window.packs[window.currentPackIndex].items.indexOf(newItem);
if(idx!==-1){

if(window.itemSelected)window.itemSelected(window.currentPackIndex,idx);
}else {

self.initialise(newItem);
}
}
}
}else {

}

return {success:true};
};


function buildProcMap(){
var procMap={};
if(window.packs){
window.packs.forEach(function (pack){
pack.items.forEach(function (item){
if(item.type===3&&!item.deleted&&item.child){


var target=(item.child.child&&item.child.child.data)?item.child.child:(item.child.data?item.child:null);
if(target){
try{
var tempDecompiler=new OPLDecompiler();
var header=tempDecompiler.parseHeader(target.data,0);
if(header&&header.numParams!==undefined){
procMap[item.name.toUpperCase()]={paramCount:header.numParams};
}
}catch(e){


}
}
}
});
});
}
return procMap;
}

ProcedureFileEditor.prototype.refreshDecompilerLog=function (hasSource){
if(!window.OPLDecompiler)return;

var decompilerLogEnabled=(typeof OptionsManager!=='undefined'&&OptionsManager.getOption('showDecompilerLog'));
var logWindowOpen=(typeof decompilerLogWindow!=='undefined'&&decompilerLogWindow&&decompilerLogWindow.element.style.display!=='none');




if(!hasSource||logWindowOpen||decompilerLogEnabled){
try{
var chld=this.item.child.child;
var lncode=chld.data[0]*256+chld.data[1];
var objectCode=chld.data.subarray(2,2+lncode);
var procName=(this.item.name||"main").trim();



var nameStr=(procName+"        ").substring(0,8);
var headerSize=11+6;
var totalLen=headerSize+objectCode.length;
var stampedBuffer=new Uint8Array(totalLen);


stampedBuffer[0]=0x09;
stampedBuffer[1]=0x83;
for(let i=0;i<8;i++)stampedBuffer[2+i]=nameStr.charCodeAt(i);
stampedBuffer[10]=0x00;


var longRecLen=objectCode.length+2;


stampedBuffer[11]=0x02;
stampedBuffer[12]=0x80;
stampedBuffer[13]=(longRecLen>>8)&0xFF;
stampedBuffer[14]=longRecLen&0xFF;
stampedBuffer[15]=(objectCode.length>>8)&0xFF;
stampedBuffer[16]=objectCode.length&0xFF;


stampedBuffer.set (objectCode,17);

var logOptions={};

if(logWindowOpen||decompilerLogEnabled){
if(decompilerLogWindow){
decompilerLogWindow.clear();
logOptions.logCallback=function (entry){
decompilerLogWindow.log(entry);
};

if(decompilerLogEnabled)decompilerLogWindow.updateVisibility();
}
}

var decompiler=new OPLDecompiler();
logOptions.procMap=buildProcMap();


var analysis=decompiler.getRawAnalysis(stampedBuffer,procName,logOptions);


var varStorageEnabled=(typeof OptionsManager!=='undefined'&&OptionsManager.getOption('showVariableStorageWindow'));

if(typeof variableStorageWindow!=='undefined'&&variableStorageWindow){
variableStorageWindow.clear();
if(varStorageEnabled){
variableStorageWindow.updateVisibility();

if(analysis.varMap){





var mergedEntries=[];
var mapKeys=Object.keys(analysis.varMap).map(Number);


function findVar(off){
if(analysis.varMap[off])return analysis.varMap[off];
return null;
}


mergedEntries.push({
offset:-2,
size:2,
name:"Table Length",
type:"Struct",
comment:"Global Variable Name Table Length"
});

var currentPtrOffset=-4;





var globalTableSize=0;
if(analysis.globals){
analysis.globals.forEach(g=>{
globalTableSize+=(1+g.name.length+1 + 2);
});

if(globalTableSize%2!==0)globalTableSize++;
}




var tableLenEntry=mergedEntries[mergedEntries.length-1];
if(tableLenEntry&&tableLenEntry.offset===-2){

tableLenEntry.bytes=(globalTableSize).toString(16).toUpperCase().padStart(4,'0');
}

var numGlobals=(analysis.globals&&analysis.globals.length)?analysis.globals.length:0;

for(var i=0;i<numGlobals;i++){
var g=analysis.globals[i];
var name=g.name;


var realOffset=(g.addr!==undefined)?g.addr:0;


var targetSigned=(realOffset>32767)?realOffset-65536:realOffset;
var targetHex=((0x10000+targetSigned)&0xFFFF).toString(16).toUpperCase().padStart(4,'0');


var entrySize=1+name.length+1 + 2;


var hexStr="";
hexStr+=(name.length).toString(16).toUpperCase().padStart(2,'0');
for(var k=0;k<name.length;k++)hexStr+=name.charCodeAt(k).toString(16).toUpperCase().padStart(2,'0');
hexStr+=(g.type).toString(16).toUpperCase().padStart(2,'0');
hexStr+=targetHex;

mergedEntries.push({
offset:currentPtrOffset,
size:entrySize,
name:"Global Def "+name,
type:"Table Entry",
comment:"Points to "+targetHex,
bytes:hexStr
});
currentPtrOffset-=entrySize;
}


if(currentPtrOffset%2!==0){

mergedEntries.push({
offset:currentPtrOffset,
size:1,
name:"Padding",
type:"Pad",
comment:"Alignment",
bytes:"00"
});
currentPtrOffset--;
}



var numParams=(analysis.numParams)?analysis.numParams:0;
for(var i=0;i<numParams;i++){

var existing=findVar(currentPtrOffset);

if(existing&&existing.isParam){

var typeStr=existing.type===0?"Int":existing.type===1?"Flt":"Str";
typeStr+=" (Ref)";

mergedEntries.push({
offset:currentPtrOffset,
size:2,
name:existing.name,
type:typeStr,
comment:"Param"
});
}else {

mergedEntries.push({
offset:currentPtrOffset,
size:2,
name:"P"+(i+1)+"?",
type:"Unused",
comment:"Param"
});
}
currentPtrOffset-=2;
}


var numExternals=(analysis.externals&&analysis.externals.length)?analysis.externals.length:0;
for(var i=0;i<numExternals;i++){
var extName="External Ptr "+(i+1);
if(analysis.externals&&analysis.externals[i]){
extName=analysis.externals[i].name;
}

mergedEntries.push({
offset:currentPtrOffset,
size:2,
name:extName,
type:"Ptr",
comment:"External"
});
currentPtrOffset-=2;
}






mapKeys.forEach(function (off){
if(off>-2)return;



var alreadyAdded=mergedEntries.find(function (e){return e.offset===off;});
if(alreadyAdded)return;


var info=analysis.varMap[off];
var size=0;
var isArray=(info.arrayLen!==undefined);
var arrayLen=info.arrayLen||1;
var maxLen=info.maxLen||255;

if(info.type===0){
if(isArray)size=2+(2*arrayLen);
else size=2;
}else if(info.type===1){
if(isArray)size=2+(8*arrayLen);
else size=8;
}else if(info.type===2){
var elemSize=1+maxLen;
if(isArray)size=2+(elemSize*arrayLen);
else size=1+maxLen;
}


var typeStr=info.type===0?"Int":info.type===1?"Flt":"Str";
if(info.type===2)typeStr+="("+maxLen+")";
if(isArray)typeStr+=" Arr["+arrayLen+"]";


var comment="";
if(info.isParam)comment="Param (Storage?)";
else if(info.isGlobal)comment="Global";
else if(info.isLocal)comment="Local";
else if(info.isExternal)comment="External";


var byteStr="";
if(size>0&&size<2048){
for(var b=0;b<size;b++)byteStr+="00";
}

mergedEntries.push({
offset:off,
size:size,
name:info.name,
type:typeStr,
comment:comment,
bytes:byteStr
});
});


mergedEntries.sort(function (a,b){return b.offset-a.offset;});


mergedEntries.forEach(function (entry){

var addrStr;

if(entry.offset<=-90000){
addrStr="????";
}else {
var addrVal=(0x10000+entry.offset)&0xFFFF;
addrStr=addrVal.toString(16).toUpperCase().padStart(4,'0');
}

var infoStr=entry.name;
if(entry.type&&entry.type!=="Struct")infoStr+=" ("+entry.type+")";

variableStorageWindow.log({
addr:addrStr,
bytes:entry.bytes||"",
info:infoStr,
comment:entry.comment
});
});
}
}
}


var decompiled=decompiler.sourceGen.generateSource(analysis.header,analysis.varMap,analysis.flow,stampedBuffer,analysis.finalProcName,{...logOptions,oplBase:decompiler.oplBase});


if(!hasSource){

if(decompiled&&typeof decompiled==='object'&&decompiled.source!==undefined){
return decompiled.source;
}
return decompiled;
}
}catch(e){

if(!hasSource)return "REM Error decompiling: "+e.message;
}
}
return null;
};

ProcedureFileEditor.prototype.extractSourceCode=function (){

var targets=[];
if(typeof selectedItems!=='undefined'&&selectedItems.length>0){
if(selectedItems.indexOf(this.item)!==-1){
targets=selectedItems.filter(function (it){return it.type===3;});
}else {
targets=[this.item];
}
}else {
targets=[this.item];
}

if(targets.length===0)return;

if(!OptionsManager.getOption('suppressConfirmations')){
var msg=(targets.length===1)?
"Extract Source Code to New Record?\n\nThis will:\n1. Create a new OPL Text record with the source.\n2. Mark this OPL Procedure as DELETED.":
"Extract Source for "+targets.length+" items?\n\nThis will create new Text records and mark originals as DELETED.";
if(!confirm(msg))return;
}

var pack=packs[currentPackIndex];
var successCount=0;
var self=this;

targets.forEach(function (targetItem){
var result=self.processItemExtractSource(targetItem,pack);
if(result===true||(result&&result.success)){
successCount++;
}else {
if(targets.length===1){
var reason=(result&&result.error)?result.error:"Unknown validation error";

if(typeof setStatus==='function')setStatus("Extraction Failed: "+reason);
}
}
});

if(this.item.deleted){

var delChk=document.getElementById('deleted');
if(delChk)delChk.checked=true;
var ta=document.getElementById('sourcecode');
if(ta)ta.disabled=true;
if(this.codeEditorInstance)this.codeEditorInstance.setReadOnly(true);
if(this.translateBtn)this.translateBtn.disabled=true;
if(this.stripBtn)this.stripBtn.disabled=true;
if(this.extractBtn)this.extractBtn.disabled=true;
}

if(successCount>0){
if(window.saveSession)window.saveSession();
if(window.updateInventory)window.updateInventory();
}
};

ProcedureFileEditor.prototype.processItemExtractSource=function (targetItem,pack){
if(targetItem.deleted)return {success:false,error:"Item is already deleted"};




var chld=targetItem.child?targetItem.child.child:null;
if(!chld||!chld.data){

return {success:false,error:"No data found"};
}

var data=chld.data;
var extractedPayload=null;
var isSimpleCopy=false;



var isValidProc=false;
if(data.length>=4){
var codeLen=(data[0]<<8)|data[1];
var srcLenOffset=2+codeLen;
if(srcLenOffset+2<=data.length){
var srcLen=(data[srcLenOffset]<<8)|data[srcLenOffset+1];
if(srcLenOffset+2 + srcLen<=data.length){

isValidProc=true;
if(srcLen>0){
var srcOffset=srcLenOffset+2;
var sourceBytes=data.subarray(srcOffset,srcOffset+srcLen);


extractedPayload=new Uint8Array(2+2 + sourceBytes.length);
extractedPayload[0]=0;extractedPayload[1]=0;
extractedPayload[2]=(sourceBytes.length>>8)&0xFF;
extractedPayload[3]=sourceBytes.length&0xFF;
extractedPayload.set (sourceBytes,4);
}





}
}
}


if(!isValidProc||!extractedPayload){



isSimpleCopy=true;
extractedPayload=new Uint8Array(data.length);
extractedPayload.set (data);
}

if(!extractedPayload&&!isSimpleCopy)return {success:false,error:"No Source Code found"};


targetItem.deleted=true;
if(targetItem.data.length>1){
targetItem.data[1]&=0x7F;
}



if(typeof createBlockFile==='function'){
createBlockFile(extractedPayload,targetItem.name,3,true);
}

return {success:true};
};