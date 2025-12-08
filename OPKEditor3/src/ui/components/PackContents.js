'use strict';

/**
 * Architecture: Navigation View
 * -----------------------------
 * Manages the "Pack Contents" sidebar.
 * 
 * Responsibilities:
 * 1. Rendering: Displays the list of items in the pack (files, records, etc.).
 * 2. Interaction: Handles clicks to select items for editing.
 * 3. Drag and Drop: Implements reordering of items within the pack.
 * 
 * It communicates with the Controller (opkedit.js) to update the main view.
 */
var PackContents = (function () {
    var container = document.getElementById("pack-list");



    function render() {
        // Clear container
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }

        if (typeof checksumselement !== 'undefined' && checksumselement) checksumselement.innerHTML = "";

        if (packs.length > 0) {
            // Update file info for the active pack
            var activePack = getActivePack();
            if (activePack) {
                if (typeof fileinfoelement !== 'undefined' && fileinfoelement) {
                    fileinfoelement.innerText = activePack.filename ? activePack.filename : "Untitled";
                }
                // Checksum for active pack
                if (activePack.checksums && typeof checksumselement !== 'undefined' && checksumselement) {
                    checksumselement.innerText = "Sum: 0x" + activePack.checksums.sum.toString(16).toUpperCase().padStart(8, '0') +
                        " CRC32: 0x" + activePack.checksums.crc32.toString(16).toUpperCase() +
                        " MD5: " + activePack.checksums.md5;
                }
            } else {
                if (typeof fileinfoelement !== 'undefined' && fileinfoelement) fileinfoelement.innerText = "No Pack Selected";
            }

            // Render each pack
            for (var pIdx = 0; pIdx < packs.length; pIdx++) {
                var pack = packs[pIdx];

                // Recalculate checksums if dirty or missing
                if (pack.unsaved || !pack.checksums) {
                    updatePackChecksums(pack);
                }

                var packWrapper = createPackElement(pack, pIdx);
                container.appendChild(packWrapper);
            }

            // Drag and Drop for Packs
            new DragDropList(container, function (src, dest) {
                // Move pack in array
                var pack = packs.splice(src, 1)[0];
                packs.splice(dest, 0, pack);

                // Update indices
                if (currentPackIndex === src) currentPackIndex = dest;
                else if (currentPackIndex > src && currentPackIndex <= dest) currentPackIndex--;
                else if (currentPackIndex < src && currentPackIndex >= dest) currentPackIndex++;

                if (selectedPackIndex === src) selectedPackIndex = dest;
                else if (selectedPackIndex > src && selectedPackIndex <= dest) selectedPackIndex--;
                else if (selectedPackIndex < src && selectedPackIndex >= dest) selectedPackIndex++;

                render(); // Re-render
            }, 0, 0);

        } else {
            if (typeof fileinfoelement !== 'undefined' && fileinfoelement) fileinfoelement.innerText = "No Packs";
        }

        updateItemButtons(false);
    }

    function createPackElement(pack, pIdx) {
        var packWrapper = document.createElement('div');
        packWrapper.className = 'pack-wrapper';
        packWrapper.style.borderBottom = '1px solid var(--border-color)';

        // Pack Header
        var packHeader = document.createElement('div');
        packHeader.className = 'pack-header';
        if (pIdx === currentPackIndex) {
            packHeader.classList.add('selected');
        }

        var icon = document.createElement('i');
        icon.classList.add('pack-icon', 'fa-fw');

        var style = OptionsManager.getOption('iconStyle') || 'solid';
        var prefix = (style === 'solid') ? 'fas' : 'far';

        if (pack.collapsed) {
            icon.classList.add(prefix, 'fa-folder');
        } else {
            icon.classList.add(prefix, 'fa-folder-open');
        }

        // Tooltip Events for Pack Header
        icon.addEventListener('mouseenter', function (e) {
            var rect = e.target.getBoundingClientRect();
            TooltipManager.show(rect.left, rect.bottom, generatePackTooltip(pack));
        });
        icon.addEventListener('mouseleave', function () {
            TooltipManager.hide();
        });

        // Feature: Click Pack Folder to visualize MAIN procedure
        icon.style.cursor = "pointer";
        icon.title = "Click to visualize MAIN procedure";
        icon.addEventListener('click', function (e) {
            e.stopPropagation();
            if (typeof CodeVisualizer !== 'undefined') {
                CodeVisualizer.showSystemMap(packs);
            } else {
                alert("Code Visualizer not available.");
            }
        });

        var title = document.createElement('span');
        title.innerText = pack.filename ? pack.filename : "Untitled Pack " + (pIdx + 1);
        title.style.flexGrow = '1';

        // Collapse/Expand Toggle
        var toggle = document.createElement('i');
        toggle.className = 'fas fa-chevron-down pack-toggle';
        if (pack.collapsed) {
            toggle.className = 'fas fa-chevron-right pack-toggle';
        }

        packHeader.appendChild(icon);
        packHeader.appendChild(title);
        packHeader.appendChild(toggle);

        // Pack Header Click Events
        packHeader.addEventListener('click', function (e) {
            if (e.target.classList.contains('pack-toggle')) {
                packs[pIdx].collapsed = !packs[pIdx].collapsed;
                render();
                e.stopPropagation();
                return;
            }
            selectPack(pIdx);
        });

        // Double click to rename
        title.addEventListener('dblclick', function (e) {
            e.stopPropagation();
            var input = document.createElement('input');
            input.type = 'text';
            input.value = packs[pIdx].filename ? packs[pIdx].filename : "Pack" + (pIdx + 1) + ".opk";
            input.style.width = '150px';

            function saveName() {
                var newName = input.value.trim();
                if (newName) {
                    if (!newName.toLowerCase().endsWith(".opk")) {
                        newName += ".opk";
                    }
                    packs[pIdx].filename = newName;
                    packs[pIdx].unsaved = true;
                }
                render();
            }

            input.addEventListener('blur', saveName);
            input.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') {
                    saveName();
                }
            });

            title.innerHTML = '';
            title.appendChild(input);
            input.focus();
        });

        packWrapper.appendChild(packHeader);

        // Pack Contents Container
        if (!pack.collapsed) {
            var packContents = document.createElement('ul');
            packContents.className = 'pack-contents';

            var pl = Math.max(4, pack.getLength().toString(16).length);
            var ix = 0;
            var items = pack.items;

            // Grouping Logic
            var groupRecords = OptionsManager.getOption('groupDataRecords');
            var itemsToRender = [];

            if (groupRecords) {
                // Pre-calculation pass: Map Data Files to their children
                var dataFileChildren = {}; // Map<FileID, Array<Index>>
                var childIndices = new Set(); // Set<Index> of all items that are children

                // 1. Find all Data Files and their IDs
                var dataFiles = [];
                for (var i = 0; i < items.length; i++) {
                    if (items[i].type === 1) {
                        dataFiles.push({ index: i, id: items[i].data[10] & 0x7f });
                    }
                }

                // 2. Find children for each Data File
                dataFiles.forEach(function (df) {
                    var children = [];
                    for (var j = 0; j < items.length; j++) {
                        if (j === df.index) continue; // Skip self
                        if (items[j].type === df.id) {
                            children.push(j);
                            childIndices.add(j);
                        }
                    }

                    // Mark the last child for CSS styling
                    if (children.length > 0) {
                        items[children[children.length - 1]].isLastChild = true;
                    }
                    dataFileChildren[df.index] = children;
                });

                // 3. Render loop
                for (var i = 0; i < items.length; i++) {
                    // If this item is a child of someone else, skip it (it will be rendered under its parent)
                    if (childIndices.has(i)) continue;

                    var item = items[i];
                    itemsToRender.push({ item: item, index: i, indent: false });

                    // If this is a Data File, check if it has children to render
                    if (item.type === 1 && dataFileChildren[i]) {
                        // Check collapsed state
                        if (!item.collapsed) {
                            var children = dataFileChildren[i];
                            for (var k = 0; k < children.length; k++) {
                                var childIndex = children[k];
                                itemsToRender.push({ item: items[childIndex], index: childIndex, indent: true });
                            }
                        }
                    }
                }

            } else {
                // Linear rendering
                for (var i = 0; i < items.length; i++) {
                    itemsToRender.push({ item: items[i], index: i, indent: false });
                }
            }

            var pl = Math.max(4, pack.getLength().toString(16).length);
            var ix = 0; // Address calculation needs to follow LINEAR order, not grouped order?
            // Wait, address is based on file position. Grouping is purely visual.
            // So we must calculate addresses based on original order, but render in grouped order.
            // We need a map of addresses.

            var addressMap = [];
            var currentAddr = 0;
            for (var i = 0; i < items.length; i++) {
                addressMap[i] = currentAddr;
                currentAddr += items[i].getLength();
            }

            for (var i = 0; i < itemsToRender.length; i++) {
                var renderItem = itemsToRender[i];
                var item = renderItem.item;
                var originalIndex = renderItem.index;
                var address = addressMap[originalIndex];

                var itemRow = createItemRow(item, pIdx, originalIndex, address, pl, renderItem.indent);
                packContents.appendChild(itemRow);
            }

            packWrapper.appendChild(packContents);
        }

        return packWrapper;
    }

    function createItemRow(item, packIndex, itemIndex, address, addrLen, indent) {
        var row = document.createElement('li');
        row.className = 'pack-item-row';
        if (currentItem === item) {
            row.classList.add('selected');
        }

        // Item Icon
        var itemIcon = document.createElement('span');
        itemIcon.className = 'item-icon';
        if (indent) {
            row.classList.add('subordinate-item');
            if (item.isLastChild) {
                row.classList.add('subordinate-last');
            }
        }
        var iconClass = getItemIcon(item);
        itemIcon.innerHTML = `<i class="${iconClass}"></i>`;

        // Feature: Collapse/Expand Data Files
        if (item.type === 1) {
            itemIcon.style.cursor = "pointer";
            itemIcon.title = item.collapsed ? "Click to expand records" : "Click to collapse records";
            // Optional: visual cue for collapse state (maybe rotate icon or add small chevron?)
            // For now, relies on the fact that children disappear.

            itemIcon.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                // Toggle state
                item.collapsed = !item.collapsed;
                render();
            });
        }

        row.appendChild(itemIcon);

        // Detailed Tooltip
        itemIcon.addEventListener('mouseenter', function (e) {
            var rect = e.target.getBoundingClientRect();
            TooltipManager.show(rect.left, rect.bottom, generateItemTooltip(item, address));
        });
        itemIcon.addEventListener('mouseleave', function () {
            TooltipManager.hide();
        });

        // Item Description
        var descText = getItemDescription(item);

        // Feature: Click Icon to view Code Visualization (Source Trail style)
        if (item.type === 3 && (descText === "OPL Procedure" || descText === "OPL Object")) {
            itemIcon.style.cursor = "pointer";
            itemIcon.title = "Click to view Code Visualization";
            itemIcon.addEventListener('click', function (e) {
                e.stopPropagation();
                // CodeVisualizer.show is not currently implemented.
                // Fallback to System Map or alert?
                if (typeof CodeVisualizer !== 'undefined') {
                    CodeVisualizer.showSystemMap(packs); // Show full map for now
                }
            });
        }

        // Item Address
        var itemAddr = document.createElement('span');
        itemAddr.className = 'item-addr';
        itemAddr.innerText = address.toString(16).toUpperCase().padStart(addrLen, '0');
        row.appendChild(itemAddr);

        // Item Name
        var itemName = document.createElement('span');
        itemName.className = 'item-name';
        itemName.innerText = item.name;
        row.appendChild(itemName);

        // Item Description
        var itemDesc = document.createElement('span');
        itemDesc.className = 'item-desc';

        itemDesc.innerText = descText;

        // Feature: Click "OPL Procedure" or "OPL Object" to view Object Code in Hex Viewer
        if (item.type === 3 && (descText === "OPL Procedure" || descText === "OPL Object")) {
            itemDesc.style.cursor = "pointer";
            itemDesc.style.textDecoration = "none"; // User requested no underline
            itemDesc.title = "Click to view Translated Q-Code (Hex)";

            itemDesc.addEventListener('click', function (e) {
                e.stopPropagation(); // Prevent row selection

                // Extract Object Code
                // Structure: Header -> Block (child) -> Data (child)
                if (item.child && item.child.child && item.child.child.data) {
                    var data = item.child.child.data;
                    if (data.length >= 2) {
                        var obLen = (data[0] << 8) | data[1];
                        if (obLen > 0 && data.length >= 2 + obLen) {
                            var objCode = data.slice(2, 2 + obLen);

                            // User wants "all the binary data", so we show the full Object Code (including OPL Header).
                            // Previously we stripped the header to show only Q-Code, but that hid important data.

                            if (typeof HexViewer !== 'undefined') {
                                HexViewer.show(objCode, "OPL Object: " + item.name);
                            }
                        } else {
                            alert("No Object Code found or invalid length.");
                        }
                    }
                }
            });
        }

        row.appendChild(itemDesc);

        // Click Event
        row.addEventListener('click', function (e) {
            e.stopPropagation();
            itemSelected(packIndex, itemIndex);
        });

        // KEYBOARD SUPPORT: Ensure this logic is maintained
        // Make item focusable
        row.setAttribute('tabindex', '0');

        // Keyboard Event Listener
        row.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                itemSelected(packIndex, itemIndex);
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                var next = row.nextElementSibling;
                if (next) next.focus();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                var prev = row.previousElementSibling;
                if (prev) prev.focus();
            }
        });

        // Drag and Drop Logic
        // Constraint: No dragging Header (index 0) or MAIN
        var isHeader = (itemIndex === 0);
        var isMain = (item.name === "MAIN");
        var isEOP = (item.type === 255);

        if (!isHeader && !isMain && !isEOP) {
            row.draggable = true;
            row.addEventListener('dragstart', function (e) {
                handleDragStart(e, packIndex, itemIndex);
            });
        } else {
            row.draggable = false;
        }

        row.addEventListener('dragover', handleDragOver);
        row.addEventListener('drop', function (e) {
            // Constraint: Prevent dropping onto Header (index 0)
            // If dropping on Header, it effectively tries to put it BEFORE header, which is invalid.
            // If dropping on MAIN, it puts it BEFORE MAIN? No, drop usually inserts BEFORE.
            // Wait, standard behavior: insertBefore(dragged, target).
            // So dropping on MAIN inserts BEFORE MAIN. We want to prevent that.
            // Dropping on item AFTER MAIN inserts before that item (i.e. after MAIN). That is OK.

            // If target is Header (0), prevent.
            if (itemIndex === 0) return;

            // If target is MAIN, prevent (because that would insert before MAIN).
            // Unless we are dragging MAIN itself? But MAIN is not draggable.
            if (item.name === "MAIN") return;

            handleDrop(e, packIndex, itemIndex);
        });
        row.addEventListener('dragenter', handleDragEnter);
        row.addEventListener('dragleave', handleDragLeave);
        row.addEventListener('dragend', handleDragEnd);

        return row;
    }

    function generateItemTooltip(item, address) {
        var html = "<h4>" + (item.name || "Item") + "</h4>";
        html += "<div class='tooltip-row'><span class='tooltip-label'>Type:</span><span class='tooltip-value'>" + getItemDescription(item) + " (" + item.type + ")</span></div>";
        html += "<div class='tooltip-row'><span class='tooltip-label'>Address:</span><span class='tooltip-value'>0x" + address.toString(16).toUpperCase() + "</span></div>";
        html += "<div class='tooltip-row'><span class='tooltip-label'>Length:</span><span class='tooltip-value'>" + item.getLength() + " bytes</span></div>";
        html += "<div class='tooltip-row'><span class='tooltip-label'>Status:</span><span class='tooltip-value'>" + (item.deleted ? "Deleted" : "Active") + "</span></div>";
        return html;
    }

    // Drag and Drop Handlers
    var dragSrcInfo = null;

    function handleDragStart(e, packIndex, itemIndex) {
        dragSrcInfo = { packIndex: packIndex, itemIndex: itemIndex };
        e.dataTransfer.effectAllowed = 'copyMove';
        e.dataTransfer.setData('text/html', e.currentTarget.outerHTML);
        e.currentTarget.classList.add('dragElem');
    }

    function handleDragOver(e) {
        if (!dragSrcInfo) return;
        if (e.preventDefault) e.preventDefault();
        e.dataTransfer.dropEffect = e.ctrlKey ? 'copy' : 'move';
        this.classList.add('over');
        return false;
    }

    function handleDragEnter(e) {
        if (!dragSrcInfo) return;
        this.classList.add('over');
    }

    function handleDragLeave(e) {
        this.classList.remove('over');
    }

    function handleDrop(e, toPackIndex, toItemIndex) {
        if (!dragSrcInfo) return;
        if (e.stopPropagation) e.stopPropagation();

        if (dragSrcInfo) {
            // Call global itemMoved function
            if (typeof itemMoved === 'function') {
                itemMoved(dragSrcInfo.packIndex, dragSrcInfo.itemIndex, toPackIndex, toItemIndex, e.ctrlKey);
            }
        }

        return false;
    }

    function handleDragEnd(e) {
        var cols = document.querySelectorAll('#pack-list li');
        [].forEach.call(cols, function (col) {
            col.classList.remove('over');
            col.classList.remove('dragElem');
        });
        dragSrcInfo = null;
    }

    return {
        render: render
    };
})();
