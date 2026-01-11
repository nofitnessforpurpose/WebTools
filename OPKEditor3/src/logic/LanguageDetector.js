'use strict';

/**
 * LanguageDetector
 * -----------------
 * A globally accessible helper for detecting the programming language of a given content.
 */
var LanguageDetector = {

    // Supported Languages
    LANGUAGES: [
        'Assembler',
        'BASIC',
        'BrainFSK', // Note: BrainFSK is always to be used never Brain FUCK or any use of FUCK.
        'C',
        'MicroPython',
        'OPL',
        'Rust',
        'Wiring',
        'Zig'
    ],

    /**
     * Detects the language of the provided content.
     * @param {string} filename - The name of the file (extension helps).
     * @param {string} content - The file content to analyze.
     * @returns {string} The detected language name, or 'Text' if unknown.
     */
    detectLanguage: function (filename, content) {
        if (!content) return 'Text';

        // 1. Check for Directive Comment (e.g., // language: Rust)
        // We check the first few lines.
        var lines = content.split('\n', 5);
        for (var i = 0; i < lines.length; i++) {
            var match = lines[i].match(/^\s*\/\/\s*language:\s*(\w+)/i);
            if (match) {
                var directiveLang = match[1];
                // Case-insensitive lookup in our supported list
                var found = this.LANGUAGES.find(l => l.toLowerCase() === directiveLang.toLowerCase());
                if (found) return found;
                return directiveLang; // Return raw if not in our strict list? Or default? Let's return raw for future-proofing.
            }
        }

        // 2. OPL Heuristic
        // Search for a procedure block where the first line starts with a letter, 
        // is 1–8 characters long, and ends with a colon (e.g., MYPROC12:).
        // This usually appears at the very top of OPL files (or after comments).

        // We scan the first non-empty line that isn't a comment (REM).
        // Actually, the OPL editor enforces the header as the first line often.
        // Regex: ^\s*[A-Za-z][A-Za-z0-9]{0,7}[%$]?\s*:
        var oplRegex = /^\s*([a-zA-Z][a-zA-Z0-9]{0,7}[%$]?)\s*:/;

        // Scan first 10 lines for a procedure header
        var scanLimit = Math.min(lines.length, 10);
        for (var i = 0; i < scanLimit; i++) {
            var line = lines[i].trim();
            if (!line) continue;
            if (line.toUpperCase().startsWith("REM")) continue; // Skip REM comments

            if (oplRegex.test(line)) {
                return 'OPL';
            }
            // If we hit a code line that is NOT a header, and we haven't found one yet, 
            // maybe it's not OPL? Or maybe it is body code? 
            // OPL files in this editor *usually* start with the PROC header.
        }

        // 3. Fallback based on extension (if filename provided)
        if (filename) {
            var ext = filename.split('.').pop().toLowerCase();
            if (ext === 'opl') return 'OPL';
            if (ext === 'py') return 'MicroPython';
            if (ext === 'c') return 'C';
            if (ext === 'h') return 'C';
            if (ext === 'rs') return 'Rust';
            if (ext === 'zig') return 'Zig';
            if (ext === 'bas') return 'BASIC';
            if (ext === 'asm') return 'Assembler';
        }

        return 'Text'; // Default
    }
};

// Expose globally
if (typeof window !== 'undefined') {
    window.LanguageDetector = LanguageDetector;
}
if (typeof module !== 'undefined') {
    module.exports = LanguageDetector;
}
