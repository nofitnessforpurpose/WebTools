'use strict';

// Memory Map Component
// Visualizes the layout of the data pack

function renderMemoryMap(pack) {
    var container = document.createElement('div');
    container.className = 'memory-map-container';

    // Calculate Total Pack Size (from Header)
    var sizeMultiplier = pack.items[0].data[1];
    // Fix: Size Code is linear (multiplier of 8KB), e.g., 0x08 = 64KB.
    // Logic: 8KB * code
    var totalSize = 8192 * sizeMultiplier;

    // Calculate Actual Used Size
    var usedSize = 0;
    for (var i = 0; i < pack.items.length; i++) {
        usedSize += pack.items[i].getLength();
    }

    // Determine Render Size (Graph consumes max of Header Size or Content Size)
    // This supports "Overflow" visualization without clipping.
    var renderTotalSize = Math.max(totalSize, usedSize);

    // Title
    var titleText = "Memory Map (Set: " + (totalSize / 1024) + " KB";
    if (usedSize > totalSize) {
        titleText += ", Used: " + (Math.round(usedSize / 1024 * 10) / 10) + " KB [OVERFLOW]";
    } else {
        titleText += ")";
    }

    var title = document.createElement('div');
    title.className = 'memory-map-title';
    title.innerText = titleText;
    container.appendChild(title);

    // Canvas Container
    var canvasContainer = document.createElement('div');
    canvasContainer.className = 'memory-map-bar';
    canvasContainer.style.position = 'relative'; // For tooltip positioning
    canvasContainer.style.marginTop = '15px'; // User Request: Add space between title and memory bar
    container.appendChild(canvasContainer);

    // Canvas
    var canvas = document.createElement('canvas');
    canvas.style.display = 'block';
    canvasContainer.appendChild(canvas);

    var ctx = canvas.getContext('2d');

    // Get Options
    var orientation = OptionsManager.getOption('memoryMapOrientation') || 'horizontal';
    var isVertical = (orientation === 'vertical');

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

    // Calculate Layout
    var chunkSize = displaySize;
    // Use renderTotalSize for chunks so we see everything
    var numChunks = Math.ceil(renderTotalSize / chunkSize);

    // Dimensions
    var labelSize = 25; // Height for labels in vertical, Width in horizontal

    // 2) Re-coupling:
    // User Request: "Use the Options Dialog feature bar width to set the bar width."
    // and "Rename ... to 'Memory Map Bar Weight'".
    // So we use the option 'memoryMapBarHeight' (weight) for BOTH Vertical (Width) and Horizontal (Height).

    var barThickness = OptionsManager.getOption('memoryMapBarHeight') || 30; // Default

    // Increase the bar spacing in the vertical bar memory map view.
    var gap = isVertical ? 40 : 20; // Increased to 40 for Vertical, keep 20 for Horizontal
    var padding = 20; // Padding around canvas content

    var regions = [];

    // Draw Function
    function draw() {
        var containerWidth = container.clientWidth;
        var containerHeight = container.clientHeight;
        if (containerWidth === 0 || containerHeight === 0) return;

        // Reset Styles
        canvasContainer.style.overflowX = 'hidden';
        canvasContainer.style.overflowY = 'hidden';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';

        if (isVertical) {
            // VERTICAL MODE (Columns)
            // Use fixed barThickness (30) from above

            // Available Height determines the "length" of the bar representation of chunkSize
            // Height - Labels(Top/Bottom) - Scrollbar/Padding
            var availableHeight = containerHeight - (labelSize * 2) - 40;
            // User Request: Reduce height of vertical bars by 10%
            var barHeight = Math.max(100, availableHeight * 0.9); // 90% of available height

            // Each column is: label + bar + label
            // Width is: numChunks * (barThickness + gap)
            var totalWidth = numChunks * (barThickness + gap) + padding * 2;

            canvas.width = totalWidth;
            // Set canvas height to match the calculated bar height + labels
            canvas.height = Math.round(barHeight + (labelSize * 2));

            canvas.style.width = totalWidth + 'px';
            canvas.style.height = canvas.height + 'px';

            // Title
            // DEBUG V4
            // Title Override removed (User Request)
            // title.innerText = "Memory Map [v4|H:" + Math.round(barHeight) + "/" + containerHeight + "]";

            canvasContainer.style.width = '100%';
            canvasContainer.style.height = '100%';
            canvasContainer.style.overflowX = 'auto'; // Horizontal Scroll
            canvasContainer.style.overflowY = 'auto'; // Vertical Scroll needed for tall bars/small container

        } else {
            // HORIZONTAL MODE (Rows)
            // Use barThickness from Option (calculated above)

            // Available Width determines length
            var availableWidth = containerWidth - (60 * 2) - 20; // 60px side labels
            var barWidth = Math.max(100, availableWidth);

            var totalHeight = Math.ceil(numChunks * (barThickness + gap) + padding * 2);

            // Safety Check: Ensure dimensions are valid positive integers
            var safeW = Math.max(1, Math.floor(barWidth + (60 * 2)));
            var safeH = Math.max(1, Math.floor(totalHeight));

            // Prevent huge canvas crash
            if (safeH > 32000) safeH = 32000; // Limit height roughly

            canvas.width = safeW;
            canvas.height = safeH;
            canvas.style.width = safeW + 'px';
            canvas.style.height = safeH + 'px';

            canvasContainer.style.width = '100%';
            canvasContainer.style.height = '100%';
            canvasContainer.style.overflowY = 'auto'; // Vertical Scroll
        }

        var ctx = canvas.getContext('2d');
        // Safety: Reset context to be sure? 
        // ctx.beginPath(); // Clear paths

        try {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            regions = [];

            // Common Draw Rect Helper
            function drawRect(start, len, color, item) {
                var startChunk = Math.floor(start / chunkSize);
                var endChunk = Math.floor((start + len - 1) / chunkSize);

                for (var c = startChunk; c <= endChunk; c++) {
                    var chunkOffset = c * chunkSize;
                    var chunkEnd = chunkOffset + chunkSize;

                    var drawStart = Math.max(start, chunkOffset);
                    var drawEnd = Math.min(start + len, chunkEnd);
                    var drawLen = drawEnd - drawStart;

                    if (drawLen <= 0) continue;

                    var x, y, w, h;

                    if (isVertical) {
                        var barHeight = canvas.height - (labelSize * 2);
                        var chunkYStart = labelSize; // Top label gap

                        var relStart = (drawStart - chunkOffset) / chunkSize;
                        var relLen = drawLen / chunkSize;

                        x = padding + c * (barThickness + gap);
                        y = chunkYStart + (relStart * barHeight);
                        w = barThickness;
                        h = relLen * barHeight;
                    } else {
                        var barWidth = canvas.width - (60 * 2);
                        var chunkXStart = 60;

                        var relStart = (drawStart - chunkOffset) / chunkSize;
                        var relLen = drawLen / chunkSize;

                        x = chunkXStart + (relStart * barWidth);
                        y = padding + c * (barThickness + gap);
                        w = relLen * barWidth;
                        h = barThickness;
                    }

                    ctx.fillStyle = color;
                    ctx.fillRect(x, y, w, h);

                    // Border
                    ctx.lineWidth = 1;
                    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
                    ctx.strokeRect(x, y, w, h);

                    // End Separator
                    if (drawEnd === start + len) {
                        ctx.fillStyle = getCSSVar('--mm-bg') || '#1e1e1e';
                        if (isVertical) ctx.fillRect(x, y + h - 1, w, 1);
                        else ctx.fillRect(x + w - 1, y, 1, h);
                    }

                    // Deleted Overlay
                    if (item && item.deleted) {
                        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                        ctx.fillRect(x, y, w, h);

                        // Fine Hatch Pattern
                        ctx.save();
                        ctx.beginPath();
                        ctx.rect(x, y, w, h);
                        ctx.clip();

                        ctx.beginPath();
                        ctx.strokeStyle = 'rgba(255, 50, 50, 0.5)'; // Slightly more transparent for density
                        ctx.lineWidth = 1; // Thinner lines

                        var spacing = 8; // Coarser spacing
                        // Draw diagonals (Top-Right to Bottom-Left for contrast, or standard /)
                        // Drawing / diagonals: x + offset
                        var diagOffset = w + h;
                        for (var i = -h; i < w; i += spacing) {
                            ctx.moveTo(x + i, y);
                            ctx.lineTo(x + i + h + spacing, y + h + spacing); // Extend slightly to cover corners
                        }
                        ctx.stroke();
                        ctx.restore();
                    }

                    regions.push({
                        item: item, offset: start, len: len,
                        x: x, y: y, w: w, h: h
                    });
                }
            }

            // iterate items
            var currentOffset = 0;
            for (var i = 0; i < pack.items.length; i++) {
                var item = pack.items[i];
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

            // Page Breaks
            // Removed isPaged check to ensure markers always display if option is enabled
            // var isPaged = (pack.items[0].data[0] !== 0x7a);
            if (showPageBreaks) {
                // Use Sidebar Text Color (User Request)
                // Fallback to Red if not found
                var markerColor = getCSSVar('--sidebar-item-text') || 'rgba(255, 0, 0, 0.7)';
                ctx.fillStyle = markerColor;
                var pageSize = 256;

                for (var offset = pageSize; offset < totalSize; offset += pageSize) {
                    var c = Math.floor(offset / chunkSize);
                    var chunkOffset = c * chunkSize;

                    if (isVertical) {
                        var barHeight = canvas.height - (labelSize * 2);
                        var yOffset = labelSize + ((offset - chunkOffset) / chunkSize) * barHeight;
                        var xOffset = padding + c * (barThickness + gap);

                        ctx.fillRect(xOffset, yOffset, 4, 1);
                        ctx.fillRect(xOffset + barThickness - 4, yOffset, 4, 1);
                    } else {
                        var barWidth = canvas.width - (60 * 2);
                        var xOffset = 60 + ((offset - chunkOffset) / chunkSize) * barWidth;
                        var yOffset = padding + c * (barThickness + gap);

                        ctx.fillRect(xOffset, yOffset, 1, 4);
                        ctx.fillRect(xOffset, yOffset + barThickness - 4, 1, 4);
                    }
                }
            }

            // Labels & Arrows
            ctx.font = '10px Consolas, monospace';
            ctx.fillStyle = OptionsManager.getOption('theme') === 'light' ? '#000' : '#ccc';
            var arrowColor = 'rgba(128, 128, 128, 0.5)';

            for (var c = 0; c < numChunks; c++) {
                var startAddr = c * chunkSize;
                var endAddr = Math.min((c + 1) * chunkSize, totalSize) - 1;
                if (endAddr < startAddr) endAddr = startAddr;

                var startHex = startAddr.toString(16).toUpperCase().padStart(4, '0');
                var endHex = endAddr.toString(16).toUpperCase().padStart(4, '0');

                if (isVertical) {
                    var x = padding + c * (barThickness + gap);
                    var midX = x + (barThickness / 2);

                    // Top Label
                    // User Request: Move start of bar memory text to the left side of the bar
                    ctx.textAlign = 'right';
                    // User Request: Move slightly more to the left
                    ctx.fillText(startHex, midX - 12, labelSize - 5);

                    // Bottom Label
                    // User Request: Move end of bar memory text to the equivalent position on the right of the bar
                    ctx.textAlign = 'left';
                    // User Request: Move slightly more to the right
                    ctx.fillText(endHex, midX + 12, canvas.height - labelSize + 12);

                    // Arrow (Bottom to Top-Next)
                    if (c < numChunks - 1) {
                        var nextX = padding + (c + 1) * (barThickness + gap);
                        var nextMidX = nextX + (barThickness / 2);

                        // Link Line: End of bar (Bottom Center) -> Start of next bar (Top Center)
                        var startX = midX;
                        var startY = canvas.height - labelSize + 2; // Just below bar
                        var endX = nextMidX;
                        var endY = labelSize - 2; // Just above next bar

                        var gapCenterX = x + barThickness + (gap / 2); // Midpoint between current bar right edge and next bar left edge

                        // User Request: Reduce vertical distance offset by 15%
                        var offsetDist = (labelSize - 4) * 0.85;
                        var bottomTurnY = startY + offsetDist; // Downwards
                        var topTurnY = endY - offsetDist; // Upwards (towards 0)

                        ctx.beginPath();
                        ctx.strokeStyle = arrowColor;

                        // 1. Exit vertically down
                        ctx.moveTo(startX, startY);
                        ctx.lineTo(startX, bottomTurnY);

                        // 2. Proceed right to mid point between bars
                        ctx.lineTo(gapCenterX, bottomTurnY);

                        // 3. Proceed vertically to a point above the top of the bar
                        ctx.lineTo(gapCenterX, topTurnY);

                        // 4. Proceed right to mid point of adjacent bar
                        ctx.lineTo(endX, topTurnY);

                        // 5. Proceed vertically down to mid point of top of adjacent bar
                        ctx.lineTo(endX, endY);

                        ctx.stroke();

                        // Arrowhead at Top of Next Bar
                        ctx.beginPath();
                        ctx.fillStyle = arrowColor;
                        ctx.moveTo(endX, endY);
                        ctx.lineTo(endX - 3, endY - 5);
                        ctx.lineTo(endX + 3, endY - 5);
                        ctx.fill();

                        // Dot at Start
                        ctx.beginPath();
                        ctx.arc(startX, startY, 2, 0, Math.PI * 2);
                        ctx.fill();
                    }

                } else {
                    // HORIZONTAL Labels & Arrows
                    var y = padding + c * (barThickness + gap);
                    // var midY = y + (barThickness / 2); // Old centered logic

                    // 1) Correct the location so the start address is 10% from the bottom of the bar
                    // and the end address is 10% from the top
                    var startY = y + (barThickness * 0.9); // 90% down (10% from bottom)
                    var endY = y + (barThickness * 0.1);   // 10% down (10% from top)

                    ctx.textAlign = 'right';
                    ctx.textBaseline = 'alphabetic'; // Base for start (bottom-ish)
                    ctx.fillText(startHex, 55, startY); // Left

                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'hanging'; // Hang from top for end
                    ctx.fillText(endHex, canvas.width - 55, endY); // Right

                    // Arrow
                    if (c < numChunks - 1) {
                        var rightEdge = canvas.width - 60;
                        var leftEdge = 60;
                        // User Request: "The horizontal link line should exit at the vertical mid point of the bar and enter in the vertical mid point of the bar."
                        var nextY = padding + (c + 1) * (barThickness + gap) + (barThickness / 2); // Target Next midpoint relative to its start
                        var midGapY = y + barThickness + (gap / 2);
                        var midY = y + (barThickness / 2);

                        ctx.beginPath();
                        ctx.strokeStyle = arrowColor;
                        ctx.moveTo(rightEdge, midY);
                        ctx.lineTo(rightEdge + 10, midY);
                        ctx.lineTo(rightEdge + 10, midGapY);
                        ctx.lineTo(leftEdge - 10, midGapY);
                        ctx.lineTo(leftEdge - 10, nextY);
                        ctx.lineTo(leftEdge, nextY);
                        ctx.stroke();

                        // Arrowhead
                        ctx.beginPath();
                        ctx.fillStyle = arrowColor;
                        ctx.moveTo(leftEdge, nextY);
                        ctx.lineTo(leftEdge - 5, nextY - 3);
                        ctx.lineTo(leftEdge - 5, nextY + 3);
                        ctx.fill();
                    }
                }
            }
        } catch (e) {
            // console.warn("MemoryMap Draw Error (Swallowed):", e);
        }
    }

    // Initial Draw
    setTimeout(draw, 0);
    // Force redraw after layout settles (DEBUG fix for resizing)
    setTimeout(draw, 500);

    // Resize Observer
    if (window.ResizeObserver) {
        var ro = new ResizeObserver(function () { window.requestAnimationFrame(draw); });
        ro.observe(container);
    } else {
        window.addEventListener('resize', draw);
    }

    // Tooltip & Click Logic (Unified)
    function handleInteraction(e, isClick) {
        var rect = canvas.getBoundingClientRect();
        var scaleX = canvas.width / rect.width;
        var scaleY = canvas.height / rect.height;
        var mouseX = (e.clientX - rect.left) * scaleX;
        var mouseY = (e.clientY - rect.top) * scaleY;

        var found = false;
        for (var i = 0; i < regions.length; i++) {
            var r = regions[i];
            if (mouseX >= r.x && mouseX < r.x + r.w && mouseY >= r.y && mouseY < r.y + r.h) {
                if (isClick && r.item && HexViewer) {
                    // Open Hex View
                    var totalLen = r.item.getLength();
                    var fullData = new Uint8Array(totalLen);
                    r.item.storeData(fullData, 0);
                    HexViewer.show(fullData, "Hex View: " + (r.item.name || getItemDescription(r.item)));
                } else if (!isClick) {
                    // Tooltip
                    var cycles = getAccessCycles(r.offset, pack);
                    var text = r.item ? (
                        (r.item.name || getItemDescription(r.item)) + "\n" +
                        "Type: " + r.item.type + "\n" +
                        "Size: " + r.len + "\n" +
                        "Offset: " + r.offset.toString(16).toUpperCase()
                    ) : (
                        "Free Space\nSize: " + r.len + "\nOffset: " + r.offset.toString(16).toUpperCase()
                    );
                    canvas.title = text;
                }
                found = true;
                break;
            }
        }
        if (!isClick && !found) canvas.title = "";
    }

    canvas.addEventListener('mousemove', function (e) { handleInteraction(e, false); });
    canvas.addEventListener('click', function (e) { handleInteraction(e, true); });

    // Helper: Access Cycles
    function getAccessCycles(address, pack) {
        if (!pack || !pack.items || pack.items.length === 0) return 0;
        var id = pack.items[0].data[0];
        var size = pack.items[0].data[1];
        var isPaged = (id & 0x04) !== 0;
        var isSegmented = (size === 0x10);
        if (isSegmented) {
            var segOffset = address % 16384;
            return Math.floor(segOffset / 256) + (segOffset % 256);
        } else if (isPaged) {
            return Math.floor(address / 256) + (address % 256);
        }
        return address;
    }

    // Legend
    var legend = document.createElement('div');
    legend.className = 'memory-map-legend';
    function createLegendItem(label, colorKey) {
        var span = document.createElement('span');
        span.className = 'mm-legend-item';
        var swatch = document.createElement('span');
        swatch.className = 'mm-swatch';

        if (colorKey === 'deleted') {
            swatch.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            // Match canvas hatch: Reddish stripes at 45deg
            swatch.style.backgroundImage = 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255, 50, 50, 0.5) 4px, rgba(255, 50, 50, 0.5) 5px)';
        } else {
            swatch.style.backgroundColor = colors[colorKey];
        }

        span.appendChild(swatch);
        span.appendChild(document.createTextNode(label));
        return span;
    }
    legend.appendChild(createLegendItem('Header', 'header'));
    legend.appendChild(createLegendItem('Proc', 'procedure'));
    legend.appendChild(createLegendItem('Data', 'datafile'));
    legend.appendChild(createLegendItem('Free', 'free'));
    legend.appendChild(createLegendItem('Deleted', 'deleted'));
    container.appendChild(legend);

    return container;
}

