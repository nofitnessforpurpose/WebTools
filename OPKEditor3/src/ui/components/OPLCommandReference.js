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

        // Open using index.html in child mode + command_ref feature
        const win = window.open("index.html?mode=child&feature=command_ref", "OPLCommandRef", `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes`);

        if (win) {
            win.focus();
        }

    }

    static childWindowReady(win) {
        new OPLCommandReference().render(win);
    }

    render(win) {
        const doc = win.document;
        doc.title = "OPL Command Reference";

        // Theme Injection
        let cssVars = "";
        let bodyClass = "";

        if (typeof ThemeManager !== 'undefined') {
            const currentTheme = ThemeManager.currentTheme;
            const defs = ThemeManager.getThemeDefinition(currentTheme);
            for (const key in defs) {
                cssVars += `${key}: ${defs[key]};\n`;
            }
            if (document.body) bodyClass = document.body.className;
        }

        // Apply Theme Context
        doc.documentElement.style.cssText = cssVars;

        // Styles
        let style = doc.getElementById('opl-ref-style');
        if (!style) {
            style = doc.createElement('style');
            style.id = 'opl-ref-style';
            doc.head.appendChild(style);
        }

        style.textContent = `
            body {
                overflow: hidden; 
                background-color: var(--bg-color);
                color: var(--text-color);
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                margin: 0; 
                padding: 0;
            }
            .scroll-container {
                height: 100vh;
                overflow-y: auto;
                padding: 20px;
                box-sizing: border-box;
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
                margin-bottom: 40px;
                font-size: 13px;
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
                z-index: 10;
            }
            tr:hover {
                background-color: var(--list-hover-bg);
            }
            .cmd-name {
                font-weight: bold;
                color: var(--syntax-commands);
                font-family: 'Consolas', monospace;
                width: 15%;
            }
            .cmd-syntax {
                font-family: 'Consolas', monospace;
                width: 45%;
            }
            .compat-cell {
                text-align: center;
                width: 50px;
            }
            .tick {
                color: var(--status-bar-bg);
                font-weight: bold;
            }
            
            /* Syntax Highlighting */
            .syntax-string { color: var(--syntax-string); }
            .syntax-number { color: var(--syntax-number); }
            .syntax-param { color: var(--syntax-bracket-1); font-style: italic; }
            
            .spacer { height: 60px; }
            
            h2 {
                font-size: 18px; 
                margin-top: 20px; 
                border-bottom: 1px solid var(--border-color); 
                padding-bottom: 5px; 
            }
        `;

        // Body Content
        doc.body.className = bodyClass;
        doc.body.innerHTML = `
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
        `;

        // Populate
        const tbody = doc.getElementById('table-body');

        function formatSyntax(syntax) {
            let escaped = syntax.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
            // <...$> -> String
            escaped = escaped.replace(/&lt;[^&]*?\$&gt;/g, '<span class="syntax-string">$&</span>');
            // <...%> or <exp> -> Number/Int
            escaped = escaped.replace(/&lt;[^&]*?%&gt;/g, '<span class="syntax-number">$&</span>');
            // <...> -> Param
            escaped = escaped.replace(/&lt;[^&]+&gt;/g, (match) => {
                if (match.includes('class=')) return match;
                return '<span class="syntax-param">' + match + '</span>';
            });
            return escaped;
        }

        this.data.forEach(cmd => {
            const tr = doc.createElement('tr');

            // Command
            const tdName = doc.createElement('td');
            tdName.className = 'cmd-name';
            tdName.textContent = cmd.name;
            if (cmd.description) tdName.title = cmd.description;
            tr.appendChild(tdName);

            // Syntax
            const tdSyntax = doc.createElement('td');
            tdSyntax.className = 'cmd-syntax';
            tdSyntax.innerHTML = formatSyntax(cmd.syntax);
            tr.appendChild(tdSyntax);

            // Flags
            ['cm', 'xp', 'la', 'lz'].forEach(flag => {
                const td = doc.createElement('td');
                td.className = 'compat-cell';
                if (cmd[flag]) td.innerHTML = '<span class="tick">&#10003;</span>';
                tr.appendChild(td);
            });

            tbody.appendChild(tr);
        });
    }
}

if (typeof window !== 'undefined') {
    window.OPLCommandReference = OPLCommandReference;
}
