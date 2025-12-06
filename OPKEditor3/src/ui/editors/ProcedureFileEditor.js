'use strict';

//------------- Procedure file editor --------------------

function ProcedureFileEditor(editorelement, codeEditorContainer, callback) {
    BlockFileEditor.call(this, editorelement, callback, [3], codeEditorContainer);
}
ProcedureFileEditor.prototype = Object.create(BlockFileEditor.prototype);
ProcedureFileEditor.prototype.initialise = function (item) {
    var extraelement = null;
    // We still create the legacy element for metadata display
    if (!this.myelement) {
        // create procedure-specific editor
        var extraelement = document.createElement('div');
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

    // extract data from item and initialise form
    var chld = this.item.child.child;
    var lncode = chld.data[0] * 256 + chld.data[1];
    document.getElementById("objectcode").innerHTML = "" + lncode;
    var lnsrc = chld.data[lncode + 2] * 256 + chld.data[lncode + 3];
    var s = "";
    if (lnsrc > 0) {
        for (var i = 0; i < lnsrc; i++) {
            var c = chld.data[lncode + 4 + i];
            if (c == 0) s += "\n";
            else s += String.fromCharCode(c);
        }
    } else if (window.OPLDecompiler) {
        try {
            var objectCode = chld.data.subarray(2, 2 + lncode);
            // Use item name as procedure name, defaulting to 'main' if missing
            var procName = (this.item.name || "main").trim();
            s = window.OPLDecompiler.decompile(objectCode, procName);
            var lines = s.split('\n');
            // OPLDecompiler now handles the header REMs
            s = lines.join('\n');
        } catch (e) {
            s = "REM Error decompiling: " + e.message;
            console.error("Decompilation error:", e);
        }
    } else {
        s = "REM No source code available.";
    }
    this.originalSource = s;

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
        if (!this.codeEditorInstance) {
            this.codeEditorInstance = new CodeEditor(this.codeEditorWrapper, {
                value: s,
                language: 'opl',
                readOnly: false,
                lineNumbers: OptionsManager.getOption('showLineNumbers'),
                folding: OptionsManager.getOption('codeFolding'),
                minimap: { enabled: false },
                theme: ThemeManager.currentTheme
            });

            var self = this;
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
    var lncode = chld.data[0] * 256 + chld.data[1];
    var oldlnsrc = chld.data[lncode + 2] * 256 + chld.data[lncode + 3];

    var txt;
    if (this.codeEditorInstance && this.codeEditorContainer && this.codeEditorContainer.style.display !== 'none') {
        txt = this.codeEditorInstance.getValue();
    } else {
        txt = document.getElementById("sourcecode").value;
    }
    var newlnsrc = txt.length;

    var newdata = new Uint8Array(chld.data.length + newlnsrc - oldlnsrc);
    for (var i = 0; i < lncode + 2; i++) {
        newdata[i] = chld.data[i];
    }
    newdata[lncode + 2] = newlnsrc >> 8;
    newdata[lncode + 3] = newlnsrc & 0xff;
    for (var i = 0; i < newlnsrc; i++) {
        var c = txt.charCodeAt(i)
        newdata[lncode + 4 + i] = c == 10 ? 0 : c;
    }
    return newdata;
}
ProcedureFileEditor.prototype.hasUnsavedChanges = function () {
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
    if (differ) {
        chld.setData(newdata);
        chld = this.item.child;
        var ln = newdata.length;
        chld.data[2] = (ln >> 8) & 0xff;
        chld.data[3] = ln & 0xff;
    }
    return BlockFileEditor.prototype.applyChanges.call(this) | differ;
}
