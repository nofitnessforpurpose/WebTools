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
        if (this.codeEditorInstance) {
            // 
            // console.log("ProcedureFileEditor: Item Deleted. Setting ReadOnly=TRUE");
            this.codeEditorInstance.setReadOnly(true);
        }

        // Also disable filename input if possible (handled in BlockEditor but we can verify)
        var fn = document.getElementById('filename');
        if (fn) fn.disabled = true;
    } else {
        // Essential Fix: Ensure ReadOnly is FALSE for new/active items
        // (Because the editor instance is reused, it might retain previous RO state)
        if (this.codeEditorInstance) {
            // console.log("ProcedureFileEditor: Item Active. Setting ReadOnly=FALSE");
            this.codeEditorInstance.setReadOnly(false);
        }
        var ta = document.getElementById('sourcecode');
        if (ta) ta.disabled = false;
        var fn = document.getElementById('filename');
        if (fn) fn.disabled = false;
    }

    // Inject Buttons into Editor Header (Moved logic to helper)
    this.createToobarButtons();

    // extract data from item and initialise form
    var chld = this.item.child.child;
    var lncode = chld.data[0] * 256 + chld.data[1];
    document.getElementById("objectcode").innerHTML = "" + lncode;

    var lnsrc = chld.data[lncode + 2] * 256 + chld.data[lncode + 3];

    setTimeout(function () {
        var s = "";
        var hasSource = (lnsrc > 0);

        // 1. Extract Existing Source if available
        if (hasSource) {
            var limit = lnsrc;
            if (limit > 0 && chld.data[lncode + 4 + limit - 1] === 0) {
                limit--;
            }
            for (var i = 0; i < limit; i++) {
                var c = chld.data[lncode + 4 + i];
                if (c == 0) s += "\n";
                else s += String.fromCharCode(c);
            }
        }

        // 2. Refresh Decompiler Log
        var decompiledResult = self.refreshDecompilerLog(hasSource);
        if (!hasSource && decompiledResult) {
            s = decompiledResult;
        }

        self.originalSource = s;
        self.updateEditorContent(s);
        // Initial State Check
        self.updateToolbarButtons();
    }, 10);

    var s = "REM Loading...";

    // Custom Code Editor Integration
    if (this.codeEditorContainer) {
        var legacyContainer = document.getElementById('opl-legacy-container');
        if (legacyContainer) legacyContainer.style.display = 'none';

        this.codeEditorContainer.style.display = 'flex';

        if (!this.codeEditorWrapper) {
            this.codeEditorWrapper = document.createElement('div');
            this.codeEditorWrapper.style.flex = '1';
            this.codeEditorWrapper.style.display = 'flex';
            this.codeEditorWrapper.style.overflow = 'hidden';
            this.codeEditorContainer.appendChild(this.codeEditorWrapper);
        }
        this.codeEditorWrapper.style.display = 'flex';

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
                    var match = headerValue.match(/^\s*([a-zA-Z][a-zA-Z0-9]{0,7}[%$]?)\s*:/i);
                    if (match && match[1]) {
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
                self.updateToolbarButtons();
            };
        } else {
            this.codeEditorInstance.setValue(s);
            this.codeEditorInstance.update();
            this.codeEditorInstance.onChange = function () {
                self.callback(EditorMessage.CHANGEMADE);
                self.updateToolbarButtons();
            };
        }

        initialiseForm("sourcecode", s, this);

    } else {
        // Fallback to legacy
        if (this.codeEditorContainer) this.codeEditorContainer.style.display = 'none';
        var legacyContainer = document.getElementById('opl-legacy-container');
        if (legacyContainer) legacyContainer.style.display = 'block';

        initialiseForm("sourcecode", s, this);

        var hl = document.getElementById("highlightedcode");
        var sc = document.getElementById("sourcecode");
        if (hl && sc) {
            hl.innerHTML = SyntaxHighlighter.highlight(sc.value);
            sc.oninput = function () {
                hl.innerHTML = SyntaxHighlighter.highlight(this.value);
                hl.scrollTop = this.scrollTop;
                hl.scrollLeft = this.scrollLeft;
                self.callback(EditorMessage.CHANGEMADE);
                self.updateToolbarButtons();
            };
        }
    }
}

ProcedureFileEditor.prototype.createToobarButtons = function () {
    var self = this;
    var header = document.getElementById('editor-header');
    if (!header) return;

    // Cleanup existing logic...
    var existingLeft = document.getElementById('editor-left-tools');
    if (existingLeft) existingLeft.remove();
    var existingRight = document.getElementById('editor-right-tools');
    if (existingRight) existingRight.remove();

    var leftTools = document.createElement('div');
    leftTools.id = 'editor-left-tools';
    leftTools.style.display = 'inline-flex';
    leftTools.style.alignItems = 'center';
    leftTools.style.marginRight = '10px';

    function createHeaderBtn(iconClass, title, clickHandler) {
        var b = document.createElement('button');
        b.innerHTML = '<i class="' + iconClass + '"></i>';
        b.className = 'icon-btn';
        b.style.background = 'none';
        b.style.border = 'none';
        b.style.color = 'var(--text-color)';
        b.style.cursor = 'pointer';
        b.style.fontSize = '14px';
        b.style.marginRight = '8px';
        b.style.padding = '2px';
        b.title = title;
        b.addEventListener('click', function (e) {
            e.preventDefault();
            clickHandler(e);
        });
        b.addEventListener('mousedown', function (e) { e.preventDefault(); });
        return b;
    }

    // [New] Apply Changes (Save)
    var applyBtn = createHeaderBtn('fas fa-circle-check', 'Apply Changes', function () {
        if (self.item.deleted) return;
        self.applyChanges(); // This triggers UI update/refresh
    });
    if (this.item.deleted) applyBtn.disabled = true;
    leftTools.appendChild(applyBtn);
    this.applyBtn = applyBtn;

    // [New] Discard Changes (Revert)
    var discardBtn = createHeaderBtn('fas fa-undo', 'Discard Changes', function () {
        if (self.item.deleted) return;
        if (confirm("Discard unsaved changes?")) {
            self.updateEditorContent(self.originalSource);
            // Manually trigger reset of toolbar state
            self.updateToolbarButtons();
        }
    });
    // Discard initially disabled if clean
    discardBtn.disabled = true;
    leftTools.appendChild(discardBtn);
    this.discardBtn = discardBtn;

    // Divider
    var div1 = document.createElement('span');
    div1.innerHTML = '|';
    div1.style.margin = '0 10px 0 2px'; // Balanced spacing (Matches ~10px visual gap from prev btn margin)
    div1.style.color = 'var(--border-color)';
    div1.style.opacity = '0.5';
    leftTools.appendChild(div1);


    leftTools.appendChild(createHeaderBtn('far fa-copy', 'Copy the selected text to clipboard', function () {
        document.execCommand('copy');
    }));

    leftTools.appendChild(createHeaderBtn('fas fa-file-export', 'Copy the entire source code to clipboard', function () {
        if (self.codeEditorInstance) {
            var text = self.codeEditorInstance.getValue();
            navigator.clipboard.writeText(text);
        } else {
            var ta = document.getElementById('sourcecode');
            if (ta) navigator.clipboard.writeText(ta.value);
        }
    }));

    var pasteBtn = createHeaderBtn('fas fa-paste', 'Paste text from clipboard at cursor position', function () {
        if (self.item.deleted) return;
        navigator.clipboard.readText().then(function (text) {
            if (!text) return;
            // ... Paste Logic ...
            var target = null;
            if (self.codeEditorInstance) target = self.codeEditorInstance.inputLayer;
            else target = document.getElementById('sourcecode');

            if (target) {
                if (typeof target.setRangeText === 'function') {
                    target.setRangeText(text, target.selectionStart, target.selectionEnd, 'end');
                    target.dispatchEvent(new Event('input'));
                } else {
                    target.value += text;
                    target.dispatchEvent(new Event('input'));
                }
                // Trigger Change
                if (self.codeEditorInstance) self.codeEditorInstance.onChange();
            }
        }).catch(function (e) { console.error(e); });
    });
    if (this.item.deleted) pasteBtn.disabled = true;
    leftTools.appendChild(pasteBtn);

    var div = document.createElement('span');
    div.innerHTML = '|';
    div.style.margin = '0 5px 0 2px';
    div.style.color = 'var(--border-color)';
    div.style.opacity = '0.5';
    leftTools.appendChild(div);

    // [Moved] Translate Button
    var btn = document.createElement('button');
    btn.innerHTML = '<i class="fas fa-gears"></i>';
    btn.className = 'icon-btn';
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
    // Initial Disable check
    if (this.item.deleted) btn.disabled = true;
    leftTools.appendChild(btn);
    this.translateBtn = btn;

    // [Moved] Copy Object Code Button
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
    leftTools.appendChild(stripBtn);
    this.stripBtn = stripBtn;

    // [Moved] Trailing Divider
    var divider = document.createElement('span');
    divider.innerHTML = '|';
    divider.style.margin = '0 10px';
    divider.style.color = 'var(--border-color)';
    divider.style.opacity = '0.5';
    leftTools.appendChild(divider);
    this.headerDivider = divider;

    header.insertBefore(leftTools, header.firstChild);

    // Right Tools (Now only Target Indicator)
    var rightTools = document.createElement('div');
    rightTools.id = 'editor-right-tools';
    rightTools.style.display = 'inline-flex';
    rightTools.style.alignItems = 'center';
    rightTools.style.marginLeft = 'auto';

    // (Buttons moved to Left...)

    var targetIndicator = document.createElement('span');
    targetIndicator.style.marginRight = '5px';
    targetIndicator.style.color = 'var(--text-color)';
    targetIndicator.style.fontSize = '12px';
    targetIndicator.style.opacity = '0.7';
    targetIndicator.title = 'Current Compiler Target';

    var updateTargetLabel = function () {
        var current = OptionsManager.getOption('targetSystem') || 'Standard';
        var label = (current === 'LZ') ? 'LZ Mode' : 'XP Mode';
        var icon = (current === 'LZ') ? 'fa-memory' : 'fa-microchip';
        targetIndicator.innerHTML = '<i class="fas ' + icon + '"></i> ' + label;
    };
    updateTargetLabel();
    rightTools.appendChild(targetIndicator);
    this.targetIndicator = targetIndicator;

    this.targetOptionListener = function (e) {
        if (e.detail && e.detail.key === 'targetSystem') {
            updateTargetLabel();
        }
    };
    window.addEventListener('optionsChanged', this.targetOptionListener);

    header.appendChild(rightTools);
};

ProcedureFileEditor.prototype.updateToolbarButtons = function () {
    var hasChanges = this.hasUnsavedChanges();
    var isDeleted = this.item.deleted;

    if (this.translateBtn) {
        this.translateBtn.disabled = isDeleted || hasChanges;
        this.translateBtn.title = hasChanges ? "Save changes before Translating" : "Translate (Compile Source to Object Code)";
        this.translateBtn.style.opacity = (isDeleted || hasChanges) ? '0.5' : '1';
    }
    if (this.stripBtn) {
        this.stripBtn.disabled = isDeleted || hasChanges;
        this.stripBtn.title = hasChanges ? "Save changes before Copying Object Code" : "Copy Object Code";
        this.stripBtn.style.opacity = (isDeleted || hasChanges) ? '0.5' : '1';
    }

    // New Buttons Logic
    if (this.applyBtn) {
        this.applyBtn.disabled = isDeleted || !hasChanges;
        this.applyBtn.style.opacity = (isDeleted || !hasChanges) ? '0.5' : '1';
    }
    if (this.discardBtn) {
        this.discardBtn.disabled = isDeleted || !hasChanges;
        this.discardBtn.style.opacity = (isDeleted || !hasChanges) ? '0.5' : '1';
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
    // 1. Minimal (Correct) Termination: Ensure one null at end.
    // Users report OPL records require 00 termination.

    // Reconstruct Source Bytes from txt
    var srcBytes = [];
    for (var i = 0; i < txt.length; i++) {
        var c = txt.charCodeAt(i);
        srcBytes.push(c === 10 ? 0 : c);
    }

    // Always append a generic null terminator to ensure the last line/empty line is preserved
    // The loader strips the last byte if it is 0, so this acts as the "sacrificial" terminator.
    srcBytes.push(0);

    var newlnsrc = srcBytes.length;

    var newdata = new Uint8Array(chld.data.length + newlnsrc - oldlnsrc);
    for (var i = 0; i < lncode + 2; i++) {
        newdata[i] = chld.data[i];
    }
    newdata[lncode + 2] = newlnsrc >> 8;
    newdata[lncode + 3] = newlnsrc & 0xff;

    // Copy Source Bytes
    for (var i = 0; i < srcBytes.length; i++) {
        newdata[lncode + 4 + i] = srcBytes[i];
    }

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

    // [New] Update Toolbar Buttons (Re-enable if saved)
    // Sync originalSource to prevent "unsaved changes" warning if text matches saved state
    // (Wait: If we saved, the current text IS the blessed state)
    var txt = "";
    if (this.codeEditorInstance) txt = this.codeEditorInstance.getValue();
    else txt = document.getElementById("sourcecode").value;
    this.originalSource = txt;

    this.updateToolbarButtons();

    return differ || headerChanged;
};

ProcedureFileEditor.prototype.copyObjectCode = function () {
    // Detect Batch Mode via Global Selection
    var targets = [];
    if (typeof selectedItems !== 'undefined' && selectedItems.length > 0) {
        // Filter for this item OR Type 3 items in selection
        // If the current item is in selection, process WHOLE selection.
        if (selectedItems.indexOf(this.item) !== -1) {
            targets = selectedItems.filter(function (it) { return it.type === 3 || it.type === 2; });
        } else {
            targets = [this.item];
        }
    } else {
        targets = [this.item];
    }

    if (targets.length === 0) return;

    if (!OptionsManager.getOption('suppressConfirmations')) {
        var msg = (targets.length === 1) ?
            "Are you sure you want to Copy the Object Code?\n\nThis will:\n1. Mark this 'OPL Procedure' as DELETED.\n2. Create/Update an 'OPL Object' record." :
            "Are you sure you want to Copy the Object Code for " + targets.length + " items?\n\nThis will mark sources as DELETED and create/update Object records.";

        if (!confirm(msg)) return;
    }

    var pack = packs[currentPackIndex];
    var successCount = 0;
    var self = this;

    targets.forEach(function (targetItem) {
        var result = self.processItemCopyObject(targetItem, pack);
        if (result === true || (result && result.success)) {
            successCount++;
        } else {
            // console.error("Copy Object Code Failed for " + targetItem.name + ": ", result);
            if (targets.length === 1) {
                var reason = (result && result.error) ? result.error : "Unknown validation error";
                alert("Failed to copy object code: " + reason);
            }
        }
    });

    // Update UI if current item was processed
    if (this.item.deleted) {
        var delChk = document.getElementById('deleted');
        if (delChk) delChk.checked = true;
        var ta = document.getElementById('sourcecode');
        if (ta) ta.disabled = true;
        if (this.codeEditorInstance) this.codeEditorInstance.setReadOnly(true);
        if (this.translateBtn) this.translateBtn.disabled = true;
        if (this.stripBtn) this.stripBtn.disabled = true;
    }

    // Force Save & Refresh if any success
    if (successCount > 0) {
        if (window.saveSession) window.saveSession();
        // Force generic update
        if (window.updateInventory) window.updateInventory();

        if (!OptionsManager.getOption('suppressConfirmations')) {
            if (targets.length > 1) alert("Processed " + successCount + " items.");
            // For single item, the UI update is feedback enough, or we can toast.
            // Existing behavior was silent success for single item. Keeping it (unless error).
        }
    }
};

// Helper: Process Single Item (Decoupled from Editor UI)
ProcedureFileEditor.prototype.processItemCopyObject = function (targetItem, pack) {
    if (targetItem.deleted) return { success: false, error: "Item is already deleted" };

    // Helper: Parse Record Structure
    function parseRecordStructure(data, itemType) {
        var offset = 0;
        // [Fix] Removed dangerous "Skip leading nulls" loop (Alignment Correction)
        // which caused corruption on Raw/Bare records starting with 00.

        // 1. Try Standard Long Record Header (02 80) - Used by Type 3
        var syncFound = -1;
        for (var i = offset; i < data.length - 1; i++) {
            if (data[i] === 0x02 && data[i + 1] === 0x80) {
                syncFound = i;
                break;
            }
        }

        if (syncFound !== -1) {
            var lenOffset = syncFound + 2;
            if (lenOffset + 1 >= data.length) return { valid: false, error: "Truncated header" };
            var len = (data[lenOffset] << 8) | data[lenOffset + 1];
            return { valid: true, offset: lenOffset, length: len, start: syncFound, type: 'long' };
        }

        // 2. Fallback: Raw / Type 2 Check
        // Check if index 0 is valid BE len 
        if (data.length >= 2) {
            var rawLen = (data[0] << 8) | data[1];
            // If rawLen fits exactly? (Common for imported Type 2 with Len prefix)
            if (rawLen > 0 && (2 + rawLen) <= data.length) {
                return { valid: true, offset: 0, length: rawLen, start: 0, type: 'raw' };
            }
        }

        // 3. Last Resort: Bare Type 2 (Treat All Data as QCode)
        // Only if Type 2 and we have data
        if (itemType === 2 && data.length > 0) {
            return { valid: true, offset: 0, length: data.length, start: 0, type: 'bare' };
        }

        return { valid: false, error: "Sync 02 80 not found and Raw Header check failed" };
    }

    var struct = parseRecordStructure(targetItem.child.data, targetItem.type);
    if (!struct.valid) return { success: false, error: struct.error };

    var chld = targetItem.child;
    var srcData = null;
    var qcodeLen = 0;
    var qcodeOffset = 0;
    var isBare = (struct.type === 'bare');

    if (chld.child && chld.child.data) {
        // Hierarchical (Standard Type 3)
        srcData = chld.child.data;

        // [Fix] Check for Inner Wrapper (Double Wrap) which causes Variable Storage corruption
        // If import wrapped an existing OB3/LongRecord, inner data has 02 80 header.
        var innerStruct = parseRecordStructure(srcData, 0);
        if (innerStruct.valid && innerStruct.type === 'long') {
            qcodeOffset = innerStruct.offset + 2; // Skip LenLen
        } else {
            qcodeOffset = 0;
        }

        if (srcData.length >= qcodeOffset + 2) {
            qcodeLen = (srcData[qcodeOffset] << 8) | srcData[qcodeOffset + 1];
        } else {
            return { success: false, error: "Payload too short (Hierarchical)" };
        }
    } else {
        // Flat or Bare
        srcData = chld.data;
        if (isBare) {
            qcodeLen = srcData.length;
            qcodeOffset = 0;
        } else if (struct.type === 'raw') {
            qcodeLen = struct.length;
            qcodeOffset = struct.offset; // 0 usually
        } else {
            // Long Record Wrapper
            qcodeOffset = struct.offset + 2; // Skip LenLen
            if (qcodeOffset + 1 < srcData.length) {
                qcodeLen = (srcData[qcodeOffset] << 8) | srcData[qcodeOffset + 1];
            } else {
                return { success: false, error: "Payload too short (Flat)" };
            }
        }
    }

    if (qcodeLen <= 0 && !isBare) return { success: false, error: "Object Data Length is 0" };

    // Extract Logic
    var objCodeToKeep;

    if (isBare) {
        // Must synthesize [Len][QCode]
        objCodeToKeep = new Uint8Array(2 + qcodeLen);
        objCodeToKeep[0] = (qcodeLen >> 8) & 0xFF;
        objCodeToKeep[1] = qcodeLen & 0xFF;
        objCodeToKeep.set(srcData.subarray(0, qcodeLen), 2);
    } else {
        // Safety Cap
        var totalNeeded = qcodeOffset + 2 + qcodeLen;
        if (totalNeeded > srcData.length) {
            if (srcData.length - qcodeOffset - 2 < qcodeLen) {
                qcodeLen = srcData.length - qcodeOffset - 2;
                if (qcodeLen < 0) qcodeLen = 0;
            }
        }
        var objectOnlyLen = 2 + qcodeLen;
        objCodeToKeep = srcData.subarray(qcodeOffset, qcodeOffset + objectOnlyLen);
    }

    // Mark Original as Deleted
    targetItem.deleted = true;
    targetItem.data[1] &= 0x7F;

    // Prepare New Data (Type 3 Standard: [QCodeLen][QCode][SrcLen=0][Src=Empty])
    var finalPayloadLen = objCodeToKeep.length + 2;
    var newData = new Uint8Array(finalPayloadLen);

    newData.set(objCodeToKeep, 0);
    newData[objCodeToKeep.length] = 0; // SrcLen High
    newData[objCodeToKeep.length + 1] = 0; // SrcLen Low

    // [Fix] Always Create NEW Record (Append)
    // Do NOT search for existing items by name to update. OPL records are additive.
    // If the user wants to clean up, they can delete old ones.
    if (typeof createBlockFile === 'function') {
        createBlockFile(newData, targetItem.name, 3);
    } else {
        return { success: false, error: "createBlockFile is not a function" };
    }

    return { success: true };
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
                            // 
                            //                             console.warn("Failed to parse header for procMap:", item.name, e);
                        }
                    }
                }
            });
        });
    }
    return procMap;
}

ProcedureFileEditor.prototype.translateAndSave = function () {
    var self = this;

    // [Fix] Do NOT call applyChanges() here.
    // applyChanges() updates the current item in-place (mutating it).
    // Translate should strictly be "Create New + Delete Old".
    // forcing applyChanges() would inject the source into the original Type 2 record before deleting it.
    // this.applyChanges();


    // Determine target items
    var targets = [];
    if (typeof selectedItems !== 'undefined' && selectedItems.length > 1) {
        // Batch Mode: Filter for valid OPL Types (Type 3)
        targets = selectedItems.filter(function (it) { return it.type === 3 || it.type === 2; });
    }

    // Fallback: If no valid multi-selection, target current item
    if (targets.length === 0) {
        targets = [this.item];
    }

    var successes = 0;
    var errors = [];

    // Check Compiler presence once
    if (!window.OPLCompiler) {
        alert("Translator (Compiler) not found!");
        return;
    }

    // Status Bar Feedback
    var statusEl = document.getElementById("status-message");
    var oldStatus = statusEl ? statusEl.innerText : "";
    if (statusEl) statusEl.innerText = "Translating " + targets.length + " items...";

    // [Fix] Remove setTimeout to run synchronous batch loop (matches copyObjectCode behavior)
    // Prevents potential race conditions or closure updates
    // setTimeout(function () { 
    // 

    // console.log("Translate Batch: " + targets.length + " targets.");

    // [Fix] Determine suppressUpdate flag (true for batch mode, false for single item interactive)
    var isBatch = (targets.length > 1);

    targets.forEach(function (targetItem) {
        // 
        // console.log("Processing: " + (targetItem.name || "Unnamed"));
        var sourceCode = "";

        // 1. Get Source
        // 1. Get Source
        // Always read from Item Data (Require "Apply Changes" first)
        // This avoids reading stale #sourcecode or unsaved editor state
        sourceCode = self.getSourceFromItem(targetItem) || self.getDecompiledSource(targetItem);

        // 2. Compile & Update
        try {
            // Pass suppressUpdate=true only for batch mode to prevent UI thrashing
            // interactive flag is (targetItem === self.item)
            var result = self.compileAndSaveItem(targetItem, sourceCode, targetItem === self.item, isBatch);
            if (result.success) successes++;
            else errors.push(targetItem.name + ": " + result.error);
        } catch (e) {
            errors.push(targetItem.name + ": " + e.message);
        }
    });

    // 3. Update UI & Report
    // Only refresh logs/inventory explicitly if we suppressed them (Batch Mode)
    if (isBatch) {
        if (targets.indexOf(self.item) !== -1) {
            self.refreshDecompilerLog(true);
        }
        if (window.updateInventory) window.updateInventory();
    }

    // Restore Status
    if (statusEl) statusEl.innerText = oldStatus;

    if (!OptionsManager.getOption('suppressConfirmations')) {
        if (errors.length === 0) {
            // Only alert for SINGLE item if successful? No, usually translation is silent success for single item editor loop?
            // "Translate" button usually gives feedback.
            // Existing logic gave alert. We Keep it.
            alert("Translated " + successes + " item(s) successfully!");
        } else {
            alert("Translated " + successes + " item(s).\n\nErrors:\n" + errors.join("\n"));
        }
    }
    // }, 20); // Timeout removed
};

ProcedureFileEditor.prototype.getSourceFromItem = function (item) {
    if (!item || !item.child) return "";

    // Determine the actual data buffer (Header vs Nested Payload)
    var data = null;
    var isNested = false;

    if (item.child.child && item.child.child.data) {
        data = item.child.child.data;
        isNested = true;
    } else if (item.child.data) {
        data = item.child.data;
    } else {
        return "";
    }

    // Helper: Detect Endianness (Duplicated from processItemCopyObject - Consider Refactoring)
    // Parse Structure Strict
    var offset = 0;
    while (offset < data.length && data[offset] === 0) offset++;

    var sync = -1;
    // If nested, we don't expect 02 80 header at start of payload usually?
    // Actually, payload is [QCodeLen] [QCode]... so NO 02 80 unless it's a Long Record inside?
    // Standard Type 3 payload is JUST the body.

    // Scan for 02 80
    // [Fix] If isNested, we are already inside the payload. Do NOT scan for 02 80 as it might appear in QCode.
    if (!isNested) {
        for (var i = offset; i < data.length - 1; i++) {
            if (data[i] === 0x02 && data[i + 1] === 0x80) { sync = i; break; }
        }
    }

    // Fallback for Source View if Sync missing (e.g. Raw obj code imported?)
    // Try standard BE read at 0
    var lncode = 0;
    var base = 0;

    // If using Nested Payload, offset should be 0 if no Sync found
    if (sync === -1 && isNested) {
        // Treat as Raw/Body directly
        if (data.length >= 2) {
            lncode = (data[0] << 8) | data[1];
            base = 0;
        } else return "";
    } else {
        // Fallback or Sync Found logic for Flat/Header
        if (sync !== -1) {
            // 02 80 [BodyLen] [QCodeLen] ...
            // We need to skip 02 80 (2 bytes) + BodyLen (2 bytes) = 4 bytes
            if (sync + 5 >= data.length) return "";
            lncode = (data[sync + 4] << 8) | data[sync + 5];
            base = sync + 4;
        } else {
            if (data.length >= 2) {
                lncode = (data[0] << 8) | data[1];
                base = 0; // Assume aligned
            } else return "";
        }
    }

    // Bounds Check
    if (base + 2 > data.length) return "";

    var lnsrcOffset = base + 2 + lncode;
    if (lnsrcOffset + 1 >= data.length) return "";

    // Strict Big Endian Source Length
    var lnsrc = (data[lnsrcOffset] << 8) | data[lnsrcOffset + 1];

    if (lnsrc <= 0) return "";
    var srcStart = lnsrcOffset + 2;

    // Bounds Check for Source Body
    if (srcStart + lnsrc > data.length) {
        // Cap
        lnsrc = data.length - srcStart;
        if (lnsrc <= 0) return "";
    }

    // Extract Source
    var src = "";
    var current = srcStart;

    // Extract Loop
    for (var i = 0; i < lnsrc; i++) {
        var c = data[current + i];
        if (c === 0 && i === lnsrc - 1) continue; // Skip trailing null
        if (c === 0) src += "\n";
        else src += String.fromCharCode(c);
    }

    return src;
};

// [Helper] Decompile Item (Handles Type 2/3 extraction + Header Synthesis)
ProcedureFileEditor.prototype.getDecompiledSource = function (item) {
    if (!item || !window.OPLDecompiler) return "";

    var qcodeBuffer = null;
    var procName = (item.name || "MAIN").trim();

    // 1. Extract Raw QCode Body
    if (item.type === 2) {
        // Type 2: Raw QCode (usually in child.child or child)
        if (item.child && item.child.child && item.child.child.data) {
            qcodeBuffer = item.child.child.data;
        } else if (item.child && item.child.data) {
            qcodeBuffer = item.child.data;
        }
    } else if (item.type === 3) {
        // Type 3: Payload [Len 2] [QCode] [SrcLen 2] [Src]
        // We want just the QCode.
        // Usually located in child.child.data
        var payload = null;
        if (item.child && item.child.child && item.child.child.data) {
            payload = item.child.child.data;
        }

        if (payload && payload.length > 2) {
            var qLen = (payload[0] << 8) | payload[1];
            if (payload.length >= 2 + qLen) {
                qcodeBuffer = payload.subarray(2, 2 + qLen);
            }
        }
    }

    if (!qcodeBuffer) return "";

    // 2. Synthesize Headers for Decompiler
    // Decompiler expects: FileHeader -> RecHeader -> QCode
    try {
        var nameStr = (procName + "        ").substring(0, 8);
        var totalLen = 17 + qcodeBuffer.length;
        var stamped = new Uint8Array(totalLen);

        // 09 83 File Header
        stamped[0] = 0x09; stamped[1] = 0x83;
        for (var k = 0; k < 8; k++) stamped[2 + k] = nameStr.charCodeAt(k);
        stamped[10] = 0x00;

        // 02 80 Record Header
        var longRecLen = qcodeBuffer.length + 2;
        stamped[11] = 0x02; stamped[12] = 0x80;
        stamped[13] = (longRecLen >> 8) & 0xFF;
        stamped[14] = longRecLen & 0xFF;
        stamped[15] = (qcodeBuffer.length >> 8) & 0xFF;
        stamped[16] = qcodeBuffer.length & 0xFF;

        stamped.set(qcodeBuffer, 17);

        var decomp = new window.OPLDecompiler();
        // Use empty procMap to avoid side-effects from dirty pack state
        var analysis = decomp.getRawAnalysis(stamped, procName, { procMap: {} });
        return decomp.sourceGen.generateSource(analysis.header, analysis.varMap, analysis.flow, stamped, analysis.finalProcName, { oplBase: decomp.oplBase });
    } catch (e) {
        // 
        // console.warn("Decompile failed for " + procName, e);
        return "";
    }
};

ProcedureFileEditor.prototype.compileAndSaveItem = function (targetItem, source, interactive, suppressUpdate) {
    // Basic validation
    if (!source) return { success: false, error: "No source code found" };

    var options = {};
    if (typeof OptionsManager !== 'undefined') {
        options.targetSystem = OptionsManager.getOption('targetSystem');
    }
    var qcode = window.OPLCompiler.compile(source, options);

    if (!qcode || qcode.length === 0) {
        return { success: false, error: "Compilation produced no output" };
    }

    var saveSource = true;

    // [Legacy Logic Removed] 
    // We do NOT convert Type 2 records in-place.
    // We always create a NEW Type 3 record and leave the original alone (deleted).

    // Reconstruct Data Block (Strict Long Record Structure)
    var srcBytes = [];
    for (var i = 0; i < source.length; i++) {
        var c = source.charCodeAt(i);
        srcBytes.push(c === 10 ? 0 : c);
    }
    srcBytes.push(0);

    // Calculate Sizes
    // Payload Only: QCodeLen(2) + QCode + SrcLen(2) + Src
    var contentSize = 2 + qcode.length + 2;
    if (saveSource) contentSize += srcBytes.length;

    // newData is Payload Only. createBlockFile will wrap it in 02 80 and add BodyLen.
    var newData = new Uint8Array(contentSize);
    var cursor = 0;

    // 1. QCode Length (Big Endian)
    newData[cursor++] = (qcode.length >> 8) & 0xFF;
    newData[cursor++] = qcode.length & 0xFF;

    // 2. QCode Body
    newData.set(qcode, cursor);
    cursor += qcode.length;

    // 3. Source Length (Big Endian)
    var srcLen = saveSource ? srcBytes.length : 0;
    newData[cursor++] = (srcLen >> 8) & 0xFF;
    newData[cursor++] = srcLen & 0xFF;

    // 4. Source Body
    if (saveSource) {
        newData.set(srcBytes, cursor);
        cursor += srcBytes.length;
    }

    // [Fixed Logic: Non-Destructive Update]
    // 1. Mark Original as Deleted (Status Only)
    // We strictly do NOT modify the original data buffer to avoid "appending" artifacts.
    targetItem.deleted = true;
    if (targetItem.data && targetItem.data.length > 1) {
        targetItem.data[1] &= 0x7F; // Clear Active Bit
    }

    // 2. Create NEW Record
    // This calls PackManager.createBlockFile which always appends a new item.
    // It does not search for existing items or update in-place.
    if (typeof createBlockFile === 'function') {
        // Use original name (will duplicate in list until refresh)
        // [Fix] Always suppress internal update in createBlockFile to prevent race conditions.
        // We will handle UI updates explicitly below.
        var newItem = createBlockFile(newData, targetItem.name, 3, true);

        // [Fix] Explicit update logic
        if (!suppressUpdate) {
            // 1. Refresh Inventory (Visual List)
            if (window.updateInventory) window.updateInventory();

            // 2. Select and Initialize the New Item
            // We use the reference returned by createBlockFile to be 100% sure.
            if (newItem && window.packs && window.packs[window.currentPackIndex]) {
                var idx = window.packs[window.currentPackIndex].items.indexOf(newItem);
                if (idx !== -1) {
                    // This triggers itemSelected -> initialise -> sets this.item = newItem
                    if (window.itemSelected) window.itemSelected(window.currentPackIndex, idx);
                } else {
                    // Fallback if indexOf fails (unlikely)
                    self.initialise(newItem);
                }
            }
        }
    } else {
        // console.error("createBlockFile missing");
    }

    return { success: true };
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
                            // 
                            //                             console.warn("Failed to parse header for procMap:", item.name, e);
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

            // Run Raw Analysis first to get VarMap
            var analysis = decompiler.getRawAnalysis(stampedBuffer, procName, logOptions);

            // Populate Variable Storage Window
            var varStorageEnabled = (typeof OptionsManager !== 'undefined' && OptionsManager.getOption('showVariableStorageWindow'));

            if (typeof variableStorageWindow !== 'undefined' && variableStorageWindow) {
                variableStorageWindow.clear();
                if (varStorageEnabled) {
                    variableStorageWindow.updateVisibility();

                    if (analysis.varMap) {
                        // 1. Synthesize Preamble Layout & Merge
                        // The Preamble contains Pointers to Globals/Params/Externals.
                        // For Params, this IS their stack allocation (2 bytes).
                        // For Globals, the storage is elsewhere, but the Pointer is here.

                        var mergedEntries = [];
                        var mapKeys = Object.keys(analysis.varMap).map(Number);

                        // Helper to find existing varMap entry at a specific offset
                        function findVar(off) {
                            if (analysis.varMap[off]) return analysis.varMap[off];
                            return null;
                        }

                        // A. Global Table Length (-2)
                        mergedEntries.push({
                            offset: -2,
                            size: 2,
                            name: "Table Length",
                            type: "Struct",
                            comment: "Global Variable Name Table Length"
                        });

                        var currentPtrOffset = -4;

                        // B. Global Pointers (Standard OPL Stack Layout: 2 bytes per pointer)
                        // We visualize the Pointer, and show the Definition Data in Comment/Info.

                        // Calculate true Global Table Size (for the FFFE entry)
                        var globalTableSize = 0;
                        if (analysis.globals) {
                            analysis.globals.forEach(g => {
                                globalTableSize += (1 + g.name.length + 1 + 2);
                            });
                            // Fix: Align Global Table to Word Boundary (match Compiler)
                            if (globalTableSize % 2 !== 0) globalTableSize++;
                        }

                        // Update Table Length Entry (Offset -2)
                        // Find and update the previous entry, or pop/push?
                        // mergedEntries is array. The last pushed was FFFE.
                        var tableLenEntry = mergedEntries[mergedEntries.length - 1]; // Assume it's the last one
                        if (tableLenEntry && tableLenEntry.offset === -2) {
                            // Bytes = Hex of Size
                            tableLenEntry.bytes = (globalTableSize).toString(16).toUpperCase().padStart(4, '0');
                        }

                        var numGlobals = (analysis.globals && analysis.globals.length) ? analysis.globals.length : 0;

                        for (var i = 0; i < numGlobals; i++) {
                            var g = analysis.globals[i];
                            var name = g.name;

                            // Resolve 'Real' Offset directly from Global Entry or varMap integration
                            var realOffset = (g.addr !== undefined) ? g.addr : 0;

                            // Pointer Value (Target Address)
                            var targetSigned = (realOffset > 32767) ? realOffset - 65536 : realOffset;
                            var targetHex = ((0x10000 + targetSigned) & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');

                            // Calculate Entry Size: Len(1) + Name(N) + Type(1) + Offset(2)
                            var entrySize = 1 + name.length + 1 + 2;

                            // Construct Hex Bytes for the Entry
                            var hexStr = "";
                            hexStr += (name.length).toString(16).toUpperCase().padStart(2, '0'); // Len
                            for (var k = 0; k < name.length; k++) hexStr += name.charCodeAt(k).toString(16).toUpperCase().padStart(2, '0'); // Name
                            hexStr += (g.type).toString(16).toUpperCase().padStart(2, '0'); // Type
                            hexStr += targetHex; // Offset Word

                            mergedEntries.push({
                                offset: currentPtrOffset,
                                size: entrySize,
                                name: "Global Def " + name,
                                type: "Table Entry",
                                comment: "Points to " + targetHex,
                                bytes: hexStr
                            });
                            currentPtrOffset -= entrySize;
                        }

                        // Alignment: Ensure Params start on Word Boundary
                        if (currentPtrOffset % 2 !== 0) {
                            // Visualize the padding byte? Or just skip.
                            mergedEntries.push({
                                offset: currentPtrOffset,
                                size: 1,
                                name: "Padding",
                                type: "Pad",
                                comment: "Alignment",
                                bytes: "00"
                            });
                            currentPtrOffset--;
                        }

                        // C. Params (Pointers/Values)
                        // This consumes 2 bytes per param on the frame.
                        var numParams = (analysis.numParams) ? analysis.numParams : 0;
                        for (var i = 0; i < numParams; i++) {
                            // Check if analysis found a param at this offset
                            var existing = findVar(currentPtrOffset);

                            if (existing && existing.isParam) {
                                // Found valid param usage
                                var typeStr = existing.type === 0 ? "Int" : existing.type === 1 ? "Flt" : "Str";
                                typeStr += " (Ref)";

                                mergedEntries.push({
                                    offset: currentPtrOffset,
                                    size: 2,
                                    name: existing.name,
                                    type: typeStr,
                                    comment: "Param"
                                });
                            } else {
                                // Unused or assumed param
                                mergedEntries.push({
                                    offset: currentPtrOffset,
                                    size: 2,
                                    name: "P" + (i + 1) + "?",
                                    type: "Unused",
                                    comment: "Param"
                                });
                            }
                            currentPtrOffset -= 2;
                        }

                        // D. External Pointers
                        var numExternals = (analysis.externals && analysis.externals.length) ? analysis.externals.length : 0;
                        for (var i = 0; i < numExternals; i++) {
                            var extName = "External Ptr " + (i + 1);
                            if (analysis.externals && analysis.externals[i]) {
                                extName = analysis.externals[i].name;
                            }

                            mergedEntries.push({
                                offset: currentPtrOffset,
                                size: 2,
                                name: extName,
                                type: "Ptr",
                                comment: "External"
                            });
                            currentPtrOffset -= 2;
                        }

                        // E. Remaining Variables (Storage)
                        // Add anything from varMap that wasn't covered in Preamble ranges.
                        // Preamble covers: [-2 ... currentPtrOffset + 2]
                        // Note: currentPtrOffset has been decremented past the last item.

                        mapKeys.forEach(function (off) {
                            if (off > -2) return; // Ignore above preamble

                            // Check if this offset was already handled in Preamble logic
                            // (Strictly check if we already pushed an entry with this offset)
                            var alreadyAdded = mergedEntries.find(function (e) { return e.offset === off; });
                            if (alreadyAdded) return;

                            // Otherwise, it's a variable (Global Storage, Local, etc.)
                            var info = analysis.varMap[off];
                            var size = 0;
                            var isArray = (info.arrayLen !== undefined);
                            var arrayLen = info.arrayLen || 1;
                            var maxLen = info.maxLen || 255;

                            if (info.type === 0) { // Int
                                if (isArray) size = 2 + (2 * arrayLen);
                                else size = 2;
                            } else if (info.type === 1) { // Flt
                                if (isArray) size = 2 + (8 * arrayLen);
                                else size = 8;
                            } else if (info.type === 2) { // Str
                                var elemSize = 1 + maxLen;
                                if (isArray) size = 2 + (elemSize * arrayLen);
                                else size = 1 + maxLen;
                            }

                            // Format Type String
                            var typeStr = info.type === 0 ? "Int" : info.type === 1 ? "Flt" : "Str";
                            if (info.type === 2) typeStr += "(" + maxLen + ")";
                            if (isArray) typeStr += " Arr[" + arrayLen + "]";

                            // Determine Comment
                            var comment = "";
                            if (info.isParam) comment = "Param (Storage?)";
                            else if (info.isGlobal) comment = "Global";
                            else if (info.isLocal) comment = "Local";
                            else if (info.isExternal) comment = "External";

                            // Generate Default Bytes (Zeros)
                            var byteStr = "";
                            if (size > 0 && size < 2048) {
                                for (var b = 0; b < size; b++) byteStr += "00";
                            }

                            mergedEntries.push({
                                offset: off,
                                size: size,
                                name: info.name,
                                type: typeStr,
                                comment: comment,
                                bytes: byteStr
                            });
                        });

                        // Sort Descending
                        mergedEntries.sort(function (a, b) { return b.offset - a.offset; });

                        // Output
                        mergedEntries.forEach(function (entry) {
                            // Addr: FFFF format (16-bit signed to unsigned)
                            var addrStr;
                            // Check for dummy offsets if any remain (shouldn't with this logic)
                            if (entry.offset <= -90000) {
                                addrStr = "????";
                            } else {
                                var addrVal = (0x10000 + entry.offset) & 0xFFFF;
                                addrStr = addrVal.toString(16).toUpperCase().padStart(4, '0');
                            }

                            var infoStr = entry.name;
                            if (entry.type && entry.type !== "Struct") infoStr += " (" + entry.type + ")";

                            variableStorageWindow.log({
                                addr: addrStr,
                                bytes: entry.bytes || "",
                                info: infoStr,
                                comment: entry.comment
                            });
                        });
                    }
                }
            }

            // Generate source from analysis
            var decompiled = decompiler.sourceGen.generateSource(analysis.header, analysis.varMap, analysis.flow, stampedBuffer, analysis.finalProcName, { ...logOptions, oplBase: decompiler.oplBase });

            // Return decompiled source if we didn't have any (used in initialise)
            if (!hasSource) {
                // var lines = decompiled.split('\n');
                return decompiled; // Do not trim
            }
        } catch (e) {
            // console.error("Decompilation error:", e);
            if (!hasSource) return "REM Error decompiling: " + e.message;
        }
    }
    return null;
};
