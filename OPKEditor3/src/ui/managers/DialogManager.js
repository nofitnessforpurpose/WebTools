'use strict';

/**
 * DialogManager
 * -------------
 * Manages application-wide modal dialogs.
 */
var DialogManager = {

    showOptionsDialog: function () {
        try {
            var element = document.createElement('div');
            element.className = 'options-dialog';

            // Generate Template
            element.innerHTML = this._getOptionsTemplate();

            // Internal Helpers (captured for this instance)
            var getCSSVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
            var setCSSVar = (name, value) => document.documentElement.style.setProperty(name, value);

            var updateInputs = () => {
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
                for (var key in inputs) {
                    if (inputs[key]) inputs[key].value = getCSSVar(key) || '#000000';
                }

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
                var currentTheme = ThemeManager.currentTheme;
                var defs = ThemeManager.getThemeDefinition(currentTheme);
                for (var key in syntaxInputs) {
                    if (syntaxInputs[key]) syntaxInputs[key].value = defs[key] || getCSSVar(key) || '#000000';
                }
            };

            var updateMMInputs = () => {
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
                var currentTheme = ThemeManager.currentTheme;
                var defs = ThemeManager.getThemeDefinition(currentTheme);
                for (var key in mmColors) {
                    if (mmColors[key]) {
                        mmColors[key].value = defs[key] || getCSSVar(key) || '#000000';
                    }
                }
            };

            // Theme Select Logic
            var themeSelect = element.querySelector('#opt-theme');
            if (themeSelect) {
                var availableThemes = ThemeManager.getAvailableThemes();
                availableThemes.forEach(function (t) {
                    var opt = document.createElement('option');
                    opt.value = t.key; opt.text = t.name;
                    themeSelect.appendChild(opt);
                });
                themeSelect.value = ThemeManager.currentTheme;

                var populateManagementSelects = () => {
                    var import1 = element.querySelector('#import-custom1-source');
                    var import2 = element.querySelector('#import-custom2-source');
                    if (import1 && import2) {
                        import1.innerHTML = '';
                        import2.innerHTML = '';
                        availableThemes.forEach(function (t) {
                            var opt1 = document.createElement('option');
                            var opt2 = document.createElement('option');
                            opt1.value = t.key; opt1.text = t.name;
                            opt2.value = t.key; opt2.text = t.name;
                            import1.appendChild(opt1);
                            import2.appendChild(opt2);
                        });
                    }
                    var customNames = OptionsManager.getOption('customThemeNames') || {};
                    var name1 = element.querySelector('#custom1-name');
                    var name2 = element.querySelector('#custom2-name');
                    if (name1) name1.value = customNames['custom1'] || 'Custom Theme 1';
                    if (name2) name2.value = customNames['custom2'] || 'Custom Theme 2';
                };
                populateManagementSelects();

                // Listeners for Management
                var setupBtn = (id, action) => {
                    var btn = element.querySelector(id);
                    if (btn) btn.onclick = (e) => { e.preventDefault(); action(e); };
                };

                setupBtn('#btn-reset-themes', () => {
                    if (confirm('Are you sure you want to reset ALL themes to default?')) {
                        ThemeManager.resetAll();
                        populateManagementSelects();
                        setTimeout(updateInputs, 50);
                        setTimeout(updateMMInputs, 50);
                    }
                });

                setupBtn('#btn-rename-custom1', () => {
                    var name = element.querySelector('#custom1-name').value;
                    if (name) { ThemeManager.setThemeName('custom1', name); populateManagementSelects(); }
                });
                setupBtn('#btn-import-custom1', () => {
                    var source = element.querySelector('#import-custom1-source').value;
                    var name = element.querySelector('#custom1-name').value;
                    if (confirm("Overwrite 'Custom Theme 1'?")) {
                        ThemeManager.importTheme(source, 'custom1', name);
                        populateManagementSelects();
                        ThemeManager.setTheme('custom1');
                        themeSelect.value = 'custom1';
                        setTimeout(updateInputs, 50);
                        setTimeout(updateMMInputs, 50);
                    }
                });
                // ... (Repeating for Custom 2)
                setupBtn('#btn-rename-custom2', () => {
                    var name = element.querySelector('#custom2-name').value;
                    if (name) { ThemeManager.setThemeName('custom2', name); populateManagementSelects(); }
                });
                setupBtn('#btn-import-custom2', () => {
                    var source = element.querySelector('#import-custom2-source').value;
                    var name = element.querySelector('#custom2-name').value;
                    if (confirm("Overwrite 'Custom Theme 2'?")) {
                        ThemeManager.importTheme(source, 'custom2', name);
                        populateManagementSelects();
                        ThemeManager.setTheme('custom2');
                        themeSelect.value = 'custom2';
                        setTimeout(updateInputs, 50);
                        setTimeout(updateMMInputs, 50);
                    }
                });
            }

            // Initialize General Options
            var setChecked = (id, opt) => {
                var el = element.querySelector(id);
                if (el) el.checked = OptionsManager.getOption(opt) !== false;
            };
            setChecked('#opt-linenumbers', 'showLineNumbers');
            setChecked('#opt-folding', 'codeFolding');
            setChecked('#opt-syntax', 'syntaxHighlighting');
            setChecked('#opt-guidelines', 'showGuidelines');
            setChecked('#opt-splash', 'showSplashScreen');
            setChecked('#opt-restorepacks', 'restorePacks');
            setChecked('#opt-show-toolbar', 'showIconToolbar');
            setChecked('#opt-show-menubar', 'showMenuBar');
            setChecked('#opt-stickyproc', 'stickyProcedureHeader');

            var setCheckedTrue = (id, opt) => {
                var el = element.querySelector(id);
                if (el) el.checked = OptionsManager.getOption(opt) === true;
            };
            setCheckedTrue('#opt-show-addresses', 'showAddresses');
            setCheckedTrue('#opt-grouprecords', 'groupDataRecords');
            setCheckedTrue('#opt-collapsefiles', 'collapseDataFiles');
            setCheckedTrue('#opt-decompiler-log', 'showDecompilerLog');

            // Initialize Radios
            var currentTarget = OptionsManager.getOption('targetSystem') || 'Standard';
            var targetRadios = element.querySelectorAll("input[name='opt-target']");
            targetRadios.forEach((r) => {
                if (r.value === currentTarget) r.checked = true;
                r.addEventListener('change', () => {
                    if (r.checked) OptionsManager.setOption('targetSystem', r.value);
                });
            });

            // Add Listeners
            var addListener = (id, opt, action) => {
                var el = element.querySelector(id);
                if (el) el.addEventListener('change', function () {
                    OptionsManager.setOption(opt, this.checked);
                    if (action) action(this.checked);
                });
            };

            addListener('#opt-linenumbers', 'showLineNumbers', () => {
                if (typeof editors !== 'undefined') editors.forEach(ed => ed.render && ed.render());
            });
            addListener('#opt-folding', 'codeFolding', () => {
                if (typeof editors !== 'undefined') editors.forEach(ed => ed.render && ed.render());
            });
            addListener('#opt-syntax', 'syntaxHighlighting', () => {
                if (typeof editors !== 'undefined') editors.forEach(ed => ed.render && ed.render());
            });
            addListener('#opt-guidelines', 'showGuidelines', (val) => {
                var packList = document.getElementById('pack-list');
                if (val) packList.classList.remove('hide-guidelines');
                else packList.classList.add('hide-guidelines');
            });
            addListener('#opt-show-addresses', 'showAddresses', (val) => {
                var packList = document.getElementById('pack-list');
                if (val) packList.classList.add('show-addresses');
                else packList.classList.remove('show-addresses');
            });
            addListener('#opt-splash', 'showSplashScreen');
            addListener('#opt-restorepacks', 'restorePacks', (val) => {
                if (!val) localStorage.removeItem('opkedit_open_packs');
            });
            addListener('#opt-show-toolbar', 'showIconToolbar', (val) => {
                if (!val && !OptionsManager.getOption('showMenuBar')) {
                    element.querySelector('#opt-show-menubar').checked = true;
                    OptionsManager.setOption('showMenuBar', true);
                }
            });
            addListener('#opt-show-menubar', 'showMenuBar', (val) => {
                if (!val && !OptionsManager.getOption('showIconToolbar')) {
                    element.querySelector('#opt-show-toolbar').checked = true;
                    OptionsManager.setOption('showIconToolbar', true);
                }
            });
            addListener('#opt-stickyproc', 'stickyProcedureHeader', () => {
                if (AppStore.state.currentItem && AppStore.state.currentItem.type === 3) {
                    if (typeof closeEditor === 'function' && closeEditor()) {
                        selectItem(AppStore.state.currentPackIndex, AppStore.state.packs[AppStore.state.currentPackIndex].items.indexOf(AppStore.state.currentItem));
                    }
                }
            });
            addListener('#opt-grouprecords', 'groupDataRecords', () => updateInventory());
            addListener('#opt-collapsefiles', 'collapseDataFiles', () => updateInventory());
            addListener('#opt-decompiler-log', 'showDecompilerLog', (val) => {
                if (typeof decompilerLogWindow !== 'undefined' && decompilerLogWindow) {
                    decompilerLogWindow.updateVisibility();
                    if (val && AppStore.state.currentEditor instanceof ProcedureFileEditor) {
                        AppStore.state.currentEditor.refreshDecompilerLog(true);
                    }
                }
            });

            // Selects
            element.querySelector('#opt-hexbytes').value = OptionsManager.getOption('hexBytesPerRow') || 16;
            element.querySelector('#opt-hexbytes').addEventListener('change', function () {
                OptionsManager.setOption('hexBytesPerRow', parseInt(this.value));
                if (AppStore.state.currentEditor instanceof HexEditor) AppStore.state.currentEditor.renderHexView();
            });

            element.querySelector('#opt-sheetmode').value = OptionsManager.getOption('spreadsheetMode') || 'grid';
            element.querySelector('#opt-sheetmode').addEventListener('change', function () {
                OptionsManager.setOption('spreadsheetMode', this.value);
                if (AppStore.state.currentEditor instanceof SpreadsheetFileEditor) AppStore.state.currentEditor.initialise(AppStore.state.currentEditor.item);
            });

            // Memory Map Options
            addListener('#opt-mm-pagebreaks', 'memoryMapShowPageBreaks', () => {
                if (AppStore.state.currentEditor instanceof MemoryMapEditor) AppStore.state.currentEditor.initialise(AppStore.state.currentEditor.item);
            });
            element.querySelector('#opt-mm-size').value = OptionsManager.getOption('memoryMapDisplaySize') || 600;
            element.querySelector('#opt-mm-size').addEventListener('change', function () {
                OptionsManager.setOption('memoryMapDisplaySize', parseInt(this.value));
                if (AppStore.state.currentEditor instanceof MemoryMapEditor) AppStore.state.currentEditor.initialise(AppStore.state.currentEditor.item);
            });
            element.querySelector('#opt-mm-height').value = OptionsManager.getOption('memoryMapBarHeight') || 30;
            element.querySelector('#opt-mm-height').addEventListener('change', function () {
                OptionsManager.setOption('memoryMapBarHeight', parseInt(this.value));
                if (AppStore.state.currentEditor instanceof MemoryMapEditor) AppStore.state.currentEditor.initialise(AppStore.state.currentEditor.item);
            });

            var mmOrientation = element.querySelector('#opt-mm-orientation');
            if (mmOrientation) {
                mmOrientation.value = OptionsManager.getOption('memoryMapOrientation') || 'horizontal';
                mmOrientation.addEventListener('change', function () {
                    OptionsManager.setOption('memoryMapOrientation', this.value);
                    if (AppStore.state.currentEditor instanceof MemoryMapEditor) AppStore.state.currentEditor.initialise(AppStore.state.currentEditor.item);
                });
            }

            // Theme Select Listener
            themeSelect.addEventListener('change', function () {
                ThemeManager.setTheme(this.value);
                setTimeout(updateInputs, 50);
                setTimeout(updateMMInputs, 50);
            });

            // Tab Switching Logic
            var tabs = element.querySelectorAll('.tab-btn');
            tabs.forEach((tab) => {
                tab.addEventListener('click', (e) => {
                    e.preventDefault();
                    element.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
                    element.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                    tab.classList.add('active');
                    var targetId = tab.getAttribute('data-tab');
                    element.querySelector('#' + targetId).classList.add('active');
                });
            });

            // Color Inputs
            var colorInputs = element.querySelectorAll('.color-input');
            colorInputs.forEach(input => {
                var varName = input.getAttribute('data-var');
                if (varName) {
                    input.addEventListener('input', function () {
                        setCSSVar(varName, this.value);
                        // If it's a syntax or MM color, save to ThemeManager
                        if (varName.startsWith('--syntax-') || varName.startsWith('--mm-')) {
                            var currentTheme = ThemeManager.currentTheme;
                            var defs = ThemeManager.getThemeDefinition(currentTheme);
                            defs[varName] = this.value;
                            ThemeManager.updateThemeDefinition(currentTheme, defs);

                            if (varName.startsWith('--mm-') && AppStore.state.currentEditor instanceof MemoryMapEditor) {
                                AppStore.state.currentEditor.initialise(AppStore.state.currentEditor.item);
                            }
                        }
                    });
                }
            });

            setupBtn('#reset-syntax', () => {
                var currentTheme = ThemeManager.currentTheme;
                var overrides = OptionsManager.getOption('themeOverrides') || {};
                if (overrides[currentTheme]) {
                    delete overrides[currentTheme];
                    OptionsManager.setOption('themeOverrides', overrides);
                    ThemeManager.applyTheme(currentTheme);
                    setTimeout(updateInputs, 50);
                }
            });

            // Initialize Inputs
            setTimeout(() => { updateInputs(); updateMMInputs(); }, 0);

            var dialog = new ModalDialog(element, () => {
                if (AppStore.state.currentEditor && AppStore.state.currentEditor.codeEditorInstance) {
                    AppStore.state.currentEditor.codeEditorInstance.update();
                }
                if (AppStore.state.currentEditor instanceof HexEditor) AppStore.state.currentEditor.renderHexView();
                updateInventory();
            });

            dialog.start();
        } catch (e) {
            console.error("Failed to open Options Dialog:", e);
            alert("An error occurred while opening the options dialog.");
        }
    },

    showAboutDialog: function (isSplash) {
        var element = document.createElement('div');
        element.innerHTML =
            "<div style='text-align: center; padding: 20px; font-family: sans-serif;'>" +
            "<img src='assets/pics/logo.gif' alt='Psion Logo' style='width: 25%; margin-bottom: 15px;'>" +
            "<h2 style='margin-top: 0;'>OPK Editor 3</h2>" +
            "<p>A modern editor for Psion Organiser II packs.</p>" +
            "<p>Version " + (typeof APP_VERSION !== 'undefined' ? APP_VERSION : '3.0.x') + "</p>" +
            "<hr style='margin: 15px auto; width: 80%; border: 0; border-top: 1px solid #ccc;'>" +
            "<p>Original by <b>Jaap Scherphuis</b></p>" +
            "<p>Icons by <b>Font Awesome</b></p>" +
            "<p>Implemented with precision by <b>Antigravity</b>.</p>" +
            "<p>Reimagined by <b>NFfP</b>.</p>" +
            "</div>";

        var dialog = new ModalDialog(element, null);
        dialog.start();

        if (isSplash) {
            setTimeout(() => dialog.stop(), 3000);
        }
    },

    _getOptionsTemplate: function () {
        return `
        <div class="tabs-container">
            <div class="tabs-header">
                <button class="tab-btn active" data-tab="tab-general">General</button>
                <button class="tab-btn" data-tab="tab-visuals">Visuals</button>
                <button class="tab-btn" data-tab="tab-theme-select">Theme Selection</button>
                <button class="tab-btn" data-tab="tab-theme-editor">Theme Editor</button>
                <button class="tab-btn" data-tab="tab-memory-map">Memory Map</button>
            </div>
            
            <div class="tab-content active" id="tab-general">
                <div class="option-group">
                    <h3>Editor Settings</h3>
                    <label><input type="checkbox" id="opt-linenumbers"> Show Line Numbers</label>
                    <label><input type="checkbox" id="opt-folding"> Enable Code Folding</label>
                    <label><input type="checkbox" id="opt-syntax"> Enable Syntax Highlighting</label>
                    <label><input type="checkbox" id="opt-stickyproc"> Fix Procedure Name at Top</label>
                </div>
                <div class="option-group">
                    <h3>Pack List</h3>
                    <label><input type="checkbox" id="opt-guidelines"> Show Vertical Guidelines</label>
                    <label><input type="checkbox" id="opt-show-addresses"> Show Memory Addresses</label>
                    <label><input type="checkbox" id="opt-grouprecords"> Group Data Records under Data Files</label>
                    <label><input type="checkbox" id="opt-collapsefiles"> Auto-collapse Data Files</label>
                </div>
                <div class="option-group">
                    <h3>Platform / Target</h3>
                    <label><input type="radio" name="opt-target" value="Standard"> Standard Organiser II</label>
                    <label><input type="radio" name="opt-target" value="LZ"> Psion LZ / LZ64 (Extended)</label>
                </div>
            </div>

            <div class="tab-content" id="tab-visuals">
                <div class="option-group">
                    <h3>UI Visibility</h3>
                    <label><input type="checkbox" id="opt-show-toolbar"> Show Icon Toolbar</label>
                    <label><input type="checkbox" id="opt-show-menubar"> Show File/Help Menubar</label>
                    <label><input type="checkbox" id="opt-splash"> Show Splash Screen on Startup</label>
                    <label><input type="checkbox" id="opt-restorepacks"> Auto-Restore Opened Packs on Startup</label>
                </div>
                <div class="option-group">
                   <h3>Icons</h3>
                   <label>Version: <select id="opt-icon-version"><option value="3">V3 Style</option><option value="2">V2 Style</option></select></label>
                   <label>Style: <select id="opt-icon-style"><option value="solid">Solid</option><option value="regular">Regular</option></select></label>
                </div>
                <div class="option-group">
                    <h3>Display</h3>
                    <label>Hex Bytes Per Row: <select id="opt-hexbytes"><option value="8">8</option><option value="16">16</option><option value="32">32</option></select></label>
                    <label>Spreadsheet View: <select id="opt-sheetmode"><option value="grid">Grid</option><option value="record">Single Record</option></select></label>
                    <label><input type="checkbox" id="opt-decompiler-log"> Show Decompiler Analysis Log</label>
                </div>
            </div>

            <div class="tab-content" id="tab-theme-select">
                <div class="option-group">
                    <h3>Select Theme</h3>
                    <select id="opt-theme" style="width: 100%; padding: 5px; margin-bottom: 15px;"></select>
                </div>
                <div class="option-group">
                    <h3>Manage Custom Themes</h3>
                    <div style="margin-bottom:10px;">
                        <strong>Custom Slot 1:</strong><br>
                        <input type="text" id="custom1-name" placeholder="Name" style="margin:5px 0;"><br>
                        <button id="btn-rename-custom1">Rename</button>
                        <select id="import-custom1-source"></select>
                        <button id="btn-import-custom1">Clone</button>
                    </div>
                    <div style="margin-bottom:10px;">
                        <strong>Custom Slot 2:</strong><br>
                        <input type="text" id="custom2-name" placeholder="Name" style="margin:5px 0;"><br>
                        <button id="btn-rename-custom2">Rename</button>
                        <select id="import-custom2-source"></select>
                        <button id="btn-import-custom2">Clone</button>
                    </div>
                    <hr>
                    <button id="btn-reset-themes" style="color:red;">Factory Reset All Themes</button>
                </div>
            </div>

            <div class="tab-content" id="tab-theme-editor">
                 <div style="display: flex; gap: 20px;">
                    <div style="flex: 1;">
                        <h3>UI Colors</h3>
                        <div class="color-row"><span>Background:</span> <input type="color" id="edit-bg-color" data-var="--bg-color" class="color-input"></div>
                        <div class="color-row"><span>Text:</span> <input type="color" id="edit-text-color" data-var="--text-color" class="color-input"></div>
                        <div class="color-row"><span>Toolbar:</span> <input type="color" id="edit-toolbar-bg" data-var="--toolbar-bg" class="color-input"></div>
                        <div class="color-row"><span>Sidebar:</span> <input type="color" id="edit-sidebar-bg" data-var="--sidebar-bg" class="color-input"></div>
                        <div class="color-row"><span>Status:</span> <input type="color" id="edit-status-bg" data-var="--status-bar-bg" class="color-input"></div>
                        <div class="color-row"><span>Selection:</span> <input type="color" id="edit-select-bg" data-var="--list-selected-bg" class="color-input"></div>
                        <div class="color-row"><span>Editor Text:</span> <input type="color" id="edit-editor-text" data-var="--editor-text-color" class="color-input"></div>
                        <div class="color-row"><span>Cursor:</span> <input type="color" id="edit-editor-cursor" data-var="--editor-cursor-color" class="color-input"></div>
                    </div>
                    <div style="flex: 1;">
                        <h3>Syntax Colors</h3>
                        <div class="color-row"><span>Functions:</span> <input type="color" id="syntax-functions" data-var="--syntax-functions" class="color-input"></div>
                        <div class="color-row"><span>Commands:</span> <input type="color" id="syntax-commands" data-var="--syntax-commands" class="color-input"></div>
                        <div class="color-row"><span>Operators:</span> <input type="color" id="syntax-operator" data-var="--syntax-operator" class="color-input"></div>
                        <div class="color-row"><span>Comments:</span> <input type="color" id="syntax-comment" data-var="--syntax-comment" class="color-input"></div>
                        <div class="color-row"><span>Strings:</span> <input type="color" id="syntax-string" data-var="--syntax-string" class="color-input"></div>
                        <div class="color-row"><span>Numbers:</span> <input type="color" id="syntax-number" data-var="--syntax-number" class="color-input"></div>
                        <div class="color-row"><span>Labels:</span> <input type="color" id="syntax-label" data-var="--syntax-label" class="color-input"></div>
                        <button id="reset-syntax" style="margin-top:10px;">Reset to Theme Defaults</button>
                    </div>
                 </div>
            </div>

            <div class="tab-content" id="tab-memory-map">
                <div class="option-group">
                    <h3>Display Style</h3>
                    <label>Orientation: <select id="opt-mm-orientation"><option value="horizontal">Horizontal (Classic)</option><option value="vertical">Vertical (Tall/Scrollable)</option></select></label>
                    <label><input type="checkbox" id="opt-mm-pagebreaks"> Show Page Boundaries (EPROM 8K/16K/32K)</label>
                    <label>Target Height/Width (pixels): <input type="number" id="opt-mm-size" value="600" style="width:60px;"></label>
                    <label>Bar Thickness: <input type="number" id="opt-mm-height" value="30" style="width:60px;"></label>
                </div>
                <div class="option-group">
                    <h3>Memory Map Colors</h3>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:5px;">
                      <div class="color-row"><span>Header:</span> <input type="color" id="mm-color-header" data-var="--mm-color-header" class="color-input"></div>
                      <div class="color-row"><span>Procedure:</span> <input type="color" id="mm-color-procedure" data-var="--mm-color-procedure" class="color-input"></div>
                      <div class="color-row"><span>Data File:</span> <input type="color" id="mm-color-datafile" data-var="--mm-color-datafile" class="color-input"></div>
                      <div class="color-row"><span>Diary:</span> <input type="color" id="mm-color-diary" data-var="--mm-color-diary" class="color-input"></div>
                      <div class="color-row"><span>Comms:</span> <input type="color" id="mm-color-comms" data-var="--mm-color-comms" class="color-input"></div>
                      <div class="color-row"><span>Sheet:</span> <input type="color" id="mm-color-sheet" data-var="--mm-color-sheet" class="color-input"></div>
                      <div class="color-row"><span>Pager:</span> <input type="color" id="mm-color-pager" data-var="--mm-color-pager" class="color-input"></div>
                      <div class="color-row"><span>Notepad:</span> <input type="color" id="mm-color-notepad" data-var="--mm-color-notepad" class="color-input"></div>
                      <div class="color-row"><span>Block:</span> <input type="color" id="mm-color-block" data-var="--mm-color-block" class="color-input"></div>
                      <div class="color-row"><span>Record:</span> <input type="color" id="mm-color-record" data-var="--mm-color-record" class="color-input"></div>
                      <div class="color-row"><span>Unknown:</span> <input type="color" id="mm-color-unknown" data-var="--mm-color-unknown" class="color-input"></div>
                      <div class="color-row"><span>Empty Space:</span> <input type="color" id="mm-color-free" data-var="--mm-color-free" class="color-input"></div>
                    </div>
                </div>
            </div>
        </div>
        `;
    }
};
