/**
 * UIController — Sidebars, keyboard shortcuts, toasts, and UI card collapse management.
 */
class UIController {
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
        /* Document-level single event delegation for sidebar tab triggers & close buttons */
        document.addEventListener('click', (e) => {
            const trigger = e.target.closest('.sidebar-tab-trigger, .sidebar-tab-trigger-left');
            if (trigger) {
                const panelId = trigger.dataset.panel || trigger.getAttribute('data-panel');
                if (panelId) {
                    e.preventDefault();
                    if (trigger.classList.contains('sidebar-tab-trigger-left')) {
                        UIController.toggleLeftSidebar(trigger.id, panelId);
                    } else {
                        UIController.toggleRightSidebar(trigger.id, panelId);
                    }
                    return;
                }
            }

            const closer = e.target.closest('.btn-close-sidebar');
            if (closer) {
                const panel = closer.closest('.sidebar-panel, .sidebar-panel-left');
                if (panel) {
                    e.preventDefault();
                    panel.classList.remove('open', 'peek');
                    const isLeft = panel.classList.contains('sidebar-panel-left');
                    if (isLeft) {
                        const trig = document.getElementById('guide-trigger');
                        if (trig) trig.classList.remove('panel-open');
                        document.body.classList.remove('left-panel-open');
                    } else {
                        document.querySelectorAll('.sidebar-tab-trigger').forEach(t => t.classList.remove('panel-open'));
                        const anyRightOpen = !!document.querySelector('.sidebar-panel.open');
                        document.body.classList.toggle('right-panel-open', anyRightOpen);
                    }
                }
            }
        });

        /* Keyboard support (Enter/Space on tab triggers) */
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                const trigger = e.target.closest('.sidebar-tab-trigger, .sidebar-tab-trigger-left');
                if (trigger) {
                    const panelId = trigger.dataset.panel || trigger.getAttribute('data-panel');
                    if (panelId) {
                        e.preventDefault();
                        if (trigger.classList.contains('sidebar-tab-trigger-left')) {
                            UIController.toggleLeftSidebar(trigger.id, panelId);
                        } else {
                            UIController.toggleRightSidebar(trigger.id, panelId);
                        }
                    }
                }
            }
        });

        /* Collapsible guide card headers */
        document.querySelectorAll('.guide-header').forEach(header => {
            header.addEventListener('click', () => {
                const card = header.closest('.guide-card');
                if (card) card.classList.toggle('collapsed');
            });
        });

        /* Global Keyboard Shortcuts (Escape to close, Alt+S/C/O/H/G for tabs) */
        window.addEventListener('keydown', (e) => {
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

            if (e.key === 'Escape') {
                UIController.closeAllSidebars();
            } else if (e.altKey && !e.ctrlKey && !e.shiftKey) {
                const key = e.key.toLowerCase();
                if (key === 's') {
                    e.preventDefault();
                    UIController.toggleRightSidebar('controls-trigger', 'controls-panel');
                } else if (key === 'c') {
                    e.preventDefault();
                    UIController.toggleRightSidebar('config-trigger', 'config-panel');
                } else if (key === 'h') {
                    e.preventDefault();
                    UIController.toggleRightSidebar('help-trigger', 'help-panel');
                } else if (key === 'o') {
                    e.preventDefault();
                    UIController.toggleRightSidebar('operations-trigger', 'operations-panel');
                } else if (key === 'g') {
                    e.preventDefault();
                    UIController.toggleLeftSidebar('guide-trigger', 'guide-panel');
                }
            }
        });
    }

    static closeAllSidebars() {
        document.querySelectorAll('.sidebar-panel, .sidebar-panel-left').forEach(p => p.classList.remove('open', 'peek'));
        document.querySelectorAll('.sidebar-tab-trigger, .sidebar-tab-trigger-left').forEach(t => t.classList.remove('panel-open', 'peek'));
        document.body.classList.remove('right-panel-open', 'left-panel-open');
    }

    static toggleLeftSidebar(triggerId, panelId) {
        const trigger = document.getElementById(triggerId);
        const panel   = document.getElementById(panelId);
        if (!trigger || !panel) return;

        /* Close right sidebars first */
        document.querySelectorAll('.sidebar-panel').forEach(p => p.classList.remove('open', 'peek'));
        document.querySelectorAll('.sidebar-tab-trigger').forEach(t => t.classList.remove('panel-open', 'peek'));
        document.body.classList.remove('right-panel-open');

        const isOpen = panel.classList.contains('open');
        if (isOpen) {
            panel.classList.remove('open');
            trigger.classList.remove('panel-open');
            document.body.classList.remove('left-panel-open');
        } else {
            panel.classList.add('open');
            trigger.classList.add('panel-open');
            document.body.classList.add('left-panel-open');
        }
    }

    static toggleRightSidebar(triggerId, panelId) {
        const trigger = document.getElementById(triggerId);
        const panel   = document.getElementById(panelId);
        if (!trigger || !panel) return;

        /* Close left sidebar if open */
        const leftPanel = document.getElementById('guide-panel');
        const leftTrigger = document.getElementById('guide-trigger');
        if (leftPanel) leftPanel.classList.remove('open');
        if (leftTrigger) leftTrigger.classList.remove('panel-open');
        document.body.classList.remove('left-panel-open');

        const isOpen = panel.classList.contains('open');

        /* Close all right sidebars */
        document.querySelectorAll('.sidebar-panel').forEach(p => p.classList.remove('open', 'peek'));
        document.querySelectorAll('.sidebar-tab-trigger').forEach(t => t.classList.remove('panel-open', 'peek'));

        if (isOpen) {
            document.body.classList.remove('right-panel-open');
        } else {
            panel.classList.add('open');
            trigger.classList.add('panel-open');
            document.body.classList.add('right-panel-open');
        }
    }
}

if (typeof window !== 'undefined') {
    window.UIController = UIController;
}
