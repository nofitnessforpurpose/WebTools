/**
 * EFX-80s Web Dot Matrix Emulator - Consolidated Application Script
 * Standalone compilation to bypass CORS file:// limits on native browsers.
 */

// ==========================================================================
// MODULE 1: ROM Character Font Data (formerly font-rom.js)
// ==========================================================================

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
    44: [0x00, 0x80, 0x60, 0x00, 0x00], // ,
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
    59: [0x00, 0x96, 0x36, 0x00, 0x00], // ;
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
    103: [0x18, 0xa4, 0xa4, 0xa4, 0x7c], // g
    104: [0x7f, 0x08, 0x04, 0x04, 0x78], // h
    105: [0x00, 0x44, 0x7d, 0x40, 0x00], // i
    106: [0x00, 0x80, 0x80, 0xfd, 0x00], // j
    107: [0x7f, 0x10, 0x28, 0x44, 0x00], // k
    108: [0x00, 0x41, 0x7f, 0x40, 0x00], // l
    109: [0x7c, 0x04, 0x18, 0x04, 0x78], // m
    110: [0x7c, 0x08, 0x04, 0x04, 0x78], // n
    111: [0x38, 0x44, 0x44, 0x44, 0x38], // o
    112: [0xfc, 0x24, 0x24, 0x24, 0x18], // p
    113: [0x18, 0x24, 0x24, 0x24, 0xfc], // q
    114: [0x7c, 0x08, 0x04, 0x04, 0x08], // r
    115: [0x48, 0x54, 0x54, 0x54, 0x20], // s
    116: [0x04, 0x3f, 0x44, 0x40, 0x20], // t
    117: [0x3c, 0x40, 0x40, 0x20, 0x7c], // u
    118: [0x1c, 0x20, 0x40, 0x20, 0x1c], // v
    119: [0x3c, 0x40, 0x30, 0x40, 0x3c], // w
    120: [0x44, 0x28, 0x10, 0x28, 0x44], // x
    121: [0x1c, 0xa0, 0xa0, 0xa0, 0x7c], // y
    122: [0x44, 0x64, 0x54, 0x4c, 0x44], // z
    123: [0x00, 0x08, 0x36, 0x41, 0x00], // {
    124: [0x00, 0x00, 0x7f, 0x00, 0x00], // |
    125: [0x00, 0x41, 0x36, 0x08, 0x00], // }
    126: [0x08, 0x08, 0x2a, 0x1c, 0x08], // ~
};

const DESCENDERS = new Set([44, 59, 103, 106, 112, 113, 121]); // , ; g j p q y

class FontRom {
    static getCharacter(code) {
        const matrix5x7 = FONT_5X7[code] || FONT_5X7[32];
        const output = [0, 0, 0, 0, 0, 0, 0, 0, 0];

        for (let i = 0; i < 5; i++) {
            output[i + 2] = matrix5x7[i];
        }
        return output;
    }
}

// ==========================================================================
// MODULE 2: Sound Synthesizer (formerly sound-synth.js)
// ==========================================================================

class SoundSynth {
    constructor() {
        this.ctx = null;
        this.motorOsc = null;
        this.motorGain = null;
        this.enabled = false; // Muted/disabled by default
    }

    init() {
        if (!this.enabled) return;
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playPrintSweep(durationMs = 300, isGraphics = false) {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const durationSec = durationMs / 1000;

        const motorOsc = this.ctx.createOscillator();
        const motorGain = this.ctx.createGain();
        motorOsc.type = 'triangle';
        motorOsc.frequency.setValueAtTime(110, now);
        motorOsc.frequency.linearRampToValueAtTime(115, now + durationSec * 0.5);
        motorOsc.frequency.linearRampToValueAtTime(108, now + durationSec);

        motorGain.gain.setValueAtTime(0, now);
        motorGain.gain.linearRampToValueAtTime(0.12, now + 0.03);
        motorGain.gain.setValueAtTime(0.12, now + durationSec - 0.05);
        motorGain.gain.linearRampToValueAtTime(0, now + durationSec);

        const motorFilter = this.ctx.createBiquadFilter();
        motorFilter.type = 'lowpass';
        motorFilter.frequency.setValueAtTime(300, now);

        motorOsc.connect(motorGain);
        motorGain.connect(motorFilter);
        motorFilter.connect(this.ctx.destination);

        const bufferSize = this.ctx.sampleRate * durationSec;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        const noiseNode = this.ctx.createBufferSource();
        noiseNode.buffer = noiseBuffer;

        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        
        // Print head click/pin frequency settings (kept for potential rollback):
        // - Previous (High click tone): isGraphics ? 2200 : 1800
        // - Current (Lower tone click): isGraphics ? 1200 : 1000
        noiseFilter.frequency.setValueAtTime(isGraphics ? 1200 : 1000, now);
        noiseFilter.Q.setValueAtTime(2.0, now); // Previous: 3.0

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0, now);
        noiseGain.gain.linearRampToValueAtTime(isGraphics ? 0.35 : 0.22, now + 0.03);

        const modOsc = this.ctx.createOscillator();
        const modGain = this.ctx.createGain();
        
        // Needle hammer firing buzz rate settings (kept for potential rollback):
        // - Previous: isGraphics ? 160 : 120 (fast buzz)
        // - Current: isGraphics ? 90 : 70 (slower pin hammer click rate)
        modOsc.frequency.setValueAtTime(isGraphics ? 90 : 70, now);
        modOsc.type = 'sawtooth';

        modGain.gain.setValueAtTime(0.5, now);

        modOsc.connect(noiseGain.gain);

        noiseGain.gain.setValueAtTime(isGraphics ? 0.25 : 0.18, now + durationSec - 0.05);
        noiseGain.gain.linearRampToValueAtTime(0, now + durationSec);

        noiseNode.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);

        motorOsc.start(now);
        motorOsc.stop(now + durationSec);
        
        noiseNode.start(now);
        noiseNode.stop(now + durationSec);
        
        modOsc.start(now);
        modOsc.stop(now + durationSec);
    }

    playFeed(durationMs = 150) {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const durationSec = durationMs / 1000;

        // Stepper motor coil hum: 440Hz square wave for that buzzy stepping energy
        const osc1 = this.ctx.createOscillator();
        const gain1 = this.ctx.createGain();
        osc1.type = 'square';
        osc1.frequency.setValueAtTime(440, now);
        // Frequency ramps up and down slightly for acceleration/deceleration
        osc1.frequency.linearRampToValueAtTime(480, now + durationSec * 0.2);
        osc1.frequency.linearRampToValueAtTime(420, now + durationSec);

        // Secondary metallic resonance: 880Hz triangle wave
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(880, now);
        osc2.frequency.linearRampToValueAtTime(960, now + durationSec * 0.2);
        osc2.frequency.linearRampToValueAtTime(840, now + durationSec);

        // LFO for discrete stepper steps vibration (180Hz sawtooth modulation)
        const modOsc = this.ctx.createOscillator();
        const modGain1 = this.ctx.createGain();
        const modGain2 = this.ctx.createGain();
        modOsc.type = 'sawtooth';
        modOsc.frequency.setValueAtTime(180, now);

        modGain1.gain.setValueAtTime(0.04, now); // Mod depth for carrier 1
        modGain2.gain.setValueAtTime(0.03, now); // Mod depth for carrier 2

        modOsc.connect(modGain1);
        modOsc.connect(modGain2);

        // Muffle buzz to fit physical casing resonance
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1400, now);

        gain1.gain.setValueAtTime(0, now);
        gain1.gain.linearRampToValueAtTime(0.08, now + 0.02);
        gain1.gain.exponentialRampToValueAtTime(0.005, now + durationSec);

        gain2.gain.setValueAtTime(0, now);
        gain2.gain.linearRampToValueAtTime(0.06, now + 0.02);
        gain2.gain.exponentialRampToValueAtTime(0.005, now + durationSec);

        modGain1.connect(gain1.gain);
        modGain2.connect(gain2.gain);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain1);
        filter.connect(gain2);
        gain1.connect(this.ctx.destination);
        gain2.connect(this.ctx.destination);

        // Friction noise (paper sliding through rubber/metal rollers)
        const bufferSize = this.ctx.sampleRate * durationSec;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        const noiseNode = this.ctx.createBufferSource();
        noiseNode.buffer = noiseBuffer;

        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(2600, now); // High-pitched slide sound
        noiseFilter.Q.setValueAtTime(1.5, now);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0, now);
        noiseGain.gain.linearRampToValueAtTime(0.06, now + 0.02);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

        noiseNode.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);

        osc1.start(now);
        osc1.stop(now + durationSec);
        osc2.start(now);
        osc2.stop(now + durationSec);
        modOsc.start(now);
        modOsc.stop(now + durationSec);
        noiseNode.start(now);
        noiseNode.stop(now + durationSec);
    }

    playTear() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const durationSec = 0.35;

        const bufferSize = this.ctx.sampleRate * durationSec;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            const baseNoise = Math.random() * 2 - 1;
            const crackle = (i % 80 === 0) ? (Math.random() > 0.5 ? 1.5 : -1.5) : 1;
            output[i] = baseNoise * crackle * 0.4;
        }

        const noiseNode = this.ctx.createBufferSource();
        noiseNode.buffer = noiseBuffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1000, now);
        filter.frequency.exponentialRampToValueAtTime(350, now + durationSec);
        filter.Q.setValueAtTime(1.5, now);

        const gainNode = this.ctx.createGain();
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.6, now + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + durationSec);

        noiseNode.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        noiseNode.start(now);
        noiseNode.stop(now + durationSec);
    }
}

// ==========================================================================
// MODULE 3: ESC/P Protocol Parser (formerly escp-parser.js)
// ==========================================================================

class EscpParser {
    constructor(callbacks) {
        this.callbacks = callbacks;
        this.pitch = 'pica';
        this.bold = false;
        this.doubleStrike = false;
        this.italic = false;
        this.underline = false;
        this.condensed = false;
        this.userDefinedActive = false;
        this.userDefinedChars = new Map();
        this.romCharsCopied = false;
        this.autoLineFeed = false;
        this.state = 'TEXT';
        this.graphicsType = null;
        this.graphicsLength = 0;
        this.graphicsBytesRead = 0;
        this.graphicsBuffer = [];
        this.udStartChar = 0;
        this.udEndChar = 0;
        this.udCurrentChar = 0;
        this.udAttr = 0;
        this.udDataBuffer = [];
        this.colonBytesRead = 0;
        this.lineBuffer = [];
        this.lastWasCr = false;
        this.currentX = 0; // Cumulative X position in pixels relative to leftMargin
        this.lineSpacing = 16; // Default 1/6 inch (16px in our 96 DPI scale)
    }

    reset() {
        this.pitch = 'pica';
        this.bold = false;
        this.doubleStrike = false;
        this.italic = false;
        this.underline = false;
        this.condensed = false;
        this.userDefinedActive = false;
        this.lineBuffer = [];
        this.state = 'TEXT';
        this.lastWasCr = false;
        this.callbacks.onStatusChange('Idle');
        this.currentX = 0;
        this.lineSpacing = 16;
    }

    parse(bytes) {
        if (this.callbacks.onLedRxFlash) {
            this.callbacks.onLedRxFlash();
        }
        for (let i = 0; i < bytes.length; i++) {
            this.processByte(bytes[i]);
        }
        if (this.callbacks.onStyleChange) {
            this.callbacks.onStyleChange();
        }
    }

    processByte(b) {
        switch (this.state) {
            case 'TEXT':
                this.handleTextByte(b);
                break;
            case 'ESC':
                this.handleEscByte(b);
                break;
            case 'ESC_DOLLAR_1':
                this.tempNL = b;
                this.state = 'ESC_DOLLAR_2';
                break;
            case 'ESC_DOLLAR_2':
                const absDots = this.tempNL + b * 256;
                this.currentX = absDots * (80 / 60); // Draft 1/60 inch in pixels
                this.state = 'TEXT';
                break;
            case 'ESC_BACKSLASH_1':
                this.tempNL = b;
                this.state = 'ESC_BACKSLASH_2';
                break;
            case 'ESC_BACKSLASH_2':
                let relDots = this.tempNL + b * 256;
                if (relDots >= 32768) relDots -= 65536; // Signed conversion
                this.currentX += relDots * (80 / 120); // Relative 1/120 inch in pixels
                this.currentX = Math.max(0, this.currentX);
                this.state = 'TEXT';
                break;
            case 'ESC_THREE':
                this.lineSpacing = Math.round(b * (16 / 36)); // n/216 inch = n * (16/36) px at 96 DPI
                this.state = 'TEXT';
                break;
            case 'ESC_C':
                if (b === 0) {
                    this.state = 'ESC_C_INCHES';
                } else {
                    this.callbacks.onSetPageLengthLines?.(b);
                    this.state = 'TEXT';
                }
                break;
            case 'ESC_C_INCHES':
                this.callbacks.onSetPageLengthInches?.(b);
                this.state = 'TEXT';
                break;
            case 'ESC_N':
                this.callbacks.onSetSkipOverPerforations?.(b);
                this.state = 'TEXT';
                break;
            case 'ESC_LOWER_J':
                const revFeedAmount = b * (80 / 180); // Reverse feed n/180 inch
                this.callbacks.onReverseFeedPaper?.(revFeedAmount);
                this.state = 'TEXT';
                break;
            case 'ESC_LOWER_E':
                const revLineAmount = b * 16; // Reverse feed n lines (16px line height)
                this.callbacks.onReverseFeedPaper?.(revLineAmount);
                this.state = 'TEXT';
                break;
            case 'ESC_BANG':
                this.applyMasterSelect(b);
                this.state = 'TEXT';
                break;
            case 'ESC_DASH':
                this.underline = (b === 1 || b === 49);
                this.state = 'TEXT';
                break;
            case 'ESC_PERCENT':
                this.userDefinedActive = (b === 1 || b === 49);
                this.state = 'TEXT';
                break;
            case 'ESC_COLON_0':
                this.state = (b === 0) ? 'ESC_COLON_1' : 'TEXT';
                break;
            case 'ESC_COLON_1':
                this.state = (b === 0) ? 'ESC_COLON_2' : 'TEXT';
                break;
            case 'ESC_COLON_2':
                if (b === 0) {
                    this.copyRomToRam();
                }
                this.state = 'TEXT';
                break;
            case 'ESC_AND_NUL':
                this.state = (b === 0) ? 'ESC_AND_C1' : 'TEXT';
                break;
            case 'ESC_AND_C1':
                this.udStartChar = b;
                this.state = 'ESC_AND_C2';
                break;
            case 'ESC_AND_C2':
                this.udEndChar = b;
                this.udCurrentChar = this.udStartChar;
                this.state = 'ESC_AND_CHAR_ATTR';
                break;
            case 'ESC_AND_CHAR_ATTR':
                this.udAttr = b;
                this.udDataBuffer = [];
                this.state = 'ESC_AND_CHAR_DATA';
                break;
            case 'ESC_AND_CHAR_DATA':
                this.udDataBuffer.push(b);
                if (this.udDataBuffer.length === 11) {
                    this.userDefinedChars.set(this.udCurrentChar, {
                        startCol: (this.udAttr >> 4) & 7,
                        endCol: this.udAttr & 15,
                        descender: (this.udAttr & 128) !== 0,
                        data: [...this.udDataBuffer]
                    });
                    this.udCurrentChar++;
                    if (this.udCurrentChar <= this.udEndChar) {
                        this.state = 'ESC_AND_CHAR_ATTR';
                    } else {
                        this.state = 'TEXT';
                    }
                }
                break;
            case 'ESC_GRAPHICS_N1':
                this.graphicsLength = b;
                this.state = 'ESC_GRAPHICS_N2';
                break;
            case 'ESC_GRAPHICS_N2':
                this.graphicsLength += b * 256;
                this.graphicsBytesRead = 0;
                this.graphicsBuffer = [];
                if (this.graphicsLength > 0) {
                    this.state = 'ESC_GRAPHICS_DATA';
                    this.callbacks.onStatusChange('Rx Graphics');
                } else {
                    this.state = 'TEXT';
                }
                break;
            case 'ESC_GRAPHICS_DATA':
                this.graphicsBuffer.push(b);
                this.graphicsBytesRead++;
                if (this.graphicsBytesRead >= this.graphicsLength) {
                    this.callbacks.onPrintGraphicsLine(this.graphicsType, this.graphicsBuffer);
                    this.state = 'TEXT';
                    this.callbacks.onStatusChange('Idle');
                }
                break;
            default:
                this.state = 'TEXT';
                break;
        }
    }

    handleTextByte(b) {
        if (b === 10) {
            if (this.lastWasCr && this.autoLineFeed) {
                this.lastWasCr = false;
                return;
            }
            this.callbacks.onStatusChange('Printing');
            this.flushLineBuffer();
            this.callbacks.onFeedPaper(this.lineSpacing / 16);
            this.callbacks.onStatusChange('Idle');
            this.lastWasCr = false;
        } else if (b === 13) {
            this.callbacks.onStatusChange('Printing');
            this.flushLineBuffer();
            if (this.autoLineFeed) {
                this.callbacks.onFeedPaper(this.lineSpacing / 16);
            }
            this.callbacks.onStatusChange('Idle');
            this.lastWasCr = true;
        } else if (b === 12) {
            this.flushLineBuffer();
            this.callbacks.onFormFeed();
            this.lastWasCr = false;
        } else if (b === 9) {
            this.handleTab();
            this.lastWasCr = false;
        } else if (b === 15) {
            this.condensed = true;
            this.lastWasCr = false;
        } else if (b === 18) {
            this.condensed = false;
            this.lastWasCr = false;
        } else if (b === 27) {
            this.state = 'ESC';
            this.lastWasCr = false;
        } else if (b === 24) {
            this.lineBuffer = [];
            this.lastWasCr = false;
        } else {
            if (b >= 32 && b <= 255) {
                this.pushChar(b);
            }
            this.lastWasCr = false;
        }
    }

    handleEscByte(b) {
        this.state = 'TEXT';
        switch (b) {
            case 64:
                this.reset();
                break;
            case 50: // ESC 2 (Restore line spacing to 1/6 inch = 16px at 96 DPI)
                this.lineSpacing = 16;
                break;
            case 51: // ESC 3 (Set line spacing to n/216 inch)
                this.state = 'ESC_THREE';
                break;
            case 67: // ESC C (Set page length in lines or inches)
                this.state = 'ESC_C';
                break;
            case 78: // ESC N (Set skip-over perforation)
                this.state = 'ESC_N';
                break;
            case 79: // ESC O (Cancel skip-over perforation)
                this.callbacks.onCancelSkipOverPerforations?.();
                break;
            case 33:
                this.state = 'ESC_BANG';
                break;
            case 45:
                this.state = 'ESC_DASH';
                break;
            case 37:
                this.state = 'ESC_PERCENT';
                break;
            case 38:
                this.state = 'ESC_AND_NUL';
                break;
            case 58:
                this.state = 'ESC_COLON_0';
                break;
            case 69:
                this.bold = true;
                break;
            case 70:
                this.bold = false;
                break;
            case 52:
                this.italic = true;
                break;
            case 53:
                this.italic = false;
                break;
            case 71:
                this.doubleStrike = true;
                break;
            case 72:
                this.doubleStrike = false;
                break;
            case 77:
                this.pitch = 'elite';
                break;
            case 80:
                this.pitch = 'pica';
                break;
            case 75:
                this.graphicsType = 'K';
                this.state = 'ESC_GRAPHICS_N1';
                break;
            case 76:
                this.graphicsType = 'L';
                this.state = 'ESC_GRAPHICS_N1';
                break;
            case 89:
                this.graphicsType = 'Y';
                this.state = 'ESC_GRAPHICS_N1';
                break;
            case 90:
                this.graphicsType = 'Z';
                this.state = 'ESC_GRAPHICS_N1';
                break;
            default:
                this.handleTextByte(27);
                this.handleTextByte(b);
                break;
        }
    }

    applyMasterSelect(n) {
        this.pitch = (n & 1) ? 'elite' : 'pica';
        this.condensed = (n & 4) !== 0;
        this.bold = (n & 8) !== 0;
        this.doubleStrike = (n & 16) !== 0;
        this.italic = (n & 64) !== 0;
        this.underline = (n & 128) !== 0;
    }

    pushChar(code) {
        const maxCapacity = this.getMaxColumns();
        if (this.lineBuffer.length >= maxCapacity) {
            this.flushLineBuffer();
            this.callbacks.onFeedPaper(this.lineSpacing / 24);
        }
        this.lineBuffer.push({
            code,
            bold: this.bold,
            italic: this.italic,
            doubleStrike: this.doubleStrike,
            underline: this.underline,
            condensed: this.condensed,
            pitch: this.pitch,
            userDefined: this.userDefinedActive && this.userDefinedChars.has(code)
        });
    }

    getMaxColumns() {
        if (this.pitch === 'elite') {
            return this.condensed ? 160 : 96;
        } else {
            return this.condensed ? 137 : 80;
        }
    }

    handleTab() {
        const maxCols = this.getMaxColumns();
        const tabWidth = 8;
        const currentLen = this.lineBuffer.length;
        const nextTabCol = Math.floor((currentLen + tabWidth) / tabWidth) * tabWidth;

        if (nextTabCol < maxCols) {
            const padCount = nextTabCol - currentLen;
            for (let i = 0; i < padCount; i++) {
                this.pushChar(32);
            }
        } else {
            this.flushLineBuffer();
            this.callbacks.onFeedPaper(1);
        }
    }

    flushLineBuffer() {
        if (this.lineBuffer.length === 0) return;
        this.callbacks.onTextLineReady = this.callbacks.onPrintTextLine;
        this.callbacks.onPrintTextLine([...this.lineBuffer]);
        this.lineBuffer = [];
    }

    copyRomToRam() {
        this.romCharsCopied = true;
    }
}

// ==========================================================================
// MODULE 4: Printer Canvas Renderer (formerly printer-renderer.js)
// ==========================================================================

// Paper aging visual effects helpers
const drawEdgeBrowning = (ctx, W, H, factor) => {
    if (factor <= 0) return;
    ctx.save();
    
    // Left edge browning
    const leftGrad = ctx.createLinearGradient(0, 0, 60, 0);
    leftGrad.addColorStop(0, `rgba(180, 140, 90, ${factor * 0.25})`);
    leftGrad.addColorStop(0.3, `rgba(180, 140, 90, ${factor * 0.15})`);
    leftGrad.addColorStop(1, 'rgba(180, 140, 90, 0)');
    ctx.fillStyle = leftGrad;
    ctx.fillRect(0, 0, 60, H);
    
    // Right edge browning
    const rightGrad = ctx.createLinearGradient(W - 60, 0, W, 0);
    rightGrad.addColorStop(0, 'rgba(180, 140, 90, 0)');
    rightGrad.addColorStop(0.7, `rgba(180, 140, 90, ${factor * 0.15})`);
    rightGrad.addColorStop(1, `rgba(180, 140, 90, ${factor * 0.25})`);
    ctx.fillStyle = rightGrad;
    ctx.fillRect(W - 60, 0, 60, H);
    
    ctx.restore();
};

const drawFoldBrowning = (ctx, W, pageY, H, factor) => {
    if (factor <= 0) return;
    ctx.save();
    
    // Top perforation edge
    const topGrad = ctx.createLinearGradient(0, pageY, 0, pageY + 30);
    topGrad.addColorStop(0, `rgba(180, 140, 90, ${factor * 0.2})`);
    topGrad.addColorStop(1, 'rgba(180, 140, 90, 0)');
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, pageY, W, 30);
    
    // Bottom perforation edge
    const bottomGrad = ctx.createLinearGradient(0, pageY + H - 30, 0, pageY + H);
    bottomGrad.addColorStop(0, 'rgba(180, 140, 90, 0)');
    bottomGrad.addColorStop(1, `rgba(180, 140, 90, ${factor * 0.2})`);
    ctx.fillStyle = bottomGrad;
    ctx.fillRect(0, pageY + H - 30, W, 30);
    
    ctx.restore();
};

const drawFoxing = (ctx, W, H, factor) => {
    if (factor <= 0) return;
    ctx.save();
    const spots = [
        { x: W * 0.15, y: H * 0.25, r: 8, o: 0.12 },
        { x: W * 0.72, y: H * 0.12, r: 5, o: 0.15 },
        { x: W * 0.45, y: H * 0.65, r: 12, o: 0.08 },
        { x: W * 0.88, y: H * 0.45, r: 6, o: 0.10 },
        { x: W * 0.28, y: H * 0.82, r: 9, o: 0.09 }
    ];
    spots.forEach(s => {
        const radGrad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r);
        const op = s.o * factor;
        radGrad.addColorStop(0, `rgba(139, 90, 43, ${op})`);
        radGrad.addColorStop(0.5, `rgba(139, 90, 43, ${op * 0.5})`);
        radGrad.addColorStop(1, 'rgba(139, 90, 43, 0)');
        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.restore();
};

const drawFibers = (ctx, W, H, factor) => {
    if (factor <= 0) return;
    ctx.save();
    ctx.strokeStyle = `rgba(80, 60, 40, ${0.25 * factor})`;
    ctx.fillStyle = `rgba(80, 60, 40, ${0.3 * factor})`;
    const fibers = [
        { x: W * 0.35, y: H * 0.18, type: 'line', dx: 3, dy: -2 },
        { x: W * 0.62, y: H * 0.78, type: 'dot' },
        { x: W * 0.20, y: H * 0.55, type: 'line', dx: -2, dy: 4 },
        { x: W * 0.78, y: H * 0.32, type: 'dot' },
        { x: W * 0.50, y: H * 0.90, type: 'line', dx: 4, dy: 1 },
        { x: W * 0.12, y: H * 0.08, type: 'dot' },
        { x: W * 0.90, y: H * 0.70, type: 'line', dx: -3, dy: -3 }
    ];
    fibers.forEach(f => {
        if (f.type === 'dot') {
            ctx.fillRect(f.x, f.y, 1.5, 1.5);
        } else {
            ctx.beginPath();
            ctx.lineWidth = 0.8;
            ctx.moveTo(f.x, f.y);
            ctx.lineTo(f.x + f.dx, f.y + f.dy);
            ctx.stroke();
        }
    });
    ctx.restore();
};

class PrinterRenderer {
    constructor(paperContentWrapper, paperRollContainer, soundSynth) {
        this.wrapper = paperContentWrapper;
        this.container = paperRollContainer;
        this.soundSynth = soundSynth;

        this.paperPreset = 'green-bar';
        this.ribbonWear = 0;
        this.jitter = 0;
        this.isLockedToBottom = true;
        this.scaleFactor = 2; // Default to 2x High-Res

        this.paperWidth = 912;
        this.printableWidth = 768; // 80 columns of pica (80 * 9.6px = 768px)
        this.leftMargin = 72;      // 0.75" left margin (sprockets + padding)
        this.lineHeight = 16;
        this.pageLength = 1056; // 11.0 inches at 96 DPI (66 lines, 22 sprocket holes)
        this.totalHeightPrinted = 0;
        this.skipOverPerforationLines = 0; // Bottom margin skip-over lines (default 0)
        this.textLinesBuffer = [];
        this.printQueue = [];
        this.isProcessingQueue = false;

        // Locating top and bottom paper spacers
        this.topSpacer = document.getElementById('paperTopSpacer');
        this.bottomSpacer = document.getElementById('paperBottomSpacer');

        // Physical print head elements and state tracking
        this.printHead = document.getElementById('printHead');
        this.printHeadLight = this.printHead ? this.printHead.querySelector('.print-head-needle-light') : null;
        this.printHeadDirection = 1; // 1 = Left-to-Right, -1 = Right-to-Left
        this.currentHeadX = 40;      // Start at left margin

        // Initialize paper stock and print lines
        this.clear();

        // Dynamic padding adjustment hooks
        window.addEventListener('resize', () => this.updatePaperPadding());
        window.addEventListener('load', () => this.updatePaperPadding());
        document.addEventListener('DOMContentLoaded', () => this.updatePaperPadding());
        
        // Multiple fallback timeouts to ensure layout is fully settled
        setTimeout(() => this.updatePaperPadding(), 50);
        setTimeout(() => this.updatePaperPadding(), 200);
        setTimeout(() => this.updatePaperPadding(), 500);
        setTimeout(() => this.updatePaperPadding(), 1000);
    }

    setPaperPreset(preset) {
        this.paperPreset = preset;
        this.updatePaperStyling();
    }

    setRibbonWear(wear) {
        this.ribbonWear = parseInt(wear, 10) || 0;
    }

    setRibbonColor(color) {
        this.ribbonColor = color || 'fresh-black';
        this.updatePaperStyling();
    }

    setJitter(jitterVal) {
        this.jitter = parseFloat(jitterVal) || 0;
    }

    setPaperAge(age) {
        this.paperAge = parseInt(age, 10) || 0;
        this.updatePaperStyling();
    }

    updatePaperStyling() {
        const paperElement = this.container.querySelector('#paperRoll');
        if (!paperElement) return;

        // Clear all preset and margin classes
        paperElement.classList.remove(
            'preset-standard', 'preset-blue-bar', 'preset-aged', 'preset-green-bar', 'preset-perforated',
            'preset-invoice', 'preset-carbonless-yellow', 'preset-carbonless-pink', 'preset-carbonless-goldenrod',
            'preset-carbonless-blue', 'margins-removed'
        );

        // Separate base preset and clean-cut modifier
        const isClean = this.paperPreset.endsWith('-clean');
        const basePreset = isClean ? this.paperPreset.replace('-clean', '') : this.paperPreset;

        // Apply corresponding class for preset styling
        if (basePreset === 'standard') paperElement.classList.add('preset-standard');
        else if (basePreset.startsWith('green-bar')) paperElement.classList.add('preset-green-bar');
        else if (basePreset.startsWith('blue-bar')) paperElement.classList.add('preset-blue-bar');
        else if (basePreset.startsWith('grey-bar')) paperElement.classList.add('preset-standard'); // Grey bar uses white continuous pattern below
        else if (basePreset === 'aged') paperElement.classList.add('preset-aged');
        else if (basePreset === 'perforated') paperElement.classList.add('preset-perforated');
        else if (basePreset === 'invoice') paperElement.classList.add('preset-invoice');
        else if (basePreset.startsWith('carbonless-yellow')) paperElement.classList.add('preset-carbonless-yellow');
        else if (basePreset.startsWith('carbonless-pink')) paperElement.classList.add('preset-carbonless-pink');
        else if (basePreset.startsWith('carbonless-goldenrod')) paperElement.classList.add('preset-carbonless-goldenrod');
        else if (basePreset.startsWith('carbonless-blue')) paperElement.classList.add('preset-carbonless-blue');
        else if (basePreset === 'music-sheet-1234-stock') paperElement.classList.add('preset-standard');

        // Configure CSS custom properties
        document.documentElement.style.setProperty('--paper-width', `${this.paperWidth}px`);
        document.documentElement.style.setProperty('--page-length', `${this.pageLength}px`);

        // Compute ink color based on ribbon selection
        let inkColor = '#181818'; // Fresh Black (Default)
        if (this.ribbonColor === 'true-black') inkColor = '#000000';
        else if (this.ribbonColor === 'fresh-violet') inkColor = '#440099';
        else if (this.ribbonColor === 'fresh-green') inkColor = '#006e32';
        else if (this.ribbonColor === 'fresh-red') inkColor = '#be141e';
        else if (this.ribbonColor === 'fresh-brown') inkColor = '#552d19';
        
        document.documentElement.style.setProperty('--efx-ink-color', inkColor);

        // Color interpolation helper functions
        const hexToRgb = (hex) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : { r: 251, g: 251, b: 247 };
        };
        const rgbToHex = (r, g, b) => "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);

        // Generate repeating background pattern on paperContentWrapper
        const patternCanvas = document.createElement('canvas');
        patternCanvas.width = this.paperWidth;
        patternCanvas.height = this.pageLength;
        const pCtx = patternCanvas.getContext('2d');

        // Draw base background color
        let paperBg = '#fbfbf7';
        if (basePreset === 'aged') paperBg = '#fef08a';
        else if (basePreset === 'carbonless-yellow') paperBg = '#fef9c3';
        else if (basePreset === 'carbonless-pink') paperBg = '#fce7f3';
        else if (basePreset === 'carbonless-goldenrod') paperBg = '#fed7aa';
        else if (basePreset === 'carbonless-blue') paperBg = '#dbeafe';
        else if (basePreset === 'music-sheet-1234-stock' || this.paperFormat === 'music-sheet-1234') paperBg = '#fafaf6';

        // Apply Paper Aging to background color
        const ageVal = this.paperAge || 0;
        const factor = ageVal / 100;
        if (factor > 0) {
            const baseRgb = hexToRgb(paperBg);
            const targetRgb = hexToRgb('#e2cd9c'); // Warm vintage aged sepia
            const r = Math.round(baseRgb.r + (targetRgb.r - baseRgb.r) * factor);
            const g = Math.round(baseRgb.g + (targetRgb.g - baseRgb.g) * factor);
            const b = Math.round(baseRgb.b + (targetRgb.b - baseRgb.b) * factor);
            paperBg = rgbToHex(r, g, b);
        }
        
        paperElement.style.backgroundColor = paperBg;
        pCtx.fillStyle = paperBg;
        pCtx.fillRect(0, 0, this.paperWidth, this.pageLength);

        // Draw visual styles (desaturated banding bars)
        const isBanded = basePreset.startsWith('green-bar') || basePreset.startsWith('blue-bar') || basePreset.startsWith('grey-bar');
        if (isBanded) {
            let barColor = '#e2efe0'; // Default green
            if (basePreset.startsWith('blue-bar')) barColor = '#e1ecf4';
            else if (basePreset.startsWith('grey-bar')) barColor = '#ecece8';
            
            if (factor > 0) {
                const barRgb = hexToRgb(barColor);
                const targetRgb = hexToRgb('#c4ae8a'); // Aged desaturated stripe color
                const r = Math.round(barRgb.r + (targetRgb.r - barRgb.r) * factor);
                const g = Math.round(barRgb.g + (targetRgb.g - barRgb.g) * factor);
                const b = Math.round(barRgb.b + (targetRgb.b - barRgb.b) * factor);
                barColor = rgbToHex(r, g, b);
            }
            
            pCtx.fillStyle = barColor;
            const stripeHeight = basePreset.endsWith('-2') ? this.lineHeight * 2 : this.lineHeight * 3; // 2-line vs 3-line bars
            for (let y = stripeHeight; y < this.pageLength; y += stripeHeight * 2) {
                pCtx.fillRect(0, y, this.paperWidth, stripeHeight);
            }
        } else if (basePreset === 'music-sheet-1234-stock') {
            let barColor = '#d8eae0'; // Desaturated mint green
            if (factor > 0) {
                const barRgb = hexToRgb(barColor);
                const targetRgb = hexToRgb('#cecbab'); // Aged music band
                const r = Math.round(barRgb.r + (targetRgb.r - barRgb.r) * factor);
                const g = Math.round(barRgb.g + (targetRgb.g - barRgb.g) * factor);
                const b = Math.round(barRgb.b + (targetRgb.b - barRgb.b) * factor);
                barColor = rgbToHex(r, g, b);
            }
            pCtx.fillStyle = barColor;
            const stripeHeight = this.lineHeight; // Alternating single-line bands (16px)
            for (let y = 48 + stripeHeight; y < this.pageLength; y += stripeHeight * 2) {
                pCtx.fillRect(0, y, this.paperWidth, stripeHeight);
            }
        } else if (basePreset === 'invoice') {
            this.drawInvoiceForm(pCtx, this.paperWidth, this.pageLength, '#505a64');
        }

        // Draw page specific borders / header layouts if format requires it
        if (this.paperFormat === 'correspondence-bordered' || this.paperFormat === 'mini-bordered') {
            this.drawBorderedForm(pCtx, this.paperWidth, this.pageLength, '#505a64');
        } else if (this.paperFormat === 'music-sheet') {
            this.drawComputerMusicForm(pCtx, this.paperWidth, this.pageLength, '#505a64');
        } else if (this.paperFormat === 'music-sheet-1234') {
            this.drawForm8240(pCtx, this.paperWidth, this.pageLength, '#24634E');
        }

        // Draw tractor metadata if margins are NOT removed
        if (!isClean) {
            this.drawTractorMetadata(pCtx, this.paperWidth, this.pageLength);
        }

        // Apply edge oxidation, folds, foxing, and fibers to patternCanvas
        drawEdgeBrowning(pCtx, this.paperWidth, this.pageLength, factor);
        drawFoldBrowning(pCtx, this.paperWidth, 0, this.pageLength, factor);
        drawFoxing(pCtx, this.paperWidth, this.pageLength, factor);
        drawFibers(pCtx, this.paperWidth, this.pageLength, factor);

        const inkOpacity = 1 - (factor * 0.35);
        document.documentElement.style.setProperty('--efx-ink-opacity', inkOpacity);

        // Draw page perforation lines
        pCtx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
        pCtx.lineWidth = 1;
        pCtx.setLineDash([3, 5]);
        pCtx.beginPath();
        pCtx.moveTo(0, this.pageLength - 1);
        pCtx.lineTo(this.paperWidth, this.pageLength - 1);
        pCtx.stroke();

        // Apply background image to wrapper
        const dataUrl = patternCanvas.toDataURL();
        this.wrapper.style.backgroundImage = `url(${dataUrl})`;
        this.wrapper.style.backgroundRepeat = 'repeat-y';
        this.wrapper.style.backgroundSize = `${this.paperWidth}px ${this.pageLength}px`;
    }

    drawBorderedForm(ctx, W, H, inkColor) {
        ctx.strokeStyle = inkColor;
        ctx.lineWidth = 1.5;
        // Draws border around printable page limits (just inside the 48px tractor margins)
        ctx.strokeRect(56, 10, W - 112, H - 20);
    }

    drawComputerMusicForm(ctx, W, H, inkColor) {
        ctx.strokeStyle = inkColor;
        ctx.fillStyle = inkColor;
        ctx.lineWidth = 1.5;

        // Page specific border
        ctx.strokeRect(56, 10, W - 112, H - 20);

        // Separate header section (horizontal line at y = 48)
        ctx.beginPath();
        ctx.moveTo(56, 48);
        ctx.lineTo(W - 56, 48);
        
        // Vertical line separating line numbers from body (at x = 88)
        ctx.moveTo(88, 48);
        ctx.lineTo(88, H - 10);
        ctx.stroke();

        // Print header metadata
        ctx.font = 'bold 9px Courier New, Courier, monospace';
        ctx.fillText('COMPUTER MUSIC SHEET', 108, 20);
        ctx.font = '8px Courier New, Courier, monospace';
        ctx.fillText('FORM #CM-80', W - 160, 20);
        ctx.fillText('LPI: 6 / 8', W - 160, 30);
        ctx.fillText('NFfP SYSTEMS', W - 160, 40);

        // Side column line counts (1, 2, 3...) spaced every 16px
        ctx.font = '8px Courier New, Courier, monospace';
        let lineNum = 1;
        for (let y = 48 + 12; y < H - 20; y += 16) {
            ctx.fillText(lineNum.toString().padStart(2, '0'), 64, y);
            lineNum++;
        }
    }

    drawForm8240(ctx, W, H, inkColor) {
        ctx.strokeStyle = inkColor;
        ctx.fillStyle = inkColor;
        ctx.lineWidth = 1.5;

        // Page specific border
        ctx.strokeRect(56, 10, W - 112, H - 20);

        // Separate header section (horizontal line at y = 48)
        ctx.beginPath();
        ctx.moveTo(56, 48);
        ctx.lineTo(W - 56, 48);
        
        // Vertical line separating line numbers from body (at x = 88)
        ctx.moveTo(88, 48);
        ctx.lineTo(88, H - 10);
        ctx.stroke();

        // Print header metadata
        ctx.font = 'bold 9px Courier New, Courier, monospace';
        ctx.fillText('REPORT ANALYSIS SHEET', 108, 20);
        ctx.font = '8px Courier New, Courier, monospace';
        ctx.fillText('FORM A 1234', W - 160, 20);
        ctx.fillText('1-LINE ALTERNATING', W - 160, 30);
        ctx.fillText('NFfP SYSTEMS', W - 160, 40);

        // Side column line counts (1, 2, 3...) spaced every 16px
        ctx.font = '8px Courier New, Courier, monospace';
        let lineNum = 1;
        for (let y = 48 + 12; y < H - 20; y += 16) {
            ctx.fillText(lineNum.toString().padStart(2, '0'), 64, y);
            lineNum++;
        }
    }

    drawDirectionalArrowEmblem(ctx, x, y, inkColor) {
        ctx.save();
        ctx.strokeStyle = inkColor;
        ctx.fillStyle = inkColor;
        ctx.lineWidth = 1.2;

        // Draw curved oval loop (Directional Arrow Emblem)
        ctx.beginPath();
        ctx.ellipse(x, y, 9, 24, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Draw upward pointing arrow inside the oval
        ctx.beginPath();
        ctx.moveTo(x, y - 14);
        ctx.lineTo(x - 4, y - 7);
        ctx.lineTo(x - 1.5, y - 7);
        ctx.lineTo(x - 1.5, y + 8);
        ctx.lineTo(x + 1.5, y + 8);
        ctx.lineTo(x + 1.5, y - 7);
        ctx.lineTo(x + 4, y - 7);
        ctx.closePath();
        ctx.fill();

        // Enclosed margin texts STOCK and CONTINUOUS
        ctx.font = 'bold 4.5px Courier New, Courier, monospace';
        ctx.save();
        ctx.translate(x - 3.5, y);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('STOCK', -7, 0);
        ctx.restore();

        ctx.save();
        ctx.translate(x + 3.5, y);
        ctx.rotate(Math.PI / 2);
        ctx.font = 'bold 3.5px Courier New, Courier, monospace';
        ctx.fillText('CONTINUOUS', -11, 0);
        ctx.restore();

        ctx.restore();
    }

    drawInvoiceForm(ctx, W, H, inkColor) {
        ctx.strokeStyle = inkColor;
        ctx.fillStyle = inkColor;
        ctx.lineWidth = 1;

        // Draw border boxes
        ctx.strokeRect(56, 10, W - 112, H - 30);
        
        const headerH = H > 800 ? 192 : 120;
        const bottomH = H > 800 ? H - 70 : H - 50;

        ctx.beginPath();
        // Header separator
        ctx.moveTo(56, headerH);
        ctx.lineTo(W - 56, headerH);
        // SOLD TO / SHIP TO separator
        ctx.moveTo(W / 2, 10);
        ctx.lineTo(W / 2, headerH);
        // Metadata boxes (top right)
        ctx.moveTo(W - 220, 10);
        ctx.lineTo(W - 220, 96);
        ctx.moveTo(W - 220, 96);
        ctx.lineTo(W - 56, 96);
        ctx.moveTo(W - 220, 53);
        ctx.lineTo(W - 56, 53);
        ctx.moveTo(W - 135, 53);
        ctx.lineTo(W - 135, 96);
        ctx.stroke();

        // Screened highlighting on TOTAL box (12% tint)
        ctx.fillStyle = 'rgba(80, 90, 100, 0.12)';
        ctx.fillRect(W - 176, bottomH, 120, H - bottomH - 20);

        // Grid horizontal & vertical lines
        ctx.strokeStyle = inkColor;
        ctx.beginPath();
        // Item grid columns
        ctx.moveTo(106, headerH); ctx.lineTo(106, bottomH);
        ctx.moveTo(216, headerH); ctx.lineTo(216, bottomH);
        ctx.moveTo(W - 276, headerH); ctx.lineTo(W - 276, bottomH);
        ctx.moveTo(W - 176, headerH); ctx.lineTo(W - 176, H - 20);
        // Bottom block grid
        ctx.moveTo(56, bottomH); ctx.lineTo(W - 56, bottomH);
        ctx.stroke();

        // Print Text Labels
        ctx.font = 'bold 9px Courier New, Courier, monospace';
        ctx.fillStyle = inkColor;
        ctx.fillText('SOLD TO:', 60, 25);
        ctx.fillText('SHIP TO:', W / 2 + 10, 25);
        
        ctx.font = 'bold 12px Courier New, Courier, monospace';
        ctx.fillText('INVOICE', W - 155, 30);
        
        ctx.font = '8px Courier New, Courier, monospace';
        ctx.fillText('INVOICE NO.', W - 215, 65);
        ctx.fillText('DATE', W - 130, 65);
        ctx.fillText('FORM #8096', W - 215, 110);
        ctx.fillText('EFX-80 SYSTEM', W - 215, headerH - 15);

        ctx.fillText('QTY', 65, headerH + 15);
        ctx.fillText('ITEM CODE', 120, headerH + 15);
        ctx.fillText('DESCRIPTION', 230, headerH + 15);
        ctx.fillText('UNIT PRICE', W - 250, headerH + 15);
        ctx.fillText('TOTAL', W - 145, headerH + 15);
        
        ctx.font = 'bold 10px Courier New, Courier, monospace';
        ctx.fillText('TOTAL DUE:', W - 260, bottomH + 20);
    }

    drawTractorMetadata(ctx, W, H) {
        // Vertical micro-perforation lines
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(48, 0);
        ctx.lineTo(48, H);
        ctx.moveTo(W - 48, 0);
        ctx.lineTo(W - 48, H);
        ctx.stroke();
        ctx.setLineDash([]); // Reset line dash

        // Circular sprocket holes repeating every 48px vertical (centered exactly between page perforations)
        ctx.fillStyle = '#0f172a';
        for (let y = 24; y < H; y += 48) {
            ctx.beginPath();
            ctx.arc(24, y, 7.5, 0, Math.PI * 2);
            ctx.arc(W - 24, y, 7.5, 0, Math.PI * 2);
            ctx.fill();
        }

        let metaInk = 'rgba(15, 23, 42, 0.18)';
        if (this.paperFormat === 'music-sheet-1234') {
            metaInk = 'rgba(36, 99, 78, 0.22)';
        }
        ctx.fillStyle = metaInk;
        ctx.strokeStyle = metaInk;
        ctx.font = '8px Courier New, Courier, monospace';

        // Vertical branding inside left tractor strip
        if (this.paperFormat === 'music-sheet-1234') {
            this.drawDirectionalArrowEmblem(ctx, 12, 120, metaInk);
            
            ctx.save();
            ctx.translate(12, H / 2 + 100);
            ctx.rotate(-Math.PI / 2);
            ctx.fillText('NFfP BUSINESS FORMS', -60, 0);
            ctx.restore();

            ctx.save();
            ctx.translate(12, H / 2 - 100);
            ctx.rotate(-Math.PI / 2);
            ctx.fillText('FORM A 1234', -35, 0);
            ctx.restore();
        } else {
            ctx.save();
            ctx.translate(12, H / 2); // Centered in left sprocket margin (24px)
            ctx.rotate(-Math.PI / 2);
            ctx.fillText('NFfP BUSINESS FORMS  *  STOCK-1980  *  MADE IN UK', -120, 0);
            ctx.restore();
        }

        // TOF (Top of Form) Arrow near the top perforation line
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // 1. Draw the larger upward alignment arrows outboard (centered between paper edge and sprockets)
        ctx.font = '14px Arial, sans-serif';
        ctx.fillText('↑', 12, 48);
        ctx.fillText('↑', W - 12, 48);
        
        // 2. Draw the TOF labels centered between sprockets and perforation, vertically between holes (y=24 and y=72)
        ctx.font = 'bold 9px Arial, sans-serif';
        ctx.fillText('TOF', 36, 48);
        ctx.fillText('TOF', W - 36, 48);
        
        ctx.textAlign = 'left'; // Reset alignment
        ctx.textBaseline = 'alphabetic'; // Reset baseline

        // Directional Indicators "FEED THIS WAY" in tractor margins
        ctx.save();
        ctx.translate(W - 12, H / 2);
        ctx.rotate(Math.PI / 2);
        ctx.font = '8px Courier New, Courier, monospace';
        ctx.fillText('FEED THIS WAY >>>', -50, 0);
        ctx.restore();

        // Alignment crosshairs in the printable corners
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.18)';
        ctx.lineWidth = 0.5;
        this.drawCrosshair(ctx, 40, 8);
        this.drawCrosshair(ctx, W - 40, 8);
        this.drawCrosshair(ctx, 40, H - 8);
        this.drawCrosshair(ctx, W - 40, H - 8);
    }

    drawCrosshair(ctx, x, y) {
        ctx.beginPath();
        ctx.moveTo(x - 5, y); ctx.lineTo(x + 5, y);
        ctx.moveTo(x, y - 5); ctx.lineTo(x, y + 5);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.stroke();
    }

    updatePaperPadding() {
        const clientHeight = this.container.clientHeight;
        const printHeadOffset = 48; // Active print line is placed 48px from the bottom of viewport
        const tearBarOffset = 144;  // Tear bar is placed 144px from the bottom of viewport (divisible by 24px)
        const paddingTop = Math.max(0, clientHeight - tearBarOffset);

        if (this.topSpacer) {
            this.topSpacer.style.height = `${paddingTop}px`;
        }
        if (this.bottomSpacer) {
            this.bottomSpacer.style.height = `${printHeadOffset}px`;
        }
        if (this.printHead) {
            this.printHead.style.bottom = `${printHeadOffset - 6}px`;
            this.printHead.style.top = 'auto';
        }

        const paperRollElement = this.container.querySelector('#paperRoll');
        if (paperRollElement) {
            paperRollElement.style.setProperty('--paper-offset-y', `${paddingTop}px`);
        }
    }

    clear() {
        const textureOverlay = this.wrapper.querySelector('#paperTextureOverlay');
        this.wrapper.innerHTML = '';
        if (textureOverlay) {
            this.wrapper.appendChild(textureOverlay);
        }
        this.totalHeightPrinted = 96; // Divisible by 24px sprocket spacing
        this.wrapper.style.height = `${this.totalHeightPrinted}px`;
        this.textLinesBuffer = [];
        this.printQueue = [];
        this.isProcessingQueue = false;
        this.updatePaperPadding();
        if (this.callbacks?.onTextBufferChange) {
            this.callbacks.onTextBufferChange();
        }
    }

    renderTextLine(charList) {
        this.printQueue.push({ type: 'text', charList: charList });
        this.processQueue();
    }

    executeTextLine(charList, callback) {
        if (charList.length === 0) {
            this.renderBlankLine(this.lineHeight);
            this.textLinesBuffer.push('');
            this.animatePrintHead(0, 280);
            setTimeout(callback, 280);
            return;
        }

        const lineText = charList.map(c => String.fromCharCode(c.code)).join('');
        this.textLinesBuffer.push(lineText);

        const scale = this.scaleFactor || 2;
        const canvas = document.createElement('canvas');
        canvas.width = this.paperWidth * scale;
        canvas.height = this.lineHeight * scale;
        canvas.className = 'print-line-canvas';
        
        const ctx = canvas.getContext('2d');
        ctx.scale(scale, scale);
        const baseColor = getComputedStyle(document.documentElement).getPropertyValue('--efx-ink-color').trim() || '#1e293b';
        ctx.fillStyle = baseColor;

        let charIndex = 0;
        let totalLinePrintWidth = 0;
        
        for (const item of charList) {
            let cellWidth = 9.6; // 10 CPI default (96 / 10 = 9.6px)
            let totalCols = 12;
            
            if (item.pitch === 'elite') {
                cellWidth = 8.0; // 12 CPI (96 / 12 = 8.0px)
                totalCols = 10;
            }

            if (item.condensed) {
                cellWidth = item.pitch === 'elite' ? 4.8 : 5.6; // 20 CPI (4.8px) vs 17.14 CPI (5.6px)
                totalCols = 9;
            }

            ctx.save();
            const startX = this.leftMargin + totalLinePrintWidth;
            
            if (item.italic) {
                ctx.translate(startX + cellWidth / 2, 0);
                ctx.transform(1, 0, -0.22, 1, 0, 0);
                ctx.translate(-(startX + cellWidth / 2), 0);
            }

            // Render selection clip boundaries (slanted if italic)
            ctx.beginPath();
            ctx.rect(startX, 0, cellWidth, this.lineHeight);
            ctx.clip();

            const baselineY = 4;
            const stepX = cellWidth / totalCols;
            const stepY = 1.6;

            let fontMatrix = [];
            if (item.userDefined) {
                const custom = this.customFontProvider?.(item.code);
                if (custom) {
                    fontMatrix = this.buildCustomMatrix(custom);
                } else {
                    fontMatrix = FontRom.getCharacter(item.code);
                }
            } else {
                fontMatrix = FontRom.getCharacter(item.code);
            }

            const numCols = fontMatrix.length;
            const activeJitter = (Math.random() - 0.5) * this.jitter;

            for (let c = 0; c < numCols; c++) {
                const colVal = fontMatrix[c];
                for (let pin = 0; pin < 9; pin++) {
                    if ((colVal & (1 << pin)) !== 0) {
                        const px = startX + (c * stepX) + activeJitter;
                        const py = baselineY + (pin * stepY);
                        
                        this.drawImpactDot(ctx, px, py, stepX * 1.1, stepY * 1.1);

                        if (item.bold) {
                            this.drawImpactDot(ctx, px + stepX * 0.45, py, stepX * 1.1, stepY * 1.1);
                        }

                        if (item.doubleStrike) {
                            this.drawImpactDot(ctx, px, py + stepY * 0.35, stepX * 1.1, stepY * 1.1);
                        }
                    }
                }
            }

            if (item.underline) {
                ctx.fillRect(startX, baselineY + 9 * stepY + 0.5, cellWidth, 1.2);
            }

            ctx.restore();
            charIndex++;
            totalLinePrintWidth += cellWidth;
        }

        // Calculate printed width and direction for clipping synchronization
        const width = totalLinePrintWidth > 0 ? Math.min(totalLinePrintWidth, this.printableWidth) : 60;
        const direction = this.printHeadDirection;
        const durationMs = 280;
        const leftM = this.leftMargin;
        const rightM = this.paperWidth - this.leftMargin;

        let initialClip = '';
        let targetClip = '';
        if (direction === 1) {
            // L-to-R: starts clipped to the left margin
            initialClip = `inset(0px ${this.paperWidth - leftM}px 0px ${leftM}px)`;
            targetClip = `inset(0px ${this.paperWidth - (leftM + width)}px 0px ${leftM}px)`;
        } else {
            // R-to-L: starts clipped to the printed width boundary
            initialClip = `inset(0px ${this.paperWidth - (leftM + width)}px 0px ${leftM + width}px)`;
            targetClip = `inset(0px ${this.paperWidth - (leftM + width)}px 0px ${leftM}px)`;
        }

        canvas.style.transition = 'none';
        canvas.style.clipPath = initialClip;

        this.appendCanvas(canvas);

        // Force reflow and trigger synchronized clipping reveal transition
        canvas.offsetHeight;
        canvas.style.transition = `clip-path ${durationMs}ms linear`;
        canvas.style.clipPath = targetClip;

        this.animatePrintHead(totalLinePrintWidth, durationMs);
        this.soundSynth?.playPrintSweep(durationMs, false);
        
        setTimeout(() => {
            canvas.style.clipPath = 'none';
            canvas.style.transition = 'none';
        }, durationMs + 50);

        setTimeout(callback, durationMs);
    }

    buildCustomMatrix(custom) {
        const output = Array(9).fill(0);
        const shift = custom.descender ? 1 : 0;

        for (let i = 0; i < 9; i++) {
            const dataByte = custom.data[i + custom.startCol] || 0;
            let col9Bit = 0;
            for (let bit = 0; bit < 8; bit++) {
                if ((dataByte & (128 >> bit)) !== 0) {
                    col9Bit |= (1 << (bit + shift));
                }
            }
            output[i] = col9Bit;
        }
        return output;
    }

    renderGraphicsLine(type, columns) {
        this.printQueue.push({ type: 'graphics', graphicsType: type, columns: columns });
        this.processQueue();
    }

    executeGraphicsLine(type, columns, callback) {
        const scale = this.scaleFactor || 2;
        const canvas = document.createElement('canvas');
        canvas.width = this.paperWidth * scale;
        canvas.height = 16 * scale;
        canvas.className = 'print-line-canvas';

        const ctx = canvas.getContext('2d');
        ctx.scale(scale, scale);
        const baseColor = getComputedStyle(document.documentElement).getPropertyValue('--efx-ink-color').trim() || '#1e293b';
        ctx.fillStyle = baseColor;

        let densityCols = 480;
        if (type === 'L' || type === 'Y') densityCols = 960;
        else if (type === 'Z') densityCols = 1920;

        const maxCols = Math.min(columns.length, densityCols);
        const stepX = this.printableWidth / densityCols;
        const stepY = 2.0;
        const startX = this.leftMargin;

        for (let c = 0; c < maxCols; c++) {
            const byteVal = columns[c];
            const activeJitter = (Math.random() - 0.5) * this.jitter;

            for (let pin = 0; pin < 8; pin++) {
                if ((byteVal & (128 >> pin)) !== 0) {
                    const px = startX + (c * stepX) + activeJitter;
                    const py = pin * stepY;

                    this.drawImpactDot(ctx, px, py, stepX * 1.2, stepY * 1.2);
                }
            }
        }

        const printWidth = maxCols * stepX;
        const width = printWidth > 0 ? Math.min(printWidth, this.printableWidth) : 680;
        const direction = this.printHeadDirection;
        const durationMs = 450;
        const leftM = this.leftMargin;
        const rightM = this.paperWidth - this.leftMargin;

        let initialClip = '';
        let targetClip = '';
        if (direction === 1) {
            initialClip = `inset(0px ${this.paperWidth - leftM}px 0px ${leftM}px)`;
            targetClip = `inset(0px ${this.paperWidth - (leftM + width)}px 0px ${leftM}px)`;
        } else {
            initialClip = `inset(0px ${this.paperWidth - (leftM + width)}px 0px ${leftM + width}px)`;
            targetClip = `inset(0px ${this.paperWidth - (leftM + width)}px 0px ${leftM}px)`;
        }

        canvas.style.transition = 'none';
        canvas.style.clipPath = initialClip;

        this.appendCanvas(canvas);

        // Force reflow and trigger reveal transition in sync with print head
        canvas.offsetHeight;
        canvas.style.transition = `clip-path ${durationMs}ms linear`;
        canvas.style.clipPath = targetClip;

        this.animatePrintHead(printWidth, durationMs);
        this.soundSynth?.playPrintSweep(durationMs, true);
        
        setTimeout(() => {
            canvas.style.clipPath = 'none';
            canvas.style.transition = 'none';
        }, durationMs + 50);

        setTimeout(callback, durationMs);
    }

    animatePrintHead(printWidth, durationMs) {
        if (!this.printHead) return;

        // Ensure printWidth is sane
        const width = printWidth > 0 ? Math.min(printWidth, this.printableWidth) : 60;
        const startX = this.leftMargin;
        const endX = this.leftMargin + width;

        const nozzleOffset = 30; // Centering offset for 60px wide print head carriage

        // Position the head at its starting position depending on direction
        this.printHead.style.transition = 'none';
        if (this.printHeadDirection === 1) {
            // Sweep Left-to-Right: nozzle starts at left margin
            this.printHead.style.left = `${startX - nozzleOffset}px`;
        } else {
            // Sweep Right-to-Left: nozzle starts at printed width end boundary
            this.printHead.style.left = `${endX - nozzleOffset}px`;
        }

        // Trigger layout reflow to make the browser apply style changes before starting transition
        this.printHead.offsetHeight;

        // Set transition timing and animate to the opposite end
        this.printHead.style.transition = `left ${durationMs}ms linear`;
        if (this.printHeadDirection === 1) {
            this.printHead.style.left = `${endX - nozzleOffset}px`;
            this.printHeadDirection = -1; // Toggle for next line bi-directional printing
        } else {
            this.printHead.style.left = `${startX - nozzleOffset}px`;
            this.printHeadDirection = 1;
        }

        // Trigger active pin LED flickering
        if (this.printHeadLight) {
            this.printHeadLight.classList.add('active');
            if (this.lightTimeout) clearTimeout(this.lightTimeout);
            this.lightTimeout = setTimeout(() => {
                this.printHeadLight.classList.remove('active');
            }, durationMs);
        }
    }

    drawImpactDot(ctx, x, y, w, h) {
        let opacity = 1.0;
        if (this.ribbonWear > 0) {
            const factor = this.ribbonWear / 100;
            const colNoise = Math.sin(x * 0.1) * 0.15 * factor;
            const randomNoise = (Math.random() - 0.5) * 0.45 * factor;
            opacity = Math.max(0.08, 1 - (factor * 0.65) + colNoise + randomNoise);
        }

        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.beginPath();
        const r = (w + h) / 4;
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    renderBlankLine(height, scrollDuration = 0) {
        const scale = this.scaleFactor || 2;
        const canvas = document.createElement('canvas');
        canvas.width = this.paperWidth * scale;
        canvas.height = height * scale;
        canvas.className = 'print-line-canvas blank-line';
        this.appendCanvas(canvas, scrollDuration);
    }

    appendCanvas(canvas, scrollDuration = 0) {
        const scale = this.scaleFactor || 2;
        
        // Automatic skip-over perforation logic
        if (this.skipOverPerforationLines > 0 && !canvas.classList.contains('perforation-skip')) {
            const currentOffset = (this.totalHeightPrinted - 96) % this.pageLength;
            const printableHeight = this.pageLength - this.skipOverPerforationLines * this.lineHeight;
            if (currentOffset >= printableHeight) {
                const skipHeight = this.pageLength - currentOffset;
                if (skipHeight > 0) {
                    const skipScale = this.scaleFactor || 2;
                    const skipCanvas = document.createElement('canvas');
                    skipCanvas.width = this.paperWidth * skipScale;
                    skipCanvas.height = skipHeight * skipScale;
                    skipCanvas.className = 'print-line-canvas blank-line perforation-skip';
                    this.appendCanvas(skipCanvas, 0);
                }
            }
        }

        const canvasHeightUserSpace = canvas.height / scale;
        
        // Check if the scroll position is currently locked to the bottom
        const isNearBottom = (this.container.scrollHeight - this.container.scrollTop - this.container.clientHeight) < 15;
        
        // Calculate print Y position relative to paper top based on current scroll position
        const printY = Math.min(this.totalHeightPrinted, this.container.scrollTop + 96);
        this.lastPrintY = printY;
        
        canvas.style.position = 'absolute';
        canvas.style.left = '0';
        canvas.style.top = `${printY}px`;
        
        this.wrapper.appendChild(canvas);
        
        // If we printed beyond the current paper length, expand the paper height
        if (printY + canvasHeightUserSpace > this.totalHeightPrinted) {
            this.totalHeightPrinted = printY + canvasHeightUserSpace;
            this.wrapper.style.height = `${this.totalHeightPrinted}px`;
        }
        
        this.updatePaperPadding();
        
        const autoScroll = document.getElementById('checkAutoScroll')?.checked ?? true;
        if (autoScroll && isNearBottom) {
            this.scrollToBottom(scrollDuration);
        } else {
            // Only roll the paper forward if this is a physical paper feed (blank line)
            if (canvas.classList.contains('blank-line')) {
                this.container.scrollTop += canvasHeightUserSpace;
            }
        }
    }

    scrollToBottom(duration = 0) {
        const autoScroll = document.getElementById('checkAutoScroll')?.checked ?? true;
        if (!this.isLockedToBottom || !autoScroll) return;
        const target = this.container.scrollHeight - this.container.clientHeight;

        if (duration <= 0) {
            if (this.scrollInterval) cancelAnimationFrame(this.scrollInterval);
            this.container.scrollTop = target;
            return;
        }

        if (this.scrollInterval) {
            cancelAnimationFrame(this.scrollInterval);
        }

        const start = this.container.scrollTop;
        const change = target - start;

        if (Math.abs(change) < 2) {
            this.container.scrollTop = target;
            return;
        }

        const startTime = performance.now();

        const animate = (time) => {
            const elapsed = time - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Linear progress mimics the constant speed of a stepper motor feeding paper
            this.container.scrollTop = start + change * progress;

            if (progress < 1) {
                this.scrollInterval = requestAnimationFrame(animate);
            } else {
                this.scrollInterval = null;
            }
        };

        this.scrollInterval = requestAnimationFrame(animate);
    }

    feedPaper(lines = 3) {
        this.printQueue.push({ type: 'feed', lines: lines });
        this.processQueue();
    }

    executeFeedPaper(lines = 3, callback) {
        const duration = lines * 120; // 120ms per line feed step
        this.renderBlankLine(this.lineHeight * lines, duration);
        this.soundSynth?.playFeed(duration);
        setTimeout(callback, duration);
    }

    formFeed() {
        this.printQueue.push({ type: 'formfeed' });
        this.processQueue();
    }

    executeFormFeed(callback) {
        const currentOffset = this.totalHeightPrinted % this.pageLength;
        const remainingToFeed = this.pageLength - currentOffset;
        const linesToFeed = Math.ceil(remainingToFeed / this.lineHeight);
        
        // Fast stepper feed duration capped at 1.8 seconds max
        const duration = Math.min(1800, linesToFeed * 60);
        this.renderBlankLine(remainingToFeed, duration);
        this.soundSynth?.playFeed(duration);
        setTimeout(callback, duration);
    }

    processQueue() {
        if (this.isProcessingQueue) return;
        if (this.printQueue.length === 0) return;
        
        this.isProcessingQueue = true;
        const task = this.printQueue.shift();
        
        const onComplete = () => {
            this.isProcessingQueue = false;
            this.processQueue();
        };
        
        if (task.type === 'text') {
            this.executeTextLine(task.charList, onComplete);
        } else if (task.type === 'graphics') {
            this.executeGraphicsLine(task.graphicsType, task.columns, onComplete);
        } else if (task.type === 'feed') {
            this.executeFeedPaper(task.lines, onComplete);
        } else if (task.type === 'formfeed') {
            this.executeFormFeed(onComplete);
        }
    }

    alignToTearBar() {
        const currentTearBarY = this.totalHeightPrinted - 96;
        let targetPerforation = Math.ceil(currentTearBarY / this.pageLength) * this.pageLength;
        
        let feedHeight = targetPerforation - currentTearBarY;
        if (feedHeight <= 10) {
            feedHeight = this.pageLength; // If already aligned, feed a full page
        }
        
        const linesToFeed = Math.ceil(feedHeight / this.lineHeight);
        const duration = Math.min(1800, linesToFeed * 60);
        
        this.renderBlankLine(feedHeight, duration);
        this.soundSynth?.playFeed(duration);
        showToast('Aligned paper to tear bar', 'fa-arrows-up-down');
    }

    tearOff() {
        const elements = Array.from(this.wrapper.children);
        if (elements.length === 0) return;

        const viewportHeight = this.container.clientHeight;
        const tearBarOffset = 144; // Align with tear bar height
        const tearLineAbsY = this.container.scrollTop + (viewportHeight - tearBarOffset);

        const pageIndex = Math.round(tearLineAbsY / this.pageLength);
        const tearPerforationY = pageIndex * this.pageLength;

        if (tearPerforationY <= 0 || tearPerforationY > this.totalHeightPrinted) {
            this.executeTearAtHeight(this.totalHeightPrinted);
            return;
        }
        this.executeTearAtHeight(tearPerforationY);
    }

    executeTearAtHeight(splitHeight) {
        const elements = Array.from(this.wrapper.children);
        const tornElements = [];
        const keptElements = [];
        const scale = this.scaleFactor || 2;

        for (const el of elements) {
            if (el.id === 'paperTextureOverlay') continue;
            
            const topY = parseFloat(el.style.top) || 0;
            
            // If the element's top boundary is above the splitHeight, tear it
            if (topY < splitHeight) {
                tornElements.push(el);
            } else {
                keptElements.push(el);
            }
        }

        if (tornElements.length === 0) return;

        this.soundSynth?.playTear();

        const tornPage = document.createElement('div');
        tornPage.className = 'torn-page-flight';
        tornPage.style.width = `${this.paperWidth}px`;
        tornPage.style.background = getComputedStyle(document.documentElement).getPropertyValue('--paper-bg') || '#fff';
        tornPage.style.boxShadow = '0 10px 25px rgba(0,0,0,0.3)';

        const rect = this.wrapper.getBoundingClientRect();
        tornPage.style.left = `${rect.left + window.scrollX}px`;
        tornPage.style.top = `${rect.top + window.scrollY}px`;

        tornElements.forEach(el => {
            el.remove();
            tornPage.appendChild(el);
        });

        document.body.appendChild(tornPage);

        requestAnimationFrame(() => {
            tornPage.classList.add('fly-away');
        });

        setTimeout(() => {
            tornPage.remove();
        }, 800);

        // Shift remaining kept elements up to the new top boundary (96px)
        keptElements.forEach(el => {
            const currentTop = parseFloat(el.style.top) || 0;
            el.style.top = `${currentTop - splitHeight + 96}px`;
        });

        this.totalHeightPrinted = (this.totalHeightPrinted - splitHeight) + 96;
        this.wrapper.style.height = `${this.totalHeightPrinted}px`;
        this.container.scrollTop = Math.max(0, this.container.scrollTop - splitHeight);
    }
}

// ==========================================================================
// MODULE 5: Application Controller (formerly app.js main thread)
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    const soundSynth = new SoundSynth();
    let isWPressed = false;
    

    
    const paperRoll = document.getElementById('paperRoll');
    const paperRollContainer = document.getElementById('paperRollContainer');
    const paperContentWrapper = document.getElementById('paperContentWrapper');
    const printStats = document.getElementById('printStats');
    
    const renderer = new PrinterRenderer(paperContentWrapper, paperRollContainer, soundSynth);
    
    const parserCallbacks = {
        onPrintTextLine: (chars) => renderer.renderTextLine(chars),
        onPrintGraphicsLine: (type, cols) => renderer.renderGraphicsLine(type, cols),
        onFeedPaper: (lines) => renderer.feedPaper(lines),
        onFormFeed: () => renderer.formFeed(),
        onStatusChange: (status) => updatePrintStats(status),
        onLedRxFlash: () => flashRxLed(),
        onStyleChange: () => updateActiveStyleUI(),
        onSetPageLengthLines: (lines) => {
            renderer.pageLength = lines * renderer.lineHeight;
            renderer.updatePaperStyling();
            showToast(`Page length set to ${lines} lines via escape code`, 'fa-arrows-up-down');
        },
        onSetPageLengthInches: (inches) => {
            renderer.pageLength = inches * 96;
            renderer.updatePaperStyling();
            showToast(`Page length set to ${inches} inches via escape code`, 'fa-arrows-up-down');
        },
        onSetSkipOverPerforations: (lines) => {
            renderer.skipOverPerforationLines = lines;
            showToast(`Perforation skip set to ${lines} lines via escape code`, 'fa-arrows-up-down');
        },
        onCancelSkipOverPerforations: () => {
            renderer.skipOverPerforationLines = 0;
            showToast('Perforation skip cancelled via escape code', 'fa-arrows-up-down');
        }
    };
    const parser = new EscpParser(parserCallbacks);
    
    renderer.customFontProvider = (code) => parser.userDefinedChars.get(code);

    const btnSerialConnect = document.getElementById('btnSerialConnect');
    const serialAlert = document.getElementById('serialAlert');
    const ledStatus = document.getElementById('ledStatus');
    const ledRx = document.getElementById('ledRx');
    const ledBuffer = document.getElementById('ledBuffer');
    
    const btnPrintTest = document.getElementById('btnPrintTest');
    const btnFeedPaper = document.getElementById('btnFeedPaper');
    const btnTearOff = document.getElementById('btnTearOff');
    const btnTearMargins = document.getElementById('btnTearMargins');
    const btnAlignTear = document.getElementById('btnAlignTear');
    const btnClearRoll = document.getElementById('btnClearRoll');
    const btnDownloadPrint = document.getElementById('btnDownloadPrint');
    const btnDownloadText = document.getElementById('btnDownloadText');
    const btnCopyPrint = document.getElementById('btnCopyPrint');
    const btnCopyText = document.getElementById('btnCopyText');

    const selectPaperPreset = document.getElementById('selectPaperPreset');
    const selectRibbonColor = document.getElementById('selectRibbonColor');
    const selectPaperFormat = document.getElementById('selectPaperFormat');
    const selectExportRes = document.getElementById('selectExportRes');
    const checkAutoScroll = document.getElementById('checkAutoScroll');
    const checkSoundEnabled = document.getElementById('checkSoundEnabled');
    const checkPaperCreases = document.getElementById('checkPaperCreases');
    const checkPaperTexture = document.getElementById('checkPaperTexture');
    const sliderRibbonWear = document.getElementById('sliderRibbonWear');
    const labelRibbonWear = document.getElementById('labelRibbonWear');
    const sliderPaperAge = document.getElementById('sliderPaperAge');
    const labelPaperAge = document.getElementById('labelPaperAge');
    const sliderJitter = document.getElementById('sliderJitter');
    const labelJitter = document.getElementById('labelJitter');

    const selectPitch = document.getElementById('selectPitch');
    const selectCondensed = document.getElementById('selectCondensed');
    const selectBold = document.getElementById('selectBold');
    const selectItalic = document.getElementById('selectItalic');
    const selectUnderline = document.getElementById('selectUnderline');
    const selectDoubleStrike = document.getElementById('selectDoubleStrike');
    const btnResetSettings = document.getElementById('btnResetSettings');
    
    const selectBaudRate = document.getElementById('selectBaudRate');
    const selectParity = document.getElementById('selectParity');
    const selectDataBits = document.getElementById('selectDataBits');
    const selectStopBits = document.getElementById('selectStopBits');
    const selectFlowControl = document.getElementById('selectFlowControl');

    const rawInputText = document.getElementById('rawInputText');
    const btnSendRawText = document.getElementById('btnSendRawText');
    const fileInputRaw = document.getElementById('fileInputRaw');
    const toastContainer = document.getElementById('toastContainer');
    const chkFocusMode = document.getElementById('chkFocusMode');

    const guideTrigger = document.getElementById('guide-trigger');
    const guidePanel = document.getElementById('guide-panel');
    const btnCloseGuide = document.getElementById('btn-close-guide');

    const controlsTrigger = document.getElementById('controls-trigger');
    const controlsPanel = document.getElementById('controls-panel');
    const btnCloseControls = document.getElementById('btn-close-controls');

    const helpTrigger = document.getElementById('help-trigger');
    const helpPanel = document.getElementById('help-panel');
    const btnCloseHelp = document.getElementById('btn-close-help');

    const printModesTrigger = document.getElementById('print-modes-trigger');
    const printModesPanel = document.getElementById('print-modes-panel');
    const btnClosePrintModes = document.getElementById('btn-close-print-modes');

    const operationsTrigger = document.getElementById('operations-trigger');
    const operationsPanel = document.getElementById('operations-panel');
    const btnCloseOperations = document.getElementById('btn-close-operations');

    const dipSwitches = [
        document.getElementById('dipSw1'),
        document.getElementById('dipSw2'),
        document.getElementById('dipSw3'),
        document.getElementById('dipSw4'),
        document.getElementById('dipSw5'),
        document.getElementById('dipSw6'),
        document.getElementById('dipSw7'),
        document.getElementById('dipSw8')
    ];

    let port = null;
    let reader = null;
    let keepReading = false;
    let isSerialConnected = false;

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

    function updatePrintStats(status) {
        if (printStats) {
            printStats.textContent = status;
            if (status === 'Offline') {
                printStats.className = 'badge offline';
            } else {
                printStats.className = 'badge online';
            }
        }
    }

    function flashRxLed() {
        if (ledRx) {
            ledRx.classList.add('active');
            if (ledRx.timeout) clearTimeout(ledRx.timeout);
            ledRx.timeout = setTimeout(() => ledRx.classList.remove('active'), 100);
        }
    }

    function updateBufferLed() {
        if (ledBuffer) {
            if (parser.lineBuffer.length > 0) {
                ledBuffer.classList.add('active');
            } else {
                ledBuffer.classList.remove('active');
            }
        }
    }

    if (!('serial' in navigator)) {
        btnSerialConnect.disabled = true;
        serialAlert.style.display = 'flex';
    } else {
        btnSerialConnect.addEventListener('click', async () => {
            if (isSerialConnected) {
                await disconnectSerial();
            } else {
                await connectSerial();
            }
        });
    }

    async function connectSerial() {
        try {
            const baudRate = parseInt(selectBaudRate.value, 10) || 9600;
            const flowControl = selectFlowControl.value === 'hardware' ? 'hardware' : 'none';
            const parity = selectParity.value;
            const dataBits = parseInt(selectDataBits.value, 10) || 8;
            const stopBits = parseInt(selectStopBits.value, 10) || 1;

            port = await navigator.serial.requestPort();
            await port.open({
                baudRate,
                flowControl,
                parity,
                dataBits,
                stopBits
            });

            isSerialConnected = true;
            updateConnectionStatus(true);
            readLoop();
        } catch (err) {
            console.error('Serial connection error:', err);
            showToast('Connection failed!', 'fa-circle-xmark');
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
                    if (done) break;
                    if (value) {
                        parser.parse(value);
                        updateBufferLed();
                    }
                }
            } catch (err) {
                console.error('Serial read error:', err);
                break;
            } finally {
                reader.releaseLock();
            }
        }
        if (keepReading) {
            await disconnectSerial();
        }
    }

    async function disconnectSerial() {
        keepReading = false;
        if (reader) {
            try { await reader.cancel(); } catch(e) {}
            reader = null;
        }
        if (port) {
            try { await port.close(); } catch(e) {}
            port = null;
        }
        isSerialConnected = false;
        updateConnectionStatus(false);
    }

    function updateConnectionStatus(isConnected) {
        const dot = document.getElementById('controls-status-dot');
        if (isConnected) {
            btnSerialConnect.innerHTML = '<i class="fa-solid fa-unlink"></i> Disconnect';
            ledStatus.className = 'led led-status connected';
            updatePrintStats('Idle');
            if (dot) dot.classList.add('online');
            showToast('Serial Port Connected!', 'fa-plug-circle-check');
        } else {
            btnSerialConnect.innerHTML = '<i class="fa-solid fa-plug"></i> Connect Serial';
            ledStatus.className = 'led led-status disconnected';
            updatePrintStats('Offline');
            if (dot) dot.classList.remove('online');
            showToast('Serial Port Disconnected', 'fa-plug-circle-xmark');
        }
    }

    // Bind change listeners to save Serial Port Settings
    if (selectFlowControl) {
        selectFlowControl.addEventListener('change', (e) => {
            localStorage.setItem('efx_flowControl', e.target.value);
        });
    }
    if (selectBaudRate) {
        selectBaudRate.addEventListener('change', (e) => {
            localStorage.setItem('efx_baudRate', e.target.value);
        });
    }
    if (selectDataBits) {
        selectDataBits.addEventListener('change', (e) => {
            localStorage.setItem('efx_dataBits', e.target.value);
        });
    }
    if (selectParity) {
        selectParity.addEventListener('change', (e) => {
            localStorage.setItem('efx_parity', e.target.value);
        });
    }
    if (selectStopBits) {
        selectStopBits.addEventListener('change', (e) => {
            localStorage.setItem('efx_stopBits', e.target.value);
        });
    }

    selectPaperPreset.addEventListener('change', (e) => {
        renderer.setPaperPreset(e.target.value);
        localStorage.setItem('efx_paperPreset', e.target.value);
        showToast('Paper preset updated', 'fa-palette');
    });

    if (selectRibbonColor) {
        selectRibbonColor.addEventListener('change', (e) => {
            renderer.setRibbonColor(e.target.value);
            localStorage.setItem('efx_ribbonColor', e.target.value);
            showToast('Ribbon colour updated', 'fa-palette');
        });
    }

    if (selectPaperFormat) {
        selectPaperFormat.addEventListener('change', (e) => {
            const format = e.target.value;
            localStorage.setItem('efx_paperFormat', format);
            renderer.paperFormat = format;
            if (format === 'mini' || format === 'mini-bordered') {
                renderer.paperWidth = 816; // 8.5" paper
                renderer.pageLength = 672; // 7.0" page (42 lines, 14 holes)
                renderer.printableWidth = 768; // 8.0" print width
                renderer.leftMargin = 24;   // 0.25" margins
            } else if (format === 'dp-12') {
                renderer.paperWidth = 912; // 9.5" paper
                renderer.pageLength = 1152; // 12.0" page (72 lines, 24 holes)
                renderer.printableWidth = 768;
                renderer.leftMargin = 72;
            } else if (format === 'legal-14') {
                renderer.paperWidth = 816; // 8.5" paper
                renderer.pageLength = 1344; // 14.0" page (84 lines, 28 holes)
                renderer.printableWidth = 768;
                renderer.leftMargin = 24;
            } else {
                renderer.paperWidth = 912; // 9.5" paper
                renderer.pageLength = 1056; // 11.0" page (66 lines, 22 holes)
                renderer.printableWidth = 768;
                renderer.leftMargin = 72;
            }
            renderer.clear();
            parser.reset();
            updateBufferLed();
            renderer.updatePaperStyling();
            showToast('Paper format updated. Printer roll cleared.', 'fa-sliders');
        });
    }

    if (selectExportRes) {
        selectExportRes.addEventListener('change', (e) => {
            const val = parseInt(e.target.value, 10) || 2;
            renderer.scaleFactor = val;
            localStorage.setItem('efx_exportRes', val);
            showToast(`Export resolution changed to ${val}x`, 'fa-palette');
        });
    }

    if (checkAutoScroll) {
        checkAutoScroll.addEventListener('change', (e) => {
            const enabled = e.target.checked;
            localStorage.setItem('efx_autoScroll', enabled ? 'true' : 'false');
            showToast(enabled ? 'Auto scroll enabled' : 'Auto scroll disabled', 'fa-arrows-down-to-line');
        });
    }

    if (checkSoundEnabled) {
        checkSoundEnabled.addEventListener('change', (e) => {
            const enabled = e.target.checked;
            soundSynth.enabled = enabled;
            localStorage.setItem('efx_soundEnabled', enabled ? 'true' : 'false');
            showToast(enabled ? 'Sound effects enabled' : 'Sound effects muted', enabled ? 'fa-volume-high' : 'fa-volume-xmark');
        });
    }

    if (checkPaperCreases) {
        checkPaperCreases.addEventListener('change', (e) => {
            const enabled = e.target.checked;
            if (paperRoll) {
                if (enabled) paperRoll.classList.add('has-creases');
                else paperRoll.classList.remove('has-creases');
            }
            localStorage.setItem('efx_paperCreases', enabled ? 'true' : 'false');
            showToast(enabled ? 'Page folds enabled' : 'Page folds disabled', 'fa-note-sticky');
        });
    }

    if (checkPaperTexture) {
        checkPaperTexture.addEventListener('change', (e) => {
            const enabled = e.target.checked;
            if (paperRoll) {
                if (enabled) paperRoll.classList.add('has-texture');
                else paperRoll.classList.remove('has-texture');
            }
            localStorage.setItem('efx_paperTexture', enabled ? 'true' : 'false');
            showToast(enabled ? 'Paper texture grain enabled' : 'Paper texture grain disabled', 'fa-note-sticky');
        });
    }

    sliderRibbonWear.addEventListener('input', (e) => {
        const val = e.target.value;
        labelRibbonWear.textContent = `${val}%`;
        renderer.setRibbonWear(val);
        localStorage.setItem('efx_ribbonWear', val);
    });

    if (sliderPaperAge) {
        sliderPaperAge.addEventListener('input', (e) => {
            const val = e.target.value;
            if (labelPaperAge) labelPaperAge.textContent = `${val}%`;
            renderer.setPaperAge(val);
            localStorage.setItem('efx_paperAge', val);
        });
    }

    sliderJitter.addEventListener('input', (e) => {
        const val = e.target.value;
        labelJitter.textContent = `${parseFloat(val).toFixed(1)}px`;
        renderer.setJitter(val);
        localStorage.setItem('efx_jitter', val);
    });

    function applyDipSwitchSettings() {
        const sw1 = document.getElementById('dipSw1');
        const sw2 = document.getElementById('dipSw2');
        const sw3 = document.getElementById('dipSw3');
        const sw4 = document.getElementById('dipSw4');

        parser.autoLineFeed = sw1 ? sw1.checked : false;
        parser.pitch = (sw2 && sw2.checked) ? 'elite' : 'pica';
        renderer.pageLength = (sw3 && sw3.checked) ? 1152 : 1056;
        parser.italic = sw4 ? sw4.checked : false;

        const dipStates = dipSwitches.map(sw => sw ? sw.checked : false);
        localStorage.setItem('efx_dipSwitches', JSON.stringify(dipStates));
    }

    dipSwitches.forEach(sw => {
        if (sw) {
            sw.addEventListener('change', () => {
                applyDipSwitchSettings();
                showToast('DIP switches updated', 'fa-toggle-on');
            });
        }
    });

    // Update the Sidebar Settings Dropdowns for Active Print Modes
    function updateActiveStyleUI() {
        if (selectPitch) selectPitch.value = parser.pitch;
        if (selectCondensed) selectCondensed.value = parser.condensed ? 'enabled' : 'disabled';
        if (selectBold) selectBold.value = parser.bold ? 'enabled' : 'disabled';
        if (selectItalic) selectItalic.value = parser.italic ? 'enabled' : 'disabled';
        if (selectUnderline) selectUnderline.value = parser.underline ? 'enabled' : 'disabled';
        if (selectDoubleStrike) selectDoubleStrike.value = parser.doubleStrike ? 'enabled' : 'disabled';
    }

    // Listen for manual settings changes
    if (selectPitch) {
        selectPitch.addEventListener('change', (e) => {
            parser.pitch = e.target.value;
            updateActiveStyleUI();
            showToast(`Font pitch changed manually to ${e.target.value === 'pica' ? 'Pica (10 CPI)' : 'Elite (12 CPI)'}`, 'fa-print');
        });
    }
    if (selectCondensed) {
        selectCondensed.addEventListener('change', (e) => {
            parser.condensed = (e.target.value === 'enabled');
            updateActiveStyleUI();
            showToast(`Condensed mode changed manually to ${e.target.value}`, 'fa-print');
        });
    }
    if (selectBold) {
        selectBold.addEventListener('change', (e) => {
            parser.bold = (e.target.value === 'enabled');
            updateActiveStyleUI();
            showToast(`Bold mode changed manually to ${e.target.value}`, 'fa-print');
        });
    }
    if (selectItalic) {
        selectItalic.addEventListener('change', (e) => {
            parser.italic = (e.target.value === 'enabled');
            updateActiveStyleUI();
            showToast(`Italic mode changed manually to ${e.target.value}`, 'fa-print');
        });
    }
    if (selectUnderline) {
        selectUnderline.addEventListener('change', (e) => {
            parser.underline = (e.target.value === 'enabled');
            updateActiveStyleUI();
            showToast(`Underline mode changed manually to ${e.target.value}`, 'fa-print');
        });
    }
    if (selectDoubleStrike) {
        selectDoubleStrike.addEventListener('change', (e) => {
            parser.doubleStrike = (e.target.value === 'enabled');
            updateActiveStyleUI();
            showToast(`Double-strike mode changed manually to ${e.target.value}`, 'fa-print');
        });
    }
    if (btnResetSettings) {
        btnResetSettings.addEventListener('click', () => {
            parser.reset();
            updateActiveStyleUI();
            showToast('Printer settings reset to defaults', 'fa-arrow-rotate-left');
        });
    }

    btnSendRawText.addEventListener('click', () => {
        const text = rawInputText.value;
        if (!text) return;
        
        const encoder = new TextEncoder();
        let formatted = text
            .replace(/\\e/g, '\x1B')
            .replace(/\\n/g, '\n')
            .replace(/\\r/g, '\r')
            .replace(/\\t/g, '\t')
            .replace(/\\f/g, '\f')
            .replace(/\\x([0-9A-Fa-f]{2})/g, (match, p1) => String.fromCharCode(parseInt(p1, 16)));

        const bytes = new Uint8Array(formatted.length);
        for (let i = 0; i < formatted.length; i++) {
            bytes[i] = formatted.charCodeAt(i) & 0xFF;
        }
        parser.parse(bytes);
        updateBufferLed();
        showToast('Bytes sent to parser', 'fa-paper-plane');
    });

        fileInputRaw.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const bytes = new Uint8Array(event.target.result);
            parser.parse(bytes);
            updateBufferLed();
            showToast('Binary file printed!', 'fa-file-code');
        };
        reader.readAsArrayBuffer(file);
    });

    btnFeedPaper.addEventListener('click', () => {
        renderer.feedPaper(3);
        showToast('Fed paper 3 lines', 'fa-arrow-up');
    });

    if (btnAlignTear) {
        btnAlignTear.addEventListener('click', () => {
            renderer.alignToTearBar();
        });
    }

    btnTearOff.addEventListener('click', () => {
        renderer.tearOff();
    });

    if (btnTearMargins) {
        btnTearMargins.addEventListener('click', () => {
            const paperRoll = document.getElementById('paperRoll');
            if (paperRoll) {
                if (paperRoll.classList.contains('margins-removed')) {
                    showToast('Margins are already stripped!', 'fa-circle-info');
                } else {
                    soundSynth.playTear();
                    paperRoll.classList.add('margins-removed');
                    showToast('Tractor margins stripped!', 'fa-border-none');
                }
            }
        });
    }

    btnClearRoll.addEventListener('click', () => {
        renderer.clear();
        parser.reset();
        updateBufferLed();
        showToast('Paper roll cleared', 'fa-trash');
    });

    function generateExportCanvas() {
        const children = Array.from(paperContentWrapper.children);
        if (children.length === 0) return null;

        // Calculate total height based on absolute paper roll length
        const scale = renderer.scaleFactor || 2;
        const totalHeight = renderer.totalHeightPrinted * scale;

        if (totalHeight === 0) return null;
        
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = renderer.paperWidth * scale;
        exportCanvas.height = totalHeight;
        const ctx = exportCanvas.getContext('2d');

        ctx.save();
        ctx.scale(scale, scale);

        const logicalWidth = renderer.paperWidth;
        const logicalHeight = totalHeight / scale;

        // Separate base preset and clean-cut modifier
        const isClean = renderer.paperPreset.endsWith('-clean');
        const basePreset = isClean ? renderer.paperPreset.replace('-clean', '') : renderer.paperPreset;

        // Color interpolation helper functions
        const hexToRgb = (hex) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : { r: 251, g: 251, b: 247 };
        };
        const rgbToHex = (r, g, b) => "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);

        // Fill background color
        let paperBg = '#fbfbf7';
        if (basePreset === 'aged') paperBg = '#fef08a';
        else if (basePreset === 'carbonless-yellow') paperBg = '#fef9c3';
        else if (basePreset === 'carbonless-pink') paperBg = '#fce7f3';
        else if (basePreset === 'carbonless-goldenrod') paperBg = '#fed7aa';
        else if (basePreset === 'carbonless-blue') paperBg = '#dbeafe';
        else if (basePreset === 'music-sheet-1234-stock' || renderer.paperFormat === 'music-sheet-1234') paperBg = '#fafaf6';

        // Apply Paper Aging to background color
        const ageVal = renderer.paperAge || 0;
        const factor = ageVal / 100;
        if (factor > 0) {
            const baseRgb = hexToRgb(paperBg);
            const targetRgb = hexToRgb('#e2cd9c'); // Warm vintage aged sepia
            const r = Math.round(baseRgb.r + (targetRgb.r - baseRgb.r) * factor);
            const g = Math.round(baseRgb.g + (targetRgb.g - baseRgb.g) * factor);
            const b = Math.round(baseRgb.b + (targetRgb.b - baseRgb.b) * factor);
            paperBg = rgbToHex(r, g, b);
        }

        ctx.fillStyle = paperBg;
        ctx.fillRect(0, 0, logicalWidth, logicalHeight);

        // Draw page-by-page pre-printed overlays
        for (let pageY = 0; pageY < logicalHeight; pageY += renderer.pageLength) {
            const currentPageHeight = Math.min(renderer.pageLength, logicalHeight - pageY);

            ctx.save();
            ctx.beginPath();
            ctx.rect(0, pageY, logicalWidth, currentPageHeight);
            ctx.clip();

            ctx.translate(0, pageY);

            // Draw Green / Blue / Grey bars (desaturated banding)
            const isBanded = basePreset.startsWith('green-bar') || basePreset.startsWith('blue-bar') || basePreset.startsWith('grey-bar');
            if (isBanded) {
                let barColor = '#e2efe0';
                if (basePreset.startsWith('blue-bar')) barColor = '#e1ecf4';
                else if (basePreset.startsWith('grey-bar')) barColor = '#ecece8';
                
                if (factor > 0) {
                    const barRgb = hexToRgb(barColor);
                    const targetRgb = hexToRgb('#c4ae8a'); // Aged desaturated stripe color
                    const r = Math.round(barRgb.r + (targetRgb.r - barRgb.r) * factor);
                    const g = Math.round(barRgb.g + (targetRgb.g - barRgb.g) * factor);
                    const b = Math.round(barRgb.b + (targetRgb.b - barRgb.b) * factor);
                    barColor = rgbToHex(r, g, b);
                }
                
                ctx.fillStyle = barColor;
                const stripeHeight = basePreset.endsWith('-2') ? 48 : 72; // 2-line vs 3-line
                for (let y = stripeHeight; y < renderer.pageLength; y += stripeHeight * 2) {
                    ctx.fillRect(0, y, logicalWidth, stripeHeight);
                }
            } else if (basePreset === 'music-sheet-1234-stock') {
                let barColor = '#d8eae0'; // Desaturated mint green
                if (factor > 0) {
                    const barRgb = hexToRgb(barColor);
                    const targetRgb = hexToRgb('#cecbab'); // Aged music band
                    const r = Math.round(barRgb.r + (targetRgb.r - barRgb.r) * factor);
                    const g = Math.round(barRgb.g + (targetRgb.g - barRgb.g) * factor);
                    const b = Math.round(barRgb.b + (targetRgb.b - barRgb.b) * factor);
                    barColor = rgbToHex(r, g, b);
                }
                ctx.fillStyle = barColor;
                const stripeHeight = 24; // Alternating single-line bands (24px)
                for (let y = 72 + stripeHeight; y < renderer.pageLength; y += stripeHeight * 2) {
                    ctx.fillRect(0, y, logicalWidth, stripeHeight);
                }
            } else if (basePreset === 'invoice') {
                renderer.drawInvoiceForm(ctx, logicalWidth, renderer.pageLength, '#505a64');
            }

            // Draw page specific borders / header layouts if format requires it
            if (renderer.paperFormat === 'correspondence-bordered' || renderer.paperFormat === 'mini-bordered') {
                renderer.drawBorderedForm(ctx, logicalWidth, renderer.pageLength, '#505a64');
            } else if (renderer.paperFormat === 'music-sheet') {
                renderer.drawComputerMusicForm(ctx, logicalWidth, renderer.pageLength, '#505a64');
            } else if (renderer.paperFormat === 'music-sheet-1234') {
                renderer.drawForm8240(ctx, logicalWidth, renderer.pageLength, '#24634E');
            }

            // Draw tractor metadata
            if (!isClean) {
                renderer.drawTractorMetadata(ctx, logicalWidth, renderer.pageLength);
            }

            // Apply aging effects to this page background on the export canvas
            drawEdgeBrowning(ctx, logicalWidth, renderer.pageLength, factor);
            drawFoldBrowning(ctx, logicalWidth, 0, renderer.pageLength, factor);
            drawFoxing(ctx, logicalWidth, renderer.pageLength, factor);
            drawFibers(ctx, logicalWidth, renderer.pageLength, factor);

            // Draw page perforation lines
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 5]);
            ctx.beginPath();
            ctx.moveTo(0, renderer.pageLength - 1);
            ctx.lineTo(logicalWidth, renderer.pageLength - 1);
            ctx.stroke();

            ctx.restore();
        }

        // Render Creases and/or Texture overlay on export canvas
        if (checkPaperCreases && checkPaperCreases.checked) {
            for (let pageY = 0; pageY < logicalHeight; pageY += renderer.pageLength) {
                const gradient = ctx.createLinearGradient(0, pageY - 2, 0, pageY + 3);
                gradient.addColorStop(0, 'rgba(0, 0, 0, 0.04)');
                gradient.addColorStop(0.4, 'rgba(0, 0, 0, 0.15)');
                gradient.addColorStop(0.6, 'rgba(0, 0, 0, 0.22)');
                gradient.addColorStop(0.8, 'rgba(255, 255, 255, 0.12)');
                gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, pageY - 2, logicalWidth, 5);
            }
        }

        if (checkPaperTexture && checkPaperTexture.checked) {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = 4;
            tempCanvas.height = 4;
            const tCtx = tempCanvas.getContext('2d');
            tCtx.fillStyle = 'rgba(0, 0, 0, 0.015)';
            tCtx.fillRect(0, 0, 1, 1);
            tCtx.fillStyle = 'rgba(255, 255, 255, 0.02)';
            tCtx.fillRect(2, 2, 1, 1);
            const pattern = ctx.createPattern(tempCanvas, 'repeat');
            ctx.fillStyle = pattern;
            ctx.fillRect(0, 0, logicalWidth, logicalHeight);
        }

        ctx.restore();

        const inkOpacity = 1 - (factor * 0.35);
        ctx.save();
        ctx.globalAlpha = inkOpacity;
        children.forEach(child => {
            if (child.id === 'paperTextureOverlay') return;
            if (child.tagName === 'CANVAS') {
                if (child.width > 0 && child.height > 0) {
                    const topY = parseFloat(child.style.top) || 0;
                    ctx.drawImage(child, 0, topY * scale);
                }
            }
        });
        ctx.restore();

        if (isClean) {
            const croppedW = renderer.paperWidth - 80;
            const croppedCanvas = document.createElement('canvas');
            croppedCanvas.width = croppedW * scale;
            croppedCanvas.height = totalHeight;
            const croppedCtx = croppedCanvas.getContext('2d');
            croppedCtx.drawImage(exportCanvas, 40 * scale, 0, croppedW * scale, totalHeight, 0, 0, croppedW * scale, totalHeight);
            return croppedCanvas;
        }

        return exportCanvas;
    }

    btnDownloadPrint.addEventListener('click', () => {
        const exportCanvas = generateExportCanvas();
        if (!exportCanvas) {
            showToast('No print content to save!', 'fa-triangle-exclamation');
            return;
        }

        const link = document.createElement('a');
        link.download = `efx80_printout_${Date.now()}.png`;
        link.href = exportCanvas.toDataURL('image/png');
        link.click();
        showToast('Saved printout image!', 'fa-file-image');
    });

    btnDownloadText.addEventListener('click', () => {
        if (renderer.textLinesBuffer.length === 0) {
            showToast('No printed text to save!', 'fa-triangle-exclamation');
            return;
        }
        const text = renderer.textLinesBuffer.join('\n');
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        link.download = `efx80_text_${Date.now()}.txt`;
        link.href = URL.createObjectURL(blob);
        link.click();
        showToast('Saved text output!', 'fa-file-lines');
    });

    btnCopyPrint.addEventListener('click', () => {
        const exportCanvas = generateExportCanvas();
        if (!exportCanvas) {
            showToast('No print content to copy!', 'fa-triangle-exclamation');
            return;
        }

        exportCanvas.toBlob((blob) => {
            if (!blob) {
                showToast('Failed to create image blob', 'fa-triangle-exclamation');
                return;
            }
            try {
                const item = new ClipboardItem({ 'image/png': blob });
                navigator.clipboard.write([item])
                    .then(() => showToast('Copied printout image to clipboard!', 'fa-copy'))
                    .catch((e) => {
                        console.error(e);
                        showToast('Browser blocked clipboard write', 'fa-triangle-exclamation');
                    });
            } catch(err) {
                console.error(err);
                showToast('Clipboard write failed', 'fa-triangle-exclamation');
            }
        }, 'image/png');
    });

    btnCopyText.addEventListener('click', () => {
        if (renderer.textLinesBuffer.length === 0) {
            showToast('No printed text to copy!', 'fa-triangle-exclamation');
            return;
        }
        const text = renderer.textLinesBuffer.join('\n');
        navigator.clipboard.writeText(text)
            .then(() => showToast('Copied text to clipboard!', 'fa-copy'))
            .catch(() => showToast('Failed to copy text', 'fa-times'));
    });

    function runSelfTest() {
        showToast('Running EFX-80s Self-Test Page...', 'fa-vial');
        btnPrintTest.disabled = true;

        const seq = [];
        const s = (str) => new TextEncoder().encode(str);
        
        seq.push([27, 64]);
        seq.push(s('EFX-80s 9-PIN IMPACT PRINTER EMULATOR\r\n'));
        seq.push(s('=====================================\r\n'));
        seq.push([10]);

        seq.push(s('Standard Font Printable Characters (ASCII 32-126):\r\n'));
        seq.push(s(' !"#$%&\'()*+,-./0123456789:;<=>?@\r\n'));
        seq.push(s('ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`\r\n'));
        seq.push(s('abcdefghijklmnopqrstuvwxyz{|}~\r\n'));
        seq.push([10]);

        seq.push(s('Standard 10 CPI Pica Mode (Default)\r\n'));
        seq.push([27, 77]);
        seq.push(s('Elite 12 CPI Pitch Mode (ESC M)\r\n'));
        seq.push([27, 80]);

        seq.push([15]);
        seq.push(s('Condensed Mode SI (137 columns maximum)\r\n'));
        seq.push([18]);

        seq.push([27, 69]);
        seq.push(s('Emphasized / Bold Mode (ESC E)\r\n'));
        seq.push([27, 70]);

        seq.push([27, 52]);
        seq.push(s('Italic Character Printing (ESC 4)\r\n'));
        seq.push([27, 53]);

        seq.push([27, 71]);
        seq.push(s('Double-Strike Mode (ESC G)\r\n'));
        seq.push([27, 72]);

        seq.push([27, 45, 1]);
        seq.push(s('Underlined Character Text (ESC - 1)\r\n'));
        seq.push([27, 45, 0]);
        seq.push([10]);

        seq.push([27, 33, 128]);
        seq.push(s('Master Select: Underline\r\n'));
        seq.push([27, 33, 8]);
        seq.push(s('Master Select: Emphasized Bold\r\n'));
        seq.push([27, 33, 76]);
        seq.push(s('Master Select: Bold + Italic + Condensed\r\n'));
        seq.push([27, 33, 0]);

        seq.push([
            27, 38, 0, 65, 65,
            10,
            0x55, 0xAA, 0x55, 0xAA, 0x55, 0xAA, 0x55, 0xAA, 0x55, 0xAA, 0x55
        ]);
        seq.push(s('Defined custom checkerboard matrix for character [A]\r\n'));
        seq.push(s('Standard: AAAAAA\r\n'));
        seq.push([27, 37, 1]);
        seq.push(s('Redefined: AAAAAA\r\n'));
        seq.push([27, 37, 0]);
        seq.push(s('Deactivated: AAAAAA\r\n'));
        seq.push([10]);

        const graphHeader = [27, 75, 40, 0];
        const graphData = [];
        for (let col = 0; col < 40; col++) {
            graphData.push(col % 8 < 4 ? 0xF0 : 0x0F);
        }
        seq.push([...graphHeader, ...graphData]);
        seq.push(s('\r\nAbove: 8-Pin Single Density Bit Graphics (ESC K)\r\n'));
        
        seq.push(s('\r\n** EFX-80s EMULATION DIAGNOSTICS COMPLETED **\r\n'));
        seq.push([12]);

        let idx = 0;
        function runStep() {
            if (idx >= seq.length) {
                btnPrintTest.disabled = false;
                showToast('Self-Test print completed!', 'fa-circle-check');
                return;
            }
            const stepBytes = seq[idx];
            parser.parse(new Uint8Array(stepBytes));
            updateBufferLed();
            idx++;
            const isGraphics = stepBytes[1] === 75;
            setTimeout(runStep, isGraphics ? 500 : 250);
        }
        runStep();
    }
    btnPrintTest.addEventListener('click', runSelfTest);

    function closeAllPanelsExcept(panel) {
        [guidePanel, controlsPanel, helpPanel, printModesPanel, operationsPanel].forEach(p => {
            if (p !== panel) p.classList.remove('open');
        });
        [guideTrigger, controlsTrigger, helpTrigger, printModesTrigger, operationsTrigger].forEach(t => {
            if (t.dataset.panel !== panel?.id) t.classList.remove('panel-open');
        });
    }

    function togglePanel(panel, trigger) {
        const isOpen = panel.classList.contains('open');
        closeAllPanelsExcept(isOpen ? null : panel);
        
        panel.classList.toggle('open', !isOpen);
        if (trigger) {
            trigger.classList.toggle('panel-open', !isOpen);
            const icon = trigger.querySelector('.toggle-icon');
            if (icon) {
                const isLeft = trigger.classList.contains('sidebar-tab-trigger-left');
                if (isLeft) {
                    icon.className = isOpen ? 'fa-solid fa-chevron-right toggle-icon' : 'fa-solid fa-chevron-left toggle-icon';
                } else {
                    icon.className = isOpen ? 'fa-solid fa-chevron-left toggle-icon' : 'fa-solid fa-chevron-right toggle-icon';
                }
            }
        }
    }

    guideTrigger.addEventListener('click', () => togglePanel(guidePanel, guideTrigger));
    btnCloseGuide.addEventListener('click', () => togglePanel(guidePanel, guideTrigger));

    controlsTrigger.addEventListener('click', () => togglePanel(controlsPanel, controlsTrigger));
    btnCloseControls.addEventListener('click', () => togglePanel(controlsPanel, controlsTrigger));

    helpTrigger.addEventListener('click', () => togglePanel(helpPanel, helpTrigger));
    btnCloseHelp.addEventListener('click', () => togglePanel(helpPanel, helpTrigger));

    printModesTrigger.addEventListener('click', () => togglePanel(printModesPanel, printModesTrigger));
    btnClosePrintModes.addEventListener('click', () => togglePanel(printModesPanel, printModesTrigger));

    operationsTrigger.addEventListener('click', () => togglePanel(operationsPanel, operationsTrigger));
    btnCloseOperations.addEventListener('click', () => togglePanel(operationsPanel, operationsTrigger));

    chkFocusMode.addEventListener('change', (e) => {
        if (e.target.checked) {
            document.body.classList.add('focus-mode');
            closeAllPanelsExcept(null);
            showToast('Focus Mode Enabled', 'fa-expand');
        } else {
            document.body.classList.remove('focus-mode');
            showToast('Focus Mode Disabled', 'fa-compress');
        }
    });

    document.querySelectorAll('.guide-card').forEach(card => {
        const header = card.querySelector('.guide-header');
        if (header) {
            header.addEventListener('click', () => {
                card.classList.toggle('collapsed');
            });
        }
    });

    function loadSettings() {
        const savedFormat = localStorage.getItem('efx_paperFormat') || 'correspondence';
        if (selectPaperFormat) selectPaperFormat.value = savedFormat;
        renderer.paperFormat = savedFormat;
        if (savedFormat === 'mini' || savedFormat === 'mini-bordered') {
            renderer.paperWidth = 816; // 8.5" paper
            renderer.pageLength = 672; // 7.0" page (42 lines, 14 holes)
            renderer.printableWidth = 768;
            renderer.leftMargin = 24;
        } else if (savedFormat === 'dp-12') {
            renderer.paperWidth = 912; // 9.5" paper
            renderer.pageLength = 1152; // 12.0" page (72 lines, 24 holes)
            renderer.printableWidth = 768;
            renderer.leftMargin = 72;
        } else if (savedFormat === 'legal-14') {
            renderer.paperWidth = 816; // 8.5" paper
            renderer.pageLength = 1344; // 14.0" page (84 lines, 28 holes)
            renderer.printableWidth = 768;
            renderer.leftMargin = 24;
        } else {
            renderer.paperWidth = 912; // 9.5" paper
            renderer.pageLength = 1056; // 11.0" page (66 lines, 22 holes)
            renderer.printableWidth = 768;
            renderer.leftMargin = 72;
        }

        const preset = localStorage.getItem('efx_paperPreset') || 'green-bar';
        selectPaperPreset.value = preset;
        renderer.setPaperPreset(preset);

        const savedRibbonColor = localStorage.getItem('efx_ribbonColor') || 'fresh-black';
        if (selectRibbonColor) selectRibbonColor.value = savedRibbonColor;
        renderer.setRibbonColor(savedRibbonColor);

        const wear = localStorage.getItem('efx_ribbonWear') || '0';
        sliderRibbonWear.value = wear;
        labelRibbonWear.textContent = `${wear}%`;
        renderer.setRibbonWear(wear);

        const age = localStorage.getItem('efx_paperAge') || '0';
        if (sliderPaperAge) {
            sliderPaperAge.value = age;
            if (labelPaperAge) labelPaperAge.textContent = `${age}%`;
        }
        renderer.setPaperAge(age);

        const jitter = localStorage.getItem('efx_jitter') || '0.0';
        sliderJitter.value = jitter;
        labelJitter.textContent = `${parseFloat(jitter).toFixed(1)}px`;
        renderer.setJitter(jitter);

        const dips = JSON.parse(localStorage.getItem('efx_dipSwitches') || '[false, false, false, false, false, false, false, false]');
        dipSwitches.forEach((sw, i) => {
            if (sw && dips[i] !== undefined) {
                sw.checked = dips[i];
            }
        });
        applyDipSwitchSettings();

        const savedRes = localStorage.getItem('efx_exportRes') || '2';
        if (selectExportRes) selectExportRes.value = savedRes;
        renderer.scaleFactor = parseInt(savedRes, 10);

        const autoScrollEnabled = localStorage.getItem('efx_autoScroll') !== 'false'; // default to true
        if (checkAutoScroll) checkAutoScroll.checked = autoScrollEnabled;

        const soundEnabled = localStorage.getItem('efx_soundEnabled') === 'true';
        if (checkSoundEnabled) checkSoundEnabled.checked = soundEnabled;
        soundSynth.enabled = soundEnabled;

        const creasesEnabled = localStorage.getItem('efx_paperCreases') === 'true';
        if (checkPaperCreases) checkPaperCreases.checked = creasesEnabled;
        if (paperRoll) {
            if (creasesEnabled) paperRoll.classList.add('has-creases');
            else paperRoll.classList.remove('has-creases');
        }

        const textureEnabled = localStorage.getItem('efx_paperTexture') === 'true';
        if (checkPaperTexture) checkPaperTexture.checked = textureEnabled;
        if (paperRoll) {
            if (textureEnabled) paperRoll.classList.add('has-texture');
            else paperRoll.classList.remove('has-texture');
        }

        // Load persisted Serial Port Settings
        if (selectFlowControl) {
            selectFlowControl.value = localStorage.getItem('efx_flowControl') || 'xonxoff';
        }
        if (selectBaudRate) {
            selectBaudRate.value = localStorage.getItem('efx_baudRate') || '9600';
        }
        if (selectDataBits) {
            selectDataBits.value = localStorage.getItem('efx_dataBits') || '8';
        }
        if (selectParity) {
            selectParity.value = localStorage.getItem('efx_parity') || 'none';
        }
        if (selectStopBits) {
            selectStopBits.value = localStorage.getItem('efx_stopBits') || '1';
        }
    }

    // Keyboard shortcuts for emulator actions
    window.addEventListener('keydown', (e) => {
        if (document.activeElement.tagName === 'INPUT' || 
            document.activeElement.tagName === 'SELECT' || 
            document.activeElement.tagName === 'TEXTAREA') {
            return;
        }

        if (e.key.toLowerCase() === 'w') {
            isWPressed = true;
        }

        switch (e.key.toLowerCase()) {
            case 's':
                e.preventDefault();
                if (btnDownloadPrint) btnDownloadPrint.click();
                break;
            case 'd':
                e.preventDefault();
                if (btnPrintTest) btnPrintTest.click();
                break;
            case 'c':
                e.preventDefault();
                if (btnCopyPrint) btnCopyPrint.click();
                break;
            case 'delete':
                e.preventDefault();
                if (btnClearRoll) btnClearRoll.click();
                break;
            case 't':
                e.preventDefault();
                if (btnTearOff) btnTearOff.click();
                break;
            case 'f':
                e.preventDefault();
                if (btnFeedPaper) btnFeedPaper.click();
                break;
            case 'm':
                e.preventDefault();
                if (btnTearMargins) btnTearMargins.click();
                break;
            case 'arrowup':
                e.preventDefault();
                if (paperRollContainer) {
                    const step = isWPressed ? 1 : 24;
                    paperRollContainer.scrollTop = Math.max(0, paperRollContainer.scrollTop - step);
                }
                break;
            case 'arrowdown':
                e.preventDefault();
                if (paperRollContainer) {
                    const step = isWPressed ? 1 : 24;
                    paperRollContainer.scrollTop = Math.min(
                        paperRollContainer.scrollHeight - paperRollContainer.clientHeight,
                        paperRollContainer.scrollTop + step
                    );
                }
                break;
        }
    });

    window.addEventListener('keyup', (e) => {
        if (e.key.toLowerCase() === 'w') {
            isWPressed = false;
        }
    });

    window.addEventListener('blur', () => {
        isWPressed = false;
    });

    loadSettings();
    updateActiveStyleUI();
});




