'use strict';


class PackContentsView{
constructor(containerElement){
this.container=containerElement;
this.dragSrcInfo=null;


this.handleDragOver=this.handleDragOver.bind(this);
this.handleDragEnter=this.handleDragEnter.bind(this);
this.handleDragLeave=this.handleDragLeave.bind(this);
this.handleDrop=this.handleDrop.bind(this);
this.handleDragEnd=this.handleDragEnd.bind(this);
this.render=this.render.bind(this);
}

setContainer(newContainer){
this.container=newContainer;
this.render();
}

render(){
if(!this.container)return;

if(this.dragSrcInfo){
return;
}

var container=this.container;



var focusedElement=document.activeElement;
var focusedPackIdx=null;
var focusedItemIdx=null;

if(focusedElement&&container.contains(focusedElement)){
focusedPackIdx=focusedElement.getAttribute('data-pack-idx');
focusedItemIdx=focusedElement.getAttribute('data-item-idx');
}


while(container.firstChild){
container.removeChild(container.firstChild);
}

if(typeof checksumselement!=='undefined'&&checksumselement)checksumselement.innerHTML="";


var sidebarHeader=document.getElementById('sidebar-header');
if(sidebarHeader){

if(!sidebarHeader.querySelector('.recycle-btn')){
var btnRecycle=document.createElement('i');
btnRecycle.className='fas fa-recycle recycle-btn';
btnRecycle.title="Toggle Deleted Status";

btnRecycle.onclick=function (e){
e.preventDefault();
e.stopPropagation();

var targets=[];

if(typeof selectedItems!=='undefined'&&selectedItems.length>0){

if(currentItem&&selectedItems.indexOf(currentItem)!==-1){
targets=selectedItems;
}else {


targets=selectedItems;
}
}else if(typeof currentItem!=='undefined'&&currentItem){
targets=[currentItem];
}

if(targets.length===0){
alert("No item selected.");
return;
}

var changed=false;

targets.forEach(function (item){

item.deleted=!item.deleted;


if(item.data&&item.data.length>1){
if(item.deleted){
item.data[1]&=0x7F;
}else {
item.data[1]|=0x80;
}
}


if(item.setDescription)item.setDescription();
changed=true;
});

if(changed){


if(typeof packs!=='undefined'&&typeof currentPackIndex!=='undefined'&&packs[currentPackIndex]){
packs[currentPackIndex].unsaved=true;
}


if(typeof saveSession!=='undefined'){
saveSession();
}

updateInventory();
}
};
sidebarHeader.appendChild(btnRecycle);
}
}

if(packs.length>0){

var activePack=getActivePack();
if(activePack){
if(typeof fileinfoelement!=='undefined'&&fileinfoelement){
fileinfoelement.innerText=activePack.filename?activePack.filename:"Untitled";
}

if(activePack.checksums&&typeof checksumselement!=='undefined'&&checksumselement){
checksumselement.innerText="Sum: 0x"+activePack.checksums.sum.toString(16).toUpperCase().padStart(8,'0')+
" CRC32: 0x"+activePack.checksums.crc32.toString(16).toUpperCase()+
" MD5: "+activePack.checksums.md5;
}
}else {
if(typeof fileinfoelement!=='undefined'&&fileinfoelement)fileinfoelement.innerText="No Pack Selected";
}


var fragment=document.createDocumentFragment();

for(var pIdx=0;pIdx<packs.length;pIdx++){
var pack=packs[pIdx];

if(pack.unsaved||!pack.checksums){
updatePackChecksums(pack);
}

var packWrapper=this.createPackElement(pack,pIdx);
fragment.appendChild(packWrapper);
}
container.appendChild(fragment);





}else {
if(typeof fileinfoelement!=='undefined'&&fileinfoelement)fileinfoelement.innerText="No Packs";
}

updateItemButtons(false);


if(focusedPackIdx!==null){
var selector='[data-pack-idx="'+focusedPackIdx+'"]';
if(focusedItemIdx!==null){
selector+='[data-item-idx="'+focusedItemIdx+'"]';
}else {
selector='.pack-header'+selector;
}
var elementToFocus=container.querySelector(selector);
if(elementToFocus){
elementToFocus.focus();
}
}
}

createPackElement(pack,pIdx){
var packWrapper=document.createElement('div');
packWrapper.className='pack-wrapper';


var packHeader=document.createElement('div');
packHeader.className='pack-header';
packHeader.setAttribute('data-pack-idx',pIdx);
packHeader.setAttribute('tabindex','0');
if(pIdx===currentPackIndex&&selectedPackIndex===pIdx){
packHeader.classList.add('selected');
}

var icon=document.createElement('i');
icon.classList.add('pack-icon','fa-fw');

var style=OptionsManager.getOption('iconStyle')||'solid';
var prefix=(style==='solid')?'fas':'far';

if(pack.collapsed){
icon.classList.add(prefix,'fa-folder');
}else {
icon.classList.add(prefix,'fa-folder-open');
}


icon.addEventListener('mouseenter',function (e){
var rect=e.target.getBoundingClientRect();
TooltipManager.show(rect.left,rect.bottom,this.generatePackTooltip(pack));
}.bind(this));
icon.addEventListener('mouseleave',function (){
TooltipManager.hide();
});


icon.classList.add('clickable');
icon.title="Click to visualize System Map";


icon.addEventListener('mousedown',function (e){
e.preventDefault();
e.stopPropagation();
});

icon.addEventListener('click',function (e){
e.preventDefault();
e.stopPropagation();




var viz=(typeof CodeVisualizer!=='undefined')?CodeVisualizer:window.CodeVisualizer;
if(viz){
viz.showSystemMap(packs);
}else {

alert("Visualizer component not loaded.");
}
});

var title=document.createElement('span');
title.className='pack-title';
title.innerText=pack.filename?pack.filename:"Untitled Pack "+(pIdx+1);


title.addEventListener('mouseenter',function (e){
var rect=e.target.getBoundingClientRect();
TooltipManager.show(rect.left,rect.bottom,this.generatePackTooltip(pack));
}.bind(this));
title.addEventListener('mouseleave',function (){
TooltipManager.hide();
});


var toggle=document.createElement('i');
toggle.className='fas fa-chevron-down pack-toggle';
if(pack.collapsed){
toggle.className='fas fa-chevron-right pack-toggle';
}

packHeader.appendChild(icon);
packHeader.appendChild(title);
packHeader.appendChild(toggle);


var self=this;
packHeader.addEventListener('focus',function (){

if(typeof selectedPackIndex!=='undefined'&&selectedPackIndex!==pIdx){


selectPack(pIdx);
}
});

packHeader.addEventListener('click',function (e){
if(e.target.classList.contains('pack-toggle')){
packs[pIdx].collapsed=!packs[pIdx].collapsed;
self.render();
e.stopPropagation();
return;
}
selectPack(pIdx);
});


title.addEventListener('dblclick',function (e){
e.stopPropagation();
var input=document.createElement('input');
input.type='text';
input.className='rename-input';
input.value=packs[pIdx].filename?packs[pIdx].filename:"Pack"+(pIdx+1)+".opk";

function saveName(){
var newName=input.value.trim();
if(newName){
if(!newName.toLowerCase().endsWith(".opk")){
newName+=".opk";
}
packs[pIdx].filename=newName;
packs[pIdx].unsaved=true;
}
self.render();
}

input.addEventListener('blur',saveName);
input.addEventListener('keydown',function (e){
e.stopPropagation();
if(e.key==='Enter'){
saveName();
}
});

title.innerHTML='';
title.appendChild(input);


input.addEventListener('click',function (e){e.stopPropagation();});
input.addEventListener('dblclick',function (e){e.stopPropagation();});
input.addEventListener('mousedown',function (e){e.stopPropagation();});

input.focus();
});

packHeader.addEventListener('keydown',function (e){
if(e.key==='Enter'){
e.preventDefault();
selectPack(pIdx);
}else if(e.key==='Delete'||e.key==='Backspace'){
e.preventDefault();

selectPack(pIdx);
if(typeof eraseItem==='function'){
eraseItem(e.shiftKey);
}
}else if(e.key==='ArrowRight'){
if(pack.collapsed){
pack.collapsed=false;
self.render();
}
}else if(e.key==='ArrowLeft'){
if(!pack.collapsed){
pack.collapsed=true;
self.render();
}
}else if(e.key==='ArrowDown'){
e.preventDefault();
var pWrapper=this.closest('.pack-wrapper');

if(!pack.collapsed&&pWrapper.querySelector('.pack-contents')){
var firstItem=pWrapper.querySelector('.pack-item-row');
if(firstItem)firstItem.focus();
}else {
var nextPack=pWrapper.nextElementSibling;
if(nextPack){
var nextHeader=nextPack.querySelector('.pack-header');
if(nextHeader)nextHeader.focus();
}
}
}else if(e.key==='ArrowUp'){
e.preventDefault();
var pWrapper=this.closest('.pack-wrapper');
var prevPack=pWrapper.previousElementSibling;
if(prevPack){

var prevPackIdx=pIdx-1;
if(prevPackIdx>=0&&!packs[prevPackIdx].collapsed){
var items=prevPack.querySelectorAll('.pack-item-row');
if(items.length>0){
items[items.length-1].focus();
}else {
var prevHeader=prevPack.querySelector('.pack-header');
if(prevHeader)prevHeader.focus();
}
}else {
var prevHeader=prevPack.querySelector('.pack-header');
if(prevHeader)prevHeader.focus();
}
}
}
});

packWrapper.appendChild(packHeader);


if(!pack.collapsed){
var packContents=document.createElement('ul');
packContents.className='pack-contents';

var pl=Math.max(4,pack.getLength().toString(16).length);
var ix=0;
var items=pack.items;



var groupRecords=OptionsManager.getOption('groupDataRecords');
var itemsToRender=[];
var childCounts={};
var dataFileIndices={};
var dataFileChildren={};
var childIndices=new Set();


for(var i=0;i<items.length;i++){
delete items[i].isLastChild;
}


for(var i=0;i<items.length;i++){
if(items[i].type===1&&items[i].data&&items[i].data.length>10){
var rType=items[i].data[10]&0x7f;

if(rType>0&&rType<16)rType+=15;
dataFileIndices[rType]=i;
childCounts[i]=0;
dataFileChildren[i]=[];
}
}


for(var i=0;i<items.length;i++){
if(items[i].type>=16&&items[i].type<=126){
var parentIdx=dataFileIndices[items[i].type];
if(parentIdx!==undefined){
childCounts[parentIdx]++;
if(groupRecords){
dataFileChildren[parentIdx].push(i);
childIndices.add(i);
}
}
}
}

if(groupRecords){

for(var parentIdx in dataFileChildren){
var children=dataFileChildren[parentIdx];
if(children.length>0){
items[children[children.length-1]].isLastChild=true;
}
}


for(var i=0;i<items.length;i++){
if(childIndices.has(i))continue;

var item=items[i];
itemsToRender.push({item:item,index:i,indent:false});


if(item.type===1&&dataFileChildren[i]&&dataFileChildren[i].length>0){
if(typeof item.collapsed==='undefined'){
item.collapsed=!!OptionsManager.getOption('collapseDataFiles');
}

if(!item.collapsed){
var children=dataFileChildren[i];
for(var k=0;k<children.length;k++){
var childIdx=children[k];
itemsToRender.push({item:items[childIdx],index:childIdx,indent:true});
}
}
}
}
}else {

for(var i=0;i<items.length;i++){
itemsToRender.push({item:items[i],index:i,indent:false});
}
}


packContents.innerHTML='';


var addressMap=[];
var currentAddr=0;
for(var i=0;i<items.length;i++){
addressMap[i]=currentAddr;
currentAddr+=items[i].getLength();
}

for(var i=0;i<itemsToRender.length;i++){
var renderItem=itemsToRender[i];
var item=renderItem.item;
var originalIndex=renderItem.index;
var address=addressMap[originalIndex];
var count=(childCounts[originalIndex]!==undefined)?childCounts[originalIndex]:0;

var itemRow=this.createItemRow(item,pIdx,originalIndex,address,pl,renderItem.indent,count,groupRecords);

itemRow.setAttribute('data-pack-idx',pIdx);
itemRow.setAttribute('data-item-idx',originalIndex);
packContents.appendChild(itemRow);
}




packWrapper.appendChild(packContents);
}

return packWrapper;
}

createItemRow(item,packIndex,itemIndex,address,addrLen,indent,childCount,showGrouping){
var row=document.createElement('li');
row.className='pack-item-row';
if(currentItem===item){
row.classList.add('selected');
}else if(typeof selectedItems!=='undefined'&&selectedItems.indexOf(item)!==-1){
row.classList.add('selected');
}


if(item.deleted){
row.classList.add('deleted-item');
}


var itemIcon=document.createElement('span');
itemIcon.className='item-icon';
if(indent){
row.classList.add('subordinate-item');
if(item.isLastChild){
row.classList.add('subordinate-last');
}
}
var iconClass=getItemIcon(item);
itemIcon.innerHTML=`<i class="${iconClass}"></i>`;


if(item.type===1&&showGrouping&&childCount>0){
itemIcon.classList.add('clickable');
var countStr=" ("+childCount+" records)";
itemIcon.title=(item.collapsed?"Click to expand records":"Click to collapse records")+countStr;

var self=this;
itemIcon.addEventListener('click',function (e){
e.preventDefault();
e.stopPropagation();

item.collapsed=!item.collapsed;
self.render();
});
}

row.appendChild(itemIcon);


itemIcon.addEventListener('mouseenter',function (e){
if(this.dragSrcInfo)return;
var rect=e.target.getBoundingClientRect();
TooltipManager.show(rect.left,rect.bottom,this.generateItemTooltip(item,address,childCount));
}.bind(this));
itemIcon.addEventListener('mouseleave',function (){
TooltipManager.hide();
});


var descText=getItemDescription(item);






var itemAddr=document.createElement('span');
itemAddr.className='item-addr';
itemAddr.innerText=address.toString(16).toUpperCase().padStart(addrLen,'0');
row.appendChild(itemAddr);


var itemName=document.createElement('span');
itemName.className='item-name';
itemName.innerText=item.name;
row.appendChild(itemName);


var itemDesc=document.createElement('span');
itemDesc.className='item-desc';
itemDesc.innerText=descText;

if(item.type===3&&(descText==="OPL Procedure"||descText==="OPL Object"||descText==="OPL Text")){
itemDesc.classList.add('clickable');
itemDesc.style.textDecoration="none";
itemDesc.title="Click to view Translated Q-Code (Hex)";

itemDesc.addEventListener('click',function (e){
if(!OptionsManager.getOption('enableHexView'))return;
e.stopPropagation();
if(item.getFullData){
var data=item.getFullData();
if(data&&data.length>0){
if(typeof HexViewer!=='undefined')HexViewer.show(data,descText+" Record: "+item.name);
}else {
alert("No Data found.");
}
}else if(item.child&&item.child.child&&item.child.child.data){

var data=item.child.child.data;
if(data&&data.length>0){
if(typeof HexViewer!=='undefined')HexViewer.show(data,descText+" Record: "+item.name);
}else {
alert("No Data found.");
}
}
});
}

row.appendChild(itemDesc);


row.addEventListener('click',function (e){
e.stopPropagation();
itemSelected(packIndex,itemIndex,e);
});


row.setAttribute('tabindex','0');
row.addEventListener('focus',function (){

if(currentItem!==item){

if(typeof PackContents!=='undefined')PackContents.selectItem(packIndex,itemIndex);
}
});

row.addEventListener('keydown',function (e){
if(e.key==='Enter'){
e.preventDefault();
itemSelected(packIndex,itemIndex,e);
}else if(e.key==='Delete'||e.key==='Backspace'){
e.preventDefault();

if(typeof eraseItem==='function'){
eraseItem(e.shiftKey);
}else {

if(confirm("Are you sure you want to delete '"+item.name+"'?")){









}
}
}else if(e.key==='ArrowDown'){
e.preventDefault();
var next=row.nextElementSibling;
if(next){
next.focus();
}else {

var packWrapper=row.closest('.pack-wrapper');
var nextPack=packWrapper?packWrapper.nextElementSibling:null;
if(nextPack){
var nextHeader=nextPack.querySelector('.pack-header');
if(nextHeader)nextHeader.focus();
}
}
}else if(e.key==='ArrowUp'){
e.preventDefault();
var prev=row.previousElementSibling;
if(prev){
prev.focus();
}else {

var packWrapper=row.closest('.pack-wrapper');
var header=packWrapper?packWrapper.querySelector('.pack-header'):null;
if(header)header.focus();
}
}
});


var isHeader=(itemIndex===0);
var isMain=(item.name==="MAIN");
var isEOP=(item.type===255);


if(isEOP&&typeof packs!=='undefined'&&packs[packIndex]){
var p=packs[packIndex];
if(p.items&&p.items.length>0&&p.items[0].data){
var sizeCode=p.items[0].data[1];
var limit=sizeCode*8192;
if(address>limit){
row.style.color='#cd5c5c';
row.title="Warning: Pack Overflow! (Used: "+(address/1024).toFixed(2)+"KB, Limit: "+(limit/1024)+"KB)";
itemDesc.style.textDecoration='line-through';
if(itemName)itemName.style.textDecoration='line-through';

itemAddr.style.color='#cd5c5c';
}
}
}



if(!isHeader&&!isMain&&!isEOP){

row.setAttribute('draggable','true');
row.addEventListener('dragstart',function (e){
this.handleDragStart(e,packIndex,itemIndex);
}.bind(this));
}else {

row.removeAttribute('draggable');
}

row.addEventListener('dragover',this.handleDragOver.bind(this));
row.addEventListener('drop',function (e){
if(itemIndex===0)return;
if(item.name==="MAIN")return;
this.handleDrop(e,packIndex,itemIndex);
}.bind(this));
row.addEventListener('dragenter',this.handleDragEnter.bind(this));
row.addEventListener('dragleave',this.handleDragLeave.bind(this));
row.addEventListener('dragend',this.handleDragEnd.bind(this));

return row;
}

generatePackTooltip(pack){
var totals={
dataFiles:0,
records:0,
procedures:0,
text:0
};

pack.items.forEach(function (item){
if(item.deleted)return;
var type=item.type;
if(type===1){
totals.dataFiles++;
}else if(type>=16&&type<=126){
totals.records++;
}else if(type===3){

var isProc=false;
if(item.child&&item.child.child&&item.child.child.data){
var data=item.child.child.data;
if(data.length>=4){
var obLen=(data[0]<<8)|data[1];
if(obLen>0)isProc=true;
}
}
if(isProc)totals.procedures++;
else totals.text++;
}
});

var html="<h4>"+(pack.filename||"Untitled Pack")+"</h4>";
html+="<div class='tooltip-row'><span class='tooltip-label'>Total Items:</span><span class='tooltip-value'>"+pack.items.length+"</span></div>";
html+="<div class='tooltip-row'><span class='tooltip-label'>Size:</span><span class='tooltip-value'>"+pack.getLength()+" bytes</span></div>";
html+="<hr class='tooltip-divider'>";

if(totals.dataFiles>0)html+="<div class='tooltip-row'><span class='tooltip-label'>Data Files:</span><span class='tooltip-value'>"+totals.dataFiles+"</span></div>";
if(totals.records>0)html+="<div class='tooltip-row'><span class='tooltip-label'>Records:</span><span class='tooltip-value'>"+totals.records+"</span></div>";
if(totals.procedures>0)html+="<div class='tooltip-row'><span class='tooltip-label'>OPL Procedures:</span><span class='tooltip-value'>"+totals.procedures+"</span></div>";
if(totals.text>0)html+="<div class='tooltip-row'><span class='tooltip-label'>OPL Text:</span><span class='tooltip-value'>"+totals.text+"</span></div>";

return html;
}

generateItemTooltip(item,address,childCount){
var html="<h4>"+(item.name||"Item")+"</h4>";
html+="<div class='tooltip-row'><span class='tooltip-label'>Type:</span><span class='tooltip-value'>"+getItemDescription(item)+" ("+item.type+")</span></div>";
html+="<div class='tooltip-row'><span class='tooltip-label'>Address:</span><span class='tooltip-value'>0x"+address.toString(16).toUpperCase()+"</span></div>";
html+="<div class='tooltip-row'><span class='tooltip-label'>Length:</span><span class='tooltip-value'>"+item.getLength()+" bytes</span></div>";

if(item.type===1&&childCount!==undefined){
html+="<div class='tooltip-row'><span class='tooltip-label'>Records:</span><span class='tooltip-value'>"+childCount+"</span></div>";
}
html+="<div class='tooltip-row'><span class='tooltip-label'>Status:</span><span class='tooltip-value'>"+(item.deleted?"Deleted":"Active")+"</span></div>";


if(typeof Checksums!=='undefined'&&item.getFullData){
var data=item.getFullData();
var crc=Checksums.crc32(data);
html+="<div class='tooltip-row'><span class='tooltip-label'>CRC32:</span><span class='tooltip-value'>0x"+crc.toString(16).toUpperCase().padStart(8,'0')+"</span></div>";
}

return html;
}



handleDragStart(e,packIndex,itemIndex){

this.dragSrcInfo={packIndex:packIndex,itemIndex:itemIndex};
e.dataTransfer.effectAllowed='copyMove';
e.dataTransfer.setData('text/html',e.currentTarget.outerHTML);
e.currentTarget.classList.add('dragElem');
}

handleDragOver(e){
if(e.preventDefault)e.preventDefault();
e.dataTransfer.dropEffect=e.ctrlKey?'copy':'move';
e.currentTarget.classList.add('over');
return false;
}

handleDragEnter(e){
if(!this.dragSrcInfo)return;
e.currentTarget.classList.add('over');
}

handleDragLeave(e){


if(e.relatedTarget&&e.currentTarget.contains(e.relatedTarget))return;
e.currentTarget.classList.remove('over');
}

handleDrop(e,toPackIndex,toItemIndex){
if(e.stopPropagation)e.stopPropagation();


if(e.dataTransfer.files&&e.dataTransfer.files.length>0){
if(typeof importFilesToPack==='function'){
importFilesToPack(toPackIndex,e.dataTransfer.files);
}
return false;
}

if(!this.dragSrcInfo)return;


var srcPackIdx=this.dragSrcInfo.packIndex;
var srcItemIdx=this.dragSrcInfo.itemIndex;
var isCopy=e.ctrlKey;




this.dragSrcInfo=null;

if(typeof itemMoved==='function'){
itemMoved(srcPackIdx,srcItemIdx,toPackIndex,toItemIndex,isCopy);
}
return false;
}

handleDragEnd(e){
if(!this.container)return;
var cols=this.container.querySelectorAll('li');
[].forEach.call(cols,function (col){
col.classList.remove('over');
col.classList.remove('dragElem');
});
this.dragSrcInfo=null;
}


selectItem(packIndex,itemIndex){
if(!this.container)return;
var headers=this.container.querySelectorAll('.pack-header');
headers.forEach(function (h){h.classList.remove('selected');});


var items=this.container.querySelectorAll('.pack-item-row');
items.forEach(function (row){
var rowPIdx=parseInt(row.getAttribute('data-pack-idx'));
var rowIIdx=parseInt(row.getAttribute('data-item-idx'));

var isSelected=false;
if(typeof selectedItems!=='undefined'&&typeof packs!=='undefined'){
if(rowPIdx===packIndex&&packs[rowPIdx]&&packs[rowPIdx].items){
var it=packs[rowPIdx].items[rowIIdx];

if(selectedItems.indexOf(it)!==-1){
isSelected=true;
}
}
}

if(isSelected)row.classList.add('selected');
else row.classList.remove('selected');
});


var target=this.container.querySelector('.pack-item-row[data-pack-idx="'+packIndex+'"][data-item-idx="'+itemIndex+'"]');
if(target){
target.focus();
target.scrollIntoView({behavior:'auto',block:'nearest'});
}
}

selectPack(packIndex){
if(!this.container)return;
var headers=this.container.querySelectorAll('.pack-header');
headers.forEach(function (h){h.classList.remove('selected');});
var items=this.container.querySelectorAll('.pack-item-row');
items.forEach(function (i){i.classList.remove('selected');});

var target=this.container.querySelector('.pack-header[data-pack-idx="'+packIndex+'"]');
if(target){
target.classList.add('selected');
target.focus();
}
}
}



var PackContents=new PackContentsView(document.getElementById("pack-list"));