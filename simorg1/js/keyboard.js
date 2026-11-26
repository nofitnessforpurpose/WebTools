'use strict';
function Keyboard(){
var _counter=0;
var _disabled=false;
var _batteryLow=false;
var _linesGrid=[0xff,0xff,0xff,0xff,0xff,0xff,0xff];
var _linesKeyb=[0xff,0xff,0xff,0xff,0xff,0xff,0xff];
var _onPressedGrid=false;
var _onPressedKeyb=false;
var _pressedKeys={};
var pcKeyMap={
"Escape":[0,0,false],
"Esc":[0,0,false],
"F1":[0,1,false],
"F2":[0,2,false],
"F3":[0,3,false],
"ArrowLeft":[0,4,false],
"Left":[0,4,false],
"ArrowRight":[0,5,false],
"Right":[0,5,false],
"ArrowUp":[0,2,true],
"Up":[0,2,true],
"ArrowDown":[0,3,true],
"Down":[0,3,true],
"a":[1,0,false],"A":[1,0,false],"<":[1,0,true],
"b":[1,1,false],"B":[1,1,false],">":[1,1,true],
"c":[1,2,false],"C":[1,2,false],"7":[1,2,true],
"d":[1,3,false],"D":[1,3,false],"8":[1,3,true],
"e":[1,4,false],"E":[1,4,false],"9":[1,4,true],
"f":[1,5,false],"F":[1,5,false],"/":[1,5,true],
"g":[2,0,false],"G":[2,0,false],"=":[2,0,true],
"h":[2,1,false],"H":[2,1,false],"\"":[2,1,true],
"i":[2,2,false],"I":[2,2,false],"4":[2,2,true],
"j":[2,3,false],"J":[2,3,false],"5":[2,3,true],
"k":[2,4,false],"K":[2,4,false],"6":[2,4,true],
"l":[2,5,false],"L":[2,5,false],"*":[2,5,true],
"m":[3,0,false],"M":[3,0,false],"%":[3,0,true],
"n":[3,1,false],"N":[3,1,false],
"o":[3,2,false],"O":[3,2,false],"1":[3,2,true],
"p":[3,3,false],"P":[3,3,false],"2":[3,3,true],
"q":[3,4,false],"Q":[3,4,false],"3":[3,4,true],
"r":[3,5,false],"R":[3,5,false],"-":[3,5,true],
"s":[4,0,false],"S":[4,0,false],",":[4,0,true],
"t":[4,1,false],"T":[4,1,false],":":[4,1,true],
"u":[4,2,false],"U":[4,2,false],"0":[4,2,true],
"v":[4,3,false],"V":[4,3,false],".":[4,3,true],
"w":[4,4,false],"W":[4,4,false],
"x":[4,5,false],"X":[4,5,false],"+":[4,5,true],
"Shift":[5,0,false],
"ShiftLeft":[5,0,false],
"ShiftRight":[5,0,false],
"y":[5,1,false],"Y":[5,1,false],"(":[5,1,true],
"z":[5,2,false],"Z":[5,2,false],")":[5,2,true],
" ":[5,3,false],"Spacebar":[5,3,false],
"Backspace":[5,4,false],"Delete":[5,4,false],"Del":[5,4,false],
"Enter":[5,5,false]
};
var matrixMap=[
[
{isON:true},
{line:6,mask:0x40},
{line:6,mask:0x20},
{line:6,mask:0x10},
{line:6,mask:0x08},
{line:6,mask:0x04}
],
[
{line:5,mask:0x04},
{line:4,mask:0x04},
{line:3,mask:0x04},
{line:0,mask:0x04},
{line:2,mask:0x04},
{line:1,mask:0x04}
],
[
{line:5,mask:0x08},
{line:4,mask:0x08},
{line:3,mask:0x08},
{line:0,mask:0x08},
{line:2,mask:0x08},
{line:1,mask:0x08}
],
[
{line:5,mask:0x10},
{line:4,mask:0x10},
{line:3,mask:0x10},
{line:0,mask:0x10},
{line:2,mask:0x10},
{line:1,mask:0x10}
],
[
{line:5,mask:0x20},
{line:4,mask:0x20},
{line:3,mask:0x20},
{line:0,mask:0x20},
{line:2,mask:0x20},
{line:1,mask:0x20}
],
[
{line:5,mask:0x40},
{line:4,mask:0x40},
{line:3,mask:0x40},
{line:0,mask:0x40},
{line:2,mask:0x40},
{line:1,mask:0x40}
]
];
function getLineAndMask(row,col){
if(matrixMap[row]&&matrixMap[row][col]){
return matrixMap[row][col];
}
return {};
}
this.resetCounter=function (){
_counter=0;
};
this.incrementCounter=function (){
_counter=(_counter+1)&0x0fff;
};
this.getCounter=function (){
return _counter;
};
this.counterHasOverflowed=function (){
return (_counter&0x0800)!==0;
};
this.isOnPressed=function (){
return!_disabled&&(_onPressedGrid||_onPressedKeyb);
};
this.setBatteryLow=function (isLow){
_batteryLow=!!isLow;
};
this.isBatteryLow=function (){
return _batteryLow;
};
this.readPort5=function (){
var val=0x7c;
if(!_disabled){
var lineMasks=[0x40,0x20,0x10,0x08,0x04,0x02,0x01];
for(var l=0;l<7;l++){
if((_counter&lineMasks[l])===0){
val&=(_linesGrid[l]&_linesKeyb[l]);
}
}
if(this.isOnPressed()){
val|=0x80;
}else {
val&=~0x80;
}
}else {
val&=~0x80;
}
if(this.counterHasOverflowed()){
val|=0x02;
}else {
val&=~0x02;
}
if(_batteryLow){
val|=0x01;
}else {
val&=~0x01;
}
return val&0xff;
};
this.doGrid=function (row,col,isDown){
var mapping=getLineAndMask(row,col);
if(mapping.isON){
_onPressedGrid=isDown;
if(isDown)_counter=0;
return;
}
if(mapping.line>=0&&mapping.line<7){
if(isDown){
_linesGrid[mapping.line]&=~mapping.mask;
}else {
_linesGrid[mapping.line]|=mapping.mask;
}
}
};
this.handleKeyDown=function (event){
var code=event.code;
if(code==="ShiftLeft"||code==="ShiftRight")code="Shift";
if(!_pressedKeys[code]){
_pressedKeys[code]={key:event.key,code:code,shift:event.shiftKey};
updateKeyboardState();
}
if(!_disabled&&pcKeyMap[event.key]){
event.preventDefault();
}
};
this.handleKeyUp=function (event){
var code=event.code;
if(code==="ShiftLeft"||code==="ShiftRight")code="Shift";
if(_pressedKeys[code]){
delete _pressedKeys[code];
updateKeyboardState();
}
if(!_disabled&&pcKeyMap[event.key]){
event.preventDefault();
}
};
function updateKeyboardState(){
for(var l=0;l<7;l++)_linesKeyb[l]=0xff;
_onPressedKeyb=false;
var shiftRequired=false;
for(var k in _pressedKeys){
var item=_pressedKeys[k];
var key=item.key;
var mapping=pcKeyMap[key]||pcKeyMap[item.code];
if(mapping){
var row=mapping[0];
var col=mapping[1];
var isShifted=mapping[2];
if(row===0&&col===0){
_onPressedKeyb=true;
}else {
var m=getLineAndMask(row,col);
if(m.line>=0&&m.line<7){
_linesKeyb[m.line]&=~m.mask;
}
}
if(isShifted||item.shift){
shiftRequired=true;
}
}
}
if(shiftRequired){
_linesKeyb[5]&=~0x40;
}
}
this.clear=function (){
_pressedKeys={};
for(var i=0;i<7;i++){
_linesGrid[i]=0xff;
_linesKeyb[i]=0xff;
}
_onPressedGrid=false;
_onPressedKeyb=false;
};
this.disable=function (){_disabled=true;};
this.enable=function (){_disabled=false;};
}