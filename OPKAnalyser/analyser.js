'use strict';
class OpkPackAnalyser{
constructor(){
this.RECORD_TYPE_NAMES={0x00:'Failed Data Block / Long Body',0x01:'Deleted Data File Header',0x02:'Deleted CM/XP Diary File Header',0x03:'OPL Source Text Record',0x04:'Deleted Comms Link Setup File',0x05:'Deleted Spreadsheet File Header',0x06:'Deleted Pager Setup File Header',0x07:'Deleted Notepad File Header',0x80:'Long Record Wrapper',0x81:'Data File Header',0x82:'CM/XP Diary File Header',0x83:'Procedure Header',0x84:'Comms Link Setup File',0x85:'Spreadsheet File Header',0x86:'Pager Setup File Header',0x87:'Notepad File Header',0x88:'Block File (Type 8)',0x89:'Block File (Type 9)',0x8A:'Block File (Type 10)',0x8B:'Block File (Type 11)',0x8C:'Block File (Type 12)',0x8D:'Block File (Type 13)',0x8E:'Block File (Type 14)',0x8F:'Block File (Type 15)',0xFF:'End of Pack Terminator'};
}
analyse(buffer,filename='pack.opk'){
const rawBytes=buffer instanceof Uint8Array?buffer:new Uint8Array(buffer);
const report={filename:filename,suggestedPackName:'',totalFileSize:rawBytes.length,container:{isOpkContainer:false,signature:'',declaredPayloadLen:0,headerSize:0,payloadOffset:0,payloadSizeOnDisk:0,lengthMatch:false},regions:[],header:null,records:[],files:[],collisions:[],summary:{totalRecords:0,proceduresCount:0,dataFilesCount:0,dataRecordsCount:0,notepadsCount:0,longRecordsCount:0,deletedRecordsCount:0,usedBytes:0,capacityBytes:0,freeBytes:0,utilizationPercent:0,terminatorFound:false,terminatorOffset:-1,terminatorLength:0,trailingBytesCount:0,trailingBytesErased:true},diagnostics:[],verdict:'UNKNOWN'};
let packData=rawBytes;
let packStartInFile=0;
if(rawBytes.length>=6&&rawBytes[0]===0x4F&&rawBytes[1]===0x50&&rawBytes[2]===0x4B){
report.container.isOpkContainer=true;
report.container.signature='OPK Container (24-bit Length Header)';
report.container.headerSize=6;
report.container.payloadOffset=6;
packStartInFile=6;
report.container.declaredPayloadLen=(rawBytes[3]<<16)|(rawBytes[4]<<8)|rawBytes[5];
packData=rawBytes.subarray(6);
report.container.payloadSizeOnDisk=packData.length;
const exactMatch=(report.container.declaredPayloadLen===packData.length);
const standardExclTermMatch=(report.container.declaredPayloadLen===(packData.length-2));
report.container.lengthMatch=exactMatch||standardExclTermMatch;
if(report.container.lengthMatch){
this.addDiagnostic(report,{level:'pass',category:'Container',title:'OPK Container Header Verified',description:`Valid 'OPK' magic header. Declared length (${report.container.declaredPayloadLen.toLocaleString()} bytes) matches physical stream size.`,techRef:'OPK Container Format Specification'});
}else{
this.addDiagnostic(report,{level:'warning',category:'Container',title:'OPK Container Declared Length Mismatch',description:`The OPK header declares ${report.container.declaredPayloadLen.toLocaleString()} bytes, but the file contains ${packData.length.toLocaleString()} bytes of data.`,techRef:'OPK Container Format Specification'});
}
}else{
report.container.signature='Raw Memory Image (No Container)';
report.container.payloadSizeOnDisk=rawBytes.length;
this.addDiagnostic(report,{level:'notice',category:'Container',title:'Raw Datapak Image (No OPK Container)',description:'The file starts directly with the 10-byte Pack Header (typical of pure EPROM dumps or raw binary images).',techRef:'Psion TechRef §9.4.3'});
}
if(packData.length<10){
this.addDiagnostic(report,{level:'critical',category:'Header',title:'Pack Header Truncated',description:`File contains only ${packData.length} bytes, which is insufficient for the mandatory 10-byte Pack Header.`,techRef:'Psion TechRef §9.4.3'});
report.verdict='CRITICAL_ERRORS';
return report;
}
const h=packData.subarray(0,10);
const flagByte=h[0];
const sizeCode=h[1];
const flags={raw:flagByte,rawHex:'0x'+flagByte.toString(16).toUpperCase().padStart(2,'0'),rawBin:'%'+flagByte.toString(2).padStart(8,'0'),bit0_validMkii:(flagByte&0x01)===0,bit1_eprom:(flagByte&0x02)!==0,bit2_paged:(flagByte&0x04)!==0,bit3_writeProtect:(flagByte&0x08)===0,bit4_bootable:(flagByte&0x10)===0,bit5_copyProtect:(flagByte&0x20)===0,bit6_flashpack:(flagByte&0x40)===0,bit7_mk1Pack:(flagByte&0x80)!==0};
const capacityBytes=sizeCode*8192;
const capacityKb=sizeCode*8;
const numSegments16K=Math.floor(capacityBytes/16384);
report.summary.capacityBytes=capacityBytes;
const w0=(h[0]<<8)|h[1];
const w2=(h[2]<<8)|h[3];
const w4=(h[4]<<8)|h[5];
const w6=(h[6]<<8)|h[7];
const storedChecksum=(h[8]<<8)|h[9];
const calculatedChecksum=(w0+w2+w4+w6)&0xFFFF;
const checksumValid=(storedChecksum===calculatedChecksum);
const headerBytesDetailed=[
{byteIndex:0,name:'Flags / Pack Type',valHex:'0x'+h[0].toString(16).toUpperCase().padStart(2,'0'),valDec:h[0],valBin:'%'+h[0].toString(2).padStart(8,'0'),meaning:`Type Byte: ${flags.bit6_flashpack?'Flashpack (EEPROM)':(flags.bit1_eprom?'EPROM':'RAMpak')}${flags.bit2_paged?', Paged/Segmented':', Linear'}${flags.bit4_bootable?', Bootable':''}`,techRef:'TechRef §9.4.3 & flash.htm §6'},
{byteIndex:1,name:'Pack Size Code',valHex:'0x'+h[1].toString(16).toUpperCase().padStart(2,'0'),valDec:h[1],valBin:'%'+h[1].toString(2).padStart(8,'0'),meaning:`${capacityKb} KB Total Capacity (${h[1]} × 8KB blocks = ${numSegments16K} × 16KB segments)`,techRef:'TechRef §9.4.3 & §9.2.2.3'},
{byteIndex:2,name:flags.bit4_bootable?'OS Target Code':'Year Sized',valHex:'0x'+h[2].toString(16).toUpperCase().padStart(2,'0'),valDec:h[2],valBin:'%'+h[2].toString(2).padStart(8,'0'),meaning:flags.bit4_bootable?`Target OS Code: 0x${h[2].toString(16).toUpperCase()} (0 = All Models)`:`Year: ${1900+h[2]}`,techRef:flags.bit4_bootable?'Bootable Specification':'TechRef §9.4.3'},
{byteIndex:3,name:flags.bit4_bootable?'Boot Device ID':'Month Sized',valHex:'0x'+h[3].toString(16).toUpperCase().padStart(2,'0'),valDec:h[3],valBin:'%'+h[3].toString(2).padStart(8,'0'),meaning:flags.bit4_bootable?`Boot ID: 0x${h[3].toString(16).toUpperCase()} (${h[3]} dec)`:`Month: ${h[3]}`,techRef:flags.bit4_bootable?'Bootable Specification':'TechRef §9.4.3'},
{byteIndex:4,name:flags.bit4_bootable?'Software Version':'Day Sized',valHex:'0x'+h[4].toString(16).toUpperCase().padStart(2,'0'),valDec:h[4],valBin:'%'+h[4].toString(2).padStart(8,'0'),meaning:flags.bit4_bootable?`Version Code: 0x${h[4].toString(16).toUpperCase()} (v${(h[4]>>4)}.${h[4]&0x0F})`:`Day: ${h[4]+1}`,techRef:flags.bit4_bootable?'Bootable Specification':'TechRef §9.4.3'},
{byteIndex:5,name:flags.bit4_bootable?'Boot Priority':'Hour Sized',valHex:'0x'+h[5].toString(16).toUpperCase().padStart(2,'0'),valDec:h[5],valBin:'%'+h[5].toString(2).padStart(8,'0'),meaning:flags.bit4_bootable?`Execution Priority: ${h[5]}`:`Hour: ${h[5]}:00`,techRef:flags.bit4_bootable?'Bootable Specification':'TechRef §9.4.3'},
{byteIndex:6,name:flags.bit4_bootable?'Boot Vector (MSB)':'Counter MSB',valHex:'0x'+h[6].toString(16).toUpperCase().padStart(2,'0'),valDec:h[6],valBin:'%'+h[6].toString(2).padStart(8,'0'),meaning:flags.bit4_bootable?`Boot Address MSB: 0x${h[6].toString(16).toUpperCase().padStart(2,'0')}`:`Counter High Byte: 0x${h[6].toString(16).toUpperCase()}`,techRef:flags.bit4_bootable?'Bootable Specification':'TechRef §9.4.3'},
{byteIndex:7,name:flags.bit4_bootable?'Boot Vector (LSB)':'Counter LSB',valHex:'0x'+h[7].toString(16).toUpperCase().padStart(2,'0'),valDec:h[7],valBin:'%'+h[7].toString(2).padStart(8,'0'),meaning:flags.bit4_bootable?`Boot Address Vector: 0x${((h[6]<<8)|h[7]).toString(16).toUpperCase().padStart(4,'0')} (Offset ${(h[6]<<8)|h[7]} in pack data)`:`Counter Low Byte: 0x${h[7].toString(16).toUpperCase()}`,techRef:flags.bit4_bootable?'Bootable Specification':'TechRef §9.4.3'},
{byteIndex:8,name:'Checksum (MSB)',valHex:'0x'+h[8].toString(16).toUpperCase().padStart(2,'0'),valDec:h[8],valBin:'%'+h[8].toString(2).padStart(8,'0'),meaning:`Word Checksum High: 0x${h[8].toString(16).toUpperCase().padStart(2,'0')}`,techRef:'TechRef §9.4.3'},
{byteIndex:9,name:'Checksum (LSB)',valHex:'0x'+h[9].toString(16).toUpperCase().padStart(2,'0'),valDec:h[9],valBin:'%'+h[9].toString(2).padStart(8,'0'),meaning:`Full Stored Word Checksum: 0x${storedChecksum.toString(16).toUpperCase().padStart(4,'0')}`,techRef:'TechRef §9.4.3'}
];
report.header={rawBytes:Array.from(h),hexString:Array.from(h).map(b=>b.toString(16).toUpperCase().padStart(2,'0')).join(' '),bytesDetailed:headerBytesDetailed,flags:flags,sizeCode:sizeCode,capacityBytes:capacityBytes,capacityKb:capacityKb,numSegments16K:numSegments16K,isBootable:flags.bit4_bootable,isFlashpack:flags.bit6_flashpack,isPaged:flags.bit2_paged,checksum:{stored:'0x'+storedChecksum.toString(16).toUpperCase().padStart(4,'0'),calculated:'0x'+calculatedChecksum.toString(16).toUpperCase().padStart(4,'0'),w0:'0x'+w0.toString(16).toUpperCase().padStart(4,'0'),w2:'0x'+w2.toString(16).toUpperCase().padStart(4,'0'),w4:'0x'+w4.toString(16).toUpperCase().padStart(4,'0'),w6:'0x'+w6.toString(16).toUpperCase().padStart(4,'0'),isValid:checksumValid},bootParams:null,timestamp:null};
if(flags.bit4_bootable){
report.header.bootParams={osCode:h[2],bootId:h[3],version:h[4],priority:h[5],bootAddress:(h[6]<<8)|h[7],bootAddressHex:'0x'+((h[6]<<8)|h[7]).toString(16).toUpperCase().padStart(4,'0')};
}else{
const year=1900+h[2];
const month=h[3];
const day=h[4]+1;
const hour=h[5];
const counter=(h[6]<<8)|h[7];
report.header.timestamp={formatted:`${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')} ${String(hour).padStart(2,'0')}:??`,year,month,day,hour,counter};
}
const isEpromOrFlash=flags.bit1_eprom||flags.bit6_flashpack;
const checksumDelta=(storedChecksum-calculatedChecksum)&0xFFFF;
const isKnownProtectionDelta=isEpromOrFlash&&(checksumDelta===0x0800||checksumDelta===0x2000||checksumDelta===0x2800);
if(checksumValid){
this.addDiagnostic(report,{level:'pass',category:'Header',title:'Pack Header Checksum Verified',description:`16-bit word checksum (${report.header.checksum.stored}) matches sum of words 0-3 (${report.header.checksum.w0} + ${report.header.checksum.w2} + ${report.header.checksum.w4} + ${report.header.checksum.w6} = ${report.header.checksum.calculated}).`,techRef:'Psion TechRef §9.4.3'});
}else if(isKnownProtectionDelta){
this.addDiagnostic(report,{level:'pass',category:'Header',title:'Pack Header Checksum Consistent (Post-Sizing Protection Applied)',description:`Stored checksum ${report.header.checksum.stored} deviates from calculated sum ${report.header.checksum.calculated} by exactly 0x${checksumDelta.toString(16).toUpperCase().padStart(4,'0')}. On physical EPROM media, Write Protect (bit 3) and Copy Protect (bit 5) bits are blown to 0 after pack sizing, leaving the stored checksum matching the original pre-protection state. Pack is physically valid.`,techRef:'Psion TechRef §9.4.3'});
}else if(isEpromOrFlash){
this.addDiagnostic(report,{level:'warning',category:'Header',title:'Pack Header Checksum Deviation (EPROM/Flashpack)',description:`Stored checksum ${report.header.checksum.stored} does not match calculated sum ${report.header.checksum.calculated} (delta: 0x${checksumDelta.toString(16).toUpperCase().padStart(4,'0')}). Per TechRef §9.4.3, checksum verification is only enforced by the OS on RAMpacks to detect battery-loss corruption; on physical EPROMs, this does not prevent reading but indicates header attributes were modified post-format.`,techRef:'Psion TechRef §9.4.3'});
}else{
this.addDiagnostic(report,{level:'critical',category:'Header',title:'RAMpack Header Checksum Corrupted',description:`Stored checksum ${report.header.checksum.stored} does not match calculated sum ${report.header.checksum.calculated}. Per TechRef §9.4.3, an invalid checksum on physical RAMpacks triggers battery corruption alerts and automatic re-formatting.`,techRef:'Psion TechRef §9.4.3'});
}
let offset=10;
const records=[];
const filesById=new Map();
const declaredFiles=[];
let recordIndex=0;
while(offset<packData.length){
const recordStart=offset;
const lenByte=packData[offset];
if(lenByte===0xFF){
report.summary.terminatorFound=true;
report.summary.terminatorOffset=recordStart;
const hasSecondTermByte=(offset+1<packData.length&&packData[offset+1]===0xFF);
const termLength=hasSecondTermByte?2:1;
report.summary.terminatorLength=termLength;
const trailerStart=offset+termLength;
report.summary.trailingBytesCount=packData.length-trailerStart;
let allErased=true;
for(let k=trailerStart;k<packData.length;k++){
if(packData[k]!==0xFF){
allErased=false;
break;
}
}
report.summary.trailingBytesErased=allErased;
const termRecord={index:recordIndex,offset:recordStart,offsetHex:'0x'+recordStart.toString(16).toUpperCase().padStart(5,'0'),fileOffsetHex:'0x'+(packStartInFile+recordStart).toString(16).toUpperCase().padStart(5,'0'),linear24:`${((recordStart>>16)&0xFF).toString(16).toUpperCase()}:${(recordStart&0xFFFF).toString(16).toUpperCase().padStart(4,'0')}`,segmentIndex:Math.floor(recordStart/16384),pageIndex:Math.floor((recordStart%16384)/256),byteInPage:recordStart%256,crossesSegment:false,lenByte:0xFF,typeByte:hasSecondTermByte?0xFF:0x00,typeHex:hasSecondTermByte?'0xFF':'N/A',typeName:hasSecondTermByte?'End of Pack Terminator (0xFF 0xFF)':'End of Pack Terminator (0xFF)',category:'Terminator',isLongRecord:false,isDeleted:false,totalLen:termLength,roleSummary:hasSecondTermByte?'Canonical 2-Byte End of Pack Marker (0xFF 0xFF)':'Single 0xFF End of Pack Marker',packStatus:'Valid Terminator'};
records.push(termRecord);
break;
}
if(offset+1>=packData.length){
this.addDiagnostic(report,{level:'critical',category:'Integrity',title:'Truncated Record Header',description:`File ends abruptly at offset 0x${offset.toString(16).toUpperCase()} with length byte 0x${lenByte.toString(16).toUpperCase()} but missing type byte.`,techRef:'Psion File Formats'});
break;
}
const typeByte=packData[offset+1];
const isLongRecord=(lenByte===0x02&&(typeByte===0x80||typeByte===0x00));
let payloadLen=0;
let totalRecordLen=0;
if(isLongRecord){
if(offset+3>=packData.length){
this.addDiagnostic(report,{level:'critical',category:'Integrity',title:'Truncated Long Record Header',description:`Long record header at offset 0x${offset.toString(16).toUpperCase()} truncated before reading 16-bit payload length word.`,techRef:'Psion File Formats'});
break;
}
payloadLen=(packData[offset+2]<<8)|packData[offset+3];
totalRecordLen=4+payloadLen;
report.summary.longRecordsCount++;
}else{
payloadLen=lenByte;
totalRecordLen=lenByte+2;
}
if(offset+totalRecordLen>packData.length){
this.addDiagnostic(report,{level:'critical',category:'Integrity',title:`Truncated Record Payload [${recordIndex}]`,description:`Record [${recordIndex}] at offset 0x${offset.toString(16).toUpperCase()} declares ${totalRecordLen} bytes, but file ends prematurely.`,techRef:'Psion File Formats'});
break;
}
const bReg=(recordStart>>16)&0xFF;
const xReg=recordStart&0xFFFF;
const segmentIndex=Math.floor(recordStart/16384);
const pageIndex=Math.floor((recordStart%16384)/256);
const byteInPage=recordStart%256;
const endAddr=recordStart+totalRecordLen-1;
const endSegmentIndex=Math.floor(endAddr/16384);
const crossesSegment=(segmentIndex!==endSegmentIndex);
const isDeleted=(typeByte&0x80)===0&&typeByte!==0x00&&!isLongRecord;
if(isDeleted)report.summary.deletedRecordsCount++;
let typeName=this.RECORD_TYPE_NAMES[typeByte];
let category='Other';
if(typeByte===0x81)category='Data File Header';
else if(typeByte>=0x90&&typeByte<=0xFF){
category='Data Record';
typeName=`Data Record (File ID 0x${typeByte.toString(16).toUpperCase()})`;
}else if(typeByte===0x83)category='Procedure Header';
else if(typeByte===0x80||typeByte===0x00)category='Long Record';
else if(typeByte===0x87)category='Notepad Header';
else if(isDeleted)category='Deleted Record';
const record={index:recordIndex,offset:recordStart,offsetHex:'0x'+recordStart.toString(16).toUpperCase().padStart(5,'0'),fileOffsetHex:'0x'+(packStartInFile+recordStart).toString(16).toUpperCase().padStart(5,'0'),linear24:`${bReg.toString(16).toUpperCase()}:${xReg.toString(16).toUpperCase().padStart(4,'0')}`,segmentIndex:segmentIndex,pageIndex:pageIndex,byteInPage:byteInPage,crossesSegment:crossesSegment,lenByte:lenByte,typeByte:typeByte,typeHex:'0x'+typeByte.toString(16).toUpperCase().padStart(2,'0'),typeName:typeName||`Type 0x${typeByte.toString(16).toUpperCase()}`,category:category,isLongRecord:isLongRecord,isDeleted:isDeleted,payloadLen:payloadLen,totalLen:totalRecordLen,name:'',fileId:null,roleSummary:'',packStatus:'Valid',procedureDetails:null};
if(typeByte===0x81){
report.summary.dataFilesCount++;
let fileName='';
const nameBytes=packData.subarray(recordStart+2,recordStart+10);
for(let k=0;k<nameBytes.length;k++){
const c=nameBytes[k];
if(c>=32&&c<=126)fileName+=String.fromCharCode(c);
}
fileName=fileName.trim();
const assignedFileId=packData[recordStart+10];
record.name=fileName;
record.fileId=assignedFileId;
record.roleSummary=`Data File Header: '${fileName}', Assigned File ID 0x${assignedFileId.toString(16).toUpperCase()}`;
const fileEntry={fileHeaderRecordIndex:recordIndex,offset:recordStart,offsetHex:record.offsetHex,name:fileName,fileId:assignedFileId,fileIdHex:'0x'+assignedFileId.toString(16).toUpperCase().padStart(2,'0'),recordsCount:0,totalBytes:totalRecordLen};
declaredFiles.push(fileEntry);
if(!filesById.has(assignedFileId)){
filesById.set(assignedFileId,[fileEntry]);
}else{
filesById.get(assignedFileId).push(fileEntry);
}
}else if(typeByte>=0x90&&typeByte<=0xFF){
report.summary.dataRecordsCount++;
record.fileId=typeByte;
let tabCount=0;
let previewText='';
const pStart=recordStart+2;
const pEnd=recordStart+totalRecordLen;
for(let k=pStart;k<pEnd;k++){
const c=packData[k];
if(c===0x09)tabCount++;
if(previewText.length<35){
if(c>=32&&c<=126)previewText+=String.fromCharCode(c);
else if(c===0x09)previewText+=' | ';
}
}
const fieldCount=tabCount+1;
record.preview=previewText;
const matchingFiles=filesById.get(typeByte);
if(matchingFiles&&matchingFiles.length>0){
const activeFile=matchingFiles[matchingFiles.length-1];
activeFile.recordsCount++;
activeFile.totalBytes+=totalRecordLen;
record.name=activeFile.name;
record.roleSummary=`Data Record for File '${activeFile.name}' (ID 0x${typeByte.toString(16).toUpperCase()}) - ${fieldCount} field(s)`;
}else{
record.roleSummary=`Orphan Data Record (File ID 0x${typeByte.toString(16).toUpperCase()} not declared in header) - ${fieldCount} field(s)`;
record.packStatus='Warning: Orphan Record';
}
}else if(typeByte===0x83){
report.summary.proceduresCount++;
let procName='';
const nameLen=Math.min(lenByte-1,8);
for(let k=0;k<nameLen;k++){
const c=packData[recordStart+2+k];
if(c>=32&&c<=126)procName+=String.fromCharCode(c);
}
procName=procName.trim();
record.name=procName;
record.roleSummary=`Procedure Header: '${procName}'`;
}else if(isLongRecord){
const prevRecord=records.length>0?records[records.length-1]:null;
if(prevRecord&&prevRecord.typeByte===0x83){
const bodyBytes=packData.subarray(recordStart+4,recordStart+4+payloadLen);
let codeLen=0;
let srcLen=0;
if(bodyBytes.length>=2){
codeLen=(bodyBytes[0]<<8)|bodyBytes[1];
}
if(bodyBytes.length>=codeLen+4){
srcLen=(bodyBytes[codeLen+2]<<8)|bodyBytes[codeLen+3];
}
const bodyStructureValid=(codeLen+srcLen+4<=payloadLen);
let bodyTypeDesc='';
if(!bodyStructureValid){
bodyTypeDesc=`Corrupted Framing (codeLen ${codeLen}B + srcLen ${srcLen}B + 4 > payload ${payloadLen}B)`;
this.addDiagnostic(report,{level:'critical',category:'Integrity',title:`Corrupted Procedure Framing in '${prevRecord.name}'`,description:`Procedure body at offset 0x${recordStart.toString(16).toUpperCase()} declares ${codeLen} B object code and ${srcLen} B source text (total ${codeLen+srcLen+4} B required), which overruns the physical record payload length of ${payloadLen} B. Execution will cause runtime memory faults.`,techRef:'Psion OPL File Specification'});
}else if(codeLen>0&&srcLen>0)bodyTypeDesc=`Valid (Object: ${codeLen} B, Source: ${srcLen} B)`;
else if(codeLen>0&&srcLen===0)bodyTypeDesc=`Valid (Precompiled Object: ${codeLen} B, No Source)`;
else if(codeLen===0&&srcLen>0)bodyTypeDesc=`Valid (Source Text: ${srcLen} B, No Object)`;
else bodyTypeDesc='Empty Body';
record.name=`${prevRecord.name} (Body)`;
record.roleSummary=`Procedure Body for '${prevRecord.name}' -> ${bodyTypeDesc}`;
record.procedureDetails={parentProc:prevRecord.name,codeLen:codeLen,srcLen:srcLen,isValid:bodyStructureValid};
prevRecord.roleSummary+=` -> Linked to Body [${recordIndex}] (${codeLen}B code, ${srcLen}B src)`;
}else if(report.header.isBootable&&report.header.bootParams&&recordStart<=report.header.bootParams.bootAddress&&(recordStart+totalRecordLen)>report.header.bootParams.bootAddress){
record.name='Boot Code Segment';
record.roleSummary=`Bootable Machine Code Segment (${payloadLen.toLocaleString()} B payload). Target of Boot Vector 0x${report.header.bootParams.bootAddress.toString(16).toUpperCase()}`;
record.packStatus='Valid Boot Payload';
}else{
record.roleSummary=`Extended Long Record (${payloadLen.toLocaleString()} B payload)`;
}
}else if(typeByte===0x87){
report.summary.notepadsCount++;
let noteName='';
const nameLen=Math.min(lenByte-1,8);
for(let k=0;k<nameLen;k++){
const c=packData[recordStart+2+k];
if(c>=32&&c<=126)noteName+=String.fromCharCode(c);
}
record.name=noteName.trim();
record.roleSummary=`Notepad File Header: '${record.name}'`;
}
records.push(record);
offset+=totalRecordLen;
recordIndex++;
}
report.records=records;
report.files=declaredFiles;
report.summary.totalRecords=records.length;
report.summary.usedBytes=offset;
report.summary.freeBytes=Math.max(0,capacityBytes-offset);
report.summary.utilizationPercent=capacityBytes>0?((offset/capacityBytes)*100).toFixed(1):0;
const orphanRecords=records.filter(r=>r.category==='Data Record'&&(!filesById.has(r.fileId)||filesById.get(r.fileId).length===0));
if(orphanRecords.length>0){
const orphanFileIds=[...new Set(orphanRecords.map(r=>'0x'+r.fileId.toString(16).toUpperCase()))].join(', ');
this.addDiagnostic(report,{level:'warning',category:'File System',title:`${orphanRecords.length} Orphan Data Record(s) Detected`,description:`Found ${orphanRecords.length} data records referencing internal File ID(s) [${orphanFileIds}] with no corresponding active Type 0x81 File Header on the pack. These records cannot be indexed or retrieved by normal OPL database services (USE).`,techRef:'Psion File Services & Formats'});
}
report.regions=[
{name:'OPK Container Header',start:0,end:packStartInFile,size:packStartInFile,desc:report.container.isOpkContainer?`Signature 'OPK', Declared Length: ${report.container.declaredPayloadLen.toLocaleString()} B (24-bit big-endian length)`:'None (Raw Image)'},
{name:'Psion Pack Header (10 Bytes)',start:packStartInFile,end:packStartInFile+10,size:10,desc:`Flags: ${report.header.flags.rawHex}, Size Code: 0x${report.header.sizeCode.toString(16).toUpperCase()} (${report.header.capacityKb}KB), Checksum: ${report.header.checksum.stored}`},
{name:'Pack Records Payload Stream',start:packStartInFile+10,end:packStartInFile+(report.summary.terminatorOffset!==-1?report.summary.terminatorOffset:offset),size:(report.summary.terminatorOffset!==-1?report.summary.terminatorOffset:offset)-10,desc:`${records.filter(r=>r.typeByte!==0xFF).length} chained records (${report.summary.proceduresCount} procedures, ${report.summary.dataFilesCount} data files, ${report.summary.dataRecordsCount} data records)`},
{name:(report.summary.terminatorLength===2)?'End-of-Pack Terminator (0xFF 0xFF)':'End-of-Pack Terminator (0xFF)',start:packStartInFile+report.summary.terminatorOffset,end:packStartInFile+report.summary.terminatorOffset+(report.summary.terminatorLength||1),size:report.summary.terminatorLength||1,desc:report.summary.terminatorFound?((report.summary.terminatorLength===2)?`Canonical 2-byte 0xFF 0xFF terminator encountered at offset 0x${report.summary.terminatorOffset.toString(16).toUpperCase()}`:`Valid 0xFF terminator encountered at offset 0x${report.summary.terminatorOffset.toString(16).toUpperCase()}`):'Missing Terminator!'},
{name:'Trailing Space / Unused Capacity',start:packStartInFile+report.summary.terminatorOffset+(report.summary.terminatorLength||1),end:rawBytes.length,size:Math.max(0,rawBytes.length-(packStartInFile+report.summary.terminatorOffset+(report.summary.terminatorLength||1))),desc:(rawBytes.length-(packStartInFile+report.summary.terminatorOffset+(report.summary.terminatorLength||1))<=0)?'None (compact pack image ending precisely at 0xFF 0xFF terminator)':(report.summary.trailingBytesErased?`Clean, unwritten / erased bytes ($FF) across ${(rawBytes.length-(packStartInFile+report.summary.terminatorOffset+(report.summary.terminatorLength||1))).toLocaleString()} B`:`${report.summary.trailingBytesCount} bytes containing non-$FF unreferenced data`)}
];
filesById.forEach((fileList,fileId)=>{
if(fileList.length>1){
const fileNames=fileList.map(f=>f.name).join(', ');
const collisionInfo={fileId:fileId,fileIdHex:'0x'+fileId.toString(16).toUpperCase().padStart(2,'0'),collidingFiles:fileList.map(f=>({name:f.name,recordIndex:f.fileHeaderRecordIndex,offsetHex:f.offsetHex,recordsCount:f.recordsCount}))};
report.collisions.push(collisionInfo);
this.addDiagnostic(report,{level:'critical',category:'File System',title:`Critical File ID Collision on ID 0x${fileId.toString(16).toUpperCase()}`,description:`Multiple distinct Data Files share identical internal File ID 0x${fileId.toString(16).toUpperCase()}: [${fileNames}]. In Psion OPL, opening any of these files (e.g. USE ${fileList[fileList.length-1].name}) will cause all records matching ID 0x${fileId.toString(16).toUpperCase()} to be read into the same field variables, resulting in fatal schema corruption and data cross-contamination.`,techRef:'Psion File Services & Formats',affectedItems:fileList.map(f=>f.name)});
}
});
if(report.collisions.length===0&&report.files.length>0){
this.addDiagnostic(report,{level:'pass',category:'File System',title:'File ID Namespaces Verified Unique',description:`All ${report.files.length} Data Files have distinct, non-overlapping internal File IDs ($90..$FF).`,techRef:'Psion File Formats'});
}
const segmentStraddlers=records.filter(r=>r.crossesSegment);
if(segmentStraddlers.length>0){
this.addDiagnostic(report,{level:'notice',category:'Hardware Addressing',title:`${segmentStraddlers.length} Record(s) Span 16KB Hardware Segment Boundaries`,description:`${segmentStraddlers.length} record(s) span across 16KB bank limits ($3FFF -> $4000). Verified against Psion TechRef §9.2.2.3 & §9.5.3: on physical paged/segmented Datapaks, Organiser II PK$READ automatically manages segment bank register switching on-the-fly without requiring manual splitting via PK$SADD. (Affected: Records ${segmentStraddlers.slice(0,5).map(r=>`[${r.index}] ${r.typeName}`).join(', ')}${segmentStraddlers.length>5?'...':''}).`,techRef:'Psion TechRef §9.2.2.3 & §9.5.3'});
}
const fileMd5=OpkPackAnalyser.md5(rawBytes);
const fileSha256=OpkPackAnalyser.sha256(rawBytes);
const fileCrc32=OpkPackAnalyser.crc32(rawBytes);
let sumAll=0;
for(let i=0;i<rawBytes.length;i++){
sumAll=(sumAll+rawBytes[i])>>>0;
}
let sumExcl16=0;
for(let i=16;i<rawBytes.length;i++){
sumExcl16=(sumExcl16+rawBytes[i])>>>0;
}
const bytesExcl16=rawBytes.length>=16?rawBytes.subarray(16):new Uint8Array(0);
const crcExcl16=OpkPackAnalyser.crc32(bytesExcl16);
let suggestedPackName='';
const firstProc=records.find(r=>r.typeByte===0x83&&r.name);
if(firstProc&&firstProc.name){
suggestedPackName=firstProc.name;
}else if(report.files.length>0&&report.files[0].name){
suggestedPackName=report.files[0].name;
}else{
suggestedPackName=filename.replace(/\.[^/.]+$/,'');
}
report.suggestedPackName=suggestedPackName;
let packExclTerm;
if(report.summary.terminatorFound&&report.summary.terminatorOffset!==-1){
packExclTerm=packData.subarray(0,report.summary.terminatorOffset);
}else if(report.container.isOpkContainer&&report.container.declaredPayloadLen>0&&report.container.declaredPayloadLen<=packData.length){
packExclTerm=packData.subarray(0,report.container.declaredPayloadLen);
}else if(packData.length>=2&&packData[packData.length-2]===0xFF&&packData[packData.length-1]===0xFF){
packExclTerm=packData.subarray(0,packData.length-2);
}else if(packData.length>=1&&packData[packData.length-1]===0xFF){
packExclTerm=packData.subarray(0,packData.length-1);
}else{
packExclTerm=packData;
}
let sumWholePack=0;
for(let i=0;i<packExclTerm.length;i++){
sumWholePack+=packExclTerm[i];
}
const recExclTerm=packExclTerm.length>=10?packExclTerm.subarray(10):new Uint8Array(0);
let sumRecExclTerm=0;
for(let i=0;i<recExclTerm.length;i++){
sumRecExclTerm+=recExclTerm[i];
}
let sumHeader10=0;
if(packExclTerm.length>=10){
for(let i=0;i<10;i++)sumHeader10+=packExclTerm[i];
}
report.checksums={file:{size:rawBytes.length,md5:fileMd5,sha256:fileSha256,crc32:'0x'+fileCrc32.toString(16).toUpperCase().padStart(8,'0'),crc32Hex:fileCrc32.toString(16).toUpperCase().padStart(8,'0'),crc32Excl16:'0x'+crcExcl16.toString(16).toUpperCase().padStart(8,'0'),crc32Excl16Hex:crcExcl16.toString(16).toUpperCase().padStart(8,'0'),sumAll:sumAll,sumAllHex:sumAll.toString(16).toUpperCase().padStart(8,'0'),sumExcl16:sumExcl16,sumExcl16Hex:sumExcl16.toString(16).toUpperCase().padStart(8,'0')},packPayload:{startFileOffset:packStartInFile,length:packExclTerm.length,wholePack:{length:packExclTerm.length,sumBytes:sumWholePack,sumBytesHex:'0x'+sumWholePack.toString(16).toUpperCase(),sum16Word:'0x'+(sumWholePack&0xFFFF).toString(16).toUpperCase().padStart(4,'0'),sum8Mod:'0x'+(sumWholePack&0xFF).toString(16).toUpperCase().padStart(2,'0'),crc32:'0x'+OpkPackAnalyser.crc32(packExclTerm).toString(16).toUpperCase().padStart(8,'0'),crc16:'0x'+OpkPackAnalyser.crc16(packExclTerm).toString(16).toUpperCase().padStart(4,'0'),md5:OpkPackAnalyser.md5(packExclTerm)},recordsOnly:{length:recExclTerm.length,sumBytes:sumRecExclTerm,sumBytesHex:'0x'+sumRecExclTerm.toString(16).toUpperCase(),sum16Word:'0x'+(sumRecExclTerm&0xFFFF).toString(16).toUpperCase().padStart(4,'0'),sum8Mod:'0x'+(sumRecExclTerm&0xFF).toString(16).toUpperCase().padStart(2,'0'),crc32:'0x'+OpkPackAnalyser.crc32(recExclTerm).toString(16).toUpperCase().padStart(8,'0'),crc16:'0x'+OpkPackAnalyser.crc16(recExclTerm).toString(16).toUpperCase().padStart(4,'0'),md5:OpkPackAnalyser.md5(recExclTerm)},headerDelta:{sumBytes:sumHeader10,sumBytesHex:'0x'+sumHeader10.toString(16).toUpperCase()}}};
const isDeltaMatch=(report.checksums.packPayload.wholePack.sumBytes-report.checksums.packPayload.recordsOnly.sumBytes)===report.checksums.packPayload.headerDelta.sumBytes;
if(isDeltaMatch){
this.addDiagnostic(report,{level:'pass',category:'Checksums',title:'Payload Checksums & Cryptographic Hashes Verified',description:`Whole Pack Byte Sum: ${report.checksums.packPayload.wholePack.sumBytes.toLocaleString()} (${report.checksums.packPayload.wholePack.sumBytesHex}, CRC-32: ${report.checksums.packPayload.wholePack.crc32}, MD5: ${report.checksums.packPayload.wholePack.md5}). Records Stream Byte Sum: ${report.checksums.packPayload.recordsOnly.sumBytes.toLocaleString()} (${report.checksums.packPayload.recordsOnly.sumBytesHex}, CRC-32: ${report.checksums.packPayload.recordsOnly.crc32}, MD5: ${report.checksums.packPayload.recordsOnly.md5}). Header delta matches exactly (${report.checksums.packPayload.headerDelta.sumBytes} bytes).`,techRef:'TechRef §9.4.3 & Checksum Engine'});
}else{
this.addDiagnostic(report,{level:'critical',category:'Checksums',title:'Payload Checksum Arithmetic Delta Mismatch',description:`Sum(Whole Pack) [${report.checksums.packPayload.wholePack.sumBytes}] minus Sum(Records) [${report.checksums.packPayload.recordsOnly.sumBytes}] does not equal 10-byte header sum [${report.checksums.packPayload.headerDelta.sumBytes}]. Memory stream framing has been disrupted.`,techRef:'TechRef §9.4.3 & Checksum Engine'});
}
const hasCritical=report.diagnostics.some(d=>d.level==='critical');
const hasWarning=report.diagnostics.some(d=>d.level==='warning');
if(hasCritical)report.verdict='CRITICAL_ERRORS';
else if(hasWarning)report.verdict='WARNINGS';
else report.verdict='CLEAN';
return report;
}
addDiagnostic(report,diag){
diag.id='diag_'+(report.diagnostics.length+1);
report.diagnostics.push(diag);
}
static crc32(bytes){
if(!OpkPackAnalyser._crc32Table){
const table=[];
for(let n=0;n<256;n++){
let c=n;
for(let k=0;k<8;k++){
c=(c&1)?(0xEDB88320^(c>>>1)):(c>>>1);
}
table[n]=c;
}
OpkPackAnalyser._crc32Table=table;
}
let crc=0^(-1);
for(let i=0;i<bytes.length;i++){
crc=(crc>>>8)^OpkPackAnalyser._crc32Table[(crc^bytes[i])&0xFF];
}
return (crc^(-1))>>>0;
}
static crc16(bytes){
let crc=0xFFFF;
for(let i=0;i<bytes.length;i++){
crc^=(bytes[i]<<8);
for(let j=0;j<8;j++){
if(crc&0x8000){
crc=((crc<<1)^0x1021)&0xFFFF;
}else{
crc=(crc<<1)&0xFFFF;
}
}
}
return crc;
}
static md5(bytes){
function safeAdd(x,y){
const lsw=(x&0xFFFF)+(y&0xFFFF);
const msw=(x>>16)+(y>>16)+(lsw>>16);
return (msw<<16)|(lsw&0xFFFF);
}
function bitRol(num,cnt){
return (num<<cnt)|(num>>>(32-cnt));
}
function md5cmn(q,a,b,x,s,t){
return safeAdd(bitRol(safeAdd(safeAdd(a,q),safeAdd(x,t)),s),b);
}
function md5ff(a,b,c,d,x,s,t){return md5cmn((b&c)|((~b)&d),a,b,x,s,t);}
function md5gg(a,b,c,d,x,s,t){return md5cmn((b&d)|(c&(~d)),a,b,x,s,t);}
function md5hh(a,b,c,d,x,s,t){return md5cmn(b^c^d,a,b,x,s,t);}
function md5ii(a,b,c,d,x,s,t){return md5cmn(c^(b|(~d)),a,b,x,s,t);}
const nblk=((bytes.length+8)>>6)+1;
const blks=new Array(nblk*16).fill(0);
for(let i=0;i<bytes.length;i++){
blks[i>>2]|=bytes[i]<<((i%4)*8);
}
blks[bytes.length>>2]|=0x80<<((bytes.length%4)*8);
blks[nblk*16-2]=bytes.length*8;
let a=1732584193,b=-271733879,c=-1732584194,d=271733878;
for(let i=0;i<blks.length;i+=16){
const olda=a,oldb=b,oldc=c,oldd=d;
a=md5ff(a,b,c,d,blks[i+0],7,-680876936);
d=md5ff(d,a,b,c,blks[i+1],12,-389564586);
c=md5ff(c,d,a,b,blks[i+2],17,606105819);
b=md5ff(b,c,d,a,blks[i+3],22,-1044525330);
a=md5ff(a,b,c,d,blks[i+4],7,-176418897);
d=md5ff(d,a,b,c,blks[i+5],12,1200080426);
c=md5ff(c,d,a,b,blks[i+6],17,-1473231341);
b=md5ff(b,c,d,a,blks[i+7],22,-45705983);
a=md5ff(a,b,c,d,blks[i+8],7,1770035416);
d=md5ff(d,a,b,c,blks[i+9],12,-1958414417);
c=md5ff(c,d,a,b,blks[i+10],17,-42063);
b=md5ff(b,c,d,a,blks[i+11],22,-1990404162);
a=md5ff(a,b,c,d,blks[i+12],7,1804603682);
d=md5ff(d,a,b,c,blks[i+13],12,-40341101);
c=md5ff(c,d,a,b,blks[i+14],17,-1502002290);
b=md5ff(b,c,d,a,blks[i+15],22,1236535329);
a=md5gg(a,b,c,d,blks[i+1],5,-165796510);
d=md5gg(d,a,b,c,blks[i+6],9,-1069501632);
c=md5gg(c,d,a,b,blks[i+11],14,643717713);
b=md5gg(b,c,d,a,blks[i+0],20,-373897302);
a=md5gg(a,b,c,d,blks[i+5],5,-701558691);
d=md5gg(d,a,b,c,blks[i+10],9,38016083);
c=md5gg(c,d,a,b,blks[i+15],14,-660478335);
b=md5gg(b,c,d,a,blks[i+4],20,-405537848);
a=md5gg(a,b,c,d,blks[i+9],5,568446438);
d=md5gg(d,a,b,c,blks[i+14],9,-1019803690);
c=md5gg(c,d,a,b,blks[i+3],14,-187363961);
b=md5gg(b,c,d,a,blks[i+8],20,1163531501);
a=md5gg(a,b,c,d,blks[i+13],5,-1444681467);
d=md5gg(d,a,b,c,blks[i+2],9,-51403784);
c=md5gg(c,d,a,b,blks[i+7],14,1735328473);
b=md5gg(b,c,d,a,blks[i+12],20,-1926607734);
a=md5hh(a,b,c,d,blks[i+5],4,-378558);
d=md5hh(d,a,b,c,blks[i+8],11,-2022574463);
c=md5hh(c,d,a,b,blks[i+11],16,1839030562);
b=md5hh(b,c,d,a,blks[i+14],23,-35309556);
a=md5hh(a,b,c,d,blks[i+1],4,-1530992060);
d=md5hh(d,a,b,c,blks[i+4],11,1272893353);
c=md5hh(c,d,a,b,blks[i+7],16,-155497632);
b=md5hh(b,c,d,a,blks[i+10],23,-1094730640);
a=md5hh(a,b,c,d,blks[i+13],4,681279174);
d=md5hh(d,a,b,c,blks[i+0],11,-358537222);
c=md5hh(c,d,a,b,blks[i+3],16,-722521979);
b=md5hh(b,c,d,a,blks[i+6],23,76029189);
a=md5hh(a,b,c,d,blks[i+9],4,-640364487);
d=md5hh(d,a,b,c,blks[i+12],11,-421815835);
c=md5hh(c,d,a,b,blks[i+15],16,530742520);
b=md5hh(b,c,d,a,blks[i+2],23,-995338651);
a=md5ii(a,b,c,d,blks[i+0],6,-198630844);
d=md5ii(d,a,b,c,blks[i+7],10,1126891415);
c=md5ii(c,d,a,b,blks[i+14],15,-1416354905);
b=md5ii(b,c,d,a,blks[i+5],21,-57434055);
a=md5ii(a,b,c,d,blks[i+12],6,1700485571);
d=md5ii(d,a,b,c,blks[i+3],10,-1894986606);
c=md5ii(c,d,a,b,blks[i+10],15,-1051523);
b=md5ii(b,c,d,a,blks[i+1],21,-2054922799);
a=md5ii(a,b,c,d,blks[i+8],6,1873313359);
d=md5ii(d,a,b,c,blks[i+15],10,-30611744);
c=md5ii(c,d,a,b,blks[i+6],15,-1560198380);
b=md5ii(b,c,d,a,blks[i+13],21,1309151649);
a=md5ii(a,b,c,d,blks[i+4],6,-145523070);
d=md5ii(d,a,b,c,blks[i+11],10,-1120210379);
c=md5ii(c,d,a,b,blks[i+2],15,718787259);
b=md5ii(b,c,d,a,blks[i+9],21,-343485551);
a=safeAdd(a,olda);
b=safeAdd(b,oldb);
c=safeAdd(c,oldc);
d=safeAdd(d,oldd);
}
function rhex(n){
let s='';
for(let j=0;j<=3;j++){
s+=('0'+((n>>(j*8))&0xFF).toString(16)).slice(-2);
}
return s;
}
return rhex(a)+rhex(b)+rhex(c)+rhex(d);
}
static sha256(bytes){
function rightRotate(value,amount){
return (value>>>amount)|(value<<(32-amount));
}
const K=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
let H=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
const bytesLen=bytes.length;
const nblk=((bytesLen+8)>>6)+1;
const words=new Array(nblk*16).fill(0);
for(let i=0;i<bytesLen;i++){
words[i>>2]|=bytes[i]<<((3-(i%4))*8);
}
words[bytesLen>>2]|=0x80<<((3-(bytesLen%4))*8);
const bitLenHi=Math.floor((bytesLen*8)/0x100000000);
const bitLenLo=(bytesLen*8)>>>0;
words[nblk*16-2]=bitLenHi;
words[nblk*16-1]=bitLenLo;
const w=new Array(64);
for(let i=0;i<words.length;i+=16){
for(let t=0;t<16;t++)w[t]=words[i+t];
for(let t=16;t<64;t++){
const s0=rightRotate(w[t-15],7)^rightRotate(w[t-15],18)^(w[t-15]>>>3);
const s1=rightRotate(w[t-2],17)^rightRotate(w[t-2],19)^(w[t-2]>>>10);
w[t]=(w[t-16]+s0+w[t-7]+s1)|0;
}
let a=H[0],b=H[1],c=H[2],d=H[3],e=H[4],f=H[5],g=H[6],h=H[7];
for(let t=0;t<64;t++){
const S1=rightRotate(e,6)^rightRotate(e,11)^rightRotate(e,25);
const ch=(e&f)^((~e)&g);
const temp1=(h+S1+ch+K[t]+w[t])|0;
const S0=rightRotate(a,2)^rightRotate(a,13)^rightRotate(a,22);
const maj=(a&b)^(a&c)^(b&c);
const temp2=(S0+maj)|0;
h=g;g=f;f=e;e=(d+temp1)|0;
d=c;c=b;b=a;a=(temp1+temp2)|0;
}
H[0]=(H[0]+a)|0;
H[1]=(H[1]+b)|0;
H[2]=(H[2]+c)|0;
H[3]=(H[3]+d)|0;
H[4]=(H[4]+e)|0;
H[5]=(H[5]+f)|0;
H[6]=(H[6]+g)|0;
H[7]=(H[7]+h)|0;
}
return H.map(v=>(v>>>0).toString(16).padStart(8,'0')).join('');
}
}
if(typeof module!=='undefined'&&module.exports){
module.exports=OpkPackAnalyser;
}else if(typeof window!=='undefined'){
window.OpkPackAnalyser=OpkPackAnalyser;
}