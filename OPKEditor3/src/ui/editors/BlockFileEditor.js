'use strict';



function BlockFileEditor(editorelement,callback,types,codeEditorContainer){
FileEditor.call(this,editorelement,callback,types,codeEditorContainer);
}
BlockFileEditor.prototype=Object.create(FileEditor.prototype);
BlockFileEditor.prototype.initialise=function (item,extraelement){
if(!this.myelement){
var newelement=document.createElement('div');
newelement.className='record-header-wrapper';
newelement.innerHTML=
"<div class='native-section-title' data-target='record-header-content'>Record Header</div>" +
"<div id='record-header-content' class='collapsible-content legacy-editor-container'>" +
"<form action='#'><div class='record-header-fieldset'>" +
"<div class='record-header-fields'>" +
"<span>File name: <input type='text' id='filename' size='10'></span>" +
"<span class='deleted-checkbox-wrapper'><input type='checkbox' id='deleted'><label for='deleted'>Deleted</label></span>" +
"</div>" +
"</div></form>" +
"</div>";


var title=newelement.querySelector('.native-section-title');
title.addEventListener('click',function (){
var content=this.nextElementSibling;
if(content&&content.classList.contains('collapsible-content')){
this.classList.toggle('collapsed');
content.classList.toggle('collapsed');
}
});

if(extraelement){
var el=document.createElement('div');
el.appendChild(newelement);
el.appendChild(extraelement);
this.myelement=el;
}else {
this.myelement=newelement;
}
}
this.editorelement.appendChild(this.myelement);


this.item=item;
initialiseForm("filename",item.name,this);
initialiseForm("deleted",item.deleted,this);
}
BlockFileEditor.prototype.getBlockHeaderData=function (){
var newdata=new Uint8Array(11);
var filenameElem=document.getElementById("filename");
var deletedElem=document.getElementById("deleted");

var newname=filenameElem?filenameElem.value:(this.item.name||"");
var deleted=deletedElem?deletedElem.checked:this.item.deleted;

newname=(newname+"        ").substr(0,8);
newdata[0]=9;
newdata[1]=this.item.type+(deleted?0:0x80);
for(var i=0;i<8;i++){
newdata[2+i]=newname.charCodeAt(i);
}
newdata[10]=(this.item.data&&this.item.data.length>10)?this.item.data[10]:0;
return newdata;
}
BlockFileEditor.prototype.hasUnsavedChanges=function (){
if(FileEditor.prototype.hasUnsavedChanges.call(this))return true;
var newdata=this.getBlockHeaderData();
return!arraysAreEqual(newdata,this.item.data);
}
BlockFileEditor.prototype.applyChanges=function (){
var newdata=this.getBlockHeaderData();
var differ=!arraysAreEqual(newdata,this.item.data);
if(differ){
this.item.setData(newdata);
this.item.setDescription();
}
return FileEditor.prototype.applyChanges.call(this)|differ;
}