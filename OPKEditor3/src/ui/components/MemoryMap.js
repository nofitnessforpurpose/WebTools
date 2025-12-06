'use strict';

// Memory Map Component
// Visualizes the layout of the data pack

function renderMemoryMap(pack) {
    var container = document.createElement('div');
    container.className = 'memory-map-container';

    // Calculate Total Pack Size
    var sizeMultiplier = pack.items[0].data[1];
    var totalSize = sizeMultiplier * 8192;

    // Title
    var title = document.createElement('div');
    title.className = 'memory-map-title';
    title.innerText = "Memory Map (Total: " + (totalSize / 1024) + " KB)";
    container.appendChild(title);

    // Canvas Container
    var canvasContainer = document.createElement('div');
    canvasContainer.className = 'memory-map-bar';
    canvasContainer.style.position = 'relative'; // For tooltip positioning
    container.appendChild(canvasContainer);

    // Canvas
    var canvas = document.createElement('canvas');
    canvas.style.display = 'block';
    canvasContainer.appendChild(canvas);

    var ctx = canvas.getContext('2d');

    // Get Options
    var orientation = OptionsManager.getOption('memoryMapOrientation') || 'horizontal';
    var showPageBreaks = OptionsManager.getOption('memoryMapShowPageBreaks');
    if (showPageBreaks === undefined) showPageBreaks = true;
    var displaySize = OptionsManager.getOption('memoryMapDisplaySize') || 32768;

    // Helper to get CSS variable
    function getCSSVar(name) {
        return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    }

    var colors = {
        header: getCSSVar('--mm-color-header') || '#808080',
        procedure: getCSSVar('--mm-color-procedure') || '#d33682',
        datafile: getCSSVar('--mm-color-datafile') || '#268bd2',
        diary: getCSSVar('--mm-color-diary') || '#b58900',
        comms: getCSSVar('--mm-color-comms') || '#cb4b16',
        sheet: getCSSVar('--mm-color-sheet') || '#859900',
        pager: getCSSVar('--mm-color-pager') || '#6c71c4',
        notepad: getCSSVar('--mm-color-notepad') || '#2aa198',
        block: getCSSVar('--mm-color-block') || '#d33682',
        record: getCSSVar('--mm-color-record') || '#6c71c4',
        unknown: getCSSVar('--mm-color-unknown') || '#dc322f',
        free: getCSSVar('--mm-color-free') || '#073642'
    };

    // Calculate Scale
    var scale = totalSize / displaySize;
    scale = Math.max(0.1, scale);

    // Calculate Layout
    var chunkSize = displaySize;
    var numChunks = Math.ceil(totalSize / chunkSize);

    // Canvas Dimensions
    var labelWidth = 60; // Space for labels
    var rowHeight = OptionsManager.getOption('memoryMapBarHeight') || 30;
    var rowGap = 10;
    var topPadding = 10; // Padding at the top of the canvas
    var barX = labelWidth; // X offset for the bar

    var isSplit = (orientation !== 'vertical');
    var regions = [];

    // Draw Function
    function draw() {
        var containerWidth = container.clientWidth;
        if (containerWidth === 0) return; // Not visible yet

        // Calculate dynamic bar width
        // Available width - labels (left/right) - scrollbar safety/padding
        var availableWidth = containerWidth - (labelWidth * 2) - 20;
        var barWidth = Math.max(100, availableWidth); // Minimum 100px
        var rowWidth = barWidth + (labelWidth * 2);

        // Update Canvas Size
        if (!isSplit) {
            // Vertical Mode
            var scale = totalSize / displaySize;
            canvas.width = 50;
            canvas.height = 2000; // Internal resolution
            canvas.style.width = '50px';
            canvas.style.height = (scale * 100) + '%';

            canvasContainer.style.height = '100%';
            canvasContainer.style.width = '50px';
            canvasContainer.style.overflowY = 'auto';
            canvasContainer.style.overflowX = 'hidden';

            container.style.height = '100%';
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
        } else {
            // Horizontal Mode
            canvas.width = rowWidth;
            // Recalculate height based on new width (if it affects wrapping, though here it's fixed chunks)
            // Actually, chunk size is fixed by displaySize option, so number of chunks is constant.
            // But we need to redraw everything with new width.
            canvas.height = numChunks * (rowHeight + rowGap) + topPadding;
            canvas.style.height = canvas.height + 'px';
            canvas.style.width = rowWidth + 'px';

            // Flex layout for container to handle scrolling properly
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.height = '100%';
            container.style.overflow = 'hidden'; // Hide container overflow

            canvasContainer.style.width = '100%';
            canvasContainer.style.overflowX = 'hidden';
            canvasContainer.style.height = '100%'; // Take remaining height
            canvasContainer.style.flex = '1';
            canvasContainer.style.minHeight = '0'; // Allow shrinking
            canvasContainer.style.overflowY = 'auto'; // Enable vertical scroll here
        }

        var ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        regions = []; // Reset regions

        // Helper to draw a rect
        function drawRect(start, len, color, item) {
            ctx.fillStyle = color;

            if (!isSplit) {
                // Vertical (Single Bar)
                var y = (start / totalSize) * canvas.height;
                var h = (len / totalSize) * canvas.height;
                ctx.fillRect(0, y, canvas.width, h);

                // Border
                ctx.lineWidth = 1;
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
                ctx.strokeRect(0, y, canvas.width, h);

                // Separator
                ctx.fillStyle = getCSSVar('--mm-bg') || '#1e1e1e';
                ctx.fillRect(0, y + h - 1, canvas.width, 1);

                regions.push({
                    item: item, offset: start, len: len,
                    x: 0, y: y, w: canvas.width, h: h
                });
            } else {
                // Horizontal (Split Rows)
                var startChunk = Math.floor(start / chunkSize);
                var endChunk = Math.floor((start + len - 1) / chunkSize);

                for (var c = startChunk; c <= endChunk; c++) {
                    var chunkOffset = c * chunkSize;
                    var chunkEnd = chunkOffset + chunkSize;

                    var drawStart = Math.max(start, chunkOffset);
                    var drawEnd = Math.min(start + len, chunkEnd);
                    var drawLen = drawEnd - drawStart;

                    if (drawLen <= 0) continue;

                    var x = barX + ((drawStart - chunkOffset) / chunkSize) * barWidth;
                    var w = (drawLen / chunkSize) * barWidth;
                    var y = c * (rowHeight + rowGap) + topPadding;

                    ctx.fillStyle = color;
                    ctx.fillRect(x, y, w, rowHeight);

                    // Border
                    ctx.lineWidth = 1;
                    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
                    ctx.strokeRect(x, y, w, rowHeight);

                    // Separator (only at the very end of the item)
                    if (drawEnd === start + len) {
                        // Use background color to create a "cut" effect
                        ctx.fillStyle = getCSSVar('--mm-bg') || '#1e1e1e';
                        // Make it 1px wide for better visibility
                        ctx.fillRect(x + w - 1, y, 1, rowHeight);
                    }

                    // Deleted Item Overlay
                    if (item && item.deleted) {
                        // Dark overlay
                        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                        ctx.fillRect(x, y, w, rowHeight);

                        // Hatching
                        ctx.save();
                        ctx.beginPath();
                        ctx.rect(x, y, w, rowHeight);
                        ctx.clip();

                        ctx.beginPath();
                        ctx.strokeStyle = 'rgba(255, 50, 50, 0.8)';
                        ctx.lineWidth = 2; // Thicker lines
                        var spacing = 6; // Denser spacing

                        // Draw diagonal lines (45 degrees)
                        // Start from x - rowHeight to cover the top-left corner
                        for (var lx = x - rowHeight; lx < x + w; lx += spacing) {
                            ctx.moveTo(lx, y);
                            ctx.lineTo(lx + rowHeight, y + rowHeight);
                        }
                        ctx.stroke();
                        ctx.restore();
                    }

                    regions.push({
                        item: item, offset: start, len: len, // Original item info
                        x: x, y: y, w: w, h: rowHeight       // Region on canvas
                    });
                }
            }
        }

        // Draw Items
        var currentOffset = 0;
        for (var i = 0; i < pack.items.length; i++) {
            var item = pack.items[i];
            // REMOVED: if (item.deleted) continue; 
            // We now want to show deleted items

            var len = item.getLength();
            var color = colors.unknown;
            if (item.type === -1) color = colors.header;
            else if (item.type === 1) color = colors.datafile;
            else if (item.type === 2) color = colors.diary;
            else if (item.type === 3) color = colors.procedure;
            else if (item.type === 4) color = colors.comms;
            else if (item.type === 5) color = colors.sheet;
            else if (item.type === 6) color = colors.pager;
            else if (item.type === 7) color = colors.notepad;
            else if (item.type >= 8 && item.type <= 15) color = colors.block;
            else if (item.type >= 16 && item.type <= 126) color = colors.record;

            drawRect(currentOffset, len, color, item);
            currentOffset += len;
        }

        // Free Space
        var usedSize = currentOffset;
        var freeSize = totalSize - usedSize;
        if (freeSize > 0) {
            drawRect(usedSize, freeSize, colors.free, null);
        }

        // Page Boundary Markers
        var isPaged = (pack.items[0].data[0] !== 0x7a);
        if (showPageBreaks && isPaged) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            var pageSize = 256;
            var tickHeight = isSplit ? 4 : 2;

            for (var offset = pageSize; offset < totalSize; offset += pageSize) {
                if (!isSplit) {
                    var y = (offset / totalSize) * canvas.height;
                    ctx.fillRect(0, y, 4, 1);
                    ctx.fillRect(canvas.width - 4, y, 4, 1);
                } else {
                    var c = Math.floor(offset / chunkSize);
                    var chunkOffset = c * chunkSize;
                    var x = barX + ((offset - chunkOffset) / chunkSize) * barWidth;
                    var y = c * (rowHeight + rowGap) + topPadding;
                    ctx.fillRect(x, y, 1, tickHeight);
                    ctx.fillRect(x, y + rowHeight - tickHeight, 1, tickHeight);
                }
            }
        }

        // Address Labels & Arrows
        if (isSplit) {
            ctx.font = '10px Consolas, monospace';
            ctx.textBaseline = 'middle';
            var arrowColor = 'rgba(128, 128, 128, 0.5)';
            var arrowHeadColor = 'rgba(128, 128, 128, 0.8)';
            var textColor = OptionsManager.getOption('theme') === 'light' ? '#000' : '#ccc';

            for (var c = 0; c < numChunks; c++) {
                var startAddr = c * chunkSize;
                var endAddr = Math.min((c + 1) * chunkSize, totalSize) - 1;
                if (endAddr < startAddr) endAddr = startAddr;

                var currentY = c * (rowHeight + rowGap) + topPadding;

                var yTextStart = currentY + (rowHeight * 0.9);
                var startHex = startAddr.toString(16).toUpperCase().padStart(4, '0');
                ctx.textAlign = 'right';
                ctx.fillStyle = textColor;
                ctx.fillText(startHex, barX - 5, yTextStart);

                var yTextEnd = currentY + (rowHeight * 0.25);
                var endHex = endAddr.toString(16).toUpperCase().padStart(4, '0');
                ctx.textAlign = 'left';
                ctx.fillText(endHex, barX + barWidth + 5, yTextEnd);

                if (c < numChunks - 1) {
                    var centerY = currentY + (rowHeight / 2);
                    var nextCenterY = (c + 1) * (rowHeight + rowGap) + (rowHeight / 2) + topPadding;
                    var midGapY = currentY + rowHeight + (rowGap / 2);
                    var rightEdge = barX + barWidth;
                    var leftEdge = barX;
                    var offset = 12.5;

                    ctx.beginPath();
                    ctx.strokeStyle = arrowColor;
                    ctx.lineWidth = 1;
                    ctx.moveTo(rightEdge, centerY);
                    ctx.lineTo(rightEdge + offset, centerY);
                    ctx.lineTo(rightEdge + offset, midGapY);
                    ctx.lineTo(leftEdge - offset, midGapY);
                    ctx.lineTo(leftEdge - offset, nextCenterY);
                    ctx.lineTo(leftEdge, nextCenterY);
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.fillStyle = arrowHeadColor;
                    ctx.moveTo(leftEdge, nextCenterY);
                    ctx.lineTo(leftEdge - 8, nextCenterY - 4);
                    ctx.lineTo(leftEdge - 8, nextCenterY + 4);
                    ctx.fill();
                }
            }
        }
    }

    // Initial Draw
    // Use setTimeout to ensure container is in DOM and has width
    setTimeout(draw, 0);

    // Resize Observer
    if (window.ResizeObserver) {
        var ro = new ResizeObserver(function (entries) {
            // Debounce or just draw? Draw is fast enough usually.
            window.requestAnimationFrame(draw);
        });
        ro.observe(container);
    } else {
        // Fallback
        window.addEventListener('resize', draw);
    }

    // Tooltip Logic
    canvas.addEventListener('mousemove', function (e) {
        var rect = canvas.getBoundingClientRect();
        var scaleX = canvas.width / rect.width;
        var scaleY = canvas.height / rect.height;
        var mouseX = (e.clientX - rect.left) * scaleX;
        var mouseY = (e.clientY - rect.top) * scaleY;

        var found = false;
        for (var i = 0; i < regions.length; i++) {
            var r = regions[i];
            if (mouseX >= r.x && mouseX < r.x + r.w &&
                mouseY >= r.y && mouseY < r.y + r.h) {

                var cycles = getAccessCycles(r.offset, pack);
                var tooltipText = "";
                if (r.item) {
                    var status = r.item.deleted ? "Deleted" : "Active";
                    tooltipText = (r.item.name || getItemDescription(r.item)) + "\n" +
                        "Type: " + r.item.type + "\n" +
                        "Status: " + status + "\n" +
                        "Size: " + r.len + " bytes\n" +
                        "Offset: 0x" + r.offset.toString(16).toUpperCase() + "\n" +
                        "Access Cycles: " + cycles;
                } else {
                    cycles = getAccessCycles(r.offset, pack);
                    tooltipText = "Free Space\nSize: " + r.len + " bytes\n" +
                        "Offset: 0x" + r.offset.toString(16).toUpperCase() + "\n" +
                        "Access Cycles: " + cycles;
                }
                canvas.title = tooltipText;
                found = true;
                break;
            }
        }
        if (!found) canvas.title = "";
    });

    // Click Logic for Hex Viewer
    canvas.addEventListener('click', function (e) {
        var rect = canvas.getBoundingClientRect();
        var scaleX = canvas.width / rect.width;
        var scaleY = canvas.height / rect.height;
        var mouseX = (e.clientX - rect.left) * scaleX;
        var mouseY = (e.clientY - rect.top) * scaleY;

        for (var i = 0; i < regions.length; i++) {
            var r = regions[i];
            if (mouseX >= r.x && mouseX < r.x + r.w &&
                mouseY >= r.y && mouseY < r.y + r.h) {

                if (r.item && HexViewer) {
                    // Reconstruct full data from item and its children
                    var totalLen = r.item.getLength();
                    var fullData = new Uint8Array(totalLen);
                    r.item.storeData(fullData, 0);

                    var dataToShow = fullData;
                    var title = r.item.name || getItemDescription(r.item);

                    // If it's free space (no item), r.item is null
                    if (!r.item) {
                        return;
                    }

                    HexViewer.show(dataToShow, "Hex View: " + title);
                }
                break;
            }
        }
    });

    // Helper to calculate access cycles
    function getAccessCycles(address, pack) {
        if (!pack || !pack.items || pack.items.length === 0) return 0;

        var id = pack.items[0].data[0];
        var size = pack.items[0].data[1];
        var isPaged = (id & 0x04) !== 0;
        var isSegmented = (size === 0x10); // 128k (16 * 8k)

        if (isSegmented) {
            var segOffset = address % 16384;
            var page = Math.floor(segOffset / 256);
            var byte = segOffset % 256;
            return page + byte;
        } else if (isPaged) {
            var page = Math.floor(address / 256);
            var byte = address % 256;
            return page + byte;
        } else {
            return address;
        }
    }

    // Legend
    var legend = document.createElement('div');
    legend.className = 'memory-map-legend';

    function createLegendItem(label, colorKey) {
        var span = document.createElement('span');
        span.className = 'mm-legend-item';
        var swatch = document.createElement('span');
        swatch.className = 'mm-swatch';
        swatch.style.backgroundColor = colors[colorKey];
        span.appendChild(swatch);
        span.appendChild(document.createTextNode(label));
        return span;
    }

    legend.appendChild(createLegendItem('Header', 'header'));
    legend.appendChild(createLegendItem('Proc', 'procedure'));
    legend.appendChild(createLegendItem('Data', 'datafile'));
    legend.appendChild(createLegendItem('Diary', 'diary'));
    legend.appendChild(createLegendItem('Comms', 'comms'));
    legend.appendChild(createLegendItem('Sheet', 'sheet'));
    legend.appendChild(createLegendItem('Pager', 'pager'));
    legend.appendChild(createLegendItem('Note', 'notepad'));
    legend.appendChild(createLegendItem('Block', 'block'));
    legend.appendChild(createLegendItem('Rec', 'record'));
    legend.appendChild(createLegendItem('Free', 'free'));

    container.appendChild(legend);

    return container;
}

