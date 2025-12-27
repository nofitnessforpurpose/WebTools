'use strict';

// Hex Viewer Component
// Floating window to display hex dump of memory map items

var HexViewer = (function () {
    var container = null;
    var contentArea = null;
    var titleArea = null;
    var isVisible = false;

    function init() {
        if (container) return;

        // Create Container
        container = document.createElement('div');
        container.className = 'hex-viewer-window';
        container.style.width = '520px';
        container.style.minWidth = '350px';
        container.style.maxWidth = '90vw';
        container.style.height = '400px';
        container.style.backgroundColor = 'var(--bg-color, #fff)';
        container.style.color = 'var(--text-color, #333)';
        container.style.border = '1px solid var(--border-color, #ccc)';
        container.style.boxShadow = '0 4px 12px rgba(0,0,0,0.5)';
        container.style.zIndex = '2000';
        container.style.flexDirection = 'column';
        container.style.borderRadius = '4px';
        container.style.resize = 'both';
        container.style.overflow = 'hidden';
        container.style.position = 'fixed';
        container.style.left = '100px';
        container.style.top = '100px';
        container.style.display = 'none';

        // Column Config
        container.style.setProperty('--col-addr', '45px');
        container.style.setProperty('--col-bytes', '230px');
        container.style.setProperty('--col-ascii', '1fr');

        // Header
        var header = document.createElement('div');
        header.style.backgroundColor = 'var(--status-bar-bg, #f4f4f4)';
        header.style.color = 'white';
        header.style.padding = '5px 10px';
        header.style.borderBottom = '1px solid var(--border-color, #ddd)';
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.cursor = 'move';
        header.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
        header.style.fontSize = '13px';
        header.style.flexShrink = '0';

        titleArea = document.createElement('span');
        titleArea.style.fontWeight = 'bold';
        titleArea.style.fontSize = '14px';
        titleArea.innerText = 'Hex Viewer';

        var controls = document.createElement('div');

        // Copy Button
        var copyBtn = document.createElement('button');
        copyBtn.className = 'icon-btn';
        copyBtn.title = 'Copy to Clipboard';
        copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
        copyBtn.style.marginRight = '10px';
        copyBtn.style.background = 'none';
        copyBtn.style.border = 'none';
        copyBtn.style.cursor = 'pointer';
        copyBtn.style.color = 'var(--icon-color, #555)';
        copyBtn.onclick = copyToClipboard;

        // Close Button
        var closeBtn = document.createElement('button');
        closeBtn.className = 'icon-btn';
        closeBtn.title = 'Close';
        closeBtn.innerHTML = '<i class="fas fa-times"></i>';
        closeBtn.style.background = 'none';
        closeBtn.style.border = 'none';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.color = 'var(--icon-color, #555)';
        closeBtn.onclick = hide;

        controls.appendChild(copyBtn);
        controls.appendChild(closeBtn);
        header.appendChild(titleArea);
        header.appendChild(controls);
        container.appendChild(header);

        // Grid Header
        var gridHeader = document.createElement('div');
        gridHeader.style.cssText = `
            display: grid;
            grid-template-columns: var(--col-addr) var(--col-bytes) var(--col-ascii);
            gap: 10px;
            padding: 4px 10px;
            background-color: var(--bg-color);
            border-bottom: 2px solid var(--border-color);
            font-family: 'Consolas', monospace;
            font-weight: bold;
            font-size: 12px;
            color: var(--text-color);
            flex-shrink: 0;
            user-select: none;
            position: relative;
        `;

        var addrLabel = document.createElement('div');
        addrLabel.innerText = 'Addr';
        var bytesLabel = document.createElement('div');
        bytesLabel.innerText = 'Hex Bytes';
        var asciiLabel = document.createElement('div');
        asciiLabel.innerText = 'ASCII';

        gridHeader.appendChild(addrLabel);
        gridHeader.appendChild(bytesLabel);
        gridHeader.appendChild(asciiLabel);

        // Resize Handles
        function createResizer(targetVar) {
            var handle = document.createElement('div');
            handle.style.cssText = `
                position: absolute;
                top: 0;
                bottom: 0;
                width: 6px;
                cursor: col-resize;
                z-index: 5;
            `;

            var isResizing = false;
            var startX, startWidth;

            handle.addEventListener('mousedown', function (e) {
                isResizing = true;
                startX = e.clientX;
                var currentVal = container.style.getPropertyValue(targetVar);
                startWidth = parseInt(currentVal, 10);
                document.body.style.cursor = 'col-resize';
                e.preventDefault();
            });

            document.addEventListener('mousemove', function (e) {
                if (!isResizing) return;
                var dx = e.clientX - startX;
                var newWidth = Math.max(40, startWidth + dx);
                container.style.setProperty(targetVar, newWidth + 'px');
                updateResizerPositions();
            });

            document.addEventListener('mouseup', function () {
                if (isResizing) {
                    isResizing = false;
                    document.body.style.cursor = '';
                }
            });

            return handle;
        }

        var resizer1 = createResizer('--col-addr');
        var resizer2 = createResizer('--col-bytes');
        gridHeader.appendChild(resizer1);
        gridHeader.appendChild(resizer2);

        function updateResizerPositions() {
            var addrW = parseInt(container.style.getPropertyValue('--col-addr'), 10);
            var bytesW = parseInt(container.style.getPropertyValue('--col-bytes'), 10);
            // Positions relative to gridHeader
            resizer1.style.left = (addrW + 10 / 2) + 'px';
            resizer2.style.left = (addrW + 10 + bytesW + 10 / 2) + 'px';
        }

        updateResizerPositions();
        container.appendChild(gridHeader);
        container._updateResizers = updateResizerPositions;

        // Content Area
        contentArea = document.createElement('div');
        contentArea.className = 'hex-viewer-content';
        contentArea.style.padding = '0 10px';
        contentArea.style.overflowY = 'auto';
        contentArea.style.flex = '1';
        contentArea.style.fontFamily = 'Consolas, monospace';
        contentArea.style.fontSize = '12px';
        contentArea.style.backgroundColor = 'var(--bg-color, #fafafa)';
        contentArea.style.color = 'var(--text-color, #333)';
        container.appendChild(contentArea);

        container.appendChild(contentArea);

        document.body.appendChild(container);

        // Simple Drag Support
        var isDragging = false;
        var startX, startY, initialLeft, initialTop;

        header.addEventListener('mousedown', function (e) {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            var rect = container.getBoundingClientRect();
            initialLeft = rect.left;
            initialTop = rect.top;
            // Unset bottom/right to allow positioning via top/left
            container.style.bottom = 'auto';
            container.style.right = 'auto';
            container.style.left = initialLeft + 'px';
            container.style.top = initialTop + 'px';
            e.preventDefault();
        });

        document.addEventListener('mousemove', function (e) {
            if (!isDragging) return;
            var dx = e.clientX - startX;
            var dy = e.clientY - startY;
            container.style.left = (initialLeft + dx) + 'px';
            container.style.top = (initialTop + dy) + 'px';
        });

        document.addEventListener('mouseup', function () {
            isDragging = false;
        });
    }

    function populateGrid(data) {
        contentArea.innerHTML = '';
        if (!data) return;

        var len = data.length;
        var bytesPerRow = (typeof OptionsManager !== 'undefined') ? (OptionsManager.getOption('hexBytesPerRow') || 16) : 16;

        // Dynamic Width Logic:
        // Adjust column width based on bytes per row to prevent wrapping
        var bytesColWidth = (bytesPerRow * 19) + 20;
        container.style.setProperty('--col-bytes', bytesColWidth + 'px');
        if (container._updateResizers) container._updateResizers();

        for (var i = 0; i < len; i += bytesPerRow) {
            var row = document.createElement('div');
            row.style.cssText = `
                display: grid;
                grid-template-columns: var(--col-addr) var(--col-bytes) var(--col-ascii);
                gap: 10px;
                padding: 2px 0;
                border-bottom: 1px solid var(--border-color);
                align-items: baseline;
            `;

            // 1. Address
            var addrDiv = document.createElement('div');
            addrDiv.style.color = '#888';
            addrDiv.innerText = i.toString(16).toUpperCase().padStart(4, '0');
            row.appendChild(addrDiv);

            // 2. Hex Bytes
            var hexDiv = document.createElement('div');
            hexDiv.style.color = 'var(--syntax-number, #268bd2)';
            var hexValues = [];
            for (var j = 0; j < bytesPerRow; j++) {
                if (i + j < len) {
                    hexValues.push(data[i + j].toString(16).toUpperCase().padStart(2, '0'));
                }
            }
            hexDiv.innerText = hexValues.join(' ');
            row.appendChild(hexDiv);

            // 3. ASCII
            var asciiDiv = document.createElement('div');
            asciiDiv.style.color = 'var(--text-color)';
            var asciiStr = "";
            for (var j = 0; j < bytesPerRow; j++) {
                if (i + j < len) {
                    var byte = data[i + j];
                    asciiStr += (byte >= 32 && byte <= 126) ? String.fromCharCode(byte) : ".";
                }
            }
            asciiDiv.innerText = asciiStr;
            row.appendChild(asciiDiv);

            contentArea.appendChild(row);
        }
    }

    function generatePlainText(data) {
        if (!data) return "No Data";
        var output = "Addr\tHex Bytes\tASCII\n";
        var len = data.length;
        var bytesPerRow = (typeof OptionsManager !== 'undefined') ? (OptionsManager.getOption('hexBytesPerRow') || 16) : 16;
        for (var i = 0; i < len; i += bytesPerRow) {
            var hex = [];
            var ascii = "";
            for (var j = 0; j < bytesPerRow; j++) {
                if (i + j < len) {
                    var b = data[i + j];
                    hex.push(b.toString(16).toUpperCase().padStart(2, '0'));
                    ascii += (b >= 32 && b <= 126) ? String.fromCharCode(b) : ".";
                }
            }
            output += i.toString(16).toUpperCase().padStart(4, '0') + "\t" + hex.join(' ') + "\t" + ascii + "\n";
        }
        return output;
    }

    var currentData = null;

    function show(data, title) {
        init();
        if (!data) return;
        currentData = data;

        titleArea.innerText = title || 'Hex Viewer';
        populateGrid(data);

        container.style.display = 'flex';
        isVisible = true;
    }

    function hide() {
        if (container) {
            container.style.display = 'none';
        }
        isVisible = false;
    }

    function copyToClipboard() {
        if (!currentData) return;
        var text = generatePlainText(currentData);
        navigator.clipboard.writeText(text).then(function () {
        }, function (err) {
            console.error('Could not copy text: ', err);
        });
    }

    return {
        show: show,
        close: hide
    };

})();
