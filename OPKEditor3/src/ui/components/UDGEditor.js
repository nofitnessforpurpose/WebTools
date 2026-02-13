var UDGEditor=(function (){
var childWindow=null;


if(window.location.search.indexOf('feature=udg')!==-1){
window.addEventListener('load',initChildEnvironment);
}

function openWindow(){
var width=702;
var height=828;
var left=(screen.width-width)/2;
var top=(screen.height-height)/2;

if(childWindow&&!childWindow.closed){
childWindow.focus();
return childWindow;
}

var win=window.open("index.html?mode=child&feature=udg","UDGEditor",`width=${width},height=${height},top=${top},left=${left}`);
if(!win){
alert("Please allow popups to open the Editor.");
return null;
}
childWindow=win;
return win;
}

function initChildEnvironment(){
var win=window;
if(!win||!win.document)return;


var cssVars="";
var bodyClass="";
if(typeof ThemeManager!=='undefined'){
var defs=ThemeManager.getThemeDefinition(ThemeManager.currentTheme);
for(var key in defs)cssVars+=`${key}: ${defs[key]};\n`;
bodyClass=document.body.className;
}


var doc=win.document;
var html=doc.documentElement;
if(html)html.style.cssText=cssVars;
if(doc.body)doc.body.className=bodyClass;

var style=doc.createElement('style');
style.textContent=`
            :root {
                --lcd-bg: #9ea792;
                --lcd-pixel-on: rgba(26, 27, 24, 0.9); 
                --lcd-pixel-off: transparent;
                --grid-line: #444;
                --grid-line-dotted: #666;
            }
            body {
                background-color: var(--bg-color);
                color: var(--text-color);
                font-family: 'Segoe UI', Tahoma, sans-serif;
                margin: 0; padding: 20px;
                display: flex;
                flex-direction: column;
                height: 100vh;
                box-sizing: border-box;
            }
            h2 { margin-top: 0; color: var(--syntax-keyword); }
            
            .controls-row {
                display: flex; gap: 20px; align-items: center; margin-bottom: 20px;
            }
            select {
                padding: 5px; font-size: 14px;
                background: var(--input-bg); color: var(--text-color);
                border: 1px solid var(--border-color);
            }

            .workspace {
                display: flex;
                gap: 20px;
                flex: 1;
                overflow: auto;
            }

            .grid-wrapper {
                display: flex;
                flex-direction: column;
            }

            .pixel-grid {
                display: grid;
                grid-template-columns: repeat(8, 64px);
                grid-template-rows: repeat(8, 64px);
                background-color: var(--lcd-bg);
                border: 2px solid var(--grid-line);
                width: max-content;
            }

            .pixel-cell {
                width: 64px; height: 64px;
                border-right: 1px solid var(--grid-line);
                border-bottom: 1px solid var(--grid-line);
                box-sizing: border-box;
                cursor: pointer;
                transition: background 0.1s;
            }
            /* Right border of last col */
            .pixel-cell:nth-child(8n) { border-right: none; }
            /* Bottom border of last row */
            .pixel-cell:nth-last-child(-n+8) { border-bottom: none; }

            .pixel-cell.active {
                background-color: var(--lcd-pixel-on);
            }

            /* Disabled Columns (0, 1, 2) i.e. 1st, 2nd, 3rd in 1-based nth-child */
            /* Using modulo logic or explicit classes. Classes are safer. */
            .pixel-cell.disabled {
                background-color: rgba(0,0,0,0.05);
                cursor: not-allowed;
                border-right: 1px dotted var(--grid-line-dotted);
            }
            
            .bit-values {
                display: grid;
                grid-template-columns: repeat(8, 64px);
                margin-top: 5px;
                text-align: center;
                font-family: monospace;
                font-size: 12px;
                color: var(--text-color);
                opacity: 0.7;
            }
            
            /* Cursor Highlight */
            .pixel-cell.active-cursor {
                outline: 2px solid red;
                z-index: 100;
            }

            .row-totals {
                display: grid;
                grid-template-rows: repeat(8, 64px);
                align-items: center;
                row-gap: 0; /* Match grid exactly */
                /* Adjust for border width of main grid? 
                   Main grid is 2px border. Cells are 64px. 
                   Total height = 8*64 + 4 (borders)? No, box-sizing border-box on cells usually helps,
                   but here the container has the border. 
                   We will align manually.
                */
                padding-top: 2px; /* Top border offset */
                font-family: monospace;
                font-size: 14px;
            }
            .total-cell {
                height: 64px;
                line-height: 64px;
                padding-left: 10px;
            }

            .code-output {
                margin-top: auto;
                padding: 20px 0;
                background: var(--container-header-bg);
                border-top: 1px solid var(--border-color);
                display: flex;
                gap: 10px;
                align-items: center;
            }
            input[type="text"] {
                flex: 0.65;
                font-family: Consolas, monospace;
                padding: 8px;
                font-size: 14px;
                background: var(--input-bg);
                color: var(--text-color);
                border: 1px solid var(--border-color);
            }
            button {
                padding: 8px;
                text-align: center;
                background: var(--list-hover-bg);
                color: var(--text-color);
                border: 1px solid var(--border-color);
                cursor: pointer;
                font-weight: bold;
            }
            button:hover { background: var(--syntax-keyword); color: #fff; }
            /* Specific fix for copy button text visibility on hover if needed */
            button:hover { 
                background: var(--syntax-keyword); 
                color: #fff;
                opacity: 0.85; /* Semi-opaque fill effect */
            }
            /* Specific fix for copy button text visibility on hover if needed */
            #btn-copy:hover { color: #fff; opacity: 0.9; }

            .error-input {
                border: 2px solid #e53935 !important;
                background-color: #ffebee !important;
                color: #b71c1c !important;
            }

        `;
doc.head.appendChild(style);


doc.body.innerHTML='';

var container=doc.createElement('div');
container.className='container';


var h2=doc.createElement('h2');
h2.textContent='Graphic Character Editor';
doc.body.appendChild(h2);


var controls=doc.createElement('div');
controls.className='controls-row';
controls.innerHTML=`
            <label>Character: 
                <select id="char-idx">
                    ${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<option value="${i}">${i}</option>`).join('')}
                </select>
            </label>
            <span style="opacity:0.6; font-size:12px;">Click grid cells to toggle pixels. (Usage: Left 3 columns are standard unused).</span>
        `;
doc.body.appendChild(controls);


var workspace=doc.createElement('div');
workspace.className='workspace';

workspace.tabIndex=0;
workspace.style.outline='none';


var gridWrapper=doc.createElement('div');
gridWrapper.className='grid-wrapper';

var grid=doc.createElement('div');
grid.className='pixel-grid';
grid.id='pixel-grid';



var rowValues=[0,0,0,0,0,0,0,0];

function renderGrid(){
grid.innerHTML='';
for(var r=0;r<8;r++){
for(var c=0;c<8;c++){
var cell=doc.createElement('div');
cell.className='pixel-cell';
cell.dataset.r=r;
cell.dataset.c=c;


var bitVal=1<<(7-c);
cell.dataset.bit=bitVal;


if(c<3){
cell.classList.add('disabled');
}else {

cell.addEventListener('mousedown',function (e){
toggleCell(this);
});


}


if(rowValues[r]&bitVal){
cell.classList.add('active');
}

grid.appendChild(cell);
}
}
}

gridWrapper.appendChild(grid);


var bits=doc.createElement('div');
bits.className='bit-values';
bits.innerHTML='<span>128</span><span>64</span><span>32</span><span>16</span><span>8</span><span>4</span><span>2</span><span>1</span>';
gridWrapper.appendChild(bits);

workspace.appendChild(gridWrapper);


var totalsPanel=doc.createElement('div');
totalsPanel.className='row-totals';
totalsPanel.id='row-totals';
workspace.appendChild(totalsPanel);

doc.body.appendChild(workspace);


var outputBox=doc.createElement('div');
outputBox.className='code-output';
outputBox.innerHTML=`
            <input type="text" id="udg-code">
            <button id="btn-hex-toggle" style="width:50px">Hex</button>
            <button id="btn-mode-toggle" style="width:50px">XP</button>
            <button id="btn-copy">Copy</button>
        `;
doc.body.appendChild(outputBox);


var charSelect=doc.getElementById('char-idx');
var codeInput=doc.getElementById('udg-code');
var hexBtn=doc.getElementById('btn-hex-toggle');
var modeBtn=doc.getElementById('btn-mode-toggle');
var copyBtn=doc.getElementById('btn-copy');

var useHex=true;
var useLZ=false;

function toggleCell(cell){
var r=parseInt(cell.dataset.r);
var bit=parseInt(cell.dataset.bit);

if(cell.classList.contains('active')){
cell.classList.remove('active');
rowValues[r]&=~bit;
}else {
cell.classList.add('active');
rowValues[r]|=bit;
}
updateUI();
}

function updateUI(){

totalsPanel.innerHTML='';
rowValues.forEach(val=>{
var div=doc.createElement('div');
div.className='total-cell';
div.textContent=`0x${val.toString(16).toUpperCase().padStart(2, '0')} (${val})`;
totalsPanel.appendChild(div);
});



var cVal=charSelect.value;












var cVal=charSelect.value;

var args;
if(useHex){
args=rowValues.map(v=>'$'+v.toString(16).toUpperCase());
}else {
args=rowValues;
}

if(useLZ){


code=`UDG ${cVal},${args.join(',')}`;
}else {

code=`UDG:(${cVal},${args.join(',')})`;
}





if(document.activeElement!==codeInput){
codeInput.value=code;
codeInput.classList.remove('error-input');
}
}


function parseInput(){
var val=codeInput.value.trim();



var match=val.match(/^UDG(?::\s*\(|\s+)(\d+)\s*,\s*(.+?)(?:\))?$/i);
if(!match){
codeInput.classList.add('error-input');
return;
}

var cVal=parseInt(match[1]);
var rawArgs=match[2].split(',');
if(rawArgs.length!==8){
codeInput.classList.add('error-input');
return;
}

var newRows=[];
for(var i=0;i<8;i++){
var s=rawArgs[i].trim();
var num=-1;
if(s.startsWith('$')){
num=parseInt(s.substring(1),16);
}else if(s.toLowerCase().startsWith('0x')){
num=parseInt(s,16);
}else {
num=parseInt(s,10);
}

if(isNaN(num)||num<0||num>255){
codeInput.classList.add('error-input');
return;
}
newRows.push(num);
}


codeInput.classList.remove('error-input');
charSelect.value=cVal;
rowValues=newRows;
renderGrid();


totalsPanel.innerHTML='';
rowValues.forEach(val=>{
let div=doc.createElement('div');
div.className='total-cell';
div.textContent=`0x${val.toString(16).toUpperCase().padStart(2, '0')} (${val})`;
totalsPanel.appendChild(div);
});

}

codeInput.addEventListener('input',parseInput);

charSelect.addEventListener('change',updateUI);

hexBtn.addEventListener('click',function (){
useHex=!useHex;
hexBtn.textContent=useHex?"Hex":"Dec";
updateUI();
});

modeBtn.addEventListener('click',function (){
useLZ=!useLZ;
modeBtn.textContent=useLZ?"LZ":"XP";
updateUI();
});

copyBtn.addEventListener('click',function (){
codeInput.select();
doc.execCommand('copy');
var orig=this.textContent;
this.textContent="Copied!";
setTimeout(()=>this.textContent=orig,1000);
});


renderGrid();
updateUI();


var cursorRow=0;
var cursorCol=3;

function updateCursor(){

var old=grid.querySelector('.active-cursor');
if(old)old.classList.remove('active-cursor');


var cells=grid.querySelectorAll('.pixel-cell');
var index=cursorRow*8+cursorCol;
if(cells[index])cells[index].classList.add('active-cursor');
}

doc.addEventListener('keydown',function (e){

if(e.target.tagName==='SELECT'||e.target.tagName==='INPUT'){
return;
}

if(e.key==='ArrowUp'){
if(cursorRow>0)cursorRow--;
updateCursor();
e.preventDefault();
}else if(e.key==='ArrowDown'){
if(cursorRow<7)cursorRow++;
updateCursor();
e.preventDefault();
}else if(e.key==='ArrowLeft'){
if(cursorCol>0)cursorCol--;
updateCursor();
e.preventDefault();
}else if(e.key==='ArrowRight'){
if(cursorCol<7)cursorCol++;
updateCursor();
e.preventDefault();
}else if(e.key===' '||e.key==='Enter'){

if(cursorCol>=3){
var index=cursorRow*8+cursorCol;
var cell=grid.querySelectorAll('.pixel-cell')[index];
if(cell)toggleCell(cell);
}
e.preventDefault();
}else if(e.key>='0'&&e.key<='7'){
charSelect.value=e.key;
updateUI();
}else if(e.key==='c'||e.key==='C'){
copyBtn.click();
}
});


doc.addEventListener('click',function (e){
if(e.target===doc.body||e.target.classList.contains('container')||e.target.classList.contains('workspace')){
workspace.focus();
}
});


updateCursor();


setTimeout(()=>workspace.focus(),100);
}

return {
openWindow:openWindow
};
})();