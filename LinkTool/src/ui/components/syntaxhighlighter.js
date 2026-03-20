'use strict';

var SyntaxHighlighter={

keywordCategories:{
functions:[
"ABS","ADDR","ASC","ATAN",
"COS","COUNT",
"DAY","DEG","DISP",
"EOF","ERR","EXIST","EXP",
"FIND","FLT","FREE",
"GET",
"HOUR",
"IABS","INT","INTF",
"KEY","KMOD",
"LEN","LN","LOC","LOG",
"MENU","MINUTE","MONTH",
"PEEKB","PEEKW","PI","POS",
"RAD","REC","RECSIZE","RECSZ","RND",
"SECOND","SIN","SPACE","SQR",
"TAN",
"USR",
"VAL","VIEW",
"YEAR"
],
commands:[
"AND","APP","APPEND","AT","BACK",
"BEEP","BREAK",
"CLOSE","CLS","CONST","CONTINUE","COPY","COPYW","CREATE","CURSOR",
"DELETE","DELETEW","DO",
"EDIT","ELSE","ELSEIF","ENDA","ENDIF","ENDP","ENDWH","ERASE","ESCAPE","EXT",
"FIRST",
"GLOBAL","GOTO",
"IF","INCLUDE","INPUT",
"KSTAT",
"LAST","LOADM","LOCAL","LOPEN","LPRINT",
"NEXT","NOT",
"OFF","ON","ONERR","OPEN","OR",
"PAUSE","POKEB","POKEW","POSITION","PRINT","PROC",
"RAISE","RANDOMIZE","REM","RENAME","RETURN",
"SCREEN","STOP",
"TRAP",
"UNLOADM","UNTIL","UPDATE","USE",
"VECTOR",
"WHILE"
],
stringFuncs:[
"CHR$",
"DATIM$","DIR$",
"ERR$",
"FIX$",
"GEN$","GET$",
"HEX$",
"KEY$","KEYS",
"LEFT$","LOWER$",
"MID$",
"NUM$",
"REPT$","RIGHT$",
"SCI$",
"UPPER$","USR$"
]
},


lzKeywords:{
functions:[
"ACOS","ASIN",
"DAYS",
"DOW",
"FINDW",
"MAX","MEAN","MENUN","MIN",
"STD","SUM",
"VAR",
"WEEK"
],
commands:[
"CLOCK","UDG"
],
stringFuncs:[
"DAYNAME$","DIRW$",
"MONTH$"
]
},


keywordMap:null,
currentTargetSystem:null,

init:function (targetSystem){
targetSystem=targetSystem||'Standard';


if(this.keywordMap&&this.currentTargetSystem===targetSystem)return;

this.keywordMap={};
this.currentTargetSystem=targetSystem;

var self=this;

function addKeywords(list,type){
for(var i=0;i<list.length;i++){
self.keywordMap[list[i]]=type;
}
}


addKeywords(this.keywordCategories.functions,'kw-functions');
addKeywords(this.keywordCategories.commands,'kw-commands');
addKeywords(this.keywordCategories.stringFuncs,'kw-stringfuncs');


if(targetSystem==='LZ'){
addKeywords(this.lzKeywords.functions,'kw-functions');
addKeywords(this.lzKeywords.commands,'kw-commands');
addKeywords(this.lzKeywords.stringFuncs,'kw-stringfuncs');
}
},

highlight:function (code,targetSystem){
if(!code)return "";


this.init(targetSystem);


function escapeHtml(text){
return text
.replace(/&/g,"&amp;")
.replace(/</g,"&lt;")
.replace(/>/g,"&gt;")
.replace(/"/g,"&quot;")
.replace(/'/g,"&#039;");
}

var lines=code.split('\n');
var output="";
var bracketLevel=0;

for(var i=0;i<lines.length;i++){
var line=lines[i];
var highlightedLine="";
var j=0;
var isCommandPosition=true;
var expectingOperator=false;

while(j<line.length){
var char=line[j];



if(char==='\''||(line.substr(j,3).toUpperCase()==="REM"&&(j===0|| /[\s:]/.test(line[j-1]))&&(j+3>=line.length|| /[^A-Za-z0-9%$]/.test(line[j+3])))){
highlightedLine+='<span class="opl-comment">'+escapeHtml(line.substr(j))+'</span>';
break;
}


if(char==='"'){
var end=j+1;
while(end<line.length){
if(line[end]==='"'){
if(end+1<line.length&&line[end+1]==='"'){
end+=2;
continue;
}else {
end++;
break;
}
}
end++;
}
highlightedLine+='<span class="opl-string">'+escapeHtml(line.substring(j,end))+'</span>';
j=end;
isCommandPosition=false;
expectingOperator=true;
continue;
}


if (/[0-9$]/.test(char)){

var handledNum=false;
if(char==='$'){
var match=line.substr(j).match(/^\$[0-9A-Fa-f]+/);
if(match){
highlightedLine+='<span class="opl-integer">'+escapeHtml(match[0])+'</span>';
j+=match[0].length;
isCommandPosition=false;
expectingOperator=true;
continue;
}
}

var match=line.substr(j).match(/^[0-9]+(\.[0-9]+)?([Ee][+-]?[0-9]+)?/);
if(match){

if(j>0&& /[A-Za-z_]/.test(line[j-1])){
highlightedLine+=escapeHtml(char);
j++;

continue;
}

if(match[1]||match[2]){
highlightedLine+='<span class="opl-float">'+escapeHtml(match[0])+'</span>';
}else {
highlightedLine+='<span class="opl-integer">'+escapeHtml(match[0])+'</span>';
}
j+=match[0].length;
isCommandPosition=false;
expectingOperator=true;
continue;
}
}


if (/[A-Za-z]/.test(char)){

var logicalMatch=line.substr(j).match(/^[A-Za-z]\.[A-Za-z0-9]+[\$%&]?/);
if(logicalMatch){
var fieldRef=logicalMatch[0];
if(fieldRef.indexOf('%')!==-1){
highlightedLine+='<span class="opl-var-integer">'+escapeHtml(fieldRef)+'</span>';
}else if(fieldRef.indexOf('$')!==-1){
highlightedLine+='<span class="opl-var-string">'+escapeHtml(fieldRef)+'</span>';
}else {
highlightedLine+='<span class="opl-var-float">'+escapeHtml(fieldRef)+'</span>';
}
j+=fieldRef.length;
isCommandPosition=false;
expectingOperator=true;
continue;
}


var match=line.substr(j).match(/^[A-Za-z][A-Za-z0-9]*[\$%&]?/);
if(match){
var word=match[0];
var upperWord=word.toUpperCase();

if(this.keywordMap.hasOwnProperty(upperWord)){

var className=this.keywordMap[upperWord];
highlightedLine+='<span class="'+className+'">'+escapeHtml(word)+'</span>';
expectingOperator=false;








}else {


if(expectingOperator){


highlightedLine+=escapeHtml(word);

}else {


var isLabel=false;
var isAssignment=false;

if(isCommandPosition){

var lookaheadIndex=j+word.length;
while(lookaheadIndex<line.length&& /\s/.test(line[lookaheadIndex])){
lookaheadIndex++;
}
var nextChar=(lookaheadIndex<line.length)?line[lookaheadIndex]:null;

if(nextChar===':'){
isLabel=true;
}else if(nextChar==='='){
isAssignment=true;
}
}

if(isLabel){
highlightedLine+='<span class="opl-label">'+escapeHtml(word)+'</span>';

}else if(isAssignment||!isCommandPosition){

if(word.indexOf('%')!==-1){
highlightedLine+='<span class="opl-var-integer">'+escapeHtml(word)+'</span>';
}else if(word.indexOf('$')!==-1){
highlightedLine+='<span class="opl-var-string">'+escapeHtml(word)+'</span>';
}else {
highlightedLine+='<span class="opl-var-float">'+escapeHtml(word)+'</span>';
}
expectingOperator=true;
}else {

highlightedLine+=escapeHtml(word);
expectingOperator=false;
}
}
}
j+=word.length;
isCommandPosition=false;
continue;
}
}


if (/[+\-*/=<>:,]/.test(char)){
highlightedLine+='<span class="opl-operator">'+escapeHtml(char)+'</span>';


if(char===':'){
isCommandPosition=true;
}else {
isCommandPosition=false;
}
expectingOperator=false;

j++;
continue;
}


if(char==='('){
highlightedLine+='<span class="bracket-'+(bracketLevel%3)+'">'+escapeHtml(char)+'</span>';
bracketLevel++;
j++;
expectingOperator=false;
continue;
}
if(char===')'){
if(bracketLevel>0)bracketLevel--;
highlightedLine+='<span class="bracket-'+(bracketLevel%3)+'">'+escapeHtml(char)+'</span>';
j++;
expectingOperator=true;
continue;
}



if (/\s/.test(char)){
highlightedLine+=escapeHtml(char);
}else {
highlightedLine+=escapeHtml(char);
isCommandPosition=false;

}
j++;
}
output+=highlightedLine+'\n';
}

return output;
}
};

if(typeof module!=='undefined'&&module.exports){
module.exports={SyntaxHighlighter};
}