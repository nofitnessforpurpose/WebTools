'use strict';

//------------- Header editor --------------------

function HeaderEditor(editorelement, callback) {
    FileEditor.call(this, editorelement, callback, [-1]);
}
HeaderEditor.prototype = Object.create(FileEditor.prototype);

HeaderEditor.prototype.initialise = function (item) {
    var self = this;
    if (!this.myelement) {
        this.myelement = document.createElement('div');
        this.myelement.style.height = "100%";
        this.myelement.style.overflowY = "auto"; // Main Scroll Container
        this.myelement.style.overflowX = "hidden";
        this.myelement.style.padding = "10px";
        this.myelement.style.boxSizing = "border-box";

        // Unified Content Wrapper
        var contentWrapper = document.createElement('div');
        contentWrapper.style.display = "flex";
        contentWrapper.style.flexDirection = "row";
        contentWrapper.style.position = "relative"; // Anchor for SVG
        contentWrapper.style.gap = "60px";
        contentWrapper.style.minHeight = "100%"; // Ensure it fills view

        // Custom Styles for Controls
        var styleEl = document.createElement('style');
        styleEl.innerHTML =
            "#ph-form-col input[type=checkbox] { appearance: none; width: 16px; height: 16px; background-color: rgba(255, 255, 255, 0.6); border: 1px solid rgba(0,0,0,0.3); border-radius: 3px; vertical-align: text-bottom; position: relative; cursor: pointer; }" +
            "#ph-form-col input[type=checkbox]:checked::after { content: '✔'; color: #000; font-size: 12px; font-weight: bold; position: absolute; top: 0px; left: 3px; }";
        this.myelement.appendChild(styleEl);

        // Colors for Linking
        this.colors = {
            byte0: { stroke: '#4caf50', bg: 'rgba(76, 175, 80, 0.1)', border: '#4caf50' }, // Green (Flags)
            byte1: { stroke: '#2196f3', bg: 'rgba(33, 150, 243, 0.1)', border: '#2196f3' }, // Blue (Size)
            byteTime: { stroke: '#9c27b0', bg: 'rgba(156, 39, 176, 0.1)', border: '#9c27b0' }, // Purple (Time/Boot)
            byteCk: { stroke: '#ff9800', bg: 'rgba(255, 152, 0, 0.1)', border: '#ff9800' }, // Orange (Checksum)
            byteCnt: { stroke: '#00bcd4', bg: 'rgba(0, 188, 212, 0.1)', border: '#00bcd4' } // Cyan (Counter/Addr)
        };

        // --- LEFT COLUMN: Hex Data ---
        var hexCol = document.createElement('fieldset'); // Changed to fieldset for Legend
        hexCol.id = 'ph-hex-col';
        hexCol.style.display = 'flex';
        hexCol.style.flexDirection = 'column';
        hexCol.style.gap = '20px';
        hexCol.style.padding = '15px';
        hexCol.style.margin = '0'; // Reset browser default
        hexCol.style.background = 'var(--container-header-bg, rgba(0, 0, 0, 0.05))';
        hexCol.style.border = '1px solid var(--border-color, #444)';
        hexCol.style.borderRadius = '8px';
        hexCol.style.height = 'fit-content';
        hexCol.style.minWidth = '100px';
        hexCol.style.zIndex = '10';
        hexCol.style.flexShrink = '0';

        // Header Label "Header" as Legend
        var legend = document.createElement('legend');
        legend.innerText = "Header";
        legend.style.fontWeight = 'bold';
        legend.style.color = 'var(--text-color-secondary, #aaa)'; // Legend color matches others
        legend.style.padding = '0 5px';
        hexCol.appendChild(legend);

        // Helper for Byte Display
        this.createByteDisplay = function (index, colorTheme) {
            var container = document.createElement('div');
            container.id = 'ph-byte-container-' + index;
            container.style.display = 'flex';
            container.style.alignItems = 'center';
            container.style.gap = '10px';
            container.style.padding = '4px 8px';
            container.style.borderRadius = '4px';
            // Subtle Coloring
            if (colorTheme) {
                container.style.borderLeft = '3px solid ' + colorTheme.border;
                container.style.background = colorTheme.bg;
            } else {
                container.style.border = '1px solid var(--border-color, #444)';
            }

            var lbl = document.createElement('div');
            lbl.innerText = (index < 8) ? ('0' + index) : (index === 8 ? 'Ck' : 'Sm');
            lbl.style.fontSize = '11px'; // Reduced from 14px
            lbl.style.fontWeight = 'bold';
            // Increased Contrast: from #aaa/secondary to #eee or plain stronger color
            lbl.style.color = 'var(--text-color, #eee)';
            lbl.style.minWidth = '25px';

            var val = document.createElement('div');
            val.id = 'ph-byte-' + index;
            val.className = 'ph-hex-value';
            val.innerText = '00';
            val.style.fontFamily = 'monospace';
            val.style.fontSize = '18px';
            val.style.fontWeight = 'bold';
            val.style.color = 'var(--text-color, #e0e0e0)'; // Changed from highlight-color to text-color

            container.appendChild(lbl);
            container.appendChild(val);
            return container;
        };

        // Group 1: Byte 0
        hexCol.appendChild(this.createByteDisplay(0, this.colors.byte0));
        // Group 2: Byte 1
        hexCol.appendChild(this.createByteDisplay(1, this.colors.byte1));
        // Group 3: Bytes 2-7
        // Group 3: Bytes 2-5 (Time / Boot ID)
        var grpTime = document.createElement('div');
        grpTime.id = 'ph-group-time'; // ID for Linking
        grpTime.style.display = 'flex';
        grpTime.style.flexDirection = 'column';
        grpTime.style.gap = '5px'; // Tighter packing
        for (var i = 2; i <= 5; i++) grpTime.appendChild(this.createByteDisplay(i, this.colors.byteTime));
        hexCol.appendChild(grpTime);

        // Group 3b: Bytes 6-7 (Counter / Address)
        var grpCnt = document.createElement('div');
        grpCnt.id = 'ph-group-counter'; // ID for Linking
        grpCnt.style.display = 'flex';
        grpCnt.style.flexDirection = 'column';
        grpCnt.style.gap = '5px';
        for (var i = 6; i <= 7; i++) grpCnt.appendChild(this.createByteDisplay(i, this.colors.byteCnt));
        hexCol.appendChild(grpCnt);
        // Group 4: Bytes 8-9
        var grpCk = document.createElement('div');
        grpCk.id = 'ph-group-checksum'; // ID for Linking
        grpCk.style.display = 'flex';
        grpCk.style.flexDirection = 'column';
        grpCk.style.gap = '5px';
        grpCk.appendChild(this.createByteDisplay(8, this.colors.byteCk));
        grpCk.appendChild(this.createByteDisplay(9, this.colors.byteCk));
        hexCol.appendChild(grpCk);

        contentWrapper.appendChild(hexCol);

        // --- RIGHT COLUMN: Form Data ---
        var formCol = document.createElement('div');
        formCol.id = 'ph-form-col';
        formCol.style.display = 'flex';
        formCol.style.flexDirection = 'column';
        formCol.style.gap = '20px'; // Must match HexCol gaps roughly or be aligned
        formCol.style.flex = '1';
        formCol.style.maxWidth = '400px'; // Constrain width as requested (40% of standard?)
        formCol.style.zIndex = '10';
        // formCol.style.overflowY = 'auto';

        // 1. Flags (Aligns with Byte 0)
        var flagsField = document.createElement('fieldset');
        flagsField.id = 'legend-flags';
        flagsField.style.border = '1px solid ' + this.colors.byte0.border;
        flagsField.style.background = this.colors.byte0.bg;
        flagsField.style.borderRadius = '4px';
        flagsField.style.padding = '10px';
        flagsField.style.margin = '0';
        flagsField.innerHTML =
            "<legend style='color:" + this.colors.byte0.border + "; font-weight:bold;'>Flags</legend>" +
            "<div style='display:grid; grid-template-columns: 1fr 1fr; gap:5px;'>" +
            "<div><input type='checkbox' id='bit1'><label for='bit1'>EPROM</label></div>" +
            "<div><input type='checkbox' id='bit2'><label for='bit2'>Paged</label></div>" +
            "<div><input type='checkbox' id='bit3'><label for='bit3'>Write Prot</label></div>" +
            "<div><input type='checkbox' id='bit4'><label for='bit4'>Bootable</label></div>" +
            "<div><input type='checkbox' id='bit5'><label for='bit5'>Copy Prot</label></div>" +
            "<div><input type='checkbox' id='bit6'><label for='bit6'>Flashpack</label></div>" +
            "</div>";
        formCol.appendChild(flagsField);

        // 2. Size (Aligns with Byte 1)
        var sizeField = document.createElement('fieldset');
        sizeField.id = 'legend-size';
        sizeField.style.border = '1px solid ' + this.colors.byte1.border;
        sizeField.style.background = this.colors.byte1.bg;
        sizeField.style.borderRadius = '4px';
        sizeField.style.padding = '10px';
        sizeField.style.margin = '0';
        sizeField.innerHTML =
            "<legend style='color:" + this.colors.byte1.border + "; font-weight:bold;'>Pack Size</legend>" +
            "<select id='packsize' style='width:100%; padding:5px; background-color: rgba(255, 255, 255, 0.6); border: 1px solid rgba(0,0,0,0.2); border-radius: 3px;'>" +
            "<option>8K</option><option>16K</option><option>32K</option>" +
            "<option>64K</option><option>128K</option><option>256K</option>" +
            "<option>512K</option><option>1024K</option></select>";
        formCol.appendChild(sizeField);

        // 3. Time/Boot (Aligns with Bytes 2-7) 
        // Note: Height might mismatch if not careful.
        var paramContainer = document.createElement('div');
        paramContainer.style.display = 'flex';
        paramContainer.style.flexDirection = 'column';
        paramContainer.style.gap = '20px';

        var createParamField = (id, legend, html, colorTheme) => {
            var f = document.createElement('fieldset');
            f.id = id;
            f.style.border = '1px solid ' + colorTheme.border;
            f.style.background = colorTheme.bg;
            f.style.borderRadius = '4px';
            f.style.padding = '15px';
            f.style.margin = '0';
            f.style.boxSizing = 'border-box';
            f.innerHTML = "<legend style='color:" + colorTheme.border + "; font-weight:bold;'>" + legend + "</legend>" + html;
            return f;
        };

        var commonSelectStyle = "width:60%; background-color: rgba(255, 255, 255, 0.6); border: 1px solid rgba(0,0,0,0.2); border-radius: 3px;";

        var timeContent =
            "<div style='display:flex; flex-direction:column; gap:5px; height:100%;'>" +
            "<div id='grp-year' style='display:flex; justify-content:space-between; align-items:center; min-height:30px;'><label>Year</label><select id='year' style='" + commonSelectStyle + "'></select></div>" +
            "<div id='grp-month' style='display:flex; justify-content:space-between; align-items:center; min-height:30px;'><label>Month</label><select id='month' style='" + commonSelectStyle + "'></select></div>" +
            "<div id='grp-day' style='display:flex; justify-content:space-between; align-items:center; min-height:30px;'><label>Day</label><select id='day' style='" + commonSelectStyle + "'></select></div>" +
            "<div id='grp-hour' style='display:flex; justify-content:space-between; align-items:center; min-height:30px;'><label>Hour</label><select id='hour' style='" + commonSelectStyle + "'></select></div>" +
            "</div>";

        var countContent =
            "<div style='display:flex; flex-direction:column; gap:5px; height:100%;'>" +
            "<div id='grp-cnt1' style='display:flex; justify-content:space-between; align-items:center; min-height:30px;'><label>Count 1</label><select id='counter1' style='" + commonSelectStyle + "'></select></div>" +
            "<div id='grp-cnt2' style='display:flex; justify-content:space-between; align-items:center; min-height:30px;'><label>Count 2</label><select id='counter2' style='" + commonSelectStyle + "'></select></div>" +
            "</div>";

        var bootContent =
            "<div style='display:flex; flex-direction:column; gap:5px; height:100%;'>" +
            "<div id='grp-code' style='display:flex; justify-content:space-between; align-items:center; min-height:30px;'><label>Code</label><select id='code' style='" + commonSelectStyle + "'></select></div>" +
            "<div id='grp-bootid' style='display:flex; justify-content:space-between; align-items:center; min-height:30px;'><label>ID</label><select id='bootid' style='" + commonSelectStyle + "'></select></div>" +
            "<div id='grp-ver' style='display:flex; justify-content:space-between; align-items:center; min-height:30px;'><label>Ver</label><select id='version' style='" + commonSelectStyle + "'></select></div>" +
            "<div id='grp-prio' style='display:flex; justify-content:space-between; align-items:center; min-height:30px;'><label>Prio</label><select id='priority' style='" + commonSelectStyle + "'></select></div>" +
            "</div>";

        var bootAddrContent =
            "<div style='display:flex; flex-direction:column; gap:5px; height:100%;'>" +
            "<div id='grp-boot-rec' style='display:flex; justify-content:space-between; align-items:center; min-height:30px;'><label>Record</label><select id='boot-target-select' style='" + commonSelectStyle + "'></select></div>" +
            "<div id='grp-addr1' style='display:flex; justify-content:space-between; align-items:center; min-height:30px;'><label>Addr 1</label><select id='address1' style='" + commonSelectStyle + "'></select></div>" +
            "<div id='grp-addr2' style='display:flex; justify-content:space-between; align-items:center; min-height:30px;'><label>Addr 2</label><select id='address2' style='" + commonSelectStyle + "'></select></div>" +
            "</div>";

        var timeDiv = createParamField('timesection', 'Time Stamp', timeContent, this.colors.byteTime);
        var countDiv = createParamField('countsection', 'Frame Counter', countContent, this.colors.byteCnt);
        var bootDiv = createParamField('bootsection', 'Boot Data', bootContent, this.colors.byteTime);
        var bootAddrDiv = createParamField('bootaddrsection', 'Boot Address', bootAddrContent, this.colors.byteCnt);

        bootDiv.style.display = 'none';
        bootAddrDiv.style.display = 'none';

        paramContainer.appendChild(timeDiv);
        paramContainer.appendChild(countDiv);
        paramContainer.appendChild(bootDiv);
        paramContainer.appendChild(bootAddrDiv);
        formCol.appendChild(paramContainer);

        // 4. Checksum
        var ckField = document.createElement('div');
        ckField.id = 'checksum-container';
        ckField.style.padding = '10px';
        ckField.style.border = '1px solid ' + this.colors.byteCk.border;
        ckField.style.background = this.colors.byteCk.bg;
        ckField.style.borderRadius = '4px';
        ckField.style.textAlign = 'right';
        ckField.innerHTML = "Header Checksum: <span id='checksum' style='font-family:monospace; font-weight:bold; color:var(--highlight-color); font-size:1.2em;'></span>";
        formCol.appendChild(ckField);

        contentWrapper.appendChild(formCol);


        // SVG Layer
        var svgContainer = document.createElement('div');
        svgContainer.style.position = 'absolute';
        svgContainer.style.top = '0';
        svgContainer.style.left = '0';
        svgContainer.style.width = '100%';
        svgContainer.style.height = '100%';
        svgContainer.style.pointerEvents = 'none';
        svgContainer.style.zIndex = '1';
        svgContainer.id = 'ph-svg-container';

        this.editorelement.style.position = 'relative';
        contentWrapper.appendChild(svgContainer); // Moved inside Wrapper
        this.svgContainer = svgContainer;

        this.myelement.appendChild(contentWrapper); // Wrapper append to main
        this.svgWrapper = contentWrapper; // Helper ref

    }
    this.editorelement.appendChild(this.myelement);

    // Initialise Options
    function createOptions(id, min, max, hex) {
        var el = document.getElementById(id);
        if (!el) return;
        while (el.firstChild) el.removeChild(el.firstChild);
        for (var i = min; i <= max; i++) {
            var opt = document.createElement('option');
            opt.value = i;
            opt.innerHTML = hex ? i.toString(16).toUpperCase().padStart(2, '0') : i;
            el.appendChild(opt);
        }
    }
    createOptions("year", 1900, 2155, false);
    createOptions("month", 1, 12, false);
    createOptions("day", 1, 31, false);
    createOptions("hour", 0, 23, false);
    createOptions("counter1", 0, 255, true);
    createOptions("counter2", 0, 255, true);

    createOptions("code", 0, 1, false);
    createOptions("bootid", 0, 255, true);
    createOptions("version", 0, 255, true);
    createOptions("priority", 0, 255, true);
    createOptions("address1", 0, 255, true);
    createOptions("address2", 0, 255, true);

    // Initialise Form Data
    this.item = item;
    var flags = item.data[0];

    var ref = function () { UpdateVisuals(self, true); };
    var refFill = function () { FillInHeader(self); UpdateVisuals(self, true); };

    initialiseForm("bit1", (flags & 0x02) != 0, this, ref);
    initialiseForm("bit2", (flags & 0x04) != 0, this, ref);
    initialiseForm("bit3", (flags & 0x08) == 0, this, ref);
    initialiseForm("bit4", (flags & 0x10) == 0, this, refFill);
    initialiseForm("bit5", (flags & 0x20) == 0, this, ref);
    initialiseForm("bit6", (flags & 0x40) == 0, this, ref);

    // Dynamic Pack Size Options
    var psSelect = document.getElementById("packsize");
    if (psSelect) {
        psSelect.innerHTML = ""; // Clear existing
        // Standard Options (1-8) representing 8K blocks
        // 8K=1, 16K=2, 32K=4, 64K=8, 128K=16, 256K=32, 512K=64, 1024K=128
        var stdSizes = ["8K", "16K", "32K", "64K", "128K", "256K", "512K", "1024K"];
        for (var k = 0; k < 8; k++) {
            var opt = document.createElement("option");
            opt.value = 1 << k;  // 1, 2, 4, 8, 16, 32, 64, 128
            opt.innerText = stdSizes[k];
            psSelect.appendChild(opt);
        }

        var sz = item.data[1];
        var targetIndex = -1;

        // Try to find matching value in dropdown
        for (var i = 0; i < psSelect.options.length; i++) {
            if (parseInt(psSelect.options[i].value) === sz) {
                targetIndex = i;
                break;
            }
        }

        if (targetIndex === -1) {
            // Non-standard / Linear
            var customOpt = document.createElement("option");
            customOpt.value = sz;
            customOpt.innerText = "Custom/Linear (" + (sz * 8) + "K)";
            psSelect.appendChild(customOpt);
            targetIndex = 8; // The 9th option
        }

        // Expanded Ref for Pack Size change
        var refSize = function () {
            var val = parseInt(psSelect.value);
            // Auto-set Paged Mode for >= 32K (Count 4)
            if (val >= 4) {
                var bit2 = document.getElementById("bit2");
                if (bit2 && !bit2.checked) {
                    bit2.checked = true;
                }
            }
            UpdateVisuals(self, true);
        };

        initialiseForm("packsize", targetIndex, this, refSize);
    }

    FillInHeader(this);

    // Resize Observer for robust scaling
    if (window.ResizeObserver) {
        this.ro = new ResizeObserver(function () {
            UpdateVisuals(self, true);
        });
        this.ro.observe(this.editorelement);
        this.ro.observe(this.myelement);
    } else {
        // Fallback
        this._resizeHandler = function () { UpdateVisuals(self, true); };
        window.addEventListener('resize', this._resizeHandler);
    }

    setTimeout(function () { UpdateVisuals(self, true); }, 10);

    this.cleanup = function () {
        if (this.svgContainer) this.svgContainer.innerHTML = '';
        if (this.ro) this.ro.disconnect();
        if (this._resizeHandler) window.removeEventListener('resize', this._resizeHandler);
    };
}


function FillInHeader(editor) {
    var item = editor.item;
    var timesection = document.getElementById("timesection");
    var countsection = document.getElementById("countsection");
    var bootsection = document.getElementById("bootsection");
    var bootaddrsection = document.getElementById("bootaddrsection");
    var bootable = document.getElementById("bit4").checked;

    var ref = function () { UpdateVisuals(editor, true); };

    if (bootable) {
        if (bootsection) bootsection.style.display = "block";
        if (bootaddrsection) bootaddrsection.style.display = "block";
        if (timesection) timesection.style.display = "none";
        if (countsection) countsection.style.display = "none";

        var wasBootable = (item.data[0] & 0x10) == 0;

        initialiseForm("code", wasBootable ? item.data[2] : 0x00, editor, ref);
        initialiseForm("bootid", wasBootable ? item.data[3] : 0x90, editor, ref);
        initialiseForm("version", wasBootable ? item.data[4] : 0x10, editor, ref);
        initialiseForm("priority", wasBootable ? item.data[5] : 0x90, editor, ref);
        initialiseForm("address1", wasBootable ? item.data[6] : 0x00, editor, ref);
        initialiseForm("address2", wasBootable ? item.data[7] : 0x19, editor, ref);

        // Feature: Boot Target Dropdown
        var dropdown = document.getElementById("boot-target-select");
        if (dropdown && typeof packs !== 'undefined' && typeof currentPackIndex !== 'undefined') {
            dropdown.innerHTML = "<option value='-1'>Select Boot Record...</option>";

            var pack = packs[currentPackIndex];
            if (pack && pack.items) {
                var currentAddr = 0;
                var bootAddrVal = ((document.getElementById("address1").value & 0xFF) << 8) | (document.getElementById("address2").value & 0xFF);

                for (var i = 0; i < pack.items.length; i++) {
                    var pItem = pack.items[i];
                    var itemLen = pItem.getLength();

                    // Filter: Only select records commencing with bytes 0x02, 0x80 (Wrapped Long Records)
                    if (pItem.data && pItem.data.length >= 2 && pItem.data[0] === 0x02 && pItem.data[1] === 0x80) {
                        // Address Calculation:
                        // Standard Type 2 Wrapper (4 byte header) containing code/data.
                        // Boot Address is Offset + 4.
                        var targetAddr = currentAddr + 4;
                        var label = "REC: " + (pItem.name || "Long Record");

                        var opt = document.createElement("option");
                        opt.value = targetAddr;
                        opt.innerText = label + " (0x" + targetAddr.toString(16).toUpperCase().padStart(4, '0') + ")";
                        if (targetAddr === bootAddrVal) {
                            opt.selected = true;
                        }
                        dropdown.appendChild(opt);
                    }

                    currentAddr += itemLen;
                }
            }

            // Handler
            dropdown.onchange = function () {
                var val = parseInt(this.value);
                if (val >= 0) {
                    var a1 = (val >> 8) & 0xFF;
                    var a2 = val & 0xFF;
                    var e1 = document.getElementById('address1');
                    var e2 = document.getElementById('address2');

                    if (e1) { e1.value = a1; e1.dispatchEvent(new Event('change')); }
                    if (e2) { e2.value = a2; e2.dispatchEvent(new Event('change')); }
                }
            };
        }
    } else {
        if (timesection) timesection.style.display = "block";
        if (countsection) countsection.style.display = "block";
        if (bootsection) bootsection.style.display = "none";
        if (bootaddrsection) bootaddrsection.style.display = "none";

        var wasBootable = (item.data[0] & 0x10) == 0;
        var nw = new Date();
        initialiseForm("year", !wasBootable ? item.data[2] : nw.getFullYear() - 1900, editor, ref);
        initialiseForm("month", !wasBootable ? item.data[3] : nw.getMonth(), editor, ref);
        initialiseForm("day", !wasBootable ? item.data[4] : nw.getDate() - 1, editor, ref);
        initialiseForm("hour", !wasBootable ? item.data[5] : nw.getHours(), editor, ref);
        initialiseForm("counter1", !wasBootable ? item.data[6] : 0xff, editor, ref);
        initialiseForm("counter2", !wasBootable ? item.data[7] : 0xff, editor, ref);
    }
}

HeaderEditor.prototype.getHeaderData = function () {
    var newdata = new Uint8Array(10);
    for (var i = 0; i < 10; i++) newdata[i] = this.item.data[i];

    // flags
    // flags
    var flags = (newdata[0] & 0x81) | 0x78;
    var b1 = document.getElementById("bit1"); if (b1 && b1.checked) flags |= 0x02;
    var b2 = document.getElementById("bit2"); if (b2 && b2.checked) flags |= 0x04;
    var b3 = document.getElementById("bit3"); if (b3 && b3.checked) flags &= 0xf7;
    var b4 = document.getElementById("bit4"); if (b4 && b4.checked) flags &= 0xef;
    var b5 = document.getElementById("bit5"); if (b5 && b5.checked) flags &= 0xdf;
    var b6 = document.getElementById("bit6"); if (b6 && b6.checked) flags &= 0xbf;
    newdata[0] = flags;

    // size
    var szElem = document.getElementById("packsize");
    var sz = szElem ? parseInt(szElem.value) : 1;
    newdata[1] = sz;

    var isBootable = (flags & 0x10) == 0;
    if (isBootable) {
        if (document.getElementById("code")) newdata[2] = document.getElementById("code").value;
        if (document.getElementById("bootid")) newdata[3] = document.getElementById("bootid").value;
        if (document.getElementById("version")) newdata[4] = document.getElementById("version").value;
        if (document.getElementById("priority")) newdata[5] = document.getElementById("priority").value;
        if (document.getElementById("address1")) newdata[6] = document.getElementById("address1").value;
        if (document.getElementById("address2")) newdata[7] = document.getElementById("address2").value;
    } else {
        if (document.getElementById("year")) newdata[2] = document.getElementById("year").value - 1900;
        if (document.getElementById("month")) newdata[3] = document.getElementById("month").value - 1;
        if (document.getElementById("day")) newdata[4] = document.getElementById("day").value - 1;
        if (document.getElementById("hour")) newdata[5] = document.getElementById("hour").value;
        if (document.getElementById("counter1")) newdata[6] = document.getElementById("counter1").value;
        if (document.getElementById("counter2")) newdata[7] = document.getElementById("counter2").value;
    }

    // checksum
    var sum1 = newdata[0] + newdata[2] + newdata[4] + newdata[6];
    var sum2 = newdata[1] + newdata[3] + newdata[5] + newdata[7];
    sum1 += (sum2 >> 8);
    newdata[8] = sum1 & 0xff;
    newdata[9] = sum2 & 0xff;

    return newdata;
}

function UpdateVisuals(editor, drawLines) {
    var newdata = HeaderEditor.prototype.getHeaderData.call(editor);
    var cs = (newdata[8] << 8) + (newdata[9]);
    var checksum = document.getElementById("checksum");
    if (checksum) checksum.innerHTML = ("0000" + cs.toString(16)).substr(-4).toUpperCase();

    for (var i = 0; i < 10; i++) {
        var el = document.getElementById('ph-byte-' + i);
        if (el) {
            el.innerText = newdata[i].toString(16).toUpperCase().padStart(2, '0');
        }
    }

    if (drawLines || !editor.svgDrawn) {
        DrawLinks(editor);
        editor.svgDrawn = true;
    }
}

function DrawLinks(editor) {
    if (!editor.svgContainer || !editor.svgWrapper) return;

    var container = editor.svgWrapper;
    var rect = container.getBoundingClientRect(); // Wrapper rect

    var svgHTML = '<svg width="100%" height="100%" style="overflow:visible;">';

    var getPoint = function (id, isRightSide) {
        var el = document.getElementById(id);
        if (!el) return null;
        var r = el.getBoundingClientRect();
        var y = r.top + r.height / 2 - rect.top;
        // Compensate for Legend: Move down by ~10px if it's a fieldset on the right
        if (isRightSide && el.tagName === 'FIELDSET') {
            y += 10;
        }

        return {
            x: isRightSide ? (r.left - rect.left) : (r.right - rect.left), // Relative to wrapper
            centerX: r.left + r.width / 2 - rect.left,
            centerY: y,
        };
    };

    var connections = [];
    connections.push({ from: 'ph-byte-container-0', to: 'legend-flags', color: editor.colors.byte0.stroke });
    connections.push({ from: 'ph-byte-container-1', to: 'legend-size', color: editor.colors.byte1.stroke });

    // 3. Bytes 2-5 -> Time/Boot ID (Purple)
    var bit4El = document.getElementById("bit4");
    var isBootable = bit4El ? bit4El.checked : false;
    var targetTime = isBootable ? 'bootsection' : 'timesection';
    connections.push({ from: 'ph-group-time', to: targetTime, color: editor.colors.byteTime.stroke });

    // 3b. Bytes 6-7 -> Counter/Address (Cyan)
    var targetCount = isBootable ? 'bootaddrsection' : 'countsection';
    connections.push({ from: 'ph-group-counter', to: targetCount, color: editor.colors.byteCnt.stroke });

    // 4. Bytes 8-9 (Group) -> Checksum (Orange)
    connections.push({ from: 'ph-group-checksum', to: 'checksum-container', color: editor.colors.byteCk.stroke });

    connections.forEach(function (c) {
        var pFrom = getPoint(c.from, false);
        var pTo = getPoint(c.to, true);

        if (pFrom && pTo) {
            var x1 = pFrom.x;
            var y1 = pFrom.centerY;
            var x2 = pTo.x;
            var y2 = pTo.centerY;

            var midX = (x1 + x2) / 2;
            var path = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;

            svgHTML += `<path d="${path}" stroke="${c.color}" stroke-width="2" fill="none" opacity="0.6" />`;
            // Dots
            svgHTML += `<circle cx="${x1}" cy="${y1}" r="3" fill="${c.color}" />`;
            svgHTML += `<circle cx="${x2}" cy="${y2}" r="3" fill="${c.color}" />`; // Restored dest dot
        }
    });

    svgHTML += '</svg>';
    editor.svgContainer.innerHTML = svgHTML;
}


HeaderEditor.prototype.hasUnsavedChanges = function () {
    if (FileEditor.prototype.hasUnsavedChanges.call(this)) return true;
    var newdata = this.getHeaderData();
    for (var i = 0; i < 8; i++) {
        if (newdata[i] !== this.item.data[i]) return true;
    }
    return false;
}
HeaderEditor.prototype.applyChanges = function () {
    var newdata = this.getHeaderData();
    var differ = !arraysAreEqual(newdata, this.item.data);
    if (differ) this.item.setData(newdata);
    return FileEditor.prototype.applyChanges.call(this) | differ;
}
