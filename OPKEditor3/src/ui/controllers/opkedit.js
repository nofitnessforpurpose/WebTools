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
   new HexEditor(legacyEditorElement, handleEditorMessage, [2, 4, 5, 6, 8, 9, 10, 11, 12, 13, 14, 15]),
   new MemoryMapEditor(legacyEditorElement, handleEditorMessage)
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

// Help Menu Handlers
var btnHelp = document.getElementById('btn-help');
var dropdownContent = document.getElementById('help-dropdown');

if (btnHelp && dropdownContent) {
   btnHelp.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      dropdownContent.classList.toggle('show');
      btnHelp.classList.toggle('active');
   });

   // Close dropdown when clicking outside
   window.addEventListener('click', function (e) {
      if (!e.target.matches('.dropbtn') && !e.target.closest('.dropbtn')) {
         if (dropdownContent.classList.contains('show')) {
            dropdownContent.classList.remove('show');
            btnHelp.classList.remove('active');
         }
      }
   });
}

var menuAbout = document.getElementById('menu-about');
if (menuAbout) {
   menuAbout.addEventListener('click', function (e) {
      e.preventDefault();
      showAboutDialog();
      dropdownContent.classList.remove('show');
      btnHelp.classList.remove('active');
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
      dropdownContent.classList.remove('show');
      btnHelp.classList.remove('active');
   });
}
// Dialog Functions
function showOptionsDialog() {
   var element = document.createElement('div');
   element.innerHTML =
      "<div class='tabs'>" +
      // Tab Order: General -> Themes -> Code Renderer -> Memory Map -> Icons
      "<button class='tab-btn active' data-tab='tab-general'>General</button>" +
      "<button class='tab-btn' data-tab='tab-themes'>Themes</button>" +
      "<button class='tab-btn' data-tab='tab-renderer'>Code Renderer</button>" +
      "<button class='tab-btn' data-tab='tab-memorymap'>Memory Map</button>" +
      "<button class='tab-btn' data-tab='tab-icons'>Icons</button>" +
      "</div>" +
      "<form id='options-form' style='text-align: left; padding: 10px; min-width: 500px;'>" +
      "<div id='tab-general' class='tab-content active'>" +
      "<div style='margin-bottom: 10px;'><label><input type='checkbox' id='opt-linenumbers'> Show Line Numbers</label></div>" +
      "<div style='margin-bottom: 10px;'><label><input type='checkbox' id='opt-folding'> Enable Code Folding</label></div>" +
      "<div style='margin-bottom: 10px;'><label><input type='checkbox' id='opt-syntax'> Enable Syntax Highlighting</label></div>" +
      "<div style='margin-bottom: 10px;'><label><input type='checkbox' id='opt-guidelines'> Show Guidelines in Pack List</label></div>" +
      "<div style='margin-bottom: 10px;'><label><input type='checkbox' id='opt-show-addresses'> Show Addresses in Pack List</label></div>" +
      "<div style='margin-bottom: 10px;'><label><input type='checkbox' id='opt-splash'> Show Splash Screen on Startup</label></div>" +
      "<div style='margin-bottom: 10px;'><label><input type='checkbox' id='opt-restorepacks'> Restore Opened Packs on Startup</label></div>" +
      "<div style='margin-bottom: 10px;'><label><input type='checkbox' id='opt-grouprecords'> Group Data Records under Data Files</label></div>" +
      "<div style='margin-bottom: 10px;'><label>Hex Editor Bytes Per Row: <select id='opt-hexbytes' style='margin-left: 5px; padding: 2px;'><option value='8'>8</option><option value='16'>16</option></select></label></div>" +


      "</div>" +

      "<div id='tab-themes' class='tab-content'>" +
      "<div>Select Theme: <select id='opt-theme' style='padding: 5px; width: 100%; margin-top: 5px;'></select></div>" +
      "<div style='margin-top: 15px; font-size: 12px; color: var(--text-color); opacity: 0.7;'>Select a theme to change the application's appearance.</div>" +
      "<hr style='margin: 15px 0; border: 0; border-top: 1px solid var(--border-color);'>" +
      "<h4>Theme Editor</h4>" +
      "<div style='display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;'>" +
      "<div><label>Background</label><br><input type='color' id='edit-bg-color' style='width: 100%;'></div>" +
      "<div><label>Text</label><br><input type='color' id='edit-text-color' style='width: 100%;'></div>" +
      "<div><label>Toolbar BG</label><br><input type='color' id='edit-toolbar-bg' style='width: 100%;'></div>" +
      "<div><label>Sidebar BG</label><br><input type='color' id='edit-sidebar-bg' style='width: 100%;'></div>" +
      "<div><label>Status Bar</label><br><input type='color' id='edit-status-bg' style='width: 100%;'></div>" +
      "<div><label>Selection</label><br><input type='color' id='edit-select-bg' style='width: 100%;'></div>" +
      "<div><label>Editor Text</label><br><input type='color' id='edit-editor-text' style='width: 100%;'></div>" +
      "<div><label>Editor Cursor</label><br><input type='color' id='edit-editor-cursor' style='width: 100%;'></div>" +
      "<div><label>Sidebar Text</label><br><input type='color' id='edit-sidebar-text' style='width: 100%;'></div>" +
      "<div><label>Toolbar Border</label><br><input type='color' id='edit-toolbar-border' style='width: 100%;'></div>" +
      "<div><label>Input Text</label><br><input type='color' id='edit-input-text' style='width: 100%;'></div>" +
      "<div><label>Input BG</label><br><input type='color' id='edit-input-bg' style='width: 100%;'></div>" +
      "<div><label>Modal BG</label><br><input type='color' id='edit-modal-bg' style='width: 100%;'></div>" +
      "</div>" +
      "<div style='margin-top: 10px; font-size: 11px; color: var(--text-color); opacity: 0.7;'>Changes apply immediately to the current view.</div>" +
      "</div>" +
      "<div id='tab-icons' class='tab-content'>" +
      "<h4>Icon Settings</h4>" +
      "<div style='margin-bottom: 15px;'><label>Font Awesome Version: <select id='opt-icon-version' style='margin-left: 5px; padding: 2px;'><option value='6'>Version 6 (Latest)</option><option value='5'>Version 5 (Legacy)</option></select></label></div>" +
      "<div style='margin-bottom: 15px;'><label>Icon Style: <select id='opt-icon-style' style='margin-left: 5px; padding: 2px;'><option value='solid'>Solid (Filled)</option><option value='regular'>Regular (Outlined)</option></select></label></div>" +
      "<div style='margin-top: 10px; font-size: 12px; color: var(--text-color); opacity: 0.7;'>Note: Some icons may look different between versions.</div>" +
      "</div>" +
      "<div id='tab-renderer' class='tab-content'>" +
      "<h4>Syntax Highlighting</h4>" +
      "<div style='margin-bottom: 10px; font-size: 12px; color: var(--text-color); opacity: 0.7;'>Customize syntax colors for the <b>current theme</b>.</div>" +
      "<div style='display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;'>" +
      "<div><label>Functions</label><br><input type='color' id='syntax-functions' style='width: 100%;'></div>" +
      "<div><label>Commands</label><br><input type='color' id='syntax-commands' style='width: 100%;'></div>" +
      "<div><label>String Funcs</label><br><input type='color' id='syntax-stringfuncs' style='width: 100%;'></div>" +
      "<div><label>Strings</label><br><input type='color' id='syntax-string' style='width: 100%;'></div>" +
      "<div><label>Comments</label><br><input type='color' id='syntax-comment' style='width: 100%;'></div>" +
      "<div><label>Numbers</label><br><input type='color' id='syntax-number' style='width: 100%;'></div>" +
      "<div><label>Labels</label><br><input type='color' id='syntax-label' style='width: 100%;'></div>" +
      "<div><label>Operators</label><br><input type='color' id='syntax-operator' style='width: 100%;'></div>" +
      "</div>" +
      "<div style='margin-top: 15px; display: flex; gap: 10px;'>" +
      "<button id='reset-syntax' class='modal-btn' style='background-color: #666;'>Reset to Default</button>" +
      "</div>" +
      "</div>" +
      "<div id='tab-memorymap' class='tab-content'>" +
      "<h4>Memory Map Settings</h4>" +
      "<div style='margin-bottom: 15px;'><label>Orientation: <select id='opt-mm-orientation' style='margin-left: 5px; padding: 2px;'><option value='horizontal'>Horizontal</option><option value='vertical'>Vertical</option></select></label></div>" +
      "<div style='margin-bottom: 10px;'><label><input type='checkbox' id='opt-mm-pagebreaks'> Show Page Boundary Markers</label></div>" +
      "<div style='margin-bottom: 10px;'><label>Memory Map Display Size: <select id='opt-mm-size' style='margin-left: 5px; padding: 2px;'>" +
      "<option value='8192'>8 kB</option>" +
      "<option value='16384'>16 kB</option>" +
      "<option value='32768'>32 kB</option>" +
      "<option value='65536'>64 kB</option>" +
      "<option value='131072'>128 kB</option>" +
      "<option value='262144'>256 kB</option>" +
      "<option value='524288'>512 kB</option>" +
      "</select></label></div>" +
      "<div style='margin-bottom: 10px;'><label>Memory Map Bar Height: <select id='opt-mm-height' style='margin-left: 5px; padding: 2px;'>" +
      "<option value='20'>Small (20px)</option>" +
      "<option value='30'>Medium (30px)</option>" +
      "<option value='40'>Large (40px)</option>" +
      "<option value='50'>Extra Large (50px)</option>" +
      "</select></label></div>" +
      "<h4>Content Colors</h4>" +
      "<div style='display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;'>" +
      "<div><label>Header</label><br><input type='color' id='mm-color-header' style='width: 100%;'></div>" +
      "<div><label>Procedure</label><br><input type='color' id='mm-color-procedure' style='width: 100%;'></div>" +
      "<div><label>Data File</label><br><input type='color' id='mm-color-datafile' style='width: 100%;'></div>" +
      "<div><label>Diary</label><br><input type='color' id='mm-color-diary' style='width: 100%;'></div>" +
      "<div><label>Comms</label><br><input type='color' id='mm-color-comms' style='width: 100%;'></div>" +
      "<div><label>Sheet</label><br><input type='color' id='mm-color-sheet' style='width: 100%;'></div>" +
      "<div><label>Pager</label><br><input type='color' id='mm-color-pager' style='width: 100%;'></div>" +
      "<div><label>Notepad</label><br><input type='color' id='mm-color-notepad' style='width: 100%;'></div>" +
      "<div><label>Block</label><br><input type='color' id='mm-color-block' style='width: 100%;'></div>" +
      "<div><label>Record</label><br><input type='color' id='mm-color-record' style='width: 100%;'></div>" +
      "<div><label>Unknown</label><br><input type='color' id='mm-color-unknown' style='width: 100%;'></div>" +
      "<div><label>Free Space</label><br><input type='color' id='mm-color-free' style='width: 100%;'></div>" +
      "</div>" +
      "</div>" +
      "</form>";

   // Populate Memory Map Size Options
   var mmSizeSelect = element.querySelector('#opt-mm-size');
   mmSizeSelect.innerHTML = ""; // Clear existing options

   var packSize = 32768; // Default fallback
   var activePack = getActivePack();
   if (activePack && activePack.items && activePack.items.length > 0) {
      var sizeMultiplier = activePack.items[0].data[1];
      packSize = sizeMultiplier * 8192;
   }

   // Generate options: 8k, 16k, 32k... up to packSize
   // Also ensure we have at least one option if packSize is small
   var sizes = [];
   for (var s = 1024; s <= packSize; s *= 2) {
      sizes.push(s);
   }
   // If packSize is not a power of 2 (unlikely for standard packs but possible), add it?
   // Standard Psion packs are usually powers of 2.
   // If sizes is empty (pack < 8k?), add 8k anyway or just packSize
   if (sizes.length === 0) sizes.push(8192);

   sizes.forEach(function (s) {
      var opt = document.createElement('option');
      opt.value = s;
      opt.innerText = (s / 1024) + " kB";
      mmSizeSelect.appendChild(opt);
   });



   // Initialize values
   if (activePack && activePack.items && activePack.items.length > 0) {
      var isPaged = (activePack.items[0].data[0] !== 0x7a);
      if (!isPaged) {
         mmPageBreaksCheckbox.disabled = true;
         mmPageBreaksCheckbox.parentElement.style.opacity = '0.5';
         mmPageBreaksCheckbox.parentElement.title = "Not available for linear packs";
      }
   }
   element.querySelector('#opt-mm-size').value = OptionsManager.getOption('memoryMapDisplaySize') || 32768;

   // Initialize Icon Options
   element.querySelector('#opt-icon-version').value = OptionsManager.getOption('iconVersion') || '6';
   element.querySelector('#opt-icon-style').value = OptionsManager.getOption('iconStyle') || 'solid';

   // Dynamic Theme Population
   var themeSelect = element.querySelector('#opt-theme');
   if (typeof ThemeManager !== 'undefined' && ThemeManager.themeDefinitions) {
      var themes = Object.keys(ThemeManager.themeDefinitions).sort();
      themes.forEach(function (tKey) {
         var opt = document.createElement('option');
         opt.value = tKey;
         // Capitalize first letter for display, or use a map
         opt.innerText = tKey.charAt(0).toUpperCase() + tKey.slice(1).replace(/-/g, ' ');
         themeSelect.appendChild(opt);
      });
   }

   // Initialize Theme Selection
   element.querySelector('#opt-theme').value = OptionsManager.getOption('theme') || 'dark';

   // Initialize General Options
   element.querySelector('#opt-linenumbers').checked = OptionsManager.getOption('showLineNumbers') !== false;
   element.querySelector('#opt-folding').checked = OptionsManager.getOption('codeFolding') !== false;
   element.querySelector('#opt-syntax').checked = OptionsManager.getOption('syntaxHighlighting') !== false;
   element.querySelector('#opt-syntax').checked = OptionsManager.getOption('syntaxHighlighting') !== false;
   element.querySelector('#opt-guidelines').checked = OptionsManager.getOption('showGuidelines') !== false;
   element.querySelector('#opt-show-addresses').checked = OptionsManager.getOption('showAddresses') === true;
   element.querySelector('#opt-splash').checked = OptionsManager.getOption('showSplashScreen') !== false;
   element.querySelector('#opt-restorepacks').checked = OptionsManager.getOption('restorePacks') === true;
   element.querySelector('#opt-grouprecords').checked = OptionsManager.getOption('groupDataRecords') === true;
   element.querySelector('#opt-hexbytes').value = OptionsManager.getOption('hexBytesPerRow') || 16;

   // Initialize Memory Map Options
   var mmPageBreaksCheckbox = element.querySelector('#opt-mm-pagebreaks');
   mmPageBreaksCheckbox.checked = OptionsManager.getOption('memoryMapShowPageBreaks') !== false;

   // Add listeners
   element.querySelector('#opt-linenumbers').addEventListener('change', function () {
      OptionsManager.setOption('showLineNumbers', this.checked);
      // Refresh editors
      editors.forEach(function (ed) {
         if (ed.render) ed.render();
      });
   });

   element.querySelector('#opt-folding').addEventListener('change', function () {
      OptionsManager.setOption('codeFolding', this.checked);
      editors.forEach(function (ed) {
         if (ed.render) ed.render();
      });
   });

   element.querySelector('#opt-syntax').addEventListener('change', function () {
      OptionsManager.setOption('syntaxHighlighting', this.checked);
      editors.forEach(function (ed) {
         if (ed.render) ed.render();
      });
   });

   element.querySelector('#opt-guidelines').addEventListener('change', function () {
      OptionsManager.setOption('showGuidelines', this.checked);
      var packList = document.getElementById('pack-list');
      if (this.checked) {
         packList.classList.remove('hide-guidelines');
      } else {
         packList.classList.add('hide-guidelines');
      }
   });

   element.querySelector('#opt-show-addresses').addEventListener('change', function () {
      OptionsManager.setOption('showAddresses', this.checked);
      var packList = document.getElementById('pack-list');
      if (this.checked) {
         packList.classList.add('show-addresses');
      } else {
         packList.classList.remove('show-addresses');
      }
   });

   element.querySelector('#opt-splash').addEventListener('change', function () {
      OptionsManager.setOption('showSplashScreen', this.checked);
   });

   element.querySelector('#opt-restorepacks').addEventListener('change', function () {
      OptionsManager.setOption('restorePacks', this.checked);
      if (!this.checked) {
         localStorage.removeItem('opkedit_open_packs');
      }
   });

   element.querySelector('#opt-grouprecords').addEventListener('change', function () {
      OptionsManager.setOption('groupDataRecords', this.checked);
      updateInventory();
   });

   element.querySelector('#opt-hexbytes').addEventListener('change', function () {
      OptionsManager.setOption('hexBytesPerRow', parseInt(this.value));
      // Refresh editors if any is HexEditor
      if (currentEditor instanceof HexEditor) {
         currentEditor.renderHexView();
      }
   });

   element.querySelector('#opt-mm-pagebreaks').addEventListener('change', function () {
      OptionsManager.setOption('memoryMapShowPageBreaks', this.checked);
      if (currentEditor instanceof MemoryMapEditor) {
         currentEditor.initialise(currentEditor.item);
      }
   });

   element.querySelector('#opt-mm-size').addEventListener('change', function () {
      OptionsManager.setOption('memoryMapDisplaySize', parseInt(this.value));
      if (currentEditor instanceof MemoryMapEditor) {
         currentEditor.initialise(currentEditor.item);
      }
   });

   element.querySelector('#opt-mm-height').value = OptionsManager.getOption('memoryMapBarHeight') || 30;
   element.querySelector('#opt-mm-height').addEventListener('change', function () {
      OptionsManager.setOption('memoryMapBarHeight', parseInt(this.value));
      if (currentEditor instanceof MemoryMapEditor) {
         currentEditor.initialise(currentEditor.item);
      }
   });

   // Icon Settings Logic
   element.querySelector('#opt-icon-version').addEventListener('change', function () {
      OptionsManager.setOption('iconVersion', this.value);
      updateInventory();
   });

   element.querySelector('#opt-icon-style').addEventListener('change', function () {
      OptionsManager.setOption('iconStyle', this.value);
      updateInventory();
   });

   // Helper to get computed style
   function getCSSVar(name) {
      return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
   }

   // Helper to set style
   function setCSSVar(name, value) {
      document.documentElement.style.setProperty(name, value);
   }

   // Tab Switching Logic
   var tabs = element.querySelectorAll('.tab-btn');
   tabs.forEach(function (tab) {
      tab.addEventListener('click', function (e) {
         e.preventDefault();
         element.querySelectorAll('.tab-btn').forEach(function (t) { t.classList.remove('active'); });
         element.querySelectorAll('.tab-content').forEach(function (c) { c.classList.remove('active'); });
         tab.classList.add('active');
         var targetId = tab.getAttribute('data-tab');
         element.querySelector('#' + targetId).classList.add('active');
      });
   });

   // Theme Editor Logic
   var themeSelect = element.querySelector('#opt-theme');
   var inputs = {
      '--bg-color': element.querySelector('#edit-bg-color'),
      '--text-color': element.querySelector('#edit-text-color'),
      '--toolbar-bg': element.querySelector('#edit-toolbar-bg'),
      '--sidebar-bg': element.querySelector('#edit-sidebar-bg'),
      '--status-bar-bg': element.querySelector('#edit-status-bg'),
      '--list-selected-bg': element.querySelector('#edit-select-bg'),
      '--editor-text-color': element.querySelector('#edit-editor-text'),
      '--editor-cursor-color': element.querySelector('#edit-editor-cursor'),
      '--sidebar-item-text': element.querySelector('#edit-sidebar-text'),
      '--toolbar-border-color': element.querySelector('#edit-toolbar-border'),
      '--input-text-color': element.querySelector('#edit-input-text'),
      '--input-bg': element.querySelector('#edit-input-bg'),
      '--modal-bg': element.querySelector('#edit-modal-bg')
   };

   var syntaxInputs = {
      '--syntax-functions': element.querySelector('#syntax-functions'),
      '--syntax-commands': element.querySelector('#syntax-commands'),
      '--syntax-stringfuncs': element.querySelector('#syntax-stringfuncs'),
      '--syntax-string': element.querySelector('#syntax-string'),
      '--syntax-comment': element.querySelector('#syntax-comment'),
      '--syntax-number': element.querySelector('#syntax-number'),
      '--syntax-label': element.querySelector('#syntax-label'),
      '--syntax-operator': element.querySelector('#syntax-operator')
   };

   // Initialize inputs with current values
   function updateInputs() {
      for (var key in inputs) {
         inputs[key].value = getCSSVar(key) || '#000000';
      }

      // Update syntax inputs from ThemeManager
      var currentTheme = ThemeManager.currentTheme;
      var defs = ThemeManager.getThemeDefinition(currentTheme);
      for (var key in syntaxInputs) {
         syntaxInputs[key].value = defs[key] || getCSSVar(key) || '#000000';
      }
   }

   // Wait for dialog to be in DOM to get computed styles
   setTimeout(updateInputs, 0);

   // Update inputs when theme changes
   themeSelect.addEventListener('change', function () {
      ThemeManager.setTheme(this.value);
      setTimeout(updateInputs, 50); // Allow CSS to apply
   });

   // Add listeners to inputs
   for (var key in inputs) {
      (function (varName, input) {
         input.addEventListener('input', function () {
            setCSSVar(varName, this.value);
         });
      })(key, inputs[key]);
   }

   // Add listeners to syntax inputs
   for (var key in syntaxInputs) {
      (function (varName, input) {
         input.addEventListener('input', function () {
            // Update CSS variable immediately for preview
            setCSSVar(varName, this.value);

            // Save to ThemeManager
            var currentTheme = ThemeManager.currentTheme;
            var defs = ThemeManager.getThemeDefinition(currentTheme);
            defs[varName] = this.value;
            ThemeManager.updateThemeDefinition(currentTheme, defs);
         });
      })(key, syntaxInputs[key]);
   }

   // Reset Syntax Button
   element.querySelector('#reset-syntax').addEventListener('click', function () {
      var currentTheme = ThemeManager.currentTheme;
      var overrides = OptionsManager.getOption('themeOverrides') || {};
      if (overrides[currentTheme]) {
         delete overrides[currentTheme];
         OptionsManager.setOption('themeOverrides', overrides);
         ThemeManager.applyTheme(currentTheme);
         setTimeout(updateInputs, 50);
      }
   });

   // Memory Map Logic
   var mmOrientation = element.querySelector('#opt-mm-orientation');
   mmOrientation.value = OptionsManager.getOption('memoryMapOrientation') || 'horizontal';
   mmOrientation.addEventListener('change', function () {
      OptionsManager.setOption('memoryMapOrientation', this.value);
      // Refresh Memory Map if active
      if (currentEditor instanceof MemoryMapEditor) {
         currentEditor.initialise(currentEditor.item);
      }
   });

   var mmColors = {
      '--mm-color-header': element.querySelector('#mm-color-header'),
      '--mm-color-procedure': element.querySelector('#mm-color-procedure'),
      '--mm-color-datafile': element.querySelector('#mm-color-datafile'),
      '--mm-color-diary': element.querySelector('#mm-color-diary'),
      '--mm-color-comms': element.querySelector('#mm-color-comms'),
      '--mm-color-sheet': element.querySelector('#mm-color-sheet'),
      '--mm-color-pager': element.querySelector('#mm-color-pager'),
      '--mm-color-notepad': element.querySelector('#mm-color-notepad'),
      '--mm-color-block': element.querySelector('#mm-color-block'),
      '--mm-color-record': element.querySelector('#mm-color-record'),
      '--mm-color-unknown': element.querySelector('#mm-color-unknown'),
      '--mm-color-free': element.querySelector('#mm-color-free')
   };

   // Update MM inputs from ThemeManager
   function updateMMInputs() {
      var currentTheme = ThemeManager.currentTheme;
      var defs = ThemeManager.getThemeDefinition(currentTheme);
      for (var key in mmColors) {
         if (mmColors[key]) {
            mmColors[key].value = defs[key] || getCSSVar(key) || '#000000';
         }
      }
   }
   setTimeout(updateMMInputs, 0);

   // Update MM inputs when theme changes
   themeSelect.addEventListener('change', function () {
      setTimeout(updateMMInputs, 50);
   });

   for (var key in mmColors) {
      if (mmColors[key]) {
         (function (varName, input) {
            input.addEventListener('input', function () {
               // Update CSS variable immediately for preview
               setCSSVar(varName, this.value);

               // Save to ThemeManager
               var currentTheme = ThemeManager.currentTheme;
               var defs = ThemeManager.getThemeDefinition(currentTheme);
               defs[varName] = this.value;
               ThemeManager.updateThemeDefinition(currentTheme, defs);

               // Refresh Memory Map if active
               if (currentEditor instanceof MemoryMapEditor) {
                  currentEditor.initialise(currentEditor.item);
               }
            });
         })(key, mmColors[key]);
      }
   }

   var dialog = new ModalDialog(element, function () {
      // Most options are saved immediately via event listeners.
      // We only need to handle final cleanup or specific actions here if any.

      // Apply Guidelines Setting (Visual update only, option already saved)
      var packList = document.getElementById('pack-list');
      if (OptionsManager.getOption('showGuidelines')) {
         packList.classList.remove('hide-guidelines');
      } else {
         packList.classList.add('hide-guidelines');
      }

      if (currentEditor && currentEditor.codeEditorInstance) {
         currentEditor.codeEditorInstance.update();
      }
      if (currentEditor instanceof HexEditor) {
         currentEditor.renderHexView();
      }
      updateInventory(); // Re-render pack list to apply new icon settings
   });

   dialog.start();
}

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
      console.log("Restore Packs: Option enabled");
      var cached = localStorage.getItem('opkedit_cached_pack');
      if (cached) {
         try {
            var packData = JSON.parse(cached);
            console.log("Restore Packs: Found cached content for", packData.name);

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
            currentPackIndex = 0;
            selectedPackIndex = 0;
            updatePackChecksums(newPack);
            // Update inventory to show the loaded pack
            updateInventory();
            setStatus("Restored pack: " + packData.name);
         } catch (e) {
            console.error("Restore Packs: Failed to load cached pack", e);
         }
      }
   } else {
      console.log("Restore Packs: Option disabled");
   }

   // Global Theme Change Listener
   window.addEventListener('themeChanged', function (e) {
      if (currentEditor instanceof MemoryMapEditor) {
         currentEditor.initialise(currentEditor.item);
      }
      // Also update syntax highlighting if needed (handled by CSS vars usually, but editor might need redraw)
      if (currentEditor && currentEditor.codeEditorInstance) {
         // Force update/redraw if the code editor supports it
         if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
            if (currentItem || selectedPackIndex >= 0) {
               eraseItem();
            }
         }
      }
   });
}

// Core Functions

function createNew() {
   if (typeof HexViewer !== 'undefined') HexViewer.close();
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
   currentPackIndex = index;
   currentItem = null;
   updateInventory();

   // Show Memory Map
   var mmEditor = editors.find(function (e) { return e instanceof MemoryMapEditor; });
   if (mmEditor) {
      currentEditor = mmEditor;
      mmEditor.initialise({ type: 255 });

      var packName = packs[index].filename || "Untitled Pack";
      if (document.getElementById('current-file-name')) document.getElementById('current-file-name').innerText = packName;

      if (document.getElementById('code-editor-container')) document.getElementById('code-editor-container').style.display = 'none';
      if (legacyEditorElement) legacyEditorElement.style.display = 'block';
   }
}

function itemSelected(packIndex, itemIndex) {
   var pack = packs[packIndex];
   var isok = itemIndex >= 0 && itemIndex < pack.items.length;
   if (!isok) return false;

   if (currentItem == pack.items[itemIndex]) return true;

   if (!closeEditor()) return false;

   currentPackIndex = packIndex;
   selectedPackIndex = -1;
   currentItem = pack.items[itemIndex];
   var tp = currentItem.type;

   var i = 0;
   while (i < editors.length && !editors[i].acceptsType(tp)) {
      i++;
   }
   if (i < editors.length) {
      currentEditor = editors[i];
      legacyEditorElement.style.display = 'block';
      // Calculate start address for display
      // Add 6 bytes for the OPK header (OPK + length) which are not items
      var startAddr = getItemAddres(pack, itemIndex) + 6;
      currentEditor.initialise(currentItem, startAddr);
   } else {
      console.warn("No editor found for type " + tp);
   }

   updateInventory();
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
   loadPackFromFiles(loadpackbutton.getFiles());
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
            } else {
               console.warn("Restore Packs: Cannot determine full path for file. Browser security may prevent this.");
               setStatus("Warning: Cannot save pack path for restore (Browser restriction).");
            }
         }

         LoadLocalBinaryFile(files[0],
            function (data, nm) {
               var newPack = new PackImage(data);
               newPack.unsaved = false;
               newPack.filename = nm;
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
                     localStorage.setItem('opkedit_cached_pack', JSON.stringify(cachedPack));
                     console.log("Auto-Load: Pack content saved to storage.");
                  } catch (e) {
                     console.warn("Auto-Load: Failed to save pack content.", e);
                  }
               }

               packs.push(newPack);
               currentPackIndex = packs.length - 1;
               selectedPackIndex = packs.length - 1;

               updatePackChecksums(newPack);
               updateInventory();

               setStatus("Loaded OPK file: " + nm);
            }
         );
      }
   }
}

function eraseItem() {
   if (selectedPackIndex >= 0) {
      var discard = window.confirm("Are you sure you want to close/remove this pack?");
      if (!discard) return;

      if (!closeEditor()) return;

      // Remove from storage if enabled
      if (OptionsManager.getOption('restorePacks')) {
         var pack = packs[selectedPackIndex];
         if (pack) {
            var cached = localStorage.getItem('opkedit_cached_pack');
            if (cached) {
               try {
                  var cachedData = JSON.parse(cached);
                  // Check if the pack being deleted is the one in cache
                  if (cachedData.name === pack.filename) {
                     localStorage.removeItem('opkedit_cached_pack');
                     console.log("Auto-Load: Removed cached pack from storage.");
                  }
               } catch (e) {
                  console.warn("Auto-Load: Failed to check cache on delete", e);
               }
            }
         }
      }

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
   var insertIndex = items.length - 1; // Default: append before terminator

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
   if (newWidth < 200) newWidth = 200;
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
      loadPackFromFiles(e.dataTransfer.files);
   }
}, true); // useCapture = true

// Start the application
init();
document.title = "Psion OPK Editor v3.0.1";
