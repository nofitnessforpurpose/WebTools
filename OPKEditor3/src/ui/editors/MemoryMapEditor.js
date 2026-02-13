'use strict';



function MemoryMapEditor(editorelement,callback){

FileEditor.call(this,editorelement,callback,[-1]);
}
MemoryMapEditor.prototype=Object.create(FileEditor.prototype);


MemoryMapEditor.prototype.acceptsType=function (type){
return type===255;
}

MemoryMapEditor.prototype.initialise=function (item){
if(!this.myelement){
this.myelement=document.createElement('div');
this.myelement.className='memory-map-editor';
}


this.myelement.innerHTML="";


var header=document.createElement('h3');
header.innerText="Data Pack Memory Map";
this.myelement.appendChild(header);


if(typeof renderMemoryMap==='function'&&typeof packs!=='undefined'&&currentPackIndex>=0){
var currentPack=packs[currentPackIndex];
if(currentPack){
var mapContainer=renderMemoryMap(currentPack);
this.myelement.appendChild(mapContainer);
}
}else {
var error=document.createElement('div');
error.innerText="Unable to render memory map.";
this.myelement.appendChild(error);
}

this.editorelement.appendChild(this.myelement);
this.item=item;
}


MemoryMapEditor.prototype.hasUnsavedChanges=function (){return false;}
MemoryMapEditor.prototype.applyChanges=function (){return false;}