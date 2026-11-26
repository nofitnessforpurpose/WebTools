'use strict';
function Memory(romFile){
var _romFile=romFile;
var _romData=null;
var _zeroPageRam=new Uint8Array(256);
var _systemRam=new Uint8Array(2048);
this.isReady=function (){
if(_romData)return true;
if(!_romFile||!_romFile.isReady())return false;
var d=_romFile.getData();
if(!d)return false;
if(d.length>=4096){
_romData=d.length===4096?d:d.subarray(d.length-4096);
}else {
_romData=new Uint8Array(4096);
_romData.set (d,4096-d.length);
}
return true;
};
this.read=function (address){
address&=0xffff;
if(address>=0x0040&&address<0x0100){
return _zeroPageRam[address];
}
if(address>=0x4000&&address<=0x47FF){
return _systemRam[address-0x4000];
}
if(address>=0xF000){
if(!_romData){
if(_romFile&&_romFile.isReady()){
var d=_romFile.getData();
_romData=(d.length===4096)?d:d.subarray(d.length-4096);
}else {
return 0xff;
}
}
return _romData[address-0xF000];
}
return 0xff;
};
this.write=function (address,b){
address&=0xffff;
b&=0xff;
if(address>=0x0040&&address<0x0100){
_zeroPageRam[address]=b;
return;
}
if(address>=0x4000&&address<=0x47FF){
_systemRam[address-0x4000]=b;
return;
}
};
this.nextrom=function (){};
this.nextram=function (){};
this.resetBank=function (){};
this.getSnapshotData=function (arr){
var ln=arr.length;
for(var i=0x40;i<0x100;i++)arr[ln++]=_zeroPageRam[i];
for(var j=0;j<2048;j++)arr[ln++]=_systemRam[j];
};
this.applySnapshotData=function (snapshot){
for(var i=0x40;i<0x100;i++)_zeroPageRam[i]=snapshot.readByte();
for(var j=0;j<2048;j++)_systemRam[j]=snapshot.readByte();
};
this.getZeroPage=function (){return _zeroPageRam;};
this.getSystemRam=function (){return _systemRam;};
this.getRom=function (){return _romData;};
}