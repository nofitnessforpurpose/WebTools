'use strict';

/**
 * Architecture: App Store (Centralized State)
 * -------------------------------------------
 * Single source of truth for application state.
 * Allows decoupling of Controller logic from UI components.
 */
var AppStore = {
    state: {
        packs: [],
        currentPack: null,
        currentPackIndex: -1,
        selectedPackIndex: -1,
        currentItem: null,
        currentEditor: null,
        syntaxHighlightingEnabled: true
    },

    // Simple Event System (Observer Pattern)
    listeners: [],

    subscribe: function (callback) {
        this.listeners.push(callback);
    },

    notify: function (event, data) {
        this.listeners.forEach(function (callback) {
            callback(event, data);
        });
    }
};
