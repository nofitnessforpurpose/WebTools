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
            setChecked('#opt-enable-fkeys', 'enableFunctionKeys');
            setChecked('#opt-stickyproc', 'stickyProcedureHeader');
            setChecked('#opt-autocaps', 'autoUppercaseKeywords');
            setChecked('#opt-confirmations', 'suppressConfirmations');

            var setCheckedTrue = (id, opt) => {
                var el = element.querySelector(id);
                if (el) el.checked = OptionsManager.getOption(opt) === true;
            };
            setCheckedTrue('#opt-show-addresses', 'showAddresses');
            setCheckedTrue('#opt-grouprecords', 'groupDataRecords');
            setCheckedTrue('#opt-collapsefiles', 'collapseDataFiles');
            setCheckedTrue('#opt-hex-view', 'enableHexView');
            setCheckedTrue('#opt-decompiler-log', 'showDecompilerLog');
            setCheckedTrue('#opt-variable-storage', 'showVariableStorageWindow');

            // Initialize Radios
            var currentTarget = OptionsManager.getOption('targetSystem') || 'Standard';
            var targetRadios = element.querySelectorAll("input[name='opt-target']");
            targetRadios.forEach((r) => {
                if (r.value === currentTarget) r.checked = true;
                r.addEventListener('change', () => {
                    if (r.checked) OptionsManager.setOption('targetSystem', r.value);
                });
            });

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
            // Removed duplicate opt-syntax
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
            addListener('#opt-enable-fkeys', 'enableFunctionKeys');
            addListener('#opt-stickyproc', 'stickyProcedureHeader', () => {
                if (AppStore.state.currentItem && AppStore.state.currentItem.type === 3) {
                    if (typeof closeEditor === 'function' && closeEditor()) {
                        selectItem(AppStore.state.currentPackIndex, AppStore.state.packs[AppStore.state.currentPackIndex].items.indexOf(AppStore.state.currentItem));
                    }
                }
            });
            addListener('#opt-confirmations', 'suppressConfirmations');
            addListener('#opt-grouprecords', 'groupDataRecords', () => updateInventory());
            addListener('#opt-collapsefiles', 'collapseDataFiles', () => updateInventory());
            addListener('#opt-hex-view', 'enableHexView');
            addListener('#opt-decompiler-log', 'showDecompilerLog', (val) => {
                if (typeof decompilerLogWindow !== 'undefined' && decompilerLogWindow) {
                    decompilerLogWindow.updateVisibility();
                    if (val && AppStore.state.currentEditor instanceof ProcedureFileEditor) {
                        AppStore.state.currentEditor.refreshDecompilerLog(true);
                    }
                }
            });
            addListener('#opt-variable-storage', 'showVariableStorageWindow', (val) => {
                if (typeof variableStorageWindow !== 'undefined' && variableStorageWindow) {
                    variableStorageWindow.updateVisibility();
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
            var colorInputs = element.querySelectorAll('input[type="color"]');
            colorInputs.forEach(input => {
                var varName = input.getAttribute('data-var');
                if (varName) {
                    input.addEventListener('input', function () {
                        setCSSVar(varName, this.value);
                        // Save to ThemeManager
                        var currentTheme = ThemeManager.currentTheme;
                        // We get the current definition (merged includes overrides)
                        var defs = ThemeManager.getThemeDefinition(currentTheme);
                        defs[varName] = this.value;
                        ThemeManager.updateThemeDefinition(currentTheme, defs);

                        if (varName.startsWith('--mm-') && AppStore.state.currentEditor instanceof MemoryMapEditor) {
                            AppStore.state.currentEditor.initialise(AppStore.state.currentEditor.item);
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

    showKeyMapDialog: function () {
        var element = document.createElement('div');
        element.innerHTML = `
            <div style="text-align: center; padding: 10px; font-family: sans-serif;">
                <h2 style="margin-top: 5px;">Key Map</h2>
                <div style="text-align: left; margin-top: 15px; display: grid; grid-template-columns: auto 1fr; gap: 10px 20px; font-size: 14px;">
                    <div style="font-weight: bold;">F1</div><div>Help / About</div>
                    <div style="font-weight: bold;">F2</div><div>New Pack</div>
                    <div style="font-weight: bold;">F3</div><div>Open Pack</div>
                    <div style="font-weight: bold;">F4</div><div>Save Pack</div>
                    <div style="font-weight: bold;">F5</div><div>Toggle File Menu</div>
                    <div style="font-weight: bold;">F6</div><div>Delete Item</div>
                    <div style="font-weight: bold;">F7</div><div>Import Item</div>
                    <div style="font-weight: bold;">F8</div><div>Export Hex</div>
                    <div style="font-weight: bold;">F9</div><div>Apply Changes</div>
                    <div style="font-weight: bold;">F10</div><div>Discard Changes</div>
                    <div style="font-weight: bold;">F11</div><div>Options</div>
                    <div style="font-weight: bold;">F12</div><div>Key Map (This Dialog)</div>
                </div>
                <hr style="margin: 15px auto; width: 100%; border: 0; border-top: 1px solid #ccc;">
                <p style="font-size: 12px; opacity: 0.8;">Function keys are enabled in <b>Options > Visuals</b>.</p>
            </div>`;

        var dialog = new ModalDialog(element, null);
        dialog.start();
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
                 <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
                    <div>
                        <h4>Editor Settings</h4>
                        <div style="margin-bottom: 10px;"><label><input type="checkbox" id="opt-linenumbers"> Show Line Numbers</label></div>
                        <div style="margin-bottom: 10px;"><label><input type="checkbox" id="opt-folding"> Enable Code Folding</label></div>
                        <div style="margin-bottom: 10px;"><label><input type="checkbox" id="opt-syntax"> Enable Syntax Highlighting</label></div>
                        <div style="margin-bottom: 10px;"><label><input type="checkbox" id="opt-autocaps"> Auto-Uppercase Keywords</label></div>
                        <div style="margin-bottom: 10px;"><label><input type="checkbox" id="opt-stickyproc"> Fix Procedure Name at Top</label></div>
                        <div style="margin-bottom: 10px;"><label><input type="checkbox" id="opt-confirmations"> Suppress Confirmation Dialogs</label></div>
                    </div>
                    <div>
                        <h4>Pack List</h4>
                        <div style="margin-bottom: 10px;"><label><input type="checkbox" id="opt-guidelines"> Show Vertical Guidelines</label></div>
                        <div style="margin-bottom: 10px;"><label><input type="checkbox" id="opt-show-addresses"> Show Memory Addresses</label></div>
                        <div style="margin-bottom: 10px;"><label><input type="checkbox" id="opt-grouprecords"> Group Data Records under Data Files</label></div>
                        <div style="margin-bottom: 10px;"><label><input type="checkbox" id="opt-collapsefiles"> Auto-collapse Data Files</label></div>
                        <div style="margin-bottom: 10px;"><label><input type="checkbox" id="opt-hex-view"> Enable Hex Dump Window</label></div>
                        <div style="margin-bottom: 10px;"><label><input type="checkbox" id="opt-restorepacks"> Auto-Restore Opened Packs on Startup</label></div>
                    </div>
                </div>
                <hr style="margin: 15px 0; border: 0; border-top: 1px solid var(--border-color);">
                <h4>Platform / Target</h4>
                <div style="margin-bottom: 15px; font-size: 13px; color: var(--text-color);">Select the target device family for the OPL Translator. This determines which Opcodes are valid and how headers are generated.</div>
                <div style="margin-bottom: 10px;"><label style="cursor: pointer;"><input type="radio" name="opt-target" value="Standard" style="margin-right: 8px;"><b>Standard (CM / XP / LA)</b><br><span style="font-size: 11px; margin-left: 25px; opacity: 0.8;">Compatible with Series 3 Classic and early models.</span></label></div>
                <div style="margin-bottom: 10px;"><label style="cursor: pointer;"><input type="radio" name="opt-target" value="LZ" style="margin-right: 8px;"><b>LZ (Model LZ)</b><br><span style="font-size: 11px; margin-left: 25px; opacity: 0.8;">Supports LZ-specific commands (DAYS, MONTH$, etc.) and Extended Opcodes.</span></label></div>
            </div>

            <div class="tab-content" id="tab-visuals">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
                    <div>
                        <h4>UI Visibility</h4>
                        <div style="margin-bottom: 10px;"><label><input type="checkbox" id="opt-show-toolbar"> Show Icon Toolbar</label></div>
                        <div style="margin-bottom: 10px;"><label><input type="checkbox" id="opt-show-menubar"> Show File/Help Menubar</label></div>
                        <div style="margin-bottom: 10px;"><label><input type="checkbox" id="opt-enable-fkeys"> Enable Function Keys (F1-F12)</label></div>
                        <div style="margin-bottom: 10px;"><label><input type="checkbox" id="opt-splash"> Show Splash Screen on Startup</label></div>
                    </div>
                    <div>
                        <h4>Icons</h4>
                        <div style="margin-bottom: 10px;"><label>Version: <select id="opt-icon-version" style="margin-left: 5px; padding: 2px;"><option value="6">Version 6 (Latest)</option><option value="5">Version 5 (Legacy)</option></select></label></div>
                        <div style="margin-bottom: 10px;"><label>Style: <select id="opt-icon-style" style="margin-left: 5px; padding: 2px;"><option value="solid">Solid</option><option value="regular">Regular</option></select></label></div>
                    </div>
                </div>
                 <hr style="margin: 15px 0; border: 0; border-top: 1px solid var(--border-color);">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
                    <div>
                        <h4>Display</h4>
                        <div style="margin-bottom: 10px;"><label>Hex Bytes Per Row: <select id="opt-hexbytes" style="margin-left: 5px; padding: 2px;"><option value="8">8</option><option value="16">16</option><option value="32">32</option></select></label></div>
                        <div style="margin-bottom: 10px;"><label>Spreadsheet View: <select id="opt-sheetmode" style="margin-left: 5px; padding: 2px;"><option value="legacy">Legacy (Hex/ASCII)</option><option value="enhanced">Enhanced (Grid - Beta)</option></select></label></div>
                    </div>
                     <div>
                        <h4>Decompiler Tools</h4>
                        <div style="margin-bottom: 10px;"><label><input type="checkbox" id="opt-decompiler-log"> Show Decompiler Analysis Log</label></div>
                        <div style="margin-bottom: 10px;"><label><input type="checkbox" id="opt-variable-storage"> Show Variable Storage Window</label></div>
                    </div>
                </div>
            </div>

            <div class="tab-content" id="tab-theme-select">
                <div class="option-group">
                    <h3>Select Theme</h3>
                    <select id="opt-theme" style="width: 100%; padding: 5px; margin-bottom: 15px;"></select>
                    <div style="margin-top: 15px; font-size: 12px; color: var(--text-color); opacity: 0.7;">Select a theme to change the application's appearance.</div>
                </div>
                 <hr style="margin: 15px 0; border: 0; border-top: 1px solid var(--border-color);">
                <div class="option-group">
                    <h3>Manage Custom Themes</h3>
                    <div style="border: 1px solid var(--border-color); padding: 10px; border-radius: 4px; background: var(--input-bg); margin-bottom: 15px;">
                        <div style="margin-bottom: 10px; padding: 5px; border-bottom: 1px solid var(--border-color);">
                            <div style="font-weight: bold; margin-bottom: 5px;">Custom Theme 1</div>
                            <div style="display: flex; gap: 5px; margin-bottom: 5px;">
                                <input type="text" id="custom1-name" placeholder="Theme Name" style="flex: 1; padding: 3px;">
                                <button id="btn-rename-custom1" style="padding: 3px 8px; cursor: pointer;">Rename</button>
                            </div>
                            <div style="display: flex; gap: 5px; align-items: center;">
                                <span style="font-size: 11px;">Import from:</span>
                                <select id="import-custom1-source" style="flex: 1; padding: 3px;"></select>
                                <button id="btn-import-custom1" style="padding: 3px 8px; cursor: pointer;">Import & Overwrite</button>
                            </div>
                        </div>
                        <div style="margin-bottom: 5px; padding: 5px;">
                            <div style="font-weight: bold; margin-bottom: 5px;">Custom Theme 2</div>
                            <div style="display: flex; gap: 5px; margin-bottom: 5px;">
                                <input type="text" id="custom2-name" placeholder="Theme Name" style="flex: 1; padding: 3px;">
                                <button id="btn-rename-custom2" style="padding: 3px 8px; cursor: pointer;">Rename</button>
                            </div>
                            <div style="display: flex; gap: 5px; align-items: center;">
                                <span style="font-size: 11px;">Import from:</span>
                                <select id="import-custom2-source" style="flex: 1; padding: 3px;"></select>
                                <button id="btn-import-custom2" style="padding: 3px 8px; cursor: pointer;">Import & Overwrite</button>
                            </div>
                        </div>
                    </div>
                    <div style="margin-top: 20px; text-align: left;">
                         <button id="btn-reset-themes" style="background: #d32f2f; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">Reset All Themes to Defaults</button>
                    </div>
                </div>
            </div>

            <div class="tab-content" id="tab-theme-editor">
                 <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
                    <div>
                        <h4>UI Colors</h4>
                        <div style="margin-bottom: 5px;"><label>Background</label><br><input type="color" id="edit-bg-color" data-var="--bg-color" style="width: 100%;"></div>
                        <div style="margin-bottom: 5px;"><label>Text</label><br><input type="color" id="edit-text-color" data-var="--text-color" style="width: 100%;"></div>
                        <div style="margin-bottom: 5px;"><label>Toolbar BG</label><br><input type="color" id="edit-toolbar-bg" data-var="--toolbar-bg" style="width: 100%;"></div>
                        <div style="margin-bottom: 5px;"><label>Sidebar BG</label><br><input type="color" id="edit-sidebar-bg" data-var="--sidebar-bg" style="width: 100%;"></div>
                        <div style="margin-bottom: 5px;"><label>Status Bar</label><br><input type="color" id="edit-status-bg" data-var="--status-bar-bg" style="width: 100%;"></div>
                        <div style="margin-bottom: 5px;"><label>Selection</label><br><input type="color" id="edit-select-bg" data-var="--list-selected-bg" style="width: 100%;"></div>
                        <div style="margin-bottom: 5px;"><label>Editor Text</label><br><input type="color" id="edit-editor-text" data-var="--editor-text-color" style="width: 100%;"></div>
                        <div style="margin-bottom: 5px;"><label>Editor Cursor</label><br><input type="color" id="edit-editor-cursor" data-var="--editor-cursor-color" style="width: 100%;"></div>
                    </div>
                    <div>
                        <h4>Syntax Highlighting</h4>
                        <div style="margin-bottom: 10px; font-size: 12px; color: var(--text-color); opacity: 0.7;">Customize syntax colors for the <b>current theme</b>.</div>
                        <div style="margin-bottom: 5px;"><label>Functions</label><br><input type="color" id="syntax-functions" data-var="--syntax-functions" style="width: 100%;"></div>
                        <div style="margin-bottom: 5px;"><label>Commands</label><br><input type="color" id="syntax-commands" data-var="--syntax-commands" style="width: 100%;"></div>
                        <div style="margin-bottom: 5px;"><label>Operators</label><br><input type="color" id="syntax-operator" data-var="--syntax-operator" style="width: 100%;"></div>
                        <div style="margin-bottom: 5px;"><label>Comments</label><br><input type="color" id="syntax-comment" data-var="--syntax-comment" style="width: 100%;"></div>
                        <div style="margin-bottom: 5px;"><label>Strings</label><br><input type="color" id="syntax-string" data-var="--syntax-string" style="width: 100%;"></div>
                        <div style="margin-bottom: 5px;"><label>Numbers</label><br><input type="color" id="syntax-number" data-var="--syntax-number" style="width: 100%;"></div>
                        <div style="margin-bottom: 5px;"><label>Labels</label><br><input type="color" id="syntax-label" data-var="--syntax-label" style="width: 100%;"></div>
                        <div style="margin-top: 15px;">
                            <button id="reset-syntax" class="modal-btn" style="background-color: #666;">Reset to Default</button>
                        </div>
                    </div>
                 </div>
                 <div style="margin-top: 10px; font-size: 11px; color: var(--text-color); opacity: 0.7;">Changes apply immediately to the current view.</div>
            </div>

            <div class="tab-content" id="tab-memory-map">
                <h4>Memory Map Settings</h4>
                <div style="margin-bottom: 15px;"><label>Orientation: <select id="opt-mm-orientation" style="margin-left: 5px; padding: 2px;"><option value="horizontal">Horizontal</option><option value="vertical">Vertical</option></select></label></div>
                <div style="margin-bottom: 10px;"><label><input type="checkbox" id="opt-mm-pagebreaks"> Show Page Boundary Markers</label></div>
                <div style="margin-bottom: 10px;"><label>Memory Map Display Size: <select id="opt-mm-size" style="margin-left: 5px; padding: 2px;">
                    <option value="1024">1 kB</option>
                    <option value="2048">2 kB</option>
                    <option value="4096">4 kB</option>
                    <option value="8192">8 kB</option>
                    <option value="16384">16 kB</option>
                    <option value="32768">32 kB</option>
                    <option value="65536">64 kB</option>
                    <option value="131072">128 kB</option>
                    <option value="262144">256 kB</option>
                    <option value="524288">512 kB</option>
                </select></label></div>
                <div style="margin-bottom: 10px;"><label>Memory Map Bar Weight: <select id="opt-mm-height" style="margin-left: 5px; padding: 2px;">
                    <option value="20">Small (20px)</option>
                    <option value="30">Medium (30px)</option>
                    <option value="40">Large (40px)</option>
                    <option value="50">Extra Large (50px)</option>
                </select></label></div>
                
                <h4>Content Colors</h4>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
                      <div><label>Header</label><br><input type="color" id="mm-color-header" data-var="--mm-color-header" style="width: 100%;"></div>
                      <div><label>Procedure</label><br><input type="color" id="mm-color-procedure" data-var="--mm-color-procedure" style="width: 100%;"></div>
                      <div><label>Data File</label><br><input type="color" id="mm-color-datafile" data-var="--mm-color-datafile" style="width: 100%;"></div>
                      <div><label>Diary</label><br><input type="color" id="mm-color-diary" data-var="--mm-color-diary" style="width: 100%;"></div>
                      <div><label>Comms</label><br><input type="color" id="mm-color-comms" data-var="--mm-color-comms" style="width: 100%;"></div>
                      <div><label>Sheet</label><br><input type="color" id="mm-color-sheet" data-var="--mm-color-sheet" style="width: 100%;"></div>
                      <div><label>Pager</label><br><input type="color" id="mm-color-pager" data-var="--mm-color-pager" style="width: 100%;"></div>
                      <div><label>Notepad</label><br><input type="color" id="mm-color-notepad" data-var="--mm-color-notepad" style="width: 100%;"></div>
                      <div><label>Block</label><br><input type="color" id="mm-color-block" data-var="--mm-color-block" style="width: 100%;"></div>
                      <div><label>Record</label><br><input type="color" id="mm-color-record" data-var="--mm-color-record" style="width: 100%;"></div>
                      <div><label>Unknown</label><br><input type="color" id="mm-color-unknown" data-var="--mm-color-unknown" style="width: 100%;"></div>
                      <div><label>Empty Space</label><br><input type="color" id="mm-color-free" data-var="--mm-color-free" style="width: 100%;"></div>
                </div>
            </div>
        </div>
        `;
    }
};
