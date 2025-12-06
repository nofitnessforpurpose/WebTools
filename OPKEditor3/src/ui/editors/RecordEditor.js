'use strict';

//------------- Record editor --------------------

function RecordEditor(editorelement, callback) {
    FileEditor.call(this, editorelement, callback, null);
}
RecordEditor.prototype = Object.create(FileEditor.prototype);
RecordEditor.prototype.acceptsType = function (tp) {
    return tp >= 16 && tp <= 126;
}
RecordEditor.prototype.initialise = function (item) {
    if (!this.myelement) {
        this.myelement = document.createElement('div');
        this.myelement.innerHTML =
            "<form action='#'><fieldset><legend>Record</legend>" +
            "<div>File id: <span id='fileid'></span></div>" +
            "<div><input type='checkbox' id='deleted'><label for='deleted'>Deleted</label></div>" +
            "<div>Size of record: <span id='recordsize'></span> bytes</div>" +
            "<div><textarea id='record' rows=20 cols=60></textarea></div>" +
            "</fieldset></form>";
    }
    this.editorelement.appendChild(this.myelement);

    // extract data from item and initialise form
    this.item = item;

    var ln = item.data[0];
    var s = "";
    for (var i = 0; i < ln; i++) {
        var c = item.data[2 + i];
        if (c == 9) s += "\n";
        else s += String.fromCharCode(c);
    }
    initialiseForm("record", s, this, this.updateSize);
    this.updateSize();
    initialiseForm("deleted", item.deleted, this);
    document.getElementById("fileid").innerHTML = "" + item.type - 0xf;
}
RecordEditor.prototype.updateSize = function () {
    document.getElementById("recordsize").innerHTML = "" + document.getElementById("record").value.length;
}
RecordEditor.prototype.getRecordData = function () {
    var oldln = this.item.data[0];

    var deleted = document.getElementById("deleted").checked;
    var txt = document.getElementById("record").value;
    txt = txt.substr(0, 254);
    if (txt.length == 0) txt = " ";
    var newln = txt.length;

    var newdata = new Uint8Array(newln + 2);
    newdata[0] = newln;
    newdata[1] = this.item.type + (deleted ? 0 : 0x80);
    for (var i = 0; i < newln; i++) {
        var c = txt.charCodeAt(i)
        newdata[2 + i] = c == 10 ? 9 : c;
    }
    return newdata;
}
RecordEditor.prototype.hasUnsavedChanges = function () {
    if (FileEditor.prototype.hasUnsavedChanges.call(this)) return true;
    var newdata = this.getRecordData();
    return !arraysAreEqual(newdata, this.item.data);
}
RecordEditor.prototype.applyChanges = function () {
    var newdata = this.getRecordData();
    var differ = !arraysAreEqual(newdata, this.item.data);
    if (differ) {
        this.item.setData(newdata);
        this.item.setDescription();
    }
    return FileEditor.prototype.applyChanges.call(this) | differ;
}
