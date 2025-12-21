/**
 * OPLCommandReference.js
 * ----------------------
 * Manages the floating window for OPL Command Reference.
 * Renders a themed table of commands with syntax and compatibility.
 */

class OPLCommandReference {
    constructor() {
        this.data = window.OPL_COMMANDS || [];
    }

    open() {
        const width = 583;
        const height = 700;
        const left = (screen.width - width) / 2;
        const top = (screen.height - height) / 2;

        const win = window.open("", "OPLCommandRef", `width=${width},height=${height},top=${top},left=${left}`);

        if (!win) {
            alert("Please allow popups for this site to view the Command Reference.");
            return;
        }

        // Theme Injection
        let cssVars = "";
        let currentTheme = 'dark';
        let bodyClass = "";

        if (typeof ThemeManager !== 'undefined') {
            currentTheme = ThemeManager.currentTheme;
            const defs = ThemeManager.getThemeDefinition(currentTheme);
            for (const key in defs) {
                cssVars += `${key}: ${defs[key]};\n`;
            }
            bodyClass = document.body.className;
        }

        win.document.open();
        win.document.write(`
            <!DOCTYPE html>
            <html data-theme="${currentTheme}" style="${cssVars}">
            <head>
                <title>OPL Command Reference</title>
                <link rel="stylesheet" href="styles/base.css">
                <link rel="stylesheet" href="styles/syntax.css">
                <style>
                    * {
                        box-sizing: border-box;
                    }
                    html, body {
                        height: 100%;
                        margin: 0;
                        padding: 0;
                        overflow: hidden; /* Prevent double scrollbars */
                        background-color: var(--bg-color);
                        color: var(--text-color);
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    }
                    .scroll-container {
                        height: 100%;
                        overflow-y: auto;
                        padding: 20px;
                    }
                    h1 {
                        border-bottom: 2px solid var(--border-color);
                        padding-bottom: 10px;
                        margin-top: 0;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 20px;
                        margin-bottom: 40px; /* Extra margin for table */
                    }
                    th, td {
                        text-align: left;
                        padding: 10px;
                        border-bottom: 1px solid var(--border-color);
                    }
                    th {
                        background-color: var(--sidebar-header-bg);
                        color: var(--sidebar-header-text);
                        position: sticky;
                        top: 0;
                        z-index: 10; /* Ensure header stays on top */
                    }
                    tr:hover {
                        background-color: var(--list-hover-bg);
                    }
                    .cmd-name {
                        font-weight: bold;
                        color: var(--syntax-commands);
                        font-family: 'Consolas', monospace;
                    }
                    .cmd-syntax {
                        font-family: 'Consolas', monospace;
                    }
                    .compat-cell {
                        text-align: center;
                        width: 50px;
                    }
                    .tick {
                        color: var(--status-bar-bg); /* Use accent color */
                        font-weight: bold;
                    }
                    
                    /* Syntax Highlighting in Table */
                    .syntax-keyword { color: var(--syntax-commands); }
                    .syntax-func { color: var(--syntax-functions); }
                    .syntax-string { color: var(--syntax-string); }
                    .syntax-number { color: var(--syntax-number); }
                    .syntax-operator { color: var(--syntax-operator); }
                    .syntax-param { color: var(--syntax-bracket-1); font-style: italic; } /* Themed param color */
                    
                    .spacer {
                        height: 60px;
                        width: 100%;
                    }
                </style>
            </head>
            <body class="${bodyClass}">
                <div class="scroll-container">
                    <h1>OPL Command Reference</h1>
                    <table>
                        <thead>
                            <tr>
                                <th>Command</th>
                                <th>Syntax</th>
                                <th class="compat-cell" title="Base Model - 16k RAM 2-Line">CM</th>
                                <th class="compat-cell" title="16k RAM - 2 Line">XP</th>
                                <th class="compat-cell" title="32k RAM - 2 Line">LA</th>
                                <th class="compat-cell" title="32k RAM - 4 Line / 64k RAM - 4 Line">LZ</th>
                            </tr>
                        </thead>
                        <tbody id="table-body">
                        </tbody>
                    </table>
                    
                    <h2>Key</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Symbol</th>
                                <th>Description</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td>&lt;exp&gt;</td><td>Numeric Expression (Integer or Floating Point)</td></tr>
                            <tr><td>&lt;str$&gt; / &lt;exp$&gt;</td><td>String Expression</td></tr>
                            <tr><td>&lt;var&gt;</td><td>Variable Name</td></tr>
                            <tr><td>&lt;addr&gt;</td><td>Memory Address (Integer)</td></tr>
                            <tr><td>&lt;file$&gt;</td><td>File Name or Path</td></tr>
                            <tr><td>&lt;log&gt;</td><td>Logical File Name (A, B, C, D)</td></tr>
                            <tr><td>&lt;cond&gt;</td><td>Logical Condition</td></tr>
                            <tr><td>&lt;d&gt;, &lt;m&gt;, &lt;y&gt;</td><td>Day, Month, Year (Integers)</td></tr>
                        </tbody>
                    </table>

                    <div class="spacer"></div>
                </div>
                <script>
                    const data = ${JSON.stringify(this.data)};
                    const tbody = document.getElementById('table-body');

                    function formatSyntax(syntax) {
                        // Escape HTML characters to prevent browser from interpreting them as tags
                        let escaped = syntax.replace(/&/g, "&amp;")
                                              .replace(/</g, "&lt;")
                                              .replace(/>/g, "&gt;")
                                              .replace(/"/g, "&quot;")
                                              .replace(/'/g, "&#039;");
                        
                        // Highlight <...$> as String (Magenta)
                        escaped = escaped.replace(/&lt;[^&]*?\$&gt;/g, '<span class="syntax-string">$&</span>');

                        // Highlight <...%> as Integer (Cyan/Number color)
                        escaped = escaped.replace(/&lt;[^&]*?%&gt;/g, '<span class="syntax-number">$&</span>');

                        // Highlight remaining <...> as Generic Param (Themed Param Color)
                        escaped = escaped.replace(/&lt;[^&]+&gt;/g, (match) => {
                            if (match.includes('class="syntax-string"') || match.includes('class="syntax-number"')) return match;
                            return '<span class="syntax-param">' + match + '</span>';
                        });

                        return escaped;
                    }

                    data.forEach(cmd => {
                        const tr = document.createElement('tr');
                        
                        // Command
                        const tdName = document.createElement('td');
                        tdName.className = 'cmd-name';
                        tdName.textContent = cmd.name;
                        if (cmd.description) {
                            tdName.title = cmd.description;
                        }
                        tr.appendChild(tdName);

                        // Syntax
                        const tdSyntax = document.createElement('td');
                        tdSyntax.className = 'cmd-syntax';
                        tdSyntax.innerHTML = formatSyntax(cmd.syntax);
                        tr.appendChild(tdSyntax);

                        // Compat Flags
                        ['cm', 'xp', 'la', 'lz'].forEach(flag => {
                            const td = document.createElement('td');
                            td.className = 'compat-cell';
                            if (cmd[flag]) {
                                td.innerHTML = '<span class="tick">&#10003;</span>';
                            }
                            tr.appendChild(td);
                        });

                        tbody.appendChild(tr);
                    });
                </script>
            </body>
            </html>
        `);
        win.document.close();
    }
}

if (typeof window !== 'undefined') {
    window.OPLCommandReference = OPLCommandReference;
}
