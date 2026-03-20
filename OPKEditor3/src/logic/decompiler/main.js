'use strict';
(function (){
let InstructionHandler,SourceGenerator,QCODE_DEFS,FE_OPCODES;

if(typeof window!=='undefined'&&window.InstructionHandler){
InstructionHandler=window.InstructionHandler;
SourceGenerator=window.SourceGenerator;
QCODE_DEFS=window.QCODE_DEFS;
FE_OPCODES=window.FE_OPCODES;
}else if(typeof require!=='undefined'){
const deps1=require('./instruction_handler.js');
InstructionHandler=deps1.InstructionHandler;
const deps2=require('./source_generator.js');
SourceGenerator=deps2.SourceGenerator;
const deps3=require('./constants.js');
QCODE_DEFS=deps3.QCODE_DEFS;
FE_OPCODES=deps3.FE_OPCODES;
const sysConsts=require('./system_constants.js');
if(typeof global!=='undefined'){
global.SYSTEM_CONSTANTS=sysConsts;
}
if(typeof window!=='undefined'){
window.SYSTEM_CONSTANTS=sysConsts;
}
}

class OPLDecompiler{
constructor(){
this.opcodes=typeof QCODE_DEFS!=='undefined'?QCODE_DEFS:{};
this.feOpcodes=typeof FE_OPCODES!=='undefined'?FE_OPCODES:{};
this.floatSize=6;
this.instHandler=new InstructionHandler(this.opcodes,this.floatSize,this.feOpcodes);
this.sourceGen=new SourceGenerator(this.instHandler);
}

toEvenHex(val,bytes=1){
if(typeof val!=='number')return val;
const hex=Math.abs(val).toString(16).toUpperCase();
const targetLen=bytes*2;
const prefix=(val<0)?"-0x":"0x";
return prefix+hex.padStart(targetLen,'0');
}

formatPC(val){
return Math.abs(val).toString(16).toUpperCase().padStart(4,'0');
}

formatBytes(bytes){
if(!bytes)return "";
return bytes.replace(/\s+/g,'');
}

getControlFlow(codeBlock,procName="main",options={}){

return this.getRawAnalysis(codeBlock,procName,options);
}

getRawAnalysis(codeBlock,procName="main",options={}){
if(!codeBlock||codeBlock.length<4)return {instructions:[],flow:{},varMap:{}};


this.floatSize=6;
this.opcodes=typeof QCODE_DEFS!=='undefined'?QCODE_DEFS:{};
this.feOpcodes=typeof FE_OPCODES!=='undefined'?FE_OPCODES:{};
this.instHandler.opcodes=this.opcodes;
this.instHandler.floatSize=this.floatSize;
this.instHandler.feOpcodes=this.feOpcodes;
this.instHandler.procMap=options.procMap||{};

let offset=0;
this.oplBase=0;
const header=this.parseHeader(codeBlock,offset,options);
this.oplBase=header.oplBase||0;
const finalProcName=procName==="main"?(header.extractedName||procName):procName;
const varMap=this.scanVariables(codeBlock,header,options);


if(header.qcodeActual!==undefined){
header.qcodeStart=header.qcodeActual;
}


const analysisStart=header.qcodeInstructionStart!==undefined?header.qcodeInstructionStart:header.qcodeStart;
const analysisSize=header.qcodeSize||(header.sourceActual-header.qcodeActual);

const flow=this.analyzeControlFlow(codeBlock,analysisStart,analysisSize,options);


const instructions=[];
const qcodeStart=analysisStart;
const qcodeSize=analysisSize;

let pc=qcodeStart;


while(pc<qcodeStart+qcodeSize){
if(pc>=codeBlock.length)break;
const op=codeBlock[pc];
const def=this.opcodes[op];
if(!def){

instructions.push({pc,text:`UNK_${op.toString(16)}`,size:1,op:op});
pc++;
continue;
}

const size=this.instHandler.getInstructionSize(codeBlock,pc,def);
if(pc+size>qcodeStart+qcodeSize)break;
let text=null;

if(text===null){


}








const decoded=this.instHandler.getArgs(codeBlock,pc,def);


























if(op===0x7D){


try{
const args=this.instHandler.getArgs(codeBlock,pc,def);
if(args&&args.params&&args.params.name){
text=`${args.params.name}:`;
}else {
text="PROC:";
}
}catch(e){
text="PROC:?";
}
}else {










try{
const args=this.instHandler.getArgs(codeBlock,pc,def);


const dummyStack={push:()=>{},pop:(()=>{return {text:"?"};}),length:0};
text=this.instHandler.handleInstruction(op,def,args,dummyStack,varMap,pc,size,codeBlock,{});
}catch(e){text="";}
}

instructions.push({pc,text:text||"",size,op});
pc+=size;
}

return {
instructions,
flow,
varMap,
header,
finalProcName,
globals:header?header.globals:[],
externals:header?header.externals:[]
};
}

decompile(codeBlock,procName="main",options={}){
const analysis=this.getRawAnalysis(codeBlock,procName,options);
if(analysis.instructions.length===0&&analysis.header&&!analysis.header.qcodeStart)return "REM Error: Analysis Failed";





const result=this.sourceGen.generateSource(analysis.header,analysis.varMap,analysis.flow,codeBlock,analysis.finalProcName,{...options,oplBase:this.oplBase});
return result.source;
}

getDecompiledData(codeBlock,procName="main",options={}){
const analysis=this.getRawAnalysis(codeBlock,procName,options);
if(analysis.instructions.length===0&&analysis.header&&!analysis.header.qcodeStart)return {source:"REM Error: Analysis Failed",references:[]};
return this.sourceGen.generateSource(analysis.header,analysis.varMap,analysis.flow,codeBlock,analysis.finalProcName,{...options,oplBase:this.oplBase});
}


parseHeader(codeBlock,offset,options={}){
const toEvenHex=(val,bytes=1)=>this.toEvenHex(val,bytes);
const formatPC=(val)=>this.formatPC(val);
const formatBytes=(val)=>this.formatBytes(val);

const log=(pc,bytes,name,args,comment)=>{
if(options.logCallback){
const relativePC=pc-(this.oplBase||0);
options.logCallback({
pc:formatPC(relativePC),
bytes:formatBytes(bytes),
opName:name+(args?" "+args:""),
comment:comment
});
}
};

const getHexBytes=(start,count)=>{
let hex="";
for(let i=0;i<count;i++){
if(start+i>=codeBlock.length)break;
hex+=codeBlock[start+i].toString(16).toUpperCase().padStart(2,'0');
}
return hex;
};

const readWordBE=()=>{
const val=(codeBlock[offset]<<8)|codeBlock[offset+1];
offset+=2;
return val;
};
const readWordLE=()=>{
const val=codeBlock[offset]|(codeBlock[offset+1]<<8);
offset+=2;
return val;
};
const readByte=()=>(offset<codeBlock.length)?codeBlock[offset++]:0;



let extractedName=null;
let sync=0,type=0,vSpace=0,qSize=0,nParams=0;
let qcodeTotalLen=0;
let isProcedure=true;
let isLZ=false;

if(codeBlock.length>0x14&&codeBlock[0x14]===0x24){
isLZ=true;
}

if(codeBlock[0]===0x09&&(codeBlock[1]===0x83||codeBlock[1]===0x09||codeBlock[1]===0x03)){


const rLen=readByte();
log(0,getHexBytes(0,1),"Length Byte",rLen.toString(),"Length of header");

const rType=readByte();
log(1,getHexBytes(1,1),"Record Type",`0x${rType.toString(16).toUpperCase()}`,"OPL Procedure Record");


const nameBytes=codeBlock.slice(2,10);
let extractedNameStr="";
for(let i=0;i<8;i++)extractedNameStr+=String.fromCharCode(nameBytes[i]);
offset+=8;
extractedName=extractedNameStr.trim();
log(2,getHexBytes(2,8),"File Name",extractedName,"Procedure Name");


const term=readByte();
log(10,getHexBytes(10,1),"Terminator",`0x${term.toString(16).toUpperCase()}`,"Unused/Terminator");


this.oplBase=offset;

sync=readByte();
log(offset-1,getHexBytes(offset-1,1),"Sync Byte",`0x${sync.toString(16).toUpperCase()}`,"Long Record Sync");

type=readByte();
log(offset-1,getHexBytes(offset-1,1),"Type Byte",`0x${type.toString(16).toUpperCase()}`,"OPL Procedure Data Block");

const longRecLen=readWordBE();
log(offset-2,getHexBytes(offset-2,2),"LongRec Len",longRecLen.toString(),"Length of Data Block");

qcodeTotalLen=readWordBE();
log(offset-2,getHexBytes(offset-2,2),"Total Len",qcodeTotalLen.toString(),"Total Object Size");

this.oplBase=offset;

}else if(codeBlock[0]===0x02&&codeBlock[1]===0x80){

sync=readByte();
log(0,getHexBytes(0,1),"Sync Byte",`0x${sync.toString(16).toUpperCase()}`,"Long Record Sync");

type=readByte();
log(1,getHexBytes(1,1),"Type Byte",`0x${type.toString(16).toUpperCase()}`,"OPL Procedure Data Block");

const longRecLen=readWordBE();
log(2,getHexBytes(2,2),"LongRec Len",longRecLen.toString(),"Length of Data Block");

qcodeTotalLen=readWordBE();
log(4,getHexBytes(4,2),"Total Len",qcodeTotalLen.toString(),"Total Object Size");

this.oplBase=offset;

}else if(codeBlock.length>=5&&codeBlock[4]<32){


this.oplBase=0;
offset=0;
qcodeTotalLen=codeBlock.length;
}else {

log(0,getHexBytes(0,Math.min(codeBlock.length,8)),"Block File Header","Unknown Format","Assuming start of OPL metadata");
this.oplBase=0;
offset=0;
qcodeTotalLen=codeBlock.length;
}


if(options.logCallback){
options.logCallback({pc:null,bytes:"",opName:"-------------------",args:"",comment:"Start of QCode"});
}


vSpace=readWordBE();
qSize=readWordBE();
nParams=readByte();

log(this.oplBase,getHexBytes(this.oplBase,2),"VarSpace",vSpace.toString(),"Variable Space Size");
log(this.oplBase+2,getHexBytes(this.oplBase+2,2),"QCodeSize",qSize.toString(),"Active QCode area");
log(this.oplBase+4,getHexBytes(this.oplBase+4,1),"NumParams",nParams.toString(),`NPC:${nParams}`);

const paramTypes=[];
for(let i=0;i<nParams;i++){
const poff=offset;
const t=readByte();
paramTypes.push(t);
const typeLabel=t===0?"Int":t===1?"Flt":t===2?"Str":"Unknown";
log(poff,getHexBytes(poff,1),`ParamType`,typeLabel,"");
}


const qcodeInstructionStart=(this.oplBase+qcodeTotalLen)-qSize;

const hMeta={
extractedName,
magic:(sync<<8)|type,
varSpaceSize:vSpace,qcodeSize:qSize,numParams:nParams,paramTypes:[...paramTypes].reverse(),
qcodeStart:offset,
qcodeInstructionStart:qcodeInstructionStart,
oplBase:this.oplBase,
isProcedure,isLZ,isCMXP:false
};

const isProc=true;
const qcodeActual=undefined;
const fixupActual=undefined;

const atBoundary=(off)=>{
return false;
};


const globals=[];
const globalTableSize=readWordBE();
log(offset-2,getHexBytes(offset-2,2),"Table Length",globalTableSize.toString(),"Global Variable Name Table Length");

const globalTableEnd=offset+globalTableSize;
while(offset<globalTableEnd&&!atBoundary(offset)){
const startOff=offset;
const nameLen=readByte();
if(nameLen===0||nameLen>32)break;
let name="";
for(let i=0;i<nameLen;i++)name+=String.fromCharCode(readByte());
const type=readByte();
const addr=readWordBE();
globals.push({name,type,addr});
const suffix=this.instHandler.getTypeSuffix(type);
const fullName=(name.endsWith(suffix)||(suffix===""&&!name.match(/[%$]$/)))?name:name+suffix;
log(startOff,getHexBytes(startOff,nameLen+4),`Global ${fullName}`,null,`Type: ${type}, Addr: ${toEvenHex(addr, 2).replace('0x', '')}`);
}
hMeta.globals=globals;

const externals=[];
const externTableSize=readWordBE();
log(offset-2,getHexBytes(offset-2,2),"ExternTblSize",externTableSize.toString(),"Byte length of external variable declarations");
const externTableEnd=offset+externTableSize;
while(offset<externTableEnd&&!atBoundary(offset)){
const startOff=offset;
const nameLen=readByte();
if(nameLen===0||nameLen>32)break;
let name="";
for(let i=0;i<nameLen;i++)name+=String.fromCharCode(readByte());
const type=readByte();
externals.push({name,type});
const suffix=this.instHandler.getTypeSuffix(type);
const fullName=(name.endsWith(suffix)||(suffix===""&&!name.match(/[%$]$/)))?name:name+suffix;
log(startOff,getHexBytes(startOff,nameLen+2),`External ${fullName}`,null,`Type: ${type}`);
}
hMeta.externals=externals;


const stringFixups=[];
const arrayFixups={};

if(offset<codeBlock.length){
const strFixSize=readWordBE();
log(offset-2,getHexBytes(offset-2,2),"StrFixTblSize",strFixSize.toString(),"String fixup table length");

const strFixEnd=offset+strFixSize;
while(offset<strFixEnd&&offset<codeBlock.length){
const sOff=offset;
const addr=readWordBE();
const len=readByte();
stringFixups.push({addr,len});
log(sOff,getHexBytes(sOff,3),`StrFixup Addr:${toEvenHex(addr, 2).replace('0x', '')}`,`Len:${len}`);
}
}





if(offset<codeBlock.length){

const gap=qcodeInstructionStart-offset;


if(gap>=2){

const arrFixSize=(codeBlock[offset]<<8)|(codeBlock[offset+1]);


if(arrFixSize+2<=gap){
const actualSize=readWordBE();
log(offset-2,getHexBytes(offset-2,2),"ArrFixTblSize",actualSize.toString(),"Array fixup table length");

const arrFixEnd=offset+actualSize;
while(offset<arrFixEnd&&offset+3<codeBlock.length){
const aOff=offset;
const addr=readWordBE();
const len=readWordBE();
arrayFixups[addr]=len;
log(aOff,getHexBytes(aOff,4),`ArrFixup Addr:${toEvenHex(addr, 2).replace('0x', '')}`,`Len:${len}`);
}
}

offset=qcodeInstructionStart;
}else {
offset=qcodeInstructionStart;
}
}


const applyFixups=(vars)=>{
for(const v of vars){

if(stringFixups.length>0){
const sf=stringFixups.find(f=>f.addr===v.addr||f.addr===v.addr-1);
if(sf)v.maxLen=sf.len;
}

if(arrayFixups[v.addr]!==undefined){
v.arrayLen=arrayFixups[v.addr];
}else if(arrayFixups[v.addr-1]!==undefined){
v.arrayLen=arrayFixups[v.addr-1];
}
}
}
applyFixups(globals);
applyFixups(externals);

const finalQCodeActual=isProc?offset:qcodeActual;

const isLZSig=(finalQCodeActual+1<codeBlock.length&&codeBlock[finalQCodeActual]===0x59&&codeBlock[finalQCodeActual+1]===0xB2);
const adjQCodeStart=isLZSig?finalQCodeActual+2:finalQCodeActual;


let calcSize=hMeta.qcodeSize!==undefined?hMeta.qcodeSize:(sourceActual>qcodeActual?sourceActual-qcodeActual:codeBlock.length-qcodeActual);
if(isLZSig)calcSize-=2;

return {
varSpaceSize:hMeta.varSpaceSize,
qcodeSize:calcSize,
numParams:hMeta.numParams,
paramTypes:hMeta.paramTypes,
globals,
externals,
stringFixups,
arrayFixups,
qcodeStart:adjQCodeStart,
actualQCodeStart:adjQCodeStart,
isLZ:(hMeta.isLZ===true)||isLZSig,
isCMXP:!!hMeta.isCMXP,
extractedName:hMeta.extractedName,
globalTableSize:globalTableSize
};
}

scanVariables(codeBlock,header,options={}){
const toEvenHex=(val,bytes=1)=>this.toEvenHex(val,bytes);

const log=(msg)=>{
if(options.logCallback){
options.logCallback({pc:"Vars",bytes:"",opName:"Scan",comment:msg});
}
};

const varMap={};
const {globals,externals,stringFixups,arrayFixups,actualQCodeStart,qcodeStart,qcodeSize,numParams,paramTypes}=header;


let globalTableSize=header.globalTableSize;
if(globalTableSize===undefined){
globalTableSize=0;
if(globals){
globals.forEach(g=>{

globalTableSize+=(1+g.name.length+1 + 2);
});
}

if(globalTableSize%2!==0)globalTableSize++;
}


this.floatSize=6;
this.opcodes=typeof QCODE_DEFS!=='undefined'?QCODE_DEFS:{};
this.feOpcodes=typeof FE_OPCODES!=='undefined'?FE_OPCODES:{};
this.instHandler=new InstructionHandler(this.opcodes,this.floatSize,this.feOpcodes);
this.sourceGen=new SourceGenerator(this.instHandler);

log(`Scanning QCode for variable usage (Start:${toEvenHex(actualQCodeStart, 2)} End:${toEvenHex(qcodeStart + qcodeSize, 2)})`);

const accessedVars=new Set();
const intVars=new Set();
const floatVars=new Set();
const stringVars=new Set();
const arrayVars=new Set();
const minArrayCounts={};
const externAccesses=new Set();

const externOpcodes=new Set([
0x07,0x08,0x09,0x0A,0x0B,0x0C,
0x14,0x15,0x16,0x17,0x18,0x19
]);

const stringFixupsMap={};
stringFixups.forEach(f=>{
let addr=f.addr;
if(addr>32767)addr-=65536;
stringFixupsMap[addr]=f.len;
});

const arrayFixupsMap={};
if(arrayFixups){
Object.keys(arrayFixups).forEach(k=>{
let addr=parseInt(k);
let val=arrayFixups[k];
if(addr>32767)addr-=65536;
arrayFixupsMap[addr]=val;
});
}

let pc=actualQCodeStart;
let prevOp=-1;
let prevIntVal=0;

while(pc<qcodeStart+qcodeSize){
const op=codeBlock[pc];
const def=this.opcodes[op];
if(!def){pc++;continue;}

const size=this.instHandler.getInstructionSize(codeBlock,pc,def);
if(pc+size>qcodeStart+qcodeSize)break;

let addr=null;
if(def.args.includes('v')||def.args.includes('V')){
addr=(codeBlock[pc+1]<<8)|codeBlock[pc+2];
}else if(def.args.includes('W')){
addr=(codeBlock[pc+1]<<8)|codeBlock[pc+2];
}

if(addr!==null){
if(addr>32767)addr-=65536;
accessedVars.add(addr);

if(externOpcodes.has(op)){
externAccesses.add(addr);
}

if([0x02,0x05,0x0F,0x12,0x81,0x09,0x0C,0x16,0x19].includes(op))stringVars.add(addr);
else if([0x00,0x03,0x0D,0x10,0x7F,0x07,0x0A,0x14,0x17].includes(op))intVars.add(addr);
else if([0x01,0x04,0x0E,0x11,0x80,0x08,0x0B,0x15,0x18].includes(op))floatVars.add(addr);

if([0x03,0x04,0x05,0x10,0x11,0x12,0x0A,0x0B,0x0C,0x17,0x18,0x19,0xD9,0xDA,0xDB,0xDC,0xDD,0xDE].includes(op)){
arrayVars.add(addr);

if(prevOp===0x20||prevOp===0x21||prevOp===0x22){
const currentMin=minArrayCounts[addr]||0;
if(prevIntVal>currentMin){
minArrayCounts[addr]=prevIntVal;
}
}
}
}


if(op===0x20){
prevIntVal=codeBlock[pc+1];
prevOp=op;
}else if(op===0x21||op===0x22){
prevIntVal=(codeBlock[pc+1]<<8)|codeBlock[pc+2];
prevOp=op;
}else {
prevOp=op;
}

pc+=size;
}


const getScanType=(addr)=>{
const isArray=arrayVars.has(addr);
if(stringVars.has(addr))return isArray?5:2;
if(intVars.has(addr))return isArray?3:0;
if(floatVars.has(addr))return isArray?4:1;
return 1;
};


let availableVars=Array.from (accessedVars);
const isLZ=(header.isLZ!==false);



if(externals.length===0&&externAccesses.size>0){
externAccesses.forEach(idx=>{
if(idx>=0&&idx<255){
if(!externals.find(e=>e.index===idx)){
externals.push({name:"EXT_"+idx,type:1,index:idx,isExtern:true});
}
}
});
}


const formatAddr=(val)=>{
return ((val<0?val+65536:val)&0xFFFF).toString(16).toUpperCase().padStart(4,'0');
};




log("--- Variable Storage Frame ---");


log(`FFFE: Global Variable Name Table Length (2 bytes)`);


if(globals.length>0){
globals.forEach((g,idx)=>{


let nameBytes=[];
for(let k=0;k<g.name.length;k++)nameBytes.push(g.name.charCodeAt(k));
let type=g.type;
let off=g.addr;


let hexStr=(g.name.length).toString(16).toUpperCase().padStart(2,'0');
nameBytes.forEach(b=>hexStr+=b.toString(16).toUpperCase().padStart(2,'0'));
hexStr+=type.toString(16).toUpperCase().padStart(2,'0');

let offVal=(off<0?off+65536:off)&0xFFFF;
hexStr+=offVal.toString(16).toUpperCase().padStart(4,'0');

log(`      Global Def ${g.name}: ${hexStr}`);
});
}

var currentPtrOffset=-2 - globalTableSize;

if(currentPtrOffset%2!==0)currentPtrOffset--;






for(let i=0;i<numParams;i++){
let offStr=formatAddr(currentPtrOffset);
log(`${offStr}: Param P${i + 1} (Ref)`);
currentPtrOffset-=2;
}


if(externals.length>0){
for(let i=0;i<externals.length;i++){
let extName=externals[i].name||("External "+(i+1));
let offStr=formatAddr(currentPtrOffset);
log(`${offStr}: ${extName} Ptr`);
currentPtrOffset-=2;
}
}
log("-----------------------");







const candidateParams=availableVars.filter(v=>v<0||v>32767);




const stackVars=availableVars.filter(v=>v<0);
stackVars.sort((a,b)=>b-a);

const params=stackVars.slice(0,numParams);


for(let i=0;i<numParams;i++){
if(i<params.length){
const off=params[i];
const type=paramTypes[i];
const suffix=this.instHandler.getTypeSuffix(type);
const pName=`P${i + 1}${suffix}`;
varMap[off]={name:pName,type:type,isParam:true};
log(`Param ${pName}: Offset ${formatAddr(off)} type ${toEvenHex(type, 1).replace(/0x/g, '')} (${suffix})`);
}else {

log(`Param P${i + 1}: Missing/Unused`);
}
}




const paramSet=new Set(params);
let remainingVars=availableVars.filter(v=>!paramSet.has(v));





const allAddrSet=new Set(availableVars);
globals.forEach(g=>{
let addr=g.addr;
if(addr>32767)addr-=65536;
if(addr!==0)allAddrSet.add(addr);
});
const fullMemoryMap=Array.from (allAddrSet).sort((a,b)=>b-a);


if(globals.length>0){
globals.forEach(g=>{
let mappedAddr=null;
let signedAddr=g.addr;
if(signedAddr>32767)signedAddr-=65536;



if(remainingVars.includes(signedAddr)){
mappedAddr=signedAddr;
}




if(mappedAddr===null&&g.addr===0){


const externCandidates=remainingVars.filter(v=>externAccesses.has(v));




const candIdx=externCandidates.findIndex(v=>getScanType(v)===g.type);

if(candIdx!==-1){
mappedAddr=externCandidates[candIdx];
}



else if(g.addr===0){
const laxIdx=remainingVars.findIndex(v=>getScanType(v)===g.type);
if(laxIdx!==-1){
mappedAddr=remainingVars[laxIdx];
}
}
}

if(mappedAddr!==null){
varMap[mappedAddr]={name:g.name,type:g.type,isGlobal:true};

if(stringFixupsMap[mappedAddr]){
varMap[mappedAddr].maxLen=stringFixupsMap[mappedAddr];
g.maxLen=stringFixupsMap[mappedAddr];
}
if(arrayFixupsMap[mappedAddr]){
varMap[mappedAddr].arrayLen=arrayFixupsMap[mappedAddr];
g.arrayLen=arrayFixupsMap[mappedAddr];
}




remainingVars=remainingVars.filter(v=>v!==mappedAddr);
}else if(g.addr!==0||signedAddr!==0){

mappedAddr=signedAddr;
varMap[mappedAddr]={name:g.name,type:g.type,isGlobal:true,isForceMapped:true};
}

if(mappedAddr!==null){

if(stringFixupsMap[mappedAddr]){
varMap[mappedAddr].maxLen=stringFixupsMap[mappedAddr];
g.maxLen=stringFixupsMap[mappedAddr];
}
if(arrayFixupsMap[mappedAddr]){
varMap[mappedAddr].arrayLen=arrayFixupsMap[mappedAddr];
g.arrayLen=arrayFixupsMap[mappedAddr];
}


if(!g.arrayLen){
const idx=fullMemoryMap.indexOf(mappedAddr);
if(idx>=0){


const nextOff=(idx>0)?fullMemoryMap[idx-1]:0;
const size=Math.abs(nextOff-mappedAddr);


if(g.type===2){





const isArr=arrayVars.has(mappedAddr)||!!g.arrayLen||(g.maxLen&&size>g.maxLen+2);

if(isArr){






let knownMaxLen=g.maxLen;

if(knownMaxLen){

if(size>2){
const count=Math.floor((size-2)/(knownMaxLen+1));
g.arrayLen=count;

varMap[mappedAddr].arrayLen=count;
}
}else {



const payload=size-2;
if(payload>0){
let bestLen=255;


for(let eSize=2;eSize<=payload;eSize++){
if(payload%eSize===0){
const len=eSize-1;
if(len<=255){






}
}
}







const minIdx=minArrayCounts[off]||0;
let bestCand=null;
let bestScore=-1;

for(let len=255;len>=1;len--){
const eSize=len+1;
if(payload%eSize===0){
const pCount=payload/eSize;

if(pCount>=minIdx){
let score=0;
if(len===255)score+=100;
else if((len&(len-1))===0)score+=50;

if(pCount>1)score+=20;










if(score>bestScore){
bestScore=score;
bestCand={len:len,count:pCount};
}
}
}
}

if(bestCand){
varMap[off].maxLen=bestCand.len;
varMap[off].arrayLen=bestCand.count;
}else {


}
}
}

}else {


if(!varMap[mappedAddr].maxLen){
let inferredLen=size-1;
if(inferredLen>255)inferredLen=255;
if(inferredLen>0){
g.maxLen=inferredLen;
varMap[mappedAddr].maxLen=inferredLen;
}
}
}
}
else {


const isArr=arrayVars.has(mappedAddr)||!!g.arrayLen;
if(isArr){


let count=0;
if(g.type===0){
if(size>2)count=Math.floor((size-2)/2);
}else {
if(size>3)count=Math.floor((size-3)/8);
}
if(count>0&&!g.arrayLen){
g.arrayLen=count;
varMap[mappedAddr].arrayLen=count;
}
}else {

}
}


}
}
}
});
}


if(externals.length>0){
externals.forEach(e=>{
let mappedAddr=null;



if(e.addr!==undefined){



if(remainingVars.includes(e.addr)){
mappedAddr=e.addr;
}
}
else {


const externCandidates=remainingVars.filter(v=>externAccesses.has(v));
const candIdx=externCandidates.findIndex(v=>getScanType(v)===e.type);

if(candIdx!==-1){
mappedAddr=externCandidates[candIdx];
}

else {
const laxIdx=remainingVars.findIndex(v=>getScanType(v)===e.type);
if(laxIdx!==-1){
mappedAddr=remainingVars[laxIdx];
}
}
}

if(mappedAddr!==null){

varMap[mappedAddr]={name:e.name,type:e.type,isExternal:true};

if(stringFixupsMap[mappedAddr]){
varMap[mappedAddr].maxLen=stringFixupsMap[mappedAddr];
}
if(arrayFixupsMap[mappedAddr]){
varMap[mappedAddr].arrayLen=arrayFixupsMap[mappedAddr];
}


remainingVars=remainingVars.filter(v=>v!==mappedAddr);
}
});
}


let localCounter=1;
const locals=remainingVars;

locals.forEach(off=>{
if(!varMap[off]){
const ext=externals.find(e=>e.addr===off);

let type=1;
let suffix='';
if(stringVars.has(off)){type=2;suffix='$';}
else if(intVars.has(off)){type=0;suffix='%';}

if(ext){
let name=ext.name||`L${Math.abs(off).toString(16).toUpperCase()}${suffix}`;
varMap[off]={name:name,type:ext.type!==undefined?ext.type:type,isExternal:true};
}else {
let name=`L${localCounter}${suffix}`;
while(Object.values(varMap).some(v=>v.name===name)){
localCounter++;
name=`L${localCounter}${suffix}`;
}
localCounter++;

varMap[off]={name:name,type:type,isLocal:true};

if(stringFixupsMap[off])varMap[off].maxLen=stringFixupsMap[off];
if(arrayFixupsMap[off])varMap[off].arrayLen=arrayFixupsMap[off];
if(arrayVars.has(off)){
varMap[off].isArray=true;
}




let nextOff=0;

availableVars.sort((a,b)=>b-a);

const idx=availableVars.indexOf(off);
if(idx>0)nextOff=availableVars[idx-1];
const size=Math.abs(nextOff-off);

if(varMap[off].name==='L5$'||varMap[off].name==='L3$'){
console.log(`[DEBUG_SIZE] ${varMap[off].name} Offset:${off} Size:${size} IsArray:${varMap[off].isArray} FixupLen:${varMap[off].maxLen}`);
}



if(varMap[off].name==='L5$'||varMap[off].name==='L3$'){
console.log(`[DEBUG_SIZE] ${varMap[off].name} Offset:${off} Size:${size} IsArray:${varMap[off].isArray} FixupLen:${varMap[off].maxLen}`);
}

if(type===2){
if(varMap[off].isArray||varMap[off].arrayLen||(varMap[off].maxLen&&size>varMap[off].maxLen+2)){


const payload=size-2;
if(payload>0){
let knownMaxLen=varMap[off].maxLen;
if(knownMaxLen){

varMap[off].arrayLen=Math.floor(payload/(knownMaxLen+1));
}else {


const minIdx=minArrayCounts[off]||0;
let bestCand=null;
let bestScore=-1;

for(let len=255;len>=1;len--){
const eSize=len+1;
if(payload%eSize===0){
const pCount=payload/eSize;

if(pCount>=minIdx){
let score=0;
if(len===255)score+=100;
else if((len&(len-1))===0)score+=50;

if(pCount>1)score+=20;

if(score>bestScore){
bestScore=score;
bestCand={len:len,count:pCount};
}
}
}
}

if(bestCand){
varMap[off].maxLen=bestCand.len;
varMap[off].arrayLen=bestCand.count;
}

if(!varMap[off].arrayLen){
varMap[off].maxLen=size>2?Math.min(255,size-3):1;
varMap[off].arrayLen=1;
}
}
}
}else {

if(!varMap[off].maxLen){
let inferred=size-1;
if(inferred>255)inferred=255;
if(inferred<=0)inferred=1;
varMap[off].maxLen=inferred;
}
}
}else if(varMap[off].isArray||varMap[off].arrayLen){
if(type===0){

if(size>2&&!varMap[off].arrayLen)varMap[off].arrayLen=Math.floor((size-2)/2);
}
else if(type===1){

if(size>3&&!varMap[off].arrayLen)varMap[off].arrayLen=Math.floor((size-3)/8);
}
}

}
}
});

return varMap;
}

analyzeControlFlow(codeBlock,start,size,options={}){
const toEvenHex=(val,bytes=1)=>this.toEvenHex(val,bytes);

const log=(msg)=>{
if(options.logCallback){
options.logCallback({pc:"Flow",bytes:"",opName:"Scan",comment:msg});
}
};

const flow={
starts:{},targets:{},jumps:{},labels:new Set(),structureLabels:new Set(),forceLabels:new Set()
};
const protectedLabels=new Set();

let pc=start;
log(`Analyzing control flow (Start:${toEvenHex(start, 2)} Size:${size})`);


let prePc=start;
while(prePc<start+size&&prePc<codeBlock.length){
const op=codeBlock[prePc];
if(op===undefined)break;
const def=this.opcodes[op];
if(!def){prePc++;continue;}
const instSize=this.instHandler.getInstructionSize(codeBlock,prePc,def);

if(op===0x7E||op===0x51||op===0x53||op===0xFB){
const args=this.instHandler.getArgs(codeBlock,prePc,def);
if((op!==0x53&&op!==0xFB)||args.D!==0){
const target=(prePc+1)+args.D;
flow.labels.add(target);
}
}
prePc+=instSize;
}

const instructions=[];
while(pc<start+size&&pc<codeBlock.length){

const op=codeBlock[pc];
if(op===undefined)break;
const def=this.opcodes[op];
if(!def){

pc++;
continue;
}

let instSize=this.instHandler.getInstructionSize(codeBlock,pc,def);




for(let offset=1;offset<instSize;offset++){
if(flow.labels.has(pc+offset)){



log(`Overlap detected at ${pc.toString(16)} with label at ${(pc + offset).toString(16)}. Truncating.`);
instSize=offset;






break;
}
}

if(pc+instSize>start+size)break;


if(flow.labels.has(pc+instSize)){

}








const standardSize=this.instHandler.getInstructionSize(codeBlock,pc,def);
if(instSize<standardSize){
instructions.push({pc,op:0x00,args:{},size:instSize,isPadding:true,originalOp:op});
pc+=instSize;
continue;
}

const args=this.instHandler.getArgs(codeBlock,pc,def);
instructions.push({pc,op,args,size:instSize});
if(op===0x7E||op===0x51||op===0x53||op===0xFB){
if((op!==0x53&&op!==0xFB)||args.D!==0){
const target=(pc+1)+args.D;
flow.labels.add(target);
}
}
pc+=instSize;
}



const addStart=(pc,struct)=>{
if(!flow.starts[pc])flow.starts[pc]=[];
struct.start=pc;
flow.starts[pc].push(struct);
};
const addTarget=(pc,struct)=>{
if(!flow.targets[pc])flow.targets[pc]=[];
flow.targets[pc].push(struct);
};


for(let i=0;i<instructions.length;i++){
const inst=instructions[i];
var isElse=false;


if(inst.op===0x7E){
const target=(inst.pc+1)+inst.args.D;
if(target<inst.pc){
const instSize=inst.size||3;



let condStart=inst.pc;
for(let j=i-1;j>=0;j--){
if(instructions[j].pc<=target)break;
if(flow.labels.has(instructions[j].pc)){
condStart=instructions[j].pc;

break;
}
}

addStart(target,{type:'DO',end:inst.pc+instSize,cond:condStart});
addTarget(inst.pc,{type:'UNTIL',start:target,condition:true});
flow.jumps[inst.pc]={type:'DO'};
flow.structureLabels.add(target);
if(condStart!==inst.pc)flow.structureLabels.add(condStart);
flow.structureLabels.add(inst.pc+instSize);


protectedLabels.add(inst.pc+instSize);
protectedLabels.add(condStart);
if(inst.pc!==condStart)protectedLabels.add(inst.pc);

log(`Detected DO...UNTIL (Start:${target.toString(16)} End:${(inst.pc + instSize).toString(16)} CondRef:${condStart.toString(16)})`);
continue;
}
}
}




for(let i=0;i<instructions.length;i++){
const inst=instructions[i];
if(inst.op===0x51||(inst.isPadding&&inst.originalOp===0x51)){




if(inst.isPadding)continue;

const target=(inst.pc+1)+inst.args.D;
if(target<=inst.pc){





protectedLabels.add(target);

addStart(target,{type:'DO',end:inst.pc+(inst.size||3),cond:inst.pc});
addTarget(inst.pc,{type:'UNTIL',start:target});
flow.jumps[inst.pc]={type:'INF_LOOP'};
flow.structureLabels.add(target);
flow.structureLabels.add(inst.pc);

log(`Detected Infinite DO Loop (Start:${target.toString(16)} End:${inst.pc.toString(16)})`);
}
}
}



for(let i=0;i<instructions.length;i++){
const inst=instructions[i];
if(inst.op===0x7E){
if(inst.args.D===5)continue;
const target=(inst.pc+1)+inst.args.D;
if(target>inst.pc){

const targetInstIndex=instructions.findIndex(in_=>in_.pc===target);
if(targetInstIndex>0){
const prev=instructions[targetInstIndex-1];
if(prev.op===0x51||(prev.isPadding&&prev.originalOp===0x51)){
const gotoTarget=(prev.pc+1)+prev.args.D;


if(gotoTarget<=inst.pc&&gotoTarget>(inst.pc-20)){


if(flow.starts[gotoTarget]){
flow.starts[gotoTarget]=flow.starts[gotoTarget].filter(s=>s.type!=='DO'||s.cond!==prev.pc);
if(flow.starts[gotoTarget].length===0)delete flow.starts[gotoTarget];
}
if(flow.targets[prev.pc]){
flow.targets[prev.pc]=flow.targets[prev.pc].filter(t=>t.type!=='UNTIL'||t.start!==gotoTarget);
if(flow.targets[prev.pc].length===0)delete flow.targets[prev.pc];
}
if(flow.jumps[prev.pc]&&flow.jumps[prev.pc].type==='INF_LOOP'){
delete flow.jumps[prev.pc];
}

addStart(gotoTarget,{type:'WHILE',end:target});
addTarget(prev.pc,{type:'ENDWH',start:gotoTarget});
flow.jumps[gotoTarget]={type:'WHILE_TOP'};
flow.jumps[inst.pc]={type:'WHILE'};
flow.jumps[prev.pc]={type:'WHILE'};
flow.structureLabels.add(gotoTarget);
flow.structureLabels.add(target);


protectedLabels.add(target);
protectedLabels.add(gotoTarget);

log(`Detected WHILE loop (Start:${gotoTarget.toString(16)} End:${target.toString(16)})`);
continue;
}
}



let isElse=false;
const elseJumpIndex=instructions.findIndex(in_=>in_.pc===target);

if(elseJumpIndex>0){

const prev=instructions[elseJumpIndex-1];
if(prev.op===0x51||(prev.isPadding&&prev.originalOp===0x51)){


let prevArgs=prev.args;
if(prev.isPadding){







prevArgs=this.instHandler.getArgs(codeBlock,prev.pc,this.opcodes[0x51]);
}

const endifTarget=(prev.pc+1)+prevArgs.D;






let isDeadCode=false;
if(elseJumpIndex>1){
const prior=instructions[elseJumpIndex-2];
if(prior){

const isUnconditional=
prior.op===0x51||(prior.isPadding&&prior.originalOp===0x51)||
(prior.op>=0x79&&prior.op<=0x7C)||
prior.op===0x59||
prior.op===0x57;




const isTargeted=flow.labels.has(prev.pc)||flow.forceLabels.has(prev.pc);

if(isUnconditional&&!isTargeted){

}
}
}





if(flow.targets[target]&&flow.targets[target].some(t=>(t.type==='ENDIF'||t.type==='ENDWH'||t.type==='UNTIL')&&t.start<inst.pc)){



isElse=false;
}
else if(endifTarget>target&&endifTarget<=codeBlock.length&&inst.args.D!==5){






isElse=true;















}

else if(endifTarget>target&&codeBlock[target]===0x7E){


isElse=true;
}
if(isElse){
addStart(inst.pc,{type:'IF',else:target,end:endifTarget});
addTarget(target,{type:'ELSE',start:inst.pc});
addTarget(endifTarget,{type:'ENDIF',start:inst.pc});
flow.jumps[inst.pc]={type:'IF',else:target,end:endifTarget};
flow.jumps[prev.pc]={type:'ELSE'};
flow.structureLabels.add(target);
if(endifTarget<start+size)flow.structureLabels.add(endifTarget);
log(`Detected IF...ELSE...ENDIF (Start:${inst.pc.toString(16)} Else:${target.toString(16)} End:${endifTarget.toString(16)})`);
}
}
}
}



if(!isElse){

addStart(inst.pc,{type:'IF',end:target});
addTarget(target,{type:'ENDIF',start:inst.pc});
flow.jumps[inst.pc]={type:'IF'};
if(target<start+size)flow.structureLabels.add(target);
log(`Detected IF...ENDIF (Start:${inst.pc.toString(16)} End:${target.toString(16)})`);
}
}
}
}






const loopStack=[];
for(let i=0;i<instructions.length;i++){
const inst=instructions[i];
if(flow.starts[inst.pc]){
for(const struct of flow.starts[inst.pc]){
if(struct.type==='DO'||struct.type==='WHILE'){
loopStack.push({type:struct.type,start:inst.pc,end:struct.end,cond:struct.cond});
}
}
}

if(inst.op===0x51){
const target=(inst.pc+1)+inst.args.D;
let isStructural=!!flow.jumps[inst.pc];

if(!isStructural&&loopStack.length>0){

const currentLoop=loopStack[loopStack.length-1];
const loopTop=(currentLoop.type==='DO'&&currentLoop.cond)?currentLoop.cond:currentLoop.start;





if(target===loopTop||target===currentLoop.end){
isStructural=true;
}
}

if(!isStructural){
flow.forceLabels.add(target);
}
}else if(inst.op===0x53){
const target=(inst.pc+1)+inst.args.D;
if(inst.args.D!==0)flow.forceLabels.add(target);
}else if(inst.op===0x7E){
if(!flow.jumps[inst.pc]){
const target=(inst.pc+1)+inst.args.D;
flow.forceLabels.add(target);
}
}

if(flow.targets[inst.pc]){



const structs=flow.targets[inst.pc];
for(const s of structs){
if(s.type==='UNTIL'||s.type==='ENDWH'){
loopStack.pop();
}
}
}
}
return flow;
}


}



if(typeof window!=='undefined'){
window.OPLDecompiler=OPLDecompiler;
}
if(typeof module!=='undefined'&&module.exports){
module.exports={OPLDecompiler};
}
})();