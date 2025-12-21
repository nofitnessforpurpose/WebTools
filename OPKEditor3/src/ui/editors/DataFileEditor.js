'use strict';

//------------- Data file editor --------------------

function DataFileEditor(editorelement, callback) {
    FileEditor.call(this, editorelement, callback, [1]);
}
DataFileEditor.prototype = Object.create(FileEditor.prototype);
DataFileEditor.prototype.initialise = function (item) {
    if (!this.myelement) {
        var newelement = document.createElement('div');
        newelement.className = 'legacy-editor-container';
        newelement.innerHTML =
            "<form action='#'><fieldset><legend>Data File Header</legend>" +
            "<div>File name: <input type='text' id='filename'></div>" +
            "<div>File id: <select id='fileid'></select></div>" +
            "<div><input type='checkbox' id='deleted'><label for='deleted'>Deleted</label></div>" +
            "</fieldset></form>";
        this.myelement = newelement;
    }
    this.editorelement.appendChild(this.myelement);

    this.item = item;

    // construct list of unused file ids
    var usedidlist = this.callback(EditorMessage.GETFILEIDS);
    var unusedidlist = [];
    for (var i = 1; i < 0x6f; i++) {
        if (!usedidlist[i])
            unusedidlist[unusedidlist.length] = i;
    }
    unusedidlist.splice(0, 0, item.data[10] - 0x8f);

    // extract data from item and initialise form
    var fileid = document.getElementById("fileid");
    // populate id list
    while (fileid.firstChild) {
        fileid.removeChild(fileid.firstChild);
    }
    for (var i = 0; i < unusedidlist.length; i++) {
        var opt = document.createElement("option");
        opt.value = unusedidlist[i];
        opt.innerHTML = unusedidlist[i];
        fileid.appendChild(opt);
    }

    initialiseForm("fileid", 0, this);
    initialiseForm("filename", item.name, this);
    initialiseForm("deleted", item.deleted, this);
}
DataFileEditor.prototype.getDataFileHeaderData = function () {
    var newdata = new Uint8Array(11);
    var newname = document.getElementById("filename").value;
    var deleted = document.getElementById("deleted").checked;
    var fileid = document.getElementById("fileid").value;
    fileid = Number.parseInt(fileid, 10);
    newname = (newname + "        ").substr(0, 8);
    newdata[0] = 9;
    newdata[1] = this.item.type + (deleted ? 0 : 0x80);
    for (var i = 0; i < 8; i++) {
        newdata[2 + i] = newname.charCodeAt(i);
    }
    newdata[10] = fileid + 0x8f;
    return newdata;
}
DataFileEditor.prototype.hasUnsavedChanges = function () {
    if (FileEditor.prototype.hasUnsavedChanges.call(this)) return true;
    var newdata = this.getDataFileHeaderData();
    return !arraysAreEqual(newdata, this.item.data);
}
DataFileEditor.prototype.applyChanges = function () {
    var newdata = this.getDataFileHeaderData();
    var differ = !arraysAreEqual(newdata, this.item.data);
    if (differ) {
        if (newdata[10] != this.item.data[10]) {
            this.callback(EditorMessage.CHANGEFILEID, this.item.data[10], newdata[10]);
        }
        if (newdata[1] != this.item.data[1]) {
            this.callback(EditorMessage.DELETERECORDS, newdata[10], (newdata[1] & 0x80) == 0);
        }
        this.item.setData(newdata);
        this.item.setDescription();
    }
    return FileEditor.prototype.applyChanges.call(this) | differ;
}
