'use strict';
var HelpOPLEditor=(function (){
var doc=document;
var win=window;
if(window.location.search.indexOf('feature=helperopleditor')!==-1){
window.addEventListener('load',initChildEnvironment);
}
function openWindow(){
var width=600,height=700;
var left=(screen.width-width)/2,top=(screen.height-height)/2;
var winParams='width='+width+',height='+height+',left='+left+',top='+top+',menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes';
var childWin=win.open('index.html?feature=helperopleditor','HelpOPLEditor',winParams);
childWin.focus();
}
function initChildEnvironment(){
doc.title='Help: OPL Editor';
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
            p { margin-top: 0; }
            .code-mono { font-family: monospace; background: rgba(128,128,128,0.1); padding: 2px 5px; border-radius: 3px; color: var(--code-color); }
            html[data-theme='dark'] .code-mono { color: #9cd4ff; background: rgba(255,255,255,0.1); }
            .tech-note { margin-top: 15px; background-color: var(--accent-color); padding: 10px 15px; border-left: 4px solid var(--code-color); border-radius: 0 4px 4px 0; color: #2b5e8c; font-size: 13.5px; }
            html[data-theme='dark'] .tech-note { background-color: rgba(0, 120, 215, 0.15); color: #9cd4ff; border-left-color: #9cd4ff; }
            details.tech-note summary { cursor: pointer; outline: none; font-weight: bold; display: list-item; }
            details.tech-note[open] summary { margin-bottom: 8px; }
        `;
doc.head.appendChild(style);
doc.body.innerHTML='<div class="header-bar"><h1>OPL Editor</h1></div>';
var content=doc.createElement('div');
content.className='content-area';
content.innerHTML=`
            <div>The <strong>OPL Editor</strong> is your main workspace for viewing and modifying Psion Organiser II Programming Language (OPL) code.</div>
            
            <div class="section" style="margin-top:20px;">
                <div class="section-title">Operating Modes (Source vs Decompiler)</div>
                <p>When you select an OPL Procedure record from the PACK CONTENTS view of your data pack, the editor checks what data is actually available inside that specific record and operates in one of two modes:</p>
                
                <h3>1. Source Prioritization (Text is Present)</h3>
                <p>If the selected record contains original OPL Source Text (either exclusively, or alongside compiled Q-Code), the editor will always prioritize showing you this original source. The decompiler is completely bypassed. This guarantees you see the exact variable names, spacing, and comments exactly as they were written.</p>

                <h3>2. Decompiler Fallback (No Text Present)</h3>
                <p>If the selected record only contains compiled Q-Code, the editor will perform a complex translation. It reads these 8-bit tokens and dynamically reconstructs readable OPL code (a process called <em>decompiling</em>).</p>
                <p><strong>Note about Variable Names:</strong> When falling back to the Decompiler, the original names you gave to variables are often permanently lost because they are dropped during the compilation to Q-Code to save space. The editor will generate generic variable names (like <span class="code-mono">L1%</span> or <span class="code-mono">L1$</span>) to ensure the code remains perfectly logical, even if the semantic names are changed.</p>
				<p>It must also be noted that decompiled code may be imperfect, as recovery of the original control structures is not always possible.</p>

                <details class="tech-note">
                    <summary><strong>Technical Details (Q-Code vs Machine Code):</strong></summary>
                    It is important to note that the decompiler translates from <em>Q-Code</em> back into OPL text. Q-Code is the intermediate, tokenized bytecode that the Psion operating system interprets. 
                    The decompiler does <em>not</em> translate native 6303 Machine Code back into OPL. While the editor includes a raw disassembler feature to view native instructions, the core OPL Editor strictly targets Q-Code tokens.
                </details>
				<details class="tech-note">
                    <summary><strong>Technical Details (Q-Code to OPL Code):</strong></summary>
                    The decompilation process analyzes the record header to identify parameter signatures and local variable space. It builds memory maps for Global, External, and Array allocations by parsing embedded Fixup Tables. By linearly scanning and interpreting the underlying 8-bit Q-Code tokens, it traces logical branching and stack interactions to dynamically reconstruct a readable Abstract Syntax Tree (AST). During this phase, since original variable names were lost in compilation, generic logical placeholders (such as <span class="code-mono">L1%</span> or <span class="code-mono">A1$</span>) are generated based on operand usage inference.
				</details>
            </div>
            
            <div class="section">
                <div class="section-title">Editor Toolbar</div>
                <p>Located at the top of the editor workspace, the toolbar provides quick access to essential OPL coding actions. The layout uses standard icons to assist user orientation:</p>
                <ul>
                    <li style="margin-bottom: 8px;"><strong><i class="fas fa-circle-check"></i> Apply Changes</strong>: Saves your pure text edits to the Datapak memory. The <i class="fas fa-undo"></i> <strong>Discard</strong> button safely reverts any unsaved modifications.</li>
                    <li style="margin-bottom: 8px;"><strong><i class="fa-solid fa-feather-pointed"></i> Pretty Print / <i class="fa-solid fa-hammer"></i> Minify</strong>: Automatically formats your selection for readability, or strips out comments and excess spacing to heavily optimize Datapak memory use.</li>
                    <li style="margin-bottom: 8px;"><strong><i class="fas fa-indent"></i> / <i class="fas fa-outdent"></i> Indent</strong>: Rapidly shifts code blocks left or right to maintain structural clarity.</li>
                    <li style="margin-bottom: 8px;"><strong><i class="fas fa-mouse-pointer"></i> Select / <i class="far fa-copy"></i> Copy / <i class="fas fa-paste"></i> Paste</strong>: Standard text manipulation utilities context-aware to the OPL framework.</li>
                    <li style="margin-bottom: 8px;"><strong><i class="fas fa-gears"></i> Translate</strong>: Actively compiles your OPL source text into functional, executable Q-Code.</li>
                    <li style="margin-bottom: 8px;"><strong><i class="fa-solid fa-file-zipper"></i> Copy Object Code</strong>: Extracts the raw compiled binary payload to the clipboard for advanced debugging or system-level analysis.</li>
                    <li style="margin-bottom: 8px;"><strong><i class="fa-solid fa-file-circle-plus"></i> Extract Source</strong>: Isolates your OPL code from the QCode, moving it into a brand new OPL Text record.</li>
                </ul>
                <details class="tech-note">
                    <summary><strong>Technical Details (Space Efficiency & Minification):</strong></summary>
                    OPL source text consumes significantly more Datapak space than compiled Q-Code—often taking up more than twice the memory even for simple, uncommented logic. On smaller hardware Datapaks, this can rapidly exhaust available space. If you must store the original text alongside the executable code, using the <strong>Minify</strong> tool (<i class="fa-solid fa-hammer"></i>) prior to applying changes will strip out non-essential spaces and comments, heavily optimizing the text payload.
                </details>
            </div>
            
            <div class="section">
                <div class="section-title">Editor Features & View Options</div>
                <p>The OPL Editor provides visual assistance features that you can toggle globally via the main <strong>Options</strong> dialog.</p>
                <h3>Line Numbers</h3>
                <p>Enabling <strong>Show Line Numbers</strong> securely pins a numerical track to the left margin. This drastically improves file navigation and helps you pinpoint the exact location of syntax errors when the Translation process highlights them.</p>
                <h3>Code Folding</h3>
                <p>Enabling <strong>Code Folding</strong> generates small toggle arrows in the left margin next to major structural boundaries (such as loops, conditionals, and entire procedures). Clicking these arrows allows you to collapse and expand large blocks of code, dramatically improving the readability of massive files.</p>
                <details class="tech-note" style="margin-top: 15px;">
                    <summary><strong>Technical Details (Folding & Syntax Limitations):</strong></summary>
                    Please note that the editor's syntax parser attempts to accurately identify logical blocks for folding. However, OPL intrinsically allows for highly irregular code flow (such as arbitrary <code>GOTO</code> jumps that break standard block rules, or non-standard spacing). Because of this flexibility, the code folding algorithm may occasionally struggle to properly align the fold constraints. If a fold appears misaligned, it is typically a reflection of highly complex, unstructured, or invalid OPL logic present inside the block.
                </details>
            </div>
            
            <div class="section">
                <div class="section-title">Applying and Translating Changes</div>
                <p>When you finish typing your code, you must click the <strong>Apply</strong> button (<i class="fas fa-circle-check"></i>) to save the text. However, simply applying the text does <em>not</em> automatically make the program runnable by the device. The readable OPL text (Source Text) and the compiled instructions (Q-Code) are stored as two completely separate pieces inside the file record.</p>
                <p>It is your responsibility to actively <strong>Translate</strong> the code (<i class="fas fa-gears"></i>) when you are ready. Clicking Translate will start a process that thoroughly checks your work for spelling mistakes or missing brackets. If it finds a problem, the editor will highlight the error exactly where it stops in the code flow.</p>
                <p>Once the translation is completely successful, the editor converts your OPL text into new Q-Code instructions, updating the actual executable portion of that specific file record.</p>
                
                <details class="tech-note">
                    <summary><strong>Technical Details (Source vs Q-Code Separation & Memory Shifts):</strong></summary>
                    The editor explicitly isolates the OPL Source Text string from the compiled Q-Code payload within the record's structural header. Translating the code invokes the compiler engine, which parses the flat text into an Abstract Syntax Tree (AST) before generating the raw 8-bit Psion QCodes that the hardware expects.<br><br>
                    Because Datapaks allocate records end-to-end linearly, injecting new translated Q-Code often changes the byte size of the target record. The editor automatically shifts all subsequent records in the pack up or down to accommodate this new size dynamically.
                </details>
                <details class="tech-note" style="margin-top: 15px;">
                    <summary><strong>Technical Details (Translation & Space Consumption):</strong></summary>
                    Translation converts your human-readable OPL source into highly optimized execution tokens. If you elect to leave the resulting OPL source text attached to the record, the compiled Q-Code is prepended directly before the OPL source text. Because storing both the OPL source text and the compiled tokens dramatically impacts data pack footprint, distributing records containing <em>only</em> the translated Q-Code is the most space and access-efficient method for production programs, albeit at the expense of immediate source text availability.
                </details>
            </div>
        `;
doc.body.appendChild(content);
}
return {openWindow:openWindow};
})();