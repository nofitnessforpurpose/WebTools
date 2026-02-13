'use strict';


function parseIntelHexToBinary(text){
const lines=text.split(/\r?\n/);
const records=[];

let upperLinear=0;
let upperSegment=0;
let minAddr=Infinity;
let maxAddr=0;

for(let i=0;i<lines.length;i++){
let line=lines[i].trim();
if(!line)continue;
if(line[0]!==":")throw new Error(`Line ${i + 1}: Missing ':'`);

line=line.slice(1);
if(line.length<10)
throw new Error(`Line ${i + 1}: Too short`);

const count=parseInt(line.slice(0,2),16);
const addr=parseInt(line.slice(2,6),16);
const type=parseInt(line.slice(6,8),16);

const dataHex=line.slice(8,8+count*2);
const checksum=parseInt(line.slice(8+count*2,10+count*2),16);


const data=new Uint8Array(count);
for(let b=0;b<count;b++){
const byteStr=dataHex.slice(b*2,b*2+2);
const val=parseInt(byteStr,16);
if(Number.isNaN(val))throw new Error(`Line ${i + 1}: Bad hex`);
data[b]=val;
}


let sum=count+(addr>>8)+(addr&0xFF)+type;
for(let b of data)sum+=b;
sum=(sum+checksum)&0xFF;
if(sum!==0)throw new Error(`Line ${i + 1}: checksum error`);

if(type===0x00){


const base=(upperLinear<<16)+(upperSegment<<4);
const absolute=base+addr;

records.push({address:absolute,data});
minAddr=Math.min(minAddr,absolute);
maxAddr=Math.max(maxAddr,absolute+data.length);
}
else if(type===0x01){
break;
}
else if(type===0x02){

upperSegment=parseInt(dataHex,16);
upperLinear=0;
}
else if(type===0x04){

upperLinear=parseInt(dataHex,16);
upperSegment=0;
}
}

if(minAddr===Infinity)return new Uint8Array(0);


















const size=maxAddr;
const out=new Uint8Array(size);
out.fill(0xFF);

for(const r of records){
out.set (r.data,r.address);
}

return out;
}


function createIntelHexFromBinary(binary){
let output="";
let currentUpperLinear=0;
const dataSize=16;

for(let addr=0;addr<binary.length;addr+=dataSize){

const upper=(addr>>16)&0xFFFF;
if(upper!==currentUpperLinear){
currentUpperLinear=upper;
output+=createHexRecord(2,0,0x04,[(upper>>8)&0xFF,upper&0xFF]);
}

const count=Math.min(dataSize,binary.length-addr);
const data=[];
for(let i=0;i<count;i++){
data.push(binary[addr+i]);
}

output+=createHexRecord(count,addr&0xFFFF,0x00,data);
}


output+=":00000001FF\r\n";

return output;
}

function createHexRecord(count,addr,type,data){
let line="";
let sum=count+(addr>>8)+(addr&0xFF)+type;

line+=toHex(count,2);
line+=toHex(addr,4);
line+=toHex(type,2);

for(let b of data){
line+=toHex(b,2);
sum+=b;
}

const checksum=(0x100-(sum&0xFF))&0xFF;
line+=toHex(checksum,2);

return ":"+line+"\r\n";
}

function toHex(val,digits){
return val.toString(16).toUpperCase().padStart(digits,"0");
}