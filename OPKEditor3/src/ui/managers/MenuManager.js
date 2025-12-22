'use strict';

/**
 * MenuManager
 * -----------
 * Handles dropdown menu registration, population, and lifecycle.
 */
var MenuManager = {
    registeredMenus: [],

    init: function () {
        // Global Click Listener for Menus
        window.addEventListener('click', (e) => {
            this.closeAllMenus();
        });

        // Register Menus
        this.registerMenu('btn-file-menu', 'file-dropdown', this.populateFileMenu.bind(this));
        this.registerMenu('btn-help', 'help-dropdown');

        // Static New Menu Handlers
        this.setupStaticListeners();
    },

    registerMenu: function (buttonId, menuId, onOpenCallback) {
        var btn = document.getElementById(buttonId);
        var menu = document.getElementById(menuId);

        if (btn && menu) {
            var menuObj = {
                id: menuId,
                btn: btn,
                menu: menu,
                onOpen: onOpenCallback
            };

            this.registeredMenus.push(menuObj);

            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleMenu(menuId);
            });

            // Prevent clicks inside menu from closing it immediately
            menu.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }
    },

    toggleMenu: function (menuId) {
        this.registeredMenus.forEach((m) => {
            if (m.id === menuId) {
                var isOpening = !m.menu.classList.contains('show');

                if (isOpening) {
                    m.menu.classList.add('show');
                    m.btn.classList.add('active');
                    if (m.onOpen) m.onOpen();

                    // Auto-focus first enabled item
                    setTimeout(() => {
                        var firstLink = m.menu.querySelector('a:not(.disabled)');
                        if (firstLink) firstLink.focus();
                    }, 0);
                } else {
                    m.menu.classList.remove('show');
                    m.btn.classList.remove('active');
                }
            } else {
                m.menu.classList.remove('show');
                m.btn.classList.remove('active');
            }
        });
    },

    closeAllMenus: function () {
        this.registeredMenus.forEach((m) => {
            m.menu.classList.remove('show');
            m.btn.classList.remove('active');
        });
    },

    setupStaticListeners: function () {
        // This links to functions that will eventually be in other Managers
        // For now they are global or will be moved.

        var setupBtn = (id, callback) => {
            var el = document.getElementById(id);
            if (el) {
                el.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (el.classList.contains('disabled')) return;
                    callback(e);
                    this.closeAllMenus();
                });
            }
        };

        setupBtn('menu-new-pack', (e) => createNew(e));
        setupBtn('menu-new-proc', () => {
            var data = [0x00, 0x00, 0x00, 0x0A, 80, 82, 79, 67, 78, 65, 77, 69, 58, 0];
            createBlockFile(data, "PROCNAME", 3);
        });
        setupBtn('menu-new-notepad', () => {
            var data = [0x00, 0x02, 8, 0, 0x00, 0x09, 78, 79, 84, 69, 80, 65, 68, 58, 0];
            createBlockFile(data, "NOTEPAD", 7);
        });
        setupBtn('menu-new-datafile', () => {
            var id = getFreeFileId();
            if (id > 0) {
                var hdritem = createFileHeader("DATAFILE", 1, id + 0x8f);
                addItemToPack(hdritem);
                updateInventory();
            }
        });

        setupBtn('menu-open-pack', () => {
            var fileInputPack = document.getElementById('file-input-pack');
            if (fileInputPack) fileInputPack.click();
        });
        setupBtn('menu-import-item', () => {
            var fileInputItem = document.getElementById('file-input-item');
            if (fileInputItem) fileInputItem.click();
        });

        setupBtn('menu-save-pack', () => packSaved());
        setupBtn('menu-export-hex', () => exportHex());
        setupBtn('menu-export-item', () => exportCurrentItem());

        setupBtn('menu-opl-ref', () => {
            if (typeof OPLCommandReference !== 'undefined') {
                new OPLCommandReference().open();
            }
        });
        setupBtn('menu-about', () => showAboutDialog());
    },

    populateFileMenu: function () {
        // Reliant on AppStore state
        var packOpen = (AppStore.state.currentPackIndex >= 0);
        var itemSelected = (AppStore.state.currentItem !== null);

        // Update Save/Export States
        var packIds = ['menu-save-pack', 'menu-export-hex', 'menu-open-pack'];
        packIds.forEach((id) => {
            var el = document.getElementById(id);
            if (el) {
                if (packOpen) el.classList.remove('disabled');
                else el.classList.add('disabled');
            }
        });

        // Open Pack is always enabled
        var openPackEl = document.getElementById('menu-open-pack');
        if (openPackEl) openPackEl.classList.remove('disabled');

        // Import Item requires a Pack to be open
        var importItemEl = document.getElementById('menu-import-item');
        if (importItemEl) {
            if (packOpen) importItemEl.classList.remove('disabled');
            else importItemEl.classList.add('disabled');
        }

        // Export Item requires an Item selected
        var exportItemEl = document.getElementById('menu-export-item');
        if (exportItemEl) {
            if (itemSelected) exportItemEl.classList.remove('disabled');
            else exportItemEl.classList.add('disabled');
        }

        // New Items
        var staticIds = ['menu-new-proc', 'menu-new-notepad', 'menu-new-datafile'];
        staticIds.forEach((id) => {
            var el = document.getElementById(id);
            if (el) {
                if (packOpen) el.classList.remove('disabled');
                else el.classList.add('disabled');
            }
        });

        // Dynamic Items (Records)
        var container = document.getElementById('new-dynamic-container');
        var separator = document.getElementById('new-dynamic-separator');
        if (!container) return;

        container.innerHTML = '';
        if (separator) separator.style.display = 'none';

        if (packOpen) {
            var files = getDataFiles();
            var hasFiles = false;

            for (var i = 1; i < 110; i++) {
                if (files[i]) {
                    hasFiles = true;
                    break;
                }
            }

            if (hasFiles) {
                if (separator) separator.style.display = 'block';

                var a = document.createElement('a');
                a.href = "#";
                a.innerHTML = '<i class="fas fa-table-list" style="width: 20px;"></i> New Record...';
                a.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.closeAllMenus();
                    createNewRecord();
                });
                container.appendChild(a);
            }
        }
    }
};
