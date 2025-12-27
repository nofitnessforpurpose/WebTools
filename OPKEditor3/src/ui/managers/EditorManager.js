'use strict';

var EditorManager = {
    editors: [],

    init: function (editors) {
        this.editors = editors || [];
    },

    selectPack: function (index) {
        // Optimization: If selecting the already selected pack
        if (AppStore.state.selectedPackIndex === index) {
            // Unset current item to indicate pack root
            AppStore.state.currentItem = null;
            AppStore.state.currentPackIndex = index;

            // Update Sidebar Selection (Non-destructive)
            if (typeof PackContents !== 'undefined') PackContents.selectPack(index);

            // Show Memory Map
            if (index >= 0 && index < AppStore.state.packs.length) {
                var mmEditor = this.editors.find(function (e) { return e instanceof MemoryMapEditor; });
                if (mmEditor) {
                    AppStore.state.currentEditor = mmEditor;
                    mmEditor.initialise({ type: 255 });

                    var packName = AppStore.state.packs[index].filename || "Untitled Pack";
                    if (document.getElementById('current-file-name')) document.getElementById('current-file-name').innerText = packName;

                    if (document.getElementById('code-editor-container')) document.getElementById('code-editor-container').style.display = 'none';
                    if (document.getElementById('editor-view')) document.getElementById('editor-view').style.display = 'block';
                }
            } else {
                if (document.getElementById('current-file-name')) document.getElementById('current-file-name').innerText = "No Pack Selected";
            }

            if (typeof updateItemButtons === 'function') updateItemButtons(false);
            return;
        }

        if (!this.closeEditor()) return;

        AppStore.state.selectedPackIndex = index;
        AppStore.state.currentPackIndex = index;
        AppStore.state.currentItem = null;
        if (typeof updateInventory === 'function') updateInventory();

        // Show Memory Map
        if (index >= 0 && index < AppStore.state.packs.length) {
            var mmEditor = this.editors.find(function (e) { return e instanceof MemoryMapEditor; });
            if (mmEditor) {
                AppStore.state.currentEditor = mmEditor;
                mmEditor.initialise({ type: 255 });

                var packName = AppStore.state.packs[index].filename || "Untitled Pack";
                if (document.getElementById('current-file-name')) document.getElementById('current-file-name').innerText = packName;

                if (document.getElementById('code-editor-container')) document.getElementById('code-editor-container').style.display = 'none';
                if (document.getElementById('editor-view')) document.getElementById('editor-view').style.display = 'block';
            }
        } else {
            if (document.getElementById('current-file-name')) document.getElementById('current-file-name').innerText = "No Pack Selected";
        }
        if (typeof updateItemButtons === 'function') updateItemButtons(false);
    },

    selectItem: function (packIdx, itemIdx) {
        var pack = AppStore.state.packs[packIdx];
        var item = pack ? pack.items[itemIdx] : null;

        if (AppStore.state.currentItem === item) {
            if (typeof PackContents !== 'undefined') PackContents.selectItem(packIdx, itemIdx);
            return;
        }

        this.itemSelected(packIdx, itemIdx);
    },

    itemSelected: function (packIndex, itemIndex) {
        var pack = AppStore.state.packs[packIndex];
        if (!pack) return false;
        var isok = itemIndex >= 0 && itemIndex < pack.items.length;
        if (!isok) return false;

        if (AppStore.state.currentItem == pack.items[itemIndex]) return true;

        if (!this.closeEditor()) return false;

        AppStore.state.currentPackIndex = packIndex;
        // AppStore.state.selectedPackIndex = -1; // Wait, opkedit.js sets this to -1.
        // We should follow opkedit.js logic:
        AppStore.state.selectedPackIndex = -1;
        AppStore.state.currentItem = pack.items[itemIndex];
        var tp = AppStore.state.currentItem.type;

        var i = 0;
        var selectedEditor = null;

        // Heuristic for Type 0 (Data Block)
        if (tp === 0) {
            var item = AppStore.state.currentItem;
            if (item.data.length >= 2 && item.data[0] + 2 === item.data.length) {
                var recType = item.data[1] & 0x7f;
                if (recType >= 16 && recType <= 126) {
                    var recordEditor = this.editors.find(function (e) { return e instanceof RecordEditor; });
                    if (recordEditor) selectedEditor = recordEditor;
                } else {
                    var hexEditor = this.editors.find(function (e) { return e instanceof HexEditor; });
                    if (hexEditor) selectedEditor = hexEditor;
                }
            } else {
                var hexEditor = this.editors.find(function (e) { return e instanceof HexEditor; });
                if (hexEditor) selectedEditor = hexEditor;
            }
        }

        if (!selectedEditor) {
            while (i < this.editors.length && !this.editors[i].acceptsType(tp)) {
                i++;
            }
            if (i < this.editors.length) {
                selectedEditor = this.editors[i];
            }
        }

        if (selectedEditor) {
            AppStore.state.currentEditor = selectedEditor;
            var legacyEditorElement = document.getElementById('editor-view'); // Re-checking ID in opkedit.js... wait, code uses `legacyEditorElement`.
            // opkedit.js: var legacyEditorElement = document.getElementById("editor-view");
            if (legacyEditorElement) legacyEditorElement.style.display = 'block';

            var startAddr = 0;
            AppStore.state.currentEditor.initialise(AppStore.state.currentItem, startAddr);
        } else {
            console.warn("No editor found for type " + tp);
        }

        // Update UI logic
        if (typeof PackContents !== 'undefined' && PackContents.selectItem) {
            PackContents.selectItem(packIndex, itemIndex);
        } else if (typeof updateInventory === 'function') {
            updateInventory();
        }

        if (typeof updateItemButtons === 'function') updateItemButtons(false);
        return true;
    },

    closeEditor: function () {
        if (AppStore.state.currentEditor) {
            if (AppStore.state.currentEditor.hasUnsavedChanges()) {
                var discard = confirm("Not all changes have been saved.\nIs it ok to discard those changes?");
                if (!discard) return false;
            }
            AppStore.state.currentEditor.finish();
            AppStore.state.currentEditor = null;

            // Clear editors
            var legacyEditorElement = document.getElementById("editor-view");
            var codeEditorElement = document.getElementById("code-editor-container"); // Assuming ID

            if (legacyEditorElement) {
                legacyEditorElement.innerHTML = "";
                legacyEditorElement.style.display = 'none';
            }
            if (codeEditorElement) codeEditorElement.style.display = 'none';
        }
        return true;
    },

    applyEdits: function () {
        if (AppStore.state.currentEditor && AppStore.state.currentItem) {
            if (AppStore.state.currentEditor.applyChanges()) {
                var currentPackIndex = AppStore.state.currentPackIndex;
                if (currentPackIndex >= 0 && currentPackIndex < AppStore.state.packs.length) {
                    AppStore.state.packs[currentPackIndex].unsaved = true;
                }
                if (typeof updateInventory === 'function') updateInventory();
                if (typeof setStatus === 'function') setStatus("Changes applied");
            } else {
                if (typeof setStatus === 'function') setStatus("No changes to apply");
            }
            if (typeof updateItemButtons === 'function') updateItemButtons(false);
        }
    },

    discardEdits: function () {
        if (AppStore.state.currentEditor && AppStore.state.currentItem) {
            AppStore.state.currentEditor.initialise(AppStore.state.currentItem);
            if (typeof updateItemButtons === 'function') updateItemButtons(false);
            if (typeof setStatus === 'function') setStatus("Edits discarded");
        }
    },

    handleEditorMessage: function (msg, arg1, arg2) {
        if (msg == EditorMessage.CHANGEMADE) {
            if (typeof updateItemButtons === 'function') updateItemButtons(true);
        }
        else if (msg == EditorMessage.GETFILEIDS) {
            return PackManager.getDataFiles();
        }
        else if (msg == EditorMessage.CHANGEFILEID) {
            var fromtp = arg1 & 0x7f;
            var totp = arg2 & 0x7f;
            var pack = AppStore.state.packs[AppStore.state.currentPackIndex];
            if (!pack) return;
            var items = pack.items;
            for (var i = 0; i < items.length; i++) {
                var item = items[i];
                if (item.type == fromtp) {
                    item.data[1] = totp + (item.deleted ? 0 : 0x80);
                    item.setDescription();
                    pack.unsaved = true;
                }
            }
        }
        else if (msg == EditorMessage.DELETERECORDS) {
            var fileid = arg1 & 0x7f;
            var deleted = arg2;
            var pack = AppStore.state.packs[AppStore.state.currentPackIndex];
            if (!pack) return;
            var items = pack.items;
            for (var i = 0; i < items.length; i++) {
                var item = items[i];
                if (item.type == fileid) {
                    item.data[1] = fileid + (deleted ? 0 : 0x80);
                    item.setDescription();
                    pack.unsaved = true;
                }
            }
        }
    }
};
