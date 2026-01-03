/**
 * OPLContentViewer.js
 * -------------------
 * Generic viewer for OPL code snippets (Templates, Library).
 * Opens in a child window similar to OPLCommandReference.
 * Supports Categorized Data and Table of Contents.
 */

class OPLContentViewer {
    constructor(title, data) {
        this.title = title || "OPL Content";
        this.data = data || [];
        this.featureId = "content_viewer_" + Date.now();
    }

    open() {
        const viewerId = "OPLViewer_" + Date.now();
        window[viewerId] = this;

        const width = 600;
        const height = 700;
        const left = (screen.width - width) / 2;
        const top = (screen.height - height) / 2;

        const win = window.open(`index.html?mode=child&feature=opl_content&viewerId=${viewerId}`, "_blank", `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes`);

        if (win) {
            win.focus();
        }
    }

    static childWindowReady(win) {
        const params = new URLSearchParams(win.location.search);
        const viewerId = params.get('viewerId');

        if (window.opener && window.opener[viewerId]) {
            const viewer = window.opener[viewerId];
            viewer.render(win);
        } else {
            // console.error("OPLContentViewer: source viewer not found in opener");
        }
    }

    render(win) {
        const doc = win.document;
        doc.title = this.title;

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

        doc.documentElement.style.cssText = cssVars;

        // Styles
        let style = doc.getElementById('opl-viewer-style');
        if (!style) {
            style = doc.createElement('style');
            style.id = 'opl-viewer-style';
            doc.head.appendChild(style);
        }

        style.textContent = `
            body {
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
                font-size: 24px;
                color: var(--text-color);
            }
            h2.category-header {
                margin-top: 30px;
                margin-bottom: 15px;
                padding-bottom: 5px;
                border-bottom: 1px solid var(--border-color);
                color: var(--syntax-methods); /* Use a nice color from theme */
                font-size: 20px;
            }
            .toc {
                background-color: var(--sidebar-bg);
                border: 1px solid var(--border-color);
                padding: 15px;
                margin-bottom: 30px;
                border-radius: 4px;
            }
            .toc h3 {
                margin-top: 0;
                font-size: 16px;
                border-bottom: 1px solid var(--border-color);
                padding-bottom: 5px;
            }
            .toc ul {
                list-style-type: none;
                padding-left: 0;
            }
            .toc li {
                margin-bottom: 5px;
            }
            .toc a {
                text-decoration: none;
                color: var(--link-color, #4da6ff);
                cursor: pointer;
            }
            .toc a:hover {
                text-decoration: underline;
            }
            .item-card {
                background-color: var(--editor-bg);
                border: 1px solid var(--border-color);
                border-radius: 4px;
                margin-bottom: 20px;
                padding: 15px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .item-title {
                font-size: 18px;
                font-weight: bold;
                color: var(--syntax-commands);
                margin-bottom: 5px;
            }
            .item-desc {
                font-style: italic;
                margin-bottom: 10px;
                opacity: 0.8;
            }
            pre {
                background-color: var(--code-bg, #1e1e1e);
                color: var(--code-fg, #d4d4d4);
                padding: 10px;
                border-radius: 4px;
                overflow-x: auto;
                font-family: 'Consolas', 'Courier New', monospace;
                margin: 0;
                border: 1px solid var(--border-color);
                font-size: 13px;
                tab-size: 2;
            }
            .copy-btn {
                float: right;
                background: transparent;
                border: 1px solid var(--border-color);
                color: var(--text-color);
                cursor: pointer;
                padding: 2px 8px;
                font-size: 12px;
                border-radius: 3px;
            }
            .copy-btn:hover {
                background-color: var(--list-hover-bg);
            }
            .top-link {
                float: right;
                font-size: 12px;
                text-decoration: none;
                color: var(--text-color);
                opacity: 0.7;
                margin-top: 5px;
            }
        `;

        // Body Content
        doc.body.className = bodyClass;
        doc.body.innerHTML = `
            <div class="scroll-container">
                <h1 id="top">${this.title}</h1>
                <div id="toc-container" class="toc">
                    <h3>Contents</h3>
                    <ul id="toc-list"></ul>
                </div>
                <div id="content-list"></div>
            </div>
        `;

        const tocList = doc.getElementById('toc-list');
        const contentList = doc.getElementById('content-list');

        let globalIndex = 0;

        this.data.forEach((categoryObj) => {
            // Render Category Header
            const catId = `cat-${globalIndex}`;

            // ToC Entry for Category
            const tocCat = doc.createElement('li');
            tocCat.innerHTML = `<strong><a href="#${catId}">${categoryObj.category}</a></strong>`;

            const nestedUl = doc.createElement('ul');
            nestedUl.style.paddingLeft = "20px";
            nestedUl.style.marginTop = "5px";
            tocCat.appendChild(nestedUl);
            tocList.appendChild(tocCat);

            // Content Header
            const header = doc.createElement('h2');
            header.className = 'category-header';
            header.id = catId;
            header.textContent = categoryObj.category;
            contentList.appendChild(header);

            // Render Items
            categoryObj.items.forEach((item) => {
                const itemId = `item-${globalIndex}`;

                // ToC Entry for Item
                const tocItem = doc.createElement('li');
                tocItem.innerHTML = `<a href="#${itemId}">${item.name}</a>`;
                nestedUl.appendChild(tocItem);

                // Content Card
                const div = doc.createElement('div');
                div.className = 'item-card';
                div.id = itemId;

                const btnId = `btn-copy-${globalIndex}`;
                const codeId = `code-block-${globalIndex}`;

                div.innerHTML = `
                    <div style="overflow: hidden; margin-bottom: 5px;">
                        <a href="#top" class="top-link">↑ Top</a>
                        <button class="copy-btn" id="${btnId}">Copy</button>
                    </div>
                    <div class="item-title">${item.name}</div>
                    <div class="item-desc">${item.description}</div>
                    <pre id="${codeId}">${this.escapeHtml(item.code)}</pre>
                `;

                contentList.appendChild(div);

                const btn = doc.getElementById(btnId);
                btn.addEventListener('click', () => {
                    const codeText = item.code;
                    win.navigator.clipboard.writeText(codeText).then(() => {
                        const originalText = btn.textContent;
                        btn.textContent = "Copied!";
                        setTimeout(() => { btn.textContent = originalText; }, 1500);
                    });
                });

                globalIndex++;
            });
        });
    }

    escapeHtml(text) {
        if (!text) return "";
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}
