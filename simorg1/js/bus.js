'use strict';
function Bus(mem,dsp,kb){
var _memory=mem;
var _display=dsp;
var _keyboard=kb;
if(_keyboard&&typeof _keyboard.setRomShiftReader==="function"&&_memory){
_keyboard.setRomShiftReader(function (){
return (_memory.read(0x005e)&0x01)!==0;
});
}
var _switched_off=true;
var _isNmiCounterWakeup=false;
var _packs=[new Pack(),new Pack()];
var _OCIdue=false;
var _NMItoCtr=true;
var _ticksSinceNMI=0;
var _port1proc=0;
var _port1actual=0;
var _port1ddr=0;
var _buzzerPlaying=false;
var _buzzerLastToggleTick=0;
var _buzzerPrevLatchState=-1;
var _buzzerHalfPeriodTicks=0;
var _totalBusTicks=0;
var _port2proc=0;
var _port2actual=0;
var _port2ddr=0;
var _port6proc=0;
var _port6actual=0;
var _port6ddr=0;
var _port5rcr=0x40;
var _timer1_ocr=0xffff;
var _timer1_frc=0;
var _timer1_csr=0;
var _vpp21_charged=false;
var _sca_alarmhigh=false;
var _this=this;
var _sci_rmcr=0x00;
var _sci_trcsr=0x20;
var _sci_rdr=0x00;
var _sci_tdr=0x00;
var _timer2_csr=0x00;
var _timer2_tconr=0xff;
var _sci_rdrf_read=false;
var _sci_rx_cooldown=0;
var _sci_rx_queue=[];
var _sci_cts=true;
var _sci_dsr=true;
var _sci_tx_count=0;
var _sci_rx_count=0;
this.serialTxCallback=null;
this.serialConfigCallback=null;
this.onBuzzer=null;
this.isConnectorPackFitted=function (){
for(var i=0;i<2;i++){
var p=_packs[i];
if(p&&p.isFormatted()){
var raw=p.getRawData();
if(raw&&raw.length>0&&raw[0]===0x02){
return true;
}
}
}
return false;
};
function getSciBaudRate(){
if((_timer2_tconr&0xff)===0xff||(_timer2_tconr&0xff)===0){
return 9600;
}
var ss=_sci_rmcr&0x03;
var prescalers=[16,128,1024,4096];
var prescaler=prescalers[ss]||16;
var div=_timer2_tconr&0xff;
var rawBaud=921600/(prescaler*div);
var stdBauds=[150,300,600,1200,2400,4800,9600,19200];
var best=9600;
var bestDiff=Infinity;
for(var i=0;i<stdBauds.length;i++){
var d=Math.abs(rawBaud-stdBauds[i]);
if(d<bestDiff){
bestDiff=d;
best=stdBauds[i];
}
}
return best;
}
function getSciByteTicks(){
var baud=getSciBaudRate();
var ticksPerByte=Math.floor((921600/baud)*10);
if(ticksPerByte<200)return 200;
if(ticksPerByte>184320)return 960;
return ticksPerByte;
}
function tryFeedNextRxByte(){
if(!_this.isConnectorPackFitted())return;
if(_sci_rx_queue.length===0)return;
if((_sci_trcsr&0x08)===0)return;
if((_sci_trcsr&0x80)!==0)return;
if(_sci_rx_cooldown>0)return;
var b=_sci_rx_queue.shift()&0xff;
_sci_rdr=b;
_sci_trcsr|=0x80;
_sci_rdrf_read=false;
_sci_rx_count++;
}
function notifySerialConfig(){
if(typeof _this.serialConfigCallback==="function"){
_this.serialConfigCallback(_this.getSerialState());
}
}
this.onSwitchOnOff=function (){};
this.nmiWakeupCallback=null;
this.setClockAtNMI=false;
this.clockCallback=function (){};
this.isReady=function (){
return _memory.isReady()&&(!_packs[0]||_packs[0].isReady())&&(!_packs[1]||_packs[1].isReady());
};
this.getPacks=function (){
return _packs;
};
this.setPack=function (pack,slot){
if(slot>=0&&slot<2){
_packs[slot]=pack||new Pack();
if(_packs[slot]&&typeof _packs[slot].reset==="function")_packs[slot].reset();
}
};
this.read=function (address){
address&=0xffff;
if(address<0x20){
return this.processorRead(address);
}else if(address<0x100){
return _memory.read(address);
}else if(address<0x4000){
return this.semicustom(address,0,false);
}else {
return _memory.read(address);
}
};
this.write=function (address,b){
address&=0xffff;
b&=0xff;
if(address<0x20){
processorWrite(address,b);
}else if(address<0x100){
_memory.write(address,b);
}else if(address<0x4000){
this.semicustom(address,b,true);
}else {
_memory.write(address,b);
}
};
this.semicustom=function (address,data,write){
if(address<0x2000){
return 0xff;
}
if(address<0x2800){
var isOdd=(address&1)!==0;
if(!isOdd){
if(write){
_display.command(data);
return 0;
}else {
return _display.getStatus();
}
}else {
if(write){
_display.setData(data);
return 0;
}else {
return _display.getData();
}
}
}
if(address<0x3000){
if((address&0x0200)!==0){
this.switchOff();
return 0;
}
var newLatchState=((address&0x0400)===0)?1:0;
if(newLatchState!==_buzzerPrevLatchState){
if(_buzzerPrevLatchState!==-1&&_totalBusTicks>_buzzerLastToggleTick){
_buzzerHalfPeriodTicks=_totalBusTicks-_buzzerLastToggleTick;
if(_buzzerHalfPeriodTicks>=20&&_buzzerHalfPeriodTicks<=5000){
var detectedFreq=Math.round(460800/_buzzerHalfPeriodTicks);
if(detectedFreq>=80&&detectedFreq<=12000){
_buzzerPlaying=true;
if(typeof _this.onBuzzer==="function"){
try{_this.onBuzzer("start",detectedFreq);}catch(_){}
}
}
}
}
_buzzerPrevLatchState=newLatchState;
_buzzerLastToggleTick=_totalBusTicks;
}
if(address<0x2C00){
_vpp21_charged=false;
_keyboard.resetCounter();
}else {
_vpp21_charged=true;
}
return 0;
}
if(address<0x4000){
_keyboard.incrementCounter();
return 0;
}
return 0xff;
};
this.processorRead=function (address){
if(address===0x00){
return _port1ddr;
}else if(address===0x01){
return _port2ddr;
}else if(address===0x02){
return _port1actual;
}else if(address===0x03){
readPort2();
return _port2actual;
}else if(address===0x08){
return _timer1_csr;
}else if(address===0x09){
return (_timer1_frc>>8)&0xff;
}else if(address===0x0A){
return _timer1_frc&0xff;
}else if(address===0x0B){
return (_timer1_ocr>>8)&0xff;
}else if(address===0x0C){
return _timer1_ocr&0xff;
}else if(address===0x10){
return _sci_rmcr;
}else if(address===0x11){
if((_sci_trcsr&0x80)!==0)_sci_rdrf_read=true;
return _sci_trcsr;
}else if(address===0x12){
if(_sci_rdrf_read){
_sci_trcsr&=~0xc0;
_sci_rdrf_read=false;
_sci_rx_cooldown=getSciByteTicks();
}
return _sci_rdr;
}else if(address===0x13){
return _sci_tdr;
}else if(address===0x14){
return _port5rcr;
}else if(address===0x15){
var b=_keyboard.readPort5();
if(_vpp21_charged)b|=0x02;
return b;
}else if(address===0x16){
return _port6ddr;
}else if(address===0x17){
return _port6actual;
}else if(address===0x1B){
return _timer2_csr;
}else if(address===0x1C){
return _timer2_tconr;
}
return 0xff;
};
function processorWrite(address,data){
if(address===0x00){
_port1ddr=data&0xff;
_port1actual=((_port1proc&_port1ddr)|(_port1actual&(~_port1ddr&0xff)))&0xff;
}else if(address===0x01){
if(data!==_port2ddr){
_port2ddr=data;
var newp2=((_port2proc&_port2ddr)+(_port2actual&(~_port2ddr&0xff)))&0xff;
_port2actual=newp2;
writePort2or6();
}
}else if(address===0x02){
var prevBit2=_port1actual&0x04;
_port1proc=data&0xff;
_port1actual=((_port1proc&_port1ddr)|(_port1actual&(~_port1ddr&0xff)))&0xff;
var newBit2=_port1actual&0x04;
if(newBit2!==prevBit2){
_buzzerLastToggleTick=_totalBusTicks;
if(newBit2!==0&&!_buzzerPlaying){
_buzzerPlaying=true;
var freq=(_memory.read(0xDB)<<8)|_memory.read(0xDC);
if(freq<100||freq>20000)freq=3600;
if(typeof _this.onBuzzer==="function"){
try{_this.onBuzzer("start",freq);}catch(_){}
}
}
}
}else if(address===0x03){
_port2proc=data;
var newp2=((_port2proc&_port2ddr)+(_port2actual&(~_port2ddr&0xff)))&0xff;
if(_port2actual!==newp2){
_port2actual=newp2;
writePort2or6();
}
}else if(address===0x08){
_timer1_csr=data;
}else if(address===0x09){
_timer1_frc=(_timer1_frc&0xff)|((data&0xff)<<8);
}else if(address===0x0A){
_timer1_frc=(_timer1_frc&0xff00)|(data&0xff);
}else if(address===0x0B){
_timer1_ocr=(_timer1_ocr&0xff)|((data&0xff)<<8);
}else if(address===0x0C){
_timer1_ocr=(_timer1_ocr&0xff00)|(data&0xff);
}else if(address===0x10){
_sci_rmcr=data&0xff;
notifySerialConfig();
}else if(address===0x11){
var prevRe=_sci_trcsr&0x08;
_sci_trcsr=(_sci_trcsr&0xc0)|0x20|(data&0x1f);
if((data&0x08)===0){
_sci_trcsr&=~0xc0;
_sci_rdrf_read=false;
}else if(prevRe===0){
tryFeedNextRxByte();
}
notifySerialConfig();
}else if(address===0x13){
_sci_tdr=data&0xff;
if((_sci_trcsr&0x02)!==0&&_this.isConnectorPackFitted()){
_sci_tx_count++;
if(typeof _this.serialTxCallback==="function"){
_this.serialTxCallback(_sci_tdr);
}
}
}else if(address===0x14){
_port5rcr=data;
}else if(address===0x16){
_port6ddr=data;
writePort2or6();
}else if(address===0x17){
_port6proc=data;
_port6actual=data;
writePort2or6();
}else if(address===0x1B){
_timer2_csr=data&0xff;
notifySerialConfig();
}else if(address===0x1C){
_timer2_tconr=data&0xff;
notifySerialConfig();
}
}
function writePort2or6(){
var control=_port6actual&0x0f;
if((_port2ddr&0xff)!==0xff)control|=PackPin.P2DDR;
if(_vpp21_charged)control|=PackPin.V21V;
var cs1=(_port6actual&0x10)===0;
var cs2=(_port6actual&0x20)===0;
if(_packs[0])_packs[0].writeControlPort(control,_port2actual,_vpp21_charged,cs1);
if(_packs[1])_packs[1].writeControlPort(control,_port2actual,_vpp21_charged,cs2);
}
function readPort2(){
if((_port2ddr&0xff)!==0xff){
var r=0;
if((_port6actual&0x10)===0){
r|=_packs[0]?_packs[0].readDataBus():0xff;
}
if((_port6actual&0x20)===0){
r|=_packs[1]?_packs[1].readDataBus():0xff;
}
_port2actual=((_port2proc&_port2ddr)+(r&(~_port2ddr&0xff)))&0xff;
}
}
this.isSwitchedOff=function (){return _switched_off;};
this.getTicksSinceNMI=function (){return _ticksSinceNMI;};
this.switchOff=function (){
var wasNmiWakeup=_isNmiCounterWakeup;
_isNmiCounterWakeup=false;
_switched_off=true;
_NMItoCtr=true;
_vpp21_charged=false;
if(_buzzerPlaying){
_buzzerPlaying=false;
if(typeof _this.onBuzzer==="function"){
try{_this.onBuzzer("stop");}catch(_){}
}
}
_display.switchOff();
this.onSwitchOnOff(false,wasNmiWakeup);
};
this.switchOn=function (isNmiWakeup){
_isNmiCounterWakeup=!!isNmiWakeup;
_switched_off=false;
_NMItoCtr=false;
_OCIdue=false;
_timer1_csr=0;
_vpp21_charged=false;
_port5rcr=(_port5rcr&0x80)|0x40;
_display.switchOn();
this.onSwitchOnOff(true,_isNmiCounterWakeup);
};
this.incStandbyTicks=function (n){
_ticksSinceNMI+=n;
if(_keyboard&&_keyboard.tick)_keyboard.tick(n);
if(_sci_rx_cooldown>0){
_sci_rx_cooldown-=n;
if(_sci_rx_cooldown<=0){
_sci_rx_cooldown=0;
tryFeedNextRxByte();
}
}else if(_sci_rx_queue.length>0&&(_sci_trcsr&0x88)===0x08){
tryFeedNextRxByte();
}
};
this.isSCIdue=function (){
if(((_sci_trcsr&0xc0)!==0&&(_sci_trcsr&0x10)!==0)||
((_sci_trcsr&0x20)!==0&&(_sci_trcsr&0x04)!==0)){
return true;
}
return false;
};
this.receiveSerialBytes=function (bytes){
if(!bytes||!_this.isConnectorPackFitted())return;
for(var i=0;i<bytes.length;i++){
_sci_rx_queue.push(bytes[i]&0xff);
}
tryFeedNextRxByte();
};
this.receiveSerialByte=function (b){
if(!_this.isConnectorPackFitted())return;
_sci_rx_queue.push(b&0xff);
tryFeedNextRxByte();
};
this.clearSerialRxQueue=function (){
_sci_rx_queue.length=0;
_sci_rx_cooldown=0;
};
this.setSerialLines=function (cts,dsr){
if(typeof cts==="boolean")_sci_cts=cts;
if(typeof dsr==="boolean")_sci_dsr=dsr;
};
this.getSerialState=function (){
return {
connectorFitted:_this.isConnectorPackFitted(),
baudRate:getSciBaudRate(),
rmcr:_sci_rmcr,
trcsr:_sci_trcsr,
tcsr2:_timer2_csr,
tconr:_timer2_tconr,
rxEnabled:(_sci_trcsr&0x08)!==0,
txEnabled:(_sci_trcsr&0x02)!==0,
ctsReady:_sci_cts,
dsrReady:_sci_dsr,
rxQueueLength:_sci_rx_queue.length,
txCount:_sci_tx_count,
rxCount:_sci_rx_count
};
};
this.resetSerialCounters=function (){
_sci_tx_count=0;
_sci_rx_count=0;
_sci_rx_queue.length=0;
};
this.incFrame=function (n){
_totalBusTicks+=n;
if(_buzzerPlaying&&(_totalBusTicks-_buzzerLastToggleTick)>4000){
_buzzerPlaying=false;
if(typeof _this.onBuzzer==="function"){
try{_this.onBuzzer("stop");}catch(_){}
}
}
var prev_frc=_timer1_frc;
_timer1_frc=(_timer1_frc+n)&0xffff;
if(((_timer1_ocr-prev_frc-1)&0xffff)<n){
_OCIdue=true;
}
_ticksSinceNMI+=n;
if(_keyboard&&_keyboard.tick)_keyboard.tick(n);
if(_sci_rx_cooldown>0){
_sci_rx_cooldown-=n;
if(_sci_rx_cooldown<=0){
_sci_rx_cooldown=0;
tryFeedNextRxByte();
}
}else if(_sci_rx_queue.length>0&&(_sci_trcsr&0x88)===0x08){
tryFeedNextRxByte();
}
};
this.isSCIdue=function (){
if(((_sci_trcsr&0xc0)!==0&&(_sci_trcsr&0x10)!==0)||
((_sci_trcsr&0x20)!==0&&(_sci_trcsr&0x04)!==0)){
return true;
}
return false;
};
this.receiveSerialBytes=function (bytes){
if(!bytes||!_this.isConnectorPackFitted())return;
for(var i=0;i<bytes.length;i++){
_sci_rx_queue.push(bytes[i]&0xff);
}
tryFeedNextRxByte();
};
this.receiveSerialByte=function (b){
if(!_this.isConnectorPackFitted())return;
_sci_rx_queue.push(b&0xff);
tryFeedNextRxByte();
};
this.clearSerialRxQueue=function (){
_sci_rx_queue.length=0;
_sci_rx_cooldown=0;
};
this.setSerialLines=function (cts,dsr){
if(typeof cts==="boolean")_sci_cts=cts;
if(typeof dsr==="boolean")_sci_dsr=dsr;
};
this.getSerialState=function (){
return {
connectorFitted:_this.isConnectorPackFitted(),
baudRate:getSciBaudRate(),
rmcr:_sci_rmcr,
trcsr:_sci_trcsr,
tcsr2:_timer2_csr,
tconr:_timer2_tconr,
rxEnabled:(_sci_trcsr&0x08)!==0,
txEnabled:(_sci_trcsr&0x02)!==0,
ctsReady:_sci_cts,
dsrReady:_sci_dsr,
rxQueueLength:_sci_rx_queue.length,
txCount:_sci_tx_count,
rxCount:_sci_rx_count
};
};
this.resetSerialCounters=function (){
_sci_tx_count=0;
_sci_rx_count=0;
_sci_rx_queue.length=0;
};
this.isOCIdue=function (){
if(!_OCIdue)return false;
_OCIdue=false;
if(_switched_off&&_keyboard.isOnPressed()){
this.switchOn();
}
return (_timer1_csr&0x08)!==0;
};
this.isNMIdue=function (){
if(_ticksSinceNMI<460800)return false;
_ticksSinceNMI=0;
if(_NMItoCtr){
_keyboard.incrementCounter();
if(_keyboard.counterHasOverflowed()){
this.switchOn(true);
if(typeof this.nmiWakeupCallback==="function"){
this.nmiWakeupCallback();
}
}
return false;
}
if(this.setClockAtNMI){
this.setClockAtNMI=false;
this.syncSystemClock();
this.clockCallback();
}
return true;
};
this.isOnPressed=function (){
return _keyboard?_keyboard.isOnPressed():false;
};
this.syncSystemClock=function (){
var d=new Date();
var sec=d.getSeconds();
var hfsec=sec*2+(d.getMilliseconds()>=500?1:0);
_memory.write(0x42,hfsec);
_memory.write(0x43,d.getMinutes());
_memory.write(0x44,d.getHours());
_memory.write(0x45,d.getDate()-1);
_memory.write(0x46,d.getMonth());
};
this.getSnapshotData=function (arr){
var arr2=[
_switched_off?1:0,0,_OCIdue?1:0,_NMItoCtr?1:0,
_sca_alarmhigh?1:0,_vpp21_charged?1:0,
_port2proc,_port2actual,_port2ddr,
_port6proc,_port6actual,_port6ddr,_port5rcr,
_timer1_ocr>>8,_timer1_ocr&0xff,
_timer1_frc>>8,_timer1_frc&0xff,
_timer1_csr,
_ticksSinceNMI>>16,(_ticksSinceNMI>>8)&0xff,_ticksSinceNMI&0xff
];
var ln=arr.length;
for(var i=0;i<arr2.length;i++)arr[ln++]=arr2[i];
};
this.applySnapshotData=function (snapshot){
_switched_off=snapshot.readByte()!==0;
snapshot.readByte();
_OCIdue=snapshot.readByte()!==0;
_NMItoCtr=snapshot.readByte()!==0;
_sca_alarmhigh=snapshot.readByte()!==0;
_vpp21_charged=snapshot.readByte()!==0;
_port2proc=snapshot.readByte();
_port2actual=snapshot.readByte();
_port2ddr=snapshot.readByte();
_port6proc=snapshot.readByte();
_port6actual=snapshot.readByte();
_port6ddr=snapshot.readByte();
_port5rcr=snapshot.readByte();
_timer1_ocr=snapshot.readWord();
_timer1_frc=snapshot.readWord();
_timer1_csr=snapshot.readByte();
_ticksSinceNMI=snapshot.readByte();
_ticksSinceNMI=(_ticksSinceNMI<<8)+snapshot.readByte();
_ticksSinceNMI=(_ticksSinceNMI<<8)+snapshot.readByte();
};
_display.switchOff();
}