'use strict';

var OptionsManager={
options:{
theme:'dark',
showLineNumbers:true,
codeFolding:true,
syntaxHighlighting:true,
fontSize:14,
showGuidelines:true,
hexBytesPerRow:8,
themeOverrides:{},
memoryMapOrientation:'horizontal',
memoryMapColors:{
header:'#808080',
procedure:'#d33682',
datafile:'#268bd2',
diary:'#b58900',
comms:'#cb4b16',
sheet:'#859900',
pager:'#6c71c4',
notepad:'#2aa198',
block:'#d33682',
record:'#6c71c4',
unknown:'#dc322f',
free:'#073642'
},
memoryMapShowPageBreaks:true,
memoryMapDisplaySize:8192,
memoryMapBarHeight:30,
iconStyle:'regular',
iconSize:'standard',
iconColoring:'monochrome',
restorePacks:true,
groupDataRecords:false,
collapseDataFiles:false,
showAddresses:false,
showDecompilerLog:false,
showVariableStorageWindow:false,
showIconToolbar:true,
showMenuBar:true,
enableFunctionKeys:false,
decompileInlineAssembly:true,
stickyProcedureHeader:false,
suppressConfirmations:false,
autoUppercaseKeywords:true,
showGlobalUsageLinks:true,
spreadsheetMode:'legacy',
targetSystem:'Standard',
enableHexView:false,
lastPackSize:3,
defaultLanguage:'OPL',
indentSize:2,
},

init:function (){
this.loadOptions();


if(this.options.showIconToolbar===false&&this.options.showMenuBar===false){
this.options.showMenuBar=true;
}

this.applyOptions();
},

loadOptions:function (){
var stored=localStorage.getItem('opkedit_options');
if(stored){
try{
var parsed=JSON.parse(stored);
var legacyCleaned=false;


if('iconVersion' in parsed){
delete parsed.iconVersion;
legacyCleaned=true;
}
if(parsed.iconStyle==='solid'||(parsed.iconStyle&&!['thin','regular','medium','bold'].includes(parsed.iconStyle))){
parsed.iconStyle='regular';
legacyCleaned=true;
}
if(parsed.iconSize&&!['compact','standard','comfortable'].includes(parsed.iconSize)){
parsed.iconSize='standard';
legacyCleaned=true;
}
if(parsed.iconColoring&&!['monochrome','semantic'].includes(parsed.iconColoring)){
parsed.iconColoring='monochrome';
legacyCleaned=true;
}


if(localStorage.getItem('opkedit_icon_version')){
localStorage.removeItem('opkedit_icon_version');
}
if(localStorage.getItem('opkedit_icon_style')){
localStorage.removeItem('opkedit_icon_style');
}


for(var key in parsed){
if(this.options.hasOwnProperty(key)){
this.options[key]=parsed[key];
}
}

if(legacyCleaned){
localStorage.setItem('opkedit_options',JSON.stringify(this.options));
}
}catch(e){

}
}
},

saveOptions:function (){
localStorage.setItem('opkedit_options',JSON.stringify(this.options));
this.applyOptions();
},

getOption:function (key){
return this.options[key];
},

setOption:function (key,value){
this.options[key]=value;
this.saveOptions();
window.dispatchEvent(new CustomEvent('optionsChanged',{detail:{key:key,value:value}}));
},

getStrokeWidth:function (){
var style=this.options.iconStyle||'regular';
switch(style){
case 'thin':return 1.5;
case 'medium':return 2.5;
case 'bold':return 3.0;
case 'regular':
default:return 2.0;
}
},

getIconScale:function (){
var size=this.options.iconSize||'standard';
switch(size){
case 'compact':return 0.85;
case 'comfortable':return 1.15;
case 'standard':
default:return 1.0;
}
},

applyOptions:function (){

var strokeWidth=this.getStrokeWidth();
var iconScale=this.getIconScale();
document.documentElement.style.setProperty('--lucide-stroke-width',strokeWidth);
document.documentElement.style.setProperty('--lucide-scale',iconScale);


if(document.documentElement&&document.documentElement.classList){
if(this.options.iconColoring==='semantic'){
document.documentElement.classList.add('icons-semantic');
}else {
document.documentElement.classList.remove('icons-semantic');
}
}


if(typeof lucide!=='undefined'){
lucide.createIcons({
attrs:{
'stroke-width':strokeWidth
}
});
}


var iconToolbar=document.getElementById('icon-toolbar');
if(iconToolbar){
iconToolbar.style.display=this.options.showIconToolbar?'flex':'none';
}


var menuBar=document.getElementById('toolbar');
if(menuBar){
menuBar.style.display=this.options.showMenuBar?'flex':'none';
}

window.dispatchEvent(new Event('resize'));
}
};


OptionsManager.init();