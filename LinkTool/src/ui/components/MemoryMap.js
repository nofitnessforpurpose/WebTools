'use strict';




function renderMemoryMap(pack){
var container=document.createElement('div');
container.className='memory-map-container';


var sizeMultiplier=pack.items[0].data[1];


var totalSize=8192*sizeMultiplier;


var usedSize=0;
for(var i=0;i<pack.items.length;i++){
usedSize+=pack.items[i].getLength();
}



var renderTotalSize=Math.max(totalSize,usedSize);


var titleText="Memory Map (Set: "+(totalSize/1024)+" KB";
if(usedSize>totalSize){
titleText+=", Used: "+(Math.round(usedSize/1024*10)/10)+" KB [OVERFLOW]";
}else {
titleText+=")";
}

var title=document.createElement('div');
title.className='memory-map-title';
title.innerText=titleText;
container.appendChild(title);


var canvasContainer=document.createElement('div');
canvasContainer.className='memory-map-bar';
canvasContainer.style.position='relative';
canvasContainer.style.marginTop='15px';
container.appendChild(canvasContainer);


var canvas=document.createElement('canvas');
canvas.style.display='block';
canvasContainer.appendChild(canvas);

var ctx=canvas.getContext('2d');


var orientation=OptionsManager.getOption('memoryMapOrientation')||'horizontal';
var isVertical=(orientation==='vertical');

var showPageBreaks=OptionsManager.getOption('memoryMapShowPageBreaks');
if(showPageBreaks===undefined)showPageBreaks=true;
var displaySize=OptionsManager.getOption('memoryMapDisplaySize')||32768;


function getCSSVar(name){
return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

var colors={
header:getCSSVar('--mm-color-header')||'#808080',
procedure:getCSSVar('--mm-color-procedure')||'#d33682',
datafile:getCSSVar('--mm-color-datafile')||'#268bd2',
diary:getCSSVar('--mm-color-diary')||'#b58900',
comms:getCSSVar('--mm-color-comms')||'#cb4b16',
sheet:getCSSVar('--mm-color-sheet')||'#859900',
pager:getCSSVar('--mm-color-pager')||'#6c71c4',
notepad:getCSSVar('--mm-color-notepad')||'#2aa198',
block:getCSSVar('--mm-color-block')||'#d33682',
record:getCSSVar('--mm-color-record')||'#6c71c4',
unknown:getCSSVar('--mm-color-unknown')||'#dc322f',
free:getCSSVar('--mm-color-free')||'#073642'
};


var chunkSize=displaySize;

var numChunks=Math.ceil(renderTotalSize/chunkSize);


var labelSize=25;






var barThickness=OptionsManager.getOption('memoryMapBarHeight')||30;


var gap=isVertical?40:20;
var padding=20;

var regions=[];


function draw(){
var containerWidth=container.clientWidth;
var containerHeight=container.clientHeight;
if(containerWidth===0||containerHeight===0)return;


canvasContainer.style.overflowX='hidden';
canvasContainer.style.overflowY='hidden';
container.style.display='flex';
container.style.flexDirection='column';

if(isVertical){





var availableHeight=containerHeight-(labelSize*2)-40;

var barHeight=Math.max(100,availableHeight*0.9);



var totalWidth=numChunks*(barThickness+gap)+padding*2;

canvas.width=totalWidth;

canvas.height=Math.round(barHeight+(labelSize*2));

canvas.style.width=totalWidth+'px';
canvas.style.height=canvas.height+'px';






canvasContainer.style.width='100%';
canvasContainer.style.height='100%';
canvasContainer.style.overflowX='auto';
canvasContainer.style.overflowY='auto';

}else {




var availableWidth=containerWidth-(60*2)-20;
var barWidth=Math.max(100,availableWidth);

var totalHeight=Math.ceil(numChunks*(barThickness+gap)+padding*2);


var safeW=Math.max(1,Math.floor(barWidth+(60*2)));
var safeH=Math.max(1,Math.floor(totalHeight));


if(safeH>32000)safeH=32000;

canvas.width=safeW;
canvas.height=safeH;
canvas.style.width=safeW+'px';
canvas.style.height=safeH+'px';

canvasContainer.style.width='100%';
canvasContainer.style.height='100%';
canvasContainer.style.overflowY='auto';
}

var ctx=canvas.getContext('2d');



try{
ctx.clearRect(0,0,canvas.width,canvas.height);
regions=[];


function drawRect(start,len,color,item){
var startChunk=Math.floor(start/chunkSize);
var endChunk=Math.floor((start+len-1)/chunkSize);

for(var c=startChunk;c<=endChunk;c++){
var chunkOffset=c*chunkSize;
var chunkEnd=chunkOffset+chunkSize;

var drawStart=Math.max(start,chunkOffset);
var drawEnd=Math.min(start+len,chunkEnd);
var drawLen=drawEnd-drawStart;

if(drawLen<=0)continue;

var x,y,w,h;

if(isVertical){
var barHeight=canvas.height-(labelSize*2);
var chunkYStart=labelSize;

var relStart=(drawStart-chunkOffset)/chunkSize;
var relLen=drawLen/chunkSize;

x=padding+c*(barThickness+gap);
y=chunkYStart+(relStart*barHeight);
w=barThickness;
h=relLen*barHeight;
}else {
var barWidth=canvas.width-(60*2);
var chunkXStart=60;

var relStart=(drawStart-chunkOffset)/chunkSize;
var relLen=drawLen/chunkSize;

x=chunkXStart+(relStart*barWidth);
y=padding+c*(barThickness+gap);
w=relLen*barWidth;
h=barThickness;
}

ctx.fillStyle=color;
ctx.fillRect(x,y,w,h);


ctx.lineWidth=1;
ctx.strokeStyle='rgba(0, 0, 0, 0.5)';
ctx.strokeRect(x,y,w,h);


if(drawEnd===start+len){
ctx.fillStyle=getCSSVar('--mm-bg')||'#1e1e1e';
if(isVertical)ctx.fillRect(x,y+h - 1,w,1);
else ctx.fillRect(x+w - 1,y,1,h);
}


if(item&&item.deleted){
ctx.fillStyle='rgba(0, 0, 0, 0.5)';
ctx.fillRect(x,y,w,h);


ctx.save();
ctx.beginPath();
ctx.rect(x,y,w,h);
ctx.clip();

ctx.beginPath();
ctx.strokeStyle='rgba(255, 50, 50, 0.5)';
ctx.lineWidth=1;

var spacing=8;


var diagOffset=w+h;
for(var i=-h;i<w;i+=spacing){
ctx.moveTo(x+i,y);
ctx.lineTo(x+i + h+spacing,y+h + spacing);
}
ctx.stroke();
ctx.restore();
}

regions.push({
item:item,offset:start,len:len,
x:x,y:y,w:w,h:h
});
}
}


var currentOffset=0;
for(var i=0;i<pack.items.length;i++){
var item=pack.items[i];
var len=item.getLength();
var color=colors.unknown;

if(item.type===-1)color=colors.header;
else if(item.type===1)color=colors.datafile;
else if(item.type===2)color=colors.diary;
else if(item.type===3)color=colors.procedure;
else if(item.type===4)color=colors.comms;
else if(item.type===5)color=colors.sheet;
else if(item.type===6)color=colors.pager;
else if(item.type===7)color=colors.notepad;
else if(item.type>=8&&item.type<=15)color=colors.block;
else if(item.type>=16&&item.type<=126)color=colors.record;

drawRect(currentOffset,len,color,item);
currentOffset+=len;
}


var usedSize=currentOffset;
var freeSize=totalSize-usedSize;
if(freeSize>0){
drawRect(usedSize,freeSize,colors.free,null);
}




if(showPageBreaks){


var markerColor=getCSSVar('--sidebar-item-text')||'rgba(255, 0, 0, 0.7)';
ctx.fillStyle=markerColor;
var pageSize=256;

for(var offset=pageSize;offset<totalSize;offset+=pageSize){
var c=Math.floor(offset/chunkSize);
var chunkOffset=c*chunkSize;

if(isVertical){
var barHeight=canvas.height-(labelSize*2);
var yOffset=labelSize+((offset-chunkOffset)/chunkSize)*barHeight;
var xOffset=padding+c*(barThickness+gap);

ctx.fillRect(xOffset,yOffset,4,1);
ctx.fillRect(xOffset+barThickness-4,yOffset,4,1);
}else {
var barWidth=canvas.width-(60*2);
var xOffset=60+((offset-chunkOffset)/chunkSize)*barWidth;
var yOffset=padding+c*(barThickness+gap);

ctx.fillRect(xOffset,yOffset,1,4);
ctx.fillRect(xOffset,yOffset+barThickness-4,1,4);
}
}
}


ctx.font='10px Consolas, monospace';
ctx.fillStyle=OptionsManager.getOption('theme')==='light'?'#000':'#ccc';
var arrowColor='rgba(128, 128, 128, 0.5)';

for(var c=0;c<numChunks;c++){
var startAddr=c*chunkSize;
var endAddr=Math.min((c+1)*chunkSize,totalSize)-1;
if(endAddr<startAddr)endAddr=startAddr;

var startHex=startAddr.toString(16).toUpperCase().padStart(4,'0');
var endHex=endAddr.toString(16).toUpperCase().padStart(4,'0');

if(isVertical){
var x=padding+c*(barThickness+gap);
var midX=x+(barThickness/2);



ctx.textAlign='right';

ctx.fillText(startHex,midX-12,labelSize-5);



ctx.textAlign='left';

ctx.fillText(endHex,midX+12,canvas.height-labelSize+12);


if(c<numChunks-1){
var nextX=padding+(c+1)*(barThickness+gap);
var nextMidX=nextX+(barThickness/2);


var startX=midX;
var startY=canvas.height-labelSize+2;
var endX=nextMidX;
var endY=labelSize-2;

var gapCenterX=x+barThickness+(gap/2);


var offsetDist=(labelSize-4)*0.85;
var bottomTurnY=startY+offsetDist;
var topTurnY=endY-offsetDist;

ctx.beginPath();
ctx.strokeStyle=arrowColor;


ctx.moveTo(startX,startY);
ctx.lineTo(startX,bottomTurnY);


ctx.lineTo(gapCenterX,bottomTurnY);


ctx.lineTo(gapCenterX,topTurnY);


ctx.lineTo(endX,topTurnY);


ctx.lineTo(endX,endY);

ctx.stroke();


ctx.beginPath();
ctx.fillStyle=arrowColor;
ctx.moveTo(endX,endY);
ctx.lineTo(endX-3,endY-5);
ctx.lineTo(endX+3,endY-5);
ctx.fill();


ctx.beginPath();
ctx.arc(startX,startY,2,0,Math.PI*2);
ctx.fill();
}

}else {

var y=padding+c*(barThickness+gap);




var startY=y+(barThickness*0.9);
var endY=y+(barThickness*0.1);

ctx.textAlign='right';
ctx.textBaseline='alphabetic';
ctx.fillText(startHex,55,startY);

ctx.textAlign='left';
ctx.textBaseline='hanging';
ctx.fillText(endHex,canvas.width-55,endY);


if(c<numChunks-1){
var rightEdge=canvas.width-60;
var leftEdge=60;

var nextY=padding+(c+1)*(barThickness+gap)+(barThickness/2);
var midGapY=y+barThickness+(gap/2);
var midY=y+(barThickness/2);

ctx.beginPath();
ctx.strokeStyle=arrowColor;
ctx.moveTo(rightEdge,midY);
ctx.lineTo(rightEdge+10,midY);
ctx.lineTo(rightEdge+10,midGapY);
ctx.lineTo(leftEdge-10,midGapY);
ctx.lineTo(leftEdge-10,nextY);
ctx.lineTo(leftEdge,nextY);
ctx.stroke();


ctx.beginPath();
ctx.fillStyle=arrowColor;
ctx.moveTo(leftEdge,nextY);
ctx.lineTo(leftEdge-5,nextY-3);
ctx.lineTo(leftEdge-5,nextY+3);
ctx.fill();
}
}
}
}catch(e){

}
}


setTimeout(draw,0);

setTimeout(draw,500);


if(window.ResizeObserver){
var ro=new ResizeObserver(function (){window.requestAnimationFrame(draw);});
ro.observe(container);
}else {
window.addEventListener('resize',draw);
}


function handleInteraction(e,isClick){
var rect=canvas.getBoundingClientRect();
var scaleX=canvas.width/rect.width;
var scaleY=canvas.height/rect.height;
var mouseX=(e.clientX-rect.left)*scaleX;
var mouseY=(e.clientY-rect.top)*scaleY;

var found=false;
for(var i=0;i<regions.length;i++){
var r=regions[i];
if(mouseX>=r.x&&mouseX<r.x+r.w&&mouseY>=r.y&&mouseY<r.y+r.h){
if(isClick&&r.item&&HexViewer){

var totalLen=r.item.getLength();
var fullData=new Uint8Array(totalLen);
r.item.storeData(fullData,0);
HexViewer.show(fullData,"Hex View: "+(r.item.name||getItemDescription(r.item)));
}else if(!isClick){

var html="";
if(r.item){
var itemName=r.item.name||"Item";
var typeDesc=getItemDescription(r.item);
var childCount=undefined;


if(r.item.type===1&&r.item.data&&r.item.data.length>10){
var rType=r.item.data[10]&0x7f;
if(rType>0&&rType<16)rType+=15;
childCount=0;
for(var j=0;j<pack.items.length;j++){
if(pack.items[j].type===rType)childCount++;
}
}

html="<h4>"+itemName+"</h4>";
html+="<div class='tooltip-row'><span class='tooltip-label'>Type:</span><span class='tooltip-value'>"+typeDesc+" ("+r.item.type+")</span></div>";
html+="<div class='tooltip-row'><span class='tooltip-label'>Offset:</span><span class='tooltip-value'>0x"+r.offset.toString(16).toUpperCase()+"</span></div>";
html+="<div class='tooltip-row'><span class='tooltip-label'>Length:</span><span class='tooltip-value'>"+r.len+" bytes</span></div>";
if(childCount!==undefined){
html+="<div class='tooltip-row'><span class='tooltip-label'>Records:</span><span class='tooltip-value'>"+childCount+"</span></div>";
}
html+="<div class='tooltip-row'><span class='tooltip-label'>Status:</span><span class='tooltip-value'>"+(r.item.deleted?"Deleted":"Active")+"</span></div>";

if(typeof Checksums!=='undefined'&&r.item.getFullData){
var fullData=r.item.getFullData();
var crc=Checksums.crc32(fullData);
var crcStr="0x"+crc.toString(16).toUpperCase();
html+="<div class='tooltip-row'><span class='tooltip-label'>CRC32:</span><span class='tooltip-value'>"+crcStr+"</span></div>";
}
}else {
html="<h4>Free Space</h4>";
html+="<div class='tooltip-row'><span class='tooltip-label'>Offset:</span><span class='tooltip-value'>0x"+r.offset.toString(16).toUpperCase()+"</span></div>";
html+="<div class='tooltip-row'><span class='tooltip-label'>Length:</span><span class='tooltip-value'>"+r.len+" bytes</span></div>";
}

if(typeof TooltipManager!=='undefined'){
TooltipManager.show(e.clientX,e.clientY,html);
}else {
canvas.title=r.item?(itemName+"\nOffset: "+r.offset.toString(16).toUpperCase()):"Free Space";
}
}
found=true;
break;
}
}
if(!isClick&&!found){
canvas.title="";
if(typeof TooltipManager!=='undefined')TooltipManager.hide();
}
}

canvas.addEventListener('mousemove',function (e){handleInteraction(e,false);});
canvas.addEventListener('mouseleave',function (){if(typeof TooltipManager!=='undefined')TooltipManager.hide();});
canvas.addEventListener('click',function (e){handleInteraction(e,true);});


function getAccessCycles(address,pack){
if(!pack||!pack.items||pack.items.length===0)return 0;
var id=pack.items[0].data[0];
var size=pack.items[0].data[1];
var isPaged=(id&0x04)!==0;
var isSegmented=(size===0x10);
if(isSegmented){
var segOffset=address%16384;
return Math.floor(segOffset/256)+(segOffset%256);
}else if(isPaged){
return Math.floor(address/256)+(address%256);
}
return address;
}


var legend=document.createElement('div');
legend.className='memory-map-legend';
function createLegendItem(label,colorKey){
var span=document.createElement('span');
span.className='mm-legend-item';
var swatch=document.createElement('span');
swatch.className='mm-swatch';

if(colorKey==='deleted'){
swatch.style.backgroundColor='rgba(0, 0, 0, 0.5)';

swatch.style.backgroundImage='repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255, 50, 50, 0.5) 4px, rgba(255, 50, 50, 0.5) 5px)';
}else {
swatch.style.backgroundColor=colors[colorKey];
}

span.appendChild(swatch);
span.appendChild(document.createTextNode(label));
return span;
}
legend.appendChild(createLegendItem('Header','header'));
legend.appendChild(createLegendItem('Proc','procedure'));
legend.appendChild(createLegendItem('Data','datafile'));
legend.appendChild(createLegendItem('Free','free'));
legend.appendChild(createLegendItem('Deleted','deleted'));
container.appendChild(legend);

return container;
}