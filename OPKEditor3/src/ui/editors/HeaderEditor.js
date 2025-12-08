'use strict';

//------------- Header editor --------------------

function HeaderEditor(editorelement, callback) {
    FileEditor.call(this, editorelement, callback, [-1]);
}
HeaderEditor.prototype = Object.create(FileEditor.prototype);
HeaderEditor.prototype.initialise = function (item) {
    if (!this.myelement) {
        this.myelement = document.createElement('div');
        this.myelement.innerHTML =
            "<form action='#'><fieldset><legend>Pack Header</legend>" +
            "<div><input type='checkbox' id='bit1'><label for='bit1'>EPROM</label></div>" +
            "<div><input type='checkbox' id='bit2'><label for='bit2'>Paged</label></div>" +
            "<div><input type='checkbox' id='bit3'><label for='bit3'>Write Protected</label></div>" +
            "<div><input type='checkbox' id='bit4'><label for='bit4'>Bootable</label></div>" +
            "<div><input type='checkbox' id='bit5'><label for='bit5'>Copy Protected</label></div>" +
            "<div><input type='checkbox' id='bit6'><label for='bit6'>Flashpack</label></div>" +
            "<div>Pack Size: <select id='packsize'>" +
            "<option>8K</option><option>16K</option><option>32K</option>" +
            "<option>64K</option><option>128K</option><option>256K</option>" +
            "<option>512K</option><option>1024K</option></select></div>" +
            "<div id='timesection'>" +
            "<fieldset><legend>Time Stamp</legend>" +
            "<div>Year: <select id='year'></select></div>" +
            "<div>Month: <select id='month'></select></div>" +
            "<div>Day: <select id='day'></select></div>" +
            "<div>Hour: <select id='hour'></select></div>" +
            "<div>Counter: <select id='counter1'></select><select id='counter2'></select></div>" +
            "</fieldset></div>" +
            "<div id='bootsection'>" +
            "<fieldset><legend>Boot data</legend>" +
            "<div>Code: <select id='code'></select></div>" +
            "<div>Id: <select id='bootid'></select></div>" +
            "<div>Version: <select id='version'></select></div>" +
            "<div>Priority: <select id='priority'></select></div>" +
            "<div>Address: <select id='address1'></select><select id='address2'></select></div>" +
            "</fieldset></div>" +
            "<div>Checksum: <span id='checksum'></span></div>" +
            "</fieldset></form>";
    }
    this.editorelement.appendChild(this.myelement);
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

    // extract data from item and initialise form
    this.item = item;
    var flags = item.data[0];
    initialiseForm("bit1", (flags & 0x02) != 0, this, function () { UpdateChecksum(this); });
    initialiseForm("bit2", (flags & 0x04) != 0, this, function () { UpdateChecksum(this); });
    initialiseForm("bit3", (flags & 0x08) == 0, this, function () { UpdateChecksum(this); });
    initialiseForm("bit4", (flags & 0x10) == 0, this, function () { FillInHeader(this); UpdateChecksum(this); });
    initialiseForm("bit5", (flags & 0x20) == 0, this, function () { UpdateChecksum(this); });
    initialiseForm("bit6", (flags & 0x40) == 0, this, function () { UpdateChecksum(this); });
    var sz = item.data[1];
    var i = -1;
    while (sz > 0) {
        i++;
        sz >>= 1;
    }
    initialiseForm("packsize", i, this, function () { UpdateChecksum(this); });
    FillInHeader(this);
    var cs = (item.data[8] << 8) + (item.data[9]);
    var checksum = document.getElementById("checksum");
    checksum.innerHTML = ("0000" + cs.toString(16)).substr(-4).toUpperCase();
}

function FillInHeader(editor) {
    var item = editor.item;
    var timesection = document.getElementById("timesection");
    var bootsection = document.getElementById("bootsection");
    var bootable = document.getElementById("bit4").checked;
    var wasBootable = (item.data[0] & 0x10) == 0;
    if (bootable) {
        bootsection.style.display = "block";
        timesection.style.display = "none";

        initialiseForm("code", wasBootable ? item.data[2] : 0x00, editor, function () { UpdateChecksum(this); });
        initialiseForm("bootid", wasBootable ? item.data[3] : 0x90, editor, function () { UpdateChecksum(this); });
        initialiseForm("version", wasBootable ? item.data[4] : 0x10, editor, function () { UpdateChecksum(this); });
        initialiseForm("priority", wasBootable ? item.data[5] : 0x90, editor, function () { UpdateChecksum(this); });
        initialiseForm("address1", wasBootable ? item.data[6] : 0x00, editor, function () { UpdateChecksum(this); });
        initialiseForm("address2", wasBootable ? item.data[7] : 0x19, editor, function () { UpdateChecksum(this); });
    } else {
        timesection.style.display = "block";
        bootsection.style.display = "none";
        var nw = new Date();
        initialiseForm("year", wasBootable ? nw.getFullYear() - 1900 : item.data[2], editor, function () { UpdateChecksum(this); });
        initialiseForm("month", wasBootable ? nw.getMonth() : item.data[3], editor, function () { UpdateChecksum(this); });
        initialiseForm("day", wasBootable ? nw.getDate() - 1 : item.data[4], editor, function () { UpdateChecksum(this); });
        initialiseForm("hour", wasBootable ? nw.getHours() : item.data[5], editor, function () { UpdateChecksum(this); });
        initialiseForm("counter1", wasBootable ? 0xff : item.data[6], editor, function () { UpdateChecksum(this); });
        initialiseForm("counter2", wasBootable ? 0xff : item.data[7], editor, function () { UpdateChecksum(this); });
    }
}

HeaderEditor.prototype.getHeaderData = function () {
    var newdata = new Uint8Array(10);
    for (var i = 0; i < 10; i++) newdata[i] = this.item.data[i];
    //console.log("old header: "+newdata);
    // update flags
    var flags = (newdata[0] & 0x81) | 0x78;
    if (document.getElementById("bit1").checked) flags |= 0x02;
    if (document.getElementById("bit2").checked) flags |= 0x04;
    if (document.getElementById("bit3").checked) flags &= 0xf7;
    if (document.getElementById("bit4").checked) flags &= 0xef;
    if (document.getElementById("bit5").checked) flags &= 0xdf;
    if (document.getElementById("bit6").checked) flags &= 0xbf;

    // update size
    var sz = document.getElementById("packsize").selectedIndex;
    sz = 1 << sz;
    newdata[1] = sz;

    var isBootable = (flags & 0x10) == 0;
    if (isBootable) {
        // update boot parameters
        newdata[2] = document.getElementById("code").value;
        newdata[3] = document.getElementById("bootid").value;
        newdata[4] = document.getElementById("version").value;
        newdata[5] = document.getElementById("priority").value;
        newdata[6] = document.getElementById("address1").value;
        newdata[7] = document.getElementById("address2").value;
    } else {
        // update date
        newdata[2] = document.getElementById("year").value - 1900;
        newdata[3] = document.getElementById("month").value - 1;
        newdata[4] = document.getElementById("day").value - 1;
        newdata[5] = document.getElementById("hour").value;
        newdata[6] = document.getElementById("counter1").value;
        newdata[7] = document.getElementById("counter2").value;
    }

    // set write protection flag properly
    newdata[0] = flags;

    // update checksum
    var sum1 = newdata[0] + newdata[2] + newdata[4] + newdata[6];
    var sum2 = newdata[1] + newdata[3] + newdata[5] + newdata[7];
    sum1 += (sum2 >> 8);
    newdata[8] = sum1 & 0xff;
    newdata[9] = sum2 & 0xff;

    //console.log("new header: "+newdata);

    return newdata;
}

function UpdateChecksum(editor) {
    var item = editor.item;
    var newdata = HeaderEditor.prototype.getHeaderData.call(editor);
    var cs = (newdata[8] << 8) + (newdata[9]);
    var checksum = document.getElementById("checksum");
    checksum.innerHTML = ("0000" + cs.toString(16)).substr(-4).toUpperCase();
}

HeaderEditor.prototype.hasUnsavedChanges = function () {
    if (FileEditor.prototype.hasUnsavedChanges.call(this)) return true;
    var newdata = this.getHeaderData();
    // Compare only the first 8 bytes (data/flags), ignoring checksum (bytes 8-9)
    // This prevents "unsaved changes" if the file's checksum differs from our calculation but no data was changed.
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
