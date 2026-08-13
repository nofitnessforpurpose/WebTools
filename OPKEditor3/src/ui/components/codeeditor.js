'use strict';
function CodeEditor(container,options){
this.container=container;
this.options=options||{};
this.value=this.options.value||"";
this.readOnly=this.options.readOnly||false;
this.language=this.options.language||'text';
this.targetSystem=this.options.targetSystem||'Standard';
this.onChange=null;
this.lines=[];
this.foldState={};
this.errorLine=-1;
this.init();
}
CodeEditor.prototype={
isSplitMode:function (){
return this._cachedSplitMode;
},
setTargetSystem:function (ts){
if(this.targetSystem!==ts){
this.targetSystem=ts;
this.update();
}
},
updateStatusBar:function (){
var statusCursor=document.getElementById('status-cursor');
if(!statusCursor)return;
if(document.activeElement!==this.inputLayer&&document.activeElement!==this.headerInput){
return;
}
var row=1;
var col=1;
if(this.isSplitMode()&&document.activeElement===this.headerInput){
col=this.headerInput.selectionStart+1;
statusCursor.textContent='Row: '+row.toString().padStart(4,'0')+' - Col: '+col.toString().padStart(3,'0');
return;
}
var cursor=this.inputLayer.selectionStart;
var text=this.inputLayer.value;
var linesBefore=text.substring(0,cursor).split('\n');
var visualRow=linesBefore.length-1;
var realRow=visualRow;
if(this.activeLineMap&&this.activeLineMap.length>visualRow){
realRow=this.activeLineMap[visualRow];
}
row=realRow+1;
if(this.isSplitMode())row+=1;
col=linesBefore[visualRow].length+1;
statusCursor.textContent='Row: '+row.toString().padStart(4,'0')+' - Col: '+col.toString().padStart(3,'0');
},
beep:function (){
if(!window.AudioContext&&!window.webkitAudioContext)return;
try{
var ctx=new (window.AudioContext||window.webkitAudioContext)();
var osc=ctx.createOscillator();
var gain=ctx.createGain();
osc.connect(gain);
gain.connect(ctx.destination);
osc.type='triangle';
osc.frequency.setValueAtTime(440,ctx.currentTime);
gain.gain.setValueAtTime(0.1,ctx.currentTime);
osc.start();
osc.stop(ctx.currentTime+0.15);
}catch(e){
}
},
init:function (){
this._cachedSplitMode=this.options.procedureMode&&OptionsManager.getOption('stickyProcedureHeader')!==false;
this.container.innerHTML='';
this.container.className='code-editor';
this.container.style.display='flex';
this.container.style.flexDirection='column';
this.container.style.height='100%';
if(this.isSplitMode()){
this.headerContainer=document.createElement('div');
this.headerContainer.className='code-header-container';
this.headerContainer.style.display='flex';
this.headerContainer.style.width='100%';
this.headerContainer.style.flex='0 0 auto';
this.headerGutter=document.createElement('div');
this.headerGutter.className='code-gutter';
this.headerGutter.innerHTML='<div class="gutter-cell"><span class="gutter-line-number">1</span></div>';
this.headerContainer.appendChild(this.headerGutter);
this.headerInput=document.createElement('input');
this.headerInput.type='text';
this.headerInput.className='code-header-input';
this.headerInput.spellcheck=false;
this.headerInput.placeholder="PROCname:(params)";
if(this.readOnly)this.headerInput.readOnly=true;
var self=this;
this.headerInput.addEventListener('keydown',function (e){
if(e.key.length===1&&!e.ctrlKey&&!e.metaKey&&!e.altKey){
if(this.value.length>=254&&this.selectionStart===this.selectionEnd){
e.preventDefault();
self.beep();
}
}
});
this.headerInput.addEventListener('paste',function (e){
var pasteData=(e.clipboardData||window.clipboardData).getData('text');
if(pasteData){
var proposed=this.value.substring(0,this.selectionStart)+pasteData+this.value.substring(this.selectionEnd);
if(proposed.length>254){
e.preventDefault();
self.beep();
}
}
});
this.headerInput.style.fontFamily='monospace';
this.headerInput.style.flex='1';
this.headerInput.style.border='none';
this.headerInput.style.borderBottom='1px solid var(--border-color, #444)';
this.headerInput.style.backgroundColor='var(--header-bg-color, #2d2d2d)';
this.headerInput.style.color='var(--text-color, #ccc)';
this.headerInput.style.padding='2px 4px';
this.headerInput.style.boxSizing='border-box';
this.headerInput.style.outline='none';
this.headerInput.style.zIndex='10';
this.headerContainer.appendChild(this.headerInput);
this.container.appendChild(this.headerContainer);
var self=this;
this.headerInput.addEventListener('input',function (){
var val=this.value;
var sanitized=self.sanitizeHeaderLine(val,(self.options&&self.options.currentName)||"PROCNAME",true);
if(sanitized.changed){
var start=this.selectionStart;
var end=this.selectionEnd;
this.value=sanitized.line;
if(start>sanitized.line.length)start=sanitized.line.length;
if(end>sanitized.line.length)end=sanitized.line.length;
this.selectionStart=start;
this.selectionEnd=end;
val=sanitized.line;
}
if(OptionsManager.getOption('autoUppercaseKeywords')){
var formatted=self.formatHeaderLine(val);
if(formatted!==val){
var start=this.selectionStart;
var end=this.selectionEnd;
this.value=formatted;
this.selectionStart=start;
this.selectionEnd=end;
}
}
self.validateHeader();
self.updateFullTextFromParts();
if(self.errorLine!==-1)self.errorLine=-1;
if(self.onChange)self.onChange();
});
this.headerInput.addEventListener('blur',function (){
var val=this.value;
var sanitized=self.sanitizeHeaderLine(val,(self.options&&self.options.currentName)||"PROCNAME",false);
if(sanitized.changed){
this.value=sanitized.line;
val=sanitized.line;
}
if(OptionsManager.getOption('autoUppercaseKeywords')){
var formatted=self.formatHeaderLine(val);
if(formatted!==val){
this.value=formatted;
val=formatted;
}
}
self.updateFullTextFromParts();
self.update();
if(self.onChange)self.onChange();
if(self.validateHeader)self.validateHeader();
if(self.options.onHeaderBlur){
self.options.onHeaderBlur(val);
}
});
this.headerInput.addEventListener('keydown',function (e){
if(e.key==='Enter'){
e.preventDefault();
self.inputLayer.focus();
}
});
this.headerInput.addEventListener('keyup',function (){self.updateStatusBar();});
this.headerInput.addEventListener('mouseup',function (){self.updateStatusBar();});
this.headerInput.addEventListener('focus',function (){self.updateStatusBar();});
this.headerInput.addEventListener('blur',function (){
setTimeout(function (){
var el=document.getElementById('status-cursor');
if(el&&document.activeElement!==self.headerInput&&document.activeElement!==self.inputLayer)el.textContent='';
},50);
});
this.updateStickyHeader();
}
this.bodyContainer=document.createElement('div');
this.bodyContainer.className='code-body-container';
this.bodyContainer.style.display='flex';
this.bodyContainer.style.flex='1';
this.bodyContainer.style.position='relative';
this.bodyContainer.style.overflow='hidden';
this.container.appendChild(this.bodyContainer);
this.gutter=document.createElement('div');
this.gutter.className='code-gutter';
this.bodyContainer.appendChild(this.gutter);
this.contentArea=document.createElement('div');
this.contentArea.className='code-content';
this.contentArea.style.flex='1';
this.contentArea.style.position='relative';
this.contentArea.style.overflow='hidden';
this.bodyContainer.appendChild(this.contentArea);
this.contentArea.innerHTML='';
this.inputLayer=document.createElement('textarea');
this.inputLayer.className='code-input-area';
this.inputLayer.style.width='100%';
this.inputLayer.style.height='100%';
this.inputLayer.style.resize='none';
this.inputLayer.style.border='none';
this.inputLayer.style.boxSizing='border-box';
this.inputLayer.spellcheck=false;
if(this.readOnly)this.inputLayer.readOnly=true;
var self=this;
this.inputLayer.addEventListener('keydown',function (e){
if(e.key.length===1&&!e.ctrlKey&&!e.metaKey&&!e.altKey){
var text=this.value;
var cursor=this.selectionStart;
var lineStart=text.lastIndexOf('\n',cursor-1)+1;
var lineEnd=text.indexOf('\n',cursor);
if(lineEnd===-1)lineEnd=text.length;
var currentLineLen=(lineEnd-lineStart);
var selectionLen=this.selectionEnd-this.selectionStart;
if(currentLineLen>=254&&selectionLen===0){
e.preventDefault();
self.beep();
}
}
});
this.inputLayer.addEventListener('paste',function (e){
var pasteData=(e.clipboardData||window.clipboardData).getData('text');
if(pasteData){
var text=this.value;
var proposed=text.substring(0,this.selectionStart)+pasteData+text.substring(this.selectionEnd);
var pasteLines=proposed.split('\n');
for(var i=0;i<pasteLines.length;i++){
if(pasteLines[i].length>254){
e.preventDefault();
self.beep();
return;
}
}
}
});
this.fullText=this.value;
this.contentArea.appendChild(this.inputLayer);
this.renderContainer=document.createElement('div');
this.renderContainer.className='code-render-container';
this.contentArea.appendChild(this.renderContainer);
this.renderLayer=document.createElement('pre');
this.renderLayer.className='code-render-area';
this.renderContainer.appendChild(this.renderLayer);
var self=this;
this.inputLayer.addEventListener('input',function (){
if(self.errorLine!==-1)self.errorLine=-1;
if(!self.isSplitMode()){
var fullText=this.value;
var lines=fullText.split('\n');
var sanitized=self.sanitizeHeaderLine(lines[0],(self.options&&self.options.currentName)||"PROCNAME",true);
if(sanitized.changed){
var start=this.selectionStart;
var end=this.selectionEnd;
lines[0]=sanitized.line;
this.value=lines.join('\n');
if(start>this.value.length)start=this.value.length;
if(end>this.value.length)end=this.value.length;
this.selectionStart=start;
this.selectionEnd=end;
}
}
self.updateFullTextFromParts();
self.update();
if(self.onChange)self.onChange();
});
this.inputLayer.addEventListener('scroll',function (){
self.renderContainer.scrollTop=this.scrollTop;
self.renderContainer.scrollLeft=this.scrollLeft;
self.gutter.scrollTop=this.scrollTop;
});
this.inputLayer.addEventListener('blur',function (){
if(self.isSplitMode())return;
var fullText=this.value;
var lines=fullText.split('\n');
var sanitized=self.sanitizeHeaderLine(lines[0],(self.options&&self.options.currentName)||"PROCNAME",false);
if(sanitized.changed){
lines[0]=sanitized.line;
this.value=lines.join('\n');
self.updateFullTextFromParts();
self.update();
if(self.onChange)self.onChange();
}
if(self.options.onHeaderBlur){
self.options.onHeaderBlur(sanitized.line);
}
});
this.inputLayer.addEventListener('keydown',function (e){
if(e.key==='Enter'||e.key===' '){
if(self.options.procedureMode&&OptionsManager.getOption('autoUppercaseKeywords')){
e.preventDefault();
var charToInsert=(e.key==='Enter')?"\n":" ";
var text=this.value;
var cursor=this.selectionStart;
var lineStart=text.lastIndexOf('\n',cursor-1)+1;
var lineEnd=text.indexOf('\n',cursor);
if(lineEnd===-1)lineEnd=text.length;
var currentLine=text.substring(lineStart,cursor);
var fullLineContent=text.substring(lineStart,lineEnd);
var isHeaderLine=(!self.isSplitMode()&&lineStart===0);
var formattedLine;
if(isHeaderLine){
formattedLine=self.formatHeaderLine(fullLineContent);
}else {
formattedLine=self.formatLine(fullLineContent);
}
var left=text.substring(0,lineStart);
var right=text.substring(lineEnd);
var relCursor=cursor-lineStart;
var formattedLeft=formattedLine.substring(0,relCursor);
var formattedRight=formattedLine.substring(relCursor);
this.value=left+formattedLeft+charToInsert+formattedRight+right;
var newCursorPos=left.length+formattedLeft.length+1;
this.selectionStart=this.selectionEnd=newCursorPos;
self.updateFullTextFromParts();
if(self.errorLine!==-1)self.errorLine=-1;
self.update();
if(self.onChange)self.onChange();
return;
}
}
if(e.key==='Tab'){
e.preventDefault();
if(e.shiftKey){
self.outdentSelection();
}else {
self.indentSelection();
}
}
});
this.lastLineIndex=0;
var checkLineChange=function (){
if(self.isSplitMode())return;
if(!self.options.procedureMode||!OptionsManager.getOption('autoUppercaseKeywords'))return;
var cursor=self.inputLayer.selectionStart;
var text=self.inputLayer.value;
var currentLineIndex=text.substring(0,cursor).split('\n').length-1;
if(self.lastLineIndex===0&&currentLineIndex!==0){
var lineEnd=text.indexOf('\n');
if(lineEnd===-1)lineEnd=text.length;
var lineContent=text.substring(0,lineEnd);
var formatted=self.formatHeaderLine(lineContent);
if(formatted!==lineContent){
var scrollPos=self.inputLayer.scrollTop;
self.value=formatted+text.substring(lineEnd);
self.inputLayer.value=self.value;
self.updateFullTextFromParts();
self.update();
if(self.onChange)self.onChange();
self.inputLayer.scrollTop=scrollPos;
self.inputLayer.selectionStart=cursor;
self.inputLayer.selectionEnd=cursor;
}
}
self.lastLineIndex=currentLineIndex;
};
this.inputLayer.addEventListener('mouseup',function (e){checkLineChange(e);self.updateStatusBar();});
this.inputLayer.addEventListener('keyup',function (e){checkLineChange(e);self.updateStatusBar();});
this.inputLayer.addEventListener('focus',function (){self.updateStatusBar();});
this.inputLayer.addEventListener('blur',function (){
setTimeout(function (){
var el=document.getElementById('status-cursor');
if(el&&document.activeElement!==self.inputLayer&&document.activeElement!==self.headerInput)el.textContent='';
},50);
});
this.setValue(this.value);
window.addEventListener('themeChanged',function (){
self.update();
self.updateStickyHeader();
});
},
sanitizeHeaderLine:function (headerLine,fallbackName,isLiveTyping){
if(!headerLine)headerLine="";
var leadingSpaceMatch=headerLine.match(/^\s*/);
var leadingSpace=leadingSpaceMatch?leadingSpaceMatch[0]:"";
var trimmed=headerLine.trim();
var paramList="";
var parenIndex=trimmed.indexOf('(');
if(parenIndex!==-1){
var lastParen=trimmed.lastIndexOf(')');
if(lastParen>parenIndex){
paramList=trimmed.substring(parenIndex,lastParen+1);
trimmed=trimmed.substring(0,parenIndex).trim();
}
}
var firstColon=trimmed.indexOf(':');
var rawIdent="";
if(firstColon!==-1){
rawIdent=trimmed.substring(0,firstColon).trim();
}else {
rawIdent=trimmed;
}
var identMatch=rawIdent.match(/^([a-zA-Z][a-zA-Z0-9]*([%$]?))/);
if(!identMatch){
if(isLiveTyping){
return {
line:headerLine,
name:null,
changed:false
};
}
var validName="PROCNAME";
if(fallbackName){
var fbMatch=fallbackName.match(/^([a-zA-Z][a-zA-Z0-9]*([%$]?))/i);
if(fbMatch){
var fbFull=fbMatch[1];
var fbSuffix=fbMatch[2]||"";
var fbBase=fbFull.substring(0,fbFull.length-fbSuffix.length);
validName=fbBase.substring(0,8)+fbSuffix;
}
}
var sanitizedLine=leadingSpace+validName+":"+paramList;
return {
line:sanitizedLine,
name:validName,
changed:(sanitizedLine!==headerLine)
};
}
var fullIdent=identMatch[1];
var suffix=identMatch[2]||"";
var baseName=fullIdent.substring(0,fullIdent.length-suffix.length);
var truncatedBase=baseName.substring(0,8);
var sanitizedLine;
if(isLiveTyping&&baseName.length<=8){
sanitizedLine=headerLine;
}else {
sanitizedLine=leadingSpace+truncatedBase+suffix+":"+paramList;
}
return {
line:sanitizedLine,
name:truncatedBase,
changed:(sanitizedLine!==headerLine)
};
},
validateHeader:function (){
if(!this.headerInput)return;
var val=this.headerInput.value;
if(val.startsWith(" ")){
val=val.trimLeft();
this.headerInput.value=val;
}
var regex = /^\s*([a-zA-Z][a-zA-Z0-9]{0,7}[%$]?)\s*:.*/i;
var isValid=regex.test(val);
if(isValid){
this.headerInput.style.backgroundColor='var(--header-bg-color, #2d2d2d)';
this.headerInput.style.borderBottom='1px solid var(--border-color, #444)';
this.headerInput.title="";
}else {
this.headerInput.style.backgroundColor='#4d3800';
this.headerInput.style.borderBottom='2px solid #cc8800';
this.headerInput.title="Invalid Header. Format: Name:(Params). Name start with letter, max 8 chars.";
}
},
updateStickyHeader:function (){
if(!this.headerContainer)return;
var isSticky=OptionsManager.getOption('stickyProcedureHeader');
if(isSticky){
if(this.headerContainer.parentNode!==this.container){
this.container.insertBefore(this.headerContainer,this.bodyContainer);
}
this.headerContainer.style.flexShrink='0';
}else {
}
},
updateFullTextFromParts:function (){
var hasFolds=Object.keys(this.foldState).length>0;
if(hasFolds&&OptionsManager.getOption('codeFolding')){
return;
}
if(this.isSplitMode()){
var head=this.headerInput.value;
var body=this.inputLayer.value;
this.fullText=head+"\n"+body;
}else {
this.fullText=this.inputLayer.value;
}
},
setValue:function (val){
this.errorLine=-1;
this.fullText=val;
if(this.isSplitMode()){
val=val.trimLeft();
var lines=val.split('\n');
var first=lines.length>0?lines[0]:"";
var rest=lines.length>1?lines.slice(1).join('\n'):"";
this.headerInput.value=first;
if(this.validateHeader)this.validateHeader();
}else {
}
this.foldState={};
this.update();
},
getValue:function (){
if(!Object.keys(this.foldState).length&&this.isSplitMode()){
this.updateFullTextFromParts();
}
return this.fullText;
},
setErrorLine:function (lineIndex){
this.errorLine=lineIndex;
if(lineIndex!==-1){
this.unfoldLine(lineIndex);
}
this.update();
},
unfoldLine:function (lineIndex){
var textToProcess=this.fullText;
if(this.isSplitMode()){
var allLines=textToProcess.split('\n');
if(allLines.length>0)allLines.shift();
textToProcess=allLines.join('\n');
}
var lines=textToProcess.split('\n');
var foldRanges=this.calculateFoldRanges(lines);
var changed=false;
for(var i=0;i<foldRanges.length;i++){
var r=foldRanges[i];
if(this.foldState[r.start]){
if(lineIndex>r.start&&lineIndex<=r.end){
this.foldState[r.start]=false;
changed=true;
}
}
}
},
setReadOnly:function (readOnly){
this.readOnly=readOnly;
this.inputLayer.readOnly=readOnly;
if(this.headerInput)this.headerInput.readOnly=readOnly;
},
update:function (){
var enableFolding=OptionsManager.getOption('codeFolding');
var textToProcess=this.fullText;
if(this.isSplitMode()){
var allLines=textToProcess.split('\n');
if(allLines.length>0)allLines.shift();
textToProcess=allLines.join('\n');
}
var lines=textToProcess.split('\n');
var foldRanges=enableFolding?this.calculateFoldRanges(lines):[];
var displayText="";
var displayLines=[];
var lineMap=[];
var skipUntil=-1;
for(var i=0;i<lines.length;i++){
if(i<=skipUntil)continue;
if(this.foldState[i]&&enableFolding){
var range=foldRanges.find(r=>r.start===i);
if(range){
var content=lines[i]+" ...";
if(this.errorLine===i){
content='<div class="code-error-line">'+content+'</div>';
}
displayText+=content+"\n";
displayLines.push(content);
lineMap.push(i);
skipUntil=range.end;
continue;
}
}
var lineContent=lines[i];
if(this.errorLine===i){
}
displayText+=lines[i]+"\n";
displayLines.push(lines[i]);
lineMap.push(i);
}
if(displayText.length>0)displayText=displayText.slice(0,-1);
if(this.inputLayer.value!==displayText){
this.inputLayer.value=displayText;
}
var hasFolds=Object.keys(this.foldState).length>0&&enableFolding;
if(!this.readOnly){
this.inputLayer.readOnly=hasFolds;
this.inputLayer.style.cursor=hasFolds?'default':'text';
this.inputLayer.style.opacity=hasFolds?'0.8':'1.0';
}
var highlighted="";
var enableSyntaxHighlighting=OptionsManager.getOption('syntaxHighlighting');
if(this.language==='opl'&&enableSyntaxHighlighting){
for(var i=0;i<displayLines.length;i++){
var line=displayLines[i];
var originalLineIndex=lineMap[i];
var lineHTML="";
if(line.endsWith(" ...")){
var content=line.substring(0,line.length-4);
var hl=SyntaxHighlighter.highlight(content,this.targetSystem);
if(hl.endsWith('\n'))hl=hl.slice(0,-1);
lineHTML=hl+'<span class="fold-placeholder"> ...</span>';
}else {
var hl=SyntaxHighlighter.highlight(line,this.targetSystem);
if(hl.endsWith('\n'))hl=hl.slice(0,-1);
lineHTML=hl;
}
if(this.errorLine===originalLineIndex){
lineHTML='<span class="code-error-line">'+lineHTML+'</span>';
}
highlighted+=lineHTML+'\n';
}
}else {
for(var i=0;i<displayLines.length;i++){
var line=displayLines[i];
var originalLineIndex=lineMap[i];
var lineHTML=line.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
if(this.errorLine===originalLineIndex){
lineHTML='<span class="code-error-line">'+lineHTML+'</span>';
}
highlighted+=lineHTML+'\n';
}
}
this.renderLayer.innerHTML=highlighted;
var lineOffset=this.isSplitMode()?1:0;
this.updateGutter(lines,foldRanges,lineMap,lineOffset);
this.gutter.scrollTop=this.inputLayer.scrollTop;
this.activeLineMap=lineMap;
this.updateStatusBar();
},
calculateFoldRanges:function (lines){
var ranges=[];
var stack=[];
var regex = /\b(PROC|ENDP|DO|UNTIL|IF|ENDIF|WHILE|ENDWH)\b/gi;
var matchTypes={
'ENDP':'PROC',
'UNTIL':'DO',
'ENDIF':'IF',
'ENDWH':'WHILE'
};
for(var i=0;i<lines.length;i++){
var line=lines[i];
var cleaned="";
var j=0;
while(j<line.length){
var char=line[j];
if(char==='\''||(line.substr(j,3).toUpperCase()==="REM"&&(j===0|| /[\s:]/.test(line[j-1]))&&(j+3>=line.length|| /[^A-Za-z0-9%$]/.test(line[j+3])))){
cleaned+=" ".repeat(line.length-j);
break;
}
if(char==='"'){
var start=j;
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
cleaned+=" ".repeat(end-start);
j=end;
continue;
}
cleaned+=char;
j++;
}
var match;
regex.lastIndex=0;
while((match=regex.exec(cleaned))!==null){
var kw=match[1].toUpperCase();
if(kw==='PROC'||kw==='DO'||kw==='IF'||kw==='WHILE'){
stack.push({start:i,type:kw});
}else if(matchTypes[kw]){
var expectedType=matchTypes[kw];
var matchIndex=-1;
for(var k=stack.length-1;k>=0;k--){
if(stack[k].type===expectedType){
matchIndex=k;
break;
}
}
if(matchIndex>=0){
var startInfo=stack[matchIndex];
if(startInfo.start!==i){
ranges.push({start:startInfo.start,end:i});
}
stack.length=matchIndex;
}
}
}
}
return ranges;
},
updateGutter:function (allLines,foldRanges,lineMap,lineOffset){
var showLineNumbers=(this.options&&this.options.lineNumbers!==undefined)?this.options.lineNumbers:OptionsManager.getOption('showLineNumbers');
var enableFolding=OptionsManager.getOption('codeFolding');
this.gutter.innerHTML='';
var self=this;
for(var i=0;i<lineMap.length;i++){
var originalIndex=lineMap[i];
var range=enableFolding?foldRanges.find(r=>r.start===originalIndex):null;
var icon='';
var displayNum=originalIndex+1 +(lineOffset||0);
var lineNumStr=showLineNumbers?displayNum:'';
if(range){
var isFolded=this.foldState[originalIndex];
icon=isFolded?'▶':'▼';
}
var cell=document.createElement('div');
cell.className='gutter-cell';
if(this.errorLine===originalIndex){
cell.classList.add('gutter-error');
cell.style.backgroundColor='rgba(255, 0, 0, 0.4)';
cell.style.color='#fff';
}
var numSpan=document.createElement('span');
numSpan.className='gutter-line-number';
numSpan.textContent=lineNumStr;
cell.appendChild(numSpan);
var iconSpan=document.createElement('span');
iconSpan.className='fold-icon';
iconSpan.textContent=icon;
if(isFolded){
iconSpan.style.fontSize='10px';
iconSpan.style.verticalAlign='middle';
}
cell.appendChild(iconSpan);
if(range){
cell.style.cursor='pointer';
(function (index){
cell.addEventListener('click',function (){
self.toggleFold(index);
});
})(originalIndex);
}
this.gutter.appendChild(cell);
}
},
toggleFold:function (lineIndex){
if(this.foldState[lineIndex]){
delete this.foldState[lineIndex];
}else {
this.foldState[lineIndex]=true;
}
this.update();
},
setShowLineNumbers:function (enabled){
if(!this.options)this.options={};
this.options.lineNumbers=enabled;
this.update();
},
indentSelection:function (){
if(this.readOnly)return;
var text=this.inputLayer.value;
var start=this.inputLayer.selectionStart;
var end=this.inputLayer.selectionEnd;
var optVal=OptionsManager.getOption('indentSize');
var indentSize=parseInt(optVal,10);
if(isNaN(indentSize)||indentSize<1)indentSize=2;
var startLineStart=text.lastIndexOf('\n',start-1)+1;
var endLineEnd=text.indexOf('\n',end);
if(endLineEnd===-1)endLineEnd=text.length;
var selectedText=text.substring(startLineStart,endLineEnd);
var lines=selectedText.split('\n');
var indentString=" ".repeat(indentSize);
var textBefore=text.substring(0,startLineStart);
var isEffectiveStart=!textBefore.trim();
var newText=lines.map((line,index)=>{
if(isEffectiveStart&&index===0){
return line.replace(/^\s+/,'');
}
return indentString+line;
}).join('\n');
var head=text.substring(0,startLineStart);
var tail=text.substring(endLineEnd);
var newBody=head+newText+tail;
var newFullText=newBody;
if(this.isSplitMode()){
var headerVal=this.headerInput?this.headerInput.value:"";
newFullText=headerVal+"\n"+newBody;
}
this.setValue(newFullText);
this.inputLayer.selectionStart=startLineStart;
this.inputLayer.selectionEnd=startLineStart+newText.length;
if(this.onChange)this.onChange();
},
outdentSelection:function (){
if(this.readOnly)return;
var text=this.inputLayer.value;
var start=this.inputLayer.selectionStart;
var end=this.inputLayer.selectionEnd;
var optVal=OptionsManager.getOption('indentSize');
var indentSize=parseInt(optVal,10);
if(isNaN(indentSize)||indentSize<1)indentSize=2;
var startLineStart=text.lastIndexOf('\n',start-1)+1;
var endLineEnd=text.indexOf('\n',end);
if(endLineEnd===-1)endLineEnd=text.length;
var selectedText=text.substring(startLineStart,endLineEnd);
var lines=selectedText.split('\n');
var indentString=" ".repeat(indentSize);
var indentLen=indentString.length;
var textBefore=text.substring(0,startLineStart);
var isEffectiveStart=!textBefore.trim();
var newText=lines.map((line,index)=>{
if(isEffectiveStart&&index===0){
return line.replace(/^\s+/,'');
}
if(line.startsWith(indentString)){
return line.substring(indentLen);
}else {
return line.replace(new RegExp("^ {1,"+indentSize+"}"),"");
}
}).join('\n');
var head=text.substring(0,startLineStart);
var tail=text.substring(endLineEnd);
var newBody=head+newText+tail;
var newFullText=newBody;
if(this.isSplitMode()){
var headerVal=this.headerInput?this.headerInput.value:"";
newFullText=headerVal+"\n"+newBody;
}
this.setValue(newFullText);
this.inputLayer.selectionStart=startLineStart;
this.inputLayer.selectionEnd=startLineStart+newText.length;
if(this.onChange)this.onChange();
},
formatSelection:function (){
if(this.readOnly)return;
if(!window.OPLFormatter)return;
var text=this.inputLayer.value;
var start=this.inputLayer.selectionStart;
var end=this.inputLayer.selectionEnd;
var startLineStart=text.lastIndexOf('\n',start-1)+1;
var endLineEnd=text.indexOf('\n',end);
if(endLineEnd===-1)endLineEnd=text.length;
var selectedText=text.substring(startLineStart,endLineEnd);
var newText=window.OPLFormatter.format(selectedText);
var head=text.substring(0,startLineStart);
var tail=text.substring(endLineEnd);
var newBody=head+newText+tail;
var newFullText=newBody;
if(this.isSplitMode()){
var headerVal=this.headerInput?this.headerInput.value:"";
newFullText=headerVal+"\n"+newBody;
}
this.setValue(newFullText);
this.inputLayer.selectionStart=startLineStart+newText.length;
this.inputLayer.selectionEnd=startLineStart+newText.length;
if(this.onChange)this.onChange();
},
minifySelection:function (){
if(this.readOnly)return;
if(!window.OPLFormatter)return;
var text=this.inputLayer.value;
var start=this.inputLayer.selectionStart;
var end=this.inputLayer.selectionEnd;
var startLineStart=text.lastIndexOf('\n',start-1)+1;
var endLineEnd=text.indexOf('\n',end);
if(endLineEnd===-1)endLineEnd=text.length;
var selectedText=text.substring(startLineStart,endLineEnd);
var newText=window.OPLFormatter.compress(selectedText);
var head=text.substring(0,startLineStart);
var tail=text.substring(endLineEnd);
var newBody=head+newText+tail;
var newFullText=newBody;
if(this.isSplitMode()){
var headerVal=this.headerInput?this.headerInput.value:"";
newFullText=headerVal+"\n"+newBody;
}
this.setValue(newFullText);
this.inputLayer.selectionStart=startLineStart+newText.length;
this.inputLayer.selectionEnd=startLineStart+newText.length;
if(this.onChange)this.onChange();
},
selectAll:function (){
this.inputLayer.select();
},
formatLine:function (line){
if(typeof SyntaxHighlighter!=='undefined'&&!SyntaxHighlighter.keywordMap){
SyntaxHighlighter.init();
}
if(!line)return "";
var output="";
var j=0;
while(j<line.length){
var char=line[j];
if(char==='\''||(line.substr(j).toUpperCase().startsWith("REM")&&(j===0||line[j-1]===' '))){
output+=line.substr(j);
break;
}
if(char==='"'){
var end=line.indexOf('"',j+1);
if(end===-1)end=line.length;
else end++;
output+=line.substring(j,end);
j=end;
continue;
}
if (/[A-Za-z]/.test(char)){
var match=line.substr(j).match(/^[A-Za-z][A-Za-z0-9]*[\$%&]?/);
if(match){
var word=match[0];
var upper=word.toUpperCase();
var isKeyword=SyntaxHighlighter.keywordMap&&SyntaxHighlighter.keywordMap.hasOwnProperty(upper);
if(isKeyword){
output+=upper;
}else {
output+=word;
}
j+=word.length;
continue;
}
}
output+=char;
j++;
}
return output;
},
formatHeaderLine:function (line){
if(!line)return "";
var colonIndex=line.indexOf(':');
if(colonIndex===-1){
return line.toUpperCase();
}
var beforeColon=line.substring(0,colonIndex);
var afterColon=line.substring(colonIndex);
return beforeColon.toUpperCase()+afterColon;
}
};