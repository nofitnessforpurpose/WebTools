/**
 * Compiler.js
 * 
 * Basic OPL to QCode Translator (Compiler).
 * Translates OPL Source Code into QCode (Object Code) for Psion Organiser II.
 */

var OPLCompiler = (function () {

    // --- Constants ---
    // --- Constants ---
    var OPERATORS = ['+', '-', '*', '/', '**', '=', '<', '>', '<=', '>=', '<>', 'AND', 'OR', 'NOT', '%'];

    // Shared Keywords (XP/LZ)
    var KEYWORDS_SHARED = [
        'PROC', 'ENDP', 'LOCAL', 'GLOBAL', 'EXTERNAL',
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

    // LZ-Only Keywords
    var KEYWORDS_LZ = [
        'UDG', 'MENU', 'CLOCK'
    ];

    // --- Helper: Invert QCODE_DEFS for name-based lookup ---
    var QCODE_BY_NAME = {};

    function init() {
        if (typeof QCODE_DEFS === 'undefined') {
            // console.error("OPLCompiler: QCODE_DEFS not found!"); 
            // Silent fail allowed for unit tests mocking it?
            return;
        }
        for (var code in QCODE_DEFS) {
            var def = QCODE_DEFS[code];
            var name = def.desc.toUpperCase();
            if (!QCODE_BY_NAME[name]) {
                QCODE_BY_NAME[name] = [];
            }
            QCODE_BY_NAME[name].push({
                code: parseInt(code),
                args: def.args,
                pops: def.pops,
                pushes: def.pushes
            });
        }
    }

    // --- Tokenizer ---
    function tokenize(source, targetSystem) {
        var tokens = [];
        var lines = source.split('\n');

        // Determine active Keywords
        var activeKeywords = KEYWORDS_SHARED.slice();
        if (targetSystem === 'LZ') {
            activeKeywords = activeKeywords.concat(KEYWORDS_LZ);
        }

        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (!line || line.startsWith('REM')) continue;

            // Scanner
            var ptr = 0;
            while (ptr < line.length) {
                var char = line[ptr];

                if (/\s/.test(char)) {
                    ptr++;
                    continue;
                }

                // String Literal
                if (char === '"') {
                    var end = line.indexOf('"', ptr + 1);
                    if (end === -1) throw new Error("Error on line " + (i + 1) + ": Unterminated string");
                    tokens.push({ type: 'STRING', value: line.substring(ptr + 1, end), line: i + 1 });
                    ptr = end + 1;
                    continue;
                }

                // Numbers
                if (/[0-9]/.test(char) || (char === '.' && /[0-9]/.test(line[ptr + 1]))) {
                    var start = ptr;
                    while (ptr < line.length && /[0-9.]/.test(line[ptr])) ptr++;
                    var val = line.substring(start, ptr);
                    if (val.includes('.')) {
                        tokens.push({ type: 'FLOAT', value: parseFloat(val), line: i + 1 });
                    } else {
                        tokens.push({ type: 'INTEGER', value: parseInt(val, 10), line: i + 1 });
                    }
                    continue;
                }

                // Hex Literals ($F8)
                if (char === '$') {
                    var start = ptr;
                    ptr++;
                    while (ptr < line.length && /[0-9A-Fa-f]/.test(line[ptr])) ptr++;
                    var hex = line.substring(start + 1, ptr);
                    tokens.push({ type: 'INTEGER', value: parseInt(hex, 16), line: i + 1 });
                    continue;
                }

                // Identifiers / Keywords
                if (/[a-zA-Z]/.test(char)) {
                    var start = ptr;
                    while (ptr < line.length && /[a-zA-Z0-9$%]/.test(line[ptr])) ptr++;
                    var word = line.substring(start, ptr);

                    var upper = word.toUpperCase();

                    // Handle REM (Inline Comment)
                    if (upper === 'REM') {
                        ptr = line.length; // Skip rest of line
                        continue;
                    }

                    if (activeKeywords.indexOf(upper) !== -1 || OPERATORS.indexOf(upper) !== -1) {
                        tokens.push({ type: 'KEYWORD', value: upper, line: i + 1 });
                    } else {
                        tokens.push({ type: 'IDENTIFIER', value: word, line: i + 1 });
                    }
                    continue;
                }

                // Operators / Punctuation
                if ([':', ',', ';', '(', ')'].indexOf(char) !== -1) {
                    tokens.push({ type: 'PUNCTUATION', value: char, line: i + 1 });
                    ptr++;
                    continue;
                }

                // Dot Punctuation (Field Operator) vs start of float
                if (char === '.') {
                    // Check if next is digit?
                    if (ptr + 1 < line.length && /[0-9]/.test(line[ptr + 1])) {
                        // Float starting with dot (.5)
                        var start = ptr;
                        ptr++;
                        while (ptr < line.length && /[0-9]/.test(line[ptr])) ptr++;
                        var val = line.substring(start, ptr);
                        tokens.push({ type: 'FLOAT', value: parseFloat(val), line: i + 1 });
                        continue;
                    } else {
                        // Punctuation
                        tokens.push({ type: 'PUNCTUATION', value: '.', line: i + 1 });
                        ptr++;
                        continue;
                    }
                }

                // Multi-char operators
                if (char === '<' || char === '>' || char === ':') {
                    if (line[ptr + 1] === '=' || line[ptr + 1] === '>') {
                        tokens.push({ type: 'OPERATOR', value: char + line[ptr + 1], line: i + 1 });
                        ptr += 2;
                        continue;
                    }
                }
                if (char === '*') {
                    if (line[ptr + 1] === '*') {
                        tokens.push({ type: 'OPERATOR', value: '**', line: i + 1 });
                        ptr += 2;
                        continue;
                    }
                }

                if (OPERATORS.indexOf(char) !== -1) {
                    tokens.push({ type: 'OPERATOR', value: char, line: i + 1 });
                    ptr++;
                    continue;
                }

                // Unknown
                throw new Error("Error on line " + (i + 1) + ": Unexpected character '" + char + "'");
            }
            tokens.push({ type: 'EOL', line: i + 1 });
        }
        return tokens;
    }

    // --- Helper: Type Suffixes ---
    function parseType(name) {
        if (name.endsWith('$')) return 2; // String
        if (name.endsWith('%')) return 0; // Integer
        return 1; // Float (Default)
    }

    function removeSuffix(name) {
        if (name.endsWith('$') || name.endsWith('%')) return name.slice(0, -1);
        return name;
    }

    // --- OPL Built-in Opcode Mapping ---
    // Split into Shared and LZ-Specific
    const BUILTIN_OPCODES_SHARED = {
        'GET': 0x91, 'KEY': 0x95, 'POS': 0xA5, 'COUNT': 0xA2, 'EOF': 0xA3, 'ERR': 0x8E,
        'FREE': 0x90, 'RECSIZE': 0x9D, 'FIND': 0x8F, 'LEN': 0x96, 'LOC': 0x97, 'ASC': 0x8B,
        'ADDR': 0x8A, 'ABS': 0xA6, 'IABS': 0x93, 'INT': 0x94, 'FLT': 0x86, 'DIR$': 0xB7, 'KEY$': 0xBF,
        'CHR$': 0xB8, 'EXIST': 0xA4,
        'DAY': 0x8C, 'HOUR': 0x92, 'MINUTE': 0x99, 'MONTH': 0x9A, 'SECOND': 0x9E, 'YEAR': 0xA1,
        'PEEKB': 0x9B, 'PEEKW': 0x9C, 'USR': 0x9F, 'USR$': 0xC8,
        'VIEW': 0xA0, 'MENU': 0x98, 'KSTAT': 0x6A, 'EDIT': 0x6B,
        'HEX$': 0xBE, 'LEFT$': 0xC0, 'RIGHT$': 0xC4, 'MID$': 0xC2, 'LOWER$': 0xC1, 'UPPER$': 0xC7,
        'REPT$': 0xC5, 'GEN$': 0xBC, 'FIX$': 0xBB, 'SCI$': 0xC6, 'NUM$': 0xC3, 'DATIM$': 0xB9,
        'ERR$': 0xBA, 'GET$': 0xBD, 'VAL': 0xB5, 'PI': 0xAF, 'RAD': 0xB0, 'DEG': 0xA9,
        'SIN': 0xB2, 'COS': 0xA8, 'TAN': 0xB4, 'ATAN': 0xA7, 'SQR': 0xB3, 'LN': 0xAD,
        'LOG': 0xAE, 'EXP': 0xAA, 'RND': 0xB1, 'INTF': 0xAC, 'SPACE': 0xB6,
        'DISP': 0x8D
    };

    const BUILTIN_OPCODES_LZ = {
        'CLOCK': 0xD6, 'DOW': 0xD7, 'FINDW': 0xD8, 'MENUN': 0xD9, 'WEEK': 0xDA,
        'ACOS': 0xDB, 'ASIN': 0xDC, 'DAYS': 0xDD, 'MAX': 0xDE, 'MEAN': 0xDF,
        'MIN': 0xE0, 'STD': 0xE1, 'SUM': 0xE2, 'VAR': 0xE3,
        'DAYNAME$': 0xE4, 'DIRW$': 0xE5, 'MONTH$': 0xE6
    };

    const QCODE_DEFS = {
        0X00: { args: 'v', pops: '', pushes: 'I', desc: 'Push local/global int' },
        0X01: { args: 'v', pops: '', pushes: 'F', desc: 'Push local/global float' },
        0X02: { args: 'v', pops: '', pushes: 'S', desc: 'Push local/global string' },
        0X03: { args: 'V', pops: '', pushes: 'I', desc: 'Push local/global int array element' },
        0X04: { args: 'V', pops: '', pushes: 'F', desc: 'Push local/global float array element' },
        0X05: { args: 'V', pops: '', pushes: 'S', desc: 'Push local/global string array element' },
        0X06: { args: 'W', pops: '', pushes: 'F', desc: 'Push calculator memory' },
        0X07: { args: 'v', pops: '', pushes: 'I', desc: 'Push extern int' },
        0X08: { args: 'v', pops: '', pushes: 'F', desc: 'Push extern float' },
        0X09: { args: 'v', pops: '', pushes: 'S', desc: 'Push extern string' },
        0X0A: { args: 'v', pops: '', pushes: 'I', desc: 'Push extern int array element' },
        0X0B: { args: 'v', pops: '', pushes: 'F', desc: 'Push extern float array element' },
        0X0C: { args: 'v', pops: '', pushes: 'S', desc: 'Push extern string array element' },
        0X0D: { args: 'v', pops: '', pushes: 'I', desc: 'Push local/global int ref' },
        0X0E: { args: 'v', pops: '', pushes: 'F', desc: 'Push local/global float ref' },
        0X0F: { args: 'v', pops: '', pushes: 'S', desc: 'Push local/global string ref' },
        0X10: { args: 'v', pops: 'I', pushes: 'I', desc: 'Push local/global int array ref' },
        0X11: { args: 'v', pops: 'I', pushes: 'F', desc: 'Push local/global float array ref' },
        0X12: { args: 'v', pops: 'I', pushes: 'S', desc: 'Push local/global string array ref' },
        0X13: { args: 'W', pops: '', pushes: 'F', desc: 'Push calculator memory ref' },
        0X14: { args: 'V', pops: '', pushes: 'I', desc: 'Push extern int ref' },
        0X15: { args: 'V', pops: '', pushes: 'F', desc: 'Push extern float ref' },
        0X16: { args: 'V', pops: '', pushes: 'S', desc: 'Push extern string ref' },
        0X17: { args: 'V', pops: 'I', pushes: 'I', desc: 'Push extern int array ref' },
        0X18: { args: 'V', pops: 'I', pushes: 'F', desc: 'Push extern float array ref' },
        0X19: { args: 'V', pops: 'I', pushes: 'S', desc: 'Push extern string array ref' },
        0X1A: { args: 'B', pops: 'S', pushes: 'I', desc: 'Push file field int' },
        0X1B: { args: 'B', pops: 'S', pushes: 'F', desc: 'Push file field float' },
        0X1C: { args: 'B', pops: 'S', pushes: 'S', desc: 'Push file field string' },
        0X1D: { args: 'B', pops: 'S', pushes: 'I', desc: 'Push file field int ref' },
        0X1E: { args: 'B', pops: 'S', pushes: 'F', desc: 'Push file field float ref' },
        0X1F: { args: 'B', pops: 'S', pushes: 'S', desc: 'Push file field string ref' },
        0X20: { args: 'B', pops: '', pushes: 'I', desc: 'Push byte literal' },
        0X21: { args: 'I', pops: '', pushes: 'I', desc: 'Push word literal' },
        0X22: { args: 'I', pops: '', pushes: 'I', desc: 'Push integer literal' },
        0X23: { args: 'F', pops: '', pushes: 'F', desc: 'Push float literal' },
        0X24: { args: 'S', pops: '', pushes: 'S', desc: 'Push string literal' },
        0X25: { args: '', pops: '', pushes: '', desc: 'Machine Code Call' },
        0X26: { args: '', pops: '', pushes: '', desc: 'UT$LEAV' },
        0X27: { args: '', pops: 'I I', pushes: 'I', desc: '<' },
        0X28: { args: '', pops: 'I I', pushes: 'I', desc: '<=' },
        0X29: { args: '', pops: 'I I', pushes: 'I', desc: '>' },
        0X2A: { args: '', pops: 'I I', pushes: 'I', desc: '>=' },
        0X2B: { args: '', pops: 'I I', pushes: 'I', desc: '<>' },
        0X2C: { args: '', pops: 'I I', pushes: 'I', desc: '=' },
        0X2D: { args: '', pops: 'I I', pushes: 'I', desc: '+' },
        0X2E: { args: '', pops: 'I I', pushes: 'I', desc: '-' },
        0X2F: { args: '', pops: 'I I', pushes: 'I', desc: '*' },
        0X30: { args: '', pops: 'I I', pushes: 'I', desc: '/' },
        0X31: { args: '', pops: 'I I', pushes: 'I', desc: '**' },
        0X32: { args: '', pops: 'I', pushes: 'I', desc: '-' },
        0X33: { args: '', pops: 'I', pushes: 'I', desc: 'NOT' },
        0X34: { args: '', pops: 'I I', pushes: 'I', desc: 'AND' },
        0X35: { args: '', pops: 'I I', pushes: 'I', desc: 'OR' },
        0X36: { args: '', pops: 'F F', pushes: 'I', desc: '<' },
        0X37: { args: '', pops: 'F F', pushes: 'I', desc: '<=' },
        0X38: { args: '', pops: 'F F', pushes: 'I', desc: '>' },
        0X39: { args: '', pops: 'F F', pushes: 'I', desc: '>=' },
        0X3A: { args: '', pops: 'F F', pushes: 'I', desc: '<>' },
        0X3B: { args: '', pops: 'F F', pushes: 'I', desc: '=' },
        0X3C: { args: '', pops: 'F F', pushes: 'F', desc: '+' },
        0X3D: { args: '', pops: 'F F', pushes: 'F', desc: '-' },
        0X3E: { args: '', pops: 'F F', pushes: 'F', desc: '*' },
        0X3F: { args: '', pops: 'F F', pushes: 'F', desc: '/' },
        0X40: { args: '', pops: 'F F', pushes: 'F', desc: '**' },
        0X41: { args: '', pops: 'F', pushes: 'F', desc: '-' },
        0X42: { args: '', pops: 'F', pushes: 'I', desc: 'NOT' },
        0X43: { args: '', pops: 'F F', pushes: 'I', desc: 'AND' },
        0X44: { args: '', pops: 'F F', pushes: 'I', desc: 'OR' },
        0X45: { args: '', pops: 'S S', pushes: 'I', desc: '<' },
        0X46: { args: '', pops: 'S S', pushes: 'I', desc: '<=' },
        0X47: { args: '', pops: 'S S', pushes: 'I', desc: '>' },
        0X48: { args: '', pops: 'S S', pushes: 'I', desc: '>=' },
        0X49: { args: '', pops: 'S S', pushes: 'I', desc: '<>' },
        0X4A: { args: '', pops: 'S S', pushes: 'I', desc: '=' },
        0X4B: { args: '', pops: 'S S', pushes: 'S', desc: '+' },
        0X4C: { args: '', pops: 'I I', pushes: '', desc: 'AT' },
        0X4D: { args: '', pops: 'I I', pushes: '', desc: 'BEEP' },
        0X4E: { args: '', pops: '', pushes: '', desc: 'CLS' },
        0X4F: { args: 'O', pops: '', pushes: '', desc: 'CURSOR' },
        0X50: { args: 'O', pops: '', pushes: '', desc: 'ESCAPE' },
        0X51: { args: 'D', pops: '', pushes: '', desc: 'GOTO' },
        0X52: { args: '', pops: '', pushes: '', desc: 'OFF' },
        0X53: { args: 'D', pops: '', pushes: '', desc: 'ONERR' },
        0X54: { args: '', pops: 'I', pushes: '', desc: 'PAUSE' },
        0X55: { args: '', pops: 'I I', pushes: '', desc: 'POKEB' },
        0X56: { args: '', pops: 'I I', pushes: '', desc: 'POKEW' },
        0X57: { args: '', pops: 'I', pushes: '', desc: 'RAISE' },
        0X58: { args: '', pops: 'F', pushes: '', desc: 'RANDOMIZE' },
        0X59: { args: '', pops: '', pushes: '', desc: 'STOP' },
        0X5A: { args: '', pops: '', pushes: '', desc: 'TRAP' },
        0X5B: { args: '', pops: '', pushes: '', desc: 'APPEND' },
        0X5C: { args: '', pops: '', pushes: '', desc: 'CLOSE' },
        0X5D: { args: '', pops: 'S S', pushes: '', desc: 'COPY' },
        0X5E: { args: 'f+list', pops: 'S', pushes: '', desc: 'CREATE' },
        0X5F: { args: '', pops: 'S', pushes: '', desc: 'DELETE' },
        0X60: { args: '', pops: '', pushes: '', desc: 'ERASE' },
        0X61: { args: '', pops: '', pushes: '', desc: 'FIRST' },
        0X62: { args: '', pops: '', pushes: '', desc: 'LAST' },
        0X63: { args: '', pops: '', pushes: '', desc: 'NEXT' },
        0X64: { args: '', pops: '', pushes: '', desc: 'BACK' },
        0X65: { args: 'f+list', pops: 'S', pushes: '', desc: 'OPEN' },
        0X66: { args: '', pops: 'I', pushes: '', desc: 'POSITION' },
        0X67: { args: '', pops: 'S S', pushes: '', desc: 'RENAME' },
        0X68: { args: '', pops: '', pushes: '', desc: 'UPDATE' },
        0X69: { args: 'B', pops: '', pushes: '', desc: 'USE' },
        0X6A: { args: '', pops: 'I', pushes: '', desc: 'KSTAT' },
        0X6B: { args: '', pops: 'S', pushes: '', desc: 'EDIT' },
        0X6C: { args: '', pops: 'I', pushes: '', desc: 'INPUT' },
        0X6D: { args: '', pops: 'I', pushes: '', desc: 'INPUT' },
        0X6E: { args: '', pops: 'I', pushes: '', desc: 'INPUT' },
        0X6F: { args: '', pops: 'I', pushes: '', desc: 'PRINT' },
        0X70: { args: '', pops: 'F', pushes: '', desc: 'PRINT' },
        0X71: { args: '', pops: 'S', pushes: '', desc: 'PRINT' },
        0X72: { args: '', pops: '', pushes: '', desc: 'PRINT ,' },
        0X73: { args: '', pops: '', pushes: '', desc: 'PRINT (NL)' },
        0X74: { args: '', pops: 'I', pushes: '', desc: 'LPRINT' },
        0X75: { args: '', pops: 'F', pushes: '', desc: 'LPRINT' },
        0X76: { args: '', pops: 'S', pushes: '', desc: 'LPRINT' },
        0X77: { args: '', pops: '', pushes: '', desc: 'LPRINT ,' },
        0X78: { args: '', pops: '', pushes: '', desc: 'LPRINT (NL)' },
        0X79: { args: '', pops: '?', pushes: '', desc: 'RETURN' },
        0X7A: { args: '', pops: '', pushes: '', desc: 'RETURN' },
        0X7B: { args: '', pops: '', pushes: '', desc: 'RETURN' },
        0X7C: { args: '', pops: '', pushes: '', desc: 'RETURN' },
        0X7D: { args: 'params', pops: '', pushes: '?', desc: 'PROC' },
        0X7E: { args: 'D', pops: '', pushes: '', desc: 'BranchIfFalse' },
        0X7F: { args: '', pops: 'I I', pushes: '', desc: 'Assign Int' },
        0X80: { args: '', pops: 'I F', pushes: '', desc: 'Assign Float' },
        0X81: { args: '', pops: 'I S', pushes: '', desc: 'Assign String' },
        0X82: { args: '', pops: '', pushes: '', desc: 'DROP' },
        0X83: { args: '', pops: 'I', pushes: '', desc: 'DROP' },
        0X84: { args: '', pops: 'F', pushes: '', desc: 'DROP' },
        0X85: { args: '', pops: 'S', pushes: '', desc: 'DROP' },
        0X86: { args: '', pops: 'I', pushes: 'F', desc: 'FLT' },
        0X87: { args: '', pops: 'F', pushes: 'I', desc: 'INT' },
        0X88: { args: '', pops: '', pushes: '', desc: 'End of Field List' },
        0X89: { args: 'code', pops: '', pushes: '', desc: 'Inline Code' },
        0X8A: { args: '', pops: 'i', pushes: 'I', desc: 'ADDR' },
        0X8B: { args: '', pops: 'S', pushes: 'I', desc: 'ASC' },
        0X8C: { args: '', pops: '', pushes: 'I', desc: 'DAY' },
        0X8D: { args: '', pops: 'I S', pushes: 'I', desc: 'DISP' },
        0X8E: { args: '', pops: '', pushes: 'I', desc: 'ERR' },
        0X8F: { args: '', pops: 'S', pushes: 'I', desc: 'FIND' },
        0X90: { args: '', pops: '', pushes: 'I', desc: 'FREE' },
        0X91: { args: '', pops: '', pushes: 'I', desc: 'GET' },
        0X92: { args: '', pops: '', pushes: 'I', desc: 'HOUR' },
        0X93: { args: '', pops: 'I', pushes: 'I', desc: 'ABS' },
        0X94: { args: '', pops: 'F', pushes: 'I', desc: 'INT' },
        0X95: { args: '', pops: '', pushes: 'I', desc: 'KEY' },
        0X96: { args: '', pops: 'S', pushes: 'I', desc: 'LEN' },
        0X97: { args: '', pops: 'S S', pushes: 'I', desc: 'LOC' },
        0X98: { args: '', pops: 'S', pushes: 'I', desc: 'MENU' },
        0X99: { args: '', pops: '', pushes: 'I', desc: 'MINUTE' },
        0X9A: { args: '', pops: '', pushes: 'I', desc: 'MONTH' },
        0X9B: { args: '', pops: 'I', pushes: 'I', desc: 'PEEKB' },
        0X9C: { args: '', pops: 'I', pushes: 'I', desc: 'PEEKW' },
        0X9D: { args: '', pops: '', pushes: 'I', desc: 'RECSIZE' },
        0X9E: { args: '', pops: '', pushes: 'I', desc: 'SECOND' },
        0X9F: { args: '', pops: 'I I', pushes: 'I', desc: 'USR' },
        0XA0: { args: '', pops: 'I S', pushes: 'I', desc: 'VIEW' },
        0XA1: { args: '', pops: '', pushes: 'I', desc: 'YEAR' },
        0XA2: { args: '', pops: '', pushes: 'I', desc: 'COUNT' },
        0XA3: { args: '', pops: '', pushes: 'I', desc: 'EOF' },
        0XA4: { args: '', pops: 'S', pushes: 'I', desc: 'EXIST' },
        0XA5: { args: '', pops: '', pushes: 'I', desc: 'POS' },
        0XA6: { args: '', pops: 'F', pushes: 'F', desc: 'ABS' },
        0XA7: { args: '', pops: 'F', pushes: 'F', desc: 'ATAN' },
        0XA8: { args: '', pops: 'F', pushes: 'F', desc: 'COS' },
        0XA9: { args: '', pops: 'F', pushes: 'F', desc: 'DEG' },
        0XAA: { args: '', pops: 'F', pushes: 'F', desc: 'EXP' },
        0XAB: { args: '', pops: 'F', pushes: 'F', desc: 'FLT' },
        0XAC: { args: '', pops: 'F', pushes: 'F', desc: 'INTF' },
        0XAD: { args: '', pops: 'F', pushes: 'F', desc: 'LN' },
        0XAE: { args: '', pops: 'F', pushes: 'F', desc: 'LOG' },
        0XAF: { args: '', pops: '', pushes: 'F', desc: 'PI' },
        0XB0: { args: '', pops: 'F', pushes: 'F', desc: 'RAD' },
        0XB1: { args: '', pops: '', pushes: 'F', desc: 'RND' },
        0XB2: { args: '', pops: 'F', pushes: 'F', desc: 'SIN' },
        0XB3: { args: '', pops: 'F', pushes: 'F', desc: 'SQR' },
        0XB4: { args: '', pops: 'F', pushes: 'F', desc: 'TAN' },
        0XB5: { args: '', pops: 'S', pushes: 'F', desc: 'VAL' },
        0XB6: { args: '', pops: '', pushes: 'F', desc: 'SPACE' },
        0XB7: { args: '', pops: 'S', pushes: 'S', desc: 'DIR$' },
        0XB8: { args: '', pops: 'I', pushes: 'S', desc: 'CHR$' },
        0XB9: { args: '', pops: '', pushes: 'S', desc: 'DATIM$' },
        0XBA: { args: '', pops: '', pushes: 'S', desc: 'ERR$' },
        0XBB: { args: '', pops: 'F I I', pushes: 'S', desc: 'FIX$' },
        0XBC: { args: '', pops: 'F I', pushes: 'S', desc: 'GEN$' },
        0XBD: { args: '', pops: '', pushes: 'S', desc: 'GET$' },
        0XBE: { args: '', pops: 'I', pushes: 'S', desc: 'HEX$' },
        0XBF: { args: '', pops: '', pushes: 'S', desc: 'KEY$' },
        0XC0: { args: '', pops: 'S I', pushes: 'S', desc: 'LEFT$' },
        0XC1: { args: '', pops: 'S', pushes: 'S', desc: 'LOWER$' },
        0XC2: { args: '', pops: 'S I I', pushes: 'S', desc: 'MID$' },
        0XC3: { args: '', pops: 'F I', pushes: 'S', desc: 'NUM$' },
        0XC4: { args: '', pops: 'S I', pushes: 'S', desc: 'RIGHT$' },
        0XC5: { args: '', pops: 'S I', pushes: 'S', desc: 'REPT$' },
        0XC6: { args: '', pops: 'F I I', pushes: 'S', desc: 'SCI$' },
        0XC7: { args: '', pops: 'S', pushes: 'S', desc: 'UPPER$' },
        0XC8: { args: '', pops: 'I I', pushes: 'S', desc: 'USR$' },
        0XC9: { args: '', pops: 's', pushes: 'I', desc: 'ADDR' },
        0XCA: { args: 'S I', pops: '', pushes: '', desc: '.LNO' },
        0XCB: { args: 'I I', pops: '', pushes: '', desc: '.LNO' },
        0XCC: { args: '', pops: 'F F', pushes: 'F', desc: '<%' },
        0XCD: { args: '', pops: 'F F', pushes: 'F', desc: '>%' },
        0XCE: { args: '', pops: 'F F', pushes: 'F', desc: '+%' },
        0XCF: { args: '', pops: 'F F', pushes: 'F', desc: '-%' },
        0XD0: { args: '', pops: 'F F', pushes: 'F', desc: '*%' },
        0XD1: { args: '', pops: 'F F', pushes: 'F', desc: '/%' },
        0XD2: { args: '', pops: 'I', pushes: '', desc: 'OFF' },
        0XD3: { args: '', pops: 'S S', pushes: '', desc: 'COPYW' },
        0XD4: { args: '', pops: 'S', pushes: '', desc: 'DELETEW' },
        0XD5: { args: '', pops: 'I I I I I I I I I', pushes: '', desc: 'UDG' },
        0XD6: { args: '', pops: 'I', pushes: 'I', desc: 'CLOCK' },
        0XD7: { args: '', pops: 'I I I', pushes: 'I', desc: 'DOW' },
        0XD8: { args: '', pops: 'S', pushes: 'I', desc: 'FINDW' },
        0XD9: { args: '', pops: 'I S', pushes: 'I', desc: 'MENUN' },
        0XDA: { args: '', pops: 'I I I', pushes: 'I', desc: 'WEEK' },
        0XDB: { args: '', pops: 'F', pushes: 'F', desc: 'ACOS' },
        0XDC: { args: '', pops: 'F', pushes: 'F', desc: 'ASIN' },
        0XDD: { args: '', pops: 'I I I', pushes: 'F', desc: 'DAYS' },
        0XDE: { args: 'Flist', pushes: 'F', desc: 'MAX' },
        0XDF: { args: 'Flist', pushes: 'F', desc: 'MEAN' },
        0XE0: { args: 'Flist', pushes: 'F', desc: 'MIN' },
        0XE1: { args: 'Flist', pushes: 'F', desc: 'STD' },
        0XE2: { args: 'Flist', pushes: 'F', desc: 'SUM' },
        0XE3: { args: 'Flist', pushes: 'F', desc: 'VAR' },
        0XE4: { args: 'I', pushes: 'S', desc: 'DAYNAME$' },
        0XE5: { args: 'S', pushes: 'S', desc: 'DIRW$' },
        0XE6: { args: 'I', pushes: 'S', desc: 'MONTH$' },
        0XEA: { args: '', pops: '', pushes: '', desc: 'REM Unknown EA' },
        0XED: { args: 'b', pops: '', pushes: '', desc: 'EXT' },
        0XEF: { args: 'v', pops: '', pushes: '', desc: 'REM LZ_EF' },
        0XFB: { args: 'D', pops: '', pushes: '', desc: 'ELSEIF' },
        0XFC: { args: '', pops: '', pushes: '', desc: 'REM LZ_FC' },
        0XFD: { args: '', pops: '', pushes: '', desc: 'REM LZ_FD' },
        0XFE: { args: 'prefix', pops: '', pushes: '', desc: 'Multi-byte Prefix' },
        0XFF: { args: '', pops: '', pushes: '', desc: 'CHECK' },
        0XF1: { args: 'b b', pops: '', pushes: '', desc: 'POKE_M_F1' },
        0XF2: { args: 'b b', pops: '', pushes: '', desc: 'POKE_M_F2' },
        0XF3: { args: 'b b', pops: '', pushes: '', desc: 'POKE_M_F3' },
        0XF4: { args: 'b b', pops: '', pushes: '', desc: 'POKE_M_F4' },
        0XF5: { args: 'b b', pops: '', pushes: '', desc: 'POKE_M_F5' },
        0XF6: { args: 'b b', pops: '', pushes: '', desc: 'POKE_M_F6' },
        0XF7: { args: 'b b', pops: '', pushes: '', desc: 'POKE_M_F7' },
        0XF8: { args: 'b b', pops: '', pushes: '', desc: 'POKE_M_F8' },
        0XF9: { args: 'b b', pops: '', pushes: '', desc: 'POKE_M_F9' },
        0XFA: { args: 'b b', pops: '', pushes: '', desc: 'POKE_M_FA' },
    };

    // --- Parser & Compiler ---
    function compile(source, options) {
        options = options || {};
        var targetSystem = options.targetSystem || 'Standard'; // Default to Standard

        init();
        var tokens = tokenize(source, targetSystem);

        // Prep Active Opcodes
        var activeOpcodes = Object.assign({}, BUILTIN_OPCODES_SHARED);
        if (targetSystem === 'LZ') {
            Object.assign(activeOpcodes, BUILTIN_OPCODES_LZ);
        }

        var activeKeywords = KEYWORDS_SHARED.slice();
        if (targetSystem === 'LZ') {
            activeKeywords = activeKeywords.concat(KEYWORDS_LZ);
        }


        // Pass 1: Scan Declarations & Header Info
        var globals = [];
        var locals = [];
        var externals = [];
        var params = [];
        var globalStrFixups = [];
        var globalArrFixups = [];
        var localStrFixups = [];
        var localArrFixups = [];
        var ptr = 0;

        function peek() { return tokens[ptr]; }
        function next() { return tokens[ptr++]; }

        function error(msg) {
            var lineInfo = (t && t.line) ? "Error on line " + t.line + ": " : "Error: ";
            throw new Error(lineInfo + msg);
        }

        // Skip blank lines / comments handled by tokenizer

        // Header parsing loop (Declarative section)
        // OPL declarations usually come before executable code?
        // We will scan for GLOBAL/EXTERNAL/PROC until we hit executable code?
        // Or just scan the whole file for them? (GLOBALs usually must be at top)

        // Reset Ptr
        ptr = 0;

        var procName = null;

        while (ptr < tokens.length) {
            var t = next();

            // PROC Name:
            // Relaxed check: First matching pattern if procName not set
            if (!procName && t.type === 'IDENTIFIER') {
                // Check for PROC definition: Name: or Name(args):
                var isProc = false;
                if (peek() && peek().value === ':') isProc = true;
                else if (peek() && peek().value === '(') isProc = true;

                if (isProc) {
                    procName = t.value;
                    var ateColon = false;

                    // Handle 'Name:' case first
                    if (peek() && peek().value === ':') {
                        next(); // Eat :
                        ateColon = true;
                    }

                    // Check for Params
                    if (peek() && peek().value === '(') {
                        next(); // Eat (
                        while (true) {
                            var pTok = next();
                            if (pTok.type === 'IDENTIFIER') {
                                var pName = pTok.value.toUpperCase();
                                var pType = parseType(pName);
                                locals.push({ name: pName, type: pType, dims: [], isParam: true });
                                params.push(pType);
                            }
                            if (peek() && peek().value === ',') { next(); continue; }
                            if (peek() && peek().value === ')') { next(); break; }
                            break;
                        }
                    }

                    // Handle 'Name(Args):' case
                    if (!ateColon && peek() && peek().value === ':') next();

                    continue;
                }
            }

            if (t.type === 'KEYWORD') {
                if (t.value === 'GLOBAL' || t.value === 'EXTERNAL' || t.value === 'LOCAL') {
                    // Parse: GLOBAL name[(dim1[,dim2...])]
                    var isExt = (t.value === 'EXTERNAL');
                    var isLocal = (t.value === 'LOCAL');
                    var declList = (isExt ? externals : (isLocal ? locals : globals));

                    while (true) { // Loop for comma separated list: LOCAL a, b, c
                        var varNameTok = next();
                        if (varNameTok && varNameTok.type === 'IDENTIFIER') {
                            var rawName = varNameTok.value.toUpperCase();
                            var type = parseType(rawName);
                            var storedName = rawName;

                            var dim = [];
                            if (peek() && peek().value === '(') {
                                next(); // (
                                while (true) {
                                    var d = next();
                                    if (d.type === 'INTEGER') dim.push(d.value);
                                    if (peek() && peek().value === ',') { next(); continue; }
                                    if (peek() && peek().value === ')') { next(); break; }
                                    if (!peek()) break;
                                }
                            }

                            // Upgrade Type for Arrays
                            if (dim.length > 0) {
                                if (type === 0) type = 3;
                                else if (type === 1) type = 4;
                                else if (type === 2 && dim.length > 1) type = 5;
                            }

                            declList.push({ name: storedName, type: type, dims: dim });
                        } else {
                            var errTok = varNameTok || t;
                            var errVal = errTok.value || errTok.type || "EOF";
                            throw new Error("Error on line " + (errTok.line || "?") + ": Expected Variable Name, found '" + errVal + "'");
                        }

                        if (peek() && peek().value === ',') {
                            next(); // Consume comma and continue
                            continue;
                        }
                        break; // No comma, end of list
                    }
                }
            }
        }


        // --- Pass 1.2: Scan for Implicit Externals ---
        // Find variables used in body but not declared.
        // Skip until first non-declaration/label token?
        // Actually, scan ALL tokens. If Identifier and not Keyword and not in Globals/Locals/Params/ExplicitExternals, add it.
        // Be careful about Label definitions "Label::".
        // Be careful about Proc name.

        // Build Set of known names
        var declaredNames = {};
        for (var i = 0; i < globals.length; i++) declaredNames[globals[i].name] = true;
        for (var i = 0; i < locals.length; i++) declaredNames[locals[i].name] = true;
        for (var i = 0; i < externals.length; i++) declaredNames[externals[i].name] = true;
        // Also Params are in locals (isParam=true).

        // Scan tokens
        // We need a helper to iterate 'tokens' array manually since 'next()' logic is stateful?
        // Actually 'tokens' is available.
        var skipNext = false; // logic to skip property access etc? OPL doesn't have object.property

        // Context tracking for CREATE/OPEN to avoid detecting Logical Names/Fields as Externals
        var scanContext = {
            cmd: null,       // 'CREATE', 'OPEN', or null
            parens: 0,
            argIndex: 0
        };

        for (var i = 0; i < tokens.length; i++) {
            var t = tokens[i];

            // Reset Context on Statement Boundary
            if (t.type === 'PUNCTUATION' && t.value === ':') {
                scanContext.cmd = null;
                scanContext.parens = 0;
                scanContext.argIndex = 0;
                continue;
            }

            // Update Context
            if (t.type === 'KEYWORD' && (t.value === 'CREATE' || t.value === 'OPEN' || t.value === 'USE')) {
                scanContext.cmd = t.value;
                scanContext.parens = 0;
                scanContext.argIndex = 0;
            } else if (t.type === 'EOL') {
                scanContext.cmd = null;
            } else if (scanContext.cmd) {
                if (t.value === '(') scanContext.parens++;
                else if (t.value === ')') scanContext.parens--;
                else if (t.value === ',' && scanContext.parens === 0) {
                    scanContext.argIndex++;
                }
            }

            if (t.type === 'IDENTIFIER') {
                // Check Context: If we are in CREATE/OPEN/USE

                if (scanContext.cmd === 'USE') {
                    // USE A
                    // Arg 0 is Logical Name (ignore if A-D)
                    if (scanContext.argIndex === 0) {
                        var val = t.value.toUpperCase();
                        if (val.length === 1 && ['A', 'B', 'C', 'D'].includes(val)) continue;
                    }
                }

                if (scanContext.cmd === 'OPEN' || scanContext.cmd === 'CREATE') {
                    // Arg 0 (File Expression): Process (Is Variable)
                    // Arg 1 (Logical Name): Skip (Not Variable)
                    // Arg 2+ (Fields): Skip (Not Variable)
                    if (scanContext.argIndex >= 1) continue;
                }

                var name = t.value.toUpperCase();

                // Check for Field Access: A.Field => "Field" is not external
                // But we are currently iterating tokens.
                // If THIS token is followed by DOT, check if LHS is logical.
                // OR if THIS token is PRECEDED by DOT, it is a field name.

                // Be careful: "A.B" -> Is B a field? Yes. Is A a var? No, if it's logical.

                // Check Previous Token
                var prev = tokens[i - 1];
                if (prev && prev.value === '.') {
                    // We are a field name! Skip.
                    continue;
                }

                // Check Next Token (if we are LHS of dot)
                var nextTok = tokens[i + 1];
                if (nextTok && nextTok.value === '.') {
                    // We are LHS.
                    // If we are A,B,C,D -> Logicals. Not External.
                    if (name.length === 1 && ['A', 'B', 'C', 'D'].includes(name)) continue;
                    // If we are variable (e.g. MyVar.Field), MyVar SHOULD be processed (detected as external or whatever).
                    // So we fall through.
                }

                // Exclude Keywords
                if (activeKeywords.indexOf(name.toUpperCase()) !== -1) continue;
                if (OPERATORS.indexOf(name.toUpperCase()) !== -1) continue; // AND/OR/NOT are identifiers in scanner?

                // Exclude Definition contexts (LOCAL A, GLOBAL B) - handled by declaredNames check
                // But we must assume if we see "LOCAL A", A is already in declaredNames.

                // Exclude Procedure Name (Start of file) -> "PROC MyProc:"
                // MyProc is usually not a variable.
                if (i === 1 && tokens[0].value.toUpperCase() === 'PROC') continue;
                if (i === 0 && tokens[1] && tokens[1].value === ':') continue; // Label definition? "VS09:"

                // Exclude Labels "MyLabel::"
                if (tokens[i + 1] && tokens[i + 1].value === ':' && tokens[i + 2] && tokens[i + 2].value === ':') continue;
                if (tokens[i + 1] && tokens[i + 1].value === ':') continue; // Simple Label "Lab:"

                // Exclude Built-in Opcodes (e.g. FIX$, GEN$, etc.)
                if (activeOpcodes[name]) continue;

                // Known?
                if (declaredNames[name]) continue;

                // New Implicit External!
                // Determine type
                var type = 1; // Float default
                if (name.endsWith('%')) type = 0;
                else if (name.endsWith('$')) type = 2;
                else type = 1; // Default Float

                // Check for Array usage "Name("
                if (tokens[i + 1] && tokens[i + 1].value === '(') {
                    if (type === 0) type = 3;
                    else if (type === 1) type = 4;
                    else if (type === 2) type = 5;
                }

                // Add to Externals
                externals.push({ name: name, type: type, dims: [], isExtern: true });
                declaredNames[name] = true;
            }
        }
        var varSpaceSize = 2;

        // 2. Calculate Global Table Size
        // Format per entry: [Len(1)] [Name(N)] [Type(1)] [Offset(2)]
        // Total = 4 + NameLen
        var globalTableSize = 0;
        for (var i = 0; i < globals.length; i++) {
            globalTableSize += (4 + globals[i].name.length);
        }

        // Add to VarSpace
        // Tight Packing: No alignment padding for GT
        varSpaceSize += globalTableSize;

        // 3. Base Offset calculation
        // Stack Top -> [GT Length (2)] @ FFFE
        //           -> [Global Table (Size)] @ FFFE - Size
        //           -> [Values] @ ...

        var currentOffset = -2; // Start after GT Length
        currentOffset -= globalTableSize; // Skip past the table

        // 4. Allocate Param/External Pointers?
        // User request focuses on Global Table. 
        // Standard OPL usually has Ptrs for Params/Externs.  
        // We will keep them for now, but they take 0 space if empty.

        // Param Pointers
        // Store offsets for Params here (they correspond to locals with isParam=true)
        var paramIdx = 0;
        // Re-instituted per user request: Params follow Global Table
        for (var i = 0; i < locals.length; i++) {
            if (locals[i].isParam) {
                locals[i].offset = currentOffset - 2;
                currentOffset -= 2;
                varSpaceSize += 2;
                paramIdx++;
            }
        }

        // External Pointers
        for (var i = 0; i < externals.length; i++) {
            externals[i].ptrOffset = currentOffset - 2;
            currentOffset -= 2;
            varSpaceSize += 2;
        }

        // 5. Size Calculator (Helper)
        function calculateSize(item, scope) {
            // Parameters & Externals
            if (item.isParam) return 2;

            // Check for Arrays
            // Logic: Int(0)/Float(1) with dims > 0 is Array
            // String(2) with dims > 1 is Array (dims[0]=Count, dims[1]=MaxLen)

            var isArray = false;
            if (item.dims.length > 0) {
                if (item.type === 0 || item.type === 1 || item.type === 3 || item.type === 4) isArray = true;
                else if ((item.type === 2 || item.type === 5) && item.dims.length > 1) isArray = true;
            }

            if (isArray) {
                // Array Length is product of dimensions (excluding String Length dimension)
                var arrayLength = 1;
                var dimCount = item.dims.length;
                if (item.type === 2 || item.type === 5) dimCount -= 1; // Last dim is String Length

                for (var d = 0; d < dimCount; d++) {
                    arrayLength *= item.dims[d];
                }

                if (item.type === 0 || item.type === 3) { // Int Array
                    return 2 + (2 * arrayLength);
                } else if (item.type === 1 || item.type === 4) { // Float Array
                    return 2 + (8 * arrayLength);
                } else if (item.type === 2 || item.type === 5) { // String Array
                    var maxLen = item.dims[item.dims.length - 1];
                    // Both Local and Global String Arrays appear to use 2-byte Header (Allocator)
                    // The MaxLen byte is presumably handled differently or included in payload logic
                    return 2 + ((1 + maxLen) * arrayLength);
                }
            } else {
                // Scalar
                if (item.type === 0) return 2; // Int
                else if (item.type === 1) return 8; // Float
                else if (item.type === 2) { // String
                    // String Scalar declared as e.g. LOCAL A$(10) -> dims=[10]
                    var maxLen = (item.dims.length > 0) ? item.dims[0] : 255;
                    return 1 + maxLen;
                }
            }
            return 8; // Default
        }

        // 4. Allocate Storage (Globals)
        for (var i = 0; i < globals.length; i++) {
            var g = globals[i];

            // Tight Packing: No start alignment
            var size = calculateSize(g, 'global');

            // Allocate
            g.offset = currentOffset - size;
            currentOffset -= size;
            varSpaceSize += size;

            // Unified String Array/Scalar Padding (Globals)
            if ((g.type === 2 || g.type === 5) && g.dims.length > 0) { // String (Scalar or Array)
                currentOffset--;
                varSpaceSize++;
            }

            // Fixups
            var isArray = (g.dims.length > 0 && (g.type !== 2 || g.dims.length > 1));

            if ((g.type === 2 || g.type === 5) && !g.isParam) {
                var maxLen = g.dims[g.dims.length - 1];
                globalStrFixups.push({ addr: g.offset - 1, len: maxLen });
            }
            if (isArray) {
                var fixupElements = 1;
                var dimCount = g.dims.length;
                if (g.type === 2 || g.type === 5) dimCount -= 1;
                for (var d = 0; d < dimCount; d++) fixupElements *= g.dims[d];
                globalArrFixups.push({ addr: g.offset, len: fixupElements });
            }
        }

        // --- ALLOCATE LOCALS ---
        // Locals start where Globals left off
        var localOffset = currentOffset;

        for (var i = 0; i < locals.length; i++) {
            var l = locals[i];

            if (l.isParam) continue; // Already allocated in Pointers phase

            // Tight Packing
            var size = calculateSize(l, 'local');
            l.offset = localOffset - size;
            localOffset -= size;
            varSpaceSize += size;

            // Unified String Array/Scalar Padding (Locals)
            if ((l.type === 2 || l.type === 5) && l.dims.length > 0) { // String (Scalar or Array)
                localOffset--; // Pad
                varSpaceSize++;
            }

            var isArray = (l.dims.length > 0 && (l.type !== 2 || l.dims.length > 1));

            if ((l.type === 2 || l.type === 5) && !l.isParam) {
                var maxLen = l.dims[l.dims.length - 1];
                localStrFixups.push({ addr: l.offset - 1, len: maxLen });
            }
            if (isArray) {
                var fixupElements = 1;
                var dimCount = l.dims.length;
                if (l.type === 2 || l.type === 5) dimCount -= 1;
                for (var d = 0; d < dimCount; d++) fixupElements *= l.dims[d];
                localArrFixups.push({ addr: l.offset, len: fixupElements });
            }
        }

        // Combine Fixups: Locals FIRST, then Globals (per OPL Spec)
        // Combine Fixups: Locals FIRST, then Globals (Match Golden Binary)
        var strFixups = localStrFixups.concat(globalStrFixups);
        var arrFixups = localArrFixups.concat(globalArrFixups);

        // Final varSpaceSize: Tight Packing, no alignment to even.



        // Pass 2: QCode Generation (Body)
        var qcode = [];
        // Emit LZ Header if required
        if (targetSystem === 'LZ') {
            qcode.push(0x59, 0xB2);
        }

        var pendingTrap = false;

        // --- CodeGen Helpers ---
        function emit(b) {
            qcode.push(b & 0xFF);
        }
        function emitWord(w) { emit(w >> 8); emit(w & 0xFF); }
        function emitOp(op) { emit(op); }

        function emitCommand(op) {
            if (pendingTrap) {
                emit(0x5A); // TRAP
                pendingTrap = false;
            }
            emit(op);
        }

        function emitFloat(val) {


            var str = Math.abs(val).toString();
            if (str.includes('e')) {
                if (str.includes('e-')) {
                    // Minimal scientific support
                    var p = str.split('e-');
                    // ... for now assume literals key matched ...
                }
            }

            var s = str;
            if (s.indexOf('.') === -1) s += ".";

            var cleanDigits = "";
            var dotPos = 0;
            var firstDigitIdx = -1;
            var dotSeen = false;

            for (var i = 0; i < s.length; i++) {
                var c = s[i];
                if (c === '.') {
                    dotSeen = true;
                    dotPos = cleanDigits.length;
                } else {
                    if (firstDigitIdx === -1 && c !== '0') firstDigitIdx = cleanDigits.length;
                    cleanDigits += c;
                }
            }

            if (firstDigitIdx === -1) firstDigitIdx = cleanDigits.length;

            var finalDigits = cleanDigits.substring(firstDigitIdx);
            var exponent = (dotPos - firstDigitIdx) - 1;

            if (finalDigits.length === 0) {
                // Zero Case
                finalDigits = "00";
                exponent = 0;
            }

            if (finalDigits.length % 2 !== 0) finalDigits += "0";

            var bcdBytes = [];
            for (var i = 0; i < finalDigits.length; i += 2) {
                var h = parseInt(finalDigits[i], 16);
                var l = parseInt(finalDigits[i + 1], 16);
                bcdBytes.push((h << 4) | l);
            }

            bcdBytes.reverse();

            var expByte = exponent & 0xFF;
            bcdBytes.push(expByte);

            var len = bcdBytes.length;
            var sign = (val < 0 ? 0x80 : 0x00);

            emit(sign | len);
            for (var i = 0; i < bcdBytes.length; i++) emit(bcdBytes[i]);
        }


        // --- Symbol Table Setup ---
        // Map: Name -> { type, offset, isParam, isGlobal, isExtern }
        var symbols = {};

        // Globals (Offsets already calculated in Pass 1)
        for (var i = 0; i < globals.length; i++) {
            var g = globals[i];
            symbols[g.name] = { type: g.type, offset: g.offset, isGlobal: true };
        }
        for (var i = 0; i < locals.length; i++) {
            var l = locals[i];
            symbols[l.name] = { type: l.type, offset: l.offset, isGlobal: false, isLocal: true, isParam: l.isParam };
        }

        // Externals
        for (var i = 0; i < externals.length; i++) {
            var e = externals[i];
            symbols[e.name] = { type: e.type, index: i, offset: e.ptrOffset, isExtern: true };
        }

        // --- Parser ---

        // Reset Ptr for Pass 2
        ptr = 0;

        // --- Expression Parser ---

        function parseExpression() {
            return parseLogical();
        }

        function parseLogical() {
            var type = parseComparison();
            // DEBUG
            if (peek()) {

            }
            while (peek() && ['AND', 'OR'].includes(peek().value)) {
                var op = next().value;

                var rhsType = parseComparison();

                if (op === 'AND') emit(0x34);
                else emit(0x35);

                type = 0;
            }
            return type;
        }

        function parseComparison() {
            var type = parseAddSub();
            while (peek() && ['=', '<', '>', '<=', '>=', '<>'].includes(peek().value)) {
                var op = next().value;
                var rhsStart = qcode.length; // Capture start of RHS
                var rhsType = parseAddSub();
                var usePercent = false;

                // Check for LZ Percentage Modifier
                if (peek() && peek().value === '%') {
                    next(); // Consume %
                    usePercent = true;
                }

                if (usePercent) {
                    // LZ Percentage Comparison always implies Float logic
                    // Ops: <% (CC), >% (CD). Others? Manual implied only < and >?
                    // constants.js has <% and >%. What about =% or <=%?
                    // Assuming only <% and >% supported as per constants.js list.
                    // Fallback to Float comparison for others or error?
                    // Let's support <% and >% explicitly.
                    // Actually, emitMathOp/emitLogicOp handles this? 
                    // Inline here for comparison:

                    // If LHS was Int, it's already on stack. Cannot convert easily.
                    if (type === 0) console.warn("Compiler: Implicit Int->Float cast required (LHS) for Percentage comparison - Unsafe!");
                    if (rhsType === 0) emit(0x86); // FLT RHS (Top of stack)

                    if (op === '<') emit(0xCC);      // <%
                    else if (op === '>') emit(0xCD); // >%
                    else {
                        throw new Error("Compiler: Operator " + op + "% is not supported (Only <% and >%).");
                    }
                    type = 0; // Result is Int (True/False)
                } else {
                    // Standard Comparison
                    if (type === rhsType) {
                        if (type === 0) { // Int
                            if (op === '=') emit(0x2C);
                            else if (op === '<') emit(0x27);
                            else if (op === '>') emit(0x29);
                            else if (op === '<=') emit(0x28);
                            else if (op === '>=') emit(0x2A);
                            else if (op === '<>') emit(0x2B);
                        } else if (type === 1) { // Float
                            if (op === '=') emit(0x3B);
                            else if (op === '<') emit(0x36);
                            else if (op === '>') emit(0x38);
                            else if (op === '<=') emit(0x37);
                            else if (op === '>=') emit(0x39);
                            else if (op === '<>') emit(0x3A);
                        } else if (type === 2) { // String
                            if (op === '=') emit(0x4A);
                            else if (op === '<') emit(0x45);
                            else if (op === '>') emit(0x47);
                            else if (op === '<=') emit(0x46);
                            else if (op === '>=') emit(0x48);
                            else if (op === '<>') emit(0x49);
                        }
                    } else {
                        // Simple mixed mode support:
                        if (type === 0 && rhsType === 1) {
                            // Int LHS, Float RHS -> Promote LHS? 
                            // Backpatch: Insert FLT before RHS
                            if (rhsStart !== undefined) {
                                qcode.splice(rhsStart, 0, 0x86); // Inject FLT
                            } else {
                                console.warn("Compiler: Implicit Int->Float cast required (LHS) but cannot backpatch.");
                            }
                            type = 1; // Promoted to Float
                        } else if (type === 1 && rhsType === 0) {
                            // Float LHS, Int RHS -> Promote RHS
                            emit(0x86); // FLT RHS
                        }

                        // Re-evaluate comparison for Float (since mixed mode implies Float)
                        if (type === 1) { // Float Comparison
                            if (op === '=') emit(0x3B);
                            else if (op === '<') emit(0x36);
                            else if (op === '>') emit(0x38);
                            else if (op === '<=') emit(0x37);
                            else if (op === '>=') emit(0x39);
                            else if (op === '<>') emit(0x3A);
                        }
                    }
                    type = 0; // Result is Int
                }
            }
            return type;
        }

        // --- Refactored Expression Parser Hierarchy ---



        // Comparison calls AddSub
        // AddSub calls MulDiv
        // MulDiv calls Power
        // Power calls Factor

        function parseAddSub() {
            var type = parseMulDiv();
            while (peek() && ['+', '-'].includes(peek().value)) {
                var op = next().value;
                var rhsStart = qcode.length; // Capture start of RHS
                var rhsType = parseMulDiv();
                var usePercent = false;

                if (peek() && peek().value === '%') {
                    next(); // Consume %
                    usePercent = true;
                }

                type = emitMathOp(op, type, rhsType, usePercent, rhsStart);
            }
            return type;
        }

        function parseMulDiv() {
            var type = parsePower();
            while (peek() && ['*', '/'].includes(peek().value)) {
                var op = next().value;
                var rhsStart = qcode.length; // Capture start of RHS
                var rhsType = parsePower();
                var usePercent = false;

                if (peek() && peek().value === '%') {
                    next(); // Consume %
                    usePercent = true;
                }

                type = emitMathOp(op, type, rhsType, usePercent, rhsStart);
            }
            return type;
        }

        function parsePower() {
            var type = parseFactor();
            while (peek() && peek().value === '**') {
                var op = next().value;
                var rhsStart = qcode.length; // Capture start of RHS
                var rhsType = parseFactor();
                type = emitMathOp(op, type, rhsType, false, rhsStart);
            }
            return type;
        }

        function emitMathOp(op, t1, t2, usePercent, rhsStart) {
            if (t1 === 2 && t2 === 2 && op === '+' && !usePercent) {
                emit(0x4B); // Str + Str
                return 2;
            }

            var method = 0; // 0=Int, 1=Float
            if (t1 === 1 || t2 === 1 || usePercent) method = 1;

            if (usePercent) {
                if (t1 === 0) console.warn("Compiler: Implicit Int->Float cast required (LHS) for Percentage op - Unsafe!");
                if (t2 === 0) {
                    emit(0x86); // Convert RHS
                }

                if (op === '+') emit(0xCE);      // +%
                else if (op === '-') emit(0xCF); // -%
                else if (op === '*') emit(0xD0); // *%
                else if (op === '/') emit(0xD1); // /%
                else throw new Error("Percent modifier not supported for " + op);
                return 1;
            }

            if (method === 0) { // Int
                if (op === '+') emit(0x2D);
                else if (op === '-') emit(0x2E);
                else if (op === '*') emit(0x2F);
                else if (op === '/') emit(0x30);
                else if (op === '**') emit(0x31);
                return 0;
            } else { // Float
                if (t1 === 0) {
                    // Backpatch: Insert FLT before RHS
                    if (rhsStart !== undefined) {
                        qcode.splice(rhsStart, 0, 0x86); // Inject FLT
                    } else {
                        console.warn("Compiler: Implicit Int->Float cast required (LHS) but cannot backpatch.");
                    }
                }
                if (t2 === 0) {
                    emit(0x86);
                }

                if (op === '+') emit(0x3C);
                else if (op === '-') emit(0x3D);
                else if (op === '*') emit(0x3E);
                else if (op === '/') emit(0x3F);
                else if (op === '**') emit(0x40);
                return 1;
            }
        }

        function parseFactor() {
            var t = peek();
            // Check for Unary Minus
            if (t && (t.value === '-' || (t.type === 'PUNCTUATION' && t.value === '-'))) { // Tokenizer might mark - as PUNCTUATION or KEYWORD depending on logic?
                next(); // Consume '-'
                var type = parseFactor(); // Recurse

                // Emit Unary Minus Opcode
                if (type === 0) emit(0x32); // Int Neg (0x32)
                else if (type === 1) emit(0x41); // Flt Neg (0x41)
                else console.warn("Compiler: Unary minus on String?");
                return type;
            }
            if (t && (t.value === 'NOT')) {
                next(); // Value
                var type = parseFactor();
                if (type === 1) emit(0x42); // NOT (Float)
                else emit(0x33); // NOT (Int)
                return 0; // Result is Int
            }

            t = next(); // Consume
            if (!t) return 0;

            if (t.type === 'INTEGER') {
                // Force Push Integer (0x22) to match Reference (Disable Byte Optimization 0x20)
                // if (t.value >= 0 && t.value <= 255) { emit(0x20); emit(t.value); }
                // else { emit(0x22); emitWord(t.value); }
                emit(0x22); emitWord(t.value);
                return 0; // Int
            } else if (t.type === 'FLOAT') {
                emit(0x23);
                emitFloat(t.value);
                return 1; // Float
            } else if (t.type === 'STRING') {
                emit(0x24); emit(t.value.length);
                for (var k = 0; k < t.value.length; k++) emit(t.value.charCodeAt(k));
                return 2; // String
            } else if ((t.type === 'KEYWORD' || t.type === 'IDENTIFIER') &&
                (t.value === 'LEN' || t.value === 'ASC' || t.value === 'MID$' ||
                    t.value === 'PEEKB' || t.value === 'PEEKW' || t.value === 'ADDR')) {

                var op = t.value;
                if (peek() && peek().value === '(') next(); // Eat (

                if (op === 'LEN') { // 0x96 S->I
                    parseExpression();
                    emit(0x96);
                    if (peek() && peek().value === ')') next();
                    return 0; // Int
                } else if (op === 'ASC') { // 0x8B S->I
                    parseExpression();
                    emit(0x8B);
                    if (peek() && peek().value === ')') next();
                    return 0; // Int
                } else if (op === 'MID$') { // 0xC2 S I I -> S
                    parseExpression(); // S
                    if (peek() && peek().value === ',') next();
                    parseExpression(); // I
                    if (peek() && peek().value === ',') next();
                    parseExpression(); // I
                    emit(0xC2);
                    if (peek() && peek().value === ')') next();
                    return 2; // String
                } else if (op === 'PEEKB') { // 0x9B I->I
                    parseExpression();
                    emit(0x9B);
                    if (peek() && peek().value === ')') next();
                    return 0; // Int
                } else if (op === 'PEEKW') { // 0x9C I->I
                    parseExpression();
                    emit(0x9C);
                    if (peek() && peek().value === ')') next();
                    return 0; // Int
                } else if (op === 'ADDR') {
                    // Expect Variable Name
                    var tVar = next();
                    if (tVar && tVar.type === 'IDENTIFIER') {
                        var targetName = tVar.value.toUpperCase();
                        var hasIndices = (peek() && peek().value === '(');

                        // Parse Indices first (if any)
                        if (hasIndices) {
                            next(); // Eat (

                            // Check for empty parens: ADDR(arr())
                            if (peek() && peek().value === ')') {
                                next(); // Eat )
                                // Implicitly reference the first element (Index 1)
                                emit(0x22); emitWord(1);
                            } else {
                                while (true) {
                                    parseExpression();
                                    if (peek() && peek().value === ',') { next(); continue; }
                                    if (peek() && peek().value === ')') { next(); break; }
                                    break;
                                }
                            }
                        }

                        // Lookup Symbol
                        var sym = symbols[targetName];
                        if (!sym) {
                            // Create temporary external symbol just for address?
                            // Logic borrowed from Assignment
                            sym = { name: targetName, type: 1, isExtern: true, index: externals.length };
                            var suffix = targetName.slice(-1);
                            if (suffix === '%') sym.type = 0;
                            else if (suffix === '$') sym.type = 2;
                            if (hasIndices) {
                                if (sym.type === 0) sym.type = 3;
                                else if (sym.type === 1) sym.type = 4;
                                else if (sym.type === 2) sym.type = 5;
                            }
                            externals.push(sym);
                        }

                        var type = sym.type;
                        if (hasIndices) {
                            if (type === 0) type = 3;
                            else if (type === 1) type = 4;
                            else if (type === 2) type = 5;
                        }

                        // Emit Push Addr
                        if (sym.isGlobal || sym.isLocal) {
                            emit(0x0D + type);
                            emitWord(sym.offset);
                        } else if (sym.isExtern) {
                            emit(0x14 + type);
                            if (sym.offset !== undefined) emitWord(sym.offset);
                            else emitWord(sym.index);
                        }

                        // Emit ADDR op
                        if (type === 2 || type === 5) {
                            //                             console.log("Emit ADDR String");
                            emit(0xC9); // String
                        }
                        else {
                            //                             console.log("Emit ADDR Int/Float (0x8A)");
                            emit(0x8A); // Int/Float
                        }
                    }
                    if (peek() && peek().value === ')') next();
                    return 0; // Int (Address)
                }
            } else if (t.type === 'IDENTIFIER' || t.type === 'KEYWORD') {
                var valName = t.value.toUpperCase(); // Full Name Lookup

                // --- 1. Field Access Check (A.Field) ---
                if (peek() && peek().value === '.') {
                    next(); // Consume .
                    // Expect Field Name
                    var tField = next();
                    if (tField && tField.type === 'IDENTIFIER') {
                        var logChar = valName; // A, B, C, D?
                        var logVal = -1;
                        if (logChar === 'A') logVal = 0;
                        else if (logChar === 'B') logVal = 1;
                        else if (logChar === 'C') logVal = 2;
                        else if (logChar === 'D') logVal = 3;

                        if (logVal !== -1) {
                            // Emit Field Access
                            // Opcode depends on type:
                            // 0x1A (Int), 0x1B (Flt), 0x1C (Str)
                            // 0x1D (IntRef), 0x1E (FltRef), 0x1F (StrRef) -- References?
                            // Expression result is usually Value.

                            var fName = tField.value.toUpperCase();
                            var type = 1; // Flt
                            if (fName.endsWith('%')) type = 0; // Int
                            else if (fName.endsWith('$')) type = 2; // Str

                            // 0x1A + type?
                            // 1A(Int), 1B(Flt), 1C(Str) -> 1A + 0=1A, 1A+1=1B, 1A+2=1C. Correct.
                            // 1. Push Field Name (String Literal)
                            emit(0x24);
                            emit(fName.length);
                            for (var k = 0; k < fName.length; k++) emit(fName.charCodeAt(k));

                            // 2. Emit Opcode (1A/1B/1C)
                            emit(0x1A + type);
                            // 3. Emit Logical Name Index
                            emit(logVal);

                            return type;
                        }
                    }
                    // If fall through (invalid logical name?), treat as error or weird syntax
                    error("Invalid Field Access syntax: " + valName + "." + (tField ? tField.value : ""));
                }

                // --- 2. Built-in Opcodes ---
                var builtinOp = activeOpcodes[valName];

                if (builtinOp) {
                    var def = QCODE_DEFS[builtinOp];
                    if (def && def.pushes === '') {
                        throw new Error("Error on line " + t.line + ": Syntax Error: '" + valName + "' is a command, not a function.");
                    }

                    // Check if it's a function using parenthesis: GET()
                    // Check if it's a function using parenthesis: GET()
                    if (peek() && peek().value === '(') {
                        next(); // Eat (

                        var def = QCODE_DEFS[builtinOp];
                        var expectedArgs = [];
                        if (def && def.pops) {
                            expectedArgs = def.pops.split(' ');
                        }

                        // Patch for ABS Polymorphism (Int 0x93 vs Float 0xA6)
                        if (valName === 'ABS') {
                            // Peek ahead to see likely argument type (naive check)
                            // or wait until we parse the expression and decide?
                            // We are inside the loop parsing arguments.
                            // But we need to set the Opcode *after* parsing arguments?
                            // No, typically we parse args then emit op.
                            // But we need to cast args based on expected type.
                            // Solution: Parse expression first, THEN decide if we need to switch Opcode.
                            // But we currently use expectedArgs to auto-cast.
                            // ABS (Int) expects 'I'. ABS (Float) expects 'F'.

                            // Let's defer strict type checking for ABS until we see the arg.
                            // We can parse the expression, see what we got, and THEN choose the op.
                        }

                        var argIdx = 0;
                        while (peek() && peek().value !== ')') {
                            var argType = parseExpression();

                            // Auto-Cast based on Opcode Signature

                            // Auto-Cast based on Opcode Signature
                            if (argIdx < expectedArgs.length) {
                                var req = expectedArgs[argIdx];
                                if (req === 'F' && argType === 0) {
                                    emit(0x86); // FLT
                                } else if (req === 'I' && argType === 1) {
                                    emit(0x87); // INT
                                } else if (req === 'L' && argType !== 0) { // Long/Addr? Usually I
                                    // No specific Long cast standardly used, but checking just in case
                                }
                            }

                            argIdx++;
                            if (peek() && peek().value === ',') next();
                        }
                        if (peek() && peek().value === ')') next(); // Eat )
                    }
                    emit(builtinOp);

                    // Dynamically determine return type from QCODE definitions
                    // This handles polymorphic functions (like ABS) where the opcode changes based on argument types.
                    if (QCODE_DEFS[builtinOp]) {
                        var pushes = QCODE_DEFS[builtinOp].pushes;
                        if (pushes === 'I') return 0; // Int
                        if (pushes === 'S') return 2; // String
                        return 1; // Default Float
                    }

                    // Fallback (Legacy behavior)
                    if (valName.endsWith('$')) return 2;
                    return 1; // Default Float
                }

                var sym = symbols[valName];

                // If Symbol Not Found -> Assume PROCEDURE CALL (Not Implicit External)
                if (!sym) {
                    if (t.type === 'KEYWORD') {
                        throw new Error("Error on line " + t.line + ": Reserved keyword '" + valName + "' cannot be used as an identifier or function.");
                    }

                    // Implicit Externals are dangerous (e.g. GETKEY%).
                    // OPL usually assumes undeclared ID is a PROC call.
                    // We emit 0x7D (PROC).

                    var procCallName = t.value; // Keep original case? Or User Pref?
                    // Usually Keep Case for Proc Names in calls, but Upper for lookup?
                    // QCode stores name.

                    // Parse Arguments (if any)
                    var argCount = 0;
                    if (peek() && peek().value === '(') {
                        next(); // Eat (
                        while (true) {
                            var tArg = parseExpression();
                            // Type Safety? 0x20 + type?
                            // Standard PROC arg passing? 
                            // The standard says: Pushes arguments?
                            // OPL runtime handles checking?
                            // We need to match 'emit' logic from line 1230ish (PROC statement).
                            // But here we are in expression.
                            // Does PROC return value? Yes.

                            // Replicate Proc Call argument logic:
                            // We just emit the expression code.
                            // But do we need type bytes?
                            // Line 1967 (Compiler view) logic for Call:
                            // "Interleave Type Byte (0=Int, 1=Float, 2=String)"
                            emit(0x20); emit(tArg);

                            argCount++;
                            if (peek() && peek().value === ',') { next(); continue; }
                            if (peek() && peek().value === ')') { next(); break; }
                            break;
                        }
                    }

                    // Emit Arg Count
                    emit(0x20); emit(argCount);

                    emit(0x7D); // PROC
                    emit(procCallName.length);
                    for (var k = 0; k < procCallName.length; k++) {
                        emit(procCallName.charCodeAt(k));
                    }

                    // Return Type
                    if (procCallName.endsWith('%')) return 0;
                    if (procCallName.endsWith('$')) return 2;
                    return 1;
                }

                if (sym) {
                    // Array Indices?
                    if (sym.type >= 3) {
                        if (peek() && peek().value === '(') {
                            next(); // Eat (
                            while (true) {
                                parseExpression(); // Push Index
                                if (peek() && peek().value === ',') { next(); continue; }
                                if (peek() && peek().value === ')') { next(); break; }
                                break;
                            }
                        }
                    }

                    if (sym.isParam || sym.isExtern) {
                        // Parameters and Externals use Opcodes 0x07+
                        emit(0x07 + sym.type);
                        // For Params, offset is set. For Externs, usually index or ptrOffset?
                        // If it's a Param, it definitely has an offset.
                        if (sym.offset !== undefined) emitWord(sym.offset);
                        else emitWord(sym.index);
                    } else if (sym.isGlobal || sym.isLocal) {
                        // Locals and Globals use Opcodes 0x00+
                        emit(0x00 + sym.type);
                        emitWord(sym.offset);
                    }

                    // Return type based on variable base type
                    var retType = sym.type;
                    if (retType >= 3) retType -= 3;
                    return retType;
                }
            } else if (t.value === '(') {
                var type = parseExpression();
                if (peek() && peek().value === ')') next(); // Eat )
                return type;
            }
            return 0; // Fallback
        }

        // --- Fixup System ---
        var fixups = []; // Stack of { addr: int, type: 'IF'|'WHILE'|'ELSE' }
        var loops = [];  // Stack of { start: int }
        var labels = {}; // Map Name -> Addr
        var labelFixups = []; // List of { addr: int, name: string }

        function emitFixup() {
            var addr = qcode.length;
            emitWord(0x0000); // Placeholder
            return addr;
        }

        function patchFixup(addr, target) {
            // Offset = Target - AddrOfOffset (which is addr)
            var offset = target - addr;
            qcode[addr] = (offset >> 8) & 0xFF;
            qcode[addr + 1] = offset & 0xFF;
        }

        // Pass 2: Generate Code
        ptr = 0;
        var implOffset = localOffset; // Start allocating after Locals (chaining)

        // Skip Header (Blind Check for First Identifier: or Identifier(..) pattern)
        // We assume the first construct is the PROC header.
        var skipHeader = false;
        if (tokens.length > 1 && tokens[0].type === 'IDENTIFIER') {
            if (tokens[1].value === ':') {
                ptr = 2; // Name:
                // Check if Params follow: Name:(...)
                if (ptr < tokens.length && tokens[ptr].value === '(') {
                    ptr++; // Eat (
                    while (ptr < tokens.length && tokens[ptr].value !== ')') ptr++;
                    ptr++; // Eat )
                }
                skipHeader = true;
            } else if (tokens[1].value === '(') {
                // Name(params):
                ptr = 2; // Name(
                while (ptr < tokens.length && tokens[ptr].value !== ')') ptr++;
                ptr++; // Eat )
                if (ptr < tokens.length && tokens[ptr].value === ':') ptr++;
                skipHeader = true;
            }
        }


        // If blind skip failed, rely on procName check fallback inside loop? 
        // No, blind skip covers 99% cases.
        // If file starts with empty line? Tokenizer usually skips EOL at start? 
        // If Header is token 4? 
        // Let's assume standard format.

        while (ptr < tokens.length) {
            var t = next();

            // Skip Declarations (already handled)
            if (t.type === 'KEYWORD' && (t.value === 'GLOBAL' || t.value === 'LOCAL')) {
                // Skip Identifier and Dims (Loop until EOL or :)
                while (ptr < tokens.length && tokens[ptr].type !== 'EOL' && tokens[ptr].value !== ':') ptr++;
                continue;
            }
            // Label Check moved to IDENTIFIER block


            if (t.type === 'KEYWORD') {
                if (t.value === 'PRINT' || t.value === 'LPRINT') {
                    var isLPrint = (t.value === 'LPRINT');
                    var suppressNewline = false;

                    while (true) {
                        var p = peek();
                        if (!p || p.type === 'EOL' || p.value === ':') break;

                        // Case 1: Comma Separator
                        if (p.value === ',') {
                            next(); // Consume ','
                            emit(isLPrint ? 0x77 : 0x72);
                            suppressNewline = true;
                            continue;
                        }

                        // Case 2: Semicolon Separator
                        if (p.value === ';') {
                            next(); // Consume ';'
                            suppressNewline = true;
                            continue;
                        }

                        // Case 3: Expression (Value to print)
                        var exprType = parseExpression();

                        // Emit the appropriate PRINT/LPRINT opcode based on expression type
                        if (!isLPrint) {
                            if (exprType === 0) emit(0x6F); // PRINT INT
                            else if (exprType === 1) emit(0x70); // PRINT FLT
                            else emit(0x71); // PRINT STR
                        } else {
                            if (exprType === 0) emit(0x74); // LPRINT INT
                            else if (exprType === 1) emit(0x75); // LPRINT FLT
                            else emit(0x76); // LPRINT STR
                        }

                        // Default behavior after a value is to emit a newline unless another separator follows
                        suppressNewline = false;
                    }

                    if (!suppressNewline) {
                        emit(isLPrint ? 0x78 : 0x73); // Newline (0x73=PRINT \n, 0x78=LPRINT \n)
                    }
                } else if (t.value === 'IF') {
                    var exprType = parseExpression(); // Condition
                    if (exprType === 1) { // Float
                        emit(0x23); emitFloat(0.0); // Push 0.0
                        emit(0x3A); // <>
                        exprType = 0; // Result Int
                    }
                    emit(0x7E); // BranchIfFalse
                    var fixupAddr = emitFixup();
                    fixups.push({ addr: fixupAddr, type: 'IF' });
                } else if (t.value === 'ELSE') {
                    // 1. Emit Jump to End (BranchAlways)
                    emit(0x51);
                    var elseFixup = emitFixup();

                    // 2. Resolve pending IF fixup to here
                    var ifFixup = fixups.pop();
                    if (ifFixup && ifFixup.type === 'IF') {
                        patchFixup(ifFixup.addr, qcode.length);
                    }

                    // 3. Push ELSE fixup
                    fixups.push({ addr: elseFixup, type: 'ELSE' });
                } else if (t.value === 'ELSEIF') {
                    // 1. Emit Jump to End (BranchAlways) for the previous block success path
                    emit(0x51);
                    var endFixup = emitFixup();

                    // 2. Resolve pending IF/ELSEIF condition failure to HERE
                    var prevCondFixup = fixups.pop();
                    if (prevCondFixup && (prevCondFixup.type === 'IF' || prevCondFixup.type === 'ELSEIF')) {
                        patchFixup(prevCondFixup.addr, qcode.length);
                    } else {
                        // Error state? or fallback
                        if (prevCondFixup) fixups.push(prevCondFixup); // Put back if not matching
                    }

                    // 3. Push ENDIF_MERGE fixup (Jump to End)
                    // We push it BEFORE the new condition fixup, so ENDIF can unwind it correctly.
                    // Stack: [Outer..., EndMerge, EndMerge, CurrentIF]
                    fixups.push({ addr: endFixup, type: 'ENDIF_MERGE' });

                    // 4. Parse New Condition
                    var exprType = parseExpression();
                    if (exprType === 1) { // Float
                        emit(0x23); emitFloat(0.0);
                        emit(0x3A);
                        exprType = 0;
                    }

                    // 5. Emit BranchIfFalse
                    emit(0x7E); // BranchIfFalse
                    var fixupAddr = emitFixup();
                    fixups.push({ addr: fixupAddr, type: 'IF' }); // Treat as IF for next chain

                } else if (t.value === 'ENDIF') {
                    // Resolve pending fixup (IF or ELSE) - The last condition check or ELSE block end
                    var fixup = fixups.pop();
                    if (fixup) {
                        patchFixup(fixup.addr, qcode.length);
                    }

                    // Unwind ENDIF_MERGE fixups (Jumps from successful IF/ELSEIF blocks)
                    while (fixups.length > 0 && fixups[fixups.length - 1].type === 'ENDIF_MERGE') {
                        fixup = fixups.pop();
                        patchFixup(fixup.addr, qcode.length);
                    }
                } else if (t.value === 'WHILE') {
                    var startAddr = qcode.length;
                    loops.push({ start: startAddr, type: 'WHILE', breaks: [] });

                    var exprType = parseExpression(); // Condition
                    if (exprType === 1) { // Float
                        emit(0x23); emitFloat(0.0);
                        emit(0x3A);
                        exprType = 0;
                    }
                    emit(0x7E); // BranchIfFalse
                    var fixupAddr = emitFixup();
                    fixups.push({ addr: fixupAddr, type: 'WHILE' });
                } else if (t.value === 'ENDWH') {
                    var loop = loops.pop();
                    var fixup = fixups.pop(); // WHILE exit fixup

                    // Emit Jump back to start
                    emit(0x51); // BranchAlways

                    // Offset = Target - CurrentArgAddr
                    // CurrentArgAddr = qcode.length;
                    // Target = loop.start
                    var offset = loop.start - qcode.length;
                    emitWord(offset); // Negative offset

                    // Patch loop exit fixup to here
                    patchFixup(fixup.addr, qcode.length);

                    // Patch BREAKs
                    for (var k = 0; k < loop.breaks.length; k++) {
                        patchFixup(loop.breaks[k], qcode.length);
                    }
                } else if (t.value === 'DO') {
                    loops.push({ start: qcode.length, type: 'DO', breaks: [], continues: [] });
                } else if (t.value === 'UNTIL') {
                    var loop = loops.pop();
                    if (!loop || loop.type !== 'DO') error("UNTIL without DO");

                    // Continues target: Condition Check (Here)
                    for (var k = 0; k < loop.continues.length; k++) {
                        patchFixup(loop.continues[k], qcode.length);
                    }

                    var exprType = parseExpression(); // Condition
                    if (exprType === 1) { // Float
                        emit(0x23); emitFloat(0.0);
                        emit(0x3A);
                        exprType = 0;
                    }

                    emit(0x7E); // BranchIfFalse (Jump Back)
                    var offset = loop.start - qcode.length;
                    emitWord(offset);

                    // Breaks target: After loop (Here)
                    for (var k = 0; k < loop.breaks.length; k++) {
                        patchFixup(loop.breaks[k], qcode.length);
                    }
                } else if (t.value === 'BREAK') {
                    if (loops.length === 0) error("BREAK outside loop");
                    var loop = loops[loops.length - 1];
                    emit(0x51); // GOTO
                    var addr = emitFixup();
                    loop.breaks.push(addr);
                } else if (t.value === 'CONTINUE') {
                    if (loops.length === 0) error("CONTINUE outside loop");
                    var loop = loops[loops.length - 1];
                    if (loop.type === 'WHILE') {
                        // GOTO Start
                        emit(0x51);
                        var offset = loop.start - qcode.length;
                        emitWord(offset);
                    } else if (loop.type === 'DO') {
                        // GOTO Condition (Forward fixup)
                        emit(0x51);
                        var addr = emitFixup();
                        loop.continues.push(addr);
                    }
                } else if (t.value === 'POKEB' || t.value === 'POKEW') {
                    // POKEB addr, value
                    // POKEW addr, value
                    parseExpression(); // Addr (Int) -> Stack
                    if (peek() && peek().value === ',') next();
                    parseExpression(); // Value (Int) -> Stack

                    // Emit 0x55 (POKEB) or 0x56 (POKEW)
                    emitCommand(t.value === 'POKEB' ? 0x55 : 0x56);
                } else if (t.value === 'PAUSE') {
                    parseExpression(); // Duration (Int)
                    emitCommand(0x54); // PAUSE opcode
                } else if (t.value === 'BEEP') {
                    // BEEP duration, frequency
                    parseExpression(); // Duration
                    if (peek() && peek().value === ',') next();
                    parseExpression(); // Frequency
                    emitCommand(0x4D);
                } else if (t.value === 'AT') {
                    // AT column, row
                    parseExpression(); // Column
                    if (peek() && peek().value === ',') next();
                    parseExpression(); // Row
                    emitCommand(0x4C);
                } else if (t.value === 'CLS') {
                    emitCommand(0x4E);
                } else if (t.value === 'STOP') {
                    emitCommand(0x59);
                } else if (t.value === 'TRAP') {
                    pendingTrap = true;
                } else if (t.value === 'ESCAPE') {
                    // ESCAPE ON/OFF
                    var nextT = next();
                    emitCommand(0x50);
                    if (nextT.value === 'ON') { emit(0x01); }
                    else if (nextT.value === 'OFF') { emit(0x00); }
                    else error("ESCAPE requires ON or OFF");
                } else if (t.value === 'CURSOR') {
                    // CURSOR ON/OFF
                    var nextT = next();
                    emitCommand(0x4F);
                    if (nextT.value === 'ON') { emit(0x01); }
                    else if (nextT.value === 'OFF') { emit(0x00); }
                    else error("CURSOR requires ON or OFF");
                } else if (t.value === 'RANDOMIZE') {
                    var type = parseExpression(); // Float Seed
                    if (type === 0) emit(0x86); // FLT
                    emitCommand(0x58);
                } else if (t.value === 'RAISE') {
                    parseExpression(); // Int Error Code
                    emitCommand(0x57);
                } else if (t.value === 'OFF') {
                    // Check for optional duration (LZ OFF: 0xD2)
                    var hasArg = false;
                    var p = peek();
                    if (p && (p.type === 'INTEGER' || p.type === 'FLOAT' || p.type === 'HEX' || p.value === '(' || (p.type === 'IDENTIFIER' && activeKeywords.indexOf(p.value) === -1))) {
                        hasArg = true;
                    }

                    if (hasArg) {
                        parseExpression();
                        emitCommand(0xD2);
                    } else {
                        emitCommand(0x52);
                    }
                } else if (t.value === 'DISP') {
                    // DISP mode, msg$ (Returns Key Code Int -> Needs DROP)
                    parseExpression(); // mode
                    if (peek() && peek().value === ',') next();
                    parseExpression(); // msg$
                    emitCommand(0x8D);
                    emit(0x83); // DROP Int
                } else if (t.value === 'COPYW') {
                    // COPYW src$, dest$
                    parseExpression(); // src$
                    if (peek() && peek().value === ',') next();
                    parseExpression(); // dest$
                    emitCommand(0xD3);

                } else if (t.value === 'DELETE') {
                    // DELETE file$ (0x5F)
                    parseExpression(); // file$
                    emitCommand(0x5F);
                } else if (t.value === 'DELETEW') {
                    // DELETEW file$ (0xD4)
                    parseExpression(); // file$
                    emitCommand(0xD4);
                } else if (t.value === 'INPUT') {
                    // INPUT var
                    var tVar = next();
                    if (!tVar || tVar.type !== 'IDENTIFIER') error("INPUT expects variable");

                    var targetName = tVar.value.toUpperCase();
                    var hasIndices = (peek() && peek().value === '(');

                    // Parse Indices first (if any)
                    if (hasIndices) {
                        next(); // Eat (
                        while (true) {
                            parseExpression();
                            if (peek() && peek().value === ',') { next(); continue; }
                            if (peek() && peek().value === ')') { next(); break; }
                            break;
                        }
                    }

                    // Lookup Symbol
                    var sym = symbols[targetName];
                    if (!sym) {
                        // Implicit External
                        var suffix = targetName.slice(-1);
                        var type = 1; // Default Flt
                        if (suffix === '%') type = 0;
                        else if (suffix === '$') type = 2;

                        sym = { name: targetName, type: type, isExtern: true, index: externals.length };
                        if (hasIndices) {
                            if (type === 0) sym.type = 3; else if (type === 1) sym.type = 4; else if (type === 2) sym.type = 5;
                        }
                        externals.push(sym);
                        symbols[targetName] = sym;
                    }

                    var type = sym.type;
                    var baseType = type;
                    if (hasIndices) {
                        // Dereference Array Type for Input? 
                        // No, OPL uses base type opcodes for INPUT, but Address must be element address.
                        if (type >= 3) baseType -= 3;
                    } else {
                        // If it is array name without indices? -> Invalid?
                        // "INPUT arr()" usually implied?
                    }

                    // Emit Push Addr
                    // Locals/Globals: 0x0D + type
                    // Externals: 0x14 + type
                    var addrOpBase = (sym.isExtern) ? 0x14 : 0x0D;
                    emit(addrOpBase + type);
                    if (sym.isExtern) {
                        if (sym.offset !== undefined) emitWord(sym.offset);
                        else emitWord(sym.index);
                    } else {
                        emitWord(sym.offset);
                    }

                    // Emit INPUT Opcode
                    // 6C=Int, 6D=Flt, 6E=Str
                    if (baseType === 0) emitCommand(0x6C);
                    else if (baseType === 1) emitCommand(0x6D);
                    else if (baseType === 2) emitCommand(0x6E);
                    else emitCommand(0x6D); // Default Float

                } else if (t.value === 'CREATE' || t.value === 'OPEN') {
                    // CREATE/OPEN spec$, log, f1, f2...
                    var isCreate = (t.value === 'CREATE');
                    var opcode = isCreate ? 0x5E : 0x65;

                    parseExpression(); // spec$
                    emitCommand(opcode);

                    if (peek() && peek().value === ',') next();

                    // Logical Name vs Field Heuristic
                    // OPEN "File", A, f1... vs OPEN "File", f1...
                    var logVal = 0; // Default A
                    var consumedLog = false;

                    var tNext = peek();
                    if (tNext && tNext.type === 'IDENTIFIER') {
                        var val = tNext.value.toUpperCase();
                        if (['A', 'B', 'C', 'D'].includes(val) && val.length === 1) {
                            // Explicit Logical Name
                            next(); // Consume
                            logVal = val.charCodeAt(0) - 65;
                            consumedLog = true;
                        }
                    }
                    emit(logVal);

                    // Fields
                    // If we consumed LogName, we expect comma before fields.
                    // If we did NOT, we are already potentially at the first field (or EOL).

                    var firstField = true;
                    while (true) {
                        if (firstField && !consumedLog) {
                            // Implicit A case: We might be standing on the field name
                            // Check if we have a field
                            var p = peek();
                            if (!p || p.type === 'EOL' || p.value === ':') break;
                            // Proceed to process p as field
                            firstField = false;
                        } else {
                            // Standard case: Expect comma
                            if (peek() && peek().value === ',') {
                                next(); // Eat comma
                            } else {
                                break; // No comma, ensure end
                            }
                        }

                        var fToken = next();
                        if (fToken && fToken.type === 'IDENTIFIER') {
                            var fName = fToken.value.toUpperCase();
                            var type = 1; // Default Float
                            var suffix = fName.slice(-1);

                            if (suffix === '%') { type = 0; }
                            else if (suffix === '$') { type = 2; }

                            emit(type);
                            emit(fName.length);
                            for (var k = 0; k < fName.length; k++) emit(fName.charCodeAt(k));
                        }
                    }
                    emit(0x88); // Terminator
                } else if (t.value === 'VIEW') {
                    // VIEW(id, str)
                    if (peek() && peek().value === '(') next();
                    parseExpression();
                    if (peek() && peek().value === ',') next();
                    parseExpression();
                    if (peek() && peek().value === ')') next();
                    emitCommand(0xA0);
                    emit(0x83); // DROP explicitly as it pushes 'I'
                } else if (t.value === 'MENU') {
                    parseExpression(); emitCommand(0x98);
                } else if (t.value === 'KSTAT') {
                    parseExpression(); emitCommand(0x6A);
                } else if (t.value === 'CLOCK') {
                    parseExpression(); emitCommand(0xD6); emit(0x83); // DROP Int
                } else if (t.value === 'EDIT') {
                    // EDIT var$
                    var tVar = next();
                    if (tVar.type !== 'IDENTIFIER') error("EDIT expects variable");
                    var targetName = tVar.value.toUpperCase();
                    var hasIndices = (peek() && peek().value === '(');

                    // Parse Indices first (if any)
                    if (hasIndices) {
                        next(); // Eat (
                        while (true) {
                            parseExpression();
                            if (peek() && peek().value === ',') { next(); continue; }
                            if (peek() && peek().value === ')') { next(); break; }
                            break;
                        }
                    }

                    // Lookup Symbol
                    var sym = symbols[targetName];
                    if (!sym) {
                        // Create temporary external symbol just for address
                        sym = { name: targetName, type: 1, isExtern: true, index: externals.length };
                        var suffix = targetName.slice(-1);
                        if (suffix === '%') sym.type = 0;
                        else if (suffix === '$') sym.type = 2;
                        if (hasIndices) {
                            if (sym.type === 0) sym.type = 3;
                            else if (sym.type === 1) sym.type = 4;
                            else if (sym.type === 2) sym.type = 5;
                        }
                        externals.push(sym);
                    }

                    var type = sym.type;
                    if (hasIndices) {
                        if (type === 0) type = 3;
                        else if (type === 1) type = 4;
                        else if (type === 2) type = 5;
                    }

                    // Emit Push Addr
                    if (sym.isGlobal || sym.isLocal) {
                        emit(0x0D + type);
                        emitWord(sym.offset);
                    } else if (sym.isExtern) {
                        emit(0x14 + type);
                        if (sym.offset !== undefined) emitWord(sym.offset);
                        else emitWord(sym.index);
                    }
                    emitCommand(0x6B);
                } else if (t.value === 'USE') {
                    var arg = next(); // Expect A, B, C, D
                    var val = 0;
                    if (arg && arg.type === 'IDENTIFIER') {
                        var name = arg.value.toUpperCase();
                        if (name === 'B') val = 1;
                        else if (name === 'C') val = 2;
                        else if (name === 'D') val = 3;
                        // Default A=0
                    }
                    emitCommand(0x69);
                    emit(val);
                } else if (t.value === 'APPEND') {
                    emitCommand(0x5B);
                } else if (t.value === 'UPDATE') {
                    emitCommand(0x68);
                } else if (t.value === 'FIRST') {
                    emitCommand(0x61);
                } else if (t.value === 'LAST') {
                    emitCommand(0x62);
                } else if (t.value === 'NEXT') {
                    emitCommand(0x63);
                } else if (t.value === 'BACK') {
                    emitCommand(0x64);
                } else if (t.value === 'EXT') {
                    var exprType = parseExpression(); // Should be Int Constant
                    // Ideally we should check if it was a literal, but parseExpression emits 0x22 (Int) or 0x20.
                    // Actually EXT opcode ED expects 'b' (byte) param inline?
                    // Decompiler constants says: 0XED: { args: 'b', ... }
                    // So we must emit 0xED followed by byte literal.
                    // But parseExpression emits Pushes.
                    // We need to parse a CONSTANT here.
                    // Since parseExpression consumes tokens, we're stuck.
                    // BUT, EXT is usually `EXT 5`.
                    // We can backtrack or use next() if we expect a literal.
                    // Let's assume usage EXT <byte>.
                    // Wait, parseExpression was called? No, I haven't written the code yet.

                    // Correct Implementation:
                    if (peek() && (peek().type === 'INTEGER' || peek().type === 'HEX')) {
                        var val = next().value;
                        if (val < 0 || val > 255) error("EXT argument out of range");
                        emit(0xED); emit(val);
                    } else {
                        // Fallback: Parse expression? No, EXT requires immediate byte.
                        error("EXT requires byte constant");
                    }
                } else if (t.value === 'CLOSE') {
                    emitCommand(0x5C);
                } else if (t.value === 'DELETE') {
                    parseExpression(); // Filename
                    emitCommand(0x5F);
                } else if (t.value === 'POSITION') {
                    parseExpression(); emitCommand(0x66);
                } else if (t.value === 'ERASE') {
                    emitCommand(0x60);
                } else if (t.value === 'RENAME') {
                    parseExpression(); if (peek() && peek().value === ',') next();
                    parseExpression(); emitCommand(0x67);
                } else if (t.value === 'COPY') {
                    parseExpression(); if (peek() && peek().value === ',') next();
                    parseExpression(); emitCommand(0x5D);
                } else if (t.value === 'GOTO') {
                    emit(0x51);
                    var fixupAddr = emitFixup();
                    var labelName = peek().value;
                    labelFixups.push({ addr: fixupAddr, name: labelName });
                    next(); // Consume Label Name
                    // Consume optional ::
                    if (peek() && peek().value === ':') next();
                    if (peek() && peek().value === ':') next();
                } else if (t.value === 'ONERR') {
                    if (peek() && peek().value === 'OFF') {
                        next();
                        emit(0x53); emit(0x00); emit(0x00); // ONERR OFF (Displace 0000)
                    } else {
                        // ONERR Label
                        emit(0x53);
                        var fixupAddr = emitFixup();
                        var labelName = peek().value;
                        labelFixups.push({ addr: fixupAddr, name: labelName });
                        next(); // Consume Label Name
                        // Consume optional ::
                        if (peek() && peek().value === ':') next();
                        if (peek() && peek().value === ':') next();
                    }
                } else if (t.value === 'UDG') {
                    // UDG args... (9 integers: Char + 8 Bytes)
                    for (var u = 0; u < 9; u++) {
                        parseExpression();
                        if (u < 8) {
                            if (peek() && peek().value === ',') next();
                        }
                    }
                    emitCommand(0xD5);
                } else if (t.value === 'RETURN') {
                    if (peek() && (peek().type === 'EOL' || peek().value === ':')) {
                        // Bare RETURN -> Default based on Proc Type?
                        // User spec says default to 7B (Float) generally, 
                        // But if Proc is Int?
                        // Existing logic was 7B.
                        // Let's keep 7B for bare return unless logic dictates otherwise.
                        emit(0x7B);
                    } else {
                        // Special case for literals to match reference optimizations
                        var pType = parseType(procName);

                        if (peek().type === 'INTEGER' && peek().value === 0) {
                            // IF Proc is Float, User explicitly requests QCode 86 (FLT) cast for RETURN 0.
                            // So we DO NOT optimize to 0x7B.
                            if (pType === 1) {
                                // Fall through to standard expression parsing?
                                // Parse 0 -> Stack. Cast -> 0x86. Return -> 0x79.
                                var exprType = parseExpression(); // Consumes 0
                                if (exprType === 0) emit(0x86); // FLT
                                emit(0x79);
                            } else {
                                next(); // Consume 0
                                emit(0x7A); // Return Int 0
                            }
                        } else if (peek().type === 'FLOAT' && peek().value === 0) {
                            next();
                            if (pType === 0) {
                                emit(0x7A); // Int Proc: Return 0.0 -> Return Int 0 (7A)
                            } else {
                                // Float Proc: Explicit Return 0.0 per user request
                                emit(0x23); // Push Float Literal
                                emitFloat(0.0);
                                emit(0x79); // RET
                            }
                        } else if (peek().type === 'STRING' && peek().value === "") {
                            next(); emit(0x7C);
                        } else {
                            var exprType = parseExpression();
                            // Auto-cast return value?
                            if (pType === 1 && exprType === 0) emit(0x86); // FLT
                            else if (pType === 0 && exprType === 1) emit(0x87); // INT

                            emit(0x79);
                        }
                    }
                } else {
                    // Bare RETURN -> Return 0.0 (0x7B) per request check? 
                    // "default return type for a procedure should be changed to 7B"
                    // User also: "The default return type for a procedure should be changed to 7B (float)."
                    // This implies bare RETURN is 0.0.
                    emit(0x7B);
                }
            } else if (t.type === 'IDENTIFIER') {
                var isCall = false;
                var isLabel = false;
                var isAssign = false;
                var hasIndices = false;

                // Lookahead for Assignment
                if (peek() && peek().value === '=') {
                    isAssign = true;
                } else if (peek() && peek().value === '(') {
                    // Check if it is Array Assignment: A(1)=...
                    // Scan forward respecting parenthesis depth
                    var p = ptr; // ptr points to next token (the '(' )
                    var depth = 0;
                    // We need to scan starting from the '('.
                    // ptr is index of next token. tokens[ptr] is '('.
                    while (p < tokens.length) {
                        if (tokens[p].value === '(') depth++;
                        else if (tokens[p].value === ')') depth--;

                        p++;
                        if (depth === 0) break;
                    }

                    if (p < tokens.length && tokens[p].value === '=') {
                        isAssign = true;
                        hasIndices = true;
                    }
                }

                if (!isAssign) {
                    // Check for Field Access (Logical.Field) in Statement Context
                    if (peek() && peek().value === '.') {
                        var logChar = t.value.toUpperCase();
                        if (logChar.length === 1 && ['A', 'B', 'C', 'D'].includes(logChar)) {
                            next(); // Consume .
                            var fTok = next(); // Consume Field Name
                            if (fTok && fTok.type === 'IDENTIFIER') {
                                var fName = fTok.value.toUpperCase();
                                var logVal = logChar.charCodeAt(0) - 65;
                                var type = 1; // Flt
                                if (fName.endsWith('%')) type = 0;
                                else if (fName.endsWith('$')) type = 2;

                                // 1. Push Field Name String
                                emit(0x24);
                                emit(fName.length);
                                for (var k = 0; k < fName.length; k++) emit(fName.charCodeAt(k));

                                // Check for Assignment: A.f = ...
                                if (peek() && peek().value === '=') {
                                    next(); // Consume =

                                    // Emit Field Ref (1D/1E/1F)
                                    emit(0x1D + type);
                                    emit(logVal);

                                    // Parse RHS
                                    var rhsType = parseExpression();

                                    // Auto-Cast
                                    if (type === 0 && rhsType === 1) emit(0x87); // INT
                                    else if (type === 1 && rhsType === 0) emit(0x86); // FLT

                                    // Assign Opcode (7F/80/81)
                                    emit(0x7F + type);
                                } else {
                                    // Statement: A.f (Emit Value + Drop)
                                    // Emit Field Value (1A/1B/1C)
                                    emit(0x1A + type);
                                    emit(logVal);

                                    // Drop
                                    if (type === 0) emit(0x83);
                                    else if (type === 2) emit(0x85);
                                    else emit(0x84);
                                }
                                continue;
                            }
                        }
                    }

                    // Check Colon logic
                    if (peek() && peek().value === ':') {
                        next(); // Consume first colon
                        if (peek() && peek().value === ':') {
                            next();
                            isLabel = true;
                            labels[t.value] = qcode.length; // Record Label Address
                        }
                        else {
                            if (t.value.toUpperCase() === procName.toUpperCase()) isLabel = true;
                            else isCall = true;
                        }
                    } else {
                        // Strict Syntax: Procedure calls must have arguments OR be followed by a colon
                        if (peek() && peek().value === '(') {
                            isCall = true;
                        } else {
                            error("Procedure call '" + t.value + "' must be followed by ':' or have arguments");
                        }
                    }
                }

                if (isLabel) continue;

                if (isAssign) {
                    var targetName = t.value.toUpperCase(); // Keep suffix!
                    var sym = symbols[targetName];

                    if (!sym) {
                        // Implicit References are treated as EXTERNAL in this QCode dialect
                        var suffix = targetName.slice(-1);
                        var type = 1; // Default Float
                        if (suffix === '%') type = 0;
                        else if (suffix === '$') type = 2; // Str

                        // Check for Array usage to upgrade type
                        if (hasIndices) {
                            if (type === 0) type = 3; // Int Array
                            else if (type === 1) type = 4; // Float Array
                            else if (type === 2) type = 5; // Str Array
                        }

                        // Determine Size for Offset
                        var varSize = 8; // Float default
                        if (type === 0) varSize = 2; // Int
                        else if (type === 1) varSize = 8; // Float
                        // Implicit Strings/Arrays treated as Pointers (Size 2)?
                        // Logic derived from Reference A%(-4), B(-12) -> Diff 8. 
                        // C? E$? If they are pointers, size 2.
                        else varSize = 2; // String/Array Pointer?

                        implOffset -= varSize;
                        var finalOffset = implOffset;

                        // Create External Symbol
                        sym = {
                            name: targetName,
                            type: type,
                            index: externals.length,
                            offset: finalOffset, // Save Offset
                            isExtern: true,
                            dims: []
                        };

                        symbols[targetName] = sym;
                        externals.push(sym);
                    }

                    if (sym) {
                        // Parse Indices
                        if (hasIndices) {
                            next(); // Eat (
                            while (true) {
                                parseExpression(); // Push Index
                                if (peek() && peek().value === ',') { next(); continue; }
                                if (peek() && peek().value === ')') { next(); break; }
                                break;
                            }
                        }

                        // Push Ref (LHS)
                        if (sym.isGlobal || sym.isLocal) {
                            //                             console.log("Emit LHS Local/Global Ref:", sym.name, "Type:", sym.type, "Offset:", sym.offset);
                            emit(0x0D + sym.type);
                            emitWord(sym.offset);
                        } else if (sym.isExtern) {
                            //                             console.log("Emit LHS Extern Ref:", sym.name, "Type:", sym.type, "Index:", sym.index);
                            // External Ref Base is 0x14 for assignment
                            emit(0x14 + sym.type);
                            if (sym.offset !== undefined) emitWord(sym.offset);
                            else emitWord(sym.index);
                        }

                        next(); // Eat =
                        var rhsType = parseExpression(); // Value
                        //                         console.log("RHS Parsed. Type:", rhsType);

                        // Auto-Cast if types differ
                        var baseType = sym.type;
                        if (baseType >= 3) baseType -= 3; // Normalize Array types to underlying type

                        if (baseType === 0 && rhsType === 1) {
                            // Target is Int, Value is Float -> Emit INT
                            emit(0x87);
                        } else if (baseType === 1 && rhsType === 0) {
                            // Target is Float, Value is Int -> Emit FLT
                            emit(0x86);
                        }

                        // Assign Opcode
                        //                         console.log("Emit ASSIGN Opcode:", 0x7F + baseType);
                        emit(0x7F + baseType);
                    }
                } else if (isCall) {
                    // Built-in or Procedure Call
                    var procCallName = t.value;
                    var upperName = procCallName.toUpperCase();
                    var returnType = 1; // Default Float
                    if (procCallName.endsWith('%')) returnType = 0; // Int
                    else if (procCallName.endsWith('$')) returnType = 2; // String

                    // Check for Built-in mapping
                    var builtinOp = activeOpcodes[upperName];
                    if (builtinOp) {

                        var intBuiltins = [
                            'GET', 'KEY', 'POS', 'COUNT', 'EOF', 'ERR', 'DAY', 'HOUR', 'MINUTE', 'MONTH', 'SECOND', 'YEAR',
                            'FREE', 'RECSIZE', 'FIND', 'LEN', 'LOC', 'ASC', 'ADDR', 'VIEW', 'PEEKB', 'PEEKW', 'USR', 'DOW', 'WEEK', 'FDAYS', 'EXIST',
                            'CLOCK', 'FINDW', 'MENUN'
                        ];
                        if (intBuiltins.includes(upperName)) returnType = 0;
                        if (upperName.endsWith('$')) returnType = 2;
                    }

                    // Parse Arguments
                    var argTypes = [];
                    if (peek() && peek().value === '(') {
                        next(); // Eat (
                        while (true) {
                            var tArg = parseExpression(); // Emits code for Arg
                            if (!builtinOp) {
                                // Interleave Type Byte (0=Int, 1=Float, 2=String)
                                emit(0x20); emit(tArg);
                            }
                            argTypes.push(tArg);
                            if (peek() && peek().value === ',') { next(); continue; }
                            if (peek() && peek().value === ')') { next(); break; }
                            break;
                        }
                    }
                    var argCount = argTypes.length;

                    if (builtinOp) {
                        emit(builtinOp);
                    } else {
                        // 1. Push Arg Count LAST
                        emit(0x20); emit(argCount);

                        // 2. Emit PROC Opcode
                        emit(0x7D);

                        // 3. Emit Name
                        // Name is stored inline: [Len] [Chars]
                        emit(procCallName.length);
                        for (var k = 0; k < procCallName.length; k++) {
                            emit(procCallName.charCodeAt(k));
                        }
                    }

                    // 4. Emit DROP (Discard return value if used as statement)
                    // 0x82=DROP Byte?, 0x83=DROP Int, 0x84=DROP Float, 0x85=DROP String
                    if (returnType === 0) emit(0x83);
                    else if (returnType === 2) emit(0x85);
                    else emit(0x84);
                }
            }
        }

        // Only emit implicit RETURN if the last instruction wasn't a RETURN
        if (qcode[qcode.length - 1] !== 0x7A &&
            qcode[qcode.length - 1] !== 0x7B &&
            qcode[qcode.length - 1] !== 0x7C &&
            qcode[qcode.length - 1] !== 0x79) { // Check 79 too
            emit(0x7B); // Implicit Return 0.0
        }

        // Check for Unclosed Blocks
        if (loops.length > 0) error("Unclosed loop (DO/WHILE) at end of file");

        var unclosedIfs = fixups.filter(function (f) { return f.type === 'IF' || f.type === 'ELSE' || f.type === 'ELSEIF'; });
        if (unclosedIfs.length > 0) error("Unclosed IF block at end of file");

        // Backpatch Label Fixups (GOTO/ONERR)
        for (var i = 0; i < labelFixups.length; i++) {
            var f = labelFixups[i];
            if (labels[f.name] !== undefined) {
                patchFixup(f.addr, labels[f.name]);
            } else {
                // 
                //                 console.warn("Compiler: Undefined Label " + f.name);
            }
        }

        // Build Tables with BE Endianness
        var globalTable = [];
        for (var i = 0; i < globals.length; i++) {
            var g = globals[i];
            globalTable.push(g.name.length);
            for (var k = 0; k < g.name.length; k++) globalTable.push(g.name.charCodeAt(k));
            globalTable.push(g.type);
            // Globals have Word Offset (BE)
            globalTable.push((g.offset >> 8) & 0xFF, g.offset & 0xFF);
        }
        // Align Table to Word boundary
        // Removed per user feedback: GT should be tight packed (47 bytes, not 48)
        // if (globalTable.length % 2 !== 0) globalTable.push(0x00);

        var externalTable = [];
        for (var i = 0; i < externals.length; i++) {
            var e = externals[i];
            externalTable.push(e.name.length);
            for (var k = 0; k < e.name.length; k++) externalTable.push(e.name.charCodeAt(k));
            externalTable.push(e.type);
        }

        // Final Assembly Offsets (Relative to OPL Header start)
        // Order: Header(4) + Params(N+1) + Globals + Externals + Fixups + QCode + Source
        var paramBlockSize = 1 + params.length;
        var headerBlockSize = 4; // VarSpace(2) + QCodeSize(2). ParamCount is part of paramBlock.

        // Build Fixup Tables
        // (Format: [StrSize BE] [StrData...] [ArrSize BE] [ArrData...])
        var strFixupTable = [];
        var strFixupData = [];
        for (var i = 0; i < strFixups.length; i++) {
            var f = strFixups[i];
            strFixupData.push((f.addr >> 8) & 0xFF, f.addr & 0xFF, f.len & 0xFF);
        }
        strFixupTable.push((strFixupData.length >> 8) & 0xFF, strFixupData.length & 0xFF);
        strFixupTable = strFixupTable.concat(strFixupData);

        var arrFixupTable = [];
        var arrFixupData = [];
        for (var i = 0; i < arrFixups.length; i++) {
            var f = arrFixups[i];
            arrFixupData.push((f.addr >> 8) & 0xFF, f.addr & 0xFF, (f.len >> 8) & 0xFF, f.len & 0xFF);
        }
        arrFixupTable.push((arrFixupData.length >> 8) & 0xFF, arrFixupData.length & 0xFF);
        arrFixupTable = arrFixupTable.concat(arrFixupData);

        var fixupTable = strFixupTable.concat(arrFixupTable);

        var globalOff = headerBlockSize + paramBlockSize;
        var externOff = globalOff + 2 + globalTable.length;
        var fixupOff = externOff + 2 + externalTable.length;
        var qcodeOff = fixupOff + fixupTable.length;
        var sourceOff = qcodeOff + qcode.length;


        // Minimum variable space is 2 bytes
        if (varSpaceSize < 2) varSpaceSize = 2;

        var output = [];
        // 1. OPL Header (Pattern 1: Procedural)
        // Offset 0: VarSpace BE
        // Offset 2: QCodeSize BE
        // Offset 4: NumParams
        output.push((varSpaceSize >> 8) & 0xFF, varSpaceSize & 0xFF); // VarSpace
        output.push((qcode.length >> 8) & 0xFF, qcode.length & 0xFF); // QCodeSize

        // 2. Params (Offset 4)
        output.push(params.length & 0xFF);
        for (var i = params.length - 1; i >= 0; i--) output.push(params[i]);

        // 3. Global Table (Size is BE)
        output.push((globalTable.length >> 8) & 0xFF, globalTable.length & 0xFF);
        output = output.concat(globalTable);

        // 4. External Table (Size is BE)
        output.push((externalTable.length >> 8) & 0xFF, externalTable.length & 0xFF);
        output = output.concat(externalTable);

        // 5. Fixup Table
        output = output.concat(fixupTable);

        // 6. QCode
        output = output.concat(qcode);

        // 7. Source (Optional, empty for now)

        return new Uint8Array(output);
    }

    // Wrapper for Tokenizer to be safe
    function tokenizer(s) {
        try {
            return tokenize(s);
        } catch (e) {
            // console.error("Tokenization Error", e);
            return [];
        }
    }

    return {
        compile: compile
    };
})();

if (typeof window !== 'undefined') {
    window.OPLCompiler = OPLCompiler;
}
if (typeof module !== 'undefined') {
    module.exports = OPLCompiler;
}
