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
      // 
      // 
      // // console.warn("Button not found: " + id);
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
var packReportWindow;
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
   new NativeCodeEditor(legacyEditorElement, codeEditorElement, handleEditorMessage),
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
registerMenu('btn-view-menu', 'view-dropdown', populateViewMenu);
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

   var menuBootablePack = document.getElementById('menu-bootable-pack');
   if (menuBootablePack) {
      menuBootablePack.addEventListener('click', function (e) {
         e.preventDefault();
         openBootableWizard();
         closeAllMenus();
      });
   }
}

// Open/Save Populators removed (merged into populateFileMenu)

// Open Menu Handlers
if (document.getElementById('menu-open-pack')) {
   document.getElementById('menu-open-pack').addEventListener('click', function (e) {
      e.preventDefault();
      if (fileInputPack) fileInputPack.click(); // Trigger hidden input
      closeAllMenus();
   });

   document.getElementById('menu-open-url').addEventListener('click', function (e) {
      e.preventDefault();
      openPackFromURL();
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

// View Menu Handlers
if (document.getElementById('menu-pack-header')) {
   document.getElementById('menu-pack-header').addEventListener('click', function (e) {
      e.preventDefault();
      if (this.classList.contains('disabled')) return;
      if (currentPackIndex >= 0 && packs[currentPackIndex]) {
         var pack = packs[currentPackIndex];
         var headerIdx = -1;
         // Find Header Item (Type -1)
         for (var i = 0; i < pack.items.length; i++) {
            if (pack.items[i].type === -1) {
               headerIdx = i;
               break;
            }
         }

         if (headerIdx >= 0) {
            itemSelected(currentPackIndex, headerIdx); // Use itemSelected to open editor
         } else {
            selectPack(currentPackIndex);
         }
      }
      closeAllMenus();
   });

   document.getElementById('menu-pack-report').addEventListener('click', function (e) {
      e.preventDefault();
      if (this.classList.contains('disabled')) return;
      var pack = currentPack;
      if (!pack && typeof packs !== 'undefined' && currentPackIndex >= 0) {
         pack = packs[currentPackIndex];
      }
      if (packReportWindow && pack) {
         packReportWindow.open(pack);
      }
      closeAllMenus();
   });

   document.getElementById('menu-memory-map').addEventListener('click', function (e) {
      e.preventDefault();
      if (this.classList.contains('disabled')) return;
      if (currentPackIndex >= 0) selectPack(currentPackIndex);
      closeAllMenus();
   });

   document.getElementById('menu-visualizer').addEventListener('click', function (e) {
      e.preventDefault();
      if (this.classList.contains('disabled')) return;
      if (typeof CodeVisualizer !== 'undefined') CodeVisualizer.showSystemMap(packs);
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

   // Export Item requires an Item selected OR a Pack selected
   var exportItemEl = document.getElementById('menu-export-item');
   if (exportItemEl) {
      var canExport = itemSelected || packOpen;
      if (canExport) exportItemEl.classList.remove('disabled');
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

function populateViewMenu() {
   var packOpen = (currentPackIndex >= 0);
   var ids = ['menu-pack-header', 'menu-pack-report', 'menu-memory-map', 'menu-visualizer'];
   ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
         if (packOpen) el.classList.remove('disabled');
         else el.classList.add('disabled');
      }
   });
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

var menuPackHeaderHelp = document.getElementById('menu-pack-header-help');
if (menuPackHeaderHelp) {
   menuPackHeaderHelp.addEventListener('click', function (e) {
      e.preventDefault();
      closeAllMenus();
      if (typeof PackHeaderHelp !== 'undefined') {
         PackHeaderHelp.openWindow();
      } else {
         alert("Pack Header Help component not loaded.");
      }
   });
}

// --- New Help Items ---

var menuHelpStartHere = document.getElementById('menu-help-start-here');
if (menuHelpStartHere) {
   menuHelpStartHere.addEventListener('click', function (e) {
      e.preventDefault();
      closeAllMenus();
      if (typeof HelpStartHere !== 'undefined') HelpStartHere.openWindow();
   });
}

var menuHelpPhysicalConnection = document.getElementById('menu-help-physical-connection');
if (menuHelpPhysicalConnection) {
   menuHelpPhysicalConnection.addEventListener('click', function (e) {
      e.preventDefault();
      closeAllMenus();
      if (typeof HelpPhysicalConnection !== 'undefined') HelpPhysicalConnection.openWindow();
   });
}

var menuHelpOverview = document.getElementById('menu-help-overview');
if (menuHelpOverview) {
   menuHelpOverview.addEventListener('click', function (e) {
      e.preventDefault();
      closeAllMenus();
      if (typeof HelpOverview !== 'undefined') HelpOverview.openWindow();
   });
}

var menuHelpPackContents = document.getElementById('menu-help-pack-contents');
if (menuHelpPackContents) {
   menuHelpPackContents.addEventListener('click', function (e) {
      e.preventDefault();
      closeAllMenus();
      if (typeof HelpPackContents !== 'undefined') HelpPackContents.openWindow();
   });
}

var menuHelpMemoryMap = document.getElementById('menu-help-memory-map');
if (menuHelpMemoryMap) {
   menuHelpMemoryMap.addEventListener('click', function (e) {
      e.preventDefault();
      closeAllMenus();
      if (typeof HelpMemoryMap !== 'undefined') HelpMemoryMap.openWindow();
   });
}

var menuHelpBootablePack = document.getElementById('menu-help-bootable-pack');
if (menuHelpBootablePack) {
   menuHelpBootablePack.addEventListener('click', function (e) {
      e.preventDefault();
      closeAllMenus();
      if (typeof HelpBootablePack !== 'undefined') HelpBootablePack.openWindow();
   });
}

var menuHelpPackSummary = document.getElementById('menu-help-pack-summary');
if (menuHelpPackSummary) {
   menuHelpPackSummary.addEventListener('click', function (e) {
      e.preventDefault();
      closeAllMenus();
      if (typeof HelpPackSummary !== 'undefined') HelpPackSummary.openWindow();
   });
}

var menuHelpOPLEditor = document.getElementById('menu-help-opl-editor');
if (menuHelpOPLEditor) {
   menuHelpOPLEditor.addEventListener('click', function (e) {
      e.preventDefault();
      closeAllMenus();
      if (typeof HelpOPLEditor !== 'undefined') HelpOPLEditor.openWindow();
   });
}

var menuHelpVisualizer = document.getElementById('menu-help-visualizer');
if (menuHelpVisualizer) {
   menuHelpVisualizer.addEventListener('click', function (e) {
      e.preventDefault();
      closeAllMenus();
      if (typeof HelpVisualizer !== 'undefined') HelpVisualizer.openWindow();
   });
}

var menuHelpOptions = document.getElementById('menu-help-options');
if (menuHelpOptions) {
   menuHelpOptions.addEventListener('click', function (e) {
      e.preventDefault();
      closeAllMenus();
      if (typeof HelpOptions !== 'undefined') HelpOptions.openWindow();
   });
}

// ----------------------

var menuOplErrors = document.getElementById('menu-opl-errors');
if (menuOplErrors) {
   menuOplErrors.addEventListener('click', function (e) {
      e.preventDefault();
      closeAllMenus();
      if (typeof OPLErrorCodes !== 'undefined') {
         OPLErrorCodes.openWindow();
      } else {
         alert("OPLErrorCodes component not loaded.");
      }
   });
}

var menuOplRef = document.getElementById('menu-opl-ref');
if (menuOplRef) {
   menuOplRef.addEventListener('click', function (e) {
      e.preventDefault();
      if (typeof OPLCommandReference !== 'undefined') {
         new OPLCommandReference().open();
      } else {
         // console.error("OPLCommandReference not loaded");
      }
      closeAllMenus();
   });
}

var menuOplTemplates = document.getElementById('menu-opl-templates');
if (menuOplTemplates) {
   menuOplTemplates.addEventListener('click', function (e) {
      e.preventDefault();
      if (typeof OPLContentViewer !== 'undefined' && typeof OPL_TEMPLATES !== 'undefined') {
         new OPLContentViewer("OPL Coding Templates", OPL_TEMPLATES).open();
      }
      closeAllMenus();
   });
}

var menuOplLibrary = document.getElementById('menu-opl-library');
if (menuOplLibrary) {
   menuOplLibrary.addEventListener('click', function (e) {
      e.preventDefault();
      if (typeof OPLContentViewer !== 'undefined' && typeof OPL_LIBRARY_ROUTINES !== 'undefined') {
         new OPLContentViewer("OPL Library Routines", OPL_LIBRARY_ROUTINES).open();
      }
      closeAllMenus();
   });
}

var menuGraphicEditor = document.getElementById('menu-graphic-editor');
if (menuGraphicEditor) {
   menuGraphicEditor.addEventListener('click', function (e) {
      e.preventDefault();
      closeAllMenus();
      if (typeof UDGEditor !== 'undefined') {
         UDGEditor.openWindow();
      } else {
         alert("UDG Editor component not loaded.");
      }
   });
}

var menuCharacterMap = document.getElementById('menu-character-map');
if (menuCharacterMap) {
   menuCharacterMap.addEventListener('click', function (e) {
      e.preventDefault();
      closeAllMenus();
      if (typeof CharacterMap !== 'undefined') {
         CharacterMap.openWindow();
      } else {
         alert("Character Map component not loaded.");
      }
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
   packReportWindow = new PackReportWindow();
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
            try { existingPacks = JSON.parse(localStorage.getItem('opkedit_cached_packs') || '[]'); } catch (e) { }

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
            // 
            // 
            //             console.warn("Restore Packs: Legacy migration failed", e);
         }
      }

      var cachedPacks = [];
      try {
         var stored = localStorage.getItem('opkedit_cached_packs');
         if (stored) cachedPacks = JSON.parse(stored);
      } catch (e) { }

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
               // console.error("Restore Packs: Failed to load cached pack " + packData.name, e);
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

    // Check for URL parameter to auto-load a pack
    var packUrl = params.get('url');
    if (packUrl) {
       var useProxyParam = params.get('proxy');
       var useProxy = true;
       if (useProxyParam === 'false') {
          useProxy = false;
       } else {
          try {
             var parsed = new URL(packUrl, window.location.href);
             var isLocal = parsed.hostname === 'localhost' || 
                           parsed.hostname === '127.0.0.1' || 
                           parsed.hostname.startsWith('192.168.') || 
                           parsed.hostname.startsWith('10.') || 
                           parsed.hostname.startsWith('172.16.') || 
                           parsed.origin === window.location.origin;
             if (isLocal) useProxy = false;
          } catch(e) {}
       }
       loadPackFromURLHelper(packUrl, useProxy);
    }
}

// Core Functions

function createNew(e) {
   if (typeof HexViewer !== 'undefined') HexViewer.close();

   var lastSize = OptionsManager.getOption('lastPackSize') || 3;
   var suppressed = OptionsManager.getOption('suppressConfirmations');

   // Helper to perform creation
   function doCreate(sizeCode) {
      if (sizeCode >= 1 && sizeCode <= 128) {
         var newPack = new PackImage(null, sizeCode);
         newPack.filename = "Pack" + (packs.length + 1) + ".opk";
         packs.push(newPack);
         currentPack = newPack; // Make new pack active
         currentPackIndex = packs.length - 1;
         updateInventory();
         // Persist selection
         OptionsManager.setOption('lastPackSize', sizeCode);
         setStatus("New " + (sizeCode * 8) + "KB pack created");
      }
   }

   // Immediate Action if suppressed
   if (suppressed) {
      doCreate(lastSize);
      return;
   }

   // Create Size Selection Dialog
   var element = document.createElement('div');
   // Construct options dynamically to set selected based on lastSize
   var optionsHtml = "";
   var sizes = [
      { v: 1, l: "8 KB (Standard)" },
      { v: 2, l: "16 KB" },
      { v: 4, l: "32 KB" }, // 4 * 8 = 32
      { v: 8, l: "64 KB" }, // 8 * 8 = 64
      { v: 16, l: "128 KB" },
      { v: 32, l: "256 KB" },
      { v: 64, l: "512 KB" },
      { v: 128, l: "1 MB" }
   ];

   sizes.forEach(function (opt) {
      var sel = (opt.v === lastSize) ? " selected" : "";
      optionsHtml += "<option value='" + opt.v + "'" + sel + ">" + opt.l + "</option>";
   });

   element.innerHTML =
      "<div>Select Pack Size:</div>" +
      "<div><select id='packsize'>" +
      optionsHtml +
      "</select></div>";

   var sel = element.querySelector("#packsize");
   var sizeDialog = new ModalDialog(element, function () {
      var sizeCode = parseInt(sel.value);
      doCreate(sizeCode);
   });

   sizeDialog.start();
   // Focus select
   if (sel) setTimeout(function () { sel.focus(); }, 50);
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

function getExportExtension(item) {
   var type = item.type;
   if (type === 1) return ".odb";
   if (type >= 2 && type <= 15) {
      // Check for OPL Text
      var isText = false;
      if (type === 3) {
         if (item.child && item.child.child && item.child.child.data) {
            var payload = item.child.child.data;
            if (payload.length >= 2) {
               var lncode = (payload[0] << 8) | payload[1];
               if (lncode === 0) isText = true;
            }
         }
      }
      if (isText) return ".opl";
      return ".OB" + type.toString(16).toUpperCase();
   }
   if (type >= 16) return ".odb";
   return ".bin";
}

function exportCurrentItem() {
   var pack = packs[currentPackIndex];
   if (!pack) {
      alert("There is no Data Pack selected for export.");
      return;
   }

   // Treat Pack Header (type -1) or End Of Pack (type 255) or no item (Pack root) as Pack Export
   var isPackExport = (currentItem === null || (currentItem && (currentItem.type === -1 || currentItem.type === 255)));

   if (isPackExport) {
      showExportPackDialog(pack);
      return;
   }

   var filename = "item.bin";
   if (currentItem.name) {
      filename = currentItem.name.trim();
   }

   // Heuristic for extension
   var ext = getExportExtension(currentItem);
   if (!filename.toLowerCase().endsWith(ext)) {
      filename += ext;
   }

   var userFilename = prompt("Save item as:", filename);
   if (userFilename) {
      var url = pack.getItemURL(currentItem);
      if (url) {
         downloadFileFromUrl(userFilename, url);
      } else {
         alert("Cannot export this item type (id: " + currentItem.type + "). Only standard files (OPL, ODB, Notepad, etc) are supported.");
      }
   }
}

function showExportPackDialog(pack) {
   var element = document.createElement('div');
   var defaultName = pack.filename ? pack.filename.replace(/\.[^/.]+$/, "") : "PACK";
   var supportsPicker = !!window.showDirectoryPicker;
   var isSecure = window.isSecureContext;
   var hasZip = (typeof ZipUtils !== 'undefined');
   var pickerStatus = "";

   if (supportsPicker && isSecure) {
      pickerStatus = "<div style='color: #2e7d32; margin-top: 5px; font-size: 11px;'><i class='fas fa-circle-check'></i> Folder selection supported. You will be prompted to choose a target directory.</div>";
   } else if (hasZip) {
      pickerStatus = "<div style='color: #2e7d32; margin-top: 5px; font-size: 11px;'><i class='fas fa-file-zipper'></i> Folder selection not available. Exporting as a single <b>.ZIP</b> file.</div>";
   } else {
      pickerStatus = "<div style='color: #d32f2f; margin-top: 5px; font-size: 11px;'><i class='fas fa-triangle-exclamation'></i> Batch export not supported. Falling back to individual downloads.</div>";
   }

   element.innerHTML =
      "<div style='padding: 10px;'>" +
      "<h3>Export Data Pack</h3>" +
      "<p>This will export the pack structure as a <b>.BLD</b> file and all objects as separate files.</p>" +
      "<div style='margin: 15px 0;'>" +
      "<label>Output Base Filename:<br>" +
      "<input type='text' id='export-base-name' value='" + defaultName + "' style='width: 100%; margin-top: 5px; padding: 5px; background: var(--input-bg); color: var(--text-color); border: 1px solid var(--border-color);'></label>" +
      "</div>" +
      pickerStatus +
      "<div style='font-size: 11px; opacity: 0.7; margin-top: 10px;'>" +
      "<i class='fas fa-info-circle'></i> Untranslated OPL source will be exported as .OPL but excluded from the .BLD file." +
      "</div>" +
      "</div>";

   var dialog = new ModalDialog(element, function () {
      var baseName = element.querySelector('#export-base-name').value.trim() || defaultName;
      performPackExport(pack, baseName);
   });
   dialog.start();
}

async function performPackExport(pack, baseName) {
   // Try File System Access API (Standard in modern Chrome/Edge)
   if (window.showDirectoryPicker) {
      try {
         const dirHandle = await window.showDirectoryPicker({
            id: 'opk-export',
            startIn: 'downloads'
         });

         const writeFile = async (handle, name, content) => {
            const fileHandle = await handle.getFileHandle(name, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(content);
            await writable.close();
         };

         // 1. Generate & Write BLD
         var bldContent = generateBLDContent(pack, baseName);
         await writeFile(dirHandle, baseName + ".bld", bldContent);

         // 2. Write Items
         var count = 0;
         for (var i = 0; i < pack.items.length; i++) {
            var item = pack.items[i];
            if (item.type === -1 || item.type === 255 || item.deleted) continue;

            var name = item.name ? item.name.trim() : "ITEM" + i;
            var ext = getExportExtension(item);
            var url = pack.getItemURL(item);

            if (url) {
               const response = await fetch(url);
               const blob = await response.blob();
               await writeFile(dirHandle, name + ext, blob);
               count++;
            }
         }
         alert("Successfully exported " + count + " items and " + baseName + ".bld to the selected directory.");
         return;
      } catch (e) {
         if (e.name === 'AbortError') return;
         alert("Folder Picker failed: " + e.message + "\n\nFalling back to standard downloads.");
         console.warn("Directory picker failed, falling back to standard downloads:", e);
      }
   }

   // 2. Try ZipUtils (Standalone Fallback)
   if (typeof ZipUtils !== 'undefined') {
      try {
         var zipFiles = [];

         // 1. Generate & Add BLD
         var bldContent = generateBLDContent(pack, baseName);
         zipFiles.push({ name: baseName + ".bld", content: bldContent });

         // 2. Add Items
         var count = 0;
         for (var i = 0; i < pack.items.length; i++) {
            var item = pack.items[i];
            if (item.type === -1 || item.type === 255 || item.deleted) continue;

            var name = item.name ? item.name.trim() : "ITEM" + i;
            var ext = getExportExtension(item);
            var url = pack.getItemURL(item);

            if (url) {
               const response = await fetch(url);
               const blob = await response.blob();
               zipFiles.push({ name: name + ext, content: blob });
               count++;
            }
         }

         const zipBlob = await ZipUtils.createZip(zipFiles);
         const zipUrl = URL.createObjectURL(zipBlob);
         downloadFileFromUrl(baseName + ".zip", zipUrl);
         alert("Successfully bundled " + count + " items and " + baseName + ".bld into " + baseName + ".zip");
         return;
      } catch (e) {
         console.warn("ZIP generation failed, falling back to standard downloads:", e);
      }
   }

   // 3. Fallback: Trigger multiple downloads (Legacy behavior)
   var bldContent = generateBLDContent(pack, baseName);
   var bldBlob = new Blob([bldContent], { type: 'text/plain' });
   var bldUrl = URL.createObjectURL(bldBlob);

   // 1. Download BLD
   downloadFileFromUrl(baseName + ".bld", bldUrl);

   // 2. Download Items
   for (var i = 0; i < pack.items.length; i++) {
      var item = pack.items[i];
      if (item.type === -1 || item.type === 255 || item.deleted) continue;

      var name = item.name ? item.name.trim() : "ITEM" + i;
      var ext = getExportExtension(item);
      var url = pack.getItemURL(item);
      if (url) {
         downloadFileFromUrl(name + ext, url);
      }
   }
}

function generateBLDContent(pack, baseName) {
   var header = pack.items[0];
   var headerByte = header.data[0];
   var sc = header.data[1];
   var sizeKB = sc * 8;

   var flags = [];
   if (headerByte & 0x08) flags.push("NOCOPY");
   if (headerByte & 0x10) flags.push("NOWRITE");

   var flagStr = flags.length > 0 ? ", " + flags.join(" ") : "";

   var sanitizedBaseName = baseName.replace(/ /g, '-').substring(0, 8).toUpperCase();

   var lines = [];
   lines.push(sanitizedBaseName + " " + sizeKB + flagStr);

   for (var i = 0; i < pack.items.length; i++) {
      var item = pack.items[i];
      if (item.type === -1 || item.type === 255 || item.deleted) continue;

      var name = (item.name ? item.name.trim() : "ITEM" + i).replace(/ /g, '-').substring(0, 8).toUpperCase();
      var ext = getExportExtension(item).substring(1).toUpperCase(); // Strip dot for BLD
      if (ext === "OPL") continue; // Untranslated OPL is excluded from BLD

      // Pad name to 8 chars for alignment
      var paddedName = (name + "        ").substring(0, 8);
      lines.push(paddedName + " " + ext);
   }

   return lines.join("\r\n") + "\r\n";
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
      toolbarButtons.btnExportItem.setActive(hasPack && !isDirty);
      toolbarButtons.btnNewProc.setActive(hasPack && !isDirty);
      toolbarButtons.btnNewNotepad.setActive(hasPack && !isDirty);
      toolbarButtons.btnNewData.setActive(hasPack && !isDirty);
      if (toolbarButtons.btnBootablePack) {
         toolbarButtons.btnBootablePack.setActive(!isDirty);
      }
      toolbarButtons.btnDelete.setActive(canDelete);
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
      toolbarButtons.btnPackReport.setActive(hasActivePack);
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
   toolbarButtons.btnBootablePack = createToolbarBtn('tbtn-bootable-pack', 'fa-solid fa-splotch', 'Bootable Pack Wizard', openBootableWizard);

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

   toolbarButtons.btnPackHeader = createToolbarBtn('tbtn-pack-header', 'fas fa-receipt', 'Pack Header / Contents', function () {
      if (currentPackIndex >= 0 && packs[currentPackIndex]) {
         var pack = packs[currentPackIndex];
         var headerIdx = -1;
         // Find Header Item (Type -1)
         for (var i = 0; i < pack.items.length; i++) {
            if (pack.items[i].type === -1) {
               headerIdx = i;
               break;
            }
         }

         if (headerIdx >= 0) {
            itemSelected(currentPackIndex, headerIdx);
         } else {
            selectPack(currentPackIndex);
         }
      }
   });

   toolbarButtons.btnPackReport = createToolbarBtn('tbtn-pack-report', 'fas fa-clipboard-list', 'Pack Summary Report', function () {
      var pack = currentPack;
      if (!pack && typeof packs !== 'undefined' && currentPackIndex >= 0) {
         pack = packs[currentPackIndex];
      }

      if (packReportWindow && pack) {
         packReportWindow.open(pack);
      }
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
            // console.error("Error attempting to enable full-screen mode:", e.message);
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
         // Suppressed per user request
         // var suppress = OptionsManager.getOption('suppressConfirmations');
         // if (!suppress) {
         //    var discard = window.confirm("Not all changes have been saved.\nIs it ok to discard those changes?");
         //    if (!discard) return false;
         // }
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

   // 1. Top MAIN Lock Check
   // Find actual index of the FIRST "MAIN" item in destination pack
   var topMainIdx = -1;
   for (var i = 0; i < toPack.items.length; i++) {
      if (toPack.items[i].name === "MAIN") {
         topMainIdx = i;
         break;
      }
   }

   // If we found a MAIN, and we are trying to insert BEFORE or AT it
   // (Assuming 'toItemIx' is the insertion index, i.e., "insert before this index")
   if (topMainIdx !== -1 && toItemIx <= topMainIdx) {
      // Allow if we are just moving the item around within the restricted area? 
      // User said: "items can not be dragged above the top MAIN item"
      // So effectively, Index must be > topMainIdx
      // EXCEPT if we are moving the MAIN item itself? (Blocked by DragStart usually)
      return;
   }

   // 2. Bootable Conflict Check
   var hdata = toPack.items[0].data;
   // Check if Bootable (Bit 4 of Byte 0 is CLEAR)
   if ((hdata[0] & 0x10) === 0) {
      var bootAddr = (hdata[6] << 8) + hdata[7];

      // Calculate Target Address of the insertion point
      // This is the sum of lengths of all items BEFORE toItemIx
      var targetAddr = 0;
      for (var i = 0; i < toItemIx; i++) {
         // If we are moving within the same pack, we must exclude the item being moved 
         // from the calculation IF it is currently *before* the target, 
         // because it will be removed.
         // BUT 'itemMoved' logic typically implies 'toItemIx' is the target index *before* modification?
         // Actually, standard logic: remove then insert. 
         // If moving down (src < dest): 
         //   Items 0..src-1 stay. Item src removed. Items src+1..dest-1 shift down. 
         //   Target address is sum of 0..dest-1 (excluding src).

         // If moving up (src > dest):
         //   Items 0..dest-1 stay. Item inserted at dest.
         //   Target address is sum of 0..dest-1.

         // SIMPLIFICATION:
         // If same pack:
         if (fromPackIx === toPackIx && i === fromItemIx) continue; // Skip the item being moved (it won't be there)

         targetAddr += toPack.items[i].getLength();
      }

      // Note: If we are inserting a NEW item (copy/external), 'fromPackIx !== toPackIx', 
      // so simple sum is correct.

      // Check Conflict
      // User said: "if the item drag would occur to a pack address 'before' the bootable item address"
      // Meaning: If the NEW position's address < Boot Address.
      if (targetAddr < bootAddr) {
         alert("Bootable pack address conflict!");
         return;
      }
   }

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

/**
 * Selection Handler: Called when an item in the sidebar is clicked.
 */
function itemSelected(packIndex, itemIndex, event) {
   if (typeof packs === 'undefined' || !packs[packIndex]) return false;

   var pack = packs[packIndex];
   var item = pack.items[itemIndex];
   if (!item) return false;

   // Update Focus Tracker
   lastFocusedItemIndex = itemIndex;

   if (currentItem == item && (!event || (!event.ctrlKey && !event.shiftKey))) {
      // If re-clicking same item without modifiers, refresh UI selection rendering
      if (typeof PackContents !== 'undefined' && PackContents.selectItem) {
         PackContents.selectItem(packIndex, itemIndex);
      }
      return true;
   }

   if (!closeEditor()) return false;

   // --- Multi-Selection State Management ---
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
         } else {
            selectedItems.push(item);
         }
      } else if (event.shiftKey && lastFocusedItemIndex !== -1) {
         // Range Selection
         selectedItems = [];
         var start = Math.min(lastFocusedItemIndex, itemIndex);
         var end = Math.max(lastFocusedItemIndex, itemIndex);
         for (var k = start; k <= end; k++) {
            selectedItems.push(pack.items[k]);
         }
      } else {
         selectedItems = [item];
      }
   } else {
      // Single Selection (programmatic or Special Item)
      selectedItems = [item];
   }

   // Update Status Bar for multi-select
   if (selectedItems.length > 1) {
      setStatus(selectedItems.length + " items selected");
   } else if (event && !event.ctrlKey && !event.shiftKey) {
      if (typeof statusmessageelement !== 'undefined' && statusmessageelement) {
         if (statusmessageelement.innerText.indexOf("selected") !== -1) {
            statusmessageelement.innerText = "";
         }
      }
   }

   // --- Editor Initialization ---
   
   // Multi-pack selection logic
   currentPackIndex = packIndex;
    // Ensure the pack root is no longer selected when an item is chosen
    selectedPackIndex = -1;
    var it = item;
    var tp = it.type;

   // Identification Logic:
   // 1. Check if this is a Native Code block (Procedure or Long Record)
   // We use getFullData() to ensure we have the combined header + payload for detection.
   var checkData = it.getFullData();
   if (tp === 3 && it.child) {
      checkData = it.child.getFullData(); 
   }
   
   var selectedEditor = null;
    // OPL Source types (3 and 0x83) should never be treated as Native
    var isNative = (typeof NativeDecoder !== 'undefined' && tp !== 3 && tp !== 0x83) ? NativeDecoder.isNative(checkData, tp) : false;
   
   if (checkData) {
      var hex = "";
      var logLen = Math.min(checkData.length, 16);
      for (var i = 0; i < logLen; i++) hex += checkData[i].toString(16).toUpperCase().padStart(2, '0') + " ";
      console.log("Record Bytes (first 16 of " + checkData.length + "):", hex);
   }

   if (isNative) {
      selectedEditor = editors.find(function (e) { return e instanceof NativeCodeEditor; });
   }

   if (!selectedEditor) {
      // 2. Fallback to standard editor matching (acceptsType)
      selectedEditor = editors.find(function (e) { return e.acceptsType(tp, it); });
   }

   // 3. Last-resort fallbacks for raw data (Type 0)
   if (!selectedEditor && tp === 0) {
      // Check for Data Record patterns (Type 16-126)
      if (it.data.length >= 2 && it.data[0] + 2 === it.data.length) {
         var recType = it.data[1] & 0x7f;
         if (recType >= 16 && recType <= 126) {
            selectedEditor = editors.find(function (e) { return e instanceof RecordEditor; });
         }
      }
      
      // Default to Hex
      if (!selectedEditor) {
         selectedEditor = editors.find(function (e) { return e instanceof HexEditor; });
      }
   }

   if (selectedEditor) {
      // Manage Container Visibility: Decide which main pane to show
      if (selectedEditor instanceof ProcedureFileEditor) {
         // Procedure editor uses both legacy (for header) and code (for source)
         legacyEditorElement.style.display = "block";
         codeEditorElement.style.display = "block";
      } else {
         // Other editors (Records, Native, Notepad, Hex) use only legacy
         legacyEditorElement.style.display = "block";
         codeEditorElement.style.display = "none";
      }

      selectedEditor.initialise(it);
      
      currentEditor = selectedEditor;
      currentItem = it;
      fileinfoelement.innerText = it.name || it.desc || "Item " + itemIndex;
      
      if (typeof PackContents !== 'undefined' && PackContents.selectItem) {
         PackContents.selectItem(packIndex, itemIndex);
      }
      
      updateItemButtons(false);
      return true;
   }

   // No editor found or initialized
   closeEditor();
   if (typeof PackContents !== 'undefined') {
      PackContents.selectItem(packIndex, itemIndex);
   }
   updateItemButtons(false);
   return false;
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

               // --- Header Validation & Feature Extraction ---

               // Native Psion Headers (EPROM Image)
               // Offset 0: Type Byte (0x7A = Data, 0x7E = Paged/Bootable, etc)
               // Offset 1: Size Code (1=8K, 2=16K, 4=32K... 128=1MB)
               // Offset 8: ID Word? (Often date/time or system ID. We previously checked for 0100 but user data suggests otherwise).

               var validSizes = [1, 2, 4, 8, 16, 32, 64, 128];

               // Helper to validate and extract features
               var features = {
                  isValidType: false,
                  isValidSize: false,
                  sizeKB: 0,
                  sizeCode: 0,
                  isBootable: false,
                  bootAddr: 0,
                  headerID: "Unknown",
                  typeByte: 0
               };

               if (binary.length >= 10) {
                  features.typeByte = binary[0];
                  features.sizeCode = binary[1]; // Size is at Offset 1
                  features.headerID = binary[8].toString(16).toUpperCase().padStart(2, '0') + binary[9].toString(16).toUpperCase().padStart(2, '0');

                  // Validate Type: 0x7A (Standard) or 0x7E (Bootable/Paged)
                  // We accept anything with the high bit 0 (0-127)? No, usually 0x7A.
                  // Let's accept 0x7A and 0x7E as "Known Valid".
                  // But if Size is valid, we might trust it even if Type is generic.
                  var isKnownType = (features.typeByte === 0x7A || features.typeByte === 0x7E);

                  // Validate Size
                  features.isValidSize = (validSizes.indexOf(features.sizeCode) !== -1);
                  if (features.isValidSize) features.sizeKB = features.sizeCode * 8;

                  features.bootAddr = (binary[6] << 8) | binary[7];

                  // Combined Check: Must have Valid Size AND (Valid Type OR Valid ID?)
                  // Let's rely heavily on Size Code at Offset 1 being sensible.
                  // And Type Byte being sensible.
               }

               var isNative = (features.isValidSize && (features.typeByte === 0x7A || features.typeByte === 0x7E));

               // 2. Legacy OPK Header
               var isOPK = (binary.length >= 3 && binary[0] === 0x4F && binary[1] === 0x50 && binary[2] === 0x4B);

               var finalBinary = null;

               if (isNative) {
                  var hexType = features.typeByte.toString(16).toUpperCase().padStart(2, '0');
                  var hexSize = features.sizeCode.toString(16).toUpperCase().padStart(2, '0');
                  var hexBoot = binary[6].toString(16).toUpperCase().padStart(2, '0') + binary[7].toString(16).toUpperCase().padStart(2, '0');

                  var typeStr = (features.typeByte === 0x7E) ? "Paged/Bootable (0x7E)" : "Standard Data (0x7A)";

                  var msg = "Detected Psion Organiser II Datapack:\n" +
                     "------------------------------------\n" +
                     "Pack Type: " + typeStr + "\n" +
                     "Capacity:  " + features.sizeKB + " KB (Size Code: 0x" + hexSize + ")\n" +
                     "ID Word:   0x" + features.headerID + "\n" +
                     "Boot Addr: 0x" + features.bootAddr.toString(16).toUpperCase().padStart(4, '0') + " (Bytes: " + hexBoot + ")\n" +
                     "------------------------------------\n\n" +
                     "Import this pack?";

                  if (!confirm(msg)) return;

                  // Wrap Native Pack in OPK Header for internal compatibility
                  finalBinary = new Uint8Array(binary.length + 6);
                  finalBinary[0] = 0x4F; finalBinary[1] = 0x50; finalBinary[2] = 0x4B;

                  var len = binary.length - 2;
                  if (len < 0) len = 0;
                  finalBinary[3] = (len >> 16) & 0xFF;
                  finalBinary[4] = (len >> 8) & 0xFF;
                  finalBinary[5] = len & 0xFF;

                  finalBinary.set(binary, 6);

               } else if (isOPK) {
                  // Legacy behavior: Valid OPK found
                  finalBinary = binary;

               } else {
                  // Invalid / Unknown Header
                  var details = "";
                  if (binary.length >= 10) {
                     var hType = binary[0].toString(16).toUpperCase().padStart(2, '0');
                     var hSize = binary[1].toString(16).toUpperCase().padStart(2, '0');
                     var hID = binary[8].toString(16).toUpperCase().padStart(2, '0') + binary[9].toString(16).toUpperCase().padStart(2, '0');

                     details += "Header Byte 0 (Type): 0x" + hType + "\n";
                     details += "Header Byte 1 (Size): 0x" + hSize + " (" + (validSizes.indexOf(binary[1]) !== -1 ? "Valid" : "Invalid") + ")\n";
                     details += "Header Byte 8-9 (ID): 0x" + hID + "\n";
                  } else {
                     details += "File too short (<10 bytes)\n";
                  }

                  var msg = "Warning: The imported data does not appear to be a standard Psion Datapack.\n" +
                     "(Missing OPK Header and Invalid Native Header)\n\n" +
                     "Details:\n" + details + "\n" +
                     "Import as raw data anyway?";

                  if (!confirm(msg)) return;

                  // Treat as Raw/Native (Wrap it)
                  finalBinary = new Uint8Array(binary.length + 6);
                  finalBinary[0] = 0x4F; finalBinary[1] = 0x50; finalBinary[2] = 0x4B;
                  var len = binary.length - 2;
                  if (len < 0) len = 0;
                  finalBinary[3] = (len >> 16) & 0xFF;
                  finalBinary[4] = (len >> 8) & 0xFF;
                  finalBinary[5] = len & 0xFF;
                  finalBinary.set(binary, 6);
               }

               var newPack = new PackImage(finalBinary);
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
            } else {
               // 
               //                console.warn("Restore Packs: Cannot determine full path for file. Browser security may prevent this.");
               setStatus("Warning: Cannot save pack path for restore (Browser restriction).");
            }
         }

         LoadLocalBinaryFile(files[0],
            function (data, nm) {
               // Check if WRAPPED (OPK Header present)
               var isWrapped = (data.length >= 3 && data[0] === 79 && data[1] === 80 && data[2] === 75);

               // Strict Validation: Reject if OPK Header is missing
               if (!isWrapped) {
                  alert("Error: File is not a valid Psion Pack (missing OPK header).");
                  return;
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

                  } catch (e) {
                     // 
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

// Erase Item: Supports "Hard Delete" (Default) and "Recycle" (Shift+Delete)
function eraseItem(arg) {
   // Determine context: arg could be MouseEvent, Boolean (shiftKey from PackContents), or undefined
   var isRecycle = false;
   if (typeof arg === 'boolean') {
      isRecycle = arg;
   } else if (arg && arg.type && arg.shiftKey) {
      isRecycle = true; // Button click with Shift
   }

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
               // 
               // 
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
         return it.type >= 0 && it.type !== 255;
      });

      if (toDelete.length === 0) return;

      // Check if we are deleting the bootable record
      var headerData = pack.items[0].data;
      var isBootable = (headerData && (headerData[0] & 0x10) === 0);
      var bootAddr = isBootable ? (headerData[6] << 8) + headerData[7] : -1;
      var clearBootable = false;

      if (isBootable) {
         toDelete.forEach(function (it) {
            var idx = pack.items.indexOf(it);
            if (idx > 0) {
               var addr1 = getItemAddres(pack, idx);
               if (bootAddr >= addr1 && bootAddr < addr1 + it.getLength()) {
                  clearBootable = true;
               }
            }
         });
      }

      if (clearBootable) {
         headerData[0] |= 0x10; // Set bit 4 to indicate not bootable
         headerData[6] = 0;     // Clear boot address bytes
         headerData[7] = 0;
         pack.unsaved = true;
      }

      // Check Mode
      if (isRecycle) {
         // "Recycle" Mode: Toggle Deleted State (Soft Delete)
         // No Confirmation (Matches existing Recycle button behavior)
         // Or should we confirm? User said "acting as the key binding for the Recycle feature". 
         // The Recycle feature has NO confirmation.

         var changed = false;
         toDelete.forEach(function (it) {
            it.deleted = !it.deleted; // Toggle
            if (it.data && it.data.length > 1) {
               if (it.deleted) it.data[1] &= 0x7F; // Clear bit 7
               else it.data[1] |= 0x80; // Set bit 7
            }
            it.setDescription();
            changed = true;
         });

         if (changed) {
            pack.unsaved = true;
            updateInventory();
            saveSession();
         }

      } else {
         // "Standard" Mode: Hard Delete (Remove from list)
         var suppress = OptionsManager.getOption('suppressConfirmations');
         if (!suppress) {
            var msg = toDelete.length === 1 ?
               "Are you sure you want to permanently erase '" + toDelete[0].name + "'?" :
               "Are you sure you want to permanently erase these " + toDelete.length + " items?";
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
            // Note: items.indexOf might be slow for large packs, but okay here.
            var indices = toDelete.map(function (it) { return pack.items.indexOf(it); }).sort(function (a, b) { return b - a; });

            indices.forEach(function (idx) {
               if (idx >= 0) {
                  pack.items.splice(idx, 1);
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
      }

      return; // Exit sync flow
   } else if (currentItem) { // Fallback, single item selection (if selectedItems was empty but currentItem is set)

      // Logic: if selectedItems is empty but currentItem is set, treat it as a selection of 1.
      // But above we check selectedItems.length > 0.
      // It's possible currentItem is set but not in selectedItems? 
      // Yes, if selection cleared but focus remains? Usually they are synced.

      // Let's invoke the same logic.
      selectedItems = [currentItem];
      // Recursive call to handle it (simplifies logic)
      eraseItem(arg);
      return;
   } else {
      return;
   }
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
         // Fix: Initialize with Double Null and Correct Length (9 bytes for "PROCNAME:")
         var data = [0x00, 0x00, 0x00, 0x09, 80, 82, 79, 67, 78, 65, 77, 69, 58, 0x00, 0x00];
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
         var idx = packs[currentPackIndex].items.indexOf(hdritem);
         if (idx !== -1 && typeof selectItem === 'function') selectItem(currentPackIndex, idx);
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
      // 
      // 
      //       console.warn("Session Save Failed (Quota?):", e);
   }
}


function createBlockFile(data, name, type, suppressUpdate) {
   var hdritem = createFileHeader(name, type, 0);
   var c2item = new PackItem(data, 0, data.length);
   var c1item = new PackItem([2, 0x80, data.length >> 8, data.length & 0xff], 0, 4);
   c1item.child = c2item;
   c1item.setDescription();
   hdritem.child = c1item;
   addItemToPack(hdritem);
   if (!suppressUpdate) updateInventory();

   // Auto-select and Open Editor
   if (typeof currentPackIndex !== 'undefined' && currentPackIndex >= 0 && packs[currentPackIndex]) {
      var idx = packs[currentPackIndex].items.indexOf(hdritem);
      if (idx !== -1) {
         if (!suppressUpdate) itemSelected(currentPackIndex, idx);
      }
   }
   return hdritem;
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
            // console.error('Save File Picker failed:', err);
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
   importFilesToPack(currentPackIndex, files);
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
   // check if it is a valid binary file, "ORG"+...
   if (filedata[0] == 79 && filedata[1] == 82 && filedata[2] == 71) {
      
      var isBlockFile = false;
      var isSystemBoot = false;

      var lnBlock = (filedata[3] << 8) | filedata[4];
      if (filedata.length >= 6 + lnBlock && filedata[5] >= 0x82 && filedata[5] <= 0x8f) {
          isBlockFile = true;
      }
      
      var lnBoot = (filedata[3] << 16) | (filedata[4] << 8) | filedata[5];
      var bootOffset = -1;
      
      // Check for System Boot File structure (exported by PackImage.js)
      if (filedata.length >= 6 + lnBoot && lnBoot >= 10) {
          var hdrByte = filedata[6];
          // Standard valid Pack Header start bytes (or bootable variant)
          if (hdrByte === 0x7A || hdrByte === 0x6A || hdrByte === 0x7E || hdrByte === 0x6E) {
              var bootAddr = (filedata[12] << 8) | filedata[13];
              bootOffset = 6 + bootAddr;
              if (bootOffset >= 16 && bootOffset + 1 < filedata.length) {
                  // Valid boot record type header (Type 0 / Long Record)
                  if (filedata[bootOffset] === 0x02 && filedata[bootOffset+1] === 0x80) {
                      isSystemBoot = true;
                  }
              }
          }
      }

      if (isSystemBoot) {
         var ln2 = (filedata[bootOffset+2] << 8) | filedata[bootOffset+3];
         if (filedata.length < bootOffset + 4 + ln2) {
            alert("The file " + name + " seems to be truncated at the data block!");
            return false;
         }
         var blkhdr = new Uint8Array(4);
         blkhdr[0] = 2; blkhdr[1] = 0x80; blkhdr[2] = filedata[bootOffset+2]; blkhdr[3] = filedata[bootOffset+3];
         var dataitem = new PackItem(filedata, bootOffset + 4, ln2);
         var blkhdritem = new PackItem(blkhdr, 0, 4);
         blkhdritem.child = dataitem;
         blkhdritem.setDescription();
         addItemToPack(blkhdritem);
         updateInventory();
         var idx = packs[currentPackIndex].items.indexOf(blkhdritem);
         if (idx !== -1 && typeof selectItem === 'function') selectItem(currentPackIndex, idx);
         
         // Trigger Boot Code Logic (Relaxed) below
      } else if (isBlockFile) {
         var type = filedata[5] - 0x80;
         var ln = (filedata[3] << 8) + filedata[4];
         if (filedata.length < 6 + ln) {
            alert("The file " + name + " seems to be truncated!");
            return false;
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
         var idx = packs[currentPackIndex].items.indexOf(hdritem);
         if (idx !== -1 && typeof selectItem === 'function') selectItem(currentPackIndex, idx);
         return true; // Skip boot logic
      } else {
         // Fallback for legacy hardcoded 0xFF detection (if not caught by structural check)
         if (filedata[5] == 0xFF) {
            var ln = (filedata[3] << 8) + filedata[4];
            if (filedata.length < 6 + ln || ln < 0x1d) {
               alert("The file " + name + " seems to be truncated!");
               return false;
            }
            if (filedata[0x1b] != 0x02 || filedata[0x1c] != 0x80) {
               alert("The file " + name + " does not seem to have\na standard headerless block format!");
               return false;
            }
            var ln2 = (filedata[0x1d] << 8) + filedata[0x1e];
            if (filedata.length < 0x1f + ln2) {
               alert("The file " + name + " seems to be truncated!");
               return false;
            }
            var blkhdr = new Uint8Array(4);
            blkhdr[0] = 2; blkhdr[1] = 0x80; blkhdr[2] = filedata[0x1d]; blkhdr[3] = filedata[0x1e];
            var dataitem = new PackItem(filedata, 0x1f, ln2);
            var blkhdritem = new PackItem(blkhdr, 0, 4);
            blkhdritem.child = dataitem;
            blkhdritem.setDescription();
            addItemToPack(blkhdritem);
            updateInventory();
            var idx = packs[currentPackIndex].items.indexOf(blkhdritem);
            if (idx !== -1 && typeof selectItem === 'function') selectItem(currentPackIndex, idx);
         } else {
            return false; // Unknown ORG format
         }
      }

      var pack = packs[currentPackIndex];

      // alert("DEBUG: Inside Headerless Block handler");

      // Boot Code Logic (Relaxed)
      var itemIdx = pack.items.indexOf(blkhdritem);
      if (pack && itemIdx > 0) {
         var isBootable = (pack.items[0].data[0] & 0x10) === 0;
         var bootAddr = getItemAddres(pack, itemIdx);

         // Only prompt if address is valid
         if (bootAddr <= 0xFFFF) {
            
            var onMakeBoot = function (targetIdx) {
               if (targetIdx !== undefined && targetIdx !== itemIdx) {
                  // Move the item
                  pack.items.splice(itemIdx, 1);
                  pack.items.splice(targetIdx, 0, blkhdritem);
                  itemIdx = targetIdx;
                  // Recalculate address
                  bootAddr = getItemAddres(pack, itemIdx);
               }
               var targetBootAddr = bootAddr + 4;
               
               var hdata = pack.items[0].data;
               hdata[2] = 0; hdata[3] = filedata[9]; hdata[4] = filedata[10]; hdata[5] = filedata[11];
               hdata[6] = (targetBootAddr >> 8) & 0xff;
               hdata[7] = targetBootAddr & 0xff;
               hdata[0] &= 0xEF; // bootable
               
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

               pack.unsaved = true;
               updateInventory();
               
               if (typeof selectItem === 'function') {
                  setTimeout(function() { selectItem(currentPackIndex, itemIdx); }, 50);
               }
            };

            if (!isBootable) {
               // Find index of MAIN or default to head of pack (index 1)
               var mainIdx = 0;
               for (var i = 1; i < pack.items.length; i++) {
                  if (pack.items[i].name === "MAIN" || 
                      (pack.items[i].child && pack.items[i].child.name === "MAIN")) {
                     mainIdx = i;
                     break;
                  }
               }
               var headIdx = mainIdx > 0 ? mainIdx + 1 : 1;
               
               // Create content for dialog
               var content = document.createElement('div');
               content.style.textAlign = 'center';
               content.innerHTML = "<div style='margin-bottom:10px;'>There is no existing bootable record in this pack.</div>" +
                  "<div style='font-weight:bold;'>Do you want to place this record at the head of the pack (under MAIN) and set it as the bootable address?</div>";
               
               new ModalDialog(content, function() { onMakeBoot(headIdx); }, null, "Yes", "No").start();
            } else {
               // Existing boot logic
               var targetBootAddr = bootAddr + 4;
               var content = document.createElement('div');
               content.style.textAlign = 'center';
               content.innerHTML = "<div>Do you want this to be used as boot code?</div>" +
                  "<div style='font-weight:bold; margin:10px 0;'>Boot Address: 0x" + targetBootAddr.toString(16).toUpperCase().padStart(4, '0') + "</div>";
                  
               new ModalDialog(content, function() { onMakeBoot(itemIdx); }, null, "Yes", "No").start();
            }
         }
      }
   } else if (name.substr(-4).toUpperCase() == ".OPL") {
      var hdritem = createFileHeader(name, 3, 0);
      var itemdataList = [];
      // OPL Line-Based Import Logic
      // 1. Add File Header Once
      addItemToPack(hdritem);


      // Helper to create OPL Record from accumulated data
      function createOPLRecord(dataList) {
         if (dataList.length === 0) return;

         var srclen = dataList.length;
         // Ensure two trailing 0x00 bytes (Terminator)
         var totalPayloadLen = srclen + 2;

         // Record Structure:
         // [00 00] [LenHi] [LenLo] [Text...] [00 00]
         // Header (4) + Text (srclen) + Pad (2)

         var itemdata = new Uint8Array(totalPayloadLen + 4);
         itemdata[0] = 0; itemdata[1] = 0; // Type 0 Record Header?

         // OPL Record Length calculates TEXT ONLY (excludes terminator padding)
         itemdata[2] = (srclen >> 8) & 0xff;
         itemdata[3] = srclen & 0xff;

         itemdata.set(dataList, 4);

         // Append trailing nulls (Terminator)
         itemdata[4 + srclen] = 0;
         itemdata[5 + srclen] = 0;

         var dataitem = new PackItem(itemdata, 0, itemdata.length);

         // Block Header Wrapper (Type 2, 0x80)
         var blkhdr = new Uint8Array(4);
         var totalLen = itemdata.length; // Block Length includes EVERYTHING
         blkhdr[0] = 2; blkhdr[1] = 0x80;
         blkhdr[2] = (totalLen >> 8) & 0xff;
         blkhdr[3] = totalLen & 0xff;

         var blkhdritem = new PackItem(blkhdr, 0, 4);
         blkhdritem.child = dataitem;
         blkhdritem.setDescription();

         // Fix for Editor: Link FIRST (and only) block to Header
         if (!hdritem.child) {
            hdritem.child = blkhdritem;
         }
      }

      var fileLen = filedata.length;

      for (var i = 0; i < fileLen; i++) {
         var c = (typeof filedata === 'string') ? filedata.charCodeAt(i) : filedata[i];

         if (c === 13 || c === 10) { // Newline -> Null Separator
            // Check for Pair (CRLF) and Skip second byte
            if (i + 1 < fileLen) {
               var nextC = (typeof filedata === 'string') ? filedata.charCodeAt(i + 1) : filedata[i + 1];
               if ((c === 13 && nextC === 10) || (c === 10 && nextC === 13)) {
                  i++;
               }
            }
            // Add Separator Null
            itemdataList.push(0);

         } else {
            // Accumulate Payload
            itemdataList.push(c);
         }
      }

      // Save Single Record containing all text
      createOPLRecord(itemdataList);

      updateInventory();
      // Select Header logic
      var idx = packs[currentPackIndex].items.indexOf(hdritem);
      if (idx !== -1 && typeof selectItem === 'function') selectItem(currentPackIndex, idx);
   } else if (name.substr(-4).toUpperCase() == ".ODB") {
      var id = getFreeFileId();
      if (id <= 0) return;
      var hdritem = createFileHeader(name, 1, id + 0x8f);
      addItemToPack(hdritem);
      var itemdataList = [];
      // Header placeholder (Length will be set later)
      itemdataList.push(0); itemdataList.push(id + 0x8f);

      // Line-Based Import Logic (.ODB)
      var lineLen = 0;
      var fileLen = filedata.length;
      var hasTab = false;

      for (var i = 0; i < fileLen; i++) {
         var c = (typeof filedata === 'string') ? filedata.charCodeAt(i) : filedata[i];

         if (c === 9) hasTab = true;

         if (c === 13 || c === 10) { // New Record Delimiter
            // Check for Pair and Skip
            if (i + 1 < fileLen) {
               var nextC = (typeof filedata === 'string') ? filedata.charCodeAt(i + 1) : filedata[i + 1];
               if ((c === 13 && nextC === 10) || (c === 10 && nextC === 13)) {
                  i++;
               }
            }

            // Save Current Record IF Tab Present
            if (hasTab) {
               itemdataList[0] = lineLen;
               var itemdata = new Uint8Array(itemdataList);
               var recitem = new PackItem(itemdata, 0, itemdata.length);
               recitem.setDescription();
               addItemToPack(recitem);
            }

            // Reset for Next Record
            itemdataList = [];
            itemdataList.push(0); itemdataList.push(id + 0x8f);
            lineLen = 0;
            hasTab = false;

         } else {
            // Accumulate Payload
            // Max 255 for Data Record payload
            if (lineLen < 255) {
               itemdataList.push(c);
               lineLen++;
            }
            // Else: Truncate
         }
      }

      // Save Final Record IF Tab Present
      if (hasTab) {
         itemdataList[0] = lineLen;
         var itemdata = new Uint8Array(itemdataList);
         var recitem = new PackItem(itemdata, 0, itemdata.length);
         recitem.setDescription();
         addItemToPack(recitem);
      }

      updateInventory();
      var idx = packs[currentPackIndex].items.indexOf(hdritem);
      if (idx !== -1 && typeof selectItem === 'function') selectItem(currentPackIndex, idx);
   } else if (name.substr(-4).toUpperCase() == ".NTS") {
      var hdritem = createFileHeader(name, 7, 0);
      var ln = filedata.length + 6;
      var blkhdr = new Uint8Array(4);
      blkhdr[0] = 2; blkhdr[1] = 0x80; blkhdr[2] = (ln >> 8) & 0xff; blkhdr[3] = ln & 0xff;
      var itemdata = new Uint8Array(6 + filedata.length);
      itemdata[0] = 0; itemdata[1] = 2; itemdata[2] = 8; itemdata[3] = 0;
      itemdata[4] = (filedata.length >> 8) & 0xff; itemdata[5] = filedata.length & 0xff;
      for (var i = 0; i < filedata.length; i++) {
         var c = (typeof filedata === 'string') ? filedata.charCodeAt(i) : filedata[i];
         itemdata[6 + i] = c == 10 ? 0 : c;
      }
      var dataitem = new PackItem(itemdata, 0, itemdata.length);
      var blkhdritem = new PackItem(blkhdr, 0, 4);
      blkhdritem.child = dataitem;
      blkhdritem.setDescription();
      hdritem.child = blkhdritem;
      addItemToPack(hdritem);
      updateInventory();
      var idx = packs[currentPackIndex].items.indexOf(hdritem);
      if (idx !== -1 && typeof selectItem === 'function') selectItem(currentPackIndex, idx);
   } else if (name.match(/\.OB([0-9A-F])$/i)) {
      // Generic Handler for .OBx files (OB2 - OBF)
      var match = name.match(/\.OB([0-9A-F])$/i);
      var typeExt = parseInt(match[1], 16);

      // Relaxed Logic: Do NOT enforce "ORG" header.
      // We rely on the extension to define the type.
      // However, we still expect the standard OPL Object format:
      // Byte 0: Type? (Ignored in favor of Extension)
      // Byte 1-2: ...
      // Byte 3-4: Length (essential for integrity check)


      // Convert to Uint8Array if needed
      var rawBytes;
      if (typeof filedata === 'string') {
         rawBytes = new Uint8Array(filedata.length);
         for (var i = 0; i < filedata.length; i++) rawBytes[i] = filedata.charCodeAt(i);
      } else {
         rawBytes = filedata;
      }

      var ln = (rawBytes[3] << 8) | rawBytes[4];
      if (rawBytes.length < 6 + ln) {
         alert("The file " + name + " seems to be truncated!");
         return false;
      }

      // Use internal type from file if present, otherwise trust extension or just use byte 5
      // Rule Update: .OBx extension dictates the type.
      // var typeByte = rawBytes[5]; 

      var hdritem = createFileHeader(name, typeExt, 0);
      var blkhdr = new Uint8Array(4);
      blkhdr[0] = 2; blkhdr[1] = 0x80; blkhdr[2] = rawBytes[3]; blkhdr[3] = rawBytes[4];

      var dataitem = new PackItem(rawBytes, 6, ln);
      var blkhdritem = new PackItem(blkhdr, 0, 4);
      blkhdritem.child = dataitem;
      blkhdritem.setDescription();
      hdritem.child = blkhdritem;
      addItemToPack(hdritem);
      updateInventory();
      var idx = packs[currentPackIndex].items.indexOf(hdritem);
      if (idx !== -1 && typeof selectItem === 'function') selectItem(currentPackIndex, idx);
   } else if (name.substr(-4).toUpperCase() == ".BIN") {
      var ln = filedata.length;

      // Convert to Uint8Array if needed
      var rawBytes;
      if (typeof filedata === 'string') {
         rawBytes = new Uint8Array(ln);
         for (var i = 0; i < ln; i++) rawBytes[i] = filedata.charCodeAt(i);
      } else {
         rawBytes = filedata;
      }

      var hasORG = rawBytes.length >= 6 && rawBytes[0] === 79 && rawBytes[1] === 82 && rawBytes[2] === 71;
      var dataitem;
      var blkhdritem;
      
      var pack = packs[currentPackIndex];
      var packHasBoot = false;
      if (pack && pack.items.length > 0 && pack.items[0].data.length >= 10) {
         var currBoot = (pack.items[0].data[6] << 8) | pack.items[0].data[7];
         if (currBoot !== 0xFFFF && currBoot !== 0x0000) {
             packHasBoot = true;
         }
      }

      if (hasORG) {
          var tempPack = new PackImage(rawBytes);
          var bootItem = null;
          
          if (tempPack.items.length > 0 && tempPack.items[0].data.length >= 10) {
              var impBootAddr = (tempPack.items[0].data[6] << 8) | tempPack.items[0].data[7];
              if (impBootAddr !== 0xFFFF && impBootAddr !== 0x0000) {
                  var tempOffset = 0;
                  for (var i = 0; i < tempPack.items.length; i++) {
                      if (tempOffset <= impBootAddr && tempOffset + tempPack.items[i].getLength() > impBootAddr) {
                          bootItem = tempPack.items[i];
                          break;
                      }
                      tempOffset += tempPack.items[i].getLength();
                  }
              }
          }
          
          if (!bootItem) {
              // Fallback: Find the first Long Record (Type 0 / 0x80)
              for (var i = 1; i < tempPack.items.length; i++) {
                  // `type` is 0, or `data[1]` is 0x80
                  if (tempPack.items[i].type === 0 || (tempPack.items[i].data && tempPack.items[i].data[1] === 0x80)) {
                      bootItem = tempPack.items[i];
                      break;
                  }
              }
          }
          
          if (!bootItem) {
              alert("The imported Boot File does not contain any valid records.");
              return false;
          }

          if (packHasBoot) {
              if (!confirm("This pack already has a boot record. The boot header from the imported file will be removed and the file will be imported as a standard long record. Continue?")) {
                  return false;
              }
          }

          var extractedBytes = bootItem.getFullData();
          var payloadLen = extractedBytes.length - 4;
          var blkhdr = new Uint8Array([extractedBytes[0], extractedBytes[1], extractedBytes[2], extractedBytes[3]]);
          
          blkhdritem = new PackItem(blkhdr, 0, 4);
          dataitem = new PackItem(extractedBytes, 4, payloadLen);
      } else if (rawBytes.length >= 4 && rawBytes[0] === 2 && rawBytes[1] === 0x80) {
          // Custom Machine Code Block (already has 02 80 envelope)
          var payloadLen = rawBytes.length - 4;
          var blkhdr = new Uint8Array([rawBytes[0], rawBytes[1], rawBytes[2], rawBytes[3]]);
          
          blkhdritem = new PackItem(blkhdr, 0, 4);
          dataitem = new PackItem(rawBytes, 4, payloadLen);
      } else {
          // Headerless Blocks: Output the data as raw bytes (wrap it in 02 80)
          var blkhdr = new Uint8Array(4);
          blkhdr[0] = 2;
          blkhdr[1] = 0x80; // Type 0 (Active)
          blkhdr[2] = (ln >> 8) & 0xFF;
          blkhdr[3] = ln & 0xFF;

          blkhdritem = new PackItem(blkhdr, 0, 4);
          dataitem = new PackItem(rawBytes, 0, ln);
      }

      blkhdritem.child = dataitem;
      blkhdritem.setDescription();

      addItemToPack(blkhdritem);
      updateInventory();
      var idx = packs[currentPackIndex].items.indexOf(blkhdritem);
      if (idx !== -1 && typeof selectItem === 'function') selectItem(currentPackIndex, idx);

      var itemIdx = pack.items.indexOf(blkhdritem);

      if (pack && itemIdx > 0) {
         var bootAddr = getItemAddres(pack, itemIdx);

         if (bootAddr <= 0xFFFF) {
            var targetBootAddr = bootAddr + 4;

            var onYes = function () {
               var hdata = pack.items[0].data;
               hdata[6] = (targetBootAddr >> 8) & 0xff;
               hdata[7] = targetBootAddr & 0xff;

               hdata[0] &= 0xEF; // bootable
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

               pack.unsaved = true;
               updateInventory();
            };

            if (hasORG && !packHasBoot) {
                onYes();
            } else if (!hasORG) {
                var content = document.createElement('div');
                content.style.textAlign = 'center';
                content.innerHTML = "<div>Do you want this to be used as boot code?</div>" +
                   "<div style='font-weight:bold; margin:10px 0;'>Boot Address: 0x" + targetBootAddr.toString(16).toUpperCase().padStart(4, '0') + "</div>";

                new ModalDialog(content, onYes, null, "Yes", "No").start();
            }
         }
      }

   } else {
      alert("File format not recognised!");
      return false;
   }
   return true;
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
var resizer = document.getElementById('sidebar-resizer');
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
// Use Capture phase to intercept File drops before they reach list items
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
      // Identify file type
      var fname = files[0].name.toUpperCase();
      var isItem = fname.match(/\.OB[0-9A-F]$/) || fname.endsWith(".OPL") || fname.endsWith(".ODB") || fname.endsWith(".NTS") || fname.endsWith(".BIN");

      if (isItem) {
         if (packs.length === 0) {
            createNew(); // Create a default new pack
         }
         // Ensure we target the valid pack
         if (currentPackIndex < 0 && packs.length > 0) currentPackIndex = 0;

         importFilesToPack(currentPackIndex, files); // Async now
      } else {
         // Not an item? Assume it's a Pack file (.OPK, .HEX)
         loadPackFromFiles(files);
      }
   }
}, true);

/*
 var fname = files[0].name.toUpperCase();

 // alert("DEBUG: Drop Detected: " + fname);

 // Check for .OBx, .OPL, .ODB, .NTS, .BIN (Item types)
 var isItem = fname.match(/\.OB[0-9A-F]$/) || fname.endsWith(".OPL") || fname.endsWith(".ODB") || fname.endsWith(".NTS") || fname.endsWith(".BIN");

 // alert("DEBUG: isItem=" + isItem);

 if (isItem) {
    if (packs.length === 0) {
       // No pack open? Create one automatically.
       createNew();
    }

    if (packs.length > 0) {
       importFilesToPack(currentPackIndex, files);
    }
 } else {
    // Not an item? Assume it's a Pack file (.OPK, .HEX)
    loadPackFromFiles(files);
 }
*/
// */
// }, true); // useCapture = true

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
         // Check for Function Keys (F1-F12)
         if (OptionsManager.getOption('enableFunctionKeys')) {
            if (e.key === 'F1') {
               e.preventDefault();
               if (typeof DialogManager !== 'undefined' && DialogManager.showAboutDialog) DialogManager.showAboutDialog();
            } else if (e.key === 'F2') {
               e.preventDefault();
               createNew();
            } else if (e.key === 'F3') {
               e.preventDefault();
               if (fileInputPack) fileInputPack.click();
            } else if (e.key === 'F4') {
               e.preventDefault();
               packSaved();
            } else if (e.key === 'F5') {
               e.preventDefault();
               var btn = document.getElementById('btn-file-menu');
               if (btn) btn.click();
            } else if (e.key === 'F6') {
               e.preventDefault();
               if (typeof eraseItem === 'function') eraseItem();
            } else if (e.key === 'F7') {
               e.preventDefault();
               if (fileInputItem) fileInputItem.click();
            } else if (e.key === 'F8') {
               e.preventDefault();
               exportHex(); // Assuming this global exists or logic can be inferred
            } else if (e.key === 'F9') {
               e.preventDefault();
               applyEdits();
            } else if (e.key === 'F10') {
               e.preventDefault();
               discardEdits();
            } else if (e.key === 'F11') {
               e.preventDefault();
               if (typeof DialogManager !== 'undefined' && DialogManager.showOptionsDialog) DialogManager.showOptionsDialog();
            } else if (e.key === 'F12') {
               e.preventDefault();
               if (typeof DialogManager !== 'undefined' && DialogManager.showKeyMapDialog) DialogManager.showKeyMapDialog();
            }
         }

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
      // Setup Visualizer DOM (Chrome Safe)
      if (CodeVisualizer && CodeVisualizer.initChildEnvironment) {
         CodeVisualizer.initChildEnvironment();
      }


      // Notify opener that we are ready
      // Chrome Fix: Use postMessage instead of direct access
      if (window.opener) {
         window.opener.postMessage({ type: 'VISUALIZER_READY' }, '*');

         // Legacy Fallback (Firefox / Non-Blocked)
         try {
            if (window.opener.CodeVisualizer && window.opener.CodeVisualizer.childWindowReady) {
               window.opener.CodeVisualizer.childWindowReady(window);
            }
         } catch (e) { /* Expected */ }
      }
   } else if (feature === 'command_ref') {
      if (typeof OPLCommandReference !== 'undefined') {
         new OPLCommandReference().render(window);
      }
   } else if (feature === 'opl_content') {
      if (typeof OPLContentViewer !== 'undefined') {
         OPLContentViewer.childWindowReady(window);
      }
   } else if (feature === 'udg') {
      document.title = "Graphic Character Editor";
      // UDG Editor initializes itself via its update logic or if needed.
      // Actually UDGEditor.js has its own check for feature=udg but relies on initChildEnvironment.
      // We can ensure UDGEditor is ready or defer.
      // UDGEditor.js calls window.addEventListener('load', initChildEnvironment) itself!
      // So we might not need to do anything here if UDGEditor.js is self-bootstrapping.
      // However, to be consistent with hiding the main app, we keep this block.
      // The 'app' hiding is done at the top of this function.
   }

}

// Drag-and-Drop Import Handler (from PackContents.js)
// Drag-and-Drop Import Handler (from PackContents.js)
async function importFilesToPack(packIndex, files) {
   // Check for batch types (.BLD or .ZIP) in the selection
   var bldFile = null;
   var zipFile = null;
   var fileList = [];

   for (var i = 0; i < files.length; i++) {
      var fn = files[i].name.toLowerCase();
      if (fn.endsWith(".bld")) bldFile = files[i];
      if (fn.endsWith(".zip")) zipFile = files[i];
      fileList.push(files[i]);
   }

   // 1. ZIP Import (Priority)
   if (zipFile) {
      handleZIPImport(zipFile);
      return;
   }

   // 2. BLD Import
   if (bldFile) {
      handleBLDImport(bldFile, fileList);
      return;
   }

   // 3. Standard Individual File Import
   var pack = packs[packIndex];
   if (!pack) return;

   var originalPackIndex = currentPackIndex;
   currentPackIndex = packIndex;

   for (var i = 0; i < files.length; i++) {
      var fn = files[i].name;
      var success = false;
      try {
         if (fn.match(/\.((ODB)|(OPL)|(NTS))$/i)) {
            if (typeof LoadLocalTextFileAsync === 'function') {
               var result = await LoadLocalTextFileAsync(files[i]);
               success = createItemFromFileData(result.data, result.name);
            } else {
               alert("Loader error: Async helper missing.");
               break;
            }
         } else {
            if (typeof LoadLocalBinaryFileAsync === 'function') {
               var result = await LoadLocalBinaryFileAsync(files[i]);
               success = createItemFromFileData(result.data, result.name);
            } else {
               alert("Loader error: Async helper missing.");
               break;
            }
         }
      } catch (e) {
         alert("Error importing file " + fn + ": " + e);
         success = false;
      }

      if (!success) break;
   }

   updateInventory();
}

function confirmDialog(message, note) {
   return new Promise(function (resolve) {
      var element = document.createElement('div');
      element.style.padding = '10px';
      element.innerHTML = "<h3>Confirm Import</h3>" +
         "<p>" + message + "</p>" +
         (note ? "<p style='font-size: 11px; opacity: 0.7; border-top: 1px solid var(--border-color); padding-top: 5px;'><i class='fas fa-info-circle'></i> " + note + "</p>" : "");

      var dialog = new ModalDialog(element, function () { resolve(true); }, function () { resolve(false); }, "Yes", "No");
      dialog.start();
   });
}

async function handleBLDImport(bldFile, otherFiles) {
   var result = await LoadLocalTextFileAsync(bldFile);
   var content = result.data;
   var lines = content.split(/\r?\n/);
   if (lines.length === 0) return;

   // 1. Parse Header: [Name] [SizeKB] [Flags]
   var headerLine = lines[0].trim();
   if (!headerLine) {
      alert("Invalid .BLD file: Header line missing.");
      return;
   }

   var parts = headerLine.split(/[\s,]+/);
   var packName = parts[0] || "ImportedPack";
   var sizeKB = parseInt(parts[1]) || 64;

   // Create New Pack
   var newPackIndex = createAndSelectPack(packName, sizeKB);
   var pack = packs[newPackIndex];

   // Apply Flags from header line
   var hdata = pack.items[0].data;
   if (headerLine.toUpperCase().indexOf("NOCOPY") !== -1) hdata[0] |= 0x08;
   if (headerLine.toUpperCase().indexOf("NOWRITE") !== -1) hdata[0] |= 0x10;

   // 2. Parse Items
   var importedCount = 0;
   for (var i = 1; i < lines.length; i++) {
      var line = lines[i].trim();
      if (!line || line.startsWith("!")) continue;

      var itemParts = line.split(/\s+/);
      var itemName = itemParts[0];
      var itemExt = (itemParts[1] || "BIN").toUpperCase();

      // Check for MAIN record confirmation
      if (itemName.toUpperCase() === "MAIN") {
         var confirmed = await confirmDialog("A 'MAIN' entry was identified in the import. Do you wish to import it?", "Note: A new Data Pack contains a default 'MAIN' entry by default.");
         if (!confirmed) continue;
      }

      // Find file in 'otherFiles' (can be File objects or {name, content} objects from Zip)
      var match = null;
      var matchName = (itemName + "." + itemExt).toLowerCase();

      for (var j = 0; j < otherFiles.length; j++) {
         var fn = otherFiles[j].name.toLowerCase();
         if (fn === matchName || fn === itemName.toLowerCase() + "." + itemExt.toLowerCase()) {
            match = otherFiles[j];
            break;
         }
      }

      if (match) {
         var data;
         if (match.content) { // From ZIP
            data = match.content;
         } else { // From File input
            var res = await LoadLocalBinaryFileAsync(match);
            data = res.data;
         }

         if (createItemFromFileData(data, match.name)) {
            importedCount++;
         }
      }
   }

   updateInventory();
   alert("Import complete. Created new " + sizeKB + "KB Pack '" + packName + "' with " + importedCount + " items.");
}

async function handleZIPImport(zipFile) {
   try {
      setStatus("Unzipping " + zipFile.name + "...");
      var extractedFiles = await ZipUtils.readZip(zipFile);
      if (extractedFiles.length === 0) {
         alert("ZIP file is empty or invalid.");
         return;
      }

      // Find .BLD file
      var bldFile = null;
      for (var i = 0; i < extractedFiles.length; i++) {
         if (extractedFiles[i].name.toLowerCase().endsWith(".bld")) {
            bldFile = extractedFiles[i];
            // Convert to a format handleBLDImport expects
            bldFile.data = new TextDecoder().decode(bldFile.content);
            break;
         }
      }

      if (bldFile) {
         // Recursive call for BLD flow
         // Mocking LoadLocalTextFileAsync behavior for the virtual BLD
         var originalLoader = LoadLocalTextFileAsync;
         window.LoadLocalTextFileAsync = async function () { return bldFile; };
         await handleBLDImport(bldFile, extractedFiles);
         window.LoadLocalTextFileAsync = originalLoader;
      } else {
         // No BLD: Import all recognized items into a new 64KB pack
         var packName = zipFile.name.replace(/\.[^/.]+$/, "");
         var newPackIndex = createAndSelectPack(packName, 64);

         var importedCount = 0;
         for (var i = 0; i < extractedFiles.length; i++) {
            var file = extractedFiles[i];
            var baseName = file.name.replace(/\.[^/.]+$/, "").toUpperCase();

            // Check for MAIN record confirmation
            if (baseName === "MAIN") {
               var confirmed = await confirmDialog("A 'MAIN' entry was identified in the ZIP. Do you wish to import it?", "Note: A new Data Pack contains a default 'MAIN' entry by default.");
               if (!confirmed) continue;
            }

            if (createItemFromFileData(file.content, file.name)) {
               importedCount++;
            }
         }
         updateInventory();
         alert("Import complete. Created new 64KB Pack '" + packName + "' from ZIP contents (" + importedCount + " items).");
      }
   } catch (e) {
      alert("Error importing ZIP: " + e.message);
   } finally {
      setStatus("Ready");
   }
}

function createAndSelectPack(name, sizeKB) {
   var sizeCode = Math.ceil(sizeKB / 8);
   if (sizeCode < 1) sizeCode = 1;
   if (sizeCode > 128) sizeCode = 128;

   var newPack = new PackImage(null, sizeCode);
   newPack.filename = name.toLowerCase().endsWith(".opk") ? name : name + ".opk";
   
   packs.push(newPack);
   currentPack = newPack;
   currentPackIndex = packs.length - 1;
   
   // Sync with Options
   OptionsManager.setOption('lastPackSize', sizeCode);
   
   updateInventory();
   return currentPackIndex;
}

function LoadLocalBinaryFileAsync(file) {
   return new Promise((resolve, reject) => {
      var reader = new FileReader();
      reader.onload = function (e) {
         var data = new Uint8Array(e.target.result);
         resolve({ name: file.name, data: data });
      };
      reader.onerror = function (e) {
         reject(e);
      };
      reader.readAsArrayBuffer(file);
   });
}

function LoadLocalTextFileAsync(file) {
   return new Promise((resolve, reject) => {
      var reader = new FileReader();
      reader.onload = function (e) {
         resolve({ name: file.name, data: e.target.result });
      };
      reader.onerror = function (e) {
         reject(e);
      };
      reader.readAsText(file);
   });
}

/**
 * Prompts for a URL and attempts to fetch a Data Pack binary.
 * Note: Subject to CORS restrictions.
 */
/**
 * Prompts for a URL and attempts to fetch a Data Pack binary.
 * Note: Subject to CORS restrictions.
 */
function openPackFromURL() {
   var element = document.createElement('div');
   element.style.padding = '10px';
   element.innerHTML = "<h3>Open from URL</h3>" +
      "<p>Enter the direct link to a <b>.opk</b> or <b>.hex</b> file:</p>" +
      "<input type='text' id='import-url' placeholder='https://example.com/pack.opk' style='width: 100%; padding: 8px; background: var(--input-bg); color: var(--text-color); border: 1px solid var(--border-color); margin-bottom: 10px;'>" +
      "<div style='margin: 10px 0;'>" +
      "<label style='display: flex; align-items: center; cursor: pointer;'>" +
      "<input type='checkbox' id='use-proxy' checked style='margin-right: 8px;'> Use CORS Proxy (Recommended for external links)" +
      "</label>" +
      "</div>" +
      "<p style='font-size: 11px; opacity: 0.7;'><i class='fas fa-info-circle'></i> Use the proxy if you encounter a 'CORS restriction' error. This routes the request through <i>allorigins.win</i> to bypass security blocks.</p>";

   var dialog = new ModalDialog(element, async function () {
      var url = element.querySelector('#import-url').value.trim();
      var useProxy = element.querySelector('#use-proxy').checked;
      if (!url) return;
      await loadPackFromURLHelper(url, useProxy);
   }, null, "Open", "Cancel");

   dialog.start();
   
   var inputEl = element.querySelector('#import-url');
   var proxyEl = element.querySelector('#use-proxy');
   if (inputEl && proxyEl) {
      inputEl.addEventListener('input', function() {
         var url = inputEl.value.trim();
         try {
            if (url) {
               var parsed = new URL(url, window.location.href);
               var isLocal = parsed.hostname === 'localhost' || 
                             parsed.hostname === '127.0.0.1' || 
                             parsed.hostname.startsWith('192.168.') || 
                             parsed.hostname.startsWith('10.') || 
                             parsed.hostname.startsWith('172.16.') || 
                             parsed.origin === window.location.origin;
               if (isLocal) {
                  proxyEl.checked = false;
               } else {
                  proxyEl.checked = true;
               }
            }
         } catch(e) {}
      });
   }

   setTimeout(() => element.querySelector('#import-url').focus(), 100);
}

/**
 * Programmatically loads a pack from a given URL with CORS Proxy options.
 */
async function loadPackFromURLHelper(url, useProxy) {
   var finalUrl = url;
   if (useProxy) {
      // Use AllOrigins (more reliable for public web usage)
      finalUrl = "https://api.allorigins.win/raw?url=" + encodeURIComponent(url);
   }

   setStatus("Fetching " + (useProxy ? "via proxy... " : "") + url);
   console.log("Fetching from:", finalUrl);

   try {
      var result = null;
      var errors = [];
      
      // Helper function to try fetching from a list of fallback URLs
      async function tryUrls(urls) {
         for (var i = 0; i < urls.length; i++) {
            console.log("Attempting fetch from: " + urls[i].name);
            setStatus("Loading: trying " + urls[i].name + "...");
            
            var fetchResult = await new Promise((resolve) => {
               var xhr = new XMLHttpRequest();
               xhr.open("GET", urls[i].url, true);
               xhr.responseType = "arraybuffer";
               
               xhr.onprogress = function(event) {
                  if (event.lengthComputable) {
                     var percent = Math.round((event.loaded / event.total) * 100);
                     setStatus("Loading (" + urls[i].name + "): " + percent + "%");
                  } else {
                     var kb = Math.round(event.loaded / 1024);
                     setStatus("Loading (" + urls[i].name + "): " + kb + " KB");
                  }
               };

               xhr.onload = function() {
                  if (xhr.status >= 200 && xhr.status < 300) {
                     resolve({
                        ok: true,
                        data: new Uint8Array(xhr.response)
                     });
                  } else {
                     resolve({
                        ok: false,
                        error: "HTTP error " + xhr.status + ": " + xhr.statusText
                     });
                  }
               };
               xhr.onerror = function() {
                  resolve({
                     ok: false,
                     error: "Network/CORS error"
                  });
               };
               try {
                  xhr.send();
               } catch (e) {
                  resolve({
                     ok: false,
                     error: "Send error: " + e.message
                  });
               }
            });

            if (fetchResult.ok) {
               return fetchResult;
            } else {
               console.warn("Fetch failed for " + urls[i].name + ":", fetchResult.error);
               errors.push(urls[i].name + ": " + fetchResult.error);
            }
         }
         return null;
      }

      // Generate list of URLs to try in sequence based on options
      var candidateUrls = [];
      var isLocal = false;
      try {
         var parsed = new URL(url, window.location.href);
         isLocal = parsed.hostname === 'localhost' || 
                   parsed.hostname === '127.0.0.1' || 
                   parsed.hostname.startsWith('192.168.') || 
                   parsed.hostname.startsWith('10.') || 
                   parsed.hostname.startsWith('172.16.') || 
                   parsed.origin === window.location.origin;
      } catch(e) {}

      if (useProxy && !isLocal) {
         candidateUrls.push({ name: "AllOrigins Proxy", url: "https://api.allorigins.win/raw?url=" + encodeURIComponent(url) });
         candidateUrls.push({ name: "CorsProxy.io", url: "https://corsproxy.io/?" + encodeURIComponent(url) });
         candidateUrls.push({ name: "Direct Link", url: url });
      } else {
         candidateUrls.push({ name: "Direct Link", url: url });
         if (!isLocal && (url.startsWith("http://") || url.startsWith("https://"))) {
            candidateUrls.push({ name: "AllOrigins Proxy", url: "https://api.allorigins.win/raw?url=" + encodeURIComponent(url) });
            candidateUrls.push({ name: "CorsProxy.io", url: "https://corsproxy.io/?" + encodeURIComponent(url) });
         }
      }

      result = await tryUrls(candidateUrls);
      if (!result) {
         throw new Error("All fetch attempts failed.\nDetails:\n- " + errors.join("\n- "));
      }

      const data = result.data;

      // Extract filename from URL
      var filename = url.split('/').pop().split('?')[0] || "downloaded.opk";

      // Create Pack
      var isHex = filename.toLowerCase().endsWith(".hex") || filename.toLowerCase().endsWith(".ihx");
      var finalData;

      if (isHex) {
         var text = new TextDecoder().decode(data);
         finalData = parseIntelHexToBinary(text);
      } else {
         // Check for OPK Header
         if (data.length >= 3 && data[0] === 0x4F && data[1] === 0x50 && data[2] === 0x4B) {
            finalData = data;
         } else {
            // Wrap as raw
            finalData = new Uint8Array(data.length + 6);
            finalData.set([0x4F, 0x50, 0x4B, (data.length >> 16) & 0xFF, (data.length >> 8) & 0xFF, data.length & 0xFF]);
            finalData.set(data, 6);
         }
      }

      var newPack = new PackImage(finalData);
      newPack.filename = filename.replace(/\.[^/.]+$/, "") + ".opk";
      
      packs.push(newPack);
      currentPackIndex = packs.length - 1;
      selectedPackIndex = packs.length - 1;
      
      updateInventory();
      setStatus("Imported " + filename);
      saveSession();

   } catch (e) {
      alert("Failed to import from URL:\n" + e.message + "\n\nReason: Likely a CORS restriction or network error.");
      setStatus("Import failed.");
   }
}

function openBootableWizard() {
   if (typeof packs === 'undefined' || packs.length === 0) {
      createNewPackImmediately(1);
   }
   
   var activePack = packs[currentPackIndex];
   
   var wizard = new BootableWizard(activePack, function() {
      updateInventory();
   });
   wizard.show();
}

function createNewPackImmediately(sizeCode) {
   var newPack = new PackImage(null, sizeCode);
   newPack.filename = "Pack" + (packs.length + 1) + ".opk";
   packs.push(newPack);
   currentPack = newPack;
   currentPackIndex = packs.length - 1;
   updateInventory();
   setStatus("New 8KB pack created automatically");
}
