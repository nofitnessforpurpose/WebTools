'use strict';

var SyntaxHighlighter = {
    keywordCategories: {
        functions: [
            "ABS", "ACOS", "ADDR", "ASC", "ASIN", "ATAN",
            "COS", "COUNT",
            "DAY", "DAYS", "DEG", "DISP", "DOW",
            "EOF", "ERR", "EXIST", "EXP",
            "FIND", "FINDW", "FLT", "FREE",
            "GET",
            "HOUR",
            "IABS", "INT", "INTF",
            "KEY", "KMOD",
            "LEN", "LN", "LOC", "LOG",
            "MAX", "MEAN", "MENU", "MENUN", "MIN", "MINUTE", "MONTH",
            "PEEKB", "PEEKW", "PI", "POS",
            "RAD", "REC", "RECSIZE", "RECSZ", "RND",
            "SECOND", "SIN", "SPACE", "SQR", "STD", "SUM",
            "TAN",
            "USR",
            "VAL", "VAR", "VIEW",
            "WEEK",
            "YEAR"
        ],
        commands: [
            "AND", "APP", "APPEND", "AT", "BACK",
            "BEEP", "BREAK",
            "CLOCK", "CLOSE", "CLS", "CONST", "CONTINUE", "COPY", "COPYW", "CREATE", "CURSOR",
            "DELETE", "DELETEW", "DO",
            "EDIT", "ELSE", "ELSEIF", "ENDA", "ENDIF", "ENDP", "ENDWH", "ERASE", "ESCAPE", "EXT",
            "FIRST",
            "GLOBAL", "GOTO",
            "IF", "INCLUDE", "INPUT",
            "KSTAT",
            "LAST", "LOADM", "LOCAL", "LOPEN", "LPRINT",
            "NEXT", "NOT",
            "OFF", "ON", "ONERR", "OPEN", "OR",
            "PAUSE", "POKEB", "POKEW", "POSITION", "PRINT", "PROC",
            "RAISE", "RANDOMIZE", "REM", "RENAME", "RETURN",
            "SCREEN", "STOP",
            "TRAP",
            "UDG", "UNLOADM", "UNTIL", "UPDATE", "USE",
            "VECTOR",
            "WHILE"
        ],
        stringFuncs: [
            "CHR$",
            "DATIM$", "DAYNAME$", "DIR$", "DIRW$",
            "ERR$",
            "FIX$",
            "GEN$", "GET$",
            "HEX$",
            "KEY$", "KEYS",
            "LEFT$", "LOWER$",
            "MID$", "MONTH$",
            "NUM$",
            "REPT$", "RIGHT$",
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
        var bracketLevel = 0;

        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            var highlightedLine = "";
            var j = 0;

            while (j < line.length) {
                var char = line[j];

                // Check for comment (REM or ')
                // Note: REM must be a separate word or at start
                // Added support for :REM and made matching stricter (word boundary)
                if (char === '\'' || (line.substr(j, 3).toUpperCase() === "REM" && (j === 0 || /[\s:]/.test(line[j - 1])) && (j + 3 >= line.length || /[^A-Za-z0-9%$]/.test(line[j + 3])))) {
                    highlightedLine += '<span class="opl-comment">' + line.substr(j) + '</span>';
                    break; // Rest of line is comment
                }

                // Check for string
                if (char === '"') {
                    var end = j + 1;
                    while (end < line.length) {
                        if (line[end] === '"') {
                            if (end + 1 < line.length && line[end + 1] === '"') {
                                end += 2; // skip ""
                                continue;
                            } else {
                                end++; // End of string (include closing quote)
                                break;
                            }
                        }
                        end++;
                    }
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
                if (/[+\-*/=<>:,]/.test(char)) {
                    highlightedLine += '<span class="opl-operator">' + char + '</span>';
                    j++;
                    continue;
                }

                // Brackets
                if (char === '(') {
                    highlightedLine += '<span class="bracket-' + (bracketLevel % 3) + '">' + char + '</span>';
                    bracketLevel++;
                    j++;
                    continue;
                }
                if (char === ')') {
                    if (bracketLevel > 0) bracketLevel--;
                    highlightedLine += '<span class="bracket-' + (bracketLevel % 3) + '">' + char + '</span>';
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

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SyntaxHighlighter };
}
