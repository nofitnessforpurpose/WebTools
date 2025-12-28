'use strict';

/**
 * Architecture: Main Controller
 * -----------------------------
 * This file acts as the central orchestrator for the application.
 * 
 * Responsibilities:
 * 1. Initialization: Sets up the application state, UI event listeners, and default pack.
 * 2. State Management: Tracks the currently loaded pack (`currentPack`) and the active file (`currentFile`).
 * 3. View Management: Switches between the "Pack Contents" list and specific "File Editors".
 * 4. Event Handling: Receives messages from editors via `handleEditorMessage` and performs actions (save, rename, etc.).
 */


// Button Helper Class
function Button(id, clickcallback, inputId, filecallback) {
   var _element = document.getElementById(id);
   if (!_element) {
      // 
      // // 
//       console.warn("Button not found: " + id);
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

// Global State - Proxied to AppStore
Object.defineProperty(window, 'packs', { get: function () { return AppStore.state.packs; }, set: function (v) { AppStore.state.packs = v; } });
Object.defineProperty(window, 'currentPack', { get: function () { return AppStore.state.currentPack; }, set: function (v) { AppStore.state.currentPack = v; } });
Object.defineProperty(window, 'currentEditor', { get: function () { return AppStore.state.currentEditor; }, set: function (v) { AppStore.state.currentEditor = v; } });
Object.defineProperty(window, 'currentItem', { get: function () { return AppStore.state.currentItem; }, set: function (v) { AppStore.state.currentItem = v; } });
Object.defineProperty(window, 'currentPackIndex', { get: function () { return AppStore.state.currentPackIndex; }, set: function (v) { AppStore.state.currentPackIndex = v; } });
Object.defineProperty(window, 'selectedPackIndex', { get: function () { return AppStore.state.selectedPackIndex; }, set: function (v) { AppStore.state.selectedPackIndex = v; } });

// Multi-Selection State
var selectedItems = [];
var lastFocusedItemIndex = -1;


Object.defineProperty(window, 'syntaxHighlightingEnabled', { get: function () { return AppStore.state.syntaxHighlightingEnabled; }, set: function (v) { AppStore.state.syntaxHighlightingEnabled = v; } });
var decompilerLogWindow;
var variableStorageWindow;
var saveTimer = null;

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
   new CommsSetupEditor(legacyEditorElement, handleEditorMessage),
   new ProcedureFileEditor(legacyEditorElement, codeEditorElement, handleEditorMessage),
   new LZNotepadFileEditor(legacyEditorElement, codeEditorElement, handleEditorMessage),
   new SpreadsheetFileEditor(legacyEditorElement, handleEditorMessage),
   new PagerSetupFileEditor(legacyEditorElement, handleEditorMessage),
   new DiaryFileEditor(legacyEditorElement, handleEditorMessage),
   new RecordEditor(legacyEditorElement, handleEditorMessage),
   new HexEditor(legacyEditorElement, handleEditorMessage, [4, 8, 9, 10, 11, 12, 13, 14, 15]),
   new MemoryMapEditor(legacyEditorElement, handleEditorMessage)
];

// Buttons
var discardbutton = new Button("btn-discard", discardEdits);
var applybutton = new Button("btn-apply", applyEdits);
var eraseitembutton = new Button("btn-delete-item", eraseItem);
var optionsbutton = new Button("btn-options", function () { DialogManager.showOptionsDialog(); });

// Init File Inputs (Manually since Button helpers removed)
var fileInputPack = document.getElementById("file-input-pack");
if (fileInputPack) fileInputPack.addEventListener('change', fileChosen);

var fileInputItem = document.getElementById("file-input-item");
if (fileInputItem) fileInputItem.addEventListener('change', itemChosen);

// Menu Manager
var registeredMenus = [];

function registerMenu(buttonId, menuId, onOpenCallback) {
   var btn = document.getElementById(buttonId);
   var menu = document.getElementById(menuId);

   if (btn && menu) {
      var menuObj = {
         id: menuId,
         btn: btn,
         menu: menu,
         onOpen: onOpenCallback
      };

      registeredMenus.push(menuObj);

      btn.addEventListener('click', function (e) {
         e.preventDefault();
         e.stopPropagation();
         toggleMenu(menuId);
      });

      // Prevent clicks inside menu from closing it immediately (unless it's a link action)
      menu.addEventListener('click', function (e) {
         e.stopPropagation();
      });
   }
}

function toggleMenu(menuId) {
   registeredMenus.forEach(function (m) {
      if (m.id === menuId) {
         var isOpening = !m.menu.classList.contains('show');

         if (isOpening) {
            // Open this menu
            m.menu.classList.add('show');
            m.btn.classList.add('active');
            if (m.onOpen) m.onOpen();

            // Auto-focus first enabled item
            setTimeout(function () {
               var firstLink = m.menu.querySelector('a:not(.disabled)');
               if (firstLink) firstLink.focus();
            }, 0);
         } else {
            // Close this menu
            m.menu.classList.remove('show');
            m.btn.classList.remove('active');
         }
      } else {
         // Close others
         m.menu.classList.remove('show');
         m.btn.classList.remove('active');
      }
   });
}

function closeAllMenus() {
   registeredMenus.forEach(function (m) {
      m.menu.classList.remove('show');
      m.btn.classList.remove('active');
   });
}

// Global Click Listener for Menus
window.addEventListener('click', function (e) {
   // If clicking outside of any registered menu button, close all
   // (Inner menu clicks are stopped by stopPropagation in registerMenu, 
   // except for links which bubble up or are handled directly)
   closeAllMenus();
});

// Register Menus
// Register Menus
registerMenu('btn-file-menu', 'file-dropdown', populateFileMenu);
registerMenu('btn-help', 'help-dropdown');


// Static New Menu Handlers
if (document.getElementById('menu-new-pack')) {
   document.getElementById('menu-new-pack').addEventListener('click', function (e) {
      e.preventDefault();
      createNew(e);
      closeAllMenus();
   });

   document.getElementById('menu-new-proc').addEventListener('click', function (e) {
      e.preventDefault();
      if (this.classList.contains('disabled')) return;
      var data = [0x00, 0x00, 0x00, 0x0A, 80, 82, 79, 67, 78, 65, 77, 69, 58, 0];
      createBlockFile(data, "PROCNAME", 3);
      closeAllMenus();
   });

   document.getElementById('menu-new-notepad').addEventListener('click', function (e) {
      e.preventDefault();
      if (this.classList.contains('disabled')) return;
      var data = [0x00, 0x02, 8, 0, 0x00, 0x09, 78, 79, 84, 69, 80, 65, 68, 58, 0];
      createBlockFile(data, "NOTEPAD", 7);
      closeAllMenus();
   });

   document.getElementById('menu-new-datafile').addEventListener('click', function (e) {
      e.preventDefault();
      if (this.classList.contains('disabled')) return;
      var id = getFreeFileId();
      if (id > 0) {
         var hdritem = createFileHeader("DATAFILE", 1, id + 0x8f);
         addItemToPack(hdritem);
         updateInventory();
      }
      closeAllMenus();
   });
}

// Open/Save Populators removed (merged into populateFileMenu)

// Open Menu Handlers
if (document.getElementById('menu-open-pack')) {
   document.getElementById('menu-open-pack').addEventListener('click', function (e) {
      e.preventDefault();
      if (fileInputPack) fileInputPack.click(); // Trigger hidden input
      closeAllMenus();
   });

   document.getElementById('menu-import-item').addEventListener('click', function (e) {
      e.preventDefault();
      if (this.classList.contains('disabled')) return;
      if (fileInputItem) fileInputItem.click(); // Trigger hidden input
      closeAllMenus();
   });
}

// Save Menu Handlers
if (document.getElementById('menu-save-pack')) {
   document.getElementById('menu-save-pack').addEventListener('click', function (e) {
      e.preventDefault();
      if (this.classList.contains('disabled')) return;
      packSaved();
      closeAllMenus();
   });

   document.getElementById('menu-export-hex').addEventListener('click', function (e) {
      e.preventDefault();
      if (this.classList.contains('disabled')) return;
      exportHex();
      closeAllMenus();
   });

   document.getElementById('menu-export-item').addEventListener('click', function (e) {
      e.preventDefault();
      if (this.classList.contains('disabled')) return;
      exportCurrentItem();
      closeAllMenus();
   });
}


function populateFileMenu() {
   var packOpen = (currentPackIndex >= 0);
   var itemSelected = (currentItem !== null && currentItem !== undefined);

   // Update Save/Export States
   var packIds = ['menu-save-pack', 'menu-export-hex', 'menu-open-pack']; // Open Pack is always enabled anyway
   packIds.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
         if (packOpen) el.classList.remove('disabled');
         else el.classList.add('disabled');
      }
   });

   // Open Pack shouldn't be disabled actually, user can always open a pack.
   var openPackEl = document.getElementById('menu-open-pack');
   if (openPackEl) openPackEl.classList.remove('disabled');

   // Import/Export Item
   var itemIds = ['menu-export-item'];
   // Import Item requires a Pack to be open
   var importItemEl = document.getElementById('menu-import-item');
   if (importItemEl) {
      if (packOpen) importItemEl.classList.remove('disabled');
      else importItemEl.classList.add('disabled');
   }

   // Export Item requires an Item selected
   var exportItemEl = document.getElementById('menu-export-item');
   if (exportItemEl) {
      if (itemSelected) exportItemEl.classList.remove('disabled');
      else exportItemEl.classList.add('disabled');
   }

   // Update Static New Items

   var staticIds = ['menu-new-proc', 'menu-new-notepad', 'menu-new-datafile'];
   staticIds.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
         if (packOpen) el.classList.remove('disabled');
         else el.classList.add('disabled');
      }
   });

   // Dynamic Items
   var container = document.getElementById('new-dynamic-container');
   var separator = document.getElementById('new-dynamic-separator');
   if (!container) return;

   container.innerHTML = '';
   if (separator) separator.style.display = 'none';

   if (packOpen) {
      var files = getDataFiles();
      var hasFiles = false;

      // Check if we have any valid files to add records to
      for (var i = 1; i < 110; i++) {
         if (files[i]) {
            hasFiles = true;
            break;
         }
      }

      if (hasFiles) {
         if (separator) separator.style.display = 'block';

         // Add generic "New Record..." item
         var a = document.createElement('a');
         a.href = "#";
         a.innerHTML = '<i class="fas fa-table-list" style="width: 20px;"></i> New Record...';
         a.addEventListener('click', function (e) {
            e.preventDefault();
            closeAllMenus();
            createNewRecord();
         });
         container.appendChild(a);
      }
   }
}

// Help Menu Handlers (Now handled by RegisterMenu but need static listeners for items)
var menuAbout = document.getElementById('menu-about');
if (menuAbout) {
   menuAbout.addEventListener('click', function (e) {
      e.preventDefault();
      showAboutDialog();
      closeAllMenus();
   });
}

var menuOplRef = document.getElementById('menu-opl-ref');
if (menuOplRef) {
   menuOplRef.addEventListener('click', function (e) {
      e.preventDefault();
      if (typeof OPLCommandReference !== 'undefined') {
         new OPLCommandReference().open();
      } else {
         console.error("OPLCommandReference not loaded");
      }
      closeAllMenus();
   });
}
// Dialog Functions
// Delegated to DialogManager.js


function showAboutDialog(isSplash) {
   var element = document.createElement('div');
   element.innerHTML =
      "<div style='text-align: center; padding: 20px;'>" +
      "<img src='assets/pics/logo.gif' alt='Psion Logo' style='width: 25%; margin-bottom: 15px;'>" +
      "<h2 style='margin-top: 0;'>OPK Editor 3</h2>" +
      "<p>A modern editor for Psion Organiser II packs.</p>" +
      "<p>Version " + APP_VERSION + "</p>" +
      "<hr style='margin: 15px auto; width: 80%; border: 0; border-top: 1px solid #ccc;'>" +
      "<p>Original by <b>Jaap Scherphuis</b></p>" +
      "<p>Icons by <b>Font Awesome</b></p>" +
      "<p>Implemented with precision by <b>Antigravity</b>.</p>" +
      "<p>Reimagined by <b>NFfP</b>.</p>" +
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
   var params = new URLSearchParams(window.location.search);
   if (params.get('mode') === 'child') {
      initChildMode(params.get('feature'));
      return;
   }

   initIconToolbar();
   decompilerLogWindow = new DecompilerLogWindow();
   variableStorageWindow = new VariableStorageWindow();
   updateInventory();

   if (OptionsManager.getOption('showSplashScreen') !== false) {
      showAboutDialog(true);
   }

   // Apply Initial Options
   var packList = document.getElementById('pack-list');
   if (OptionsManager.getOption('showAddresses')) {
      packList.classList.add('show-addresses');
   }
   if (!OptionsManager.getOption('showGuidelines')) {
      packList.classList.add('hide-guidelines');
   }

   // Restore Opened Packs
   if (OptionsManager.getOption('restorePacks')) {


      // Migration: Check for legacy single pack and move to list
      var legacy = localStorage.getItem('opkedit_cached_pack');
      if (legacy) {
         try {
            var lData = JSON.parse(legacy);
            var existingPacks = [];
            try { existingPacks = JSON.parse(localStorage.getItem('opkedit_cached_packs') || '[]'); } catch (e) { console.warn("Failed to load cached packs:", e); }

            // Avoid duplicates during migration
            var exists = false;
            for (var k = 0; k < existingPacks.length; k++) { if (existingPacks[k].name === lData.name) exists = true; }

            if (!exists) {
               existingPacks.push(lData);
               localStorage.setItem('opkedit_cached_packs', JSON.stringify(existingPacks));

            }
            localStorage.removeItem('opkedit_cached_pack');
         } catch (e) {
            // 
            // // 
//             console.warn("Restore Packs: Legacy migration failed", e);
         }
      }

      var cachedPacks = [];
      try {
         var stored = localStorage.getItem('opkedit_cached_packs');
         if (stored) cachedPacks = JSON.parse(stored);
      } catch (e) { console.error("Error in loadSession:", e); }

      if (cachedPacks.length > 0) {


         cachedPacks.forEach(function (packData) {
            try {
               // Decode Base64
               var binaryString = atob(packData.data);
               var len = binaryString.length;
               var bytes = new Uint8Array(len);
               for (var i = 0; i < len; i++) {
                  bytes[i] = binaryString.charCodeAt(i);
               }

               var newPack = new PackImage(bytes);
               newPack.unsaved = false;
               newPack.filename = packData.name;

               packs.push(newPack);
               updatePackChecksums(newPack);

            } catch (e) {
               console.error("Restore Packs: Failed to load cached pack " + packData.name, e);
            }
         });

         if (packs.length > 0) {
            currentPackIndex = 0;
            selectedPackIndex = 0;
            updateInventory();
            setStatus("Restored " + packs.length + " pack(s).");
         }
      }
   } else {

   }

   // Global Theme Change Listener
   window.addEventListener('themeChanged', function (e) {
      if (currentEditor instanceof MemoryMapEditor) {
         currentEditor.initialise(currentEditor.item);
      }
      // Also update syntax highlighting if needed (handled by CSS vars usually, but editor might need redraw)
      if (currentEditor && currentEditor.codeEditorInstance) {
         // Force update/redraw if the code editor supports it
      }
   });
}

// Core Functions

function createNew(e) {
   if (typeof HexViewer !== 'undefined') HexViewer.close();

   // Create Size Selection Dialog
   var element = document.createElement('div');
   element.innerHTML =
      "<div>Select Pack Size:</div>" +
      "<div><select id='packsize'>" +
      "<option value='1'>8 KB (Standard)</option>" +
      "<option value='2'>16 KB</option>" +
      "<option value='3'>32 KB</option>" +
      "<option value='4'>64 KB</option>" +
      "<option value='5'>128 KB</option>" +
      "</select></div>";

   var sel = element.querySelector("#packsize");
   var sizeDialog = new ModalDialog(element, function () {
      var sizeCode = parseInt(sel.value);
      if (sizeCode >= 1 && sizeCode <= 5) {
         var newPack = new PackImage(null, sizeCode);
         newPack.filename = "Pack" + (packs.length + 1) + ".opk";
         packs.push(newPack);
         currentPack = newPack; // Make new pack active
         currentPackIndex = packs.length - 1;
         updateInventory();
         setStatus("New " + (8 * Math.pow(2, sizeCode - 1)) + "KB pack created");
      }
   });

   sizeDialog.start();
   // Focus select
   sel.focus();
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

function exportCurrentItem() {
   var pack = packs[currentPackIndex];
   if (!pack || !currentItem) return;

   var filename = "item.bin";
   if (currentItem.name) {
      filename = currentItem.name.trim();
   }

   // Heuristic for extension
   var type = currentItem.type;
   if (type === 1) filename += ".odb";
   else if (type >= 2 && type <= 15) {
      filename += ".OB" + type.toString(16).toUpperCase();
   } else if (type >= 16) filename += ".odb";
   else if (!filename.match(/\.[a-z0-9]{3}$/i)) filename += ".bin";

   var userFilename = prompt("Save item as:", filename);
   if (userFilename) {
      var url = pack.getItemURL(currentItem);
      if (url) {
         downloadFileFromUrl(userFilename, url);
      } else {
         alert("Cannot export this item type (id: " + type + "). Only standard files (OPL, ODB, Notepad, etc) are supported.");
      }
   }
}

function updateItemButtons(isDirty) {
   discardbutton.setActive(isDirty);
   applybutton.setActive(isDirty);

   var activePack = getActivePack();
   var hasPack = !!activePack;

   // Check Menu States (handled on open mostly, but can force check if needed)
   // savepackbutton.setActive... REMOVED
   // savehexbutton.setActive... REMOVED
   // newitembutton.setActive... REMOVED
   // loaditembutton.setActive... REMOVED

   // Enable delete if an item is selected OR a pack header is selected
   var canDelete = (!isDirty && ((currentItem && currentItem.type >= 0) || selectedPackIndex >= 0));
   eraseitembutton.setActive(canDelete);

   // Sync Icon Toolbar
   if (toolbarButtons) {
      toolbarButtons.btnNewPack.setActive(!isDirty);
      toolbarButtons.btnOpenPack.setActive(!isDirty);
      toolbarButtons.btnSavePack.setActive(hasPack);
      toolbarButtons.btnImportItem.setActive(hasPack && !isDirty);
      toolbarButtons.btnExportItem.setActive(!!currentItem && !isDirty);
      toolbarButtons.btnNewProc.setActive(hasPack && !isDirty);
      toolbarButtons.btnNewNotepad.setActive(hasPack && !isDirty);
      toolbarButtons.btnNewData.setActive(hasPack && !isDirty);
      toolbarButtons.btnDelete.setActive(canDelete);
      toolbarButtons.btnApply.setActive(isDirty);
      toolbarButtons.btnApply.setActive(isDirty);
      toolbarButtons.btnDiscard.setActive(isDirty);

      // Check for Procedures
      var hasProcs = false;
      if (typeof selectedItems !== 'undefined' && selectedItems.length > 0) {
         hasProcs = selectedItems.some(function (it) { return it.type === 3 && !it.deleted; });
      } else if (currentItem && currentItem.type === 3 && !currentItem.deleted) {
         hasProcs = true;
      }
      toolbarButtons.btnCopyObj.setActive(hasProcs && !isDirty);

      toolbarButtons.btnAbout.setActive(true);
      toolbarButtons.btnMaxMin.setActive(true);
      toolbarButtons.btnOptions.setActive(true);
      toolbarButtons.btnOplRef.setActive(true);

      var hasActivePack = hasPack && !isDirty;
      toolbarButtons.btnPackHeader.setActive(hasActivePack);
      toolbarButtons.btnMemoryMap.setActive(hasActivePack);
      toolbarButtons.btnVisualizer.setActive(hasActivePack);
   }
}

var toolbarButtons = null;

function initIconToolbar() {
   var container = document.getElementById('icon-toolbar');
   if (!container) return;

   container.innerHTML = '';

   function createToolbarBtn(id, icon, title, callback) {
      var btn = document.createElement('button');
      btn.className = 'tool-btn';
      btn.id = id;
      btn.title = title;
      btn.innerHTML = '<i class="' + icon + '"></i>';
      container.appendChild(btn);
      return new Button(id, callback);
   }

   function createSeparator() {
      var sep = document.createElement('div');
      sep.className = 'tool-separator';
      container.appendChild(sep);
   }

   function createSpacer() {
      var spacer = document.createElement('div');
      spacer.style.flex = '1';
      container.appendChild(spacer);
   }

   toolbarButtons = {};

   toolbarButtons.btnNewPack = createToolbarBtn('tbtn-new-pack', 'fas fa-box', 'New Pack', createNew);
   toolbarButtons.btnOpenPack = createToolbarBtn('tbtn-open-pack', 'fas fa-folder-open', 'Open Pack', function () { if (fileInputPack) fileInputPack.click(); });
   toolbarButtons.btnSavePack = createToolbarBtn('tbtn-save-pack', 'fas fa-save', 'Save Pack', packSaved);

   createSeparator();

   toolbarButtons.btnImportItem = createToolbarBtn('tbtn-import-item', 'fas fa-file-import', 'Import Item', function () { if (fileInputItem) fileInputItem.click(); });
   toolbarButtons.btnExportItem = createToolbarBtn('tbtn-export-item', 'fas fa-file-export', 'Export Item', exportCurrentItem);

   createSeparator();

   toolbarButtons.btnDelete = createToolbarBtn('tbtn-delete', 'fas fa-trash-can', 'Delete', eraseItem);

   createSeparator();

   toolbarButtons.btnNewProc = createToolbarBtn('tbtn-new-proc', 'fas fa-file-code', 'New OPL Procedure', function () {
      var data = [0x00, 0x00, 0x00, 0x0A, 80, 82, 79, 67, 78, 65, 77, 69, 58, 0];
      createBlockFile(data, "PROCNAME", 3);
   });
   toolbarButtons.btnNewNotepad = createToolbarBtn('tbtn-new-notepad', 'fas fa-sticky-note', 'New Notepad Entry', function () {
      var data = [0x00, 0x02, 8, 0, 0x00, 0x09, 78, 79, 84, 69, 80, 65, 68, 58, 0];
      createBlockFile(data, "NOTEPAD", 7);
   });
   toolbarButtons.btnNewData = createToolbarBtn('tbtn-new-data', 'fas fa-database', 'New Data File', function () {
      var id = getFreeFileId();
      if (id > 0) {
         var hdritem = createFileHeader("DATA" + id, 1, id + 0x8f);
         addItemToPack(hdritem);
         updateInventory();
      }
   });

   createSeparator();

   toolbarButtons.btnApply = createToolbarBtn('tbtn-apply', 'fas fa-circle-check', 'Apply Changes', applyEdits);
   toolbarButtons.btnDiscard = createToolbarBtn('tbtn-discard', 'fas fa-rotate-left', 'Discard Changes', discardEdits);

   createSeparator();

   // New: Batch Copy Object Button
   toolbarButtons.btnCopyObj = createToolbarBtn('tbtn-copy-obj', 'fa-solid fa-file-zipper', 'Copy Object Code (Extract)', function () {
      if (typeof selectedItems === 'undefined' || selectedItems.length === 0) return;
      var targets = selectedItems.filter(function (it) { return it.type === 3; });
      if (targets.length === 0) return;

      var procEditor = editors.find(function (e) { return e instanceof ProcedureFileEditor; });
      if (procEditor) {
         // Temporarily bind the editor to the first target to satisfy internal checks
         var oldItem = procEditor.item;
         procEditor.item = targets[0];
         try {
            procEditor.copyObjectCode();
         } finally {
            procEditor.item = oldItem;
         }
      }
   });

   createSeparator();

   toolbarButtons.btnPackHeader = createToolbarBtn('tbtn-pack-header', 'fas fa-receipt', 'Pack Header', function () {
      if (currentPackIndex >= 0) selectItem(currentPackIndex, 0);
   });

   toolbarButtons.btnMemoryMap = createToolbarBtn('tbtn-memory-map', 'fas fa-map', 'Memory Map', function () {
      if (currentPackIndex >= 0) selectPack(currentPackIndex);
   });

   toolbarButtons.btnVisualizer = createToolbarBtn('tbtn-visualizer', 'fas fa-diagram-project', 'Code Visualizer', function () {
      if (typeof CodeVisualizer !== 'undefined') CodeVisualizer.showSystemMap(packs);
   });

   createSpacer();

   toolbarButtons.btnOptions = createToolbarBtn('tbtn-options', 'fas fa-sliders', 'Options', function () {
      if (typeof DialogManager !== 'undefined' && DialogManager.showOptionsDialog) DialogManager.showOptionsDialog();
   });

   toolbarButtons.btnOplRef = createToolbarBtn('tbtn-opl-ref', 'fas fa-book', 'OPL Command Reference', function () {
      if (typeof OPLCommandReference !== 'undefined') new OPLCommandReference().open();
   });

   toolbarButtons.btnAbout = createToolbarBtn('tbtn-about', 'fas fa-circle-info', 'About', function () {
      if (typeof showAboutDialog === 'function') showAboutDialog();
   });

   toolbarButtons.btnMaxMin = createToolbarBtn('tbtn-max-min', 'fas fa-expand', 'Toggle Fullscreen', function () {
      if (!document.fullscreenElement) {
         document.documentElement.requestFullscreen().catch(function (e) {
            console.error("Error attempting to enable full-screen mode:", e.message);
         });
      } else {
         if (document.exitFullscreen) {
            document.exitFullscreen();
         }
      }
   });

   // Listen for fullscreen change to update icon
   document.addEventListener('fullscreenchange', function () {
      var icon = document.querySelector('#tbtn-max-min i');
      if (icon) {
         if (document.fullscreenElement) {
            icon.className = 'fas fa-compress';
         } else {
            icon.className = 'fas fa-expand';
         }
      }
   });

   if (typeof OptionsManager !== 'undefined') OptionsManager.applyOptions();
   updateItemButtons(false);
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

/**
 * Architecture: Event Handler
 * ---------------------------
 * Central hub for messages from individual editors.
 * Decouples the editors from the main application logic.
 */
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
   PackContents.render();

   // Update watermark
   var editorContainer = document.getElementById('editor-container');
   if (editorContainer) {
      if (!packs || packs.length === 0) {
         editorContainer.classList.add('watermark');
      } else {
         editorContainer.classList.remove('watermark');
      }
   }

   // Auto-save session state (Debounced)
   if (saveTimer) clearTimeout(saveTimer);
   saveTimer = setTimeout(saveSession, 1000);
}

// Drag and Drop Logic
// Handled by PackContents.js
var dragSrcInfo = null;

function handleDragStart(e, packIndex, itemIndex) {
   // Kept for compatibility if needed by other parts, but PackContents handles its own events now.
   // Actually, PackContents uses these global handlers? No, I defined them inside PackContents.js as closures or local functions?
   // Wait, PackContents.js uses `handleDragStart` which I assumed was global.
   // I need to check PackContents.js again.
   // In PackContents.js I wrote: `handleDragStart(e, packIndex, itemIndex);`
   // So these functions MUST remain global or be exported.
   // But I wanted to move them to PackContents.js.
   // If I moved them to PackContents.js, I should have defined them there.
   // Let's check PackContents.js content I wrote.
}



function closeEditor() {
   if (currentEditor) {
      if (currentEditor.hasUnsavedChanges()) {
         var suppress = OptionsManager.getOption('suppressConfirmations');
         if (!suppress) {
            var discard = window.confirm("Not all changes have been saved.\nIs it ok to discard those changes?");
            if (!discard) return false;
         }
      }
      currentEditor.finish();
      currentEditor = null;

      // Clear editors
      legacyEditorElement.innerHTML = "";
      legacyEditorElement.style.display = 'none';
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
   if (!isCopy && fromPackIx === toPackIx && fromItemIx === toItemIx && selectedItems.length <= 1) return;

   var fromPack = packs[fromPackIx];
   var toPack = packs[toPackIx];

   if (!fromPack || !toPack) return;

   var draggedItem = fromPack.items[fromItemIx];
   var multiActive = (selectedItems.indexOf(draggedItem) !== -1);

   // Multi-Item Logic
   if (multiActive && selectedItems.length > 1) {
      // Status Feedback
      var oldStatus = "";
      if (typeof statusmessageelement !== 'undefined' && statusmessageelement) {
         oldStatus = statusmessageelement.innerText;
         statusmessageelement.innerText = (isCopy ? "Copying " : "Moving ") + selectedItems.length + " items...";
      }

      setTimeout(function () {
         // Identify items to move (ensure they are in the source pack)
         // Re-fetch packs in case of weird state, but closure vars 'fromPack' are fine.
         var itemsToMove = selectedItems.filter(function (i) { return fromPack.items.indexOf(i) !== -1; });
         // Sort by index to maintain relative order
         itemsToMove.sort(function (a, b) { return fromPack.items.indexOf(a) - fromPack.items.indexOf(b); });

         if (itemsToMove.length === 0) {
            if (typeof statusmessageelement !== 'undefined' && statusmessageelement) statusmessageelement.innerText = oldStatus;
            return;
         }

         if (isCopy) {
            // Copy Strategy: Clone and Insert
            var clones = itemsToMove.map(clonePackItem);
            // Insert at destination
            for (var i = 0; i < clones.length; i++) {
               toPack.items.splice(toItemIx + i, 0, clones[i]);
            }
            selectedItems = []; // Clear selection after copy
         } else {
            // Move Strategy: Remove then Insert

            // 1. Remove from source (Highest index first to preserve lower indices)
            // Map to indices
            var indices = itemsToMove.map(function (it) { return fromPack.items.indexOf(it); });
            indices.sort(function (a, b) { return b - a; }); // Descending

            indices.forEach(function (idx) {
               fromPack.items.splice(idx, 1);
               // Adjust destination index if same pack and removal was BEFORE target
               if (fromPackIx === toPackIx && idx < toItemIx) {
                  toItemIx--;
               }
            });

            fromPack.unsaved = true;

            // 2. Insert into destination
            for (var i = 0; i < itemsToMove.length; i++) {
               toPack.items.splice(toItemIx + i, 0, itemsToMove[i]);
            }

            // If moved to different pack, clear selection. if same, keep.
            if (fromPackIx !== toPackIx) selectedItems = [];
         }

         toPack.unsaved = true;
         updateInventory();

         // Restore Status
         if (typeof statusmessageelement !== 'undefined' && statusmessageelement) {
            statusmessageelement.innerText = oldStatus;
         }
      }, 20);
      return;
   }




   // Single Item Logic (Original)
   var item = draggedItem;

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
   // Optimization: If selecting the already selected pack
   if (selectedPackIndex === index) {
      // If we are merely switching from an item back to the pack root
      // We can update the UI without a full destructive render
      selectedPackIndex = index;
      currentPackIndex = index;
      currentItem = null;

      // Update Sidebar Selection (Non-destructive)
      if (typeof PackContents !== 'undefined') PackContents.selectPack(index);

      // Ensure we are in Memory Map mode
      // Show Memory Map
      if (index >= 0 && index < packs.length) {
         var mmEditor = editors.find(function (e) { return e instanceof MemoryMapEditor; });
         if (mmEditor) {
            currentEditor = mmEditor;
            mmEditor.initialise({ type: 255 }); // Refreshes Main View

            var packName = packs[index].filename || "Untitled Pack";
            if (document.getElementById('current-file-name')) document.getElementById('current-file-name').innerText = packName;

            if (document.getElementById('code-editor-container')) document.getElementById('code-editor-container').style.display = 'none';
            if (legacyEditorElement) legacyEditorElement.style.display = 'block';
         }
      } else {
         if (document.getElementById('current-file-name')) document.getElementById('current-file-name').innerText = "No Pack Selected";
      }

      updateItemButtons(false);
      return;
   }

   if (!closeEditor()) return;
   selectedPackIndex = index;
   currentPackIndex = index;
   currentItem = null;
   selectedItems = []; // Clear multi-selection
   var lastFocusedItemIndex = -1; // For Shift-Select ranges
   updateInventory();

   // Show Memory Map
   if (index >= 0 && index < packs.length) {
      var mmEditor = editors.find(function (e) { return e instanceof MemoryMapEditor; });
      if (mmEditor) {
         currentEditor = mmEditor;
         mmEditor.initialise({ type: 255 });

         var packName = packs[index].filename || "Untitled Pack";
         if (document.getElementById('current-file-name')) document.getElementById('current-file-name').innerText = packName;

         if (document.getElementById('code-editor-container')) document.getElementById('code-editor-container').style.display = 'none';
         if (legacyEditorElement) legacyEditorElement.style.display = 'block';
      }
   } else {
      if (document.getElementById('current-file-name')) document.getElementById('current-file-name').innerText = "No Pack Selected";
   }
}

function selectItem(packIdx, itemIdx) {
   var pack = packs[packIdx];
   var item = pack ? pack.items[itemIdx] : null;
   if (currentItem === item) {
      if (typeof PackContents !== 'undefined') PackContents.selectItem(packIdx, itemIdx);
      return;
   }
   itemSelected(packIdx, itemIdx);
}

function itemSelected(packIndex, itemIndex, event) {
   var pack = packs[packIndex];
   if (!pack) return false;
   var isok = itemIndex >= 0 && itemIndex < pack.items.length;
   if (!isok) return false;

   var item = pack.items[itemIndex];

   // Determine if we should perform multi-select
   var isSpecial = (item.name === "MAIN" || item.type === 255);

   // Reset selectedItems if switching packs
   if (currentPackIndex !== packIndex) {
      selectedItems = [];
      lastFocusedItemIndex = -1;
   }

   if (event && !isSpecial) {
      if (event.ctrlKey) {
         // Toggle Selection
         var idx = selectedItems.indexOf(item);
         if (idx >= 0) {
            selectedItems.splice(idx, 1);
            // If we deselected the item we just clicked (currentItem), 
            // we should probably still show it in editor?
            // Or should we close the editor?
            // Standard UI: The focused item (clicked) is "active" even if deselected?
            // Actually standard Ctrl+Click on selected item -> Deselects it. Focus remains.
            // We will allow currentItem to be set to it.
         } else {
            selectedItems.push(item);
         }
      } else if (event.shiftKey && lastFocusedItemIndex !== -1) {
         // Range Selection
         selectedItems = [];
         var start = Math.min(lastFocusedItemIndex, itemIndex);
         var end = Math.max(lastFocusedItemIndex, itemIndex);
         for (var k = start; k <= end; k++) {
            var it = pack.items[k];
            // Optional: Filter special items from range if desired, 
            // but usually shift-select grabs everything.
            // User constraint: "Selection of [Special] ... cancel multi select".
            // This implies "Initiating selection ON special".
            // If range covers special, it's ambiguous. I'll allow it for now.
            selectedItems.push(it);
         }
      } else {
         selectedItems = [item];
      }
   } else {
      // Single Selection (programmatic or Special Item)
      selectedItems = [item];
   }
   // Ensure current item is in selection (unless explicitly toggled off via ctrl?)
   // If I Ctrl+Click to deselect, currentItem is still "focused".
   // If currentItem is not in selectedItems, eraseItem should probably NOT erase it?
   // But eraseItem uses selectedItems.

   // Update Focus Tracker
   lastFocusedItemIndex = itemIndex;

   if (currentItem == pack.items[itemIndex]) {
      // If re-clicking same item, we might need to refresh UI selection rendering
      // in case modifiers changed the set.
      if (typeof PackContents !== 'undefined' && PackContents.selectItem) {
         PackContents.selectItem(packIndex, itemIndex);
      }
      return true;
   }

   if (!closeEditor()) return false;

   currentPackIndex = packIndex;
   selectedPackIndex = -1;
   currentItem = pack.items[itemIndex];
   var tp = currentItem.type;

   var i = 0;
   var selectedEditor = null;

   // Heuristic for Type 0 (Data Block)
   if (tp === 0) {
      // Check if it's a standard Length-Prefixed Record
      // Record Format: [Length] [Type] [Data...]
      // If data[0] + 2 == data.length, it's a single record.
      if (currentItem.data.length >= 2 && currentItem.data[0] + 2 === currentItem.data.length) {
         // Additional check: The 'Type' byte (index 1) must be a valid Record Type ID
         // Record Types are 16 (0x10) to 126 (0x7E) (File IDs 1-111 + offset 15)
         var recType = currentItem.data[1] & 0x7f;
         if (recType >= 16 && recType <= 126) {
            // It looks like a valid record. Try to find RecordEditor.
            var recordEditor = editors.find(function (e) { return e instanceof RecordEditor; });
            if (recordEditor) {
               selectedEditor = recordEditor;
            }
         } else {
            // Invalid File ID -> Hex Viewer
            var hexEditor = editors.find(function (e) { return e instanceof HexEditor; });
            if (hexEditor) {
               selectedEditor = hexEditor;
            }
         }
      } else {
         // Default to Hex Viewer for other Data Blocks (ODB, etc.)
         var hexEditor = editors.find(function (e) { return e instanceof HexEditor; });
         if (hexEditor) {
            selectedEditor = hexEditor;
         }
      }
   }

   if (!selectedEditor) {
      while (i < editors.length && !editors[i].acceptsType(tp)) {
         i++;
      }
      if (i < editors.length) {
         selectedEditor = editors[i];
      }
   }

   if (selectedEditor) {
      if (selectedEditor instanceof HexEditor) {
         if (!OptionsManager.getOption('enableHexView')) {
            // Option is disabled: Do NOT open the editor.
            // Just return true to indicate selection happened, but leave editor area empty/previous state.
            // Actually, previous state was closed by closeEditor(). So it will be blank.
            selectedEditor = null;
         }
      }
   }

   if (selectedEditor) {
      currentEditor = selectedEditor;
      legacyEditorElement.style.display = 'block';
      // Use relative address 0 to match Hex Viewer (Memory Map) behavior
      // var startAddr = getItemAddres(pack, itemIndex) + 6;
      var startAddr = 0;
      currentEditor.initialise(currentItem, startAddr);
   } else {
      // 
      // // 
//       console.warn("No editor found for type " + tp);
   }

   // Optimized update: Don't re-render entire list, just update selection
   if (typeof PackContents !== 'undefined' && PackContents.selectItem) {
      PackContents.selectItem(packIndex, itemIndex);
   } else {
      updateInventory();
   }
   updateItemButtons(false);
   return true;
}

// Alias for PackContents.js
var selectItem = itemSelected;

function canLoadPack(e) {
   if (!discardUnsavedPack()) {
      e.preventDefault();
   }
}





function fileChosen() {
   var fileInput = document.getElementById("file-input-pack");
   if (fileInput && fileInput.files.length > 0) {
      loadPackFromFiles(fileInput.files);
   }
}

function loadPackFromFiles(files) {
   if (typeof HexViewer !== 'undefined') HexViewer.close();
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
               selectedPackIndex = packs.length - 1;

               updatePackChecksums(newPack);
               updateInventory();

               setStatus("Loaded HEX file: " + newPack.filename);
            } catch (err) {
               alert("Error parsing HEX file: " + err.message);
            }
         };
         reader.readAsText(file);
      } else {
         // Store path if enabled
         if (OptionsManager.getOption('restorePacks')) {
            var path = file.path || (file.webkitRelativePath ? file.webkitRelativePath : null);
            if (path) {
               var stored = localStorage.getItem('opkedit_open_packs');
               var openPacks = stored ? JSON.parse(stored) : [];
               if (openPacks.indexOf(path) === -1) {
                  openPacks.push(path);
                  localStorage.setItem('opkedit_open_packs', JSON.stringify(openPacks));
               }
            } else {// 
//                console.warn("Restore Packs: Cannot determine full path for file. Browser security may prevent this.");
               setStatus("Warning: Cannot save pack path for restore (Browser restriction).");
            }
         }

         LoadLocalBinaryFile(files[0],
            function (data, nm) {
               // Check if WRAPPED (OPK Header present)
               var isWrapped = (data.length >= 3 && data[0] === 79 && data[1] === 80 && data[2] === 75);

               // Check for OPK Header, if missing assume raw binary and wrap it
               if (!isWrapped) {
                  // Create 6-byte header: OPK + 3-byte Length
                  var ln = data.byteLength;
                  var wrapped = new Uint8Array(ln + 6);
                  wrapped[0] = 79; // O
                  wrapped[1] = 80; // P
                  wrapped[2] = 75; // K
                  wrapped[3] = (ln >> 16) & 0xff;
                  wrapped[4] = (ln >> 8) & 0xff;
                  wrapped[5] = ln & 0xff;
                  wrapped.set(data, 6);
                  data = wrapped; // Reassign data to wrapped buffer
               }

               var newPack = new PackImage(data);
               newPack.unsaved = false;
               newPack.filename = nm;

               // Feature: Validate Header Size Code
               // Only 0 is truly invalid (0KB)
               if (newPack.items && newPack.items.length > 0) {
                  var header = newPack.items[0];
                  if (header && header.data && header.data.length > 1) {
                     var sc = header.data[1];
                     if (sc < 1) { // Only 0 is truly invalid (0KB)
                        alert("Import Warning: Invalid Pack Size Code (" + sc + ") detected.\nDefaulting to 8KB (Code 1).");
                        header.data[1] = 1; // Default to 8KB
                     }
                  }
               }

               // Store content in localStorage for auto-load
               if (OptionsManager.getOption('restorePacks')) {
                  try {
                     var binary = '';
                     var len = data.byteLength;
                     for (var i = 0; i < len; i++) {
                        binary += String.fromCharCode(data[i]);
                     }
                     var base64 = btoa(binary);
                     var cachedPack = {
                        name: nm,
                        data: base64
                     };
                     var cachedPacks = [];
                     try {
                        var stored = localStorage.getItem('opkedit_cached_packs');
                        if (stored) cachedPacks = JSON.parse(stored);
                     } catch (e) { console.error("Drop handler error:", e); }

                     // Remove existing if updating
                     cachedPacks = cachedPacks.filter(function (p) { return p.name !== nm; });
                     cachedPacks.push(cachedPack);

                     localStorage.setItem('opkedit_cached_packs', JSON.stringify(cachedPacks));

                  } catch (e) {// 
//                      console.warn("Auto-Load: Failed to save pack content.", e);
                  }
               }

               packs.push(newPack);
               currentPackIndex = packs.length - 1;
               selectedPackIndex = packs.length - 1;

               updatePackChecksums(newPack);
               updateInventory();

               setStatus("Loaded OPK file: " + nm);
               saveSession();
            }
         );
      }
   }
}

function eraseItem() {
   if (selectedPackIndex >= 0) {
      var suppress = OptionsManager.getOption('suppressConfirmations');
      if (!suppress) {
         var discard = window.confirm("Are you sure you want to close/remove this pack?");
         if (!discard) return;
      }

      if (!closeEditor()) return;

      // Remove from storage if enabled
      if (OptionsManager.getOption('restorePacks')) {
         var pack = packs[selectedPackIndex];
         if (pack) {
            try {
               // Check if the pack being deleted is in the list
               var cachedPacks = [];
               try {
                  var stored = localStorage.getItem('opkedit_cached_packs');
                  if (stored) cachedPacks = JSON.parse(stored);
               } catch (e) { console.error("File entry read error:", e); }

               var initialLen = cachedPacks.length;
               cachedPacks = cachedPacks.filter(function (p) { return p.name !== pack.filename; });

               if (cachedPacks.length < initialLen) {
                  localStorage.setItem('opkedit_cached_packs', JSON.stringify(cachedPacks));
               }

               // Legacy cleanup
               var legacy = localStorage.getItem('opkedit_cached_pack');
               if (legacy) {
                  try {
                     var lData = JSON.parse(legacy);
                     if (lData.name === pack.filename) {
                        localStorage.removeItem('opkedit_cached_pack');
                     }
                  } catch (e) { console.error("File parse error:", e); }
               }
            } catch (e) {
               // 
               // // 
//                console.warn("Auto-Load: Failed to check cache on delete", e);
            }

            // Fix: Also remove from open packs list (Filespaths)
            try {
               var storedPaths = localStorage.getItem('opkedit_open_packs');
               if (storedPaths) {
                  var openPacks = JSON.parse(storedPaths);
                  var initialOpenLen = openPacks.length;
                  // Remove entries ending with filename
                  openPacks = openPacks.filter(function (p) {
                     return !p.endsWith(pack.filename) && !p.endsWith(pack.filename.replace('.opk', '.hex'));
                  });

                  if (openPacks.length < initialOpenLen) {
                     localStorage.setItem('opkedit_open_packs', JSON.stringify(openPacks));
                  }
               }
            } catch (e) { console.error("Remove open pack error:", e); }
         }
      }

      packs.splice(selectedPackIndex, 1);
      selectedPackIndex = -1;
      currentPackIndex = packs.length > 0 ? 0 : -1;
      updateInventory();
      return;
   }

   if (!closeEditor()) return;

   var pack = packs[currentPackIndex];
   // Check multi-selection
   if (selectedItems.length > 0) {
      // Filter out non-deletable items (Header/EOP/MAIN are special)
      var toDelete = selectedItems.filter(function (it) {
         return it.type > 0 && it.type !== 255;
      });

      if (toDelete.length === 0) return;

      var suppress = OptionsManager.getOption('suppressConfirmations');
      if (!suppress) {
         var msg = toDelete.length === 1 ?
            "Are you sure you want to erase '" + toDelete[0].name + "'?" :
            "Are you sure you want to erase these " + toDelete.length + " items?";
         if (!confirm(msg)) return false;
      }

      // Status Feedback
      var oldStatus = "";
      if (typeof statusmessageelement !== 'undefined' && statusmessageelement) {
         oldStatus = statusmessageelement.innerText;
         statusmessageelement.innerText = "Deleting " + toDelete.length + " items...";
      }

      // Defer to render status
      setTimeout(function () {
         // Sort by index descending to handle splices if needed
         var indices = toDelete.map(function (it) { return pack.items.indexOf(it); }).sort(function (a, b) { return b - a; });

         indices.forEach(function (idx) {
            if (idx >= 0) {
               var it = pack.items[idx];
               if (it.deleted) {
                  // Already deleted? Hard delete (Remove)
                  pack.items.splice(idx, 1);
               } else {
                  // Soft Delete (Mark as deleted)
                  it.deleted = true;
                  if (it.data && it.data.length > 1) it.data[1] &= 0x7F; // Clear bit 7
                  it.setDescription();
               }
            }
         });

         selectedItems = [];
         currentItem = null;

         pack.unsaved = true;
         updateInventory();
         saveSession();

         // Restore Status
         if (typeof statusmessageelement !== 'undefined' && statusmessageelement) {
            statusmessageelement.innerText = oldStatus;
         }
      }, 20);

      return; // Exit sync flow
   } else if (currentItem) {
      // Single Item Deletion (Legacy Path or Fallback)
      // Check if it's special
      var type = currentItem.type;
      if (type <= 0 || type === 255) return;

      if (!currentItem.deleted) {
         var suppress = OptionsManager.getOption('suppressConfirmations');
         if (!suppress) {
            var discard = window.confirm("Are you sure you want to erase " + (currentItem.name ? currentItem.name : "this item") + " from the pack?");
            if (!discard) return false;
         }
         // Soft Delete
         currentItem.deleted = true;
         if (currentItem.data && currentItem.data.length > 1) currentItem.data[1] &= 0x7F;
         currentItem.setDescription();
      } else {
         // Already deleted -> Hard Delete confirm?
         var suppress = OptionsManager.getOption('suppressConfirmations');
         if (!suppress) {
            var discard = window.confirm("This item is already deleted. Permanently remove it (reclaim space)?");
            if (!discard) return false;
         }

         var items = pack.items;
         var i = items.indexOf(currentItem);
         if (i >= 0) items.splice(i, 1);
      }

      currentItem = null;
   } else {
      return;
   }

   pack.unsaved = true;
   updateInventory();
   saveSession();
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
         var hdritem = createFileHeader("DATA" + id, type, id + 0x8f);
         addItemToPack(hdritem);
         updateInventory();
      } else if (type == 3) {
         var data = [0x00, 0x00, 0x00, 0x0A, 80, 82, 79, 67, 78, 65, 77, 69, 58, 0];
         createBlockFile(data, "PROCNAME", 3);
      } else if (type == 7) {
         var data = [0x00, 0x02, 8, 0, 0x00, 0x09, 78, 79, 84, 69, 80, 65, 68, 58, 0];
         createBlockFile(data, "NOTEPAD", 7);
      } else if (type > 0x0f) {
         var hdritem = new PackItem([1, type + 0x80, 0x20], 0, 3);
         hdritem.setDescription();
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

function createNewRecord() {
   var files = getDataFiles();
   var validFiles = [];
   for (var k in files) {
      if (files.hasOwnProperty(k)) {
         var id = parseInt(k);
         if (id >= 1 && id < 110) {
            validFiles.push({ id: id, name: files[id] });
         }
      }
   }

   if (validFiles.length === 0) {
      alert("No Data Files found in this pack. Please create a Data File first.");
      return;
   }

   var element = document.createElement('div');
   element.innerHTML =
      "<div>Select Data File:</div>" +
      "<div><select id='choosedatafile' style='width: 100%; margin-top: 10px; padding: 5px;'></select></div>";

   var sel = element.querySelector("#choosedatafile");

   validFiles.forEach(function (f) {
      var opt = document.createElement('option');
      opt.value = f.id;
      opt.innerHTML = f.name + " (ID: " + f.id + ")";
      sel.appendChild(opt);
   });

   var dialog = new ModalDialog(element, function () {
      var fileId = parseInt(sel.value);
      if (fileId > 0) {
         // Calculate Record Type ID (FileID + 15)
         var type = fileId + 0x0F;
         var hdritem = new PackItem([1, type + 0x80, 0x20], 0, 3);
         hdritem.setDescription();
         addItemToPack(hdritem);
         updateInventory();
      }
   });

   dialog.start();
}

function saveSession() {
   if (!OptionsManager.getOption('restorePacks')) return;

   var sessionPacks = [];
   try {
      for (var i = 0; i < packs.length; i++) {
         var p = packs[i];
         // Serialize pack content
         // Get raw binary data from PackImage
         var rawData = p.getRawData();

         // Convert to Base64
         var binary = '';
         var len = rawData.byteLength;
         for (var j = 0; j < len; j++) {
            binary += String.fromCharCode(rawData[j]);
         }
         var base64 = btoa(binary);

         sessionPacks.push({
            name: p.filename || "Untitled",
            data: base64
         });
      }
      localStorage.setItem('opkedit_cached_packs', JSON.stringify(sessionPacks));
   } catch (e) {
      // 
      // // 
//       console.warn("Session Save Failed (Quota?):", e);
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

   // Auto-select and Open Editor
   if (typeof currentPackIndex !== 'undefined' && currentPackIndex >= 0 && packs[currentPackIndex]) {
      var idx = packs[currentPackIndex].items.indexOf(hdritem);
      if (idx !== -1) {
         itemSelected(currentPackIndex, idx);
      }
   }
}

// Re-implemented packSaved
async function packSaved() {
   if (!closeEditor()) return;

   var pack = packs[currentPackIndex];
   if (!pack) return;

   var data = pack.getRawData();

   // Try File System Access API
   if (window.showSaveFilePicker) {
      try {
         const options = {
            suggestedName: pack.filename || "pack.opk",
            types: [
               {
                  description: 'Psion Pack File',
                  accept: { 'application/octet-stream': ['.opk'] },
               },
            ],
         };
         const handle = await window.showSaveFilePicker(options);
         const writable = await handle.createWritable();
         await writable.write(data);
         await writable.close();

         pack.unsaved = false;
         pack.filename = handle.name;
         updateInventory();
         setStatus("Pack saved to " + handle.name);
         return;
      } catch (err) {
         if (err.name !== 'AbortError') {
            console.error('Save File Picker failed:', err);
            // Fallback to classic download
         } else {
            return; // User cancelled
         }
      }
   }

   // Fallback: Classic Download
   var filename = prompt("Save Pack As:", pack.filename || "pack.opk");
   if (filename) {
      var blob = new Blob([data], { type: "application/octet-stream" });
      var url = URL.createObjectURL(blob);
      downloadFileFromUrl(filename, url);
      URL.revokeObjectURL(url);

      pack.unsaved = false;
      pack.filename = filename;
      updateInventory();
      setStatus("Pack downloaded as " + filename);
   }
}

function exportHex() {
   if (!closeEditor()) return;
   var pack = packs[currentPackIndex];
   if (!pack) return;

   var ihex = packToIntelHex(pack);
   var filename = pack.filename ? pack.filename.replace(/\.opk$/i, "") + ".hex" : "pack.hex";

   // Try File System Access API for Hex
   if (window.showSaveFilePicker) {
      // ... (Similar logic, skipping for brevity unless requested, 
      // sticking to classic download for hex unless user asked for hex dialog too.
      // User asked "For the pack save feature...". I'll add simple prompt for Hex too for consistency)
   }

   var userFilename = prompt("Export Hex As:", filename);
   if (userFilename) {
      var blob = new Blob([ihex], { type: "text/plain" });
      var url = URL.createObjectURL(blob);
      downloadFileFromUrl(userFilename, url);
      URL.revokeObjectURL(url);
      setStatus("Hex file exported.");
   }
}

function itemChosen() {
   var pack = packs[currentPackIndex];
   if (!pack) return;

   var fileInput = document.getElementById("file-input-item");
   if (!fileInput) return;

   var files = fileInput.files;
   for (var i = 0; i < files.length; i++) {
      var fn = files[i].name;
      if (fn.match(/\.((ODB)|(OPL)|(NTS))$/i)) {
         LoadLocalTextFile(files[i], createItemFromFileData);
      } else {
         LoadLocalBinaryFile(files[i], createItemFromFileData);
      }
   }
   // Reset input to allow re-selecting same file
   fileInput.value = '';
}

function getFreeFileId() {
   var ids = getDataFiles();
   var id = 1;
   while (ids[id]) id++;
   if (id >= 111) {
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
      // Add +1 for Null Terminator
      var ln = filedata.length + 6 + 1;
      var blkhdr = new Uint8Array(4);
      blkhdr[0] = 2; blkhdr[1] = 0x80; blkhdr[2] = (ln >> 8) & 0xff; blkhdr[3] = ln & 0xff;

      var itemdata = new Uint8Array(6 + filedata.length + 1);
      itemdata[0] = 0; itemdata[1] = 0;
      // Source Length includes Null Terminator
      var srclen = filedata.length + 1;
      itemdata[2] = (srclen >> 8) & 0xff; itemdata[3] = srclen & 0xff;

      for (var i = 0; i < filedata.length; i++) {
         var c = filedata.charCodeAt(i);
         itemdata[4 + i] = c == 10 ? 0 : c;
      }
      // Null Terminator
      itemdata[4 + filedata.length] = 0;

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
         recitem.setDescription();
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
   } else if (name.match(/\.OB([0-9A-F])$/i)) {
      // Generic Handler for .OBx files (OB2 - OBF)
      var match = name.match(/\.OB([0-9A-F])$/i);
      var typeExt = parseInt(match[1], 16);

      // Basic check: filedata must start with ORG
      var validHeader = false;
      if (filedata.length >= 6) {
         if (typeof filedata === 'string') {
            if (filedata.substr(0, 3) === "ORG") validHeader = true;
         } else {
            if (filedata[0] == 79 && filedata[1] == 82 && filedata[2] == 71) validHeader = true;
         }
      }

      if (!validHeader) {
         alert("File " + name + " is missing required 'ORG' header.");
         return;
      }

      // Convert to Uint8Array if needed (createItemFromFileData receives binary string usually)
      var rawBytes = new Uint8Array(filedata.length);
      for (var i = 0; i < filedata.length; i++) rawBytes[i] = filedata.charCodeAt(i);

      var ln = (rawBytes[3] << 8) | rawBytes[4];
      if (rawBytes.length < 6 + ln) {
         alert("The file " + name + " seems to be truncated!");
         return;
      }

      // Use internal type from file if present, otherwise trust extension or just use byte 5
      var typeByte = rawBytes[5];

      var hdritem = createFileHeader(name, typeByte & 0x7F, 0);
      var blkhdr = new Uint8Array(4);
      blkhdr[0] = 2; blkhdr[1] = 0x80; blkhdr[2] = rawBytes[3]; blkhdr[3] = rawBytes[4];

      var dataitem = new PackItem(rawBytes, 6, ln);
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
   hdr[10] = id;
   for (var i = 0; i < 8; i++) {
      hdr[2 + i] = name.charCodeAt(i);
   }
   var item = new PackItem(hdr, 0, 11);
   item.setDescription();
   return item;
}

function addItemToPack(item) {
   var pack = packs[currentPackIndex];
   if (!pack) return;

   var items = pack.items;
   var items = pack.items;
   // Default: append before terminator (Find explicit terminator to be safe)
   var insertIndex = -1;
   for (var i = 0; i < items.length; i++) {
      if (items[i].type === 255) { // End of Pack
         insertIndex = i;
         break;
      }
   }
   if (insertIndex === -1) insertIndex = items.length; // Fallback if no terminator found

   // Sequential Insertion Logic for Records
   if (item.type >= 16) { // Is a Record
      var fileId = item.type - 0x0F;
      // Find the Data File header
      var dfIndex = -1;
      for (var i = 0; i < items.length; i++) {
         if (items[i].type == 1 && items[i].data[10] == (fileId + 0x8F)) {
            dfIndex = i;
            break;
         }
      }

      if (dfIndex >= 0) {
         insertIndex = dfIndex + 1;
         // Skip over existing records for this file
         while (insertIndex < items.length - 1 && items[insertIndex].type == item.type) {
            insertIndex++;
         }
      }
   }

   // Update Boot Address if necessary
   if ((pack.items[0].data[0] & 0x10) == 0) { // Pack is bootable
      var insertOffset = 0;
      for (var i = 0; i < insertIndex; i++) {
         insertOffset += items[i].getLength();
      }

      var bootAddr = (pack.items[0].data[6] << 8) + pack.items[0].data[7];
      if (insertOffset <= bootAddr) {
         var newBootAddr = bootAddr + item.getLength();
         pack.items[0].data[6] = (newBootAddr >> 8) & 0xff;
         pack.items[0].data[7] = newBootAddr & 0xff;
      }
   }

   items.splice(insertIndex, 0, item);
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

// Sidebar Resizing Logic
var sidebar = document.getElementById('sidebar');
var resizer = document.createElement('div');
resizer.id = 'sidebar-resizer';
sidebar.appendChild(resizer);

var isResizing = false;

resizer.addEventListener('mousedown', function (e) {
   isResizing = true;
   document.body.style.cursor = 'col-resize';
   e.preventDefault();
});

document.addEventListener('mousemove', function (e) {
   if (!isResizing) return;
   var newWidth = e.clientX;
   if (newWidth < 170) newWidth = 170;
   if (newWidth > 600) newWidth = 600;
   sidebar.style.width = newWidth + 'px';
});

document.addEventListener('mouseup', function (e) {
   if (isResizing) {
      isResizing = false;
      document.body.style.cursor = 'default';
   }
});

// Drag and Drop for Packs on Sidebar
// Drag and Drop for Packs on Sidebar
// Use Capture phase to intercept File drops before they reach list items
sidebar.addEventListener('dragover', function (e) {
   // Check if dragging files
   var isFile = false;
   if (e.dataTransfer.types) {
      for (var i = 0; i < e.dataTransfer.types.length; i++) {
         if (e.dataTransfer.types[i] === "Files") {
            isFile = true;
            break;
         }
      }
   }

   if (isFile) {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'copy';
      sidebar.classList.add('drag-over');
   }
}, true); // useCapture = true

sidebar.addEventListener('dragleave', function (e) {
   // Only remove if leaving the sidebar (not entering a child)
   // But in capture mode, logic is tricky. Simplest is to just remove class.
   sidebar.classList.remove('drag-over');
}, true);

sidebar.addEventListener('drop', function (e) {
   var isFile = false;
   if (e.dataTransfer.types) {
      for (var i = 0; i < e.dataTransfer.types.length; i++) {
         if (e.dataTransfer.types[i] === "Files") {
            isFile = true;
            break;
         }
      }
   }

   if (isFile && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      e.preventDefault();
      e.stopPropagation();
      sidebar.classList.remove('drag-over');

      var files = e.dataTransfer.files;

      var fname = files[0].name.toUpperCase();
      // Check for .OBx, .OPL, .ODB, .NTS (Item types)
      var isItem = fname.match(/\.OB[0-9A-F]$/) || fname.endsWith(".OPL") || fname.endsWith(".ODB") || fname.endsWith(".NTS");

      if (isItem) {
         if (packs.length === 0) {
            // No pack open? Create one automatically.
            createNew();
         }

         if (packs.length > 0) {
            LoadLocalBinaryFile(files[0], function (data, name) {
               createItemFromFileData(data, name);
            });
         }
      } else {
         // Not an item? Assume it's a Pack file (.OPK, .HEX)
         loadPackFromFiles(files);
      }
   }
}, true); // useCapture = true

// Keyboard Shortcuts
function setupKeyboardShortcuts() {
   document.addEventListener('keydown', function (e) {
      // Check for active dropdowns
      var activeDropdown = null;
      registeredMenus.forEach(function (m) {
         if (m.menu.classList.contains('show')) activeDropdown = m.menu;
      });

      // Check for Ctrl (Windows) or Meta (Mac)
      var isCtrl = e.ctrlKey || e.metaKey;

      if (isCtrl) {
         if (e.key === 'n' || e.key === 'N') {
            e.preventDefault();
            // Toggle File Menu
            var btn = document.getElementById('btn-file-menu');
            if (btn) btn.click();
         } else if (e.key === 'o' || e.key === 'O') {
            e.preventDefault();
            // Direct Open Pack
            var link = document.getElementById('menu-open-pack');
            if (link) link.click();
         } else if (e.key === 's' || e.key === 'S') {
            e.preventDefault();
            // Direct Save Pack
            packSaved();
         }
      } else {
         // Navigation Keys (No Ctrl)
         if (activeDropdown) {
            if (e.key === 'Escape') {
               e.preventDefault();
               closeAllMenus();
               return;
            } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
               e.preventDefault();
               navigateMenu(activeDropdown, e.key === 'ArrowDown' ? 1 : -1);
               return;
            } else if (e.key === 'Enter') {
               // If focused element is a link in the dropdown, let default click happen
               // But if focus is on the button, Enter might have opened it.
               if (document.activeElement && activeDropdown.contains(document.activeElement)) {
                  // Let default action proceed (click)
                  return;
               }
            }
         }
      }
   });
}

function navigateMenu(dropdown, direction) {
   // Find all enabled links
   var links = Array.from(dropdown.querySelectorAll('a')).filter(function (el) {
      return !el.classList.contains('disabled') && el.offsetParent !== null; // Visible and enabled
   });

   if (links.length === 0) return;

   var index = links.indexOf(document.activeElement);

   if (index === -1) {
      // Focus first item if nothing selected
      links[0].focus();
   } else {
      var newIndex = index + direction;
      // Clamp or Loop? Let's Clamp currently.
      if (newIndex >= 0 && newIndex < links.length) {
         links[newIndex].focus();
      }
   }
}

// Start the application
setupKeyboardShortcuts();
init();
document.title = "Psion OPK Editor v" + APP_VERSION;

function initChildMode(feature) {
   document.body.classList.add('child-window');

   // Hide standard app elements
   var app = document.getElementById('app');
   if (app) app.style.display = 'none';

   if (feature === 'visualizer') {
      document.title = "Code Visualizer";
      // 
      // 


      // Notify opener that we are ready
      if (window.opener && window.opener.CodeVisualizer && window.opener.CodeVisualizer.childWindowReady) {
         window.opener.CodeVisualizer.childWindowReady(window);
      }
   } else if (feature === 'command_ref') {
      if (window.opener && window.opener.OPLCommandReference && window.opener.OPLCommandReference.childWindowReady) {
         window.opener.OPLCommandReference.childWindowReady(window);
      }
   }
}
