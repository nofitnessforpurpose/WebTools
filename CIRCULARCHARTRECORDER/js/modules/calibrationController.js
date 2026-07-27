/**
 * CalibrationController — Arm sweep calibration mode & gentle motor parking helper.
 */
export class CalibrationController {
    static isCalibrationActive() {
        const chkCalib = document.getElementById('chkArmCalibration');
        return chkCalib ? chkCalib.checked : false;
    }

    static getCalibrationNorm() {
        const sliderCalib = document.getElementById('sliderArmCalibration');
        if (!sliderCalib) return 0.5;
        return parseFloat(sliderCalib.value) / 100;
    }

    static clearCalibrationMode() {
        const chkCalib = document.getElementById('chkArmCalibration');
        if (chkCalib && chkCalib.checked) {
            chkCalib.checked = false;
            chkCalib.dispatchEvent(new Event('change'));
        }
    }

    /**
     * Animate pen arms smoothly using cubic ease-out.
     */
    static animatePenArms(startNorms, targetNorms, durationMs, renderer, onStep, onComplete) {
        const startTime = performance.now();

        const animStep = (now) => {
            const elapsed  = now - startTime;
            const progress = Math.min(1, elapsed / durationMs);
            const ease     = 1 - Math.pow(1 - progress, 3); // Cubic ease-out

            const interpolatedNorms = startNorms.map((startVal, idx) => {
                const targetVal = targetNorms[idx];
                return startVal + (targetVal - startVal) * ease;
            });

            renderer.updatePenArms(interpolatedNorms);
            if (onStep) onStep(interpolatedNorms);

            if (progress < 1) {
                requestAnimationFrame(animStep);
            } else {
                if (onComplete) onComplete();
            }
        };

        requestAnimationFrame(animStep);
    }
}
