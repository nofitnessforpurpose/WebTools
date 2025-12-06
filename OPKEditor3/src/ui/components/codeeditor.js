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
    init: function () {
        this.container.innerHTML = '';
        this.container.className = 'code-editor';

        // Gutter
        this.gutter = document.createElement('div');
        this.gutter.className = 'code-gutter';
        this.container.appendChild(this.gutter);

        // Content area
        this.contentArea = document.createElement('div');
        this.contentArea.className = 'code-content';
        this.container.appendChild(this.contentArea);

        this.contentArea.innerHTML = '';
        this.inputLayer = document.createElement('textarea');
        this.inputLayer.className = 'code-input-area';
        this.inputLayer.spellcheck = false;
        this.inputLayer.value = this.value;
        if (this.readOnly) this.inputLayer.readOnly = true;

        this.fullText = this.value;
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
            self.fullText = this.value;
            self.update();
            if (self.onChange) self.onChange();
        });

        this.inputLayer.addEventListener('scroll', function () {
            self.renderContainer.scrollTop = this.scrollTop;
            self.renderContainer.scrollLeft = this.scrollLeft;
            self.gutter.scrollTop = this.scrollTop;
        });

        this.inputLayer.addEventListener('keydown', function (e) {
            if (e.key === 'Tab') {
                e.preventDefault();
                var start = this.selectionStart;
                var end = this.selectionEnd;
                this.value = this.value.substring(0, start) + "\t" + this.value.substring(end);
                this.selectionStart = this.selectionEnd = start + 1;
                self.fullText = this.value;
                self.update();
                if (self.onChange) self.onChange();
            }
        });

        this.update();

        window.addEventListener('themeChanged', function () {
            self.update();
        });
    },

    setValue: function (val) {
        this.fullText = val;
        this.inputLayer.value = val;
        this.foldState = {}; // Reset folds
        this.update();
    },

    getValue: function () {
        return this.fullText;
    },

    setReadOnly: function (readOnly) {
        this.readOnly = readOnly;
        this.inputLayer.readOnly = readOnly;
    },

    update: function () {
        var enableFolding = OptionsManager.getOption('codeFolding');

        // 1. Parse for Fold Ranges
        var lines = this.fullText.split('\n');
        var foldRanges = enableFolding ? this.calculateFoldRanges(lines) : [];

        // 2. Construct Display Text (filtering out folded lines)
        var displayText = "";
        var displayLines = [];
        var lineMap = []; // Maps display line index to original line index

        var skipUntil = -1;
        for (var i = 0; i < lines.length; i++) {
            if (i <= skipUntil) continue;

            if (this.foldState[i] && enableFolding) {
                // This line is the start of a fold
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
        // Remove last newline
        if (displayText.length > 0) displayText = displayText.slice(0, -1);

        // 3. Update Textarea
        if (this.inputLayer.value !== displayText) {
            this.inputLayer.value = displayText;
        }

        // 4. Highlight
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

        // 5. Update Gutter
        this.updateGutter(lines, foldRanges, lineMap);

        // 6. Restore Scroll Position
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
                    // Find matching start in stack (search backwards)
                    var expectedType = matchTypes[kw];
                    var matchIndex = -1;
                    for (var j = stack.length - 1; j >= 0; j--) {
                        if (stack[j].type === expectedType) {
                            matchIndex = j;
                            break;
                        }
                    }

                    if (matchIndex >= 0) {
                        // Found a match. Pop everything up to and including this match.
                        // This handles unclosed inner blocks gracefully.
                        var start = stack[matchIndex];
                        ranges.push({ start: start.start, end: i });
                        stack.length = matchIndex; // Truncate stack
                    }
                }
            }
        }
        return ranges;
    },

    updateGutter: function (allLines, foldRanges, lineMap) {
        var showLineNumbers = OptionsManager.getOption('showLineNumbers');
        var enableFolding = OptionsManager.getOption('codeFolding');

        this.gutter.innerHTML = ''; // Clear existing

        var self = this;
        for (var i = 0; i < lineMap.length; i++) {
            var originalIndex = lineMap[i];
            var range = enableFolding ? foldRanges.find(r => r.start === originalIndex) : null;
            var icon = '';
            var lineNumStr = showLineNumbers ? (originalIndex + 1) : '';

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
    }
};
