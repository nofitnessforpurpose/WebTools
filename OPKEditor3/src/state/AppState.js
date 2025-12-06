'use strict';

var AppState = (function () {
    var state = {
        packs: [],
        currentPackIndex: -1,
        selectedPackIndex: -1,
        currentItem: null,
        currentEditor: null,
        syntaxHighlightingEnabled: true
    };

    var listeners = {};

    function emit(event, data) {
        if (listeners[event]) {
            listeners[event].forEach(function (cb) { cb(data); });
        }
    }

    return {
        // Event Subscription
        on: function (event, callback) {
            if (!listeners[event]) listeners[event] = [];
            listeners[event].push(callback);
        },

        // Getters
        getPacks: function () { return state.packs; },
        getPack: function (index) { return state.packs[index]; },
        getCurrentPackIndex: function () { return state.currentPackIndex; },
        getSelectedPackIndex: function () { return state.selectedPackIndex; },
        getCurrentItem: function () { return state.currentItem; },
        getCurrentEditor: function () { return state.currentEditor; },
        isSyntaxHighlightingEnabled: function () { return state.syntaxHighlightingEnabled; },

        // State Mutators
        setPacks: function (packs) {
            state.packs = packs;
            emit('packListChanged', state.packs);
        },
        addPack: function (pack) {
            state.packs.push(pack);
            emit('packListChanged', state.packs);
        },
        removePack: function (index) {
            state.packs.splice(index, 1);
            if (state.currentPackIndex >= index) state.currentPackIndex = -1;
            if (state.selectedPackIndex >= index) state.selectedPackIndex = -1;
            emit('packListChanged', state.packs);
        },
        setCurrentPackIndex: function (index) {
            state.currentPackIndex = index;
            emit('selectionChanged', { type: 'pack', index: index });
        },
        setSelectedPackIndex: function (index) {
            state.selectedPackIndex = index;
            emit('headerSelectionChanged', index);
        },
        setCurrentItem: function (item) {
            state.currentItem = item;
            emit('itemSelected', item);
        },
        setCurrentEditor: function (editor) {
            state.currentEditor = editor;
            emit('editorChanged', editor);
        },
        setSyntaxHighlighting: function (enabled) {
            state.syntaxHighlightingEnabled = enabled;
            emit('optionsChanged', { syntaxHighlighting: enabled });
        }
    };
})();
