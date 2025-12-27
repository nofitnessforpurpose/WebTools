'use strict';

var PackService = (function () {

    function createNewPack() {
        var newPack = new PackImage(null);
        // Default filename will be handled by the controller/state
        return newPack;
    }

    function savePack(pack) {
        if (!pack) return;
        pack.unsaved = false;
        var url = pack.getURL();
        return url;
    }

    function exportHex(pack) {
        if (!pack) return;
        var url = pack.getHexURL();
        return url;
    }

    function calculateChecksums(pack) {
        if (!pack) return;
        var data = pack.getRawData();
        pack.checksums = Checksums.calculate(data);
        return pack.checksums;
    }

    function updatePackSize(pack) {
        var items = pack.items;
        var ix = 0;
        for (var i = 0; i < items.length; i++) {
            ix += items[i].getLength();
        }
        var sz = 1;
        while (sz * 8192 < ix) sz *= 2;
        var pksz = items[0].data[1];
        if (pksz < sz) {
            items[0].data[1] = sz;
            return true; // Size updated
        }
        return false;
    }

    return {
        createPack: createNewPack,
        savePack: savePack,
        exportHex: exportHex,
        calculateChecksums: calculateChecksums,
        updatePackSize: updatePackSize
    };
})();
