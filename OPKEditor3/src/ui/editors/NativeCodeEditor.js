'use strict';
function NativeCodeEditor(editorelement,codeEditorContainer,callback){
BlockFileEditor.call(this,editorelement,callback,[2],codeEditorContainer);
}
NativeCodeEditor.prototype=Object.create(BlockFileEditor.prototype);
NativeCodeEditor.prototype.constructor=NativeCodeEditor;
NativeCodeEditor.prototype.initialise=function (item){
var self=this;
var extraelement=null;
if(!this.myelement){
extraelement=document.createElement('div');
extraelement.className='native-editor-container';
extraelement.innerHTML='<div class="native-header" style="flex-shrink:0">' +
'<div class="native-section-title" data-target="native-header-content">Native Header</div>' +
'<div id="native-header-content" class="collapsible-content">' +
'<table class="native-info-table"><tr><th>Name</th><td id="native-name" style="font-weight:bold; color:var(--syntax-functions)">-</td><th>Action</th><td id="native-action" style="color:var(--syntax-commands)">-</td><th>Exec Size</th><td id="native-exec-len">-</td></tr><tr><th>Boot Dev</th><td id="native-boot-dev">-</td><th>Device Num</th><td id="native-dev-id">-</td><th>Version</th><td id="native-version">-</td></tr><tr><th>Vectors</th><td id="native-max-vec">-</td><th>Codelen</th><td id="native-code-len">-</td><th>Record Size</th><td id="native-rec-len">-</td></tr></table>' +
'</div>' +
'<div class="native-section-title collapsed" data-target="native-jump-table-content">Jump Table / Vectors</div>' +
'<div id="native-jump-table-content" class="collapsible-content collapsed">' +
'<div id="native-jump-table" class="native-vector-list"></div>' +
'</div>' +
'<div class="native-section-title collapsed" data-target="native-fixup-table-content">Relocation Table (JT)</div>' +
'<div id="native-fixup-table-content" class="collapsible-content collapsed">' +
'<div id="native-fixup-table" class="native-vector-list"></div>' +
'</div>' +
'</div>' +
'<div class="native-disassembly-container">' +
'<div class="native-section-title collapsed" data-target="native-key-content">Disassembly Key</div>' +
'<div id="native-key-content" class="collapsible-content collapsed">' +
'<div class="disassembly-key">' +
'<div class="key-item"><span class="key-swatch swatch-vector"></span> External Vector</div>' +
'<div class="key-item"><span class="key-swatch swatch-subroutine"></span> Subroutine Entry</div>' +
'<div class="key-item"><span class="key-swatch swatch-branch"></span> Local Branch Target</div>' +
'</div>' +
'</div>' +
'<div class="native-section-title" data-target="native-disassembly-content">Disassembly</div>' +
'<div id="native-disassembly-content" class="collapsible-content">' +
'<div id="native-disassembly" class="native-code-view"></div>' +
'</div>' +
'</div>';
}
BlockFileEditor.prototype.initialise.call(this,item,extraelement);
if(this.myelement){
this.myelement.style.height='100%';
this.myelement.style.display='flex';
this.myelement.style.flexDirection='column';
this.myelement.style.overflow='hidden';
var titles=this.myelement.querySelectorAll('.native-section-title');
titles.forEach(function (title){
var newTitle=title.cloneNode(true);
title.parentNode.replaceChild(newTitle,title);
newTitle.addEventListener('click',function (){
var content=this.nextElementSibling;
if(content&&content.classList.contains('collapsible-content')){
this.classList.toggle('collapsed');
content.classList.toggle('collapsed');
}
});
});
}
if(this.codeEditorInstance){
this.codeEditorInstance.setReadOnly(true);
}
this.decodeAndDisplay();
};
NativeCodeEditor.prototype.decodeAndDisplay=function (){
var decoder=new NativeDecoder();
var result=decoder.parse(this.item.getFullData(),this.item.type,this.item.start);
if(!result)return;
document.getElementById('native-rec-len').textContent=result.longRecLen+" bytes";
document.getElementById('native-exec-len').textContent=result.execLen+" bytes";
var headerLabel=document.getElementById('native-header-size');
if(headerLabel){
headerLabel.textContent=result.headerSize+" bytes";
}
if(result.metadata){
var m=result.metadata;
var nameLabel=document.getElementById('native-name');
if(nameLabel)nameLabel.textContent=m.name||"(None)";
var actionLabel=document.getElementById('native-action');
if(actionLabel)actionLabel.textContent=m.actionDesc||"-";
var codeLenLabel=document.getElementById('native-code-len');
if(codeLenLabel)codeLenLabel.textContent=m.codelen+" bytes";
var bootDevLabel=document.getElementById('native-boot-dev');
if(bootDevLabel)bootDevLabel.textContent="0x"+m.bdevice.toString(16).toUpperCase().padStart(2,'0');
var devIdLabel=document.getElementById('native-dev-id');
if(devIdLabel)devIdLabel.textContent="0x"+m.devnum.toString(16).toUpperCase().padStart(2,'0');
var verLabel=document.getElementById('native-version');
if(verLabel)verLabel.textContent=(m.vernum>>4)+"."+(m.vernum&0x0F);
var maxVecLabel=document.getElementById('native-max-vec');
if(maxVecLabel)maxVecLabel.textContent=m.maxvec;
}
var jumpContainer=document.getElementById('native-jump-table');
jumpContainer.innerHTML='';
result.vectors.forEach(function (v){
var span=document.createElement('span');
span.className='vector-tag';
span.textContent=v.label+': $'+v.target.toString(16).toUpperCase().padStart(4,'0');
jumpContainer.appendChild(span);
});
var fixupContainer=document.getElementById('native-fixup-table');
if(fixupContainer){
fixupContainer.innerHTML='';
var f=result.relocations;
if(f){
var csInfo=document.createElement('div');
csInfo.style.fontSize='12px';
csInfo.style.marginBottom='8px';
csInfo.style.lineHeight='1.5';
var execMatch=f.execChecksum===f.calculatedExecChecksum;
var jtMatch=f.jtSum===f.calculatedJTSum;
csInfo.innerHTML=
'<div>Exec Checksum: 0x'+f.execChecksum.toString(16).toUpperCase().padStart(4,'0')+
' <span style="color:'+(execMatch?'#4CAF50':'#f44336')+'; font-weight:bold">('+(execMatch?'OK':'FAIL')+')</span></div>' +
'<div>JT Count: '+f.jtCount+' | JT Sum: 0x'+f.jtSum.toString(16).toUpperCase().padStart(4,'0')+
' <span style="color:'+(jtMatch?'#4CAF50':'#f44336')+'; font-weight:bold">('+(jtMatch?'OK':'FAIL')+')</span></div>';
fixupContainer.appendChild(csInfo);
if(f.jtOffsets&&f.jtOffsets.length>0){
f.jtOffsets.forEach(function (offset){
var span=document.createElement('span');
span.className='vector-tag fixup-tag';
span.textContent='$'+offset.toString(16).toUpperCase().padStart(4,'0');
fixupContainer.appendChild(span);
});
}
}else {
fixupContainer.textContent='None';
}
}
var codeContainer=document.getElementById('native-disassembly');
codeContainer.innerHTML='';
result.instructions.forEach(function (inst){
var line=document.createElement('div');
line.className='asm-line';
var indicators=document.createElement('div');
indicators.className='asm-indicators';
if(inst.targetFlags){
if(inst.targetFlags.vector){
var v=document.createElement('div');
v.className='indicator-vector';
indicators.appendChild(v);
}
if(inst.targetFlags.subroutine){
var s=document.createElement('div');
s.className='indicator-subroutine';
indicators.appendChild(s);
}
if(inst.targetFlags.branch){
var b=document.createElement('div');
b.className='indicator-branch';
indicators.appendChild(b);
}
}
line.appendChild(indicators);
var offset=document.createElement('span');
offset.className='asm-offset';
offset.textContent=inst.offset.toString(16).padStart(4,'0').toUpperCase()+':';
var hex=document.createElement('span');
hex.className='asm-hex';
hex.textContent=inst.hex.padEnd(12,' ');
var mnem=document.createElement('span');
mnem.className='asm-mnem';
mnem.textContent=inst.mnem.padEnd(16,' ');
var oper=document.createElement('span');
oper.className='asm-oper';
oper.textContent=inst.operand.padEnd(12,' ');
var comment=document.createElement('span');
comment.className='asm-comment';
var commentText=inst.comment||"";
if(commentText&&!commentText.startsWith(';')){
commentText="; "+commentText;
}
comment.textContent=commentText;
line.appendChild(offset);
line.appendChild(hex);
line.appendChild(mnem);
line.appendChild(oper);
line.appendChild(comment);
codeContainer.appendChild(line);
});
};
window.NativeCodeEditor=NativeCodeEditor;