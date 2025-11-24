'use strict';

function Button(id, clickcallback, id2, filecallback) {
   var _element = document.getElementById(id);
   if (id2) {
      var _element2 = document.getElementById(id2);
      this.getFiles = function () { return _element2.files; }
      _element2.addEventListener('change', function (e) { if (_element.classList.contains('active-button')) filecallback(e) }, false);
   }
   if (clickcallback) {
      _element.addEventListener('click', function (e) { if (_element.classList.contains('active-button')) clickcallback(e) }, false);
   }
   this.setActive = function (active) {
      if (active && _element.classList.contains('inactive-button')) {
         _element.classList.remove('inactive-button');
         _element.classList.add('active-button');
      } else if (!active && _element.classList.contains('active-button')) {
         _element.classList.remove('active-button');
         _element.classList.add('inactive-button');
      }
   }
}



// -------- opk file selection ---------------

var pack;
var currentEditor;
var currentItem;
var syntaxHighlightingEnabled = false;

var newpackbutton = new Button("newpackbutton", createNew);
var savepackbutton = new Button("savepackbutton", packSaved);
var savehexbutton = new Button("savehexbutton");
var discardbutton = new Button("discardbutton", discardEdits);
var discardbutton = new Button("discardbutton", discardEdits);
var applybutton = new Button("applybutton", applyEdits);
var loadpackbutton = new Button("loadpacklabel", canLoadPack, "loadpackbutton", fileChosen);
var newitembutton = new Button("newitembutton", createNewItem);
var saveitembutton = new Button("saveitembutton");
var loaditembutton = new Button("loaditemlabel", null, "loaditembutton", itemChosen);
var loaditembutton = new Button("loaditemlabel", null, "loaditembutton", itemChosen);
var eraseitembutton = new Button("eraseitembutton", eraseItem);
var highlightbutton = new Button("highlightbutton", toggleSyntaxHighlight);

var savepackelement = document.getElementById("savepackbutton");
var savehexelement = document.getElementById("savehexbutton");
var saveitemelement = document.getElementById("saveitembutton");
var saveitemelement = document.getElementById("saveitembutton");

var inventoryelement = document.getElementById("opkcontents");
var fileinfoelement = document.getElementById("fileinfo");
var checksumselement = document.getElementById("checksums");
var editorelement = document.getElementById("itemeditor");

var editors = [
   new HeaderEditor(editorelement, handleEditorMessage),           // -1
   new HeaderlessFileEditor(editorelement, handleEditorMessage),   // 0
   new DataFileEditor(editorelement, handleEditorMessage),         // 1
   new ProcedureFileEditor(editorelement, handleEditorMessage),    // 3
   new NotePadFileEditor(editorelement, handleEditorMessage),      // 7
   new RecordEditor(editorelement, handleEditorMessage),           // 16-126
   new BlockFileEditor(editorelement, handleEditorMessage, [2, 4, 5, 6]),   // maybe to be specialised later
   new BlockFileEditor(editorelement, handleEditorMessage, [8, 9, 10, 11, 12, 13, 14, 15]),
];


function createNew() {
   if (!discardUnsavedPack()) return;
   pack = new PackImage(null);
   updateInventory();
}

function packSaved() {
   pack.unsaved = false;
}

function updateItemButtons(isDirty) {
   discardbutton.setActive(isDirty);
   applybutton.setActive(isDirty);
   savepackbutton.setActive(!isDirty);
   eraseitembutton.setActive(!isDirty && currentItem && currentItem.type >= 0);
   if (isDirty) saveitembutton.setActive(false);
   else updateSaveItemButton();

   // Highlight button only active if not dirty (to avoid losing edits) and is procedure
   if (currentItem && currentItem.type == 3) {
      highlightbutton.setActive(!isDirty);
   }
}

function discardEdits() {
   if (currentEditor && currentItem) {
      currentEditor.initialise(currentItem);
      updateItemButtons(false);
   }
}

function applyEdits() {
   if (currentEditor && currentItem) {
      if (currentEditor.applyChanges()) {
         pack.unsaved = true;
         updateInventory();
      }
      updateItemButtons(false);
   }
}

function handleEditorMessage(msg, arg1, arg2) {
   // called when edits are made in a file editor.
   if (msg == EditorMessage.CHANGEMADE) {
      updateItemButtons(true);
   }
   // called when list of all file ids is needed by editor.
   else if (msg == EditorMessage.GETFILEIDS) {
      return getDataFiles();
   }
   else if (msg == EditorMessage.CHANGEFILEID) {
      var fromtp = arg1 & 0x7f;
      var totp = arg2 & 0x7f;
      var items = pack.items;
      for (var i = 0; i < items.length; i++) {
         var item = items[i];
         if (item.type == fromtp) {
            item.data[1] = totp + (item.deleted ? 0 : 0x80);
            item.setDescription();
            pack.unsaved = true;
         }
      }
   }
   else if (msg == EditorMessage.DELETERECORDS) {
      var fileid = arg1 & 0x7f;
      var deleted = arg2;
      var items = pack.items;
      for (var i = 0; i < items.length; i++) {
         var item = items[i];
         if (item.type == fileid) {
            item.data[1] = fileid + (deleted ? 0 : 0x80);
            item.setDescription();
            pack.unsaved = true;
         }
      }
   }
}
function getDataFiles() {
   var idlst = {};
   var items = pack.items;
   for (var i = 0; i < items.length; i++) {
      if (items[i].type == 1) {
         var id = items[i].data[10] - 0x8f;
         idlst[id] = items[i].name;
      }
   }
   return idlst;
}

function discardUnsavedPack() {
   if (!pack) return true;
   if (!closeEditor()) return false;

   // check that unsaved changes can be discarded
   if (pack.unsaved) {
      var discard = window.confirm("Changed have been made to the pack.\nIs it ok to discard those changes?");
      if (!discard) return false;
   }
   return true;
}

function updateSavePackButton() {
   if (pack) {
      savepackbutton.setActive(true);
      savepackelement.href = pack.getURL();
      savepackelement.download = pack.filename ? pack.filename : "packname.opk";

      savehexbutton.setActive(true);
      savehexelement.href = pack.getHexURL();
      savehexelement.download = (pack.filename ? pack.filename.replace(/\.[^/.]+$/, "") : "packname") + ".hex";

      newitembutton.setActive(true);
      loaditembutton.setActive(true);
   } else {
      savepackbutton.setActive(false);
      savepackelement.href = "javascript:void(0)";
      delete savepackelement.download;

      savehexbutton.setActive(false);
      savehexelement.href = "javascript:void(0)";
      delete savehexelement.download;
   }
}

function updateInventory() {
   // clear inventory first
   while (inventoryelement.firstChild) {
      inventoryelement.removeChild(inventoryelement.firstChild);
   }
   if (checksumselement) checksumselement.innerHTML = "";

   // rebuild list
   if (pack) {
      if (fileinfoelement) fileinfoelement.innerHTML = "<b>File:</b> " + (pack.filename ? pack.filename : "Untitled");
      var pl = Math.max(4, pack.getLength().toString(16).length);
      var ix = 0;
      var items = pack.items;
      for (var i = 0; i < items.length; i++) {
         // Create the list item:
         var item = document.createElement('li');
         // create text contents
         var s = ("000000" + ix.toString(16)).substr(-pl) + " ";
         s += (items[i].name + "        ").substr(0, 8) + " ";
         s += items[i].desc;

         // Set its contents:
         item.appendChild(document.createTextNode(s));

         // Set its selection mode
         if (currentItem == items[i]) {
            item.classList.add('selectedItem');
         }

         // Add it to the list:
         inventoryelement.appendChild(item);

         ix += items[i].getLength();
      }

      // Create the list item:
      var item = document.createElement('li');
      // create text contents
      var s = ("000000" + ix.toString(16)).substr(-pl) + "          End of Pack";
      // Set its contents:
      item.appendChild(document.createTextNode(s));
      // Add it to the list:
      inventoryelement.appendChild(item);

      // check pack size
      var sz = 1;
      while (sz * 8192 < ix) sz *= 2;
      var pksz = items[0].data[1];
      if (pksz < sz) {
         items[0].data[1] = sz;
         alert("Pack size has been increased to " + (sz * 8) + "k");
      }

      new DragDropList(inventoryelement, itemMoved, 1, 1);
      new SelectionList(inventoryelement, itemSelected);
   } else {
      var item = document.createElement('li');
      item.innerHTML = "<i>No OPK file yet</i>";
      inventoryelement.appendChild(item);
   }
   updateSavePackButton();
}
updateInventory();

function closeEditor() {
   // close current editor
   if (currentEditor) {
      if (currentEditor.hasUnsavedChanges()) {
         var discard = window.confirm("Not all changes have been saved.\nIs it ok to discard those changes?");
         if (!discard) return false;
      }
      currentEditor.finish();
      currentEditor = null;
   }
   return true;
}

function getItemAddres(ix) {
   var addr = 0;
   for (var i = 0; i < ix; i++) {
      addr += pack.items[i].getLength();
   }
   return addr;
}

function itemMoved(fromIx, toIx) {
   if (fromIx != toIx) {
      var item = pack.items[fromIx];
      var bootOffset = -1;
      // Check if moved headerless block containing boot code
      if (item.type == 0 && (pack.items[0].data[0] & 0x10) == 0) {
         var addr1 = getItemAddres(fromIx);
         var addr2 = (pack.items[0].data[6] << 8) + pack.items[0].data[7];
         if (addr2 >= addr1 && addr2 < addr1 + item.getLength()) {
            bootOffset = addr2 - addr1;
         }
      }
      // move the item
      pack.items.splice(fromIx, 1);
      if (fromIx < toIx) toIx--;
      pack.items.splice(toIx, 0, item);
      // update boot address
      if (bootOffset >= 0) {
         var addr = getItemAddres(toIx) + bootOffset;
         pack.items[0].data[6] = (addr >> 8) & 0xff;
         pack.items[0].data[7] = addr & 0xff;
      }
      pack.unsaved = true;
      updateInventory();
   }
}

function itemSelected(ix) {
   var isok = ix >= 0 && ix < pack.items.length;
   if (!isok) return false;
   if (!closeEditor()) return false;

   // Get the selected item
   currentItem = pack.items[ix];
   var tp = currentItem.type;

   // Find the editor for this item
   var i = 0;
   while (i < editors.length && !editors[i].acceptsType(tp)) {
      i++;
   }
   if (i < editors.length) {
      // initialise the editor with the selected item
      currentEditor = editors[i];
      currentEditor.initialise(currentItem);
   }

   // update buttons
   updateItemButtons(false);

   // Show/Hide highlight button
   var hlbtn = document.getElementById("highlightbutton");
   if (tp == 3) { // Procedure
      hlbtn.style.display = "inline-block";
      if (syntaxHighlightingEnabled && currentEditor.toggleHighlight) {
         currentEditor.toggleHighlight();
         hlbtn.innerHTML = "No Syntax Highlight";
      } else {
         hlbtn.innerHTML = "Syntax Highlight";
      }
   } else {
      hlbtn.style.display = "none";
   }

   return true;
}

function toggleSyntaxHighlight() {
   if (currentEditor && currentEditor.toggleHighlight) {
      var active = currentEditor.toggleHighlight();
      syntaxHighlightingEnabled = active;
      var hlbtn = document.getElementById("highlightbutton");
      hlbtn.innerHTML = active ? "No Syntax Highlight" : "Syntax Highlight";
   }
}

function updateSaveItemButton() {
   var url = pack && currentItem ? pack.getItemURL(currentItem) : null;
   if (url) {
      saveitembutton.setActive(true);
      saveitemelement.href = url;
      var nm = currentItem.name ? currentItem.name : "";
      nm = nm.replace(/%$/i, "_");
      nm += currentItem.type == 1 ? ".ODB" : ".OB" + "23456789ABCDEF".substr(currentItem.type - 2, 1);
      saveitemelement.download = nm;
   } else {
      saveitembutton.setActive(false);
      saveitemelement.href = "javascript: void(0)";
      delete saveitemelement.download;
   }
}


function canLoadPack(e) {
   if (!discardUnsavedPack()) {
      // cancel load
      e.preventDefault();
   }
}
function fileChosen() {
   var files = loadpackbutton.getFiles();
   if (files.length != 0) {
      var file = files[0];
      var fname = file.name.toLowerCase();
      if (fname.endsWith(".hex") || fname.endsWith(".ihx")) {
         // Load Intel HEX
         var reader = new FileReader();
         reader.onload = function (e) {
            try {
               var binary = parseIntelHexToBinary(e.target.result);
               // Wrap in OPK format
               var len = binary.length;
               var header = new Uint8Array(6);
               header[0] = 0x4F; // 'O'
               header[1] = 0x50; // 'P'
               header[2] = 0x4B; // 'K'
               header[3] = (len >> 16) & 0xFF;
               header[4] = (len >> 8) & 0xFF;
               header[5] = len & 0xFF;

               var opkData = new Uint8Array(6 + len + 2);
               opkData.set(header, 0);
               opkData.set(binary, 6);
               opkData[6 + len] = 0xFF;
               opkData[6 + len + 1] = 0xFF;

               pack = new PackImage(opkData);
               pack.unsaved = false;
               pack.filename = file.name.replace(/\.[^/.]+$/, "") + ".opk";
               updateInventory();

               // Calculate and display checksums for full OPK data
               var cs = Checksums.calculate(opkData);
               if (checksumselement) {
                  checksumselement.innerHTML = "<b>Checksums:</b> Sum: 0x" + cs.sum.toString(16).toUpperCase() +
                     " CRC32: 0x" + cs.crc32.toString(16).toUpperCase() +
                     " MD5: " + cs.md5;
               }
            } catch (err) {
               alert("Error parsing HEX file: " + err.message);
            }
         };
         reader.readAsText(file);
      } else {
         // load the file
         LoadLocalBinaryFile(files[0],
            function (data, nm) {
               pack = new PackImage(data);
               pack.unsaved = false;
               pack.filename = nm;
               updateInventory();

               // Calculate and display checksums for full file data
               var cs = Checksums.calculate(data);
               if (checksumselement) {
                  checksumselement.innerHTML = "<b>Checksums:</b> Sum: 0x" + cs.sum.toString(16).toUpperCase() +
                     " CRC32: 0x" + cs.crc32.toString(16).toUpperCase() +
                     " MD5: " + cs.md5;
               }
            }
         );
      }
   }
}

function eraseItem() {
   if (!currentItem) return;
   if (currentItem.type < 0) return;
   if (!currentItem.deleted) {
      var discard = window.confirm("Are you sure you want to erase " + (currentItem.name ? currentItem.name : "this item") + " from the pack?");
      if (!discard) return false;
   }
   if (!closeEditor()) return false;

   var items = pack.items;
   var i = items.indexOf(currentItem);
   if (i < 0) return; // shouldn't happen
   pack.unsaved = true;
   items.splice(i, 1);
   if (currentItem.type == 1) {
      // remove all records of this data file
      var fileid = currentItem.data[10] - 0x80;
      for (var i = items.length - 1; i > 0; i--) {
         if (items[i].type == fileid)
            items.splice(i, 1);
      }
   }
   updateInventory();
}

var chooseTypeScreen;
var availableTypes = {
   1: "Data file",
   3: "Procedure",
   7: "Notepad",
};
function createNewItem() {
   if (!pack) return; // should not happen

   if (!chooseTypeScreen) {
      var element = document.createElement('div');
      element.innerHTML =
         "<div>Select type to add:</div>" +
         "<div><select id=choosetype>" +
         "</select>";
      chooseTypeScreen = new ModalDialog(element, createNewItemTypeChosen);
   }
   var sel = document.getElementById("choosetype");
   var ix = sel.selectedIndex;
   while (sel.firstChild)
      sel.removeChild(sel.firstChild);
   for (var i = 1; i < 15; i++) {
      if (availableTypes[i]) {
         var opt = document.createElement('option');
         opt.value = i;
         opt.innerHTML = availableTypes[i];
         sel.appendChild(opt);
      }
   }
   var files = getDataFiles();
   for (var i = 1; i < 110; i++) {
      if (files[i]) {
         var opt = document.createElement('option');
         opt.value = i + 0xf;
         opt.innerHTML = "Record for file " + files[i] + " (" + i + ")";
         sel.appendChild(opt);
      }
   }
   sel.selectedIndex = ix;
   chooseTypeScreen.start();
}
function createNewItemTypeChosen() {
   var sel = document.getElementById("choosetype");
   var type = parseInt(sel.value);
   if (type == 1) {
      var id = getFreeFileId();
      if (id <= 0) return;
      // create file header
      var hdritem = createFileHeader("DATAFILE", type, id + 0x8f);
      addItemToPack(hdritem);
      updateInventory();
   } else if (type == 3) {
      var data = [0x00, 0x00, 0x00, 0x0A, 80, 82, 79, 67, 78, 65, 77, 69, 58, 0];
      createBlockFile(data, "PROCNAME", type);
   } else if (type == 7) {
      var data = [0x00, 0x02, 8, 0, 0x00, 0x09, 78, 79, 84, 69, 80, 65, 68, 58, 0];
      createBlockFile(data, "NOTEPAD", type);
   } else if (type > 0x0f) {
      var hdritem = new PackItem([1, type + 0x80, 0x20], 0, 3);
      addItemToPack(hdritem);
      updateInventory();
   }
}

function createBlockFile(data, name, type) {
   var hdritem = createFileHeader(name, type, 0);
   var c2item = new PackItem(data, 0, data.length);
   var c1item = new PackItem([2, 0x80, data.length >> 8, data.length & 0xff], 0, 4);
   c1item.child = c2item;
   c1item.setDescription();
   hdritem.child = c1item;
   addItemToPack(hdritem);
   updateInventory();
}

function itemChosen() {
   if (!pack) return; // should not happen
   var files = loaditembutton.getFiles();
   for (var i = 0; i < files.length; i++) {
      var fn = files[i].name;
      if (fn.match(/\.((ODB)|(OPL)|(NTS))$/i)) {
         LoadLocalTextFile(files[i], createItemFromFileData);
      } else {
         LoadLocalBinaryFile(files[i], createItemFromFileData);
      }
   }
}

function getFreeFileId() {
   var ids = getDataFiles();
   var id = 1;
   while (ids[id]) id++;
   if (id >= 111) {
      alert("Pack cannot contain more than 110 files.");
      return -1;
   }
   return id;
}

function createItemFromFileData(filedata, name) {
   // check if it is a valid binary file, "ORG"+type
   if (filedata[0] == 79 && filedata[1] == 82 && filedata[2] == 71 && filedata[5] >= 0x82 && filedata[5] <= 0x8f) {
      var type = filedata[5] - 0x80;
      var ln = (filedata[3] << 8) + filedata[4];
      if (filedata.length < 6 + ln) {
         alert("The file " + name + " seems to be truncated!");
         return;
      }
      // convert file name to valid item name
      var hdritem = createFileHeader(name, type, 0);
      // create pack blockheader
      var blkhdr = new Uint8Array(4);
      blkhdr[0] = 2;
      blkhdr[1] = 0x80;
      blkhdr[2] = filedata[3];
      blkhdr[3] = filedata[4];
      // create pack item
      var dataitem = new PackItem(filedata, 6, ln);
      var blkhdritem = new PackItem(blkhdr, 0, 4);
      blkhdritem.child = dataitem;
      blkhdritem.setDescription();
      hdritem.child = blkhdritem;
      addItemToPack(hdritem);
      updateInventory();
      // check if it is a valid headerless binary file, "BIN"
   } else if (filedata[0] == 79 && filedata[1] == 82 && filedata[2] == 71 && filedata[5] == 0xFF) {
      var ln = (filedata[3] << 8) + filedata[4];
      if (filedata.length < 6 + ln || ln < 0x1d) {
         alert("The file " + name + " seems to be truncated!");
         return;
      }
      if (filedata[0x1b] != 0x02 || filedata[0x1c] != 0x80) {
         alert("The file " + name + " does not seem to have\na standard headerless block format!");
         return;
      }
      var ln2 = (filedata[0x1d] << 8) + filedata[0x1e];
      if (filedata.length < 0x1f + ln2) {
         alert("The file " + name + " seems to be truncated!");
         return;
      }
      // create pack blockheader
      var blkhdr = new Uint8Array(4);
      blkhdr[0] = 2;
      blkhdr[1] = 0x80;
      blkhdr[2] = filedata[0x1d];
      blkhdr[3] = filedata[0x1e];
      // create pack item
      var dataitem = new PackItem(filedata, 0x1f, ln2);
      var blkhdritem = new PackItem(blkhdr, 0, 4);
      blkhdritem.child = dataitem;
      blkhdritem.setDescription();
      addItemToPack(blkhdritem);
      updateInventory();
      // TODO: if header is first item after main, ask if want this to be the boot code
      if (pack.items.length == 3) {
         var makeBoot = window.confirm("Do you want this to be used as boot code?");
         if (makeBoot) {
            var hdata = pack.items[0].data;
            hdata[2] = 0; // code
            hdata[3] = filedata[9]; // boot id
            hdata[4] = filedata[10]; // version
            hdata[5] = filedata[11]; // priority
            hdata[6] = filedata[12]; // address1
            hdata[7] = filedata[13]; // address2
            hdata[0] &= 0xEF; // boot flag
            // update checksum
            var sum1 = hdata[0] + hdata[2] + hdata[4] + hdata[6];
            var sum2 = hdata[1] + hdata[3] + hdata[5] + hdata[7];
            sum1 += (sum2 >> 8);
            hdata[9] = sum2 & 0xff;
            if ((hdata[0] & 0x40) == 0) {
               hdata[8] &= 0x80;
               hdata[8] += sum1 & 0x7f;
            } else {
               hdata[8] = sum1 & 0xff;
            }
         }
      }
      // check for a procedure source file by name only
   } else if (name.substr(-4).toUpperCase() == ".OPL") {
      // convert file name to valid item name
      var hdritem = createFileHeader(name, 3, 0);
      var ln = filedata.length + 6;
      // create pack blockheader
      var blkhdr = new Uint8Array(4);
      blkhdr[0] = 2;
      blkhdr[1] = 0x80;
      blkhdr[2] = (ln >> 8) & 0xff;
      blkhdr[3] = ln & 0xff;
      // create pack item
      var itemdata = new Uint8Array(6 + filedata.length);
      itemdata[0] = 0;
      itemdata[1] = 0;
      itemdata[2] = (filedata.length >> 8) & 0xff;
      itemdata[3] = filedata.length & 0xff;
      for (var i = 0; i < filedata.length; i++) {
         var c = filedata.charCodeAt(i);
         itemdata[4 + i] = c == 10 ? 0 : c;
      }
      var dataitem = new PackItem(itemdata, 0, itemdata.length);
      var blkhdritem = new PackItem(blkhdr, 0, 4);
      blkhdritem.child = dataitem;
      blkhdritem.setDescription();
      hdritem.child = blkhdritem;
      addItemToPack(hdritem);
      updateInventory();

      // check for a database file by name only
   } else if (name.substr(-4).toUpperCase() == ".ODB") {
      var id = getFreeFileId();
      if (id <= 0) return;
      // create file header
      var hdritem = createFileHeader(name, 1, id + 0x8f);
      addItemToPack(hdritem);
      // add contents of the file as records
      var line = 1;
      var startix = 0;
      while (startix < filedata.length) {
         var endix = startix;
         while (endix < filedata.length && filedata.charCodeAt(endix) != 10) endix++;
         if (endix >= filedata.length) {
            alert("File is missing a newline on last line. That line has been ignored.");
            break;
         }
         if (endix - startix > 255) {
            alert("Line " + line + " has " + (endix - startix) + " characters. Only first 255 characters are stored.");
         }
         var ln = Math.min(endix - startix, 255);
         var itemdata = new Uint8Array(2 + ln);
         for (var i = 0; i < ln; i++)
            itemdata[2 + i] = filedata.charCodeAt(startix + i);
         itemdata[0] = ln;
         itemdata[1] = id + 0x8f;
         var recitem = new PackItem(itemdata, 0, ln + 2);
         addItemToPack(recitem);

         line++;
         startix = endix + 1;
      }
      updateInventory();

      // check for a notepad text file by name only
   } else if (name.substr(-4).toUpperCase() == ".NTS") {
      // convert file name to valid item name
      var hdritem = createFileHeader(name, 7, 0);
      var ln = filedata.length + 6;
      // create pack blockheader
      var blkhdr = new Uint8Array(4);
      blkhdr[0] = 2;
      blkhdr[1] = 0x80;
      blkhdr[2] = (ln >> 8) & 0xff;
      blkhdr[3] = ln & 0xff;
      // create pack item
      var itemdata = new Uint8Array(6 + filedata.length);
      itemdata[0] = 0;
      itemdata[1] = 2;  // length of header
      itemdata[2] = 8;  // flags
      itemdata[3] = 0;  // no password
      itemdata[4] = (filedata.length >> 8) & 0xff;
      itemdata[5] = filedata.length & 0xff;
      for (var i = 0; i < filedata.length; i++) {
         var c = filedata.charCodeAt(i);
         itemdata[6 + i] = c == 10 ? 0 : c;
      }
      var dataitem = new PackItem(itemdata, 0, itemdata.length);
      var blkhdritem = new PackItem(blkhdr, 0, 4);
      blkhdritem.child = dataitem;
      blkhdritem.setDescription();
      hdritem.child = blkhdritem;
      addItemToPack(hdritem);
      updateInventory();

   } else {
      alert("File format not recognised!");
   }
}

function createFileHeader(name, type, id) {
   name = name.replace(/\.((ODB)|(OPL)|(NTS)|(OB[2-9A-F]))$/i, "");
   name = name.replace(/_$/i, "%");
   name = name.replace(/[^a-z0-9\$\%]/i, "");
   name = (name + "        ").substr(0, 8);
   // create pack block file
   var hdr = new Uint8Array(11);
   hdr[0] = 9;
   hdr[1] = type + 0x80;
   for (var i = 0; i < 8; i++) hdr[2 + i] = name.charCodeAt(i);
   hdr[10] = id ? id : 0;
   var hdritem = new PackItem(hdr, 0, 11);
   return hdritem;
}

function addItemToPack(item) {
   item.setDescription();
   pack.items[pack.items.length] = item;
   pack.unsaved = true;
}

function askForPackType() {
   var elmnt = document.createElement('div');
   elmnt.innerHTML =
      "<select id='fitetype'>" +
      "<option>OB2</option>" +
      "<option>OB3</option>" +
      "<option>OB4</option>" +
      "<option>OB5</option>" +
      "<option>OB6</option>" +
      "<option>OB7</option>" +
      "<option>OB8</option>" +
      "<option>OB9</option>" +
      "<option>OBA</option>" +
      "<option>OBB</option>" +
      "<option>OBC</option>" +
      "<option>OBD</option>" +
      "<option>OBE</option>" +
      "<option>OBF</option>" +
      "</select>";
   //document.appendChild(elmnt);
}

function toggleDarkMode() {
   var body = document.body;
   var button = document.getElementById("darkmodebutton");
   body.classList.toggle("dark-mode");
   var isDarkMode = body.classList.contains("dark-mode");

   if (isDarkMode) {
      button.innerHTML = "Light Mode";
      localStorage.setItem("darkMode", "enabled");
   } else {
      button.innerHTML = "Dark Mode";
      localStorage.setItem("darkMode", "disabled");
   }
}

// Initialize Dark Mode from localStorage
(function () {
   var darkMode = localStorage.getItem("darkMode");
   if (darkMode === "enabled") {
      var body = document.body;
      var button = document.getElementById("darkmodebutton");
      body.classList.add("dark-mode");
      if (button) button.innerHTML = "Light Mode";
   }
})();
