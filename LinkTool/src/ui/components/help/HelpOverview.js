'use strict';
var HelpOverview=(function (){
var doc=document;
var win=window;
if(window.location.search.indexOf('feature=helpoverview')!==-1){
window.addEventListener('load',initChildEnvironment);
}
function openWindow(){
var width=650,height=750;
var left=(screen.width-width)/2,top=(screen.height-height)/2;
var winParams='width='+width+',height='+height+',left='+left+',top='+top+',menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes';
var childWin=win.open('index.html?feature=helpoverview','HelpOverview',winParams);
childWin.focus();
}
function initChildEnvironment(){
doc.title='Help: OPK Editor Overview';
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
            h3 { color: var(--code-color); margin-top: 15px; margin-bottom: 5px; font-size: 16px; }
            ul { margin-top: 5px; padding-left: 20px; }
            li { margin-bottom: 8px; }
            .tech-note { margin-top: 15px; background-color: var(--accent-color); padding: 10px 15px; border-left: 4px solid var(--code-color); border-radius: 0 4px 4px 0; color: #2b5e8c; font-size: 13.5px; }
            html[data-theme='dark'] .tech-note { background-color: rgba(0, 120, 215, 0.15); color: #9cd4ff; border-left-color: #9cd4ff; }
            details.tech-note summary { cursor: pointer; outline: none; font-weight: bold; display: list-item; }
            details.tech-note[open] summary { margin-bottom: 8px; }
        `;
doc.head.appendChild(style);
doc.body.innerHTML='<div class="header-bar"><h1>OPK Editor Overview</h1></div>';
var content=doc.createElement('div');
content.className='content-area';
content.innerHTML=`
            <div>The <strong>OPK Editor</strong> is a comprehensive toolkit designed entirely for the preparation, management, and review of PSION Organiser II Datapacks and OPL source code. It bridges the gap between modern editing capabilities and authentic binary execution compatibility.</div>
            
            <div class="section" style="margin-top:20px;">
                <div class="section-title">High-Level Capabilities</div>
                <p>The editor provides a full development lifecycle environment for PSION applications:</p>
                <ul>
                    <li><strong>Data Pack Preparation:</strong> Create newly formatted Datapaks, import binary <span class="code-mono">.OPK</span> / <span class="code-mono">.HEX</span> formats, and visually manage the internal file records.</li>
                    <li><strong>Code Management:</strong> Build OPL Procedures with syntax highlighting, auto-formatting, error checking, and integrated documentation.</li>
                    <li><strong>Review & Visualization:</strong> Effortlessly trace complex spaghetti-code dependencies across programs using the interactive Visualizer, or dive directly into the physical memory maps of the Datapak.</li>
                </ul>
            </div>
            
            <div class="section">
                <div class="section-title">Core Interface Layout</div>
                <h3>1. The Main Toolbar</h3>
                <p>Located at the very top of the application, the toolbar manages broad global actions. Here you can create New Packs, Save/Export your current work back to your computer, View Reports, and access the Options dialog to customize your workflow.</p>
                
                <h3>2. Pack Contents (Sidebar)</h3>
                <p>The left-hand sidebar displays your currently active Datapaks. It lists every physical record (OPL Procedures, Data Files, Notepads) strictly in the order they sequentially appear within the Datapak memory.</p>
                <details class="tech-note">
                    <summary><strong>Technical Details (Linear Memory Layout):</strong></summary>
                    The Pack Contents viewer is not just a standard file system tree. It is a literal representation of the 1-dimensional array of bytes on the original EPROM chips. Modifying the order using Drag-and-Drop actively rewrites the internal File Allocation Tables (FAT) and recalculates the byte offsets for every file pushed down the line.
                </details>

                <h3>3. The Editor Viewer (Main Pane)</h3>
                <p>The vast right-hand pane is your primary workspace. Whenever you select a record from the Pack Contents, the editor dynamically deploys the correct interface for that specific file type.</p>
                <ul>
                    <li>If you open a <strong>Procedure</strong>, it loads the advanced code editor giving you access to the internal Editor-Header tools (like Translate, Format, and Extract).</li>
                    <li>If you open a <strong>Data File or Spreadsheet</strong>, it deploys a grid-based viewer.</li>
                    <li>If you open the <strong>Pack Header</strong>, it provides a breakdown of the structural integrity of the entire volume.</li>
                </ul>
                <details class="tech-note">
                    <summary><strong>Technical Details (Decompilation & File Abstraction):</strong></summary>
                    The editor operates directly on raw hex bytes. If you select an OPL Procedure that was imported strictly as compiled Q-Code, the editor utilizes an embedded decompiler subsystem to transparently parse the underlying tokens and reverse-engineer the Abstract Syntax Tree (AST) into readable OPL text in real-time within the Viewer Pane.
                </details>
            </div>
        `;
doc.body.appendChild(content);
}
return {openWindow:openWindow};
})();