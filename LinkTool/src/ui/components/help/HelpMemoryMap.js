'use strict';
var HelpMemoryMap=(function (){
var doc=document;
var win=window;
if(window.location.search.indexOf('feature=helpmemorymap')!==-1){
window.addEventListener('load',initChildEnvironment);
}
function openWindow(){
var width=600,height=700;
var left=(screen.width-width)/2,top=(screen.height-height)/2;
var winParams='width='+width+',height='+height+',left='+left+',top='+top+',menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes';
var childWin=win.open('index.html?feature=helpmemorymap','HelpMemoryMap',winParams);
childWin.focus();
}
function initChildEnvironment(){
doc.title='Help: Data Pack Memory Map';
doc.body.innerHTML='';
if(window.opener&&window.opener.document){
var parentRoot=window.opener.document.documentElement;
doc.documentElement.style.cssText=parentRoot.style.cssText;
if(parentRoot.hasAttribute('data-theme'))doc.documentElement.setAttribute('data-theme',parentRoot.getAttribute('data-theme'));
}
var style=doc.createElement('style');
style.textContent=`
            :root {
                --bg-color: #f0f0f0; --text-color: #333; --toolbar-bg: #ffffff;
                --border-color: #ccc; --input-bg: #ffffff; --input-border: #ccc;
                --item-bg: var(--input-bg, #ffffff); --item-border: var(--border-color, #e0e0e0);
                --code-color: #0078d7; --accent-color: #e6f3ff;
            }
            body { margin: 0; padding: 0; background: var(--bg-color); color: var(--text-color); font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; height: 100vh; display: flex; flex-direction: column; overflow-x: hidden; }
            .header-bar { padding: 20px; background: var(--toolbar-bg); border-bottom: 1px solid var(--border-color); box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
            .header-bar h1 { margin: 0; font-size: 22px; color: var(--text-color); }
            .content-area { flex-grow: 1; overflow-y: auto; padding: 25px; line-height: 1.6; }
            .section { background: var(--item-bg); border: 1px solid var(--item-border); border-radius: 6px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
            .section-title { display: flex; align-items: center; margin-bottom: 15px; border-bottom: 2px solid var(--accent-color); padding-bottom: 10px; font-size: 18px; font-weight: 600; color: var(--text-color); }
            .legend-box { display: inline-block; width: 16px; height: 16px; border-radius: 4px; margin-right: 8px; vertical-align: middle; }
            ul { margin-top: 10px; padding-left: 0; list-style: none; }
            li { margin-bottom: 10px; display: flex; align-items: center; }
            .code-mono { font-family: monospace; background: rgba(128,128,128,0.1); padding: 2px 5px; border-radius: 3px; color: var(--code-color); }
            html[data-theme='dark'] .code-mono { color: #9cd4ff; background: rgba(255,255,255,0.1); }
            .tech-note { margin-top: 15px; background-color: var(--accent-color); padding: 10px 15px; border-left: 4px solid var(--code-color); border-radius: 0 4px 4px 0; color: #2b5e8c; font-size: 13.5px; }
            html[data-theme='dark'] .tech-note { background-color: rgba(0, 120, 215, 0.15); color: #9cd4ff; border-left-color: #9cd4ff; }
            details.tech-note summary { cursor: pointer; outline: none; font-weight: bold; display: list-item; }
            details.tech-note[open] summary { margin-bottom: 8px; }
        `;
doc.head.appendChild(style);
doc.body.innerHTML='<div class="header-bar"><h1>Data Pack Memory Map</h1></div>';
var content=doc.createElement('div');
content.className='content-area';
content.innerHTML=`
            <div>The <strong>Data Pack Memory Map</strong> is a visual chart that shows you exactly how space is being used inside your Datapak image. It helps you see how much space is free, and where old, deleted files might be wasting space.</div>
            
            <div class="section" style="margin-top:20px;">
                <div class="section-title">How It Works</div>
                <p>Imagine your Datapak as a long hallway. The map starts at the very beginning (Address <span class="code-mono">0x0000</span>) and goes all the way to the end of the pack's total capacity. The maximum size of this Datapak memory map dynamically scales depending on the exact hardware footprint declared within the header byte of the Data Pack itself (for instance, 8K, 16K, 32K, 64K or 128K).</p>
                <p><strong>Addressing & Paging:</strong> The absolute physical memory addresses are displayed explicitly at the start and end of every map bar for precise orientation. If the pack is a "paged" type (hardware containing internal 256 byte page increments of memory e.g. on packs typically 32K and larger), the map will natively render distinct divisions marking out the exact 256-byte segment boundaries where Psion data pack hardware pages occur.</p>
                <p>The system draws a coloured block for every file it finds. Big files get long blocks, and small files get short blocks.</p>
            </div>
            
            <div class="section">
                <div class="section-title">Color Guide (Legend)</div>
                <p>Each block of space is color-coded so you can quickly understand what it is:</p>
                <ul>
                    <li><span class="legend-box" style="background:#4CAF50;"></span> <strong>Pack Header:</strong> A tiny piece of system information at the very beginning of the pack.</li>
                    <li><span class="legend-box" style="background:#2196F3;"></span> <strong>Active Records:</strong> Your normal, safe files (like OPL programs or Notepads).</li>
                    <li><span class="legend-box" style="background:#f44336;"></span> <strong>Deleted Records:</strong> Files you deleted, but which still take up physical space. Because Flash and EPROM packs cannot erase single files, they leave these "ghosts" behind.</li>
                    <li><span class="legend-box" style="background:#FF9800;"></span> <strong>Unknown Data:</strong> Blocks of memory filled with data that doesn't look like a standard file.</li>
                    <li><span class="legend-box" style="background:#E0E0E0; border: 1px solid #ccc;"></span> <strong>Empty Space:</strong> The completely unused, blank area at the end of the pack.</li>
                </ul>
            </div>
            
            <div class="section">
                <div class="section-title">Exploring the Map</div>
                <p>If you move your mouse pointer over any colored block on the map, a small popup box will appear. This box tells you:</p>
                <ul style="list-style: disc; padding-left:25px;">
                    <li style="display:list-item; margin-bottom:5px;">The name of the file.</li>
                    <li style="display:list-item; margin-bottom:5px;">The size of the file.</li>
                    <li style="display:list-item; margin-bottom:5px;">Its exact starting position (Offset) inside the Datapak.</li>
                </ul>
                <p style="margin-top: 15px;"><strong>Interactive Hex Access:</strong> Clicking on any rendered record directly triggers the internal <span class="code-mono">Hex Viewer</span>, instantly jumping you to the exact physical memory offset containing that specific record's raw binary data!</p>
                
                <details class="tech-note">
                    <summary><strong>Technical Details (For advanced users):</strong></summary>
                    The memory map calculates offsets logically. Due to the Data pack hardware architecture, <em>Deleted Records</em> are physically skipped by the Psion operating system via internal byte pointers, but they permanently consume allocated sectors until the entire pack is formatted either using an Ultra Violet (U.V.) source for EPROMS or electronically via the Flash tool for Flash data packs.
                </details>
            </div>

            <div class="section">
                <div class="section-title">Configuration Options</div>
                <p>You can deeply customize how the memory map visually renders via the global application <strong>Options</strong> pane. Available tweaks include:</p>
                <ul style="list-style: disc; padding-left:25px;">
                    <li style="display:list-item; margin-bottom:5px;"><strong>Orientation:</strong> Toggle the map between a Horizontal timeline strip and a Vertical data stack.</li>
                    <li style="display:list-item; margin-bottom:5px;"><strong>Weightings:</strong> Adjust the map bar thickness weight for significantly improved legibility on larger packs.</li>
                    <li style="display:list-item; margin-bottom:5px;"><strong>Page Boundaries:</strong> Force the map renderer to unconditionally draw 256-byte pagination markers overlaying all data blocks, regardless of logical pack structure.</li>
                </ul>
            </div>
        `;
doc.body.appendChild(content);
}
return {openWindow:openWindow};
})();