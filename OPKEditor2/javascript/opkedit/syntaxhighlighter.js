'use strict';

var SyntaxHighlighter = {
    keywordCategories: {
        functions: [
            "ABS", "ADDR", "ASC", "ATAN",
            "COS", "COUNT",
            "DAY", "DEG", "DISP",
            "EOF", "ERR", "EXIST", "EXP",
            "FIND", "FLT", "FREE",
            "GET",
            "HOUR",
            "IABS", "INT", "INTF",
            "KEY",
            "LEN", "LN", "LOC", "LOG",
            "MENU", "MINUTE", "MONTH",
            "PEEKB", "PEEKW", "PI", "POS",
            "RAD", "RECSIZE", "RND",
            "SECOND", "SIN", "SPACE", "SQR",
            "TAN",
            "USR",
            "VAL", "VIEW",
            "YEAR"
        ],
        commands: [
            "APPEND", "AT",
            "BEEP", "BREAK",
            "CLOSE", "CLS", "CONTINUE", "COPY", "CREATE", "CURSOR OFF", "CURSOR ON",
            "DELETE", "DO",
            "EDIT", "ELSE", "ELSEIF", "ENDIF", "ENDWH", "ERASE", "ESCAPE ON", "ESCAPE OFF",
            "FIRST",
            "IF", "INPUT",
            "KSTAT",
            "LOCAL", "LPRINT",
            "NEXT",
            "OFF", "OPEN", "ONERR",
            "PAUSE", "POKEB", "POKEW", "POSITION", "PRINT",
            "RAISE", "RANDOMIZE", "REM", "RENAME", "RETURN",
            "STOP",
            "TRAP",
            "UPDATE", "USE",
            "WHILE",
            "UNTIL"
        ],
        stringFuncs: [
            "CHR$",
            "DATIM$", "DIR$",
            "ERR$",
            "FIX$",
            "GEN$", "GET$",
            "HEX$",
            "KEYS",
            "LEFT$", "LOWER$",
            "MID$",
            "NUM$",
            "RIGHT$", "REPT$",
            "SCI$",
            "UPPER$", "USR$"
        ]
    },

    // Cache for quick lookup
    keywordMap: null,

    init: function () {
        if (this.keywordMap) return;
        this.keywordMap = {};

        var self = this;
        // Helper to populate map
        function addKeywords(list, type) {
            for (var i = 0; i < list.length; i++) {
                self.keywordMap[list[i]] = type;
            }
        }

        addKeywords(this.keywordCategories.functions, 'kw-functions');
        addKeywords(this.keywordCategories.commands, 'kw-commands');
        addKeywords(this.keywordCategories.stringFuncs, 'kw-stringfuncs');
    },

    highlight: function (code) {
        if (!code) return "";

        // Ensure map is initialized
        this.init();

        // Escape HTML entities first
        code = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

        // Tokenize and highlight
        // We need to be careful with order. Strings and comments first.

        var lines = code.split('\n');
        var output = "";

        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            var highlightedLine = "";
            var j = 0;

            while (j < line.length) {
                var char = line[j];

                // Check for comment (REM or ')
                // Note: REM must be a separate word or at start
                if (char === '\'' || (line.substr(j).toUpperCase().startsWith("REM") && (j === 0 || line[j - 1] === ' '))) {
                    highlightedLine += '<span class="opl-comment">' + line.substr(j) + '</span>';
                    break; // Rest of line is comment
                }

                // Check for string
                if (char === '"') {
                    var end = line.indexOf('"', j + 1);
                    if (end === -1) end = line.length;
                    else end++; // Include closing quote
                    highlightedLine += '<span class="opl-string">' + line.substring(j, end) + '</span>';
                    j = end;
                    continue;
                }

                // Check for number (hex or decimal)
                if (/[0-9$]/.test(char)) {
                    // Check for hex start $
                    if (char === '$') {
                        var match = line.substr(j).match(/^\$[0-9A-Fa-f]+/);
                        if (match) {
                            highlightedLine += '<span class="opl-number">' + match[0] + '</span>';
                            j += match[0].length;
                            continue;
                        }
                    }
                    // Decimal / Float
                    var match = line.substr(j).match(/^[0-9]+(\.[0-9]+)?([Ee][+-]?[0-9]+)?/);
                    if (match) {
                        // Ensure it's not part of a variable name (preceded by letter)
                        if (j > 0 && /[A-Za-z_]/.test(line[j - 1])) {
                            highlightedLine += char;
                            j++;
                            continue;
                        }
                        highlightedLine += '<span class="opl-number">' + match[0] + '</span>';
                        j += match[0].length;
                        continue;
                    }
                }

                // Check for Keywords or Labels
                if (/[A-Za-z]/.test(char)) {
                    // Check for Label first (word ending in :)
                    var labelMatch = line.substr(j).match(/^[A-Za-z][A-Za-z0-9]*[\$%&]?:/);
                    if (labelMatch) {
                        highlightedLine += '<span class="opl-label">' + labelMatch[0] + '</span>';
                        j += labelMatch[0].length;
                        continue;
                    }

                    var match = line.substr(j).match(/^[A-Za-z][A-Za-z0-9]*[\$%&]?/);
                    if (match) {
                        var word = match[0];
                        var upperWord = word.toUpperCase();

                        if (this.keywordMap.hasOwnProperty(upperWord)) {
                            var className = this.keywordMap[upperWord];
                            highlightedLine += '<span class="' + className + '">' + word + '</span>';
                        } else {
                            // Variable or unknown function
                            highlightedLine += word;
                        }
                        j += word.length;
                        continue;
                    }
                }

                // Operators and punctuation
                if (/[+\-*/=<>:(),]/.test(char)) {
                    highlightedLine += '<span class="opl-operator">' + char + '</span>';
                    j++;
                    continue;
                }

                // Default: just add character
                highlightedLine += char;
                j++;
            }
            output += highlightedLine + '\n';
        }

        return output;
    }
};
