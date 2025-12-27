'use strict';

//------------- Pager Setup file editor --------------------

function PagerSetupFileEditor(editorelement, callback) {
    BlockFileEditor.call(this, editorelement, callback, [6]);
}
PagerSetupFileEditor.prototype = Object.create(BlockFileEditor.prototype);
PagerSetupFileEditor.prototype.initialise = function (item) {
    var extraelement = null;
    if (!this.myelement) {
        var extraelement = document.createElement('div');
        extraelement.innerHTML =
            "<form action='#'><fieldset><legend>Pager Setup Data</legend>" +
            "<div>Size: <span id='pager-size'></span> bytes</div>" +
            "<div><textarea id='pager-data' rows=20 cols=60 readonly style='font-family: monospace;'></textarea></div>" +
            "<div style='margin-top:5px; font-size: 0.9em; color: gray;'>Pager setup decoding is not currently available. Data is shown in Hex/ASCII.</div>" +
            "</fieldset></form>";
    }
    BlockFileEditor.prototype.initialise.call(this, item, extraelement);

    // Extract data
    var chld = this.item.child.child;

    // Check block structure. Type 6 is a standard block file.
    // [0][1] = Header Length
    // [Header...]
    // [HeaderLen][HeaderLen+1] = Data Length
    // [Data...]

    var headerLen = (chld.data[0] << 8) | chld.data[1];
    var bodyLenOffset = headerLen + 2;
    var bodyLen = 0;
    var startData = 0;

    if (bodyLenOffset + 1 < chld.data.length) {
        bodyLen = (chld.data[bodyLenOffset] << 8) | chld.data[bodyLenOffset + 1];
        startData = bodyLenOffset + 2;
    }

    document.getElementById("pager-size").innerText = bodyLen;

    // Hex/ASCII Dump
    var s = "";
    var hex = "";
    var ascii = "";
    for (var i = 0; i < bodyLen; i++) {
        var b = chld.data[startData + i];
        hex += ("00" + b.toString(16)).substr(-2).toUpperCase() + " ";
        ascii += (b >= 32 && b < 127) ? String.fromCharCode(b) : ".";

        if ((i + 1) % 16 === 0 || i === bodyLen - 1) {
            s += hex.padEnd(48, " ") + " | " + ascii + "\n";
            hex = "";
            ascii = "";
        }
    }

    initialiseForm("pager-data", s, this);
}
