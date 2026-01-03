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
        // prevent re-render during drag
        if (this.dragSrcInfo) {
            return;
        }

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

                btnRecycle.onclick = function (e) {
                    e.preventDefault();
                    e.stopPropagation();

                    var targets = [];
                    // Detect Batch Mode via Global Selection
                    if (typeof selectedItems !== 'undefined' && selectedItems.length > 0) {
                        // Use selection if currentItem is part of it, or if just selection exists
                        if (currentItem && selectedItems.indexOf(currentItem) !== -1) {
                            targets = selectedItems;
                        } else {
                            // Fallback: If selection exists but currentItem is completely different, 
                            // usually we respect the explicit selection over the 'focused' item.
                            targets = selectedItems;
                        }
                    } else if (typeof currentItem !== 'undefined' && currentItem) {
                        targets = [currentItem];
                    }

                    if (targets.length === 0) {
                        alert("No item selected.");
                        return;
                    }

                    var changed = false;

                    targets.forEach(function (item) {
                        // Toggle deleted status
                        item.deleted = !item.deleted;

                        // Update Binary Data (Bit 7 of Type Byte)
                        if (item.data && item.data.length > 1) {
                            if (item.deleted) {
                                item.data[1] &= 0x7F; // Clear bit 7 (Deleted)
                            } else {
                                item.data[1] |= 0x80; // Set bit 7 (Active)
                            }
                        }

                        // Update description/internal state
                        if (item.setDescription) item.setDescription();
                        changed = true;
                    });

                    if (changed) {
                        // Mark pack unsaved
                        // Note: Assuming selection is within currentPack or we flag currentPack anyway
                        if (typeof packs !== 'undefined' && typeof currentPackIndex !== 'undefined' && packs[currentPackIndex]) {
                            packs[currentPackIndex].unsaved = true;
                        }

                        // Force Save to Storage
                        if (typeof saveSession !== 'undefined') {
                            saveSession();
                        }

                        updateInventory(); // Refresh view
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

            // Render each pack using a DocumentFragment to minimize reflows
            var fragment = document.createDocumentFragment();

            for (var pIdx = 0; pIdx < packs.length; pIdx++) {
                var pack = packs[pIdx];

                if (pack.unsaved || !pack.checksums) {
                    updatePackChecksums(pack); // Global function
                }

                var packWrapper = this.createPackElement(pack, pIdx);
                fragment.appendChild(packWrapper);
            }
            container.appendChild(fragment);

            // Drag and Drop for Packs
            // Assuming DragDropList is a global utility that handles list reordering
            /*
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
            */

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

        // Feature: Click Pack Folder to visualize System Map
        icon.classList.add('clickable');
        icon.title = "Click to visualize System Map";
        icon.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            var viz = (typeof CodeVisualizer !== 'undefined') ? CodeVisualizer : window.CodeVisualizer;
            if (viz) {
                viz.showSystemMap(packs);
            } else {
                // console.error("Visualizer: CodeVisualizer is UNDEFINED");
                alert("Visualizer component not loaded.");
            }
        });

        var title = document.createElement('span');
        title.className = 'pack-title';
        title.innerText = pack.filename ? pack.filename : "Untitled Pack " + (pIdx + 1);

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
            input.className = 'rename-input';
            input.value = packs[pIdx].filename ? packs[pIdx].filename : "Pack" + (pIdx + 1) + ".opk";

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
                e.stopPropagation(); // Prevent parent from seeing Enter (Select) or Backspace (Delete)
                if (e.key === 'Enter') {
                    saveName();
                }
            });

            title.innerHTML = '';
            title.appendChild(input);

            // Critical: Stop propagation to prevent parent packHeader handlers from stealing focus or intercepting keys
            input.addEventListener('click', function (e) { e.stopPropagation(); });
            input.addEventListener('dblclick', function (e) { e.stopPropagation(); });
            input.addEventListener('mousedown', function (e) { e.stopPropagation(); });

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
                    eraseItem(e.shiftKey);
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
            // Grouping and Child Counting Logic
            var groupRecords = OptionsManager.getOption('groupDataRecords');
            var itemsToRender = [];
            var childCounts = {};
            var dataFileIndices = {}; // RecordType -> HeaderIndex
            var dataFileChildren = {}; // HeaderIndex -> Array<RecordIndex>
            var childIndices = new Set();

            // 0. Clear stale grouping state
            for (var i = 0; i < items.length; i++) {
                delete items[i].isLastChild;
            }

            // 1. Identify Data Files and their record types
            for (var i = 0; i < items.length; i++) {
                if (items[i].type === 1 && items[i].data && items[i].data.length > 10) {
                    var rType = items[i].data[10] & 0x7f;
                    // Normalize ID: If data[10] is a raw ID (1..15), it maps to Record Type (16..30)
                    if (rType > 0 && rType < 16) rType += 15;
                    dataFileIndices[rType] = i;
                    childCounts[i] = 0;
                    dataFileChildren[i] = [];
                }
            }

            // 2. Assign Records to Parents
            for (var i = 0; i < items.length; i++) {
                if (items[i].type >= 16 && items[i].type <= 126) {
                    var parentIdx = dataFileIndices[items[i].type];
                    if (parentIdx !== undefined) {
                        childCounts[parentIdx]++;
                        if (groupRecords) {
                            dataFileChildren[parentIdx].push(i);
                            childIndices.add(i);
                        }
                    }
                }
            }

            if (groupRecords) {
                // 3. Mark last children for tree lines
                for (var parentIdx in dataFileChildren) {
                    var children = dataFileChildren[parentIdx];
                    if (children.length > 0) {
                        items[children[children.length - 1]].isLastChild = true;
                    }
                }

                // 4. Render loop with grouping
                for (var i = 0; i < items.length; i++) {
                    if (childIndices.has(i)) continue;

                    var item = items[i];
                    itemsToRender.push({ item: item, index: i, indent: false });

                    // If this is a Data File, check if it has children to render
                    if (item.type === 1 && dataFileChildren[i] && dataFileChildren[i].length > 0) {
                        if (typeof item.collapsed === 'undefined') {
                            item.collapsed = !!OptionsManager.getOption('collapseDataFiles');
                        }

                        if (!item.collapsed) {
                            var children = dataFileChildren[i];
                            for (var k = 0; k < children.length; k++) {
                                var childIdx = children[k];
                                itemsToRender.push({ item: items[childIdx], index: childIdx, indent: true });
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

            // Clear container
            packContents.innerHTML = '';

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

                var itemRow = this.createItemRow(item, pIdx, originalIndex, address, pl, renderItem.indent, count, groupRecords);
                // Add tracking data
                itemRow.setAttribute('data-pack-idx', pIdx);
                itemRow.setAttribute('data-item-idx', originalIndex);
                packContents.appendChild(itemRow);
            }

            // Add DragOver to container to ensure valid drop target during drag interactions
            // Add DragOver to container to ensure valid drop target during drag interactions
            // Delegated Event Handlers
            packWrapper.appendChild(packContents);
        }

        return packWrapper;
    }

    createItemRow(item, packIndex, itemIndex, address, addrLen, indent, childCount, showGrouping) {
        var row = document.createElement('li');
        row.className = 'pack-item-row';
        if (currentItem === item) {
            row.classList.add('selected');
        } else if (typeof selectedItems !== 'undefined' && selectedItems.indexOf(item) !== -1) {
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
        if (item.type === 1 && showGrouping && childCount > 0) {
            itemIcon.classList.add('clickable');
            var countStr = " (" + childCount + " records)";
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
            if (this.dragSrcInfo) return; // Prevent tooltip during drag
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
            itemIcon.classList.add('clickable');
            itemIcon.title = "Click to view Code Visualization"; // Native title
            itemIcon.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                var viz = (typeof CodeVisualizer !== 'undefined') ? CodeVisualizer : window.CodeVisualizer;
                if (viz) {
                    viz.showSystemMap(packs);
                } else {
                    // console.error("Visualizer: CodeVisualizer is UNDEFINED"); // DEBUG LOG
                    alert("Visualizer component not loaded.");
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
            itemDesc.classList.add('clickable');
            itemDesc.style.textDecoration = "none";
            itemDesc.title = "Click to view Translated Q-Code (Hex)";

            itemDesc.addEventListener('click', function (e) {
                if (!OptionsManager.getOption('enableHexView')) return; // Allow bubble to selection if disabled
                e.stopPropagation();
                if (item.getFullData) {
                    var data = item.getFullData();
                    if (data && data.length > 0) {
                        if (typeof HexViewer !== 'undefined') HexViewer.show(data, "OPL Procedure Record: " + item.name);
                    } else {
                        alert("No Data found.");
                    }
                } else if (item.child && item.child.child && item.child.child.data) {
                    // Safety Check for nested properties
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
            itemSelected(packIndex, itemIndex, e); // Global function with event
        });

        // Keyboard Support
        row.setAttribute('tabindex', '0');
        row.addEventListener('focus', function () {
            // Sync selection state on focus
            if (currentItem !== item) {
                // selectItem(packIndex, itemIndex) avoids full re-render if optimized
                if (typeof PackContents !== 'undefined') PackContents.selectItem(packIndex, itemIndex);
            }
        });

        row.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                itemSelected(packIndex, itemIndex, e);
            } else if (e.key === 'Delete' || e.key === 'Backspace') {
                e.preventDefault();
                // Ensure this item is selected before erasing - actually eraseItem handles selection or currentItem
                if (typeof eraseItem === 'function') {
                    eraseItem(e.shiftKey);
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
                        // 
                        //                         console.warn("eraseItem global not found.");
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

        // ... overflow logic ...

        if (!isHeader && !isMain && !isEOP) {
            // row.draggable = true;
            row.setAttribute('draggable', 'true');
            row.addEventListener('dragstart', function (e) {
                this.handleDragStart(e, packIndex, itemIndex);
            }.bind(this));
        } else {
            // row.draggable = false;
            row.removeAttribute('draggable');
        }

        row.addEventListener('dragover', this.handleDragOver.bind(this));
        row.addEventListener('drop', function (e) {
            if (itemIndex === 0) return;
            if (item.name === "MAIN") return;
            this.handleDrop(e, packIndex, itemIndex);
        }.bind(this));
        row.addEventListener('dragenter', this.handleDragEnter.bind(this));
        row.addEventListener('dragleave', this.handleDragLeave.bind(this));
        row.addEventListener('dragend', this.handleDragEnd.bind(this));

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
    // Drag and Drop Handlers
    handleDragStart(e, packIndex, itemIndex) {
        // e.stopPropagation();
        this.dragSrcInfo = { packIndex: packIndex, itemIndex: itemIndex };
        e.dataTransfer.effectAllowed = 'copyMove';
        e.dataTransfer.setData('text/html', e.currentTarget.outerHTML);
        e.currentTarget.classList.add('dragElem');
    }

    handleDragOver(e) {
        if (e.preventDefault) e.preventDefault(); // Essential for Drop
        e.dataTransfer.dropEffect = e.ctrlKey ? 'copy' : 'move';
        e.currentTarget.classList.add('over');
        return false;
    }

    handleDragEnter(e) {
        if (!this.dragSrcInfo) return;
        e.currentTarget.classList.add('over');
    }

    handleDragLeave(e) {
        // Prevent removing class if leaving for a child element
        // if (e.relatedTarget && this.contains(e.relatedTarget)) return; // 'this' is wrong here binding wise, checking contains on currentTarget
        if (e.relatedTarget && e.currentTarget.contains(e.relatedTarget)) return;
        e.currentTarget.classList.remove('over');
    }

    handleDrop(e, toPackIndex, toItemIndex) {
        if (e.stopPropagation) e.stopPropagation();

        // Check for External Files first
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            if (typeof importFilesToPack === 'function') {
                importFilesToPack(toPackIndex, e.dataTransfer.files);
            }
            return false;
        }

        if (!this.dragSrcInfo) return;

        // Capture State locally
        var srcPackIdx = this.dragSrcInfo.packIndex;
        var srcItemIdx = this.dragSrcInfo.itemIndex;
        var isCopy = e.ctrlKey;

        // Critical Fix: Clear drag state BEFORE calling itemMoved.
        // itemMoved calls updateInventory() -> render().
        // If dragSrcInfo is still set, render() aborts, breaking the UI update.
        this.dragSrcInfo = null;

        if (typeof itemMoved === 'function') {
            itemMoved(srcPackIdx, srcItemIdx, toPackIndex, toItemIndex, isCopy);
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

        // Update selection for *all* rows based on global selectedItems
        var items = this.container.querySelectorAll('.pack-item-row');
        items.forEach(function (row) {
            var rowPIdx = parseInt(row.getAttribute('data-pack-idx'));
            var rowIIdx = parseInt(row.getAttribute('data-item-idx'));

            var isSelected = false;
            if (typeof selectedItems !== 'undefined' && typeof packs !== 'undefined') {
                if (rowPIdx === packIndex && packs[rowPIdx] && packs[rowPIdx].items) {
                    var it = packs[rowPIdx].items[rowIIdx];
                    // Use includes
                    if (selectedItems.indexOf(it) !== -1) {
                        isSelected = true;
                    }
                }
            }

            if (isSelected) row.classList.add('selected');
            else row.classList.remove('selected');
        });

        // Focus the specific active row
        var target = this.container.querySelector('.pack-item-row[data-pack-idx="' + packIndex + '"][data-item-idx="' + itemIndex + '"]');
        if (target) {
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
