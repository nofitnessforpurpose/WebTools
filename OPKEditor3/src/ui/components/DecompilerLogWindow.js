class DecompilerLogWindow {
    constructor() {
        this.element = null;
        this.content = null;
        this.init();
    }

    init() {
        // Create main container
        this.element = document.createElement('div');
        this.element.id = 'decompiler-log-window';
        this.element.style.cssText = `
            position: fixed;
            top: 180px;
            right: 20px;
            width: 700px;
            height: 500px;
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
            --col-info: 240px;
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
        titleBar.innerHTML = '<span>Decompilation Process</span><div class="controls" style="display:flex; align-items:center;">' +
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
                    e.stopPropagation(); // Prevent drag of window

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
            // Sync with OptionsManager so the checkbox in Options dialog updates
            if (typeof OptionsManager !== 'undefined') {
                OptionsManager.setOption('showDecompilerLog', false);
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
        const enabled = OptionsManager.getOption('showDecompilerLog');
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
        const isEnabled = OptionsManager.getOption('showDecompilerLog');

        if (!isVisible && !isEnabled) return;

        if (this.element.style.display === 'none') this.element.style.display = 'flex';

        const row = document.createElement('div');
        row.style.borderBottom = '1px solid var(--border-color)';
        row.style.padding = '2px 0';
        row.style.display = 'grid';
        // Cols: Address(60px) | Bytes(80px) | Info(150px) | Comment(Flex)
        row.style.gridTemplateColumns = 'var(--col-addr) var(--col-bytes) var(--col-info) 1fr';
        row.style.gap = '5px';
        row.style.fontFamily = 'Consolas, monospace';
        row.style.fontSize = '12px';
        row.style.alignItems = 'baseline';

        // Helper: Determine Category based on OpName
        const getCategory = (opName) => {
            if (!opName) return '';
            opName = opName.toUpperCase().split(' ')[0]; // First word

            const FLOW = ['GOTO', 'IF', 'ELSE', 'ELSEIF', 'ENDIF', 'DO', 'UNTIL', 'WHILE', 'ENDWH', 'BREAK', 'CONTINUE', 'STOP', 'ONERR', 'RAISE', 'TRAP', 'BRANCHIFFALSE'];
            const STACK = ['PUSH', 'DROP', 'INT', 'FLT', 'Simple', 'Inline'];

            // Explicitly transparent: Just Comments now. 
            // Assignments (ASSIGN/STORE) should fall through to Green as they are "Commands".
            const TRANSPARENT = ['REM'];

            if (FLOW.includes(opName)) return 'log-row-flow';
            if (TRANSPARENT.includes(opName)) return '';
            if (STACK.includes(opName) || /^[A-Z]/.test(opName) === false) return ''; // Default/Stack (e.g. operators)

            // Heuristic for Operators/Math (Stack)
            if (['+', '-', '*', '/', '**', '=', '<', '>', 'AND', 'OR', 'NOT'].includes(opName)) return 'log-row-stack';

            // All other commands = Green
            return 'log-row-cmd';
        };

        const catClass = getCategory(entry.opName);
        if (catClass) {
            row.classList.add(catClass);
        }

        // 1. Address
        const addrDiv = document.createElement('div');
        addrDiv.style.color = '#888';
        if (entry.pc !== undefined && entry.pc !== null) addrDiv.innerText = entry.pc;
        if (entry.pc === 'DUMP') {
            addrDiv.innerText = ""; // Hide DUMP PC
            addrDiv.style.color = 'var(--status-bar-bg)';
        }
        row.appendChild(addrDiv);

        // 2. Data (Hex bytes or OpCode)
        const bytesDiv = document.createElement('div');
        bytesDiv.style.color = 'var(--syntax-number)';
        bytesDiv.innerText = entry.bytes || entry.op || "";
        row.appendChild(bytesDiv);

        // 3. Info (Opcode Name + Args)
        const infoDiv = document.createElement('div');
        infoDiv.style.color = 'var(--syntax-commands)';
        infoDiv.style.whiteSpace = 'nowrap';
        infoDiv.style.overflow = 'hidden';
        infoDiv.style.textOverflow = 'ellipsis';

        let infoText = entry.opName || "";
        if (entry.args) infoText += " " + entry.args;
        infoDiv.innerText = infoText;
        infoDiv.title = infoText;
        row.appendChild(infoDiv);

        // 4. Comment / Source / Stack
        const commentDiv = document.createElement('div');
        commentDiv.style.display = 'flex';
        commentDiv.style.flexDirection = 'column';

        if (entry.text) {
            const code = document.createElement('span');
            code.style.fontWeight = 'bold';
            code.style.color = 'var(--text-color)';
            code.innerText = entry.text.trim();
            commentDiv.appendChild(code);
        }

        if (entry.comment) {
            const extra = document.createElement('span');
            extra.style.color = '#888';
            extra.style.fontStyle = 'italic';
            extra.innerText = entry.comment;
            commentDiv.appendChild(extra);
        }

        if (entry.stack) {
            const stackSpan = document.createElement('span');
            stackSpan.style.fontSize = '10px';
            stackSpan.style.color = '#aaa';
            stackSpan.innerText = "Stack: " + entry.stack;
            commentDiv.appendChild(stackSpan);
        }

        row.appendChild(commentDiv);

        this.content.appendChild(row);
        this.content.scrollTop = this.content.scrollHeight;
    }

    copyToClipboard() {
        // Use :scope > div to only get the direct row children, not their internal divs
        const rows = this.content.querySelectorAll(':scope > div');
        let text = "Addr\tBytes\tInfo\tComment\n";
        rows.forEach(row => {
            const cells = Array.from(row.children).map(c => c.innerText.replace(/\n/g, ' '));
            text += cells.join('\t') + "\n";
        });

        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                // Potential feedback UI
            }).catch(err => {
                // console.error("Copy failed", err);
            });
        }
    }
}
