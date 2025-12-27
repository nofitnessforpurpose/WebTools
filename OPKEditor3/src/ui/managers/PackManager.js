'use strict';

/**
 * PackManager
 * -----------
 * Encapsulates all core business logic for Psion Pack and PackItem manipulation.
 * This includes creation, deletion, moving items, and exporting data.
 */
var PackManager = {
    /**
     * Creates a new blank pack and adds it to the application state.
     */
    createNew: function () {
        if (typeof HexViewer !== 'undefined') HexViewer.close();

        var newPack = new PackImage(null);
        newPack.filename = "Pack" + (AppStore.state.packs.length + 1) + ".opk";
        AppStore.state.packs.push(newPack);

        // Make new pack active
        AppStore.state.currentPackIndex = AppStore.state.packs.length - 1;

        updateInventory();
        setStatus("New pack created");
    },

    /**
     * Saves the currently active pack to the local file system.
     * Uses File System Access API if available, otherwise falls back to download.
     */
    packSaved: async function () {
        if (!closeEditor()) return;

        var pack = this.getActivePack();
        if (!pack) return;

        var data = pack.getRawData();

        // Try File System Access API
        if (window.showSaveFilePicker) {
            try {
                const options = {
                    suggestedName: pack.filename || "pack.opk",
                    types: [
                        {
                            description: 'Psion Pack File',
                            accept: { 'application/octet-stream': ['.opk'] },
                        },
                    ],
                };
                const handle = await window.showSaveFilePicker(options);
                const writable = await handle.createWritable();
                await writable.write(data);
                await writable.close();

                pack.unsaved = false;
                pack.filename = handle.name;
                updateInventory();
                setStatus("Pack saved to " + handle.name);
                return;
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Save File Picker failed:', err);
                    // Fallback to classic download
                } else {
                    return; // User cancelled
                }
            }
        }

        // Fallback: Classic Download
        var filename = prompt("Save Pack As:", pack.filename || "pack.opk");
        if (filename) {
            var blob = new Blob([data], { type: "application/octet-stream" });
            var url = URL.createObjectURL(blob);
            this.downloadFileFromUrl(filename, url);
            URL.revokeObjectURL(url);

            pack.unsaved = false;
            pack.filename = filename;
            updateInventory();
            setStatus("Pack downloaded as " + filename);
        }
    },

    /**
     * Exports the currently active pack as an Intel HEX file.
     */
    exportHex: function () {
        if (!closeEditor()) return;
        var pack = this.getActivePack();
        if (!pack) return;

        var ihex = packToIntelHex(pack);
        var filename = pack.filename ? pack.filename.replace(/\.opk$/i, "") + ".hex" : "pack.hex";

        var userFilename = prompt("Export Hex As:", filename);
        if (userFilename) {
            var blob = new Blob([ihex], { type: "text/plain" });
            var url = URL.createObjectURL(blob);
            this.downloadFileFromUrl(userFilename, url);
            URL.revokeObjectURL(url);
            setStatus("Hex file exported.");
        }
    },

    /**
     * Exports the currently selected item as a binary file.
     */
    exportCurrentItem: function () {
        var pack = AppStore.state.packs[AppStore.state.currentPackIndex];
        var currentItem = AppStore.state.currentItem;
        if (!pack || !currentItem) return;

        var filename = "item.bin";
        if (currentItem.name) {
            filename = currentItem.name.trim();
        }

        // Heuristic for extension
        var type = currentItem.type;
        if (type === 1) filename += ".odb";
        else if (type >= 2 && type <= 15) {
            filename += ".OB" + type.toString(16).toUpperCase();
        } else if (type >= 16) filename += ".odb";
        else if (!filename.match(/\.[a-z0-9]{3}$/i)) filename += ".bin";

        var userFilename = prompt("Save item as:", filename);
        if (userFilename) {
            var url = pack.getItemURL(currentItem);
            if (url) {
                this.downloadFileFromUrl(userFilename, url);
            } else {
                alert("Cannot export this item type (id: " + type + "). Only standard files (OPL, ODB, Notepad, etc) are supported.");
            }
        }
    },

    /**
     * Returns the currently active pack based on application state.
     */
    getActivePack: function () {
        var state = AppStore.state;
        if (state.currentPackIndex >= 0 && state.currentPackIndex < state.packs.length) {
            return state.packs[state.currentPackIndex];
        }
        if (state.selectedPackIndex >= 0 && state.selectedPackIndex < state.packs.length) {
            return state.packs[state.selectedPackIndex];
        }
        if (state.packs.length > 0) return state.packs[0];
        return null;
    },

    /**
     * Triggers a browser download from a URL.
     */
    downloadFileFromUrl: function (filename, url) {
        var a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    },

    /**
     * Logic for moving items between packs or within a pack via Drag and Drop.
     */
    itemMoved: function (fromPackIx, fromItemIx, toPackIx, toItemIx, isCopy) {
        // Prevent moving to same position if not copying
        if (!isCopy && fromPackIx === toPackIx && fromItemIx === toItemIx) return;

        var fromPack = AppStore.state.packs[fromPackIx];
        var toPack = AppStore.state.packs[toPackIx];

        if (!fromPack || !toPack) return;

        var item = fromPack.items[fromItemIx];

        // Logic for boot offset if moving within same pack (preserved from original)
        var bootOffset = -1;
        if (!isCopy && fromPackIx === toPackIx) {
            if (item.type == 0 && (fromPack.items[0].data[0] & 0x10) == 0) {
                var addr1 = this.getItemAddress(fromPack, fromItemIx);
                var addr2 = (fromPack.items[0].data[6] << 8) + fromPack.items[0].data[7];
                if (addr2 >= addr1 && addr2 < addr1 + item.getLength()) {
                    bootOffset = addr2 - addr1;
                }
            }
        }

        if (isCopy) {
            item = this.clonePackItem(item);
        } else {
            // Remove from source
            fromPack.items.splice(fromItemIx, 1);

            // Adjust destination index if in same pack and moving down
            if (fromPackIx === toPackIx && fromItemIx < toItemIx) {
                toItemIx--;
            }
            fromPack.unsaved = true;
        }

        // Insert into destination
        toPack.items.splice(toItemIx, 0, item);

        // Update boot offset if applicable
        if (bootOffset >= 0 && fromPackIx === toPackIx) {
            var addr = this.getItemAddress(toPack, toItemIx) + bootOffset;
            toPack.items[0].data[6] = (addr >> 8) & 0xff;
            toPack.items[0].data[7] = addr & 0xff;
        }

        toPack.unsaved = true;
        updateInventory();
    },

    /**
     * Calculates the memory address of an item within a pack.
     */
    getItemAddress: function (pack, ix) {
        var addr = 0;
        for (var i = 0; i < ix; i++) {
            addr += pack.items[i].getLength();
        }
        return addr;
    },

    /**
     * Deep clones a PackItem and its children.
     */
    clonePackItem: function (item) {
        var newItem = new PackItem(item.data, 0, item.data.length);
        newItem.setDescription();
        if (item.child) {
            newItem.child = this.clonePackItem(item.child);
        }
        return newItem;
    },

    /**
     * Erases the currently selected item or the entire selected pack.
     */
    eraseItem: function () {
        var state = AppStore.state;
        if (state.selectedPackIndex >= 0) {
            var discard = window.confirm("Are you sure you want to close/remove this pack?");
            if (!discard) return;

            if (!closeEditor()) return;

            // Remove from storage if enabled
            if (OptionsManager.getOption('restorePacks')) {
                var pack = state.packs[state.selectedPackIndex];
                if (pack) {
                    this._removeFromCache(pack.filename);
                }
            }

            state.packs.splice(state.selectedPackIndex, 1);
            state.selectedPackIndex = -1;
            state.currentPackIndex = state.packs.length > 0 ? 0 : -1;
            updateInventory();
            return;
        }

        var currentItem = state.currentItem;
        if (!currentItem) return;

        if (currentItem.type < 0 || currentItem.type === 255) {
            alert("This record cannot be deleted.");
            return;
        }

        var pack = state.packs[state.currentPackIndex];
        if (!pack) return;

        if (!currentItem.deleted) {
            var discard = window.confirm("Are you sure you want to erase " + (currentItem.name ? currentItem.name : "this item") + " from the pack?");
            if (!discard) return false;
        }

        if (!closeEditor()) return false;

        var items = pack.items;
        var i = items.indexOf(currentItem);
        if (i < 0) return;

        pack.unsaved = true;
        items.splice(i, 1);

        // If it was a Data File header, also remove its records
        if (currentItem.type == 1) {
            var fileid = currentItem.data[10] - 0x80;
            for (var j = items.length - 1; j > 0; j--) {
                if (items[j].type == fileid)
                    items.splice(j, 1);
            }
        }

        state.currentItem = null;
        updateInventory();
    },

    /**
     * Internal helper to remove a pack from localStorage cache.
     */
    _removeFromCache: function (filename) {
        try {
            var storedPacks = localStorage.getItem('opkedit_cached_packs');
            if (storedPacks) {
                var cachedPacks = JSON.parse(storedPacks);
                var filtered = cachedPacks.filter(p => p.name !== filename);
                if (filtered.length < cachedPacks.length) {
                    localStorage.setItem('opkedit_cached_packs', JSON.stringify(filtered));
                }
            }

            var storedPaths = localStorage.getItem('opkedit_open_packs');
            if (storedPaths) {
                var openPacks = JSON.parse(storedPaths);
                var filteredPaths = openPacks.filter(p => !p.endsWith(filename));
                if (filteredPaths.length < openPacks.length) {
                    localStorage.setItem('opkedit_open_packs', JSON.stringify(filteredPaths));
                }
            }
        } catch (e) { console.warn("Cache removal failed", e); }
    },

    /**
     * Shows a dialog to create a new item (Procedure, Data File, etc.).
     */
    createNewItem: function () {
        var pack = AppStore.state.packs[AppStore.state.currentPackIndex];
        if (!pack) {
            alert("Please select a pack first.");
            return;
        }

        var availableTypes = {
            1: "Data file",
            3: "Procedure",
            7: "Notepad",
        };

        var element = document.createElement('div');
        element.innerHTML =
            "<div>Select type to add:</div>" +
            "<div><select id=choosetype style='width: 100%; margin-top: 10px; padding: 5px;'></select></div>";

        var sel = element.querySelector("#choosetype");

        // Populate base types
        for (var i in availableTypes) {
            var opt = document.createElement('option');
            opt.value = i;
            opt.innerHTML = availableTypes[i];
            sel.appendChild(opt);
        }

        // Populate existing data files for record creation
        var files = this.getDataFiles();
        for (var i = 1; i < 110; i++) {
            if (files[i]) {
                var opt = document.createElement('option');
                opt.value = i + 0xf;
                opt.innerHTML = "Record for file " + files[i] + " (" + i + ")";
                sel.appendChild(opt);
            }
        }

        var chooseTypeScreen = new ModalDialog(element, () => {
            var type = parseInt(sel.value);
            if (type == 1) {
                var id = this.getFreeFileId();
                if (id <= 0) return;
                var hdritem = this.createFileHeader("DATA" + id, type, id + 0x8f);
                this.addItemToPack(hdritem);
                updateInventory();
            } else if (type == 3) {
                var data = [0x00, 0x00, 0x00, 0x0A, 80, 82, 79, 67, 78, 65, 77, 69, 58, 0];
                this.createBlockFile(data, "PROCNAME", 3);
            } else if (type == 7) {
                var data = [0x00, 0x02, 8, 0, 0x00, 0x09, 78, 79, 84, 69, 80, 65, 68, 58, 0];
                this.createBlockFile(data, "NOTEPAD", 7);
            } else if (type > 0x0f) {
                var hdritem = new PackItem([1, type + 0x80, 0x20], 0, 3);
                hdritem.setDescription();
                this.addItemToPack(hdritem);
                updateInventory();
            }
        });

        chooseTypeScreen.start();
    },

    /**
     * Shows a dialog to create a new record for a specific Data File.
     */
    createNewRecord: function () {
        var files = this.getDataFiles();
        var validFiles = [];
        for (var k in files) {
            var id = parseInt(k);
            if (id >= 1 && id < 110) {
                validFiles.push({ id: id, name: files[id] });
            }
        }

        if (validFiles.length === 0) {
            alert("No Data Files found in this pack. Please create a Data File first.");
            return;
        }

        var element = document.createElement('div');
        element.innerHTML =
            "<div>Select Data File:</div>" +
            "<div><select id='choosedatafile' style='width: 100%; margin-top: 10px; padding: 5px;'></select></div>";

        var sel = element.querySelector("#choosedatafile");
        validFiles.forEach(f => {
            var opt = document.createElement('option');
            opt.value = f.id;
            opt.innerHTML = f.name + " (ID: " + f.id + ")";
            sel.appendChild(opt);
        });

        var dialog = new ModalDialog(element, () => {
            var fileId = parseInt(sel.value);
            if (fileId > 0) {
                var type = fileId + 0x0F;
                var hdritem = new PackItem([1, type + 0x80, 0x20], 0, 3);
                hdritem.setDescription();
                this.addItemToPack(hdritem);
                updateInventory();
            }
        });

        dialog.start();
    },

    /**
     * Scans the current pack for Data Files and returns a map of ID to Name.
     */
    getDataFiles: function () {
        var idlst = {};
        var pack = AppStore.state.packs[AppStore.state.currentPackIndex];
        if (!pack) return idlst;
        var items = pack.items;
        for (var i = 0; i < items.length; i++) {
            if (items[i].type == 1) {
                var id = items[i].data[10] - 0x8f;
                idlst[id] = items[i].name;
            }
        }
        return idlst;
    },

    /**
     * Finds the next available Data File ID (1-110).
     */
    getFreeFileId: function () {
        var ids = this.getDataFiles();
        var id = 1;
        while (ids[id]) id++;
        return id >= 111 ? -1 : id;
    },

    /**
     * Handles the file input 'change' event for loading packs.
     */
    fileChosen: function (e) {
        var fileInput = e.target;
        if (fileInput && fileInput.files.length > 0) {
            this.loadPackFromFiles(fileInput.files);
        }
    },

    /**
     * Loads one or more packs from the provided FileList.
     */
    loadPackFromFiles: function (files) {
        if (typeof HexViewer !== 'undefined') HexViewer.close();
        if (files.length == 0) return;

        for (var i = 0; i < files.length; i++) {
            this._loadSinglePack(files[i]);
        }
    },

    /**
     * Internal helper to load a single pack file.
     */
    _loadSinglePack: function (file) {
        var fname = file.name.toLowerCase();
        if (fname.endsWith(".hex") || fname.endsWith(".ihx")) {
            var reader = new FileReader();
            reader.onload = (e) => {
                try {
                    var binary = this.parseIntelHexToBinary(e.target.result);
                    var len = binary.length;
                    var header = new Uint8Array(6);
                    header[0] = 0x4F; header[1] = 0x50; header[2] = 0x4B;
                    header[3] = (len >> 16) & 0xFF;
                    header[4] = (len >> 8) & 0xFF;
                    header[5] = len & 0xFF;

                    var opkData = new Uint8Array(6 + len + 2);
                    opkData.set(header, 0);
                    opkData.set(binary, 6);
                    opkData[6 + len] = 0xFF;
                    opkData[6 + len + 1] = 0xFF;

                    var newPack = new PackImage(opkData);
                    newPack.unsaved = false;
                    newPack.filename = file.name.replace(/\.[^/.]+$/, "") + ".opk";

                    AppStore.state.packs.push(newPack);
                    AppStore.state.currentPackIndex = AppStore.state.packs.length - 1;
                    AppStore.state.selectedPackIndex = AppStore.state.packs.length - 1;

                    this.updatePackChecksums(newPack);
                    updateInventory();
                    setStatus("Loaded HEX file: " + newPack.filename);
                } catch (err) {
                    alert("Error parsing HEX file: " + err.message);
                }
            };
            reader.readAsText(file);
        } else {
            LoadLocalBinaryFile(file, (data, nm) => {
                var newPack = new PackImage(data);
                newPack.unsaved = false;
                newPack.filename = nm;

                if (OptionsManager.getOption('restorePacks')) {
                    this._cachePackData(nm, data);
                }

                AppStore.state.packs.push(newPack);
                AppStore.state.currentPackIndex = AppStore.state.packs.length - 1;
                AppStore.state.selectedPackIndex = AppStore.state.packs.length - 1;

                this.updatePackChecksums(newPack);
                updateInventory();
                setStatus("Loaded OPK file: " + nm);
                this.saveSession();
            });
        }
    },

    /**
     * Internal helper to cache pack data for session restoration.
     */
    _cachePackData: function (name, data) {
        try {
            var binary = '';
            var len = data.byteLength;
            for (var i = 0; i < len; i++) binary += String.fromCharCode(data[i]);
            var base64 = btoa(binary);

            var stored = localStorage.getItem('opkedit_cached_packs');
            var cachedPacks = stored ? JSON.parse(stored) : [];

            // Remove existing if updating
            cachedPacks = cachedPacks.filter(p => p.name !== name);
            cachedPacks.push({ name: name, data: base64 });
            localStorage.setItem('opkedit_cached_packs', JSON.stringify(cachedPacks));
        } catch (e) { console.warn("Caching failed", e); }
    },

    /**
     * Updates the internal checksums of a pack based on its current data.
     */
    updatePackChecksums: function (pack) {
        if (!pack) return;
        var data = pack.getRawData();
        pack.checksums = Checksums.calculate(data);
    },

    /**
     * Saves the current application state (opened packs and their data) to localStorage.
     */
    saveSession: function () {
        if (!OptionsManager.getOption('restorePacks')) return;

        var sessionPacks = [];
        try {
            AppStore.state.packs.forEach(p => {
                var rawData = p.getRawData();
                var binary = '';
                var len = rawData.byteLength;
                for (var j = 0; j < len; j++) binary += String.fromCharCode(rawData[j]);
                var base64 = btoa(binary);

                sessionPacks.push({
                    name: p.filename || "Untitled",
                    data: base64
                });
            });
            localStorage.setItem('opkedit_cached_packs', JSON.stringify(sessionPacks));
        } catch (e) { console.warn("Session Save Failed:", e); }
    },

    /**
     * Creates a block-style file (Procedure or Notepad) and adds it to the active pack.
     */
    createBlockFile: function (data, name, type) {
        var hdritem = this.createFileHeader(name, type, 0);
        var c2item = new PackItem(data, 0, data.length);
        var c1item = new PackItem([2, 0x80, data.length >> 8, data.length & 0xff], 0, 4);
        c1item.child = c2item;
        c1item.setDescription();
        hdritem.child = c1item;
        this.addItemToPack(hdritem);
        updateInventory();
    },

    /**
     * Creates a standard file header PackItem.
     */
    createFileHeader: function (name, type, id) {
        name = name.replace(/\.((ODB)|(OPL)|(NTS)|(OB[2-9A-F]))$/i, "");
        name = name.replace(/_$/i, "%");
        name = name.replace(/[^a-z0-9\$\%]/i, "");
        name = (name + "        ").substr(0, 8);
        var hdr = new Uint8Array(11);
        hdr[0] = 9;
        hdr[1] = type + 0x80;
        hdr[10] = id;
        for (var i = 0; i < 8; i++) {
            hdr[2 + i] = name.charCodeAt(i);
        }
        var item = new PackItem(hdr, 0, 11);
        item.setDescription();
        return item;
    },

    /**
     * Adds a PackItem to the currently active pack at the appropriate position.
     */
    addItemToPack: function (item) {
        var pack = AppStore.state.packs[AppStore.state.currentPackIndex];
        if (!pack) return;

        var items = pack.items;
        var insertIndex = items.length - 1; // Default: append before terminator

        // Sequential Insertion Logic for Records
        if (item.type >= 16) {
            var fileId = item.type - 0x0F;
            var dfIndex = -1;
            for (var i = 0; i < items.length; i++) {
                if (items[i].type == 1 && items[i].data[10] == (fileId + 0x8F)) {
                    dfIndex = i;
                    break;
                }
            }

            if (dfIndex >= 0) {
                insertIndex = dfIndex + 1;
                while (insertIndex < items.length - 1 && items[insertIndex].type == item.type) {
                    insertIndex++;
                }
            }
        }

        // Update Boot Address if necessary
        if ((pack.items[0].data[0] & 0x10) == 0) {
            var insertOffset = 0;
            for (var i = 0; i < insertIndex; i++) {
                insertOffset += items[i].getLength();
            }

            var bootAddr = (pack.items[0].data[6] << 8) + pack.items[0].data[7];
            if (insertOffset <= bootAddr) {
                var newBootAddr = bootAddr + item.getLength();
                pack.items[0].data[6] = (newBootAddr >> 8) & 0xff;
                pack.items[0].data[7] = newBootAddr & 0xff;
            }
        }

        items.splice(insertIndex, 0, item);
        pack.unsaved = true;
    },

    /**
     * Handles the item input 'change' event for importing items.
     */
    itemChosen: function (e) {
        var pack = AppStore.state.packs[AppStore.state.currentPackIndex];
        if (!pack) return;

        var fileInput = e.target;
        if (!fileInput) return;

        var files = fileInput.files;
        for (var i = 0; i < files.length; i++) {
            var fn = files[i].name;
            if (fn.match(/\.((ODB)|(OPL)|(NTS))$/i)) {
                LoadLocalTextFile(files[i], (data, name) => this.createItemFromFileData(data, name));
            } else {
                LoadLocalBinaryFile(files[i], (data, name) => this.createItemFromFileData(data, name));
            }
        }
        fileInput.value = ''; // Reset
    },

    /**
     * Creates a PackItem from local file data (imported via itemChosen).
     */
    createItemFromFileData: function (filedata, name) {
        // check if it is a valid binary file, "ORG"+type
        if (filedata[0] == 79 && filedata[1] == 82 && filedata[2] == 71 && filedata[5] >= 0x82 && filedata[5] <= 0x8f) {
            var type = filedata[5] - 0x80;
            var ln = (filedata[3] << 8) + filedata[4];
            if (filedata.length < 6 + ln) {
                alert("The file " + name + " seems to be truncated!");
                return;
            }
            var hdritem = this.createFileHeader(name, type, 0);
            var blkhdr = new Uint8Array(4);
            blkhdr[0] = 2; blkhdr[1] = 0x80; blkhdr[2] = filedata[3]; blkhdr[3] = filedata[4];
            var dataitem = new PackItem(filedata, 6, ln);
            var blkhdritem = new PackItem(blkhdr, 0, 4);
            blkhdritem.child = dataitem;
            blkhdritem.setDescription();
            hdritem.child = blkhdritem;
            this.addItemToPack(hdritem);
            updateInventory();
        } else if (filedata[0] == 79 && filedata[1] == 82 && filedata[2] == 71 && filedata[5] == 0xFF) {
            var ln = (filedata[3] << 8) + filedata[4];
            if (filedata.length < 6 + ln || ln < 0x1d) {
                alert("The file " + name + " seems to be truncated!");
                return;
            }
            if (filedata[0x1b] != 0x02 || filedata[0x1c] != 0x80) {
                alert("The file " + name + " does not seem to have\na standard headerless block format!");
                return;
            }
            var ln2 = (filedata[0x1d] << 8) + filedata[0x1e];
            if (filedata.length < 0x1f + ln2) {
                alert("The file " + name + " seems to be truncated!");
                return;
            }
            var blkhdr = new Uint8Array(4);
            blkhdr[0] = 2; blkhdr[1] = 0x80; blkhdr[2] = filedata[0x1d]; blkhdr[3] = filedata[0x1e];
            var dataitem = new PackItem(filedata, 0x1f, ln2);
            var blkhdritem = new PackItem(blkhdr, 0, 4);
            blkhdritem.child = dataitem;
            blkhdritem.setDescription();
            this.addItemToPack(blkhdritem);
            updateInventory();

            var pack = AppStore.state.packs[AppStore.state.currentPackIndex];
            if (pack && pack.items.length == 3) {
                var makeBoot = window.confirm("Do you want this to be used as boot code?");
                if (makeBoot) {
                    var hdata = pack.items[0].data;
                    hdata[2] = 0; hdata[3] = filedata[9]; hdata[4] = filedata[10]; hdata[5] = filedata[11];
                    hdata[6] = filedata[12]; hdata[7] = filedata[13];
                    hdata[0] &= 0xEF;
                    var sum1 = hdata[0] + hdata[2] + hdata[4] + hdata[6];
                    var sum2 = hdata[1] + hdata[3] + hdata[5] + hdata[7];
                    sum1 += (sum2 >> 8);
                    hdata[9] = sum2 & 0xff;
                    if ((hdata[0] & 0x40) == 0) {
                        hdata[8] &= 0x80;
                        hdata[8] += sum1 & 0x7f;
                    } else {
                        hdata[8] = sum1 & 0xff;
                    }
                }
            }
        } else if (name.substr(-4).toUpperCase() == ".OPL") {
            var hdritem = this.createFileHeader(name, 3, 0);
            var ln = filedata.length + 6 + 1;
            var blkhdr = new Uint8Array(4);
            blkhdr[0] = 2; blkhdr[1] = 0x80; blkhdr[2] = (ln >> 8) & 0xff; blkhdr[3] = ln & 0xff;

            var itemdata = new Uint8Array(6 + filedata.length + 1);
            itemdata[0] = 0; itemdata[1] = 0;
            var srclen = filedata.length + 1;
            itemdata[2] = (srclen >> 8) & 0xff; itemdata[3] = srclen & 0xff;

            for (var i = 0; i < filedata.length; i++) {
                var c = filedata.charCodeAt(i);
                itemdata[4 + i] = c == 10 ? 0 : c;
            }
            itemdata[4 + filedata.length] = 0;

            var dataitem = new PackItem(itemdata, 0, itemdata.length);
            var blkhdritem = new PackItem(blkhdr, 0, 4);
            blkhdritem.child = dataitem;
            blkhdritem.setDescription();
            hdritem.child = blkhdritem;
            this.addItemToPack(hdritem);
            updateInventory();
        } else if (name.substr(-4).toUpperCase() == ".ODB") {
            var id = this.getFreeFileId();
            if (id <= 0) return;
            var hdritem = this.createFileHeader(name, 1, id + 0x8f);
            this.addItemToPack(hdritem);
            var line = 1;
            var startix = 0;
            while (startix < filedata.length) {
                var endix = startix;
                while (endix < filedata.length && filedata.charCodeAt(endix) != 10) endix++;
                if (endix >= filedata.length) break;

                var ln = Math.min(endix - startix, 255);
                var itemdata = new Uint8Array(2 + ln);
                for (var i = 0; i < ln; i++)
                    itemdata[2 + i] = filedata.charCodeAt(startix + i);
                itemdata[0] = ln;
                itemdata[1] = id + 0x8f;
                var recitem = new PackItem(itemdata, 0, ln + 2);
                recitem.setDescription();
                this.addItemToPack(recitem);
                line++;
                startix = endix + 1;
            }
            updateInventory();
        } else if (name.substr(-4).toUpperCase() == ".NTS") {
            var hdritem = this.createFileHeader(name, 7, 0);
            var ln = filedata.length + 6;
            var blkhdr = new Uint8Array(4);
            blkhdr[0] = 2; blkhdr[1] = 0x80; blkhdr[2] = (ln >> 8) & 0xff; blkhdr[3] = ln & 0xff;
            var itemdata = new Uint8Array(6 + filedata.length);
            itemdata[0] = 0; itemdata[1] = 2; itemdata[2] = 8; itemdata[3] = 0;
            itemdata[4] = (filedata.length >> 8) & 0xff; itemdata[5] = filedata.length & 0xff;
            for (var i = 0; i < filedata.length; i++) {
                var c = filedata.charCodeAt(i);
                itemdata[6 + i] = c == 10 ? 0 : c;
            }
            var dataitem = new PackItem(itemdata, 0, itemdata.length);
            var blkhdritem = new PackItem(blkhdr, 0, 4);
            blkhdritem.child = dataitem;
            blkhdritem.setDescription();
            hdritem.child = blkhdritem;
            this.addItemToPack(hdritem);
            updateInventory();
        } else if (name.match(/\.OB([0-9A-F])$/i)) {
            var match = name.match(/\.OB([0-9A-F])$/i);
            var typeExt = parseInt(match[1], 16);
            var rawBytes = new Uint8Array(filedata.length);
            for (var i = 0; i < filedata.length; i++) rawBytes[i] = filedata.charCodeAt(i);

            var ln = (rawBytes[3] << 8) | rawBytes[4];
            var typeByte = rawBytes[5];
            var hdritem = this.createFileHeader(name, typeByte & 0x7F, 0);
            var blkhdr = new Uint8Array(4);
            blkhdr[0] = 2; blkhdr[1] = 0x80; blkhdr[2] = rawBytes[3]; blkhdr[3] = rawBytes[4];

            var dataitem = new PackItem(rawBytes, 6, ln);
            var blkhdritem = new PackItem(blkhdr, 0, 4);
            blkhdritem.child = dataitem;
            blkhdritem.setDescription();
            hdritem.child = blkhdritem;
            this.addItemToPack(hdritem);
            updateInventory();
        } else {
            alert("File format not recognised!");
        }
    },

    /**
     * Helper to convert hex string to binary
     */
    parseIntelHexToBinary: function (hexString) {
        var lines = hexString.split('\n');
        var binary = new Uint8Array(0);

        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (line.length == 0 || line[0] != ':') continue;

            var byteCount = parseInt(line.substr(1, 2), 16);
            var recordType = parseInt(line.substr(7, 2), 16);

            if (recordType == 0) { // Data
                var data = new Uint8Array(byteCount);
                for (var j = 0; j < byteCount; j++) {
                    data[j] = parseInt(line.substr(9 + j * 2, 2), 16);
                }

                var newBinary = new Uint8Array(binary.length + data.length);
                newBinary.set(binary);
                newBinary.set(data, binary.length);
                binary = newBinary;
            } else if (recordType == 1) { // EOF
                break;
            }
        }
        return binary;
    }
};
