'use strict';


function PackImage(inputData,sizeCode){
this.items=[];
this.path=null;
if(!inputData){

var sc=sizeCode||1;
var now=new Date();
var ms=(now.getMinutes()*60+now.getSeconds())*1000+now.getMilliseconds();
ms&=0xffff;


var headerByte=0x7a;
if(sc>=4)headerByte|=0x04;

inputData=[0,0,0,0,0,0,
headerByte,sc,now.getFullYear()-1900,now.getMonth(),now.getDate()-1,now.getHours(),ms>>8,ms&0xff,0xff,0xff];
var sum1=inputData[6]+inputData[8]+inputData[10]+inputData[12];
var sum2=inputData[7]+inputData[9]+inputData[11]+inputData[13];
sum1+=(sum2>>8);
inputData[14]=sum1&0xff;
inputData[15]=sum2&0xff;
}



this.items[0]=getHeader(inputData);




var ix=16;
while(ix<inputData.length){
var result=readItem(inputData,ix);
if(!result)break;
if(result.error){
alert(result.error);
break;
}
this.items[this.items.length]=result.item;
ix=result.nextIx;
}


if(!arguments[0]){



var mainHdrBytes=[0x09,0x81,77,65,73,78,32,32,32,32,0x90];
var headerItem=new PackItem(mainHdrBytes,0,11);
headerItem.setDescription();


this.items.push(headerItem);
}



for(var i=this.items.length-1;i>=0;i--){
if(this.items[i].type===255)this.items.splice(i,1);
}

var terminator=new PackItem([0xff,0xff],0,2);
terminator.type=255;
terminator.desc="End Of Pack";
terminator.name="End Of Pack";
this.items.push(terminator);


for(var ix=this.items.length-1;ix>0;ix--){
var tp1=this.items[ix-1].type;
var tp2=this.items[ix].type;
if(tp1>=2&&tp1<=15&&tp2==0){
this.items[ix-1].child=this.items[ix]
this.items.splice(ix,1);
}
}
}
PackImage.prototype={
getLength:function (){
var ln=0;
for(var i=0;i<this.items.length;i++){
ln+=this.items[i].getLength();
}
return ln;
},
eraseDeleted:function (){
for(var i=this.items.length-1;i>0;i--){
var item=this.items[i];
if(item.deleted){
this.items.splice(i,1);
}
}
},
getRawData:function (){



var totalLen=this.getLength();
var declaredLen=totalLen-2;

var allocSize=totalLen+6;

var savedata=new Uint8Array(allocSize);

for(var k=0;k<allocSize;k++)savedata[k]=0xFF;

savedata[0]=79;
savedata[1]=80;
savedata[2]=75;


savedata[3]=(declaredLen>>16)&0xff;
savedata[4]=(declaredLen>>8)&0xff;
savedata[5]=declaredLen&0xff;

var ix=6;
for(var i=0;i<this.items.length;i++){

ix+=this.items[i].storeData(savedata,ix);
}

return savedata;
},
getURL:function (){
var wu=window.webkitURL||window.URL;
if(this.url){
wu.revokeObjectURL(this.url);
this.url=null;
}
var savedata=this.getRawData();
var blob=new Blob([savedata],{type:'application/octet-stream'});
this.url=wu.createObjectURL(blob);
return this.url;
},
getHexURL:function (){
var wu=window.webkitURL||window.URL;
if(this.hexurl){
wu.revokeObjectURL(this.hexurl);
this.hexurl=null;
}

































var contentLen=this.getLength();
var allocSize=contentLen;

var savedata=new Uint8Array(allocSize);
for(var k=0;k<allocSize;k++)savedata[k]=0xFF;

var ix=0;
for(var i=0;i<this.items.length;i++){

ix+=this.items[i].storeData(savedata,ix);
}

var hexString=createIntelHexFromBinary(savedata);
var blob=new Blob([hexString],{type:'text/plain'});
this.hexurl=wu.createObjectURL(blob);
return this.hexurl;
},
getItemURL:function (item){
var wu=window.webkitURL||window.URL;
if(this.itemurl){
wu.revokeObjectURL(this.itemurl);
this.itemurl=null;
}


var tp=item.type;
if(!tp||tp<1||tp>15)return null;


if(tp==1){
var fileid=item.data[10]&0x7f;
var savedata="";
for(var ix=0;ix<this.items.length;ix++){
var item=this.items[ix];
if(item.type==fileid&&!item.deleted){
for(var i=2;i<item.data.length-1;i++){
savedata+=String.fromCharCode(item.data[i]);
}
savedata+="\n";
}
}
var blob=new Blob([savedata],{type:'text/plain'});
this.itemurl=wu.createObjectURL(blob);


}else {
while(item.child)item=item.child;
var ln=item.data.length;
var savedata=new Uint8Array(new ArrayBuffer(6+ln));
savedata[0]=79;
savedata[1]=82;
savedata[2]=71;
savedata[3]=(ln>>8)&0xff;
savedata[4]=ln&0xff;
savedata[5]=tp+0x80;
for(var i=0;i<ln;i++){
savedata[6+i]+=item.data[i];
}
var blob=new Blob([savedata],{type:'application/octet-stream'});
this.itemurl=wu.createObjectURL(blob);
}
return this.itemurl;
},
}




var FileDescriptions={
0xff:"Failed length-byte",
0x90:"File record ",
0x8f:"Block file of type 15",
0x8e:"Block file of type 14",
0x8d:"Block file of type 13",
0x8c:"Block file of type 12",
0x8b:"Block file of type 11",
0x8a:"Block file of type 10",
0x89:"Block file of type 9",
0x88:"Block file of type 8",
0x87:"Notepad file",
0x86:"Pager setup file",
0x85:"Spreadsheet file",
0x84:"Comms Link Setup",
0x83:"Procedure",
0x82:"CM/XP diary file",
0x81:"Data file ",
0x80:"Long Record",
0x10:"Deleted file record ",
0x0f:"Deleted block file of type 15",
0x0e:"Deleted block file of type 14",
0x0d:"Deleted block file of type 13",
0x0c:"Deleted block file of type 12",
0x0b:"Deleted block file of type 11",
0x0a:"Deleted block file of type 10",
0x09:"Deleted block file of type 9",
0x08:"Deleted block file of type 8",
0x07:"Deleted notepad file",
0x06:"Deleted pager setup file",
0x05:"Deleted spreadsheet file",
0x04:"Deleted Comms Link Setup",
0x03:"OPL Text (Source)",
0x02:"Deleted CM/XP diary file",
0x01:"Deleted data file ",
0x00:"Failed data block header",
};

function PackItem(inputData,start,len){
this.data=new Uint8Array(len);
for(var i=0;i<len;i++){
this.data[i]=inputData[start+i];
}
this.length=len;
this.child=null;
}
PackItem.prototype={
getLength:function (){
return this.child?this.length+this.child.getLength():this.length;
},
setData:function (newdata){
this.data=newdata;
this.length=newdata.length;
},
storeData:function (outputArray,start){
for(var i=0;i<this.length;i++){
outputArray[start+i]=this.data[i];
}
var ln=this.length;;
if(this.child){
ln+=this.child.storeData(outputArray,start+ln);
}
return ln;
},
setDescription:function (){
var tp=this.data[1];
this.deleted=(tp&0x80)==0;
this.type=tp&0x7f;

if(tp>=0x90&&tp<0xff){
this.desc=FileDescriptions[0x90]+(tp-0x8f);
}else if(tp==0x81){
this.desc=FileDescriptions[tp]+(this.data[10]-0x8f);
}else if(tp>=0x10&&tp<0x7f){
this.desc=FileDescriptions[0x10]+(tp-0x0f);
}else if(tp==0x01){
this.desc=FileDescriptions[tp]+(this.data[10]-0x8f);
}else {
this.desc=FileDescriptions[tp];
}

if(this.type>=0x01&&this.type<=0x0f){

var s="";
for(var i=2;i<this.data.length-1;i++){
s+=String.fromCharCode(this.data[i]);
}
this.name=s.trim();
}else {
this.name="";
}
},
getFullData:function (){
var ln=this.getLength();
var fullData=new Uint8Array(ln);
this.storeData(fullData,0);
return fullData;
},
};




function getHeader(inputData){
var item=new PackItem(inputData,6,10);
item.desc="Header";
item.name="";
item.type=-1;
return item;
}

function readItem(inputData,ix){
var len=inputData[ix];
if(len==0xff)return null;
var tp=inputData[ix+1];
if(tp==0xff)len=0;
var item=new PackItem(inputData,ix,len+2);
ix+=len+2;
item.setDescription();
if(item.type==0x00&&!item.deleted){
var blocklen=item.data[2]*256+item.data[3];
item.child=new PackItem(inputData,ix,blocklen);
ix+=blocklen;
}
return {item:item,nextIx:ix};
}