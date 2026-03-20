'use strict';
var HelpPhysicalConnection=(function (){
var doc=document;
var win=window;
if(window.location.search.indexOf('feature=helpphysicalconnection')!==-1){
window.addEventListener('load',initChildEnvironment);
}
function openWindow(){
var width=650,height=750;
var left=(screen.width-width)/2,top=(screen.height-height)/2;
var winParams='width='+width+',height='+height+',left='+left+',top='+top+',menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes';
var childWin=win.open('index.html?feature=helpphysicalconnection','HelpPhysicalConnection',winParams);
childWin.focus();
}
function initChildEnvironment(){
doc.title='Help: Physical RS232 Connection';
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
doc.body.innerHTML='<div class="header-bar"><h1>Step-by-Step: Physical Hardware Transfer</h1></div>';
var content=doc.createElement('div');
content.className='content-area';
content.innerHTML=`
            <div class="section" style="margin-bottom: 20px; padding: 15px; border-left: 4px solid var(--code-color);">
                <strong style="color: var(--code-color);">Summary Overview:</strong> This guide provides a high-level summary of the physical RS232 preparation and boot sequence required to successfully <strong>transfer</strong> a Datapak to or from the Psion Organiser II. 
                <br><br>While the <a href="https://nofitnessforpurpose.github.io/WebTools/LinkTool/" target="_blank">LinkTool</a> currently primarily supports downloads, the general hardware preparation process for <em>uploads</em> is largely identical. For the complete authoritative instructions, please refer directly to the <a href="https://nofitnessforpurpose.github.io/WebTools/LinkTool/docs/user_manual.html" target="_blank">LinkTool Official User Manual</a>.
            </div>
            
            <div class="section" style="margin-top:20px;">
                <div class="section-title">1. Prepare Your Hardware</div>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); grid-template-rows: auto auto; gap: 20px; margin: 20px 0;">
                    <div style="grid-column: 1; grid-row: 1 / 3; background-color: var(--item-bg); border: 1px solid var(--border-color); border-radius: 8px; padding: 15px; text-align: center;">
                        <div style="height: 160px; display: flex; align-items: center; justify-content: center; margin-bottom: 10px;">
                            <img src="assets/pics/hardware_diagram.jpg" alt="Psion Organiser II with COMMS Link" style="max-height: 95%; max-width: 95%; width: auto; height: auto; border-radius: 4px; background-color: #f5f5f5; padding: 8px;">
                        </div>
                        <h4 style="color: var(--code-color); margin: 10px 0 5px 0; font-size: 1em;">Psion Organiser II</h4>
                        <p style="margin: 5px 0; font-size: 0.9em; color: var(--text-color);">With COMMS Link and data pack installed (Pack B or Pack C)</p>
                    </div>
                    <div style="grid-column: 2; grid-row: 1; background-color: var(--item-bg); border: 1px solid var(--border-color); border-radius: 8px; padding: 15px 10px 5px 10px; text-align: center; max-height: 140px;">
                        <div style="height: 60px; display: flex; align-items: center; justify-content: center; margin-bottom: 8px;">
                            <img src="assets/pics/data_pack_diagram.png" alt="Data Pack" style="max-height: 100%; max-width: 100%; width: auto; height: auto; border-radius: 4px; background-color: #f5f5f5; padding: 6px;">
                        </div>
                        <h4 style="color: var(--code-color); margin: 6px 0 3px 0; font-size: 0.92em;">Data Pack</h4>
                        <p style="margin: 3px 0; font-size: 0.82em; color: var(--text-color);">Pack B or Pack C</p>
                    </div>
                    <div style="grid-column: 2; grid-row: 2; background-color: var(--item-bg); border: 1px solid var(--border-color); border-radius: 8px; padding: 15px 10px 5px 10px; text-align: center; max-height: 140px;">
                        <div style="height: 60px; display: flex; align-items: center; justify-content: center; margin-bottom: 8px;">
                            <img src="assets/pics/power_supply_diagram.png" alt="Power Supply" style="max-height: 100%; max-width: 100%; width: auto; height: auto; border-radius: 4px; background-color: #f5f5f5; padding: 6px;">
                        </div>
                        <h4 style="color: var(--code-color); margin: 6px 0 3px 0; font-size: 0.92em;">Power Supply</h4>
                        <p style="margin: 3px 0; font-size: 0.82em; color: var(--text-color);">Recommended</p>
                    </div>
                    <div style="grid-column: 3; grid-row: 1 / 3; background-color: var(--item-bg); border: 1px solid var(--border-color); border-radius: 8px; padding: 15px; text-align: center;">
                        <div style="height: 160px; display: flex; align-items: center; justify-content: center; margin-bottom: 10px;">
                            <img src="assets/pics/serial_adapter_diagram.png" alt="USB Serial Adapter" style="max-height: 70%; max-width: 70%; width: auto; height: auto; border-radius: 4px; background-color: #f5f5f5; padding: 8px; transform: rotate(90deg) scale(1.4);">
                        </div>
                        <h4 style="color: var(--code-color); margin: 10px 0 5px 0; font-size: 1em;">Serial Connection</h4>
                        <p style="margin: 5px 0; font-size: 0.9em; color: var(--text-color);">USB-to-serial adapter and cable to connect to your computer</p>
                    </div>
                </div>

                <ol style="margin-top:5px; padding-left:20px;">
                    <li style="margin-bottom:8px;">Locate a place (e.g. folder) on your PC, Laptop or Table that will be used to save the datapak image OPK</li>
                    <li style="margin-bottom:8px;">Power <strong>off</strong> the Organiser</li>
                    <li style="margin-bottom:8px;">Remove any RAM Packs !</li>
                    <li style="margin-bottom:8px;">Insert the COMMS Link into the Top Slot</li>
                    <li style="margin-bottom:8px;">Connect your Psion Organiser II to your computer using the serial adapter and/or Comms Link cable</li>
                    <li style="margin-bottom:8px;">- Recommended - Plug in a mains adaptor to the COMMS link</li>
                    <li style="margin-bottom:8px;">Turn the Organiser ON to automatically install the Comms software</li>
                    <li style="margin-bottom:8px;">If the pack you wish to read is a RAM pack:</li>
                    <ul style="margin-top:5px; padding-left:20px; margin-bottom: 8px;">
                        <li style="margin-bottom:4px;">Switch OFF again</li>
                        <li style="margin-bottom:4px;">Insert the Ram pack(s)</li>
                        <li style="margin-bottom:4px;">Turn the Organiser ON again</li>
                    </ul>
                    <li style="margin-bottom:8px;">Open the LinkTool web application in your browser</li>
                </ol>
                <div style="margin-top: 15px; background-color: rgba(255, 99, 71, 0.1); border-left: 4px solid #ff6347; border-radius: 4px; padding: 10px 15px;">
                    <strong style="color: #ff6347;">IMPORTANT:</strong> The steps associated with a RAM Pack use significantly reduce a known issue with RAM pack data loss events!
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">2. Select the Pack to Transfer</div>
                <p>Before connecting, choose which pack you want to transfer:</p>
                <ul style="margin-top:5px; padding-left:20px;">
                    <li style="margin-bottom:8px;">Click the <strong>"Pack select"</strong> button to toggle between <strong>Pack B</strong> and <strong>Pack C</strong></li>
                    <li style="margin-bottom:8px;">The default selection is Pack B</li>
                    <li style="margin-bottom:8px;">The button will display your current selection</li>
                </ul>
                <div style="margin-top: 15px; background-color: rgba(77, 184, 255, 0.1); border-left: 4px solid #4db8ff; border-radius: 4px; padding: 10px 15px;">
                    <strong style="color: #4db8ff;">TIP:</strong> If you're unsure which pack contains your data, start with Pack B as it's the most commonly used data pack.
                </div>
            </div>

            <div class="section">
                <div class="section-title">3. Prepare the Psion Organiser II</div>
                <p><strong>Important</strong>: To avoid timeout issues, prepare your Psion Organiser II <em>before</em> connecting in the tool.</p>
                <ol style="margin-top:5px; padding-left:20px;">
                    <li style="margin-bottom:8px;">On your Psion Organiser II, navigate to the main menu</li>
                    <li style="margin-bottom:8px;">Select <strong>COMMS</strong></li>
                    <li style="margin-bottom:8px;">Select <strong>BOOT</strong></li>
                    <li style="margin-bottom:8px;">Navigate to <strong>NAME:</strong> (leave it blank - no name is required)</li>
                    <li style="margin-bottom:8px;"><strong>Stop here</strong> - do not press EXE yet</li>
                </ol>
                <div style="margin-top: 15px; background-color: rgba(255, 99, 71, 0.1); border-left: 4px solid #ff6347; border-radius: 4px; padding: 10px 15px;">
                    <strong style="color: #ff6347;">IMPORTANT:</strong> The tool has a limited time window to establish communication after you press EXE. By navigating to the NAME: option first, you'll be ready to press EXE immediately after the tool starts searching for the device.
                </div>
            </div>

            <div class="section">
                <div class="section-title">4. Connect and Start the Transfer</div>
                <p>Now that your Psion Organiser II is ready at the <code>NAME:</code> prompt:</p>
                <ol style="margin-top:5px; padding-left:20px;">
                    <li style="margin-bottom:8px;">Click the <strong>"Connect"</strong> button in the web application</li>
                    <li style="margin-bottom:8px;">Your browser will display a serial port selection dialog</li>
                    <li style="margin-bottom:8px;">Select the COM port corresponding to your serial adapter</li>
                    <li style="margin-bottom:8px;">Click "Connect" in the browser dialog</li>
                    <li style="margin-bottom:8px;">Wait for the tool to display "Searching for Device..." in the status area</li>
                    <li style="margin-bottom:8px;">Now press EXE on your Psion Organiser II to start the transfer</li>
                </ol>
                <p>The tool will immediately detect the device and begin the transfer process.</p>
                <details class="tech-note" style="margin-top:15px;">
                    <summary><strong>Technical Details (Upload Boot Injection):</strong></summary>
                    The transfer tool will immediately detect the <code>EXE</code> wake packet and begin the transfer process algorithm. First, it temporarily places proprietary bootstrap software execution pairs directly into the Psion Organiser II's native RAM, hijacking the link layer to safely transfer the remaining pack data bytes sequentially. Once finished, you can safely disconnect hardware ports.
                </details>
            </div>
        `;
doc.body.appendChild(content);
}
return {openWindow:openWindow};
})();