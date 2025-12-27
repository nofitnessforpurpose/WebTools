// =============================================================================
// Spreadsheet Debug Window
// =============================================================================
// Floating, resizable window for tracking SHT parsing.
// Extracted from SpreadsheetFileEditor.js for modularity.

class FloatingDebugWindow {
    constructor() {
        this.element = null;
        this.body = null;
        this.init();
    }

    init() {
        // Main Container
        this.element = document.createElement('div');
        this.element.id = 'sheet-debug-window';
        this.element.style.cssText = `
            position: fixed; top: 180px; right: 20px; width: 650px; height: 500px;
            background-color: var(--bg-color); border: 1px solid var(--border-color);
            box-shadow: 0 4px 8px rgba(0,0,0,0.3); z-index: 1000;
            display: none; flex-direction: column; resize: both; overflow: hidden;
            border-radius: 4px;
            --col-addr: 50px;
            --col-bytes: 80px;
            --col-info: 140px;
            --col-len: 30px;
            --col-type: 60px;
        `;

        // Title Bar
        const titleBar = document.createElement('div');
        titleBar.style.cssText = `
            background-color: var(--status-bar-bg); color: white; padding: 5px 10px;
            cursor: move; font-weight: bold; display: flex; justify-content: space-between;
            align-items: center; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 13px; flex-shrink: 0;
        `;
        titleBar.innerHTML = '<span>Spreadsheet Debug</span><span class="close-btn" style="cursor:pointer; font-size:16px;">&times;</span>';

        // Header Helper for Resizable Columns
        const createHeaderCol = (text, varName, minWidth) => {
            const div = document.createElement('div');
            div.style.position = 'relative';
            div.style.display = 'flex';
            div.style.alignItems = 'center';
            div.innerText = text;

            if (varName) {
                const resizer = document.createElement('div');
                resizer.style.cssText = `
                    position: absolute; right: -5px; top: 0; bottom: 0; width: 10px;
                    cursor: col-resize; z-index: 10;
                `;
                let startX, startWidth;
                resizer.addEventListener('mousedown', (e) => {
                    startX = e.clientX;
                    startWidth = parseInt(getComputedStyle(this.element).getPropertyValue(varName));
                    e.preventDefault(); e.stopPropagation();
                    const onMove = (mv) => {
                        const dx = mv.clientX - startX;
                        const newWidth = Math.max(minWidth, startWidth + dx);
                        this.element.style.setProperty(varName, newWidth + 'px');
                    };
                    const onUp = () => {
                        document.removeEventListener('mousemove', onMove);
                        document.removeEventListener('mouseup', onUp);
                    };
                    document.addEventListener('mousemove', onMove);
                    document.addEventListener('mouseup', onUp);
                });
                div.appendChild(resizer);
            }
            return div;
        };

        // Header
        const header = document.createElement('div');
        header.style.cssText = `
            display: grid; 
            grid-template-columns: var(--col-addr) var(--col-bytes) var(--col-info) var(--col-len) var(--col-type) 1fr;
            gap: 5px; padding: 4px 0 4px 10px; background-color: var(--bg-color);
            border-bottom: 1px solid var(--border-color); font-family: 'Consolas', monospace;
            font-weight: bold; font-size: 12px; color: var(--text-color); flex-shrink: 0; user-select: none;
        `;

        // Layout: Addr, Bytes, Info, Len, Type, Comments
        header.appendChild(createHeaderCol('Addr', '--col-addr', 30));
        header.appendChild(createHeaderCol('Bytes', '--col-bytes', 40));
        header.appendChild(createHeaderCol('Info', '--col-info', 50));
        header.appendChild(createHeaderCol('Len', '--col-len', 20));
        header.appendChild(createHeaderCol('Type', '--col-type', 30));
        header.appendChild(createHeaderCol('Comments', null, 50));

        // Content Area
        this.content = document.createElement('div');
        this.content.style.cssText = `
            flex: 1; overflow-y: auto; padding: 0 10px; font-family: 'Consolas', monospace;
            font-size: 12px; background-color: var(--bg-color); color: var(--text-color);
        `;

        this.element.appendChild(titleBar);
        this.element.appendChild(header);
        this.element.appendChild(this.content);
        document.body.appendChild(this.element);

        // Events
        titleBar.querySelector('.close-btn').addEventListener('click', () => {
            this.element.style.display = 'none';
            if (SpreadsheetFileEditor.instance) SpreadsheetFileEditor.instance.toggleDebug(false);
        });

        // Dragging
        let isDragging = false;
        let startX, startY, initialLeft, initialTop;
        titleBar.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('close-btn')) return;
            isDragging = true; startX = e.clientX; startY = e.clientY;
            const rect = this.element.getBoundingClientRect();
            initialLeft = rect.left; initialTop = rect.top;
            e.preventDefault();
        });
        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const dx = e.clientX - startX; const dy = e.clientY - startY;
                this.element.style.left = `${initialLeft + dx}px`; this.element.style.top = `${initialTop + dy}px`;
                this.element.style.right = 'auto';
            }
        });
        document.addEventListener('mouseup', () => { isDragging = false; });
    }

    clear() {
        this.content.innerHTML = '';
    }

    addRow(rec, hexBytes, info, comment) {
        const row = document.createElement('div');
        row.style.borderBottom = '1px solid var(--border-color)';
        row.style.padding = '2px 0';
        row.style.display = 'grid';

        // Match Header Grid
        row.style.gridTemplateColumns = 'var(--col-addr) var(--col-bytes) var(--col-info) var(--col-len) var(--col-type) 1fr';
        row.style.gap = '5px';
        row.style.alignItems = 'baseline';

        // 1. Addr (Grey)
        const addrDiv = document.createElement('div');
        addrDiv.style.color = '#888';
        if (rec.offset !== undefined) {
            addrDiv.innerText = rec.offset.toString(16).toUpperCase().padStart(4, '0');
        } else {
            addrDiv.innerText = "----";
        }
        row.appendChild(addrDiv);

        // 2. Bytes (Syntax Number Color)
        const bytesDiv = document.createElement('div');
        bytesDiv.style.color = 'var(--syntax-number)';
        bytesDiv.style.wordBreak = 'break-all'; // Allow long hex to wrap
        bytesDiv.style.whiteSpace = 'normal';   // Allow text wrapping
        bytesDiv.innerText = hexBytes;
        row.appendChild(bytesDiv);

        // 3. Info (Syntax Value Color)
        const infoDiv = document.createElement('div');
        infoDiv.style.color = 'var(--syntax-string)'; // Or value color
        infoDiv.style.whiteSpace = 'nowrap';
        infoDiv.style.overflow = 'hidden';
        infoDiv.style.textOverflow = 'ellipsis';
        infoDiv.innerText = info;
        infoDiv.title = info;
        row.appendChild(infoDiv);

        // 4. Len (Grey)
        const lenDiv = document.createElement('div');
        lenDiv.style.color = '#888';
        if (rec.len !== undefined) lenDiv.innerText = rec.len;
        row.appendChild(lenDiv);

        // 5. Type (Syntax Keyword)
        const typeDiv = document.createElement('div');
        typeDiv.style.color = 'var(--syntax-keyword)';
        var typeName = "Unk";
        if (rec.type === 0x17) typeName = "Num";
        else if (rec.type === 0x27) typeName = "Str";
        else if (rec.type === 0x37) typeName = "Frm";
        else if (rec.type === 0x85) typeName = "Hdr";
        else if (rec.type === 0x57) typeName = "Wid";
        else if (rec.type === 0x47) typeName = "Sty";
        else if (rec.type === -1) typeName = "Gap";

        if (rec.type !== -1) typeDiv.innerText = `${typeName}(${rec.type.toString(16).toUpperCase()})`;
        else typeDiv.innerText = "Gap";
        row.appendChild(typeDiv);

        // 6. Comment (Grey Italic, Left Justified)
        const commentDiv = document.createElement('div');
        commentDiv.style.color = '#888';
        commentDiv.style.fontStyle = 'italic';
        commentDiv.style.textAlign = 'left';
        commentDiv.innerText = comment;
        row.appendChild(commentDiv);

        this.content.appendChild(row);
    }
}
