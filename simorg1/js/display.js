'use strict';
var charFont5x8=new Uint8Array([
0,0,0,0,0,0,0,0,4,4,4,4,0,0,4,0,10,10,10,0,0,0,0,0,10,10,31,10,31,10,10,0,
4,15,20,14,5,30,4,0,24,25,2,4,8,19,3,0,12,18,20,8,21,18,13,0,12,4,8,0,0,0,0,0,
2,4,8,8,8,4,2,0,8,4,2,2,2,4,8,0,0,4,21,14,21,4,0,0,0,4,4,31,4,4,0,0,
0,0,0,0,12,4,8,0,0,0,0,31,0,0,0,0,0,0,0,0,0,12,12,0,1,2,4,8,16,0,0,0,
14,17,19,21,25,17,14,0,4,12,4,4,4,4,14,0,14,17,1,2,4,8,31,0,31,2,4,2,1,17,14,0,
2,6,10,18,31,2,2,0,31,16,30,1,1,17,14,0,6,8,16,30,17,17,14,0,31,1,2,4,8,8,8,0,
14,17,17,14,17,17,14,0,14,17,17,15,1,2,12,0,0,12,12,0,12,12,0,0,0,12,12,0,12,4,8,0,
2,4,8,16,8,4,2,0,0,0,31,0,31,0,0,0,8,4,2,1,2,4,8,0,14,17,1,2,4,0,4,0,
14,17,1,13,21,21,14,0,14,17,17,17,31,17,17,0,30,17,17,30,17,17,30,0,14,17,16,16,16,17,14,0,
28,18,17,17,17,18,28,0,31,16,16,30,16,16,31,0,31,16,16,30,16,16,16,0,14,17,16,23,17,17,15,0,
17,17,17,31,17,17,17,0,14,4,4,4,4,4,14,0,7,2,2,2,2,18,12,0,17,18,20,24,20,18,17,0,
16,16,16,16,16,16,31,0,17,27,21,21,17,17,17,0,17,17,25,21,19,17,17,0,14,17,17,17,17,17,14,0,
30,17,17,30,16,16,16,0,14,17,17,17,21,18,13,0,30,17,17,30,20,18,17,0,15,16,16,14,1,1,30,0,
31,4,4,4,4,4,4,0,17,17,17,17,17,17,14,0,17,17,17,17,17,10,4,0,17,17,17,21,21,21,10,0,
17,17,10,4,10,17,17,0,17,17,17,10,4,4,4,0,31,1,2,4,8,16,31,0,14,8,8,8,8,8,14,0,
17,10,31,4,31,4,4,0,14,2,2,2,2,2,14,0,4,10,17,0,0,0,0,0,0,0,0,0,0,0,31,0,
8,4,2,0,0,0,0,0,0,0,14,1,15,17,15,0,16,16,22,25,17,17,30,0,0,0,14,16,16,17,14,0,
1,1,13,19,17,17,15,0,0,0,14,17,31,16,14,0,6,9,8,28,8,8,8,0,0,15,17,17,15,1,14,0,
16,16,22,25,17,17,17,0,4,0,12,4,4,4,14,0,2,0,6,2,2,18,12,0,16,16,18,20,24,20,18,0,
12,4,4,4,4,4,14,0,0,0,26,21,21,17,17,0,0,0,22,25,17,17,17,0,0,0,14,17,17,17,14,0,
0,0,30,17,30,16,16,0,0,0,13,19,15,1,1,0,0,0,22,25,16,16,16,0,0,0,14,16,14,1,30,0,
8,8,28,8,8,9,6,0,0,0,17,17,17,19,13,0,0,0,17,17,17,10,4,0,0,0,17,17,21,21,10,0,
0,0,17,10,4,10,17,0,0,0,17,17,15,1,14,0,0,0,31,2,4,8,31,0,2,4,4,8,4,4,2,0,
4,4,4,4,4,4,4,0,8,4,4,2,4,4,8,0,0,4,2,31,2,4,0,0,0,4,8,31,8,4,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,28,20,28,0,7,4,4,4,0,0,0,0,0,0,0,4,4,4,28,0,
0,0,0,0,16,8,4,0,0,0,0,12,12,0,0,0,0,31,1,31,1,2,4,0,0,0,31,1,6,4,8,0,
0,0,2,4,12,20,4,0,0,0,4,31,17,1,6,0,0,0,0,31,4,4,31,0,0,0,2,31,6,10,18,0,
0,0,8,31,9,10,8,0,0,0,0,14,2,2,31,0,0,0,30,2,30,2,30,0,0,0,0,21,21,1,6,0,
0,0,0,31,0,0,0,0,31,1,5,6,4,4,8,0,1,2,4,12,20,4,4,0,4,31,17,17,1,2,4,0,
0,31,4,4,4,4,31,0,2,31,2,6,10,18,2,0,8,31,9,9,9,9,18,0,4,31,4,31,4,4,4,0,
0,15,9,17,1,2,12,0,8,15,18,2,2,2,4,0,0,31,1,1,1,1,31,0,10,31,10,10,2,4,8,0,
0,24,1,25,1,2,28,0,0,31,1,2,4,10,17,0,8,31,9,10,8,8,7,0,0,17,17,9,1,2,12,0,
0,15,9,21,3,2,12,0,2,28,4,31,4,4,8,0,0,21,21,21,1,2,4,0,14,0,31,4,4,4,8,0,
8,8,8,12,10,8,8,0,4,4,31,4,4,8,16,0,0,14,0,0,0,0,31,0,0,31,1,10,4,10,16,0,
4,31,2,4,14,21,4,0,2,2,2,2,2,4,8,0,0,4,2,17,17,17,17,0,16,16,31,16,16,16,15,0,
0,31,1,1,1,2,12,0,0,8,20,2,1,1,0,0,4,31,4,4,21,21,4,0,0,31,1,1,10,4,2,0,
0,14,0,14,0,14,1,0,0,4,8,16,17,31,1,0,0,1,1,10,4,10,16,0,0,31,8,31,8,8,7,0,
8,8,31,9,10,8,8,0,0,14,2,2,2,2,31,0,0,31,1,31,1,1,31,0,14,0,31,1,1,2,4,0,
18,18,18,18,2,4,8,0,0,4,20,20,21,21,22,0,0,16,16,17,18,20,24,0,0,31,17,17,17,17,31,0,
0,31,17,17,1,2,4,0,0,24,0,1,1,2,28,0,4,18,8,0,0,0,0,0,28,20,28,0,0,0,0,0,
0,0,9,21,18,18,13,0,10,0,14,1,15,17,15,0,0,0,14,17,30,17,30,16,0,0,14,16,12,17,14,0,
0,0,17,17,17,19,29,16,0,0,15,20,18,17,14,0,0,0,6,9,17,17,30,16,0,0,15,17,17,17,15,1,
0,0,22,25,17,17,30,16,0,2,26,2,0,0,0,0,2,0,6,2,2,2,2,2,0,20,8,20,0,0,0,0,
0,4,14,20,21,14,4,0,8,8,28,8,28,8,15,0,14,0,22,25,17,17,17,0,10,0,14,17,17,17,14,0,
0,0,22,25,17,17,30,16,0,0,13,19,17,17,15,1,0,14,17,31,17,17,14,0,0,0,0,11,21,26,0,0,
0,0,14,17,17,10,27,0,10,0,17,17,17,19,13,0,31,16,8,4,8,16,31,0,0,0,31,10,10,10,19,0,
31,0,17,10,4,10,17,0,0,0,17,17,17,17,15,1,0,1,30,4,31,4,4,0,0,0,31,8,15,9,17,0,
0,0,31,21,31,17,17,0,0,0,4,0,31,0,4,0,0,0,0,0,0,0,0,0,31,31,31,31,31,31,31,31
]);
function Display(ctx){
var _context=ctx;
var _contrast=5;
var _isOn=false;
var _needsRefresh=true;
var _ddram=new Uint8Array(128);
for(var i=0;i<128;i++)_ddram[i]=32;
var _cgram=new Uint8Array(64);
var _cursorPos=0;
var _scrptr=0;
var _udgptr=0;
var _ptrToScreen=true;
var _addrIncr=true;
var _displayOn=false;
var _cursorOn=false;
var _cursorBlink=false;
var _blinkState=false;
var _nextBlinkTime=0;
var _blinkSpeedMs=500;
var _showGhosts=true;
var _pixelSpacing=0;
var _lcdSmoothing=false;
var _screenToMem=[
0x00,0x01,0x02,0x03,0x04,0x05,0x06,0x07,
0x40,0x41,0x42,0x43,0x44,0x45,0x46,0x47
];
function initCanvas(){
if(_context&&_context.canvas){
_context.canvas.width=1068;
_context.canvas.height=110;
}
_needsRefresh=true;
_nextBlinkTime=Date.now()+_blinkSpeedMs;
}
initCanvas();
function getCharBytes(code){
if(code<16){
var cgIdx=code&0x07;
return _cgram.subarray(cgIdx*8,cgIdx*8+8);
}
var offset=Math.max((code-32)*8,0);
if(offset+8<=charFont5x8.length){
return charFont5x8.subarray(offset,offset+8);
}
return charFont5x8.subarray(0,8);
}
function getPaperColor(contrast){
var r=Math.round(168-(contrast-5)*5.0);
var g=Math.round(185-(contrast-5)*5.0);
var b=Math.round(162-(contrast-5)*5.0);
return "rgb("+r + ","+g + ","+b + ")";
}
function getOffPaperColor(){
return "#96a690";
}
function getLitColor(contrast){
var norm=Math.max(0,Math.min(10,contrast))/10;
var op=norm;
var d=Math.max(4,Math.round(24-norm*20));
return "rgba("+d + ","+(d+10)+","+(d+6)+","+op.toFixed(2)+")";
}
function getGhostColor(contrast){
var norm=Math.max(0,Math.min(10,contrast))/10;
var alpha=(0.02+norm*0.22).toFixed(3);
return "rgba(45, 60, 40, "+alpha+")";
}
this.refresh=function (force){
var now=Date.now();
if(now>_nextBlinkTime){
_nextBlinkTime=now+_blinkSpeedMs;
_blinkState=!_blinkState;
if(_cursorBlink)_needsRefresh=true;
}
if(!_needsRefresh&&!force)return;
var w=_context.canvas.width;
var h=_context.canvas.height;
_context.clearRect(0,0,w,h);
if(!_isOn||!_displayOn){
_needsRefresh=false;
return;
}
var litColor=getLitColor(_contrast);
var ghostColor=getGhostColor(_contrast);
var dotGapX=_pixelSpacing;
var dotGapY=_pixelSpacing;
var dotW=(dotGapX>0)?Math.max(1,10-dotGapX):10;
var dotH=(dotGapY>0)?Math.max(1,6-dotGapY):6;
var charW=5*dotW+4*dotGapX;
var charH=8*dotH+7*dotGapY;
var charGapX=_lcdSmoothing?9:9.03;
var totalW=16*charW+15*charGapX;
var offsetX=71;
var offsetY=Math.round((h-charH)/2)+4;
for(var col=0;col<16;col++){
var memAddr=_screenToMem[col];
var charCode=_ddram[memAddr];
var charX=offsetX+col*(charW+charGapX);
var charY=offsetY;
var isCursorHere=(_cursorPos===memAddr);
var isUnderlineCursor=isCursorHere&&_cursorOn;
var isBlinkBlock=isCursorHere&&_cursorBlink&&_blinkState;
var charBytes=getCharBytes(charCode);
for(var row=0;row<8;row++){
var byte=charBytes[row];
var isUnderlineRow=isUnderlineCursor&&(row===7);
for(var bit=0;bit<5;bit++){
var isLit=isBlinkBlock||isUnderlineRow||((byte&(1<<(4-bit)))!==0);
var dx=charX+bit*(dotW+dotGapX);
var dy=charY+row*(dotH+dotGapY);
if(isLit){
_context.fillStyle=litColor;
_context.fillRect(dx,dy,dotW,dotH);
}else if(_showGhosts){
_context.fillStyle=ghostColor;
_context.fillRect(dx,dy,dotW,dotH);
}
}
}
}
_needsRefresh=false;
};
this.command=function (b){
b&=0xff;
if((b&0x80)!==0){
_scrptr=b&0x7f;
_cursorPos=_scrptr;
_ptrToScreen=true;
_needsRefresh=true;
}else if((b&0x40)!==0){
_udgptr=b&0x3f;
_ptrToScreen=false;
_needsRefresh=true;
}else if((b&0x20)!==0){
}else if((b&0x10)!==0){
var isRight=(b&0x04)!==0;
var isDisplay=(b&0x08)!==0;
if(!isDisplay){
_cursorPos=isRight?(_cursorPos+1)&0x7f:(_cursorPos-1)&0x7f;
_needsRefresh=true;
}
}else if((b&0x08)!==0){
_displayOn=(b&0x04)!==0;
_cursorOn=(b&0x02)!==0;
_cursorBlink=(b&0x01)!==0;
if(_displayOn)_isOn=true;
_needsRefresh=true;
}else if((b&0x04)!==0){
_addrIncr=(b&0x02)!==0;
}else if((b&0x02)!==0){
_scrptr=0;
_cursorPos=0;
_needsRefresh=true;
}else if((b&0x01)!==0){
for(var i=0;i<128;i++)_ddram[i]=32;
_scrptr=0;
_cursorPos=0;
_needsRefresh=true;
}
};
this.setData=function (b){
b&=0xff;
_isOn=true;
_displayOn=true;
if(_ptrToScreen){
_ddram[_scrptr]=b;
_needsRefresh=true;
if(_addrIncr){
_scrptr=(_scrptr+1)&0x7f;
}else {
_scrptr=(_scrptr-1)&0x7f;
}
_cursorPos=_scrptr;
}else {
_cgram[_udgptr]=b;
_needsRefresh=true;
if(_addrIncr){
_udgptr=(_udgptr+1)&0x3f;
}else {
_udgptr=(_udgptr-1)&0x3f;
}
}
};
this.getData=function (){
var t;
if(_ptrToScreen){
t=_ddram[_scrptr];
if(_addrIncr)_scrptr=(_scrptr+1)&0x7f;
else _scrptr=(_scrptr-1)&0x7f;
_cursorPos=_scrptr;
}else {
t=_cgram[_udgptr];
if(_addrIncr)_udgptr=(_udgptr+1)&0x3f;
else _udgptr=(_udgptr-1)&0x3f;
}
return t;
};
this.getStatus=function (){
return (_ptrToScreen?_scrptr:_udgptr)&0x7f;
};
this.isOn=function (){return _isOn&&_displayOn;};
this.switchOff=function (){
_isOn=false;
_displayOn=false;
_needsRefresh=true;
this.refresh(true);
};
this.switchOn=function (preserveContent){
_isOn=true;
_displayOn=true;
if(!preserveContent){
for(var i=0;i<128;i++)_ddram[i]=32;
for(var j=0;j<64;j++)_cgram[j]=0;
_scrptr=0;
_cursorPos=0;
_cursorOn=false;
_cursorBlink=false;
}
_needsRefresh=true;
this.refresh(true);
};
this.turnOn=function (preserveContent){
this.switchOn(preserveContent!==false);
};
this.reset=function (){
this.switchOn(false);
};
this.setContrast=function (delta){
if(delta>0)this.increaseContrast();
else if(delta<0)this.decreaseContrast();
};
this.setContrastLevel=function (lvl){
_contrast=Math.max(0,Math.min(10,Math.round(lvl)));
_needsRefresh=true;
};
this.getContrastLevel=function (){return _contrast;};
this.getScreenText=function (){
var str="";
for(var col=0;col<16;col++){
var memAddr=_screenToMem[col];
var charCode=_ddram[memAddr];
str+=(charCode>=32&&charCode<127)?String.fromCharCode(charCode):" ";
}
return str;
};
this.increaseContrast=function (){
if(_contrast<10){_contrast++;_needsRefresh=true;}
};
this.decreaseContrast=function (){
if(_contrast>0){_contrast--;_needsRefresh=true;}
};
this.setPixelSpacing=function (sp){
_pixelSpacing=Math.max(0,parseInt(sp,10)||0);
_needsRefresh=true;
};
this.getPixelSpacing=function (){return _pixelSpacing;};
this.setLcdSmoothing=function (enabled){
_lcdSmoothing=!!enabled;
_needsRefresh=true;
};
this.getLcdSmoothing=function (){return _lcdSmoothing;};
this.getSnapshotData=function (arr){
var ln=arr.length;
arr[ln++]=_contrast;
arr[ln++]=_isOn?1:0;
arr[ln++]=_displayOn?1:0;
arr[ln++]=_cursorPos;
arr[ln++]=_scrptr;
arr[ln++]=_udgptr;
arr[ln++]=_ptrToScreen?1:0;
arr[ln++]=_cursorOn?1:0;
arr[ln++]=_cursorBlink?1:0;
for(var i=0;i<128;i++)arr[ln++]=_ddram[i];
for(var j=0;j<64;j++)arr[ln++]=_cgram[j];
};
this.applySnapshotData=function (snapshot){
_contrast=snapshot.readByte();
_isOn=snapshot.readByte()!==0;
_displayOn=snapshot.readByte()!==0;
_cursorPos=snapshot.readByte();
_scrptr=snapshot.readByte();
_udgptr=snapshot.readByte();
_ptrToScreen=snapshot.readByte()!==0;
_cursorOn=snapshot.readByte()!==0;
_cursorBlink=snapshot.readByte()!==0;
for(var i=0;i<128;i++)_ddram[i]=snapshot.readByte();
for(var j=0;j<64;j++)_cgram[j]=snapshot.readByte();
_needsRefresh=true;
};
}