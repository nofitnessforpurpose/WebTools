'use strict';
function NativeDecoder(){
this.opcodes=this.initOpcodes();
this.swiNames=this.initSwiNames();
this.branchDescs=this.initBranchDescs();
if(!this.sysConstants||Object.keys(this.sysConstants).length===0){
this.sysConstants=typeof SYSTEM_CONSTANTS!=='undefined'?SYSTEM_CONSTANTS:{};
}
this.bitDefs=typeof BIT_DEFINITIONS!=='undefined'?BIT_DEFINITIONS:{};
}
NativeDecoder.isNative=function (data,type){
return NativeDecoder.prototype.isNative(data,type);
};
NativeDecoder.prototype={
isNative:function (data,type){
if(!data||data.length<10)return false;
if(type===0x83||type===0x03)return false;
if(type===0x10)return true;
var syncIdx=(data[0]+2<=data.length&&(data[1]===0x00||data[1]===0x02))?2:0;
var isSync=(data[syncIdx]===0x02&&data[syncIdx+1]===0x80);
if(!isSync)return false;
var offsets=[syncIdx+6,syncIdx+8];
var foundHeader=false;
for(var i=0;i<offsets.length;i++){
if(this.isHeaderPlausible(data,offsets[i])){
foundHeader=true;
break;
}
}
return foundHeader;
},
isHeaderPlausible:function (data,hOff){
if(!data||hOff+6>data.length)return false;
var codeLen=(data[hOff]<<8)|data[hOff+1];
var bdevice=data[hOff+2];
var vernum=data[hOff+4];
var maxVec=data[hOff+5];
return (maxVec>=0&&maxVec<=64)&&
(bdevice>=0&&bdevice<=0xF0)&&
(codeLen>=0&&hOff+codeLen<=data.length)&&
(vernum<0xA0);
},
parse:function (data,type,absoluteOffset){
if(!data||data.length<4)return null;
var start=0;
var hasLenByte=false;
if(data[0]+2<=data.length&&(data[1]===0x00||data[1]===0x02||data[1]===0x10||data[1]===0x83)){
hasLenByte=true;
start=2;
}
var syncIdx=hasLenByte?2:0;
var isSync=(data[syncIdx]===0x02&&data[syncIdx+1]===0x80);
if(!isSync&&type!==0x02&&type!==0x10&&type!==0x00){
return null;
}
var longRecLen=(data[syncIdx+2]<<8)|data[syncIdx+3];
var execLen=(data[syncIdx+4]<<8)|data[syncIdx+5];
var offset=syncIdx+6;
if(offset+8<=data.length){
if(!this.isHeaderPlausible(data,offset)&&this.isHeaderPlausible(data,offset+2)){
offset+=2;
execLen-=2;
}
}
if(offset+execLen>data.length){
execLen=data.length-offset;
}
var execBlock=data.slice(offset,offset+execLen);
var fixups=data.slice(offset+execLen);
var vectorInfo=this.extractVectors(execBlock,absoluteOffset+offset);
var vectors=vectorInfo.vectors;
var codeStart=vectorInfo.codeStart;
var metadata=vectorInfo.metadata;
metadata.execLen=execLen;
if(absoluteOffset!==undefined){
this.syncBootAddress(metadata,absoluteOffset+offset,execBlock.length,function (newStart){
if(newStart<codeStart)codeStart=newStart;
});
}
var relocations=this.parseFixups(execBlock,fixups,syncIdx,execLen,metadata);
var fullPayload=data.slice(syncIdx+6);
metadata.headerOffset=offset-(syncIdx+6);
var instructions=this.disassemble(fullPayload,vectors,codeStart,metadata,relocations);
return {
longRecLen:longRecLen,
execLen:execLen,
vectors:vectors,
instructions:instructions,
relocations:relocations,
headerSize:offset,
metadata:metadata,
codeStart:codeStart
};
},
syncBootAddress:function (metadata,bodyAbsoluteStart,bodyLen,onNewStartFound){
var bootAddr=0x0019;
if(bootAddr>=bodyAbsoluteStart&&bootAddr<bodyAbsoluteStart+bodyLen){
var relativeBoot=bootAddr-bodyAbsoluteStart;
if(relativeBoot>=6){
metadata.actionCode=relativeBoot;
metadata.actionDesc="Boot Entry ($"+bootAddr.toString(16).toUpperCase().padStart(4,'0')+")";
metadata.isBootablePack=true;
metadata.bootAddr=bootAddr;
onNewStartFound(relativeBoot);
}
}
},
extractVectors:function (execBlock,bodyAbsoluteStart){
var vectors=[];
var metadata={codelen:0,bdevice:0,devnum:0,vernum:0,maxvec:0,name:"",actionCode:null,actionDesc:""};
if(execBlock.length<6)return {vectors:[],codeStart:0,metadata:metadata};
metadata.codelen=(execBlock[0]<<8)|execBlock[1];
metadata.bdevice=execBlock[2];
metadata.devnum=execBlock[3];
metadata.vernum=execBlock[4];
metadata.maxvec=execBlock[5];
var tableEnd=6+(metadata.maxvec*2);
for(var i=0;i<metadata.maxvec;i++){
var offset=6+(i*2);
if(offset+1>=execBlock.length)break;
var addr=(execBlock[offset]<<8)|execBlock[offset+1];
var relTarget=addr;
vectors.push({offset:offset,target:addr,relTarget:relTarget,label:"Vector "+i});
}
var currentOffset=tableEnd;
var nameFound=false;
var actionFound=false;
var isLikelyName=this.isLikelyName.bind(this,execBlock);
if(isLikelyName(currentOffset)){
var nameLen=execBlock[currentOffset];
var name="";
for(var j=0;j<nameLen;j++){
name+=String.fromCharCode(execBlock[currentOffset+1 + j]);
}
metadata.name=name.trim();
currentOffset+=1+nameLen;
nameFound=true;
if(currentOffset+1<execBlock.length){
metadata.actionCode=(execBlock[currentOffset]<<8)|execBlock[currentOffset+1];
metadata.actionDesc=this.resolveActionDesc(metadata.actionCode);
currentOffset+=2;
actionFound=true;
}
}
else if(currentOffset+2<execBlock.length&&isLikelyName(currentOffset+2)){
metadata.actionCode=(execBlock[currentOffset]<<8)|execBlock[currentOffset+1];
metadata.actionDesc=this.resolveActionDesc(metadata.actionCode);
currentOffset+=2;
actionFound=true;
var nameLen=execBlock[currentOffset];
var name="";
for(var j=0;j<nameLen;j++){
name+=String.fromCharCode(execBlock[currentOffset+1 + j]);
}
metadata.name=name.trim();
currentOffset+=1+nameLen;
nameFound=true;
}
else {
var forwardLimit=Math.min(execBlock.length,currentOffset+64);
for(var m=currentOffset;m<forwardLimit;m++){
if(isLikelyName(m)){
var nLen=execBlock[m];
var name="";
for(var n=0;n<nLen;n++){
name+=String.fromCharCode(execBlock[m+1 + n]);
}
metadata.name=name.trim();
currentOffset=m+1 + nLen;
nameFound=true;
if(currentOffset+1<execBlock.length){
var ac=(execBlock[currentOffset]<<8)|execBlock[currentOffset+1];
if(ac<=0x0100){
metadata.actionCode=ac;
metadata.actionDesc=this.resolveActionDesc(ac);
currentOffset+=2;
}
}
break;
}
}
}
if(!nameFound){
if(metadata.codelen>0&&metadata.codelen<execBlock.length){
if(isLikelyName(metadata.codelen)){
var nLen=execBlock[metadata.codelen];
var nStr="";
for(var n=0;n<nLen;n++){
nStr+=String.fromCharCode(execBlock[metadata.codelen+1 + n]);
}
metadata.name=nStr.trim();
nameFound=true;
metadata.footerOffset=metadata.codelen;
}
}
if(!nameFound){
var tailScanLimit=128;
var tailStart=Math.max(0,execBlock.length-tailScanLimit);
var tailData=execBlock.slice(tailStart);
var procedures=[];
for(var k=0;k<tailData.length-2;k++){
if(isLikelyName(tailStart+k)){
var nLen=tailData[k];
var nStr="";
for(var l=0;l<nLen;l++){
nStr+=String.fromCharCode(tailData[k+1 + l]);
}
var proc={name:nStr.trim(),offset:tailStart+k};
if(metadata.tailOffset===undefined)metadata.tailOffset=tailStart+k;
var nextOff=k+1 + nLen;
if(nextOff+1<tailData.length){
var ac=(tailData[nextOff]<<8)|tailData[nextOff+1];
if(ac<=0x0100){
proc.actionCode=ac;
proc.actionDesc=this.resolveActionDesc(ac);
}
}
procedures.push(proc);
k+=nLen;
}
}
if(procedures.length>0){
metadata.procedures=procedures;
metadata.name=procedures[procedures.length-1].name;
if(procedures[procedures.length-1].actionCode!==undefined){
metadata.actionCode=procedures[procedures.length-1].actionCode;
metadata.actionDesc=procedures[procedures.length-1].actionDesc;
}
nameFound=true;
}
}
}
if(!nameFound&&currentOffset<execBlock.length){
currentOffset++;
}
var codeStart=metadata.procedures?tableEnd:currentOffset;
if(bodyAbsoluteStart!==undefined){
var bootAddr=0x0019;
if(bootAddr>=bodyAbsoluteStart&&bootAddr<bodyAbsoluteStart+execBlock.length){
var relativeBoot=bootAddr-bodyAbsoluteStart;
if(relativeBoot<codeStart){
codeStart=relativeBoot;
}
}
}
metadata.bodyAbsoluteStart=bodyAbsoluteStart;
return {vectors:vectors,codeStart:codeStart,metadata:metadata};
},
resolveActionDesc:function (code){
if(code===0x0000)return "Run OPL procedure";
if(code===0x0001)return "Open Notepad file";
if(code===0x0002)return "Open Database file";
return "Jump to address 0x"+code.toString(16).toUpperCase().padStart(4,'0');
},
extractVectorsHeuristic:function (payload){
var vectors=[];
var tableSize=1;
for(var i=1;i<13;i+=2){
if(i+1>=payload.length)break;
var addr=(payload[i]<<8)|payload[i+1];
var isInternal=addr>=0&&addr<payload.length;
var isSystem=(addr>=0xF000)||(addr>0&&addr<0x0100);
var isRAM=(addr>=0x0100&&addr<0x8000);
if(isInternal||isSystem||isRAM){
vectors.push({offset:i,target:addr,label:"Vector "+Math.floor(i/2)});
tableSize=i+2;
}else {
break;
}
}
return {vectors:vectors,tableSize:tableSize,metadata:null};
},
parseFixups:function (execBlock,fixups,syncIdx,execLen,metadata){
var result={
execChecksum:0,
calculatedExecChecksum:0,
jtCount:0,
jtOffsets:[],
jtSum:0,
calculatedJTSum:0
};
var skip=0;
if(metadata&&metadata.footerOffset!==undefined){
}
var p=0;
if(fixups.length>0&&fixups[0]<32){
var nLen=fixups[0];
if(nLen>0&&nLen+2<fixups.length){
var isName=true;
for(var k=0;k<nLen;k++){
var c=fixups[1+k];
if(c<32||c>126){isName=false;break;}
}
if(isName)p=nLen+1;
}
}
if(p+2<fixups.length){
var ac=(fixups[p]<<8)|fixups[p+1];
if(ac<=0x0100)p+=2;
}
if(fixups.length-p<4)return result;
result.execChecksum=(fixups[p]<<8)|fixups[p+1];
p+=2;
var sum=0;
for(var j=0;j<execBlock.length;j++){
sum=(sum+execBlock[j])&0xFFFF;
}
result.calculatedExecChecksum=sum;
result.jtCount=(fixups[p]<<8)|fixups[p+1];
p+=2;
result.jtStart=syncIdx+6 + execLen+p - 4;
var relocationBytes=result.jtCount*2;
var end=Math.min(p+relocationBytes,fixups.length-2);
for(;p<end;p+=2){
result.jtOffsets.push((fixups[p]<<8)|fixups[p+1]);
}
if(fixups.length>=2){
result.jtSum=(fixups[fixups.length-2]<<8)|fixups[fixups.length-1];
}
var jtSum=0;
result.jtOffsets.forEach(function (o){
jtSum=(jtSum+o)&0xFFFF;
});
result.calculatedJTSum=jtSum;
return result;
},
disassemble:function (payload,vectors,skip,metadata,fixups){
var instructions=[];
var targetMap={};
var tableSize=skip||0;
if(metadata){
if(metadata.actionCode!==undefined&&metadata.actionCode>0x0002&&metadata.actionCode<payload.length){
if(!targetMap[metadata.actionCode])targetMap[metadata.actionCode]={vector:true};
else targetMap[metadata.actionCode].vector=true;
}
if(metadata.procedures){
metadata.procedures.forEach(function (p){
var procOff=p.action||p.offset;
if(procOff>=0&&procOff<payload.length){
if(!targetMap[procOff])targetMap[procOff]={subroutine:true};
else targetMap[procOff].subroutine=true;
}
});
}
}
vectors.forEach(function (v,idx){
if(v.relTarget>=0&&v.relTarget<payload.length){
if(!targetMap[v.relTarget])targetMap[v.relTarget]={vector:true,vectorIdx:idx};
else {
targetMap[v.relTarget].vector=true;
targetMap[v.relTarget].vectorIdx=idx;
}
}
});
var scanPc=tableSize;
var baseAddr=metadata.bodyAbsoluteStart||metadata.bootAddr||0;
var execLimit=(metadata&&metadata.execLen!==undefined)?metadata.execLen:payload.length;
if(metadata&&metadata.codelen>0)execLimit=metadata.codelen;
while(scanPc<execLimit){
var startPc=scanPc;
var opcode=payload[scanPc++];
var info=this.opcodes[opcode]||{mnem:"DB",len:1,type:'raw'};
for(var i=1;i<info.len;i++){
if(scanPc<execLimit)scanPc++;
}
var destOffset=-1;
var mnemonic=info.mnem;
var isJumpOrBranch=(
mnemonic==='JMP'||mnemonic==='JSR'||
mnemonic==='BRA'||mnemonic==='BSR'||
mnemonic==='BRN'||mnemonic==='BHI'||
mnemonic==='BLS'||mnemonic==='BCC'||
mnemonic==='BCS'||mnemonic==='BNE'||
mnemonic==='BEQ'||mnemonic==='BVC'||
mnemonic==='BVS'||mnemonic==='BPL'||
mnemonic==='BMI'||mnemonic==='BGE'||
mnemonic==='BLT'||mnemonic==='BGT'||
mnemonic==='BLE'
);
var isSub=(mnemonic==='JSR'||mnemonic==='BSR');
if(info.len===2){
var val=payload[startPc+1];
if(info.type==='rel'&&isJumpOrBranch){
var rel=val>127?val-256:val;
destOffset=startPc+2 + rel;
}
}else if(info.len===3){
if(info.type==='ext'&&isJumpOrBranch){
var absAddr=(payload[startPc+1]<<8)|payload[startPc+2];
destOffset=absAddr-baseAddr;
}
}
if(destOffset>=0&&destOffset<payload.length){
if(!targetMap[destOffset])targetMap[destOffset]={};
var entry=targetMap[destOffset];
if(isSub){
entry.subroutine=true;
}else {
entry.branch=true;
}
}
}
var baseAddr=metadata.bodyAbsoluteStart||metadata.bootAddr||0;
var pc=0;
var hOff=metadata.headerOffset||0;
for(var a=0;a<hOff;a++){
instructions.push({
offset:a,
hex:payload[a].toString(16).toUpperCase().padStart(2,'0'),
mnem:"DB",
operand:"$"+payload[a].toString(16).toUpperCase().padStart(2,'0'),
comment:a===0?"Load Address":""
});
}
var headerLabels=["Codelen (Hi)","Codelen (Lo)","Boot Device","Device Number","Version","Max number of Vectors"];
for(var h=0;h<6;h++){
var pIdx=hOff+h;
if(pIdx>=payload.length)break;
instructions.push({
offset:pIdx,
hex:payload[pIdx].toString(16).toUpperCase().padStart(2,'0'),
mnem:"DB",
operand:"$"+payload[pIdx].toString(16).toUpperCase().padStart(2,'0'),
comment:headerLabels[h],
targetFlags:targetMap[pIdx]||null
});
}
pc=hOff+6;
var tableSize=hOff+6 +(metadata.maxvec*2);
while(pc<tableSize&&pc<payload.length){
var vIdx=Math.floor((pc-(hOff+6))/2);
var b1=payload[pc++];
var b2=(pc<payload.length)?payload[pc++]:0;
var val16=(b1<<8)|b2;
instructions.push({
offset:pc-2,
hex:b1.toString(16).toUpperCase().padStart(2,'0')+" "+b2.toString(16).toUpperCase().padStart(2,'0'),
mnem:"DW",
operand:"$"+val16.toString(16).toUpperCase().padStart(4,'0'),
comment:vIdx===0?"Boot Entry Vector (install)":"Vector "+vIdx+" Target",
targetFlags:targetMap[pc-2]||null
});
}
pc=Math.max(pc,hOff+6 +(metadata.maxvec*2));
if(metadata&&metadata.name){
var tableEnd=hOff+6 +(metadata.maxvec*2);
var searchLimit=Math.min(payload.length,tableEnd+64);
for(var m=tableEnd;m<searchLimit;m++){
if(this.isLikelyName(payload,m)){
var nLen=payload[m];
targetMap[m]={type:'name_len',len:nLen};
for(var j=0;j<nLen;j++){
targetMap[m+1 + j]={type:'name_byte'};
}
var actionIdx=m+1 + nLen;
if(actionIdx+1<payload.length){
targetMap[actionIdx]={type:'action_code'};
}
break;
}
}
}
while(pc<execLimit){
var startPc=pc;
if(targetMap[startPc]){
var flags=targetMap[startPc];
var absAddr=baseAddr+startPc;
var labelName="";
if(flags.vector||flags.branch||flags.subroutine){
if(flags.vector){
if(flags.vectorIdx===0){
labelName="install";
}else if(flags.vectorIdx!==undefined){
labelName="VEC"+flags.vectorIdx.toString().padStart(2,'0');
}else {
labelName="loc_"+absAddr.toString(16).toUpperCase().padStart(4,'0');
}
}else {
var labelPrefix=(flags.branch)?"loc_":"sub_";
labelName=labelPrefix+startPc.toString(16).toUpperCase().padStart(4,'0');
}
}
if(labelName){
instructions.push({
offset:startPc,
hex:"",
mnem:labelName+":",
operand:"",
comment:flags.vector?(flags.vectorIdx===0?"Boot Entry Vector (install)":"Vector "+flags.vectorIdx+" Entry"):"; <-- Target address $"+startPc.toString(16).toUpperCase().padStart(4,'0'),
targetFlags:flags
});
}
}
var opcode=payload[pc++];
var info=this.opcodes[opcode]||{mnem:"DB",len:1,type:'raw'};
if(info.len>1){
for(var i=1;i<info.len;i++){
if(targetMap[startPc+i]||(startPc+i>=execLimit)){
info={mnem:"DB",len:1,type:'raw'};
break;
}
}
}
var hex=opcode.toString(16).padStart(2,'0').toUpperCase();
for(var i=1;i<info.len;i++){
if(pc<payload.length){
var b=payload[pc++];
hex+=" "+b.toString(16).padStart(2,'0').toUpperCase();
}
}
var mnemonic=info.mnem;
var operand="";
var comment="";
var flags=targetMap[startPc];
var isDataBlock=(flags==='data'||(flags&&(flags.type==='name_byte'||flags.type==='name_len'||flags.type==='action_code')));
if(isDataBlock){
if(flags&&flags.type==='action_code'){
var ac=(payload[startPc]<<8)|payload[startPc+1];
mnemonic="DW";
operand="$"+ac.toString(16).toUpperCase().padStart(4,'0');
comment="Action Code ("+this.resolveActionDesc(ac)+")";
hex=payload[startPc].toString(16).toUpperCase().padStart(2,'0')+" "+payload[startPc+1].toString(16).toUpperCase().padStart(2,'0');
pc=startPc+2;
}else {
mnemonic="DB";
operand="$"+opcode.toString(16).padStart(2,'0').toUpperCase();
if(opcode>=32&&opcode<=126){
comment="'"+String.fromCharCode(opcode)+"'";
}
if(flags&&flags.type==='name_len'){
comment="Name Length ("+flags.len+")";
}
}
}
if(metadata&&metadata.procedures){
for(var d=0;d<metadata.procedures.length;d++){
var p=metadata.procedures[d];
var nameLen=payload[p.offset];
if(startPc>=p.offset&&startPc<p.offset+1 + nameLen){
isDataBlock=true;
mnemonic="DB";
operand="$"+opcode.toString(16).padStart(2,'0').toUpperCase();
if(startPc===p.offset+1){
comment='"'+p.name+'"';
}
break;
}
}
}
if(!isDataBlock){
var isJumpOrBranch=(
mnemonic==='JMP'||mnemonic==='JSR'||
mnemonic==='BRA'||mnemonic==='BSR'||
mnemonic==='BRN'||mnemonic==='BHI'||
mnemonic==='BLS'||mnemonic==='BCC'||
mnemonic==='BCS'||mnemonic==='BNE'||
mnemonic==='BEQ'||mnemonic==='BVC'||
mnemonic==='BVS'||mnemonic==='BPL'||
mnemonic==='BMI'||mnemonic==='BGE'||
mnemonic==='BLT'||mnemonic==='BGT'||
mnemonic==='BLE'
);
if(info.len===2){
var val=payload[startPc+1];
if(info.type==='rel'){
var rel=val>127?val-256:val;
var destOff=startPc+2 + rel;
var destAddr=baseAddr+destOff;
operand="$"+val.toString(16).padStart(2,'0').toUpperCase();
if(isJumpOrBranch){
var desc=this.branchDescs[mnemonic]||"Branch to $";
comment=desc+(desc.endsWith("$")?"":" $")+destAddr.toString(16).padStart(4,'0').toUpperCase();
}
}else if(info.type==='dir'){
operand="m$"+val.toString(16).toUpperCase().padStart(2,'0');
if(this.sysConstants[val]){
comment=this.sysConstants[val];
}
}else if(info.type==='imm'||opcode===0x3F){
operand="#$"+val.toString(16).toUpperCase().padStart(2,'0');
if(opcode===0x3F){
var swiName=this.swiNames[val]||"Unknown";
operand=swiName.toUpperCase();
comment="Psion System Call: "+swiName;
if(val===111||val===110||val===80){
if(pc<payload.length){
var arg=payload[pc++];
hex+=" "+arg.toString(16).padStart(2,'0').toUpperCase();
var strStart=pc;
var str="";
var foundNull=false;
var isLikelyStr=true;
while(pc<payload.length){
var charCode=payload[pc++];
if(charCode===0){
foundNull=true;
break;
}
if((charCode>=32&&charCode<=126)||charCode===0x0D||charCode===0x0A||charCode===0x10){
str+=(charCode>=32&&charCode<=126)?String.fromCharCode(charCode):".";
}else {
isLikelyStr=false;
}
if(str.length>256){isLikelyStr=false;break;}
}
if(foundNull&&isLikelyStr){
comment+=" (\""+str+"\")";
for(var s=strStart-1;s<pc;s++){
targetMap[s]='data';
}
pc=strStart-1;
}else {
pc=strStart;
operand+=", #$"+arg.toString(16).toUpperCase().padStart(2,'0');
}
}
}
}
}else if(info.type==='idx'){
operand=val+",X";
}
}else if(info.len===3){
var val1=payload[startPc+1];
var val2=payload[startPc+2];
var val16=(val1<<8)|val2;
if(info.type==='imm16'){
operand="#$"+val16.toString(16).toUpperCase().padStart(4,'0');
if(this.sysConstants[val16]){
comment="Value of "+this.sysConstants[val16].split(' - ')[0];
}
}else if(info.type==='ext'){
operand="$"+val16.toString(16).toUpperCase().padStart(4,'0');
if(this.sysConstants[val16]){
comment=this.sysConstants[val16];
}else if(isJumpOrBranch){
var desc=this.branchDescs[mnemonic]||"Jump to $";
comment=desc+(desc.endsWith("$")?"":" $")+val16.toString(16).padStart(4,'0').toUpperCase();
}
}else if(info.type==='dir_imm'){
operand="#$"+val1.toString(16).padStart(2,'0').toUpperCase()+", m$"+val2.toString(16).padStart(2,'0').toUpperCase();
var bitInfo=this.resolveBitInfo(val2,val1);
if(bitInfo){
comment=bitInfo;
}else if(this.sysConstants[val2]){
comment="Bit op on "+this.sysConstants[val2].split(' - ')[0];
}
}else if(info.type==='idx_imm'){
operand="#$"+val1.toString(16).toUpperCase().padStart(2,'0')+", "+val2+",X";
}
}
}
instructions.push({
offset:startPc,
hex:hex,
mnem:mnemonic,
operand:operand,
comment:comment,
targetFlags:targetMap[startPc]||null
});
if(mnemonic==='RTS'||mnemonic==='JMP'||mnemonic==='RTI'||pc>payload.length-128){
while(pc<execLimit&&!targetMap[pc]&&this.isLikelyName(payload,pc)){
var nLen=payload[pc];
var name="";
for(var k=0;k<nLen;k++)name+=String.fromCharCode(payload[pc+1 + k]);
instructions.push({
offset:pc,
hex:payload[pc].toString(16).toUpperCase().padStart(2,'0'),
mnem:"DB",
operand:"$"+payload[pc].toString(16).toUpperCase().padStart(2,'0'),
comment:"Name Length ("+nLen+")"
});
pc++;
for(var n=0;n<nLen;n++){
if(pc<payload.length){
var charCode=payload[pc];
instructions.push({
offset:pc,
hex:charCode.toString(16).toUpperCase().padStart(2,'0'),
mnem:"DB",
operand:"$"+charCode.toString(16).toUpperCase().padStart(2,'0'),
comment:(n===0)?'"'+name+'"':""
});
pc++;
}
}
if(pc+1<payload.length){
var ac=(payload[pc]<<8)|payload[pc+1];
if(ac<=0x0100){
instructions.push({
offset:pc,
hex:payload[pc].toString(16).toUpperCase().padStart(2,'0')+" "+payload[pc+1].toString(16).toUpperCase().padStart(2,'0'),
mnem:"DW",
operand:"$"+ac.toString(16).toUpperCase().padStart(4,'0'),
comment:"Action Code ("+this.resolveActionDesc(ac)+")"
});
pc+=2;
}
}
}
}
}
if(fixups&&fixups.jtOffsets&&fixups.jtOffsets.length>0){
var jtIdx=fixups.jtStart-6;
if(jtIdx>=0&&jtIdx<payload.length){
pc=jtIdx;
instructions.push({
offset:pc,
hex:"",
mnem:"; --- Relocation Jump Table ---",
operand:"",
comment:""
});
if(pc+1<payload.length){
var cs=(payload[pc]<<8)|payload[pc+1];
instructions.push({
offset:pc,
hex:payload[pc].toString(16).toUpperCase().padStart(2,'0')+" "+payload[pc+1].toString(16).toUpperCase().padStart(2,'0'),
mnem:"DW",
operand:"$"+cs.toString(16).toUpperCase().padStart(4,'0'),
comment:"ExecCS: Execution block checksum"
});
pc+=2;
}
if(pc+1<payload.length){
var count=(payload[pc]<<8)|payload[pc+1];
instructions.push({
offset:pc,
hex:payload[pc].toString(16).toUpperCase().padStart(2,'0')+" "+payload[pc+1].toString(16).toUpperCase().padStart(2,'0'),
mnem:"DW",
operand:"$"+count.toString(16).toUpperCase().padStart(4,'0'),
comment:"JTCount: Relocation table count"
});
pc+=2;
}
for(var i=0;i<fixups.jtOffsets.length;i++){
if(pc+1<payload.length){
var val=(payload[pc]<<8)|payload[pc+1];
instructions.push({
offset:pc,
hex:payload[pc].toString(16).toUpperCase().padStart(2,'0')+" "+payload[pc+1].toString(16).toUpperCase().padStart(2,'0'),
mnem:"DW",
operand:"$"+val.toString(16).toUpperCase().padStart(4,'0'),
comment:"Reloc"+i + ": Offset target"
});
pc+=2;
}
}
}
}
if(pc<payload.length){
instructions.push({
offset:pc,
hex:"",
mnem:"; --- Trailing Metadata / Checksums ---",
operand:"",
comment:""
});
while(pc<payload.length){
var isLastTwo=(pc>=payload.length-2);
var isFirstTwoOfFixups=(fixups&&pc===(fixups.jtStart-6));
var comment="";
if(isFirstTwoOfFixups)comment="ExecCS: (Hi)";
else if(fixups&&pc===(fixups.jtStart-5))comment="ExecCS: (Lo)";
else if(isLastTwo){
comment=(pc===payload.length-2)?"JTSum: (Hi)":"JTSum: (Lo)";
}
instructions.push({
offset:pc,
hex:payload[pc].toString(16).toUpperCase().padStart(2,'0'),
mnem:"DB",
operand:"$"+payload[pc].toString(16).toUpperCase().padStart(2,'0'),
comment:comment
});
pc++;
}
}
return instructions;
},
initBranchDescs:function (){
this.sysConstants={
0x00:"PORA/DDRA - Data Direction A",
0x01:"PORTB - Data Port B",
0x02:"PORTA - Data Port A",
0x03:"DDRB - Data Direction B",
0x04:"PORTC - Data Port C",
0x05:"DDRC - Data Direction C",
0x06:"PORTD - Data Port D",
0x07:"DDRD - Data Direction D",
0x08:"TCR - Timer Control Register",
0x09:"TCSR - Timer Control/Status",
0x0A:"TCH - Timer Counter High",
0x0B:"TCL - Timer Counter Low",
0x0C:"OCR H - Output Compare High",
0x0D:"OCR L - Output Compare Low",
0x0E:"ICR H - Input Capture High",
0x0F:"ICR L - Input Capture Low",
0x10:"P3CSR - Port 3 Control/Status",
0x11:"RMCR - Rate Modulator Control",
0x12:"TRCSR - Transmit/Receive Control",
0x13:"RDR - Receive Data Register",
0x14:"TDR - Transmit Data Register",
0x15:"RAMCR - RAM Control Register",
0x1C:"RAM_CON - RAM Control / System Status",
0x1F:"DP_STAT - Datapak Status",
0xFD0C:"STX $FD0C - Boot/CLC hook",
0x0019:"Pack Boot Entry",
0xFFE8:"ROM_MODEL_BYTE",
0xFFCB:"ROM_MODEL_BYTE_2",
0x40:"UTB_7E - JMP vector in UTW_S0",
0x41:"UTW_S0 - General word S0",
0x43:"UTW_S1 - General word S1",
0x45:"UTW_S2 - General word S2",
0x47:"UTW_S3 - General word S3",
0x49:"UTW_S4 - General word S4",
0x4B:"UTW_S5 - General word S5",
0x4D:"UTW_R0 / UTB_H0 - General var",
0x4E:"UTB_L0 - General var",
0x4F:"UTW_R1 / UTB_H1",
0x50:"UTB_L1",
0x51:"UTW_R2 / UTB_H2",
0x52:"UTB_L2",
0x53:"UTW_R3 / UTB_H3",
0x54:"UTB_L3",
0x55:"UTW_R4 / UTB_H4",
0x56:"UTB_L4",
0x57:"UTW_R5 / UTB_H5",
0x58:"UTB_L5",
0x59:"UTW_R6 / UTB_H6",
0x5A:"UTB_L6",
0x5B:"BTB_NMFL - NMI flag",
0x5C:"BTW_CCNT - Time before switch off",
0x5E:"BTA_RTOP - Address of RAMTOP",
0x60:"RTB_LBAT - Low battery flag",
0x62:"DPB_CPOS - Cursor position (0-31)",
0x63:"DPB_CUST - Cursor status byte",
0x64:"DPB_VLIN - Scrolling line position",
0x65:"DPB_VSIZ - Scroll chars",
0x66:"DPB_VDIR - Scroll direction",
0x67:"DPB_SPOS - Saved cursor position",
0x68:"DPB_SCUS - Saved cursor status",
0x69:"DPW_SPED - Scroll delay ticks",
0x6B:"DPW_DELY - Scroll start delay",
0x6D:"DPW_REDY - Ready timer",
0x6F:"DPA_VADD - Scroll string address",
0x71:"KBW_TDEL - Keyboard poll time",
0x73:"KBB_BACK - Buffer oldest key offset",
0x74:"KBB_NKYS - Keys in buffer",
0x75:"KBB_PREV - Previous key pressed",
0x76:"KBB_WAIT - Unget key",
0x77:"KBB_DLAY - Auto-repeat delay",
0x78:"KBB_REPT - Auto-repeat rate",
0x79:"KBB_CNTR - Keyboard counter",
0x7A:"KBB_KNUM - Key table offset",
0x7B:"KBB_STAT - CAPS/NUM/SHIFT status",
0x7C:"TMB_SWOF - Auto-switch off flag",
0x7D:"TMW_TOUT - Time until auto-switch off",
0x7F:"EDB_MLEN - Max input length",
0x80:"EDB_PLEN - Prompt length",
0x81:"EDB_FLIN - First editable line",
0x82:"EDB_POFF - First editable character",
0x83:"EDB_CLIN - Current line edit",
0x84:"EDB_STAT - Editor cursor status",
0x85:"EDW_CPOS - Current position in line",
0x87:"EDW_CB - Offset to current line",
0x89:"EDW_BL - Total buffer length",
0x8B:"PKB_CURP - Pack being looked at",
0x8C:"PKB_CPAK - Actual current pack",
0x8D:"PKW_RASI - Length of RAM file",
0x8F:"PKW_CMAD - Offset into RAM file",
0x91:"PKB_HPAD - Pack address high byte",
0x92:"PKW_CPAD - Pack address low word",
0x94:"PKA_PKID - Pointer to pack identifier",
0x96:"FLB_RECT - Current record type",
0x97:"FLB_CPAK - Current pack",
0x98:"FLB_CONT - Device being DIR-ed",
0x99:"FLW_RECP - Record position",
0x9B:"FLB_CATL - Length of file name",
0x9C:"FLA_CATP - Pointer to file name",
0x9E:"FLA_CATB - Pointer to file buffer",
0xA0:"FLB_MODE - Open mode (0-3)",
0xA1:"FLB_STAT - File status byte",
0xA2:"FLW_OFFS - Offset in record",
0xA4:"FLW_RLEN - Record length",
0xA6:"FLW_NREC - Number of records",
0xA8:"FLB_TYPE - Record type being read",
0xA9:"FLW_SIZE - Total file size",
0xAB:"FLB_ATTR - File attributes",
0xAC:"PKW_IDEN - Pack ID constant",
0xAE:"FLB_MODF - File modified flag",
0xAF:"FLW_CREA - Creation date",
0xB1:"FLB_RESR - Reserved for system",
0xB2:"MTW_X0 - Math exponent 0",
0xB4:"MTW_M0 - Math mantissa 0",
0xB6:"MTW_X1 - Math exponent 1",
0xB8:"MTW_M1 - Math mantissa 1",
0xBA:"MTW_X2 - Math exponent 2",
0xBC:"MTW_M2 - Math mantissa 2",
0xBE:"MTW_X3 - Math exponent 3",
0xC0:"MTW_M3 - Math mantissa 3",
0xC2:"MTW_TMP - Math temporary",
0xC4:"MTB_SIGN - Math sign byte",
0xC5:"MTB_PREC - Math precision",
0xC6:"MTB_STAT - Math status",
0xC7:"RMB_MODE - Run mode status",
0xC8:"RMA_PENT - Entry point address",
0xCA:"RMW_PC - Run mode PC",
0xCC:"RMW_SP - Run mode SP",
0xCE:"RMW_VAR - Run mode variable ptr",
0xD0:"RMW_CODE - Run mode code ptr",
0xD2:"AMW_TIME - Next alarm time",
0xD4:"AMB_STAT - Alarm status",
0xD5:"AMB_TYPE - Alarm type",
0xD6:"UTB_SBUF - Utility buffer offset",
0xD7:"UTW_TEMP - Utility temp word",
0xD9:"UTB_TEMP - Utility temp byte",
0xDA:"BTW_BOOT - Boot vector address",
0xDC:"BTW_NMI - NMI vector address",
0xDE:"BTW_SWI - SWI vector address",
0xE0:"BTW_TRAP - TRAP vector address",
0xE2:"BTW_ICV - Input capture vector",
0xE4:"BTW_OCV - Output compare vector",
0xE6:"BTW_TOV - Timer overflow vector",
0xE8:"BTW_SRV - Serial vector",
0xEA:"BTW_IRQ - IRQ vector",
0xEC:"BTW_SVC - Supervisor call vector",
0xEE:"BTW_PGR - Programming vector",
0xF0:"BTB_VER - System version",
0xF1:"BTB_REV - System revision",
0xF2:"BTB_LANG - System language",
0xF3:"BTB_TYPE - System hardware type",
0xFD:"UTW_ID - Pack ID buffer",
0xFF:"UTB_CSUM - Checksum byte",
0xC5:"MTT_AMAN / DIB_YEAR - Maths Acc / Year",
0xC6:"DIB_MONS - Month",
0xC7:"DIB_DAYS - Day",
0xC8:"DIB_HOUR - Hour",
0xC9:"DIB_MINS - Mins",
0xCC:"MTB_AEXP - Maths Acc Exponent",
0xCD:"MTB_ASGN - Maths Acc Sign",
0xCE:"MTT_OMAN - Maths Operand Mantissa",
0xD5:"MTB_OEXP - Maths Operand Exponent",
0xD6:"MTB_OSGN - Maths Operand Sign",
0xD7:"ITA_PCNT - Table program counter",
0xD9:"ITA_BASE - Table base",
0xDB:"ITA_SPTR - Table stack pointer",
0xDD:"ITB_TEST - Table flag",
0xDE:"IMA_GPTR - General pointer",
0xE0:"Transient application area (starts)",
0xF8:"Transient application area (trashed on warm boot)",
0x2000:"ALT_BASE / PERMCELL - Allocator base / Permanent cell",
0x2002:"MENUCELL - Top level menu cell",
0x2004:"DIRYCELL - Diary cell",
0x2006:"TEXTCELL - Language text cell",
0x2008:"SYMBCELL - Symbol table cell",
0x200A:"GLOBCELL - Global record cell",
0x200C:"OCODCELL - QCODE output cell",
0x200E:"FSY1CELL - Field name symbol table 1",
0x2010:"FSY2CELL - Field name symbol table 2",
0x2012:"FSY3CELL - Field name symbol table 3",
0x2014:"FSY4CELL - Field name symbol table 4",
0x2016:"FBF1CELL - File buffer 1",
0x2018:"FBF2CELL - File buffer 2",
0x201A:"FBF3CELL - File buffer 3",
0x201C:"FBF4CELL - File buffer 4",
0x201E:"DATACELL - Database cell",
0x2040:"ALA_FREE - Top of allocator area",
0x2042:"BTA_2IQ - IRQ2 re-vector",
0x2044:"BTA_CMI - CMI re-vector",
0x2046:"BTA_TRP - TRAP re-vector",
0x2048:"BTA_SIO - SIO re-vector",
0x204A:"BTA_TOI - TOI re-vector",
0x204C:"BTA_OCI - OCI re-vector",
0x204E:"BTA_ICI - ICI re-vector",
0x2050:"BTA_1IQ - IRQ1 re-vector",
0x2052:"BTA_SWI - SWI re-vector",
0x2054:"BTA_NMI - NMI re-vector",
0x2056:"BTA_WRM - WRM re-vector",
0x2058:"BTA_SOF - SWOF re-vector",
0x205A:"BTA_POLL - Keyboard poll routine",
0x205C:"BTA_TRAN - Keyboard translate routine",
0x205E:"BTA_TABL - Keyboard lookup table",
0x2060:"UTW_FP - Frame pointer (ENTER/LEAVE)",
0x2062:"BTB_IGNM - Ignore NMI flag",
0x2063:"BTB_IMSK - Saved interrupt mask",
0x2064:"BTB_TCSR - Saved TCSR1",
0x2065:"BTA_SBAS - Language stack base",
0x2067:"BTA_SAVSTACK - Saved SP while off",
0x2070:"DPT_TLIN - Top line screen buffer",
0x2080:"DPT_BLIN - Bottom line screen buffer",
0x2090:"DPT_SAVE - Screen save area",
0x20B0:"KBT_BUFF - Type ahead buffer",
0x20C0:"KBB_CLIK - Key click length",
0x20C1:"KBB_PKOF - Pack switch off flag",
0x20C2:"KBB_CAPK - Caps key status",
0x20C3:"KBB_NUMK - Nums key status",
0x20C4:"KBB_SHFK - Shift key status",
0x20C5:"TMB_YEAR / TMW_YEAR - Current year",
0x20C6:"TMB_MONS - Current month",
0x20C7:"TMB_DAYS - Current day",
0x20C8:"TMB_HOUR - Current hour",
0x20C9:"TMB_MINS - Current minute",
0x20CA:"TMB_SECS - Current seconds",
0x20CB:"TMW_FRAM - Frame counter",
0x20CD:"TMW_TCNT - Auto-switch off timeout",
0x20CF:"UTT_TBUF - Temp buffer (UT_DISP)",
0x20D6:"PKB_IMSK - Saved mask (blowing)",
0x20D7:"PKT_ID - Pack ID headers",
0x20FF:"RTT_NUMB - Calculator slots",
0x214F:"DVT_SPAR - I/O driver reserved",
0x2187:"RTB_BL - Run time buffer length",
0x2188:"RTT_BF - Run time buffer",
0x2288:"MTT_WBUF / AMT_NOW - Maths/Alarm buffer",
0x228E:"AMT_WEEK - One week alarm offset",
0x22C8:"RTB_FL - Find buffer length",
0x22C9:"RTT_FF - Find buffer",
0x22E9:"RTT_FILE - File control blocks",
0x22F9:"AMT_TAB - Alarm table",
0x2329:"DVA_BOT - Lowest low RAM addr",
0x232B:"DVA_TOP - Highest low RAM addr",
0x2335:"AMB_EI - Alarm checking enabled",
0x2336:"AMT_T0 - Alarm temp var",
0x233C:"AMT_T1 - Alarm temp var",
0x2342:"AMT_T2 - Alarm temp var",
0x2348:"AMW_R1 - Alarm temp var",
0x234A:"AMB_DOIT - Pending alarm check",
0x234B:"ITA_UVC - Table user vector",
0x234D:"ITT_REGS - Table registers",
0x236D:"ITT_STAK - Table stack",
0x23AD:"IMB_SSGN - Saved sign",
0x23AE:"FNT_SEED - Random number seed",
0x23B5:"ACW_STOP - QCode stop offset",
0x23B7:"ACW_XTCD - External OCode size",
0x23B9:"ACT_DDAT - Data sizes",
0x23BD:"ACT_NVAR - Variables count",
0x23C1:"ACT_BRAN - Current label number",
0x23C9:"ACT_PSYM - Symbol data pointer",
0x23CD:"LXA_CEND - End of text pointer",
0x23CF:"LXA_STRT - Start of current token",
0x23D1:"LXB_STOK - Saved token (un-lex)",
0x23D2:"LXB_SCLA - Saved class (un-lex)",
0x23D3:"LXB_FTYP - Function type",
0x23D4:"LGB_FIXP - Calculator decimal places",
0x23D5:"LGB_NL - Last proc name length",
0x23D6:"LGT_NF - Last proc name",
0x23E0:"LGB_LANT - Language type",
0x23E1:"LGB_MENU - Menu skip flag",
0x23E2:"RTA_1VCT - Extension operator code",
0x23E4:"UTW_RETA - Return address (UT_DDSP)",
0x23E6:"PKB_OVBL - Overblow factor",
0x23E7:"BTA_VECT - Vector to vector table"
};
return {
'BRA':'Branch always to $',
'BRN':'Branch never',
'BHI':'Branch if higher to $',
'BLS':'Branch if lower or same to $',
'BCC':'Branch if carry clear (higher or same) to $',
'BHS':'Branch if higher or same to $',
'BCS':'Branch if carry set (lower) to $',
'BLO':'Branch if lower to $',
'BNE':'Branch if not equal to $',
'BEQ':'Branch if equal to $',
'BVC':'Branch if overflow clear to $',
'BVS':'Branch if overflow set to $',
'BPL':'Branch if plus to $',
'BMI':'Branch if minus to $',
'BGE':'Branch if greater or equal to $',
'BLT':'Branch if less than to $',
'BGT':'Branch if greater than to $',
'BLE':'Branch if less or equal to $',
'BSR':'Call subroutine at $',
'JSR':'Call subroutine at $',
'JMP':'Jump to $'
};
},
initSwiNames:function (){
return {
0:'al$free',1:'al$grab',2:'al$grow',3:'al$repl',4:'al$shnk',5:'al$size',6:'al$zero',
7:'bt$nmdn',8:'bt$nmen',9:'bt$nof',10:'bt$non',11:'bt$pprg',12:'bt$swof',
13:'bz$alrm',14:'bz$bell',15:'bz$tone',
16:'dp$emit',17:'dp$prnt',18:'dp$rest',19:'dp$save',20:'dp$stat',21:'dp$view',22:'dp$wrdy',
23:'dv$boot',24:'dv$cler',25:'dv$lkup',26:'dv$load',27:'dv$vect',
28:'ed$edit',29:'ed$epos',30:'ed$view',
31:'er$lkup',32:'er$mess',
33:'fl$back',34:'fl$bcat',35:'fl$bdel',36:'fl$bopn',37:'fl$bsav',38:'fl$catl',39:'fl$copy',40:'fl$cret',
41:'fl$deln',42:'fl$eras',43:'fl$ffnd',44:'fl$find',45:'fl$frec',46:'fl$next',47:'fl$open',48:'fl$pars',
49:'fl$read',50:'fl$rect',51:'fl$renm',52:'fl$rset',53:'fl$setp',54:'fl$size',55:'fl$writ',
56:'fn$atan',57:'fn$cos',58:'fn$exp',59:'fn$ln',60:'fn$log',61:'fn$powr',62:'fn$rnd',63:'fn$sin',
64:'fn$sqrt',65:'fn$tan',
66:'it$gval',67:'it$radd',68:'it$strt',69:'it$tadd',
70:'kb$brek',71:'kb$flsh',72:'kb$getk',73:'kb$init',74:'kb$stat',75:'kb$test',76:'kb$uget',
77:'lg$newp',78:'lg$rled',
79:'ln$strt',
80:'mn$disp',
81:'mt$btof',82:'mt$fadd',83:'mt$fbdc',84:'mt$fbex',85:'mt$fbgn',86:'mt$fbin',87:'mt$fdiv',88:'mt$fmul',89:'mt$fngt',90:'mt$fsub',
91:'pk$pkof',92:'pk$qadd',93:'pk$rbyt',94:'pk$read',95:'pk$rwrd',96:'pk$sadd',97:'pk$save',98:'pk$setp',99:'pk$skip',
100:'rm$runp',
101:'tl$addi',102:'tl$cpyx',103:'tl$deli',104:'tl$xxmd',
105:'tm$dayv',106:'tm$tget',107:'tm$updt',108:'tm$wait',
109:'ut$cpyb',110:'ut$ddsp',111:'ut$disp',112:'ut$entr',113:'ut$fill',114:'ut$icpb',115:'ut$isbf',116:'ut$leav',117:'ut$sdiv',118:'ut$smul',119:'ut$splt',120:'ut$udiv',121:'ut$umul',122:'ut$utob',123:'ut$xcat',124:'ut$xtob',125:'ut$ysno',126:'ut$cdsp',
127:'tl$rstr',
0x81:'bt$toff',
0x9E:'am$entr'
};
},
resolveBitInfo:function (addr,mask){
if(!this.bitDefs[addr])return null;
var bits=[];
for(var bit=0;bit<8;bit++){
var bitMask=1<<bit;
if(mask&bitMask){
if(this.bitDefs[addr][bitMask]){
bits.push(this.bitDefs[addr][bitMask]);
}
}
}
return bits.length>0?bits.join(", "):null;
},
isLikelyName:function (block,off){
if(!block||off>=block.length)return false;
var len=block[off];
if(len<=0||len>32)return false;
if(off+1 + len>block.length)return false;
for(var k=0;k<len;k++){
var c=block[off+1 + k];
if(c<32||c>126)return false;
}
return true;
},
initOpcodes:function (){
var map={};
var ops=[
[0x00,"TRAP",1],[0x01,"NOP",1],[0x04,"LSRD",1],[0x05,"ASLD",1],[0x06,"TAP",1],[0x07,"TPA",1],[0x08,"INX",1],[0x09,"DEX",1],[0x0A,"CLV",1],[0x0B,"SEV",1],[0x0C,"CLC",1],[0x0D,"SEC",1],[0x0E,"CLI",1],[0x0F,"SEI",1],
[0x10,"SBA",1],[0x11,"CBA",1],[0x16,"TAB",1],[0x17,"TBA",1],[0x18,"XGDX",1],[0x19,"DAA",1],[0x1A,"SLP",1],[0x1B,"ABA",1],
[0x20,"BRA",2,'rel'],[0x21,"BRN",2,'rel'],[0x22,"BHI",2,'rel'],[0x23,"BLS",2,'rel'],[0x24,"BCC",2,'rel'],[0x25,"BCS",2,'rel'],[0x26,"BNE",2,'rel'],[0x27,"BEQ",2,'rel'],[0x28,"BVC",2,'rel'],[0x29,"BVS",2,'rel'],[0x2A,"BPL",2,'rel'],[0x2B,"BMI",2,'rel'],[0x2C,"BGE",2,'rel'],[0x2D,"BLT",2,'rel'],[0x2E,"BGT",2,'rel'],[0x2F,"BLE",2,'rel'],
[0x30,"TSX",1],[0x31,"INS",1],[0x32,"PULA",1],[0x33,"PULB",1],[0x34,"DES",1],[0x35,"TXS",1],[0x36,"PSHA",1],[0x37,"PSHB",1],[0x38,"PULX",1],[0x39,"RTS",1],[0x3A,"ABX",1],[0x3B,"RTI",1],[0x3C,"PSHX",1],[0x3D,"MUL",1],[0x3E,"WAI",1],[0x3F,"SWI",2],
[0x40,"NEGA",1],[0x43,"COMA",1],[0x44,"LSRA",1],[0x46,"RORA",1],[0x47,"ASRA",1],[0x48,"ASLA",1],[0x49,"ROLA",1],[0x4A,"DECA",1],[0x4C,"INCA",1],[0x4D,"TSTA",1],[0x4F,"CLRA",1],
[0x50,"NEGB",1],[0x53,"COMB",1],[0x54,"LSRB",1],[0x56,"RORB",1],[0x57,"ASRB",1],[0x58,"ASLB",1],[0x59,"ROLB",1],[0x5A,"DECB",1],[0x5C,"INCB",1],[0x5D,"TSTB",1],[0x5F,"CLRB",1],
[0x60,"NEG",2,'idx'],[0x63,"COM",2,'idx'],[0x64,"LSR",2,'idx'],[0x66,"ROR",2,'idx'],[0x67,"ASR",2,'idx'],[0x68,"ASL",2,'idx'],[0x69,"ROL",2,'idx'],[0x6A,"DEC",2,'idx'],[0x6C,"INC",2,'idx'],[0x6D,"TST",2,'idx'],[0x6E,"JMP",2,'idx'],[0x6F,"CLR",2,'idx'],
[0x6B,"TIM",3,'idx_imm'],[0x7B,"TIM",3,'idx_imm'],
[0x70,"NEG",3,'ext'],[0x73,"COM",3,'ext'],[0x74,"LSR",3,'ext'],[0x76,"ROR",3,'ext'],[0x77,"ASR",3,'ext'],[0x78,"ASL",3,'ext'],[0x79,"ROL",3,'ext'],[0x7A,"DEC",3,'ext'],[0x7C,"INC",3,'ext'],[0x7D,"TST",3,'ext'],[0x7E,"JMP",3,'ext'],[0x7F,"CLR",3,'ext'],
[0x71,"AIM",3,'dir_imm'],[0x61,"AIM",3,'idx_imm'],
[0x72,"OIM",3,'dir_imm'],[0x62,"OIM",3,'idx_imm'],
[0x75,"EIM",3,'dir_imm'],[0x65,"EIM",3,'idx_imm'],
[0x7B,"TIM",3,'dir_imm'],[0x6B,"TIM",3,'idx_imm'],
[0x80,"SUBA",2,'imm'],[0x81,"CMPA",2,'imm'],[0x82,"SBCA",2,'imm'],[0x83,"SUBD",3,'imm16'],[0x84,"ANDA",2,'imm'],[0x85,"BITA",2,'imm'],[0x86,"LDAA",2,'imm'],[0x88,"EORA",2,'imm'],[0x89,"ADCA",2,'imm'],[0x8A,"ORAA",2,'imm'],[0x8B,"ADDA",2,'imm'],[0x8C,"CPX",3,'imm16'],[0x8D,"BSR",2,'rel'],[0x8E,"LDS",3,'imm16'],
[0x90,"SUBA",2,'dir'],[0x91,"CMPA",2,'dir'],[0x92,"SBCA",2,'dir'],[0x93,"SUBD",2,'dir'],[0x94,"ANDA",2,'dir'],[0x95,"BITA",2,'dir'],[0x96,"LDAA",2,'dir'],[0x97,"STAA",2,'dir'],[0x98,"EORA",2,'dir'],[0x99,"ADCA",2,'dir'],[0x9A,"ORAA",2,'dir'],[0x9B,"ADDA",2,'dir'],[0x9C,"CPX",2,'dir'],[0x9D,"JSR",2,'dir'],[0x9E,"LDS",2,'dir'],[0x9F,"STS",2,'dir'],
[0xA0,"SUBA",2,'idx'],[0xA1,"CMPA",2,'idx'],[0xA2,"SBCA",2,'idx'],[0xA3,"SUBD",2,'idx'],[0xA4,"ANDA",2,'idx'],[0xA5,"BITA",2,'idx'],[0xA6,"LDAA",2,'idx'],[0xA7,"STAA",2,'idx'],[0xA8,"EORA",2,'idx'],[0xA9,"ADCA",2,'idx'],[0xAA,"ORAA",2,'idx'],[0xAB,"ADDA",2,'idx'],[0xAC,"CPX",2,'idx'],[0xAD,"JSR",2,'idx'],[0xAE,"LDS",2,'idx'],[0xAF,"STS",2,'idx'],
[0xB0,"SUBA",3,'ext'],[0xB1,"CMPA",3,'ext'],[0xB2,"SBCA",3,'ext'],[0xB3,"SUBD",3,'ext'],[0xB4,"ANDA",3,'ext'],[0xB5,"BITA",3,'ext'],[0xB6,"LDAA",3,'ext'],[0xB7,"STAA",3,'ext'],[0xB8,"EORA",3,'ext'],[0xB9,"ADCA",3,'ext'],[0xBA,"ORAA",3,'ext'],[0xBB,"ADDA",3,'ext'],[0xBC,"CPX",3,'ext'],[0xBD,"JSR",3,'ext'],[0xBE,"LDS",3,'ext'],[0xBF,"STS",3,'ext'],
[0xC0,"SUBB",2,'imm'],[0xC1,"CMPB",2,'imm'],[0xC2,"SBCB",2,'imm'],[0xC3,"ADDD",3,'imm16'],[0xC4,"ANDB",2,'imm'],[0xC5,"BITB",2,'imm'],[0xC6,"LDAB",2,'imm'],[0xC8,"EORB",2,'imm'],[0xC9,"ADCB",2,'imm'],[0xCA,"ORAB",2,'imm'],[0xCB,"ADDB",2,'imm'],[0xCC,"LDD",3,'imm16'],[0xCE,"LDX",3,'imm16'],
[0xD0,"SUBB",2,'dir'],[0xD1,"CMPB",2,'dir'],[0xD2,"SBCB",2,'dir'],[0xD3,"ADDD",2,'dir'],[0xD4,"ANDB",2,'dir'],[0xD5,"BITB",2,'dir'],[0xD6,"LDAB",2,'dir'],[0xD7,"STAB",2,'dir'],[0xD8,"EORB",2,'dir'],[0xD9,"ADCB",2,'dir'],[0xDA,"ORAB",2,'dir'],[0xDB,"ADDB",2,'dir'],[0xDC,"LDD",2,'dir'],[0xDD,"STD",2,'dir'],[0xDE,"LDX",2,'dir'],[0xDF,"STX",2,'dir'],
[0xE0,"SUBB",2,'idx'],[0xE1,"CMPB",2,'idx'],[0xE2,"SBCB",2,'idx'],[0xE3,"ADDD",2,'idx'],[0xE4,"ANDB",2,'idx'],[0xE5,"BITB",2,'idx'],[0xE6,"LDAB",2,'idx'],[0xE7,"STAB",2,'idx'],[0xE8,"EORB",2,'idx'],[0xE9,"ADCB",2,'idx'],[0xEA,"ORAB",2,'idx'],[0xEB,"ADDB",2,'idx'],[0xEC,"LDD",2,'idx'],[0xED,"STD",2,'idx'],[0xEE,"LDX",2,'idx'],[0xEF,"STX",2,'idx'],
[0xF0,"SUBB",3,'ext'],[0xF1,"CMPB",3,'ext'],[0xF2,"SBCB",3,'ext'],[0xF3,"ADDD",3,'ext'],[0xF4,"ANDB",3,'ext'],[0xF5,"BITB",3,'ext'],[0xF6,"LDAB",3,'ext'],[0xF7,"STAB",3,'ext'],[0xF8,"EORB",3,'ext'],[0xF9,"ADCB",3,'ext'],[0xFA,"ORAB",3,'ext'],[0xFB,"ADDB",3,'ext'],[0xFC,"LDD",3,'ext'],[0xFD,"STD",3,'ext'],[0xFE,"LDX",3,'ext'],[0xFF,"STX",3,'ext']
];
ops.forEach(function (o){
map[o[0]]={mnem:o[1],len:o[2],type:o[3]||'none'};
});
return map;
}
};
if(typeof window!=='undefined'){
window.NativeDecoder=NativeDecoder;
}
if(typeof module!=='undefined'&&module.exports){
module.exports=NativeDecoder;
}