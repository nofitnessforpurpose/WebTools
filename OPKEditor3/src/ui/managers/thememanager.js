'use strict';

var ThemeManager = {
    currentTheme: 'dark', // default

    init: function () {
        // Load from storage
        var storedTheme = OptionsManager.getOption('theme');
        if (storedTheme) {
            this.currentTheme = storedTheme;
        }
        this.applyTheme(this.currentTheme);
    },

    setTheme: function (theme) {
        this.currentTheme = theme;
        OptionsManager.setOption('theme', theme);
        this.applyTheme(theme);
    },

    toggleTheme: function () {
        if (this.currentTheme === 'dark') {
            this.setTheme('light');
        } else {
            this.setTheme('dark');
        }
    },

    applyTheme: function (theme) {
        document.documentElement.setAttribute('data-theme', theme);
        // Dispatch event for other components (like editor) to update if needed
        var event = new CustomEvent('themeChanged', { detail: { theme: theme } });
        window.dispatchEvent(event);
    }
};

// Initialize immediately
ThemeManager.init();
