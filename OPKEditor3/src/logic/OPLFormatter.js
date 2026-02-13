'use strict';


var OPLFormatter={


format:function (content,indentSize){
if(!content)return "";
indentSize=indentSize||2;
var indentString=" ".repeat(indentSize);

var KEYWORDS=[
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

var lines=content.split('\n');
var formattedLines=[];
var indentLevel=0;
var foundFirstCodeLine=false;








for(var i=0;i<lines.length;i++){
var originalLine=lines[i].trim();
if(!originalLine){
formattedLines.push("");
continue;
}






var upperLine=originalLine.toUpperCase();
var codePart=originalLine;
var commentPart="";
var remIndex=-1;








var preDedent=false;
var postIndent=false;












var maskedLine=this._maskStrings(codePart);
var processedLine=codePart;


if(!maskedLine.trim().startsWith("REM")){









}



if(this._startsWithKeyword(maskedLine,"ENDP")||
this._startsWithKeyword(maskedLine,"ENDWH")||
this._startsWithKeyword(maskedLine,"ENDIF")||
this._startsWithKeyword(maskedLine,"UNTIL")||
this._startsWithKeyword(maskedLine,"ELSE")||
this._startsWithKeyword(maskedLine,"ELSEIF")){
indentLevel--;
}


var isFirstCodeLine=false;
if(!foundFirstCodeLine){
foundFirstCodeLine=true;
isFirstCodeLine=true;
indentLevel=0;
}

if(indentLevel<0)indentLevel=0;


var currentIndent=" ".repeat(indentLevel*indentSize);





var spacedLine=this._formatSpacing(originalLine,KEYWORDS);


if(this._startsWithKeyword(maskedLine,"IF")){
if(formattedLines.length>0&&formattedLines[formattedLines.length-1].trim()!==""){

if(!this._startsWithKeyword(this._maskStrings(lines[i-1]||""),"ELSE")&&
!this._startsWithKeyword(this._maskStrings(lines[i-1]||""),"ELSEIF")){
formattedLines.push("");
}
}
}

formattedLines.push(currentIndent+spacedLine);




if (/\bENDIF\b/i.test(maskedLine)||
                /\bENDWH\b/i.test(maskedLine)||
                /\bUNTIL\b/i.test(maskedLine)){
if(i+1<lines.length&&lines[i+1].trim()!==""){
formattedLines.push("");
}
}



if(this._startsWithKeyword(maskedLine,"LOCAL")||this._startsWithKeyword(maskedLine,"GLOBAL")){

var nextLine=(i+1<lines.length)?lines[i+1].trim():"";
var nextMasked=this._maskStrings(nextLine).toUpperCase();

if(!this._startsWithKeyword(nextMasked,"LOCAL")&&
!this._startsWithKeyword(nextMasked,"GLOBAL")&&
nextLine!==""){
formattedLines.push("");
}
}



if(isFirstCodeLine||
(this._startsWithKeyword(maskedLine,"DO")&&!/\bUNTIL\b/i.test(maskedLine))||
(this._startsWithKeyword(maskedLine,"WHILE")&&!/\bENDWH\b/i.test(maskedLine))||
(this._startsWithKeyword(maskedLine,"IF")&&!/\bENDIF\b/i.test(maskedLine))||
this._startsWithKeyword(maskedLine,"ELSE")||
this._startsWithKeyword(maskedLine,"ELSEIF")){











indentLevel++;
}
}

return formattedLines.join('\n');
},


minify:function (content){
if(!content)return "";
var lines=content.split('\n');
var minifiedLines=[];

for(var i=0;i<lines.length;i++){
var line=lines[i].trim();
if(!line)continue;





var minified=this._minifyLine(line);
minifiedLines.push(minified);
}

return minifiedLines.join('\n');
},


removeComments:function (content){
if(!content)return "";
var lines=content.split('\n');
var cleanLines=[];

for(var i=0;i<lines.length;i++){
var line=lines[i];
var trimmed=line.trim();
if(!trimmed){
cleanLines.push(line);
continue;
}









var parts=line.split('"');
var newLine="";
var hasCode=false;

for(var j=0;j<parts.length;j++){
var segment=parts[j];
if(j%2===1){

newLine+='"'+segment+'"';
}else {

var remIndex=segment.toUpperCase().indexOf("REM");
if(remIndex!==-1){


var beforeRem=segment.substring(0,remIndex);
newLine+=beforeRem;

break;
}else {
newLine+=segment;
}
}
}







if(!newLine.trim()){





}else {



var cleaned=newLine.trimEnd();









while(cleaned.length>0&&cleaned.slice(-1)===':'&&cleaned.slice(-2)!=='::'){



if (/^\s*[a-zA-Z0-9%$]+\s*:\s*$/.test(cleaned)){
break;
}

cleaned=cleaned.substring(0,cleaned.length-1).trimEnd();
}

cleanLines.push(cleaned);
}
}

return cleanLines.join('\n');
},



_maskStrings:function (line){

return line.replace(/"[^"]*"/g,'""');
},

_startsWithKeyword:function (line,keyword){

var re=new RegExp("^"+keyword+"\\b","i");
return re.test(line);
},

_formatSpacing:function (line,keywords){

var result="";
var inString=false;
var i=0;
var len=line.length;





while(i<len){
var c=line[i];

if(c==='"'){
if(!inString){





var ptr=i-1;
while(ptr>=0&& /\s/.test(line[ptr]))ptr--;
var prevChar=(ptr>=0)?line[ptr]:"";







var isAlpha = /[a-zA-Z0-9%$]/.test(prevChar);


var hasSpaceEnd = /\s$/.test(result);

if(isAlpha&&!hasSpaceEnd){
result+=" ";
}

inString=true;
result+=c;
i++;
continue;
}else {

result+=c;
inString=false;





var ptr=i+1;

if(ptr<len){
var nextChar=line[ptr];



if (/[a-zA-Z0-9%$]/.test(nextChar)){
result+=" ";
}
}
i++;
continue;
}
}

if(inString){
result+=c;
i++;
continue;
}


var c2=line.substring(i,i+2);
if(["<=",">=","<>","**"].includes(c2)){
result+=" "+c2+" ";
i+=2;
continue;
}


if(c2==="::"){
result+=":: ";

i+=2;
continue;
}


if(["=","+","-","*","/","<",">"].includes(c)){



result+=" "+c + " ";
i++;
continue;
}

if(c===':'){






var ptr=i-1;
while(ptr>=0&& /\s/.test(line[ptr]))ptr--;

var endWord=ptr;
while(ptr>=0&& /[a-zA-Z0-9%$]/.test(line[ptr]))ptr--;
var startWord=ptr+1;

var word=(endWord>=startWord)?line.substring(startWord,endWord+1).toUpperCase():"";

var isKeyword=(keywords&&keywords.indexOf(word)!==-1);


var hadSpace = /\s/.test(line.substring(endWord+1,i));


if(isKeyword||hadSpace){
result+=" :";
}else {
result+=":";
}



var nextChar='';
if(i+1<len)nextChar=line[i+1];








var peek=i+1;
while(peek<len&& /\s/.test(line[peek]))peek++;
var effectiveNext=(peek<len)?line[peek]:"";

if(effectiveNext==='('){

}else {
result+=" ";
}

i++;
continue;
}

if([","].includes(c)){
result+=c+" ";
i++;
continue;
}

result+=c;
i++;
}








result=result.replace(/\b(IF|ELSEIF|WHILE)\s*\(/gi,'$1 (');


result=result.replace(/\)\s*(AND|OR|NOT)\s*\(/gi,') $1 (');

return this._cleanMultiSpaces(result);
},

_cleanMultiSpaces:function (text){
var parts=text.split('"');
for(var i=0;i<parts.length;i+=2){

parts[i]=parts[i].replace(/\s+/g,' ');
}
return parts.join('"').trim();
},


compress:function (content){
if(!content)return "";
var noComments=this.removeComments(content);
return this.minify(noComments);
},

_minifyLine:function (line){

var parts=line.split('"');
for(var i=0;i<parts.length;i+=2){
var s=parts[i];

s=s.replace(/\s+/g,' ');



s=s.replace(/\s*([=+\-*/<>!&|])\s*/g,'$1');


s=s.replace(/\s*,\s*/g,',');


s=s.replace(/([a-zA-Z0-9%$])\s+\(/g,'$1(');

s=s.replace(/\(\s+/g,'(');
s=s.replace(/\s+\)/g,')');








s=s.replace(/([a-zA-Z0-9%$])\s+:(?!:)/g,'$1 :');


s=s.replace(/([a-zA-Z0-9])\s+::/g,'$1::');




s=s.replace(/([^a-zA-Z0-9:%$])\s+:/g,'$1:');


s=s.replace(/^\s+:/g,':');


s=s.replace(/:\s+(?!:)/g,':');





parts[i]=s.trim();
}
return parts.join('"');
}

};


if(typeof window!=='undefined')window.OPLFormatter=OPLFormatter;
if(typeof module!=='undefined')module.exports=OPLFormatter;