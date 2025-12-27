'use strict';

/**
 * KeyTemplate Component
 * Displays a visual guide for Function Key mappings in a modal.
 */
var KeyTemplate = (function () {

    function show() {
        var content = document.createElement('div');
        content.style.textAlign = 'center';

        // Styles for the key visual
        var style = document.createElement('style');
        style.innerHTML = `
            .key-group {
                display: inline-block;
                margin: 5px;
                padding: 10px;
                border-radius: 5px;
                vertical-align: top;
            }
            .key-group h4 {
                margin: 0 0 5px 0;
                font-size: 12px;
                color: #555;
                text-transform: uppercase;
            }
            .key-item {
                display: flex;
                align-items: center;
                margin-bottom: 5px;
                font-size: 13px;
                text-align: left;
            }
            .key-badge {
                display: inline-block;
                width: 30px;
                background: #333;
                color: white;
                text-align: center;
                border-radius: 3px;
                padding: 2px 0;
                margin-right: 8px;
                font-family: monospace;
                font-weight: bold;
            }
            /* Pastel Colors */
            .group-file { background-color: #e3f2fd; border: 1px solid #90caf9; }
            .group-item { background-color: #e8f5e9; border: 1px solid #a5d6a7; }
            .group-edit { background-color: #fff3e0; border: 1px solid #ffcc80; }
            .group-sys  { background-color: #f3e5f5; border: 1px solid #ce93d8; }
            
            /* Dark Mode Overrides (handled partially by existing modal styles, but backgrounds need adjustment) */
            /* We'll stick to pastel for the "Template" look, even in dark mode, as it mimics physical paper */
        `;
        content.appendChild(style);

        var html = "<h3>Function Key Shortcuts</h3>";
        html += "<div style='display: flex; flex-wrap: wrap; justify-content: center;'>";

        // File Operations
        html += `
            <div class="key-group group-file">
                <h4>File</h4>
                <div class="key-item"><span class="key-badge">F2</span> New Pack</div>
                <div class="key-item"><span class="key-badge">F3</span> Open Pack</div>
                <div class="key-item"><span class="key-badge">F4</span> Save Pack</div>
            </div>
        `;

        // Item Operations
        html += `
            <div class="key-group group-item">
                <h4>Item</h4>
                <div class="key-item"><span class="key-badge">F5</span> Add Item</div>
                <div class="key-item"><span class="key-badge">F6</span> Delete Item</div>
                <div class="key-item"><span class="key-badge">F7</span> Import Item</div>
                <div class="key-item"><span class="key-badge">F8</span> Export Hex</div>
            </div>
        `;

        // Edit Operations
        html += `
            <div class="key-group group-edit">
                <h4>Edit</h4>
                <div class="key-item"><span class="key-badge">F9</span> Apply</div>
                <div class="key-item"><span class="key-badge">F10</span> Discard</div>
            </div>
        `;

        // System Operations
        html += `
            <div class="key-group group-sys">
                <h4>System</h4>
                <div class="key-item"><span class="key-badge">F11</span> Options</div>
                <div class="key-item"><span class="key-badge">F12</span> Template</div>
            </div>
        `;

        html += "</div>";
        html += "<div style='margin-top: 15px; font-size: 11px; color: #888;'>Pro Tip: Print the template from the Help menu (coming soon) to stick on your keyboard!</div>";

        var wrapper = document.createElement('div');
        wrapper.innerHTML = html;
        content.appendChild(wrapper);

        var dialog = new ModalDialog(content, null);
        dialog.start();
    }

    return {
        show: show
    };
})();
