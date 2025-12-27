'use strict';

var LayoutManager = {
    dockview: null,
    components: {},
    rootElement: null,

    init: function (retryCount) {
        if (typeof retryCount === 'undefined') retryCount = 0;



        // Wait for DockviewCore to be available from the ES Module shim
        if (!window.DockviewCore) {
            if (retryCount > 20) { // 10 seconds timeout
                console.error("LayoutManager: DockviewCore failed to load after 10 seconds.");
                alert("Critical Error: Core Layout Library failed to load. Check internet connection or CDN status.");
                return;
            }// 
//             console.warn("LayoutManager: DockviewCore not yet loaded. Retrying in 500ms...");
            setTimeout(function () { LayoutManager.init(retryCount + 1); }, 500);
            return;
        }

        this.rootElement = document.getElementById('dock-root');
        if (!this.rootElement) {
            console.error("LayoutManager: #dock-root not found.");
            return;
        }



        try {
            // Initialize Dockview
            this.dockview = new window.DockviewCore.DockviewComponent({
                parentElement: this.rootElement,
                createComponent: this.createComponent.bind(this)
            });

        } catch (e) {
            console.error("LayoutManager: Failed to initialize Dockview.", e);
            return;
        }

        // Register default components logic is handled in 'createComponent' using a switch/lookup
        // but we can pre-register Logic classes if we want.



        // Set up default layout
        this.createDefaultLayout();

        // Handle window resize
        window.addEventListener('resize', () => {
            // dockview-core handles resize via ResizeObserver typically, but we should double check
            if (this.dockview) this.dockview.layout(this.rootElement.clientWidth, this.rootElement.clientHeight);
        });
    },

    createComponent: function (options) { // options: { id, name } provided by dockview
        var componentId = options.name; // We use 'name' as the identifier


        var element = document.createElement('div');
        element.style.width = '100%';
        element.style.height = '100%';
        element.style.overflow = 'hidden'; // Important for scrolling internal content
        element.style.position = 'relative';

        switch (componentId) {
            case 'pack-contents':
                // Attach the PackContents view
                // We reuse the existing shim or class
                // Strategy: Use the new Class instance, but we need to ensure global events trigger it.
                // The shim in PackContents.js replaced the specific "pack-list" element with `new PackContentsView(...)`.
                // However, `PackContents` global is what `opkedit.js` uses.
                // We should tell the global shim to attach to THIS element.

                if (typeof PackContents !== 'undefined' && PackContents.setContainer) {
                    PackContents.setContainer(element);
                    // Add class for styling if needed
                    element.classList.add('pack-list-root');
                } else {
                    element.innerText = "PackContents Error: Shim not found.";
                }
                break;

            case 'editor-area':
                // Move the #editor-container from staging to here
                // Note: The editors rely on #code-editor-container and #legacy-editor IDs
                // So we move the *children* of editor-staging or re-parent the container?
                // Re-parenting #editor-staging's contents is safest to preserve IDs.

                var editorStaging = document.getElementById('editor-staging');
                // Move children
                while (editorStaging && editorStaging.childNodes.length > 0) {
                    element.appendChild(editorStaging.childNodes[0]);
                }

                // Add editor header
                // We need to recreate the visual header or integrate it into the panel title
                // For now, let's keep the content simple. 
                // Ops, we lost #editor-header. Let's recreate it inside if needed, or rely on Dockview tabs.
                // Dockview tabs replace the need for "File Name" header mostly.
                break;

            case 'memory-map':
                if (typeof MemoryMap !== 'undefined' && MemoryMap.render) {
                    MemoryMap.render(element);
                } else {
                    element.innerText = "Memory Map (Placeholder)";
                }
                break;

            default:
                element.innerText = "Unknown Component: " + componentId;
        }

        return {
            element: element,
            init: (params) => {
                // Component init logic
            },
            onResize: () => {
                // Propagate resize to children if they have a resize method (like CodeEditor?)
                // Dispatch a global resize event or check specific globals?
                if (componentId === 'editor-area' && typeof currentEditor !== 'undefined' && currentEditor && currentEditor.resize) {
                    currentEditor.resize();
                }
            }
        };
    },

    createDefaultLayout: function () {
        this.dockview.clear();

        // Add Pack Contents (Left)
        var panelPack = this.dockview.addPanel({
            id: 'panel_pack',
            component: 'pack-contents',
            title: 'Pack Contents',
            position: { referencePanel: null, direction: 'left' } // First component
        });

        // Add Editor (Center) - To the right of Pack Contents
        var panelEditor = this.dockview.addPanel({
            id: 'panel_editor',
            component: 'editor-area',
            title: 'Editor',
            position: { referencePanel: panelPack, direction: 'right' }
        });

        // Add Memory Map (Right, hidden or small?)
        // Let's add it to the right of Editor
        var panelMem = this.dockview.addPanel({
            id: 'panel_memory',
            component: 'memory-map',
            title: 'Memory Map',
            position: { referencePanel: panelEditor, direction: 'right' },
            size: 200 // Initial width
        });

        // Activate Editor
        panelEditor.api.setActive();
    }
};
