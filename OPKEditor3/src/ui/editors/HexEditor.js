'use strict';

//------------- Hex Viewer Editor --------------------

function HexEditor(editorelement, callback, types) {
    FileEditor.call(this, editorelement, callback, types);
}

HexEditor.prototype = Object.create(FileEditor.prototype);

HexEditor.prototype.initialise = function (item) {
    if (!this.myelement) {
        this.myelement = document.createElement('div');
        this.myelement.className = 'hex-editor';
        this.myelement.style.fontFamily = "'Consolas', 'Courier New', monospace";
        this.myelement.style.fontSize = "14px";
        this.myelement.style.padding = "10px";
        this.myelement.style.overflow = "auto";
        this.myelement.style.height = "100%";
        this.myelement.style.backgroundColor = "var(--editor-bg)";
        this.myelement.style.color = "var(--text-color)";
    }
    this.editorelement.appendChild(this.myelement);
    this.item = item;
    this.renderHexView();
};

HexEditor.prototype.renderHexView = function () {
    if (!this.item || !this.item.data) {
        this.myelement.innerHTML = "No data available.";
        return;
    }

    var data = this.item.data;
    // Use auto width to prevent columns from expanding beyond content + padding
    var html = '<table style="border-collapse: collapse;">';
    html += '<tr><th style="text-align: left; padding-right: 2ch; border-bottom: 1px solid var(--border-color);">Offset</th><th style="text-align: left; padding-right: 2ch; border-bottom: 1px solid var(--border-color);">Hex</th><th style="text-align: left; border-bottom: 1px solid var(--border-color);">ASCII</th></tr>';

    var bytesPerRow = OptionsManager.getOption('hexBytesPerRow') || 8;

    for (var i = 0; i < data.length; i += bytesPerRow) {
        var offset = ("00000000" + i.toString(16)).substr(-8).toUpperCase();
        var hex = "";
        var ascii = "";

        for (var j = 0; j < bytesPerRow; j++) {
            if (i + j < data.length) {
                var byte = data[i + j];
                hex += ("00" + byte.toString(16)).substr(-2).toUpperCase();
                ascii += (byte >= 32 && byte <= 126) ? String.fromCharCode(byte) : ".";
            } else {
                hex += '<span class="hex-unused">XX</span>';
                ascii += '<span class="hex-unused">.</span>';
            }
            // Add space between bytes, but not after the last one
            if (j < bytesPerRow - 1) {
                hex += " ";
                ascii += " ";
            }
        }

        html += '<tr>';
        html += '<td style="color: var(--editor-gutter-text); padding-right: 2ch;">' + offset + '</td>';
        html += '<td style="padding-right: 2ch;">' + hex + '</td>';
        html += '<td>' + ascii + '</td>';
        html += '</tr>';
    }

    html += '</table>';
    this.myelement.innerHTML = html;
};
