class VariableStorageWindow {
    constructor() {
        this.element = null;
        this.content = null;
        this.init();
    }

    init() {
        // Create main container
        this.element = document.createElement('div');
        this.element.id = 'variable-storage-window';
        this.element.style.cssText = `
            position: fixed;
            top: 180px;
            right: 40px;
            width: 500px;
            height: 400px;
            background-color: var(--bg-color);
            border: 1px solid var(--border-color);
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            z-index: 1000;
            display: none;
            flex-direction: column;
            resize: both;
            overflow: hidden;
            border-radius: 4px;
            --col-addr: 60px;
            --col-bytes: 80px;
            --col-info: 150px;
        `;

        // Title bar
        const titleBar = document.createElement('div');
        titleBar.style.cssText = `
            background-color: var(--status-bar-bg);
            color: white;
            padding: 5px 10px;
            cursor: move;
            font-weight: bold;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 13px;
            flex-shrink: 0;
        `;
        titleBar.innerHTML = '<span>Decompilation Variable Storage</span><div class="controls" style="display:flex; align-items:center;">' +
            '<i class="fas fa-copy copy-btn" title="Copy to Clipboard" style="cursor:pointer; font-size:14px; margin-right:15px;"></i>' +
            '<span class="close-btn" style="cursor:pointer; font-size:16px;">&times;</span>' +
            '</div>';

        // Add copy listener
        titleBar.querySelector('.copy-btn').addEventListener('click', () => {
            this.copyToClipboard();
        });

        // Header
        const header = document.createElement('div');
        header.style.cssText = `
            display: grid;
            grid-template-columns: var(--col-addr) var(--col-bytes) var(--col-info) 1fr;
            gap: 5px;
            padding: 4px 0 4px 10px;
            background-color: var(--bg-color);
            border-bottom: 1px solid var(--border-color);
            font-family: 'Consolas', monospace;
            font-weight: bold;
            font-size: 12px;
            color: var(--text-color);
            flex-shrink: 0;
            user-select: none;
        `;

        const createHeaderCol = (text, varName, minWidth) => {
            const div = document.createElement('div');
            div.style.position = 'relative';
            div.style.display = 'flex';
            div.style.alignItems = 'center';
            div.innerText = text;

            if (varName) {
                const resizer = document.createElement('div');
                resizer.style.cssText = `
                    position: absolute;
                    right: -5px;
                    top: 0;
                    bottom: 0;
                    width: 10px;
                    cursor: col-resize;
                    z-index: 10;
                `;

                let startX, startWidth;

                resizer.addEventListener('mousedown', (e) => {
                    startX = e.clientX;
                    startWidth = parseInt(getComputedStyle(this.element).getPropertyValue(varName));
                    e.preventDefault();
                    e.stopPropagation();

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

        header.appendChild(createHeaderCol('Addr', '--col-addr', 30));
        header.appendChild(createHeaderCol('Bytes', '--col-bytes', 40));
        header.appendChild(createHeaderCol('Info', '--col-info', 50));
        header.appendChild(createHeaderCol('Comment', null, 50));

        // Content area
        this.content = document.createElement('div');
        this.content.style.cssText = `
            flex: 1;
            overflow-y: auto;
            padding: 0 10px;
            font-family: 'Consolas', monospace;
            font-size: 12px;
            background-color: var(--bg-color);
            color: var(--text-color);
        `;

        this.element.appendChild(titleBar);
        this.element.appendChild(header);
        this.element.appendChild(this.content);
        document.body.appendChild(this.element);

        // Events for window drag/close
        titleBar.querySelector('.close-btn').addEventListener('click', () => {
            if (typeof OptionsManager !== 'undefined') {
                OptionsManager.setOption('showVariableStorageWindow', false);
            }
            this.element.style.display = 'none';
        });

        // Window dragging logic
        let isDragging = false;
        let startX, startY, initialLeft, initialTop;

        titleBar.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('close-btn')) return;
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            const rect = this.element.getBoundingClientRect();
            initialLeft = rect.left;
            initialTop = rect.top;
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                this.element.style.left = `${initialLeft + dx}px`;
                this.element.style.top = `${initialTop + dy}px`;
                this.element.style.right = 'auto'; // Disable right info once moved
            }
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });

        this.updateVisibility();
    }

    updateVisibility() {
        if (typeof OptionsManager === 'undefined') return;
        const enabled = OptionsManager.getOption('showVariableStorageWindow');
        if (enabled) {
            this.element.style.display = 'flex';
        } else {
            this.element.style.display = 'none';
        }
    }

    clear() {
        this.content.innerHTML = '';
    }

    log(entry) {
        // Log if enabled (auto-show) OR if already visible (manual)
        const isVisible = (this.element.style.display !== 'none');
        const isEnabled = OptionsManager.getOption('showVariableStorageWindow');

        if (!isVisible && !isEnabled) return;
        if (this.element.style.display === 'none') this.element.style.display = 'flex';

        const row = document.createElement('div');
        row.style.borderBottom = '1px solid var(--border-color)';
        row.style.padding = '2px 0';
        row.style.display = 'grid';
        // Cols: Address | Bytes | Info | Comment
        row.style.gridTemplateColumns = 'var(--col-addr) var(--col-bytes) var(--col-info) 1fr';
        row.style.gap = '5px';
        row.style.fontFamily = 'Consolas, monospace';
        row.style.fontSize = '12px';
        row.style.alignItems = 'baseline';

        // 1. Address
        const addrDiv = document.createElement('div');
        addrDiv.style.color = '#888';
        addrDiv.innerText = entry.addr || "";
        row.appendChild(addrDiv);

        // 2. Data (Bytes)
        const bytesDiv = document.createElement('div');
        bytesDiv.style.color = 'var(--syntax-number)';
        bytesDiv.innerText = entry.bytes || "";
        row.appendChild(bytesDiv);

        // 3. Info
        const infoDiv = document.createElement('div');
        infoDiv.style.color = 'var(--syntax-commands)';
        infoDiv.innerText = entry.info || "";
        row.appendChild(infoDiv);

        // 4. Comment
        const commentDiv = document.createElement('div');
        commentDiv.style.color = '#aaa';
        commentDiv.innerText = entry.comment || "";
        row.appendChild(commentDiv);

        this.content.appendChild(row);
    }

    copyToClipboard() {
        const rows = this.content.querySelectorAll(':scope > div');
        let text = "Addr\tBytes\tInfo\tComment\n";
        rows.forEach(row => {
            const cells = Array.from(row.children).map(c => c.innerText.replace(/\n/g, ' '));
            text += cells.join('\t') + "\n";
        });

        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).catch(err => console.error("Copy failed", err));
        }
    }
}
