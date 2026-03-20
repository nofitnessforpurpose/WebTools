'use strict';
var HelpStartHere=(function (){
var doc=document;
var win=window;
if(window.location.search.indexOf('feature=helpstarthere')!==-1){
window.addEventListener('load',initChildEnvironment);
}
function openWindow(){
var width=650,height=750;
var left=(screen.width-width)/2,top=(screen.height-height)/2;
var winParams='width='+width+',height='+height+',left='+left+',top='+top+',menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes';
var childWin=win.open('index.html?feature=helpstarthere','HelpStartHere',winParams);
childWin.focus();
}
function initChildEnvironment(){
doc.title='Help: Start Here (Transferring & Tools)';
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
            a { color: var(--code-color); text-decoration: none; }
            a:hover { text-decoration: underline; }
            .tech-note { margin-top: 15px; background-color: var(--accent-color); padding: 10px 15px; border-left: 4px solid var(--code-color); border-radius: 0 4px 4px 0; color: #2b5e8c; font-size: 13.5px; }
            html[data-theme='dark'] .tech-note { background-color: rgba(0, 120, 215, 0.15); color: #9cd4ff; border-left-color: #9cd4ff; }
            details.tech-note summary { cursor: pointer; outline: none; font-weight: bold; display: list-item; }
            details.tech-note[open] summary { margin-bottom: 8px; }
        `;
doc.head.appendChild(style);
doc.body.innerHTML='<div class="header-bar"><h1>Start Here: Importing & OPK Basics</h1></div>';
var content=doc.createElement('div');
content.className='content-area';
content.innerHTML=`
            <div>Welcome! This guide explains how to create a brand new Datapak from scratch, and the standard methods available for importing existing packs from your vintage hardware into this environment. It also covers the fundamental file formats used by the Editor.</div>
            
            <div class="section" style="margin-top:20px;">
                <div class="section-title">What is an OPK File?</div>
                <p>An <span class="code-mono">.OPK</span> file is a complete 1:1 binary image dump of a physical Psion Organiser II data pack. It encapsulates every single byte of memory from the pack, precisely as it exists on the EPROM hardware and adds at the start a small 6 byte header ('OPK' and three length bytes) to aid its identification.</p>
                <ul>
                    <li><strong>Magic Header:</strong> Begins with the <code>OPK!</code> signature identifying the unique file format.</li>
                    <li><strong>Length Field:</strong> Indicates the exact byte size of the pack data slice.</li>
                    <li><strong>Pack Data:</strong> The consecutive block of hex bytes representing your files, procedures, and OS records.</li>
                    <li><strong>Terminator:</strong> Safely caps the end of the file.</li>
                </ul>
                <p>Opening an OPK in this Editor allows you to inspect the raw contents, view and heavily modify individual records (like rewriting OPL logic), and confidently export new image files.</p>
            </div>

            <div class="section">
                <div class="section-title">Creating a New Pack from Scratch</div>
                <p>You don't need a physical Psion Organiser II or existing files to start coding! If you are building a new application from the ground up, the Editor can completely synthesize a blank Datapak for you.</p>
                <ul>
                    <li>Click the <strong><i class="fas fa-box"></i> New Pack</strong> button on the top Toolbar.</li>
                    <li>The system will generate a mathematically perfect, blank binary Datapak footprint and pin it to your <strong>Pack Contents</strong> sidebar.</li>
                    <li>From there, you can use the <strong><i class="fas fa-file-code"></i> New OPL Procedure</strong> or <strong><i class="fas fa-database"></i> New Data File</strong> buttons to start injecting records directly into your newly minted pack.</li>
                    <li>When you are finished, click <strong>Save Pack (.opk)</strong> to download your compiled image for distribution!</li>
                </ul>
                <details class="tech-note" style="margin-top:15px;">
                    <summary><strong>Technical Details (Emulators):</strong></summary>
                    You don't even need a physical device to run your code! 
					<BR><BR>
					Emulators such as Jaap's web based PSION Organiser II implementation allow testing of data packs before finally committing to EPROM. The OPK files generated by OPK Editor 3 are directly compatible.
                </details>				
            </div>
            
            <div class="section">
                <div class="section-title">Importing & Transfer Tools</div>
                <p>To pull a physical Datapack off the Psion Organiser II so you can edit it here, you need a hardware COMMS Link and an intermediary transfer software tool.</p>
                
                <h3>The Modern Route: LinkTool</h3>
                <p>We highly recommend the novel web-based <strong><a href="https://nofitnessforpurpose.github.io/WebTools/LinkTool/" target="_blank">LinkTool Beta</a></strong> for retrieving OPK images. It runs directly natively in web browsers supporting Web Serial API, connecting straight to your serial port or USB-to-Serial adapter without installing external drivers or 3rd party apps.</p>
                <ul>
                    <li>Supports immediate direct downloads of Pack B & Pack C.</li>
                    <li>Outputs the raw proprietary <span class="code-mono">.OPK</span> file formats natively.</li>
                    <li>Outputs standard raw Intel Hex (<span class="code-mono">.HEX</span>) formats compatible with this editor.</li>
                </ul>

                <h3>Legacy Application Routes</h3>
                <p>If you prefer installing stand-alone programs, or you are running an older operating system, these legacy PC applications are highly regarded:</p>
                <ul>
                    <li><strong>ORG-Link:</strong> The definitive classic community standard for communicating via the Comms Link and building/pulling full pack images and discrete files.</li>
                    <li><strong>PSI2Win:</strong> A robust Windows-based wrapper for older 16-bit comms protocols that handles memory manipulation.</li>
                </ul>
                
                <details class="tech-note" style="margin-top:15px;">
                    <summary><strong>Technical Details (The MAKE.EXE Process Contrast):</strong></summary>
                    Before modern GUI web-editors like this one, OPL development predominantly relied on a complex toolchain using <span class="code-mono">TRAN.EXE</span> to compile code and <span class="code-mono">MAKE.EXE</span> to forcibly link object binaries into Pack formats via DOS lines. A detailed guide discussing the traditional MAKE.EXE pipeline can be <a href="https://drive.google.com/file/d/1fIfTSK8jGTtlaOtlkDx0eNl8GE1oxMy2/view" target="_blank">found here.</a> 
					<BR><BR>
					Our Editor abstracts that entire gruelling pipeline—providing syntax validation, compilation, and pack insertion natively inside the browser using modern reverse-engineered AST (Abstract Syntax Tree) manipulation.
					<BR><BR>
					To use those legacy tools you will need a DOS emulator package such as DOSbox or similar.
                </details>
            </div>
        `;
doc.body.appendChild(content);
}
return {openWindow:openWindow};
})();