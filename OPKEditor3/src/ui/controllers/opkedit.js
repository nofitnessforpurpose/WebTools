'use strict';

// Button Helper Class
function Button(id, clickcallback, inputId, filecallback) {
   var _element = document.getElementById(id);
   if (!_element) {
      console.warn("Button not found: " + id);
      return;
   }

   if (inputId) {
      var _input = document.getElementById(inputId);
      this.getFiles = function () { return _input.files; }
      _input.addEventListener('change', function (e) {
         if (!_element.disabled) filecallback(e);
         // Reset input so same file can be selected again
         _input.value = '';
      }, false);

      // Trigger file input when button is clicked
      _element.addEventListener('click', function () {
         if (!_element.disabled) _input.click();
      });
   } else if (clickcallback) {
      _element.addEventListener('click', function (e) {
         if (!_element.disabled) clickcallback(e)
      }, false);
   }

   this.setActive = function (active) {
      _element.disabled = !active;
      if (active) {
         _element.classList.remove('disabled');
      } else {
         _element.classList.add('disabled');
      }
   }
}

// Global State
var packs = []; // Changed from single pack to array
var currentPack = null; // Track the currently active pack (for adding items etc)
var currentEditor;
var currentItem;
var currentPackIndex = -1; // Index of the pack containing the current item
var selectedPackIndex = -1; // Index of the selected pack header
var syntaxHighlightingEnabled = true;

// UI Elements
var inventoryelement = document.getElementById("pack-list");
var fileinfoelement = document.getElementById("current-file-name");
var checksumselement = document.getElementById("status-checksum");
var statusmessageelement = document.getElementById("status-message");

var legacyEditorElement = document.getElementById("legacy-editor");
var codeEditorElement = document.getElementById("code-editor-container");

var editors = [
   new HeaderEditor(legacyEditorElement, handleEditorMessage),
   new HeaderlessFileEditor(legacyEditorElement, handleEditorMessage),
   new DataFileEditor(legacyEditorElement, handleEditorMessage),
   new ProcedureFileEditor(legacyEditorElement, codeEditorElement, handleEditorMessage),
   new NotePadFileEditor(legacyEditorElement, codeEditorElement, handleEditorMessage),
   new RecordEditor(legacyEditorElement, handleEditorMessage),
   new BlockFileEditor(legacyEditorElement, handleEditorMessage, [2, 4, 5, 6, 8, 9, 10, 11, 12, 13, 14, 15], codeEditorElement)
];

// Buttons
var newpackbutton = new Button("btn-new-pack", createNew);
var savepackbutton = new Button("btn-save-pack", packSaved);
var savehexbutton = new Button("btn-export-hex", exportHex);
var discardbutton = new Button("btn-discard", discardEdits);
var applybutton = new Button("btn-apply", applyEdits);
var loadpackbutton = new Button("btn-open-pack", null, "file-input-pack", fileChosen);
var newitembutton = new Button("btn-add-item", createNewItem);
var loaditembutton = new Button("btn-import-item", null, "file-input-item", itemChosen);
var eraseitembutton = new Button("btn-delete-item", eraseItem);
var optionsbutton = new Button("btn-options", showOptionsDialog);
var aboutbutton = new Button("btn-about", showAboutDialog);

// Dialog Functions
function showOptionsDialog() {
   var element = document.createElement('div');
   element.innerHTML =
      "<form id='options-form' style='text-align: left; padding: 10px;'>" +
      "<div style='margin-bottom: 10px;'><label><input type='checkbox' id='opt-linenumbers'> Show Line Numbers</label></div>" +
      "<div style='margin-bottom: 10px;'><label><input type='checkbox' id='opt-folding'> Enable Code Folding</label></div>" +
      "<div style='margin-bottom: 10px;'><label><input type='checkbox' id='opt-syntax'> Enable Syntax Highlighting</label></div>" +
      "<div style='margin-bottom: 10px;'><label><input type='checkbox' id='opt-splash'> Show Splash Screen on Startup</label></div>" +
      "<div>Theme: <select id='opt-theme' style='padding: 5px;'><option value='light'>Light</option><option value='dark'>Dark</option></select></div>" +
      "</form>";

   var dialog = new ModalDialog(element, function () {
      var showLineNumbers = element.querySelector('#opt-linenumbers').checked;
      var codeFolding = element.querySelector('#opt-folding').checked;
      var syntaxHighlighting = element.querySelector('#opt-syntax').checked;
      var showSplash = element.querySelector('#opt-splash').checked;
      var theme = element.querySelector('#opt-theme').value;

      OptionsManager.setOption('showLineNumbers', showLineNumbers);
      OptionsManager.setOption('codeFolding', codeFolding);
      OptionsManager.setOption('syntaxHighlighting', syntaxHighlighting);
      OptionsManager.setOption('showSplashScreen', showSplash);
      ThemeManager.setTheme(theme);

      if (currentEditor && currentEditor.codeEditorInstance) {
         currentEditor.codeEditorInstance.update();
      }
   });

   element.querySelector('#opt-linenumbers').checked = OptionsManager.getOption('showLineNumbers');
   element.querySelector('#opt-folding').checked = OptionsManager.getOption('codeFolding');
   element.querySelector('#opt-syntax').checked = OptionsManager.getOption('syntaxHighlighting');
   element.querySelector('#opt-splash').checked = OptionsManager.getOption('showSplashScreen') !== false; // Default true if undefined
   element.querySelector('#opt-theme').value = ThemeManager.currentTheme;

   dialog.start();
}

function showAboutDialog(isSplash) {
   var element = document.createElement('div');
   element.innerHTML =
      "<div style='text-align: center; padding: 20px;'>" +
      "<img src='assets/pics/logo.gif' alt='Psion Logo' style='width: 25%; margin-bottom: 15px;'>" +
      "<h2 style='margin-top: 0;'>OPK Editor 3</h2>" +
      "<p>A modern editor for Psion Organiser II packs.</p>" +
      "<p>Version 3.0.0</p>" +
      "<hr style='margin: 15px auto; width: 80%; border: 0; border-top: 1px solid #ccc;'>" +
      "<p>Original by <b>Jaap Scherphuis</b></p>" +
      "<p>Reimagined by <b>NFfP</b>, Implemented with precision by <b>Antigravity</b>.</p>" +
      "</div>";

   var dialog = new ModalDialog(element, null);
   dialog.start();

   if (isSplash) {
      setTimeout(function () {
         dialog.stop();
      }, 3000);
   }
}

// Initialization
function init() {
   updateInventory();
   createTooltipElement();

   if (OptionsManager.getOption('showSplashScreen') !== false) {
      showAboutDialog(true);
   }
}

var tooltipElement;

function createTooltipElement() {
   tooltipElement = document.createElement('div');
   tooltipElement.id = 'pack-summary-tooltip';
   document.body.appendChild(tooltipElement);
}

function showTooltip(e, pack) {
   if (!tooltipElement) return;

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

   tooltipElement.innerHTML = html;

   var rect = e.target.getBoundingClientRect();
   tooltipElement.style.top = (rect.bottom + 5) + "px";
   tooltipElement.style.left = (rect.left + 10) + "px";

   tooltipElement.classList.add('visible');
}

function hideTooltip() {
   if (tooltipElement) {
      tooltipElement.classList.remove('visible');
   }
}

// Core Functions

function createNew() {
   // if (!discardUnsavedPack()) return; // Removed single pack check
   var newPack = new PackImage(null);
   newPack.filename = "Pack" + (packs.length + 1) + ".opk";
   packs.push(newPack);
   currentPack = newPack; // Make new pack active
   currentPackIndex = packs.length - 1;
   updateInventory();
   setStatus("New pack created");
}

function packSaved() {
   var packToSave = getActivePack();
   if (!packToSave) return;
   packToSave.unsaved = false;
   var url = packToSave.getURL();
   downloadFileFromUrl(packToSave.filename ? packToSave.filename : "packname.opk", url);
   setStatus("Pack saved");
   updateInventory(); // Update buttons
}

function exportHex() {
   var packToSave = getActivePack();
   if (!packToSave) return;
   var filename = (packToSave.filename ? packToSave.filename.replace(/\.[^/.]+$/, "") : "packname") + ".hex";
   var url = packToSave.getHexURL();
   downloadFileFromUrl(filename, url);
   setStatus("Hex exported");
}

function getActivePack() {
   if (currentPackIndex >= 0 && currentPackIndex < packs.length) {
      return packs[currentPackIndex];
   }
   if (selectedPackIndex >= 0 && selectedPackIndex < packs.length) {
      return packs[selectedPackIndex];
   }
   if (packs.length > 0) return packs[0];
   return null;
}

function downloadFileFromUrl(filename, url) {
   var a = document.createElement('a');
   a.href = url;
   a.download = filename;
   document.body.appendChild(a);
   a.click();
   document.body.removeChild(a);
}

function updateItemButtons(isDirty) {
   discardbutton.setActive(isDirty);
   applybutton.setActive(isDirty);

   var activePack = getActivePack();
   var hasPack = !!activePack;

   savepackbutton.setActive(!isDirty && hasPack);
   savehexbutton.setActive(!isDirty && hasPack);

   // Enable delete if an item is selected OR a pack header is selected
   var canDelete = (!isDirty && ((currentItem && currentItem.type >= 0) || selectedPackIndex >= 0));
   eraseitembutton.setActive(canDelete);

   newitembutton.setActive(!isDirty && hasPack);
   loaditembutton.setActive(!isDirty && hasPack);
}

function discardEdits() {
   if (currentEditor && currentItem) {
      currentEditor.initialise(currentItem);
      updateItemButtons(false);
      setStatus("Edits discarded");
   }
}

function applyEdits() {
   if (currentEditor && currentItem) {
      if (currentEditor.applyChanges()) {
         if (currentPackIndex >= 0 && currentPackIndex < packs.length) {
            packs[currentPackIndex].unsaved = true;
         }
         updateInventory();
         setStatus("Changes applied");
      } else {
         setStatus("No changes to apply");
      }
      updateItemButtons(false);
   }
}

function handleEditorMessage(msg, arg1, arg2) {
   if (msg == EditorMessage.CHANGEMADE) {
      updateItemButtons(true);
   }
   else if (msg == EditorMessage.GETFILEIDS) {
      return getDataFiles();
   }
   else if (msg == EditorMessage.CHANGEFILEID) {
      var fromtp = arg1 & 0x7f;
      var totp = arg2 & 0x7f;
      var pack = packs[currentPackIndex];
      if (!pack) return;
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
      var pack = packs[currentPackIndex];
      if (!pack) return;
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
   var pack = packs[currentPackIndex];
   if (!pack) return idlst;
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
   // With multiple packs, we might not need to discard everything.
   // But if we are closing the editor, we should check.
   if (!closeEditor()) return false;
   return true;
}

function updatePackChecksums(pack) {
   if (!pack) return;
   var data = pack.getRawData();
   pack.checksums = Checksums.calculate(data);
}

function updateInventory() {
   // clear inventory
   while (inventoryelement.firstChild) {
      inventoryelement.removeChild(inventoryelement.firstChild);
   }
   if (checksumselement) checksumselement.innerHTML = "";

   if (packs.length > 0) {
      // Update file info for the active pack
      var activePack = getActivePack();
      if (fileinfoelement) fileinfoelement.innerText = activePack ? (activePack.filename ? activePack.filename : "Untitled") : "No Pack Selected";

      // Checksum for active pack
      if (activePack && activePack.checksums && checksumselement) {
         checksumselement.innerText = "Sum: 0x" + activePack.checksums.sum.toString(16).toUpperCase().padStart(8, '0') +
            " CRC32: 0x" + activePack.checksums.crc32.toString(16).toUpperCase() +
            " MD5: " + activePack.checksums.md5;
      }

      // Render each pack
      for (var pIdx = 0; pIdx < packs.length; pIdx++) {
         var pack = packs[pIdx];

         // Recalculate checksums if dirty or missing
         if (pack.unsaved || !pack.checksums) {
            updatePackChecksums(pack);
         }

         // Pack Header
         var packHeader = document.createElement('div');
         packHeader.className = 'pack-header';
         if (pIdx === selectedPackIndex) {
            packHeader.classList.add('selected');
         }

         var icon = document.createElement('i');
         icon.className = 'fas fa-warehouse';
         icon.style.marginRight = '8px';

         // Tooltip Events
         (function (p) {
            icon.addEventListener('mouseenter', function (e) {
               showTooltip(e, p);
            });
            icon.addEventListener('mouseleave', function () {
               hideTooltip();
            });
         })(pack);

         var title = document.createElement('span');
         title.innerText = pack.filename ? pack.filename : "Untitled Pack " + (pIdx + 1);
         title.style.flexGrow = '1';

         // Collapse/Expand Toggle
         var toggle = document.createElement('i');
         toggle.className = 'fas fa-chevron-down pack-toggle';
         if (pack.collapsed) {
            toggle.className = 'fas fa-chevron-right pack-toggle';
         }

         packHeader.appendChild(icon);
         packHeader.appendChild(title);
         packHeader.appendChild(toggle);

         // Pack Header Click Events
         (function (idx) {
            packHeader.addEventListener('click', function (e) {
               // If clicking toggle
               if (e.target.classList.contains('pack-toggle')) {
                  packs[idx].collapsed = !packs[idx].collapsed;
                  updateInventory();
                  e.stopPropagation();
                  return;
               }

               // Select Pack
               selectPack(idx);
            });

            // Double click to rename
            title.addEventListener('dblclick', function (e) {
               e.stopPropagation();
               var input = document.createElement('input');
               input.type = 'text';
               input.value = packs[idx].filename ? packs[idx].filename : "Pack" + (idx + 1) + ".opk";
               input.style.width = '150px';

               function saveName() {
                  var newName = input.value.trim();
                  if (newName) {
                     if (!newName.toLowerCase().endsWith(".opk")) {
                        newName += ".opk";
                     }
                     packs[idx].filename = newName;
                     packs[idx].unsaved = true;
                  }
                  updateInventory();
               }

               input.addEventListener('blur', saveName);
               input.addEventListener('keydown', function (e) {
                  if (e.key === 'Enter') {
                     saveName();
                  }
               });

               title.innerHTML = '';
               title.appendChild(input);
               input.focus();
            });
         })(pIdx);

         inventoryelement.appendChild(packHeader);

         // Pack Contents Container
         if (!pack.collapsed) {
            var packContents = document.createElement('ul');
            packContents.className = 'pack-contents';
            packContents.style.paddingLeft = '20px'; // Indentation

            var pl = Math.max(4, pack.getLength().toString(16).length);
            var ix = 0;
            var items = pack.items;

            for (var i = 0; i < items.length; i++) {
               var item = document.createElement('li');
               var s = ("000000" + ix.toString(16).toUpperCase()).substr(-pl) + " ";
               s += (items[i].name + "        ").substr(0, 8) + " ";
               s += items[i].desc;
               item.innerText = s;
               item.draggable = true; // Enable drag

               if (currentItem == items[i]) {
                  item.classList.add('selected');
               }

               // Event listener for selection
               (function (packIndex, itemIndex) {
                  item.addEventListener('click', function (e) {
                     e.stopPropagation();
                     itemSelected(packIndex, itemIndex);
                  });

                  // Drag Events
                  item.addEventListener('dragstart', function (e) {
                     handleDragStart(e, packIndex, itemIndex);
                  });
                  item.addEventListener('dragover', handleDragOver);
                  item.addEventListener('drop', function (e) {
                     handleDrop(e, packIndex, itemIndex);
                  });
                  item.addEventListener('dragenter', handleDragEnter);
                  item.addEventListener('dragleave', handleDragLeave);
                  item.addEventListener('dragend', handleDragEnd);

               })(pIdx, i);

               packContents.appendChild(item);
               ix += items[i].getLength();
            }

            // End of Pack Item
            var endItem = document.createElement('li');
            var s = ("000000" + ix.toString(16).toUpperCase()).substr(-pl) + "          End of Pack";
            endItem.innerText = s;
            // Allow dropping on End of Pack (append to end)
            (function (packIndex, itemIndex) {
               endItem.addEventListener('dragover', handleDragOver);
               endItem.addEventListener('drop', function (e) {
                  handleDrop(e, packIndex, itemIndex);
               });
               endItem.addEventListener('dragenter', handleDragEnter);
               endItem.addEventListener('dragleave', handleDragLeave);
            })(pIdx, items.length); // itemIndex = length means append

            packContents.appendChild(endItem);
            inventoryelement.appendChild(packContents);

            // Check pack size logic
            var sz = 1;
            while (sz * 8192 < ix) sz *= 2;
            var pksz = items[0].data[1];
            if (pksz < sz) {
               items[0].data[1] = sz;
               // alert("Pack size has been increased to " + (sz * 8) + "k"); // Suppress alert during render loop
            }
         }
      }

      // Checksum for active pack
      if (activePack && activePack.checksums && checksumselement) {
         checksumselement.innerText = "Sum: 0x" + activePack.checksums.sum.toString(16).toUpperCase() +
            " CRC32: 0x" + activePack.checksums.crc32.toString(16).toUpperCase() +
            " MD5: " + activePack.checksums.md5;
      }

   } else {
      var item = document.createElement('li');
      item.innerHTML = "<i>No OPK file loaded</i>";
      inventoryelement.appendChild(item);
      if (fileinfoelement) fileinfoelement.innerText = "No file selected";
   }

   updateItemButtons(false);
}

// Drag and Drop Logic
var dragSrcInfo = null;

function handleDragStart(e, packIndex, itemIndex) {
   dragSrcInfo = { packIndex: packIndex, itemIndex: itemIndex };
   e.dataTransfer.effectAllowed = 'copyMove';
   e.dataTransfer.setData('text/html', e.target.outerHTML); // Required for Firefox
   e.target.classList.add('dragElem');
}

function handleDragOver(e) {
   if (e.preventDefault) e.preventDefault();
   e.dataTransfer.dropEffect = e.ctrlKey ? 'copy' : 'move';
   this.classList.add('over');
   return false;
}

function handleDragEnter(e) {
   this.classList.add('over');
}

function handleDragLeave(e) {
   this.classList.remove('over');
}

function handleDrop(e, toPackIndex, toItemIndex) {
   if (e.stopPropagation) e.stopPropagation();

   if (dragSrcInfo) {
      itemMoved(dragSrcInfo.packIndex, dragSrcInfo.itemIndex, toPackIndex, toItemIndex, e.ctrlKey);
   }

   return false;
}

function handleDragEnd(e) {
   var cols = document.querySelectorAll('#pack-list li');
   [].forEach.call(cols, function (col) {
      col.classList.remove('over');
      col.classList.remove('dragElem');
   });
   dragSrcInfo = null;
}


function closeEditor() {
   if (currentEditor) {
      if (currentEditor.hasUnsavedChanges()) {
         var discard = window.confirm("Not all changes have been saved.\nIs it ok to discard those changes?");
         if (!discard) return false;
      }
      currentEditor.finish();
      currentEditor = null;

      // Clear editors
      legacyEditorElement.innerHTML = "";
      if (codeEditorElement) codeEditorElement.style.display = 'none';
      legacyEditorElement.style.display = 'none';
   }
   return true;
}

function getItemAddres(pack, ix) {
   var addr = 0;
   for (var i = 0; i < ix; i++) {
      addr += pack.items[i].getLength();
   }
   return addr;
}

function clonePackItem(item) {
   var newItem = new PackItem(item.data, 0, item.data.length);
   newItem.setDescription();
   if (item.child) {
      newItem.child = clonePackItem(item.child);
   }
   return newItem;
}

function itemMoved(fromPackIx, fromItemIx, toPackIx, toItemIx, isCopy) {
   // Prevent moving to same position if not copying
   if (!isCopy && fromPackIx === toPackIx && fromItemIx === toItemIx) return;

   var fromPack = packs[fromPackIx];
   var toPack = packs[toPackIx];

   if (!fromPack || !toPack) return;

   var item = fromPack.items[fromItemIx];

   // Logic for boot offset if moving within same pack (preserved from original)
   var bootOffset = -1;
   if (!isCopy && fromPackIx === toPackIx) {
      if (item.type == 0 && (fromPack.items[0].data[0] & 0x10) == 0) {
         var addr1 = getItemAddres(fromPack, fromItemIx);
         var addr2 = (fromPack.items[0].data[6] << 8) + fromPack.items[0].data[7];
         if (addr2 >= addr1 && addr2 < addr1 + item.getLength()) {
            bootOffset = addr2 - addr1;
         }
      }
   }

   if (isCopy) {
      item = clonePackItem(item);
   } else {
      // Remove from source
      fromPack.items.splice(fromItemIx, 1);

      // Adjust destination index if in same pack and moving down
      if (fromPackIx === toPackIx && fromItemIx < toItemIx) {
         toItemIx--;
      }
      fromPack.unsaved = true;
   }

   // Insert into destination
   toPack.items.splice(toItemIx, 0, item);

   // Update boot offset if applicable
   if (bootOffset >= 0 && fromPackIx === toPackIx) {
      var addr = getItemAddres(toPack, toItemIx) + bootOffset;
      toPack.items[0].data[6] = (addr >> 8) & 0xff;
      toPack.items[0].data[7] = addr & 0xff;
   }

   toPack.unsaved = true;

   updateInventory();
}

function selectPack(index) {
   if (!closeEditor()) return;
   selectedPackIndex = index;
   currentPackIndex = index; // Also make it the active pack for adding items
   currentItem = null; // Deselect item
   updateInventory();
}

function itemSelected(packIndex, itemIndex) {
   var pack = packs[packIndex];
   var isok = itemIndex >= 0 && itemIndex < pack.items.length;
   if (!isok) return false;

   if (currentItem == pack.items[itemIndex]) return true;

   if (!closeEditor()) return false;

   currentPackIndex = packIndex;
   selectedPackIndex = -1; // Deselect pack header
   currentItem = pack.items[itemIndex];
   var tp = currentItem.type;

   var i = 0;
   while (i < editors.length && !editors[i].acceptsType(tp)) {
      i++;
   }
   if (i < editors.length) {
      currentEditor = editors[i];
      // Show editor container
      legacyEditorElement.style.display = 'block';
      currentEditor.initialise(currentItem);
   } else {
      console.warn("No editor found for type " + tp);
   }

   updateInventory(); // To update selection highlight
   updateItemButtons(false);
   return true;
}

function canLoadPack(e) {
   if (!discardUnsavedPack()) {
      e.preventDefault();
   }
}

function fileChosen() {
   var files = loadpackbutton.getFiles();
   if (files.length != 0) {
      var file = files[0];
      var fname = file.name.toLowerCase();
      if (fname.endsWith(".hex") || fname.endsWith(".ihx")) {
         var reader = new FileReader();
         reader.onload = function (e) {
            try {
               var binary = parseIntelHexToBinary(e.target.result);
               var len = binary.length;
               var header = new Uint8Array(6);
               header[0] = 0x4F; header[1] = 0x50; header[2] = 0x4B;
               header[3] = (len >> 16) & 0xFF;
               header[4] = (len >> 8) & 0xFF;
               header[5] = len & 0xFF;

               var opkData = new Uint8Array(6 + len + 2);
               opkData.set(header, 0);
               opkData.set(binary, 6);
               opkData[6 + len] = 0xFF;
               opkData[6 + len + 1] = 0xFF;

               var newPack = new PackImage(opkData);
               newPack.unsaved = false;
               newPack.filename = file.name.replace(/\.[^/.]+$/, "") + ".opk";

               packs.push(newPack);
               currentPackIndex = packs.length - 1;

               updatePackChecksums(newPack); // Calculate checksums
               updateInventory();

               setStatus("Loaded HEX file: " + newPack.filename);
            } catch (err) {
               alert("Error parsing HEX file: " + err.message);
            }
         };
         reader.readAsText(file);
      } else {
         LoadLocalBinaryFile(files[0],
            function (data, nm) {
               var newPack = new PackImage(data);
               newPack.unsaved = false;
               newPack.filename = nm;

               packs.push(newPack);
               currentPackIndex = packs.length - 1;

               updatePackChecksums(newPack); // Calculate checksums
               updateInventory();

               setStatus("Loaded OPK file: " + nm);
            }
         );
      }
   }
}

function eraseItem() {
   // If a pack header is selected, delete the pack
   if (selectedPackIndex >= 0) {
      var discard = window.confirm("Are you sure you want to close/remove this pack?");
      if (!discard) return;

      if (!closeEditor()) return;

      packs.splice(selectedPackIndex, 1);
      selectedPackIndex = -1;
      currentPackIndex = packs.length > 0 ? 0 : -1;
      updateInventory();
      return;
   }

   if (!currentItem) return;
   if (currentItem.type < 0) return;

   var pack = packs[currentPackIndex];
   if (!pack) return;

   if (!currentItem.deleted) {
      var discard = window.confirm("Are you sure you want to erase " + (currentItem.name ? currentItem.name : "this item") + " from the pack?");
      if (!discard) return false;
   }
   if (!closeEditor()) return false;

   var items = pack.items;
   var i = items.indexOf(currentItem);
   if (i < 0) return;
   pack.unsaved = true;
   items.splice(i, 1);
   if (currentItem.type == 1) {
      var fileid = currentItem.data[10] - 0x80;
      for (var i = items.length - 1; i > 0; i--) {
         if (items[i].type == fileid)
            items.splice(i, 1);
      }
   }
   currentItem = null;
   updateInventory();
}

var availableTypes = {
   1: "Data file",
   3: "Procedure",
   7: "Notepad",
};
function createNewItem() {
   var pack = packs[currentPackIndex];
   if (!pack) {
      alert("Please select a pack first.");
      return;
   }

   var element = document.createElement('div');
   element.innerHTML =
      "<div>Select type to add:</div>" +
      "<div><select id=choosetype>" +
      "</select>";

   var sel = element.querySelector("#choosetype");

   var chooseTypeScreen = new ModalDialog(element, function () {
      var type = parseInt(sel.value);
      if (type == 1) {
         var id = getFreeFileId();
         if (id <= 0) return;
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
   });

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
   chooseTypeScreen.start();
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
   var pack = packs[currentPackIndex];
   if (!pack) return;

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
   // ... (logic preserved) ...
   // check if it is a valid binary file, "ORG"+type
   if (filedata[0] == 79 && filedata[1] == 82 && filedata[2] == 71 && filedata[5] >= 0x82 && filedata[5] <= 0x8f) {
      var type = filedata[5] - 0x80;
      var ln = (filedata[3] << 8) + filedata[4];
      if (filedata.length < 6 + ln) {
         alert("The file " + name + " seems to be truncated!");
         return;
      }
      var hdritem = createFileHeader(name, type, 0);
      var blkhdr = new Uint8Array(4);
      blkhdr[0] = 2; blkhdr[1] = 0x80; blkhdr[2] = filedata[3]; blkhdr[3] = filedata[4];
      var dataitem = new PackItem(filedata, 6, ln);
      var blkhdritem = new PackItem(blkhdr, 0, 4);
      blkhdritem.child = dataitem;
      blkhdritem.setDescription();
      hdritem.child = blkhdritem;
      addItemToPack(hdritem);
      updateInventory();
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
      var blkhdr = new Uint8Array(4);
      blkhdr[0] = 2; blkhdr[1] = 0x80; blkhdr[2] = filedata[0x1d]; blkhdr[3] = filedata[0x1e];
      var dataitem = new PackItem(filedata, 0x1f, ln2);
      var blkhdritem = new PackItem(blkhdr, 0, 4);
      blkhdritem.child = dataitem;
      blkhdritem.setDescription();
      addItemToPack(blkhdritem);
      updateInventory();

      var pack = packs[currentPackIndex];
      if (pack.items.length == 3) {
         var makeBoot = window.confirm("Do you want this to be used as boot code?");
         if (makeBoot) {
            var hdata = pack.items[0].data;
            hdata[2] = 0; hdata[3] = filedata[9]; hdata[4] = filedata[10]; hdata[5] = filedata[11];
            hdata[6] = filedata[12]; hdata[7] = filedata[13];
            hdata[0] &= 0xEF;
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
   } else if (name.substr(-4).toUpperCase() == ".OPL") {
      var hdritem = createFileHeader(name, 3, 0);
      var ln = filedata.length + 6;
      var blkhdr = new Uint8Array(4);
      blkhdr[0] = 2; blkhdr[1] = 0x80; blkhdr[2] = (ln >> 8) & 0xff; blkhdr[3] = ln & 0xff;
      var itemdata = new Uint8Array(6 + filedata.length);
      itemdata[0] = 0; itemdata[1] = 0;
      itemdata[2] = (filedata.length >> 8) & 0xff; itemdata[3] = filedata.length & 0xff;
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
   } else if (name.substr(-4).toUpperCase() == ".ODB") {
      var id = getFreeFileId();
      if (id <= 0) return;
      var hdritem = createFileHeader(name, 1, id + 0x8f);
      addItemToPack(hdritem);
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
   } else if (name.substr(-4).toUpperCase() == ".NTS") {
      var hdritem = createFileHeader(name, 7, 0);
      var ln = filedata.length + 6;
      var blkhdr = new Uint8Array(4);
      blkhdr[0] = 2; blkhdr[1] = 0x80; blkhdr[2] = (ln >> 8) & 0xff; blkhdr[3] = ln & 0xff;
      var itemdata = new Uint8Array(6 + filedata.length);
      itemdata[0] = 0; itemdata[1] = 2; itemdata[2] = 8; itemdata[3] = 0;
      itemdata[4] = (filedata.length >> 8) & 0xff; itemdata[5] = filedata.length & 0xff;
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
   var hdr = new Uint8Array(11);
   hdr[0] = 9;
   hdr[1] = type + 0x80;
   hdr[2] = id;
   for (var i = 0; i < 8; i++) {
      hdr[3 + i] = name.charCodeAt(i);
   }
   var item = new PackItem(hdr, 0, 11);
   item.setDescription();
   return item;
}

function addItemToPack(item) {
   var pack = packs[currentPackIndex];
   if (!pack) return;

   var items = pack.items;
   items.splice(items.length - 1, 0, item);
   pack.unsaved = true;
}

function setStatus(msg) {
   if (statusmessageelement) {
      statusmessageelement.innerText = msg;
      // Clear after 3 seconds
      setTimeout(function () {
         if (statusmessageelement.innerText == msg) {
            statusmessageelement.innerText = "";
         }
      }, 3000);
   }
}

// Helper to convert hex string to binary
function parseIntelHexToBinary(hexString) {
   var lines = hexString.split('\n');
   var binary = new Uint8Array(0);
   var currentAddr = 0;

   for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (line.length == 0 || line[0] != ':') continue;

      var byteCount = parseInt(line.substr(1, 2), 16);
      var addr = parseInt(line.substr(3, 4), 16);
      var recordType = parseInt(line.substr(7, 2), 16);

      if (recordType == 0) { // Data
         var data = new Uint8Array(byteCount);
         for (var j = 0; j < byteCount; j++) {
            data[j] = parseInt(line.substr(9 + j * 2, 2), 16);
         }

         // Simple append for now, assuming sequential hex
         var newBinary = new Uint8Array(binary.length + data.length);
         newBinary.set(binary);
         newBinary.set(data, binary.length);
         binary = newBinary;
      } else if (recordType == 1) { // EOF
         break;
      }
   }
   return binary;
}

// Start the application
init();
