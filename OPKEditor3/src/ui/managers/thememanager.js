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



    themeDefinitions: {
        'dark': {
            // UI Colors
            '--bg-color': '#1e1e1e',
            '--text-color': '#d4d4d4',
            '--toolbar-bg': '#2d2d2d',
            '--border-color': '#3e3e3e',
            '--sidebar-bg': '#252526',
            '--sidebar-header-bg': '#2d2d2d',
            '--sidebar-header-text': '#bbbbbb',
            '--list-hover-bg': '#2a2d2e',
            '--list-selected-bg': '#37373d',
            '--list-selected-text': '#ffffff',
            '--input-bg': '#3c3c3c',
            '--input-border': '#555',
            '--status-bar-bg': '#007acc',
            '--status-bar-text': 'white',
            '--icon-color': '#cccccc',
            '--icon-hover-bg': '#3e3e3e',
            '--editor-bg': '#151515', // Slightly darker than bg
            // Syntax
            '--syntax-functions': '#dcdcaa',
            '--syntax-commands': '#569CD6', // Blue (VS Code Dark+ style) to contrast with Magenta strings
            '--syntax-stringfuncs': '#4ec9b0',
            '--syntax-string': '#ce9178', // Fallback
            '--syntax-comment': '#808080', // Mid-Gray (Changed from Green #6a9955)
            '--syntax-number': '#b5cea8', // Fallback
            '--syntax-label': '#d7ba7d',
            '--syntax-operator': '#d4d4d4',
            '--syntax-type-integer': '#98C379', // Green
            '--syntax-type-float': '#D19A66',   // Orange
            '--syntax-type-string': '#C678DD',  // Magenta
            '--syntax-bracket-0': '#FFD700',
            '--syntax-bracket-1': '#DA70D6',
            '--syntax-bracket-2': '#1E90FF',
            // Memory Map
            '--mm-color-header': '#808080',
            '--mm-color-procedure': '#d33682',
            '--mm-color-datafile': '#268bd2',
            '--mm-color-diary': '#b58900',
            '--mm-color-comms': '#cb4b16',
            '--mm-color-sheet': '#859900',
            '--mm-color-pager': '#6c71c4',
            '--mm-color-notepad': '#2aa198',
            '--mm-color-block': '#d33682',
            '--mm-color-record': '#6c71c4',
            '--mm-color-unknown': '#dc322f',
            '--mm-color-unknown': '#dc322f',
            '--mm-color-free': '#073642',
            '--mm-bg': '#1e1e1e'
        },
        'light': {
            // UI Colors
            '--bg-color': '#ffffff',
            '--text-color': '#333333',
            '--toolbar-bg': '#f3f3f3',
            '--border-color': '#cccccc',
            '--sidebar-bg': '#f0f0f0',
            '--sidebar-header-bg': '#e0e0e0',
            '--sidebar-header-text': '#333333',
            '--list-hover-bg': '#e8e8e8',
            '--list-selected-bg': '#007acc',
            '--list-selected-text': '#ffffff',
            '--input-bg': '#ffffff',
            '--input-border': '#cccccc',
            '--status-bar-bg': '#007acc',
            '--status-bar-text': 'white',
            '--icon-color': '#666666',
            '--icon-hover-bg': '#e0e0e0',
            '--editor-bg': '#ffffff',
            // Syntax
            '--syntax-functions': '#795e26',
            '--syntax-commands': '#0000FF', // Blue to separate from Magenta strings
            '--syntax-stringfuncs': '#267f99',
            '--syntax-string': '#a31515', // Fallback
            '--syntax-comment': '#808080', // Mid-Gray (Changed from Green #008000)
            '--syntax-number': '#098658', // Fallback
            '--syntax-label': '#795e26',
            '--syntax-operator': '#000000',
            '--syntax-type-integer': '#098658', // Green (Existing number color)
            '--syntax-type-float': '#B06000',   // Dark Orange
            '--syntax-type-string': '#A020F0',  // Dark Magenta
            '--syntax-bracket-0': '#0000FF',
            '--syntax-bracket-1': '#800080',
            '--syntax-bracket-2': '#008000',
            // Memory Map
            '--mm-color-header': '#999999',
            '--mm-color-procedure': '#d33682',
            '--mm-color-datafile': '#268bd2',
            '--mm-color-diary': '#b58900',
            '--mm-color-comms': '#cb4b16',
            '--mm-color-sheet': '#859900',
            '--mm-color-pager': '#6c71c4',
            '--mm-color-notepad': '#2aa198',
            '--mm-color-block': '#d33682',
            '--mm-color-record': '#6c71c4',
            '--mm-color-unknown': '#dc322f',
            '--mm-color-unknown': '#dc322f',
            '--mm-color-free': '#eeeeee',
            '--mm-bg': '#ffffff'
        },
        'antigravity': {
            // UI Colors
            '--bg-color': '#0b0c15',
            '--text-color': '#e0e6ed',
            '--toolbar-bg': '#151725',
            '--border-color': '#2a2e3f',
            '--sidebar-bg': '#0f111a',
            '--sidebar-header-bg': '#151725',
            '--sidebar-header-text': '#a0a8b7',
            '--list-hover-bg': '#1e2230',
            '--list-selected-bg': '#3a3f55',
            '--list-selected-text': '#ffffff',
            '--input-bg': '#1a1d29',
            '--input-border': '#2a2e3f',
            '--status-bar-bg': '#7000ff',
            '--status-bar-text': 'white',
            '--icon-color': '#a0a8b7',
            '--icon-hover-bg': '#1e2230',
            '--editor-bg': '#050608',
            // Syntax
            '--syntax-functions': '#ff00ff',
            '--syntax-commands': '#00ffff',
            '--syntax-stringfuncs': '#ffff00',
            '--syntax-string': '#00ff00',
            '--syntax-comment': '#888888',
            '--syntax-number': '#ffaa00',
            '--syntax-label': '#ffffff',
            '--syntax-operator': '#ff0000',
            '--syntax-type-integer': '#00FF00', // Green
            '--syntax-type-float': '#FFAA00',   // Orange
            '--syntax-type-string': '#FF00FF',  // Magenta
            '--syntax-bracket-0': '#ff00ff',
            '--syntax-bracket-1': '#00ffff',
            '--syntax-bracket-2': '#ffff00',
            // Memory Map
            '--mm-color-header': '#555555',
            '--mm-color-procedure': '#ff00ff',
            '--mm-color-datafile': '#00ffff',
            '--mm-color-diary': '#ffff00',
            '--mm-color-comms': '#ffaa00',
            '--mm-color-sheet': '#00ff00',
            '--mm-color-pager': '#aa00ff',
            '--mm-color-notepad': '#00ffaa',
            '--mm-color-block': '#ff00ff',
            '--mm-color-record': '#aa00ff',
            '--mm-color-unknown': '#ff0000',
            '--mm-color-unknown': '#ff0000',
            '--mm-color-free': '#151725',
            '--mm-bg': '#0b0c15'
        },
        'monokai': {
            // UI Colors
            '--bg-color': '#272822',
            '--text-color': '#f8f8f2',
            '--toolbar-bg': '#1e1f1c',
            '--border-color': '#49483e',
            '--sidebar-bg': '#272822',
            '--sidebar-header-bg': '#1e1f1c',
            '--sidebar-header-text': '#f8f8f2',
            '--list-hover-bg': '#3e3d32',
            '--list-selected-bg': '#49483e',
            '--list-selected-text': '#f8f8f2',
            '--input-bg': '#3e3d32',
            '--input-border': '#49483e',
            '--status-bar-bg': '#f92672',
            '--status-bar-text': 'white',
            '--icon-color': '#f8f8f2',
            '--icon-hover-bg': '#3e3d32',
            '--editor-bg': '#272822',
            // Syntax
            '--syntax-functions': '#A6E22E', // Green (Changed from Blue to distinguish from Commands)
            '--syntax-commands': '#66d9ef', // Blue (Changed from Pink to avoid String clash)
            '--syntax-stringfuncs': '#a6e22e',
            '--syntax-string': '#e6db74',
            '--syntax-comment': '#75715e',
            '--syntax-number': '#ae81ff',
            '--syntax-label': '#fd971f',
            '--syntax-operator': '#f8f8f2',
            '--syntax-type-integer': '#A6E22E', // Green
            '--syntax-type-float': '#FD971F',   // Orange
            '--syntax-type-string': '#F92672',  // Pink/Magenta
            '--syntax-bracket-0': '#f8f8f2',
            '--syntax-bracket-1': '#66d9ef',
            '--syntax-bracket-2': '#a6e22e',
            // Memory Map
            '--mm-color-header': '#75715e',
            '--mm-color-procedure': '#f92672',
            '--mm-color-datafile': '#66d9ef',
            '--mm-color-diary': '#fd971f',
            '--mm-color-comms': '#ae81ff',
            '--mm-color-sheet': '#a6e22e',
            '--mm-color-pager': '#f92672',
            '--mm-color-notepad': '#e6db74',
            '--mm-color-block': '#f92672',
            '--mm-color-record': '#f92672',
            '--mm-color-unknown': '#f8f8f2',
            '--mm-color-unknown': '#f8f8f2',
            '--mm-color-free': '#272822',
            '--mm-bg': '#272822'
        },
        'solarized-dark': {
            // UI Colors
            '--bg-color': '#002b36',
            '--text-color': '#839496',
            '--toolbar-bg': '#073642',
            '--border-color': '#586e75',
            '--sidebar-bg': '#073642',
            '--sidebar-header-bg': '#002b36',
            '--sidebar-header-text': '#93a1a1',
            '--list-hover-bg': '#586e75',
            '--list-selected-bg': '#657b83',
            '--list-selected-text': '#fdf6e3',
            '--input-bg': '#073642',
            '--input-border': '#586e75',
            '--status-bar-bg': '#268bd2',
            '--status-bar-text': 'white',
            '--icon-color': '#839496',
            '--icon-hover-bg': '#586e75',
            '--editor-bg': '#002b36',
            // Syntax
            '--syntax-functions': '#268bd2',
            '--syntax-commands': '#268bd2', // Blue (Changed from Green to avoid Integer clash)
            '--syntax-stringfuncs': '#2aa198',
            '--syntax-string': '#2aa198',
            '--syntax-comment': '#586e75',
            '--syntax-number': '#d33682',
            '--syntax-label': '#cb4b16',
            '--syntax-operator': '#93a1a1',
            '--syntax-type-integer': '#859900', // Green
            '--syntax-type-float': '#cb4b16',   // Orange
            '--syntax-type-string': '#d33682',  // Magenta
            '--syntax-bracket-0': '#93a1a1',
            '--syntax-bracket-1': '#268bd2',
            '--syntax-bracket-2': '#2aa198',
            // Memory Map
            '--mm-color-header': '#586e75',
            '--mm-color-procedure': '#d33682',
            '--mm-color-datafile': '#268bd2',
            '--mm-color-diary': '#b58900',
            '--mm-color-comms': '#cb4b16',
            '--mm-color-sheet': '#859900',
            '--mm-color-pager': '#6c71c4',
            '--mm-color-notepad': '#2aa198',
            '--mm-color-block': '#d33682',
            '--mm-color-record': '#6c71c4',
            '--mm-color-unknown': '#dc322f',
            '--mm-color-unknown': '#dc322f',
            '--mm-color-free': '#073642',
            '--mm-bg': '#002b36'
        },
        'solarized-light': {
            // UI Colors
            '--bg-color': '#fdf6e3',
            '--text-color': '#657b83',
            '--toolbar-bg': '#eee8d5',
            '--border-color': '#93a1a1',
            '--sidebar-bg': '#eee8d5',
            '--sidebar-header-bg': '#fdf6e3',
            '--sidebar-header-text': '#586e75',
            '--list-hover-bg': '#93a1a1',
            '--list-selected-bg': '#586e75',
            '--list-selected-text': '#fdf6e3',
            '--input-bg': '#fdf6e3',
            '--input-border': '#93a1a1',
            '--status-bar-bg': '#268bd2',
            '--status-bar-text': 'white',
            '--icon-color': '#657b83',
            '--icon-hover-bg': '#93a1a1',
            '--editor-bg': '#fdf6e3',
            // Syntax
            '--syntax-functions': '#268bd2',
            '--syntax-commands': '#268bd2', // Blue
            '--syntax-stringfuncs': '#2aa198',
            '--syntax-string': '#2aa198',
            '--syntax-comment': '#93a1a1',
            '--syntax-number': '#d33682',
            '--syntax-label': '#cb4b16',
            '--syntax-operator': '#586e75',
            '--syntax-type-integer': '#859900', // Green
            '--syntax-type-float': '#cb4b16',   // Orange
            '--syntax-type-string': '#d33682',  // Magenta
            '--syntax-bracket-0': '#586e75',
            '--syntax-bracket-1': '#268bd2',
            '--syntax-bracket-2': '#2aa198',
            // Memory Map
            '--mm-color-header': '#93a1a1',
            '--mm-color-procedure': '#d33682',
            '--mm-color-datafile': '#268bd2',
            '--mm-color-diary': '#b58900',
            '--mm-color-comms': '#cb4b16',
            '--mm-color-sheet': '#859900',
            '--mm-color-pager': '#6c71c4',
            '--mm-color-notepad': '#2aa198',
            '--mm-color-block': '#d33682',
            '--mm-color-record': '#6c71c4',
            '--mm-color-unknown': '#dc322f',
            '--mm-color-unknown': '#dc322f',
            '--mm-color-free': '#fdf6e3',
            '--mm-bg': '#fdf6e3'
        },
        'dracula': {
            // UI Colors
            '--bg-color': '#282a36',
            '--text-color': '#f8f8f2',
            '--toolbar-bg': '#44475a',
            '--border-color': '#6272a4',
            '--sidebar-bg': '#21222c',
            '--sidebar-header-bg': '#44475a',
            '--sidebar-header-text': '#f8f8f2',
            '--list-hover-bg': '#44475a',
            '--list-selected-bg': '#6272a4',
            '--list-selected-text': '#f8f8f2',
            '--input-bg': '#44475a',
            '--input-border': '#6272a4',
            '--status-bar-bg': '#bd93f9',
            '--status-bar-text': '#282a36',
            '--icon-color': '#f8f8f2',
            '--icon-hover-bg': '#44475a',
            '--editor-bg': '#282a36',
            // Syntax
            '--syntax-functions': '#50fa7b',
            '--syntax-commands': '#8be9fd', // Cyan (Changed from Pink to avoid String clash)
            '--syntax-stringfuncs': '#8be9fd',
            '--syntax-string': '#f1fa8c',
            '--syntax-comment': '#6272a4',
            '--syntax-number': '#bd93f9',
            '--syntax-label': '#ffb86c',
            '--syntax-operator': '#f8f8f2',
            '--syntax-type-integer': '#50fa7b', // Green
            '--syntax-type-float': '#ffb86c',   // Orange
            '--syntax-type-string': '#ff79c6',  // Pink
            '--syntax-bracket-0': '#f8f8f2',
            '--syntax-bracket-1': '#8be9fd',
            '--syntax-bracket-2': '#50fa7b',
            // Memory Map
            '--mm-color-header': '#6272a4',
            '--mm-color-procedure': '#ff79c6',
            '--mm-color-datafile': '#8be9fd',
            '--mm-color-diary': '#f1fa8c',
            '--mm-color-comms': '#ffb86c',
            '--mm-color-sheet': '#50fa7b',
            '--mm-color-pager': '#bd93f9',
            '--mm-color-notepad': '#8be9fd',
            '--mm-color-block': '#ff79c6',
            '--mm-color-record': '#bd93f9',
            '--mm-color-unknown': '#ff5555',
            '--mm-color-unknown': '#ff5555',
            '--mm-color-free': '#282a36',
            '--mm-bg': '#282a36'
        },
        'nord': {
            // UI Colors
            '--bg-color': '#2e3440',
            '--text-color': '#d8dee9',
            '--toolbar-bg': '#3b4252',
            '--border-color': '#4c566a',
            '--sidebar-bg': '#2e3440',
            '--sidebar-header-bg': '#3b4252',
            '--sidebar-header-text': '#d8dee9',
            '--list-hover-bg': '#434c5e',
            '--list-selected-bg': '#4c566a',
            '--list-selected-text': '#eceff4',
            '--input-bg': '#3b4252',
            '--input-border': '#4c566a',
            '--status-bar-bg': '#88c0d0',
            '--status-bar-text': '#2e3440',
            '--icon-color': '#d8dee9',
            '--icon-hover-bg': '#434c5e',
            '--editor-bg': '#2e3440',
            // Syntax
            '--syntax-functions': '#88c0d0',
            '--syntax-commands': '#81a1c1',
            '--syntax-stringfuncs': '#8fbcbb',
            '--syntax-string': '#a3be8c',
            '--syntax-comment': '#4c566a',
            '--syntax-number': '#b48ead',
            '--syntax-label': '#ebcb8b',
            '--syntax-operator': '#d8dee9',
            '--syntax-type-integer': '#a3be8c', // Green
            '--syntax-type-float': '#d08770',   // Orange
            '--syntax-type-string': '#b48ead',  // Purple
            '--syntax-bracket-0': '#d8dee9',
            '--syntax-bracket-1': '#88c0d0',
            '--syntax-bracket-2': '#8fbcbb',
            // Memory Map
            '--mm-color-header': '#4c566a',
            '--mm-color-procedure': '#b48ead',
            '--mm-color-datafile': '#88c0d0',
            '--mm-color-diary': '#ebcb8b',
            '--mm-color-comms': '#d08770',
            '--mm-color-sheet': '#a3be8c',
            '--mm-color-pager': '#5e81ac',
            '--mm-color-notepad': '#8fbcbb',
            '--mm-color-block': '#b48ead',
            '--mm-color-record': '#5e81ac',
            '--mm-color-unknown': '#bf616a',
            '--mm-color-unknown': '#bf616a',
            '--mm-color-free': '#2e3440',
            '--mm-bg': '#2e3440'
        },
        'high-contrast': {
            // UI Colors
            '--bg-color': '#000000',
            '--text-color': '#ffffff',
            '--toolbar-bg': '#000000',
            '--border-color': '#ffffff',
            '--sidebar-bg': '#000000',
            '--sidebar-header-bg': '#000000',
            '--sidebar-header-text': '#ffffff',
            '--list-hover-bg': '#333333',
            '--list-selected-bg': '#ffffff',
            '--list-selected-text': '#000000',
            '--input-bg': '#000000',
            '--input-border': '#ffffff',
            '--status-bar-bg': '#000000',
            '--status-bar-text': '#ffffff',
            '--icon-color': '#ffffff',
            '--icon-hover-bg': '#333333',
            // Syntax
            '--syntax-functions': '#ffff00',
            '--syntax-commands': '#00ffff', // Cyan
            '--syntax-stringfuncs': '#00ff00',
            '--syntax-string': '#ff0000',
            '--syntax-comment': '#00ff00',
            '--syntax-number': '#ffffff',
            '--syntax-label': '#ffffff',
            '--syntax-operator': '#ffffff',
            '--syntax-type-integer': '#00ff00', // Green
            '--syntax-type-float': '#ffaa00',   // Orange
            '--syntax-type-string': '#ff00ff',  // Magenta
            '--syntax-bracket-0': '#ffffff',
            '--syntax-bracket-1': '#ffff00',
            '--syntax-bracket-2': '#00ff00',
            // Memory Map
            '--mm-color-header': '#ffffff',
            '--mm-color-procedure': '#ff00ff',
            '--mm-color-datafile': '#00ffff',
            '--mm-color-diary': '#ffff00',
            '--mm-color-comms': '#ff0000',
            '--mm-color-sheet': '#00ff00',
            '--mm-color-pager': '#0000ff',
            '--mm-color-notepad': '#00ff00',
            '--mm-color-block': '#ff00ff',
            '--mm-color-record': '#0000ff',
            '--mm-color-unknown': '#ff0000',
            '--mm-color-unknown': '#ff0000',
            '--mm-color-free': '#000000',
            '--mm-bg': '#000000'
        },
        'synthwave-84': {
            // UI Colors
            '--bg-color': '#2b213a',
            '--text-color': '#ffffff',
            '--toolbar-bg': '#241b2f',
            '--border-color': '#4a3b5a',
            '--sidebar-bg': '#241b2f',
            '--sidebar-header-bg': '#2b213a',
            '--sidebar-header-text': '#ff7edb',
            '--list-hover-bg': '#3a2e4d',
            '--list-selected-bg': '#4a3b5a',
            '--list-selected-text': '#36f9f6',
            '--input-bg': '#3a2e4d',
            '--input-border': '#ff7edb',
            '--status-bar-bg': '#36f9f6',
            '--status-bar-text': '#2b213a',
            '--icon-color': '#ff7edb',
            '--icon-hover-bg': '#3a2e4d',
            // Syntax
            '--syntax-functions': '#36f9f6',
            '--syntax-commands': '#36f9f6', // Cyan (Changed from Pink)
            '--syntax-stringfuncs': '#fdfdfd',
            '--syntax-string': '#ff7edb',
            '--syntax-comment': '#6d75a1',
            '--syntax-number': '#f97e72',
            '--syntax-label': '#fe4450',
            '--syntax-operator': '#f92aad',
            '--syntax-type-integer': '#2de2a6', // Neon Green (Changed from Cyan to prevent clash)
            '--syntax-type-float': '#f97e72',   // Orange/Red
            '--syntax-type-string': '#f92aad',  // Pink
            '--syntax-bracket-0': '#f92aad',
            '--syntax-bracket-1': '#36f9f6',
            '--syntax-bracket-2': '#f97e72',
            // Memory Map
            '--mm-color-header': '#6d75a1',
            '--mm-color-procedure': '#f92aad',
            '--mm-color-datafile': '#36f9f6',
            '--mm-color-diary': '#ff7edb',
            '--mm-color-comms': '#f97e72',
            '--mm-color-sheet': '#fe4450',
            '--mm-color-pager': '#f92aad',
            '--mm-color-notepad': '#36f9f6',
            '--mm-color-block': '#f92aad',
            '--mm-color-record': '#f97e72',
            '--mm-color-unknown': '#ffffff',
            '--mm-color-unknown': '#ffffff',
            '--mm-color-free': '#2b213a',
            '--mm-bg': '#2b213a'
        },
        'gruvbox-dark': {
            // UI Colors
            '--bg-color': '#282828',
            '--text-color': '#ebdbb2',
            '--toolbar-bg': '#3c3836',
            '--border-color': '#504945',
            '--sidebar-bg': '#3c3836',
            '--sidebar-header-bg': '#504945',
            '--sidebar-header-text': '#fabd2f',
            '--list-hover-bg': '#504945',
            '--list-selected-bg': '#665c54',
            '--list-selected-text': '#ebdbb2',
            '--input-bg': '#3c3836',
            '--input-border': '#665c54',
            '--status-bar-bg': '#fabd2f',
            '--status-bar-text': '#282828',
            '--icon-color': '#ebdbb2',
            '--icon-hover-bg': '#504945',
            // Syntax
            '--syntax-functions': '#8ec07c',
            '--syntax-commands': '#458588', // Blue (Changed from Red to avoid float clash?) No red is fine, but string is green/yellow.
            '--syntax-stringfuncs': '#fabd2f',
            '--syntax-string': '#b8bb26',
            '--syntax-comment': '#928374',
            '--syntax-number': '#d3869b',
            '--syntax-label': '#fe8019',
            '--syntax-operator': '#d5c4a1',
            '--syntax-type-integer': '#b8bb26', // Green
            '--syntax-type-float': '#fe8019',   // Orange
            '--syntax-type-string': '#d3869b',  // Purple
            '--syntax-bracket-0': '#fb4934',
            '--syntax-bracket-1': '#8ec07c',
            '--syntax-bracket-2': '#fabd2f',
            // Memory Map
            '--mm-color-header': '#928374',
            '--mm-color-procedure': '#fb4934',
            '--mm-color-datafile': '#83a598',
            '--mm-color-diary': '#fabd2f',
            '--mm-color-comms': '#d3869b',
            '--mm-color-sheet': '#b8bb26',
            '--mm-color-pager': '#fe8019',
            '--mm-color-notepad': '#8ec07c',
            '--mm-color-block': '#fb4934',
            '--mm-color-record': '#fe8019',
            '--mm-color-unknown': '#cc241d',
            '--mm-color-unknown': '#cc241d',
            '--mm-color-free': '#282828',
            '--mm-bg': '#282828'
        },
        'atom-one-dark': {
            // UI Colors
            '--bg-color': '#282c34',
            '--text-color': '#abb2bf',
            '--toolbar-bg': '#21252b',
            '--border-color': '#181a1f',
            '--sidebar-bg': '#21252b',
            '--sidebar-header-bg': '#282c34',
            '--sidebar-header-text': '#98c379',
            '--list-hover-bg': '#2c313a',
            '--list-selected-bg': '#3e4451',
            '--list-selected-text': '#ffffff',
            '--input-bg': '#2c313a',
            '--input-border': '#181a1f',
            '--status-bar-bg': '#61afef',
            '--status-bar-text': '#282c34',
            '--icon-color': '#abb2bf',
            '--icon-hover-bg': '#2c313a',
            // Syntax
            '--syntax-functions': '#61afef',
            '--syntax-commands': '#56b6c2', // Cyan (Changed from Purple to avoid String clash)
            '--syntax-stringfuncs': '#e5c07b',
            '--syntax-string': '#98c379',
            '--syntax-comment': '#5c6370',
            '--syntax-number': '#d19a66',
            '--syntax-label': '#e06c75',
            '--syntax-operator': '#56b6c2',
            '--syntax-type-integer': '#98c379', // Green
            '--syntax-type-float': '#d19a66',   // Orange
            '--syntax-type-string': '#c678dd',  // Purple
            '--syntax-bracket-0': '#e06c75',
            '--syntax-bracket-1': '#61afef',
            '--syntax-bracket-2': '#e5c07b',
            // Memory Map
            '--mm-color-header': '#5c6370',
            '--mm-color-procedure': '#c678dd',
            '--mm-color-datafile': '#61afef',
            '--mm-color-diary': '#e5c07b',
            '--mm-color-comms': '#d19a66',
            '--mm-color-sheet': '#98c379',
            '--mm-color-pager': '#e06c75',
            '--mm-color-notepad': '#56b6c2',
            '--mm-color-block': '#c678dd',
            '--mm-color-record': '#e06c75',
            '--mm-color-unknown': '#be5046',
            '--mm-color-unknown': '#be5046',
            '--mm-color-free': '#282c34',
            '--mm-bg': '#282c34'
        }
    },

    baseThemes: {
        'dark': 'dark',
        'light': 'light',
        'antigravity': 'dark',
        'monokai': 'dark',
        'solarized-dark': 'dark',
        'solarized-light': 'light',
        'dracula': 'dark',
        'nord': 'dark',
        'high-contrast': 'dark',
        'synthwave-84': 'dark',
        'gruvbox-dark': 'dark',
        'atom-one-dark': 'dark'
    },

    applyTheme: function (theme) {

        var baseTheme = this.baseThemes[theme];
        if (!baseTheme) {
            if (theme === 'custom1' || theme === 'custom2') baseTheme = 'dark'; // Default custom to dark base
            else baseTheme = 'dark';
        }
        document.documentElement.setAttribute('data-theme', baseTheme);

        // Apply syntax highlighting variables
        var defs = this.themeDefinitions[theme] || this.themeDefinitions['dark'];

        // Check for user overrides
        var overrides = OptionsManager.getOption('themeOverrides') || {};
        var themeOverrides = overrides[theme] || {};

        // Merge defaults with overrides
        for (var key in defs) {
            var value = themeOverrides[key] || defs[key];
            document.documentElement.style.setProperty(key, value);

            // Auto-generate RGB variables for transparency support
            // e.g. --bg-color -> --bg-color-rgb: 30, 30, 30
            if (value && value.startsWith('#')) {
                var hex = value.substring(1);
                if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
                if (hex.length === 6) {
                    var r = parseInt(hex.substring(0, 2), 16);
                    var g = parseInt(hex.substring(2, 4), 16);
                    var b = parseInt(hex.substring(4, 6), 16);
                    document.documentElement.style.setProperty(key + '-rgb', r + ', ' + g + ', ' + b);
                }
            }
        }

        // Dispatch event for other components (like editor) to update if needed
        var event = new CustomEvent('themeChanged', { detail: { theme: theme } });
        window.dispatchEvent(event);
    },

    getThemeDefinition: function (theme) {
        // Support custom themes requiring overrides even if no base definition exists
        var defs = this.themeDefinitions[theme] || this.themeDefinitions['dark'];

        // Use empty base for custom themes to ensure we only use the overrides + base defaults if needed
        if (theme === 'custom1' || theme === 'custom2') {
            // For custom themes, start with the 'dark' theme as a fallback base
            defs = this.themeDefinitions['dark'];
        }

        var overrides = OptionsManager.getOption('themeOverrides') || {};
        var themeOverrides = overrides[theme] || {};

        // Return merged object
        var result = {};
        for (var key in defs) {
            result[key] = themeOverrides[key] || defs[key];
        }
        return result;
    },

    setThemeDefinition: function (theme, definition) {
        var overrides = OptionsManager.getOption('themeOverrides') || {};
        overrides[theme] = definition;
        OptionsManager.setOption('themeOverrides', overrides);

        if (this.currentTheme === theme) {
            this.applyTheme(theme);
        }
    },

    getAvailableThemes: function () {
        var themes = [];
        // Defaults
        for (var key in this.themeDefinitions) {
            themes.push({ key: key, name: this.formatThemeName(key) });
        }

        // Custom Themes (from Options)
        var customNames = OptionsManager.getOption('customThemeNames') || {};
        if (customNames['custom1']) themes.push({ key: 'custom1', name: customNames['custom1'] });
        else themes.push({ key: 'custom1', name: 'Custom Theme 1' });

        if (customNames['custom2']) themes.push({ key: 'custom2', name: customNames['custom2'] });
        else themes.push({ key: 'custom2', name: 'Custom Theme 2' });

        return themes.sort((a, b) => a.name.localeCompare(b.name));
    },

    formatThemeName: function (key) {
        return key.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    },

    resetAll: function () {
        OptionsManager.setOption('themeOverrides', {});
        OptionsManager.setOption('customThemeNames', {});
        this.setTheme('dark'); // Default to dark
    },

    importTheme: function (sourceKey, targetKey, newName) {
        var sourceDef = this.getThemeDefinition(sourceKey);

        // Save Definition
        var overrides = OptionsManager.getOption('themeOverrides') || {};
        overrides[targetKey] = sourceDef;
        OptionsManager.setOption('themeOverrides', overrides);

        // Save Name
        if (newName) {
            var customNames = OptionsManager.getOption('customThemeNames') || {};
            customNames[targetKey] = newName;
            OptionsManager.setOption('customThemeNames', customNames);
        }

        // Apply if current
        if (this.currentTheme === targetKey) {
            this.applyTheme(targetKey);
        }
    },

    setThemeName: function (key, name) {
        var customNames = OptionsManager.getOption('customThemeNames') || {};
        customNames[key] = name;
        OptionsManager.setOption('customThemeNames', customNames);
    },

    updateThemeDefinition: function (theme, definition) {
        this.setThemeDefinition(theme, definition);
    }
};

// Initialize immediately
ThemeManager.init();
