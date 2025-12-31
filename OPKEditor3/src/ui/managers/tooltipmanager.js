'use strict';

var TooltipManager = {
    tooltipElement: null,

    init: function () {
        if (!this.tooltipElement) {
            this.tooltipElement = document.createElement('div');
            this.tooltipElement.id = 'pack-summary-tooltip'; // Keeping ID for CSS compatibility
            document.body.appendChild(this.tooltipElement);
        }
    },

    show: function (x, y, htmlContent) {
        if (!this.tooltipElement) this.init();

        this.tooltipElement.innerHTML = htmlContent;
        this.tooltipElement.style.top = (y + 5) + "px";
        this.tooltipElement.style.left = (x + 10) + "px";
        this.tooltipElement.classList.add('visible');
    },

    hide: function () {
        if (this.tooltipElement) {
            this.tooltipElement.classList.remove('visible');
        }
    }
};

// Initialize immediately
TooltipManager.init();
