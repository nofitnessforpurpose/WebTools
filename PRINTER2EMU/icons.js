// ==============================================================================
// Psion Printer 2 Web Emulator - Embedded Local Lucide SVG Icon Registry
// 100% Offline / Zero CDNs
// ==============================================================================

(function(root) {
    'use strict';

    const LUCIDE_ICONS = {
        "arrow-down": '<line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>',
        "arrow-down-long": '<line x1="12" y1="3" x2="12" y2="21"/><polyline points="19 14 12 21 5 14"/>',
        "arrow-up": '<line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>',
        "book-open": '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
        "bluetooth": '<path d="m7 7 10 10-5 5V2l5 5L7 17"/>',
        "bluetooth-connected": '<path d="m7 7 10 10-5 5V2l5 5L7 17"/><line x1="18" y1="12" x2="21" y2="12"/><line x1="3" y1="12" x2="6" y2="12"/>',
        "bluetooth-off": '<path d="m17 17-5 5V12l-5 5"/><path d="M2 2l20 20"/><path d="M14.5 9.5 17 7l-5-5v4.5"/>',
        "check": '<polyline points="20 6 9 17 4 12"/>',
        "chevron-down": '<polyline points="6 9 12 15 18 9"/>',
        "chevron-left": '<polyline points="15 18 9 12 15 6"/>',
        "chevron-right": '<polyline points="9 18 15 12 9 6"/>',
        "circle-check": '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
        "circle-info": '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
        "circle-x": '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>',
        "circle-half-stroke": '<circle cx="12" cy="12" r="10"/><path d="M12 18a6 6 0 0 0 0-12v12z"/>',
        "code": '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
        "compress": '<path d="M4 14h6v6"/><path d="M20 10h-6V4"/><path d="m14 10 7-7"/><path d="m3 21 7-7"/>',
        "copyright": '<circle cx="12" cy="12" r="10"/><path d="M14.83 14.83a4 4 0 1 1 0-5.66"/>',
        "copy": '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
        "download": '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
        "expand": '<path d="m21 21-6-6m6 6v-4.8m0 4.8h-4.8"/><path d="M3 16.2V21m0 0h4.8M3 21l6-6"/><path d="M21 7.8V3m0 0h-4.8M21 3l-6 6"/><path d="M3 7.8V3m0 0h4.8M3 3l6 6"/>',
        "file-down": '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6"/><path d="m9 15 3 3 3-3"/>',
        "file-check": '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><polyline points="14 2 14 8 20 8"/><path d="m9 15 2 2 4-4"/>',
        "file-export": '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><polyline points="14 2 14 8 20 8"/><path d="M12 12v6"/><path d="m9 15 3-3 3 3"/>',
        "keyboard": '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="M6 8h.001"/><path d="M10 8h.001"/><path d="M14 8h.001"/><path d="M18 8h.001"/><path d="M8 12h.001"/><path d="M12 12h.001"/><path d="M16 12h.001"/><path d="M7 16h10"/>',
        "moon": '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
        "palette": '<circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.563-2.512 5.563-5.563C22 6.5 17.5 2 12 2Z"/>',
        "play": '<polygon points="6 3 20 12 6 21 6 3"/>',
        "plug": '<path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8z"/>',
        "plug-circle-check": '<path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8z"/><path d="m9 14 2 2 4-4"/>',
        "unlink": '<path d="m18.8 15.6 1.8-1.8a5 5 0 0 0-7.07-7.07l-1.8 1.8"/><path d="M12 12l-1-1"/><path d="m5.2 8.4-1.8 1.8a5 5 0 0 0 7.07 7.07l1.8-1.8"/><line x1="2" y1="2" x2="22" y2="22"/>',
        "print": '<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/>',
        "rotate-ccw": '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
        "scale": '<path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>',
        "settings": '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
        "sliders": '<line x1="4" x2="4" y1="21" y2="14"/><line x1="4" x2="4" y1="10" y2="3"/><line x1="12" x2="12" y1="21" y2="12"/><line x1="12" x2="12" y1="8" y2="3"/><line x1="20" x2="20" y1="21" y2="16"/><line x1="20" x2="20" y1="12" y2="3"/><line x1="1" x2="7" y1="14" y2="14"/><line x1="9" x2="15" y1="8" y2="8"/><line x1="17" x2="23" y1="16" y2="16"/>',
        "sun": '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
        "thumbs-up": '<path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"/>',
        "trash-can": '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>',
        "alert-triangle": '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/>',
        "vial": '<path d="M10 2v7.31"/><path d="M14 9.3V2"/><path d="M8.5 2h7"/><path d="M14 9.3a6.5 6.5 0 1 1-4 0"/><path d="M5.52 16h12.96"/>',
        "xmark": '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'
    };

    // Alias mapping for Font Awesome names and common variations
    const ICON_ALIASES = {
        "fa-arrow-down": "arrow-down",
        "fa-arrow-down-long": "arrow-down-long",
        "fa-arrow-rotate-left": "rotate-ccw",
        "arrow-rotate-left": "rotate-ccw",
        "fa-arrow-up": "arrow-up",
        "fa-book-open": "book-open",
        "bluetooth": "bluetooth",
        "fa-bluetooth": "bluetooth",
        "fa-bluetooth-b": "bluetooth",
        "bluetooth-connected": "bluetooth-connected",
        "bluetooth-off": "bluetooth-off",
        "fa-check": "check",
        "fa-chevron-down": "chevron-down",
        "fa-chevron-left": "chevron-left",
        "fa-chevron-right": "chevron-right",
        "fa-circle-check": "circle-check",
        "fa-circle-half-stroke": "circle-half-stroke",
        "contrast": "circle-half-stroke",
        "fa-circle-info": "circle-info",
        "fa-info-circle": "circle-info",
        "info": "circle-info",
        "fa-circle-xmark": "circle-x",
        "circle-xmark": "circle-x",
        "fa-code": "code",
        "fa-compress": "compress",
        "fa-copy": "copy",
        "fa-download": "download",
        "fa-expand": "expand",
        "fa-file-arrow-down": "file-down",
        "file-arrow-down": "file-down",
        "fa-file-circle-check": "file-check",
        "file-circle-check": "file-check",
        "fa-file-export": "file-export",
        "fa-gears": "settings",
        "gears": "settings",
        "fa-keyboard": "keyboard",
        "fa-moon": "moon",
        "fa-palette": "palette",
        "fa-play": "play",
        "fa-plug": "plug",
        "fa-plug-circle-check": "plug-circle-check",
        "fa-plug-circle-xmark": "unlink",
        "plug-circle-xmark": "unlink",
        "fa-unlink": "unlink",
        "fa-print": "print",
        "printer": "print",
        "fa-sliders": "sliders",
        "fa-sun": "sun",
        "fa-thumbs-up": "thumbs-up",
        "fa-trash-can": "trash-can",
        "trash": "trash-can",
        "fa-triangle-exclamation": "alert-triangle",
        "triangle-exclamation": "alert-triangle",
        "fa-exclamation-triangle": "alert-triangle",
        "exclamation-triangle": "alert-triangle",
        "fa-vial": "vial",
        "fa-xmark": "xmark",
        "x": "xmark"
    };

    function resolveIconName(name) {
        if (!name) return "";
        let clean = name.trim().toLowerCase();
        // Strip fa-solid fa- prefix if present
        clean = clean.replace(/^fa-solid\s+/, '').replace(/^fa-/, '');
        return ICON_ALIASES[clean] || ICON_ALIASES[`fa-${clean}`] || clean;
    }

    function getIconSvg(rawName, extraClass = "") {
        const iconName = resolveIconName(rawName);
        const innerContent = LUCIDE_ICONS[iconName] || '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>';
        return `<svg class="lucide lucide-${iconName} ${extraClass}" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${innerContent}</svg>`;
    }

    function renderIcons(container) {
        const rootNode = container || (typeof document !== 'undefined' ? document : null);
        if (!rootNode || !rootNode.querySelectorAll) return;

        // 1. Elements with data-lucide or data-icon
        const elements = rootNode.querySelectorAll('[data-lucide], [data-icon]');
        elements.forEach(el => {
            const rawName = el.getAttribute('data-lucide') || el.getAttribute('data-icon');
            el.innerHTML = getIconSvg(rawName);
        });

        // 2. Elements with Font Awesome classes (for backwards compatibility)
        const faElements = rootNode.querySelectorAll('i[class*="fa-"]');
        faElements.forEach(el => {
            // Find specific fa- icon class
            const classes = Array.from(el.classList);
            const iconClass = classes.find(c => c.startsWith('fa-') && c !== 'fa-solid' && c !== 'fa-regular' && c !== 'fa-brands');
            if (iconClass) {
                el.innerHTML = getIconSvg(iconClass);
            }
        });
    }

    function setIcon(el, rawName) {
        if (!el) return;
        el.innerHTML = getIconSvg(rawName);
    }

    // Export to global scope
    root.LUCIDE_ICONS = LUCIDE_ICONS;
    root.renderIcons = renderIcons;
    root.getIconSvg = getIconSvg;
    root.setIcon = setIcon;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { LUCIDE_ICONS, renderIcons, getIconSvg, setIcon };
    }

    // Auto-render on DOMContentLoaded
    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => renderIcons());
        } else {
            renderIcons();
        }
    }

})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
