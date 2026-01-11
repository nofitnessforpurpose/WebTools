'use strict';

/**
 * OPLFormatter
 * -------------
 * Helper class for formatting (pretty-printing) and minifying OPL source code.
 */
var OPLFormatter = {

    /**
     * Formats OPL code with proper indentation and spacing.
     * @param {string} content - The OPL source code.
     * @param {number} indentSize - Number of spaces per indent level (default 2).
     * @returns {string} The formatted code.
     */
    format: function (content, indentSize) {
        if (!content) return "";
        indentSize = indentSize || 2;
        var indentString = " ".repeat(indentSize);

        var KEYWORDS = [
            'LOCAL', 'GLOBAL', 'EXTERNAL',
            'IF', 'ELSE', 'ELSEIF', 'ENDIF',
            'WHILE', 'ENDWH', 'DO', 'UNTIL',
            'GOTO', 'ONERR', 'TRAP',
            'RETURN', 'STOP', 'BREAK', 'CONTINUE',
            'PRINT', 'LPRINT', 'AT', 'CLS', 'BEEP', 'PAUSE',
            'POKEB', 'POKEW', 'RANDOMIZE', 'CURSOR', 'ESCAPE',
            'APPEND', 'CLOSE', 'COPY', 'CREATE', 'DELETE', 'ERASE',
            'FIRST', 'LAST', 'NEXT', 'BACK', 'OPEN', 'POSITION', 'RENAME', 'UPDATE', 'USE', 'EDIT',
            'ON', 'OFF',
            'RAISE', 'EXT', 'DISP', 'COPYW', 'DELETEW', 'INPUT', 'KSTAT', 'VIEW', 'MENU'
        ];

        var lines = content.split('\n');
        var formattedLines = [];
        var indentLevel = 0;
        var foundFirstCodeLine = false;

        // Simple tokenizer-based formatting is safer, but line-based is easier for BASIC-like langs.
        // We will assume standard OPL structure: 
        // PROC ... ENDP, DO ... UNTIL, WHILE ... ENDWH, IF ... ELSE ... ENDIF
        // We need to handle ignoring keywords inside strings/comments. 
        // Since OPL is line-based largely, we can process line by line but must respect multi-line logic if any? 
        // OPL doesn't have multi-line statements in the C-sense, mostly line-ended.

        for (var i = 0; i < lines.length; i++) {
            var originalLine = lines[i].trim();
            if (!originalLine) {
                formattedLines.push("");
                continue;
            }

            // Check for Comments first to avoid formatting inside them? 
            // Although we want to indent comments too.
            // Be careful not to match keywords inside comments/strings.
            // Simplified approach: Split line into Code and Comment parts.

            var upperLine = originalLine.toUpperCase();
            var codePart = originalLine;
            var commentPart = "";
            var remIndex = -1;

            // Simple REM check (careful of strings with REM inside?)
            // We'll trust the user writes sane OPL for now or use a basic string skipper.
            // Let's do a robust split if possible. 
            // Actually, OPL `REM` is the only comment.
            // Check if REM is tokenized. 

            // Heuristic for indent change BEFORE the line (Start of block closing)
            var preDedent = false;
            var postIndent = false;

            // Check for keywords at START of line (after label?)
            // Labels end with ':' usually.

            // We want to format spacing too: "a=b+1" -> "a = b + 1"
            // That's complex to do safely without a parser. 
            // Let's stick to Indentation for "Pretty Print" as primary goal + basic operator spacing if possible.
            // The prompt said: "x spaces per indent and spaces arount eqaulity, mathmatics etc."

            // --- Spacing Logic ---
            // Simple replace for common operators, assuming they are not in strings.
            // To be safe we should masking strings.
            var maskedLine = this._maskStrings(codePart); // Helper to mask strings
            var processedLine = codePart;

            // Only apply spacing if NOT a REM line (or Apply to code part before REM)
            if (!maskedLine.trim().startsWith("REM")) {
                // Apply spacing to operators: =, +, -, *, /
                // Be careful with >=, <=, <>, **.
                // We should substitute composite operators first to placeholders, then do singles, then restore?
                // Or just regex with spaces?
                // e.g. /([^\s=<>!])(=)([^\s=])/ -> "$1 = $3" ? 
                // This is risky without full lexer. 
                // Let's do a best-effort "safe" spacing.

                // Let's apply indentation rules first.
            }

            // --- Indentation Logic ---
            // Keywords that END blocks (Dedent before print)
            if (this._startsWithKeyword(maskedLine, "ENDP") ||
                this._startsWithKeyword(maskedLine, "ENDWH") ||
                this._startsWithKeyword(maskedLine, "ENDIF") ||
                this._startsWithKeyword(maskedLine, "UNTIL") ||
                this._startsWithKeyword(maskedLine, "ELSE") ||
                this._startsWithKeyword(maskedLine, "ELSEIF")) {
                indentLevel--;
            }

            // Special Rule: First line (Procedure Def) always starts at indent 0
            var isFirstCodeLine = false;
            if (!foundFirstCodeLine) {
                foundFirstCodeLine = true;
                isFirstCodeLine = true;
                indentLevel = 0;
            }

            if (indentLevel < 0) indentLevel = 0;

            // Construct line
            var currentIndent = " ".repeat(indentLevel * indentSize);

            // Refine Spacing if requested (Assignment, Math)
            // We will attempt to add spaces around `=` if not present.
            // Avoiding strings is hard. 
            // Let's implement a basic `_formatSpacing(line)` method that skips strings.
            var spacedLine = this._formatSpacing(originalLine, KEYWORDS);

            // Blank Line BEFORE IF?
            if (this._startsWithKeyword(maskedLine, "IF")) {
                if (formattedLines.length > 0 && formattedLines[formattedLines.length - 1].trim() !== "") {
                    // Check if previous line was ELSE/ELSEIF/IF (nested?)? Usually we want blank before IF block.
                    if (!this._startsWithKeyword(this._maskStrings(lines[i - 1] || ""), "ELSE") &&
                        !this._startsWithKeyword(this._maskStrings(lines[i - 1] || ""), "ELSEIF")) {
                        formattedLines.push("");
                    }
                }
            }

            formattedLines.push(currentIndent + spacedLine);

            // Blank Line AFTER ENDIF, ENDWH, UNTIL?
            // Refined: Check if line CONTAINS these ending keywords (e.g. single line IF ... ENDIF)
            // AND ensure we don't double-insert if the next line is already blank.
            if (/\bENDIF\b/i.test(maskedLine) ||
                /\bENDWH\b/i.test(maskedLine) ||
                /\bUNTIL\b/i.test(maskedLine)) {
                if (i + 1 < lines.length && lines[i + 1].trim() !== "") {
                    formattedLines.push("");
                }
            }

            // Blank Line AFTER LOCAL/GLOBAL block?
            // If current is LOCAL or GLOBAL
            if (this._startsWithKeyword(maskedLine, "LOCAL") || this._startsWithKeyword(maskedLine, "GLOBAL")) {
                // Check next line
                var nextLine = (i + 1 < lines.length) ? lines[i + 1].trim() : "";
                var nextMasked = this._maskStrings(nextLine).toUpperCase();
                // If next line is NOT Local/Global and NOT empty
                if (!this._startsWithKeyword(nextMasked, "LOCAL") &&
                    !this._startsWithKeyword(nextMasked, "GLOBAL") &&
                    nextLine !== "") {
                    formattedLines.push("");
                }
            }

            // Keywords that START blocks (Indent after print)
            // Refined: Check if block CLOSES on the same line. If so, do NOT increment indent.
            if (isFirstCodeLine || // Implicit PROC start at first code line
                (this._startsWithKeyword(maskedLine, "DO") && !/\bUNTIL\b/i.test(maskedLine)) ||
                (this._startsWithKeyword(maskedLine, "WHILE") && !/\bENDWH\b/i.test(maskedLine)) ||
                (this._startsWithKeyword(maskedLine, "IF") && !/\bENDIF\b/i.test(maskedLine)) ||
                this._startsWithKeyword(maskedLine, "ELSE") ||
                this._startsWithKeyword(maskedLine, "ELSEIF")) {

                // Check valid block start
                // IF: check if it ends with THEN (multiline) or implies block?
                // OPL: "IF cond" (newline) is block. "IF cond ... ENDIF" on one line is NOT valid usually? 
                // Actually "IF x PRINT y ENDIF" is valid?
                // Standard OPL: "IF condition" (newline) ... "ENDIF"
                // If the line ENDS with the condition, it's a block.
                // If it has commands after it on same line, it might be single line?
                // Actually OPL `IF` is strictly block-based in older versions?
                // Let's assume block unless it looks clearly single-line (if that exists).

                indentLevel++;
            }
        }

        return formattedLines.join('\n');
    },

    /**
     * Minifies OPL code by removing non-essential whitespace.
     * @param {string} content 
     * @returns {string}
     */
    minify: function (content) {
        if (!content) return "";
        var lines = content.split('\n');
        var minifiedLines = [];

        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (!line) continue; // Skip empty lines

            // Remove internal extra spaces
            // "a  =  b" -> "a=b"
            // We need to preserve strings/comments.

            var minified = this._minifyLine(line);
            minifiedLines.push(minified);
        }

        return minifiedLines.join('\n');
    },

    /**
     * Removes all comments (REM) from the content.
     * @param {string} content 
     * @returns {string}
     */
    removeComments: function (content) {
        if (!content) return "";
        var lines = content.split('\n');
        var cleanLines = [];

        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            var trimmed = line.trim();
            if (!trimmed) {
                cleanLines.push(line);
                continue;
            }

            // Simple REM check? We need to ignore REM inside strings.
            // Logic: Scan line character by character (or Use regex with string capture).

            // Regex approach:
            // Match strings "..." OR matches REM ...
            // If match is string, keep it. If match is REM, discard.
            // Regex: /(".*?"|REM.*)/gi  (Warning: ".*?" is non-greedy, but quotes might contain escaped quotes? OPL doesn't have escaped quotes usually, just double quotes " "").

            var parts = line.split('"');
            var newLine = "";
            var hasCode = false;

            for (var j = 0; j < parts.length; j++) {
                var segment = parts[j];
                if (j % 2 === 1) {
                    // Inside String - Keep everything
                    newLine += '"' + segment + '"';
                } else {
                    // Outside String - Check for REM
                    var remIndex = segment.toUpperCase().indexOf("REM");
                    if (remIndex !== -1) {
                        // Found REM.
                        // Add only the part BEFORE REM
                        var beforeRem = segment.substring(0, remIndex);
                        newLine += beforeRem;
                        // Stop processing this line (comment consumes rest)
                        break;
                    } else {
                        newLine += segment;
                    }
                }
            }

            // Post-process newLine
            // If the resulting line is effectively empty (only whitespace), and the ORIGINAL line had content (it was just a comment line), 
            // the requirement says: "if on the left most of a line removes the comment line."
            // "if on the left most" means "if the comment started the line".

            // Let's check if the trimmed result is empty.
            if (!newLine.trim()) {
                // The line is now empty. Was it a comment-only line?
                // Yes, because we stripped REM.
                // Requirement: "removes the comment line". So do NOT push to cleanLines.
                // BUT, what if it was ALREADY empty? We preserved that at the top.
                // So if it's now empty, we drop it.
            } else {
                // If we stripped a trailing comment, there might be trailing whitespace.
                // Requirement says "removes all comments".
                // Usually we trimRight? Let's trimRight safely.
                cleanLines.push(newLine.trimEnd());
            }
        }

        return cleanLines.join('\n');
    },

    // --- Helpers ---

    _maskStrings: function (line) {
        // Replaces string literals "..." with placeholders "___" to simplify parsing
        return line.replace(/"[^"]*"/g, '""');
    },

    _startsWithKeyword: function (line, keyword) {
        // Line is upper case masked. Check if it starts with keyword + boundary
        var re = new RegExp("^" + keyword + "\\b", "i");
        return re.test(line);
    },

    _formatSpacing: function (line, keywords) {
        // Complex tokenization to inject spaces around operators outside strings
        var result = "";
        var inString = false;
        var i = 0;
        var len = line.length;

        // Operators to pad: =, +, -, *, /
        // Dual char ops: <=, >=, <>, **

        // Simple logic: iterate chars.
        while (i < len) {
            var c = line[i];

            if (c === '"') {
                if (!inString) {
                    // START of String
                    // Check previous char (ignoring existing spaces if any? No, existing spaces are preserved by loop but `result` is built up)
                    // Wait, `result` holds processed output. But `i` points to input.

                    // Check input for alphanumeric BEFORE the quote
                    var ptr = i - 1;
                    while (ptr >= 0 && /\s/.test(line[ptr])) ptr--;
                    var prevChar = (ptr >= 0) ? line[ptr] : "";

                    // Only add space if previous char is Alphanumeric (inc % $ for Vars) AND there isn't already a space.
                    // Actually, if there is a space in Input (`PRINT "A"`), the loop processed that space?
                    // The loop `while` iterates `i`. Spaces are just `c`. `result += c`.
                    // So if `c` was space, `result` has space.
                    // We only need to Insert Space if one is MISSING.

                    var isAlpha = /[a-zA-Z0-9%$]/.test(prevChar);

                    // Check if we just added a space to `result`?
                    var hasSpaceEnd = /\s$/.test(result);

                    if (isAlpha && !hasSpaceEnd) {
                        result += " ";
                    }

                    inString = true;
                    result += c;
                    i++;
                    continue;
                } else {
                    // END of String
                    result += c;
                    inString = false;

                    // Check NEXT char for Alphanumeric (e.g. "A"B -> "A" B)
                    // Punctuation like ; , : ) should NOT have space.
                    // Alphanumeric should.

                    var ptr = i + 1;
                    // Peek ahead
                    if (ptr < len) {
                        var nextChar = line[ptr];
                        // If current char is space, we are fine.
                        // If it is Alphanumeric, we need a space.
                        // DO NOT consume the char, just add space to result.
                        if (/[a-zA-Z0-9%$]/.test(nextChar)) {
                            result += " ";
                        }
                    }
                    i++;
                    continue;
                }
            }

            if (inString) {
                result += c;
                i++;
                continue;
            }

            // Check Double Chars first
            var c2 = line.substring(i, i + 2);
            if (["<=", ">=", "<>", "**"].includes(c2)) {
                result += " " + c2 + " ";
                i += 2;
                continue;
            }
            // Labels (::) - Keep attached and do not split with spaces inside
            // Space after? "LABEL::" usually is followed by newline or space.
            if (c2 === "::") {
                result += ":: "; // Space after just in case? Or just "::"?
                // If we add ":: ", _cleanMultiSpaces will collapse.
                i += 2;
                continue;
            }

            // Check Single Chars
            if (["=", "+", "-", "*", "/", "<", ">"].includes(c)) {
                // Be clever: Don't pad if already padded? Or just add and then collapse?
                // Easiest: Add spaces, then collapse later?
                // Or just append " = "
                result += " " + c + " ";
                i++;
                continue;
            }

            if (c === ':') {
                // Colon formatting
                // Rule 1: If preceding word is a KEYWORD -> Force Space Before (Separator).
                // Rule 2: If preceding word is Identifier (and no space exists) -> Keep No Space (Procedure Call/Label).
                // Rule 3: Space After? Always, UNLESS next char is '('.

                // Backtrack to find preceding word
                var ptr = i - 1;
                while (ptr >= 0 && /\s/.test(line[ptr])) ptr--;

                var endWord = ptr;
                while (ptr >= 0 && /[a-zA-Z0-9%$]/.test(line[ptr])) ptr--;
                var startWord = ptr + 1;

                var word = (endWord >= startWord) ? line.substring(startWord, endWord + 1).toUpperCase() : "";

                var isKeyword = (keywords && keywords.indexOf(word) !== -1);

                // Original Spacing Check: Was there a space between word and colon?
                var hadSpace = /\s/.test(line.substring(endWord + 1, i));

                // Decision: Space Before?
                if (isKeyword || hadSpace) {
                    result += " :";
                } else {
                    result += ":";
                }

                // Decision: Space After?
                // Check next char (ignoring current 'c' at i)
                var nextChar = '';
                if (i + 1 < len) nextChar = line[i + 1]; // Raw next char (could be space or '(')

                // If next char is valid terminator or Start of text?
                // Actually we just want to ensure ONE space if not '('.
                // But loop continues. 'i' increments.
                // If we add " ", then loop processes next char.
                // If next char IS space, `result += c` adds it? No, loop processes chars.

                // Peek ahead (skipping whitespace) to check for '('
                var peek = i + 1;
                while (peek < len && /\s/.test(line[peek])) peek++;
                var effectiveNext = (peek < len) ? line[peek] : "";

                if (effectiveNext === '(') {
                    // No space after
                } else {
                    result += " ";
                }

                i++;
                continue;
            }

            if ([","].includes(c)) {
                result += c + " "; // Space after comma
                i++;
                continue;
            }

            result += c;
            i++;
        }

        // Cleanup: reduce multiple spaces to one
        // EXCEPT inside strings? We already preserved strings above? 
        // Wait, "result" has expanded strings. Collapsing "  " to " " globally will break strings.
        // We need to be careful. 
        // actually `cleanSpaces` helper?
        // Post-processing: Apply specific spacing rules requested by user
        // 1. IF/ELSEIF followed by '(' -> insert space "IF ("
        result = result.replace(/\b(IF|ELSEIF|WHILE)\s*\(/gi, '$1 (');

        // 2. Logical operators bounded by brackets -> insert spaces ") AND ("
        result = result.replace(/\)\s*(AND|OR|NOT)\s*\(/gi, ') $1 (');

        return this._cleanMultiSpaces(result);
    },

    _cleanMultiSpaces: function (text) {
        var parts = text.split('"');
        for (var i = 0; i < parts.length; i += 2) {
            // Even parts are CODE (outside quotes)
            parts[i] = parts[i].replace(/\s+/g, ' ');
        }
        return parts.join('"').trim();
    },

    /**
     * Compresses OPL code: Removes comments AND minifies (collapses whitespace).
     * @param {string} content 
     * @returns {string}
     */
    compress: function (content) {
        if (!content) return "";
        var noComments = this.removeComments(content);
        return this.minify(noComments);
    },

    _minifyLine: function (line) {
        // Remove all spaces around operators, reduce spaces to 1 elsewhere.
        var parts = line.split('"');
        for (var i = 0; i < parts.length; i += 2) {
            var s = parts[i];
            // Collapse whitespace
            s = s.replace(/\s+/g, ' ');

            // Remove spaces around operators
            // " = " -> "="
            s = s.replace(/\s*([=+\-*/<>!&|])\s*/g, '$1');

            // Remove space after punctuation like comma if safe?
            s = s.replace(/\s*,\s*/g, ',');

            // Remove space before '(' if preceded by Alphanumeric (Keyword or Func)
            s = s.replace(/([a-zA-Z0-9%$])\s+\(/g, '$1(');
            // Remove space INSIDE brackets
            s = s.replace(/\(\s+/g, '(');
            s = s.replace(/\s+\)/g, ')');

            // Colon Handling (Refined):
            // Rule: "if the preceding character is not numeric or alphabetic the space before a colon may be removed."
            // 1. If preceding char IS Alphanumeric, KEEP space (e.g. "PRINT A$ :")
            s = s.replace(/([a-zA-Z0-9])\s+:/g, '$1 :');

            // 2. If preceding char is NOT Alphanumeric, REMOVE space (e.g. ") :" -> "):")
            // Exclusion of ':' prevents "A: :FIRST" becoming "A::FIRST" (Label)
            s = s.replace(/([^a-zA-Z0-9:])\s+:/g, '$1:');

            // 3. Remove space at start of line (rare but possible)
            s = s.replace(/^\s+:/g, ':');

            // 4. Remove space AFTER colon always, UNLESS followed by another colon (avoids merge to ::)
            s = s.replace(/:\s+(?!:)/g, ':');

            // Ensure space separating keywords is kept? "RETURN 1" -> "RETURN1" is BAD.
            // Regex above `$1` does NOT check alphanumeric boundaries. 
            // Operators usually don't need spaces.

            parts[i] = s.trim();
        }
        return parts.join('"');
    }

};

// Expose
if (typeof window !== 'undefined') window.OPLFormatter = OPLFormatter;
if (typeof module !== 'undefined') module.exports = OPLFormatter;
