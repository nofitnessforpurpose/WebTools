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

    // Inject Buttons into Editor Header
    var header = document.getElementById('editor-header');
    if (header) {
        // Cleanup existing toolbars (prevents duplication)
        var existingLeft = document.getElementById('editor-left-tools');
        if (existingLeft) existingLeft.remove();

        var existingRight = document.getElementById('editor-right-tools');
        if (existingRight) existingRight.remove();

        // 1. Left Toolbar (Copy/Paste)
        var leftTools = document.createElement('div');
        leftTools.id = 'editor-left-tools';
        leftTools.style.display = 'inline-flex';
        leftTools.style.alignItems = 'center';
        leftTools.style.marginRight = '10px';

        // Helper to create icon button
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
                var target = null;
                if (document.activeElement && (document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'INPUT')) {
                    target = document.activeElement;
                } else if (self.codeEditorInstance) {
                    target = self.codeEditorInstance.inputLayer;
                    target.focus();
                } else {
                    target = document.getElementById('sourcecode');
                    if (target) target.focus();
                }
                if (target) {
                    if (typeof target.setRangeText === 'function') {
                        var start = target.selectionStart;
                        var end = target.selectionEnd;
                        target.setRangeText(text, start, end, 'end');
                        target.dispatchEvent(new Event('input'));
                    } else {
                        target.value += text;
                        target.dispatchEvent(new Event('input'));
                    }
                }
            }).catch(function (err) {
                console.error("Paste failed:", err);
                alert("Paste failed. Please check browser permissions.");
            });
        });
        if (this.item.deleted) pasteBtn.disabled = true;
        leftTools.appendChild(pasteBtn);

        // Divider
        var div = document.createElement('span');
        div.innerHTML = '|';
        div.style.margin = '0 5px 0 2px';
        div.style.color = 'var(--border-color)';
        div.style.opacity = '0.5';
        leftTools.appendChild(div);

        header.insertBefore(leftTools, header.firstChild);

        // 2. Right Toolbar (Translate/Strip/Target)
        // Group them to ensure margin-left: auto works for the block
        var rightTools = document.createElement('div');
        rightTools.id = 'editor-right-tools';
        rightTools.style.display = 'inline-flex';
        rightTools.style.alignItems = 'center';
        rightTools.style.marginLeft = 'auto'; // Push entire group to right

        // Translate Button
        var btn = document.createElement('button');
        btn.innerHTML = '<i class="fas fa-gears"></i> Translate';
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
        if (this.item.deleted) btn.disabled = true;
        rightTools.appendChild(btn);
        this.translateBtn = btn;

        // Strip Source Button
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
        rightTools.appendChild(stripBtn);
        this.stripBtn = stripBtn;

        // Divider
        var divider = document.createElement('span');
        divider.innerHTML = '|';
        divider.style.margin = '0 10px';
        divider.style.color = 'var(--border-color)';
        divider.style.opacity = '0.5';
        rightTools.appendChild(divider);
        this.headerDivider = divider;

        // Target System Indicator
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
        rightTools.appendChild(targetIndicator);
        this.targetIndicator = targetIndicator;

        // Listener for Sync
        this.targetOptionListener = function (e) {
            if (e.detail && e.detail.key === 'targetSystem') {
                updateTargetLabel();
            }
        };
        window.addEventListener('optionsChanged', this.targetOptionListener);

        header.appendChild(rightTools);

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
            // Check if last byte is null terminator and exclude it
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

    return differ || headerChanged;
};

ProcedureFileEditor.prototype.copyObjectCode = function () {
    // Detect Batch Mode via Global Selection
    var targets = [];
    if (typeof selectedItems !== 'undefined' && selectedItems.length > 0) {
        // Filter for this item OR Type 3 items in selection
        // If the current item is in selection, process WHOLE selection.
        if (selectedItems.indexOf(this.item) !== -1) {
            targets = selectedItems.filter(function (it) { return it.type === 3; });
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
        if (self.processItemCopyObject(targetItem, pack)) {
            successCount++;
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

    // Force Save
    if (window.saveSession) window.saveSession();
    else if (window.updateInventory) window.updateInventory();

    if (!OptionsManager.getOption('suppressConfirmations') && targets.length > 1) {
        alert("Processed " + successCount + " items.");
    }
};

// Helper: Process Single Item (Decoupled from Editor UI)
ProcedureFileEditor.prototype.processItemCopyObject = function (targetItem, pack) {
    if (targetItem.deleted) return false;

    // Check for QCode
    var hasQCode = false;
    if (targetItem.child && targetItem.child.child && targetItem.child.child.data) {
        var d = targetItem.child.child.data;
        if (d.length >= 4) {
            var len = (d[0] << 8) | d[1];
            if (len > 0) hasQCode = true;
        }
    }

    if (!hasQCode) {// 
//         console.warn("Skipping " + targetItem.name + ": No Object Code found.");
        return false;
    }

    var chld = targetItem.child.child;

    // ARCHITECTURE UPDATE (2025-12-28):
    // The OPL Object Length is BIG ENDIAN (Offset 0x0F, 0x10).
    // There is no "Count Byte" or "Padding".
    // e.g. 00 27 ... -> Length 0x0027 (39).

    // 1. Read Object Length (Big Endian)
    var currentObjLen = (chld.data[0] << 8) | chld.data[1];

    if (currentObjLen <= 0) return false;

    // Safety Cap
    if (currentObjLen > chld.data.length - 2) currentObjLen = chld.data.length - 2;

    // Heuristic Check (for trailing garbage)
    var expectedEnd = 2 + currentObjLen; // 2 byte header + body
    var remainingBytes = chld.data.length - expectedEnd;
    var isValid = false;

    if (remainingBytes >= 2) {
        // SrcLen is Big Endian too? Usually LE according to docs, but let's check
        // "Source" usually follows.
        // If remaining is just the terminator 00 00.
        var termword = (chld.data[expectedEnd] << 8) | chld.data[expectedEnd + 1];
        if (termword === 0 && remainingBytes > 2) {// 
//             console.log("Found valid terminator. Truncating garbage.");
            isValid = true;
        } else if (remainingBytes === 2) {
            isValid = true;
        }
    }

    var objCodeToKeep = chld.data.subarray(2, 2 + currentObjLen);

    // Mark Original as Deleted
    targetItem.deleted = true;
    targetItem.data[1] &= 0x7F;

    // Prepare New Data (Big Endian)
    // Structure: [Len High] [Len Low] [Body...] [SrcLen High] [SrcLen Low]
    var finalLen = objCodeToKeep.length;
    var newTotalSize = 2 + finalLen + 2;
    var newData = new Uint8Array(newTotalSize);

    // Write Length (Big Endian)
    newData[0] = (finalLen >> 8) & 0xFF;
    newData[1] = finalLen & 0xFF;

    // Write Body
    newData.set(objCodeToKeep, 2);

    // Write Terminator (00 00)
    newData[2 + finalLen] = 0;
    newData[2 + finalLen + 1] = 0;

    // Search for Existing Active Object Record
    var existingItem = null;
    if (pack && pack.items) {
        for (var i = 0; i < pack.items.length; i++) {
            var it = pack.items[i];
            // Match Name, Type 3, Not Deleted, Not Self
            if (it.type === 3 && !it.deleted && it !== targetItem && it.name === targetItem.name) {
                existingItem = it;
                break;
            }
        }
    }

    if (existingItem) {
        // Update In-Place
        var blkHdrItem = existingItem.child;
        if (blkHdrItem) {
            var dataItem = blkHdrItem.child;
            // Resize if needed (PackItem.setData handles array replacement)
            dataItem.setData(newData);

            // Update Block Header details
            var blocklen = newData.length;
            blkHdrItem.data[2] = (blocklen >> 8) & 0xFF;
            blkHdrItem.data[3] = blocklen & 0xFF;

            pack.unsaved = true;
        }
    } else {
        // Create New
        if (typeof createBlockFile === 'function') {
            createBlockFile(newData, targetItem.name, 3);
        }
    }

    return true;
};

ProcedureFileEditor.prototype.translateAndSave = function () {
    var self = this;

    // Force Save (sync header name)
    this.applyChanges();

    // Determine target items
    var targets = [];
    if (typeof selectedItems !== 'undefined' && selectedItems.length > 1) {
        // Batch Mode: Filter for valid OPL Types (Type 3)
        targets = selectedItems.filter(function (it) { return it.type === 3; });
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

    // Use timeout to allow UI to render status message
    setTimeout(function () {
        targets.forEach(function (targetItem) {
            var sourceCode = "";

            // 1. Get Source
            if (targetItem === self.item) {
                // Active Item: Use Editor Content
                if (self.codeEditorInstance) sourceCode = self.codeEditorInstance.getValue();
                else sourceCode = document.getElementById("sourcecode").value;
            } else {
                // Inactive Item: Extract from Binary
                sourceCode = self.getSourceFromItem(targetItem);
            }

            // 2. Compile & Update
            try {
                var result = self.compileAndSaveItem(targetItem, sourceCode, targetItem === self.item); // Pass 'interactive' flag
                if (result.success) successes++;
                else errors.push(targetItem.name + ": " + result.error);
            } catch (e) {
                errors.push(targetItem.name + ": " + e.message);
            }
        });

        // 3. Update UI & Report
        // Refresh Current Editor Log if it was translated
        if (targets.indexOf(self.item) !== -1) {
            self.refreshDecompilerLog(true);
        }

        if (window.updateInventory) window.updateInventory();

        // Restore Status
        if (statusEl) statusEl.innerText = oldStatus;

        if (!OptionsManager.getOption('suppressConfirmations')) {
            if (errors.length === 0) {
                alert("Translated " + successes + " item(s) successfully!");
            } else {
                alert("Translated " + successes + " item(s).\n\nErrors:\n" + errors.join("\n"));
            }
        }
    }, 20);
};

ProcedureFileEditor.prototype.getSourceFromItem = function (item) {
    if (!item || !item.child || !item.child.child) return "";
    var chld = item.child.child;
    var lncode = (chld.data[0] << 8) | chld.data[1];
    var lnsrc = (chld.data[lncode + 2] << 8) | chld.data[lncode + 3];

    if (lnsrc <= 0) return "";

    // Extract
    var limit = lnsrc;
    // Exclude null terminator
    if (limit > 0 && chld.data[lncode + 4 + limit - 1] === 0) {
        limit--;
    }

    var s = "";
    for (var i = 0; i < limit; i++) {
        var c = chld.data[lncode + 4 + i];
        s += (c === 0 ? "\n" : String.fromCharCode(c));
    }
    return s;
};

ProcedureFileEditor.prototype.compileAndSaveItem = function (targetItem, source, interactive) {
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

    // Type 2 Conversion Check
    if (targetItem.type === 2) {
        if (interactive) {
            var doConvert = true;
            if (!OptionsManager.getOption('suppressConfirmations')) {
                doConvert = confirm("This is an Object-only record (Type 2).\n\nDo you want to convert it to an OPL Procedure record (Type 3)?\n\nThis will allow the source code to be saved along with the object code.");
            }
            if (doConvert) targetItem.type = 3;
            else saveSource = false;
        } else {
            // Batch: Skip conversion? Or assume 3?
            saveSource = false;
        }
    }

    // Reconstruct Data Block
    var srcBytes = [];
    for (var i = 0; i < source.length; i++) {
        var c = source.charCodeAt(i);
        srcBytes.push(c === 10 ? 0 : c);
    }
    // Always append a generic null terminator to ensure the last line/empty line is preserved
    // The loader strips the last byte if it is 0, so this acts as the "sacrificial" terminator.
    srcBytes.push(0);

    var newTotalSize = 2 + qcode.length + 2;
    if (saveSource) newTotalSize += srcBytes.length;

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
        newData.set(srcBytes, offset + 2);
    } else {
        newData[offset] = 0;
        newData[offset + 1] = 0;
    }

    // Update Item
    if (targetItem.child && targetItem.child.child) {
        targetItem.child.child.setData(newData);
    }

    // TYPE PROMOTION
    if (targetItem.type === 3) {
        targetItem.deleted = false;
        if (targetItem.data && targetItem.data.length > 1) {
            targetItem.data[1] = 0x83; // Active
        }
    }

    // Update Block Len (Container)
    var blockItem = targetItem.child;
    var ln = newData.length;
    if (blockItem && blockItem.data && blockItem.data.length >= 4) {
        blockItem.data[2] = (ln >> 8) & 0xFF;
        blockItem.data[3] = ln & 0xFF;
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
                        } catch (e) {// 
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
            console.error("Decompilation error:", e);
            if (!hasSource) return "REM Error decompiling: " + e.message;
        }
    }
    return null;
};
