'use strict';

//------------- LZ Notepad file editor --------------------

function LZNotepadFileEditor(editorelement, codeEditorContainer, callback) {
    BlockFileEditor.call(this, editorelement, callback, [7], codeEditorContainer);
}
LZNotepadFileEditor.prototype = Object.create(BlockFileEditor.prototype);
LZNotepadFileEditor.prototype.initialise = function (item) {
    if (!this.myelement) {
        var container = document.createElement('div');
        // Maximize container height
        container.style.height = '100%';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.boxSizing = 'border-box'; // Ensure padding doesn't overflow

        // Manual Header Part (Was in BlockFileEditor)
        // Manual Header Part (Was in BlockFileEditor)
        // Manual Header Part (Was in BlockFileEditor)
        // Refined Theme Round 5: Accent colors, nuanced borders/shadows, dimmed text
        // Note: accent-color works for checkboxes in modern browsers
        // Manual Header Part (Was in BlockFileEditor)
        // Refined Theme Round 7: Visibility in Light Mode via class
        var headerHTML =
            "<form action='#'><fieldset class='themed-fieldset' style='margin-bottom: 10px;'><legend style='color: var(--text-color); opacity: 0.7; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;'>Header</legend>" +
            "<div style='display:flex; align-items:center; margin-bottom: 5px;'>" +
            "  <span style='color:var(--text-color); opacity:0.8; margin-right: 5px;'>Record name:</span>" +
            "  <input type='text' id='filename' maxlength='8' class='themed-input' style='font-family:monospace; text-transform:uppercase;'> " +
            "  <span style='font-size:11px; color:var(--text-color); opacity:0.5; margin-left:10px;'>(A-Z start, max 8 chars)</span>" +
            "</div>" +
            "<div style='display:flex; align-items:center;'>" +
            "  <input type='checkbox' id='deleted' class='themed-checkbox' style='margin-right: 5px;'>" +
            "  <label for='deleted' style='color:var(--text-color); opacity:0.8;'>Deleted</label>" +
            "</div>" +
            "</fieldset></form>";

        // Notepad Part
        // Adjusted Styles:
        // - Fieldset: Rounded corners, lighter border
        // - Gaps: Pass/Input gap increased, checkbox gap reduced
        // Notepad Part
        var notepadHTML =
            "<form action='#' style='flex:1; display:flex; flex-direction:column; min-height:0;'><fieldset class='themed-fieldset' style='flex:1; display:flex; flex-direction:column; min-height:0;'><legend style='color: var(--text-color); opacity: 0.7; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;'>Notepad</legend>" +
            "<div style='margin-bottom:10px; display:flex; align-items:center; flex: 0 0 auto;'>" +
            "  <label style='width:auto; margin-right:15px; color:var(--text-color); opacity:0.8;'>Password:</label>" +
            "  <input type='text' id='password' placeholder='Optional' class='themed-input' style='margin-right:30px;'>" +
            "  <div style='display:flex; align-items:center; gap:5px; margin-right:15px; background-color:transparent;'>" +
            "      <input type='checkbox' id='is-encrypted' class='themed-checkbox'><label for='is-encrypted' style='margin:0; color:var(--text-color); opacity:0.8;'>Encrypt</label>" +
            "  </div>" +
            "  <div style='display:flex; align-items:center; gap:5px; background-color:transparent;'>" +
            "      <input type='checkbox' id='numbered' class='themed-checkbox' title='Show line numbers on LZ & in Editor'><label for='numbered' style='margin:0; color:var(--text-color); opacity:0.8;'>Numbered</label>" +
            "  </div>" +
            "</div>" +
            "<div id='notepad-body-helper' style='font-size:12px; margin-bottom:5px; display:none; color:var(--text-color); opacity:0.6;'>Encrypted Content - Enter Password to View</div>" +
            "<div style='flex:1; display:flex; flex-direction:column; min-height:0; border: 1px solid var(--border-color); border-radius: 3px; overflow: hidden;'>" +
            "  <textarea id='notepad' rows=20 cols=60 style='flex:1; font-family:monospace; background-color:var(--bg-color); color:var(--text-color); border:none; padding: 5px; outline: none; resize: none;'></textarea>" +
            "</div>" +
            "</fieldset></form>";

        container.innerHTML = headerHTML + notepadHTML;
        this.myelement = container;
    }
    // Ensure it is attached to the DOM (it might have been cleared by previous editor switch)
    if (this.myelement && this.myelement.parentNode !== this.editorelement) {
        this.editorelement.appendChild(this.myelement);
    }

    // Initialise Header Form State (Was in BlockFileEditor)
    this.item = item;
    // Initialise Header Form State (Was in BlockFileEditor)
    this.item = item;
    // Manual setup for filename to handle validation and blur-only save
    var fnameInput = document.getElementById("filename");
    if (fnameInput) {
        fnameInput.value = item.name;
        fnameInput.addEventListener('change', function () {
            // Validate on blur/commit
            var val = this.value.toUpperCase();
            // Rule: Start with A-Z, max 8 chars, Alphanumeric
            var santized = val.replace(/[^A-Z0-9]/g, '');
            if (!/^[A-Z]/.test(santized)) {
                if (santized.length > 0) santized = "N" + santized; // Prefix if invalid start?
            }
            santized = santized.substring(0, 8);

            if (this.value !== santized) {
                this.value = santized; // Auto-correct in UI
            }
            self.callback(EditorMessage.CHANGEMADE);
        });
    }

    initialiseForm("deleted", item.deleted, this);

    // Initialise UI State
    var self = this;

    // Encrypt Checkbox Handler
    var encCheckbox = document.getElementById("is-encrypted");
    if (encCheckbox) {
        encCheckbox.addEventListener('change', function () {
            // Just toggle state, verify on Save
            self.callback(EditorMessage.CHANGEMADE);
        });
    }

    // Password Handler
    var pwelemnt = document.getElementById("password");
    pwelemnt.value = "";
    // pwelemnt.addEventListener('input', function () { handlePasswordChange.call(self); }, false); // Removed live reload

    var numEl = document.getElementById("numbered");
    if (numEl) {
        var isNum = (this.item.child.child.data[2] & 0x80) != 0;
        numEl.checked = isNum;
        numEl.addEventListener('change', function () {
            var checked = this.checked;
            if (self.codeEditorInstance) {
                self.codeEditorInstance.setShowLineNumbers(checked);
            }
            self.callback(EditorMessage.CHANGEMADE);
        });
    }

    // Decryption / Loading
    this.reloadContent(true);

    // Custom Code Editor Integration
    if (this.codeEditorContainer) {
        var legacyTextarea = document.getElementById('notepad');

        // Hide legacy textarea
        if (legacyTextarea) legacyTextarea.style.display = 'none';

        // We do NOT use the global codeEditorContainer display here, because we want
        // the editor to sit INSIDE the form layout (below the header), not on top of it.
        // this.codeEditorContainer.style.display = 'flex'; // Commented out to prevent global overlay

        // Create wrapper if not exists
        if (!this.codeEditorWrapper) {
            this.codeEditorWrapper = document.createElement('div');
            // Round 8: Apply themed-input style but without padding (handled by editor)
            // This gives it "opacity" (background color) and border definition
            this.codeEditorWrapper.className = 'themed-input-no-padding';
            this.codeEditorWrapper.style.flex = '1';
            this.codeEditorWrapper.style.display = 'flex';
            this.codeEditorWrapper.style.overflow = 'hidden';
            this.codeEditorWrapper.style.minHeight = '0'; // Allow shrinking in flex container to fit available space

            // Attach to the local DOM (sibling/parent of textarea)
            // This ensures it renders within the 'Notepad' fieldset
            if (legacyTextarea && legacyTextarea.parentNode) {
                legacyTextarea.parentNode.appendChild(this.codeEditorWrapper);
            }
        }
        this.codeEditorWrapper.style.display = 'flex';

        // Initial empty state until decrypted
        if (!this.codeEditorInstance) {
            // Determine initial line number state from checkbox (which reflects data flag)
            var showLineNums = false;
            var numCb = document.getElementById('numbered');
            if (numCb) showLineNums = numCb.checked;

            this.codeEditorInstance = new CodeEditor(this.codeEditorWrapper, {
                value: "",
                language: 'text',
                readOnly: true, // Start RO until decrypted
                lineNumbers: showLineNums, // Sync with checkbox/file data
                folding: false,
                minimap: { enabled: false },
                theme: ThemeManager.currentTheme
            });

            // Round 9: Force transparent background on editor to let wrapper's themed style show through
            // This ensures consistency with the .themed-input-no-padding wrapper
            this.codeEditorInstance.container.style.backgroundColor = 'transparent';
            // Round 10: Apply similar transparency to gutter and add separation border
            if (this.codeEditorInstance.gutter) {
                this.codeEditorInstance.gutter.style.backgroundColor = 'transparent';
                this.codeEditorInstance.gutter.style.borderRight = '1px solid var(--border-color)';
            }

            this.codeEditorInstance.onChange = function () {
                self.callback(EditorMessage.CHANGEMADE);
                // Also could enforce chars here if needed
            };
        }

        // Sync content to editor
        this.syncEditorContent();
        // Round 11: Cache baseline data to avoid false positives on "view-only" of non-normalized files
        this.baselineData = this.getNotepadData();
    }
}

LZNotepadFileEditor.prototype.reloadContent = function (initialLoad) {
    var chld = this.item.child.child;
    var lnheader = chld.data[0] * 256 + chld.data[1];
    var lnnotes = chld.data[lnheader + 2] * 256 + chld.data[lnheader + 3];
    var isEncrypted = (lnheader >= 2 && chld.data[3] != 0);

    var fullText = "";
    var isDecrypted = false;

    if (!isEncrypted) {
        // Plain text
        for (var i = 0; i < lnnotes; i++) {
            var c = chld.data[lnheader + 4 + i];
            fullText += (c == 0) ? "\n" : String.fromCharCode(c);
        }
        isDecrypted = true;
    } else {
        fullText = "Encrypted Notepad"; // Placeholder
    }

    // Set Encrypted Checkbox ONLY on initial load to allow user to toggle it for saving
    var encCb = document.getElementById("is-encrypted");
    if (initialLoad && encCb) encCb.checked = isEncrypted;

    // We NO LONGER auto-decrypt based on password here.
    // Decryption is driven by the Checkbox Uncheck event.

    if (isDecrypted) {
        this.displayDecryptedContent(fullText);
    } else {
        // Encrypted State
        this.currentTitle = this.item.name || "********";

        // Try to read title even if encrypted (unencrypted prefix)
        var titleS = "";
        var ptr = lnheader + 4;
        while (ptr < chld.data.length) {
            var c = chld.data[ptr++];
            if (c === 58) break; // Colon
            titleS += String.fromCharCode(c);
            if (titleS.length > 8) break;
        }
        this.currentTitle = titleS;
        this.currentBody = "Encrypted Content";

        document.getElementById("notepad").disabled = true;
        document.getElementById("notepad-body-helper").style.display = 'block';
        this.syncEditorContent();
    }

    // Update specific UI
    var fnInput = document.getElementById("filename");
    if (fnInput) fnInput.value = this.item.name;
}

LZNotepadFileEditor.prototype.displayDecryptedContent = function (fullText) {
    var colonIdx = fullText.indexOf(':');
    if (colonIdx >= 0 && colonIdx <= 8) {
        this.currentTitle = fullText.substring(0, colonIdx);
        this.currentBody = fullText.substring(colonIdx + 1);
        if (this.currentBody.startsWith('\n')) {
            this.currentBody = this.currentBody.substring(1);
        }
    } else {
        this.currentTitle = "UNKNOWN";
        this.currentBody = fullText;
    }

    document.getElementById("notepad").disabled = false;
    document.getElementById("notepad-body-helper").style.display = 'none';

    // Update Filename input to match
    var fnInput = document.getElementById("filename");
    if (fnInput) fnInput.value = this.item.name;

    this.syncEditorContent();
}

LZNotepadFileEditor.prototype.syncEditorContent = function () {
    var isRO = document.getElementById("notepad").disabled;
    if (this.codeEditorInstance) {
        // Only update if changed (Preserves cursor/scroll)
        if (this.codeEditorInstance.getValue() !== this.currentBody) {
            this.codeEditorInstance.setValue(this.currentBody);
        }
        this.codeEditorInstance.setReadOnly(isRO);
        this.codeEditorInstance.update();
    }
}

LZNotepadFileEditor.prototype.finish = function () {
    BlockFileEditor.prototype.finish.call(this);
    if (this.codeEditorWrapper) {
        this.codeEditorWrapper.style.display = 'none';
    }
}

LZNotepadFileEditor.prototype.getNotepadData = function () {
    var title = document.getElementById("filename").value; // Use Record Name
    var password = document.getElementById("password").value;
    var encrypt = document.getElementById("is-encrypted").checked;
    var body = "";

    // Fix: We now always use CodeEditor if it was initialized, as we handle its visibility locally.
    // The previous check for codeEditorContainer.style.display is invalid because we stopped using that container.
    if (this.codeEditorInstance) {
        body = this.codeEditorInstance.getValue();
    } else {
        body = document.getElementById("notepad").value;
    }

    // Validation
    // "Name up to 8 chars... terminating in a colon (auto added)... commence with char A-Z"
    // Regex check
    var titleValid = /^[A-Za-z][A-Za-z0-9]{0,7}$/.test(title);
    if (!titleValid) {
        // Fallback or error?
        // Ideally UI prevents this. If invalid, sanitize?
        // Just strip invalid chars and limit len
        title = title.replace(/[^A-Za-z0-9]/g, '');
        if (title.length === 0) title = "Unk";
        if (!/^[A-Za-z]/.test(title)) title = "N" + title;
        title = title.substring(0, 8);
    }

    // Construct Full Text
    // Title + Colon + \n + Body
    // Wait, ensure Body doesn't start with \n if empty? 
    // Spec: "zero-bytes indicating the end of a line"
    // `encodeMessage` handles `\n` -> `0`.
    // We pass `Title + ":" + "\n" + Body` to encodeMessage?
    // `encodeMessage` logic:
    // `var ix = message.indexOf(":"); ... handle optional unencrypted line break ... if (message.charCodeAt(ix) == 10)`
    // So if we supply `\n` after colon, it writes `0`.

    var fullText = title + ":" + (body.length > 0 ? "\n" + body : "");

    // Encryption Handling
    var chld = this.item.child.child;
    var lnh = chld.data[0] * 256 + chld.data[1];
    var wasEncrypted = (lnh >= 2 && chld.data[3] != 0);

    // Logic: 
    // If we are Decrypting (WasEncrypted=True, Encrypt=False):
    //   We must recover the original text from the FILE, not the Editor (placeholder).

    var encodedData; // Array
    var newlnheader = 11; // Standard header len?

    if (wasEncrypted && !encrypt) {
        // Decrypt Flow
        // Note: Password Validation happened in applyChanges. We assume it's correct/present if we are here via applyChanges.
        // If called via hasUnsavedChanges, we might not have a password?
        // If disable via hasUnsavedChanges, we return "Dummy Plain" which triggers "Differ" -> True.

        var passkey = calcNotepadKey(password, false);
        var ln = chld.data[0] * 256 + chld.data[1] + 4;
        fullText = decodeMessage(passkey, chld.data, ln);

        // Use this fullText for the New Record
        encodedData = [];
        for (var i = 0; i < fullText.length; i++) {
            var c = fullText.charCodeAt(i);
            encodedData.push((c === 10) ? 0 : c);
        }
    } else {
        // Standard Flow (Plain->Plain, Plain->Encrypt, Encrypt->Encrypt)
        // Check if we are in "Placeholder" mode (Encrypted View)
        // If Encrypt->Encrypt and No Password (Preserve), we should probably return ORIGINAL data?
        // But getNotepadData is designed to generate NEW data.

        if (wasEncrypted && encrypt && password === "") {
            // Preserving existing encrypted file without change
            // We return the ORIGINAL data exactly.
            // But we must construct it? Or just return slice?
            // Actually, `newdata` construction below builds a generic record.
            // We can just return `chld.data` copy?
            // Wait, `getNotepadData` signature implies returning constructed byte array.
            // If we return original, we ensure `differ` is false.
            return new Uint8Array(chld.data);
        }

        if (encrypt && password !== "") {
            // Active Encrypt
            var passkey = calcNotepadKey(password, false);
            encodedData = encodeMessage(passkey, fullText);
        } else {
            // Plain
            encodedData = [];
            for (var i = 0; i < fullText.length; i++) {
                var c = fullText.charCodeAt(i);
                encodedData.push((c === 10) ? 0 : c);
            }
        }
    }

    // New Header Construction:
    var newdata = new Uint8Array(2 + newlnheader + 2 + encodedData.length);
    var nmbd = document.getElementById("numbered").checked;

    if (encrypt && password !== "") {
        newlnheader = 11;
    } else {
        newlnheader = 2;
    }

    newdata[0] = (newlnheader >> 8) & 0xff;
    newdata[1] = newlnheader & 0xff;

    // Flags
    newdata[2] = (chld.data[2] & 0x7f) + (nmbd ? 0x80 : 0);

    if (encrypt && password !== "") {
        newdata[3] = 9; // Encrypted Type (or just 9?)
        // Calculate Hash
        var passkey = calcNotepadKey(password, true); // True = Get Hash
        for (var i = 0; i < 9; i++) newdata[4 + i] = passkey[i];
    } else {
        newdata[3] = 0; // Plain Type
        // No hash
    }

    // Data Length
    var dlen = encodedData.length;
    var offset = 2 + newlnheader;
    newdata[offset] = (dlen >> 8) & 0xff;
    newdata[offset + 1] = dlen & 0xff;

    // Data Content
    for (var i = 0; i < dlen; i++) newdata[offset + 2 + i] = encodedData[i];

    return newdata;
}

LZNotepadFileEditor.prototype.hasUnsavedChanges = function () {
    if (BlockFileEditor.prototype.hasUnsavedChanges.call(this)) return true;
    var chld = this.item.child.child;
    var newdata = this.getNotepadData();
    var original = this.baselineData || chld.data;
    return !arraysAreEqual(newdata, original);
}

LZNotepadFileEditor.prototype.applyChanges = function () {
    // Logic to handle decryption/encryption transitions
    var encrypt = document.getElementById("is-encrypted").checked;
    var password = document.getElementById("password").value;

    // Check file state
    var chldBefore = this.item.child.child;
    var lnh = chldBefore.data[0] * 256 + chldBefore.data[1];
    var wasEncrypted = (lnh >= 2 && chldBefore.data[3] != 0);

    // Case 1: Decrypting (Encrypted -> Plain)
    // Validate Password before calling getNotepadData/setData
    if (wasEncrypted && !encrypt) {
        if (password === "") {
            alert("Password required to decrypt.");
            document.getElementById("is-encrypted").checked = true; // Revert
            return false;
        }
        // Verify
        var passkey = calcNotepadKey(password, true);
        var match = true;
        if (chldBefore.data.length < 13) match = false;
        else {
            for (var i = 0; i < 9; i++) {
                if (passkey[i] != chldBefore.data[4 + i]) { match = false; break; };
            }
        }
        if (!match) {
            alert("Incorrect password.");
            document.getElementById("is-encrypted").checked = true; // Revert
            document.getElementById("password").value = "";
            return false;
        }
    }

    // Case 2: Changing Password (Encrypted -> Encrypted with New Password)
    if (wasEncrypted && encrypt && password !== "") {
        // We can only do this if we have the plain text!
        // If the view is the Placeholder, we CANNOT re-encrypt.
        var currentBody = (this.codeEditorInstance) ? this.codeEditorInstance.getValue() : document.getElementById("notepad").value;
        if (currentBody === "Encrypted Content" && document.getElementById("notepad").disabled) {
            alert("To change the password, you must first decrypt the file (Uncheck Encrypt -> Apply).");
            document.getElementById("password").value = "";
            return false;
        }
    }

    var chld = this.item.child.child;
    var newdata = this.getNotepadData();
    var differ = !arraysAreEqual(newdata, chld.data);
    var nameChanged = false;

    if (differ) {
        this.baselineData = newdata;
        chld.setData(newdata);
        chld = this.item.child;
        var ln = newdata.length;
        chld.data[2] = (ln >> 8) & 0xff;
        chld.data[3] = ln & 0xff;

        // Sync Name (Logic: Extract Title from valid data we just saved)

        var title = document.getElementById("filename").value; // Matches Save
        // Validation logic again just to be sure we match saved data?
        title = title.replace(/[^A-Za-z0-9]/g, '');
        if (title.length === 0) title = "Unk";
        if (!/^[A-Z]/.test(title)) title = "N" + title;
        title = title.substring(0, 8);

        if (this.item.name !== title) {
            this.item.name = title;
            this.item.text = title;
            nameChanged = true;
            // Also update legacy filename input if exists
            var fnInput = document.getElementById('filename');
            if (fnInput) fnInput.value = title;
        }
    }

    var baseResult = false;
    try {
        baseResult = BlockFileEditor.prototype.applyChanges.call(this);
    } catch (e) { }

    if (nameChanged) {
        if (window.updateInventory) window.updateInventory();
        else if (window.opkedit_refresh_view) window.opkedit_refresh_view();
    }

    // Clear password if we committed an encryption
    if (encrypt && password !== "") {
        document.getElementById("password").value = "";
    }

    // Refresh view to ensure UI (encryption status, etc) matches the committed binary data
    this.reloadContent(true);

    return baseResult || differ || nameChanged;
}

// function handlePasswordChange() removed
