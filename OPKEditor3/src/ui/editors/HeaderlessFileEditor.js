'use strict';

//------------- Headerless File editor --------------------

function HeaderlessFileEditor(editorelement, callback) {
    HexEditor.call(this, editorelement, callback, [0]);
}
HeaderlessFileEditor.prototype = Object.create(HexEditor.prototype);

