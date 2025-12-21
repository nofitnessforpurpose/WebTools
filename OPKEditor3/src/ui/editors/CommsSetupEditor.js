'use strict';

//------------- Comms Setup Editor --------------------

function CommsSetupEditor(editorelement, callback) {
    FileEditor.call(this, editorelement, callback, [4]); // Type 4 = Comms Link setup
}

CommsSetupEditor.prototype = Object.create(FileEditor.prototype);

CommsSetupEditor.prototype.initialise = function (item) {
    if (!this.myelement) {
        var newelement = document.createElement('div');
        newelement.className = "comms-editor-container";

        // CSS for consistent HCI
        // Using scoped classes to avoid pollution
        var style =
            "<style>" +
            ".comms-editor-container { padding: 10px; font-family: 'Segoe UI', sans-serif; font-size: 13px; color: var(--text-color); width: 50%; min-width: 400px; }" +
            ".comms-editor-container fieldset { border: 1px solid var(--border-color); padding: 10px; margin-bottom: 10px; border-radius: 4px; }" +
            ".comms-editor-container legend { font-weight: bold; padding: 0 5px; color: var(--sidebar-header-text); }" +
            ".comms-group { display: grid; grid-template-columns: 1fr 1fr; column-gap: 20%; row-gap: 5px; padding: 0; }" + /* 20% gap, tighter rows, no padding */
            ".comms-row { display: flex; align-items: center; justify-content: space-between; }" +
            ".comms-label { flex: 1; min-width: 100px; }" +
            ".comms-input { background-color: var(--input-bg); border: 1px solid var(--input-border); color: var(--input-text-color); padding: 2px 5px; font-size: 12px; width: 100px; box-sizing: border-box; }" +
            ".comms-input:focus { border-color: var(--list-selected-bg); outline: none; }" +
            ".comms-checkbox { margin-right: 5px; }" +
            ".comms-header-row { margin-bottom: 10px; padding-bottom: 10px; display: flex; align-items: center; gap: 20px; border-bottom: 1px solid var(--border-color); }" + /* Divider added */
            ".code-hex-input { font-family: 'Consolas', monospace; text-transform: uppercase; }" +
            ".section-title { font-weight: bold; margin: 15px 0 5px 0; border-bottom: 1px solid var(--border-color); padding-bottom: 2px; }" +
            "</style>";

        var html =
            "<form action='#' onsubmit='return false;'>" +
            "<fieldset><legend>Comms Link Setup</legend>" +

            // Header Section
            "<div class='comms-header-row'>" +
            "  <div class='comms-row' style='gap:10px'>" +
            "    <label class='comms-label' style='flex:0'>File Name:</label>" +
            "    <input type='text' id='filename' maxlength='8' class='comms-input' style='width: 120px; font-family: monospace;'>" +
            "  </div>" +
            "  <div class='comms-row' style='gap:5px'>" +
            "    <input type='checkbox' id='deleted' class='comms-checkbox'>" +
            "    <label for='deleted'>Deleted</label>" +
            "  </div>" +
            "</div>" +

            // Main Settings (Grid)
            "<div class='comms-group'>" +
            "  <div class='comms-row'><label class='comms-label'>Baud Rate:</label><select id='baudrate' class='comms-input'></select></div>" +
            "  <div class='comms-row'><label class='comms-label'>Parity:</label><select id='parity' class='comms-input'></select></div>" +
            "  <div class='comms-row'><label class='comms-label'>Data Bits:</label><select id='databits' class='comms-input'></select></div>" +
            "  <div class='comms-row'><label class='comms-label'>Stop Bits:</label><select id='stopbits' class='comms-input'></select></div>" +
            "  <div class='comms-row'><label class='comms-label'>Handshaking:</label><select id='handshake' class='comms-input'></select></div>" +
            "  <div class='comms-row'><label class='comms-label'>Protocol:</label><select id='protocol' class='comms-input'></select></div>" +
            "</div>" +
            "  <div class='comms-row' style='margin-top:8px'><label class='comms-label' style='flex:0; margin-right:10px'>Width / Timeout:</label><input type='text' id='width' size='5' class='comms-input' style='width:60px'></div>" +

            // Advanced Section
            "<div class='section-title'>Translation & End of Line</div>" +

            "<div class='comms-group' style='column-gap: 10%;'>" + /* Keep advanced section a bit tighter or consistent? I'll use default class but maybe override if needed. User asked for "space between columns" typically related to the main block. I will let the class apply 20% here too for consistency unless it breaks layout. 20% in advanced might be too wide? I'll try it. */
            "  <div>" +
            "    <div style='font-weight:bold; margin-bottom:5px; text-align:center; background:var(--toolbar-bg); padding:2px'>RECEIVE (RX)</div>" +
            "    <div class='comms-row' style='margin-bottom:5px'><label class='comms-label'>Translate (RTRN):</label><input type='text' id='rtrn' class='comms-input' style='width:60px'></div>" +
            "    <div class='comms-row' style='margin-bottom:5px'><label class='comms-label'>End of Line (REOL):</label><input type='text' id='reol' class='comms-input code-hex-input' style='width:60px' placeholder='00'></div>" +
            "    <div class='comms-row'><label class='comms-label'>End of File (REOF):</label><input type='text' id='reof' class='comms-input code-hex-input' style='width:60px' placeholder='00'></div>" +
            "  </div>" +

            "  <div>" +
            "    <div style='font-weight:bold; margin-bottom:5px; text-align:center; background:var(--toolbar-bg); padding:2px'>TRANSMIT (TX)</div>" +
            "    <div class='comms-row' style='margin-bottom:5px'><label class='comms-label'>Translate (TTRN):</label><input type='text' id='ttrn' class='comms-input' style='width:60px'></div>" +
            "    <div class='comms-row' style='margin-bottom:5px'><label class='comms-label'>End of Line (TEOL):</label><input type='text' id='teol' class='comms-input code-hex-input' style='width:60px' placeholder='00'></div>" +
            "    <div class='comms-row'><label class='comms-label'>End of File (TEOF):</label><input type='text' id='teof' class='comms-input code-hex-input' style='width:60px' placeholder='00'></div>" +
            "  </div>" +
            "</div>" +

            "</fieldset></form>";

        newelement.innerHTML = style + html;
        this.myelement = newelement;
    }
    this.editorelement.appendChild(this.myelement);

    this.item = item;

    // --- Populate Dropdowns (Standard) ---
    var baudSelect = document.getElementById("baudrate");
    baudSelect.innerHTML = "";
    var bauds = [
        { val: 0, text: "50" }, { val: 1, text: "75" }, { val: 2, text: "110" }, { val: 3, text: "150" },
        { val: 4, text: "300" }, { val: 5, text: "600" }, { val: 6, text: "1200" }, { val: 7, text: "2400" },
        { val: 8, text: "4800" }, { val: 9, text: "9600" }, { val: 10, text: "19200" }
    ];
    for (var i = 0; i < bauds.length; i++) {
        var opt = document.createElement("option");
        opt.value = bauds[i].val;
        opt.innerText = bauds[i].text;
        baudSelect.appendChild(opt);
    }

    var paritySelect = document.getElementById("parity");
    paritySelect.innerHTML = "";
    var parities = ["None", "Even", "Odd", "Mark", "Space"];
    for (var i = 0; i < parities.length; i++) {
        var opt = document.createElement("option");
        opt.value = i;
        opt.innerText = parities[i];
        paritySelect.appendChild(opt);
    }

    var dataSelect = document.getElementById("databits");
    dataSelect.innerHTML = "";
    var dbits = [{ val: 0, text: "7" }, { val: 1, text: "8" }];
    for (var i = 0; i < dbits.length; i++) {
        var opt = document.createElement("option");
        opt.value = dbits[i].val;
        opt.innerText = dbits[i].text;
        dataSelect.appendChild(opt);
    }

    var stopSelect = document.getElementById("stopbits");
    stopSelect.innerHTML = "";
    var sbits = [{ val: 0, text: "1" }, { val: 1, text: "2" }];
    for (var i = 0; i < sbits.length; i++) {
        var opt = document.createElement("option");
        opt.value = sbits[i].val;
        opt.innerText = sbits[i].text;
        stopSelect.appendChild(opt);
    }

    var handSelect = document.getElementById("handshake");
    handSelect.innerHTML = "";
    var hands = ["None", "XON/XOFF", "RTS/CTS", "DTR/DSR"];
    for (var i = 0; i < hands.length; i++) {
        var opt = document.createElement("option");
        opt.value = i;
        opt.innerText = hands[i];
        handSelect.appendChild(opt);
    }

    var protoSelect = document.getElementById("protocol");
    protoSelect.innerHTML = "";
    var protoOpts = [{ v: 0, t: "Psion" }, { v: 1, t: "XMODEM" }, { v: 2, t: "None/Other" }];
    for (var i = 0; i < protoOpts.length; i++) {
        var opt = document.createElement("option");
        opt.value = protoOpts[i].v;
        opt.innerText = protoOpts[i].t;
        protoSelect.appendChild(opt);
    }


    // --- Load Data ---
    var payload = this.getPayload();

    var baudVal = 0, parityVal = 0, bitsVal = 0, stopVal = 0, handVal = 0, protoVal = 0;
    var widthVal = 0;
    var rtrnVal = 0, reolVal = 0, reofVal = 0;
    var ttrnVal = 0, teolVal = 0, teofVal = 0;

    if (payload && payload.length >= 15) {
        baudVal = payload[0];
        parityVal = payload[1];
        bitsVal = payload[2];
        stopVal = payload[3];
        handVal = payload[4];
        protoVal = payload[5];

        widthVal = payload[7]; // 0x07

        rtrnVal = payload[9];  // 0x09
        reolVal = payload[10]; // 0x0A
        reofVal = payload[11]; // 0x0B

        ttrnVal = payload[12]; // 0x0C
        teolVal = payload[13]; // 0x0D
        teofVal = payload[14]; // 0x0E
    }

    initialiseForm("filename", item.name, this);
    initialiseForm("deleted", item.deleted, this);

    initialiseForm("baudrate", baudVal, this);
    initialiseForm("parity", parityVal, this);
    initialiseForm("databits", bitsVal, this);
    initialiseForm("stopbits", stopVal, this);
    initialiseForm("handshake", handVal, this);
    initialiseForm("protocol", protoVal, this);

    // Advanced
    initialiseForm("width", widthVal, this);

    initialiseForm("rtrn", rtrnVal, this);
    initialiseForm("ttrn", ttrnVal, this);

    function toHex(v) {
        return ("00" + v.toString(16)).substr(-2).toUpperCase();
    }

    initialiseForm("reol", toHex(reolVal), this);
    initialiseForm("reof", toHex(reofVal), this);
    initialiseForm("teol", toHex(teolVal), this);
    initialiseForm("teof", toHex(teofVal), this);
}

CommsSetupEditor.prototype.getPayload = function () {
    if (this.item.child && this.item.child.child) {
        return this.item.child.child.data;
    }
    return null;
}

CommsSetupEditor.prototype.applyChanges = function () {
    // 1. Update Header (Name/Deleted)
    var headerChanged = false;
    var newname = document.getElementById("filename").value;
    var deleted = document.getElementById("deleted").checked;

    newname = (newname + "        ").substr(0, 8);
    // Update name in raw data
    for (var i = 0; i < 8; i++) {
        if (this.item.data[2 + i] !== newname.charCodeAt(i)) {
            this.item.data[2 + i] = newname.charCodeAt(i);
            headerChanged = true;
        }
    }
    var newType = 4 + (deleted ? 0 : 0x80); // Type 4
    if (this.item.data[1] !== newType) {
        this.item.data[1] = newType;
        headerChanged = true;
    }

    if (headerChanged) {
        this.item.setDescription();
    }

    // 2. Update Payload
    var payloadChanged = false;
    var payload = this.getPayload();
    if (payload) {
        var vals = [
            parseInt(document.getElementById("baudrate").value),
            parseInt(document.getElementById("parity").value),
            parseInt(document.getElementById("databits").value),
            parseInt(document.getElementById("stopbits").value),
            parseInt(document.getElementById("handshake").value),
            parseInt(document.getElementById("protocol").value)
        ];

        // Basic Fields
        for (var i = 0; i < 6; i++) { // Optimization: reusing variable names logic
            // .. logic handled below
        }
        // Correcting loop logic from previous manual write
        for (var i = 0; i < 6; i++) {
            if (payload[i] !== vals[i]) {
                payload[i] = vals[i];
                payloadChanged = true;
            }
        }

        // Advanced Fields
        // Width
        var widthVal = parseInt(document.getElementById("width").value) || 0;
        if (payload[7] !== widthVal) { payload[7] = widthVal; payloadChanged = true; }

        // Translations
        var rtrn = parseInt(document.getElementById("rtrn").value) || 0;
        if (payload[9] !== rtrn) { payload[9] = rtrn; payloadChanged = true; }

        var ttrn = parseInt(document.getElementById("ttrn").value) || 0;
        if (payload[12] !== ttrn) { payload[12] = ttrn; payloadChanged = true; }

        // EOL/EOF Helpers
        function parseHexByte(str) {
            var v = parseInt(str.trim(), 16);
            return isNaN(v) ? 0 : v;
        }

        var reol = parseHexByte(document.getElementById("reol").value);
        if (payload[10] !== reol) { payload[10] = reol; payloadChanged = true; }

        var reof = parseHexByte(document.getElementById("reof").value);
        if (payload[11] !== reof) { payload[11] = reof; payloadChanged = true; }

        var teol = parseHexByte(document.getElementById("teol").value);
        if (payload[13] !== teol) { payload[13] = teol; payloadChanged = true; }

        var teof = parseHexByte(document.getElementById("teof").value);
        if (payload[14] !== teof) { payload[14] = teof; payloadChanged = true; }
    }

    return FileEditor.prototype.applyChanges.call(this) | headerChanged | payloadChanged;
}

CommsSetupEditor.prototype.hasUnsavedChanges = function () {
    return false;
}
