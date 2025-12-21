'use strict';

/**
 * Architecture: Navigation View
 * -----------------------------
 * Manages the "Pack Contents" sidebar.
 * Refactored to a Class for flexible instantiation (e.g. into pop-out windows).
 */
class PackContentsView {
    constructor(containerElement) {
        this.container = containerElement;
        this.dragSrcInfo = null;

        // Bind methods
        this.handleDragOver = this.handleDragOver.bind(this);
        this.handleDragEnter = this.handleDragEnter.bind(this);
        this.handleDragLeave = this.handleDragLeave.bind(this);
        this.handleDrop = this.handleDrop.bind(this);
        this.handleDragEnd = this.handleDragEnd.bind(this);
        this.render = this.render.bind(this);
    }

    setContainer(newContainer) {
        this.container = newContainer;
        this.render();
    }

    render() {
        if (!this.container) return;
        var container = this.container;

        // Store focus state before clearing
        var focusedElement = document.activeElement;
        var focusedPackIdx = null;
        var focusedItemIdx = null;

        if (focusedElement && container.contains(focusedElement)) {
            focusedPackIdx = focusedElement.getAttribute('data-pack-idx');
            focusedItemIdx = focusedElement.getAttribute('data-item-idx');
        }

        // Clear container
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }

        if (typeof checksumselement !== 'undefined' && checksumselement) checksumselement.innerHTML = "";

        // Feature: Recycle Button in Sidebar Header
        var sidebarHeader = document.getElementById('sidebar-header');
        if (sidebarHeader) {
            // Check if button already exists
            if (!sidebarHeader.querySelector('.recycle-btn')) {
                var btnRecycle = document.createElement('i');
                btnRecycle.className = 'fas fa-recycle recycle-btn';
                btnRecycle.title = "Toggle Deleted Status";
                btnRecycle.style.cursor = 'pointer';
                btnRecycle.style.marginLeft = 'auto'; // Push to right if flex
                btnRecycle.style.float = 'right'; // Fallback
                btnRecycle.style.paddingLeft = '10px';

                btnRecycle.onclick = function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    // Toggle deleted status of currentItem
                    if (typeof currentItem !== 'undefined' && currentItem) {
                        currentItem.deleted = !currentItem.deleted;

                        // Update Binary Data (Bit 7 of Type Byte)
                        if (currentItem.data && currentItem.data.length > 1) {
                            if (currentItem.deleted) {
                                currentItem.data[1] &= 0x7F; // Clear bit 7 (Deleted)
                            } else {
                                currentItem.data[1] |= 0x80; // Set bit 7 (Active)
                            }
                        }

                        // Update description/internal state
                        if (currentItem.setDescription) currentItem.setDescription();

                        // Mark pack unsaved
                        if (typeof packs !== 'undefined' && typeof currentPackIndex !== 'undefined' && packs[currentPackIndex]) {
                            packs[currentPackIndex].unsaved = true;
                        }

                        // Force Save to Storage
                        if (typeof saveSession !== 'undefined') {
                            saveSession();
                        }

                        updateInventory(); // Refresh view
                    } else {
                        alert("No item selected.");
                    }
                };
                sidebarHeader.appendChild(btnRecycle);
            }
        }

        if (packs.length > 0) {
            // Update file info for the active pack
            var activePack = getActivePack(); // Global function
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

                if (pack.unsaved || !pack.checksums) {
                    updatePackChecksums(pack); // Global function
                }

                var packWrapper = this.createPackElement(pack, pIdx);
                container.appendChild(packWrapper);
            }

            // Drag and Drop for Packs
            // Assuming DragDropList is a global utility that handles list reordering
            if (typeof DragDropList !== 'undefined') {
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

                    this.render(); // Re-render
                }.bind(this), 0, 0);
            }

        } else {
            if (typeof fileinfoelement !== 'undefined' && fileinfoelement) fileinfoelement.innerText = "No Packs";
        }

        updateItemButtons(false); // Global function

        // Restore focus
        if (focusedPackIdx !== null) {
            var selector = '[data-pack-idx="' + focusedPackIdx + '"]';
            if (focusedItemIdx !== null) {
                selector += '[data-item-idx="' + focusedItemIdx + '"]';
            } else {
                selector = '.pack-header' + selector;
            }
            var elementToFocus = container.querySelector(selector);
            if (elementToFocus) {
                elementToFocus.focus();
            }
        }
    }

    createPackElement(pack, pIdx) {
        var packWrapper = document.createElement('div');
        packWrapper.className = 'pack-wrapper';
        packWrapper.style.borderBottom = '1px solid var(--border-color)';

        // Pack Header
        var packHeader = document.createElement('div');
        packHeader.className = 'pack-header';
        packHeader.setAttribute('data-pack-idx', pIdx);
        packHeader.setAttribute('tabindex', '0');
        if (pIdx === currentPackIndex && selectedPackIndex === pIdx) {
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
            TooltipManager.show(rect.left, rect.bottom, this.generatePackTooltip(pack));
        }.bind(this));
        icon.addEventListener('mouseleave', function () {
            TooltipManager.hide();
        });

        // Feature: Click Pack Folder to visualize MAIN procedure
        icon.style.cursor = "pointer";
        icon.title = "Click to visualize MAIN procedure";
        icon.onclick = function (e) {
            e.preventDefault();
            e.stopPropagation();
            if (typeof CodeVisualizer !== 'undefined') {
                CodeVisualizer.showSystemMap(packs);
            } else {
                console.error("Visualizer: CodeVisualizer is UNDEFINED");
            }
        };

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
        var self = this;
        packHeader.addEventListener('focus', function () {
            // Sync selection state on focus, but avoid redundant re-renders
            if (typeof selectedPackIndex !== 'undefined' && selectedPackIndex !== pIdx) {
                // If we use selectPack(pIdx), it might trigger another focus which is fine
                // with the optimization I added in opkedit.js
                selectPack(pIdx);
            }
        });

        packHeader.addEventListener('click', function (e) {
            if (e.target.classList.contains('pack-toggle')) {
                packs[pIdx].collapsed = !packs[pIdx].collapsed;
                self.render();
                e.stopPropagation();
                return;
            }
            selectPack(pIdx); // Global function
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
                self.render();
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

        packHeader.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                selectPack(pIdx);
            } else if (e.key === 'Delete' || e.key === 'Backspace') {
                e.preventDefault();
                // Ensure this pack is selected before erasing
                selectPack(pIdx);
                if (typeof eraseItem === 'function') {
                    eraseItem();
                }
            } else if (e.key === 'ArrowRight') {
                if (pack.collapsed) {
                    pack.collapsed = false;
                    self.render();
                }
            } else if (e.key === 'ArrowLeft') {
                if (!pack.collapsed) {
                    pack.collapsed = true;
                    self.render();
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                var pWrapper = this.closest('.pack-wrapper');
                // Move to first item if expanded, or next pack
                if (!pack.collapsed && pWrapper.querySelector('.pack-contents')) {
                    var firstItem = pWrapper.querySelector('.pack-item-row');
                    if (firstItem) firstItem.focus();
                } else {
                    var nextPack = pWrapper.nextElementSibling;
                    if (nextPack) {
                        var nextHeader = nextPack.querySelector('.pack-header');
                        if (nextHeader) nextHeader.focus();
                    }
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                var pWrapper = this.closest('.pack-wrapper');
                var prevPack = pWrapper.previousElementSibling;
                if (prevPack) {
                    // If prev pack is expanded, go to its last item
                    var prevPackIdx = pIdx - 1;
                    if (prevPackIdx >= 0 && !packs[prevPackIdx].collapsed) {
                        var items = prevPack.querySelectorAll('.pack-item-row');
                        if (items.length > 0) {
                            items[items.length - 1].focus();
                        } else {
                            var prevHeader = prevPack.querySelector('.pack-header');
                            if (prevHeader) prevHeader.focus();
                        }
                    } else {
                        var prevHeader = prevPack.querySelector('.pack-header');
                        if (prevHeader) prevHeader.focus();
                    }
                }
            }
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

            // Calculate child counts for Data Files (Type 1)
            var childCounts = {};
            var fileIds = {};

            // 1. Map Data Files
            for (var i = 0; i < items.length; i++) {
                if (items[i].type === 1 && items[i].data && items[i].data.length > 10) {
                    var id = items[i].data[10] & 0x7f;
                    fileIds[id] = i;
                    childCounts[i] = 0;
                }
            }

            // 2. Count Children
            for (var i = 0; i < items.length; i++) {
                if (items[i].type === 1) continue;
                // Check if this item's type matches a known File ID
                if (fileIds.hasOwnProperty(items[i].type)) {
                    var parentIndex = fileIds[items[i].type];
                    childCounts[parentIndex]++;
                }
            }

            if (groupRecords) {
                // Pre-calculation pass: Map Data Files to their children
                var dataFileChildren = {}; // Map<FileID, Array<Index>>
                var childIndices = new Set(); // Set<Index> of all items that are children

                // 1. Find all Data Files and their IDs
                var dataFiles = [];
                for (var i = 0; i < items.length; i++) {
                    if (items[i].type === 1) {
                        // Safely access data
                        var id = (items[i].data && items[i].data.length > 10) ? (items[i].data[10] & 0x7f) : -1;
                        if (id >= 0) dataFiles.push({ index: i, id: id });
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
                        // Apply default collapse setting if not already set
                        if (typeof item.collapsed === 'undefined') {
                            item.collapsed = !!OptionsManager.getOption('collapseDataFiles');
                        }

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

            // Calculate addresses based on original order
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
                var count = (childCounts[originalIndex] !== undefined) ? childCounts[originalIndex] : 0;

                var itemRow = this.createItemRow(item, pIdx, originalIndex, address, pl, renderItem.indent, count);
                // Add tracking data
                itemRow.setAttribute('data-pack-idx', pIdx);
                itemRow.setAttribute('data-item-idx', originalIndex);
                packContents.appendChild(itemRow);
            }

            packWrapper.appendChild(packContents);
        }

        return packWrapper;
    }

    createItemRow(item, packIndex, itemIndex, address, addrLen, indent, childCount) {
        var row = document.createElement('li');
        row.className = 'pack-item-row';
        if (currentItem === item) {
            row.classList.add('selected');
        }

        // Apply deleted style
        if (item.deleted) {
            row.classList.add('deleted-item');
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
        var iconClass = getItemIcon(item); // Global function
        itemIcon.innerHTML = `<i class="${iconClass}"></i>`;

        // Feature: Collapse/Expand Data Files
        if (item.type === 1) {
            itemIcon.style.cursor = "pointer";
            var countStr = (childCount !== undefined) ? " (" + childCount + " records)" : "";
            itemIcon.title = (item.collapsed ? "Click to expand records" : "Click to collapse records") + countStr;

            var self = this;
            itemIcon.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                // Toggle state
                item.collapsed = !item.collapsed;
                self.render();
            });
        }

        row.appendChild(itemIcon);

        // Detailed Tooltip
        itemIcon.addEventListener('mouseenter', function (e) {
            var rect = e.target.getBoundingClientRect();
            TooltipManager.show(rect.left, rect.bottom, this.generateItemTooltip(item, address, childCount));
        }.bind(this));
        itemIcon.addEventListener('mouseleave', function () {
            TooltipManager.hide();
        });

        // Item Description
        var descText = getItemDescription(item); // Global function

        // Feature: Click Icon to view Code Visualization
        if (item.type === 3 && (descText === "OPL Procedure" || descText === "OPL Object")) {
            itemIcon.style.cursor = "pointer";
            itemIcon.title = "Click to view Code Visualization"; // Native title
            itemIcon.addEventListener('click', function (e) {

                e.stopPropagation();
                if (typeof CodeVisualizer !== 'undefined') {
                    CodeVisualizer.showSystemMap(packs);
                } else {
                    console.error("Visualizer: CodeVisualizer is UNDEFINED"); // DEBUG LOG
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

        if (item.type === 3 && (descText === "OPL Procedure" || descText === "OPL Object")) {
            itemDesc.style.cursor = "pointer";
            itemDesc.style.textDecoration = "none";
            itemDesc.title = "Click to view Translated Q-Code (Hex)";

            itemDesc.addEventListener('click', function (e) {
                e.stopPropagation();
                if (item.getFullData) {
                    var data = item.getFullData();
                    if (data && data.length > 0) {
                        if (typeof HexViewer !== 'undefined') HexViewer.show(data, "OPL Procedure Record: " + item.name);
                    } else {
                        alert("No Data found.");
                    }
                } else if (item.child && item.child.child && item.child.child.data) {
                    var data = item.child.child.data;
                    if (data && data.length > 0) {
                        if (typeof HexViewer !== 'undefined') HexViewer.show(data, "OPL Procedure Record: " + item.name);
                    } else {
                        alert("No Data found.");
                    }
                }
            });
        }

        row.appendChild(itemDesc);

        // Click Event
        row.addEventListener('click', function (e) {
            e.stopPropagation();
            itemSelected(packIndex, itemIndex); // Global function
        });

        // Keyboard Support
        row.setAttribute('tabindex', '0');
        row.addEventListener('focus', function () {
            // Sync selection state on focus
            if (currentItem !== item) {
                // selectItem(packIndex, itemIndex) avoids full re-render if optimized
                selectItem(packIndex, itemIndex);
            }
        });

        row.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                itemSelected(packIndex, itemIndex);
            } else if (e.key === 'Delete' || e.key === 'Backspace') {
                e.preventDefault();
                // Ensure this item is selected before erasing
                selectItem(packIndex, itemIndex);
                if (typeof eraseItem === 'function') {
                    eraseItem();
                } else {
                    // Fallback if global not found
                    if (confirm("Are you sure you want to delete '" + item.name + "'?")) {
                        // remove from array? Or mark deleted?
                        // "Deletes" usually implies removal from the list unless "Recycle" toggles deleted status.
                        // Psion approach: Delete = Remove? Or Mark?
                        // User said "Recycle ... toggles ... deleted status".
                        // And "DELETE key deletes".
                        // Usually "Delete" in UI = Remove.
                        // Let's assume eraseItem() does the right thing.
                        console.warn("eraseItem global not found.");
                    }
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                var next = row.nextElementSibling;
                if (next) {
                    next.focus();
                } else {
                    // Move to next pack header
                    var packWrapper = row.closest('.pack-wrapper');
                    var nextPack = packWrapper ? packWrapper.nextElementSibling : null;
                    if (nextPack) {
                        var nextHeader = nextPack.querySelector('.pack-header');
                        if (nextHeader) nextHeader.focus();
                    }
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                var prev = row.previousElementSibling;
                if (prev) {
                    prev.focus();
                } else {
                    // Move back to this pack's header
                    var packWrapper = row.closest('.pack-wrapper');
                    var header = packWrapper ? packWrapper.querySelector('.pack-header') : null;
                    if (header) header.focus();
                }
            }
        });

        // Drag and Drop Logic
        var isHeader = (itemIndex === 0);
        var isMain = (item.name === "MAIN");
        var isEOP = (item.type === 255);

        if (!isHeader && !isMain && !isEOP) {
            row.draggable = true;
            row.addEventListener('dragstart', function (e) {
                this.handleDragStart(e, packIndex, itemIndex);
            }.bind(this));
        } else {
            row.draggable = false;
        }

        row.addEventListener('dragover', this.handleDragOver);
        row.addEventListener('drop', function (e) {
            if (itemIndex === 0) return;
            if (item.name === "MAIN") return;
            this.handleDrop(e, packIndex, itemIndex);
        }.bind(this));
        row.addEventListener('dragenter', this.handleDragEnter);
        row.addEventListener('dragleave', this.handleDragLeave);
        row.addEventListener('dragend', this.handleDragEnd);

        return row;
    }

    generatePackTooltip(pack) {
        return "<h4>" + (pack.filename || "Untitled Pack") + "</h4>" +
            "<div>Items: " + pack.items.length + "</div>" +
            "<div>Size: " + pack.getLength() + " bytes</div>";
    }

    generateItemTooltip(item, address, childCount) {
        var html = "<h4>" + (item.name || "Item") + "</h4>";
        html += "<div class='tooltip-row'><span class='tooltip-label'>Type:</span><span class='tooltip-value'>" + getItemDescription(item) + " (" + item.type + ")</span></div>";
        html += "<div class='tooltip-row'><span class='tooltip-label'>Address:</span><span class='tooltip-value'>0x" + address.toString(16).toUpperCase() + "</span></div>";
        html += "<div class='tooltip-row'><span class='tooltip-label'>Length:</span><span class='tooltip-value'>" + item.getLength() + " bytes</span></div>";
        // Show Record Count for Data Files
        if (item.type === 1 && childCount !== undefined) {
            html += "<div class='tooltip-row'><span class='tooltip-label'>Records:</span><span class='tooltip-value'>" + childCount + "</span></div>";
        }
        html += "<div class='tooltip-row'><span class='tooltip-label'>Status:</span><span class='tooltip-value'>" + (item.deleted ? "Deleted" : "Active") + "</span></div>";
        return html;
    }

    // Drag and Drop Handlers
    handleDragStart(e, packIndex, itemIndex) {
        e.stopPropagation();
        this.dragSrcInfo = { packIndex: packIndex, itemIndex: itemIndex };
        e.dataTransfer.effectAllowed = 'copyMove';
        e.dataTransfer.setData('text/html', e.currentTarget.outerHTML);
        e.currentTarget.classList.add('dragElem');
    }

    handleDragOver(e) {
        if (!this.dragSrcInfo) return;
        if (e.preventDefault) e.preventDefault();
        e.dataTransfer.dropEffect = e.ctrlKey ? 'copy' : 'move';
        e.currentTarget.classList.add('over');
        return false;
    }

    handleDragEnter(e) {
        if (!this.dragSrcInfo) return;
        e.currentTarget.classList.add('over');
    }

    handleDragLeave(e) {
        e.currentTarget.classList.remove('over');
    }

    handleDrop(e, toPackIndex, toItemIndex) {
        if (!this.dragSrcInfo) return;
        if (e.stopPropagation) e.stopPropagation();

        if (this.dragSrcInfo) {
            // Call global itemMoved function
            if (typeof itemMoved === 'function') {
                itemMoved(this.dragSrcInfo.packIndex, this.dragSrcInfo.itemIndex, toPackIndex, toItemIndex, e.ctrlKey);
            }
        }
        return false;
    }

    handleDragEnd(e) {
        if (!this.container) return;
        var cols = this.container.querySelectorAll('li'); // Scope to container
        [].forEach.call(cols, function (col) {
            col.classList.remove('over');
            col.classList.remove('dragElem');
        });
        this.dragSrcInfo = null;
    }

    // Public API Methods matching old interface
    selectItem(packIndex, itemIndex) {
        if (!this.container) return;
        var headers = this.container.querySelectorAll('.pack-header');
        headers.forEach(function (h) { h.classList.remove('selected'); });

        var items = this.container.querySelectorAll('.pack-item-row');
        items.forEach(function (i) { i.classList.remove('selected'); });

        // Select the specific row
        var target = this.container.querySelector('.pack-item-row[data-pack-idx="' + packIndex + '"][data-item-idx="' + itemIndex + '"]');
        if (target) {
            target.classList.add('selected');
            target.focus();
            target.scrollIntoView({ behavior: 'auto', block: 'nearest' });
        }
    }

    selectPack(packIndex) {
        if (!this.container) return;
        var headers = this.container.querySelectorAll('.pack-header');
        headers.forEach(function (h) { h.classList.remove('selected'); });
        var items = this.container.querySelectorAll('.pack-item-row');
        items.forEach(function (i) { i.classList.remove('selected'); });

        var target = this.container.querySelector('.pack-header[data-pack-idx="' + packIndex + '"]');
        if (target) {
            target.classList.add('selected');
            target.focus();
        }
    }
}

// Shim for backward compatibility
// Initialize with the standard DOM element
var PackContents = new PackContentsView(document.getElementById("pack-list"));
