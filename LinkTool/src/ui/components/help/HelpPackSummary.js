'use strict';
var HelpPackSummary=(function (){
var doc=document;
var win=window;
if(window.location.search.indexOf('feature=helppacksummary')!==-1){
window.addEventListener('load',initChildEnvironment);
}
function openWindow(){
var width=600,height=700;
var left=(screen.width-width)/2,top=(screen.height-height)/2;
var winParams='width='+width+',height='+height+',left='+left+',top='+top+',menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes';
var childWin=win.open('index.html?feature=helppacksummary','HelpPackSummary',winParams);
childWin.focus();
}
function initChildEnvironment(){
doc.title='Help: Pack Summary Report';
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
            p { margin-top: 0; margin-bottom: 15px; }
            ul { margin-top: 10px; padding-left: 20px; list-style: disc;}
            li { margin-bottom: 10px; }
            .tech-note { margin-top: 15px; background-color: var(--accent-color); padding: 10px 15px; border-left: 4px solid var(--code-color); border-radius: 0 4px 4px 0; color: #2b5e8c; font-size: 13.5px; }
            html[data-theme='dark'] .tech-note { background-color: rgba(0, 120, 215, 0.15); color: #9cd4ff; border-left-color: #9cd4ff; }
            details.tech-note summary { cursor: pointer; outline: none; font-weight: bold; display: list-item; }
            details.tech-note[open] summary { margin-bottom: 8px; }
        `;
doc.head.appendChild(style);
doc.body.innerHTML='<div class="header-bar"><h1>Pack Summary Report</h1></div>';
var content=doc.createElement('div');
content.className='content-area';
content.innerHTML=`
            <div>The <strong>Pack Summary Report</strong> provides a high-level statistical breakdown of all the data physically sitting inside your Datapak image. It offers a quick snapshot of how much memory is consumed by what types of files.</div>
            
            <div class="section" style="margin-top:20px;">
                <div class="section-title">Record Types</div>
                <p>The report categorizes the memory usage by application. Common categories include:</p>
                <ul>
                    <li><strong>OPL Procedures:</strong> The aggregated total bytes dedicated exclusively to executable program codes.</li>
                    <li><strong>Data Files & Notepads:</strong> The footprint used by spreadsheets, databases, and general-purpose notes.</li>
                    <li><strong>Deleted Space:</strong> The exact total amount of memory currently wasted by "ghost" records (files that were erased on the psion, but not fully formatted).</li>
                </ul>
            </div>
            
            <div class="section">
                <div class="section-title">Calculating Usage</div>
                <p>Alongside counting the number of files (e.g., "5 OPL Procedures"), the summary calculates the total Byte Weight of each category. This helps you figure out if one specific application is hoarding taking up all the physical space on an older 32KB Datapak.</p>
                <p>The report operates by scanning the actual file structure boundaries recursively during startup, ensuring accuracy down to the precise byte.</p>
                
                <details class="tech-note">
                    <summary><strong>Technical Details (Pack Boundaries):</strong></summary>
                    The summary parses the <span class="code-mono">Type 0</span> long-record headers mathematically to aggregate data footprints before extracting the underlying payloads. Items flagged with the <span class="code-mono">DELETED</span> bit (0x80 usually inside the ID byte) are safely bucketed separately so you can decide if a <span class="code-mono">Pack Format</span> sequence is required to reclaim physical storage space.
                </details>
            </div>
        `;
doc.body.appendChild(content);
}
return {openWindow:openWindow};
})();