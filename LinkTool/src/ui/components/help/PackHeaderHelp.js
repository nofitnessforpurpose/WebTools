'use strict';
var PackHeaderHelp=(function (){
var doc=document;
var win=window;
if(window.location.search.indexOf('feature=packheaderhelp')!==-1){
window.addEventListener('load',initChildEnvironment);
}
function openWindow(){
var width=600;
var height=700;
var left=(screen.width-width)/2;
var top=(screen.height-height)/2;
var winParams=[
'width='+width,
'height='+height,
'left='+left,
'top='+top,
'menubar=no',
'toolbar=no',
'location=no',
'status=no',
'resizable=yes',
'scrollbars=yes'
].join(',');
var childWin=win.open('index.html?feature=packheaderhelp','PsionPackHeaderHelp',winParams);
childWin.focus();
}
function initChildEnvironment(){
doc.title='Pack Header Reference';
doc.body.innerHTML='';
if(window.opener&&window.opener.document){
var parentRoot=window.opener.document.documentElement;
doc.documentElement.style.cssText=parentRoot.style.cssText;
if(parentRoot.hasAttribute('data-theme')){
doc.documentElement.setAttribute('data-theme',parentRoot.getAttribute('data-theme'));
}
}
var style=doc.createElement('style');
style.textContent=`
            :root {
                --bg-color: #f0f0f0;
                --text-color: #333;
                --toolbar-bg: #ffffff;
                --border-color: #ccc;
                --input-bg: #ffffff;
                --input-border: #ccc;
                --item-bg: var(--input-bg, #ffffff);
                --item-border: var(--border-color, #e0e0e0);
                --code-color: #0078d7;
                --accent-color: #e6f3ff;
            }
            body { 
                margin: 0; 
                padding: 0; 
                background: var(--bg-color); 
                color: var(--text-color);
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                height: 100vh;
                display: flex;
                flex-direction: column;
                overflow-x: hidden;
            }
            .header-bar {
                padding: 20px;
                background: var(--toolbar-bg);
                border-bottom: 1px solid var(--border-color);
                box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                z-index: 10;
            }
            .header-bar h1 {
                margin: 0;
                font-size: 22px;
                color: var(--text-color);
            }
            .content-area {
                flex-grow: 1;
                overflow-y: auto;
                padding: 25px;
            }
            .byte-section {
                background: var(--item-bg);
                border: 1px solid var(--item-border);
                border-radius: 6px;
                padding: 20px;
                margin-bottom: 20px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.02);
            }
            .byte-title {
                display: flex;
                align-items: center;
                margin-bottom: 15px;
                border-bottom: 2px solid var(--accent-color);
                padding-bottom: 10px;
            }
            .byte-badge {
                background-color: var(--code-color);
                color: white;
                font-family: monospace;
                font-weight: bold;
                padding: 4px 10px;
                border-radius: 12px;
                margin-right: 15px;
                font-size: 14px;
            }
            .byte-name {
                font-size: 18px;
                font-weight: 600;
                color: var(--text-color);
            }
            .byte-desc {
                line-height: 1.6;
                color: var(--text-color);
            }
            .byte-desc ul {
                margin-top: 10px;
                margin-bottom: 0;
                padding-left: 20px;
            }
            .byte-desc li {
                margin-bottom: 5px;
            }
            .boot_diff {
                margin-top: 15px;
                background-color: var(--accent-color);
                padding: 10px 15px;
                border-left: 4px solid var(--code-color);
                border-radius: 0 4px 4px 0;
                color: #2b5e8c; 
            }
            html[data-theme='dark'] .boot_diff {
                background-color: rgba(0, 120, 215, 0.15);
                color: #9cd4ff;
                border-left-color: #9cd4ff;
            }
            .code-mono {
                font-family: monospace;
                background: rgba(128,128,128,0.1);
                padding: 2px 5px;
                border-radius: 3px;
                color: var(--code-color);
            }
            html[data-theme='dark'] .code-mono {
                color: #9cd4ff;
                background: rgba(255,255,255,0.1);
            }
        `;
doc.head.appendChild(style);
var header=doc.createElement('div');
header.className='header-bar';
header.innerHTML='<h1>Pack Header Reference</h1>';
doc.body.appendChild(header);
var content=doc.createElement('div');
content.className='content-area';
var intro=doc.createElement('div');
intro.style.marginBottom='25px';
intro.style.lineHeight='1.6';
intro.innerHTML='Every Datapak image (.opk, .bin) contains a 10-byte header block (bytes 0 to 9). The Pack Header Viewer displays these bytes alongside representations of their function. This reference table breaks down each byte exactly as the editor interprets it.';
content.appendChild(intro);
function addByteSection(byteLabels,name,descHtml){
var sec=doc.createElement('div');
sec.className='byte-section';
var badgeText=Array.isArray(byteLabels)?'Bytes '+byteLabels.join('-'):'Byte '+byteLabels;
var html='<div class="byte-title">';
html+='<span class="byte-badge">'+badgeText+'</span>';
html+='<span class="byte-name">'+name+'</span>';
html+='</div>';
html+='<div class="byte-desc">'+descHtml+'</div>';
sec.innerHTML=html;
content.appendChild(sec);
}
addByteSection(
0,
'Flags',
'Bitmask indicating the features of the Datapak. It uses the following bit assignments:<br>' +
'<ul>' +
'<li><span class="code-mono">Bit 1: EPROM</span> - Indicates if the pack is an EPROM standard.</li>' +
'<li><span class="code-mono">Bit 2: Paged</span> - Indicates if the pack uses a paged memory scheme (Standard for packs 32K and above).</li>' +
'<li><span class="code-mono">Bit 3: Write Prot</span> - Write Protection (Active low; cleared when protected).</li>' +
'<li><span class="code-mono">Bit 4: Bootable</span> - Identifies the pack as Bootable (Active low). Modifies the structural interpretation of the Time Stamp and Frame Counter bytes.</li>' +
'<li><span class="code-mono">Bit 5: Copy Prot</span> - Copy Protection (Active low).</li>' +
'<li><span class="code-mono">Bit 6: Flashpack</span> - Indicates a Flash media pack (Active low).</li>' +
'</ul>'
);
addByteSection(
1,
'Pack Size',
'Denotes the total size of the Datapak image. The standard encoded value acts as a multiplier of 8 Kilobytes (8K).<br>' +
'<ul>' +
'<li><span class="code-mono">01</span> -> 8K</li>' +
'<li><span class="code-mono">02</span> -> 16K</li>' +
'<li><span class="code-mono">04</span> -> 32K</li>' +
'<li><span class="code-mono">08</span> -> 64K</li>' +
'<li>And so on up to <span class="code-mono">128</span> -> 1024K (1MB)</li>' +
'</ul>' +
'If the value does not correspond to a standard power-of-two multiplier, it is treated as a Custom/Linear size multiplier.'
);
addByteSection(
[2,3,4,5],
'Time Stamp',
'Stores the date and time when the pack was formatted or authored.<br>' +
'<ul>' +
'<li><span class="code-mono">Byte 2 (Year)</span> - Years since 1900.</li>' +
'<li><span class="code-mono">Byte 3 (Month)</span> - 0-indexed month (0 = January).</li>' +
'<li><span class="code-mono">Byte 4 (Day)</span> - 0-indexed day of the month.</li>' +
'<li><span class="code-mono">Byte 5 (Hour)</span> - Hour in 24-hour format.</li>' +
'</ul>' +
'<div class="boot_diff">' +
'<strong>[Bootable Packs]</strong> When the Bootable flag (Byte 0, Bit 4) is set, these bytes are repurposed as <strong>Boot Data</strong>:<br>' +
'• <span class="code-mono">Byte 2</span> becomes the <strong>Code</strong> parameter.<br>' +
'• <span class="code-mono">Byte 3</span> becomes the <strong>ID</strong> (Peripheral Device ID).<br>' +
'• <span class="code-mono">Byte 4</span> becomes the software <strong>Version</strong>.<br>' +
'• <span class="code-mono">Byte 5</span> evaluates to the <strong>Priority</strong> of the bootable module.' +
'</div>'
);
addByteSection(
[6,7],
'Frame Counter',
'Used internally as a metadata counter (e.g., formatting sequence count) on standard packs.<br>' +
'<ul>' +
'<li><span class="code-mono">Byte 6 (Count 1)</span></li>' +
'<li><span class="code-mono">Byte 7 (Count 2)</span></li>' +
'</ul>' +
'<div class="boot_diff">' +
'<strong>[Bootable Packs]</strong> When Bootable is set, these bytes are entirely repurposed as the <strong>Boot Address</strong>:<br>' +
'• <span class="code-mono">Bytes 6 and 7</span> store a physical address offset pointing to the root Boot record / executable code within the pack image.' +
'</div>'
);
addByteSection(
[8,9],
'Header Checksum',
'A 16-bit checksum used to verify the integrity of the 8 preceding header bytes. The editor automatically recalculates this whenever header properties are modified.'
);
doc.body.appendChild(content);
}
return {
openWindow:openWindow
};
})();