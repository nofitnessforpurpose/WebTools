'use strict';
var PackPin={
SCLK:0x01,
SMR:0x02,
SPGM_B:0x04,
SOE_B:0x08,
SVPP:0x10,
V21V:0x20,
P2DDR:0x40
};
var CommandType={
Read:0,
Write:1,
Other:2,
ReadId:3
};
function PackCounterLinear(ln){
var _address=0;
var _length=ln||16384;
var _sclkCount=0;
var _lastPgm=1;
this.length=function (){return _length;};
this.reset=function (){_address=0;_sclkCount=0;_lastPgm=1;};
this.address=function (){return _address;};
this.controlPort=function (pins,databus){
if((pins&PackPin.SMR)!==0){
_address=0;
_sclkCount=0;
_lastPgm=(pins&PackPin.SPGM_B)!==0?1:0;
return;
}
var pgm=(pins&PackPin.SPGM_B)!==0?1:0;
var isProgramming=(pins&PackPin.V21V)!==0&&(pins&PackPin.SOE_B)!==0;
if(_lastPgm===1&&pgm===0&&_sclkCount===0&&!isProgramming){
_address=(_address+256)%_length;
}
_lastPgm=pgm;
if((pins&PackPin.SCLK)!==(_address&1)){
++_address;
_address%=_length;
++_sclkCount;
}
};
}
function PackCounterPaged(ln){
var _page=0;
var _byte=0;
var _length=ln||32768;
var _maxPages=Math.floor(_length/256);
var _lastPgm=1;
this.length=function (){return _length;};
this.reset=function (){_page=0;_byte=0;_lastPgm=1;};
this.address=function (){return (_page*256)+_byte;};
this.controlPort=function (pins,databus){
if((pins&PackPin.SMR)!==0){
_page=0;
_byte=0;
_lastPgm=(pins&PackPin.SPGM_B)!==0?1:0;
return;
}
var pgm=(pins&PackPin.SPGM_B)!==0?1:0;
if(_lastPgm===1&&pgm===0){
_page=(_page+1)%_maxPages;
}
_lastPgm=pgm;
if((pins&PackPin.SCLK)!==(_byte&1)){
_byte=(_byte+1)%256;
}
};
}
function PackControllerEprom(){
this.isRam=false;
this.controlPort=function (pins){
if((pins&PackPin.SOE_B)===0){
return CommandType.Read;
}else if((pins&PackPin.SPGM_B)===0){
return CommandType.Write;
}
return CommandType.Other;
};
}
function PackControllerRam(){
this.isRam=true;
this.controlPort=function (pins){
if((pins&PackPin.SMR)!==0){
if((pins&PackPin.SOE_B)===0&&(pins&PackPin.SPGM_B)!==0){
return CommandType.ReadId;
}
return CommandType.Other;
}
if((pins&PackPin.SOE_B)===0){
return CommandType.Read;
}
if((pins&PackPin.P2DDR)===0){
return CommandType.Write;
}
return CommandType.Other;
};
}
function PackControllerRom(){
this.isRam=false;
this.controlPort=function (pins){
if((pins&PackPin.SOE_B)===0){
return CommandType.Read;
}
return CommandType.Other;
};
}
function Pack(inputData,callback){
var _name="Empty";
var _outputDataBus=0x00;
var _data=null;
var _changed=false;
var _controller=new PackControllerEprom();
var _counter=new PackCounterLinear(16384);
var _isReady=false;
var _url=null;
var _blob=null;
this.isReady=function (){
if(!_isReady){
if(typeof inputData==='string'){
var sPath=inputData;
inputData=new BinaryFile(sPath,false,function (){
if(inputData.isReady()){
var d=inputData.getData();
if(d)loadOP1Data(d,_name);
}
if(callback)callback();
});
var fileName=inputData.getName()||sPath;
_name=fileName.replace(/^.*[\\\/]/,'').replace(/\.[^.]+$/,'');
if(inputData.isReady()){
var d=inputData.getData();
if(d)loadOP1Data(d,_name);
}
}else if(inputData&&(typeof inputData.getData==='function'||(typeof BinaryFile!=='undefined'&&inputData instanceof BinaryFile))){
var fileName=(typeof inputData.getName==='function')?inputData.getName():"Pack";
_name=fileName.replace(/^.*[\\\/]/,'').replace(/\.[^.]+$/,'');
if(inputData.isReady()){
var d=inputData.getData();
if(d)loadOP1Data(d,_name);
}
if(callback)setTimeout(callback,0);
}else if(inputData&&inputData.bytes){
_name=inputData.name||"Custom Pack";
loadOP1Data(inputData.bytes,_name,inputData);
if(callback)setTimeout(callback,0);
}else if(inputData&&inputData.name&&(inputData.filename||inputData.file)){
_name=inputData.name;
if(!inputData.file){
inputData.file=new BinaryFile(inputData.filename,false,function (err){
var d=inputData.file.getData();
if(d)loadOP1Data(d,inputData.name,inputData);
if(callback)callback();
});
}else if(inputData.file.isReady()){
var d=inputData.file.getData();
if(d)loadOP1Data(d,inputData.name,inputData);
}
}else if(inputData&&inputData.name&&inputData.size){
formatBlankPack(inputData.name,inputData.size,inputData);
if(callback)setTimeout(callback,0);
}else {
_isReady=true;
if(callback)setTimeout(callback,0);
}
}
return _isReady;
};
this.name=function (){return _name;};
this.getRawData=function (){return _data;};
this.isFormatted=function (){return _data&&_data.length>0&&(_data[0]===0xFC||_data[0]===0x03||_data[0]===0x02);};
this.reset=function (){
if(_counter)_counter.reset();
};
this.readByte=function (addr){
if(!_data){
if(!_isReady)this.isReady();
if(!_data)return 0x00;
}
if(addr>=_data.length)return 0xff;
return _data[addr];
};
this.writeByte=function (addr,val){
if(!_data||addr>=_data.length)return;
var oldVal=_data[addr];
var newVal=oldVal&(val&0xff);
if(oldVal!==newVal){
_data[addr]=newVal;
_changed=true;
}
};
this.writeRamByte=function (addr,val){
if(!_data||addr>=_data.length)return;
var newVal=val&0xff;
if(_data[addr]!==newVal){
_data[addr]=newVal;
_changed=true;
}
};
this.writeControlPort=function (control,databus,vppCharged,selected){
if(!_data){
if(!_isReady)this.isReady();
if(!_data)return false;
}
_counter.controlPort(control);
if(!selected){
return false;
}
var cmd=_controller.controlPort(control);
if(cmd===CommandType.ReadId){
_outputDataBus=0x01;
}else if(cmd===CommandType.Read){
_outputDataBus=this.readByte(_counter.address());
}else if(cmd===CommandType.Write){
if(_controller.isRam){
this.writeRamByte(_counter.address(),databus);
return true;
}else if(vppCharged||(control&PackPin.V21V)!==0){
this.writeByte(_counter.address(),databus);
return true;
}
}
return false;
};
this.readDataBus=function (){
return _outputDataBus;
};
function formatBlankPack(name,sizeInKb,opts){
opts=opts||{};
_name=name;
var totalBytes=(sizeInKb||16)*1024;
var isRam=!!(opts.isRam||opts.type==='ram');
var isPaged=opts.isPaged!==undefined?!!opts.isPaged:(isRam||totalBytes>=32768);
_data=new Uint8Array(totalBytes);
for(var i=0;i<totalBytes;i++)_data[i]=0xff;
if(!opts.rawErased){
_data[0]=0xFC;
var sizeMinusOne=totalBytes-1;
_data[1]=(sizeMinusOne>>8)&0xff;
_data[2]=sizeMinusOne&0xff;
for(var j=3;j<10;j++)_data[j]=0xff;
}
_counter=(isPaged&&totalBytes>=32768)?new PackCounterPaged(totalBytes):new PackCounterLinear(totalBytes);
_controller=isRam?new PackControllerRam():new PackControllerEprom();
_changed=false;
_isReady=true;
}
this.formatBlankPack=formatBlankPack;
function loadOP1Data(raw,name,opts){
opts=opts||{};
if(!raw||raw.length===0){
_isReady=false;
return;
}
_name=name;
var payload=raw;
if(raw.length>=6&&raw[0]===0x4F&&raw[1]===0x50&&raw[2]===0x4B){
payload=raw.subarray(6);
}
var totalSize=opts.capacity||payload.length;
var physicalCap=8192;
while(physicalCap<totalSize&&physicalCap<65536){
physicalCap*=2;
}
totalSize=Math.max(totalSize,physicalCap);
if(payload[0]===0xFC&&payload.length>=3){
var declaredSize=((payload[1]<<8)|payload[2])+1;
if(declaredSize>=8192&&declaredSize<=65536){
totalSize=Math.max(totalSize,declaredSize);
}
}
_data=new Uint8Array(totalSize);
for(var i=0;i<totalSize;i++)_data[i]=0xff;
_data.set (payload,0);
var lowerName=name?name.toLowerCase():"";
var isRam=!!(opts.isRam||opts.type==='ram'|| /rampack|ram\s*pack/.test(lowerName));
var isLinearName=lowerName.includes("linear")||lowerName.includes("lin");
var isPaged=opts.isPaged!==undefined?!!opts.isPaged:
((totalSize>=32768&&!isLinearName)||lowerName.includes("paged")||lowerName.includes("pgc")||isRam);
if(opts.isPaged===undefined&&payload&&payload.length>=0x00E0&&payload[0]===0x03){
if(payload[0x00DD]===0x7E){
isPaged=true;
}else if((payload[0x00DD]===0xDF&&payload[0x00DE]===0x54)||
(payload.length>=0x00E6&&payload[0x00E3]===0xBD&&payload[0x00E4]===0xFA&&payload[0x00E5]===0x98)){
isPaged=false;
}
}
if(isPaged&&totalSize>=32768){
_counter=new PackCounterPaged(totalSize);
}else {
_counter=new PackCounterLinear(totalSize);
}
_controller=isRam?new PackControllerRam():new PackControllerEprom();
_changed=false;
_isReady=true;
}
this.getOP1Bytes=function (){
if(!_data)return null;
var len=_data.length;
while(len>10&&_data[len-1]===0xff)len--;
if(len<10)len=10;
var out=new Uint8Array(len+6);
out[0]=0x4F;
out[1]=0x50;
out[2]=0x4B;
out[3]=(len>>16)&0xff;
out[4]=(len>>8)&0xff;
out[5]=len&0xff;
for(var i=0;i<len;i++)out[i+6]=_data[i];
return out;
};
this.getName=function (){return _name;};
this.getInfo=function (){
return {
name:_name,
size:_data?_data.length:0,
isEprom:_controller?!_controller.isRam:true,
isRam:_controller?!!_controller.isRam:false,
isFormatted:this.isFormatted()
};
};
this.exportBytes=function (){
return this.getOP1Bytes()||(_data||new Uint8Array(0));
};
this.getDownloadURL=function (){
var bytes=this.getOP1Bytes();
if(!bytes)return null;
if(_url&&!_changed)return _url;
var wu=window.webkitURL||window.URL;
if(_url)wu.revokeObjectURL(_blob);
_blob=new Blob([bytes],{type:'application/octet-stream'});
_url=wu.createObjectURL(_blob);
return _url;
};
this.isReady();
}
Pack.createBlank=function (sizeBytes,name,opts){
var sizeInKb=Math.round((sizeBytes||16384)/1024);
var o=Object.assign({name:name||(sizeInKb+"K BLANK"),size:sizeInKb},opts||{});
return new Pack(o);
};
Pack.createBlankRam=function (sizeBytes,name,opts){
var sizeInKb=Math.round((sizeBytes||32768)/1024);
var o=Object.assign({name:name||(sizeInKb+"K RAM"),size:sizeInKb,isRam:true,isPaged:sizeInKb>=32},opts||{});
return new Pack(o);
};