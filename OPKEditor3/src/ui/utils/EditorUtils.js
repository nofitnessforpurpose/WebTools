'use strict';

function arraysAreEqual(arr1, arr2) {
    if (arr1 == arr2) return true;
    if (arr1.length != arr2.length) return false;
    for (var i = 0; i < arr1.length; i++) {
        if (arr1[i] != arr2[i]) return false;
    }
    return true;
}

function initialiseForm(id, val, self, handler) {
    var elemnt = document.getElementById(id);
    if (!elemnt) {
        console.warn("initialiseForm: Element not found:", id);
        return;
    }
    var evttp = "change";
    if (elemnt.nodeName.toLowerCase() == "select") {
        elemnt.selectedIndex = val;
        evttp = "change";
    } else if (elemnt.nodeName.toLowerCase() == "input" && elemnt.type.toLowerCase() == "checkbox") {
        elemnt.checked = val;
    } else {
        elemnt.value = val;
        evttp = "input";
    }
    elemnt.addEventListener(evttp, function () {
        if (handler) handler.call(self);
        self.callback.call(self, EditorMessage.CHANGEMADE);
    }, false);
}

function createOptions(id, low, high, hex) {
    var elmnt = document.getElementById(id);
    if (elmnt.children.length == high - low + 1) return;
    for (var v = low; v <= high; v++) {
        var opt = document.createElement('option');
        opt.value = v;
        opt.innerHTML = hex ? ("00" + v.toString(16)).substr(-2).toUpperCase() : "" + v;
        elmnt.appendChild(opt);
    }
}

// Helper to get icon class based on item type
function getItemIcon(item) {
    var style = OptionsManager.getOption('iconStyle') || 'solid';
    var prefix = (style === 'solid') ? 'fas' : 'far';

    var type = item.type;
    if (type === 1) return prefix + " fa-table"; // Data File
    if (type >= 0x90 && type < 0xff) return prefix + " fa-file-lines"; // Record
    if (type === 3) { // Procedure (Can be Text or Compiled)
        // Check for QCode Structure (Type 80 Child -> Payload)
        // Note: item.child is the Type 0 (0x80) Data Block.
        if (item.child && item.child.child && item.child.child.data) {
            var data = item.child.child.data;
            if (data.length >= 4) {
                var obLen = (data[0] << 8) | data[1];
                if (obLen > 0) return prefix + " fa-microchip"; // Proven QCode -> Procedure
            }
        }
        // Fallback: No QCode -> OPL Text
        return "fa-regular fa-file-code";
    }
    if (type === 2) return prefix + " fa-book"; // Diary (XP/CM)
    if (type === 5) return prefix + " fa-table-cells"; // Spreadsheet
    if (type === 6) return prefix + " fa-phone"; // Pager Setup
    if (type === 7) return prefix + " fa-note-sticky"; // Notepad
    if (type === -1) return prefix + " fa-receipt"; // Pack Header
    if (type === 255) return prefix + " fa-rectangle-xmark"; // End Of Pack
    return prefix + " fa-circle-question"; // Default / Unknown
}

// Helper to get item description
function getItemDescription(item) {
    var type = item.type;
    if (type === 1) return "Data File";
    if (type >= 16 && type <= 126) return "Record " + String.fromCharCode(64 + (type - 15));

    if (type === 2) return "OPL Image";
    if (type === 3) {
        // Check for QCode
        if (item.child && item.child.child && item.child.child.data) {
            var data = item.child.child.data;
            if (data.length >= 4) {
                var obLen = (data[0] << 8) | data[1];
                if (obLen > 0) return "OPL Procedure";
            }
        }
        return "OPL Text"; // No QCode -> Text
    }
    if (type === 4) return "Comms Link Setup";
    if (type === 5) return "Spreadsheet";
    if (type === 6) return "Pager Setup";
    if (type === 7) return "LZ Notepad Entry";
    if (type === 0) return "Long Record";
    if (type === -1) return "Pack Header";
    if (type === 255) return "End Of Pack";
    return "Unknown Type (" + type + ")";
}

// Helper to generate tooltip content for a pack
function generatePackTooltip(pack) {
    var size = pack.getLength();
    var sizeStr = size + " bytes";
    if (size > 1024) sizeStr = (size / 1024).toFixed(2) + " KB";

    var fileCount = 0;
    for (var i = 0; i < pack.items.length; i++) {
        if (pack.items[i].type > 0 && !pack.items[i].deleted) fileCount++;
    }

    var html = "<h4>" + (pack.filename ? pack.filename : "Untitled") + "</h4>";
    html += "<div class='tooltip-row'><span class='tooltip-label'>Size:</span><span class='tooltip-value'>" + sizeStr + "</span></div>";
    html += "<div class='tooltip-row'><span class='tooltip-label'>Files:</span><span class='tooltip-value'>" + fileCount + "</span></div>";
    if (pack.checksums) {
        html += "<div class='tooltip-row'><span class='tooltip-label'>Sum:</span><span class='tooltip-value'>0x" + pack.checksums.sum.toString(16).toUpperCase().padStart(8, '0') + "</span></div>";
        html += "<div class='tooltip-row'><span class='tooltip-label'>CRC32:</span><span class='tooltip-value'>0x" + pack.checksums.crc32.toString(16).toUpperCase() + "</span></div>";
    }
    return html;
}
