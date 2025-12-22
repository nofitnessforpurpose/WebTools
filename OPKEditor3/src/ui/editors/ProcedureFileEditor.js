'use strict';

//------------- Procedure file editor --------------------

function ProcedureFileEditor(editorelement, codeEditorContainer, callback) {
    BlockFileEditor.call(this, editorelement, callback, [2, 3], codeEditorContainer);
}
ProcedureFileEditor.prototype = Object.create(BlockFileEditor.prototype);
ProcedureFileEditor.prototype.initialise = function (item) {
    var self = this;
    var extraelement = null;
    // We still create the legacy element for metadata display
    if (!this.myelement) {
        // create procedure-specific editor
        extraelement = document.createElement('div');
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

    // Apply Read-Only if deleted
    if (this.item.deleted) {
        var ta = document.getElementById('sourcecode');
        if (ta) ta.disabled = true;
        if (this.codeEditorInstance) this.codeEditorInstance.setReadOnly(true);

        // Also disable filename input if possible (handled in BlockEditor but we can verify)
        var fn = document.getElementById('filename');
        if (fn) fn.disabled = true;
    }

    // Inject Translate Button into Editor Header
    var header = document.getElementById('editor-header');
    if (header) {
        // Avoid duplicate button if logic runs multiple times or reused?
        // But initialise is usually called on new selection.
        // We should cleanup previous button if exists? 
        // BaseEditor logic creates new editor class instance per file open?
        // Usually yes.
        // Safety: Remove any existing buttons from previous instances (if finish wasn't called)
        var existingTranslate = header.querySelector('button[title^="Translate"]');
        if (existingTranslate) header.removeChild(existingTranslate);
        var existingStrip = header.querySelector('button[title^="Copy Object Code"]');
        if (existingStrip) header.removeChild(existingStrip);

        var btn = document.createElement('button');
        btn.innerHTML = '<i class="fas fa-gears"></i> Translate';
        btn.className = 'icon-btn';
        btn.style.marginLeft = 'auto';
        btn.style.background = 'none';
        btn.style.border = 'none';
        btn.style.color = 'var(--text-color)';
        btn.style.cursor = 'pointer';
        btn.style.fontSize = '13px';
        btn.title = 'Translate (Compile Source to Object Code)';


        btn.addEventListener('click', function (e) {
            if (self.item.deleted) return;
            self.translateAndSave();
        });
        if (this.item.deleted) btn.disabled = true;

        header.appendChild(btn);
        this.translateBtn = btn;

        // Inject Strip Source Button (Moved up)
        var stripBtn = document.createElement('button');
        stripBtn.innerHTML = '<i class="fa-solid fa-file-zipper"></i>';
        stripBtn.className = 'icon-btn';
        stripBtn.style.marginLeft = '5px';
        stripBtn.style.background = 'none';
        stripBtn.style.border = 'none';
        stripBtn.style.color = 'var(--text-color)';
        stripBtn.style.cursor = 'pointer';
        stripBtn.style.fontSize = '13px';
        stripBtn.title = 'Copy Object Code';

        stripBtn.addEventListener('click', function (e) {
            if (self.item.deleted) return;
            self.copyObjectCode();
        });
        if (this.item.deleted) stripBtn.disabled = true;

        header.appendChild(stripBtn);
        this.stripBtn = stripBtn;

        // Inject Divider
        var divider = document.createElement('span');
        divider.innerHTML = '|';
        divider.style.margin = '0 10px';
        divider.style.color = 'var(--border-color)';
        divider.style.opacity = '0.5';
        header.appendChild(divider);
        this.headerDivider = divider;

        // Inject Target System Indicator (Passive)
        var targetIndicator = document.createElement('span');
        targetIndicator.style.marginRight = '5px';
        targetIndicator.style.color = 'var(--text-color)';
        targetIndicator.style.fontSize = '12px';
        targetIndicator.style.opacity = '0.7';
        targetIndicator.title = 'Current Compiler Target (Change in Options)';

        var updateTargetLabel = function () {
            var current = OptionsManager.getOption('targetSystem') || 'Standard';
            var label = (current === 'LZ') ? 'LZ Mode' : 'XP Mode';
            var icon = (current === 'LZ') ? 'fa-memory' : 'fa-microchip';
            targetIndicator.innerHTML = '<i class="fas ' + icon + '"></i> ' + label;
        };

        updateTargetLabel();

        header.appendChild(targetIndicator);
        this.targetIndicator = targetIndicator;

        // Listener for Sync
        this.targetOptionListener = function (e) {
            if (e.detail && e.detail.key === 'targetSystem') {
                updateTargetLabel();
            }
        };
        window.addEventListener('optionsChanged', this.targetOptionListener);


    }

    // extract data from item and initialise form
    var chld = this.item.child.child;
    var lncode = chld.data[0] * 256 + chld.data[1];
    document.getElementById("objectcode").innerHTML = "" + lncode;
    // Allow re-translation even if QCode exists
    // (Disabled check removed)
    var lnsrc = chld.data[lncode + 2] * 256 + chld.data[lncode + 3];
    // Defer the heavy decompilation to allow UI to update first

    setTimeout(function () {
        var s = "";
        var hasSource = (lnsrc > 0);

        // 1. Extract Existing Source if available
        if (hasSource) {
            for (var i = 0; i < lnsrc; i++) {
                var c = chld.data[lncode + 4 + i];
                if (c == 0) s += "\n";
                else s += String.fromCharCode(c);
            }
        }

        // 2. Refresh Decompiler Log (if needed or if explicitly open)
        var decompiledResult = self.refreshDecompilerLog(hasSource);
        if (!hasSource && decompiledResult) {
            s = decompiledResult;
        }

        self.originalSource = s;
        self.updateEditorContent(s);
    }, 10);

    // Initial placeholder state
    var s = "REM Loading...";

    // Custom Code Editor Integration
    if (this.codeEditorContainer) {
        // Hide legacy textarea container
        var legacyContainer = document.getElementById('opl-legacy-container');
        if (legacyContainer) legacyContainer.style.display = 'none';

        // Show CodeEditor container
        this.codeEditorContainer.style.display = 'flex';

        // Create wrapper if not exists
        if (!this.codeEditorWrapper) {
            this.codeEditorWrapper = document.createElement('div');
            this.codeEditorWrapper.style.flex = '1';
            this.codeEditorWrapper.style.display = 'flex';
            this.codeEditorWrapper.style.overflow = 'hidden';
            this.codeEditorContainer.appendChild(this.codeEditorWrapper);
        }
        this.codeEditorWrapper.style.display = 'flex';

        // Initialize CodeEditor if not already
        // Check if mode has changed
        var targetSplitMode = OptionsManager.getOption('stickyProcedureHeader') !== false;
        if (this.codeEditorInstance && this.codeEditorInstance.isSplitMode() !== targetSplitMode) {
            this.codeEditorInstance = null;
            this.codeEditorWrapper.innerHTML = '';
        }

        if (!this.codeEditorInstance) {
            this.codeEditorInstance = new CodeEditor(this.codeEditorWrapper, {
                value: s,
                language: 'opl',
                readOnly: false,
                lineNumbers: OptionsManager.getOption('showLineNumbers'),
                folding: OptionsManager.getOption('codeFolding'),
                minimap: { enabled: false },
                theme: ThemeManager.currentTheme,
                procedureMode: true,
                onHeaderBlur: function (headerValue) {
                    // ... (keep existing)
                    var match = headerValue.match(/^\s*([a-zA-Z][a-zA-Z0-9]{0,7}[%$]?)\s*:/i);
                    if (match && match[1]) {
                        // ...
                        var newName = match[1];
                        if (self.item.name !== newName) {
                            self.item.name = newName;
                            self.item.text = newName;
                            var fnInput = document.getElementById('filename');
                            if (fnInput) fnInput.value = newName;
                            if (window.updateInventory) window.updateInventory();
                        }
                    }
                }
            });


            this.codeEditorInstance.onChange = function () {
                self.callback(EditorMessage.CHANGEMADE);
            };
        } else {
            this.codeEditorInstance.setValue(s);
            this.codeEditorInstance.update();
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

ProcedureFileEditor.prototype.finish = function () {
    BlockFileEditor.prototype.finish.call(this);
    if (this.codeEditorWrapper) {
        this.codeEditorWrapper.style.display = 'none';
    }

    // Remove Buttons from Header
    if (this.translateBtn && this.translateBtn.parentNode) {
        this.translateBtn.parentNode.removeChild(this.translateBtn);
        this.translateBtn = null;
    }
    if (this.targetIndicator && this.targetIndicator.parentNode) {
        this.targetIndicator.parentNode.removeChild(this.targetIndicator);
        this.targetIndicator = null;
    }
    if (this.headerDivider && this.headerDivider.parentNode) {
        this.headerDivider.parentNode.removeChild(this.headerDivider);
        this.headerDivider = null;
    }
    if (this.targetOptionListener) {
        window.removeEventListener('optionsChanged', this.targetOptionListener);
        this.targetOptionListener = null;
    }
    if (this.stripBtn && this.stripBtn.parentNode) {
        this.stripBtn.parentNode.removeChild(this.stripBtn);
        this.stripBtn = null;
    }
}

ProcedureFileEditor.prototype.updateEditorContent = function (s) {
    if (this.codeEditorInstance) {
        this.codeEditorInstance.setValue(s);
        this.codeEditorInstance.update();
        initialiseForm("sourcecode", s, this);
    } else {
        initialiseForm("sourcecode", s, this);
        var hl = document.getElementById("highlightedcode");
        var sc = document.getElementById("sourcecode");
        if (hl && sc) {
            hl.innerHTML = SyntaxHighlighter.highlight(sc.value);
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

    // Type 2 (Object) does not support source code storage.
    // Return data "as is" (pure object code) to avoid appending source.
    if (this.item.type === 2) {
        return new Uint8Array(chld.data);
    }

    var lncode = chld.data[0] * 256 + chld.data[1];
    var oldlnsrc = chld.data[lncode + 2] * 256 + chld.data[lncode + 3];
    var txt;

    if (this.codeEditorInstance && this.codeEditorContainer && this.codeEditorContainer.style.display !== 'none') {
        txt = this.codeEditorInstance.getValue();
    } else {
        txt = document.getElementById("sourcecode").value;
    }
    // Add 1 for Null Terminator
    var newlnsrc = txt.length + 1;

    var newdata = new Uint8Array(chld.data.length + newlnsrc - oldlnsrc);
    for (var i = 0; i < lncode + 2; i++) {
        newdata[i] = chld.data[i];
    }
    newdata[lncode + 2] = newlnsrc >> 8;
    newdata[lncode + 3] = newlnsrc & 0xff;
    for (var i = 0; i < txt.length; i++) {
        var c = txt.charCodeAt(i)
        newdata[lncode + 4 + i] = c == 10 ? 0 : c;
    }
    // Null Terminator
    newdata[lncode + 4 + txt.length] = 0;

    return newdata;
}
ProcedureFileEditor.prototype.hasUnsavedChanges = function () {
    if (this.item.deleted) return false; // Deleted items: No changes allowed/tracked
    if (BlockFileEditor.prototype.hasUnsavedChanges.call(this)) return true;

    var txt;
    if (this.codeEditorInstance && this.codeEditorContainer && this.codeEditorContainer.style.display !== 'none') {
        txt = this.codeEditorInstance.getValue();
    } else {
        txt = document.getElementById("sourcecode").value;
    }

    if (this.originalSource !== undefined && txt === this.originalSource) return false;

    var chld = this.item.child.child;
    var newdata = this.getProcedureData();
    return !arraysAreEqual(newdata, chld.data);
}
ProcedureFileEditor.prototype.applyChanges = function () {
    var chld = this.item.child.child;
    var newdata = this.getProcedureData();
    var differ = !arraysAreEqual(newdata, chld.data);
    var headerChanged = false;

    // 1. Update Procedure BODY (Code) + Lengths
    if (differ) {
        chld.setData(newdata);
        chld = this.item.child;
        var ln = newdata.length;
        chld.data[2] = (ln >> 8) & 0xff;
        chld.data[3] = ln & 0xff;
    }

    // 2. Update Procedure HEADER (Name) - Manual Fix
    // Extract Name from Source Header: Name: (No PROC)
    var txt = "";
    if (this.codeEditorInstance) txt = this.codeEditorInstance.getValue();
    else txt = document.getElementById("sourcecode").value;

    var firstLine = txt.split('\n')[0].trim();
    // Psion Organiser II Syntax: Name:
    // Name must start with letter, max 8 chars.
    var match = firstLine.match(/^\s*([a-zA-Z][a-zA-Z0-9]{0,7}[%$]?)\s*:/i);
    var newName = (match && match[1]) ? match[1] : null;

    if (newName) {
        // Construct expected header data
        var headerData = new Uint8Array(this.item.data.length);
        headerData.set(this.item.data);
        // Preserve Header Bytes 0,1,10 (ID/Type) - Copying done above

        // Encode new name (8 chars, pad with spaces)
        var encName = (newName + "        ").substr(0, 8);
        for (var i = 0; i < 8; i++) {
            headerData[2 + i] = encName.charCodeAt(i);
        }

        // Check if BYTES are different (regardless of item.name property)
        var headerDiffer = !arraysAreEqual(headerData, this.item.data);

        if (headerDiffer) {
            this.item.setData(headerData);
            this.item.setDescription(); // Update item.name from data
            headerChanged = true;

            // Sync legacy input for safety
            var fnInput = document.getElementById('filename');
            if (fnInput) fnInput.value = newName;
        }
    }

    // Call base just in case it does other things (like deleted flag sync)
    try {
        BlockFileEditor.prototype.applyChanges.call(this);
    } catch (e) { console.warn("Base applyChanges warn:", e); }


    // Trigger Refresh if needed
    if (headerChanged || differ) {
        if (window.updateInventory) {
            window.updateInventory();
        } else if (window.opkedit_refresh_view) {
            window.opkedit_refresh_view();
        } else {
            var event = new CustomEvent('itemRenamed', { detail: { item: this.item } });
            window.dispatchEvent(event);
        }
    }

    return differ || headerChanged;
};

ProcedureFileEditor.prototype.copyObjectCode = function () {
    if (this.item.deleted) return;
    // Check if this is "OPL Text" (Types masked to 3) or uncompiled.
    // Logic: If Type is 3 AND we can't find valid QCode structure, it's Text.
    var hasQCode = false;
    if (this.item.type === 3 && this.item.child && this.item.child.child && this.item.child.child.data) {
        var d = this.item.child.child.data;
        if (d.length >= 4) {
            var len = (d[0] << 8) | d[1];
            if (len > 0) hasQCode = true;
        }
    }

    if (this.item.type === 3 && !hasQCode) {
        alert("This is an OPL Text record (Source only). No Object Code exists to copy.\nPlease Translate it first.");
        return;
    }

    if (!confirm("Are you sure you want to Copy the Object Code?\n\nThis will:\n1. Mark this 'OPL Procedure' as DELETED.\n2. Create a NEW 'OPL Object' record with the same name containing only the translated code.")) return;

    var self = this;
    // 2. Get Object Code (Strict Copy from Existing Record)
    var chld = this.item.child.child;

    // Detect offset: Psion Long Records (02 80) often contain a 'Total Length' word (2 bytes) before the OPL Object.
    // If the first word is 0 or matches the block length, we skip it.
    var offset = 0;
    var firstWord = (chld.data[0] << 8) | chld.data[1];

    if (firstWord === 0 || firstWord === chld.data.length) {
        offset = 2;
    }

    var currentObjLen = (chld.data[offset] << 8) | chld.data[offset + 1];

    // Validate QCode presence
    if (currentObjLen <= 0) {
        alert("This record does not appear to contain any compiled Object Code (QCode). Copy cancelled.");
        return;
    }

    // Safety check for length
    if (currentObjLen > chld.data.length - 2) {
        alert("Warning: Existing object code length seems invalid. Copying safe range.");
        currentObjLen = chld.data.length - 2;
    }

    // Extract BODY ONLY (Skip Size Word). 
    // Range: offset + 2 (Start of Body) to offset + currentObjLen (End of Body).
    // Note: currentObjLen is the value of the size word, which includes itself (2 bytes).
    var objCodeToKeep = chld.data.subarray(offset + 2, offset + currentObjLen);


    // 3. Mark Current Item as DELETED
    // 3. Mark Current Item as DELETED
    this.item.deleted = true; // Flag for UI
    this.item.data[1] &= 0x7F; // Commit to Data (Clear 'Active' bit 0x80)

    // Update UI Checkbox immediately to prevent state mismatch
    var delChk = document.getElementById('deleted');
    if (delChk) delChk.checked = true;

    // Set Editor to Read-Only
    var ta = document.getElementById('sourcecode');
    if (ta) ta.disabled = true;
    if (this.codeEditorInstance) this.codeEditorInstance.setReadOnly(true);
    if (this.translateBtn) this.translateBtn.disabled = true;
    if (this.stripBtn) this.stripBtn.disabled = true;

    // Do NOT mark child items (Block 0x80) as deleted.
    // The File Header (Type 3) 'Deleted' status (0x03) implies the file is deleted.
    // The internal block structure (0x80) must remain intact for the parser to read its length.

    // 4. Create NEW Item (Type 3 OPL Object)
    // Structure: [ObjLen(2) + ObjCode + SrcLen(2=0000)]
    var newTotalSize = 2 + objCodeToKeep.length + 2;
    var newData = new Uint8Array(newTotalSize);

    // ObjLen (Inclusive: Body + 2)
    var finalLen = objCodeToKeep.length + 2;
    newData[0] = (finalLen >> 8) & 0xFF;
    newData[1] = finalLen & 0xFF;

    // ObjCode
    newData.set(objCodeToKeep, 2);

    // SrcLen (0)
    newData[2 + objCodeToKeep.length] = 0;
    newData[2 + objCodeToKeep.length + 1] = 0;

    // Create Item Structure mimicking loader
    // Verify Environment
    // currentPack is not a global variable in the conventional sense in opkedit.js 
    // it's accessed via packs[currentPackIndex].
    // Though opkedit.js has: Object.defineProperty(window, 'currentPack', ...) which SHOULD work if AppStore is active.
    // However, if that is failing, we fallback to packs[currentPackIndex].

    // 4. Delegate to standard createBlockFile (same as 'New OPL Procedure')
    // This ensures consistent hierarchy, ID handling (ID 0), and pack integration.
    if (typeof createBlockFile !== 'function') {
        alert("Error: createBlockFile function not found in global scope.");
        return;
    }

    try {
        createBlockFile(newData, this.item.name, 3);
    } catch (e) {
        alert("Error creating block file: " + e.message);
        return;
    }

    // 5. Force Save to ensure Pack consistency in Storage
    // createBlockFile already calls updateInventory() which debounces save.
    // We force it immediately to prevent corruption via reload-race.
    if (window.saveSession) {
        window.saveSession();
    } else if (window.updateInventory) {
        window.updateInventory();
    }

    alert("Copied Object Code to new record.\nOriginal marked as deleted.");
};

ProcedureFileEditor.prototype.translateAndSave = function () {
    var self = this;
    var source = "";
    if (this.codeEditorInstance) source = this.codeEditorInstance.getValue();
    else source = document.getElementById("sourcecode").value;

    if (window.OPLCompiler) {
        try {
            var options = {};
            if (typeof OptionsManager !== 'undefined') {
                options.targetSystem = OptionsManager.getOption('targetSystem');
            }
            var qcode = window.OPLCompiler.compile(source, options);
            var saveSource = true;
            if (qcode && qcode.length > 0) {

                // Prompt for Type 2 (Object) conversion
                if (self.item.type === 2) {
                    var doConvert = confirm("This is an Object-only record (Type 2).\n\nDo you want to convert it to an OPL Procedure record (Type 3)?\n\nThis will allow the source code to be saved along with the object code.");
                    if (doConvert) {
                        self.item.type = 3;
                    } else {
                        saveSource = false;
                    }
                }

                // Reconstruct Data Block
                var srcBytes = [];
                for (var i = 0; i < source.length; i++) {
                    var c = source.charCodeAt(i);
                    srcBytes.push(c === 10 ? 0 : c);
                }
                srcBytes.push(0);

                var newTotalSize = 2 + qcode.length + 2;
                if (saveSource) {
                    newTotalSize += srcBytes.length;
                }

                var newData = new Uint8Array(newTotalSize);

                // ObjLen
                newData[0] = (qcode.length >> 8) & 0xFF;
                newData[1] = qcode.length & 0xFF;

                // ObjCode
                newData.set(qcode, 2);

                // SrcLen & SrcCode
                var offset = 2 + qcode.length;
                if (saveSource) {
                    newData[offset] = (srcBytes.length >> 8) & 0xFF;
                    newData[offset + 1] = srcBytes.length & 0xFF;
                    newData.set(srcBytes, offset + 2); // Correct offset
                } else {
                    newData[offset] = 0;
                    newData[offset + 1] = 0;
                }

                // Update Item
                self.item.child.child.setData(newData);

                // TYPE PROMOTION: If this was OPL Text (deleted/0x03) or had no QCode, make it Active Procedure (0x83)
                // We must update the type byte to persist this change.
                if (self.item.type === 3) {
                    // Ensure it is marked as Active (0x80 bit set)
                    // PackItem logic: deleted = (tp & 0x80) == 0.
                    // So we want deleted = false.
                    self.item.deleted = false;
                    if (self.item.data && self.item.data.length > 1) {
                        self.item.data[1] = 0x83; // Force Active Procedure type
                    }
                }

                // Update Block Len
                var blockItem = self.item.child;
                var ln = newData.length;
                if (blockItem && blockItem.data && blockItem.data.length >= 4) {
                    blockItem.data[2] = (ln >> 8) & 0xFF;
                    blockItem.data[3] = ln & 0xFF;
                }

                alert("Translated and Saved Successfully!");
                self.refreshDecompilerLog(true);

                // Force UI update to reflect icon change (Text -> Proc)
                if (window.updateInventory) window.updateInventory();
            }
        } catch (e) {
            alert("Translation Error:\n" + e.message);
        }
    } else {
        alert("Translator (Compiler) not found!");
    }
};

// Helper to build a process map (procedure name -> param count) for the decompiler
function buildProcMap() {
    var procMap = {};
    if (window.packs) {
        window.packs.forEach(function (pack) {
            pack.items.forEach(function (item) {
                if (item.type === 3 && !item.deleted && item.child) {
                    // Robust check: Procedure data is usually in item.child.child.data
                    // but we check both levels for resilience.
                    var target = (item.child.child && item.child.child.data) ? item.child.child : (item.child.data ? item.child : null);
                    if (target) {
                        try {
                            var tempDecompiler = new OPLDecompiler();
                            var header = tempDecompiler.parseHeader(target.data, 0);
                            if (header && header.numParams !== undefined) {
                                procMap[item.name.toUpperCase()] = { paramCount: header.numParams };
                            }
                        } catch (e) {
                            console.warn("Failed to parse header for procMap:", item.name, e);
                        }
                    }
                }
            });
        });
    }
    return procMap;
}

ProcedureFileEditor.prototype.refreshDecompilerLog = function (hasSource) {
    if (!window.OPLDecompiler) return;

    var decompilerLogEnabled = (typeof OptionsManager !== 'undefined' && OptionsManager.getOption('showDecompilerLog'));
    var logWindowOpen = (typeof decompilerLogWindow !== 'undefined' && decompilerLogWindow && decompilerLogWindow.element.style.display !== 'none');

    // Run decompiler if:
    // a) No source exists (we need content)
    // b) Log Window is explicitly Open OR the option is Enabled
    if (!hasSource || logWindowOpen || decompilerLogEnabled) {
        try {
            var chld = this.item.child.child;
            var lncode = chld.data[0] * 256 + chld.data[1];
            var objectCode = chld.data.subarray(2, 2 + lncode);
            var procName = (this.item.name || "main").trim();

            // Construct Synthetic Header for Display (User requested header decoding)
            // Header: [09 83] [Name 8] [Term] + [02 80] [RecLen] [TotalLen]
            var nameStr = (procName + "        ").substring(0, 8);
            var headerSize = 11 + 6;
            var totalLen = headerSize + objectCode.length;
            var stampedBuffer = new Uint8Array(totalLen);

            // 09 83 Header
            stampedBuffer[0] = 0x09; // Len
            stampedBuffer[1] = 0x83; // Type
            for (let i = 0; i < 8; i++) stampedBuffer[2 + i] = nameStr.charCodeAt(i);
            stampedBuffer[10] = 0x00; // Term

            // 02 80 Header
            var longRecLen = objectCode.length + 2; // Usually +2 for checksum or something? OPL manual says BlockSize
            // Actually, for 02 80, the headers are:
            // 02 80 [LongRecLen 2] [QCodeTotalLen 2]
            stampedBuffer[11] = 0x02; // Sync
            stampedBuffer[12] = 0x80; // Type
            stampedBuffer[13] = (longRecLen >> 8) & 0xFF;
            stampedBuffer[14] = longRecLen & 0xFF;
            stampedBuffer[15] = (objectCode.length >> 8) & 0xFF; // QCodeTotalLen (often same as objLen)
            stampedBuffer[16] = objectCode.length & 0xFF;

            // Payload
            stampedBuffer.set(objectCode, 17);

            var logOptions = {};
            // Only clear and log if the window is open or we are specifically requested to log
            if (logWindowOpen || decompilerLogEnabled) {
                if (decompilerLogWindow) {
                    decompilerLogWindow.clear();
                    logOptions.logCallback = function (entry) {
                        decompilerLogWindow.log(entry);
                    };
                    // Ensure window is visible if option is enabled
                    if (decompilerLogEnabled) decompilerLogWindow.updateVisibility();
                }
            }

            var decompiler = new OPLDecompiler();
            logOptions.procMap = buildProcMap();
            // Pass the stamped buffer!
            var decompiled = decompiler.decompile(stampedBuffer, procName, logOptions);

            // Return decompiled source if we didn't have any (used in initialise)
            if (!hasSource) {
                // var lines = decompiled.split('\n');
                return decompiled; // Do not trim
            }
        } catch (e) {
            console.error("Decompilation error:", e);
            if (!hasSource) return "REM Error decompiling: " + e.message;
        }
    }
    return null;
};
