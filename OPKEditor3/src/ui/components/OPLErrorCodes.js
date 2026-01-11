var OPLErrorCodes = (function () {
    var doc = document;
    var win = window;

    // Error Data
    var ERROR_DATA = [
        { code: 255, short: "NO ALLOC CELLS", long: "Seen only when running machine language routines which access internal buffer space." },
        { code: 254, short: "OUT OF MEMORY", long: "Either the internal memory of the machine is fully occupied by programs, diary entries and data files, or the current program has used up all available memory." },
        { code: 253, short: "EXPONENT RANGE", long: "A number has exceeded the exponent maximum of plus or minus 99." },
        { code: 252, short: "STR TO NUM ERR", long: "A non-numeric string has been passed to the VAL function." },
        { code: 251, short: "DIVIDE BY ZERO", long: "An attempt has been made to divide by zero." },
        { code: 250, short: "NUM TO STR ERR", long: "Only occurs when calling operating system machine language routines or from the calculator." },
        { code: 249, short: "STACK OVERFLOW", long: "Will only occur when users machine language program destroys the Organisers stack." },
        { code: 248, short: "STACK UNDERFLOW", long: "As above." },
        { code: 247, short: "FN ARGUMENT ERR", long: "The wrong type of argument has been passed to a function or a user's procedure." },
        { code: 246, short: "NO PACK", long: "There is no Datapak fitted to the device named in an instruction such as CREATE, OPEN etc, or a pack has been removed during pack access." },
        { code: 245, short: "WRITE PACK ERR", long: "The Organiser cannot write data to one of the Datapaks, try re-fitting it." },
        { code: 244, short: "READ ONLY PACK", long: "An attempt has been made to write to a Datapak used by the MK1 Organiser, or a program pack. These may be read from, but not written to." },
        { code: 243, short: "BAD DEVICE NAME", long: "A device name other than A, B or C has been used." },
        { code: 242, short: "PACK CHANGED", long: "Occurs when calling operating system machine language routines or when a pack is changed in the middle of a COPY." },
        { code: 241, short: "PACK NOT BLANK", long: "Datapak needs to be re-formatted as residual data is still present." },
        { code: 240, short: "UNKNOWN PACK", long: "A pack not supported by Organiser MK2 has been fitted to one of the devices." },
        { code: 239, short: "PACK FULL", long: "An attempt has been made to write to a Datapak which is already full." },
        { code: 238, short: "END OF FILE", long: "Occurs when an attempt is made to read past the end of a data file." },
        { code: 237, short: "BAD RECORD TYPE", long: "Occurs only when running machine language programs." },
        { code: 236, short: "BAD FILE NAME", long: "An illegal file name has been specified which does not conform to the rules in chapter 18.. (Max 8 characters, alphanumeric starting with a letter.)" },
        { code: 235, short: "FILE EXISTS", long: "An attempt has been made to create a file or procedure under a name which already exists on that device." },
        { code: 234, short: "FILE NOT FOUND", long: "An attempt has been made to access a file which does not exist on the specified device." },
        { code: 233, short: "DIRECTORY FULL", long: "No device may contain more than 110 files, an attempt has been made to create a file which exceeds exceed this limit." },
        { code: 232, short: "PAK NOT COPYABLE", long: "An attempt has been made to copy a pack which is copy-protected." },
        { code: 231, short: "BAD DEVICE CALL", long: "Will only occur when user accesses a device which is not available from a machine language program." },
        { code: 230, short: "DEVICE MISSING", long: "An attempt has been made to access a device which is not present, eg a printer. When no printer is connected, the LPRINT command will produce this error." },
        { code: 229, short: "DEVICE LOAD ERR", long: "A program pack or peripheral pack has been removed during its verification by the Organiser or the pack has become corrupted." },
        { code: 228, short: "SYNTAX ERR", long: "A syntax error has been detected during the translation of a procedure." },
        { code: 227, short: "MISMATCHED ()'s", long: "An incorrect number of brackets has been found in an expression, either too few or too many." },
        { code: 226, short: "BAD FN ARGS", long: "An illegal number or type of arguments has been supplied to a function, eg LOG(-1), SIN(x,y), or LEN(a)." },
        { code: 225, short: "SUBSCRIPT ERR", long: "An out of range subscript has been specified for an array variable, eg a(0) or a(10) when the array a() has been declared as having 9 elements." },
        { code: 224, short: "TYPE MISMATCH", long: "A value has been assigned to a variable of the wrong type, e.g. a$=12 or a=\"text\", or a procedure parameter has been given a value of the wrong type." },
        { code: 223, short: "NAME TOO LONG", long: "The specified file, procedure, or variable name exceeds the maximum number of characters allowed, eight characters including the $ or % qualifier." },
        { code: 222, short: "BAD IDENTIFIERQUALIFIER", long: "An incorrectly formed variable name has been used, e.g. name$$, or a name is too long." },
        { code: 221, short: "MISMATCHED \"", long: "Occurs when either too many sets of quotation marks are used to enclose a text string or one of the pair is omitted." },
        { code: 220, short: "STRING TOO LONG", long: "A string has been produced which exceeds the allocated with the GLOBAL or LOCAL commands, eg:\nLOCAL a$(10)\nA$=\"123456789ABCDEF\"" },
        { code: 219, short: "BAD CHARACTER", long: "A non-valid character such as ? or @a has been included in a calculation string or an expression." },
        { code: 218, short: "BAD NUMBER", long: "A number which cannot be evaluated properly has been used, eg 2.3.4" },
        { code: 217, short: "NO PROC NAME", long: "An externally created program file has been introduced which does not have a valid procedure name as its first line." },
        { code: 216, short: "BAD DECLARATION", long: "A variable has been declared illegallyincorrectly, eg:\nGLOBAL name$(10,300)" },
        { code: 215, short: "BAD ARRAY SIZE", long: "An array has been declared with an illegal number of elements, e.g. GLOBAL name$(0,15)." },
        { code: 214, short: "DUPLICATE NAME", long: "The file, procedure or variable name given is already in existence on the current device in the current procedure." },
        { code: 213, short: "STRUCTURE ERR", long: "An IF/ENDIF, WHILE/ENDWH or DO/UNTIL structure has been incorrectly nested." },
        { code: 212, short: "TOO COMPLEX", long: "Structures within a procedure have been nested too deeply No more than 8 structures may be nested within each other" },
        { code: 211, short: "MISSING LABEL", long: "An attempt has been made to GOTO a label which does not exist in the current procedure." },
        { code: 210, short: "MISSING COMMA", long: "A comma has been omitted from a list of items which should be delimited by commas throughout." },
        { code: 209, short: "BAD LOGICAL NAME", long: "An illegal logical name has been specified; ie, not A, B, C or D." },
        { code: 208, short: "BAD ASSIGNMENT", long: "An attempt has been made to assign a value to a procedure parameter." },
        { code: 207, short: "BAD FIELD LIST", long: "Any file must contain at least one and not more than sixteen fields. Occurs when an attempt is made to exceed these limits." },
        { code: 206, short: "ESCAPE", long: "The ON/CLEAR key has been pressed during program execution, pausing/halting that program, followed by a press of the Q key has then been pressed- quitting the program. This does notcannot happen if the ESCAPE OFF command has been used." },
        { code: 205, short: "ARG COUNT ERR", long: "An incorrect number of arguments has been supplied to a procedure." },
        { code: 204, short: "MISSING EXTERNAL", long: "A variable has been encountered which has not been declared in a calling procedure as a global variable, has not been declared as a parameter to the current procedure and has not been declared in the current procedure as a local or global variable. The bottom line of the display shows the name of the missing external. Press the SPACE key and the name of the procedure where the error occurred will be displayed. Press SPACE again and the message EDIT Y/N is shown - provided there is a text version of that procedure saved. You may then edit the procedure (Y) or quit to the PROG menu." },
        { code: 203, short: "MISSING PROC", long: "A procedure has been called which does not exist on any device." },
        { code: 202, short: "MENU TOO BIG", long: "The string supplied to the MENU function is too large and must be shortened." },
        { code: 201, short: "FIELD MISMATCH", long: "Occurs when a field variable used does not match any of those in any logical file." },
        { code: 200, short: "READ PACK ERROR", long: "The data in a Datapak cannot be read, the pack needs re-formatting." },
        { code: 199, short: "FILE IN USE", long: "An attempt has been made to open a file which is already open, or to delete a file which is open." },
        { code: 198, short: "RECORD TOO BIG", long: "No record may exceed a total of 254 characters." },
        { code: 197, short: "BAD PROC NAME", long: "Occurs when an invalid procedure name is given in the NEW option in the PROG menu." },
        { code: 196, short: "FILE NOT OPEN", long: "An attempt has been made to write to or read from a file which is not open." },
        { code: 195, short: "INTEGER OVERFLOW", long: "The range of numbers allowed for integer variables (-32768 to +32768) has been exceeded." }
    ];

    // Check if running as child
    if (window.location.search.indexOf('feature=oplerrors') !== -1) {
        window.addEventListener('load', initChildEnvironment);
    }

    function openWindow() {
        var width = 600;
        var height = 700;

        var left = (screen.width - width) / 2;
        var top = (screen.height - height) / 2;

        var winParams = [
            'width=' + width,
            'height=' + height,
            'left=' + left,
            'top=' + top,
            'menubar=no',
            'toolbar=no',
            'location=no',
            'status=no',
            'resizable=yes',
            'scrollbars=yes'
        ].join(',');

        var childWin = win.open('index.html?feature=oplerrors', 'PsionOPLErrors', winParams);
        childWin.focus();
    }

    function initChildEnvironment() {
        doc.title = 'OPL Error Codes';
        doc.body.innerHTML = '';

        var style = doc.createElement('style');
        style.textContent = `
            :root {
                --bg-color: #f0f0f0;
                --text-color: #333;
                --toolbar-bg: #ffffff;
                --border-color: #ccc;
                --input-bg: #ffffff;
                --input-border: #ccc;
                /* Use theme-adaptive variables for items */
                --item-bg: var(--input-bg, #ffffff);
                --item-border: var(--border-color, #e0e0e0);
                --code-color: #0078d7;
            }
            body { 
                margin: 0; 
                padding: 0; 
                background: var(--bg-color); 
                color: var(--text-color);
                font-family: 'Segoe UI', sans-serif;
                height: 100vh;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }
            .toolbar {
                padding: 15px;
                background: var(--toolbar-bg);
                border-bottom: 1px solid var(--border-color);
                box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                z-index: 10;
            }
            .search-box {
                width: 100%;
                padding: 10px;
                font-size: 16px;
                border: 1px solid var(--input-border);
                border-radius: 4px;
                background: var(--input-bg);
                color: var(--text-color);
                box-sizing: border-box;
            }
            .search-box:focus {
                outline: none;
                border-color: var(--code-color);
                box-shadow: 0 0 0 2px rgba(0,120,215,0.2);
            }
            .error-list {
                flex-grow: 1;
                overflow-y: auto;
                padding: 15px;
            }
            .error-item {
                background: var(--item-bg);
                border: 1px solid var(--item-border);
                border-radius: 6px;
                padding: 15px;
                margin-bottom: 10px;
                transition: transform 0.1s ease, box-shadow 0.1s ease;
            }
            .error-item:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 6px rgba(0,0,0,0.05);
                border-color: #ccc;
            }
            .error-header {
                display: flex;
                align-items: baseline;
                margin-bottom: 8px;
                border-bottom: 1px solid #eee;
                padding-bottom: 8px;
            }
            .error-code {
                font-size: 1.2em;
                font-weight: bold;
                color: var(--code-color);
                font-family: monospace;
                margin-right: 15px;
                min-width: 40px;
            }
            .error-short {
                font-weight: 600;
                font-size: 1.1em;
                color: var(--text-color);
            }
            .error-long {
                line-height: 1.5;
                color: var(--text-color);
                opacity: 0.85;
                font-size: 0.95em;
                white-space: pre-wrap; /* Preserve newlines in descriptions */
            }
            .no-results {
                text-align: center;
                padding: 40px;
                color: #888;
                font-style: italic;
            }
        `;

        // Inject Theme from Opener
        if (window.opener && window.opener.document) {
            var parentRoot = window.opener.document.documentElement;
            doc.documentElement.style.cssText = parentRoot.style.cssText;
            if (parentRoot.hasAttribute('data-theme')) {
                doc.documentElement.setAttribute('data-theme', parentRoot.getAttribute('data-theme'));
            }
        }

        doc.head.appendChild(style);

        // Build UI
        var toolbar = doc.createElement('div');
        toolbar.className = 'toolbar';

        var searchInput = doc.createElement('input');
        searchInput.type = 'text';
        searchInput.className = 'search-box';
        searchInput.placeholder = 'Search error number or description... (e.g. 255, ALLOC)';
        searchInput.autofocus = true;

        toolbar.appendChild(searchInput);
        doc.body.appendChild(toolbar);

        var listContainer = doc.createElement('div');
        listContainer.className = 'error-list';
        doc.body.appendChild(listContainer);

        function renderList(filterText) {
            listContainer.innerHTML = '';
            var results = 0;
            var filter = filterText ? filterText.toUpperCase() : '';

            ERROR_DATA.forEach(function (err) {
                // Match Logic
                var match = false;
                if (!filter) match = true;
                else {
                    if (err.code.toString().indexOf(filter) !== -1) match = true;
                    else if (err.short.toUpperCase().indexOf(filter) !== -1) match = true;
                    else if (err.long.toUpperCase().indexOf(filter) !== -1) match = true;
                }

                if (match) {
                    results++;
                    var item = doc.createElement('div');
                    item.className = 'error-item';

                    var header = doc.createElement('div');
                    header.className = 'error-header';

                    var codeSpan = doc.createElement('span');
                    codeSpan.className = 'error-code';
                    codeSpan.textContent = err.code;

                    var shortSpan = doc.createElement('span');
                    shortSpan.className = 'error-short';
                    shortSpan.textContent = err.short;

                    header.appendChild(codeSpan);
                    header.appendChild(shortSpan);

                    var longDiv = doc.createElement('div');
                    longDiv.className = 'error-long';
                    longDiv.textContent = err.long;

                    item.appendChild(header);
                    item.appendChild(longDiv);
                    listContainer.appendChild(item);
                }
            });

            if (results === 0) {
                var noRes = doc.createElement('div');
                noRes.className = 'no-results';
                noRes.textContent = 'No errors found matching "' + filterText + '"';
                listContainer.appendChild(noRes);
            }
        }

        // Initial Render
        renderList('');

        // Search Listener
        searchInput.addEventListener('input', function (e) {
            renderList(e.target.value);
        });
    }

    return {
        openWindow: openWindow
    };
})();
