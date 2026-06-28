'use strict';

/**
 * HPGLMultiModeGenerator
 * ----------------------
 * A deterministic generator for structured HP-GL, HP-GL/2, and PCL 5 dual-context streams.
 */
class HPGLMultiModeGenerator {
    /**
     * @param {Object} [options]
     */
    constructor(options = {}) {
        this.reset();
    }

    /**
     * Resets the generator state.
     */
    reset() {
        this.buffer = '';
    }

    /**
     * Emits standard Printer Reset (EscE).
     * Establishes a baseline hardware environment.
     * @returns {string} EscE bytes
     */
    emitPrinterReset() {
        const bytes = '\x1BE';
        this.buffer += bytes;
        return bytes;
    }

    /**
     * Emits PCL picture frame dimensions in decipoints.
     * @param {number} width - Width in decipoints
     * @param {number} height - Height in decipoints
     * @returns {string} PCL escape sequences
     */
    emitPictureFrameDimensions(width, height) {
        const bytes = `\x1B*c${Math.round(width)}X\x1B*c${Math.round(height)}Y`;
        this.buffer += bytes;
        return bytes;
    }

    /**
     * Emits context switch: Enter Standalone HP-GL/2 (Esc%-1B).
     * Vector mode, ignores previous PCL font cursor position.
     * @returns {string} context switch escape
     */
    emitEnterStandaloneHPGL2() {
        const bytes = '\x1B%-1B';
        this.buffer += bytes;
        return bytes;
    }

    /**
     * Emits context switch: Enter Anchored HP-GL/2 (Esc%1B).
     * Vector mode, inherits current PCL carriage/font position.
     * @returns {string} context switch escape
     */
    emitEnterAnchoredHPGL2() {
        const bytes = '\x1B%1B';
        this.buffer += bytes;
        return bytes;
    }

    /**
     * Emits context switch: Return to Text/PCL Mode (Esc%0A).
     * @returns {string} context switch escape
     */
    emitReturnToPCL() {
        const bytes = '\x1B%0A';
        this.buffer += bytes;
        return bytes;
    }

    /**
     * Emits Universal Exit Language (UEL) (Esc%-12345X).
     * Stops PCL 5 execution and passes hardware control to PJL.
     * @returns {string} UEL escape sequence
     */
    emitUniversalExitLanguage() {
        const bytes = '\x1B%-12345X';
        this.buffer += bytes;
        return bytes;
    }

    /**
     * Emits a standard HP-GL/2 vector command mnemonic with parameters.
     * @param {string} mnemonic - Two-letter uppercase mnemonic (e.g., 'IN', 'SP', 'PA')
     * @param {Array<number>} [params=[]] - Numeric parameters
     * @returns {string} formatted command
     */
    emitHPGLCommand(mnemonic, params = []) {
        let cmd = mnemonic;
        if (params && params.length > 0) {
            cmd += params.join(',');
        }
        cmd += ';';
        this.buffer += cmd;
        return cmd;
    }

    /**
     * Emits a Legacy DCI Handshake/Device escape sequence (Esc. + code + params).
     * @param {string} code - Single character code ('(', 'I', 'O', 'R', 'S')
     * @param {Array<number>} [params=[]] - Numeric parameters
     * @returns {string} formatted DCI command
     */
    emitDCICommand(code, params = []) {
        let cmd = `\x1B.${code}`;
        if (params && params.length > 0) {
            cmd += params.join(',');
        }
        cmd += ';';
        this.buffer += cmd;
        return cmd;
    }

    /**
     * Helper to convert Decipoints to Plotter Units (PLU).
     */
    static decipointsToPLU(decipoints) {
        return decipoints * 1.41111111;
    }

    /**
     * Helper to convert Plotter Units (PLU) to Decipoints.
     */
    static pluToDecipoints(plu) {
        return plu / 1.41111111;
    }

    /**
     * Returns the accumulated buffer.
     * @returns {string}
     */
    getBuffer() {
        return this.buffer;
    }
}

if (typeof window !== 'undefined') {
    window.HPGLMultiModeGenerator = HPGLMultiModeGenerator;
}
if (typeof module !== 'undefined') {
    module.exports = HPGLMultiModeGenerator;
}
