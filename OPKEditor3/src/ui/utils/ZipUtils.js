'use strict';
var ZipUtils={
createZip:async function (files){
var localHeaders=[];
var centralDirectory=[];
var currentOffset=0;
for(var i=0;i<files.length;i++){
var file=files[i];
var data;
if(file.content instanceof Blob){
data=new Uint8Array(await file.content.arrayBuffer());
}else if(typeof file.content==='string'){
data=new TextEncoder().encode(file.content);
}else if(file.content instanceof Uint8Array){
data=file.content;
}else {
data=new Uint8Array(file.content);
}
var nameBytes=new TextEncoder().encode(file.name);
var crc=Checksums.crc32(data);
var size=data.length;
var lh=new Uint8Array(30+nameBytes.length);
lh.set ([0x50,0x4b,0x03,0x04]);
lh.set ([0x0a,0x00],4);
lh.set ([0x00,0x00],6);
lh.set ([0x00,0x00],8);
lh.set ([0x00,0x00,0x00,0x00],10);
this._write32(lh,14,crc);
this._write32(lh,18,size);
this._write32(lh,22,size);
this._write16(lh,26,nameBytes.length);
this._write16(lh,28,0);
lh.set (nameBytes,30);
localHeaders.push(lh);
localHeaders.push(data);
var cdh=new Uint8Array(46+nameBytes.length);
cdh.set ([0x50,0x4b,0x01,0x02]);
cdh.set ([0x14,0x00],4);
cdh.set ([0x0a,0x00],6);
cdh.set ([0x00,0x00],8);
cdh.set ([0x00,0x00],10);
cdh.set ([0x00,0x00,0x00,0x00],12);
this._write32(cdh,16,crc);
this._write32(cdh,20,size);
this._write32(cdh,24,size);
this._write16(cdh,28,nameBytes.length);
this._write16(cdh,30,0);
this._write16(cdh,32,0);
this._write16(cdh,34,0);
this._write16(cdh,36,0);
this._write32(cdh,38,0x81A40000);
this._write32(cdh,42,currentOffset);
cdh.set (nameBytes,46);
centralDirectory.push(cdh);
currentOffset+=lh.length+size;
}
var centralDirSize=centralDirectory.reduce(function (a,b){return a+b.length;},0);
var eocd=new Uint8Array(22);
eocd.set ([0x50,0x4b,0x05,0x06]);
this._write16(eocd,4,0);
this._write16(eocd,6,0);
this._write16(eocd,8,files.length);
this._write16(eocd,10,files.length);
this._write32(eocd,12,centralDirSize);
this._write32(eocd,16,currentOffset);
this._write16(eocd,20,0);
var finalChunks=localHeaders.concat(centralDirectory).concat([eocd]);
return new Blob(finalChunks,{type:'application/zip'});
},
readZip:async function (blob){
var buffer=(blob instanceof Uint8Array)?blob.buffer:await blob.arrayBuffer();
var view=new DataView(buffer);
var files=[];
var eocdOffset=-1;
for(var i=buffer.byteLength-22;i>=0;i--){
if(view.getUint32(i,true)===0x06054b50){
eocdOffset=i;
break;
}
}
if(eocdOffset===-1)throw new Error("Not a valid ZIP file (EOCD not found)");
var entryCount=view.getUint16(eocdOffset+10,true);
var cdOffset=view.getUint32(eocdOffset+16,true);
var offset=cdOffset;
for(var j=0;j<entryCount;j++){
if(view.getUint32(offset,true)!==0x02014b50)break;
var compMethod=view.getUint16(offset+10,true);
var compSize=view.getUint32(offset+20,true);
var uncompSize=view.getUint32(offset+24,true);
var nameLen=view.getUint16(offset+28,true);
var extraLen=view.getUint16(offset+30,true);
var commLen=view.getUint16(offset+32,true);
var localHeaderOffset=view.getUint32(offset+42,true);
var nameBytes=new Uint8Array(buffer,offset+46,nameLen);
var name=new TextDecoder().decode(nameBytes);
var localNameLen=view.getUint16(localHeaderOffset+26,true);
var localExtraLen=view.getUint16(localHeaderOffset+28,true);
var dataStart=localHeaderOffset+30+localNameLen+localExtraLen;
var compData=new Uint8Array(buffer,dataStart,compSize);
var data;
if(compMethod===0){
data=compData;
}else if(compMethod===8){
data=await this._decompress(compData);
}else {
console.warn("Unsupported ZIP compression method: "+compMethod+" for "+name);
offset+=46+nameLen+extraLen+commLen;
continue;
}
files.push({name:name,content:data});
offset+=46+nameLen+extraLen+commLen;
}
return files;
},
_decompress:async function (data){
if(typeof DecompressionStream==='undefined'){
throw new Error("Deflate compression in ZIP is not supported in this browser (DecompressionStream missing). Use 'Store' mode ZIPs or a modern browser.");
}
try{
var ds=new DecompressionStream("deflate-raw");
var writer=ds.writable.getWriter();
writer.write(data);
writer.close();
var reader=ds.readable.getReader();
var chunks=[];
while(true){
var res=await reader.read();
if(res.done)break;
chunks.push(res.value);
}
var totalLen=chunks.reduce(function (a,b){return a+b.length;},0);
var result=new Uint8Array(totalLen);
var offset=0;
for(var i=0;i<chunks.length;i++){
result.set (chunks[i],offset);
offset+=chunks[i].length;
}
return result;
}catch(e){
throw new Error("ZIP Decompression failed: "+e.message);
}
},
_write16:function (buf,offset,val){
buf[offset]=val&0xff;
buf[offset+1]=(val>>8)&0xff;
},
_write32:function (buf,offset,val){
buf[offset]=val&0xff;
buf[offset+1]=(val>>8)&0xff;
buf[offset+2]=(val>>16)&0xff;
buf[offset+3]=(val>>24)&0xff;
}
};