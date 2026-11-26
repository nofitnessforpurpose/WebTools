'use strict';
var requestAnimationFrame=(
(typeof window!=='undefined'&&(
window.requestAnimationFrame||window.msRequestAnimationFrame||
window.mozRequestAnimationFrame||window.webkitRequestAnimationFrame
))||function (callback){setTimeout(callback,17);}
);
var PsionModel={
name:"Psion Organiser I (1984)",
rom:"roms/psion1.rom",
ram:2,
screen:1,
frequency:921600
};
function Psion(cv){
if(typeof cv==='string'){
cv=document.getElementById(cv);
}
var _this=this;
var _canvas=cv;
var _context=cv?cv.getContext("2d"):null;
var _hd6301;
var _memory;
var _display;
var _keyboard;
var _bus;
var _isReady=false;
var _isRunning=false;
var _frequency=PsionModel.frequency;
var _firstFrameTime=-1;
var _lastFrameTime=-1;
var _ticksPerformed=0;
var _animationframe;
var _needRefresh=true;
var _hasEverRun=false;
var _lastPowerOnTime=0;
var _nmiKeepAlive=true;
var _keepAliveIntervalId=null;
var _onSwitchOnOff=function (){};
var _onBuzzer=null;
this.autoSyncClock=false;
function getMonotonicTime(){
return (typeof performance!=='undefined'&&typeof performance.now==='function')
?performance.now()
:Date.now();
}
function onKeepAliveTick(){
if(!_isRunning||!_nmiKeepAlive)return;
var now=getMonotonicTime();
var isHidden=(typeof document!=='undefined'&&document.visibilityState==='hidden');
if(isHidden||(_lastFrameTime>=0&&(now-_lastFrameTime)>=85)){
stepFrame(now,true);
}
}
function syncKeepAliveTimers(){
if(_isRunning&&_nmiKeepAlive){
if(!_keepAliveIntervalId){
_keepAliveIntervalId=setInterval(onKeepAliveTick,250);
}
}else {
if(_keepAliveIntervalId){
clearInterval(_keepAliveIntervalId);
_keepAliveIntervalId=null;
}
}
}
this.setNmiKeepAlive=function (enabled){
_nmiKeepAlive=!!enabled;
syncKeepAliveTimers();
};
this.getNmiKeepAlive=function (){
return _nmiKeepAlive;
};
this.reset=function (){
var prevContrast=_display?_display.getContrastLevel():null;
var prevPixelSpacing=_display?_display.getPixelSpacing():null;
var prevLcdSmoothing=_display?_display.getLcdSmoothing():null;
_display=new Display(_context);
if(prevContrast!==null)_display.setContrastLevel(prevContrast);
if(prevPixelSpacing!==null)_display.setPixelSpacing(prevPixelSpacing);
if(prevLcdSmoothing!==null)_display.setLcdSmoothing(prevLcdSmoothing);
var romFile=new BinaryFile(PsionModel.rom,false);
_memory=new Memory(romFile);
_keyboard=new Keyboard();
var existingPacks=_bus?_bus.getPacks():null;
var stx=_bus?_bus.serialTxCallback:null;
var scfg=_bus?_bus.serialConfigCallback:null;
_bus=new Bus(_memory,_display,_keyboard);
if(existingPacks){
_bus.setPack(existingPacks[0],0);
_bus.setPack(existingPacks[1],1);
}
if(stx)_bus.serialTxCallback=stx;
if(scfg)_bus.serialConfigCallback=scfg;
_hd6301=new HD6301(_bus);
if(_onBuzzer){
_hd6301.setOnBuzzer(_onBuzzer);
_bus.onBuzzer=_onBuzzer;
}
_needRefresh=true;
_isReady=false;
_hasEverRun=false;
_bus.onSwitchOnOff=function (state,isNmiWakeup){
if(!state&&_onBuzzer){
try{_onBuzzer("stop");}catch(_){}
}
if(state){
_hasEverRun=true;
if(_this.autoSyncClock)_this.setClock();
}
_hd6301.onSwitchOnOff();
_firstFrameTime=-1;
_lastFrameTime=-1;
_ticksPerformed=0;
_needRefresh=true;
_onSwitchOnOff(state,!!isNmiWakeup);
};
_bus.switchOn(false);
var maxBootCycles=400000;
var cyclesDone=0;
while(!_hd6301.isSleeping()&&cyclesDone<maxBootCycles){
_hd6301.execute(10000);
cyclesDone+=10000;
}
_bus.switchOff();
};
this.setOnSwitchOnOff=function (fnc){_onSwitchOnOff=fnc;};
this.setOnBuzzer=function (fnc){
_onBuzzer=fnc;
if(_hd6301)_hd6301.setOnBuzzer(_onBuzzer);
if(_bus)_bus.onBuzzer=_onBuzzer;
};
this.handleKeyUp=function (ke){
if((ke.key==="Escape"||ke.code==="Escape")&&(getMonotonicTime()-_lastPowerOnTime)<150){
return;
}
if(_keyboard)_keyboard.handleKeyUp(ke);
};
this.handleKeyDown=function (ke){
var isOff=this.isSwitchedOff();
if((ke.key==="Escape"||ke.code==="Escape")&&isOff){
this.powerOn();
return;
}
if(_keyboard){
_keyboard.handleKeyDown(ke);
if(_hd6301&&_hd6301.isSleeping()){
_hd6301.wake();
}
}
};
this.pressKey=function (row,col,isDown){
var isOff=this.isSwitchedOff();
if(row===0&&col===0&&isDown&&isOff){
this.powerOn();
return;
}
if(row===0&&col===0&&!isDown&&(getMonotonicTime()-_lastPowerOnTime)<150){
return;
}
if(_keyboard){
_keyboard.doGrid(row,col,isDown);
if(isDown&&_hd6301&&_hd6301.isSleeping()){
_hd6301.wake();
}
_needRefresh=true;
}
};
this.powerOn=function (){
_hasEverRun=true;
_lastPowerOnTime=getMonotonicTime();
if(_keyboard){
_keyboard.resetCounter();
_keyboard.doGrid(0,0,true);
setTimeout(function (){
if(_keyboard)_keyboard.doGrid(0,0,false);
},120);
}
if(_bus){
_bus.switchOn(false);
if(_hd6301)_hd6301.wake();
_firstFrameTime=-1;
_lastFrameTime=-1;
_ticksPerformed=0;
_needRefresh=true;
}
if(_hd6301){
var maxWarmBootCycles=120000;
var warmDone=0;
while(!_hd6301.isSleeping()&&warmDone<maxWarmBootCycles){
_hd6301.execute(5000);
warmDone+=5000;
var reg=_hd6301.getRegisters();
if(reg.PC>=0xf052&&reg.PC<=0xf0af)break;
}
}
if(this.autoSyncClock)this.setClock();
};
this.powerOff=function (){
if(_keyboard)_keyboard.doGrid(0,0,false);
if(_bus&&!_bus.isSwitchedOff()){
_bus.switchOff();
_needRefresh=true;
}
};
this.isSwitchedOff=function (){
if(!_bus)return true;
if(_bus.isSwitchedOff())return true;
if(_hd6301&&_hd6301.isSleeping()){
var pc=_hd6301.getRegisters().PC;
if(pc>=0xf064&&pc<=0xf068)return true;
}
return false;
};
this.getCPU=function (){return _hd6301;};
this.getDisplay=function (){return _display;};
this.getKeyboard=function (){return _keyboard;};
this.getBus=function (){return _bus;};
this.getMemory=function (){return _memory;};
this.setPack=function (pack,slot){
if(_bus){
_bus.setPack(pack,slot);
_isReady=false;
}
};
this.setSerialTxCallback=function (fnc){
if(_bus)_bus.serialTxCallback=fnc;
};
this.setSerialConfigCallback=function (fnc){
if(_bus)_bus.serialConfigCallback=fnc;
};
this.sendSerialBytes=function (bytes){
if(_bus&&typeof _bus.receiveSerialBytes==="function"){
_bus.receiveSerialBytes(bytes);
}
};
this.sendSerialByte=function (b){
if(_bus&&typeof _bus.receiveSerialByte==="function"){
_bus.receiveSerialByte(b);
}
};
this.setSerialLines=function (cts,dsr){
if(_bus&&typeof _bus.setSerialLines==="function"){
_bus.setSerialLines(cts,dsr);
}
};
this.getSerialState=function (){
return (_bus&&typeof _bus.getSerialState==="function")?_bus.getSerialState():null;
};
this.resetSerialCounters=function (){
if(_bus&&typeof _bus.resetSerialCounters==="function"){
_bus.resetSerialCounters();
}
};
this.isConnectorPackFitted=function (){
return (_bus&&typeof _bus.isConnectorPackFitted==="function")?_bus.isConnectorPackFitted():false;
};
this.setClock=function (){
if(_bus){
_bus.syncSystemClock();
_bus.setClockAtNMI=true;
}
};
this.setContrastLevel=function (lvl){
if(_display)_display.setContrastLevel(lvl);
};
this.getContrastLevel=function (){
return _display?_display.getContrastLevel():5;
};
this.increaseContrast=function (){
if(_display)_display.increaseContrast();
};
this.decreaseContrast=function (){
if(_display)_display.decreaseContrast();
};
this.setPixelSpacing=function (sp){
if(_display)_display.setPixelSpacing(sp);
};
this.getPixelSpacing=function (){
return _display?_display.getPixelSpacing():0;
};
this.setLcdSmoothing=function (enabled){
if(_display)_display.setLcdSmoothing(enabled);
};
this.getLcdSmoothing=function (){
return _display?_display.getLcdSmoothing():false;
};
function stepFrame(t,isBackgroundTick){
if(!_isRunning)return;
var now=getMonotonicTime();
t=now;
_lastFrameTime=t;
var isHidden=(typeof document!=='undefined'&&document.visibilityState==='hidden');
if(_firstFrameTime<0){
_firstFrameTime=t;
_ticksPerformed=0;
}else {
if(!_isReady){
if(_bus&&_bus.isReady()){
_isReady=true;
_needRefresh=true;
}
}
if(_isReady){
if(_bus.isSwitchedOff()&&!_hasEverRun){
if(_needRefresh&&(!isBackgroundTick||!isHidden)){
_display.refresh(true);
_needRefresh=false;
}
}else {
var ticksToExecute=Math.floor((t-_firstFrameTime)*_frequency/1000-_ticksPerformed);
if(ticksToExecute>_frequency*0.5){
ticksToExecute=Math.min(ticksToExecute,46000);
_firstFrameTime=t-((_ticksPerformed+ticksToExecute)/_frequency*1000);
}
if(ticksToExecute>0){
_hd6301.execute(ticksToExecute);
_ticksPerformed+=ticksToExecute;
if(!_bus.isSwitchedOff()&&_hd6301.isSleeping()){
var pc=_hd6301.getRegisters().PC;
if(pc>=0xf064&&pc<=0xf068){
_bus.switchOff();
_needRefresh=true;
}
}
}
if(!isBackgroundTick||!isHidden){
_display.refresh(_needRefresh);
_needRefresh=false;
}
}
}
}
}
function doFrame(t){
if(!_isRunning)return;
stepFrame(t,false);
if(_isRunning)_animationframe=requestAnimationFrame(doFrame);
}
this.startRunning=function (){
if(!_isRunning){
_isRunning=true;
_isReady=false;
_firstFrameTime=-1;
_lastFrameTime=-1;
syncKeepAliveTimers();
requestAnimationFrame(doFrame);
}
};
this.stopRunning=function (){
if(_isRunning){
_isRunning=false;
window.cancelAnimationFrame(_animationframe);
syncKeepAliveTimers();
_isReady=false;
}
};
this.isRunning=function (){return _isRunning;};
this.createSnapshot=function (){
if(!_isReady){
if(_bus&&_bus.isReady()){
_isReady=true;
}else {
return null;
}
}
var arr=[1,0x01];
_hd6301.getSnapshotData(arr);
_bus.getSnapshotData(arr);
_display.getSnapshotData(arr);
_memory.getSnapshotData(arr);
return new Snapshot({data:arr});
};
this.applySnapshotData=function (snapshot){
if(!_isReady){
if(_bus&&_bus.isReady()){
_isReady=true;
}else {
return;
}
}
snapshot.reset();
if(snapshot.readByte()!==1){
alert("Snapshot is incompatible with this simulator.");
return;
}
var modelByte=snapshot.readByte();
if(modelByte!==0x01){
alert("Snapshot is not for Psion Organiser 1.");
return;
}
_hd6301.applySnapshotData(snapshot);
_bus.applySnapshotData(snapshot);
_display.applySnapshotData(snapshot);
_memory.applySnapshotData(snapshot);
_firstFrameTime=-1;
_lastFrameTime=-1;
_ticksPerformed=0;
_needRefresh=true;
_hasEverRun=true;
if(_display)_display.refresh(true);
if(_onSwitchOnOff&&_bus)_onSwitchOnOff(!_bus.isSwitchedOff());
};
}