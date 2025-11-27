'use strict';
var EditorMessage = {
   CHANGEMADE: 1,
   GETFILEIDS: 2,
   CHANGEFILEID: 3,
   DELETERECORDS: 4,
}

function FileEditor(editorelement, callback, types, codeEditorContainer) {
   this.callback = callback;  // called when changes are to be saved
   this.types = types;
   this.editorelement = editorelement;
   this.codeEditorContainer = codeEditorContainer;
}
FileEditor.prototype = {
   acceptsType: function (tp) {
      return this.types.indexOf(tp) >= 0;
   },

   // create ui for this item inside the given dom element
   initialise: function (item, extraelement) {
   },

   // remove editor from webpage, discard unsaved changes
   finish: function () {
      if (this.myelement) this.editorelement.removeChild(this.myelement);
   },

   // Returns true if the current input will actually change the underlying pack item
   hasUnsavedChanges: function () { return false; },

   // Stores the current input into the underlying pack item.
   // Returns true if the item has actually changed.
   applyChanges: function () { return false; },
}




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
   initialiseForm("bit3", (flags & 0x40) == 0 ? (item.data[8] & 0x80) == 0 : (flags & 0x08) == 0, this, function () { UpdateChecksum(this); });
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
   var writeChecksumBit = -1;
   if ((flags & 0x40) == 0) {
      // on flashpack, write protection is in different bit
      writeChecksumBit = (flags & 0x08) ? 1 : 0;
      flags &= 0xf7;
   }
   newdata[0] = flags;

   // update checksum
   var sum1 = newdata[0] + newdata[2] + newdata[4] + newdata[6];
   var sum2 = newdata[1] + newdata[3] + newdata[5] + newdata[7];
   sum1 += (sum2 >> 8);
   newdata[8] = sum1 & 0xff;
   newdata[9] = sum2 & 0xff;

   if (writeChecksumBit == 0) newdata[8] &= 0x7f;
   else if (writeChecksumBit == 1) newdata[8] |= 0x80;

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
   return !arraysAreEqual(newdata, this.item.data);
}
HeaderEditor.prototype.applyChanges = function () {
   var newdata = this.getHeaderData();
   var differ = !arraysAreEqual(newdata, this.item.data);
   if (differ) this.item.setData(newdata);
   return FileEditor.prototype.applyChanges.call(this) | differ;
}


//------------- Headerless File editor --------------------

function HeaderlessFileEditor(editorelement, callback) {
   FileEditor.call(this, editorelement, callback, [0]);
}
HeaderlessFileEditor.prototype = Object.create(FileEditor.prototype);
HeaderlessFileEditor.prototype.initialise = function (item) {
   if (!this.myelement) {
      this.myelement = document.createElement('div');
      this.myelement.innerHTML =
         "<form action='#'><fieldset><legend>Headerlesss Block</legend>" +
         "<div>Block length: <span id='blocklength'></span></div>" +
         "</fieldset></form>";
   }
   this.editorelement.appendChild(this.myelement);

   // extract data from item and initialise form
   this.item = item;
   var ln = (item.data[2] << 8) + (item.data[3]);
   var elmnt = document.getElementById("blocklength");
   elmnt.innerHTML = ("0000" + ln.toString(16)).substr(-4).toUpperCase();
}


//------------- Block file editor --------------------

function BlockFileEditor(editorelement, callback, types, codeEditorContainer) {
   FileEditor.call(this, editorelement, callback, types, codeEditorContainer);
}
BlockFileEditor.prototype = Object.create(FileEditor.prototype);
BlockFileEditor.prototype.initialise = function (item, extraelement) {
   if (!this.myelement) {
      var newelement = document.createElement('div');
      newelement.innerHTML =
         "<form action='#'><fieldset><legend>Header</legend>" +
         "<div>File name: <input type='text' id='filename'></div>" +
         "<div><input type='checkbox' id='deleted'><label for='deleted'>Deleted</label></div>" +
         "</fieldset></form>";
      if (extraelement) {
         var el = document.createElement('div');
         el.appendChild(newelement);
         el.appendChild(extraelement);
         this.myelement = el;
      } else {
         this.myelement = newelement;
      }
   }
   this.editorelement.appendChild(this.myelement);

   // extract data from item and initialise form
   this.item = item;
   initialiseForm("filename", item.name, this);
   initialiseForm("deleted", item.deleted, this);
}
BlockFileEditor.prototype.getBlockHeaderData = function () {
   var newdata = new Uint8Array(11);
   var newname = document.getElementById("filename").value;
   var deleted = document.getElementById("deleted").checked;
   newname = (newname + "        ").substr(0, 8);
   newdata[0] = 9;
   newdata[1] = this.item.type + (deleted ? 0 : 0x80);
   for (var i = 0; i < 8; i++) {
      newdata[2 + i] = newname.charCodeAt(i);
   }
   newdata[10] = this.item.data[10];
   return newdata;
}
BlockFileEditor.prototype.hasUnsavedChanges = function () {
   if (FileEditor.prototype.hasUnsavedChanges.call(this)) return true;
   var newdata = this.getBlockHeaderData();
   return !arraysAreEqual(newdata, this.item.data);
}
BlockFileEditor.prototype.applyChanges = function () {
   var newdata = this.getBlockHeaderData();
   var differ = !arraysAreEqual(newdata, this.item.data);
   if (differ) {
      this.item.setData(newdata);
      this.item.setDescription();
   }
   return FileEditor.prototype.applyChanges.call(this) | differ;
}



//------------- Data file editor --------------------

function DataFileEditor(editorelement, callback) {
   FileEditor.call(this, editorelement, callback, [1]);
}
DataFileEditor.prototype = Object.create(FileEditor.prototype);
DataFileEditor.prototype.initialise = function (item) {
   if (!this.myelement) {
      var newelement = document.createElement('div');
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



//------------- Procedure file editor --------------------

function ProcedureFileEditor(editorelement, codeEditorContainer, callback) {
   BlockFileEditor.call(this, editorelement, callback, [3], codeEditorContainer);
}
ProcedureFileEditor.prototype = Object.create(BlockFileEditor.prototype);
ProcedureFileEditor.prototype.initialise = function (item) {
   var extraelement = null;
   // We still create the legacy element for metadata display
   if (!this.myelement) {
      // create procedure-specific editor
      var extraelement = document.createElement('div');
      extraelement.innerHTML =
         "<form action='#'><fieldset><legend>Procedure</legend>" +
         "<div>Size of Object Code: <span id='objectcode'></span> bytes</div>" +
         "<div>Note: Editing source code here will not change the object code</div>" +
         "<div class='opl-editor-container' id='opl-legacy-container'>" +
         "<textarea id='sourcecode' class='opl-source-input' rows=20 cols=60 spellcheck='false'></textarea>" +
         "<div id='highlightedcode' class='opl-code-view' aria-hidden='true'></div>" +
         "</div>" +
         "</fieldset></form>";
   }
   BlockFileEditor.prototype.initialise.call(this, item, extraelement);

   // extract data from item and initialise form
   var chld = this.item.child.child;
   var lncode = chld.data[0] * 256 + chld.data[1];
   document.getElementById("objectcode").innerHTML = "" + lncode;
   var lnsrc = chld.data[lncode + 2] * 256 + chld.data[lncode + 3];
   var s = "";
   for (var i = 0; i < lnsrc; i++) {
      var c = chld.data[lncode + 4 + i];
      if (c == 0) s += "\n";
      else s += String.fromCharCode(c);
   }

   // Custom Code Editor Integration
   if (this.codeEditorContainer) {
      // Hide legacy textarea container
      var legacyContainer = document.getElementById('opl-legacy-container');
      if (legacyContainer) legacyContainer.style.display = 'none';

      // Show CodeEditor container
      this.codeEditorContainer.style.display = 'flex';

      // Initialize CodeEditor if not already
      if (!this.codeEditorInstance) {
         this.codeEditorInstance = new CodeEditor(this.codeEditorContainer, {
            value: s,
            language: 'opl',
            readOnly: false,
            lineNumbers: OptionsManager.getOption('showLineNumbers'),
            folding: OptionsManager.getOption('codeFolding'),
            minimap: { enabled: false },
            theme: ThemeManager.currentTheme
         });

         var self = this;
         this.codeEditorInstance.onChange = function () {
            self.callback(EditorMessage.CHANGEMADE);
         };
      } else {
         this.codeEditorInstance.setValue(s);
      }

      initialiseForm("sourcecode", s, this);

   } else {
      // Fallback to legacy
      if (this.codeEditorContainer) this.codeEditorContainer.style.display = 'none';
      var legacyContainer = document.getElementById('opl-legacy-container');
      if (legacyContainer) legacyContainer.style.display = 'block';

      initialiseForm("sourcecode", s, this);

      // Reset highlight state (Legacy)
      var hl = document.getElementById("highlightedcode");
      var sc = document.getElementById("sourcecode");
      if (hl && sc) {
         hl.innerHTML = SyntaxHighlighter.highlight(sc.value);
         sc.oninput = function () {
            hl.innerHTML = SyntaxHighlighter.highlight(this.value);
            hl.scrollTop = this.scrollTop;
            hl.scrollLeft = this.scrollLeft;
         };
         sc.onscroll = function () {
            hl.scrollTop = this.scrollTop;
            hl.scrollLeft = this.scrollLeft;
         };
         hl.style.display = "none";
         sc.classList.remove("transparent-text");
      }
   }
}

ProcedureFileEditor.prototype.toggleHighlight = function () {
   if (this.codeEditorContainer && this.codeEditorInstance) return false;

   var sc = document.getElementById("sourcecode");
   var hl = document.getElementById("highlightedcode");

   if (hl.style.display === "none") {
      hl.innerHTML = SyntaxHighlighter.highlight(sc.value);
      hl.style.display = "block";
      sc.classList.add("transparent-text");
      hl.scrollTop = sc.scrollTop;
      hl.scrollLeft = sc.scrollLeft;
      return true;
   } else {
      hl.style.display = "none";
      sc.classList.remove("transparent-text");
      return false;
   }
}
ProcedureFileEditor.prototype.getProcedureData = function () {
   var chld = this.item.child.child;
   var lncode = chld.data[0] * 256 + chld.data[1];
   var oldlnsrc = chld.data[lncode + 2] * 256 + chld.data[lncode + 3];

   var txt;
   if (this.codeEditorInstance && this.codeEditorContainer && this.codeEditorContainer.style.display !== 'none') {
      txt = this.codeEditorInstance.getValue();
   } else {
      txt = document.getElementById("sourcecode").value;
   }
   var newlnsrc = txt.length;

   var newdata = new Uint8Array(chld.data.length + newlnsrc - oldlnsrc);
   for (var i = 0; i < lncode + 2; i++) {
      newdata[i] = chld.data[i];
   }
   newdata[lncode + 2] = newlnsrc >> 8;
   newdata[lncode + 3] = newlnsrc & 0xff;
   for (var i = 0; i < newlnsrc; i++) {
      var c = txt.charCodeAt(i)
      newdata[lncode + 4 + i] = c == 10 ? 0 : c;
   }
   return newdata;
}
ProcedureFileEditor.prototype.hasUnsavedChanges = function () {
   if (BlockFileEditor.prototype.hasUnsavedChanges.call(this)) return true;

   var chld = this.item.child.child;
   var newdata = this.getProcedureData();
   return !arraysAreEqual(newdata, chld.data);
}
ProcedureFileEditor.prototype.applyChanges = function () {
   var chld = this.item.child.child;
   var newdata = this.getProcedureData();
   var differ = !arraysAreEqual(newdata, chld.data);
   if (differ) {
      chld.setData(newdata);
      chld = this.item.child;
      var ln = newdata.length;
      chld.data[2] = (ln >> 8) & 0xff;
      chld.data[3] = ln & 0xff;
   }
   return BlockFileEditor.prototype.applyChanges.call(this) | differ;
}


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

//------------- Procedure file editor --------------------

function NotePadFileEditor(editorelement, codeEditorContainer, callback) {
   BlockFileEditor.call(this, editorelement, callback, [7], codeEditorContainer);
}
NotePadFileEditor.prototype = Object.create(BlockFileEditor.prototype);
NotePadFileEditor.prototype.initialise = function (item) {
   var extraelement = null;
   if (!this.myelement) {
      // create procedure-specific editor
      var extraelement = document.createElement('div');
      extraelement.innerHTML =
         "<form action='#'><fieldset><legend>Notepad</legend>" +
         "<div>Password: <input type='text' id='password'></div>" +
         "<div><input type='checkbox' id='numbered'><label for='numbered'>Numbered</label></div>" +
         "<div><textarea id='notepad' rows=20 cols=60></textarea></div>" +
         "</fieldset></form>";
   }
   BlockFileEditor.prototype.initialise.call(this, item, extraelement);

   // extract data from item and initialise form
   var chld = this.item.child.child;
   var lnheader = chld.data[0] * 256 + chld.data[1];
   var lnnotes = chld.data[lnheader + 2] * 256 + chld.data[lnheader + 3];

   initialiseForm("numbered", (chld.data[2] & 0x80) != 0, this);
   var self = this;
   var pwelemnt = document.getElementById("password");
   pwelemnt.value = "";
   pwelemnt.addEventListener('input', function () { handlePasswordChange.call(self); }, false);

   if (chld.data[3] == 0) {   // Not encrypted
      var s = "";
      for (var i = 0; i < lnnotes; i++) {
         var c = chld.data[lnheader + 4 + i];
         if (c == 0) s += "\n";
         else s += String.fromCharCode(c);
      }
      document.getElementById("notepad").disabled = false;
      initialiseForm("notepad", s, this);
   } else {
      document.getElementById("notepad").disabled = true;
      initialiseForm("notepad", "Encrypted Notepad", this);
   }

   // Custom Code Editor Integration
   if (this.codeEditorContainer) {
      // Hide legacy textarea container
      var legacyTextarea = document.getElementById('notepad');
      if (legacyTextarea) legacyTextarea.style.display = 'none';

      // Show CodeEditor container
      this.codeEditorContainer.style.display = 'flex';

      var content = (chld.data[3] == 0) ? s : "Encrypted Notepad";
      var isReadOnly = (chld.data[3] != 0);

      // Initialize CodeEditor if not already
      if (!this.codeEditorInstance) {
         this.codeEditorInstance = new CodeEditor(this.codeEditorContainer, {
            value: content,
            language: 'text',
            readOnly: isReadOnly,
            lineNumbers: OptionsManager.getOption('showLineNumbers'),
            folding: false,
            minimap: { enabled: false },
            theme: ThemeManager.currentTheme
         });

         var self = this;
         this.codeEditorInstance.onChange = function () {
            self.callback(EditorMessage.CHANGEMADE);
         };
      } else {
         this.codeEditorInstance.setValue(content);
         this.codeEditorInstance.setReadOnly(isReadOnly);
      }
   } else {
      // Fallback
      if (this.codeEditorContainer) this.codeEditorContainer.style.display = 'none';
      var legacyTextarea = document.getElementById('notepad');
      if (legacyTextarea) legacyTextarea.style.display = 'block';
   }
}
NotePadFileEditor.prototype.getNotepadData = function () {
   var chld = this.item.child.child;
   var oldlnheader = chld.data[0] * 256 + chld.data[1];
   var oldlnnotes = chld.data[oldlnheader + 2] * 256 + chld.data[oldlnheader + 3];

   var password = document.getElementById("password").value;
   var textarea = document.getElementById("notepad");
   var txt;
   if (this.codeEditorInstance && this.codeEditorContainer && this.codeEditorContainer.style.display !== 'none') {
      txt = this.codeEditorInstance.getValue();
   } else {
      txt = textarea.value;
   }

   // calculate length of data
   var newlnheader = oldlnheader;
   var newlnnotes = oldlnnotes;
   if (!textarea.disabled) {
      if (password != "") newlnheader = 11;
      newlnnotes = txt.length;
   }
   var newdata = new Uint8Array(2 + newlnheader + 2 + newlnnotes);

   // write header
   var nmbd = document.getElementById("numbered").checked;
   newdata[0] = 0;
   newdata[1] = newlnheader;
   newdata[2] = (chld.data[2] & 0x7f) + (nmbd ? 0x80 : 0);
   if (textarea.disabled) {
      // copy rest of header
      for (var i = 1; i < oldlnheader; i++) {
         newdata[2 + i] = chld.data[2 + i];
      }
   } else if (password != "") {
      newdata[3] = 9;
      var passkey = calcNotepadKey(password, true);
      for (var i = 0; i < 9; i++) {
         newdata[4 + i] = passkey[i];
      }
   } else {
      newdata[3] = 0;
   }

   newdata[2 + newlnheader] = (newlnnotes >> 8) & 0xff;
   newdata[3 + newlnheader] = newlnnotes & 0xff;
   if (textarea.disabled) {
      // copy encrypted data
      for (var i = 0; i < newlnnotes; i++) {
         newdata[4 + newlnheader + i] = chld.data[4 + oldlnheader + i];
      }
   } else if (password != "") {
      // store encrypted text
      var passkey = calcNotepadKey(password, false);
      var msg = encodeMessage(passkey, txt);
      for (var i = 0; i < newlnnotes; i++) {
         newdata[4 + newlnheader + i] = msg[i];
      }
   } else {
      // store plain text
      for (var i = 0; i < newlnnotes; i++) {
         var c = txt.charCodeAt(i)
         newdata[4 + newlnheader + i] = c == 10 ? 0 : c;
      }
   }
   return newdata;
}
NotePadFileEditor.prototype.hasUnsavedChanges = function () {
   if (BlockFileEditor.prototype.hasUnsavedChanges.call(this)) return true;

   var chld = this.item.child.child;
   var newdata = this.getNotepadData();
   return !arraysAreEqual(newdata, chld.data);
}
NotePadFileEditor.prototype.applyChanges = function () {
   var chld = this.item.child.child;
   var newdata = this.getNotepadData();
   var differ = !arraysAreEqual(newdata, chld.data);
   if (differ) {
      chld.setData(newdata);
      chld = this.item.child;
      var ln = newdata.length;
      chld.data[2] = (ln >> 8) & 0xff;
      chld.data[3] = ln & 0xff;
   }
   return BlockFileEditor.prototype.applyChanges.call(this) | differ;
}

function handlePasswordChange() {
   var password = document.getElementById("password").value;
   if (password == "") return;
   var outputarea = document.getElementById("notepad");
   if (outputarea.disabled) {
      // notepad is still encrypted. See if current password matches hash
      var passkey = calcNotepadKey(password, true);
      var notepaddata = this.item.child.child.data;
      for (var i = 0; i < 9; i++) {
         if (passkey[i] != notepaddata[4 + i]) return;
      }
      // decode notepad
      passkey = calcNotepadKey(password, false);
      var ln = notepaddata[0] * 256 + notepaddata[1] + 4;
      var s = decodeMessage(passkey, notepaddata, ln);
      outputarea.value = s;
      outputarea.disabled = false;

      // Update CodeEditor if available
      if (this.codeEditorInstance) {
         this.codeEditorInstance.setValue(s);
         this.codeEditorInstance.setReadOnly(false);
      }
   } else {
      // password changed.
      this.callback(EditorMessage.CHANGEMADE);
   }
}


function calcNotepadKey(password, nine) {
   var constants = [
      [0x25, 0x3D, 0xC5, 0x7, 0x3, 0xA9, 0x97, 0xC5],// 8 BYTE
      [0x3D, 0x25, 0xCB, 0x3, 0xB, 0xA1, 0xAD, 0xCB],// 9 BYTE
   ];
   var cnst = constants[nine ? 1 : 0];
   var p = [0, 0, 0, 0, 0, 0, 0, 0];
   // step 1.
   var s = password.toUpperCase();
   var len = s.length;
   while (s.length < 8) s = s + s;
   var t = 0;
   for (var i = 0; i < 8; i++) {
      p[i] = s.charCodeAt(i);
      t += p[i];
   }
   t &= 7;
   // step 2
   var g = [0, 0, 0, 0];
   for (var i = 0; i < 4; i++) {
      g[i] = (p[i] + cnst[0]) * (p[7 - i] + cnst[1]) * cnst[2];
      g[i] >>= 8;
   }
   // step 3
   var f = [0, 0];
   for (var i = 0; i < 2; i++) {
      f[i] = (g[1 - i] + cnst[3]) * (g[2 + i] + cnst[4]) * cnst[5 + i];
      f[i] = (f[i] - (f[i] & 0xff)) / 256;   // cannot use >> as f[i] is longer than 32 bits
   }
   // step 4
   for (var i = 0; i < 2; i++) {
      var low = f[i] & 0xffff;
      var high = ((f[i] & 0xffff0000) >> 16) & 0xffff;
      f[i] = low * 0x10000 + high;
   }
   //step 5
   for (var i = 0; i < 2; i++) {
      f[i] = f[i] * cnst[7];
      f[i] = (f[i] - (f[i] & 0xff)) / 256;   // cannot use >> as f[i] is longer than 32 bits
   }
   var d = [0, 0, 0, 0, 0, 0, 0, 0];
   for (var j = 0; j < 2; j++) {
      for (var i = 0; i < 4; i++) {
         d[i + j * 4] = (f[j] >> (8 * i)) & 0xFF;
      }
   }

   if (!nine) return d;

   // step 6
   for (var i = 0; i < 8; i++) {
      p[i] = (p[i] + d[7 - i]) & 0xFF;
   }
   //step 7
   p[8] = (len + d[t]) & 0xFF;
   return p;
}

function decodeMessage(key, message, start) {
   var s = "";
   var i = start;
   // handle unencrypted title
   do {
      if (message[i] === undefined) return s;
      s += String.fromCharCode(message[i]);
      i++;
   } while (message[i - 1] != 58);
   // handle optional unencrypted line break
   if (message[i] == 0) {
      i++;
      s += "\n";
   }
   //handle encrypted message
   var kix = 0;
   var c = 0;
   while (message[i] !== undefined) {
      var t = message[i++];
      c = (c + 163) & 0xFF;
      key[kix] = (key[kix] + c) & 0xFF;
      t = (t - key[kix]) & 0xFF;
      if (t == 0) s += "\n";
      else s += String.fromCharCode(t);
      kix = (kix + 1) & 7;
   }
   return s;
}

function encodeMessage(key, message) {
   var output = [];
   var ix = message.indexOf(":");
   // handle unencrypted title
   if (ix <= 8) {
      for (var i = 0; i <= ix; i++) {
         output[output.length] = message.charCodeAt(i);
      }
      ix++;
      // handle optional unencrypted line break
      if (message.charCodeAt(ix) == 10) {
         output[output.length] = 0;
         ix++;
      }
   } else ix = 0; // should not happen
   //handle encrypted message
   var kix = 0;
   var c = 0;
   while (ix < message.length) {
      var t = message.charCodeAt(ix++);
      if (t == 10) t = 0;
      c = (c + 163) & 0xFF;
      key[kix] = (key[kix] + c) & 0xFF;
      t = (t + key[kix]) & 0xFF;
      output[output.length] = t;
      kix = (kix + 1) & 7;
   }
   return output;
}


function arraysAreEqual(arr1, arr2) {
   if (arr1 == arr2) return true;
   /*
   console.log("len: "+arr1.length+", "+arr2.length)
   for( var i=0; i<arr1.length; i++){
      console.log(i+": "+(arr1[i]!=arr2[i]?"*":" ")+arr1[i]+", "+arr2[i])
   }
   //*/
   if (arr1.length != arr2.length) return false;
   for (var i = 0; i < arr1.length; i++) {
      if (arr1[i] != arr2[i]) return false;
   }
   return true;
}


function initialiseForm(id, val, self, handler) {
   var elemnt = document.getElementById(id);
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
