/**
 * SimulationEngine — Live PV Sinewave & Noise Generator.
 */
export class SimulationEngine {
    constructor(device, onUpdate) {
        this._device = device;
        this._onUpdate = onUpdate;
        this._simT = 0;
        this._simInterval = null;
    }

    start() {
        if (this._simInterval) clearInterval(this._simInterval);
        this._simInterval = setInterval(() => this._tick(), 1000);
    }

    stop() {
        if (this._simInterval) {
            clearInterval(this._simInterval);
            this._simInterval = null;
        }
    }

    _tick() {
        this._simT++;
        const d = this._device;

        const chkPen1 = document.getElementById('chkSimPen1');
        const chkPen2 = document.getElementById('chkSimPen2');
        const simPen1 = chkPen1 ? chkPen1.checked : false;
        const simPen2 = chkPen2 ? chkPen2.checked : false;

        const sliderNoise = document.getElementById('sliderNoise');
        const noise = sliderNoise ? parseFloat(sliderNoise.value) : 1;
        const noiseFn = () => (Math.random() - 0.5) * 2 * noise;

        if (simPen1) {
            const slider1 = document.getElementById('sliderPen1Period');
            const period1 = slider1 ? parseFloat(slider1.value) : 60;
            const span    = d.scaleHi - d.scaleLo;
            const mid1    = d.scaleLo + span * 0.5;
            const amp1    = span * 0.4;
            d.pen1PV      = mid1 + amp1 * Math.sin((2 * Math.PI * this._simT) / period1) + noiseFn();
            const input1 = document.getElementById('inputPen1PV');
            if (input1) input1.value = d.pen1PV.toFixed(2);
        }

        if (simPen2) {
            const slider2 = document.getElementById('sliderPen2Period');
            const period2 = slider2 ? parseFloat(slider2.value) : 60;
            const span    = d.scaleHi - d.scaleLo;
            const mid2    = d.scaleLo + span * 0.35;
            const amp2    = span * 0.3;
            d.pen2PV      = mid2 + amp2 * Math.cos((2 * Math.PI * this._simT) / period2) + noiseFn();
            const input2 = document.getElementById('inputPen2PV');
            if (input2) input2.value = d.pen2PV.toFixed(2);
        }

        if (simPen1 || simPen2) {
            if (this._onUpdate) this._onUpdate();
        }
    }
}
