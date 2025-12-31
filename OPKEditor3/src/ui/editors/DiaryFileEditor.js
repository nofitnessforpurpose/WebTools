'use strict';

//------------- Diary file editor --------------------

function DiaryFileEditor(editorelement, callback) {
    BlockFileEditor.call(this, editorelement, callback, [2]);
}
DiaryFileEditor.prototype = Object.create(BlockFileEditor.prototype);
DiaryFileEditor.prototype.initialise = function (item) {
    var extraelement = null;
    if (!this.myelement) {
        var extraelement = document.createElement('div');
        extraelement.innerHTML =
            "<form action='#'><fieldset><legend>Diary Data</legend>" +
            "<div><textarea id='diary-data' rows=20 cols=60 readonly style='font-family: monospace;'></textarea></div>" +
            "<div style='margin-top:5px; font-size: 0.9em; color: gray;'>ReadOnly View. Data includes text entries.</div>" +
            "</fieldset></form>";
    }
    BlockFileEditor.prototype.initialise.call(this, item, extraelement);

    // Extract data
    var chld = this.item.child.child;

    // Check block structure. Type 2 is a standard block file.
    var headerLen = (chld.data[0] << 8) | chld.data[1];
    var bodyLenOffset = headerLen + 2;
    var bodyLen = 0;
    var startData = 0;

    if (bodyLenOffset + 1 < chld.data.length) {
        bodyLen = (chld.data[bodyLenOffset] << 8) | chld.data[bodyLenOffset + 1];
        startData = bodyLenOffset + 2;
    }

    // Decode Diary Entries
    // Format: [Len] [Text...] [Len] [Text...] ... [0]
    var s = "";
    var ptr = 0;
    while (ptr < bodyLen) {
        var entryLen = chld.data[startData + ptr];
        ptr++;
        if (entryLen === 0) break; // End of list

        var entryText = "";
        for (var i = 0; i < entryLen; i++) {
            if (ptr + i < bodyLen) {
                var c = chld.data[startData + ptr + i];
                entryText += (c >= 32 && c < 127) ? String.fromCharCode(c) : ".";
            }
        }
        s += entryText + "\n";
        ptr += entryLen;
    }

    initialiseForm("diary-data", s, this);
}
