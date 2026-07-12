/* ==========================================================================
   Psion Organiser II Printer 2 Emulator - Core Logic & Rendering
   ========================================================================== */

// 1. Standard 5x7 GLCD Matrix Font (ASCII 32 - 126)
// Each character is 5 bytes representing 5 columns of 7 pixels (LSB = Top, MSB = Bottom)
const FONT_5X7 = {
    32: [0x00, 0x00, 0x00, 0x00, 0x00], // Space
    33: [0x00, 0x00, 0x5f, 0x00, 0x00], // !
    34: [0x00, 0x07, 0x00, 0x07, 0x00], // "
    35: [0x14, 0x7f, 0x14, 0x7f, 0x14], // #
    36: [0x24, 0x2a, 0x7f, 0x2a, 0x12], // $
    37: [0x23, 0x13, 0x08, 0x64, 0x62], // %
    38: [0x36, 0x49, 0x55, 0x22, 0x50], // &
    39: [0x00, 0x05, 0x03, 0x00, 0x00], // '
    40: [0x00, 0x1c, 0x22, 0x41, 0x00], // (
    41: [0x00, 0x41, 0x22, 0x1c, 0x00], // )
    42: [0x14, 0x08, 0x3e, 0x08, 0x14], // *
    43: [0x08, 0x08, 0x3e, 0x08, 0x08], // +
    44: [0x00, 0x80, 0x60, 0x00, 0x00], // , (descending tail)
    45: [0x08, 0x08, 0x08, 0x08, 0x08], // -
    46: [0x00, 0x60, 0x60, 0x00, 0x00], // .
    47: [0x20, 0x10, 0x08, 0x04, 0x02], // /
    48: [0x3e, 0x51, 0x49, 0x45, 0x3e], // 0
    49: [0x00, 0x42, 0x7f, 0x40, 0x00], // 1
    50: [0x42, 0x61, 0x51, 0x49, 0x46], // 2
    51: [0x21, 0x41, 0x45, 0x4b, 0x31], // 3
    52: [0x18, 0x14, 0x12, 0x7f, 0x10], // 4
    53: [0x27, 0x45, 0x45, 0x45, 0x39], // 5
    54: [0x3c, 0x4a, 0x49, 0x49, 0x30], // 6
    55: [0x01, 0x71, 0x09, 0x05, 0x03], // 7
    56: [0x36, 0x49, 0x49, 0x49, 0x36], // 8
    57: [0x06, 0x49, 0x49, 0x29, 0x1e], // 9
    58: [0x00, 0x36, 0x36, 0x00, 0x00], // :
    59: [0x00, 0x96, 0x36, 0x00, 0x00], // ; (descending tail)
    60: [0x08, 0x14, 0x22, 0x41, 0x00], // <
    61: [0x24, 0x24, 0x24, 0x24, 0x24], // =
    62: [0x00, 0x41, 0x22, 0x14, 0x08], // >
    63: [0x02, 0x01, 0x51, 0x09, 0x06], // ?
    64: [0x32, 0x49, 0x79, 0x41, 0x3e], // @
    65: [0x7e, 0x11, 0x11, 0x11, 0x7e], // A
    66: [0x7f, 0x49, 0x49, 0x49, 0x36], // B
    67: [0x3e, 0x41, 0x41, 0x41, 0x22], // C
    68: [0x7f, 0x41, 0x41, 0x22, 0x1c], // D
    69: [0x7f, 0x49, 0x49, 0x49, 0x41], // E
    70: [0x7f, 0x09, 0x09, 0x09, 0x01], // F
    71: [0x3e, 0x41, 0x49, 0x49, 0x7a], // G
    72: [0x7f, 0x08, 0x08, 0x08, 0x7f], // H
    73: [0x00, 0x41, 0x7f, 0x41, 0x00], // I
    74: [0x20, 0x40, 0x41, 0x3f, 0x01], // J
    75: [0x7f, 0x08, 0x14, 0x22, 0x41], // K
    76: [0x7f, 0x40, 0x40, 0x40, 0x40], // L
    77: [0x7f, 0x02, 0x0c, 0x02, 0x7f], // M
    78: [0x7f, 0x04, 0x08, 0x10, 0x7f], // N
    79: [0x3e, 0x41, 0x41, 0x41, 0x3e], // O
    80: [0x7f, 0x09, 0x09, 0x09, 0x06], // P
    81: [0x3e, 0x41, 0x51, 0x21, 0x5e], // Q
    82: [0x7f, 0x09, 0x19, 0x29, 0x46], // R
    83: [0x46, 0x49, 0x49, 0x49, 0x31], // S
    84: [0x01, 0x01, 0x7f, 0x01, 0x01], // T
    85: [0x3f, 0x40, 0x40, 0x40, 0x3f], // U
    86: [0x1f, 0x20, 0x40, 0x20, 0x1f], // V
    87: [0x3f, 0x40, 0x38, 0x40, 0x3f], // W
    88: [0x63, 0x14, 0x08, 0x14, 0x63], // X
    89: [0x07, 0x08, 0x70, 0x08, 0x07], // Y
    90: [0x61, 0x51, 0x49, 0x45, 0x43], // Z
    91: [0x00, 0x7f, 0x41, 0x41, 0x00], // [
    92: [0x02, 0x04, 0x08, 0x10, 0x20], // \
    93: [0x00, 0x41, 0x41, 0x7f, 0x00], // ]
    94: [0x04, 0x02, 0x01, 0x02, 0x04], // ^
    95: [0x40, 0x40, 0x40, 0x40, 0x40], // _
    96: [0x00, 0x01, 0x02, 0x04, 0x00], // `
    97: [0x20, 0x54, 0x54, 0x54, 0x78], // a
    98: [0x7f, 0x48, 0x44, 0x44, 0x38], // b
    99: [0x38, 0x44, 0x44, 0x44, 0x20], // c
    100: [0x38, 0x44, 0x44, 0x48, 0x7f], // d
    101: [0x38, 0x54, 0x54, 0x54, 0x18], // e
    102: [0x08, 0x7e, 0x09, 0x01, 0x02], // f
    103: [0x18, 0xa4, 0xa4, 0xa4, 0x7c], // g (descending tail)
    104: [0x7f, 0x08, 0x04, 0x04, 0x78], // h
    105: [0x00, 0x44, 0x7d, 0x40, 0x00], // i
    106: [0x00, 0x80, 0x80, 0xfd, 0x00], // j (descending tail)
    107: [0x7f, 0x10, 0x28, 0x44, 0x00], // k
    108: [0x00, 0x41, 0x7f, 0x40, 0x00], // l
    109: [0x7c, 0x04, 0x18, 0x04, 0x78], // m
    110: [0x7c, 0x08, 0x04, 0x04, 0x78], // n
    111: [0x38, 0x44, 0x44, 0x44, 0x38], // o
    112: [0xfc, 0x24, 0x24, 0x24, 0x18], // p (descending tail)
    113: [0x18, 0x24, 0x24, 0x24, 0xfc], // q (descending tail)
    114: [0x7c, 0x08, 0x04, 0x04, 0x08], // r
    115: [0x48, 0x54, 0x54, 0x54, 0x20], // s
    116: [0x04, 0x3f, 0x44, 0x40, 0x20], // t
    117: [0x3c, 0x40, 0x40, 0x20, 0x7c], // u
    118: [0x1c, 0x20, 0x40, 0x20, 0x1c], // v
    119: [0x3c, 0x40, 0x30, 0x40, 0x3c], // w
    120: [0x44, 0x28, 0x10, 0x28, 0x44], // x
    121: [0x1c, 0xa0, 0xa0, 0xa0, 0x7c], // y (descending tail)
    122: [0x44, 0x64, 0x54, 0x4c, 0x44], // z
    123: [0x00, 0x08, 0x36, 0x41, 0x00], // {
    124: [0x00, 0x00, 0x7f, 0x00, 0x00], // |
    125: [0x00, 0x41, 0x36, 0x08, 0x00], // }
    126: [0x08, 0x08, 0x2a, 0x1c, 0x08], // ~
};

document.addEventListener('DOMContentLoaded', () => {
    // 2. DOM Elements Mapping
    const btnSerialConnect = document.getElementById('btnSerialConnect');
    const serialAlert = document.getElementById('serialAlert');
    const ledStatus = document.getElementById('ledStatus');
    const ledRx = document.getElementById('ledRx');
    const ledBuffer = document.getElementById('ledBuffer');
    
    const btnPrintTest = document.getElementById('btnPrintTest');
    const btnFeedPaper = document.getElementById('btnFeedPaper');
    const btnDownloadPrint = document.getElementById('btnDownloadPrint');
    const btnCopyPrint = document.getElementById('btnCopyPrint');
    const btnPrintPaper = document.getElementById('btnPrintPaper');
    const btnDownloadText = document.getElementById('btnDownloadText');
    const btnCopyText = document.getElementById('btnCopyText');
    const btnClearRoll = document.getElementById('btnClearRoll');
    
    const btnCopyGprint = document.getElementById('btnCopyGprint');
    const gprintCode = document.getElementById('gprintCode');
    
    const paperRoll = document.getElementById('paperRoll');
    const paperRollContainer = document.getElementById('paperRollContainer');
    const printStats = document.getElementById('printStats');
    const btnReturnBottom = document.getElementById('btnReturnBottom');
    
    const selectColumns = document.getElementById('selectColumns');
    const selectStyle = document.getElementById('selectStyle');
    const selectUnderline = document.getElementById('selectUnderline');
    const btnResetSettings = document.getElementById('btnResetSettings');
    
    const toastContainer = document.getElementById('toastContainer');
    const chkFilterHandshake = document.getElementById('chkFilterHandshake');
    const chkFocusMode = document.getElementById('chkFocusMode');

    // Thermal Simulation elements
    const selectPaperPreset = document.getElementById('selectPaperPreset');
    const sliderInkFade = document.getElementById('sliderInkFade');
    const labelInkFade = document.getElementById('labelInkFade');
    const sliderPaperAge = document.getElementById('sliderPaperAge');
    const labelPaperAge = document.getElementById('labelPaperAge');
    const sliderJitter = document.getElementById('sliderJitter');
    const labelJitter = document.getElementById('labelJitter');
    const sliderDegradation = document.getElementById('sliderDegradation');
    const labelDegradation = document.getElementById('labelDegradation');

    // Sidebar & Panel elements
    const guideTrigger = document.getElementById('guide-trigger');
    const guideTriggerIcon = document.getElementById('guide-trigger-icon');
    const guidePanel = document.getElementById('guide-panel');
    const btnCloseGuide = document.getElementById('btn-close-guide');

    const controlsTrigger = document.getElementById('controls-trigger');
    const controlsTriggerIcon = document.getElementById('controls-trigger-icon');
    const controlsPanel = document.getElementById('controls-panel');
    const btnCloseControls = document.getElementById('btn-close-controls');

    const helpTrigger = document.getElementById('help-trigger');
    const helpTriggerIcon = document.getElementById('help-trigger-icon');
    const helpPanel = document.getElementById('help-panel');
    const btnCloseHelp = document.getElementById('btn-close-help');

    const printModesTrigger = document.getElementById('print-modes-trigger');
    const printModesTriggerIcon = document.getElementById('print-modes-trigger-icon');
    const printModesPanel = document.getElementById('print-modes-panel');
    const btnClosePrintModes = document.getElementById('btn-close-print-modes');

    const operationsTrigger = document.getElementById('operations-trigger');
    const operationsTriggerIcon = document.getElementById('operations-trigger-icon');
    const operationsPanel = document.getElementById('operations-panel');
    const btnCloseOperations = document.getElementById('btn-close-operations');

    // Serial parameters DOM mapping
    const selectBaudRate = document.getElementById('selectBaudRate');
    const selectParity = document.getElementById('selectParity');
    const selectDataBits = document.getElementById('selectDataBits');
    const selectStopBits = document.getElementById('selectStopBits');
    const selectFlowControl = document.getElementById('selectFlowControl');

    // GPRINT Transfer modal elements
    const btnTransferGprint = document.getElementById('btnTransferGprint');
    const gprintModal = document.getElementById('gprintModal');
    const btnCloseGprintModal = document.getElementById('btnCloseGprintModal');
    const btnCancelGprintTransfer = document.getElementById('btnCancelGprintTransfer');
    const btnStartGprintTransfer = document.getElementById('btnStartGprintTransfer');
    const btnDoneGprintTransfer = document.getElementById('btnDoneGprintTransfer');
    const modalStepWarning = document.getElementById('modalStepWarning');
    const transferProgressSection = document.getElementById('transferProgressSection');
    const gprintProgressBar = document.getElementById('gprintProgressBar');
    const gprintTransferStatus = document.getElementById('gprintTransferStatus');
    const translationInstructions = document.getElementById('translationInstructions');

    // 3. Application State variables
    let port = null;
    let reader = null;
    let keepReading = false;
    let isPrinterEmulationActive = false;
    let wasEmulationActiveBeforeTransfer = false;
    let currentPaperBg = '#ffffff';
    let currentInkColor = '#000000';
    let mechanicalJitterAmount = 0; // Max right-shift in pixels
    let isLockedToBottom = true;
    let isProgrammaticScroll = false;
    let programmaticScrollTimeout = null;
    
    let activeStyles = {
        doubleWidth: false,
        doubleHeight: false,
        underline: false,
        narrowMode: 'normal' // 'normal' (40), 'narrow' (60), 'very-narrow' (80) default to 40 cols
    };
    
    let currentLineText = []; // holds objects: { char, doubleWidth, doubleHeight, underline, narrowMode }
    let rxState = 'TEXT'; // TEXT, ESC, GRAPHICS_LEN_HIGH, GRAPHICS_LEN_LOW, GRAPHICS_DATA
    let graphicsLength = 0;
    let graphicsBuffer = [];
    
    let timeoutTimer = null;
    let lastReceivedWasCr = false;
    let printedLinesText = []; // Buffers text for saving and copying
    let ignoreHandshake = false; // Filter out startup serial handshakes (like XON/XOFF)

    // 4. Utility Functions

    // Toast Alert
    function showToast(message, icon = 'fa-check') {
        const toast = document.createElement('div');
        toast.className = 'toast-feedback';
        toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
        toastContainer.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 50);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }

    // Copy to Clipboard
    function setupCopyBtn(btn, textarea, label) {
        btn.addEventListener('click', () => {
            navigator.clipboard.writeText(textarea.value)
                .then(() => showToast(`${label} stub copied!`, 'fa-copy'))
                .catch(err => {
                    showToast('Copy failed!', 'fa-circle-xmark');
                    console.error(err);
                });
        });
    }
    setupCopyBtn(btnCopyGprint, gprintCode, 'GPRINT');

    // LED States
    function updateConnectionStatus(isConnected) {
        const statusDot = document.getElementById('controls-status-dot');
        if (isConnected) {
            btnSerialConnect.innerHTML = '<i class="fa-solid fa-unlink"></i> Disconnect';
            ledStatus.className = 'led led-status connected';
            printStats.textContent = 'Idle';
            printStats.classList.remove('offline');
            if (statusDot) statusDot.classList.add('online');
            showToast('Serial Port Connected!', 'fa-plug-circle-check');
        } else {
            btnSerialConnect.innerHTML = '<i class="fa-solid fa-plug"></i> Connect Serial';
            ledStatus.className = 'led led-status disconnected';
            printStats.textContent = 'Offline';
            printStats.classList.add('offline');
            if (statusDot) statusDot.classList.remove('online');
            showToast('Serial Port Disconnected', 'fa-plug-circle-xmark');
        }
    }

    function flashRxLed() {
        ledRx.classList.add('active');
        if (ledRx.timeout) clearTimeout(ledRx.timeout);
        ledRx.timeout = setTimeout(() => {
            ledRx.classList.remove('active');
        }, 80);
    }

    function updateBufferLed() {
        if (currentLineText.length > 0) {
            ledBuffer.classList.add('active');
        } else {
            ledBuffer.classList.remove('active');
        }
    }

    // Update the Sidebar Settings Dropdowns
    function updateActiveStyleUI() {
        if (selectColumns) {
            if (activeStyles.doubleWidth) {
                selectColumns.value = '20';
            } else if (activeStyles.narrowMode === 'very-narrow') {
                selectColumns.value = '80';
            } else if (activeStyles.narrowMode === 'narrow') {
                selectColumns.value = '60';
            } else {
                selectColumns.value = '40';
            }
        }
        
        if (selectStyle) {
            selectStyle.value = activeStyles.doubleHeight ? 'double-height' : 'normal';
        }
        
        if (selectUnderline) {
            selectUnderline.value = activeStyles.underline ? 'enabled' : 'disabled';
        }
    }

    // Listen for manual settings changes
    selectColumns.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val === '20') {
            activeStyles.doubleWidth = true;
            activeStyles.narrowMode = 'normal';
        } else if (val === '40') {
            activeStyles.doubleWidth = false;
            activeStyles.narrowMode = 'normal';
        } else if (val === '60') {
            activeStyles.doubleWidth = false;
            activeStyles.narrowMode = 'narrow';
        } else if (val === '80') {
            activeStyles.doubleWidth = false;
            activeStyles.narrowMode = 'very-narrow';
        }
        updateActiveStyleUI();
        localStorage.setItem('emu_columns', val);
        showToast(`Text columns changed manually to ${val}`, 'fa-sliders');
    });

    selectStyle.addEventListener('change', (e) => {
        const val = e.target.value;
        activeStyles.doubleHeight = (val === 'double-height');
        updateActiveStyleUI();
        localStorage.setItem('emu_style', val);
        showToast(`Font style changed manually to ${val === 'double-height' ? 'Double Height' : 'Normal'}`, 'fa-sliders');
    });

    selectUnderline.addEventListener('change', (e) => {
        const val = e.target.value;
        activeStyles.underline = (val === 'enabled');
        updateActiveStyleUI();
        localStorage.setItem('emu_underline', val);
        showToast(`Underline changed manually to ${activeStyles.underline ? 'Enabled' : 'Disabled'}`, 'fa-sliders');
    });

    // Reset settings button handler
    btnResetSettings.addEventListener('click', () => {
        Object.assign(activeStyles, {
            doubleWidth: false,
            doubleHeight: false,
            underline: false,
            narrowMode: 'normal'
        });
        updateActiveStyleUI();

        // Clear persisted active style configurations
        localStorage.removeItem('emu_columns');
        localStorage.removeItem('emu_style');
        localStorage.removeItem('emu_underline');

        // Reset Thermal Print Simulation
        if (selectPaperPreset) {
            selectPaperPreset.value = 'standard';
            currentInkColor = '#000000';
            document.documentElement.style.setProperty('--ink-color', currentInkColor);
            localStorage.removeItem('thermalPreset');
        }
        if (sliderInkFade) {
            sliderInkFade.value = 0;
            if (labelInkFade) labelInkFade.textContent = '0%';
            document.documentElement.style.setProperty('--ink-fade-opacity', 1);
            localStorage.removeItem('thermalFade');
        }
        if (sliderPaperAge) {
            sliderPaperAge.value = 0;
            if (labelPaperAge) labelPaperAge.textContent = '0%';
            localStorage.removeItem('thermalAge');
        }
        updatePaperColor();
        if (sliderJitter) {
            sliderJitter.value = 0;
            if (labelJitter) labelJitter.textContent = '0.0px';
            mechanicalJitterAmount = 0;
            localStorage.removeItem('thermalJitter');
        }
        if (sliderDegradation) {
            sliderDegradation.value = 0;
            if (labelDegradation) labelDegradation.textContent = '0%';
            document.documentElement.style.setProperty('--degradation-mask', 'none');
            localStorage.removeItem('thermalDegradation');
        }

        showToast('Settings reset to defaults', 'fa-arrow-rotate-left');
    });

    // Thermal Simulation Event Handlers
    // Color blending helpers for paper age simulation
    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 255, g: 255, b: 255 };
    }

    function rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    function updatePaperColor() {
        const preset = selectPaperPreset ? selectPaperPreset.value : 'standard';
        const ageVal = sliderPaperAge ? parseInt(sliderPaperAge.value) : 0;
        
        let baseBg = '#ffffff';
        if (preset === 'aged') {
            baseBg = '#fef08a';
        }
        
        const baseRgb = hexToRgb(baseBg);
        const targetRgb = hexToRgb('#e2cd9c'); // Warm vintage aged yellow/sepia paper color
        
        const factor = ageVal / 100;
        const r = Math.round(baseRgb.r + (targetRgb.r - baseRgb.r) * factor);
        const g = Math.round(baseRgb.g + (targetRgb.g - baseRgb.g) * factor);
        const b = Math.round(baseRgb.b + (targetRgb.b - baseRgb.b) * factor);
        
        currentPaperBg = rgbToHex(r, g, b);
        document.documentElement.style.setProperty('--paper-bg', currentPaperBg);

        // Apply edge oxidation (burn shadows) matching the ink color
        const inkRgb = hexToRgb(currentInkColor);
        
        // 1. Narrow, sharp outer edge shadow (higher opacity, small width/blur)
        const sharpOpacity = factor * 0.55; // up to 55% opacity at absolute edge
        const sharpColor = `rgba(${inkRgb.r}, ${inkRgb.g}, ${inkRgb.b}, ${sharpOpacity})`;
        const sharpWidth = factor * 3; // narrow 3px width
        const sharpBlur = factor * 3;  // narrow 3px blur

        // 2. Soft, wide inner transition shadow (lower opacity, wider blur)
        const burnOpacity = factor * 0.12; // light 12% opacity so it fades gently
        const burnColor = `rgba(${inkRgb.r}, ${inkRgb.g}, ${inkRgb.b}, ${burnOpacity})`;
        const burnWidth = factor * 16; // up to 16px wide
        const burnBlur = factor * 32;  // up to 32px blur

        document.documentElement.style.setProperty('--edge-sharp-color', sharpColor);
        document.documentElement.style.setProperty('--edge-sharp-width', `${sharpWidth}px`);
        document.documentElement.style.setProperty('--edge-sharp-blur', `${sharpBlur}px`);

        document.documentElement.style.setProperty('--edge-burn-color', burnColor);
        document.documentElement.style.setProperty('--edge-burn-width', `${burnWidth}px`);
        document.documentElement.style.setProperty('--edge-burn-blur', `${burnBlur}px`);
    }

    // Thermal Simulation Event Handlers
    if (selectPaperPreset) {
        selectPaperPreset.addEventListener('change', (e) => {
            const val = e.target.value;
            if (val === 'standard') {
                currentInkColor = '#000000';
            } else if (val === 'blue') {
                currentInkColor = '#1e3a8a';
            } else if (val === 'aged') {
                currentInkColor = '#44403c';
            }
            updatePaperColor();
            document.documentElement.style.setProperty('--ink-color', currentInkColor);
            localStorage.setItem('thermalPreset', val);
            showToast(`Paper preset changed: ${e.target.options[e.target.selectedIndex].text}`, 'fa-palette');
        });
    }

    if (sliderInkFade) {
        sliderInkFade.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            if (labelInkFade) labelInkFade.textContent = `${val}%`;
            
            const opacity = 1 - (val / 100) * 0.75; // down to 0.25 opacity
            document.documentElement.style.setProperty('--ink-fade-opacity', opacity);
            localStorage.setItem('thermalFade', val);
        });
    }

    if (sliderPaperAge) {
        sliderPaperAge.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            if (labelPaperAge) labelPaperAge.textContent = `${val}%`;
            updatePaperColor();
            localStorage.setItem('thermalAge', val);
        });
    }

    if (sliderJitter) {
        sliderJitter.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            mechanicalJitterAmount = (val / 100) * 4; // up to 4px max right shift
            if (labelJitter) labelJitter.textContent = `${mechanicalJitterAmount.toFixed(1)}px`;
            localStorage.setItem('thermalJitter', val);
        });
    }

    if (sliderDegradation) {
        sliderDegradation.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            if (labelDegradation) labelDegradation.textContent = `${val}%`;
            
            if (val === 0) {
                document.documentElement.style.setProperty('--degradation-mask', 'none');
            } else {
                const degMask = `repeating-linear-gradient(135deg,
                    rgba(0,0,0,1) 0px,
                    rgba(0,0,0,1) 120px,
                    rgba(0,0,0,${minOpacity}) 280px,
                    rgba(0,0,0,${minOpacity}) 380px,
                    rgba(0,0,0,1) 540px,
                    rgba(0,0,0,1) 700px
                )`;
                document.documentElement.style.setProperty('--degradation-mask', degMask);
            }
            localStorage.setItem('thermalDegradation', val);
        });
    }

    // Focus Mode toggling and persistence
    if (chkFocusMode) {
        const isFocusMode = sessionStorage.getItem('printerFocusMode') === 'true';
        chkFocusMode.checked = isFocusMode;
        if (isFocusMode) {
            document.body.classList.add('focus-mode');
        }
        
        chkFocusMode.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            if (isChecked) {
                document.body.classList.add('focus-mode');
                sessionStorage.setItem('printerFocusMode', 'true');
                showToast('Focus Mode Enabled', 'fa-expand');
                
                // Auto-close side panels
                toggleGuideSidebar(false);
                toggleControlsSidebar(false);
                toggleHelpSidebar(false);
                togglePrintModesSidebar(false);
                toggleOperationsSidebar(false);
            } else {
                document.body.classList.remove('focus-mode');
                sessionStorage.setItem('printerFocusMode', 'false');
                showToast('Focus Mode Disabled', 'fa-compress');
            }
        });
    }

    // 3-second Timeout Timer
    function resetTimeoutTimer() {
        if (timeoutTimer) clearTimeout(timeoutTimer);
        timeoutTimer = setTimeout(() => {
            if (currentLineText.length > 0) {
                printStats.textContent = 'Auto Flush';
                printCurrentLine();
            }
        }, 3000);
    }

    // 5. Serial Communication

    // Browser Support check
    if (!('serial' in navigator)) {
        btnSerialConnect.disabled = true;
        serialAlert.style.display = 'flex';
    } else {
        btnSerialConnect.addEventListener('click', async () => {
            if (isPrinterEmulationActive) {
                await disconnectSerial();
            } else {
                await connectSerial();
            }
        });
    }

    async function connectSerial() {
        try {
            if (!port) {
                const flowControlSetting = selectFlowControl ? selectFlowControl.value : 'xonxoff';
                const baudRateSetting = selectBaudRate ? parseInt(selectBaudRate.value, 10) : 9600;
                const dataBitsSetting = selectDataBits ? parseInt(selectDataBits.value, 10) : 8;
                const stopBitsSetting = selectStopBits ? parseInt(selectStopBits.value, 10) : 1;
                const paritySetting = selectParity ? selectParity.value : 'none';

                const flowControlOpt = (flowControlSetting === 'hardware') ? 'hardware' : 'none';

                port = await navigator.serial.requestPort();
                await port.open({ 
                    baudRate: baudRateSetting,
                    dataBits: dataBitsSetting,
                    stopBits: stopBitsSetting,
                    parity: paritySetting,
                    flowControl: flowControlOpt
                });
            }
            
            isPrinterEmulationActive = true;
            updateConnectionStatus(true);
            ignoreHandshake = true;
            setTimeout(() => { ignoreHandshake = false; }, 1000); // Filter startup handshakes for 1 sec
            if (!keepReading) {
                readLoop();
            }
        } catch (err) {
            console.error('Serial port connection error:', err);
            updateConnectionStatus(false);
            port = null;
            isPrinterEmulationActive = false;
        }
    }

    async function readLoop() {
        keepReading = true;
        while (port && port.readable && keepReading) {
            reader = port.readable.getReader();
            try {
                while (true) {
                    const { value, done } = await reader.read();
                    if (done) {
                        break;
                    }
                    if (value) {
                        if (isPrinterEmulationActive) {
                            processIncomingBytes(value);
                        }
                    }
                }
            } catch (err) {
                console.error('Serial read error:', err);
                break;
            } finally {
                reader.releaseLock();
            }
        }
        // If we exit the loop and serial was not explicitly disconnected, clean up
        if (keepReading) {
            await disconnectSerial();
        }
    }

    async function disconnectSerial() {
        isPrinterEmulationActive = false;
        keepReading = false;
        if (timeoutTimer) clearTimeout(timeoutTimer);
        
        if (reader) {
            try {
                await reader.cancel();
            } catch(e) {}
            reader = null;
        }
        
        if (port) {
            try {
                await port.close();
            } catch(e) {}
            port = null;
        }
        updateConnectionStatus(false);
    }

    // 6. Protocol State Machine
    function processIncomingBytes(bytes) {
        flashRxLed();
        
        for (let i = 0; i < bytes.length; i++) {
            const b = bytes[i];
            resetTimeoutTimer();
            
            if (rxState === 'TEXT') {
                if (b === 27) { // ESC (Graphics start sequence)
                    rxState = 'ESC';
                } else {
                    handleTextByte(b);
                }
            } else if (rxState === 'ESC') {
                if (b === 71) { // 'G' (Graphics Command)
                    rxState = 'GRAPHICS_LEN_HIGH';
                } else {
                    // Invalid ESC sequence, process ESC and current byte as text
                    rxState = 'TEXT';
                    handleTextByte(27);
                    handleTextByte(b);
                }
            } else if (rxState === 'GRAPHICS_LEN_HIGH') {
                graphicsLength = b * 256;
                rxState = 'GRAPHICS_LEN_LOW';
            } else if (rxState === 'GRAPHICS_LEN_LOW') {
                graphicsLength += b;
                graphicsBuffer = [];
                if (graphicsLength > 0) {
                    rxState = 'GRAPHICS_DATA';
                    printStats.textContent = 'Rx Graphics';
                } else {
                    rxState = 'TEXT';
                }
            } else if (rxState === 'GRAPHICS_DATA') {
                graphicsBuffer.push(b);
                if (graphicsBuffer.length >= graphicsLength) {
                    printGraphicsLine(graphicsBuffer);
                    rxState = 'TEXT';
                    printStats.textContent = 'Idle';
                }
            }
        }
        
        updateBufferLed();
    }

    // Text & Control Byte processor
    function handleTextByte(b) {
        // Line Feed (10) handling: ignore if it immediately follows a Carriage Return (13)
        if (b === 10) {
            if (lastReceivedWasCr) {
                lastReceivedWasCr = false;
                return;
            }
            printStats.textContent = 'Rx LF';
            printCurrentLine();
            lastReceivedWasCr = false;
            return;
        }
        
        // Reset CR flag for other characters
        lastReceivedWasCr = false;

        // Control code processing
        switch (b) {
            case 9: // Tab
                handleTab();
                break;
            case 11: // Space
            case 16: // Space
                pushChar(32);
                break;
            case 12: // Form Feed (Print and feed 3 lines)
                printStats.textContent = 'Rx FF';
                printCurrentLine();
                feedPaper(3);
                printStats.textContent = 'Idle';
                break;
            case 13: // Carriage Return
                printStats.textContent = 'Rx CR';
                printCurrentLine();
                lastReceivedWasCr = true;
                break;
            case 14: // Double width mode (20 chars)
                activeStyles.doubleWidth = true;
                updateActiveStyleUI();
                break;
            case 15: // Normal width mode (40 chars)
                activeStyles.doubleWidth = false;
                activeStyles.narrowMode = 'normal';
                updateActiveStyleUI();
                break;
            case 17: // Start double height mode
                const filterXon = selectFlowControl ? (selectFlowControl.value === 'xonxoff') : true;
                if (!filterXon && !ignoreHandshake) {
                    activeStyles.doubleHeight = true;
                    updateActiveStyleUI();
                }
                break;
            case 18: // End double height mode
                const filterXoff = selectFlowControl ? (selectFlowControl.value === 'xonxoff') : true;
                if (!filterXoff && !ignoreHandshake) {
                    activeStyles.doubleHeight = false;
                    updateActiveStyleUI();
                }
                break;
            case 21: // Start underline mode
                activeStyles.underline = true;
                updateActiveStyleUI();
                break;
            case 22: // Very narrow mode (80 chars)
                activeStyles.narrowMode = 'very-narrow';
                activeStyles.doubleWidth = false;
                updateActiveStyleUI();
                break;
            case 23: // Narrow mode (60 chars)
                activeStyles.narrowMode = 'narrow';
                activeStyles.doubleWidth = false;
                updateActiveStyleUI();
                break;
            case 24: // End underline mode
                activeStyles.underline = false;
                updateActiveStyleUI();
                break;
            default:
                // Only push printable ASCII characters
                if (b >= 32 && b <= 126) {
                    pushChar(b);
                }
                break;
        }
    }

    // Helper to push character into line buffer with active formatting states
    function pushChar(charCode) {
        // Calculate max capacity for the current style configuration
        let maxCols = 40;
        if (activeStyles.narrowMode === 'very-narrow') maxCols = 80;
        else if (activeStyles.narrowMode === 'narrow') maxCols = 60;
        else if (activeStyles.doubleWidth) maxCols = 20;

        // Auto wrap if line is full
        if (currentLineText.length >= maxCols) {
            printStats.textContent = 'Auto Wrap';
            printCurrentLine();
        }

        currentLineText.push({
            char: charCode,
            doubleWidth: activeStyles.doubleWidth,
            doubleHeight: activeStyles.doubleHeight,
            underline: activeStyles.underline,
            narrowMode: activeStyles.narrowMode
        });
    }

    // Tab Stop implementation
    function handleTab() {
        let maxCols = 40;
        if (activeStyles.narrowMode === 'very-narrow') maxCols = 80;
        else if (activeStyles.narrowMode === 'narrow') maxCols = 60;
        else if (activeStyles.doubleWidth) maxCols = 20;

        const midCol = Math.floor(maxCols / 2);
        const currentLen = currentLineText.length;

        if (currentLen < midCol) {
            const padSpaces = midCol - currentLen;
            for (let i = 0; i < padSpaces; i++) {
                pushChar(32);
            }
        } else {
            // Carriage return and feed to next line
            printCurrentLine();
        }
    }

    // 7. Rendering Engine

    // Render Text Line
    function printCurrentLine() {
        // If line is empty, print a blank normal-height line
        if (currentLineText.length === 0) {
            createBlankLineCanvas(24);
            printedLinesText.push(''); // Accumulate empty line
            return;
        }

        // Determine line height: 48px if any character is doubleHeight, otherwise 24px
        const hasDoubleHeight = currentLineText.some(item => item.doubleHeight);
        const canvasHeight = hasDoubleHeight ? 48 : 24;

        // Accumulate printed text line
        const lineString = currentLineText.map(item => String.fromCharCode(item.char)).join('');
        printedLinesText.push(lineString);

        // Create strip canvas
        const canvas = document.createElement('canvas');
        canvas.width = 640; // Native physical paper scale
        canvas.height = canvasHeight;
        canvas.style.height = `${canvasHeight}px`; // Lock display height to prevent browser flex stretching
        
        const ctx = canvas.getContext('2d');
        
        // Setup ink color
        ctx.fillStyle = currentInkColor;
        
        // Define separate top and bottom pass jitter for two-pass double-height text simulation
        const topJitter = Math.round(Math.random() * mechanicalJitterAmount);
        const bottomJitter = hasDoubleHeight ? Math.round(Math.random() * mechanicalJitterAmount) : topJitter;
        
        // Alignments: Text is centered in a 480px width area. Offset starts at X = 88px.
        let currentX = 88;
        const baselineY = hasDoubleHeight ? 32 : 18;

        for (let i = 0; i < currentLineText.length; i++) {
            const item = currentLineText[i];
            
            // Set scaling parameters
            let scaleX = 2; // Normal (40 cols)
            let scaleY = item.doubleHeight ? 4 : 2;
            
            if (item.narrowMode === 'very-narrow') {
                scaleX = 1;
            } else if (item.narrowMode === 'narrow') {
                scaleX = 1;
            } else if (item.doubleWidth) {
                scaleX = 4;
            }

            // Baseline calculations: normal height on double line height is pushed down
            const charHeight = 7 * scaleY;
            const startY = baselineY - charHeight; 

            const charData = FONT_5X7[item.char] || FONT_5X7[32]; // fallback to space

            // Draw character columns
            for (let colIdx = 0; colIdx < 5; colIdx++) {
                const colVal = charData[colIdx];
                for (let bit = 0; bit < 8; bit++) {
                    if ((colVal & (1 << bit)) !== 0) {
                        // Apply separate horizontal jitter for top half vs bottom half of double-height print passes
                        const passJitter = (item.doubleHeight && bit >= 4) ? bottomJitter : topJitter;
                        const px = currentX + passJitter + colIdx * scaleX;
                        const py = startY + bit * scaleY;
                        ctx.fillRect(px, py, scaleX, scaleY);
                    }
                }
            }

            // Draw Underline
            if (item.underline) {
                const underlineY = baselineY + 1; // Underline falls 1 dot below baseline
                const underlineHeight = item.doubleHeight ? 2 : 1;
                let charWidthWithSpacing = 12; // default normal
                
                if (item.narrowMode === 'very-narrow') charWidthWithSpacing = 6;
                else if (item.narrowMode === 'narrow') charWidthWithSpacing = 8;
                else if (item.doubleWidth) charWidthWithSpacing = 24;
                
                const passJitter = item.doubleHeight ? bottomJitter : topJitter;
                ctx.fillRect(currentX + passJitter, underlineY, charWidthWithSpacing, underlineHeight);
            }

            // Advance cursor
            let advance = 12;
            if (item.narrowMode === 'very-narrow') advance = 6;
            else if (item.narrowMode === 'narrow') advance = 8;
            else if (item.doubleWidth) advance = 24;
            
            currentX += advance;
        }

        // Append to DOM
        appendCanvasToPaper(canvas);
        
        // Reset state
        currentLineText = [];
        updateBufferLed();
    }

    // Render Graphics Line
    // buffer contains raw column bytes (vertical 8 dots per byte, MSB = Top, LSB = Bottom)
    function printGraphicsLine(buffer) {
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 16; // 8 dots vertical * 2px scale = 16px
        canvas.style.height = '16px'; // Lock display height to prevent browser flex stretching
        
        const ctx = canvas.getContext('2d');
        
        // Setup ink
        ctx.fillStyle = currentInkColor;
        
        // Center graphics (256 columns * 2px scale = 512px)
        // Starts at X = 72px (matching left border 12.5mm / 0.35mm = 36 dots = 72px)
        const startX = 72 + Math.round(Math.random() * mechanicalJitterAmount);

        const maxCols = Math.min(buffer.length, 256);
        for (let col = 0; col < maxCols; col++) {
            const val = buffer[col];
            for (let bit = 0; bit < 8; bit++) {
                // MSB (128) is top dot, LSB (1) is bottom dot
                if ((val & (128 >> bit)) !== 0) {
                    const px = startX + col * 2;
                    const py = bit * 2;
                    ctx.fillRect(px, py, 2, 2);
                }
            }
        }

        appendCanvasToPaper(canvas);
    }

    // Helper to append canvas and scroll view
    function appendCanvasToPaper(canvas) {
        const wrapper = document.getElementById('paperContentWrapper');
        if (wrapper) {
            wrapper.appendChild(canvas);
        } else {
            const bottomSpacer = document.getElementById('paperBottomSpacer');
            if (bottomSpacer) {
                paperRoll.insertBefore(canvas, bottomSpacer);
            } else {
                paperRoll.appendChild(canvas);
            }
        }
        
        // Dynamically update padding on every print to handle layout shifts/initial 0-height client heights
        updatePaperPadding();
        
        // Scroll paper container to bottom if locked
        if (isLockedToBottom) {
            const oldScroll = paperRollContainer.scrollTop;
            paperRollContainer.scrollTop = paperRollContainer.scrollHeight;
            const newScroll = paperRollContainer.scrollTop;
            
            if (newScroll !== oldScroll) {
                isProgrammaticScroll = true;
                if (programmaticScrollTimeout) clearTimeout(programmaticScrollTimeout);
                programmaticScrollTimeout = setTimeout(() => {
                    isProgrammaticScroll = false;
                    programmaticScrollTimeout = null;
                }, 150);
            } else {
                isProgrammaticScroll = false;
            }
        }
    }

    // Create blank paper spacer
    function createBlankLineCanvas(height) {
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = height;
        canvas.style.height = `${height}px`; // Lock display height to prevent browser flex stretching
        
        const ctx = canvas.getContext('2d');
        // Left transparent to show paper-roll background
        
        appendCanvasToPaper(canvas);
    }

    // 8. Emulator Operations

    // Paper feed
    function feedPaper(lines = 3) {
        createBlankLineCanvas(24 * lines);
        showToast(`Fed paper ${lines} line${lines > 1 ? 's' : ''}`, 'fa-arrow-up');
    }
    btnFeedPaper.addEventListener('click', () => feedPaper(3));

    // Clear Roll
    function clearPaperRoll() {
        // Clear only canvas elements, keeping spacers intact
        const wrapper = document.getElementById('paperContentWrapper');
        const canvases = wrapper 
            ? Array.from(wrapper.getElementsByTagName('canvas')) 
            : Array.from(paperRoll.getElementsByTagName('canvas'));
        canvases.forEach(c => c.remove());
        currentLineText = [];
        printedLinesText = []; // Reset text buffer
        Object.assign(activeStyles, {
            doubleWidth: false,
            doubleHeight: false,
            underline: false,
            narrowMode: 'normal'
        });
        updateActiveStyleUI();
        updateBufferLed();
        
        // Reset scroll position and auto-scroll lock
        isLockedToBottom = true;
        btnReturnBottom.classList.remove('show');
        isProgrammaticScroll = true;
        
        if (programmaticScrollTimeout) clearTimeout(programmaticScrollTimeout);
        programmaticScrollTimeout = setTimeout(() => {
            isProgrammaticScroll = false;
            programmaticScrollTimeout = null;
        }, 150);
        
        paperRollContainer.scrollTop = 0;
        
        showToast('Paper roll cleared & styles reset', 'fa-trash-can');
    }
    btnClearRoll.addEventListener('click', clearPaperRoll);

    // Stitches all canvas elements into a single export canvas applying simulation filters
    function stitchPrintoutCanvas(canvases, totalHeight) {
        // 1. Create intermediate canvas for ink content
        const inkCanvas = document.createElement('canvas');
        inkCanvas.width = 640;
        inkCanvas.height = totalHeight;
        const inkCtx = inkCanvas.getContext('2d');
        
        // 2. Draw all printed canvases onto intermediate ink canvas
        let currentY = 0;
        for (let i = 0; i < canvases.length; i++) {
            inkCtx.drawImage(canvases[i], 0, currentY);
            currentY += canvases[i].height;
        }
        
        // 3. Apply Paper Degradation (135deg repeating mask) to the ink canvas
        const degVal = sliderDegradation ? parseInt(sliderDegradation.value) : 0;
        if (degVal > 0) {
            const minOpacity = 1 - (degVal / 100) * 0.85;
            
            const maskCanvas = document.createElement('canvas');
            maskCanvas.width = 640;
            maskCanvas.height = totalHeight;
            const maskCtx = maskCanvas.getContext('2d');
            
            // Create a tile to repeat the 135deg linear gradient
            const tileCanvas = document.createElement('canvas');
            tileCanvas.width = 700;
            tileCanvas.height = 700;
            const tileCtx = tileCanvas.getContext('2d');
            
            const grad = tileCtx.createLinearGradient(700, 0, 0, 700);
            grad.addColorStop(0/700, 'rgba(0,0,0,1)');
            grad.addColorStop(120/700, 'rgba(0,0,0,1)');
            grad.addColorStop(280/700, `rgba(0,0,0,${minOpacity})`);
            grad.addColorStop(380/700, `rgba(0,0,0,${minOpacity})`);
            grad.addColorStop(540/700, 'rgba(0,0,0,1)');
            grad.addColorStop(700/700, 'rgba(0,0,0,1)');
            
            tileCtx.fillStyle = grad;
            tileCtx.fillRect(0, 0, 700, 700);
            
            const pattern = maskCtx.createPattern(tileCanvas, 'repeat');
            maskCtx.fillStyle = pattern;
            maskCtx.fillRect(0, 0, 640, totalHeight);
            
            inkCtx.globalCompositeOperation = 'destination-in';
            inkCtx.drawImage(maskCanvas, 0, 0);
        }
        
        // 4. Create final export canvas
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = 640;
        exportCanvas.height = totalHeight;
        const exportCtx = exportCanvas.getContext('2d');
        
        // 4a. Fill paper background
        exportCtx.fillStyle = currentPaperBg;
        exportCtx.fillRect(0, 0, 640, totalHeight);
        
        // 4b. Draw edge burn borders on export canvas if ageVal > 0
        const ageVal = sliderPaperAge ? parseInt(sliderPaperAge.value) : 0;
        if (ageVal > 0) {
            const factor = ageVal / 100;
            const inkRgb = hexToRgb(currentInkColor);
            
            const sharpOpacity = factor * 0.55;
            const burnOpacity = factor * 0.12;
            
            // Sharp left edge
            let gradLeftSharp = exportCtx.createLinearGradient(0, 0, 3 * factor, 0);
            gradLeftSharp.addColorStop(0, `rgba(${inkRgb.r}, ${inkRgb.g}, ${inkRgb.b}, ${sharpOpacity})`);
            gradLeftSharp.addColorStop(1, `rgba(${inkRgb.r}, ${inkRgb.g}, ${inkRgb.b}, 0)`);
            exportCtx.fillStyle = gradLeftSharp;
            exportCtx.fillRect(0, 0, Math.ceil(3 * factor), totalHeight);
            
            // Sharp right edge
            let gradRightSharp = exportCtx.createLinearGradient(640, 0, 640 - 3 * factor, 0);
            gradRightSharp.addColorStop(0, `rgba(${inkRgb.r}, ${inkRgb.g}, ${inkRgb.b}, ${sharpOpacity})`);
            gradRightSharp.addColorStop(1, `rgba(${inkRgb.r}, ${inkRgb.g}, ${inkRgb.b}, 0)`);
            exportCtx.fillStyle = gradRightSharp;
            exportCtx.fillRect(640 - Math.ceil(3 * factor), 0, Math.ceil(3 * factor), totalHeight);
            
            // Soft left edge
            let gradLeftSoft = exportCtx.createLinearGradient(0, 0, 16 * factor, 0);
            gradLeftSoft.addColorStop(0, `rgba(${inkRgb.r}, ${inkRgb.g}, ${inkRgb.b}, ${burnOpacity})`);
            gradLeftSoft.addColorStop(1, `rgba(${inkRgb.r}, ${inkRgb.g}, ${inkRgb.b}, 0)`);
            exportCtx.fillStyle = gradLeftSoft;
            exportCtx.fillRect(0, 0, Math.ceil(16 * factor), totalHeight);
            
            // Soft right edge
            let gradRightSoft = exportCtx.createLinearGradient(640, 0, 640 - 16 * factor, 0);
            gradRightSoft.addColorStop(0, `rgba(${inkRgb.r}, ${inkRgb.g}, ${inkRgb.b}, ${burnOpacity})`);
            gradRightSoft.addColorStop(1, `rgba(${inkRgb.r}, ${inkRgb.g}, ${inkRgb.b}, 0)`);
            exportCtx.fillStyle = gradRightSoft;
            exportCtx.fillRect(640 - Math.ceil(16 * factor), 0, Math.ceil(16 * factor), totalHeight);
        }
        
        // 4c. Draw ink canvas with the appropriate global alpha (Ink Fade)
        const fadeVal = sliderInkFade ? parseInt(sliderInkFade.value) : 0;
        exportCtx.globalAlpha = 1 - (fadeVal / 100) * 0.75;
        exportCtx.drawImage(inkCanvas, 0, 0);
        
        return exportCanvas;
    }

    // Save Printout (Stitches all canvas elements into one image)
    function downloadPrintout() {
        const wrapper = document.getElementById('paperContentWrapper');
        const canvases = wrapper 
            ? wrapper.getElementsByTagName('canvas')
            : paperRoll.getElementsByTagName('canvas');
        if (canvases.length === 0) {
            showToast('No print data to save!', 'fa-circle-xmark');
            return;
        }

        // Calculate aggregate height
        let totalHeight = 0;
        for (let i = 0; i < canvases.length; i++) {
            totalHeight += canvases[i].height;
        }

        // Create temporary canvas with stitched contents
        const exportCanvas = stitchPrintoutCanvas(canvases, totalHeight);

        // Trigger download
        const link = document.createElement('a');
        link.download = `psion_printout_${Date.now()}.png`;
        link.href = exportCanvas.toDataURL('image/png');
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showToast('Printout image saved!', 'fa-file-arrow-down');
    }
    btnDownloadPrint.addEventListener('click', downloadPrintout);

    async function copyPrintoutImage() {
        const wrapper = document.getElementById('paperContentWrapper');
        const canvases = wrapper 
            ? wrapper.querySelectorAll('canvas')
            : paperRoll.querySelectorAll('canvas');
        if (canvases.length === 0) {
            showToast('No print content to copy!', 'fa-circle-xmark');
            return;
        }

        try {
            let totalHeight = 0;
            for (let i = 0; i < canvases.length; i++) {
                totalHeight += canvases[i].height;
            }

            // Create temporary canvas with stitched contents
            const exportCanvas = stitchPrintoutCanvas(canvases, totalHeight);

            exportCanvas.toBlob(async (blob) => {
                try {
                    const item = new ClipboardItem({ 'image/png': blob });
                    await navigator.clipboard.write([item]);
                    showToast('Printout image copied to clipboard!', 'fa-copy');
                } catch (err) {
                    console.error('Failed to copy image to clipboard:', err);
                    showToast('Failed to copy image', 'fa-triangle-exclamation');
                }
            }, 'image/png');
        } catch (err) {
            console.error('Failed to copy printout:', err);
            showToast('Error copying image', 'fa-triangle-exclamation');
        }
    }
    if (btnCopyPrint) btnCopyPrint.addEventListener('click', copyPrintoutImage);
    if (btnPrintPaper) {
        btnPrintPaper.addEventListener('click', () => {
            const wrapper = document.getElementById('paperContentWrapper');
            const canvases = wrapper ? wrapper.getElementsByTagName('canvas') : [];
            if (canvases.length === 0) {
                showToast('No print data to print!', 'fa-circle-xmark');
                return;
            }
            window.print();
        });
    }

    // Save Text Printout (downloads accumulated text as a .txt file)
    function downloadTextPrintout() {
        if (printedLinesText.length === 0) {
            showToast('No print text to save!', 'fa-circle-xmark');
            return;
        }

        const textContent = printedLinesText.join('\n');
        const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
        
        const link = document.createElement('a');
        link.download = `psion_printout_${Date.now()}.txt`;
        link.href = URL.createObjectURL(blob);
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

        showToast('Text printout saved!', 'fa-file-arrow-down');
    }
    if (btnDownloadText) {
        btnDownloadText.addEventListener('click', downloadTextPrintout);
    }

    // Copy Text to Clipboard
    function copyTextPrintout() {
        if (printedLinesText.length === 0) {
            showToast('No print text to copy!', 'fa-circle-xmark');
            return;
        }

        const textContent = printedLinesText.join('\n');
        navigator.clipboard.writeText(textContent)
            .then(() => {
                showToast('Text copied to clipboard!', 'fa-copy');
            })
            .catch(err => {
                showToast('Failed to copy text!', 'fa-circle-xmark');
                console.error(err);
            });
    }
    if (btnCopyText) {
        btnCopyText.addEventListener('click', copyTextPrintout);
    }

    // 9. Simulated Self-Test Page
    function printTestPage() {
        showToast('Starting Self-Test Print...', 'fa-vial');
        printStats.textContent = 'Testing';
        if (btnPrintTest) btnPrintTest.disabled = true;

        // Helper to simulate receiving byte arrays
        function simReceiveString(str, customStyles = {}) {
            // Apply custom styles
            Object.assign(activeStyles, {
                doubleWidth: false,
                doubleHeight: false,
                underline: false,
                narrowMode: 'normal'
            }, customStyles);
            
            updateActiveStyleUI();
            
            const bytes = new TextEncoder().encode(str);
            processIncomingBytes(bytes);
            
            // Send Carriage Return (13)
            processIncomingBytes([13]);
        }

        // Test Graphics drawing
        // Create checkered graphics lines (8 vertical dots each, 256 wide)
        const buf1 = [];
        const buf2 = [];
        const buf3 = [];
        
        for (let col = 0; col < 256; col++) {
            // buf1: alternating vertical blocks of 4 pixels
            buf1.push(col % 8 < 4 ? 0xF0 : 0x0F);
            // buf2: checkered shifted
            buf2.push(col % 8 < 4 ? 0x0F : 0xF0);
            // buf3: border stripes
            buf3.push(col % 16 === 0 || col === 255 ? 0xFF : 0x81);
        }

        // Define print sequence steps
        const steps = [
            () => createBlankLineCanvas(12),
            () => simReceiveString('PSION PRINTER 2 WEB EMULATOR', { doubleWidth: false, doubleHeight: true, underline: true }),
            () => simReceiveString('----------------------------', { underline: false }),
            () => simReceiveString('Normal Mode: 40 Columns Standard 5x7', { narrowMode: 'normal' }),
            () => simReceiveString('20 Column Mode', { doubleWidth: true }),
            () => simReceiveString('Narrow Mode: 60 Columns Dense Font', { narrowMode: 'narrow' }),
            () => simReceiveString('Very Narrow Mode: 80 Columns High Density', { narrowMode: 'very-narrow' }),
            () => simReceiveString('Standard Underline Text Example', { underline: true }),
            () => simReceiveString('Double Height Text Example', { doubleHeight: true, underline: false }),
            () => simReceiveString('Double Height Underline Text', { doubleHeight: true, underline: true }),
            () => simReceiveString('Back to normal baseline printing.', { narrowMode: 'normal' }),
            () => simReceiveString('----------------------------'),
            () => printGraphicsLine(buf1),
            () => printGraphicsLine(buf2),
            () => printGraphicsLine(buf1),
            () => printGraphicsLine(buf2),
            () => printGraphicsLine(buf3),
            () => simReceiveString('--- PHYSICAL GRAPHICS COMPLETED ---'),
            () => simReceiveString('** SELF-TEST COMPLETED SUCCESSFULLY **', { doubleWidth: false, doubleHeight: true })
        ];

        let index = 0;
        function runNextStep() {
            if (index >= steps.length) {
                // Reset emulator styles to normal
                Object.assign(activeStyles, {
                    doubleWidth: false,
                    doubleHeight: false,
                    underline: false,
                    narrowMode: 'normal'
                });
                updateActiveStyleUI();
                feedPaper(3);
                
                if (btnPrintTest) btnPrintTest.disabled = false;
                printStats.textContent = 'Online';
                return;
            }

            steps[index]();
            
            // Graphics take longer (500ms) than text lines (300ms)
            const isGraphics = index >= 12 && index <= 16;
            const delay = isGraphics ? 500 : 300;
            
            index++;
            setTimeout(runNextStep, delay);
        }

        runNextStep();
    }
    if (btnPrintTest) btnPrintTest.addEventListener('click', printTestPage);

    // Scroll monitoring for live view lock
    paperRollContainer.addEventListener('scroll', () => {
        if (isProgrammaticScroll) {
            const target = paperRollContainer.scrollHeight - paperRollContainer.clientHeight;
            if (Math.abs(paperRollContainer.scrollTop - target) <= 2) {
                isProgrammaticScroll = false;
                if (programmaticScrollTimeout) {
                    clearTimeout(programmaticScrollTimeout);
                    programmaticScrollTimeout = null;
                }
            }
            return;
        }
        
        const threshold = 30; // px threshold
        const currentScroll = paperRollContainer.scrollTop + paperRollContainer.clientHeight;
        const maxScroll = paperRollContainer.scrollHeight;
        
        // If scrolled up away from bottom, unlock auto-scroll and show button
        if (maxScroll - currentScroll > threshold) {
            isLockedToBottom = false;
            btnReturnBottom.classList.add('show');
        } else {
            isLockedToBottom = true;
            btnReturnBottom.classList.remove('show');
        }
    });
 
    // Return to bottom click handler
    btnReturnBottom.addEventListener('click', () => {
        isLockedToBottom = true;
        btnReturnBottom.classList.remove('show');
        isProgrammaticScroll = true;
        
        if (programmaticScrollTimeout) clearTimeout(programmaticScrollTimeout);
        programmaticScrollTimeout = setTimeout(() => {
            isProgrammaticScroll = false;
            programmaticScrollTimeout = null;
        }, 800); // Wait for smooth scroll animation to finish
        
        paperRollContainer.scrollTo({
            top: paperRollContainer.scrollHeight,
            behavior: 'smooth'
        });
        showToast('Locked to bottom (Live View)', 'fa-arrow-down');
    });

    // Dynamic paper padding to keep active print line positioned at the cover
    function updatePaperPadding() {
        const clientHeight = paperRollContainer.clientHeight;
        const coverHeight = 120; // height of the smoky cover (5 lines of 24px)
        const printHeadOffset = 72; // 3 lines under print head (bottom spacer height)
        
        // padding-top ensures that on a new page, the top of the paper starts at the print head
        const paddingTop = Math.max(0, clientHeight - printHeadOffset);
        
        const topSpacer = document.getElementById('paperTopSpacer');
        const bottomSpacer = document.getElementById('paperBottomSpacer');
        
        if (topSpacer) topSpacer.style.height = `${paddingTop}px`;
        if (bottomSpacer) bottomSpacer.style.height = `${printHeadOffset}px`;
        
        // Reset legacy inline paddings
        paperRoll.style.paddingTop = '0px';
        paperRoll.style.paddingBottom = '0px';
    }
    window.addEventListener('resize', updatePaperPadding);

    // Sidebar Panel Toggle logic
    function toggleGuideSidebar(forceState) {
        const isOpen = forceState !== undefined ? forceState : !guidePanel.classList.contains('open');
        guidePanel.classList.toggle('open', isOpen);
        if (guideTrigger) {
            guideTrigger.classList.toggle('panel-open', isOpen);
            if (guideTriggerIcon) {
                guideTriggerIcon.className = isOpen ? 'fa-solid fa-chevron-left' : 'fa-solid fa-chevron-right';
            }
        }
    }

    function toggleControlsSidebar(forceState) {
        if (controlsPanel) controlsPanel.classList.remove('peek');
        if (controlsTrigger) controlsTrigger.classList.remove('peek');

        const isOpen = forceState !== undefined ? forceState : !controlsPanel.classList.contains('open');
        controlsPanel.classList.toggle('open', isOpen);
        if (controlsTrigger) {
            controlsTrigger.classList.toggle('panel-open', isOpen);
            if (controlsTriggerIcon) {
                controlsTriggerIcon.className = isOpen ? 'fa-solid fa-chevron-right' : 'fa-solid fa-chevron-left';
            }
        }
        if (isOpen) {
            toggleHelpSidebar(false);
            togglePrintModesSidebar(false);
            toggleOperationsSidebar(false);
        }
    }

    function toggleHelpSidebar(forceState) {
        const isOpen = forceState !== undefined ? forceState : !helpPanel.classList.contains('open');
        helpPanel.classList.toggle('open', isOpen);
        if (helpTrigger) {
            helpTrigger.classList.toggle('panel-open', isOpen);
            if (helpTriggerIcon) {
                helpTriggerIcon.className = isOpen ? 'fa-solid fa-chevron-right' : 'fa-solid fa-chevron-left';
            }
        }
        if (isOpen) {
            toggleControlsSidebar(false);
            togglePrintModesSidebar(false);
            toggleOperationsSidebar(false);
        }
    }

    function togglePrintModesSidebar(forceState) {
        const isOpen = forceState !== undefined ? forceState : !printModesPanel.classList.contains('open');
        printModesPanel.classList.toggle('open', isOpen);
        if (printModesTrigger) {
            printModesTrigger.classList.toggle('panel-open', isOpen);
            if (printModesTriggerIcon) {
                printModesTriggerIcon.className = isOpen ? 'fa-solid fa-chevron-right' : 'fa-solid fa-chevron-left';
            }
        }
        if (isOpen) {
            toggleHelpSidebar(false);
            toggleControlsSidebar(false);
            toggleOperationsSidebar(false);
        }
    }

    function toggleOperationsSidebar(forceState) {
        const isOpen = forceState !== undefined ? forceState : !operationsPanel.classList.contains('open');
        operationsPanel.classList.toggle('open', isOpen);
        if (operationsTrigger) {
            operationsTrigger.classList.toggle('panel-open', isOpen);
            if (operationsTriggerIcon) {
                operationsTriggerIcon.className = isOpen ? 'fa-solid fa-chevron-right' : 'fa-solid fa-chevron-left';
            }
        }
        if (isOpen) {
            toggleHelpSidebar(false);
            toggleControlsSidebar(false);
            togglePrintModesSidebar(false);
        }
    }

    // Set up click listeners for triggers and close buttons
    if (guideTrigger) guideTrigger.addEventListener('click', () => toggleGuideSidebar());
    if (btnCloseGuide) btnCloseGuide.addEventListener('click', () => toggleGuideSidebar(false));

    if (controlsTrigger) controlsTrigger.addEventListener('click', () => toggleControlsSidebar());
    if (btnCloseControls) btnCloseControls.addEventListener('click', () => toggleControlsSidebar(false));

    if (helpTrigger) helpTrigger.addEventListener('click', () => toggleHelpSidebar());
    if (btnCloseHelp) btnCloseHelp.addEventListener('click', () => toggleHelpSidebar(false));

    // Collapsible guide cards in Help panel
    const helpGuideCards = document.querySelectorAll('#help-panel .guide-card');
    helpGuideCards.forEach(card => {
        const header = card.querySelector('.guide-header');
        if (header) {
            header.addEventListener('click', () => {
                card.classList.toggle('collapsed');
            });
        }
    });

    if (printModesTrigger) printModesTrigger.addEventListener('click', () => togglePrintModesSidebar());
    if (btnClosePrintModes) btnClosePrintModes.addEventListener('click', () => togglePrintModesSidebar(false));

    if (operationsTrigger) operationsTrigger.addEventListener('click', () => toggleOperationsSidebar());
    if (btnCloseOperations) btnCloseOperations.addEventListener('click', () => toggleOperationsSidebar(false));

    // GPRINT Transfer Modal wizard logic
    if (btnTransferGprint) {
        btnTransferGprint.addEventListener('click', () => {
            // Check if emulation serial session is active
            if (isPrinterEmulationActive) {
                modalStepWarning.style.display = 'block';
                wasEmulationActiveBeforeTransfer = true;
            } else {
                modalStepWarning.style.display = 'none';
                wasEmulationActiveBeforeTransfer = false;
            }

            // Reset modal elements state
            transferProgressSection.style.display = 'none';
            translationInstructions.style.display = 'none';
            btnStartGprintTransfer.style.display = 'inline-block';
            btnCancelGprintTransfer.style.display = 'inline-block';
            btnDoneGprintTransfer.style.display = 'none';
            
            btnStartGprintTransfer.disabled = false;
            btnCancelGprintTransfer.disabled = false;
            gprintProgressBar.style.width = '0%';
            
            // Show modal
            gprintModal.style.display = 'flex';
        });
    }

    function closeGprintModal() {
        gprintModal.style.display = 'none';
    }

    function finishOrCancelTransfer() {
        closeGprintModal();
        if (wasEmulationActiveBeforeTransfer) {
            isPrinterEmulationActive = true;
            updateConnectionStatus(true);
            wasEmulationActiveBeforeTransfer = false;
            showToast('Returned to printer emulation mode', 'fa-print');
        }
    }

    if (btnCloseGprintModal) btnCloseGprintModal.addEventListener('click', finishOrCancelTransfer);
    if (btnCancelGprintTransfer) btnCancelGprintTransfer.addEventListener('click', finishOrCancelTransfer);
    if (btnDoneGprintTransfer) btnDoneGprintTransfer.addEventListener('click', finishOrCancelTransfer);

    if (btnStartGprintTransfer) {
        btnStartGprintTransfer.addEventListener('click', async () => {
            try {
                // Step A: Warn user and suspend emulation if active
                if (isPrinterEmulationActive) {
                    wasEmulationActiveBeforeTransfer = true;
                    isPrinterEmulationActive = false;
                    updateConnectionStatus(false); // Logically disconnects UI
                }

                // Step B: Open serial port for GPRINT transfer if not open
                if (!port) {
                    gprintTransferStatus.classList.add('awaiting');
                    gprintTransferStatus.textContent = 'Awaiting Serial Port Selection...';
                    transferProgressSection.style.display = 'block';
                    
                    port = await navigator.serial.requestPort();
                    await port.open({ 
                        baudRate: 9600,
                        dataBits: 8,
                        stopBits: 1,
                        parity: 'none',
                        flowControl: 'none'
                    });
                    if (!keepReading) {
                        readLoop();
                    }
                }

                // Step C & D: Start Transfer Sequence
                gprintTransferStatus.classList.remove('awaiting');
                btnStartGprintTransfer.disabled = true;
                btnCancelGprintTransfer.disabled = true;
                transferProgressSection.style.display = 'block';
                gprintTransferStatus.textContent = 'Clearing buffers & initiating transfer...';

                // Get OPL code content
                const codeText = gprintCode.value;
                // Split by newline
                const lines = codeText.split('\n');

                let lineIdx = 0;
                // Tiny pause to ensure serial links are cleared
                await new Promise(r => setTimeout(r, 400));

                async function sendNextLine() {
                    if (lineIdx >= lines.length) {
                        // Send CTRL+Z (ASCII 26) to cleanly terminate the transfer on the Psion Organiser
                        try {
                            const writer = port.writable.getWriter();
                            const ctrlZ = new Uint8Array([26]);
                            await writer.write(ctrlZ);
                            writer.releaseLock();
                        } catch (err) {
                            console.error('Error sending CTRL+Z terminator:', err);
                        }

                        // Transfer done
                        gprintProgressBar.style.width = '100%';
                        gprintTransferStatus.textContent = 'Transfer completed!';
                        btnStartGprintTransfer.style.display = 'none';
                        btnCancelGprintTransfer.style.display = 'none';
                        btnDoneGprintTransfer.style.display = 'inline-block';
                        translationInstructions.style.display = 'block';
                        showToast('GPRINT routine transferred!', 'fa-file-circle-check');

                        // Smoothly scroll modal body to reveal translation instructions
                        if (gprintModal) {
                            const modalBody = gprintModal.querySelector('.modal-body');
                            if (modalBody) {
                                setTimeout(() => {
                                    modalBody.scrollTo({
                                        top: modalBody.scrollHeight,
                                        behavior: 'smooth'
                                    });
                                }, 150);
                            }
                        }
                        return;
                    }

                    // Append CRLF to each code line for COMMS link compatibility
                    const lineStr = lines[lineIdx].trimRight() + '\r\n';
                    gprintTransferStatus.textContent = `Sending line ${lineIdx + 1} of ${lines.length}...`;

                    try {
                        const writer = port.writable.getWriter();
                        const encoder = new TextEncoder();
                        await writer.write(encoder.encode(lineStr));
                        writer.releaseLock();

                        // Update progress bar
                        const pct = Math.round(((lineIdx + 1) / lines.length) * 100);
                        gprintProgressBar.style.width = `${pct}%`;

                        lineIdx++;
                        // Use 80ms delay between lines to match Psion receiver speed
                        setTimeout(sendNextLine, 80);
                    } catch (err) {
                        console.error('GPRINT transfer error:', err);
                        gprintTransferStatus.textContent = `Error: ${err.message}`;
                        btnStartGprintTransfer.disabled = false;
                        btnCancelGprintTransfer.disabled = false;
                        showToast('Transfer failed', 'fa-triangle-exclamation');
                    }
                }

                sendNextLine();

            } catch (err) {
                console.error('GPRINT serial initiation error:', err);
                gprintTransferStatus.classList.remove('awaiting');
                gprintTransferStatus.textContent = `Initiation Error: ${err.message}`;
                btnStartGprintTransfer.disabled = false;
                btnCancelGprintTransfer.disabled = false;
            }
        });
    }

    // Global Keyboard Shortcut Bindings
    window.addEventListener('keydown', (e) => {
        // Ignore keybindings if focusing on input fields to allow normal typing
        const tag = document.activeElement.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || document.activeElement.isContentEditable) {
            return;
        }

        // Alt + G: Toggle Guide Panel
        if (e.altKey && e.key.toLowerCase() === 'g') {
            e.preventDefault();
            toggleGuideSidebar();
        }
        // Alt + C: Toggle Controls Panel
        else if (e.altKey && e.key.toLowerCase() === 'c') {
            e.preventDefault();
            toggleControlsSidebar();
        }
        // Alt + H: Toggle Help Panel
        else if (e.altKey && e.key.toLowerCase() === 'h') {
            e.preventDefault();
            toggleHelpSidebar();
        }
        // Alt + M: Toggle Print Modes Panel
        else if (e.altKey && e.key.toLowerCase() === 'm') {
            e.preventDefault();
            togglePrintModesSidebar();
        }
        // Alt + O: Toggle Operations Panel
        else if (e.altKey && e.key.toLowerCase() === 'o') {
            e.preventDefault();
            toggleOperationsSidebar();
        }
        // Alt + S: Connect Serial
        else if (e.altKey && e.key.toLowerCase() === 's') {
            e.preventDefault();
            if (btnSerialConnect && !btnSerialConnect.disabled) {
                btnSerialConnect.click();
            }
        }
        // Alt + T: Print Test Page
        else if (e.altKey && e.key.toLowerCase() === 't') {
            e.preventDefault();
            if (btnPrintTest && !btnPrintTest.disabled) {
                btnPrintTest.click();
            }
        }
        // Alt + F: Feed Paper
        else if (e.altKey && e.key.toLowerCase() === 'f') {
            e.preventDefault();
            if (btnFeedPaper && !btnFeedPaper.disabled) {
                btnFeedPaper.click();
            }
        }
        // Delete: Clear Paper Roll
        else if (e.key === 'Delete') {
            e.preventDefault();
            clearPaperRoll();
        }
    });

    // Start visual cues (Pulse & Peek) for Controls tab after a short delay
    setTimeout(() => {
        if (controlsTrigger) {
            // Apply pulse glow animation class
            controlsTrigger.classList.add('pulse-glow');
            
            // Peek slide-out animation hint
            if (controlsPanel && !controlsPanel.classList.contains('open')) {
                controlsPanel.classList.add('peek');
                controlsTrigger.classList.add('peek');
                
                // Retract peek after 1.5 seconds
                setTimeout(() => {
                    controlsPanel.classList.remove('peek');
                    controlsTrigger.classList.remove('peek');
                }, 1500);
            }
        }
    }, 600);

    // Load and apply stored Thermal Print Simulation settings
    function loadThermalSimulationSettings() {
        const preset = localStorage.getItem('thermalPreset') || 'standard';
        const fade = parseInt(localStorage.getItem('thermalFade') || '0');
        const age = parseInt(localStorage.getItem('thermalAge') || '0');
        const jitter = parseInt(localStorage.getItem('thermalJitter') || '0');

        // Apply Preset
        if (selectPaperPreset) {
            selectPaperPreset.value = preset;
            if (preset === 'standard') {
                currentInkColor = '#000000';
            } else if (preset === 'blue') {
                currentInkColor = '#1e3a8a';
            } else if (preset === 'aged') {
                currentInkColor = '#44403c';
            }
            document.documentElement.style.setProperty('--ink-color', currentInkColor);
        }

        // Apply Ink Fade
        if (sliderInkFade) {
            sliderInkFade.value = fade;
            if (labelInkFade) labelInkFade.textContent = `${fade}%`;
            const opacity = 1 - (fade / 100) * 0.75;
            document.documentElement.style.setProperty('--ink-fade-opacity', opacity);
        }

        // Apply Paper Age
        if (sliderPaperAge) {
            sliderPaperAge.value = age;
            if (labelPaperAge) labelPaperAge.textContent = `${age}%`;
        }

        // Apply Paper Color based on Preset and Age
        updatePaperColor();

        // Apply Mechanical Jitter
        if (sliderJitter) {
            sliderJitter.value = jitter;
            mechanicalJitterAmount = (jitter / 100) * 4;
            if (labelJitter) labelJitter.textContent = `${mechanicalJitterAmount.toFixed(1)}px`;
        }

        // Apply Paper Degradation
        const degradation = parseInt(localStorage.getItem('thermalDegradation') || '0');
        if (sliderDegradation) {
            sliderDegradation.value = degradation;
            if (labelDegradation) labelDegradation.textContent = `${degradation}%`;
            
            if (degradation === 0) {
                document.documentElement.style.setProperty('--degradation-mask', 'none');
            } else {
                const minOpacity = 1 - (degradation / 100) * 0.85; // fades down to 15% opacity
                const degMask = `repeating-linear-gradient(135deg,
                    rgba(0,0,0,1) 0px,
                    rgba(0,0,0,1) 120px,
                    rgba(0,0,0,${minOpacity}) 280px,
                    rgba(0,0,0,${minOpacity}) 380px,
                    rgba(0,0,0,1) 540px,
                    rgba(0,0,0,1) 700px
                )`;
                document.documentElement.style.setProperty('--degradation-mask', degMask);
            }
        }
    }

    // Load persisted Serial Port Settings
    function loadSerialSettings() {
        if (selectFlowControl) {
            selectFlowControl.value = localStorage.getItem('emu_flowControl') || 'xonxoff';
        }
        if (selectBaudRate) {
            selectBaudRate.value = localStorage.getItem('emu_baudRate') || '9600';
        }
        if (selectDataBits) {
            selectDataBits.value = localStorage.getItem('emu_dataBits') || '8';
        }
        if (selectParity) {
            selectParity.value = localStorage.getItem('emu_parity') || 'none';
        }
        if (selectStopBits) {
            selectStopBits.value = localStorage.getItem('emu_stopBits') || '1';
        }
    }

    // Bind change listeners to save Serial Port Settings
    if (selectFlowControl) {
        selectFlowControl.addEventListener('change', (e) => {
            localStorage.setItem('emu_flowControl', e.target.value);
        });
    }
    if (selectBaudRate) {
        selectBaudRate.addEventListener('change', (e) => {
            localStorage.setItem('emu_baudRate', e.target.value);
        });
    }
    if (selectDataBits) {
        selectDataBits.addEventListener('change', (e) => {
            localStorage.setItem('emu_dataBits', e.target.value);
        });
    }
    if (selectParity) {
        selectParity.addEventListener('change', (e) => {
            localStorage.setItem('emu_parity', e.target.value);
        });
    }
    if (selectStopBits) {
        selectStopBits.addEventListener('change', (e) => {
            localStorage.setItem('emu_stopBits', e.target.value);
        });
    }

    // Load persisted Active Printer Settings
    function loadActivePrinterSettings() {
        const cols = localStorage.getItem('emu_columns') || '40';
        const style = localStorage.getItem('emu_style') || 'normal';
        const underline = localStorage.getItem('emu_underline') || 'disabled';

        if (cols === '20') {
            activeStyles.doubleWidth = true;
            activeStyles.narrowMode = 'normal';
        } else if (cols === '40') {
            activeStyles.doubleWidth = false;
            activeStyles.narrowMode = 'normal';
        } else if (cols === '60') {
            activeStyles.doubleWidth = false;
            activeStyles.narrowMode = 'narrow';
        } else if (cols === '80') {
            activeStyles.doubleWidth = false;
            activeStyles.narrowMode = 'very-narrow';
        }

        activeStyles.doubleHeight = (style === 'double-height');
        activeStyles.underline = (underline === 'enabled');

        updateActiveStyleUI();
    }

    // Initial state setup
    loadActivePrinterSettings();
    loadThermalSimulationSettings();
    loadSerialSettings();
    updateConnectionStatus(false);
    updatePaperPadding();
});
