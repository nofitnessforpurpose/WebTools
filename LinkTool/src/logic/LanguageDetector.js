'use strict';


var LanguageDetector={


LANGUAGES:[
'Assembler',
'BASIC',
'BrainFSK',
'C',
'MicroPython',
'OPL',
'Rust',
'Wiring',
'Zig'
],


detectLanguage:function (filename,content){
if(!content)return 'Text';



var lines=content.split('\n',5);
for(var i=0;i<lines.length;i++){
var match=lines[i].match(/^\s*\/\/\s*language:\s*(\w+)/i);
if(match){
var directiveLang=match[1];

var found=this.LANGUAGES.find(l=>l.toLowerCase()===directiveLang.toLowerCase());
if(found)return found;
return directiveLang;
}
}









var oplRegex = /^\s*([a-zA-Z][a-zA-Z0-9]{0,7}[%$]?)\s*:/;


var scanLimit=Math.min(lines.length,10);
for(var i=0;i<scanLimit;i++){
var line=lines[i].trim();
if(!line)continue;
if(line.toUpperCase().startsWith("REM"))continue;

if(oplRegex.test(line)){
return 'OPL';
}



}


if(filename){
var ext=filename.split('.').pop().toLowerCase();
if(ext==='opl')return 'OPL';
if(ext==='py')return 'MicroPython';
if(ext==='c')return 'C';
if(ext==='h')return 'C';
if(ext==='rs')return 'Rust';
if(ext==='zig')return 'Zig';
if(ext==='bas')return 'BASIC';
if(ext==='asm')return 'Assembler';
}

return 'Text';
}
};


if(typeof window!=='undefined'){
window.LanguageDetector=LanguageDetector;
}
if(typeof module!=='undefined'){
module.exports=LanguageDetector;
}