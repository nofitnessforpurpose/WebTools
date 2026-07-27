import { VirtualDevice } from './modules/virtualDevice.js';
import { ModbusParser } from './modules/modbusParser.js';
import { AsciiProtocolParser } from './modules/asciiParser.js';
import { CircularChartRenderer } from './modules/chartRenderer.js';
import { StripTrendRenderer } from './modules/trendRenderer.js';
import { ChartRecorderEmulator } from './modules/serialManager.js';
import { SimulationEngine } from './modules/simulationEngine.js';
import { CalibrationController } from './modules/calibrationController.js';
import { UIController } from './modules/uiController.js';
import { normaliseAngleDeg, degToRad } from './utils/mathUtils.js';

/**
 * AppController — Main application orchestrator for Chart Recorder Emulator.
 */
class AppController {
    constructor() {
        this._emulator = new ChartRecorderEmulator({
            stationAddress: 1,
            baudRate: 9600,
            onStateChange: (state) => this._updateConnectionUI(state),
            onFrameProcessed: (rx, tx) => this._onFrameProcessed(rx, tx),
        });

        const chartCanvas = document.getElementById('chartCanvas');
        const trendCanvas = document.getElementById('trendCanvas');

        this._renderer = new CircularChartRenderer(chartCanvas, this._emulator);
        this._trendRenderer = new StripTrendRenderer(trendCanvas);

        this._discAngleDeg = 343;
        this._prevAngleDeg = 343;
        this._motorRunning = true;
        this._currentPenNorms = [0.5, 0.5, 0.5, 0.5];
        this._penAnimFrameId = null;

        this._dataLog = [];
        this._simulation = new SimulationEngine(this._emulator.device, () => {
            this._updateReadouts();
            this._updatePenArmState();
        });

        this._init();
    }

    _init() {
        UIController.initSidebars();
        this._initControls();
        this._initConfig();
        this._initOperations();
        this._initSimulation();
        this._initKeyboardShortcuts();

        this._loadPreferences();
        this._syncConfigUI();
        this._updateReadouts();
        this._updateAlignmentMarkerPosition(this._discAngleDeg);

        this._startMotor();
        this._simulation.start();
    }

    _showToast(msg, icon = 'fa-check', isError = false) {
        UIController.showToast(msg, icon, isError);
    }

    _updateConnectionUI(state) {
        const badge = document.getElementById('chartStatusBadge');
        const btnConnect = document.getElementById('btnSerialConnect');

        const ledStatus = document.getElementById('ledStatus');
        const ledRx     = document.getElementById('ledRx');
        const ledTx     = document.getElementById('ledTx');

        if (!badge || !btnConnect) return;

        switch (state) {
            case 'connected':
                badge.className = 'badge online';
                badge.textContent = 'ONLINE';
                btnConnect.innerHTML = '<i class="fa-solid fa-unlink"></i> Disconnect';
                if (ledStatus) {
                    ledStatus.classList.remove('disconnected');
                    ledStatus.classList.add('connected');
                }
                this._showToast('Serial port connected.', 'fa-plug');
                break;
            case 'disconnected':
            case 'idle':
                badge.className = 'badge offline';
                badge.textContent = 'OFFLINE';
                btnConnect.innerHTML = '<i class="fa-solid fa-plug"></i> Connect Serial';
                if (ledStatus) {
                    ledStatus.classList.remove('connected');
                    ledStatus.classList.add('disconnected');
                }
                if (ledRx) ledRx.classList.remove('active');
                if (ledTx) ledTx.classList.remove('active');
                break;
            case 'rx':
                if (ledRx) {
                    ledRx.classList.add('active');
                    setTimeout(() => ledRx.classList.remove('active'), 150);
                }
                break;
            case 'tx':
                if (ledTx) {
                    ledTx.classList.add('active');
                    setTimeout(() => ledTx.classList.remove('active'), 150);
                }
                break;
            default:
                badge.className = 'badge offline';
                badge.textContent = 'OFFLINE';
                if (ledStatus) {
                    ledStatus.classList.remove('connected');
                    ledStatus.classList.add('disconnected');
                }
                break;
        }
    }

    _onFrameProcessed(rx, tx) {
        this._updateStats();
        this._updateReadouts();
        this._updatePenArmState();
    }

    _updateStats() {
        const stats = this._emulator.getStats();
        const setVal = (id, v) => {
            const el = document.getElementById(id);
            if (el) el.textContent = String(v);
        };
        setVal('statRxFrames',    stats.totalRx);
        setVal('statValidFrames', stats.validFrames);
        setVal('statCrcErrors',   stats.crcErrors);
        setVal('statFc03',        stats.fc03);
        setVal('statFc06',        stats.fc06);
        setVal('statFc16',        stats.fc16);
    }

    _normalisePV(pv, scaleLo, scaleHi) {
        if (scaleHi === scaleLo) return 0.5;
        const norm = (pv - scaleLo) / (scaleHi - scaleLo);
        return Math.max(0, Math.min(1, norm));
    }

    _updateReadouts() {
        const d = this._emulator.device;
        const units = ['°C', '°F', '%RH', 'bar', 'mA', 'V'][d.engUnits] || '°C';

        const activeCount = this._renderer._penCount || 1;

        for (let i = 1; i <= 4; i++) {
            const container = document.getElementById(`pen${i}Readout`);
            if (container) {
                container.style.display = (i <= activeCount) ? 'flex' : 'none';
            }
        }

        const p1Val = d.pen1PV;
        const elVal1 = document.getElementById('valPen1');
        const elUnit1 = document.getElementById('unitPen1');
        if (elVal1) elVal1.textContent = p1Val.toFixed(1);
        if (elUnit1) elUnit1.textContent = units;

        const p2Val = d.pen2PV;
        const elVal2 = document.getElementById('valPen2');
        const elUnit2 = document.getElementById('unitPen2');
        if (elVal2) elVal2.textContent = p2Val.toFixed(1);
        if (elUnit2) elUnit2.textContent = units;

        const p3Val = d.pen3PV || (d.scaleLo + (d.scaleHi - d.scaleLo) * 0.55);
        const elVal3 = document.getElementById('valPen3');
        const elUnit3 = document.getElementById('unitPen3');
        if (elVal3) elVal3.textContent = p3Val.toFixed(1);
        if (elUnit3) elUnit3.textContent = units;

        const p4Val = d.pen4PV || (d.scaleLo + (d.scaleHi - d.scaleLo) * 0.75);
        const elVal4 = document.getElementById('valPen4');
        const elUnit4 = document.getElementById('unitPen4');
        if (elVal4) elVal4.textContent = p4Val.toFixed(1);
        if (elUnit4) elUnit4.textContent = units;

        const ledAlarm = document.getElementById('ledAlarm');
        if (ledAlarm) {
            const hasAlarm = d.alarm1Active || d.alarm2Active;
            ledAlarm.classList.toggle('active', !!hasAlarm);
        }
    }

    _animatePenArmsTo(targetNorms, durationMs, onComplete) {
        if (this._penAnimFrameId) {
            cancelAnimationFrame(this._penAnimFrameId);
            this._penAnimFrameId = null;
        }

        const startNorms = [...this._currentPenNorms];
        CalibrationController.animatePenArms(
            startNorms,
            targetNorms,
            durationMs,
            this._renderer,
            (interpolated) => { this._currentPenNorms = interpolated; },
            onComplete
        );
    }

    _updatePenArmState() {
        if (CalibrationController.isCalibrationActive()) {
            const calibNorm = CalibrationController.getCalibrationNorm();
            const calibNorms = [calibNorm, calibNorm, calibNorm, calibNorm];
            this._currentPenNorms = calibNorms;
            this._renderer.updatePenArms(calibNorms);
            return;
        }

        const d = this._emulator.device;
        const p1 = this._normalisePV(d.pen1PV, d.scaleLo, d.scaleHi);
        const p2 = this._normalisePV(d.pen2PV || (d.scaleLo + (d.scaleHi - d.scaleLo) * 0.3), d.scaleLo, d.scaleHi);
        const p3 = this._normalisePV(d.pen3PV || (d.scaleLo + (d.scaleHi - d.scaleLo) * 0.55), d.scaleLo, d.scaleHi);
        const p4 = this._normalisePV(d.pen4PV || (d.scaleLo + (d.scaleHi - d.scaleLo) * 0.75), d.scaleLo, d.scaleHi);
        const activeNorms = [p1, p2, p3, p4];

        if (this._motorRunning) {
            this._currentPenNorms = activeNorms;
            this._renderer.updatePenArms(activeNorms);
        }
    }

    _updateAlignmentMarkerPosition(discAngleDeg) {
        const marker = document.getElementById('paperAlignmentMarker');
        if (!marker) return;

        const penDrawAngleDeg = this._renderer._penDrawAngle;
        const transformStr = `rotate(${penDrawAngleDeg} 360 360)`;
        marker.setAttribute('transform', transformStr);
    }

    _startMotor() {
        this._motorRunning = true;
        const spinner  = document.getElementById('motorSpinner');
        const btnStart = document.getElementById('btnDriveStart');
        const btnStop  = document.getElementById('btnDriveStop');
        if (spinner)  spinner.classList.add('running');
        if (btnStart) btnStart.classList.add('active');
        if (btnStop)  btnStop.classList.remove('active');

        CalibrationController.clearCalibrationMode();

        const d = this._emulator.device;
        const p1 = this._normalisePV(d.pen1PV, d.scaleLo, d.scaleHi);
        const p2 = this._normalisePV(d.pen2PV || (d.scaleLo + (d.scaleHi - d.scaleLo) * 0.3), d.scaleLo, d.scaleHi);
        const p3 = this._normalisePV(d.pen3PV || (d.scaleLo + (d.scaleHi - d.scaleLo) * 0.55), d.scaleLo, d.scaleHi);
        const p4 = this._normalisePV(d.pen4PV || (d.scaleLo + (d.scaleHi - d.scaleLo) * 0.75), d.scaleLo, d.scaleHi);
        this._animatePenArmsTo([p1, p2, p3, p4], 1000);

        if (this._worker) {
            this._worker.terminate();
        }

        const workerCode = `
            let timerId = null;
            self.onmessage = function(e) {
                if (e.data.action === 'start') {
                    if (timerId) clearInterval(timerId);
                    timerId = setInterval(() => self.postMessage('tick'), 100);
                } else if (e.data.action === 'stop') {
                    if (timerId) clearInterval(timerId);
                    timerId = null;
                }
            };
        `;
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        this._worker = new Worker(URL.createObjectURL(blob));

        this._worker.onmessage = () => {
            if (!this._motorRunning) return;

            const d = this._emulator.device;
            const p1 = this._normalisePV(d.pen1PV, d.scaleLo, d.scaleHi);
            const p2 = this._normalisePV(d.pen2PV || (d.scaleLo + (d.scaleHi - d.scaleLo) * 0.3), d.scaleLo, d.scaleHi);
            const p3 = this._normalisePV(d.pen3PV || (d.scaleLo + (d.scaleHi - d.scaleLo) * 0.55), d.scaleLo, d.scaleHi);
            const p4 = this._normalisePV(d.pen4PV || (d.scaleLo + (d.scaleHi - d.scaleLo) * 0.75), d.scaleLo, d.scaleHi);

            const norms = [p1, p2, p3, p4];
            this._renderer.drawPenTraces(norms, this._discAngleDeg);
            this._trendRenderer.appendSample(p1, p2);
            if (!this._penAnimFrameId) {
                this._currentPenNorms = norms;
                this._renderer.updatePenArms(norms);
            }
        };

        this._startAnimLoop();
        this._worker.postMessage({ action: 'start' });
    }

    /** High-precision 60fps/120fps GPU animation loop for fluid disc rotation. */
    _startAnimLoop() {
        if (this._animFrameId) return;
        this._lastMotorTime = performance.now();

        const animStep = (now) => {
            if (this._motorRunning) {
                const dt = (now - this._lastMotorTime) / 1000;
                this._lastMotorTime = now;

                if (dt > 0 && dt < 0.5) {
                    const degPerSec = this._getChartSpeedDegPerSec();
                    this._discAngleDeg += degPerSec * dt;

                    const canvas = document.getElementById('chartCanvas');
                    if (canvas) {
                        canvas.style.transform = `rotate(${this._discAngleDeg.toFixed(3)}deg)`;
                    }
                }
                this._animFrameId = requestAnimationFrame(animStep);
            } else {
                this._animFrameId = null;
            }
        };

        this._animFrameId = requestAnimationFrame(animStep);
    }

    _stopMotor() {
        this._motorRunning = false;
        const spinner  = document.getElementById('motorSpinner');
        const btnStart = document.getElementById('btnDriveStart');
        const btnStop  = document.getElementById('btnDriveStop');
        if (spinner)  spinner.classList.remove('running');
        if (btnStart) btnStart.classList.remove('active');
        if (btnStop)  btnStop.classList.add('active');

        if (this._worker) {
            this._worker.postMessage({ action: 'stop' });
        }

        const outsideParkNorms = [1.15, 1.15, 1.15, 1.15];
        this._animatePenArmsTo(outsideParkNorms, 1200);
    }

    _getChartSpeedDegPerSec() {
        const speedCode = this._emulator ? this._emulator.device.chartSpeed : 20;
        switch (speedCode) {
            case 100: return 12.0;
            case 50:  return 6.0;
            case 20:  return 3.0;
            case 10:  return 0.6;
            case 5:   return 0.1;
            case 1:   return 0.004166667;
            case 2:   return 0.000595238;
            case 3:   return 0.000134408;
            case 4:   return 0.000011415;
            default:  return 3.0;
        }
    }

    _initControls() {
        const btnConnect = document.getElementById('btnSerialConnect');
        btnConnect.addEventListener('click', () => this._emulator.connect());

        const btnStart = document.getElementById('btnDriveStart');
        const btnStop  = document.getElementById('btnDriveStop');
        if (btnStart) btnStart.addEventListener('click', () => { if (!this._motorRunning) this._startMotor(); });
        if (btnStop)  btnStop.addEventListener('click', () => { if (this._motorRunning) this._stopMotor(); });

        const chkCalib    = document.getElementById('chkArmCalibration');
        const sliderCalib = document.getElementById('sliderArmCalibration');
        const labelCalib  = document.getElementById('labelArmCalibration');
        const rowCalib    = document.getElementById('rowArmCalibrationSlider');

        if (chkCalib && sliderCalib) {
            const updateCalibrationUI = () => {
                const isCalib = chkCalib.checked;
                sliderCalib.disabled = !isCalib;
                if (rowCalib) {
                    rowCalib.style.opacity = isCalib ? '1' : '0.5';
                    rowCalib.style.pointerEvents = isCalib ? 'auto' : 'none';
                }
                this._updatePenArmState();
            };

            chkCalib.addEventListener('change', updateCalibrationUI);
            sliderCalib.addEventListener('input', () => {
                const val = parseFloat(sliderCalib.value);
                if (labelCalib) labelCalib.textContent = `${Math.round(val)}%`;
                this._updatePenArmState();
            });

            updateCalibrationUI();
        }

        const chkFocusMode = document.getElementById('chkFocusMode');
        if (chkFocusMode) {
            chkFocusMode.addEventListener('change', (e) => {
                document.body.classList.toggle('focus-mode', e.target.checked);
                this._savePreferences();
            });
        }

        const selProto = document.getElementById('selectProtocol');
        if (selProto) {
            selProto.addEventListener('change', (e) => {
                const proto = e.target.value;
                this._emulator._parser._protocol = proto;
                this._updateProtocolUI(proto);
                this._savePreferences();
                this._showToast(`Protocol changed to ${proto === 'ascii' ? 'Simple ASCII' : 'Modbus RTU'}.`, 'fa-network-wired');
            });
            this._updateProtocolUI(selProto.value);
        }

        const selTimeout = document.getElementById('selectFrameTimeout');
        if (selTimeout) {
            selTimeout.addEventListener('change', (e) => {
                const ms = parseInt(e.target.value, 10);
                this._emulator.setInterFrameTimeout(ms);
                this._savePreferences();
                this._showToast(`Inter-frame timeout set to ${ms} ms.`, 'fa-clock');
            });
        }
    }

    _updateProtocolUI(proto) {
        const selProto = document.getElementById('selectProtocol');
        if (selProto) selProto.value = proto;

        const isModbus = (proto === 'modbus');

        const modbusElements = document.querySelectorAll('.modbus-only-element');
        modbusElements.forEach(el => {
            if (el.tagName === 'TR') {
                el.style.display = isModbus ? 'table-row' : 'none';
            } else {
                el.style.display = isModbus ? 'block' : 'none';
            }
        });

        const oplElements = document.querySelectorAll('.opl-only-element');
        oplElements.forEach(el => {
            el.style.display = isModbus ? 'none' : 'block';
        });
    }

    _initConfig() {
        const selSpeed = document.getElementById('selectChartSpeed');
        if (selSpeed) {
            selSpeed.addEventListener('change', (e) => {
                const speed = parseInt(e.target.value, 10);
                this._emulator.device.chartSpeed = speed;
                this._savePreferences();
                this._showToast('Chart rotation speed updated.', 'fa-gauge-high');
            });
        }

        const setStartAngle = (val) => {
            const angle = normaliseAngleDeg(val);
            const slider = document.getElementById('sliderStartAngle');
            const label  = document.getElementById('labelStartAngle');
            if (slider) slider.value = angle;
            if (label) label.textContent = angle + '°';

            const diff = angle - this._prevAngleDeg;
            this._discAngleDeg += diff;
            this._prevAngleDeg  = angle;

            const canvas = document.getElementById('chartCanvas');
            if (canvas) canvas.style.transform = `rotate(${this._discAngleDeg.toFixed(3)}deg)`;

            this._savePreferences();
        };

        const sliderStartAngle = document.getElementById('sliderStartAngle');
        if (sliderStartAngle) {
            sliderStartAngle.addEventListener('input', () => setStartAngle(parseFloat(sliderStartAngle.value)));
            const btnUp = document.getElementById('btnStartAngleUp');
            const btnDown = document.getElementById('btnStartAngleDown');
            if (btnUp) btnUp.addEventListener('click', () => setStartAngle(parseFloat(sliderStartAngle.value) + 1));
            if (btnDown) btnDown.addEventListener('click', () => setStartAngle(parseFloat(sliderStartAngle.value) - 1));
        }

        const sliderAngle = document.getElementById('sliderArmMountAngle');
        const labelAngle  = document.getElementById('labelArmMountAngle');
        const setArmMountAngle = (val) => {
            const angle = Math.min(360, Math.max(0, Math.round(val)));
            if (sliderAngle) sliderAngle.value = angle;
            if (labelAngle) labelAngle.textContent = angle + '°';
            this._renderer._armMountAngle = angle;
            this._renderer._drawDiscBackground();
            this._updatePenArmState();
            this._savePreferences();
        };
        if (sliderAngle && labelAngle) {
            sliderAngle.addEventListener('input', () => setArmMountAngle(parseFloat(sliderAngle.value)));
            const btnUp = document.getElementById('btnArmMountUp');
            const btnDown = document.getElementById('btnArmMountDown');
            if (btnUp) btnUp.addEventListener('click', () => setArmMountAngle(parseFloat(sliderAngle.value) + 1));
            if (btnDown) btnDown.addEventListener('click', () => setArmMountAngle(parseFloat(sliderAngle.value) - 1));
        }

        const sliderDrawAngle = document.getElementById('sliderPenDrawAngle');
        const labelDrawAngle  = document.getElementById('labelPenDrawAngle');
        const setPenDrawAngle = (val) => {
            const angle = Math.min(360, Math.max(0, Math.round(val)));
            if (sliderDrawAngle) sliderDrawAngle.value = angle;
            if (labelDrawAngle) labelDrawAngle.textContent = angle + '°';
            this._renderer._penDrawAngle = angle;
            this._renderer._drawDiscBackground();
            this._updatePenArmState();
            this._updateAlignmentMarkerPosition(this._discAngleDeg);
            this._savePreferences();
        };
        if (sliderDrawAngle && labelDrawAngle) {
            sliderDrawAngle.addEventListener('input', () => setPenDrawAngle(parseFloat(sliderDrawAngle.value)));
            const btnUp = document.getElementById('btnPenDrawUp');
            const btnDown = document.getElementById('btnPenDrawDown');
            if (btnUp) btnUp.addEventListener('click', () => setPenDrawAngle(parseFloat(sliderDrawAngle.value) + 1));
            if (btnDown) btnDown.addEventListener('click', () => setPenDrawAngle(parseFloat(sliderDrawAngle.value) - 1));
        }

        document.querySelectorAll('.sidebar-panel').forEach(panel => {
            panel.querySelectorAll('.font-status-card .card-header-label').forEach(label => {
                label.addEventListener('click', () => {
                    const card = label.closest('.font-status-card');
                    if (!card) return;
                    const isCurrentlyCollapsed = card.classList.contains('collapsed');
                    panel.querySelectorAll('.font-status-card').forEach(c => c.classList.add('collapsed'));
                    if (isCurrentlyCollapsed) card.classList.remove('collapsed');
                    if (panel.id === 'config-panel') this._savePreferences();
                });
            });
        });
    }

    _initOperations() {
        const btnReset = document.getElementById('btnResetRotation');
        if (btnReset) {
            btnReset.addEventListener('click', () => {
                const slider = document.getElementById('sliderStartAngle');
                const startAngle = slider ? parseFloat(slider.value) : 343;
                this._discAngleDeg = startAngle;
                this._prevAngleDeg  = startAngle;
                const canvas = document.getElementById('chartCanvas');
                if (canvas) canvas.style.transform = `rotate(${startAngle}deg)`;
                this._showToast('Chart disc aligned to start rotation.', 'fa-rotate-left');
            });
        }

        const jog = (deg) => {
            this._discAngleDeg += deg;
            const canvas = document.getElementById('chartCanvas');
            if (canvas) canvas.style.transform = `rotate(${this._discAngleDeg.toFixed(3)}deg)`;
        };
        const btnJogL = document.getElementById('btnJogLeft');
        const btnJogR = document.getElementById('btnJogRight');
        if (btnJogL) btnJogL.addEventListener('click', () => jog(-1));
        if (btnJogR) btnJogR.addEventListener('click', () => jog(1));

        const btnClear = document.getElementById('btnClearChart');
        if (btnClear) {
            btnClear.addEventListener('click', () => {
                this._renderer.clearChart();
                this._renderer.clearTrend();
                this._showToast('Chart history cleared.', 'fa-eraser');
            });
        }

        const btnExport = document.getElementById('btnExportChart');
        if (btnExport) {
            btnExport.addEventListener('click', () => {
                const dataUrl = this._renderer.exportChartPNG();
                const a = document.createElement('a');
                a.href = dataUrl;
                a.download = `chart-record-${Date.now()}.png`;
                a.click();
                this._showToast('Chart exported as PNG.', 'fa-file-arrow-down');
            });
        }
    }

    _initSimulation() {
        const slider1 = document.getElementById('sliderPen1Period');
        const label1  = document.getElementById('labelPen1Period');
        if (slider1 && label1) slider1.addEventListener('input', () => { label1.textContent = slider1.value + 's'; });

        const slider2 = document.getElementById('sliderPen2Period');
        const label2  = document.getElementById('labelPen2Period');
        if (slider2 && label2) slider2.addEventListener('input', () => { label2.textContent = slider2.value + 's'; });

        const sliderN = document.getElementById('sliderNoise');
        const labelN  = document.getElementById('labelNoise');
        if (sliderN && labelN) sliderN.addEventListener('input', () => { labelN.textContent = parseFloat(sliderN.value).toFixed(1); });
    }

    _initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;
            if (e.key === 'ArrowLeft') {
                this._discAngleDeg -= 1;
                const canvas = document.getElementById('chartCanvas');
                if (canvas) canvas.style.transform = `rotate(${this._discAngleDeg.toFixed(3)}deg)`;
            } else if (e.key === 'ArrowRight') {
                this._discAngleDeg += 1;
                const canvas = document.getElementById('chartCanvas');
                if (canvas) canvas.style.transform = `rotate(${this._discAngleDeg.toFixed(3)}deg)`;
            } else if (e.key === ' ') {
                e.preventDefault();
                if (this._motorRunning) this._stopMotor();
                else this._startMotor();
            }
        });
    }

    _syncConfigUI() {
        const d = this._emulator.device;
        const setVal = (id, v) => {
            const el = document.getElementById(id);
            if (el) el.value = v;
        };
        setVal('inputStationAddr', this._emulator._stationAddress);
        setVal('selectChartSpeed', d.chartSpeed);
        setVal('inputScaleHi', d.scaleHi);
        setVal('inputScaleLo', d.scaleLo);
        setVal('inputPen1PV', d.pen1PV);
        setVal('inputPen2PV', d.pen2PV);
    }

    _savePreferences() {
        const sliderStart = document.getElementById('sliderStartAngle');
        const startVal = sliderStart ? parseFloat(sliderStart.value) : 343;

        let openCardId = null;
        const configPanel = document.getElementById('config-panel');
        if (configPanel) {
            const openCard = configPanel.querySelector('.font-status-card:not(.collapsed)');
            if (openCard) openCardId = openCard.id;
        }

        const selProto = document.getElementById('selectProtocol');
        const selTimeout = document.getElementById('selectFrameTimeout');

        const prefs = {
            stationAddress: this._emulator._stationAddress,
            baudRate: this._emulator._baudRate,
            protocol: selProto ? selProto.value : 'ascii',
            interFrameTimeout: selTimeout ? parseInt(selTimeout.value, 10) : 10,
            chartSpeed: this._emulator.device.chartSpeed,
            startAngle: startVal,
            armMountAngle: this._renderer._armMountAngle,
            penDrawAngle: this._renderer._penDrawAngle,
            openConfigCard: openCardId
        };

        localStorage.setItem('chart_emulator_prefs', JSON.stringify(prefs));
    }

    _loadPreferences() {
        try {
            const saved = localStorage.getItem('chart_emulator_prefs');
            if (!saved) return;
            const prefs = JSON.parse(saved);

            if (prefs.chartSpeed !== undefined) {
                this._emulator.device.chartSpeed = prefs.chartSpeed;
                const selSpeed = document.getElementById('selectChartSpeed');
                if (selSpeed) selSpeed.value = prefs.chartSpeed;
            }

            if (prefs.protocol) {
                this._emulator._parser._protocol = prefs.protocol;
                this._updateProtocolUI(prefs.protocol);
            }

            if (prefs.interFrameTimeout) {
                this._emulator.setInterFrameTimeout(prefs.interFrameTimeout);
                const selTimeout = document.getElementById('selectFrameTimeout');
                if (selTimeout) selTimeout.value = prefs.interFrameTimeout;
            }

            if (prefs.startAngle !== undefined) {
                this._discAngleDeg = prefs.startAngle;
                this._prevAngleDeg  = prefs.startAngle;
                const slider = document.getElementById('sliderStartAngle');
                const label  = document.getElementById('labelStartAngle');
                if (slider) slider.value = prefs.startAngle;
                if (label)  label.textContent = prefs.startAngle + '°';
                const canvas = document.getElementById('chartCanvas');
                if (canvas) canvas.style.transform = `rotate(${prefs.startAngle}deg)`;
            }

            if (prefs.armMountAngle !== undefined) {
                this._renderer._armMountAngle = prefs.armMountAngle;
                const slider = document.getElementById('sliderArmMountAngle');
                const label  = document.getElementById('labelArmMountAngle');
                if (slider) slider.value = prefs.armMountAngle;
                if (label)  label.textContent = prefs.armMountAngle + '°';
            }

            if (prefs.penDrawAngle !== undefined) {
                this._renderer._penDrawAngle = prefs.penDrawAngle;
                const slider = document.getElementById('sliderPenDrawAngle');
                const label  = document.getElementById('labelPenDrawAngle');
                if (slider) slider.value = prefs.penDrawAngle;
                if (label)  label.textContent = prefs.penDrawAngle + '°';
            }

            if (prefs.openConfigCard) {
                const configPanel = document.getElementById('config-panel');
                if (configPanel) {
                    const card = configPanel.querySelector(`#${prefs.openConfigCard}`);
                    if (card) {
                        configPanel.querySelectorAll('.font-status-card').forEach(c => c.classList.add('collapsed'));
                        card.classList.remove('collapsed');
                    }
                }
            }

            this._renderer._drawDiscBackground();
        } catch (e) {
            console.warn('[CR-EMU] Failed to load preferences:', e);
        }
    }
}

export function initApp() {
    window.app = new AppController();
}

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});
