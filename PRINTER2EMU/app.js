/* ==========================================================================
   Psion Organiser II Printer II Emulator - Core Logic & Rendering
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
    const btnClearRoll = document.getElementById('btnClearRoll');
    
    const btnCopyGprint = document.getElementById('btnCopyGprint');
    const gprintCode = document.getElementById('gprintCode');
    
    const paperRoll = document.getElementById('paperRoll');
    const paperRollContainer = document.getElementById('paperRollContainer');
    const printStats = document.getElementById('printStats');
    const btnReturnBottom = document.getElementById('btnReturnBottom');
    
    const statusColumns = document.getElementById('statusColumns');
    const statusStyle = document.getElementById('statusStyle');
    const statusUnderline = document.getElementById('statusUnderline');
    
    const toastContainer = document.getElementById('toastContainer');
    const chkFilterHandshake = document.getElementById('chkFilterHandshake');

    // 3. Application State variables
    let port = null;
    let reader = null;
    let keepReading = false;
    let isLockedToBottom = true;
    
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
        if (isConnected) {
            btnSerialConnect.innerHTML = '<i class="fa-solid fa-unlink"></i> Disconnect';
            ledStatus.className = 'led led-status connected';
            printStats.textContent = 'Ready';
            showToast('Serial Port Connected!', 'fa-plug-circle-check');
        } else {
            btnSerialConnect.innerHTML = '<i class="fa-solid fa-plug"></i> Connect Serial';
            ledStatus.className = 'led led-status disconnected';
            printStats.textContent = 'Idle';
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

    // Update the Sidebar Settings Table
    function updateActiveStyleUI() {
        let cols = 40;
        let styleName = 'Normal';
        
        if (activeStyles.narrowMode === 'very-narrow') {
            cols = 80;
            styleName = 'Very Narrow (Double Density)';
        } else if (activeStyles.narrowMode === 'narrow') {
            cols = 60;
            styleName = 'Narrow (Double Density)';
        } else if (activeStyles.doubleWidth) {
            cols = 20;
            styleName = 'Double Width';
        }
        
        if (activeStyles.doubleHeight) {
            styleName += ' + Double Height';
        }
        
        statusColumns.textContent = `${cols} Columns`;
        statusStyle.textContent = styleName;
        statusUnderline.textContent = activeStyles.underline ? 'Enabled' : 'Disabled';
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
            if (port) {
                await disconnectSerial();
            } else {
                await connectSerial();
            }
        });
    }

    async function connectSerial() {
        try {
            port = await navigator.serial.requestPort();
            await port.open({ 
                baudRate: 9600,
                dataBits: 8,
                stopBits: 1,
                parity: 'none',
                flowControl: 'none'
            });
            
            updateConnectionStatus(true);
            ignoreHandshake = true;
            setTimeout(() => { ignoreHandshake = false; }, 1000); // Filter startup handshakes for 1 sec
            readLoop();
        } catch (err) {
            console.error('Serial port connection error:', err);
            updateConnectionStatus(false);
            port = null;
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
                        processIncomingBytes(value);
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
                    printStats.textContent = 'Ready';
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
                printStats.textContent = 'Ready';
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
                const filterXon = chkFilterHandshake ? chkFilterHandshake.checked : true;
                if (!filterXon && !ignoreHandshake) {
                    activeStyles.doubleHeight = true;
                    updateActiveStyleUI();
                }
                break;
            case 18: // End double height mode
                const filterXoff = chkFilterHandshake ? chkFilterHandshake.checked : true;
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
            return;
        }

        // Determine line height: 48px if any character is doubleHeight, otherwise 24px
        const hasDoubleHeight = currentLineText.some(item => item.doubleHeight);
        const canvasHeight = hasDoubleHeight ? 48 : 24;

        // Create strip canvas
        const canvas = document.createElement('canvas');
        canvas.width = 640; // Native physical paper scale
        canvas.height = canvasHeight;
        canvas.style.height = `${canvasHeight}px`; // Lock display height to prevent browser flex stretching
        canvas.classList.add('paper-feed-anim');
        
        const ctx = canvas.getContext('2d');
        
        // Fill paper background
        ctx.fillStyle = '#faf9f5';
        ctx.fillRect(0, 0, 640, canvasHeight);
        
        // Setup ink color
        ctx.fillStyle = '#1c1917';
        
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
            const startY = baselineY - charHeight + (item.doubleHeight ? 0 : 0); 
            // Normal characters have 14px height. At baseline Y=32, they start at Y=18 (ending Y=32). Perfect alignment.

            const charData = FONT_5X7[item.char] || FONT_5X7[32]; // fallback to space

            // Draw character columns
            for (let colIdx = 0; colIdx < 5; colIdx++) {
                const colVal = charData[colIdx];
                for (let bit = 0; bit < 8; bit++) {
                    if ((colVal & (1 << bit)) !== 0) {
                        const px = currentX + colIdx * scaleX;
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
                
                ctx.fillRect(currentX, underlineY, charWidthWithSpacing, underlineHeight);
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
        canvas.classList.add('paper-feed-anim');
        
        const ctx = canvas.getContext('2d');
        
        // Fill paper background
        ctx.fillStyle = '#faf9f5';
        ctx.fillRect(0, 0, 640, 16);
        
        // Setup ink
        ctx.fillStyle = '#1c1917';
        
        // Center graphics (256 columns * 2px scale = 512px)
        // Starts at X = 72px (matching left border 12.5mm / 0.35mm = 36 dots = 72px)
        const startX = 72;

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
        paperRoll.appendChild(canvas);
        
        // Dynamically update padding on every print to handle layout shifts/initial 0-height client heights
        updatePaperPadding();
        
        // Scroll paper container to bottom if locked
        if (isLockedToBottom) {
            setTimeout(() => {
                paperRollContainer.scrollTop = paperRollContainer.scrollHeight;
            }, 10);
        }
    }

    // Create blank paper spacer
    function createBlankLineCanvas(height) {
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = height;
        canvas.style.height = `${height}px`; // Lock display height to prevent browser flex stretching
        canvas.classList.add('paper-feed-anim');
        
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#faf9f5';
        ctx.fillRect(0, 0, 640, height);
        
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
        paperRoll.innerHTML = '';
        currentLineText = [];
        Object.assign(activeStyles, {
            doubleWidth: false,
            doubleHeight: false,
            underline: false,
            narrowMode: 'normal'
        });
        updateActiveStyleUI();
        updateBufferLed();
        showToast('Paper roll cleared & styles reset', 'fa-trash-can');
    }
    btnClearRoll.addEventListener('click', clearPaperRoll);

    // Save Printout (Stitches all canvas elements into one image)
    function downloadPrintout() {
        const canvases = paperRoll.getElementsByTagName('canvas');
        if (canvases.length === 0) {
            showToast('No print data to save!', 'fa-circle-xmark');
            return;
        }

        // Calculate aggregate height
        let totalHeight = 0;
        for (let i = 0; i < canvases.length; i++) {
            totalHeight += canvases[i].height;
        }

        // Create temporary canvas
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = 640;
        exportCanvas.height = totalHeight;
        
        const ctx = exportCanvas.getContext('2d');
        
        // Draw canvases onto export canvas
        let currentY = 0;
        for (let i = 0; i < canvases.length; i++) {
            ctx.drawImage(canvases[i], 0, currentY);
            currentY += canvases[i].height;
        }

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

    // 9. Simulated Self-Test Page
    function printTestPage() {
        showToast('Starting Self-Test Print...', 'fa-vial');
        printStats.textContent = 'Testing';

        // 1. Feed a blank space
        createBlankLineCanvas(12);

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

        // Test normal width
        simReceiveString('PSION PRINTER II WEB EMULATOR', { doubleWidth: false, doubleHeight: true, underline: true });
        simReceiveString('----------------------------', { underline: false });
        
        // Test modes
        simReceiveString('Normal Mode: 40 Columns Standard 5x7', { narrowMode: 'normal' });
        simReceiveString('20 Column Mode', { doubleWidth: true });
        simReceiveString('Narrow Mode: 60 Columns Dense Font', { narrowMode: 'narrow' });
        simReceiveString('Very Narrow Mode: 80 Columns High Density', { narrowMode: 'very-narrow' });
        
        // Test underlining and height combinations
        simReceiveString('Standard Underline Text Example', { underline: true });
        simReceiveString('Double Height Text Example', { doubleHeight: true, underline: false });
        simReceiveString('Double Height Underline Text', { doubleHeight: true, underline: true });
        
        // Clear styles
        simReceiveString('Back to normal baseline printing.', { narrowMode: 'normal' });
        simReceiveString('----------------------------');

        // Test Graphics drawing
        // Create checkered graphics lines (8 vertical dots each, 256 wide)
        // Line 1: alternating pattern
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

        // Print graphics lines
        printGraphicsLine(buf1);
        printGraphicsLine(buf2);
        printGraphicsLine(buf1);
        printGraphicsLine(buf2);
        printGraphicsLine(buf3);
        
        simReceiveString('--- PHYSICAL GRAPHICS COMPLETED ---');

        // Finish self-test
        simReceiveString('** SELF-TEST COMPLETED SUCCESSFULLY **', { doubleWidth: false, doubleHeight: true });
        
        // Reset emulator styles to normal
        Object.assign(activeStyles, {
            doubleWidth: false,
            doubleHeight: false,
            underline: false,
            narrowMode: 'normal'
        });
        updateActiveStyleUI();
        
        feedPaper(3);
    }
    btnPrintTest.addEventListener('click', printTestPage);

    // Scroll monitoring for live view lock
    paperRollContainer.addEventListener('scroll', () => {
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
        paperRollContainer.scrollTo({
            top: paperRollContainer.scrollHeight,
            behavior: 'smooth'
        });
        showToast('Locked to bottom (Live View)', 'fa-arrow-down');
    });

    // Dynamic paper padding to keep active print line centered (halfway down)
    function updatePaperPadding() {
        const halfHeight = Math.floor(paperRollContainer.clientHeight / 2);
        paperRoll.style.paddingBottom = `${halfHeight}px`;
    }
    window.addEventListener('resize', updatePaperPadding);

    // Initial state setup
    updateActiveStyleUI();
    updateConnectionStatus(false);
    updatePaperPadding();
});
