'use strict';

var OptionsManager = {
    options: {
        theme: 'dark',
        showLineNumbers: true,
        codeFolding: true,
        syntaxHighlighting: true,
        fontSize: 14
    },

    init: function () {
        this.loadOptions();
    },

    loadOptions: function () {
        var stored = localStorage.getItem('opkedit_options');
        if (stored) {
            try {
                var parsed = JSON.parse(stored);
                // Merge with defaults
                for (var key in parsed) {
                    if (this.options.hasOwnProperty(key)) {
                        this.options[key] = parsed[key];
                    }
                }
            } catch (e) {
                console.error("Failed to load options", e);
            }
        }
    },

    saveOptions: function () {
        localStorage.setItem('opkedit_options', JSON.stringify(this.options));
    },

    getOption: function (key) {
        return this.options[key];
    },

    setOption: function (key, value) {
        this.options[key] = value;
        this.saveOptions();
    }
};

// Initialize immediately so it's available
OptionsManager.init();
