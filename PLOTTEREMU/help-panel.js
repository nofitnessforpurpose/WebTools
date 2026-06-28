/* ==========================================================================
   HP 9872B Plotter Emulator — Help Panel Content
   Injected into #help-panel at DOMContentLoaded.
   Edit this file to update help content without touching index.html or app.js.
   ========================================================================== */

(function () {
    const HTML = /* html */`
        <div class="sidebar-header">
            <h2><i class="fa-solid fa-circle-info"></i> Emulator Help</h2>
            <button class="btn-close-sidebar" id="btn-close-help" title="Close Help Panel"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="sidebar-body">

            <!-- ── CONTENTS ──────────────────────────────────── -->
            <div class="settings-group" id="help-toc">
                <h3 class="settings-title"><i class="fa-solid fa-list"></i> Contents <i class="fa-solid fa-chevron-down toggle-icon"></i></h3>
                <div class="settings-group-content">
                    <ul class="help-contents-list">
                        <li class="toc-section">Getting Started</li>
                        <li><a href="#help-overview"><i class="fa-solid fa-circle-dot fa-xs"></i> What this Emulator Does</a></li>
                        <li><a href="#help-usage"><i class="fa-solid fa-circle-dot fa-xs"></i> How to Use</a></li>
                        <li><a href="#help-features"><i class="fa-solid fa-circle-dot fa-xs"></i> Usability Features</a></li>
                        <li class="toc-section">Reference</li>
						<li><a href="#help-keybindings"><i class="fa-solid fa-keyboard fa-xs"></i> Key Bindings</a></li>
                        <li><a href="#help-technical"><i class="fa-solid fa-circle-dot fa-xs"></i> Technical Details</a></li>
                        <li><a href="#help-hpgl"><i class="fa-solid fa-circle-dot fa-xs"></i> HPGL Command List</a></li>
                        <li><a href="#help-index"><i class="fa-solid fa-circle-dot fa-xs"></i> Index</a></li>
                    </ul>
                </div>
            </div>

            <!-- ── OVERVIEW ───────────────────────────────────── -->
            <div class="settings-group" id="help-overview">
                <h3 class="settings-title"><i class="fa-solid fa-info-circle"></i> What this Emulator Does <i class="fa-solid fa-chevron-down toggle-icon"></i></h3>
                <div class="settings-group-content">
                    <p>
                        This web application faithfully simulates the <strong>Hewlett&#8209;Packard 9872B</strong>
                        multi&#8209;colour flat&#8209;bed pen plotter. It accepts HP&#8209;GL and HP&#8209;GL/2 command streams via serial port or files,
                        animates the X and Y carriage mechanism in real time, and renders vector pen strokes
                        on a virtual paper bed &mdash; all inside your browser, with no software installation required.
                    </p>
                    <p>The emulator operates in two language modes selectable at runtime:</p>
                    <ul>
                        <li><strong>Classic HP&#8209;GL</strong> &mdash; the original Hewlett&#8209;Packard Graphics Language as documented in the 9872B reference manual.</li>
                        <li><strong>HP&#8209;GL/2</strong> &mdash; the extended language introduced with the HP LaserJet III series, adding fill types, line attributes, and extended coordinate scaling.</li>
                    </ul>
                    <div class="help-callout">
                        <div class="help-callout-title"><i class="fa-solid fa-ban fa-xs"></i> Raster graphics not supported</div>
                        Neither HP&#8209;GL raster commands nor PCL raster data are emulated. The emulator is a
                        <em>vector&#8209;only</em> plotter simulation.
                    </div>
                    <p>Key capabilities at a glance:</p>
                    <div class="feature-chips">
                        <span class="feature-chip">Web Serial API</span>
                        <span class="feature-chip">Real&#8209;time carriage animation</span>
                        <span class="feature-chip">8&#8209;pen carousel</span>
                        <span class="feature-chip">Variable pen widths</span>
                        <span class="feature-chip">Custom paper sizes</span>
                        <span class="feature-chip">Paper templates</span>
                        <span class="feature-chip">Grid overlay</span>
                        <span class="feature-chip">Coordinate display</span>
                        <span class="feature-chip">Classic HP&#8209;GL</span>
                        <span class="feature-chip">HP&#8209;GL/2</span>
                        <span class="feature-chip">.plt file playback</span>
                        <span class="feature-chip">Debug mode</span>
                    </div>
                </div>
            </div>

            <!-- ── HOW TO USE ─────────────────────────────────── -->
            <div class="settings-group collapsed" id="help-usage">
                <h3 class="settings-title"><i class="fa-solid fa-play-circle"></i> How to Use <i class="fa-solid fa-chevron-down toggle-icon"></i></h3>
                <div class="settings-group-content">
                    <p><strong>Quick&#8209;start in four steps:</strong></p>
                    <ol>
                        <li>
                            <strong>Connect a serial device</strong> &mdash; click <em>Controls &rarr; Web Serial Interface &rarr; Connect Serial</em>.
                            Your browser will prompt you to select a COM port. The plotter will go through its
                            initialisation sequence automatically.
                        </li>
                        <li>
                            <strong>Choose a language level</strong> &mdash; under <em>Controls &rarr; Plotter Config</em>, set
                            <em>Language Level</em> to <code>HP&#8209;GL</code> (classic) or <code>HP&#8209;GL/2</code> to match
                            the output of your sending software.
                        </li>
                        <li>
                            <strong>Send HP&#8209;GL data</strong> &mdash; either via the serial connection from a host computer,
                            or by dragging and dropping a <code>.plt</code> / <code>.hpgl</code> file directly onto
                            the paper bed. The carriage will start moving immediately.
                        </li>
                        <li>
                            <strong>Observe the plot</strong> &mdash; watch the pen carriage move across the paper bed in real
                            time. The current pen tip position is shown in the status bar. Pen strokes appear on the
                            canvas as they are drawn.
                        </li>
                    </ol>
                    <div class="help-callout">
                        <div class="help-callout-title"><i class="fa-solid fa-lightbulb fa-xs"></i> Tip</div>
                        Use the <strong>Jog</strong> buttons on the physical console panel to move the carriage manually,
                        or <strong>Pen Up / Pen Down</strong> to test pen state without sending any HP&#8209;GL.
                    </div>
                    <p><strong>Console controls (front panel):</strong></p>
                    <ul>
                        <li><strong>JOG &#9650;&#9660;&#9664;&#9654;</strong> &mdash; manually nudge the carriage one step in any direction.</li>
                        <li><strong>JOG FAST</strong> &mdash; hold to move in larger increments.</li>
                        <li><strong>PEN UP / PEN DOWN</strong> &mdash; raise or lower the active pen.</li>
                        <li><strong>P1 / P2</strong> &mdash; set the lower&#8209;left and upper&#8209;right scaling reference points.</li>
                        <li><strong>ENTER</strong> &mdash; register the current carriage position.</li>
                        <li><strong>CHART LOAD / HOLD</strong> &mdash; simulate paper feed control.</li>
                        <li><strong>POWER switch</strong> &mdash; performs a full emulator reset and re&#8209;initialises all state.</li>
                    </ul>
                </div>
            </div>

            <!-- ── USABILITY FEATURES ─────────────────────────── -->
            <div class="settings-group collapsed" id="help-features">
                <h3 class="settings-title"><i class="fa-solid fa-star"></i> Usability Features <i class="fa-solid fa-chevron-down toggle-icon"></i></h3>
                <div class="settings-group-content">

                    <p><strong>Real&#8209;time position display</strong></p>
                    <p>
                        The current pen carriage position is shown continuously in HP&#8209;GL plotter units (PLUs)
                        in the status bar beneath the paper bed. This updates on every move command so you can
                        verify coordinate accuracy against your source HP&#8209;GL.
                    </p>

                    <p><strong>Paper selection &amp; templates</strong></p>
                    <p>
                        Open <em>Controls &rarr; Paper &amp; Canvas</em> to choose from standard paper sizes
                        (A4, A3, US Letter) and orientations (Portrait / Landscape).
                        <em>Paper templates</em> include plain white, engineering grid, and technical blueprint
                        backgrounds &mdash; useful for visually checking plot scaling and margins.
                    </p>

                    <p><strong>Grid overlay</strong></p>
                    <p>
                        Enable a fine grid overlay on the paper bed to judge spacing and alignment at a glance.
                        Grid colour is configurable under <em>Controls &rarr; Plotter Config</em>.
                    </p>

                    <p><strong>Pen carousel configuration</strong></p>
                    <p>
                        Each of the eight pens can have its colour and line width set independently.
                        Open <em>Controls &rarr; Pen Carousel Configuration</em>, pick a colour with the colour
                        picker, and type in a width in millimetres.
                    </p>

                    <p><strong>Error &amp; limit indicators</strong></p>
                    <ul>
                        <li><strong>ERROR</strong> (red) &mdash; an unrecognised or mode&#8209;incorrect HP&#8209;GL command was received.</li>
                        <li><strong>OUT OF LIMIT</strong> (orange) &mdash; a move target exceeds the current soft&#8209;limit window (IW).</li>
                    </ul>

                    <div class="tech-card">
                        <div class="tech-card-title"><i class="fa-solid fa-bug fa-xs"></i> Technical &mdash; Debug Mode</div>
                        <p>
                            Enable <strong>Debug Mode</strong> via <em>Controls &rarr; Debug</em> to open the left&#8209;hand
                            debug sidebar. It shows:
                        </p>
                        <ul>
                            <li>Live raw serial byte stream with timestamps.</li>
                            <li>Parsed HP&#8209;GL command tokens as they are processed.</li>
                            <li>Carriage status card &mdash; exact X/Y in PLUs, pen state, active pen number, current scale factors, and P1/P2 reference points.</li>
                            <li>Oscilloscope&#8209;style signal view for the serial RX line.</li>
                        </ul>
                        <p>Debug mode is intended for developers and integrators verifying HP&#8209;GL output from CAD or plotting software.</p>
                    </div>
                </div>
            </div>

            <!-- ── KEY BINDINGS ───────────────────────────────── -->
            <div class="settings-group collapsed" id="help-keybindings">
                <h3 class="settings-title"><i class="fa-solid fa-keyboard"></i>
				Key Bindings <i class="fa-solid fa-chevron-down toggle-icon"></i></h3>
				<div class="settings-group-content">
				  <p>
				    Key bindings for the emulation are:
				  </p>
				  <p>
				    <table>
					  <hr>
					    <td>Key</td><td>Action</td>
					  </hr>
                      <tr>
					    <td>Arrow keys</td><td>Jog carriage</td>
                      </tr>
                      <tr>
                        <td>PageUp / PageDown</td><td>Adjust jog step size</td>
                      </tr>
                      <tr>
                        <td>Home</td><td>Move to (0, 0)</td>
                      </tr>
                      <tr>
                        <td>End</td><td>Move to max position</td>
                      </tr>
                      <tr>
                        <td>Enter</td><td>Register point</td>
                      </tr>
                      <tr>
                        <td>Delete</td><td>Clear Paper Bed</td>
                      </tr>
                      <tr>
                        <td>O</td><td>Power ON / OFF</td>
                      </tr>
                      <tr>
                        <td>L</td><td>Chart Load</td>
                      </tr>
                      <tr>
                        <td>H</td><td>Chart Hold</td>
                      </tr>
                      <tr>
                        <td>U</td><td>Pen Up</td>
                      </tr>
                      <tr>
                        <td>D</td><td>Pen Down</td>
                      </tr>
                      <tr>
                         <td>1 – 8</td><td>Select / deselect pen</td>
                      </tr>
					</table>
				  </p>
				</div>
            </div>    
            <!-- ── TECHNICAL DETAILS ──────────────────────────── -->
            <div class="settings-group collapsed" id="help-technical">
                <h3 class="settings-title"><i class="fa-solid fa-cogs"></i> Technical Details <i class="fa-solid fa-chevron-down toggle-icon"></i></h3>
                <div class="settings-group-content">
                    <p>
                        The emulator core is implemented in vanilla JavaScript
                        with no external runtime dependencies. All HP&#8209;GL parsing, coordinate maths, and DOM
                        rendering run on the main browser thread.
                    </p>

                    <div class="tech-card">
                        <div class="tech-card-title"><i class="fa-solid fa-microchip fa-xs"></i> Technical &mdash; HP&#8209;GL Parser</div>
                        <p>
                            The parser is a state machine that reads characters from the Web Serial
                            <code>ReadableStream</code> byte by byte. A two&#8209;character mnemonic (e.g. <code>PA</code>)
                            is matched against a command dispatch table. Parameters are accumulated as a comma&#8209;separated
                            list and converted to floating&#8209;point before dispatch.
                        </p>
                        <p>
                            In <strong>Classic HP&#8209;GL</strong> mode, any HP&#8209;GL/2&#8209;only mnemonic (e.g. <code>FT</code>,
                            <code>LA</code>, <code>PW</code>) causes the ERROR LED to illuminate and the command
                            is discarded &mdash; exactly as the physical device behaves.
                        </p>
                        <p>The terminator for each command is either a semicolon (<code>;</code>), a new mnemonic, or ETX / EOF.</p>
                    </div>

                    <div class="tech-card">
                        <div class="tech-card-title"><i class="fa-solid fa-palette fa-xs"></i> Technical &mdash; Ink Blending & Color Bleed</div>
                        <p>
                            The emulator simulates the transparent, dye-based inks of original HP plotter pens using the <strong>Translucent Blend</strong> mode (HTML5 Canvas <code>multiply</code> blending). When a light color is drawn over a dark color, the dark line underneath remains visible and slightly tinted. When a dark color is drawn over a light color, the dark color dominates completely.
                        </p>
                        <p>
                            <strong>Best Practice Tip:</strong> To achieve clean plots, without destroying pens or ruining lines, the standard software plotting sequence should always be ordered from lightest to darkest colors (e.g., Yellow &rarr; Magenta &rarr; Cyan &rarr; Black), allowing ample drying time between pen changes.
                        </p>
                    </div>

                    <div class="tech-card">
                        <div class="tech-card-title"><i class="fa-solid fa-ruler-combined fa-xs"></i> Technical &mdash; Coordinate System</div>
                        <p>
                            All positions are held internally in <strong>Plotter Units (PLUs)</strong>.
                            One PLU = 0.025&nbsp;mm (40&nbsp;PLUs per mm) for the 9872B.
                            The default plotting area (P1 &rarr; P2) is 0,0 to the paper size boundary in PLUs.
                        </p>
                        <p>
                            <strong>SC</strong> (scale) transforms user coordinates to PLUs via a linear map.
                            <strong>RO</strong> (rotate) applies a 0&deg;, 90&deg;, 180&deg;, or 270&deg; rotation to the
                            coordinate frame around P1. <strong>IW</strong> clips output to a rectangular window in PLUs.
                        </p>
                        <p>Canvas pixels are derived from PLUs by:<br>
                            <code>px = plu &times; (canvas_width_px / paper_width_plu)</code>
                        </p>
                    </div>

                    <div class="tech-card">
                        <div class="tech-card-title"><i class="fa-solid fa-plug fa-xs"></i> Technical &mdash; Web Serial &amp; Baud Rate</div>
                        <p>
                            The Web Serial API is used to open a COM port at a configurable baud rate
                            (default <strong>9600 baud</strong>, 8N1). Supported baud rates: 300, 1200, 2400, 4800, 9600, 19200.
                        </p>
                        <p>
                            Data is read using a background <code>ReadableStream</code> reader loop.
                            Flow control is not implemented (the physical plotter used a hardware handshake line
                            which is not required for software emulation at these data rates).
                        </p>
                    </div>

                    <div class="help-callout warn">
                        <div class="help-callout-title"><i class="fa-solid fa-triangle-exclamation fa-xs"></i> Browser Requirement</div>
                        Web Serial requires a Chromium&#8209;based browser (Chrome 89+, Edge 89+, Opera 75+).
                        Firefox and Safari do not support Web Serial. File&#8209;drop playback works in all modern browsers.
                    </div>
                </div>
            </div>

            <!-- ── HPGL COMMAND LIST ──────────────────────────── -->
            <div class="settings-group collapsed" id="help-hpgl">
                <h3 class="settings-title"><i class="fa-solid fa-terminal"></i> HPGL Command List <i class="fa-solid fa-chevron-down toggle-icon"></i></h3>
                <div class="settings-group-content">
                    <p>
                        Commands marked <span class="cmd-badge classic">Classic</span> are available in both modes.
                        Commands marked <span class="cmd-badge gl2">HP&#8209;GL/2</span> require
                        <em>Language Level: HP&#8209;GL/2</em> to be selected.
                    </p>
                    <table class="hpgl-table">
                        <thead><tr><th>Cmd</th><th>Name</th><th>Description</th></tr></thead>
                        <tbody>
                            <tr><td>IN</td><td>Initialize <span class="cmd-badge classic">Classic</span></td><td>Resets the plotter to power&#8209;on defaults. Clears all scaling, pen state, and plot data.</td></tr>
                            <tr><td>SP</td><td>Select Pen <span class="cmd-badge classic">Classic</span></td><td><code>SP n;</code> selects pen 1&ndash;8. <code>SP0;</code> parks all pens.</td></tr>
                            <tr><td>PU</td><td>Pen Up <span class="cmd-badge classic">Classic</span></td><td>Raises the pen. Optionally followed by coordinates: <code>PU x,y;</code> moves to (x,y) with pen up.</td></tr>
                            <tr><td>PD</td><td>Pen Down <span class="cmd-badge classic">Classic</span></td><td>Lowers the pen to draw. Optionally: <code>PD x,y;</code> draws to (x,y).</td></tr>
                            <tr><td>PA</td><td>Plot Absolute <span class="cmd-badge classic">Classic</span></td><td>Moves carriage to absolute coordinates: <code>PA x,y;</code>. Multiple pairs may follow.</td></tr>
                            <tr><td>PR</td><td>Plot Relative <span class="cmd-badge classic">Classic</span></td><td>Moves by a relative offset: <code>PR dx,dy;</code>.</td></tr>
                            <tr><td>AA</td><td>Arc Absolute <span class="cmd-badge classic">Classic</span></td><td>Arc centred at absolute (cx,cy): <code>AA cx,cy,angle;</code>.</td></tr>
                            <tr><td>AR</td><td>Arc Relative <span class="cmd-badge classic">Classic</span></td><td>Arc with centre relative to current position: <code>AR dcx,dcy,angle;</code>.</td></tr>
                            <tr><td>CI</td><td>Circle <span class="cmd-badge classic">Classic</span></td><td>Circle of given radius: <code>CI radius;</code> or <code>CI radius,chord;</code>.</td></tr>
                            <tr><td>IP</td><td>Input P1/P2 <span class="cmd-badge classic">Classic</span></td><td>Sets scaling reference points: <code>IP p1x,p1y,p2x,p2y;</code>.</td></tr>
                            <tr><td>SC</td><td>Scale <span class="cmd-badge classic">Classic</span></td><td>Maps user units to PLUs: <code>SC xmin,xmax,ymin,ymax;</code>. <code>SC;</code> cancels.</td></tr>
                            <tr><td>IW</td><td>Input Window <span class="cmd-badge classic">Classic</span></td><td>Defines the clipping window: <code>IW x1,y1,x2,y2;</code>. Moves outside trigger the LIMIT LED.</td></tr>
                            <tr><td>RO</td><td>Rotate <span class="cmd-badge classic">Classic</span></td><td>Rotates the coordinate system around P1: <code>RO 0|90|180|270;</code>.</td></tr>
                            <tr><td>LT</td><td>Line Type <span class="cmd-badge classic">Classic</span></td><td>Dash pattern: <code>LT n;</code> (0&ndash;6; 0=solid). <code>LT;</code> resets to solid.</td></tr>
                            <tr><td>SM</td><td>Symbol Mode <span class="cmd-badge classic">Classic</span></td><td>Plots a symbol at each vertex: <code>SM char;</code>. <code>SM;</code> disables.</td></tr>
                            <tr><td>TL</td><td>Tick Length <span class="cmd-badge classic">Classic</span></td><td>Tick mark length as % of P1/P2 distance: <code>TL tp,tn;</code>.</td></tr>
                            <tr><td>XT</td><td>X Tick <span class="cmd-badge classic">Classic</span></td><td>Draws an X&#8209;axis tick at the current position.</td></tr>
                            <tr><td>YT</td><td>Y Tick <span class="cmd-badge classic">Classic</span></td><td>Draws a Y&#8209;axis tick at the current position.</td></tr>
                            <tr><td>LB</td><td>Label <span class="cmd-badge classic">Classic</span></td><td>Renders a text string: <code>LB text\x03</code>.</td></tr>
                            <tr><td>DI</td><td>Absolute Direction <span class="cmd-badge classic">Classic</span></td><td>Text direction as run/rise vector: <code>DI run,rise;</code>.</td></tr>
                            <tr><td>DR</td><td>Relative Direction <span class="cmd-badge classic">Classic</span></td><td>Text direction relative to rotation: <code>DR run,rise;</code>.</td></tr>
                            <tr><td>SI</td><td>Abs. Character Size <span class="cmd-badge classic">Classic</span></td><td>Character width and height in cm: <code>SI w,h;</code>.</td></tr>
                            <tr><td>SR</td><td>Rel. Character Size <span class="cmd-badge classic">Classic</span></td><td>Character size as % of P1/P2 distance: <code>SR w,h;</code>.</td></tr>
                            <tr><td>CP</td><td>Character Plot <span class="cmd-badge classic">Classic</span></td><td>Moves by n character&#8209;widths and m lines: <code>CP spaces,lines;</code>.</td></tr>
                            <tr><td>CS</td><td>Designate Char. Set <span class="cmd-badge classic">Classic</span></td><td>Designates a standard character set: <code>CS n;</code>.</td></tr>
                            <tr><td>SS</td><td>Select Standard Set <span class="cmd-badge classic">Classic</span></td><td>Activates the designated standard character set.</td></tr>
                            <tr><td>CA</td><td>Designate Alt. Set <span class="cmd-badge classic">Classic</span></td><td>Designates the alternate character set slot.</td></tr>
                            <tr><td>SA</td><td>Select Alternate Set <span class="cmd-badge classic">Classic</span></td><td>Activates the alternate character set.</td></tr>
                            <tr><td>UC</td><td>User&#8209;defined Char. <span class="cmd-badge classic">Classic</span></td><td>Defines a character via pen&#8209;up/down vectors: <code>UC vector,&hellip;;</code>.</td></tr>
                            <tr><td>OA</td><td>Output Actual Pos. <span class="cmd-badge classic">Classic</span></td><td>Outputs actual carriage position in PLUs.</td></tr>
                            <tr><td>OC</td><td>Output Cmd. Pos. <span class="cmd-badge classic">Classic</span></td><td>Outputs the last commanded (not physical) carriage position.</td></tr>
                            <tr><td>OE</td><td>Output Error <span class="cmd-badge classic">Classic</span></td><td>Outputs the current error code as an ASCII integer.</td></tr>
                            <tr><td>OF</td><td>Output Factors <span class="cmd-badge classic">Classic</span></td><td>Outputs the current X and Y scaling factors.</td></tr>
                            <tr><td>OH</td><td>Output Hard Clip <span class="cmd-badge classic">Classic</span></td><td>Outputs the hard carriage travel limits in PLUs.</td></tr>
                            <tr><td>OI</td><td>Output ID <span class="cmd-badge classic">Classic</span></td><td>Outputs the device identification string (e.g. <code>HP9872B</code>).</td></tr>
                            <tr><td>OO</td><td>Output Options <span class="cmd-badge classic">Classic</span></td><td>Outputs option bits describing installed accessories.</td></tr>
                            <tr><td>OP</td><td>Output P1/P2 <span class="cmd-badge classic">Classic</span></td><td>Outputs current P1 and P2 reference points in PLUs.</td></tr>
                            <tr><td>OS</td><td>Output Status <span class="cmd-badge classic">Classic</span></td><td>Outputs the plotter status byte.</td></tr>
                            <tr><td>OW</td><td>Output Window <span class="cmd-badge classic">Classic</span></td><td>Outputs the current IW clipping window coordinates.</td></tr>
                            <tr><td>VS</td><td>Velocity Select <span class="cmd-badge classic">Classic</span></td><td>Sets carriage velocity: <code>VS n;</code> (speed step 1&ndash;4).</td></tr>
                            <tr><td>FS</td><td>Force Select <span class="cmd-badge classic">Classic</span></td><td>Sets pen&#8209;down force: <code>FS n;</code>. Accepted without error in emulation.</td></tr>
                            <tr><td>AC</td><td>Anchor Corner <span class="cmd-badge gl2">HP&#8209;GL/2</span></td><td>Sets the anchor corner for fill patterns: <code>AC x,y;</code>.</td></tr>
                            <tr><td>AD</td><td>Alt. Font Definition <span class="cmd-badge gl2">HP&#8209;GL/2</span></td><td>Defines the alternate label font by attribute list.</td></tr>
                            <tr><td>CF</td><td>Character Fill Mode <span class="cmd-badge gl2">HP&#8209;GL/2</span></td><td>Filled or outlined label characters: <code>CF mode,pen;</code>.</td></tr>
                            <tr><td>CO</td><td>Comment <span class="cmd-badge gl2">HP&#8209;GL/2</span></td><td><code>CO "text";</code> &mdash; silently ignored by the plotter.</td></tr>
                            <tr><td>EA</td><td>Edge Rect. Absolute <span class="cmd-badge gl2">HP&#8209;GL/2</span></td><td>Border of a rectangle to (x,y): <code>EA x,y;</code>.</td></tr>
                            <tr><td>EP</td><td>Edge Polygon <span class="cmd-badge gl2">HP&#8209;GL/2</span></td><td>Draws the border of the polygon buffer.</td></tr>
                            <tr><td>ER</td><td>Edge Rect. Relative <span class="cmd-badge gl2">HP&#8209;GL/2</span></td><td>Rectangle border using relative coordinates.</td></tr>
                            <tr><td>EW</td><td>Edge Wedge <span class="cmd-badge gl2">HP&#8209;GL/2</span></td><td>Border of a pie&#8209;slice: <code>EW radius,start,sweep;</code>.</td></tr>
                            <tr><td>FA</td><td>Fill Rect. Absolute <span class="cmd-badge gl2">HP&#8209;GL/2</span></td><td>Fills a rectangle to absolute (x,y).</td></tr>
                            <tr><td>FP</td><td>Fill Polygon <span class="cmd-badge gl2">HP&#8209;GL/2</span></td><td>Fills the polygon buffer.</td></tr>
                            <tr><td>FR</td><td>Fill Rect. Relative <span class="cmd-badge gl2">HP&#8209;GL/2</span></td><td>Fills a rectangle using relative coordinates.</td></tr>
                            <tr><td>FT</td><td>Fill Type <span class="cmd-badge gl2">HP&#8209;GL/2</span></td><td><code>FT type[,spacing[,angle]];</code> &mdash; 1=solid, 2=hatch, 3=cross&#8209;hatch, 4=user.</td></tr>
                            <tr><td>FW</td><td>Fill Wedge <span class="cmd-badge gl2">HP&#8209;GL/2</span></td><td>Fills a wedge using the current fill type.</td></tr>
                            <tr><td>LA</td><td>Line Attributes <span class="cmd-badge gl2">HP&#8209;GL/2</span></td><td>Line cap, join, miter limit: <code>LA kind,value[,&hellip;];</code>.</td></tr>
                            <tr><td>LO</td><td>Label Origin <span class="cmd-badge gl2">HP&#8209;GL/2</span></td><td>Label anchor point (1&ndash;9): <code>LO n;</code>.</td></tr>
                            <tr><td>MC</td><td>Merge Control <span class="cmd-badge gl2">HP&#8209;GL/2</span></td><td>How pen colours interact when overlapping: <code>MC mode[,pen];</code>.</td></tr>
                            <tr><td>NR</td><td>Not Ready <span class="cmd-badge gl2">HP&#8209;GL/2</span></td><td>Signals the plotter to pause until ready.</td></tr>
                            <tr><td>PC</td><td>Pen Color <span class="cmd-badge gl2">HP&#8209;GL/2</span></td><td>Assigns RGB to a pen slot: <code>PC pen,r,g,b;</code> (0&ndash;255 each).</td></tr>
                            <tr><td>PM</td><td>Polygon Mode <span class="cmd-badge gl2">HP&#8209;GL/2</span></td><td>Enter (<code>PM0;</code>) / exit (<code>PM2;</code>) polygon buffer mode.</td></tr>
                            <tr><td>PW</td><td>Pen Width <span class="cmd-badge gl2">HP&#8209;GL/2</span></td><td>Sets pen width in mm: <code>PW width[,pen];</code>.</td></tr>
                            <tr><td>RF</td><td>Raster Fill <span class="cmd-badge gl2">HP&#8209;GL/2</span></td><td>Defines a user fill pattern. <em>Not supported</em> &mdash; raster data discarded.</td></tr>
                            <tr><td>SD</td><td>Std. Font Definition <span class="cmd-badge gl2">HP&#8209;GL/2</span></td><td>Defines the standard label font by attribute list.</td></tr>
                            <tr><td>SV</td><td>Screened Vectors <span class="cmd-badge gl2">HP&#8209;GL/2</span></td><td>Applies a screen pattern to subsequent pen strokes.</td></tr>
                            <tr><td>TD</td><td>Transparent Data <span class="cmd-badge gl2">HP&#8209;GL/2</span></td><td>Label background transparency: <code>TD mode;</code>.</td></tr>
                            <tr><td>UL</td><td>User&#8209;defined Line Type <span class="cmd-badge gl2">HP&#8209;GL/2</span></td><td>Custom dash pattern for use with LT: <code>UL index,gap1,&hellip;;</code>.</td></tr>
                            <tr><td>WD</td><td>Write to Display <span class="cmd-badge gl2">HP&#8209;GL/2</span></td><td>Writes text to the front&#8209;panel display (shown in the status bar).</td></tr>
                        </tbody>
                    </table>
                    <div class="help-callout">
                        <div class="help-callout-title"><i class="fa-solid fa-book fa-xs"></i> Full Reference</div>
                        For hardware parameter limits and timing specifications, consult the
                        <em>HP 9872B Interfacing and Programming Manual</em> (HP part 09872&#8209;90001).
                    </div>
                </div>
            </div>

            <!-- ── About ─────────────────────────────────────── -->
            <div class="settings-group collapsed" id="help-about">
                <h3 class="settings-title"><i class="fa-question-circle fas"></i> About <i class="fa-solid fa-chevron-down toggle-icon"></i></h3>
                <div class="settings-group-content">
				  <p>All information is For Indication only. No association, affiliation, recommendation, suitability, fitness for purpose should be assumed or is implied. Registered trademarks are owned by their respective registrants.
				  </p>
				  <p>Non commercial use only.
				  </p>
				  <p>(c) NFfP 2026 All Rights Reserved 
				  </p>
				</div>
			</div>

            <!-- ── INDEX ─────────────────────────────────────── -->
            <div class="settings-group collapsed" id="help-index">
                <h3 class="settings-title"><i class="fa-solid fa-book-bookmark"></i> Index <i class="fa-solid fa-chevron-down toggle-icon"></i></h3>
                <div class="settings-group-content">
                    <div class="help-index-grid">
                        <a href="#help-hpgl">AA &mdash; Arc Absolute</a>
                        <a href="#help-hpgl">AC &mdash; Anchor Corner</a>
                        <a href="#help-hpgl">AD &mdash; Alternate Font</a>
                        <a href="#help-hpgl">AR &mdash; Arc Relative</a>
                        <a href="#help-technical">Baud rate</a>
                        <a href="#help-hpgl">CA &mdash; Alt. Char. Set</a>
                        <a href="#help-hpgl">CF &mdash; Char. Fill Mode</a>
                        <a href="#help-hpgl">CI &mdash; Circle</a>
                        <a href="#help-hpgl">CO &mdash; Comment</a>
                        <a href="#help-hpgl">CP &mdash; Character Plot</a>
                        <a href="#help-hpgl">CS &mdash; Char. Set</a>
                        <a href="#help-features">Coordinate display</a>
                        <a href="#help-technical">Coordinate system</a>
                        <a href="#help-features">Debug mode</a>
                        <a href="#help-hpgl">DI &mdash; Abs. Direction</a>
                        <a href="#help-hpgl">DR &mdash; Rel. Direction</a>
                        <a href="#help-hpgl">EA &mdash; Edge Rect. Abs.</a>
                        <a href="#help-hpgl">EP &mdash; Edge Polygon</a>
                        <a href="#help-hpgl">ER &mdash; Edge Rect. Rel.</a>
                        <a href="#help-hpgl">EW &mdash; Edge Wedge</a>
                        <a href="#help-features">Error LED</a>
                        <a href="#help-hpgl">FA &mdash; Fill Rect. Abs.</a>
                        <a href="#help-hpgl">FP &mdash; Fill Polygon</a>
                        <a href="#help-hpgl">FR &mdash; Fill Rect. Rel.</a>
                        <a href="#help-hpgl">FS &mdash; Force Select</a>
                        <a href="#help-hpgl">FT &mdash; Fill Type</a>
                        <a href="#help-hpgl">FW &mdash; Fill Wedge</a>
                        <a href="#help-features">Grid overlay</a>
                        <a href="#help-overview">HP&#8209;GL modes</a>
                        <a href="#help-hpgl">IN &mdash; Initialize</a>
                        <a href="#help-hpgl">IP &mdash; Input P1/P2</a>
                        <a href="#help-hpgl">IW &mdash; Input Window</a>
                        <a href="#help-usage">Jog controls</a>
                        <a href="#help-hpgl">LA &mdash; Line Attributes</a>
                        <a href="#help-hpgl">LB &mdash; Label</a>
                        <a href="#help-features">Limit LED</a>
                        <a href="#help-hpgl">LO &mdash; Label Origin</a>
                        <a href="#help-hpgl">LT &mdash; Line Type</a>
                        <a href="#help-hpgl">MC &mdash; Merge Control</a>
                        <a href="#help-hpgl">NR &mdash; Not Ready</a>
                        <a href="#help-hpgl">OA &mdash; Output Actual</a>
                        <a href="#help-hpgl">OC &mdash; Output Cmd.</a>
                        <a href="#help-hpgl">OE &mdash; Output Error</a>
                        <a href="#help-hpgl">OF &mdash; Output Factors</a>
                        <a href="#help-hpgl">OH &mdash; Output Hard Clip</a>
                        <a href="#help-hpgl">OI &mdash; Output ID</a>
                        <a href="#help-hpgl">OO &mdash; Output Options</a>
                        <a href="#help-hpgl">OP &mdash; Output P1/P2</a>
                        <a href="#help-hpgl">OS &mdash; Output Status</a>
                        <a href="#help-hpgl">OW &mdash; Output Window</a>
                        <a href="#help-features">Paper templates</a>
                        <a href="#help-hpgl">PA &mdash; Plot Absolute</a>
                        <a href="#help-hpgl">PC &mdash; Pen Color</a>
                        <a href="#help-features">Pen carousel</a>
                        <a href="#help-hpgl">PD &mdash; Pen Down</a>
                        <a href="#help-hpgl">PM &mdash; Polygon Mode</a>
                        <a href="#help-hpgl">PR &mdash; Plot Relative</a>
                        <a href="#help-hpgl">PU &mdash; Pen Up</a>
                        <a href="#help-hpgl">PW &mdash; Pen Width</a>
                        <a href="#help-technical">PLU (Plotter Unit)</a>
                        <a href="#help-hpgl">RF &mdash; Raster Fill</a>
                        <a href="#help-hpgl">RO &mdash; Rotate</a>
                        <a href="#help-hpgl">SA &mdash; Select Alt. Set</a>
                        <a href="#help-hpgl">SC &mdash; Scale</a>
                        <a href="#help-hpgl">SD &mdash; Std. Font Def.</a>
                        <a href="#help-technical">Serial / baud rate</a>
                        <a href="#help-hpgl">SI &mdash; Abs. Char. Size</a>
                        <a href="#help-hpgl">SM &mdash; Symbol Mode</a>
                        <a href="#help-hpgl">SP &mdash; Select Pen</a>
                        <a href="#help-hpgl">SR &mdash; Rel. Char. Size</a>
                        <a href="#help-hpgl">SS &mdash; Select Std. Set</a>
                        <a href="#help-hpgl">SV &mdash; Screened Vec.</a>
                        <a href="#help-hpgl">TD &mdash; Transparent Data</a>
                        <a href="#help-hpgl">TL &mdash; Tick Length</a>
                        <a href="#help-hpgl">UC &mdash; User Char.</a>
                        <a href="#help-hpgl">UL &mdash; User Line Type</a>
                        <a href="#help-hpgl">VS &mdash; Velocity Select</a>
                        <a href="#help-hpgl">WD &mdash; Write Display</a>
                        <a href="#help-usage">Web Serial</a>
                        <a href="#help-technical">Web Serial API</a>
                        <a href="#help-hpgl">XT &mdash; X Tick</a>
                        <a href="#help-hpgl">YT &mdash; Y Tick</a>
                    </div>
                </div>
            </div>

        </div>
    `;

    document.addEventListener('DOMContentLoaded', function () {
        const panel = document.getElementById('help-panel');
        if (!panel) return;

        // Inject content
        panel.innerHTML = HTML;

        // NOTE: accordion toggle listeners are intentionally NOT added here.
        // app.js binds document.querySelectorAll('.settings-title') at DOMContentLoaded,
        // which runs after this injection and correctly picks up these elements.
        // Adding listeners here too would double-bind and cancel every click out.

        // Contents TOC links: open the target section when clicked
        panel.querySelectorAll('.help-contents-list a').forEach(function (link) {
            link.addEventListener('click', function (e) {
                const targetId = link.getAttribute('href').slice(1); // strip '#'
                const targetSection = panel.querySelector('#' + targetId);
                if (targetSection) {
                    // Expand the target section if collapsed
                    targetSection.classList.remove('collapsed');
                    // Scroll it into view inside the sidebar body
                    targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    e.preventDefault();
                }
            });
        });
    });
})();
