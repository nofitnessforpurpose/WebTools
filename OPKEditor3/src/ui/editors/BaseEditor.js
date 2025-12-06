'use strict';

'use strict';

/**
 * Architecture: Editor Base Class
 * -----------------------------
 * Defines the interface that all specific file editors must implement.
 * This ensures a consistent API for the Controller (opkedit.js) to manage different editor types.
 * 
 * Lifecycle:
 * 1. Constructor: Sets up the editor instance.
 * 2. initialise(item): Called when the editor is shown. Populates the UI with data from the `PackItem`.
 * 3. applyChanges(): Called when the user clicks "Apply". Validates and saves data back to the `PackItem`.
 * 4. finish(): Called when the editor is hidden/closed. Cleans up the UI.
 */
function FileEditor(editorelement, callback, types, codeEditorContainer) {
    this.callback = callback;  // called when changes are to be saved
    this.types = types;
    this.editorelement = editorelement;
    this.codeEditorContainer = codeEditorContainer;
}

FileEditor.prototype = {
    acceptsType: function (tp) {
        return this.types.indexOf(tp) >= 0;
    },

    // create ui for this item inside the given dom element
    initialise: function (item, extraelement) {
    },

    // remove editor from webpage, discard unsaved changes
    finish: function () {
        if (this.myelement) this.editorelement.removeChild(this.myelement);
    },

    // Returns true if the current input will actually change the underlying pack item
    hasUnsavedChanges: function () { return false; },

    // Stores the current input into the underlying pack item.
    // Returns true if the item has actually changed.
    applyChanges: function () { return false; },
};
