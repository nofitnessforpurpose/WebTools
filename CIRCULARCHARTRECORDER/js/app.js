/**
 * AppController — Main application orchestrator for Chart Recorder Emulator.
 * Handles UI interactions, config panel, serial controls, preferences persistence,
 * live simulation, and chart/trend rendering coordination.
 */
class AppController {
    constructor() {
        this._emulator = new ChartRecorderEmulator({
            stationAddress: 1,
            baudRate: 9600,
            onStateChange: (state) => this._handleStateChange(state),
            onFrameProcessed: (rx, tx) => this._handleFrameProcessed(rx, tx),
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
            this._logSample();
            this._updateTrend();
        });

        this._init();
    }

    _init() {
        UIController.initSidebars();
        this._initControls();
        this._initConfig();
        this._initSessionStorage();
        this._initOperations();
        this._initSimulation();

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

    /* ------------------------------------------------------------------
       Controls Panel (Serial connection, OPL transfer, Frame Injection)
    ------------------------------------------------------------------ */

    _initControls() {
        /* Connect / Disconnect button */
        const btnConnect = document.getElementById('btnSerialConnect');
        if (btnConnect) {
            btnConnect.addEventListener('click', () => this._emulator.connect());
        }

        /* OPL procedure code generator helper (Strict Psion Organiser II OPL & COMMS Link) */
        const getOplCode = () => `CHART:
  REM (c) NFfP 2026
  LOCAL p1,p2,dp1,dp2,c$(32),k%
  CLS
  PRINT "Set Chart Speed"
  AT 1,2 : PRINT "2-Min/Rev (Fast)"
  PAUSE 25
  p1=25.0 : p2=60.0
  dp1=1.5 : dp2=-1.2
  CLS
  AT 1,2 : PRINT "Q = Quit"
  WHILE 1
    c$="$P1="+FIX$(p1,1,5)+",P2="+FIX$(p2,1,5)+CHR$(13)+CHR$(10)
    LPRINT c$
    AT 1,1 : PRINT "P1:";FIX$(p1,1,4);" P2:";FIX$(p2,1,4)
    p1=p1+dp1
    IF p1>180.0 OR p1<10.0 : dp1=-dp1 : ENDIF
    p2=p2+dp2
    IF p2>170.0 OR p2<15.0 : dp2=-dp2 : ENDIF
    PAUSE 10
    k%=KEY
    IF k%=81 OR k%=113
      BREAK
    ENDIF
  ENDWH
  CLS
  PRINT "Stopped."
`;

        /* Send OPL code via Web Serial connection with Transfer Wizard UI */
        const btnSendOPL = document.getElementById('btnSendOPLSerial');
        const statusBox  = document.getElementById('oplTransferStatus');
        const labelEl    = document.getElementById('oplTransferLabel');
        const percentEl  = document.getElementById('oplTransferPercent');
        const barEl      = document.getElementById('oplProgressBar');

        if (btnSendOPL) {
            btnSendOPL.addEventListener('click', async () => {
                if (!this._emulator._running || !this._emulator._writer) {
                    this._showToast('Select Psion serial port to begin transfer...', 'fa-plug');
                    await this._emulator.connect();
                    if (!this._emulator._running || !this._emulator._writer) {
                        return;
                    }
                }

                const wasMotorRunning = this._motorRunning;
                if (wasMotorRunning) {
                    this._stopMotor();
                }

                btnSendOPL.disabled = true;
                if (statusBox) statusBox.style.display = 'block';
                if (labelEl)   labelEl.textContent   = 'Transferring CHART.OPL...';
                if (percentEl) percentEl.textContent = '0%';
                if (barEl)     barEl.style.width     = '0%';

                const code = getOplCode();
                const ok = await this._emulator.transferTextChunks(code, (sent, total) => {
                    const pct = Math.round((sent / total) * 100);
                    if (percentEl) percentEl.textContent = `${pct}%`;
                    if (barEl)     barEl.style.width     = `${pct}%`;
                });

                if (ok) {
                    if (labelEl) labelEl.textContent = 'Transfer Complete!';
                    this._showToast('CHART.OPL transfer completed successfully.', 'fa-paper-plane');
                } else {
                    if (labelEl) labelEl.textContent = 'Transfer Failed';
                    this._showToast('Serial transfer interrupted or port closed.', 'fa-triangle-exclamation', true);
                }

                if (wasMotorRunning) {
                    this._startMotor();
                }

                setTimeout(() => {
                    btnSendOPL.disabled = false;
                    if (statusBox) statusBox.style.display = 'none';
                }, 2500);
            });
        }

        /* Download OPL Sample file */
        const btnDownloadOPL = document.getElementById('btnDownloadOPL');
        if (btnDownloadOPL) {
            btnDownloadOPL.addEventListener('click', () => {
                const blob = new Blob([getOplCode()], { type: 'text/plain;charset=utf-8' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = 'CHART.OPL';
                a.click();
                this._showToast('CHART.OPL saved as file.', 'fa-file-arrow-down');
            });
        }

        /* Hex/ASCII frame injector */
        const btnInject = document.getElementById('btnInjectFrame');
        if (btnInject) {
            btnInject.addEventListener('click', () => {
                const inputEl = document.getElementById('rawFrameInput');
                const hex = inputEl ? inputEl.value.trim() : '';
                if (!hex) return;
                this._emulator.injectHexFrame(hex);
                this._showToast('Frame injected into parser.', 'fa-syringe');
            });
        }

        /* Serial baud rate / parity / data bits / stop bits / flow control */
        const applySerialParams = () => {
            const elBaud = document.getElementById('selectBaudRate');
            const elParity = document.getElementById('selectParity');
            const elData = document.getElementById('selectDataBits');
            const elStop = document.getElementById('selectStopBits');
            if (elBaud)   this._emulator._baudRate = parseInt(elBaud.value, 10);
            if (elParity) this._emulator._parity   = elParity.value;
            if (elData)   this._emulator._dataBits = parseInt(elData.value, 10);
            if (elStop)   this._emulator._stopBits = parseInt(elStop.value, 10);

            const chkXon = document.getElementById('chkXonXoff');
            if (chkXon) this._emulator._flowControl = chkXon.checked ? 'xonxoff' : 'none';
            const chkHw  = document.getElementById('chkHwFlow');
            if (chkHw) this._emulator._hwFlowControl = chkHw.checked;

            this._savePreferences();
        };

        ['selectBaudRate','selectParity','selectDataBits','selectStopBits']
            .forEach(id => {
                const el = document.getElementById(id);
                if (el) el.addEventListener('change', applySerialParams);
            });
        ['chkXonXoff', 'chkHwFlow'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('change', applySerialParams);
        });

        /* Focus mode toggle */
        const chkFocusMode = document.getElementById('chkFocusMode');
        if (chkFocusMode) {
            chkFocusMode.addEventListener('change', (e) => {
                document.body.classList.toggle('focus-mode', e.target.checked);
                this._savePreferences();
            });
        }
    }

    /* ------------------------------------------------------------------
       Config Panel
    ------------------------------------------------------------------ */

    _initConfig() {
        const btnApply = document.getElementById('btnApplyConfig');
        if (btnApply) {
            btnApply.addEventListener('click', () => {
                this._applyConfig();
                this._showToast('Configuration applied.', 'fa-check');
            });
        }

        const btnReset = document.getElementById('btnResetConfig');
        if (btnReset) {
            btnReset.addEventListener('click', () => {
                this._emulator.device._applyDefaults();
                this._syncConfigUI();
                this._showToast('Configuration reset to defaults.', 'fa-arrow-rotate-left');
            });
        }

        /* Accordion Collapsible cards — only 1 card open at a time within any sidebar tab/panel */
        document.querySelectorAll('.sidebar-panel').forEach(panel => {
            panel.querySelectorAll('.font-status-card .card-header-label').forEach(label => {
                label.addEventListener('click', () => {
                    const card = label.closest('.font-status-card');
                    if (!card) return;
                    const isCurrentlyCollapsed = card.classList.contains('collapsed');

                    panel.querySelectorAll('.font-status-card').forEach(c => {
                        c.classList.add('collapsed');
                    });

                    if (isCurrentlyCollapsed) {
                        card.classList.remove('collapsed');
                    }

                    if (panel.id === 'config-panel') {
                        this._savePreferences();
                    }
                });
            });
        });

        /* Protocol selector — Modbus RTU vs Simple ASCII */
        const selProto = document.getElementById('selectProtocol');
        if (selProto) {
            selProto.addEventListener('change', (e) => {
                this._emulator._parser._protocol = e.target.value;
                this._updateProtocolUI(e.target.value);
                this._savePreferences();
                this._showToast(`Protocol changed to ${e.target.value === 'ascii' ? 'Simple ASCII' : 'Modbus RTU'}.`, 'fa-network-wired');
            });
        }

        /* Inter-frame timeout selector */
        const selTimeout = document.getElementById('selectFrameTimeout');
        if (selTimeout) {
            selTimeout.addEventListener('change', (e) => {
                const ms = parseInt(e.target.value, 10);
                this._emulator.setInterFrameTimeout(ms);
                this._savePreferences();
                this._showToast(`Inter-frame timeout set to ${ms} ms.`, 'fa-clock');
            });
        }

        /* Active Pen Count selector (1–4) */
        const selPenCount = document.getElementById('selectPenCount');
        if (selPenCount) {
            selPenCount.addEventListener('change', (e) => {
                const count = parseInt(e.target.value, 10);
                this._renderer._penCount = count;
                this._updateActivePenUI(count);
                this._savePreferences();
            });
        }

        /* Individual Pen Color Selectors */
        for (let i = 1; i <= 4; i++) {
            const el = document.getElementById(`selectPen${i}Color`);
            if (el) {
                el.addEventListener('change', (e) => {
                    this._renderer._penColors[i - 1] = e.target.value;
                    this._updatePenColorIndicators(i, e.target.value);
                    this._savePreferences();
                });
            }
        }

        /* Grid style select */
        const selGridStyle = document.getElementById('selectGridStyle');
        if (selGridStyle) {
            selGridStyle.addEventListener('change', (e) => {
                this._renderer._gridStyle = e.target.value;
                this._renderer._drawDiscBackground();
                this._savePreferences();
            });
        }

        /* Scale Value Labels mode select (Single Primary Arc vs Every Time Arc) */
        const selectScaleMode = document.getElementById('selectScaleLabelMode');
        if (selectScaleMode) {
            selectScaleMode.addEventListener('change', (e) => {
                this._renderer._scaleLabelMode = e.target.value;
                this._renderer._drawDiscBackground();
                this._savePreferences();
            });
        }

        /* Paper stock / colour theme select — apply immediately */
        const selPaperStock = document.getElementById('selectPaperStock');
        if (selPaperStock) {
            selPaperStock.addEventListener('change', (e) => {
                this._renderer._paperStock = e.target.value;
                this._renderer._drawDiscBackground();
                this._savePreferences();
            });
        }

        /* Grid line & arc colour select — apply immediately */
        const selGridColor = document.getElementById('selectGridColor');
        if (selGridColor) {
            selGridColor.addEventListener('change', (e) => {
                this._renderer._gridColor = e.target.value;
                this._renderer._drawDiscBackground();
                this._savePreferences();
            });
        }

        /* Pre-printed text colour select — apply immediately */
        const selTextColor = document.getElementById('selectTextColor');
        if (selTextColor) {
            selTextColor.addEventListener('change', (e) => {
                this._renderer._textColor = e.target.value;
                this._renderer._drawDiscBackground();
                this._savePreferences();
            });
        }

        /* Zebra outer rim checkbox */
        const chkZebra = document.getElementById('chkShowZebra');
        if (chkZebra) {
            chkZebra.addEventListener('change', (e) => {
                this._renderer._showZebra = e.target.checked;
                this._renderer._drawDiscBackground();
                this._savePreferences();
            });
        }

        /* Ink blending checkbox */
        const chkInkBlend = document.getElementById('chkInkBlending');
        if (chkInkBlend) {
            chkInkBlend.addEventListener('change', (e) => {
                this._renderer._inkBlending = e.target.checked;
                this._savePreferences();
            });
        }

        /* Start Rotation Angle slider — sets initial chart disc orientation (0–360°, 1° step) */
        const sliderStartAngle = document.getElementById('sliderStartAngle');
        const labelStartAngle  = document.getElementById('labelStartAngle');
        const setStartAngle = (val) => {
            let angle = Math.round(val) % 360;
            if (angle < 0) angle += 360;
            if (sliderStartAngle) sliderStartAngle.value = angle;
            if (labelStartAngle) labelStartAngle.textContent = angle + '°';
            this._discAngleDeg = angle;
            const canvasEl = document.getElementById('chartCanvas');
            if (canvasEl) canvasEl.style.transform = `rotate(${angle.toFixed(4)}deg)`;
            this._updateAlignmentMarkerPosition(angle);
            this._savePreferences();
        };
        if (sliderStartAngle && labelStartAngle) {
            sliderStartAngle.addEventListener('input', () => setStartAngle(parseFloat(sliderStartAngle.value)));
            const btnUp = document.getElementById('btnStartAngleUp');
            const btnDown = document.getElementById('btnStartAngleDown');
            if (btnUp) btnUp.addEventListener('click', () => setStartAngle(parseFloat(sliderStartAngle.value) + 1));
            if (btnDown) btnDown.addEventListener('click', () => setStartAngle(parseFloat(sliderStartAngle.value) - 1));
        }

        /* Chart disc rotation jog controls */
        const jogRotation = (deltaDeg) => {
            let newAngle = (this._discAngleDeg + deltaDeg) % 360;
            if (newAngle < 0) newAngle += 360;
            setStartAngle(newAngle);
        };

        const btnJogL = document.getElementById('btnJogLeft');
        const btnJogR = document.getElementById('btnJogRight');
        if (btnJogL) btnJogL.addEventListener('click', () => jogRotation(-1));
        if (btnJogR) btnJogR.addEventListener('click', () => jogRotation(1));

        window.addEventListener('keydown', (e) => {
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                jogRotation(-1);
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                jogRotation(1);
            }
        });

        /* Grid Line Weight Sliders — apply immediately on input */
        const wireWeightSlider = (sliderId, labelId, propName) => {
            const slider = document.getElementById(sliderId);
            const label  = document.getElementById(labelId);
            if (slider && label) {
                slider.addEventListener('input', () => {
                    const val = parseFloat(slider.value);
                    label.textContent = val.toFixed(1) + 'px';
                    this._renderer[propName] = val;
                    this._renderer._drawDiscBackground();
                    this._savePreferences();
                });
            }
        };

        wireWeightSlider('sliderMainRadialWidth', 'labelMainRadialWidth', '_mainRadialWidth');
        wireWeightSlider('sliderSubRadialWidth',  'labelSubRadialWidth',  '_subRadialWidth');
        wireWeightSlider('sliderMajorRingWidth',  'labelMajorRingWidth',  '_majorRingWidth');
        wireWeightSlider('sliderSubRingWidth',    'labelSubRingWidth',    '_subRingWidth');

        /* Export resolution select — apply immediately */
        const selExportRes = document.getElementById('selectExportRes');
        if (selExportRes) {
            selExportRes.addEventListener('change', (e) => {
                this._renderer._exportResMultiplier = parseInt(e.target.value, 10);
                this._savePreferences();
            });
        }

        /* Arm mount angle slider — apply immediately on change/input (1° step) */
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

        /* Pen draw angle slider — apply immediately on change/input (1° step) */
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

        /* Calibration Mode checkbox & Arm Sweep Position slider */
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

        /* Drive Start / Stop button cluster listeners */
        const btnStart = document.getElementById('btnDriveStart');
        const btnStop  = document.getElementById('btnDriveStop');
        if (btnStart) {
            btnStart.addEventListener('click', () => {
                if (!this._motorRunning) {
                    this._startMotor();
                    this._showToast('Chart paper drive started.', 'fa-play');
                }
            });
        }
        if (btnStop) {
            btnStop.addEventListener('click', () => {
                if (this._motorRunning) {
                    this._stopMotor();
                    this._showToast('Chart paper drive stopped.', 'fa-pause');
                }
            });
        }

        /* Chart speed select — apply immediately on change */
        const selChartSpeed = document.getElementById('selectChartSpeed');
        if (selChartSpeed) {
            selChartSpeed.addEventListener('change', (e) => {
                const speed = parseInt(e.target.value, 10);
                this._emulator.device.writeSingleRegister(VirtualDevice.REG.CHART_SPEED, speed);
                this._savePreferences();
            });
        }

        /* Trace width — apply immediately on change */
        const selTraceWidth = document.getElementById('selectTraceWidth');
        if (selTraceWidth) {
            selTraceWidth.addEventListener('change', (e) => {
                this._renderer._traceLineWidth = parseFloat(e.target.value);
                this._savePreferences();
            });
        }

        /* Trend strip visibility toggle — apply immediately */
        const chkShowTrend = document.getElementById('chkShowTrend');
        if (chkShowTrend) {
            chkShowTrend.addEventListener('change', (e) => {
                const panel = document.querySelector('.trend-strip-panel');
                if (panel) panel.classList.toggle('hidden', !e.target.checked);
                this._savePreferences();
            });
        }
    }

    /* ------------------------------------------------------------------
       Session Storage & Cross-Session Persistence (4 Slots)
    ------------------------------------------------------------------ */

    _initSessionStorage() {
        this._activeSessionSlot = 1;
        this._sessionStorageKey = 'chart_emulator_session_slots';

        const selSlot   = document.getElementById('selectSessionSlot');
        const inputName = document.getElementById('inputSessionName');
        const btnSave   = document.getElementById('btnSaveSession');
        const btnLoad   = document.getElementById('btnLoadSession');
        const btnClear  = document.getElementById('btnClearSession');

        if (selSlot) {
            selSlot.addEventListener('change', () => {
                this._updateSessionUI();
            });
        }

        if (inputName) {
            inputName.addEventListener('change', () => {
                const slotId = selSlot ? parseInt(selSlot.value, 10) : 1;
                const slots  = this._getAllSessionSlots();
                if (slots[slotId]) {
                    slots[slotId].name = inputName.value.trim() || `Session Slot ${slotId}`;
                    localStorage.setItem(this._sessionStorageKey, JSON.stringify(slots));
                    this._updateSessionUI();
                }
            });
        }

        if (btnSave) {
            btnSave.addEventListener('click', () => {
                const slotId = selSlot ? parseInt(selSlot.value, 10) : 1;
                const name   = inputName ? inputName.value : '';
                this._saveSessionToSlot(slotId, name);
            });
        }

        if (btnLoad) {
            btnLoad.addEventListener('click', () => {
                const slotId = selSlot ? parseInt(selSlot.value, 10) : 1;
                this._loadSessionFromSlot(slotId);
            });
        }

        if (btnClear) {
            btnClear.addEventListener('click', () => {
                const slotId = selSlot ? parseInt(selSlot.value, 10) : 1;
                this._clearSessionSlot(slotId);
            });
        }

        /* Auto-save interval (every 10s if checked and motor is running) */
        if (this._autoSaveInterval) {
            clearInterval(this._autoSaveInterval);
        }
        this._autoSaveInterval = setInterval(() => {
            const chkAuto = document.getElementById('chkAutoSaveSession');
            if (chkAuto && chkAuto.checked && this._motorRunning) {
                const slotId = selSlot ? parseInt(selSlot.value, 10) : (this._activeSessionSlot || 1);
                const nameEl = document.getElementById('inputSessionName');
                const name   = nameEl ? nameEl.value : `Session Slot ${slotId}`;
                const traceData = this._renderer.getTraceData();

                if (traceData && traceData.length > 0) {
                    const slots = this._getAllSessionSlots();
                    const nowIso = new Date().toISOString();
                    let startTime = nowIso;
                    if (slots[slotId] && slots[slotId].startTime) {
                        startTime = slots[slotId].startTime;
                    } else if (traceData[0] && traceData[0].timestamp) {
                        startTime = traceData[0].timestamp;
                    }

                    slots[slotId] = {
                        slotId: slotId,
                        name: (name && name.trim()) ? name.trim() : `Session Slot ${slotId}`,
                        startTime: startTime,
                        lastTime: nowIso,
                        sampleCount: traceData.length,
                        discAngleDeg: this._discAngleDeg,
                        traceHistory: traceData,
                        dataLog: this._dataLog,
                        deviceState: {
                            pen1PV: this._emulator.device.pen1PV,
                            pen2PV: this._emulator.device.pen2PV,
                            scaleHi: this._emulator.device.scaleHi,
                            scaleLo: this._emulator.device.scaleLo,
                            chartSpeed: this._emulator.device.chartSpeed,
                            engUnits: this._emulator.device.engUnits
                        }
                    };
                    this._activeSessionSlot = slotId;
                    try {
                        localStorage.setItem(this._sessionStorageKey, JSON.stringify(slots));
                        this._updateSessionUI();
                    } catch (_) {}
                }
            }
        }, 10000);

        this._updateSessionUI();
    }

    _getAllSessionSlots() {
        try {
            const raw = localStorage.getItem(this._sessionStorageKey || 'chart_emulator_session_slots');
            return raw ? JSON.parse(raw) : {};
        } catch (e) {
            return {};
        }
    }

    _saveSessionToSlot(slotId, friendlyName) {
        try {
            const slots = this._getAllSessionSlots();
            const traceData = this._renderer.getTraceData();
            const nowIso = new Date().toISOString();

            let startTime = nowIso;
            if (slots[slotId] && slots[slotId].startTime) {
                startTime = slots[slotId].startTime;
            } else if (traceData.length > 0 && traceData[0].timestamp) {
                startTime = traceData[0].timestamp;
            }

            const name = (friendlyName && friendlyName.trim()) ? friendlyName.trim() : `Session Slot ${slotId}`;

            slots[slotId] = {
                slotId: slotId,
                name: name,
                startTime: startTime,
                lastTime: nowIso,
                sampleCount: traceData.length,
                discAngleDeg: this._discAngleDeg,
                traceHistory: traceData,
                dataLog: this._dataLog,
                deviceState: {
                    pen1PV: this._emulator.device.pen1PV,
                    pen2PV: this._emulator.device.pen2PV,
                    scaleHi: this._emulator.device.scaleHi,
                    scaleLo: this._emulator.device.scaleLo,
                    chartSpeed: this._emulator.device.chartSpeed,
                    engUnits: this._emulator.device.engUnits
                }
            };

            this._activeSessionSlot = slotId;
            localStorage.setItem(this._sessionStorageKey || 'chart_emulator_session_slots', JSON.stringify(slots));
            this._updateSessionUI();
            this._showToast(`Session saved to Slot ${slotId} ("${name}").`, 'fa-floppy-disk');
        } catch (e) {
            console.warn('[CR-EMU] Save session failed:', e);
            this._showToast('Failed to save session to slot.', 'fa-triangle-exclamation', true);
        }
    }

    _loadSessionFromSlot(slotId) {
        const slots = this._getAllSessionSlots();
        const slotData = slots[slotId];
        if (!slotData) {
            this._showToast(`Slot ${slotId} is empty. Nothing to load.`, 'fa-triangle-exclamation', true);
            return;
        }

        try {
            if (Array.isArray(slotData.traceHistory)) {
                this._renderer.loadTraceData(slotData.traceHistory);
            }

            if (Array.isArray(slotData.dataLog)) {
                this._dataLog = [...slotData.dataLog];
            }

            if (typeof slotData.discAngleDeg === 'number') {
                this._discAngleDeg = slotData.discAngleDeg;
                this._prevAngleDeg = slotData.discAngleDeg;
                const canvasEl = document.getElementById('chartCanvas');
                if (canvasEl) {
                    canvasEl.style.transform = `rotate(${this._discAngleDeg.toFixed(4)}deg)`;
                }
                const sl = document.getElementById('sliderStartAngle');
                const lb = document.getElementById('labelStartAngle');
                if (sl) sl.value = Math.round(slotData.discAngleDeg);
                if (lb) lb.textContent = Math.round(slotData.discAngleDeg) + '°';
                this._updateAlignmentMarkerPosition(this._discAngleDeg);
            }

            if (slotData.deviceState) {
                const st = slotData.deviceState;
                if (typeof st.pen1PV === 'number') this._emulator.device.pen1PV = st.pen1PV;
                if (typeof st.pen2PV === 'number') this._emulator.device.pen2PV = st.pen2PV;
                if (typeof st.scaleHi === 'number') this._emulator.device.scaleHi = st.scaleHi;
                if (typeof st.scaleLo === 'number') this._emulator.device.scaleLo = st.scaleLo;
                if (typeof st.chartSpeed === 'number') this._emulator.device.chartSpeed = st.chartSpeed;
                if (typeof st.engUnits === 'number') this._emulator.device.engUnits = st.engUnits;
                this._syncConfigUI();
                this._updateReadouts();
            }

            this._activeSessionSlot = slotId;
            this._updateSessionUI();
            this._showToast(`Session "${slotData.name}" loaded and ready to resume.`, 'fa-folder-open');
        } catch (e) {
            console.warn('[CR-EMU] Load session failed:', e);
            this._showToast('Failed to load session data.', 'fa-triangle-exclamation', true);
        }
    }

    _clearSessionSlot(slotId) {
        const slots = this._getAllSessionSlots();
        if (!slots[slotId]) {
            this._showToast(`Slot ${slotId} is already empty.`, 'fa-info-circle');
            return;
        }

        const oldName = slots[slotId].name || `Slot ${slotId}`;
        delete slots[slotId];
        localStorage.setItem(this._sessionStorageKey || 'chart_emulator_session_slots', JSON.stringify(slots));

        const inputName = document.getElementById('inputSessionName');
        if (inputName) inputName.value = '';

        this._updateSessionUI();
        this._showToast(`Slot ${slotId} ("${oldName}") cleared.`, 'fa-trash-can');
    }

    _updateSessionUI() {
        const selSlot = document.getElementById('selectSessionSlot');
        const slotId = selSlot ? parseInt(selSlot.value, 10) : 1;
        const slots = this._getAllSessionSlots();
        const current = slots[slotId];

        if (selSlot) {
            for (let i = 1; i <= 4; i++) {
                const opt = selSlot.querySelector(`option[value="${i}"]`);
                if (opt) {
                    const s = slots[i];
                    if (s) {
                        opt.textContent = `Slot ${i}: ${s.name} (${s.sampleCount || 0} pts)`;
                    } else {
                        opt.textContent = `Slot ${i} (Empty)`;
                    }
                }
            }
        }

        const inputName = document.getElementById('inputSessionName');
        const lblStart = document.getElementById('lblSessionStartTime');
        const lblLast  = document.getElementById('lblSessionLastTime');
        const lblPts   = document.getElementById('lblSessionSamples');
        const badge    = document.getElementById('badgeSessionStatus');

        const formatDate = (isoStr) => {
            if (!isoStr) return '—';
            try {
                const d = new Date(isoStr);
                if (isNaN(d.getTime())) return '—';
                return d.toLocaleString(undefined, {
                    year: 'numeric', month: 'short', day: '2-digit',
                    hour: '2-digit', minute: '2-digit', second: '2-digit'
                });
            } catch (_) {
                return '—';
            }
        };

        if (current) {
            if (inputName && document.activeElement !== inputName) {
                inputName.value = current.name || '';
            }
            if (lblStart) lblStart.textContent = formatDate(current.startTime);
            if (lblLast)  lblLast.textContent  = formatDate(current.lastTime);
            if (lblPts)   lblPts.textContent   = `${current.sampleCount || 0} points`;
            if (badge) {
                const isActive = (slotId === this._activeSessionSlot);
                badge.className = isActive ? 'badge online' : 'badge';
                badge.textContent = isActive ? 'ACTIVE' : 'SAVED';
                badge.style.background = isActive ? 'rgba(16,185,129,0.2)' : 'rgba(59,130,246,0.2)';
                badge.style.color = isActive ? '#6ee7b7' : '#93c5fd';
                badge.style.border = isActive ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(59,130,246,0.4)';
            }
        } else {
            if (inputName && document.activeElement !== inputName) {
                inputName.value = '';
            }
            if (lblStart) lblStart.textContent = '—';
            if (lblLast)  lblLast.textContent  = '—';
            if (lblPts)   lblPts.textContent   = '0 points';
            if (badge) {
                badge.className = 'badge offline';
                badge.textContent = 'EMPTY';
                badge.style.background = 'rgba(148,163,184,0.15)';
                badge.style.color = '#94a3b8';
                badge.style.border = '1px solid rgba(148,163,184,0.3)';
            }
        }
    }

    /** Read UI config fields and write them into the VirtualDevice register bank. */
    _applyConfig() {
        const d   = this._emulator.device;
        const R   = VirtualDevice.REG;

        const elAddr = document.getElementById('inputStationAddr');
        const elUnits = document.getElementById('selectEngUnits');
        const elScaleHi = document.getElementById('inputScaleHi');
        const elScaleLo = document.getElementById('inputScaleLo');
        const elPen1 = document.getElementById('inputPen1PV');
        const elPen1Hi = document.getElementById('inputPen1AlarmHi');
        const elPen1Lo = document.getElementById('inputPen1AlarmLo');
        const elPen2 = document.getElementById('inputPen2PV');
        const elPen2Hi = document.getElementById('inputPen2AlarmHi');
        const elPen2Lo = document.getElementById('inputPen2AlarmLo');
        const elSpeed = document.getElementById('selectChartSpeed');
        const elTimeout = document.getElementById('selectFrameTimeout');

        const stationAddr  = elAddr ? parseInt(elAddr.value, 10) : 1;
        const engUnits     = elUnits ? parseInt(elUnits.value, 10) : 0;
        const scaleHi      = elScaleHi ? parseFloat(elScaleHi.value) : 200.0;
        const scaleLo      = elScaleLo ? parseFloat(elScaleLo.value) : 0.0;
        const pen1PV       = elPen1 ? parseFloat(elPen1.value) : 25.0;
        const pen1AlarmHi  = elPen1Hi ? parseFloat(elPen1Hi.value) : 150.0;
        const pen1AlarmLo  = elPen1Lo ? parseFloat(elPen1Lo.value) : 5.0;
        const pen2PV       = elPen2 ? parseFloat(elPen2.value) : 60.0;
        const pen2AlarmHi  = elPen2Hi ? parseFloat(elPen2Hi.value) : 150.0;
        const pen2AlarmLo  = elPen2Lo ? parseFloat(elPen2Lo.value) : 5.0;
        const chartSpeed   = elSpeed ? parseInt(elSpeed.value, 10) : 20;
        const frameTimeout = elTimeout ? parseInt(elTimeout.value, 10) : 10;

        this._emulator.setStationAddress(stationAddr);
        this._emulator.setInterFrameTimeout(frameTimeout);

        d.writeSingleRegister(R.ENG_UNITS,    engUnits);
        d.writeSingleRegister(R.SCALE_HI,     Math.round(scaleHi * 10));
        d.writeSingleRegister(R.SCALE_LO,     Math.round(scaleLo * 10));
        d.writeSingleRegister(R.CHART_SPEED,  chartSpeed);
        d.writeSingleRegister(R.PEN1_ALARM_HI,Math.round(pen1AlarmHi * 10));
        d.writeSingleRegister(R.PEN1_ALARM_LO,Math.round(pen1AlarmLo * 10));
        d.writeSingleRegister(R.PEN2_ALARM_HI,Math.round(pen2AlarmHi * 10));
        d.writeSingleRegister(R.PEN2_ALARM_LO,Math.round(pen2AlarmLo * 10));
        d.pen1PV = pen1PV;
        d.pen2PV = pen2PV;

        this._updateReadouts();
        this._savePreferences();
    }

    /** Persist current user preferences to localStorage. */
    _savePreferences() {
        try {
            const sliderStart = document.getElementById('sliderStartAngle');
            const chkTrend = document.getElementById('chkShowTrend');
            const chkFocus = document.getElementById('chkFocusMode');

            const prefs = {
                protocol:        this._emulator._parser._protocol,
                penCount:        this._renderer._penCount,
                penColors:       this._renderer._penColors,
                gridStyle:       this._renderer._gridStyle,
                paperStock:      this._renderer._paperStock,
                gridColor:       this._renderer._gridColor,
                textColor:       this._renderer._textColor,
                showZebra:       this._renderer._showZebra,
                inkBlending:     this._renderer._inkBlending,
                mainRadialWidth: this._renderer._mainRadialWidth,
                subRadialWidth:  this._renderer._subRadialWidth,
                majorRingWidth:  this._renderer._majorRingWidth,
                subRingWidth:    this._renderer._subRingWidth,
                startAngle:      sliderStart ? parseFloat(sliderStart.value) : 343,
                exportRes:       this._renderer._exportResMultiplier,
                armMountAngle:   this._renderer._armMountAngle,
                penDrawAngle:    this._renderer._penDrawAngle,
                traceLineWidth:  this._renderer._traceLineWidth,
                scaleLabelMode:  this._renderer._scaleLabelMode,
                flowControl:     this._emulator._flowControl,
                hwFlowControl:   this._emulator._hwFlowControl,
                showTrend:       chkTrend ? chkTrend.checked : true,
                focusMode:       chkFocus ? chkFocus.checked : false,
                chartSpeed:      this._emulator.device.chartSpeed,
                scaleHi:         this._emulator.device.scaleHi,
                scaleLo:         this._emulator.device.scaleLo,
                openConfigCard:  (() => {
                    const el = document.querySelector('#config-panel .font-status-card:not(.collapsed)');
                    return el ? el.id : null;
                })(),
            };
            localStorage.setItem('chart_emulator_prefs', JSON.stringify(prefs));
        } catch (e) {
            /* Ignore storage quota exceptions */
        }
    }

    /** Restore user preferences from localStorage. */
    _loadPreferences() {
        try {
            const raw = localStorage.getItem('chart_emulator_prefs');
            if (!raw) return;
            const prefs = JSON.parse(raw);

            const configCards = document.querySelectorAll('#config-panel .font-status-card');
            configCards.forEach(c => c.classList.add('collapsed'));
            if (prefs.openConfigCard) {
                const openCard = document.getElementById(prefs.openConfigCard);
                if (openCard) openCard.classList.remove('collapsed');
            }

            if (prefs.flowControl) {
                this._emulator._flowControl = prefs.flowControl;
                const chk = document.getElementById('chkXonXoff');
                if (chk) chk.checked = (prefs.flowControl === 'xonxoff');
            }

            if (typeof prefs.hwFlowControl === 'boolean') {
                this._emulator._hwFlowControl = prefs.hwFlowControl;
                const chk = document.getElementById('chkHwFlow');
                if (chk) chk.checked = prefs.hwFlowControl;
            }

            if (prefs.protocol) {
                this._emulator._parser._protocol = prefs.protocol;
                const sel = document.getElementById('selectProtocol');
                if (sel) sel.value = prefs.protocol;
                this._updateProtocolUI(prefs.protocol);
            } else {
                this._updateProtocolUI(this._emulator._parser._protocol);
            }

            if (typeof prefs.penCount === 'number') {
                this._renderer._penCount = prefs.penCount;
                const sel = document.getElementById('selectPenCount');
                if (sel) sel.value = String(prefs.penCount);
                this._updateActivePenUI(prefs.penCount);
            } else {
                this._updateActivePenUI(1);
            }

            if (Array.isArray(prefs.penColors)) {
                this._renderer._penColors = prefs.penColors;
                for (let i = 1; i <= 4; i++) {
                    if (prefs.penColors[i - 1]) {
                        const sel = document.getElementById(`selectPen${i}Color`);
                        if (sel) sel.value = prefs.penColors[i - 1];
                        this._updatePenColorIndicators(i, prefs.penColors[i - 1]);
                    }
                }
            }

            if (typeof prefs.showZebra === 'boolean') {
                this._renderer._showZebra = prefs.showZebra;
                const chk = document.getElementById('chkShowZebra');
                if (chk) chk.checked = prefs.showZebra;
            }

            if (typeof prefs.inkBlending === 'boolean') {
                this._renderer._inkBlending = prefs.inkBlending;
                const chk = document.getElementById('chkInkBlending');
                if (chk) chk.checked = prefs.inkBlending;
            }

            const restoreSlider = (sliderId, labelId, propName, prefVal, suffix = 'px') => {
                if (typeof prefVal === 'number') {
                    this._renderer[propName] = prefVal;
                    const slider = document.getElementById(sliderId);
                    const label  = document.getElementById(labelId);
                    if (slider) slider.value = prefVal;
                    if (label)  label.textContent = prefVal + suffix;
                }
            };

            restoreSlider('sliderMainRadialWidth', 'labelMainRadialWidth', '_mainRadialWidth', prefs.mainRadialWidth);
            restoreSlider('sliderSubRadialWidth',  'labelSubRadialWidth',  '_subRadialWidth',  prefs.subRadialWidth);
            restoreSlider('sliderMajorRingWidth',  'labelMajorRingWidth',  '_majorRingWidth',  prefs.majorRingWidth);
            restoreSlider('sliderSubRingWidth',    'labelSubRingWidth',    '_subRingWidth',    prefs.subRingWidth);

            if (prefs.gridStyle) {
                this._renderer._gridStyle = prefs.gridStyle;
                const el = document.getElementById('selectGridStyle');
                if (el) el.value = prefs.gridStyle;
            }
            if (prefs.paperStock) {
                this._renderer._paperStock = prefs.paperStock;
                const el = document.getElementById('selectPaperStock');
                if (el) el.value = prefs.paperStock;
            }
            if (prefs.gridColor) {
                this._renderer._gridColor = prefs.gridColor;
                const el = document.getElementById('selectGridColor');
                if (el) el.value = prefs.gridColor;
            }
            if (prefs.textColor) {
                this._renderer._textColor = prefs.textColor;
                const el = document.getElementById('selectTextColor');
                if (el) el.value = prefs.textColor;
            }
            if (prefs.exportRes) {
                this._renderer._exportResMultiplier = prefs.exportRes;
                const el = document.getElementById('selectExportRes');
                if (el) el.value = String(prefs.exportRes);
            }
            if (prefs.scaleLabelMode) {
                this._renderer._scaleLabelMode = prefs.scaleLabelMode;
                const sel = document.getElementById('selectScaleLabelMode');
                if (sel) sel.value = prefs.scaleLabelMode;
            }

            if (typeof prefs.startAngle === 'number') {
                this._discAngleDeg = prefs.startAngle;
                const sl = document.getElementById('sliderStartAngle');
                const lb = document.getElementById('labelStartAngle');
                if (sl) sl.value = prefs.startAngle;
                if (lb) lb.textContent = Math.round(prefs.startAngle) + '°';
                const canvasEl = document.getElementById('chartCanvas');
                if (canvasEl) canvasEl.style.transform = `rotate(${prefs.startAngle.toFixed(4)}deg)`;
            } else {
                this._discAngleDeg = 343;
                const sl = document.getElementById('sliderStartAngle');
                const lb = document.getElementById('labelStartAngle');
                if (sl) sl.value = 343;
                if (lb) lb.textContent = '343°';
                const canvasEl = document.getElementById('chartCanvas');
                if (canvasEl) canvasEl.style.transform = 'rotate(343.0000deg)';
            }
            this._updateAlignmentMarkerPosition(this._discAngleDeg);

            if (typeof prefs.armMountAngle === 'number') {
                this._renderer._armMountAngle = prefs.armMountAngle;
                const sl = document.getElementById('sliderArmMountAngle');
                const lb = document.getElementById('labelArmMountAngle');
                if (sl) sl.value = prefs.armMountAngle;
                if (lb) lb.textContent = Math.round(prefs.armMountAngle) + '°';
            }
            if (typeof prefs.penDrawAngle === 'number') {
                this._renderer._penDrawAngle = prefs.penDrawAngle;
                const sl = document.getElementById('sliderPenDrawAngle');
                const lb = document.getElementById('labelPenDrawAngle');
                if (sl) sl.value = prefs.penDrawAngle;
                if (lb) lb.textContent = Math.round(prefs.penDrawAngle) + '°';
            }
            if (typeof prefs.traceLineWidth === 'number') {
                this._renderer._traceLineWidth = prefs.traceLineWidth;
                const el = document.getElementById('selectTraceWidth');
                if (el) el.value = String(prefs.traceLineWidth);
            }
            if (typeof prefs.showTrend === 'boolean') {
                const chk = document.getElementById('chkShowTrend');
                if (chk) chk.checked = prefs.showTrend;
                const panel = document.querySelector('.trend-strip-panel');
                if (panel) panel.classList.toggle('hidden', !prefs.showTrend);
            }
            if (typeof prefs.focusMode === 'boolean') {
                const chk = document.getElementById('chkFocusMode');
                if (chk) chk.checked = prefs.focusMode;
                document.body.classList.toggle('focus-mode', prefs.focusMode);
            }
            if (typeof prefs.chartSpeed === 'number') {
                this._emulator.device.writeSingleRegister(VirtualDevice.REG.CHART_SPEED, prefs.chartSpeed);
                const el = document.getElementById('selectChartSpeed');
                if (el) el.value = String(prefs.chartSpeed);
            }
            if (typeof prefs.scaleHi === 'number' && typeof prefs.scaleLo === 'number') {
                this._emulator.device.writeSingleRegister(VirtualDevice.REG.SCALE_HI, Math.round(prefs.scaleHi * 10));
                const hiEl = document.getElementById('inputScaleHi');
                if (hiEl) hiEl.value = prefs.scaleHi.toFixed(1);

                this._emulator.device.writeSingleRegister(VirtualDevice.REG.SCALE_LO, Math.round(prefs.scaleLo * 10));
                const loEl = document.getElementById('inputScaleLo');
                if (loEl) loEl.value = prefs.scaleLo.toFixed(1);
            }

            this._renderer._drawDiscBackground();
            this._updatePenArmState();
        } catch (e) {
            console.warn('[CR-EMU] Clearing corrupted localStorage preferences:', e);
            localStorage.removeItem('chart_emulator_prefs');
        }
    }

    /** Update UI visibility & button states for protocol-specific elements. */
    _updateProtocolUI(protocolMode) {
        const isAscii = (protocolMode === 'ascii');
        document.querySelectorAll('.opl-only-element').forEach(el => {
            el.style.display = isAscii ? '' : 'none';
        });
        document.querySelectorAll('.modbus-only-element').forEach(el => {
            el.style.display = isAscii ? 'none' : '';
        });

        const btnSend = document.getElementById('btnSendOPLSerial');
        if (btnSend) {
            btnSend.disabled = !isAscii;
            btnSend.title = isAscii
                ? 'Transfer CHART.OPL procedure to Psion Organiser II'
                : 'OPL Transfer requires Simple ASCII protocol mode';
        }
    }

    /** Update UI visibility for active pen count (1..4). */
    _updateActivePenUI(count) {
        for (let i = 1; i <= 4; i++) {
            const readout = document.getElementById(`pen${i}Readout`);
            const card    = document.getElementById(`cardPen${i}`);
            if (readout) readout.style.display = (i <= count) ? 'flex' : 'none';
            if (card)    card.style.display    = (i <= count) ? 'flex' : 'none';
        }
        this._updatePenArmState();
    }

    /** Update indicator dot background colors for Pen i. */
    _updatePenColorIndicators(i, color) {
        const dot = document.getElementById(`dotPen${i}`);
        const cfgDot = document.getElementById(`dotConfigPen${i}`);
        if (dot) dot.style.background = color;
        if (cfgDot) cfgDot.style.background = color;
        this._updatePenArmState();
    }

    /** Smoothly animate pen arms to a target set of normalized values. */
    _animatePenArmsTo(targetNorms, durationMs = 1200, onComplete = null) {
        if (this._penAnimFrameId) {
            cancelAnimationFrame(this._penAnimFrameId);
            this._penAnimFrameId = null;
        }

        const startNorms = this._currentPenNorms ? [...this._currentPenNorms] : [0.5, 0.5, 0.5, 0.5];
        const startTime = performance.now();

        const animStep = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(1, elapsed / durationMs);
            const ease = 1 - Math.pow(1 - progress, 3);

            const interpolatedNorms = startNorms.map((startVal, i) => {
                const targetVal = targetNorms[i] !== undefined ? targetNorms[i] : 1.15;
                return startVal + (targetVal - startVal) * ease;
            });

            this._currentPenNorms = interpolatedNorms;
            this._renderer.updatePenArms(interpolatedNorms);

            if (progress < 1) {
                this._penAnimFrameId = requestAnimationFrame(animStep);
            } else {
                this._penAnimFrameId = null;
                if (onComplete) onComplete();
            }
        };

        this._penAnimFrameId = requestAnimationFrame(animStep);
    }

    /** Calculate current pen PVs and update SVG pen arms. */
    _updatePenArmState() {
        const chkCalib    = document.getElementById('chkArmCalibration');
        const sliderCalib = document.getElementById('sliderArmCalibration');

        if (chkCalib && chkCalib.checked && sliderCalib) {
            const calibNorm = parseFloat(sliderCalib.value) / 100;
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

    /** Sync config UI inputs from current VirtualDevice state. */
    _syncConfigUI() {
        const d = this._emulator.device;
        const R = VirtualDevice.REG;
        const setVal = (id, v) => {
            const el = document.getElementById(id);
            if (el) el.value = v;
        };

        setVal('inputStationAddr', this._emulator._stationAddress);
        setVal('selectEngUnits', d._bank[R.ENG_UNITS]);
        setVal('selectChartSpeed', String(d.chartSpeed));
        setVal('inputScaleHi', d.scaleHi.toFixed(1));
        setVal('inputScaleLo', d.scaleLo.toFixed(1));
        setVal('inputPen1PV', d.pen1PV.toFixed(2));
        setVal('inputPen1AlarmHi', (d._bank[R.PEN1_ALARM_HI] / 10).toFixed(1));
        setVal('inputPen1AlarmLo', (d._bank[R.PEN1_ALARM_LO] / 10).toFixed(1));
        setVal('inputPen2PV', d.pen2PV.toFixed(2));
        setVal('inputPen2AlarmHi', (d._bank[R.PEN2_ALARM_HI] / 10).toFixed(1));
        setVal('inputPen2AlarmLo', (d._bank[R.PEN2_ALARM_LO] / 10).toFixed(1));
    }

    /** Rotates alignment marker SVG assembly around chart rim. */
    _updateAlignmentMarkerPosition(angleDeg) {
        const marker = document.getElementById('paperAlignmentMarker');
        if (marker && this._renderer) {
            const W = this._renderer._chartCanvas.width || 720;
            const cx = W / 2;
            const cy = W / 2;
            const R = W / 2 - 2;
            const outerScaleR = R * 0.94;
            const drawRad = (this._renderer._penDrawAngle * Math.PI) / 180;

            const outerArcAngleRad = this._renderer._getRefAngleForRadius(outerScaleR, cx, cy, R);
            const kinematicOffsetDeg = (outerArcAngleRad - drawRad) * (180 / Math.PI);

            const rotDeg = (((angleDeg + kinematicOffsetDeg) % 360) + 360) % 360;
            marker.setAttribute('transform', `rotate(${rotDeg.toFixed(2)} 360 360)`);
        }
    }

    /* ------------------------------------------------------------------
       Operations Panel
    ------------------------------------------------------------------ */

    _initOperations() {
        const btnResetRot = document.getElementById('btnResetRotation');
        if (btnResetRot) {
            btnResetRot.addEventListener('click', () => {
                const slider = document.getElementById('sliderStartAngle');
                const startAngle = slider ? parseFloat(slider.value) : 343;
                this._discAngleDeg = startAngle;
                this._prevAngleDeg = startAngle;
                const canvas = document.getElementById('chartCanvas');
                if (canvas) canvas.style.transform = `rotate(${startAngle}deg)`;
                this._showToast(`Chart disc aligned to start rotation (${Math.round(startAngle)}°).`, 'fa-rotate-left');
            });
        }

        const btnClear = document.getElementById('btnClearChart');
        if (btnClear) {
            btnClear.addEventListener('click', () => {
                this._renderer.clearChart();
                if (this._trendRenderer) this._trendRenderer.clear();
                this._dataLog = [];
                this._showToast('Chart history & log cleared.', 'fa-eraser');
            });
        }

        const btnExportChart = document.getElementById('btnExportChart');
        if (btnExportChart) {
            btnExportChart.addEventListener('click', () => {
                const dataUrl = this._renderer.exportChartPNG();
                const a = document.createElement('a');
                a.href     = dataUrl;
                a.download = `chart_${this._timestamp()}.png`;
                a.click();
                this._showToast('Chart exported as high-res PNG.', 'fa-file-arrow-down');
            });
        }

        const btnExportLog = document.getElementById('btnExportLog');
        if (btnExportLog) {
            btnExportLog.addEventListener('click', () => {
                this._exportCSV();
            });
        }

        const btnCopyChart = document.getElementById('btnCopyChart');
        if (btnCopyChart) {
            btnCopyChart.addEventListener('click', () => {
                const dataUrl = this._renderer.exportChartPNG();
                fetch(dataUrl)
                    .then(res => res.blob())
                    .then(blob => navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]))
                    .then(() => this._showToast('High-res chart copied to clipboard.', 'fa-copy'))
                    .catch(() => this._showToast('Clipboard access denied.', 'fa-ban', true));
            });
        }

        const btnResetEmu = document.getElementById('btnResetEmulator');
        if (btnResetEmu) {
            btnResetEmu.addEventListener('click', () => {
                this._emulator.device._applyDefaults();
                this._emulator.resetStats();
                this._syncConfigUI();
                this._renderer.clearChart();
                if (this._trendRenderer) this._trendRenderer.clear();
                this._dataLog = [];
                this._updateReadouts();
                this._showToast('Emulator state reset to factory defaults.', 'fa-power-off');
            });
        }

        const btnResetPrefs = document.getElementById('btnResetPrefs');
        if (btnResetPrefs) {
            btnResetPrefs.addEventListener('click', () => {
                localStorage.removeItem('chart_emulator_prefs');
                this._showToast('Saved preferences cleared. Reloading page...', 'fa-trash-can');
                setTimeout(() => window.location.reload(), 800);
            });
        }
    }

    /* ------------------------------------------------------------------
       Live PV Simulation (sinewave generators)
    ------------------------------------------------------------------ */

    _initSimulation() {
        const slider1 = document.getElementById('sliderPen1Period');
        const label1  = document.getElementById('labelPen1Period');
        if (slider1 && label1) {
            slider1.addEventListener('input', () => { label1.textContent = slider1.value + 's'; });
        }

        const slider2 = document.getElementById('sliderPen2Period');
        const label2  = document.getElementById('labelPen2Period');
        if (slider2 && label2) {
            slider2.addEventListener('input', () => { label2.textContent = slider2.value + 's'; });
        }

        const sliderN = document.getElementById('sliderNoise');
        const labelN  = document.getElementById('labelNoise');
        if (sliderN && labelN) {
            sliderN.addEventListener('input', () => { labelN.textContent = parseFloat(sliderN.value).toFixed(1); });
        }
    }

    /* ------------------------------------------------------------------
       Chart Motor (disc rotation & trace drawing with Web Worker timer)
    ------------------------------------------------------------------ */

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

    _startMotor() {
        this._motorRunning = true;
        const spinner  = document.getElementById('motorSpinner');
        const btnStart = document.getElementById('btnDriveStart');
        const btnStop  = document.getElementById('btnDriveStop');
        if (spinner)  spinner.classList.add('running');
        if (btnStart) btnStart.classList.add('active');
        if (btnStop)  btnStop.classList.remove('active');

        const chkCalib = document.getElementById('chkArmCalibration');
        if (chkCalib && chkCalib.checked) {
            chkCalib.checked = false;
            chkCalib.dispatchEvent(new Event('change'));
        }

        const d = this._emulator.device;
        const p1 = this._normalisePV(d.pen1PV, d.scaleLo, d.scaleHi);
        const p2 = this._normalisePV(d.pen2PV || (d.scaleLo + (d.scaleHi - d.scaleLo) * 0.3), d.scaleLo, d.scaleHi);
        const p3 = this._normalisePV(d.pen3PV || (d.scaleLo + (d.scaleHi - d.scaleLo) * 0.55), d.scaleLo, d.scaleHi);
        const p4 = this._normalisePV(d.pen4PV || (d.scaleLo + (d.scaleHi - d.scaleLo) * 0.75), d.scaleLo, d.scaleHi);
        this._animatePenArmsTo([p1, p2, p3, p4], 1000);

        if (this._worker) {
            this._worker.terminate();
            this._worker = null;
        }
        if (this._workerFallbackTimer) {
            clearInterval(this._workerFallbackTimer);
            this._workerFallbackTimer = null;
        }

        const onTick = () => {
            if (!this._motorRunning) return;
            const dev = this._emulator.device;
            const pen1 = this._normalisePV(dev.pen1PV, dev.scaleLo, dev.scaleHi);
            const pen2 = this._normalisePV(dev.pen2PV || (dev.scaleLo + (dev.scaleHi - dev.scaleLo) * 0.3), dev.scaleLo, dev.scaleHi);
            const pen3 = this._normalisePV(dev.pen3PV || (dev.scaleLo + (dev.scaleHi - dev.scaleLo) * 0.55), dev.scaleLo, dev.scaleHi);
            const pen4 = this._normalisePV(dev.pen4PV || (dev.scaleLo + (dev.scaleHi - dev.scaleLo) * 0.75), dev.scaleLo, dev.scaleHi);
            const penNorms = [pen1, pen2, pen3, pen4];

            this._renderer.drawPenTraces(penNorms, this._discAngleDeg);
            if (!this._penAnimFrameId) {
                this._currentPenNorms = penNorms;
                this._renderer.updatePenArms(penNorms);
            }
        };

        try {
            const workerCode = `
                let timerId = null;
                self.onmessage = function(e) {
                    if (e.data.action === 'start') {
                        if (timerId) clearInterval(timerId);
                        timerId = setInterval(function() {
                            self.postMessage('tick');
                        }, 100);
                    } else if (e.data.action === 'stop') {
                        if (timerId) clearInterval(timerId);
                        timerId = null;
                    }
                };
            `;
            const blob = new Blob([workerCode], { type: 'application/javascript' });
            this._worker = new Worker(URL.createObjectURL(blob));
            this._worker.onmessage = onTick;
            this._worker.postMessage({ action: 'start' });
        } catch (err) {
            console.warn('[CR-EMU] Worker creation failed (file:// CORS restriction). Falling back to setInterval.', err);
            this._workerFallbackTimer = setInterval(onTick, 100);
        }

        this._startAnimLoop();
    }

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

                    const canvasEl = document.getElementById('chartCanvas');
                    if (canvasEl) {
                        canvasEl.style.transform = `rotate(${this._discAngleDeg.toFixed(4)}deg)`;
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

        if (this._animFrameId) {
            cancelAnimationFrame(this._animFrameId);
            this._animFrameId = null;
        }

        if (this._worker) {
            this._worker.postMessage({ action: 'stop' });
            this._worker.terminate();
            this._worker = null;
        }
        if (this._workerFallbackTimer) {
            clearInterval(this._workerFallbackTimer);
            this._workerFallbackTimer = null;
        }

        this._animatePenArmsTo([1.15, 1.15, 1.15, 1.15], 1200);
    }

    /* ------------------------------------------------------------------
       Trend Strip Sampling
    ------------------------------------------------------------------ */

    _updateTrend() {
        const d = this._emulator.device;
        const p1 = this._normalisePV(d.pen1PV, d.scaleLo, d.scaleHi);
        const p2 = this._normalisePV(d.pen2PV, d.scaleLo, d.scaleHi);
        if (this._trendRenderer) {
            this._trendRenderer.appendSample(p1, p2);
        }
    }

    /* ------------------------------------------------------------------
       State Change Handler
    ------------------------------------------------------------------ */

    _handleStateChange(state) {
        const ledStatus  = document.getElementById('ledStatus');
        const ledRx      = document.getElementById('ledRx');
        const ledTx      = document.getElementById('ledTx');
        const ledAlarm   = document.getElementById('ledAlarm');
        const statusDot  = document.getElementById('controls-status-dot');
        const badge      = document.getElementById('chartStatusBadge');
        const btnConnect = document.getElementById('btnSerialConnect');

        if (badge && btnConnect) {
            switch (state) {
                case 'connected':
                    if (ledStatus) ledStatus.className = 'led led-status connected';
                    if (statusDot) statusDot.className = 'status-dot online';
                    badge.textContent   = 'Online';
                    badge.className     = 'badge online';
                    btnConnect.innerHTML= '<i class="fa-solid fa-plug-circle-xmark"></i> Disconnect';
                    break;

                case 'disconnected':
                case 'idle':
                    if (ledStatus) ledStatus.className = 'led led-status disconnected';
                    if (statusDot) statusDot.className = 'status-dot';
                    badge.textContent   = 'Offline';
                    badge.className     = 'badge offline';
                    btnConnect.innerHTML= '<i class="fa-solid fa-plug"></i> Connect Serial';
                    this._flashLed(ledRx, 'led led-rx', false);
                    this._flashLed(ledTx, 'led led-tx', false);
                    break;

                case 'rx':
                    this._flashLed(ledRx, 'led led-rx active', 80);
                    break;

                case 'tx':
                    this._flashLed(ledTx, 'led led-tx active', 80);
                    break;

                case 'unsupported':
                    const alertEl = document.getElementById('serialAlert');
                    if (alertEl) alertEl.style.display = 'flex';
                    badge.textContent = 'Unsupported';
                    badge.className   = 'badge offline';
                    break;
            }
        }

        this._updateProtocolUI(this._emulator._parser._protocol);

        if (ledAlarm) {
            if (this._emulator.device.anyAlarmActive) {
                ledAlarm.className = 'led led-alarm active';
            } else {
                ledAlarm.className = 'led led-alarm';
            }
        }
    }

    /* ------------------------------------------------------------------
       Frame Processed Handler
    ------------------------------------------------------------------ */

    _handleFrameProcessed(frame, response) {
        const d = this._emulator.device;
        const valFrame = document.getElementById('valFrameCount');
        if (valFrame) valFrame.textContent = this._emulator._stats.validFrames;

        this._syncConfigUI();
        this._updateReadouts();
        this._updatePenArmState();

        const ledAlarm = document.getElementById('ledAlarm');
        if (ledAlarm) {
            if (d.anyAlarmActive) {
                ledAlarm.className = 'led led-alarm active';
            } else {
                ledAlarm.className = 'led led-alarm';
            }
        }
    }

    /* ------------------------------------------------------------------
       Readouts & Stats
    ------------------------------------------------------------------ */

    _updateReadouts() {
        const d     = this._emulator.device;
        const units = this._unitLabel(d.engUnits);

        const defaultPVs = [
            d.pen1PV,
            d.pen2PV || (d.scaleLo + (d.scaleHi - d.scaleLo) * 0.3),
            d.pen3PV || (d.scaleLo + (d.scaleHi - d.scaleLo) * 0.55),
            d.pen4PV || (d.scaleLo + (d.scaleHi - d.scaleLo) * 0.75)
        ];

        for (let i = 1; i <= 4; i++) {
            const valEl  = document.getElementById(`valPen${i}`);
            const unitEl = document.getElementById(`unitPen${i}`);
            if (valEl)  valEl.textContent  = isNaN(defaultPVs[i - 1]) ? '—' : defaultPVs[i - 1].toFixed(2);
            if (unitEl) unitEl.textContent = units;
        }
    }

    /* ------------------------------------------------------------------
       Data Log & CSV Export
    ------------------------------------------------------------------ */

    _logSample() {
        const d = this._emulator.device;
        this._dataLog.push({
            ts:   new Date().toISOString(),
            pen1: d.pen1PV,
            pen2: d.pen2PV,
            units: this._unitLabel(d.engUnits),
        });
        if (this._dataLog.length > 86400) this._dataLog.shift();
    }

    _exportCSV() {
        const u    = this._unitLabel(this._emulator.device.engUnits);
        const rows = ['Timestamp,Pen1_PV (' + u + '),Pen2_PV (' + u + ')'];
        this._dataLog.forEach(r => {
            rows.push(`${r.ts},${r.pen1.toFixed(4)},${r.pen2.toFixed(4)}`);
        });
        const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `chart_log_${this._timestamp()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        this._showToast('Data log exported as CSV.', 'fa-file-lines');
    }

    /* ------------------------------------------------------------------
       Utility Helpers
    ------------------------------------------------------------------ */

    _normalisePV(pv, lo, hi) {
        if (hi <= lo) return 0.5;
        return Math.max(0, Math.min(1, (pv - lo) / (hi - lo)));
    }

    _unitLabel(code) {
        const units = [
            '°C', '°F', 'K', '%RH',
            'bar', 'mbar', 'PSI', 'kPa', 'MPa',
            'A', 'mA', 'kA', 'µA',
            'V', 'mV', 'kV',
            'kW', 'MW', 'W', 'kVA', 'kVAR',
            'Hz', 'RPM', '%',
            'L/min', 'L/h', 'm³/h', 'GPM',
            'PPM', 'pH'
        ];
        return (units[code] !== undefined) ? units[code] : '—';
    }

    _timestamp() {
        return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    }

    _flashLed(el, activeClass, durationMs) {
        if (!el) return;
        el.className = activeClass;
        if (durationMs) {
            setTimeout(() => {
                const base = el.className.split(' ').filter(c => c !== 'active').join(' ');
                el.className = base;
            }, durationMs);
        }
    }
}

function initApp() {
    window.app = new AppController();
}

if (typeof window !== 'undefined') {
    window.AppController = AppController;
    window.initApp = initApp;
}

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});
