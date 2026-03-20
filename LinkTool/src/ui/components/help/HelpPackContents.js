'use strict';
var HelpPackContents=(function (){
var doc=document;
var win=window;
if(window.location.search.indexOf('feature=helppackcontents')!==-1){
window.addEventListener('load',initChildEnvironment);
}
function openWindow(){
var width=600,height=700;
var left=(screen.width-width)/2,top=(screen.height-height)/2;
var winParams='width='+width+',height='+height+',left='+left+',top='+top+',menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes';
var childWin=win.open('index.html?feature=helppackcontents','HelpPackContents',winParams);
childWin.focus();
}
function initChildEnvironment(){
doc.title='Help: Pack Contents';
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
doc.body.innerHTML='<div class="header-bar"><h1>Pack Contents</h1></div>';
var content=doc.createElement('div');
content.className='content-area';
content.innerHTML=`
            <div>The <strong>Pack Contents</strong> sidebar is your main navigation tool. It lists all the files and elements currently stored inside your Datapak image.</div>
            
            <div class="section" style="margin-top:20px;">
                <div class="section-title">File List Organization</div>
                <p>The items you see in the sidebar are ordered exactly as they physically appear inside the memory of the Datapak. The editor looks at this raw block of memory and automatically figures out what each piece of data is (such as an OPL Program, a Data File, or a Notepad entry).</p>
            </div>
            
            <div class="section">
                <div class="section-title">Browser Storage & Pack Resumption</div>
                <p>By default, the editor saves your active Datapaks so you can seamlessly resume your work the next time you open the application. You can toggle this feature via the <strong>Auto-Restore Opened Packs on Startup</strong> setting located in the <strong>Options</strong> dialog.</p>
                
                <details class="tech-note" style="margin-bottom: 15px;">
                    <summary><strong>Technical Details (Local Storage Mechanics):</strong></summary>
                    It is helpful to understand that automatically restored packs are <em>not</em> dynamically linked to the original <span class="code-mono">.OPK</span> or <span class="code-mono">.HEX</span> files on your computer's hard drive. Web browsers operate inside a security sandbox and cannot maintain persistent, background connections to your local filesystem.<br><br>
                    Instead, when a pack is loaded, the editor encodes the entire binary payload into a format called Base64 and caches it securely within the browser's dedicated <code>localStorage</code> database. Upon restart, the application rebuilds the active memory structure entirely from this internal cache. Because of this architectural isolation, any edits you make will strictly exist inside the browser's cache until you finalize them by actively clicking <strong>Save</strong> or <strong>Export</strong> to download a new, updated file back to your machine.
                </details>
            </div>
            
            <div class="section">
                <div class="section-title">Interacting with the List</div>
                <h3>Selection</h3>
                <p>Clicking on any item will open it in the main editing area. The editor will automatically choose the best tool for the job (for example, showing code for OPL files, or a spreadsheet grid for data files).</p>
                
                <h3>Drag and Drop (Multiple Packs & Reordering)</h3>
                <p>A uniquely powerful feature of the Pack Contents view is its full Drag and Drop support. Note that all drag-and-drop file operations are applied instantly to the memory structure.</p>
                <ul>
                    <li><strong>Opening Files:</strong> You can drag a <span class="code-mono">.OPK</span> or <span class="code-mono">.HEX</span> file directly from your computer into the application to instantly open a new pack view.</li>
                    <li><strong>Multi-Select:</strong> You can hold the <strong>Ctrl</strong> or <strong>Shift</strong> keys on your keyboard while clicking to highlight multiple records at once. This is perfect for bulk reorganizing.</li>
                    <li><strong>Changing Order:</strong> You can reorganize files by clicking and dragging them up or down within the same Datapak.</li>
                    <li><strong>Copying and Moving:</strong> You can drag single or multi-selected records across into completely different Datapak windows. The interface follows standard window behaviors, where you can easily Copy or Move items between packs to organize your libraries.</li>
                </ul>

                <details class="tech-note" style="margin-bottom: 15px;">
                    <summary><strong>Technical Details (Record Management & Indexing):</strong></summary>
                    While changing the order inside the Datapak is visually simple, it has real physical performance impacts on original hardware. The native Datapak indexing scheme is pseudo-linear, broken into small 256-byte frames. If you place your most frequently accessed files at the very top of the pack, the device will find and load them significantly faster because it doesn't have to sequentially parse through thousands of trailing pages.<br><br>
                    Furthermore, moving or copying records between packs involves deep binary management. The editor actively reconstructs the target Datapak's internal file allocation tables and automatically shifts physical byte offsets to accommodate the injected record payloads.
                </details>

                <h3>Recycle (Undelete)</h3>
                <p>If a record has been marked as <em>Deleted</em>, you can recover it using the <strong>Recycle</strong> function. This action simply strips the deletion marker, making the record available and active once again within the pack.</p>
                
                <details class="tech-note" style="margin-bottom: 15px;">
                    <summary><strong>Technical Details (Linear Execution & Name Resolution):</strong></summary>
                    The PSION Organiser II operating system accesses Data Packs sequentially. When searching for a file, such as an OPL Procedure, the device scans the pack from top to bottom and exclusively uses the <em>first</em> matching, non-deleted record it finds.<br><br>
                    For example, if two procedures are stored on a data pack and share the exact same name, only the first one located in the linearly accessed data pack will be utilized. If you recycle a deleted record that happens to sit higher up in the memory block, it will intercept any system calls to that name, effectively becoming the active program.
                </details>

                <h3>Toolbar Actions</h3>
                <p>Once you have an item selected in the list, you can use the buttons on the main top application toolbar to perform actions on it. For instance, you can click the <strong>Export</strong> button to save that specific file to your computer, or the <strong>Delete</strong> button to mark the item as erased from the pack.</p>
            </div>
            
            <div class="section">
                <div class="section-title">Understanding the Icons</div>
                <p>The small icons next to the file names give you important clues about their status and structural type:</p>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 15px; margin-bottom: 15px;">
                    <div><i class="fa-regular fa-file-code" style="width:20px; color:var(--text-color);"></i> <strong>OPL Procedure</strong></div>
                    <div><i class="fas fa-table" style="width:20px; color:var(--text-color);"></i> <strong>Data File</strong></div>
                    <div><i class="fas fa-note-sticky" style="width:20px; color:var(--text-color);"></i> <strong>Notepad</strong></div>
                    <div><i class="fas fa-file-lines" style="width:20px; color:var(--text-color);"></i> <strong>Data Record</strong></div>
                    <div><i class="fas fa-microchip" style="width:20px; color:var(--text-color);"></i> <strong>Compiled OPL (QCode)</strong></div>
                    <div><i class="fas fa-book" style="width:20px; color:var(--text-color);"></i> <strong>Diary</strong></div>
                    <div><i class="fas fa-table-cells" style="width:20px; color:var(--text-color);"></i> <strong>Spreadsheet</strong></div>
                    <div><i class="fas fa-receipt" style="width:20px; color:var(--text-color);"></i> <strong>Pack Header</strong></div>
                </div>

                <ul>
                    <li><strong><i class="fas fa-rectangle-xmark" style="color:#d32f2f;"></i> End Of Pack:</strong> The structural boundary closing the Datapak.</li>
                    <li><strong><i class="fas fa-trash-can" style="color:#f44336;"></i> Strikethrough Text:</strong> This indicates a <em>Deleted</em> item. On the original Psion devices, files are "marked" as deleted but the data isn't erased until the pack is reformatted. This leaves behind "dead space" that still takes up memory.</li>
                    <li><strong><i class="fas fa-circle-question" style="color:#FF9800;"></i> Unrecognized Item:</strong> This means the editor found a block of data, but doesn't know what application it belongs to. You can still open it as raw data (Hexadecimal).</li>
                </ul>

                <details class="tech-note" style="margin-bottom: 15px;">
                    <summary><strong>Technical Details (OPL Procedure Management):</strong></summary>
                    The micro chip icon indicates a record containing compiled QCode. There are two cases for this scenario: QCode-only, and QCode with attached original OPL Source Text. Because the Psion execution OS requires QCode instructions to sit at the absolute beginning of the record payload to run successfully, any appended OPL Source Text must physically trail <em>after</em> the QCode. The editor parses the structural header to manage this relationship dynamically.
                </details>
            </div>
        `;
doc.body.appendChild(content);
}
return {openWindow:openWindow};
})();