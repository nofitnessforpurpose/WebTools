'use strict';
var HelpOptions=(function (){
var doc=document;
var win=window;
if(window.location.search.indexOf('feature=helpoptions')!==-1){
window.addEventListener('load',initChildEnvironment);
}
function openWindow(){
var width=600,height=700;
var left=(screen.width-width)/2,top=(screen.height-height)/2;
var winParams='width='+width+',height='+height+',left='+left+',top='+top+',menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes';
var childWin=win.open('index.html?feature=helpoptions','HelpOptions',winParams);
childWin.focus();
}
function initChildEnvironment(){
doc.title='Help: System Options';
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
            .tech-note { margin-top: 15px; background-color: var(--accent-color); padding: 10px 15px; border-left: 4px solid var(--code-color); border-radius: 0 4px 4px 0; color: #2b5e8c; font-size: 13.5px; }
            html[data-theme='dark'] .tech-note { background-color: rgba(0, 120, 215, 0.15); color: #9cd4ff; border-left-color: #9cd4ff; }
            details.tech-note summary { cursor: pointer; outline: none; font-weight: bold; display: list-item; }
            details.tech-note[open] summary { margin-bottom: 8px; }
        `;
doc.head.appendChild(style);
doc.body.innerHTML='<div class="header-bar"><h1>System Options</h1></div>';
var content=doc.createElement('div');
content.className='content-area';
content.innerHTML=`
            <div>The <strong>Options</strong> menu lets you customize the appearance and behavior of the OPK Editor. When you change a setting here, the editor remembers your choice for the next time you use it.</div>
            
            <div class="section" style="margin-top:20px;">
                <div class="section-title">Visual and Editor Settings</div>
                <p><strong>Auto Format OPL:</strong> If you turn this on, the editor will automatically organize your code with neat spacing (indentations) to make it easier to read. For example, lines inside an 'IF' statement will be grouped together visually.</p>
                <p><strong>Show Code Block Margins:</strong> This adds small graphical lines next to the text in the code editor, visually linking the start and end of code loops so you don't get lost inside long programs.</p>
                <p><strong>Dark Mode (Night View):</strong> Switching this on turns the entire editor from a light, white appearance to a deep gray and dark blue color scheme, reducing eye strain in dark rooms.</p>
            </div>
            
            <div class="section">
                <div class="section-title">Hardware and Communication</div>
                <p>These advanced settings let you tell the editor what type of physical Datapak you are working with (like an older EPROM or a modern Flash pack). This helps the software warn you if you write too much code that would physically break your specific device type.</p>
                <p>You can also adjust checksum verification limits if you are working closely with external communication cables (Comms Link) and need to suppress standard safety errors.</p>

                <details class="tech-note">
                    <summary><strong>Technical Details (For advanced users):</strong></summary>
                    Modifying checksum rules effectively disables the packet validation constraints within the <span class="code-mono">Compiler.js</span> core, allowing malformed payload chunks to be exported into raw hex sequence strings for debugging hardware sync failures.
                </details>
            </div>
        `;
doc.body.appendChild(content);
}
return {openWindow:openWindow};
})();