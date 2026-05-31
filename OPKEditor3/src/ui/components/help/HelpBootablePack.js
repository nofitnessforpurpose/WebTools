'use strict';
var HelpBootablePack=(function (){
var doc=document;
var win=window;
if(win.location.search.indexOf('feature=helpbootablepack')!==-1){
win.addEventListener('load',initChildEnvironment);
}
function openWindow(){
var width=650,height=750;
var left=(screen.width-width)/2,top=(screen.height-height)/2;
var winParams='width='+width+',height='+height+',left='+left+',top='+top+',menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes';
var childWin=win.open('index.html?feature=helpbootablepack','HelpBootablePack',winParams);
childWin.focus();
}
function initChildEnvironment(){
doc.title='Help: Creating Bootable Packs';
doc.body.innerHTML='';
if(win.opener&&win.opener.document){
var parentRoot=win.opener.document.documentElement;
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
            .code-mono { font-family: monospace; background: rgba(128,128,128,0.1); padding: 2px 5px; border-radius: 3px; color: var(--code-color); }
            html[data-theme='dark'] .code-mono { color: #9cd4ff; background: rgba(255,255,255,0.1); }
            .tech-note { margin-top: 15px; background-color: var(--accent-color); padding: 10px 15px; border-left: 4px solid var(--code-color); border-radius: 0 4px 4px 0; color: #2b5e8c; font-size: 13.5px; }
            html[data-theme='dark'] .tech-note { background-color: rgba(0, 120, 215, 0.15); color: #9cd4ff; border-left-color: #9cd4ff; }
            details.tech-note summary { cursor: pointer; outline: none; font-weight: bold; display: list-item; }
            details.tech-note[open] summary { margin-bottom: 8px; }
            .tech-table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }
            .tech-table th, .tech-table td { border: 1px solid var(--border-color); padding: 6px 8px; text-align: left; }
            .tech-table th { background: var(--accent-color); color: var(--text-color); }
            html[data-theme='dark'] .tech-table th { background: rgba(0, 120, 215, 0.2); }
        `;
doc.head.appendChild(style);
doc.body.innerHTML='<div class="header-bar"><h1>Creating Bootable Data Packs</h1></div>';
var content=doc.createElement('div');
content.className='content-area';
content.innerHTML=`
            <div>A <strong>Bootable Pack</strong> is a specialized data pack that loads and executes machine code whenever the device is booted or the ON/CLEAR key is pressed. By utilizing the built-in <strong>Bootable Pack Wizard</strong> and its associated <span class="code-mono">.BIN</span> routines, even non-expert users can easily install custom top-level menu items or cause OPL program code to run automatically whenever the <strong>ON/CLEAR</strong> key is pressed at the top-level menu. The Wizard supports two small machine code modules: the classic <span class="code-mono">BOOT.BIN</span> and a custom configurable <span class="code-mono">ACMENU.BIN</span>.</div>
            
            <div class="section" style="margin-top:20px;">
                <div class="section-title">How a Bootable Pack Works</div>
                <p>For standard users, the bootable startup sequence is straightforward:</p>
                <ul>
                    <li><strong>The Startup Scan:</strong> Every time you turn on the Psion or press the <strong>ON/CLEAR</strong> key, the operating system instantly checks expansion slots for a bootable pack.</li>
                    <li><strong>The Helper Copy:</strong> If the slot contains a bootable pack, the Psion copies a tiny startup "helper" program from the pack into its temporary system memory.</li>
                    <li><strong>The Launch:</strong> The Psion runs this helper, which immediately searches the pack for your main application and launches it onto the screen.</li>
                </ul>
            </div>

            <div class="section">
                <div class="section-title">Primary Uses</div>
                <ul>
                    <li><strong>Injecting Menu Options:</strong> The boot code is primarily used to dynamically patch the Psion’s main operating system menu. For example, inserting a bootable pack might instantly add a new option like <span class="code-mono">FINANCE</span> or <span class="code-mono">SPREADSHEET</span> to the top-level menu screen.</li>
                    <li><strong>Loading Hardware Drivers:</strong> Hardware peripherals that plug into the top slot, such as the Comms Link or barcode readers, mimic bootable packs. They use bootable code to inject their own software drivers into the system so the hardware can communicate with the Psion.</li>
                    <li><strong>Running Commercial Software:</strong> Most of Psion's official software library (such as the Maths Pack, Science Pack, and Finance Pack) were built as bootable packs. They all shared identical boot loader code but contained different program records.</li>
                    <li><strong>System Patches and TSRs:</strong> Enthusiasts and developers use bootable packs to run Terminate and Stay Resident (TSR) programs. This includes Flash Pack Formatters, which inject background code allowing the aging operating system to write to newer EEPROM flash chips.</li>
                </ul>
            </div>

            <div class="section">
                <div class="section-title">Using the Creation Wizard</div>
                <p>The OPK Editor includes a built-in <strong>Bootable Pack Wizard</strong> to automate compiling and injecting boot code into your Datapak image.</p>
                <ol style="padding-left: 20px; margin-bottom: 15px;">
                    <li>With your target pack open in the editor, click <strong>File -> Bootable Pack...</strong> on the main toolbar.</li>
                    <li>Select your preferred **Boot Mechanism** (Classic vs ACMENU).</li>
                    <li>Configure optional parameters such as <strong>Device ID</strong>, <strong>Priority</strong>, and <strong>Version</strong> if you are writing custom device drivers.</li>
                    <li>Click <strong>Compile & Write</strong>. The editor will synthesize the binary boot records and inject them perfectly into your pack layout!</li>
                </ol>
                <p>If you re-run the Wizard on a pack that is already bootable, the editor will automatically detect the pre-existing boot records, recover your settings, and pre-populate the fields for hassle-free editing.</p>
            </div>

            <div class="section">
                <div class="section-title">The Two Boot Methods</div>
                <p>You can choose between two main mechanisms depending on the target system model and application design:</p>

                <h3>1. Classic BOOT.BIN Method</h3>
                <p>This is the traditional and highly flexible bootloader method compatible across all Psion Organiser II models.</p>
                <ul>
                    <li><strong>Helper Files Created:</strong> Compiles a binary boot block named <span class="code-mono">BOOT.BIN</span> and generates two standard OPL procedures:
                        <ul>
                            <li><span class="code-mono">BOOT</span>: The main entry point procedure. You should put your custom OPL program code inside this procedure!</li>
                            <li><span class="code-mono">ADDTOP</span>: A special system installation routine that gets called once on boot to register your application name in the standard top-level Psion menu list.</li>
                        </ul>
                    </li>
                    <li><strong>How it works:</strong> The Psion OS executes the machine code bootloader, which searches for and automatically runs the <span class="code-mono">BOOT</span> procedure, which in turn calls <span class="code-mono">ADDTOP</span> to install your program menu item.</li>
                </ul>

                <h3>2. ACMENU.BIN Method (Self-Removing Menu Item)</h3>
                <p>This is an elegant, modern method specifically optimized for standard EPROM application packs on 2-Line (XP) and 4-Line (LZ) models.</p>
                <ul>
                    <li><strong>No Helper Procedures:</strong> Unlike the classic method, ACMENU does <em>not</em> need the separate <span class="code-mono">BOOT</span> and <span class="code-mono">ADDTOP</span> procedures, keeping your pack extremely clean.</li>
                    <li><strong>Seamless Menu Integration:</strong> It dynamically injects a top-level menu item straight into the Psion home screen menu on boot, and cleans itself up automatically if the pack is unplugged.</li>
                    <li><strong>Flexible Target Modes:</strong> You can select the **Mode / Addr** field to launch different items:
                        <ul>
                            <li><span class="code-mono">0000 (OPL)</span>: Automatically runs an OPL procedure of that name. *(Menu name strictly restricted to a maximum of 8 characters)*.</li>
                            <li><span class="code-mono">0001 (Notepad)</span>: Automatically opens a Notepad document of that name (on LZ models). *(Max 8 characters)*.</li>
                            <li><span class="code-mono">0002 (Database)</span>: Automatically opens a Database file of that name (on LZ models). *(Max 8 characters)*.</li>
                            <li><span class="code-mono">Custom Hex (RAM/ROM)</span>: For advanced users, jump straight to a direct hardware address for machine code execution. *(Menu name expanded to a maximum of 16 characters)*.</li>
                        </ul>
                    </li>
                    <li><strong>Positioning:</strong> Configures where in the main system menu list the menu item is placed.</li>
                </ul>
            </div>
            
            <div class="section">
                <div class="section-title">Device Drivers and Identifiers</div>
                <p>The wizard allows assigning specific metadata headers to your bootable pack:</p>
                <ul>
                    <li><strong>Device ID:</strong> Sourced from a dropdown of standard Psion system identifiers (e.g. <span class="code-mono">0x90</span> for standard software packs, <span class="code-mono">0xC0</span> for Comms Links, or <span class="code-mono">0xC2</span> for Printers). This instructs the operating system which hardware/software drivers the pack corresponds to.</li>
                    <li><strong>Priority & Version:</strong> Informs the OS driver manager how to prioritize driver execution if multiple packs are inserted simultaneously.</li>
                </ul>
                
                <details class="tech-note">
                    <summary><strong>Technical Details (For advanced developers):</strong></summary>
                    <p>At the low-level, the OPK Editor performs several byte-level manipulations to prepare a bootable pack:</p>
                    
                    <strong>1. The Boot Loop & Magic Byte:</strong>
                    <p>The very first byte on a bootable pack is set to a specific identifier (hexadecimal <span class="code-mono">$03</span> on Series 1 packs). When the operating system powers on, it scans the expansion slots. If it detects this boot identifier, it automatically copies the first 199 bytes of machine code from the pack directly into the internal RAM.</p>

                    <strong>2. Code Relocatability & Addressing Constraint:</strong>
                    <p>Because the initial 199-byte boot block is copied dynamically into RAM by the OS at startup, its execution address is variable depending on the system's runtime memory layout. Therefore, all machine code inside this initial block <strong>must be fully relocatable</strong>. It <strong>cannot contain absolute memory addresses</strong>; only <strong>relative addressing mode</strong> (such as PC-relative branch instructions and offset indexing) can be used. Any absolute references would point to incorrect locations, leading to instant system crashes.</p>

                    <strong>3. Header Byte 0 Flag modification:</strong>
                    <p>The system clears bit 4 (<span class="code-mono">0x10</span>) of the first byte (Byte 0, flags) in the Datapak header. In the Psion operating system, this flag indicates the pack is bootable:
                    <br><span class="code-mono">isBootable = (flags & 0x10) === 0;</span></p>

                    <strong>4. Boot Address Words:</strong>
                    <p>Offsets <span class="code-mono">0x06</span> and <span class="code-mono">0x07</span> in the Pack Header contain a **Big Endian** 16-bit word pointing to the physical start address of the boot block record inside the Datapak (e.g. <span class="code-mono">0x000A</span> if loaded immediately after the 10-byte header).</p>

                    <strong>5. Record Layouts (Offsets 0 - 61):</strong>
                    <table class="tech-table">
                        <thead>
                            <tr>
                                <th>Method</th>
                                <th>Signature / Header</th>
                                <th>Descriptor Layout</th>
                                <th>Address Word (Big Endian)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><strong>Classic BOOT.BIN</strong></td>
                                <td><span class="code-mono">0x00 0xD3</span> at offset 0-1</td>
                                <td>62-byte machine code execution block</td>
                                <td>N/A</td>
                            </tr>
                            <tr>
                                <td><strong>ACMENU.BIN</strong></td>
                                <td><span class="code-mono">0x00 0x3C</span> at offset 0-1</td>
                                <td>Menu / Procedure ASCII string from offset 15 with length stored at offset 14</td>
                                <td>2-byte execution mode word immediately following ASCII name:<br>
                                    - <span class="code-mono">$0000</span> (OPL procedure search)<br>
                                    - <span class="code-mono">$0001</span> (Notepad search)<br>
                                    - <span class="code-mono">$0002</span> (Database search)<br>
                                    - <span class="code-mono">$HHLL</span> (RAM/ROM assembly address)
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <p style="margin-top: 15px;"><strong>6. EPROM Block Checksum:</strong>
                    For EPROM safety, ACMENU utilizes a specific 8-bit checksum. The sum of all bytes in the record from offset <span class="code-mono">5</span> to <span class="code-mono">61</span> inclusive is calculated, and its two's complement value is placed at offset <span class="code-mono">62</span>. This ensures the Psion operating system's boot verification routine passes flawlessly.</p>
                </details>
            </div>
        `;
doc.body.appendChild(content);
}
return {openWindow:openWindow};
})();