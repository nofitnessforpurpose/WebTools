'use strict';



function LZNotepadFileEditor(editorelement,codeEditorContainer,callback){
BlockFileEditor.call(this,editorelement,callback,[7],codeEditorContainer);
}
LZNotepadFileEditor.prototype=Object.create(BlockFileEditor.prototype);
LZNotepadFileEditor.prototype.initialise=function (item){
if(!this.myelement){
var container=document.createElement('div');

container.style.height='100%';
container.style.display='flex';
container.style.flexDirection='column';
container.style.boxSizing='border-box';








var headerHTML=
"<form action='#'><fieldset class='themed-fieldset' style='margin-bottom: 10px;'><legend style='color: var(--text-color); opacity: 0.7; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;'>Header</legend>" +
"<div style='display:flex; align-items:center; margin-bottom: 5px;'>" +
"  <span style='color:var(--text-color); opacity:0.8; margin-right: 5px;'>Record name:</span>" +
"  <input type='text' id='filename' maxlength='8' class='themed-input' style='font-family:monospace; text-transform:uppercase;'> " +
"  <span style='font-size:11px; color:var(--text-color); opacity:0.5; margin-left:10px;'>(A-Z start, max 8 chars)</span>" +
"</div>" +
"<div style='display:flex; align-items:center;'>" +
"  <input type='checkbox' id='deleted' class='themed-checkbox' style='margin-right: 5px;'>" +
"  <label for='deleted' style='color:var(--text-color); opacity:0.8;'>Deleted</label>" +
"</div>" +
"</fieldset></form>";






var notepadHTML=
"<form action='#' style='flex:1; display:flex; flex-direction:column; min-height:0;'><fieldset class='themed-fieldset' style='flex:1; display:flex; flex-direction:column; min-height:0;'><legend style='color: var(--text-color); opacity: 0.7; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;'>Notepad</legend>" +
"<div style='margin-bottom:10px; display:flex; align-items:center; flex: 0 0 auto;'>" +
"  <label style='width:auto; margin-right:15px; color:var(--text-color); opacity:0.8;'>Password:</label>" +
"  <input type='text' id='password' placeholder='Optional' class='themed-input' style='margin-right:30px;'>" +
"  <div style='display:flex; align-items:center; gap:5px; margin-right:15px; background-color:transparent;'>" +
"      <input type='checkbox' id='is-encrypted' class='themed-checkbox'><label for='is-encrypted' style='margin:0; color:var(--text-color); opacity:0.8;'>Encrypt</label>" +
"  </div>" +
"  <div style='display:flex; align-items:center; gap:5px; background-color:transparent;'>" +
"      <input type='checkbox' id='numbered' class='themed-checkbox' title='Show line numbers on LZ & in Editor'><label for='numbered' style='margin:0; color:var(--text-color); opacity:0.8;'>Numbered</label>" +
"  </div>" +
"</div>" +
"<div id='notepad-body-helper' style='font-size:12px; margin-bottom:5px; display:none; color:var(--text-color); opacity:0.6;'>Encrypted Content - Enter Password to View</div>" +
"<div style='flex:1; display:flex; flex-direction:column; min-height:0; border: 1px solid var(--border-color); border-radius: 3px; overflow: hidden;'>" +
"  <textarea id='notepad' rows=20 cols=60 style='flex:1; font-family:monospace; background-color:var(--bg-color); color:var(--text-color); border:none; padding: 5px; outline: none; resize: none;'></textarea>" +
"</div>" +
"</fieldset></form>";

container.innerHTML=headerHTML+notepadHTML;
this.myelement=container;
}

if(this.myelement&&this.myelement.parentNode!==this.editorelement){
this.editorelement.appendChild(this.myelement);
}


this.item=item;

this.item=item;

var fnameInput=document.getElementById("filename");
if(fnameInput){
fnameInput.value=item.name;
fnameInput.addEventListener('change',function (){

var val=this.value.toUpperCase();

var santized=val.replace(/[^A-Z0-9]/g,'');
if(!/^[A-Z]/.test(santized)){
if(santized.length>0)santized="N"+santized;
}
santized=santized.substring(0,8);

if(this.value!==santized){
this.value=santized;
}
self.callback(EditorMessage.CHANGEMADE);
});
}

initialiseForm("deleted",item.deleted,this);


var self=this;


var encCheckbox=document.getElementById("is-encrypted");
if(encCheckbox){
encCheckbox.addEventListener('change',function (){

self.callback(EditorMessage.CHANGEMADE);
});
}


var pwelemnt=document.getElementById("password");
pwelemnt.value="";


var numEl=document.getElementById("numbered");
if(numEl){
var isNum=(this.item.child.child.data[2]&0x80)!=0;
numEl.checked=isNum;
numEl.addEventListener('change',function (){
var checked=this.checked;
if(self.codeEditorInstance){
self.codeEditorInstance.setShowLineNumbers(checked);
}
self.callback(EditorMessage.CHANGEMADE);
});
}


this.reloadContent(true);


if(this.codeEditorContainer){
var legacyTextarea=document.getElementById('notepad');


if(legacyTextarea)legacyTextarea.style.display='none';






if(!this.codeEditorWrapper){
this.codeEditorWrapper=document.createElement('div');


this.codeEditorWrapper.className='themed-input-no-padding';
this.codeEditorWrapper.style.flex='1';
this.codeEditorWrapper.style.display='flex';
this.codeEditorWrapper.style.overflow='hidden';
this.codeEditorWrapper.style.minHeight='0';



if(legacyTextarea&&legacyTextarea.parentNode){
legacyTextarea.parentNode.appendChild(this.codeEditorWrapper);
}
}
this.codeEditorWrapper.style.display='flex';


if(!this.codeEditorInstance){

var showLineNums=false;
var numCb=document.getElementById('numbered');
if(numCb)showLineNums=numCb.checked;

this.codeEditorInstance=new CodeEditor(this.codeEditorWrapper,{
value:"",
language:'text',
readOnly:true,
lineNumbers:showLineNums,
folding:false,
minimap:{enabled:false},
theme:ThemeManager.currentTheme
});



this.codeEditorInstance.container.style.backgroundColor='transparent';

if(this.codeEditorInstance.gutter){
this.codeEditorInstance.gutter.style.backgroundColor='transparent';
this.codeEditorInstance.gutter.style.borderRight='1px solid var(--border-color)';
}

this.codeEditorInstance.onChange=function (){
self.callback(EditorMessage.CHANGEMADE);

};
}


this.syncEditorContent();

this.baselineData=this.getNotepadData();
}
}

LZNotepadFileEditor.prototype.reloadContent=function (initialLoad){
var chld=this.item.child.child;
var lnheader=chld.data[0]*256+chld.data[1];
var lnnotes=chld.data[lnheader+2]*256+chld.data[lnheader+3];
var isEncrypted=(lnheader>=2&&chld.data[3]!=0);

var fullText="";
var isDecrypted=false;

if(!isEncrypted){

for(var i=0;i<lnnotes;i++){
var c=chld.data[lnheader+4 + i];
fullText+=(c==0)?"\n":String.fromCharCode(c);
}
isDecrypted=true;
}else {
fullText="Encrypted Notepad";
}


var encCb=document.getElementById("is-encrypted");
if(initialLoad&&encCb)encCb.checked=isEncrypted;




if(isDecrypted){
this.displayDecryptedContent(fullText);
}else {

this.currentTitle=this.item.name||"********";


var titleS="";
var ptr=lnheader+4;
while(ptr<chld.data.length){
var c=chld.data[ptr++];
if(c===58)break;
titleS+=String.fromCharCode(c);
if(titleS.length>8)break;
}
this.currentTitle=titleS;
this.currentBody="Encrypted Content";

document.getElementById("notepad").disabled=true;
document.getElementById("notepad-body-helper").style.display='block';
this.syncEditorContent();
}


var fnInput=document.getElementById("filename");
if(fnInput)fnInput.value=this.item.name;
}

LZNotepadFileEditor.prototype.displayDecryptedContent=function (fullText){
var colonIdx=fullText.indexOf(':');
if(colonIdx>=0&&colonIdx<=8){
this.currentTitle=fullText.substring(0,colonIdx);
this.currentBody=fullText.substring(colonIdx+1);
if(this.currentBody.startsWith('\n')){
this.currentBody=this.currentBody.substring(1);
}
}else {
this.currentTitle="UNKNOWN";
this.currentBody=fullText;
}

document.getElementById("notepad").disabled=false;
document.getElementById("notepad-body-helper").style.display='none';


var fnInput=document.getElementById("filename");
if(fnInput)fnInput.value=this.item.name;

this.syncEditorContent();
}

LZNotepadFileEditor.prototype.syncEditorContent=function (){
var isRO=document.getElementById("notepad").disabled;
if(this.codeEditorInstance){

if(this.codeEditorInstance.getValue()!==this.currentBody){
this.codeEditorInstance.setValue(this.currentBody);
}
this.codeEditorInstance.setReadOnly(isRO);
this.codeEditorInstance.update();
}
}

LZNotepadFileEditor.prototype.finish=function (){
BlockFileEditor.prototype.finish.call(this);
if(this.codeEditorWrapper){
this.codeEditorWrapper.style.display='none';
}
}

LZNotepadFileEditor.prototype.getNotepadData=function (){
var title=document.getElementById("filename").value;
var password=document.getElementById("password").value;
var encrypt=document.getElementById("is-encrypted").checked;
var body="";



if(this.codeEditorInstance){
body=this.codeEditorInstance.getValue();
}else {
body=document.getElementById("notepad").value;
}




var titleValid = /^[A-Za-z][A-Za-z0-9]{0,7}$/.test(title);
if(!titleValid){



title=title.replace(/[^A-Za-z0-9]/g,'');
if(title.length===0)title="Unk";
if(!/^[A-Za-z]/.test(title))title="N"+title;
title=title.substring(0,8);
}











var fullText=title+":"+(body.length>0?"\n"+body:"");


var chld=this.item.child.child;
var lnh=chld.data[0]*256+chld.data[1];
var wasEncrypted=(lnh>=2&&chld.data[3]!=0);





var encodedData;
var newlnheader=11;

if(wasEncrypted&&!encrypt){





var passkey=calcNotepadKey(password,false);
var ln=chld.data[0]*256+chld.data[1]+4;
fullText=decodeMessage(passkey,chld.data,ln);


encodedData=[];
for(var i=0;i<fullText.length;i++){
var c=fullText.charCodeAt(i);
encodedData.push((c===10)?0:c);
}
}else {





if(wasEncrypted&&encrypt&&password===""){







return new Uint8Array(chld.data);
}

if(encrypt&&password!==""){

var passkey=calcNotepadKey(password,false);
encodedData=encodeMessage(passkey,fullText);
}else {

encodedData=[];
for(var i=0;i<fullText.length;i++){
var c=fullText.charCodeAt(i);
encodedData.push((c===10)?0:c);
}
}
}


var newdata=new Uint8Array(2+newlnheader+2 + encodedData.length);
var nmbd=document.getElementById("numbered").checked;

if(encrypt&&password!==""){
newlnheader=11;
}else {
newlnheader=2;
}

newdata[0]=(newlnheader>>8)&0xff;
newdata[1]=newlnheader&0xff;


newdata[2]=(chld.data[2]&0x7f)+(nmbd?0x80:0);

if(encrypt&&password!==""){
newdata[3]=9;

var passkey=calcNotepadKey(password,true);
for(var i=0;i<9;i++)newdata[4+i]=passkey[i];
}else {
newdata[3]=0;

}


var dlen=encodedData.length;
var offset=2+newlnheader;
newdata[offset]=(dlen>>8)&0xff;
newdata[offset+1]=dlen&0xff;


for(var i=0;i<dlen;i++)newdata[offset+2 + i]=encodedData[i];

return newdata;
}

LZNotepadFileEditor.prototype.hasUnsavedChanges=function (){
if(BlockFileEditor.prototype.hasUnsavedChanges.call(this))return true;
var chld=this.item.child.child;
var newdata=this.getNotepadData();
var original=this.baselineData||chld.data;
return!arraysAreEqual(newdata,original);
}

LZNotepadFileEditor.prototype.applyChanges=function (){

var encrypt=document.getElementById("is-encrypted").checked;
var password=document.getElementById("password").value;


var chldBefore=this.item.child.child;
var lnh=chldBefore.data[0]*256+chldBefore.data[1];
var wasEncrypted=(lnh>=2&&chldBefore.data[3]!=0);



if(wasEncrypted&&!encrypt){
if(password===""){
alert("Password required to decrypt.");
document.getElementById("is-encrypted").checked=true;
return false;
}

var passkey=calcNotepadKey(password,true);
var match=true;
if(chldBefore.data.length<13)match=false;
else {
for(var i=0;i<9;i++){
if(passkey[i]!=chldBefore.data[4+i]){match=false;break;};
}
}
if(!match){
alert("Incorrect password.");
document.getElementById("is-encrypted").checked=true;
document.getElementById("password").value="";
return false;
}
}


if(wasEncrypted&&encrypt&&password!==""){


var currentBody=(this.codeEditorInstance)?this.codeEditorInstance.getValue():document.getElementById("notepad").value;
if(currentBody==="Encrypted Content"&&document.getElementById("notepad").disabled){
alert("To change the password, you must first decrypt the file (Uncheck Encrypt -> Apply).");
document.getElementById("password").value="";
return false;
}
}

var chld=this.item.child.child;
var newdata=this.getNotepadData();
var differ=!arraysAreEqual(newdata,chld.data);
var nameChanged=false;

if(differ){
this.baselineData=newdata;
chld.setData(newdata);
chld=this.item.child;
var ln=newdata.length;
chld.data[2]=(ln>>8)&0xff;
chld.data[3]=ln&0xff;



var title=document.getElementById("filename").value;

title=title.replace(/[^A-Za-z0-9]/g,'');
if(title.length===0)title="Unk";
if(!/^[A-Z]/.test(title))title="N"+title;
title=title.substring(0,8);

if(this.item.name!==title){
this.item.name=title;
this.item.text=title;
nameChanged=true;

var fnInput=document.getElementById('filename');
if(fnInput)fnInput.value=title;
}
}

var baseResult=false;
try{
baseResult=BlockFileEditor.prototype.applyChanges.call(this);
}catch(e){}

if(nameChanged){
if(window.updateInventory)window.updateInventory();
else if(window.opkedit_refresh_view)window.opkedit_refresh_view();
}


if(encrypt&&password!==""){
document.getElementById("password").value="";
}


this.reloadContent(true);

return baseResult||differ||nameChanged;
}