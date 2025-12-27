'use strict';

function CodeEditor(container, options) {
    this.container = container;
    this.options = options || {};
    this.value = this.options.value || "";
    this.readOnly = this.options.readOnly || false;
    this.language = this.options.language || 'text';
    this.onChange = null;

    this.lines = [];
    this.foldState = {}; // lineIndex -> boolean (true = folded)

    this.init();
}

CodeEditor.prototype = {
    isSplitMode: function () {
        return this._cachedSplitMode;
    },

    init: function () {
        this._cachedSplitMode = this.options.procedureMode && OptionsManager.getOption('stickyProcedureHeader') !== false;
        this.container.innerHTML = '';
        this.container.className = 'code-editor';
        this.container.style.display = 'flex';
        this.container.style.flexDirection = 'column';
        this.container.style.height = '100%'; // Ensure it fills parent

        // Procedure Header Input (Optional)
        if (this.isSplitMode()) {
            this.headerInput = document.createElement('input');
            this.headerInput.type = 'text';
            this.headerInput.className = 'code-header-input';
            this.headerInput.spellcheck = false;
            this.headerInput.placeholder = "PROCname:(params)";
            if (this.readOnly) this.headerInput.readOnly = true;

            // Apply Header Styling
            this.headerInput.style.fontFamily = 'monospace';
            this.headerInput.style.width = '100%';
            this.headerInput.style.border = 'none';
            this.headerInput.style.borderBottom = '1px solid var(--border-color, #444)';
            this.headerInput.style.backgroundColor = 'var(--header-bg-color, #2d2d2d)'; // Distinct formatting
            this.headerInput.style.color = 'var(--text-color, #ccc)';
            // Header Container (Flex Row: Gutter + Input)
            this.headerContainer = document.createElement('div');
            this.headerContainer.className = 'code-header-container';
            this.headerContainer.style.display = 'flex';
            this.headerContainer.style.width = '100%';
            this.headerContainer.style.flex = '0 0 auto'; // Do not grow, do not shrink

            // Header Gutter (Spacer to align with body gutter)
            this.headerGutter = document.createElement('div');
            this.headerGutter.className = 'code-gutter';
            // We want it to just be a spacer, maybe show '1' if we offset body?
            // If body starts at 2, header is 1.
            this.headerGutter.innerHTML = '<div class="gutter-cell"><span class="gutter-line-number">1</span></div>';
            this.headerContainer.appendChild(this.headerGutter);

            this.headerInput = document.createElement('input');
            this.headerInput.type = 'text';
            this.headerInput.className = 'code-header-input';
            this.headerInput.spellcheck = false;
            this.headerInput.placeholder = "PROCname:(params)";
            if (this.readOnly) this.headerInput.readOnly = true;

            // Apply Header Styling
            this.headerInput.style.fontFamily = 'monospace';
            this.headerInput.style.flex = '1'; // Take remaining width
            this.headerInput.style.border = 'none';
            this.headerInput.style.borderBottom = '1px solid var(--border-color, #444)';
            this.headerInput.style.backgroundColor = 'var(--header-bg-color, #2d2d2d)';
            this.headerInput.style.color = 'var(--text-color, #ccc)';
            this.headerInput.style.padding = '2px 4px';
            this.headerInput.style.boxSizing = 'border-box';
            this.headerInput.style.outline = 'none';
            this.headerInput.style.zIndex = '10';

            this.headerContainer.appendChild(this.headerInput);

            this.container.appendChild(this.headerContainer);

            var self = this;
            this.headerInput.addEventListener('input', function () {
                // Auto-Uppercase Header Logic
                if (OptionsManager.getOption('autoUppercaseKeywords')) {
                    var val = this.value;
                    // Use centralized formatting logic
                    var formatted = self.formatHeaderLine(val);

                    if (formatted !== val) {
                        var start = this.selectionStart;
                        var end = this.selectionEnd;
                        this.value = formatted;
                        this.selectionStart = start;
                        this.selectionEnd = end;
                    }
                }

                self.validateHeader();
                self.updateFullTextFromParts();
                if (self.onChange) self.onChange();
                self.updateFullTextFromParts();
                if (self.onChange) self.onChange();
            });

            this.headerInput.addEventListener('blur', function () {
                if (OptionsManager.getOption('autoUppercaseKeywords')) {
                    var val = this.value;
                    var formatted = self.formatHeaderLine(val);
                    if (formatted !== val) {
                        this.value = formatted;
                        self.updateFullTextFromParts();
                        self.update();
                        if (self.onChange) self.onChange();
                    }
                }
            });

            this.headerInput.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    self.inputLayer.focus();
                }
            });

            // Sticky Check
            this.updateStickyHeader();
        }

        // Main Editor Body (Gutter + Content)
        this.bodyContainer = document.createElement('div');
        this.bodyContainer.className = 'code-body-container';
        this.bodyContainer.style.display = 'flex';
        this.bodyContainer.style.flex = '1';
        this.bodyContainer.style.position = 'relative';
        this.bodyContainer.style.overflow = 'hidden'; // Flex child
        this.container.appendChild(this.bodyContainer);

        // Gutter
        this.gutter = document.createElement('div');
        this.gutter.className = 'code-gutter';
        this.bodyContainer.appendChild(this.gutter);

        // Content area
        this.contentArea = document.createElement('div');
        this.contentArea.className = 'code-content';
        this.contentArea.style.flex = '1';
        this.contentArea.style.position = 'relative';
        this.contentArea.style.overflow = 'hidden';
        this.bodyContainer.appendChild(this.contentArea);

        this.contentArea.innerHTML = '';
        this.inputLayer = document.createElement('textarea');
        this.inputLayer.className = 'code-input-area';
        this.inputLayer.style.width = '100%';
        this.inputLayer.style.height = '100%';
        this.inputLayer.style.resize = 'none'; // tailored for custom scroll
        this.inputLayer.style.border = 'none';
        this.inputLayer.style.boxSizing = 'border-box';
        this.inputLayer.spellcheck = false;

        // Initial value handled in setValue
        if (this.readOnly) this.inputLayer.readOnly = true;

        this.fullText = this.value; // Store initial full text
        this.contentArea.appendChild(this.inputLayer);

        // Create a container for the render layer to handle scrolling
        this.renderContainer = document.createElement('div');
        this.renderContainer.className = 'code-render-container';
        this.contentArea.appendChild(this.renderContainer);

        this.renderLayer = document.createElement('pre');
        this.renderLayer.className = 'code-render-area';
        this.renderContainer.appendChild(this.renderLayer);

        var self = this;
        this.inputLayer.addEventListener('input', function () {
            // Safety: If folding is active, we should NOT differ from fullText, but inputLayer is editable.
            // To prevent corruption, we disable editing when folded (handled in update).
            // But if we are here, we are editing.

            // If in procedureMode, this is just the body
            self.updateFullTextFromParts();
            self.update();
            if (self.onChange) self.onChange();
        });

        this.inputLayer.addEventListener('scroll', function () {
            self.renderContainer.scrollTop = this.scrollTop;
            self.renderContainer.scrollLeft = this.scrollLeft;
            self.gutter.scrollTop = this.scrollTop;
        });

        this.inputLayer.addEventListener('keydown', function (e) {
            // Auto Uppercase Logic on Enter
            // Auto Uppercase Logic on Enter OR Space
            if (e.key === 'Enter' || e.key === ' ') {
                if (OptionsManager.getOption('autoUppercaseKeywords')) {
                    // Logic: Allow the key press to happen? 
                    // NO. If we process now, we get "old" text.
                    // If we use 'keyup', we get "new" text with space.
                    // But keyup fires late.
                    // Let's use setTimeout or just formatted + Space/Newline insertion manually.

                    // Actually, on Space, we want to format the *previous* word.
                    // If we format the whole line, we are safe (unless huge line performance).
                    // OPL/CodeEditor lines are short.
                    // Formatting the whole line ensures context (strings/comments).

                    // If key is Space, we want to insert Space AFTER formatting?
                    // Or format, then let default Space happen?
                    // If we replace value `this.value = ...`, we lose the default event action usually?
                    // Or it might just overwrite.

                    e.preventDefault(); // We will manually insert the char + format

                    var charToInsert = (e.key === 'Enter') ? "\n" : " ";
                    var text = this.value;
                    var cursor = this.selectionStart;

                    // Find start/end of current line
                    var lineStart = text.lastIndexOf('\n', cursor - 1) + 1;
                    var lineEnd = text.indexOf('\n', cursor);
                    if (lineEnd === -1) lineEnd = text.length;

                    var currentLine = text.substring(lineStart, cursor); // Text UP TO cursor
                    // Wait, if we are in middle of line?
                    // "print| foo" -> Space -> "PRINT | foo"

                    // Let's get the whole line content to be safe about strings/comments context
                    var fullLineContent = text.substring(lineStart, lineEnd);

                    // Check if this is the Header Line (Line 0 and NOT split mode)
                    var isHeaderLine = (!self.isSplitMode() && lineStart === 0);

                    var formattedLine;
                    if (isHeaderLine) {
                        formattedLine = self.formatHeaderLine(fullLineContent);
                    } else {
                        formattedLine = self.formatLine(fullLineContent);
                    }

                    // Now we have the formatted version of the *current line*.
                    // We need to re-assemble.

                    var left = text.substring(0, lineStart);
                    var right = text.substring(lineEnd);

                    // Where is the cursor relative to line?
                    var relCursor = cursor - lineStart;

                    var formattedLeft = formattedLine.substring(0, relCursor);
                    var formattedRight = formattedLine.substring(relCursor);

                    this.value = left + formattedLeft + charToInsert + formattedRight + right;

                    var newCursorPos = left.length + formattedLeft.length + 1;
                    this.selectionStart = this.selectionEnd = newCursorPos;

                    self.updateFullTextFromParts();
                    self.update();
                    if (self.onChange) self.onChange();
                    return;
                }
            }

            if (e.key === 'Tab') {
                e.preventDefault();
                var start = this.selectionStart;
                var end = this.selectionEnd;
                this.value = this.value.substring(0, start) + "\t" + this.value.substring(end);
                this.selectionStart = this.selectionEnd = start + 1;
                self.updateFullTextFromParts();
                self.update();
                if (self.onChange) self.onChange();
            }
            // Prevent deleting the apparent "first line" (which is now separate) from here? 
            // It's physically separate, so backspace at start of body does nothing naturally. Good.
        });

        // Track cursor line to enforce capitalization when LEAVING the header line (Standard Mode)
        this.lastLineIndex = 0;
        var checkLineChange = function () {
            if (self.isSplitMode()) return; // Split mode handles this via headerInput events
            if (!OptionsManager.getOption('autoUppercaseKeywords')) return;

            var cursor = self.inputLayer.selectionStart;
            var text = self.inputLayer.value;
            // Calculate current line index
            var currentLineIndex = text.substring(0, cursor).split('\n').length - 1;

            // If we moved FROM line 0 TO another line
            if (self.lastLineIndex === 0 && currentLineIndex !== 0) {
                // Apply formatting to Line 0
                var lineEnd = text.indexOf('\n');
                if (lineEnd === -1) lineEnd = text.length;
                var lineContent = text.substring(0, lineEnd);
                var formatted = self.formatHeaderLine(lineContent);

                if (formatted !== lineContent) {
                    var scrollPos = self.inputLayer.scrollTop; // Maintain scroll
                    // Replace Line 0
                    self.value = formatted + text.substring(lineEnd);
                    // Cursor is safe because it is > lineEnd
                    self.inputLayer.value = self.value; // Explicit update

                    // Restore Selection (might have shifted if length changed? Header length usually constant if just case change)
                    // If length changed, we strictly should adjust, but usually OPL header case change is 1:1 length.

                    self.updateFullTextFromParts();
                    self.update();
                    if (self.onChange) self.onChange();
                    self.inputLayer.scrollTop = scrollPos;
                    // Restore selection to where user clicked
                    self.inputLayer.selectionStart = cursor;
                    self.inputLayer.selectionEnd = cursor;
                }
            }
            self.lastLineIndex = currentLineIndex;
        };

        this.inputLayer.addEventListener('mouseup', checkLineChange);
        this.inputLayer.addEventListener('keyup', checkLineChange);


        // Initial setup
        this.setValue(this.value);

        window.addEventListener('themeChanged', function () {
            self.update();
            // Re-apply sticky style/theme if needed
            self.updateStickyHeader();
        });
    },

    validateHeader: function () {
        if (!this.headerInput) return;

        var val = this.headerInput.value;
        // Left justify: Remove leading spaces
        if (val.startsWith(" ")) {
            val = val.trimLeft();
            this.headerInput.value = val;
        }

        // Validate Syntax: PROC <name>:
        // Name: Start with letter, max 8 chars, optional % or $ suffix.
        // Regex Breakdown:
        // ^PROC\s+            -> Starts with PROC and whitespace
        // [a-zA-Z]            -> Name starts with letter
        // [a-zA-Z0-9]{0,7}    -> Up to 7 more alphanumeric chars (Total max 8 for root name)
        // [%$]?               -> Optional type suffix
        // \s*                 -> Optional space
        // :                   -> Colon required
        // .*                  -> Anything after (params), we don't strictly validate params yet but the structure must be there.

        // However, user prompt said: "It must be no longer than 8 characters... followed by a Colon"
        // referring to the PROCEDURE NAME.

        // Strict Regex for OPL II (Psion Organiser II)
        // Syntax: Name: (No PROC keyword)
        // Name must start with letter, max 8 chars, optional %/$ suffix.
        var regex = /^\s*([a-zA-Z][a-zA-Z0-9]{0,7}[%$]?)\s*:.*/i;

        var isValid = regex.test(val);

        if (isValid) {
            this.headerInput.style.backgroundColor = 'var(--header-bg-color, #2d2d2d)';
            this.headerInput.style.borderBottom = '1px solid var(--border-color, #444)';
            this.headerInput.title = "";
        } else {
            // Invalid visual feedback
            this.headerInput.style.backgroundColor = '#4d3800';
            this.headerInput.style.borderBottom = '2px solid #cc8800';
            this.headerInput.title = "Invalid Header. Format: Name:(Params). Name start with letter, max 8 chars.";
        }
    },

    updateStickyHeader: function () {
        if (!this.headerContainer) return;
        var isSticky = OptionsManager.getOption('stickyProcedureHeader');

        // Actually, since we split the DOM, the header is simply placed *before* the scrolling body container.
        // So it is NATURALLY sticky relative to the body content, because the body scrolls independently!
        // The 'stickyProcedureHeader' option in this context effectively means:
        // "Show header separately fixed at top" vs "Header scrolls with text".
        // But if we split inputs, we can't easily make it scroll *with* the text unless we put it INSIDE the scroll container.

        // To support "Not Sticky" (scrolling with text) while using Split Inputs:
        // We would need to move `headerContainer` inside `contentArea`? 
        // Or cleaner: If NOT sticky, we simply treat the first line as part of the textarea?
        // BUT the user wants special validation/no-insert-above rules which are hard in textarea.

        // Alternative: If NOT sticky, we just accept that it matches the user expectation of "Top line fixed" 
        // OR we move the header input into the scrolling/gutter area.

        // Let's implement the specific request: "An Option set in the Options Dialog permits scrolling with the top line fixed or not."
        // Sticky = Fixed at Top.
        // Not Sticky = Scrolls away.

        if (isSticky) {
            // Fixed at top: It's a sibling of bodyContainer.
            if (this.headerContainer.parentNode !== this.container) {
                this.container.insertBefore(this.headerContainer, this.bodyContainer);
            }
            this.headerContainer.style.flexShrink = '0';
        } else {
            // Not sticky: It should scroll with content.
            // Move it inside code-content?
            // This is tricky with double scrollbars or syncing.
            // Simplest hack: Move headerContainer into `contentArea` or `inputLayer` wrapper?
            // Actually, if we put it in `contentArea`, it will flow with text.
            // But we need to sync horizontal scroll.

            // NOTE: Implementing "Non-Sticky" with split inputs is complex.
            // If the user disables sticky, maybe we just keep it fixed? 
            // Or maybe we treat it as sticky always because that's the point of the feature?

            // Let's try to honor it:
            // If !sticky, we prepend it to the render/input container? No, input is textarea.
            // Let's leave it fixed for now as that's the robust "Special Line" implementation.
            // If user demands scrolling, we might need a custom layout.
            // Re-reading: "An Option... permits scrolling wiith the top line fixed or not."
            // Okay, I'll attempt:
            // If Sticky: It is outside the scroller.
            // If Not Sticky: It is inside the scroller?

            // Let's stick (pun intended) to Fixed for this iteration as it ensures the "No Insert Above" rule perfectly.
            // I will default the logic to ALWAYS fixed/split for now to guarantee the editing rules.
            // The option will effectively toggle... nothing visually yet, or maybe I can move it.
        }
    },

    updateFullTextFromParts: function () {
        // Only update from inputLayer if we are NOT folded (or if we trust inputLayer is full)
        // If we are folded, inputLayer.value is partial. We must NOT update fullText from it.
        var hasFolds = Object.keys(this.foldState).length > 0;
        if (hasFolds && OptionsManager.getOption('codeFolding')) {
            return; // Do not corrupt fullText
        }

        if (this.isSplitMode()) {
            var head = this.headerInput.value;
            var body = this.inputLayer.value;
            this.fullText = head + "\n" + body;
        } else {
            this.fullText = this.inputLayer.value;
        }
    },

    setValue: function (val) {
        this.fullText = val;

        if (this.isSplitMode()) {
            // Split first line
            // Ensure we don't have leading blank lines which would make the header empty
            val = val.trimLeft();
            var lines = val.split('\n');
            var first = lines.length > 0 ? lines[0] : "";
            var rest = lines.length > 1 ? lines.slice(1).join('\n') : "";

            this.headerInput.value = first;
            // this.inputLayer.value = rest; // update() will handle this
        } else {
            // this.inputLayer.value = val; // update() will handle this
        }

        this.foldState = {}; // Reset folds
        this.update();
    },

    getValue: function () {
        // Ensure we return combined text
        // If folded, fullText is authoritative.
        // If not folded, we might need to sync if we missed an event (unlikely)
        if (!Object.keys(this.foldState).length && this.isSplitMode()) {
            this.updateFullTextFromParts();
        }
        return this.fullText;
    },

    setReadOnly: function (readOnly) {
        this.readOnly = readOnly;
        this.inputLayer.readOnly = readOnly;
        if (this.headerInput) this.headerInput.readOnly = readOnly;
    },

    update: function () {
        var enableFolding = OptionsManager.getOption('codeFolding');

        // USE FULLTEXT AS SOURCE OF TRUTH
        var textToProcess = this.fullText;
        if (this.isSplitMode()) {
            // In split mode, fullText includes header.
            // But inputLayer/gutter should only reflect the BODY.
            var allLines = textToProcess.split('\n');
            // Remove header line for processing
            if (allLines.length > 0) allLines.shift();
            textToProcess = allLines.join('\n');
        }

        var lines = textToProcess.split('\n');

        // Fold Ranges (relative to body)
        var foldRanges = enableFolding ? this.calculateFoldRanges(lines) : [];

        // Construct Display Text
        var displayText = "";
        var displayLines = [];
        var lineMap = [];

        var skipUntil = -1;
        for (var i = 0; i < lines.length; i++) {
            if (i <= skipUntil) continue;
            if (this.foldState[i] && enableFolding) {
                var range = foldRanges.find(r => r.start === i);
                if (range) {
                    displayText += lines[i] + " ...\n";
                    displayLines.push(lines[i] + " ...");
                    lineMap.push(i);
                    skipUntil = range.end;
                    continue;
                }
            }
            displayText += lines[i] + "\n";
            displayLines.push(lines[i]);
            lineMap.push(i);
        }
        if (displayText.length > 0) displayText = displayText.slice(0, -1);

        // Update Textarea (Body)
        // Logic: 
        // 1. If displayText differs, update it.
        // 2. If folded, set ReadOnly to true to prevent accidental data loss/corruption.
        if (this.inputLayer.value !== displayText) {
            this.inputLayer.value = displayText;
        }

        var hasFolds = Object.keys(this.foldState).length > 0 && enableFolding;
        if (!this.readOnly) {
            this.inputLayer.readOnly = hasFolds;
            // Visual cue?
            this.inputLayer.style.cursor = hasFolds ? 'default' : 'text';
            // Maybe opacity?
            this.inputLayer.style.opacity = hasFolds ? '0.8' : '1.0';
        }

        // Highlight Body
        var highlighted = "";
        var enableSyntaxHighlighting = OptionsManager.getOption('syntaxHighlighting');
        if (this.language === 'opl' && enableSyntaxHighlighting) {
            for (var i = 0; i < displayLines.length; i++) {
                var line = displayLines[i];
                if (line.endsWith(" ...")) {
                    var content = line.substring(0, line.length - 4);
                    var hl = SyntaxHighlighter.highlight(content);
                    if (hl.endsWith('\n')) hl = hl.slice(0, -1);
                    highlighted += hl + '<span class="fold-placeholder"> ...</span>\n';
                } else {
                    var hl = SyntaxHighlighter.highlight(line);
                    if (hl.endsWith('\n')) hl = hl.slice(0, -1);
                    highlighted += hl + '\n';
                }
            }
        } else {
            highlighted = displayText.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        }
        this.renderLayer.innerHTML = highlighted;

        // Update Gutter
        // If procedureMode, we need to offset line numbers by 1?
        // Header is Line 1. Body starts at Line 2.
        var lineOffset = this.isSplitMode() ? 1 : 0;
        this.updateGutter(lines, foldRanges, lineMap, lineOffset);

        this.gutter.scrollTop = this.inputLayer.scrollTop;
    },

    calculateFoldRanges: function (lines) {
        var ranges = [];
        var stack = [];
        var regex = /\b(PROC|ENDP|DO|UNTIL|IF|ENDIF|WHILE|ENDWH)\b/i;

        var matchTypes = {
            'ENDP': 'PROC',
            'UNTIL': 'DO',
            'ENDIF': 'IF',
            'ENDWH': 'WHILE'
        };

        for (var i = 0; i < lines.length; i++) {
            var match = lines[i].match(regex);
            if (match) {
                var kw = match[1].toUpperCase();
                if (kw === 'PROC' || kw === 'DO' || kw === 'IF' || kw === 'WHILE') {
                    stack.push({ start: i, type: kw });
                } else if (matchTypes[kw]) {
                    var expectedType = matchTypes[kw];
                    var matchIndex = -1;
                    for (var j = stack.length - 1; j >= 0; j--) {
                        if (stack[j].type === expectedType) {
                            matchIndex = j;
                            break;
                        }
                    }
                    if (matchIndex >= 0) {
                        var start = stack[matchIndex];
                        ranges.push({ start: start.start, end: i });
                        stack.length = matchIndex;
                    }
                }
            }
        }
        return ranges;
    },

    updateGutter: function (allLines, foldRanges, lineMap, lineOffset) {
        var showLineNumbers = (this.options && this.options.lineNumbers !== undefined) ? this.options.lineNumbers : OptionsManager.getOption('showLineNumbers');
        var enableFolding = OptionsManager.getOption('codeFolding');
        var enableFolding = OptionsManager.getOption('codeFolding');

        this.gutter.innerHTML = '';

        var self = this;
        for (var i = 0; i < lineMap.length; i++) {
            var originalIndex = lineMap[i];
            var range = enableFolding ? foldRanges.find(r => r.start === originalIndex) : null;
            var icon = '';
            // Apply Offset
            var displayNum = originalIndex + 1 + (lineOffset || 0);
            var lineNumStr = showLineNumbers ? displayNum : '';

            if (range) {
                var isFolded = this.foldState[originalIndex];
                icon = isFolded ? '▶' : '▼';
            }

            var cell = document.createElement('div');
            cell.className = 'gutter-cell';

            var numSpan = document.createElement('span');
            numSpan.className = 'gutter-line-number';
            numSpan.textContent = lineNumStr;
            cell.appendChild(numSpan);

            var iconSpan = document.createElement('span');
            iconSpan.className = 'fold-icon';
            iconSpan.textContent = icon;
            if (isFolded) {
                iconSpan.style.fontSize = '10px'; // Smaller relative to normal
                iconSpan.style.verticalAlign = 'middle';
            }
            cell.appendChild(iconSpan);

            if (range) {
                cell.style.cursor = 'pointer';
                (function (index) {
                    cell.addEventListener('click', function () {
                        self.toggleFold(index);
                    });
                })(originalIndex);
            }

            this.gutter.appendChild(cell);
        }
    },

    toggleFold: function (lineIndex) {
        if (this.foldState[lineIndex]) {
            delete this.foldState[lineIndex];
        } else {
            this.foldState[lineIndex] = true;
        }
        this.update();
    },
    setShowLineNumbers: function (enabled) {
        if (!this.options) this.options = {};
        this.options.lineNumbers = enabled;
        this.update();
    },

    formatLine: function (line) {
        // Simple tokenizer to uppercase keywords while respecting strings/comments
        // Based on SyntaxHighlighter logic

        // Ensure map is ready (SyntaxHighlighter might not be init if update() wasn't called)
        if (typeof SyntaxHighlighter !== 'undefined' && !SyntaxHighlighter.keywordMap) {
            SyntaxHighlighter.init();
        }

        if (!line) return "";
        var output = "";
        var j = 0;

        while (j < line.length) {
            var char = line[j];

            // 1. Comment
            if (char === '\'' || (line.substr(j).toUpperCase().startsWith("REM") && (j === 0 || line[j - 1] === ' '))) {
                output += line.substr(j); // Comments unchanged
                break;
            }

            // 2. String
            if (char === '"') {
                var end = line.indexOf('"', j + 1);
                if (end === -1) end = line.length;
                else end++;
                output += line.substring(j, end); // Strings unchanged
                j = end;
                continue;
            }

            // 3. Identifier/Keyword
            if (/[A-Za-z]/.test(char)) {
                // Check if Label (word:) - Don't uppercase labels? User said "Procedure names, Functions (Not REM/Variables)".
                // Procedure headers "PROC foo:" -> "PROC FOO:"
                // Labels "lbl:" -> "LBL:"? No, usually labels are case insensitive but not strictly forced.
                // But keywords MUST be upper.
                // Let's uppercase if it matches a KEYWORD.

                // Extract word
                var match = line.substr(j).match(/^[A-Za-z][A-Za-z0-9]*[\$%&]?/);
                if (match) {
                    var word = match[0];
                    var upper = word.toUpperCase();

                    // Check Keyword
                    var isKeyword = SyntaxHighlighter.keywordMap && SyntaxHighlighter.keywordMap.hasOwnProperty(upper);

                    // Check Procedure Definition "PROC name:"
                    // If word is "PROC", uppercase it.
                    // If previous word was "PROC", uppercase this word too?

                    // Simple Lookbehind approximation:
                    // Check if last token in `output` was "PROC"
                    // Trim output to check end?
                    // Safe bet: If `isKeyword`, uppercase it.
                    // If it follows "PROC", uppercase it.

                    if (isKeyword) {
                        output += upper;
                    } else {
                        // Check for PROC context
                        // Check if `output` ends with "PROC " (ignoring whitespace)
                        // A bit expensive to regex scan back, but line is short.
                        if (/\bPROC\s+$/i.test(output)) {
                            output += upper; // Procedure Name
                        } else {
                            output += word; // Variable/Label (unchanged)
                        }
                    }
                    j += word.length;
                    continue;
                }
            }

            output += char;
            j++;
        }
        return output;
    },

    formatHeaderLine: function (line) {
        if (!line) return "";
        // Header Format: PROCname:(params)  OR  PROC PROCname:(params)
        // We want to uppercase the Procedure Name (and PROC keyword if present).

        // Strategy: Uppercase everything BEFORE the colon.
        // Parameters (after colon) should be left alone (or Standard Keyword Formatting?).

        var colonIndex = line.indexOf(':');
        if (colonIndex === -1) {
            // No colon yet? Just uppercase everything (assuming typing name).
            return line.toUpperCase();
        }

        var beforeColon = line.substring(0, colonIndex);
        var afterColon = line.substring(colonIndex); // Includes colon

        return beforeColon.toUpperCase() + afterColon;
    }
};
