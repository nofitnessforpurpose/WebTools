'use strict';
var HelpVisualizer=(function (){
var doc=document;
var win=window;
if(window.location.search.indexOf('feature=helpvisualizer')!==-1){
window.addEventListener('load',initChildEnvironment);
}
function openWindow(){
var width=600,height=700;
var left=(screen.width-width)/2,top=(screen.height-height)/2;
var winParams='width='+width+',height='+height+',left='+left+',top='+top+',menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes';
var childWin=win.open('index.html?feature=helpvisualizer','HelpVisualizer',winParams);
childWin.focus();
}
function initChildEnvironment(){
doc.title='Help: Code Visualiser';
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
            ul { margin-top: 10px; padding-left: 20px; list-style: disc;}
            li { margin-bottom: 10px; }
            .tech-note { margin-top: 15px; background-color: var(--accent-color); padding: 10px 15px; border-left: 4px solid var(--code-color); border-radius: 0 4px 4px 0; color: #2b5e8c; font-size: 13.5px; }
            html[data-theme='dark'] .tech-note { background-color: rgba(0, 120, 215, 0.15); color: #9cd4ff; border-left-color: #9cd4ff; }
            details.tech-note summary { cursor: pointer; outline: none; font-weight: bold; display: list-item; }
            details.tech-note[open] summary { margin-bottom: 8px; }
        `;
doc.head.appendChild(style);
doc.body.innerHTML='<div class="header-bar"><h1>Code Visualiser</h1></div>';
var content=doc.createElement('div');
content.className='content-area';
content.innerHTML=`
            <div>The <strong>Code Visualiser</strong> draws a giant flowchart of your entire Datapak. It shows you exactly which programs talk to each other, and how variables are shared between them.</div>
            
            <div class="section" style="margin-top:20px;">
                <div class="section-title">Navigating the Flowchart</div>
                <p>The map organizes all of your files into big boxes. Inside those boxes are your Procedures and Data Files.</p>
                <ul>
                    <li>Clicking on the "+" or "-" icons will collapse or expand boxes. If the map is too big, try collapsing items you don't need to see to save space.</li>
                    <li>Clicking on the body of a Procedure block explicitly highlights it on the map. If you have the "Code" button activated on the toolbar, the records OPL text will instantly appear in a side panel!</li>
                    <li>You can click and drag anywhere on empty space to pan the map around (just like dragging a map online).</li>
                    <li>Hold <strong>Ctrl</strong> on your keyboard and use your mouse wheel to easily Zoom in or out.</li>
                </ul>
            </div>
            
            <div class="section">
                <div class="section-title">Following the Lines</div>
                <p>The coloured lines connecting boxes show you what is happening under the hood:</p>
                <ul>
                    <li><strong>Solid Lines:</strong> Shows that one Procedure is directly triggering another Procedure to run (a Call).</li>
                    <li><strong>Dashed Lines:</strong> Shows that a Procedure is accessing a Global Variable created by someone else.</li>
                </ul>
                <p>Different colours mean different types of data: Green for whole numbers (Integers), Purple for Text (Strings), and Orange for decimals (Floating points).</p>
            </div>
            
            <div class="section">
                <div class="section-title">Filters and Legend</div>
                <p>If your pack has hundreds of connections, the screen might look like a messy spiderweb. Use the filter buttons on the top left of the menu to hide Dashed or Solid lines instantly. You can also click the <strong>Key</strong> button to bring up an interactive legend, allowing you to selectively hide specific colours (like hiding all purple text lines).</p>

                <details class="tech-note">
                    <summary><strong>Technical Details (For advanced users):</strong></summary>
                    The visualizer plots the relationships using a Directed Acyclic Graph (DAG) algorithm. A DAG ensures that complex, nested loops and bidirectional variable interactions do not result in infinite routing loops during graphics rendering.
					<br><br>
					Manhattan style path routing reduces visual clutter. Selection of a single path will cause it to glow for a short period enabling ready identification of source(s) and destination(s).
                </details>
            </div>
        `;
doc.body.appendChild(content);
}
return {openWindow:openWindow};
})();