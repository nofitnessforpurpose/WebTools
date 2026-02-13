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
iconVersion:'6',
iconStyle:'solid',
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

for(var key in parsed){
if(this.options.hasOwnProperty(key)){
this.options[key]=parsed[key];
}
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

applyOptions:function (){

var version=this.options.iconVersion;
var style=this.options.iconStyle;

var cssLink=document.getElementById('font-awesome-css');
if(cssLink){
var newUrl="";
if(version==='6'){
newUrl="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css";
}else if(version==='5'){
newUrl="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css";
}

if(cssLink.href!==newUrl){
cssLink.href=newUrl;
}
}





var icons=document.querySelectorAll('i.fas, i.far, i.fa-solid, i.fa-regular, i.pack-icon, i.item-icon i');
icons.forEach(function (icon){




icon.classList.remove('fas','far','fa-solid','fa-regular');


if(style==='solid'){
icon.classList.add('fas');
}else {


var forceSolid=[
'fa-file-import',
'fa-sliders','fa-sliders-h',
'fa-angle-down','fa-caret-down',
'fa-chevron-down','fa-chevron-right',
'fa-filter','fa-bars','fa-list'
];

var needsSolid=false;
for(var i=0;i<forceSolid.length;i++){
if(icon.classList.contains(forceSolid[i])){
needsSolid=true;
break;
}
}

if(needsSolid){
icon.classList.add('fas');
}else {
icon.classList.add('far');
}
}
});


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