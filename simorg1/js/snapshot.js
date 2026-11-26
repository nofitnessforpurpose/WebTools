'use strict';

function Snapshot(source){
var _data;
var _file;
var _url;
var _blob;
var _pointer=0;

if(source.data){
_data=new Uint8Array(new ArrayBuffer(source.data.length));
for(var i=0;i<source.data.length;i++)_data[i]=source.data[i];
}else if(source.file){
_file=source.file;
}

this.isReady=function (){
if(!_data&&_file&&_file.isReady()){
var loaddata=_file.getData();
var ln=loaddata.length;
if(loaddata[0]!=83||loaddata[1]!=78||
loaddata[2]!=65||loaddata[3]!=1){
alert("Snapshot file has an incorrect format.");
_file=null;
}
_data=new Uint8Array(new ArrayBuffer(ln-4));
for(var i=4;i<ln;i++)_data[i-4]=loaddata[i];
}
return _data?true:false;
}

this.getVersion=function (){return this.isReady?_data[0]:1;}
this.reset=function (){_pointer=0;}
this.readByte=function (){return _data[_pointer++];}
this.readWord=function (){
var b1=this.readByte();
var b2=this.readByte();
return (b1<<8)+b2;
}
this.atEnd=function (){return _pointer>=_data.length;}
this.getRawData=function (){return _data;}

this.getURL=function (){
var wu=window.webkitURL||window.URL;
if(_url)return _url;

var ln=_data.length;
var savedata=new Uint8Array(new ArrayBuffer(ln+4));
savedata[0]=83;
savedata[1]=78;
savedata[2]=65;
savedata[3]=1;
for(var i=0;i<ln;i++)savedata[i+4]=_data[i];
_blob=new Blob([savedata],{type:'application/octet-stream'});
_url=wu.createObjectURL(_blob);
return _url;
}
}