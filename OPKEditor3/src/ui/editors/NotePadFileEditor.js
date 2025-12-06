'use strict';

//------------- Notepad file editor --------------------

function NotePadFileEditor(editorelement, codeEditorContainer, callback) {
    BlockFileEditor.call(this, editorelement, callback, [7], codeEditorContainer);
}
NotePadFileEditor.prototype = Object.create(BlockFileEditor.prototype);
NotePadFileEditor.prototype.initialise = function (item) {
    var extraelement = null;
    if (!this.myelement) {
        // create procedure-specific editor
        var extraelement = document.createElement('div');
        extraelement.innerHTML =
            "<form action='#'><fieldset><legend>Notepad</legend>" +
            "<div>Password: <input type='text' id='password'></div>" +
            "<div><input type='checkbox' id='numbered'><label for='numbered'>Numbered</label></div>" +
            "<div><textarea id='notepad' rows=20 cols=60></textarea></div>" +
            "</fieldset></form>";
    }
    BlockFileEditor.prototype.initialise.call(this, item, extraelement);

    // extract data from item and initialise form
    var chld = this.item.child.child;
    var lnheader = chld.data[0] * 256 + chld.data[1];
    var lnnotes = chld.data[lnheader + 2] * 256 + chld.data[lnheader + 3];

    initialiseForm("numbered", (chld.data[2] & 0x80) != 0, this);
    var self = this;
    var pwelemnt = document.getElementById("password");
    pwelemnt.value = "";
    pwelemnt.addEventListener('input', function () { handlePasswordChange.call(self); }, false);

    if (chld.data[3] == 0) {   // Not encrypted
        var s = "";
        for (var i = 0; i < lnnotes; i++) {
            var c = chld.data[lnheader + 4 + i];
            if (c == 0) s += "\n";
            else s += String.fromCharCode(c);
        }
        document.getElementById("notepad").disabled = false;
        initialiseForm("notepad", s, this);
    } else {
        document.getElementById("notepad").disabled = true;
        initialiseForm("notepad", "Encrypted Notepad", this);
    }

    // Custom Code Editor Integration
    if (this.codeEditorContainer) {
        // Hide legacy textarea container
        var legacyTextarea = document.getElementById('notepad');
        if (legacyTextarea) legacyTextarea.style.display = 'none';

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

        var content = (chld.data[3] == 0) ? s : "Encrypted Notepad";
        var isReadOnly = (chld.data[3] != 0);

        // Initialize CodeEditor if not already
        if (!this.codeEditorInstance) {
            this.codeEditorInstance = new CodeEditor(this.codeEditorWrapper, {
                value: content,
                language: 'text',
                readOnly: isReadOnly,
                lineNumbers: OptionsManager.getOption('showLineNumbers'),
                folding: false,
                minimap: { enabled: false },
                theme: ThemeManager.currentTheme
            });

            var self = this;
            this.codeEditorInstance.onChange = function () {
                self.callback(EditorMessage.CHANGEMADE);
            };
        } else {
            this.codeEditorInstance.setValue(content);
            this.codeEditorInstance.setReadOnly(isReadOnly);
            this.codeEditorInstance.update();
        }
    } else {
        // Fallback
        if (this.codeEditorContainer) this.codeEditorContainer.style.display = 'none';
        var legacyTextarea = document.getElementById('notepad');
        if (legacyTextarea) legacyTextarea.style.display = 'block';
    }
}
NotePadFileEditor.prototype.finish = function () {
    BlockFileEditor.prototype.finish.call(this);
    if (this.codeEditorWrapper) {
        this.codeEditorWrapper.style.display = 'none';
    }
}
NotePadFileEditor.prototype.getNotepadData = function () {
    var chld = this.item.child.child;
    var oldlnheader = chld.data[0] * 256 + chld.data[1];
    var oldlnnotes = chld.data[oldlnheader + 2] * 256 + chld.data[oldlnheader + 3];

    var password = document.getElementById("password").value;
    var textarea = document.getElementById("notepad");
    var txt;
    if (this.codeEditorInstance && this.codeEditorContainer && this.codeEditorContainer.style.display !== 'none') {
        txt = this.codeEditorInstance.getValue();
    } else {
        txt = textarea.value;
    }

    // calculate length of data
    var newlnheader = oldlnheader;
    var newlnnotes = oldlnnotes;
    if (!textarea.disabled) {
        if (password != "") newlnheader = 11;
        newlnnotes = txt.length;
    }
    var newdata = new Uint8Array(2 + newlnheader + 2 + newlnnotes);

    // write header
    var nmbd = document.getElementById("numbered").checked;
    newdata[0] = 0;
    newdata[1] = newlnheader;
    newdata[2] = (chld.data[2] & 0x7f) + (nmbd ? 0x80 : 0);
    if (textarea.disabled) {
        // copy rest of header
        for (var i = 1; i < oldlnheader; i++) {
            newdata[2 + i] = chld.data[2 + i];
        }
    } else if (password != "") {
        newdata[3] = 9;
        var passkey = calcNotepadKey(password, true);
        for (var i = 0; i < 9; i++) {
            newdata[4 + i] = passkey[i];
        }
    } else {
        newdata[3] = 0;
    }

    newdata[2 + newlnheader] = (newlnnotes >> 8) & 0xff;
    newdata[3 + newlnheader] = newlnnotes & 0xff;
    if (textarea.disabled) {
        // copy encrypted data
        for (var i = 0; i < newlnnotes; i++) {
            newdata[4 + newlnheader + i] = chld.data[4 + oldlnheader + i];
        }
    } else if (password != "") {
        // store encrypted text
        var passkey = calcNotepadKey(password, false);
        var msg = encodeMessage(passkey, txt);
        for (var i = 0; i < newlnnotes; i++) {
            newdata[4 + newlnheader + i] = msg[i];
        }
    } else {
        // store plain text
        for (var i = 0; i < newlnnotes; i++) {
            var c = txt.charCodeAt(i)
            newdata[4 + newlnheader + i] = c == 10 ? 0 : c;
        }
    }
    return newdata;
}
NotePadFileEditor.prototype.hasUnsavedChanges = function () {
    if (BlockFileEditor.prototype.hasUnsavedChanges.call(this)) return true;

    var chld = this.item.child.child;
    var newdata = this.getNotepadData();
    return !arraysAreEqual(newdata, chld.data);
}
NotePadFileEditor.prototype.applyChanges = function () {
    var chld = this.item.child.child;
    var newdata = this.getNotepadData();
    var differ = !arraysAreEqual(newdata, chld.data);
    if (differ) {
        chld.setData(newdata);
        chld = this.item.child;
        var ln = newdata.length;
        chld.data[2] = (ln >> 8) & 0xff;
        chld.data[3] = ln & 0xff;
    }
    return BlockFileEditor.prototype.applyChanges.call(this) | differ;
}

function handlePasswordChange() {
    var password = document.getElementById("password").value;
    if (password == "") return;
    var outputarea = document.getElementById("notepad");
    if (outputarea.disabled) {
        // notepad is still encrypted. See if current password matches hash
        var passkey = calcNotepadKey(password, true);
        var notepaddata = this.item.child.child.data;
        for (var i = 0; i < 9; i++) {
            if (passkey[i] != notepaddata[4 + i]) return;
        }
        // decode notepad
        passkey = calcNotepadKey(password, false);
        var ln = notepaddata[0] * 256 + notepaddata[1] + 4;
        var s = decodeMessage(passkey, notepaddata, ln);
        outputarea.value = s;
        outputarea.disabled = false;

        // Update CodeEditor if available
        if (this.codeEditorInstance) {
            this.codeEditorInstance.setValue(s);
            this.codeEditorInstance.setReadOnly(false);
        }
    } else {
        // password changed.
        this.callback(EditorMessage.CHANGEMADE);
    }
}
