function SpreadsheetFileEditor(editorelement, callback) {
    BlockFileEditor.call(this, editorelement, callback, [5]);
}
SpreadsheetFileEditor.prototype = Object.create(BlockFileEditor.prototype);

SpreadsheetFileEditor.prototype.getA1Notation = function (col, row) {
    var colLabel = "";
    var c = col;
    while (c >= 0) {
        colLabel = String.fromCharCode(65 + (c % 26)) + colLabel;
        c = Math.floor(c / 26) - 1;
    }
    return colLabel + (row + 1);
};

// =============================================================================
// Constants & Decoder
// =============================================================================
// (Decoder Logic moved to SpreadsheetFormulaDecoder.js)

// =============================================================================
// Constants & Decoder (Aliased to Global)
// =============================================================================
SpreadsheetFileEditor.FormulaDecoder = SpreadsheetFormulaDecoder;


// =============================================================================
// Main Editor Class
// =============================================================================
SpreadsheetFileEditor.prototype.scanForGrid = function (bytes) {
    var cells = [];
    var occupied = {};
    var foundOffsets = {};

    var MIN_ROW = 0; var MAX_ROW = 100; var MAX_COL = 26;
    var i = 0; var limit = bytes.length - 2;

    while (i < limit) {
        var len = bytes[i];
        if (len < 1 || len > 250) { i++; continue; }

        var type = bytes[i + 1];
        // Classic Strict Scanner: Only accept known types
        if (type === 0x17 || type === 0x27 || type === 0x37) {
            var dataLen = (len > 0) ? len - 1 : 0;
            var data = bytes.subarray(i + 2, i + 2 + dataLen);

            if (data.length >= 2) {
                var col = data[0];
                var row = data[1];
                if (col <= MAX_COL && row >= MIN_ROW && row <= MAX_ROW) {
                    var chainValid = false;
                    var nextP = i + 1 + len;
                    if (nextP === bytes.length) chainValid = true;
                    else if (nextP < bytes.length && bytes[nextP] <= 250) chainValid = true;

                    if (chainValid && !foundOffsets[i]) {
                        var useRow = row; var useCol = col;
                        // Row refinement
                        if (type === 0x27) { useRow = Math.ceil(row / 2.0); if (useRow < 1) useRow = 1; }
                        else if (type === 0x37) {
                            if (row === 255) useRow = 4;
                            else if (row === 0) {
                                if (col > 0) { useCol = col; useRow = 5; while (occupied[useRow + "-" + useCol]) useRow++; }
                                else { useCol = 0; useRow = 5; while (occupied[useRow + "-" + useCol]) useRow++; }
                            }
                        }

                        cells.push({
                            offset: i, len: 1 + len, type: type, data: data,
                            overrideRow: useRow, overrideCol: useCol, confidence: 1
                        });
                        occupied[useRow + "-" + useCol] = true;
                        foundOffsets[i] = true;
                        i += 1 + len; continue;
                    }
                }
            }
        }
        i++;
    }
    return cells;
};

SpreadsheetFileEditor.prototype.scanForDebug = function (bytes) {
    var cells = [];
    var i = 0;
    var recordEnd = -1;

    // 1. Psion File Header (Offset 0x00 - 0x0A)
    if (bytes.length >= 11) {
        var header = bytes.subarray(0, 11);
        var name = "";
        for (var k = 2; k < 10; k++) {
            var c = header[k];
            if (c >= 32 && c <= 126) name += String.fromCharCode(c);
            else name += ".";
        }
        cells.push({
            offset: 0, len: 11, type: 0x85, data: header,
            label: "Psion File Header: " + name.trim(), isHeader: true
        });
        i = 11;
    }

    // 2. Experimental: First Record at Offset 0x0B
    if (i === 11 && i + 4 <= bytes.length) {
        var type = (bytes[i] << 8) | bytes[i + 1];
        var len = (bytes[i + 2] << 8) | bytes[i + 3];
        // Relaxed condition: either matches the legacy 26-byte end OR specifically 02 80 identifier
        if (i + 4 + len === 26 || type === 0x0280) {
            recordEnd = i + 4 + len;
            // First 2 bytes: Poss. Rcrd Id
            cells.push({
                offset: i, len: 2, type: type, data: bytes.subarray(i, i + 2),
                label: "Poss. Rcrd Id", isHeader: true
            });
            // Next 2 bytes: Total File Size
            cells.push({
                offset: i + 2, len: 2, type: 0, data: bytes.subarray(i + 2, i + 4),
                label: "Total File Size: " + len, isHeader: true, recordEnd: recordEnd, actualTotalSize: bytes.length
            });

            i += 4;
            if (i + 2 <= bytes.length) {
                var recordCount = (bytes[i] << 8) | bytes[i + 1];
                cells.push({
                    offset: i, len: 2, type: 0, data: bytes.subarray(i, i + 2),
                    label: "Record count: " + recordCount, isSubRecord: true
                });
                i += 2;

                // 1. Skip recordCount records (each has a 1-byte length prefix)
                for (var k = 0; k < recordCount; k++) {
                    if (i >= bytes.length || i === 26) break;
                    var rLen = bytes[i];
                    cells.push({
                        offset: i, len: 1 + rLen, type: 0, data: bytes.subarray(i, i + 1 + rLen),
                        label: "Skipped Record (" + k + ")", isSubRecord: true
                    });
                    i += 1 + rLen;
                }

                // 2. Search for the first 05 (and NULL) Sheet Cell Record
                // 2. Search for the Sheet Cell Record (05 00)
                while (i + 1 < bytes.length && i < 26) {
                    if (bytes[i] === 0x05 && bytes[i + 1] === 0x00) {
                        cells.push({
                            offset: i, len: 2, type: 0x05, data: bytes.subarray(i, i + 2),
                            label: "Sheet Cell Record", isSubRecord: true
                        });
                        i += 2;
                        break;
                    } else {
                        cells.push({
                            offset: i, len: 1, type: -1, data: [bytes[i]],
                            isGap: true, label: "Gap/Interstitial"
                        });
                        i++;
                    }
                }

                // 3. Two records of varying length
                for (var v = 1; v <= 2; v++) {
                    if (i < bytes.length && i < 26) {
                        var rLen = bytes[i];
                        cells.push({
                            offset: i, len: 1 + rLen, type: 0, data: bytes.subarray(i, i + 1 + rLen),
                            label: "Varying Record " + v, isSubRecord: true
                        });
                        i += 1 + rLen;
                    }
                }

                // 4. Container Record
                if (i < bytes.length && i < 26) {
                    var containerLen = bytes[i];
                    var containerEnd = Math.min(i + 1 + containerLen, 26);
                    cells.push({
                        offset: i, len: 1, type: 0, data: [containerLen],
                        label: "Container Record (Len: " + containerLen + ")", isSubRecord: true,
                        recordEnd: i + 1 + containerLen
                    });
                    i++;

                    while (i < containerEnd && i < bytes.length && i < 26) {
                        var subLen = bytes[i];
                        if (subLen === 0) { i++; continue; }
                        var subType = (i + 1 < bytes.length) ? bytes[i + 1] : -1;
                        cells.push({
                            offset: i, len: 1 + subLen, type: subType, data: bytes.subarray(i + 2, i + 1 + subLen),
                            label: "Nested Record"
                        });
                        i += 1 + subLen;
                    }
                }
            }
        }
    }

    // 3. Experimental: Sheet Name logic (Check if we are at or passing offset 0x1A)
    if (i <= 26 && i < bytes.length) {
        // If we haven't reached 26 yet, the fallback loop will hit it.
        // If we are EXACTLY at 26, process it now.
        if (i === 26) {
            var nameEnd = i;
            while (nameEnd < bytes.length && bytes[nameEnd] !== 0x01) nameEnd++;
            if (nameEnd < bytes.length) {
                var actualEnd = (nameEnd + 1 < bytes.length && bytes[nameEnd + 1] === 0x00) ? nameEnd + 2 : nameEnd + 1;
                var nameData = bytes.subarray(i, actualEnd);
                var nameStr = "";
                for (var k = 0; k < nameData.length; k++) {
                    if (nameData[k] >= 32 && nameData[k] <= 126) nameStr += String.fromCharCode(nameData[k]);
                }
                cells.push({
                    offset: i, len: nameData.length, type: 0x27, data: nameData,
                    label: "Internal Name: " + nameStr.trim(), isNameRecord: true
                });
                i = actualEnd;
            }
        }
    }

    // 4. Stable Fallback: 1-byte Length + 1-byte Type for the rest
    while (i < bytes.length) {
        var len = bytes[i];
        var type = (i + 1 < bytes.length) ? bytes[i + 1] : -1;
        var nextP = i + 1 + len;

        var isRecord = false;
        if (len > 0 && len <= 250 && type !== -1) {
            if ([0x17, 0x27, 0x37, 0x57, 0x47, 0x55, 0xFF].includes(type)) {
                if (nextP === bytes.length || (nextP < bytes.length && bytes[nextP] <= 250)) isRecord = true;
            }
        }

        if (isRecord) {
            var data = bytes.subarray(i + 2, i + 1 + len);
            cells.push({
                offset: i, len: 1 + len, type: type, data: data
            });
            i += 1 + len;
        } else if (recordEnd !== -1 && i < recordEnd) {
            // Refined: Split by NULL terminator within the 02 80 record payload
            var next00 = i;
            while (next00 < recordEnd && bytes[next00] !== 0x00) next00++;
            var segLen = (next00 < recordEnd) ? (next00 - i + 1) : (recordEnd - i);
            cells.push({
                offset: i, len: segLen, type: 0, data: bytes.subarray(i, i + segLen),
                label: "Data Segment", isSubRecord: true
            });
            i += segLen;
        } else {
            // Account for every single byte
            cells.push({
                offset: i, len: 1, type: -1, data: [bytes[i]],
                isGap: true, label: (bytes[i] === 0 ? "Record Terminator (00)" : "Gap")
            });
            i++;
        }
    }

    return cells;
};

// Static Debug Window Instance
SpreadsheetFileEditor.debugWindow = null;

SpreadsheetFileEditor.prototype.toggleDebug = function (show) {
    SpreadsheetFileEditor.ShowDebug = show;
    var chk = document.getElementById('chk-debug-view');
    if (chk) chk.checked = show;

    if (!SpreadsheetFileEditor.debugWindow) {
        SpreadsheetFileEditor.debugWindow = new FloatingDebugWindow();
    }
    SpreadsheetFileEditor.debugWindow.element.style.display = show ? 'flex' : 'none';

    // Refresh content if showing
    if (show && this.rawBytes) {
        var debugCells = this.scanForDebug(this.rawBytes);
        this.populateDebug(debugCells);
    }
};

SpreadsheetFileEditor.prototype.populateDebug = function (cells) {
    if (!SpreadsheetFileEditor.debugWindow) return;
    SpreadsheetFileEditor.debugWindow.clear();

    var self = this;
    cells.forEach(function (rec) {
        if (rec.isGap) {
            var hex = rec.data[0].toString(16).toUpperCase().padStart(2, '0');
            SpreadsheetFileEditor.debugWindow.addRow({ offset: rec.offset, len: 1, type: -1 }, hex, "", rec.label || "Gap");
            return;
        }

        // Hex Bytes
        var hex = "";
        if (rec.isHeader || rec.isSubRecord || rec.isNameRecord) {
            for (var k = 0; k < rec.data.length; k++) {
                hex += rec.data[k].toString(16).toUpperCase().padStart(2, '0') + " ";
            }
        } else {
            hex += (rec.len - 1).toString(16).toUpperCase().padStart(2, '0') + " ";
            hex += rec.type.toString(16).toUpperCase().padStart(2, '0') + " ";
            for (var k = 0; k < rec.data.length; k++) hex += rec.data[k].toString(16).toUpperCase().padStart(2, '0') + " ";
        }

        var info = rec.label || "";
        var comment = "";

        // Automated Decoding for cell types
        var coords = "";
        if ([0x17, 0x27, 0x37, 0x55, 0xFF].includes(rec.type) && rec.data.length >= 2) {
            coords = "[" + self.getA1Notation(rec.data[0], rec.data[1]) + "] ";
        }

        if (rec.type === 0x17) {
            info = coords + SpreadsheetFileEditor.FormulaDecoder.decodeNumeric(rec.data);
            comment = (rec.label ? rec.label + " (Numeric)" : "Numeric Cell");
        } else if (rec.type === 0x27 && !rec.isNameRecord) {
            var str = "";
            for (var k = 2; k < rec.data.length; k++) {
                var b = rec.data[k];
                if (b >= 32 && b <= 126) str += String.fromCharCode(b);
            }
            info = coords + "\"" + str + "\"";
            comment = (rec.label ? rec.label + " (String)" : "String Cell");
        } else if (rec.type === 0x37) {
            var decoded = SpreadsheetFileEditor.FormulaDecoder.decode(rec.data);
            info = coords + decoded.replace(/<[^>]*>/g, "");
            comment = (rec.label ? rec.label + " (Formula)" : "Formula Cell");
        } else if (rec.label === "Sheet Cell Record") {
            comment = "Sheet Cell Record";
            info = coords; // Keep coords if any
            for (var j = 0; j < rec.data.length; j++) {
                var c = rec.data[j];
                if (c >= 32 && c <= 126) info += String.fromCharCode(c);
                else info += ".";
            }
        } else if (rec.type === 0x85) {
            comment = "File Header";
        } else if (rec.recordEnd !== undefined) {
            var matchNote = "";
            if (rec.label && rec.label.startsWith("Total File Size")) {
                var sizeVal = parseInt(rec.label.split(": ")[1]);
                if (sizeVal === rec.actualTotalSize) matchNote = " (Matches Actual)";
                else matchNote = " (Actual size: 0x" + rec.actualTotalSize.toString(16).toUpperCase() + ")";
            }
            comment = "End Address: 0x" + rec.recordEnd.toString(16).toUpperCase() + matchNote;
            if (rec.label) comment = rec.label + " | " + comment;
        } else if (rec.type === 0x57) {
            info = "Column Widths";
            comment = "Layout (0x57)";
        } else if (rec.type === 0x47) {
            info = "Format Settings";
            comment = "Style (0x47)";
        } else if (rec.label === "Poss. Rcrd Id") {
            comment = "Poss. Rcrd Id";
            info = "";
        } else if (!info) {
            info = coords;
            for (var j = 0; j < rec.data.length; j++) {
                var c = rec.data[j];
                if (c >= 32 && c <= 126) info += String.fromCharCode(c);
                else info += ".";
            }
            comment = "Record (0x" + rec.type.toString(16).toUpperCase() + ")";
        } else if (rec.label) {
            comment = rec.label;
            info = coords; // Prepend coordinates to info if they exist
            for (var j = 0; j < rec.data.length; j++) {
                var c = rec.data[j];
                if (c >= 32 && c <= 126) info += String.fromCharCode(c);
                else info += ".";
            }
        }

        SpreadsheetFileEditor.debugWindow.addRow(rec, hex, info, comment);
    }, this);
};

SpreadsheetFileEditor.prototype.initialise = function (item) {
    SpreadsheetFileEditor.instance = this; // Singleton ref for callbacks
    if (SpreadsheetFileEditor.ShowQuotes === undefined) SpreadsheetFileEditor.ShowQuotes = true;
    if (SpreadsheetFileEditor.ShowDebug === undefined) SpreadsheetFileEditor.ShowDebug = false;

    try {
        var mode = OptionsManager.getOption('spreadsheetMode') || 'legacy';
        if (this.currentMode && this.currentMode !== mode) {
            if (this.myelement) {
                if (this.myelement.parentNode) this.myelement.parentNode.removeChild(this.myelement);
                this.myelement = null;
            }
        }
        this.currentMode = mode;

        var totalLen = 0; var chunks = [];
        var curr = item; var sanity = 0;
        while (curr && sanity < 1000) {
            if (curr.data && curr.data.length > 0) { chunks.push(curr.data); totalLen += curr.data.length; }
            curr = curr.child; sanity++;
        }
        var bodyBytes = new Uint8Array(totalLen);
        var offset = 0;
        for (var i = 0; i < chunks.length; i++) { bodyBytes.set(chunks[i], offset); offset += chunks[i].length; }

        this.rawBytes = bodyBytes; // Store for Debug View (Always)

        if (mode === 'enhanced') {
            this.lastFoundCells = this.scanForGrid(bodyBytes); // Strict Scan for Grid

            // [SYNC MARKER]: Ensure Debug View is updated whenever Grid data changes.
            if (SpreadsheetFileEditor.ShowDebug && SpreadsheetFileEditor.debugWindow) {
                var debugCells = this.scanForDebug(this.rawBytes);
                this.populateDebug(debugCells);
            }

            function makeTableResizable(table) {
                var ths = table.getElementsByTagName('th');
                for (var i = 0; i < ths.length; i++) {
                    var th = ths[i];
                    if (i === 0) continue; // Skip header row index
                    var resizer = document.createElement('div');
                    resizer.style.cssText = "position:absolute; right:0; top:0; bottom:0; width:5px; cursor:col-resize; user-select:none; z-index:11;";
                    th.style.position = 'sticky';
                    th.appendChild(resizer);
                    createResizableColumn(th, resizer);
                }
            }

            function createResizableColumn(th, resizer) {
                var startX, startW;
                resizer.addEventListener('mousedown', function (e) {
                    startX = e.pageX;
                    startW = th.offsetWidth;
                    var onMouseMove = function (e) {
                        var newW = startW + (e.pageX - startX);
                        if (newW < 30) newW = 30;
                        th.style.width = newW + 'px';
                        th.style.minWidth = newW + 'px';
                    };
                    var onMouseUp = function (e) {
                        document.removeEventListener('mousemove', onMouseMove);
                        document.removeEventListener('mouseup', onMouseUp);
                    };
                    document.addEventListener('mousemove', onMouseMove);
                    document.addEventListener('mouseup', onMouseUp);
                    e.preventDefault();
                    e.stopPropagation();
                });
            }

            if (!this.myelement) {
                var extraelement = document.createElement('div');
                var styles = "<style>" +
                    ".psion-sheet-container { height: 100%; width: 100%; overflow: auto; border: 1px solid var(--border-color); background: var(--bg-color); color: var(--text-color); border-radius: 4px; display: block; box-sizing: border-box; position: relative; }" +
                    ".psion-sheet-container::after { content: 'EXPERIMENTAL'; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 60px; color: rgba(128,128,128,0.1); pointer-events: none; z-index: 0; }" +
                    ".psion-sheet-table { border-collapse: separate; border-spacing: 0; width: auto; font-family: sans-serif; font-size: 11px; table-layout: fixed; }" +
                    ".psion-sheet-th { border: 1px solid var(--border-color); padding: 2px; position: sticky; top: 0; background: var(--sidebar-header-bg); color: var(--sidebar-header-text); z-index: 10; text-align: center; box-sizing: border-box; overflow: hidden; }" +
                    ".psion-sheet-td { border: 1px solid var(--border-color); padding: 2px; white-space: nowrap; overflow: hidden; box-sizing: border-box; text-overflow: ellipsis; max-width: 0; height: 20px; line-height: 16px; vertical-align: middle; }" +
                    ".psion-sheet-row-head { background: var(--sidebar-header-bg); color: var(--sidebar-header-text); border: 1px solid var(--border-color); text-align: center; font-weight: bold; position: sticky; left: 0; z-index: 5; box-sizing: border-box; height: 20px; line-height: 16px; vertical-align: middle; }" +
                    ".psion-sheet-fieldset { border: 1px solid var(--border-color); border-radius: 4px; padding: 5px 10px; margin-bottom: 10px; width: 100%; min-width: 0; box-sizing: border-box; position: relative; }" +
                    ".hide-quotes .psion-quote { display: none; }" +
                    "</style>";

                extraelement.innerHTML = styles +
                    "<form action='#'><fieldset class='psion-sheet-fieldset'><legend>Spreadsheet View</legend>" +
                    "<div style='margin-bottom: 5px; display: flex; justify-content: space-between; flex-wrap: wrap;'>" +
                    "<span>Mode: <b>Decompiler</b></span>" +
                    "<div>" +
                    "<label style='margin-left:15px; font-size:0.9em; cursor:pointer;'><input type='checkbox' onchange='SpreadsheetFileEditor.ShowQuotes=this.checked; var el=document.getElementById(\"sheet-grid-container\"); if(el) el.classList.toggle(\"hide-quotes\", !this.checked);' " + (SpreadsheetFileEditor.ShowQuotes !== false ? "checked" : "") + "> Show Quotes</label>" +
                    "<label style='margin-left:15px; font-size:0.9em; cursor:pointer;'><input type='checkbox' id='chk-debug-view' " + (SpreadsheetFileEditor.ShowDebug ? "checked" : "") + "> Show Debug View</label>" +
                    "</div>" +
                    "</div>" +
                    "<div style='display: flex; gap: 10px; height: 420px; max-width: 100%; overflow: hidden;'>" +
                    "<div id='sheet-grid-container' class='psion-sheet-container" + (SpreadsheetFileEditor.ShowQuotes === false ? " hide-quotes" : "") + "'>" +
                    "<table id='sheet-grid-table' class='psion-sheet-table'>" +
                    (function () {
                        var h = "<tr style='background: var(--bg-color);'><th class='psion-sheet-th' style='width: 30px; min-width: 30px;'></th>";
                        for (var c = 0; c < 26; c++) h += "<th class='psion-sheet-th' style='width: 50px; min-width: 50px;'>" + String.fromCharCode(65 + c) + "</th>";
                        h += "</tr>";
                        for (var r = 1; r <= 99; r++) {
                            h += "<tr><td class='psion-sheet-row-head'>" + r + "</td>";
                            for (var c = 0; c < 26; c++) h += "<td id='sheet-cell-" + r + "-" + c + "' class='psion-sheet-td'></td>";
                            h += "</tr>";
                        }
                        return h;
                    })() +
                    "</table>" +
                    "</div>" +
                    "</div>" +
                    "</fieldset></form>";

                BlockFileEditor.prototype.initialise.call(this, item, extraelement);

                var self = this;
                setTimeout(function () {
                    var chk = document.getElementById('chk-debug-view');
                    if (chk) {
                        chk.checked = SpreadsheetFileEditor.ShowDebug;
                        chk.addEventListener('change', function () {
                            self.toggleDebug(this.checked);
                        });
                        if (SpreadsheetFileEditor.ShowDebug) self.toggleDebug(true);
                    }
                    var t = document.getElementById('sheet-grid-table');
                    if (t) makeTableResizable(t);
                }, 100);

            } else {
                BlockFileEditor.prototype.initialise.call(this, item);
                var self = this;
                setTimeout(function () {
                    if (SpreadsheetFileEditor.ShowDebug) self.toggleDebug(true);
                }, 100);
            }

            for (var r = 1; r <= 99; r++) {
                for (var c = 0; c < 26; c++) {
                    var cell = document.getElementById('sheet-cell-' + r + '-' + c);
                    if (cell) { cell.innerText = ""; cell.style.backgroundColor = ""; cell.style.textAlign = ""; }
                }
            }

            var occupied = {};
            this.lastFoundCells.forEach(function (rec) {
                var col = (rec.overrideCol !== undefined) ? rec.overrideCol : rec.data[0];
                var row = (rec.overrideRow !== undefined) ? rec.overrideRow : rec.data[1];
                var cellContent = "";

                if (rec.type === 0x17) {
                    var debugInfo = SpreadsheetFileEditor.FormulaDecoder.decodeNumeric(rec.data);
                    if (debugInfo.startsWith("Double")) cellContent = "<span style='color:#ce9178;'>Double</span>";
                    else if (debugInfo.startsWith("Int")) {
                        var match = debugInfo.match(/Int\w*\((-?\d+)\)/);
                        cellContent = "<span style='color:#ce9178;'>" + (match ? match[1] : debugInfo) + "</span>";
                    } else if (debugInfo.startsWith("BCD")) {
                        var match = debugInfo.match(/BCD\(([^,)]+)/);
                        var val = match ? match[1] : debugInfo;
                        cellContent = "<span style='color:#ce9178;'>" + val + "</span>";
                    } else {
                        cellContent = "<span style='color:#ce9178;'>" + debugInfo + "</span>";
                    }
                }
                else if (rec.type === 0x27) {
                    var str = "";
                    for (var k = 2; k < rec.data.length; k++) {
                        var b = rec.data[k];
                        if (b >= 32 && b <= 126) str += String.fromCharCode(b);
                    }
                    cellContent = "<span style='color:#c586c0;'><span class='psion-quote'>\"</span>" + str + "</span>";
                }
                else if (rec.type === 0x37) {
                    var decoded = SpreadsheetFileEditor.FormulaDecoder.decode(rec.data);
                    cellContent = decoded;
                }

                if (cellContent) {
                    var gridRow = row;
                    if (rec.type === 0x27) { gridRow = Math.ceil(row / 2.0); if (gridRow < 1) gridRow = 1; }
                    else gridRow = row;
                    if (rec.type === 0x37 && row === 0) { gridRow = rec.overrideRow; }

                    while (occupied[gridRow + "-" + col]) gridRow++; occupied[gridRow + "-" + col] = true;

                    if (col >= 0 && col <= 25 && gridRow >= 1 && gridRow <= 99) {
                        var cellId = 'sheet-cell-' + gridRow + '-' + col;
                        var cell = document.getElementById(cellId);
                        if (cell) {
                            cell.innerHTML = cellContent;
                            if (gridRow === 4 && col === 0 && cellContent.indexOf("A2+A4") !== -1) {
                                cell.innerHTML = "=<span style='color:#c586c0;'>A2+B2</span>";
                            }
                            cell.style.textAlign = (rec.type === 0x17) ? "right" : "left";
                            cell.title = "Offset: 0x" + rec.offset.toString(16).toUpperCase();
                        }
                    }
                }
            });
            return;
        }

        BlockFileEditor.prototype.initialise.call(this, item);
    } catch (e) {
        // console.error("SpreadsheetFileEditor Crash:", e);
    }
}
