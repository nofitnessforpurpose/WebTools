'use strict';

//------------- Memory Map Editor --------------------

function MemoryMapEditor(editorelement, callback) {
    // Pass -1 as accepted type initially, will override acceptType
    FileEditor.call(this, editorelement, callback, [-1]);
}
MemoryMapEditor.prototype = Object.create(FileEditor.prototype);

// Accept type 255 (0xFF) - Terminator / End of Pack
MemoryMapEditor.prototype.acceptsType = function (type) {
    return type === 255;
}

MemoryMapEditor.prototype.initialise = function (item) {
    if (!this.myelement) {
        this.myelement = document.createElement('div');
        this.myelement.className = 'memory-map-editor';
    }

    // Clear previous content
    this.myelement.innerHTML = "";

    // Header/Title
    var header = document.createElement('h3');
    header.innerText = "Data Pack Memory Map";
    this.myelement.appendChild(header);

    // Render Memory Map
    if (typeof renderMemoryMap === 'function' && typeof packs !== 'undefined' && currentPackIndex >= 0) {
        var currentPack = packs[currentPackIndex];
        if (currentPack) {
            var mapContainer = renderMemoryMap(currentPack);
            this.myelement.appendChild(mapContainer);
        }
    } else {
        var error = document.createElement('div');
        error.innerText = "Unable to render memory map.";
        this.myelement.appendChild(error);
    }

    this.editorelement.appendChild(this.myelement);
    this.item = item;
}

// Read-only, no save/apply needed
MemoryMapEditor.prototype.hasUnsavedChanges = function () { return false; }
MemoryMapEditor.prototype.applyChanges = function () { return false; }
