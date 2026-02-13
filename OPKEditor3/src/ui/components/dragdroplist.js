function DragDropList(listelement,moved,numfixedtop,numfixedbottom){
var self=this;
self.listelement=listelement;
self.dragSrcEl=null;
self.moved=moved;

function handleDragStart(e){

self.dragSrcEl=this;
e.dataTransfer.effectAllowed='move';
e.dataTransfer.setData('text/html',this.outerHTML);
this.classList.add('dragElem');
}
function handleDragOver(e){
if(!self.dragSrcEl)return;
if(e.preventDefault)e.preventDefault();
this.classList.add('over');
e.dataTransfer.dropEffect='move';
return false;
}
function handleDragEnter(e){
if(!self.dragSrcEl)return;

}
function handleDragLeave(e){
this.classList.remove('over');
}
function handleDrop(e){
if(!self.dragSrcEl)return;

if(e.stopPropagation)e.stopPropagation();

if(self.dragSrcEl!=this){
var fromIx=findChildIndex(self.dragSrcEl);
var toIx=findChildIndex(this);
self.listelement.insertBefore(self.dragSrcEl,this);

if(self.moved)self.moved(fromIx,toIx);
}
self.dragSrcEl.classList.remove('dragElem');
this.classList.remove('over');
return false;
}
function handleDragEnd(e){

if(self.dragSrcEl)self.dragSrcEl.classList.remove('dragElem');
this.classList.remove('over');
self.dragSrcEl=null;
}
function addDnDHandlers(elem){
elem.addEventListener('dragstart',handleDragStart,false);
elem.addEventListener('dragenter',handleDragEnter,false)
elem.addEventListener('dragover',handleDragOver,false);
elem.addEventListener('dragleave',handleDragLeave,false);
elem.addEventListener('drop',handleDrop,false);
elem.addEventListener('dragend',handleDragEnd,false);
}
function findChildIndex(elem){

var children=self.listelement.childNodes;
for(var i=0;i<children.length;i++){
if(children[i]==elem)return i;
}
return-1;
}


if(listelement.hasChildNodes()){

var children=self.listelement.childNodes;
for(var i=numfixedtop;i<children.length-numfixedbottom;i++){
children[i].draggable=true;
addDnDHandlers(children[i]);
}
if(numfixedbottom>0)addDnDHandlers(children[children.length-numfixedbottom]);
}
}