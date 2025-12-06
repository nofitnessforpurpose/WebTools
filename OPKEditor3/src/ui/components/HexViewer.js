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
        container.style.display = 'none';
        container.style.position = 'fixed';
        container.style.bottom = '20px';
        container.style.right = '20px';
        container.style.width = 'auto';
        container.style.minWidth = '300px';
        container.style.maxWidth = '90vw';
        container.style.height = '500px';
        container.style.backgroundColor = 'var(--modal-bg, #fff)';
        container.style.color = 'var(--text-color, #333)';
        container.style.border = '1px solid var(--modal-border-color, #ccc)';
        container.style.boxShadow = '0 4px 8px rgba(0,0,0,0.5)';
        container.style.zIndex = '1000';
        container.style.flexDirection = 'column';
        container.style.borderRadius = '5px';
        container.style.overflow = 'hidden';

        // Header
        var header = document.createElement('div');
        header.style.backgroundColor = 'var(--modal-header-bg, #f4f4f4)';
        header.style.color = 'var(--sidebar-header-text, #333)';
        header.style.padding = '8px 12px';
        header.style.borderBottom = '1px solid var(--modal-border-color, #ddd)';
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.cursor = 'move';

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

        // Content Area
        contentArea = document.createElement('div');
        contentArea.className = 'hex-viewer-content';
        contentArea.style.padding = '10px';
        contentArea.style.overflowY = 'auto';
        contentArea.style.flex = '1';
        contentArea.style.fontFamily = 'Consolas, monospace';
        contentArea.style.fontSize = '12px';
        contentArea.style.whiteSpace = 'pre';
        contentArea.style.backgroundColor = 'var(--editor-bg, #fafafa)';
        contentArea.style.color = 'var(--editor-text-color, #333)';
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

    function generateHexDump(data) {
        if (!data) return "No Data";
        var output = "";
        var len = data.length;
        var bytesPerRow = (typeof OptionsManager !== 'undefined') ? (OptionsManager.getOption('hexBytesPerRow') || 16) : 16;

        for (var i = 0; i < len; i += bytesPerRow) {
            // Address
            output += i.toString(16).toUpperCase().padStart(4, '0') + "  ";

            // Hex Bytes
            var hex = "";
            var ascii = "";
            for (var j = 0; j < bytesPerRow; j++) {
                if (i + j < len) {
                    var byte = data[i + j];
                    hex += byte.toString(16).toUpperCase().padStart(2, '0') + " ";
                    ascii += (byte >= 32 && byte <= 126) ? String.fromCharCode(byte) : ".";
                } else {
                    hex += "   ";
                }
            }
            output += hex + " " + ascii + "\n";
        }
        return output;
    }

    function show(data, title) {
        init();
        if (!data) return;

        titleArea.innerText = title || 'Hex Viewer';
        contentArea.innerText = generateHexDump(data);

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
        if (!contentArea) return;
        var text = contentArea.innerText;
        navigator.clipboard.writeText(text).then(function () {
            // Visual feedback could be added here
            // alert('Copied to clipboard');
        }, function (err) {
            console.error('Could not copy text: ', err);
        });
    }

    return {
        show: show,
        close: hide
    };

})();
