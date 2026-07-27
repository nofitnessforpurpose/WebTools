/**
 * UIController — Sidebars, pulse/peek cues, toasts, and UI card collapse management.
 */
export class UIController {
    static showToast(message, icon = 'fa-check', isError = false) {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${isError ? 'toast-error' : ''}`;
        toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
        container.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    static initSidebars() {
        UIController._wireLeftSidebar('guide-trigger',  'guide-panel',  'btn-close-guide');

        UIController._wireRightSidebar('help-trigger',       'help-panel',       'btn-close-help');
        UIController._wireRightSidebar('config-trigger',     'config-panel',     'btn-close-config');
        UIController._wireRightSidebar('controls-trigger',   'controls-panel',   'btn-close-controls');
        UIController._wireRightSidebar('operations-trigger', 'operations-panel', 'btn-close-operations');

        document.querySelectorAll('.guide-header').forEach(header => {
            header.addEventListener('click', () => {
                header.closest('.guide-card').classList.toggle('collapsed');
            });
        });

        setTimeout(() => {
            const controlsTrigger = document.getElementById('controls-trigger');
            const controlsPanel   = document.getElementById('controls-panel');
            if (controlsTrigger) {
                controlsTrigger.classList.add('pulse-glow');

                if (controlsPanel && !controlsPanel.classList.contains('open')) {
                    controlsPanel.classList.add('peek');
                    controlsTrigger.classList.add('peek');

                    setTimeout(() => {
                        controlsPanel.classList.remove('peek');
                        controlsTrigger.classList.remove('peek');
                    }, 1500);
                }
            }
        }, 600);
    }

    static _wireLeftSidebar(triggerId, panelId, closeId) {
        const trigger = document.getElementById(triggerId);
        const panel   = document.getElementById(panelId);
        const closer  = document.getElementById(closeId);
        if (!trigger || !panel) return;

        trigger.addEventListener('click', () => {
            const isOpen = panel.classList.contains('open');
            panel.classList.toggle('open', !isOpen);
            trigger.classList.toggle('panel-open', !isOpen);
        });

        if (closer) {
            closer.addEventListener('click', () => {
                panel.classList.remove('open');
                trigger.classList.remove('panel-open');
            });
        }
    }

    static _wireRightSidebar(triggerId, panelId, closeId) {
        const trigger = document.getElementById(triggerId);
        const panel   = document.getElementById(panelId);
        const closer  = document.getElementById(closeId);
        if (!trigger || !panel) return;

        trigger.addEventListener('click', () => {
            trigger.classList.remove('pulse-glow', 'peek');
            if (panel) panel.classList.remove('peek');

            document.querySelectorAll('.sidebar-panel').forEach(p => {
                if (p.id !== panelId) {
                    p.classList.remove('open', 'peek');
                }
            });
            document.querySelectorAll('.sidebar-tab-trigger').forEach(t => {
                if (t.id !== triggerId) {
                    t.classList.remove('panel-open', 'peek');
                }
            });
            const isOpen = panel.classList.contains('open');
            panel.classList.toggle('open', !isOpen);
            trigger.classList.toggle('panel-open', !isOpen);
        });

        if (closer) {
            closer.addEventListener('click', () => {
                panel.classList.remove('open');
                trigger.classList.remove('panel-open');
            });
        }
    }
}
