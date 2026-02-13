var OPLCompiler=(function (){
var OPERATORS=['+','-','*','/','**','=','<','>','<=','>=','<>','AND','OR','NOT','%'];
var KEYWORDS_SHARED=[
'PROC','ENDP',
'LOCAL','GLOBAL','EXTERNAL',
'IF','ELSE','ELSEIF','ENDIF',
'WHILE','ENDWH','DO','UNTIL',
'GOTO','ONERR','TRAP',
'RETURN','STOP','BREAK','CONTINUE',
'PRINT','LPRINT','AT','CLS','BEEP','PAUSE',
'POKEB','POKEW','RANDOMIZE','CURSOR','ESCAPE',
'APPEND','CLOSE','COPY','CREATE','DELETE','ERASE',
'FIRST','LAST','NEXT','BACK','OPEN','POSITION','RENAME','UPDATE','USE','EDIT',
'ON','OFF',
'RAISE','EXT','DISP','COPYW','DELETEW','INPUT','KSTAT','VIEW','MENU'
];
var KEYWORDS_LZ=[
'UDG','MENU','CLOCK'
];
var QCODE_BY_NAME={};
function init(){
if(typeof QCODE_DEFS==='undefined'){
return;
}
for(var code in QCODE_DEFS){
var def=QCODE_DEFS[code];
var name=def.desc.toUpperCase();
if(!QCODE_BY_NAME[name]){
QCODE_BY_NAME[name]=[];
}
QCODE_BY_NAME[name].push({
code:parseInt(code),
args:def.args,
pops:def.pops,
pushes:def.pushes
});
}
}
function tokenize(source,targetSystem){
var tokens=[];
var lines=source.split('\n');
var activeKeywords=KEYWORDS_SHARED.slice();
if(targetSystem==='LZ'){
activeKeywords=activeKeywords.concat(KEYWORDS_LZ);
}
for(var i=0;i<lines.length;i++){
var line=lines[i].trim();
if(!line||line.startsWith('REM'))continue;
var ptr=0;
while(ptr<line.length){
var char=line[ptr];
if (/\s/.test(char)){
ptr++;
continue;
}
if(char==='"'){
var startToken=ptr;
var current=ptr+1;
var value="";
while(current<line.length){
var c=line[current];
if(c==='"'){
if(current+1<line.length&&line[current+1]==='"'){
value+='"';
current+=2;
}else {
break;
}
}else {
value+=c;
current++;
}
}
if(current>=line.length&&line[current-1]!=='"'){
throw new Error("Error on line "+(i+1)+": Unterminated string");
}
tokens.push({type:'STRING',value:value,line:i+1,col:startToken});
ptr=current+1;
continue;
}
if (/[0-9]/.test(char)||(char==='.'&& /[0-9]/.test(line[ptr+1]))){
var start=ptr;
while(ptr<line.length&& /[0-9.]/.test(line[ptr]))ptr++;
var val=line.substring(start,ptr);
if(val.includes('.')){
tokens.push({type:'FLOAT',value:parseFloat(val),line:i+1,col:start});
}else {
tokens.push({type:'INTEGER',value:parseInt(val,10),line:i+1,col:start});
}
continue;
}
if(char==='$'){
if(ptr+1<line.length&& /[0-9A-Fa-f]/.test(line[ptr+1])){
var start=ptr;
ptr++;
while(ptr<line.length&& /[0-9A-Fa-f]/.test(line[ptr]))ptr++;
var hex=line.substring(start+1,ptr);
tokens.push({type:'HEX',value:parseInt(hex,16),line:i+1,col:start});
continue;
}
}
if (/[a-zA-Z]/.test(char)){
var start=ptr;
while(ptr<line.length&& /[a-zA-Z0-9$%]/.test(line[ptr]))ptr++;
var word=line.substring(start,ptr);
var upper=word.toUpperCase();
if(upper==='REM'){
ptr=line.length;
continue;
}
if(activeKeywords.indexOf(upper)!==-1||OPERATORS.indexOf(upper)!==-1){
tokens.push({type:'KEYWORD',value:upper,line:i+1,col:start});
}else {
tokens.push({type:'IDENTIFIER',value:word,line:i+1,col:start});
}
continue;
}
if([':',',',';','(',')','$','!','#','&',"'",'?','@','[','\\',']','^','_','`','{','|','}','~'].indexOf(char)!==-1){
tokens.push({type:'PUNCTUATION',value:char,line:i+1,col:ptr});
ptr++;
continue;
}
if(char==='.'){
if(ptr+1<line.length&& /[0-9]/.test(line[ptr+1])){
var start=ptr;
ptr++;
while(ptr<line.length&& /[0-9]/.test(line[ptr]))ptr++;
var val=line.substring(start,ptr);
tokens.push({type:'FLOAT',value:parseFloat(val),line:i+1,col:start});
continue;
}else {
tokens.push({type:'PUNCTUATION',value:'.',line:i+1,col:ptr});
ptr++;
continue;
}
}
if(char==='<'||char==='>'||char===':'){
if(line[ptr+1]==='='||line[ptr+1]==='>'){
tokens.push({type:'OPERATOR',value:char+line[ptr+1],line:i+1,col:ptr});
ptr+=2;
continue;
}
}
if(char==='*'){
if(line[ptr+1]==='*'){
tokens.push({type:'OPERATOR',value:'**',line:i+1,col:ptr});
ptr+=2;
continue;
}
}
if(OPERATORS.indexOf(char)!==-1){
tokens.push({type:'OPERATOR',value:char,line:i+1,col:ptr});
ptr++;
continue;
}
throw new Error("Error on line "+(i+1)+": Unexpected character '"+char+"'");
}
tokens.push({type:'EOL',line:i+1});
}
return tokens;
}
function parseType(name){
if(name.endsWith('$'))return 2;
if(name.endsWith('%'))return 0;
return 1;
}
function removeSuffix(name){
if(name.endsWith('$')||name.endsWith('%'))return name.slice(0,-1);
return name;
}
const BUILTIN_OPCODES_SHARED={
'GET':0x91,'KEY':0x95,'POS':0xA5,'COUNT':0xA2,'EOF':0xA3,'ERR':0x8E,
'FREE':0x90,'RECSIZE':0x9D,'FIND':0x8F,'LEN':0x96,'LOC':0x97,'ASC':0x8B,
'ADDR':0x8A,'ABS':0xA6,'IABS':0x93,'INT':0x94,'FLT':0xAB,'DIR$':0xB7,'KEY$':0xBF,
'CHR$':0xB8,'EXIST':0xA4,
'DAY':0x8C,'HOUR':0x92,'MINUTE':0x99,'MONTH':0x9A,'SECOND':0x9E,'YEAR':0xA1,
'PEEKB':0x9B,'PEEKW':0x9C,'USR':0x9F,'USR$':0xC8,
'VIEW':0xA0,'MENU':0x98,'KSTAT':0x6A,'EDIT':0x6B,
'HEX$':0xBE,'LEFT$':0xC0,'RIGHT$':0xC4,'MID$':0xC2,'LOWER$':0xC1,'UPPER$':0xC7,
'REPT$':0xC5,'GEN$':0xBC,'FIX$':0xBB,'SCI$':0xC6,'NUM$':0xC3,'DATIM$':0xB9,
'ERR$':0xBA,'GET$':0xBD,'VAL':0xB5,'PI':0xAF,'RAD':0xB0,'DEG':0xA9,
'SIN':0xB2,'COS':0xA8,'TAN':0xB4,'ATAN':0xA7,'SQR':0xB3,'LN':0xAD,
'LOG':0xAE,'EXP':0xAA,'RND':0xB1,'INTF':0xAC,'SPACE':0xB6,
'DISP':0x8D
};
var BUILTIN_OPCODES_LZ={
'CLOCK':0xD6,'DOW':0xD7,'FINDW':0xD8,'MENUN':0xD9,'WEEK':0xDA,
'ACOS':0xDB,'ASIN':0xDC,'DAYS':0xDD,'MAX':0xDE,'MEAN':0xDF,
'MIN':0xE0,'STD':0xE1,'SUM':0xE2,'VAR':0xE3,
'DAYNAME$':0xE4,'DIRW$':0xE5,'MONTH$':0xE6
};
const QCODE_DEFS={
0X00:{args:'v',pops:'',pushes:'I',desc:'Push local/global int'},
0X01:{args:'v',pops:'',pushes:'F',desc:'Push local/global float'},
0X02:{args:'v',pops:'',pushes:'S',desc:'Push local/global string'},
0X03:{args:'V',pops:'',pushes:'I',desc:'Push local/global int array element'},
0X04:{args:'V',pops:'',pushes:'F',desc:'Push local/global float array element'},
0X05:{args:'V',pops:'',pushes:'S',desc:'Push local/global string array element'},
0X06:{args:'W',pops:'',pushes:'F',desc:'Push calculator memory'},
0X07:{args:'v',pops:'',pushes:'I',desc:'Push extern int'},
0X08:{args:'v',pops:'',pushes:'F',desc:'Push extern float'},
0X09:{args:'v',pops:'',pushes:'S',desc:'Push extern string'},
0X0A:{args:'v',pops:'',pushes:'I',desc:'Push extern int array element'},
0X0B:{args:'v',pops:'',pushes:'F',desc:'Push extern float array element'},
0X0C:{args:'v',pops:'',pushes:'S',desc:'Push extern string array element'},
0X0D:{args:'v',pops:'',pushes:'I',desc:'Push local/global int ref'},
0X0E:{args:'v',pops:'',pushes:'F',desc:'Push local/global float ref'},
0X0F:{args:'v',pops:'',pushes:'S',desc:'Push local/global string ref'},
0X10:{args:'v',pops:'I',pushes:'I',desc:'Push local/global int array ref'},
0X11:{args:'v',pops:'I',pushes:'F',desc:'Push local/global float array ref'},
0X12:{args:'v',pops:'I',pushes:'S',desc:'Push local/global string array ref'},
0X13:{args:'W',pops:'',pushes:'F',desc:'Push calculator memory ref'},
0X14:{args:'V',pops:'',pushes:'I',desc:'Push extern int ref'},
0X15:{args:'V',pops:'',pushes:'F',desc:'Push extern float ref'},
0X16:{args:'V',pops:'',pushes:'S',desc:'Push extern string ref'},
0X17:{args:'V',pops:'I',pushes:'I',desc:'Push extern int array ref'},
0X18:{args:'V',pops:'I',pushes:'F',desc:'Push extern float array ref'},
0X19:{args:'V',pops:'I',pushes:'S',desc:'Push extern string array ref'},
0X1A:{args:'B',pops:'S',pushes:'I',desc:'Push file field int'},
0X1B:{args:'B',pops:'S',pushes:'F',desc:'Push file field float'},
0X1C:{args:'B',pops:'S',pushes:'S',desc:'Push file field string'},
0X1D:{args:'B',pops:'S',pushes:'I',desc:'Push file field int ref'},
0X1E:{args:'B',pops:'S',pushes:'F',desc:'Push file field float ref'},
0X1F:{args:'B',pops:'S',pushes:'S',desc:'Push file field string ref'},
0X20:{args:'B',pops:'',pushes:'I',desc:'Push byte literal'},
0X21:{args:'I',pops:'',pushes:'I',desc:'Push word literal'},
0X22:{args:'I',pops:'',pushes:'I',desc:'Push integer literal'},
0X23:{args:'F',pops:'',pushes:'F',desc:'Push float literal'},
0X24:{args:'S',pops:'',pushes:'S',desc:'Push string literal'},
0X25:{args:'',pops:'',pushes:'',desc:'Machine Code Call'},
0X26:{args:'',pops:'',pushes:'',desc:'UT$LEAV'},
0X27:{args:'',pops:'I I',pushes:'I',desc:'<'},
0X28:{args:'',pops:'I I',pushes:'I',desc:'<='},
0X29:{args:'',pops:'I I',pushes:'I',desc:'>'},
0X2A:{args:'',pops:'I I',pushes:'I',desc:'>='},
0X2B:{args:'',pops:'I I',pushes:'I',desc:'<>'},
0X2C:{args:'',pops:'I I',pushes:'I',desc:'='},
0X2D:{args:'',pops:'I I',pushes:'I',desc:'+'},
0X2E:{args:'',pops:'I I',pushes:'I',desc:'-'},
0X2F:{args:'',pops:'I I',pushes:'I',desc:'*'},
0X30:{args:'',pops:'I I',pushes:'I',desc:'/'},
0X31:{args:'',pops:'I I',pushes:'I',desc:'**'},
0X32:{args:'',pops:'I',pushes:'I',desc:'-'},
0X33:{args:'',pops:'I',pushes:'I',desc:'NOT'},
0X34:{args:'',pops:'I I',pushes:'I',desc:'AND'},
0X35:{args:'',pops:'I I',pushes:'I',desc:'OR'},
0X36:{args:'',pops:'F F',pushes:'I',desc:'<'},
0X37:{args:'',pops:'F F',pushes:'I',desc:'<='},
0X38:{args:'',pops:'F F',pushes:'I',desc:'>'},
0X39:{args:'',pops:'F F',pushes:'I',desc:'>='},
0X3A:{args:'',pops:'F F',pushes:'I',desc:'<>'},
0X3B:{args:'',pops:'F F',pushes:'I',desc:'='},
0X3C:{args:'',pops:'F F',pushes:'F',desc:'+'},
0X3D:{args:'',pops:'F F',pushes:'F',desc:'-'},
0X3E:{args:'',pops:'F F',pushes:'F',desc:'*'},
0X3F:{args:'',pops:'F F',pushes:'F',desc:'/'},
0X40:{args:'',pops:'F F',pushes:'F',desc:'**'},
0X41:{args:'',pops:'F',pushes:'F',desc:'-'},
0X42:{args:'',pops:'F',pushes:'I',desc:'NOT'},
0X43:{args:'',pops:'F F',pushes:'I',desc:'AND'},
0X44:{args:'',pops:'F F',pushes:'I',desc:'OR'},
0X45:{args:'',pops:'S S',pushes:'I',desc:'<'},
0X46:{args:'',pops:'S S',pushes:'I',desc:'<='},
0X47:{args:'',pops:'S S',pushes:'I',desc:'>'},
0X48:{args:'',pops:'S S',pushes:'I',desc:'>='},
0X49:{args:'',pops:'S S',pushes:'I',desc:'<>'},
0X4A:{args:'',pops:'S S',pushes:'I',desc:'='},
0X4B:{args:'',pops:'S S',pushes:'S',desc:'+'},
0X4C:{args:'',pops:'I I',pushes:'',desc:'AT'},
0X4D:{args:'',pops:'I I',pushes:'',desc:'BEEP'},
0X4E:{args:'',pops:'',pushes:'',desc:'CLS'},
0X4F:{args:'O',pops:'',pushes:'',desc:'CURSOR'},
0X50:{args:'O',pops:'',pushes:'',desc:'ESCAPE'},
0X51:{args:'D',pops:'',pushes:'',desc:'GOTO'},
0X52:{args:'',pops:'',pushes:'',desc:'OFF'},
0X53:{args:'D',pops:'',pushes:'',desc:'ONERR'},
0X54:{args:'',pops:'I',pushes:'',desc:'PAUSE'},
0X55:{args:'',pops:'I I',pushes:'',desc:'POKEB'},
0X56:{args:'',pops:'I I',pushes:'',desc:'POKEW'},
0X57:{args:'',pops:'I',pushes:'',desc:'RAISE'},
0X58:{args:'',pops:'F',pushes:'',desc:'RANDOMIZE'},
0X59:{args:'',pops:'',pushes:'',desc:'STOP'},
0X5A:{args:'',pops:'',pushes:'',desc:'TRAP'},
0X5B:{args:'',pops:'',pushes:'',desc:'APPEND'},
0X5C:{args:'',pops:'',pushes:'',desc:'CLOSE'},
0X5D:{args:'',pops:'S S',pushes:'',desc:'COPY'},
0X5E:{args:'f+list',pops:'S',pushes:'',desc:'CREATE'},
0X5F:{args:'',pops:'S',pushes:'',desc:'DELETE'},
0X60:{args:'',pops:'',pushes:'',desc:'ERASE'},
0X61:{args:'',pops:'',pushes:'',desc:'FIRST'},
0X62:{args:'',pops:'',pushes:'',desc:'LAST'},
0X63:{args:'',pops:'',pushes:'',desc:'NEXT'},
0X64:{args:'',pops:'',pushes:'',desc:'BACK'},
0X65:{args:'f+list',pops:'S',pushes:'',desc:'OPEN'},
0X66:{args:'',pops:'I',pushes:'',desc:'POSITION'},
0X67:{args:'',pops:'S S',pushes:'',desc:'RENAME'},
0X68:{args:'',pops:'',pushes:'',desc:'UPDATE'},
0X69:{args:'B',pops:'',pushes:'',desc:'USE'},
0X6A:{args:'',pops:'I',pushes:'',desc:'KSTAT'},
0X6B:{args:'',pops:'S',pushes:'',desc:'EDIT'},
0X6C:{args:'',pops:'I',pushes:'',desc:'INPUT'},
0X6D:{args:'',pops:'I',pushes:'',desc:'INPUT'},
0X6E:{args:'',pops:'I',pushes:'',desc:'INPUT'},
0X6F:{args:'',pops:'I',pushes:'',desc:'PRINT'},
0X70:{args:'',pops:'F',pushes:'',desc:'PRINT'},
0X71:{args:'',pops:'S',pushes:'',desc:'PRINT'},
0X72:{args:'',pops:'',pushes:'',desc:'PRINT ,'},
0X73:{args:'',pops:'',pushes:'',desc:'PRINT (NL)'},
0X74:{args:'',pops:'I',pushes:'',desc:'LPRINT'},
0X75:{args:'',pops:'F',pushes:'',desc:'LPRINT'},
0X76:{args:'',pops:'S',pushes:'',desc:'LPRINT'},
0X77:{args:'',pops:'',pushes:'',desc:'LPRINT ,'},
0X78:{args:'',pops:'',pushes:'',desc:'LPRINT (NL)'},
0X79:{args:'?',pops:'',pushes:'',desc:'RETURN'},
0X7A:{args:'',pops:'',pushes:'',desc:'RETURN'},
0X7B:{args:'',pops:'',pushes:'',desc:'RETURN'},
0X7C:{args:'',pops:'',pushes:'',desc:'RETURN'},
0X7D:{args:'params',pops:'',pushes:'?',desc:'PROC'},
0X7E:{args:'D',pops:'',pushes:'',desc:'BranchIfFalse'},
0X7F:{args:'',pops:'I I',pushes:'',desc:'Assign Int'},
0X80:{args:'',pops:'I F',pushes:'',desc:'Assign Float'},
0X81:{args:'',pops:'I S',pushes:'',desc:'Assign String'},
0X82:{args:'',pops:'',pushes:'',desc:'DROP'},
0X83:{args:'',pops:'I',pushes:'',desc:'DROP'},
0X84:{args:'',pops:'F',pushes:'',desc:'DROP'},
0X85:{args:'',pops:'S',pushes:'',desc:'DROP'},
0X86:{args:'',pops:'I',pushes:'F',desc:'FLT'},
0X87:{args:'',pops:'F',pushes:'I',desc:'INT'},
0X88:{args:'',pops:'',pushes:'',desc:'End of Field List'},
0X89:{args:'code',pops:'',pushes:'',desc:'Inline Code'},
0X8A:{args:'',pops:'i',pushes:'I',desc:'ADDR'},
0X8B:{args:'',pops:'S',pushes:'I',desc:'ASC'},
0X8C:{args:'',pops:'',pushes:'I',desc:'DAY'},
0X8D:{args:'',pops:'I S',pushes:'I',desc:'DISP'},
0X8E:{args:'',pops:'',pushes:'I',desc:'ERR'},
0X8F:{args:'',pops:'S',pushes:'I',desc:'FIND'},
0X90:{args:'',pops:'',pushes:'I',desc:'FREE'},
0X91:{args:'',pops:'',pushes:'I',desc:'GET'},
0X92:{args:'',pops:'',pushes:'I',desc:'HOUR'},
0X93:{args:'',pops:'I',pushes:'I',desc:'ABS'},
0X94:{args:'',pops:'F',pushes:'I',desc:'INT'},
0X95:{args:'',pops:'',pushes:'I',desc:'KEY'},
0X96:{args:'',pops:'S',pushes:'I',desc:'LEN'},
0X97:{args:'',pops:'S S',pushes:'I',desc:'LOC'},
0X98:{args:'',pops:'S',pushes:'I',desc:'MENU'},
0X99:{args:'',pops:'',pushes:'I',desc:'MINUTE'},
0X9A:{args:'',pops:'',pushes:'I',desc:'MONTH'},
0X9B:{args:'',pops:'I',pushes:'I',desc:'PEEKB'},
0X9C:{args:'',pops:'I',pushes:'I',desc:'PEEKW'},
0X9D:{args:'',pops:'I',pushes:'I',desc:'RECSIZE'},
0X9E:{args:'',pops:'',pushes:'I',desc:'SECOND'},
0X9F:{args:'',pops:'I I',pushes:'I',desc:'USR'},
0XA0:{args:'',pops:'I S',pushes:'I',desc:'VIEW'},
0XA1:{args:'',pops:'',pushes:'I',desc:'YEAR'},
0XA2:{args:'',pops:'',pushes:'I',desc:'COUNT'},
0XA3:{args:'',pops:'',pushes:'I',desc:'EOF'},
0XA4:{args:'',pops:'S',pushes:'I',desc:'EXIST'},
0XA5:{args:'',pops:'',pushes:'I',desc:'POS'},
0XA6:{args:'',pops:'F',pushes:'F',desc:'ABS'},
0XA7:{args:'',pops:'F',pushes:'F',desc:'ATAN'},
0XA8:{args:'',pops:'F',pushes:'F',desc:'COS'},
0XA9:{args:'',pops:'F',pushes:'F',desc:'DEG'},
0XAA:{args:'',pops:'F',pushes:'F',desc:'EXP'},
0XAB:{args:'',pops:'I',pushes:'F',desc:'FLT'},
0XAC:{args:'',pops:'F',pushes:'F',desc:'INTF'},
0XAD:{args:'',pops:'F',pushes:'F',desc:'LN'},
0XAE:{args:'',pops:'F',pushes:'F',desc:'LOG'},
0XAF:{args:'',pops:'',pushes:'F',desc:'PI'},
0XB0:{args:'',pops:'F',pushes:'F',desc:'RAD'},
0XB1:{args:'',pops:'',pushes:'F',desc:'RND'},
0XB2:{args:'',pops:'F',pushes:'F',desc:'SIN'},
0XB3:{args:'',pops:'F',pushes:'F',desc:'SQR'},
0XB4:{args:'',pops:'F',pushes:'F',desc:'TAN'},
0XB5:{args:'',pops:'S',pushes:'F',desc:'VAL'},
0XB6:{args:'',pops:'',pushes:'F',desc:'SPACE'},
0XB7:{args:'',pops:'S',pushes:'S',desc:'DIR$'},
0XB8:{args:'',pops:'I',pushes:'S',desc:'CHR$'},
0XB9:{args:'',pops:'',pushes:'S',desc:'DATIM$'},
0XBA:{args:'',pops:'',pushes:'S',desc:'ERR$'},
0XBB:{args:'',pops:'F I I',pushes:'S',desc:'FIX$'},
0XBC:{args:'',pops:'F I',pushes:'S',desc:'GEN$'},
0XBD:{args:'',pops:'',pushes:'S',desc:'GET$'},
0XBE:{args:'',pops:'I',pushes:'S',desc:'HEX$'},
0XBF:{args:'',pops:'',pushes:'S',desc:'KEY$'},
0XC0:{args:'',pops:'S I',pushes:'S',desc:'LEFT$'},
0XC1:{args:'',pops:'S',pushes:'S',desc:'LOWER$'},
0XC2:{args:'',pops:'S I I',pushes:'S',desc:'MID$'},
0XC3:{args:'',pops:'F I',pushes:'S',desc:'NUM$'},
0XC4:{args:'',pops:'S I',pushes:'S',desc:'RIGHT$'},
0XC5:{args:'',pops:'S I',pushes:'S',desc:'REPT$'},
0XC6:{args:'',pops:'F I I',pushes:'S',desc:'SCI$'},
0XC7:{args:'',pops:'S',pushes:'S',desc:'UPPER$'},
0XC8:{args:'',pops:'I I',pushes:'S',desc:'USR$'},
0XC9:{args:'',pops:'s',pushes:'I',desc:'ADDR'},
0XCA:{args:'S I',pops:'',pushes:'',desc:'.LNO'},
0XCB:{args:'I I',pops:'',pushes:'',desc:'.LNO'},
0XCC:{args:'',pops:'F F',pushes:'F',desc:'<%'},
0XCD:{args:'',pops:'F F',pushes:'F',desc:'>%'},
0XCE:{args:'',pops:'F F',pushes:'F',desc:'+%'},
0XCF:{args:'',pops:'F F',pushes:'F',desc:'-%'},
0XD0:{args:'',pops:'F F',pushes:'F',desc:'*%'},
0XD1:{args:'',pops:'F F',pushes:'F',desc:'/%'},
0XD2:{args:'',pops:'I',pushes:'',desc:'OFF'},
0XD3:{args:'',pops:'S S',pushes:'',desc:'COPYW'},
0XD4:{args:'',pops:'S',pushes:'',desc:'DELETEW'},
0XD5:{args:'',pops:'I I I I I I I I I',pushes:'',desc:'UDG'},
0XD6:{args:'',pops:'I',pushes:'I',desc:'CLOCK'},
0XD7:{args:'',pops:'I I I',pushes:'I',desc:'DOW'},
0XD8:{args:'',pops:'S',pushes:'I',desc:'FINDW'},
0XD9:{args:'',pops:'I S',pushes:'I',desc:'MENUN'},
0XDA:{args:'',pops:'I I I',pushes:'I',desc:'WEEK'},
0XDB:{args:'',pops:'F',pushes:'F',desc:'ACOS'},
0XDC:{args:'',pops:'F',pushes:'F',desc:'ASIN'},
0XDD:{args:'',pops:'I I I',pushes:'F',desc:'DAYS'},
0XDE:{args:'Flist',pushes:'F',desc:'MAX'},
0XDF:{args:'Flist',pushes:'F',desc:'MEAN'},
0XE0:{args:'Flist',pushes:'F',desc:'MIN'},
0XE1:{args:'Flist',pushes:'F',desc:'STD'},
0XE2:{args:'Flist',pushes:'F',desc:'SUM'},
0XE3:{args:'Flist',pushes:'F',desc:'VAR'},
0XE4:{args:'I',pushes:'S',desc:'DAYNAME$'},
0XE5:{args:'S',pushes:'S',desc:'DIRW$'},
0XE6:{args:'I',pushes:'S',desc:'MONTH$'},
0XEA:{args:'',pops:'',pushes:'',desc:'REM Unknown EA'},
0XED:{args:'b',pops:'',pushes:'',desc:'EXT'},
0XEF:{args:'v',pops:'',pushes:'',desc:'REM LZ_EF'},
0XFB:{args:'D',pops:'',pushes:'',desc:'ELSEIF'},
0XFC:{args:'',pops:'',pushes:'',desc:'REM LZ_FC'},
0XFD:{args:'',pops:'',pushes:'',desc:'REM LZ_FD'},
0XFE:{args:'prefix',pops:'',pushes:'',desc:'Multi-byte Prefix'},
0XFF:{args:'',pops:'',pushes:'',desc:'CHECK'},
0XF1:{args:'b b',pops:'',pushes:'',desc:'POKE_M_F1'},
0XF2:{args:'b b',pops:'',pushes:'',desc:'POKE_M_F2'},
0XF3:{args:'b b',pops:'',pushes:'',desc:'POKE_M_F3'},
0XF4:{args:'b b',pops:'',pushes:'',desc:'POKE_M_F4'},
0XF5:{args:'b b',pops:'',pushes:'',desc:'POKE_M_F5'},
0XF6:{args:'b b',pops:'',pushes:'',desc:'POKE_M_F6'},
0XF7:{args:'b b',pops:'',pushes:'',desc:'POKE_M_F7'},
0XF8:{args:'b b',pops:'',pushes:'',desc:'POKE_M_F8'},
0XF9:{args:'b b',pops:'',pushes:'',desc:'POKE_M_F9'},
0XFA:{args:'b b',pops:'',pushes:'',desc:'POKE_M_FA'},
};
function compile(source,options){
options=options||{};
var targetSystem=options.targetSystem||'Standard';
init();
var tokens=tokenize(source,targetSystem);
var activeOpcodes=Object.assign({},BUILTIN_OPCODES_SHARED);
if(targetSystem==='LZ'){
Object.assign(activeOpcodes,BUILTIN_OPCODES_LZ);
}
var activeKeywords=KEYWORDS_SHARED.slice();
if(targetSystem==='LZ'){
activeKeywords=activeKeywords.concat(KEYWORDS_LZ);
}
try{
var globals=[];
var locals=[];
var externals=[];
var params=[];
var globalStrFixups=[];
var globalArrFixups=[];
var localStrFixups=[];
var localArrFixups=[];
var ptr=0;
function peek(){return tokens[ptr];}
function next(){return tokens[ptr++];}
function error(msg){
var lineInfo=(t&&t.line)?"Error on line "+t.line+": ":"Error: ";
throw new Error(lineInfo+msg);
}
function expect(val){
var p=peek();
if(p&&p.value===val){
next();
return;
}
var line=p?p.line:(tokens.length>0?tokens[tokens.length-1].line:"?");
throw new Error("Error on line "+line+": Expected '"+val+"'");
}
ptr=0;
var procName=null;
while(ptr<tokens.length){
var t=next();
if(!procName){
var isProc=false;
if(t.type==='IDENTIFIER'){
if(peek()&&peek().value===':')isProc=true;
else if(peek()&&peek().value==='(')isProc=true;
}else if(t.type==='KEYWORD'){
var p=peek();
if(p&&p.value===':'){
if(p.col===(t.col+t.value.length)){
isProc=true;
}
}
}
if(isProc){
procName=t.value;
if(procName.length>8){
throw new Error("Error on line "+t.line+": Procedure name '"+procName+"' exceeds 8 characters.");
}
if(!/^[A-Za-z]/.test(procName)){
throw new Error("Error on line "+t.line+": Procedure name '"+procName+"' must start with a letter.");
}
if(!/^[A-Za-z0-9%$]+$/.test(procName)){
throw new Error("Error on line "+t.line+": Procedure name '"+procName+"' contains invalid characters.");
}
if(!/^[A-Za-z][A-Za-z0-9]*[%$]?$/.test(procName)){
throw new Error("Error on line "+t.line+": Invalid procedure name format '"+procName+"'. (Suffix %/$ only allowed at end)");
}
var ateColon=false;
if(peek()&&peek().value===':'){
next();
ateColon=true;
}
if(peek()&&peek().value==='('){
next();
while(true){
var pTok=next();
if(pTok.type==='IDENTIFIER'){
var pName=pTok.value.toUpperCase();
var pType=parseType(pName);
var pDims=[];
if(peek()&&peek().value==='('){
next();
if(peek()&&peek().value===')'){
next();
pDims.push(0);
if(pType===0)pType=3;
else if(pType===1)pType=4;
else if(pType===2)pType=5;
}
}
locals.push({name:pName,type:pType,dims:pDims,isParam:true});
params.push(pType);
}
if(peek()&&peek().value===','){next();continue;}
if(peek()&&peek().value===')'){next();break;}
break;
}
}
if(!ateColon&&peek()&&peek().value===':')next();
continue;
}
}
if(t.type==='KEYWORD'){
if(t.value==='GLOBAL'||t.value==='EXTERNAL'||t.value==='LOCAL'){
if(peek()&&peek().value===':'){
}else {
var isExt=(t.value==='EXTERNAL');
var isLocal=(t.value==='LOCAL');
var declList=(isExt?externals:(isLocal?locals:globals));
while(true){
var varNameTok=next();
if(varNameTok&&varNameTok.type==='IDENTIFIER'){
var rawName=varNameTok.value.toUpperCase();
if (/^M[0-9]$/.test(rawName)){
throw new Error("Error on line "+varNameTok.line+": Variable name '"+rawName+"' is reserved for calculator memory.");
}
var type=parseType(rawName);
var storedName=rawName;
var dim=[];
if(peek()&&peek().value==='('){
next();
while(true){
var d=next();
if(d.type==='INTEGER')dim.push(d.value);
if(peek()&&peek().value===','){next();continue;}
if(peek()&&peek().value===')'){next();break;}
if(!peek())break;
}
}
if(dim.length>0){
if(type===0)type=3;
else if(type===1)type=4;
else if(type===2&&dim.length>1)type=5;
}
declList.push({name:storedName,type:type,dims:dim});
}else {
var errTok=varNameTok||t;
var errVal=errTok.value||errTok.type||"EOF";
throw new Error("Error on line "+(errTok.line||"?")+": Expected Variable Name, found '"+errVal+"'");
}
if(peek()&&peek().value===','){
next();
continue;
}
break;
}
}
}
}
}
if(!procName){
error("Procedure must start with a Name Label (e.g. 'MYPROC:')");
}
var declaredNames={};
for(var i=0;i<globals.length;i++)declaredNames[globals[i].name]=true;
for(var i=0;i<locals.length;i++)declaredNames[locals[i].name]=true;
for(var i=0;i<externals.length;i++)declaredNames[externals[i].name]=true;
var skipNext=false;
var scanContext={
cmd:null,
parens:0,
argIndex:0
};
for(var i=0;i<tokens.length;i++){
var t=tokens[i];
if(t.type==='PUNCTUATION'&&t.value===':'){
scanContext.cmd=null;
scanContext.parens=0;
scanContext.argIndex=0;
continue;
}
if(t.type==='KEYWORD'&&(t.value==='CREATE'||t.value==='OPEN'||t.value==='USE')){
scanContext.cmd=t.value;
scanContext.parens=0;
scanContext.argIndex=0;
}else if(t.type==='EOL'){
scanContext.cmd=null;
}else if(scanContext.cmd){
if(t.value==='(')scanContext.parens++;
else if(t.value===')')scanContext.parens--;
else if(t.value===','&&scanContext.parens===0){
scanContext.argIndex++;
}
}
if(t.type==='IDENTIFIER'){
if(scanContext.cmd==='USE'){
if(scanContext.argIndex===0){
var val=t.value.toUpperCase();
if(val.length===1&&['A','B','C','D'].includes(val))continue;
}
}
if(scanContext.cmd==='OPEN'||scanContext.cmd==='CREATE'){
if(scanContext.argIndex>=1)continue;
}
var name=t.value.toUpperCase();
var prev=tokens[i-1];
if(prev){
if(prev.value==='.'){
continue;
}
if(prev.value==='%'){
continue;
}
}
var nextTok=tokens[i+1];
if(nextTok&&nextTok.value==='.'){
if(name.length===1&&['A','B','C','D'].includes(name))continue;
}
if(activeKeywords.indexOf(name.toUpperCase())!==-1)continue;
if(OPERATORS.indexOf(name.toUpperCase())!==-1)continue;
if(i===1&&(tokens[0].type==='IDENTIFIER'||tokens[0].type==='KEYWORD')&&tokens[0].value.toUpperCase()==='PROC')continue;
if(i===0&&tokens[1]&&tokens[1].value===':')continue;
if(tokens[i+1]&&tokens[i+1].value===':'&&tokens[i+2]&&tokens[i+2].value===':')continue;
if(tokens[i+1]&&tokens[i+1].value===':')continue;
if(activeOpcodes[name])continue;
if(declaredNames[name])continue;
if (/^M[0-9]$/.test(name))continue;
var type=1;
if(name.endsWith('%'))type=0;
else if(name.endsWith('$'))type=2;
else type=1;
if(tokens[i+1]&&tokens[i+1].value==='('){
if(type===0)type=3;
else if(type===1)type=4;
else if(type===2)type=5;
}
if(nextTok&&nextTok.value==='('){
var isArrayAssign=false;
var p=i+2;
var depth=1;
while(p<tokens.length){
if(tokens[p].value==='(')depth++;
else if(tokens[p].value===')')depth--;
if(depth===0)break;
p++;
}
if(depth===0&&tokens[p+1]&&tokens[p+1].value==='='){
isArrayAssign=true;
}
if(!isArrayAssign)continue;
}
declaredNames[name]=true;
externals.push({name:name,type:type,dims:[],isImplicit:true});
}
}
var varSpaceSize=2;
var globalTableSize=0;
for(var i=0;i<globals.length;i++){
globalTableSize+=(4+globals[i].name.length);
}
varSpaceSize+=globalTableSize;
var currentOffset=-2;
currentOffset-=globalTableSize;
var paramIdx=0;
for(var i=0;i<locals.length;i++){
if(locals[i].isParam){
locals[i].offset=currentOffset-2;
currentOffset-=2;
varSpaceSize+=2;
paramIdx++;
}
}
for(var i=0;i<externals.length;i++){
if(externals[i].isImplicit)continue;
externals[i].ptrOffset=currentOffset-2;
currentOffset-=2;
varSpaceSize+=2;
}
function calculateSize(item,scope){
if(item.isParam)return 2;
var isArray=false;
if(item.dims.length>0){
if(item.type===0||item.type===1||item.type===3||item.type===4)isArray=true;
else if((item.type===2||item.type===5)&&item.dims.length>1)isArray=true;
}
if(isArray){
var arrayLength=1;
var dimCount=item.dims.length;
if(item.type===2||item.type===5)dimCount-=1;
for(var d=0;d<dimCount;d++){
arrayLength*=item.dims[d];
}
if(item.type===0||item.type===3){
return 2+(2*arrayLength);
}else if(item.type===1||item.type===4){
return 2+(8*arrayLength);
}else if(item.type===2||item.type===5){
var maxLen=item.dims[item.dims.length-1];
return 2+((1+maxLen)*arrayLength);
}
}else {
if(item.type===0)return 2;
else if(item.type===1)return 8;
else if(item.type===2){
var maxLen=(item.dims.length>0)?item.dims[0]:255;
return 1+maxLen;
}
}
return 8;
}
for(var i=0;i<globals.length;i++){
var g=globals[i];
var size=calculateSize(g,'global');
g.offset=currentOffset-size;
currentOffset-=size;
varSpaceSize+=size;
if((g.type===2||g.type===5)&&g.dims.length>0){
currentOffset--;
varSpaceSize++;
}
var isArray=(g.dims.length>0&&(g.type!==2||g.dims.length>1));
if((g.type===2||g.type===5)&&!g.isParam){
var maxLen=g.dims[g.dims.length-1];
globalStrFixups.push({addr:g.offset-1,len:maxLen});
}
if(isArray){
var fixupElements=1;
var dimCount=g.dims.length;
if(g.type===2||g.type===5)dimCount-=1;
for(var d=0;d<dimCount;d++)fixupElements*=g.dims[d];
globalArrFixups.push({addr:g.offset,len:fixupElements});
}
}
var localOffset=currentOffset;
for(var i=0;i<locals.length;i++){
var l=locals[i];
if(l.isParam)continue;
var size=calculateSize(l,'local');
l.offset=localOffset-size;
localOffset-=size;
varSpaceSize+=size;
if((l.type===2||l.type===5)&&l.dims.length>0){
localOffset--;
varSpaceSize++;
}
var isArray=(l.dims.length>0&&(l.type!==2||l.dims.length>1));
if((l.type===2||l.type===5)&&!l.isParam){
var maxLen=l.dims[l.dims.length-1];
localStrFixups.push({addr:l.offset-1,len:maxLen});
}
if(isArray){
var fixupElements=1;
var dimCount=l.dims.length;
if(l.type===2||l.type===5)dimCount-=1;
for(var d=0;d<dimCount;d++)fixupElements*=l.dims[d];
localArrFixups.push({addr:l.offset,len:fixupElements});
}
}
for(var i=0;i<externals.length;i++){
var e=externals[i];
if(!e.isImplicit)continue;
var size=2;
e.offset=localOffset-size;
localOffset-=size;
varSpaceSize+=size;
}
var strFixups=localStrFixups.concat(globalStrFixups);
var arrFixups=localArrFixups.concat(globalArrFixups);
var qcode=[];
if(targetSystem==='LZ'){
qcode.push(0x59,0xB2);
}
var pendingTrap=false;
function emit(b){
qcode.push(b&0xFF);
}
function emitWord(w){emit(w>>8);emit(w&0xFF);}
function emitOp(op){emit(op);}
function emitCommand(op){
if(pendingTrap){
emit(0x5A);
pendingTrap=false;
}
emit(op);
}
function emitFloat(val){
var str=Math.abs(val).toString();
if(str.includes('e')){
if(str.includes('e-')){
var p=str.split('e-');
}
}
var s=str;
if(s.indexOf('.')===-1)s+=".";
var cleanDigits="";
var dotPos=0;
var firstDigitIdx=-1;
var dotSeen=false;
for(var i=0;i<s.length;i++){
var c=s[i];
if(c==='.'){
dotSeen=true;
dotPos=cleanDigits.length;
}else {
if(firstDigitIdx===-1&&c!=='0')firstDigitIdx=cleanDigits.length;
cleanDigits+=c;
}
}
if(firstDigitIdx===-1)firstDigitIdx=cleanDigits.length;
var finalDigits=cleanDigits.substring(firstDigitIdx);
var exponent=(dotPos-firstDigitIdx)-1;
if(finalDigits.length===0){
finalDigits="00";
exponent=0;
}
if(finalDigits.length%2!==0)finalDigits+="0";
var bcdBytes=[];
for(var i=0;i<finalDigits.length;i+=2){
var h=parseInt(finalDigits[i],16);
var l=parseInt(finalDigits[i+1],16);
bcdBytes.push((h<<4)|l);
}
bcdBytes.reverse();
var expByte=exponent&0xFF;
bcdBytes.push(expByte);
var len=bcdBytes.length;
var sign=(val<0?0x80:0x00);
emit(sign|len);
for(var i=0;i<bcdBytes.length;i++)emit(bcdBytes[i]);
}
var symbolScalars={};
var symbolArrays={};
function addSymbol(s){
var isArray=false;
if(s.dims&&s.dims.length>0){
if(s.type===0||s.type===1||s.type===3||s.type===4)isArray=true;
else if((s.type===2||s.type===5)&&s.dims.length>1)isArray=true;
}
if(s.type>=3)isArray=true;
if(isArray)symbolArrays[s.name]=s;
else symbolScalars[s.name]=s;
}
function getSymbol(name,isArray){
if(isArray)return symbolArrays[name];
return symbolScalars[name];
}
for(var i=0;i<globals.length;i++){
var g=globals[i];
g.isGlobal=true;
addSymbol(g);
}
for(var i=0;i<locals.length;i++){
var l=locals[i];
l.isLocal=true;
l.isGlobal=false;
addSymbol(l);
}
for(var i=0;i<externals.length;i++){
var e=externals[i];
e.isExtern=true;
e.index=i;
addSymbol(e);
}
ptr=0;
function parseExpression(){
return parseLogical();
}
function parseLogical(){
var type=parseComparison();
if(peek()){
}
while(peek()&&peek().type!=='STRING'&&['AND','OR'].includes(peek().value)){
var op=next().value;
var rhsType=parseComparison();
if(op==='AND')emit(0x34);
else emit(0x35);
type=0;
}
return type;
}
function parseComparison(){
var type=parseAddSub();
while(peek()&&peek().type!=='STRING'&&['=','<','>','<=','>=','<>'].includes(peek().value)){
var op=next().value;
var rhsStart=qcode.length;
var rhsType=parseAddSub();
var usePercent=false;
if(peek()&&peek().value==='%'){
next();
usePercent=true;
}
if(usePercent){
if(type===0)console.warn("Compiler: Implicit Int->Float cast required (LHS) for Percentage comparison - Unsafe!");
if(rhsType===0)emit(0x86);
if(op==='<')emit(0xCC);
else if(op==='>')emit(0xCD);
else {
throw new Error("Compiler: Operator "+op+"% is not supported (Only <% and >%).");
}
type=0;
}else {
if(type===rhsType){
if(type===0){
if(op==='=')emit(0x2C);
else if(op==='<')emit(0x27);
else if(op==='>')emit(0x29);
else if(op==='<=')emit(0x28);
else if(op==='>=')emit(0x2A);
else if(op==='<>')emit(0x2B);
}else if(type===1){
if(op==='=')emit(0x3B);
else if(op==='<')emit(0x36);
else if(op==='>')emit(0x38);
else if(op==='<=')emit(0x37);
else if(op==='>=')emit(0x39);
else if(op==='<>')emit(0x3A);
}else if(type===2){
if(op==='=')emit(0x4A);
else if(op==='<')emit(0x45);
else if(op==='>')emit(0x47);
else if(op==='<='||op==='=<')emit(0x46);
else if(op==='>='||op==='=>')emit(0x48);
else if(op==='<>')emit(0x49);
}
}else {
if(type===0&&rhsType===1){
if(rhsStart!==undefined){
qcode.splice(rhsStart,0,0x86);
}else {
}
type=1;
}else if(type===1&&rhsType===0){
emit(0x86);
}
if(type===1){
if(op==='=')emit(0x3B);
else if(op==='<')emit(0x36);
else if(op==='>')emit(0x38);
else if(op==='<=')emit(0x37);
else if(op==='>=')emit(0x39);
else if(op==='<>')emit(0x3A);
}
}
type=0;
}
}
return type;
}
function parseAddSub(){
var type=parseMulDiv();
while(peek()&&peek().type!=='STRING'&&['+','-'].includes(peek().value)){
var op=next().value;
var rhsStart=qcode.length;
var rhsType=parseMulDiv();
var usePercent=false;
if(peek()&&peek().value==='%'){
next();
usePercent=true;
}
type=emitMathOp(op,type,rhsType,usePercent,rhsStart);
}
return type;
}
function parseMulDiv(){
var type=parsePower();
while(peek()&&peek().type!=='STRING'&&['*','/'].includes(peek().value)){
var op=next().value;
var rhsStart=qcode.length;
var rhsType=parsePower();
var usePercent=false;
if(peek()&&peek().value==='%'){
next();
usePercent=true;
}
type=emitMathOp(op,type,rhsType,usePercent,rhsStart);
}
return type;
}
function parsePower(){
var type=parseFactor();
if(peek()&&peek().type!=='STRING'&&peek().value==='**'){
var op=next().value;
var rhsStart=qcode.length;
var rhsType=parsePower();
type=emitMathOp(op,type,rhsType,false,rhsStart);
}
return type;
}
function emitMathOp(op,t1,t2,usePercent,rhsStart){
if(t1===2&&t2===2&&op==='+'&&!usePercent){
emit(0x4B);
return 2;
}
var method=0;
if(t1===1||t2===1||usePercent)method=1;
if(usePercent){
if(t1===0)console.warn("Compiler: Implicit Int->Float cast required (LHS) for Percentage op - Unsafe!");
if(t2===0){
emit(0x86);
}
if(op==='+')emit(0xCE);
else if(op==='-')emit(0xCF);
else if(op==='*')emit(0xD0);
else if(op==='/')emit(0xD1);
else throw new Error("Percent modifier not supported for "+op);
return 1;
}
if(method===0){
if(op==='+')emit(0x2D);
else if(op==='-')emit(0x2E);
else if(op==='*')emit(0x2F);
else if(op==='/')emit(0x30);
else if(op==='**')emit(0x31);
return 0;
}else {
if(t1===0){
if(rhsStart!==undefined){
qcode.splice(rhsStart,0,0x86);
}else {
}
}
if(t2===0){
emit(0x86);
}
if(op==='+')emit(0x3C);
else if(op==='-')emit(0x3D);
else if(op==='*')emit(0x3E);
else if(op==='/')emit(0x3F);
else if(op==='**')emit(0x40);
return 1;
}
}
function parseFactor(){
var t=peek();
if(t&&t.type!=='STRING'&&(t.value==='-'||(t.type==='PUNCTUATION'&&t.value==='-'))){
next();
var type=parseFactor();
if(type===0)emit(0x32);
else if(type===1)emit(0x41);
else console.warn("Compiler: Unary minus on String?");
return type;
}
if(t&&t.type!=='STRING'&&(t.value==='NOT')){
next();
var type=parseFactor();
if(type===1)emit(0x42);
else emit(0x33);
return 0;
}
if(t&&t.type!=='STRING'&&t.value==='%'){
next();
var charTick=next();
if(!charTick||charTick.value===undefined)throw new Error("Error on line "+((t&&t.line)||"?")+": Expected character after %");
var strVal=charTick.value.toString();
if(strVal.length!==1)throw new Error("Error on line "+((t&&t.line)||"?")+": ASCII literal % must be followed by a single character");
if(strVal.length===0)throw new Error("Error on line "+((t&&t.line)||"?")+": Empty literal after %");
var ascii=strVal.charCodeAt(0);
emit(0x22);emitWord(ascii);
return 0;
}
t=next();
if(!t)return 0;
if(t.type==='INTEGER'){
if(t.value>=-32768&&t.value<=32767){
emit(0x22);emitWord(t.value);
return 0;
}else {
emit(0x23);
emitFloat(t.value);
return 1;
}
}else if(t.type==='HEX'){
if(t.value>=0&&t.value<=65535){
var signedVal=(t.value>32767)?t.value-65536:t.value;
emit(0x22);emitWord(signedVal);
return 0;
}else {
emit(0x23);
emitFloat(t.value);
return 1;
}
}else if(t.type==='FLOAT'){
emit(0x23);
emitFloat(t.value);
return 1;
}else if(t.type==='STRING'){
emit(0x24);emit(t.value.length);
for(var k=0;k<t.value.length;k++)emit(t.value.charCodeAt(k));
return 2;
}else if((t.type==='KEYWORD'||t.type==='IDENTIFIER')&&
(t.value==='LEN'||t.value==='ASC'||t.value==='MID$'||
t.value==='PEEKB'||t.value==='PEEKW'||t.value==='ADDR')){
var op=t.value;
if(peek()&&peek().value==='(')next();
else throw new Error("Error on line "+t.line+": Expected '('");
if(op==='LEN'){
parseExpression();
emit(0x96);
expect(')');
return 0;
}else if(op==='ASC'){
parseExpression();
emit(0x8B);
expect(')');
return 0;
}else if(op==='MID$'){
parseExpression();
expect(',');
parseExpression();
expect(',');
parseExpression();
emit(0xC2);
expect(')');
return 2;
}else if(op==='PEEKB'){
var addrType=parseExpression();
if(addrType!==0)throw new Error("Error on line "+t.line+": PEEKB address must be an integer (-32768 to 32767)");
emit(0x9B);
expect(')');
return 0;
}else if(op==='PEEKW'){
var addrType=parseExpression();
if(addrType!==0)throw new Error("Error on line "+t.line+": PEEKW address must be an integer (-32768 to 32767)");
emit(0x9C);
expect(')');
return 0;
}else if(op==='ADDR'){
var tVar=next();
if(tVar&&tVar.type==='IDENTIFIER'){
var targetName=tVar.value.toUpperCase();
if(peek()&&peek().value==='.'){
throw new Error("Error on line "+t.line+": Field access not supported in ADDR");
}
var hasIndices=(peek()&&peek().value==='(');
if(hasIndices){
next();
if(peek()&&peek().value===')'){
next();
emit(0x22);emitWord(1);
}else {
while(true){
parseExpression();
if(peek()&&peek().value===','){next();continue;}
if(peek()&&peek().value===')'){next();break;}
break;
}
}
}
var sym=getSymbol(targetName,hasIndices);
if(!sym){
sym={name:targetName,type:1,isExtern:true,index:externals.length};
var suffix=targetName.slice(-1);
if(suffix==='%')sym.type=0;
else if(suffix==='$')sym.type=2;
if(hasIndices){
if(sym.type===0)sym.type=3;
else if(sym.type===1)sym.type=4;
else if(sym.type===2)sym.type=5;
}
externals.push(sym);
addSymbol(sym);
}
var type=sym.type;
if(hasIndices){
if(type===0)type=3;
else if(type===1)type=4;
else if(type===2)type=5;
}
if(sym.isGlobal||sym.isLocal){
emit(0x0D+type);
emitWord(sym.offset);
}else if(sym.isExtern){
emit(0x14+type);
if(sym.offset!==undefined)emitWord(sym.offset);
else emitWord(sym.index);
}
if(type===2||type===5){
emit(0xC9);
}
else {
emit(0x8A);
}
}
}
expect(')');
return 0;
}else if(t.type==='IDENTIFIER'||t.type==='KEYWORD'){
var valName=t.value.toUpperCase();
if (/^M[0-9]$/.test(valName)){
if(peek()&&peek().value==='(')throw new Error("Error on line "+t.line+": Calculator memory '"+valName+"' cannot have indices.");
var memIdx=parseInt(valName.substring(1),10);
emit(0x06);
emitWord(memIdx*8);
return 1;
}
if(peek()&&peek().value==='.'){
next();
var tField=next();
if(tField&&tField.type==='IDENTIFIER'){
var logChar=valName;
var logVal=-1;
if(logChar==='A')logVal=0;
else if(logChar==='B')logVal=1;
else if(logChar==='C')logVal=2;
else if(logChar==='D')logVal=3;
if(logVal!==-1){
var fName=tField.value.toUpperCase();
var type=1;
if(fName.endsWith('%'))type=0;
else if(fName.endsWith('$'))type=2;
emit(0x24);
emit(fName.length);
for(var k=0;k<fName.length;k++)emit(fName.charCodeAt(k));
emit(0x1A+type);
emit(logVal);
return type;
}
}
error("Invalid Field Access syntax: "+valName+"."+(tField?tField.value:""));
}
var builtinOp=activeOpcodes[valName];
if(builtinOp&&peek()&&peek().value===':'){
var colonTok=peek();
if(colonTok.col===(t.col+t.value.length)){
builtinOp=null;
}
}
if(builtinOp){
var def=QCODE_DEFS[builtinOp];
if(def&&def.pushes===''){
throw new Error("Error on line "+t.line+": Syntax Error: '"+valName+"' is a command, not a function.");
}
if(peek()&&peek().value==='('){
next();
if(def&&def.args==='Flist'){
var argCount=0;
if(peek()&&peek().value!==')'){
while(true){
var argType=parseExpression();
if(argType===0)emit(0x86);
argCount++;
if(peek()&&peek().value===',')next();
else break;
}
}
expect(')');
emit(0x22);emitWord(argCount);
}else {
var expectedArgs=[];
if(def&&def.pops){
expectedArgs=def.pops.split(' ');
}
var argIdx=0;
if(peek()&&peek().value!==')'){
while(true){
var argType=parseExpression();
if(argIdx<expectedArgs.length){
var req=expectedArgs[argIdx];
if(req==='F'&&argType===0)emit(0x86);
else if(req==='I'&&argType===1)emit(0x87);
}
argIdx++;
if(peek()&&peek().value===','){
next();
continue;
}
if(peek()&&peek().value===')')break;
break;
}
}
expect(')');
}
}
emit(builtinOp);
if(QCODE_DEFS[builtinOp]){
var pushes=QCODE_DEFS[builtinOp].pushes;
if(pushes==='I')return 0;
if(pushes==='S')return 2;
return 1;
}
if(valName.endsWith('$'))return 2;
return 1;
}
var hasIndices=(peek()&&peek().value==='(');
var sym=getSymbol(valName,hasIndices);
var forceProc=false;
if(peek()&&peek().value===':'){
var colonTok=peek();
if(colonTok.col===(t.col+t.value.length)){
forceProc=true;
}
}
if(!sym||forceProc){
if(!sym&&t.type==='KEYWORD'&&!forceProc){
throw new Error("Error on line "+t.line+": Reserved keyword '"+valName+"' cannot be used as an identifier or function.");
}
var procCallName=t.value;
var argCount=0;
if(peek()&&peek().value===':')next();
if(peek()&&peek().value==='('){
next();
while(true){
var tArg=parseExpression();
emit(0x20);emit(tArg);
argCount++;
if(peek()&&peek().value===','){next();continue;}
if(peek()&&peek().value===')')break;
break;
}
expect(')');
}
emit(0x20);emit(argCount);
emit(0x7D);
emit(procCallName.length);
for(var k=0;k<procCallName.length;k++){
emit(procCallName.charCodeAt(k));
}
if(procCallName.endsWith('%'))return 0;
if(procCallName.endsWith('$'))return 2;
return 1;
}
if(sym){
if(sym.type>=3){
if(peek()&&peek().value==='('){
next();
while(true){
parseExpression();
if(peek()&&peek().value===','){next();continue;}
if(peek()&&peek().value===')')break;
break;
}
expect(')');
}else {
throw new Error("Error on line "+t.line+": Array variable '"+valName+"' requires indices.");
}
}
if(sym.isParam||sym.isExtern){
emit(0x07+sym.type);
if(sym.offset!==undefined)emitWord(sym.offset);
else emitWord(sym.index);
}else if(sym.isGlobal||sym.isLocal){
emit(0x00+sym.type);
emitWord(sym.offset);
}
var retType=sym.type;
if(retType>=3)retType-=3;
if(sym.type===2){
if(peek()&&peek().value==='('){
next();
parseExpression();
if(peek()&&peek().value===','){
next();
parseExpression();
}else {
emit(0x22);emitWord(1);
}
expect(')');
emit(0xC2);
return 2;
}
}
return retType;
}
}else if(t.value==='('){
var type=parseExpression();
if(peek()&&peek().value===')'){
next();
}else {
throw new Error("Error on line "+((t&&t.line)||"?")+": Expected ')'");
}
return type;
}
return 0;
throw new Error("Error on line "+((t&&t.line)||"?")+": Unexpected token '"+(t?t.value:"EOF")+"' in expression");
}
var fixups=[];
var loops=[];
var labels={};
var labelFixups=[];
function emitFixup(){
var addr=qcode.length;
emitWord(0x0000);
return addr;
}
function patchFixup(addr,target){
var offset=target-addr;
qcode[addr]=(offset>>8)&0xFF;
qcode[addr+1]=offset&0xFF;
}
ptr=0;
var implOffset=localOffset;
var skipHeader=false;
if(tokens.length>1&&(tokens[0].type==='IDENTIFIER'||tokens[0].type==='KEYWORD')){
if(tokens[1].value===':'||(tokens.length>2&&(tokens[0].type==='IDENTIFIER'||tokens[0].type==='KEYWORD')&&tokens[0].value.toUpperCase()==='PROC'&&tokens[2].value===':')){
ptr=(tokens[1].value===':')?2:3;
if(ptr<tokens.length&&tokens[ptr].value==='('){
ptr++;
var depth=1;
while(ptr<tokens.length){
if(tokens[ptr].value==='(')depth++;
else if(tokens[ptr].value===')'){
depth--;
if(depth===0)break;
}
ptr++;
}
ptr++;
}
skipHeader=true;
}else if(tokens[1].value==='('){
ptr=2;
var depth=1;
while(ptr<tokens.length){
if(tokens[ptr].value==='(')depth++;
else if(tokens[ptr].value===')'){
depth--;
if(depth===0)break;
}
ptr++;
}
ptr++;
if(ptr<tokens.length&&tokens[ptr].value===':')ptr++;
skipHeader=true;
}
}
while(ptr<tokens.length){
var t=next();
if(t.type==='KEYWORD'&&(t.value==='GLOBAL'||t.value==='LOCAL')){
while(ptr<tokens.length&&tokens[ptr].type!=='EOL'&&tokens[ptr].value!==':')ptr++;
continue;
}
if(t.type==='PUNCTUATION'&&t.value===':'){
continue;
}
if(t.type==='KEYWORD'){
if(peek()&&peek().value===':'){
var p=peek();
if(p.col===(t.col+t.value.length)){
t.type='IDENTIFIER';
}
}
}
if(t.type==='KEYWORD'){
if(t.value==='PRINT'||t.value==='LPRINT'){
var isLPrint=(t.value==='LPRINT');
var suppressNewline=false;
var depth=0;
while(true){
var p=peek();
if(!p||p.type==='EOL')break;
if(p.value===':'){
if(p.type!=='STRING'&&depth===0)break;
}
if(p.value==='(')depth++;
if(p.value===')')depth--;
if(p.value===','&&depth===0){
next();
emit(isLPrint?0x77:0x72);
suppressNewline=true;
continue;
}
if(p.value===';'&&depth===0){
next();
suppressNewline=true;
continue;
}
var exprType=parseExpression();
if(!isLPrint){
if(exprType===0)emit(0x6F);
else if(exprType===1)emit(0x70);
else emit(0x71);
}else {
if(exprType===0)emit(0x74);
else if(exprType===1)emit(0x75);
else emit(0x76);
}
suppressNewline=false;
}
if(!suppressNewline){
emit(isLPrint?0x78:0x73);
}
}else if(t.value==='IF'){
var exprType=parseExpression();
if(exprType===1){
emit(0x23);emitFloat(0.0);
emit(0x3A);
exprType=0;
}
emit(0x7E);
var fixupAddr=emitFixup();
fixups.push({addr:fixupAddr,type:'IF'});
}else if(t.value==='ELSE'){
emit(0x51);
var elseFixup=emitFixup();
var ifFixup=fixups.pop();
if(ifFixup&&ifFixup.type==='IF'){
patchFixup(ifFixup.addr,qcode.length);
}
fixups.push({addr:elseFixup,type:'ELSE'});
}else if(t.value==='ELSEIF'){
emit(0x51);
var endFixup=emitFixup();
var prevCondFixup=fixups.pop();
if(prevCondFixup&&(prevCondFixup.type==='IF'||prevCondFixup.type==='ELSEIF')){
patchFixup(prevCondFixup.addr,qcode.length);
}else {
if(prevCondFixup)fixups.push(prevCondFixup);
}
fixups.push({addr:endFixup,type:'ENDIF_MERGE'});
var exprType=parseExpression();
if(exprType===1){
emit(0x23);emitFloat(0.0);
emit(0x3A);
exprType=0;
}
emit(0x7E);
var fixupAddr=emitFixup();
fixups.push({addr:fixupAddr,type:'IF'});
}else if(t.value==='ENDIF'){
var fixup=fixups.pop();
if(fixup){
patchFixup(fixup.addr,qcode.length);
}
while(fixups.length>0&&fixups[fixups.length-1].type==='ENDIF_MERGE'){
fixup=fixups.pop();
patchFixup(fixup.addr,qcode.length);
}
}else if(t.value==='WHILE'){
var startAddr=qcode.length;
loops.push({start:startAddr,type:'WHILE',breaks:[]});
var exprType=parseExpression();
if(exprType===1){
emit(0x23);emitFloat(0.0);
emit(0x3A);
exprType=0;
}
emit(0x7E);
var fixupAddr=emitFixup();
fixups.push({addr:fixupAddr,type:'WHILE'});
}else if(t.value==='ENDWH'){
var loop=loops.pop();
var fixup=fixups.pop();
emit(0x51);
var offset=loop.start-qcode.length;
emitWord(offset);
patchFixup(fixup.addr,qcode.length);
for(var k=0;k<loop.breaks.length;k++){
patchFixup(loop.breaks[k],qcode.length);
}
}else if(t.value==='DO'){
loops.push({start:qcode.length,type:'DO',breaks:[],continues:[]});
}else if(t.value==='UNTIL'){
var loop=loops.pop();
if(!loop||loop.type!=='DO')error("UNTIL without DO");
for(var k=0;k<loop.continues.length;k++){
patchFixup(loop.continues[k],qcode.length);
}
var exprType=parseExpression();
if(exprType===1){
emit(0x23);emitFloat(0.0);
emit(0x3A);
exprType=0;
}
emit(0x7E);
var offset=loop.start-qcode.length;
emitWord(offset);
for(var k=0;k<loop.breaks.length;k++){
patchFixup(loop.breaks[k],qcode.length);
}
}else if(t.value==='BREAK'){
if(loops.length===0)error("BREAK outside loop");
var loop=loops[loops.length-1];
emit(0x51);
var addr=emitFixup();
loop.breaks.push(addr);
}else if(t.value==='CONTINUE'){
if(loops.length===0)error("CONTINUE outside loop");
var loop=loops[loops.length-1];
if(loop.type==='WHILE'){
emit(0x51);
var offset=loop.start-qcode.length;
emitWord(offset);
}else if(loop.type==='DO'){
emit(0x51);
var addr=emitFixup();
loop.continues.push(addr);
}
}else if(t.value==='POKEB'||t.value==='POKEW'){
var addrType=parseExpression();
if(addrType!==0)throw new Error("Error on line "+t.line+": "+t.value+" address must be an integer (-32768 to 32767)");
expect(',');
parseExpression();
emitCommand(t.value==='POKEB'?0x55:0x56);
}else if(t.value==='PAUSE'){
parseExpression();
emitCommand(0x54);
}else if(t.value==='BEEP'){
parseExpression();
expect(',');
parseExpression();
emitCommand(0x4D);
}else if(t.value==='AT'){
parseExpression();
expect(',');
parseExpression();
emitCommand(0x4C);
}else if(t.value==='CLS'){
emitCommand(0x4E);
}else if(t.value==='STOP'){
emitCommand(0x59);
}else if(t.value==='TRAP'){
pendingTrap=true;
}else if(t.value==='ESCAPE'){
var nextT=next();
emitCommand(0x50);
if(nextT.value==='ON'){emit(0x01);}
else if(nextT.value==='OFF'){emit(0x00);}
else error("ESCAPE requires ON or OFF");
}else if(t.value==='CURSOR'){
var nextT=next();
emitCommand(0x4F);
if(nextT.value==='ON'){emit(0x01);}
else if(nextT.value==='OFF'){emit(0x00);}
else error("CURSOR requires ON or OFF");
}else if(t.value==='RANDOMIZE'){
var type=parseExpression();
if(type===0)emit(0x86);
emitCommand(0x58);
}else if(t.value==='RAISE'){
parseExpression();
emitCommand(0x57);
}else if(t.value==='OFF'){
var hasArg=false;
var p=peek();
if(p&&(p.type==='INTEGER'||p.type==='FLOAT'||p.type==='HEX'||p.value==='('||(p.type==='IDENTIFIER'&&activeKeywords.indexOf(p.value)===-1))){
hasArg=true;
}
if(hasArg){
parseExpression();
emitCommand(0xD2);
}else {
emitCommand(0x52);
}
}else if(t.value==='DISP'){
expect('(');
parseExpression();
expect(',');
parseExpression();
expect(')');
emitCommand(0x8D);
emit(0x83);
}else if(t.value==='COPYW'){
parseExpression();
expect(',');
parseExpression();
emitCommand(0xD3);
}else if(t.value==='DELETE'){
parseExpression();
emitCommand(0x5F);
}else if(t.value==='DELETEW'){
parseExpression();
emitCommand(0xD4);
}else if(t.value==='INPUT'){
var tVar=next();
if(!tVar||tVar.type!=='IDENTIFIER')error("INPUT expects variable");
var targetName=tVar.value.toUpperCase();
if(peek()&&peek().value==='.'){
var logChar=targetName;
if(logChar.length===1&&['A','B','C','D'].includes(logChar)){
next();
var fTok=next();
if(fTok&&fTok.type==='IDENTIFIER'){
var fName=fTok.value.toUpperCase();
var logVal=logChar.charCodeAt(0)-65;
var type=1;
if(fName.endsWith('%'))type=0;
else if(fName.endsWith('$'))type=2;
emit(0x24);
emit(fName.length);
for(var k=0;k<fName.length;k++)emit(fName.charCodeAt(k));
emit(0x1D+type);
emit(logVal);
if(type===0)emitCommand(0x6C);
else if(type===1)emitCommand(0x6D);
else if(type===2)emitCommand(0x6E);
continue;
}
}
}
var hasIndices=(peek()&&peek().value==='(');
if(hasIndices){
next();
while(true){
parseExpression();
if(peek()&&peek().value===','){next();continue;}
if(peek()&&peek().value===')')break;
break;
}
expect(')');
}
var sym=getSymbol(targetName,hasIndices);
if(!sym){
var suffix=targetName.slice(-1);
var type=1;
if(suffix==='%')type=0;
else if(suffix==='$')type=2;
sym={name:targetName,type:type,isExtern:true,index:externals.length};
if(hasIndices){
if(type===0)sym.type=3;else if(type===1)sym.type=4;else if(type===2)sym.type=5;
}
externals.push(sym);
addSymbol(sym);
}
var type=sym.type;
var baseType=type;
if(hasIndices){
if(type>=3)baseType-=3;
}else {
}
var addrOpBase=(sym.isExtern)?0x14:0x0D;
emit(addrOpBase+type);
if(sym.isExtern){
if(sym.offset!==undefined)emitWord(sym.offset);
else emitWord(sym.index);
}else {
emitWord(sym.offset);
}
if(baseType===0)emitCommand(0x6C);
else if(baseType===1)emitCommand(0x6D);
else if(baseType===2)emitCommand(0x6E);
else emitCommand(0x6D);
}else if(t.value==='CREATE'||t.value==='OPEN'){
var isCreate=(t.value==='CREATE');
var opcode=isCreate?0x5E:0x65;
parseExpression();
emitCommand(opcode);
expect(',');
var logVal=0;
var consumedLog=false;
var tNext=peek();
if(tNext&&tNext.type==='IDENTIFIER'){
var val=tNext.value.toUpperCase();
if(['A','B','C','D'].includes(val)&&val.length===1){
next();
logVal=val.charCodeAt(0)-65;
consumedLog=true;
}
}
emit(logVal);
var firstField=true;
while(true){
if(firstField&&!consumedLog){
var p=peek();
if(!p||p.type==='EOL'||p.value===':')break;
}else {
if(peek()&&peek().value===','){
next();
}else {
if(consumedLog&&firstField)error("Expected ',' after logical name");
break;
}
}
var fToken=next();
if(fToken&&fToken.type==='IDENTIFIER'){
var fName=fToken.value.toUpperCase();
var type=1;
var suffix=fName.slice(-1);
if(suffix==='%'){type=0;}
else if(suffix==='$'){type=2;}
emit(type);
emit(fName.length);
for(var k=0;k<fName.length;k++)emit(fName.charCodeAt(k));
firstField=false;
}
}
emit(0x88);
}else if(t.value==='VIEW'){
expect('(');
parseExpression();
expect(',');
parseExpression();
expect(')');
emitCommand(0xA0);
emit(0x83);
}else if(t.value==='MENU'){
parseExpression();emitCommand(0x98);
}else if(t.value==='KSTAT'){
parseExpression();emitCommand(0x6A);
}else if(t.value==='CLOCK'){
expect('(');
parseExpression();
expect(')');
emitCommand(0xD6);emit(0x83);
}else if(t.value==='EDIT'){
var tVar=next();
if(tVar.type!=='IDENTIFIER')error("EDIT expects variable");
var targetName=tVar.value.toUpperCase();
if(peek()&&peek().value==='.'){
var logChar=targetName;
if(logChar.length===1&&['A','B','C','D'].includes(logChar)){
next();
var fTok=next();
if(fTok&&fTok.type==='IDENTIFIER'){
var fName=fTok.value.toUpperCase();
var logVal=logChar.charCodeAt(0)-65;
var type=1;
if(fName.endsWith('%'))type=0;
else if(fName.endsWith('$'))type=2;
emit(0x24);
emit(fName.length);
for(var k=0;k<fName.length;k++)emit(fName.charCodeAt(k));
emit(0x1D+type);
emit(logVal);
emitCommand(0x6B);
continue;
}
}
}
var hasIndices=(peek()&&peek().value==='(');
if(hasIndices){
next();
while(true){
parseExpression();
if(peek()&&peek().value===','){next();continue;}
if(peek()&&peek().value===')')break;
break;
}
expect(')');
}
var sym=getSymbol(targetName,hasIndices);
if(!sym){
sym={name:targetName,type:1,isExtern:true,index:externals.length};
var suffix=targetName.slice(-1);
if(suffix==='%')sym.type=0;
else if(suffix==='$')sym.type=2;
if(hasIndices){
if(sym.type===0)sym.type=3;
else if(sym.type===1)sym.type=4;
else if(sym.type===2)sym.type=5;
}
externals.push(sym);
addSymbol(sym);
}
var type=sym.type;
if(hasIndices){
if(type===0)type=3;
else if(type===1)type=4;
else if(type===2)type=5;
}
if(sym.isGlobal||sym.isLocal){
emit(0x0D+type);
emitWord(sym.offset);
}else if(sym.isExtern){
emit(0x14+type);
if(sym.offset!==undefined)emitWord(sym.offset);
else emitWord(sym.index);
}
emitCommand(0x6B);
}else if(t.value==='USE'){
var arg=next();
var val=0;
if(arg&&arg.type==='IDENTIFIER'){
var name=arg.value.toUpperCase();
if(name==='B')val=1;
else if(name==='C')val=2;
else if(name==='D')val=3;
}
emitCommand(0x69);
emit(val);
}else if(t.value==='APPEND'){
emitCommand(0x5B);
}else if(t.value==='UPDATE'){
emitCommand(0x68);
}else if(t.value==='FIRST'){
emitCommand(0x61);
}else if(t.value==='LAST'){
emitCommand(0x62);
}else if(t.value==='NEXT'){
emitCommand(0x63);
}else if(t.value==='BACK'){
emitCommand(0x64);
}else if(t.value==='EXT'){
var exprType=parseExpression();
if(peek()&&(peek().type==='INTEGER'||peek().type==='HEX')){
var val=next().value;
if(val<0||val>255)error("EXT argument out of range");
emit(0xED);emit(val);
}else {
error("EXT requires byte constant");
}
}else if(t.value==='CLOSE'){
emitCommand(0x5C);
}else if(t.value==='DELETE'){
parseExpression();
emitCommand(0x5F);
}else if(t.value==='POSITION'){
parseExpression();emitCommand(0x66);
}else if(t.value==='ERASE'){
emitCommand(0x60);
}else if(t.value==='RENAME'){
parseExpression();expect(',');
parseExpression();emitCommand(0x67);
}else if(t.value==='COPY'){
parseExpression();expect(',');
parseExpression();emitCommand(0x5D);
}else if(t.value==='GOTO'){
emit(0x51);
var fixupAddr=emitFixup();
var labelName=peek().value;
if(labelName.length>8)throw new Error("Error on line "+t.line+": Invalid Label '"+labelName+"' (Max 8 chars)");
if(!/^[A-Za-z][A-Za-z0-9]*$/.test(labelName))throw new Error("Error on line "+t.line+": Invalid Label '"+labelName+"' (Alphanumeric only)");
labelFixups.push({addr:fixupAddr,name:labelName.toUpperCase(),line:t.line});
next();
if(peek()&&peek().value===':')next();else throw new Error("Error on line "+t.line+": Expected '::'");
if(peek()&&peek().value===':')next();else throw new Error("Error on line "+t.line+": Expected '::'");
}else if(t.value==='ONERR'){
if(peek()&&peek().value==='OFF'){
next();
emit(0x53);emit(0x00);emit(0x00);
}else {
emit(0x53);
var fixupAddr=emitFixup();
var labelName=peek().value;
if(labelName.length>8)throw new Error("Error on line "+t.line+": Invalid Label '"+labelName+"' (Max 8 chars)");
if(!/^[A-Za-z][A-Za-z0-9]*$/.test(labelName))throw new Error("Error on line "+t.line+": Invalid Label '"+labelName+"' (Alphanumeric only)");
labelFixups.push({addr:fixupAddr,name:labelName.toUpperCase(),line:t.line});
next();
if(peek()&&peek().value===':')next();else throw new Error("Error on line "+t.line+": Expected '::'");
if(peek()&&peek().value===':')next();else throw new Error("Error on line "+t.line+": Expected '::'");
}
}else if(t.value==='UDG'){
for(var u=0;u<9;u++){
parseExpression();
if(u<8){
expect(',');
}
}
emitCommand(0xD5);
}else if(t.value==='OFF'){
parseExpression();emitCommand(0xD2);
}else if(t.value==='COPYW'){
parseExpression();expect(',');
parseExpression();emitCommand(0xD3);
}else if(t.value==='DELETEW'){
parseExpression();emitCommand(0xD4);
}else if(t.value==='RETURN'){
if(peek()&&(peek().type==='EOL'||peek().value===':')){
emit(0x7B);
}else {
var pType=parseType(procName);
if(peek().type==='INTEGER'&&peek().value===0){
if(pType===1){
var exprType=parseExpression();
if(exprType===0)emit(0x86);
emit(0x79);
}else {
next();
emit(0x7A);
}
}else if(peek().type==='FLOAT'&&peek().value===0){
next();
if(pType===0){
emit(0x7A);
}else {
emit(0x23);
emitFloat(0.0);
emit(0x79);
}
}else if(peek().type==='STRING'&&peek().value===""){
next();emit(0x7C);
}else {
var exprType=parseExpression();
if(pType===1&&exprType===0)emit(0x86);
else if(pType===0&&exprType===1)emit(0x87);
emit(0x79);
}
}
}else {
emit(0x7B);
}
}else if(t.type==='IDENTIFIER'){
var isCall=false;
var isLabel=false;
var isAssign=false;
var hasIndices=false;
if(peek()&&peek().value==='='){
isAssign=true;
}else if(peek()&&peek().value==='('){
var p=ptr;
var depth=0;
while(p<tokens.length){
if(tokens[p].value==='(')depth++;
else if(tokens[p].value===')')depth--;
p++;
if(depth===0)break;
}
if(p<tokens.length&&tokens[p].value==='='){
isAssign=true;
hasIndices=true;
}
}
if(!isAssign){
if(peek()&&peek().value==='.'){
var logChar=t.value.toUpperCase();
if(logChar.length===1&&['A','B','C','D'].includes(logChar)){
next();
var fTok=next();
if(fTok&&fTok.type==='IDENTIFIER'){
var fName=fTok.value.toUpperCase();
var logVal=logChar.charCodeAt(0)-65;
var type=1;
if(fName.endsWith('%'))type=0;
else if(fName.endsWith('$'))type=2;
emit(0x24);
emit(fName.length);
for(var k=0;k<fName.length;k++)emit(fName.charCodeAt(k));
if(peek()&&peek().value==='='){
next();
emit(0x1D+type);
emit(logVal);
var rhsType=parseExpression();
if(type===0&&rhsType===1)emit(0x87);
else if(type===1&&rhsType===0)emit(0x86);
emit(0x7F+type);
}else {
emit(0x1A+type);
emit(logVal);
if(type===0)emit(0x83);
else if(type===2)emit(0x85);
else emit(0x84);
}
continue;
}
}
}
if(peek()&&peek().value===':'){
next();
if(peek()&&peek().value===':'){
next();
isLabel=true;
labels[t.value.toUpperCase()]=qcode.length;
}
else {
if(t.value.toUpperCase()===procName.toUpperCase()){
if(peek()&&peek().value==='('){
isCall=true;
}else {
isCall=true;
}
}
else isCall=true;
}
}else {
if(peek()&&peek().value==='('){
if(targetSystem==='Standard'){
isCall=false;
}else {
isCall=true;
}
}else {
var upper=t.value.toUpperCase();
var op=activeOpcodes[upper];
if(op&&QCODE_DEFS[op]&&QCODE_DEFS[op].pops===''){
isCall=true;
}else {
error("Procedure call '"+t.value+"' must be followed by ':' or have arguments");
}
}
}
}
if(isLabel)continue;
if(isAssign){
var targetName=t.value.toUpperCase();
if (/^M[0-9]$/.test(targetName)){
if(peek()&&peek().value==='(')throw new Error("Error on line "+t.line+": Calculator memory '"+targetName+"' cannot have indices.");
next();
var rhsType=parseExpression();
if(rhsType===0)emit(0x86);
var memIdx=parseInt(targetName.substring(1),10);
emit(0x13);
emitWord(memIdx*8);
emit(0x80);
continue;
}
var sym=getSymbol(targetName,hasIndices);
if(!sym){
var suffix=targetName.slice(-1);
var type=1;
if(suffix==='%')type=0;
else if(suffix==='$')type=2;
if(hasIndices){
if(type===0)type=3;
else if(type===1)type=4;
else if(type===2)type=5;
}
var varSize=8;
if(type===0)varSize=2;
else if(type===1)varSize=8;
else varSize=2;
implOffset-=varSize;
var finalOffset=implOffset;
sym={
name:targetName,
type:type,
index:externals.length,
offset:finalOffset,
isExtern:true,
dims:[]
};
addSymbol(sym);
externals.push(sym);
}
if(sym){
if(hasIndices){
next();
while(true){
parseExpression();
if(peek()&&peek().value===','){next();continue;}
if(peek()&&peek().value===')'){next();break;}
break;
}
}
if(sym.isGlobal||sym.isLocal){
emit(0x0D+sym.type);
emitWord(sym.offset);
}else if(sym.isExtern){
emit(0x14+sym.type);
if(sym.offset!==undefined)emitWord(sym.offset);
else emitWord(sym.index);
}
next();
var rhsType=parseExpression();
var baseType=sym.type;
if(baseType>=3)baseType-=3;
if(baseType===0&&rhsType===1){
emit(0x87);
}else if(baseType===1&&rhsType===0){
emit(0x86);
}
emit(0x7F+baseType);
}
}else if(isCall){
var procCallName=t.value;
var upperName=procCallName.toUpperCase();
var returnType=1;
if(procCallName.endsWith('%'))returnType=0;
else if(procCallName.endsWith('$'))returnType=2;
var builtinOp=activeOpcodes[upperName];
if(builtinOp){
var intBuiltins=[
'GET','KEY','POS','COUNT','EOF','ERR','DAY','HOUR','MINUTE','MONTH','SECOND','YEAR',
'FREE','RECSIZE','FIND','LEN','LOC','ASC','ADDR','VIEW','PEEKB','PEEKW','USR','DOW','WEEK','FDAYS','EXIST',
'CLOCK','FINDW','MENUN'
];
if(intBuiltins.includes(upperName))returnType=0;
if(upperName.endsWith('$'))returnType=2;
}
var argTypes=[];
if(peek()&&peek().value==='('){
next();
while(true){
var tArg=parseExpression();
if(!builtinOp){
emit(0x20);emit(tArg);
}
argTypes.push(tArg);
if(peek()&&peek().value===','){next();continue;}
if(peek()&&peek().value===')'){next();break;}
break;
}
}
var argCount=argTypes.length;
if(builtinOp){
emit(builtinOp);
}else {
emit(0x20);emit(argCount);
emit(0x7D);
emit(procCallName.length);
for(var k=0;k<procCallName.length;k++){
emit(procCallName.charCodeAt(k));
}
}
if(returnType===0)emit(0x83);
else if(returnType===2)emit(0x85);
else emit(0x84);
}
if((isAssign||isCall)&&!isLabel){
if(peek()&&peek().type!=='EOL'&&peek().value!==':'){
throw new Error("Error on line "+t.line+": Missing separator between statements (found '"+peek().value+"')");
}
}
}else {
if(t.type!=='EOL'&&t.value!==undefined){
throw new Error("Error on line "+t.line+": Unexpected token '"+t.value+"'");
}
}
}
if(qcode[qcode.length-1]!==0x7A&&
qcode[qcode.length-1]!==0x7B&&
qcode[qcode.length-1]!==0x7C&&
qcode[qcode.length-1]!==0x79){
emit(0x7B);
}
if(loops.length>0)error("Unclosed loop (DO/WHILE) at end of file");
var unclosedIfs=fixups.filter(function (f){return f.type==='IF'||f.type==='ELSE'||f.type==='ELSEIF';});
if(unclosedIfs.length>0)error("Unclosed IF block at end of file");
for(var i=0;i<labelFixups.length;i++){
var f=labelFixups[i];
if(labels[f.name.toUpperCase()]!==undefined){
patchFixup(f.addr,labels[f.name.toUpperCase()]);
}else {
throw new Error("Error on line "+f.line+": Label reference error: Label '"+f.name+"' not found");
}
}
var globalTable=[];
for(var i=0;i<globals.length;i++){
var g=globals[i];
globalTable.push(g.name.length);
for(var k=0;k<g.name.length;k++)globalTable.push(g.name.charCodeAt(k));
globalTable.push(g.type);
globalTable.push((g.offset>>8)&0xFF,g.offset&0xFF);
}
var externalTable=[];
for(var i=0;i<externals.length;i++){
var e=externals[i];
externalTable.push(e.name.length);
for(var k=0;k<e.name.length;k++)externalTable.push(e.name.charCodeAt(k));
externalTable.push(e.type);
}
var paramBlockSize=1+params.length;
var headerBlockSize=4;
var strFixupTable=[];
var strFixupData=[];
for(var i=0;i<strFixups.length;i++){
var f=strFixups[i];
strFixupData.push((f.addr>>8)&0xFF,f.addr&0xFF,f.len&0xFF);
}
strFixupTable.push((strFixupData.length>>8)&0xFF,strFixupData.length&0xFF);
strFixupTable=strFixupTable.concat(strFixupData);
var arrFixupTable=[];
var arrFixupData=[];
for(var i=0;i<arrFixups.length;i++){
var f=arrFixups[i];
arrFixupData.push((f.addr>>8)&0xFF,f.addr&0xFF,(f.len>>8)&0xFF,f.len&0xFF);
}
arrFixupTable.push((arrFixupData.length>>8)&0xFF,arrFixupData.length&0xFF);
arrFixupTable=arrFixupTable.concat(arrFixupData);
var fixupTable=strFixupTable.concat(arrFixupTable);
var globalOff=headerBlockSize+paramBlockSize;
var externOff=globalOff+2 + globalTable.length;
var fixupOff=externOff+2 + externalTable.length;
var qcodeOff=fixupOff+fixupTable.length;
var sourceOff=qcodeOff+qcode.length;
if(varSpaceSize<2)varSpaceSize=2;
var output=[];
output.push((varSpaceSize>>8)&0xFF,varSpaceSize&0xFF);
output.push((qcode.length>>8)&0xFF,qcode.length&0xFF);
output.push(params.length&0xFF);
for(var i=params.length-1;i>=0;i--)output.push(params[i]);
output.push((globalTable.length>>8)&0xFF,globalTable.length&0xFF);
output=output.concat(globalTable);
output.push((externalTable.length>>8)&0xFF,externalTable.length&0xFF);
output=output.concat(externalTable);
output=output.concat(fixupTable);
output=output.concat(qcode);
return new Uint8Array(output);
}catch(e){
if(e.message&&e.message.indexOf("Error on line")===-1){
var currentLine="?";
if(tokens&&tokens[ptr]&&tokens[ptr].line){
currentLine=tokens[ptr].line;
}else if(tokens&&tokens.length>0){
currentLine=tokens[tokens.length-1].line;
}
throw new Error("Error on line "+currentLine+": "+e.message);
}
throw e;
}
}
function tokenizer(s){
try{
return tokenize(s);
}catch(e){
return [];
}
}
return {
compile:compile
};
})();
if(typeof window!=='undefined'){
window.OPLCompiler=OPLCompiler;
}
if(typeof module!=='undefined'){
module.exports=OPLCompiler;
}